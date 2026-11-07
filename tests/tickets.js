#!/usr/bin/env node
// Ticket check (Nov 19 sale). node tests/tickets.js [--base=URL] [--out=dir] [--quick]
// 1. Prices: every price on the Tickets page matches the live FMS feed, and the feed matches the FMS
//    admin list Site Build keeps in photo-catalog/fms_prices.txt ("<date>: 4-Day Pass=540, ..."), passed as --fms.
// 2. Fallback: with the feed blocked (no answer) or down (HTTP 500), the page falls back to data.json:
//    no blank cards, no script errors, no wrong "sold out".
// 3. Checkout: every pass type and every option in each step (getting there, camping, parking, days,
//    add-ons) builds an order whose lines, fee and total add up, and the checkout button reaches the real
//    checkout with the right event and ticket types. It stops at the payment step: it never types into
//    any field, never enters card details and never submits a payment. Pending test orders it leaves
//    are logged in ticket_test_orders.json so they can be deleted (with Zale's OK) before the merge.
// 4. Phone, tablet and desktop, each as a browser tab and as the installed app.
// Parts that need the feed or the real checkout report "waiting on feed" / "waiting on checkout wiring".
// No sign-in, no fan data: screenshots show only the public Tickets page.
const path = require('path'), fs = require('fs');
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) {} }
const IP = require('./lib/inpage'), FONTS = require('./lib/fonts'), serve = require('./lib/serve');
const arg = (k, d) => { const a = process.argv.find((x) => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : d; };
const ROOT = path.resolve(__dirname, '..'), QUICK = !!arg('quick');
const OUT = path.resolve(arg('out', path.join(__dirname, 'out', 'tickets')));
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const log = (s) => { const l = new Date().toTimeString().slice(0, 8) + ' tickets ' + s; console.log(l); fs.appendFileSync(path.join(OUT, 'log.txt'), l + '\n'); };
// The feed Site Build is building: any request to these is "the feed". Update when its URL is known.
const FEED = new RegExp(arg('feed', 'fms\\.pickathon\\.com/api/public/on-sale|/api/.*(on-?sale|ticket-types)'), 'i'); // Site Build's feed (index.html pkFeed)
// Pages that mean "payment step reached" (stop here) and fields that must never be touched.
const PAY_STEP = /stripe\.com|checkout\.stripe|squareup|paypal\.com|js\.stripe/i;
const DEVICES = { phone: { width: 390, height: 844, touch: true }, tablet: { width: 820, height: 1180, touch: true }, desktop: { width: 1440, height: 900, touch: false } };
const STATES = arg('states') ? String(arg('states')).split(',') : QUICK ? ['sale'] : ['sale', 'now']; // Nov 19 Holiday Sale, and whatever the site shows today

// --- in-page helpers ---------------------------------------------------------
const OPEN = (st) => { const A = window.__app; A.setState(st); A.reset('home'); A.go('tickets', {}); window.scrollTo(0, 0); };
const STEP1 = () => [...document.querySelectorAll('#root button[aria-label^="One more "]')].filter((b) => b.checkVisibility()).map((b) => b.getAttribute('aria-label').replace(/^One more /, ''));
// every pass card: name, the price text on the card, whether it says sold out
const CARDS = () => {
  const out = [];
  for (const b of document.querySelectorAll('#root button[aria-label^="One more "]')) {
    if (!b.checkVisibility()) continue; const name = b.getAttribute('aria-label').replace(/^One more /, '');
    let c = b; for (let i = 0; i < 6 && c.parentElement; i++) { c = c.parentElement; if ((c.innerText || '').includes(name) && /\$|Free/.test(c.innerText || '')) break; }
    const t = (c.innerText || '').replace(/\s+/g, ' ');
    out.push({ name, text: t.slice(0, 160), price: (t.match(/\$[\d,]+(\.\d\d)?/) || [''])[0], free: /\bFree\b/.test(t), sold: /sold out/i.test(t), bad: /NaN|undefined|null|\$\s*$/.test(t), disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' });
  }
  return out;
};
// options in later steps: on/off buttons (aria-pressed) and choice buttons inside step sections
const OPTIONS = () => {
  // every choice button in the order builder (between the pass picker and the order summary): on/off toggles and plain choice buttons
  const first = document.querySelector('#root button[aria-label^="One more "]'); if (!first) return [];
  const sum = [...document.querySelectorAll('#root *')].find((e) => /^Your order/.test((e.innerText || '').trim()) && /Total/.test(e.innerText || '') && (e.innerText || '').length < 3000);
  let box = first; while (box.parentElement && !(box.innerText || '').includes('Your order')) box = box.parentElement;
  const skip = /^(one (more|fewer)|sign in|new to pickathon|here’s your|already have|checkout|secure checkout|add a pass|pick your days|choose an option|tell us how|pick a camping|finish above|🎁|this is a gift)/i;
  return [...box.querySelectorAll('button, [role=radio], [role=checkbox], [aria-pressed]')].filter((b) => b.checkVisibility() && !(sum && sum.contains(b)) && !skip.test(((b.getAttribute('aria-label') || '') + ' ' + (b.innerText || '')).trim()) && !/^[+−-]$/.test((b.innerText || '').trim()) && !/\?\s*\+?$/.test((b.innerText || '').trim()))
    .map((b) => { const t = (b.getAttribute('aria-label') || b.innerText || '').replace(/\s+/g, ' ').trim(); const cs = String(b.className || ''); return { label: t.replace(/^✓\s*/, '').slice(0, 60), on: b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true' || /^✓/.test(t) || /\b(on|sel|selected|active|is-on)\b/.test(cs), sold: /sold out/i.test(b.innerText || ''), disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' }; })
    .filter((o, i, a) => o.label && a.findIndex((x) => x.label === o.label) === i);
};
const CLICK = (label) => { const el = [...document.querySelectorAll('#root button, #root [role=button], #root [role=radio], #root [role=checkbox], #root [aria-pressed]')].find((b) => b.checkVisibility() && ((b.getAttribute('aria-label') || '') === label || (b.innerText || '').replace(/\s+/g, ' ').trim().replace(/^✓\s*/, '').startsWith(label))); if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; };
// the checkout button and what it says is missing
const PAY = () => { const b = [...document.querySelectorAll('#root button')].find((x) => x.checkVisibility() && /checkout/i.test(x.innerText || '')); const lab = [...document.querySelectorAll('#root button')].filter((x) => x.checkVisibility()).map((x) => (x.innerText || '').trim()).find((t) => /^(add a pass|pick your days|choose an option|tell us how|pick a camping|finish above)/i.test(t)); return { ready: !!b && !b.disabled && b.getAttribute('aria-disabled') !== 'true', label: b ? b.innerText.trim() : '', missing: lab || '' }; };
// order summary: lines "N × Name  $X", fee, total
const ORDER = () => {
  const box = [...document.querySelectorAll('#root *')].find((e) => /^Your order/.test((e.innerText || '').trim()) && e.innerText.length < 3000 && /Total/.test(e.innerText));
  const t = box ? box.innerText : ''; const lines = [];
  for (const m of t.matchAll(/(\d+)\s*×\s*([^\n$]+?)\s*\n?\s*(\$[\d,]+(?:\.\d\d)?|Free)/g)) lines.push({ n: +m[1], name: m[2].trim(), amt: m[3] === 'Free' ? 0 : +m[3].replace(/[$,]/g, '') });
  const fee = (t.match(/service fee \((\$[\d,.]+)\)/) || [])[1]; const total = (t.match(/Total\s*\n?\s*(\$[\d,.]+)/) || [])[1];
  return { lines, fee: fee ? +fee.replace(/[$,]/g, '') : null, total: total ? +total.replace(/[$,]/g, '') : null, text: t.replace(/\s+/g, ' ').slice(0, 300) };
};

async function run() {
  let server, base = arg('base'); if (!base) [server, base] = await serve(ROOT); if (!base.endsWith('/')) base += '/';
  const t0 = Date.now(); const browser = await pw.chromium.launch();
  const res = { run: new Date().toISOString(), checks: [], waiting: [], orders: [], prices: {} };
  const fail = (c, where, m, shot) => res.checks.push({ ok: false, c, where, m, shot: shot || '' });
  const pass = (c, where, m) => res.checks.push({ ok: true, c, where, m });
  const wait = (c, m) => { if (!res.waiting.some((w) => w.c === c)) res.waiting.push({ c, m }); };
  let feedSeen = false, feedBody = null, feedErr = '';

  const devs = arg('devices') ? String(arg('devices')).split(',') : QUICK ? ['phone', 'desktop'] : Object.keys(DEVICES);
  for (const dn of devs) for (const mode of (arg('modes') ? String(arg('modes')).split(',') : ['tab', 'app'])) for (const feedMode of ['live', 'blocked', 'down']) for (const S of STATES) {
    if (QUICK && (mode === 'app' && feedMode !== 'live')) continue;
    const D = DEVICES[dn], where = dn + ' ' + mode + ' · ' + S + ' · feed ' + feedMode;
    const ctx = await browser.newContext({ viewport: { width: D.width, height: D.height }, isMobile: D.touch, hasTouch: D.touch, serviceWorkers: 'block' });
    await ctx.addInitScript({ content: '(' + IP.initScript + ')(' + JSON.stringify(mode) + ')' }); await FONTS.route(ctx);
    // feed: live = pass through; blocked = no answer; down = HTTP 500
    await ctx.route(FEED, async (r) => { feedSeen = true; if (feedMode === 'blocked') return r.abort('failed'); if (feedMode === 'down') return r.fulfill({ status: 500, body: 'down' }); const resp = await r.fetch().catch((e) => { feedErr = 'no answer (' + String(e.message).split('\n')[0].slice(0, 60) + ')'; return null; }); if (!resp) return r.abort('failed'); if (resp.status() !== 200) feedErr = 'HTTP ' + resp.status(); try { feedBody = await resp.json(); } catch (e) { feedErr = feedErr || 'not JSON'; } return r.fulfill({ response: resp }); });
    // checkout: allow navigation, but block anything that would submit a payment
    await ctx.route(/./, (r) => { const q = r.request(); if (q.method() === 'POST' && PAY_STEP.test(q.url()) && !/\.js(\?|$)/.test(q.url())) return r.abort('blockedbyclient'); return r.fallback(); });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0].slice(0, 120)));
    try {
      await page.goto(base, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(1000);
      await page.evaluate(() => { const c = document.querySelector('[aria-label="Cookie choices"]'); const d = c && [...c.querySelectorAll('button')].find((b) => /decline/i.test(b.textContent)); if (d) d.click(); });
      await page.evaluate(IP.hook);
      const st = S === 'sale' ? { pvS: 'sale', season: 'off', today: '2026-11-19' } : {};
      const shot = async (name) => { const f = 'shots/' + dn + '-' + mode + '-' + S + '-' + feedMode + '-' + name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) + '.jpg'; await page.screenshot({ type: 'jpeg', quality: 55, path: path.join(OUT, f) }); return f; };
      await page.evaluate(OPEN, st); await page.waitForTimeout(1500);

      // (1/2) cards: every pass shows a real price; sold-out only where the source says so
      const cards = await page.evaluate(CARDS); const e0 = errs.length;
      if (!cards.length) {
        const pre = await page.evaluate(() => /sale begins|notify me|remind/i.test(document.querySelector('#root').innerText));
        const saleOpen = S === 'sale' || new Date() >= new Date('2026-11-19T00:00:00-08:00');
        if (pre && !saleOpen) pass('presale', where, 'pre-sale page with the reminder sign-up, as expected before Nov 19');
        else fail('blank', where, 'Tickets page shows no pass cards' + (saleOpen ? ' while the sale is open' : ''), await shot('no-cards'));
        await ctx.close(); continue;
      }
      for (const c of cards) {
        if (c.bad || (!c.price && !c.free)) fail('blank', where, c.name + ': card shows no usable price ("' + c.text.slice(0, 60) + '")', await shot('blank-' + c.name));
        res.prices[c.name] = res.prices[c.name] || {}; res.prices[c.name][where] = c.free ? 'Free' : c.price;
      }
      if (feedMode !== 'live') { const soldWrong = cards.filter((c) => c.sold); for (const c of soldWrong) fail('sold-out', where, c.name + ' says sold out with the feed ' + feedMode + ' (data.json has it on sale)', await shot('sold-' + c.name)); }
      errs.slice(e0).forEach((m) => fail('script', where, 'script error on Tickets: ' + m));
      if (feedMode !== 'live' && !errs.length) pass('fallback', where, cards.length + ' pass cards with prices from data.json');
      if (feedMode !== 'live') { await ctx.close(); continue; } // fallback runs check cards only

      // (3) every pass type, then every option in the later steps, builds a valid order
      const passes = await page.evaluate(STEP1);
      const scenarios = [];
      // a pass that opens its own counters (Day tickets: Thu, Fri, Sat, Sun, Sat + Sun) gets one scenario per counter
      for (const p0 of passes) {
        await page.goto(base, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(500); await page.evaluate(IP.hook); await page.evaluate(OPEN, st); await page.waitForTimeout(600);
        await page.evaluate((p) => { const b = document.querySelector('#root button[aria-label="One more ' + p + '"]'); if (b) b.click(); }, p0); await page.waitForTimeout(400);
        const subs = await page.evaluate((passes) => { const out = [], n = {}; for (const b of document.querySelectorAll('#root button[aria-label^="One more "]')) { if (!b.checkVisibility()) continue; const a = b.getAttribute('aria-label').replace(/^One more /, ''); if (passes.includes(a)) continue; n[a] = (n[a] || 0) + 1; let r = b.parentElement; while (r && r.parentElement && !/\$|Free/.test(r.innerText || '')) r = r.parentElement; out.push({ aria: a, idx: n[a] - 1, name: ((r && r.innerText) || a).split('\n')[0].trim().slice(0, 30) }); } return out; }, passes);
        const empty = !(await page.evaluate(ORDER)).lines.length;
        if (subs.length && empty) subs.forEach((x) => scenarios.push({ pass: p0, sub: x, opt: null })); else scenarios.push({ pass: p0, opt: null });
      }
      await page.goto(base, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(500); await page.evaluate(IP.hook); await page.evaluate(OPEN, st); await page.waitForTimeout(600);
      await page.evaluate((p) => { const b = document.querySelector('#root button[aria-label="One more ' + p + '"]'); if (b) b.click(); }, passes[0]); await page.waitForTimeout(500);
      const opts = (await page.evaluate(OPTIONS)).map((o) => o.label);
      // options that appear only after another choice (e.g. camping spots after "Car, van or RV")
      for (const o of opts.slice()) { await page.evaluate(CLICK, o); await page.waitForTimeout(300); for (const x of await page.evaluate(OPTIONS)) if (!opts.includes(x.label)) opts.push(x.label); await page.evaluate(CLICK, o); await page.waitForTimeout(200); }
      opts.forEach((o) => scenarios.push({ pass: passes[0], opt: o }));
      if (QUICK) scenarios.splice(4);
      for (const sc of scenarios) {
        const label = sc.pass + (sc.sub ? ' · ' + sc.sub.name : '') + (sc.opt ? ' + ' + sc.opt.slice(0, 40) : '');
        await page.goto(base, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(600); await page.evaluate(IP.hook); await page.evaluate(OPEN, st); await page.waitForTimeout(700); // fresh cart each time
        const e1 = errs.length;
        await page.evaluate((p) => { const b = document.querySelector('#root button[aria-label="One more ' + p + '"]'); if (b) b.click(); }, sc.pass); await page.waitForTimeout(400);
        if (sc.sub) { await page.evaluate((x) => { const b = [...document.querySelectorAll('#root button[aria-label="One more ' + x.aria + '"]')].filter((e) => e.checkVisibility())[x.idx]; if (b) b.click(); }, sc.sub); await page.waitForTimeout(400); }
        if (sc.opt) { const o = (await page.evaluate(OPTIONS)).find((x) => x.label === sc.opt); if (o && o.sold) { if (!o.disabled) fail('sold-out', where, sc.opt + ' is marked sold out but can still be picked', await shot('soldpick')); continue; } if (!(await page.evaluate(CLICK, sc.opt))) { const parent = opts.find((x) => /car, van or rv|driving/i.test(x)); if (parent) { await page.evaluate(CLICK, parent); await page.waitForTimeout(300); } await page.evaluate(CLICK, sc.opt); } await page.waitForTimeout(400); }
        // finish any step still asking for a choice: pick the first open option it points at
        for (let i = 0; i < 8; i++) { const p = await page.evaluate(PAY); if (p.ready) break; const first = (await page.evaluate(OPTIONS)).find((x) => !x.on && !x.sold && !x.disabled); if (!first) break; await page.evaluate(CLICK, first.label); await page.waitForTimeout(350); }
        const p = await page.evaluate(PAY), ord = await page.evaluate(ORDER);
        errs.slice(e1).forEach((m) => fail('script', where, label + ': script error: ' + m));
        if (!p.ready) { fail('checkout', where, label + ': checkout never becomes available (it asks: "' + (p.missing || p.label) + '")', await shot('stuck-' + label)); continue; }
        if (!ord.lines.length) { fail('order', where, label + ': order summary lists nothing', await shot('empty-' + label)); continue; }
        const donations = ord.lines.filter((l) => /fund the tools|sponsor a student/i.test(l.name)).reduce((s, l) => s + l.amt, 0);
        const sub = ord.lines.reduce((s, l) => s + l.amt, 0); const fee = Math.round((sub - donations) * 0.05 * 100) / 100;
        if (ord.fee !== null && Math.abs(ord.fee - fee) > 0.011) fail('order', where, label + ': service fee shows $' + ord.fee + ', should be $' + fee.toFixed(2) + ' (5% of $' + (sub - donations) + ')', await shot('fee-' + label));
        if (ord.total !== null && Math.abs(ord.total - (sub + (ord.fee || 0))) > 0.011) fail('order', where, label + ': total $' + ord.total + ' does not add up (lines $' + sub + ' + fee $' + ord.fee + ')', await shot('total-' + label));
        // hand-off to the real checkout: click, follow to the payment step, never type, never pay
        const before = page.url(); const popupP = ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null);
        await page.evaluate(() => { const b = [...document.querySelectorAll('#root button')].find((x) => x.checkVisibility() && /checkout/i.test(x.innerText || '')); b && b.click(); });
        const pop = await popupP; const tgt = pop || page; await tgt.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {}); await tgt.waitForTimeout(2500);
        const url = tgt.url();
        if (url === before || url.startsWith(base)) { wait('checkout-real', 'the Tickets checkout button does not go to the real checkout yet (prototype stand-in); waiting on Site Build to wire it'); pass('order', where, label + ': order adds up ($' + (ord.total ?? sub) + ')'); }
        else {
          const u = new URL(url); const text = await tgt.evaluate(() => document.body.innerText.slice(0, 4000)).catch(() => '');
          const atPay = await tgt.evaluate(() => !!document.querySelector('iframe[src*="stripe"], iframe[name*="stripe"], [class*="payment" i] input, input[autocomplete="cc-number"], #card-element, [data-payment]')).catch(() => false);
          const names = ord.lines.map((l) => l.name.replace(/\s*·.*/, ''));
          const missing = names.filter((n) => !text.toLowerCase().includes(n.toLowerCase().slice(0, 12)));
          const ev = (url.match(/events?\/(\d+)|event(?:_id)?=(\d+)/i) || []).slice(1).find(Boolean) || '';
          const orderId = (url.match(/orders?\/([\w-]+)|order(?:_id)?=([\w-]+)/i) || []).slice(1).find(Boolean) || '';
          if (orderId) res.orders.push({ order: orderId, at: new Date().toISOString(), device: dn, mode, items: label });
          if (missing.length) fail('checkout', where, label + ': checkout page (' + u.host + u.pathname.slice(0, 40) + ') is missing ' + missing.join(', '), await (async () => { const f = 'shots/' + dn + '-' + mode + '-checkout-' + label.replace(/[^a-z0-9]+/gi, '-').slice(0, 30) + '.jpg'; await tgt.screenshot({ type: 'jpeg', quality: 55, path: path.join(OUT, f) }); return f; })());
          else pass('checkout', where, label + ': reaches ' + u.host + (ev ? ' (event ' + ev + ')' : '') + (atPay ? ', payment step reached, stopped' : ', stopped before any form'));
          if (!atPay) wait('payment-step', 'checkout stops at a details form before the payment step; the test never fills in forms');
          if (pop) await pop.close().catch(() => {}); else await page.goBack().catch(() => {});
        }
      }
    } catch (e) { fail('script', where, 'ticket test crashed: ' + String(e.message).split('\n')[0].slice(0, 100)); }
    await ctx.close();
  }
  if (!feedSeen) wait('feed', 'the Tickets page does not call a live FMS feed yet; price match to the FMS waits on Site Build\'s feed (fallback checks ran against data.json)');
  else if (!feedBody) wait('feed', 'the page asks the feed (' + String(FEED).slice(1, 60) + '…) but it gave ' + (feedErr || 'no answer') + ': not deployed yet, or the host is not reachable from this session; price match to the live FMS waits on it');
  else {
    res.feed = { keys: Object.keys(feedBody).slice(0, 10) };
    // find {name, price} pairs anywhere in the feed and compare with what each card shows
    const fp = {}; const walk = (v) => { if (Array.isArray(v)) return v.forEach(walk); if (v && typeof v === 'object') { const n = v.name || v.title || v.label; const pr = v.price ?? v.amount ?? v.price_cents / 100; if (typeof n === 'string' && pr !== undefined && !isNaN(+pr)) fp[n.trim().toLowerCase()] = { price: +pr > 10000 ? +pr / 100 : +pr, sold: !!(v.sold_out || v.soldOut || v.status === 'sold_out') }; Object.values(v).forEach(walk); } }; walk(feedBody);
    let compared = 0;
    for (const [name, byWhere] of Object.entries(res.prices)) { const f = fp[name.toLowerCase()]; if (!f) continue; for (const [wh, shown] of Object.entries(byWhere)) { if (!wh.includes('feed live')) continue; compared++; const val = shown === 'Free' ? 0 : +String(shown).replace(/[$,]/g, ''); if (Math.abs(val - f.price) > 0.5) fail('price', wh, name + ' shows ' + shown + ', the live feed says $' + f.price); } }
    if (!compared) wait('feed-match', 'the feed answered but no pass names matched the Tickets page; the feed\'s field names need mapping (keys: ' + res.feed.keys.join(', ') + ')'); else pass('price', 'all', compared + ' page prices compared with the live feed');
  }
  // (1) prices: page vs feed vs Site Build's FMS admin list (fms_prices.txt, passed in with --fms=path)
  const fmsPath = arg('fms'); const fms = fmsPath && fs.existsSync(fmsPath) ? fs.readFileSync(fmsPath, 'utf8') : '';
  if (!fms) wait('fms-list', 'no FMS admin price list from Site Build yet (photo-catalog/fms_prices.txt, requests.md row 31)');
  else {
    const want = {}; for (const m of fms.matchAll(/([A-Za-z0-9 ·\-’'&]+?)\s*=\s*\$?([\d,.]+|Free)/g)) want[m[1].trim().toLowerCase()] = m[2] === 'Free' ? 'Free' : '$' + Math.round(+m[2].replace(/,/g, '')).toLocaleString('en-US');
    for (const [name, byWhere] of Object.entries(res.prices)) { const w = want[name.toLowerCase()]; if (!w) continue; for (const [wh, shown] of Object.entries(byWhere)) if (!wh.includes('feed live')) continue; else if (shown.replace(/\.00$/, '') !== w && !(w === 'Free' && shown === 'Free')) fail('price', wh, name + ' shows ' + shown + ', FMS admin list says ' + w); else pass('price', wh, name + ' ' + shown + ' matches the FMS'); }
  }
  await browser.close(); if (server) server.close();
  res.mins = Math.round((Date.now() - t0) / 60000);
  const fails = res.checks.filter((c) => !c.ok); const seen = new Map(); for (const f of fails) { const k = f.c + '|' + f.m.replace(/\d+(\.\d+)?/g, '#'); const g = seen.get(k); if (g) g.where.add(f.where); else seen.set(k, Object.assign({}, f, { where: new Set([f.where]) })); }
  const lines = [...seen.values()].map((f) => '- Tickets · ' + f.c + ' · ' + [...f.where].slice(0, 3).join('; ') + (f.where.size > 3 ? ' +' + (f.where.size - 3) + ' more' : '') + ' · ' + f.m + (f.shot ? ' · `' + f.shot + '`' : ''));
  const okN = res.checks.filter((c) => c.ok).length;
  const summary = 'Site QA: ticket check ' + new Date().toISOString().slice(0, 10) + ': ' + (fails.length ? seen.size + ' FAILING' : 'all passing') + ' (' + okN + ' checks passed on phone, tablet and desktop, tab and installed app); waiting on: ' + (res.waiting.map((w) => w.c).join(', ') || 'nothing') + (res.orders.length ? '; ' + res.orders.length + ' pending test orders logged for cleanup' : '') + '.';
  res.summary = summary; res.lines = lines;
  fs.writeFileSync(path.join(OUT, 'tickets.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(OUT, 'tickets.md'), summary + '\n' + (lines.join('\n') || '') + '\n' + (res.waiting.length ? '\nWaiting on:\n' + res.waiting.map((w) => '- ' + w.m).join('\n') + '\n' : ''));
  if (res.orders.length) { const f = path.join(__dirname, 'out', 'ticket_test_orders.json'); let old = []; try { old = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {} fs.writeFileSync(f, JSON.stringify(old.concat(res.orders), null, 1)); }
  log(summary); log('report: ' + path.join(OUT, 'tickets.md'));
  process.exit(fails.length ? 3 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });
