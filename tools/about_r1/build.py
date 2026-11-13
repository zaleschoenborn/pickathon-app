#!/usr/bin/env python3
"""Splice the About hub (draft 1, Nov 13 2026) into index.html.
   ab.css -> <style id="pk-about1-css">   ab.js -> <script id="pk-about1">
   Shared edits, each found by an exact anchor and made once:
     1. route 'aboutus' at #/about-us (NAMED / NAMED2)
     2. r.aboutus flag for the template
     3. the page island <div id="ab1"> just before Plan's island
     4. the header title 'About Pickathon', and no sitewide closing card (its build card would repeat the hub's)
   Safe to run again. Run: python3 tools/about_r1/build.py"""
import os, re, sys
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
s = hook(s, "aboutus: 'about-us'",
         "var NAMED = { info: 'plan', hoods: 'neighborhoods' }, NAMED2 = { plan: 'info',",
         "var NAMED = { info: 'plan', hoods: 'neighborhoods', aboutus: 'about-us' }, NAMED2 = { 'about-us': 'aboutus', plan: 'info',", 'route')
s = hook(s, "aboutus: R === 'aboutus'",
         "about: R === 'about', why: R === 'why',",
         "about: R === 'about', aboutus: R === 'aboutus', why: R === 'why',", 'r.aboutus')
s = hook(s, 'id="ab1"',
         '<sc-if value="{{r.plan2}}" hint-placeholder-val="{{false}}">',
         '<sc-if value="{{r.aboutus}}" hint-placeholder-val="{{false}}"><div id="ab1" class="pl2 ab1" data-pk-own="1"></div></sc-if>\n<sc-if value="{{r.plan2}}" hint-placeholder-val="{{false}}">', 'island')
s = hook(s, "aboutus: 'About Pickathon'",
         "about: 'Our story', why: 'Why Pickathon',",
         "about: 'Our story', aboutus: 'About Pickathon', why: 'Why Pickathon',", 'header title')
s = hook(s, "press: 1, about: 1, aboutus: 1 }",
         "var skip = { tickets: 1, account: 1, build: 1, search: 1, why: 1, hood: 1, hoods: 1, past: 1, partners: 1, press: 1, about: 1 };",
         "var skip = { tickets: 1, account: 1, build: 1, search: 1, why: 1, hood: 1, hoods: 1, past: 1, partners: 1, press: 1, about: 1, aboutus: 1 };", 'no closing card')
s = put(s, 'style', 'pk-about1-css', rd('ab.css'))
s = put(s, 'script', 'pk-about1', rd('ab.js'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
