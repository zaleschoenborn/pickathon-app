/* QA M1 (Nov 11): Home's poster opens on 2019 (founder spec, home_flow.md screen 2) and "Another year" walks the years by discovery strength, not at random:
   a Discovery climber before any other, then the climber's magnitude in that year's class table (yearBill m; the year's top Discovery if the climber has no row), then the size of the climb, then the newer year.
   pk-climb.js reads window.pkClimbOrder in rand(); the order cycles. */
window.pkClimbRank = function (C, dd) {
  var nk = function (x) { return String(x || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, ''); };
  var YB = (dd && dd.yearBill) || {}, R = [];
  Object.keys(C || {}).forEach(function (y) { var D = C[y]; if (!D || !D.clim || !D.labels || D.labels.length < 2) return;
    var bill = YB[y] || [], hit = bill.filter(function (b) { return nk(b.n) === nk(D.clim); })[0], top = 0;
    bill.forEach(function (b) { if (b.k === 'disc' && (b.m || 0) > top) top = b.m || 0; });
    R.push({ y: +y, d: hit ? (hit.k === 'disc' ? 1 : 0) : (top > 0 ? 1 : 0), m: hit && hit.m != null ? +hit.m : top, c: (+D.climFrom || 0) - (+D.climTo || 0) }); });
  R.sort(function (a, b) { return (b.d - a.d) || (b.m - a.m) || (b.c - a.c) || (b.y - a.y); });
  var order = R.map(function (r) { return r.y; }), y0 = order.indexOf(2019) >= 0 ? 2019 : (order.filter(function (y) { return y >= 2011 && y <= 2024; })[0] || order[0] || 2019);
  order = [y0].concat(order.filter(function (y) { return y !== y0; }));
  return { order: order, y0: y0 };
};
/* pk-home2: Home round 2 and the Tickets button (Nov 11 2026). Source: tools/home_r2/home2.js, spliced into index.html by tools/home_r2/build.py.
   Drawn into three islands the app's renderer leaves alone (data-pk-own):
     #pkh2    the Home page (template: r.home2). The old Home stays at ?old=home, the one before it at ?old=home0.
     #pk-tl2  the ticket line under the phone and tablet header (every page but Tickets and Checkout; on Home hidden while screen 1 is in view)
     #pk-tb2  the outline pill at the right of the desktop header (same rules)
   Every date, round name and price comes from window.pkTix() (the pk-ticket-settings block) and the live price feed, by the same rule the Tickets page uses.
   The Home poster is pk-climb (tools/climb_ladder): it mounts itself into .pk-cl-mount, plays once, Replay and Another year. This file only places it. */
(function () {
  'use strict';
  var YEAR = 2027, DATES = 'Aug 4–8, 2027', DAYSW = 'Thu–Sun, early arrival Wed', DAYSS = 'Thu–Sun, early arrival Wed';   /* Round 3 (A2): one date form sitewide */
  var LSR = 'pk27remind';
  /* "Another neighborhood" leads with the strong ones (design: home.html), then the rest in data order */
  var LEAD = ['cherryhill', 'woods', 'galaxy', 'windmill', 'market', 'coyote', 'paddock', 'lushcamp', 'grove', 'curation'];
  var KIND = { stage: 'Stage neighborhood', around: 'Gathering neighborhood', camp: 'Camping neighborhood' }, GROUPS = [['stage', 'Stage'], ['around', 'Gathering'], ['camp', 'Camping']];
  var HERO = 'i/318.jpg', ACT = 'i/pk-paddock-c11.jpg';   /* stand-ins until the photo director's picks for slots home.hero and home.act land (photo_slots.csv) */
  var QUOTE = ['You need to know about Pickathon.', 'USA Today'];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function app() { return window.comp || window.__pkApp || null; }
  function site() { var a = app(); return (a && a.state) || window.__pkSt || {}; }
  function route() { var s = site().stack || []; return (s[s.length - 1] || {}).r || ''; }
  function go(r, x) { var a = app(); if (a && a.go) a.go(r, x || {}); }
  function ls(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (e) {} return null; }
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 4 L16.6 12 L8 20 L6 18 L12 12 L6 6 Z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4 L20 12 L7 20 Z"/></svg>';
  /* the site styles every p and li inside main; class names containing "pk-kr" are its own opt-out (same guard as Tickets) */
  function guard(r) { if (r) $$('p,li,label', r).forEach(function (e) { e.classList.add('pk-krtk'); }); }

  /* ---------- the sale: one reading of pkTix, the same price rule as Tickets ---------- */
  var T = null;
  function readTix() { var s = site(); T = window.pkTix(s.today, s.season || 'off'); return T; }
  function P(id) { var f = window.pkFeedItem && window.pkFeedItem(id); if (f && f.price && typeof f.price.amount === 'number') return f.price.amount / 100; var r = T.prices[id]; return r ? Math.ceil(r[T.col]) : 0; }   // live feed if it answered, else the settings block, whole dollars (tk2.js P)
  function ordinal(k) { var v = k % 100; return k + (v > 10 && v < 14 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th')); }
  function pacific(t) { return String(t || '').replace(/\s*PT$/, ' Pacific'); }
  function passes() { try { var p = window.pkMyPasses && window.pkMyPasses(); return p && p.length ? p : null; } catch (e) { return null; } }
  function textsOn() { return !!((window.PK_SIGNUP || {}).layloEndpoint); }
  function reminded() { return !!ls(LSR) || !!site().nlDone; }
  /* the state of the Tickets button and of Home's two money buttons: pre (before the round opens), sale, has (passes bought), or null (nothing to sell) */
  function tix() {
    readTix(); var s = site(), from = money(P('p3'));
    var mp = passes();
    if (mp) { var q = mp[0], nm = String(q.name || 'Pass').replace(/ Pass$/, ''), qty = q.qty ? q.qty + ' × ' : '';
      return { w: 'has', line: '<b>Your passes</b> <span class="pk-tl2-d">· ' + esc(qty + nm) + '</span>', verb: 'Add extras', btn: 'Your passes', go: 'mine', cta: 'Your passes', side: [qty + (q.name || 'Pass'), 'Add parking, camping or a friend'], from: from }; }
    if ((s.season || 'off') !== 'off' || T.open) {
      var r = T.cur || T.show, end = r.endS ? 'Ends ' + r.endS + '.' : '';
      return { w: 'sale', line: '<b>' + esc(r.name) + '</b> <span class="pk-tl2-d">· from ' + from + (r.endS ? '<span class="pk-tl2-x"> · ends ' + esc(r.endS) + '</span>' : '') + '</span>', verb: 'Get tickets', btn: 'Get tickets', go: 'tickets', cta: 'Get tickets',
        side: [r.name, (r.id === 'holiday' && end ? String(end).replace(/\.\s*$/, '') + '. Prices go up after.' : end)], from: from };
    }
    if (T.next) {
      var n = T.next, day = n.isToday ? 'today' : n.dayS, dayL = n.isToday ? 'today' : String(n.dayL || '').replace(/^(\w{3})\w*/, '$1');
      return { w: 'pre', line: '<b>Tickets ' + esc(day) + '</b>' + (n.time ? '<span class="pk-tl2-x">, ' + esc(pacific(n.time)) + '</span>' : '') + ' <span class="pk-tl2-d">· from ' + from + '</span>', verb: 'Remind me', btn: 'Tickets ' + day, act: 'remind', cta: 'Remind me',
        side: ['Tickets open ' + dayL, pacific(n.time)], from: from };
    }
    return null;
  }
  function doTix(t) { if (!t) return; if (t.act === 'remind') remindSheet(); else go(t.go); }

  /* ---------- Remind me: one field, in place, on every page (sheet from the Tickets kit) ---------- */
  function remind(v) {   // one sign-up path for the whole site: the app's own handler (email to the Mailchimp list), same as Tickets
    var a = app(); if (!a) return 'Enter an email address.';
    try { a.setState({ nlEmail: v, nlErr: '', nlDone: false }); a.renderVals().nl.submit(); } catch (e) { return 'Enter an email address.'; }
    if (a.state.nlDone) { ls(LSR, '1'); return ''; }
    return a.state.nlErr || 'Enter an email address.';
  }
  function remindSheet() {
    var K = window.__pkTk2; if (!K || !K.sheet) { go('tickets'); return; }
    readTix(); var n = T.next || T.show, when = (n.isToday ? 'today' : (n.dayL || n.dayS)) + (n.time ? ' at ' + pacific(n.time) : '');
    var fn = textsOn() ? 'Email or mobile number' : 'Email address', one = textsOn() ? 'One message' : 'One email';
    var ok = function (to) { return '<p class="tk-pre-ok" role="status">' + K.ic('check') + '<span><b>You’re on the list.</b><br>' + one + (to ? ' to ' + esc(to) : '') + ' ' + (n.isToday ? '' : 'on ') + esc(when) + '.</span></p>' +
      '<div class="pkh2-rmn"><p>Want a head start? Build your order now and pay in one tap ' + (n.isToday ? 'when it opens' : 'on the ' + ordinal(parseInt(String(n.day).slice(8), 10))) + '.</p><button type="button" class="tk-pill tk-pill-sm" data-h2rm="save">Save my order</button></div>'; };
    var body = reminded() ? ok('') :
      '<div id="h2rm-ask"><p>Tickets open <b>' + esc(when) + '</b>. ' + one + ' when they do.</p><form class="tk-pre-f" id="h2rm-f" novalidate style="margin-top:14px"><label class="tk-vh" for="h2rm-i">' + fn + '</label>' +
      '<input class="tk-field" id="h2rm-i" type="text" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="' + fn + '" aria-describedby="h2rm-e" data-focus><button class="tk-pill tk-pill-gold" type="submit">Remind me</button></form>' +
      '<p class="tk-msg-err" id="h2rm-e" hidden role="alert">' + K.ic('info', 'tk-ic-sm') + '<span></span></p></div>';
    var sh = K.sheet(K.sheetTop('Remind me') + '<div class="pkh2-rm">' + body + '</div>', 'Remind me');
    sh.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-h2rm="save"]'); if (b) { K.closeSheet(true); go('tickets'); } });
    var f = $('#h2rm-f', sh); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var i = $('#h2rm-i', sh), er = $('#h2rm-e', sh), v = i.value.trim(), msg = v ? remind(v) : (textsOn() ? 'Enter an email or a mobile number.' : 'Enter an email address.');
      if (msg) { i.setAttribute('aria-invalid', 'true'); $('span', er).textContent = msg; er.hidden = false; i.focus(); return; }
      $('.pkh2-rm', sh).innerHTML = ok(v); K.guard(sh); var p = $('.tk-pre-ok', sh); if (p) { p.setAttribute('tabindex', '-1'); p.focus(); }
      syncAll();
    });
  }

  /* ---------- the Tickets button: phone/tablet line and desktop pill ---------- */
  var tucked = false;
  /* not on Tickets or Checkout; not in festival season (the app swaps its chrome then); the phone line also stays off the Places map, which hides the header to give the map the whole screen */
  function tixHidden(line) { var r = route(); return r === 'tickets' || !!document.getElementById('pk-co') || (site().season || 'off') === 'fest' || (line && r === 'hoods'); }
  function drawButtons() {
    var t = null; try { t = tix(); } catch (e) {}
    var off = !t || tixHidden(), offL = !t || tixHidden(true), home = !!document.getElementById('pkh2');
    var tl = document.getElementById('pk-tl2');
    if (tl) {
      tl.classList.add('pk-tl2w'); if (offL) tl.setAttribute('data-off', ''); else tl.removeAttribute('data-off');
      tl.classList.toggle('on-home', home); tl.classList.toggle('is-tucked', home && tucked);
      var hl = offL ? '' : '<button type="button" class="pk-tl2" data-h2tix="1"' + (home && tucked ? ' tabindex="-1"' : '') + '><span class="pk-tl2-t">' + t.line + '</span><span class="pk-tl2-go">' + esc(t.verb) + CHEV + '</span></button>';
      if (tl._h !== hl) { tl.innerHTML = hl; tl._h = hl; }
    }
    var tb = document.getElementById('pk-tb2');
    if (tb) {
      tb.classList.add('pk-tb2w'); if (off) tb.setAttribute('data-off', ''); else tb.removeAttribute('data-off');
      tb.classList.toggle('is-tucked', home && tucked);
      var hb = off ? '' : '<button type="button" class="pk-tb2" data-h2tix="1"' + (home && tucked ? ' tabindex="-1"' : '') + '>' + esc(t.btn) + '</button>';
      if (tb._h !== hb) { tb.innerHTML = hb; tb._h = hb; }
    }
  }

  /* ---------- Home ---------- */
  var root = null, built = '', cur = null, io = null, D = null;
  function data() { return site().data || null; }
  function hoodIds(d) { return Object.keys(d.hoods || {}).filter(function (k) { return !d.hoods[k].vip && KIND[d.hoods[k].k]; }); }
  function hoodImg(d, k) { var L = (window.pkNBHM || {})[k] || []; return L[0] || d.hoods[k].i || ''; }   /* the curated Home photo for that neighborhood (NBHM in the app), else its lead photo */
  function ctaHTML(t, big) {
    if (!t) return '';
    var cls = 'h2-pill h2-gold' + (big ? ' h2-big' : '');
    return '<button type="button" class="' + cls + '" data-h2tix="1">' + esc(t.cta) + '</button>';
  }
  function skeleton(d) {
    var t = null; try { t = tix(); } catch (e) {}
    var ids = hoodIds(d), cnt = function (g) { return ids.filter(function (i) { return d.hoods[i].k === g; }).length; };
    var h = '';
    /* 1 PROMISE */
    h += '<section class="h2-s h2-s1" aria-labelledby="h2-h1"><div class="h2-s1ph" data-slot="home.hero"><img src="' + HERO + '" alt="A band on a hand-built stage at night, the crowd close in front" width="2000" height="1334" fetchpriority="high" loading="eager" decoding="async"></div>' +
      '<h1 class="h2-d h2-hero pkp-head" id="h2-h1"><span>Your new favorite band</span><span>is playing.</span><span>You just haven’t</span><span>met them yet.</span></h1>' +
      '<div class="h2-s1b"><p class="h2-lead">Four days of music on a forest farm in Happy Valley, Oregon.</p>' +
      '<div class="h2-paper h2-band"><div class="h2-band-m"><p class="h2-d h2-band-d pkp-head">' + DATES + '</p><p class="h2-band-w">' + DAYSW + '</p></div>' +
      '<div class="h2-band-p"><small>3-Day Pass from</small><b class="h2-num" data-h2="from">' + (t ? t.from : '') + '</b><small>camping included</small></div></div>' +
      '<div class="h2-cta" data-h2="cta1"></div></div></section>';
    /* 2 PROOF: pk-climb draws the poster into .pk-cl-mount by itself */
    /* design_studio-18 / home_flow.md: Home picks the poster's year once per visit from the Discovery years (2011-2024 with a climber),
       as the old Home did, so the poster never opens on a year with nothing to watch. */
    try { if (window.pkClimbRank && window.pkClimb) { var RK = window.pkClimbRank(window.pkClimb, d); window.pkClimbOrder = RK.order; if (!window.pkClimbY0 || window.pkClimbY0 !== RK.y0) window.pkClimbY0 = RK.y0; } } catch (e) {}
    h += '<section class="h2-s h2-s2" aria-labelledby="pk-cl-h"><div class="h2-s2in"><div class="pk-cl-mount"></div>' +
      '<div class="h2-strip" data-h2="strip" data-none><button type="button" class="h2-strip-ph" data-h2="wph" tabindex="-1" aria-hidden="true"><img alt="" loading="lazy" decoding="async"></button>' +
      '<div class="h2-strip-t"><button type="button" class="h2-pill h2-watch" data-h2="wbtn">' + PLAY + '<span></span></button><p class="h2-strip-c"><b data-h2="wa"></b> <span data-h2="wc"></span></p></div></div></div></section>';
    /* 3 PLACE */
    h += '<section class="h2-s h2-s3" aria-labelledby="h2-h3">' +
      '<button type="button" class="h2-hood" data-h2="hood"><img class="h2-hood-ph" data-h2="hph" alt="" loading="lazy" decoding="async"><span class="h2-hood-c"><img data-h2="hem" alt="" width="44" height="44" loading="lazy"><span class="h2-hood-t"><span class="h2-d h2-hood-n pkp-head" data-h2="hn"></span><span class="h2-hood-k" data-h2="hk"></span><span class="h2-hood-tag" data-h2="htag"></span></span><span class="h2-hood-go">Explore →</span></span></button>' +
      '<div class="h2-s3l"><div class="h2-s3head"><h2 class="h2-d h2-sec pkp-head" id="h2-h3">Live inside a temporary city of wonder</h2><p class="h2-sub h2-s3sub">' + (ids.length === 20 ? 'Twenty' : ids.length) + ' neighborhoods, built by hand for one weekend.</p></div>' +
      '<div class="h2-city" role="group" aria-label="Pick a neighborhood">' + GROUPS.map(function (g) {
        var L = ids.filter(function (i) { return d.hoods[i].k === g[0]; });
        return '<p class="h2-city-k" data-g="' + g[0] + '">' + cnt(g[0]) + ' ' + g[1] + ' neighborhoods</p><div class="h2-city-r">' + L.map(function (i) {
          var H = d.hoods[i]; return '<button type="button" class="h2-em" data-h="' + i + '" aria-pressed="false" aria-label="' + esc(H.n) + '" title="' + esc(H.n) + '"><img src="' + esc(H.icw || ('ic2/' + i + '.png')) + '" alt="" width="36" height="36" loading="lazy"></button>'; }).join('') + '</div>';
      }).join('') + '</div>' +
      '<div class="h2-row"><button type="button" class="h2-pill h2-cream" data-h2="nexthood">Another neighborhood</button><button type="button" class="h2-pill" data-h2="allhoods">Explore all neighborhoods</button></div></div></section>';
    /* 4 ACT */
    h += '<section class="h2-s h2-s4" aria-labelledby="h2-h4"><div class="h2-s4ph" data-slot="home.act"><img src="' + ACT + '" alt="" width="1600" height="1067" loading="lazy" decoding="async"><h2 class="h2-d h2-sec pkp-head" id="h2-h4">Four days in the woods. Come.</h2></div>' +
      '<div class="h2-s4in"><div class="h2-s4side"><p class="h2-d h2-s4h pkp-head" aria-hidden="true">Four days in the woods. Come.</p>' +
      '<div class="h2-s4solid"><blockquote class="h2-quote">“' + esc(QUOTE[0]) + '”</blockquote><div class="h2-s4end"><cite>' + esc(QUOTE[1]) + '</cite><button type="button" class="h2-pill" data-h2="plan">Plan your trip</button></div></div></div>' +
      '<div class="h2-paper h2-stub"><div class="h2-stub-top"><img class="h2-stub-logo" src="logo27-bat.png" alt="Pickathon ' + YEAR + '" width="700" height="260" loading="lazy">' +
      '<span class="h2-days" role="img" aria-label="Thursday to Sunday. Wednesday is an add-on."><i class="w">W</i><i class="on">Th</i><i class="on">Fr</i><i class="on">Sa</i><i class="on">Su</i></span></div>' +
      '<p class="h2-d h2-stub-d pkp-head">' + DATES + '</p><p class="h2-stub-w">' + DAYSS + '</p>' +
      '<ul class="h2-stub-inc"><li>Camping included</li><li>Kids 12 &amp; under free</li><li>Free water</li></ul>' +
      '<div class="h2-stub-buy"><p><small>3-Day Pass from</small><b class="h2-num" data-h2="from">' + (t ? t.from : '') + '</b></p><span data-h2="cta4"></span></div></div></div></section>';
    return h;
  }
  function ctaKey(t) { return t ? [t.w, t.cta, t.from, t.side.join('|')].join('#') : '-'; }
  function drawCTA() {
    if (!root) return; var t = null; try { t = tix(); } catch (e) {}
    var k = ctaKey(t); if (root._cta === k) return; root._cta = k;
    var c1 = $('[data-h2="cta1"]', root), c4 = $('[data-h2="cta4"]', root);
    if (c1) { c1.innerHTML = t ? ctaHTML(t, true) + '<p class="pk-krtk">' + esc(t.side[0]) + (t.side[1] ? '<span>' + esc(t.side[1]) + '</span>' : '') + '</p>' : ''; }
    if (c4) c4.innerHTML = ctaHTML(t, true);
    $$('[data-h2="from"]', root).forEach(function (e) { e.textContent = t ? t.from : ''; });
  }
  function hood(k) {
    var d = D, H = d && d.hoods[k]; if (!H) return; cur = k;
    var im = hoodImg(d, k), ph = $('[data-h2="hph"]', root);
    ph.src = im; ph.alt = H.n + ' at Pickathon'; ph.setAttribute('data-slot', 'home.place.' + k);
    ph.style.objectPosition = (im === H.i && H.p) ? H.p[0] + '% ' + H.p[1] + '%' : '';
    $('[data-h2="hem"]', root).src = H.icw || ('ic2/' + k + '.png');
    $('[data-h2="hn"]', root).textContent = H.n; $('[data-h2="hk"]', root).textContent = KIND[H.k]; $('[data-h2="htag"]', root).textContent = H.t || '';
    $('[data-h2="hood"]', root).setAttribute('aria-label', H.n + ', ' + KIND[H.k] + '. Explore it on the map');
    $$('.h2-em', root).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-h') === k ? 'true' : 'false'); });
    $$('.h2-city-k', root).forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-g') === H.k); });
  }
  function hoodOrder() { var ids = hoodIds(D); return LEAD.filter(function (k) { return ids.indexOf(k) >= 0; }).concat(ids.filter(function (k) { return LEAD.indexOf(k) < 0; })); }

  /* the watch strip under the poster: one single-song video from the poster's year, from the "Before they were big" cards (past.deep).
     The act that climbed the bill leads; a card counts only when its video is from that same year and is not a full set. */
  var stripY = '';
  function vidOf(u) { var m = /[?&]v=([\w-]+)/.exec(u) || /youtu\.be\/([\w-]+)/.exec(u), v = null; if (m) { v = { yt: m[1] }; } else if ((m = /vimeo\.com\/(\d+)/.exec(u))) v = { vm: m[1] }; return v; }
  function vidRec(v) { if (!v) return null; var L = (D && D.videos) || []; if (!vidRec._m || vidRec._d !== L) { var M = {}; L.forEach(function (x) { if (x.vm) M['vm' + x.vm] = x; else if (x.id) M['yt' + x.id] = x; }); vidRec._m = M; vidRec._d = L; } return vidRec._m[v.yt ? 'yt' + v.yt : 'vm' + v.vm] || null; }
  function nk(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function pickWatch(y) {
    var deep = ((D && D.past) || {}).deep || [], C = ((window.pkClimb || (D && D.climb) || {})[y]) || {}, top = nk(C.clim);
    var ok = deep.filter(function (c) {
      if (!c.m || !c.m.u || (c.y || []).indexOf(+y) < 0 || String(c.m.t || '').indexOf(String(y)) < 0) return false;
      var r = vidRec(vidOf(c.m.u)); return !(r && r.f);   // single songs only on Home
    });
    ok.sort(function (a, b) { var s = function (c) { return (nk(c.n) === top ? 0 : 4) + (c.top ? 0 : 2) + (c.t === 'h' ? 0 : 1); }; return s(a) - s(b); });
    return ok[0] || null;
  }
  function thumb(c) { var v = vidOf(c.m.u), r = vidRec(v); if (v && v.yt) return 'https://i.ytimg.com/vi/' + v.yt + '/mqdefault.jpg'; if (r && r.th) return r.th; return c.pi || ''; }
  function drawStrip() {
    if (!root) return; var m = $('.pk-cl-mount', root), y = m && m.getAttribute('data-y'); if (!y || y === stripY) return; stripY = y;
    var s = $('[data-h2="strip"]', root), c = pickWatch(y);
    if (!c) { s.setAttribute('data-none', ''); s._c = null; return; }
    s.removeAttribute('data-none'); s._c = c; s._y = y;
    var im = $('img', s); im.src = thumb(c); im.alt = '';   /* the button beside it names the act */
    $('[data-h2="wbtn"] span', s).textContent = 'Watch from Pickathon ' + y;
    $('[data-h2="wbtn"]', s).setAttribute('aria-label', 'Watch ' + c.n + ' at Pickathon ' + y);
    $('[data-h2="wa"]', s).textContent = c.n; $('[data-h2="wc"]', s).textContent = c.l || '';
  }
  function play(s) { var c = s && s._c; if (!c) return; try { if (window.__pkPlayVid && window.__pkPlayVid(c.m.u, c.n + ' · Pickathon ' + s._y)) return; } catch (e) {} }

  /* one screen per section: the visible screen under the header (and the ticket line) and above the tabs. On load and resize only. */
  function vars() {
    if (!root) return;
    var desk = window.innerWidth >= 1200, scr, tl = 0;
    if (desk) { var hd = $('#root header'), hb = hd ? hd.getBoundingClientRect().bottom : 0; scr = window.innerHeight - Math.max(0, Math.min(hb, 200)); }
    else { var mn = document.getElementById('pk-scroll-phone'); scr = mn ? mn.clientHeight : window.innerHeight - 125; var t = document.getElementById('pk-tl2'); tl = t && !t.hasAttribute('data-off') ? 44 : 0; }
    var st = $('[data-h2="strip"]', root), sh = st && window.innerWidth >= 600 ? Math.ceil(st.getBoundingClientRect().height) + 12 : 0;   /* phone: the pill sits in the Another year row */
    var v = Math.round(scr) + 'px|' + tl + 'px|' + sh + 'px';
    if (root._v !== v || !root.style.getPropertyValue('--scr')) {   /* the renderer resets the island's own attributes on every render */ root._v = v; root.style.setProperty('--scr', Math.round(scr) + 'px'); root.style.setProperty('--tl', tl + 'px'); root.style.setProperty('--strip', sh + 'px'); }
    if (desk) { root.style.removeProperty('--h2-hp'); poster(scr); } else fitPh(scr);
  }
  /* phone and tablet (QA M2, Nov 11): screens 2 and 3 must fit one screen under the ticket line. Clear the fit, measure the natural height,
     then shrink only the poster (a scale, centered) and the neighborhood photo by what spills over. Load, resize and redraw only; one layout pass. */
  function fitPh(scr) {
    var r = root.style; ['--h2-ps', '--h2-pmb', '--h2-pml', '--h2-st', '--h2-hp'].forEach(function (k) { r.removeProperty(k); }); root._ps = '';
    var s2 = $('.h2-s2', root), pw = s2 && $('.pk-cl-pw', s2);
    if (pw) { var PH = pw.offsetHeight, o = s2.scrollHeight - scr; if (PH && o > 0) { var k = Math.max(0.7, (PH - o - 2) / PH); r.setProperty('--h2-ps', k.toFixed(4)); r.setProperty('--h2-pmb', (-(PH * (1 - k))).toFixed(1) + 'px'); } }
    var s3 = $('.h2-s3', root), ph = s3 && $('.h2-hood-ph', s3);
    if (ph) { var H = ph.offsetHeight, o3 = s3.scrollHeight - scr; if (H && o3 > 0) r.setProperty('--h2-hp', Math.max(72, H - o3 - 2) + 'px'); }
  }
  /* desktop: scale pk-climb's poster to the right-hand column and the screen, and set the watch strip under the time bar (on draw and resize only) */
  function poster(scr) {
    var s2 = $('.h2-s2', root), m = s2 && $('.pk-cl-mount', s2), pw = m && $('.pk-cl-pw', m); if (!pw) return;
    var PW = parseFloat(pw.style.width) || 0, PH = parseFloat(pw.style.height) || 0; if (!PW || !PH) return;
    var colW = (m.clientWidth - 48) * 6 / 10, cs = getComputedStyle(s2), availH = scr - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var k = Math.min(1, colW / PW, availH / PH), mb = -(PH * (1 - k));
    var last = m.querySelector('.pk-cl-tl') || m.querySelector('.pk-cl-tb') || m.querySelector('.pk-cl-hd'), st = $('[data-h2="strip"]', root);
    var wr = $('.h2-s2in', s2), top = last && wr ? Math.round(last.getBoundingClientRect().bottom - wr.getBoundingClientRect().top + 18) : 0, ml = Math.max(0, colW - PW * k);
    var key = k.toFixed(4) + '|' + top + '|' + Math.round(ml); if (root._ps === key && root.style.getPropertyValue('--h2-ps')) return; root._ps = key;
    root.style.setProperty('--h2-ps', k.toFixed(4)); root.style.setProperty('--h2-pmb', mb.toFixed(1) + 'px'); root.style.setProperty('--h2-pml', ml.toFixed(1) + 'px'); if (top) root.style.setProperty('--h2-st', top + 'px');
  }
  function watchS1() {
    if (io) { io.disconnect(); io = null; }
    var s1 = root && $('.h2-s1', root); if (!s1 || !('IntersectionObserver' in window)) { tucked = false; return; }
    io = new IntersectionObserver(function (en) { var t = en[0].intersectionRatio > 0.35; if (t !== tucked) { tucked = t; drawButtons(); } }, { threshold: [0, 0.35, 0.6, 1] });
    io.observe(s1);
  }
  function drawHome() {
    var el = document.getElementById('pkh2');
    if (!el) { if (root) { root = null; if (io) { io.disconnect(); io = null; } tucked = false; } return; }
    D = data(); if (!D) return;
    if (el !== root || !el.firstChild || built !== (D.year + '|' + hoodIds(D).length)) {
      root = el; built = D.year + '|' + hoodIds(D).length; stripY = '';
      el.classList.add('pkh2'); el.innerHTML = skeleton(D); guard(el); el._cta = '';
      hood(cur && D.hoods[cur] ? cur : hoodOrder()[0]);
      tucked = true; watchS1(); vars();
    }
    drawCTA(); drawStrip();
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button,[data-h2]') : null; if (!b) return;
    if (b.hasAttribute('data-h2tix')) { e.preventDefault(); doTix(tix()); return; }
    if (!root || !root.contains(b)) return;
    if (b.classList.contains('h2-em')) { hood(b.getAttribute('data-h')); return; }
    var a = b.getAttribute('data-h2');
    if (a === 'nexthood') { var L = hoodOrder(), i = L.indexOf(cur); hood(L[(i + 1) % L.length]); return; }
    if (a === 'hood') { if (window.__pkMapH) window.__pkMapH(cur)(); else go('hoods'); return; }
    if (a === 'allhoods') { if (window.__pkGoFarm) window.__pkGoFarm(); else go('hoods'); return; }
    if (a === 'plan') { go('info'); return; }
    if (a === 'wbtn' || a === 'wph') { play($('[data-h2="strip"]', root)); return; }
  }

  /* ---------- keeping in step with the app ---------- */
  function syncAll() { try { drawHome(); } catch (e) { if (window.console) console.error('pk-home2', e); } try { drawButtons(); } catch (e) { if (window.console) console.error('pk-home2 tix', e); } try { vars(); watchMain(); } catch (e) {} }
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); syncAll(); return r; };
  document.addEventListener('click', onClick);
  window.addEventListener('resize', function () { try { vars(); } catch (e) {} });
  var ro = null, roOn = null;   /* the phone scroller changes height without a resize event (a bar above it opening or closing) */
  function watchMain() { var m = document.getElementById('pk-scroll-phone'); if (m === roOn || !('ResizeObserver' in window)) return; if (ro) ro.disconnect(); roOn = m; if (!m) return; ro = new ResizeObserver(function () { try { vars(); } catch (e) {} }); ro.observe(m); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncAll(); });
  /* the poster changes year inside its own island (Another year): follow it with the watch strip */
  try { new MutationObserver(function () { if (root) { drawStrip(); root._ps = ''; vars(); } }).observe(document.body, { attributes: true, attributeFilter: ['data-y'], subtree: true }); } catch (e) {}
  window.__pkHome2 = { refresh: function () { built = ''; if (root) root._cta = ''; syncAll(); }, tix: function () { return tix(); }, remind: remindSheet, hood: function (k) { hood(k); } };
  syncAll();
})();
