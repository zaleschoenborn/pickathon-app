// Nov 15: gifts and transfers. Stand-in feed; pickathon.com stubbed; sale switch on.
const pw=require(process.env.PW||'/opt/npm-tools/node_modules/playwright'), fs=require('fs');
const REPO=require('path').resolve(__dirname,'../../..'), OUT=require('path').resolve(process.env.TK_OUT||'/tmp/tk_checks'); fs.mkdirSync(OUT,{recursive:true});
const IP=require(REPO+'/tests/lib/inpage'),serve=require(REPO+'/tests/lib/serve'),FONTS=require(REPO+'/tests/lib/fonts'),FMS=require('./fms_line.js');
const feed=JSON.stringify({event:{id:9},ticketTypes:Object.entries(FMS).map(([code,a],i)=>({id:1000+i,code,name:code,price:{amount:a},soldOut:false}))});
const report=[]; const ok=(c,m)=>report.push((c?'PASS ':'FAIL ')+m);
const SIZES={p390:[390,844,1],p360:[360,740,1],desk:[1440,900,0]};
(async()=>{const[srv,base]=await serve(REPO);const br=await pw.chromium.launch();
 async function open(sz,o={}){const[w,h,t]=SIZES[sz];const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:!!t,hasTouch:!!t,serviceWorkers:'block'});
  /* Nov 15: the old list is hidden on the real page; tests still drive its inputs for the pricing logic */ await ctx.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='#tk2 .tk-main[hidden],#tk2 .tk-head[hidden]{display:block!important}';document.head.appendChild(st);});}); await ctx.addInitScript({content:'('+IP.initScript+')("tab")'});await FONTS.route(ctx);
  const posts=[];await ctx.route(/pickathon\.com\/(tickets|checkout|pay)/,r=>{posts.push(r.request().postData()||'');r.fulfill({status:200,contentType:'text/html',body:'<h1>stub</h1>'});});
  await ctx.route(/wp-json\/pickathon\/v1\/sale/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"on":true}'}));
  await ctx.route(/fms\.pickathon\.com/,r=>r.fulfill({status:200,contentType:'application/json',body:feed,headers:{'access-control-allow-origin':'*'}}));
  const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
  await pg.goto(base+(o.path||'')+(o.hash||'#/tickets'),{waitUntil:'load',timeout:200000}); await pg.waitForTimeout(o.wait||9000);
  return {ctx,pg,posts,errs};}
 const shot=(pg,n)=>pg.screenshot({path:OUT+'/'+n+'.png'});
 const small=pg=>pg.evaluate(()=>[...document.querySelectorAll('.gx-sheet button,.gx-sheet a,.gx-sheet input,.gx-sheet textarea,.gx-sheet label.gx-chk')].filter(e=>e.offsetParent&&getComputedStyle(e).opacity!=='0').map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),(e.textContent||e.id||'').trim().slice(0,20)]}).filter(a=>(a[1]<44||a[0]<44)&&!/^gx-(fn|ln|em|on|from|in)$/.test(a[2])));
 // A: checkout gift, phone
 for(const sz of ['p390','p360']){ const {ctx,pg,posts,errs}=await open(sz);
   /* Nov 15: the old pass cards are gone; set a 3-Day order and open the steps at the order step, where the gift link lives */
   await pg.evaluate(()=>{window.__pkTk2.set({pass:'p3',adult:1}); window.__pkTk2.guide('order');}); await pg.waitForTimeout(600);
   const gp=await pg.$('.tk-gscrim [data-g="gift"][data-i="-1"]'); ok(!!gp,sz+' gift button shows once a pass is picked');
   if(gp){await gp.click(); await pg.waitForTimeout(400); await shot(pg,sz+'-1-form-empty');
     await pg.click('.gx-sheet [data-gx="save"]'); const e1=await pg.$eval('.gx-err',e=>e.textContent); ok(/first name/i.test(e1),sz+' form asks for a name first: '+e1);
     await pg.fill('#gx-fn','Sam'); await pg.fill('#gx-ln','Rivera'); await pg.fill('#gx-em','sam@example.com');
     if(await pg.$('#gx-from')) await pg.fill('#gx-from','Wendy');
     await pg.fill('#gx-note','Merry Christmas. Pack a tent.'); await pg.click('input[name="gx-when"][value="date"]'); await pg.fill('#gx-on','2026-12-25');
     const sm=await small(pg); ok(!sm.length,sz+' gift form tap targets 44px: '+JSON.stringify(sm));
     const side=await pg.evaluate(()=>{const s=document.querySelector('.gx-sheet');return s.scrollWidth>s.clientWidth+1}); ok(!side,sz+' gift form has no sideways scroll');
     await shot(pg,sz+'-2-form-filled'); await pg.evaluate(()=>document.querySelector('.gx-sheet').scrollTop=9999); await pg.waitForTimeout(200); await shot(pg,sz+'-3-form-bottom');
     await pg.click('.gx-sheet [data-gx="save"]'); await pg.waitForTimeout(500);
     const gl=await pg.$$eval('#tk-lines li.tk-gl',l=>l.map(x=>x.textContent)); ok(gl.length===1&&/Sam/.test(gl[0])&&/Dec 25/.test(gl[0]),sz+' order shows the gift: '+gl.join('|'));
     const rec=await pg.evaluate(()=>window.__pkTk2.order().record.gifts); ok(rec.length===1&&rec[0].passes[0].q===1,sz+' order record keeps the gift');
     if(sz==='p390'){ await pg.evaluate(()=>document.querySelector('#tk-lines').scrollIntoView({block:'center'})); await pg.waitForTimeout(300); await shot(pg,sz+'-4-order-line');
       const rdy=await pg.evaluate(()=>{const o=window.__pkTk2.order();return o.ready+' '+(window.pkFeed||{}).state+' '+o.items.map(i=>i.id+':'+i.qty).join(',')}); console.log('order',rdy); await pg.evaluate(()=>{const b=[...document.querySelectorAll("#tk2 [data-act=\"go\"]")].filter(x=>x.offsetParent)[0]; if(b) b.click();}); await pg.waitForTimeout(2500); const body=decodeURIComponent((posts[0]||'').replace(/\+/g,' ')); ok(/gifts\[0\]\[firstName\]=Sam/.test(body)&&/gifts\[0\]\[emailAddress\]=sam@example.com/.test(body)&&/gifts\[0\]\[sendOn\]=2026-12-25/.test(body)&&/gifts\[0\]\[tickets\]\[\d+\]=1/.test(body),'checkout sends the gift with the order: '+body.slice(0,300)); }
   }
   ok(!errs.length,sz+' no script errors '+errs.join(' | ')); await ctx.close(); }
 // B: postcard link, phone
 { const {ctx,pg,errs}=await open('p390',{path:'?gift=demo',hash:'#/',wait:6000});
   const has=await pg.$('.gx-full .gx-front'); ok(!!has,'B ?gift= opens the postcard'); await shot(pg,'b1-front');
   const imgOk=await pg.$eval('.gx-front img',i=>i.complete&&i.naturalWidth>0).catch(()=>false); ok(imgOk,'B postcard photo loads');
   await pg.click('[data-gx="turn"]'); await pg.waitForTimeout(300); await shot(pg,'b2-back');
   await pg.click('[data-gx="accept"]'); await pg.waitForTimeout(300); ok(!!(await pg.$('#gx-in')),'B accept asks the recipient to sign in first'); await shot(pg,'b3-signin');
   await pg.fill('#gx-in','sam@example.com'); await pg.click('[data-gx="signin"]'); await pg.waitForTimeout(400); await shot(pg,'b4-accepted');
   const n=await pg.$$eval('.gx-pass',l=>l.length); ok(n===2,'B accepted: both passes in the account, QR later ('+n+')');
   const mine=await pg.evaluate(()=>window.pkMyPasses()); ok(mine&&mine[0].qty===2,'B My Pickathon now lists the passes '+JSON.stringify(mine));
   const sm=await small(pg); ok(!sm.length,'B tap targets 44px '+JSON.stringify(sm));
   // a real link built from a gift
   const L=await pg.evaluate(()=>window.pkGift.link({from:{name:'Ryan'},to:{first:'Cassie',last:'C'},note:'Happy holidays',passes:[{n:'4-Day Pass',sub:'Thu–Sun',q:1}]}));
   await pg.goto(L.replace(/^https?:\/\/[^/]+/,base.replace(/\/$/,'')),{waitUntil:'load'}); await pg.waitForTimeout(5000); const h=await pg.$eval('.gx-pc-h',e=>e.textContent).catch(()=>''); ok(/Cassie/.test(h),'B a built link opens with the right name: '+h);
   ok(!errs.length,'B no script errors '+errs.join(' | ')); await ctx.close(); }
 // C: My Pickathon account transfer, phone
 { const {ctx,pg,errs}=await open('p390',{hash:'#/account',wait:8000});
   await pg.evaluate(()=>{const A=window.__pkApp||window.comp;A.setState({user:{email:'wendy@example.com',name:'Wendy'}});}); await pg.waitForTimeout(600);
   const b=await pg.$('button:has-text("Send or gift")'); ok(!!b,'C account page shows "Send or gift"');
   if(b){ await b.click(); await pg.waitForTimeout(400); await shot(pg,'c1-pick');
     await pg.click('.gx-chk input'); await pg.click('[data-gx="next"]'); await pg.waitForTimeout(300); await pg.fill('#gx-fn','Sam'); await pg.fill('#gx-em','sam@example.com'); await pg.click('[data-gx="save"]'); await pg.waitForTimeout(400); await shot(pg,'c2-sent');
     ok(!!(await pg.$('.gx-sheet a[href*="?gift="]')),'C sent sheet links to the postcard');
     await pg.click('.gx-sheet [data-gx-close]'); await pg.waitForTimeout(400); const t=await pg.evaluate(()=>document.body.innerText); ok(/Take it back/.test(t)&&/Sam/.test(t),'C pass shows waiting for Sam, with Take it back'); await shot(pg,'c3-waiting'); }
   ok(!errs.length,'C no script errors '+errs.join(' | ')); await ctx.close(); }
 console.log(report.join('\n')); console.log('PASS',report.filter(x=>x.startsWith('PASS')).length,'FAIL',report.filter(x=>x.startsWith('FAIL')).length);
 await br.close(); srv.close();})().catch(e=>{console.error(e);process.exit(1)});
