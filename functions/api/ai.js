// Stylelist AI endpoint for Cloudflare Pages Functions (free). Calls Google Gemini.
// Set GEMINI_API_KEY in Pages > Settings > Environment variables (secret). Optional: GEMINI_MODEL.
const PROMPTS = {
  scan: `You are a fashion stylist assistant inside a shopping app. Look at the photo and estimate the person's body shape (pear, hourglass, rect, apple, or inv for inverted triangle) and skin undertone (w warm, c cool, n neutral). If only the face is visible, use the face for undertone and give a low confidence for shape. Be neutral and kind; never comment on weight or attractiveness. Never guess or mention the person's gender; describe shape only by proportions (shoulders, waist, hips), for any person. Reply with ONLY JSON: {"shape":"pear|hourglass|rect|apple|inv","tone":"w|c|n","confidence":0.0,"note":"one short friendly sentence about colors or cuts that suit them","clothes":[{"c":"t|b|d","n":"short name like Blue zip hoodie","y0":0.0,"y1":0.0}],"box":{"t":0.0,"b":0.0,"cx":0.0,"sy":0.0,"hy":0.0,"sw":0.0,"ww":0.0,"hw":0.0}}. For clothes, list up to 3 garments the person is wearing: c = t for top/jacket/shirt, b for pants/skirt/shorts, d for a dress or one-piece (then no t or b); n = short name with color; y0 and y1 = the vertical range of that garment on the photo as fractions 0-1 of image height (top edge to bottom hem). Omit clothes if you cannot see them. For box, only if the full body from head to feet is visible, give fractions between 0 and 1 of the image: t = y of top of head, b = y of feet/ground contact, cx = x of body center, sy = y of shoulder line (just below the chin/neck base), hy = y of hip line (widest hips), sw = shoulder width, ww = waist width at narrowest, hw = hip width (widths as fraction of image width, body only without arms hanging away). Otherwise omit box. If there is no person in the image reply {"shape":null,"tone":null}.`,
  item: `This photo shows one clothing item a person owns. Classify it: cat is "t" for tops (shirts, tees, kurtis, blouses, jackets) or "b" for bottoms (trousers, jeans, skirts) or "f" for footwear. Give a short name (max 4 words, like Blue denim jeans) and the main color as hex. Reply with ONLY JSON: {"cat":"t","name":"...","hex":"#rrggbb"}.`
};
PROMPTS.tips = `You are a friendly fashion stylist. Using the person and wardrobe below, write exactly 4 short styling tips (max 28 words each): which pieces to pair and why, what to avoid, and one item worth buying that fits their budget. Do not assume gender and never comment on weight or looks. Reply with ONLY JSON: {"tips":["...","...","...","..."]}`;
const hits = new Map(); // best-effort per-instance rate limit
const J = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return J({ error: 'Not allowed' }, 403);
  const ip = (request.headers.get('cf-connecting-ip') || 'x');
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  if (recent.length >= 30) return J({ error: 'Too many requests, try later' }, 429);
  recent.push(now); hits.set(ip, recent);

  let body; try { body = await request.json(); } catch (e) { return J({ error: 'Bad request' }, 400); }
  const { task, image, text } = body || {};
  if (task === 'tryon') return tryon(env, image, text, ip, now);
  const isTips = task === 'tips';
  if (!PROMPTS[task] || (isTips ? (typeof text !== 'string' || text.length > 4000) : (typeof image !== 'string' || image.length > 3000000)))
    return J({ error: 'Bad request' }, 400);
  if (!env.GEMINI_API_KEY) return J({ error: 'GEMINI_API_KEY is not set' }, 500);

  const parts = isTips
    ? [{ text: PROMPTS.tips + '\n\n' + text }]
    : [{ inline_data: { mime_type: 'image/jpeg', data: image } }, { text: PROMPTS[task] }];
  const payload = JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096, temperature: 0.2 } });
  const call = (model) => { const ac = new AbortController(); setTimeout(() => ac.abort(), 22000); return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'POST', headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' }, body: payload, signal: ac.signal
  }); };
  const tried = [];
  let last = null, okResp = null;
  try {
    // Try the configured model first, then safe fallbacks (model names change over time).
    const chain = [env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'].filter(Boolean);
    let list = [...new Set(chain)];
    for (let i = 0; i < list.length && i < 8; i++) {
      let r; try { r = await call(list[i]); } catch (e) { tried.push(list[i] + ':timeout'); last = { status: 504, msg: 'timeout' }; continue; }
      tried.push(list[i] + ':' + r.status);
      if (r.ok) { okResp = r; break; }
      let msg = ''; try { msg = ((await r.json()).error || {}).message || ''; } catch (e) {}
      last = { status: r.status, msg: msg.slice(0, 160) };
      if (![404, 429, 500, 503].includes(r.status)) break;
      // After the first pass of 404s, ask Google which models this key can use.
      if (i === list.length - 1 && r.status === 404 && list.length < 8) {
        try {
          const m = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } });
          const mj = await m.json();
          const ok = (mj.models || []).filter(x => (x.supportedGenerationMethods || []).includes('generateContent')).map(x => x.name.replace('models/', ''))
            .filter(n => /flash|hydrogen/i.test(n) && !/image|tts|live|audio|embed|thinking-exp/i.test(n) && !list.includes(n)).slice(0, 4);
          list = list.concat(ok);
        } catch (e) {}
      }
    }
    if (!okResp) return J({ error: 'AI error ' + ((last && last.status) || 'none'), detail: (last && last.msg) || '', tried }, 502);
    const j = await okResp.json();
    const out = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
    const mm = out.match(/[\{\[][\s\S]*[\}\]]/);
    if (!mm) { const c0 = (j.candidates && j.candidates[0]) || {}; return J({ _empty: true, finish: c0.finishReason || (j.promptFeedback && j.promptFeedback.blockReason) || '', parts: ((c0.content && c0.content.parts) || []).length, sample: out.slice(0, 120), tried }); }
    return J(JSON.parse(mm[0]));
  } catch (e) {
    return J({ error: 'AI call failed', tried }, 500);
  }
}

const thits = new Map();
async function tryon(env, image, text, ip, now) {
  if (typeof image !== 'string' || image.length > 3000000 || typeof text !== 'string' || text.length > 700) return J({ error: 'Bad request' }, 400);
  if (!env.GEMINI_API_KEY) return J({ error: 'GEMINI_API_KEY is not set' }, 500);
  const rec = (thits.get(ip) || []).filter(t => now - t < 3600e3);
  if (rec.length >= 8) return J({ error: 'Too many try-ons, try later' }, 429);
  rec.push(now); thits.set(ip, rec);
  const prompt = 'Edit this photo of a person: dress them in the clothing described below, replacing whatever they currently wear on those body parts. Keep the same face, hair, skin tone, body shape and size, pose, camera angle and the plain white background. The new clothes must fit their body exactly as real clothes would, with natural folds, not oversized or tiny. Do not change anything else. Output only the edited photo.\n\nClothing: ' + text;
  const tried = [];
  try {
    let names = [env.GEMINI_IMAGE_MODEL].filter(Boolean);
    try {
      const m = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } });
      const mj = await m.json();
      const found = (mj.models || []).filter(x => (x.supportedGenerationMethods || []).includes('generateContent')).map(x => x.name.replace('models/', '')).filter(n => /image/i.test(n) && !/imagen/i.test(n));
      found.sort((a, b) => (/flash/i.test(b) ? 1 : 0) - (/flash/i.test(a) ? 1 : 0));
      names = names.concat(found.filter(n => !names.includes(n)));
    } catch (e) {}
    if (!names.length) names = ['gemini-2.5-flash-image'];
    for (const n of names.slice(0, 3)) {
      const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 45000);
      let r; try {
        r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(n) + ':generateContent', {
          method: 'POST', headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' }, signal: ac.signal,
          body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: image } }, { text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } })
        });
      } catch (e) { tried.push(n + ':timeout'); continue; } finally { clearTimeout(to); }
      tried.push(n + ':' + r.status);
      if (!r.ok) continue;
      const j = await r.json();
      const ps = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      const im = ps.map(p => p.inlineData || p.inline_data).find(Boolean);
      if (im && im.data) return J({ image: 'data:' + (im.mimeType || im.mime_type || 'image/png') + ';base64,' + im.data, model: n });
      tried.push(n + ':noimage');
    }
    return J({ error: 'Try-on not available', tried }, 502);
  } catch (e) { return J({ error: 'Try-on failed', tried }, 502); }
}
