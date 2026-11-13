#!/usr/bin/env node
// Rotation check: turn a phone and a tablet sideways and back in the middle of a visit.
//   node tests/rotate.js [--quick] [--base=URL] [--out=dir]
// Per page and device, as a browser tab and as the installed app:
//   load upright, scroll partway, turn sideways, wait for the page to settle, check, turn back, check.
// Fails when: the page takes over 1 s to settle, you lose your place (what you were reading leaves the
// screen), the page reloads or jumps to another page, an open panel closes, or any layout check fails
// in the new orientation. Writes results.json in the same shape as run.js parts, so sweep.sh merges it.
const path = require('path'), fs = require('fs');
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) {} }
const IP = require('./lib/inpage'), FONTS = require('./lib/fonts'), serve = require('./lib/serve'), { discover } = require('./lib/discover'), RULES = require('./rules');
const arg = (k, d) => { const a = process.argv.find((x) => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : d; };
const QUICK = !!arg('quick'), ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(arg('out', path.join(__dirname, 'out', 'rotate')));
fs.mkdirSync(OUT, { recursive: true });
const log = (s) => { const l = new Date().toTimeString().slice(0, 8) + ' rotate ' + s; console.log(l); fs.appendFileSync(path.join(OUT, 'log.txt'), l + '\n'); };
const DEVICES = { phone: { w: 390, h: 844, dpr: 3 }, tablet: { w: 820, h: 1180, dpr: 2 } };
const SETTLE_MS = 1000;

function pickPages(all, quick) {
  const per = quick ? { past: 1, act: 1, hood: 1 } : { past: 2, act: 2, 'act-plain': 1, artist: 2, hood: 2, story: 1, page: 1, tickets: 1, panel: 4 };
  const n = {}; return all.filter((t) => { if (t.kind === 'view') return !quick || /^(home|hoods|lineup|why)$/.test(t.id); if (!(t.kind in per)) return false; if (t.id === 'past:2024' || t.id === 'act:geese') return true; n[t.kind] = (n[t.kind] || 0) + 1; return n[t.kind] <= per[t.kind]; });
}

// in-page: remember what's under the middle of the screen, plus page identity and open panels
const MARK = () => {
  const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2); let a = el; while (a && a.parentElement && (a.getBoundingClientRect().height > innerHeight * 0.8 || !(a.textContent || '').trim())) a = a.parentElement;
  if (a) a.setAttribute('data-pkqa-anchor', '1');
  window.__pkqaAlive = 1;
  const top = window.__app && window.__app.state.stack[window.__app.state.stack.length - 1];
  const panel = [...document.querySelectorAll('[aria-modal=true],[role=dialog],nav[aria-label=More]')].some((e) => e.checkVisibility() && !e.closest('[aria-label="Cookie choices"]'));
  return { route: JSON.stringify(top || {}), panel, anchor: a ? (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) : '' };
};
const CHECK = (m) => {
  const a = document.querySelector('[data-pkqa-anchor]'); const r = a && a.getBoundingClientRect();
  const top = window.__app && window.__app.state.stack[window.__app.state.stack.length - 1];
  const panel = [...document.querySelectorAll('[aria-modal=true],[role=dialog],nav[aria-label=More]')].some((e) => e.checkVisibility() && !e.closest('[aria-label="Cookie choices"]'));
  return { reloaded: !window.__pkqaAlive, route: JSON.stringify(top || {}), panel, kept: !!(r && r.bottom > 0 && r.top < innerHeight), anchorGone: !a };
};
// time until nothing visible moves for 400 ms
const SETTLE = async () => {
  const moving = (el) => { for (let p = el; p && p !== document.body; p = p.parentElement) { try { if (p.getAnimations().some((a) => a.playState === 'running')) return true; } catch (e) {} const cs = getComputedStyle(p); if (cs.position === 'fixed' || ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth)) return true; } return false; };
  const snap = () => [...document.querySelectorAll('h1,h2,h3,p,button,img')].filter((e) => e.getBoundingClientRect().top < innerHeight * 2).slice(0, 300).filter((e) => !moving(e)).map((e) => { const r = e.getBoundingClientRect(); return Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width); }).join('|');
  const t0 = performance.now(); let last = snap(), stableSince = t0;
  while (performance.now() - t0 < 6000) { await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))); const s = snap(); if (s !== last) { last = s; stableSince = performance.now(); } else if (performance.now() - stableSince >= 400) return Math.round(stableSince - t0); }
  return 6000;
};

(async () => {
  let server, base = arg('base'); if (!base) [server, base] = await serve(ROOT); if (!base.endsWith('/')) base += '/';
  const t0 = Date.now(); const browser = await pw.chromium.launch();
  const all = await discover(browser, base, log); const pages = pickPages(all, QUICK);
  const sink = { issues: [], skips: [], zoom: {}, checked: 0 };
  const add = (t, size, mode, c, m, s, shot) => sink.issues.push({ id: t.id, kind: t.kind, size, mode, c, m, s: s || '', shot: shot || '' });
  const devs = QUICK ? ['phone'] : ['phone', 'tablet'];
  for (const dn of devs) for (const mode of ['tab', 'app']) {
    const D = DEVICES[dn], up = D.w + 'x' + D.h, side = D.h + 'x' + D.w;
    log(dn + ' ' + mode + ': ' + pages.length + ' pages');
    const ctx = await browser.newContext({ viewport: { width: D.w, height: D.h }, deviceScaleFactor: D.dpr, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await ctx.addInitScript({ content: '(' + IP.initScript + ')(' + JSON.stringify(mode) + ')' }); await FONTS.route(ctx);
    let page, cdp, errs = [];
    const fresh = async () => {
      if (page) await page.close().catch(() => {}); page = await ctx.newPage(); cdp = await ctx.newCDPSession(page); errs = [];
      page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0].slice(0, 120)));
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForFunction(() => !!window.__app, null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(1000);
      await page.evaluate(() => { const c = document.querySelector('[aria-label="Cookie choices"]'); const d = c && [...c.querySelectorAll('button')].find((b) => /decline/i.test(b.textContent)); if (d) d.click(); });
      await page.evaluate(IP.hook);
    };
    const turn = async (w, h, land) => { await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: D.dpr, mobile: true, screenOrientation: land ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 } }); await page.setViewportSize({ width: w, height: h }); };
    await fresh(); let n = 0;
    for (const t of pages) {
      if (++n % 30 === 0) await fresh();
      try {
        await turn(D.w, D.h, false);
        let st = await page.evaluate(IP.goto, t); if (st === 'no-app') { await page.evaluate(IP.hook); st = await page.evaluate(IP.goto, t); }
        if (st === 'no-control') { sink.skips.push({ id: t.id, size: up, mode, why: 'control not shown' }); continue; }
        if (st !== 'ok') { add(t, up + '↔' + side, mode, 'rotate', 'could not open page: ' + st); continue; }
        await page.waitForTimeout(800);
        if (t.kind !== 'panel') await page.evaluate(() => window.scrollTo(0, Math.min(document.scrollingElement.scrollHeight * 0.35, innerHeight * 2.5)));
        await page.waitForTimeout(400);
        const e0 = errs.length; const before = await page.evaluate(MARK);
        for (const [w, h, land, label] of [[D.h, D.w, true, 'turned sideways'], [D.w, D.h, false, 'turned back upright']]) {
          await turn(w, h, land); const settle = await page.evaluate(SETTLE); const after = await page.evaluate(CHECK);
          const size = w + 'x' + h, name = t.id.replace(/[^a-zA-Z0-9@:._-]+/g, '-').replace(/:/g, '_').slice(0, 70) + (land ? '-side' : '-back') + '.jpg';
          const probs = [];
          if (after.reloaded) probs.push(['page reloaded when ' + label]);
          else if (after.route !== before.route) probs.push(['jumped to another page when ' + label]);
          if (before.panel && !after.panel) probs.push(['open panel closed when ' + label]);
          if (!after.reloaded && !after.anchorGone && !after.kept && t.kind !== 'panel') probs.push(['lost your place when ' + label + ' (what was mid-screen, "' + before.anchor + '", is now off screen)']);
          if (settle > SETTLE_MS) probs.push(['took ' + (settle / 1000).toFixed(1) + ' s to settle after being ' + label + ' (target ' + SETTLE_MS / 1000 + ' s)']);
          errs.slice(e0).forEach((m) => probs.push(['script error after being ' + label + ': ' + m]));
          const lay = await page.evaluate(IP.checks, { touch: true });
          for (const R of RULES) { if (R.when && !R.when({ size, mode, target: t, touch: true })) continue; try { (await page.evaluate(R.run)).forEach((x) => lay.push({ c: R.id, m: x.m, s: x.s })); } catch (e) {} }
          let shot = ''; if (probs.length || lay.length) { shot = 'fail/rotate-' + dn + '-' + mode + '/' + name; await page.screenshot({ type: 'jpeg', quality: 55, path: path.join(OUT, 'shots', shot) }); }
          probs.forEach(([m]) => add(t, up + '↔' + side, mode, 'rotate', m, '', shot));
          lay.forEach((f) => add(t, size + ' after rotating', mode, f.c, f.m, f.s, shot));
          sink.checked++;
        }
      } catch (e) { add(t, up + '↔' + side, mode, 'rotate', 'rotation test crashed: ' + String(e.message).split('\n')[0].slice(0, 80)); await fresh(); }
    }
    await ctx.close();
  }
  await browser.close(); if (server) server.close();
  const mins = Math.round((Date.now() - t0) / 60000);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ run: 'rotate', base, quick: QUICK, sizes: [], modes: ['tab', 'app'], targets: pages.map((t) => ({ id: t.id, kind: t.kind, r: t.r, p: t.p })), zoom: {}, skips: sink.skips, checked: sink.checked, mins, issues: sink.issues }));
  log('done in ' + mins + ' min: ' + sink.issues.length + ' raw problems over ' + sink.checked + ' rotations');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
