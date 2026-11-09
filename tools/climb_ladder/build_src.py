# The climb poster ranks TODAY at page load from the class data in data.json (Zale, Nov 9: "pulling live data for the posters,
# not when we build it"). This writes climbSrc[year] = {l0: festival label, r: [[NAME, class, magnitude, confidence, festival rank, new]]}.
# The festival order (real billing, or the classes as they stood then) is history and stays fixed; TODAY is computed in the page
# by pkClimbLive (pk-climb.js), so a class change reaches the poster with the next data.json, with no poster rebuild.
# Usage: python3 build_src.py <class_table.csv>
import json, csv, sys, re, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
d = json.load(open(os.path.join(SITE, 'data.json')))
norm = lambda s: ' '.join(re.sub(r'[^a-z0-9 ]', '', str(s).lower().replace('&', ' and ').replace('“', '').replace('”', '').replace('"', '')).split())
CF = {'h': 'high', 'm': 'medium', 'l': 'low'}
# ONE source: the class table (Zale, Nov 9: builds come from master data, no side files, no hand placement).
# Usage: python3 build_src.py <class_table.csv>   (the newest class_table_*.csv from Artist Classification)
rows = {}
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')):
    if r.get('lineup') != 'Music' or (r.get('merged_into') or '').strip(): continue
    c = r.get('class') or ''
    if c not in ('Legend', 'Discovery', 'Deep cut', 'Neither'): continue
    try: m = float(r.get('magnitude') or 0)
    except ValueError: m = 0.0
    rows.setdefault(r['year'], {})[norm(r['act'])] = [r['act'], c, m, r.get('confidence') or '']
PIN = {}   # no hand-pinned tops: the rank is magnitude, then confidence, then class, then name
seen_before = {}; SEEN_N = set()
out = {}
for y in sorted(d.get('climb') or {}):
    D = d['climb'][y]; two = len(D.get('labels') or []) > 1
    then = {norm(n): (rk[0] if two else rk[-1]) for n, rk in D['names']}
    disp = {norm(n): n for n, rk in D['names']}
    if y == '2011' and 'sunday valley' in disp: disp['sunday valley'] = 'STURGILL SIMPSON'   # he played 2011 as Sunday Valley (class table merged_into)
    R = rows.get(y, {})
    keys = list(disp)   # the poster's own list (co-billings already merged); the class rows only update class and magnitude
    nxt = len(then)
    rr = []
    for k in keys:
        a, c, m, f = R.get(k) or [disp.get(k, k), 'Neither', 0, '']
        if k not in then: then[k] = nxt; nxt += 1
        new = all(k not in seen_before.get(yy, set()) for yy in seen_before)
        rr.append([disp.get(k) or a.upper(), c, m, f, then[k], 1 if new and norm(disp.get(k) or a) not in SEEN_N else 0])
        SEEN_N.add(norm(disp.get(k) or a))
    seen_before[y] = set(keys)
    lab = (D.get('labels') or [y + ' FESTIVAL'])[0] if two else (y + ' FESTIVAL')
    out[y] = {'l0': lab, 'r': rr, 'pin': [norm(x) for x in PIN.get(y, [])]}
d['climbSrc'] = out
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print({y: len(v['r']) for y, v in out.items()})
