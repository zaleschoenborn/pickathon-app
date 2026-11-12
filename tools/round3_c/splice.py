#!/usr/bin/env python3
"""Splice the Round 3 batch C/E sources into index.html (safe to run again; it replaces what it put in).
   route.js            -> <script id="pk-route-js">   right before <script id="pk-tm-js"> (it must load before the app)
   r3c.css + r3c.js    -> <style id="pk-r3c-css"> and <script id="pk-r3c-js">, right after the pk-r3d-js script (the year wall and Share)
   Run from anywhere: python3 tools/round3_c/splice.py"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read().strip('\n')
s = open(IDX, encoding='utf-8').read()
for f in ('route.js', 'r3c.js'):
    if os.path.exists(os.path.join(D, f)) and '</script' in rd(f).lower(): sys.exit(f + ' must not contain a closing script tag')
def put(s, tag, id_, body, at):
    new = '<%s id="%s">\n%s\n</%s>' % (tag, id_, body, tag)
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    i = at(s); return s[:i] + new + '\n' + s[i:]
s = put(s, 'script', 'pk-route-js', rd('route.js'), lambda s: s.index('<script id="pk-tm-js">'))
def after_r3d(s):
    a = s.index('<script id="pk-r3d-js">'); return s.index('</script>', a) + len('</script>\n')
if os.path.exists(os.path.join(D, 'r3c.js')):
    s = put(s, 'style', 'pk-r3c-css', rd('r3c.css'), after_r3d)
    s = put(s, 'script', 'pk-r3c-js', rd('r3c.js'), lambda s: s.index('</style>', s.index('<style id="pk-r3c-css">')) + len('</style>\n'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
