#!/usr/bin/env python3
"""Splice the way-finder into index.html.
   way.css -> <style id="pk-way-css">   way.js -> <script id="pk-way">
   Run from anywhere: python3 tools/wayfinder/build.py   (safe to run again; it replaces only its own two blocks,
   and adds them at the end of the file the first time, after every app script, so window.__render exists)."""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()
def block(tag, id_, body): return '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
def put(s, tag, id_, body):
    if tag == 'script' and '</script' in body.lower(): sys.exit('source must not contain a closing script tag')
    if tag == 'style' and '</style' in body.lower(): sys.exit('source must not contain a closing style tag')
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    new = block(tag, id_, body)
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    return s.rstrip('\n') + '\n' + new + '\n'
s = put(s, 'style', 'pk-way-css', rd('way.css'))
s = put(s, 'script', 'pk-way', rd('way.js'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
