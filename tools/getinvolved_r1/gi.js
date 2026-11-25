/* pk-gi1: the Get involved door, build 1 (Nov 24 2026). Route 'getinv', address #/get-involved.
   Source: tools/getinvolved_r1/gi.js, spliced into index.html by tools/getinvolved_r1/build.py (<script id="pk-gi1">, <style id="pk-gi1-css">).
   Draws into <div id="gi1" data-pk-own>. Words, photos and card state come from data.json getInvolved; until Site Build moves it there,
   build.py embeds tools/getinvolved_r1/getinvolved.json as window.__pkGetInvolved. */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function app() { return window.comp || window.__pkApp || null; }
  function site() { var a = app(); return (a && a.state) || window.__pkSt || {}; }
  function html(S) {
    var H = S.hero || {}, o = '';
    o += '<button type="button" class="gi-crumb gi-go" data-gi-go="route:info">‹ Info · Get involved</button>';
    o += '<section class="gi-hero"><img src="' + esc(H.im) + '" alt="' + esc(H.alt) + '" style="object-position:' + esc(H.pos || '50% 50%') + '" fetchpriority="high" decoding="async">' +
      '<div class="gi-hx"><h1 class="gi-h1">' + esc(H.h1) + '</h1>' + (H.line ? '<p class="gi-line">' + esc(H.line) + '</p>' : '') + '</div></section>';
    o += '<ul class="gi-cards">' + (S.cards || []).map(function (c, i) {
      return '<li class="gi-card"><img src="' + esc(c.im) + '" alt="' + esc(c.alt) + '" style="object-position:' + esc(c.pos || '50% 50%') + '"' + (i > 1 ? ' loading="lazy"' : '') + ' decoding="async">' +
        '<div class="gi-tx"><span class="gi-lab">' + esc(c.label) + '</span><h2 class="gi-t' + (String(c.title).length > 22 ? ' gi-tl' : '') + '">' + esc(c.title) + '</h2>' +
        (c.line ? '<p class="gi-l">' + esc(c.line) + '</p>' : '') +
        '<button type="button" class="pk-cta ' + (c.state === 'open' ? 'pri' : 'sec') + ' gi-btn gi-go" data-gi-go="' + esc(c.to) + '">' + esc(c.button) + '</button></div></li>';
    }).join('') + '</ul>';
    o += '<div class="gi-links">' + (S.links || []).map(function (l) { return '<button type="button" class="gi-lk gi-go" data-gi-go="' + esc(l.to) + '">' + esc(l.t) + '</button>'; }).join('') + '</div>';
    return o;
  }
  function go(to) {
    var a = app(); if (!a) return; var c = to.indexOf(':'), k = to.slice(0, c), v = to.slice(c + 1);
    if (k === 'route') { if (v === 'info') { var st0 = site().stack || [], pv = st0[st0.length - 2]; if (pv && pv.r === 'info' && !pv.step) a.back(); else a.reset('info'); } else a.go(v); return; }
    if (k === 'page') { a.go('page', { p: v }); return; }
    if (k === 'story') { a.go('story', { s: +v }); return; }
    if (k === 'url') { window.open(v, '_blank', 'noopener'); return; }
  }
  function data() { return (site().data || {}).getInvolved || window.__pkGetInvolved || null; }
  var root = null, lastKey = '';
  function sync() {
    var el = document.getElementById('gi1'); if (!el) { root = null; return; }
    var S = data(); if (!S) return;
    var k = JSON.stringify(S).length + '|' + ((S.hero || {}).h1 || '');
    if (el !== root || !el.firstChild || k !== lastKey) { root = el; lastKey = k; el.innerHTML = html(S); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-gi-go]') : null; if (!b || !root || !root.contains(b)) return;
    e.preventDefault(); go(b.getAttribute('data-gi-go'));
  });
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); try { sync(); } catch (e) { if (window.console) console.error('pk-gi1', e); } return r; };
  function boot(n) { var a = app(); if (!a || !a.state || !a.state.data) { if (n < 200) setTimeout(function () { boot(n + 1); }, 50); return; } try { sync(); } catch (e) {} }
  boot(0);
  window.__pkGi1 = { refresh: function () { lastKey = ''; sync(); } };
})();
