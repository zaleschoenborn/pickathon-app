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
  /* Fix 5: the My Pickathon tab shows "Mine" under 375px; its accessible name stays "My Pickathon" */
  function tabs() { document.querySelectorAll('nav button').forEach(function (b) { if (b.querySelector(':scope > svg path[d^="m12 3 2.8 5.7"]') && !b.getAttribute('aria-label')) b.setAttribute('aria-label', 'My Pickathon'); }); }
  /* Fix 7: mark the top-5 panel's "I was there in YYYY" button (it sits on the dark panel) */
  function iw() { document.querySelectorAll('button.pk-sqb').forEach(function (b) { if (/I was there in \d{4}/.test(b.textContent)) b.classList.add('pk-g1-iw'); }); }
  /* Fix 8: tag the before-launch buttons with the shared kinds (pk-g1-b pri|sec); the artist row reads WATCH / LISTEN (full name kept for screen readers) */
  function kind(b, k) { if (!b) return; b.classList.add('pk-g1-b'); b.classList.toggle('pk-g1-pri', k === 'pri'); b.classList.toggle('pk-g1-sec', k === 'sec'); }
  function btns() {
    document.querySelectorAll('.pk-act-acts>.pk-bkb, .pk-ah .pk-ah-btns>.pk-bkb').forEach(function (b) {
      var t = b.textContent.trim(); if (t && b.getAttribute('aria-label') !== t) b.setAttribute('aria-label', t);
      kind(b, (b.classList.contains('pk-awb') || b.classList.contains('pri')) ? 'pri' : 'sec'); b.classList.add('pk-g1-short');
    });
    document.querySelectorAll('.pk-hd-vid button.pk-cta.sec').forEach(function (b) { kind(b, 'sec'); });
    document.querySelectorAll('.pk-lh-bs .pk-lh-b').forEach(function (b) { kind(b, b.classList.contains('pk-lh-t5') ? 'sec' : 'pri'); });
  }
  /* Fix 9: the iPhone Add to Home Screen tip lives as an inline row at the top of My Pickathon (not a floating toast) */
  var IOS = /iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone && !(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  function iosRow() {
    if (!IOS) return; var off = false; try { off = localStorage.getItem('pk-ios-row') === 'x'; } catch (e) {}
    var h = /^#\/(\d{4}\/)?mine\b/.test(location.hash) && [].slice.call(document.querySelectorAll('h1')).filter(function (e) { return /My Pickathon|Your Pickathon/.test(e.textContent) && vis(e); })[0];
    var r = document.querySelector('.pk-g1-ios');
    if (!h || off) { if (r) r.remove(); return; }
    if (r && r.previousElementSibling === h) return; if (r) r.remove();
    r = document.createElement('div'); r.className = 'pk-g1-ios'; r.setAttribute('role', 'note');
    r.innerHTML = '<p><b>Get the app:</b> tap Share \u2350, then Add to Home Screen.</p><button type="button" aria-label="Dismiss the app tip">\u2715</button>';
    r.querySelector('button').addEventListener('click', function () { try { localStorage.setItem('pk-ios-row', 'x'); localStorage.setItem('pk-ios-tip', '1'); } catch (e) {} r.remove(); });
    h.insertAdjacentElement('afterend', r);
  }
  /* Fix 14: tag the stray small targets (no stable class of their own) */
  function t44() {
    document.querySelectorAll('a,button').forEach(function (e) {
      var t = (e.textContent || '').trim();
      if (/^Mark my years/.test(t)) e.classList.add('pk-g1-t44');
      else if (e.tagName === 'A' && /^mailto:/.test(e.getAttribute('href') || '')) e.classList.add('pk-g1-mail');
      else if (t.length && t.length <= 8 && (e.closest('footer') || e.classList.contains('pk-nh-a'))) e.classList.add('pk-g1-w44');
    });
  }
  /* Panel P7: on the Lineup page "2027" + "Another year" become one opener, seal + "2027 ▾", like the year bar on every other page */
  function lineupOpener() {
    document.querySelectorAll('h2.pk-pyl').forEach(function (h) {
      var y = (h.textContent || '').trim(), b = h.nextElementSibling;
      if (!/^\d{4}$/.test(y) || !b || b.tagName !== 'BUTTON' || b.getAttribute('aria-haspopup') !== 'dialog') return;
      if (b.classList.contains('pk-g1-op') && b.getAttribute('data-y') === y && b.querySelector('.pk-g1-seal')) return;
      var lg = (window.__pkYL || {})[y] || (y === '2027' ? 'logo27-bat-only.png' : '');
      b.classList.add('pk-g1-op'); b.classList.remove('pk-g1-b'); b.setAttribute('data-y', y); b.setAttribute('aria-label', 'Pickathon ' + y + '. Another year');
      b.innerHTML = (lg ? '<i class="pk-g1-seal" aria-hidden="true"><img src="' + lg + '" alt=""></i>' : '') + '<b>' + y + '</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var cs = getComputedStyle(h); ['font-size', 'letter-spacing', 'font-family', 'font-weight', 'text-transform'].forEach(function (k) { b.style.setProperty(k, cs.getPropertyValue(k), 'important'); });
      h.classList.add('pk-g1-vh');
    });
  }
  var q = 0;
  function run() { q = 0; try { pills(); listen(); tabs(); iw(); btns(); iosRow(); t44(); lineupOpener(); } catch (e) { if (window.console) console.error('pk-g1', e); } }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  try { new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  window.addEventListener('hashchange', soon); window.addEventListener('resize', soon); soon();
})();
