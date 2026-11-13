  /* ======================================================================================
     Plan your trip in time order (plan_your_trip_journey.md, Zale Nov 9; rulings Nov 13: packing is its own page,
     the trip picks are remembered). The hub shows the basics, the three picks and four step cards with one button each.
     Each fact is written out once, on its step page; other pages link there. Old info pages redirect (window.pkTripRedirect).
     Copy is moved from data.json pages (traveling-to-pickathon, bike-to-pickathon, camping, lodging, ada-info, easy-day,
     what-to-bring-to-pickathon, commitment-to-sustainability); hours are 2026's and say so. Prices live on Tickets only.
     ====================================================================================== */
  var STEPS = ['arrive', 'sleep', 'farm'], LSV = 'pk27planv';
  window.pkTripRedirect = {
    'traveling-to-pickathon': 'arrive', 'bike-to-pickathon': 'arrive:bike', 'camping': 'sleep', 'lodging': 'sleep:hotel',
    'what-to-bring-to-pickathon': 'pack', 'ada-info': 'farm:access', 'getting-around-pickathon-neighborhood-map': 'farm',
    'commitment-to-sustainability': 'farm:food', 'easy-day': '', 'pickathon-2026-tickets-passes': 'tickets'
  };
  /* photos: picked from the neighborhood galleries in data.json (Photo Catalog photos); crops from focus.json.
     Photo Catalog's "trip moment" tag (design_studio-65) will replace these lists when it lands. */
  var STRIP = {
    arrive: ['i/pk-welcomelot-13.jpg', 'i/pk-welcomelot-10.jpg', 'i/p531.jpg', 'i/pk-farmhouse-01.jpg', 'i/pk-farmhouse-24.jpg', 'i/pk-welcomelot-01.jpg'],
    sleep: ['i/pk-lushcamp-05.jpg', 'i/r3-home-lushcamp.jpg', 'i/pk-wildcamp-10.jpg', 'i/pk-wildcamp-09.jpg', 'i/68.jpg', 'i/p502.jpg', 'i/pk-lushcamp-01.jpg'],
    farm: ['i/pk-coyote-01.jpg', 'i/pk-paddock-c11.jpg', 'i/455.jpg', 'i/pk-coyote-21.jpg', 'i/pk-paddock-01.jpg', 'i/pk-paddock-c12.jpg', 'i/pk-coyote-09.jpg']
  };
  var CARD_IM = { buy: 'i/pk-welcomelot-13.jpg', arrive: 'i/pk-farmhouse-01.jpg', sleep: 'i/pk-lushcamp-05.jpg', farm: 'i/pk-paddock-c11.jpg' };
  var FOC = null;
  function focusOf(src) {
    if (!FOC) { FOC = {}; try { var x = new XMLHttpRequest(); x.open('GET', 'focus.json', false); x.send(); if (x.status === 200) FOC = JSON.parse(x.responseText) || {}; } catch (e) {} }
    var f = FOC[src]; return f ? f[0] + '% ' + f[1] + '%' : '50% 50%';
  }
  function img(src, cls, eager) { return '<img class="' + cls + '" src="' + src + '" alt="" style="object-position:' + focusOf(src) + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">'; }
  function btn(label, go, kind) { return '<button type="button" class="pk-cta ' + (kind || 'pri') + ' pl-btn" data-go="' + go + '">' + esc(label) + '</button>'; }
  function views() { return lsGet(LSV) || {}; }
  function setView(step, c) { var v = views(); v[step] = c; lsSet(LSV, v); }

  /* the four steps, each one answering one question */
  function dayPass() { return effective().len === 'd2' || effective().len === 'd1'; }
  var GO_T = { drive: 'Driving', shuttle: 'MAX and the shuttle', bike: 'Biking', drop: 'Dropped off', fly: 'Flying in' };
  function cardsHTML() {
    var e = effective(), sl = e.camp ? { tent: 'A tent in the woods, included.', car: 'Car camping in Willow or South Camp.', rv: 'An RV spot in Willow or South Camp.', none: 'Off site.' }[e.sleep] : 'Day tickets: home or a hotel nearby.';
    var C = [
      ['1', 'Before you buy', 'Which pass, and what will it cost?', LEN_T[e.len] + (e.camp ? ', camping included.' : ', no camping.'), 'buy', btn('Passes and prices', 'route:tickets')],
      ['2', 'Arrive', 'How do I get there and in?', 'You picked: ' + GO_T[e.go].toLowerCase() + '.', 'arrive', btn('Arrive', 'step:arrive', 'sec')],
      ['3', 'Sleep', 'Where do I sleep?', sl, 'sleep', btn('Sleep', 'step:sleep', 'sec')],
      ['4', 'At the farm', 'What is it like inside?', 'Twenty neighborhoods, food, water, kids and access.', 'farm', btn('At the farm', 'step:farm', 'sec')]
    ];
    return C.map(function (c) {
      return '<li class="pl-sc"><div class="pl-sc-im">' + img(CARD_IM[c[4]], 'pl-sc-img') + '<span class="pl-sc-n pl-d">' + c[0] + '</span></div>' +
        '<div class="pl-sc-tx"><p class="pl-sc-k">' + c[1] + '</p><h2 class="pl-d pl-d-card pl-sc-q">' + c[2] + '</h2><p class="pl-sc-x">' + esc(c[3]) + '</p>' + c[5] + '</div></li>';
    }).join('');
  }
  function hubHTML() {
    return '<div class="pl-in">' +
      '<div class="pl-top"><h1 class="pl-d pl-h1">Plan your trip</h1><div class="pl-picks">' +
        sel('pl-len', 'How long', [['p4', '4 days'], ['p3', '3 days'], ['d2', 'Sat + Sun'], ['d1', 'One day']]) +
        sel('pl-sleep', 'Sleeping', [['tent', 'Tent'], ['car', 'Car camp'], ['rv', 'RV'], ['none', 'Off site']]) +
        sel('pl-go', 'Getting there', [['drive', 'Driving'], ['shuttle', 'Shuttle'], ['bike', 'Bike'], ['drop', 'Drop-off']]) +
      '</div></div>' +
      '<p class="pl-src" id="pl-src"></p><p class="pl-why" id="pl-why" role="status" hidden></p>' +
      '<ul class="pl-basics"><li><b>Aug 5–8, 2027</b><span>Gates open Wed, Aug 4</span></li><li><b>Happy Valley, OR</b><span>12 miles from Portland</span></li><li><b>Camping included</b><span>Tents in the woods, with any 3- or 4-Day Pass</span></li></ul>' +
      '<ol class="pl-steps" id="pl-steps"></ol>' +
      '<p class="pl-packln"><button type="button" class="pl-tlink" data-go="step:pack">Packing list and camp rules →</button></p>' +
      '<section class="pl-paper pl-card pl-newc" id="pl-new" aria-labelledby="pl-h-new"><h2 class="pl-d pl-d-card" id="pl-h-new">What’s new for 2027</h2><hr class="pl-rule2"><ul class="pl-newl" id="pl-newl"></ul></section>' +
      '</div>' +
      '<div class="pl-nextwrap"><div class="pl-paper pl-next"><div><p class="pl-next-k" id="pl-nk"></p><p class="pl-next-t pl-d" id="pl-nt"></p><p class="pl-next-p"><b class="pl-num" id="pl-np"></b> <span id="pl-nn"></span></p></div><span id="pl-nb"></span></div></div>';
  }

  /* ---------- step pages: chip back, marker, title, the fact people get wrong, one case at a time, shared facts, photos, next ---------- */
  var MAPS = 'https://www.google.com/maps/search/?api=1&query=19208+SE+Foster+Rd%2C+Damascus%2C+OR+97089';
  function S(t, x) { return [t, x]; }
  var PAGES = {
    arrive: {
      n: 2, t: 'Arrive', line: 'How you get to the farm and through the gate.',
      fact: { k: 'Driving or dropped off with gear', t: '19208 SE Foster Rd', s: 'The Welcome Lot, Damascus, OR 97089', x: 'Don’t type “Pickathon” into your GPS. It sends you to the wrong gate.', b: '<a class="pk-cta sec pl-btn" href="' + MAPS + '" target="_blank" rel="noopener">Open in maps<span class="pl-vh"> (opens in a new tab)</span></a>' },
      q: 'How are you coming?',
      cases: [['drive', 'Drive'], ['shuttle', 'Shuttle'], ['bike', 'Bike'], ['drop', 'Dropped off'], ['fly', 'Fly']],
      steps: function (c, camp) {
        if (c === 'drive') return [S('Drive to the Welcome Lot', 'Use the address above. Carpool if you can; space is limited.'),
          S('Show your parking pass', 'Every car needs one: day, weekend or oversize. Leave and come back as often as you like.'),
          camp ? S('Load your gear on the trucks', 'At the Camphost Station in the lot, Wednesday to Saturday. Meet your bags at the Gear Drop nearest your camp.') : S('Walk or ride in', 'A one-mile trail to the gate, or the free parking shuttle, running until 2 am.'),
          camp ? S('Walk the trail in', 'About a mile to the gate, or ride the free parking shuttle.') : null].filter(Boolean);
        if (c === 'shuttle') return [S('Ride MAX to Lents Town Center', 'The Green Line. From Union Station, ride toward Clackamas Town Center.'),
          S('Walk to the shuttle sign', 'Turn right on SE Foster Rd, then right on SE 92nd Ave. The stop is in front of The ZED / Zoiglhaus (5716 SE 92nd Ave), not on the platform. Don’t park there: cars get towed.'),
          S('Show your Shuttle Pass', 'One for each rider over 12. The shuttle drops you at the gate. There is no parking at the stop.')];
        if (c === 'bike') return [S('Add a free Bicycle Pass', 'It saves room for one bike inside the grounds all weekend. It also works for the half-mile from the Welcome Lot to the gate.'),
          S('Ride the Springwater Corridor', 'About 11 miles from Reed College, mostly flat paths with some busier two-lane roads. Guided group rides with a gear truck post with the 2027 schedule. Questions: bike.pickathon@gmail.com.'),
          S('Lock up at the bike corral', 'A secure, monitored corral on site. Bikes have their own gear drop in the South Lot.')];
        if (c === 'drop') return [S('Can you carry everything?', 'Get dropped at the South Lot, 16581 SE Hagen Rd, at the Farmhouse entrance. Tell your driver to follow the “Pickathon Drop-Off” signs.'),
          S('Need the gear trucks?', 'Get dropped at the Welcome Lot instead and load your bags at the Camphost Station.'),
          S('Never get out on Hagen Rd', 'The main road isn’t safe for drop-offs.')];
        return [S('Land at PDX', 'The farm is about 20 minutes from the airport.'),
          S('Rideshare to the South Lot', 'About 25 minutes to 16581 SE Hagen Rd. Pick Dropped off above for the rest.'),
          S('Or ride MAX and the shuttle', 'Red Line to Gateway Transit Center, then the Green Line to Lents Town Center. Pick Shuttle above for the rest.')];
      },
      buy: { drive: 'Get a parking pass', shuttle: 'Get shuttle passes', bike: 'Add a Bicycle Pass' },
      shared: ['Gate hours', 'Last year’s hours. 2027 hours post in early summer.', [
        ['Wed', 'Early Arrival add-on: gates 5 pm to 10 pm'], ['Thu–Sun', 'Gates 9 am to 11 pm. You can leave any time, but you can’t drive in after the gates close.'],
        ['Mon', 'Everyone off the farm by noon'], ['Gear trucks out', 'Sun 8 am to 7 pm, Mon 8 am to noon. Drop gear 30 minutes before the end, in the pile marked TO WELCOME LOT. Bikes and ADA guests have their own pile.'],
        ['Shuttle', 'Thu–Sun 8 am to 2 am, Mon 8 am to 1 pm, about every 45 to 60 minutes'], ['ADA', 'ADA parking and drop-off are set up ahead: write info@pickathon.com two weeks out and show your placard.']]],
      next: 'sleep'
    },
    sleep: {
      n: 3, t: 'Sleep', line: 'Tents in the woods, a spot for your vehicle, or a bed nearby.',
      fact: { k: 'The one people get wrong', t: 'Your car stays in the lot', s: 'Tent camping is included with every 3-Day and 4-Day Pass', x: 'You can’t drive into the woods. Gear rides the trucks; sleeping in a vehicle needs a vehicle camping spot.', b: '' },
      factDay: { k: 'Day tickets', t: 'No camping on day tickets', s: 'Sleep at home or at a hotel nearby', x: 'Want to camp? A 3-Day or 4-Day Pass includes a tent site in the woods.', b: '' },
      q: 'Where will you sleep?',
      cases: [['woods', 'In the woods'], ['quiet', 'Quiet Camp'], ['vehicle', 'In a vehicle'], ['hotel', 'Hotel nearby']],
      steps: function (c) {
        if (c === 'woods') return [S('Pick Lush or Wild Camp', 'Lush Camp, east of the logging road: shaded, full of ferns, closest to the music. Wild Camp, west of it: the biggest trees on the farm, up on the ridge, more secluded.'),
          S('Come early for the best sites', 'Arrive Thursday, or add Wednesday Early Arrival to a 4-Day Pass.'),
          S('Let the trucks carry your gear', 'Label it and tie it down, then meet it at the Gear Drop nearest your site. Camp hosts can help you pick a site. Pack in containers you can carry from there.')];
        if (c === 'quiet') return [S('Inside Lush Camp', 'Quiet Camp is for families and anyone who wants a full night’s sleep.'),
          S('Quiet hours until 9 am', 'They run overnight, every night of the festival.'),
          S('Same pass, same trucks', 'Included with any 3-Day or 4-Day Pass. Gear rides in like everywhere else.')];
        if (c === 'vehicle') return [S('Get a vehicle camping spot', 'The Welcome Lot is for parking only. No sleeping in the lot.'),
          S('Willow Camp', 'An open field under a big willow, a half-mile walk or free shuttle from the gate. Car (16′ × 18′), camper van and RV spots. Power is an add-on for vans and RVs.'),
          S('South Camp', 'Right across from the main entrance. Van and RV spots include power. These sell out first.'),
          S('Park once', 'No generators, and once you’re parked you stay until Monday. Your pass sends you to the right gate.')];
        return [S('Book a room nearby', 'The Monarch Hotel, Clackamas (800-492-8700). Courtyard by Marriott Portland Southeast (503-652-2900). Sunnyside Inn & Suites (503-652-1500). Mt. Hood Territory and Travel Portland list more.'),
          S('Drive in each day', 'Park at the Welcome Lot. The free parking shuttle runs to the gate until 2 am, so you can stay for the late sets.'),
          S('Or leave the car', 'Rideshare to the South Lot, or ride MAX and the Pickathon Shuttle. See Arrive.')];
      },
      buy: { vehicle: 'Vehicle camping passes' },
      shared: ['In the camps', 'What’s there when you wake up.', [
        ['Water', 'Free filtered water stations through the campgrounds. Bring a bottle.'], ['Showers', 'Hot showers are a paid service at the Refuge. Bring a towel or rent one.'],
        ['Charging', 'A paid phone charging service on site. There are no public phones.'], ['Ice', 'Ice and collectible Pickathon cups are sold on site.'], ['Leaving', 'Break down camp and leave your gear at your Gear Drop on the logging road. Camp hosts haul it out; pick it up at the Welcome Lot or South Lot.'], ['Morning', 'Yoga and wellness in the Refuge; treatments book on site.']]],
      next: 'farm'
    },
    farm: {
      n: 4, t: 'At the farm', line: 'What it’s like once you’re through the gate.',
      fact: { k: 'Find your way', t: 'Twenty neighborhoods, one map', s: 'Stages, food, water, restrooms and camps', x: 'Tap any neighborhood for what’s there this year.', b: btn('Open the map', 'route:hoods', 'sec') },
      q: 'What do you want to know?',
      cases: [['kids', 'Kids'], ['food', 'Food and water'], ['access', 'Access']],
      steps: function (c) {
        if (c === 'kids') return [S('12 and under are free', 'With a ticketed adult. Teens 13 to 17 get a Teen Pass at half the 4-Day price.'),
          S('Coyote is their neighborhood', 'A festival within the festival for kids and their grownups, with its own stage all weekend.'),
          S('Pick a meeting spot', 'Choose one when you arrive, like a water station on the map.')];
        if (c === 'food') return [S('Leave the cooler at home', 'Food and drink vendors serve all weekend. Bring a card or cash, and your ID for a drink.'),
          S('Water is free', 'Refill your bottle at stations all over the farm.'),
          S('Real cups and plates', 'Pickathon dropped plastic in 2010 and single-use dishes in 2011. Steel cups are yours all weekend; dishes are washed on site.'),
          S('Solar and compost', 'A solar array on the Galaxy Barn roof offsets all the barn’s festival power. Volunteers sort recycling and compost all weekend. Bike and transit riders get incentives.')];
        return [S('Write us two weeks ahead', 'info@pickathon.com, to arrange accommodations.'),
          S('What we provide', 'ADA parking and campsites and accessible restrooms. Service animals, wheelchairs and electric scooters are welcome.'),
          S('What we don’t', 'Wheelchairs, hearing aids, personal assistance or interpreters.'),
          S('Plan for the ground', 'Natural, uneven ground with hills and long walks between neighborhoods. The trail down to the Woods is steep.')];
      },
      buy: {},
      shared: ['How the days run', 'The 2027 set times post closer to the festival.', [
        ['Day', 'Shows start in the shaded woods while the sun is hot.'], ['Night', 'The crowds move to the open meadows under the stars.'],
        ['Twice', 'Most bands play twice, on two different stages, so one day still gets you a big slice of the lineup.']]],
      next: ''
    }
  };
  function pickCase(step) {
    var P = PAGES[step], v = views()[step], ok = function (c) { return P.cases.some(function (x) { return x[0] === c; }); }, e = effective();
    if (stepCase && ok(stepCase)) return stepCase;
    if (step === 'arrive') return ok(v) && v === 'fly' ? 'fly' : e.go;
    if (step === 'sleep') { if (!e.camp) return 'hotel'; if (e.veh) return 'vehicle'; return ok(v) && v !== 'vehicle' && v !== 'hotel' ? v : 'woods'; }
    return ok(v) ? v : 'kids';
  }
  function stripHTML(step) { var L = STRIP[step] || []; if (!L.length) return ''; return '<div class="pl-strip" aria-label="Photos"><ul>' + L.map(function (s) { return '<li>' + img(s, 'pl-strip-img') + '</li>'; }).join('') + '</ul></div>'; }
  function backChip(label) { return '<button type="button" class="pk-sqb pl-chip pl-back" data-go="step:">' + ic('chev', 'pl-ic-sm pl-back-ic') + '<span>' + esc(label || 'Plan your trip') + '</span></button>'; }
  function stepHTML(step) {
    var P = PAGES[step], e = effective(), c = pickCase(step), day = !e.camp;
    var F = (step === 'sleep' && day) ? P.factDay : P.fact;
    var steps = P.steps(c, e.camp), buy = P.buy[c];
    var nx = P.next ? PAGES[P.next] : null;
    return '<div class="pl-in pl-page">' + backChip() +
      '<p class="pl-mark">' + P.n + ' of 4 · ' + P.t + '</p>' +
      '<h1 class="pl-d pl-h1">' + P.t + '</h1><p class="pl-lede">' + esc(P.line) + '</p>' +
      '<section class="pl-fact" aria-label="' + esc(F.k) + '"><p class="pl-fact-k">' + esc(F.k) + '</p><p class="pl-d pl-fact-t">' + esc(F.t) + '</p><p class="pl-fact-s">' + esc(F.s) + '</p><p class="pl-fact-x">' + esc(F.x) + '</p>' + (F.b ? '<div class="pl-fact-b">' + F.b + '</div>' : '') + '</section>' +
      '<div class="pl-cols2"><div>' +
      '<h2 class="pl-kick" id="pl-q">' + esc(P.q) + '</h2><div class="pl-chips2" role="radiogroup" aria-labelledby="pl-q">' +
        P.cases.map(function (x) { var dis = step === 'sleep' && day && x[0] !== 'hotel'; var on = x[0] === c; return '<button type="button" class="pk-sqb pl-chip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '"' + (dis ? ' disabled aria-disabled="true"' : '') + ' data-case="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
      '<ol class="pl-num-steps">' + steps.map(function (s, i) { return '<li><span class="pl-ring pl-d">' + (i + 1) + '</span><div><p class="pl-st-t">' + esc(s[0]) + '</p><p class="pl-st-x">' + esc(s[1]) + '</p></div></li>'; }).join('') + '</ol>' +
      (buy ? '<div class="pl-buy">' + btn(buy, 'route:tickets') + '</div>' : '') +
      '</div><section class="pl-paper pl-card pl-shared" aria-labelledby="pl-h-sh"><h2 class="pl-d pl-d-card" id="pl-h-sh">' + esc(P.shared[0]) + '</h2><hr class="pl-rule2"><p class="pl-sh-s">' + esc(P.shared[1]) + '</p><ul class="pl-newl">' +
        P.shared[2].map(function (r) { return '<li><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>'; }).join('') + '</ul></section></div>' +
      stripHTML(step) +
      '<div class="pl-nextln">' + (nx ? '<button type="button" class="pl-tlink pl-nx" data-go="step:' + P.next + '">Next: ' + esc(nx.t) + ' →</button>' : '<button type="button" class="pl-tlink pl-nx" data-go="step:pack">Last thing: packing list and camp rules →</button>') + '</div>' +
      '</div>';
  }
  /* packing: its own page (Zale, Nov 13) */
  function packHTML() {
    var e = effective();
    var every = ['Walking shoes: the farm is dusty and hilly', 'Layers for hot days and cool nights', 'Sunscreen, a hat and sunglasses', 'A water bottle to refill free', 'A steel cup (sold on site, or bring yours)', 'ID and a card or cash', 'A battery pack: service is fine, but there are no public phones', 'A low chair or a blanket'];
    var camp = ['Pack light: most of what you need is on site', 'Pack in containers you can carry from the Gear Drop to your site, anywhere from 10 yards to a third of a mile', 'A camp stove only with extreme care', 'A yoga mat for the morning classes'];
    return '<div class="pl-in pl-page">' + backChip() +
      '<h1 class="pl-d pl-h1">What to pack</h1><p class="pl-lede">Everything else is on the farm. Skip the cooler: food and drink are on site all weekend.</p>' +
      '<div class="pl-cols2"><div><h2 class="pl-kick">Everyone</h2><ul class="pl-list">' + every.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (e.camp ? '<h2 class="pl-kick">Tent campers</h2><ul class="pl-list">' + camp.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>' +
      '<section class="pl-paper pl-card" aria-labelledby="pl-h-rules"><h2 class="pl-d pl-d-card" id="pl-h-rules">The rules</h2><hr class="pl-rule2">' +
        '<div class="pl-rule"><p>Bring</p><ul><li>' + ic('bottle') + 'Water bottle</li><li>' + ic('id') + 'ID</li><li>' + ic('jacket') + 'Layers</li><li>' + ic('chair') + 'Low chair</li></ul></div>' +
        '<div class="pl-rule pl-rule-no"><p>Leave home</p><ul><li><span>' + ic('dog') + '</span>Pets</li><li><span>' + ic('mug') + '</span>Outside alcohol</li><li><span>' + ic('flame') + '</span>Fires, fireworks</li><li><span>' + ic('shade') + '</span>Shade tents</li><li><span>' + ic('gen') + '</span>Generators</li></ul></div>' +
        '<p class="pl-rule-x">Security checks vehicles at entry. Chairs left alone become shared seating. Firearms are not allowed.</p>' +
      '</section></div>' +
      '<div class="pl-nextln"><button type="button" class="pl-tlink pl-nx" data-go="step:arrive">Next: Arrive →</button></div></div>';
  }

  var stepNow = '', stepCase = '';
  function topEntry() { try { var s = site().stack; return s[s.length - 1] || {}; } catch (e) { return {}; } }
  function update() {
    if (!root) return;
    if (stepNow) { var y = 0; try { y = window.scrollY; } catch (x) {} root.innerHTML = stepNow === 'pack' ? packHTML() : stepHTML(stepNow); guard(root); return; }
    if (!$('#pl-steps', root)) return;
    var e = effective(), why = [];
    var L = $('#pl-len', root), SL = $('#pl-sleep', root), G = $('#pl-go', root);
    if (!e.camp && want.sleep !== 'none') why.push('<b>' + LEN_T[e.len] + '</b> tickets have no camping, so Sleeping shows Off site. Your pick comes back with a 3 or 4 day pass.');
    if (e.veh && want.go !== 'drive') why.push('<b>' + (e.sleep === 'car' ? 'Car camping' : 'An RV spot') + ' means you drive in</b>, so Getting there shows Driving. ' + { shuttle: 'Shuttle', bike: 'Bike', drop: 'Drop-off' }[want.go] + ' comes back if you switch to a tent.');
    L.value = e.len; SL.value = e.sleep; G.value = e.go;
    [].forEach.call(SL.options, function (o) { o.disabled = !e.camp && o.value !== 'none'; });
    [].forEach.call(G.options, function (o) { o.disabled = e.veh && o.value !== 'drive'; });
    var wy = $('#pl-why', root); wy.hidden = !why.length; wy.innerHTML = why.join('<br>');
    $('#pl-steps', root).innerHTML = cardsHTML();
    $('#pl-newl', root).innerHTML = newHTML();
    var on = orderNow(), k = $('#pl-nk', root), t = $('#pl-nt', root), p = $('#pl-np', root), n = $('#pl-nn', root);
    if (on.real) {
      var tt = totals(on.o); k.textContent = 'Your order so far'; t.textContent = short(on.o); p.textContent = money(tt.total); n.textContent = 'fee included';
      $('#pl-src', root).innerHTML = 'Filled in from <b>your ticket order</b>. Change anything; your order stays as it is.';
    } else {
      var ex = { pass: e.len, day: 'dsat', adult: 2, teen: 0, kid: 0, wed: false, sleep: e.camp ? SLEEP_OUT[e.sleep] : 'none', go: e.go, car: 1, patron: false }, te = totals(ex);
      k.textContent = 'Example for two adults';
      t.textContent = LEN_T[e.len] + ', ' + { tent: 'tent', car: 'car camp', rv: 'RV', none: 'no camping' }[e.sleep] + ', ' + { drive: e.veh ? 'driving' : '1 car', shuttle: 'shuttle', bike: 'bike', drop: 'drop-off' }[e.go];
      p.textContent = money(te.total); n.textContent = 'fee included' + (e.len === 'd1' ? ', Saturday' : '');
      $('#pl-src', root).textContent = 'Pick your three. Saved on this device, used on every step and on Tickets.';
    }
    $('#pl-nb', root).innerHTML = closeBtn();
    guard(root);
  }
  function draw(el) {
    root = el; readTix(); want = startWant();
    var t = topEntry(), s = String(t.step || ''); stepNow = (STEPS.indexOf(s) >= 0 || s === 'pack') ? s : ''; stepCase = String(t.c || '');
    if (stepCase && stepNow) setView(stepNow, stepCase);
    el.classList.toggle('pl-onstep', !!stepNow);
    if (stepNow) { update(); return; }
    el.innerHTML = hubHTML();
    update();
  }
  function doFocus() {
    if (!focusReq || !root) return; var f = focusReq; focusReq = '';
    var tgt = f === 'new' ? $('#pl-new', root) : null; if (!tgt) return;
    setTimeout(function () { try { tgt.scrollIntoView({ block: 'start' }); } catch (x) {} }, 60);
  }
  function chooseCase(c) {
    if (!stepNow || stepNow === 'pack') return;
    stepCase = '';
    if (stepNow === 'arrive' && c !== 'fly') { want.go = c; persist(effective()); }
    if (stepNow === 'sleep') { if (c === 'vehicle') { if (want.sleep !== 'car' && want.sleep !== 'rv') want.sleep = 'car'; } else if (c === 'woods' || c === 'quiet') want.sleep = 'tent'; persist(effective()); }
    setView(stepNow, c); update();
    try { var b = root.querySelector('.pl-chip.on'); if (b) b.focus({ preventScroll: true }); } catch (x) {}
  }
