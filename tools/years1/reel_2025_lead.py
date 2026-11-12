#!/usr/bin/env python3
"""Years package (Gate 2 L3, Nov 12 2026): the 2025 desktop hero (the reel's first slide) was a near-black, black-and-white
   Greensky Bluegrass frame. The lead must be an act on the 2025 lineup list (past.years[2025].all); Portugal. The Man is on the
   year bill but not the lineup list, so it no longer leads (and stays where it was, second).
   Lead: Cory Hanson, Windmill 2025 (Brooke Hoyer): daylight in the firs, the guitarist mid-move on the monitor, a full crowd,
   no kids up front. Slide copy is the site's existing archive line for him; class from the 2025 bill. No new copy.
   Safe to run again. Usage: python3 tools/years1/reel_2025_lead.py"""
import json, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
d = json.load(open(D, encoding='utf-8')); R = d['yearReel']['2025']; LEAD = 'Cory Hanson'
lineup = next((Y.get('all') or [] for Y in d['past']['years'] if Y.get('y') == '2025'), [])
assert LEAD in lineup, 'lead must be on the 2025 lineup list'
# undo the Nov 12 order (Portugal first): Greensky Bluegrass, then Portugal. The Man, as built
if [s['n'] for s in R[:2]] == ['Portugal. The Man', 'Greensky Bluegrass']: R[0], R[1] = R[1], R[0]
if not any(s.get('n') == LEAD for s in R):
    P = d['yearPhotos']['2025'][LEAD]; b = next(x for x in d['yearBill']['2025'] if x['n'] == LEAD)
    line = next((x.get('l') or x.get('line') for x in (d['past'].get('deep') or []) + (d.get('deepcuts') or []) + (d.get('archCT') or []) if x and x.get('n') == LEAD and (x.get('l') or x.get('line'))), '')
    K = {'leg': 'Legend', 'disc': 'Discovery', 'deep': 'Deep cut'}.get(b.get('k'), '')
    assert P.get('i') and not P.get('promo') and line and K
    R.insert(0, {'i': P['i'], 'n': LEAD, 'k': K, 'l': line, 's': ''})
elif R[0].get('n') != LEAD: R.insert(0, R.pop(next(i for i, s in enumerate(R) if s.get('n') == LEAD)))
open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
print([(s['n'], s['k']) for s in d['yearReel']['2025']][:4])
