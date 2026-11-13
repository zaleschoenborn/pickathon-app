/* pk-places: Places map and neighborhood pages, round 1 (Nov 13 2026). Source: tools/places_r1/places.js, spliced into index.html by tools/places_r1/build.py.
   Design: Dropbox _catalogs/design_note_map_neighborhoods_direction_nov12_full.md + addendum, addendum2, addendum3 (Zale, Nov 12 2026).
   Drawn into islands the app's renderer leaves alone (data-pk-own):
     #pkpl      the map (Places tab and every neighborhood page). One map node lives for the whole visit and moves between islands, so zoom and place survive a page change.
     #pkpl-sp   phone and portrait tablet: the see-through space above the sheet (the map shows through it; touches there go to the map)
     #pkpl-top  the top of the sheet / panel: grab bar, hero photos, kind, name, title, hook, and the schedule when one is posted
   The rest of the neighborhood page (video, This summer, Who built it, year by year, who played, a day here) is the app's own neighborhood page, restyled as the sheet by places.css.
   The old map (farmmap/lab-phone.html) stays for the past-year Time Machine and at ?old=places. No timers: layout runs on load, resize and the app's render. */
(function () {
  'use strict';
  var HH = /*@HOODS_HOME*/null;   /* tools/home_r2/hoods_home.json: shapes, pin points and the photo director's preview photos with crops */
  if (!HH) return;
  var W = HH.size[0], H = HH.size[1], TF = 4898 / 2041, TS = 1024 / TF;   /* farmmap/t/<col>_<row>.webp: the full-detail map in 1024px tiles (4898 x 9144) */
  var KIND = { stage: 'Stage neighborhood', around: 'Gathering neighborhood', camp: 'Camping neighborhood' };
  var ORDER = ['woods', 'paddock', 'cherryhill', 'grove', 'windmill', 'galaxy', 'lucky', 'farmhouse', 'curation', 'refuge', 'coyote', 'courtyard', 'market', 'orchard', 'welcomelot', 'lushcamp', 'quailtrail', 'southcamp', 'wildcamp', 'willowcamp'];
  var CORE = ['woods', 'refuge', 'coyote', 'cherryhill', 'market', 'grove', 'windmill', 'paddock', 'galaxy', 'courtyard'];   /* desktop start: Woods down to the Courtyard (addendum 3) */
  var AMEN = { restroom: ['Restrooms', 'restroom.webp'], water: ['Water', 'water.webp'], bar: ['Bars', 'bar.webp'], food: ['Food', 'food.webp'], coffee: ['Coffee', 'coffee.webp'], craft: ['Craft', 'craft.webp'], shower: ['Showers', 'shower.webp'], atm: ['ATMs', 'atm.webp'], kids: ['Kids', 'kids.svg'], shuttle: ['Shuttle', 'shuttle.webp'], access: ['Accessible', 'access.webp'], medical: ['Medical', 'medical.webp'], info: ['Info', 'info.webp'], charge: ['Charging', 'charge.webp'], merch: ['Merch', 'merch.webp'], ice: ['Ice', 'ice.webp'], dishes: ['Dish return', 'dishes.webp'], bike: ['Bike parking', 'bike.webp'], massage: ['Massage', 'massage.webp'], smoke: ['Smoking', 'smoke.webp'] };
  var HERO_MS = 5000;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function app() { return window.comp || window.__pkApp || null; }
  function site() { var a = app(); return (a && a.state) || window.__pkSt || {}; }
  function data() { return site().data || null; }
  function top() { var s = site().stack || []; return s[s.length - 1] || {}; }
  function go(r, x) { var a = app(); if (a && a.go) a.go(r, x || {}); }
  function wide() { return window.innerWidth >= 1200 || (window.innerWidth >= 900 && window.innerWidth > window.innerHeight); }   /* desktop and sideways tablet: panel on the left, map on the right */
  function touch() { return !!(window.matchMedia && matchMedia('(hover: none)').matches); }
  function calm() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function ids() { var D = data(); return ORDER.filter(function (k) { return D && D.hoods[k] && HH.shapes[k]; }); }
  function pt(k) { var p = HH.pts[k] || (data().hoods[k] || {}).p || [50, 50]; return [p[0] / 100 * W, p[1] / 100 * H]; }
  var BOX = {};
  function box(k) {   /* the shape's bounds in map units */
    if (BOX[k]) return BOX[k];
    var n = String(HH.shapes[k] || '').match(/-?\d+(\.\d+)?/g) || [], x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i + 1 < n.length; i += 2) { var x = +n[i], y = +n[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x0 > x1) { var p = pt(k); x0 = p[0] - 60; x1 = p[0] + 60; y0 = p[1] - 60; y1 = p[1] + 60; }
    return (BOX[k] = [x0, y0, x1, y1]);
  }
  function union(L) { var b = [1e9, 1e9, -1e9, -1e9]; L.forEach(function (k) { var x = box(k); b = [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.max(b[2], x[2]), Math.max(b[3], x[3])]; }); return b; }
  function emb(k) { var h = data().hoods[k] || {}; return h.icw || ('ic2/' + k + '.png'); }   /* the white emblems Home uses */
  function stageHood() { var D = data(), m = {}; (D.stages || []).forEach(function (s) { m[s.id] = s.h; }); return m; }

  /* ---------- the map ---------- */
  var M = null;   /* one map for the whole visit */
  function makeMap() {
    var el = document.createElement('div'); el.className = 'pkpl-map'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Farm map');
    var shapes = ids().map(function (k) { return '<path class="pkpl-sh" data-h="' + k + '" d="' + HH.shapes[k] + '"/>'; }).join('');
    el.innerHTML =
      '<div class="pkpl-world"><img class="pkpl-base" src="farmmap/map.webp?v=33" alt="" draggable="false" decoding="async"><div class="pkpl-tiles"></div>' +
      '<svg class="pkpl-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><filter id="pkpl-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<path class="pkpl-veil" fill-rule="evenodd" d=""/><g class="pkpl-shs">' + shapes + '</g><path class="pkpl-lit" d=""/><path class="pkpl-hov" d=""/></svg></div>' +
      '<div class="pkpl-pins"></div><div class="pkpl-am"></div>' +
      '<div class="pkpl-title" aria-hidden="false"><p class="pkpl-k">Pickathon Neighborhoods</p><h1 class="pkpl-d">A Temporary City of Wonder</h1><p class="pkpl-l">Tap any neighborhood to explore</p></div>' +
      '<div class="pkpl-tools"><button type="button" class="pk-cta sec pkpl-tb" data-pl="find" aria-label="Find a place, an act or water, food and more"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><span>Find</span></button>' +
      '<button type="button" class="pk-cta sec pkpl-tb pkpl-tbf" data-pl="full" aria-label="Full map" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span aria-hidden="true">Full map</span></button></div>' +
      '<div class="pkpl-amtag" hidden><span></span><button type="button" data-pl="amclear" aria-label="Clear">×</button></div>' +
      '<div class="pkpl-hovtag" hidden><b></b><small></small></div>';
    var pins = $('.pkpl-pins', el);
    pins.innerHTML = ids().map(function (k) { var h = data().hoods[k]; return '<button type="button" class="pkpl-em" data-h="' + k + '" aria-label="' + esc(h.n + ', ' + (KIND[h.k] || '')) + '"><img src="' + esc(emb(k)) + '" alt="" draggable="false"></button><span class="pkpl-nm" data-n="' + k + '">' + esc(h.n) + '</span>'; }).join('');
    M = { el: el, world: $('.pkpl-world', el), tiles: $('.pkpl-tiles', el), svg: $('.pkpl-svg', el), pins: pins, s: 0, tx: 0, ty: 0, vw: 0, vh: 0, loaded: {}, done: {}, need: [], cur: '', hov: '', title: true, amen: '', anim: 0 };
    gestures(el);
    return M;
  }
  function minS() { return Math.min(M.vw / W, M.vh / H); }
  function maxS() { return 2.6 * TF / (window.devicePixelRatio || 1); }
  function clampView(s, tx, ty) {   /* keep some map on screen */
    s = Math.max(minS() * 0.9, Math.min(maxS(), s));
    var mw = W * s, mh = H * s, pad = 60;
    tx = mw <= M.vw ? Math.min(Math.max(tx, -mw * 0.25), M.vw - mw * 0.75) : Math.min(pad, Math.max(M.vw - mw - pad, tx));
    ty = mh <= M.vh ? Math.min(Math.max(ty, -mh * 0.25), M.vh - mh * 0.75) : Math.min(pad, Math.max(M.vh - mh - pad, ty));
    return [s, tx, ty];
  }
  function apply(s, tx, ty) {
    var c = clampView(s, tx, ty); M.s = c[0]; M.tx = c[1]; M.ty = c[2];
    M.world.style.transform = 'translate(' + M.tx + 'px,' + M.ty + 'px) scale(' + M.s + ')';
    placePins(); tiles();
  }
  function fitBox(b, reg, pad, keepS) {   /* region in map-box px {x,y,w,h} */
    pad = pad == null ? 24 : pad;
    var s = keepS || Math.min((reg.w - pad * 2) / (b[2] - b[0]), (reg.h - pad * 2) / (b[3] - b[1]));
    s = Math.max(minS() * 0.9, Math.min(maxS(), s));
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    return [s, reg.x + reg.w / 2 - cx * s, reg.y + reg.h / 2 - cy * s];
  }
  function animTo(v, ms) {
    cancelAnimationFrame(M.anim);
    if (!M.s || calm() || ms === 0) { apply(v[0], v[1], v[2]); return; }
    var a = [M.s, M.tx, M.ty], t0 = 0, dur = ms || 520;
    var ease = function (u) { return 1 - Math.pow(1 - u, 3); };
    (function f(t) { if (!t0) t0 = t; var u = Math.min(1, (t - t0) / dur), e = ease(u);
      var s = Math.exp(Math.log(a[0]) + (Math.log(v[0]) - Math.log(a[0])) * e);
      /* interpolate the map point at the region's centre so the zoom feels anchored */
      var cx0 = (M.vw / 2 - a[1]) / a[0], cy0 = (M.vh / 2 - a[2]) / a[0], cx1 = (M.vw / 2 - v[1]) / v[0], cy1 = (M.vh / 2 - v[2]) / v[0];
      var cx = cx0 + (cx1 - cx0) * e, cy = cy0 + (cy1 - cy0) * e;
      apply(s, M.vw / 2 - cx * s, M.vh / 2 - cy * s);
      if (u < 1) M.anim = requestAnimationFrame(f); })(performance.now());
  }
  function tiles() {
    var dpr = window.devicePixelRatio || 1, on = M.s * dpr > 1.0;
    M.el.classList.toggle('pkpl-hi', on); if (!on) return;
    var x0 = -M.tx / M.s, y0 = -M.ty / M.s, x1 = x0 + M.vw / M.s, y1 = y0 + M.vh / M.s, need = [];
    for (var c = Math.max(0, Math.floor(x0 / TS)); c <= Math.min(4, Math.floor(x1 / TS)); c++) for (var r = Math.max(0, Math.floor(y0 / TS)); r <= Math.min(8, Math.floor(y1 / TS)); r++) {
      var k = c + '_' + r; need.push(k); if (M.loaded[k]) continue; M.loaded[k] = 1;
      var im = document.createElement('img'); im.alt = ''; im.draggable = false; im.decoding = 'async';
      im.style.cssText = 'left:' + (c * TS) + 'px;top:' + (r * TS) + 'px;width:' + ((c === 4 ? 802 : 1024) / TF) + 'px;height:' + ((r === 8 ? 952 : 1024) / TF) + 'px';
      im.onload = function () { this.classList.add('on'); M.done[this._k] = 1; tok(); }; im._k = k;
      im.src = 'farmmap/t/' + k + '.webp?v=33'; M.tiles.appendChild(im);
    }
    M.need = need; tok();
  }
  function tok() { M.el.classList.toggle('pkpl-tok', !!(M.need && M.need.length && M.need.every(function (k) { return M.done[k]; }))); }   /* full detail is in: the coarse base steps aside */
  /* emblems: the tap targets while zoomed out; the picked place shows its own ground (no emblem on it). Names show past the first zoom (phone, tablet) or on hover (desktop). */
  function placePins() {
    var named = !wide() && M.s > minS() * 1.9, amen = !!M.amen;
    var L = $$('.pkpl-em', M.pins), N = $$('.pkpl-nm', M.pins);
    for (var i = 0; i < L.length; i++) {
      var k = L[i].getAttribute('data-h'), p = pt(k), x = M.tx + p[0] * M.s, y = M.ty + p[1] * M.s;
      var off = x < -40 || y < -40 || x > M.vw + 40 || y > M.vh + 40, hide = k === M.cur || amen || off;
      L[i].style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
      L[i].hidden = hide; L[i].tabIndex = hide ? -1 : 0;
      var n = N[i]; n.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; n.hidden = hide || !named || x < 60 || x > M.vw - 60 || y > M.vh - 30;   /* no clipped names at the edges */
    }
  }
  function layout() {   /* on load, resize and every render: size the map to its box */
    if (!M || !M.el.isConnected) return;
    var r = M.el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return;
    if (w === M.vw && h === M.vh && M.s) return;
    var had = !!M.s; M.vw = w; M.vh = h;
    if (!had) { home(true); return; }
    if (M.cur) frame(M.cur, true); else apply(M.s, M.tx, M.ty);
  }
  function startView() {   /* desktop and sideways tablet: the festival core fills the width (the full farm is a narrow strip); phone: the whole farm */
    if (!wide()) return fitBox([0, 0, W, H], { x: 0, y: 0, w: M.vw, h: M.vh }, 8);
    var b = union(CORE), s = M.vw / 1700;   /* the farm's own width (map units 280-1980) fills the screen */
    return [s, M.vw / 2 - 1130 * s, M.vh / 2 - (b[1] + b[3]) / 2 * s];
  }
  function home(now) { M.cur = ''; lit(); animTo(startView(), now ? 0 : 520); }
  /* the visible part of the map (phone: above the sheet) */
  function region() {
    if (wide() || top().r !== 'hood') return { x: 0, y: 0, w: M.vw, h: M.vh };
    return { x: 0, y: 0, w: M.vw, h: Math.max(160, Math.round(M.vh * 0.4)) };
  }
  function frame(k, now) {   /* first pick zooms in; another pick while zoomed keeps the zoom and centres */
    var zoomed = M.s > minS() * 1.9 && M.cur && M.cur !== k;
    var v = fitBox(box(k), region(), wide() ? 70 : 22, zoomed ? M.s : 0);
    if (!zoomed) v[0] = Math.min(v[0], wide() ? 1.15 : 1.7), v = fitBox(box(k), region(), 0, v[0]);   /* close enough to see the place, with its neighbors around it */
    M.cur = k; lit(); animTo(v, now ? 0 : 560);
  }
  function lit() {
    var k = M.cur, d = k ? HH.shapes[k] : '';
    $('.pkpl-veil', M.svg).setAttribute('d', k ? 'M-4000,-4000H' + (W + 4000) + 'V' + (H + 4000) + 'H-4000Z ' + d : '');
    $('.pkpl-lit', M.svg).setAttribute('d', d);
    $$('.pkpl-sh', M.svg).forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-h') === k); });
    M.el.classList.toggle('pkpl-picked', !!k);
    var full = $('[data-pl="full"]', M.el); if (full) full.hidden = !k && !M.amen && !(M.s > startView()[0] * 1.15);
    placePins();
  }
  function hover(k, x, y) {
    if (k === M.hov) { if (k) moveTag(x, y); return; }
    M.hov = k; var p = $('.pkpl-hov', M.svg); p.setAttribute('d', k && k !== M.cur ? HH.shapes[k] : '');
    $$('.pkpl-em', M.pins).forEach(function (b) { b.classList.toggle('hov', b.getAttribute('data-h') === k); });
    var t = $('.pkpl-hovtag', M.el); if (!k || k === M.cur) { t.hidden = true; return; }
    var h = data().hoods[k]; $('b', t).textContent = h.n; $('small', t).textContent = KIND[h.k] || ''; t.hidden = false; moveTag(x, y);
  }
  function moveTag(x, y) { var t = $('.pkpl-hovtag', M.el); t.style.transform = 'translate(' + Math.round(Math.min(x + 16, M.vw - t.offsetWidth - 8)) + 'px,' + Math.round(Math.max(8, y - 44)) + 'px)'; }

  /* taps, drags, pinches and the wheel */
  function gestures(el) {
    var P = {}, start = null, moved = false, lastTap = 0;
    function pts() { return Object.keys(P).map(function (k) { return P[k]; }); }
    function rel(e) { var r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.pkpl-tools,.pkpl-amtag,.pkpl-find')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      P[e.pointerId] = rel(e); cancelAnimationFrame(M.anim);
      var q = pts(); start = { s: M.s, tx: M.tx, ty: M.ty, p: q.map(function (a) { return a.slice(); }), t: Date.now() }; if (q.length === 1) moved = false;
      document.body.classList.add('pkpl-drag');
    });
    el.addEventListener('pointermove', function (e) {
      if (!P[e.pointerId]) { if (e.pointerType === 'mouse' && !touch()) { var hp = e.target.closest && e.target.closest('[data-h]'); var r = rel(e); hover(hp ? hp.getAttribute('data-h') : '', r[0], r[1]); } return; }
      P[e.pointerId] = rel(e); var q = pts(); if (!start) return;
      if (q.length === 1 && start.p.length === 1) {
        var dx = q[0][0] - start.p[0][0], dy = q[0][1] - start.p[0][1];
        if (!moved && Math.abs(dx) + Math.abs(dy) < 8) return; moved = true;
        apply(start.s, start.tx + dx, start.ty + dy);
      } else if (q.length >= 2 && start.p.length >= 2) {
        moved = true;
        var d0 = Math.hypot(start.p[0][0] - start.p[1][0], start.p[0][1] - start.p[1][1]) || 1, d1 = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]);
        var c0 = [(start.p[0][0] + start.p[1][0]) / 2, (start.p[0][1] + start.p[1][1]) / 2], c1 = [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2];
        var s = start.s * d1 / d0, mx = (c0[0] - start.tx) / start.s, my = (c0[1] - start.ty) / start.s;
        apply(s, c1[0] - mx * s, c1[1] - my * s);
      }
    });
    function up(e) {
      if (!P[e.pointerId]) return; delete P[e.pointerId];
      var q = pts(); if (q.length) { start = { s: M.s, tx: M.tx, ty: M.ty, p: q.map(function (a) { return a.slice(); }), t: Date.now() }; return; }
      document.body.classList.remove('pkpl-drag');
      if (moved) { el._drag = Date.now(); lit(); return; }
      if (e.type === 'pointercancel') return;
      var r = rel(e), now = Date.now();
      if (now - lastTap < 320 && !e.target.closest('[data-h]')) { lastTap = 0; zoomAt(r, 2); return; }   /* double tap on open ground zooms in */
      lastTap = now;
    }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hover(''); });
    el.addEventListener('click', function (e) {
      if (el._drag && Date.now() - el._drag < 300) { e.stopPropagation(); e.preventDefault(); return; }
      var b = e.target.closest('[data-pl]'); if (b) { tool(b.getAttribute('data-pl'), b); return; }
      var a = e.target.closest('.pkpl-amdot'); if (a) return;
      var h = e.target.closest('[data-h]');
      if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); if (!h) return; }   /* the title screen holds until a click on the map or an icon */
      if (!h) return;
      tap(h.getAttribute('data-h'), e.target.closest('.pkpl-em'));
    }, true);
    el.addEventListener('wheel', function (e) { e.preventDefault(); var r = rel(e); zoomAt(r, Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022))); }, { passive: false });
    el.addEventListener('keydown', function (e) { if (e.target.closest('.pkpl-em,[data-pl],.pkpl-find')) return; var k = e.key, st = 80;
      if (k === '+' || k === '=') zoomAt([M.vw / 2, M.vh / 2], 1.4); else if (k === '-') zoomAt([M.vw / 2, M.vh / 2], 1 / 1.4);
      else if (/^Arrow/.test(k)) apply(M.s, M.tx + (k === 'ArrowLeft' ? st : k === 'ArrowRight' ? -st : 0), M.ty + (k === 'ArrowUp' ? st : k === 'ArrowDown' ? -st : 0)); else return; e.preventDefault(); });
  }
  function zoomAt(c, f) { var s = Math.max(minS() * 0.9, Math.min(maxS(), M.s * f)), mx = (c[0] - M.tx) / M.s, my = (c[1] - M.ty) / M.s; apply(s, c[0] - mx * s, c[1] - my * s); lit(); }
  /* a tap on a crowded cluster zooms into the cluster first (fingers can't hit small shapes) */
  function tap(k, isEm) {
    if (isEm && !wide()) {
      var p = pt(k), near = ids().filter(function (j) { if (j === M.cur) return false; var q = pt(j); return Math.hypot((q[0] - p[0]) * M.s, (q[1] - p[1]) * M.s) < 46; });
      if (near.length > 1) { var b = union(near), m = 30 / M.s; animTo(fitBox([b[0] - m, b[1] - m, b[2] + m, b[3] + m], region(), 40), 520); return; }
    }
    open(k);
  }
  function open(k) { if (top().r === 'hood' && top().h === k) { frame(k); return; } go('hood', { h: k }); }
  function tool(a) {
    if (a === 'full') { M.amen = ''; amenDraw(); if (top().r === 'hood') { go('hoods'); return; } M.title = true; M.el.classList.remove('pkpl-notitle'); home(); return; }   /* Full map: the whole start view with the title back */
    if (a === 'find') { findOpen(); return; }
    if (a === 'amclear') { M.amen = ''; amenDraw(); lit(); return; }
  }

  /* ---------- amenities (from Find) ---------- */
  function amenDraw() {
    var box = $('.pkpl-am', M.el), tag = $('.pkpl-amtag', M.el), D = data(), L = (M.amen && D.amen && D.amen[M.amen]) || [];
    box.innerHTML = L.map(function (p) { return '<span class="pkpl-amdot" data-x="' + p[0] + '" data-y="' + p[1] + '"><img src="amen/' + AMEN[M.amen][1] + '" alt=""></span>'; }).join('');
    tag.hidden = !M.amen; if (M.amen) $('span', tag).textContent = AMEN[M.amen][0] + ' · ' + L.length + ' on the farm';
    amenPlace();
  }
  function amenPlace() { $$('.pkpl-amdot', M.el).forEach(function (d) { var x = M.tx + (+d.getAttribute('data-x')) / 100 * W * M.s, y = M.ty + (+d.getAttribute('data-y')) / 100 * H * M.s; d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }); }
  var placePins0 = placePins; placePins = function () { placePins0(); amenPlace(); };

  /* ---------- Find: neighborhoods, acts and amenities in one box ---------- */
  var ACTS = null;
  function actIndex() {
    if (ACTS) return ACTS; var D = data(), m = {}, HP = D.hoodProg || {}, SH = stageHood();
    Object.keys(HP).forEach(function (k) { (HP[k].kinds || []).forEach(function (g) { (g[1] || []).forEach(function (a) { var n = a[0], y = (a[1] || [])[0]; if (!n) return; var o = m[n] || (m[n] = { n: n, h: {}, y: 0 }); o.h[k] = Math.max(o.h[k] || 0, y || 0); o.y = Math.max(o.y, y || 0); }); }); });
    (D.sets || []).forEach(function (s) { var A = (D.artists || {})[s.a], k = SH[s.st]; if (!A || !k) return; var o = m[A.n] || (m[A.n] = { n: A.n, h: {}, y: 0 }); var y = +String(s.d || s.s).slice(0, 4); o.h[k] = Math.max(o.h[k] || 0, y); o.y = Math.max(o.y, y); });
    ACTS = Object.keys(m).map(function (n) { var o = m[n], best = Object.keys(o.h).sort(function (a, b) { return o.h[b] - o.h[a]; })[0]; return { n: n, h: best, y: o.h[best], f: fold(n) }; });
    return ACTS;
  }
  function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^the /, ''); }
  function findOpen() {
    var f = $('.pkpl-find', M.el);
    if (!f) { f = document.createElement('div'); f.className = 'pkpl-find'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Find');
      f.innerHTML = '<div class="pkpl-fbar"><input type="text" inputmode="search" placeholder="A place, an act, water…" aria-label="Find a place, an act or an amenity" autocomplete="off" enterkeyhint="search"><button type="button" data-pl="fclose" aria-label="Close Find">×</button></div><div class="pkpl-fres"></div>';
      M.el.appendChild(f);
      var inp = $('input', f); inp.addEventListener('input', function () { findDraw(inp.value); });
      f.addEventListener('click', function (e) { e.stopPropagation(); var b = e.target.closest('button'); if (!b) return; var a = b.getAttribute('data-pl');
        if (a === 'fclose') { f.hidden = true; return; }
        var t = b.getAttribute('data-ft'), v = b.getAttribute('data-fv'); f.hidden = true;
        if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); }
        if (t === 'h') open(v); else if (t === 'a') { var o = actIndex().filter(function (x) { return x.n === v; })[0]; if (o) { FROM = o; open(o.h); } } else if (t === 'm') { M.amen = v; amenDraw(); lit(); var L = (data().amen || {})[v] || []; if (L.length) { var bx = [1e9, 1e9, -1e9, -1e9]; L.forEach(function (p) { var x = p[0] / 100 * W, y = p[1] / 100 * H; bx = [Math.min(bx[0], x), Math.min(bx[1], y), Math.max(bx[2], x), Math.max(bx[3], y)]; }); animTo(fitBox([bx[0] - 60, bx[1] - 60, bx[2] + 60, bx[3] + 60], region(), 30), 520); } } });
      f.addEventListener('keydown', function (e) { if (e.key === 'Escape') { f.hidden = true; } });
    }
    f.hidden = false; var i = $('input', f); i.value = ''; findDraw(''); setTimeout(function () { try { i.focus({ preventScroll: true }); } catch (x) {} }, 30);
  }
  function findDraw(q) {
    var f = $('.pkpl-find', M.el), out = $('.pkpl-fres', f), D = data(), Q = fold(q).trim();
    var hs = ids().filter(function (k) { return !Q || fold(D.hoods[k].n).indexOf(Q) >= 0 || fold(D.hoods[k].t).indexOf(Q) >= 0; });
    var am = Object.keys(AMEN).filter(function (k) { return (D.amen || {})[k] && (D.amen[k] || []).length && (!Q || fold(AMEN[k][0]).indexOf(Q) >= 0 || fold(k).indexOf(Q) >= 0); });
    var ac = Q.length >= 2 ? actIndex().filter(function (a) { return a.f.indexOf(Q) >= 0; }).sort(function (a, b) { return (a.f.indexOf(Q) - b.f.indexOf(Q)) || (b.y - a.y) || (a.n < b.n ? -1 : 1); }).slice(0, 8) : [];
    var g = function (h, L) { return L.length ? '<p class="pkpl-fg">' + h + '</p>' + L.join('') : ''; };
    out.innerHTML =
      g('Neighborhoods', hs.slice(0, Q ? 6 : 20).map(function (k) { var h = D.hoods[k]; return '<button type="button" data-ft="h" data-fv="' + k + '"><img src="' + esc(emb(k)) + '" alt=""><span><b>' + esc(h.n) + '</b><small>' + esc(KIND[h.k] || '') + '</small></span></button>'; })) +
      g('On the farm', am.map(function (k) { return '<button type="button" data-ft="m" data-fv="' + k + '"><img src="amen/' + AMEN[k][1] + '" alt=""><span><b>' + AMEN[k][0] + '</b><small>' + (D.amen[k] || []).length + ' on the farm</small></span></button>'; })) +
      g('Acts', ac.map(function (a) { return '<button type="button" data-ft="a" data-fv="' + esc(a.n) + '"><img src="' + esc(emb(a.h)) + '" alt=""><span><b>' + esc(a.n) + '</b><small>' + esc(D.hoods[a.h].n + ' · Pickathon ' + a.y) + '</small></span></button>'; }));
    if (!out.innerHTML) out.innerHTML = '<p class="pkpl-fnone">Nothing by that name yet.</p>';
  }
  var FROM = null;   /* the act a Find pick came from (shown on the sheet) */

  /* ---------- the sheet / panel top ---------- */
  function photos(k) {
    var D = data(), h = D.hoods[k] || {}, L = (HH.prev[k] || []).map(function (e) { return { i: e.i, p: e.p }; });
    (h.hr || []).forEach(function (e) { if (L.length < 5 && !L.some(function (x) { return x.i === e.i; })) L.push({ i: e.i, p: k === 'woods' || !h.hip ? '50% 50%' : h.hip }); });
    if (!L.length && h.hi) L.push({ i: h.hi, p: h.hip || '50% 50%' });
    return L.slice(0, 5);
  }
  function sched(k) {   /* the posted schedule for this place (current festival year), by day */
    var D = data(), SH = stageHood(), Y = String(D.year || ''), out = {};
    (D.sets || []).forEach(function (s) { if (SH[s.st] !== k || String(s.d || s.s).slice(0, 4) !== Y) return; (out[s.d] = out[s.d] || []).push(s); });
    Object.keys(out).forEach(function (d) { out[d].sort(function (a, b) { return a.s < b.s ? -1 : 1; }); });
    return out;
  }
  function tm(s) { var m = String(s || '').match(/(\d\d):(\d\d)/); if (!m) return ''; var h = +m[1], ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m[2] !== '00' ? ':' + m[2] : '') + ' ' + ap; }
  var LBL = { music: 'Music', djs: 'DJ', family: 'Family', wellness: 'Wellness', comedy: 'Comedy', literary: 'Literary', curation: 'Curation', food: 'Food', craft: 'Craft' };
  var TOP = { k: '', day: '', all: false, i: 0, timer: 0 };
  function drawTop() {
    var el = document.getElementById('pkpl-top'); if (!el) return;
    var t = top(), k = t.h, D = data(); if (!k || !D.hoods[k]) { el.innerHTML = ''; return; }
    var h = D.hoods[k], season = site().season || 'off', S = (season === 'sched' || season === 'fest') ? sched(k) : {}, days = Object.keys(S).sort(), has = days.length > 0;
    if (TOP.k !== k) { TOP.k = k; TOP.all = false; TOP.i = 0; TOP.day = days[0] || ''; if (FROM && FROM.h !== k) FROM = null; }
    if (days.indexOf(TOP.day) < 0) TOP.day = days[0] || '';
    var ph = photos(k), L = ids(), j = L.indexOf(k), prev = L[(j - 1 + L.length) % L.length], next = L[(j + 1) % L.length];
    var key = k + '|' + has + '|' + TOP.day + '|' + TOP.all + '|' + (FROM ? FROM.n : '') + '|' + wide();
    if (el._key === key) return; el._key = key;
    var dayN = {}; (D.days || []).forEach(function (d) { dayN[d.id] = d.n; });
    var rows = has ? S[TOP.day] : [], showN = TOP.all ? rows.length : 3;
    var html = '<div class="pkpl-sheet' + (has ? ' pkpl-has' : '') + '">' +
      '<div class="pkpl-grab" aria-hidden="true"><i></i></div>' +
      '<div class="pkpl-hero" aria-roledescription="carousel" aria-label="' + esc(h.n) + ' photos">' +
      ph.map(function (p, i) { return '<img src="' + esc(p.i) + '" alt="" style="object-position:' + esc(p.p) + '"' + (i === 0 ? ' class="on"' : ' loading="lazy"') + ' draggable="false">'; }).join('') +
      '<div class="pkpl-shade" aria-hidden="true"></div>' +
      '<button type="button" class="pkpl-arr l" data-pk="step" data-to="' + prev + '" aria-label="Previous place: ' + esc(D.hoods[prev].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>' +
      '<button type="button" class="pkpl-arr r" data-pk="step" data-to="' + next + '" aria-label="Next place: ' + esc(D.hoods[next].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      (ph.length > 1 ? '<div class="pkpl-dots" role="group" aria-label="Photos">' + ph.map(function (p, i) { return '<button type="button" data-pk="dot" data-i="' + i + '" aria-label="Photo ' + (i + 1) + ' of ' + ph.length + '"' + (i === 0 ? ' aria-current="true"' : '') + '><i></i></button>'; }).join('') + '</div>' : '') +
      '<div class="pkpl-hi"><p class="pkpl-kind">' + esc(KIND[h.k] || '') + '</p><div class="pkpl-nmrow"><img src="' + esc(emb(k)) + '" alt=""><h1>' + esc(h.n) + '</h1></div><p class="pkpl-tt">' + esc(h.t || '') + '</p></div>' +
      '</div>' +
      (FROM ? '<p class="pkpl-from">' + esc(FROM.n) + ' played ' + esc(h.n) + ' at Pickathon ' + FROM.y + '</p>' : '') +
      (has ? '' : '<p class="pkpl-hook">' + esc(h.hook || '') + '</p>') +
      (has ? '<section class="pkpl-sc" aria-label="Schedule at ' + esc(h.n) + '"><div class="pkpl-days" role="group" aria-label="Day">' + days.map(function (d) { return '<button type="button" class="pk-cta sec pkpl-chip" data-pk="day" data-d="' + d + '"' + (d === TOP.day ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(dayN[d] || d.slice(5)) + '</button>'; }).join('') + '</div>' +
        '<ol class="pkpl-sets">' + rows.slice(0, showN).map(function (s) { var A = (D.artists || {})[s.a] || {}; return '<li><span class="pkpl-st">' + tm(s.s) + '</span><span class="pkpl-sa"><b>' + esc(A.n || s.a) + '</b><small>' + esc(LBL[s.l] || '') + '</small></span></li>'; }).join('') + '</ol>' +
        (rows.length > 3 ? '<button type="button" class="pk-cta sec pkpl-whole" data-pk="whole" aria-expanded="' + TOP.all + '">' + (TOP.all ? 'Show less' : 'Whole day at ' + esc(h.n)) + '</button>' : '') + '</section>' : '') +
      '</div>';
    el.innerHTML = html; TOP.i = 0; heroArm(el);
  }
  function heroArm(el) {
    clearTimeout(TOP.timer); var hero = $('.pkpl-hero', el); if (!hero) return;
    var imgs = $$('img:not(.pkpl-nmrow img)', hero).filter(function (x) { return x.parentNode === hero; }); if (imgs.length < 2 || calm()) return;
    (function step() { TOP.timer = setTimeout(function () { if (!hero.isConnected) return; if (document.hidden) { step(); return; } heroShow(hero, (TOP.i + 1) % imgs.length); step(); }, HERO_MS); })();   /* the photo rotation itself, not layout */
  }
  function heroShow(hero, i) {
    var imgs = $$('img', hero).filter(function (x) { return x.parentNode === hero; }); TOP.i = i;
    imgs.forEach(function (x, j) { x.classList.toggle('on', j === i); if (j === i) x.loading = 'eager'; });
    $$('.pkpl-dots button', hero).forEach(function (b, j) { if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  }
  /* phone and portrait tablet: the sheet. Its scroll is the phone scroller: the space above it is see-through, so dragging the sheet down shows the map and dragging it up opens the page */
  function scroller() { return document.getElementById('pk-scroll-phone'); }
  function sheetVars() {   /* the map's height: the phone scroller, or the window under the sticky desktop header */
    var sc = scroller(), vh, hd = 0;
    if (sc) vh = sc.clientHeight; else { var h = document.querySelector('#root header'); hd = h && getComputedStyle(h).position === 'sticky' ? h.offsetHeight : 0; vh = window.innerHeight - (top().r === 'hoods' && h ? Math.max(hd, Math.round(h.getBoundingClientRect().bottom)) : hd); }
    var k = vh + '|' + hd; if (k === sheetVars._k) return; sheetVars._k = k;
    document.documentElement.style.setProperty('--pkpl-vh', vh + 'px'); document.documentElement.style.setProperty('--pkpl-hd', hd + 'px');
  }
  var lastHood = '';
  function settleSheet() {   /* a new place opens with the sheet at about 60% (55% on portrait tablet) */
    var t = top(); if (t.r !== 'hood' || wide()) { lastHood = t.r === 'hood' ? t.h : ''; return; }
    if (lastHood === t.h) return; lastHood = t.h;
    var sc = scroller(), sp = document.getElementById('pkpl-sp'); if (!sc || !sp) return;
    var set = function () { if (!sp.isConnected) return; var vh = sc.clientHeight, f = window.innerWidth >= 700 ? 0.55 : 0.6; sc.scrollTop = Math.max(0, sp.offsetTop + sp.offsetHeight - Math.round(vh * (1 - f))); };
    var touched = false, mv = function () { touched = true; };
    ['touchstart', 'wheel', 'keydown', 'pointerdown'].forEach(function (k) { window.addEventListener(k, mv, { once: true, passive: true, capture: true }); });
    set(); requestAnimationFrame(set); setTimeout(function () { if (!touched) set(); }, 120);   /* once, after the app's own scroll-to-top for a new page */
  }

  /* ---------- keeping in step with the app ---------- */
  function mount() {
    var isle = document.getElementById('pkpl'), t = top();
    document.body.classList.toggle('pkpl-on', !!isle);
    document.body.classList.toggle('pkpl-hood', !!isle && t.r === 'hood');
    document.body.classList.toggle('pkpl-wide', !!isle && wide());
    if (!isle) { lastHood = ''; return; }
    if (!data()) return;
    if (!M) makeMap();
    if (M.el.parentNode !== isle) { isle.appendChild(M.el); }
    sheetVars(); layout();
    drawTop();
    if (t.r === 'hood' && t.h && t.h !== M.cur && HH.shapes[t.h]) { if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); } frame(t.h, !M.s); }   /* arriving at a place shows it, never the title screen */
    if (t.r === 'hoods' && M.cur) { M.cur = ''; lit(); }
    settleSheet(); dedupe();
    var full = $('[data-pl="full"]', M.el); if (full) full.hidden = !M.cur && !M.amen && !(M.s > startView()[0] * 1.15);
  }
  function dedupe() { var d = document.querySelector('.pk-hd-desc0'), h = data().hoods[top().h || ''] || {}; if (d) d.classList.toggle('pkpl-dup', !!h.hook && fold(d.textContent).trim() === fold(h.hook).trim()); }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-pk]') : null; if (!b || !b.closest('#pkpl-top')) return;
    var a = b.getAttribute('data-pk');
    if (a === 'step') { FROM = null; go('hood', { h: b.getAttribute('data-to') }); return; }
    if (a === 'dot') { var hero = b.closest('.pkpl-hero'); clearTimeout(TOP.timer); heroShow(hero, +b.getAttribute('data-i')); return; }
    if (a === 'day') { TOP.day = b.getAttribute('data-d'); TOP.all = false; drawTop(); return; }
    if (a === 'whole') { TOP.all = !TOP.all; drawTop(); return; }
  }
  /* sideways swipe on the sheet steps to the next place (phone, tablet; a mouse drag on desktop) */
  (function swipe() {
    var s = null;
    document.addEventListener('pointerdown', function (e) { var t = e.target.closest && e.target.closest('#pkpl-top .pkpl-hero'); s = t ? { x: e.clientX, y: e.clientY, t: Date.now() } : null; }, true);
    document.addEventListener('pointerup', function (e) { if (!s) return; var dx = e.clientX - s.x, dy = e.clientY - s.y, dt = Date.now() - s.t; s = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 700) { var k = top().h, L = ids(), j = L.indexOf(k); if (j < 0) return; FROM = null; go('hood', { h: L[(j + (dx < 0 ? 1 : -1) + L.length) % L.length] }); } }, true);
  })();
  function sync() { try { mount(); } catch (e) { if (window.console) console.error('pk-places', e); } }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); sync(); return r; };
  document.addEventListener('click', onClick);
  window.addEventListener('resize', function () { sheetVars(); if (M) { layout(); } sync(); });
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { sheetVars(); layout(); }); var watch = function () { var sc = scroller(); if (sc && sc !== watch._on) { if (watch._on) ro.unobserve(watch._on); ro.observe(sc); watch._on = sc; } if (M && !M._ro) { M._ro = 1; ro.observe(M.el); } }; var mount0 = mount; mount = function () { mount0(); watch(); }; }
  window.__pkPlaces = { map: function () { return M; }, open: open, home: function () { if (M) home(); } };
  sync();
})();
