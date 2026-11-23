/* pk-places-stub: Places loads on demand (speed step 2, Nov 22 2026). Source: tools/places_r1/stub.js.
   The map and neighborhood pages (about 110 KB compressed of code and styles) now live in pages/places.js and pages/places.css.
   They load the first time a page that draws the map renders (the page shows nothing for that moment, never half-styled), or as a quiet
   prefetch a few seconds after the first screen, or at once when the address is already a Places or neighborhood page. */
(function () {
  'use strict';
  var B = String(window.__pkBuild || '').replace(/^.*-/, ''), V = B ? '?v=' + B : '', J = 'pages/places.js' + V, C = 'pages/places.css' + V, st = 0, warm = 0;
  /* the page never pinch-zooms (Zale, Nov 20); this stays on from the first screen, as before */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
  function hint(rel, href, as) { var l = document.createElement('link'); l.rel = rel; l.href = href; if (as) l.as = as; document.head.appendChild(l); }
  function prefetch(kind) { if (warm) return; warm = 1; hint(kind, C, 'style'); hint(kind, J, 'script'); }
  function end() { st = 2; document.body.classList.remove('pkpl-ld'); }
  function load() {
    if (st) return; st = 1;
    document.body.classList.add('pkpl-ld');
    prefetch('preload');
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = C;
    l.onload = function () { var s = document.createElement('script'); s.src = J; s.onload = function () { if (!window.__pkPlaces) st = 0; end(); }; s.onerror = function () { st = 0; end(); }; document.head.appendChild(s); };
    l.onerror = function () { st = 0; end(); };
    document.head.appendChild(l);
  }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); if (!window.__pkPlaces && document.getElementById('pkpl')) load(); return r; };
  if (/^#\/(\d{4}\/)?(hood\/|neighborhoods)/.test(location.hash)) prefetch('preload');
  else window.addEventListener('load', function () {
    /* wait until the first screen has stopped downloading (no new file for 3 seconds, at most 25), then fetch quietly */
    var q = navigator.connection, n = -1, still = 0, t0 = Date.now();
    if (q && q.saveData) return;
    var tick = setInterval(function () {
      var c = performance.getEntriesByType('resource').length; still = c === n ? still + 1 : 0; n = c;
      if (still >= 3 || Date.now() - t0 > 25000) { clearInterval(tick); (window.requestIdleCallback || function (f) { setTimeout(f, 1); })(function () { prefetch('prefetch'); }); }
    }, 1000);
  });
  window.__pkPlacesLoad = load;
})();
