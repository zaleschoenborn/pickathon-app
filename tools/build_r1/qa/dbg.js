const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/claude/pickathon-app';
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; fs.readFile(path.join(ROOT, p), (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200); r.end(b); }); }).listen(8777);
(async () => {
  const br = await chromium.launch(); const [w,h]=(process.argv[2]||'390x844').split('x').map(Number);
  const ctx = await br.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w<900, serviceWorkers: 'block' });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.addInitScript(() => { try { localStorage.setItem('pk-ck', 'no'); } catch (e) {} });
  await pg.goto('http://localhost:8777/index.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.comp && window.comp.state && window.comp.state.data);
  await pg.evaluate(() => window.comp.reset('build')); await pg.waitForSelector('#bd1 .bd-hero'); await pg.waitForTimeout(2000);
  console.log(await pg.evaluate(() => { const g = s => document.querySelector('#bd1 ' + s); const went = g('.bd-went');
    const chip = g('.bd-chip'); const o = {};
    o.ph = went.style.getPropertyValue('--bd-ph'); o.wentH = went.offsetHeight; o.cim = g('.bd-cim').offsetHeight; o.cardW = g('.bd-card').offsetWidth; o.cardH = g('.bd-card').offsetHeight;
    o.chipPad = getComputedStyle(chip).paddingLeft; o.chipsW = g('.bd-chips').scrollWidth + '/' + g('.bd-chips').clientWidth;
    o.parts = ['.bd-wh', '.bd-chips', '.bd-row', '.bd-mo'].map(s => s + ':' + g(s).offsetHeight);
    o.scan=[];for(let y=1;y<200;y+=12){let e=document.elementFromPoint(195,y),c=[];for(;e&&e!==document.body;e=e.parentElement){const ps=getComputedStyle(e).position;if(ps==='fixed'||ps==='sticky')c.push((e.id||e.className.toString().slice(0,18))+':'+ps[0]+Math.round(e.getBoundingClientRect().height));}o.scan.push(y+'>'+c.join('/'));}
    const sc=document.getElementById('pk-scroll-phone');const R=e=>{const r=e.getBoundingClientRect();return Math.round(r.top)+'-'+Math.round(r.bottom)};o.sc=sc?R(sc)+' ch'+sc.clientHeight+' sh'+sc.scrollHeight+' st'+sc.scrollTop:null;const be=document.elementFromPoint(195,innerHeight-3);let n=be;while(n&&n.parentElement&&n.parentElement.getBoundingClientRect().height<140)n=n.parentElement;o.nav=n?R(n)+' '+(n.id||n.className):null;o.heroR=R(g('.bd-hero'));o.docH=document.documentElement.scrollHeight;
    o.hero = g('.bd-hero').style.minHeight; o.cards=[...document.querySelectorAll('#bd1 .bd-ctx')].map(e=>e.offsetHeight).join(',');
    return JSON.stringify(o); }));
  await br.close(); srv.close();
})();
