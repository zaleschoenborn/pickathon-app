#!/usr/bin/env python3
"""Years package (Gate 2 design 1, Nov 12 2026): 1999 had no yearBrand kit, so its story card fell back to cream and its
   'Read the 1999 story' button was cream on cream. 1999 is type only (Zale, Nov 11): one ink on cream paper, no emblem.
   Adds yearBrand['1999'] = one ink on cream. Safe to run again. Usage: python3 tools/years1/kit_1999.py"""
import json, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
d = json.load(open(D, encoding='utf-8'))
K = d['yearBrand'].get('1999') or {}
K.update({'paper': '#F2EDE3', 'ink': '#2B2628', 'ink2': '#2B2628', 'band': '#2B2628', 'warm': '#2B2628', 'light': '#F2EDE3', 'stripe': ['#2B2628'], 'dates': K.get('dates', '')})
d['yearBrand']['1999'] = K
open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
print('1999', K)
