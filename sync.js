/* Stylelist cloud sync: Google sign-in + Firestore. Active only when config.js defines window.SL_FIREBASE.
   Stores: style profile, wardrobe pieces (small thumbnails), saved looks, taste scores, preferences.
   Never stores the face/body photo (it stays on the device). */
(function(){
const cfg=window.SL_FIREBASE;
if(!cfg||!cfg.apiKey||!window.firebase){window.SLSYNC={on:false,card:()=>''};return}
firebase.initializeApp(cfg);
const auth=firebase.auth(),db=firebase.firestore();
let user=null,agree=false,lastSig='',timer=null,lastSync=0,err='';
const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const doc=()=>db.collection('users').doc(user.uid);
const ready=()=>RESTORED||['fit','ward','sty'].includes(V);
const strip=w=>{const o=Object.assign({},w);delete o.cut;return o};
const pack=()=>{let w=W.map(strip);while(JSON.stringify(w).length>600000){let bi=-1,bl=3000;w.forEach((x,i)=>{if(x.img&&x.img.startsWith('data:image')&&x.img.length>bl){bl=x.img.length;bi=i}});if(bi<0)break;w[bi]=Object.assign({},w[bi],{img:''})}return{v:1,p:P,w:JSON.stringify(w),sv:JSON.stringify(SV),ts:JSON.stringify(TS),open:OPEN,t:Date.now()}};
const sigNow=()=>JSON.stringify([P,W.map(w=>w.id+w.n+w.c+w.hex+(w.bought||'')),SV,TS,OPEN]);
const key=w=>(w.srcId||'')+'|'+w.n+'|'+w.c+'|'+w.hex;
function apply(d){
  const cw=JSON.parse(d.w||'[]'),cs=JSON.parse(d.sv||'[]'),ct=JSON.parse(d.ts||'null');
  const seen=new Set(cw.map(key));const merged=cw.concat(W.filter(w=>!seen.has(key(w))));
  let n=0;merged.forEach(w=>{w.id='w'+(++n);if(!w.img)w.img=svgUrl(gi(w))});
  W=merged;WN=n;
  const ss=new Set(cs.map(x=>JSON.stringify(x)));SV=cs.concat(SV.filter(x=>!ss.has(JSON.stringify(x))));
  if(ct&&(!TS||(ct.n||0)>=(TS.n||0)))TS=ct;
  if(d.p&&d.p.sh)P=Object.assign(P,d.p);
  if(d.open)OPEN=d.open;
  ls.s('sl_w',W.map(strip));ls.s('sl_sv',SV);ls.s('sl_taste',TS);ls.s('sl_p',P);ls.s('sl_open',OPEN);
  if(P.sh&&P.tn){try{reset();V='fit'}catch(e){}}
  WSIG='';PSIG='';
}
async function push(){if(!user||!ready())return;try{await doc().set(pack());lastSync=Date.now();lastSig=sigNow();err=''}catch(e){err='Could not sync. Will retry.'}draw()}
async function pull(){try{const s=await doc().get();if(s.exists){apply(s.data())}lastSig='';await push();}catch(e){err='Could not load your saved data.';draw()}}
auth.onAuthStateChanged(async u=>{user=u;if(u){toast('Signed in as '+(u.displayName||u.email));await pull()}else draw()});
auth.getRedirectResult().catch(e=>{err='Sign-in failed: '+(e.code||e.message);draw()});
setInterval(()=>{if(!user||!ready())return;const s=sigNow();if(s!==lastSig){clearTimeout(timer);timer=setTimeout(push,1500)}},4000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user)pull()});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='gc')agree=e.target.checked});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='gin'){e.stopImmediatePropagation();if(!agree){toast('Please tick the agreement first');return}
    const pr=new firebase.auth.GoogleAuthProvider();
    try{await auth.signInWithPopup(pr)}catch(x){if(x.code==='auth/popup-blocked'||x.code==='auth/operation-not-supported-in-this-environment'){try{await auth.signInWithRedirect(pr);return}catch(y){x=y}}if(x.code!=='auth/popup-closed-by-user'&&x.code!=='auth/cancelled-popup-request'){err='Sign-in failed: '+(x.code||x.message);draw()}}}
  else if(a==='gout'){e.stopImmediatePropagation();await push();await auth.signOut();toast('Signed out');}
  else if(a==='gdel'){e.stopImmediatePropagation();if(!confirm('Delete your cloud data and account? Data on this phone stays until you clear it.'))return;
    try{await doc().delete();try{await user.delete()}catch(_){await auth.signOut()}toast('Your cloud data was deleted')}catch(x){toast('Could not delete. Try again.')}}
},true);
window.SLSYNC={on:true,card(mini){
  if(user)return`<div class="card"><b>Signed in</b><br><span class="m">${esc(user.email||'')}${lastSync?' · saved '+new Date(lastSync).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):''}</span>${err?`<p class="m" style="color:#C5221A">${esc(err)}</p>`:''}<p class="m">Your profile, wardrobe and saved looks are backed up and come back on any phone when you sign in. Your face and body photo are never uploaded.</p><button class="btn s" data-a="gout">Sign out</button><button class="btn l" data-a="gdel">Delete my cloud data</button></div>`;
  return`<div class="card"><b>${mini?'Already a member? Restore your data':'Save your profile'}</b><p class="m">Sign in with Google to keep your profile, wardrobe and saved looks safe and get them back on any phone. We store your style choices and wardrobe pieces. We never upload your face or body photo.</p>${err?`<p class="m" style="color:#C5221A">${esc(err)}</p>`:''}<label class="row m" style="gap:10px;align-items:flex-start"><input type="checkbox" id="gc" ${agree?'checked':''} style="width:22px;height:22px;flex:none;margin-top:2px"><span>I agree to the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a> and to saving this data to my account.</span></label><button class="btn" data-a="gin">Continue with Google</button></div>`}};
draw();
})();
