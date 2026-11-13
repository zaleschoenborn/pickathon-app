/* pk-about1: the About hub, draft 1 (Nov 13 2026). Route 'aboutus', address #/about-us.
   Source: tools/about_r1/ab.js, spliced into index.html by tools/about_r1/build.py (<script id="pk-about1">, <style id="pk-about1-css">).
   Draws into <div id="ab1" class="pl2 ab1" data-pk-own> (the app's renderer leaves it alone). Every word and photo comes from
   data.json aboutHub; nothing is typed here. It borrows Plan's .pl2 tokens and the shared pk-cta button, and never changes Plan's files. */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function app() { return window.comp || window.__pkApp || null; }
  function site() { var a = app(); return (a && a.state) || window.__pkSt || {}; }
  var FOC = null;
  function focusOf(src) {
    if (!FOC) { FOC = {}; try { var x = new XMLHttpRequest(); x.open('GET', 'focus.json', false); x.send(); if (x.status === 200) FOC = JSON.parse(x.responseText) || {}; } catch (e) {} }
    var f = FOC[src]; return f ? f[0] + '% ' + f[1] + '%' : '50% 50%';
  }
  function html(H) {
    return '<div class="ab-in"><h1 class="pl-d ab-h1">' + esc(H.t) + '</h1><p class="ab-lede">' + esc(H.x) + '</p>' +
      '<ul class="ab-list">' + (H.s || []).map(function (c, i) {
        return '<li class="ab-c" id="ab-' + esc(c.id) + '"><div class="ab-im"><img src="' + esc(c.im) + '" alt="" style="object-position:' + focusOf(c.im) + '"' + (i > 1 ? ' loading="lazy"' : '') + ' decoding="async"></div>' +
          '<div class="ab-tx"><p class="ab-k">' + esc(c.k) + '</p><h2 class="pl-d ab-t">' + esc(c.t) + '</h2><p class="ab-x">' + esc(c.x) + '</p>' +
          '<button type="button" class="pk-cta sec pl-btn ab-btn" data-ab-go="' + esc(c.b[1]) + '">' + esc(c.b[0]) + '</button></div></li>';
      }).join('') + '</ul></div>';
  }
  function go(to) {
    var a = app(); if (!a) return; var c = to.indexOf(':'), k = to.slice(0, c), v = to.slice(c + 1);
    if (k === 'route') { a.go(v); return; }
    if (k === 'page') { a.go('page', { p: v }); return; }
    if (k === 'plan') { var p = v.split(':'); a.go('info', p[1] ? { step: p[0], c: p[1] } : { step: p[0] }); return; }
  }
  var root = null, lastKey = '';
  function sync() {
    var el = document.getElementById('ab1'); if (!el) { root = null; return; }
    var H = (site().data || {}).aboutHub; if (!H) return;
    var k = (H.s || []).length + '|' + H.t;
    if (el !== root || !el.firstChild || k !== lastKey) {
      root = el; lastKey = k; el.innerHTML = html(H);
      [].forEach.call(el.querySelectorAll('p,li'), function (e) { e.classList.add('pk-krtk'); });
      [].forEach.call(el.querySelectorAll('.pl-d'), function (e) { e.classList.add('pkp-head'); });
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-ab-go]') : null; if (!b || !root || !root.contains(b)) return;
    e.preventDefault(); go(b.getAttribute('data-ab-go'));
  });
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); try { sync(); } catch (e) { if (window.console) console.error('pk-about1', e); } return r; };
  function boot(n) { var a = app(); if (!a || !a.state || !a.state.data) { if (n < 200) setTimeout(function () { boot(n + 1); }, 50); return; } try { sync(); } catch (e) {} }
  boot(0);
  window.__pkAbout1 = { refresh: function () { lastKey = ''; sync(); } };
})();
