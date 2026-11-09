# Then and now dots data (year_page.md "Story card graphic"). Design Studio, Nov 9 2026.
# Builds data.json yearRatings[year] from Artist Classification's rating_history_<year>.csv:
# music rows only, snapshots from the Feb before the festival on; when two snapshots are under
# 30 days apart the later one stands (Nov 7 and Nov 8 2026 are one re-rating).
# Where a date has two rows for one act, history keeps the first and the newest date keeps the last.
# Usage: python3 tools/year_pages/build_ratings.py tools/year_pages/src/history/rating_history_2024.csv [...]
import csv, json, os, re, sys, datetime as dt
SITE = os.path.join(os.path.dirname(__file__), '..', '..'); D = os.path.join(SITE, 'data.json')
d = json.load(open(D)); d.setdefault('yearRatings', {})
K = {'Legend': 'leg', 'Discovery': 'disc', 'Deep cut': 'deep'}
for f in sys.argv[1:]:
    y = re.search(r'(\d{4})', os.path.basename(f)).group(1)
    R = [r for r in csv.DictReader(open(f, encoding='utf-8-sig')) if r['cat'] == 'Music' and r['date'] >= y + '-02-01']
    ds = sorted({r['date'] for r in R}); keep = []
    for x in ds:
        if keep and (dt.date.fromisoformat(x) - dt.date.fromisoformat(keep[-1])).days < 30: keep[-1] = x
        else: keep.append(x)
    snap = {}
    # A date can carry two rows for an act: the snapshot as rated then, and a later rewrite appended
    # under the same date (the Nov 8 rooms pass). History keeps the first row; the latest date keeps the last.
    for r in R:
        S = snap.setdefault(r['act'], {})
        if r['date'] not in S or r['date'] == ds[-1]: S[r['date']] = r
    acts = []
    for n, S in snap.items():
        c, m, last = [], [], None
        for x in keep:
            last = S.get(x) or last
            c.append(K.get((last or {}).get('class'), 'none') if last else 'none'); m.append(int(float((last or {}).get('mag') or 0)))
        acts.append({'n': n, 'c': c, 'm': m})
    acts.sort(key=lambda a: a['n'].lower())
    fest = next(i for i, x in enumerate(keep) if x >= y + '-08-01')
    d['yearRatings'][y] = {'dates': keep, 'fest': fest, 'acts': acts}
    from collections import Counter
    print(y, keep, 'fest', keep[fest], 'now', Counter(a['c'][-1] for a in acts), 'then', Counter(a['c'][fest] for a in acts))
json.dump(d, open(D, 'w'), ensure_ascii=False, separators=(',', ':'))
