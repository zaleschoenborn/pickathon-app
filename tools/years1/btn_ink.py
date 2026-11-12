#!/usr/bin/env python3
"""Years package (Gate 2 design 2, Nov 12 2026): on a past year's paper the primary button keeps the ink2 border and an 18%
   warm tint, but ink2 text on that tint measured 3.6-4.3:1. yearBrand[y].btnInk = ink2 darkened toward black in 10% steps
   until it reaches 4.5:1 on the tinted fill (paper with 18% warm over it). Safe to run again. Usage: python3 tools/years1/btn_ink.py"""
import json, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
def rgb(h): h = h.lstrip('#'); h = ''.join(c * 2 for c in h) if len(h) == 3 else h; return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
def hexc(c): return '#%02X%02X%02X' % tuple(int(round(v)) for v in c)
def lum(c):
    f = lambda v: (v / 255) / 12.92 if v / 255 <= 0.03928 else ((v / 255 + 0.055) / 1.055) ** 2.4
    r, g, b = c; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def cr(a, b): la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + 0.05) / (lb + 0.05)
d = json.load(open(D, encoding='utf-8'))
for y in sorted(d['yearBrand']):
    K = d['yearBrand'][y]; P, W, I2 = rgb(K.get('paper', '#F2EDE3')), rgb(K.get('warm') or K.get('ink2') or K['ink']), rgb(K.get('ink2') or K['ink'])
    fill = [P[i] * 0.82 + W[i] * 0.18 for i in range(3)]; k = 0; c = I2
    while cr(c, fill) < 4.5 and k < 10: k += 1; c = [v * (1 - 0.1 * k) for v in I2]
    K['btnInk'] = hexc(c); print(y, 'ink2', K.get('ink2'), '->', K['btnInk'], 'darkened %d%%' % (k * 10), '%.2f:1' % cr(c, fill))
open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
