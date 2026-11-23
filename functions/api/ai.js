// Stylelist AI endpoint for Cloudflare Pages Functions (free). Calls Google Gemini.
// Set GEMINI_API_KEY in Pages > Settings > Environment variables (secret). Optional: GEMINI_MODEL.
const PROMPTS = {
  scan: `You are a fashion stylist assistant inside a shopping app. Look at the photo and estimate the person's body shape (pear, hourglass, rect, apple, or inv for inverted triangle) and skin undertone (w warm, c cool, n neutral). If only the face is visible, use the face for undertone and give a low confidence for shape. Be neutral and kind; never comment on weight or attractiveness. Never guess or mention the person's gender; describe shape only by proportions (shoulders, waist, hips), for any person. Reply with ONLY JSON: {"shape":"pear|hourglass|rect|apple|inv","tone":"w|c|n","confidence":0.0,"note":"one short friendly sentence about colors or cuts that suit them"}. If there is no person in the image reply {"shape":null,"tone":null}.`,
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
  const isTips = task === 'tips';
  if (!PROMPTS[task] || (isTips ? (typeof text !== 'string' || text.length > 4000) : (typeof image !== 'string' || image.length > 3000000)))
    return J({ error: 'Bad request' }, 400);
  if (!env.GEMINI_API_KEY) return J({ error: 'GEMINI_API_KEY is not set' }, 500);

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const parts = isTips
    ? [{ text: PROMPTS.tips + '\n\n' + text }]
    : [{ inline_data: { mime_type: 'image/jpeg', data: image } }, { text: PROMPTS[task] }];
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 600, temperature: 0.2 } })
    });
    if (!r.ok) return J({ error: 'AI error ' + r.status }, 502);
    const j = await r.json();
    const out = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
    const m = out.match(/[\{\[][\s\S]*[\}\]]/);
    return J(m ? JSON.parse(m[0]) : {});
  } catch (e) {
    return J({ error: 'AI call failed' }, 500);
  }
}
