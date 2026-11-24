/* pk-about1: the About story page, draft 4 (Nov 24 2026; shape approved by Zale Nov 24). Route 'aboutus', address #/about-us.
   Source: tools/about_r1/ab.js, spliced into index.html by tools/about_r1/build.py (<script id="pk-about1">, <style id="pk-about1-css">).
   Draws into <div id="ab1" class="pl2 ab1" data-pk-own>. Words and photos come from data.json aboutStory; until Site Build moves it
   there, build.py embeds tools/about_r1/about_story.json as window.__pkAboutStory. Posters show whole, never cropped. */
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
  function poster(y) { return 'i/y' + String(y).slice(-2) + '-poster.webp'; }
  function chev() { return '<svg class="ab-rc" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function tag(go, cls, inner, label) {
    return go ? '<button type="button" class="' + cls + ' ab-go" data-ab-go="' + esc(go) + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + inner + '</button>'
      : '<div class="' + cls + '">' + inner + '</div>';
  }
  function html(S) {
    var o = '', H = S.hero || {}, W = S.stands || {}, E = S.eras || {}, M = S.more || {}, J = S.join || {};
    o += '<section class="ab-hero"><img src="' + esc(H.im) + '" alt="' + esc(H.alt) + '" style="object-position:' + focusOf(H.im) + '" fetchpriority="high" decoding="async">' +
      '<div class="ab-hx"><h1 class="ab-d ab-h1">' + esc(H.t) + '</h1><p class="ab-lede">' + esc(H.x) + '</p></div></section>';
    o += '<div class="ab-in">';
    o += '<section class="ab-sec"><h2 class="ab-d ab-h2">' + esc(W.h) + '</h2><ul class="ab-stands">' + (W.r || []).map(function (w, i) {
      return '<li>' + tag(w.go, 'ab-st', '<span class="ab-sp2"><img src="' + esc(w.im) + '" alt="' + esc(w.alt) + '" style="object-position:' + (w.pos || focusOf(w.im)) + '"' + (i ? ' loading="lazy"' : '') + ' decoding="async"></span>' +
        '<span class="ab-sx"><span class="ab-wk">' + esc(w.k) + '</span><span class="ab-wt">' + esc(w.t) + '</span><span class="ab-wl">' + esc(w.x) + '</span>' + (w.b ? '<span class="ab-sb">' + esc(w.b) + ' <span aria-hidden="true">→</span></span>' : '') + '</span>', w.k + ': ' + w.t) + '</li>';
    }).join('') + '</ul></section>';
    o += '<section class="ab-sec" id="ab-story"><h2 class="ab-d ab-h2">' + esc(E.h) + '</h2><p class="ab-sub">' + esc(E.x) + '</p><ul class="ab-eras">' + (E.r || []).map(function (e) {
      return '<li>' + tag(E.go, 'ab-era', '<span class="ab-pf"><img src="' + esc(e.im) + '" alt="Pickathon ' + esc(e.py) + ' poster" loading="lazy" decoding="async"></span>' +
        '<span class="ab-ey">' + esc(e.y) + '</span><span class="ab-en">' + esc(e.n) + '</span><span class="ab-ex">' + esc(e.x) + '</span>') + '</li>';
    }).join('') + '</ul>';
    if ((E.strip || []).length) o += '<ul class="ab-strip" aria-label="More posters">' + E.strip.map(function (y) {
      return '<li>' + tag('route:past:y=' + y, 'ab-sp', '<img src="i/about/y' + String(y).slice(-2) + '-icon.webp" alt="" loading="lazy" decoding="async"><span>' + esc(y) + '</span>', 'Pickathon ' + y) + '</li>';
    }).join('') + '</ul>';
    if (E.all) o += '<button type="button" class="ab-link ab-go" data-ab-go="' + esc(E.all[1]) + '">' + esc(E.all[0]) + ' <span aria-hidden="true">→</span></button>';
    o += '</section>';
    if ((M.r || []).length) o += '<section class="ab-sec ab-more"><h2 class="ab-d ab-h2">' + esc(M.h) + '</h2><ul class="ab-rows">' + M.r.map(function (r) {
      return '<li><button type="button" class="ab-row ab-go" data-ab-go="' + esc(r[2]) + '"><span class="ab-rt">' + esc(r[0]) + '</span><span class="ab-rx">' + esc(r[1]) + '</span>' + chev() + '</button></li>';
    }).join('') + '</ul></section>';
    o += '<section class="ab-join"><h2 class="ab-d ab-h2">' + esc(J.h) + '</h2><p class="ab-jx">' + esc(J.x) + '</p>' +
      (J.b ? '<button type="button" class="pk-cta pri pl-btn ab-btn ab-go" data-ab-go="' + esc(J.b[1]) + '">' + esc(J.b[0]) + '</button>' : '') + '</section>';
    return o + '</div>';
  }
  function go(to) {
    var a = app(); if (!a) return; var c = to.indexOf(':'), k = to.slice(0, c), v = to.slice(c + 1);
    if (k === 'scroll') { var t = document.getElementById(v); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (k === 'route') { var p = v.split(':'); if (p[1]) { var kv = p[1].split('='), q = {}; q[kv[0]] = kv[1] === '1' ? true : kv[1]; a.go(p[0], q); } else a.go(v); return; }
    if (k === 'page') { a.go('page', { p: v }); return; }
    if (k === 'url') { window.open(v, '_blank', 'noopener'); return; }
    if (k === 'plan') { var s = v.split(':'); a.go('info', s[1] ? { step: s[0], c: s[1] } : { step: s[0] }); return; }
  }
  function story() { return (site().data || {}).aboutStory || window.__pkAboutStory || null; }
  var root = null, lastKey = '';
  function sync() {
    var el = document.getElementById('ab1'); if (!el) { root = null; return; }
    var S = story(); if (!S) return;
    var k = JSON.stringify(S).length + '|' + ((S.hero || {}).t || '');
    if (el !== root || !el.firstChild || k !== lastKey) {
      root = el; lastKey = k; el.innerHTML = html(S);
      [].forEach.call(el.querySelectorAll('p,li'), function (e) { e.classList.add('pk-krtk'); });
      [].forEach.call(el.querySelectorAll('.ab-d'), function (e) { e.classList.add('pkp-head'); });
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
