# Non-music acts on a year page (Design Studio, Nov 9 2026): Family, Comedy, Literary and DJ performers each get an artist page.
# Sources, read fresh on every build:
#   - the class table (class, magnitude) for the year,
#   - the WordPress artist posts for the year (bio, links, promo photo) and the schedule posts with their linked artists,
#     pulled read-only from wp-admin (see pickathon-wordpress-pull) into a JSON file,
#   - festival photos picked from the photo catalog (same-year rule), else the WordPress promo photo, else the designed year card.
# Writes data.json: yearBill[year] rows with f:1 (lu = lineup, c = label, l = blurb, lk = links), yearPhotos[year][act],
#   actSets[year][actkey] = [[day, HH:MM, stage, hood, show title], ...] for sets where the act was linked to a showcase.
# Usage: python3 build_nonmusic.py <year> <class_table.csv> <wp_pull.json> [festival_picks.json]
import json, csv, sys, re, os, unicodedata, urllib.request, urllib.parse
from PIL import Image, ImageOps
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
Y, CT, WP = sys.argv[1], sys.argv[2], sys.argv[3]
PICKS = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
d = json.load(open(os.path.join(SITE, 'data.json')))
W = json.load(open(WP))

def key(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^the\s+', '', s); return re.sub(r'[^a-z0-9]', '', s)
def slug(s): return key(s)[:28]

PAGE_LU = ('Family', 'Comedy', 'Literary', 'DJs')
# organisations and services that run activities rather than perform: they stay in the lineup list, with no page
NOT_ACT = {key(x) for x in ['Bridgetown Baby Family Feeding Nest', 'Cedarwood Waldorf School', 'Crafty Critters', 'Family Yoga with Shawna',
           'Friends of Noise', 'Music Together of Portland', 'My Voice Music', 'Sellwood Community House', 'Trackers Earth']}
KC = {'Legend': 'leg', 'Discovery': 'disc', 'Deep cut': 'deep'}
LSING = {'Family': 'Family', 'Comedy': 'Comedy', 'Literary': 'Literary', 'DJs': 'DJ'}

# ---- class table rows for the year ----
CL = {}; CTY = {}
for r in csv.DictReader(open(CT, encoding='utf-8-sig')):
    if (r.get('class') or '') != 'NOT AN ACT' and r['year'].isdigit(): CTY.setdefault(key(r['act']), set()).add(int(r['year']))
    if r['year'] != Y or (r.get('lineup') or '') not in PAGE_LU: continue
    try: m = float(r.get('magnitude') or 0)
    except ValueError: m = 0.0
    CL[key(r['act'])] = (r.get('class') or '', m)
def cl_of(n):
    k = key(n)
    if k in CL: return CL[k]
    for kk, v in CL.items():   # 'Imani' vs 'Imani Denae', 'Nikki Brown Clown' vs '... & Ladybug PDX'
        if kk and (kk.startswith(k) or k.startswith(kk)) and min(len(k), len(kk)) >= 5: return v
    return ('', 0.0)

# ---- the lineup names as the site lists them (yln), so the page key matches the list row ----
YL = (d.get('yln') or {}).get(Y) or {}
listed = {key(r['n']): r['n'] for L in PAGE_LU for r in (YL.get(L) or [])}
def site_name(n):
    k = key(n)
    if k in listed: return listed[k]
    for kk, nn in listed.items():
        if kk and (kk.startswith(k) or k.startswith(kk)) and min(len(k), len(kk)) >= 5: return nn
    return re.sub(r'\s*\((Host|Special)[^)]*\)\s*$', '', n).strip()
TAGS = {key(r['n']): (r.get('t') or []) for L in PAGE_LU for r in (YL.get(L) or [])}

def blurb(t, n):
    t = re.sub(r'https?://\S+', '', t or ''); t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'^' + re.escape(n.split(' (')[0]) + r'\s+Bio:\s*', '', t)
    t = re.sub(r'\s*(Website|Instagram|Facebook|Mixcloud|Bandcamp|TikTok|YouTube|Twitter)(\s*\|\s*(Website|Instagram|Facebook|Mixcloud|Bandcamp|TikTok|YouTube|Twitter))*\s*$', '', t)
    s = re.findall(r'.+?[.!?](?=\s|$)', t) or [t]
    out = ''
    for x in s:
        if len(out) + len(x) > 260 and out: break
        out = (out + ' ' + x).strip()
    return out if len(out) <= 300 else out[:299].rsplit(' ', 1)[0] + '…'

def save_photo(src, dst, local=False):
    p = os.path.join(SITE, dst)
    if os.path.exists(p): return True
    try:
        if local: im = Image.open(src)
        else:
            tmp = '/tmp/claude-0/y24np/wp/' + os.path.basename(dst)
            if not os.path.exists(tmp):
                req = urllib.request.Request(urllib.parse.quote(src, safe='/:%?=&'), headers={'User-Agent': 'pickathon-site-build'})
                b = urllib.request.urlopen(req, timeout=60).read()
                if len(b) < 2000: raise ValueError('empty download')
                open(tmp, 'wb').write(b)
            im = Image.open(tmp)
        im = ImageOps.exif_transpose(im).convert('RGB'); w, h = im.size
        tw, th = (w, int(w * 3 / 4)) if w / h < 4 / 3 else (int(h * 4 / 3), h)   # 4:3, faces sit high in portraits
        x0 = (w - tw) // 2; y0 = int((h - th) * 0.25) if h > th else 0
        im = im.crop((x0, y0, x0 + tw, y0 + th)); im.thumbnail((1200, 900)); im.save(p, quality=84, optimize=True); return True
    except Exception as e:
        print('photo failed', dst, e); return False

bill = [b for b in (d['yearBill'].get(Y) or []) if not b.get('f')]
yp = d.setdefault('yearPhotos', {}).setdefault(Y, {})
ARCH = {key(x.get('n')): x for x in (d['past'].get('deep') or [])}
rows, seen, gaps = [], set(), []
for r in W['rows']:
    if r['ln'] not in PAGE_LU: continue
    n = site_name(r['n']); k = key(n)
    if k in seen or k in NOT_ACT: continue
    seen.add(k)
    c, m = cl_of(n)
    kk = KC.get(c, 'none'); tg = TAGS.get(k) or []
    lab = LSING[r['ln']] + (' · ' + c if kk != 'none' else (' · ' + tg[0] if tg else ''))
    arch = ARCH.get(k) or {}
    line = (arch.get('l') if arch.get('t') == 'x' and arch.get('l') else '') or blurb(r.get('txt'), r['n'])
    links = [u for u in (r.get('links') or []) if u.startswith('http') and 'pickathon.com' not in u and not re.search(r'youtu', u)][:3]
    yrs = sorted({int(y0) for y0, LL in (d.get('yln') or {}).items() for L in LL.values() for q in L if key(q['n']) == k or (min(len(k), len(key(q['n']))) >= 6 and (key(q['n']).startswith(k) or k.startswith(key(q['n']))))} | CTY.get(k, set()) | {int(Y)})
    row = {'n': n, 'k': kk, 'g': '', 'm': m, 't': 4, 'c': lab, 'f': 1, 'lu': r['ln'], 'l': line, 'yrs': yrs}
    if links: row['lk'] = links
    rows.append(row)
    # ---- photo: festival pick, else the WordPress promo photo ----
    P = PICKS.get(n)
    if P and save_photo(P['src'], 'i/y%sn-%s.jpg' % (Y[2:], slug(n)), local=True):
        yp[n] = {'i': 'i/y%sn-%s.jpg' % (Y[2:], slug(n)), 's': P.get('stage', ''), 'ph': P.get('credit', '')}
    elif r.get('img'):
        full = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', r['img'])
        if save_photo(full, 'i/y%sn-%s.jpg' % (Y[2:], slug(n))):
            yp[n] = {'i': 'i/y%sn-%s.jpg' % (Y[2:], slug(n)), 's': '', 'ph': '', 'promo': 1}
    if n not in yp: gaps.append((r['ln'], n, 'no photo: designed year card'))
    if not line: gaps.append((r['ln'], n, 'no blurb'))
d['yearBill'][Y] = bill + rows

# ---- sets: schedule posts carry the linked artists, so showcase acts get their real times ----
idn = {x['id']: site_name(x['n']) for x in W['rows']}; idn.update(W.get('music') or {})
DAYS = {'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun', 'Monday': 'Mon'}
PS = (d.get('pastSched') or {}).get(Y) or []
hood_of = {}
for p in PS: hood_of.setdefault(p[2].lower(), p[3])
AS = {}
for s in W['sched']:
    ids = re.findall(r'\d+', s.get('art') or '')
    m0 = re.match(r'(\w+) @ (\d+):(\d+)(am|pm)', s.get('start') or '')
    if not ids or not m0: continue
    h = int(m0.group(2)) % 12 + (12 if m0.group(4) == 'pm' else 0)
    day = DAYS.get(m0.group(1), m0.group(1)[:3])
    if h < 5: day = {'Fri': 'Thu', 'Sat': 'Fri', 'Sun': 'Sat', 'Mon': 'Sun'}.get(day, day)   # after midnight belongs to the night before
    row = [day, '%02d:%s' % (h, m0.group(3)), s.get('stage') or '', hood_of.get((s.get('stage') or '').lower(), ''), s['t']]
    for i in ids:
        n = idn.get(i)
        if not n or key(n) == key(s['t']): continue
        L = AS.setdefault(key(n), [])
        if row not in L: L.append(row)
d.setdefault('actSets', {})[Y] = AS
json.dump(d, open(os.path.join(SITE, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(Y, 'pages', len(rows), Counter(r['lu'] for r in rows), 'photos', sum(1 for r in rows if r['n'] in yp), 'showcase links', len(AS))
for g in gaps: print('GAP', *g)
