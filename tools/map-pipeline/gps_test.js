const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:430,height:850},deviceScaleFactor:2,permissions:['geolocation'],geolocation:{latitude:45.4361,longitude:-122.4510,accuracy:5}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8767/farmmap/index.html?calibrate=1');await p.waitForTimeout(2500);
// 3 fake points: moving 100 m east = +60px x ; 100 m north = -60px y (pretend)
const pts=[[45.4361,-122.4510,600,1000],[45.4361,-122.4497,780,1000],[45.4370,-122.4510,600,820],[45.4352,-122.4500,720,1170]];
for(const [la,lo,x,y] of pts){await ctx.setGeolocation({latitude:la,longitude:lo,accuracy:5});await p.waitForTimeout(700);
 await p.evaluate(([x,y])=>{const r=document.getElementById('stage').getBoundingClientRect();const cx=r.left+tx+x*k,cy=r.top+ty+y*k;document.getElementById('stage').dispatchEvent(new MouseEvent('click',{clientX:cx,clientY:cy,bubbles:true}))},[x,y]);
 await p.click('button:has-text("Save point")')}
const g=await p.evaluate(()=>document.querySelector('div[style*="max-height: 55vh"]').innerText);console.log(g.replace(/\n/g,' | '));
await p.click('button:has-text("Apply on this phone")');
const geo=await p.evaluate(()=>localStorage.getItem('pk-geo'));console.log(geo);
// normal mode
await ctx.setGeolocation({latitude:45.4361,longitude:-122.4503,accuracy:6});
await p.goto('http://localhost:8767/farmmap/index.html');await p.waitForTimeout(2500);
await p.click('button[aria-label="Show where I am"]');await p.waitForTimeout(1500);
await p.screenshot({path:'/tmp/bk/gps.png'});console.log('errs',errs.slice(0,3));await b.close()})();
