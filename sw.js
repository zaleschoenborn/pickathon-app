// Pickathon service worker. Build 20261101-1050
const V='pk-20261105-3349',M='pkmedia-3',KEEP=["ssindex-b6158b1d.json"],SHELL=['./','index.html','data.json','focus.json','focus.js','manifest.json','icon-192.png','apple-touch-icon.png','fonts/pickathon-2014.ttf','farmmap/index.html?embed=1','farmmap/lab-phone.html?embed=1'];
const MP='pkmap-1';
const fl=new Map();/* one network request per URL at a time (icons are asked for twice by the page) */
const once=(k,f)=>{let p=fl.get(k);if(!p){p=f().finally(()=>fl.delete(k));fl.set(k,p)}return p.then(x=>x.clone())};
async function mapPack(tier){try{const p=await (await fetch('farmmap/pack.json',{cache:'no-store'})).json();const c=await caches.open(MP);const abs=u=>new URL(u,self.registration.scope).href;const want=new Set(p.core.concat(p.extra).map(abs));for(const q of await c.keys())if(!want.has(q.url)&&/[?&]v=/.test(q.url))await c.delete(q);const list=tier==='core'?p.core:p.extra;let i=0;const run=async()=>{while(i<list.length){const u=list[i++];const rq=new Request(abs(u));if(await c.match(rq))continue;try{const x=await fetch(rq);if(x.ok)await c.put(rq,x)}catch(e){}}};await Promise.all([run(),run(),run(),run()])}catch(e){}}
self.addEventListener('install',e=>{e.waitUntil(Promise.all([caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))),mapPack('core')]))});
let xtra=0;/* the big tier waits ~25s after the page asks, runs only while a page is visible, and only once per worker */
const idleExtra=()=>new Promise(r=>setTimeout(r,25000)).then(()=>self.clients.matchAll({type:'window'})).then(L=>{if(xtra||!L.some(w=>w.visibilityState==='visible'))return;xtra=1;return mapPack('extra')});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting();if(e.data==='pack'&&!xtra)e.waitUntil(idleExtra())});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>(x.startsWith('pk-')&&x!==V)||(x.startsWith('pkmedia')&&x!==M)).map(x=>caches.delete(x)))).then(()=>caches.open(M)).then(h=>h.keys().then(ks=>Promise.all(ks.filter(q=>{const p=new URL(q.url).pathname.split('/').pop();return /pack|ssindex/.test(p)&&KEEP.indexOf(p)<0}).map(q=>h.delete(q))))).then(()=>self.clients.claim()).then(()=>mapPack('core')))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open(M).then(h=>h.match(r).then(m=>m||fetch(r).then(x=>{h.put(r,x.clone());return x}))));return}if(u.origin!==location.origin)return;if(/\/sw\.js$/.test(u.pathname))return;
 if(/\/farmmap\/(t|l|h|ic)\/|\/farmmap\/map\.webp$/.test(u.pathname)){const hero=/\/farmmap\/h\//.test(u.pathname);const ver=/[?&]v=/.test(u.search);e.respondWith(caches.open(MP).then(c=>c.match(r).then(m=>{
  /* versioned (?v=) files never change under the same URL: a cache hit is final, no network */
  if(m&&(ver||!hero))return m;
  const net=once(r.url,()=>fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}));
  if(m){e.waitUntil(net.catch(()=>{}));return m}
  return net.catch(()=>new Response('',{status:504}))})));return}
 /* Rule: anything that changes (pages, data, the map page) always comes from the network when online; the saved copy is only for offline. Big files that never change (map tiles, photos, fonts) come from the cache. */
 const fresh=r.mode==='navigate'||/(\.html|data\.json|manifest\.json)$/.test(u.pathname)||u.pathname.endsWith('/');
 if(fresh){const net=fetch(r,{cache:'reload'}).then(x=>{const c=x.clone();e.waitUntil(caches.open(V).then(h=>h.put(r,c)));return x});e.respondWith(caches.match(r).then(m=>{if(!m)return net.catch(()=>caches.match('index.html'));return net.then(x=>x.ok?x:m).catch(()=>m)}));return}
 const media=/pack[\w-]*\.json$|ssindex|\/i\/|\/m\/|\/m\/|\/ss\/|\/fonts\//.test(u.pathname);
 e.respondWith(caches.match(r).then(m=>m||once(r.url,()=>fetch(r).then(x=>{if(x.ok){const c=x.clone();e.waitUntil(caches.open(media?M:V).then(h=>h.put(r,c)))}return x}))))});
