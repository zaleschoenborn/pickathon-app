#!/usr/bin/env python3
"""One command for a new class table export (Artist Classification). Nov 11 2026.
   Usage: python3 tools/class_import/run.py <class_table.csv>
   Order matters: the class builds first, then the printed poster order on top (build_src resets the festival ranks
   from the classes, so the poster order must be applied after it), then the class sync, then the labels and tags
   that copy the class into the year tours and cards. Prints a short report; writes nothing outside data.json."""
import json, csv, os, re, sys, subprocess, unicodedata, collections
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.abspath(os.path.join(HERE, '..', '..')); DJ = os.path.join(SITE, 'data.json')
CSV = os.path.abspath(sys.argv[1])
HOLD_STILL = {'2006'}   # Zale to rule (Nov 11): under class-first ranking the 2006 climber is Danny Barnes, not the Avett Brothers
key = lambda s: re.sub(r'^the', '', re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower().replace('&', 'and')))
before = json.load(open(DJ))

def run(*a):
    p = subprocess.run([sys.executable] + list(a), cwd=SITE, capture_output=True, text=True)
    out = (p.stdout + p.stderr).strip().splitlines()
    print('--', os.path.relpath(a[0], SITE), 'ok' if p.returncode == 0 else 'FAILED', '|', ' / '.join(out[-2:])[:300])
    if p.returncode: sys.exit(1)
run('tools/year_pages/build_years.py', CSV)
run('tools/year_pages/build_ratings.py', CSV)
run('tools/climb_ladder/build_src.py', CSV)
run('tools/climb_ladder/apply_poster_order.py')
run('tools/year_pages/sync_class.py', CSV)

d = json.load(open(DJ)); rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig')))
for y in HOLD_STILL:
    if y in d.get('climb', {}): d['climb'][y]['src'] = 'from the classes'

# "now a Legend" (guide, Nov 11): a yes on the act's first-year row puts lgNow on any card that isn't already a Legend
LN = {(r['year'], key(r['act'])) for r in rows if r.get('legend_now') == 'yes' and r.get('class') != 'Legend' and r.get('year') == r.get('first_pickathon')}
def first(y): return y[0] if isinstance(y, list) and y else y
n_ln = 0
for store in (d.get('past', {}).get('deep', []), d.get('archCT', []), d.get('deepcuts', [])):
    for c in store:
        on = (str(c.get('pyr') or first(c.get('y'))), key(c.get('n'))) in LN and c.get('k') != 'leg' and not c.get('lg')
        if on: c['lgNow'] = 1; n_ln += 1
        else: c.pop('lgNow', None)

# Year tours, reels and stories copy the class from that year's bill, and the counts line is recomputed (music acts only)
K = {'disc': 'Discovery', 'leg': 'Legend', 'deep': 'Deep cut'}
CLS = ('Discovery', 'Legend', 'Deep cut', 'Neither')
relabel = []
pl = lambda n, a, b: '%d %s' % (n, a if n == 1 else b)
for y, bill in d.get('yearBill', {}).items():
    bk = {key(a['n']): a.get('k') for a in bill}
    c = collections.Counter(a.get('k') for a in bill if 'l' not in a)   # entries with a blurb (l) are the non-music lineups
    cnt = '%s · %s · %s' % (pl(c['disc'], 'Discovery', 'Discoveries'), pl(c['leg'], 'Legend', 'Legends'), pl(c['deep'], 'Deep cut', 'Deep cuts'))
    def fix(o):
        if isinstance(o, dict):
            k0 = o.get('k')
            if 'n' in o and isinstance(k0, str) and ' · ' in k0 and k0.split(' · ')[0] in CLS:
                want = K.get(bk.get(key(o['n'])))
                if want and k0.split(' · ')[0] != want: relabel.append((y, o['n'], k0.split(' · ')[0], want)); o['k'] = want + ' · ' + k0.split(' · ', 1)[1]
            return {k: fix(v) for k, v in o.items()}
        if isinstance(o, list): return [fix(v) for v in o]
        if isinstance(o, str): return re.sub(r'\d+ Discover(?:y|ies) · \d+ Legends? · \d+ Deep cuts?', cnt, o)
        return o
    for st in ('yearTour', 'yearReel', 'yearStory'):
        if y in d.get(st, {}): d[st][y] = fix(d[st][y])
json.dump(d, open(DJ, 'w'), ensure_ascii=False, separators=(',', ':'))

# Report
kc = lambda B: {(y, key(a['n'])): a.get('k') for y, L in B.get('yearBill', {}).items() for a in L if 'l' not in a}
b0, b1 = kc(before), kc(d)
ch = collections.Counter((k[0], b0[k], b1[k]) for k in b1 if k in b0 and b0[k] != b1[k])
print('class changes on year bills (music):', sum(ch.values()))
for (y, a, b), n in sorted(ch.items()): print('  %s %s -> %s x%d' % (y, a, b, n))
print('tour/reel/story labels changed:', len(relabel), relabel[:12])
print('lgNow cards:', n_ln)
names = collections.defaultdict(set)
for r in rows:
    if r.get('lineup') == 'Music' and r.get('class') not in ('', 'not an act'): names[r['year']].add(key(r['act']))
miss = [(y, a['n']) for y, L in d.get('yearBill', {}).items() for a in L if 'l' not in a and key(a['n']) not in names.get(y, set())]
print('site music acts with no class row:', len(miss))
