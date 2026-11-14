#!/usr/bin/env python3
"""Splice the Nov 13 QA fixes into index.html: one style block, pk-qafix-css, appended at the end.
   Run: python3 tools/qa_fix_nov13/build.py   (safe to run again; replaces its own block)"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); IDX = os.path.join(os.path.dirname(os.path.dirname(D)), 'index.html')
s = open(IDX, encoding='utf-8').read()
body = open(os.path.join(D, 'qa.css'), encoding='utf-8').read().strip('\n')
if '</style' in body.lower(): sys.exit('source must not contain a closing style tag')
new = '<style id="pk-qafix-css">\n%s\n</style>' % body
pat = re.compile(r'<style id="pk-qafix-css">.*?</style>', re.S)
s = pat.sub(lambda m: new, s, count=1) if pat.search(s) else s.rstrip('\n') + '\n' + new + '\n'
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
