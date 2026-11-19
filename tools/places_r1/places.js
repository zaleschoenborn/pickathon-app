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
  var NB = /*@NAME_BOXES*/null, NP = /*@NAME_PATHS*/null;   /* NP: each neighborhood's lettering as drawn on the 2026 map (vector, from the PDF) */   /* where each neighborhood's own painted name sits on the art (from the 2026 PDF): labels go right on it */
  var MI = /*@MAP_ICONS*/null, AMI = /*@AMEN_ICONS*/null;   /* the map's amenity icons, lifted from the 2026 layered map PDF: [kind, x, y, owner neighborhood] (tools/places_r1/map_icons.json) and their one-color glyphs (amen_icons.json) */
  var XH = /*@XP_HOME*/null, XM = /*@XP_MINE*/null;   /* experiences: Home's words, icons and photos (tools/places_r1/xp_home.json) and this chat's final Nov 19 picks (tools/places_r1/xp_manifest.json) */
  if (!XH || !XM) XH = XM = null;
  var W = HH.size[0], H = HH.size[1], TF = 4898 / 2041, TS = 1024 / TF;   /* farmmap/t/<col>_<row>.webp: the full-detail map in 1024px tiles (4898 x 9144) */
  var KIND = { stage: 'Stage neighborhood', around: 'Gathering neighborhood', camp: 'Camping neighborhood' };
  var ORDER = ['woods', 'paddock', 'cherryhill', 'grove', 'windmill', 'galaxy', 'lucky', 'farmhouse', 'curation', 'refuge', 'coyote', 'courtyard', 'market', 'orchard', 'welcomelot', 'lushcamp', 'quailtrail', 'southcamp', 'wildcamp', 'willowcamp'];
  var CORE = ['woods', 'refuge', 'coyote', 'cherryhill', 'market', 'grove', 'windmill', 'paddock', 'galaxy', 'courtyard'];   /* desktop start: Woods down to the Courtyard (addendum 3) */
  var AMN = { stage: 'Stages', restroom: 'Restrooms', water: 'Water', food: 'Food', bar: 'Bars', coffee: 'Coffee', craft: 'Craft and makers', atm: 'ATMs', dishes: 'Dish return', dishwash: 'Dish wash', wash: 'Hand wash', medical: 'Medical', shower: 'Showers', charge: 'Charging', info: 'Info', ice: 'Ice', dj: 'DJ booths', smoke: 'Smoking', shuttle: 'Shuttle', bike: 'Bike parking', moto: 'Motorcycle parking', parking: 'Parking', rv: 'RV camping', carcamp: 'Car camping', access: 'Accessible camping', gear: 'Gear drops', tent: 'Camp sites' };
  var ISZ = { gear: 40 }, IS0 = 30;   /* plate size in map pixels (the art's plates were about 41) */
  function amGlyph(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ((AMI || {})[k] || '') + '</svg>'; }
  function amOf(k) { return (MI || []).filter(function (z) { return z[0] === k; }); }
  function amUse(z) { var w = ISZ[z[0]] || IS0; return '<use href="#pkpl-i-' + z[0] + '" x="' + (z[1] - w / 2) + '" y="' + (z[2] - w / 2) + '" width="' + w + '" height="' + w + '"/>'; }
  var AMEN = { restroom: ['Restrooms', 'restroom.webp'], water: ['Water', 'water.webp'], bar: ['Bars', 'bar.webp'], food: ['Food', 'food.webp'], coffee: ['Coffee', 'coffee.webp'], craft: ['Craft', 'craft.webp'], shower: ['Showers', 'shower.webp'], atm: ['ATMs', 'atm.webp'], kids: ['Kids', 'kids.svg'], shuttle: ['Shuttle', 'shuttle.webp'], access: ['Accessible', 'access.webp'], medical: ['Medical', 'medical.webp'], info: ['Info', 'info.webp'], charge: ['Charging', 'charge.webp'], merch: ['Merch', 'merch.webp'], ice: ['Ice', 'ice.webp'], dishes: ['Dish return', 'dishes.webp'], bike: ['Bike parking', 'bike.webp'], massage: ['Massage', 'massage.webp'], smoke: ['Smoking', 'smoke.webp'] };
  var HERO_MS = 6500, HERO_FADE = 1500;   /* Zale, Nov 19: calmer: 6.5 s per photo, 1.5 s crossfade */

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


  /* ---------- experiences (Zale, Nov 19: it is all about the experience; Home's list, order, icons and words) ---------- */
  var XO = XH ? Object.keys(XH.XPD) : [];
  var XFIX = { Music: ['woods', 'paddock', 'cherryhill', 'grove', 'windmill', 'galaxy', 'lucky', 'farmhouse', 'curation'], DJs: ['market', 'courtyard', 'windmill', 'woods', 'curation'], Literary: ['woods', 'windmill'], Wellness: ['lucky', 'courtyard', 'refuge', 'coyote', 'windmill'] };   /* Zale's Nov 19 rulings over Home's first lists: no Literary or DJs at Lucky; Literary at the Woods; Wellness at Coyote is movement and play */
  var XPC = {}, XAC = {};
  function xpPlaces(e) {
    if (XPC[e]) return XPC[e]; var D = data(), L;
    if (e === 'Architecture') L = ids().filter(function (k) { return D.hoods[k].k !== 'camp'; });
    else if (e === 'Camping') L = ['wildcamp', 'lushcamp', 'willowcamp', 'southcamp'];
    else L = XFIX[e] || Object.keys((XH.XPB || {})[e] || {});
    return (XPC[e] = L.filter(function (k) { return HH.shapes[k] && D.hoods[k]; }));
  }
  function xpAt(k) { return XAC[k] || (XAC[k] = XO.filter(function (e) { return xpPlaces(e).indexOf(k) >= 0; })); }
  function xpPhotos(e, k) {
    var out = [], add = function (z) { if (z && z.i && !out.some(function (o) { return o.i === z.i; })) out.push({ i: z.i, p: z.p || '50% 50%' }); };
    if (e === 'Architecture') (((XM.arch || {})[k]) || []).forEach(function (z) { add({ i: z.f, p: z.p }); });
    else {
      (((XM.xp || {})[e] || {})[k] || []).forEach(function (z) { add({ i: z.f, p: z.p }); });
      var h = ((XH.XPH || {})[e] || {})[k]; (Array.isArray(h) ? h : h ? [h] : []).forEach(function (z) { add(typeof z === 'string' ? { i: z } : z); });
    }
    if (out.length < 3 && e !== 'Architecture') (((XM.arch || {})[k]) || []).slice(0, 3 - out.length).forEach(function (z) { add({ i: z.f, p: z.p }); });
    return out.slice(0, e === 'Architecture' ? 8 : 5);
  }
  function xpLine(e, k) { var b = ((XH.XPB || {})[e] || {})[k]; return b || (e === 'Architecture' ? ((data().hoods[k] || {}).t || '') : XH.XPD[e] || ''); }
  function xpIcon(e) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (XH.XPI[e] || '') + '</svg>'; }
  function litSet() { return M && M.xp ? xpPlaces(M.xp) : []; }

  /* ---------- the map ---------- */
  var M = null;   /* one map for the whole visit */
  function makeMap() {
    var el = document.createElement('div'); el.className = 'pkpl-map'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Farm map');
    var shapes = ids().map(function (k) { return '<path class="pkpl-sh" data-h="' + k + '" d="' + HH.shapes[k] + '"/>'; }).join('');
    el.innerHTML =
      '<div class="pkpl-world"><img class="pkpl-base" src="farmmap/map2.webp?v=3" alt="" draggable="false" decoding="async"><div class="pkpl-tiles"></div>' +
      '<svg class="pkpl-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><filter id="pkpl-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' + Object.keys(AMI || {}).map(function (k) { return '<symbol id="pkpl-i-' + k + '" viewBox="0 0 24 24"><rect class="pkpl-ip" x=".75" y=".75" width="22.5" height="22.5" rx="5"/><g class="pkpl-ig" transform="translate(2.4 2.4) scale(.8)">' + AMI[k] + '</g></symbol>'; }).join('') + '</defs>' +
      '<g class="pkpl-ics">' + (MI || []).map(amUse).join('') + '</g>' +
      '<path class="pkpl-veil" fill-rule="evenodd" d=""/><g class="pkpl-icon"></g><g class="pkpl-shs">' + shapes + '</g><path class="pkpl-lit" d=""/><path class="pkpl-was" d=""/><g class="pkpl-nms">' + Object.keys(NP || {}).map(function (k) { return '<path data-h="' + k + '" d="' + NP[k] + '"/>'; }).join('') + '</g><path class="pkpl-hov" d=""/></svg></div>' +
      '<div class="pkpl-pins"></div><div class="pkpl-am"></div>' +
      '<div class="pkpl-title" aria-hidden="false"><p class="pkpl-k"><img class="pkpl-logo" src="logo27-gold.png" alt="Pickathon 2027"><span>Pickathon</span></p><h1 class="pkpl-d">Summer camp for your soul</h1><p class="pkpl-l">Pick an experience below, then tap a place that lights up</p><div class="pkpl-ab"></div><div class="pkpl-pl"></div></div>' +
      '<div class="pkpl-xls"></div>' +
      '<div class="pkpl-xb" role="toolbar" aria-label="Experiences">' + XO.map(function (e) { return '<button type="button" class="pkpl-xe" data-xp="' + e + '" aria-pressed="false">' + xpIcon(e) + '<span>' + e + '</span></button>'; }).join('') + '</div>' +
      '<div class="pkpl-tools"><button type="button" class="pk-cta sec pkpl-tb" data-pl="find" aria-label="Find a place, an act or water, food and more"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><span>Find</span></button>' +
      '<button type="button" class="pk-cta sec pkpl-tb pkpl-tbf" data-pl="full" aria-label="Full map" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span aria-hidden="true">Full map</span></button></div>' +
      '<div class="pkpl-amtag" hidden><span></span><button type="button" data-pl="amclear" aria-label="Clear">×</button></div>' +
      '<div class="pkpl-hovtag" hidden><b></b><small></small></div>';
    var pins = $('.pkpl-pins', el);
    pins.innerHTML = ids().map(function (k) { var h = data().hoods[k]; return '<button type="button" class="pkpl-em" data-h="' + k + '" aria-label="' + esc(h.n + ', ' + (KIND[h.k] || '')) + '"><img src="' + esc(emb(k)) + '" alt="" draggable="false"></button><span class="pkpl-nm" data-n="' + k + '">' + esc(h.n) + '</span>'; }).join('');
    M = { xp: '', el: el, world: $('.pkpl-world', el), tiles: $('.pkpl-tiles', el), svg: $('.pkpl-svg', el), pins: pins, s: 0, tx: 0, ty: 0, vw: 0, vh: 0, loaded: {}, done: {}, need: [], cur: '', hov: '', title: true, amen: '', anim: 0 };
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
  /* Nov 18 (fluid map): one paint per frame. While a finger or glide is moving the map only the world moves
     (pins ride along with one layer transform, or hide during a pinch); pins, tiles and the glow catch up when it settles. */
  function apply(s, tx, ty) {
    var c = clampView(s, tx, ty); M.s = c[0]; M.tx = c[1]; M.ty = c[2];
    if (!M.raf) M.raf = requestAnimationFrame(paint);
  }
  function paint() {
    M.raf = 0;
    M.world.style.transform = 'translate3d(' + M.tx + 'px,' + M.ty + 'px,0) scale(' + M.s + ')';
    if (M.moving) {
      var L = M.laid;
      if (L && Math.abs(L[0] - M.s) < 1e-6) { M.pins.style.transform = 'translate3d(' + (M.tx - L[1]) + 'px,' + (M.ty - L[2]) + 'px,0)'; M.el.classList.remove('pkpl-pinch'); }
      else M.el.classList.add('pkpl-pinch');
      return;
    }
    settle();
  }
  function settle() { M.pins.style.transform = ''; M.el.classList.remove('pkpl-pinch'); placePins(); M.laid = [M.s, M.tx, M.ty]; tiles(); }
  function moving(on) { M.moving = on; M.el.classList.toggle('pkpl-moving', on); if (!on) { cancelAnimationFrame(M.raf); M.raf = 0; paint(); } }
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
      if (!M.moving) moving(true);
      apply(s, M.vw / 2 - cx * s, M.vh / 2 - cy * s);
      if (u < 1) M.anim = requestAnimationFrame(f); else moving(false); })(performance.now());
  }
  function tiles() {
    var dpr = window.devicePixelRatio || 1, on = M.s * dpr > 1.0;
    M.el.classList.toggle('pkpl-hi', on); if (!on) return;
    var x0 = -M.tx / M.s, y0 = -M.ty / M.s, x1 = x0 + M.vw / M.s, y1 = y0 + M.vh / M.s, need = [];
    for (var c = Math.max(0, Math.floor(x0 / TS)); c <= Math.min(4, Math.floor(x1 / TS)); c++) for (var r = Math.max(0, Math.floor(y0 / TS)); r <= Math.min(8, Math.floor(y1 / TS)); r++) {
      var k = c + '_' + r; need.push(k); if (M.loaded[k]) continue; M.loaded[k] = 1;
      var im = document.createElement('img'); im.alt = ''; im.draggable = false; im.decoding = 'async';
      im.style.cssText = 'left:' + (c * TS) + 'px;top:' + (r * TS) + 'px;width:' + ((c === 4 ? 802 : 1024) / TF + 0.4) + 'px;height:' + ((r === 8 ? 952 : 1024) / TF + 0.4) + 'px';   /* a hair of overlap so no seam shows between tiles */
      im.onload = function () { this.classList.add('on'); M.done[this._k] = 1; tok(); }; im._k = k;
      im.src = 'farmmap/t2/' + k + '.webp?v=3'; M.tiles.appendChild(im);
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
  function xbHome() { var xb = $('.pkpl-xb', M.el), t = $('.pkpl-title', M.el), want = M.el; if (xb && t && xb.parentNode !== want) want.appendChild(xb); }   /* desktop: a menu under the title; phone: the bottom row */
  function layout() {   /* on load, resize and every render: size the map to its box */
    if (!M || !M.el.isConnected) return; xbHome();
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
  function lw() { return Math.round(Math.max(400, Math.min(480, window.innerWidth * 0.32))); }   /* desktop left column: phone-card width, the map is the hero (Zale, Nov 19) */
  function clear() { var r = region(), t = wide() && top().r !== 'hood' ? lw() : 0, ti = $('.pkpl-title', M.el), up = wide() ? 78 : (M.title && ti ? Math.max(0, ti.offsetHeight - 14) : 0), dn = wide() ? 8 : 150; return { x: r.x + t, y: r.y + up, w: r.w - t, h: Math.max(160, r.h - up - dn) }; }   /* the lit places fill what is left */   /* above the experience bar and the amenity tag */
  function region() {
    if (wide() || top().r !== 'hood') return { x: 0, y: 0, w: M.vw, h: M.vh };
    return { x: 0, y: 0, w: M.vw, h: Math.max(160, Math.round(M.vh * 0.4)) };
  }
  function frame(k, now) {   /* first pick zooms in; another pick while zoomed keeps the zoom and centres */
    var zoomed = M.s > minS() * 1.9 && M.cur && M.cur !== k;
    var rg = region(); if (wide()) rg = { x: rg.x, y: rg.y + 84, w: rg.w, h: rg.h - 84 };   /* desktop: below the experience row */
    var v = fitBox(box(k), rg, wide() ? 40 : 22, zoomed ? M.s : 0);
    if (!zoomed) v[0] = Math.min(v[0], wide() ? 1.5 : 1.7), v = fitBox(box(k), rg, 0, v[0]);   /* close enough to see the place, with its neighbors around it */
    M.cur = k; lit(); animTo(v, now ? 0 : 560);
  }
  function lit() {
    var k = M.cur, L = (!k && M.amen) ? Object.keys(amenHoods()) : (!k && M.xp) ? litSet() : [], d = k ? HH.shapes[k] : L.map(function (h) { return HH.shapes[h]; }).join(' ');
    $('.pkpl-veil', M.svg).setAttribute('d', d ? 'M-4000,-4000H' + (W + 4000) + 'V' + (H + 4000) + 'H-4000Z ' + d : '');
    $('.pkpl-lit', M.svg).setAttribute('d', d);
    $('.pkpl-was', M.svg).setAttribute('d', (!k && M.was && (M.xp || M.amen) && HH.shapes[M.was]) || '');
    $$('.pkpl-sh', M.svg).forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-h') === k); });
    M.el.classList.toggle('pkpl-picked', !!k); M.el.classList.toggle('pkpl-xpon', !k && (!!M.xp || !!M.amen));
    var full = $('[data-pl="full"]', M.el); if (full) full.hidden = !k && !M.amen && !M.xp && !(M.s > startView()[0] * 1.15);
    placePins(); xpLabels(); xbDraw();
  }
  /* the experience bar, its title screen and the names on the lit places */
  function xbDraw() {
    if (!M) return; var t = top(), at = (t.r === 'hood' && t.h) ? xpAt(t.h) : null;
    $$('.pkpl-xe', M.el).forEach(function (b) { var e = b.getAttribute('data-xp'); var cur = at ? TOP.xp : M.xp; b.setAttribute('aria-pressed', e === cur ? 'true' : 'false'); b.classList.toggle('quiet', !!at && at.indexOf(e) < 0); });
  }
  function titleDraw() {
    var t = $('.pkpl-title', M.el); if (!t) return;

    var d = $('.pkpl-d', t);   /* desktop: the experience big, then "at" and the year's logo as the word Pickathon (Zale, Nov 19) */
    if (M.xp) d.innerHTML = '<span class="pkpl-xi">' + xpIcon(M.xp) + '</span><span class="pkpl-xt">' + esc(M.xp) + ' at Pickathon</span>';   /* the experience's icon as a graphic, same plate as the picked button (Zale, Nov 19) */
    else d.textContent = 'Summer camp for your soul';
    t.classList.toggle('pkpl-tx', !!M.xp);
    $('.pkpl-l', t).textContent = M.xp ? (XH.XPD[M.xp] || '') : (wide() ? 'Pick an experience above, then a place' : 'Pick an experience below, then tap a place that lights up');
    var ab = $('.pkpl-ab', t);   /* Architecture: what it is and how to build with us (Zale, Nov 19: it's how sponsors find us) */
    if (ab) ab.innerHTML = M.xp === 'Architecture' ? '<p>Every summer we build a small city in the forest. Each neighborhood is designed and built new with architects, students, builders and makers, and when the festival ends the structures move on to permanent homes in the community. Two of our builds have won AIA awards.</p><button type="button" class="pk-cta sec pkpl-abb" data-go="build">Build with Pickathon</button>' : '';
    var pl = $('.pkpl-pl', t), L = M.xp ? litSet() : [];   /* desktop: where this experience happens; a row opens the place (Zale, Nov 19) */
    if (pl && !M.xp && !M.amen) { pl.innerHTML = '<div class="pkpl-pg">' + XO.map(function (e) { return '<button type="button" class="pkpl-xe" data-xp="' + e + '">' + xpIcon(e) + '<span>' + e + '</span></button>'; }).join('') + '</div>'; return; }   /* arrival: choose your adventure right under the title */
    if (pl) pl.innerHTML = L.length ? L.map(function (k) { var h = data().hoods[k]; return '<button type="button" class="pkpl-pr" data-hp="' + k + '"><img src="' + esc(emb(k)) + '" alt=""><span><b>' + esc(h.n) + '</b><small>' + esc(xpLine(M.xp, k)) + '</small></span></button>'; }).join('') : '';
    if (pl && wide()) { pl.classList.remove('pkpl-many'); t.classList.remove('pkpl-tight', 'pkpl-tight2', 'pkpl-tight3', 'pkpl-tight4'); var over = function () { return t.scrollHeight > t.clientHeight + 2; };   /* fit without scrolling: full rows, then a compact grid, then a tighter title (Zale, Nov 19) */
      if (L.length && over()) pl.classList.add('pkpl-many'); if (over()) t.classList.add('pkpl-tight'); if (over()) t.classList.add('pkpl-tight2'); if (over()) t.classList.add('pkpl-tight3'); if (over()) t.classList.add('pkpl-tight4'); }
  }
  function xpLabels() {
    nmDraw(); var box = $('.pkpl-xls', M.el); if (!box) return; var C = (!M.cur && M.amen) ? amenHoods() : null, L = C ? Object.keys(C) : (!M.cur && M.xp) ? litSet() : [];
    box.innerHTML = L.map(function (k) { return '<span class="pkpl-xl" data-h="' + k + '">' + esc(data().hoods[k].n) + (C && C[k] ? ' · ' + C[k] : '') + '</span>'; }).join(''); xlPlace();
  }
  function nmDraw() {   /* the map's own lettering, crisp, for the lit places (Zale, Nov 19: no added tags) */
    var C = (!M.cur && M.amen) ? amenHoods() : null, L = C ? Object.keys(C) : (!M.cur && M.xp) ? litSet() : [];
    $$('.pkpl-nms path', M.svg).forEach(function (p) { var k = p.getAttribute('data-h'), on = L.indexOf(k) >= 0, nb = (NB || {})[k]; p.classList.toggle('on', on);
      if (on && nb) { var cx = (nb[0] + nb[2]) / 2, cy = (nb[1] + nb[3]) / 2, f = Math.max(1, Math.min(2.2, 10 / ((nb[3] - nb[1]) * M.s))); p.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + f.toFixed(2) + ') translate(' + (-cx) + ' ' + (-cy) + ')'); } });
  }
  function xlPlace() { if (M.svg) nmDraw();
    var els = $$('.pkpl-xl', M.el); if (!els.length) return;
    var P = els.map(function (el) { var k = el.getAttribute('data-h'), nb = (NB || {})[k], p = nb ? [(nb[0] + nb[2]) / 2, (nb[1] + nb[3]) / 2] : pt(k); if (nb) el.style.fontSize = Math.max(9, Math.min(14, (nb[3] - nb[1]) * M.s * 0.9)) + 'px'; return { el: el, x: M.tx + p[0] * M.s, y: M.ty + p[1] * M.s, w: el.offsetWidth || 90 }; }).sort(function (a, b) { return a.y - b.y; });
    P.forEach(function (a, i) { for (var j = 0; j < i; j++) { var b = P[j]; if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 6 && Math.abs(a.y - b.y) < 17) a.y = b.y + 17; } a.x = Math.max(a.w / 2 + 6, Math.min(M.vw - a.w / 2 - 6, a.x)); a.el.style.transform = 'translate(' + Math.round(a.x) + 'px,' + Math.round(a.y) + 'px) translate(-50%,-50%)'; a.el.hidden = a.y < 0 || a.y > M.vh; });
  }
  function fitLit() {
    var L = M.amen ? Object.keys(amenHoods()) : litSet(); if (!L.length) { home(); return; }
    animTo(fitBox(union(L), clear(), wide() ? 18 : 16), 560);
  }
  function xpPick(e) {
    var t0 = top(); M.was = (t0.r === 'hood' && t0.h) ? t0.h : '';   /* Zale, Nov 19: an experience button always goes back to the map; the place you were in keeps a soft outline */
    if (M.xp === e && !M.cur && top().r !== 'hood') { M.xp = ''; M.title = true; M.el.classList.remove('pkpl-notitle'); titleDraw(); lit(); home(); return; }   /* tap the picked experience again: back to the whole farm */
    M.xp = e; M.amen = ''; amenDraw(); M.cur = ''; M.title = true; M.el.classList.remove('pkpl-notitle'); titleDraw();
    if (top().r === 'hood') go('hoods');
    lit(); fitLit();
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
    var P = {}, start = null, moved = false, lastTap = 0, vel = [0, 0], last = null;
    function pts() { return Object.keys(P).map(function (k) { return P[k]; }); }
    function rel(e) { var r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.pkpl-tools,.pkpl-amtag,.pkpl-find,.pkpl-xb,.pkpl-pl,.pkpl-ab')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      P[e.pointerId] = rel(e); cancelAnimationFrame(M.anim); cancelAnimationFrame(M.glide);
      var q = pts(); start = { s: M.s, tx: M.tx, ty: M.ty, p: q.map(function (a) { return a.slice(); }), t: Date.now() }; if (q.length === 1) moved = false;
      vel = [0, 0]; last = null;
      el.classList.add('pkpl-drag');
    });
    el.addEventListener('pointermove', function (e) {
      if (!P[e.pointerId]) { if (e.pointerType === 'mouse' && !touch()) { var hp = e.target.closest && e.target.closest('[data-h]'); var r = rel(e); hover(hp ? hp.getAttribute('data-h') : '', r[0], r[1]); } return; }
      P[e.pointerId] = rel(e); var q = pts(); if (!start) return;
      if (q.length === 1 && start.p.length === 1) {
        var dx = q[0][0] - start.p[0][0], dy = q[0][1] - start.p[0][1];
        if (!moved && Math.abs(dx) + Math.abs(dy) < 8) return; if (!moved) moving(true); moved = true;
        var now = performance.now(); if (last) { var dt = Math.max(1, now - last.t), k = 0.75; vel = [vel[0] * (1 - k) + (q[0][0] - last.x) / dt * k, vel[1] * (1 - k) + (q[0][1] - last.y) / dt * k]; } last = { x: q[0][0], y: q[0][1], t: now };
        apply(start.s, start.tx + dx, start.ty + dy);
      } else if (q.length >= 2 && start.p.length >= 2) {
        if (!moved) moving(true); moved = true; vel = [0, 0]; last = null;
        var d0 = Math.hypot(start.p[0][0] - start.p[1][0], start.p[0][1] - start.p[1][1]) || 1, d1 = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]);
        var c0 = [(start.p[0][0] + start.p[1][0]) / 2, (start.p[0][1] + start.p[1][1]) / 2], c1 = [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2];
        var s = start.s * d1 / d0, mx = (c0[0] - start.tx) / start.s, my = (c0[1] - start.ty) / start.s;
        apply(s, c1[0] - mx * s, c1[1] - my * s);
      }
    });
    function up(e) {
      if (!P[e.pointerId]) return; delete P[e.pointerId];
      var q = pts(); if (q.length) { start = { s: M.s, tx: M.tx, ty: M.ty, p: q.map(function (a) { return a.slice(); }), t: Date.now() }; last = null; vel = [0, 0]; return; }
      el.classList.remove('pkpl-drag');
      if (moved) {
        el._drag = Date.now();
        var sp = Math.hypot(vel[0], vel[1]), idle = last ? performance.now() - last.t : 999;
        if (sp > 0.25 && idle < 80 && !calm()) {   /* a flick glides and eases out */
          var vx = vel[0], vy = vel[1], t0 = performance.now();
          (function g(t) { var dt = Math.min(32, t - t0); t0 = t; var f = Math.pow(0.94, dt / 16.7); vx *= f; vy *= f;
            apply(M.s, M.tx + vx * dt, M.ty + vy * dt);
            if (Math.hypot(vx, vy) > 0.02) M.glide = requestAnimationFrame(g); else { moving(false); lit(); } })(t0);
        } else { moving(false); lit(); }
        return;
      }
      if (e.type === 'pointercancel') return;
      var r = rel(e), now = Date.now();
      if (now - lastTap < 320 && !e.target.closest('[data-h]')) { lastTap = 0; zoomAt(r, 2); return; }   /* double tap on open ground zooms in */
      lastTap = now;
    }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hover(''); });
    el.addEventListener('click', function (e) {
      if (el._drag && Date.now() - el._drag < 300) { e.stopPropagation(); e.preventDefault(); return; }
      var xb = e.target.closest('[data-xp]'); if (xb) { xpPick(xb.getAttribute('data-xp')); return; }
      var gb = e.target.closest('[data-go]'); if (gb) { go(gb.getAttribute('data-go')); return; }
      var hp = e.target.closest('[data-hp]'); if (hp) { if (M.title) { M.title = false; } open(hp.getAttribute('data-hp')); return; }
      var b = e.target.closest('[data-pl]'); if (b) { tool(b.getAttribute('data-pl'), b); return; }
      var a = e.target.closest('.pkpl-amdot'); if (a) return;
      var h = e.target.closest('[data-h]');
      if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); if (!h) return; }   /* the title screen holds until a click on the map or an icon */
      if (!h) return;
      tap(h.getAttribute('data-h'), e.target.closest('.pkpl-em'));
    }, true);
    el.addEventListener('wheel', function (e) { e.preventDefault(); var r = rel(e); if (!M.moving) moving(true); clearTimeout(M.wt); M.wt = setTimeout(function () { moving(false); lit(); }, 140);
      var f = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0022)), s = Math.max(minS() * 0.9, Math.min(maxS(), M.s * f)), mx = (r[0] - M.tx) / M.s, my = (r[1] - M.ty) / M.s; apply(s, r[0] - mx * s, r[1] - my * s); }, { passive: false });
    el.addEventListener('keydown', function (e) { if (e.target.closest('.pkpl-em,[data-pl],.pkpl-find')) return; var k = e.key, st = 80;
      if (k === '+' || k === '=') zoomAt([M.vw / 2, M.vh / 2], 1.4); else if (k === '-') zoomAt([M.vw / 2, M.vh / 2], 1 / 1.4);
      else if (/^Arrow/.test(k)) apply(M.s, M.tx + (k === 'ArrowLeft' ? st : k === 'ArrowRight' ? -st : 0), M.ty + (k === 'ArrowUp' ? st : k === 'ArrowDown' ? -st : 0)); else return; e.preventDefault(); });
  }
  function zoomAt(c, f) { var s = Math.max(minS() * 0.9, Math.min(maxS(), M.s * f)), mx = (c[0] - M.tx) / M.s, my = (c[1] - M.ty) / M.s; animTo([s, c[0] - mx * s, c[1] - my * s], 260); }
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
    if (a === 'full') { M.amen = ''; amenDraw(); M.xp = ''; M.was = ''; titleDraw(); if (top().r === 'hood') { go('hoods'); return; } M.title = true; M.el.classList.remove('pkpl-notitle'); home(); return; }   /* Full map: the whole start view with the title back */
    if (a === 'find') { findOpen(); return; }
    if (a === 'amclear') { M.amen = ''; amenDraw(); lit(); return; }
  }

  /* ---------- amenities (from Find) ---------- */
  function amenDraw() {   /* Find picked an amenity: its icons ride above the dimming, its neighborhoods light up */
    var tag = $('.pkpl-amtag', M.el), L = M.amen ? amOf(M.amen) : [];
    $('.pkpl-icon', M.svg).innerHTML = L.map(amUse).join('');
    M.el.classList.toggle('pkpl-amon', !!M.amen);
    tag.hidden = !M.amen; if (M.amen) $('span', tag).textContent = M.amen === 'stage' ? 'Stages · ' + Object.keys(amenHoods()).length + ' on the farm' : (AMN[M.amen] || M.amen) + ' · ' + L.length + ' on the farm';
  }
  function stageCount() { var o = {}; ids().forEach(function (k) { if (data().hoods[k].k === 'stage') o[k] = 1; }); return o; }
  function amenHoods() { var o = {}; if (M.amen === 'stage') { ids().forEach(function (k) { if (data().hoods[k].k === 'stage') o[k] = 0; }); return o; } amOf(M.amen).forEach(function (z) { if (z[3]) o[z[3]] = (o[z[3]] || 0) + 1; }); return o; }
  function amenPlace() { $$('.pkpl-amdot', M.el).forEach(function (d) { var x = M.tx + (+d.getAttribute('data-x')) / 100 * W * M.s, y = M.ty + (+d.getAttribute('data-y')) / 100 * H * M.s; d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }); }
  var placePins0 = placePins; placePins = function () { placePins0(); amenPlace(); if (M && (M.xp || M.amen)) xlPlace(); };

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
  var FT = 'farm';   /* Find's tab: On the farm or Neighborhoods; typing searches both */
  function findOpen() {
    var f = $('.pkpl-find', M.el);
    if (!f) { f = document.createElement('div'); f.className = 'pkpl-find'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Find');
      f.innerHTML = '<div class="pkpl-fbar"><input type="text" inputmode="search" placeholder="A place, an act, water…" aria-label="Find a place, an act or an amenity" autocomplete="off" enterkeyhint="search"><button type="button" data-pl="fclose" aria-label="Close Find">×</button></div><div class="pkpl-ftabs" role="tablist"><button type="button" role="tab" data-pl="ftab" data-t="farm" aria-selected="true">On the farm</button><button type="button" role="tab" data-pl="ftab" data-t="hoods" aria-selected="false">Neighborhoods</button></div><div class="pkpl-fres"></div>';
      M.el.appendChild(f);
      var inp = $('input', f); inp.addEventListener('input', function () { findDraw(inp.value); });
      f.addEventListener('click', function (e) { e.stopPropagation(); var b = e.target.closest('button'); if (!b) return; var a = b.getAttribute('data-pl');
        if (a === 'fclose') { f.hidden = true; return; }
        if (a === 'ftab') { FT = b.getAttribute('data-t'); $$('[data-pl="ftab"]', f).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); }); findDraw($('input', f).value); return; }
        var t = b.getAttribute('data-ft'), v = b.getAttribute('data-fv'); f.hidden = true;
        if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); }
        if (t === 'h') open(v); else if (t === 'a') { var o = actIndex().filter(function (x) { return x.n === v; })[0]; if (o) { FROM = o; open(o.h); } } else if (t === 'm') { M.amen = v; M.xp = ''; M.cur = ''; titleDraw(); M.title = false; M.el.classList.add('pkpl-notitle'); if (top().r === 'hood') go('hoods'); amenDraw(); lit(); var HL = Object.keys(amenHoods()); if (HL.length) { animTo(fitBox(union(HL), clear(), wide() ? 40 : 16), 560); } var L = HL.length ? [] : amOf(v); if (L.length) {   /* frame the lit neighborhoods, the same way an experience does */
 var bx = [1e9, 1e9, -1e9, -1e9]; L.forEach(function (p) { var x = p[1], y = p[2]; bx = [Math.min(bx[0], x), Math.min(bx[1], y), Math.max(bx[2], x), Math.max(bx[3], y)]; }); animTo(fitBox([bx[0] - 60, bx[1] - 60, bx[2] + 60, bx[3] + 60], clear(), 30), 520); } } });
      f.addEventListener('keydown', function (e) { if (e.key === 'Escape') { f.hidden = true; } });
    }
    f.hidden = false; var i = $('input', f); i.value = ''; findDraw(''); setTimeout(function () { try { i.focus({ preventScroll: true }); } catch (x) {} }, 30);
  }
  function findDraw(q) {
    var f = $('.pkpl-find', M.el), out = $('.pkpl-fres', f), D = data(), Q = fold(q).trim();
    var hs = ids().filter(function (k) { return !Q || fold(D.hoods[k].n).indexOf(Q) >= 0 || fold(D.hoods[k].t).indexOf(Q) >= 0; });
    var am = Object.keys(AMN).filter(function (k) { return (k === 'stage' || amOf(k).length) && (!Q || fold(AMN[k]).indexOf(Q) >= 0 || fold(k).indexOf(Q) >= 0); });
    var ac = Q.length >= 2 ? actIndex().filter(function (a) { return a.f.indexOf(Q) >= 0; }).sort(function (a, b) { return (a.f.indexOf(Q) - b.f.indexOf(Q)) || (b.y - a.y) || (a.n < b.n ? -1 : 1); }).slice(0, 8) : [];
    var showF = !!Q || FT === 'farm', showH = !!Q || FT === 'hoods'; if (!showF) am = []; if (!showH) hs = [];
    var tb = $('.pkpl-ftabs', f); if (tb) tb.hidden = !!Q;   /* typing searches both lists, so the tabs step aside */
    var g = function (h, L, c) { return L.length ? (Q ? '<p class="pkpl-fg">' + h + '</p>' : '') + (c ? '<div class="pkpl-f2">' + L.join('') + '</div>' : L.join('')) : ''; };   /* c: two columns, so the lists fit on one phone screen */
    out.innerHTML =
      g('On the farm', am.map(function (k) { return '<button type="button" data-ft="m" data-fv="' + k + '"><i class="pkpl-fi">' + amGlyph(k) + '</i><span><b>' + AMN[k] + '</b><small>' + (k === 'stage' ? Object.keys(stageCount()).length : amOf(k).length) + ' on the farm</small></span></button>'; }), 1) +
      g('Neighborhoods', hs.slice(0, Q ? 6 : 20).map(function (k) { var h = D.hoods[k]; return '<button type="button" data-ft="h" data-fv="' + k + '"><img src="' + esc(emb(k)) + '" alt=""><span><b>' + esc(h.n) + '</b></span></button>'; }), 1) +
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
  var TOP = { k: '', xp: '', day: '', all: false, i: 0, timer: 0 };
  function drawTop() {
    var el = document.getElementById('pkpl-top'); if (!el) return;
    var t = top(), k = t.h, D = data(); if (!k || !D.hoods[k]) { el.innerHTML = ''; return; }
    var h = D.hoods[k], season = site().season || 'off', S = (season === 'sched' || season === 'fest') ? sched(k) : {}, XA = XH ? xpAt(k) : [];
    if (TOP.k !== k) TOP.xp = (M && M.xp && XA.indexOf(M.xp) >= 0) ? M.xp : (XA.indexOf('Architecture') >= 0 ? 'Architecture' : (XA[0] || ''));   /* a lit place opens as the picked experience; a dimmed one opens as Architecture */
    var XE = XH ? TOP.xp : '';
    if (XE) { if (XE === 'Architecture') S = {}; else Object.keys(S).forEach(function (d) { var r = S[d].filter(function (z) { return z.l === XE.toLowerCase(); }); if (r.length) S[d] = r; else delete S[d]; }); }
    var days = Object.keys(S).sort(), has = days.length > 0;
    if (TOP.k !== k) { TOP.k = k; TOP.all = false; TOP.i = 0; TOP.day = days[0] || ''; if (FROM && FROM.h !== k) FROM = null; }
    if (days.indexOf(TOP.day) < 0) TOP.day = days[0] || '';
    var ph = XE ? xpPhotos(XE, k) : photos(k); if (!ph.length) ph = photos(k); var L = (XE && XE !== 'Architecture' && xpPlaces(XE).length > 1) ? xpPlaces(XE) : ids(), j = L.indexOf(k), prev = L[(j - 1 + L.length) % L.length], next = L[(j + 1) % L.length];
    var key = k + '|' + XE + '|' + (M && M.xp) + '|' + has + '|' + TOP.day + '|' + TOP.all + '|' + (FROM ? FROM.n : '') + '|' + wide();
    if (el._key === key) return; el._key = key;
    var dayN = {}; (D.days || []).forEach(function (d) { dayN[d.id] = d.n; });
    var rows = has ? S[TOP.day] : [], showN = TOP.all ? rows.length : 3;
    var html = (XH && M && M.xp && wide() ? '<button type="button" class="pkpl-up" data-pk="up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>' + esc(M.xp) + ' at Pickathon</button>' : '') + '<div class="pkpl-sheet' + (has ? ' pkpl-has' : '') + '">' +
      '<div class="pkpl-grab" aria-hidden="true"><i></i></div>' +
      '<div class="pkpl-hero" aria-roledescription="carousel" aria-label="' + esc(h.n) + ' photos">' +
      ph.map(function (p, i) { return '<img src="' + esc(p.i) + '" alt="" style="object-position:' + esc(p.p) + '"' + (i === 0 ? ' class="on"' : ' loading="lazy"') + ' draggable="false">'; }).join('') +
      '<div class="pkpl-shade" aria-hidden="true"></div>' +
      '<button type="button" class="pkpl-arr l" data-pk="step" data-to="' + prev + '" aria-label="Previous ' + esc(XE && XE !== 'Architecture' ? XE + ' place' : 'place') + ': ' + esc(D.hoods[prev].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>' +
      '<button type="button" class="pkpl-arr r" data-pk="step" data-to="' + next + '" aria-label="Next ' + esc(XE && XE !== 'Architecture' ? XE + ' place' : 'place') + ': ' + esc(D.hoods[next].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      (ph.length > 1 ? '<div class="pkpl-dots" role="group" aria-label="Photos">' + ph.map(function (p, i) { return '<button type="button" data-pk="dot" data-i="' + i + '" aria-label="Photo ' + (i + 1) + ' of ' + ph.length + '"' + (i === 0 ? ' aria-current="true"' : '') + '><i></i></button>'; }).join('') + '</div>' : '') +
      '<div class="pkpl-hi"><p class="pkpl-kind">' + esc(KIND[h.k] || '') + '</p><div class="pkpl-nmrow"><img src="' + esc(emb(k)) + '" alt=""><h1>' + esc(XE && XE !== 'Architecture' ? XE + ' at ' + h.n : h.n) + '</h1></div><p class="pkpl-tt">' + esc(XE ? xpLine(XE, k) : (h.t || '')) + '</p></div>' +
      '</div>' +
      (FROM ? '<p class="pkpl-from">' + esc(FROM.n) + ' played ' + esc(h.n) + ' at Pickathon ' + FROM.y + '</p>' : '') +
      vids(k, XE) +
      (has ? '' : '<p class="pkpl-hook">' + esc(h.hook || '') + '</p>') +
      (has ? '<section class="pkpl-sc" aria-label="Schedule at ' + esc(h.n) + '"><div class="pkpl-days" role="group" aria-label="Day">' + days.map(function (d) { return '<button type="button" class="pk-cta sec pkpl-chip" data-pk="day" data-d="' + d + '"' + (d === TOP.day ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(dayN[d] || d.slice(5)) + '</button>'; }).join('') + '</div>' +
        '<ol class="pkpl-sets">' + rows.slice(0, showN).map(function (s) { var A = (D.artists || {})[s.a] || {}; return '<li><span class="pkpl-st">' + tm(s.s) + '</span><span class="pkpl-sa"><b>' + esc(A.n || s.a) + '</b><small>' + esc(LBL[s.l] || '') + '</small></span></li>'; }).join('') + '</ol>' +
        (rows.length > 3 ? '<button type="button" class="pk-cta sec pkpl-whole" data-pk="whole" aria-expanded="' + TOP.all + '">' + (TOP.all ? 'Show less' : 'Whole day at ' + esc(h.n)) + '</button>' : '') + '</section>' : '') +
      soon(k, XE, h) +
      alsoAt(k, XE, h) +
      '</div>';
    el.innerHTML = html; TOP.i = 0; heroArm(el); document.body.classList.toggle('pkpl-xpup', !!$('.pkpl-up', el));   /* our link up replaces the app's Back to map */
  }
  var VN = { woods: ['Woods', 'Woods Stage'], cherryhill: ['Cherry Hill'], grove: ['Grove'], windmill: ['Windmill'], paddock: ['Paddock'], galaxy: ['Galaxy Barn'], lucky: ['Lucky Barn'], curation: ['Curation'], farmhouse: ['Farmhouse'] };
  function vidList(k, e) {   /* the video catalog by place and experience: songs, not full sets; best first (k), then newest */
    var V = data().videos || [], f;
    if (e === 'Comedy' && k === 'lucky') f = function (v) { return v.vn === 'Laugh'; };
    else if (e === 'Literary' && k === 'woods') f = function (v) { return v.vn === 'Spoken'; };
    else if ((e === 'Food' || e === 'Music') && k === 'curation') f = function (v) { return v.cur; };
    else if (e === 'Music' && VN[k]) f = function (v) { return VN[k].indexOf(v.vn) >= 0 && !v.nonact && !v.cur && !v.f && !/full set/i.test(v.s || ''); };
    if (!f) return [];
    var seen = {}; return V.filter(f).sort(function (a, b) { return ((b.k || 0) - (a.k || 0)) || (b.y - a.y); }).filter(function (v) { if (seen[v.a]) return false; seen[v.a] = 1; return true; }).slice(0, 8);
  }
  function vids(k, XE) {   /* a square, thumb-swipe row of performances right under the hero (Zale, Nov 19) */
    var L = XE ? vidList(k, XE) : []; if (!L.length) return '';
    return '<section class="pkpl-vids" aria-label="Watch"><div class="pkpl-vr">' + L.map(function (v) {
      var u = v.vm ? 'https://vimeo.com/' + v.vm + (v.vh ? '/' + v.vh : '') : 'https://www.youtube.com/watch?v=' + v.id, th = v.th || ('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg');
      return '<button type="button" class="pkpl-vt" data-pk="vid" data-u="' + esc(u) + '" data-c="' + esc(v.a + ' · Pickathon ' + v.y) + '"><img src="' + esc(th) + '" alt="" loading="lazy"><span class="pkpl-pr0" aria-hidden="true"><i></i></span><span class="pkpl-vc"><b>' + esc(v.a) + '</b><small>Pickathon ' + v.y + '</small></span></button>';
    }).join('') + '</div></section>';
  }
  function soon(k, XE, h) {   /* the 2027 schedule, summarized until it posts (Zale, Nov 19: more useful than every past year) */
    var HP = (data().hoodProg || {})[k], kinds = HP ? (HP.kinds || []).map(function (g) { return g[0]; }).filter(function (n) { return !/^(more|showcases)/i.test(n); }) : [];
    var lc = function (x) { return x.charAt(0).toLowerCase() + x.slice(1); }, what;
    var musicy = /legends|discoveries/i.test(kinds.join(' '));
    if (XE === 'Music') what = 'music from legends, discoveries and deep cuts';
    else if (XE && XE !== 'Architecture' && (musicy || !kinds.length)) what = ({ DJs: 'DJ sets', Comedy: 'comedy', Literary: 'readings and storytelling', Food: 'food and drink', Drinks: 'drinks' })[XE] || lc(XE);
    else if (musicy) what = 'music from legends, discoveries and deep cuts';
    else what = kinds.slice(0, 4).map(lc).join(', ').replace(/, ([^,]*)$/, ' and $1') || (XE ? lc(XE) : 'programming');
    var am = (MI || []).filter(function (z) { return z[3] === k; }).map(function (z) { return z[0]; }).filter(function (x, i, a) { return a.indexOf(x) === i && x !== 'tent' && x !== 'gear'; });
    return '<section class="pkpl-soon" aria-label="Coming in 2027"><p class="pkpl-sk">Coming in 2027</p><h2>What to expect</h2><p>Four days of ' + esc(what) + ' at ' + esc(h.n) + ', Thursday to Sunday, August 5 to 8. The full schedule posts with the 2027 lineup.</p>' +
      (am.length ? '<div class="pkpl-sam">' + am.map(function (x) { return '<span><i class="pkpl-fi">' + amGlyph(x) + '</i>' + esc(AMN[x] || x) + '</span>'; }).join('') + '</div>' : '') + '</section>';
  }
  function alsoAt(k, XE, h) {   /* one tile per other experience at this place */
    if (!XE) return ''; var O = xpAt(k).filter(function (e) { return e !== XE; }); if (!O.length) return '';
    return '<section class="pkpl-also" aria-label="Also at ' + esc(h.n) + '"><h2>Also at ' + esc(h.n) + '</h2><div class="pkpl-at">' + O.map(function (e) {
      var ph = xpPhotos(e, k)[0]; return '<button type="button" class="pkpl-ax" data-pk="xp" data-e="' + esc(e) + '">' + (ph ? '<img src="' + esc(ph.i) + '" alt="" loading="lazy" style="object-position:' + esc(ph.p) + '">' : '') + '<span class="pkpl-axs"></span><span class="pkpl-axn">' + xpIcon(e) + '<b>' + esc(e) + '</b></span></button>'; }).join('') + '</div></section>';
  }
  function heroArm(el) {
    clearTimeout(TOP.timer); var hero = $('.pkpl-hero', el); if (!hero) return;
    var imgs = $$('img:not(.pkpl-nmrow img)', hero).filter(function (x) { return x.parentNode === hero; }); if (imgs.length > 1) heroReady(imgs[1]); if (imgs.length < 2 || calm()) return;
    (function step() { TOP.timer = setTimeout(function () { if (!hero.isConnected) return; if (document.hidden) { step(); return; } heroShow(hero, (TOP.i + 1) % imgs.length); step(); }, HERO_MS); })();   /* the photo rotation itself, not layout */
  }
  function heroReady(im) {   /* the next photo is loaded and decoded before it fades in, so a fade never shows a blank */
    try { im.loading = 'eager'; } catch (x) {}
    var ld = (im.complete && im.naturalWidth) ? Promise.resolve(true) : new Promise(function (r) { var t = setTimeout(function () { r(false); }, 8000); im.addEventListener('load', function () { clearTimeout(t); r(true); }, { once: true }); im.addEventListener('error', function () { clearTimeout(t); r(false); }, { once: true }); });
    return ld.then(function (ok) { return ok && im.decode ? im.decode().then(function () { return true; }, function () { return true; }) : ok; });
  }
  function heroShow(hero, i) {   /* Zale, Nov 19: a true crossfade. The new photo fades in on top; the one under it stays fully visible until the fade ends, then drops out unseen. No dark dip between photos */
    var imgs = $$('img', hero).filter(function (x) { return x.parentNode === hero; }); var nx = imgs[i]; if (!nx) return;
    var tok = (hero._tok = (hero._tok || 0) + 1); TOP.i = i;
    $$('.pkpl-dots button', hero).forEach(function (b, j) { if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    heroReady(nx).then(function (ok) {
      if (tok !== hero._tok || !hero.isConnected) return;
      if (!ok) return;
      imgs.forEach(function (x) { x.classList.remove('top'); });
      nx.classList.add('top'); requestAnimationFrame(function () { nx.classList.add('on'); });
      clearTimeout(hero._xt); hero._xt = setTimeout(function () { if (tok !== hero._tok) return; imgs.forEach(function (x) { if (x !== nx && x.classList.contains('on')) { x.classList.add('cut'); x.classList.remove('on'); void x.offsetWidth; x.classList.remove('cut'); } }); var nn = imgs[(i + 1) % imgs.length]; if (nn) heroReady(nn); }, HERO_FADE + 60);
    });
  }
  /* phone and portrait tablet: the sheet. Its scroll is the phone scroller: the space above it is see-through, so dragging the sheet down shows the map and dragging it up opens the page */
  function scroller() { return document.getElementById('pk-scroll-phone'); }
  function sheetVars() {   /* the map's height: the phone scroller, or the window under the sticky desktop header */
    var sc = scroller(), vh, hd = 0;
    if (sc) vh = sc.clientHeight; else { var h = document.querySelector('#root header'); hd = h && getComputedStyle(h).position === 'sticky' ? h.offsetHeight : 0; vh = window.innerHeight - ((top().r === 'hoods' || top().r === 'hood') && h ? Math.max(hd, Math.round(h.getBoundingClientRect().bottom)) : hd); }
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
    if (M._tw !== wide()) { M._tw = wide(); titleDraw(); }   /* first paint and phone/desktop switch: the title's words and buttons */
    drawTop();
    if (t.r === 'hood' && t.h && t.h !== M.cur && HH.shapes[t.h]) { if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); } frame(t.h, !M.s); }   /* arriving at a place shows it, never the title screen */
    if (t.r === 'hoods' && M.cur) { M.was = M.cur; M.cur = ''; lit(); if (M.xp || M.amen) fitLit(); }   /* closing a card: back to the experience's places, lit */
    settleSheet(); dedupe(); backMap();
    var full = $('[data-pl="full"]', M.el); if (full) full.hidden = !M.cur && !M.amen && !(M.s > startView()[0] * 1.15);
  }
  function backMap() {   /* end of a neighborhood page: the map again; tap it to go back to how you came in (Zale, Nov 19) */
    var old = document.getElementById('pkpl-back'), t = top(), k = t.h;
    if (t.r !== 'hood' || !k || !HH.shapes[k]) { if (old) old.remove(); return; }
    var w = document.querySelector('#root section.pk-hd-w'); if (!w) return;
    var anchor = w.nextElementSibling && /partners/i.test(w.nextElementSibling.textContent || '') ? w.nextElementSibling : w;
    var xe = (TOP.xp && TOP.xp !== 'Architecture') ? TOP.xp : (M && M.xp) || '', key = k + '|' + xe;
    if (old && old._key === key && old.previousElementSibling === anchor) return; if (old) old.remove();
    var b = box(k), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, bw = Math.max(b[2] - b[0], b[3] - b[1]) * 2.6, bh = bw * 0.55;
    var vb = (cx - bw / 2) + ' ' + (cy - bh / 2) + ' ' + bw + ' ' + bh;
    var d = document.createElement('section'); d.id = 'pkpl-back'; d._key = key; d.className = 'pkpl-back';
    d.innerHTML = '<button type="button" aria-label="Back to the map' + (xe ? ': ' + esc(xe) + ' at Pickathon' : '') + '"><svg viewBox="' + vb + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="farmmap/map2.webp?v=3" x="0" y="0" width="' + W + '" height="' + H + '"/><path d="' + HH.shapes[k] + '" fill="rgba(255,236,170,.12)" stroke="#FFE7A3" stroke-width="' + (bw / 160) + '" stroke-linejoin="round"/></svg>' +
      '<span class="pkpl-bk"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>' + (xe ? 'Back to ' + esc(xe) + ' at Pickathon' : 'Back to the map') + '</span></button>';
    d.querySelector('button').addEventListener('click', function () { if (M && xe) M.xp = xe; go('hoods'); });
    anchor.parentNode.insertBefore(d, anchor.nextSibling);
  }
  function dedupe() { var d = document.querySelector('.pk-hd-desc0'), h = data().hoods[top().h || ''] || {}; if (d) d.classList.toggle('pkpl-dup', !!h.hook && fold(d.textContent).trim() === fold(h.hook).trim()); }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-pk]') : null; if (!b || !b.closest('#pkpl-top')) return;
    var a = b.getAttribute('data-pk');
    if (a === 'step') { FROM = null; if (TOP.xp && TOP.xp !== 'Architecture' && M) M.xp = TOP.xp; go('hood', { h: b.getAttribute('data-to') }); return; }   /* the arrows keep the experience: next Wellness place, and so on */
    if (a === 'dot') { var hero = b.closest('.pkpl-hero'); clearTimeout(TOP.timer); heroShow(hero, +b.getAttribute('data-i')); return; }
    if (a === 'day') { TOP.day = b.getAttribute('data-d'); TOP.all = false; drawTop(); return; }
    if (a === 'whole') { TOP.all = !TOP.all; drawTop(); return; }
    if (a === 'up') { go('hoods'); return; }
    if (a === 'vid') { if (window.__pkPlayVid) window.__pkPlayVid(b.getAttribute('data-u'), b.getAttribute('data-c')); return; }
    if (a === 'xp') { TOP.xp = b.getAttribute('data-e'); TOP.all = false; var sc = scroller(); drawTop(); xbDraw(); return; }
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
