/* pk-checkout: Checkout, round 2 design (Nov 11 2026). Source: tools/tickets_r2/co2.js.
   A full page laid over the site (no tabs, no banners). The order comes from the Tickets page (window.__pkTk2.order()).
   PREVIEW ENDING, KEPT ON PURPOSE: nothing is charged and nothing typed here is sent anywhere. There is no card form and no payment key on this page.
   Stripe's own elements mount in the two labeled blocks: #pk-stripe-express (Express Checkout Element: Apple Pay, Google Pay, Link) and
   #pk-stripe-payment (Payment Element, card only, with postal code).
   What is stored in the browser (localStorage "pk27co"): that checkout is open, the order id, the hold end time, email, first and last name,
   the pay-over-time choice. Never card data. */

/* THE ONE ORDER MODULE: window.pkOrders. Every order call the site makes goes through these four functions and nowhere else.
   The browser cannot call the ticket system (FMS) itself, so in production each one calls a WordPress route that does. HERE EACH ONE ENDS IN THE PREVIEW:
   nothing leaves the browser, nothing is held, nothing is charged. Replace the four bodies; keep the names and shapes. Each returns a Promise.

   start(request)        -> order      hold the passes
     request  { round: 'holiday', items: [{ code: 'WT', id: 'p3', qty: 2 }, ...], recoveredOrderId: null }      code = ticket-system code, id = the site's own id
     order    { id: '<uuid>', status: 'held', expiresAt: '2026-11-19T18:15:00Z',                                 the hold ends at expiresAt (the event's own hold length)
                lines: [{ name: '3-Day Pass', quantity: 2, price: 92000 }], fee: 5125, total: 107625 }          optional, in cents; when present the page prints these, not its own
   get(id)               -> order      after a reload or a sleeping phone; status 'held' | 'expired' | 'completed' | 'gone'
   recover(id)           -> order      the hold ended: a new order made from the old one (recoveredOrderId = id), with a fresh expiresAt
   complete(id, request) -> result     pay
     request  { buyer: { email, first, last }, paymentMethodId: null, plan: false }                              paymentMethodId comes from Stripe (elements.submit, then createPaymentMethod)
     result   { ok: true, orderNumber: 'PK27-48213' }  or  { ok: false, declined: true }                         a failed payment charges nothing and keeps the hold
   A rejected Promise means the call itself failed (network, server); the page says so and offers to try again.
   There is no call to add time to a hold: the ticket system has none. */
if (!window.pkOrders) window.pkOrders = (function () {
  var KEY = 'pk27preview';
  function mins() { return Math.max(1, +((window.PK_TICKETS || {}).holdMinutes) || 10); }
  function rd() { try { return JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function wr(o) { try { if (o) window.localStorage.setItem(KEY, JSON.stringify(o)); else window.localStorage.removeItem(KEY); } catch (e) {} }
  function later(v, ms) { return new Promise(function (res) { setTimeout(function () { res(v); }, ms || 0); }); }
  function held(from) { var o = { id: 'preview-' + Date.now().toString(36), status: 'held', expiresAt: new Date(Date.now() + mins() * 60e3).toISOString(), preview: true }; if (from) o.recoveredOrderId = from; wr(o); return o; }
  return {
    preview: true,
    start: function (request) { return later(held(request && request.recoveredOrderId), 120); },
    get: function (id) { var o = rd(); if (!o || o.id !== id) return later({ id: id, status: 'gone', preview: true }); if (o.status === 'held' && Date.parse(o.expiresAt) <= Date.now()) o.status = 'expired'; return later(o); },
    recover: function (id) { return later(held(id), 120); },
    complete: function (id, request) { return later({ ok: true, preview: true }, 900).then(function (r) { wr(null); return r; }); }
  };
})();

(function () {
  'use strict';
  var K = window.__pkTk2; if (!K) return;
  var LSC = 'pk27co', LATE = 120;
  var O = null, S = null, root = null, timer = null, prevFocus = null, prevTitle = '', pushed = false, saidLate = false;
  var esc = K.esc, ic = K.ic;
  var TERMS = 'All sales are final. Your passes are tied to the event dates and cannot be refunded. If an event date changes or Pickathon cancels, we will email you with your options. Passes can be transferred to a friend from My Pickathon.';
  var PLANTERMS = 'A Pickathon Payment Plan splits your total into a first payment today and monthly payments after that, charged to the card you enter here. Your passes are issued when the plan is complete. Missed payments can cancel the order.' + (K.lastBy && K.lastBy() ? ' Every payment is made' + K.lastBy().replace(', the last', '') + '.' : '');
  function app() { return window.comp || window.__pkApp || null; }
  function $(s) { return root ? root.querySelector(s) : null; }
  function stored() { try { return JSON.parse(window.localStorage.getItem(LSC) || 'null') || {}; } catch (e) { return {}; } }
  function keep() { if (!S) return; try { window.localStorage.setItem(LSC, JSON.stringify({ open: S.stage !== 'done', orderId: S.orderId || '', exp: S.exp || 0, v: S.v, plan: S.plan })); } catch (e) {} }
  function forget(all) { try { if (all) window.localStorage.removeItem(LSC); else { var k = stored(); k.open = false; delete k.exp; delete k.orderId; window.localStorage.setItem(LSC, JSON.stringify(k)); } } catch (e) {} }
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
    h += '<div class="co-hold" id="co-hold">' + ic('clock') + '<span><span id="co-hl">Passes held for </span><b id="co-t" role="timer" aria-live="off"></b></span></div>';
    h += '<div class="co-alert co-holdfail" id="co-holdfail" hidden role="alert" tabindex="-1"><b>We could not hold your passes. Nothing was charged.</b>Check your connection, then try again. <button type="button" class="tk-pill tk-pill-sm" data-a="retry" style="margin-top:8px">Try again</button></div>';
    h += '<p class="tk-vh" role="status" aria-live="polite" id="co-live"></p>';
    h += '<div class="co-main" role="main"><h1 class="tk-vh" id="co-h1" tabindex="-1">Checkout</h1>';
    h += '<div class="co-alert co-errsum" id="co-errsum" hidden role="alert" tabindex="-1"></div>';
    h += '<section class="co-order" aria-labelledby="co-h-o"><div class="tk-paper co-recv"><div class="co-recv-top"><h2 class="tk-d tk-d-card" id="co-h-o">Your order</h2><button type="button" class="tk-pill tk-pill-sm" data-a="back">Change</button></div><hr class="tk-rule2" style="margin:8px 0 2px"><ul class="tk-olines">' + linesHTML() + '</ul><p class="tk-otot"><span>Total <small class="tk-dim">fee included</small></span><b class="tk-num">' + esc(O.totalS) + '</b></p></div></section>';
    h += '<form class="co-form" id="co-form" novalidate>';
    h += '<section aria-labelledby="co-h-d"><h2 class="tk-d tk-d-label co-h2" id="co-h-d">Your details <i>All three are required</i></h2><div class="co-fields">' + field('email', 'Email', 'for your passes and receipt', 'email', 'email', FIELDS[0][1], true) + field('first', 'First name', '', 'given-name', 'text', FIELDS[1][1]) + field('last', 'Last name', '', 'family-name', 'text', FIELDS[2][1]) + '</div></section>';
    if (O.hasPlan) h += '<section aria-labelledby="co-h-w" style="margin-top:22px"><h2 class="tk-d tk-d-label co-h2" id="co-h-w">When to pay</h2><div class="co-plan" role="radiogroup" aria-labelledby="co-h-w"><label class="co-opt"><input type="radio" name="plan" value="0"' + (S.plan !== '1' ? ' checked' : '') + '><span><b>Pay in full today</b>' + esc(O.totalS) + ' now</span></label><label class="co-opt"><input type="radio" name="plan" value="1"' + (S.plan === '1' ? ' checked' : '') + '><span><b>Pay over time</b>' + esc(O.plan) + '</span></label></div></section>';
    h += '<section aria-labelledby="co-h-p" style="margin-top:22px"><h2 class="tk-d tk-d-label co-h2" id="co-h-p">Pay</h2>';
    h += '<div class="co-alert" id="co-declined" hidden role="alert" tabindex="-1" style="margin-bottom:12px"><b>That payment did not go through. Nothing was charged.</b>Your passes are still held. Try another card or a wallet.</div>';
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
    var hold = $('#co-hold'); if (!hold) return;
    if (!S.exp) { $('#co-hl').textContent = S.failed ? 'Your passes are not held yet' : 'Holding your passes\u2026'; $('#co-t').textContent = ''; hold.classList.remove('is-late'); return; }
    var s = left(), late = s <= LATE;
    $('#co-t').textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    hold.classList.toggle('is-late', late); $('#co-hl').textContent = late ? 'Held for ' : 'Passes held for ';
    if (late && s > 0 && !saidLate) { saidLate = true; $('#co-live').textContent = 'Two minutes left on your hold.'; }
    if (!late) saidLate = false;
    if (s <= 0 && !S.expired && !S.busy) expired();
  }
  /* the hold: started, read back after a reload, or made again after it ended. Always through window.pkOrders. */
  function request(from) { return { round: O.round || '', items: (O.items || []).map(function (i) { return { code: i.code || '', id: i.id, qty: i.qty }; }), recoveredOrderId: from || null }; }
  function cents(n) { return K.money(n / 100); }
  function setHold(r, say) {
    if (!S || !root || S.stage !== 'pay') return;
    if (!r || !r.id || !r.expiresAt) { holdFailed(); return; }
    S.orderId = r.id; S.exp = Date.parse(r.expiresAt); S.failed = false; S.expired = false; $('#co-holdfail').hidden = true;
    if (r.lines && r.lines.length) {   // the ticket system's own lines and total win over the page's
      O.lines = r.lines.map(function (l) { return { label: (l.quantity > 1 || /Pass|Ticket|Parking/.test(l.name) ? l.quantity + ' \u00d7 ' : '') + l.name, price: cents(l.price) }; }); O.unadded = false;
      if (typeof r.fee === 'number') O.feeS = cents(r.fee); if (typeof r.total === 'number') { O.totalS = cents(r.total); O.totalNum = r.total / 100; }
      var ul = root.querySelector('.co-recv .tk-olines'); if (ul) { ul.innerHTML = linesHTML(); root.querySelector('.co-recv .tk-otot b').textContent = O.totalS; K.guard(root); } $('#co-pay').textContent = payLabel();
    }
    keep(); tick();
    if (say && left() > 0) $('#co-live').textContent = 'Your passes are held again for ' + Math.round(left() / 60) + ' minutes.';
    if (left() <= 0) expired();
  }
  function holdFailed() { if (!S || !root || S.stage !== 'pay') return; S.failed = true; S.exp = 0; tick(); var f = $('#co-holdfail'); f.hidden = false; try { f.focus(); } catch (e) {} }
  function startHold(from, say) { S.failed = false; S.exp = 0; tick(); var p; try { p = from ? window.pkOrders.recover(from) : window.pkOrders.start(request(null)); } catch (e) { p = Promise.reject(e); } Promise.resolve(p).then(function (r) { setHold(r, say); }, holdFailed); }
  function expired() {   // nothing typed is cleared
    S.expired = true; keep();
    var sh = K.sheet('<div class="tk-sheet-top"><h2 class="tk-d tk-d-card">Your hold ended</h2></div><p>Nothing was charged. Your order and what you typed are saved.</p><button type="button" class="tk-pill tk-pill-cream tk-sheet-go" data-close data-focus>Hold my passes again</button>', 'Your hold ended', { modal: true });
    sh.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-close]') && S) startHold(S.orderId || '', true); });
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
  function declined() { S.busy = false; var p = $('#co-pay'); p.removeAttribute('aria-busy'); p.textContent = payLabel(); var d = $('#co-declined'); d.hidden = false; title('Payment not taken · Checkout'); try { d.scrollIntoView({ block: 'center' }); d.focus(); } catch (e) {} }
  function done(num) {
    S.busy = false; S.stage = 'done'; S.num = num || ''; clearInterval(timer); timer = null; forget(true);
    render(); root.scrollTop = 0; try { $('#co-h1').focus(); } catch (e) {}
    try { if (K.clear && O.record) K.clear(); } catch (e) {}
    var a = app(); try { if (a) a.setState({ paid: true }); } catch (e) {}
  }
  function submit(e) {
    e.preventDefault(); if (!S || S.busy || S.stage !== 'pay') return;
    read(); $('#co-declined').hidden = true; if (!check()) return;
    if (!S.orderId || !S.exp) { holdFailed(); return; }
    if (left() <= 0) { expired(); return; }
    S.busy = true; var p = $('#co-pay'); p.setAttribute('aria-busy', 'true'); p.textContent = payLabel(); $('#co-live').textContent = 'Paying. Do not close this page.';
    var req = { buyer: { email: String(S.v.email).trim(), first: String(S.v.first).trim(), last: String(S.v.last).trim() }, paymentMethodId: null, plan: S.plan === '1' && !!O.hasPlan };
    var pr; try { pr = window.pkOrders.complete(S.orderId, req); } catch (x) { pr = Promise.reject(x); }
    Promise.resolve(pr).then(function (r) { if (!S || !root) return; if (r && r.ok) done(r.orderNumber); else declined(); }, function () { if (S && root) declined(); });
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
    if (a === 'retry') { startHold('', false); return; }
    if (a === 'terms') { var tm = $('#co-terms'), o = tm.hidden; tm.hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false'); return; }
    if (a === 'mine' || a === 'trip') { var ap = app(); close(false, true); if (ap) { try { if (a === 'trip') ap.go('info'); else ap.reset('mine'); } catch (x) {} } }
  }
  function change(e) { if (!S) return; if (e.target.name === 'plan') { S.plan = e.target.value; keep(); $('#co-pay').textContent = payLabel(); var l = $('#co-planterms-l'); if (l) l.hidden = S.plan !== '1'; } }
  function input(e) { if (S && e.target && e.target.name && S.stage === 'pay') { read(); var f = $('#co-f-' + e.target.name); if (f && f.classList.contains('is-err')) { var r = FIELDS.filter(function (x) { return x[0] === e.target.name; })[0]; if (r && r[2].test(e.target.value.trim())) { f.classList.remove('is-err'); $('#co-e-' + r[0]).hidden = true; e.target.setAttribute('aria-invalid', 'false'); } } } }
  function open(order, resume) {
    if (K.gate && K.gate()) { if (K.refresh) K.refresh(); return false; }   // no checkout on prices the ticket system did not send
    if (root) close(false);
    O = norm(order); var k = stored();
    prevFocus = document.activeElement; prevTitle = document.title;
    S = { stage: 'pay', v: Object.assign({}, k.v || {}), plan: O.hasPlan && k.plan === '1' ? '1' : '0', busy: false, expired: false, failed: false, orderId: '', exp: 0 };
    root = document.createElement('div'); root.id = 'pk-co'; root.className = 'tk2'; root.setAttribute('aria-label', 'Checkout');
    document.body.appendChild(root);
    var r = document.getElementById('root'); if (r) { r.setAttribute('inert', ''); r.setAttribute('aria-hidden', 'true'); }
    document.documentElement.style.overflow = 'hidden';
    root.addEventListener('click', click); root.addEventListener('change', change); root.addEventListener('input', input); root.addEventListener('submit', submit);
    document.addEventListener('keydown', onKey, true); window.addEventListener('popstate', onPop);
    try { history.pushState({ pk: (history.state && history.state.pk) || 1, co: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    render(); K.where('checkout');
    if (resume && k.orderId) {   // same order, same clock: ask for it again
      S.orderId = k.orderId; S.exp = k.exp || 0; keep(); tick(); var g; try { g = window.pkOrders.get(k.orderId); } catch (e) { g = Promise.reject(e); }
      Promise.resolve(g).then(function (r) { if (!S || !root) return; if (r && (r.status === 'held' || r.status === 'expired') && r.expiresAt) setHold(r, false); else startHold('', false); }, function () { if (S && root && !S.exp) holdFailed(); });
    } else { keep(); startHold('', false); }
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
      if (stage === 'late') { S.exp = Date.now() + (LATE - 2) * 1000; tick(); return; }
      if (stage === 'expired') { S.exp = Date.now() - 1000; tick(); return; }
      if (stage === 'done') { read(); if (!S.v.email) S.v.email = 'you@example.com'; done(''); }
    },
    close: function () { close(true); }
  };
})();
