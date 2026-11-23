// Stylelist settings. Edit this file, save, and re-upload (or let your host redeploy).
window.CFG = {
  // Where the product catalog comes from. Keep 'products.csv' or paste a Google Sheets
  // "Publish to web" CSV link so you can update products without touching code.
  catalogUrl: 'products.csv',

  // Optional AI scan. Leave '' to read photos only on the user's phone (nothing is uploaded).
  // To turn it on: deploy on Cloudflare Pages (see README_FREE.md), set GEMINI_API_KEY there, then use '/api/ai'.
  aiUrl: '/api/ai',

  // Your affiliate IDs (leave '' until your accounts are approved).
  amazonTag: '',        // example: 'yourname-21'  (Amazon Associates India tracking ID)
  flipkartAffId: '',    // example: 'yourflipkartid' (verify the parameter in your Flipkart Affiliate dashboard)

  // Networks like Cuelinks or EarnKaro give you a link generator. Create one example link,
  // then replace the product URL in it with {eurl} (encoded URL) and your sub-id with {sid}.
  // Example shape (use YOUR generated link, not this one): 'https://NETWORK/?id=YOURID&subid={sid}&url={eurl}'
  templates: {
    myntra: '',
    meesho: '',
    flipkart: '',   // optional: use a network template instead of the direct affid
    amazon: ''      // optional: same for Amazon
  },

  // Optional free click log using a Google Form (see README step 5).
  clickForm: { action: '', store: '', product: '', sid: '' }
};

// Google login + cloud sync (optional). See README_LOGIN.md. Leave null to disable.
window.SL_FIREBASE = null;
// window.SL_FIREBASE = { apiKey:"", authDomain:"", projectId:"", appId:"" };
