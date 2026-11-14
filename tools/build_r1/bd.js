/* pk-build1: Build with Pickathon, round 1 (Nov 13 2026). Route 'build'. Spec: photo-catalog/design_specs/build_page.md (Zale, Nov 8).
   Source: tools/build_r1/bd.js, spliced into index.html by tools/build_r1/build.py (<script id="pk-build1">, <style id="pk-build1-css">).
   Draws into <div id="bd1" data-pk-own> (the app's renderer leaves it alone). Every word comes from data.json buildPage and buildCopy;
   the builds row from hoods (2026: nx, by, hy; earlier years: pb + same-year pk-pb photos in hr) and privateBuilds.
   The one-question project sheet lives on <body> (#bd1-sheet) and posts the same Google Form fields as before (buildForm). */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function app() { return window.comp || null; }
  function data() { var a = app(); return (a && a.state && a.state.data) || null; }
  var FOC = null;
  function focusOf(src) {
    if (!FOC) { FOC = {}; try { var x = new XMLHttpRequest(); x.open('GET', 'focus.json', false); x.send(); if (x.status === 200) FOC = JSON.parse(x.responseText) || {}; } catch (e) {} }
    var f = FOC[src]; return f ? f[0] + '% ' + f[1] + '%' : '50% 50%';
  }
  function yr(d) { return +((d.buildCopy || {}).year) || 2027; }
  function fill(s, d) { var y = yr(d); return String(s || '').replace(/\{year\}/g, y).replace(/\{year2\}/g, y + 1); }

  /* ---------- the builds: every build with a downstream home and a photo of that build ---------- */
  function builds(d, P) {
    var skip = new RegExp(P.went.skip, 'i'), out = [];
    Object.keys(d.hoods || {}).forEach(function (k) {
      var h = d.hoods[k]; if (!h || h.k === 'camp') return;
      var nx = String(h.nx || '').trim();
      if (!skip.test(nx)) {
        var im = (h.g && h.g[0] && h.g[0].i) || h.i; /* the curated gallery's first shot: the structure, not the crowd */
        if (im) out.push({ kind: 'hood', y: '2026', h: k, nm: h.n, now: nx, im: im });
      }
      (h.pb || []).forEach(function (b) {
        var pt = String(b.pt || '').trim(); if (skip.test(pt)) return;
        var ph = (h.hr || []).filter(function (r) { return r.y === b.y && /pk-pb-/.test(r.i); })[0];
        if (ph) out.push({ kind: 'hood', y: b.y, h: k, nm: h.n, now: pt, im: ph.i });
      });
    });
    (d.privateBuilds || []).forEach(function (p) { if (p.i && p.nx) out.push({ kind: 'priv', y: String(p.y), nm: String(p.n).replace(/\s*\(.*\)$/, ''), now: p.nx, im: p.i, story: p.story || 0 }); });
    return out;
  }
  function firms(d) {
    var seen = {}, L = [];
    Object.keys(d.hoods || {}).forEach(function (k) { (d.hoods[k].crl || []).forEach(function (c) {
      if (!/^(Design|Architecture|Design team)$/i.test(c[0]) || !/Architect/i.test(c[1]) || /University|School/i.test(c[1])) return;
      var n = c[1].replace(/\s*&\s*Interiors$/, '').replace(/\s+Architecture$/, '').trim(); if (!seen[n]) { seen[n] = 1; L.push(n); } }); });
    L = L.slice(0, 4); if (L.length < 2) return L.join('');
    return L.slice(0, -1).join(', ') + ' and ' + L[L.length - 1];
  }

  var V = { kind: 'hood', y: '' };
  function page(d) {
    var P = d.buildPage, C = d.buildCopy || {}, all = builds(d, P);
    var years = []; all.forEach(function (b) { if (b.kind === V.kind && years.indexOf(b.y) < 0) years.push(b.y); }); years.sort().reverse();
    if (years.indexOf(V.y) < 0) V.y = years[0] || '';
    var row = all.filter(function (b) { return b.kind === V.kind && b.y === V.y; });
    var H = P.hero, W = P.went, G = P.get, U = P.who, Q = P.due;
    var chips = W.chips.filter(function (c) { return all.some(function (b) { return b.kind === c[0]; }); }).map(function (c) {
      return '<button type="button" class="bd-chip" aria-pressed="' + (V.kind === c[0]) + '" data-bd-kind="' + c[0] + '">' + esc(c[1]) + '</button>'; }).join('');
    var ysel = years.length > 1 ? '<label class="bd-ysel"><span class="bd-sr">Year</span><select data-bd-year>' + years.map(function (y) { return '<option' + (y === V.y ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></label>' : '';
    var cards = row.map(function (b) {
      var go = b.kind === 'hood' ? 'hood:' + b.h + ':' + b.y : b.story ? 'story:' + b.story : '';
      var tag = go ? 'button type="button" data-bd-go="' + esc(go) + '"' : 'div';
      return '<li class="bd-card"><' + tag + ' class="bd-cin' + (go ? ' bd-link' : '') + '"><span class="bd-cim"><img src="' + esc(b.im) + '" alt="" loading="lazy" decoding="async" style="object-position:' + focusOf(b.im) + '"></span>' +
        '<span class="bd-ctx"><span class="bd-ck">' + esc(b.y + ' · ' + b.nm) + '</span><span class="bd-cnow">' + esc(W.now) + '</span><span class="bd-cto">' + esc(b.now) + '</span></span></' + tag.split(' ')[0] + '></li>'; }).join('');
    var fs = firms(d);
    return '<section class="bd-hero"><img class="bd-him" src="' + esc(H.im) + '" alt="" style="object-position:' + focusOf(H.im) + '"><div class="bd-hsh" aria-hidden="true"></div>' +
      '<button type="button" class="bd-tour" data-bd-tour="1" aria-label="' + esc(H.tour) + '"><span aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4 L20 12 L7 20 Z"/></svg></span>' + esc(H.tour) + '</button>' +
      '<div class="bd-hin"><p class="bd-k bd-hk">' + esc(C.eye || '') + '</p><h1 class="pl-d bd-h1">' + esc(H.t) + '</h1><p class="bd-hx">' + esc(H.x) + '</p>' +
      '<div class="bd-hb"><button type="button" class="pk-cta pri bd-cta" data-bd-start="1">' + esc(H.cta) + '</button></div></div></section>' +
      '<section class="bd-sec bd-went" id="bd-went"><div class="bd-in"><div class="bd-wh"><div><p class="bd-k">' + esc(W.k) + '</p><h2 class="pl-d bd-h2">' + esc(W.t) + '</h2></div>' +
      '<div class="bd-arr"><button type="button" class="bd-ib" data-bd-arr="-1" aria-label="Previous builds">‹</button><button type="button" class="bd-ib" data-bd-arr="1" aria-label="Next builds">›</button></div></div>' +
      '<div class="bd-chips">' + chips + ysel + '</div></div>' +
      '<ul class="bd-row" data-bd-row="1">' + cards + '</ul></section>' +
      '<section class="bd-sec"><div class="bd-in bd-two"><div class="bd-get"><p class="bd-k">' + esc(G.k) + '</p><h2 class="pl-d bd-h2">' + esc(G.t) + '</h2><ol class="bd-gl">' +
      G.items.map(function (g, i) { var x = g[1].replace('{firms}', fs); if (!fs) x = x.replace(/^Firms like\s+design it/, 'Leading firms design it'); return '<li><span class="bd-gn" aria-hidden="true">' + (i + 1) + '</span><span><strong>' + esc(g[0]) + '</strong>' + esc(x) + '</span></li>'; }).join('') + '</ol></div>' +
      '<div class="bd-who"><p class="bd-k">' + esc(U.k) + '</p><h2 class="pl-d bd-h2">' + esc(U.t) + '</h2><ul class="bd-wl">' +
      U.items.map(function (w) { return '<li><strong>' + esc(w[0]) + '</strong><span>' + esc(w[1]) + '</span></li>'; }).join('') + '</ul></div></div></section>' +
      '<section class="bd-sec bd-last"><div class="bd-in"><div class="bd-due"><h2 class="pl-d bd-h2">' + esc(fill(Q.t, d)) + '</h2><p class="bd-dx">' + esc(C.note || '') + '</p>' +
      '<button type="button" class="pk-cta pri bd-cta" data-bd-start="1">' + esc(Q.cta) + '</button>' +
      '<p class="bd-dl"><button type="button" class="bd-gl-link" data-bd-go="page:' + esc(Q.page) + '">' + esc(Q.link) + ' →</button></p></div></div></section>';
  }

  var root = null, lastKey = '';
  function sync() {
    var el = document.getElementById('bd1'); if (!el) { root = null; return; }
    var d = data(); if (!d || !d.buildPage) return;
    var k = V.kind + '|' + V.y;
    if (el !== root || !el.firstChild || k !== lastKey) {
      root = el; lastKey = k; el.innerHTML = page(d);
      [].forEach.call(el.querySelectorAll('.pl-d'), function (e) { e.classList.add('pkp-head'); });
      arrows();
    }
  }
  function arrows() {
    if (!root) return; var r = root.querySelector('[data-bd-row]'); if (!r) return;
    var a = root.querySelectorAll('[data-bd-arr]'), over = r.scrollWidth > r.clientWidth + 4;
    if (a[0]) a[0].disabled = !over || r.scrollLeft < 4; if (a[1]) a[1].disabled = !over || r.scrollLeft > r.scrollWidth - r.clientWidth - 4;
    root.querySelector('.bd-arr').style.visibility = over ? '' : 'hidden';
  }
  document.addEventListener('scroll', function (e) { if (root && e.target && e.target.hasAttribute && e.target.hasAttribute('data-bd-row')) arrows(); }, true);
  window.addEventListener('resize', function () { arrows(); });

  function go(to) {
    var a = app(); if (!a) return; var p = to.split(':');
    if (p[0] === 'hood') { a.go('hood', p[2] && p[2] !== '2026' ? { h: p[1], y: p[2] } : { h: p[1] }); return; }
    if (p[0] === 'story') { a.go('story', { s: +p[1] }); return; }
    if (p[0] === 'page') { a.go('page', { p: p[1] }); return; }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    var s = t.closest('#bd1-sheet'); if (s) { sheetClick(e, t); return; }
    if (!root || !root.contains(t)) return;
    var b;
    if ((b = t.closest('[data-bd-start]'))) { e.preventDefault(); open(); return; }
    if ((b = t.closest('[data-bd-tour]'))) { e.preventDefault(); var A = app(); if (A && A.ssOpen) A.ssOpen('builds'); return; }
    if ((b = t.closest('[data-bd-kind]'))) { V.kind = b.getAttribute('data-bd-kind'); V.y = ''; sync(); return; }
    if ((b = t.closest('[data-bd-arr]'))) { var r = root.querySelector('[data-bd-row]'), c = r && r.querySelector('.bd-card'); if (r && c) r.scrollBy({ left: (+b.getAttribute('data-bd-arr')) * (c.offsetWidth + 16) * (window.innerWidth >= 1200 ? 2 : 1), behavior: 'smooth' }); return; }
    if ((b = t.closest('[data-bd-go]'))) { e.preventDefault(); go(b.getAttribute('data-bd-go')); }
  });
  document.addEventListener('change', function (e) { var t = e.target; if (root && t && t.hasAttribute && t.hasAttribute('data-bd-year') && root.contains(t)) { V.y = t.value; sync(); } });

  /* ---------- Start a project: one question per screen ---------- */
  var S = { step: 0, a: {}, sent: false, err: '', last: null };
  function sheetEl() { var s = document.getElementById('bd1-sheet'); if (!s) { s = document.createElement('div'); s.id = 'bd1-sheet'; s.className = 'bd1s'; s.hidden = true; document.body.appendChild(s); } return s; }
  function open(kind) {
    var d = data(); if (!d) return; S.last = document.activeElement; S.err = '';
    if (S.sent) { S.sent = false; S.step = 0; S.a = {}; }
    if (kind) { S.a.kind = kind; if (!S.step) S.step = 1; }
    var s = sheetEl(); s.hidden = false; document.documentElement.classList.add('bd1-lock'); draw(true);
  }
  window.pkBuildStart = open;
  function close() { var s = sheetEl(); s.hidden = true; document.documentElement.classList.remove('bd1-lock'); try { if (S.last && S.last.focus) S.last.focus(); } catch (e) {} }
  function draw(focusHead) {
    var d = data(), F = d.buildPage.form, s = sheetEl(), N = F.steps.length, st = F.steps[S.step], h = '';
    var top = '<div class="bds-top">' + (S.step > 0 && !S.sent ? '<button type="button" class="bds-ib" data-bds="back" aria-label="Back">←</button>' : '<span class="bds-sp"></span>') +
      (S.sent ? '<span></span>' : '<span class="bds-ct">' + (S.step + 1) + ' ' + esc(F.of) + ' ' + N + '</span>') + '<button type="button" class="bds-ib" data-bds="close" aria-label="Close">✕</button></div>' +
      (S.sent ? '' : '<div class="bds-bar" aria-hidden="true"><span style="width:' + Math.round((S.step + 1) / N * 100) + '%"></span></div>');
    if (S.sent) {
      h = '<h2 class="bds-q" tabindex="-1">' + esc(F.done) + '</h2><p class="bds-h">' + esc(F.doneX.replace('{email}', S.a.email || '')) + '</p>' +
        (((d.buildForm || {}).live) ? '' : '<p class="bds-test">' + esc(F.test) + '</p>') + '<button type="button" class="bds-btn sec" data-bds="builds">' + esc(F.doneB) + '</button>';
    } else if (st.o) {
      h = '<h2 class="bds-q" tabindex="-1" id="bds-q">' + esc(st.q) + '</h2>' + (st.h ? '<p class="bds-h">' + esc(st.h) + '</p>' : '') +
        '<div class="bds-opts" role="group" aria-labelledby="bds-q">' + st.o.map(function (o) { var v = fill(o[0], d); return '<button type="button" class="bds-opt" aria-pressed="' + (S.a[st.id] === v) + '" data-bds-pick="' + esc(v) + '">' + esc(fill(o[1], d)) + '</button>'; }).join('') + '</div>';
    } else {
      var sum = F.steps.filter(function (q) { return q.o; }).map(function (q) { var o = q.o.filter(function (x) { return fill(x[0], d) === S.a[q.id]; })[0]; return o ? fill(o[1], d) : ''; }).filter(Boolean).join(' · ');
      var L = F.f, fld = function (k, type, ac, req) { return '<label class="bds-l">' + esc(L[k]) + '<input type="' + type + '" autocomplete="' + ac + '" data-bds-f="' + k + '" value="' + esc(S.a[k] || '') + '"' + (req ? ' required' : '') + '></label>'; };
      h = '<h2 class="bds-q" tabindex="-1">' + esc(st.q) + '</h2><p class="bds-sum">' + esc(sum) + '</p>' +
        '<div class="bds-fs">' + fld('name', 'text', 'name', 1) + fld('org', 'text', 'organization', 1) + fld('email', 'email', 'email', 1) +
        '<label class="bds-l bds-wide">' + esc(L.what) + '<span class="bds-lh">' + esc(L.whatH) + '</span><textarea rows="4" data-bds-f="what" required>' + esc(S.a.what || '') + '</textarea></label>' +
        fld('phone', 'tel', 'tel', 0) + '<label class="bds-l">' + esc(L.heard) + '<select data-bds-f="heard"><option value=""></option>' + F.heard.map(function (o) { return '<option value="' + o[0] + '"' + (S.a.heard === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label></div>' +
        (S.err ? '<p class="bds-err" role="alert">' + esc(S.err) + '</p>' : '') + '<button type="button" class="bds-btn pri" data-bds="send">' + esc(F.send) + '</button>' +
        (((d.buildForm || {}).live) ? '' : '<p class="bds-test">' + esc(F.test) + '</p>');
    }
    s.innerHTML = '<div class="bds-back" data-bds="close"></div><div class="bds-panel" role="dialog" aria-modal="true" aria-label="Start a project">' + top + '<div class="bds-body">' + h + '</div></div>';
    if (focusHead) { var q = s.querySelector('.bds-q'); if (q) try { q.focus({ preventScroll: true }); } catch (e) {} }
  }
  function send() {
    var d = data(), F = d.buildPage.form, b = S.a, G = d.buildForm || {}, miss = [];
    ['name', 'org', 'email', 'what'].forEach(function (k) { if (!String(b[k] || '').trim()) miss.push(F.f[k].toLowerCase()); });
    if (miss.length) { S.err = F.need + miss.join(', ') + '.'; draw(); return; }
    b.email = String(b.email).trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) { S.err = F.badEmail; draw(); return; }
    var lab = function (id) { var q = F.steps.filter(function (x) { return x.id === id; })[0], o = q && q.o.filter(function (x) { return fill(x[0], d) === b[id]; })[0]; return o ? fill(o[1], d) : 'not answered'; };
    var heard = (F.heard.filter(function (o) { return o[0] === b.heard; })[0] || [0, 'not answered'])[1];
    var extra = ['Door: Wants something built', 'Who: ' + lab('kind'), 'Wants built: ' + lab('builds'), 'When: ' + lab('when'), 'Budget: ' + lab('cost'), 'Money ready: ' + lab('fund'), 'Heard via: ' + heard, 'Source: pickathon.com Build page'].join('\n');
    var E = G.entries || {}, fd = new URLSearchParams();
    fd.append(E.name, b.name); fd.append(E.org, b.org); fd.append(E.web, ''); fd.append(E.email, b.email); fd.append(E.phone, b.phone || ''); fd.append(E.vision, b.what); fd.append(E.extra, extra);
    if (G.live && G.action) { try { fetch(G.action, { method: 'POST', mode: 'no-cors', body: fd }).catch(function () {}); } catch (e) {} }
    window.__pkBuildLast = extra; S.sent = true; S.err = ''; draw(true);
  }
  function sheetClick(e, t) {
    var b;
    if ((b = t.closest('[data-bds-pick]'))) { var d = data(), st = d.buildPage.form.steps[S.step]; S.a[st.id] = b.getAttribute('data-bds-pick'); S.step = Math.min(S.step + 1, d.buildPage.form.steps.length - 1); draw(true); return; }
    if (!(b = t.closest('[data-bds]'))) return; var k = b.getAttribute('data-bds');
    if (k === 'close') close();
    else if (k === 'back') { S.step = Math.max(0, S.step - 1); S.err = ''; draw(true); }
    else if (k === 'send') send();
    else if (k === 'builds') { close(); var w = document.getElementById('bd-went'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  document.addEventListener('input', function (e) { var t = e.target; if (t && t.getAttribute && t.getAttribute('data-bds-f')) S.a[t.getAttribute('data-bds-f')] = t.value; });
  document.addEventListener('change', function (e) { var t = e.target; if (t && t.getAttribute && t.getAttribute('data-bds-f')) S.a[t.getAttribute('data-bds-f')] = t.value; });
  document.addEventListener('keydown', function (e) {
    var s = document.getElementById('bd1-sheet'); if (!s || s.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { var f = [].filter.call(s.querySelectorAll('button,input,select,textarea'), function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
  });
  /* leaving the Build page closes the sheet */
  var render0 = window.__render;
  if (typeof render0 === 'function') window.__render = function () { var r = render0.apply(this, arguments); try { sync(); var s = document.getElementById('bd1-sheet'); if (s && !s.hidden && !document.getElementById('bd1')) close(); } catch (e) { if (window.console) console.error('pk-build1', e); } return r; };
  function boot(n) { var a = app(); if (!a || !a.state || !a.state.data) { if (n < 200) setTimeout(function () { boot(n + 1); }, 50); return; } try { sync(); } catch (e) {} }
  boot(0);
})();
