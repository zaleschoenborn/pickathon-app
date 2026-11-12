#!/usr/bin/env python3
"""Founder rule (Nov 11 2026): no critic scores, show or tour counts, or crowd numbers on the site.
Re-applies the copy team's rewrites (scores_map.json) to data.json: any string value equal to an 'old' becomes its 'new'.
Run after any importer (class_import/run.py and story_import/run.py call it), so a rebuild can't bring the numbers back."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); DJ = os.path.join(HERE, '..', '..', 'data.json')
M = {e['old']: e['new'] for e in json.load(open(os.path.join(HERE, 'scores_map.json')))}
d = json.load(open(DJ)); n = [0]
def walk(o):
    if isinstance(o, dict): return {k: walk(v) for k, v in o.items()}
    if isinstance(o, list): return [walk(v) for v in o]
    if isinstance(o, str) and o in M: n[0] += 1; return M[o]
    return o
d = walk(d)
json.dump(d, open(DJ, 'w'), ensure_ascii=False, separators=(',', ':'))
print('copy rules: %d strings rewritten' % n[0])
