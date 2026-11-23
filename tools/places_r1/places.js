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
  var XW = /*@XP_WORDS*/null, XWdone = false, BYW = /*@BY_WORDS*/null;   /* BYW: Copy's build stories (hoods.<id>.by.<year>.d on copy-review-nov22) until Site Build merges */   /* Copy Review's words (Nov 22 draft 1, tools/places_r1/xp_words.json); data.json xpWords wins once Site Build merges it */
  function words() {
    if (XWdone || !XH) return; var d = data(); if (!d || !d.hoods) return; XWdone = true;
    var W = d.xpWords || XW; if (!W) return; M0W = W.map || {};
    Object.keys(W.XPD || {}).forEach(function (e) { XH.XPD[e] = W.XPD[e]; });
    Object.keys(W.XPB || {}).forEach(function (e) { XH.XPB[e] = XH.XPB[e] || {}; Object.keys(W.XPB[e]).forEach(function (k) { XH.XPB[e][k] = W.XPB[e][k]; }); });
    HKW = W.hook || {}; DSW = W.desc || {}; WCN = W.cn || {};   /* read through hookOf/ddOf, so the shared data (and Home) are never changed */
  }
  var M0W = {}, HKW = {}, DSW = {}, WCN = {}, HKEY = null;
  function kick(y) { return (M0W.buildKicker || 'The {year} build').replace('{year}', y); }   /* Copy, Nov 22 (copy_review-40 g) */
  function phoneFirst() { var t = M0W.phoneFirst || 'Pick one below to light up the map, or see all 20 neighborhoods.', a = 'see all ' + ids().length + ' neighborhoods', m = /see all \d+ neighborhoods/.exec(t);
    t = esc(t); return m ? t.replace(esc(m[0]), '<button type="button" class="pkpl-psall">' + esc(a) + '</button>') : t; }
  function hkey(h) { if (!HKEY) { HKEY = new Map(); var d = data(); Object.keys(d.hoods).forEach(function (k) { HKEY.set(d.hoods[k], k); }); } return HKEY.get(h); }
  function hookOf(h) { var k = h && hkey(h); return (k && HKW[k]) || (h && h.hook) || ''; }
  function ddOf(h) { var k = h && hkey(h); return (k && DSW[k]) || (h && h.dd) || ''; }
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
  var V2Q = !/[?&]v1\b/.test(location.search), V2 = !/[?&]v1\b/.test(location.search), V2G = (location.search.match(/[?&]g=(\w+)/) || [])[1] || 'strong';   /* Zale Nov 22 00:39 'build it': the left-column layout is live on desktop; phone and tablet too since Nov 22 00:50; ?v1 shows the old layout */   /* MOCK Nov 21: left-column layout, gradient strength */
  var V2L = (location.search.match(/[?&]L=(\w+)/) || [])[1] || 'tiles';   /* MOCK: long-list style, tiles or cols */
  /* MOCK Nov 21 (Zale): a rough 2027 palette painted over today's map to judge it; provisional kit colors (near-black #2E292A, mauve #85506A, gold #BF9D27, pink #E5B6CC), official swatches pending from Artwork */
  var PAL27 = !/[?&]pal=26/.test(location.search);   /* 2027 map look on every size (Zale Nov 22 'all form factors'); ?pal=26 shows the old colors */   /* 2027 map look on desktop (Zale Nov 22); phones keep the 2026 look until their check */
  /* Artwork's 2027 map fills (artwork-47, from Travis's binder inks): light tier and deep tier, alternating between neighbors */
  var P27 = { woods: '#D1A47D', cherryhill: '#D79D98', grove: '#8A7632', windmill: '#D79D98', paddock: '#D1A47D', galaxy: '#976D48', lucky: '#C2AD6A', farmhouse: '#D79D98', curation: '#9D6762',
    refuge: '#D19CB4', coyote: '#97667D', courtyard: '#D19CB4', market: '#97667D', orchard: '#97667D', quailtrail: '#B5ABAE',
    welcomelot: '#B5ABAE', willowcamp: '#7E7577' };
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
    if ((x1 - x0) * (y1 - y0) > 0.12 * W * H) { var q = pt(k), R = 340; x0 = q[0] - R; x1 = q[0] + R; y0 = q[1] - R; y1 = q[1] + R; }   /* Nov 20: the big camp zones (Wild Camp, Lush Camp) are most of the farm; frame them around their own emblem, not the whole zone, so a pick lands on the place */
    return (BOX[k] = [x0, y0, x1, y1]);
  }
  function union(L) { var b = [1e9, 1e9, -1e9, -1e9]; L.forEach(function (k) { var x = box(k); b = [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.max(b[2], x[2]), Math.max(b[3], x[3])]; }); return b; }
  function emb(k) { if (PAL27) return 'i/y27em/' + k + '.png';   /* 2027 look: Artwork's one-ink stamps (artwork-48) everywhere the map shows an emblem */
    var h = data().hoods[k] || {}; return h.icw || ('ic2/' + k + '.png'); }   /* the white emblems Home uses */
  function stageHood() { var D = data(), m = {}; (D.stages || []).forEach(function (s) { m[s.id] = s.h; }); return m; }


  /* ---------- experiences (Zale, Nov 19: it is all about the experience; Home's list, order, icons and words) ---------- */
  var XO = XH ? Object.keys(XH.XPD) : [];
  (function () { var lead = ['Music', 'Architecture'].filter(function (k) { return XO.indexOf(k) >= 0; }); XO = lead.concat(XO.filter(function (k) { return lead.indexOf(k) < 0; })); })();   /* Zale, Nov 22: Music first, then Architecture (independent review: first-timers reach for Music) */
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
  function thumbOf(e, k) { var z = e && xpPhotos(e, k)[0]; return z ? 'i/th/' + z.i.split('?')[0].split('/').pop().replace(/\.\w+$/, '') + '.webp' : ''; }   /* Zale, Nov 22: menu first; small square photos made by tools/places_r1/thumbs.py */
  function pic(e, k) { var t = thumbOf(e, k); return t ? '<span class="pkpl-tw"><img class="pkpl-tp" src="' + esc(t) + '" alt="" loading="lazy" decoding="async"><img class="pkpl-te" src="' + esc(emb(k)) + '" alt=""></span>' : '<img src="' + esc(emb(k)) + '" alt="">'; }
  function xpLine(e, k) { var b = ((XH.XPB || {})[e] || {})[k]; return b || (e === 'Architecture' ? (hookOf(data().hoods[k]) || (data().hoods[k] || {}).t || '') : XH.XPD[e] || ''); }
  function xpIcon(e) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (XH.XPI[e] || '') + '</svg>'; }
  function litSet() { return M && M.xp ? xpPlaces(M.xp) : []; }
  function curGroup() { if (!M || !M.cur || !M.xp) return null; var g = litSet(); return g.length > 1 && g.indexOf(M.cur) >= 0 ? g : null; }

  /* ---------- the map ---------- */
  var M = null;   /* one map for the whole visit */
  function makeMap() {
    var el = document.createElement('div'); el.className = 'pkpl-map'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Farm map');
    var shapes = ids().map(function (k) { return '<path class="pkpl-sh" data-h="' + k + '" d="' + HH.shapes[k] + '"/>'; }).join('');
    el.innerHTML =
      '<div class="pkpl-world"><img class="pkpl-base" src="farmmap/' + (PAL27 ? 'map4' : 'map2') + '.webp?v=3" alt="" draggable="false" decoding="async" fetchpriority="high"><div class="pkpl-tiles"></div>' +
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
  function minS() { if (V2 && wide()) { var cy = farmY(); return M.vh / (cy[1] - cy[0]) / 0.9; }   /* the callers allow 0.9 of this, so the farm's own height (not the art's empty bottom) fits the screen exactly */ if (v2p()) return M.vw / 1700 / 0.9;   /* phone: the whole farm fits the strip above the sheet */ return Math.min(M.vw / W, M.vh / H); }   /* MOCK: desktop zooms out no further than the farm's height */
  function maxS() { return 1.5 * TF / (window.devicePixelRatio || 1); }   /* Site Build Nov 22 (Zale: zoomed trail names not sharp): was 2.6x past the sharpest tiles; 1.5x keeps lettering crisp */
  function farmY() { return [0, union(ids())[3] + 40]; }   /* MOCK: the farm from the forest's top edge to just below the camps */
  function clampView(s, tx, ty) {   /* keep some map on screen */
    s = Math.max(minS() * 0.9, Math.min(maxS(), s));
    if (V2 && (wide() || v2p() || top().r === 'hood')) {   /* MOCK (Zale, Nov 21): top and bottom lock to the screen; zoomed in, a little margin; zoomed all the way out, none */
      var cy = farmY(), t0 = cy[0] * s, b0 = cy[1] * s, m = Math.min(28, Math.max(0, (s / (minS() * 0.9) - 1) * 120));
      var vb = v2p() ? clear() : (!wide() && top().r === 'hood') ? region() : { y: 0, h: M.vh };   /* phone: the farm may slide until its bottom reaches the top of the sheet */
      ty = b0 - t0 >= vb.h ? Math.min(m - t0, Math.max(vb.y + vb.h - b0 - m, ty)) : vb.y + (vb.h - t0 - b0) / 2;
      var l0 = 280 * s, r0 = 1980 * s, lc = !wide() ? 0 : top().r !== 'hood' ? lw() : 0;   /* left and right lock too: the farm (map units 280-1980) reaches under the column and to the right edge, no dark gap either side (Zale, Nov 21) */
      if (r0 - l0 >= M.vw) tx = Math.min(-l0, Math.max(M.vw - r0, tx));
      else if (r0 - l0 >= M.vw - lc) tx = Math.min(lc - l0, Math.max(M.vw - r0, tx));   /* Nov 21: narrower than the screen but wider than the space beside the column: it may slide anywhere from the column's edge to the right edge, so a place at the side (the Refuge) stays in view */
      else tx = lc + (M.vw - lc - (r0 - l0)) / 2 - l0;
    }
    if (M.free || (V2 && (v2p() || (!wide() && top().r === 'hood')))) return [s, tx, ty];   /* Zale, Nov 22: on phone the farm lock above is the only limit, so places behind the sheet can be dragged up into view */   /* a place was framed: its centre may sit past the map's edge (Zale, Nov 20) */
    var mw = W * s, mh = H * s, pad = 60, lx, hx, ly, hy;
    if (mw <= M.vw) { lx = -mw * 0.25; hx = M.vw - mw * 0.75; } else { lx = M.vw - mw - pad; hx = pad; }
    if (mh <= M.vh) { ly = -mh * 0.25; hy = M.vh - mh * 0.75; } else { ly = M.vh - mh - pad; hy = pad; }
    if (M.s && Math.abs(s - M.s) < 1e-6 && M.tx != null) { lx = Math.min(lx, M.tx); hx = Math.max(hx, M.tx); ly = Math.min(ly, M.ty); hy = Math.max(hy, M.ty); }   /* Nov 21 (Zale: the map "glitched back" on the Woods): a framed place can sit past the edge; a pan from there never snaps back, it only stops going further out */
    tx = Math.min(hx, Math.max(lx, tx)); ty = Math.min(hy, Math.max(ly, ty));
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
  function settle() { M.pins.style.transform = ''; M.el.classList.remove('pkpl-pinch'); placePins(); M.laid = [M.s, M.tx, M.ty]; tiles(); edgeTags(); }
  function edgeTags() {   /* review Nov 22 #4, Zale chose edge tags: a lit place outside the view gets a small tag at that edge; tap it to slide there */
    var host = $('.pkpl-edge', M.el); if (!host) { host = document.createElement('div'); host.className = 'pkpl-edge'; M.el.appendChild(host); }
    if (!M.xp || top().r === 'hood' || (v2p() && M.ps === 2)) { host.innerHTML = ''; return; }
    var cr = clear(), D4 = data().hoods, out = [];
    litSet().forEach(function (k) { var b = box(k), mx = (b[0] + b[2]) / 2, my = (b[1] + b[3]) / 2, x = M.tx + mx * M.s, y = M.ty + my * M.s, d = null;
      if (y < cr.y + 10) d = 'up'; else if (y > cr.y + cr.h - 10) d = 'down'; else if (x < cr.x + 10) d = 'left'; else if (x > cr.x + cr.w - 10) d = 'right';
      if (!d || !D4[k]) return; var ar = { up: '\u2191', down: '\u2193', left: '\u2190', right: '\u2192' }[d];
      var px = d === 'left' ? cr.x + 8 : d === 'right' ? cr.x + cr.w - 8 : Math.max(cr.x + 70, Math.min(cr.x + cr.w - (d === 'down' ? 170 : 70), x)), py = d === 'up' ? cr.y + 8 : d === 'down' ? cr.y + cr.h - 52 : Math.max(cr.y + 30, Math.min(cr.y + cr.h - 60, y));
      out.push('<button type="button" class="pkpl-edgetag pkpl-et-' + d + '" data-et="' + k + '" data-mx="' + mx + '" data-my="' + my + '" style="left:' + Math.round(px) + 'px;top:' + Math.round(py) + 'px">' + ar + ' ' + esc(D4[k].n) + '</button>'); });
    var byEdge = {}; out = out.filter(function (h) { var d = /pkpl-et-(\w+)/.exec(h)[1]; byEdge[d] = (byEdge[d] || 0) + 1; return byEdge[d] <= (wide() ? 5 : 2); });
    var extra = Object.keys(byEdge).reduce(function (a, d) { return a + Math.max(0, byEdge[d] - (wide() ? 5 : 2)); }, 0);
    if (extra) out.push('<button type="button" class="pkpl-edgetag pkpl-et-down pkpl-etall" style="left:' + Math.round(cr.x + 60) + 'px;top:' + Math.round(cr.y + cr.h - 52) + 'px">' + esc((M0W.moreTag || '\u2193 {n} more').replace('{n}', extra)) + '</button>');
    host.innerHTML = out.join('');   /* round 3: never a wall of tags */
    ['up', 'down'].forEach(function (d) { var T = $$('.pkpl-et-' + d, host).sort(function (a, b) { return a.offsetLeft - b.offsetLeft; }), edge = -1e9;   /* tags on one edge never overlap (round 2) */
      T.forEach(function (t) { var w = t.offsetWidth, l = Math.max(t.offsetLeft - w / 2, edge + 8); t.style.left = Math.round(l + w / 2) + 'px'; edge = l + w; }); });
  }
  function moving(on) { if (on && M) { var ht = $('.pkpl-hovtag', M.el); if (ht) ht.hidden = true; } M.moving = on; M.el.classList.toggle('pkpl-moving', on); if (!on) { cancelAnimationFrame(M.raf); M.raf = 0; paint(); } }
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
    var a = [M.s, M.tx, M.ty], t0 = -1, dur = ms || 520;
    var dsc = Math.hypot((M.vw / 2 - a[1]) / a[0] - (M.vw / 2 - v[1]) / v[0], (M.vh / 2 - a[2]) / a[0] - (M.vh / 2 - v[2]) / v[0]) * Math.min(a[0], v[0]), far = dsc / Math.max(320, Math.min(M.vw, M.vh));   /* Nov 20: a long move is a short flight: it eases out a little mid-way and takes a bit longer, so you see where you travel */
    var dip = far > 0.45 ? Math.min(0.9, Math.log(1 + (far - 0.45) * 0.8)) : 0; dur += Math.min(500, Math.max(0, far - 0.45) * 220);
    var ease = function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };   /* ease in and out: no lurch at the start */
    (function f(t) { if (t0 < 0) t0 = t; var u = Math.max(0, Math.min(1, (t - t0) / dur)), e = ease(u);   /* Nov 20: a frame's timestamp can be earlier than the start; clamping stops a one-frame fling to full zoom */
      var s = Math.exp(Math.log(a[0]) + (Math.log(v[0]) - Math.log(a[0])) * e - dip * Math.sin(Math.PI * e));
      /* interpolate the map point at the region's centre so the zoom feels anchored */
      var cx0 = (M.vw / 2 - a[1]) / a[0], cy0 = (M.vh / 2 - a[2]) / a[0], cx1 = (M.vw / 2 - v[1]) / v[0], cy1 = (M.vh / 2 - v[2]) / v[0];
      var cx = cx0 + (cx1 - cx0) * e, cy = cy0 + (cy1 - cy0) * e;
      if (!M.moving) moving(true);
      apply(s, M.vw / 2 - cx * s, M.vh / 2 - cy * s);
      if (u < 1) M.anim = requestAnimationFrame(f); else { M.anim = 0; moving(false); } })(performance.now());
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
      im.src = 'farmmap/' + (PAL27 ? 't4/' : 't2/') + k + '.webp?v=3'; M.tiles.appendChild(im);
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
  function chipsAboveFold() {   /* folded on a phone: the experience row sits just above the folded sheet, so it stays usable (Zale, Nov 20) */
    var c = cardEl(), xb = $('.pkpl-xb', M.el); if (!c || !xb) return;
    if (!wide() && !V2 && c.classList.contains('pkpl-folded')) xb.style.bottom = Math.max(0, Math.round(M.el.getBoundingClientRect().bottom - c.getBoundingClientRect().top)) + 'px';
    else xb.style.bottom = '';
  }
  function xbHome() { var xb = $('.pkpl-xb', M.el), t = $('.pkpl-title', M.el), want = M.el; if (xb && t && xb.parentNode !== want) want.appendChild(xb); }   /* desktop: a menu under the title; phone: the bottom row */
  function layout() {   /* on load, resize and every render: size the map to its box */
    if (!M || !M.el.isConnected) return; xbHome();
    var r = M.el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return;
    var rx = Math.round(r.left), ry = Math.round(r.top), dx = M.rx == null ? 0 : rx - M.rx, dy = M.ry == null ? 0 : ry - M.ry; M.rx = rx; M.ry = ry;
    if (w === M.vw && h === M.vh && M.s && !dx && !dy) return;
    var had = !!M.s; M.vw = w; M.vh = h;
    if (!had) { home(true); return; }
    apply(M.s, M.tx - dx, M.ty - dy); if (M.raf) { cancelAnimationFrame(M.raf); paint(); }   /* paint in this frame, before the browser shows the new box */   /* Nov 20: the box moved or resized (a page change): keep the map where it sits on screen, so the next move starts from what you see, no jump */
    if (M.cur) frame(M.cur);   /* then glide to the place's framing for the new box */
  }
  function startView() {   /* desktop and sideways tablet: the festival core fills the width (the full farm is a narrow strip); phone: the whole farm */
    if (v2p()) { var cr0 = clear(), b0 = union(ids().filter(function (q) { return (data().hoods[q].k || 'around') !== 'camp'; })), s0 = M.vw / 1700;   /* round 2: open on the festival, not the campground */ return [s0, -280 * s0, cr0.y + cr0.h / 2 - (b0[1] + b0[3]) / 2 * s0]; }   /* tried starting at the top-most place (Nov 22): the forest camps sit at the top, so it showed more forest; centered stays */   /* Zale, Nov 22 06:35: phone and tablet fill the screen like desktop: the farm's width edge to edge, the core centered in the strip above the sheet */
    if (!wide()) return fitBox([0, 0, W, H], { x: 0, y: 0, w: M.vw, h: M.vh }, 8);
    var b = union(CORE), s = M.vw / 1700;   /* the farm's own width (map units 280-1980) fills the screen */
    return [s, M.vw / 2 - 1130 * s, M.vh / 2 - (b[1] + b[3]) / 2 * s];
  }
  function home(now) { M.cur = ''; lit(); animTo(startView(), now ? 0 : 520); }
  /* the visible part of the map (phone: above the sheet) */
  function lw() { return Math.round(Math.max(400, Math.min(480, window.innerWidth * 0.32))); }   /* desktop left column: phone-card width, the map is the hero (Zale, Nov 19) */
  function sheetOpen() { var sc = scroller(); return openH(sc ? sc.clientHeight : 600); }   /* the card opens to the phone's scroll area less a map margin at the top (Nov 20, Zale) */
  function openH(vh) { var h = Math.round(vh * 0.6) + (V2 && !wide() && vh > 500 ? 50 : 0); return V2 && !wide() && window.innerWidth < 600 ? Math.max(h, Math.min(272, Math.round(vh * 0.66))) : h; }   /* Zale, Nov 22 evening: short phones still open far enough for the whole photo plus a peek (the hero shrinks to fit, places.css) */   /* Zale, Nov 22: about 50px taller on phone and tablet so prev/next shows above the experience row */   /* open: the sheet covers 60%, the map shows above it (the yesterday default, Zale, Nov 20) */
  function v2Fit(v, L, one) {   /* MOCK round 4: no empty margin on the right; the framed places sit against the right side and the map runs under the left column */
    var b = union(L), s1 = v[0], tx = v[1], east = b[2] * s1 + tx, lim = M.vw - (one ? 190 : 84);
    if (east < lim) tx += lim - east;
    return [s1, tx, v[2]];
  }
  function v2p() { return V2 && !wide() && top().r !== 'hood'; }
  function xbH() { var x = M && $('.pkpl-xb', M.el); return x ? x.offsetHeight : 56; }
  function hdH() { var x = M && $('.pkpl-psh2', M.el), q = M && $('.pkpl-psq', M.el); return x && v2p() ? x.offsetHeight + (q ? q.offsetHeight : 0) : 0; }   /* the cap (handle, title) plus the question line */
  function fitList(pl, t, n) {   /* Zale, Nov 22: the list grows to fill the room in the panel: bigger emblems and names, two columns, three only when two won't fit */
    if (!wide() || !n) return; pl.style.removeProperty('--pkpl-rh'); pl.classList.remove('pkpl-c3'); t.classList.remove('pkpl-tv');
    var need = function () { var ab0 = pl.nextElementSibling && pl.nextElementSibling.classList.contains('pkpl-ab') ? pl.nextElementSibling.offsetHeight + 18 : 0; return t.getBoundingClientRect().bottom - pl.getBoundingClientRect().top - 28 - ab0; };
    if (need() < Math.ceil(n / (n > 9 ? 3 : 2)) * (n > 9 ? 36 : 50)) t.classList.add('pkpl-tv');   /* Zale, Nov 22: short laptops (1280x720) tighten the headline and grid so every place fits above the bottom edge */
    var ab = pl.nextElementSibling && pl.nextElementSibling.classList.contains('pkpl-ab') ? pl.nextElementSibling : null;
    var room = t.getBoundingClientRect().bottom - pl.getBoundingClientRect().top - 38 - (ab ? ab.offsetHeight + 18 : 0);
    var rows = Math.ceil(n / 2), rh = Math.floor(room / rows);
    if (rh < 34 && n > 9) { pl.classList.add('pkpl-c3'); rows = Math.ceil(n / 3); rh = Math.floor(room / rows); }
    rh = Math.max(pl.classList.contains('pkpl-c3') && !t.classList.contains('pkpl-tv') ? 40 : 34, Math.min(76, rh)); pl.style.setProperty('--pkpl-rh', rh + 'px');
    var bdf = pl.closest('.pkpl-body'), ovf = bdf ? bdf.scrollHeight - bdf.clientHeight : 0; if (ovf > 0 && ovf < 60) { rh = Math.max(30, rh - Math.ceil(ovf / rows)); pl.style.setProperty('--pkpl-rh', rh + 'px'); }   /* a last few pixels over (a wrapped count line): trim the rows, never scroll */
    t.classList.remove('pkpl-tv2'); if (t.classList.contains('pkpl-tv') && (ab || pl).getBoundingClientRect().bottom > t.getBoundingClientRect().bottom - 6) t.classList.add('pkpl-tv2');   /* still over: the summary goes to one line */
  }
  function psH() { if (!M || !v2p()) return 0; var st = M.ps == null ? 1 : M.ps, top2 = xbH() + hdH(); if (st === 0) return 0; if (st === 2) { var full = Math.max(0, M.vh - top2), ps2 = $('.pkpl-ps', M.el), inner = ps2 && ps2.firstElementChild; if (window.innerWidth >= 600 && ps2) { var need = 0; Array.prototype.forEach.call(ps2.children, function (c) { need = Math.max(need, c.offsetTop + c.offsetHeight); }); if (need > 0) return Math.min(full, need + 24); } return full; }   /* Zale, Nov 22: on tablet a short list stops where it ends, the map shows above */
    var ps = $('.pkpl-ps', M.el), l1 = ps && $('.pkpl-psl', ps); return l1 ? l1.offsetTop + l1.offsetHeight + 14 : 96; }   /* Zale, Nov 22 06:19: half-open shows the title and summary only; pull up for the neighborhoods */
  function psPlace() {   /* size the sheet and slide the experience row and the handle on top of it */
    var ps = $('.pkpl-ps', M.el), xb = $('.pkpl-xb', M.el), pg = $('.pkpl-psg', M.el), h = psH(); if (!ps) return;
    var qq = $('.pkpl-psq', M.el), hd = $('.pkpl-psh2', M.el), qh = qq ? qq.offsetHeight : 0, xh = xbH();
    ps.style.height = h + 'px'; ps.classList.toggle('pkpl-psfull', M.ps === 2); ps.classList.toggle('pkpl-ps0', !h); ps.style.bottom = (xh + qh) + 'px'; if (xb) xb.style.bottom = '0px'; if (qq) qq.style.bottom = xh + 'px'; if (pg) { pg.setAttribute('aria-label', M.ps === 2 ? 'Show the map' : 'Show more'); }
    if (hd) hd.style.bottom = (h + xh + qh) + 'px'; M.el.style.setProperty('--pkpl-psb', (h + xh + hdH() + 10) + 'px');
  }
  function psSet(st) {   /* change the sheet and frame the map in what still shows */
    st = Math.max(0, Math.min(2, st)); if (st === M.ps) return; M.ps = st; psPlace(); var mo = $('.pkpl-psmore', M.el); if (mo) { var nL = M.xp ? litSet().length : 0; mo.textContent = st === 2 ? 'Map' : 'See ' + (nL === 1 ? 'it' : 'them'); }
    if (st < 2) setTimeout(function () { if (!M || top().r === 'hood') return; if (M.xp || M.amen) fitLit(); else home(); }, calm() ? 0 : 60);
  }
  function psTouch() {   /* swipe up on the words, the row or the handle: full; swipe down at the top: half, then folded (same feel as the neighborhood sheet) */
    var t0 = null, inP = function (el) { return el && el.closest && el.closest('.pkpl-ps,.pkpl-psh2,.pkpl-psq,.pkpl-xb'); };
    M.el.addEventListener('touchstart', function (e) { if (!v2p() || e.touches.length !== 1 || !inP(e.target)) { t0 = null; return; } var p = e.touches[0]; t0 = { x: p.clientX, y: p.clientY, el: e.target, done: 0, sc: $('.pkpl-ps', M.el).scrollTop }; }, { passive: true });
    var hAt = function (st) { var o = M.ps; M.ps = st; var h = psH(); M.ps = o; return h; };   /* Zale, Nov 22: the sheet follows the finger and settles at the nearest stop */
    var place = function (h) { var ps = $('.pkpl-ps', M.el), hd = $('.pkpl-psh2', M.el), qq = $('.pkpl-psq', M.el), qh = qq ? qq.offsetHeight : 0, xh = xbH(); if (ps) { ps.style.height = h + 'px'; ps.classList.toggle('pkpl-ps0', h < 2); } if (hd) hd.style.bottom = (h + xh + qh) + 'px'; };
    M.el.addEventListener('touchmove', function (e) { if (!t0 || t0.done) return; var p = e.touches[0], dx = p.clientX - t0.x, dy = p.clientY - t0.y, ps = $('.pkpl-ps', M.el), onRow = t0.el.closest('.pkpl-xb,.pkpl-psh2,.pkpl-psq');
      if (!t0.drag) {
        if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
        var up = dy < 0; if ((up && M.ps < 2) || (!up && (onRow || ps.scrollTop <= 0) && M.ps > 0)) { t0.drag = 1; t0.h0 = hAt(M.ps); t0.max = hAt(2); t0.y = p.clientY; dy = 0; M.el.classList.add('pkpl-psdrag'); } else { t0.done = 1; return; }
      }
      if (e.cancelable) e.preventDefault(); t0.h = Math.max(0, Math.min(t0.max, t0.h0 - dy)); t0.v = dy - (t0.ly || 0); t0.ly = dy; place(t0.h); }, { passive: false });
    M.el.addEventListener('touchend', function () { if (t0 && t0.drag) { M.el.classList.remove('pkpl-psdrag'); var h = t0.h == null ? t0.h0 : t0.h, hs = [hAt(0), hAt(1), hAt(2)], best = 0;
        hs.forEach(function (x, k) { if (Math.abs(x - h) < Math.abs(hs[best] - h)) best = k; });
        if (Math.abs(t0.v || 0) > 6) { var cur = M.ps; best = t0.v < 0 ? Math.max(best, Math.min(2, cur + (h > hs[cur] ? 1 : 0))) : Math.min(best, Math.max(0, cur - (h < hs[cur] ? 1 : 0))); }   /* a quick flick goes one stop that way */
        if (best === M.ps) psPlace(); else psSet(best); }
      t0 = null; }, { passive: true });
    M.el.addEventListener('click', function (e) { if (e.target.closest('.pkpl-psall')) { psSet(2); return; } if (e.target.closest('.pkpl-psh2')) psSet(M.ps === 2 ? 1 : M.ps + 1); });
  }
  function clear() { var r = region(), t = wide() && top().r !== 'hood' ? lw() : 0, ti = $('.pkpl-title', M.el), up = wide() ? 78 : (M.title && ti ? Math.max(0, ti.offsetHeight - 14) : 0), dn = wide() ? 8 : (top().r === 'hood' ? sheetOpen() : 150); if (v2p()) { up = 8; dn = psH() + xbH() + hdH() + 8; } if (V2 && wide()) up = 16; return { x: r.x + t, y: r.y + up, w: r.w - t, h: Math.max(160, r.h - up - dn) }; }   /* the lit places fill what is left */   /* above the experience bar and the amenity tag */
  function region() {
    if (wide() || top().r !== 'hood') return { x: 0, y: 0, w: M.vw, h: M.vh };
    /* the strip the map shows above the sheet: from the map top to the sheet's real top edge (open ~40%, folded almost all) */
    var c = cardEl(), mp = document.querySelector('#pkpl .pkpl-map'), h = Math.round(M.vh * 0.4);
    if (c && mp) h = c.getBoundingClientRect().top - mp.getBoundingClientRect().top;
    return { x: 0, y: 0, w: M.vw, h: Math.max(160, Math.min(M.vh, Math.round(h))) };
  }
  function recenter() {   /* the sheet moved: keep the zoom, slide the selected place back to the middle of the map that shows (Zale, Nov 21) */
    if (!M || !M.cur || !M.s) return; M.free = true; var g = curGroup(), ce = cardEl();
    if (g && ce && ce.classList.contains('pkpl-folded')) { var b9 = box(M.cur), w9 = b9[2] - b9[0], h9 = b9[3] - b9[1], m9 = Math.max(w9, h9) * 0.6; animTo(fitBox([b9[0] - m9, b9[1] - m9, b9[2] + m9, b9[3] + m9], region(), 8), 520); return; }   /* Zale, Nov 22: folded, zoomed on your place with its neighbors around it */   /* Zale, Nov 22: folded, the map shows the whole experience, not a tight zoom on one place */
    animTo(fitBox(box(M.cur), region(), 0, M.s), 480);
  }
  function frame(k, now) {   /* first pick zooms in; another pick while zoomed keeps the zoom and centres */
    var zoomed = M.s > minS() * 1.9 && M.cur && M.cur !== k;
    var rg = region(); if (wide()) rg = { x: rg.x, y: rg.y + 84, w: rg.w, h: rg.h - 84 };
    M.free = true;   /* desktop: below the experience row */
    var v = fitBox(box(k), rg, wide() ? 40 : 22, zoomed ? M.s : 0);
    if (!zoomed) v[0] = Math.min(v[0], wide() ? Math.min(1.5, startView()[0] * 2.2) : 1.7), v = fitBox(box(k), rg, 0, v[0]);   /* close enough to see the place, with its neighbors around it */
    if (M.glow && M.cur !== k) glow(''); M.cur = k; lit(); animTo(v, now ? 0 : 560);
  }
  function lit() {
    var k = M.cur, L = (!k && M.amen) ? Object.keys(amenHoods()) : (!k && M.xp) ? litSet() : [], d = k ? HH.shapes[k] : L.map(function (h) { return HH.shapes[h]; }).join(' ');
    var grp = curGroup(), dLit = null; if (grp) { d = grp.map(function (h) { return HH.shapes[h]; }).join(' '); dLit = HH.shapes[k]; }   /* Zale, Nov 22: on a neighborhood page the whole experience stays lit; the place you're on gets the stronger outline */
    if (!k && V2 && M.hot && HH.shapes[M.hot]) d = HH.shapes[M.hot];   /* MOCK: the place the pointer is on is lit, everything else dims */
    $('.pkpl-veil', M.svg).setAttribute('d', d ? 'M-4000,-4000H' + (W + 4000) + 'V' + (H + 4000) + 'H-4000Z ' + d : '');
    $('.pkpl-lit', M.svg).setAttribute('d', dLit || d);   /* Zale, Nov 22: the place you're on gets the glow; the rest of its experience stays lit but softer */
    var wp = $('.pkpl-was', M.svg); wp.setAttribute('d', grp ? grp.filter(function (h) { return h !== k; }).map(function (h) { return HH.shapes[h]; }).join(' ') : ((!k && M.was && (M.xp || M.amen || (V2 && wide())) && HH.shapes[M.was]) || '')); wp.classList.toggle('pkpl-wcur', !!grp);
    $$('.pkpl-sh', M.svg).forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-h') === k); });
    M.el.classList.toggle('pkpl-picked', !!k); M.el.classList.toggle('pkpl-xpon', !k && (!!M.xp || !!M.amen));
    var full = $('[data-pl="full"]', M.el); if (full) full.hidden = !k && !M.amen && !M.xp && !(M.s > startView()[0] * 1.15);
    placePins(); xpLabels(); xbDraw();
  }
  /* the experience bar, its title screen and the names on the lit places */
  function xbEnd() { var xr = M && $('.pkpl-xb', M.el); if (xr) { xr.classList.toggle('pkpl-xbmore', xr.scrollLeft + xr.clientWidth < xr.scrollWidth - 4); xr.classList.toggle('pkpl-xbleft', xr.scrollLeft > 4); } }
  function xbShow() { var xr = M && $('.pkpl-xb', M.el), cx0 = M && (top().r === 'hood' ? TOP.xp : M.xp), xs = cx0 && xr && $('.pkpl-xe[data-xp="' + cx0 + '"]', xr); if (!xs) return; if (xs.offsetLeft < xr.scrollLeft + 8 || xs.offsetLeft + xs.offsetWidth > xr.scrollLeft + xr.clientWidth - 8) xr.scrollTo({ left: Math.max(0, xs.offsetLeft + xs.offsetWidth / 2 - xr.clientWidth / 2), behavior: calm() ? 'auto' : 'smooth' }); }
  function xbDraw() {
    if (!M) return; var t = top(), at = (t.r === 'hood' && t.h) ? xpAt(t.h) : null;
    $$('.pkpl-xe', M.el).forEach(function (b) { var e = b.getAttribute('data-xp'); var cur = at ? TOP.xp : M.xp; b.setAttribute('aria-pressed', e === cur ? 'true' : 'false'); b.classList.toggle('quiet', false); });   /* Zale, Nov 22: no dimmed buttons; every experience works from anywhere */
    setTimeout(xbShow, 60); setTimeout(xbEnd, 420);
  }
  function titleDraw() {
    var t = $('.pkpl-title', M.el); if (!t) return;

    var bk = $('.pkpl-bk0', t); if (!bk) { bk = document.createElement('button'); bk.type = 'button'; bk.className = 'pkpl-bk0'; bk.setAttribute('data-pl', 'allxp'); bk.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg><span>All experiences</span>'; t.insertBefore(bk, t.firstChild); }   /* Nov 20 (Zale): a way back above the experience's title, to the first screen with every experience */
    bk.hidden = !M.xp;
    var d = $('.pkpl-d', t);   /* desktop: the experience big, then "at" and the year's logo as the word Pickathon (Zale, Nov 19) */
    if (M.xp) d.innerHTML = '<span class="pkpl-xi">' + xpIcon(M.xp) + '</span><span class="pkpl-xt">' + esc(M.xp) + ' at Pickathon</span>';   /* the experience's icon as a graphic, same plate as the picked button (Zale, Nov 19) */
    else d.textContent = 'Summer camp for your soul';
    t.classList.toggle('pkpl-tx', !!M.xp);
    var bg = $('.pkpl-tbg', t); if (!bg) { bg = document.createElement('div'); bg.className = 'pkpl-tbg'; bg.setAttribute('aria-hidden', 'true'); t.insertBefore(bg, t.firstChild); }   /* desktop: the experience's hero photo behind the column, under a dark wash (Zale, Nov 19) */
    var hp = null; if (M.xp) { var L0 = litSet(), pk = M.xp === 'Architecture' ? 'cherryhill' : L0[0]; for (var i = 0; !hp && i < L0.length + 1; i++) { var cand = i === 0 ? pk : L0[i - 1]; if (cand) hp = (M.xp === 'Architecture' ? xpPhotos('Architecture', cand) : (((XM.xp || {})[M.xp] || {})[cand] || []).map(function (z) { return { i: z.f, p: z.p }; }).concat(xpPhotos(M.xp, cand)))[0] || null; } }
    if (hp) { var bu = 'url("' + hp.i + '")', bp = hp.p, pre = new Image(); bg._want = bu; pre.onload = pre.onerror = function () { if (bg._want === bu) { bg.style.backgroundImage = bu; bg.style.backgroundPosition = bp; } }; pre.src = hp.i; if (pre.complete) pre.onload(); } else { bg._want = ''; bg.style.backgroundImage = 'none'; }   /* Nov 20: the new hero photo is loaded before it replaces the old one, so no black gap between experiences */ t.classList.toggle('pkpl-hasbg', !!hp);
    $('.pkpl-l', t).textContent = M.xp ? (XH.XPD[M.xp] || '') : (wide() ? 'Pick an experience above, then a place' : 'Pick an experience below, then tap a place that lights up');
    var v2 = V2 && wide(); document.body.classList.toggle('pkpl-v2', v2); document.body.classList.toggle('pkpl-v2g', v2 && V2G === 'strong');
    if (v2) {   /* MOCK: experiences live in the left column, pinned; the words and places scroll under them */
      var g2 = $('.pkpl-g2', t), bd = $('.pkpl-body', t);
      if (!g2) { g2 = document.createElement('div'); g2.className = 'pkpl-g2'; g2.setAttribute('role', 'toolbar'); g2.setAttribute('aria-label', 'Experiences'); g2.innerHTML = XO.map(function (e) { return '<button type="button" class="pkpl-xe" data-xp="' + e + '" aria-pressed="false">' + xpIcon(e) + '<span>' + e + '</span></button>'; }).join('');
        bd = document.createElement('div'); bd.className = 'pkpl-body'; ['.pkpl-k', '.pkpl-d', '.pkpl-l', '.pkpl-ab', '.pkpl-pl'].forEach(function (q) { var n = $(q, t); if (n) bd.appendChild(n); }); t.appendChild(g2); t.appendChild(bd); }
      var plx = $('.pkpl-pl', bd), abx = $('.pkpl-ab', bd), pd = $('.pkpl-pd', bd);
      if (!pd) { pd = document.createElement('p'); pd.className = 'pkpl-pd'; bd.insertBefore(pd, plx); if (abx) bd.appendChild(abx);
        var hv = 0; bd.addEventListener('mouseover', function (e) { var r = e.target.closest('.pkpl-pr[data-hp]'); if (!r) return; var k = r.getAttribute('data-hp'), h = data().hoods[k]; if (bd._hk === k) return; bd._hk = k;
          pd.innerHTML = '<b>' + esc(h.n) + '</b> ' + esc(M.xp ? xpLine(M.xp, k) : (hookOf(h) || h.d || '')); pd.classList.add('on'); $$('.pkpl-pr', bd).forEach(function (x) { x.classList.toggle('pkpl-hot', x === r); }); M.hot = k; lit(); clearTimeout(hv); if (0) hv = setTimeout(function () {   /* Zale, Nov 22: hover only lights the place; the map moves on a click, never on a hover */ var rg = clear(), b = box(k), cx = M.tx + (b[0] + b[2]) / 2 * M.s, cy = M.ty + (b[1] + b[3]) / 2 * M.s; if (cx < rg.x + 40 || cx > rg.x + rg.w - 40 || cy < rg.y + 40 || cy > rg.y + rg.h - 40) { M.free = true; animTo([M.s, rg.x + rg.w / 2 - (b[0] + b[2]) / 2 * M.s, rg.y + rg.h / 2 - (b[1] + b[3]) / 2 * M.s], 520); } }, 160);   /* round 2: pointing lights the place where it is; the map only slides if it's off screen, never zooms */ }); }
      if (M.xp === 'Architecture') { var l2 = $('.pkpl-l', t); if (l2) l2.textContent = (XH.XPD.Architecture || '').split('. ')[0].replace(/\.?$/, '.'); }   /* MOCK: Architecture kept short (Zale, Nov 21); final words are Copy's */
      if (bd._xp !== M.xp) { bd._hk = null; pd.classList.remove('on'); pd.textContent = ''; if (!M.xp) M.s0 = null; }
      var pc = $('.pkpl-pc', bd); if (!pc) { pc = document.createElement('p'); pc.className = 'pkpl-pc'; bd.insertBefore(pc, pd); } var nL = M.xp ? litSet().length : 0; pc.textContent = M.xp ? 'In ' + nL + (nL === 1 ? ' neighborhood' : ' neighborhoods') : ''; pc.hidden = !M.xp;
      if (!$('.pkpl-gk', t)) { var gk = document.createElement('div'); gk.className = 'pkpl-gk'; gk.innerHTML = '<p>' + ids().length + ' neighborhoods \u00b7 ' + XO.length + ' experiences</p><h2>' + esc(M0W.headline || 'What do you want to experience?') + '</h2>';   /* Zale, Nov 21: the headline is about the experience; Copy polishes */ t.insertBefore(gk, g2); }
      pc.innerHTML = M.xp ? '<span class="pkpl-pci">' + xpIcon(M.xp) + '</span><b>' + esc(M.xp) + '</b><span class="pkpl-pcn">' + nL + (nL === 1 ? ' neighborhood' : ' neighborhoods') + '</span>' : ''; pc.hidden = !M.xp;
      bd._sum = M.xp ? (XH.XPD[M.xp] || '').split(/(?<=[.!?])\s/)[0] : (M0W.first || 'Point at a neighborhood to find it on the map, or pick an experience above.');
      if (!bd._hk) pd.textContent = bd._sum; var abm = $('.pkpl-ab', bd), plm = $('.pkpl-pl', bd); if (abm && plm && plm.nextSibling !== abm) plm.after(abm);   /* Zale, Nov 22: Build with Pickathon closes the Architecture panel, after the places */
      if (!bd._lv) { bd._lv = 1; bd.addEventListener('mouseleave', function () { bd._hk = null; $$('.pkpl-pr', bd).forEach(function (x) { x.classList.remove('pkpl-hot'); }); pd.classList.remove('on'); pd.textContent = bd._sum; M.hot = null; lit(); }); }
      $$('.pkpl-xe', g2).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-xp') === M.xp ? 'true' : 'false'); });
      bk.hidden = true;
      if (!M.xp) $('.pkpl-l', t).textContent = XO.length + ' experiences across ' + ids().length + ' neighborhoods. Pick one and the map lights up.';
      if (bd._xp !== M.xp) { var px = bd._xp; bd._xp = M.xp; bd.scrollTop = 0; M.hot = null; bd.classList.remove('pkpl-rise', 'pkpl-xf'); void bd.offsetWidth; if (px !== undefined && !calm()) bd.classList.add('pkpl-xf'); }   /* MOCK: the list reorders between experiences, so it fades instead of jumping */
      var more = function () { bd.classList.toggle('pkpl-more', bd.scrollHeight - bd.scrollTop > bd.clientHeight + 4); }; if (!bd._on) { bd._on = 1; bd.addEventListener('scroll', more); } setTimeout(more, 0);
    }
    var v2p = V2 && !wide(); document.body.classList.toggle('pkpl-v2p', v2p);
    if (v2p) {   /* phone and upright tablet (Zale, Nov 22 'work on all form factors'): map on top, the swipe row of experiences, then the same words and places as the desktop column, in a sheet that pulls up to full and folds to the row */
      var ps = $('.pkpl-ps', M.el); if (!ps) { ps = document.createElement('div'); ps.className = 'pkpl-ps'; M.el.appendChild(ps); var hd = document.createElement('div'); hd.className = 'pkpl-psh2'; hd.innerHTML = '<button type="button" class="pkpl-psg" aria-label="Show more"><i></i></button><div class="pkpl-psht"></div>'; M.el.appendChild(hd); var qq = document.createElement('div'); qq.className = 'pkpl-psq'; qq.textContent = 'What do you want to experience?'; M.el.appendChild(qq); psTouch(); }
      var Lp = M.xp ? litSet() : [], D3 = data().hoods, tile = function (k, line) { return '<button type="button" class="pkpl-pr' + (line ? ' pkpl-prp' : '') + '" data-hp="' + k + '">' + (line ? pic(M.xp, k) : '<img src="' + esc(emb(k)) + '" alt="">') + '<span><b>' + esc(D3[k].n) + '</b>' + (line ? '<small>' + esc(line) + '</small>' : '') + '</span></button>'; };
      var sum = M.xp === 'Architecture' ? (XH.XPD.Architecture || '').split('. ')[0].replace(/\.?$/, '.') : M.xp ? (XH.XPD[M.xp] || '').split(/(?<=[.!?])\s/)[0] : '';
      $('.pkpl-psht', M.el).innerHTML = M.xp ? '<div class="pkpl-psln"><span class="pkpl-pci">' + xpIcon(M.xp) + '</span><span class="pkpl-psn">' + Lp.length + (Lp.length === 1 ? ' neighborhood' : ' neighborhoods') + '</span><span class="pkpl-psmore">' + (M.ps === 2 ? 'Map' : 'See ' + (Lp.length === 1 ? 'it' : 'them')) + '</span></div>'   /* Zale, Nov 22 06:46 trims: the pressed button already names the experience, so a small line that opens the list */
        : '<h2 class="pkpl-psbig">What do you want to experience?</h2>';   /* Zale, Nov 22 06:19: arrival asks, nothing picked */
      if (M.xp) ps.innerHTML = '<p class="pkpl-psl">' + esc(sum) + '</p>'
        + '<div class="pkpl-psls' + (Lp.length > 4 ? ' pkpl-psl2' : '') + '">' + Lp.map(function (k) { return tile(k, xpLine(M.xp, k)); }).join('') + '</div>'
        + (M.xp === 'Architecture' ? '<div class="pkpl-psab"><button type="button" class="pk-cta sec pkpl-abb" data-go="build">Build with Pickathon</button></div>' : '');   /* Zale, Nov 22: Build with Pickathon closes the list on every size */
      else ps.innerHTML = '<p class="pkpl-psl">' + phoneFirst() + '</p>'
        + [['stage', 'Stages'], ['around', 'Hangouts'], ['camp', 'Camping']].map(function (g) { var ks = ids().filter(function (k) { return (D3[k].k || 'around') === g[0]; }); return ks.length ? '<p class="pkpl-gh">' + g[1] + '</p><div class="pkpl-psls pkpl-pst">' + ks.map(function (k) { return tile(k); }).join('') + '</div>' : ''; }).join('');
      if (ps._xp !== M.xp) { var px2 = ps._xp; ps._xp = M.xp; ps.scrollTop = 0; M.ps = 1;   /* Zale, Nov 22: a new experience always opens half, so the map shows it lit */ ps.classList.remove('pkpl-xf'); void ps.offsetWidth; if (px2 !== undefined && !calm()) ps.classList.add('pkpl-xf'); var xr = $('.pkpl-xb', M.el), xs = M.xp && xr && $('.pkpl-xe[data-xp="' + M.xp + '"]', xr); if (xs) { var cx = xs.offsetLeft + xs.offsetWidth / 2 - xr.clientWidth / 2; if (xs.offsetLeft < xr.scrollLeft + 8 || xs.offsetLeft + xs.offsetWidth > xr.scrollLeft + xr.clientWidth - 8) xr.scrollTo({ left: Math.max(0, cx), behavior: calm() ? 'auto' : 'smooth' }); } }   /* the picked button is never half off the edge (Site Build, Nov 22) */
      var qq2 = $('.pkpl-psq', M.el); if (qq2) qq2.classList.add('pkpl-psq0');   /* the question line is dropped: arrival's title asks it, and after a pick the pressed button answers it */
      psPlace(); var xr3 = $('.pkpl-xb', M.el); if (xr3 && !xr3._end) { xr3._end = 1; xr3.addEventListener('scroll', xbEnd, { passive: true }); } setTimeout(xbEnd, 400);
    } else { var ps0 = $('.pkpl-ps', M.el); if (ps0) ps0.style.height = ''; var xb0 = $('.pkpl-xb', M.el); if (xb0) xb0.style.bottom = ''; }
    var ab = $('.pkpl-ab', t);   /* Architecture: what it is and how to build with us (Zale, Nov 19: it's how sponsors find us) */
    if (ab) ab.innerHTML = M.xp === 'Architecture' ? '<p>Every summer we build a small city in the forest. Each neighborhood is designed and built new with architects, students, builders and makers, and when the festival ends the structures move on to permanent homes in the community. Two of our builds have won AIA awards.</p><button type="button" class="pk-cta sec pkpl-abb" data-go="build">Build with Pickathon</button>' : '';
    var pl = $('.pkpl-pl', t), L = M.xp ? litSet() : [];   /* desktop: where this experience happens; a row opens the place (Zale, Nov 19) */
    if (pl && v2 && !M.xp && !M.amen) {   /* MOCK round 5: before a pick, every neighborhood is a way in */
      var G = [['stage', 'Stages'], ['around', 'Hangouts'], ['camp', 'Camping']], D2 = data().hoods;
      pl.className = 'pkpl-pl pkpl-cols pkpl-c3'; t.classList.add('pkpl-long');
      pl.innerHTML = G.map(function (g) { var ks = ids().filter(function (k) { return (D2[k].k || 'around') === g[0]; }); return ks.length ? '<p class="pkpl-gh">' + g[1] + '</p>' + ks.map(function (k) { return '<button type="button" class="pkpl-pr" data-hp="' + k + '"><img src="' + esc(emb(k)) + '" alt=""><span><b>' + esc(D2[k].n) + '</b></span></button>'; }).join('') : ''; }).join('');
      return;
    }
    if (pl && !M.xp && !M.amen) { pl.innerHTML = '<div class="pkpl-pg">' + XO.map(function (e) { return '<button type="button" class="pkpl-xe" data-xp="' + e + '">' + xpIcon(e) + '<span>' + e + '</span></button>'; }).join('') + '</div>'; return; }   /* arrival: choose your adventure right under the title */
    if (pl) pl.innerHTML = L.length ? L.map(function (k) { var h = data().hoods[k]; return '<button type="button" class="pkpl-pr" data-hp="' + k + '"><img src="' + esc(emb(k)) + '" alt=""><span><b>' + esc(h.n) + '</b><small>' + esc(xpLine(M.xp, k)) + '</small></span></button>'; }).join('') : '';
    if (v2 && pl) { pl.classList.remove('pkpl-cmp'); pl.classList.add('pkpl-cols'); pl.classList.remove('pkpl-c1'); pl.classList.toggle('pkpl-c3', false); t.classList.add('pkpl-long'); fitList(pl, t, L.length); }
    if (v2) { if (pl) pl.classList.remove('pkpl-many'); t.classList.remove('pkpl-tight', 'pkpl-tight2', 'pkpl-tight3', 'pkpl-tight4', 'pkpl-tight5', 'pkpl-tight6'); return; }
    if (pl && wide()) { pl.classList.remove('pkpl-many'); t.classList.remove('pkpl-tight', 'pkpl-tight2', 'pkpl-tight3', 'pkpl-tight4', 'pkpl-tight5', 'pkpl-tight6'); var over = function () { return t.scrollHeight > t.clientHeight + 2; };   /* fit without scrolling: full rows, then a compact grid, then a tighter title (Zale, Nov 19) */
      if (over()) t.classList.add('pkpl-tight'); if (L.length && over()) pl.classList.add('pkpl-many'); if (over()) t.classList.add('pkpl-tight2'); if (over()) t.classList.add('pkpl-tight3'); if (over()) t.classList.add('pkpl-tight4'); if (over()) t.classList.add('pkpl-tight5'); if (over()) t.classList.add('pkpl-tight6'); }
  }
  function xpLabels() {
    nmDraw(); var box = $('.pkpl-xls', M.el); if (!box) return; var C = (!M.cur && M.amen) ? amenHoods() : null, L = C ? Object.keys(C) : (!M.cur && M.xp) ? litSet() : [];
    box.innerHTML = L.map(function (k) { return '<span class="pkpl-xl" data-h="' + k + '">' + esc(data().hoods[k].n) + (C && C[k] ? ' · ' + C[k] : '') + '</span>'; }).join(''); xlPlace();
  }
  function nmDraw() {   /* the map's own lettering, crisp, for the lit places (Zale, Nov 19: no added tags) */
    var C = (!M.cur && M.amen) ? amenHoods() : null, L = curGroup() || (M.cur ? [M.cur] : C ? Object.keys(C) : M.xp ? litSet() : []);   /* Nov 22: the place you're on gets the same crisp lettering as lit places */
    $$('.pkpl-nms path', M.svg).forEach(function (p) { var k = p.getAttribute('data-h'), on = L.indexOf(k) >= 0, nb = (NB || {})[k]; p.classList.toggle('on', on); p.classList.toggle('dim', !on && L.length > 0); if (!on) p.removeAttribute('transform');   /* Zale, Nov 22: the other places' names stay readable over the veil */
      if (on && nb) { var cx = (nb[0] + nb[2]) / 2, cy = (nb[1] + nb[3]) / 2, f = Math.max(1, Math.min(1.6, 12 / ((nb[3] - nb[1]) * M.s))); p.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + f.toFixed(2) + ') translate(' + (-cx) + ' ' + (-cy) + ')'); } });
  }
  function xlPlace() { if (M.svg) nmDraw();
    var els = $$('.pkpl-xl', M.el); if (!els.length) return;
    var P = els.map(function (el) { var k = el.getAttribute('data-h'), nb = (NB || {})[k], p = nb ? [(nb[0] + nb[2]) / 2, (nb[1] + nb[3]) / 2] : pt(k); if (nb) el.style.fontSize = Math.max(9, Math.min(14, (nb[3] - nb[1]) * M.s * 0.9)) + 'px'; return { el: el, x: M.tx + p[0] * M.s, y: M.ty + p[1] * M.s, w: el.offsetWidth || 90 }; }).sort(function (a, b) { return a.y - b.y; });
    P.forEach(function (a, i) { for (var j = 0; j < i; j++) { var b = P[j]; if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 6 && Math.abs(a.y - b.y) < 17) a.y = b.y + 17; } a.x = Math.max(a.w / 2 + 6, Math.min(M.vw - a.w / 2 - 6, a.x)); a.el.style.transform = 'translate(' + Math.round(a.x) + 'px,' + Math.round(a.y) + 'px) translate(-50%,-50%)'; a.el.hidden = a.y < 0 || a.y > M.vh; });
  }
  function fitLit() {
    var L = M.amen ? Object.keys(amenHoods()) : litSet(); if (!L.length) { home(); return; }
    if (L.length > 1 && L.indexOf('curation') >= 0) L = L.filter(function (k) { return k !== 'curation'; });   /* Zale, Nov 22: Curation sits off the farm in its own box; framing on it zooms the farm out to nothing. Its box and edge tag show it */
    if (V2 && wide() && L.length <= 3) { var rgS = clear(), fS = fitBox(union(L), rgS, 36); var vS = v2Fit(fitBox(union(L), rgS, 36, Math.min(fS[0], startView()[0] * 2)), L); M.s0 = vS[0]; M.free = true; animTo(vS, 560); return; }   /* Nov 21: one to three places never zoom closer than twice the overview (Family) */
    if (V2 && wide() && L.length > 3 && !/[?&]z=0/.test(location.search)) {   /* MOCK: fill the screen: frame the heart of this experience, the far places sit off the edge and a drag or a row brings them in */
      var reg = clear(), s0 = fitBox(union(L), reg, 18)[0], K = L.slice(), up = L.filter(function (k) { return (box(k)[1] + box(k)[3]) / 2 < 2900; }), min = Math.ceil(L.length * 0.6);
      if (up.length >= 2 && up.length < L.length) { K = up; min = K.length;
        var cyOf = function (k) { var bb = box(k); return (bb[1] + bb[3]) / 2; }, far = null, fd = 0;
        K.forEach(function (k) { var rest = K.filter(function (j) { return j !== k; }), ys = rest.map(cyOf), lo = Math.min.apply(0, ys), hi = Math.max.apply(0, ys), y = cyOf(k), dd = y < lo ? lo - y : y > hi ? y - hi : 0; if (dd > fd) { fd = dd; far = k; } });
        if (far && fd > 600 && K.length > 2) K = K.filter(function (j) { return j !== far; }); min = K.length; }   /* one place far above or below the rest (the Woods for Music) comes in when pointed at; places beside each other all stay (Wellness) */   /* Nov 21: the upper places all stay in frame (Wellness lost the Refuge when it trimmed further) */   /* MOCK (Nov 21): tall experiences open on the wide upper farm; the lower places come in when you point at them */
      while (K.length > min && fitBox(union(K), reg, 18)[0] < s0 * 1.7) { var best = null, bs = 0; K.forEach(function (k) { var s1 = fitBox(union(K.filter(function (j) { return j !== k; })), reg, 18)[0]; if (s1 > bs) { bs = s1; best = k; } }); K = K.filter(function (j) { return j !== best; }); }
      var f0 = fitBox(union(K), reg, 18), bK = union(K), wFit = (reg.w - 36) / (bK[2] - bK[0]), vv = v2Fit(fitBox(bK, reg, 18, Math.min(maxS(), f0[0] * 1.4, wFit, startView()[0] * 2)), K);   /* never closer than twice the overview (Family is one place) */   /* zoom in to fill the height, but never so far that a lit place leaves the sides (Wellness) */   /* wide enough that the farm reaches from under the column to the right side */ M.s0 = vv[0]; M.free = true; animTo(vv, 560); return;
    }
    if (v2p()) { M.free = true; var Kp = L.slice(); if (Kp.length > 2) { var cyp = function (k) { var bb = box(k); return (bb[1] + bb[3]) / 2; }, fp = null, fdp = 0; Kp.forEach(function (k) { var ys = Kp.filter(function (j) { return j !== k; }).map(cyp), lo = Math.min.apply(0, ys), hi = Math.max.apply(0, ys), y = cyp(k), dd = y < lo ? lo - y : y > hi ? y - hi : 0; if (dd > fdp) { fdp = dd; fp = k; } }); if (fp && fdp > 600) Kp = Kp.filter(function (j) { return j !== fp; }); }
      var vp = fitBox(union(Kp), clear(), 16), sc0 = startView()[0] * 2.2; if (vp[0] > sc0) { var bq = union(Kp), crq = clear(); vp = [sc0, crq.x + crq.w / 2 - (bq[0] + bq[2]) / 2 * sc0, crq.y + crq.h / 2 - (bq[1] + bq[3]) / 2 * sc0]; }   /* one place (Comedy: Lucky) stays a place on the farm, not a close-up */
      animTo(vp, 560); return; }   /* phone: frame the lit places in the strip above the sheet; one place far above or below the rest (the Woods for Music) sits just off the edge, a drag brings it in */   /* phone: frame the lit places in the strip above the sheet */
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
      M.free = false;   /* the visitor takes over: the edge limit returns */
      if (e.target.closest('.pkpl-tools,.pkpl-amtag,.pkpl-find,.pkpl-xb,.pkpl-pl,.pkpl-ab,.pkpl-ps,.pkpl-psh2,.pkpl-psq,.pkpl-edgetag')) return;
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
      if (el._drag && Date.now() - el._drag < 140) { e.stopPropagation(); e.preventDefault(); return; }
      var et = e.target.closest('.pkpl-edgetag'); if (et && et.classList.contains('pkpl-etall')) { M.free = true; var crA = clear(), vA = fitBox(union(litSet()), crA, 24); animTo(vA, 520); return; }
      if (et) { var cr5 = clear(), mx5 = +et.getAttribute('data-mx'), my5 = +et.getAttribute('data-my'); M.free = true; animTo([M.s, cr5.x + cr5.w / 2 - mx5 * M.s, cr5.y + cr5.h / 2 - my5 * M.s], 460); return; }   /* slide to the tagged place */
      if (e.target.closest('.pkpl-psh2,.pkpl-psq') || (e.target.closest('.pkpl-ps') && !e.target.closest('button'))) return;   /* the phone sheet's handle and its blank space are not the map */
      var xb = e.target.closest('[data-xp]'); if (xb) { xpPick(xb.getAttribute('data-xp')); return; }
      var gb = e.target.closest('[data-go]'); if (gb) { go(gb.getAttribute('data-go')); return; }
      var hp = e.target.closest('[data-hp]'); if (hp) { if (M.title) { M.title = false; } open(hp.getAttribute('data-hp')); return; }
      var b = e.target.closest('[data-pl]'); if (b) { tool(b.getAttribute('data-pl'), b); return; }
      var a = e.target.closest('.pkpl-amdot'); if (a) return;
      if (M.cur && !M.amen && (!e.target.closest('[data-h]') || e.target.closest('[data-h]').getAttribute('data-h') === M.cur)) { var gk = iconAt(rel(e)); if (gk) { glow(gk === M.glow ? '' : gk); e.stopPropagation(); return; } }   /* a tap on ANOTHER neighborhood's shape always opens that neighborhood (Zale, Nov 20: it got stuck behind an icon glow) */   /* Nov 20 (Zale): inside a place, tap one of its icons and every icon of that kind glows on the real map; the view stays put */
      var h = e.target.closest('[data-h]');
      if (!h && !wide() && e.clientX != null) { for (var ri = 0; ri < 16 && !h; ri++) { var ang = ri * Math.PI / 4, rr = ri < 8 ? 12 : 22, q = document.elementFromPoint(e.clientX + rr * Math.cos(ang), e.clientY + rr * Math.sin(ang)); h = q && q.closest && q.closest('#pkpl [data-h]'); } }   /* Nov 21: a finger that just misses a thin place (Quail Trail) still opens it */
      if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); if (!h) return; }   /* the title screen holds until a click on the map or an icon */
      if (!h) { if (!wide() && top().r === 'hood' && cardEl() && !cardEl().classList.contains('pkpl-folded')) setFold(true); return; }   /* Nov 20 (Zale): tap the map above an open sheet to fold it and reach the rest of the map */
      tap(h.getAttribute('data-h'), e.target.closest('.pkpl-em'));
    }, true);
    el.addEventListener('wheel', function (e) { if (wide() && !e.target.closest('.pkpl-find') && e.clientX - el.getBoundingClientRect().left < lw() && (M.xp || M.amen || M.title || top().r === 'hood') && e.target.closest('.pkpl-title,.pkpl-pl,.pkpl-xls')) return;   /* Nov 20: scrolling over the left column never moves the map or brings the full map back */
      e.preventDefault(); var r = rel(e); if (!M.moving) moving(true); clearTimeout(M.wt); M.wt = setTimeout(function () { moving(false); lit(); }, 140);
      var pad = !e.ctrlKey && e.deltaMode === 0 && (e.deltaX !== 0 || Math.abs(e.deltaY) < 40 || e.deltaY % 1 !== 0);   /* trackpad: two fingers move the map, pinch (ctrl+wheel) zooms; a mouse wheel zooms */
      if (pad) { apply(M.s, M.tx - e.deltaX, M.ty - e.deltaY); return; }
      var f = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : e.ctrlKey ? 0.012 : 0.0022)), s = Math.max(minS() * 0.9, Math.min(maxS(), M.s * f)), mx = (r[0] - M.tx) / M.s, my = (r[1] - M.ty) / M.s; apply(s, r[0] - mx * s, r[1] - my * s); }, { passive: false });
    el.addEventListener('keydown', function (e) { if (e.target.closest('.pkpl-em,[data-pl],.pkpl-find')) return; var k = e.key, st = 80;
      if (k === '+' || k === '=') zoomAt([M.vw / 2, M.vh / 2], 1.4); else if (k === '-') zoomAt([M.vw / 2, M.vh / 2], 1 / 1.4);
      else if (/^Arrow/.test(k)) apply(M.s, M.tx + (k === 'ArrowLeft' ? st : k === 'ArrowRight' ? -st : 0), M.ty + (k === 'ArrowUp' ? st : k === 'ArrowDown' ? -st : 0)); else return; e.preventDefault(); });
  }
  function iconAt(p) {
    var mx = (p[0] - M.tx) / M.s, my = (p[1] - M.ty) / M.s, r = Math.max(16, 22 / M.s), best = null, bd = 1e9;
    (MI || []).forEach(function (z) { var d = Math.hypot(z[1] - mx, z[2] - my); if (d < r && d < bd) { bd = d; best = z[0]; } });
    return best;
  }
  function glow(kind) {   /* the kind's icons glow wherever they sit on the map; the camera does not move */
    M.glow = kind || ''; $('.pkpl-icon', M.svg).innerHTML = kind ? amOf(kind).map(amUse).join('') : '';
    M.el.classList.toggle('pkpl-glowon', !!kind);
    var tag = $('.pkpl-amtag', M.el); if (!M.amen) { tag.hidden = !kind; if (kind) $('span', tag).textContent = (AMN[kind] || kind) + ' · ' + amOf(kind).length + ' on the farm'; }
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
    if (a === 'full') { M.amen = ''; amenDraw(); M.xp = ''; M.was = ''; titleDraw(); if (top().r === 'hood') { go('hoods'); M.cur = ''; lit(); home(); return; } M.title = true; M.el.classList.remove('pkpl-notitle'); home(); return; }   /* Full map: the whole start view with the title back */
    if (a === 'allxp') { M.xp = ''; M.amen = ''; amenDraw(); M.was = ''; M.title = true; M.el.classList.remove('pkpl-notitle'); titleDraw(); lit(); home(); return; }
    if (a === 'find') { findOpen(); return; }
    if (a === 'amclear') { if (M.glow && !M.amen) { glow(''); return; } M.amen = ''; amenDraw(); lit(); return; }
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
    var ph = XE ? xpPhotos(XE, k) : photos(k); if (!ph.length) ph = photos(k); var L = (XE && xpPlaces(XE).length > 1 && xpPlaces(XE).indexOf(k) >= 0) ? xpPlaces(XE) : ids(), j = L.indexOf(k), prev = L[(j - 1 + L.length) % L.length], next = L[(j + 1) % L.length], stepOK = !!(XE && L.length > 1 && L.length < ids().length && j >= 0);
    var key = k + '|' + XE + '|' + (M && M.xp) + '|' + has + '|' + TOP.day + '|' + TOP.all + '|' + (FROM ? FROM.n : '') + '|' + wide();
    if (el._key === key) return; el._key = key;
    var dayN = {}; (D.days || []).forEach(function (d) { dayN[d.id] = d.n; });
    var rows = has ? S[TOP.day] : [], showN = TOP.all ? rows.length : 3;
    var html = (XH && M && wide() ? '<button type="button" class="pkpl-up" data-pk="up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>Map' + (M.xp ? ' \u00b7 ' + esc(M.xp) : '') + '</button>' : '') +
      (XH && wide() ? '<div class="pkpl-hxr" role="toolbar" aria-label="Experiences">' + XO.map(function (e) { return '<button type="button" data-pk="xprow" data-e="' + esc(e) + '" aria-pressed="' + (e === XE) + '">' + xpIcon(e) + '<span>' + esc(e) + '</span></button>'; }).join('') + '</div>' : '')   /* Zale, Nov 22: the experience row is the main navigation on every size, desktop neighborhood pages too */ + '<div class="pkpl-bar" role="button" tabindex="0" aria-expanded="true" aria-label="Show or hide ' + esc(h.n) + '"><i aria-hidden="true"></i>' + (stepOK ? '<button type="button" class="pkpl-bst l" data-pk="step" data-to="' + prev + '" aria-label="Previous: ' + esc(D.hoods[prev].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>' : '') + '<span class="pkpl-bmid"><img class="pkpl-bi" src="' + esc(emb(k)) + '" alt=""><span class="pkpl-bn">' + esc(h.n) + (XE || stepOK ? '<em>' + esc([XE, stepOK ? (j + 1) + ' of ' + L.length : ''].filter(Boolean).join(' \u00b7 ')) + '</em>' : '') + '</span></span>' + (stepOK ? '<button type="button" class="pkpl-bst r" data-pk="step" data-to="' + next + '" aria-label="Next: ' + esc(D.hoods[next].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' : '') + '</div>' + '<div class="pkpl-sheet' + (has ? ' pkpl-has' : '') + '">' +
      (wide() ? '<button type="button" class="pkpl-grab pkpl-dgrab" data-pk="dgrab" aria-label="Show or hide the experiences"><i></i></button>' : '<div class="pkpl-grab" aria-hidden="true"><i></i></div>') +
      '<div class="pkpl-hero" aria-roledescription="carousel" aria-label="' + esc(h.n) + ' photos">' +
      ph.map(function (p, i) { return '<img src="' + esc(p.i) + '" alt="" style="object-position:' + esc(p.p) + '"' + (i === 0 ? '' : ' loading="lazy"') + ' draggable="false">'; }).join('') +
      '<div class="pkpl-shade" aria-hidden="true"></div>' +
      '<button type="button" class="pkpl-arr l" data-pk="step" data-to="' + prev + '" aria-label="Previous ' + esc(XE && XE !== 'Architecture' ? XE + ' place' : 'place') + ': ' + esc(D.hoods[prev].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>' +
      '<button type="button" class="pkpl-arr r" data-pk="step" data-to="' + next + '" aria-label="Next ' + esc(XE && XE !== 'Architecture' ? XE + ' place' : 'place') + ': ' + esc(D.hoods[next].n) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      (ph.length > 1 ? '<div class="pkpl-dots" role="group" aria-label="Photos">' + ph.map(function (p, i) { return '<button type="button" data-pk="dot" data-i="' + i + '" aria-label="Photo ' + (i + 1) + ' of ' + ph.length + '"' + (i === 0 ? ' aria-current="true"' : '') + '><i></i></button>'; }).join('') + '</div>' : '') +
      '<div class="pkpl-hi">' + (XE && XE !== 'Architecture' ? '<p class="pkpl-kind pkpl-kx"><span class="pkpl-kci">' + xpIcon(XE) + '</span>' + esc(XE) + '</p>' : '<p class="pkpl-kind' + (XE ? ' pkpl-kx' : '') + '">' + (h.k === 'camp' ? esc(KIND[h.k] || '') : 'Architecture ' + (k === 'woods' ? 'in the Woods' : 'at ' + esc(h.n))) + '</p>') + '<div class="pkpl-nmrow"><img src="' + esc(emb(k)) + '" alt=""><h1>' + esc(h.n) + '</h1></div><p class="pkpl-tt">' + esc(XE ? xpLine(XE, k) : (h.t || '')) + '</p></div>' +
      '</div>' +
      (XE && L.length > 1 && L.length < ids().length ? '<nav class="pkpl-stepl" aria-label="' + esc(XE) + ' places"><button type="button" data-pk="step" data-to="' + prev + '">\u2039 ' + esc(D.hoods[prev].n) + '</button><span>' + (j + 1) + ' of ' + L.length + '</span><button type="button" data-pk="step" data-to="' + next + '">' + esc(D.hoods[next].n) + ' \u203a</button></nav>' : '') +   /* Nov 22: walk this experience's places without the map */
      (FROM ? '<p class="pkpl-from">' + esc(FROM.n) + ' played ' + esc(h.n) + ' at Pickathon ' + FROM.y + '</p>' : '') +
      (has ? '<section class="pkpl-sc" aria-label="Schedule at ' + esc(h.n) + '"><div class="pkpl-days" role="group" aria-label="Day">' + days.map(function (d) { return '<button type="button" class="pk-cta sec pkpl-chip" data-pk="day" data-d="' + d + '"' + (d === TOP.day ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(dayN[d] || d.slice(5)) + '</button>'; }).join('') + '</div>' +
        '<ol class="pkpl-sets">' + rows.slice(0, showN).map(function (s) { var A = (D.artists || {})[s.a] || {}; return '<li><span class="pkpl-st">' + tm(s.s) + '</span><span class="pkpl-sa"><b>' + esc(A.n || s.a) + '</b><small>' + esc(LBL[s.l] || '') + '</small></span></li>'; }).join('') + '</ol>' +
        (rows.length > 3 ? '<button type="button" class="pk-cta sec pkpl-whole" data-pk="whole" aria-expanded="' + TOP.all + '">' + (TOP.all ? 'Show less' : 'Whole day at ' + esc(h.n)) + '</button>' : '') + '</section>' : '') +
      whatIs(h, has) +   /* Zale, Nov 22 (mission review): lead with what the place is now */
      soon(k, XE, h, has) + vids(k, XE) +
      alsoAt(k, XE, h) + yearIs(h) + '<div class="pkpl-credw"><div class="pkpl-cred"></div></div>' +   /* the last build is history, next to who built it */
      '</div>';
    setTimeout(railArrows, 400);
    el.innerHTML = html; (function () { var tt = $('.pkpl-hi .pkpl-tt', el), a1 = $('.pkpl-what .pkpl-ab1', el) || $('.pkpl-yr .pkpl-ab1', el); if (tt && a1 && tt.textContent.trim() === a1.textContent.trim()) a1.remove(); })();   /* never the same line twice (Architecture shows the hook on the photo) */ var cr9 = $('.pkpl-cred', el), cw9 = $('.pkpl-credw', el); if (cr9 && cw9) cw9.appendChild(cr9);   /* Nov 22 review: who built it comes after what's here */
    TOP.i = 0; heroArm(el); document.body.classList.toggle('pkpl-xpup', !!$('.pkpl-up', el));   /* our link up replaces the app's Back to map */
  }
  var VN = { woods: ['Woods', 'Woods Stage'], cherryhill: ['Cherry Hill'], grove: ['Grove'], windmill: ['Windmill'], paddock: ['Paddock'], galaxy: ['Galaxy Barn'], lucky: ['Lucky Barn'], curation: ['Curation'], farmhouse: ['Farmhouse'] };
  var MAG = null;
  function mag(a) { if (!MAG) { MAG = {}; var B = data().yearBill || {}; Object.keys(B).forEach(function (y) { (B[y] || []).forEach(function (r) { var n = (r.n || '').toLowerCase(); if (r.m && (!MAG[n] || r.m > MAG[n])) MAG[n] = r.m; }); }); } return MAG[(a || '').toLowerCase()] || 3; }
  function vidPool(k, e) {   /* every song video for this experience at this place; music when the experience has none (Zale, Nov 19) */
    var V = data().videos || [], song = function (v) { return !v.f && !/full set/i.test(v.s || ''); }, f = null, x = e;
    if (e === 'Comedy' && k === 'lucky') f = function (v) { return v.vn === 'Laugh'; };
    else if (e === 'Literary' && k === 'woods') f = function (v) { return v.vn === 'Spoken'; };
    else if ((e === 'Food' || e === 'Music') && k === 'curation') f = function (v) { return v.cur; };
    var L = f ? V.filter(function (v) { return f(v) && song(v); }) : [];
    if (!L.length && VN[k]) { x = 'Music'; L = V.filter(function (v) { return VN[k].indexOf(v.vn) >= 0 && !v.nonact && !v.cur && song(v); }); }
    return { L: L, x: x };
  }
  function vidPick(L, n) {   /* five: one per band, at most two a year, weighted to bigger acts and the catalog's best, fresh each visit */
    var by = {}; L.forEach(function (v) { var w = Math.pow(mag(v.a), 2) * (v.k ? 1.6 : 1); if (!by[v.a] || w * Math.random() > by[v.a].w * Math.random()) by[v.a] = { v: v, w: w }; });
    var C = Object.keys(by).map(function (a) { return by[a]; }), out = [], yc = {}, sk = [];
    while (out.length < n && C.length) { var T = C.reduce(function (t, c) { return t + c.w; }, 0), r = Math.random() * T, i = 0; while (i < C.length - 1 && (r -= C[i].w) > 0) i++;
      var c = C.splice(i, 1)[0]; if ((yc[c.v.y] || 0) >= 2) { sk.push(c); continue; } yc[c.v.y] = (yc[c.v.y] || 0) + 1; out.push(c.v); }
    while (out.length < n && sk.length) out.push(sk.shift().v);   /* few years on record: fill the rest anyway */
    return out.sort(function (a, b) { return mag(b.a) - mag(a.a); });
  }
  var VPK = {};
  function vidU(v) { return v.vm ? 'https://vimeo.com/' + v.vm + (v.vh ? '/' + v.vh : '') : 'https://www.youtube.com/watch?v=' + v.id; }
  function vids(k, XE) {   /* "Watch at <place>": five as a playlist, then a door to all of them */
    var P = vidPool(k, XE || 'Music'); if (!P.L.length) return '';
    var key = k + '|' + P.x, L = VPK[key] || (VPK[key] = vidPick(P.L, 5)), h = data().hoods[k], nm = h.n;
    var lab = M0W.vidHead ? M0W.vidHead.replace('{place}', nm) : P.x === 'Music' ? 'Watch at ' + nm : 'Watch ' + P.x.toLowerCase() + ' at ' + nm;   /* Copy owns the heading (xpWords.map.vidHead) */
    return '<section class="pkpl-vids" aria-label="' + esc(lab) + '"><h2 class="pkpl-vh">' + esc(lab) + '</h2><div class="pkpl-vr">' + L.map(function (v, i) {
      var th = v.th || ('https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg');
      return '<div class="pkpl-vw"><button type="button" class="pkpl-vt" data-pk="vid" data-vk="' + esc(key) + '" data-i="' + i + '" aria-label="Play ' + esc(v.a) + ', Pickathon ' + v.y + '"><img src="' + esc(th) + '" alt="" loading="lazy"><span class="pkpl-pr0" aria-hidden="true"><i></i></span></button><button type="button" class="pkpl-vn" data-pk="act" data-n="' + esc(v.a) + '" data-y="' + esc(String(v.y)) + '"><b>' + esc(v.a) + '</b><small>Pickathon ' + v.y + '</small></button></div>';   /* Zale, Nov 22: no extra text; the picture plays, the name opens the artist page */
    }).join('') + (P.L.length > L.length ? '<button type="button" class="pkpl-vt pkpl-vall" data-pk="vall" data-h="' + k + '"><span><b>All ' + P.L.length + ' videos</b><small>at ' + esc(nm) + '</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' : '') + '</div>' + '</section>';
  }
  function storyIs(h, has) {   /* one story of the place (Zale, Nov 19): this year's headline, the place's one-liner, then this year's story and the place in one read; credits at the end */
    var by = h.by || {}, y = Object.keys(by).sort().pop(), st = y && by[y] && by[y].t ? by[y] : null;
    var j = function (d) { return Array.isArray(d) ? d.join(' ') : (d || ''); }, yr = st ? j(st.d) : '', ab = ddOf(h) || j(h.d), hk = has ? '' : (hookOf(h) || '');
    var body = [yr, ab].filter(Boolean).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
    return '<section class="pkpl-yr"><p class="pkpl-sk">' + (st ? esc(kick(y)) : esc(h.n)) + '</p>' + (st ? '<h2>' + esc(st.t) + '</h2>' : '') + (hk ? '<p class="pkpl-ab1">' + esc(hk) + '</p>' : '') +
      (body ? '<div class="pkpl-more">' + body + '<button type="button" class="pkpl-rm" data-pk="rm" aria-expanded="false">Keep reading</button></div>' : '') + '<div class="pkpl-cred"></div></section>';
  }
  function yearIs(h) {   /* this year's story leads (Zale, Nov 19): kicker, headline, a few lines, Read more */
    var by = h.by || {}, y = Object.keys(by).sort().pop(), st = y && by[y]; if (!st || !st.t) return '';
    var bw = BYW && hkey(h) && BYW[hkey(h)] && BYW[hkey(h)][y], sd = (data().hoods[hkey(h)] || {}).by && bw ? bw : st.d; var tx = Array.isArray(sd) ? sd.join(' ') : (sd || '');
    return '<section class="pkpl-yr"><p class="pkpl-sk">' + esc(kick(y)) + '</p><h2>' + esc(st.t) + '</h2>' + (tx ? '<div class="pkpl-more"><p>' + esc(tx) + '</p><button type="button" class="pkpl-rm" data-pk="rm" aria-expanded="false">Keep reading</button></div>' : '') + '</section>';
  }
  function whatIs(h, has) { var t = ddOf(h) || (Array.isArray(h.d) ? h.d.join(' ') : (h.d || '')), hk = has ? '' : (hookOf(h) || ''); if (!t && !hk) return '';
    var body = !t ? '' : t.length < 260 ? '<p class="pkpl-wt">' + esc(t) + '</p>' : '<div class="pkpl-more"><p>' + esc(t) + '</p><button type="button" class="pkpl-rm" data-pk="rm" aria-expanded="false">Keep reading</button></div>';   /* a short description shows whole */
    return '<div class="pkpl-what"><p class="pkpl-sk">' + esc((M0W.aboutKicker || 'About {place}').replace('{place}', h.n)) + '</p>' + (hk ? '<p class="pkpl-ab1">' + esc(hk) + '</p>' : '') + body + '</div>'; }
  function soon(k, XE, h, has) {
    if (has) return '';   /* the real schedule is showing: it is the 2027 card */   /* the 2027 schedule, summarized until it posts (Zale, Nov 19: more useful than every past year) */
    var HP = (data().hoodProg || {})[k], kinds = HP ? (HP.kinds || []).map(function (g) { return g[0]; }).filter(function (n) { return !/^(more|showcases)/i.test(n); }) : [];
    var lc = function (x) { return x.charAt(0).toLowerCase() + x.slice(1); }, what;
    var musicy = /legends|discoveries/i.test(kinds.join(' '));
    if (XE === 'Music') what = 'music from legends, discoveries and deep cuts';
    else if (XE && XE !== 'Architecture' && (musicy || !kinds.length)) what = ({ DJs: 'DJ sets', Comedy: 'comedy', Literary: 'readings and storytelling', Food: 'food and drink', Drinks: 'drinks' })[XE] || lc(XE);
    else if (musicy) what = 'music from legends, discoveries and deep cuts';
    else what = kinds.slice(0, 4).map(lc).join(', ').replace(/, ([^,]*)$/, ' and $1') || (XE ? lc(XE) : 'programming');
    var am = (MI || []).filter(function (z) { return z[3] === k; }).map(function (z) { return z[0]; }).filter(function (x, i, a) { return a.indexOf(x) === i && x !== 'tent' && x !== 'gear'; });
    return '<section class="pkpl-soon" aria-label="2027 at ' + esc(h.n) + '"><p class="pkpl-sk">Schedule</p><h2>2027 at ' + esc(h.n) + '</h2><p>' + esc(M0W.soonLine ? M0W.soonLine.replace('{What}', what.charAt(0).toUpperCase() + what.slice(1)).replace('{place}', h.n) : 'Four days of ' + what + ' at ' + h.n + ', Thursday to Sunday, August 5 to 8. The full schedule posts with the 2027 lineup.') + '</p>' +
      (am.length ? '<div class="pkpl-sam">' + am.map(function (x) { return '<span><i class="pkpl-fi">' + amGlyph(x) + '</i>' + esc(AMN[x] || x) + '</span>'; }).join('') + '</div>' : '') + '</section>';
  }
  function alsoAt(k, XE, h) {   /* one tile per other experience at this place */
    if (!XE) return ''; var O = xpAt(k).filter(function (e) { return e !== XE; }); if (!O.length) return '';
    return '<section class="pkpl-also" aria-label="Also at ' + esc(h.n) + '"><h2>Also at ' + esc(h.n) + '</h2><div class="pkpl-at">' + O.map(function (e) {
      return '<button type="button" class="pkpl-ax pkpl-axc" data-pk="xp" data-e="' + esc(e) + '">' + xpIcon(e) + '<b>' + esc(e) + '</b></button>'; }).join('') + '</div></section>';   /* Nov 22: a side note in small chips, same look as the row */
  }
  function heroArm(el) {
    clearTimeout(TOP.timer); var hero = $('.pkpl-hero', el); if (!hero) return;
    var imgs = $$('img:not(.pkpl-nmrow img)', hero).filter(function (x) { return x.parentNode === hero; }); if (imgs.length > 1) heroReady(imgs[1]);
    if (imgs[0]) heroReady(imgs[0]).then(function (ok) { var f = imgs[0]; if (!ok || !f.isConnected || f.classList.contains('on') || TOP.i !== 0) return; requestAnimationFrame(function () { f.classList.add('top'); requestAnimationFrame(function () { f.classList.add('on'); }); }); });   /* the first photo fades in once it has decoded, never pops in over the dark frame (Zale, Nov 20) */
    if (imgs.length < 2 || calm()) return;
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
    document.documentElement.style.setProperty('--pkpl-vh', vh + 'px'); document.documentElement.style.setProperty('--pkpl-hd', hd + 'px'); document.documentElement.style.setProperty('--pkpl-open', openH(vh) + 'px');
  }
  var lastHood = '';
  function xbVar() { if (!M || wide()) return; var x = $('.pkpl-xb', M.el); if (x && x.offsetHeight) document.documentElement.style.setProperty('--pkpl-xbh', (x.offsetHeight + 5) + 'px'); }   /* tablet: the row can be two lines on a neighborhood page */
  function hhVar() { var hd = document.querySelector('#root header'); if (hd && wide()) document.documentElement.style.setProperty('--pkpl-hh', hd.offsetHeight + 'px'); }
  function settleSheet() { xbVar(); setTimeout(xbVar, 300); hhVar();   /* a new place opens with the sheet at about 60% (55% on portrait tablet) */
    var t = top(); if (t.r !== 'hood' || wide()) { lastHood = t.r === 'hood' ? t.h : ''; return; }
    if (lastHood === t.h) return; lastHood = t.h;
    var sc0 = scroller(); if (sc0) sc0.scrollTop = 0; var kf = KEEPFOLD; KEEPFOLD = false; setFold(kf); return;   /* Zale, Nov 22: stepping from the folded bar stays folded */   /* the card is pinned on phone; the page never scrolls to place it */
    var sc = scroller(), sp = document.getElementById('pkpl-sp'); if (!sc || !sp) return;
    var set = function () { if (!sp.isConnected) return; var vh = sc.clientHeight, f = window.innerWidth >= 700 ? 0.55 : 0.6; sc.scrollTop = Math.max(0, sp.offsetTop + sp.offsetHeight - Math.round(vh * (1 - f))); };
    var touched = false, mv = function () { touched = true; };
    ['touchstart', 'wheel', 'keydown', 'pointerdown'].forEach(function (k) { window.addEventListener(k, mv, { once: true, passive: true, capture: true }); });
    set(); requestAnimationFrame(set); setTimeout(function () { if (!touched) set(); }, 120);   /* once, after the app's own scroll-to-top for a new page */
  }

  /* the page never pinch-zooms (Zale, Nov 20): the map does its own pinch. iOS ignores user-scalable=no, so the Safari gesture is stopped here too */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });

  /* ---------- keeping in step with the app ---------- */
  function mount() { words();
    var isle = document.getElementById('pkpl'), t = top();
    document.body.classList.toggle('pkpl-on', !!isle);
    document.body.classList.toggle('pkpl-hood', !!isle && t.r === 'hood');
    if (isle && t.r === 'hood' && M) { var xr7 = $('.pkpl-xb', M.el); if (xr7) xr7.style.bottom = ''; }   /* the map sheet lifts the row; on a neighborhood page it goes back to just above the nav */
    document.body.classList.toggle('pkpl-wide', !!isle && wide());
    if (!isle) { lastHood = ''; return; }
    if (!data()) return;
    if (!M) makeMap();
    if (M.el.parentNode !== isle) { isle.appendChild(M.el); }
    sheetVars(); layout();
    if (M._tw !== wide()) { M._tw = wide(); titleDraw(); }   /* first paint and phone/desktop switch: the title's words and buttons */
    drawTop();
    var hx = window.__pkMapXP; if (hx) { window.__pkMapXP = '';   /* Zale Nov 22 01:03: Home's 'Find Music in 9 neighborhoods' opens the map with Music picked; a place opened from Home keeps the experience (design_home-34) */
      if (XO.indexOf(hx) >= 0) { if (t.r === 'hoods') { if (M.xp !== hx) setTimeout(function () { if (M.xp !== hx) xpPick(hx); }, 0); } else if (t.r === 'hood') M.xp = hx; } }
    if (t.r === 'hood' && t.h && t.h !== M.cur && HH.shapes[t.h]) { if (M.title) { M.title = false; M.el.classList.add('pkpl-notitle'); } frame(t.h, !M.s); }   /* arriving at a place shows it, never the title screen */
    if (t.r === 'hoods' && M.cur) { M.was = M.cur; M.cur = ''; M.hot = ''; $$('.pkpl-hot', M.el).forEach(function (r) { r.classList.remove('pkpl-hot'); }); var bd9 = $('.pkpl-body', M.el), pd9 = bd9 && $('.pkpl-pd', bd9); if (bd9) bd9._hk = null; if (pd9 && bd9._sum) { pd9.textContent = bd9._sum; pd9.classList.remove('on'); } var from9 = M.was; if (wide() && from9 && bd9) { var r9 = $('.pkpl-pr[data-hp="' + from9 + '"]', bd9); if (r9 && pd9) { var xl9 = M.xp ? xpLine(M.xp, from9) : ''; if (xl9) { pd9.innerHTML = '<b>' + esc(data().hoods[from9].n) + '</b> ' + esc(xl9); } } if (r9) { r9.classList.add('pkpl-was'); setTimeout(function () { r9.classList.remove('pkpl-was'); }, 4000); } } if (v2p()) { M.ps = 1; titleDraw(); psPlace(); var mo2 = $('.pkpl-psmore', M.el); if (mo2) mo2.textContent = litSet().length === 1 ? 'See it' : 'See them'; }   /* round 2 #5 */ lit(); if (M.xp || M.amen) fitLit(); setTimeout(xbShow, 60); }   /* closing a card: back to the map you left, the experience's places lit, the sheet half open and the pick in view (review Nov 22 #1) */   /* closing a card: back to the experience's places, lit */
    settleSheet(); dedupe(); shape(); backMap(); setTimeout(railArrows, 600);
    var full = $('[data-pl="full"]', M.el); if (full) full.hidden = !M.cur && !M.amen && !(M.s > startView()[0] * 1.15);
    moreCue();
  }
  /* desktop scroll cue (Zale, Nov 20): the bottom of the panel fades out while more of the page is below; it clears at the end. Static, no icon. */
  function moreEl() {
    var b = document.getElementById('pkpl-more');
    if (b && b.isConnected) return b;
    b = document.createElement('div'); b.id = 'pkpl-more'; b.setAttribute('aria-hidden', 'true');
    document.body.appendChild(b);
    return b;
  }
  function moreScroller() {   /* the panel scroller on desktop, or the window when the page itself scrolls */
    var d = document.getElementById('pk-scroll-desk');
    if (d && d.scrollHeight > d.clientHeight + 4) return d;
    return document.scrollingElement || document.documentElement;
  }
  function moreCue() {
    if (!moreCue._on) { moreCue._on = 1; document.addEventListener('scroll', moreCue, true); window.addEventListener('resize', moreCue); }
    var on = document.body.classList.contains('pkpl-wide') && document.body.classList.contains('pkpl-hood');
    var b = on ? moreEl() : document.getElementById('pkpl-more');
    if (!b) return;
    var el = on ? moreScroller() : null;
    b.classList.toggle('pkpl-more-on', !!el && el.scrollTop + el.clientHeight < el.scrollHeight - 24);
  }
  function railArrows() {   /* round 3: on desktop every sideways rail on a neighborhood page gets ‹ › arrows, since a mouse can't swipe */
    if (!wide() || top().r !== 'hood') return;
    var root = document.getElementById('pk-scroll-desk') || document.getElementById('root'); if (!root) return;
    $$('#pkpl-top .pkpl-vr, #pkpl-top .pkpl-at, section.pk-hd-w *', root).forEach(function (r) {
      if (r._ra || r.scrollWidth <= r.clientWidth + 20) return; var cs = getComputedStyle(r); if (!/(auto|scroll)/.test(cs.overflowX)) return;
      r._ra = 1; var par = r.parentElement; par.classList.add('pkpl-rail');
      var mk = function (dir) { var b = document.createElement('button'); b.type = 'button'; b.className = 'pkpl-rarr ' + dir; b.setAttribute('aria-label', dir === 'l' ? 'Scroll back' : 'Scroll on'); b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (dir === 'l' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7') + '"/></svg>'; b.addEventListener('click', function (e) { e.stopPropagation(); r.scrollBy({ left: (dir === 'l' ? -1 : 1) * r.clientWidth * 0.8, behavior: calm() ? 'auto' : 'smooth' }); }); par.appendChild(b); return b; };
      var bl = mk('l'), br = mk('r'), upd = function () { bl.hidden = r.scrollLeft < 8; br.hidden = r.scrollLeft + r.clientWidth >= r.scrollWidth - 8; var t = r.offsetTop + r.offsetHeight / 2; bl.style.top = br.style.top = t + 'px'; };
      r.addEventListener('scroll', upd, { passive: true }); upd();
    });
  }
  function shape() {   /* one clean page (Zale, Nov 19): fold the page's long description into the card with Read more, drop the duplicate video and summer boxes, credits into the story, walk times into the map card */
    if (top().r !== 'hood') return; var w = document.querySelector('#root section.pk-hd-w'), card = document.getElementById('pkpl-top'); if (!w || !card) return;
    var tgt = card.querySelector('.pkpl-cred'), who = w.querySelector('.pk-hd-who');
    if (tgt && who && !tgt.firstChild) { var cr = who.querySelector('.pk-hd-creds'), bt = who.querySelector('.pk-hd-pitch .pk-cta');
      if (cr) { var lb = document.createElement('p'); lb.className = 'pkpl-sk'; lb.textContent = 'Who built it'; tgt.appendChild(lb); tgt.appendChild(cr.cloneNode(true)); }
      var cnl = (DSW && HKW && hkey(data().hoods[top().h]) && (WCN[top().h] || '')) || ''; if (cnl) { var cp = document.createElement('p'); cp.className = 'pkpl-cnl'; cp.textContent = cnl; tgt.appendChild(cp); }
      if (bt) { var b2 = bt.cloneNode(true); b2.className = 'pk-cta sec pkpl-bw'; b2.addEventListener('click', function () { bt.click(); }); tgt.appendChild(b2); } }
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
    var lk = w.querySelector('.pk-hd-links'); if (lk) { var l2 = lk.cloneNode(true); l2.className = 'pk-hd-links pkpl-walk'; l2.querySelectorAll('button').forEach(function (x, i) { var src = lk.querySelectorAll('button')[i]; x.addEventListener('click', function () { src.click(); }); }); d.appendChild(l2); }
    anchor.parentNode.insertBefore(d, anchor.nextSibling);
  }
  function dedupe() { var d = document.querySelector('.pk-hd-desc0'), h = data().hoods[top().h || ''] || {}; if (d) d.classList.toggle('pkpl-dup', !!hookOf(h) && fold(d.textContent).trim() === fold(hookOf(h)).trim()); }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-pk]') : null; if (!b || !b.closest('#pkpl-top')) return;
    var a = b.getAttribute('data-pk');
    if (a === 'step') { var ce0 = cardEl(); KEEPFOLD = !wide() && !!(ce0 && ce0.classList.contains('pkpl-folded')); FROM = null; if (TOP.xp && TOP.xp !== 'Architecture' && M) M.xp = TOP.xp; go('hood', { h: b.getAttribute('data-to') }); return; }   /* the arrows keep the experience: next Wellness place, and so on */
    if (a === 'dot') { var hero = b.closest('.pkpl-hero'); clearTimeout(TOP.timer); heroShow(hero, +b.getAttribute('data-i')); return; }
    if (a === 'day') { TOP.day = b.getAttribute('data-d'); TOP.all = false; drawTop(); return; }
    if (a === 'whole') { TOP.all = !TOP.all; drawTop(); return; }
    if (a === 'up') { go('hoods'); return; }
    if (a === 'rm') { var mo = b.closest('.pkpl-more'), o = mo.classList.toggle('open'); b.textContent = o ? 'Show less' : 'Keep reading'; b.setAttribute('aria-expanded', o); return; }
    if (a === 'vid') { var L = VPK[b.getAttribute('data-vk')] || [], i0 = +b.getAttribute('data-i') || 0, Q = L.slice(i0).concat(L.slice(0, i0)).map(function (v) { return { u: vidU(v), c: v.a + ' · Pickathon ' + v.y }; });
      if (Q.length > 1 && window.__pkRadio) window.__pkRadio(Q, ''); else if (Q[0] && window.__pkPlayVid) window.__pkPlayVid(Q[0].u, Q[0].c); return; }   /* tap one: the five play in a row */
    if (a === 'vall') { go('watch', { hood: b.getAttribute('data-h') }); return; }
    if (a === 'dgrab') {   /* Zale, Nov 22: on desktop the neighborhood card rises over the experiences; the handle covers or shows them */
      var sh = $('#pkpl-top .pkpl-sheet'), gx = $('#pkpl-top .pkpl-hxr'); if (!sh || !gx) return;
      var gb = gx.getBoundingClientRect(), st = sh.getBoundingClientRect(), covered = st.top < gb.bottom - 8;
      window.scrollBy({ top: covered ? -(gb.bottom - st.top) : (st.top - gb.top), behavior: calm() ? 'auto' : 'smooth' }); return; }
    if (a === 'act') { go('act', { n: b.getAttribute('data-n'), y: b.getAttribute('data-y') || '' }); return; }   /* the video row's names lead to the artist page */
    if (a === 'xprow') { xpPick(b.getAttribute('data-e')); return; }   /* same rule as the phone row: to the map with that experience lit */
    if (a === 'xp') { TOP.xp = b.getAttribute('data-e'); TOP.all = false; if (M) { M.xp = TOP.xp; lit(); } var sc = scroller(); drawTop(); xbDraw(); var sh = $('#pkpl-top .pkpl-sheet'); if (sh) sh.scrollTop = 0; if (wide()) { var msc = moreScroller(); if (msc) msc.scrollTop = 0; } shape(); return; }   /* round 3: the switch is seen (back to the photo), credits stay */   /* Zale, Nov 22: switching here also switches the row and the map */
  }
  /* sideways swipe on the sheet steps to the next place (phone, tablet; a mouse drag on desktop) */
  (function swipe() {
    var s = null;
    document.addEventListener('pointerdown', function (e) { var t = e.target.closest && e.target.closest('#pkpl-top .pkpl-hero'); s = t ? { x: e.clientX, y: e.clientY, t: Date.now() } : null; }, true);
    document.addEventListener('pointerup', function (e) { if (!s) return; var dx = e.clientX - s.x, dy = e.clientY - s.y, dt = Date.now() - s.t; s = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 700) { var k = top().h, L = ids(), j = L.indexOf(k); if (j < 0) return; FROM = null; go('hood', { h: L[(j + (dx < 0 ? 1 : -1) + L.length) % L.length] }); } }, true);
  })();
  /* the phone card: the bar is the handle; drag it down to fold, up to open, or tap it to flip */
  function cardEl() { return document.getElementById('pkpl-top'); }
  function foldY() { var c = cardEl(), b = c ? parseFloat(getComputedStyle(c).bottom) || 0 : 0; return sheetOpen() - 56 + (V2 && !wide() ? 0 : b); }   /* Nov 22: on phone the folded bar sits right above the experience row, which stays above the nav */   /* folded: only the bar with the logo and name shows above the tab bar (Zale, Nov 21) */
  var KEEPFOLD = false;
  function setFold(f) { var el = cardEl(); if (!el) return; el.classList.add('pkpl-anim'); el.classList.toggle('pkpl-folded', !!f); el.style.setProperty('--pkpl-y', (f ? foldY() : 0) + 'px'); document.documentElement.style.setProperty('--pkpl-y', (f ? foldY() : 0) + 'px');   /* the chip row above the sheet follows it */ if (M.cur && !wide()) setTimeout(function () { if (M.cur) recenter(); }, 420); setTimeout(chipsAboveFold, 360);   /* after the sheet has finished sliding, so the strip above it is measured at rest */   /* the map re-centers on the selected place in the strip that shows */ var b = el.querySelector('.pkpl-bar'); if (b) b.setAttribute('aria-expanded', String(!f)); }
  (function sheetDrag() {
    /* Nov 20 (Zale): the bar is a handle. Three rests: full frame (pulled up past open), open (the default: a little map above), and folded (a thin bar). A pull down of about 30% of the travel folds it; a pull up past half the map strip takes the whole frame. */
    var st = null;
    var onBar = function (t) { return t && t.closest && t.closest('#pkpl-top .pkpl-bar'); };
    var gapOf = function () { var sc = scroller(), c = cardEl(); if (!sc || !c) return 0; return Math.max(0, Math.round(c.getBoundingClientRect().top - sc.getBoundingClientRect().top)); };
    var yNow = function (el) { return parseFloat(el.style.getPropertyValue('--pkpl-y')) || 0; };
    var setY = function (el, y) { el.style.setProperty('--pkpl-y', y + 'px'); document.documentElement.style.setProperty('--pkpl-y', y + 'px'); };
    document.addEventListener('pointerdown', function (e) { if (wide() || !onBar(e.target) || e.target.closest('.pkpl-bst')) return; var el = cardEl(); if (!el) return; st = { x: e.clientX, y: e.clientY, base: yNow(el), gap: gapOf(), moved: false }; el.classList.remove('pkpl-anim'); try { e.target.closest('.pkpl-bar').setPointerCapture(e.pointerId); } catch (x) {} }, true);
    document.addEventListener('pointermove', function (e) { if (!st) return; var dy = e.clientY - st.y; if (Math.abs(e.clientX - st.x) > Math.abs(dy) * 1.5 && Math.abs(e.clientX - st.x) > 10) return; if (Math.abs(dy) > 6) st.moved = true; if (!st.moved) return; var lo = -st.gap, hi = foldY(); setY(cardEl(), Math.min(hi, Math.max(lo, st.base + dy))); }, true);
    var end = function (e) { if (!st) return; var s = st; st = null; var el = cardEl(); if (!el) return;
      var dx9 = e && e.clientX != null ? e.clientX - s.x : 0, dy9 = e && e.clientY != null ? e.clientY - s.y : 0;
      if (Math.abs(dx9) > 44 && Math.abs(dx9) > Math.abs(dy9) * 1.5) { var bs = el.querySelector('.pkpl-bst.' + (dx9 < 0 ? 'r' : 'l')); setY(el, s.base); el.classList.add('pkpl-anim'); if (bs) bs.click(); return; }   /* Zale, Nov 22: swipe the bar sideways for the next or previous place */
      if (!s.moved) { setFold(!el.classList.contains('pkpl-folded')); return; } var y = yNow(el), f = foldY(), dir = y - s.base, t, folded = false; if (dir < -20) { t = y < -s.gap / 2 ? -s.gap : 0; } else if (dir > 20) { if (y > f * 0.3) { t = f; folded = true; } else { t = Math.max(0, s.base); } } else { t = s.base; folded = s.base >= f - 1; } el.classList.add('pkpl-anim'); el.classList.toggle('pkpl-folded', folded); var b = el.querySelector('.pkpl-bar'); if (b) b.setAttribute('aria-expanded', String(!folded)); setY(el, t); if (M.cur && !wide()) setTimeout(function () { if (M.cur) recenter(); }, 420); setTimeout(chipsAboveFold, 360);   /* after the sheet has finished sliding, so the strip above it is measured at rest */ };
    document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
    /* Nov 21 (Zale): the sheet follows a swipe on its content, not only the bar. Swipe up: it grows to the full frame first, then the story scrolls. At the top of the story, swipe down: it slides back to open, and on down to the folded bar. */
    var tc = null;
    var inSheet = function (t) { return t && t.closest && t.closest('#pkpl-top .pkpl-sheet') && !onBar(t); };
    document.addEventListener('touchstart', function (e) { if (wide() || !inSheet(e.target) || e.touches.length !== 1) { tc = null; return; } var el = cardEl(), sh = document.querySelector('#pkpl-top .pkpl-sheet'); if (!el || !sh) return; tc = { y: e.touches[0].clientY, base: yNow(el), gap: gapOf(), sh: sh, mode: null }; }, { capture: true, passive: true });
    document.addEventListener('touchmove', function (e) { if (!tc) return; var el = cardEl(); if (!el) return; var dy = e.touches[0].clientY - tc.y;
      if (!tc.mode) { if (Math.abs(dy) < 6) return; var full = tc.base <= -tc.gap + 1; tc.mode = (dy < 0 && !full) || (dy > 0 && tc.sh.scrollTop <= 0) ? 'sheet' : 'scroll'; if (tc.mode === 'sheet') { el.classList.remove('pkpl-anim'); tc.y = e.touches[0].clientY; dy = 0; } }
      if (tc.mode !== 'sheet') return; e.preventDefault(); setY(el, Math.min(foldY(), Math.max(-tc.gap, tc.base + dy))); }, { capture: true, passive: false });
    var tend = function () { if (!tc) return; var s = tc; tc = null; if (s.mode !== 'sheet') return; var el = cardEl(); if (!el) return; var y = yNow(el), f = foldY(), dir = y - s.base, t, folded = false;
      if (dir < -20) t = y < -s.gap / 2 || s.base >= -1 ? -s.gap : 0; else if (dir > 20) { if (s.base < -1) t = (y > f * 0.3) ? f : 0; else t = f; folded = t === f; } else { t = s.base; folded = s.base >= f - 1; }
      el.classList.add('pkpl-anim'); el.classList.toggle('pkpl-folded', folded); var b = el.querySelector('.pkpl-bar'); if (b) b.setAttribute('aria-expanded', String(!folded)); setY(el, t);
      if (M.cur && !wide()) setTimeout(function () { if (M.cur) recenter(); }, 420); setTimeout(chipsAboveFold, 360); };
    document.addEventListener('touchend', tend, true); document.addEventListener('touchcancel', tend, true);
    document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && onBar(e.target) && !wide()) { e.preventDefault(); var el = cardEl(); setFold(!el.classList.contains('pkpl-folded')); } }, true);
  })();
  /* Nov 20 (Zale): the fade at the sheet's bottom shows only while more text is below */
  function moreCheck() { var sh = document.querySelector('#pkpl-top .pkpl-sheet'), t = cardEl(); if (!t) return; var more = !!sh && sh.scrollTop + sh.clientHeight < sh.scrollHeight - 8; t.classList.toggle('pkpl-more', more); }
  document.addEventListener('scroll', function (e) { if (e.target && e.target.classList && e.target.classList.contains('pkpl-sheet')) moreCheck(); }, true);
  function sync() { try { mount(); moreCheck(); } catch (e) { if (window.console) console.error('pk-places', e); } }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); sync(); return r; };
  document.addEventListener('click', onClick);
  window.addEventListener('resize', function () { sheetVars(); if (M) { layout(); } sync(); });
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { sheetVars(); layout(); }); var watch = function () { var sc = scroller(); if (sc && sc !== watch._on) { if (watch._on) ro.unobserve(watch._on); ro.observe(sc); watch._on = sc; } if (M && !M._ro) { M._ro = 1; ro.observe(M.el); } }; var mount0 = mount; mount = function () { mount0(); watch(); }; }
  window.__pkPlaces = { map: function () { return M; }, open: open, home: function () { if (M) home(); } };
  sync();
})();
