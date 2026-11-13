#!/usr/bin/env python3
"""Splice Plan your trip round 2, the More sheet and the short footer into index.html.
   pl2.css -> <style id="pk-plan2-css">   pl2.js -> <script id="pk-plan2">   (appended at the end of index.html the first time)
   It also makes six small shared edits once, each found by an exact anchor, so a fresh merge can be rebuilt by running this again:
     1. OLD.plan  (?old=plan keeps the old Plan your trip page)
     2. PLAN2     (route 'info' draws the new page, except at ?old=plan and in festival season)
     3. r.plan2 / r.info flags for the template
     4. the page island   <div id="pl2" data-pk-own>        just before the old Plan your trip template
     5. the footer island <div id="pl2-foot" data-pk-own>   just before the old <footer> (CSS hides the old one while the new one has content)
     6. deskBack: no desktop "Back" box above the new page
   Run from anywhere: python3 tools/plan_r2/build.py   (safe to run again; it replaces what it put in)"""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D)); IDX = os.path.join(ROOT, 'index.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
s = open(IDX, encoding='utf-8').read()

def block(tag, id_, body): return '<%s id="%s">\n%s\n</%s>' % (tag, id_, body.strip('\n'), tag)
def put(s, tag, id_, body):
    if tag == 'script' and '</script' in body.lower(): sys.exit('source must not contain a closing script tag')
    pat = re.compile(r'<%s id="%s">.*?</%s>' % (tag, id_, tag), re.S)
    new = block(tag, id_, body)
    if pat.search(s): return pat.sub(lambda m: new, s, count=1)
    return s.rstrip('\n') + '\n' + new + '\n'
def hook(s, done, anchor, new, name):
    if done in s: return s
    if s.count(anchor) != 1: sys.exit('shared hook "%s": anchor found %d times' % (name, s.count(anchor)))
    return s.replace(anchor, new, 1)

s = hook(s, "plan: /\\bplan\\b/.test(OLDQ)",
         "watch: /\\bwatch\\b/.test(OLDQ) };",
         "watch: /\\bwatch\\b/.test(OLDQ), plan: /\\bplan\\b/.test(OLDQ) };", 'OLD.plan')
s = hook(s, "var PLAN2 =",
         "var TIX2 = R === 'tickets' && !OLD.tickets && SEA !== 'fest' && !st.tixList;",
         "var TIX2 = R === 'tickets' && !OLD.tickets && SEA !== 'fest' && !st.tixList; var PLAN2 = R === 'info' && !OLD.plan && SEA !== 'fest';   // Plan your trip round 2 (script pk-plan2 draws it; tools/plan_r2). The old page stays at ?old=plan and in festival season.",
         'PLAN2')
s = hook(s, "plan2: PLAN2",
         "info: R === 'info', tickets: R === 'tickets',",
         "info: R === 'info' && !PLAN2, plan2: PLAN2, tickets: R === 'tickets',", 'r.plan2')
s = hook(s, 'id="pl2"',
         '<sc-if value="{{r.info}}" hint-placeholder-val="{{false}}">',
         '<sc-if value="{{r.plan2}}" hint-placeholder-val="{{false}}"><div id="pl2" class="pl2" data-pk-own="1"></div></sc-if>\n<sc-if value="{{r.info}}" hint-placeholder-val="{{false}}">', 'page island')
s = hook(s, 'id="pl2-foot"',
         '<footer style="background: #0C0F0A;',
         '<div id="pl2-foot" class="pl2" data-pk-own="1"></div><footer style="background: #0C0F0A;', 'footer island')

s = hook(s, "!TIX2 && !PLAN2,",
         "R !== 'home' && R !== 'past' && R !== 'artist' && R !== 'act' && !TIX2,",
         "R !== 'home' && R !== 'past' && R !== 'artist' && R !== 'act' && !TIX2 && !PLAN2,", 'deskBack')   # no "Back to home" box on the new page (the design has none)
# Plan your trip in time order (Nov 13): step addresses #/plan/arrive etc., and old info pages redirect to their step
s = hook(s, "if (r === 'info' && e.step)",
         "    if (r === 'page') return '#/page/' + encodeURIComponent(e.p || '');",
         "    if (r === 'info' && e.step) return '#/plan/' + encodeURIComponent(e.step) + (e.c ? '/' + encodeURIComponent(e.c) : '');\n    if (r === 'page') return '#/page/' + encodeURIComponent(e.p || '');", 'step address')
s = hook(s, "if (k === 'plan' && v)",
         "    if (k === 'page' && v) return { r: 'page', x: { p: v } };",
         "    if (k === 'plan' && v) { var pv = v.split('/'); return { r: 'info', x: pv[1] ? { step: pv[0], c: pv[1] } : { step: pv[0] } }; }\n    if (k === 'page' && v && window.pkTripRedirect && v in window.pkTripRedirect) { var rd = window.pkTripRedirect[v].split(':'); return rd[0] === 'tickets' ? { r: 'tickets', x: {} } : { r: 'info', x: rd[0] ? (rd[1] ? { step: rd[0], c: rd[1] } : { step: rd[0] }) : {} }; }\n    if (k === 'page' && v) return { r: 'page', x: { p: v } };", 'step route + old addresses')
s = hook(s, "pkTripRedirect[extra.p]",
         "    this._navT = Date.now();\n    if (r === 'lineup' && extra && extra.arch)",
         "    this._navT = Date.now();\n    if (r === 'page' && extra && window.pkTripRedirect && extra.p in window.pkTripRedirect) { var rdP = window.pkTripRedirect[extra.p].split(':'); if (rdP[0] === 'tickets') { r = 'tickets'; extra = undefined; } else { r = 'info'; extra = rdP[0] ? (rdP[1] ? { step: rdP[0], c: rdP[1] } : { step: rdP[0] }) : undefined; } }   // Plan your trip in time order: old info pages open their step\n    if (r === 'lineup' && extra && extra.arch)", 'old pages redirect')
s = put(s, 'style', 'pk-plan2-css', rd('pl2.css'))
s = put(s, 'script', 'pk-plan2', rd('pl2.js'))
open(IDX, 'w', encoding='utf-8').write(s)
print('index.html', len(s))
