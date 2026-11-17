const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/claude/pickathon-app', OUT = process.argv[2] || '/tmp/bd/shots';
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); }).listen(8775);
const sizes = (process.argv[3] || '390x844,430x932,360x740,820x1180,1180x820,1440x900').split(',');
(async () => {
  const br = await chromium.launch();
  for (const sz of sizes) {
    const [w, h] = sz.split('x').map(Number), touch = w < 1200;
    const ctx = await br.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch && w < 900, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('pk-ck', 'no'); } catch (e) {} });
    await pg.goto('http://localhost:8775/index.html', { waitUntil: 'load' });
    await pg.waitForFunction(() => window.comp && window.comp.state && window.comp.state.data, null, { timeout: 30000 });
    await pg.evaluate(() => window.comp.reset('build'));
    await pg.waitForSelector('#bd1 .bd-hero', { timeout: 15000 });
    await pg.waitForTimeout(1500);
    const H = await pg.evaluate(() => { const s = document.getElementById('pk-scroll-phone'); return s && s.scrollHeight > s.clientHeight ? s.scrollHeight : document.documentElement.scrollHeight; });
    // screen by screen
    for (let i = 0, y = 0; y < H && i < 8; i++, y += h) { await pg.evaluate(y => { const s = document.getElementById('pk-scroll-phone'); if (s && s.scrollHeight > s.clientHeight) s.scrollTop = y; else window.scrollTo(0, y); }, y); await pg.waitForTimeout(500); await pg.screenshot({ path: `${OUT}/${sz}-p${i}.jpg`, quality: 70 }); }
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(300);
    await pg.click('#bd1 [data-bd-start]'); await pg.waitForTimeout(400);
    await pg.screenshot({ path: `${OUT}/${sz}-s1.jpg`, quality: 70 });
    for (let k = 0; k < 5; k++) { await pg.click('#bd1-sheet .bds-opt >> nth=0'); await pg.waitForTimeout(250); }
    await pg.screenshot({ path: `${OUT}/${sz}-s6.jpg`, quality: 70 });
    await pg.fill('[data-bds-f=name]', 'Zale Test'); await pg.fill('[data-bds-f=org]', 'Test Org'); await pg.fill('[data-bds-f=email]', 'zale@pickathon.com'); await pg.fill('[data-bds-f=what]', 'A test.');
    await pg.click('[data-bds=send]'); await pg.waitForTimeout(300);
    await pg.screenshot({ path: `${OUT}/${sz}-s7.jpg`, quality: 70 });
    const last = await pg.evaluate(() => window.__pkBuildLast);
    console.log(sz, 'height', H, 'screens', (H / h).toFixed(1), 'errors', errs.length ? errs : 'none'); if (sz === sizes[0]) console.log(last);
    await ctx.close();
  }
  await br.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
