const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/claude/pickathon-app', OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); }).listen(8776);
const sizes = process.argv[3].split(',');
const SEL = ['.bd-hero', '#bd-went', '.bd-get', '.bd-who', '.bd-last'];
(async () => {
  const br = await chromium.launch();
  for (const sz of sizes) {
    const [w, h] = sz.split('x').map(Number), touch = w < 1200;
    const ctx = await br.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch && w < 900, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('pk-ck', 'no'); } catch (e) {} });
    await pg.goto('http://localhost:8776/index.html', { waitUntil: 'load' });
    await pg.waitForFunction(() => window.comp && window.comp.state && window.comp.state.data, null, { timeout: 30000 });
    await pg.evaluate(() => window.comp.reset('build'));
    await pg.waitForSelector('#bd1 .bd-hero', { timeout: 15000 });
    await pg.waitForTimeout(1500);
    const out = [];
    for (let i = 0; i < SEL.length; i++) {
      const m = await pg.evaluate(sel => {
        const e = document.querySelector('#bd1 ' + sel); if (!e) return null;
        const s = document.getElementById('pk-scroll-phone'); const useS = s && s.scrollHeight > s.clientHeight;
        const top0 = useS ? s.getBoundingClientRect().top : 0;
        // visible band: below any fixed/sticky header, above bottom nav
        let hdr = 0; document.querySelectorAll('header, .pk-hdr, .pk-tkbar, [class*="strip"]').forEach(x => { const r = x.getBoundingClientRect(), cs = getComputedStyle(x); if ((cs.position === 'fixed' || cs.position === 'sticky') && r.top < 200 && r.height < 200) hdr = Math.max(hdr, r.bottom); });
        let nav = innerHeight; document.querySelectorAll('nav, [class*="tab"]').forEach(x => { const r = x.getBoundingClientRect(), cs = getComputedStyle(x); if (cs.position === 'fixed' && r.bottom >= innerHeight - 2 && r.height < 120 && r.width > innerWidth * .8) nav = Math.min(nav, r.top); });
        const r = e.getBoundingClientRect(); const y = (useS ? s.scrollTop : scrollY) + r.top - Math.max(hdr, top0);
        if (useS) s.scrollTop = y; else scrollTo(0, y);
        return { h: Math.round(r.height), useS: useS, hdr: Math.round(hdr) };
      }, SEL[i]);
      await pg.waitForTimeout(500);
      if (m) m.band = await pg.evaluate(o => { const s = document.getElementById('pk-scroll-phone'); return o.useS ? s.clientHeight : innerHeight - o.hdr; }, m);
      await pg.screenshot({ path: `${OUT}/${sz}-${i}.jpg`, quality: 72 });
      out.push(SEL[i] + ' ' + (m ? m.h + '/' + m.band + (m.h > m.band ? ' OVER' : '') : 'missing'));
    }
    console.log(sz, out.join(' | '), errs.length ? errs : '');
    await ctx.close();
  }
  await br.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
