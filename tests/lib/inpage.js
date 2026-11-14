// Code that runs inside the page. Exported as functions Playwright serializes.
// Keep each check plain: return [{c: check id, m: message, s: element label}].

// Runs before any site script. Fakes the installed app (display-mode: standalone)
// when window.__PK_MODE === 'app', and records gesture/zoom listeners.
exports.initScript = (mode) => {
  window.__PK_MODE = mode;
  window.__pkErr = [];
  window.__pkLS = [];
  window.__pkListen = {};
  const ael = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (t, f, o) {
    if (/^(gesturestart|gesturechange|touchend|touchstart|dblclick)$/.test(t)) window.__pkListen[t] = (window.__pkListen[t] || 0) + 1;
    return ael.call(this, t, f, o);
  };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__pkLS.push({ t: e.startTime, v: e.value }); })
      .observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
  document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*:has(> label > select[aria-label="Site state"]){display:none!important}'; document.head.appendChild(st); });
  if (mode !== 'app') return;
  try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) {}
  const mm = window.matchMedia.bind(window);
  window.matchMedia = (q) => {
    const s = String(q);
    if (/display-mode\s*:\s*(standalone|fullscreen|minimal-ui)/.test(s)) { const r = mm('all'); return Object.assign(Object.create(Object.getPrototypeOf(r)), { matches: !/fullscreen|minimal-ui/.test(s), media: s, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }); }
    if (/display-mode\s*:\s*browser/.test(s)) return mm('not all');
    return mm(q);
  };
  const flip = () => {
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      const walk = (rs) => { for (const r of rs) { if (r.media && r.media.mediaText && /display-mode/.test(r.media.mediaText) && !r.__pk) { r.__pk = 1; const t = r.media.mediaText; r.media.mediaText = /display-mode\s*:\s*standalone/.test(t) ? t.replace(/\(\s*display-mode\s*:\s*standalone\s*\)/g, '(min-width:0px)') : t.replace(/\(\s*display-mode\s*:\s*[a-z-]+\s*\)/g, '(max-width:0px)'); } if (r.cssRules) walk(r.cssRules); } };
      walk(rules);
    }
  };
  document.addEventListener('DOMContentLoaded', () => { flip(); new MutationObserver(flip).observe(document.documentElement, { childList: true, subtree: true }); });
};

// Grabs the running app object (the site has no URLs per page; it routes in memory).
exports.hook = async () => {
  if (window.__app) return true;
  for (const C of [window.DCLogic, window.Component].concat([typeof DCLogic !== 'undefined' ? DCLogic : null, typeof Component !== 'undefined' ? Component : null])) {
    if (!C || !C.prototype) continue;
    for (const m of Object.getOwnPropertyNames(C.prototype)) { if (m === 'constructor') continue; const d = Object.getOwnPropertyDescriptor(C.prototype, m); const o = d && d.value; if (typeof o === 'function' && !o.__w) { const w = function (...a) { window.__app = this; return o.apply(this, a); }; w.__w = 1; C.prototype[m] = w; } }
  }
  // nudge the app into calling one of those, then return home
  window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 300));
  if (!window.__app) { const b = [...document.querySelectorAll('nav button, [role=tablist] button')].filter((x) => x.checkVisibility()).find((x) => /lineup/i.test(x.textContent)) || [...document.querySelectorAll('nav button')].find((x) => x.checkVisibility()); if (b) b.click(); await new Promise((r) => setTimeout(r, 400)); }
  if (window.__app) window.__app.reset('home');
  return !!window.__app;
};

// Go to one target: {r, p, st (state to set first), click (text or css to tap after)}.
exports.goto = async (t) => {
  const A = window.__app; if (!A) return 'no-app';
  try { document.querySelectorAll('[aria-modal=true] [aria-label*="lose" i]').forEach((b) => b.click()); } catch (e) {}
  if (window.__pkBase) A.setState(Object.assign({}, window.__pkBase, { menu: false }));
  A.reset('home'); if (t.r !== 'home') A.go(t.r, t.p || {});
  if (t.st) A.setState(t.st);
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 450));
  if (t.click) {
    const want = t.click; let el = null;
    if (want.css) el = [...document.querySelectorAll(want.css)].find((e) => e.checkVisibility());
    if (!el && want.text) { const re = new RegExp(want.text, 'i'); el = [...document.querySelectorAll('button,[role=button],a,summary')].find((e) => e.checkVisibility() && re.test((e.getAttribute('aria-label') || '') + ' ' + e.textContent)); }
    if (!el) return 'no-control';
    el.scrollIntoView({ block: 'center' }); el.click();
  }
  return 'ok';
};

// Boxes of things a visitor would notice moving (for the shift/flicker check).
exports.boxes = () => {
  const out = {}; let i = 0;
  const anim = new Set(); try { document.getAnimations().forEach((a) => a.effect && a.effect.target && anim.add(a.effect.target)); } catch (e) {}
  const inAnim = (el) => { for (let p = el; p; p = p.parentElement) { if (anim.has(p)) return true; const cs = getComputedStyle(p); if (cs.position === 'fixed' || cs.position === 'sticky') return true; if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth) return true; } return false; };
  for (const el of document.querySelectorAll('h1,h2,h3,p,button,a.pk-cta,img,video')) {
    if (++i > 900) break;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.top > innerHeight * 2) continue;
    if (inAnim(el)) continue;
    out[i] = [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height), (el.tagName + ' ' + (el.textContent || el.getAttribute('src') || '').trim().slice(0, 30))];
  }
  return { b: out, ls: (window.__pkLS || []).slice() };
};

// The main sweep of checks on the current screen state.
exports.checks = async (o) => {
  const vw = document.documentElement.clientWidth, vh = innerHeight, touch = o.touch, phone = vw < 600;
  const iss = []; const add = (c, m, el) => iss.push({ c, m, s: el ? lab(el) : '' });
  function lab(el) {
    if (!el || !el.tagName) return '';
    const cls = (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(/\s+/).filter((x) => x && !/^(on|act|cur)$/.test(x)).slice(0, 2).join('.');
    const tx = ((el.getAttribute && el.getAttribute('aria-label')) || el.textContent || (el.getAttribute && (el.getAttribute('alt') || el.getAttribute('src'))) || '').replace(/\s+/g, ' ').trim().slice(0, 32);
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (tx ? ' "' + tx + '"' : '');
  }
  const vis = (el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  const clipAnc = (el, scrollOk) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); const ox = cs.overflowX, oy = cs.overflowY; if (ox !== 'visible' || oy !== 'visible') { if (!scrollOk && /auto|scroll/.test(ox + oy)) return { p, scroll: true }; return { p, scroll: /auto|scroll/.test(ox + oy) }; } if (cs.position === 'fixed') return { p, fixed: true }; } return null; };
  // When a full-screen sheet or menu is open, judge only what's in it (the page behind is covered).
  const cover = [...document.querySelectorAll('[aria-modal=true],[role=dialog],nav[aria-label=More],[role=region][aria-label=Listen] *')].find((e) => { if (!vis(e) || e.closest('[aria-label="Cookie choices"]')) return false; const r = e.getBoundingClientRect(); if (e.closest('[role=region][aria-label=Listen]')) return getComputedStyle(e).position === 'fixed' && r.width * Math.min(r.height, vh) > vw * vh * 0.3; return r.width * Math.min(r.height, vh) > vw * vh * 0.6; });   /* an open Listen sheet covers the page too (QA Nov 14) */
  const moving = (e) => { try { for (let p = e; p && p !== document.body; p = p.parentElement) if (p.getAnimations().some((a) => a.playState === 'running' && /transform|translate|left|margin/i.test(JSON.stringify(a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : '')))) return true; } catch (x) {} return false; };
  const skip = (e) => !!e.closest('[data-pkqa-ignore],[aria-label="Cookie choices"],:has(> label > select[aria-label="Site state"])') || (cover && !cover.contains(e));
  const all = [...document.body.querySelectorAll('*')].filter((e) => !skip(e) && !/^(SCRIPT|STYLE|NOSCRIPT|BR|svg|path|g|use|defs|circle|rect|line|polygon|polyline|ellipse|text|tspan|clipPath|linearGradient|radialGradient|stop|mask|symbol)$/.test(e.tagName));

  // 1. Sideways scroll on the page
  const sw = document.scrollingElement.scrollWidth;
  if (sw > vw + 1) add('hscroll', 'page scrolls sideways by ' + (sw - vw) + 'px');

  // 2. Anything wider than the screen (outermost offender only, not inside a scroller or clipped box)
  let wide = 0;
  for (const el of all) {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (!(r.right > vw + 1 || r.left < -1)) continue;
    if (r.left >= vw || r.right <= 0) continue; // fully off-screen (hidden drawer / slide)
    if (!vis(el)) continue;
    const a = clipAnc(el, true); if (a) { const pr = a.p.getBoundingClientRect(); if (a.scroll || a.fixed || (pr.left >= -1 && pr.right <= vw + 1)) continue; }
    const pe = el.parentElement; if (pe) { const q = pe.getBoundingClientRect(); if (q.right > vw + 1 || q.left < -1) continue; }
    if (wide++ < 4) add('wide', 'sticks out ' + Math.round(Math.max(r.right - vw, -r.left)) + 'px past the screen edge', el);
  }

  // 3. Clipped or overlapping text
  const leaves = [];
  for (const el of all) {
    let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue; own = own.trim(); if (own.length < 2) continue;
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    const head = /^H[1-4]$/.test(el.tagName) || /name|ttl|title|-n\b|-nm/.test(String(el.className));
    if ((cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && (!clamp || head)) add('clip', 'text cut off (' + (cs.textOverflow === 'ellipsis' ? 'ellipsis' : 'overflow hidden') + ')', el);
    else if (clamp && head && el.scrollHeight > el.clientHeight + 2) add('clip', 'heading/name cut to ' + cs.webkitLineClamp + ' lines', el);
    else {
      const a = clipAnc(el, false);
      if (a && !a.scroll && !a.fixed && !clamp) { const pr = a.p.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); const tr = rg.getBoundingClientRect();
        const inter = tr.right > pr.left && tr.left < pr.right && tr.bottom > pr.top && tr.top < pr.bottom;
        if (inter && !moving(el) && (tr.right > pr.right + 2 || tr.left < pr.left - 2 || tr.bottom > pr.bottom + 3 || tr.top < pr.top - 3)) add('clip', 'text runs past its box edge', el); }
    }
    const rg = document.createRange(); rg.selectNodeContents(el); const tr = rg.getBoundingClientRect();
    if (tr.width > 2 && leaves.length < 1500) { let rr = tr; if (clamp || cs.overflowY !== 'visible') { const t = Math.max(tr.top, r.top), b = Math.min(tr.bottom, r.bottom); rr = { left: tr.left, right: tr.right, width: tr.width, top: t, bottom: Math.max(t, b), height: Math.max(0, b - t) }; } leaves.push({ el, r: rr }); }   // a line-clamped paragraph hides its extra lines; don't count them as overlapping (QA Nov 14)
  }
  const layerC = new Map(); const layer = (el) => { if (layerC.has(el)) return layerC.get(el); let L = document.body; for (let p = el; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || cs.position === 'sticky' || (cs.position === 'absolute' && cs.zIndex !== 'auto') || p.getAttribute('role') === 'dialog' || p.getAttribute('aria-modal') === 'true') { L = p; break; } } layerC.set(el, L); return L; };
  leaves.sort((a, b) => a.r.top - b.r.top); let ov = 0;
  for (let i = 0; i < leaves.length && ov < 4; i++) for (let j = i + 1; j < leaves.length; j++) {
    const A = leaves[i], B = leaves[j]; if (B.r.top >= A.r.bottom) break;
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
    if (A.el.closest('nav,header,[role=tablist]') || B.el.closest('nav,header,[role=tablist]')) continue; // page scrolling under the header / tab bar is by design
    if (layer(A.el) !== layer(B.el)) continue; // a sheet, menu or dock on top of the page is by design
    const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
    if (w < 4 || h < 4) continue; const ar = w * h, sm = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
    if (ar < 60 || ar < sm * 0.25) continue;
    const cx = Math.max(A.r.left, B.r.left) + w / 2, cy = Math.max(A.r.top, B.r.top) + h / 2;
    if (cy < 0 || cy > vh) continue; // only judge what's on screen
    const top = document.elementFromPoint(cx, cy); if (!top || !(A.el.contains(top) || B.el.contains(top) || top.contains(A.el) || top.contains(B.el))) continue;
    ov++; add('overlap', 'text overlaps "' + (B.el.textContent || '').trim().slice(0, 24) + '"', A.el); break;
  }

  // 4. Buttons sticking out of their card
  const tapEls = [...document.querySelectorAll('button,a[href],[role=button],summary,input,select,textarea')].filter((e) => vis(e) && !skip(e));
  let boc = 0;
  for (const b of tapEls) {
    const r = b.getBoundingClientRect(); if (r.width < 8 || r.height < 8) continue;
    for (let p = b.parentElement, k = 0; p && k < 6 && p !== document.body; p = p.parentElement, k++) {
      const cs = getComputedStyle(p); if (cs.position === 'fixed') break;
      const card = parseFloat(cs.borderTopLeftRadius) > 3 && (/rgba?\((?!0, 0, 0, 0\))/.test(cs.backgroundColor) && !/rgba\([^)]*, 0\)/.test(cs.backgroundColor) || cs.backgroundImage !== 'none');
      if (!card) continue; const pr = p.getBoundingClientRect(); if (pr.width <= r.width + 4) continue;
      if ((r.left < pr.left - 2 || r.right > pr.right + 2 || r.bottom > pr.bottom + 2 || r.top < pr.top - 2) && !moving(b)) { if (boc++ < 4) add('btn-out', 'button pokes ' + Math.round(Math.max(pr.left - r.left, r.right - pr.right, r.bottom - pr.bottom, pr.top - r.top)) + 'px outside its card', b); }
      break;
    }
  }

  // 5. Visible scroll bars
  const dsb = innerWidth - vw; if (dsb > 0 && !touch) add('scrollbar', 'page scroll bar is visible (' + dsb + 'px)');
  let sb = 0;
  for (const el of all) {
    const cs = getComputedStyle(el);
    const yS = /auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1, xS = /auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
    if (!yS && !xS) continue; if (!vis(el)) continue;
    const bw = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth), bh = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    if ((yS && el.offsetWidth - el.clientWidth - bw > 0.5) || (xS && el.offsetHeight - el.clientHeight - bh > 0.5)) { if (sb++ < 3) add('scrollbar', 'scroll bar shows on a ' + (xS ? 'sideways' : 'vertical') + ' scroller', el); }
  }

  // 7. Broken images / videos, 8. low-res images
  const nat = {}; const getNat = (u) => nat[u] || (nat[u] = new Promise((res) => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.onerror = () => res([0, 0]); im.src = u; setTimeout(() => res(null), 4000); }));
  const lowres = []; const minD = touch ? 1.0 : 0.8; // 'much larger than the file': under 1x on phones/tablets (2-3x screens), under 0.8x on computers
  for (const im of document.querySelectorAll('img')) {
    if (!vis(im)) continue; const r = im.getBoundingClientRect(); if (r.width < 2) continue;
    if (im.complete && im.naturalWidth === 0 && (im.currentSrc || im.src) && im.loading !== 'lazy' && new URL(im.currentSrc || im.src, location.href).origin === location.origin) { add('broken-img', 'image did not load: ' + (im.getAttribute('src') || '').slice(0, 60), im); continue; }
    if (!im.naturalWidth || r.width < 200) continue;
    const fit = getComputedStyle(im).objectFit, sx = r.width / im.naturalWidth, sy = r.height / im.naturalHeight;
    const sc = fit === 'cover' ? Math.max(sx, sy) : fit === 'contain' ? Math.min(sx, sy) : Math.max(sx, sy);
    if (1 / sc < minD) lowres.push([im.currentSrc || im.src, Math.round(r.width), im.naturalWidth, 1 / sc, im]);
  }
  for (const el of all) {
    const bg = getComputedStyle(el).backgroundImage; if (!bg || bg === 'none') continue; const m = bg.match(/url\(["']?([^"')]+)["']?\)/); if (!m || /^data:|\.svg/.test(m[1])) continue;
    const r = el.getBoundingClientRect(); if (r.width < 200 || r.height < 60 || !vis(el)) continue; if (r.top > vh * 3) continue;
    const n = await getNat(m[1]); if (!n) continue; if (n[0] === 0 && new URL(m[1], location.href).origin !== location.origin) continue; if (n[0] === 0) { add('broken-img', 'background image did not load: ' + m[1].slice(-60), el); continue; }
    const cs = getComputedStyle(el); const bs = cs.backgroundSize;
    const sc = bs === 'contain' ? Math.min(r.width / n[0], r.height / n[1]) : Math.max(r.width / n[0], r.height / n[1]);
    if (1 / sc < minD) lowres.push([m[1], Math.round(r.width), n[0], 1 / sc, el]);
  }
  for (const v of document.querySelectorAll('video')) if (v.error || v.networkState === 3) add('broken-video', 'video failed to load', v);
  for (const [u, w, nw, d, el] of lowres.slice(0, 6)) add('lowres', 'image ' + nw + 'px wide shown at ' + w + 'px (' + d.toFixed(2) + 'x, needs ' + minD + 'x): ' + String(u).replace(/^.*\/\/[^/]+\//, '').slice(-50), el);

  // 9. Buttons that break the shared style
  let bs = 0;
  for (const b of tapEls) {
    if (!/^(BUTTON|A)$/.test(b.tagName) && b.getAttribute('role') !== 'button') continue;
    const r = b.getBoundingClientRect(); const t = (b.textContent || '').trim();
    const cs = getComputedStyle(b); const cls = String(b.className);
    if (/\bpk-sqb\b/.test(cls)) continue; // small square buttons: the approved secondary family
    if (/\b(pk-cta|pk-bkb)\b/.test(cls) && /\b(pri|sec)\b/.test(cls)) {
      // rulebook: 50px phone and tablet, 56px desktop
      const want = vw < 1200 ? 50 : 56; if (Math.abs(r.height - want) > 1.5 && bs++ < 4) add('btn-style', 'shared button is ' + Math.round(r.height) + 'px tall (should be ' + want + ')', b);
      continue;
    }
    if (r.height < 38 || r.width < 90 || t.length < 3) continue;
    if (b.closest('nav,footer,[role=tablist],[aria-modal=true] header,.pk-tabbar')) continue;
    const filled = !/rgba\([^)]*, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0;
    if (!filled || cs.backgroundImage !== 'none') continue; // photo cards and text links are not buttons
    if (parseFloat(cs.borderTopLeftRadius) >= r.height / 2 - 2) continue; // pills are the Watch feature
    if (r.height > 90) continue; // cards/tiles
    if (bs++ < 4) add('btn-style', 'button-looking control without the shared pk-cta pri/sec style', b);
  }

  // 10. Tap targets under 44px (touch sizes only)
  if (touch) {
    const small = {};
    for (const b of tapEls) {
      const r = b.getBoundingClientRect(); if (r.width < 1) continue; if (r.width >= 44 && r.height >= 44) continue;
      if (['::after', '::before'].some((ps) => { const c = getComputedStyle(b, ps); return c.content !== 'none' && c.position === 'absolute' && parseFloat(c.width) >= 44 && parseFloat(c.height) >= 44; })) continue; // invisible 44px hit area around a small dot
      if (b.tagName === 'A' && getComputedStyle(b).display === 'inline' && b.parentElement && (b.parentElement.textContent || '').trim().length > (b.textContent || '').trim().length + 20) continue; // link inside a sentence
      if (/^(INPUT)$/.test(b.tagName) && /hidden|checkbox|radio/.test(b.type) && b.closest('label')) continue;
      const key = lab(b).replace(/ ".*$/, ''); small[key] = small[key] || [0, b, r]; small[key][0]++;
    }
    let k = 0; for (const key in small) { if (k++ >= 6) break; const [n, b, r] = small[key]; add('tap', 'tap target ' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px' + (n > 1 ? ' (' + n + ' like it)' : ''), b); }
  }

  // 12. Form fields under 16px text
  for (const f of document.querySelectorAll('input,select,textarea')) {
    if (/hidden|checkbox|radio|range|button|submit|color|file/.test(f.type || '')) continue; if (!vis(f)) continue;
    const fs = parseFloat(getComputedStyle(f).fontSize); if (fs < 16) add('field-font', 'form field text is ' + fs + 'px (iPhone zooms in under 16px)', f);
  }

  // Regression rules (tests/rules.js) are appended by the runner.
  return iss;
};

// Zoom settings as the page sees them now.
exports.zoomState = () => {
  const m = document.querySelector('meta[name=viewport]'); const c = m ? m.content : '';
  const noScale = /user-scalable\s*=\s*(no|0)/i.test(c) || /maximum-scale\s*=\s*1(\.0*)?\b/i.test(c);
  const ta = getComputedStyle(document.documentElement).touchAction + '/' + getComputedStyle(document.body).touchAction;
  return { meta: c, noScale, touchAction: ta, manip: /manipulation|none|pan-/.test(ta), gesture: !!(window.__pkListen || {}).gesturestart, scale: window.visualViewport ? visualViewport.scale : 1 };
};
