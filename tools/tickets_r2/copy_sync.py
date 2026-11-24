"""Tickets card words from Copy Review's live files (Zale, Nov 24: Tickets must always use the latest copy).
Copy the CSVs from Dropbox _catalogs/work/copy_review/ into tools/tickets_r2/copy/, run this, then build.py.
Sources, applied in order: summer_camp_cards_nov24_draft2 + changes + changes2; Wonders = newest year per place from
wonders_cards_nov24_draft1, 2025_2026, 2025_rest, 2026_rest, then changes3; Music lines = music_row_lines_nov24_draft1.
Held (Copy Review / Home, Nov 24): Archery (no photo), Massage in the Woods (program not confirmed)."""
import csv, json, re, os, sys
D = os.path.join(os.path.dirname(__file__), 'copy'); P = os.path.join(os.path.dirname(__file__), 'tk2.js')
rd = lambda f: list(csv.DictReader(open(os.path.join(D, f), encoding='utf-8-sig')))
HOLD = {'Archery and Adventure Games', 'Massage in the Woods'}
cards = rd('summer_camp_cards_nov24_draft2.csv'); REN = {}
for chf in ['summer_camp_cards_changes_nov24_draft1.csv', 'summer_camp_cards_changes2_nov24_draft1.csv']:
    for c in rd(chf):
        same = [x for x in cards if x['experience'] == c['experience'] and x['place_key'] == c['place_key']]
        rep = re.search(r'replaces ([^:;]+)', c.get('basis', '') or '')
        hit = [x for x in same if x['title'] == c['title']] or ([x for x in same if x['title'] == rep.group(1).strip()] if rep else []) or [x for x in same if c['title'].split()[0] in x['title']]
        if hit:
            if hit[0]['title'] != c['title']: REN[hit[0]['title']] = c['title']
            hit[0]['title'], hit[0]['blurb'] = c['title'], c['blurb']
        else: print('change not matched:', c['title'])
XCT = {}
for c in cards:
    if c['title'] in HOLD: continue
    XCT.setdefault(c['experience'], {}).setdefault(c['place_key'], []).append([c['title'], c['blurb']])
W = {}
for f in ['wonders_cards_nov24_draft1.csv', 'wonders_cards_2025_2026_nov24_draft1.csv', 'wonders_cards_2025_rest_nov24_draft1.csv', 'wonders_cards_2026_rest_nov24_draft1.csv', 'wonders_cards_changes3_nov24_draft1.csv']:
    for r in rd(f):
        k, y = r['place_key'], int(r['year'])
        if k not in W or y >= W[k][2]: W[k] = [r['title'], r['blurb'], y]
XWD = {k: [v[0], v[1], str(v[2])] for k, v in W.items()}
XML = {(r['act'] + '|' + r['year']): r['line'] for r in rd('music_row_lines_nov24_draft1.csv')}
s = open(P, encoding='utf-8').read()
s, n1 = re.subn(r'(var XCT = \(window\.pkXc && window\.pkXc\.XCT\) \|\| )\{.*?\}(, XCP = )', lambda m: m.group(1) + json.dumps(XCT, ensure_ascii=False) + m.group(2), s, count=1, flags=re.S)
s, n2 = re.subn(r'(XWD = )\{.*?\}(;\n)', lambda m: m.group(1) + json.dumps(XWD, ensure_ascii=False) + ', XML = ' + json.dumps(XML, ensure_ascii=False) + m.group(2), s, count=1, flags=re.S)
if 'XML = ' in s and n2 == 0: s, n2 = re.subn(r'(XWD = )\{.*?\}, XML = \{.*?\}(;\n)', lambda m: m.group(1) + json.dumps(XWD, ensure_ascii=False) + ', XML = ' + json.dumps(XML, ensure_ascii=False) + m.group(2), s, count=1, flags=re.S)
assert n1 == 1 and n2 == 1, (n1, n2)
m = re.search(r'XCP = \(window\.pkXc && window\.pkXc\.XCP\) \|\| (\{.*?\}), XWD', s, flags=re.S)
if m:
    xcp = json.loads(m.group(1))
    for a, b in REN.items():
        if a in xcp and b not in xcp: xcp[b] = xcp[a]
    s = s[:m.start(1)] + json.dumps(xcp, ensure_ascii=False) + s[m.end(1):]
print('renamed', REN)
open(P, 'w', encoding='utf-8').write(s)
print('cards', sum(len(v) for e in XCT.values() for v in e.values()), 'wonders', len(XWD), 'music lines', len(XML))
