#!/usr/bin/env node
// Pickathon site QA sweep. One command: node tests/run.js        (see tests/README.md)
//   --quick            build-chat pre-push run: every page type, 3 sizes, a few of each template
//   --base=URL         test a served site instead of this checkout (default: serve the repo folder)
//   --sizes=390x844,1440x900   --modes=tab,app   --only=regex (target ids)   --workers=2
//   --prev=keys.json   mark issues not in a previous run as NEW (used by the morning task)
//   --shots=ref|fail|none  ref (default) = reference screens for Design Review + failures
const path = require('path'), fs = require('fs'), http = require('http');
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) {} }
if (!pw) { console.error('Playwright not found (npm i -g playwright)'); process.exit(2); }
const IP = require('./lib/inpage'), FONTS = require('./lib/fonts'), { discover } = require('./lib/discover'), RULES = require('./rules'), report = require('./lib/report');
let PNG; for (const p of ['playwright-core/lib/utilsBundle', '/opt/npm-tools/node_modules/playwright-core/lib/utilsBundle']) { try { PNG = require(p).PNG; if (PNG) break; } catch (e) {} }

const arg = (k, d) => { const a = process.argv.find((x) => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : d; };
const QUICK = !!arg('quick');
const ALL_SIZES = ['360x800', '390x844', '820x1180', '1180x820', '1024x768', '1440x900'];
const SIZES = String(arg('sizes', QUICK ? '390x844,820x1180,1440x900' : ALL_SIZES.join(','))).split(',');
const MODES = String(arg('modes', 'tab,app')).split(',');
const WORKERS = +arg('workers', 2), ONLY = arg('only') ? new RegExp(arg('only')) : null, SHOTS = arg('shots', 'ref');
const ROOT = path.resolve(__dirname, '..');
const RUN = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1-$2');
const OUT = path.resolve(arg('out', path.join(__dirname, 'out', RUN)));
fs.mkdirSync(OUT, { recursive: true });
const log = (s) => { const l = new Date().toTimeString().slice(0, 8) + ' ' + s; console.log(l); fs.appendFileSync(path.join(OUT, 'log.txt'), l + '\n'); };
// Touch devices: phones and tablets. 1024x768 and 1440x900 are laptops/desktops.
const isTouch = (w, h) => !(w === 1024 && h === 768) && w <= 1180;
const TEMPLATE = new Set(['artist', 'story', 'page', 'act', 'act-plain', 'hood', 'past']);

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json' };
  return new Promise((res) => { const s = http.createServer((q, r) => { let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'content-type': types[path.extname(fp).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(r); }); s.listen(0, '127.0.0.1', () => res([s, 'http://127.0.0.1:' + s.address().port + '/'])); });
}

function pickQuick(list) {
  const per = { artist: 3, story: 2, page: 2, act: 3, 'act-plain': 2, hood: 3, past: 3 }, n = {};
  return list.filter((t) => { if (!(t.kind in per)) return true; if (t.kind === 'past' && t.p.y === '2024') return true; if (t.kind === 'act' && /geese/.test(t.id)) return true; n[t.kind] = (n[t.kind] || 0) + 1; return n[t.kind] <= per[t.kind]; });
}

function diffPct(a, b) {
  if (!PNG) return -1; try { const A = PNG.sync.read(a), B = PNG.sync.read(b); if (A.width !== B.width || A.height !== B.height) return 100; let d = 0; for (let i = 0; i < A.data.length; i += 16) if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 60) d++; return Math.round((d / (A.data.length / 16)) * 1000) / 10; } catch (e) { return -1; }
}

async function zoomCheck(ctx, page, mode, touch) {
  const z = await page.evaluate(IP.zoomState); let pinch = null;
  if (touch) { try { const cdp = await ctx.newCDPSession(page); await cdp.send('Input.synthesizePinchGesture', { x: 180, y: 300, scaleFactor: 2, relativeSpeed: 800, gestureSourceType: 'touch' }); await page.waitForTimeout(400); pinch = await page.evaluate(() => (window.visualViewport ? visualViewport.scale : 1)); } catch (e) { pinch = null; } }
  const iss = [];
  if (mode === 'app') {
    if (!z.noScale) iss.push({ c: 'zoom', m: 'installed app still allows pinch zoom (viewport meta: "' + z.meta + '")' });
    if (pinch && pinch > 1.05) iss.push({ c: 'zoom', m: 'pinch gesture zoomed the installed app to ' + pinch.toFixed(2) + 'x' });
    if (!z.manip) iss.push({ c: 'zoom', m: 'installed app allows double-tap zoom (no touch-action: manipulation)' });
    if (!z.gesture) iss.push({ c: 'zoom', m: 'installed app has no iOS gesturestart block (iOS ignores the viewport meta)' });
  } else {
    if (z.noScale) iss.push({ c: 'zoom', m: 'browser tab blocks zoom; it should stay on (viewport meta: "' + z.meta + '")' });
  }
  return { z, pinch, iss };
}

async function runCombo(browser, base, targets, size, mode, sink) {
  const [w, h] = size.split('x').map(Number), touch = isTouch(w, h), combo = size + '-' + mode;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch, serviceWorkers: 'block', deviceScaleFactor: 1 });
  await ctx.addInitScript({ content: '(' + IP.initScript + ')(' + JSON.stringify(mode) + ')' });
  await FONTS.route(ctx, log);
  let page, errs = [], bad = [];
  const fresh = async () => {
    if (page) await page.close().catch(() => {});
    page = await ctx.newPage(); errs = []; bad = [];
    page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0].slice(0, 140)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push(m.text().split('\n')[0].slice(0, 140)); });
    page.on('response', (r) => { if (r.status() >= 400 && !/favicon|google-analytics|googletagmanager/.test(r.url())) bad.push(r.status() + ' ' + (r.url().startsWith(base) ? r.url().slice(base.length, base.length + 80) : r.url().slice(0, 90))); });
    page.on('requestfailed', (r) => { if (r.url().startsWith(base)) bad.push('failed ' + r.url().slice(base.length, base.length + 80)); });
    await page.goto(base, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(1200);
    await page.evaluate(() => { // test housekeeping: answer the cookie banner, hide the dev-only "Site state" bar
      const c = document.querySelector('[aria-label="Cookie choices"]'); const d = c && [...c.querySelectorAll('button')].find((b) => /decline/i.test(b.textContent)); if (d) d.click();
      const s = document.querySelector('select[aria-label="Site state"]'); if (s) { let p = s; while (p.parentElement && p.parentElement !== document.body && getComputedStyle(p).position !== 'fixed') p = p.parentElement; p.setAttribute('data-pkqa-ignore', '1'); p.style.display = 'none'; }
    });
    await page.evaluate(IP.hook); await page.evaluate(() => { const A = window.__app; if (!A) return; A.setState({}); window.__pkBase = { season: A.state.season, today: A.state.today, pvS: A.state.pvS }; });
    await page.waitForTimeout(150);
    await page.evaluate(() => { if (window.__app) window.__pkBase = { season: window.__app.state.season, today: window.__app.state.today, pvS: window.__app.state.pvS }; });
  };
  await fresh();
  const zc = await zoomCheck(ctx, page, mode, touch);
  zc.iss.forEach((i) => sink.issue({ t: { id: 'site (zoom)', kind: 'zoom' }, size, mode, c: i.c, m: i.m, s: '', shot: '' }));
  sink.zoom[combo] = { meta: zc.z.meta, noScale: zc.z.noScale, touchAction: zc.z.touchAction, gesture: zc.z.gesture, pinch: zc.pinch };
  await fresh();
  let n = 0, tmplRef = {};
  for (const t of targets) {
    if (++n % 40 === 0) await fresh();
    const e0 = errs.length, b0 = bad.length;
    let st = 'err';
    try { st = await page.evaluate(IP.goto, t); } catch (e) { st = 'err ' + String(e.message).slice(0, 80); await fresh(); }
    if (st === 'no-control') { sink.skip(t, size, mode, 'control not shown at this size'); continue; }
    if (st !== 'ok') { sink.issue({ t, size, mode, c: 'script', m: 'could not open page: ' + st, s: '', shot: '' }); continue; }
    try {
      await page.waitForTimeout(t.kind === 'panel' ? 700 : 900);
      const ls0 = await page.evaluate(() => (window.__pkLS || []).length);
      const A = await page.evaluate(IP.boxes); const pa = await page.screenshot({ type: 'png' });
      await page.waitForTimeout(1800);
      const B = await page.evaluate(IP.boxes); const pb = await page.screenshot({ type: 'png' });
      const found = await page.evaluate(IP.checks, { touch });
      for (const R of RULES) { if (R.when && !R.when({ size, mode, target: t, touch })) continue; try { (await page.evaluate(R.run)).forEach((x) => found.push({ c: R.id, m: x.m, s: x.s || '' })); } catch (e) {} }
      // layout shift / flicker between the two screenshots
      let moved = 0, first = ''; for (const k in A.b) { const a = A.b[k], b = B.b[k]; if (!b || a[4] !== b[4]) continue; if (Math.abs(a[0] - b[0]) > 3 || Math.abs(a[1] - b[1]) > 3 || Math.abs(a[3] - b[3]) > 3) { if (!moved) first = a[4]; moved++; } }
      const cls = (await page.evaluate((n) => (window.__pkLS || []).slice(n).reduce((s, e) => s + e.v, 0), ls0));
      const dp = diffPct(pa, pb), animating = await page.evaluate(() => { try { return document.getAnimations().filter((a) => a.playState === 'running').length + [...document.querySelectorAll('video,iframe')].filter((v) => v.checkVisibility()).length; } catch (e) { return 1; } });
      if (moved >= 3 || (cls > 0.02 && dp > 1)) found.push({ c: 'shift', m: 'layout moves after load: ' + moved + ' items shifted' + (cls ? ', shift score ' + cls.toFixed(3) : '') + (dp >= 0 ? ', ' + dp + '% of pixels changed' : ''), s: first });
      else if (dp > 20 && moved >= 1 && !animating) found.push({ c: 'flicker', m: dp + '% of the screen changed a few seconds after load with nothing animating', s: '' });
      errs.slice(e0).forEach((m) => found.push({ c: 'script', m: 'script error: ' + m, s: '' }));
      bad.slice(b0).filter((x) => !/favicon/.test(x)).slice(0, 4).forEach((m) => found.push({ c: 'broken-file', m: 'file missing: ' + m, s: '' }));
      // screenshots
      const name = (t.id.replace(/[^a-zA-Z0-9@:._-]+/g, '-').replace(/:/g, '_')).slice(0, 80) + '.jpg';
      let shot = '';
      const wantRef = SHOTS === 'ref' && mode === 'tab' && (!TEMPLATE.has(t.kind) || (tmplRef[t.kind] = (tmplRef[t.kind] || 0) + 1) <= 6 || t.id === 'past:2024' || /geese/.test(t.id));
      if (found.length && SHOTS !== 'none') { shot = 'fail/' + combo + '/' + name; await page.screenshot({ type: 'jpeg', quality: 55, path: path.join(OUT, 'shots', shot) }); }
      if (wantRef) { const ref = 'ref/' + combo + '/' + name; if (shot) { fs.mkdirSync(path.dirname(path.join(OUT, 'shots', ref)), { recursive: true }); fs.copyFileSync(path.join(OUT, 'shots', shot), path.join(OUT, 'shots', ref)); } else { await page.screenshot({ type: 'jpeg', quality: 55, path: path.join(OUT, 'shots', ref) }); } }
      found.forEach((f) => sink.issue({ t, size, mode, c: f.c, m: f.m, s: f.s, shot }));
      sink.pass(t, size, mode, found.length);
    } catch (e) { sink.issue({ t, size, mode, c: 'script', m: 'test crashed on this page: ' + String(e.message).split('\n')[0].slice(0, 100), s: '', shot: '' }); await fresh(); }
  }
  await ctx.close();
}

async function merge(dirs) { // combine parts run separately (e.g. sizes split across two sessions) into one report
  const parts = dirs.map((d) => JSON.parse(fs.readFileSync(path.join(d, 'results.json'), 'utf8')));
  const sink = { issues: [], skips: [], zoom: {}, checked: 0 }; const tg = new Map(); const sizes = new Set(), modes = new Set();
  for (const r of parts) { sink.issues.push(...r.issues); sink.skips.push(...r.skips); Object.assign(sink.zoom, r.zoom); sink.checked += r.checked || 0; r.targets.forEach((t) => tg.set(t.id, t)); r.sizes.forEach((x) => sizes.add(x)); r.modes.forEach((x) => modes.add(x)); for (const sub of ['ref', 'fail']) { const src = path.join(path.dirname(path.join(dirs[parts.indexOf(r)], 'x')), 'shots', sub); if (fs.existsSync(src)) fs.cpSync(src, path.join(OUT, 'shots', sub), { recursive: true }); } }
  const prev = arg('prev') && fs.existsSync(arg('prev')) ? JSON.parse(fs.readFileSync(arg('prev'), 'utf8')) : null;
  const r = report.write(OUT, { run: RUN, base: parts[0].base, quick: parts[0].quick, sizes: ALL_SIZES.filter((x) => sizes.has(x)), modes: [...modes], targets: [...tg.values()], sink, prev, mins: parts.reduce((s, p) => s + (p.mins || 0), 0) });
  log('merged ' + dirs.length + ' parts: ' + r.groups + ' distinct problems, ' + r.newCount + ' new. Report: ' + path.join(OUT, 'issues.md'));
}

(async () => {
  if (arg('merge')) { await merge(String(arg('merge')).split(',')); return process.exit(0); }
  const t0 = Date.now(); let server, base = arg('base');
  if (!base) { [server, base] = await serve(); }
  if (!base.endsWith('/')) base += '/';
  log('QA run ' + RUN + ' on ' + base + (QUICK ? ' (quick)' : ' (full)') + ' -> ' + path.relative(process.cwd(), OUT));
  const browser = await pw.chromium.launch();
  let targets = await discover(browser, base, log);
  if (QUICK) targets = pickQuick(targets);
  if (ONLY) targets = targets.filter((t) => ONLY.test(t.id));
  const combos = []; for (const s of SIZES) for (const m of MODES) combos.push([s, m]);
  log(targets.length + ' pages/states x ' + combos.length + ' size/mode combos = ' + targets.length * combos.length + ' screens, ' + WORKERS + ' workers');
  const sink = { issues: [], skips: [], checked: 0, zoom: {},
    issue(x) { this.issues.push({ id: x.t.id, kind: x.t.kind, size: x.size, mode: x.mode, c: x.c, m: x.m, s: x.s, shot: x.shot }); },
    skip(t, size, mode, why) { this.skips.push({ id: t.id, size, mode, why }); },
    pass() { if (++this.checked % 200 === 0) log(this.checked + ' screens checked, ' + this.issues.length + ' problems so far'); } };
  const q = combos.slice();
  await Promise.all(Array.from({ length: Math.min(WORKERS, q.length) }, async () => { while (q.length) { const [s, m] = q.shift(); log('start ' + s + ' ' + m); await runCombo(browser, base, targets, s, m, sink); log('done ' + s + ' ' + m); } }));
  await browser.close(); if (server) server.close();
  const prev = arg('prev') && fs.existsSync(arg('prev')) ? JSON.parse(fs.readFileSync(arg('prev'), 'utf8')) : null;
  const r = report.write(OUT, { run: RUN, base, quick: QUICK, sizes: SIZES, modes: MODES, targets, sink, prev, mins: Math.round((Date.now() - t0) / 60000) });
  log('finished in ' + Math.round((Date.now() - t0) / 60000) + ' min: ' + r.groups + ' distinct problems (' + sink.issues.length + ' raw), ' + r.newCount + ' new. Report: ' + path.join(OUT, 'issues.md'));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
