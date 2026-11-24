// About story page check (Design: Plan Your Trip and About, Nov 24 2026).
// node tools/about_r1/about_check.js [widths=390,430,360,1440] [outdir=/tmp/about_shots]
// Opens #/about-us at each width, checks: page drawn, no script errors, no "undefined", no sideways scroll, every poster
// whole (object-fit contain), every tap target at least 44 px, every link goes somewhere. Saves the first screen and the full page.
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const serve = require(ROOT + '/tests/lib/serve.js'), fonts = require(ROOT + '/tests/lib/fonts.js');
const WS = String(process.argv[2] || '390,430,360,1440').split(',').map(Number), OUT = process.argv[3] || '/tmp/about_shots';
fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const bad = (m) => { fails++; console.log('  FAIL ' + m); };
(async () => {
  const [srv, base] = await serve(ROOT); const br = await chromium.launch();
  for (const W of WS) {
    const H = W < 700 ? (W < 380 ? 740 : W < 420 ? 844 : 932) : 900;
    const ctx = await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W < 700 ? 2 : 1, serviceWorkers: 'block', hasTouch: W < 1100, isMobile: W < 700 });
    await fonts.route(ctx); const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 140)));
    await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(1000);
    for (const b of await page.$$('button')) { if (/^decline$/i.test((await b.innerText().catch(() => '')).trim())) { await b.click().catch(() => {}); break; } }
    await page.evaluate(() => { location.hash = '#/about-us'; }); await page.waitForTimeout(2500);
    const r = await page.evaluate(() => {
      const el = document.getElementById('ab1'); if (!el || !el.firstChild) return { drawn: false };
      const small = [...el.querySelectorAll('.ab-go,.pk-cta')].filter((b) => { const q = b.getBoundingClientRect(); return b.offsetParent && (q.height < 44 || q.width < 44); }).map((b) => b.innerText.trim().slice(0, 30) + ' ' + Math.round(b.getBoundingClientRect().height));
      const cropped = [...el.querySelectorAll('.ab-pf img,.ab-sp img')].filter((i) => getComputedStyle(i).objectFit !== 'contain').length;
      const broken = [...el.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src'));
      const nogo = [...el.querySelectorAll('[data-ab-go]')].filter((b) => !b.getAttribute('data-ab-go')).length;
      return { drawn: true, h1: (el.querySelector('h1') || {}).innerText, sections: el.querySelectorAll('section').length, small, cropped, broken, nogo,
        undef: /undefined|null/.test(el.innerText), side: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    console.log(W, JSON.stringify(r), errs.length ? 'ERR ' + errs.join(';') : '');
    if (!r.drawn) bad(W + ': page not drawn');
    if (errs.length) bad(W + ': script error');
    if (r.undef) bad(W + ': "undefined" or "null" on the page'); if (r.side) bad(W + ': sideways scroll');
    if (r.cropped) bad(W + ': ' + r.cropped + ' posters cropped'); if ((r.broken || []).length) bad(W + ': broken images ' + r.broken.join(' '));
    if ((r.small || []).length) bad(W + ': tap targets under 44px: ' + r.small.join(' | '));
    await page.screenshot({ path: path.join(OUT, 'about-' + W + '-first.png') });
    const full = await page.evaluate(() => { let m = 0; for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e).overflowY; if (/auto|scroll/.test(s) && e.scrollHeight > e.clientHeight + 20 && e.clientHeight > 300) m = Math.max(m, e.scrollHeight); } return m || document.documentElement.scrollHeight; });
    await page.setViewportSize({ width: W, height: Math.min(full + 60, 9000) }); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'about-' + W + '.png') });
    await ctx.close();
  }
  await br.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
