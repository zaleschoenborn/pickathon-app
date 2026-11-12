/* pk-route: every page has its own web address (Round 3 C1, Nov 12 2026). Source: tools/round3_c/route.js, spliced by tools/round3_c/splice.py.
   The app keeps its own page stack; this file turns a stack entry into a hash route and back, so a link or a reload lands on that page,
   and the browser's Back and Forward walk the same pages the app's own Back does.
     #/                          Home
     #/2017                      the 2017 year page (any year 1999-2026; #/2027 and #/lineup are the 2027 Lineup)
     #/2017/artist/big-thief     an artist's page inside that year (past acts)
     #/artist/<id>               a 2027 artist
     #/hood/cherry-hill          a neighborhood today;  #/2024/hood/cherry-hill  the same place in 2024 (the Time Machine follows)
     #/archive/discoveries | legends | deep-cuts      the "Wait, they played here?" archive
     #/tickets  #/plan  #/neighborhoods  #/schedule  #/mine  #/2017/mine  #/stories  #/story/<id>  #/page/<slug>  and the other app pages by name
   The old share links (?y=2017, #top3=, #picks=, #at=, #tickets) still work: only hashes that start with "#/" are routes.
   The app calls pkRoute from go(), back(), reset(), the popstate listener and once per render (sync), and nowhere else. */
(function () {
  'use strict';
  var ARCH = { disc: 'discoveries', leg: 'legends', deep: 'deep-cuts' }, ARCH2 = { discoveries: 'disc', legends: 'leg', 'deep-cuts': 'deep' };
  var NAMED = { info: 'plan', hoods: 'neighborhoods' }, NAMED2 = { plan: 'info', neighborhoods: 'hoods', map: 'hoods', places: 'hoods', why: 'home', home: 'home' };
  var PLAIN = ['tickets', 'schedule', 'mine', 'stories', 'search', 'watch', 'partners', 'account', 'build', 'press', 'about', 'presents', 'lineup'];
  function slug(s) { return String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/['’‘`".]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function yr(v) { return String(v == null ? '' : v).replace(/[–—]/g, '-'); }
  function yrIn(v) { return String(v || '').replace(/-/g, '–'); }
  function isY(v) { return /^(19|20)\d\d(-(19|20)\d\d)?$/.test(String(v || '')); }
  function data() { var A = window.comp || window.__pkApp; return (A && A.state && A.state.data) || null; }

  /* one stack entry -> its hash. Entries carry what they need (go() stamps y on year pages, arch on the archive, _tm on artist and place pages). */
  function hashOf(e) {
    if (!e || !e.r) return '#/';
    var r = e.r, d = data();
    if (r === 'home' || r === 'why' || r === 'map') return '#/';
    if (r === 'past') return isY(yr(e.y)) ? '#/' + yr(e.y) : '#/lineup';
    if (r === 'lineup') return e.arch && ARCH[e.arch] ? '#/archive/' + ARCH[e.arch] : '#/lineup';
    if (r === 'act') { var y = yr(e.y || e._tm || ''); return (isY(y) ? '#/' + y : '#') + '/artist/' + slug(e.n); }
    if (r === 'artist') return '#/artist/' + encodeURIComponent(e.a || '');
    if (r === 'hood') { var H = d && d.hoods && d.hoods[e.h], hy = String(e.y || e._tm || ''); return (/^\d{4}$/.test(hy) && +hy < 2027 ? '#/' + hy : '#') + '/hood/' + (H ? slug(H.n) : slug(e.h)); }
    if (r === 'mine') return (/^\d{4}$/.test(String(e.y || '')) ? '#/' + e.y : '#') + '/mine';
    if (r === 'story') return '#/story/' + encodeURIComponent(e.s == null ? '' : e.s);
    if (r === 'page') return '#/page/' + encodeURIComponent(e.p || '');
    return '#/' + (NAMED[r] || r);
  }
  /* a hash -> { r, x } for go(r, x), or null when it is not a route */
  function fromHash(h, d) {
    h = String(h || ''); if (h.indexOf('#/') !== 0) return null;
    var P = h.slice(2).split('?')[0].split('/').filter(Boolean).map(function (p) { try { return decodeURIComponent(p); } catch (e) { return p; } }); d = d || data() || {};
    if (!P.length) return { r: 'home', x: {} };
    var y = '';
    if (isY(P[0])) { y = yrIn(P.shift()); if (!P.length) return y === '2027' ? { r: 'lineup', x: {} } : { r: 'past', x: { y: y } }; }
    var k = P[0], v = P.slice(1).join('/');
    if (k === 'artist' && v) {
      if (!y && d.artists && d.artists[v]) return { r: 'artist', x: { a: v } };
      return { r: 'act', x: y ? { n: actName(d, y, v), y: y } : { n: actName(d, '', v) } };
    }
    if ((k === 'hood' || k === 'neighborhood') && v) { var id = hoodId(d, v); if (!id) return { r: 'hoods', x: {} }; return { r: 'hood', x: y && +y < 2027 ? { h: id, y: y } : { h: id, tm0: 1 } }; }
    if (k === 'archive') { var a = ARCH2[v] || 'disc'; return { r: 'lineup', x: { keepArch: true, arch: a } }; }
    if (k === 'mine') return { r: 'mine', x: y && /^\d{4}$/.test(y) ? { y: y } : {} };
    if (k === 'story' && v) return { r: 'story', x: { s: /^\d+$/.test(v) ? +v : v } };
    if (k === 'page' && v) return { r: 'page', x: { p: v } };
    if (NAMED2[k]) return { r: NAMED2[k], x: {} };
    if (PLAIN.indexOf(k) >= 0) return { r: k, x: {} };
    return { r: 'home', x: {} };
  }
  function actName(d, y, s) {
    var hit = '';
    var look = function (n) { if (!hit && n && slug(n) === s) hit = n; };
    if (y) ((d.yearBill || {})[y] || []).forEach(function (a) { look(a.n); });
    (d.archCT || []).forEach(function (a) { if (!y || (a.ys || []).map(String).indexOf(String(y)) >= 0) look(a.n); });
    if (!hit) ((d.past && d.past.deep) || []).forEach(function (a) { look(a.n); });
    if (!hit && y) Object.keys(d.yearBill || {}).forEach(function (k) { (d.yearBill[k] || []).forEach(function (a) { look(a.n); }); });
    return hit || s.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
  }
  function hoodId(d, s) { var H = d.hoods || {}; if (H[s]) return s; var id = ''; Object.keys(H).forEach(function (k) { if (!id && (slug(H[k].n) === s || slug(k) === s)) id = k; }); return id; }
  function clean(e) { var o = {}; Object.keys(e || {}).forEach(function (k) { var v = e[k]; if (k === 'sy' || k === 'tm' || typeof v === 'function' || (v && typeof v === 'object')) return; o[k] = v; }); return o; }
  function base() { try { return window.location.pathname + window.location.search; } catch (e) { return ''; } }
  function hstate(n, e) { return { pk: n, e: clean(e), h: hashOf(e) }; }

  /* the app's hooks */
  function push(A, stack, replace) {   // called by go() BEFORE the render, so the render's sync() sees the new address
    try { var e = stack[stack.length - 1], st = hstate(stack.length, e); if (replace) history.replaceState(st, '', base() + st.h); else history.pushState(st, '', base() + st.h); } catch (x) {}
  }
  /* once per render, a tick later (a setState followed by go() must finish first): the top entry keeps what the page now shows
     (a year page's year, the archive's group) and the address follows */
  var syncT = 0;
  function sync(A) { if (syncT) return; syncT = setTimeout(function () { syncT = 0; sync0(A); }, 0); }
  function sync0(A) {
    try {
      if (!A || !A._pkBooted || A._skipPop || A._routing) return; var S = A.state, s = S && S.stack, e = s && s[s.length - 1]; if (!e || !S.data) return;
      if (e.r === 'past' && S.pastY) e.y = String(S.pastY);
      if (e.r === 'lineup') { if (S.luArch && ARCH[S.luYear]) e.arch = S.luYear; else delete e.arch; }
      var hs = history.state || {}; if (hs.co) return;   // Checkout's own history entry
      var h = hashOf(e), cur = window.location.hash || '';
      /* the first Home keeps a clean address; an old share link (#top3=, #picks=, #at=, #tickets) stays put until the visitor moves on */
      var keepUrl = cur === h || (cur === '' && h === '#/') || (!!cur && cur.indexOf('#/') !== 0);
      if (keepUrl && hs.e && hs.h === h) return;
      history.replaceState(hstate(hs.pk || s.length, e), '', keepUrl ? window.location.href : base() + h);
    } catch (x) {}
  }
  function same(a, b) { return hashOf(a) === hashOf(b); }
  /* the browser's Back or Forward, or a typed address */
  function onPop(A, ev) {
    var S = ev.state || {}; if (S.co) return;
    var st = A.state.stack, top = st[st.length - 1];
    if (!S.e) {   // an address typed by hand (or an entry from before this build): go there as a new page
      var R = fromHash(window.location.hash, A.state.data); if (!R) return;
      A._routing = 1; try { A.go(R.r, R.x, false, true); } finally { A._routing = 0; }
      try { history.replaceState(hstate(A.state.stack.length, A.state.stack[A.state.stack.length - 1]), '', base() + window.location.hash); } catch (x) {}
      return;
    }
    if (S.h === hashOf(top)) return;
    if (st.length > 1 && S.h === hashOf(st[st.length - 2])) { A.back(true); return; }
    var keep = Math.max(1, Math.min(st.length, S.pk || 1)), e = S.e, x = {};
    Object.keys(e).forEach(function (k) { if (k !== 'r') x[k] = e[k]; });
    A.state.stack = st.slice(0, keep);
    A._routing = 1; try { A.go(e.r, x, true, true); } finally { A._routing = 0; }
  }
  /* first load: a route in the address wins over the default Home */
  function boot(A, d) {
    A._pkBooted = 1; var R = fromHash(window.location.hash, d); if (!R) return false;
    A._routing = 1; try { A.go(R.r, R.x, true, true); } finally { A._routing = 0; }
    try { history.replaceState(hstate(A.state.stack.length, A.state.stack[A.state.stack.length - 1]), '', base() + hashOf(A.state.stack[A.state.stack.length - 1])); } catch (x) {}
    return true;
  }
  /* the page's own link, for Share: never a video, only the address of the page */
  function link() { try { var A = window.comp || window.__pkApp, s = A.state.stack, h = hashOf(s[s.length - 1]); return window.location.origin + window.location.pathname + h; } catch (e) { return window.location.href.split('#')[0]; } }
  window.pkRoute = { slug: slug, hashOf: hashOf, fromHash: fromHash, push: push, sync: sync, same: same, onPop: onPop, boot: boot, link: link, hoodId: hoodId };
})();
