#!/usr/bin/env python3
"""Splice the Home round 2 sources into index.html.
   home2.css -> <style id="pk-home2-css">   home2.js -> <script id="pk-home2">
   Only these two blocks are touched; the first run puts them right after the Checkout script (they must load after the app and after pk-tk2).
   Run from anywhere: python3 tools/home_r2/build.py   (safe to run again; it replaces what it put in)"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()
def block(tag, id_, body): return '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
def put(s, tag, id_, body, after=None):
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    if tag == 'script' and '</script' in body.lower(): sys.exit('source must not contain a closing script tag')
    if tag == 'style' and '</style' in body.lower(): sys.exit('source must not contain a closing style tag')
    new = block(tag, id_, body)
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    m = re.search(after, s, re.S) if after else None
    if not m: sys.exit('no place for ' + id_)
    return s[:m.end()] + '\n' + new + s[m.end():]
s = put(s, 'style', 'pk-home2-css', rd('home2.css'), after=r'<script id="pk-checkout">.*?</script>')
s = put(s, 'script', 'pk-home2', rd('home2.js'), after=r'<style id="pk-home2-css">.*?</style>')
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
