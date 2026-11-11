/* pk-checkout: Checkout, round 2 design (Nov 11 2026). Source: tools/tickets_r2/co2.js.
   A full page laid over the site (no tabs, no banners). The order comes from the Tickets page (window.__pkTk2.order()).
   PREVIEW ENDING, KEPT ON PURPOSE: nothing is charged and nothing typed here is sent anywhere. There is no card form and no payment key on this page.
   Stripe's own elements mount in the two labeled blocks: #pk-stripe-express (Express Checkout Element: Apple Pay, Google Pay, Link) and
   #pk-stripe-payment (Payment Element, card only, with postal code).
   THE ONE PLACE PAYMENT PLUGS IN:
     window.pkStripePay(order, buyer) -> a Promise of { ok: true, orderNumber: 'PK27-48213' }   paid; the page shows "You're in."
                                                      { ok: false, declined: true }             card declined; nothing charged; the page says so and keeps the hold
       order = { round, items: [{ id, qty, unit, name }], sub, feeRate, totalNum, plan: true|false, record }   (ids are the site's ticket ids; the feed map turns them into ticket-system codes)
       buyer = { email, first, last }
     Here it is the preview: it waits a moment and answers { ok: true, preview: true }.
   THE HOLD is kept by this page for now (15 minutes from the moment Checkout opens, 10 more on request). The start and end times are stored,
   so a reload or a sleeping phone picks the clock up where it was. The ticket system must own the real hold: start, extend and expire.
   What is stored in the browser (localStorage "pk27co"): that checkout is open, the hold end time, email, first and last name, the pay-over-time choice. Never card data. */
(function () {
  'use strict';
  var K = window.__pkTk2; if (!K) return;
  var LSC = 'pk27co', HOLD = 15 * 60e3, MORE = 10 * 60e3, LATE = 120;
  var O = null, S = null, root = null, timer = null, prevFocus = null, prevTitle = '', pushed = false, saidLate = false;
  var esc = K.esc, ic = K.ic;
  var TERMS = 'All sales are final. Your passes are tied to the event dates and cannot be refunded. If an event date changes or Pickathon cancels, we will email you with your options. Passes can be transferred to a friend from My Pickathon.';
  var PLANTERMS = 'A Pickathon Payment Plan splits your total into a first payment today and monthly payments after that, charged to the card you enter here. Your passes are issued when the plan is complete. Missed payments can cancel the order.';
  if (!window.pkStripePay) window.pkStripePay = function () { return new Promise(function (res) { setTimeout(function () { res({ ok: true, preview: true }); }, 900); }); };
  function app() { return window.comp || window.__pkApp || null; }
  function $(s) { return root ? root.querySelector(s) : null; }
  function stored() { try { return JSON.parse(window.localStorage.getItem(LSC) || 'null') || {}; } catch (e) { return {}; } }
  function keep() { if (!S) return; try { window.localStorage.setItem(LSC, JSON.stringify({ open: S.stage !== 'done', exp: S.exp, start: S.start, v: S.v, plan: S.plan })); } catch (e) {} }
  function forget(all) { try { if (all) window.localStorage.removeItem(LSC); else { var k = stored(); k.open = false; delete k.exp; delete k.start; window.localStorage.setItem(LSC, JSON.stringify(k)); } } catch (e) {} }
  function norm(o) {   // the old builder (festival season, ?old=tickets) hands over { lines: [{ q, n, t }], fee, total }
    o = Object.assign({}, o || {});
    o.lines = (o.lines || []).map(function (l) { return { label: l.label || (l.q + ' × ' + l.n), price: l.price || l.t || '' }; });
    o.feeS = o.feeS || o.fee || ''; o.totalS = o.totalS || o.total || ''; o.feeRate = o.feeRate || 0.05;
    if (window.PK_PAY_LATER === false) o.hasPlan = false;
    return o;
  }
  function linesHTML() {
    return O.lines.map(function (l) { return '<li><span>' + esc(l.label) + '</span><span class="tk-num">' + esc(l.price) + '</span></li>'; }).join('') +
      (O.unadded ? '<li class="fee"><span>Parking or shuttle: not added</span><span></span></li>' : '') +
      '<li class="fee"><span>Fee, ' + (O.feeRate * 100) + '%</span><span class="tk-num">' + esc(O.feeS) + '</span></li>';
  }
  function field(id, label, small, ac, type, msg, wide) {
    return '<div class="co-f' + (wide ? ' co-f-w' : '') + '" id="co-f-' + id + '"><label for="co-' + id + '">' + label + (small ? ' <small>' + small + '</small>' : '') + '</label><input id="co-' + id + '" name="' + id + '" type="' + (type || 'text') + '" autocomplete="' + ac + '"' + (type === 'email' ? ' inputmode="email" autocapitalize="off" spellcheck="false"' : '') + ' required aria-required="true" aria-describedby="co-e-' + id + '" value="' + esc(S.v[id] || '') + '"><p class="co-f-e" id="co-e-' + id + '" hidden>' + ic('info', 'tk-ic-sm') + '<span>' + msg + '</span></p></div>';
  }
  var FIELDS = [['email', 'Enter your email so we can send your passes', /^[^@\s]+@[^@\s]+\.[^@\s]+$/], ['first', 'Enter your first name', /\S/], ['last', 'Enter your last name', /\S/]];
  function header(done) { return '<header class="co-hdr">' + (done ? '<span></span>' : '<button type="button" class="co-back" data-a="back">' + ic('chev', 'tk-ic-sm') + 'Your order</button>') + '<img src="logo27-gold.png" alt="Pickathon 2027" width="84" height="44"><p class="co-sec">' + ic('lock', 'tk-ic-sm') + '<span>Secure</span></p></header>'; }
  function payHTML() {
    var h = header(false);
    h += '<div class="co-hold" id="co-hold">' + ic('clock') + '<span><span id="co-hl">Passes held for </span><b id="co-t" role="timer" aria-live="off"></b></span><button type="button" class="tk-pill tk-pill-sm" id="co-more" data-a="more">Need more time?</button></div>';
    h += '<p class="tk-vh" role="status" aria-live="polite" id="co-live"></p>';
    h += '<div class="co-main" role="main"><h1 class="tk-vh" id="co-h1" tabindex="-1">Checkout</h1>';
    h += '<div class="co-alert co-errsum" id="co-errsum" hidden role="alert" tabindex="-1"></div>';
    h += '<section class="co-order" aria-labelledby="co-h-o"><div class="tk-paper co-recv"><div class="co-recv-top"><h2 class="tk-d tk-d-card" id="co-h-o">Your order</h2><button type="button" class="tk-pill tk-pill-sm" data-a="back">Change</button></div><hr class="tk-rule2" style="margin:8px 0 2px"><ul class="tk-olines">' + linesHTML() + '</ul><p class="tk-otot"><span>Total <small class="tk-dim">fee included</small></span><b class="tk-num">' + esc(O.totalS) + '</b></p></div></section>';
    h += '<form class="co-form" id="co-form" novalidate>';
    h += '<section aria-labelledby="co-h-d"><h2 class="tk-d tk-d-label co-h2" id="co-h-d">Your details <i>All three are required</i></h2><div class="co-fields">' + field('email', 'Email', 'for your passes and receipt', 'email', 'email', FIELDS[0][1], true) + field('first', 'First name', '', 'given-name', 'text', FIELDS[1][1]) + field('last', 'Last name', '', 'family-name', 'text', FIELDS[2][1]) + '</div></section>';
    if (O.hasPlan) h += '<section aria-labelledby="co-h-w" style="margin-top:22px"><h2 class="tk-d tk-d-label co-h2" id="co-h-w">When to pay</h2><div class="co-plan" role="radiogroup" aria-labelledby="co-h-w"><label class="co-opt"><input type="radio" name="plan" value="0"' + (S.plan !== '1' ? ' checked' : '') + '><span><b>Pay in full today</b>' + esc(O.totalS) + ' now</span></label><label class="co-opt"><input type="radio" name="plan" value="1"' + (S.plan === '1' ? ' checked' : '') + '><span><b>Pay over time</b>' + esc(O.plan) + '</span></label></div></section>';
    h += '<section aria-labelledby="co-h-p" style="margin-top:22px"><h2 class="tk-d tk-d-label co-h2" id="co-h-p">Pay</h2>';
    h += '<div class="co-alert" id="co-declined" hidden role="alert" tabindex="-1" style="margin-bottom:12px"><b>Your card was declined. Nothing was charged.</b>Your passes are still held. Try another card or a wallet.</div>';
    h += '<p class="co-prev">Preview checkout. Nothing is charged and nothing you type here is sent anywhere.</p>';
    h += '<div class="co-stripe co-stripe-wallet" id="pk-stripe-express" data-stripe="express-checkout"><span><b>Apple Pay · Google Pay · Link</b>Stripe’s own wallet buttons load here, only the ones this device supports.</span></div>';
    h += '<p class="co-or" id="co-or">or pay by card</p>';
    h += '<div class="co-stripe co-stripe-card" id="pk-stripe-payment" data-stripe="payment-element"><span><b>Stripe card field</b>Card number, expiry, security code and ZIP.<br>Loaded from Stripe. Card details never touch pickathon.com.<br>Stripe shows its own errors inside this field.</span></div>';
    h += '<button class="tk-pill tk-pill-gold co-pay" type="submit" id="co-pay"></button>';
    h += '<p class="tk-fine"><b>All sales final.</b> Send a pass to a friend any time from My Pickathon. By paying you agree to the <button type="button" class="tk-tlink" data-a="terms" aria-expanded="false" aria-controls="co-terms">ticket terms</button><span id="co-planterms-l"' + (O.hasPlan && S.plan === '1' ? '' : ' hidden') + '> and the payment plan terms</span>.</p>';
    h += '<div class="co-terms" id="co-terms" hidden><p>' + esc(TERMS) + '</p>' + (O.hasPlan ? '<p style="margin-top:8px">' + esc(PLANTERMS) + '</p>' : '') + '</div>';
    h += '</section></form></div>';
    return h;
  }
  function doneHTML() {
    var days = K.days, on = O.strip || [], h = header(true);
    h += '<div class="co-done" role="main"><div class="tk-paper co-done-p"><img src="logo27-bat.png" alt="Pickathon 2027" width="700" height="260"><h1 class="tk-d tk-d-hero" id="co-h1" tabindex="-1">You’re in.</h1>';
    if (O.dates) h += '<p class="tk-d tk-d-card co-done-d">' + esc(O.dates) + '</p>';
    h += '<p class="co-done-k" style="margin-top:2px">Pendarvis Farm, Happy Valley, Oregon</p>';
    if (on.length) h += '<span class="tk-days" aria-hidden="true">' + days.map(function (d, i) { return '<i class="' + (i ? '' : 'w ') + (on[i] ? 'on' : '') + '">' + d[1] + '</i>'; }).join('') + '</span>';
    h += '<ul class="tk-olines">' + linesHTML() + '</ul><p class="tk-otot"><span>' + (S.plan === '1' && O.hasPlan ? 'Total' : 'Paid') + '</span><b class="tk-num">' + esc(O.totalS) + '</b></p>';
    if (S.plan === '1' && O.hasPlan) h += '<p class="co-done-k" style="margin-top:4px">' + esc(O.plan) + '</p>';
    h += '<p class="co-done-k">' + (S.num ? 'Order ' + esc(S.num) + ' · Receipt sent to ' + esc(S.v.email || '') : 'Preview checkout. Nothing was charged and no email was sent.') + '</p></div>';
    h += '<p class="co-done-s"><b>Your passes are in My Pickathon.</b> Nothing to print. Bring ID in August.</p>';
    h += '<div class="co-done-n"><button type="button" class="tk-pill tk-pill-cream" data-a="trip">Plan your trip</button><button type="button" class="tk-pill" data-a="mine">My passes</button><button type="button" class="tk-pill" data-a="mine">Send a pass to a friend</button></div></div>';
    return h;
  }
  function payLabel() { return S.busy ? 'Paying…' : (S.plan === '1' && O.hasPlan ? 'Start my payment plan' : 'Pay ' + O.totalS); }
  function title(t) { try { document.title = t; } catch (e) {} }
  function render() {
    root.innerHTML = S.stage === 'done' ? doneHTML() : payHTML(); K.guard(root);
    if (S.stage === 'done') { title('You’re in · Pickathon 2027'); return; }
    title('Checkout · Pickathon 2027'); $('#co-pay').textContent = payLabel(); saidLate = false; tick();
  }
  function left() { return Math.max(0, Math.round((S.exp - Date.now()) / 1000)); }
  function tick() {
    if (!S || !root || S.stage !== 'pay') return;
    var s = left(), late = s <= LATE, hold = $('#co-hold'); if (!hold) return;
    $('#co-t').textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    hold.classList.toggle('is-late', late); $('#co-more').textContent = late ? 'Keep them 10 more minutes' : 'Need more time?'; $('#co-hl').textContent = late ? 'Held for ' : 'Passes held for ';
    if (late && s > 0 && !saidLate) { saidLate = true; $('#co-live').textContent = 'Two minutes left on your hold.'; }
    if (!late) saidLate = false;
    if (s <= 0 && !S.expired && !S.busy) expired();
  }
  function expired() {   // nothing typed is cleared
    S.expired = true; keep();
    var sh = K.sheet('<div class="tk-sheet-top"><h2 class="tk-d tk-d-card">Your hold ended</h2></div><p>Nothing was charged. Your order and what you typed are saved.</p><button type="button" class="tk-pill tk-pill-cream tk-sheet-go" data-close data-focus>Hold my passes again</button>', 'Your hold ended', { modal: true });
    sh.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]') && S) { S.expired = false; S.start = Date.now(); S.exp = S.start + HOLD; keep(); tick(); var l = $('#co-live'); if (l) l.textContent = 'Your passes are held again for 15 minutes.'; } });
  }
  function read() { if (!S || !root) return; FIELDS.forEach(function (r) { var e = $('#co-' + r[0]); if (e) S.v[r[0]] = e.value; }); keep(); }
  function check() {
    var bad = [];
    FIELDS.forEach(function (r) { var ok = r[2].test(String(S.v[r[0]] || '').trim()); $('#co-f-' + r[0]).classList.toggle('is-err', !ok); $('#co-e-' + r[0]).hidden = ok; $('#co-' + r[0]).setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) bad.push(r); });
    var e = $('#co-errsum'); e.hidden = !bad.length;
    if (bad.length) { title(bad.length + ' to fix · Checkout'); e.innerHTML = '<b>' + bad.length + (bad.length > 1 ? ' things' : ' thing') + ' to fix before you pay</b>' + bad.map(function (r) { return '<a href="#co-' + r[0] + '" data-f="' + r[0] + '">' + r[1] + '</a>'; }).join(''); K.guard(e); try { root.scrollTop = 0; e.focus(); } catch (x) {} }
    else title('Checkout · Pickathon 2027');
    return !bad.length;
  }
  function declined() { S.busy = false; var p = $('#co-pay'); p.removeAttribute('aria-busy'); p.textContent = payLabel(); var d = $('#co-declined'); d.hidden = false; title('Card declined · Checkout'); try { d.scrollIntoView({ block: 'center' }); d.focus(); } catch (e) {} }
  function done(num) {
    S.busy = false; S.stage = 'done'; S.num = num || ''; clearInterval(timer); timer = null; forget(true);
    render(); root.scrollTop = 0; try { $('#co-h1').focus(); } catch (e) {}
    try { if (K.clear && O.record) K.clear(); } catch (e) {}
    var a = app(); try { if (a) a.setState({ paid: true }); } catch (e) {}
  }
  function submit(e) {
    e.preventDefault(); if (!S || S.busy || S.stage !== 'pay') return;
    read(); $('#co-declined').hidden = true; if (!check()) return;
    if (left() <= 0) { expired(); return; }
    S.busy = true; var p = $('#co-pay'); p.setAttribute('aria-busy', 'true'); p.textContent = payLabel(); $('#co-live').textContent = 'Paying. Do not close this page.';
    var order = { round: O.round, items: O.items || [], sub: O.sub, feeRate: O.feeRate, totalNum: O.totalNum, plan: S.plan === '1' && !!O.hasPlan, record: O.record || null };
    var buyer = { email: String(S.v.email).trim(), first: String(S.v.first).trim(), last: String(S.v.last).trim() };
    Promise.resolve().then(function () { return window.pkStripePay(order, buyer); }).then(function (r) { if (!S || !root) return; if (r && r.ok) done(r.orderNumber); else declined(); }, function () { if (S && root) declined(); });
  }
  function close(restore, viaPop) {
    if (!root) return;
    if (S && S.stage === 'pay') { read(); forget(false); }
    clearInterval(timer); timer = null; K.closeSheet(true);
    root.remove(); root = null; S = null; O = null;
    var r = document.getElementById('root'); if (r) { r.removeAttribute('inert'); r.removeAttribute('aria-hidden'); }
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey, true); window.removeEventListener('popstate', onPop);
    if (prevTitle) title(prevTitle);
    if (pushed && !viaPop) { pushed = false; var a = app(); try { if (a) a._skipPop = 1; history.back(); } catch (e) {} }
    pushed = false; K.where('tickets');
    if (restore && prevFocus && prevFocus.focus && document.contains(prevFocus)) { try { prevFocus.focus(); } catch (e) {} }
  }
  function onPop() { close(true, true); }
  function onKey(e) { if (e.key === 'Tab' && root && !root.contains(document.activeElement) && !document.querySelector('.tk-scrim')) { e.preventDefault(); var f = root.querySelector('button,input,a'); if (f) f.focus(); } }
  function click(e) {
    var b = e.target.closest ? e.target.closest('[data-a],[data-f]') : null; if (!b || !S) return;
    var f = b.getAttribute('data-f'); if (f) { e.preventDefault(); var t = $('#co-' + f); if (t) { t.scrollIntoView({ block: 'center' }); t.focus(); } return; }
    var a = b.getAttribute('data-a');
    if (a === 'back') { if (!S.busy) close(true); return; }
    if (a === 'more') { S.exp = Math.max(S.exp, Date.now()) + MORE; keep(); tick(); $('#co-live').textContent = 'Ten minutes added. Your passes are held.'; return; }
    if (a === 'terms') { var tm = $('#co-terms'), o = tm.hidden; tm.hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false'); return; }
    if (a === 'mine' || a === 'trip') { var ap = app(); close(false, true); if (ap) { try { if (a === 'trip') ap.go('info'); else ap.reset('mine'); } catch (x) {} } }
  }
  function change(e) { if (!S) return; if (e.target.name === 'plan') { S.plan = e.target.value; keep(); $('#co-pay').textContent = payLabel(); var l = $('#co-planterms-l'); if (l) l.hidden = S.plan !== '1'; } }
  function input(e) { if (S && e.target && e.target.name && S.stage === 'pay') { read(); var f = $('#co-f-' + e.target.name); if (f && f.classList.contains('is-err')) { var r = FIELDS.filter(function (x) { return x[0] === e.target.name; })[0]; if (r && r[2].test(e.target.value.trim())) { f.classList.remove('is-err'); $('#co-e-' + r[0]).hidden = true; e.target.setAttribute('aria-invalid', 'false'); } } } }
  function open(order, resume) {
    if (root) close(false);
    O = norm(order); var k = stored(), now = Date.now();
    prevFocus = document.activeElement; prevTitle = document.title;
    S = { stage: 'pay', v: Object.assign({}, k.v || {}), plan: O.hasPlan && k.plan === '1' ? '1' : '0', busy: false, expired: false };
    if (resume && k.exp) { S.exp = k.exp; S.start = k.start || k.exp - HOLD; } else { S.start = now; S.exp = now + HOLD; }
    root = document.createElement('div'); root.id = 'pk-co'; root.className = 'tk2'; root.setAttribute('aria-label', 'Checkout');
    document.body.appendChild(root);
    var r = document.getElementById('root'); if (r) { r.setAttribute('inert', ''); r.setAttribute('aria-hidden', 'true'); }
    document.documentElement.style.overflow = 'hidden';
    root.addEventListener('click', click); root.addEventListener('change', change); root.addEventListener('input', input); root.addEventListener('submit', submit);
    document.addEventListener('keydown', onKey, true); window.addEventListener('popstate', onPop);
    try { history.pushState({ pk: (history.state && history.state.pk) || 1, co: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    render(); keep(); K.where('checkout');
    timer = setInterval(tick, 1000);
    try { $('#co-h1').focus({ preventScroll: true }); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  window.addEventListener('pageshow', function () { tick(); });
  window.__pkCheckout = {
    open: function (order) { open(order, false); },
    resume: function () { var k = stored(); if (!k.open || root) return false; var o = K.order(); if (!o.ready) { forget(false); return false; } open(o, true); return true; },   // after a reload: same order, same details, the same clock
    show: function (stage) {   // staff and test hook: 'error' (declined), 'late' (two minutes left), 'expired', 'done'
      if (!S || !root) return;
      if (stage === 'error') { declined(); return; }
      if (stage === 'late') { S.exp = Date.now() + (LATE - 2) * 1000; keep(); tick(); return; }
      if (stage === 'expired') { S.exp = Date.now() - 1000; keep(); tick(); return; }
      if (stage === 'done') { read(); if (!S.v.email) S.v.email = 'you@example.com'; done(''); }
    },
    close: function () { close(true); }
  };
})();
