#!/usr/bin/env python3
"""Years package item 8 (Nov 12 2026): the 2025 desktop hero (the reel's first slide) was a near-black, black-and-white
   Greensky Bluegrass frame. Portugal. The Man's 2025 Paddock photo (Graeme Harrison: confetti, lights, a packed crowd with
   hands up) is already the reel's second slide; it now leads, Greensky follows. Same year, same acts, no new copy.
   Safe to run again. Usage: python3 tools/years1/reel_2025_lead.py"""
import json, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
d = json.load(open(D, encoding='utf-8')); R = d['yearReel']['2025']
lead = [s for s in R if s.get('n') == 'Portugal. The Man']
if lead and R[0].get('n') != 'Portugal. The Man':
    d['yearReel']['2025'] = lead + [s for s in R if s.get('n') != 'Portugal. The Man']
    open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
print([s['n'] for s in d['yearReel']['2025']][:3])
