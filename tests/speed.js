#!/usr/bin/env node
// Speed checks. node tests/speed.js [--quick] [--base=URL] [--out=dir]
// Two devices: a mid-range phone on slow 4G (Lighthouse's Moto G Power: 412x823, 4x slower CPU,
// 150 ms latency, 1.6 Mb/s down) and a desktop (1440x900, 40 ms, 10 Mb/s). Each runs a first visit
// (empty cache) and a repeat visit (service worker installed), so the numbers show both.
// Writes speed.json (problems, worst first) and speed.md into the out folder; run.js and
// sweep.sh fold them into issues.md / site_issues.md marked "speed".
const path = require('path'), fs = require('fs');
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) {} }
const IP = require('./lib/inpage'), FONTS = require('./lib/fonts'), serve = require('./lib/serve'), { discover } = require('./lib/discover');

// Targets: anything slower fails. Change here (and in README) if Zale moves a target.
const TARGETS = {
  phone: { entryContent: 2500, entryUsable: 4000, pageContent: 2500, pageContentWarm: 1500, pageUsable: 3500, map: 3000, cls: 0.1, entryKB: 2000, pageKB: 1000, slowReq: 3000, bigFileKB: 500 },
  desktop: { entryContent: 1500, entryUsable: 2500, pageContent: 1500, pageContentWarm: 800, pageUsable: 2000, map: 3000, cls: 0.1, entryKB: 3000, pageKB: 1500, slowReq: 1000, bigFileKB: 1000 },
};
const PROFILES = {
  phone: { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, cpu: 4, net: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 } },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, cpu: 1, net: { latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (10 * 1024 * 1024) / 8 } },
};
const arg = (k, d) => { const a = process.argv.find((x) => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : d; };
const QUICK = !!arg('quick');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(arg('out', path.join(__dirname, 'out', 'speed-' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, ''))));
fs.mkdirSync(OUT, { recursive: true });
const log = (s) => { const l = new Date().toTimeString().slice(0, 8) + ' speed ' + s; console.log(l); fs.appendFileSync(path.join(OUT, 'speed-log.txt'), l + '\n'); };
const kb = (b) => Math.round(b / 1024);
const sec = (ms) => (ms / 1000).toFixed(1) + ' s';

// Pages measured: every main page, the map, and a few of each page type (same layout, so a sample tells the story).
function pickPages(all, quick) {
  const per = quick ? { past: 1, act: 1, artist: 1, hood: 1 } : { past: 3, act: 3, 'act-plain': 1, artist: 3, hood: 3, story: 2, page: 2, tickets: 1 };
  const want = (t) => t.kind === 'view' && !/^home$/.test(t.id) && (!quick || /^(hoods|lineup|why)$/.test(t.id));
  const n = {}; const pick = all.filter((t) => { if (want(t)) return true; if (!(t.kind in per)) return false; if ((t.kind === 'past' && /2024|2019|2010/.test(t.p.y)) || /geese/.test(t.id)) return true; n[t.kind] = (n[t.kind] || 0) + 1; return n[t.kind] <= per[t.kind] && t.kind !== 'past'; });
  if (!pick.some((t) => t.id === 'hoods')) pick.unshift({ id: 'hoods', kind: 'view', r: 'hoods', p: {} });
  return pick;
}

// --- in-page helpers --------------------------------------------------------
const INIT = () => {
  window.__sp = { lcp: 0, fcp: 0, lt: [], ls: [] };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__sp.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__sp.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__sp.lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__sp.ls.push([e.startTime, e.value]); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
};
// "Main content shown": the page heading is up and every image on screen has finished drawing.
// Map view: the farm map and its neighborhood layer are drawn inside the map frame.
const CONTENT = async (o) => {
  const t0 = o.t0, until = t0 + o.cap, sleep = (t) => new Promise((r) => setTimeout(r, t));
  const imgsDone = (doc, vh, vw) => { let n = 0; for (const im of doc.querySelectorAll('img')) { const r = im.getBoundingClientRect(); if (r.width < 8 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw || !im.checkVisibility()) continue; n++; if (!im.complete) return -1; } return n; };
  const bgDone = async (doc, vh) => { for (const el of doc.querySelectorAll('[style*="background"]')) { const r = el.getBoundingClientRect(); if (r.width < 100 || r.bottom < 0 || r.top > vh) continue; const m = getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)/); if (!m) continue; const U = new URL(m[1], location.href); if (U.origin !== location.origin) continue; /* outside images: their hosts may be blocked in cloud tests */ const e = performance.getEntriesByName(U.href); if (!e.length || !e[0].responseEnd) return false; } return true; };
  while (performance.now() < until) {
    if (o.map) {
      const f = document.querySelector('#pk-farmmap iframe'); const d = f && f.contentDocument;
      if (d && d.readyState === 'complete' && f.getBoundingClientRect().height > 100) {
        const w = f.contentWindow, vh = w.innerHeight, vw = w.innerWidth;
        const rs = w.performance.getEntriesByType('resource');
        const base = rs.some((e) => /\/farmmap\/(map\.webp|t\/)/.test(e.name) && e.responseEnd), layer = rs.some((e) => (o.lit ? /\/farmmap\/l\// : /\/farmmap\/(ic|l)\//).test(e.name) && e.responseEnd);
        const lastNet = rs.filter((e) => /\/farmmap\/(map\.webp|t\/|l\/|ic\/)/.test(e.name)).reduce((m, e) => Math.max(m, e.responseEnd || 1e12), 0);
        if (base && layer && imgsDone(d, vh, vw) >= 0 && w.performance.now() - lastNet > 300) return { ms: Math.round(performance.now() - t0), base, layer };
      }
    } else {
      const h = [...document.querySelectorAll('#root h1, main h1, #root h2, main h2')].find((e) => e.checkVisibility() && e.getBoundingClientRect().top < innerHeight);
      if (h && imgsDone(document, innerHeight, innerWidth) >= 0 && (await bgDone(document, innerHeight))) return { ms: Math.round(performance.now() - t0) };
    }
    await sleep(50);
  }
  return { ms: o.cap, timeout: true };
};
// Usable: content is shown and the main thread has had no long task for 1 s.
const USABLE = async (o) => {
  const sleep = (t) => new Promise((r) => setTimeout(r, t)); const t0 = o.t0, start = t0 + o.content;
  while (performance.now() < t0 + o.cap) { const lt = window.__sp.lt.filter((x) => x[0] + x[1] > start); const last = lt.length ? Math.max(...lt.map((x) => x[0] + x[1])) : start; if (performance.now() - last >= 1000) return { ms: Math.round(Math.max(last, start) - t0), tbt: Math.round(lt.reduce((s, x) => s + Math.max(0, x[1] - 50), 0)) }; await sleep(100); }
  return { ms: o.cap, timeout: true, tbt: 0 };
};
// What's on the page vs what was downloaded.
const AUDIT = (o) => {
  const vh = innerHeight, dpr = devicePixelRatio, res = {}; performance.getEntriesByType('resource').forEach((e) => (res[e.name] = e));
  const out = { oversized: [], early: [] };
  const seen = new Set();
  for (const im of document.querySelectorAll('img')) {
    const u = im.currentSrc || im.src; if (!u || seen.has(u)) continue; const e = res[u]; const r = im.getBoundingClientRect();
    if (im.naturalWidth && r.width > 10 && im.checkVisibility()) {
      const need = r.width * dpr * 1.5; const sz = e ? e.encodedBodySize || e.transferSize : 0;
      if (im.naturalWidth > need && sz > 60 * 1024) { seen.add(u); out.oversized.push({ u, nat: im.naturalWidth, shown: Math.round(r.width), bytes: sz, waste: Math.round(sz * (1 - Math.pow(r.width * dpr / im.naturalWidth, 2))) }); }
    }
    if (e && e.startTime >= o.since && r.top + scrollY > vh * 1.5 && im.loading !== 'lazy') { seen.add(u); out.early.push({ u, top: Math.round(r.top + scrollY), bytes: e.encodedBodySize || e.transferSize || 0 }); }
  }
  for (const v of document.querySelectorAll('video,iframe')) { const r = v.getBoundingClientRect(); const u = v.currentSrc || v.src; if (u && r.top + scrollY > vh * 1.5 && v.getAttribute('loading') !== 'lazy' && (v.tagName === 'IFRAME' || v.preload !== 'none')) out.early.push({ u, top: Math.round(r.top + scrollY), bytes: (res[u] && res[u].encodedBodySize) || 0, tag: v.tagName.toLowerCase() }); }
  out.cls = window.__sp.ls.filter((x) => x[0] >= o.since).reduce((s, x) => s + x[1], 0);
  return out;
};

// --- one device pass -----------------------------------------------------------
async function runProfile(browser, base, name, pages, problems, numbers) {
  const P = PROFILES[name], T = TARGETS[name];
  const ctx = await browser.newContext({ viewport: P.viewport, deviceScaleFactor: P.deviceScaleFactor, isMobile: P.isMobile, hasTouch: P.hasTouch, serviceWorkers: 'allow' });
  await ctx.addInitScript({ content: '(' + IP.initScript + ')("tab");(' + INIT + ')()' });
  await FONTS.route(ctx);
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', Object.assign({ offline: false }, P.net)); await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
  // request log from Chrome itself (sizes on the wire, timing, service-worker hits, failures)
  const reqs = new Map(); let seq = 0;
  cdp.on('Network.requestWillBeSent', (e) => { if (!reqs.has(e.requestId)) reqs.set(e.requestId, { n: seq++, url: e.request.url, t: e.timestamp, type: e.type }); });
  cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.sw = !!e.response.fromServiceWorker; r.disk = !!e.response.fromDiskCache; r.mime = e.response.mimeType; } });
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.size = e.encodedDataLength; r.end = e.timestamp; } });
  cdp.on('Network.loadingFailed', (e) => { const r = reqs.get(e.requestId); if (r) { r.fail = e.errorText; r.end = e.timestamp; } });
  const own = (u) => u.startsWith(base);
  const window_ = (from) => [...reqs.values()].filter((r) => r.n >= from);
  const flagReqs = (list, where, mode) => {
    for (const r of list) {
      if (r.fail && own(r.url) && !/ERR_ABORTED/.test(r.fail)) problems.push({ sub: 'failed', id: where, prof: name, mode, m: 'request failed (' + r.fail + '): ' + r.url.slice(base.length, base.length + 70), win: 1500 });
      else if (r.status >= 400) problems.push({ sub: 'failed', id: where, prof: name, mode, m: 'request returned ' + r.status + ': ' + (own(r.url) ? r.url.slice(base.length) : r.url).slice(0, 80), win: 1500 });
      const dur = r.end && r.t ? (r.end - r.t) * 1000 : 0;
      if (own(r.url) && dur > T.slowReq && !r.sw) problems.push({ sub: 'slow-request', id: where, prof: name, mode, m: 'slow request ' + sec(dur) + ' (' + kb(r.size || 0) + ' KB): ' + r.url.slice(base.length, base.length + 70), val: dur, win: Math.round(dur - T.slowReq) });
      if (own(r.url) && (r.size || 0) > T.bigFileKB * 1024 && mode === 'first visit') problems.push({ sub: 'big-file', id: where, prof: name, mode, m: 'large file ' + kb(r.size) + ' KB on the wire: ' + r.url.slice(base.length, base.length + 70), val: r.size, win: Math.round((r.size - T.bigFileKB * 1024) / P.net.downloadThroughput * 1000) });
    }
  };
  const audit = async (where, mode, since, tag) => {
    const a = await page.evaluate(AUDIT, { since });
    for (const o of a.oversized.slice(0, 5)) problems.push({ sub: 'oversized-image', id: where, prof: name, mode, m: 'image ' + o.nat + 'px wide shown at ' + o.shown + 'px (' + kb(o.bytes) + ' KB, about ' + kb(o.waste) + ' KB wasted): ' + o.u.replace(base, '').slice(-60), val: o.waste, win: Math.round(o.waste / P.net.downloadThroughput * 1000) });
    for (const o of a.early.slice(0, 5)) problems.push({ sub: 'loads-early', id: where, prof: name, mode, m: (o.tag || 'image') + ' far below the screen (' + o.top + 'px down) loads before it is needed' + (o.bytes ? ' (' + kb(o.bytes) + ' KB)' : '') + ': ' + o.u.replace(base, '').slice(-60), val: o.bytes, win: Math.max(100, Math.round(o.bytes / P.net.downloadThroughput * 1000)) });
    if (a.cls > T.cls) problems.push({ sub: 'shift', id: where, prof: name, mode, m: 'layout shifts while loading: score ' + a.cls.toFixed(2) + ' (target ' + T.cls + ')', val: a.cls, win: Math.round(a.cls * 3000) });
    return a;
  };
  const measureNav = async (t, mode) => {
    const isMap = t.r === 'hoods' || t.mapTap;
    const cap = 20000;
    if (t.mapTap) { await page.evaluate(() => { window.__app.reset('home'); window.scrollTo(0, 0); }); await page.waitForTimeout(1500); }
    const from = seq; const t0 = await page.evaluate(() => performance.now());
    if (!t.mapTap) await page.evaluate((t) => { const A = window.__app; A.reset('home'); window.scrollTo(0, 0); if (t.r !== 'home') A.go(t.r, t.p || {}); if (t.st) A.setState(t.st); }, t);
    if (t.mapTap) { const ok = await page.evaluate(() => { const els = [...document.querySelectorAll('#root *')].filter((e) => e.checkVisibility() && /neighborhood$/i.test((e.textContent || '').trim()) && e.children.length < 4 && (e.textContent || '').length < 40); const el = els[0]; if (!el) return false; const c = el.closest('[role=button],button,a,[onclick],figure,article,div[class*=hood],div[class*=nb]') || el; c.scrollIntoView({ block: 'center' }); c.click(); return true; }); if (!ok) return null; }
    const c = await page.evaluate(CONTENT, { t0, cap, map: isMap, lit: !!t.mapTap });
    const u = await page.evaluate(USABLE, { t0, content: c.ms, cap });
    await page.waitForTimeout(600);
    const list = window_(from); const bytes = list.reduce((s, r) => s + (r.sw ? 0 : r.size || 0), 0);
    return { c, u, list, bytes, t0 };
  };
  const record = async (t, mode, r) => {
    if (!r) { problems.push({ sub: 'map', id: t.id, prof: name, mode, m: 'could not find a neighborhood tile to tap', win: 0 }); return; }
    const isMap = t.r === 'hoods' || t.mapTap; const warm = mode !== 'first visit';
    const tgt = isMap ? T.map : warm ? T.pageContentWarm : T.pageContent;
    numbers.push({ id: t.id, prof: name, mode, content: r.c.ms, usable: r.u.ms, tbt: r.u.tbt, kb: kb(r.bytes), timeout: !!r.c.timeout });
    if (r.c.ms > tgt) problems.push({ sub: isMap ? 'map' : 'content', id: t.id, prof: name, mode, m: (isMap ? 'map and neighborhood layer drawn after ' : 'main content shows after ') + (r.c.timeout ? 'over ' : '') + sec(r.c.ms) + ' (target ' + sec(tgt) + ')', val: r.c.ms, win: r.c.ms - tgt });
    if (!isMap && r.u.ms > T.pageUsable) problems.push({ sub: 'usable', id: t.id, prof: name, mode, m: 'usable after ' + sec(r.u.ms) + ' (target ' + sec(T.pageUsable) + '; main thread blocked ' + r.u.tbt + ' ms)', val: r.u.ms, win: r.u.ms - T.pageUsable });
    if (!warm && r.bytes > T.pageKB * 1024) problems.push({ sub: 'download', id: t.id, prof: name, mode, m: 'opening it downloads ' + kb(r.bytes) + ' KB (target ' + T.pageKB + ' KB)', val: r.bytes, win: Math.round((r.bytes - T.pageKB * 1024) / P.net.downloadThroughput * 1000) });
    flagReqs(r.list, t.id, mode);
    await audit(t.id, mode, r.t0, isMap);
  };
  const entry = async (mode) => {
    const from = seq; const t0 = Date.now();
    if (mode === 'first visit') await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 }); else await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    const c = await page.evaluate(CONTENT, { t0: 0, cap: 60000, map: false });
    const lcp = await page.evaluate(() => Math.round(window.__sp.lcp || 0));
    const shown = Math.max(c.ms, lcp);
    const u = await page.evaluate(USABLE, { t0: 0, content: shown, cap: 60000 });
    await page.waitForLoadState('load', { timeout: 90000 }).catch(() => {}); await page.waitForTimeout(1500);
    const list = window_(from); const bytes = list.reduce((s, r) => s + (r.sw ? 0 : r.size || 0), 0);
    const T2 = mode === 'first visit' ? T.entryContent : Math.min(T.entryContent, T.pageContentWarm * 1.5);
    numbers.push({ id: 'home (site opens)', prof: name, mode, content: shown, usable: u.ms, tbt: u.tbt, kb: kb(bytes) });
    if (shown > T2) problems.push({ sub: 'content', id: 'home (site opens)', prof: name, mode, m: 'main content shows after ' + sec(shown) + ' (target ' + sec(T2) + ')', val: shown, win: shown - T2 });
    if (u.ms > T.entryUsable) problems.push({ sub: 'usable', id: 'home (site opens)', prof: name, mode, m: 'usable after ' + sec(u.ms) + ' (target ' + sec(T.entryUsable) + '; main thread blocked ' + u.tbt + ' ms)', val: u.ms, win: u.ms - T.entryUsable });
    if (mode === 'first visit' && bytes > T.entryKB * 1024) problems.push({ sub: 'download', id: 'home (site opens)', prof: name, mode, m: 'first visit downloads ' + kb(bytes) + ' KB before settling (target ' + T.entryKB + ' KB)', val: bytes, win: Math.round((bytes - T.entryKB * 1024) / P.net.downloadThroughput * 1000) });
    flagReqs(list, 'home (site opens)', mode); await audit('home (site opens)', mode, 0);
    await page.evaluate(() => { const c = document.querySelector('[aria-label="Cookie choices"]'); const d = c && [...c.querySelectorAll('button')].find((b) => /decline/i.test(b.textContent)); if (d) d.click(); });
    await page.evaluate(IP.hook);
    return t0;
  };

  // FIRST VISIT: empty cache. Unused code is measured on the way in.
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.startPreciseCoverage', { callCount: false, detailed: true }); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); await cdp.send('CSS.startRuleUsageTracking');
  log(name + ': first visit');
  await entry('first visit');
  if (name === 'phone') {
    const js = (await cdp.send('Profiler.takePreciseCoverage')).result; const css = (await cdp.send('CSS.stopRuleUsageTracking')).ruleUsage;
    await cdp.send('Profiler.stopPreciseCoverage');
    let jsTotal = 0, jsUsed = 0; for (const s of js) { if (!own(s.url) || !s.functions.length) continue; const whole = s.functions[0].ranges[0]; if (!whole) continue; const len = whole.endOffset; let unused = 0; for (const f of s.functions) for (const r of f.ranges) if (r.count === 0) unused += r.endOffset - r.startOffset; jsTotal += len; jsUsed += Math.max(0, len - unused); }
    const cssUsed = css.filter((r) => r.used).reduce((s, r) => s + (r.endOffset - r.startOffset), 0), cssTotal = css.reduce((s, r) => s + (r.endOffset - r.startOffset), 0);
    numbers.push({ id: 'code use at site open', prof: name, mode: 'first visit', jsKB: kb(jsTotal), jsUnusedKB: kb(jsTotal - jsUsed), cssKB: kb(cssTotal), cssUnusedKB: kb(cssTotal - cssUsed) });
    if (jsTotal - jsUsed > 300 * 1024) problems.push({ sub: 'unused-code', id: 'home (site opens)', prof: name, mode: 'first visit', m: kb(jsTotal - jsUsed) + ' KB of ' + kb(jsTotal) + ' KB script never runs on the first screen (parse cost on phones)', val: jsTotal - jsUsed, win: Math.round((jsTotal - jsUsed) / 1024 / 1024 * 600) });
    if (cssTotal - cssUsed > 100 * 1024) problems.push({ sub: 'unused-code', id: 'home (site opens)', prof: name, mode: 'first visit', m: kb(cssTotal - cssUsed) + ' KB of ' + kb(cssTotal) + ' KB style rules unused on the first screen', val: cssTotal - cssUsed, win: Math.round((cssTotal - cssUsed) / 1024 / 1024 * 400) });
  }
  // map from a cold start: the very first tap after the site opens
  const coldMap = await measureNav({ id: 'map (cold start)', r: 'hoods', p: {} }, 'first visit'); await record({ id: 'map (cold start)', r: 'hoods', p: {} }, 'first visit', coldMap);
  const tap = await measureNav({ id: 'map (from home tile tap)', mapTap: true }, 'first visit'); await record({ id: 'map (from home tile tap)', mapTap: true }, 'first visit', tap);
  for (const t of pages) { if (t.id === 'hoods') continue; log(name + ' first visit: ' + t.id); try { await record(t, 'first visit', await measureNav(t, 'first visit')); } catch (e) { problems.push({ sub: 'content', id: t.id, prof: name, mode: 'first visit', m: 'measurement crashed: ' + String(e.message).slice(0, 80), win: 0 }); } }

  // REPEAT VISIT: the service worker is installed and has cached what it keeps.
  await page.evaluate(async () => { try { await navigator.serviceWorker.ready; } catch (e) {} });
  // a real repeat visit comes later, after the service worker has finished its one-time map download; wait for that to settle
  // (the worker's own downloads don't show in the page's request log, so watch the cache grow instead; its big tier starts ~25 s after the page asks)
  { const count = () => page.evaluate(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n; }).catch(() => -1);
    const until = Date.now() + 240000; let last = await count(), quietSince = Date.now();
    while (Date.now() < until) { await page.waitForTimeout(3000); const n = await count(); if (n !== last) { last = n; quietSince = Date.now(); } else if (Date.now() - quietSince > 35000) break; }
    log(name + ': service worker cache settled at ' + last + ' files'); }
  log(name + ': repeat visit');
  const fromW = seq; await entry('repeat visit');
  const wMap = await measureNav({ id: 'map (cold start)', r: 'hoods', p: {} }, 'repeat visit'); await record({ id: 'map (cold start)', r: 'hoods', p: {} }, 'repeat visit', wMap);
  const wTap = await measureNav({ id: 'map (from home tile tap)', mapTap: true }, 'repeat visit'); await record({ id: 'map (from home tile tap)', mapTap: true }, 'repeat visit', wTap);
  for (const t of pages) { if (t.id === 'hoods') continue; try { await record(t, 'repeat visit', await measureNav(t, 'repeat visit')); } catch (e) {} }
  // service-worker cache gaps: own files fetched on the repeat visit that no cache holds (pages, data and the map page are fresh-from-network by Zale's rule, but must still be saved for offline)
  const urls = [...new Set(window_(fromW).filter((r) => own(r.url) && !r.fail && r.status === 200 && !/sw\.js/.test(r.url)).map((r) => r.url))];
  const miss = await page.evaluate(async (urls) => { const out = []; for (const u of urls) { try { if (!(await caches.match(u, { ignoreVary: true }))) out.push(u); } catch (e) {} } return out; }, urls);
  const bypass = window_(fromW).filter((r) => own(r.url) && !r.sw && !r.fail && !/sw\.js/.test(r.url)).map((r) => r.url);
  const missSize = (u) => { const r = [...reqs.values()].filter((x) => x.url === u && x.size).pop(); return r ? r.size : 0; };
  for (const u of miss.slice(0, 12)) problems.push({ sub: 'not-cached', id: 'service worker', prof: name, mode: 'repeat visit', m: 'not kept by the service worker (re-downloaded on repeat visits, missing offline' + (missSize(u) ? ', ' + kb(missSize(u)) + ' KB' : '') + '): ' + u.slice(base.length, base.length + 70), val: missSize(u), win: Math.max(50, Math.round(missSize(u) / P.net.downloadThroughput * 1000)) });
  if (miss.length > 12) problems.push({ sub: 'not-cached', id: 'service worker', prof: name, mode: 'repeat visit', m: '…and ' + (miss.length - 12) + ' more files not kept by the service worker', win: 0 });
  for (const u of [...new Set(bypass)].slice(0, 5)) problems.push({ sub: 'not-cached', id: 'service worker', prof: name, mode: 'repeat visit', m: 'request skipped the service worker on a repeat visit: ' + u.slice(base.length, base.length + 70), win: 100 });
  await ctx.close();
}

exports.run = async (browser, base, opts = {}) => {
  const all = opts.targets || (await discover(browser, base, log));
  const pages = pickPages(all, QUICK || opts.quick);
  const problems = [], numbers = [];
  const profs = opts.profiles || (QUICK || opts.quick ? ['phone'] : ['phone', 'desktop']);
  for (const p of profs) { log(p + ': ' + pages.length + ' pages + map'); await runProfile(browser, base, p, pages, problems, numbers); }
  // one line per problem; dedupe identical messages across pages; biggest win first
  const seen = new Map();
  for (const x0 of problems) {
    const x = Object.assign({}, x0); const fileLevel = /oversized|loads-early|big-file|unused|failed/.test(x.sub);
    if (x.sub === 'failed') { const m = x.m.match(/returned (\d+): (https?:\/\/[^/]+)\/.*?([^/]+)$/); if (m) { x.m = 'requests returned ' + m[1] + ' from ' + m[2].replace(/^https?:\/\//, '') + ' (e.g. …/' + m[3] + ')'; } }
    const k = x.sub + '|' + x.prof + '|' + (fileLevel ? '' : x.mode) + '|' + x.m.replace(/\(e\.g\.[^)]*\)/, '').replace(/\d+(\.\d+)?/g, '#') + '|' + (fileLevel || x.sub === 'not-cached' ? '' : x.id);
    const g = seen.get(k);
    if (g) { g.pages.add(x.id); g.modes.add(x.mode); g.n++; g.win = Math.max(g.win, x.win || 0); } else seen.set(k, Object.assign(x, { pages: new Set([x.id]), modes: new Set([x.mode]), n: 1 }));
  }
  for (const g of seen.values()) { if (g.modes.size > 1) g.mode = 'first + repeat visit'; if (g.sub === 'failed' && g.n > 1) g.m = g.m.replace('requests returned', g.n + ' requests returned'); }
  const list = [...seen.values()].sort((a, b) => (b.win || 0) - (a.win || 0));
  const lines = list.map((x) => '- Speed · ' + [...x.pages].slice(0, 3).join(', ') + (x.pages.size > 3 ? ' +' + (x.pages.size - 3) + ' more' : '') + ' · ' + x.prof + ' ' + x.mode + ' · ' + x.sub + ' · ' + x.m);
  const res = { targets: TARGETS, profiles: Object.fromEntries(Object.entries(PROFILES).map(([k, v]) => [k, { viewport: v.viewport, cpu: v.cpu + 'x slower', latencyMs: v.net.latency, downKbps: Math.round(v.net.downloadThroughput * 8 / 1024) }])), numbers, problems: list.map((x) => Object.assign({}, x, { pages: [...x.pages], modes: [...x.modes], key: 'speed|' + x.sub + '|' + x.prof + '|' + x.mode + '|' + x.m.replace(/\(e\.g\.[^)]*\)/, '').replace(/\d+(\.\d+)?/g, '#') + '|' + [...x.pages][0] })), lines };
  fs.writeFileSync(path.join(OUT, 'speed.json'), JSON.stringify(res, null, 1));
  const tbl = '| page | device | visit | content shown | usable | downloaded |\n|---|---|---|---|---|---|\n' + numbers.filter((n) => n.content !== undefined).map((n) => '| ' + n.id + ' | ' + n.prof + ' | ' + n.mode + ' | ' + sec(n.content) + (n.timeout ? '+' : '') + ' | ' + sec(n.usable) + ' | ' + n.kb + ' KB |').join('\n');
  fs.writeFileSync(path.join(OUT, 'speed.md'), '#### Speed (biggest win first)\n' + (lines.join('\n') || '- none') + '\n\n<details><summary>Measured numbers</summary>\n\n' + tbl + '\n</details>\n');
  log('done: ' + list.length + ' speed problems; ' + path.join(OUT, 'speed.md'));
  return res;
};

if (require.main === module) (async () => {
  let server, base = arg('base'); if (!base) [server, base] = await serve(ROOT); if (!base.endsWith('/')) base += '/';
  const browser = await pw.chromium.launch();
  await exports.run(browser, base, {});
  await browser.close(); if (server) server.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
