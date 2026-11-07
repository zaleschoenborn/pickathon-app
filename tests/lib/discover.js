// Finds every page and open-on-tap state from the site itself (nav clicks + the site's own data),
// so new artists, years, neighborhoods, info pages and stories are picked up automatically.
const IP = require('./inpage'), FONTS = require('./fonts');

// Ticket sale states, from the site's own preview switcher (onState in index.html).
const SALE = { now: ['off'], teaser: ['off', '2026-11-12'], sale: ['off', '2026-11-19'], giving: ['off', '2026-12-01'], early: ['off', '2026-12-10'], reveal: ['off', '2027-01-13'], lineup: ['lineup'], sched: ['sched'], fest: ['fest'] };

async function clickRecord(page, phone) {
  return page.evaluate(async (phone) => {
    const A = window.__app, seen = [];
    const rec = (r, p) => seen.push({ r, p: p || {} });
    const og = A.go, orr = A.reset;
    A.go = function (r, p, x) { rec(r, p); return og.call(this, r, p, x); };
    A.reset = function (r) { rec(r, {}); return orr.call(this, r); };
    const wo = window.open; window.open = () => null;
    const sleep = (t) => new Promise((r) => setTimeout(r, t));
    const tapAll = async (sel, before) => {
      if (before) { before(); await sleep(250); }
      const n = [...document.querySelectorAll(sel)].filter((b) => b.checkVisibility() && !/^https?:/.test(b.getAttribute('href') || '')).length;
      for (let i = 0; i < n; i++) {
        A.reset('home'); await sleep(150); if (before) { before(); await sleep(200); }
        const els = [...document.querySelectorAll(sel)].filter((b) => b.checkVisibility() && !/^https?:/.test(b.getAttribute('href') || ''));
        const b = els[i]; if (!b) break; try { b.click(); } catch (e) {} await sleep(200);
      }
    };
    await tapAll('nav[aria-label=Main] button, nav[aria-label=Main] a');
    await tapAll('nav[aria-label=More] button, nav[aria-label=More] a', () => A.setState({ menu: true }));
    await tapAll('footer button, footer a, [role=contentinfo] button');
    if (phone) await tapAll('[role=tablist] button, nav:not([aria-label]) button');
    A.go = og; A.reset = orr; window.open = wo; A.reset('home');
    return seen;
  }, phone);
}

async function panelsHere(page) {
  return page.evaluate(() => [...document.querySelectorAll('button,[role=button],summary')]
    .filter((b) => b.checkVisibility() && (b.getAttribute('aria-haspopup') || b.hasAttribute('aria-expanded') || /^(filter|pick another year|listen)/i.test((b.getAttribute('aria-label') || b.textContent || '').trim())))
    .map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)).filter((n) => n && !/spotify|apple|youtube|amazon|tidal|↗|opens in/i.test(n)));
}

exports.discover = async (browser, base, log) => {
  const out = new Map(); const add = (t) => { const id = t.id || (t.r + (t.p && Object.keys(t.p).length ? ':' + Object.values(t.p).join('/') : '')); if (!out.has(id)) out.set(id, Object.assign({ id }, t)); };
  for (const [vp, phone] of [[{ width: 1440, height: 900 }, false], [{ width: 390, height: 844 }, true]]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: phone, hasTouch: phone, serviceWorkers: 'block' });
    await ctx.addInitScript({ content: '(' + IP.initScript + ')("tab")' });
    await FONTS.route(ctx);
    const page = await ctx.newPage(); await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(IP.hook); await page.evaluate(() => window.__app && window.__app.setState({}));
    for (const s of await clickRecord(page, phone)) {
      if (s.r === 'home' || s.r === 'map') add({ kind: 'view', r: s.r === 'map' ? 'home' : 'home', p: {} });
      else add({ kind: ['page', 'story', 'hood', 'past', 'act', 'artist'].includes(s.r) ? s.r : 'view', r: s.r, p: s.p });
    }
    if (!phone) {
      const d = await page.evaluate(() => {
        const D = window.__app.state.data, nk = (x) => String(x || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
        const names = {}; const walk = (v, k) => { if (typeof v === 'string') { if (v.length < 60 && /[A-Z]/.test(v)) { const key = nk(v); if (key && !names[key]) names[key] = v; } } else if (v && typeof v === 'object') for (const x in v) walk(v[x], x); };
        walk(D.past); walk(D.yearBill); walk(D.yearReel);
        const years = (Array.isArray(D.past.years) ? D.past.years : Object.values(D.past.years)).map((y) => ({ y: y.y, first: (y.names || [])[0] }));
        return { hoods: Object.keys(D.hoods || {}), pages: Object.keys(D.pages || {}), stories: (D.stories || []).map((s) => s.id), years,
          acts: Object.entries(D.actPages || {}).map(([k, v]) => ({ k, n: names[k] || k, y: v.yr })), artists: Object.keys(D.artists || {}) };
      });
      d.hoods.forEach((h) => add({ kind: 'hood', r: 'hood', p: { h } }));
      d.pages.forEach((p) => add({ kind: 'page', r: 'page', p: { p } }));
      d.stories.forEach((s) => add({ kind: 'story', r: 'story', p: { s } }));
      d.years.forEach((y) => add({ kind: 'past', r: 'past', p: { y: y.y } }));
      const actKeys = new Set(d.acts.map((a) => a.k));
      d.acts.forEach((a) => add({ kind: 'act', r: 'act', p: { n: a.n, y: a.y }, id: 'act:' + a.k }));
      // one plain (not hand-built) artist page per year, to cover the fallback layout
      d.years.forEach((y) => { if (!y.first) return; const k = y.first.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, ''); if (!actKeys.has(k)) add({ kind: 'act-plain', r: 'act', p: { n: y.first, y: String(y.y).slice(0, 4) }, id: 'act-plain:' + y.y }); });
      d.artists.forEach((a) => add({ kind: 'artist', r: 'artist', p: { a } }));
      Object.entries(SALE).forEach(([k, m]) => add({ kind: 'tickets', id: 'tickets@' + k, r: 'tickets', p: {}, st: { pvS: k, season: m[0], today: m[1] } }));
    }
    // open-on-tap panels found on the main page types
    const probe = [{ r: 'home', p: {} }, { r: 'lineup', p: {} }, { r: 'past', p: { y: '2024' } }, { r: 'act', p: { n: 'Geese', y: '2024' } }];
    for (const pr of probe) {
      await page.evaluate(IP.goto, pr); await page.waitForTimeout(500);
      for (const name of await panelsHere(page)) add({ kind: 'panel', id: 'panel:' + pr.r + (pr.p.y ? pr.p.y : '') + ':' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30), r: pr.r, p: pr.p, click: { text: '^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 30) } });
    }
    if (phone) add({ kind: 'panel', id: 'panel:menu', r: 'home', p: {}, st: { menu: true } });
    await ctx.close();
  }
  const list = [...out.values()];
  log && log('found ' + list.length + ' pages/states: ' + Object.entries(list.reduce((a, t) => ((a[t.kind] = (a[t.kind] || 0) + 1), a), {})).map(([k, v]) => k + ' ' + v).join(', '));
  return list;
};
