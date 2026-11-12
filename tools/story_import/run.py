#!/usr/bin/env python3
"""Story companion (Artist Classification, keyed by year and act) -> data.json storyFacts. Nov 11 2026.
   Usage: python3 tools/story_import/run.py <Story_companion_*.csv>
   Keeps only lines marked _safe True. Each act-year gets {wb, pk, lp, ab, q} (when booked, peak, latest positive, acclaim before,
   quote), each as [text, strength, source], plus hand: 1 when the row came from a hand-researched story pack (rows filled from
   concert and acclaim data are drafts until the class team hand-checks them; the site shows only hand rows for now).
   Data only: no page reads it yet."""
import csv, json, os, sys
SITE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')); DJ = os.path.join(SITE, 'data.json')
F = {'wb': 'when_booked', 'pk': 'peak_moment', 'lp': 'latest_positive', 'ab': 'acclaim_before', 'q': 'quote'}
d = json.load(open(DJ)); out = {}; n = 0
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')):
    e = {}
    for k, c in F.items():
        t = (r.get(c) or '').strip()
        if t and (r.get(c + '_safe') or '').strip().lower() == 'true':
            try: s = float(r.get(c + '_strength') or 0)
            except ValueError: s = 0
            e[k] = [t, s, (r.get(c + '_source') or '').strip()]
    if not e: continue
    e['hand'] = 1 if 'hand-researched' in (r.get('filled_from') or '') else 0
    out.setdefault(r['year'], {})[r['act']] = e; n += 1
d['storyFacts'] = out
json.dump(d, open(DJ, 'w'), ensure_ascii=False, separators=(',', ':'))
print('storyFacts:', n, 'act-years;', sum(v['hand'] for y in out.values() for v in y.values()), 'hand-researched')

# Founder rule (Nov 11): scores and show counts never come back through an import
import subprocess as _sp, sys as _sys, os as _os
_sp.run([_sys.executable, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'copy_rules', 'apply.py')], check=True)
