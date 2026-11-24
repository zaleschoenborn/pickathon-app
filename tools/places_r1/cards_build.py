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
music = {(r['act'], r['year']): r['line'] for r in C('music_row_lines_nov24_draft1.csv')}
won = {}
for f in ('wonders_cards_nov24_draft1.csv', 'wonders_cards_2025_2026_nov24_draft1.csv'):
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
hw = {}
for c in H.get('Wonders', []): hw.setdefault(c['h'], {})[c['y'] or '?'] = c
for k, ys in hw.items():
    pick = None
    for y in ('2026', '2025', '2024', '2023', '2022', '2019'):
        if (k, y) in won and y in ys: pick = {'t': won[(k, y)][0], 'y': y, 'b': won[(k, y)][1], 'i': ys[y]['img'], 'p': ys[y]['pos'] or '50% 50%'}; break
        if y == '2026' and '2026' in ys: pick = {'t': ys['2026']['t'], 'y': '2026', 'b': '', 'i': ys['2026']['img'], 'p': ys['2026']['pos'] or '50% 50%'}; break
    if pick: out.setdefault('Architecture', {})[k] = [pick]
json.dump(out, open(os.path.join(R, 'cards.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print({x: sum(len(v) for v in p.values()) for x, p in out.items()}, 'missing words:', miss)
print('no clip:', [(k, c['t']) for k, L in out.get('Music', {}).items() for c in L if not c['v']])
print('wonders no blurb:', [k for k, L in out['Architecture'].items() if not L[0]['b']])
