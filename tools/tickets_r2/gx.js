/* Pickathon gifts and transfers (Zale, Nov 15 2026). TEST MODE prototype.
   One pipe, two uses: a transfer moves passes to someone; a gift is a transfer with a photo postcard, a note and a send date.
   - window.pkGift.form(passes, gift, done)   the gift form (Tickets checkout and My Pickathon)
   - window.pkGift.transfer(passes, done)     pick passes from My Pickathon and send them (gift card optional)
   - window.pkGift.open(gift)                 the postcard the recipient opens (?gift=... in the link)
   The recipient must sign in to My Pickathon to accept. Until then the passes stay with the sender, who can resend or take them back.
   FMS today moves tickets at once (CustomerController orderTransfer: first name, last name, email, picked tickets).
   The accept step, the note and the send date are new on Kris's side (outbox site_design-10). QR codes come later in the account. */
(function () {
  if (window.pkGift) return;
  var PHOTO = 'i/r35-cherryhill-2.jpg';   /* Zale, Nov 15: a photo postcard; confetti over the Cherry Hill crowd. Not the sunset Antlers shot (apartment buildings show in it). No 2027 logo before the reveal. */
  var LSG = 'pk27gifts', LSM = 'pk27mine', LAST = '2027-08-04';
  var scrim = null, opener = null, inerted = [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function app() { return window.comp || window.__pkApp || null; }
  function st() { var a = app(); return (a && a.state) || {}; }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(window.localStorage.getItem(k) || 'null'); window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
  function today() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function dayS(d) { if (!d) return ''; var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; var p = d.split('-'); return M[+p[1] - 1] + ' ' + (+p[2]); }
  function okEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || '').trim()); }
  function first(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  function me() { var u = st().user; return u ? { name: u.name || first(String(u.email).split('@')[0]), email: u.email } : null; }
  function passLine(p) { return (p.q > 1 ? p.q + ' × ' : '') + p.n; }

  /* ---------- the sheet ---------- */
  function close(keep) {
    if (!scrim) return; scrim.remove(); scrim = null; document.documentElement.classList.remove('gx-open');
    inerted.forEach(function (e) { e.removeAttribute('inert'); }); inerted = [];
    if (!keep && opener && opener.focus) { try { opener.focus(); } catch (e) {} }
  }
  function sheet(html, label, cls) {
    close(true); opener = document.activeElement;
    scrim = document.createElement('div'); scrim.className = 'gx-scrim' + (cls ? ' ' + cls : '');
    scrim.innerHTML = '<div class="gx-sheet" role="dialog" aria-modal="true" aria-label="' + esc(label) + '">' + html + '</div>';
    ['root', 'pk-co'].forEach(function (id) { var e = document.getElementById(id); if (e && !e.hasAttribute('inert')) { e.setAttribute('inert', ''); inerted.push(e); } });
    $$('.tk-scrim').forEach(function (e) { if (!e.hasAttribute('inert')) { e.setAttribute('inert', ''); inerted.push(e); } });
    document.body.appendChild(scrim); document.documentElement.classList.add('gx-open');
    scrim.addEventListener('click', function (e) { if (e.target === scrim || (e.target.closest && e.target.closest('[data-gx-close]'))) close(); });
    var f = $('[data-focus]', scrim) || $('h2[tabindex]', scrim); if (f) { try { f.focus(); } catch (e) {} }
    return scrim;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && scrim) close(); });
  function top(t) { return '<div class="gx-top"><h2 class="gx-h" tabindex="-1">' + esc(t) + '</h2><button type="button" class="gx-x" data-gx-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>'; }
  function field(id, label, v, type, extra) { return '<label class="gx-f" for="' + id + '"><span>' + label + '</span><input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(v || '') + '"' + (extra || '') + '></label>'; }
  function err(scope, msg, at) { var e = $('.gx-err', scope); e.textContent = msg; e.hidden = !msg; if (at) { at.setAttribute('aria-invalid', 'true'); at.focus(); } }

  /* ---------- the postcard (front and back), used in the form preview and in the link ---------- */
  function front(g, small) {
    return '<div class="gx-pc' + (small ? ' gx-pc-s' : '') + '"><div class="gx-front"><img src="' + PHOTO + '" alt="Confetti falls over a crowd at Pickathon"><p class="gx-pc-t">Pickathon · Aug 5–8, 2027</p><div class="gx-pc-b"><p class="gx-k">A gift from ' + esc(first(g.from && g.from.name) || 'a friend') + '</p><h2 class="gx-pc-h">' + esc(first(g.to && g.to.first) || 'You') + ', you’re going to Pickathon.</h2></div></div></div>';
  }
  function back(g) {
    return '<div class="gx-pc"><div class="gx-back"><div class="gx-pm" aria-hidden="true"><span>Happy Valley</span><b>Aug 5–8</b><span>Oregon · 2027</span></div><p class="gx-to">To ' + esc(first(g.to.first)) + '</p>' +
      (g.note ? '<p class="gx-note">' + esc(g.note) + '</p>' : '<p class="gx-note">Four days of music in the woods. See you there.</p>') + '<p class="gx-sig">' + esc(g.from.name) + '</p>' +
      '<div class="gx-tix">' + g.passes.map(function (p) { return '<p><b>' + esc(passLine(p)) + '</b>' + (p.sub ? '<span>' + esc(p.sub) + '</span>' : '') + '</p>'; }).join('') + '</div></div></div>';
  }

  /* ---------- the gift form: who, a note, when to send it ---------- */
  function form(passes, gift, done, opts) {
    opts = opts || {}; gift = gift || {}; var q = {}; passes.forEach(function (p) { q[p.id] = (gift.passes || []).filter(function (x) { return x.id === p.id; }).reduce(function (a, x) { return a + x.q; }, 0); });
    if (passes.length === 1 && !gift.passes) q[passes[0].id] = 1;
    var who = me() || { name: '', email: '' };
    function body() {
      return top(opts.title || 'Give it as a gift') +
        '<p class="gx-p">They get a postcard from you with their passes inside. They accept with a free My Pickathon account. Until then, the passes stay with you.</p>' +
        '<fieldset class="gx-fs"><legend>Which passes?</legend>' + passes.map(function (p) { return '<div class="gx-row"><span><b>' + esc(p.n) + '</b>' + (p.sub ? '<small>' + esc(p.sub) + '</small>' : '') + '</span><span class="gx-step"><button type="button" data-q="-1" data-id="' + p.id + '" aria-label="One fewer ' + esc(p.n) + '"' + (q[p.id] ? '' : ' disabled') + '>−</button><output aria-live="polite">' + q[p.id] + '</output><button type="button" data-q="1" data-id="' + p.id + '" aria-label="One more ' + esc(p.n) + '"' + (q[p.id] >= p.max ? ' disabled' : '') + '>+</button></span></div>'; }).join('') + '</fieldset>' +
        '<fieldset class="gx-fs"><legend>Who is it for?</legend><div class="gx-two">' + field('gx-fn', 'First name', (gift.to || {}).first, 'text', ' autocomplete="off" data-focus') + field('gx-ln', 'Last name', (gift.to || {}).last, 'text', ' autocomplete="off"') + '</div>' + field('gx-em', 'Their email', (gift.to || {}).email, 'email', ' autocomplete="off" inputmode="email" autocapitalize="off" spellcheck="false"') + '</fieldset>' +
        (who.name ? '' : '<fieldset class="gx-fs"><legend>From</legend>' + field('gx-from', 'Your name, as it reads on the card', '', 'text', ' autocomplete="name"') + '</fieldset>') +
        '<fieldset class="gx-fs"><legend>A note on the card</legend><label class="gx-f" for="gx-note"><span class="gx-vh">A note on the card</span><textarea id="gx-note" maxlength="240" rows="3" placeholder="Merry Christmas. Pack a tent.">' + esc(gift.note || '') + '</textarea></label></fieldset>' +
        '<fieldset class="gx-fs"><legend>When should it arrive?</legend><div class="gx-chips" role="radiogroup" aria-label="When should it arrive?"><label><input type="radio" name="gx-when" value=""' + (gift.on ? '' : ' checked') + '><span>Right away</span></label><label><input type="radio" name="gx-when" value="date"' + (gift.on ? ' checked' : '') + '><span>On a day I pick</span></label></div>' +
        '<label class="gx-f gx-date" for="gx-on"' + (gift.on ? '' : ' hidden') + '><span>Send on</span><input id="gx-on" type="date" min="' + today() + '" max="' + LAST + '" value="' + esc(gift.on || '') + '"></label></fieldset>' +
        '<div class="gx-prev"><p class="gx-k">Their postcard</p><div id="gx-prevc"></div></div>' +
        '<p class="gx-err" role="alert" hidden></p><div class="gx-foot">' + (gift.passes ? '<button type="button" class="gx-btn gx-btn-o" data-gx="remove">Not a gift</button>' : '') + '<button type="button" class="gx-btn" data-gx="save">' + esc(opts.cta || 'Add the gift') + '</button></div>';
    }
    var sh = sheet(body(), 'Give it as a gift');
    function g() { return { from: who.name ? who : { name: (($('#gx-from', sh) || {}).value || '').trim(), email: '' }, to: { first: $('#gx-fn', sh).value.trim(), last: $('#gx-ln', sh).value.trim(), email: $('#gx-em', sh).value.trim() }, note: $('#gx-note', sh).value.trim().slice(0, 240), on: $('input[name="gx-when"]:checked', sh).value === 'date' ? $('#gx-on', sh).value : '', passes: passes.filter(function (p) { return q[p.id] > 0; }).map(function (p) { return { id: p.id, n: p.n, sub: p.sub || '', q: q[p.id] }; }) }; }
    function prev() { var x = g(); $('#gx-prevc', sh).innerHTML = front({ from: x.from, to: x.to }, true); }
    prev();
    sh.addEventListener('input', function (e) { if (e.target.id === 'gx-fn' || e.target.id === 'gx-from') prev(); if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); var er = $('.gx-err', sh); if (er && !er.hidden) er.hidden = true; });
    sh.addEventListener('change', function (e) { if (e.target.name === 'gx-when') { var on = e.target.value === 'date', d = $('.gx-date', sh); d.hidden = !on; if (on) $('#gx-on', sh).focus(); } });
    sh.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
      if (b.hasAttribute('data-q')) { var id = b.getAttribute('data-id'), p = passes.filter(function (x) { return x.id === id; })[0]; q[id] = Math.max(0, Math.min(p.max, q[id] + (+b.getAttribute('data-q')))); var row = b.closest('.gx-row'); $('output', row).textContent = q[id]; $('[data-q="-1"]', row).disabled = !q[id]; $('[data-q="1"]', row).disabled = q[id] >= p.max; return; }
      var a = b.getAttribute('data-gx');
      if (a === 'remove') { close(); done(null); return; }
      if (a === 'save') {
        var x = g();
        if (!x.passes.length) return err(sh, 'Pick at least one pass to give.', $('.gx-step button[data-q="1"]', sh));
        if (!x.to.first) return err(sh, 'Add their first name. It goes on the postcard.', $('#gx-fn', sh));
        if (!okEmail(x.to.email)) return err(sh, 'Add their email address. That’s where the postcard goes.', $('#gx-em', sh));
        if (!who.name && !x.from.name) return err(sh, 'Add your name for the card.', $('#gx-from', sh));
        if ($('input[name="gx-when"]:checked', sh).value === 'date' && !(x.on >= today() && x.on <= LAST)) return err(sh, 'Pick a day between today and Aug 4, 2027.', $('#gx-on', sh));
        close(); done(x);
      }
    });
  }

  /* ---------- My Pickathon: send passes (a plain transfer, or a gift with the postcard) ---------- */
  function transfer(passes, done) {
    var pick = {};
    var sh = sheet(top('Send passes') + '<p class="gx-p">Pick the passes to send. They accept with a free My Pickathon account and get their own passes. Until they accept, you can take them back.</p>' +
      '<fieldset class="gx-fs"><legend>Which passes?</legend>' + passes.map(function (p, i) { return '<label class="gx-chk"><input type="checkbox" value="' + i + '"' + (i === 0 ? ' data-focus' : '') + '><span><b>' + esc(p.n) + '</b>' + (p.sub ? '<small>' + esc(p.sub) + '</small>' : '') + '</span></label>'; }).join('') + '</fieldset>' +
      '<fieldset class="gx-fs"><legend>Send them as</legend><div class="gx-chips" role="radiogroup" aria-label="Send them as"><label><input type="radio" name="gx-how" value="gift" checked><span>A gift, with a postcard</span></label><label><input type="radio" name="gx-how" value="plain"><span>Just the passes</span></label></div></fieldset>' +
      '<p class="gx-err" role="alert" hidden></p><div class="gx-foot"><button type="button" class="gx-btn" data-gx="next">Next</button></div>', 'Send passes');
    sh.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-gx="next"]') : null; if (!b) return;
      var sel = $$('input[type=checkbox]:checked', sh).map(function (c) { return passes[+c.value]; });
      if (!sel.length) return err(sh, 'Pick at least one pass.', $('input[type=checkbox]', sh));
      var gift = $('input[name="gx-how"]:checked', sh).value === 'gift', merged = {};
      sel.forEach(function (p) { var k = p.n; merged[k] = merged[k] || { id: k, n: p.n, sub: p.sub || '', max: 0 }; merged[k].max++; });
      var L = Object.keys(merged).map(function (k) { return merged[k]; }), all = {}; L.forEach(function (p) { all[p.id] = p.max; });
      if (gift) form(L, { passes: L.map(function (p) { return { id: p.id, q: p.max }; }) }, function (x) { if (x) send(x, true); }, { title: 'Send as a gift', cta: 'Send the gift' });
      else plain(L);
    });
    function plain(L) {
      var s2 = sheet(top('Who gets them?') + '<p class="gx-p">' + esc(L.map(function (p) { return passLine({ n: p.n, q: p.max }); }).join(', ')) + '</p><div class="gx-two">' + field('gx-fn', 'First name', '', 'text', ' data-focus autocomplete="off"') + field('gx-ln', 'Last name', '', 'text', ' autocomplete="off"') + '</div>' + field('gx-em', 'Their email', '', 'email', ' autocomplete="off" inputmode="email" autocapitalize="off" spellcheck="false"') +
        '<p class="gx-err" role="alert" hidden></p><div class="gx-foot"><button type="button" class="gx-btn" data-gx="send">Send the passes</button></div>', 'Who gets them?');
      s2.addEventListener('click', function (e) {
        if (!(e.target.closest && e.target.closest('[data-gx="send"]'))) return;
        var to = { first: $('#gx-fn', s2).value.trim(), last: $('#gx-ln', s2).value.trim(), email: $('#gx-em', s2).value.trim() };
        if (!to.first) return err(s2, 'Add their first name.', $('#gx-fn', s2));
        if (!okEmail(to.email)) return err(s2, 'Add their email address.', $('#gx-em', s2));
        close(); send({ from: me() || { name: 'You' }, to: to, note: '', on: '', passes: L.map(function (p) { return { id: p.id, n: p.n, sub: p.sub, q: p.max }; }) }, false);
      });
    }
    function send(x, gift) {
      x.id = 'g' + Date.now().toString(36); x.gift = gift; x.state = x.on && x.on > today() ? 'scheduled' : 'sent'; x.at = Date.now();
      var all = ls(LSG) || []; all.push(x); ls(LSG, all);
      done && done(x);
      sent(x);
    }
  }
  function link(g) { var o = { f: g.from.name, t: [g.to.first, g.to.last], n: g.note, p: g.passes.map(function (p) { return [p.n, p.sub, p.q]; }) }; var s = btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return location.origin + location.pathname + '?gift=' + s; }
  function sent(g) {
    var when = g.state === 'scheduled' ? 'arrives ' + dayS(g.on) : 'is on its way';
    var sh = sheet(top(g.gift ? 'Gift sent' : 'Passes sent') + '<p class="gx-p">' + esc(first(g.to.first)) + '’s ' + (g.gift ? 'postcard ' + when : 'email ' + when) + ', to ' + esc(g.to.email) + '. The passes move to them when they accept. Until then you can resend it or take it back from My Pickathon.</p>' +
      (g.gift ? front(g, true) : '') + '<div class="gx-foot"><a class="gx-btn gx-btn-o" href="' + esc(link(g)) + '" target="_blank" rel="noopener">Preview it</a><button type="button" class="gx-btn" data-gx-close>Done</button></div>', 'Sent');
    return sh;
  }

  /* ---------- the link: postcard, turn it over, accept (sign in first) ---------- */
  function decode(s) { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var o = JSON.parse(decodeURIComponent(escape(atob(s)))); return { from: { name: String(o.f || '').slice(0, 60) }, to: { first: String((o.t || [])[0] || '').slice(0, 40), last: String((o.t || [])[1] || '').slice(0, 40) }, note: String(o.n || '').slice(0, 240), passes: (o.p || []).slice(0, 12).map(function (p) { return { n: String(p[0] || '').slice(0, 60), sub: String(p[1] || '').slice(0, 80), q: Math.max(1, Math.min(12, +p[2] || 1)) }; }) }; } catch (e) { return null; } }
  var DEMO = { from: { name: 'Wendy' }, to: { first: 'Sam', last: '' }, note: 'Merry Christmas. Pack a tent. You’re going to find your next favorite band.', passes: [{ n: '3-Day Pass', sub: 'Fri–Sun, Aug 6–8, 2027 · camping in the forest included', q: 2 }] };
  function open(g) {
    if (!g) return; var step = 0;
    var sh = sheet('<div class="gx-card-wrap"></div>', 'A gift from ' + first(g.from.name), 'gx-full');
    function draw() {
      var w = $('.gx-card-wrap', sh), u = st().user;
      if (step === 0) w.innerHTML = '<button type="button" class="gx-x gx-x-f" data-gx-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' + front(g) + '<p class="gx-p gx-c">Four days of music in the woods outside Portland, Aug 5–8, 2027.</p><button type="button" class="gx-btn" data-gx="turn" data-focus>Turn it over</button>';
      else if (step === 1) w.innerHTML = back(g) + '<button type="button" class="gx-btn" data-gx="accept">Accept your passes</button><p class="gx-fine">You’ll make a free My Pickathon account to keep them.</p>';
      else if (step === 2) w.innerHTML = '<p class="gx-k">My Pickathon</p><h2 class="gx-big" tabindex="-1">Sign in to keep them</h2><p class="gx-p">No password. We email you a link, and your passes are waiting there.</p>' + field('gx-in', 'Email address', (u && u.email) || '', 'email', ' autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" data-focus') + '<p class="gx-err" role="alert" hidden></p><button type="button" class="gx-btn" data-gx="signin">Email me the link</button><p class="gx-fine">Test mode: this signs you in right here.</p>';
      else w.innerHTML = '<p class="gx-k">My Pickathon</p><h2 class="gx-big" tabindex="-1">They’re yours, ' + esc(first(g.to.first) || 'friend') + '.</h2><p class="gx-p">A gift from ' + esc(first(g.from.name)) + '. Your QR codes show up here closer to the festival.</p>' +
        g.passes.map(function (p) { var o = ''; for (var i = 0; i < p.q; i++) o += '<div class="gx-pass"><span><b>' + esc(p.n) + '</b><small>' + esc(p.sub) + '</small></span><span class="gx-qr" aria-label="QR code later">QR<br>later</span></div>'; return o; }).join('') +
        '<div class="gx-foot gx-col"><button type="button" class="gx-btn" data-gx="explore">See what you’re in for</button><button type="button" class="gx-btn gx-btn-o" data-gx="pass-on">Send one to a friend</button></div><p class="gx-fine">' + esc(first(g.from.name)) + ' gets a note that you accepted.</p>';
      var f = $('[data-focus]', w) || $('[tabindex="-1"]', w); if (f) { try { f.focus(); } catch (e) {} }
      w.scrollTop = 0; try { sh.scrollTop = 0; } catch (e) {}
    }
    draw();
    sh.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-gx]') : null; if (!b) return; var a = b.getAttribute('data-gx'), A = app();
      if (a === 'turn') { step = 1; draw(); }
      else if (a === 'accept') { step = st().user ? 3 : 2; if (step === 3) keep(g); draw(); }
      else if (a === 'signin') { var v = $('#gx-in', sh).value.trim(); if (!okEmail(v)) return err(sh, 'Enter your email address.', $('#gx-in', sh)); if (A) A.setState({ user: { email: v, name: g.to.first || first(v.split('@')[0]) } }); keep(g); step = 3; draw(); }
      else if (a === 'explore') { close(); if (A) A.go('home'); }
      else if (a === 'pass-on') { var L = []; g.passes.forEach(function (p) { for (var i = 0; i < p.q; i++) L.push({ n: p.n, sub: p.sub }); }); transfer(L); }
    });
  }
  function keep(g) { var m = ls(LSM) || []; g.passes.forEach(function (p) { m.push({ name: p.n, qty: p.q, from: g.from.name }); }); ls(LSM, m); }
  var prior = window.pkMyPasses;
  window.pkMyPasses = function () { var m = ls(LSM); if (m && m.length) return m.map(function (x) { return { name: x.name, qty: x.qty }; }); return prior ? prior() : null; };
  function boot() {
    var q = (location.search.match(/[?&]gift=([^&#]+)/) || [])[1]; if (!q) return;
    var g = q === 'demo' ? DEMO : decode(q); if (!g || !g.passes.length) return;
    var tries = 0; (function go() { if (document.getElementById('root') || ++tries > 40) open(g); else setTimeout(go, 150); })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
  window.pkGift = { form: form, transfer: transfer, open: function (g) { open(g || DEMO); }, list: function () { return ls(LSG) || []; }, take: function (id) { var all = (ls(LSG) || []).map(function (x) { if (x.id === id) x.state = 'taken back'; return x; }); ls(LSG, all); }, link: link, demo: DEMO, photo: PHOTO };
})();
