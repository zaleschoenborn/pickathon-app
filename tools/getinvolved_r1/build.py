#!/usr/bin/env python3
"""Splice the Get involved door (build 1, Nov 24 2026) into index.html.
   getinvolved.json -> <script id="pk-gi1-data"> (fallback until data.json has getInvolved)
   gi.css -> <style id="pk-gi1-css">   gi.js -> <script id="pk-gi1">
   Shared edits, each found by an exact anchor and made once (same shape as tools/about_r1/build.py):
     1. route 'getinv' at #/get-involved (NAMED / NAMED2)   2. r.getinv flag   3. the page island <div id="gi1">   4. header title 'Get involved'
   Safe to run again. Run: python3 tools/getinvolved_r1/build.py"""
import os, re, sys, json
D = os.path.dirname(os.path.abspath(__file__)); IDX = os.path.join(os.path.dirname(os.path.dirname(D)), 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()
def put(s, tag, id_, body):
    if tag == 'script' and '</script' in body.lower(): sys.exit('no closing script tag in source')
    new = '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    return pat.sub(lambda m: new, s, count=1) if pat.search(s) else s.rstrip('\n') + '\n' + new + '\n'
def hook(s, done, anchor, new, name):
    if done in s: return s
    if s.count(anchor) != 1: sys.exit('hook "%s": anchor found %d times' % (name, s.count(anchor)))
    return s.replace(anchor, new, 1)
s = hook(s, "getinv: 'get-involved'", "aboutus: 'about-us' }, NAMED2 = { 'about-us': 'aboutus',",
         "aboutus: 'about-us', getinv: 'get-involved' }, NAMED2 = { 'get-involved': 'getinv', 'about-us': 'aboutus',", 'route')
s = hook(s, "getinv: R === 'getinv'", "aboutus: R === 'aboutus', presents: R === 'presents',",
         "aboutus: R === 'aboutus', getinv: R === 'getinv', presents: R === 'presents',", 'r.getinv')
s = hook(s, 'id="gi1"', '<sc-if value="{{r.plan2}}" hint-placeholder-val="{{false}}">',
         '<sc-if value="{{r.getinv}}" hint-placeholder-val="{{false}}"><div id="gi1" data-pk-own="1"></div></sc-if>\n<sc-if value="{{r.plan2}}" hint-placeholder-val="{{false}}">', 'island')
s = hook(s, "getinv: 'Get involved'", "aboutus: 'About Pickathon', why: 'Why Pickathon',",
         "aboutus: 'About Pickathon', getinv: 'Get involved', why: 'Why Pickathon',", 'header title')
s = put(s, 'style', 'pk-gi1-css', rd('gi.css'))
s = put(s, 'script', 'pk-gi1-data', 'window.__pkGetInvolved = ' + json.dumps(json.loads(rd('getinvolved.json')), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';')
s = put(s, 'script', 'pk-gi1', rd('gi.js'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
