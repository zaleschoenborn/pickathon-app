#!/usr/bin/env python3
"""Years package item 6 (Nov 12 2026): one tile per act on a year page.
   The art review found three acts listed twice on their year's bill. The second listing is merged into the act:
     2008 'Bad Livers (reunion)' -> 'Bad Livers' (the 2008 set was billed as a reunion; one act)
     2011 'Thao' -> 'Thao & The Get Down Stay Down' (the same band; the schedule's Sunday 'Thao' set links to it)
     2003 'Tye North' -> 'Danny Barnes & Tye North' (North played Pickathon 2003 as Danny Barnes's duo partner)
   Removes the duplicate from yearBill, yearRatings, yearStory acts/scenes and past.years names/all, and adds an actAlias
   so schedule rows under the old name still link to the act. Safe to run again. Usage: python3 tools/years1/dedupe_bill.py"""
import json, os, re, unicodedata
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
MERGE = [('2008', 'Bad Livers (reunion)', 'Bad Livers'), ('2011', 'Thao', 'Thao & The Get Down Stay Down'), ('2003', 'Tye North', 'Danny Barnes & Tye North')]
def nk(s): s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower(); s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
raw = open(D, encoding='utf-8').read(); d = json.loads(raw); n = 0
for y, dup, keep in MERGE:
    B = d.get('yearBill', {}).get(y, [])
    if any(b.get('n') == dup for b in B) and any(b.get('n') == keep for b in B):
        d['yearBill'][y] = [b for b in B if b.get('n') != dup]; n += 1
    R = (d.get('yearRatings', {}).get(y) or {})
    if R.get('acts'): R['acts'] = [a for a in R['acts'] if a.get('n') != dup]
    S = (d.get('yearStory', {}).get(y) or {})
    if S.get('acts'): S['acts'] = [a for a in S['acts'] if a.get('n') != dup]
    for sc in S.get('scenes') or []:
        if sc.get('acts'): sc['acts'] = [a for a in sc['acts'] if a != dup]
    for Y in (d.get('past') or {}).get('years') or []:
        if Y.get('y') == y:
            for f in ('names', 'all'):
                if Y.get(f): Y[f] = [a for a in Y[f] if a != dup]
    d.setdefault('actAlias', {})[nk(dup)] = nk(keep)
out = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
open(D, 'w', encoding='utf-8').write(out)
print('merged', n, 'bill entries; data.json', len(out))
