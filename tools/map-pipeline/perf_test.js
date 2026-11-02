const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:430,height:800},deviceScaleFactor:3,hasTouch:true,isMobile:true});const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.addInitScript(()=>{window.__fr=[];window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(Math.round(e.duration)))).observe({entryTypes:['longtask']});
 let last=performance.now();(function f(t){window.__fr.push(t-last);last=t;requestAnimationFrame(f)})(last)});
const t0=Date.now();await p.goto('http://localhost:8767/farmmap/index.html?embed=1',{waitUntil:'load'});
const lcp=await p.evaluate(()=>new Promise(r=>{const i=document.getElementById('mapimg');const ok=()=>r(performance.now());if(i&&i.complete)ok();else i.onload=ok}));
console.log('map image ready ms',Math.round(lcp),'wall',Date.now()-t0);
await p.waitForTimeout(1500);await p.evaluate(()=>{window.__fr=[];window.__lt=[]});
// pinch-like zoom via wheel + drags
const st=await p.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
await p.mouse.move(st[0],st[1]);
for(let i=0;i<14;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(40)}
await p.waitForTimeout(800);
for(let i=0;i<30;i++){await p.mouse.move(st[0]-i*6,st[1]-i*4);await p.mouse.down();await p.mouse.move(st[0]-i*6-40,st[1]-i*4-30,{steps:6});await p.mouse.up()}
await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const f=window.__fr.slice(2).sort((a,b)=>a-b);const q=x=>f[Math.floor(f.length*x)];return {frames:f.length,p50:q(.5),p95:q(.95),p99:q(.99),max:f[f.length-1],over50:f.filter(x=>x>50).length,longtasks:window.__lt,imgs:document.querySelectorAll('#tiles img').length}});
console.log(JSON.stringify(r));await b.close()})();
