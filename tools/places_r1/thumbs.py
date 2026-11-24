# Small square thumbnails for the experience menu (Zale, Nov 22: menu first, bigger tiles).
# One per place per experience: the first photo in xp_manifest.json, cropped at its object-position.
import json, os, re
from PIL import Image
R = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(R, '..', '..'))
m = json.load(open(os.path.join(R, 'xp_manifest.json')))
srcs = set()
for k, v in m.get('arch', {}).items():
    if v: srcs.add((v[0]['f'], v[0].get('p', '50% 50%')))
for e, places in m.get('xp', {}).items():
    for k, v in places.items():
        if v: srcs.add((v[0]['f'], v[0].get('p', '50% 50%')))
hx = json.load(open(os.path.join(R, 'xp_home.json'))).get('XPH', {})
for e, places in hx.items():
    for k, v in places.items():
        v = v if isinstance(v, list) else [v]
        if v: z = v[0]; srcs.add((z, '50% 50%') if isinstance(z, str) else (z['i'], z.get('p', '50% 50%')))
cj = os.path.join(R, 'cards.json')   # Nov 24: the Farm's rows show the first card's photo (Home's photos)
if os.path.exists(cj):
    for e, places in json.load(open(cj)).items():
        for k, v in places.items():
            if v: srcs.add((v[0]['i'], v[0].get('p', '50% 50%')))
os.makedirs(os.path.join(ROOT, 'i', 'th'), exist_ok=True)
S = 192; n = 0
for f, p in sorted(srcs):
    fp = os.path.join(ROOT, f.split('?')[0])
    out = os.path.join(ROOT, 'i', 'th', re.sub(r'\.\w+$', '', os.path.basename(fp)) + '.webp')
    if not os.path.exists(fp) or os.path.exists(out): continue
    im = Image.open(fp).convert('RGB'); w, h = im.size; s = min(w, h)
    nums = [float(x) for x in re.findall(r'[\d.]+', p or '')] or [50, 50]; px, py = (nums + [50])[:2]
    x0 = round((w - s) * px / 100); y0 = round((h - s) * py / 100)
    im.crop((x0, y0, x0 + s, y0 + s)).resize((S, S), Image.LANCZOS).save(out, 'WEBP', quality=72); n += 1
print(n, 'thumbs;', len(srcs), 'sources')
