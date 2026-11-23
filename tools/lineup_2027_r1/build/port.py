#!/usr/bin/env python3
"""Port the standalone Lineup mockup into the live app (Site Build, Nov 21).

Reads tools/lineup_2027_r1/index.html (made by build.py) and writes, at the site root:
  lx/lx.css        the mockup's CSS, made safe for a shadow root (no html/body, no fonts, no mock bar)
  lx/fonts.css     @font-face for the document (Bricolage Grotesque); Pickathon 2014 is already live
  lx/s1.html       the 2027 Lineup screen
  lx/y<YYYY>.html  one file per year screen
  lx/a/<slug>.html one file per artist page
  lx/index.json    {"names": {slug: name}, "years": [...]}  (the runtime maps routes to files with it)
The screens keep their markup; only image paths, the mock chrome and the duplicate header/sale strip change.
Run:  python3 -I tools/lineup_2027_r1/build/port.py   (from the repo root)
"""
import os, re, json, shutil, html as _h

ROOT = os.getcwd()
SRC = os.path.join(ROOT, 'tools/lineup_2027_r1/index.html')
OUT = os.path.join(ROOT, 'lx')
IMG = 'tools/lineup_2027_r1/img/'          # the images stay where build.py wrote them (one copy)

s = open(SRC, encoding='utf-8').read()

# ---- CSS -------------------------------------------------------------------------------------
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
css = re.sub(r"@font-face\{[^}]*\}", '', css)                       # fonts live in the document, not the shadow root
css = css.replace(':root{', ':host{', 1)
css = re.sub(r'(^|\}|\n)html\{[^}]*\}', r'\1', css)
css = re.sub(r'(^|\}|\n)body\{[^}]*\}', r'\1:host{display:block;background:var(--ground);color:var(--cream);font-family:var(--text);font-size:16px;line-height:1.45;-webkit-font-smoothing:antialiased}', css, count=1)
css = re.sub(r'(^|(?<=[{}]))\s*\.mockbar[^{}]*\{[^}]*\}', '', css, flags=re.M)   # only rules whose selector is the mock bar (keep :not(.mockbar))                  # the mock bar and its select
css = re.sub(r'\.mb-sel[^{}]*\{[^}]*\}', '', css)
css = css.replace('.phone{', '.phone{--lxpad:0;', 1)
os.makedirs(OUT + '/a', exist_ok=True)
open(OUT + '/lx.css', 'w', encoding='utf-8').write(css)
open(OUT + '/fonts.css', 'w', encoding='utf-8').write(
    "@font-face{font-family:'Bricolage Grotesque';src:url(../fonts/bricolage-grotesque-latin-wght-normal.woff2) format('woff2');font-weight:200 800;font-display:swap}\n")
shutil.copy(os.path.join(ROOT, 'tools/lineup_2027_r1/build/fonts/bricolage-grotesque-latin-wght-normal.woff2'),
            os.path.join(ROOT, 'fonts/bricolage-grotesque-latin-wght-normal.woff2'))

# ---- screens ---------------------------------------------------------------------------------
heads = [(m.start(), m.group(1)) for m in re.finditer(r'<main id="([^"]+)" class="screen"', s)]
names, years, n_art, yrs = {}, [], 0, {}
for i, (st, sid) in enumerate(heads):
    if sid in ('s3', 's6'):                      # the two sample artist pages of the mockup (Geese, Greg Brown): real pages exist
        continue
    end = s.find('</main>', st)
    seg = s[st:end + 7]
    seg = re.sub(r'^(<main id="[^"]+" class="screen")( hidden)?', r'\1', seg)
    seg = seg.replace(' hidden', '', 0)
    seg = re.sub(r'src="img/', 'src="' + IMG, seg)
    seg = re.sub(r'url\(img/', 'url(' + IMG, seg)
    seg = re.sub(r'<div class="sale">.*?</div>(?=<)', '', seg, count=1, flags=re.S)   # the live shell has the sale strip
    raw = seg
    seg = re.sub(r'<header class="hd">.*?</header>', '', seg, count=1, flags=re.S)       # the live shell has the header (and the year picker)
    if sid == 's1':
        fn = 's1.html'
    elif re.match(r'y\d{4}$', sid):
        years.append(sid[1:]); fn = sid + '.html'
    else:
        slug = sid[2:]
        m = re.search(r'<div class="hd-t"><b>([^<]*)</b>', raw) or re.search(r'<h1>([^<]*)</h1>', raw)
        names[slug] = _h.unescape(m.group(1)) if m else slug
        ym = re.search(r'class="ah-meta">Pickathon (\d{4})', seg)
        if ym: yrs[slug] = ym.group(1)
        fn = 'a/' + slug + '.html'; n_art += 1
    open(os.path.join(OUT, fn), 'w', encoding='utf-8').write(seg)

import unicodedata
def fold(x): return re.sub('[^a-z0-9]', '', unicodedata.normalize('NFD', x.replace('ı', 'i').replace('İ', 'I').replace('ø', 'o').replace('Ø', 'O').replace('ł', 'l')).encode('ascii', 'ignore').decode().lower())
fm = {}
for sl, nm in names.items(): fm.setdefault(fold(nm), sl)
json.dump({'names': names, 'fold': fm, 'yr': yrs, 'years': sorted(years)}, open(OUT + '/index.json', 'w', encoding='utf-8'),
          ensure_ascii=False, separators=(',', ':'))
print('lx:', len(years), 'years,', n_art, 'artist pages, css', len(css) // 1024, 'KB')


# ---- runtime -----------------------------------------------------------------------------------
app = open(os.path.join(ROOT, 'tools/lineup_2027_r1/build/app.js'), encoding='utf-8').read()
a = app.index("  // r45 (Zale, Nov 22): the year reel") if "  // r45 (Zale, Nov 22): the year reel" in app else app.index("document.querySelectorAll('.poster')")   # r45 year reel rides along with the poster widgets
b = app.index("(function () {\n    var bar = document.querySelector('.bkw')")
widgets = app[a:b].replace('document.querySelectorAll', 'root.querySelectorAll').replace('document.querySelector', 'root.querySelector')
widgets = widgets.replace('document.createElement', 'document.createElement')
widgets = widgets.replace('document.addEventListener(', 'docOn(')
widgets = widgets.replace('timer = setInterval(', 'timer = ivOn(')
widgets = widgets.replace('e.target.closest(', 'lxT(e).closest(')   # r51: page-level taps see the shadow host; use the real tapped element   # reel timers stop on the next redraw
widgets = widgets.replace("root.querySelector('.pkvid')", "(document.querySelector('.pkvid') || document.querySelector('.pk-vo'))")   # the video player lives in the page, not the shadow root   # page-level listeners are dropped on the next redraw
rt = open(os.path.join(ROOT, 'tools/lineup_2027_r1/build/lx_runtime.js'), encoding='utf-8').read()
open(OUT + '/lx.js', 'w', encoding='utf-8').write(rt.replace('/*WIDGETS*/', widgets))
print('lx.js written')
