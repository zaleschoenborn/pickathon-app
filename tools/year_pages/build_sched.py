# Past schedules for every year from the master schedule (Dropbox _catalogs/schedule_all_years_draft<N>.csv).
# data.json pastSched[year] = [[day, "HH:MM", stage name as used that year, neighborhood key today or "", act, kind], ...]
# Stage names map to today's neighborhoods through stage_aliases.csv (feeds_neighborhood, else the place itself when it is a neighborhood today).
import csv, json, os, sys
HERE = os.path.dirname(__file__); SITE = os.path.join(HERE, '..', '..')
SCHED = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'src/schedule_all_years_draft6.csv')
d = json.load(open(os.path.join(SITE, 'data.json')))
HOODS = set(d['hoods'].keys())
P2H = {'galaxy-barn': 'galaxy', 'lucky-barn': 'lucky', 'cherry-hill': 'cherryhill', 'coyote-stage': 'coyote', 'galaxy-courtyard': 'courtyard', 'welcome-lot': 'welcomelot',
       'cedarwood': 'coyote', 'coyote-cove': 'coyote', 'coyote-crafts': 'coyote', 'coyote-workshop': 'coyote', 'feeding-nest': 'coyote'}
ALIAS = {}
for r in csv.DictReader(open(os.path.join(HERE, 'src/stage_aliases.csv'), encoding='utf-8-sig')):
    pid = r['place_id'].strip(); fn = (r.get('feeds_neighborhood') or '').strip()
    h = P2H.get(fn, fn.replace('-', '')) if fn else P2H.get(pid, pid.replace('-', ''))
    ALIAS[r['name_as_used'].strip().lower()] = h if h in HOODS else ''
out, miss = {}, {}
for r in csv.DictReader(open(SCHED, encoding='utf-8-sig')):
    a = (r.get('Act / event') or '').strip()
    if not a or a.upper() == 'TBA': continue
    st = (r.get('Stage') or '').strip()
    if st.lower() in ('(no stage listed)', 'unknown'): st = ''
    h = ALIAS.get(st.lower(), '') if st else ''
    if st and st.lower() not in ALIAS: miss[st] = miss.get(st, 0) + 1
    out.setdefault(r['Year'], []).append([r.get('Festival day') or '', (r.get('Start') or '')[-5:], st, h, a, r.get('Kind') or '', r.get('Date') or ''])
for y in out: out[y].sort(key=lambda x: (x[6], x[1], x[2]))
d['pastSched'] = {y: [x[:6] for x in v] for y, v in out.items()}
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print({y: len(v) for y, v in sorted(out.items())}); print('stages with no alias:', sorted(miss.items(), key=lambda x: -x[1])[:20])
