# Neighborhood programming from the record (Design Studio, Nov 9 2026; design_specs/neighborhood_pages.md).
# Zale, Nov 9: the record from 2018 on (WordPress schedule, in data.json pastSched) is enough.
# For each gathering neighborhood: what happens there (kinds of programming, each with who or what, and the years),
# and the regulars (who came back the most summers). Who = the performer or organization named in the schedule title,
# matched against every lineup name; an activity with no named host stays as itself.
# Writes data.json hoodProg[hid] = {y0, y1, n (scheduled items), w (different acts and activities),
#   kinds: [[kind, [[name, [years], page]]]], regs: [[name, [years], page, photo]]}.
# page = the act's page name when it has one (yearBill), else ''. The day strip is built on the page from pastSched.
import json, os, re, unicodedata
from collections import defaultdict, OrderedDict
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
d = json.load(open(os.path.join(SITE, 'data.json')))
GATHER = ['coyote', 'refuge', 'curation', 'courtyard', 'market']
def nk(s): return re.sub(r'[^a-z0-9]', '', re.sub(r'^the\s+', '', unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()))
AL = d.get('actAlias') or {}
# pages: every act with a year page (non-music f rows and music rows), by key, with its latest year and tag
PAGE, TAG, PY = {}, {}, {}
for y, bb in d['yearBill'].items():
    for b in bb:
        k = nk(b['n']); PAGE[k] = b['n']; PY.setdefault(k, set()).add(int(y))
        parts = (b.get('c') or '').split(' · ')
        if len(parts) > 1 and parts[1] not in ('Discovery', 'Legend', 'Deep cut'): TAG[k] = parts[1]
# entities: every lineup name of the non-music lineups and every page name, longest first so 'Red Yarn Band' beats 'Red Yarn'
ENT = {}
for y, LL in (d.get('yln') or {}).items():
    for L, rows in LL.items():
        if L == 'Music': continue
        for q in rows:
            n = re.sub(r'\s*\([^)]*\)\s*$', '', q['n']).strip()
            if len(nk(n)) >= 5: ENT.setdefault(nk(n), n)
            for t in (q.get('t') or [])[:1]: TAG.setdefault(nk(n), t)
for k, n in PAGE.items():
    if len(k) >= 5: ENT.setdefault(k, n)
# a few hosts the lineup lists under a longer name
ENT.setdefault('myvoicemusic', 'My Voice Music'); ENT.setdefault('redyarn', 'Red Yarn'); ENT.setdefault('bridgetownbaby', 'Bridgetown Baby Family Feeding Nest')
ENT.setdefault('cedarwood', 'Cedarwood Waldorf School'); ENT.setdefault('friendsofnoise', 'Friends of Noise'); ENT.setdefault('sellwoodcommunityhouse', 'Sellwood Community House')
EK = sorted(ENT, key=len, reverse=True)
def page_of(k):
    k = AL.get(k, k)
    return PAGE.get(k, '')
def who(title):
    t = nk(title)
    for k in EK:
        if k in t: return k
    return ''
SKIP = re.compile(r'sign-?ups? begin|registration|check-?in|closed|^tba\b|^tbd\b', re.I)
KW = [('Little ones & care', r'feeding nest|nursing|drop-?off|cedarwood|care\b|baby|toddler'),
      ('Yoga & movement', r'yoga|dance|movement|square dance'),
      ('Crafts & making', r'craft|felt|clay|typewriter|paint|stamp|bubbles|make|making|handmade|wands|mobiles|facepaint'),
      ('Outdoor skills', r'trackers|nature|forest|outdoor|wild|earth cool'),
      ('Big moments', r'parade|talent show|jamboree|showcase|open mic|happy hour|sing-?a-?long|storytime'),
      ('Workshops & lessons', r'workshop|lesson|songwriting|drumming|vocal|exploration|music together|jam\b|ukulele|battle'),
      ("Kids' shows", r'clown|juggl|magic|circus|variety|puppet|jokey|comedy|joke')]
TAGK = {"Kids' music": "Kids' shows", 'Clown & variety': "Kids' shows", 'Little ones & care': 'Little ones & care',
        'Music workshop': 'Workshops & lessons', 'Outdoor skills': 'Outdoor skills', 'Yoga': 'Yoga & movement', 'Crafts': 'Crafts & making'}
KWH = {'refuge': [('Recovery', r'recovery|dharma'), ('Sound baths', r'sound|bowl|harp|looping|kirtan'),
                  ('Meditation & breath', r'meditat|breath|tea\b|tea cer|qi ?gong|rest, relax|cacao'),
                  ('Yoga & movement', r'yoga|stretch|somatic|movement|dance'), ('Sing-alongs & poetry', r'sing|poetry|poem|type-?written'),
                  ('Making', r'weav|craft|aromatherapy|mister|blooms|crane|art\b|make|bee'), ('Tarot & readings', r'tarot|reading')],
       'curation': [('Chef dinners with a band', r'\bw/|\bwith\b'), ('DJs', r'^dj\b'), ('Dinners & brunches', r'dinner|brunch|happy hour|curation')]}
def kind_of(title, stage, k, hid=''):
    for kn, rx in KWH.get(hid, []):
        if re.search(rx, title, re.I): return kn
    for kn, rx in KW:
        if re.search(rx, title, re.I): return kn
    t = TAG.get(k) or TAG.get(AL.get(k, ''), '')
    if t in TAGK: return TAGK[t]
    if re.search(r'workshop', stage, re.I): return 'Workshops & lessons'
    if re.search(r'craft', stage, re.I): return 'Crafts & making'
    if re.search(r'cove', stage, re.I): return 'Yoga & movement'
    return "Kids' shows" if re.search(r'stage', stage, re.I) else 'More'
out = {}
for hid in GATHER:
    rows = [(int(y), r) for y, R in (d.get('pastSched') or {}).items() if y.isdigit() and int(y) >= 2018 for r in R if r[3] == hid and not SKIP.search(r[4] or '')]
    if not rows: continue
    K = defaultdict(OrderedDict); YS = defaultdict(set); NM = {}
    for y, r in rows:
        title = re.sub(r'\s+', ' ', r[4]).strip()
        k = who(title) or nk(re.split(r':\s', title)[0])
        n = ENT.get(k) or re.split(r':\s', title)[0].strip()
        NM[k] = n; YS[k].add(y)
        K[kind_of(title, r[2], k, hid)][k] = 1
    small = [x for x in K if len(K[x]) < 3 and x != 'More']
    if small and sum(len(K[x]) for x in small) + len(K.get('More', {})) >= 3:   # a kind with one or two names joins 'More' (never a 'More' of one)
        for kn in small:
            for k in K.pop(kn): K['More'][k] = 1
    kinds = []
    for kn in sorted(K, key=lambda x: (x == 'More', -len(K[x]), x)):
        items = sorted(K[kn], key=lambda k: (-len(YS[k]), NM[k].lower()))
        kinds.append([kn, [[NM[k], sorted(YS[k]), page_of(k)] for k in items]])
    regs = []
    for k in sorted(YS, key=lambda k: (-len(YS[k]), -max(YS[k]), NM[k].lower())):
        if len(YS[k]) < 2 or len(regs) >= 6: continue
        pg = page_of(k); ph = ''
        for y in sorted(YS[k] | PY.get(nk(pg), set()), reverse=True):
            ph = (((d.get('yearPhotos') or {}).get(str(y)) or {}).get(pg) or {}).get('i', '')
            if ph: break
        regs.append([NM[k], sorted(YS[k]), pg, ph])
    ys = sorted({y for y, _ in rows})
    out[hid] = {'y0': ys[0], 'y1': ys[-1], 'n': len(rows), 'w': len(YS), 'kinds': kinds, 'regs': regs}
    print(hid, ys[0], ys[-1], 'items', len(rows), 'who', len(YS), [(k[0], len(k[1])) for k in kinds])
    print('  regulars', [(r[0], r[1], bool(r[2]), bool(r[3])) for r in regs])
# ---- stage neighborhoods: who played here, by class (music) or lineup (everything else) ----
STAGES = ['woods', 'paddock', 'cherryhill', 'grove', 'windmill', 'galaxy', 'lucky', 'farmhouse', 'orchard']
KL = {'leg': 'Legends', 'disc': 'Discoveries', 'deep': 'Deep cuts', 'none': 'More to hear'}
LUK = {'DJs': 'DJs', 'Comedy': 'Comedy & readings', 'Literary': 'Comedy & readings', 'Family': 'Family'}
ORDER = ['Legends', 'Discoveries', 'Deep cuts', 'More to hear', 'DJs', 'Comedy & readings', 'Family', 'More']
ROW = {}
for y, bb in d['yearBill'].items():
    for b in bb: ROW[(int(y), nk(b['n']))] = b
for hid in STAGES:
    rows = [(int(y), r) for y, R in (d.get('pastSched') or {}).items() if y.isdigit() and int(y) >= 2018 for r in R if r[3] == hid and not SKIP.search(r[4] or '')]
    if not rows: continue
    K = defaultdict(OrderedDict); YS = defaultdict(set); NM = {}; MG = defaultdict(float); MU = set()
    # showcases (Pickathon Laughs, Author Readings, Soul Stew) stand for the acts WordPress links to them
    WITH = defaultdict(list)
    for y0, A in (d.get('actSets') or {}).items():
        for ak, L in A.items():
            for r2 in L:
                if r2[3] == hid: WITH[(int(y0), r2[0], r2[1], nk(r2[4]))].append(AL.get(ak, ak))
    exp = []
    for y, r in rows:
        ks = WITH.get((y, r[0], r[1], nk(r[4])))
        if ks and nk(r[4]) not in ks: exp += [(y, r, k1) for k1 in ks]
        else: exp.append((y, r, None))
    for y, r, kw in exp:
        k0 = kw or nk(r[4]); k = AL.get(k0, k0); b = ROW.get((y, k))
        if b and not b.get('f'): kn = KL.get(b.get('k') or 'none', 'More to hear'); MU.add(k)
        elif b: kn = LUK.get(b.get('lu'), 'More')
        else: kn = 'More'
        NM[k] = b['n'] if b else re.sub(r'\s+', ' ', r[4]).strip(); YS[k].add(y); MG[k] = max(MG[k], float((b or {}).get('m') or 0))
        K[kn][k] = 1
    for kn in [x for x in K if len(K[x]) < 3 and x != 'More']:
        for k in K.pop(kn): K['More'][k] = 1
    kinds = [[kn, [[NM[k], sorted(YS[k]), page_of(k)] for k in sorted(K[kn], key=lambda k: (-MG[k], -len(YS[k]), NM[k].lower()))]] for kn in ORDER if kn in K]
    regs = []
    for k in sorted(YS, key=lambda k: (k not in MU, -len(YS[k]), -MG[k], NM[k].lower())):   # bands first: the regulars of a stage are its returning acts
        if len(YS[k]) < 2 or len(regs) >= 6 or (k not in MU and len(regs) >= 3): continue
        pg = page_of(k); ph = ''
        for y in sorted(YS[k], reverse=True):
            ph = (((d.get('yearPhotos') or {}).get(str(y)) or {}).get(pg) or {}).get('i', '')
            if ph: break
        regs.append([NM[k], sorted(YS[k]), pg, ph])
    ys = sorted({y for y, _ in rows})
    out[hid] = {'mode': 'stage', 'y0': ys[0], 'y1': ys[-1], 'n': len(rows), 'w': len(YS), 'kinds': kinds, 'regs': regs}
    print(hid, ys[0], ys[-1], 'sets', len(rows), 'acts', len(YS), [(k[0], len(k[1])) for k in kinds], 'regulars', [r[0] for r in regs])
d['hoodProg'] = out
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
