// Pickathon service worker. Build 20261030-200533
const V='pk-20261030-200533',M='pkmedia-2',KEEP=["ssindex-b6158b1d.json"],SHELL=['./','index.html','data.json','manifest.json','icon-192.png','apple-touch-icon.png','fonts/pickathon-2014.ttf'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>(x.startsWith('pk-')&&x!==V)||(x.startsWith('pkmedia')&&x!==M)).map(x=>caches.delete(x)))).then(()=>caches.open(M)).then(h=>h.keys().then(ks=>Promise.all(ks.filter(q=>{const p=new URL(q.url).pathname.split('/').pop();return /pack|ssindex/.test(p)&&KEEP.indexOf(p)<0}).map(q=>h.delete(q))))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open(M).then(h=>h.match(r).then(m=>m||fetch(r).then(x=>{h.put(r,x.clone());return x}))));return}if(u.origin!==location.origin)return;
 const fresh=r.mode==='navigate'||/(index\.html|data\.json|manifest\.json)$/.test(u.pathname)||u.pathname.endsWith('/');
 if(fresh){const net=fetch(r,{cache:'reload'}).then(x=>{const c=x.clone();e.waitUntil(caches.open(V).then(h=>h.put(r,c)));return x});e.respondWith(caches.match(r).then(m=>{if(!m)return net.catch(()=>caches.match('index.html'));return Promise.race([net,new Promise(res=>setTimeout(()=>res(m),3000))]).catch(()=>m)}));return}
 const media=/pack[\w-]*\.json$|ssindex|\/i\/|\/ss\/|\/fonts\//.test(u.pathname);
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok){const c=x.clone();e.waitUntil(caches.open(media?M:V).then(h=>h.put(r,c)))}return x})))});
