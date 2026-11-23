# Stylelist: Google login and cloud sync (setup, about 15 minutes, free tier)

What it does: a user signs in with Google once. Their profile, wardrobe, saved looks and taste scores are saved to their account and come back on any phone or browser after sign-in. Face and body photos are never uploaded.

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com and create a project (Spark plan is free).
2. Build > Authentication > Get started > Sign-in method > enable **Google**.
3. Build > Firestore Database > Create database (production mode, pick a region near India such as asia-south1).
4. Firestore > Rules: paste the contents of `firestore.rules` and publish.
5. Project settings > Your apps > add a **Web app**. Copy the config object.

## 2. Add the config
Open `config.js` (in `public/` for the Vercel package) and set:

    window.SL_FIREBASE = { apiKey:"...", authDomain:"YOUR-DOMAIN-OR-PROJECT.firebaseapp.com", projectId:"...", appId:"..." };

The Firebase web apiKey is not a secret. Security comes from the Firestore rules.

## 3. Authorize your domain
Authentication > Settings > Authorized domains: add the domain where the site is hosted (for example your-app.vercel.app).
Tip for phones: sign-in uses a redirect on mobile. It is most reliable when `authDomain` is your own site domain.

## 4. Privacy page
Edit `privacy.html` (a template, not legal advice), host it next to `index.html`, and have it reviewed. The sign-in box links to it and requires a tick before sign-in.

## 5. Test
Sign in on one phone, add a wardrobe item, open the site on another device, sign in, and confirm it appears. Use Menu > Delete my cloud data to test deletion.

## Notes
- If `config.js` is empty the sign-in box is hidden and the app works locally only.
- Free-tier limits are generous for early stage (Firestore 1 GiB, 50k reads and 20k writes per day). Sync writes are batched a couple of seconds after a change.
- To see how many users you have: Firebase console > Authentication > Users.
