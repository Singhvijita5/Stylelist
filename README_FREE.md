# Stylelist: free launch kit (₹0 cash) + affiliate earnings

Ye folder ek **static website/app** hai. Server, database ya paid AI ki zarurat nahi, isliye hosting free hai.
Photo sirf user ke phone par padhi jaati hai (kahin upload nahi hoti).

## Folder mein kya hai
- `index.html`   : poora app (scan, style, wardrobe, outfits, price compare)
- `config.js`    : aapke affiliate IDs, links ka template, click log (yahi file edit karni hai)
- `products.csv` : product catalog (abhi 29 sample products; isey apne real products se badlo)
- `Stylelist_Earnings_Tracker.xlsx` : mahine ki kamai ka hisaab

## Step 1: App ko free mein live karo (10 minute)
Folder ko apne computer par unzip karo, phir inme se koi ek:
- **Netlify Drop:** app.netlify.com/drop par poora folder drag-drop karo. Turant link milta hai (account se link ko apna bana lo).
- **Cloudflare Pages** (Direct Upload) ya **GitHub Pages**: dono free hain.
Link phone par kholkar dekho. Pehle ye step karo, kyunki kai affiliate programs approval ke liye live site maangte hain.

## Step 2: Free affiliate accounts banao (aapke naam se)
Apply karo: **Amazon Associates India**, **Flipkart Affiliate**, aur ek network jaise **Cuelinks ya EarnKaro** (Myntra, Meesho aadi ke liye). PAN aur bank account chahiye hoga. Approval mein din lag sakte hain, aur har program ki apni shartein hain; unhe padho.

## Step 3: IDs `config.js` mein daalo
- `amazonTag`: aapka Amazon tracking ID (jaise `naam-21`). App har Amazon link mein `tag=` apne aap jodta hai.
- `flipkartAffId`: aapka Flipkart affiliate ID. Link mein `affid` jodta hai. **Parameter ka naam apni Flipkart dashboard ke docs mein ek baar verify karo.**
- `templates.myntra` / `templates.meesho`: network ke Link Generator se **ek link banao**, phir uske andar product ka URL `{eurl}` se aur sub-id `{sid}` se badal do. Ye safest tareeka hai, kyunki har network ka format alag hota hai.
Save karke dobara upload karo.

## Step 4: Asli products daalo (`products.csv`)
Google Sheets mein CSV kholo, columns waise hi rakho:
- `name, category (t=top, b=bottom), department (w=women, m=men, u=gender-neutral), color (hex)`, `occasions` (office|casual|party|college), `shapes` (all ya pear|rect|...), `tones`, `styles`, `fit`
- `image_url`: product photo ka link
- Har store ke liye `price_<store>` aur `url_<store>` (khali chhodo agar wahan nahi bikta). **Link wohi daalo jo aap kisi aur ko bhejte, product page ka.**
Phir Sheets mein File > Share > **Publish to web > CSV** ka link `config.js` ke `catalogUrl` mein daalo. Ab Sheet badalne par app apne aap update hota hai.

**Dhyaan:** Amazon, Flipkart jaise programs images aur prices dikhane par shartein lagate hain (jaise price kitni baar update ho, kaun si image use ho sakti hai). Pehle unke affiliate rules padho. Jahan zaroori ho wahan official link/widget ya unka API use karo, aur "price badal sakta hai" wali line rakho (app mein hai).

**Sabse aasaan:** app mein khud "Add model photo" chip hai (demo model ke neeche). Apni photo daalo; wo us waqt ke chune options (shape, undertone, department, skin depth) ke tag ke saath aapke browser mein save ho jaati hai. Alag type ka model chahiye to pehle options badlo, phir doosri photo daalo. Ye sirf aapke browser mein rehti hain; sabhi users ko dikhane ke liye photos `models/` folder + `config.js` se daalni hongi.

## "Shopping right now?" feature (user-facing)
Fit screen par "Try an item" (camera) aur "Upload image" buttons hain. Store mein kisi bhi kapde par camera ghumao, ya kisi website/app ka screenshot upload karo: item user ki photo par lagta hai, rang unke undertone ke hisaab se parkha jaata hai, wardrobe ke saath match batata hai, aur 4 stores par search links ke saath catalog ke milte-julte items ka price compare dikhata hai. Free version mein item ki category aur naam user khud ek tap/likhkar tay karta hai (AI tagging ke liye server wala package chahiye).

## Step 5: Click log (free, optional)
1. Google Form banao, 3 short-answer sawal: Store, Product, Sub-ID.
2. Form mein ⋮ > "Get pre-filled link" > teeno mein kuch likho > link copy karo. Link mein `entry.123456=...` jaise teen ID dikhenge.
3. `config.js` mein `clickForm.action` = form ka link jisme `/viewform...` ki jagah `/formResponse` ho; `store`, `product`, `sid` mein teen `entry.XXXX` daalo.
Ab har Buy click Form ke Responses sheet mein aata hai. Usi ko tracker ke **Clicks** sheet mein jodo.

## Step 6: Kamai dekhna
Network/store dashboard se orders aur commission mahine mein ek baar `Stylelist_Earnings_Tracker.xlsx` ke **Orders** sheet mein paste karo. Summary, store-wise kamai aur profit apne aap bann jaate hain. Uske **Monthly email** sheet mein script hai jo har mahine ki 1 tareekh ko email bhejti hai.
Commission pehle Pending rehta hai, phir Confirmed, phir Paid. Payout par minimum limit hoti hai.

## Step 7: Users kaise laayein (free)
Reels/Shorts ("pear shape ke liye jeans under ₹1,500"), college aur hostel groups, WhatsApp/Telegram deal groups, creators se "apna undertone dhoondho" challenge, aur SEO pages ("wedding outfits under ₹5,000"). Har post mein app ka link.

## Kamai ka andaza (honest)
Affiliate se ek active user par lagbhag ₹5 per mahina ka andaza hai (blueprint ka assumption). Matlab 1,000 active users ≈ ₹5,000/mahina, 10,000 ≈ ₹50,000. Shuru mein mahino tak bahut kam hoga. Asli data apni dashboard se dekho.

## Is free version mein kya nahi hai
- **Photo se body shape sirf andaza hai** (phone par). AI scan nahi, kyunki wo paid key maangta hai. Shape user ek tap se chunta hai.
- Har baar app khulne par shuru se chalta hai, kuch save nahi hota.
- Login, wishlist sync, aur apna dashboard nahi. Kamai ka hisaab tracker se.
- Ye aapke links ke saath tested nahi hai (aapke accounts nahi hain); pehle 2-3 links khud khareedkar/click karke check karo ki dashboard mein dikhte hain.

## Optional: AI scan (free, Gemini) + app install

**Install as an app (no store, free):** after the site is live on https, users tap Menu > Settings > "Install the app" (Android Chrome), or on iPhone Safari: Share > Add to Home Screen. It then opens full screen like an app.

**AI scan (optional).** Without it the app reads photos only on the user's phone and nothing is uploaded. To turn on the AI reading:
1. Get a free key at aistudio.google.com ("Get API key"). No card needed.
2. Put this folder in a GitHub repo (the `functions` folder must be included). On Cloudflare Pages choose "Connect to Git" (free; Netlify Drop and Direct Upload do not run the `functions` folder).
3. In Cloudflare Pages > Settings > Variables and Secrets, add `GEMINI_API_KEY` as a **secret**. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash`; check Google's free model list).
4. In `config.js` set `aiUrl: '/api/ai'` and redeploy.

**Privacy warning.** On Google's free tier, Google may use what you send to improve its products (the paid tier does not). When `aiUrl` is on, the app's consent screen says so. If you do not want this, leave `aiUrl: ''`.
