# Load the approved rating_history_<year>.csv files (Artist Classification, Nov 12 2026) into data.json yearRatings.
# Real dated snapshots: each act has a row every Feb 1 / Aug 1 from its booking year, last row 2026-11-12. mag = peak since booking (one decimal, blank = not measured, kept as null, never 0).
# dates = the festival's Aug 1, every six months after, then 2026-11-12 (rows before the festival are dropped). Usage: python3 build_ratings_nov12.py
import json, csv, os, glob, re
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.join(HERE, '..', '..'); SRC = os.path.join(HERE, 'src_nov12')
KC = lambda c: {'Legend': 'leg', 'Discovery': 'disc', 'Deep cut': 'deep', 'Neither': 'none'}.get((c or '').strip())
d = json.load(open(os.path.join(SITE, 'data.json'))); out = {}
for f in sorted(glob.glob(os.path.join(SRC, 'rating_history_*.csv'))):
    y = re.search(r'(\d{4})', os.path.basename(f)).group(1)
    rows = [r for r in csv.DictReader(open(f, encoding='utf-8')) if r['date'] >= y + '-08-01' and KC(r['class'])]
    if not rows: continue
    dates = sorted(set(r['date'] for r in rows)); ix = {dt: i for i, dt in enumerate(dates)}; acts = {}
    for r in rows:
        a = acts.setdefault(r['act'], {'n': r['act'], 'c': [None] * len(dates), 'm': [None] * len(dates)})
        i = ix[r['date']]; a['c'][i] = KC(r['class']); a['m'][i] = float(r['mag']) if r['mag'].strip() else None
    for a in acts.values():   # an act missing a row at some date carries its previous call forward
        for i in range(len(dates)):
            if a['c'][i] is None: a['c'][i] = a['c'][i - 1] if i else next((c for c in a['c'] if c), 'none')
    out[y] = {'dates': dates, 'fest': 0, 'acts': list(acts.values())}
d['yearRatings'] = out
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print({y: (len(v['dates']), len(v['acts'])) for y, v in out.items()})
