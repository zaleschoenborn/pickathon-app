# ONE command to bring every master-derived table in data.json in line with the master class table (Zale, Nov 16: "just use the master").
# Usage: python3 tools/sync_from_master.py <class_table_*.csv> [--check]
#   rebuilds climbSrc (poster) and billTN (year-page bill: at-festival size/class, today's peak, today's class) from the master,
#   drops the retired top10Final copy, and verifies yearRatings' last window equals the master peak. --check changes nothing and exits 1 on drift.
import json, csv, sys, re, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, '..'); P = os.path.join(SITE, 'data.json')
csvp = sys.argv[1]; check = '--check' in sys.argv
fold = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
K = {'Discovery': 'disc', 'Legend': 'leg', 'Deep cut': 'deep'}
M = {}
for x in csv.DictReader(open(csvp, encoding='utf-8-sig')):
    if x['lineup'] == 'Music' and not (x.get('merged_into') or '').strip() and not (x.get('duplicate_of') or '').strip(): M[(x['year'], fold(x['act']))] = x
f = lambda v: float(v) if (v or '').strip() else None
d = json.load(open(P)); drift = []
want = {}
for (y, k), x in M.items():
    want.setdefault(y, {})[k] = [f(x['at_festival_magnitude_dec']), K.get(x['at_festival_class'], 'none'), f(x['magnitude_dec']), K.get(x['today_class']) or '', 'p' if f(x['magnitude_dec']) is not None else '']
for y, T in d.get('billTN', {}).items():
    for k, v in T.items():
        w = want.get(y, {}).get(k)
        nv = [v[0], v[1] or 'none', v[2], v[3] or '', v[4] or '']
        if w and w != nv: drift.append((y, k, v, w))
        if w and not check: T[k] = w
for y, Y in d.get('yearRatings', {}).items():
    for a in Y['acts']:
        x = M.get((y, fold(a['n']))); last = [v for v in a['m'] if v is not None]
        if x and f(x['magnitude_dec']) is not None and last and abs(last[-1] - f(x['magnitude_dec'])) > .05: drift.append((y, a['n'], 'yearRatings last window', last[-1], f(x['magnitude_dec'])))
if 'top10Final' in d: drift.append(('top10Final present (retired)',))
print('drift:', len(drift)); [print(' ', r) for r in drift[:15]]
if check: sys.exit(1 if drift else 0)
d.pop('top10Final', None)
json.dump(d, open(P, 'w'), ensure_ascii=False, separators=(',', ':'))
subprocess.check_call([sys.executable, os.path.join(HERE, 'climb_ladder', 'build_src.py'), csvp])
