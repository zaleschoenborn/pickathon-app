# One name per non-music act across every year (Design Studio, Nov 9 2026).
# WordPress bills the same person differently from year to year ('Greg Vandy' / 'DJ Greg Vandy', 'DJ Aquaman' /
# 'DJ Eric "Aquaman" Hedford', 'The Ambassador' / 'DJ Allen Thayer'), which split one act into several pages.
# Run after build_nonmusic.py for all years. It:
#   - groups the f:1 yearBill rows of every year by a person key (ck),
#   - gives every row the act's most used name (ties: the latest year's),
#   - makes the years list the union of the group, and the label the same in every year
#     (class: the earliest classed year's, as on the archive; else the latest year's tag),
#   - fills a missing blurb from another year and repairs blurbs that start mid-sentence,
#   - renames yearPhotos and actSets keys to the one name,
#   - writes data.json actAlias {variant key: page key} so schedule rows and 'with' links find the page.
import json, os, re, unicodedata
from collections import defaultdict, Counter
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
d = json.load(open(os.path.join(SITE, 'data.json')))

def nk(s):   # the site's key (index.html nk)
    return re.sub(r'[^a-z0-9]', '', re.sub(r'^the\s+', '', str(s or '').lower()))
def key(s):
    return nk(unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode())
SAME = {'allenthayer': 'ambassador', 'ericaquamanhedford': 'aquaman', 'impactsound': 'impactsound'}
def ck(n):
    s = re.sub(r'\([^)]*\)', '', str(n or '')); s = re.sub(r'\s*&\s*|\s+and\s+', ' and ', s, flags=re.I)
    k = key(s); k = re.sub(r'^djs?(?=[a-z0-9]{4})', '', k); k = re.sub(r'djs$', '', k); k = re.sub(r'^the(?=[a-z]{4})', '', k)
    return SAME.get(k, k)

G = defaultdict(list)
for y, bb in d['yearBill'].items():
    for b in bb:
        if b.get('f'): G[ck(b['n'])].append((int(y), b))
yln = d.get('yln') or {}
LNY = defaultdict(set)
for y, LL in yln.items():
    for L in LL.values():
        for q in L: LNY[ck(q['n'])].add(int(y))

def fix_blurb(t, n):
    t = (t or '').strip()
    t = re.sub(r'^((Website|Instagram|Facebook|Mixcloud|SoundCloud|Bandcamp|Spotify|XRAY\.FM|TikTok|YouTube|Twitter|Linktree|[\w-]+(?:\.[\w-]+)+\.(?:org|com|fm|net|io|co))\s*\|?\s*)+', '', t, flags=re.I).strip()
    if not t or not t[0].islower(): return t
    if re.match(r'^(is|are|was|were|has|have)\b', t): return n + ' ' + t
    s = re.split(r'(?<=[.!?])\s+(?=[A-Z])', t, maxsplit=1)
    return s[1] if len(s) > 1 else t

alias, ph, AS = dict(d.get('actAlias') or {}), d.get('yearPhotos') or {}, d.get('actSets') or {}   # keep earlier aliases: the script runs again on its own output
renamed = 0
for g, rows in G.items():
    rows.sort(key=lambda r: r[0])
    # the page name: every billing seen (bill rows and lineup lists); for DJs a 'DJ …' billing in normal case wins,
    # then the most used, then the latest ('disco diablo' and 'GREASY' read as typos on a grid of 'DJ …' names)
    seen = [(y, b['n']) for y, b in rows] + [(int(y0), q['n']) for y0, LL in yln.items() for L in LL.values() for q in L if ck(q['n']) == g]
    seen = [(y, re.sub(r'\s*\([^)]*\)\s*$', '', n).strip()) for y, n in seen]
    cnt = Counter(n for _, n in seen)
    dj = any((b.get('lu') == 'DJs') for _, b in rows)
    def score(yn):
        y, n = yn
        return ((dj and n.startswith('DJ ') and not n.startswith('DJ The ') and not n.startswith('DJs ')), not (n.islower() or n.isupper()), cnt[n], y)
    top = max(seen, key=lambda yn: (cnt[yn[1]], yn[0]))[1]   # the most used billing decides WHICH name (The Ambassador, not Allen Thayer)
    base = lambda n: re.sub(r'^djs?(?=[a-z0-9]{3})', '', key(n))
    name = max([yn for yn in seen if base(yn[1]) == base(top)], key=score)[1]   # then its best-dressed spelling
    yrs = sorted(set().union(*[set(b.get('yrs') or []) for _, b in rows]) | {y for y, _ in rows} | LNY.get(g, set()))
    classed = [b for _, b in rows if b.get('k') in ('disc', 'leg', 'deep')]
    first = classed[0] if classed else None
    late_tag = ''
    for _, b in reversed(rows):
        parts = (b.get('c') or '').split(' · ')
        if len(parts) > 1 and parts[1] not in ('Discovery', 'Legend', 'Deep cut'): late_tag = parts[1]; break
    blurbs = [b.get('l') for _, b in reversed(rows) if b.get('l')]
    links, dom = [], set()
    for _, b in reversed(rows):
        for u in b.get('lk') or []:
            u = u.rstrip('.,;)')
            mm = re.search(r'instagram|facebook|bandcamp|spotify|soundcloud|tiktok|linktr|twitter|x\.com|mixcloud', u)
            dk = mm.group(0) if mm else 'web'
            if dk not in dom: dom.add(dk); links.append(u)
    for y, b in rows:
        old = b['n']
        if old != name:
            renamed += 1
            if nk(old) != nk(name): alias[nk(old)] = nk(name)
            Y = str(y)
            if old in (ph.get(Y) or {}) and name not in ph[Y]: ph[Y][name] = ph[Y].pop(old)
            A = AS.get(Y) or {}
            if key(old) in A:
                L = A.setdefault(key(name), [])
                for r2 in A.pop(key(old)):
                    if r2 not in L: L.append(r2)
        b['n'] = name; b['yrs'] = yrs
        lu1 = (b.get('c') or '').split(' · ')[0]
        if first:
            b['k'] = first['k']; b['m'] = max(b.get('m') or 0, first.get('m') or 0)
            b['c'] = lu1 + ' · ' + {'disc': 'Discovery', 'leg': 'Legend', 'deep': 'Deep cut'}[first['k']]
        else:
            b['k'] = 'none'; b['c'] = lu1 + (' · ' + late_tag if late_tag else '')
        b['l'] = fix_blurb(blurbs[0] if blurbs else '', name)   # one bio per act: the latest year's
        if links: b['lk'] = links[:3]
# every lineup-list spelling of a paged act points at its page too
for y, LL in yln.items():
    for L in LL.values():
        for q in L:
            g = ck(q['n'])
            if g in G:
                pn = G[g][0][1]['n']
                if nk(q['n']) != nk(pn): alias[nk(q['n'])] = nk(pn)
PAGES = {nk(b['n']) for rows in G.values() for _, b in rows}
def res(v, n=0):
    return v if v in PAGES or n > 5 else res(alias.get(v, v), n + 1) if v in alias else v
alias = {k: res(v) for k, v in alias.items()}
alias = {k: v for k, v in alias.items() if k not in PAGES and v in PAGES and k != v}   # never point a page's own key away, no loops
d['actAlias'] = alias
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('groups', len(G), 'rows renamed', renamed, 'aliases', len(alias))
for g, rows in G.items():
    if len({y for y, _ in rows}) > 1 and len({b['n'] for _, b in rows}) == 1 and any(nk(b['n']) in alias.values() for _, b in rows):
        pass
