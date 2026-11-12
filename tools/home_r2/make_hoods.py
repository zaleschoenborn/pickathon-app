#!/usr/bin/env python3
"""Build tools/home_r2/hoods_home.json for the Home neighborhoods card (Round 3.5 hybrid): the farm map's outline shapes and pin points
   (copied from the data block inside farmmap/index.html, so the map file stays the one source) plus each neighborhood's preview photo set
   (the photo director's picks.csv, preview.<id>.<n> rows, lead first). Also writes farmmap/home-map.webp, a 640px-wide copy of map.webp.
   Run: python3 tools/home_r2/make_hoods.py [picks.csv]   then python3 tools/home_r2/build.py"""
import json, csv, os, sys, shutil
D0 = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D0))
PICKS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/flow/round35/hoodphotos/picks.csv'
FILES = os.path.join(os.path.dirname(PICKS), 'files')
SKIP = {'r35-coyote-3.jpg'}   # a child up front (lead, Nov 11)
s = open(os.path.join(ROOT, 'farmmap/index.html'), encoding='utf-8').read(); i = s.find('const D=') + 8
M, _ = json.JSONDecoder().raw_decode(s[i:])
out = {'size': M['size'], 'shapes': {k: v['d'] for k, v in M['shapes'].items()}, 'pts': {h['id']: h['p'] for h in M['hoods']}, 'prev': {}}
rows = [r for r in csv.DictReader(open(PICKS, encoding='utf-8')) if r['slot'].startswith('preview.')]
for r in sorted(rows, key=lambda r: (r['slot'].split('.')[1], int(r['slot'].split('.')[2]))):
    h = r['slot'].split('.')[1]; f = r['new_file'].strip()
    if not f or f.startswith('(') or f in SKIP: continue
    if f.startswith('r35-'):
        dst = os.path.join(ROOT, 'i', f)
        if not os.path.exists(dst): shutil.copyfile(os.path.join(FILES, f), dst)
        f = 'i/' + f
    if not os.path.exists(os.path.join(ROOT, f)): print('missing', f); continue
    x, y = r['crop_focus_x'] or '50', r['crop_focus_y'] or '50'
    out['prev'].setdefault(h, []).append({'i': f, 'p': '%s%% %s%%' % (x, y), 'by': (r['photographer'] or '').replace('Pickathon', '').strip(), 'y': r['year'] or ''})
json.dump(out, open(os.path.join(D0, 'hoods_home.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from PIL import Image
im = Image.open(os.path.join(ROOT, 'farmmap/map.webp')); w, h = im.size; im.resize((640, round(640 * h / w)), Image.LANCZOS).save(os.path.join(ROOT, 'farmmap/home-map.webp'), quality=72, method=6)
print('hoods', len(out['prev']), 'photos', sum(len(v) for v in out['prev'].values()), 'json', os.path.getsize(os.path.join(D0, 'hoods_home.json')), 'map', os.path.getsize(os.path.join(ROOT, 'farmmap/home-map.webp')))
