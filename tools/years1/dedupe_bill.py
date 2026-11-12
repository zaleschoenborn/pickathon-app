#!/usr/bin/env python3
"""Years package (Nov 12 2026, Gate 2 L1/L2): one tile per act on a year page. Lineup By Year is the source of truth.
   MERGE: a second listing that is a spelling variant of the same act (not carried separately by the lineup) folds into the
   lineup's master spelling. It leaves yearBill, yearRatings, yearStory acts/scenes and past.years names/all, and an actAlias
   keeps schedule rows under the old name linked.
   RESTORE: Tye North 2003 is his own act on the lineup (beside Danny Barnes & Tye North); the Nov 12 merge is undone.
   Variants the lineup list itself carries separately are left alone and printed for Zale (LEAVE).
   Safe to run again; prints every change. Usage: python3 tools/years1/dedupe_bill.py"""
import json, os, re, unicodedata
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
MERGE = [  # (year, drop, keep)
    ('2008', 'Bad Livers (reunion)', 'Bad Livers'),
    ('2011', 'Thao', 'Thao & The Get Down Stay Down'),
    ('2008', 'Wayne Hancock', 'Wayne "The Train" Hancock'),
    ('2013', 'Wayne Hancock', 'Wayne "The Train" Hancock'),
    ('2010', 'Blind Boy Paxton', 'Jerron "Blind Boy" Paxton'),
    ('2013', 'Brad Folk & The Bluegrass Playboys', 'Bradford Lee Folk & The Bluegrass Playboys'),
    ('2011', 'Sunday Valley (Sturgill Simpson)', 'Sunday Valley'),   # Sturgill's merge lives on his artist card
]
RESTORE = [('2003', 'Tye North', 'Danny Barnes & Tye North',
    {'n': 'Tye North', 'k': 'deep', 'g': '', 'm': 0, 't': 2},
    {'n': 'Tye North', 'kind': 'deep cut', 'proof': "Boulder bassist who had left Leftover Salmon about a year and a half before April 2002; led Theory of Everything and regularly played gigs with Danny Barnes.", 'source': 'https://jambands.com/features/2002/04/23/tye-north-espouses-a-theory-of-everything/', 'confidence': 'medium'})]
LEAVE = [('2004', ['Jo Miller & Her Burly Roughnecks', 'Jo Miller & The Burly Roughnecks', 'The Burly Roughnecks']),
         ('2014', ['Brown Sabbath', 'Brownout Presents Brown Sabbath', 'Brownout / Brown Sabbath']),
         ('2017', ['McTuff w/ Skerik', 'McTuff with Skerik']),
         ('2011', ['Corinne West & Kelly Joe Phelps', 'Corrinne West & Kelly Joe Phelps'])]
PICK_BY_LINEUP = [('2022', ['79rs Gang', '79ersgang'])]   # keep the spelling past.years[y].all carries; if neither or both, leave and report
def nk(s): s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower(); s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
d = json.load(open(D, encoding='utf-8')); report = []
def lineup(y): return next((Y.get('all') or [] for Y in (d.get('past') or {}).get('years') or [] if Y.get('y') == y), [])
STEP = os.environ.get('STEP', 'all')   # 'restore' runs only the Tye North restore (Gate 2 L1)
if STEP == 'restore': MERGE = []; PICK_BY_LINEUP = []
for y, names in PICK_BY_LINEUP:
    have = [n for n in names if n in lineup(y)]
    if len(have) == 1: MERGE.append((y, [n for n in names if n != have[0]][0], have[0]))
    else: LEAVE.append((y, names))
for y, dup, keep in MERGE:
    B = d.get('yearBill', {}).get(y, [])
    if not (any(b.get('n') == dup for b in B) and any(b.get('n') == keep for b in B)):
        if any(b.get('n') == keep for b in B) and not any(b.get('n') == dup for b in B): report.append('already one tile: %s %s' % (y, keep))
        else: report.append('SKIPPED (keep not on bill): %s %s -> %s' % (y, dup, keep))
        d.setdefault('actAlias', {})[nk(dup)] = nk(keep); continue
    d['yearBill'][y] = [b for b in B if b.get('n') != dup]
    R = d.get('yearRatings', {}).get(y) or {}
    if R.get('acts'): R['acts'] = [a for a in R['acts'] if a.get('n') != dup]
    S = d.get('yearStory', {}).get(y) or {}
    if S.get('acts'): S['acts'] = [a for a in S['acts'] if a.get('n') != dup]
    for sc in S.get('scenes') or []:
        if sc.get('acts'): sc['acts'] = [a if a != dup else keep for a in sc['acts']]
    for Y in (d.get('past') or {}).get('years') or []:
        if Y.get('y') == y:
            for f in ('names', 'all'):
                if Y.get(f): Y[f] = list(dict.fromkeys([keep if a == dup else a for a in Y[f]]))
    d.setdefault('actAlias', {})[nk(dup)] = nk(keep)
    report.append('merged %s: "%s" -> "%s"' % (y, dup, keep))
for y, n, beside, bill, story in RESTORE:
    B = d['yearBill'][y]
    if not any(b.get('n') == n for b in B):
        i = next((k for k, b in enumerate(B) if b.get('n') == beside), len(B) - 1) + 1
        B.insert(i, bill); report.append('restored %s: "%s" (own tile)' % (y, n))
    R = d['yearRatings'].get(y) or {}
    if R.get('acts') is not None and not any(a.get('n') == n for a in R['acts']):
        L = len((R['acts'][0] if R['acts'] else {'c': []})['c']) or len(R.get('dates') or [])
        R['acts'].append({'n': n, 'c': [bill['k']] * L, 'm': [bill['m']] * L})
    S = d['yearStory'].get(y) or {}
    if S.get('acts') is not None and not any(a.get('n') == n for a in S['acts']):
        i = next((k for k, a in enumerate(S['acts']) if a.get('n') == beside), len(S['acts']) - 1) + 1; S['acts'].insert(i, story)
    if d.get('actAlias', {}).get(nk(n)): del d['actAlias'][nk(n)]; report.append('alias removed: %s' % nk(n))
open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
print('\n'.join(report))
print('LEFT FOR ZALE (lineup carries these separately, or no single lineup spelling):')
for y, names in LEAVE: print('  %s: %s' % (y, ' | '.join(names)))
