#!/usr/bin/env node
// Tickets intro, days first (Nov 23). Replaces the entry checks in tk5.js (its hero, "Why Pickathon?" and "Help me choose" are gone).
// Serve the repo root on :8765 first (python3 -m http.server 8765), then: node tools/tickets_r2/checks/tk6.js
// ?tkcold=1 / ?tkcold=0 force the cold-visitor and returning-visitor versions.
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) {} }
const BASE = process.env.BASE || 'http://localhost:8765/';
const SIZES = { phone: [390, 844, true], tablet: [820, 1180, true], desktop: [1440, 900, false] };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' });
  const open = async (size, cold) => {
    const [w, h, t] = SIZES[size]; const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: t, isMobile: t && w < 600 });
    const p = await ctx.newPage(); p._errs = []; p.on('pageerror', (e) => p._errs.push(String(e)));
    await p.addInitScript(() => { try { localStorage.setItem('pk-ck', 'no'); } catch (e) {} });
    await p.goto(BASE + '?tkcold=' + cold + '#/tickets', { waitUntil: 'load' }); await p.waitForTimeout(4000); return p;
  };
  for (const size of Object.keys(SIZES)) {
    let p = await open(size, 1);
    ok(await p.$('#tk-x .tk-x-chip'), size + ' cold: the experience picker shows');
    ok((await p.$$eval('.tk-x-ph[data-act="x-play"]', (a) => a.length)) >= 3, size + ' cold: Music shows at least 3 bands with a play button');
    ok(await p.$eval('.tk-x-chip[aria-pressed="true"]', (e) => { const r = e.getBoundingClientRect(), q = e.parentNode.getBoundingClientRect(); return r.left >= q.left - 1 && r.right <= q.right + 1; }), size + ' cold: the picked chip is in view');
    await p.evaluate(() => [...document.querySelectorAll('.tk-x-chip')].find((x) => x.textContent.trim() === 'Camping').click()); await p.waitForTimeout(400);
    ok((await p.$$eval('.tk-x-ph[data-act="x-tour"]', (a) => a.length)) >= 2, size + ' cold: Camping swipes through camps');
    ok(/3- and 4-Day/.test(await p.$eval('.tk-x-line', (e) => e.textContent)), size + ' cold: Camping shows its ticket line');
    ok(!(await p.$('.tk-e3-ph')), size + ' cold: no weekend photo (the picker replaces it)');
    ok(p._errs.length === 0, size + ' cold: no script errors ' + p._errs.join(' | '));
    await p.context().close();
    p = await open(size, 0);
    ok(!(await p.$('#tk-x')) && !!(await p.$('.tk-e3-ph img')), size + ' warm: weekend photo, no picker');
    for (const d of ['dfri', 'dsat', 'dsun']) { await p.click('#tk-e-pick [data-d="' + d + '"]'); await p.waitForTimeout(200); }
    ok(/3-Day Pass/i.test(await p.$eval('#tk-e-pick', (e) => e.textContent)), size + ' warm: Fri-Sun names the 3-Day Pass');
    await p.click('#tk-e-next'); await p.waitForTimeout(1000);
    ok(/Who.s coming/i.test(await p.evaluate(() => (document.querySelector('.tk-sheet') || {}).textContent || '')), size + ' warm: Next opens step 2');
    await p.context().close();
    p = await open(size, 0);
    await p.click('#tk-e3-know summary'); await p.waitForTimeout(300);
    const g = await p.$eval('#tk-e-grid', (e) => e.textContent);
    ok(/Patron Pass[\s\S]*\$1,921\.50/.test(g), size + ' warm: I know what I want shows the passes, Patron $1,921.50');
    ok(p._errs.length === 0, size + ' warm: no script errors ' + p._errs.join(' | '));
    await p.context().close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
})();
