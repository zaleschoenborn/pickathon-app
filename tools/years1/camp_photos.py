#!/usr/bin/env python3
"""Years package item 6 (Nov 12 2026): camp pages were thin (a hero and a card). Each camp now carries a short photo strip,
   'Around <camp>', from the photo director's Nov 11 preview picks (round35/hoodphotos/picks.csv, score 7+, files already on the
   site, the page hero left out). Writes hoods[<camp>].cg = [{i, by, y}]. Safe to run again. Usage: python3 tools/years1/camp_photos.py"""
import json, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
CG = {
  'welcomelot': [('i/p773.jpg', 'Rob Kerr', '2026'), ('i/r3-hood-welcomelot.jpg', '', ''), ('i/p494.jpg', 'Rob Kerr', '2024'), ('i/pk-welcomelot-05.jpg', 'Rob Kerr', '')],
  'lushcamp': [('i/r3-home-lushcamp.jpg', '', ''), ('i/r3b-hood-lushcamp-1.jpg', 'Norm Eder', ''), ('i/pk-lushcamp-04.jpg', 'Mark Stein', ''), ('i/r3b-hood-lushcamp-2.jpg', 'Brooke Hoyer', '')],
  'southcamp': [('i/r3-hood-southcamp.jpg', '', ''), ('i/r3b-hood-southcamp-1.jpg', 'Brooke Hoyer', '')],
  'wildcamp': [('i/pk-wildcamp-09.jpg', 'Norm Eder', ''), ('i/p446.jpg', '', '2025'), ('i/r3b-hood-wildcamp-1.jpg', 'Miri Stebivka', ''), ('i/pk-wildcamp-08.jpg', 'Mark Stein', '')],
  'willowcamp': [('i/r3b-hood-willowcamp-1.jpg', 'Liz Devine', '')],
}
d = json.load(open(D, encoding='utf-8'))
for h, L in CG.items():
    H = d['hoods'][h]; L = [x for x in L if os.path.exists(os.path.join(SITE, x[0])) and x[0] not in (H.get('hi'), H.get('i'))]
    H['cg'] = [{'i': i, 'by': by, 'y': y} for i, by, y in L]
    print(h, len(H['cg']))
open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
