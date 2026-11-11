/*pk-climb v2: Home "The climb" as the vertical ladder (home_flow.md section 5, Zale Nov 9 00:14-00:59; Design Studio board ClimbLadderDesk).
  One big vertical: every name moves straight up or down at the same time on one smooth curve, bigger names in front, a faint halftone glow on the biggest,
  the top spot's ray fans pass to the new #1, a ▲ on the three biggest risers. The poster carries its own clock: a date stamp that counts from the
  festival year to today, and tapping it plays again. ANOTHER YEAR picks a random summer. The whole poster opens that year's page. Data: d.climb.*/
(function () {
  var KIT = __KIT__;
  var YC = __YC__;
  var C = null, S = { y: null, tp: 1, playing: false, seen: {}, raf: null, bag: [] }, mountEl = null, RM = false, TODAY = 2026;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var NW = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY', 'TWENTY-ONE', 'TWENTY-TWO', 'TWENTY-THREE', 'TWENTY-FOUR', 'TWENTY-FIVE', 'TWENTY-SIX', 'TWENTY-SEVEN'];
  var ORD = function (k) { return (k + 1) + (k === 0 ? 'ST' : k === 1 ? 'ND' : k === 2 ? 'RD' : 'TH'); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var sm = function (t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };
  var cw = function (c) { return ' .,\'’“”"!:'.indexOf(c) >= 0 ? 0.24 : 'IJ1'.indexOf(c) >= 0 ? 0.25 : 'MW'.indexOf(c) >= 0 ? 0.62 : 0.47; };
  var tw = function (t) { var m = mw(t, 24); if (m) return m / 24; var s = 0; for (var i = 0; i < t.length; i++) s += cw(t[i]); return s + t.length * 0.012; };   /* measured with the real font when it can be */
  var MC = null, MCK = {}; var mw = function (t, fs) { try { var k = t + '|' + fs; if (MCK[k]) return MCK[k]; if (!MC) { MC = document.createElement('span'); MC.setAttribute('aria-hidden', 'true'); MC.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;pointer-events:none;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-stretch:75%;font-variation-settings:'wdth' 75;letter-spacing:0;text-transform:none"; } if (!MC.parentNode) document.body.appendChild(MC); MC.style.fontSize = fs + 'px'; MC.textContent = t; var w = MC.getBoundingClientRect().width; var ok = !document.fonts || document.fonts.check("700 " + Math.max(8, Math.round(fs)) + "px 'Bricolage Grotesque'"); if (!ok) return w * 1.04; return (MCK[k] = w); } catch (e) { return 0; } };   /* measured in the page at the drawn size, weight and width: the font is wider at small sizes, and the old canvas measure ran about 17% narrow (review r3 A2) */
  var hash = function (s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  var mix = function (c1, c2, t) { var p = function (c) { return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16); }); }; var a1 = p(c1), a2 = p(c2); return '#' + a1.map(function (v, i) { return ('0' + Math.round(v + (a2[i] - v) * t).toString(16)).slice(-2); }).join(''); };
  var enc = function (s) { return "url('data:image/svg+xml," + encodeURIComponent(s).replace(/'/g, '%27') + "')"; };
  var WORN = enc('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="f"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -22 16.6"/></filter><rect width="200" height="200" filter="url(#f)"/></svg>');
  var GRAIN = enc('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .25  0 0 0 .55 -.18"/></filter><rect width="240" height="240" filter="url(#g)"/></svg>');
  var LEAD = ['THE', 'A', '&', '& THE', 'AND', 'AND THE', 'THEE', 'DR.', 'MR.', 'MS.', 'LA', 'LOS', 'LAS', 'EL'];
  var LH = 0.86;
  /* TODAY ranks from the class data at page load (Zale, Nov 9 09:54: live data for the posters, not when we build). climbSrc: tools/climb_ladder/build_src.py */
  window.pkClimbLive = function (dd) { try { var B = dd.climb || {}, SRC = dd.climbSrc; if (!SRC) return B; var out = {};
    var G = { 'Discovery': 0, 'Legend': 0, 'Deep cut': 1, 'Neither': 2 }, CL = { 'Legend': 0, 'Discovery': 1, 'Deep cut': 2, 'Neither': 3 }, CF = { 'high': 5, 'medium-high': 4, 'medium': 3, 'low-medium': 2, 'low': 1 };
    var nm = function (s) { return String(s).toLowerCase().replace(/&/g, ' and ').replace(/[“”"]/g, '').replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean).join(' '); };
    Object.keys(B).forEach(function (y) { var D0 = B[y], S0 = SRC[y]; if (!S0 || !S0.r || !S0.r.length) { out[y] = D0; return; }
      var R = S0.r.filter(function (r) { return r[1] !== 'Neither'; }), pin = S0.pin || [], N = function (r) { return false; };  /* Zale, Nov 10: the poster shows Legends, Discoveries and Deep cuts only */
      R.sort(function (a, b) { var pa = pin.indexOf(nm(a[0])), pb = pin.indexOf(nm(b[0])); pa = pa < 0 ? 99 : pa; pb = pb < 0 ? 99 : pb; if (pa !== pb) return pa - pb;
        /* Nov 11 (Zale saw 2017 rank Courtney Granger 4th and Billy Strings off the top): TODAY ranks by each act's size today (r[6], the class
           table's today_magnitude); acts with no size measured today go below the measured ones (a gap is not a zero); class, then confidence,
           then name only break ties. Older data without r[6] falls back to the year's call. */
        /* Zale, Nov 11 13:32: a Deep cut counts one point smaller, so it never sits level with a big act; in a tie a Discovery comes before a Legend. */
        var TIE = { 'Discovery': 0, 'Legend': 1, 'Deep cut': 2, 'Neither': 3 };
        var td = function (r) { var v = r.length > 6 ? (r[6] === null || r[6] === '' ? null : +r[6]) : (+r[2] || 0); return v === null ? null : v - (r[1] === 'Deep cut' ? 1 : 0); };
        var ta = td(a), tb = td(b), ka = [ta === null ? 1 : 0, -(ta || 0), TIE[a[1]] || 0, -(CF[a[3]] || 0)], kb = [tb === null ? 1 : 0, -(tb || 0), TIE[b[1]] || 0, -(CF[b[3]] || 0)];
        for (var i = 0; i < 4; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
      var now = {}; R.forEach(function (r, i) { now[r[0]] = i; });
      var two = R.some(function (r) { return r[4] !== now[r[0]]; }), cands = R.filter(function (r) { return r[5] && r[4] - now[r[0]] >= 3; }).sort(function (a, b) { return now[a[0]] - now[b[0]]; }), clim = two && cands.length ? cands[0][0] : null;
      var D = Object.assign({}, D0); D.names = R.map(function (r) { return [r[0], clim ? [r[4], now[r[0]]] : [now[r[0]]]]; }); D.labels = clim ? [S0.l0, 'TODAY'] : ['TODAY']; D.clim = clim; D.climFrom = clim ? cands[0][4] : 0; D.climTo = clim ? now[clim] : 0;
      D.ranked = R.filter(function (r) { return !N(r); }).length; D.more = Math.max(0, R.length - Math.min(10, D.ranked)); D.live = 1;
      /* Six-month keyframes (Nov 10): the class table now dates each class step, so the bill is re-ranked at every point between the festival and today instead of jumping straight there. Movers glide when their class changed; the rest drift. */
      try { var YR = dd.yearRatings && dd.yearRatings[y]; if (clim && YR && YR.dates && YR.dates.length > 3) {
        var ts = YR.dates.map(function (q) { return Date.parse(q); }), T0 = ts[0], T1 = ts[ts.length - 1], YM = 365.25 * 864e5, NN = ts.length - 1, ACT = {};
        (YR.acts || []).forEach(function (a) { ACT[nm(a.n)] = a; });
        var smt = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
        var win = D.names.map(function (x) { var a = ACT[nm(x[0])], t0 = T0, t1 = T1;
          if (a && a.c) { var ch = []; for (var i = 1; i <= NN; i++) if (a.c[i] !== a.c[i - 1]) ch.push(i);
            if (ch.length) { var f1 = ch[0], l1 = ch[ch.length - 1]; if (l1 === NN && f1 === NN) { t0 = T1 - 2.4 * YM; t1 = T1; } else { t0 = ts[f1] - 0.7 * YM; t1 = Math.min(T1, ts[l1] + 0.7 * YM); } t0 = Math.max(T0, t0); } }
          return [t0, Math.max(t1, t0 + 1)]; });
        var K = []; for (var k = 0; k <= NN; k++) { var v = D.names.map(function (x, i) { var f = x[1][0], e = x[1][1], pg = smt((ts[k] - win[i][0]) / (win[i][1] - win[i][0])); if (k === 0) pg = 0; if (k === NN) pg = 1; return [f + (e - f) * pg, e, f, i]; });
          v.sort(function (p, q) { return p[0] - q[0] || p[1] - q[1] || p[2] - q[2]; }); var rk = []; v.forEach(function (q, r) { rk[q[3]] = r; }); K.push(rk); }
        var cl = function (a) { return a.map(function (r) { return r < 12 ? r : 99; }).join(); }, keep = [0]; for (var k2 = 1; k2 < NN; k2++) if (cl(K[k2]) !== cl(K[keep[keep.length - 1]])) keep.push(k2); keep.push(NN);
        if (keep.length > 14) { var thin = [0], step = (keep.length - 1) / 13; for (var q2 = 1; q2 < 13; q2++) thin.push(keep[Math.round(q2 * step)]); thin.push(NN); keep = thin.filter(function (v, i, A) { return A.indexOf(v) === i; }); }
        if (keep.length > 2) { D.names = D.names.map(function (x, i) { return [x[0], keep.map(function (kk) { return K[kk][i]; })]; });
          D.when = keep.map(function (kk) { return (ts[kk] - T0) / (T1 - T0); }); D.labels = keep.map(function (kk, i) { return i === 0 ? S0.l0 : i === keep.length - 1 ? 'TODAY' : String(new Date(ts[kk]).getUTCFullYear()); }); } } } catch (e2) {}
      out[y] = D; });
    return out; } catch (e) { return dd.climb || {}; } };
  var ALLY = function () { return Object.keys(C).filter(function (k) { return C[k] && C[k].names && C[k].names.length; }).map(Number).sort(function (a, b) { return b - a; }); };
  // ANOTHER YEAR draws from every summer that has a climber, shuffled so nothing repeats until all have shown.
  var POOL = function () { return ALLY().filter(function (y) { var D = C[y]; return D.clim && D.labels && D.labels.length > 1; }); }; // every year with a climber, 2025 and 2026 included (no year holdback, Zale Nov 8-9)

  // Sizes. Desktop: the paper is 960 wide (inner 880): art 330 at left, list column 524. Phone and tablet (phone-style): art small on top, list full width.
  function cfg(ph, wAvail) {
    if (!ph) return { ph: false, IW: 880, PADX: 40, PADY: 22, ART: { x: 0, y: 118, w: 330 }, COLX: 356, COLW: 524, Y0: 0, LANES: [[80, 74, 2], [44, 41, 2], [44, 41, 2], [44, 41, 2], [33, 29, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1]], GAP: 5, R1: 22, ROWH: 21, FS: 13, CFS: 15, DATES: 15, DGAP: 42, BOT: 100, RIB: [40, 14], STAMP: 0.92 };
    var PW = Math.max(300, Math.min(wAvail, 720)), IW = PW - 32, k = Math.min(1.7, IW / 326), L = function (h, m, ml) { return [Math.round(h * k), Math.round(m * k), ml]; };
    var AW = Math.round(100 * k), CG = Math.round(12 * k);   /* Zale, Nov 11: phone keeps the horizontal poster, art static on the left, names move in the column on the right (spec home_climb_phone_nov9b section 1) */
    return { ph: true, IW: IW, PADX: 16, PADY: 14, ART: { x: 0, y: 0, w: AW }, COLX: AW + CG, COLW: IW - AW - CG, Y0: 0,
      LANES: [L(40, 28, 2), L(27, 20, 2), L(27, 20, 2), L(27, 20, 2), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1)], GAP: Math.round(3 * k), R1: Math.round(26 * k), ROWH: Math.round(16 * k), FS: Math.max(11, 11 * k), CFS: Math.max(12, 12 * k), DATES: Math.max(11, 11 * k), DGAP: Math.round(30 * k), BOT: Math.round(30 * k) + Math.round(Math.max(11, 11 * k)) + 12 + Math.max(34, Math.round(32 * k)), RIB: [Math.max(34, Math.round(32 * k)), Math.max(12, 12 * k)], STAMP: 0.7 * k };
  }

  /* Nov 11 refine (Zale: "it needs to be smoother"): two posters and one move.
     The cast is fixed for the whole run: the printed top of the bill plus today's top, nobody else, so nothing pops in or out.
     Each act's path through the six-month steps is smoothed to one direction (no act climbs and falls back), the order at every step
     comes from those smoothed values, and every name's position, size, ink and star ride one monotone curve through the step layouts
     on one clock. Each name keeps one line break for the whole run, so nothing rewraps or crossfades. */
  var PLANS = {};
  var iso = function (r, dir) {   /* pool-adjacent-violators: the closest path to r that only moves one way (dir -1 = rank only falls, i.e. the act climbs) */
    var B = []; r.forEach(function (v) { B.push({ s: v, c: 1 }); while (B.length > 1) { var a = B[B.length - 2], b = B[B.length - 1]; if (dir < 0 ? a.s / a.c >= b.s / b.c : a.s / a.c <= b.s / b.c) break; a.s += b.s; a.c += b.c; B.pop(); } });
    var out = []; B.forEach(function (b) { for (var i = 0; i < b.c; i++) out.push(b.s / b.c); }); return out; };
  var mono = function (X, Y) {   /* Fritsch-Carlson monotone cubic: smooth through every step, never overshoots, flat where the data is flat */
    var n = X.length; if (n < 2) return function () { return Y[0]; };
    var d = [], m = []; for (var i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2]; for (var j = 1; j < n - 1; j++) m[j] = d[j - 1] * d[j] <= 0 ? 0 : (d[j - 1] + d[j]) / 2;
    for (var k = 0; k < n - 1; k++) { if (d[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; } var a = m[k] / d[k], b = m[k + 1] / d[k], s = a * a + b * b; if (s > 9) { var t = 3 / Math.sqrt(s); m[k] = t * a * d[k]; m[k + 1] = t * b * d[k]; } }
    m[0] = 0; m[n - 1] = 0;   /* every name eases in at the start and settles at the end */
    for (var q = 0; q < n - 1; q++) { if (d[q] === 0) continue; var a2 = m[q] / d[q], b2 = m[q + 1] / d[q], s2 = a2 * a2 + b2 * b2; if (s2 > 9) { var t2 = 3 / Math.sqrt(s2); m[q] = t2 * a2 * d[q]; m[q + 1] = t2 * b2 * d[q]; } }
    return function (x) { if (x <= X[0]) return Y[0]; if (x >= X[n - 1]) return Y[n - 1]; var i = 0; while (i < n - 2 && x > X[i + 1]) i++; var h = X[i + 1] - X[i], t = (x - X[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * h * m[i + 1]; }; };
  var rgb = function (c) { return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16); }); };
  var hex = function (a) { return '#' + a.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  function plan(D, y, Q) {
    var still = D.labels.length < 2 || STAT(y), key = y + '|' + Q.IW + '|' + Q.ph + '|' + still + '|' + D.names.length; if (PLANS[key]) return PLANS[key];
    var K = KIT[y] || {}, n = D.labels.length, A = D.inks[0], B = D.inks[1] || D.inks[0], H = K.head && K.hc >= 3 ? K.head : A;
    var IW = Q.IW, LN = Math.min(10, D.ranked || 10), TOP = Q.LANES[0][1];
    var S = [], yy = Q.Y0; Q.LANES.forEach(function (L, r) { S.push({ x: Q.COLX, y: yy, w: Q.COLW, h: L[0], mx: L[1], ml: L[2], ink: r === 0 ? H : r % 2 ? A : B, head: r === 0 }); yy += L[0] + Q.GAP; });
    var ROW1 = S[9].y + S[9].h + Q.R1, ROWMAX = Math.round(IW * (Q.ph ? 0.88 : 0.8)), BOXH = ROW1 + Q.BOT;
    var opts = function (nm, s) { var wd = nm.split(' '), o = [{ L: [nm], lead: false }];
      if (s.ml > 1) for (var i = 1; i < wd.length; i++) { var a = wd.slice(0, i).join(' '), b = wd.slice(i).join(' '); o.push({ L: [a, b], lead: false }); if (LEAD.indexOf(a) >= 0 && b.length > 3) o.push({ L: [a, b], lead: true }); } return o; };
    var fitO = function (o, s) { var ws = o.L.map(function (t, i) { return tw(t) * (o.lead && i === 0 ? 0.55 : 1); }), hs = o.L.length === 1 ? LH : o.lead ? LH * 1.55 + 0.04 : LH * 2 + 0.04;
      var fanR = s.head && !Q.ph ? Math.min(s.mx * 0.62, 90) * 0.81 + Math.max(8, s.mx * 0.12) + 4 : 0, mw0 = Math.max.apply(null, ws);
      return { f: Math.min(s.mx, (s.w - 2 * Math.max(fanR, s.head ? (Q.ph ? 6 : 46) : 0)) * (Q.ph ? 0.88 : 0.97) / mw0, s.h / hs), mw: mw0, L: o.L, lead: o.lead }; };
    var best = function (nm, s) { var b = null; opts(nm, s).forEach(function (o) { var r = fitO(o, s); if (!b || r.f > b.f + (o.lead ? -2 : 0.5) || (Math.abs(r.f - b.f) <= 0.5 && r.L.length === b.L.length && !r.lead && !b.lead && r.mw < b.mw)) b = r; }); return b; };
    // the cast and the steps
    var cast = still ? D.names.slice() : D.names.filter(function (x) { return x[1][0] < LN || x[1][n - 1] < LN; });
    var KS = []; if (still) KS.push(n - 1); else for (var k = 0; k < n; k++) KS.push(k);
    var V = cast.map(function (x) { if (still) return [x[1][n - 1]]; var r = x[1], s0 = r[0], e0 = r[n - 1], v = iso(r.slice(), e0 <= s0 ? -1 : 1), lo = Math.min(s0, e0), hi = Math.max(s0, e0);
      v = v.map(function (q) { return Math.max(lo, Math.min(hi, q)); }); v[0] = s0; v[n - 1] = e0; return v; });
    var POS = KS.map(function (k, j) { var idx = cast.map(function (x, i) { return i; }).sort(function (a, b) { return V[a][j] - V[b][j] || cast[a][1][n - 1] - cast[b][1][n - 1] || cast[a][1][0] - cast[b][1][0]; }); var p = []; idx.forEach(function (i, r) { p[i] = r; }); return p; });
    // one shape per name for the whole run: its best fit at its biggest slot; a name that ever sits in the small print stays on one line
    var SH = cast.map(function (x, i) { var mn = Math.min.apply(null, POS.map(function (p) { return p[i]; })), small = POS.some(function (p) { return p[i] >= LN; });
      if (small || mn >= LN) return { L: [x[0]], lead: false }; var b = best(x[0], S[mn]); return { L: b.L, lead: b.lead }; });
    // the small print: one size for the run, small enough that every step fits in two rows (the still posters keep their old cap)
    var FS = Q.FS, CFS = Q.CFS, sw = function (t, fs) { var m = mw(t, fs); return (m ? m : tw(t) * fs * 1.14) + t.length * 0.04 * fs + 2; };
    var rowsAt = function (j, sc) { var smalls = cast.map(function (x, i) { return i; }).filter(function (i) { return POS[j][i] >= LN; }).sort(function (a, b) { return POS[j][a] - POS[j][b]; });
      var rows = [[]], rw = [0], shown = 0, hid = [], over = false;
      smalls.forEach(function (i) { var nm = cast[i][0], isC = nm === D.clim, fs = (isC ? CFS : FS) * sc, w = sw(nm, fs); if (w > ROWMAX) { fs = Math.max(8, fs * ROWMAX / w * 0.97); w = sw(nm, fs); }
        var SEP = 14 + 0.6 * fs * 0.8 + 12, r = rows.length - 1, add = rows[r].length ? SEP + w : w;
        if (rw[r] + add > ROWMAX) { if (r === 0) { rows.push([]); rw.push(0); r = 1; add = w; } else { over = true; hid.push(i); return; } }
        if (still && shown >= (Q.ph ? 6 : 16) && !isC) { hid.push(i); return; }
        rw[r] += add; rows[r].push({ i: i, fs: fs, w: w, sep: SEP }); shown++; });
      return { rows: rows, rw: rw, hid: hid, over: over }; };
    var sc = 1; if (!still) for (var tries = 0; tries < 12; tries++) { var ok = true; for (var j0 = 0; j0 < KS.length; j0++) if (rowsAt(j0, sc).over) { ok = false; break; } if (ok) break; sc *= 0.94; }
    // the layout at every step
    var CH = ['x', 'y', 'k', 'f', 'r', 'g', 'b', 'sep', 'col', 'vis', 'v'], RCH = ['y', 'a', 'b', 'o'];
    var LAY = KS.map(function (k, j) { var P = cast.map(function () { return null; }), R = rowsAt(j, sc);
      cast.forEach(function (x, i) { var r = POS[j][i]; if (r < LN) { var s = S[r], f = fitO(SH[i], s).f, c = rgb(s.ink); P[i] = { x: s.x + 0.5 * s.w, y: s.y + s.h, k: 0.5, f: f, r: c[0], g: c[1], b: c[2], sep: 0, col: 1, vis: 1, v: V[i][j] }; } });
      var rules = [];
      R.rows.forEach(function (row, ri) { var x = (IW - R.rw[ri]) / 2, yb = ROW1 + ri * Q.ROWH, c = rgb(A); rules.push({ y: yb - 8, a: x - 20, b: x + R.rw[ri] + 20, o: row.length ? 1 : 0 });
        row.forEach(function (q, qi) { if (qi) x += q.sep; P[q.i] = { x: x, y: yb, k: 0, f: q.fs, r: c[0], g: c[1], b: c[2], sep: qi ? 1 : 0, col: 0, vis: 1, v: V[q.i][j] }; x += q.w; }); });
      while (rules.length < 2) rules.push({ y: ROW1 + rules.length * Q.ROWH - 8, a: IW / 2, b: IW / 2, o: 0 });
      R.hid.forEach(function (i) { var c = rgb(A); P[i] = { x: IW / 2, y: ROW1 + Q.ROWH, k: 0.5, f: FS, r: c[0], g: c[1], b: c[2], sep: 0, col: 0, vis: 0, v: V[i][j] }; });
      return { P: P, rules: rules }; });
    // step times: half by date, half evenly, so a short last step never turns into a hop
    var W = D.when && D.when.length === n ? D.when : KS.map(function (k, j) { return KS.length > 1 ? j / (KS.length - 1) : 1; });
    var E = KS.map(function (k, j) { return KS.length > 1 ? 0.5 * W[k] + 0.5 * j / (KS.length - 1) : 1; });
    var FN = cast.map(function (x, i) { var o = {}; CH.forEach(function (c) { o[c] = mono(E, LAY.map(function (L) { return L.P[i][c]; })); }); return o; });
    var RF = [0, 1].map(function (ri) { var o = {}; RCH.forEach(function (c) { o[c] = mono(E, LAY.map(function (L) { return L.rules[ri][c]; })); }); return o; });
    var FR = mono(E, KS.map(function (k) { return W[k]; }));
    var at = function (e) { return { N: FN.map(function (fn) { var o = {}; CH.forEach(function (c) { o[c] = fn[c](e); }); return o; }), R: RF.map(function (fn) { var o = {}; RCH.forEach(function (c) { o[c] = fn[c](e); }); return o; }) }; };
    var lift = function (x) { return Math.log((x[1][0] + 1) / (x[1][n - 1] + 1)); }, gain = function (x) { return x[1][0] - x[1][n - 1]; };
    var RISERS = still ? [] : cast.filter(function (x) { return x[1][n - 1] < LN && gain(x) >= 3 && lift(x) >= Math.log(2); }).sort(function (p, q) { return lift(q) - lift(p); }).slice(0, 3).map(function (x) { return x[0]; });
    var drawOrder = cast.map(function (x, i) { return i; }).sort(function (a, b) { return cast[b][1][n - 1] - cast[a][1][n - 1]; });   /* today's biggest drawn last, on top */
    return (PLANS[key] = { S: S, IW: IW, BOXH: BOXH, ROW1: ROW1, DATESY: ROW1 + Q.DGAP, TOP: TOP, A: A, B: B, H: H, cast: cast, SH: SH, at: at, frac: function (e) { return still ? 1 : clamp01(FR(e)); }, END: at(1), RISERS: RISERS, order: drawOrder, still: still, n: n }); }

  // One frame at eased progress e (0 = the printed bill, 1 = today). back = { e0, k }: Replay's straight glide from e0 back to the printed bill.
  function frame(D, y, e, Q, back) {
    var K = KIT[y] || {}, PL = plan(D, y, Q), PAPER = D.paper, A = PL.A, B = PL.B, IW = PL.IW, BOXH = PL.BOXH, TOP = PL.TOP, S = PL.S, n = PL.n;
    var lp = function (A0, A1, kk) { var lq = function (a, b) { var o = {}; for (var c in a) o[c] = a[c] + (b[c] - a[c]) * kk; return o; }; return { N: A0.N.map(function (a, i) { return lq(a, A1.N[i]); }), R: A0.R.map(function (a, i) { return lq(a, A1.R[i]); }) }; };
    var B0 = back && !PL.still ? PL.at(back.e0) : null, B1 = B0 ? PL.at(0) : null;
    var stAt = function (q) { return PL.still ? PL.END : B0 ? lp(B0, B1, q) : PL.at(q); }, par = B0 ? back.k : e, ST = stAt(par);
    var dims = function (p, L, lead) { var w = Math.max.apply(null, L.map(function (t, i) { return tw(t) * (lead && i === 0 ? 0.55 : 1); })) * p.f, h = (L.length > 1 ? (lead ? 1.55 : 2) : 1) * LH * p.f; return { w: w, h: h, cx: p.x + (0.5 - p.k) * w, cy: p.y - h / 2 }; };
    var items = PL.cast.map(function (x, i) { var p = ST.N[i]; return { x: x, p: p, sh: PL.SH[i], d: dims(p, PL.SH[i].L, PL.SH[i].lead), o: clamp01(p.vis), end: x[1][n - 1] }; });
    /* when two names pass, the one lower on today's bill steps back. Crossings can last two or three frames, so the step-back is spread over
       about half a second around each one (a tent-weighted look at nearby moments): it eases in and out instead of flashing. */
    var over = function (N) { var D2 = N.map(function (p, i) { return dims(p, PL.SH[i].L, PL.SH[i].lead); }); return N.map(function (pa, i) { if (pa.vis <= 0) return 0; var dm = 0, a = D2[i];
      N.forEach(function (pb, j) { if (j === i || pb.vis <= 0 || items[j].end >= items[i].end) return; var b = D2[j], ox = (a.w + b.w) / 2 - Math.abs(a.cx - b.cx), oy = (a.h + b.h) / 2 - Math.abs(a.cy - b.cy); if (ox <= 0 || oy <= 0) return;
        dm = Math.max(dm, clamp01(oy / (Math.min(a.h, b.h) * 0.9)) * clamp01(ox / (Math.min(a.w, b.w) * 0.5))); }); return dm; }); };
    if (!PL.still) { var ck = B0 ? 'b' + back.e0.toFixed(4) : 'run', CV = PL.dimC && PL.dimC[ck];
      if (!CV) { var G = B0 ? 240 : 800, RAD = Math.round(G * (B0 ? 0.12 : 0.045)), raw = []; for (var gi = 0; gi <= G; gi++) raw.push(over(stAt(gi / G).N));
        CV = raw.map(function (r, gi) { return r.map(function (v0, i) { var m = 0; for (var d = -RAD; d <= RAD; d++) { var g2 = gi + d; if (g2 < 0 || g2 > G) continue; m = Math.max(m, raw[g2][i] * (1 - Math.abs(d) / (RAD + 1))); } return m; }); });
        PL.dimC = B0 ? { run: PL.dimC && PL.dimC.run } : (PL.dimC || {}); PL.dimC[ck] = CV; }
      var gp = par * (CV.length - 1), g0 = Math.min(CV.length - 2, Math.floor(gp)), gf = gp - g0;
      var sm1 = function (t) { t = clamp01(t); return t * t * (3 - 2 * t); }, edge = sm1(e / 0.06) * sm1((1 - e) / 0.06);   /* both printed bills rest in full ink */
      var R0 = B0 && PL.dimC.run ? (function () { var C2 = PL.dimC.run, q2 = back.e0 * (C2.length - 1), h0 = Math.min(C2.length - 2, Math.floor(q2)), hf = q2 - h0; var ed = sm1(back.e0 / 0.06) * sm1((1 - back.e0) / 0.06); return C2[h0].map(function (v, i) { return (v + (C2[h0 + 1][i] - v) * hf) * ed; }); })() : null, kS = B0 ? back.k * back.k * (3 - 2 * back.k) : 0;
      items.forEach(function (a, i) { var dv = (CV[g0][i] + (CV[g0 + 1][i] - CV[g0][i]) * gf) * (B0 ? 1 : edge); if (B0) dv = (R0 ? R0[i] : 0) * (1 - kS) + dv * Math.sin(Math.PI * back.k);   /* the replay glide starts from the run's own step-back and ends with none */
        a.o *= 1 - 0.85 * dv; }); }
    // the eye follows the climbers: an act on its way down steps back while it moves (one dip, on its own progress), then lands in full ink
    items.forEach(function (a) { var v0 = a.x[1][0], v1 = a.x[1][n - 1]; if (PL.still || v1 <= v0) return; var pr = clamp01((a.p.v - v0) / (v1 - v0)); a.o *= 1 - 0.68 * clamp01((v1 - v0 - 1) / 5) * Math.sin(Math.PI * pr); });   /* a slip of a place or two barely shows; a real fall steps well back */
    var GLOWINK = (K.light && K.light.toUpperCase() !== PAPER.toUpperCase() && K.light.toUpperCase() !== '#FFFFFF') ? K.light : B, ACC = K.head && K.hc >= 3 ? K.head : A;
    var h = '';
    // faint halftone glow behind the biggest names (Zale: subtle, never tacky)
    PL.order.forEach(function (i) { var q = items[i], p = q.p, o = q.o; if (o <= 0.005) return; var t = Math.max(0, Math.min(1, (p.f / TOP - 0.62) / 0.85)); if (t <= 0.02) return; var d = q.d, W = d.w + p.f * 1.3, Hh = d.h + p.f * 0.8, dot = Q.ph ? 0.8 : 1.1;
      h += '<i aria-hidden="true" style="position:absolute;left:' + (d.cx - W / 2).toFixed(1) + 'px;top:' + (d.cy - Hh / 2).toFixed(1) + 'px;width:' + W.toFixed(1) + 'px;height:' + Hh.toFixed(1) + 'px;pointer-events:none;background-image:radial-gradient(' + GLOWINK + ' ' + dot + 'px,transparent ' + (dot + 0.5) + 'px);background-size:' + (Q.ph ? 4 : 5) + 'px ' + (Q.ph ? 4 : 5) + 'px;opacity:' + (o * (0.12 + 0.26 * t) * Math.min(1, t * 4)).toFixed(3) + ';-webkit-mask-image:radial-gradient(closest-side,#000 ' + (30 + 30 * t).toFixed(0) + '%,transparent 100%);mask-image:radial-gradient(closest-side,#000 ' + (30 + 30 * t).toFixed(0) + '%,transparent 100%)"></i>'; });
    // the crown: the printed ray fans belong to the top line and pass to the new #1, weighted by how close each name is to that line
    var s0 = S[0], crownW = function (p) { return clamp01(p.col) * clamp01(1 - Math.abs(p.y - (s0.y + s0.h)) / (S[1].y + S[1].h - s0.y - s0.h)); };   /* full on the top line, none by the second */
    var FONT = "font-family:'Bricolage Grotesque',sans-serif;font-stretch:75%;font-variation-settings:'wdth' 75;font-weight:800";
    var reachOf = function (p, d, crw) { if (crw < 0.01) return 0; var gap = Math.max(8, p.f * 0.12), sp = Math.min(Math.min(p.f * 0.62, 90), d.cx - d.w / 2 - s0.x - gap); return sp < 20 ? 0 : (gap + sp * Math.cos(36 * Math.PI / 180) + 6) * crw; };   /* same threshold as the fans themselves: no room kept for rays that are not drawn */
    // risers: where the FROM #n note goes is decided once, from today's bill, so it never switches sides mid-flight
    if (!PL.noteAt) { PL.noteAt = {}; PL.cast.forEach(function (x, i) { if (PL.RISERS.indexOf(x[0]) < 0) return; var p = PL.END.N[i], d = dims(p, PL.SH[i].L, PL.SH[i].lead), crw = crownW(p), reach = reachOf(p, d, crw), fsM = Math.max(Q.ph ? 9 : 11, p.f * 0.42) / p.f, nf = Math.min(16, Math.max(Q.ph ? 9 : 12, p.f * 0.2));
      var noteT = 'FROM #' + (x[1][0] + 1), noteW = tw(noteT) * nf + noteT.length * 0.08 * nf, gapN = Math.max(8, p.f * 0.2), fits = d.cx + d.w / 2 + reach + gapN + noteW <= s0.x + s0.w + (Q.ph ? 4 : 30), roomy = reach === 0 || d.cx - d.w / 2 - reach - p.f * fsM * 1.6 >= s0.x;
      PL.noteAt[x[0]] = { fits: fits, roomy: roomy, show: roomy && D.src === 'real billing' && (Q.ph ? fits : (x[1][n - 1] !== 0 || fits)) }; }); }
    var fans = '';
    PL.order.forEach(function (i) { var q = items[i], x = q.x, p = q.p, o = q.o, d = q.d; if (o <= 0.005) return; var L = q.sh.L, lead = q.sh.lead, two = L.length > 1, hh = hash(x[0]);
      var c = hex([p.r, p.g, p.b]), inkLead = c.toUpperCase() === A.toUpperCase() ? B : A, crw = crownW(p), reach = reachOf(p, d, crw);
      var bigT = clamp01((p.f / TOP - 0.3) / 0.3), ls = (0.04 - 0.05 * bigT).toFixed(3) + 'em';   /* letter spacing follows the size, no switch */
      var mask = ';-webkit-mask-image:' + WORN + ';mask-image:' + WORN + ';-webkit-mask-size:200px;mask-size:200px;-webkit-mask-position:' + (hh % 200) + 'px ' + ((hh >> 8) % 200) + 'px;mask-position:' + (hh % 200) + 'px ' + ((hh >> 8) % 200) + 'px';
      var lineSt = function (isLead, ink) { return 'display:block;width:fit-content;margin:0 ' + (p.k < 0.25 ? 'auto 0 0' : 'auto') + ';color:' + ink + (isLead ? ';font-size:.55em;line-height:1;margin-bottom:.06em' : '') + mask; };
      if (crw > 0.01) { var gapF = Math.max(8, p.f * 0.12), len = Math.min(p.f * 0.62, 90), L0 = d.cx - d.w / 2, R0 = d.cx + d.w / 2, room = { l: L0 - s0.x - gapF, r: s0.x + s0.w - R0 - gapF }, swd = Math.max(2, p.f * 0.035);
        var fan = function (side) { var sp = Math.min(len, room[side]); if (sp < 20) return ''; var x0 = side === 'l' ? L0 - gapF : R0 + gapF, dir = side === 'l' ? -1 : 1;
          return [-36, -18, 0, 18, 36].map(function (deg, j) { var r = deg * Math.PI / 180, l = sp * (j % 2 ? 0.7 : 1); return '<line x1="' + x0.toFixed(1) + '" y1="' + (d.cy + Math.sin(r) * d.h * 0.18).toFixed(1) + '" x2="' + (x0 + dir * Math.cos(r) * l).toFixed(1) + '" y2="' + (d.cy + Math.sin(r) * (d.h * 0.18 + l)).toFixed(1) + '"/>'; }).join(''); };
        fans += '<g stroke="' + inkLead + '" stroke-width="' + swd.toFixed(1) + '" stroke-linecap="square" opacity="' + (crw * o).toFixed(3) + '">' + fan('l') + fan('r') + '</g>'; }
      var NA = PL.noteAt[x[0]], rise = 0;
      if (NA) { var v0 = x[1][0], v1 = x[1][n - 1]; rise = back ? clamp01(1 - back.k) * clamp01((v0 - PL.at(back.e0).N[i].v) / (v0 - v1) * 1.25) : clamp01((v0 - p.v) / (v0 - v1) * 1.25); rise = rise * rise * (3 - 2 * rise); }
      var fsM = Math.max(Q.ph ? 9 : 11, p.f * 0.42) / p.f, cyEm = lead ? 0.61 + LH / 2 : two ? LH : LH / 2, nf = Math.min(16, Math.max(Q.ph ? 9 : 12, p.f * 0.2)), triPx = p.f * fsM;
      var noteT = 'FROM #' + (x[1][0] + 1), shortT = '#' + (x[1][0] + 1), shortW = tw(shortT) * nf + shortT.length * 0.08 * nf, gapN = Math.max(8, p.f * 0.2), noteO = Math.pow(rise, 3), showNote = NA && NA.show && noteO > 0.01, nFits = NA && NA.fits;
      var pre = '', post = '';
      if (p.sep > 0.01) pre = '<span aria-hidden="true" style="position:absolute;right:100%;top:.32em;margin-right:' + Math.round((26 + 0.48 * p.f) / 2) + 'px;transform:translateX(50%);font-size:.6em;line-height:1;letter-spacing:0;color:' + B + ';opacity:' + clamp01(p.sep * (1 - p.col)).toFixed(3) + '">★</span>';
      if (NA && NA.roomy && rise > 0.01) pre += '<span aria-hidden="true" style="position:absolute;right:100%;top:' + (cyEm / fsM - 0.6 - (showNote && !nFits ? (nf * 0.55 + 2) / triPx * noteO : 0)).toFixed(2) + 'em;margin-right:' + (0.5 + reach / (p.f * fsM)).toFixed(3) + 'em;font-size:' + fsM.toFixed(3) + 'em;line-height:1;letter-spacing:0;color:' + ACC + ';opacity:' + rise.toFixed(3) + '">▲</span>';
      if (showNote) { var nst = 'font-size:' + nf.toFixed(1) + 'px;line-height:1;letter-spacing:.08em;white-space:nowrap;color:' + ACC + ';opacity:' + noteO.toFixed(3);
        post = nFits ? '<span aria-hidden="true" style="position:absolute;left:100%;top:' + (cyEm * p.f - nf * 0.5).toFixed(1) + 'px;margin-left:' + (gapN + reach).toFixed(1) + 'px;' + nst + '">' + noteT + '</span>'
          : '<span aria-hidden="true" style="position:absolute;right:100%;top:' + (cyEm * p.f + triPx * 0.42 + 3).toFixed(1) + 'px;margin-right:' + (0.5 * triPx + reach + (triPx * 0.8 - shortW) / 2).toFixed(1) + 'px;' + nst + '">' + shortT + '</span>'; }
      h += '<span style="position:absolute;left:' + p.x.toFixed(2) + 'px;top:' + p.y.toFixed(2) + 'px;transform:translate(' + (-p.k * 100).toFixed(2) + '%,-100%);white-space:pre;text-align:' + (p.k < 0.25 ? 'left' : 'center') + ';' + FONT + ';line-height:' + LH + ';letter-spacing:' + ls + ';font-size:' + p.f.toFixed(2) + 'px;opacity:' + o.toFixed(3) + '">' + pre
        + '<span style="' + lineSt(lead, lead ? inkLead : c) + '">' + esc(L[0]) + '</span>' + (two ? '<span style="' + lineSt(false, c) + '">' + esc(L[1]) + '</span>' : '') + post + '</span>'; });
    var rules = ST.R.map(function (r) { if (r.o <= 0.01) return ''; var op = ';opacity:' + clamp01(r.o).toFixed(3); return '<i style="position:absolute;left:0;width:' + Math.max(0, r.a).toFixed(1) + 'px;top:' + r.y.toFixed(1) + 'px;height:1.5px;background:' + B + op + '"></i><i style="position:absolute;left:' + r.b.toFixed(1) + 'px;right:0;top:' + r.y.toFixed(1) + 'px;height:1.5px;background:' + B + op + '"></i>'; }).join('');
    var burst = fans ? '<i aria-hidden="true" style="position:absolute;left:0;top:0;width:' + IW + 'px;height:' + BOXH + 'px;background:' + enc('<svg xmlns="http://www.w3.org/2000/svg" width="' + IW + '" height="' + BOXH + '">' + fans + '</svg>') + ' 0 0/100% 100% no-repeat;pointer-events:none;-webkit-mask-image:' + WORN + ';mask-image:' + WORN + ';-webkit-mask-size:200px;mask-size:200px"></i>' : '';
    var artH = Q.ART.h || (S[9].y + S[9].h - Q.ART.y);
    var art = D.art ? '<img src="' + esc(D.art) + '" alt="" decoding="async" style="position:absolute;left:' + Q.ART.x + 'px;top:' + Q.ART.y + 'px;width:' + Q.ART.w + 'px;height:' + artH + 'px;object-fit:contain;object-position:center center">'
      : '<div aria-hidden="true" style="position:absolute;left:' + (Q.ART.x + (Q.ph ? 0 : 40)) + 'px;top:' + (Q.ph ? 0 : 60) + 'px;width:' + (Q.ART.w - (Q.ph ? 0 : 80)) + 'px;height:' + (Q.ph ? Math.min(artH, Q.ART.w * 1.6) : artH - 120) + 'px;display:flex;align-items:center;justify-content:center;text-align:center;' + FONT + ';line-height:.86;font-size:' + (Q.ph ? 22 : 80) + 'px;color:' + A + ';border:' + (Q.ph ? 3 : 6) + 'px solid ' + A + '">PICKATHON<br>' + y + '</div>';
    var dl = K.dates ? (K.dates.toUpperCase().replace(/ ?- ?/g, '–') + ' · PENDARVIS FARM' + (Q.ph ? '' : ' · HAPPY VALLEY, OREGON')) : 'PICKATHON ' + y;
    var dates = '<div style="position:absolute;left:0;right:0;top:' + PL.DATESY + 'px;text-align:center;white-space:nowrap;' + FONT + ';font-size:' + Q.DATES + 'px;letter-spacing:.08em;color:' + A + '">' + dl.split(' · ').map(function (t, i) { return (i ? '<span style="font-size:.6em;color:' + B + ';margin:0 ' + (Q.ph ? 6 : 12) + 'px;vertical-align:.2em">★</span>' : '') + esc(t); }).join('') + '</div>';
    var rib = '<div style="position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center"><span class="pk-cl-fl" style="--ink:' + A + '"></span><span style="flex:none;height:' + Q.RIB[0] + 'px;padding:0 ' + (Q.ph ? 16 : 36) + 'px;background:' + A + ' linear-gradient(' + PAPER + '80,' + PAPER + '80) 0 4px/100% 1.5px no-repeat;color:' + PAPER + ';' + FONT + ';font-size:' + Q.RIB[1] + 'px;letter-spacing:.1em;display:flex;align-items:center;white-space:nowrap;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 50%,100% 100%,0 100%,14px 50%)">EXPLORE PICKATHON ' + y + ' →</span><span class="pk-cl-fr" style="--ink:' + A + '"></span></div>';
    var frac = PL.still ? 1 : back ? PL.frac(back.e0) * (1 - back.k) : PL.frac(e);
    return { art: art, html: h + burst + rules + dates + rib, IW: IW, H: BOXH, A: A, B: B, PAPER: PAPER, ACC: ACC, LIGHT: GLOWINK, frac: frac };
  }

  // the clock on the poster: a date stamp that counts the summers from the festival to today; tapping it plays again
  function stamp(D, y, tp, Q, F) {
    var n = D.labels.length, atEnd = tp >= n - 1 - 1e-3, kk = Math.floor(tp), fk = tp - kk, g = fk <= 0 ? 0 : fk >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * fk), frac = n > 1 ? (kk + g) / (n - 1) : 1;
    var y0 = +y, yNow = n > 1 ? Math.round(y0 + (TODAY - y0) * Math.min(1, frac)) : TODAY;
    var top = 'THE ' + y + ' BILL', low = n < 2 || atEnd ? 'RANKED TODAY' : frac <= 0.001 ? (D.src === 'real billing' ? 'AS PRINTED' : 'AS BOOKED') : 'RANKED IN ' + yNow;
    var s = Q.STAMP, ink = F.ACC, act = n > 1 && !RM;
    var w = Math.max(Q.ph ? 106 : 0, Math.round(132 * s)), big = Math.max(28, Math.round(44 * s)), sml = Math.max(11, Math.round(12 * s));
    var bar = n > 1 ? '<span style="display:block;height:' + Math.max(2, Math.round(3 * s)) + 'px;margin:' + Math.round(5 * s) + 'px 2px 0;background:' + ink + '33"><span style="display:block;height:100%;width:' + (Math.min(1, frac) * 100).toFixed(1) + '%;background:' + ink + '"></span></span>' : '';
    var rep = '';
    var inner = rep + '<span style="display:block;font-size:' + sml + 'px;letter-spacing:.12em">' + top + '</span><span style="display:block;font-size:' + big + 'px;line-height:.92;letter-spacing:.02em;font-variant-numeric:tabular-nums">' + yNow + '</span>' + bar + '<span style="display:block;margin-top:' + Math.round(4 * s) + 'px;font-size:' + sml + 'px;letter-spacing:.12em">' + low + '</span>';
    var inset = Q.ph ? 14 : 24;
    var st = 'position:absolute;z-index:2;left:' + inset + 'px;top:' + inset + 'px;width:' + w + 'px;padding:0;border:0;background:transparent;transform:rotate(-6deg);color:' + ink + ';font-family:\'Bricolage Grotesque\',sans-serif;font-stretch:75%;font-variation-settings:\'wdth\' 75;font-weight:800;text-align:center';
    var ist = 'display:block;position:relative;padding:' + Math.round(7 * s) + 'px ' + Math.round(10 * s) + 'px ' + Math.round(9 * s) + 'px;box-sizing:border-box;border:' + Math.max(2, Math.round(2.5 * s)) + 'px solid ' + ink + ';outline:1px solid ' + ink + ';outline-offset:' + Math.max(2, Math.round(3 * s)) + 'px;-webkit-mask-image:' + WORN + ';mask-image:' + WORN + ';-webkit-mask-size:160px;mask-size:160px';
    var rp = act && atEnd && !S.playing && !STAT(y) ? '<span class="pk-cl-rp" aria-hidden="true" style="position:absolute;left:0;right:0;top:100%;margin-top:' + Math.round(9 * s) + 'px;font-size:' + Math.max(11, Math.round(12 * s)) + 'px;letter-spacing:.12em;white-space:nowrap">↻ PLAY AGAIN</span>' : '';
    return { act: act, st: st, html: '<span class="pk-cl-ink" style="' + ist + '">' + inner + '</span>' + rp, label: S.playing ? 'Stop' : 'Play ' + y + ' to today again' };
  }

  // the clock above the poster (Zale, Nov 9 09:02: the stamp on the poster crowded the headliner and hid Play again)
  function timebar(D, y, tp, F) {
    var n = D.labels.length, atEnd = tp >= n - 1 - 1e-3, frac = n > 1 ? F.frac : 1;   /* the calendar rides the same curve as the names (Nov 11 refine) */
    var y0 = +y, yNow = n > 1 ? Math.max(y0 + 1, Math.round(y0 + (TODAY - y0) * frac)) : TODAY;
    var line = n < 2 ? 'Ranked by how far each act has gone' : frac <= 0.001 ? (D.src === 'real billing' ? 'The bill as printed in ' + y : 'The bill as booked in ' + y) : (atEnd || yNow >= TODAY) ? 'Ranked today by how far each act has gone' : 'Re-ranked as of ' + yNow;
    var btn = '↺ Replay';   /* Zale, Nov 11 10:10: Home plays once by itself; the only controls are Replay and Another year */
    return { n: n, show: n > 1 && y0 < TODAY && !STAT(y0) && !RM, frac: frac, yNow: Math.min(yNow, TODAY), line: line, btn: btn, aria: 'Replay ' + y + ', from the printed bill to today' };
  }
  function caption(D, y, tp) {
    var n = D.labels.length, atEnd = tp >= n - 1 - 1e-3, derived = D.src !== 'real billing', age = TODAY - y;
    var since = age <= 0 ? 'THIS SUMMER' : (NW[age] || String(age)) + (age === 1 ? ' SUMMER ON' : ' SUMMERS ON');
    var place = D.clim ? (D.climTo === 0 ? ' TOPS THAT BILL.' : ' IS ' + ORD(D.climTo) + ' ON THAT BILL.') : '';
    if (n < 2 || !D.clim || STAT(y)) return 'TODAY’S ' + y + ' BILL, BY HOW FAR EACH ACT HAS GONE.';
    if (tp < 0.04) return D.clim + ': ' + (derived ? 'A SMALL NAME AT THE ' + y + ' FESTIVAL.' : (D.climFrom >= 10 ? 'A SMALL NAME' : ORD(D.climFrom)) + ' ON THE ' + y + ' POSTER.');
    if (!atEnd) return 'WATCH THE BILL GROW UP';
    return age < 3 ? since + ', SO FAR: ' + D.clim + place + ' IT TAKES A FEW SUMMERS TO KNOW.' : since + ': ' + D.clim + place;
  }

  function STAT(y) { var D = C && C[y]; return +y <= 2005 || !!(D && D.src !== 'real billing'); } // still posters: 2005 and earlier (Zale, Nov 9), and any year without real poster billing (Zale's rule: no source, show today only). Real billing so far: 2023, 2024
  /* Zale, Nov 11: on phone the time reads as a calendar page that ticks from the festival month to today while the poster runs */
  var MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function calH(y, frac) { var m0 = 7, tot = (TODAY - (+y)) * 12 + (10 - m0), m = m0 + Math.round(Math.max(0, Math.min(1, frac)) * tot); return '<b class="pk-cl-mo">' + MON[m % 12] + '</b><b class="pk-cl-yr">' + ((+y) + Math.floor(m / 12)) + '</b>'; }
  function stop() { if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; } S.playing = false; }
  /* Play / replay (Zale, Nov 10): a pause resumes where it stopped; a replay first glides back to the printed bill, holds there a second so the start is clear, then runs. No jumps. */
  /* Play / replay. One fixed run for every year, however many six-month steps it has, on an ease that starts and stops at zero speed (Nov 11 refine:
     the old curve ended at half speed, so the last moves stopped instead of settling). A replay glides every name straight back to the printed bill,
     holds there a second so the start is clear, then runs. No jumps. */
  var RUN = 6400, REW = 900, HOLD = 1000, ease = function (u) { return u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * u); };
  function run() {
    var D = C[S.y], n = D.labels.length; if (n < 2 || STAT(S.y)) return; S.seen[S.y] = 1;   /* whatever started it, this year has now played */ stop();
    var t0 = 0, e0 = S.back ? 0 : S.tp / (n - 1), rew = e0 > 0.002 && !RM; S.playing = true; S.back = null; if (!rew) S.tp = 0;
    var fr = function (now) { var el = now - t0;
      if (rew && el < REW) { var q = el / REW; S.back = { e0: e0, k: q * q * (3 - 2 * q) }; S.tp = 0; S.raf = requestAnimationFrame(fr); draw(); return; }
      S.back = null; var t = el - (rew ? REW + HOLD : 1000);
      if (t < 0) { S.tp = 0; S.raf = requestAnimationFrame(fr); draw(); return; }
      var u = Math.min(1, t / RUN), done = u >= 1; S.tp = (n - 1) * ease(u); if (done) { S.playing = false; S.raf = null; } else S.raf = requestAnimationFrame(fr); draw(); };
    S.raf = requestAnimationFrame(function (now) { t0 = now; fr(now); });
  }
  function go(y) { stop(); S.back = null; S.y = String(y); var n = C[y].labels.length; S.tp = (n > 1 && !RM && !STAT(y)) ? 0 : n - 1; S.seen[S.y] = 0; draw(); check(); }
  function rand() { var O = (window.pkClimbOrder || []).map(String).filter(function (q) { return C[q] && C[q].clim; }); if (O.length > 1) { var oi = O.indexOf(S.y); go(+O[(oi + 1) % O.length]); return; } var P = POOL().filter(function (q) { return String(q) !== S.y; }); if (!S.bag.length) { S.bag = P.slice(); for (var i = S.bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = S.bag[i]; S.bag[i] = S.bag[j]; S.bag[j] = t; } } var y = S.bag.pop(); if (String(y) === S.y && S.bag.length) y = S.bag.pop(); go(y); }

  function draw() {
    if (!mountEl || !C || !S.y) return;
    var y = S.y, D = C[y], n = D.labels.length, tp = Math.max(0, Math.min(n - 1, S.tp)), wAll = mountEl.clientWidth || 360, ph = wAll < 1000;
    var Q = cfg(ph, wAll), F = frame(D, y, n > 1 ? tp / (n - 1) : 1, Q, S.back), PW = F.IW + 2 * Q.PADX, PH = F.H + 2 * Q.PADY, TB = timebar(D, y, tp, F), cap = caption(D, +y, tp), atEnd = tp >= n - 1 - 1e-3;
    var key = y + '|' + Q.ph + '|' + PW + '|' + PH + '|' + TB.show;
    if (mountEl._key === key && mountEl.querySelector('.pk-cl-layer')) {
      mountEl.querySelector('.pk-cl-layer').innerHTML = F.html;
      var tb = mountEl.querySelector('.pk-cl-tb'); if (tb && tb.querySelector('.pk-cl-tf')) { tb.querySelector('.pk-cl-tf').style.width = (TB.frac * 100).toFixed(1) + '%'; var mk = tb.querySelector('.pk-cl-tm'); mk.style.left = (TB.frac * 100).toFixed(1) + '%'; var cal = tb.querySelector('.pk-cl-cal'); if (cal) { var ch = calH(y, TB.frac); if (cal._h !== ch) { cal.innerHTML = ch; cal._h = ch; } } else { mk.textContent = TB.yNow; mk.style.opacity = TB.frac > 0.04 && TB.frac < 0.96 ? '1' : '0'; } var rb = tb.querySelector('.pk-cl-rpl'); if (rb) { rb.textContent = TB.btn; rb.setAttribute('aria-label', TB.aria); } var tl = mountEl.querySelector('.pk-cl-tl'); if (tl && tl.textContent !== TB.line) tl.textContent = TB.line; }
      var cp = mountEl.querySelector('.pk-cl-cap'); if (cp.textContent !== cap) cp.textContent = cap; cp.style.color = atEnd ? '#F2CF62' : '#CFC9BC';
      return;
    }
    var fa = document.activeElement, fk = fa && mountEl.contains(fa) ? fa.getAttribute('data-cl') : null;
    var corner = function (cx, cy) { return 'radial-gradient(circle at ' + cx + ' ' + cy + ',#000 0,transparent 22%)'; }, cm = [corner('0', '0'), corner('100%', '0'), corner('0', '100%'), corner('100%', '100%')].join(',');
    var capH = '<p class="pk-cl-cap" aria-live="polite" style="color:' + (atEnd ? '#F2CF62' : '#CFC9BC') + '">' + esc(cap) + '</p>', tbH = '';
    var h = '<div class="pk-cl-hd"><div class="pk-cl-ht"><p class="pk-nh-k">Still happening</p><h2 class="pk-nh-h2" id="pk-cl-h">Wait, they all played <span style="color:' + (YC[y] || '#F2CF62') + '">Pickathon ' + y + '?</span></h2>'
      + (Q.ph ? '' : capH) + '</div>'
      + (Q.ph ? '' : '<button type="button" class="pk-cl-an" data-cl="rand">↻ Another year</button>') + '</div>';
    if (TB.show) tbH += '<div class="pk-cl-tb"><span class="pk-cl-ty">' + y + '</span><span class="pk-cl-tr" aria-hidden="true"><i class="pk-cl-tf" style="width:' + (TB.frac * 100).toFixed(1) + '%"></i><b class="pk-cl-tm" style="left:' + (TB.frac * 100).toFixed(1) + '%;opacity:' + (TB.frac > 0.04 && TB.frac < 0.96 ? 1 : 0) + '">' + TB.yNow + '</b></span><span class="pk-cl-ty">' + TODAY + '</span><button type="button" class="pk-cta sec pk-cl-rpl" data-cl="play" aria-label="' + TB.aria + '">' + TB.btn + '</button></div><p class="pk-cl-tl" aria-hidden="true">' + esc(TB.line) + '</p>';
    if (!Q.ph) h += tbH;
    h += '<div class="pk-cl-pw" style="width:' + PW + 'px;height:' + PH + 'px">';
    h += '<div class="pk-cl-p" data-cl="year" role="link" tabindex="0" aria-label="Pickathon ' + y + ': open the ' + y + ' page" style="width:' + PW + 'px;height:' + PH + 'px;background:' + F.PAPER + '">';
    h += '<i aria-hidden="true" class="pk-cl-tone" style="background-image:radial-gradient(' + F.B + ' 1.4px,transparent 1.9px);-webkit-mask-image:' + cm + ';mask-image:' + cm + '"></i><i aria-hidden="true" class="pk-cl-grain" style="background-image:' + GRAIN + '"></i><i aria-hidden="true" class="pk-cl-frame" style="border-color:' + F.A + ';inset:' + (Q.ph ? 8 : 14) + 'px"></i>';
    h += '<div class="pk-cl-art" aria-hidden="true" style="position:absolute;left:' + Q.PADX + 'px;top:' + Q.PADY + 'px;width:' + F.IW + 'px;height:' + F.H + 'px">' + F.art + '</div>';   /* static: drawn once per year, never in the animation frames */
    h += '<div class="pk-cl-layer" aria-hidden="true" style="position:absolute;left:' + Q.PADX + 'px;top:' + Q.PADY + 'px;width:' + F.IW + 'px;height:' + F.H + 'px">' + F.html + '</div>';
    h += '</div>';
    h += '</div>';
    if (Q.ph && TB.show) tbH = '<div class="pk-cl-tb pk-cl-tbp"><span class="pk-cl-cal" aria-hidden="true">' + calH(y, TB.frac) + '</span><span class="pk-cl-tr" aria-hidden="true"><i class="pk-cl-tf" style="width:' + (TB.frac * 100).toFixed(1) + '%"></i><b class="pk-cl-tm" style="left:' + (TB.frac * 100).toFixed(1) + '%;opacity:0"></b></span><span class="pk-cl-ty">' + TODAY + '</span><button type="button" class="pk-cta sec pk-cl-rpl" data-cl="play" aria-label="' + TB.aria + '">' + TB.btn + '</button></div>';
    if (RM && n > 1 && !STAT(y)) {   /* Zale, Nov 11: with reduced motion, the printed bill and today's bill side by side, no movement */
      var top8 = function (k) { return D.names.filter(function (x) { return x[1][k] < Math.min(10, D.ranked || 10); }).sort(function (a, b) { return a[1][k] - b[1][k]; }).slice(0, Q.ph ? 4 : 8).map(function (x) { return '<li>' + esc(x[0]) + '</li>'; }).join(''); };
      tbH = '<div class="pk-cl-cmp"><div><p class="pk-cl-cmpk">' + (D.src === 'real billing' ? 'On the ' + y + ' poster' : 'As booked in ' + y) + '</p><ol>' + top8(0) + '</ol></div><div><p class="pk-cl-cmpk pk-cl-cmpn">Ranked today</p><ol>' + top8(n - 1) + '</ol></div></div>';
      if (!Q.ph) h = h.replace('<div class="pk-cl-pw"', tbH + '<div class="pk-cl-pw"');
    }
    if (Q.ph && !TB.show && !(RM && n > 1 && !STAT(y))) tbH = '<div class="pk-cl-tb pk-cl-tbp pk-cl-tbs"><span class="pk-cl-cal" aria-hidden="true">' + calH(y, 1) + '</span><span class="pk-cl-tls">Ranked today by how far each act has gone</span></div>';   /* every year keeps the same row, so ANOTHER YEAR never moves (review r1 A3) */
    if (Q.ph) h += '<div class="pk-cl-below">' + capH.replace('class="pk-cl-cap"', 'class="pk-cl-cap pk-sr"') + tbH + '<button type="button" class="pk-cl-an pk-cl-anb" data-cl="rand">↻ Another year</button></div>';   /* Zale, Nov 11: caption, time bar and Another year under the poster, full width */
    var fin = D.names.filter(function (x) { return x[1][n - 1] < Math.min(10, D.ranked || 10); }).sort(function (a, b) { return a[1][n - 1] - b[1][n - 1]; }).map(function (x) { return x[0]; });
    h += '<p class="pk-sr">Pickathon ' + y + ', ranked today by how far each act has gone: ' + esc(fin.join(', ')) + '.</p>';
    mountEl.innerHTML = h; mountEl.setAttribute('data-y', y); mountEl._key = key;
    fitScreen(PW, PH);
    var me = mountEl; requestAnimationFrame(function () { try { document.documentElement.style.setProperty('--pkclh', me.offsetHeight + 'px'); } catch (e) {} });
    if (fk) { var nf = mountEl.querySelector('[data-cl="' + fk + '"]'); if (nf) try { nf.focus({ preventScroll: true }); } catch (e) {} }
  }
  function fitScreen(PW, PH) {
    var pw = mountEl.querySelector('.pk-cl-pw'), hd = mountEl.querySelector('.pk-cl-hd'); if (!pw || !hd) return;
    var vh = window.innerHeight || 800, top = 0, bot = 0;
    try { [].forEach.call(document.querySelectorAll('header'), function (hb) { var r = hb.getBoundingClientRect(), cs = getComputedStyle(hb); if (r.height > 0 && (cs.position === 'sticky' || cs.position === 'fixed' || (r.top <= 1 && r.bottom > 0))) top = Math.max(top, Math.min(140, r.bottom));   /* a header that stays on screen outside the scroller counts too */ }); var tb = document.querySelector('nav[aria-label="App"]'); if (tb) { var tr = tb.getBoundingClientRect(); if (tr.height > 0 && tr.top > vh / 2) bot = vh - tr.top; } } catch (e) {}
    if (!bot && window.innerWidth < 1000) bot = 64;
    var sec = mountEl.closest('section'), pad = 0; if (sec) { var cs = getComputedStyle(sec); pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); }
    var bl = mountEl.querySelector('.pk-cl-below'), avail = vh - top - bot - hd.offsetHeight - 22 - pad - (bl ? bl.offsetHeight + 8 : 0), sc = Math.min(1, Math.max(window.innerWidth < 1000 ? (vh < 700 ? 0.8 : 0.9) : 0.66, avail / PH));  /* a phone poster never shrinks to a postage stamp (review r1 A2) */
    pw.style.transformOrigin = 'top center'; pw.style.transform = sc < 0.999 ? 'scale(' + sc.toFixed(3) + ')' : '';
    pw.style.marginBottom = sc < 0.999 ? (-(PH * (1 - sc))).toFixed(0) + 'px' : ''; mountEl.style.display = 'flow-root';
  }
  function check() {
    if (!mountEl || RM || S.seen[S.y] || S.playing) return;
    var pe = mountEl.querySelector('.pk-cl-p') || mountEl, r = pe.getBoundingClientRect(), vh = window.innerHeight || 800, vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (vis >= Math.min(r.height, vh) * 0.6) { S.seen[S.y] = 1; if (C[S.y].labels.length > 1) setTimeout(run, 300); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-cl]'); if (!b || !mountEl || !mountEl.contains(b)) return;
    var a = b.getAttribute('data-cl'); e.preventDefault();
    if (a === 'play') { e.stopPropagation(); S.seen[S.y] = 1; run(false); }
    else if (a === 'rand') rand();
    else if (a === 'year') { try { window.pkOpenYear && window.pkOpenYear(S.y); } catch (x) {} }
  }, true);
  /* Zale, Nov 11 10:10: no slider on Home. The time bar only shows progress; the draggable version belongs on the year page. */
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('pk-cl-p') && mountEl && mountEl.contains(e.target)) { e.preventDefault(); try { window.pkOpenYear && window.pkOpenYear(S.y); } catch (x) {} } });
  function tick() {
    var m = document.querySelector('.pk-cl-mount');
    if (!m) { mountEl = null; return; }
    if (!C) { C = window.pkClimb || null; if (!C) return; }
    if (m !== mountEl || !m.firstChild) { mountEl = m; mountEl._key = null; if (!S.y) { var y0 = window.pkClimbY0 && C[window.pkClimbY0] ? window.pkClimbY0 : POOL()[0]; S.y = String(y0); S.tp = (!RM && !STAT(S.y) && C[S.y].labels.length > 1) ? 0 : C[S.y].labels.length - 1; } draw(); }
    check();
  }
  setInterval(tick, 400); try { new MutationObserver(function () { var m = document.querySelector('.pk-cl-mount'); if (m && (m !== mountEl || !m.firstChild)) tick(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} window.addEventListener('scroll', function () { if (mountEl) check(); }, { passive: true, capture: true });
  var lh = 0; window.addEventListener('resize', function () { var h = window.innerHeight; if (mountEl && h !== lh) { lh = h; mountEl._key = null; draw(); } });
  var lw = 0; window.addEventListener('resize', function () { var w = mountEl ? mountEl.clientWidth : 0; if (w && w !== lw) { lw = w; draw(); } });
  window.__pkClimbGo = function (y) { go(y); };  // test hook
  window.pkClimbDraw = function () { draw(); };
  try { document.fonts && document.fonts.ready.then(function () { MCK = {}; if (mountEl) { mountEl._key = null; draw(); } }); } catch (e) {}
})();
