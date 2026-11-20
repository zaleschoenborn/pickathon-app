# Archive list from the flag-style class table (v159 and later), Nov 19 2026 (Design: Home, per Zale).
# The table now keeps Legend and Discovery as flags (legend_flag, discovery_flag), not in the class column.
# Rule per act (music, not merged or duplicate rows): Legend if any row has legend_flag yes (sticky); else Discovery if any row has
# discovery_flag yes; else Deep cut if any row has class_booking Deep cut. y = the year of the row that earned the class; ys = every year played.
# Keeps each act's existing line (l), genre (g) and ks from the current archCT so no story is lost; writes data.json archCT, then copy_rules/apply.py.
# Usage: python3 build_arch_flags.py <class_table.csv>
import json, sys, re, os, csv, unicodedata, collections, subprocess
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
def key(s):
    s = str(s or '').replace('³', '').replace(' ft Gordon Gano', '')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
rows = [x for x in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')) if x['lineup'] == 'Music' and not (x['merged_into'] or '').strip() and not (x['duplicate_of'] or '').strip()]
by = collections.defaultdict(list)
for x in rows: by[key(x['act'])].append(x)
dp = os.path.join(SITE, 'data.json'); d = json.load(open(dp))
old = {key(a['n']): a for a in d.get('archCT', [])}
out = []
for k, xs in by.items():
    xs.sort(key=lambda x: int(x['year']))
    pick = [(c, [x for x in xs if f(x)]) for c, f in (('leg', lambda x: x['legend_flag'] == 'yes'), ('disc', lambda x: x['discovery_flag'] == 'yes'), ('deep', lambda x: x['class_booking'] == 'Deep cut'))]
    c, hit = next(((c, h) for c, h in pick if h), (None, None))
    if not c: continue
    x = hit[0]; o = old.get(k, {})
    n = o.get('n') or x['act']
    e = {'n': n, 'k': c, 'y': int(x['year']), 'ys': sorted({int(r['year']) for r in xs} | {int(v) for v in o.get('ys', [])} if False else {int(r['year']) for r in xs}),
         'm': float(x.get('magnitude_dec') or x.get('magnitude') or 0), 'g': o.get('g') or (x.get('genre_primary') or '').strip().lower(), 'c': x.get('confidence') or ''}
    for f in ('l', 'ks'):
        if o.get(f): e[f] = o[f]
    out.append(e)
out.sort(key=lambda o: (o['y'], o['n'].lower()))
d['archCT'] = out
json.dump(d, open(dp, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), collections.Counter(o['k'] for o in out), 'with line', sum(1 for o in out if o.get('l')))
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'copy_rules', 'apply.py')], check=True)
