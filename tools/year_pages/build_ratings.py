# Rebuild yearRatings for every year from the class table's six-month paths (class_table_nov10.csv, draft 131 and later).
# dates = the festival month, every six months after it, then Today. Each act's class at each point comes from class_path (dated steps);
# magnitude is the at-festival value easing to the today value over time (only used to order the dots inside a column).
# Usage: python3 build_ratings.py <class_table.csv>
import json, csv, sys, re, os, unicodedata
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
def key(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower(); s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
KC = lambda c: 'leg' if (c or '').startswith('Legend') else 'disc' if (c or '').startswith('Discovery') else 'deep' if (c or '').startswith('Deep cut') else 'none' if (c or '').startswith('Neither') else None
RK = {'none': 0, 'deep': 1, 'disc': 2, 'leg': 3}
MON = {m: i + 1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}
TODAY = '2026-11-10'
def num(x):
    try: return float(x)
    except Exception: return None
def steps(path):   # [(YYYY-MM, class)] for the dated steps (not the festival, not Today)
    out = []
    for part in [p.strip() for p in (path or '').split('|')]:
        m = re.match(r'^([A-Z][a-z]{2}) (\d{4}): (.+)$', part)
        if m and not part.startswith('At festival'): out.append(('%s-%02d' % (m.group(2), MON[m.group(1)]), KC(m.group(3))))
    return out
d = json.load(open(os.path.join(SITE, 'data.json'))); T = {}
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')):
    if r.get('lineup') != 'Music' or (r.get('merged_into') or '').strip() or not KC(r.get('class')): continue
    k = KC(r['class']); af = KC(r['at_festival_class']) or k; td = KC(r['today_class']) or KC(r['stature_now_class']) or k
    if RK[td] < RK[af]: td = af
    T[(r['year'], key(r['act']))] = dict(af=af, td=td, afm=num(r['at_festival_magnitude']) or num(r['magnitude']) or 0, tdm=num(r['today_magnitude']) or num(r['magnitude']) or 0, st=steps(r['class_path']))
n_up = 0
for y, R in d['yearRatings'].items():
    yr = int(y); fm = '%d-08' % yr
    grid = []; t = (yr, 8)
    while (t[0], t[1]) < (2026, 8) or (t == (2026, 8) and yr < 2026):
        grid.append('%d-%02d' % t); t = (t[0] + 1, 2) if t[1] == 8 else (t[0], 8)
        if len(grid) > 60: break
    if yr == 2026: grid = ['2026-08']
    elif grid[-1] != '2026-08' and (2026, 8) > (yr, 8): grid.append('2026-08')
    dates = [g + '-01' for g in grid] + [TODAY]
    R['dates'] = dates; R['fest'] = 0; nn = len(dates)
    span = max(1, nn - 1)
    for a in R['acts']:
        t = T.get((y, key(a['n'])))
        if not t:   # keep what we have, flattened to the new date list
            c0 = a['c'][a.get('fest', R.get('fest', 0))] if a.get('c') else 'none'; m0 = a['m'][0] if a.get('m') else 0; cn = a['c'][-1]; mn = a['m'][-1]
            t = dict(af=c0, td=cn, afm=m0, tdm=mn, st=[])
        c = []; cur = t['af']
        for i, dd in enumerate(dates):
            if i == nn - 1: cur = t['td']
            else:
                for sd, sc in t['st']:
                    if sd <= dd[:7] and sd >= fm[:7]: cur = sc
            if RK[cur] > RK[t['td']]: cur = t['td']
            c.append(cur)
        c[0] = t['af']
        # a class change that is not dated sits at Today only
        a['c'] = c; a['m'] = [int(round(t['afm'] + (t['tdm'] - t['afm']) * (i / span if span else 1))) for i in range(nn)]
        if c[0] != c[-1]: n_up += 1
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('rebuilt yearRatings; acts that changed class:', n_up, 'points per year:', {y: len(R['dates']) for y, R in list(d['yearRatings'].items())[:30]})
