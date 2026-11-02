/* Pickathon Past, year page prototypes. Shared data, film queue, player, year strip. TEST ONLY. */
(function () {
  var LAB = window.LAB = {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  LAB.esc = esc; LAB.el = el; LAB.$ = $;
  var nk = function (x) { return String(x || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, ''); };
  var short = function (y) { return y === '2020–2021' ? '2020–21' : y; };
  var SKIP_STAGE = /^(Live and Breathing|Spoken|Laugh|Imagine|Seriously\?|Broadcast|Curation|Workshop Barn|Mountain)$/;
  var stageOf = function (vn) { if (!vn || SKIP_STAGE.test(vn)) return ''; if (/Barn|Sessions|Stage$/.test(vn)) return vn; if (vn === 'Slab' || vn === 'On The Farm') return vn + ' Sessions'; return vn + ' Stage'; };
  var PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  LAB.PLAY_ICON = PLAY_ICON;
  LAB.capOf = function (c) { return c.a + (c.st ? ', ' + c.st : '') + '. Pickathon ' + c.fy; };

  /* ---------- data ---------- */
  function build(d, key) {
    var yrs = d.past.years.filter(function (o) { return o.y !== '2026'; });
    var order = yrs.map(function (o) { return o.y; });
    var idx = order.indexOf(key);
    var M = { y: key, label: short(key), order: order, idx: idx, d: d };
    var po = yrs[idx] || {};
    var arc = (d.arc && d.arc[key]) || {};
    var hero = (d.yearHero && d.yearHero[key] && d.yearHero[key][0]) || po.img || '';
    if (/2026/.test(hero)) hero = '';
    M.hero = hero ? '../' + hero : '';
    M.th = arc.th || '';
    M.full = arc.ln || '';
    var first = (arc.ln || '').split(/(?<=[.!?])\s+(?=[A-Z])/)[0] || '';
    M.line = first || po.note || '';
    M.count = po.count || 0;
    M.names = (po.all && po.all.length ? po.all : po.names) || [];
    M.stories = po.stories || [];
    M.arcf = arc.f || [];
    M.firsts = (d.firsts && d.firsts[key]) || [];
    M.press = (d.press && d.press[key]) || [];
    M.film = filmq(d, key);
    M.still = !M.film.has;
    return M;
  }

  function filmq(d, key) {
    var none = { has: false, q: [], ch: [] };
    if (!/^(19|20)\d\d$/.test(key)) return none;
    var Y = +key; if (Y >= 2025) return none;
    // first year per artist, years played, legend and deep-cut flags
    var FYL = {}, CNT = {}, LEG = {}, DC = {};
    d.past.years.forEach(function (yo) {
      if (!/^(19|20)\d\d$/.test(yo.y) || +yo.y > 2025) return;
      var seen = {};
      (yo.all || []).concat(yo.names || []).forEach(function (n) { var k = nk(n); if (seen[k]) return; seen[k] = 1; FYL[k] = Math.min(FYL[k] || 9999, +yo.y); CNT[k] = (CNT[k] || 0) + 1; });
    });
    (d.past.deep || []).forEach(function (x) { var k = nk(x.n); (x.y || []).forEach(function (yy) { if (+yy < 2026) FYL[k] = Math.min(FYL[k] || 9999, +yy); }); if (x.lg || (x.t === 'x' && /Already a name/.test(x.l || ''))) LEG[k] = 1; });
    Object.keys(d.legpi || {}).forEach(function (n) { LEG[nk(n)] = 1; });
    (d.deepcuts || []).forEach(function (x) { DC[nk(x.n)] = 1; });
    var seen = {}, list = [];
    (d.videos || []).filter(function (v) {
      return !v.cad && !v.f && !v.nonact && !v.cur && !v.t && v.a && !/^&|^pickathon$/i.test(v.a) && v.y === Y && v.y < 2025 && (v.vm ? v.th : v.id);
    }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); }).forEach(function (v) { var k = nk(v.a); if (k && !seen[k]) { seen[k] = 1; list.push({ k: k, v: v }); } });
    if (list.length < 6) return none;
    var mk = function (x) {
      var v = x.v, fy = Math.min(FYL[x.k] || 9999, v.y);
      return { id: v.id, vm: v.vm || '', vh: v.vh || '', a: v.a, st: stageOf(v.vn), fy: fy, y: v.y, s: (v.s || '').split(/\s+[-–|·]\s+/)[0], k: x.k,
        img: v.vm ? v.th : 'https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg', photo: (d.photoOf && d.photoOf[v.a]) ? '../' + d.photoOf[v.a] : '' };
    };
    var open = mk(list[0]), rest = list.slice(1);
    var G = [
      ['Heard here first', 'Their first year at the farm.', function (x) { return !LEG[x.k] && (FYL[x.k] || 0) >= Y && (CNT[x.k] || 0) < 3; }],
      ['The ones who stayed', 'Back again and again.', function (x) { return LEG[x.k] || (CNT[x.k] || 0) >= 3; }],
      ['Deep cuts', 'Worth a second listen.', function (x) { return DC[x.k]; }],
      ['More from the summer', '', function () { return true; }]
    ];
    var used = {};
    var ch = G.map(function (g) {
      var L = rest.filter(function (x) { return !used[x.k] && g[2](x); }).slice(0, 8);
      L.forEach(function (x) { used[x.k] = 1; });
      return { title: g[0], cap: g[1], clips: L.map(mk) };
    }).filter(function (c) { return c.clips.length >= 2; });
    var q = [open]; ch.forEach(function (c) { c.clips.forEach(function (z) { q.push(z); }); });
    return { has: q.length >= 6, q: q, ch: ch, open: open };
  }
  LAB.indexOf = function (q, c) { return q.indexOf(c); };

  /* ---------- player ---------- */
  var ytP = null, vmP = null;
  function ytApi() {
    if (ytP) return ytP;
    ytP = new Promise(function (res, rej) {
      if (window.YT && YT.Player) return res();
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} res(); };
      var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = rej; document.head.appendChild(s);
      setTimeout(function () { rej(new Error('yt timeout')); }, 7000);
    });
    return ytP;
  }
  function vmApi() {
    if (vmP) return vmP;
    vmP = new Promise(function (res, rej) {
      if (window.Vimeo && Vimeo.Player) return res();
      var s = document.createElement('script'); s.src = 'https://player.vimeo.com/api/player.js'; s.onload = function () { res(); }; s.onerror = rej; document.head.appendChild(s);
      setTimeout(function () { rej(new Error('vm timeout')); }, 7000);
    });
    return vmP;
  }
  /* Player: mounts into `stage`, plays q from index i, advances on end. */
  LAB.Player = function (stage, q, start, opts) {
    opts = opts || {};
    var i = start || 0, yt = null, vp = null, tok = 0, self = this;
    function clear() {
      tok++;
      try { if (yt && yt.destroy) yt.destroy(); } catch (e) {}
      try { if (vp && vp.destroy) vp.destroy(); } catch (e) {}
      yt = vp = null; stage.innerHTML = '';
    }
    function fallbackFrame(c, slot) {
      var f = el('iframe'); f.src = c.vm ? 'https://player.vimeo.com/video/' + c.vm + (c.vh ? '?h=' + c.vh + '&' : '?') + 'autoplay=1&playsinline=1&dnt=1' : 'https://www.youtube.com/embed/' + c.id + '?autoplay=1&cc_load_policy=0&rel=0&playsinline=1&modestbranding=1&enablejsapi=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; f.allowFullscreen = true; f.title = LAB.capOf(c);
      slot.innerHTML = ''; slot.appendChild(f);
    }
    function load(n) {
      if (n < 0) return;
      if (n >= q.length) { if (opts.onend) opts.onend(); return; }
      i = n; clear();
      var my = tok, c = q[n], slot = el('div', 'lp-slot'); stage.appendChild(slot);
      if (opts.onchange) opts.onchange(i, c);
      if (c.vm) {
        var f = el('iframe'); f.src = 'https://player.vimeo.com/video/' + c.vm + (c.vh ? '?h=' + c.vh + '&' : '?') + 'autoplay=1&playsinline=1&dnt=1';
        f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = LAB.capOf(c);
        slot.appendChild(f);
        vmApi().then(function () { if (my !== tok) return; vp = new Vimeo.Player(f); vp.on('ended', function () { if (my === tok) load(i + 1); }); }).catch(function () {});
      } else {
        var host = el('div'); slot.appendChild(host);
        ytApi().then(function () {
          if (my !== tok) return;
          yt = new YT.Player(host, { videoId: c.id, width: '100%', height: '100%',
            playerVars: { autoplay: 1, cc_load_policy: 0, rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, fs: 1, origin: location.origin },
            events: { onStateChange: function (e) { if (my === tok && e.data === 0) load(i + 1); }, onError: function () { if (my === tok) load(i + 1); } } });
        }).catch(function () { if (my === tok) fallbackFrame(c, slot); });
      }
    }
    this.load = load; this.next = function () { load(i + 1); }; this.prev = function () { load(i - 1); };
    this.index = function () { return i; }; this.destroy = clear;
    load(i);
  };

  /* Full-screen overlay. q = queue, i = start index, label = e.g. "Pickathon 2019". */
  LAB.play = function (q, i, label) {
    if (!q || !q.length) return;
    var prevFocus = document.activeElement, prevOv = document.body.style.overflow;
    var ov = el('div', 'lp-ov'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', label + ' film');
    ov.innerHTML = '<div class="lp-top"><b>' + esc(label) + '</b><span class="sp"></span><button class="x" aria-label="Close film">×</button></div><div class="lp-stage"></div><div class="lp-cap"><button class="lp-btn pv" aria-label="Previous clip">‹ Back</button><div class="t"><div class="n"></div><div class="s"></div></div><button class="lp-btn nx" aria-label="Next clip">Next ›</button></div>';
    document.body.appendChild(ov); document.body.style.overflow = 'hidden';
    var stage = $('.lp-stage', ov), n = $('.n', ov), s = $('.s', ov), pv = $('.pv', ov), nx = $('.nx', ov);
    var P = new LAB.Player(stage, q, i, { onchange: function (k, c) { n.textContent = LAB.capOf(c); s.textContent = c.s || ''; pv.disabled = k === 0; nx.disabled = k === q.length - 1; }, onend: close });
    function close() { P.destroy(); document.removeEventListener('keydown', key); ov.remove(); document.body.style.overflow = prevOv; try { prevFocus && prevFocus.focus(); } catch (e) {} }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    $('.x', ov).onclick = close; pv.onclick = function () { P.prev(); }; nx.onclick = function () { P.next(); };
    $('.x', ov).focus();
  };

  /* ---------- sheets ---------- */
  function sheet(title, inner) {
    var prevFocus = document.activeElement;
    var sh = el('div', 'sheet'); sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', title);
    sh.innerHTML = '<div class="box"><button class="x" aria-label="Close">×</button>' + inner + '</div>';
    document.body.appendChild(sh);
    function close() { document.removeEventListener('keydown', key); sh.remove(); try { prevFocus && prevFocus.focus(); } catch (e) {} }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    sh.addEventListener('click', function (e) { if (e.target === sh) close(); });
    $('.x', sh).onclick = close; $('.x', sh).focus();
    return sh;
  }
  LAB.openStory = function (M) {
    var h = '<h2>Pickathon ' + esc(M.label) + '</h2>';
    if (M.th) h += '<p style="font-family:var(--disp);font-weight:600;font-size:20px;color:var(--gold)">' + esc(M.th) + '</p>';
    if (M.full) h += '<p>' + esc(M.full) + '</p>';
    var li = function (a) { return a.map(function (x) { var u = x.src || x.u; return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a>' : esc(x.t)) + '</li>'; }).join(''); };
    if (M.arcf.length) h += '<h3>That summer</h3><ul>' + li(M.arcf) + '</ul>';
    if (M.firsts.length) h += '<h3>Firsts that year</h3><ul>' + li(M.firsts) + '</ul>';
    if (M.press.length) h += '<h3>In the press</h3><ul>' + li(M.press) + '</ul>';
    if (M.stories.length) h += '<h3>From the blog</h3><ul>' + li(M.stories.slice(0, 5)) + '</ul>';
    sheet('Story', h);
  };
  LAB.openYears = function (M) {
    var h = '<h2>All years</h2><div class="ygrid">' + M.order.map(function (y) { return '<a href="?y=' + encodeURIComponent(y) + '"' + (y === M.y ? ' class="on" aria-current="page"' : '') + '>' + esc(short(y)) + '</a>'; }).join('') + '</div>';
    sheet('All years', h);
  };

  /* ---------- chrome ---------- */
  LAB.chrome = function (M) {
    var top = $('.top');
    top.innerHTML = '<a class="brand" href="./">Pickathon Past</a><span class="sub">Year page prototype</span><span class="sp"></span><a class="menu" href="./">All three</a><span class="test">TEST</span>';
    var s = $('.strip'), o = M.order, i = M.idx;
    var older = o[i + 1], newer = o[i - 1];
    var lk = function (y, dir) { return y ? '<a href="?y=' + encodeURIComponent(y) + '" aria-label="' + (dir < 0 ? 'Older year ' : 'Newer year ') + short(y) + '">' + (dir < 0 ? '‹ ' + short(y) : short(y) + ' ›') + '</a>' : '<a aria-disabled="true" tabindex="-1">' + (dir < 0 ? '‹' : '›') + '</a>'; };
    s.innerHTML = lk(older, -1) + '<span class="cur" aria-current="page">' + esc(M.label) + '</span>' + lk(newer, 1) + '<button class="all" aria-haspopup="dialog">All years</button>';
    $('.all', s).onclick = function () { LAB.openYears(M); };
    document.title = 'Pickathon ' + M.label + ' (TEST)';
  };

  /* ---------- still version (shared) ---------- */
  LAB.renderStill = function (M, root) {
    var names = M.names.slice(0, 40).map(esc).join('<i>·</i>');
    var h = '<section class="still" aria-label="Pickathon ' + esc(M.label) + '">' +
      (M.hero ? '<img class="ph" src="' + esc(M.hero) + '" alt="">' : '<div class="ph nophoto"></div>') + '<div class="shade"></div><div class="in">' +
      '<h1 class="yr">' + esc(M.label) + '</h1>' + (M.th ? '<p class="th">' + esc(M.th) + '</p>' : '') +
      (names ? '<p class="names">' + names + '</p>' : '') +
      '<div class="ft">' + (M.full || M.stories.length || M.arcf.length ? '<button class="tlink rs">Read the story</button>' : '') + (M.count ? '<span class="note">' + M.count + ' artists</span>' : '') + '</div></div></section>';
    root.innerHTML = h;
    var b = $('.rs', root); if (b) b.onclick = function () { LAB.openStory(M); };
  };

  document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG') t.style.opacity = '0'; }, true);

  /* ---------- boot ---------- */
  LAB.boot = function (render) {
    var p = new URLSearchParams(location.search), key = decodeURIComponent(p.get('y') || '2019').replace('-', '–');
    if (key === '2020' || key === '2021' || key === '2020–21') key = '2020–2021';
    fetch('../data.json').then(function (r) { return r.json(); }).then(function (d) {
      var M = build(d, key);
      if (M.idx < 0) { M = build(d, '2019'); }
      LAB.chrome(M);
      var root = $('#app');
      if (M.still) LAB.renderStill(M, root); else render(M, root);
      document.documentElement.setAttribute('data-ready', '1');
    }).catch(function (e) { $('#app').innerHTML = '<p style="padding:24px">Could not load data.json. ' + esc(e && e.message) + '</p>'; });
  };
})();
