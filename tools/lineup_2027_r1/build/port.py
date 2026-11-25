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
# Site Build, Nov 24 (Zale's review): the artist photo was too short and the words sat mid-photo. Taller photo, words in the lower part, play button centered in the photo above the words.
css += """
main[id^="a-"] .hact{height:clamp(700px,calc(100vh - 100px),820px)}
main[id^="a-"] .hact .hero-tx{padding-bottom:74px}
main[id^="a-"] .hact .ring.lg,.hact .ring.lg{left:50%;top:42%;transform:translate(-50%,-50%)}
@media (min-width:1000px){main[id^="a-"] .hact{height:clamp(660px,calc(100vh - 140px),760px)}main[id^="a-"] .hact .hero-tx{padding-bottom:90px}main[id^="a-"] .hact .ring.lg{top:40%}}
"""
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
    seg = re.sub(r'("img": ")img/', lambda m: m.group(1) + IMG, seg)   # the 2027 archive widget's card data (inline script) 
    seg = re.sub(r'(&quot;i&quot;: &quot;)img/', lambda m: m.group(1) + IMG, seg)   # the year reel's data-slides JSON (frames after the first 404ed without this)
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

# ---- artist photo position (Site Build, Nov 24; Zale: edit images to position optimally) --------------
# The artist photo is now tall on phones and the words sit in its lower part. Find the biggest face (OpenCV Haar, front then profile),
# put it at the horizontal middle on a phone and in the upper third on a wide screen. One object-position serves both: a landscape photo
# has horizontal slack in a tall box and vertical slack in a wide box. No face found: the build's own position stays.
try:
    import cv2
    _cd = os.environ.get('PK_CASCADES') or cv2.data.haarcascades
    _cas = [cv2.CascadeClassifier(_cd + 'haarcascade_frontalface_default.xml'), cv2.CascadeClassifier(_cd + 'haarcascade_profileface.xml')]
    _n = _f = 0
    for fn in sorted(os.listdir(OUT + '/a')):
        fp = os.path.join(OUT, 'a', fn)
        h = open(fp, encoding='utf-8').read()
        m = re.search(r'(<section class="hero hact"><img src=")([^"]+)(" alt="" style="object-position:)([^"]*)(")', h)
        if not m: continue
        _n += 1
        im = cv2.imread(os.path.join(ROOT, m.group(2)))
        if im is None: continue
        H, W = im.shape[:2]
        sc = 900.0 / max(W, H); g = cv2.cvtColor(cv2.resize(im, (int(W * sc), int(H * sc))) if sc < 1 else im, cv2.COLOR_BGR2GRAY); g = cv2.equalizeHist(g)
        gh, gw = g.shape[:2]; best = None
        for ci, c in enumerate(_cas):
            for gg, flip in ((g, False), (cv2.flip(g, 1), True)) if ci else ((g, False),):
                for (x, y, w, hh) in c.detectMultiScale(gg, 1.1, 6, minSize=(int(gw * .035), int(gw * .035))):
                    cx = (gw - (x + w / 2.0)) if flip else (x + w / 2.0)
                    if best is None or w > best[2]: best = (cx, y + hh / 2.0, w)
            if best: break
        if not best: continue
        fx, fy = best[0] / gw, best[1] / gh
        # phone box 390x744 (cover): scaled width = (W/H)*744
        sw = (W / float(H)) * 744.0; slack = sw - 390.0
        px = 50.0 if slack <= 0 else max(0.0, min(100.0, (fx * sw - 195.0) / slack * 100.0))
        # wide box 1200x700: scaled height = (H/W)*1200; face center at 32% of the box
        shh = (H / float(W)) * 1200.0; vs = shh - 700.0
        py = 40.0 if vs <= 0 else max(0.0, min(100.0, (fy * shh - 0.32 * 700.0) / vs * 100.0))
        h = h[:m.start(4)] + '%d%% %d%%' % (round(px), round(py)) + h[m.end(4):]
        open(fp, 'w', encoding='utf-8').write(h); _f += 1
    print('artist photo position: faces found on', _f, 'of', _n)
except ImportError:
    print('artist photo position: OpenCV missing, kept the build positions')
