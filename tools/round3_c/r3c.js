/* pk-r3c: Round 3 batch C (Nov 12 2026). Source: tools/round3_c/r3c.js, spliced by tools/round3_c/splice.py.
   1. Share (C1): one control on year, artist and neighborhood pages. The phone's own share sheet when there is one, else the link is copied.
      It shares only the page's address (pkRoute.link), never a video.
   2. The year wall (B8, design spec round3/fix_design/year_switcher_spec.md): every festival year as a small printed tile on its own poster
      paper and ink, four rows of seven, no scroll. Tap a year and stay on the same kind of page:
        year or Lineup page -> that year's page, at the top
        neighborhood page   -> that place in that year (a dot), or that summer's "Where it happened" (no dot); 2027 is the place today
        artist page         -> the top of that year's page, on every tile (Zale's rule)
        My Pickathon        -> that year's discoveries (#/YYYY/mine, with the year bar)
        Schedule            -> that year's "Who played when"; 2027 stays on the schedule
      Opened by the year in the Time Machine bar, and by "Another year" on the year and Lineup pages. It replaces "Pick another year" and the
      "Pick a year" sheet. Colors come only from yearBrand (paper, ink, ink2, stripe). Escape, X, the dim area and Back close it. */
(function () {
  'use strict';
  function app() { return window.comp || window.__pkApp || null; }
  function st() { var a = app(); return (a && a.state) || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var RM = false; try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- a short status line (Link copied; the wall's "no stage yet" note) ---------- */
  var toastEl = null, toastT = 0;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'pk-r3-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, ms || 2600);
  }

  /* ---------- 1. Share ---------- */
  function copy(u) {
    var done = function () { toast('Link copied'); };
    var old = function () { try { var t = document.createElement('textarea'); t.value = u; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(t); t.select(); var ok = document.execCommand('copy'); t.remove(); if (ok) done(); else toast(u, 6000); } catch (e) { toast(u, 6000); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).then(done, old); return; } } catch (e) {}
    old();
  }
  window.pkShare = function () {
    var u = window.pkRoute ? window.pkRoute.link() : window.location.href, t = String(document.title || 'Pickathon');
    try { if (navigator.share) { navigator.share({ title: t, url: u }).catch(function (er) { if (!er || er.name !== 'AbortError') copy(u); }); return; } } catch (e) {}
    copy(u);
  };

  /* ---------- 2. The year wall ---------- */
  var ROWS = [['Before the farm', '1999–2005', [1999, 2000, 2001, 2002, 2003, 2004, 2005]], ['Pendarvis Farm', '2006–2012', [2006, 2007, 2008, 2009, 2010, 2011, 2012]],
    ['Pendarvis Farm', '2013–2019', [2013, 2014, 2015, 2016, 2017, 2018, 2019]], ['Neighborhoods', '2022–2027', [0, 2022, 2023, 2024, 2025, 2026, 2027]]];
  var NOW = 2027;
  function brand(y) {
    var B = ((st().data || {}).yearBrand || {})[String(y)];
    if (y === NOW) return { p: '#2B2628', i: '#F2CF62', i2: '#F2EDE3', s: '' };
    if (!B || y === 1999) return { p: '#F2EDE3', i: '#2B2628', i2: '#7C6E4D', s: '' };   // 1999 is set in type only: cream paper, one ink, no stripe (ruling 5)
    var S = B.stripe || [];
    return { p: B.paper || '#F2EDE3', i: B.ink || '#2B2628', i2: B.ink2 || B.ink || '#2B2628', s: S.length === 4 ? 'linear-gradient(90deg,' + S[0] + ' 0 25%,' + S[1] + ' 0 50%,' + S[2] + ' 0 75%,' + S[3] + ' 0)' : '' };
  }
  /* what page the wall was opened from, and what each year means there */
  function context() {
    var S = st(), s = S.stack || [], top = s[s.length - 1] || { r: 'home' }, d = S.data || {}, W = window.__pkWay, tm = String(S.tmY || '');
    var c = { r: top.r, cur: NOW, marks: {}, legend: [], kick: 'The lineup', title: 'Jump to another year', foot: 'You land at the top of that year’s lineup. Each year wears its own poster paper and inks.' };
    if (top.r === 'past') c.cur = +String(S.pastY || top.y || '').slice(0, 4) || NOW;
    else if (top.r === 'act') {
      c.cur = +(top.y || tm) || NOW; c.n = top.n || ''; c.kick = c.n; c.title = 'Another year'; c.foot = 'You land at the top of that year’s lineup.';
      try { (W ? W.actYears(d, c.n) : []).forEach(function (y) { c.marks[+y] = 'on'; }); } catch (e) {}
      if (Object.keys(c.marks).length) c.legend.push(['on', c.n + ' played']);
    } else if (top.r === 'hood') {
      var H = (d.hoods || {})[top.h] || {}; c.h = top.h; c.hn = H.n || ''; c.cur = /^\d{4}$/.test(tm) && +tm < NOW ? +tm : NOW; c.kick = c.hn; c.title = 'In another year';
      c.foot = 'A year without a dot opens that summer’s map of where it happened.'; c.names = {};
      var older = {};
      ROWS.forEach(function (R) { R[2].forEach(function (y) { if (!y || y === NOW) return; try { var P = (W ? W.places(d, y) : []).filter(function (p) { return p.h === top.h; })[0]; if (!P) return; if (P.n && P.n !== c.hn) { var ok = P.n.toLowerCase().replace(/[^a-z]/g, ''); older[ok] = older[ok] || P.n; c.marks[y] = 'old'; c.names[y] = older[ok]; }   /* Tree Line Stage and Treeline Stage are one name */ else c.marks[y] = 'on'; } catch (e) {} }); });
      c.marks[NOW] = 'on';
      c.legend.push(['on', c.hn]); var ol = Object.keys(older).map(function (k) { return older[k]; }); if (ol.length) c.legend.push(['old', 'Same ground: ' + ol.join(', ')]);
    } else if (top.r === 'mine') {
      c.cur = +top.y || NOW; c.kick = 'Your Pickathon'; c.title = 'Another year'; c.foot = 'Each year opens your discoveries from that summer.';
      (S.myYears || []).forEach(function (y) { c.marks[+String(y).slice(0, 4)] = 'on'; }); if (Object.keys(c.marks).length) c.legend.push(['on', 'Years you came']);
    } else if (top.r === 'schedule') { c.kick = 'The schedule'; c.title = 'Another year'; c.foot = 'You land on that year’s weekend, hour by hour (“Who played when”), where its schedule survives.'; }   /* Gate 1 fix 15 (Q6): it does land there; the sentence now says so, and says what happens for the early years */   /* Round 3.5: Schedule's Pick a year */
    else if (top.r === 'lineup') c.cur = NOW;
    return c;
  }
  function tileLabel(c, y) {
    var t = 'Pickathon ' + y; if (y === c.cur) t += ', you’re here';
    if (c.r === 'hood') { if (c.marks[y] === 'on' && y !== NOW) t += ', ' + c.hn + ' was here'; else if (c.marks[y] === 'old') t += ', ' + c.names[y] + ', same ground'; }
    else if (c.r === 'act' && c.marks[y]) t += ', ' + c.n + ' played';
    else if (c.r === 'mine' && c.marks[y]) t += ', you came';
    return t;
  }
  function tile(c, y) {
    if (!y) return '<span class="pkw-none" aria-hidden="true">no festival 2020–21</span>';
    var B = brand(y), m = c.marks[y], cur = y === c.cur, Y = String(y);
    return '<button type="button" class="pkw-t' + (cur ? ' is-cur' : '') + (y === NOW ? ' is-now' : '') + '" data-y="' + y + '" style="--p:' + B.p + ';--i:' + B.i + ';--i2:' + B.i2 + (B.s ? ';--s:' + B.s : '') + '" aria-label="' + esc(tileLabel(c, y)) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
      '<span class="pkw-c" aria-hidden="true">' + Y.slice(0, 2) + '</span><span class="pkw-y pkp-head" aria-hidden="true">' + Y.slice(2) + '</span>' + (m ? '<i class="pkw-m pkw-' + m + '" aria-hidden="true"></i>' : '') + '</button>';
  }
  function html(c) {
    var lg = c.legend.map(function (l) { return '<span><i class="pkw-m pkw-' + l[0] + '" aria-hidden="true"></i>' + esc(l[1]) + '</span>'; }).join('') + (c.legend.length ? '<span><i class="pkw-here" aria-hidden="true"></i>You’re here</span>' : '');
    return '<div class="pkw-hd"><div><p class="pkw-k">' + esc(c.kick) + '</p><h2 class="pkw-h pkp-head" id="pkw-h">' + esc(c.title) + '</h2></div>' +
      '<button type="button" class="pkw-x" data-yw="x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>' +
      (lg ? '<p class="pkw-lg">' + lg + '</p>' : '') +
      '<div class="pkw-g" role="group" aria-labelledby="pkw-h">' + ROWS.map(function (R) { return '<div class="pkw-r"><p class="pkw-rl"><b>' + esc(R[0]) + '</b><span>' + esc(R[1]) + '</span></p><div class="pkw-rt">' + R[2].map(function (y) { return tile(c, y); }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<p class="pkw-f">' + esc(c.foot) + '</p>';
  }
  var scrim = null, panel = null, opener = null, C = null, pushed = false, pending = null, inerted = [];
  function wide() { return window.innerWidth >= 1200; }
  function place() {
    if (!panel) return;
    if (wide()) { var bar = document.querySelector('.pk-tm'), top = 0; if (bar && bar.getClientRects().length && getComputedStyle(bar).display !== 'none') top = bar.getBoundingClientRect().bottom; else { var h = document.querySelector('#root header'); top = h ? Math.max(0, h.getBoundingClientRect().bottom) : 0; } panel.style.setProperty('--ywtop', Math.round(top) + 'px'); scrim.style.setProperty('--ywtop', Math.round(top) + 'px'); }
  }
  function open(from) {
    if (panel) return; var A = app(); if (!A || !A.state || !A.state.data) return;
    opener = from || document.activeElement; C = context();
    scrim = document.createElement('div'); scrim.className = 'pkw-scrim'; scrim.setAttribute('data-yw', 'x');
    panel = document.createElement('div'); panel.className = 'pkw' + (wide() ? ' pkw-dk' : ' pkw-sh'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'pkw-h');
    panel.innerHTML = html(C);
    document.body.appendChild(scrim); document.body.appendChild(panel); place();
    [].slice.call(document.body.children).forEach(function (e) { if (e !== panel && e !== scrim && !e.hasAttribute('inert') && e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE') { e.setAttribute('inert', ''); inerted.push(e); } });
    document.documentElement.classList.add('pkw-on'); if (opener && opener.classList && opener.classList.contains('pk-tm-yr')) opener.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { if (panel) panel.classList.add('in'); if (scrim) scrim.classList.add('in'); });
    var f = panel.querySelector('.pkw-t.is-cur') || panel.querySelector('.pkw-t'); try { f.focus({ preventScroll: true }); } catch (e) {}
    try { var hs = history.state || {}; history.pushState(Object.assign({}, hs, { wall: 1 }), '', window.location.href); pushed = true; } catch (e) { pushed = false; }
  }
  function shut() {   // take it off the page; focus back to the year in the bar
    if (!panel) return; var p = panel, s = scrim; panel = null; scrim = null;
    inerted.forEach(function (e) { e.removeAttribute('inert'); }); inerted = [];
    document.documentElement.classList.remove('pkw-on');
    if (opener && opener.setAttribute && opener.classList.contains('pk-tm-yr')) opener.setAttribute('aria-expanded', 'false');
    if (RM) { p.remove(); s.remove(); } else { p.classList.remove('in'); s.classList.remove('in'); setTimeout(function () { p.remove(); s.remove(); }, 170); }
    var o = opener; opener = null; if (!pending && o && o.focus && document.contains(o)) { try { o.focus({ preventScroll: true }); } catch (e) {} }
  }
  function close(then) {   // X, Escape, the dim area, or a year: step back off the wall's history entry first, so Back after a jump is the page before
    pending = then || null;
    if (pushed && history.state && history.state.wall) { pushed = false; var t = setTimeout(function () { onPop(); }, 400); close._t = t; history.back(); return; }
    pushed = false; shut(); run();
  }
  function run() { var f = pending; pending = null; if (f) setTimeout(function () { try { f(); } catch (e) {} }, 0); }
  function onPop() { clearTimeout(close._t); if (!panel && !pending) return; pushed = false; shut(); run(); }
  window.addEventListener('popstate', function () { if (panel || pending) onPop(); });
  function pick(y) {
    var A = app(), c = C; if (!A || !c) return;
    var go = function (r, x) { return function () { A.go(r, x || {}); }; };
    if (c.r === 'hood') {
      if (y === c.cur && y !== NOW) return close();
      if (y === NOW) return close(go('hood', { h: c.h, tm0: 1 }));
      if (c.marks[y]) return close(function () { A.go('hood', { h: c.h, y: String(y) }); if (c.marks[y] === 'old') toast('In ' + y + ' this ground was the ' + c.names[y] + '.', 4200); });
      return close(function () { A.go('past', { y: String(y) }); var n = 0, find = function () { var e = document.querySelector('#root .pk-hy'); if (e) { e.scrollIntoView({ block: 'start' }); toast(c.hn + '’s ground wasn’t a stage yet in ' + y + '. Here’s where it happened that summer.', 5000); } else if (++n < 20) setTimeout(find, 150); }; setTimeout(find, 300); });
    }
    if (c.r === 'schedule') {   /* the same schedule section that year: the year page's "Who played when"; 2027 is this page */
      if (y === NOW) return close();
      return close(function () { A.go('past', { y: String(y) }); var n = 0, find = function () { var h = [].slice.call(document.querySelectorAll('#root h2')).filter(function (e) { return /who played when/i.test(e.textContent || ''); })[0]; if (h) { var bars = [].slice.call(document.querySelectorAll('#root header, .pk-tm')).map(function (b) { var r = b.getBoundingClientRect(); return r.height && r.top < 200 ? r.bottom : 0; }); h.style.scrollMarginTop = (Math.max.apply(null, bars.concat([0])) + 12) + 'px'; h.scrollIntoView({ block: 'start' }); } else if (++n < 20) setTimeout(find, 150); else toast('No hour-by-hour schedule survives from ' + y + '. Here’s that year’s lineup.', 5000); }; setTimeout(find, 300); });
    }
    if (c.r === 'mine') { if (y === c.cur && y !== NOW) return close(); return close(y === NOW ? go('mine', {}) : go('mine', { y: String(y) })); }
    if (y === c.cur && c.r !== 'act') return close();
    return close(y === NOW ? function () { A.state.tmY = ''; A.go('lineup'); } : go('past', { y: String(y) }));
  }
  document.addEventListener('click', function (e) {
    if (!panel) return; var t = e.target && e.target.closest ? e.target.closest('[data-yw],.pkw-t') : null; if (!t) return;
    if (t.classList.contains('pkw-t')) { e.preventDefault(); pick(+t.getAttribute('data-y')); return; }
    if (t.getAttribute('data-yw') === 'x') { e.preventDefault(); close(); }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (!panel) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    var T = [].slice.call(panel.querySelectorAll('.pkw-t')), i = T.indexOf(document.activeElement);
    if (i < 0 || !/^Arrow/.test(e.key)) return;
    e.preventDefault();
    /* the grid is 4 rows of 7 cells; the 2020-21 cell is a gap, so moves are by cell, skipping it */
    var cells = []; ROWS.forEach(function (R) { R[2].forEach(function (y) { cells.push(y); }); });
    var y0 = +T[i].getAttribute('data-y'), k = cells.indexOf(y0), step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key], n = k;
    do { n += step; } while (n >= 0 && n < cells.length && !cells[n]);
    if (n < 0 || n >= cells.length) return;
    var b = panel.querySelector('.pkw-t[data-y="' + cells[n] + '"]'); if (b) b.focus();
  }, true);
  /* pull the sheet down to close (phone and tablet) */
  var y0 = null;
  document.addEventListener('touchstart', function (e) { y0 = panel && !wide() && e.touches.length === 1 && panel.contains(e.target) && !(e.target.closest && e.target.closest('.pkw-t')) ? e.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchmove', function (e) { if (y0 === null || !panel) return; var dy = e.touches[0].clientY - y0; panel.style.transform = dy > 0 ? 'translateY(' + dy + 'px)' : ''; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (y0 === null || !panel) return; var dy = (e.changedTouches[0] || {}).clientY - y0; y0 = null; if (dy > 90) close(); else panel.style.transform = ''; }, { passive: true });
  window.addEventListener('resize', function () { if (!panel) return; panel.classList.toggle('pkw-dk', wide()); panel.classList.toggle('pkw-sh', !wide()); place(); });
  window.pkYearWall = { open: open, close: function () { close(); }, isOpen: function () { return !!panel; }, context: context };
})();
