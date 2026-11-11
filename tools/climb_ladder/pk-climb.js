/*pk-climb v2: Home "The climb" as the vertical ladder (home_flow.md section 5, Zale Nov 9 00:14-00:59; Design Studio board ClimbLadderDesk).
  One big vertical: every name moves straight up or down at the same time on one smooth curve, bigger names in front, a faint halftone glow on the biggest,
  the top spot's ray fans pass to the new #1, a ▲ on the three biggest risers. The poster carries its own clock: a date stamp that counts from the
  festival year to today, and tapping it plays again. ANOTHER YEAR picks a random summer. The whole poster opens that year's page. Data: d.climb.*/
(function () {
  var KIT = __KIT__;
  var YC = __YC__;
  var C = null, S = { y: null, tp: 1, playing: false, seen: {}, raf: null, bag: [] }, mountEl = null, RM = false, TODAY = 2026, DUR = 3800, TOTAL = 6400; /* one fixed run however many keyframes a year has (Zale, Nov 10) */
  var flow = function (u) { return u <= 0 ? 0 : u >= 1 ? 1 : 0.5 * u + 0.5 * (u * u * (3 - 2 * u)); };   /* gentle at both ends, never a stop in the middle */
  var seg = function (n, fk) { return fk <= 0 ? 0 : fk >= 1 ? 1 : n > 2 ? 0.7 * fk + 0.3 * (fk * fk * (3 - 2 * fk)) : 0.5 - 0.5 * Math.cos(Math.PI * fk); };
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var NW = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY', 'TWENTY-ONE', 'TWENTY-TWO', 'TWENTY-THREE', 'TWENTY-FOUR', 'TWENTY-FIVE', 'TWENTY-SIX', 'TWENTY-SEVEN'];
  var ORD = function (k) { return (k + 1) + (k === 0 ? 'ST' : k === 1 ? 'ND' : k === 2 ? 'RD' : 'TH'); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var sm = function (t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };
  var cw = function (c) { return ' .,\'’“”"!:'.indexOf(c) >= 0 ? 0.24 : 'IJ1'.indexOf(c) >= 0 ? 0.25 : 'MW'.indexOf(c) >= 0 ? 0.62 : 0.47; };
  var tw = function (t) { var m = mw(t, 100); if (m) return m / 100; var s = 0; for (var i = 0; i < t.length; i++) s += cw(t[i]); return s + t.length * 0.012; };   /* measured with the real font when it can be */
  var MC = null, MCK = {}; var mw = function (t, fs) { try { var k = t + '|' + fs; if (MCK[k]) return MCK[k]; if (!MC) { MC = document.createElement('canvas').getContext('2d'); } MC.font = '800 ' + fs + "px 'Bricolage Grotesque'"; try { MC.fontStretch = 'condensed'; } catch (e) {} return (MCK[k] = MC.measureText(t).width); } catch (e) { return 0; } };
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
        /* Zale, Nov 10: class first (Legend, Discovery, Deep cut); then magnitude, with Deep cut at -1 for ranking; then confidence; then name. */
        var adj = function (r) { return (+r[2] || 0) - (r[1] === 'Deep cut' ? 1 : 0); };
        var ka = [CL[a[1]] || 0, -adj(a), -(CF[a[3]] || 0)], kb = [CL[b[1]] || 0, -adj(b), -(CF[b[3]] || 0)];
        for (var i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
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
    if (!ph) return { ph: false, IW: 880, PADX: 40, PADY: 22, ART: { x: 0, y: 118, w: 330 }, COLX: 356, COLW: 524, Y0: 0, LANES: [[80, 74, 2], [44, 41, 1], [44, 41, 1], [44, 41, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1], [33, 29, 1]], GAP: 5, R1: 22, ROWH: 21, FS: 13, CFS: 15, DATES: 15, DGAP: 42, BOT: 100, RIB: [40, 14], STAMP: 0.92 };
    var PW = Math.max(300, Math.min(wAvail, 720)), IW = PW - 32, k = Math.min(1.7, IW / 326), L = function (h, m, ml) { return [Math.round(h * k), Math.round(m * k), ml]; };
    var AW = Math.round(96 * k), CG = Math.round(12 * k);   /* Zale, Nov 11: phone keeps the horizontal poster, art static on the left, names move in the column on the right (spec home_climb_phone_nov9b section 1) */
    return { ph: true, IW: IW, PADX: 16, PADY: 14, ART: { x: 0, y: 0, w: AW }, COLX: AW + CG, COLW: IW - AW - CG, Y0: 0,
      LANES: [L(40, 28, 2), L(27, 20, 1), L(27, 20, 1), L(27, 20, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1), L(20, 15, 1)], GAP: Math.round(3 * k), R1: Math.round(13 * k), ROWH: Math.round(16 * k), FS: Math.max(11, 11 * k), CFS: Math.max(12, 12 * k), DATES: Math.max(11, 11 * k), DGAP: Math.round(30 * k), BOT: Math.round(30 * k) + Math.round(Math.max(11, 11 * k)) + 12 + Math.max(34, Math.round(32 * k)), RIB: [Math.max(34, Math.round(32 * k)), Math.max(12, 12 * k)], STAMP: 0.7 * k };
  }

  // One frame of the ladder at time tp (0 = festival, n-1 = today). Returns the paper's inner HTML and its height.
  function frame(D, y, tp, Q) {
    var K = KIT[y] || {}, n = D.labels.length, PAPER = D.paper, A = D.inks[0], B = D.inks[1] || D.inks[0], H = K.head && K.hc >= 3 ? K.head : A;
    var IW = Q.IW, LN = Math.min(10, D.ranked || 10);
    var S = [], yy = Q.Y0; Q.LANES.forEach(function (L, r) { S.push({ x: Q.COLX, y: yy, w: Q.COLW, h: L[0], k: 0.5, mx: L[1], ml: L[2], ink: r === 0 ? H : r % 2 ? A : B, head: r === 0 }); yy += L[0] + Q.GAP; });
    var ROW1 = S[9].y + S[9].h + Q.R1, ROWMAX = Math.round(IW * (Q.ph ? 0.88 : 0.8)), DATESY = ROW1 + Q.DGAP, BOXH = ROW1 + Q.BOT, TOP = Q.LANES[0][1];
    var fit = function (nm, s) { var wd = nm.split(' '), opts = [{ L: [nm], lead: false }];
      if (s.ml > 1) for (var i = 1; i < wd.length; i++) { var a = wd.slice(0, i).join(' '), b = wd.slice(i).join(' '); opts.push({ L: [a, b], lead: false }); if (LEAD.indexOf(a) >= 0 && b.length > 3) opts.push({ L: [a, b], lead: true }); }
      var best = null; opts.forEach(function (o) { var ws = o.L.map(function (t, i) { return tw(t) * (o.lead && i === 0 ? 0.55 : 1); }), hs = o.L.length === 1 ? LH : o.lead ? LH * 1.55 + 0.04 : LH * 2 + 0.04;
        var fanR = s.head ? Math.min(s.mx * 0.62, 90) * 0.81 + Math.max(8, s.mx * 0.12) + 4 : 0, mw = Math.max.apply(null, ws), f = Math.min(s.mx, (s.w - 2 * Math.max(fanR, s.head ? 46 : 0)) * 0.97 / mw, s.h / hs);
        if (!best || f > best.f + (o.lead ? -2 : 0.5) || (Math.abs(f - best.f) <= 0.5 && o.L.length === best.L.length && !o.lead && !best.lead && mw < best.mw)) best = { f: f, mw: mw, L: o.L, lead: o.lead }; }); return best; };
    var posAt = function (si) { var P = {};
      D.names.forEach(function (x0) { var r = x0[1][si]; if (r < LN) { var s = S[r], b = fit(x0[0], s); P[x0[0]] = { x: s.x + s.k * s.w, y: s.y + s.h, k: s.k, f: b.f, L: b.L, lead: b.lead, ink: s.ink, head: !!s.head, line: r, on: true }; } });
      var off = D.names.filter(function (x) { return x[1][si] >= LN; }).sort(function (p, q) { return p[1][si] - q[1][si]; });
      var cl = D.names.filter(function (x) { return x[0] === D.clim; })[0], climOff = !!cl && cl[1][si] >= LN, FS = Q.FS, CFS = Q.CFS, SEP = 14 + 0.6 * FS * 0.8 + 12, sw = function (t, fs) { var m = mw(t, fs); return (m ? m : tw(t) * fs * 1.14) + t.length * 0.04 * fs + 2; };   /* measured, so the small names never touch (Zale, Nov 9 09:02) */
      var rows = [[]], rw = [0], shown = 0, hide = function (x0, fs) { P[x0[0]] = { x: IW / 2, y: ROW1, k: 0.5, f: fs, L: [x0[0]], ink: A, line: 30, on: false, vis: false }; };
      off.forEach(function (x0) { var isC = x0[0] === D.clim, fs = isC ? CFS : FS, w = sw(x0[0], fs); if (w > ROWMAX) { fs = Math.max(8, fs * ROWMAX / w * 0.97); w = sw(x0[0], fs); }  /* a long name shrinks to fit instead of running off both edges (Design Studio review, Nov 9) */
        var r = rows.length - 1, add = rows[r].length ? SEP + w : w;
        var needC = climOff && !isC && !rows.some(function (row) { return row.some(function (q) { return q.isC; }); }) ? SEP + sw(cl[0], CFS) : 0;
        if (rw[r] + add + (r === 1 ? needC : 0) > ROWMAX) { if (r === 0) { rows.push([]); rw.push(0); r = 1; } else if (!isC) { hide(x0, fs); return; } }
        if (shown >= (Q.ph ? 6 : 16) && !isC) { hide(x0, fs); return; }
        rw[r] += rows[r].length ? SEP + w : w; rows[r].push({ x0: x0, fs: fs, w: w, isC: isC }); shown++; });
      var rules = [];
      rows.forEach(function (row, ri) { var x = (IW - rw[ri]) / 2, yb = ROW1 + ri * Q.ROWH; if (row.length) rules.push({ y: yb - 8, a: x - 20, b: x + rw[ri] + 20 });
        row.forEach(function (q, i) { if (i) x += SEP; P[q.x0[0]] = { x: x, y: yb, k: 0, f: q.fs, L: [q.x0[0]], sep: i > 0, ink: A, line: 10 + ri * 20 + i, on: false }; x += q.w; }); });
      P.__rules = rules; return P; };
    var k0 = Math.floor(tp), k1 = Math.min(n - 1, k0 + 1), fk = tp - k0, PA = posAt(k0), PB = posAt(k1);
    var same = function (a, b) { return a.x === b.x && a.y === b.y && a.f === b.f && a.k === b.k; };
    // every name takes the same time on one smooth curve (Zale, Nov 9 00:27)
    var G = seg(n, fk);
    var LAST = S[LN - 1], VOFF = function (nm, f0, src) { return { x: LAST.x + 0.5 * LAST.w, y: LAST.y + LAST.h + 14, k: 0.5, f: Math.min(f0 || LAST.mx, LAST.mx) * 0.8, L: src.L, lead: src.lead, ink: A, line: LN, on: true }; };
    var op = function (nm, a, b) { var va = a.vis !== false, vb = b.vis !== false;
      if (same(a, b)) return va ? [[a, a.on ? 1 : 1 - 0.7 * Math.sin(G * Math.PI), 0]] : [];
      var g = G, mv = g > 0 && g < 1;
      if (!a.on && !b.on) { var s2 = sm((g - 0.3) / 0.4), dip = 1 - 0.7 * Math.sin(G * Math.PI); return [va ? [a, (1 - s2) * dip, g] : null, vb ? [b, s2 * dip, g] : null].filter(Boolean); }
      var A0 = a.on ? a : VOFF(nm, b.f, b), B0 = b.on ? b : VOFF(nm, a.f, a), up = B0.f > A0.f;
      var swell = mv ? Math.sin(g * Math.PI) * (nm === D.clim ? 0.25 : up ? 0.15 : -0.08) : 0;
      var pos = { x: A0.x + (B0.x - A0.x) * g, y: A0.y + (B0.y - A0.y) * g, k: A0.k + (B0.k - A0.k) * g, f: (A0.f + (B0.f - A0.f) * g) * (1 + swell), ink: mix(A0.ink, B0.ink, g), moving: mv, on: true };
      var o = 1 - (mv && !up ? 0.75 * Math.sin(g * Math.PI) : 0);   /* fallers step back while names cross (review r2) */ if (!a.on) o *= sm(g / 0.3); if (!b.on) o *= 1 - sm((g - 0.15) / 0.55);
      var out = [], sameShape = A0.L.join('|') === B0.L.join('|') && !!A0.lead === !!B0.lead;
      if (sameShape) out.push([Object.assign({}, g < 0.5 ? A0 : B0, pos), o, g]);
      else { var s3 = sm((g - 0.35) / 0.3); out.push([Object.assign({}, A0, pos), o * (1 - s3), g], [Object.assign({}, B0, pos), o * s3, g]); }
      if (!a.on && va) out.push([a, (1 - sm(g * 3)) * (1 - 0.7 * Math.sin(G * Math.PI)), g]);
      if (!b.on && vb) out.push([b, sm((g - 0.6) / 0.4) * (1 - 0.7 * Math.sin(G * Math.PI)), g]);
      return out; };
    var drawn = []; D.names.forEach(function (x) { op(x[0], PA[x[0]], PB[x[0]]).forEach(function (q) { if (q[1] > 0.005) drawn.push([x, q]); }); });
    var fTo = function (q) { var b = PB[q[0][0]], a = PA[q[0][0]]; return Math.max(q[1][0].f, b && b.on ? b.f : 0, a && a.on && !(b && b.on) ? 0 : 0); };
    drawn.sort(function (u, v) { return fTo(u) - fTo(v); }); // bigger names in front, judged by where they are headed
    var GLOWINK = (K.light && K.light.toUpperCase() !== PAPER.toUpperCase() && K.light.toUpperCase() !== '#FFFFFF') ? K.light : B;
    var dims = function (p) { var w = Math.max.apply(null, p.L.map(function (t, i) { return tw(t) * (p.lead && i === 0 ? 0.55 : 1); })) * p.f, h = (p.L.length > 1 ? (p.lead ? 1.55 : 2) : 1) * LH * p.f; return { w: w, h: h, cx: p.x + (0.5 - p.k) * w, cy: p.y - h / 2 }; };
    var h = '';
    // faint halftone glow behind the biggest names (Zale: subtle, never tacky)
    drawn.forEach(function (q) { var p = q[1][0], o = q[1][1]; if (!p.on) return; var t = Math.max(0, Math.min(1, (p.f / TOP - 0.62) / 0.85)); if (t <= 0.02) return; var d = dims(p), W = d.w + p.f * 1.3, Hh = d.h + p.f * 0.8, dot = Q.ph ? 0.8 : 1.1;
      h += '<i aria-hidden="true" style="position:absolute;left:' + (d.cx - W / 2).toFixed(1) + 'px;top:' + (d.cy - Hh / 2).toFixed(1) + 'px;width:' + W.toFixed(1) + 'px;height:' + Hh.toFixed(1) + 'px;pointer-events:none;background-image:radial-gradient(' + GLOWINK + ' ' + dot + 'px,transparent ' + (dot + 0.5) + 'px);background-size:' + (Q.ph ? 4 : 5) + 'px ' + (Q.ph ? 4 : 5) + 'px;opacity:' + (o * (0.12 + 0.26 * t)).toFixed(3) + ';-webkit-mask-image:radial-gradient(closest-side,#000 ' + (30 + 30 * t).toFixed(0) + '%,transparent 100%);mask-image:radial-gradient(closest-side,#000 ' + (30 + 30 * t).toFixed(0) + '%,transparent 100%)"></i>'; });
    // the crown: the printed ray fans belong to the top line and pass to the new #1
    var crownOf = [];
    D.names.forEach(function (x) { var a = PA[x[0]], b = PB[x[0]], wa = a && a.on && a.line === 0 ? 1 : 0, wb = b && b.on && b.line === 0 ? 1 : 0; if (!wa && !wb) return;
      var g = same(a, b) ? 1 : G, w = wa && wb ? 1 : wa ? 1 - sm(g * 1.4) : sm((g - 0.85) / 0.15); if (w > 0.01) crownOf.push([x[0], w]); });
    var cwOf = function (nm) { var c = crownOf.filter(function (c) { return c[0] === nm; })[0]; return c ? c[1] : 0; };
    // risers: the three biggest climbs relative to where they started (10th to 1st beats 41st to 5th), at least 3 places and at least double
    var ACC = K.head && K.hc >= 3 ? K.head : A, lift = function (x) { return Math.log((x[1][0] + 1) / (x[1][n - 1] + 1)); }, gain = function (x) { return x[1][0] - x[1][n - 1]; };
    var RISERS = n < 2 ? [] : D.names.filter(function (x) { return x[1][n - 1] < LN && gain(x) >= 3 && lift(x) >= Math.log(2); }).sort(function (p, q) { return lift(q) - lift(p); }).slice(0, 3).map(function (x) { return x[0]; });
    var showRise = function (x) { if (RISERS.indexOf(x[0]) < 0) return 0; if (tp >= n - 1 - 1e-3) return 1; var now = x[1][k0] + (x[1][k1] - x[1][k0]) * G; return sm(Math.max(0, Math.min(1, (x[1][0] - now) / gain(x) * 1.6))); };
    var FONT = "font-family:'Bricolage Grotesque',sans-serif;font-stretch:75%;font-variation-settings:'wdth' 75;font-weight:800";
    var fans = '';
    drawn.forEach(function (q) { var x = q[0], p = q[1][0], o = q[1][1], g = q[1][2], cl = x[0] === D.clim, al = p.k < 0.25 ? 'left' : p.k > 0.75 ? 'right' : 'center', hh = hash(x[0]);
      var two = p.L.length > 1, small = !p.on, big = p.f >= TOP * 0.5, inkMain = p.ink, inkLead = p.ink === A ? B : A;
      var a0 = PA[x[0]], b0 = PB[x[0]], down = g > 0 && g < 1 && a0.on && (!b0.on || b0.line > a0.line); if (down) o = o * (1 - 0.15 * Math.sin(g * Math.PI));
      var mask = big ? ';-webkit-mask-image:' + WORN + ';mask-image:' + WORN + ';-webkit-mask-size:200px;mask-size:200px;-webkit-mask-position:' + (hh % 200) + 'px ' + ((hh >> 8) % 200) + 'px;mask-position:' + (hh % 200) + 'px ' + ((hh >> 8) % 200) + 'px' : '';
      var lineSt = function (isLead, ink) { return (small ? 'display:inline' : 'display:block;width:fit-content;' + (al === 'left' ? 'margin-right:auto' : al === 'right' ? 'margin-left:auto' : 'margin:0 auto')) + ';color:' + ink + (isLead ? ';font-size:.55em;line-height:1;margin-bottom:.06em' : '') + mask; };
      var rise = small ? 0 : showRise(x), fsM = Math.max(Q.ph ? 9 : 11, p.f * 0.42) / p.f, crw = cwOf(x[0]), d = dims(p);
      var reach = (function () { if (crw < 0.01 || small) return 0; var gap = Math.max(8, p.f * 0.12), sp = Math.min(Math.min(p.f * 0.62, 90), d.cx - d.w / 2 - S[0].x - gap); return sp < 9 ? 0 : (gap + sp * Math.cos(36 * Math.PI / 180) + 6) * crw; })();
      if (crw > 0.01 && !small) { var gapF = Math.max(8, p.f * 0.12), len = Math.min(p.f * 0.62, 90), L0 = d.cx - d.w / 2, R0 = d.cx + d.w / 2, room = { l: L0 - S[0].x - gapF, r: S[0].x + S[0].w - R0 - gapF }, swd = Math.max(2, p.f * 0.035);
        var fan = function (side) { var sp = Math.min(len, room[side]); if (sp < 20) return ''; var x0 = side === 'l' ? L0 - gapF : R0 + gapF, dir = side === 'l' ? -1 : 1;
          return [-36, -18, 0, 18, 36].map(function (deg, i) { var r = deg * Math.PI / 180, l = sp * (i % 2 ? 0.7 : 1); return '<line x1="' + x0.toFixed(1) + '" y1="' + (d.cy + Math.sin(r) * d.h * 0.18).toFixed(1) + '" x2="' + (x0 + dir * Math.cos(r) * l).toFixed(1) + '" y2="' + (d.cy + Math.sin(r) * (d.h * 0.18 + l)).toFixed(1) + '"/>'; }).join(''); };
        fans += '<g stroke="' + (p.ink === A ? B : A) + '" stroke-width="' + swd.toFixed(1) + '" stroke-linecap="square" opacity="' + (crw * o).toFixed(3) + '">' + fan('l') + fan('r') + '</g>'; }
      var roomy = reach === 0 || d.cx - d.w / 2 - reach - p.f * fsM * 1.6 >= S[0].x;
      var cyEm = p.lead ? 0.61 + LH / 2 : two ? LH : LH / 2, nf = Math.min(16, Math.max(Q.ph ? 9 : 12, p.f * 0.2));
      var noteT = 'FROM #' + (x[1][0] + 1), shortT = '#' + (x[1][0] + 1), noteW = tw(noteT) * nf + noteT.length * 0.08 * nf, shortW = tw(shortT) * nf + shortT.length * 0.08 * nf, gapN = Math.max(8, p.f * 0.2);
      var noteFits = d.cx + d.w / 2 + reach + gapN + noteW <= S[0].x + S[0].w + (Q.ph ? 4 : 30), noteO = Math.pow(Math.max(0, Math.min(1, rise)), 3);
      var isTop = x[1][n - 1] === 0, showNote = rise > 0.01 && roomy && noteO > 0.01 && D.src === 'real billing' && (!isTop || noteFits), triPx = p.f * fsM;
      var pre = '', post = '';
      if (p.sep) pre = '<span style="position:absolute;right:100%;top:.32em;margin-right:' + Math.round((26 + 0.48 * p.f) / 2) + 'px;transform:translateX(50%);font-size:.6em;line-height:1;letter-spacing:0;color:' + B + '">★</span>';   /* the star sits in the gap, never pushes the name (Zale, Nov 9 09:02) */
      else if (rise > 0.01 && roomy && !(x[1][n - 1] === 0 && tp >= n - 1 - 1e-3) && crw < 0.5) pre = '<span aria-hidden="true" style="position:absolute;right:100%;top:' + (cyEm / fsM - 0.6 - (showNote && !noteFits ? (nf * 0.55 + 2) / triPx * noteO : 0)).toFixed(2) + 'em;margin-right:' + (0.5 + reach / (p.f * fsM)).toFixed(3) + 'em;font-size:' + fsM.toFixed(3) + 'em;line-height:1;letter-spacing:0;color:' + ACC + ';opacity:' + rise.toFixed(3) + '">▲</span>';
      if (showNote) { var nst = 'font-size:' + nf.toFixed(1) + 'px;line-height:1;text-shadow:none;letter-spacing:.08em;white-space:nowrap;color:' + ACC + ';opacity:' + noteO.toFixed(3);
        post = noteFits ? '<span aria-hidden="true" style="position:absolute;left:100%;top:' + (cyEm * p.f - nf * 0.5).toFixed(1) + 'px;margin-left:' + (gapN + reach).toFixed(1) + 'px;' + nst + '">' + noteT + '</span>'
          : '<span aria-hidden="true" style="position:absolute;right:100%;top:' + (cyEm * p.f + triPx * 0.42 + 3).toFixed(1) + 'px;margin-right:' + (0.5 * triPx + reach + (triPx * 0.8 - shortW) / 2).toFixed(1) + 'px;' + nst + '">' + shortT + '</span>'; }
      var shadow = p.head ? ';text-shadow:' + (Q.ph ? 2 : 3) + 'px ' + (Q.ph ? 2 : 3) + 'px 0 ' + B + 'D9' : '';
      h += '<span style="position:absolute;left:' + p.x.toFixed(1) + 'px;top:' + p.y.toFixed(1) + 'px;transform:translate(' + (-p.k * 100).toFixed(1) + '%,-100%);white-space:pre;text-align:' + al + ';' + FONT + ';line-height:' + LH + ';letter-spacing:' + (big ? '-.01em' : '.04em') + ';font-size:' + p.f.toFixed(2) + 'px;opacity:' + o.toFixed(3) + shadow + '">' + pre
        + '<span style="' + lineSt(p.lead, p.lead ? inkLead : inkMain) + '">' + esc(p.L[0]) + '</span>' + (two ? '<span style="' + lineSt(false, inkMain).replace(/^display:block;/, 'display:block;') + '">' + esc(p.L[1]) + '</span>' : '') + post + '</span>'; });
    var rules = (fk < 0.5 ? PA.__rules : PB.__rules).map(function (r) { return '<i style="position:absolute;left:0;width:' + Math.max(0, r.a).toFixed(0) + 'px;top:' + r.y + 'px;height:1.5px;background:' + B + '"></i><i style="position:absolute;left:' + r.b.toFixed(0) + 'px;right:0;top:' + r.y + 'px;height:1.5px;background:' + B + '"></i>'; }).join('');
    var burst = fans ? '<i aria-hidden="true" style="position:absolute;left:0;top:0;width:' + IW + 'px;height:' + BOXH + 'px;background:' + enc('<svg xmlns="http://www.w3.org/2000/svg" width="' + IW + '" height="' + BOXH + '">' + fans + '</svg>') + ' 0 0/100% 100% no-repeat;pointer-events:none;-webkit-mask-image:' + WORN + ';mask-image:' + WORN + ';-webkit-mask-size:200px;mask-size:200px"></i>' : '';
    var artH = Q.ART.h || (S[9].y + S[9].h - Q.ART.y);
    var art = D.art ? '<img src="' + esc(D.art) + '" alt="" loading="lazy" decoding="async" style="position:absolute;left:' + Q.ART.x + 'px;top:' + Q.ART.y + 'px;width:' + Q.ART.w + 'px;height:' + artH + 'px;object-fit:contain;object-position:' + (Q.ph ? 'center top' : 'center center') + '">'
      : '<div aria-hidden="true" style="position:absolute;left:' + (Q.ART.x + (Q.ph ? 0 : 40)) + 'px;top:' + (Q.ph ? 0 : 60) + 'px;width:' + (Q.ART.w - (Q.ph ? 0 : 80)) + 'px;height:' + (Q.ph ? Math.min(artH, Q.ART.w * 1.6) : artH - 120) + 'px;display:flex;align-items:center;justify-content:center;text-align:center;' + FONT + ';line-height:.86;font-size:' + (Q.ph ? 22 : 80) + 'px;color:' + A + ';border:' + (Q.ph ? 3 : 6) + 'px solid ' + A + '">PICKATHON<br>' + y + '</div>';
    var dl = K.dates ? (K.dates.toUpperCase().replace(/ ?- ?/g, '–') + ' · PENDARVIS FARM' + (Q.ph ? '' : ' · HAPPY VALLEY, OREGON')) : 'PICKATHON ' + y;
    var dates = '<div style="position:absolute;left:0;right:0;top:' + DATESY + 'px;text-align:center;white-space:nowrap;' + FONT + ';font-size:' + Q.DATES + 'px;letter-spacing:.08em;color:' + A + '">' + dl.split(' · ').map(function (t, i) { return (i ? '<span style="font-size:.6em;color:' + B + ';margin:0 ' + (Q.ph ? 6 : 12) + 'px;vertical-align:.2em">★</span>' : '') + esc(t); }).join('') + '</div>';
    var rib = '<div style="position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center"><span class="pk-cl-fl" style="--ink:' + A + '"></span><span style="flex:none;height:' + Q.RIB[0] + 'px;padding:0 ' + (Q.ph ? 16 : 36) + 'px;background:' + A + ' linear-gradient(' + PAPER + '80,' + PAPER + '80) 0 4px/100% 1.5px no-repeat;color:' + PAPER + ';' + FONT + ';font-size:' + Q.RIB[1] + 'px;letter-spacing:.1em;display:flex;align-items:center;white-space:nowrap;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 50%,100% 100%,0 100%,14px 50%)">EXPLORE PICKATHON ' + y + ' →</span><span class="pk-cl-fr" style="--ink:' + A + '"></span></div>';
    return { html: art + h + burst + rules + dates + rib, IW: IW, H: BOXH, A: A, B: B, PAPER: PAPER, ACC: ACC, LIGHT: GLOWINK };
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
  function timebar(D, y, tp) {
    var n = D.labels.length, atEnd = tp >= n - 1 - 1e-3, kk = Math.floor(tp), fk = tp - kk, g = seg(n, fk), frac = n > 1 ? Math.min(1, D.when ? D.when[Math.min(kk, n - 1)] + ((D.when[Math.min(kk + 1, n - 1)] - D.when[Math.min(kk, n - 1)]) * g) : (kk + g) / (n - 1)) : 1;
    var y0 = +y, yNow = n > 1 ? Math.max(y0 + 1, Math.round(y0 + (TODAY - y0) * frac)) : TODAY;
    var line = n < 2 ? 'Ranked by how far each act has gone' : frac <= 0.001 ? (D.src === 'real billing' ? 'The bill as printed in ' + y : 'The bill as booked in ' + y) : (atEnd || yNow >= TODAY) ? 'Ranked today by how far each act has gone' : 'Re-ranked as of ' + yNow;
    var btn = S.playing ? '■ Stop' : atEnd ? '↻ Replay' : '▶ Play';
    return { n: n, show: n > 1 && y0 < TODAY && !STAT(y0), frac: frac, yNow: Math.min(yNow, TODAY), line: line, btn: btn, aria: S.playing ? 'Stop' : atEnd ? 'Replay ' + y + ' to today' : 'Play ' + y + ' to today' };
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
  function stop() { if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; } S.playing = false; }
  var invFlow = function (v) { var lo = 0, hi = 1; for (var q = 0; q < 24; q++) { var m = (lo + hi) / 2; if (flow(m) < v) lo = m; else hi = m; } return (lo + hi) / 2; };
  /* Play / replay (Zale, Nov 10): a pause resumes where it stopped; a replay first glides back to the printed bill, holds there a second so the start is clear, then runs. No jumps. */
  function run(resume) {
    var D = C[S.y], n = D.labels.length; if (n < 2 || STAT(S.y)) return; var from = resume && S.tp > 0 && S.tp < n - 1 - 1e-3 ? S.tp : 0; stop();
    var tot = n > 2 ? TOTAL : DUR, REW = 900, HOLDS = 1000, t0 = performance.now(), u0 = from ? invFlow(from / (n - 1)) : 0, tp0 = S.tp, rew = !from && tp0 > 0.02 && !RM; S.playing = true;
    if (!rew && !from) S.tp = 0;
    var fr = function (now) { var el = now - t0;
      if (rew && el < REW) { var q = el / REW, k = q * q * (3 - 2 * q); S.tp = tp0 * (1 - k); S.raf = requestAnimationFrame(fr); draw(); return; }
      var lead = rew ? REW + HOLDS : (from ? 0 : 1000), t = el - lead;
      if (t < 0) { S.tp = 0; S.raf = requestAnimationFrame(fr); draw(); return; }
      var u = Math.min(1, u0 + t / tot), done = u >= 1; S.tp = done ? n - 1 : (n - 1) * flow(u); if (done) { S.playing = false; S.raf = null; } else S.raf = requestAnimationFrame(fr); draw(); };
    draw(); S.raf = requestAnimationFrame(function (now) { t0 = now; fr(now); });
  }
  function go(y) { stop(); S.y = String(y); var n = C[y].labels.length; S.tp = (n > 1 && !RM && !STAT(y)) ? 0 : n - 1; S.seen[S.y] = 0; draw(); check(); }
  function rand() { var P = POOL().filter(function (q) { return String(q) !== S.y; }); if (!S.bag.length) { S.bag = P.slice(); for (var i = S.bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = S.bag[i]; S.bag[i] = S.bag[j]; S.bag[j] = t; } } var y = S.bag.pop(); if (String(y) === S.y && S.bag.length) y = S.bag.pop(); go(y); }

  function draw() {
    if (!mountEl || !C || !S.y) return;
    var y = S.y, D = C[y], n = D.labels.length, tp = Math.max(0, Math.min(n - 1, S.tp)), wAll = mountEl.clientWidth || 360, ph = wAll < 1000;
    var Q = cfg(ph, wAll), F = frame(D, y, tp, Q), PW = F.IW + 2 * Q.PADX, PH = F.H + 2 * Q.PADY, TB = timebar(D, y, tp), cap = caption(D, +y, tp), atEnd = tp >= n - 1 - 1e-3;
    var key = y + '|' + Q.ph + '|' + PW + '|' + PH + '|' + TB.show;
    if (mountEl._key === key && mountEl.querySelector('.pk-cl-layer')) {
      mountEl.querySelector('.pk-cl-layer').innerHTML = F.html;
      var tb = mountEl.querySelector('.pk-cl-tb'); if (tb) { tb.querySelector('.pk-cl-tf').style.width = (TB.frac * 100).toFixed(1) + '%'; var mk = tb.querySelector('.pk-cl-tm'); mk.style.left = (TB.frac * 100).toFixed(1) + '%'; mk.textContent = TB.yNow; mk.style.opacity = TB.frac > 0.04 && TB.frac < 0.96 ? '1' : '0'; var rb = tb.querySelector('.pk-cl-rpl'); if (rb) { rb.textContent = TB.btn; rb.setAttribute('aria-label', TB.aria); } var tl = mountEl.querySelector('.pk-cl-tl'); if (tl.textContent !== TB.line) tl.textContent = TB.line; }
      var cp = mountEl.querySelector('.pk-cl-cap'); if (cp.textContent !== cap) cp.textContent = cap; cp.style.color = atEnd ? '#F2CF62' : '#CFC9BC';
      return;
    }
    var fa = document.activeElement, fk = fa && mountEl.contains(fa) ? fa.getAttribute('data-cl') : null;
    var corner = function (cx, cy) { return 'radial-gradient(circle at ' + cx + ' ' + cy + ',#000 0,transparent 22%)'; }, cm = [corner('0', '0'), corner('100%', '0'), corner('0', '100%'), corner('100%', '100%')].join(',');
    var h = '<div class="pk-cl-hd"><div class="pk-cl-ht"><p class="pk-nh-k">Still happening</p><h2 class="pk-nh-h2" id="pk-cl-h">Wait, they all played <span style="color:' + (YC[y] || '#F2CF62') + '">Pickathon ' + y + '?</span></h2>'
      + '<p class="pk-cl-cap" aria-live="polite" style="color:' + (atEnd ? '#F2CF62' : '#CFC9BC') + '">' + esc(cap) + '</p></div>'
      + (Q.ph ? '' : '<button type="button" class="pk-cl-an" data-cl="rand">↻ Another year</button>') + '</div>';
    if (TB.show) h += '<div class="pk-cl-tb"><span class="pk-cl-ty">' + y + '</span><span class="pk-cl-tr" aria-hidden="true"><i class="pk-cl-tf" style="width:' + (TB.frac * 100).toFixed(1) + '%"></i><b class="pk-cl-tm" style="left:' + (TB.frac * 100).toFixed(1) + '%;opacity:' + (TB.frac > 0.04 && TB.frac < 0.96 ? 1 : 0) + '">' + TB.yNow + '</b></span><span class="pk-cl-ty">' + TODAY + '</span><button type="button" class="pk-cta sec pk-cl-rpl" data-cl="play" aria-label="' + TB.aria + '">' + TB.btn + '</button></div><p class="pk-cl-tl" aria-hidden="true">' + esc(TB.line) + '</p>';
    h += '<div class="pk-cl-pw" style="width:' + PW + 'px;height:' + PH + 'px">';
    h += '<div class="pk-cl-p" data-cl="year" role="link" tabindex="0" aria-label="Pickathon ' + y + ': open the ' + y + ' page" style="width:' + PW + 'px;height:' + PH + 'px;background:' + F.PAPER + '">';
    h += '<i aria-hidden="true" class="pk-cl-tone" style="background-image:radial-gradient(' + F.B + ' 1.4px,transparent 1.9px);-webkit-mask-image:' + cm + ';mask-image:' + cm + '"></i><i aria-hidden="true" class="pk-cl-grain" style="background-image:' + GRAIN + '"></i><i aria-hidden="true" class="pk-cl-frame" style="border-color:' + F.A + ';inset:' + (Q.ph ? 8 : 14) + 'px"></i>';
    h += '<div class="pk-cl-layer" aria-hidden="true" style="position:absolute;left:' + Q.PADX + 'px;top:' + Q.PADY + 'px;width:' + F.IW + 'px;height:' + F.H + 'px">' + F.html + '</div>';
    h += '</div>';
    h += '</div>';
    if (Q.ph) h += '<button type="button" class="pk-cl-an pk-cl-anb" data-cl="rand">↻ Another year</button>';   /* Zale, Nov 11: under the poster, full width */
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
    try { [].forEach.call(document.querySelectorAll('header'), function (hb) { var r = hb.getBoundingClientRect(), cs = getComputedStyle(hb); if (r.height > 0 && (cs.position === 'sticky' || cs.position === 'fixed')) top = Math.max(top, Math.min(140, r.height)); }); var tb = document.querySelector('nav[aria-label="App"]'); if (tb) { var tr = tb.getBoundingClientRect(); if (tr.height > 0 && tr.top > vh / 2) bot = vh - tr.top; } } catch (e) {}
    if (!bot && window.innerWidth < 1000) bot = 64;
    var sec = mountEl.closest('section'), pad = 0; if (sec) { var cs = getComputedStyle(sec); pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); }
    var anb = mountEl.querySelector('.pk-cl-anb'), avail = vh - top - bot - hd.offsetHeight - 22 - pad - (anb ? anb.offsetHeight + 12 : 0), sc = Math.min(1, Math.max(0.66, avail / PH));
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
    if (a === 'play') { e.stopPropagation(); if (S.playing) { stop(); draw(); } else run(true); }
    else if (a === 'rand') rand();
    else if (a === 'year') { try { window.pkOpenYear && window.pkOpenYear(S.y); } catch (x) {} }
  }, true);
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
