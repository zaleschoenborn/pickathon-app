#!/usr/bin/env python3
"""Splice the Places round 1 sources into index.html.
   places.css -> <style id="pk-places-css">   places.js -> <script id="pk-places">  (map data: tools/home_r2/hoods_home.json, the same shapes and photo picks as Home)
   Only these two blocks are touched; they go right after the Home round 2 script. Safe to run again.
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
s = put(s, 'style', 'pk-places-css', rd('places.css'), r'<script id="pk-home2">.*?</script>')
s = put(s, 'script', 'pk-places', rd('places.js').replace('/*@HOODS_HOME*/null', HH), r'<style id="pk-places-css">.*?</style>')
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
