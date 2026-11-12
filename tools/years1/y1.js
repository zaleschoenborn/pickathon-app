/* Years package (Nov 12 2026): DOM touch-ups the templates can't express. Runs after renders (one observer, no timers). */
(function () {
  /* B: bill slugs set their name as large as it fits: no word may break, at most four lines */
  var fontGen = 0;
  function fitSlugs() {
    var L = document.querySelectorAll('#root :is(.pk-shc,.pk-b3):has(>.pk-b3ph)>b, #root :is(.pk-b1,.pk-b2):has(>.pk-bph) .pk-bcap>b');
    for (var i = 0; i < L.length; i++) {
      var b = L[i]; if (!b.offsetWidth) continue; var key = b.textContent + '|' + b.offsetWidth + '|' + fontGen;
      var cap = b.parentElement.classList.contains('pk-bcap') ? b.parentElement : null, fs = parseFloat(getComputedStyle(b).fontSize) || 17, n = 0;
      var over = function () { var t = Math.ceil(fs * 0.3) + 1; return b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + t || (cap && cap.scrollHeight > cap.clientHeight + 2); };   /* glyphs overhang a .96 line box by a few px; only a whole lost line counts */
      if (b.__fit === key && !over()) continue;
      b.style.removeProperty('font-size'); fs = parseFloat(getComputedStyle(b).fontSize) || 17;
      while (n++ < 30 && fs > 11 && over()) { fs -= 1; b.style.setProperty('font-size', fs + 'px', 'important'); }
      b.__fit = key;
    }
  }
  var q = 0; function run() { q = 0; try { fitSlugs(); } catch (e) {} }
  function sch() { if (!q) q = requestAnimationFrame(run); }
  function boot() { var r = document.getElementById('root'); if (!r) return setTimeout(boot, 200); new MutationObserver(sch).observe(r, { childList: true, subtree: true }); sch(); setTimeout(sch, 1500); setTimeout(sch, 4000); }
  addEventListener('resize', sch); if (document.fonts) { document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', function () { fontGen++; sch(); }); document.fonts.ready && document.fonts.ready.then(function () { fontGen++; sch(); }); }
  boot();
})();
