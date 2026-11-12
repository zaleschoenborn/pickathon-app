# Archive cards from the class table, on every build (Design Studio, Nov 9 2026; Zale: "update the 118").
# The archive ('Wait, they played here?': Before they were big, Legends, Deep cuts) follows the class table with the
# first-year rule: an act's archive class is its class at its first Pickathon (pickathon-archive-cards).
# Writes data.json archCT = [{n, k: disc|leg|deep, y: first year, ys: [years], m, g, l}] for every music act the table classes.
# The page (archAll) reclassifies existing hand-made cards to match and adds a card for any act that has none.
# Usage: python3 build_arch.py <class_rows.txt year|act|L/D/C|conf|mag> [<class_table.csv for extra years>] [<lineup_research.json>]
# Genre corrections where the research sheet disagrees with the act's own record (flagged to Research, Nov 9 2026)
GFIX = {'durandjones': 'soul'}
import json, sys, re, os, csv, unicodedata
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
def key(s):
    s = str(s or '').replace('\u00b3', '').replace(' ft Gordon Gano', '')  # Zale Nov 10: Giant\u00b3 Sand is the spelling; Lost Bayou Ramblers ft Gordon Gano is an alias of Lost Bayou Ramblers
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
rows = [l.rstrip('\n').split('|') for l in open(sys.argv[1], encoding='utf-8') if l.strip() and not l.startswith('#')]
have = {r[0] for r in rows}
if len(sys.argv) > 2 and sys.argv[2].endswith('.csv'):
    for r in csv.DictReader(open(sys.argv[2], encoding='utf-8-sig')):
        if r['year'] in have or r.get('lineup') != 'Music' or (r.get('merged_into') or '').strip(): continue
        c = {'Legend': 'L', 'Discovery': 'D', 'Deep cut': 'C'}.get(r.get('class') or '')
        if c: rows.append([r['year'], r['act'], c, (r.get('confidence') or '')[:1], r.get('magnitude') or '0'])
LBY = {}
if len(sys.argv) > 3:
    for r in json.load(open(sys.argv[3])):
        LBY[(r['Year'], key(r['Act']))] = r
G = {'L': 'leg', 'D': 'disc', 'C': 'deep'}
acts = {}
for y, a, c, cf, m in rows:
    k = key(a); A = acts.setdefault(k, {'ys': set()}); A['ys'].add(int(y))
    if 'y' not in A or int(y) < A['y']: A.update({'n': a, 'k': G[c], 'y': int(y), 'm': float(m or 0)})
out = []
for k, A in acts.items():
    R = LBY.get((str(A['y']), k)) or {}
    safe = (R.get('Safe to publish') or '').lower().startswith('yes')
    o = {'n': A['n'], 'k': A['k'], 'y': A['y'], 'ys': sorted(A['ys']), 'm': A['m'], 'g': GFIX.get(k) or (R.get('Genre') or '').strip().lower()}
    if safe and R.get('Story hook'): o['l'] = R['Story hook'].strip()
    out.append(o)
out.sort(key=lambda o: (o['y'], o['n'].lower()))
d = json.load(open(os.path.join(SITE, 'data.json'))); d['archCT'] = out
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(out), Counter(o['k'] for o in out), 'with line', sum(1 for o in out if o.get('l')))

# Founder rule (Nov 11): scores and show counts never come back through an import
import subprocess as _sp, sys as _sys, os as _os
_sp.run([_sys.executable, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'copy_rules', 'apply.py')], check=True)
