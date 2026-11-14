#!/usr/bin/env python3
"""Splice Build with Pickathon, round 1 (Nov 13 2026) into index.html.
   bd.css -> <style id="pk-build1-css">   bd.js -> <script id="pk-build1">
   Shared edit, made once: the old r.build template block becomes the page island <div id="bd1" data-pk-own>.
   The old out.bp code in the renderer is left in place (unused) so other threads' line anchors don't move.
   Safe to run again. Run: python3 tools/build_r1/data.py && python3 tools/build_r1/build.py"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); IDX = os.path.join(os.path.dirname(os.path.dirname(D)), 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()
def put(s, tag, id_, body):
    if tag == 'script' and '</script' in body.lower(): sys.exit('no closing script tag in source')
    new = '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    return pat.sub(lambda m: new, s, count=1) if pat.search(s) else s.rstrip('\n') + '\n' + new + '\n'
ISL = '<sc-if value="{{r.build}}" hint-placeholder-val="{{false}}"><div id="bd1" class="pl2 bd1" data-pk-own="1"></div></sc-if>'
if 'id="bd1"' not in s:
    a = '<sc-if value="{{r.build}}" hint-placeholder-val="{{false}}">\n<section style="{{bp.heroStyle}}">'
    b = '\n</sc-if>\n\n<sc-if value="{{r.account}}"'
    i = s.find(a); j = s.find(b, i)
    if s.count(a) != 1 or j < 0: sys.exit('old build block not found once')
    s = s[:i] + ISL + s[j + len('\n</sc-if>'):]
s = put(s, 'style', 'pk-build1-css', rd('bd.css'))
s = put(s, 'script', 'pk-build1', rd('bd.js'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
