(function () {
  var bar = document.querySelector('.mockbar'); var hist = [];
  function show(id) {
    hist.length = 0;
    document.querySelectorAll('.screen').forEach(function (s) { s.hidden = s.id !== id; });
    bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.s === id); }); var ys = document.getElementById('ysel'); if (ys) ys.value = /^y/.test(id) ? id : '';
    window.scrollTo(0, 0);
  }
  bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(b.dataset.s); });
  document.addEventListener('change', function (e) { var t = e.target; if ((t.id === 'ysel' || t.classList.contains('ysel2')) && t.value) { show(t.value); if (t.classList.contains('ysel2')) { var o = t.querySelector('option[selected]'); if (o) t.value = o.value; } } });
  function openArt(slug) {  // every name, tile and card opens its artist page (Nov 20: Zale said yes)
    var el = document.getElementById('a-' + slug) || document.getElementById('a-' + slug.replace(/^the/, ''));
    if (!el) return false;
    var cur = document.querySelector('.screen:not([hidden])'); if (cur && cur !== el) hist.push(cur.id);
    document.querySelectorAll('.screen').forEach(function (m) { m.hidden = m !== el; });
    window.scrollTo(0, 0); return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-art]'); if (a && openArt(a.dataset.art)) { e.preventDefault(); return; }
    var b = e.target.closest('.hd button[aria-label="Back"]'); if (b && hist.length) { var id = hist.pop(); show(id); e.preventDefault(); }
  });
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); show(a.dataset.go); } });
  var m = (location.hash || '').match(/^#(s[136]|y\d{4})$/); if (m && document.getElementById(m[1])) show(m[1]);
  document.querySelectorAll('.poster').forEach(function (p) {
    var track = p.querySelector('.po-track'), knob = p.querySelector('.po-knob'), cap = p.querySelector('.po-cap'); if (!track || !knob || !cap) return;
    var thenEl = p.querySelector('.po-names.then'), nowEl = p.querySelector('.po-names.now');
    var morph = document.createElement('div'); morph.className = 'po-names morph'; morph.hidden = true; nowEl.parentNode.insertBefore(morph, nowEl.nextSibling);
    var t = 0, items = [], h0 = 0, h1 = 0, raf = 0, busy = false;
    function rel(el, box) { var r = el.getBoundingClientRect(), o = box.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, fs: parseFloat(getComputedStyle(el).fontSize), c: getComputedStyle(el).color }; }
    function measure() {
      var th = thenEl.hidden, nh = nowEl.hidden; thenEl.hidden = false; nowEl.hidden = false;
      var A = {}, B = {};
      thenEl.querySelectorAll(':scope > .pl span:not(.dot)').forEach(function (s) { A[s.textContent] = rel(s, thenEl); });
      nowEl.querySelectorAll(':scope > .pcloud > .pn').forEach(function (s) { B[s.textContent] = rel(s, nowEl); });
      var hh0 = 0, hh1 = 0; thenEl.querySelectorAll(':scope > .pl').forEach(function (l) { hh0 = Math.max(hh0, l.getBoundingClientRect().bottom - thenEl.getBoundingClientRect().top); });
      hh1 = nowEl.querySelector(':scope > .pcloud').getBoundingClientRect().height;
      thenEl.hidden = th; nowEl.hidden = nh; h0 = hh0; h1 = hh1;
      morph.textContent = ''; items = [];
      var keys = Object.keys(A).concat(Object.keys(B).filter(function (k) { return !(k in A); }));
      keys.forEach(function (k) { var s = document.createElement('span'); s.className = 'pm'; s.textContent = k; morph.appendChild(s); items.push({ el: s, a: A[k], b: B[k] }); });
    }
    function mix(u, v, k) { return u + (v - u) * k; }
    function render() {
      items.forEach(function (it) {
        var a = it.a || it.b, b = it.b || it.a, s = it.el.style;
        s.left = mix(a.x, b.x, t) + 'px'; s.top = mix(a.y, b.y, t) + 'px'; s.fontSize = mix(a.fs, b.fs, t) + 'px';
        s.color = t < 0.5 ? a.c : b.c; s.opacity = it.a && it.b ? 1 : (it.a ? 1 - t : t);
      });
      morph.style.height = mix(h0, h1, t) + 'px';
      cap.textContent = t > 0.5 ? cap.dataset.now : cap.dataset.then; knob.setAttribute('aria-valuenow', t > 0.5 ? 1 : 0);
    }
    function flags(now) { p.classList.toggle('is-now', now); p.querySelectorAll('.po-b').forEach(function (x) { x.classList.toggle('on', (x.dataset.m === 'now') === now); }); }
    function settle(now) {
      t = now ? 1 : 0; busy = false; morph.hidden = true; thenEl.hidden = now; nowEl.hidden = !now; flags(now);
      cap.textContent = now ? cap.dataset.now : cap.dataset.then; knob.setAttribute('aria-valuenow', now ? 1 : 0);
    }
    function begin() { measure(); busy = true; thenEl.hidden = true; nowEl.hidden = true; morph.hidden = false; }
    function go(now) {
      if (p.classList.contains('all')) { settle(now); return; }
      cancelAnimationFrame(raf); if (!busy) begin(); flags(now);
      var from = t, to = now ? 1 : 0, t0 = performance.now(), dur = 150 + 650 * Math.abs(to - from);
      (function step(n) { var k = Math.min(1, (n - t0) / dur); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; t = from + (to - from) * k; render(); if (n - t0 < dur) raf = requestAnimationFrame(step); else settle(now); })(t0);
    }
    p.addEventListener('click', function (e) {
      var b = e.target.closest('.po-b'); if (b) { go(b.dataset.m === 'now'); return; }
      var a = e.target.closest('.po-all'); if (a) {
        var open = !p.classList.contains('all'); p.classList.toggle('all', open);
        p.querySelectorAll('.po-rest').forEach(function (r) { r.hidden = !open; });
        a.textContent = open ? a.dataset.open : a.dataset.shut;
      }
    });
    function frac(e) { var r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
    function drag(e) { var f = frac(e); knob.style.left = 'calc(' + (f * 100) + '% - 11px)'; if (p.classList.contains('all')) { flags(f > 0.5); thenEl.hidden = f > 0.5; nowEl.hidden = f <= 0.5; return; } cancelAnimationFrame(raf); if (!busy) begin(); t = f; render(); }
    track.addEventListener('pointerdown', function (e) { track.setPointerCapture(e.pointerId); track.classList.add('drag'); drag(e); });
    track.addEventListener('pointermove', function (e) { if (track.classList.contains('drag')) drag(e); });
    function up(e) { if (!track.classList.contains('drag')) return; track.classList.remove('drag'); var now = frac(e) > 0.5; knob.style.left = ''; if (p.classList.contains('all')) settle(now); else go(now); }
    track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
    knob.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(true); if (e.key === 'ArrowLeft') go(false); });
  });
  document.querySelectorAll('.gp').forEach(function (gp) {
    var btn = gp.querySelector('.gp-b'), list = gp.querySelector('.gp-list'), word = gp.querySelector('.gp-a b'), none = gp.querySelector('.gp-none');
    btn.addEventListener('click', function () { list.hidden = !list.hidden; btn.setAttribute('aria-expanded', String(!list.hidden)); });
    list.addEventListener('click', function (e) {
      var o = e.target.closest('.gp-o'); if (!o) return; var g = o.dataset.g, shown = 0;
      list.querySelectorAll('.gp-o').forEach(function (x) { x.classList.toggle('on', x === o); });
      word.textContent = g; gp.classList.toggle('set', g !== gp.dataset.all); list.hidden = true; btn.setAttribute('aria-expanded', 'false');
      document.querySelectorAll(gp.dataset.target).forEach(function (c) {
        var hit = g === gp.dataset.all || (c.dataset.g || '').indexOf(g) === 0 || (g === 'Indie rock' && c.dataset.g === 'Indie');
        c.classList.toggle('gone', !hit); if (hit && c.offsetParent !== null) shown++;
      });
      none.hidden = shown > 0 || g === gp.dataset.all;
      if (gp.dataset.target === '.none') { var sub = document.querySelector('.rest .gp'); if (sub) sub.hidden = g !== 'Music'; none.hidden = g === 'Music'; }
    });
  });
  document.querySelectorAll('.bk').forEach(function (bk) {
    bk.addEventListener('click', function (e) {
      var b = e.target.closest('.bkb'); if (!b) return;
      bk.querySelectorAll('.bkb').forEach(function (x) { x.classList.toggle('on', x === b); });
      bk.closest('.arch').querySelectorAll('.bl').forEach(function (g) { g.hidden = g.dataset.b !== b.dataset.b; });
    });
  });
  (function () {
    var bar = document.querySelector('.bkw'); if (!bar) return;
    function tick() {
      var top = bar.getBoundingClientRect().top; bar.classList.toggle('stuck', top <= 50);
      var on = bar.querySelector('.bkb.on'), g = bar.parentNode.querySelector('.bl:not([hidden])'); if (!on || !g) return;
      var r = g.getBoundingClientRect(), bh = bar.offsetHeight + 49, total = r.height - (window.innerHeight - bh) * 0.6;
      var p = total > 0 ? Math.min(1, Math.max(0, (bh - r.top) / total)) : 0;
      bar.querySelectorAll('.bkb').forEach(function (x) { x.style.setProperty('--p', x === on ? (p * 100).toFixed(1) + '%' : '0%'); });
    }
    window.addEventListener('scroll', tick, { passive: true }); window.addEventListener('resize', tick);
    bar.addEventListener('click', function () { setTimeout(tick, 30); }); tick();
  })();
  document.addEventListener('click', function (e) { var a = e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });
})();
