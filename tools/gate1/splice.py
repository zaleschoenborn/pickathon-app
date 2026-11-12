#!/usr/bin/env python3
"""Splice the Gate 1 fix sources into index.html (safe to run again; it replaces what it put in).
   g1.css -> <style id="pk-g1-css">, g1.js -> <script id="pk-g1-js">, both at the very end of index.html so they load last.
   Selectors use P = html body:not(#g1 x20) so they outrank the older #root#root... and :root:root... chains.
   Run from anywhere: python3 tools/gate1/splice.py"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
P = 'html body:not(' + '#g1' * 20 + ')'
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read().strip('\n')
s = open(IDX, encoding='utf-8').read()
css = rd('g1.css').replace('$P', P); js = rd('g1.js')
if '</style' in css.lower() or '</script' in js.lower(): sys.exit('sources must not contain closing tags')
def put(s, tag, id_, body):
    new = '<%s id="%s">\n%s\n</%s>' % (tag, id_, body, tag)
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    return s.rstrip('\n') + '\n' + new + '\n'
s = put(s, 'style', 'pk-g1-css', css)
s = put(s, 'script', 'pk-g1-js', js)
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
