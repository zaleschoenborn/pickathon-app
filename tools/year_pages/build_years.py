# Year pages, one rule for every year 1999-2026 (Design Studio, Nov 9 2026; year_page.md).
# Fills data.json yearBrand, yearBill and yearReel for every year that lacks a hand-curated version,
# so every year page renders the 2024 template: the year band, the tour reel, the story, the lineup.
# Curated years (a hand-made yearTour / yearReel / yearBill) are never overwritten.
# Usage: python3 tools/year_pages/build_years.py <class_table.csv>
import json, csv, sys, re, unicodedata, os
SITE = os.path.join(os.path.dirname(__file__), '..', '..')
D = os.path.join(SITE, 'data.json')
CT = sys.argv[1]
KIT = json.load(open(os.path.join(SITE, 'tools/climb_ladder/kit.json')))
d = json.load(open(D))

def key(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^the\s+', '', s)
    return re.sub(r'[^a-z0-9]', '', s)

def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + 0.05) / (lb + 0.05)
def darken(h, k):
    h = h.lstrip('#'); return '#' + ''.join('%02X' % int(int(h[i:i + 2], 16) * k) for i in (0, 2, 4))

# ---- the settled top of each lineup (top_of_lineup_by_year.md, with class_changes_nov9.md) ----
PIN = {'1999': ['Holy Modal Rounders'], '2000': ['Kelly Joe Phelps'], '2001': ['Kevin Burke & Casey Neill'], '2002': ['Kevin Burke'],
       '2003': ['Otis Taylor'], '2004': ['Danny Barnes Collective'], '2005': ['Freakwater'], '2006': ['The Avett Brothers'],
       '2007': ['The Avett Brothers'], '2008': ['Trampled by Turtles'], '2009': ['Alvin Youngblood Hart'], '2010': ['Bonnie "Prince" Billy'],
       '2011': ['Mavis Staples'], '2012': ['The War on Drugs'], '2013': ['Sturgill Simpson'], '2014': ['Courtney Barnett'],
       '2015': ['Billy Strings'], '2016': ['Beach House'], '2017': ['Big Thief'], '2018': ['Black Pumas'], '2019': ['Tyler Childers'],
       '2022': ['Wet Leg'], '2023': ['Wednesday'], '2024': ['Geese'], '2025': ['Taj Mahal'], '2026': ['Steve Earle']}

# ---- class table ----
CL = {}
for r in csv.DictReader(open(CT, encoding='utf-8-sig')):
    if (r.get('merged_into') or '').strip() and key(r['merged_into']) != key(r['act']):
        continue  # merged rows show under their canonical act
    try: m = float(r.get('magnitude') or 0)
    except ValueError: m = 0.0
    CL[(r['year'], key(r['act']))] = {'c': r.get('class') or '', 'conf': r.get('confidence') or '', 'm': m, 'lu': r.get('lineup') or 'Music'}
KC = {'Legend': 'leg', 'Discovery': 'disc', 'Deep cut': 'deep'}
CONF = {'high': 3, 'medium-high': 2.5, 'medium': 2, 'low-medium': 1.5, 'low': 1}

# ---- what the site already knows about each act (photo, line, genre) ----
ARCH = {}
for x in (d['past'].get('deep') or []) + (d.get('deepcuts') or []):
    k = key(x.get('n'))
    a = ARCH.setdefault(k, {})
    a.setdefault('g', x.get('g') or '')
    a.setdefault('l', x.get('l') or x.get('line') or '')
    a.setdefault('i', x.get('pi') or x.get('i') or '')
for n, P in (d.get('legpi') or {}).items():
    a = ARCH.setdefault(key(n), {}); a.setdefault('i', P.get('i', ''))
for n, u in (d.get('photoOf') or {}).items():
    a = ARCH.setdefault(key(n), {})
    if not a.get('i'): a['i'] = u
GL = {'indie': 'Indie rock', 'folk': 'Folk', 'country': 'Country', 'bluegrass': 'Bluegrass', 'soul': 'Soul', 'global': 'Global', 'punk': 'Punk',
      'jazz': 'Jazz', 'psych': 'Psych', 'americana': 'Americana', 'blues': 'Blues', 'hiphop': 'Hip-hop', 'electronic': 'Electronic', 'experimental': 'Experimental'}

def first_sentence(t, n=150):
    t = re.sub(r'\s+', ' ', str(t or '')).strip()
    if not t: return ''
    m = re.match(r'(.+?[.!?])(\s|$)', t)
    s = m.group(1) if m else t
    return s if len(s) <= n else s[:n - 1].rsplit(' ', 1)[0] + '…'

YEARS = [str(y) for y in range(1999, 2027) if y not in (2020, 2021)]
report = []
d.setdefault('yearBrand', {}); d.setdefault('yearBill', {}); d.setdefault('yearReel', {})
for y in YEARS:
    yr = next((q for q in d['past']['years'] if q['y'] == y), None)
    names = (yr.get('all') or yr.get('names') or []) if yr else []
    # ---- the bill: every music act on our list for the year, ranked by the class table ----
    if y not in d['yearBill']:
        rows, seen = [], set()
        for n in names:
            k = key(n)
            if not k or k in seen: continue
            seen.add(k)
            c = CL.get((y, k), {})
            if c.get('lu') not in (None, '', 'Music'): continue
            rows.append({'n': n, 'k': KC.get(c.get('c'), 'none'), 'g': (ARCH.get(k) or {}).get('g', ''), 'm': c.get('m', 0.0), '_c': CONF.get(c.get('conf'), 0)})
        top = [key(p) for p in PIN.get(y, [])]
        def rank(r):
            k = key(r['n']); pin = top.index(k) if k in top else 99
            band = 0 if r['k'] in ('leg', 'disc') else 1 if r['k'] == 'deep' else 2
            return (pin, band, -r['m'], -r['_c'], r['n'].lower())
        rows.sort(key=rank)
        for i, r in enumerate(rows):
            r['t'] = 1 if i < 4 else 2 if i < 12 else 3 if i < 32 else 4
            del r['_c']
        if rows: d['yearBill'][y] = rows
    # ---- the year band: badge, ink, accents and dates from the year's kit ----
    if y not in d['yearBrand']:
        cl = (d.get('climb') or {}).get(y) or {}; K = KIT.get(y) or {}
        inks = cl.get('inks') or ['#2B2628', '#2B2628']; paper = cl.get('paper') or '#F2EDE3'
        band = inks[0]
        while contrast(band, '#F2EDE3') < 4.5: band = darken(band, 0.88)
        warm = K.get('head') or inks[1]; light = K.get('light') or paper
        dates = cl.get('dates') or K.get('dates') or ''
        if dates and int(y) >= 2006 and 'Pendarvis' not in dates: dates += ' · Pendarvis Farm'
        dates = dates.replace(' - ', '–').replace('-', '–', 1) if re.search(r'\d-\d', dates) else dates
        badge = 'i/y%s-year-badge.svg' % y[2:]
        if os.path.exists(os.path.join(SITE, badge)):
            d['yearBrand'][y] = {'badge': badge, 'band': band, 'warm': warm, 'light': light, 'stripe': [warm, light, inks[1], paper], 'dates': dates.replace('-', '–')}
    # ---- the tour reel: the year's best acts that have a photo on the site ----
    if y not in (d.get('yearTour') or {}) and y not in d['yearReel']:
        reel = []
        for r in d['yearBill'].get(y, []):
            a = ARCH.get(key(r['n'])) or {}
            if not a.get('i') or not os.path.exists(os.path.join(SITE, a['i'])): continue
            kind = {'leg': 'Legend', 'disc': 'Discovery', 'deep': 'Deep cut'}.get(r['k'], '')
            gl = GL.get(r.get('g') or a.get('g') or '', '')
            reel.append({'i': a['i'], 'n': r['n'], 'k': ' · '.join(x for x in (kind, gl) if x), 'l': first_sentence(a.get('l')), 's': ''})
            if len(reel) >= 8: break
        if len(reel) >= 3: d['yearReel'][y] = reel
    B = d['yearBill'].get(y, [])
    report.append('%s bill %3d (top %s) brand %s reel %s' % (y, len(B), B[0]['n'] if B else '-', 'y' if y in d['yearBrand'] else '-',
                  len((d.get('yearTour') or {}).get(y) or d['yearReel'].get(y) or [])))
json.dump(d, open(D, 'w'), ensure_ascii=False, separators=(',', ':'))
print('\n'.join(report))
