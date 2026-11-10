# Every store on a year page carries the class in the latest class table (pickathon-page-year 3a: "zero differences").
# Updates yearBill k/m for music rows and the newest yearRatings snapshot, for every year. Run after the other builds.
# Usage: python3 sync_class.py <class_table.csv>
import json, csv, sys, re, os, unicodedata
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
def key(s):
    s = str(s or '').replace('\u00b3', '').replace(' ft Gordon Gano', '')  # Zale Nov 10: Giant\u00b3 Sand is the spelling; Lost Bayou Ramblers ft Gordon Gano is an alias of Lost Bayou Ramblers
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
KC = {'Legend': 'leg', 'Discovery': 'disc', 'Deep cut': 'deep', 'Neither': 'none'}
CL = {}
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')):
    if r.get('lineup') != 'Music' or r.get('class') not in KC: continue
    try: m = float(r.get('magnitude') or 0)
    except ValueError: m = 0.0
    CL[(r['year'], key(r['act']))] = (KC[r['class']], m)
def find(y, n):
    k = key(n)
    if (y, k) in CL: return CL[(y, k)]
    for (yy, kk), v in CL.items():
        if yy == y and min(len(k), len(kk)) >= 6 and (k.startswith(kk) or kk.startswith(k)): return v
d = json.load(open(os.path.join(SITE, 'data.json'))); ch = []
for y, B in (d.get('yearBill') or {}).items():
    for b in B:
        if b.get('f'): continue
        v = find(y, b['n'])
        if v and (b['k'] != v[0] or float(b.get('m') or 0) != v[1]): ch.append((y, b['n'], b['k'], '->', v[0], v[1])); b['k'], b['m'] = v[0], v[1]
for y, R in (d.get('yearRatings') or {}).items():
    for a in R.get('acts') or []:
        v = find(y, a['n'])
        if v and (a['c'][-1] != v[0] or a['m'][-1] != int(v[1])): ch.append((y, a['n'], 'now', a['c'][-1], '->', v[0])); a['c'][-1], a['m'][-1] = v[0], int(v[1])
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(ch), 'changes'); [print(*c) for c in ch[:30]]
