/* pk-way: the way-finder (Nov 19 design plan, question 6; plan: flow/wayfinder/plan.md).
   One short row of outline pills under the title of every year, neighborhood and artist page,
   linking to the years and places that page touches. Year pills open the year page; place pills open
   the neighborhood as it was that year (the Time Machine follows). Built from data only:
   pastSched + actSets (who played where, when), yearBill + archCT (which years an act played), hoods (names, kinds, emblems). */
(function () {
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var nk = function (x) { return String(x || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/^the\s+/, '').replace(/[^a-z0-9]/g, ''); };
  var app = function () { return window.__pkApp || null; };
  var IDX = null, IDXd = null, lastKey = '';

  /* ---------- indexes, built once per data object ---------- */
  function index(d) {
    if (IDXd === d && IDX) return IDX;
    var AL = d.actAlias || {}, HO = d.hoods || {}, ORDER = Object.keys(HO);
    var key = function (x) { var k = nk(x); k = AL[k] || k; k = k.replace(/^dj(?=[a-z]{4})/, '').replace(/^the(?=[a-z]{4})/, ''); return AL[k] || k; };
    var byYear = {}, hoodYears = {}, actPlaces = {};   // byYear[y][h] = {n: sets, names: {stage name: sets}}; actPlaces[y][actKey] = [h, stage name]...
    var add = function (y, r) {   // r = [day, time, stage name, hood id, act]
      var h = r[3]; if (!h || !HO[h]) return;
      var Y = byYear[y] = byYear[y] || {}, P = Y[h] = Y[h] || { n: 0, names: {} };
      P.n++; if (r[2]) P.names[r[2]] = (P.names[r[2]] || 0) + 1;
      (hoodYears[h] = hoodYears[h] || {})[y] = 1;
      var A = actPlaces[y] = actPlaces[y] || {}, k = key(r[4]), L = A[k] = A[k] || [];
      if (!L.some(function (q) { return q[0] === h; })) L.push([h, r[2] || '']);
    };
    var PS = d.pastSched || {}; Object.keys(PS).forEach(function (y) { (PS[y] || []).forEach(function (r) { add(y, r); }); });
    var AS = d.actSets || {}; Object.keys(AS).forEach(function (y) { var Y = AS[y] || {}; Object.keys(Y).forEach(function (k) { (Y[k] || []).forEach(function (r) { var seen = ((actPlaces[y] || {})[key(k)] || []).some(function (q) { return q[0] === r[3]; }); if (!seen && r[3] && HO[r[3]]) { var A = actPlaces[y] = actPlaces[y] || {}; (A[key(k)] = A[key(k)] || []).push([r[3], r[2] || '']); } }); }); });
    var actYears = {};   // actKey -> {y:1}; "Sunday Valley (Sturgill Simpson)" counts for both names, "Bad Livers (reunion)" for Bad Livers
    var addY = function (n, y) { var m = String(n).match(/^(.*?)\s*\((.*)\)\s*$/), ks = m ? [key(m[1]), key(m[2])] : [key(n)]; ks.forEach(function (k) { if (k) (actYears[k] = actYears[k] || {})[y] = 1; }); };
    var YB = d.yearBill || {}; Object.keys(YB).forEach(function (y) { (YB[y] || []).forEach(function (a) { addY(a.n, y); }); });
    // the lineup (yearBill) is the source of truth for years; archCT only fills acts the bill doesn't name (17 archCT years disagree, e.g. the 2001->2002 moves)
    (d.archCT || []).forEach(function (a) { var m = String(a.n).match(/^(.*?)\s*\((.*)\)\s*$/), k = m ? key(m[1]) : key(a.n); if (actYears[k]) return; (a.ys || []).forEach(function (y) { addY(a.n, String(y)); }); });
    IDXd = d; IDX = { HO: HO, ORDER: ORDER, key: key, byYear: byYear, hoodYears: hoodYears, actPlaces: actPlaces, actYears: actYears };
    return IDX;
  }

  /* ---------- the stage name a place went by that year (Mt Hood Stage, Treeline Stage, Workshop Barn) ---------- */
  function placeName(I, h, names) {
    var hn = (I.HO[h] || {}).n || h, best = '', bn = 0;
    Object.keys(names || {}).forEach(function (s) { if (names[s] > bn) { bn = names[s]; best = s; } });
    if (!best || nk(best).indexOf(nk(hn)) >= 0 || nk(hn).indexOf(nk(best.replace(/\s*stage$/i, ''))) >= 0) return hn;
    return best;
  }
  var emb = function (h) { return '<img class="pk-way-e" src="ic2/' + esc(h) + '.png" alt="" aria-hidden="true" loading="lazy" decoding="async">'; };
  function yearPill(y, cur) { return '<button type="button" class="pk-way-c pk-way-y" data-way="y:' + y + '"' + (cur ? ' aria-current="page"' : '') + ' aria-label="Pickathon ' + y + ' lineup' + (cur ? ' (this year)' : '') + '">' + esc(y) + '</button>'; }
  function placePill(I, h, y, label) {
    var hn = (I.HO[h] || {}).n || h, now = label !== hn ? ', today ' + hn : '';
    return '<button type="button" class="pk-way-c pk-way-p" data-way="h:' + esc(h) + ':' + y + '" aria-label="' + esc(label + now + ', in ' + y) + '">' + emb(h) + '<span>' + esc(label) + '</span></button>';
  }
  function row(kick, pills, label) { return '<nav class="pk-way" aria-label="' + esc(label) + '">' + (kick ? '<p class="pk-way-k">' + esc(kick) + '</p>' : '') + '<div class="pk-way-r">' + pills + '</div></nav>'; }

  /* ---------- what each page shows ---------- */
  function forYear(I, y) {   // stage neighborhoods with sets that year, in the site's map order
    var Y = I.byYear[y]; if (!Y) return null;
    var hs = I.ORDER.filter(function (h) { return Y[h] && (I.HO[h] || {}).k === 'stage'; }); if (!hs.length) return null;
    return { key: 'y|' + y, html: row('Places that summer', hs.map(function (h) { return placePill(I, h, y, placeName(I, h, Y[h].names)); }).join(''), 'Places in ' + y) };
  }
  function forHood(I, h, cur) {   // every year with sets there, newest first
    var ys = Object.keys(I.hoodYears[h] || {}).sort(function (a, b) { return b - a; }); if (!ys.length) return null;
    var hn = (I.HO[h] || {}).n || h;
    return { key: 'h|' + h + '|' + cur, html: row('', ys.map(function (y) { return yearPill(y, y === cur); }).join(''), hn + ' by year').replace('class="pk-way"', 'class="pk-way pk-way-hd"') };
  }
  function forAct(I, n, y) {
    var k = I.key(n), ys = Object.keys(I.actYears[k] || {}); if (y && ys.indexOf(y) < 0) ys.push(y);
    ys.sort(function (a, b) { return a - b; }); if (!ys.length) return null;
    if (!y) y = ys[ys.length - 1];
    var pl = ((I.actPlaces[y] || {})[k] || []).slice().sort(function (p, q) { return I.ORDER.indexOf(p[0]) - I.ORDER.indexOf(q[0]); });
    var pills = ys.map(function (q) { return yearPill(q, q === y); }).join('');
    if (pl.length) pills += '<span class="pk-way-sep" aria-hidden="true"></span>' + pl.map(function (p) { var Y = (I.byYear[y] || {})[p[0]]; return placePill(I, p[0], y, placeName(I, p[0], Y ? Y.names : {})); }).join('');
    return { key: 'a|' + k + '|' + y, html: row(n + ' at Pickathon', pills, n + ': years and places') };
  }

  /* ---------- where it sits on each page ---------- */
  function spot(r) {
    var m = document.querySelector('#root main') || document.getElementById('root'); if (!m) return null;
    if (r === 'past') { var yb = m.querySelector('article > section.pk-yb'); return yb ? [yb.parentNode, yb.nextSibling] : null; }
    if (r === 'hood') { var yh = m.querySelector('section.pk-hd-w > .pk-hd-yh'); return yh ? [yh.parentNode, yh.nextSibling] : null; }   // under the "X, year by year" header
    if (r === 'act') { var s = m.querySelector('section.pk-act'); if (!s) return null; var a = s.querySelector(':scope > .pk-act-acts') || s.querySelector(':scope > .pk-act-l') || s.querySelector(':scope > .pk-act-h, :scope > .pk-ah'); return a ? [s, a.nextSibling] : null; }
    return null;
  }
  function want() {
    var A = app(); if (!A || !A.state) return null; var st = A.state, d = st.data; if (!d || !d.pastSched) return null;
    var S = st.stack || [], t = S[S.length - 1] || {}, I = index(d), y4 = function (v) { v = String(v || ''); return /^\d{4}$/.test(v) ? v : ''; };
    /* Round 3 ruling (art director, Nov 11): no row on year or artist pages. The year page's "Where it happened" and the
       artist page's "Where X played" read this file's data instead (window.__pkWay below). Neighborhood pages keep the
       year pills, moved into the "year by year" header. */
    if (t.r === 'hood' && t.h) return forHood(I, t.h, y4(st.hoodYear || st.tmY));
    return null;
  }
  var cur = null;   // the row element, kept so a re-render that drops it puts back the same node (scroll position and all)
  function sync() {
    if (cur && (!/^pk-way( pk-way-hd)?$/.test(cur.className) || !cur.querySelector('.pk-way-r'))) { cur = null; lastKey = ''; }   // never re-use a node the app has taken over
    var w = want(), old = document.querySelectorAll('#root .pk-way');
    if (!w) { for (var i = 0; i < old.length; i++) old[i].remove(); lastKey = ''; cur = null; return; }
    var r = ((app().state.stack || []).slice(-1)[0] || {}).r, at = spot(r); if (!at) return;
    var fresh = false;
    if (!cur || lastKey !== w.key) { var tmp = document.createElement('div'); tmp.innerHTML = w.html; cur = tmp.firstChild; lastKey = w.key; fresh = true; }
    for (var j = 0; j < old.length; j++) if (old[j] !== cur) old[j].remove();
    if (at[1] === cur) return;   // already in place: touch nothing
    if (cur.parentNode) { cur.remove(); at = spot(r); if (!at) return; }
    at[0].insertBefore(cur, at[1]);
    if (fresh) showCurrent(cur);
  }
  function showCurrent(n) {   // a new row that swipes starts with the current year in view (Woods in 2008: the 2008 pill, not 2026)
    var q = n.querySelector('.pk-way-r'), c = n.querySelector('[aria-current]'); if (!q || !c || q.scrollWidth <= q.clientWidth) return;
    var x = c.getBoundingClientRect().left - q.getBoundingClientRect().left + q.scrollLeft, to = Math.max(0, Math.round(x - (q.clientWidth - c.offsetWidth) / 2));
    if (to > 0) q.scrollLeft = to;
  }

  /* ---------- data for the app's own sections ---------- */
  window.__pkWay = {
    // years an act played (yearBill + archCT, aliases and renamed acts merged), oldest first
    actYears: function (d, n) { var I = index(d); return Object.keys(I.actYears[I.key(n)] || {}).sort(); },
    // places with sets in a year: [{h, n: stage name that year, sets}], in map order
    places: function (d, y) { var I = index(d), Y = I.byYear[String(y)] || {}; return I.ORDER.filter(function (h) { return Y[h]; }).map(function (h) { return { h: h, n: placeName(I, h, Y[h].names), sets: Y[h].n }; }); },
    key: function (d, n) { return index(d).key(n); }
  };

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.pk-way [data-way]'); if (!b || !window.__pkGo) return;
    e.preventDefault(); var p = b.getAttribute('data-way').split(':');
    if (p[0] === 'y') window.__pkGo('past', { y: p[1] });
    else if (p[0] === 'h') window.__pkGo('hood', { h: p[1], y: p[2] });
  });

  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () {
    var a = document.activeElement, fk = a && a.closest && a.closest('#root .pk-way') ? a.getAttribute('data-way') : '';
    var q = cur && cur.querySelector('.pk-way-r'), sl = q ? q.scrollLeft : 0, k0 = lastKey;
    var r = render0.apply(this, arguments);
    try { sync(); if (cur) { var q2 = cur.querySelector('.pk-way-r'); if (q2 && sl && lastKey === k0 && q2.scrollLeft !== sl) q2.scrollLeft = sl; if (fk && document.activeElement !== cur.querySelector('[data-way="' + fk + '"]')) { var f = cur.querySelector('[data-way="' + fk + '"]'); if (f) f.focus({ preventScroll: true }); } } } catch (e) { if (window.console) console.error('pk-way', e); }
    return r; };
  try { sync(); } catch (e) {}
})();
