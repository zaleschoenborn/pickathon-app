# Rebuilds data.json yearRatings (the poster's six-month keyframes) from the master timeline (Nov 16 v8+).
# Usage: python3 tools/rebuild_year_ratings.py <class_table.csv> <Act_year_timeline.csv>
# Per year: dates = every point from Aug 1 of the festival year to the latest point; per act, m = peak since booking at that point
# (the running peak, never goes down; blank before measured stays None), c = class series (at-festival class, today's class at the last point).
import json, csv, sys, re, os, collections
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); P = os.path.join(SITE, 'data.json')
fold = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())
K = {'Discovery': 'disc', 'Legend': 'leg', 'Deep cut': 'deep'}
T = {}
for x in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')):
    if x['lineup'] != 'Music' or (x.get('merged_into') or '').strip() or (x.get('duplicate_of') or '').strip(): continue
    T[(x['year'], fold(x['act']))] = x
rows = collections.defaultdict(list)
for x in csv.DictReader(open(sys.argv[2], encoding='utf-8-sig')):
    if x['lineup'] != 'Music' or (x['year'], fold(x['act'])) not in T: continue
    rows[x['year']].append(x)
d = json.load(open(P)); YR = {}
for y, R in sorted(rows.items()):
    pts = sorted({x['point'] for x in R if x['point_kind'] in ('after', 'latest', 'booking') and x['point'] >= '%s-08-01' % y})
    lat = max((x['point'] for x in R if x['point_kind'] == 'latest'), default=None)
    pts = [p for p in pts if lat is None or p <= lat]
    if len(pts) < 2: continue
    by = collections.defaultdict(dict)
    for x in R:
        v = (x.get('peak_since_booking_dec') or '').strip()
        by[x['act']][x['point']] = float(v) if v else None
    acts = []
    for a, S in sorted(by.items(), key=lambda kv: kv[0].lower()):
        t = T[(y, fold(a))]; last = None; m = []
        for p in pts:
            v = S.get(p, last if last is not None else None)
            if v is not None: last = v
            m.append(v)
        ml = (t.get('magnitude_dec') or '').strip()
        if ml and m[-1] is not None: m[-1] = float(ml)
        c0 = K.get(t['at_festival_class'], 'none'); c1 = K.get(t['today_class']) or c0
        acts.append({'n': a, 'c': [c0] * (len(pts) - 1) + [c1], 'm': m})
    YR[y] = {'dates': pts, 'fest': 0, 'acts': acts}
d['yearRatings'] = YR
json.dump(d, open(P, 'w'), ensure_ascii=False, separators=(',', ':'))
print({y: (len(v['dates']), len(v['acts'])) for y, v in YR.items()})
