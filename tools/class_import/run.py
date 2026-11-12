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

# Site names the class table spells differently (Artist Classification's answers, aliases.csv). Only the class sync sees
# the extra alias rows, so a year bill entry spelled the site's way picks up its class without adding a second act anywhere else.
rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig')))
AL = list(csv.DictReader(open(os.path.join(HERE, 'aliases.csv'), encoding='utf-8-sig')))
idx = {(r['year'], key(r['act'])): r for r in rows}
extra = []
for a in AL:
    if a['action'] == 'alias' and (a['year'], key(a['act_in_class_table'])) in idx:
        r = dict(idx[(a['year'], key(a['act_in_class_table']))]); r['act'] = a['name_on_site']; extra.append(r)
SYNC = os.path.join(HERE, '_sync_with_aliases.csv')
with open(SYNC, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows + extra)
run('tools/year_pages/sync_class.py', SYNC); os.remove(SYNC)

d = json.load(open(DJ))
for y in HOLD_STILL:
    if y in d.get('climb', {}): d['climb'][y]['src'] = 'from the classes'

# Spelling fixes the class team found on the site (alias rows noted "site spelling is off"): the site takes the table's spelling
s = json.dumps(d, ensure_ascii=False)
for a in AL:
    if a['action'] == 'alias' and 'spelling is off' in (a.get('note') or ''): s = s.replace(a['name_on_site'], a['act_in_class_table'])
d = json.loads(s)
# Not lineup acts (square dance bands and callers) leave the year bills. Acts Zale ruled did not play (pickathon-lineup-by-year) leave too.
# Other lineup questions stay on the bill with no class until Lineup rules (k = '').
DNP = {(a['year'], key(a['name_on_site'])) for a in AL if a['action'] == 'did not play'}
drop = {(a['year'], key(a['name_on_site'])) for a in AL if a['action'] in ('not a lineup act', 'did not play', 'duplicate') or a['action'].startswith('moved to')}
# the posters drop them too, until the class table itself catches up
pdrop = {k for k in drop if k not in {(x['year'], key(x['name_on_site'])) for x in AL if x['action'] == 'duplicate'}}
for y, C in d.get('climb', {}).items():
    if isinstance(C.get('names'), list): C['names'] = [x for x in C['names'] if (y, key(x[0])) not in pdrop]
for y, C in d.get('climbSrc', {}).items():
    if isinstance(C.get('r'), list): C['r'] = [x for x in C['r'] if (y, key(x[0])) not in pdrop]
# the past-years name lists drop them too (not the schedule history, which Lineup owns)
for e in d.get('past', {}).get('years', []):
    for f in ('all', 'names'):
        if isinstance(e.get(f), list): e[f] = [x for x in e[f] if not (isinstance(x, str) and (str(e.get('y')), key(x)) in drop)]
openq = {(a['year'], key(a['name_on_site'])) for a in AL if a['action'] == 'lineup question'} - drop
for y, L in d.get('yearBill', {}).items():
    d['yearBill'][y] = [b for b in L if (y, key(b['n'])) not in drop]
    for b in d['yearBill'][y]:
        if (y, key(b['n'])) in openq: b['k'] = ''
    seen = set(); d['yearBill'][y] = [b for b in d['yearBill'][y] if not (key(b['n']) in seen or seen.add(key(b['n'])))]   # a spelling fix can leave two entries for one act

# "now a Legend" (guide, Nov 11): a yes on the act's first-year row puts lgNow on any card that isn't already a Legend
def yr(v):
    try: return str(int(float(v)))
    except (TypeError, ValueError): return str(v or '')
LN = {(r['year'], key(r['act'])) for r in rows if r.get('legend_now') == 'yes' and r.get('class') != 'Legend' and r.get('year') == yr(r.get('first_pickathon'))}   # first_pickathon arrives as '2017.0'

# The archive pool (archCT: Before they were big, Legends, Deep cuts) follows the table's first-year class (Nov 11 18:14 reload).
# Genre (g) and story hook (l) are kept from the existing cards: their source (lineup research) isn't in the class table.
# m is magnitude_dec, the site's one number.
G2 = {'Legend': 'leg', 'Discovery': 'disc', 'Deep cut': 'deep'}
old_ct = {key(c['n']): c for c in d.get('archCT', [])}
acts = {}
for r in rows:
    if r.get('lineup') != 'Music' or (r.get('merged_into') or '').strip() or r.get('class') not in G2: continue
    if (r['year'], key(r['act'])) in drop: continue
    k = key(r['act']); A = acts.setdefault(k, {'ys': set()}); A['ys'].add(int(r['year']))
    if 'y' not in A or int(r['year']) < A['y']:
        try: m = float(r.get('magnitude_dec') or r.get('magnitude') or 0)
        except ValueError: m = 0.0
        A.update({'n': r['act'], 'k': G2[r['class']], 'y': int(r['year']), 'm': m, 'c': (r.get('confidence') or '').strip().lower()})
ct = []
for k, A in acts.items():
    o0 = old_ct.get(k, {}); o = {'n': o0.get('n') or A['n'], 'k': A['k'], 'y': A['y'], 'ys': sorted(A['ys']), 'm': A['m'], 'g': o0.get('g', '')}
    if A.get('c'): o['c'] = A['c']   # confidence of the first-year call: the ranking's tie-break after magnitude_dec and class (Round 3 D2)
    if o0.get('l'): o['l'] = o0['l']
    ct.append(o)
ct.sort(key=lambda o: (o['y'], o['n'].lower()))
moved = sum(1 for o in ct if key(o['n']) in old_ct and (old_ct[key(o['n'])].get('k'), old_ct[key(o['n'])].get('y')) != (o['k'], o['y']))
d['archCT'] = ct
print('archive pool:', len(ct), collections.Counter(o['k'] for o in ct), 'first-year class or year changed:', moved, 'new:', sum(1 for o in ct if key(o['n']) not in old_ct))
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
known = {(a['year'], key(a['name_on_site'])) for a in AL}
miss = [(y, a['n']) for y, L in d.get('yearBill', {}).items() for a in L if 'l' not in a and key(a['n']) not in names.get(y, set()) and (y, key(a['n'])) not in known]
print('site music acts with no class row:', len(miss))
# Round 3 (A8): any copy the import brought back gets its current-room-size lines taken out again
import subprocess as _sp
_sp.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'strip_room_lines.py')], check=False)

# Founder rule (Nov 11): scores and show counts never come back through an import
import subprocess as _sp, sys as _sys, os as _os
_sp.run([_sys.executable, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'copy_rules', 'apply.py')], check=True)
