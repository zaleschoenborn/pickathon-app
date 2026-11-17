// Plan your trip checks (Design: Plan Your Trip and About, Nov 17 2026).
// node tools/plan_r2/checks/plan_check.js [width=390] [outdir=/tmp/plan_shots]
// Serves this checkout with the Site QA kit's server and fonts, then walks each visitor state:
//   looking   : no picks, no order                -> answers lead (Sleep, Arrive, At the farm, Before you buy), plan question below, packing last
//   answered  : tapped "Yes, camping"              -> still answers first; plan card where the question was
//   picked    : passes picked on Tickets, not paid -> answers first; plan card says "Finish your tickets" when the sale is open
//   bought    : passes in hand (pkMyPasses true)   -> plan card on top, steps numbered 1-5 in time order
//   shared    : opened from a friend's plan link   -> plan card on top with the link's three picks
//   addon     : an add-on or patron order          -> no blank "How long", no "undefined"
// Exit code 1 if any expectation fails. Screenshots: <outdir>/<state>-<width>.png (full page) for Zale's review.
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const serve = require(ROOT + '/tests/lib/serve.js'), fonts = require(ROOT + '/tests/lib/fonts.js');
const W = +(process.argv[2] || 390), OUT = process.argv[3] || '/tmp/plan_shots';
fs.mkdirSync(OUT, { recursive: true });
const ORDER = (pass) => JSON.stringify({ pass, day: null, adult: 2, teen: 0, kid: 0, wed: false, sleep: 'tent', go: 'drive', car: 1, patron: false });
const LOOK = ['Sleep', 'Arrive', 'At the farm', 'Before you buy', 'Get ready'];
const PLAN = ['1 Before you buy', '2 Get ready', '3 Arrive', '4 Sleep', '5 At the farm'];
let fails = 0; const bad = (m) => { fails++; console.log('  FAIL ' + m); };
(async () => {
  const [srv, base] = await serve(ROOT); const br = await chromium.launch();
  async function state(name, { order, has = false, hash = '#/plan', tap } = {}) {
    const ctx = await br.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', hasTouch: W < 1100, isMobile: W < 700 });
    await fonts.route(ctx); const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
    await ctx.addInitScript(([o, h]) => { try { if (o) localStorage.setItem('pk27order', o); window.pkMyPasses = () => h; } catch (x) {} }, [order || null, has]);
    await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(1000);
    for (const b of await page.$$('button')) { if (/^decline$/i.test((await b.innerText().catch(() => '')).trim())) { await b.click().catch(() => {}); break; } }
    await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(2200);
    if (tap) { await page.click(tap); await page.waitForTimeout(800); }
    const r = await page.evaluate(() => { const inn = document.querySelector('.pl2 .pl-in'); const g = (q) => { const e = document.querySelector(q); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; };
      return { lead: inn && inn.getAttribute('data-lead'), cards: [...document.querySelectorAll('.pl2 .pl-sc')].map((c) => ((c.querySelector('.pl-sc-n') || {}).textContent ? c.querySelector('.pl-sc-n').textContent + ' ' : '') + c.querySelector('.pl-sc-k').textContent),
        len: (document.querySelector('#pl-len') || {}).value, next: g('#pl-nt'), undef: /undefined/.test(document.body.innerText), side: document.documentElement.scrollWidth > innerWidth }; });
    console.log(name, JSON.stringify(r), errs.length ? 'ERR ' + errs.join(';') : '');
    if (errs.length) bad(name + ': script error');
    if (r.undef) bad(name + ': "undefined" on the page'); if (r.side) bad(name + ': sideways scroll');
    const full = await page.evaluate(() => { let m = 0; for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e).overflowY; if (/auto|scroll/.test(s) && e.scrollHeight > e.clientHeight + 20 && e.clientHeight > 300) m = Math.max(m, e.scrollHeight); } return m || document.documentElement.scrollHeight; });
    await page.setViewportSize({ width: W, height: Math.min(full + 60, 9000) }); await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, name + '-' + W + '.png') }); await page.setViewportSize({ width: W, height: 844 });
    return [ctx, page, r];
  }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let [c, p, r] = await state('looking');
  if (r.lead !== 'look' || !eq(r.cards, LOOK)) bad('looking: expected answers first ' + LOOK.join(', '));
  const mark = () => p.evaluate(() => { const m = document.querySelector('.pl2 .pl-mark'), n = document.querySelector('.pl2 .pl-nx'); return (m ? m.textContent : '-') + ' -> ' + (n ? n.textContent.trim() : '-'); });
  await p.click('.pl2 [data-go="step:sleep"]'); await p.waitForTimeout(1000); const chain = [await mark()];
  for (let i = 0; i < 2; i++) { await p.click('.pl2 .pl-nx'); await p.waitForTimeout(1000); chain.push(await mark()); }
  console.log('  chain', chain.join(' | ')); if (!/passes and prices/.test(chain[2])) bad('looking: step chain should end at passes and prices');
  await c.close();
  [c, p, r] = await state('answered', { tap: '.pl2 [data-ask="camp"]' }); if (r.lead !== 'look') bad('answered: answers should still lead'); await c.close();
  [c, p, r] = await state('picked', { order: ORDER('p3') }); if (r.lead !== 'look' || r.len !== 'p3') bad('picked: answers first, length from the picks'); await c.close();
  [c, p, r] = await state('bought', { order: ORDER('p4'), has: true }); if (r.lead !== 'plan' || !eq(r.cards, PLAN)) bad('bought: plan on top, steps 1-5'); await c.close();
  [c, p, r] = await state('shared', { hash: '#/plan?len=p4&sleep=tent&go=shuttle' }); if (r.lead !== 'plan' || r.len !== 'p4') bad('shared: plan on top with the link picks'); await c.close();
  [c, p, r] = await state('addon', { order: ORDER('none') }); if (!r.len) bad('addon: How long is blank'); await c.close();
  await br.close(); srv.close();
  console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
})();
