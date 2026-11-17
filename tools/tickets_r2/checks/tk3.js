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
 /* Nov 15: the old list is hidden on the real page; tests still drive its inputs for the pricing logic */ await ctx.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='#tk2 .tk-main[hidden],#tk2 .tk-head[hidden]{display:block!important}';document.head.appendChild(st);});}); await ctx.addInitScript({content:'('+IP.initScript+')("tab")'});await ctx.addInitScript(()=>{try{sessionStorage.setItem('pk27g','1')}catch(e){}});await FONTS.route(ctx);
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

// ---------- 1. logic sweep ----------
if(!ONLY||ONLY.includes('logic')){
const {ctx,page,errs}=await open('p390');
const r=await page.evaluate(()=>{const T=window.__pkTk2,bad=[];let n=0,rnd=s=>{let x=Math.sin(s)*1e4;return x-Math.floor(x)};
 const P=['p4','p3','d2','d1','pat','none',null],D=['dthu','dfri','dsat','dsun'],SL=['tent','wcar','scar','wvan','svan','wrv','srv','none'],GO=['later','drive','shuttle','bike','drop'],X=['cfri','csatb','csath','csatd','csunb','plate','cup','coozie','tools','student'];
 const pick=(a,s)=>a[Math.floor(rnd(s)*a.length)];
 for(let i=1;i<=4000;i++){const s=i*7.13;const more=[];const ng=Math.floor(rnd(s+1)*3);for(let g=0;g<ng;g++)more.push({pass:pick(['p4','p3','d2','d1','pat'],s+10+g),day:pick(D,s+20+g),adult:Math.floor(rnd(s+30+g)*4),teen:Math.floor(rnd(s+40+g)*3),kid:Math.floor(rnd(s+50+g)*3),wed:rnd(s+60+g)>.5});
  const x={};X.forEach((id,j)=>{if(rnd(s+70+j)>.7)x[id]=1+Math.floor(rnd(s+80+j)*3)});
  const o={pass:pick(P,s+2),day:pick(D,s+3),adult:Math.floor(rnd(s+4)*5),teen:Math.floor(rnd(s+5)*3),kid:Math.floor(rnd(s+6)*3),wed:rnd(s+7)>.5,sleep:pick(SL,s+8),go:pick(GO,s+9),car:1+Math.floor(rnd(s+11)*3),sites:1+Math.floor(rnd(s+12)*3),pwr:rnd(s+13)>.5,pday:pick(['','dsat','dfri'],s+14),dp:rnd(s+15)>.5,big:rnd(s+16)>.7,more,x};
  T.set(o);n++;const ord=T.order(),rec=T.record();
  let sum=0;ord.items.forEach(it=>{const w=window.pkWithFee?window.pkWithFee(it.unit):Math.round(it.unit*1.05*100)/100;sum+=it.qty*w;if(!(it.qty>0)||!Number.isInteger(it.qty)||isNaN(it.unit))bad.push(['item',JSON.stringify(it)]);if(!it.code)bad.push(['nocode',it.id]);});
  if(Math.abs(sum-ord.totalNum)>0.05)bad.push(['total',ord.totalNum,sum,JSON.stringify(rec)]);
  if(isNaN(ord.totalNum))bad.push(['nan']);
  const ids=ord.items.map(i=>i.id),cov=[0,0,0,0,0];
  const gs=(rec.more||[]).concat(rec.pass&&rec.pass!=='none'&&(rec.pass!=='d1'||rec.day)&&rec.adult>0?[rec]:[]);
  const strip=g=>g.pass==='p4'?[g.wed,1,1,1,1]:g.pass==='p3'?[0,0,1,1,1]:g.pass==='d2'?[0,0,0,1,1]:g.pass==='d1'?['w','dthu','dfri','dsat','dsun'].map(d=>d===g.day):g.pass==='pat'?[1,1,1,1,1]:[0,0,0,0,0];
  gs.forEach(g=>strip(g).forEach((v,k)=>{if(v)cov[k]=1}));if(rec.pass==='none')cov.fill(1);
  const MD={cfri:2,csatb:3,csath:3,csatd:3,csunb:4};Object.keys(MD).forEach(m=>{if(ids.includes(m)&&!cov[MD[m]])bad.push(['meal-not-covered',m,JSON.stringify(rec)])});
  const camp=rec.pass==='none'||gs.some(g=>['p4','p3','pat'].includes(g.pass));
  if(['wcar','scar','wvan','svan','wrv','srv'].some(v=>ids.includes(v))&&!camp)bad.push(['veh-no-camp',JSON.stringify(rec)]);
  if((ids.includes('wvanp')&&!ids.includes('wvan'))||(ids.includes('wrvp')&&!ids.includes('wrv')))bad.push(['pwr-alone']);
  if(ids.includes('early')&&!gs.some(g=>g.pass==='p4'&&g.wed))bad.push(['wed']);
  if(ids.includes('teen')&&!gs.some(g=>['p4','p3'].includes(g.pass)&&g.teen))bad.push(['teen']);
  const payer=gs.length>0||(rec.pass==='none'&&ord.items.some(i=>i.unit>0));const curBad=rec.pass&&rec.pass!=='none'&&!((rec.pass!=='d1'||rec.day)&&rec.adult>0);
  if(ord.ready&&(!payer||curBad))bad.push(['ready-wrong',JSON.stringify(rec)]);
  if(!ord.ready&&payer&&!curBad&&ord.items.length&&ord.round)bad.push(['not-ready',JSON.stringify(rec)]);
  const pat=gs.filter(g=>g.pass==='pat');if(pat.some(g=>g.teen||g.kid))bad.push(['pat-kids']);
 }
 const c={};bad.forEach(b=>c[b[0]]=(c[b[0]]||0)+1);return {n,cat:c,sample:bad.slice(0,5)};});
ok(Object.keys(r.cat).length===0,'logic sweep '+r.n+' random mixed orders '+JSON.stringify(r.cat)+(r.sample.length?' '+JSON.stringify(r.sample).slice(0,600):''));
ok(!errs.length,'no script errors (logic) '+errs.join(' | '));
await ctx.close();}

// ---------- 2. tap flows + checkout payload ----------
if(!ONLY||ONLY.includes('flow')){
const {ctx,page,errs,posts}=await open('p390');
await shot(page,'p390-01-top');
await clk(page,'#tk2 input[name="tk-pass"][value="p4"]');await clk(page,'#tk2 .tk-step[data-k="adult"] button[data-step="1"]');
await clk(page,'#tk2 .tk-step[data-k="teen"] button[data-step="1"]');await clk(page,'#tk-wedc');
const mp=await page.evaluate(()=>!document.getElementById('tk-morep').hidden);ok(mp,'"Add a different pass" shows once a pass has someone on it');
await scrollTo(page,'#tk-morep');await shot(page,'p390-02-addrow');
await clk(page,'#tk2 [data-act="addpass"]');await page.waitForTimeout(500);
const g1=await page.evaluate(()=>({more:window.__pkTk2.record().more,pass:window.__pkTk2.record().pass,grps:!document.getElementById('tk-grps').hidden}));
ok(g1.more.length===1&&g1.more[0].pass==='p4'&&g1.more[0].adult===2&&g1.more[0].teen===1&&g1.more[0].wed&&g1.pass===null&&g1.grps,'add pass: 2 adults + 1 teen 4-Day with Wed move into the order, cards free '+JSON.stringify(g1));
await shot(page,'p390-03-grouped');
await clk(page,'#tk2 input[name="tk-pass"][value="d1"]');await clk(page,'#tk2 input[name="tk-day"][value="dsat"]');
await clk(page,'#tk2 input[name="tk-sleep"][value="wcar"]');await clk(page,'#tk2 .tk-step[data-k="sites"] button[data-step="1"]');
await page.evaluate(()=>{document.getElementById('tk-x-meals').open=true});
await clk(page,'#tk2 .tk-step[data-k="x-cfri"] button[data-step="1"]');await clk(page,'#tk2 .tk-step[data-k="x-cfri"] button[data-step="1"]');
await clk(page,'#tk2 .tk-step[data-k="x-csatd"] button[data-step="1"]');
await page.evaluate(()=>{document.getElementById('tk-x-dish').open=true});await clk(page,'#tk2 .tk-step[data-k="x-cup"] button[data-step="1"]');
await scrollTo(page,'#tk-x-meals');await shot(page,'p390-04-meals');
const o=await page.evaluate(()=>window.__pkTk2.order());
ok(o.ready,'mixed order ready'); report.push('     order: '+o.lines.map(l=>l.label+' '+l.price).join(' | ')+' | total '+o.totalS);
await scrollTo(page,'#tk-s-sleep');await shot(page,'p390-05-camping');
// sold-out-free: thursday meal check none; Friday dinner covered by 4-Day
await clk(page,'#tk-bargo');await page.waitForTimeout(2500);
const body=decodeURIComponent((posts[0]||'')).split('&').filter(Boolean);
const got={};body.forEach(p=>{const m=/tickets\[(\d+)\]=(\d+)/.exec(p);if(m)got[m[1]]=+m[2];});
const want={[IDOF['4D']]:2,[IDOF.T4D]:1,[IDOF.WED]:3,[IDOF.SAT]:1,[IDOF.CCO]:2,[IDOF.FRID]:2,[IDOF.SATD]:1,[IDOF.CUP]:1};
ok(JSON.stringify(Object.keys(got).sort())===JSON.stringify(Object.keys(want).sort())&&Object.keys(want).every(k=>got[k]===want[k]),'checkout payload: one POST, every line with its ticket-system id and quantity '+JSON.stringify(got)+' want '+JSON.stringify(want));
ok(posts.length===1,'exactly one checkout POST ('+posts.length+')');
ok(!errs.length,'no script errors (flow) '+errs.join(' | '));
await ctx.close();
// add-ons only, via deep link
const B=await open('p390',{hash:'#tickets/addons',keep:1});await B.page.waitForTimeout(1500);
const st=await B.page.evaluate(()=>window.__pkTk2.record().pass);ok(st==='none','deep link #tickets/addons picks Add-ons only ('+st+')');
const oc=await B.page.evaluate(()=>window.__pkTk2.order());ok(!oc.ready,'add-ons only with nothing paid is not ready');
await clk(B.page,'#tk2 input[name="tk-sleep"][value="wrv"]');await clk(B.page,'#tk-pwrc');
await B.page.evaluate(()=>{document.getElementById('tk-x-meals').open=true});await clk(B.page,'#tk2 .tk-step[data-k="x-csunb"] button[data-step="1"]');
await scrollTo(B.page,'#tk-s-sleep');await shot(B.page,'p390-06-addons');
const ob=await B.page.evaluate(()=>window.__pkTk2.order());ok(ob.ready&&ob.items.map(i=>i.id).join()==='wrv,wrvp,csunb','add-ons only: Willow RV + power + Sunday brunch '+ob.items.map(i=>i.id).join());
await clk(B.page,'#tk-bargo');await B.page.waitForTimeout(2500);ok(B.posts.length===1,'add-ons-only order checks out');
await B.ctx.close();
// new to pickathon sheet
const C=await open('p390');await clk(C.page,'#tk2 [data-act="why"]');await C.page.waitForTimeout(1500);
const ws=await C.page.evaluate(()=>({cards:document.querySelectorAll('.tk-dc').length,play:document.querySelectorAll('.tk-dc .tk-ring').length,first:(document.querySelector('.tk-dc-n')||{}).textContent}));
ok(ws.cards>=4,'New to Pickathon: ranked Discoveries shown '+JSON.stringify(ws));await shot(C.page,'p390-07-why');
await C.page.evaluate(()=>{const s=document.querySelector('.tk-sheet');if(s)s.scrollTop=s.scrollHeight});await shot(C.page,'p390-08-why-bottom');
ok(!C.errs.length,'no script errors (sheet) '+C.errs.join(' | '));await C.ctx.close();
}
// ---------- 3. sold out ----------
if(!ONLY||ONLY.includes('sold')){
const {ctx,page,errs}=await open('p390',{sold:['CC','FRID','CV','RVOP']});
const s=await page.evaluate(()=>({scar:document.querySelector('input[name="tk-sleep"][value="scar"]').disabled,svan:document.querySelector('input[name="tk-sleep"][value="svan"]').disabled,fri:document.querySelector('.tk-step[data-k="x-cfri"] button[data-step="1"]').disabled}));
ok(s.scar&&s.svan&&s.fri,'sold out from the feed: South car camping, South van, Friday dinner can not be added '+JSON.stringify(s));
await page.evaluate(()=>window.__pkTk2.set({pass:'p4',adult:1,sleep:'wrv',pwr:true,x:{cfri:2}}));const r=await page.evaluate(()=>window.__pkTk2.record());
ok(!r.pwr&&!r.x.cfri,'sold-out power and Friday dinner drop out of a saved order '+JSON.stringify({pwr:r.pwr,x:r.x}));
await scrollTo(page,'#tk-s-sleep');await shot(page,'p390-09-soldout');ok(!errs.length,'no script errors (sold) '+errs.join(' | '));await ctx.close();}
// ---------- 4. screenshots by size ----------
if(!ONLY||ONLY.includes('shots')){
for(const sz of ['p360','p430','tab','desk']){const {ctx,page,errs}=await open(sz);
 await shot(page,sz+'-01-top');
 await page.evaluate(()=>window.__pkTk2.set({pass:'p3',adult:2,kid:1,sleep:'wvan',sites:1,pwr:true,go:'later',more:[{pass:'d1',day:'dsat',adult:1}],x:{csatb:2,tools:1}}));await page.waitForTimeout(400);
 await scrollTo(page,'#tk-grps');await shot(page,sz+'-02-groups');await scrollTo(page,'#tk-s-sleep');await shot(page,sz+'-03-camping');
 await page.evaluate(()=>{['tk-x-meals','tk-x-give'].forEach(i=>document.getElementById(i).open=true)});await scrollTo(page,'#tk-s-extra');await shot(page,sz+'-04-extras');
 await page.evaluate(()=>window.scrollTo(0,0));await clk(page,'#tk2 [data-act="why"]');await page.waitForTimeout(1200);await shot(page,sz+'-05-why');
 ok(!errs.length,'no script errors ('+sz+') '+errs.join(' | '));await ctx.close();}}
fs.writeFileSync(path.join(OUT,'report.txt'),report.join('\n')+'\n');console.log(report.join('\n'));
await br.close();srv.close&&srv.close();process.exit(0);})().catch(e=>{console.log('CRASH',e.message);fs.writeFileSync(path.join(OUT,'report.txt'),report.join('\n')+'\nCRASH '+e.message);process.exit(1)});
