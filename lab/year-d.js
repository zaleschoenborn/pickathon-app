/* Pickathon year page, version D. TEST ONLY. Reads ../data.json; changes nothing. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var nk = function (x) { return String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, ''); };

  /* Signature artist per year. Everything shown about them (class, first year, line, Grammy, photo) is read from data.json. */
  var PICK = {
    2002: { a: 'Danny Barnes' }, 2004: { a: 'Danny Barnes' }, 2005: { a: 'Jolie Holland', pos: '50% 38%' },
    2006: { a: 'The Avett Brothers' }, 2007: { a: 'Langhorne Slim' }, 2008: { a: 'The Cave Singers' }, 2009: { a: 'Dr. Dog' },
    2010: { a: 'Punch Brothers' }, 2011: { a: 'Future Islands' }, 2012: { a: 'The War on Drugs' }, 2013: { a: 'Sturgill Simpson' },
    2014: { a: 'Mac DeMarco' }, 2015: { a: 'Leon Bridges' }, 2016: { a: 'Margo Price' },
    2017: { a: 'Charles Bradley & His Extraordinaires', show: 'Charles Bradley' }, 2018: { a: 'Black Pumas' }, 2019: { a: 'Tyler Childers' },
    2022: { a: 'Wet Leg' }, 2023: { a: 'MJ Lenderman' }, 2024: { a: 'Geese' }, 2025: { a: 'Taj Mahal' }
  };
  /* No usable archive photo of any act from these years: a typographic card with the headline act from the year's headline. */
  var CARD = { 2000: 'Kelly Joe Phelps', 2001: 'Laurie Lewis & Tom Rozum', 2003: 'Otis Taylor' };
  /* Wide scene shot per year, chosen from d.yearHero[year]. 2008 and 2009 have none and borrow 2007. */
  var SCENE = {
    2006: 'i/p9800.jpg', 2007: 'i/p9801.jpg', 2008: ['2007', 'i/p9801.jpg'], 2009: ['2007', 'i/p9801.jpg'], 2010: 'i/p9804.jpg', 2011: 'i/p9808.jpg', 2012: 'i/p9813.jpg',
    2013: 'i/p9819.jpg', 2014: 'i/p9821.jpg', 2015: 'i/p9825.jpg', 2016: 'i/p9829.jpg', 2017: 'i/p9832.jpg', 2018: 'i/p9836.jpg', 2019: 'i/p9841.jpg',
    2022: 'i/pk-yr2022-5.jpg', 2023: 'i/pk-yr2023-1.jpg', 2024: 'i/p9852.jpg', 2025: 'i/p9857.jpg'
  };
  var SCENEPOS = { 2013: '50% 40%', 2016: '50% 62%', 2022: '50% 60%', 2023: '50% 55%', 2024: '50% 70%', 2019: '50% 70%', 2017: '50% 75%', 2007: '50% 60%', 2008: '50% 60%', 2009: '50% 60%' };

  var D, YEARS = [], cur = '2017', FY = {};

  function firstSentence(t) { var s = (t || '').split(/(?<=[.!?])\s+(?=[A-Z"])/)[0] || ''; return s.length > 190 ? s.slice(0, 187).replace(/\s+\S*$/, '') + '…' : s; }

  function findAct(name) {
    var k = nk(name), r = { name: name };
    (D.past.deep || []).forEach(function (x) { if (!r.deep && nk(x.n) === k) r.deep = x; });
    (D.deepcuts || []).forEach(function (x) { if (!r.dc && nk(x.n) === k) r.dc = x; });
    r.leg = (D.legpi || {})[name] || null;
    var loc = function (u) { return /^i\//.test(u || '') ? u : ''; };
    var po = (D.photoOf || {})[name] || '';
    var cands = [[loc(r.deep && r.deep.pi), r.deep && r.deep.pyr], [loc(po), 0], [loc(r.dc && r.dc.pi), r.dc && r.dc.pyr], [loc(r.leg && r.leg.i), r.leg && +r.leg.y]];
    r.photo = ''; r.pyr = 0;
    for (var ci = 0; ci < cands.length; ci++) { if (cands[ci][0]) { r.photo = cands[ci][0]; r.pyr = cands[ci][1] || 0; break; } }
    r.by = (r.leg && r.leg.by) || '';
    r.line = (r.deep && r.deep.l) || (r.dc && r.dc.line) || (D.legacc || {})[name] || '';
    var G = D.grammys || {};
    r.gw = (G.w || []).some(function (n) { return nk(n) === k || nk(n.replace(/ & .*/, '')) === k; });
    r.gn = !r.gw && (G.n || []).some(function (n) { return nk(n) === k; });
    // class: legend flag or legend list wins, then Discovery tiers h/b/r, otherwise Deep cut
    var isLeg = (r.deep && (r.deep.lg || r.deep.t === 'x')) || (r.leg && !r.deep);
    r.cls = isLeg ? 'Legend' : (r.deep && /^[hbr]$/.test(r.deep.t)) ? 'Discovery' : 'Deep cut';
    r.fy = FY[k] || 0;
    return r;
  }

  function load(cb) {
    fetch('../data.json').then(function (r) { return r.json(); }).then(function (d) {
      D = d;
      D.past.years.forEach(function (yo) {
        if (!/^\d{4}$/.test(yo.y)) return;
        (yo.all || []).concat(yo.names || []).forEach(function (n) { var k = nk(n); FY[k] = Math.min(FY[k] || 9999, +yo.y); });
      });
      // special: renamed/combined entries
      FY[nk('Charles Bradley & His Extraordinaires')] = FY[nk('Charles Bradley & His Extraordinaires')] || 2017;
      YEARS = D.past.years.map(function (o) { return o.y; }).filter(function (y) { return /^\d{4}$/.test(y) && +y >= 2000 && +y <= 2025; }).sort();
      cb();
    }).catch(function (e) { $('#app').innerHTML = '<p style="padding:24px">Could not load data.json. ' + esc(e && e.message) + '</p>'; });
  }

  function img(src, cls, alt, pos) { return '<img class="' + cls + '" src="' + esc(src) + '" alt="' + esc(alt || '') + '"' + (pos ? ' style="object-position:' + pos + '"' : '') + ' decoding="async">'; }

  function render(y, push) {
    if (YEARS.indexOf(y) < 0) y = '2017';
    cur = y;
    var Y = +y, po = D.past.years.filter(function (o) { return o.y === y; })[0] || {}, arc = (D.arc || {})[y] || {};
    var names = (po.all && po.all.length ? po.all : po.names) || [];
    var hook = arc.th || po.note || '';
    var lede = arc.lu || firstSentence(arc.ln) || '';
    var pk = PICK[Y], act = pk ? findAct(pk.a) : null;
    if (act && !act.photo) act = null;
    var photoHtml, capHtml = '', cardCls = '', cardShown = {};
    if (act) {
      var disp = pk.show || act.name;
      var kc = act.cls === 'Legend' ? 'leg' : act.cls === 'Deep cut' ? 'dc' : '';
      var yearsLine = act.fy === Y ? 'First Pickathon ' + Y : 'On the ' + Y + ' bill · first Pickathon ' + act.fy;
      var aw = act.gw ? ' · Grammy winner' : act.gn ? ' · Grammy nominee' : '';
      var cred = act.by ? 'Photo: ' + act.by : (act.pyr && act.pyr !== Y ? 'Photo from Pickathon ' + act.pyr : '');
      photoHtml = img('../' + act.photo, 'ph', disp + ' at Pickathon', pk.pos) + '<div class="shade"></div><div class="cred">' + esc(cred) + '</div>';
      capHtml = '<figcaption><span class="cls ' + kc + '">' + act.cls + '</span><h2 class="who">' + esc(disp) + '</h2><div class="meta">' + esc(yearsLine + aw) + '</div>' + (act.line ? '<p class="why">' + esc(act.line) + '</p>' : '') + '</figcaption>';
    } else {
      var hn = CARD[Y] || names[0] || '';
      var rest = names.filter(function (n) { return n !== hn && nk(n) !== nk(hn.split(' & ')[0]); }).slice(0, 4);
      cardCls = ' isCard'; cardShown[nk(hn)] = 1; rest.forEach(function (n) { cardShown[nk(n)] = 1; }); names.forEach(function (n) { if (nk(n) === nk(hn.split(' & ')[0]) || nk(hn).indexOf(nk(n)) === 0) cardShown[nk(n)] = 1; });
      photoHtml = '<div class="card"><span class="cls on" style="align-self:flex-start;color:#12160F">On the ' + Y + ' bill</span><b>' + esc(hn) + '</b><i></i><span>' + esc(rest.join('  ·  ')) + '</span></div><div class="shade"></div>';
    }
    // scene
    var sc = SCENE[Y], scHtml = '';
    if (sc) {
      var from = '', path = sc;
      if (Array.isArray(sc)) { from = sc[0]; path = sc[1]; }
      scHtml = '<figure class="scene">' + img('../' + path, '', 'The farm during Pickathon ' + (from || y), SCENEPOS[Y]) + '<figcaption>' + (from ? 'The farm, from ' + from : 'The scene · ' + y) + '</figcaption></figure>';
    } else {
      scHtml = '<p class="bill"><b>Also on the bill</b>' + esc(names.filter(function (n) { return (!act || nk(n) !== nk(act.name)) && !(cardShown[nk(n)]); }).slice(0, 8).join(', ')) + '</p>';
    }
    var html = '<figure class="sig' + cardCls + '">' + photoHtml + capHtml + '</figure>' +
      '<section class="side" aria-label="Pickathon ' + y + '"><div class="head"><div class="k">Pickathon</div><h1 class="yr">' + y + '</h1></div>' +
      (hook ? '<p class="hook">' + esc(hook) + '</p>' : '') + (lede ? '<p class="lede">' + esc(lede) + '</p>' : '') + scHtml +
      '<a class="open" href="../?y=' + y + '">Open the full ' + y + ' page <span aria-hidden="true">→</span></a></section>';
    $('#app').innerHTML = html;
    document.title = 'Pickathon ' + y + ' (TEST)';
    // switcher
    var row = $('#row'), i = YEARS.indexOf(y);
    row.innerHTML = YEARS.map(function (v, j) { return (v === '2022' ? '<span class="gap" aria-hidden="true"></span>' : '') + '<button role="listitem" data-y="' + v + '"' + (v === y ? ' aria-current="true"' : '') + '>' + v + '</button>'; }).join('');
    row.querySelectorAll('button').forEach(function (b) { b.onclick = function () { go(b.dataset.y); }; });
    $('#prev').disabled = i <= 0; $('#next').disabled = i >= YEARS.length - 1;
    var on = row.querySelector('[aria-current]');
    if (on) { var tgt = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; row.scrollLeft = Math.max(0, tgt); }
    if (push) { try { history.pushState({ y: y }, '', '?y=' + y); } catch (e) {} }
    document.documentElement.setAttribute('data-ready', y);
  }
  function go(y) { render(y, true); }
  function boot() {
    var q = new URLSearchParams(location.search).get('y') || '2017';
    render(q, false);
    $('#prev').onclick = function () { var i = YEARS.indexOf(cur); if (i > 0) go(YEARS[i - 1]); };
    $('#next').onclick = function () { var i = YEARS.indexOf(cur); if (i < YEARS.length - 1) go(YEARS[i + 1]); };
    document.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') $('#prev').click(); else if (e.key === 'ArrowRight') $('#next').click(); });
    window.addEventListener('popstate', function () { render(new URLSearchParams(location.search).get('y') || '2017', false); });
  }
  document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG') t.style.opacity = '0'; }, true);
  load(boot);
})();
