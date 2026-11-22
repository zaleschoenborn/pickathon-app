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
  function openArt(slug, an) {  // every name, tile and card opens its artist page (Nov 20: Zale said yes)
    var el = document.getElementById('a-' + slug) || document.getElementById('a-' + slug.replace(/^the/, ''));
    if (!el) return false;
    var cur = document.querySelector('.screen:not([hidden])'); if (cur && cur !== el) hist.push(cur.id);
    document.querySelectorAll('.screen').forEach(function (m) { m.hidden = m !== el; });
    if (an) el.querySelectorAll('.hd-t b, .hero-tx h1').forEach(function (x) { x.textContent = an; });  // the page carries the name the poster printed
    window.scrollTo(0, 0); return true;
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-clip]')) return;  // r36: on a card with a song the photo plays it; the name and 'Their story' open the artist page
    var a = e.target.closest('[data-art]'); if (a && openArt(a.dataset.art, a.dataset.an)) { e.preventDefault(); return; }
    var b = e.target.closest('.hd button[aria-label="Back"]'); if (b && hist.length) { var id = hist.pop(); show(id); e.preventDefault(); }
  });
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); show(a.dataset.go); } });
  var m = (location.hash || '').match(/^#(s[136]|y\d{4})$/); if (m && document.getElementById(m[1])) show(m[1]);

  // r45 (Zale, Nov 22): the year reel plays on its own, 4 s a frame, hard cut; a segment jumps; the photo plays that band's song
  document.querySelectorAll('.hero.reel').forEach(function (hero) {
    var S; try { S = JSON.parse(hero.dataset.slides); } catch (e) { return; }
    if (!S || S.length < 2) return;
    S.forEach(function (f) { var im = new Image(); im.src = f.i; });
    var i = 0, T = 4000, timer = 0, ph = hero.querySelector(':scope > img'), segs = hero.querySelectorAll('.segs [data-slide]');
    var KC = { Discovery: 'disc', Legend: 'leg', 'Deep cut': 'deep' };
    function go(n) {
      i = (n + S.length) % S.length; var f = S[i];
      ph.src = f.i; ph.setAttribute('data-clip', f.clip || ''); if (!f.clip) ph.removeAttribute('data-clip');
      var k = hero.querySelector('.krow .k'), g = hero.querySelector('.krow .g'), h1 = hero.querySelector('h1'), sub = hero.querySelector('.hero-sub'), ring = hero.querySelector('.ring');
      if (k) { k.textContent = f.k; k.className = 'k k-' + (KC[f.k] || 'none'); } if (g) g.textContent = f.g;
      if (h1) { h1.textContent = f.n; h1.classList.toggle('sm', f.n.length > 12); }
      if (sub) { sub.textContent = f.l; sub.hidden = !f.l; }
      if (ring) { if (f.clip) { ring.dataset.clip = f.clip; ring.hidden = false; } else ring.hidden = true; }
      segs.forEach(function (s, x) { s.classList.remove('on'); s.classList.toggle('done', x < i); });
      void hero.offsetWidth; segs[i].classList.add('on');
    }
    function live() { return hero.offsetParent !== null && !document.hidden && !document.querySelector('.pkvid'); }
    function restart() { clearInterval(timer); timer = setInterval(function () { if (live()) go(i + 1); }, T); }
    hero.querySelector('.segs').addEventListener('click', function (e) { var s = e.target.closest('[data-slide]'); if (!s) return; e.stopPropagation(); go(+s.dataset.slide); restart(); });
    restart();
  });
  document.querySelectorAll('.poster').forEach(function (p) {
    var track = p.querySelector('.po-track'), knob = p.querySelector('.po-knob'), cap = p.querySelector('.po-cap'); if (!track || !knob || !cap) return;
    var thenEl = p.querySelector('.po-names.then'), nowEl = p.querySelector('.po-names.now');
    var morph = document.createElement('div'); morph.className = 'po-names morph'; morph.hidden = true; nowEl.parentNode.insertBefore(morph, nowEl.nextSibling);
    var t = 0, items = [], h0 = 0, h1 = 0, raf = 0, busy = false;
    function rel(el, box) { var r = el.getBoundingClientRect(), o = box.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, fs: parseFloat(getComputedStyle(el).fontSize), c: getComputedStyle(el).color }; }
    function measure() {
      var th = thenEl.hidden, nh = nowEl.hidden; thenEl.hidden = false; nowEl.hidden = false;
      var A = {}, B = {};
      thenEl.querySelectorAll(':scope > .pcloud > .pn').forEach(function (s) { A[s.textContent] = rel(s, thenEl); });
      nowEl.querySelectorAll(':scope > .pcloud > .pn').forEach(function (s) { B[s.textContent] = rel(s, nowEl); });
      var hh0 = 0, hh1 = 0; hh0 = thenEl.querySelector(':scope > .pcloud').getBoundingClientRect().height;
      hh1 = nowEl.querySelector(':scope > .pcloud').getBoundingClientRect().height;
      thenEl.hidden = th; nowEl.hidden = nh; h0 = hh0; h1 = hh1;
      morph.textContent = ''; items = [];
      var keys = Object.keys(A).concat(Object.keys(B).filter(function (k) { return !(k in A); }));
      keys.forEach(function (k) { var s = document.createElement('span'); s.className = 'pm'; s.textContent = k; morph.appendChild(s); items.push({ el: s, a: A[k], b: B[k] }); });
    }
    var yrEl = knob.querySelector('.po-yr'), Y0 = parseInt(p.dataset.yr, 10) || 0, Y1 = 2026;
    function mix(u, v, k) { return u + (v - u) * k; }
    function yearLabel(k) { if (!yrEl) return; yrEl.textContent = k >= 0.995 ? 'Today' : String(Math.round(Y0 + (Y1 - Y0) * k)); }
    function render() {
      items.forEach(function (it) {
        var a = it.a || it.b, b = it.b || it.a, s = it.el.style;
        s.left = mix(a.x, b.x, t) + 'px'; s.top = mix(a.y, b.y, t) + 'px'; s.fontSize = mix(a.fs, b.fs, t) + 'px';
        s.color = t < 0.5 ? a.c : b.c; s.opacity = it.a && it.b ? 1 : (it.a ? 1 - t : t);
      });
      morph.style.height = mix(h0, h1, t) + 'px'; yearLabel(t);
      cap.textContent = t > 0.5 ? cap.dataset.now : cap.dataset.then; knob.setAttribute('aria-valuenow', t > 0.5 ? 1 : 0);
    }
    function flags(now) { p.classList.toggle('is-now', now); p.querySelectorAll('.po-b').forEach(function (x) { x.classList.toggle('on', (x.dataset.m === 'now') === now); }); }
    function settle(now) {
      t = now ? 1 : 0; yearLabel(t); busy = false; morph.hidden = true; thenEl.hidden = now; nowEl.hidden = !now; flags(now);
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
    function drag(e) { var f = frac(e); yearLabel(f); knob.style.left = 'calc(' + (f * 100) + '% - 11px)'; if (p.classList.contains('all')) { flags(f > 0.5); thenEl.hidden = f > 0.5; nowEl.hidden = f <= 0.5; return; } cancelAnimationFrame(raf); if (!busy) begin(); t = f; render(); }
    track.addEventListener('pointerdown', function (e) { track.setPointerCapture(e.pointerId); track.classList.add('drag'); drag(e); });
    track.addEventListener('pointermove', function (e) { if (track.classList.contains('drag')) drag(e); });
    function up(e) { if (!track.classList.contains('drag')) return; track.classList.remove('drag'); var now = frac(e) > 0.5; knob.style.left = ''; if (p.classList.contains('all')) settle(now); else go(now); }
    track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
    knob.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(true); if (e.key === 'ArrowLeft') go(false); });
  });
  document.querySelectorAll('.gp').forEach(function (gp) {
    // r29 (Zale, Nov 21): pick as many kinds of music as you like. "Everything" clears; the gold button closes the list.
    var btn = gp.querySelector('.gp-b'), list = gp.querySelector('.gp-list'), word = gp.querySelector('.gp-a b'), none = gp.querySelector('.gp-none'), done = gp.querySelector('.gp-done');
    var all = gp.dataset.all, picks = [];
    function shut() { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    function apply() {
      var shown = 0;
      list.querySelectorAll('.gp-o').forEach(function (x) {
        var on = x.dataset.g === all ? !picks.length : picks.indexOf(x.dataset.g) > -1;
        x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on));
      });
      document.querySelectorAll(gp.dataset.target).forEach(function (c) {
        var cg = c.dataset.g || '';
        var ct = cg.split('|'); var hit = !picks.length || picks.some(function (g) { return ct.indexOf(g) > -1; });
        c.classList.toggle('gone', !hit); if (hit && !c.closest('[hidden]')) shown++;
      });
      word.textContent = !picks.length ? all : picks.length < 3 ? picks.join(' + ') : picks[0] + ' + ' + (picks.length - 1) + ' more';
      gp.classList.toggle('set', picks.length > 0);
      none.hidden = shown > 0 || !picks.length;
      gp.dispatchEvent(new CustomEvent('lxfilter', { bubbles: true }));
      if (done) done.textContent = 'Show ' + shown + (shown === 1 ? ' act' : ' acts');
    }
    btn.addEventListener('click', function () { list.hidden = !list.hidden; btn.setAttribute('aria-expanded', String(!list.hidden)); if (!list.hidden) apply(); });
    list.addEventListener('click', function (e) {
      if (e.target.closest('.gp-done')) { shut(); return; }
      var o = e.target.closest('.gp-o'); if (!o) return; var g = o.dataset.g, k = picks.indexOf(g);
      if (g === all) picks = []; else if (k > -1) picks.splice(k, 1); else picks.push(g);
      apply();
    });
    document.addEventListener('click', function (e) { var path = e.composedPath ? e.composedPath() : []; if (!list.hidden && path.indexOf(gp) < 0 && !gp.contains(e.target)) shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { shut(); btn.focus(); } });
  });
  document.querySelectorAll('.bk').forEach(function (bk) {
    bk.addEventListener('click', function (e) {
      var b = e.target.closest('.bkb'); if (!b) return;
      bk.querySelectorAll('.bkb').forEach(function (x) { x.classList.toggle('on', x === b); });
      bk.closest('.arch').querySelectorAll('.bl').forEach(function (g) { g.hidden = g.dataset.b !== b.dataset.b; });
    });
  });
  // r30 (Nov 21): the archive draws every act; 30 show first and "Keep going" brings 30 more. The count stays true to the cards.
  document.querySelectorAll('.arch').forEach(function (arch) {
    var more = arch.querySelector('.more'); if (!more) return; var STEP = 30;
    function page() {
      var left = 0;
      arch.querySelectorAll('.bl').forEach(function (bl) {
        var n = bl._n || STEP, i = 0, rest = 0;
        bl.querySelectorAll('.card').forEach(function (c) { if (c.classList.contains('gone')) { c.classList.remove('late'); return; } var late = i >= n; c.classList.toggle('late', late); if (late) rest++; i++; });
        if (!bl.hidden) left = rest;
      });
      more.hidden = left === 0; more.textContent = 'Keep going · ' + left + ' more';
    }
    more.addEventListener('click', function () { var bl = arch.querySelector('.bl:not([hidden])'); if (bl) { bl._n = (bl._n || STEP) + STEP; page(); } });
    arch.addEventListener('lxfilter', page);
    arch.querySelectorAll('.bkb').forEach(function (b) { b.addEventListener('click', function () { setTimeout(page, 0); }); });
    page();
  });
  // r30: "See everyone" opens the rest of the year's acts; picking a kind of music shows every match
  document.querySelectorAll('section.rest').forEach(function (rest) {
    var minis = rest.querySelector('.minis'), evy = rest.querySelector('.evy'), gp = rest.querySelector('.gp'); if (!minis) return;
    function sync() { var f = !!(gp && gp.classList.contains('set')); minis.classList.toggle('filt', f); if (evy) evy.hidden = f || minis.classList.contains('open'); }
    if (evy) evy.addEventListener('click', function () { minis.classList.add('open'); sync(); });
    rest.addEventListener('lxfilter', sync);
  });
  // r31: inside the live app the ring must win over the card's own link (the app plays it with its own player)
  document.querySelectorAll('a [data-clip]').forEach(function (r) {
    r.addEventListener('click', function (e) { if (!window.__pkPlayVid) return; e.preventDefault(); e.stopPropagation(); window.__pkPlayVid(r.getAttribute('data-clip'), ''); });
  });
  // r30: the year story opens in place
  document.querySelectorAll('.stog').forEach(function (b) {
    b.addEventListener('click', function () {
      var body = b.parentNode.querySelector('.body'), open = body.hidden; body.hidden = !open;
      b.setAttribute('aria-expanded', String(open)); b.classList.toggle('open', open); b.querySelector('span').textContent = open ? b.dataset.shut : b.dataset.open;
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
