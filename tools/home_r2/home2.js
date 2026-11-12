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
  var YEAR = 2027, DATES = 'Aug 5–8, 2027', DAYSW = 'Gates open Wed, Aug 4', DAYSS = 'Gates open Wed, Aug 4';   /* Zale's rule (lead, Nov 11 night): Aug 5–8 with gates open Wed, Aug 4; Round 3's 'Aug 4–8' was wrong */
  var LSR = 'pk27remind';
  /* "Another neighborhood" leads with the strong ones (design: home.html), then the rest in data order */
  var LEAD = ['cherryhill', 'woods', 'galaxy', 'windmill', 'market', 'coyote', 'paddock', 'lushcamp', 'grove', 'curation'];
  var KIND = { stage: 'Stage neighborhood', around: 'Gathering neighborhood', camp: 'Camping neighborhood' }, GROUPS = [['stage', 'Stage'], ['around', 'Gathering'], ['camp', 'Camping']];
  var HERO = 'i/r3-home-hero.jpg', ACT = 'i/pk-paddock-c11.jpg';   /* HERO is only the fallback: the hero cycles data.homeHero (Round 3.5, Zale Nov 11 23:30) */
  var HERO_MS = 7000;   /* each hero photo holds 7 s, then a 1.6 s crossfade (home2.css). No motion with reduced motion: the first frame stays. */
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
    readTix(); var s = site(), from = money(window.pkWithFee ? window.pkWithFee(P('p3')) : P('p3'));   // A12: fee-in
    var mp = passes();
    if (mp) { var q = mp[0], nm = String(q.name || 'Pass').replace(/ Pass$/, ''), qty = q.qty ? q.qty + ' × ' : '';
      return { w: 'has', line: '<b>Your passes</b> <span class="pk-tl2-d">· ' + esc(qty + nm) + '</span>', verb: 'Add extras', btn: 'Your passes', go: 'mine', cta: 'Your passes', side: [qty + (q.name || 'Pass'), 'Add parking, camping or a friend'], from: from }; }
    if ((s.season || 'off') !== 'off' || T.open) {
      /* Zale, Nov 11 23:30: no end date and no price-rise claim on Home or the ticket line; plain urgency only (the Tickets page is the ticket team's) */
      var r = T.cur || T.show;
      return { w: 'sale', line: '<b>' + esc(r.name) + '</b> <span class="pk-tl2-d">· from ' + from + '</span>', verb: 'Get tickets', btn: 'Get tickets', go: 'tickets', cta: 'Get tickets',
        side: [r.name + ' prices', 'Tickets are running out'], from: from };
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
    var HL = heroes(d);
    h += '<section class="h2-s h2-s1" aria-labelledby="h2-h1"><div class="h2-s1ph" data-slot="home.hero" role="group" aria-roledescription="photos" aria-label="Photos from past Pickathons">' + HL.map(function (x, k) {
        return '<img class="h2-hf' + (k ? '' : ' is-on') + '" ' + (k ? 'data-src' : 'src') + '="' + esc(heroSrc(x)) + '" alt="' + esc(x.alt || '') + '"' + (k ? ' aria-hidden="true"' : '') + ' style="object-position:' + esc(x.p || '50% 50%') + '"' + (k ? ' loading="lazy"' : ' fetchpriority="high" loading="eager"') + ' decoding="async">'; }).join('') +
      '<p class="h2-hcap" data-h2="hcap">' + esc(heroCap(HL[0])) + '</p>' +
      '<button type="button" class="h2-tour" data-h2="tour"><span aria-hidden="true">▶</span>Take the tour</button>' +
      (HL.length > 1 ? '<button type="button" class="h2-hpz" data-h2="hpause" aria-pressed="false" aria-label="Pause the photos"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="pz" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/><path class="pl" d="M8 5 L19 12 L8 19 Z"/></svg></button>' : '') + '</div>' +
      '<h1 class="h2-d h2-hero pkp-head" id="h2-h1"><span>Your new favorite band</span><span>is playing.</span><span>You just haven’t</span><span>met them yet.</span></h1>' +
      '<div class="h2-s1b"><p class="h2-lead">Four days of music on a forest farm in Happy Valley, Oregon.</p>' +
      '<div class="h2-paper h2-band"><div class="h2-band-m"><p class="h2-d h2-band-d pkp-head">' + DATES + '</p><p class="h2-band-w">' + DAYSW + '</p></div>' +
      '<div class="h2-band-p"><small>3-Day Pass from</small><b class="h2-num" data-h2="from">' + (t ? t.from : '') + '</b><small>camping included</small><small>kids 12 &amp; under free</small></div></div>' +
      '<div class="h2-cta" data-h2="cta1"></div></div></section>';
    var hP = h; h = '';
    /* 4 PROOF (Round 3.5, Zale Nov 11 23:30: "very visual: the weight of these bands"). Not one year's poster: every Discovery since the first,
       the biggest six as photos, the rest as a wall of names in their first year's colors, ranked by pkRankCmp. Drawn by drawWall(). The 2019 poster
       climb (pk-climb) now lives only on the year pages. */
    h += '<section class="h2-s h2-s6" aria-labelledby="h2-h6"><div class="h2-s6head"><h2 class="h2-d h2-sec pkp-head" id="h2-h6">Everyone who broke out here</h2>' +
      '<p class="h2-sub h2-s6sub" data-h2="wsub"></p></div>' +
      '<div class="h2-faces" data-h2="faces"></div><div class="h2-wall" data-h2="wall" aria-hidden="true"></div>' +
      '<div class="h2-row h2-s6row"><button type="button" class="h2-pill" data-h2="alldisc" data-h2n="wall">See them all</button><span class="h2-s6cta" data-h2="cta6"></span></div></section>';
    var hPoster = h; h = '';
    /* 3 PLACE (Round 3.5 hybrid, neighborhood panel Nov 11): the emblems are the picker; the photo says what the place is (kind, name, its title in gold)
       and cycles its preview set; a still farm map shows where it is (tints by kind, the picked outline in gold with its emblem). Photo or map opens Places. */
    h += '<section class="h2-s h2-s3" aria-labelledby="h2-h3"><div class="h2-s3head"><h2 class="h2-d h2-sec pkp-head" id="h2-h3">Live inside a temporary city of wonder</h2><p class="h2-sub h2-s3sub">' + (ids.length === 20 ? 'Twenty' : ids.length) + ' neighborhoods, built by hand for one weekend. Pick one and step inside.</p></div>' +
      '<div class="h2-hmv"><button type="button" class="h2-hood" data-h2="hood"><img class="h2-hp is-on" alt="" decoding="async"><img class="h2-hp" alt="" decoding="async" aria-hidden="true">' +
      '<span class="h2-hood-o"><span class="h2-hood-k" data-h2="hk"></span><span class="h2-d h2-hood-n pkp-head" data-h2="hn"></span><span class="h2-hood-tag" data-h2="htag"></span></span>' +
      '<span class="h2-hood-go" aria-hidden="true"><span>Explore</span>' + CHEV + '</span></button>' +
      '<button type="button" class="h2-hmap" data-h2="hmap">' + mapSVG(d) + '</button></div>' +
      '<div class="h2-city" role="group" aria-label="Pick a neighborhood">' + GROUPS.map(function (g) {
        var L = ids.filter(function (i) { return d.hoods[i].k === g[0]; });
        return '<p class="h2-city-k" data-g="' + g[0] + '"><i class="h2-dot" aria-hidden="true"></i>' + cnt(g[0]) + ' ' + g[1] + ' neighborhoods</p><div class="h2-city-r">' + L.map(function (i) {
          var H = d.hoods[i]; return '<button type="button" class="h2-em" data-h="' + i + '" aria-pressed="false" aria-label="' + esc(H.n) + '" title="' + esc(H.n) + '"><img src="' + esc(H.icw || ('ic2/' + i + '.png')) + '" alt="" width="44" height="44" loading="lazy"></button>'; }).join('') + '</div>';
      }).join('') + '</div>' +
      '<div class="h2-row h2-s3row"><button type="button" class="h2-pill" data-h2="allhoods">Explore all neighborhoods</button></div></section>';
    var hPlace = h; h = '';
    /* 4 ACT */
    h += '<section class="h2-s h2-s4" aria-labelledby="h2-h4"><div class="h2-s4ph" data-slot="home.act"><img src="' + ACT + '" alt="" width="1600" height="1067" loading="lazy" decoding="async"><h2 class="h2-d h2-sec pkp-head" id="h2-h4">Four days in the woods. Come.</h2></div>' +
      '<div class="h2-s4in"><div class="h2-s4side"><p class="h2-d h2-s4h pkp-head" aria-hidden="true">Four days in the woods. Come.</p>' +
      '<div class="h2-s4solid"><blockquote class="h2-quote">“' + esc(QUOTE[0]) + '”</blockquote><div class="h2-s4end"><cite>' + esc(QUOTE[1]) + '</cite><button type="button" class="h2-pill" data-h2="plan">Plan your trip</button></div></div></div>' +
      '<div class="h2-paper h2-stub"><div class="h2-stub-top"><img class="h2-stub-logo" src="logo27-bat.png" alt="Pickathon ' + YEAR + '" width="700" height="260" loading="lazy">' +
      '<span class="h2-days" role="img" aria-label="Thursday to Sunday. Wednesday is an add-on."><i class="w">W</i><i class="on">Th</i><i class="on">Fr</i><i class="on">Sa</i><i class="on">Su</i></span></div>' +
      '<p class="h2-d h2-stub-d pkp-head">' + DATES + '</p><p class="h2-stub-w">' + DAYSS + '</p>' +
      '<ul class="h2-stub-inc"><li>Camping included</li><li>Kids 12 &amp; under free</li><li>Free water</li></ul>' +
      '<div class="h2-stub-buy"><p><small>3-Day Pass from</small><b class="h2-num" data-h2="from">' + (t ? t.from : '') + '</b></p><span data-h2="cta4"></span></div></div></div></section>';
    /* 2 CONCEPT (Round 3 E1/E2, Zale approved the blend Nov 11): one Discovery at a time, the fact first. The photo and the gold pill play
       the video; the words open the archive at that artist; Another discovery walks the ranking; See all opens the archive. */
    var hBand = '<section class="h2-s h2-s5" aria-labelledby="h2-h5"><div class="h2-s5head"><h2 class="h2-d h2-sec pkp-head" id="h2-h5">Be there before they’re big</h2>' +
      '<p class="h2-sub h2-s5sub">You don’t know this year’s lineup yet. Neither did anyone who saw these bands here first.</p></div>' +
      '<article class="h2-bc" data-h2="band" aria-live="polite"><button type="button" class="h2-bc-ph" data-h2="bph"><img alt="" decoding="async"><span class="h2-pill h2-watch h2-bc-w" data-h2="bw">' + PLAY + '<span></span></span></button>' +
      '<button type="button" class="h2-bc-t" data-h2="barch"><span class="h2-bc-k"><span data-h2="bk"></span><span class="h2-bc-y" data-h2="by"></span></span><span class="h2-d h2-bc-n pkp-head" data-h2="bn"></span><span class="h2-bc-l" data-h2="bl"></span><span class="h2-bc-q" data-h2="bq"></span></button></article>' +
      '<div class="h2-row h2-s5row"><button type="button" class="h2-pill h2-cream" data-h2="nextdisc">Another discovery</button><button type="button" class="h2-pill" data-h2="alldisc">See all Discoveries</button></div></section>';
    return hP + hBand + hPlace + hPoster + h;
  }
  function ctaKey(t) { return t ? [t.w, t.cta, t.from, t.side.join('|')].join('#') : '-'; }
  function drawCTA() {
    if (!root) return; var t = null; try { t = tix(); } catch (e) {}
    var k = ctaKey(t); if (root._cta === k) return; root._cta = k;
    var c1 = $('[data-h2="cta1"]', root), c4 = $('[data-h2="cta4"]', root), c6 = $('[data-h2="cta6"]', root);
    if (c1) { c1.innerHTML = t ? ctaHTML(t, true) + '<p class="pk-krtk">' + esc(t.side[0]) + (t.side[1] ? '<span>' + esc(t.side[1]) + '</span>' : '') + '</p>' : ''; }
    if (c4) c4.innerHTML = ctaHTML(t, true);
    if (c6) c6.innerHTML = ctaHTML(t, false);
    $$('[data-h2="from"]', root).forEach(function (e) { e.textContent = t ? t.from : ''; });
  }
  /* the still farm map: farmmap/home-map.webp under the outlines from farmmap/index.html (make_hoods.py). One SVG; the picked outline and pin move. */
  var HH = /*@HOODS_HOME*/null;
  function mapSVG(d) {
    if (!HH) return '';
    var W = HH.size[0], H = HH.size[1];
    return '<svg class="h2-msvg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href="farmmap/home-map.webp" x="0" y="0" width="' + W + '" height="' + H + '"/>' +
      '<g class="h2-mt">' + Object.keys(HH.shapes).map(function (k) { var o = d.hoods[k]; return o ? '<path class="k-' + esc(o.k) + '" d="' + HH.shapes[k] + '"/>' : ''; }).join('') + '</g>' +
      '<path class="h2-mhalo" d=""/><path class="h2-msel" d=""/><image class="h2-mpin" href="" width="1" height="1"/></svg>';
  }
  function mapPick(k) {
    var sv = root && $('.h2-msvg', root); if (!sv || !HH) return;
    var W = HH.size[0], H = HH.size[1], p = HH.pts[k] || [50, 50], px = p[0] / 100 * W, py = p[1] / 100 * H;
    var bw = sv.clientWidth || 1, bh = sv.clientHeight || 1, vw = W, vh = H, x0 = 0, y0 = 0;
    if (bw / bh < W / H) { vw = H * bw / bh; x0 = Math.max(0, Math.min(W - vw, px - vw / 2)); } else { vh = W * bh / bw; y0 = Math.max(0, Math.min(H - vh, py - vh / 2)); }
    sv.setAttribute('viewBox', [x0, y0, vw, vh].map(function (n) { return Math.round(n); }).join(' '));
    var sc = bw / vw, pin = Math.max(26, Math.min(40, bw * 0.24)) / sc;   /* about 30px on screen whatever the box */
    var sel = $('.h2-msel', sv), hal = $('.h2-mhalo', sv); sel.setAttribute('d', HH.shapes[k] || ''); sel.style.strokeWidth = (2.5 / sc).toFixed(1); hal.setAttribute('d', HH.shapes[k] || ''); hal.style.strokeWidth = (10 / sc).toFixed(1);
    var o = (D.hoods[k] || {}), im = $('.h2-mpin', sv); im.setAttribute('href', o.icw || ('ic2/' + k + '.png')); im.setAttribute('width', pin); im.setAttribute('height', pin); im.setAttribute('x', px - pin / 2); im.setAttribute('y', py - pin / 2);
  }
  /* the photo: the photo director's preview set for the place (lead first), cycling every 4 s while the section is on screen; still with reduced motion */
  var hpI = 0, hpT = null;
  function hoodSet(k) { var L = (HH && HH.prev && HH.prev[k]) || []; if (!L.length) { var im = hoodImg(D, k), o = D.hoods[k] || {}; if (im) L = [{ i: im, p: (im === o.i && o.p) ? o.p[0] + '% ' + o.p[1] + '%' : '' }]; } return L; }
  function hoodShow(k, n, fade) {
    var L = hoodSet(k); if (!L.length || !root) return; var x = L[n % L.length], I = $$('.h2-hp', root); if (I.length < 2) return;
    var on = I[0].classList.contains('is-on') ? 0 : 1, nx = fade ? 1 - on : on, el = I[nx], phone = window.innerWidth < 600;
    var go = function () { el.style.objectPosition = (phone || window.innerWidth < 1200) && x.p ? x.p : ''; if (fade) { I[on].classList.remove('is-on'); el.classList.add('is-on'); } };
    el.alt = (D.hoods[k] || {}).n ? D.hoods[k].n + ' at Pickathon' : '';
    if (el.getAttribute('src') === x.i) go(); else { el.onload = function () { el.onload = null; if (cur === k) go(); }; el.src = x.i; }
    var nxt = L[(n + 1) % L.length]; if (nxt && L.length > 1) { var pre = new Image(); pre.src = nxt.i; }
  }
  function hoodTick() {
    if (!root || !cur || reduced() || document.hidden) return; var s3 = $('.h2-s3', root); if (!s3) return;
    var r = s3.getBoundingClientRect(), vh = window.innerHeight; if (r.bottom < vh * 0.4 || r.top > vh * 0.6) return;   /* only while the section is the one on screen */
    if (hoodSet(cur).length < 2) return; hpI++; hoodShow(cur, hpI, true);
  }
  function hood(k) {
    var d = D, H = d && d.hoods[k]; if (!H) return; cur = k; hpI = 0;
    hoodShow(k, 0, false);
    $('[data-h2="hood"]', root).setAttribute('data-slot', 'home.place.' + k);
    $('[data-h2="hn"]', root).textContent = H.n; $('[data-h2="hk"]', root).textContent = KIND[H.k]; $('[data-h2="htag"]', root).textContent = H.t || '';
    $('[data-h2="hood"]', root).setAttribute('aria-label', H.n + ', ' + KIND[H.k] + (H.t ? ', ' + H.t : '') + '. Explore it on the map');
    var mb = $('[data-h2="hmap"]', root); if (mb) mb.setAttribute('aria-label', 'Where ' + H.n + ' is on the farm. Open the map');
    $$('.h2-em', root).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-h') === k ? 'true' : 'false'); });
    $$('.h2-city-k', root).forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-g') === H.k); });
    mapPick(k);
    if (!hpT) hpT = setInterval(hoodTick, 4000);
  }
  /* ---------- 2. Before they were big: Discoveries only (archCT k = disc, one card per artist at that first year), ranked by pkRankCmp
     (magnitude_dec first). Cards need a photo and a fact line. The acts on the poster's opening year step aside, so the two band sections never show the same act. ---------- */
  var BL = null, BLd = null, bi = 0;
  function bandList() {
    if (BL && BLd === D) return BL;
    var pool = []; try { pool = window.__pkArchPool ? window.__pkArchPool() : []; } catch (e) { pool = []; }
    var PV = (D && D.preview) || {};
    BL = pool.filter(function (a) { return a.cat === 'music' && a.ctk === 'disc' && !a.dc && !a.leg && a.line; }).map(function (a) {
      var pv = PV[a.n], img = (pv && String(pv.y) === String(a.yr) && pv.i) || a.img || (pv && pv.i) || '';
      var v = vidOf(a.vu), r = vidRec(v), full = !!(r && r.f), watch = !!a.vu && !full && /^(Watch|Listen)/.test(a.vt || '');
      return { n: a.n, kind: a.kind || 'Discovery', y: String(a.yr || ''), line: shortLine(a.line), img: img, vu: watch ? a.vu : '', vt: watch ? a.vt : '', m: a.m, k: 'disc', c: a.cf };
    }).filter(function (a) { return a.img; });
    BL.sort(window.pkRankCmp || function () { return 0; }); BLd = D; return BL;
  }
  function drawBand() {
    if (!root) return; var L = bandList(), s = $('.h2-s5', root); if (!s) return;
    if (!L.length) { s.hidden = true; return; } s.hidden = false;
    var a = L[((bi % L.length) + L.length) % L.length], ph = $('[data-h2="bph"]', s), w = $('[data-h2="bw"]', s);
    $('img', ph).src = a.img; $('img', ph).alt = '';
    ph.setAttribute('aria-label', a.vu ? (/^Listen/.test(a.vt) ? 'Listen to ' : 'Watch ') + a.n + ' at Pickathon ' + a.y : a.n + ': see the archive');
    w.hidden = !a.vu; $('span', w).textContent = a.vu ? a.vt : '';
    $('[data-h2="bk"]', s).textContent = a.kind; $('[data-h2="by"]', s).textContent = a.y;
    $('[data-h2="bn"]', s).textContent = a.n; $('[data-h2="bl"]', s).textContent = a.line;
    $('[data-h2="bq"]', s).textContent = a.vu ? '' : 'Played Pickathon ' + a.y;
    $('[data-h2="barch"]', s).setAttribute('aria-label', a.n + ', ' + a.kind + ', Pickathon ' + a.y + '. See ' + a.n + ' in the archive');
    s._a = a;
    if (window.innerWidth < 1200) { try { vars(); } catch (e) {} }   /* a longer or shorter fact: the photo takes what is left, so the section stays one screen */
  }
  /* the card's fact, about 100 characters (funnel panel, Nov 11: the section must fit 360x740). The long story stays in the archive.
     Mechanical until the story file brings a short hook per act: the whole line if it is short; else the sentence with the strongest
     proof a stranger knows (Grammy, Red Rocks, arenas...), short enough; else the first sentence that fits. Never cut mid-sentence. */
  var PROOF = /Grammy|Red Rocks|arena|Ryman|Madison Square|Hollywood Bowl|Greek|Coachella|Glastonbury|Bowl|headlin|sold[- ]out|Brooklyn Steel|Letterman|Polaris|Juno|Bridgestone|Gorge/i;
  function shortLine(s) {
    s = String(s || '').trim(); if (s.length <= 118) return s;
    var S = s.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [s], best = null, bs = -1;
    S.forEach(function (x, k) { x = x.trim(); if (x.length > 125 || x.length < 30) return; var sc = (PROOF.test(x) ? 10 : 0) - k - (/^(Then|They|He|She|His|Her|It|By|Within|After)\b/.test(x) ? 3 : 0); PROOF.lastIndex = 0; if (sc > bs) { bs = sc; best = x; } });
    if (best) return best;
    for (var i = 0; i < S.length; i++) { var x = S[i].trim(); if (x.length <= 125) return x; }
    return S[0].trim();
  }
  function toArchive(n) { var A = app(); if (!A) return; A.setState({ archLead: n || null, luYear: 'disc', luArch: true, lineup: 'music', archT: null, archC: null, archY: '' }); A.go('lineup', { keepArch: true }); }
  function hoodOrder() { var ids = hoodIds(D); return LEAD.filter(function (k) { return ids.indexOf(k) >= 0; }).concat(ids.filter(function (k) { return LEAD.indexOf(k) < 0; })); }

  /* ---------- 4. Everyone who broke out here: the same Discoveries as the archive (one per artist, first Discovery year, pkRankCmp).
     Six photos lead (local photos only; the act opening Before they were big steps aside so the two screens never show the same picture),
     then every other name, sized by how big they got, with the first Pickathon year in that year's color. The wall is cut by its box with a fade:
     it always fits one screen, and See them all opens the archive. ---------- */
  var WL = null, WLd = null;
  function wallList() {
    if (WL && WLd === D) return WL;
    var pool = []; try { pool = window.__pkArchPool ? window.__pkArchPool() : []; } catch (e) { pool = []; }
    WL = pool.filter(function (a) { return a.cat === 'music' && a.ctk === 'disc' && !a.dc && !a.leg; })
      .map(function (a) { return { n: a.n, y: String(a.yr || ''), m: a.m, c: a.cf, k: 'disc', img: a.img || '' }; });
    WL.sort(window.pkRankCmp || function () { return 0; }); WLd = D; return WL;
  }
  function lum(h) { var m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 0; var v = parseInt(m[1], 16), f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(v >> 16) + 0.7152 * f((v >> 8) & 255) + 0.0722 * f(v & 255); }
  /* the year's own color that reads on the dark ground (contrast 4.5 or better against #2B2628), avoiding plain white; else cream-dim */
  var YCOL = {};
  function yearCol(y) {
    if (YCOL[y]) return YCOL[y]; var B = ((D && D.yearBrand) || {})[y] || {}, g = lum('#2B2628'), out = '#CFC9BC';
    [B.light, B.warm, B.ink2, (B.stripe || [])[1], (B.stripe || [])[0]].some(function (c) { if (!c || /^#(F{6}|FFFEF2|FFFFFA|F0EEEA|EEEDDD|F4F3EB|EAE4DF)$/i.test(c)) return false; var r = (lum(c) + 0.05) / (g + 0.05); if (r >= 4.5) { out = c; return true; } return false; });
    return (YCOL[y] = out);
  }
  function drawWall() {
    if (!root) return; var s = $('.h2-s6', root); if (!s) return; var L = wallList();
    if (!L.length) { s.hidden = true; return; } s.hidden = false;
    var lead = (bandList()[0] || {}).n, y0 = L.reduce(function (a, b) { return Math.min(a, +b.y || 9999); }, 9999);
    var nF = window.innerWidth < 380 ? 3 : 6, F = [];
    L.forEach(function (a) { if (F.length < nF && a.n !== lead && /^(i|alum)\//.test(a.img)) F.push(a); });
    var inF = {}; F.forEach(function (a) { inF[a.n] = 1; });
    var key = nF + '|' + L.length + '|' + lead; if (s._k === key) return; s._k = key;
    $('[data-h2="wsub"]', s).textContent = 'Since ' + y0 + ', ' + L.length + ' bands played Pickathon before the world caught on.';
    $('[data-h2="faces"]', s).innerHTML = F.map(function (a) {
      return '<button type="button" class="h2-face" data-h2="face" data-n="' + esc(a.n) + '" aria-label="' + esc(a.n + ', first played Pickathon ' + a.y + '. See them in the archive') + '"><img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="h2-face-t"><span class="h2-d h2-face-n">' + esc(a.n) + '</span><span class="h2-face-y" style="color:' + yearCol(a.y) + '">Pickathon ' + esc(a.y) + '</span></span></button>'; }).join('');
    $('[data-h2="wall"]', s).innerHTML = L.filter(function (a) { return !inF[a.n]; }).map(function (a) {
      var m = +a.m || 0, t = m >= 5.5 ? 'w1' : m >= 3.5 ? 'w2' : 'w3';
      return '<span class="h2-wn ' + t + '">' + esc(a.n) + '<i style="color:' + yearCol(a.y) + '">' + esc(a.y) + '</i></span>'; }).join(' ');
    var b = $('[data-h2="alldisc"]', s); if (b) b.textContent = 'See all ' + L.length;
  }
  /* ---------- 1. the hero: a slow crossfade through data.homeHero (architecture, crowd, performance; best first) ---------- */
  function heroes(d) { var L = ((d && d.homeHero) || []).filter(function (x) { return x && x.i; }); return L.length ? L : [{ i: HERO, p: '50% 62%', alt: 'A band on a hand-built stage at night, the crowd close in front' }]; }
  function heroSrc(x) { return (window.innerWidth <= 820 && x.m) ? x.m : x.i; }   /* phone and portrait tablet: a 900px square crop on the photo's subject */
  function heroCap(x) { return x ? [x.place, x.y ? 'Pickathon ' + x.y : '', x.by].filter(Boolean).join(' · ') : ''; }
  var hi = 0, hPaused = false, hTimer = null;
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function heroLoad(k) { var I = $$('.h2-hf', root)[k]; if (I && I.getAttribute('data-src')) { I.src = I.getAttribute('data-src'); I.removeAttribute('data-src'); I.loading = 'eager'; } return I; }
  function heroStep() {
    if (!root || hPaused || reduced() || document.hidden || !tucked) return;   /* tucked = the hero is in view */
    var I = $$('.h2-hf', root); if (I.length < 2) return; var nx = (hi + 1) % I.length, N = heroLoad(nx);
    if (!N || !N.complete || !N.naturalWidth) return;   /* not loaded yet: try again next tick */
    I[hi].classList.remove('is-on'); I[hi].setAttribute('aria-hidden', 'true'); N.classList.add('is-on'); N.removeAttribute('aria-hidden'); hi = nx;
    var c = $('[data-h2="hcap"]', root); if (c) c.textContent = heroCap(heroes(D)[hi]);
    heroLoad((hi + 1) % I.length);   /* the next one loads during this one's 7 s */
  }
  function heroStart() { if (hTimer) clearInterval(hTimer); hi = 0; hTimer = setInterval(heroStep, HERO_MS); setTimeout(function () { if (root) heroLoad(1); }, 2500); }
  function heroPause(b) {
    hPaused = !hPaused; b.setAttribute('aria-pressed', hPaused ? 'true' : 'false'); b.setAttribute('aria-label', hPaused ? 'Play the photos' : 'Pause the photos');
  }
  function vidOf(u) { var m = /[?&]v=([\w-]+)/.exec(u) || /youtu\.be\/([\w-]+)/.exec(u), v = null; if (m) { v = { yt: m[1] }; } else if ((m = /vimeo\.com\/(\d+)/.exec(u))) v = { vm: m[1] }; return v; }
  function vidRec(v) { if (!v) return null; var L = (D && D.videos) || []; if (!vidRec._m || vidRec._d !== L) { var M = {}; L.forEach(function (x) { if (x.vm) M['vm' + x.vm] = x; else if (x.id) M['yt' + x.id] = x; }); vidRec._m = M; vidRec._d = L; } return vidRec._m[v.yt ? 'yt' + v.yt : 'vm' + v.vm] || null; }
  function nk(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  /* one screen per section: the visible screen under the header (and the ticket line) and above the tabs. On load and resize only. */
  function vars() {
    if (!root) return;
    var desk = window.innerWidth >= 1200, scr, tl = 0;
    if (desk) { var hd = $('#root header'), hb = hd ? hd.getBoundingClientRect().bottom : 0; scr = window.innerHeight - Math.max(0, Math.min(hb, 200)); }
    else { var mn = document.getElementById('pk-scroll-phone'); scr = mn ? mn.clientHeight : window.innerHeight - 125; var t = document.getElementById('pk-tl2'); tl = t && !t.hasAttribute('data-off') ? 44 : 0; }
    var v = Math.round(scr) + 'px|' + tl + 'px';
    if (root._v !== v || !root.style.getPropertyValue('--scr')) {   /* the renderer resets the island's own attributes on every render */ root._v = v; root.style.setProperty('--scr', Math.round(scr) + 'px'); root.style.setProperty('--tl', tl + 'px'); }
    if (desk) root.style.removeProperty('--h2-hp'); else fitPh(scr);
    if (cur) mapPick(cur);   /* the map box changed size: re-frame the pin */
    try { drawWall(); } catch (e) {}   /* three photos or six follows the width */
  }
  /* phone and tablet (QA M2, Nov 11): screens 2 and 3 must fit one screen under the ticket line. Clear the fit, measure the natural height,
     then shrink only the card photo and the neighborhood photo by what spills over. Load, resize and redraw only; one layout pass.
     Screen 4 (the wall) needs no fit: its wall of names takes whatever height is left. */
  function fitPh(scr) {
    var r = root.style; r.removeProperty('--h2-hp');
    var s5 = $('.h2-s5', root), bp = s5 && $('.h2-bc-ph', s5);
    if (bp) { r.removeProperty('--h2-bp'); var BH = bp.offsetHeight, o5 = s5.scrollHeight - scr; if (BH && o5 > 0) r.setProperty('--h2-bp', Math.max(96, BH - o5 - 2) + 'px'); }
    var s3 = $('.h2-s3', root), ph = s3 && $('.h2-hmv', s3);
    if (ph) { var H = ph.offsetHeight, o3 = s3.scrollHeight - scr; if (H && o3 > 0) r.setProperty('--h2-hp', Math.max(72, H - o3 - 2) + 'px'); }
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
      root = el; built = D.year + '|' + hoodIds(D).length;
      el.classList.add('pkh2'); el.innerHTML = skeleton(D); guard(el); el._cta = '';
      hood(cur && D.hoods[cur] ? cur : hoodOrder()[0]); BL = null; WL = null; drawBand(); drawWall();
      tucked = true; watchS1(); vars(); heroStart();
    }
    drawCTA();
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button,[data-h2]') : null; if (!b) return;
    if (b.hasAttribute('data-h2tix')) { e.preventDefault(); doTix(tix()); return; }
    if (!root || !root.contains(b)) return;
    if (b.classList.contains('h2-em')) { hood(b.getAttribute('data-h')); return; }
    var a = b.getAttribute('data-h2');
    if (a === 'nextdisc') { bi++; drawBand(); return; }
    if (a === 'alldisc') { toArchive(null); return; }
    if (a === 'barch') { var sa = $('.h2-s5', root); toArchive(sa && sa._a ? sa._a.n : null); return; }
    if (a === 'bph') { var sb = $('.h2-s5', root), ba = sb && sb._a; if (!ba) return; if (!ba.vu) { toArchive(ba.n); return; } try { if (/open\.spotify\.com/.test(ba.vu) && window.__pkOpenMusic) { window.__pkOpenMusic(ba.vu); return; } if (window.__pkPlayVid) window.__pkPlayVid(ba.vu, ba.n + ' · Pickathon ' + ba.y); } catch (x) {} return; }
    if (a === 'hood' || a === 'hmap') { if (window.__pkMapH) window.__pkMapH(cur)(); else go('hoods'); return; }
    if (a === 'allhoods') { if (window.__pkGoFarm) window.__pkGoFarm(); else go('hoods'); return; }
    if (a === 'plan') { go('info'); return; }
    if (a === 'face') { toArchive(b.getAttribute('data-n')); return; }
    if (a === 'hpause') { heroPause(b); return; }
    if (a === 'tour') { var A = app(); try { if (A && A.ssOpen) { A.ssOpen(); return; } } catch (x) {} return; }   /* the full-screen photo tour (the screensaver), as the old Home's "Photo tour" */
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
  window.__pkHome2 = { refresh: function () { built = ''; if (root) root._cta = ''; syncAll(); }, tix: function () { return tix(); }, remind: remindSheet, hood: function (k) { hood(k); } };
  syncAll();
})();
