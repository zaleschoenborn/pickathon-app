/* pk-tk2: Tickets, round 2 design (Nov 11 2026). Source: tools/tickets_r2/tk2.js, spliced into index.html by tools/tickets_r2/build.py.
   The page is drawn into <div id="tk2" data-pk-own> (the app's renderer leaves the inside of a data-pk-own element alone).
   Every price, sale date and round name comes from window.pkTix() (the pk-ticket-settings block) or the live price feed. None is typed here.
   The order is ONE record, kept in the browser (localStorage "pk27order") so a reload, a tab switch or a sleeping phone loses nothing.

   RETURNING BUYERS ("Same again"). OFF by default: the switch is sameAgain in the pk-ticket-settings block. While it is off the sign-in line
   and the shortcut never show. When it is on, the ticket system must supply the signed-in buyer's last order through ONE function:
     window.pkLastOrder()  ->  null (not signed in, or no earlier order)
                           ->  { year: 2026,                      // festival year of that order (shown nowhere yet, kept for the record)
                                 pass: 'p4' | 'p3' | 'd2' | 'd1',  // 4 days, 3 days, Sat + Sun, one day
                                 day:  'dthu' | 'dfri' | 'dsat' | 'dsun' | null,   // only with pass 'd1'
                                 adult: 2, teen: 0, kid: 0,        // people
                                 wed: false,                       // Wednesday early arrival (4-day only)
                                 sleep: 'tent' | 'wcar' | 'scar' | 'wrv' | 'none', // tent, car camp Willow, car camp South, RV Willow, not camping
                                 go: 'drive' | 'shuttle' | 'bike' | 'drop' | 'later',
                                 car: 1,                           // cars to park (with go 'drive')
                                 patron: false }                   // one adult holds a Patron Pass
   Here it returns null, so the page shows the sign-in line. It must answer at once (no waiting): fetch the order when the buyer signs in,
   keep it, then call window.__pkTk2.refresh() and the "Welcome back" slip appears. It never calls the ticket system by itself.
   PASSES ALREADY BOUGHT: window.pkMyPasses() -> null, or [{ name: '3-Day Pass', qty: 2 }]. Null here; a signed-in buyer sees a slip without a count. */
(function () {
  'use strict';
  if (!window.pkLastOrder) window.pkLastOrder = function () { return null; };
  if (!window.pkMyPasses) window.pkMyPasses = function () { return null; };

  var FEE = 0.05, LS = 'pk27order', SSW = 'pk27where', LSR = 'pk27remind', LSS = 'pk27saved';
  var YEAR = 2027, DAYS = [['w', 'W', 'Wed', 'Wednesday', 'Aug 4'], ['dthu', 'Th', 'Thu', 'Thursday', 'Aug 5'], ['dfri', 'Fr', 'Fri', 'Friday', 'Aug 6'], ['dsat', 'Sa', 'Sat', 'Saturday', 'Aug 7'], ['dsun', 'Su', 'Sun', 'Sunday', 'Aug 8']];
  var DAY = {}; DAYS.forEach(function (d) { DAY[d[0]] = d; });
  var PARK = { dthu: 'pthu', dfri: 'pfri', dsat: 'psat', dsun: 'psun' };
  var N = { p4: '4-Day Pass', p3: '3-Day Pass', d2: 'Sat + Sun Ticket', dthu: 'Thursday Ticket', dfri: 'Friday Ticket', dsat: 'Saturday Ticket', dsun: 'Sunday Ticket' };
  var NS = { p4: '4-Day', p3: '3-Day', d2: 'Sat + Sun', dthu: 'Thursday', dfri: 'Friday', dsat: 'Saturday', dsun: 'Sunday' };
  var SLEEPN = { wcar: 'Car camp, Willow Camp', scar: 'Car camp, South Camp', wrv: 'RV, Willow Camp' };
  var BLANK = { pass: null, day: null, adult: 1, teen: 0, kid: 0, wed: false, sleep: 'tent', go: 'later', car: 1, patron: false };
  var OK = { pass: ['p4', 'p3', 'd2', 'd1'], day: ['dthu', 'dfri', 'dsat', 'dsun'], sleep: ['tent', 'wcar', 'scar', 'wrv', 'none'], go: ['later', 'drive', 'shuttle', 'bike', 'drop'] };

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function oct(cx, cy, r) { var p = [], k = r * 0.414; [[-k, -r], [k, -r], [r, -k], [r, k], [k, r], [-k, r], [-r, k], [-r, -k]].forEach(function (a, i) { p.push((i ? 'L' : 'M') + (cx + a[0]).toFixed(1) + ' ' + (cy + a[1]).toFixed(1)); }); return p.join(' ') + ' Z'; }
  function hex(cx, cy, r) { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i + Math.PI / 6; p.push((i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' ') + ' Z'; }
  /* utility glyphs (the design kit's small one-color set): rows and buttons only, never enlarged */
  var I = {
    tent: ['M12 3 L22 20 L2 20 Z M12 10.5 L15.4 20 L8.6 20 Z', 'M10.6 2 L12 4.4 L13.4 2 L14.6 2.8 L12 7 L9.4 2.8 Z'],
    car: ['M2 16.5 L2 12 L5 11 L7.5 6 L16.5 6 L19 11 L22 12 L22 16.5 Z M8.8 7.9 L15.2 7.9 L16.7 11 L7.3 11 Z', hex(6.6, 17.6, 2.7), hex(17.4, 17.6, 2.7)],
    clock: [oct(12, 12, 9.6) + ' M11 6.4 h2 v5.1 l3.6 2.5 l-1.2 1.7 L11 12.6 Z'],
    plus: ['M10.5 4 h3 v6.5 h6.5 v3 h-6.5 v6.5 h-3 v-6.5 H4 v-3 h6.5 Z'],
    minus: ['M4 10.5 h16 v3 h-16 Z'],
    check: ['M3.6 12.6 L6.2 10 L10 13.6 L17.6 5.4 L20.6 8 L10.2 19.2 Z'],
    chev: ['M8 4 L16.6 12 L8 20 L6 18 L12 12 L6 6 Z'],
    lock: ['M6 10 V7 L8.6 3.4 h6.8 L18 7 v3 h2 v11 H4 V10 Z M8.6 10 V7.6 l1.2 -1.6 h4.4 l1.2 1.6 V10 Z'],
    info: [oct(12, 12, 9.6) + ' M11 6.4 h2 v2.2 h-2 Z M11 10.4 h2 v7.2 h-2 Z'],
    x: ['M5.5 4 L12 10.5 L18.5 4 L20 5.5 L13.5 12 L20 18.5 L18.5 20 L12 13.5 L5.5 20 L4 18.5 L10.5 12 L4 5.5 Z'],
    up: ['M12 4.5 L20 18.5 L4 18.5 Z']
  };
  function ic(n, c, st) { return '<svg class="tk-ic ' + (c || '') + '"' + (st ? ' style="' + st + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + I[n].map(function (d) { return '<path fill-rule="evenodd" d="' + d + '"/>'; }).join('') + '</svg>'; }
  /* the site styles every p, li and label inside main (size, color, width) and every non-heading's font; these two class names are its own opt-outs */
  function guard(r) { if (!r) return; $$('p,li,label', r).forEach(function (e) { e.classList.add('pk-krtk'); }); $$('.tk-d', r).forEach(function (e) { e.classList.add('pkp-head'); }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function app() { return window.comp || window.__pkApp || null; }
  function site() { var a = app(); return (a && a.state) || window.__pkSt || {}; }

  /* ---------- the sale: rounds, dates and prices, all from pkTix ---------- */
  var T = null;
  function readTix() { var s = site(); T = window.pkTix(s.today, s.season || 'off'); return T; }
  function when() { var s = site(); if ((s.season || 'off') !== 'off' || T.open) return 'sale'; return T.next ? 'pre' : 'closed'; }
  function P(id) { var f = window.pkFeedItem && window.pkFeedItem(id); if (f && f.price && typeof f.price.amount === 'number') return f.price.amount / 100; var r = T.prices[id]; return r ? Math.ceil(r[T.col]) : 0; }   // the site's one price rule: the live feed if it answered, else the settings block, whole dollars
  function sold(id) { var f = window.pkFeedItem && window.pkFeedItem(id); if (!f && needFeed() && (window.pkFeed || {}).state === 'live') return true; return !!(f && f.soldOut); }   // with the live feed required, a ticket the feed does not list is not offered
  /* Once the site is live (PK_LIVE, set by the launch switch) the sale shows only prices the ticket system sent. If the feed has not answered yet,
     or failed, the page says so instead of falling back to the built-in table, so a missed price update can never show a wrong price.
     T.requireFeed in the settings block or ?feedreq=1 turns this on in test; ?feedreq=0 turns it off. */
  function qp(k) { try { return new URLSearchParams(window.location.search).get(k); } catch (e) { return null; } }
  function needFeed() { var q = qp('feedreq'); if (q === '0') return false; return !!(window.PK_LIVE || (T && T.requireFeed) || q === '1'); }
  function gate() { if (!T) readTix(); if (when() !== 'sale' || !needFeed()) return ''; var F = window.pkFeed || {}; return F.state === 'live' ? '' : F.state === 'fallback' ? 'down' : 'loading'; }
  function gateHTML(g) {
    var t = g === 'down' ? 'Prices didn\u2019t load' : 'Getting today\u2019s prices', b = g === 'down' ? 'The ticket office didn\u2019t answer. Check your connection, then try again.' : 'One moment. Prices come straight from the ticket office.';
    return '<div class="tk-in"><div class="tk-paper tk-head"><img src="logo27-bat.png" alt="Pickathon 2027" width="700" height="260"><div class="tk-head-t"><h1 class="tk-d">Tickets</h1></div></div>' +
      '<div class="tk-main"><section class="tk-gate" role="status" aria-live="polite"><h2 class="tk-d tk-d-card">' + t + '</h2><p>' + b + '</p>' +
      (g === 'down' ? '<button type="button" class="tk-pill tk-pill-cream" data-act="feedretry">Try again</button>' : '') + '</section></div></div>';
  }
  /* Staff check, from the browser console: pkPriceCheck() lists every ticket whose live price differs from the settings column for today's round,
     and every ticket the feed does not list. Use it right after prices are changed in the ticket system. */
  window.pkPriceCheck = function () {
    readTix(); var F = window.pkFeed || {}, out = { feed: F.state, round: T.cur ? T.cur.id : null, differ: [], missing: [] };
    if (F.state !== 'live') return out;
    Object.keys(T.prices).forEach(function (id) { var f = window.pkFeedItem(id), r = T.prices[id], want = r ? Math.ceil(r[T.col]) : null;
      if (!f) { out.missing.push(id); return; } var got = f.price.amount / 100; if (want !== null && got !== want) out.differ.push({ id: id, code: window.pkFeedCode ? window.pkFeedCode(id) : '', ticketSystem: got, settings: want }); });
    return out;
  };
  function minP(ids) { return Math.min.apply(null, ids.map(P)); }
  function pacific(t) { return String(t || '').replace(/\s*PT$/, ' Pacific'); }
  function planLine(total) {   // same sum as the site's planLine: first payment today, then monthly, the last by plans.lastPayment
    var n = Math.max(2, T.planN), c = Math.round(total * 100), d0 = Math.ceil(c / (n * 100)) * 100, rest = c - d0, k = n - 1, p1 = Math.ceil(rest / k), pl = rest - p1 * (k - 1);
    return money(d0 / 100) + ' today, then ' + (p1 === pl ? k + ' monthly payments of ' + money(p1 / 100) : k === 2 ? 'monthly payments of ' + money(p1 / 100) + ' and ' + money(pl / 100) : (k - 1) + ' monthly payments of ' + money(p1 / 100) + ' and one of ' + money(pl / 100)) + lastBy();
  }
  function lastBy() { var lp = ((window.PK_TICKETS || {}).plans || {}).lastPayment, m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(lp || ''); if (!m) return ''; return ', the last by ' + ['January','February','March','April','May','June','July','August','September','October','November','December'][+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1]; }   // test r3: say when the plan ends

  /* ---------- the one order record ---------- */
  var S = load();
  function clean(s) {
    var o = {}, k; s = s || {};
    for (k in BLANK) o[k] = BLANK[k];
    ['pass', 'day', 'sleep', 'go'].forEach(function (f) { if (OK[f].indexOf(s[f]) >= 0) o[f] = s[f]; });
    ['adult', 'teen', 'kid', 'car'].forEach(function (f) { var n = parseInt(s[f], 10); if (n >= 0 && n <= 12) o[f] = n; });
    if (o.car < 1) o.car = 1;
    o.wed = !!s.wed && o.pass === 'p4'; o.patron = !!s.patron && o.adult > 0;
    if (o.pass !== 'd1') o.day = null;
    return o;
  }
  function load() { var s = null; try { s = JSON.parse(window.localStorage.getItem(LS) || 'null'); } catch (e) {} return clean(s); }
  function save() { try { var o = clean(S); o.at = Date.now(); window.localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function key(s) { return s.pass === 'd1' ? s.day : s.pass; }
  function camping(s) { return s.pass === 'p4' || s.pass === 'p3'; }
  function vehicle(s) { return camping(s) && /^(wcar|scar|wrv)$/.test(s.sleep); }
  function strip(s) { var p = s.pass, on = p === 'p4' ? [s.wed || s.patron, 1, 1, 1, 1] : p === 'p3' ? [0, 0, 1, 1, 1] : p === 'd2' ? [0, 0, 0, 1, 1] : p === 'd1' ? DAYS.map(function (d) { return d[0] === s.day; }) : [0, 0, 0, 0, 0]; if (s.patron && key(s)) on = [1, 1, 1, 1, 1]; return on.map(function (x) { return !!x; }); }
  function dates(s) { var on = strip(s), a = on.indexOf(true), b = on.lastIndexOf(true); if (a < 0) return ''; var m = DAYS[a][4].split(' '); return a === b ? DAYS[a][2] + ', ' + DAYS[a][4] + ', ' + YEAR : m[0] + ' ' + m[1] + '–' + DAYS[b][4].split(' ')[1] + ', ' + YEAR; }
  function lines(s) {
    var L = [], k = key(s), cam = camping(s), veh = vehicle(s); if (!k) return L;
    var nA = s.adult - (s.patron ? 1 : 0);
    if (nA > 0) L.push({ id: k, q: nA, n: N[k], amt: nA * P(k) });
    if (s.patron) L.push({ id: 'patron', q: 1, n: 'Patron Pass', amt: P('patron') });
    if (s.teen) { var tl = P('teen') < P(k); L.push({ id: tl ? 'teen' : k, q: s.teen, n: tl ? 'Teen Pass, 4 days, half price' : 'Teen ' + N[k], amt: s.teen * Math.min(P(k), P('teen')) }); }
    if (s.kid) L.push({ id: 'child', q: s.kid, n: 'Kid, 12 and under', amt: 0 });
    if (s.pass === 'p4' && s.wed && nA + s.teen > 0) L.push({ id: 'early', q: nA + s.teen, n: 'Wednesday early arrival', amt: (nA + s.teen) * P('early') });
    if (cam) { if (s.sleep === 'tent') L.push({ id: 'tent', q: 0, n: 'Tent in the woods', amt: 0 }); else if (veh) L.push({ id: s.sleep, q: 0, n: s.sleep === 'wrv' ? 'RV spot, Willow Camp' : SLEEPN[s.sleep], amt: P(s.sleep) }); }
    if (s.go === 'drive' && !veh) {
      if (cam) L.push({ id: 'wpark', q: s.car, n: 'Weekend Parking', amt: s.car * P('wpark') });
      else if (s.pass === 'd2') { L.push({ id: 'psat', q: s.car, n: 'Saturday Parking', amt: s.car * P('psat') }); L.push({ id: 'psun', q: s.car, n: 'Sunday Parking', amt: s.car * P('psun') }); }
      else L.push({ id: PARK[s.day], q: s.car, n: DAY[s.day][3] + ' Parking', amt: s.car * P(PARK[s.day]) });
    }
    if (s.go === 'shuttle' && !veh) L.push({ id: 'shuttle', q: s.adult + s.teen, n: 'Shuttle Pass', amt: (s.adult + s.teen) * P('shuttle') });
    if (s.go === 'bike' && !veh) L.push({ id: 'bike', q: 0, n: 'Bike parking', amt: 0 });
    return L;
  }
  function totals(s) {
    var L = lines(s), sub = L.reduce(function (a, b) { return a + b.amt; }, 0), fee = Math.round(sub * FEE * 100) / 100;
    return { lines: L, sub: sub, fee: fee, total: Math.round((sub + fee) * 100) / 100, ready: L.length > 0 && s.adult > 0, unadded: s.go === 'later' && !vehicle(s) };
  }
  function short(s) {
    var k = key(s); if (!k) return '';
    var nA = s.adult - (s.patron ? 1 : 0), n = nA + s.teen, a = [];
    a.push((n ? n + ' × ' + NS[k] : '') + (s.patron ? (n ? ' + ' : '') + '1 Patron' : '') + (s.kid ? ' + ' + plural(s.kid, 'kid') : ''));
    if (s.pass === 'p4' && s.wed) a.push('Wed arrival');
    if (camping(s)) a.push({ tent: 'tent', wcar: 'car camp', scar: 'car camp', wrv: 'RV', none: 'no camping' }[s.sleep]);
    if (!vehicle(s)) { if (s.go === 'drive') a.push(plural(s.car, 'car')); if (s.go === 'shuttle') a.push('shuttle'); if (s.go === 'bike') a.push('bike'); }
    return a.join(', ');
  }
  function lineLabel(l) { return (l.q ? l.q + ' × ' : '') + esc(l.n); }
  function olines(t) {
    return t.lines.map(function (l) { return '<li><span>' + lineLabel(l) + '</span><span class="tk-num">' + money(l.amt) + '</span></li>'; }).join('') +
      (t.unadded ? '<li class="fee"><span>Parking or shuttle: not added</span><span></span></li>' : '') +
      '<li class="fee"><span>Fee, ' + (FEE * 100) + '%</span><span class="tk-num">' + money(t.fee) + '</span></li>';
  }
  function hasPlan(t) { return !!(T.plans && t.sub > T.planMin && window.PK_PAY_LATER !== false); }
  /* what Checkout, and later the ticket system, receives */
  function order() {
    readTix(); var t = totals(S);
    return { ready: t.ready && when() === 'sale', round: T.show.id, roundName: T.show.name,
      items: t.lines.filter(function (l) { return l.id !== 'tent'; }).map(function (l) { return { id: l.id, code: window.pkFeedCode ? window.pkFeedCode(l.id) : '', qty: l.q || 1, unit: l.q ? Math.round(l.amt / l.q * 100) / 100 : l.amt, name: l.n }; }),
      lines: t.lines.map(function (l) { return { label: (l.q ? l.q + ' × ' : '') + l.n, price: money(l.amt) }; }), unadded: t.unadded,
      feeRate: FEE, feeS: money(t.fee), totalS: money(t.total), totalNum: t.total, sub: t.sub,
      hasPlan: hasPlan(t), plan: hasPlan(t) ? planLine(t.total) : '', strip: strip(S), dates: dates(S), summary: short(S), record: clean(S) };
  }

  /* ---------- sheets: a dialog; focus moves in, Escape closes, focus returns ---------- */
  var scrim = null, opener = null, inerted = [];
  function closeSheet(keepFocus) {
    if (!scrim) return; scrim.remove(); scrim = null;
    inerted.forEach(function (e) { e.removeAttribute('inert'); }); inerted = [];
    if (!keepFocus && opener && opener.focus && document.contains(opener)) { try { opener.focus(); } catch (e) {} }
  }
  function sheet(html, label, opts) {
    closeSheet(true); opts = opts || {}; opener = document.activeElement;
    scrim = document.createElement('div'); scrim.className = 'tk2 tk-scrim';
    scrim.innerHTML = '<div class="tk-sheet" role="dialog" aria-modal="true" aria-label="' + esc(label) + '">' + html + '</div>';
    ['root', 'pk-co'].forEach(function (id) { var e = document.getElementById(id); if (e && !e.hasAttribute('inert')) { e.setAttribute('inert', ''); inerted.push(e); } });
    document.body.appendChild(scrim); guard(scrim);
    scrim.addEventListener('click', function (e) { if ((e.target === scrim && !opts.modal) || (e.target.closest && e.target.closest('[data-close]'))) closeSheet(); });
    scrim.__modal = !!opts.modal;
    var f = $('[data-focus]', scrim) || $('button,a,input', scrim); if (f) { try { f.focus(); } catch (e) {} }
    return scrim;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && scrim && !scrim.__modal) { e.stopPropagation(); closeSheet(); } }, true);
  function sheetTop(t) { return '<div class="tk-sheet-top"><h2 class="tk-d tk-d-card">' + esc(t) + '</h2><button type="button" class="tk-sheet-x" data-close aria-label="Close">' + ic('x') + '</button></div>'; }

  /* ---------- the page ---------- */
  var root = null, lastKey = '';
  function headline() {
    var w = when(), r = T.show;
    if (w === 'sale') return esc(r.name) + (r.endS ? ' · ends ' + esc(r.endS) : ' prices');
    if (w === 'pre') return 'Open ' + esc(r.isToday ? 'today' : r.dayS) + (r.time ? ' · ' + esc(pacific(r.time)) : '');
    return 'Not on sale right now';
  }
  function fineLine() {
    return '<b>All sales final.</b> Send a pass to a friend any time from My Pickathon. ' + (T.show.plans ? 'Orders over ' + money(T.planMin) + ' can be paid monthly. ' : 'No payment plans during the ' + esc(T.show.name) + '. ') + 'Prices shown before the ' + (FEE * 100) + '% fee; your total always includes it.';
  }
  function passCard(v, title, sub, on, price, extra) {
    return '<label class="tk-pass tk-paper"><input type="radio" name="tk-pass" value="' + v + '" class="tk-vh"><span class="tk-days" aria-hidden="true"' + (extra && extra.stripId ? ' id="' + extra.stripId + '"' : '') + '>' +
      DAYS.map(function (d, i) { return '<i class="' + (i ? '' : 'w ') + (on[i] ? 'on' : '') + '"' + (i ? ' data-d="' + d[0] + '"' : ' id="tk-w-' + v + '"') + '>' + d[1] + '</i>'; }).join('') + '</span>' +
      '<span class="tk-pass-t"><b>' + title + '</b><span' + (extra && extra.subId ? ' id="' + extra.subId + '"' : '') + '>' + sub + '</span></span><span class="tk-pass-p">' + price + '</span></label>';
  }
  function stepper(k, label, sub, one) {
    return '<div class="tk-step' + (k === 'car' ? ' tk-step-row' : '') + '" data-k="' + k + '"' + (k === 'car' ? ' id="tk-carstep" hidden' : '') + '><p id="tk-l-' + k + '">' + label + (sub ? '<span>' + sub + '</span>' : '') + '</p><div><button type="button" data-step="-1" aria-label="One fewer ' + one + '">' + ic('minus', 'tk-ic-sm') + '</button><output aria-labelledby="tk-l-' + k + '">0</output><button type="button" data-step="1" aria-label="One more ' + one + '">' + ic('plus', 'tk-ic-sm') + '</button></div></div>';
  }
  function opt(name, v, media, title, why, price) { return '<label class="tk-opt"><input type="radio" name="' + name + '" value="' + v + '" class="tk-vh">' + media + '<span class="tk-opt-t"><b>' + title + '</b>' + why + '</span><span class="tk-opt-p tk-num" data-p="' + v + '">' + price + '</span></label>'; }
  function hoodImg(h, slot) { var d = site().data, H = d && d.hoods && d.hoods[h]; return H && H.i ? '<img class="tk-opt-m" data-slot="' + slot + '" src="' + esc(H.i) + '" alt="" loading="lazy" width="84" height="56">' : '<span class="tk-opt-e"></span>'; }
  function emblem(h) { return '<span class="tk-opt-e"><img src="ic2/' + h + '.png" alt="" width="40" height="40" loading="lazy"></span>'; }
  function per(id, unit) { return sold(id) ? 'Sold out' : money(P(id)) + '<small>' + unit + '</small>'; }
  function skeleton() {
    var w = when(), minDay = minP(OK.day), h = '';
    h += '<div class="tk-in"><div class="tk-paper tk-head"><img src="logo27-bat.png" alt="Pickathon 2027" width="700" height="260"><div class="tk-head-t"><h1 class="tk-d">Tickets</h1><p>' + headline() + '</p></div></div>';
    h += '<div class="tk-main" id="tk-main">';
    if (w === 'pre') h += '<section class="tk-pre" id="tk-pre" aria-label="Reminder"></section>';
    h += '<div id="tk-top"></div>';
    h += '<div class="tk-cols"><div class="tk-build">';
    h += '<fieldset><div class="tk-leg"><legend class="tk-d tk-d-label">How long?</legend><button type="button" class="tk-pill tk-pill-sm" data-act="help" aria-haspopup="dialog">Help me choose</button></div><div class="tk-passes" id="tk-passes">' +
      passCard('p4', '4 days', 'Camping included', [0, 1, 1, 1, 1], '<b class="tk-num">' + money(P('p4')) + '</b>') +
      '<label class="tk-wed" id="tk-wed" hidden><input type="checkbox" id="tk-wedc"><span><b>Arrive ' + DAY.w[3] + ', ' + DAY.w[4] + '</b>, from 5 pm</span><em class="tk-num">+' + money(P('early')) + ' each</em></label>' +
      passCard('p3', '3 days', 'Camping included', [0, 0, 1, 1, 1], '<b class="tk-num">' + money(P('p3')) + '</b>') +
      passCard('d2', 'Sat + Sun', 'No camping', [0, 0, 0, 1, 1], '<b class="tk-num">' + money(P('d2')) + '</b>') +
      passCard('d1', 'One day', 'Pick your day', [0, 0, 0, 1, 0], '<small id="tk-d1from">from</small><b class="tk-num" id="tk-d1p">' + money(minDay) + '</b>', { stripId: 'tk-d1strip', subId: 'tk-d1sub' }) +
      '<div class="tk-daypick" id="tk-daypick" hidden role="radiogroup" aria-label="Which day?">' + OK.day.map(function (d) { return '<label><input type="radio" name="tk-day" value="' + d + '" class="tk-vh"><span>' + DAY[d][2] + ', ' + DAY[d][4] + '<b class="tk-num">' + (sold(d) ? 'Sold out' : money(P(d))) + '</b></span></label>'; }).join('') + '</div>' +
      '</div></fieldset>';
    h += '<fieldset class="tk-who"><div class="tk-leg"><legend class="tk-d tk-d-label">Who’s coming?</legend></div><div class="tk-who-g">' + stepper('adult', 'Adults', '18 and up', 'adult') + stepper('teen', 'Teens', '13–17, half price', 'teen') + stepper('kid', 'Kids', '12 &amp; under, free', 'kid') + '</div><p class="tk-note" id="tk-teennote" hidden></p></fieldset>';
    h += '<div class="tk-folds">' +
      '<div class="tk-fold" id="tk-f-sleep"><button type="button" class="tk-fold-row" aria-expanded="false" aria-controls="tk-p-sleep">' + ic('tent') + '<span class="tk-fold-k">Sleeping</span><span class="tk-fold-v" id="tk-v-sleep"></span><span class="tk-fold-c">Change</span></button>' +
      '<div class="tk-fold-p" id="tk-p-sleep" hidden role="radiogroup" aria-label="Sleeping">' +
      opt('tk-sleep', 'tent', hoodImg('lushcamp', 'tickets.sleep.tent'), 'Tent in the woods', 'Lush Camp or Wild Camp. Walk in, pick your spot.', 'Included') +
      opt('tk-sleep', 'wcar', hoodImg('willowcamp', 'tickets.sleep.willow'), 'Car camp, Willow Camp', 'One car and a tent in 16′ × 18′. Half a mile to the gate, free shuttle.', per('wcar', 'a site')) +
      opt('tk-sleep', 'scar', hoodImg('southcamp', 'tickets.sleep.south'), 'Car camp, South Camp', 'Same size site, right across from the main entrance. Sells out first.', per('scar', 'a site')) +
      opt('tk-sleep', 'wrv', emblem('willowcamp'), 'RV, Willow Camp', '26′ to 36′. No generators. Parked until Monday.', per('wrv', 'a site')) +
      opt('tk-sleep', 'none', '<span class="tk-opt-e"></span>', 'Not camping', 'Sleep at home or nearby. Come and go as you like.', money(0)) +
      '<button type="button" class="tk-pill tk-pill-sm" data-go="hoods" style="justify-self:start;margin-top:4px">See the camps on the map</button></div></div>' +
      '<div class="tk-fold" id="tk-f-go"><button type="button" class="tk-fold-row" aria-expanded="false" aria-controls="tk-p-go">' + ic('car') + '<span class="tk-fold-k">Getting there</span><span class="tk-fold-v" id="tk-v-go"></span><span class="tk-fold-c">Change</span></button>' +
      '<div class="tk-fold-p" id="tk-p-go" hidden role="radiogroup" aria-label="Getting there">' +
      opt('tk-go', 'drive', emblem('welcomelot'), 'Drive', 'Park in the Welcome Lot. One mile to the gate, free shuttle.', '') +
      opt('tk-go', 'shuttle', '<span class="tk-opt-e"></span>', 'MAX + shuttle', 'From Lents Town Center MAX, about hourly, all weekend.', per('shuttle', 'a rider')) +
      opt('tk-go', 'bike', '<span class="tk-opt-e"></span>', 'Bike', 'Staffed bike parking at the farm.', 'Free') +
      opt('tk-go', 'drop', emblem('southcamp'), 'Dropped off', 'Rideshare or a friend, at the South Lot.', 'Free') +
      opt('tk-go', 'later', '<span class="tk-opt-e"></span>', 'Decide later', 'Parking and shuttle passes can be added any time.', money(0)) +
      stepper('car', 'Cars', '', 'car') + '</div></div></div>';
    h += '<p class="tk-patron"><span><b>Patron Pass</b> <span class="tk-num">' + (sold('patron') ? 'Sold out' : money(P('patron'))) + '</span><br>Backstage hospitality, concierge, early entry. <span id="tk-patnote"></span></span><button type="button" class="tk-pill tk-pill-sm" id="tk-patron" aria-pressed="false"' + (sold('patron') ? ' disabled' : '') + '>Add</button></p>';
    h += '<section class="tk-extra" aria-labelledby="tk-h-extra"><div class="tk-leg"><h2 class="tk-d tk-d-label" id="tk-h-extra">Anything else?</h2></div>' +
      '<details><summary><span>Curation meals</span><span class="tk-num tk-dim">' + money(P('cfri')) + ' a seat</span></summary><p>One chef, one artist, 100 seats. Five meals, Friday dinner to Sunday brunch. Add them after you check out, from My Pickathon.</p></details>' +
      '<details><summary><span>Cup and plate</span><span class="tk-num tk-dim">from ' + money(minP(['cup', 'plate'])) + '</span></summary><p>Your own steel cup and plate, waiting at the festival.</p></details>' +
      '<details><summary><span>Give back</span><span class="tk-num tk-dim">from ' + money(minP(['tools', 'student'])) + '</span></summary><p>Fund tools or sponsor a student in the Creative Neighborhoods build program.</p></details>' +
      '<div class="tk-hand"><button type="button" class="tk-pill" data-go="info">How the weekend works</button><button type="button" class="tk-tlink" data-go="list">Every pass and price</button></div>' +
      '<p class="tk-fine">' + fineLine() + '</p></section>';
    h += '</div><aside class="tk-order" aria-label="Your order"><div class="tk-paper tk-osheet"><p class="tk-d tk-d-card">Your order</p><hr class="tk-rule2" style="margin:8px 0 4px"><ul class="tk-olines" id="tk-lines"></ul>' +
      '<p class="tk-otot" id="tk-otot" hidden><span>Total <small class="tk-dim">fee included</small></span><b class="tk-num" id="tk-ototv"></b></p><p class="tk-oplan" id="tk-oplan" hidden></p>' +
      '<button type="button" class="tk-pill tk-pill-gold" id="tk-ogo" data-act="go" hidden></button><p class="tk-fine" id="tk-ofine" hidden><b>All sales final.</b> Send a pass to a friend any time from My Pickathon.</p></div></aside></div>';
    h += '</div>';
    h += '<div class="tk-bar" id="tk-bar" hidden role="region" aria-label="Order total"><button type="button" class="tk-bar-sum" id="tk-barsum" data-act="sheet" aria-haspopup="dialog"><span id="tk-bart"></span><small><span id="tk-barfee"></span>' + ic('up', 'tk-ic-sm', 'width:.75rem;height:.75rem') + '</small></button><button type="button" class="tk-pill tk-pill-gold" id="tk-bargo" data-act="go"></button><p class="tk-bar-ok" id="tk-barok" role="status" hidden>' + ic('check') + '<span></span></p></div>';
    h += '<p class="tk-vh" role="status" aria-live="polite" id="tk-live"></p></div>';
    return h;
  }
  /* returning buyer, sign-in line, passes already bought */
  function topHTML() {
    var w = when(), h = '', last = null, mine = null, user = site().user;
    if (T.sameAgain) { try { last = window.pkLastOrder(); } catch (e) {} } try { mine = window.pkMyPasses(); } catch (e) {}
    if (last) { var lo = clean(last); if (key(lo)) h += '<section class="tk-paper tk-slip" id="tk-again" aria-label="Your last order"><p>Welcome back. Last time<b>' + esc(short(lo)) + '</b></p><button type="button" class="tk-pill tk-pill-ink" data-act="again">Same again</button></section>'; }
    if (user || (mine && mine.length)) h += '<section class="tk-paper tk-slip" aria-label="Your passes"><p>' + (mine && mine.length ? 'You have<b>' + mine.map(function (m) { return esc(m.qty + ' × ' + m.name); }).join(', ') + '</b>' : 'You’re signed in<b>Your passes are in My Pickathon</b>') + '</p><button type="button" class="tk-pill" data-go="mine">My Pickathon</button></section>';
    else if (!last && w === 'sale' && T.sameAgain) h += '<p class="tk-signin"><span>Been before? <button type="button" class="tk-tlink" data-act="signin">Sign in</button> to reuse your last order.</span></p>';
    return h;
  }
  /* ---------- before the sale: the reminder first, then build and save the order ---------- */
  function ls(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) {} return null; }
  function textsOn() { return !!((window.PK_SIGNUP || {}).layloEndpoint); }   // no text service yet: the field takes an email only
  function fieldName() { return textsOn() ? 'Email or mobile number' : 'Email address'; }
  function reminded() { return !!ls(LSR) || !!site().nlDone; }
  function openDay() { var r = T.show; return (r.isToday ? 'today' : r.dayL) + (r.time ? ' at ' + pacific(r.time) : ''); }
  function ordinal(n) { var v = n % 100; return n + (v > 10 && v < 14 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')); }
  function preNote() {
    var r = T.show, d = parseInt(String(r.day).slice(8), 10), range = r.dayS;
    if (r.endS) range += ' to ' + (r.endS.split(' ')[0] === r.dayS.split(' ')[0] ? r.endS.split(' ')[1] : r.endS); else range = 'from ' + range;
    return esc(r.name) + ' prices, ' + esc(range) + ', are below. Build your order now and pay in one tap ' + (r.isToday ? 'when it opens' : 'on the ' + ordinal(d)) + '.';
  }
  /* one sign-up path for the whole site: the app's own handler (email to the Mailchimp list; a phone number is turned away until texts exist) */
  function remind(v) {
    var a = app(); if (!a) return 'Enter an email address.';
    try { a.setState({ nlEmail: v, nlErr: '', nlDone: false }); a.renderVals().nl.submit(); } catch (e) { return 'Enter an email address.'; }
    if (a.state.nlDone) { ls(LSR, '1'); return ''; }
    return a.state.nlErr || 'Enter an email address.';
  }
  function remindForm(id, btn) { return '<form class="tk-pre-f" id="' + id + '-f" novalidate><label class="tk-vh" for="' + id + '-i">' + fieldName() + '</label><input class="tk-field" id="' + id + '-i" type="text" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="' + fieldName() + '" aria-describedby="' + id + '-e"' + (id === 'tk-rm' ? ' data-focus' : '') + '><button class="tk-pill tk-pill-gold" type="submit">' + btn + '</button></form><p class="tk-msg-err" id="' + id + '-e" hidden role="alert">' + ic('info', 'tk-ic-sm') + '<span></span></p>'; }
  function wireForm(scope, id, ok) {
    $('#' + id + '-f', scope).addEventListener('submit', function (e) {
      e.preventDefault(); var i = $('#' + id + '-i', scope), er = $('#' + id + '-e', scope), msg = remind(i.value.trim());
      if (msg) { i.setAttribute('aria-invalid', 'true'); $('span', er).textContent = msg; er.hidden = false; i.focus(); return; }
      ok();
    });
  }
  function preDraw() {
    var el = root && $('#tk-pre', root); if (!el) return;
    var cal = root.getAttribute('data-cal') || '', calL = root.getAttribute('data-callabel') || '', calF = root.getAttribute('data-calfile') || 'pickathon-tickets.ics';
    var calH = cal ? '<a class="tk-tlink" href="' + esc(cal) + '" download="' + esc(calF) + '">' + esc(calL) + '</a>' : '';
    if (reminded()) el.innerHTML = '<p class="tk-pre-ok" role="status">' + ic('check') + '<span>You\u2019re on the list. One email ' + esc(openDay()) + '.</span></p><p class="tk-pre-n">' + preNote() + (calH ? ' ' + calH : '') + '</p>';
    else { el.innerHTML = '<div>' + remindForm('tk-pre', 'Remind me') + '</div><p class="tk-pre-n">' + preNote() + (calH ? ' ' + calH : '') + '</p>'; wireForm(el, 'tk-pre', function () { preDraw(); var p = $('.tk-pre-ok', root); if (p) { p.setAttribute('tabindex', '-1'); p.focus(); } }); }
    guard(el);
  }
  function sig() { return T.show.id + JSON.stringify(clean(S)); }   // saved for this round, this exact order
  function saved() { return ls(LSS) === sig(); }
  function saveOrder() {
    if (!totals(S).ready) return;
    if (!reminded()) {
      var sh = sheet(sheetTop('Remind me') + '<p>Tickets open <b>' + esc(openDay()) + '</b>. One email when they do, and your order is saved for then.</p><div style="margin-top:14px">' + remindForm('tk-rm', 'Remind me') + '</div>', 'Remind me');
      wireForm(sh, 'tk-rm', function () { closeSheet(true); preDraw(); saveOrder(); });
      return;
    }
    ls(LSS, sig()); update();
    var ok = $('#tk-barok', root); if (ok && ok.offsetParent) { ok.setAttribute('tabindex', '-1'); ok.focus(); } else { var og = $('#tk-ogo', root); if (og) og.focus(); }
  }
  function draw(el) {
    var g = gate(); if (g) { root = el; el.innerHTML = gateHTML(g); return; }
    root = el; el.innerHTML = skeleton(); $('#tk-top', el).innerHTML = topHTML(); preDraw(); update();
  }
  function setRadio(name, v) { $$('input[name="' + name + '"]', root).forEach(function (i) { i.checked = i.value === v; }); }
  function update() {
    if (!root || !root.firstChild || !document.getElementById('tk-main')) return;
    S = clean(S);
    if (S.pass && S.pass !== 'd1' && sold(S.pass)) S.pass = null;
    if (S.day && sold(S.day)) S.day = null;
    if (/^(wcar|scar|wrv)$/.test(S.sleep) && sold(S.sleep)) S.sleep = 'tent';
    if (S.patron && sold('patron')) S.patron = false;
    save();
    var w = when(), cam = camping(S), veh = vehicle(S), k = key(S);
    setRadio('tk-pass', S.pass); setRadio('tk-day', S.day); setRadio('tk-sleep', S.pass && !cam ? 'none' : S.sleep); setRadio('tk-go', veh ? 'drive' : S.go);
    $$('input[name="tk-pass"]', root).forEach(function (i) { i.disabled = i.value !== 'd1' && sold(i.value); });
    $$('input[name="tk-day"]', root).forEach(function (i) { i.disabled = sold(i.value); });
    $$('input[name="tk-sleep"]', root).forEach(function (i) { i.disabled = (!!S.pass && !cam && i.value !== 'none') || (/^(wcar|scar|wrv)$/.test(i.value) && sold(i.value)); });
    $$('input[name="tk-go"]', root).forEach(function (i) { i.disabled = veh && i.value !== 'drive'; });
    $('#tk-wed', root).hidden = S.pass !== 'p4'; $('#tk-wedc', root).checked = S.wed; $('#tk-w-p4', root).classList.toggle('on', S.pass === 'p4' && (S.wed || S.patron));
    $('#tk-daypick', root).hidden = S.pass !== 'd1';
    $$('#tk-d1strip i[data-d]', root).forEach(function (i) { i.classList.toggle('on', S.day ? i.getAttribute('data-d') === S.day : i.getAttribute('data-d') === 'dsat'); });
    $('#tk-d1sub', root).textContent = S.day ? DAY[S.day][3] + ', ' + DAY[S.day][4] : 'Pick your day'; $('#tk-d1from', root).hidden = !!S.day; $('#tk-d1p', root).textContent = money(S.day ? P(S.day) : minP(OK.day));
    $$('.tk-step', root).forEach(function (st) { var f = st.getAttribute('data-k'), v = S[f], b = $$('button', st); $('output', st).textContent = v; b[0].disabled = v <= (f === 'car' ? 1 : 0); b[1].disabled = v >= 12; });
    var tn = $('#tk-teennote', root), note = '';
    if (!S.adult && (S.teen || S.kid)) note = '<b>Add an adult.</b> Teens and kids come in with a ticketed adult.';
    else if (S.teen > 0 && k) note = P(k) > P('teen') ? '<b>Teens get the lower price.</b> A Teen Pass is ' + money(P('teen')) + ': all four days, half price. Teens come in with a ticketed adult.' : '<b>Teens 13 to 17</b> pay the day price, ' + money(P(k)) + ', and come in with a ticketed adult.';
    tn.hidden = !note; tn.innerHTML = note;
    $('#tk-v-sleep', root).innerHTML = (S.pass && !cam) ? 'No camping with this ticket' : S.sleep === 'tent' ? 'Tent, <em>included</em>' : S.sleep === 'none' ? 'Not camping' : esc(SLEEPN[S.sleep]) + ', ' + money(P(S.sleep));
    var fs = $('#tk-f-sleep .tk-fold-row', root); fs.disabled = !!S.pass && !cam; if (S.pass && !cam) fold(fs, false);
    var dayPark = S.pass === 'd1' && S.day ? money(P(PARK[S.day])) + ' a day' : 'from ' + money(minP(['pthu', 'pfri', 'psat', 'psun'])) + ' a day', wk = cam || !S.pass;
    $('#tk-v-go', root).textContent = veh ? 'You drive in with your camp' : { later: 'Not added · parking ' + (wk ? money(P('wpark')) + ' a car' : dayPark), drive: 'Drive, ' + plural(S.car, 'car') + ', ' + (wk ? money(P('wpark')) + ' each' : 'day parking'), shuttle: 'MAX + shuttle, ' + money(P('shuttle')) + ' a rider', bike: 'Bike, free', drop: 'Dropped off, free' }[S.go];
    $('[data-p="drive"]', root).innerHTML = wk ? money(P('wpark')) + '<small>a car</small>' : (S.pass === 'd1' && S.day ? money(P(PARK[S.day])) : money(minP(['pthu', 'pfri', 'psat', 'psun'])) + '+') + '<small>a day</small>';
    $('#tk-carstep', root).hidden = S.go !== 'drive' || veh;
    var pb = $('#tk-patron', root); pb.setAttribute('aria-pressed', S.patron ? 'true' : 'false'); pb.textContent = S.patron ? 'Added' : 'Add';
    $('#tk-patnote', root).textContent = S.patron ? 'One adult’s pass is now a Patron Pass.' : '';
    var t = totals(S), ready = t.ready, go = goLabel(t);
    var bar = $('#tk-bar', root); bar.hidden = !ready; $('#tk-main', root).classList.toggle('has-bar', ready);
    if (ready) {
      $('#tk-bart', root).textContent = short(S); $('#tk-barfee', root).textContent = w === 'sale' ? 'See the order' : money(t.total) + ' · see the order';
      var bg = $('#tk-bargo', root), bs = $('#tk-barsum', root), bo = $('#tk-barok', root), sv = w === 'pre' && saved();
      bg.textContent = go.t; bg.className = 'tk-pill ' + go.c; bg.hidden = bs.hidden = sv || w === 'closed'; bo.hidden = !sv; if (sv) $('span', bo).textContent = 'Order saved on this device. It will be here, ready to pay, on ' + T.show.dayS + '.';
      if (w === 'closed') bar.hidden = true;
      $('#tk-live', root).textContent = short(S) + '. Total ' + money(t.total) + ', fee included.';
    } else $('#tk-live', root).textContent = '';
    $('#tk-lines', root).innerHTML = ready ? olines(t) : '<li class="tk-order-empty">' + (k && !S.adult ? 'Add an adult to see your total.' : S.pass === 'd1' && !S.day ? 'Pick your day. Your total builds here, fee included.' : 'Pick a pass. Your total builds here, fee included.') + '</li>';
    $('#tk-otot', root).hidden = $('#tk-ofine', root).hidden = !ready; $('#tk-ototv', root).textContent = money(t.total);
    var op = $('#tk-oplan', root); op.hidden = !(ready && hasPlan(t)); op.textContent = hasPlan(t) ? 'Or pay over time: ' + planLine(t.total) + '.' : '';
    var og = $('#tk-ogo', root); og.hidden = !ready; og.textContent = go.t; og.className = 'tk-pill ' + go.c; if (go.off) og.setAttribute('aria-disabled', 'true'); else og.removeAttribute('aria-disabled');
    guard(root);
  }
  function goLabel(t) { var w = when(); if (w === 'sale') return { t: 'Checkout · ' + money(t.total), c: 'tk-pill-gold' }; if (w === 'pre') return saved() ? { t: 'Saved for ' + T.show.dayS, c: 'tk-pill-cream', off: true } : { t: 'Save for ' + T.show.dayS, c: 'tk-pill-cream' }; return { t: 'Not on sale right now', c: '', off: true }; }
  function fold(row, open) { var p = document.getElementById(row.getAttribute('aria-controls')); p.hidden = !open; row.setAttribute('aria-expanded', open ? 'true' : 'false'); $('.tk-fold-c', row).textContent = open ? 'Done' : 'Change'; }
  function orderSheet() {
    var t = totals(S), go = goLabel(t);
    sheet(sheetTop('Your order') + '<div class="tk-paper tk-osheet"><ul class="tk-olines">' + olines(t) + '</ul><p class="tk-otot"><span>Total <small class="tk-dim">fee included</small></span><b class="tk-num">' + money(t.total) + '</b></p>' +
      (hasPlan(t) ? '<p class="tk-oplan">Or pay over time: ' + planLine(t.total) + '.</p>' : '') + '<p class="tk-fine"><b>All sales final.</b> Send a pass to a friend any time from My Pickathon.</p></div>' +
      '<button type="button" class="tk-pill ' + go.c + ' tk-sheet-go" data-sheetgo>' + go.t + '</button>', 'Your order');
    $('[data-sheetgo]', scrim).addEventListener('click', function () { closeSheet(true); proceed(); });
  }
  /* help me choose: Pick sets the pass and nothing else */
  function help() {
    var rows = [['p4', 'Everything, and camp', '4 days, ' + money(P('p4')), [0, 1, 1, 1, 1]], ['p3', 'The weekend, and camp', '3 days, ' + money(P('p3')), [0, 0, 1, 1, 1]], ['d2', 'Two big days, home at night', 'Sat + Sun, ' + money(P('d2')), [0, 0, 0, 1, 1]], ['d1', 'A first taste', 'One day, from ' + money(minP(OK.day)), [0, 0, 0, 1, 0]]];
    var sh = sheet(sheetTop('Which pass fits?') + '<div class="tk-help">' + rows.map(function (r) {
      var so = r[0] !== 'd1' && sold(r[0]);
      return '<div class="tk-pass tk-paper"><span class="tk-days" aria-hidden="true">' + DAYS.map(function (d, i) { return '<i' + (r[3][i] ? ' class="on"' : '') + '>' + d[1] + '</i>'; }).join('') + '</span><span class="tk-pass-t"><b>' + r[1] + '</b><span>' + r[2] + '</span></span><span class="tk-pass-p"><button type="button" class="tk-pill tk-pill-ink" data-pick="' + r[0] + '" aria-label="Pick ' + r[2].split(',')[0] + '"' + (so ? ' disabled' : '') + '>' + (so ? 'Sold out' : 'Pick') + '</button></span></div>';
    }).join('') + '</div><div class="tk-help-f"><p><b class="tk-d">Every stage</b>all day, every pass</p><p><b class="tk-d">Kids free</b>12 and under</p><p><b class="tk-d">Teens half</b>' + money(P('teen')) + ', all 4 days</p></div>', 'Which pass fits?');
    sh.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pick]') : null; if (!b) return;
      S.pass = b.getAttribute('data-pick'); if (S.pass !== 'p4') S.wed = false; if (S.pass !== 'd1') S.day = null;
      closeSheet(true); update();
      var i = $('input[name="tk-pass"][value="' + S.pass + '"]', root); if (i) { try { i.focus(); i.closest('label').scrollIntoView({ block: 'nearest' }); } catch (x) {} }
    });
  }
  function checkout() {
    var o = order(); if (!o.ready) return;
    if (window.__pkCheckout) window.__pkCheckout.open(o);
  }
  function proceed() { var w = when(); if (w === 'sale') checkout(); else if (w === 'pre' && !saved()) saveOrder(); }
  function nav(to) {
    var a = app(); if (!a) return;
    if (to === 'list') { a.setState({ tixList: true }); try { a.toTop(0); } catch (e) {} return; }
    if (to === 'mine') { a.go('mine'); return; }
    a.go(to);
  }
  function onChange(e) {
    var t = e.target, n = t.name;
    if (n === 'tk-pass') { S.pass = t.value; if (t.value !== 'p4') S.wed = false; if (t.value !== 'd1') S.day = null; }
    else if (n === 'tk-day') S.day = t.value;
    else if (n === 'tk-sleep') S.sleep = t.value;
    else if (n === 'tk-go') S.go = t.value;
    else if (t.id === 'tk-wedc') S.wed = t.checked;
    else return;
    update();
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button,[data-go],[data-act]') : null; if (!b || !root.contains(b)) return;
    var stp = b.getAttribute('data-step');
    if (stp) { var f = b.closest('.tk-step').getAttribute('data-k'); S[f] = Math.max(f === 'car' ? 1 : 0, Math.min(12, S[f] + (+stp))); if (!S.adult) S.patron = false; update(); return; }
    if (b.classList.contains('tk-fold-row')) { fold(b, b.getAttribute('aria-expanded') !== 'true'); return; }
    if (b.id === 'tk-patron') { S.patron = !S.patron; if (S.patron && !S.adult) S.adult = 1; update(); return; }
    var act = b.getAttribute('data-act'), go = b.getAttribute('data-go');
    if (act === 'feedretry') { window.pkFeed = { url: (window.pkFeed || {}).url, state: 'loading', byCode: null, at: Date.now() }; lastKey = ''; sync(); try { window.pkFeedLoad(function () { lastKey = ''; sync(); }); } catch (x) {} return; }
    if (go) { nav(go); return; }
    if (act === 'go') { proceed(); return; }
    if (act === 'sheet') { orderSheet(); return; }
    if (act === 'help') { help(); return; }
    if (act === 'signin') { if (window.__pkAcct && window.__pkAcct.signIn) window.__pkAcct.signIn(); else nav('account'); return; }
    if (act === 'again') { var lo = null; try { lo = window.pkLastOrder(); } catch (x) {} if (lo) { S = clean(lo); b.textContent = 'Filled in'; b.disabled = true; update(); var bg = $('#tk-ogo', root); if (bg && bg.offsetParent) bg.focus(); else { bg = $('#tk-bargo', root); if (bg) bg.focus(); } } return; }
  }

  /* ---------- keeping in step with the app ---------- */
  function where(v) { try { if (v) window.sessionStorage.setItem(SSW, v); else window.sessionStorage.removeItem(SSW); } catch (e) {} }
  function stateKey() { var F = window.pkFeed || {}, lo = ''; try { lo = JSON.stringify(window.pkLastOrder() || '') + JSON.stringify(window.pkMyPasses() || ''); } catch (e) {} return [when(), T.show.id, T.col, T.show.isToday ? 1 : 0, T.plans ? 1 : 0, F.state, F.at, T.sameAgain ? 1 : 0, site().user ? 1 : 0, site().data ? 1 : 0, lo, textsOn() ? 1 : 0].join('|'); }
  function vars() {
    if (!root || !root.firstChild) return;
    var n = $('#root nav[aria-label="App"]'), hd = $('#root header'), inn = root.firstChild;
    inn.style.setProperty('--tk-tabs', (n ? n.offsetHeight : 0) + 'px');
    var hh = 96; try { if (hd && /sticky|fixed/.test(getComputedStyle(hd).position)) hh = hd.getBoundingClientRect().bottom; else hh = 0; } catch (e) {}
    inn.style.setProperty('--tk-hdr', Math.max(0, Math.round(hh)) + 'px');
  }
  var booting = true;
  function sync() {
    var el = document.getElementById('tk2');
    if (!el) { root = null; if (!booting && !document.getElementById('pk-co')) where(''); return; }
    readTix(); var k = stateKey();
    if (el !== root || !el.firstChild || k !== lastKey) { lastKey = k; draw(el); }
    root = el; vars();
    if (!booting) where(document.getElementById('pk-co') ? 'checkout' : 'tickets');
  }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); try { sync(); } catch (e) { if (window.console) console.error('pk-tk2', e); } return r; };
  window.addEventListener('resize', function () { try { vars(); } catch (e) {} });
  window.addEventListener('storage', function (e) { if (e.key === LS) { S = load(); try { update(); } catch (x) {} } });   // the same order open in two tabs stays one order
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { sync(); } catch (e) {} } });

  window.__pkTk2 = {
    refresh: function () { lastKey = ''; sync(); },
    order: order, record: function () { return clean(S); }, set: function (o) { S = clean(Object.assign({}, S, o || {})); save(); update(); }, clear: function () { S = clean(null); save(); update(); },
    gate: gate, lastBy: lastBy, sheet: sheet, closeSheet: closeSheet, guard: guard, sheetTop: sheetTop, ic: ic, esc: esc, money: money, where: where, days: DAYS
  };
  document.addEventListener('change', function (e) { if (root && root.contains(e.target)) onChange(e); });
  document.addEventListener('click', function (e) { if (root && root.contains(e.target)) onClick(e); });

  /* A reload or a tab the phone put to sleep comes back to where the buyer was: Tickets, or Checkout. A link ending #tickets opens Tickets too. */
  var back = ''; try { back = window.sessionStorage.getItem(SSW) || ''; } catch (e) {}
  var viaHash = /^#tickets\b/.test(window.location.hash || '');
  function boot(n) {
    var a = app();
    if (!a || !a.state || !a.state.data) { if (n < 200) setTimeout(function () { boot(n + 1); }, 50); else booting = false; return; }
    try {
      var top = a.state.stack[a.state.stack.length - 1];
      if ((back || viaHash) && (!top || top.r === 'home')) a.go('tickets');
      booting = false; sync();
      if (back === 'checkout' && window.__pkCheckout && window.__pkCheckout.resume) window.__pkCheckout.resume();
    } catch (e) { booting = false; }
  }
  window.addEventListener('hashchange', function () { if (/^#tickets\b/.test(window.location.hash || '')) { var a = app(); try { var top = a.state.stack[a.state.stack.length - 1]; if (top.r !== 'tickets') a.go('tickets'); } catch (e) {} } });
  try { sync(); } catch (e) {}
  boot(0);
})();
