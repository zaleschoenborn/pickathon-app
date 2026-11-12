/* pk-plan2: Plan your trip, the More sheet and the short footer, round 2 design (Nov 11 2026).
   Source: tools/plan_r2/pl2.js, spliced into index.html by tools/plan_r2/build.py (it replaces only <script id="pk-plan2"> and <style id="pk-plan2-css">).
   Design: flow/round2/design/plan.html and src/kit.js (PK.more, PK.footer); build notes "Plan your trip", "More sheet", "Footer".

   Three self-drawn islands (the app's renderer leaves the inside of a data-pk-own element alone):
     <div id="pl2">       Plan your trip, on the existing route 'info' (old page at ?old=plan and in festival season)
     <div id="pl2-foot">  the short footer; while it has content the old <footer> right after it is hidden (old footer at ?old=foot)
     the More sheet       a dialog appended to <body>; it takes over the phone More tab and the desktop More button (old menu at ?old=more)
   Every price, sale date and round comes from window.pkTix() (the pk-ticket-settings block) or the live price feed, by the same rule as Tickets.
   The trip facts below were checked against data.json pages (traveling-to-pickathon, camping, what-to-bring-to-pickathon, ada-info,
   bike-to-pickathon, lodging, pickathon-2026-tickets-passes) and the faq block on Nov 11. Hours are 2026's, and the page says so.
   The ticket order is the one record Tickets keeps (localStorage "pk27order"). Plan never changes a real order; with no order it seeds one
   (marked planOnly) so Tickets opens on the same three answers. The three answers themselves live in "pk27plan". */
(function () {
  'use strict';

  /* ======================================================================================
     PLACEHOLDER STRINGS. Mockup copy we have no data or ruling for yet. Zale to confirm or replace.
     Nothing outside this block is unbacked copy.
     ====================================================================================== */
  var COPY = {
    newDates: 'Thu–Sun, early arrival Wed. Wednesday is an add-on to the 4-Day Pass',   // Round 3 (A2, A5): the price is added from the price table, "+$NN each"          // What's new line 1 (dates are the founder brief; the line does not yet say new or same as 2026)
    newCheckout: 'You pay right here on pickathon.com. Passes land in My Pickathon.',                // What's new line 3 ("Passes land in My Pickathon" is the design's, not yet confirmed)
    zaleLines: [],                                                                                    // up to three more What's new lines from Zale, as ['Label', 'Text, saying new or same as 2026']; none yet, so nothing shows
    daysRun: 'Music runs from morning until late night. 2027 set times post closer to the festival.' // Full details, "How the days run"
  };
  var FEST = { dates: 'Aug 4–8, 2027', long: 'August 4–8, 2027', place: 'Pendarvis Farm, Happy Valley, Oregon', mail: 'info@pickathon.com', copy: '© 1999–2026 Pickathon LLC' };

  var LS = 'pk27order', LSP = 'pk27plan', FEE = (window.pkFeeRate ? window.pkFeeRate() : 0.05);
  var BLANK = { pass: null, day: null, adult: 1, teen: 0, kid: 0, wed: false, sleep: 'tent', go: 'later', car: 1, patron: false };
  var NS = { p4: '4-Day', p3: '3-Day', d2: 'Sat + Sun', dthu: 'Thursday', dfri: 'Friday', dsat: 'Saturday', dsun: 'Sunday' };
  var PARK = { dthu: 'pthu', dfri: 'pfri', dsat: 'psat', dsun: 'psun' };
  var OLDQ = (function () { try { return (window.location.search.match(/[?&]old=([a-z,]+)/) || [])[1] || ''; } catch (e) { return ''; } })();
  var OLD = { more: /\bmore\b/.test(OLDQ), foot: /\bfoot\b/.test(OLDQ) };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function app() { return window.comp || window.__pkApp || null; }
  function site() { var a = app(); return (a && a.state) || window.__pkSt || {}; }
  function lsGet(k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  /* the site styles every p, li and label inside main, and every non-heading's font; these class names are its own opt-outs (same as Tickets) */
  function guard(r) { if (!r) return; $$('p,li,label', r).forEach(function (e) { e.classList.add('pk-krtk'); }); $$('.pl-d,.pl-stop-n', r).forEach(function (e) { e.classList.add('pkp-head'); }); }

  /* utility glyphs (the design kit's one-color set): rows and tabs only, 18 to 24 px, never enlarged */
  function oct(cx, cy, r) { var p = [], k = r * 0.414; [[-k, -r], [k, -r], [r, -k], [r, k], [k, r], [-k, r], [-r, k], [-r, -k]].forEach(function (a, i) { p.push((i ? 'L' : 'M') + (cx + a[0]).toFixed(1) + ' ' + (cy + a[1]).toFixed(1)); }); return p.join(' ') + ' Z'; }
  function hex(cx, cy, r) { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i + Math.PI / 6; p.push((i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' ') + ' Z'; }
  var I = {
    search: [oct(10, 10, 7.8) + ' ' + oct(10, 10, 4.9), 'M14.6 16.4 L16.4 14.6 L22 20.2 L20.2 22 Z'],
    tent: ['M12 3 L22 20 L2 20 Z M12 10.5 L15.4 20 L8.6 20 Z', 'M10.6 2 L12 4.4 L13.4 2 L14.6 2.8 L12 7 L9.4 2.8 Z'],
    car: ['M2 16.5 L2 12 L5 11 L7.5 6 L16.5 6 L19 11 L22 12 L22 16.5 Z M8.8 7.9 L15.2 7.9 L16.7 11 L7.3 11 Z', hex(6.6, 17.6, 2.7), hex(17.4, 17.6, 2.7)],
    cal: ['M3 5 L21 5 L21 21 L3 21 Z M5.5 10 L18.5 10 L18.5 18.5 L5.5 18.5 Z', 'M7 2.5 h2.5 v4 h-2.5 Z', 'M14.5 2.5 h2.5 v4 h-2.5 Z'],
    chev: ['M8 4 L16.6 12 L8 20 L6 18 L12 12 L6 6 Z'],
    kid: [oct(12, 6.4, 3.3), 'M8 11 L16 11 L18 21 L6 21 Z'],
    bottle: ['M9.5 2 h5 v3 l2 3 v13.5 h-9 V8 l2 -3 Z M9.5 12 h5 v4 h-5 Z'],
    jacket: ['M8 3 L12 5.6 L16 3 L22 7 L19.6 11 L18 10 L18 21 L6 21 L6 10 L4.4 11 L2 7 Z'],
    id: ['M2 5 L22 5 L22 19 L2 19 Z M5 8.5 h5 v5 h-5 Z M12.5 9 h7 v1.8 h-7 Z M12.5 12.6 h5 v1.8 h-5 Z'],
    chair: ['M5 3 h2.6 v8 h8.8 v-2.5 h2.6 V21 h-2.6 v-7 H7.6 v7 H5 Z'],
    dog: ['M4 6 L8 3 L9.6 7 L14.4 7 L16 3 L20 6 L19 14 L15 20.5 L9 20.5 L5 14 Z M8.4 10.6 h2.2 v2.2 h-2.2 Z M13.4 10.6 h2.2 v2.2 h-2.2 Z M10.8 15.4 h2.4 l-1.2 1.8 Z'],
    flame: ['M12 2 L16 8 L17.6 6.4 L20 13 L18 19 L13.6 22 L9.6 22 L5.6 18.6 L4.4 13 L8 8.4 L9 11 Z M12 13 L14.6 16.4 L13.6 19.6 L11 19.6 L9.8 17 Z'],
    mug: ['M4 6 h11 v3 h4 l1.6 1.6 v5 L19 17.2 h-4 V21 H4 Z M15 11.4 h2.6 v3.4 H15 Z'],
    shade: ['M2 9 L12 3 L22 9 L22 11.4 L2 11.4 Z', 'M4 11.4 h2.2 V21 H4 Z', 'M17.8 11.4 H20 V21 h-2.2 Z'],
    gen: ['M3 8 h14 l4 3 v8 H3 Z M5.6 11 h6 v2 h-6 Z', 'M6 4.5 h8 V7 H6 Z'],
    info: [oct(12, 12, 9.6) + ' M11 6.4 h2 v2.2 h-2 Z M11 10.4 h2 v7.2 h-2 Z'],
    x: ['M5.5 4 L12 10.5 L18.5 4 L20 5.5 L13.5 12 L20 18.5 L18.5 20 L12 13.5 L5.5 20 L4 18.5 L10.5 12 L4 5.5 Z']
  };
  function ic(n, c) { return '<svg class="pl-ic ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + I[n].map(function (d) { return '<path fill-rule="evenodd" d="' + d + '"/>'; }).join('') + '</svg>'; }

  /* ---------- the sale, from the one settings block ---------- */
  var T = null;
  function readTix() { var s = site(); try { T = window.pkTix(s.today, s.season || 'off'); } catch (e) { T = null; } return T; }
  function WF(n) { return window.pkWithFee ? window.pkWithFee(n) : Math.round(n * (1 + FEE) * 100) / 100; }   // A12: shown prices include the fee
  function PS(id) { return WF(P(id)); }
  function P(id) { var f = window.pkFeedItem && window.pkFeedItem(id); if (f && f.price && typeof f.price.amount === 'number') return f.price.amount / 100; var r = T && T.prices[id]; return r ? Math.ceil(r[T.col]) : 0; }   // the site's one price rule (same as Tickets)
  function has() { try { return !!(window.pkMyPasses && window.pkMyPasses()); } catch (e) { return false; } }
  function when() { if (has()) return 'has'; var s = site(); if ((s.season || 'off') !== 'off' || (T && T.open)) return 'sale'; return T && T.next ? 'pre' : 'closed'; }

  /* ---------- the order record (read only here) and its totals, by the Tickets rules ---------- */
  function cleanO(s) { var o = {}, k; s = s || {}; for (k in BLANK) o[k] = (k in s) ? s[k] : BLANK[k]; return o; }
  function key(s) { return s.pass === 'd1' ? s.day : s.pass; }
  function camping(s) { return s.pass === 'p4' || s.pass === 'p3'; }
  function vehicle(s) { return camping(s) && /^(wcar|scar|wrv)$/.test(s.sleep); }
  function totals(s) {
    var L = [], k = key(s), cam = camping(s), veh = vehicle(s); if (!k) return { sub: 0, total: 0, n: 0 };
    var nA = s.adult - (s.patron ? 1 : 0), add = function (q, u) { L.push([q, u]); };   // [quantity, base unit]
    if (nA > 0) add(nA, P(k));
    if (s.patron) add(1, P('patron'));
    if (s.teen) add(s.teen, Math.min(P(k), P('teen')));
    if (s.pass === 'p4' && s.wed && nA + s.teen > 0) add(nA + s.teen, P('early'));
    if (veh) add(1, P(s.sleep));
    if (s.go === 'drive' && !veh) { if (cam) add(s.car, P('wpark')); else if (s.pass === 'd2') { add(s.car, P('psat')); add(s.car, P('psun')); } else add(s.car, P(PARK[s.day])); }
    if (s.go === 'shuttle' && !veh) add(s.adult + s.teen, P('shuttle'));
    /* A12: same sum as Tickets: shown (fee-in) unit prices x quantity */
    var sub = L.reduce(function (a, b) { return a + b[0] * b[1]; }, 0), total = Math.round(L.reduce(function (a, b) { return a + b[0] * WF(b[1]); }, 0) * 100) / 100;
    return { sub: sub, total: total, n: L.length };
  }
  function short(s) {
    var k = key(s); if (!k) return '';
    var nA = s.adult - (s.patron ? 1 : 0), n = nA + s.teen, a = [];
    a.push((n ? n + ' × ' + NS[k] : '') + (s.patron ? (n ? ' + ' : '') + '1 Patron' : '') + (s.kid ? ' + ' + s.kid + (s.kid === 1 ? ' kid' : ' kids') : ''));
    if (s.pass === 'p4' && s.wed) a.push('Wed arrival');
    if (camping(s)) a.push({ tent: 'tent', wcar: 'car camp', scar: 'car camp', wrv: 'RV', none: 'no camping' }[s.sleep]);
    if (!vehicle(s)) { if (s.go === 'drive') a.push(s.car + (s.car === 1 ? ' car' : ' cars')); if (s.go === 'shuttle') a.push('shuttle'); if (s.go === 'bike') a.push('bike'); if (s.go === 'drop') a.push('drop-off'); }
    return a.join(', ');
  }
  function orderNow() { var raw = lsGet(LS) || {}, o = cleanO(raw); return { o: o, real: !!key(o) && !raw.planOnly, raw: raw }; }

  /* ---------- the three answers ---------- */
  var SLEEP_IN = { tent: 'tent', wcar: 'car', scar: 'car', wrv: 'rv', none: 'none' }, SLEEP_OUT = { tent: 'tent', car: 'wcar', rv: 'wrv', none: 'none' };
  var OK = { len: ['p4', 'p3', 'd2', 'd1'], sleep: ['tent', 'car', 'rv', 'none'], go: ['drive', 'shuttle', 'bike', 'drop'] };
  var want = null;
  function startWant() {   // from the ticket order if there is one, else what was picked here last, else 3 days, tent, driving
    var on = orderNow(), p = lsGet(LSP) || {}, w = { len: 'p3', sleep: 'tent', go: 'drive' };
    ['len', 'sleep', 'go'].forEach(function (k) { if (OK[k].indexOf(p[k]) >= 0) w[k] = p[k]; });
    if (on.real) { w.len = on.o.pass; if (SLEEP_IN[on.o.sleep]) w.sleep = SLEEP_IN[on.o.sleep]; if (OK.go.indexOf(on.o.go) >= 0) w.go = on.o.go; }
    return w;
  }
  function effective() {   // what the rules allow; "want" keeps what the person asked for, so going back restores it
    var camp = want.len === 'p4' || want.len === 'p3', sl = camp ? want.sleep : 'none', veh = sl === 'car' || sl === 'rv';
    return { len: want.len, camp: camp, sleep: sl, veh: veh, go: veh ? 'drive' : want.go };
  }
  function persist(e) {
    lsSet(LSP, want);
    var on = orderNow(); if (on.real) return;   // a real ticket order is never changed from here
    var s = cleanO(on.raw); s.pass = e.len; s.sleep = e.camp ? SLEEP_OUT[e.sleep] : 'none'; s.go = e.go; if (s.pass !== 'd1') s.day = null; if (s.pass !== 'p4') s.wed = false;
    s.planOnly = true; lsSet(LS, s);
    try { window.dispatchEvent(new StorageEvent('storage', { key: LS })); } catch (x) {}   // Tickets re-reads the record when it hears this
  }

  /* ---------- Plan your trip ---------- */
  var root = null, lastKey = '', focusReq = '';
  var LEN_T = { p4: '4 days', p3: '3 days', d2: 'Sat + Sun', d1: 'One day' };
  function sel(id, label, opts) { return '<div class="pl-pick"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div>'; }
  function em(id, name) { return '<button type="button" class="pl-at" data-map="' + id + '"><img src="ic2/' + id + '.png" alt="" width="36" height="36" loading="lazy" decoding="async"><span>' + esc(name) + ' on the map</span></button>'; }
  function lnk(label, go) { return '<button type="button" class="pl-tlink" data-go="' + go + '">' + esc(label) + '</button>'; }
  function lowestNow() { try { var r = T.prices.p3, min = Math.min.apply(null, r); return r[T.by.holiday.col] === min; } catch (e) { return false; } }

  function skeleton() {
    return '<div class="pl-in">' +
      '<div class="pl-top"><h1 class="pl-d pl-h1">Plan your trip</h1><div class="pl-picks">' +
        sel('pl-len', 'How long', [['p4', '4 days'], ['p3', '3 days'], ['d2', 'Sat + Sun'], ['d1', 'One day']]) +
        sel('pl-sleep', 'Sleeping', [['tent', 'Tent'], ['car', 'Car camp'], ['rv', 'RV'], ['none', 'Off site']]) +
        sel('pl-go', 'Getting there', [['drive', 'Driving'], ['shuttle', 'Shuttle'], ['bike', 'Bike'], ['drop', 'Drop-off']]) +
      '</div></div>' +
      '<p class="pl-src" id="pl-src"></p><p class="pl-why" id="pl-why" role="status" hidden></p>' +
      '<div class="pl-cols"><div><ol class="pl-trail" id="pl-trail"></ol><p class="pl-hours">Gate, shuttle and gear-truck hours shown are 2026’s. 2027 hours post in early summer.</p></div>' +
      '<div class="pl-vet"><section class="pl-paper pl-card" id="pl-new" aria-labelledby="pl-h-new"><h2 class="pl-d pl-d-card" id="pl-h-new">What’s new for 2027</h2><hr class="pl-rule2"><ul class="pl-newl" id="pl-newl"></ul></section>' +
      '<section class="pl-paper pl-card" aria-labelledby="pl-h-rules"><h2 class="pl-d pl-d-card" id="pl-h-rules">The rules</h2><hr class="pl-rule2">' +
        '<div class="pl-rule"><p>Bring</p><ul><li>' + ic('bottle') + 'Water bottle</li><li>' + ic('id') + 'ID</li><li>' + ic('jacket') + 'Layers</li><li>' + ic('chair') + 'Low chair</li></ul></div>' +
        '<div class="pl-rule pl-rule-no"><p>Leave home</p><ul><li><span>' + ic('dog') + '</span>Pets</li><li><span>' + ic('mug') + '</span>Outside alcohol</li><li><span>' + ic('flame') + '</span>Fires, fireworks</li><li><span>' + ic('shade') + '</span>Shade tents</li><li><span>' + ic('gen') + '</span>Generators</li></ul></div>' +
      '</section></div></div>' +
      '<section class="pl-more" aria-labelledby="pl-h-more"><h2 class="pl-d pl-d-label" id="pl-h-more">Full details</h2><div class="pl-more-g" id="pl-more-g"></div></section>' +
      '</div>' +
      '<div class="pl-nextwrap"><div class="pl-paper pl-next"><div><p class="pl-next-k" id="pl-nk"></p><p class="pl-next-t pl-d" id="pl-nt"></p><p class="pl-next-p"><b class="pl-num" id="pl-np"></b> <span id="pl-nn"></span></p></div><span id="pl-nb"></span></div></div>';
  }
  function detailsHTML() {
    var row = function (id, icn, t, lines) { return '<details id="pl-d-' + id + '"><summary>' + ic(icn) + '<span>' + t + '</span>' + ic('chev', 'pl-ic-sm pl-chev') + '</summary><ul>' + lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></details>'; };
    return row('go', 'car', 'Getting there', [
        '<b>Driving:</b> Welcome Lot, 19208 SE Foster Rd. You need a day, weekend or oversize parking pass (Weekend Parking ' + money(PS('wpark')) + ' a car). Come and go as you like.',
        '<b>Gear:</b> no cars inside the festival. Load heavy bags on the gear trucks at the Welcome Lot and meet them at the Gear Drop nearest your camp.',
        '<b>MAX + shuttle:</b> Green Line to Lents Town Center, then the Pickathon shuttle, ' + money(PS('shuttle')) + ' a rider. No parking at the stop.',
        '<b>Rideshare and drop-off:</b> South Lot, 16581 SE Hagen Rd, if you can carry everything. Otherwise the Welcome Lot.',
        '<b>Flying:</b> PDX is 20 minutes away. Portland is 12 miles.',
        lnk('Read the whole Getting there page', 'page:traveling-to-pickathon')]) +
      row('sleep', 'tent', 'Sleeping', [
        '<b>Tent camping</b> is included with every 3-Day and 4-Day Pass: more than 40 acres of forest.',
        '<b>Lush Camp:</b> shaded, full of ferns, closest to the music. Quiet Camp is inside it; quiet hours run until 9 am.',
        '<b>Wild Camp:</b> the biggest trees on the farm, up on the ridge. More secluded.',
        '<b>Car, van or RV:</b> you need a vehicle camping spot in Willow Camp or South Camp. No generators. Once parked, you stay until Monday.',
        lnk('Places to stay nearby', 'page:lodging') + ' · ' + lnk('See the camps on the map', 'map:lushcamp')]) +
      row('pack', 'jacket', 'Packing', [
        '<b>Everyone:</b> walking shoes, layers for hot days and cool nights, sunscreen and a hat, a water bottle, ID, a battery pack.',
        '<b>Campers:</b> pack light, in containers you can carry from the Gear Drop to your site.',
        '<b>Skip the cooler.</b> Food and drink are on site all weekend. Water is free.',
        lnk('The full packing list', 'page:what-to-bring-to-pickathon')]) +
      row('kids', 'kid', 'Kids', [
        '<b>12 and under are free</b> with a ticketed adult. Teens 13 to 17 are half price.',
        '<b>Coyote</b> is the neighborhood built for families, with its own stage all weekend.',
        '<b>Quiet Camp</b>, inside Lush Camp, is for families and anyone who wants a full night’s sleep.',
        lnk('Coyote', 'hood:coyote')]) +
      row('access', 'info', 'Access', [
        '<b>Write us two weeks ahead</b> at <a href="mailto:' + FEST.mail + '">' + FEST.mail + '</a> to arrange accommodations.',
        'Designated ADA parking and campsites, accessible restrooms. Service animals are welcome.',
        'The farm is natural, uneven ground with long distances between neighborhoods.',
        lnk('Accessibility details', 'page:ada-info')]) +
      row('days', 'cal', 'How the days run', [esc(COPY.daysRun), lnk('See how 2026 ran', 'route:schedule')]);
  }
  function newHTML() {
    var L = [['Aug 4–8', esc(COPY.newDates) + (P('early') ? ', +' + money(PS('early')) + ' each.' : '.')]], H = T && T.by && T.by.holiday;
    if (H && H.dated && !H.over) L.push([H.endS ? esc(H.dayS) + '–' + esc(String(H.endS).replace(/^[A-Za-z]+ /, '')) : 'From ' + esc(H.dayS), esc(H.name) + (lowestNow() ? ', the lowest prices of the year.' : '.') + (H.plans ? '' : ' No payment plans during the sale.' + (T.planNote ? ' ' + esc(T.planNote) : ''))]);
    else if (T && T.cur) L.push([esc(T.cur.name), 'On sale now.' + (T.plans ? ' Orders over ' + money(T.planMin) + ' can be paid in monthly payments, all paid before the festival.' : '')]);
    L.push(['Checkout', esc(COPY.newCheckout)]);
    COPY.zaleLines.slice(0, 3).forEach(function (z) { L.push([esc(z[0]), esc(z[1])]); });
    return L.map(function (l) { return '<li><b>' + l[0] + '</b><span>' + l[1] + '</span></li>'; }).join('');
  }
  function trail(e) {
    var len = e.len, camp = e.camp, sl = e.sleep, veh = e.veh, go = e.go;
    var A = { p4: ['Thu, Aug 5', 'gates 9 am', 'Gates open 9 am to 11 pm. With <b>Wednesday early arrival</b> (' + money(PS('early')) + ' each) you come in from 5 pm on Aug 4.'], p3: ['Fri, Aug 6', 'gates 9 am', 'Gates open 9 am to 11 pm, Thursday to Sunday.'], d2: ['Sat, Aug 7', 'gates 9 am', 'Gates open 9 am to 11 pm both days. Come and go as you like.'], d1: ['Your day', 'gates 9 am', 'Gates open 9 am to 11 pm. Come and go as you like.'] }[len];
    var Pk = veh ? [sl === 'car' ? 'Willow or South Camp' : 'Willow Camp', 'your gate is on your pass', 'You park where you sleep. ' + (sl === 'car' ? 'Car camping from ' + money(WF(Math.min(P('wcar'), P('scar')))) + ' a site: one car and a tent in 16′ × 18′.' : 'RV spot ' + money(PS('wrv')) + ', 26′ to 36′.'), em('willowcamp', 'Willow Camp')]
      : go === 'drive' ? ['19208 SE Foster Rd', 'Welcome Lot', '<b>Type this address, not “Pickathon”, into GPS.</b> ' + (camp ? 'Weekend Parking ' + money(PS('wpark')) + ' a car.' : 'Day parking from ' + money(WF(Math.min(P('pthu'), P('pfri'), P('psat'), P('psun')))) + ' a car.'), em('welcomelot', 'Welcome Lot')]
      : go === 'shuttle' ? ['Lents Town Center', 'MAX Green Line', 'Ride MAX to Lents, then the Pickathon shuttle. ' + money(PS('shuttle')) + ' a rider. No parking at the stop.', '']
      : go === 'bike' ? ['Free bike parking', 'reserve a space', 'A staffed corral at the farm. Most people ride the Springwater Corridor from Portland.', '']
      : ['16581 SE Hagen Rd', 'South Lot drop-off', 'For people who can carry everything. Need the gear truck? Get dropped at the Welcome Lot instead.', em('farmhouse', 'Farmhouse')];
    var W = veh ? ['½ mile', 'or the free shuttle', 'From Willow Camp to the gate. South Camp is across the road from it.', '']
      : go === 'drive' ? ['1 mile', 'or the free shuttle', 'A trail from the Welcome Lot to the gate.' + (camp ? ' Heavy bags ride the gear truck.' : ''), '']
      : go === 'shuttle' ? ['About hourly', '8 am to 2 am', 'The shuttle loops all weekend and lets you off at the gate.', '']
      : go === 'bike' ? ['Ride to the gate', '', 'Lock up at bike parking and walk in.', '']
      : ['At the gate', '', 'The South Lot is at the main entrance, by the Farmhouse.', ''];
    var C = sl === 'tent' ? ['Lush or Wild Camp', 'included', 'Lush: ferns, closest to the music, Quiet Camp inside. Wild: the biggest trees, up on the ridge.', em('lushcamp', 'Lush Camp')]
      : sl === 'car' ? ['Your car and tent', '16′ × 18′', 'An open field under a big willow, or right by the entrance. No generators. Once parked, you stay until Monday.', '']
      : sl === 'rv' ? ['Your RV', '26′ to 36′', 'No generators. Once parked, you stay until Monday.', '']
      : ['Not camping', '', 'Sleep at home or nearby. Hotels and rentals are under Sleeping, below.', ''];
    var X = camp ? ['Mon, Aug 9', 'out by noon', 'Gear trucks run Sunday 8 am to 7 pm and Monday 8 am to noon.', '']
      : go === 'shuttle' ? ['2 am', 'last shuttle', 'Shuttles run until 2 am, so you can stay for the late sets.', '']
      : ['Any time', '', 'Leave when you like. No driving in after 11 pm.', ''];
    var rows = [['Arrive', A], [veh ? 'Park' : go === 'shuttle' ? 'Catch the shuttle' : go === 'drop' ? 'Get dropped off' : go === 'bike' ? 'Ride in' : 'Park', Pk], ['Walk in', W], [camp && sl !== 'none' ? 'Camp' : 'Sleep', C], ['Leave', X]];
    return rows.map(function (r, i) { return '<li class="pl-stop"><span class="pl-stop-n" aria-hidden="true">' + (i + 1) + '</span><div><p class="pl-stop-k">' + r[0] + '</p><p class="pl-stop-big pl-d">' + r[1][0] + (r[1][1] ? ' <small>' + r[1][1] + '</small>' : '') + '</p><p class="pl-stop-d">' + r[1][2] + '</p>' + (r[1][3] || '') + '</div></li>'; }).join('');
  }
  function closeBtn() {
    var w = when();
    if (w === 'pre') return '<button type="button" class="pl-pill pl-pill-gold" data-go="remind">Remind me</button>';
    if (w === 'sale') return '<button type="button" class="pl-pill pl-pill-gold" data-go="route:tickets">Get tickets</button>';
    if (w === 'has') return '<button type="button" class="pl-pill pl-pill-gold" data-go="route:mine">Your passes</button>';
    return '<button type="button" class="pl-pill" data-go="route:tickets">Tickets</button>';
  }
  function update() {
    if (!root || !$('#pl-trail', root)) return;
    var e = effective(), why = [];
    var L = $('#pl-len', root), SL = $('#pl-sleep', root), G = $('#pl-go', root);
    if (!e.camp && want.sleep !== 'none') why.push('<b>' + LEN_T[e.len] + '</b> tickets have no camping, so Sleeping shows Off site. Your pick comes back with a 3 or 4 day pass.');
    if (e.veh && want.go !== 'drive') why.push('<b>' + (e.sleep === 'car' ? 'Car camping' : 'An RV spot') + ' means you drive in</b>, so Getting there shows Driving. ' + { shuttle: 'Shuttle', bike: 'Bike', drop: 'Drop-off' }[want.go] + ' comes back if you switch to a tent.');
    L.value = e.len; SL.value = e.sleep; G.value = e.go;
    [].forEach.call(SL.options, function (o) { o.disabled = !e.camp && o.value !== 'none'; });
    [].forEach.call(G.options, function (o) { o.disabled = e.veh && o.value !== 'drive'; });
    var wy = $('#pl-why', root); wy.hidden = !why.length; wy.innerHTML = why.join('<br>');
    $('#pl-trail', root).innerHTML = trail(e);
    $('#pl-newl', root).innerHTML = newHTML();
    /* closing card: the person's own order if one exists; otherwise an example, labeled as one */
    var on = orderNow(), k = $('#pl-nk', root), t = $('#pl-nt', root), p = $('#pl-np', root), n = $('#pl-nn', root);
    if (on.real) {
      var tt = totals(on.o); k.textContent = 'Your order so far'; t.textContent = short(on.o); p.textContent = money(tt.total); n.textContent = 'fee included';
      $('#pl-src', root).innerHTML = 'Filled in from <b>your ticket order</b>. Change anything; your order stays as it is.';
    } else {
      var ex = { pass: e.len, day: 'dsat', adult: 2, teen: 0, kid: 0, wed: false, sleep: e.camp ? SLEEP_OUT[e.sleep] : 'none', go: e.go, car: 1, patron: false }, te = totals(ex);
      k.textContent = 'Example for two adults';
      t.textContent = LEN_T[e.len] + ', ' + { tent: 'tent', car: 'car camp', rv: 'RV', none: 'no camping' }[e.sleep] + ', ' + { drive: e.veh ? 'driving' : '1 car', shuttle: 'shuttle', bike: 'bike', drop: 'drop-off' }[e.go];
      p.textContent = money(te.total); n.textContent = 'fee included' + (e.len === 'd1' ? ', Saturday' : '');
      $('#pl-src', root).textContent = 'Pick your three. Saved on this device and used on Tickets.';
    }
    $('#pl-nb', root).innerHTML = closeBtn();
    guard(root);
  }
  function draw(el) {
    root = el; readTix(); want = startWant();
    el.innerHTML = skeleton(); $('#pl-more-g', el).innerHTML = detailsHTML();
    update();
  }
  function doFocus() {
    if (!focusReq || !root) return; var f = focusReq; focusReq = '';
    var tgt = f === 'new' ? $('#pl-new', root) : $('#pl-d-' + f, root); if (!tgt) return;
    if (tgt.tagName === 'DETAILS') tgt.open = true;
    setTimeout(function () { try { tgt.scrollIntoView({ block: 'start' }); var s = tgt.querySelector('summary') || tgt.querySelector('h2'); if (s) { if (!s.hasAttribute('tabindex') && s.tagName !== 'SUMMARY') s.setAttribute('tabindex', '-1'); s.focus({ preventScroll: true }); } } catch (x) {} }, 60);
  }

  /* ---------- zoom on these pages (build notes: drop user-scalable=no and the text-size-adjust lock) ---------- */
  var VP0 = null, zoomOn = false;
  function zoom(on) {
    if (on === zoomOn) return; zoomOn = on;
    var vm = $('meta[name=viewport]'); if (!vm) return;
    if (VP0 === null) VP0 = vm.getAttribute('content') || '';
    vm.setAttribute('content', on ? 'width=device-width, initial-scale=1, viewport-fit=cover' : VP0);
    document.documentElement.classList.toggle('pl2-zoom', on);
  }
  /* the installed app also blocks pinch with gesture listeners on document; on these pages they are skipped (capture on window runs first) */
  ['gesturestart', 'gesturechange'].forEach(function (t) { window.addEventListener(t, function (e) { if (zoomOn) e.stopImmediatePropagation(); }, true); });

  /* ---------- navigation ---------- */
  function mapH(id) { try { sessionStorage.setItem('pkmap.focus', id); sessionStorage.setItem('pkmap.force', '1'); } catch (e) {} var a = app(); if (!a) return; a.setState({ mapHood: id, sheet: false, mapHover: null }); a.go('hoods'); }
  function go(to) {
    var a = app(); if (!a) return; var c = to.indexOf(':'), k = c < 0 ? to : to.slice(0, c), v = c < 0 ? '' : to.slice(c + 1);
    if (k === 'route') { if (['home', 'lineup', 'schedule', 'stories', 'tickets', 'mine', 'info', 'hoods', 'about', 'build', 'partners', 'press', 'presents'].indexOf(v) >= 0) a.reset(v); else a.go(v); return; }
    if (k === 'page') { a.go('page', { p: v }); return; }
    if (k === 'hood') { a.go('hood', { h: v }); return; }
    if (k === 'map') { mapH(v); return; }
    if (k === 'plan') { focusReq = v; if (topR() === 'info' && root) doFocus(); else a.reset('info'); return; }
    if (k === 'remind') { if (window.__pkRemind) window.__pkRemind(); else a.go('tickets'); return; }   // the Remind me sheet (build item 4) is another engineer's; until it exposes __pkRemind, Tickets shows the reminder field first before the sale
    if (k === 'signin') { if (window.__pkAcct && window.__pkAcct.signIn) window.__pkAcct.signIn(); else a.go('account'); return; }
    if (k === 'search') { a.go('search'); a.setState({ gq: v }); return; }   // go('search') clears the query, so it is set after
    if (k === 'cookies') { a.setState({ ckChoice: '' }); try { window.localStorage.removeItem('pk-ck'); } catch (e) {} return; }
  }
  function topR() { try { var s = site().stack; return (s[s.length - 1] || {}).r; } catch (e) { return ''; } }

  /* ---------- the More sheet: a dialog; focus moves in, Escape closes, focus returns, the More tab carries aria-expanded ---------- */
  var scrim = null, opener = null, inerted = [];
  function social() { var S = (site().data || {}).social || [], o = {}; S.forEach(function (x) { o[String(x[0]).toLowerCase()] = x[1]; }); return [['Instagram', o.instagram], ['YouTube', o.youtube], ['Spotify', o.spotify]].filter(function (x) { return x[1]; }); }
  function follow(cls) { return social().map(function (x) { return '<a class="' + cls + '" href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + x[0] + '<span class="pl-vh"> (opens in a new tab)</span></a>'; }).join(''); }
  function moreHTML() {
    var u = site().user;
    return '<div class="pl-sheet-top"><h2 class="pl-d pl-d-card" id="pl-more-h">More</h2><button type="button" class="pl-x" data-close aria-label="Close">' + ic('x') + '</button></div>' +
      '<form class="pl-search" role="search" id="pl-more-f"><label class="pl-search-l">' + ic('search', 'pl-ic-sm') + '<span class="pl-vh">Search Pickathon</span><input type="search" name="q" placeholder="Search: parking, kids, shuttle…" enterkeyhint="search" autocomplete="off"></label></form>' +
      '<div class="pl-chips">' + [['Parking', 'go'], ['Camping', 'sleep'], ['Shuttle', 'go'], ['Kids', 'kids'], ['What’s new', 'new']].map(function (c) { return '<button type="button" class="pl-pill pl-pill-sm" data-go="plan:' + c[1] + '">' + c[0] + '</button>'; }).join('') + '</div>' +
      '<nav class="pl-mmain" aria-label="Festival">' + [['Lineup', '2027 and every year', 'lineup'], ['Plan your trip', 'Getting there, rules', 'info'], ['Schedule', '2026 for now', 'schedule'], ['Stories', '', 'stories']].map(function (n) { var cur = topR() === n[2]; return '<button type="button" data-go="route:' + n[2] + '"' + (cur ? ' aria-current="page"' : '') + '><span class="pl-d">' + n[0] + '</span>' + (n[1] ? '<small>' + n[1] + '</small>' : '') + '</button>'; }).join('') + '</nav>' +
      '<p class="pl-mk" id="pl-mk">About</p><nav class="pl-mabout" aria-labelledby="pl-mk">' + [['Our story', 'route:about'], ['Build with Pickathon', 'route:build'], ['Partners', 'route:partners'], ['Neighbors', 'page:neighbors'], ['Press', 'route:press'], ['Pickathon Presents', 'route:presents']].map(function (n) { return '<button type="button" data-go="' + n[1] + '">' + n[0] + '</button>'; }).join('') + '</nav>' +
      '<div class="pl-mfoot"><button type="button" class="pl-pill pl-pill-sm" data-go="' + (u ? 'route:account' : 'signin') + '">' + (u ? 'Your account' : 'Sign in') + '</button><nav aria-label="Follow Pickathon">' + follow('pl-mf') + '</nav></div>';
  }
  function tabBtns() { return $$('#root nav[aria-label="App"] button').filter(function (b) { return /^\s*More\s*$/.test(b.textContent); }); }
  function deskBtn() { return $('#root [data-more-wrap] > button'); }
  function marks() {   // re-applied after every render: the renderer resets attributes the template does not have
    if (OLD.more) return;
    tabBtns().forEach(function (b) { b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', scrim ? 'true' : 'false'); });
    var d = deskBtn(); if (d) { d.setAttribute('aria-haspopup', 'dialog'); d.setAttribute('aria-expanded', scrim ? 'true' : 'false'); }
  }
  function closeMore(keepFocus) {
    if (!scrim) return; scrim.remove(); scrim = null;
    inerted.forEach(function (e) { e.removeAttribute('inert'); }); inerted = [];
    marks(); if (!onPlan()) zoom(false);
    if (!keepFocus && opener && document.contains(opener)) { try { opener.focus(); } catch (e) {} }
  }
  function openMore(from) {
    if (scrim) { closeMore(); return; }
    opener = from || document.activeElement;
    scrim = document.createElement('div'); scrim.className = 'pl2 pl-scrim';
    scrim.innerHTML = '<div class="pl-sheet" role="dialog" aria-modal="true" aria-labelledby="pl-more-h">' + moreHTML() + '</div>';
    ['root', 'pk-co'].forEach(function (id) { var e = document.getElementById(id); if (e && !e.hasAttribute('inert')) { e.setAttribute('inert', ''); inerted.push(e); } });
    document.body.appendChild(scrim); guard(scrim); marks(); zoom(true);
    scrim.addEventListener('click', function (e) {
      if (e.target === scrim || (e.target.closest && e.target.closest('[data-close]'))) { closeMore(); return; }
      var b = e.target.closest ? e.target.closest('[data-go]') : null; if (b) { closeMore(true); go(b.getAttribute('data-go')); }
    });
    $('#pl-more-f', scrim).addEventListener('submit', function (e) { e.preventDefault(); var v = (e.target.q.value || '').trim(); closeMore(true); go('search:' + v); });
    var f = $('[data-close]', scrim); if (f) { try { f.focus(); } catch (e) {} }
  }
  document.addEventListener('keydown', function (e) {
    if (!scrim) return;
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closeMore(); return; }
    if (e.key === 'Tab') {   // keep Tab inside the sheet (the page behind is inert as well)
      var F = $$('button,a[href],input,select', scrim).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); if (!F.length) return;
      if (e.shiftKey && document.activeElement === F[0]) { e.preventDefault(); F[F.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === F[F.length - 1]) { e.preventDefault(); F[0].focus(); }
    }
  }, true);
  /* the phone More tab and the desktop More button open this sheet instead of the old menu (capture runs before the app's own handler) */
  document.addEventListener('click', function (e) {
    if (OLD.more || !e.target.closest) return;
    var b = e.target.closest('#root nav[aria-label="App"] button, #root [data-more-wrap] > button'); if (!b) return;
    if (b.closest('[data-more-wrap]') || /^\s*More\s*$/.test(b.textContent)) { e.preventDefault(); e.stopPropagation(); openMore(b); }
  }, true);

  /* ---------- the short footer ---------- */
  var footKey = '';
  function footHTML() {
    return '<footer class="pl-foot"><div class="pl-foot-in">' +
      '<div class="pl-foot-id"><button type="button" class="pl-foot-logo" data-go="route:home" aria-label="Pickathon home"><img src="footer-logo.png" alt="" width="97" height="40" loading="lazy" decoding="async"></button>' +
      '<p class="pl-faddr">' + FEST.place + '<br>' + FEST.long + ' · <a href="mailto:' + FEST.mail + '">' + FEST.mail + '</a></p></div>' +
      '<nav class="pl-flinks" aria-label="About Pickathon">' + [['Our story', 'route:about'], ['Build with Pickathon', 'route:build'], ['Partners', 'route:partners'], ['Neighbors', 'page:neighbors'], ['Press', 'route:press'], ['Contact', 'page:contact-pickathon']].map(function (n) { return '<button type="button" data-go="' + n[1] + '">' + n[0] + '</button>'; }).join('') + '</nav>' +
      '<nav class="pl-fsoc" aria-label="Follow Pickathon">' + follow('') + '</nav>' +
      /* legal line kept from the old footer (not in the design): privacy, terms and the cookie / do-not-sell choice must stay reachable */
      '<p class="pl-flegal"><span>' + FEST.copy + '</span><a href="https://pickathon.com/privacy/" target="_blank" rel="noopener">Privacy</a><a href="https://pickathon.com/terms/" target="_blank" rel="noopener">Terms</a><button type="button" data-go="cookies">Cookie choices · Do not sell or share my info</button></p>' +
      '</div></footer>';
  }
  function syncFoot() {
    var el = document.getElementById('pl2-foot'); if (!el || OLD.foot) return;
    var k = social().length + '|' + (el.firstChild ? 1 : 0);
    if (!el.firstChild || k !== footKey) { el.innerHTML = footHTML(); guard(el); footKey = social().length + '|1'; }
  }

  /* ---------- keeping in step with the app ---------- */
  function onPlan() { return !!document.getElementById('pl2'); }
  function stateKey() { var F = window.pkFeed || {}; return [when(), T ? T.show.id : '', T ? T.col : '', F.state, F.at, site().data ? 1 : 0].join('|'); }
  function sync() {
    var el = document.getElementById('pl2');
    if (!el) { root = null; if (!scrim) zoom(false); }
    else { readTix(); var k = stateKey(); if (el !== root || !el.firstChild || k !== lastKey) { lastKey = k; draw(el); } zoom(true); doFocus(); }
    syncFoot(); marks();
  }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); try { sync(); } catch (e) { if (window.console) console.error('pk-plan2', e); } return r; };
  document.addEventListener('change', function (e) {
    if (!root || !root.contains(e.target)) return; var t = e.target;
    if (t.id === 'pl-len') want.len = t.value; else if (t.id === 'pl-sleep') want.sleep = t.value; else if (t.id === 'pl-go') want.go = t.value; else return;
    persist(effective()); update();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-go],[data-map]') : null; if (!b) return;
    var own = (root && root.contains(b)) || b.closest('#pl2-foot'); if (!own) return;
    e.preventDefault(); if (b.hasAttribute('data-map')) mapH(b.getAttribute('data-map')); else go(b.getAttribute('data-go'));
  });
  window.addEventListener('storage', function (e) { if (e.key === LS && root && e.isTrusted) { want = startWant(); update(); } });   // an order changed in another tab
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { sync(); } catch (e) {} } });

  window.__pkPlan2 = { refresh: function () { lastKey = ''; footKey = ''; sync(); }, more: openMore, closeMore: closeMore, focus: function (f) { go('plan:' + f); }, copy: COPY };
  function boot(n) { var a = app(); if (!a || !a.state || !a.state.data) { if (n < 200) setTimeout(function () { boot(n + 1); }, 50); return; } try { sync(); } catch (e) {} }
  try { sync(); } catch (e) {}
  boot(0);
})();
