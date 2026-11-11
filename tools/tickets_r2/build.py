#!/usr/bin/env python3
"""Splice the Tickets round 2 sources into index.html.
   tk2.css + tk2.js  -> <style id="pk-tk2-css"> and <script id="pk-tk2">  (the Tickets page)
   co2.css + co2.js  -> <style id="pk-co-css">  and <script id="pk-checkout"> (the Checkout page), when those files exist
   Run from anywhere: python3 tools/tickets_r2/build.py   (safe to run again; it replaces what it put in)"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()
def block(tag, id_, body): return '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
def put(s, tag, id_, body, before=None):
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    new = block(tag, id_, body)
    if '</script' in body.lower() and tag == 'script': sys.exit('source must not contain a closing script tag')
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    if before and before in s: return s.replace(before, new + '\n' + before, 1)
    sys.exit('no place for ' + id_)
s = put(s, 'style', 'pk-tk2-css', rd('tk2.css'), before='<style id="pk-co-css">')
s = put(s, 'script', 'pk-tk2', rd('tk2.js'), before='<style id="pk-co-css">')
if os.path.exists(os.path.join(D, 'co2.js')):
    s = put(s, 'style', 'pk-co-css', rd('co2.css'))
    s = put(s, 'script', 'pk-checkout', rd('co2.js'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
