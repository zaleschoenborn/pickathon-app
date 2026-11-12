/* Gate 1 fixes (Nov 12 2026): small DOM touch-ups the templates can't express. Runs after every render. */
(function () {
  function yr(t) { var m = String(t || '').match(/Pickathon (\d{4})/); return m ? m[1] : ''; }
  function pill(host, y) {
    if (!host || !y) return; var p = host.querySelector(':scope > .pk-g1-pill');
    var txt = 'Watch from Pickathon ' + y;
    if (p && p.getAttribute('data-y') === y) return;
    if (!p) { p = document.createElement('span'); p.className = 'pk-g1-pill'; p.setAttribute('aria-hidden', 'true'); host.appendChild(p); }
    p.setAttribute('data-y', y); p.innerHTML = '<i>▶︎</i>' + txt;
  }
  /* Fix 1: gold pill on the neighborhood video (phone/tablet) and on every-video thumbnails */
  function pills() {
    document.querySelectorAll('.pk-hd-vid').forEach(function (v) {
      var a = v.querySelector('a.pk-hd-vi'), cs = v.querySelector('.pk-hd-cs'); if (!a) return;
      pill(a, yr(cs && cs.textContent)); var p = a.querySelector('.pk-g1-pill'); if (p) p.classList.add('pk-g1-dk-hide');
      if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
    });
    document.querySelectorAll('.pk-yrp figure.pk-rs').forEach(function (f) {
      var c = f.querySelector('figcaption'), o = f.querySelector('.pk-rvo'); if (!c || !o) return;
      var y = yr(o.textContent); if (!y) return;
      if (!c.querySelector(':scope > .pk-g1-pill')) { var p = document.createElement('span'); p.className = 'pk-g1-pill'; p.setAttribute('aria-hidden', 'true'); p.innerHTML = '<i>\u25B6\uFE0E</i>Watch from Pickathon ' + y; c.insertBefore(p, c.firstChild); }
      f.classList.toggle('pk-g1-capov', innerWidth <= 1024 && getComputedStyle(c).position === 'absolute');
    });
    document.querySelectorAll('.pk-ev-t').forEach(function (b) { pill(b, yr(b.getAttribute('aria-label'))); });
  }
  /* Fix 2: hide the LISTEN float on phone/tablet when it would sit on another header control */
  function vis(e) { if (!e || !e.checkVisibility || !e.checkVisibility()) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function listen() {
    var H = document.documentElement, b = document.querySelector('button[aria-label="Listen to Pickathon"]'), on = false;
    if (b && innerWidth <= 1024) {
      var bk = [].slice.call(document.querySelectorAll('.pk-tm-bk')).some(vis);
      if (bk) on = true;   /* the header carries 'Back to 2027' on the right: that is where the float would land */
    }
    H.classList.toggle('pk-g1-nolsn', on);
  }
  var q = 0;
  function run() { q = 0; try { pills(); listen(); } catch (e) { if (window.console) console.error('pk-g1', e); } }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  try { new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  window.addEventListener('hashchange', soon); window.addEventListener('resize', soon); soon();
})();
