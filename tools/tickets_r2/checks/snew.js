// Tickets round 3 test: logic sweep, tap flows, checkout payload, sold-out, screenshots. Stand-in feed only; pickathon.com is stubbed.
const pw=require(process.env.PW||'/opt/npm-tools/node_modules/playwright'), fs=require('fs'), path=require('path');
const REPO=require('path').resolve(__dirname,'../../..'), OUT=process.argv[2]||require('path').resolve(process.env.TK_OUT||'/tmp/tk_checks'), ONLY=process.argv[3]||'';
const IP=require(REPO+'/tests/lib/inpage'),serve=require(REPO+'/tests/lib/serve'),FONTS=require(REPO+'/tests/lib/fonts');
fs.mkdirSync(OUT,{recursive:true});
const FMS={'4D':54000,'3D':44500,'2D':37800,THU:13400,FRI:22300,SAT:24300,SUN:22300,PATRON:178000,T4D:27000,C4D:0,WED:6700,THUP:4000,FRIP:5450,SATP:5450,SUNP:5450,WP:10500,WPO:12500,WS:5000,WB:0,CCO:35000,CC:85000,RVO:85000,RVOP:20000,CVO:55000,CVOP:20000,CV:125000,RV:190000,FRID:12500,SATB:12500,SATH:12500,SATD:12500,SUNB:12500,NP1:4500,NP2:22300,PLATE:1700,CUP:1500,COOZIE:500};
const feed=(sold)=>JSON.stringify({event:{id:9},ticketTypes:Object.entries(FMS).map(([code,a],i)=>({id:1000+i,code,name:code,price:{amount:a},soldOut:(sold||[]).includes(code)}))});
const IDOF=Object.fromEntries(Object.keys(FMS).map((c,i)=>[c,String(1000+i)]));
const SIZES={p390:[390,844,1],p360:[360,740,1],p430:[430,932,1],tab:[820,1180,1],desk:[1440,900,0]};
const report=[]; const ok=(c,m)=>{report.push((c?'PASS ':'FAIL ')+m);};
(async()=>{const[srv,base]=await serve(REPO);const br=await pw.chromium.launch();
async function open(sz,opts={}){const[w,h,t]=SIZES[sz];const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!t,hasTouch:!!t,serviceWorkers:'block'});
 await ctx.addInitScript({content:'('+IP.initScript+')("tab")'});await ctx.addInitScript(()=>{try{sessionStorage.setItem('pk27g','1')}catch(e){}});await FONTS.route(ctx);
 const posts=[];await ctx.route(/pickathon\.com\/(tickets|checkout|pay)/,r=>{posts.push(r.request().postData()||'');r.fulfill({status:200,contentType:'text/html',body:'<h1>stub</h1>'});});
 await ctx.route(/wp-json\/pickathon\/v1\/sale/,r=>opts.saleOff?r.fulfill({status:404,body:'nope'}):r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({on:true})}));
await ctx.route(/fms\.pickathon\.com/,r=>r.fulfill({status:200,contentType:'application/json',body:feed(opts.sold),headers:{'access-control-allow-origin':'*'}}));
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message.slice(0,160)));
 await page.goto(base+(opts.hash||''),{waitUntil:'load',timeout:200000});
 await page.waitForTimeout(1500);
 if(opts.keep){await page.waitForFunction(()=>window.__pkTk2&&document.getElementById('tk-main'),null,{timeout:200000});
  await page.evaluate(()=>{const a=window.comp||window.__pkApp;a.setState({pvS:'sale',season:'off',today:'2026-11-19'});window.__pkTk2.refresh();});await page.waitForTimeout(1500);return {ctx,page,errs,posts};}
 await page.evaluate(IP.hook);
 await page.waitForFunction(()=>window.__app&&window.__app.state&&window.__app.state.data,null,{timeout:200000});
 await page.evaluate((k)=>{if(!k)try{localStorage.removeItem('pk27order')}catch(e){};const c=document.querySelector('[aria-label="Cookie choices"]');const d=c&&[...c.querySelectorAll('button')].find(b=>/decline/i.test(b.textContent));if(d)d.click();},!!opts.keep);
 await page.evaluate(IP.hook);
 if(opts.keep){await page.evaluate(()=>{window.__app.setState({pvS:'sale',season:'off',today:'2026-11-19'});if(window.__pkTk2)window.__pkTk2.refresh();});}
 else await page.evaluate(()=>{const A=window.__app;A.setState({pvS:'sale',season:'off',today:'2026-11-19'});A.reset('home');A.go('tickets',{});});
 await page.waitForFunction(()=>window.__pkTk2&&document.getElementById('tk-main'),null,{timeout:200000});await page.waitForTimeout(1200);
 return {ctx,page,errs,posts};}
const shot=(page,n,full)=>page.screenshot({path:path.join(OUT,n+'.jpg'),type:'jpeg',quality:70,fullPage:!!full});
const clk=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.scrollIntoView({block:'center'});e.click();return true;},sel);
const scrollTo=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'start'});},sel);

const clk2=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true;},sel);
{
 const {ctx,page,errs}=await open(process.env.SZ||'p390');
 await shot(page,'n1_entry');
 const vis=await page.evaluate(()=>{const m=document.querySelector('#tk-main');return {hidden:getComputedStyle(m).display, radios:document.querySelectorAll('.tk-in input[name=tk-pass]').length, entry:!!document.getElementById('tk-entry')}});
 ok(vis.hidden==='none'&&vis.entry,'old list hidden, entry shown '+JSON.stringify(vis));
 await page.evaluate(()=>{document.querySelector('[data-g="day"][data-d="dthu"]').click();document.querySelector('[data-act="e-next"]').click();});await page.waitForTimeout(300);await page.evaluate(()=>window.__pkTk2.closeSheet(true));await page.evaluate(()=>window.__pkTk2.clear());await page.evaluate(()=>window.__pkTk2.guide('days'));await page.waitForTimeout(500);
 ok(await page.evaluate(()=>!!document.querySelector('.tk-gscrim')),'I know what I want opens steps');
 await shot(page,'n2_days');
 // pick fri sat sun
 for(const d of ['dfri','dsat','dsun'])await clk2(page,`.tk-gscrim [data-g="day"][data-d="${d}"]`);
 await clk2(page,'.tk-gscrim [data-g="next"]');await page.waitForTimeout(300);await shot(page,'n2b_who');
 await clk2(page,'.tk-gscrim [data-g="next"]');await page.waitForTimeout(300);
 await shot(page,'n3_sleep');
 await clk2(page,'.tk-gscrim [data-g="next"]');await page.waitForTimeout(300);
 await shot(page,'n4_order');
 ok(await page.evaluate(()=>!!document.querySelector('[data-g="another"]')),'add different pass link');
 await clk2(page,'[data-g="another"]');await page.waitForTimeout(200);
 for(const d of ['dthu'])await clk2(page,`.tk-gscrim [data-g="day"][data-d="${d}"]`);
 await clk2(page,'.tk-gscrim [data-g="next"]');await page.waitForTimeout(200);
 await clk2(page,'.tk-gscrim [data-g="next"]');await clk2(page,'.tk-gscrim [data-g="next"]');await page.waitForTimeout(300);
 const rec=await page.evaluate(()=>window.__pkTk2.record());
 ok(rec.more&&rec.more.length===1,'mixed order kept '+JSON.stringify([rec.pass,rec.day,rec.more]));
 await shot(page,'n5_mixed');
 await clk2(page,'.tk-gscrim [data-g="fast"]');await page.waitForTimeout(300);
 await shot(page,'n6_bar');
 await clk2(page,'[data-act="sheet"]');await page.waitForTimeout(300);await shot(page,'n7_sheet');
 // add-ons only
 await page.evaluate(()=>window.__pkTk2.clear());
 await page.evaluate(()=>window.__pkTk2.jump('addons'));await page.waitForTimeout(400);
 await clk2(page,'.tk-gscrim [data-g="sleep"][data-v="wcar"]');await page.waitForTimeout(200);
 await shot(page,'n8_addons');
 await clk2(page,'.tk-gscrim [data-g="next"]');await page.waitForTimeout(300);await shot(page,'n9_addons_order');
 const r2=await page.evaluate(()=>window.__pkTk2.record());ok(r2.pass==='none'&&r2.sleep==='wcar','addons only '+r2.pass+r2.sleep);
 ok(errs.length===0,'no page errors '+errs.join('|'));
 await ctx.close();
}
console.log(report.join('\n'));await br.close();srv.close();})();
