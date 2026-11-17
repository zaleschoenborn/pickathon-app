const pw=require(process.env.PW||'/opt/npm-tools/node_modules/playwright');const REPO=require('path').resolve(__dirname,'../../..');const IP=require(REPO+'/tests/lib/inpage'),serve=require(REPO+'/tests/lib/serve'),FONTS=require(REPO+'/tests/lib/fonts');
const R=[];const ok=(c,m)=>R.push((c?'PASS ':'FAIL ')+m);
(async()=>{const[srv,base]=await serve(REPO);const br=await pw.chromium.launch();
 for(const [label,route] of [['missing (404)',r=>r.fulfill({status:404,body:'nope'})],['off',r=>r.fulfill({status:200,contentType:'application/json',body:'{"on":false}'})],['on',r=>r.fulfill({status:200,contentType:'application/json',body:'{"on":true}'})],['hangs',()=>{}]]){
  const ctx=await br.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await ctx.addInitScript({content:'('+IP.initScript+')("tab")'});await FONTS.route(ctx);
  await ctx.route(/wp-json\/pickathon\/v1\/sale/,route);
  const pg=await ctx.newPage();await pg.goto(base+'#/tickets',{waitUntil:'load'});await pg.waitForTimeout(8000);
  const r=await pg.evaluate(()=>{const f=d=>{const t=window.pkTix(d);return t.open?t.cur.id:'closed:'+(t.next?t.next.id:'-')};return {st:window.pkSaleState,d18:f('2026-11-18'),d19:f('2026-11-19'),d25:f('2026-11-25'),dec:f('2026-12-10'),jan5:f('2027-01-05'),feb:f('2027-02-10'),now:f(),page:document.querySelector('.tk-soon')?'coming soon':(document.querySelector('#tk-main')?'store':'?'),kick:(document.querySelector('.tk-s-k')||{}).textContent}});
  console.log(label,JSON.stringify(r));
  if(label!=='on'&&label!=='off'){ok(r.st==='none',label+': no usable answer means the clock decides');ok(r.d18.startsWith('closed')&&r.d19==='holiday'&&r.d25==='holiday'&&r.dec==='closed:early'&&r.jan5==='early'&&r.feb==='early',label+': Holiday opens Nov 19, gap after Nov 30, Early Bird opens Jan 5');ok(r.page==='coming soon',label+': today (Nov 15) still shows coming soon');}
  if(label==='off'){ok(r.d19.startsWith('closed')&&r.jan5.startsWith('closed')&&r.page==='coming soon','off: closed on every date, even Nov 19 and Jan 5');}
  if(label==='on'){ok(r.now==='holiday'&&r.page==='store','on: opens the Holiday Sale right away');}
  await ctx.close();}
 console.log(R.join('\n'));await br.close();srv.close();})();
