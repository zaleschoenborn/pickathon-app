#!/usr/bin/env python3
"""Build the Places round 1 sources.
   Speed step 2 (Nov 22 2026): Places no longer sits inside index.html. places.css and places.js are written to pages/places.css and
   pages/places.js and load on demand (the first neighborhood or Places page; a prefetch starts a few seconds after the first screen).
   index.html keeps only a small stub, <script id="pk-places-stub"> plus <style id="pk-places-ld">, right after the Home round 2 script.
   (map data: tools/home_r2/hoods_home.json, the same shapes and photo picks as Home)
   Safe to run again.
   Run: python3 tools/places_r1/build.py"""
import os, re, sys, json
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()
def put(s, tag, id_, body, after):
    if ('</' + tag) in body.lower(): sys.exit('source must not contain a closing %s tag' % tag)
    new = '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    m = re.search(after, s, re.S)
    if not m: sys.exit('no place for ' + id_)
    return s[:m.end()] + '\n' + new + s[m.end():]
HH = json.dumps(json.load(open(os.path.join(ROOT, 'tools/home_r2/hoods_home.json'), encoding='utf-8')), ensure_ascii=False, separators=(',', ':'))
J = lambda f: json.dumps(json.load(open(os.path.join(D, f), encoding='utf-8')), ensure_ascii=False, separators=(',', ':'))
js = rd('places.js').replace('/*@HOODS_HOME*/null', HH).replace('/*@XP_HOME*/null', J('xp_home.json')).replace('/*@XP_MINE*/null', J('xp_manifest.json')).replace('/*@XP_WORDS*/null', J('xp_words.json')).replace('/*@BY_WORDS*/null', J('by_words.json')).replace('/*@MAP_ICONS*/null', J('map_icons.json')).replace('/*@NAME_BOXES*/null', J('name_boxes.json')).replace('/*@NAME_PATHS*/null', J('name_paths.json')).replace('/*@AMEN_ICONS*/null', J('amen_icons.json'))
os.makedirs(os.path.join(ROOT, 'pages'), exist_ok=True)
open(os.path.join(ROOT, 'pages', 'places.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(ROOT, 'pages', 'places.css'), 'w', encoding='utf-8').write(rd('places.css'))
# drop the old inline blocks, then put the stub in their place
for tag, id_ in (('style', 'pk-places-css'), ('script', 'pk-places')):
    s = re.sub(r'<%s id="%s">.*?</%s>\n?' % (tag, id_, tag), '', s, count=1, flags=re.S)
s = put(s, 'style', 'pk-places-ld', rd('stub.css'), r'<script id="pk-home2">.*?</script>')
s = put(s, 'script', 'pk-places-stub', rd('stub.js'), r'<style id="pk-places-ld">.*?</style>')
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s), 'pages/places.js', len(js))
