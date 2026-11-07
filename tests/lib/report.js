// Turns raw results into a short, plain-language list: one line per distinct problem.
const fs = require('fs'), path = require('path');
const ORDER = ['script', 'hscroll', 'wide', 'broken-file', 'broken-img', 'broken-video', 'zoom', 'clip', 'overlap', 'btn-out', 'field-font', 'shift', 'flicker', 'listen-covers', 'bar-covers', 'popup-close', 'rotate', 'scrollbar', 'lowres', 'tap', 'btn-style'];
const NAMES = { script: 'Script error', hscroll: 'Sideways scroll', wide: 'Wider than screen', 'broken-file': 'Missing file', 'broken-img': 'Broken image', 'broken-video': 'Broken video', zoom: 'Zoom', clip: 'Clipped text', overlap: 'Overlapping text', 'btn-out': 'Button outside card', 'field-font': 'Form field <16px', shift: 'Layout shift', flicker: 'Flicker', scrollbar: 'Visible scroll bar', lowres: 'Low-res image', tap: 'Tap target <44px', 'btn-style': 'Button style', 'listen-covers': 'Listen dock covers button', 'popup-close': 'Popup without X', rotate: 'Rotation', 'bar-covers': 'Button under tab bar' };
const ALL = ['360x800', '390x844', '800x360', '844x390', '820x1180', '1180x820', '1024x768', '1440x900'];
const norm = (s) => String(s || '').replace(/\d+(\.\d+)?/g, '#').replace(/"[^"]{20,}"/g, '"…"');
const kindName = { artist: 'current-lineup artist pages', story: 'news stories', page: 'info pages', act: 'past artist pages', 'act-plain': 'plain past artist pages', hood: 'neighborhood pages', past: 'year pages', tickets: 'Tickets states', panel: 'panels', view: 'main pages', zoom: 'whole site' };

function sizesTxt(set) { const s = ALL.filter((x) => set.has(x)), other = [...set].filter((x) => !ALL.includes(x)); if (s.length === ALL.length && !other.length) return 'all sizes'; let t = s.join() === '360x800,390x844' ? 'phones' : s.join() === '800x360,844x390' ? 'sideways phones' : s.map((x) => { const [w, h] = x.split('x'); return +w > +h && +h < 600 ? w + 'x' + h : w + (x === '1180x820' ? 'L' : ''); }).join(','); return [t].concat(other).filter(Boolean).join(','); }

exports.write = (OUT, o) => {
  const { sink, targets } = o; const total = targets.reduce((a, t) => ((a[t.kind] = (a[t.kind] || 0) + 1), a), {});
  const G = new Map();
  sink.issues = sink.issues.filter((i) => !/^file missing: failed |could not open page: no-app/.test(i.m)); // kit artifacts from runs before Nov 7 13:30 (canceled requests, lost app handle)
  for (const i0 of sink.issues) {
    const i = Object.assign({}, i0); const ext = String(i.m).match(/^file missing: (\d+) https?:\/\/([^/]+)\/.*?([^/]+)$/); if (ext) i.m = 'outside file missing: ' + ext[1] + ' from ' + ext[2] + ' (…/' + ext[3] + ')';
    const key = i.c + '|' + norm(i.m) + '|' + norm(i.s).replace(/ ".*/, '');
    if (!G.has(key)) G.set(key, { key, c: i.c, m: i.m, s: i.s, sizes: new Set(), modes: new Set(), ids: new Map(), shot: '' });
    const g = G.get(key); g.sizes.add(i.size); g.modes.add(i.mode); if (!g.ids.has(i.kind)) g.ids.set(i.kind, new Set()); g.ids.get(i.kind).add(i.id); if (!g.shot && i.shot) g.shot = i.shot;
  }
  const groups = [...G.values()].sort((a, b) => (ORDER.indexOf(a.c) + 1 || 99) - (ORDER.indexOf(b.c) + 1 || 99) || [...b.ids.values()].reduce((s, x) => s + x.size, 0) - [...a.ids.values()].reduce((s, x) => s + x.size, 0));
  const prevKeys = o.prev ? new Set(o.prev.keys || o.prev) : null; let newCount = 0;
  const lines = groups.map((g) => {
    const pages = [...g.ids.entries()].map(([k, s]) => { const ids = [...s]; return ids.length > 3 ? ids.length + (total[k] ? ' of ' + total[k] : '') + ' ' + (kindName[k] || k) + ' (e.g. ' + ids[0] + ')' : ids.join(', '); }).join('; ');
    const modes = g.modes.size === 2 ? '' : g.modes.has('app') ? ' · app only' : ' · tab only';
    const isNew = prevKeys && !prevKeys.has(g.key); if (isNew) newCount++;
    return '- ' + (isNew ? '**NEW** ' : '') + (NAMES[g.c] || g.c) + ' · ' + pages + ' · ' + sizesTxt(g.sizes) + modes + ' · ' + g.m.replace(/\|/g, '/') + (g.s ? ' · ' + g.s.replace(/\|/g, '/').slice(0, 50) : '') + (g.shot ? ' · `' + g.shot + '`' : '');
  });
  const counts = {}; groups.forEach((g) => (counts[g.c] = (counts[g.c] || 0) + 1));
  // speed problems (from speed.js): own section, biggest win first, already sorted
  // merge the same page-level speed problem across devices and visits into one line, biggest win first
  const spAll = (o.speed && o.speed.problems) || [];
  const timedOut = [...new Set(spAll.filter((x) => /over 20\.0 s|after 20\.0 s/.test(x.m)).flatMap((x) => x.pages))];
  const sp0 = spAll.filter((x) => !(/over 20\.0 s|after 20\.0 s/.test(x.m))); const spG = new Map();
  for (const x of sp0) { const k = x.sub + '|' + x.pages.join(',') + '|' + (/content|usable|map|download|shift/.test(x.sub) ? '' : x.m.replace(/\d+(\.\d+)?/g, '#')); const g = spG.get(k); if (g) { g.where.push(x.prof + ' ' + x.mode + ' ' + (x.m.match(/[\d.]+ s|score [\d.]+|[\d,]+ KB/) || [''])[0]); g.win = Math.max(g.win, x.win || 0); g.keys.push(x.key); } else spG.set(k, Object.assign({}, x, { where: [x.prof + ' ' + x.mode + ' ' + (x.m.match(/[\d.]+ s|score [\d.]+|[\d,]+ KB/) || [''])[0]], keys: [x.key] })); }
  const sp = [...spG.values()].sort((a, b) => (b.win || 0) - (a.win || 0)).map((g) => g.where.length > 1 ? Object.assign(g, { prof: '', mode: g.where.map((w) => w.trim()).join('; '), m: g.m.replace(/ after (over )?[\d.]+ s/, '').replace(/downloads [\d,]+ KB/, 'downloads too much') }) : g);
  const spLines = [];
  for (const x of sp) { const isNew = prevKeys && !x.keys.some((k) => prevKeys.has(k)); if (isNew) newCount++; spLines.push({ key: x.key, line: '- ' + (isNew ? '**NEW** ' : '') + 'Speed · ' + x.pages.slice(0, 3).join(', ') + (x.pages.length > 3 ? ' +' + (x.pages.length - 3) + ' more' : '') + ' · ' + x.prof + ' ' + x.mode + ' · ' + x.sub + ' · ' + x.m }); }
  const keyLine = {}; groups.forEach((g, i) => (keyLine[g.key] = lines[i].replace('**NEW** ', ''))); spLines.forEach((l) => (keyLine[l.key] = l.line.replace('**NEW** ', '')));
  const spKeys = new Set(spLines.map((l) => l.key));
  const fixed = o.prev && o.prev.lines ? Object.keys(o.prev.lines).filter((k) => !G.has(k) && !spKeys.has(k) && (o.speed || !/^speed\|/.test(k))).map((k) => o.prev.lines[k].replace(/ · `[^`]*`$/, '')) : [];
  const head = '### QA run ' + o.run + (o.quick ? ' (quick)' : ' (full)') + ': ' + groups.length + ' open problems' + (prevKeys ? ', ' + newCount + ' new' : '') + '\n' +
    targets.length + ' pages/states x ' + o.sizes.length + ' sizes x ' + o.modes.join('+') + ' = ' + sink.checked + ' screens checked in ' + o.mins + ' min. ' +
    Object.entries(counts).map(([k, v]) => (NAMES[k] || k) + ' ' + v).join(', ') + '.\n';
  const fixedTxt = fixed.length ? '\n#### Fixed since the last run (' + fixed.length + ')\n' + fixed.slice(0, 15).map((l) => l.replace(/^- /, '- ~~') + '~~').join('\n') + (fixed.length > 15 ? '\n- …and ' + (fixed.length - 15) + ' more' : '') + '\n' : '';
  const speedTxt = o.speed ? '\n#### Speed (biggest win first; phone = mid-range phone on slow 4G)\n' + (spLines.map((l) => l.line).join('\n') || '- all pages within targets') + (timedOut.length ? '\n- (not measured: ' + timedOut.join(', ') + ' timed out in the test)' : '') + '\n' : '';
  fs.writeFileSync(path.join(OUT, 'issues.md'), head + (o.speed ? 'Speed: ' + spLines.length + ' problems.\n' : '') + '\n' + lines.join('\n') + '\n' + speedTxt + fixedTxt);
  // short version for photo-catalog/site_issues.md (Project space is tight): NEW lines always, then the top few per check, speed top 12
  const PER = 6, SPEEDN = 12, more = (n, what) => '- …and ' + n + ' more ' + what + ' (full list: qa-shots branch, tests/shots/latest/issues.md)';
  const byCheck = new Map(); lines.forEach((l, i) => { const c = groups[i].c; if (!byCheck.has(c)) byCheck.set(c, []); byCheck.get(c).push(l); });
  const tidy = (l) => { const f = l.split(' · '); if (f.length < 4) return l; if (f[1].length > 90) f[1] = f[1].slice(0, 88).replace(/[;,][^;,]*$/, '') + ' …'; const sz = f[2]; if (sz.split(',').length > 5) f[2] = (/1440|1024/.test(sz) ? 'nearly all sizes' : 'all touch sizes') + (/rotating/.test(sz) ? ' incl. after rotating' : ''); return f.join(' · '); };
  const short = []; for (const [c, ls0] of byCheck) { const ls = ls0.map(tidy); const keep = ls.filter((l, i) => i < PER || l.includes('**NEW**')); short.push(...keep); if (ls.length > keep.length) short.push(more(ls.length - keep.length, (NAMES[c] || c).toLowerCase() + ' problems')); }
  const spKeep = spLines.filter((l, i) => i < SPEEDN || l.line.includes('**NEW**')).map((l) => l.line.replace(/(Speed · [^·]{0,80})[^·]*·/, '$1 ·'));
  const toNote = timedOut.length ? '\n- (not measured: ' + timedOut.join(', ') + ' timed out in the test, a test problem being fixed, not a site one)' : '';
  const speedShort = o.speed ? '\n#### Speed (biggest win first; phone = mid-range phone on slow 4G)\n' + (spKeep.join('\n') || '- all pages within targets') + toNote + (spLines.length > spKeep.length ? '\n' + more(spLines.length - spKeep.length, 'speed problems') : '') + '\n' : '';
  fs.writeFileSync(path.join(OUT, 'issues_short.md'), head + (o.speed ? 'Speed: ' + spLines.length + ' problems.\n' : '') + '\n' + short.join('\n') + '\n' + speedShort + fixedTxt);
  fs.writeFileSync(path.join(OUT, 'keys.json'), JSON.stringify({ run: o.run, keys: groups.map((g) => g.key).concat(spLines.map((l) => l.key)), lines: keyLine }));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ run: o.run, base: o.base, quick: o.quick, sizes: o.sizes, modes: o.modes, targets: targets.map((t) => ({ id: t.id, kind: t.kind, r: t.r, p: t.p })), zoom: sink.zoom, skips: sink.skips, checked: sink.checked, mins: o.mins, issues: sink.issues }));
  fs.writeFileSync(path.join(OUT, 'new.md'), lines.concat(spLines.map((l) => l.line)).filter((l) => l.includes('**NEW**')).join('\n') + (newCount ? '\n' : ''));
  return { groups: groups.length, newCount };
};
