// Round 5: the "Pick your days" guide. Stand-in feed; pickathon.com stubbed; sale switch stubbed on/off.
const pw=require(process.env.PW||'/opt/npm-tools/node_modules/playwright'), fs=require('fs');
const REPO=require('path').resolve(__dirname,'../../..'), OUT=require('path').resolve(process.env.TK_OUT||'/tmp/tk_checks'); fs.mkdirSync(OUT,{recursive:true});
const IP=require(REPO+'/tests/lib/inpage'),serve=require(REPO+'/tests/lib/serve'),FONTS=require(REPO+'/tests/lib/fonts'),FMS=require('./fms_line.js');
const feed=JSON.stringify({event:{id:9},ticketTypes:Object.entries(FMS).map(([code,a],i)=>({id:1000+i,code,name:code,price:{amount:a},soldOut:false}))});
const IDOF=Object.fromEntries(Object.keys(FMS).map((c,i)=>[c,String(1000+i)]));
const report=[]; const ok=(c,m)=>report.push((c?'PASS ':'FAIL ')+m);
const SIZES={p390:[390,844,1],p360:[360,740,1],p430:[430,932,1],tab:[820,1180,1],desk:[1440,900,0]};
(async()=>{const[srv,base]=await serve(REPO);const br=await pw.chromium.launch();
 async function open(sz,o={}){const[w,h,t]=SIZES[sz];const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!t,hasTouch:!!t,serviceWorkers:'block'});
  /* Nov 15: the old list is hidden on the real page; tests still drive its inputs for the pricing logic */ await ctx.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='#tk2 .tk-main[hidden],#tk2 .tk-head[hidden]{display:block!important}';document.head.appendChild(st);});}); await ctx.addInitScript({content:'('+IP.initScript+')("tab")'});await FONTS.route(ctx);
  if(!o.seen) await ctx.addInitScript(()=>{try{sessionStorage.removeItem('pk27g')}catch(e){}});
  const posts=[];await ctx.route(/pickathon\.com\/(tickets|checkout|pay)/,r=>{posts.push(r.request().postData()||'');r.fulfill({status:200,contentType:'text/html',body:'<h1>stub</h1>'});});
  await ctx.route(/wp-json\/pickathon\/v1\/sale/,r=>o.saleOff?r.fulfill({status:404,body:'x'}):r.fulfill({status:200,contentType:'application/json',body:'{"on":true}'}));
  await ctx.route(/fms\.pickathon\.com/,r=>r.fulfill({status:200,contentType:'application/json',body:feed,headers:{'access-control-allow-origin':'*'}}));
  const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
  await pg.goto(base+(o.hash||'#/tickets'),{waitUntil:'load',timeout:200000}); await pg.waitForSelector('#tk2 #tk-passes',{timeout:150000}).catch(()=>{}); await pg.waitForTimeout(2500);
  return {ctx,pg,posts,errs};}
 const txt=(pg,s)=>pg.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():''},s);
 const shot=(pg,n)=>pg.screenshot({path:OUT+'/'+n+'.png'});
 // A: full flow, sale on, phone
 { const {ctx,pg,posts,errs}=await open('p390');
   ok(!!(await pg.$('#tk-entry .tk-e-hero'))&&!(await pg.$('.tk-gscrim')),'A first visit: the page opens on the photo, no pop-up'); await shot(pg,'p390-1-hero');
   const nb=await pg.$$eval('#tk-e-grid .tk-e-tile',b=>b.length), nd=await pg.$$eval('#tk-e-days .tk-g-day',b=>b.length); ok(nb===9&&nd===5&&!(await pg.$('.tk-e-hero .tk-g-btn')),'A the pass grid shows every option, the day picker sits in Help me choose ('+nb+' tiles, '+nd+' days)'); await pg.evaluate(()=>{const h=document.querySelector('#tk-e-help');if(h)h.open=true;}); 
   await pg.evaluate(()=>{document.querySelector('#tk-e-why').open=true;});
   await pg.waitForSelector('#tk-e-reel li',{timeout:8000}).catch(()=>{}); const rc=await pg.$$eval('#tk-e-reel li',l=>l.length), vids=await pg.$$eval('#tk-e-reel button[data-dc], #tk-e-reel .tk-ring',l=>l.length); ok(rc>6&&vids===0,'A the reel shows the full ranked list as photos only ('+rc+' cards, '+vids+' play buttons)');
   const first=await pg.$$eval('#tk-e-reel .tk-e-cap b',l=>l.slice(0,4).map(x=>x.textContent)); ok(first[0]==='Sturgill Simpson','A reel order matches the ranking: '+first.join(', '));
   await pg.evaluate(()=>{document.querySelector('#tk-e-why').open=false;}); await pg.waitForTimeout(300); await shot(pg,'p390-1b-proof-and-days');
   for(const d of ['dfri','dsat','dsun']) await pg.click('#tk-entry .tk-g-day[data-d="'+d+'"]');
   let s=await txt(pg,'#tk-entry .tk-g-one'); ok(/3-Day Pass/.test(s)&&/\$467\.25/.test(s),'A Fri+Sat+Sun names the 3-Day Pass: '+s.slice(0,70));
   await pg.click('#tk-entry .tk-g-nudge'); s=await txt(pg,'#tk-entry .tk-g-one'); ok(/4-Day Pass/.test(s)&&/\$567/.test(s),'A Add Thursday gives the 4-Day Pass');
   await pg.click('#tk-entry .tk-g-day[data-d="w"]'); s=await txt(pg,'#tk-entry .tk-g-one'); ok(/4-Day/.test(s)&&/Wednesday/.test(s),'A Wednesday keeps the 4-Day and says so');
   await pg.click('#tk-entry .tk-g-day[data-d="w"]'); await pg.click('#tk-entry .tk-g-day[data-d="dthu"]'); s=await txt(pg,'#tk-entry .tk-g-one'); ok(/3-Day/.test(s),'A back to 3-Day after untapping Wed and Thu');
   await pg.evaluate(()=>document.querySelector('#tk-e-days').scrollIntoView()); await pg.waitForTimeout(300); await shot(pg,'p390-2-days');
   await pg.click('#tk-e-next'); await pg.waitForTimeout(400);
   await pg.click('[data-g="step"][data-k="adult"][data-d="1"]'); await pg.click('[data-g="step"][data-k="kid"][data-d="1"]'); await pg.waitForTimeout(200);
   s=await txt(pg,'.tk-gscrim .tk-g-stub'); ok(/2 × 3-Day Pass/.test(s)&&/\$934\.50/.test(s)&&/Kid/.test(s),'A two adults and a kid: '+s.slice(0,110)); await shot(pg,'p390-3-who');
   await pg.click('.tk-g-foot .tk-g-btn'); await pg.waitForTimeout(400); await shot(pg,'p390-4-sleep');
   const cards=await pg.$$eval('.tk-g-card',c=>c.length); ok(cards>=2,'A sleep step shows camp cards ('+cards+')');
   await pg.click('.tk-g-pick[data-v="wcar"]').catch(()=>{}); await pg.waitForTimeout(300); await shot(pg,'p390-4b-carcamp');
   const sl=await pg.evaluate(()=>window.__pkTk2.record().sleep); ok(sl==='wcar','A car camping picked: '+sl);
   await pg.click('.tk-g-foot .tk-g-btn'); await pg.waitForTimeout(400);
   await pg.click('[data-g="step"][data-k="x-cfri"][data-d="1"]'); await pg.waitForTimeout(200); await shot(pg,'p390-5-order');
   const tot=await txt(pg,'.tk-g-tot'); const want=2*467.25+367.5+131.25; ok(tot.includes('$1,433.25')&&Math.abs(want-1433.25)<.001,'A total is passes + car site + dinner: '+tot);
   const btn=await txt(pg,'.tk-g-foot .tk-g-btn'); ok(/Checkout · \$1,433\.25/.test(btn),'A button reads '+btn);
   await pg.click('.tk-g-foot .tk-g-btn'); await pg.waitForTimeout(2500);
   const body=decodeURIComponent(posts[0]||''); const got={}; body.replace(/tickets\[(\d+)\]=(\d+)/g,(m,a,b)=>{got[a]=+b;});
   const exp={[IDOF['3D']]:2,[IDOF['CCO']]:1,[IDOF['FRID']]:1}; const kidId=IDOF['C4D'];
   const core=Object.keys(exp).every(k=>got[k]===exp[k]); ok(posts.length===1&&core,'A one checkout POST with the right tickets '+JSON.stringify(got));
   ok(errs.length===0,'A no script errors '+errs.slice(0,2).join('|')); await ctx.close(); }
 // B: the day logic
 { const {ctx,pg}=await open('p390',{seen:true});
   ok(!(await pg.$('.tk-gscrim')),'B no pop-up');
   const r=await pg.evaluate(()=>{const P=window.__pkTk2.guidePlan,o=(a)=>{const p=P(Object.fromEntries(a.map(d=>[d,true])));return p?p.k+(p.days?':'+p.days.join('+'):'')+' '+p.each:'null'};
     return {sat:o(['dsat']),satsun:o(['dsat','dsun']),frisat:o(['dfri','dsat']),thufrisat:o(['dthu','dfri','dsat']),thu:o(['dthu']),wed:o(['w']),thufri:o(['dthu','dfri']),all:o(['dthu','dfri','dsat','dsun']),none:o([]),pat:window.__pkTk2.guidePlan({},true).k}});
   ok(/^days:dsat /.test(r.sat),'B Sat alone is a day ticket '+r.sat); ok(/^d2 396.9/.test(r.satsun),'B Sat+Sun is the two-day ticket '+r.satsun);
   ok(/^p3 /.test(r.frisat),'B Fri+Sat: the 3-Day costs less than two day tickets '+r.frisat); ok(/^p4 /.test(r.thufrisat),'B Thu+Fri+Sat: the 4-Day costs less '+r.thufrisat);
   ok(/^days:dthu /.test(r.thu),'B Thu alone '+r.thu); ok(/^p4 /.test(r.wed),'B Wed means the 4-Day '+r.wed); ok(/^days:dthu\+dfri /.test(r.thufri),'B Thu+Fri is two day tickets '+r.thufri);
   ok(/^p4 567/.test(r.all),'B all four days '+r.all); ok(r.none==='null','B nothing tapped, nothing suggested'); ok(r.pat==='pat','B Patron');
   // two day tickets through the guide
   await pg.evaluate(()=>window.__pkTk2.guide('days')); await pg.waitForTimeout(300); await pg.click('.tk-gscrim .tk-g-day[data-d="dthu"]'); await pg.click('.tk-gscrim .tk-g-day[data-d="dfri"]'); await pg.click('.tk-g-foot .tk-g-btn'); await pg.waitForTimeout(300);
   const s=await txt(pg,'.tk-gscrim .tk-g-stub'); ok(/Thursday Ticket/.test(s)&&/Friday Ticket/.test(s)&&/\$374\.85/.test(s),'B Thu+Fri order has both day tickets: '+s.slice(0,120));
   await pg.click('.tk-g-foot .tk-g-btn'); await pg.waitForTimeout(300); const h2=await txt(pg,'.tk-g-pad h2'); ok(/Getting there/.test(h2),'B day tickets skip camping: '+h2); await shot(pg,'p390-4c-getting-there');
   await pg.click('.tk-gscrim [data-g="goway"][data-v="drive"]'); await pg.waitForTimeout(300); const pkl=await pg.evaluate(()=>window.__pkTk2.order().items.map(i=>i.id+':'+i.qty)); const chipT=await txt(pg,'.tk-gscrim [data-g="goway"][data-v="drive"]'); ok(pkl.includes('pthu:1')&&pkl.includes('pfri:1'),'B two day tickets park on both days: '+pkl.join(' ')+' | '+chipT); await pg.click('.tk-gscrim [data-g="goway"][data-v="later"]');
   // Patron
   await pg.click('.tk-g-back'); await pg.click('.tk-g-back'); await pg.waitForTimeout(200); await pg.click('.tk-gscrim [data-g="pat"]'); const ps=await txt(pg,'.tk-gscrim .tk-g-one'); ok(/Patron/.test(ps)&&/\$1,869/.test(ps),'B Patron on the days screen: '+ps.slice(0,60)); await shot(pg,'p390-2b-patron');
   await ctx.close(); }
 // C: sale switch off -> the coming-soon page (Zale, Nov 15: no date, no prices, no checkout)
 { const {ctx,pg,posts}=await open('p390',{saleOff:true}); await pg.waitForSelector('.tk-soon',{timeout:30000});
   const t=await pg.evaluate(()=>document.getElementById('tk2').innerText);
   ok(!(await pg.$('#tk-main')),'C switch off: no order builder on the page');
   ok(!/\$\d/.test(t),'C switch off: no prices shown');
   ok(!/Nov(ember)? 19|10 am/i.test(t),'C switch off: no sale date or time shown');
   ok(!!(await pg.$('#tk-sa0-f'))&&!!(await pg.$('#tk-sa1-f')),'C switch off: Remind me at top and bottom');
   await pg.evaluate(()=>{try{window.__pkTk2.addPass&&window.__pkTk2.addPass('p3')}catch(e){} try{window.__pkTk2.checkout&&window.__pkTk2.checkout()}catch(e){}}); await pg.waitForTimeout(1500);
   ok(posts.length===0,'C switch off: nothing sent to checkout'); await shot(pg,'p390-5b-coming-soon'); await ctx.close(); }
 // D: deep link skips the guide; other sizes
 { const {ctx,pg}=await open('p390',{hash:'#tickets/camping'}); await pg.waitForTimeout(1500); const dl=await pg.evaluate(()=>{const b=document.querySelector('.tk-gscrim .tk-sheet');return b?b.getAttribute('data-step'):''}); ok(!!(await pg.$('#tk-entry'))&&dl==='sleep','D a deep link keeps the entry page and opens the steps at Sleep (got '+dl+')'); await ctx.close(); }
 for(const sz of ['p360','p430','tab','desk']){ const {ctx,pg,errs}=await open(sz); await pg.waitForSelector('#tk-e-reel li',{timeout:8000}).catch(()=>{}); await shot(pg,sz+'-1-hero');
   const fit=await pg.evaluate(()=>{const b=document.querySelector('#tk-e-grid .tk-e-tile'),h=document.querySelector('.tk-e-hero h1');const r=b.getBoundingClientRect(),hr=h.getBoundingClientRect();const tab=document.querySelector('nav[aria-label*="rimary"], .pk-tabbar, #pk-tabs');const lim=innerHeight-(tab&&tab.getBoundingClientRect().top>innerHeight/2?innerHeight-tab.getBoundingClientRect().top:0);return {btnIn:r.bottom<=lim&&r.top>0,bottom:Math.round(r.bottom),lim:Math.round(lim),h:Math.round(r.height),hw:hr.right<=innerWidth+1}});
   ok(fit.btnIn&&fit.hw,sz+' first pass tile and headline fit the first screen '+JSON.stringify(fit));
   await pg.evaluate(()=>{document.querySelector('#tk-e-why').open=true;document.querySelector('#tk-e-proof').scrollIntoView();}); await pg.waitForTimeout(400); await shot(pg,sz+'-2-proof');
   await pg.evaluate(()=>{const h=document.querySelector('#tk-e-help');if(h)h.open=true;}); for(const d of ['dfri','dsat','dsun']) await pg.click('#tk-entry .tk-g-day[data-d="'+d+'"]'); await pg.evaluate(()=>document.querySelector('#tk-e-days').scrollIntoView()); await pg.waitForTimeout(300); await shot(pg,sz+'-3-days');
   const tap=await pg.$$eval('#tk-entry button',bs=>bs.filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&(r.height<43.5||r.width<43.5)}).map(b=>b.textContent.trim().slice(0,20)+' '+Math.round(b.getBoundingClientRect().width)+'x'+Math.round(b.getBoundingClientRect().height)));
   ok(tap.length===0,sz+' every tap target is 44px or more '+tap.join(', '));
   const ov=await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1); ok(!ov,sz+' no sideways page scroll');
   ok(errs.length===0,sz+' no script errors '+errs.slice(0,1).join('')); await ctx.close(); }
 await br.close(); srv.close(); console.log(report.join('\n')); console.log('PASS',report.filter(x=>x.startsWith('PASS')).length,'FAIL',report.filter(x=>x.startsWith('FAIL')).length);
})().catch(e=>{console.log(report.join('\n'));console.error('ERR',e);process.exit(1)});
