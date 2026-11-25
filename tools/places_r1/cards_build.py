# The Farm's cards (Zale, Nov 24 08:56-09:37): Home's cards, same words and photos, newest Copy Review files only.
# Words: copy_in/ (snapshots of Dropbox _catalogs/work/copy_review/*.csv; refresh them when Copy Review updates a file).
# Photos and the Music picks: home_cards_scrape.json (Home's card row, branch design/home-carousel 7ff5626a, read Nov 24).
# Music clips: data.json videos (same act, year and stage; never a full set or an A Concert A Day clip).
# Output: cards.json = {experience: {place: [{t, y, b, i, p, v}]}}; build.py injects it as /*@CARDS*/.
import csv, json, os
R = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(R, '..', '..'))
C = lambda f: list(csv.DictReader(open(os.path.join(R, 'copy_in', f), encoding='utf-8')))
H = json.load(open(os.path.join(R, 'home_cards_scrape.json'), encoding='utf-8'))
D = json.load(open(os.path.join(ROOT, 'data.json'), encoding='utf-8'))
HN = {k: v.get('n', k) for k, v in D['hoods'].items()}
words = {}
for r in C('summer_camp_cards_nov24_draft2.csv'): words[(r['experience'], r['place_key'], r['title'])] = (r['title'], r['blurb'])
REN = {'Brunch at Curation': 'Sunday Brunch at Curation', "Kids' Talent Show": 'Ukulele and Talent Show', 'Music Classes': 'Family Jam'}
for r in C('summer_camp_cards_changes_nov24_draft1.csv'):
    old = REN.get(r['title'], r['title']); words[(r['experience'], r['place_key'], old)] = (r['title'], r['blurb'])
for r in C('summer_camp_cards_changes2_nov24_draft1.csv'):
    for key in [kk for kk in words if kk[0] == r['experience'] and kk[1] == r['place_key'] and words[kk][0] == r['title']] or [(r['experience'], r['place_key'], r['title'])]:
        words[key] = (r['title'], r['blurb'])
music = {(r['act'], r['year']): r['line'] for r in C('music_row_lines_nov24_draft1.csv')}
won = {}
for f in ('wonders_cards_nov24_draft1.csv', 'wonders_cards_2025_2026_nov24_draft1.csv', 'wonders_cards_2025_rest_nov24_draft1.csv', 'wonders_cards_2026_rest_nov24_draft1.csv', 'wonders_cards_changes3_nov24_draft1.csv'):
    for r in C(f): won[(r['place_key'], r['year'])] = (r['title'], r['blurb'])
def vid(act, y, k):
    best = None
    for x in D.get('videos', []):
        if x.get('a') != act or str(x.get('y')) != str(y) or x.get('s') == 'Full set' or x.get('cad') or x.get('f') or x.get('nonact'): continue
        u = ('https://vimeo.com/' + x['vm'] + ('/' + x['vh'] if x.get('vh') else '')) if x.get('vm') else ('https://www.youtube.com/watch?v=' + x['id'] if len(x.get('id', '')) == 11 else '')
        if not u: continue
        sc = (x.get('vn') == HN.get(k)) * 2 + (x.get('vn') == HN.get(k, '').split(' ')[0])
        if best is None or sc > best[0]: best = (sc, u)
    return best[1] if best else ''
out, miss = {}, []
for xp, cards in H.items():
    if xp == 'Wonders': continue
    for c in cards:
        k = c['h']
        if xp == 'Music':
            b = music.get((c['t'], c['y']))
            if not b: miss.append(('Music', k, c['t'])); b = c['bl']
            o = {'t': c['t'], 'y': c['y'], 'b': b, 'i': c['img'], 'p': c['pos'] or '50% 30%', 'v': vid(c['t'], c['y'], k)}
        else:
            w = words.get((xp, k, c['t']))
            if not w: miss.append((xp, k, c['t'])); continue
            o = {'t': w[0], 'y': '', 'b': w[1], 'i': c['img'], 'p': c['pos'] or '50% 50%'}
        out.setdefault(xp, {}).setdefault(k, []).append(o)
XWP = {}   # copied from Home's index.html XWP (branch design/home-carousel); files i/xw, m/xw
try:
    import re as _re
    _m = _re.search(r'XWP *= *(\{[^;]*\})', open(os.path.join(R, 'home_xwp.txt'), encoding='utf-8').read())
    XWP = {tuple(k.split('|')): tuple(v) for k, v in json.loads(_m.group(1)).items()} if _m else {}
except FileNotFoundError: pass
hw = {}
for c in H.get('Wonders', []): hw.setdefault(c['h'], {})[c['y'] or '?'] = c
for k, ys in hw.items():
    pick = None
    for y in ('2026', '2025', '2024', '2023', '2022', '2019'):
        if (k, y) in won and y in ys: pick = {'t': won[(k, y)][0], 'y': y, 'b': won[(k, y)][1], 'i': ys[y]['img'], 'p': ys[y]['pos'] or '50% 50%'}; break
        if y == '2026' and '2026' in ys: pick = {'t': ys['2026']['t'], 'y': '2026', 'b': '', 'i': ys['2026']['img'], 'p': ys['2026']['pos'] or '50% 50%'}; break
    if pick and (k, pick['y']) in XWP: pick['i'], pick['p'] = XWP[(k, pick['y'])]   # Home's build photos for Wonders (design_home-64, Nov 24): same photos as Home
    if pick: out.setdefault('Architecture', {})[k] = [pick]
# Deeper rotation (Zale, Nov 25, picked "photos now, Copy's cards later"): each card carries a few more photos of the same
# experience at the same place ('x'), shown under the card's words. Sources: xp_manifest.json (photos already picked and
# cropped for the Farm). Wonders cards name a 2026 build, so only 2026 frames of that place go under them, except the places
# whose card is about the place itself (Galaxy, Orchard, Curation). Music keeps its clip. Cards that already have their own
# photo each (several cards, one pool) get none, so no photo shows a different moment than the words. At most 4 extra per card.
import re as _re2
MAN = json.load(open(os.path.join(R, 'xp_manifest.json'), encoding='utf-8'))
TIMELESS = {'galaxy', 'orchard', 'curation'}
def _yr(s): m = _re2.search(r'/(20\d\d)', s or ''); return m.group(1) if m else ''
for xp, pl in out.items():
    if xp == 'Music': continue
    for k, L in pl.items():
        pool = MAN['arch'].get(k, []) if xp == 'Architecture' else (MAN['xp'].get(xp, {}) or {}).get(k, [])
        if xp == 'Architecture' and k not in TIMELESS: pool = [p for p in pool if L and _yr(p.get('src')) == (L[0].get('y') or '2026')]
        if (xp, k) in {('Craft', 'paddock')}: continue   # the card is one named shop (Merry Pop); the pool shows other makers' booths
        if len(L) != 1: continue   # several specific cards (Refuge, Coyote, Curation meals): a shared pool could put the wrong moment under the words
        used = {c['i'] for c in L}
        pool = [p for p in pool if p['f'] not in used and os.path.exists(os.path.join(R, '..', '..', p['f']))]
        for j, p in enumerate(pool):
            c = L[j % len(L)]
            if len(c.setdefault('x', [])) < 4: c['x'].append([p['f'], p.get('p', '50% 50%')])
        for c in L:
            if c.get('x') == []: del c['x']
fw = C('farm_words_nov24_draft1.csv')   # Copy Review's Farm words (row design_neighborhoods-46)
SN = {(r['experience'], r['card_title']): r['text'] for r in fw if r['kind'] == 'short_name'}
SN.update({(e, n): v for (e, t), v in list(SN.items()) for n in [{'Ukulele and Talent Show': "Kids' Talent Show", 'Sunday Brunch at Curation': 'Brunch at Curation'}.get(t)] if n})
for xp, pl in out.items():
    for k, L in pl.items():
        for c in L:
            if (xp, c['t']) in SN: c['s'] = SN[(xp, c['t'])]
out['_row'] = {}
for r in fw:
    if r['kind'] == 'row_line': out['_row'].setdefault('Architecture' if r['experience'] == 'Wonders' else r['experience'], {})[r['place_key']] = r['text']
out['_w'] = {r['kind']: r['text'] for r in fw if r['experience'] == 'Wonders'}
ab = os.path.join(R, 'copy_in', 'farm_about.csv')   # Copy Review's "<experience> at <place>" blocks from Pickathon's own stories (row design_neighborhoods-48), when they land
if os.path.exists(ab):
    out['_about'] = {}
    for r in csv.DictReader(open(ab, encoding='utf-8')): out['_about'].setdefault('Architecture' if r['experience'] == 'Wonders' else r['experience'], {})[r['place_key']] = r['text']
json.dump(out, open(os.path.join(R, 'cards.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print({x: sum(len(v) for v in p.values()) for x, p in out.items() if not x.startswith('_')}, 'missing words:', miss)
print('no clip:', [(k, c['t']) for k, L in out.get('Music', {}).items() for c in L if not c['v']])
print('wonders no blurb:', [k for k, L in out['Architecture'].items() if not L[0]['b']])
