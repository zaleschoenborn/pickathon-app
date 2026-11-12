#!/usr/bin/env python3
"""Stamp one build number into the files a returning visitor's phone compares (Round 3.5 QC cache fix, Nov 11 2026).
   python3 tools/stamp_build.py 5191            (today's date, Pacific)
   python3 tools/stamp_build.py 5191 20261112   (a given date)
   python3 tools/stamp_build.py 5191 --root DIR (stamp a copy of the site in DIR instead of this checkout)
   Writes:
     index.html   window.__pkBuild='YYYYMMDD-NNNN'  and  focus.js?v=NNNN
     sw.js        line 1 "// Pickathon service worker. Build YYYYMMDD-NNNN", const V='pk-YYYYMMDD-NNNN', SHELL focus.js?v=NNNN
     version.json {"build":NNNN,"stamp":"YYYYMMDD-NNNN","v":"pk-YYYYMMDD-NNNN"}   (the page fetches it with cache:'no-store'; the service worker never caches it)
   Run it as the last step before every deploy. Safe to run again."""
import datetime, json, os, re, sys

args = [a for a in sys.argv[1:]]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if '--root' in args:
    i = args.index('--root'); root = os.path.abspath(args[i + 1]); del args[i:i + 2]
if not args or not re.fullmatch(r'\d{3,6}', args[0]): sys.exit(__doc__)
n = int(args[0])
if len(args) > 1:
    day = args[1]
    if not re.fullmatch(r'20\d{6}', day): sys.exit('date must be YYYYMMDD')
else:
    day = (datetime.datetime.utcnow() - datetime.timedelta(hours=8)).strftime('%Y%m%d')
stamp = '%s-%04d' % (day, n); V = 'pk-' + stamp

def sub1(s, pat, rep, what):
    s2, k = re.subn(pat, rep, s, count=1)
    if k != 1: sys.exit('stamp_build: could not find ' + what)
    return s2

p = os.path.join(root, 'index.html'); s = open(p, encoding='utf-8').read()
s = sub1(s, r"window\.__pkBuild='[^']*'", "window.__pkBuild='%s'" % stamp, '__pkBuild in index.html')
s = sub1(s, r'src="focus\.js(\?v=[^"]*)?"', 'src="focus.js?v=%d"' % n, 'focus.js script tag in index.html')
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(root, 'sw.js'); s = open(p, encoding='utf-8').read()
s = sub1(s, r'^// Pickathon service worker\. Build [0-9-]+', '// Pickathon service worker. Build ' + stamp, 'line-1 build comment in sw.js')
s = sub1(s, r"const V='[^']*'", "const V='%s'" % V, "const V in sw.js")
s = sub1(s, r"'focus\.js(\?v=[^']*)?'", "'focus.js?v=%d'" % n, 'focus.js in the sw.js SHELL list')
open(p, 'w', encoding='utf-8').write(s)

open(os.path.join(root, 'version.json'), 'w', encoding='utf-8').write(json.dumps({'build': n, 'stamp': stamp, 'v': V}, separators=(',', ':')) + '\n')
print('stamped', stamp, 'in', root)
