/* pk-tk2: Tickets, round 2 design (Nov 11 2026). Source: tools/tickets_r2/tk2.js, spliced into index.html by tools/tickets_r2/build.py.
   The page is drawn into <div id="tk2" data-pk-own> (the app's renderer leaves the inside of a data-pk-own element alone).
   Every price, sale date and round name comes from window.pkTix() (the pk-ticket-settings block) or the live price feed. None is typed here.
   The order is ONE record, kept in the browser (localStorage "pk27order") so a reload, a tab switch or a sleeping phone loses nothing.

   RETURNING BUYERS ("Same again"). OFF by default: the switch is sameAgain in the pk-ticket-settings block. While it is off the sign-in line
   and the shortcut never show. When it is on, the ticket system must supply the signed-in buyer's last order through ONE function:
     window.pkLastOrder()  ->  null (not signed in, or no earlier order)
                           ->  { year: 2026,                      // festival year of that order (shown nowhere yet, kept for the record)
                                 pass: 'p4' | 'p3' | 'd2' | 'd1' | 'pat',  // 4 days, 3 days, Sat + Sun, one day, Patron (its own ticket, any age)
                                 day:  'dthu' | 'dfri' | 'dsat' | 'dsun' | null,   // only with pass 'd1'
                                 adult: 2, teen: 0, kid: 0,        // people. Weekend passes: adults 18+, teens 13-17, kids.
                                                                   // Day tickets: adult = everyone 13 and up (no teen price). Patron: adult = Patron passes, any age.
                                 wed: false,                       // Wednesday early arrival (4-day only; Patron includes Wednesday)
                                 sleep: 'tent' | 'wcar' | 'scar' | 'wrv' | 'none', // tent, car camping Willow, car camping South, RV Willow, not camping
                                 go: 'drive' | 'shuttle' | 'bike' | 'drop' | 'later',
                                 car: 1,                           // cars to park (with go 'drive')
                                 big: false,                       // oversized vehicle, 16' to 24' (weekend parking only)
                                 dp: false }                       // Sat + Sun only: true = Saturday and Sunday day parking instead of Weekend parking
   Here it returns null, so the page shows the sign-in line. It must answer at once (no waiting): fetch the order when the buyer signs in,
   keep it, then call window.__pkTk2.refresh() and the "Welcome back" slip appears. It never calls the ticket system by itself.
   PASSES ALREADY BOUGHT: window.pkMyPasses() -> null, or [{ name: '3-Day Pass', qty: 2 }]. Null here; a signed-in buyer sees a slip without a count. */
(function () {
  'use strict';
  if (!window.pkLastOrder) window.pkLastOrder = function () { return null; };
  if (!window.pkMyPasses) window.pkMyPasses = function () { return null; };

  var FEE = (window.pkFeeRate ? window.pkFeeRate() : 0.05), LS = 'pk27order', SSW = 'pk27where', LSR = 'pk27remind', LSS = 'pk27saved';
  var YEAR = 2027, DAYS = [['w', 'W', 'Wed', 'Wednesday', 'Aug 4'], ['dthu', 'Th', 'Thu', 'Thursday', 'Aug 5'], ['dfri', 'Fr', 'Fri', 'Friday', 'Aug 6'], ['dsat', 'Sa', 'Sat', 'Saturday', 'Aug 7'], ['dsun', 'Su', 'Sun', 'Sunday', 'Aug 8']];
  var DAY = {}; DAYS.forEach(function (d) { DAY[d[0]] = d; });
  var PARK = { dthu: 'pthu', dfri: 'pfri', dsat: 'psat', dsun: 'psun' };
  var N = { p4: '4-Day Pass', p3: '3-Day Pass', d2: 'Sat + Sun Ticket', dthu: 'Thursday Ticket', dfri: 'Friday Ticket', dsat: 'Saturday Ticket', dsun: 'Sunday Ticket', pat: 'Patron Pass' };
  var NS = { p4: '4-Day', p3: '3-Day', d2: 'Sat + Sun', dthu: 'Thursday', dfri: 'Friday', dsat: 'Saturday', dsun: 'Sunday', pat: 'Patron' };
  var SLEEPN = { wcar: 'Car camping, Willow Camp', scar: 'Car camping, South Camp', wvan: 'Camper van, Willow Camp', svan: 'Camper van, South Camp', wrv: 'RV, Willow Camp', srv: 'RV, South Camp' };
  var BLANK = { pass: null, day: null, adult: 1, teen: 0, kid: 0, wed: false, sleep: 'tent', go: 'later', car: 1, big: false, dp: false, sites: 1, pwr: false, pday: '' };
  var OK = { pass: ['p4', 'p3', 'd2', 'd1', 'pat', 'none'], day: ['dthu', 'dfri', 'dsat', 'dsun'], sleep: ['tent', 'wcar', 'scar', 'wvan', 'svan', 'wrv', 'srv', 'none'], go: ['later', 'drive', 'shuttle', 'bike', 'drop'] };
  /* Zale, Nov 13: everything on sale is buyable here, and one order can hold several pass types. S.more holds the pass groups already
     added ("Add a different pass"); S is the group being built. Pass 'none' = "I already have my pass": add-ons on their own.
     S.x holds the extras by price id: the five Curation seatings, dishware and Give back. */
  var VEH = /^(wcar|scar|wvan|svan|wrv|srv)$/, PWR = { wvan: 'wvanp', wrv: 'wrvp' };   // South Camp van and RV sites include power; Willow power is an add-on
  var XID = ['cfri', 'csatb', 'csath', 'csatd', 'csunb', 'plate', 'cup', 'coozie', 'tools', 'student'], MEALS = XID.slice(0, 5), DISH = ['cup', 'plate', 'coozie'], GIVE = ['tools', 'student'];
  var XN = { cfri: 'Curation · Friday dinner', csatb: 'Curation · Saturday brunch', csath: 'Curation · Saturday happy hour', csatd: 'Curation · Saturday dinner', csunb: 'Curation · Sunday brunch', plate: 'Souvenir plate', cup: 'Souvenir cup', coozie: 'Cup coozie', tools: 'Fund the Tools', student: 'Sponsor a Student' };
  var MEAL = { cfri: 2, csatb: 3, csath: 3, csatd: 3, csunb: 4 };   // the festival day (index into DAYS) a seat needs a ticket for
  /* Ticket kinds (Zale, Nov 11 22:50). Weekend passes: camping, teens 13-17 pay the Teen 4-Day (half the 4-Day). Day tickets: one price for everyone 13 and up,
     no teen price, no camping. Patron: its own ticket, any age, backstage, Wednesday to Sunday. Kids 12 and under are free with a weekend pass or a day ticket. */
  function kind(p) { return p === 'p4' || p === 'p3' ? 'wk' : p === 'd2' || p === 'd1' ? 'day' : p === 'pat' ? 'pat' : p === 'none' ? 'none' : ''; }

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
  function when() { var s = site(); if ((s.season || 'off') !== 'off' || T.open) return 'sale'; return T.next ? 'pre' : 'closed'; }   /* Nov 15 evening: pkTix already applies the clock and the WordPress switch */
  function P(id) { var f = window.pkFeedItem && window.pkFeedItem(id); if (f && f.price && typeof f.price.amount === 'number') return f.price.amount / 100; var r = T.prices[id]; return r ? Math.ceil(r[T.col]) : 0; }   // the site's one price rule: the live feed if it answered, else the settings block, whole dollars
  function WF(n) { return window.pkWithFee ? window.pkWithFee(n) : Math.round(n * (1 + FEE) * 100) / 100; }   // A12: every price shown includes the fee (the head block's one rule)
  function PS(id) { return WF(P(id)); }
  function sold(id) { var f = window.pkFeedItem && window.pkFeedItem(id); if (!f && needFeed() && (window.pkFeed || {}).state === 'live') return true; return !!(f && f.soldOut); }   // with the live feed required, a ticket the feed does not list is not offered
  /* Once the site is live (PK_LIVE, set by the launch switch) the sale shows only prices the ticket system sent. If the feed has not answered yet,
     or failed, the page says so instead of falling back to the built-in table, so a missed price update can never show a wrong price.
     T.requireFeed in the settings block or ?feedreq=1 turns this on in test; ?feedreq=0 turns it off. */
  function qp(k) { try { return new URLSearchParams(window.location.search).get(k); } catch (e) { return null; } }
  function needFeed() { var q = qp('feedreq'); if (q === '0') return false; return !!(window.PK_LIVE || (T && T.requireFeed) || q === '1'); }
  var tries = 0;
  function gate() { if (!T) readTix(); if (when() === 'sale' && noIds) return 'down'; if (when() !== 'sale' || !needFeed()) return ''; var F = window.pkFeed || {};
    if (F.state === 'fallback' && tries < 2 && typeof window.pkFeedLoad === 'function') { tries++; retryFeed(tries * 2000); return 'loading'; }   // audit Nov 13: a busy ticket office on sale morning gets two more chances (2 s, then 4 s) before the page says so
    return F.state === 'live' ? (tries = 0, '') : F.state === 'fallback' ? 'down' : 'loading'; }
  function retryFeed(ms) { window.pkFeed = { url: (window.pkFeed || {}).url, state: 'loading', byCode: null, at: Date.now() }; setTimeout(function () { try { window.pkFeedLoad(function () { lastKey = ''; sync(); }); } catch (x) {} }, ms); }
  /* C3 (Zale, Nov 11): Checkout hands the order to the pickathon.com pay page. It posts tickets[<id>]=quantity, one field per line, with the
     ticket system's own ids from the live feed (ticketTypes[].id). If any line has no id the order can't be handed over: the page holds on
     "Prices didn't load" (Try again reloads the feed). The in-site preview sheet only opens when staff turn on checkoutPreview. */
  var noIds = false, sending = false;
  window.addEventListener('pageshow', function () { if (sending) { sending = false; lastKey = ''; try { sync(); } catch (e) {} } });   // Back from the pay page: the buttons work again
  function fmsId(id) { var f = window.pkFeedItem && window.pkFeedItem(id); return f && f.id !== undefined && f.id !== null && String(f.id) !== '' ? String(f.id) : ''; }
  function handoff(o) {
    var C = window.PK_TICKETS || {}, url = String(C.checkoutUrl || 'https://pickathon.com/tickets-new'), F = window.pkFeed || {};
    var lines = (o.items || []).filter(function (i) { return (i.qty || 0) > 0; }), bad = lines.filter(function (i) { return !fmsId(i.id); });
    if (F.state !== 'live' || !lines.length || bad.length) { noIds = true; lastKey = ''; sync(); try { window.scrollTo(0, 0); var m = document.getElementById('pk-scroll-phone'); if (m) m.scrollTop = 0; var g = $('.tk-gate', root); if (g) { g.setAttribute('tabindex', '-1'); g.focus(); } } catch (e) {} return false; }
    var f = document.createElement('form'); f.method = 'POST'; f.action = url; f.style.display = 'none'; f.setAttribute('data-pk-handoff', '1');
    var sum = {}; lines.forEach(function (i) { var k = fmsId(i.id); sum[k] = (sum[k] || 0) + (i.qty || 1); });
    Object.keys(sum).forEach(function (k) { var inp = document.createElement('input'); inp.type = 'hidden'; inp.name = 'tickets[' + k + ']'; inp.value = String(sum[k]); f.appendChild(inp); });
    giftsOk(S).forEach(function (g, i) {   /* Nov 15: gifts ride along for the ticket system (outbox site_design-10). FMS moves tickets with first name, last name, email and the picked tickets. */
      var add = function (k, v) { var inp = document.createElement('input'); inp.type = 'hidden'; inp.name = 'gifts[' + i + '][' + k + ']'; inp.value = String(v); f.appendChild(inp); };
      add('firstName', g.to.first); add('lastName', g.to.last); add('emailAddress', g.to.email); add('fromName', g.from.name); add('note', g.note); add('sendOn', g.on);
      g.passes.forEach(function (p) { if (fmsId(p.id)) add('tickets][' + fmsId(p.id), p.q); });
    });
    if (sending) return true; sending = true;   // audit Nov 13: a double tap (or a tap while the page is still leaving) sends one order, not two
    $$('[data-act="go"],[data-sheetgo]').forEach(function (b) { b.setAttribute('aria-disabled', 'true'); b.textContent = 'Opening checkout…'; });
    document.body.appendChild(f); save(); f.submit(); return true;
  }
  function gateHTML(g) {
    var t = g === 'down' ? 'Prices didn\u2019t load' : 'Getting today\u2019s prices', b = g === 'down' ? 'The ticket office didn\u2019t answer. Check your connection, then try again.' : 'One moment. Prices come straight from the ticket office.';
    return '<div class="tk-in"><div class="tk-paper tk-head">' + logo() + '<div class="tk-head-t"><h1 class="tk-d">Tickets</h1></div></div>' +
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
  function minPS(ids) { return WF(minP(ids)); }
  function pacific(t) { return String(t || '').replace(/\s*PT$/, ' Pacific'); }
  function planLine(total) {   // same sum as the site's planLine: first payment today, then monthly, the last by plans.lastPayment
    var n = Math.max(2, T.planN), c = Math.round(total * 100), d0 = Math.ceil(c / (n * 100)) * 100, rest = c - d0, k = n - 1, p1 = Math.ceil(rest / k), pl = rest - p1 * (k - 1);
    return money(d0 / 100) + ' today, then ' + (p1 === pl ? k + ' monthly payments of ' + money(p1 / 100) : k === 2 ? 'monthly payments of ' + money(p1 / 100) + ' and ' + money(pl / 100) : (k - 1) + ' monthly payments of ' + money(p1 / 100) + ' and one of ' + money(pl / 100)) + lastBy();
  }
  function lastBy() { var lp = ((window.PK_TICKETS || {}).plans || {}).lastPayment, m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(lp || ''); if (!m) return ''; return ', the last by ' + ['January','February','March','April','May','June','July','August','September','October','November','December'][+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1]; }   // test r3: say when the plan ends

  /* ---------- the one order record ---------- */
  var S = load();
  function int(v, lo, hi, d) { var n = parseInt(v, 10); return n >= lo && n <= hi ? n : d; }
  /* one pass group: a pass, its day (one-day tickets), the people on it, and Wednesday (4-day) */
  function cleanG(s) {
    s = s || {}; var o = { pass: null, day: null, adult: int(s.adult, 0, 12, 1), teen: int(s.teen, 0, 12, 0), kid: int(s.kid, 0, 12, 0), wed: false };
    if (OK.pass.indexOf(s.pass) >= 0) o.pass = s.pass;
    if (o.pass === 'd1' && OK.day.indexOf(s.day) >= 0) o.day = s.day;
    o.wed = !!s.wed && o.pass === 'p4';
    var kd = kind(o.pass);   // a day ticket has one price for 13 and up; a Patron Pass is for any age: the counts fold together, so no teen claim is left over
    if (kd === 'day' && o.teen) { o.adult = Math.min(12, o.adult + o.teen); o.teen = 0; }
    if (kd === 'pat' && (o.teen || o.kid)) { o.adult = Math.min(12, o.adult + o.teen + o.kid); o.teen = 0; o.kid = 0; }
    if (kd === 'pat' && !o.adult) o.adult = 1;
    if (kd === 'none') { o.teen = 0; o.kid = 0; }   // add-ons only: "adult" is just how many people (shuttle riders)
    return o;
  }
  function gkey(g) { return g.pass === 'd1' ? g.day : g.pass === 'none' ? null : g.pass; }
  function gok(g) { return !!gkey(g) && g.adult > 0; }
  /* ---------- gifts (Zale, Nov 15): any pass in the order can go to someone else, with a photo postcard (gx.js) ---------- */
  var GIFTN = { teen: 'Teen 4-Day Pass', patron: 'Patron Pass' }, GSUB = { p4: 'Thu–Sun, Aug 5–8, 2027 · camping in the forest included', p3: 'Fri–Sun, Aug 6–8, 2027 · camping in the forest included', d2: 'Sat + Sun, Aug 7–8, 2027', dthu: 'Thursday, Aug 5, 2027', dfri: 'Friday, Aug 6, 2027', dsat: 'Saturday, Aug 7, 2027', dsun: 'Sunday, Aug 8, 2027', teen: 'Thu–Sun, Aug 5–8, 2027 · ages 13 to 17', patron: 'Wed–Sun, Aug 4–8, 2027 · backstage, any age' };
  function str(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n); }
  function cleanGifts(a) {
    return (Array.isArray(a) ? a : []).slice(0, 8).map(function (g) {
      g = g || {}; var to = g.to || {}, fr = g.from || {};
      return { from: { name: str(fr.name, 60), email: str(fr.email, 120) }, to: { first: str(to.first, 40), last: str(to.last, 40), email: str(to.email, 120) }, note: str(g.note, 240), on: /^\d{4}-\d{2}-\d{2}$/.test(g.on || '') ? g.on : '',
        passes: (Array.isArray(g.passes) ? g.passes : []).slice(0, 8).map(function (p) { return { id: str(p.id, 12), n: str(p.n, 60), sub: str(p.sub, 90), q: Math.max(1, Math.min(12, parseInt(p.q, 10) || 1)) }; }) };
    }).filter(function (g) { return g.to.first && g.to.email && g.passes.length; });
  }
  function giftable(s, skip) {   /* the passes in this order that can be given, less what other gifts already hold */
    var L = lines(s).filter(function (l) { return l.q > 0 && (N[l.id] || GIFTN[l.id]); }), used = {};
    (s.gifts || []).forEach(function (g, i) { if (i !== skip) g.passes.forEach(function (p) { used[p.id] = (used[p.id] || 0) + p.q; }); });
    return L.map(function (l) { return { id: l.id, n: GIFTN[l.id] || N[l.id], sub: GSUB[l.id] || '', max: l.q - (used[l.id] || 0) }; }).filter(function (p) { return p.max > 0; });
  }
  function giftsOk(s) {   /* gifts shrink with the order: never more given than bought */
    var have = {}; lines(s).forEach(function (l) { have[l.id] = (have[l.id] || 0) + (l.q || 0); });
    return (s.gifts || []).map(function (g) { return Object.assign({}, g, { passes: g.passes.map(function (p) { var q = Math.min(p.q, have[p.id] || 0); have[p.id] = (have[p.id] || 0) - q; return Object.assign({}, p, { q: q }); }).filter(function (p) { return p.q > 0; }) }); }).filter(function (g) { return g.passes.length; });
  }
  function giftLabel(g) { var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], d = g.on ? g.on.split('-') : null; return 'Gift to ' + esc(g.to.first) + ': ' + g.passes.map(function (p) { return p.q + ' × ' + esc(p.n); }).join(', ') + (d ? ', arrives ' + M[+d[1] - 1] + ' ' + (+d[2]) : ', sent at checkout'); }
  function giftForm(i, after) {
    if (!window.pkGift) return; S.gifts = giftsOk(S); var cur = i >= 0 ? S.gifts[i] : null, P0 = giftable(S, i);
    if (cur) cur.passes.forEach(function (p) { var m = P0.filter(function (x) { return x.id === p.id; })[0]; if (m) m.max = Math.max(m.max, p.q); });
    if (!P0.length) return;
    window.pkGift.form(P0, cur, function (g) { if (g) { if (cur) S.gifts[i] = g; else S.gifts.push(g); } else if (cur) S.gifts.splice(i, 1); S = clean(S); save(); update(); if (after) after(); live(g ? 'Gift added: ' + giftLabel(g).replace(/<[^>]+>/g, '') + '.' : 'Gift removed.'); });
  }
  function clean(s) {
    var o = {}, k; s = s || {};
    for (k in BLANK) o[k] = BLANK[k];
    var g = cleanG(s); ['pass', 'day', 'adult', 'teen', 'kid', 'wed'].forEach(function (f) { o[f] = g[f]; });
    ['sleep', 'go'].forEach(function (f) { if (OK[f].indexOf(s[f]) >= 0) o[f] = s[f]; });
    o.car = int(s.car, 1, 12, 1); o.sites = int(s.sites, 1, 6, 1); o.big = !!s.big;
    o.more = []; (Array.isArray(s.more) ? s.more : []).forEach(function (x) { var c = cleanG(x); if (gok(c) && o.more.length < 6) o.more.push(c); });
    o.x = {}; var X = s.x || {}; XID.forEach(function (id) { var n = int(X[id], 1, 12, 0); if (n) o.x[id] = n; });
    o.pwr = !!s.pwr && !!PWR[o.sleep];
    o.pday = o.pass === 'none' && OK.day.indexOf(s.pday) >= 0 ? s.pday : '';
    o.dp = !!s.dp && (pbase(o) || {}).pass === 'd2' && o.pass !== 'none';
    o.gifts = cleanGifts(s.gifts);
    return o;
  }
  function groups(s) { var g = (s.more || []).slice(); if (gok(s)) g.push(s); return g; }   // every pass group with someone on it
  function pbase(s) { return s.pass && s.pass !== 'none' && gkey(s) ? s : (s.more || [])[0] || null; }   // the pass that decides which parking fits
  function load() { var s = null; try { s = JSON.parse(window.localStorage.getItem(LS) || 'null'); } catch (e) {} return clean(s); }
  function save() { try { var o = clean(S); o.at = Date.now(); window.localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function key(s) { return gkey(s); }
  function camping(s) { return s.pass === 'none' || groups(s).concat(gkey(s) ? [s] : []).some(function (g) { return kind(g.pass) === 'wk' || g.pass === 'pat'; }); }
  function vehicle(s) { return camping(s) && VEH.test(s.sleep); }
  function off(id) { return sold(id) || !(P(id) > 0); }   // a paid item with no price (the backup table's $0) is not offered
  function cover(s) { if (s.pass === 'none') return [1, 1, 1, 1, 1]; var c = [0, 0, 0, 0, 0]; groups(s).forEach(function (g) { strip(g).forEach(function (x, i) { if (x) c[i] = 1; }); }); return c; }   // the days this order lets someone in
  function xok(id, s) { s = s || S; return !off(id) && (MEAL[id] === undefined || !!cover(s)[MEAL[id]]); }
  function strip(s) { var p = s.pass, on = p === 'p4' ? [s.wed, 1, 1, 1, 1] : p === 'p3' ? [0, 0, 1, 1, 1] : p === 'd2' ? [0, 0, 0, 1, 1] : p === 'd1' ? DAYS.map(function (d) { return d[0] === s.day; }) : p === 'pat' ? [1, 1, 1, 1, 1] : [0, 0, 0, 0, 0]; return on.map(function (x) { return !!x; }); }
  /* parking says what it covers: Weekend Parking (in and out all weekend) with a weekend pass, Patron or Sat + Sun; a one-day ticket gets that named day's parking */
  function parkId(s) { if (s.pass === 'none') return s.pday ? PARK[s.pday] : s.big ? 'opark' : 'wpark'; var b = pbase(s); if (!b) return ''; if (b.pass === 'd1') return b.day ? PARK[b.day] : ''; return s.big ? 'opark' : 'wpark'; }
  /* every parking pass the order needs. Nov 15: an order of day tickets on different days parks on each of those days (it used to price the first day only). */
  function parkIds(s) {
    var none = s.pass === 'none', G = groups(s), b = pbase(s);
    if (!none && G.length > 1 && G.every(function (g) { return g.pass === 'd1' && g.day; })) { var seen = {}, out = []; OK.day.forEach(function (d) { if (!seen[d] && G.some(function (g) { return g.day === d; })) { seen[d] = 1; out.push(PARK[d]); } }); return out; }
    return !none && b && b.pass === 'd2' && s.dp ? ['psat', 'psun'] : [parkId(s)];
  }
  function parkName(id) { if (id === 'wpark') return 'Weekend parking, in and out all weekend'; if (id === 'opark') return 'Oversized weekend parking, 16′ to 24′'; var d = DAYS.filter(function (x) { return PARK[x[0]] === id; })[0]; return d ? d[3] + ' parking, ' + d[2] + ' ' + d[4] + ' only' : ''; }
  function parkShort(id) { if (id === 'wpark' || id === 'opark') return 'Weekend parking'; var d = DAYS.filter(function (x) { return PARK[x[0]] === id; })[0]; return d ? d[3] + ' parking' : 'Parking'; }
  function dates(s) { var on = cover(s).map(function (x) { return !!x; }), a = on.indexOf(true), b = on.lastIndexOf(true); if (a < 0) return ''; var m = DAYS[a][4].split(' '); return a === b ? DAYS[a][2] + ', ' + DAYS[a][4] + ', ' + YEAR : m[0] + ' ' + m[1] + '–' + DAYS[b][4].split(' ')[1] + ', ' + YEAR; }
  function lines(s) {
    var L = [];
    function add(id, q, n, amt) { for (var i = 0; i < L.length; i++) if (L[i].id === id && L[i].n === n) { L[i].q += q; L[i].amt += amt; return; } L.push({ id: id, q: q, n: n, amt: amt }); }
    var G = groups(s);
    G.forEach(function (g) {
      var k = gkey(g), kd = kind(g.pass), nA = g.adult;
      if (kd === 'pat') add('patron', nA, 'Patron Pass, any age, Wed to Sun', nA * P('patron'));
      else add(k, nA, kd === 'day' ? N[k] + ', 13 and up' : N[k] + ', adult', nA * P(k));
      if (kd === 'wk' && g.teen) add('teen', g.teen, 'Teen 4-Day, half price', g.teen * P('teen'));   // Zale, Nov 12: the teen ticket is half the 4-Day (T4D), Thu–Sun on any weekend order; Wednesday is an add-on
      if (kd !== 'pat' && g.kid) add('child', g.kid, 'Kid, 12 and under, free', 0);
      if (g.pass === 'p4' && g.wed && nA + g.teen > 0) add('early', nA + g.teen, 'Wednesday early arrival, Aug 4', (nA + g.teen) * P('early'));
    });
    var none = s.pass === 'none', some = G.length > 0 || none, cam = none || G.some(function (g) { return kind(g.pass) === 'wk' || g.pass === 'pat'; }), veh = cam && VEH.test(s.sleep);   // camping lines only with a finished weekend or Patron pass (or Add-ons only)
    if (some && cam) {
      if (s.sleep === 'tent' && G.length) add('tent', 0, 'Tent in the woods', 0);
      else if (veh) { add(s.sleep, s.sites, SLEEPN[s.sleep] + ' site', s.sites * P(s.sleep)); if (s.pwr && PWR[s.sleep]) add(PWR[s.sleep], s.sites, 'Power at your Willow ' + (s.sleep === 'wvan' ? 'van' : 'RV') + ' site', s.sites * P(PWR[s.sleep])); }
    }
    if (some && s.go === 'drive' && !veh) parkIds(s).forEach(function (pk) { if (pk) add(pk, s.car, parkName(pk), s.car * P(pk)); });
    var riders = none ? s.adult : G.reduce(function (a, g) { return a + g.adult + g.teen; }, 0);
    if (some && s.go === 'shuttle' && !veh && riders > 0) add('shuttle', riders, 'Shuttle Pass', riders * P('shuttle'));
    if (G.length && s.go === 'bike' && !veh) add('bike', 0, 'Bike parking', 0);
    XID.forEach(function (id) { var q = (s.x || {})[id] || 0; if (q && xok(id, s)) add(id, q, XN[id], q * P(id)); });
    return L;
  }
  function totals(s) {
    /* A12: the total is the shown (fee-in) unit prices x quantity, so it always equals what the pass cards said; the fee line is the difference */
    var L = lines(s), sub = L.reduce(function (a, b) { return a + b.amt; }, 0), total = Math.round(L.reduce(function (a, b) { var u = b.q ? b.amt / b.q : b.amt; return a + (b.q || 1) * WF(u); }, 0) * 100) / 100, fee = Math.round((total - sub) * 100) / 100;
    var cur = !!s.pass && s.pass !== 'none', curOk = !cur || gok(s), G = groups(s);   // a pass being built must be finished (a day picked, someone on it) before checkout
    var ready = L.length > 0 && curOk && (G.length > 0 || (s.pass === 'none' && L.some(function (l) { return l.amt > 0; })));
    return { lines: L, sub: sub, fee: fee, total: total, ready: ready, unadded: s.go === 'later' && !vehicle(s) && G.length > 0 };
  }
  function gshort(g) { var k = gkey(g), wk = kind(g.pass) === 'wk', n = g.adult + (wk ? 0 : g.teen);   /* Gate 1 fix 13 (Q7): teens are their own pass, 'Teen 4-Day' */
    return [n ? n + ' × ' + NS[k] : '', wk && g.teen ? g.teen + ' × Teen 4-Day' : ''].filter(Boolean).join(', ') + (g.kid ? ' + ' + plural(g.kid, 'kid') : '') + (g.pass === 'p4' && g.wed ? ', Wed arrival' : ''); }
  function short(s) {
    var a = groups(s).map(gshort); if (s.pass === 'none') a.push('Add-ons'); if (!a.length) return '';
    if (camping(s)) { var c = { tent: s.pass === 'none' ? '' : 'tent', wcar: 'car camping', scar: 'car camping', wvan: 'camper van', svan: 'camper van', wrv: 'RV', srv: 'RV', none: 'no camping' }[s.sleep]; if (c) a.push((vehicle(s) && s.sites > 1 ? s.sites + ' × ' : '') + c); }
    if (!vehicle(s)) { var b = pbase(s); if (s.go === 'drive') a.push((s.pass !== 'none' && b && b.pass === 'd2' && s.dp ? 'Sat + Sun parking' : parkShort(parkId(s))) + ' × ' + s.car); if (s.go === 'shuttle') a.push('shuttle'); if (s.go === 'bike') a.push('bike'); }
    var m = 0, x = 0; XID.forEach(function (id) { var q = (s.x || {})[id] || 0; if (!q || !xok(id, s)) return; if (MEAL[id] !== undefined) m += q; else x += q; });
    if (m) a.push(plural(m, 'meal seat')); if (x) a.push(plural(x, 'extra'));
    return a.join(', ');
  }
  function lineLabel(l) { return (l.q ? l.q + ' × ' : '') + esc(l.n); }
  function olines(t) {
    /* team call (Nov 12): each line at its fee-included amount, the same unit price the cards show, x quantity; the lines add up to the total */
    return t.lines.map(function (l) { var u = l.q ? l.amt / l.q : l.amt; return '<li><span>' + lineLabel(l) + '</span><span class="tk-num">' + money(Math.round((l.q || 1) * WF(u) * 100) / 100) + '</span></li>'; }).join('') +
      (t.unadded ? '<li class="fee"><span>Parking or shuttle: not added</span><span></span></li>' : '') +
      giftsOk(S).map(function (g, i) { return '<li class="tk-gl"><span>' + giftLabel(g) + '</span><button type="button" class="tk-tlink" data-act="gift-edit" data-i="' + i + '">Edit</button></li>'; }).join('') +
      '<li class="fee tk-feeq"><span>Prices include the ' + (FEE * 100) + '% fee.</span><span></span></li>';
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
    var f = $('[data-focus]', scrim) || $('.tk-sheet-top h2[tabindex]', scrim) || $('button,a,input', scrim);   /* Gate 1 loop 2 F: open on the heading, not the close button */ if (f) { try { f.focus(); } catch (e) {} }
    return scrim;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && scrim && !scrim.__modal) { e.stopPropagation(); closeSheet(); } }, true);
  /* Gate 1 (user panel P3): "See the camps" opens the four camps right here, in a sheet, so the order and the page stay put
     (it used to leave for the Places map on Stages, with no way back). Each camp: its photo, what it is, and which choice below books it. */
  function camps() {
    var d = site().data, H = (d && d.hoods) || {}, L = [['lushcamp', 'Tent in the woods · included'], ['wildcamp', 'Tent in the woods · included'], ['southcamp', 'Car camping site · South Camp'], ['willowcamp', 'Car camping or RV site · Willow Camp']];
    var rows = L.filter(function (x) { return H[x[0]]; }).map(function (x) { var o = H[x[0]], im = o.hi || o.i;
      return '<li class="tk-camp">' + (im ? '<img src="' + esc(im) + '" alt="' + esc(o.n) + ' at Pickathon" loading="lazy">' : '') + '<div><b>' + esc(o.n) + '</b><span class="tk-camp-t">' + esc(o.t || '') + '</span><p>' + esc(o.hook || '') + '</p><span class="tk-camp-b">' + esc(x[1]) + '</span></div></li>'; }).join('');
    sheet(sheetTop('The camps') + '<p class="tk-camps-l">Every weekend pass includes a tent spot in Lush or Wild Camp. Car camping and RV sites are extra.</p><ul class="tk-camps">' + rows + '</ul><button type="button" class="tk-camps-x" data-close>Back to my order</button>', 'The camps');
  }
  function sheetTop(t) { return '<div class="tk-sheet-top"><h2 class="tk-d tk-d-card" tabindex="-1">' + esc(t) + '</h2><button type="button" class="tk-sheet-x" data-close aria-label="Close">' + ic('x') + '</button></div>'; }

  /* Zale, Nov 13: no bat before the 2027 logo drop (Jan 13). Tickets uses whatever the site header shows (it records its pick in pk.bat),
     else the date rule, so the two never disagree. */
  function logo() {
    var b = null; try { b = window.sessionStorage.getItem('pk.bat'); } catch (e) {}
    if (b === null) { var s = site(), d = s.today || new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10); b = (s.season || 'off') !== 'off' || d >= '2027-01-13' ? '1' : ''; }
    return b ? '<img src="logo27-bat.png" alt="Pickathon 2027" width="700" height="260">' : '<img class="tk-logo-gold" src="logo27-gold.png" alt="Pickathon 2027" width="600" height="314">';
  }
  window.pkTkLogo = logo;
  /* ---------- the page ---------- */
  var root = null, lastKey = '';
  function headline() {
    var w = when(), r = T.show;
    if (w === 'sale') return esc(r.name) + ' prices<span class="tk-runout">Tickets are running out</span>';   // Zale, Nov 12: the pressure line in every sale round   // Zale, Nov 11 23:30: no end date and no price-rise claim (the round's endS is '' while announceEnd is false)
    if (w === 'pre') return 'Open ' + esc(r.isToday ? 'today' : r.dayS) + (r.time ? ' · ' + esc(pacific(r.time)) : '');
    return 'Not on sale right now';
  }
  function fineLine() {
    return '<b>All sales final.</b> Send a pass to a friend any time from My Pickathon. ' + (T.show.plans ? 'Orders over ' + money(T.planMin) + ' can be paid monthly. ' : '') + 'Every price includes the ' + (FEE * 100) + '% fee.';
  }
  function passCard(v, title, sub, on, price, extra) {
    return '<label class="tk-pass tk-paper tk-pass-' + v + '"><input type="radio" name="tk-pass" value="' + v + '" class="tk-vh"><span class="tk-days" aria-hidden="true"' + (extra && extra.stripId ? ' id="' + extra.stripId + '"' : '') + '>' +
      DAYS.map(function (d, i) { return '<i class="' + (i ? '' : 'w ') + (on[i] ? 'on' : '') + '"' + (i ? ' data-d="' + d[0] + '"' : ' id="tk-w-' + v + '"') + '>' + d[1] + '</i>'; }).join('') + '</span>' +
      '<span class="tk-pass-t"><b>' + title + '</b><span' + (extra && extra.subId ? ' id="' + extra.subId + '"' : '') + '>' + sub + '</span></span><span class="tk-pass-p">' + price + '</span>' + (extra && extra.note ? '<span class="tk-pass-n">' + extra.note + '</span>' : '') + '</label>';
  }
  /* a group heading over the ticket cards: each claim sits only over the tickets it is true for */
  function group(c, title, sub) { return '<p class="tk-gl tk-gl-' + c + '"><b>' + title + '</b><span>' + sub + '</span></p>'; }
  function span(a, b) { return '<span class="tk-nw">' + DAY[a][2] + '–' + DAY[b][2] + '</span> · <span class="tk-nw">' + DAY[a][4] + '–' + DAY[b][4].split(' ')[1] + '</span>'; }   /* Gate 1 (panel P4): a date range never breaks before its last digit */   // 'Thu–Sun · Aug 5–8'
  function stepper(k, label, sub, one) {
    var row = k === 'car' || k === 'sites' || k.indexOf('x-') === 0;
    return '<div class="tk-step' + (row ? ' tk-step-row' : '') + '" data-k="' + k + '"' + (k === 'car' ? ' id="tk-carstep" hidden' : k === 'sites' ? ' id="tk-sitestep" hidden' : '') + '><p id="tk-l-' + k + '"><b id="tk-ln-' + k + '">' + label + '</b>' + (sub !== null ? '<span id="tk-ls-' + k + '">' + sub + '</span>' : '') + '</p>' + (k !== 'car' && k !== 'sites' ? '<span class="tk-step-pr tk-num" id="tk-lp-' + k + '"></span>' : '') + '<div><button type="button" data-step="-1" aria-label="One fewer ' + one + '">' + ic('minus', 'tk-ic-sm') + '</button><output aria-labelledby="tk-ln-' + k + '">0</output><button type="button" data-step="1" aria-label="One more ' + one + '">' + ic('plus', 'tk-ic-sm') + '</button></div></div>';
  }
  function opt(name, v, media, title, why, price) { return '<label class="tk-opt"><input type="radio" name="' + name + '" value="' + v + '" class="tk-vh">' + media + '<span class="tk-opt-t"><b data-t="' + v + '">' + title + '</b><span data-w="' + v + '">' + why + '</span></span><span class="tk-opt-p tk-num" data-p="' + v + '">' + price + '</span></label>'; }
  function hoodImg(h, slot) { var d = site().data, H = d && d.hoods && d.hoods[h]; return H && H.i ? '<img class="tk-opt-m" data-slot="' + slot + '" src="' + esc(H.i) + '" alt="" loading="lazy" width="84" height="56">' : '<span class="tk-opt-e"></span>'; }
  function emblem(h) { return '<span class="tk-opt-e"><img src="ic2/' + h + '.png" alt="" width="40" height="40" loading="lazy"></span>'; }
  function pprice(id) { return sold(id) ? '<b class="tk-sold">Sold out</b>' : '<b class="tk-num">' + money(PS(id)) + '</b>'; }
  function per(id, unit) { return off(id) ? 'Sold out' : money(PS(id)) + '<small>' + unit + '</small>'; }
  function xrow(id, label, sub) { return stepper('x-' + id, label, sub, label.toLowerCase()).replace('<span id="tk-ls-x-' + id + '">', '<span id="tk-ls-x-' + id + '" data-s="' + esc(sub) + '">'); }
  function chip(name, v, label) { return '<label class="tk-chip"><input type="radio" name="' + name + '" value="' + v + '" class="tk-vh"><span>' + label + '</span></label>'; }
  /* Round 6 (Zale, Nov 15): Tickets is where many people land from a search. With an empty order and no deep link, the page opens on
     what this is (one photo, one button), then who played here first (photos only, the same ranked list as Home), then the day picker.
     Anyone with an order or a deep link gets the page as before. */
  var EN = { on: {}, pat: false };
  function entryOn() { return when() !== 'closed'; }   /* Zale, Nov 15 evening: always open on the entry page, even with a saved order (it stays in the bottom bar) */
  /* Tickets reel: two-line story lines (about 55 characters) for the photo cards. Each is a CUT of Artist Classification's line for that act, with no
     new fact added; the full lines are untouched everywhere else. Sent to Artist Classification to check (outbox, Nov 15). An act with no line here
     falls back to the first sentence of its full line. This table should move into the master data once the wording is approved. */
  var REEL = {
    'Sturgill Simpson|2013': 'Small clubs then. Best Country Album Grammy, 2017.',
    'The Avett Brothers|2006': 'No major label then. Now three nights at Red Rocks.',
    'Tyler Childers|2019': 'Mid-size rooms then. Arenas and Bridgestone runs since.',
    'Billy Strings|2015': 'Half of a duo, no label. Now three nights in an arena.',
    'Caamp|2019': 'A club trio then. Red Rocks and a hometown arena since.',
    'Leon Bridges|2015': 'Booked before his debut. A Grammy came in 2019.',
    'The Marías|2019': 'Two EPs, no label. Now Coachella and arena headlines.',
    'Gregory Alan Isakov|2014': 'On his own small label. Now Red Rocks headlines.',
    'Kamasi Washington|2015': 'Small jazz rooms, then Coachella and Glastonbury.',
    'Thee Sacred Souls|2022': 'Small clubs before their debut. Then Berkeley’s Greek.',
    'Khruangbin|2019': 'Word of mouth then. Two nights at Red Rocks since.',
    'Big Thief|2017': 'One album, small clubs. The Greek by 2022.',
    'Black Pumas|2018': 'A new duo with no record. Red Rocks by 2021.',
    'Trampled by Turtles|2007': 'Duluth bars then. First Avenue and Red Rocks since.',
    'Lake Street Dive|2012': 'A Boston bar band then. A Red Rocks headline by 2019.',
    'Thundercat|2015': 'Small clubs as a bassist. Then a 2016 Grammy.',
    'Colter Wall|2018': 'Twenty-three, one album. Red Rocks headline by 2022.',
    'Charley Crockett|2018': 'Bar shows then. The Ryman and Red Rocks since.',
    'Patrick Watson|2016': 'A Polaris Prize winner and Montreal headliner.',
    'Alvvays|2016': 'Small clubs then. A Juno and a Grammy nomination since.',
    'Jalen Ngonda|2017': 'No label, small UK rooms. Then Daptone and Glastonbury.',
    'Lucy Dacus|2017': 'One album, small clubs. Three Grammys with boygenius.',
    'Viagra Boys|2019': 'One album, small clubs. Stockholm’s arena by 2025.',
    'Mac DeMarco|2014': 'Salad Days was new. The Hollywood Bowl followed.',
    'Goth Babe|2022': 'EPs from a van then. The Hollywood Bowl in 2025.',
    'Unknown Mortal Orchestra|2014': 'Small clubs, then Coachella and Webster Hall.',
    'Future Islands|2011': 'DIY rooms then. Letterman and big halls from 2014.',
    'Wet Leg|2022': 'Small clubs, no album yet. Two Grammys by 2023.',
    'Lonnie Holley|2014': 'An Alabama sculptor who began recording in his sixties.',
    'Punch Brothers|2010': 'Two albums in then. A folk album Grammy in 2019.',
    'Shakey Graves|2013': 'A one-man band in small clubs. Red Rocks by 2018.',
    'Angel Olsen|2014': 'One small-label record then. Brooklyn Steel by 2017.',
    'Aldous Harding|2017': 'Designer won over nearly every critic in 2019.',
    'Lucius|2019': 'Sang with Roger Waters, then Joni Mitchell at Newport.',
    'Warpaint|2014': 'Their second album reached the UK top 20.',
    'Altın Gün|2019': 'Small US clubs then. A Grammy nomination for Gece.',
    'Alex Cameron|2017': 'Forced Witness drew strong reviews and never charted.',
    'Dr. Dog|2009': 'A small club act then. The Crystal Ballroom after 2010.',
    'Parquet Courts|2013': 'Brooklyn basements, then Webster Hall 22 months later.',
    'The Oh Hellos|2016': 'Texas siblings who have kept filling theaters since.',
    'Shovels & Rope|2012': 'Bars and small clubs then. The Ryman by 2015.',
    'Kelsey Waldon|2017': 'Bars then. John Prine signed her to Oh Boy.',
    'Marlon Williams|2017': 'Small clubs abroad, then Live at Auckland Town Hall.',
    'Brownout|2011': 'Austin clubs and SXSW, then Bonnaroo in 2012.',
    'Sierra Hull|2018': 'A mandolin prodigy. A No. 1 bluegrass album in 2020.',
    'The Beths|2019': 'Small clubs then. Brooklyn Steel four years later.',
    'Ocie Elliott|2023': 'Small rooms to Sydney’s City Recital Hall in a year.',
    'Kevin Morby|2015': 'Small clubs then. Town Hall and Brooklyn Steel since.',
    'Margo Price|2016': 'Pawned her ring to make the record. The Ryman by 2018.',
    'Overcoats|2018': 'NPR named YOUNG one of the best albums of 2017.',
    'Dan Mangan|2019': 'Polaris Prize shortlists in 2010 and 2023.',
    'Lido Pimienta|2019': 'Won the 2017 Polaris Music Prize for La Papessa.',
    'Madison Cunningham|2023': 'Booked weeks before her Best Folk Album Grammy.',
    'Nubya Garcia|2022': 'Source made the shortlist for Britain’s top album prize.',
    'Sudan Archives|2019': 'Two EPs, small rooms. Then a Webster Hall headline.',
    'Wednesday|2023': 'Small clubs then. Brooklyn Steel and theaters since.',
    'Frazey Ford|2010': 'Indian Ocean made the 2015 Polaris long list.',
    'Paul Cauthen|2018': 'Small rooms then. He later headlined the Ryman.',
    'Pinegrove|2017': 'A critics’ band in small clubs. Brooklyn Steel by 2019.',
    'Makaya McCraven|2019': 'Universal Beings topped jazz critics’ lists for 2018.',
    'Sampa The Great|2022': 'Small clubs here. Then the Sydney Opera House.',
    'Anaïs Mitchell|2010': 'Touring Hadestown in 2010. It won eight Tonys.',
    'Bombino|2012': 'A Tuareg guitar hero in small clubs. Then Bonnaroo.',
    'C.W. Stoneking|2009': 'A country-blues revivalist with two ARIA wins.',
    'Foxygen|2013': 'Top critics singled out their album that year.',
    'Joseph|2015': 'Living rooms then. An arena tour 15 months later.',
    'Tank and the Bangas|2017': 'New Orleans clubs, then a Best New Artist nomination.',
    'Julia Holter|2016': 'Uncut called her album the best of 2015.',
    'Julia Jacklin|2017': 'Crushing drew wide praise and six ARIA nominations.',
    'Andy Shauf|2017': 'Small clubs then. A Polaris shortlist for The Party.',
    'Fruit Bats|2010': 'Seven years on Sub Pop and a turn in The Shins.',
    'The Barr Brothers|2012': 'Montreal clubs, then headlining the Metropolis.',
    'Ty Segall|2013': 'Small clubs, then two nights at Webster Hall.',
    'Valerie June|2014': 'Clubs then. A 2022 Grammy nomination since.',
    'Vieux Farka Touré|2013': 'A Malian guitarist, twice a Songlines nominee.',
    'Chatham County Line|2007': 'A Raleigh four-piece with No. 1 bluegrass albums.',
    'Cory Henry|2016': 'Live at the Piano earned a 2024 Grammy nomination.',
    'MonoNeon|2023': 'The last bassist Prince hired before his death.',
    'Phosphorescent|2012': 'Tiny rooms then. “Song for Zula” took him to big ones.',
    'Shabazz Palaces|2013': 'Black Up was the rap record indie critics kept naming.',
    'The Lone Bellow|2013': 'Boston’s Paradise to the House of Blues in a year.',
    'Jamila Woods|2018': 'Critics singled out Legacy! Legacy! in 2019.',
    'Jessica Pratt|2013': 'Small rooms to theaters and churches in three albums.',
    'King Tuff|2013': 'One Sub Pop album, after years in Witch with J Mascis.',
    'Blitzen Trapper|2009': 'Self-released in Portland. Then Sub Pop and Coachella.',
    'Bonny Light Horseman|2019': 'Unannounced then. Two Grammy nominations in 2021.',
    'The War and Treaty|2018': 'Listening rooms then. Grammy nominations and the Opry.',
    'Hurray for the Riff Raff|2016': 'Three records running among critics’ best of the year.',
    'New Constellations|2024': 'Day jobs then. An album, a label and a tour since.',
    'Protomartyr|2016': 'A Detroit band almost every critic praised.',
    'Thao & The Get Down Stay Down|2009': 'On Kill Rock Stars then. The Fillmore since.',
    'Automatic|2022': 'An LA trio that opened for Bauhaus at the Greek.',
    'Kacy & Clayton|2016': 'A Polaris longlist and a Juno finalist.',
    'The Womack Sisters|2026': 'Sam Cooke’s granddaughters, signed to Daptone.',
    'Alela Diane|2007': 'Spin and NME praised her. Rough Trade came next.',
    'Emma Jean Thackray|2022': 'Yellow was Jazz FM’s Album of the Year in 2022.',
    'LA LOM|2024': 'A weekly bar residency, then a Verve deal.',
    'Low Cut Connie|2018': 'A Rolling Stone favorite on Obama’s playlist.',
    'Mike and the Moonpies|2019': 'Saving Country Music’s Album of the Year, 2019.',
    'Heartless Bastards|2010': 'Small clubs into halls. Arrow charted in 2012.',
    'Israel Nash|2015': 'Uncut, Mojo and Q praised Silver Season.',
    'Lost Bayou Ramblers|2009': 'A Cajun band that won a Grammy in 2018.',
    'Haley Heynderickx|2018': 'Her debut made Paste’s best-of-2018 list.',
    'Hayes Carll|2010': 'Americana Song of the Year, then a charting album.',
    'BRONCHO|2015': '“Class Historian” reached Reservation Dogs.',
    'Cass McCombs|2012': 'Spin ranked two of his albums in 2011’s fifty best.',
    'Charlie Parr|2011': 'Nine albums of Duluth country blues on tiny labels.',
    'Ibibio Sound Machine|2019': 'A London afro-funk band fronted by Eno Williams.',
    'La Luz|2016': 'Shana Cleveland’s surf-noir quartet on Hardly Art.',
    'Mereba|2019': 'Small rooms then. Headline dates at The Showbox since.',
    'Bella White|2022': 'Her song “Burn Me Once” made a Hunger Games soundtrack.',
    'Steve Gunn|2014': 'A guitarist’s guitarist. Matador signed him next.',
    'Mountain Grass Unit|2023': 'Barely touring then. Now headlining the 9:30 Club.',
    'Yasmin Williams|2022': 'Urban Driftwood made NPR’s 50 Best Albums of 2021.',
    'Brent Cobb|2017': 'A Grammy nomination, then arenas with Chris Stapleton.',
    'Cedric Watson & Bijou Creole|2013': 'A Creole fiddler with three straight Grammy nominations.',
    'Ezra Furman|2016': 'Small rooms to Shepherd’s Bush Empire in Britain.',
    'Hiss Golden Messenger|2014': 'The year he signed to Merge. A Grammy nomination since.',
    'I Draw Slow|2013': 'A Dublin string band with a Nashville label deal.',
    'Nikki Nair|2023': 'Crack named him an artist who defined 2023.',
    'Dale Watson|2007': 'Honky-tonk holdout. Founded the Ameripolitan Awards.',
    'Bedouine|2018': 'Her debut drew raves from NPR and the Guardian.',
    'Circuit des Yeux|2018': 'One of Time Out’s two best Chicago albums of 2017.',
    'Joshua Hedley|2018': 'Robert’s Western World’s house fiddler, on Third Man.',
    'Megafaun|2010': 'Three of DeYarmond Edison. The fourth made Bon Iver.',
    'SML|2025': 'Five LA improvisers with two acclaimed albums.',
    'Woods|2014': 'Jeremy Earl’s Brooklyn band, eight albums in by 2014.',
    'Yot Club|2023': 'A bedroom project then. Chicago’s Thalia Hall since.',
    'A Giant Dog|2015': 'Eight years of club work, then a Merge deal.',
    'Malcolm Holcombe|2013': 'Steve Earle called him the best songwriter he threw out.',
    'Son Little|2014': 'One EP, then a Grammy for work with Mavis Staples.',
    'Sweet Spirit|2017': 'St. Mojo made three Austin Chronicle critics’ lists.',
    'Tennyson|2016': 'A teenage brother-and-sister act out of Edmonton.',
    'Vetiver|2009': 'A folk band with a new Sub Pop album, Tight Knit.',
    'Anna Tivel|2024': 'Outsiders was NPR’s Best Roots Music of 2022.',
    'Irreversible Entanglements|2024': 'Free jazz and poetry that topped a 2020 jazz list.',
    'Jupiter & Okwess|2019': 'A Kinshasa band with Damon Albarn on their album.',
    'This Is Lorelei|2024': 'Double Double Whammy then. Matador signed him next.',
    'Willie Watson|2014': 'Old Crow Medicine Show’s founding member, gone solo.',
    'David Nance|2022': 'An Omaha lo-fi lifer championed by Pitchfork.',
    'Moon Duo|2016': 'NPR called it “the best Moon Duo record to date.”',
    'Rich Ruth|2023': 'A Nashville experimentalist on Third Man Records.',
    'Town Mountain|2009': 'Won the 2013 IBMA Momentum Award for Band of the Year.',
    'Billy Woods|2022': 'Bars and back rooms then. Three continents since.',
    'Courtney Marie Andrews|2017': 'Old Flowers earned a 2021 Grammy nomination.',
    'Bodega|2019': 'Rough Trade named Endless Scroll a best album of 2018.',
    'Ex Hex|2015': 'Rips landed in critics’ year-end top thirty in 2014.',
    'Jay Som|2017': 'Paste named Everybody Works its album of the year.',
    'Young Jesus|2019': 'An indie rock band with two albums on Saddle Creek.',
    'Liz Vice|2015': 'There’s a Light reached No. 6 on the Gospel chart.',
    'Y La Bamba|2012': 'Ojos del Sol made NPR’s 50 best albums of 2016.'
  };
  function reelHTML() {
    var L = discoveries(); if (!L.length) return '';
    return L.map(function (a) { return '<li class="tk-e-c"><span class="tk-e-ph"><img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async"><span class="tk-e-cap"><span class="tk-e-nm"><b>' + esc(a.n) + '</b><i class="tk-d">' + esc(a.y) + '</i></span><span class="tk-e-bl">' + esc(REEL[a.n + '|' + a.y] || a.line) + '</span></span></span></li>'; }).join('') +
      '<li class="tk-e-c tk-e-all"><button type="button" data-act="e-all"><b class="tk-d">See them all</b><span>Every act that played here first →</span></button></li>';
  }
  /* ---------- Intro, days first (Zale, Nov 23; drafts tickets_intro_days_first 1-6). The page opens on "When are you coming?". People who
     have not seen Home (no Home visit on this device, no saved years, not signed in, no saved order) first get Home's own question,
     "What do you want to experience?": the same chips and words as Home and Places. Music swipes through the bands we caught early (the
     archive's ranked Discoveries; a tap plays that summer's song in the site's video pop-over); every other pick swipes through the places
     it happens. Nothing moves on its own. A pick is remembered for this visit and lights the matching row in the steps (Family: kids). ---------- */
  var XPO = ['Music', 'Architecture', 'Family', 'Wellness', 'Food', 'Drinks', 'Camping', 'DJs', 'Art', 'Comedy', 'Literary', 'Craft'];
  var XPI = { Architecture: '<path d="M4 20 12 4l8 16"/><path d="M7.5 13h9M6 17h12M3 20h18"/>', Music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>', DJs: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 12h.01"/>', Family: '<path d="M12 3l6 7-6 8-6-8z"/><path d="M6 10h12M12 3v15"/><path d="M12 18c0 1.5 1.5 1.5 1.5 3"/>', Comedy: '<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>', Literary: '<path d="M3 5.5c3-1.2 6-1 9 1v13c-3-2-6-2.2-9-1zM21 5.5c-3-1.2-6-1-9 1v13c3-2 6-2.2 9-1z"/>', Wellness: '<path d="M12 21v-8"/><path d="M12 13c0-4.5 3-7 8-7 0 5-3 7-8 7zM12 15.5c0-3-2-5-6-5 0 3.8 2 5 6 5z"/>', Food: '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 11v10"/><path d="M17 3c-2.5 2.5-2.5 6.5 0 8v10"/>', Craft: '<circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8 16 18 4M16 16 6 4"/>', Drinks: '<path d="M7.5 3h9l-1 7a3.5 3.5 0 0 1-7 0z"/><path d="M12 13.5V21M8.5 21h7"/>', Art: '<path d="M10.5 13.5 19 5l1 1-8.5 8.5"/><path d="M4 20c.4-3 2-4.5 4-4.5a2.5 2.5 0 0 1 0 5c-1.5 0-3-.2-4-.5z"/>', Camping: '<path d="M3 20 12 4l9 16zM9 20l3-6 3 6"/>' };   /* Home's one-color experience icons (index.html, Home block). Copy kept in step by hand until Home exposes one list (design_my_pickathon-8). */
  var XCUR = 'Music', XSS = 'pk27xp', HSEEN = 'pk-seen-home', XCAMP = { wildcamp: 1, lushcamp: 1, willowcamp: 1, southcamp: 1 };
  function seenHome() { try { return !!window.localStorage.getItem(HSEEN); } catch (e) { return false; } }
  function markHome() { var a = app(), st = a && a.state, top = st && st.stack && st.stack[st.stack.length - 1]; if (top && top.r === 'home') { try { window.localStorage.setItem(HSEEN, '1'); } catch (e) {} } }
  function isCold() {
    var q = qp('tkcold'); if (q === '1') return true; if (q === '0') return false;   // for checks and screenshots
    var s = site(); if (s.user || (s.myYears || []).length || seenHome()) return false;
    try { if (window.localStorage.getItem(LS)) return false; } catch (e) {}
    return true;
  }
  function xpPick(v) { try { if (v === undefined) return window.sessionStorage.getItem(XSS) || ''; window.sessionStorage.setItem(XSS, v); } catch (e) {} return v || ''; }
  function xIc(t) { return XPI[t] ? '<svg class="tk-x-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + XPI[t] + '</svg>' : ''; }
  function xOf(k, H) {   /* the experiences a place offers: the latest lineup's programming plus amenities, the same reading as Home */
    var o = {}, am = H.amk || [], pg = ''; try { pg = window.__pkNbpg ? window.__pkNbpg(k) : ''; } catch (e) {}
    (pg ? pg.split(' · ') : []).forEach(function (t) { o[t] = 1; });
    if (am.indexOf('bar') >= 0) o.Drinks = 1; if (am.indexOf('food') >= 0) o.Food = 1; if (am.indexOf('yoga') >= 0 || am.indexOf('massage') >= 0) o.Wellness = 1;
    if (am.indexOf('kids') >= 0) o.Family = 1; if (am.indexOf('craft') >= 0) o.Craft = 1; if (am.indexOf('art') >= 0) o.Art = 1; if (am.indexOf('stage') >= 0 && !pg) o.Music = 1;
    if (XCAMP[k]) o.Camping = 1; else if (H.k === 'stage' || H.k === 'around') o.Architecture = 1;
    return o;
  }
  /* Home's live per-experience place lines (XPB), place lists (XPL) and experience photos (XPH), copied from Home's block on Nov 23 so every
     card speaks to the experience picked (Drinks shows the bar, not the stage). Drop these copies once Home exposes one list (design_my_pickathon-8). */
  var XPATH = { orchard: 1, quailtrail: 1, trails: 1 };   /* paths, not neighborhoods: no tag */
  var XPBH = {"Architecture": {"woods": "Woven from the forest itself and rebuilt every year with the trees: fir branches, maple posts, vine-maple curves.", "paddock": "The grand arena, redesigned every year to fit the slope and the light of the meadow.", "cherryhill": "Student-built by Portland State architecture, from borrowed pallets and cable reels, then returned to use.", "grove": "Wrapped in Douglas firs, designed by WORKS Architecture around objects someone found in the woods.", "windmill": "A hillside lounge under towering firs, around the farm\u2019s own windmill and a big A-frame bar.", "galaxy": "A century-old barn, with a new stage backdrop designed every year.", "lucky": "Kaleidoscope City: shade modules by Holst Architecture that move to a children\u2019s nonprofit after the festival.", "farmhouse": "The front door to the farm: a stage, and the timber shelter where shuttles, bikes and rideshares arrive.", "curation": "No lumber to pass on. The room itself is designed and built fresh every year.", "refuge": "Hand-built cedar showers and a sanctuary in the trees; the reclaimed lumber goes to a school\u2019s wood shop.", "coyote": "A bog that comes to life, a play world built for kids above Cherry Hill.", "courtyard": "Giant water lilies built petal by petal from layered lumber, then reborn as public art.", "market": "A town square around a communal seating shed, with art that comes alive at night.", "orchard": "A natural hallway of old apple trees that slows you down on the way in.", "quailtrail": "Art lines a wooded path between the Woods and the main grounds."}, "Music": {"woods": "Twelve straight hours of music in a big-leaf maple cathedral the forest grew around.", "paddock": "The biggest open-air moments of the weekend, in a meadow bowl as the sun goes down.", "cherryhill": "The Woods\u2019 dark, mysterious sister: student-built stages that come alive late at night.", "grove": "Sets in the shade of a Douglas fir grove, on a stage that is part sculpture.", "windmill": "Up on the hillside under towering firs and the farm\u2019s old windmill, with Mount Hood in view.", "galaxy": "Cool daytime sets and late-night ragers in one of the few air-conditioned rooms on the farm.", "lucky": "The most intimate room on the farm, with shaded seats outside while you wait.", "farmhouse": "A busking stage at the front door of the farm, where the weekend begins.", "curation": "One chef, one band and a hundred seats: a set played between courses at a long table by the creek."}, "DJs": {"woods": "The forest floor turns into a dance floor", "cherryhill": "Dance beneath the student-built towers as the night gets deep.", "windmill": "Afternoon sets on the hillside, under the firs.", "galaxy": "Late-night ragers inside the barn.", "courtyard": "The open-air dance floor outside the barn, around two giant wooden water lilies.", "market": "Records spinning at the crossroads of the festival, where friends find each other."}, "Family": {"coyote": "Captain Coyote\u2019s world in the woods above Cherry Hill: music, art and nature all day."}, "Comedy": {"lucky": "Laughs in the Lucky Barn: touring comics, two nights, ninety packed minutes."}, "Literary": {"woods": "Sunday morning storytelling and spoken word on the Woods Stage.", "windmill": "Authors read from their work on the hillside, Sunday morning."}, "Wellness": {"lucky": "Slow movement in the barn before the music starts.", "courtyard": "Rise-and-shine yoga on the open-air plaza.", "refuge": "Our wellness home in the forest: massage under the trees, plant meditation and a sober-friendly place to rest.", "coyote": "Movement and play for the whole family in the woods above Cherry Hill.", "windmill": "Morning runs and forest hikes start at the Windmill Stage.", "trails": "Almost four miles of forest trails to wander, from the creek up toward Scouters Mountain."}, "Food": {"curation": "A hundred seats at a hidden table by the creek, the meal made by a chef and an artist together.", "market": "Northwest kitchens, food trucks and a farmers market of fresh fruit.", "windmill": "Food vendors under the firs on the hillside.", "lucky": "A bite between shows on the main path through the farm."}, "Craft": {"market": "Craft Row and the Craft Tent: makers, artists and handmade goods.", "paddock": "Secondhand treasures and repurposed finds at the Merry Pop In Shop."}, "Drinks": {"woods": "The bar glowing in the trees after dark.", "windmill": "The Windmill Bar under the firs, and coffee from the Brew Crew to start the day.", "curation": "Curated pours for every Curation meal: wine, cider and cocktails picked to go with the chef's menu.", "grove": "A cold drink in the shade of the firs.", "courtyard": "The Galaxy Bar, steps from the dance floor.", "market": "The Market Bar at the heart of the festival."}, "Art": {"windmill": "Watch murals painted live, then pick up a brush in the workshop.", "quailtrail": "The Grotto Gallery, just up the trail from the Market."}, "Camping": {"wildcamp": "Big trees and a hillside of tents: camp deep in the forest, a short walk from the stages.", "lushcamp": "Giant ferns and leafy shade: wake up under a green canopy.", "willowcamp": "Car, van and RV camping: sleep in your rig and walk in to the music.", "southcamp": "Car, van and RV camping in the South Lot, with the shuttle and ticketing close by."}}, XPLH = {"Music":["woods","paddock","cherryhill","grove","windmill","galaxy","lucky","farmhouse","curation"],"Wellness":["lucky","courtyard","refuge","coyote","windmill","trails"],"Camping":["wildcamp","lushcamp","willowcamp","southcamp"],"Literary":["woods","windmill"],"DJs":["market","courtyard","windmill","woods"]}, XPHH = {"Music":{"curation":[{"i":"i/xph-music-curation-1.jpg","p":"50% 50%"},{"i":"i/xph-music-curation-2.jpg","p":"50% 50%"},{"i":"i/xph-music-curation-3.jpg","p":"50% 40%"},{"i":"i/xph-music-curation-4.jpg","p":"55% 40%"}],"woods":[{"i":"i/xp-music-woods-6.jpg","p":"48% 50%"},{"i":"i/xp-music-woods-2.jpg","p":"48% 50%"},{"i":"i/xp-music-woods-3.jpg","p":"50% 50%"},{"i":"i/xp-music-woods-4.jpg","p":"50% 82%"},{"i":"i/xp-music-woods-1.jpg","p":"42% 50%"},{"i":"i/xp-music-woods-5.jpg","p":"75% 50%"}],"paddock":[{"i":"i/xp-music-paddock-2.jpg","p":"50% 50%"},{"i":"i/xp-music-paddock-1.jpg","p":"50% 50%"},{"i":"i/xp-music-paddock-3.jpg","p":"62% 50%"},{"i":"i/xp-music-paddock-4.jpg","p":"50% 50%"},{"i":"i/xp-music-paddock-5.jpg","p":"50% 50%"}],"cherryhill":[{"i":"i/xp-music-cherryhill-1.jpg","p":"45% 50%"},{"i":"i/xp-music-cherryhill-2.jpg","p":"50% 50%"},{"i":"i/xp-music-cherryhill-3.jpg","p":"45% 50%"},{"i":"i/xp-music-cherryhill-4.jpg","p":"58% 50%"},{"i":"i/xp-music-cherryhill-5.jpg","p":"50% 50%"}],"grove":[{"i":"i/xp-music-grove-1.jpg","p":"35% 50%"},{"i":"i/xp-music-grove-2.jpg","p":"50% 50%"},{"i":"i/xp-music-grove-3.jpg","p":"55% 50%"},{"i":"i/xp-music-grove-4.jpg","p":"50% 50%"},{"i":"i/xp-music-grove-5.jpg","p":"40% 50%"}],"galaxy":[{"i":"i/xp-music-galaxy-1.jpg","p":"55% 50%"},{"i":"i/xp-music-galaxy-2.jpg","p":"38% 50%"},{"i":"i/xp-music-galaxy-3.jpg","p":"55% 50%"},{"i":"i/xp-music-galaxy-4.jpg","p":"50% 50%"},{"i":"i/xp-music-galaxy-5.jpg","p":"25% 50%"}],"lucky":[{"i":"i/xp-music-lucky-1.jpg","p":"65% 50%"},{"i":"i/xp-music-lucky-2.jpg","p":"50% 50%"},{"i":"i/xp-music-lucky-3.jpg","p":"45% 50%"},{"i":"i/xp-music-lucky-4.jpg","p":"62% 50%"},{"i":"i/xp-music-lucky-5.jpg","p":"72% 50%"}],"windmill":[{"i":"i/xp-music-windmill-1.jpg","p":"45% 50%"},{"i":"i/xp-music-windmill-2.jpg","p":"50% 50%"},{"i":"i/xp-music-windmill-3.jpg","p":"60% 50%"},{"i":"i/xp-music-windmill-4.jpg","p":"40% 50%"},{"i":"i/xp-music-windmill-5.jpg","p":"52% 50%"}]},"Literary":{"windmill":[{"i":"i/xp2-lit-windmill-1.jpg","p":"50% 50%"},{"i":"i/xp2-lit-windmill-2.jpg","p":"40% 50%"},{"i":"i/xp2-lit-windmill-3.jpg","p":"45% 50%"},{"i":"i/xp2-lit-windmill-4.jpg","p":"50% 50%"},{"i":"i/xp2-lit-windmill-5.jpg","p":"50% 50%"}],"woods":[{"i":"i/xp-lit-woods.jpg","p":"50% 50%"},{"i":"i/xp2-lit-woods-1.jpg","p":"60% 50%"},{"i":"i/xp2-lit-woods-2.jpg","p":"45% 50%"},{"i":"i/xp2-lit-woods-3.jpg","p":"55% 50%"},{"i":"i/xp2-lit-woods-4.jpg","p":"45% 50%"}]},"Food":{"curation":[{"i":"i/xp-food-curation.jpg","p":"50% 50%"},{"i":"i/xp2-food-curation-1.jpg","p":"50% 50%"},{"i":"i/xp2-food-curation-2.jpg","p":"55% 50%"},{"i":"i/xp2-food-curation-3.jpg","p":"45% 50%"},{"i":"i/xp2-food-curation-4.jpg","p":"50% 50%"}],"market":[{"i":"i/xp-food-market.jpg","p":"50% 50%"},{"i":"i/xp2-food-market-1.jpg","p":"50% 50%"},{"i":"i/xp2-food-market-2.jpg","p":"40% 50%"},{"i":"i/xp2-food-market-3.jpg","p":"50% 50%"},{"i":"i/xp2-food-market-4.jpg","p":"50% 50%"}]},"Drinks":{"grove":[{"i":"i/xph-drinks-grove-1.jpg","p":"50% 50%"},{"i":"i/xph-drinks-grove-2.jpg","p":"50% 50%"}],"windmill":[{"i":"i/xph-drinks-windmill-1.jpg","p":"50% 50%"},{"i":"i/xph-drinks-windmill-2.jpg","p":"50% 50%"},{"i":"i/xph-drinks-windmill-3.jpg","p":"50% 50%"},{"i":"i/xph-drinks-windmill-4.jpg","p":"50% 50%"},{"i":"i/xph-drinks-windmill-5.jpg","p":"50% 50%"}],"market":[{"i":"i/xph-drinks-market-1.jpg","p":"50% 50%"},{"i":"i/xph-drinks-market-2.jpg","p":"50% 50%"},{"i":"i/xph-drinks-market-3.jpg","p":"50% 50%"},{"i":"i/xp2-drinks-market-3.jpg","p":"50% 50%"},{"i":"i/xp2-drinks-market-4.jpg","p":"50% 50%"}],"courtyard":[{"i":"i/xph-drinks-courtyard-1.jpg","p":"52% 45%"},{"i":"i/xph-drinks-courtyard-2.jpg","p":"40% 60%"},{"i":"i/xph-drinks-courtyard-3.jpg","p":"45% 60%"}],"curation":[{"i":"i/xp2-drinks-curation-1.jpg","p":"50% 50%"},{"i":"i/xph-drinks-curation-1.jpg","p":"50% 50%"},{"i":"i/xp2-drinks-curation-2.jpg","p":"50% 50%"}],"woods":[{"i":"i/xp2-drinks-woods-1.jpg","p":"50% 50%"},{"i":"i/xph-drinks-woods-1.jpg","p":"50% 50%"}]},"Wellness":{"refuge":[{"i":"i/xp-well-refuge.jpg","p":"50% 50%"},{"i":"i/xp2-well-refuge-1.jpg","p":"50% 50%"},{"i":"i/xp2-well-refuge-2.jpg","p":"50% 50%"},{"i":"i/xp2-well-refuge-3.jpg","p":"45% 50%"},{"i":"i/xp2-well-refuge-4.jpg","p":"40% 50%"}],"lucky":[{"i":"i/xp-well-lucky.jpg","p":"50% 50%"},{"i":"i/xp2-well-lucky-1.jpg","p":"50% 50%"},{"i":"i/xp2-well-lucky-2.jpg","p":"55% 50%"}],"courtyard":[{"i":"i/xp-well-courtyard.jpg","p":"50% 50%"},{"i":"i/xp2-well-courtyard-1.jpg","p":"40% 50%"},{"i":"i/xp2-well-courtyard-2.jpg","p":"50% 50%"},{"i":"i/xp2-well-courtyard-3.jpg","p":"40% 50%"}],"coyote":"i/xp-well-coyote.jpg"},"Family":{"coyote":[{"i":"i/xp-family-coyote.jpg","p":"50% 50%"},{"i":"i/xp2-family-coyote-1.jpg","p":"30% 50%"},{"i":"i/xp2-family-coyote-2.jpg","p":"45% 50%"},{"i":"i/xp2-family-coyote-3.jpg","p":"55% 50%"},{"i":"i/xp2-family-coyote-4.jpg","p":"55% 50%"}]},"DJs":{"market":[{"i":"i/xph-dj-market-6.jpg","p":"50% 55%"},{"i":"i/xph-dj-market-1.jpg","p":"50% 50%"},{"i":"i/xph-dj-market-7.jpg","p":"50% 55%"},{"i":"i/xph-dj-market-4.jpg","p":"50% 50%"},{"i":"i/xph-dj-market-8.jpg","p":"50% 55%"},{"i":"i/xph-dj-market-2.jpg","p":"50% 50%"}],"windmill":[{"i":"i/xp-dj-windmill.jpg","p":"50% 50%"},{"i":"i/xp2-dj-windmill-1.jpg","p":"35% 50%"},{"i":"i/xp2-dj-windmill-2.jpg","p":"62% 50%"},{"i":"i/xp2-dj-windmill-3.jpg","p":"35% 50%"},{"i":"i/xp2-dj-windmill-4.jpg","p":"30% 50%"}],"woods":[{"i":"i/xp-dj-woods.jpg","p":"50% 50%"},{"i":"i/xp2-dj-woods-1.jpg","p":"40% 50%"},{"i":"i/xp2-dj-woods-2.jpg","p":"50% 50%"},{"i":"i/xp2-dj-woods-3.jpg","p":"50% 50%"},{"i":"i/xp2-dj-woods-4.jpg","p":"45% 50%"}],"courtyard":[{"i":"i/xp2-dj-galaxy-3.jpg","p":"50% 50%"},{"i":"i/xp2-dj-courtyard-1.jpg","p":"45% 50%"},{"i":"i/xp2-dj-galaxy-1.jpg","p":"50% 50%"},{"i":"i/xp2-dj-courtyard-2.jpg","p":"45% 50%"},{"i":"i/xp2-dj-galaxy-4.jpg","p":"45% 50%"}]},"Art":{"windmill":"i/xp-art-windmill.jpg","quailtrail":[{"i":"i/xp2-art-quailtrail-1.jpg","p":"50% 50%"},{"i":"i/xp2-art-quailtrail-2.jpg","p":"50% 50%"},{"i":"i/xp2-art-quailtrail-3.jpg","p":"50% 50%"},{"i":"i/xp2-art-quailtrail-4.jpg","p":"50% 50%"},{"i":"i/xp2-art-quailtrail-5.jpg","p":"50% 50%"}]},"Craft":{"market":[{"i":"i/xp2-craft-1.jpg","p":"50% 50%"},{"i":"i/xp2-craft-2.jpg","p":"50% 50%"},{"i":"i/xp2-craft-3.jpg","p":"50% 50%"},{"i":"i/xp2-craft-5.jpg","p":"50% 50%"},{"i":"i/xp2-craft-6.jpg","p":"50% 50%"}],"paddock":[{"i":"i/xp2-craft-4.jpg","p":"50% 50%"}]},"Comedy":{"lucky":[{"i":"i/xp-comedy-lucky.jpg","p":"50% 50%"},{"i":"i/xp2-comedy-lucky-1.jpg","p":"45% 50%"},{"i":"i/xp2-comedy-lucky-2.jpg","p":"55% 50%"},{"i":"i/xp2-comedy-lucky-3.jpg","p":"50% 50%"},{"i":"i/xp2-comedy-lucky-4.jpg","p":"35% 50%"}]},"Camping":{"lushcamp":"i/xp-camp-lush.jpg","wildcamp":"i/xp-camp-wild.jpg","willowcamp":"i/xp-camp-willow.jpg","southcamp":"i/xp-camp-south.jpg"}};
  function xPlaces(t) {
    var D = site().data || {}, H = D.hoods || {}, B = XPBH[t] || {}, PH = XPHH[t] || {};
    var keys = XPLH[t] || Object.keys(B);
    return keys.filter(function (k) { var h = H[k]; return h && (h.hi || h.i) && B[k]; })
      .map(function (k) { var h = H[k], ph = PH[k], z = Array.isArray(ph) ? ph[0] : ph, img = z ? (typeof z === 'string' ? z : z.i) : (h.hi || h.i), pos = z && z.p ? z.p : (h.p ? h.p[0] + '% ' + h.p[1] + '%' : '50% 40%');
        return { k: k, n: h.n || k, img: img, pos: pos, line: B[k] }; });
  }
  function xBands() { return discoveries().filter(function (a) { return a.vu; }).slice(0, 8); }
  function xTicket(t) {
    if (t === 'Family') return 'Kids 12 and under get in free.';
    if (t === 'Camping' && (!off('p4') || !off('p3'))) return 'Tent camping comes with 3- and 4-Day passes.';
    if (t === 'Food' && MEALS.some(function (id) { return !off(id); })) return 'Sit at a Curation table: add a seat in your order.';
    return '';
  }
  var XSET = {   /* one line per experience, the feeling first; details are one tap deeper (Zale, Nov 23). Copy Review owns them from here (design_my_pickathon-10). */
    Music: 'Most festivals book the names you already know. We book the ones you’re about to.',
    Architecture: 'Step into an architectural wonderland, built by hand into the forest. When it’s over, it all finds a new home.',
    Family: 'This isn’t a festival your kids put up with. They get a camp of their own in the woods.',
    Wellness: 'Four days of music, and you’ll go home rested. Morning yoga under the firs, trails and quiet corners.',
    Food: 'Skip the food-truck line. Sit down at a long table with a chef and a band.',
    Drinks: 'Local beer, a cocktail, a good coffee, and you never have to leave the music to get one.',
    Camping: 'No parking-lot campground. Your tent goes under giant firs, a short walk from the music.',
    DJs: 'The headliner ends. The woods don’t. Dance under the trees long after.',
    Art: 'After dark, the forest lights up with art you stumble onto around every bend.',
    Comedy: 'Touring comics in a barn small enough to heckle back.',
    Literary: 'Stories and poems read aloud under the trees. Bring nothing but time.',
    Craft: 'Take home something made by hand, by the person who made it.'
  };
  var XLAB = { Architecture: 'Wonders' };   /* chip and card label only; data keys stay Architecture (Zale, Nov 23, design_home-52) */
  function xL(t) { return XLAB[t] || t; }
  function xHTML() {
    var D = site().data || {}, XD = ((D.xpWords || {}).XPD) || {}, t = xpPick() || 'Music', L, cards = '';
    var list = XPO.filter(function (x) { return x === 'Music' ? xBands().length : xPlaces(x).length; });
    if (!list.length) return '';
    if (list.indexOf(t) < 0) t = list[0]; XCUR = t;
    var gN = function (g) { return String(g || '').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };
    var card = function (act, i, img, pos, kL, kR, yr, name, line, play, label, tag) {   /* the same card anatomy as Home's band cards: kicker and year on the photo, name and blurb low */
      return '<li class="tk-x-c"><button type="button" class="tk-x-ph" data-act="' + act + '" data-i="' + i + '" aria-label="' + esc(label) + '"><img src="' + esc(img) + '" alt="" loading="lazy" decoding="async"' + (pos ? ' style="object-position:' + esc(pos) + '"' : '') + '><span class="tk-x-sh"></span>' +
        (yr ? '<span class="tk-x-yr tk-d">' + esc(yr) + '</span>' : '') + (play ? RING : '') +
        '<span class="tk-x-low"><span class="tk-x-kk"><b>' + esc(kL) + '</b>' + (kR ? '<span>' + esc(kR) + '</span>' : '') + '</span><span class="tk-x-n tk-d">' + esc(name) + (tag ? ' <small class="tk-x-tag">' + tag + '</small>' : '') + '</span>' + (line ? '<span class="tk-x-l">' + esc(line) + '</span>' : '') + '</span></button></li>';
    };
    if (t === 'Music') { L = xBands(); cards = L.map(function (a, i) { return card('x-play', i, a.img, '', 'Seen here first', gN(a.g), a.y, a.n, a.line, true, 'Watch ' + a.n + ', Pickathon ' + a.y); }).join(''); }
    else { L = xPlaces(t); cards = L.map(function (p, i) { return card('x-tour', i, p.img, p.pos, xL(t), '', '', p.n, p.line, false, 'Photo tour of ' + p.n, XPATH[p.k] ? '' : 'neighborhood'); }).join(''); }
    var tk = xTicket(t), line = XSET[t] ? '' : (XD[t] || '');
    return '<h2 class="tk-d tk-x-h">Wander a city of neighborhoods in the forest that only exists for one weekend.</h2><p class="tk-g-k tk-x-k">What do you want to experience?</p>' +
      '<div class="tk-x-ch" role="group" aria-label="Experiences">' + list.map(function (x) { return '<button type="button" class="tk-x-chip" data-act="x-pick" data-v="' + x + '" aria-pressed="' + (x === t ? 'true' : 'false') + '">' + xIc(x) + '<span>' + xL(x) + '</span></button>'; }).join('') + '</div>' +
      (XSET[t] ? '<p class="tk-x-set">' + esc(XSET[t]) + '</p>' : '') +
      '<ul class="tk-x-row" aria-label="' + (t === 'Music' ? 'Bands that played Pickathon before they were big' : esc(t) + ' at Pickathon, by place') + '">' + cards + '</ul>' +
      (t === 'Music' ? '<p class="tk-x-next"><span>Someone on the 2027 lineup is next.</span><button type="button" class="tk-tlink" data-act="x-lineup">' + ((site().season || 'off') === 'off' ? 'Be there first →' : 'See the 2027 lineup →') + '</button></p>' : '') +
      (line || tk ? '<p class="tk-x-line">' + esc(line) + (tk ? '<b>' + esc(tk) + '</b>' : '') + '</p>' : '');
  }
  function xDraw(tries) {
    if (!root) return; var box = $('#tk-x', root); if (!box) return;
    var h = xHTML(); if (!h) { if ((tries || 0) < 10) setTimeout(function () { xDraw((tries || 0) + 1); }, 400); return; }
    box.innerHTML = h; box.hidden = false; guard(box);
    var row = $('.tk-x-ch', box), on = row && $('[aria-pressed="true"]', row); if (row && on && row.scrollWidth > row.clientWidth + 2) { var rr = row.getBoundingClientRect(), ro = on.getBoundingClientRect(); if (ro.left < rr.left || ro.right > rr.right) row.scrollLeft += ro.left - rr.left - 16; }
  }
  function entryHTML() {
    var cold = isCold(), H = (site().data || {}).hoods || {}, camp = H.lushcamp && (H.lushcamp.hi || H.lushcamp.i) || 'i/r3-hood-lushcamp.jpg';
    return '<section class="tk-e tk-e3' + (cold ? ' tk-e3-cold' : '') + '" id="tk-entry" aria-label="Pickathon ' + YEAR + ' tickets"><div class="tk-e3-in">' +
      '<div class="tk-e3-hook">' + (cold ? '<div class="tk-x" id="tk-x" hidden></div>' : '<div class="tk-e3-ph"><img src="' + esc(camp) + '" alt="Friends with guitars at their camp under the firs" fetchpriority="high"></div>' + '<p class="tk-e3-wl"><button type="button" class="tk-tlink" data-act="x-open">What’s it like? →</button></p>') + '</div>' +
      '<div class="tk-e3-buy">' +
        '<p class="tk-e3-sale">' + headline() + '</p>' +
        '<div class="tk-e-vet" id="tk-e-vet"></div>' +
        '<div class="tk-e-days" id="tk-e-days"><h1 class="tk-d" tabindex="-1">When are you coming?</h1><p class="tk-g-sub">Tap your days. We’ll find the ticket.</p><div id="tk-e-pick"></div><button type="button" class="tk-g-btn tk-e-next" data-act="e-next" id="tk-e-next">Next: who’s coming</button></div>' +
        '<details class="tk-e3-know" id="tk-e3-know"><summary><b>I know what I want</b>' + ic('chev', 'tk-e-chev') + '</summary><div class="tk-e-grid" id="tk-e-grid"></div></details>' +
      '</div></div>' +
      '<div class="tk-e3-more"><div class="tk-e-plan" id="tk-e-plan"></div>' + (cold ? '' : '<p class="tk-e3-why"><button type="button" class="tk-tlink" data-act="e-why">New here? Why Pickathon →</button></p>') + '</div></section>';
  }
  function planHTML() {
    var H = (site().data || {}).hoods || {}, hi = function (k, f) { var o = H[k]; return (o && (o.hi || o.i)) || f; }, has = gok(cleanG(S)) && S.pass !== 'none', none = S.pass === 'none';
    var li = function (t, p) { return '<li><span>' + t + '</span><b class="tk-num">' + p + '</b></li>'; }, fromP = function (ids) { ids = ids.filter(function (id) { return !off(id); }); return ids.length ? (ids.length > 1 ? 'from ' : '') + money(Math.min.apply(null, ids.map(PS))) : ''; };
    var row = function (id, img, t, sub, items, to, lab) { return '<details class="tk-e-pr" data-plan="' + id + '"><summary><img src="' + esc(img) + '" alt="" loading="lazy"><span class="tk-e-pr-t"><b>' + t + '</b><span>' + sub + '</span></span>' + ic('chev', 'tk-e-chev') + '</summary><div class="tk-e-pr-in"><ul>' + items.join('') + '</ul><button type="button" class="tk-pill tk-pill-sm" data-act="e-plan" data-to="' + to + '">' + (has || none ? lab : 'Pick your days first') + '</button></div></details>'; };
    var camp = [li('Tent in the woods', 'Included')], c = fromP(['wcar', 'scar']), v = fromP(['wvan', 'svan']), r = fromP(['wrv', 'srv']);
    if (c) camp.push(li('Car camping, next to your car', c)); if (v) camp.push(li('Camper van site', v)); if (r) camp.push(li('RV site', r));
    var go = []; if (!off('wpark')) go.push(li('Weekend parking, in and out', money(PS('wpark')) + ' a car'));
    var dp = fromP(OK.day.map(function (d) { return PARK[d]; })); if (dp) go.push(li('One-day parking', dp)); if (!off('shuttle')) go.push(li('Shuttle from the MAX', money(PS('shuttle')) + ' each')); go.push(li('Bike in or get dropped off', 'Free'));
    var meals = MEALS.filter(function (id) { return !off(id); }).map(function (id) { return li(esc(XN[id].replace('Curation · ', '')), money(PS(id)) + ' a seat'); });
    var kids = [li('Kids 12 and under', 'Free')]; if (!sold('teen')) kids.push(li('Teens 13–17, weekend passes', money(PS('teen')))); kids.push(li('Day tickets, ages 13 and up', 'One price'));
    return '<p class="tk-g-k">Plan your trip</p><p class="tk-g-sub">Look around first. Everything here is added in the steps.</p>' +
      row('camp', hi('lushcamp', 'i/r3-hood-lushcamp.jpg'), 'Camping', 'A tent spot comes with weekend passes', camp, 'sleep', 'Choose camping') +
      row('go', hi('orchard', 'i/r3-hood-woods.jpg'), 'Getting there', 'Park, shuttle, bike or drop-off', go, 'sleep', 'Choose how you’ll get there') +
      (meals.length ? row('meals', hi('curation', 'i/r35-grove-1.jpg'), 'Curation meals', 'A chef and a band at one long table', meals, 'order', 'Add a meal') : '') +
      row('kids', hi('coyote', 'i/r35-grove-1.jpg'), 'Kids and teens', 'Kids are free. Teens are half price.', kids, 'who', 'Add kids or teens');
  }
  function vetHTML() {
    var t = totals(S);
    return t.ready ? '<div class="tk-e-vet-b"><button type="button" class="tk-pill tk-pill-gold" data-act="sheet" aria-haspopup="dialog">Finish my order · ' + money(t.total) + '</button></div>' : '';
  }
  /* Nov 15 late, Zale: experts see every option at once. A tap on a pass tile goes to "who's coming" with that pass chosen; a tap on an add-on goes to its step. */
  function gridHTML() {
    var tile = function (id, a, name, sub, price, cls) { var o = off(id); return '<button type="button" class="tk-e-tile' + (cls || '') + '" data-act="e-tile" data-t="' + a + '"' + (o ? ' disabled' : '') + '><b>' + name + '</b><span>' + sub + '</span><i class="tk-num">' + (o ? 'Sold out' : price) + '</i></button>'; };
    var from = function (ids) { ids = ids.filter(function (id) { return !off(id); }); return ids.length ? (ids.length > 1 ? 'from ' : '') + money(Math.min.apply(null, ids.map(PS))) : ''; };
    var last = function (list) { return list.filter(function (r) { return !off(r[0]); }).concat(list.filter(function (r) { return off(r[0]); })).map(function (r) { return tile.apply(null, r); }).join(''); };   /* Zale's sold-out rule: open first, sold out grayed below */
    var h = '<p class="tk-g-k">Choose your pass</p><div class="tk-e-tiles">' +
      last([['p4', 'p4', '4-Day Pass', 'Thu–Sun, camping included', money(PS('p4'))], ['p3', 'p3', '3-Day Pass', 'Fri–Sun, camping included', money(PS('p3'))], ['d2', 'd2', 'Sat + Sun', 'Two days, no camping', money(PS('d2'))], ['patron', 'pat', 'Patron Pass', 'Backstage, any age', money(PS('patron')), ' tk-e-tile-pat']]) + '</div>' +
      '<div class="tk-e-days1" role="group" aria-label="One-day tickets"><span>One day</span>' + OK.day.map(function (d) { return '<button type="button" class="tk-e-d1" data-act="e-tile" data-t="' + d + '"' + (off(d) ? ' disabled' : '') + '><b>' + DAY[d][2] + '</b><i class="tk-num">' + (off(d) ? 'Sold out' : money(PS(d))) + '</i></button>'; }).join('') + '</div>' +
      '<p class="tk-e-line">Kids 12 and under are free. Teens 13–17 are half price on weekend passes.</p>' +
      '<p class="tk-g-k tk-g-k2">Add to your trip</p><div class="tk-e-tiles tk-e-tiles3">' +
      last([['wcar', 'car', 'Car camping', 'Next to your car', from(['wcar', 'scar'])], ['wvan', 'van', 'Camper van', 'Power at South Camp', from(['wvan', 'svan'])], ['wrv', 'rv', 'RV', 'Power at South Camp', from(['wrv', 'srv'])]]) + '</div><div class="tk-e-tiles">' +
      '<button type="button" class="tk-e-tile" data-act="e-tile" data-t="park"><b>Parking and shuttle</b><span>Weekend or one day</span><i class="tk-num">' + from(['wpark', 'pthu', 'pfri', 'psat', 'psun', 'shuttle']) + '</i></button>' +
      '<button type="button" class="tk-e-tile" data-act="e-tile" data-t="meals"><b>Curation meals</b><span>A chef and a band</span><i class="tk-num">' + from(MEALS) + '</i></button></div>';
    return h;
  }
  function eTile(t) {
    var wk = { p4: ['dthu', 'dfri', 'dsat', 'dsun'], p3: ['dfri', 'dsat', 'dsun'], d2: ['dsat', 'dsun'] };
    if (wk[t] || OK.day.indexOf(t) >= 0 || t === 'pat') {
      EN.on = {}; EN.pat = t === 'pat'; (wk[t] || (OK.day.indexOf(t) >= 0 ? [t] : [])).forEach(function (d) { EN.on[d] = 1; });
      var p = gPlan(EN); if (!p || !p.k) return;
      var has = S.pass && S.pass !== 'none' && gok(cleanG(S)), pk = p.k === 'days' ? 'd1' : p.k, hit = function (g) { return g.pass === pk && (pk !== 'd1' || g.day === t); };
      var same = has && hit(S), mi = has && !same ? (S.more || []).findIndex(hit) : -1;
      if (mi >= 0) { var mg = S.more.splice(mi, 1)[0], cur = cleanG(S); S.more.push(cur); ['pass', 'day', 'adult', 'teen', 'kid', 'wed'].forEach(function (k) { S[k] = mg[k]; }); S = clean(S); save(); update(); guide('who'); return; }   /* that pass is already in the order: open it to change who's coming */
      guide('who', EN, has && !same); if (has && !same) live(p.name + ' added to your order. Set who it is for.'); return;
    }
    var vt = { car: 'wcar', van: 'wvan', rv: 'wrv' }[t];
    addOn(t === 'park' ? 'sleep' : t === 'meals' ? 'order' : 'sleep', vt || '');
  }
  function addOn(step, sleepId) {
    var has = (S.pass && S.pass !== 'none' && gok(cleanG(S))) || (S.more || []).length;
    if (!has) { addonsOnly(sleepId); if (GS) { GS.step = step; gDraw(true); } return; }
    if (sleepId) { S.sleep = sleepId; S = clean(S); save(); update(); }
    guide(step);
  }
  function entrySide() { if (!root) return; var vt = $('#tk-e-vet', root); if (vt) vt.innerHTML = vetHTML(); var gd = $('#tk-e-grid', root); if (gd) gd.innerHTML = gridHTML(); var pl = $('#tk-e-plan', root); if (pl) { var op = {}; $$('details[open]', pl).forEach(function (d) { op[d.getAttribute('data-plan')] = 1; }); pl.innerHTML = planHTML(); $$('details', pl).forEach(function (d) { if (op[d.getAttribute('data-plan')]) d.open = true; }); } guard($('#tk-entry', root)); }
  function entryDraw(tries) {
    if (!root) return; var pk = $('#tk-e-pick', root); if (!pk) return;
    pk.innerHTML = gDaysHTML(EN, true); entrySide(); if ($('#tk-x', root) && !$('#tk-x', root).firstChild) xDraw(); var p = gPlan(EN), nx = $('#tk-e-next', root); if (nx) nx.disabled = !p || !p.k;
    var reel = $('#tk-e-reel', root);
    if (reel && !reel.firstChild) { var h = reelHTML(); if (h) { reel.innerHTML = h; $('#tk-e-proof', root).hidden = false; } else if ((tries || 0) < 8) setTimeout(function () { entryDraw((tries || 0) + 1); }, 400); }   // the artist list arrives a moment after the page
    guard($('#tk-entry', root));
  }
  function entryClick(b) {
    var g = b.getAttribute('data-g'), act = b.getAttribute('data-act'), to;
    if (g === 'addons') { addonsOnly(); return true; }
    if (act === 'e-fast') { guide('days'); return true; }
    if (act === 'x-pick') { xpPick(b.getAttribute('data-v')); xDraw(); return true; }
    if (act === 'x-play') { var xa = xBands()[+b.getAttribute('data-i')]; if (xa && xa.vu && window.__pkPlayVid) { try { window.__pkPlayVid(xa.vu, xa.n + ' · Pickathon ' + xa.y); } catch (x) {} } return true; }
    if (act === 'x-tour') { var xp = xPlaces(XCUR)[+b.getAttribute('data-i')], AT = app(); if (xp && AT && AT.ssOpen) { try { AT.ssOpen(xp.k); } catch (x) {} } return true; }
    if (act === 'x-open') { var hk = $('.tk-e3-hook', root); if (hk) { hk.innerHTML = '<div class="tk-x" id="tk-x" hidden></div>'; xDraw(); var xb = $('#tk-x', root); if (xb) { try { xb.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) {} } } return true; }
    if (act === 'x-lineup') { var AL = app(); if (AL) AL.go('lineup'); return true; }
    if (act === 'e-why') { var AW = app(); if (AW) AW.go('home'); return true; }
    if (act === 'e-tile') { eTile(b.getAttribute('data-t')); return true; }
    if (g && gDayTap(EN, g, b.getAttribute('data-d'))) { entryDraw(); return true; }
    if (act === 'e-days') { var hd = $('#tk-e-help', root); if (hd) hd.open = true; to = $('#tk-e-days', root); if (to) { try { to.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) { to.scrollIntoView(); } var hh = $('h2', to); if (hh) { try { hh.focus({ preventScroll: true }); } catch (x) {} } } return true; }
    if (act === 'e-plan') { var pt = b.getAttribute('data-to'); if (S.pass === 'none') guide(pt === 'who' ? 'days' : pt); else if (gok(cleanG(S))) guide(pt); else { to = $('#tk-e-days', root); if (to) { try { to.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) { to.scrollIntoView(); } } live('Pick your days first.'); } return true; }
    if (act === 'e-next') { var p = gPlan(EN); if (p && p.k) guide('who', EN); return true; }
    if (act === 's-hoods') { var AH = app(); if (window.__pkGoFarm) window.__pkGoFarm(); else if (AH) AH.go('hoods'); return true; }
    if (act === 'e-all') { var A = app(); if (A) { A.setState({ archLead: null, archT: null, archC: null, archY: '', luYear: 'disc', luArch: true, lineup: 'music' }); A.go('lineup', { keepArch: true }); } return true; }
    return false;
  }
  /* ---------- not on sale: a coming-soon page (Zale, Nov 15: compelling any time tickets aren't on sale; checkout hidden until the WordPress switch is on) ---------- */
  function soonCal() { return ''; /* Zale, Nov 15: we don't say when, so no calendar date */ if (!root) return ''; var cal = root.getAttribute('data-cal') || '', calL = root.getAttribute('data-callabel') || '', calF = root.getAttribute('data-calfile') || 'pickathon-tickets.ics'; return cal && when() === 'pre' ? '<a class="tk-tlink" href="' + esc(cal) + '" download="' + esc(calF) + '">' + esc(calL) + '</a>' : ''; }
  function soonAsk(id) {
    if (reminded()) return '<p class="tk-pre-ok" role="status">' + ic('check') + '<span>You’re on the list. ' + (when() === 'pre' ? 'One email the moment tickets open.' : 'One email when the next sale opens.') + '</span></p>' + (soonCal() ? '<p class="tk-s-cal">' + soonCal() + '</p>' : '');
    return remindForm(id, 'Remind me') + (soonCal() ? '<p class="tk-s-cal">' + soonCal() + '</p>' : '');
  }
  function soonFact(img, k, t, s, go) { return '<li class="tk-s-f"><img src="' + esc(img) + '" alt="" loading="lazy" decoding="async"><span class="tk-s-fx"><b class="tk-d">' + t + '</b><span>' + s + '</span>' + (go ? '<button type="button" class="tk-tlink" data-act="' + go[0] + '">' + go[1] + '</button>' : '') + '</span></li>'; }
  function soonHTML() {
    var w = when(), pre = w === 'pre', r = T.show || {}, H = (site().data || {}).hoods || {};
    var hi = function (k, f) { var o = H[k]; return (o && (o.hi || o.i)) || f; };
    var kick = pre ? 'A limited ' + esc(r.name ? r.name + (/sale$/i.test(r.name) ? '' : ' sale') : 'sale') + ' opens soon' : 'Tickets aren’t on sale right now';   /* Zale, Nov 15: we don't say when */
    var row = function (t, sub) { return '<li><span><b>' + t + '</b><small>' + sub + '</small></span></li>'; };   /* Zale, Nov 15: no prices before the sale, just what goes on sale */
    var q = function (t, a) { return '<details class="tk-s-q"><summary>' + t + '</summary><p>' + a + '</p></details>'; };
    return '<section class="tk-e tk-soon" id="tk-entry" aria-label="Pickathon ' + YEAR + ' tickets">' +
      '<div class="tk-e-hero"><img src="' + GHERO + '" alt="A singer stands on a speaker above a packed crowd at Cherry Hill, with fir trees behind" fetchpriority="high"><span class="tk-g-sh"></span><div class="tk-g-low">' +
      '<p class="tk-s-k">' + kick + '</p>' +
      '<h1 class="tk-d">Four days of music in the woods. <span>Find your next favorite band.</span></h1>' +
      '<p class="tk-e-s"><span>' + (pre ? 'For you, or as a gift. One email the moment it opens.' : 'One email when the next sale opens.') + '</span></p>' +
      '<div class="tk-s-ask" id="tk-s-ask1"></div></div></div>' +
      '<div class="tk-s-stack">' +
      '<details class="tk-e-why" id="tk-e-why"><summary><span class="tk-e-why-ph"><img src="' + esc(hi('woods', 'i/r3-hood-woods.jpg')) + '" alt="" loading="lazy"><img src="' + esc(hi('lushcamp', 'i/r3-hood-lushcamp.jpg')) + '" alt="" loading="lazy"><img src="' + esc(hi('grove', 'i/r35-grove-1.jpg')) + '" alt="" loading="lazy"></span><span class="tk-e-why-t"><b class="tk-d">Why Pickathon?</b><span>New here? Two minutes on what you’re signing up for.</span></span>' + ic('chev', 'tk-e-chev') + '</summary><div class="tk-e-why-in">' +
        '<p class="tk-e-why-l">Your new favorite band is playing. You just haven’t met them yet.</p>' +
        '<div class="tk-e-proof" id="tk-e-proof" hidden><p class="tk-g-k">They played here first</p><p class="tk-g-sub">Small names when we booked them.</p><ul class="tk-e-reel" id="tk-e-reel" aria-label="Acts that played Pickathon before they were big, biggest today first"></ul></div>' +
        '<p class="tk-g-k tk-e-why-k">What a ticket gets you</p><ul class="tk-s-fs">' +
        soonFact(hi('woods', 'i/r3-hood-woods.jpg'), '', 'Every act plays twice', 'Two sets on two different stages, so you get two chances to catch each one.') +
        soonFact(hi('lushcamp', 'i/r3-hood-lushcamp.jpg'), '', 'Camping is included', 'Weekend passes come with a tent spot in the forest. Kids 12 and under are free.') +
        soonFact(hi('grove', 'i/r35-grove-1.jpg'), '', 'A city built by hand', 'Stages and camps designed and built for one summer on a forest farm.', ['s-hoods', 'See the neighborhoods →']) +
        '</ul><p class="tk-e-press">Featured in The New York Times’ festivals to see in 2026. Named best independent music festival by Paste. Two AIA architecture awards.</p></div></details>' +
      '<details class="tk-e-pr" data-plan="types"><summary><img src="' + esc(hi('lushcamp', 'i/r3-hood-lushcamp.jpg')) + '" alt="" loading="lazy"><span class="tk-e-pr-t"><b>What goes on sale</b><span>Weekend passes, day tickets, Patron and add-ons</span></span>' + ic('chev', 'tk-e-chev') + '</summary><div class="tk-e-pr-in tk-s-pr"><ul class="tk-s-pl">' +
        row('4 days · Thu–Sun', 'Camping in the forest included. Add a Wednesday early arrival.') + row('3 days · Fri–Sun', 'Camping in the forest included.') + row('Day tickets', 'Saturday + Sunday, or any one day. Ages 13 and up, no camping.') + row('Patron Pass · Wed–Sun', 'Backstage hospitality, concierge and early entry. Any age, one each.') + row('Add-ons', 'Car camping, camper van and RV sites, parking, the MAX shuttle and Curation meals.') +
        '</ul><p class="tk-s-pn">Kids 12 and under are free. Teens 13 to 17 are half price on weekend passes. Prices come out when tickets do.</p></div></details>' +
      '<details class="tk-e-pr" data-plan="faq"><summary><img src="' + esc(hi('grove', 'i/r35-grove-1.jpg')) + '" alt="" loading="lazy"><span class="tk-e-pr-t"><b>Good to know</b><span>Kids, day tickets, RVs and getting there</span></span>' + ic('chev', 'tk-e-chev') + '</summary><div class="tk-e-pr-in tk-s-qs">' +
      q('When do tickets go on sale?', pre ? 'Soon. Sign up and we send one email the moment they do.' : 'Sign up and we send one email when the next sale opens.') +
      q('Can I bring my kids?', 'Yes. Kids 12 and under are free with a weekend pass or a day ticket. Teens 13 to 17 are half price on weekend passes.') +
      q('Can I come for just one day?', 'Yes. Day tickets are one price for ages 13 and up. They don’t include camping.') +
      q('Can I car camp or bring an RV?', 'Yes. Car camping, camper van and RV sites at Willow Camp and South Camp are added to your order. South Camp sells out first.') +
      q('How do I get there?', 'Drive and park, take the MAX to Lents Town Center and ride the shuttle, bike in, or get dropped off.') +
      '<div class="tk-hand"><button type="button" class="tk-pill" data-go="info">How the weekend works</button></div></div></details>' +
      '<div class="tk-s-end"><h2 class="tk-d">Be first in line.</h2><div class="tk-s-ask" id="tk-s-ask2"></div></div></div>' +
      '</section>';
  }
  function soonDraw(tries) {
    if (!root || !$('.tk-soon', root)) return;
    ['tk-s-ask1', 'tk-s-ask2'].forEach(function (id, i) { var el = $('#' + id, root); if (!el) return; el.innerHTML = soonAsk('tk-sa' + i); if (!reminded()) wireForm(el, 'tk-sa' + i, function () { soonDraw(); var p = $('#' + id + ' .tk-pre-ok', root); if (p) { p.setAttribute('tabindex', '-1'); p.focus(); } }); });
    var reel = $('#tk-e-reel', root);
    if (reel && !reel.firstChild) { var h = reelHTML(); if (h) { reel.innerHTML = h; $('#tk-e-proof', root).hidden = false; } else if ((tries || 0) < 8) setTimeout(function () { soonDraw((tries || 0) + 1); }, 400); }
    guard($('.tk-soon', root));
  }
  function skeleton() {
    var w = when(), minDay = minPS(OK.day), h = '';
    if (w !== 'sale') return soonHTML();
    if (entryOn()) h += entryHTML();
    h += '<div class="tk-in"><div class="tk-paper tk-head" hidden>' + logo() + '<div class="tk-head-t"><h1 class="tk-d">Tickets</h1><p>' + headline() + '</p></div></div>';
    h += '<div class="tk-main" id="tk-main" hidden><p class="tk-when"><b>' + DAY.dthu[4] + '–' + DAY.dsun[4].split(' ')[1] + ', ' + YEAR + '</b><span>Gates open ' + DAY.w[2] + ', ' + DAY.w[4] + '</span></p>' +
      '<div class="tk-jump"><button type="button" class="tk-new" data-act="why" aria-haspopup="dialog">New to Pickathon?</button><nav aria-label="Jump to"><button type="button" data-jump="camping">Camping</button><button type="button" data-jump="parking">Parking</button><button type="button" data-jump="meals">Meals</button></nav></div>';   /* Zale, Nov 13: experts go straight to what they came for; new visitors get the festival in one sheet */
    if (w === 'pre') h += '<section class="tk-pre" id="tk-pre" aria-label="Reminder"></section>';
    h += '<div id="tk-top"></div>';
    h += '<div class="tk-cols"><div class="tk-build">';
    h += '<fieldset><div class="tk-leg"><legend class="tk-d tk-d-label">Pick a ticket</legend><button type="button" class="tk-pill tk-pill-sm" data-act="help" aria-haspopup="dialog">Pick by days</button></div><p class="tk-feenote">Prices include the ' + (FEE * 100) + '% fee.</p><div class="tk-grps" id="tk-grps" hidden></div><div class="tk-passes" id="tk-passes">' +
      group('wk', 'Weekend passes', 'Camping included · teens 13–17 half price') +
      passCard('p4', '4 days', span('dthu', 'dsun'), [0, 1, 1, 1, 1], pprice('p4')) +
      '<label class="tk-wed" id="tk-wed" hidden><input type="checkbox" id="tk-wedc"><span><b>Arrive ' + DAY.w[3] + ', ' + DAY.w[4] + '</b>, from 5 pm. Adults and teens.</span><em class="tk-num">+' + money(PS('early')) + ' each</em></label>' +
      passCard('p3', '3 days', span('dfri', 'dsun'), [0, 0, 1, 1, 1], pprice('p3')) +
      group('day', 'Day tickets', 'Ages 13 and up, one price · no camping') +
      passCard('d2', 'Sat + Sun', span('dsat', 'dsun'), [0, 0, 0, 1, 1], pprice('d2')) +
      passCard('d1', 'One day', 'Pick your day', [0, 0, 0, 1, 0], '<small id="tk-d1from">from</small><b class="tk-num" id="tk-d1p">' + money(minDay) + '</b>', { stripId: 'tk-d1strip', subId: 'tk-d1sub' }) +
      '<div class="tk-daypick" id="tk-daypick" hidden role="radiogroup" aria-label="Which day?">' + OK.day.map(function (d) { return '<label><input type="radio" name="tk-day" value="' + d + '" class="tk-vh"><span>' + DAY[d][2] + ', ' + DAY[d][4] + '<b class="tk-num">' + (sold(d) ? 'Sold out' : money(PS(d))) + '</b></span></label>'; }).join('') + '</div>' +
      group('pat', 'Patron', 'Its own ticket · everyone needs one, kids too · backstage hospitality, concierge, early entry') +
      passCard('pat', 'Patron Pass', '<span class="tk-nw">Wed Aug 4</span> – <span class="tk-nw">Sun Aug 8</span>', [1, 1, 1, 1, 1], sold('patron') ? '<b>Sold out</b>' : '<b class="tk-num">' + money(PS('patron')) + '</b>', { note: 'Tent camping in the woods is included, the same as every weekend pass. Car camping and RV sites are extra.' }) +
      group('none', 'Already have your pass?', 'Camping, parking, meals and extras on their own') +
      '<label class="tk-pass tk-paper tk-pass-none"><input type="radio" name="tk-pass" value="none" class="tk-vh"><span class="tk-pass-t"><b>Add-ons only</b><span>Bring the pass you already have</span></span><span class="tk-pass-p"><b>Add-ons</b></span></label>' +
      '</div></fieldset>';
    h += '<fieldset class="tk-who"><div class="tk-leg"><legend class="tk-d tk-d-label">Who’s coming?</legend></div><div class="tk-who-g">' + stepper('adult', 'Adults', '18 and up', 'adult') + stepper('teen', 'Teens', '13 to 17', 'teen') + stepper('kid', 'Kids', '12 and under', 'kid') + '</div><p class="tk-note" id="tk-teennote" hidden></p><p class="tk-more" id="tk-morep" hidden><span>Someone needs a different pass?</span><button type="button" class="tk-pill tk-pill-sm" data-act="addpass">Add a different pass</button></p><p class="tk-more tk-giftp" id="tk-giftp" hidden><span>Buying for someone else?</span><button type="button" class="tk-pill tk-pill-sm" data-act="gift">Give it as a gift</button></p></fieldset>';
    h += '<section class="tk-sec" id="tk-s-sleep" aria-labelledby="tk-h-sleep"><div class="tk-leg"><h2 class="tk-d tk-d-label" id="tk-h-sleep">Camping</h2><button type="button" class="tk-pill tk-pill-sm" data-act="camps">See the camps</button></div>' +
      '<div class="tk-opts" role="radiogroup" aria-labelledby="tk-h-sleep">' +
      opt('tk-sleep', 'tent', hoodImg('lushcamp', 'tickets.sleep.tent'), 'Tent in the woods', 'Lush Camp or Wild Camp. Walk in, pick your spot.', 'Included') +
      opt('tk-sleep', 'wcar', hoodImg('willowcamp', 'tickets.sleep.willow'), 'Car camping · Willow Camp', 'One car and a tent on a 16′ × 18′ site. Half a mile to the gate, free shuttle.', per('wcar', 'a site')) +
      opt('tk-sleep', 'scar', hoodImg('southcamp', 'tickets.sleep.south'), 'Car camping · South Camp', 'The same size site, right across from the main entrance. Sells out first.', per('scar', 'a site')) +
      opt('tk-sleep', 'wvan', emblem('willowcamp'), 'Camper van · Willow Camp', '16′ to 26′. Power is an add-on. No generators.', per('wvan', 'a site')) +
      opt('tk-sleep', 'svan', emblem('southcamp'), 'Camper van · South Camp', '16′ to 26′, one household outlet included.', per('svan', 'a site')) +
      opt('tk-sleep', 'wrv', emblem('willowcamp'), 'RV · Willow Camp', '26′ to 36′. Power is an add-on. No generators.', per('wrv', 'a site')) +
      opt('tk-sleep', 'srv', emblem('southcamp'), 'RV · South Camp', '26′ to 36′, one 125V 30A outlet included.', per('srv', 'a site')) +
      opt('tk-sleep', 'none', '<span class="tk-opt-e"></span>', 'Not camping', 'Sleep at home or nearby. Come and go as you like.', money(0)) +
      '<div class="tk-park" id="tk-vsite" hidden>' + stepper('sites', 'Sites', null, 'site') +
      '<label class="tk-wed tk-pwr" id="tk-pwr" hidden><input type="checkbox" id="tk-pwrc"><span><b>Add power</b>, one outlet a site</span><em class="tk-num" id="tk-pwrp"></em></label></div>' +
      '</div></section>';
    h += '<section class="tk-sec" id="tk-s-go" aria-labelledby="tk-h-go"><div class="tk-leg"><h2 class="tk-d tk-d-label" id="tk-h-go">Getting there</h2></div>' +
      '<div class="tk-opts" role="radiogroup" aria-labelledby="tk-h-go">' +
      opt('tk-go', 'drive', emblem('welcomelot'), 'Drive and park', '', '') +
      '<div class="tk-park" id="tk-park" hidden><div class="tk-chips" id="tk-pday" role="radiogroup" aria-label="Which parking?">' + chip('tk-pday', '', 'Weekend') + OK.day.map(function (d) { return chip('tk-pday', d, DAY[d][2] + ' only'); }).join('') + '</div><div class="tk-chips" id="tk-d2p" role="radiogroup" aria-label="Parking for Sat + Sun">' + chip('tk-dp', '0', 'Weekend parking<b class="tk-num" id="tk-dpw"></b>') + chip('tk-dp', '1', 'Sat + Sun day passes<b class="tk-num" id="tk-dpd"></b>') + '</div><p class="tk-pnote" id="tk-dpnote"></p><div class="tk-chips" id="tk-size" role="radiogroup" aria-label="Vehicle size">' + chip('tk-big', '0', 'Car or motorcycle, up to 16′<b class="tk-num" data-c="wpark"></b>') + chip('tk-big', '1', 'Oversized, 16′ to 24′<b class="tk-num" data-c="opark"></b>') + '</div>' + stepper('car', 'Cars', null, 'car') + '</div>' +
      opt('tk-go', 'shuttle', '<span class="tk-opt-e"></span>', 'MAX + shuttle', 'From Lents Town Center MAX, about hourly, all weekend. One pass per rider, ages 13 and up.', per('shuttle', 'a rider')) +
      opt('tk-go', 'bike', '<span class="tk-opt-e"></span>', 'Bike', 'Staffed bike parking at the farm.', 'Free') +
      opt('tk-go', 'drop', emblem('southcamp'), 'Dropped off', 'Rideshare or a friend, at the South Lot.', 'Free') +
      opt('tk-go', 'later', '<span class="tk-opt-e"></span>', 'Decide later', 'Parking and shuttle passes can be added any time.', money(0)) +
      '</div></section>';
    h += '<section class="tk-extra" id="tk-s-extra" aria-labelledby="tk-h-extra"><div class="tk-leg"><h2 class="tk-d tk-d-label" id="tk-h-extra">Anything else?</h2></div>' +
      '<details id="tk-x-meals"><summary><span>Curation: Feast in the Forest</span><span class="tk-num tk-dim" id="tk-xs-meals"></span></summary><p>A chef and a festival artist at one shared table in the woods, about an hour and a half. 100 seats a seating, so they go fast. Each seat needs a ticket for that day.</p>' +
      MEALS.map(function (id) { return xrow(id, XN[id].replace('Curation · ', '').replace(/^./, function (c) { return c.toUpperCase(); }), ''); }).join('') + '</details>' +
      '<details id="tk-x-dish"><summary><span>Cup, plate and coozie</span><span class="tk-num tk-dim" id="tk-xs-dish"></span></summary><p>Reusable, for the zero waste festival. Waiting for you at the farm.</p>' +
      DISH.map(function (id) { return xrow(id, XN[id], ''); }).join('') + '</details>' +
      '<details id="tk-x-give"><summary><span>Give back</span><span class="tk-num tk-dim" id="tk-xs-give"></span></summary><p>For the Creative Neighborhoods student build program.</p>' +
      GIVE.map(function (id) { return xrow(id, XN[id], id === 'tools' ? 'Stage and build equipment' : 'A pre-apprenticeship student, through the program'); }).join('') + '</details>' +
      '<div class="tk-hand"><button type="button" class="tk-pill" data-go="info">How the weekend works</button><button type="button" class="tk-tlink" data-go="list">Every pass and price</button></div>' +
      '<p class="tk-fine">' + fineLine() + '</p></section>';
    h += '</div><aside class="tk-order" aria-label="Your order"><div class="tk-paper tk-osheet"><p class="tk-d tk-d-card">Your order</p><hr class="tk-rule2" style="margin:8px 0 4px"><ul class="tk-olines" id="tk-lines"></ul>' +
      '<p class="tk-otot" id="tk-otot" hidden><span>Total</span><b class="tk-num" id="tk-ototv"></b></p><p class="tk-oplan" id="tk-oplan" hidden></p>' +
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
    root = el; el.innerHTML = skeleton(); if ($('.tk-soon', el)) { soonDraw(); return; } $('#tk-top', el).innerHTML = topHTML(); preDraw(); update(); entryDraw();
  }
  function gv(f) { return f.indexOf('x-') === 0 ? (S.x[f.slice(2)] || 0) : S[f]; }
  function sv(f, v) { if (f.indexOf('x-') === 0) { if (v) S.x[f.slice(2)] = v; else delete S.x[f.slice(2)]; } else S[f] = v; }
  function vmin(f) { return f === 'car' || f === 'sites' ? 1 : 0; }
  function vmax(f) { return f === 'sites' ? 6 : 12; }
  function setRadio(name, v) { $$('input[name="' + name + '"]', root).forEach(function (i) { i.checked = i.value === v; }); }
  function update() {
    if (!root || !root.firstChild || !document.getElementById('tk-main')) return;
    S = clean(S);
    if (S.pass && S.pass !== 'd1' && S.pass !== 'none' && sold(S.pass === 'pat' ? 'patron' : S.pass)) S.pass = null;
    if (S.day && sold(S.day)) S.day = null;
    if (VEH.test(S.sleep) && off(S.sleep)) S.sleep = 'tent';
    if (S.pwr && (!PWR[S.sleep] || off(PWR[S.sleep]))) S.pwr = false;
    XID.forEach(function (id) { if (S.x[id] && off(id)) delete S.x[id]; });
    if (S.teen && sold('teen')) S.teen = 0;   // audit Nov 13: a sold-out Teen 4-Day could still be added
    if (S.wed && sold('early')) S.wed = false;
    if (S.go === 'shuttle' && sold('shuttle')) S.go = 'later';
    save();
    var w = when(), cam = camping(S), veh = vehicle(S), k = key(S), kd = kind(S.pass);
    setRadio('tk-pass', S.pass); setRadio('tk-day', S.day); setRadio('tk-sleep', S.sleep); setRadio('tk-go', veh ? 'drive' : S.go); setRadio('tk-big', S.big ? '1' : '0');
    $$('input[name="tk-pass"]', root).forEach(function (i) { i.disabled = i.value !== 'd1' && i.value !== 'none' && sold(i.value === 'pat' ? 'patron' : i.value); });
    $$('input[name="tk-day"]', root).forEach(function (i) { i.disabled = sold(i.value); });
    $$('input[name="tk-sleep"]', root).forEach(function (i) { i.disabled = VEH.test(i.value) && off(i.value); });
    $('[data-p="tent"]', root).textContent = S.pass === 'none' ? 'With your pass' : 'Included';
    var vs = $('#tk-vsite', root); vs.hidden = !veh; var pw = $('#tk-pwr', root), pid = PWR[S.sleep]; pw.hidden = !veh || !pid;
    if (pid) { $('#tk-pwrc', root).checked = S.pwr; $('#tk-pwrc', root).disabled = off(pid); $('#tk-pwrp', root).textContent = off(pid) ? 'Sold out' : '+' + money(PS(pid)) + ' a site'; }
    $('#tk-sitestep', root).hidden = !veh;
    $$('input[name="tk-go"]', root).forEach(function (i) { i.disabled = (veh && i.value !== 'drive') || (i.value === 'shuttle' && sold('shuttle')); });
    $('#tk-wedc', root).disabled = sold('early'); var we = $('#tk-wed em', root); if (we) we.textContent = sold('early') ? 'Sold out' : '+' + money(PS('early')) + ' each';
    $('#tk-wed', root).hidden = S.pass !== 'p4'; $('#tk-wedc', root).checked = S.wed; $('#tk-w-p4', root).classList.toggle('on', S.pass === 'p4' && S.wed);
    $('#tk-daypick', root).hidden = S.pass !== 'd1';
    $$('#tk-d1strip i[data-d]', root).forEach(function (i) { i.classList.toggle('on', S.day ? i.getAttribute('data-d') === S.day : i.getAttribute('data-d') === 'dsat'); });
    $('#tk-d1sub', root).textContent = S.day ? DAY[S.day][3] + ', ' + DAY[S.day][4] : 'Pick your day'; $('#tk-d1from', root).hidden = !!S.day; $('#tk-d1p', root).textContent = money(S.day ? PS(S.day) : minPS(OK.day));
    /* who's coming: the rows follow the ticket kind, and each says only what is true for it */
    /* Gate 1 fix 13 (D12/Q7, panel P5): three full-width rows, label and one-line sublabel on the left, the price, then the stepper */
    var who = kd === 'day' ? { adult: ['Ages 13 and up', 'One price', 'person 13 and up', k ? money(PS(k)) : ''], kid: ['Kids', '12 and under', 'kid', 'Free'] }
      : kd === 'pat' ? { adult: ['Patron Passes', 'One each, any age, kids too', 'Patron Pass', money(PS('patron'))] }
      : kd === 'none' ? { adult: ['How many of you?', 'For shuttle passes', 'person', ''] }
      : kd === 'wk' ? { adult: ['Adults', '18 and up', 'adult', money(PS(k))], teen: ['Teens', sold('teen') ? '13–17 · Teen 4-Day sold out' : '13–17 · 4-Day at half price', 'teen', sold('teen') ? '' : money(PS('teen'))], kid: ['Kids', '12 and under', 'kid', 'Free'] }
      : { adult: ['Adults', '18 and up', 'adult', ''], teen: ['Teens', '13–17', 'teen', ''], kid: ['Kids', '12 and under', 'kid', ''] };
    var cov = cover(S);
    $$('.tk-step', root).forEach(function (st) { var f = st.getAttribute('data-k'), v = gv(f), b = $$('button', st), xid = f.indexOf('x-') === 0 ? f.slice(2) : ''; $('output', st).textContent = v;
      b[0].disabled = v <= (vmin(f) || (f === 'adult' && kd === 'pat' ? 1 : 0)); b[1].disabled = v >= vmax(f) || (f === 'teen' && sold('teen')) || (!!xid && !xok(xid));
      if (xid) { var md = MEAL[xid], need = md !== undefined && !cov[md]; var base0 = md !== undefined ? DAYS[md][2] + ', ' + DAYS[md][4] : ($('#tk-ls-' + f, root).getAttribute('data-s') || '');
        $('#tk-ls-' + f, root).textContent = off(xid) ? 'Sold out' : need ? (S.pass ? 'Needs a ' + DAYS[md][3] + ' ticket' : 'Pick a ticket for ' + DAYS[md][3] + ' first') + ' · ' + money(PS(xid)) : (base0 ? base0 + ' · ' : '') + money(PS(xid)); $('#tk-lp-' + f, root).textContent = ''; st.classList.toggle('is-off', off(xid) || need); return; }
      if (f === 'car' || f === 'sites') return; var r = who[f]; st.hidden = !r; if (!r) return; $('#tk-ln-' + f, root).textContent = r[0]; $('#tk-ls-' + f, root).textContent = r[1]; var lp = $('#tk-lp-' + f, root); if (lp) lp.textContent = r[3] || ''; b[0].setAttribute('aria-label', 'One fewer ' + r[2]); b[1].setAttribute('aria-label', 'One more ' + r[2]); });
    $('.tk-who-g', root).setAttribute('data-n', String(Object.keys(who).length));
    var tn = $('#tk-teennote', root), note = '';
    if (!S.adult && (S.teen || S.kid)) note = kd === 'day' ? '<b>Add a ticket for someone 13 or older.</b> Kids come in with them.' : '<b>Add an adult.</b> Teens and kids come in with a ticketed adult.';
    if (kd === 'none') note = ''; tn.hidden = !note; tn.innerHTML = note;
    $('#tk-morep', root).hidden = !(gok(S) && S.pass !== 'none' && (S.more || []).length < 5);
    var gp = $('#tk-giftp', root); if (gp) gp.hidden = !(window.pkGift && when() === 'sale' && giftable(S).length);
    var gr = $('#tk-grps', root), M = S.more || []; gr.hidden = !M.length;
    gr.innerHTML = M.length ? '<p class="tk-grps-h">Already in this order</p><ul>' + M.map(function (g, i) { return '<li><span>' + esc(gshort(g)) + '</span><button type="button" class="tk-tlink" data-act="rmgrp" data-i="' + i + '" aria-label="Remove ' + esc(gshort(g)) + '">Remove</button></li>'; }).join('') + '</ul><p class="tk-grps-n">' + (S.pass && S.pass !== 'none' ? 'Now: the next pass below.' : 'Pick the next pass below, or check out.') + '</p>' : '';
    /* extras: what each group adds, at a glance */
    [['meals', MEALS, 'a seat'], ['dish', DISH, ''], ['give', GIVE, '']].forEach(function (x) { var n = x[1].reduce(function (a, id) { return a + (xok(id) ? (S.x[id] || 0) : 0); }, 0), lo = x[1].filter(function (id) { return !off(id); });
      $('#tk-xs-' + x[0], root).textContent = n ? (x[0] === 'meals' ? plural(n, 'seat') : n + ' added') : lo.length ? (x[0] === 'meals' ? money(PS(lo[0])) + ' a seat' : 'from ' + money(minPS(lo))) : 'Sold out';
      if (n) $('#tk-x-' + x[0], root).open = true; });
    $('#tk-s-sleep', root).hidden = !!S.pass && !cam;   // day tickets have no camping, and their heading already says so
    /* getting there: the drive row names exactly what parking it adds */
    var pk = parkId(S), PB = pbase(S) || {}, none = S.pass === 'none', dayOnly = none ? !!S.pday : PB.pass === 'd1';
    $('[data-t="drive"]', root).textContent = veh ? 'Drive in with your camp' : 'Drive and park';
    $('[data-w="drive"]', root).textContent = veh ? 'Your camp site is your parking. No parking pass needed.' : none ? 'Weekend parking, or one day only. Welcome Lot, a mile from the gate, free shuttle.' : dayOnly ? (PB.day ? parkName(pk) + '. Welcome Lot, a mile from the gate, free shuttle.' : 'Parking for the day you pick, in the Welcome Lot. Free shuttle to the gate.') : S.pass === 'd2' ? 'Welcome Lot, a mile from the gate, free shuttle. Weekend parking or two day passes: your pick below.' : 'Weekend parking in the Welcome Lot, in and out all weekend. A mile from the gate, free shuttle.';
    $('[data-p="drive"]', root).innerHTML = veh ? '' : PB.pass === 'd2' && S.dp && !none ? money(PS('psat') + PS('psun')) + '<small>a car</small>' : pk ? (sold(pk) ? 'Sold out' : money(PS(pk)) + '<small>' + (dayOnly ? DAY[none ? S.pday : PB.day][2] + ' only' : 'a car') + '</small>') : 'from ' + money(minPS(['pthu', 'pfri', 'psat', 'psun'])) + '<small>a day</small>';
    $('#tk-park', root).hidden = S.go !== 'drive' || veh;
    $('#tk-pday', root).hidden = !none; setRadio('tk-pday', S.pday);
    var d2 = PB.pass === 'd2' && !none, wkP = PS(S.big ? 'opark' : 'wpark'), ddP = PS('psat') + PS('psun');   // Sat + Sun: the buyer's choice, and the page says which is cheaper
    $('#tk-d2p', root).hidden = !d2; setRadio('tk-dp', S.dp ? '1' : '0'); $('#tk-dpw', root).textContent = money(wkP); $('#tk-dpd', root).textContent = money(ddP);
    var dn = $('#tk-dpnote', root); dn.hidden = !d2 || wkP === ddP; dn.textContent = wkP < ddP ? 'Weekend parking is cheaper: ' + money(wkP) + ' against ' + money(ddP) + ' for the two day passes. Both get you in and out on Saturday and Sunday.' : 'The two day passes are cheaper: ' + money(ddP) + ' against ' + money(wkP) + ' for Weekend parking.';
    $('#tk-size', root).hidden = dayOnly || (d2 && S.dp);
    $$('[data-c]', root).forEach(function (b) { b.textContent = sold(b.getAttribute('data-c')) ? 'Sold out' : money(PS(b.getAttribute('data-c'))); });
    $$('input[name="tk-big"]', root).forEach(function (i) { i.disabled = sold(i.value === '1' ? 'opark' : 'wpark'); });
    $('#tk-carstep', root).hidden = false;
    var t = totals(S), ready = t.ready, go = goLabel(t);
    try { entrySide(); } catch (x) {}
    var bar = $('#tk-bar', root); bar.hidden = !ready; $('#tk-main', root).classList.toggle('has-bar', ready);
    if (ready) {
      $('#tk-bart', root).textContent = short(S); $('#tk-barfee', root).textContent = w === 'sale' ? 'See the order' : money(t.total) + ' · see the order';
      var bg = $('#tk-bargo', root), bs = $('#tk-barsum', root), bo = $('#tk-barok', root), sv = w === 'pre' && saved();
      bg.textContent = go.t; bg.className = 'tk-pill ' + go.c; bg.hidden = bs.hidden = sv || w === 'closed'; bo.hidden = !sv; if (sv) $('span', bo).textContent = 'Order saved on this device. It will be here, ready to pay, on ' + T.show.dayS + '.';
      if (w === 'closed') bar.hidden = true;
      $('#tk-live', root).textContent = short(S) + '. Total ' + money(t.total) + ', fee included.';
    } else $('#tk-live', root).textContent = '';
    $('#tk-lines', root).innerHTML = ready ? olines(t) : '<li class="tk-order-empty">' + (k && !S.adult ? (kind(S.pass) === 'day' ? 'Add someone 13 or older to see your total.' : 'Add an adult to see your total.') : S.pass === 'd1' && !S.day ? 'Pick your day. Your total builds here, fee included.' : S.pass === 'none' ? 'Add camping, parking, meals or extras. Your total builds here, fee included.' : 'Pick a ticket, or Add-ons only. Your total builds here, fee included.') + '</li>';
    $('#tk-otot', root).hidden = $('#tk-ofine', root).hidden = !ready; $('#tk-ototv', root).textContent = money(t.total);
    var op = $('#tk-oplan', root); op.hidden = !(ready && hasPlan(t)); op.textContent = hasPlan(t) ? 'Or pay over time: ' + planLine(t.total) + '.' : '';
    var og = $('#tk-ogo', root); og.hidden = !ready; og.textContent = go.t; og.className = 'tk-pill ' + go.c; if (go.off) og.setAttribute('aria-disabled', 'true'); else og.removeAttribute('aria-disabled');
    guard(root);
  }
  function live(m) { var l = root && $('#tk-live', root); if (l) l.textContent = m; }
  /* "Add a different pass": the pass being built joins the order and the cards are free for the next one (Zale, Nov 13: one checkout) */
  function addPass() {
    if (!gok(S) || S.pass === 'none') return;
    var g = cleanG(S), M = S.more || [], same = M.filter(function (x) { return gkey(x) === gkey(g) && x.wed === g.wed; })[0];
    if (same) { same.adult = Math.min(12, same.adult + g.adult); same.teen = Math.min(12, same.teen + g.teen); same.kid = Math.min(12, same.kid + g.kid); } else M.push(g);
    S.more = M; S.pass = null; S.day = null; S.adult = 1; S.teen = 0; S.kid = 0; S.wed = false;
    update(); live('Added to your order. Pick the next pass.');
    var el = $('#tk-grps', root); if (el) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) { el.scrollIntoView(); } }
  }
  /* jump row and deep links (#tickets/camping, /parking, /meals, /extras, /addons): straight to what an expert came for */
  var JMP = { camping: 'tk-s-sleep', parking: 'tk-s-go', meals: 'tk-x-meals', extras: 'tk-s-extra', passes: 'tk-passes' };
  function jump(sec) {   /* Zale, Nov 15: the old order list is gone; every link opens the guided steps at the right step */
    if (!root || !when || when() !== 'sale') return;
    if (sec === 'addons') { addonsOnly(); return; }
    guide(sec === 'camping' || sec === 'parking' ? 'sleep' : sec === 'meals' || sec === 'extras' ? 'order' : 'days');
  }
  var DLRX = /^#\/?tickets\/(camping|parking|meals|extras|addons|passes)\b/, hash0 = window.location.hash || '', deep0 = DLRX.test(hash0);   // the site's router rewrites the address to #/tickets, so the section is read as the page loads
  function deepLink(h) { var m = DLRX.exec(h || window.location.hash || ''), n = 0; if (!m) return;
    (function wait() { if (root && root.firstChild && document.getElementById('tk-main')) { setTimeout(function () { jump(m[1]); }, 150); return; } if (++n < 60) setTimeout(wait, 150); })(); }   // the page may still be drawing on a slow phone
  /* "New to Pickathon?" (Zale, Nov 13): many buyers search straight to Tickets and see nothing else, so the page carries Home's idea in one
     sheet: the ranked Discoveries (the same pool and order as Home's Who's up next), three facts a first-timer buys on, and back to the passes. */
  function shortLine(t) { t = String(t || '').trim(); if (t.length <= 118) return t; var S1 = t.match(/[^.!?]+[.!?]+(?=\s|$)/g) || []; for (var i = 0; i < S1.length; i++) if (S1[i].trim().length <= 118) return S1[i].trim(); return ''; }
  function discoveries() {
    var pool = []; try { pool = window.__pkArchPool ? window.__pkArchPool() : []; } catch (e) { pool = []; }
    var d = site().data || {}, PV = d.preview || {}, V = {}; (d.videos || []).forEach(function (x) { if (!x) return; if (x.vm) V['vm' + x.vm] = x; else if (x.id) V['yt' + x.id] = x; });
    return pool.filter(function (a) { return a.cat === 'music' && a.ctk === 'disc' && !a.dc && !a.leg && a.line; }).map(function (a) {
      var pv = PV[a.n], img = (pv && String(pv.y) === String(a.yr) && pv.i) || a.img || (pv && pv.i) || '', u = a.vu || '';
      var m = /[?&]v=([\w-]+)/.exec(u) || /youtu\.be\/([\w-]+)/.exec(u), m2 = /vimeo\.com\/(\d+)/.exec(u), r = m ? V['yt' + m[1]] : m2 ? V['vm' + m2[1]] : null;
      var ok = !!u && !(r && r.f) && /^Watch/.test(a.vt || '') && !/spotify/.test(u);   // single songs only, never a full set (as on Home)
      return { n: a.n, y: String(a.yr || ''), line: shortLine(a.line), img: img, vu: ok ? u : '', m: a.m, k: 'disc', c: a.cf, g: a.g || '' };
    }).filter(function (a) { return a.img && a.line; }).sort(window.pkRankCmp || function () { return 0; });
  }
  var RING = '<span class="tk-ring" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M8.5 5.5 L19 12 L8.5 18.5 Z"/></svg></span>';
  function why() {
    var L = discoveries().slice(0, 8), H = (site().data || {}).hoods || {}, y0 = +((L[0] || {}).y || 0), pyr = (y0 >= 2000 && y0 <= 2019) || (y0 >= 2022 && y0 <= 2026) ? String(y0).slice(2) : '13', hood = ['woods', 'galaxybarn', 'galaxy', 'paddock', 'treeline'].map(function (k) { return H[k]; }).filter(function (o) { return o && (o.hi || o.i); })[0];
    var cards = L.map(function (a, i) { return '<li class="tk-dc"><button type="button" class="tk-dc-ph" data-dc="' + i + '"' + (a.vu ? ' aria-label="Watch ' + esc(a.n) + ', Pickathon ' + esc(a.y) + '"' : ' tabindex="-1" aria-hidden="true" disabled') + '><img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async">' + (a.vu ? RING : '') + '</button>' +
      '<p class="tk-dc-k"><span>Discovery</span><span>Pickathon ' + esc(a.y) + '</span></p><p class="tk-dc-n">' + esc(a.n) + '</p><p class="tk-dc-l">' + esc(a.line) + '</p></li>'; }).join('');
    /* the four beats of Home's funnel, in its order (Zale, Nov 13): the promise, Who's up next (artist proof), the posters re-ordered (past proof), the city */
    var sh = sheet(sheetTop('New to Pickathon?') +
      '<p class="tk-why-l"><b>Your new favorite band is playing. You just haven’t met them yet.</b></p>' +
      (cards ? '<p class="tk-why-h">Who’s up next?</p><p class="tk-why-s">Nobody knew these names when they first played here.</p><ul class="tk-dcs" aria-label="Discoveries, biggest today first">' + cards + '</ul>' : '') +
      '<div class="tk-why-2">' +
      '<button type="button" class="tk-why-t" data-why="poster"><img src="i/y' + pyr + '-poster.webp" alt="" loading="lazy"><span class="tk-why-tx"><b>The posters, re-ordered</b><span>The small print then is the headliners now.</span><em>See it on Home</em></span></button>' +
      '<button type="button" class="tk-why-t" data-why="hoods">' + (hood ? '<img src="' + esc(hood.hi || hood.i) + '" alt="" loading="lazy">' : '') + '<span class="tk-why-tx"><b>Live inside a temporary city of wonder</b><span>Hand-built stages and camps on a forest farm.</span><em>Explore the neighborhoods</em></span></button>' +
      '</div>' +
      '<div class="tk-help-f"><p><b class="tk-d">Two sets</b>every act, on two stages</p><p><b class="tk-d">Camping</b>with weekend passes</p><p><b class="tk-d">Kids free</b>12 and under</p></div>' +
      '<button type="button" class="tk-pill tk-pill-gold tk-sheet-go" data-close>Pick a ticket</button>', 'New to Pickathon?');
    sh.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-why]') : null;
      if (t) { var w = t.getAttribute('data-why'), A = app(); closeSheet(true); if (!A) return;   // the order is kept on this device, so leaving loses nothing
        if (w === 'hoods') { if (window.__pkGoFarm) window.__pkGoFarm(); else A.go('hoods'); return; }
        A.go('home'); setTimeout(function () { var m = document.querySelector('.pk-cl-mount'); if (m) { try { m.scrollIntoView({ block: 'start' }); } catch (x) {} } }, 500); return; }
      var b = e.target.closest ? e.target.closest('[data-dc]') : null; if (!b) return; var a = L[+b.getAttribute('data-dc')]; if (!a || !a.vu) return;
      try { if (window.__pkPlayVid) window.__pkPlayVid(a.vu, a.n + ' · Pickathon ' + a.y); } catch (x) {} });
  }
  function goLabel(t) { var w = when(); if (w === 'sale') return { t: 'Checkout · ' + money(t.total), c: 'tk-pill-gold' }; if (w === 'pre') return saved() ? { t: 'Saved for ' + T.show.dayS, c: 'tk-pill-cream', off: true } : { t: 'Save for ' + T.show.dayS, c: 'tk-pill-cream' }; return { t: 'Not on sale right now', c: '', off: true }; }
  function orderSheet() {
    var t = totals(S), go = goLabel(t);
    sheet(sheetTop('Your order') + '<div class="tk-paper tk-osheet"><ul class="tk-olines">' + olines(t) + '</ul><p class="tk-otot"><span>Total</span><b class="tk-num">' + money(t.total) + '</b></p>' +
      (hasPlan(t) ? '<p class="tk-oplan">Or pay over time: ' + planLine(t.total) + '.</p>' : '') + '<p class="tk-fine"><b>All sales final.</b> Send a pass to a friend any time from My Pickathon.</p></div>' +
      '<button type="button" class="tk-pill ' + go.c + ' tk-sheet-go" data-sheetgo>' + go.t + '</button><p class="tk-g-links"><span></span><button type="button" class="tk-tlink" data-sheetedit>Change my order →</button></p>', 'Your order');
    $('[data-sheetedit]', scrim).addEventListener('click', function () { closeSheet(true); guide('days'); });
    $('[data-sheetgo]', scrim).addEventListener('click', function () { closeSheet(true); proceed(); });
    scrim.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('[data-act="gift-edit"]') : null; if (b) { closeSheet(true); giftForm(+b.getAttribute('data-i')); } });
  }
  /* help me choose: Pick sets the pass and nothing else */
  function checkout() {
    if (when() !== 'sale') return;   /* Round 4: nothing is sent to checkout until the WordPress sale switch is on */
    var o = order(); if (!o.ready) return;
    if ((window.PK_TICKETS || {}).checkoutPreview && window.__pkCheckout) { window.__pkCheckout.open(o); return; }
    handoff(o);
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
    if (n === 'tk-pass') { S.pass = t.value; if (t.value !== 'p4') S.wed = false; if (t.value !== 'd1') S.day = null; if (t.value === 'none') { S.teen = 0; S.kid = 0; } }
    else if (n === 'tk-pday') S.pday = t.value;
    else if (t.id === 'tk-pwrc') S.pwr = t.checked;
    else if (n === 'tk-day') S.day = t.value;
    else if (n === 'tk-sleep') S.sleep = t.value;
    else if (n === 'tk-go') S.go = t.value;
    else if (t.id === 'tk-wedc') S.wed = t.checked;
    else if (n === 'tk-big') S.big = t.value === '1';
    else if (n === 'tk-dp') S.dp = t.value === '1';
    else return;
    update();
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button,[data-go],[data-act]') : null; if (!b || !root.contains(b)) return;
    if (b.closest('#tk-entry') && entryClick(b)) return;
    var stp = b.getAttribute('data-step');
    if (stp) { var f = b.closest('.tk-step').getAttribute('data-k'); sv(f, Math.max(vmin(f), Math.min(vmax(f), gv(f) + (+stp)))); update(); return; }
    var jp = b.getAttribute('data-jump'); if (jp) { jump(jp); return; }
    var act = b.getAttribute('data-act'), go = b.getAttribute('data-go');
    if (act === 'feedretry') { noIds = false; tries = 0; window.pkFeed = { url: (window.pkFeed || {}).url, state: 'loading', byCode: null, at: Date.now() }; lastKey = ''; sync(); try { window.pkFeedLoad(function () { lastKey = ''; sync(); }); } catch (x) {} return; }
    if (go) { nav(go); return; }
    if (act === 'go') { proceed(); return; }
    if (act === 'sheet') { orderSheet(); return; }
    if (act === 'help') { guide('days'); return; }
    if (act === 'camps') { camps(); return; }
    if (act === 'why') { why(); return; }
    if (act === 'addpass') { addPass(); return; }
    if (act === 'gift') { giftForm(-1); return; }
    if (act === 'gift-edit') { closeSheet(true); giftForm(+b.getAttribute('data-i')); return; }
    if (act === 'rmgrp') { S.more.splice(+b.getAttribute('data-i'), 1); update(); live('Removed.'); var pc = $('#tk-passes', root); if (pc) { try { pc.scrollIntoView({ block: 'nearest' }); } catch (x) {} } return; }
    if (act === 'signin') { if (window.__pkAcct && window.__pkAcct.signIn) window.__pkAcct.signIn(); else nav('account'); return; }
    if (act === 'again') { var lo = null; try { lo = window.pkLastOrder(); } catch (x) {} if (lo) { S = clean(lo); b.textContent = 'Filled in'; b.disabled = true; update(); var bg = $('#tk-ogo', root); if (bg && bg.offsetParent) bg.focus(); else { bg = $('#tk-bargo', root); if (bg) bg.focus(); } } return; }
  }

  /* ---------- keeping in step with the app ---------- */
  function where(v) { try { if (v) window.sessionStorage.setItem(SSW, v); else window.sessionStorage.removeItem(SSW); } catch (e) {} }
  function stateKey() { var F = window.pkFeed || {}, lo = ''; try { lo = JSON.stringify(window.pkLastOrder() || '') + JSON.stringify(window.pkMyPasses() || ''); } catch (e) {} return [when(), T.show.id, T.col, T.show.isToday ? 1 : 0, T.plans ? 1 : 0, F.state, F.at, T.sameAgain ? 1 : 0, site().user ? 1 : 0, site().data ? 1 : 0, lo, textsOn() ? 1 : 0].join('|'); }
  function vars() {
    if (!root || !root.firstChild) return;
    var n = $('#root nav[aria-label="App"]'), hd = $('#root header'), inn = root;   /* Nov 16: was root.firstChild, which became the entry section, so the order bar lost the tab-bar offset and covered the tabs */
    inn.style.setProperty('--tk-tabs', (n ? n.offsetHeight : 0) + 'px');
    var hh = 96; try { if (hd && /sticky|fixed/.test(getComputedStyle(hd).position)) hh = hd.getBoundingClientRect().bottom; else hh = 0; } catch (e) {}
    inn.style.setProperty('--tk-hdr', Math.max(0, Math.round(hh)) + 'px');
  }
  /* QC Round 3.5: before prices show, ask whether a newer build is out (version.json); if one is and no order is in progress the page
     reloads on the same address, so a returning buyer never sees an old price. The prices wait at most 1.5 s for the answer. */
  function vcheck(el) {
    if (typeof window.pkBuildCheck !== 'function') return;
    el.classList.add('tk-vchk'); var done = function () { el.classList.remove('tk-vchk'); }, t = setTimeout(done, 1500);
    Promise.resolve(window.pkBuildCheck(false)).then(function (reloading) { if (!reloading) { clearTimeout(t); done(); } }, function () { clearTimeout(t); done(); });
  }
  var booting = true;
  function sync() {
    try { markHome(); } catch (e) {}
    var el = document.getElementById('tk2');
    if (!el) { root = null; if (!booting && !document.getElementById('pk-co')) where(''); return; }
    readTix(); var k = stateKey();
    var fresh = el !== root;
    if (el !== root || !el.firstChild || k !== lastKey) { lastKey = k; draw(el); }
    root = el; vars();
    if (fresh) vcheck(el);
    if (!booting) where(document.getElementById('pk-co') ? 'checkout' : 'tickets');
  }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); try { sync(); } catch (e) { if (window.console) console.error('pk-tk2', e); } return r; };
  window.addEventListener('resize', function () { try { vars(); } catch (e) {} });
  window.addEventListener('storage', function (e) { if (e.key === LS) { S = load(); try { update(); } catch (x) {} } });   // the same order open in two tabs stays one order
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { sync(); } catch (e) {} } });

  /* ---------- Round 5 (Zale, Nov 14–15): "Pick your days". New buyers tap the days they can come and the page names the ticket that fits;
     veterans take "I know what I want" to the full page (the fast lane). The guide only fills in the same order record S; prices, sold-out
     rules, totals and checkout are the page's own. ---------- */
  var GD = ['w', 'dthu', 'dfri', 'dsat', 'dsun'], GS = null, LSG = 'pk27g', GHERO = 'i/r3b-hood-cherryhill-3.jpg';
  function gCover(k) { return k === 'p4' || k === 'pat' ? OK.day.slice() : k === 'p3' ? ['dfri', 'dsat', 'dsun'] : k === 'd2' ? ['dsat', 'dsun'] : []; }
  function gPlan(q) {
    q = q || GS;
    if (q.pat) return sold('patron') ? { k: '', sold: true } : { k: 'pat', each: PS('patron'), name: N.pat, meta: 'Wed–Sun · ' + DAY.w[4] + '–' + DAY.dsun[4].split(' ')[1], why: 'Backstage, camping included. Any age, one per person.' };
    var sel = OK.day.filter(function (d) { return q.on[d]; }), wed = !!q.on.w;
    if (!sel.length && !wed) return null;
    var inside = function (ids) { return sel.every(function (d) { return ids.indexOf(d) >= 0; }); }, opts = [];
    if (!sold('p4')) opts.push({ k: 'p4', each: PS('p4') });
    if (!wed && inside(gCover('p3')) && !sold('p3')) opts.push({ k: 'p3', each: PS('p3') });
    if (!wed && inside(gCover('d2')) && !sold('d2')) opts.push({ k: 'd2', each: PS('d2') });
    if (!wed && sel.length && sel.every(function (d) { return !sold(d); })) opts.push({ k: 'days', days: sel.slice(), each: Math.round(sel.reduce(function (a, d) { return a + PS(d); }, 0) * 100) / 100 });
    if (!opts.length) return { k: '', sold: true };
    var p = opts[0]; opts.forEach(function (o) { if (o.each < p.each - 0.004) p = o; });   // the cheapest way to cover the days tapped; a pass wins a tie
    if (p.k === 'days') {
      p.name = sel.length === 1 ? N[sel[0]] : sel.length + ' day tickets';
      p.meta = sel.map(function (d) { return DAY[d][2] + ', ' + DAY[d][4]; }).join(' · ');
      p.why = 'Every stage, all day. No camping with day tickets.';
    } else {
      var cov = gCover(p.k), extra = cov.filter(function (d) { return sel.indexOf(d) < 0; }), a = cov[0], b = cov[cov.length - 1];
      p.name = N[p.k]; p.meta = DAY[a][2] + '–' + DAY[b][2] + ' · ' + DAY[a][4] + '–' + DAY[b][4].split(' ')[1];
      p.why = p.k === 'd2' ? 'Every stage, both days. No camping with day tickets.' : 'Camping included · every stage';
      if (wed) p.why = 'Wednesday arrival goes with the 4-Day Pass. Camping included.';
      else if (extra.length && sel.length) p.why = 'Costs less than ' + (sel.length === 1 ? 'that day ticket' : sel.length + ' day tickets') + ', and adds ' + extra.map(function (d) { return DAY[d][3]; }).join(' and ') + (p.k === 'd2' ? '.' : ' and camping.');
    }
    return p;
  }
  function gApply() {
    var p = gPlan(); if (!p || !p.k) return false;
    var a = GS.adult, keep = { sleep: S.sleep, go: S.go, x: S.x, car: S.car, sites: S.sites, pwr: S.pwr, big: S.big, dp: S.dp };
    S.more = (GS.keep || []).slice();
    if (p.k === 'days') { var ds = p.days.slice(), last = ds.pop(); ds.forEach(function (d) { if (S.more.length < 6) S.more.push(cleanG({ pass: 'd1', day: d, adult: a, teen: 0, kid: 0, wed: false })); }); S.pass = 'd1'; S.day = last; S.adult = a; S.teen = 0; S.kid = GS.kid; S.wed = false; }
    else { S.pass = p.k; S.day = null; S.adult = a; S.teen = kind(p.k) === 'wk' ? GS.teen : 0; S.kid = p.k === 'pat' ? 0 : GS.kid; S.wed = p.k === 'p4' && !!GS.on.w; }
    Object.keys(keep).forEach(function (k) { S[k] = keep[k]; });
    if (!gCamps() && VEH.test(S.sleep)) S.sleep = 'tent';
    S = clean(S); save(); update(); return true;
  }
  function gCamps() { return kind(S.pass) === 'wk' || S.pass === 'pat'; }
  function gNone() { return S.pass === 'none'; }
  function addonsOnly(sleepId) {   /* already has a pass: add camping, parking, meals only */
    S.pass = 'none'; S.more = []; S.day = null; S.adult = 1; S.teen = 0; S.kid = 0; S.wed = false; if (sleepId) S.sleep = sleepId; S = clean(S); save(); update();
    if (GS) { GS.keep = []; GS.step = 'sleep'; gDraw(true); } else { guide('sleep'); }
  }
  function gFromOrder() {
    var on = {}, k = S.pass;
    if (k === 'd1') { groups(S).forEach(function (g) { if (g.pass === 'd1' && g.day) on[g.day] = true; }); }
    else gCover(k).forEach(function (d) { on[d] = true; });
    if (k === 'p4' && S.wed) on.w = true;
    return { step: 'days', on: on, pat: k === 'pat', adult: S.pass && S.pass !== 'none' ? Math.max(1, S.adult) : 1, teen: kind(k) === 'wk' ? S.teen : 0, kid: k === 'pat' ? 0 : S.kid };
  }
  function gStepper(k, label, sub, n, min) {
    return '<div class="tk-g-r"><p><b>' + label + '</b><span>' + sub + '</span></p><div class="tk-g-stp"><button type="button" data-g="step" data-k="' + k + '" data-d="-1" aria-label="One fewer, ' + esc(label) + '"' + (n <= min ? ' disabled' : '') + '>−</button><b aria-live="polite">' + n + '</b><button type="button" data-g="step" data-k="' + k + '" data-d="1" aria-label="One more, ' + esc(label) + '">+</button></div></div>';
  }
  /* Round 3 (Zale, Nov 23 22:14: match the Nov 22 drafts): "Everyone on the same days", on by default. Off: one row per person 13 and up,
     each with its own day strip; people on the same days share one pass. Kids 12 and under come free with the first pass. */
  function gPeople() {
    var L = GS.ppl || [], want = GS.adult + (kind(S.pass) === 'wk' || GS.teenSplit ? GS.teen : 0), i;
    for (i = 0; i < GS.adult + GS.teen; i++) { var t = i < GS.adult ? 'a' : 't'; if (!L[i]) L[i] = { t: t, on: Object.assign({}, GS.on) }; L[i].t = t; }
    L.length = GS.adult + GS.teen; GS.ppl = L; return L;
  }
  function gSplit() {   /* the people's day sets, grouped; null when a teen has no adult on the same days */
    var sets = {}, order = [];
    gPeople().forEach(function (p) { var k = OK.day.filter(function (d) { return p.on[d]; }).join(','); if (!k) return; if (!sets[k]) { sets[k] = { on: {}, a: 0, t: 0 }; OK.day.forEach(function (d) { if (p.on[d]) sets[k].on[d] = 1; }); order.push(k); } sets[k][p.t]++; });
    var out = [], bad = false;
    order.forEach(function (k) { var x = sets[k], p = gPlan({ on: x.on, pat: false }); if (!p || !p.k) { bad = true; return; }
      if (p.k === 'days') p.days.forEach(function (d) { out.push({ pass: 'd1', day: d, adult: x.a + x.t, teen: 0, kid: 0 }); });
      else { if (!x.a && x.t) bad = true; out.push({ pass: p.k, day: null, adult: x.a, teen: kind(p.k) === 'wk' ? x.t : 0, kid: 0 }); if (kind(p.k) !== 'wk' && x.t) out[out.length - 1].adult += x.t; } });
    if (bad || !out.length || out.length > 6) return null;
    out[0].kid = GS.kid; return out;
  }
  function gApplySplit() {
    var G = gSplit(); if (!G) return false;
    var keep = { sleep: S.sleep, go: S.go, x: S.x, car: S.car, sites: S.sites, pwr: S.pwr, big: S.big, dp: S.dp }, f = G[0];
    S.more = G.slice(1).map(cleanG); S.pass = f.pass; S.day = f.day; S.adult = f.adult; S.teen = f.teen; S.kid = f.kid; S.wed = false;
    Object.keys(keep).forEach(function (k) { S[k] = keep[k]; }); if (!gCamps() && VEH.test(S.sleep)) S.sleep = 'tent';
    S = clean(S); save(); update(); return true;
  }
  function gWhoSplitHTML() {
    var L = gPeople(), nA = 0, nT = 0;
    var h = '<div class="tk-g-ppl">' + L.map(function (p, i) { var lab = p.t === 'a' ? 'Adult ' + (++nA) : 'Teen ' + (++nT);
      return '<div class="tk-g-pr"><p><b>' + lab + '</b></p><span class="tk-g-pdays" role="group" aria-label="' + lab + ' days">' + OK.day.map(function (d) { return '<button type="button" class="tk-g-pd" data-g="pd" data-i="' + i + '" data-d="' + d + '" aria-pressed="' + (p.on[d] ? 'true' : 'false') + '"' + (sold(d) && sold('p4') ? ' disabled' : '') + '>' + DAY[d][2] + '</button>'; }).join('') + '</span></div>'; }).join('') + '</div>';
    if (!gSplit()) h += '<p class="tk-g-note">Give everyone at least one day. Teens need an adult on the same days.</p>';
    else if (GS.kid) h += '<p class="tk-g-note">Kids 12 and under come free with the first pass.</p>';
    return h;
  }
  function gStub(t, totalLabel) {
    return '<div class="tk-g-stub"><p class="tk-g-stubh"><b class="tk-d">Pickathon ' + YEAR + '</b><span>' + DAY.dthu[4] + '–' + DAY.dsun[4].split(' ')[1] + ' · Pendarvis Farm</span></p><span class="tk-g-strip" aria-hidden="true">' + DAYS.map(function (d, i) { return '<i class="' + (cover(S)[i] ? 'on' : '') + '">' + d[1] + '</i>'; }).join('') + '</span><ul class="tk-olines">' + olines(t) + '</ul><div class="tk-g-cut"></div><p class="tk-g-tot"><span>' + totalLabel + '</span><b class="tk-num">' + money(t.total) + '</b></p><p class="tk-g-stubf">Every act plays two sets on two stages</p></div>';
  }
  /* Nov 15 night: the steps carry Pickathon: a photo banner per step, the step count in words, and the order as a real ticket stub */
  var GBAN = { 1: ['', GHERO, '62% 22%'], 2: ['coyote', 'i/r35-grove-1.jpg', '50% 62%'], 3: ['wildcamp', 'i/r3-hood-lushcamp.jpg', '50% 70%'], 4: ['galaxy', 'i/r3-hood-woods.jpg', '50% 30%'] };
  /* Round 2 (Zale, Nov 22-23): the steps by name. Done steps are buttons back to that step; the current one is gold. */
  function gBar(n) {
    var keys = ['days', 'who', 'sleep', 'order'], names = ['Days', 'Who', gCamps() || gNone() ? 'Sleep' : 'Getting there', 'Order'];
    return '<ol class="tk-g-bar" aria-label="Step ' + n + ' of 4">' + names.map(function (nm, i) {
      var k = i + 1, cur = k === n;
      return '<li' + (cur ? ' class="on" aria-current="step"' : k < n ? ' class="done"' : '') + '>' + (k < n && !(gNone() && k < 3) ? '<button type="button" data-g="go" data-to="' + keys[i] + '">' + nm + '</button>' : '<span>' + nm + '</span>') + '</li>';
    }).join('') + '</ol>';
  }
  function gTop(n) {
    var H = (site().data || {}).hoods || {}, b = GBAN[n] || GBAN[1], o = b[0] && H[b[0]], img = (o && (o.hi || o.i)) || b[1];
    return '<div class="tk-g-top tk-g-ban"><img class="tk-g-banimg" src="' + esc(img) + '" alt="" style="object-position:' + b[2] + '"><span class="tk-g-bansh"></span>' + logo() + '' + '<button type="button" class="tk-sheet-x" data-g="fast" aria-label="Close">' + ic('x') + '</button>' + (n ? gBar(n) : '') + '</div>'; }
  function gFoot(label, act, back, off) { return '<div class="tk-g-foot">' + (back ? '<button type="button" class="tk-g-back" data-g="go" data-to="' + back + '" aria-label="Back">←</button>' : '') + '<button type="button" class="tk-g-btn" data-g="next" data-to="' + act + '"' + (off ? ' disabled' : '') + '>' + label + '</button></div>'; }
  function gDaysHTML(q, bare) {
    var p = gPlan(q), h = '<div class="tk-g-days" role="group" aria-label="Festival days">' +
      GD.map(function (d) { var so = d === 'w' ? off('early') || sold('p4') : sold(d) && sold('p4'); return '<button type="button" class="tk-g-day" data-g="day" data-d="' + d + '" aria-pressed="' + (!q.pat && q.on[d] ? 'true' : 'false') + '"' + (so ? ' disabled' : '') + '><b class="tk-d">' + DAY[d][2] + '</b><span>' + DAY[d][4] + '</span>' + (d === 'w' ? '<em>Early arrival</em>' : '') + '</button>'; }).join('') + '</div>';
    if (!p) h += '<p class="tk-g-hint">Not sure? Most people come Friday to Sunday.</p>';
    else if (!p.k) h += '<p class="tk-g-hint">Those days are sold out. Try other days.</p>';
    else {
      h += '<p class="tk-g-k">Your ticket</p><div class="tk-g-stub tk-g-one" aria-live="polite"><div><p class="tk-d tk-g-name">' + esc(p.name) + '</p><p class="tk-g-meta">' + esc(p.meta) + '<br>' + esc(p.why) + '</p></div><p class="tk-g-price tk-num">' + money(p.each) + '<small>' + (p.k === 'pat' ? 'per person' : p.k === 'days' || p.k === 'd2' ? 'ages 13 and up' : 'per adult') + ', fee included</small></p></div>';
      if (p.k === 'p3' && !sold('p4')) h += '<button type="button" class="tk-g-nudge" data-g="add" data-d="dthu"><span>Add Thursday</span><b>+ ' + money(PS('p4') - PS('p3')) + ' · 4-Day Pass</b></button>';
      else if (p.k === 'd2' && !sold('p3')) h += '<button type="button" class="tk-g-nudge" data-g="add" data-d="dfri"><span>Add Friday and camping</span><b>+ ' + money(PS('p3') - PS('d2')) + ' · 3-Day Pass</b></button>';
      else if (p.k === 'p4' && !q.on.w && !off('early')) h += '<button type="button" class="tk-g-nudge" data-g="add" data-d="w"><span>Arrive Wednesday</span><b>+ ' + money(PS('early')) + ' each</b></button>';
    }
    if (bare) return h;
    return h + '<p class="tk-g-k tk-g-k2">Been before?</p><div class="tk-g-vet"><button type="button" class="tk-pill" data-g="addons">Add-ons for a pass I have</button>' + (sold('patron') ? '' : '<button type="button" class="tk-pill" data-g="pat" aria-pressed="' + (q.pat ? 'true' : 'false') + '">' + (q.pat ? 'Not Patron: pick days' : 'Patron Pass · backstage') + '</button>') + '</div>';
  }
  function gDayTap(q, a, d) {   /* the same day rules on the page and in the sheet */
    if (a === 'day') { q.pat = false; q.on[d] = !q.on[d]; if (d === 'w' && q.on.w) OK.day.forEach(function (x) { q.on[x] = true; }); if (d !== 'w' && !q.on[d]) q.on.w = false; return true; }
    if (a === 'add') { q.on[d] = true; if (d === 'w') OK.day.forEach(function (x) { q.on[x] = true; }); return true; }
    if (a === 'pat') { q.pat = !q.pat; return true; }
    return false;
  }
  function gHTML() {
    var st = GS.step, h = '', p, t, w = when();
    if (st === 'days') {
      p = gPlan();
      h += gTop(1) + '<div class="tk-g-pad"><h2 class="tk-d" tabindex="-1">Which days?</h2><p class="tk-g-sub">Tap the days you want. We’ll find the ticket that fits.</p>' + gDaysHTML(GS) + '</div>';
      return h + gFoot('Next: who’s coming', 'who', '', !p || !p.k);
    }
    t = totals(S);
    if (st === 'who') {
      var kd = kind(S.pass);
      h += gTop(2) + '<div class="tk-g-pad"><h2 class="tk-d" tabindex="-1">Who’s coming?</h2><p class="tk-g-sub">' + (kd === 'pat' ? 'A Patron Pass is for any age, one per person.' : kd === 'wk' ? 'Kids are free. Teens are half price on weekend passes.' : 'Day tickets are one price for ages 13 and up. Kids are free.') + '</p><div class="tk-g-who">' +
        gStepper('adult', kd === 'pat' ? 'People' : kd === 'wk' ? 'Adults' : 'Ages 13 and up', kd === 'pat' ? 'Any age · ' + money(PS('patron')) : kd === 'wk' ? '18 and up · ' + money(PS(S.pass)) : 'One price for everyone', GS.adult, 1) +
        (kd === 'wk' && !sold('teen') ? gStepper('teen', 'Teens', '13–17 · ' + money(PS('teen')) + ', half the 4-Day', GS.teen, 0) : '') +
        (kd !== 'pat' ? (xpPick() === 'Family' ? gStepper('kid', 'Kids', '12 and under · free · <em class="tk-g-yp">You picked Family</em>', GS.kid, 0).replace('class="tk-g-r"', 'class="tk-g-r tk-g-hl"') : gStepper('kid', 'Kids', '12 and under · free', GS.kid, 0)) : '') + '</div>' + (kd !== 'pat' && GS.adult + GS.teen > 1 ? '<button type="button" class="tk-g-same" data-g="same" role="switch" aria-checked="' + (GS.same !== false ? 'true' : 'false') + '"><span class="tk-g-sw"></span>Everyone on the same days</button>' + (GS.same === false ? gWhoSplitHTML() : '') : '') + gStub(t, 'So far') + '</div>';
      return h + gFoot(gCamps() ? 'Next: where you’ll sleep' : 'Next: getting there', 'sleep', 'days', GS.same === false && !gSplit());
    }
    if (st === 'sleep') {
      var H = (site().data && site().data.hoods) || {}, im = function (id) { var o = H[id]; return o ? (o.hi || o.i) : ''; }, camp = gCamps() || gNone(), none = gNone(), veh = VEH.test(S.sleep);
      h += gTop(3) + '<div class="tk-g-pad"><h2 class="tk-d" tabindex="-1">' + (camp ? 'Where you’ll sleep' : 'Getting there') + '</h2>';
      if (camp) {
        h += '<p class="tk-g-sub">' + (none ? 'Add a camping spot to the pass you already have.' : 'Your pass comes with a tent spot in the woods.') + '</p>';
        var types = [['tent', 'Tent in the woods', 'Walk in and pick your spot', ['tent'], 'lushcamp'], ['car', 'Car camping', 'Sleep next to your car', ['wcar', 'scar'], 'willowcamp'], ['van', 'Camper van', 'A site for your van', ['wvan', 'svan'], 'southcamp'], ['rv', 'RV', 'A site for your RV', ['wrv', 'srv'], 'southcamp']];
        types.forEach(function (ty) {
          var ids = ty[3].filter(function (id) { return id === 'tent' ? !none : !off(id); }); if (!ids.length) return;
          var on = ids.indexOf(S.sleep) >= 0, pr = ty[0] === 'tent' ? '' : (ids.length > 1 ? 'from ' : '') + money(Math.min.apply(null, ids.map(PS)));
          h += '<div class="tk-g-card' + (on ? ' on' : '') + '">' + (im(ty[4]) ? '<img src="' + esc(im(ty[4])) + '" alt="" loading="lazy">' : '') + '<span class="tk-g-sh"></span>' + (ty[0] === 'tent' ? '<span class="tk-g-tag">Included</span>' : '') +
            '<button type="button" class="tk-g-pick" data-g="sleep" data-v="' + ids[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '"><span><b>' + ty[1] + '</b><span>' + ty[2] + '</span></span>' + (pr ? '<em class="tk-num">' + pr + '</em>' : '') + '</button></div>';
          if (on && ty[0] !== 'tent') {
            if (ids.length > 1) h += '<div class="tk-g-chips" role="group" aria-label="Which camp">' + ids.map(function (id) { return '<button type="button" class="tk-g-chip" data-g="sleep" data-v="' + id + '" aria-pressed="' + (S.sleep === id ? 'true' : 'false') + '">' + (id.charAt(0) === 'w' ? 'Willow Camp' : 'South Camp') + ' · ' + money(PS(id)) + '</button>'; }).join('') + '</div>';
            if (PWR[S.sleep] && !off(PWR[S.sleep])) h += '<div class="tk-g-chips"><button type="button" class="tk-g-chip" data-g="pwr" aria-pressed="' + (S.pwr ? 'true' : 'false') + '">Add power · ' + money(PS(PWR[S.sleep])) + '</button></div>';
            else if (/^s(van|rv)$/.test(S.sleep)) h += '<p class="tk-g-note">South Camp sites include power.</p>';
          }
        });
      }
      if (!veh) {
        h += '<p class="tk-g-k tk-g-k2">' + (camp ? 'And getting there' : 'How will you get there?') + '</p><div class="tk-g-chips tk-g-go" role="group" aria-label="Getting there">';
        var pks = parkIds(Object.assign({}, S, { go: 'drive' })).filter(Boolean), pk = pks.length && pks.every(function (x) { return !off(x); }), gos = [['drive', 'Drive and park', pk ? money(Math.round(pks.reduce(function (t0, x) { return t0 + PS(x); }, 0) * 100) / 100) + ' a car' + (pks.length > 1 ? ', ' + pks.length + ' days' : '') : ''], ['shuttle', 'Shuttle', !off('shuttle') ? money(PS('shuttle')) + ' each' : ''], ['bike', 'Bike', 'Free'], ['drop', 'Drop-off', 'Free'], ['later', 'Decide later', '']];
        gos.forEach(function (g) { if ((g[0] === 'drive' && !g[2]) || (g[0] === 'shuttle' && !g[2])) return; h += '<button type="button" class="tk-g-chip" data-g="goway" data-v="' + g[0] + '" aria-pressed="' + (S.go === g[0] ? 'true' : 'false') + '">' + g[1] + (g[2] ? ' · ' + g[2] : '') + '</button>'; });
        h += '</div>';
        if (none && S.go === 'drive') h += '<p class="tk-g-k tk-g-k2">Which day are you driving?</p><div class="tk-g-chips" role="group" aria-label="Parking day"><button type="button" class="tk-g-chip" data-g="pday" data-v="" aria-pressed="' + (!S.pday ? 'true' : 'false') + '">All weekend</button>' + OK.day.map(function (d) { return '<button type="button" class="tk-g-chip" data-g="pday" data-v="' + d + '" aria-pressed="' + (S.pday === d ? 'true' : 'false') + '">' + DAY[d][2] + '</button>'; }).join('') + '</div>';
      } else h += '<p class="tk-g-note">Your site is where you park. No parking pass needed.</p>';
      return h + '</div>' + gFoot('Next: your order', 'order', none ? 'days' : 'who');
    }
    /* order */
    var meals = MEALS.filter(function (id) { return xok(id, S); }), more = DISH.concat(GIVE).filter(function (id) { return !off(id); }), X = S.x || {}, go = goLabel(t), cim = ((site().data && site().data.hoods) || {}).curation;
    var xr = function (id) { return gStepper('x-' + id, esc(XN[id].replace('Curation · ', '')), money(PS(id)) + (MEAL[id] !== undefined ? ' a seat' : ''), X[id] || 0, 0); };
    h += gTop(4) + '<div class="tk-g-pad"><h2 class="tk-d" tabindex="-1">Your order</h2>' + gStub(t, 'Total, fee included') + (meals.length || more.length ? '<p class="tk-g-k tk-g-k2">Add to your weekend</p>' : '');
    if (meals.length) h += '<div class="tk-g-card tk-g-cur' + (xpPick() === 'Food' ? ' tk-g-hl' : '') + '">' + (cim ? '<img src="' + esc(cim.hi || cim.i) + '" alt="" loading="lazy">' : '') + '<span class="tk-g-sh"></span><div class="tk-g-pick"><span><b>Curation</b><span>A chef and a band at one long table</span></span></div></div><div class="tk-g-who tk-g-x">' + meals.map(xr).join('') + '</div>';
    if (more.length) h += '<details class="tk-g-more"><summary>Souvenir dishware and giving back</summary><div class="tk-g-who tk-g-x">' + more.map(xr).join('') + '</div></details>';
    h += (w === 'pre' ? '<p class="tk-g-note">Checkout opens ' + esc(T.show.isToday ? 'today' : T.show.dayS) + '. Save your order now and pay in one tap then.</p>' : '') +
      (window.pkGift && w === 'sale' && (giftable(S).length || (S.gifts || []).length) ? '<div class="tk-g-gift">' + giftsOk(S).map(function (g, i) { return '<p><span>' + giftLabel(g) + '</span><button type="button" class="tk-tlink" data-g="gift" data-i="' + i + '">Edit</button></p>'; }).join('') + (giftable(S).length ? '<button type="button" class="tk-pill tk-pill-sm" data-g="gift" data-i="-1">' + ((S.gifts || []).length ? 'Give another as a gift' : 'Give any of it as a gift') + '</button>' : '') + '</div>' : '') +
      '<p class="tk-g-links"><span></span>' + (S.pass !== 'none' ? '<button type="button" class="tk-tlink" data-g="another">Add a different pass →</button>' : '<button type="button" class="tk-tlink" data-g="go" data-to="days">I need a pass too →</button>') + '</p></div>';
    return h + gFoot(esc(go.t), 'pay', 'sleep', !!go.off || !t.ready);
  }
  function gDraw(focus) {
    if (!scrim || !GS) return; var box = $('.tk-sheet', scrim); if (!box) return;
    var sc = box.scrollTop; box.innerHTML = gHTML(); guard(scrim); box.setAttribute('data-step', GS.step);
    if (focus) { box.scrollTop = 0; var f = $('h2[tabindex]', box); if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} } } else box.scrollTop = sc;
  }
  function gSeen() { try { window.sessionStorage.setItem(LSG, '1'); } catch (e) {} }
  function guide(step, pre, add) {
    readTix(); GS = gFromOrder(); if (pre) { GS.on = Object.assign({}, pre.on); GS.pat = !!pre.pat; } GS.keep = (S.more || []).filter(function (g) { return !(S.pass === 'd1' && g.pass === 'd1'); });
    if (add) { var cg = cleanG(S); GS.keep = (S.more || []).slice(); if (gok(cg)) GS.keep.push(cg); GS.keep = GS.keep.slice(0, 5); GS.adult = 1; GS.teen = 0; GS.kid = 0; }   /* Nov 16: a second pass tile adds a pass type to the same order */ GS.step = step || 'days'; gSeen();
    if (pre && !gApply()) { GS = null; return; }
    var sh = sheet('', 'Pick your days', { modal: true }); sh.classList.add('tk-gscrim'); gDraw(true);
    sh.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-g]') : null; if (!b || b.disabled) return;
      var a = b.getAttribute('data-g'), d = b.getAttribute('data-d'), v = b.getAttribute('data-v'), k = b.getAttribute('data-k');
      if (a === 'fast') { GS = null; closeSheet(true); lastKey = ''; sync(); return; }
      if (a === 'addons') { addonsOnly(); return; }
      if (a === 'another') { var cur = cleanG(S), ks = (S.more || []).slice(); if (gok(cur)) ks.push(cur); GS.keep = ks.slice(0, 5); GS.on = {}; GS.pat = false; GS.adult = 1; GS.teen = 0; GS.kid = 0; GS.step = 'days'; gDraw(true); return; }
      if (a === 'same') { if (GS.same === false) { GS.same = true; gApply(); } else { GS.same = false; gPeople(); gApplySplit(); } gDraw(); return; }
      if (a === 'pd') { var pp = gPeople()[+b.getAttribute('data-i')]; if (pp) { pp.on[d] = !pp.on[d]; gApplySplit(); } gDraw(); return; }
      if (a === 'pday') { S.pday = v; S = clean(S); save(); update(); gDraw(); return; }
      if (a === 'go') { GS.step = b.getAttribute('data-to'); gDraw(true); return; }
      if (a === 'gift') { giftForm(+b.getAttribute('data-i'), function () { gDraw(); }); return; }
      if (gDayTap(GS, a, d)) { gDraw(); return; }
      if (a === 'next') {
        var to = b.getAttribute('data-to');
        if (to === 'pay') { var wn = when(); GS = null; closeSheet(true); lastKey = ''; sync(); proceed(); if (wn === 'pre') live('Order saved. Checkout opens ' + (T.show.isToday ? 'today' : T.show.dayS) + '.'); return; }
        if (to === 'who' && !gApply()) return;
        GS.step = to; gDraw(true); return;
      }
      if (a === 'step') {
        var n = +d;
        if (k.indexOf('x-') === 0) { if (!S.x) S.x = {}; sv(k, Math.max(0, Math.min(12, gv(k) + n))); S = clean(S); save(); update(); }
        else { GS[k] = Math.max(k === 'adult' ? 1 : 0, Math.min(k === 'adult' ? 20 : 10, GS[k] + n)); if (GS.same === false) { gPeople(); gApplySplit(); } else gApply(); }
        gDraw(); return;
      }
      if (a === 'sleep') { if (!v) return; S.sleep = v; if (!PWR[v]) S.pwr = false; S = clean(S); save(); update(); gDraw(); return; }
      if (a === 'pwr') { S.pwr = !S.pwr; S = clean(S); save(); update(); gDraw(); return; }
      if (a === 'goway') { S.go = v; S = clean(S); save(); update(); gDraw(); return; }
    });
  }
  window.addEventListener('pk-sale-switch', function () { try { readTix(); lastKey = ''; sync(); } catch (e) {} });   /* the WordPress sale switch answered: redraw */
  window.__pkTk2 = {
    refresh: function () { lastKey = ''; sync(); },
    order: order, record: function () { return clean(S); }, jump: jump, addPass: addPass, discoveries: discoveries, set: function (o) { S = clean(Object.assign({}, S, o || {})); save(); update(); }, clear: function () { S = clean(null); save(); update(); },
    guide: guide, guidePlan: function (on, pat) { var o = GS; GS = { on: on || {}, pat: !!pat }; var p = gPlan(); GS = o; return p; },
    gate: gate, lastBy: lastBy, sheet: sheet, closeSheet: closeSheet, guard: guard, sheetTop: sheetTop, ic: ic, esc: esc, money: money, where: where, days: DAYS
  };
  document.addEventListener('change', function (e) { if (root && root.contains(e.target)) onChange(e); });
  document.addEventListener('click', function (e) { if (root && root.contains(e.target)) onClick(e); });

  /* A reload or a tab the phone put to sleep comes back to where the buyer was: Tickets, or Checkout. A link ending #tickets opens Tickets too. */
  var back = ''; try { back = window.sessionStorage.getItem(SSW) || ''; } catch (e) {}
  var viaHash = /^#\/?tickets\b/.test(window.location.hash || '');
  function boot(n) {
    var a = app();
    if (!a || !a.state || !a.state.data) { if (n < 200) setTimeout(function () { boot(n + 1); }, 50); else booting = false; return; }
    try {
      var top = a.state.stack[a.state.stack.length - 1];
      if ((back || viaHash) && (!top || top.r === 'home')) a.go('tickets');
      booting = false; sync(); deepLink(hash0); hash0 = '';
      if (back === 'checkout' && (window.PK_TICKETS || {}).checkoutPreview && window.__pkCheckout && window.__pkCheckout.resume) window.__pkCheckout.resume();   // the preview sheet only comes back for staff
    } catch (e) { booting = false; }
  }
  window.addEventListener('hashchange', function () { if (/^#\/?tickets\//.test(window.location.hash || '') || /^#tickets\b/.test(window.location.hash || '')) { var a = app(); try { var top = a.state.stack[a.state.stack.length - 1]; if (top.r !== 'tickets') a.go('tickets'); } catch (e) {} deepLink(); } });
  try { sync(); } catch (e) {}
  boot(0);
})();
