import shutil
import json, base64, io, os, html
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__)) + '/'
REPO = os.path.abspath(ROOT + '../../../') + '/'
APP = os.environ.get('PK_APP', REPO)
if not APP.endswith('/'): APP += '/'
LOGOS = os.path.abspath(ROOT + '../art/logos_nov20') + '/'   # Artwork's final year logos (site_ready_nov20), used until Site Build puts them in i/
d = json.load(open(APP + 'data.json'))
d['yearLogo']['2024'] = 'i/y24-logo.webp'  # Artwork site_ready_nov20
# 2026 reel override (Nov 20): planned order, hashes from Video Catalog (Projects: requests_from_video_catalog.md)
_bill26 = {x['n']: x for x in d['yearBill']['2026']}
_old26 = {x['n']: x for x in d['yearReel']['2026']}
def _r(n, v, sg, img=None, k=None, l=None):
    o = _old26.get(n, {}); b = _bill26.get(n, {})
    return {'i': o.get('i') or img, 'n': n, 'k': o.get('k') or k or '', 'l': o.get('l', '') if l is None else l, 'v': v, 'sg': sg, 's': ''}
d['yearReel']['2026'] = [
    _r('Shakey Graves', 'https://vimeo.com/1245618981/afde1d24f0#t=66s', 'Slab Sessions'),
    _r('Clinton Fearon', 'https://vimeo.com/1245301525/4ec4515abc#t=13s', 'Vision · Edge'),
    _r('Mercury', 'https://vimeo.com/1245564929/7f8804efef', 'Pumphouse', 'i/y26b-mercury.jpg', '', ''),
    _r('The Brothers Comatose', 'https://vimeo.com/1245294472/c9d8505b93#t=27s', 'Blue Mountain · Edge'),
    _r('Acid King', 'https://vimeo.com/1245599737/13ac40e56a#t=14s', 'Slab Sessions'),
    _r('D.K. Harrell', 'https://vimeo.com/1245303026/05fd8141e3', 'Edge', 'i/y26b-dkharrell.jpg', '', ''),
    _r('Terror/Cactus', 'https://vimeo.com/1245571982/62d4730022', 'Pumphouse', 'i/y26b-terrorcactus.jpg', '', ''),
    _r('El Khat', 'https://vimeo.com/1245308321/c6c011b8dc#t=44s', 'DjAdja · Edge'),
    _r('Ben Chapman', 'https://vimeo.com/1245552924/0368ffcfba#t=23s', 'Pumphouse'),
    _r('Hudson Freeman', 'https://vimeo.com/1245605099/1bf662799d', 'Slab Sessions', 'i/y26b-hudsonfreeman.jpg', '', ''),
]
_cache = {}

# ---------- live class table (v159) + extra photos from the photo catalog ----------
import csv, re as _re
def _n(x):
    x = x.lower().replace('&', 'and').strip()
    if x.startswith('the '): x = x[4:]
    return _re.sub(r'[^a-z0-9]', '', x)
_CT = os.environ.get('PK_CLASS_TABLE', ROOT + 'class_table_v163.csv')  # copy of live v163 (Dropbox server_modified 2026-11-21 19:15Z); pointer CLASS_TABLE_CURRENT.txt names v159
_IDX = {(_n(r['act']), r['year']): r for r in csv.DictReader(open(_CT, encoding='utf-8-sig'))}
_M = {'Discovery': 'disc', 'Legend': 'leg', 'Deep cut': 'deep'}
_ALIAS = {'2mangentlemanband': 'twomangentlemenband', '79ersgang': '79rsgang', 'billystringsdonjulin': 'billystrings',
          'bonnieprincebillythecairogang': 'bonnieprincebilly', 'brownoutbrownsabbath': 'brownoutpresentsbrownsabbath',
          'brucemolskyband': 'brucemolsky', 'deryayildirim': 'deryayldrm', 'destroyersolo': 'destroyer',
          'hungermtboys': 'hungermountainboys', 'johndoethesadies': 'sadies', 'kurtviletheviolators': 'kurtvile',
          'laurielewistomrozumandtomsauber': 'laurielewis', 'leefieldstheexpressions': 'leefields',
          'thequebesistersband': 'quebesisters', 'tysegallthemuggers': 'tysegall', 'whiteymorgan': 'whiteymorganthe78s',
          'darolangerscottnygaard': 'darolanger',
          # Lineup's act join (Nov 20 13:19 note): same act, page already in the build
          'michaelnau': 'cottonjones', 'sethandmay': 'daisymaysethbernard', 'kevinburke': 'kevinburkecaseyneill',
          'caseyneill': 'kevinburkecaseyneill', 'cahalenmorrisoncountryhammer': 'cahalenmorrisoneliwest',
          # r21: name variants of the pages above (Lineup's Nov 20 join)
          'altingn': 'altngn', 'calebklauderband': 'calebklauder', 'calebklaudercountryband': 'calebklauder', 'calebreeb': 'calebklauderreebwillms',
          'lostbayouramblersftgordongano': 'lostbayouramblers'}

# ---------- every year matches Lineup By Year (Zale, Nov 21): the live lineup decides who is on each year ----------
# Copy of the live file: build/lineup_115b.json (draft 115b, CURRENT.md CONFIRMED by Lineup Nov 20). Re-copy when Lineup posts a new draft.
import unicodedata as _ud
def _fold(x):
    x = _ud.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower().replace('&', 'and').strip()
    if x.startswith('the '): x = x[4:]
    return _re.sub(r'[^a-z0-9]', '', x)
def _ak(x):
    k = _re.sub('[^a-z0-9]', '', x.lower()); k = _ALIAS.get(k, k)
    return k[3:] if k.startswith('the') and len(k) > 5 else k
_LUB = json.load(open(ROOT + 'lineup_115b.json', encoding='utf-8'))['rows']
_CATC = {'DJs': 'DJ'}
# held until Lineup rules (design_lineup_artist-24): each looks like the same act as another row that year, so adding it would print the act twice
_HOLD = {('2006', 'C.J. Chenier'), ('2006', 'juanita family'), ('2008', 'Darol Anger and Scott Law'), ('2009', 'John Doe'),
         ('2014', 'Cahalen Morrison'), ('2014', 'Leroy Thomas'), ('2016', 'Myke Bogan and Blossom')}
ROSTER_LOG = {'added': [], 'dropped': [], 'renamed': [], 'held': []}
RENAMED = []
_CTG = {(_n(r['act']), r['year']): (r.get('genre_primary') or '').strip().lower() for r in csv.DictReader(open(_CT, encoding='utf-8-sig'))}
for _y in sorted(d['yearBill']):
    _L = [r for r in _LUB if r['year'] == _y and r['kind'] == 'act']
    if not _L: continue
    _bill = d['yearBill'][_y]; _used = set(); _keep = {}; _add = []
    for _r in _L:
        _m = next((_i for _i, _b in enumerate(_bill) if _i not in _used and _fold(_b['n']) == _fold(_r['act'])), None)  # exact spelling first
        if _m is None:
            _m = next((_i for _i, _b in enumerate(_bill) if _i not in _used and _ak(_b['n']) == _ak(_r['act'])), None)  # then billing aliases
        if _m is not None:
            _used.add(_m); _b = _bill[_m]
            if _b['n'] != _r['act']:
                # spelling differs from Lineup (accents, 'and' vs '&', billing name): logged, not renamed here,
                # because page ids, photos and clips are keyed on the site's spelling. Fix at the source (Lineup / data.json).
                ROSTER_LOG['renamed'].append((_y, _b['n'], _r['act']))
            _keep[_m] = _b
        elif (_y, _r['act']) in _HOLD or any(_fold(_x['n']) == _fold(_r['act']) for _x in _add):
            ROSTER_LOG['held'].append((_y, _r['act']))
        else:
            _e = {'n': _r['act'], 'k': 'none', 'g': '', 'm': 0.0, 't': 4}
            if _r['lineup'] != 'Music':
                _e.update(c=_CATC.get(_r['lineup'], _r['lineup']), lu=_r['lineup'], f=1)
            else:
                _e['g'] = _CTG.get((_n(_r['act']), _y), '')
            _add.append(_e); ROSTER_LOG['added'].append((_y, _r['lineup'], _r['act']))
    ROSTER_LOG['dropped'] += [(_y, _b['n']) for _i, _b in enumerate(_bill) if _i not in _used]
    # keep the printed order of everything that stays; lineup acts the site lacked go after it
    d['yearBill'][_y] = [_keep[_i] for _i in sorted(_keep)] + _add
CLASS_CHANGED = []
for _y, _bill in d['yearBill'].items():
    for _a in _bill:
        _r = _IDX.get((_n(_a['n']), _y))
        if not _r or _a.get('c'): continue
        _music = _r.get('lineup', '').strip() == 'Music'  # Artist Classification (Nov 20): classes and magnitudes only for lineup = Music
        # TODAY model: class (= class_today) + legend_flag_today + magnitude_dec. Never class_booking.
        _k = 'leg' if _r.get('legend_flag_today', '').strip().lower() == 'yes' else _M.get(_r['class'].strip(), 'none')
        # BOOKING model: class_booking + legend_flag_booking + at_festival_magnitude_dec. Never class.
        _kb = 'leg' if _r.get('legend_flag_booking', '').strip().lower() == 'yes' else _M.get(_r['class_booking'].strip(), 'none')
        if not _music: _k = _kb = 'none'
        if _k != _a['k']: CLASS_CHANGED.append((_y, _a['n'], _a['k'], _k))
        _a['k'] = _k; _a['kb'] = _kb
        try: _a['m'] = float(_r['magnitude_dec'] or 0)
        except ValueError: pass
        try: _a['mb'] = float(_r['at_festival_magnitude_dec']) if _music and _r['at_festival_magnitude_dec'].strip() else None
        except ValueError: _a['mb'] = None
# 2026 poster order = printed poster (poster_order_by_year_1999_2026.md): ten top-tier names in that order, then everyone else in data order.
# The combined row 'Meridian Brothers, Mexican Institute of Sound' is the same two acts already listed separately: drop it so no act prints twice.
_P26 = ['Steve Earle', 'Thee Sinseers', 'Built to Spill', 'The Womack Sisters', 'Mexican Institute of Sound', 'Marcos Valle', 'The Brothers Comatose', 'Meridian Brothers', 'The Altons', 'Shakey Graves']
_b26 = [a for a in d['yearBill']['2026'] if a['n'] != 'Meridian Brothers, Mexican Institute of Sound']
_top = [next(a for a in _b26 if _n(a['n']) == _n(p)) for p in _P26 if any(_n(a['n']) == _n(p) for a in _b26)]
d['yearBill']['2026'] = _top + [a for a in _b26 if a not in _top]
# reel class labels follow the same live table (v159); Neither prints no class
_LAB = {'Discovery': 'Discovery', 'Legend': 'Legend', 'Deep cut': 'Deep cut'}
for _r26 in d['yearReel'].get('2026', []):
    _row = _IDX.get((_n(_r26['n']), '2026'))
    _lab = ('Legend' if _row.get('legend_flag_today','').strip().lower()=='yes' else _LAB.get(_row['class'].strip(), '')) if _row else ''
    _g = (_r26.get('k') or '').split(' · ')
    _genre = _g[1] if len(_g) > 1 else ''
    _r26['k'] = (_lab + (' · ' + _genre if _genre and _lab else '')) if _lab else ''
EXTF = {}
for _y, _acts in json.load(open(ROOT + 'ext_photos.json')).items():
    for _n2, _v in _acts.items():
        d['yearPhotos'].setdefault(_y, {})[_n2] = {'i': _v['i'], **({'s': _v['s']} if _v.get('s') else {})}
        EXTF[_v['i']] = _v['f']

import hashlib
OUT = os.environ.get('PK_OUT', os.path.abspath(ROOT + '..') + '/')
if not OUT.endswith('/'): OUT += '/'
os.makedirs(OUT + 'img', exist_ok=True)
def _src(path):
    if path.startswith('ext/'): return ROOT + path
    if path.startswith('i/') and os.path.exists(LOGOS + path[2:]): return LOGOS + path[2:]
    return APP + path
def img(path, w=780, q=74, fmt='JPEG'):
    key = (path, w, fmt)
    if key in _cache:
        return _cache[key]
    ext = 'png' if fmt == 'PNG' else 'jpg'
    _salt = ('|%d' % os.path.getsize(_src(path))) if str(path).startswith('ext/') else ''  # r33: a replaced ext/ file gets a fresh copy
    name = 'img/%s.%s' % (hashlib.md5(('%s|%s|%s' % key + _salt).encode()).hexdigest()[:12], ext)
    if not os.path.exists(OUT + name):
        im = Image.open(_src(path))
        if fmt == 'PNG':
            im = im.convert('RGBA'); im.thumbnail((w, w * 3)); im.save(OUT + name, 'PNG', optimize=True)
        else:
            im = im.convert('RGB'); im.thumbnail((w, w * 3)); im.save(OUT + name, 'JPEG', quality=q, optimize=True, progressive=True)
    _cache[key] = name
    return name

def b64(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())

E = html.escape
def _aslug(x):
    return _re.sub('[^a-z0-9]', '', x.lower()) if False else __import__('re').sub('[^a-z0-9]', '', x.lower())  # artist page id key (Nov 20: names open their page)
GEN = {g['id']: g['n'] for g in d['genres']}
GSHORT = {'indie': 'Indie rock', 'folk': 'Folk', 'soul': 'Soul', 'global': 'Global', 'country': 'Country',
          'bluegrass': 'Bluegrass', 'jazz': 'Jazz', 'psych': 'Psych', 'punk': 'Punk', 'hiphop': 'Hip-hop', 'experimental': 'Experimental'}
KLAB = {'disc': 'Discovery', 'leg': 'Legend', 'deep': 'Deep cut', 'none': ''}

# r42 (Zale, Nov 22): the 15-tag Music list from Artist Classification (class table genre_tags / genre_primary; first tag = primary, "|" splits,
# never split on commas). Each act has 1 to 3 tags; a picker matches ANY tag. Acts with no tag keep the old one-word genre.
TAGS15 = ['Folk & songwriters', 'Country & Americana', 'Indie rock', 'Indie pop', 'Bluegrass & string band', 'Soul, funk & R&B', 'Psychedelic & jams',
          'Electronic & experimental', 'Punk & heavy', 'Blues', 'Jazz', 'Hip-hop', 'African & global', 'Latin', 'Cajun, zydeco & brass']
_TG = {}
for _r in csv.DictReader(open(ROOT + 'class_table_v163.csv', encoding='utf-8')):
    _t = [t for t in (_r.get('genre_tags') or '').split('|') if t in TAGS15]
    if not _t: continue
    for _nm in (_r.get('act'), _r.get('lineup_act')):
        if _nm: _TG.setdefault(_aslug(_nm), _t)
def tags_of(n):
    return _TG.get(_aslug(n), [])
def gp_n(n, fb=''):  # primary tag for a name, else the old one-word genre
    t = tags_of(n); return t[0] if t else fb
def gall_n(n, fb=''):  # every tag, "|"-joined, for data-g
    t = tags_of(n); return '|'.join(t) if t else fb
def gp_a(a): return gp_n(a['n'], GSHORT.get(a.get('g'), ''))
def gall_a(a): return gall_n(a['n'], GSHORT.get(a.get('g'), ''))
def gopts(acts):  # the tags in view, most acts first, then A to Z
    c = {}
    for a in acts:
        for t in (tags_of(a['n']) or [GSHORT.get(a.get('g'), '')]):
            if t: c[t] = c.get(t, 0) + 1
    return [t for t, _ in sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))]

# ---------- data ----------
bill24 = [x for x in d['yearBill']['2024'] if x.get('g')]
yp24 = d['yearPhotos']['2024']
KORD = {'disc': 0, 'leg': 1, 'deep': 2, 'none': 3}
today24 = sorted(bill24, key=lambda x: (-(x.get('m') or 0), KORD[x['k']], x['n']))
top10 = today24[:10]
rest = today24[10:]
cnt = {k: sum(1 for x in bill24 if x['k'] == k) for k in ['disc', 'leg', 'deep', 'none']}
HASVID = {'Geese', 'Bonnie "Prince" Billy', 'Durand Jones', 'Elephant Revival', 'Adi Oasis'}
POS = {'Geese': '78% 40%', 'Courtney Barnett': '55% 30%', 'Elephant Revival': '60% 40%', 'Bonnie "Prince" Billy': '50% 45%',
       'New Constellations': '70% 40%', 'Durand Jones': '50% 30%', 'Searows': '60% 40%', 'LA LOM': '70% 45%',
       'Adi Oasis': '62% 40%', 'Jess Williamson': '45% 35%'}
TOPIMG = {'Geese': 'i/y24p-geese.jpg', 'Bonnie "Prince" Billy': 'i/y24h-bonnie.jpg'}

bill19 = [x for x in d['yearBill']['2019'] if x.get('g')]
today19 = sorted([x for x in bill19 if x['k'] != 'none'], key=lambda x: (-(x.get('m') or 0), KORD[x['k']], x['n']))

def poster_lines(acts, mode):
    """acts in display order -> list of (cls, [names]) lines in poster rhythm"""
    names = [a['n'].upper().replace('"', '”').replace(' ”', ' “', 1) if '"' in a['n'] else a['n'].upper() for a in acts]
    names = [n.replace('BONNIE ”PRINCE” BILLY', 'BONNIE “PRINCE” BILLY') for n in names]
    out = []
    out.append(('l1', names[0:1])); out.append(('l1', names[1:2]))
    out.append(('l2', names[2:3])); out.append(('l2', names[3:4]))
    i = 4
    for size, per, rows in (('l3', 2, 3), ('l4', 3, 4)):
        for _ in range(rows):
            if i >= len(names): break
            row = []; chars = 0
            lim = 30 if size == 'l3' else 44
            while i < len(names) and len(row) < per and chars + len(names[i]) <= lim:
                row.append(names[i]); chars += len(names[i]) + 3; i += 1
            if not row:
                row = [names[i]]; i += 1
            out.append((size, row))
    return out, len(names) - i

_ORIG = {}
def ctag(k):
    return KLAB.get(k, '')  # kept as a hidden data-c attribute for check_classes.py; the poster prints NO class words (Zale, Nov 20 12:25)
def poster_html(lines, tags=None):
    tags = tags or {}
    h = ''
    for cls, row in lines:
        h += '<div class="pl %s">%s</div>' % (cls, '<span class="dot">•</span>'.join('<span data-c="%s" data-art="%s" data-an="%s">%s</span>' % (tags.get(n, ''), _aslug(n), E(_ORIG.get(n, n)), E(n)) for n in row))
    return h


import html as _h
def vimeo_parts(u):
    m = _re.search(r'vimeo\.com/(?:video/)?(\d+)(?:/([0-9a-f]+))?', u or '')
    if not m: return '', ''
    t = _re.search(r'#t=(\d+)s', u or '')
    return m.group(1), (m.group(2) or '') + ('|' + t.group(1) if t else '')
def clip_ring(url, sz=''):
    """Transparent play ring (Zale, Nov 17). Carries the clip; the page's own overlay plays it embedded."""
    if not url: return ''
    return ('<span class="ring %s" data-clip="%s" role="button" tabindex="0" aria-label="Play clip">'
            '<svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" fill="#fff"/></svg></span>') % (sz, _h.escape(url, quote=True))
def reel_slides(y):
    out = []
    for r in d['yearReel'].get(y, []):
        if not r.get('i') or not loc(r['i']) or 'poster' in r['i']: continue
        g = (r.get('k') or '').split(' · ')
        out.append({'i': img(r['i'], 1100, 80), 'raw': r['i'], 'n': r['n'], 'k': g[0] if g else '', 'g': g[1] if len(g) > 1 else '',
                    'l': r.get('l', ''), 'clip': r.get('v', ''), 'sg': r.get('sg', '')})
    return out

def play(sz=''):
    return '<span class="ring %s" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" fill="#fff"/></svg></span>' % sz

# r31 (Nov 21): a play ring on a card plays a song. Best single song per act (never a full set or A Concert A Day), by views.
def _vurl(v):
    if v.get('vm'): return 'https://vimeo.com/%s%s' % (v['vm'], ('/' + v['vh']) if v.get('vh') else '')
    return 'https://www.youtube.com/watch?v=%s' % v['id'] if _re.match(r'^[A-Za-z0-9_-]{11}$', str(v.get('id', ''))) else ''
CLIPY, CLIPA = {}, {}
for _v in sorted(d['videos'], key=lambda v: -(v.get('v') or 0)):
    if _v.get('f') or _v.get('cad') or 'full set' in str(_v.get('s', '')).lower() or not _v.get('a') or not _v.get('y'): continue
    _u = _vurl(_v)
    if not _u: continue
    _kslug = ''.join(ch for ch in _ud.normalize('NFD', _v['a'].lower()) if ch.isalnum())
    CLIPY.setdefault((_kslug, str(_v['y'])), _u); CLIPA.setdefault(_kslug, _u)
# r33 (Nov 21): the Video Ledger (Video Catalog, 2,835 rows, synced to Lineup act_id) is the main source: its single songs and
# sessions (Pickathon YouTube, Vimeo with hash, KEXP, Live and Breathing) come first; full sets, podcasts, interviews, outside clips,
# password clips and flagged clips are left out when build/ledger_clips.json is written. data.json clips fill in behind it.
_LC = json.load(open(ROOT + 'ledger_clips.json', encoding='utf-8'))
def _partner(o):  # r36 (Zale, Nov 22): our own clips first, then partners (KEXP, Live & Breathing, Slab, Edge ...)
    t = (o.get('tail') or '') + ' ' + (o.get('title') or '')
    return 1 if ('KEXP' in t or 'Live & Breathing' in t or 'Live and Breathing' in t) else 0
_LC.sort(key=lambda o: (_partner(o), 0 if o['kind'] == 'song' else 1, 0 if 'youtu' in o['url'] else 1))
_LY, _LA = {}, {}
for _o in _LC:
    _u = _o['url'].split('&')[0]
    for _nm in {_o['act'], _o['artist'], _o['act_id'].replace('-', ' ')}:
        _ks = ''.join(ch for ch in _ud.normalize('NFD', _nm.lower()) if ch.isalnum())
        _LY.setdefault((_ks, str(_o['y'])), _u); _LA.setdefault(_ks, _u)
CLIPY = {**CLIPY, **_LY}; CLIPA = {**CLIPA, **_LA}
_CLIPALIAS = {'Kurt Vile & The Violators': 'Kurt Vile', 'Destroyer (solo)': 'Destroyer', 'Corrinne West & Kelly Joe Phelps': 'Corinne West & Kelly Joe Phelps',
              'Caleb Klauder Band': 'Caleb Klauder'}  # r36: the card's printed name vs the ledger's name for the same act
def clip_for(n, y=None):
    n = _CLIPALIAS.get(n, n)
    k = ''.join(ch for ch in _ud.normalize('NFD', n.lower()) if ch.isalnum())
    return CLIPY.get((k, str(y)), '') if y else CLIPA.get(k, '')

# r41 (Zale, Nov 22): an Archive card plays the act's video from the card's own year (the first year in that class); if that year has none,
# the nearest LATER year; only then an earlier year. Never the act's most-viewed clip from some other year.
def archive_clip(n, y):
    n2 = _CLIPALIAS.get(n, n)
    k = ''.join(ch for ch in _ud.normalize('NFD', n2.lower()) if ch.isalnum())
    yrs = sorted(int(yy) for (kk, yy) in CLIPY if kk == k)
    y = int(y)
    for yy in [y] + [a for a in yrs if a > y] + [a for a in reversed(yrs) if a < y]:
        u = CLIPY.get((k, str(yy)))
        if u: return u
    return ''

def photo_play(url, n):
    """r36 (Zale, Nov 22): on a card with a song, the whole photo plays it; the ring is centered and only marks it.
    The name and 'Their story' open the artist page."""
    return ('<span class="pz" data-clip="%s" role="button" tabindex="0" aria-label="Play a song by %s">'
            '<span class="ring sm"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" fill="#fff"/></svg></span></span>') % (_h.escape(url, quote=True), E(n))
def card(n, yr, k, g, src, pos='50% 40%', vid=True, cls=''):
    if vid is True: vid = (clip_for(n, yr) if yr else '') or clip_for(n)  # r31: no ring without a song to play
    g_all, g = gall_n(n, g), gp_n(n, g)  # r42: filter on every tag, print the primary
    return ('<a class="card %s" data-g="%s" data-art="%s" data-an="%s" href="#"><img src="%s" alt="" style="object-position:%s">%s<span class="cyr">%s</span>'
            '<span class="cbody"><span class="krow"><span class="k k-%s">%s</span><span class="g">%s</span></span>'
            '<span class="cname">%s</span>%s</span></a>') % (cls + (' pc' if isinstance(vid, str) and vid else ''), E(g_all), _aslug(n), E(n), src, pos, (photo_play(vid, n) if isinstance(vid, str) else play('sm')) if vid else '', yr, k, KLAB[k], E(g), E(n),
            '<span class="cstory">Their story \u2192</span>' if isinstance(vid, str) and vid else '')

# ---------- shared chrome ----------
ICON = {
 'back': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
 'note': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
 'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
 'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg>',
 'pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
 'tix': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 8h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4z"/><path d="M14 8v10" stroke-dasharray="2 2"/></svg>',
 'star': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z"/></svg>',
 'more': '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
 'share': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M8 7.5L12 3.5l4 4M5 12v7h14v-7"/></svg>',
 'caret': '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 4l4 5 4-5z" fill="currentColor"/></svg>',
 'arrow': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 'loop': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5"/></svg>',
}
LOGO = img('logo27-gold.png', 300, fmt='PNG')

def header(title, sub, back=True, chip=None):
    t = '<span class="hd-t"><b>%s</b>%s</span>' % (E(title), ('<i>%s</i>' % E(sub)) if sub else '')
    if chip:
        t = '<label class="yrchip"><span class="yc-k">Lineup</span><select class="ysel2" aria-label="Lineup year">%s</select>%s</label>' % ('<option value="s1">2027</option>' + ''.join('<option value="y%s"%s>%s</option>' % (yy, ' selected' if yy == chip else '', yy) for yy in sorted(d['yearBill'].keys(), reverse=True)), ICON['caret'])
    return ('<header class="hd">%s<img class="hd-logo" src="%s" alt="Pickathon 2027"><span class="hd-rule"></span>%s'
            '<span class="hd-sp"></span><button class="hd-listen" aria-label="Listen">%s</button><button class="hd-ic" aria-label="Search">%s</button></header>'
            '<div class="sale"><span><b>Holiday Sale</b> · from $483</span><a href="#" class="sale-b">Get tickets <svg viewBox="0 0 12 12" width="11" height="11"><path d="M4 1.5l5 4.5-5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>'
            ) % (('<button class="hd-ic" aria-label="Back">%s</button>' % ICON['back']) if back else '', LOGO, t, ICON['note'], ICON['search'])

TABBAR = ('<nav class="tabs">' + ''.join('<a href="#">%s<span>%s</span></a>' % (ICON[i], l) for i, l in
          [('home', 'Home'), ('pin', 'Places'), ('tix', 'Tickets'), ('star', 'My Pickathon'), ('more', 'More')]) + '</nav>')

def shelf(kicker, title, sub, n, cards):
    return ('<section class="shelf"><div class="sh-h"><div><p class="kick">%s</p><h2>%s</h2></div></div><p class="sub">%s</p>'
            '<div class="swipe">%s<a class="card seeall" href="#"><span class="sa-n">%s</span><span class="sa-t">See all %s %s</span></a></div></section>') % (
            kicker, title, sub, ''.join(cards), n, title.title() if title != 'BEFORE THEY WERE BIG' else 'Discoveries', ICON['arrow'])

# ---------- SCREEN 1: 2027 before the lineup ----------
P19 = d['yearBrand']['2019']
l19a, more19a = poster_lines(bill19, 'then')
l19b, more19b = poster_lines(today19, 'now')
disc = [('Sturgill Simpson', 2013, 'Country', 'i/p10043.jpg', '45% 35%'), ('The Avett Brothers', 2006, 'Folk', 'i/p9980.jpg', '18% 30%'),
        ('Tyler Childers', 2019, 'Country', 'i/p9637.jpg', '43% 50%'), ('The War on Drugs', 2012, 'Indie', 'i/p9633.jpg', '13% 50%'),
        ('Billy Strings', 2015, 'Bluegrass', 'i/r3b-billystrings-15.jpg', '50% 50%'), ('Caamp', 2019, 'Folk', 'i/p9606.jpg', '26% 50%')]
leg = [('Nathaniel Rateliff & The Night Sweats', 2019, 'Soul', 'i/pv-nathanielrateliffthenightsweats-2019.jpg', '4% 50%'),
       ('Turnpike Troubadours', 2015, 'Country', 'i/p10037.jpg', '21% 50%'), ('Feist', 2013, 'Indie', 'i/p9914.jpg', '13% 50%'),
       ('Sharon Van Etten', 2013, 'Indie', 'i/p9628.jpg', '76% 50%'), ('Beach House', 2016, 'Indie', 'i/p9901.jpg', '68% 19%')]
deep = [('Grupo Fantasma', 2011, 'Global', 'i/p9926.jpg', '53% 55%'), ('Tune-Yards', 2015, 'Indie', 'i/p9938.jpg', '85% 50%'),
        ('Black Belt Eagle Scout', 2019, 'Indie', 'i/p9703.jpg', '26% 50%'), ('Durand Jones', 2024, 'Soul', 'i/pv-durandjones-2024.jpg', '38% 50%'),
        ('Lee Fields & The Expressions', 2011, 'Soul', 'i/p9676.jpg', '40% 50%')]

def nm(a):
    n = a['n'].upper()
    return n.replace(' "', ' “').replace('"', '”')

def ten_lines(acts):
    n = [nm(a) for a in acts[:10]]
    out = [('l1', n[0:1]), ('l1', n[1:2]), ('l2', n[2:3]), ('l2', n[3:4])]
    for i in (4, 6, 8):
        pair = n[i:i + 2]
        if not pair: break
        if sum(len(x) for x in pair) > 26:
            out += [('l3', [x]) for x in pair]
        else:
            out.append(('l3', pair))
    return [o for o in out if o[1]]

def rest_lines(acts):
    n = [nm(a) for a in acts[10:]]; out = []; i = 0
    while i < len(n):
        row = []; chars = 0
        while i < len(n) and len(row) < 3 and chars + len(n[i]) <= 40:
            row.append(n[i]); chars += len(n[i]) + 3; i += 1
        if not row:
            row = [n[i]]; i += 1
        out.append(('l4', row))
    return out

def now_html(acts, rest=False):
    ms = [(a.get('m') or 0) for a in acts] or [1]; mx, mn = max(ms), min(ms); out = ''
    for a in acts:
        v = ((a.get('m') or 0) - mn) / (mx - mn) if mx > mn else 1.0
        out += '<span class="pn" style="--s:%.3f" data-c="%s" data-art="%s" data-an="%s">%s</span>' % (v, ctag(a['k']), _aslug(nm(a)), E(a['n']), E(nm(a)))
    return '<div class="pcloud%s">%s</div>' % (' rest' if rest else '', out)

def poster_block(P, badge, yr, then, now, total, joined=True, ranked=True):
    for _a in then + now: _ORIG.setdefault(nm(_a), _a['n'])
    TG = {nm(a): ctag(a.get('kb', 'none')) for a in then}  # booking model tags (class_booking), printed order
    s = P['stripe']
    stripe = '<div class="stripe">%s</div>' % ''.join('<i style="background:%s"></i>' % c for c in s[:3])
    cc = P['light'] if P['light'].upper() != P['paper'].upper() else P['warm']
    cloud = seam(yr, P) if joined else stripe
    dates = ('<p class="po-dates" style="color:%s">%s</p>' % (P.get('bandText', P['paper']), E(P['dates'].upper()))) if P.get('dates') else ''
    html_ = ('<section class="poster JOIN" style="--paper:%s;--ink:%s;--ink2:%s;--band:%s" data-yr="%s">%s<div class="po-in">'
            '<div class="po-art"><img class="po-badge" src="%s" alt="Pickathon %s poster art">%s</div>'
            '<h2 class="po-cap" data-then="This is the lineup in %s." data-now="This is the lineup today.">This is the lineup in %s.</h2>'
            '<div class="po-ctl"><button class="po-b on" data-m="then">Lineup %s</button><span class="po-track"><i class="po-knob" role="slider" tabindex="0" aria-label="Slide from %s to today" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"></i></span><button class="po-b" data-m="now">Lineup today</button></div>'
            '<div class="po-names then">%s<div class="po-rest" hidden>%s</div></div><div class="po-names now" hidden>%s<div class="po-rest" hidden>%s</div></div>'
            '<button class="po-all" data-open="Show the top ten" data-shut="See the whole bill · %d bands">See the whole bill · %d bands</button>'
            '<p class="po-tap">Tap any name</p></div>%s</section>') % (
            P['paper'], P['ink'], P['ink2'], P['band'], yr, cloud, badge, yr, dates, yr, yr, yr, yr,
            poster_html(ten_lines(then), TG), poster_html(rest_lines(then), TG), now_html(now[:10]), now_html(now[10:], True), total, total, stripe)
    html_ = html_.replace('poster JOIN', 'poster joined' if joined else 'poster solo')
    if not ranked:
        a = html_.index('<div class="po-ctl">'); b = html_.index('<div class="po-names then">')
        html_ = html_[:a] + html_[b:]
    if total <= 10:
        a = html_.index('<button class="po-all"'); b = html_.index('<p class="po-tap">')
        html_ = html_[:a] + html_[b:]
    return html_

# ---------- per-year seam: the year's own brand motif where the hero meets the poster (Nov 20) ----------
GROUND = ('<svg class="sm-g" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
          '<path fill="%s" d="M0 60c60-7 130-10 195-10s135 3 195 10v10H0z"/></svg>')
def _spark(x, y, r, c):
    return ('<path fill="%s" d="M%s %sc%s %s %s %s %s %s c-%s %s -%s %s -%s %s c-%s -%s -%s -%s -%s -%s c%s -%s %s -%s %s -%sz"/>' %
            (c, x, y - r, r*.12, r*.7, r*.3, r*.88, r, r, r*.7, r*.12, r*.88, r*.3, r, r, r*.12, r*.7, r*.3, r*.88, r, r, r*.7, r*.12, r*.88, r*.3, r, r))
def seam(yr, P):
    """Full-width horizon built from the year's own brand art; the badge sits in front of it like 2024's hills."""
    paper = P['paper']; g = GROUND % paper
    import random as _rnd
    R = _rnd.Random(int(yr))
    def row(src, w, n, hmin, hmax, alt=None, every=0, skip=()):
        out = ''; xs = [i * 100.0 / (n - 1) for i in range(n)]
        for i, x in enumerate(xs):
            if any(lo <= x <= hi for lo, hi in skip): continue
            h = R.uniform(hmin, hmax); x += R.uniform(-2.2, 2.2)
            pic = alt if (alt and every and i % every == every - 1) else src
            out += '<img class="sm-i" src="%s" alt="" style="left:%.1f%%;--h:%.0f;z-index:%d">' % (pic, x, h, int(200 - h))
        return out
    if yr == '2022':
        t = img('ext/seam/y22-trees.png', 300, fmt='PNG')
        hills = ('<svg class="sm-hill" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
                 '<path fill="#79B2A7" d="M0 40c30-10 58-24 96-24 40 0 56 20 92 22 40 2 64-26 108-26 40 0 66 16 94 26V70H0z"/>'
                 '<path fill="#6B3030" d="M0 52c44-8 90-14 138-8 46 6 80 10 130 2 44-7 86-6 122 4V70H0z"/></svg>')
        pos = [(6, 74), (10.5, 52), (22, 96), (27, 66), (45, 58), (49.5, 84), (70.5, 112), (75.5, 78), (80, 56), (93, 90), (97.5, 62)]
        art = ('<img class="sm-sun" src="%s" alt="">' % img('ext/seam/y22-sun.png', 360, fmt='PNG') + hills + ''.join(
            '<img class="sm-i sm-on-hill" src="%s" alt="" style="left:%.1f%%;--h:%d;z-index:%d">' % (t, x, h, 200 - h) for x, h in pos))
    elif yr == '2023':
        f = img('ext/seam/y23-fir.png', 420, fmt='PNG'); fo = img('ext/seam/y23-fir-orange.png', 420, fmt='PNG')
        art = row(f, 0, 26, 46, 104, alt=fo, every=5)
    elif yr == '2025':
        STAR = '<svg viewBox="-10 -10 20 20"><path fill="%s" d="M0-10Q1.8-1.8 10 0Q1.8 1.8 0 10Q-1.8 1.8-10 0Q-1.8-1.8 0-10z"/></svg>'
        # confetti spilling off the stripe, graded big to small (the 2025 sheet's sparkles around the trout)
        pts = [(66, 92, 22, '#FF3087'), (60, 64, 12, '#FFF01C'), (71.5, 70, 9, '#0FF2FF'), (56, 98, 8, '#FF3087'),
               (52, 72, 6, '#0FF2FF'), (63, 118, 7, '#FFF01C'), (47, 88, 5, '#FFF01C'), (96, 126, 14, '#FF3087'), (90, 104, 8, '#FFF01C')]
        stars = ''.join('<i class="sm-st" style="left:%.1f%%;bottom:calc(%dpx*var(--sc));--s:%d">%s</i>' % (x, y, r, STAR % c) for x, y, r, c in pts)
        dots = ''.join('<i class="sm-dot" style="left:%.1f%%;bottom:calc(%dpx*var(--sc));background:%s"></i>' % (x, y, c) for x, y, c in
                       [(58, 82, '#0FF2FF'), (69, 108, '#FFF01C'), (50, 104, '#FF3087'), (75, 54, '#FF3087'), (44, 66, '#0FF2FF')])
        art = ('<svg class="sm-hill" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
               '<path fill="#0FF2FF" d="M200 40c30-24 62-30 92-22 30 8 60 8 98-6V70H200z"/>'
               '<path fill="#FFF01C" d="M0 34c40-14 92-16 140-6 40 8 70 10 110 0 50-13 96-12 140 4V70H0z"/></svg>' + stars + dots)
    elif yr == '2026':
        art = ('<svg class="sm-hill" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
               '<path fill="#71AD43" d="M0 30c28-12 60-12 86-2 30 12 58 12 92-4 34-15 70-13 100 2 30 14 70 14 112-4V70H0z"/>'
               '<path fill="#BACD32" d="M0 44c40-10 84-8 120 2 40 11 86 10 132-2 48-12 96-10 138 4V70H0z"/></svg>')
    else:
        if yr == '2024':
            cc = P['light']
            return CLOUD.replace('#C5AC38', cc).replace('#FFFEF2', paper)
        return generic_seam(yr, P)
    return '<div class="seam s%s" aria-hidden="true">%s%s</div>' % (yr, art, g)


# ---------- generic per-year horizon for years without hand-cut art (1999-2021, 2027): kit colors, rotating motifs ----------
import urllib.parse as _up
_STYLE = {'1999': 'pines', '2000': 'hills', '2001': 'scallop', '2002': 'hills', '2003': 'pines', '2004': 'scallop', '2005': 'sun',
          '2006': 'hills', '2007': 'pines', '2008': 'scallop', '2009': 'sun', '2010': 'hills', '2011': 'scallop', '2012': 'pines',
          '2013': 'sun', '2014': 'scallop', '2015': 'hills', '2016': 'pines', '2017': 'hills', '2018': 'scallop', '2019': 'pines', '2027': 'sun'}
def _tile(svg):
    return "url('data:image/svg+xml,%s')" % _up.quote(svg)
def generic_seam(yr, P):
    paper = P['paper']; ink = P['ink']
    c1 = P['light'] if P['light'].upper() != paper.upper() else P['warm']
    c2 = P['warm'] if c1.upper() != P['warm'].upper() else P['stripe'][2]
    if c2.upper() == c1.upper(): c2 = ink
    st = _STYLE.get(yr, 'hills'); g = GROUND % paper
    if st == 'hills':
        art = ('<svg class="sm-hill" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
               '<path fill="%s" d="M0 34c36-14 80-20 128-10 40 8 62 14 104 2 48-14 100-12 158 8V70H0z"/>'
               '<path fill="%s" d="M0 48c48-10 92-10 140-2 44 8 84 8 128-2 44-8 92-6 122 4V70H0z"/></svg>') % (c1, c2)
    elif st == 'sun':
        r = int(yr) % 3
        art = ('<svg class="sm-hill" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
               '<path fill="%s" d="M0 40c44-12 94-14 146-4 52 10 96 8 138-4 40-10 80-6 106 6V70H0z"/></svg>'
               '<i class="sm-disc" style="left:%d%%;background:%s"></i>') % (c1, (28, 70, 52)[r], c2)
    elif st == 'pines':
        t = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 46"><path fill="%s" d="M9 46 18 16 27 46z"/><path fill="%s" d="M24 46 36 4 48 46z"/>'
             '<path fill="%s" d="M44 46 52 22 60 46z"/><path fill="%s" d="M0 46h64v-6H0z"/></svg>') % (c2, c1, c2, c1)
        art = '<div class="sm-tile" style="background-image:%s"></div>' % _tile(t)
    else:  # scallop
        t = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 30"><path fill="%s" d="M0 30V22a12 12 0 0 1 24 0 12 12 0 0 1 24 0v8z"/>'
             '<path fill="%s" d="M12 30V26a6 6 0 0 1 12 0v4z"/><path fill="%s" d="M-12 30V26a6 6 0 0 1 12 0v4zM36 30V26a6 6 0 0 1 12 0v4z"/></svg>') % (c1, c2, c2)
        art = '<div class="sm-tile sm-sc" style="background-image:%s"></div>' % _tile(t)
    return '<div class="seam s%s" aria-hidden="true">%s%s</div>' % (yr, art, g)

_PLAYER = ("<script>(function(){function pkPlay(u){var p=(u||'').split('|'),m=(p[0]||'').match(/vimeo\\.com\\/(?:video\\/)?(\\d+)/),yt=(p[0]||'').match(/(?:v=|youtu\\.be\\/)([\\w-]{11})/);if(!m&&!yt)return;"
 "var h=(u.match(/vimeo\\.com\\/\\d+\\/([0-9a-f]+)/)||[])[1]||'',t=(u.match(/#t=(\\d+)s/)||[])[1]||'';var s='https://player.vimeo.com/video/'+(m?m[1]:'')+'?autoplay=1&title=0&byline=0&portrait=0&dnt=1&texttrack=false&vimeo_logo=0'+(h?'&h='+h:'')+(t?'#t='+t+'s':'');if(!m)s='https://www.youtube-nocookie.com/embed/'+yt[1]+'?autoplay=1&rel=0&cc_load_policy=0';"
 "var o=document.createElement('div');o.className='pkvid';o.innerHTML='<button class=\"pkvid-x\" aria-label=\"Close video\">&times;</button><div class=\"pkvid-f\"><iframe src=\"'+s+'\" allow=\"autoplay; fullscreen; picture-in-picture\" allowfullscreen title=\"Pickathon clip\"></iframe></div>';"
 "document.body.appendChild(o);function close(){o.remove();document.removeEventListener('keydown',k)}function k(e){if(e.key==='Escape')close()}document.addEventListener('keydown',k);o.addEventListener('click',function(e){if(e.target===o||e.target.classList.contains('pkvid-x'))close()});}"
 "document.addEventListener('click',function(e){var c=e.target.closest('[data-clip]');if(c){e.preventDefault();pkPlay(c.dataset.clip);return}"
 "var sl=e.target.closest('[data-slide]');if(sl){var hero=sl.closest('.hero'),S=JSON.parse(hero.dataset.slides),f=S[+sl.dataset.slide];if(!f)return;"
 "hero.querySelector(':scope>img').src=f.i;hero.querySelectorAll('[data-slide]').forEach(function(x){x.classList.toggle('on',x===sl)});"
 "var k=hero.querySelector('.krow .k'),g=hero.querySelector('.krow .g'),h1=hero.querySelector('h1'),sub=hero.querySelector('.hero-sub'),ring=hero.querySelector('.ring');"
 "if(k){k.textContent=f.k;k.className='k k-'+({Discovery:'disc',Legend:'leg','Deep cut':'deep'}[f.k]||'none')}if(g)g.textContent=f.g;if(h1){h1.textContent=f.n;h1.classList.toggle('sm',f.n.length>12)}"
 "if(sub){sub.textContent=f.l;sub.hidden=!f.l}if(ring){if(f.clip){ring.dataset.clip=f.clip;ring.hidden=false}else{ring.hidden=true}}}});"
 "document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.matches&&e.target.matches('[data-clip]')){pkPlay(e.target.dataset.clip)}});})();</script>"
 "<style>.pkvid{position:fixed;inset:0;z-index:9999;background:rgba(10,8,9,.94);display:flex;align-items:center;justify-content:center;padding:56px 12px}"
 ".pkvid-f{width:100%;max-width:1100px;aspect-ratio:16/9}.pkvid-f iframe{width:100%;height:100%;border:0}"
 ".pkvid-x{position:absolute;top:10px;right:14px;width:44px;height:44px;border:0;background:transparent;color:#fff;font-size:34px;cursor:pointer}</style>")

CLOUD = ('<svg class="cloud" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
         '<path fill="#C5AC38" d="M0 40c8-2 14 0 18 3 4-16 22-24 40-20 14 3 22 12 24 22 10-2 22 0 30 6h166c8-6 20-8 30-6 2-10 10-19 24-22 18-4 36 4 40 20 4-3 10-5 18-3v30H0z"/>'
         '<path fill="#FFFEF2" d="M0 60c60-7 130-10 195-10s135 3 195 10v10H0z"/></svg>')
GLIST = ['Everything'] + TAGS15
LLIST = ['Music', 'DJs', 'Family', 'Comedy', 'Literary', 'Wellness', 'Food', 'Curation', 'Craft']
def gpick(target, q='What kind of music do you love?', opts=GLIST):
    return ('<div class="gp" data-target="%s" data-all="%s"><button class="gp-b" aria-expanded="false"><span class="gp-q">%s</span>'
            '<span class="gp-a"><b>%s</b>%s</span></button><div class="gp-list" hidden>%s<button class="gp-done">Show</button></div><p class="gp-none" hidden>Nothing under this one here.</p></div>') % (
            target, opts[0], q, opts[0], ICON['caret'], ''.join('<button class="gp-o%s" data-g="%s" aria-pressed="%s">%s</button>' % (' all on' if g == opts[0] else ' mx', g, 'true' if g == opts[0] else 'false', g) for g in opts))

_ALINES = json.load(open(ROOT + 'arch_lines.json'))  # r44: Copy Review's one line per card (archCT l, copy_review-39), 93 characters or fewer
def vcard(n, y, k, g, p, pos):
    h = _vcard(n, y, k, g, p, pos)
    ln = _ALINES.get('%s|%s|%s' % (k, ''.join(c for c in _ud.normalize('NFD', n.lower()) if c.isalnum() and ord(c) < 128), y), '')
    return h.replace('</span><span class="cstory">', '</span><span class="cline">%s</span><span class="cstory">' % E(ln), 1) if ln and '<span class="cstory">' in h else h
def _vcard(n, y, k, g, p, pos):
    if not p:  # no photo for that year: a plain site-color card, same anatomy; r36: it still plays the act's best song when the ledger has one
        _cv = archive_clip(n, y)
        g_all, g = gall_n(n, g), gp_n(n, g)
        return ('<a class="card tt arch nop%s" data-g="%s" data-art="%s" data-an="%s" href="#"><span class="cyr">%s</span>%s'
                '<span class="cbody"><span class="krow"><span class="k k-%s">%s</span></span><span class="cname">%s</span>%s</span></a>') % (
                ' pc' if _cv else '', E(g_all), _aslug(n), E(n), y, photo_play(_cv, n) if _cv else '', k, KLAB[k], E(n), '<span class="cstory">Their story \u2192</span>' if _cv else '')
    return card(n, y, k, g, img(p, 520), pos, archive_clip(n, y), 'tt arch').replace('<img src=', '<img loading="lazy" src=', 1)
leg.append(("I’m With Her", 2018, 'Bluegrass', 'i/p9615.jpg', '22% 50%'))
deep.append(('Black Mountain', 2011, 'Psych', 'i/p9704.jpg', '100% 50%'))

# fill the archive out from live data so the sticky bar has a long scroll to work against
def _canon(n):
    k = _aslug(n); return _ALIAS.get(k, k)
_FT = json.load(open(APP + 'focus-tall.json'))
# r32 (Zale, Nov 21): an archive card with no same-year catalog photo takes a same-year frame: first the year reel's own frame
# (already on the site), then a YouTube frame of that year's Pickathon video, picked by eye (build/arch_frames.json).
# Archive cards only: these frames never enter yearPhotos, so year pages and artist galleries keep real photos.
ARCHF = {}
for _yy, _fr in d['yearReel'].items():
    for _f in _fr:
        _i = _f.get('i') or ''
        if _i and not _i.startswith('http') and 'poster' not in _i and not os.path.basename(_i).startswith(('tf', 'tfw')) and os.path.exists(APP + _i):
            ARCHF.setdefault((_canon(_f['n']), _yy), _i)
for _yy, _acts in json.load(open(ROOT + 'arch_frames.json')).items():
    for _n2, _v in _acts.items():
        ARCHF.setdefault((_canon(_n2), _yy), _v['i']); EXTF[_v['i']] = _v['f']
def _fill(lst, kind, want):
    # r30: the hand-picked openers stay only while the class table still gives the act that class in some year
    _ever = {_canon(a['n']) for yy in d['yearBill'] for a in d['yearBill'][yy] if not a.get('c') and a['k'] == kind}
    _out = [x[0] for x in lst if _canon(x[0]) not in _ever]
    if _out: print('archive: hand-picked %s no longer in that class, left out: %s' % (kind, _out))
    lst[:] = [x for x in lst if _canon(x[0]) in _ever]
    have = {_canon(x[0]) for x in lst}
    first = {}
    for yy in sorted(d['yearBill']):
        for a in d['yearBill'][yy]:
            if a.get('c') or a['k'] != kind: continue
            key = _canon(a['n'])
            if key in first or key in have: continue
            p = (d['yearPhotos'].get(yy, {}).get(a['n']) or {}).get('i')
            if not p or p.startswith('http') or not (os.path.exists(APP + p) or os.path.exists(ROOT + p)): p = ''
            if not p: p = ARCHF.get((_canon(a['n']), yy), '')  # r32: same-year reel frame or video frame (archive only)
            v = (_FT.get(p) or EXTF.get(p)) if p else None
            first[key] = (a['n'], int(yy), GSHORT.get(a.get('g'), ''), p, ('%s%% %s%%' % (v[0], v[1])) if v else '50% 35%', a.get('m') or 0)
    # r30 (Nov 21): every act that held the class in any year (Zale, Nov 13), at its first year in that class; photos first, then by size.
    # No cap: the count on the button is the number of cards drawn, never a typed number.
    extra = sorted(first.values(), key=lambda t: (not t[3], -t[5]))
    lst.extend(t[:5] for t in extra)
_fill(disc, 'disc', 0); _fill(leg, 'leg', 0); _fill(deep, 'deep', 0)
# r40 (Zale, Nov 22: video only, hide the rest): the Archive draws only acts that have a song to play; counts follow the cards drawn
for _lst in (disc, leg, deep):
    _keep = [x for x in _lst if archive_clip(x[0], x[1])]
    print('archive: %d cards with no song left out' % (len(_lst) - len(_keep)))
    _st = [0, 0, 0]
    for _x in _keep:
        _u = archive_clip(_x[0], _x[1]); _kk = ''.join(ch for ch in _ud.normalize('NFD', _CLIPALIAS.get(_x[0], _x[0]).lower()) if ch.isalnum())
        _yy = [int(a) for (b, a), u2 in CLIPY.items() if b == _kk and u2 == _u]
        _st[0 if int(_x[1]) in _yy else (1 if _yy and min(_yy) > int(_x[1]) else 2)] += 1
    print('archive clips: same year %d, later year %d, earlier year %d' % tuple(_st))
    _lst[:] = _keep
# r42 (Zale, Nov 22): top-ranked Discoveries in one batch for Home (design_home-40): same cards, same clips, same tags as the Archive
_mag = {}
for _r in csv.DictReader(open(ROOT + 'class_table_v163.csv', encoding='utf-8')):
    if _r.get('site_row') == 'yes' and _r.get('class') == 'Discovery':
        try: _mag[(_aslug(_r.get('lineup_act') or _r['act']), _r['year'])] = float(_r.get('magnitude_dec') or 0)
        except ValueError: pass
_rows = []
for x in disc:
    _y = str(x[1]); _rows.append((_mag.get((_aslug(x[0]), _y), 0), x[0], _y, archive_clip(x[0], x[1]), '|'.join(tags_of(x[0]))))
_rows.sort(key=lambda r: (-r[0], r[1]))
with open(ROOT + 'home_top_discoveries.csv', 'w', newline='', encoding='utf-8') as _f:
    _w = csv.writer(_f); _w.writerow(['rank', 'act', 'first_year', 'magnitude_dec', 'clip_url', 'tags'])
    for _i, r in enumerate(_rows, 1): _w.writerow([_i, r[1], r[2], r[0], r[3], r[4]])

bars = [(1, [58, 34]), (1, [70]), (2, [40, 44]), (2, [30, 26, 30]), (3, [22, 28, 20, 18]), (3, [18, 24, 16, 26]), (4, [14, 18, 12, 16, 14]), (4, [12, 16, 18, 12, 10])]
barh = ''.join('<div class="br b%d">%s</div>' % (lv, ''.join('<i style="width:%d%%"></i>' % w for w in ws)) for lv, ws in bars)
s1 = header('Lineup', 'Aug 5–8, 2027', back=False)
s1 += ('<section class="hero h27"><img src="%s" alt="" style="object-position:74%% 50%%"><div class="hero-sc"></div>'
       '<div class="hero-tx"><p class="kick">The 2027 lineup · not out yet</p><h1>The names<br>come later.</h1>'
       '<p class="hero-sub">60+ acts on hand-built stages, most playing twice. Be first to hear who.</p>'
       '<a class="btn gold" href="#">Send me the 2027 lineup</a></div></section>') % img('i/pk-yr2024-1.jpg', 1100, 80)
# Nov 21 r27 (Zale, 09:10): the placeholder 2027 poster card is back under the hero, so 2027 has its year block like every other year (r25 had removed it)
s1 += ('<section class="p27"><div class="stripe"><i style="background:#F2CF62"></i><i style="background:#86526B"></i><i style="background:#E3B5CF"></i><i style="background:#F2EDE3"></i></div>'
       '<div class="p27-in"><div class="p27-top"><div><p class="p27-k">Pickathon</p><p class="p27-y">2027</p></div><span class="p27-q" aria-hidden="true">?</span></div>'
       '<p class="p27-d">August 5–8 · Pendarvis Farm</p><div class="p27-bill" role="img" aria-label="The 2027 poster, names not yet announced">%s</div>'
       '<p class="p27-c">The 2027 poster · names go here</p></div>'
       '<div class="stripe"><i style="background:#F2CF62"></i><i style="background:#86526B"></i><i style="background:#E3B5CF"></i><i style="background:#F2EDE3"></i></div></section>') % barh
s1 += ('<section class="arch"><p class="kick">While you wait</p><h2>Wait, they played here?</h2><p class="sub">They played the farm in small rooms. Look how big they got.</p>'
       '<div class="bkw"><div class="bk"><button class="bkb on" data-b="disc"><span>Discoveries</span><b>@ND</b></button><button class="bkb" data-b="leg"><span>Legends</span><b>@NL</b></button><button class="bkb" data-b="deep"><span>Deep cuts</span><b>@NP</b></button></div>%s</div>'
       '<div class="grid2 bl" data-b="disc">%s</div><div class="grid2 bl" data-b="leg" hidden>%s</div><div class="grid2 bl" data-b="deep" hidden>%s</div>'
       '<button class="btn line wide more">Keep going</button></section>') % (gpick('.arch .card', 'What kind of music do you love?', GLIST).replace('class="gp"', 'class="gp gpc"'),
       ''.join(vcard(n, y, 'disc', g, p, pos) for n, y, g, p, pos in disc),
       ''.join(vcard(n, y, 'leg', g, p, pos) for n, y, g, p, pos in leg),
       ''.join(vcard(n, y, 'deep', g, p, pos) for n, y, g, p, pos in deep))
s1 = s1.replace('@ND', str(len(disc))).replace('@NL', str(len(leg))).replace('@NP', str(len(deep)))

P24 = d['yearBrand']['2024']
# ---------- SCREEN 3: Geese ----------
ap = d['actPages']['geese']
sug = [('Alvvays', 2016, 'i/p9601.jpg', '50% 40%'), ('Faye Webster', 2022, 'i/p9611.jpg', '30% 40%'), ('Lucy Dacus', 2017, 'i/p9621.jpg', '60% 40%'),
       ('Mac DeMarco', 2014, 'i/p9622.jpg', '70% 40%'), ('Wet Leg', 2022, 'i/p9642.jpg', '60% 40%')]
s3 = header('Geese', 'Pickathon 2024')
s3 += ('<section class="hero hact"><img src="%s" alt="" style="object-position:38%% 40%%"><div class="hero-sc"></div>'
       '<button class="starb" aria-label="Add to my top five">%s</button>%s'
       '<div class="hero-tx"><p class="krow"><span class="k k-disc">Discovery</span><span class="g">Indie rock &amp; pop</span></p><h1 class="act">Geese</h1>'
       '<p class="hero-meta">Pickathon 2024 · Galaxy Barn</p><div class="dots"><i class="on"></i><i></i><i></i><i></i></div></div></section>') % (
       img('i/y24-geese.jpg', 1100, 80), ICON['star'], play('lg'))
s3 += ('<a class="yrblock" href="#" style="--paper:%s;--ink:%s;--ink2:%s"><div class="stripe">%s</div><div class="yb-in"><img src="%s" alt="">'
       '<div><b>Pickathon 2024</b><span>August 1–4, 2024 · Pendarvis Farm</span><em>See the whole 2024 lineup %s</em></div></div></a>') % (
       P24['paper'], P24['ink'], P24['ink2'], ''.join('<i style="background:%s"></i>' % c for c in P24['stripe'][:3]),
       img('i/y24-badge-keyline.png', 240, fmt='PNG'), ICON['arrow'])
s3 += ('<section class="acts"><a class="btn gold" href="#"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg> Watch Geese</a>'
       '<div class="row2"><a class="btn line" href="#">%s Listen to Geese</a><button class="btn line sq" aria-label="Share">%s</button></div></section>') % (ICON['note'], ICON['share'])
story = ap['story']
s3 += '<section class="liner"><p class="kick">Liner notes</p><p class="lead">%s</p>' % E(story[0]['t'])
s3 += '<h3>Before they played</h3><p class="body">%s</p>' % E(story[1]['t'])
s3 += ('<h3>At Pickathon</h3><ul class="sets"><li><span>Saturday · 6 p.m.</span><b>Slab</b></li><li><span>Saturday · 1 a.m.</span><a href="#">Galaxy Barn</a></li>'
       '<li><span>Sunday · 9 p.m.</span><a href="#">Woods</a></li></ul><p class="body">%s</p>') % E(story[2]['t'])
s3 += '<h3>Since <small>as of November 2026</small></h3><p class="body">%s</p></section>' % E(story[3]['t'])
s3 += ('<section class="shelf vids"><div class="sh-h"><div><p class="kick">Filmed on the farm</p><h2>Videos · Pickathon 2024</h2></div></div><div class="swipe">'
       '<a class="vid" href="#"><span class="vth"><img src="%s" alt="" style="object-position:50%% 35%%">%s</span><b>Tomorrow’s Crusade</b><span>Slab Sessions · Pickathon 2024</span></a>'
       '<a class="vid" href="#"><span class="vth"><img src="%s" alt="" style="object-position:50%% 40%%">%s</span><b>Geese, full set</b><span>Woods · Pickathon 2024</span></a>'
       '</div></section>') % (img('i/y24g2-geese.jpg', 600), play('sm'), img('i/y24g1-geese.jpg', 600), play('sm'))
s3 += '<section class="theirs"><p class="kick">Their Pickathons</p><div class="filt"><a class="chip on" href="#">Pickathon 2024</a></div></section>'
s3 += shelf('Same sound, other summers', 'IF YOU LIKE GEESE', 'Indie rock bands who stand about where Geese stand today.', '',
            [card(n, y, 'disc', 'Indie rock', img(p, 520), pos) for n, y, p, pos in sug]).replace(
            '<a class="card seeall" href="#"><span class="sa-n"></span><span class="sa-t">See all If You Like Geese', '<a class="card seeall" href="#"><span class="sa-n"></span><span class="sa-t">More indie rock')

# ---------- every year, one template ----------
NUM = {1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten'}
FOC = json.load(open(APP + 'focus-tall.json')); FOCH = json.load(open(APP + 'focus-hero.json'))
def fpos(p, tab=FOC):
    v = tab.get(p) or EXTF.get(p)
    return '%s%% %s%%' % (v[0], v[1]) if v else '50% 35%'
def loc(p):
    return bool(p) and not p.startswith('http') and (os.path.exists(APP + p) or os.path.exists(ROOT + p))
def norm(n):
    return n.replace('“', '"').replace('”', '"').replace('’', "'").lower().strip()
VID = set()
for v in d['videos']:
    if v.get('a') and not v.get('f'):
        VID.add((norm(v['a']), str(v.get('y'))))
CD = {(norm(k), str(v['y'])): v['t'] for k, v in d['cdmap'].items()}
YEARS = sorted(d['yearBill'].keys(), reverse=True)

def name_lines(n):
    words = n.upper().replace('"', '').split(); lines = []; cur = ''
    for w in words:
        if cur and len(cur) + 1 + len(w) <= 9: cur += ' ' + w
        else:
            if cur: lines.append(cur)
            cur = w
    lines.append(cur)
    return lines

def tile(a, y, P, photo):
    n = a['n']; k = a['k']; cd = CD.get((norm(n), y)); vid = (norm(n), y) in VID
    if photo:
        h = card(n, '', k, '', img(photo, 560), fpos(photo), clip_for(n, y) or bool(cd), 'tt')
        if cd:
            h = h.replace('</span></span></a>', '</span><span class="ctrk">%s · CD</span></span></a>' % E(cd))
        return h
    lines = name_lines(n); L = max(len(x) for x in lines)
    fs = max(13.5, min(40, 150 / (0.76 * L)))
    if len(lines) > 3: fs = min(fs, 21)
    if len(n) > 30: fs = min(fs, 14.5)
    elif len(n) > 20: fs = min(fs, 17)
    foot = ('<span class="yt-y">%s · %s CD</span>' % (E(cd), y)) if cd else '<span class="yt-y">Pickathon %s</span>' % y
    return ('<a class="card tt ytile" data-art="%s" data-an="%s" href="#" style="--paper:%s;--ink:%s;--ink2:%s;--band:%s"><span class="yt-k">%s</span>'
            '<span class="yt-n" style="font-size:max(var(--lab),%.1fpx)">%s</span>%s</a>') % (_aslug(n), E(n), P['paper'], P['ink'], P['ink2'], P['band'], KLAB[k], fs, '<br>'.join(E(x) for x in lines), foot)

def year_page(y):
    P = d['yearBrand'][y]; st = d['yearStory'].get(y, {}); yp = d['yearPhotos'].get(y, {})
    allb = d['yearBill'][y]
    music = [x for x in allb if not x.get('c')]
    other = sorted(set(x['c'].split(' · ')[0].replace('DJ', 'DJs') for x in allb if x.get('c')))
    ranked = any((x.get('m') or 0) > 0 for x in music)
    classed = [x for x in music if x['k'] != 'none']
    today = sorted(classed, key=lambda x: (-(x.get('m') or 0), KORD[x['k']])) if ranked else classed
    today_all = today + [x for x in music if x['k'] == 'none']
    ten = today[:10]; others = [x for x in today_all if x not in ten]
    ph = lambda a: (yp.get(a['n'], {}).get('i') if loc(yp.get(a['n'], {}).get('i')) else None)
    h = header('', '', chip=y)
    reel = d['yearReel'].get(y, []); r0 = reel[0] if reel else None
    hero = None
    if r0 and loc(r0.get('i')) and 'poster' not in r0['i']:
        kk = (r0.get('k') or '').split(' · ')
        hero = (r0['i'], r0['n'], kk[0] if kk else '', kk[1] if len(kk) > 1 else '', r0.get('l', ''), bool(r0.get('v')), r0.get('v', ''))
    elif ten and ph(ten[0]):
        a0 = ten[0]; hero = (ph(a0), a0['n'], KLAB[a0['k']], gp_a(a0), '', False, '')
    if hero:
        kc = {'Discovery': 'disc', 'Legend': 'leg', 'Deep cut': 'deep'}.get(hero[2], 'none')
        sl = reel_slides(y) if y == '2026' else []
        if sl:
            segs = ''.join('<i data-slide="%d"%s></i>' % (k, ' class="on"' if k == 0 else '') for k in range(len(sl)))
            sattr = ' data-slides="%s"' % html.escape(json.dumps(sl), quote=True)
            h += ('<section class="hero hyr"%s><img src="%s" alt="" style="object-position:%s"><div class="hero-sc"></div><div class="segs">%s</div><span class="hyr-y">%s</span>%s'
                  '<div class="hero-tx"><p class="krow"><span class="k k-%s">%s</span><span class="g">%s</span></p><h1 class="act%s">%s</h1>%s</div></section>') % (
                  sattr, sl[0]['i'], fpos(sl[0]['raw'], FOCH), segs, y, clip_ring(sl[0]['clip'], 'lg'),
                  kc, E(sl[0]['k']), E(sl[0]['g']), ' sm' if len(sl[0]['n']) > 12 else '', E(sl[0]['n']), ('<p class="hero-sub">%s</p>' % E(sl[0]['l'])) if sl[0]['l'] else '')
        else:
            h += ('<section class="hero hyr"><img src="%s" alt="" style="object-position:%s"><div class="hero-sc"></div><div class="segs">%s</div><span class="hyr-y">%s</span>%s'
                  '<div class="hero-tx"><p class="krow"><span class="k k-%s">%s</span><span class="g">%s</span></p><h1 class="act%s">%s</h1>%s</div></section>') % (
                  img(hero[0], 1100, 80), fpos(hero[0], FOCH), '<i class="on"></i>' + '<i></i>' * (max(1, min(10, len(reel))) - 1), y, clip_ring(hero[6], 'lg'),
                  kc, E(hero[2]), E(hero[3]), ' sm' if len(hero[1]) > 12 else '', E(hero[1]), ('<p class="hero-sub">%s</p>' % E(hero[4])) if hero[4] else '')
    if y == '2024':
        badge = img('i/y24-badge-keyline.png', 460, fmt='PNG')
    else:
        badge = img(d['yearLogo'][y], 460, fmt='PNG')
    h += poster_block(P, badge, y, music, today_all, len(music), joined=bool(hero), ranked=ranked)
    if st.get('headline'):
        h += ('<section class="story short"><p class="kick">The %s story</p><p class="lead">%s.</p>%s</section>') % (y, E(st['headline'].rstrip('.')), ('<p class="body" hidden>%s</p><button class="chip stog" aria-expanded="false" data-open="Read the %s story" data-shut="Show less"><span>Read the %s story</span> %s</button>' % (E(st['story']), y, y, ICON['caret'])) if st.get('story') else '')
    lp = ''  # Nov 21 r27 (Zale): the lineup picker is off until the other lineups (Family, DJs, Comedy...) are drawn; it listed them with nothing behind them
    if ten:
        h += ('<section class="topten">%s<h2 class="h-big">Begin here</h2><p class="sub k2">%s ways into Pickathon %s.</p><div class="grid2%s">%s</div></section>') % (
              lp, NUM.get(len(ten), str(len(ten))), y, '' if any(ph(a) for a in ten) else ' flat', ''.join(tile(a, y, P, ph(a)) for a in ten))
    gs = gopts([x for x in music if x.get('g')])
    withph = [a for a in others if ph(a)]
    if len(withph) >= 6:
        show = others; body = ''
        gs = gopts([x for x in others if x.get('g')])
        for _i, a in enumerate(show):
            g = gp_a(a); gA = gall_a(a); _b0 = len(body)
            if ph(a):
                body += '<a class="mini" data-g="%s" data-art="%s" data-an="%s" href="#"><img loading="lazy" src="%s" alt="" style="object-position:%s"><b>%s</b><span>%s</span></a>' % (E(gA), _aslug(a['n']), E(a['n']), img(ph(a), 400, 70), fpos(ph(a), d and json.load(open(APP + 'focus.json')) if False else FOC), E(a['n']), E(g))
            else:
                body += '<a class="mini" data-g="%s" data-art="%s" data-an="%s" href="#"><span class="mini-n" style="background:%s;color:%s">%s</span><b>%s</b><span>%s</span></a>' % (E(gA), _aslug(a['n']), E(a['n']), P['paper'], P['ink'], E(a['n'].upper()), E(a['n']), E(g))
            if _i >= 8: body = body[:_b0] + body[_b0:].replace('<a class="mini"', '<a class="mini xtra"', 1)
        sel = '#y%s .mini' % y
        body = '<div class="grid2 minis">%s</div>' % body + ('<button class="btn line wide evy">See everyone · %d more</button>' % (len(others) - 8) if len(others) > 8 else '')
    else:
        sel = '#y%s .row' % y
        gs = gopts([x for x in others if x.get('g')])
        body = '<div class="rows">%s</div>' % ''.join('<a class="row" data-g="%s" data-art="%s" data-an="%s" href="#"><b>%s</b><span>%s</span></a>' % (E(gall_a(x)), _aslug(x['n']), E(x['n']), E(x['n']), E(' · '.join(t for t in (KLAB.get(x.get('k'), ''), gp_a(x)) if t))) for x in others)
    if others:
        h += '<section class="rest"><h2 class="h-big">Keep wandering</h2>%s%s</section>' % (gpick(sel, opts=['Everything'] + gs) if len(gs) >= 3 else '', body)
    h += ('<section class="years"><p class="kick">See other years</p><div class="swipe yrs"><a class="yr" data-go="s1" href="#">2027</a>%s</div></section>') % ''.join(
         ('<span class="yr off">2020–21 · no festival</span>' if x == '2019' else '') + '<a class="yr%s" data-go="y%s" href="#">%s</a>' % (' on' if x == y else '', x, x) for x in YEARS)
    return h

YP = {y: year_page(y) for y in YEARS}

# ---------- early-year artist: Greg Brown 2006 ----------
P06 = d['yearBrand']['2006']
gb = {x['n']: x for x in d['past']['deep']}['Greg Brown']
SPOT = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 9.6c3.4-1 7-.7 10 1M7.6 12.6c2.8-.8 5.6-.5 8 .9M8.2 15.4c2.1-.6 4.2-.4 6 .7" fill="none" stroke="#F2CF62" stroke-width="1.6" stroke-linecap="round"/></svg>'
sug2 = [('The Barr Brothers', 2012, 'disc', 'i/p9942.jpg'), ('Frazey Ford', 2010, 'disc', 'i/p9920.jpg'), ('Madison Cunningham', 2023, 'disc', 'i/y23p-madisoncunningham.jpg'),
        ('Hurray For The Riff Raff', 2016, 'disc', 'i/p9727.jpg'), ('Laura Veirs', 2011, 'deep', 'i/p10104.jpg')]
s6 = header('Greg Brown', 'Pickathon 2006')
s6 += ('<section class="ahero" style="--paper:%s;--ink:%s;--ink2:%s"><div class="stripe">%s</div><div class="ah-in">'
       '<button class="starb dark" aria-label="Add to my top five">%s</button>'
       '<div class="ah-art"><img src="%s" alt="Pickathon 2006 poster art">%s</div>'
       '<p class="krow"><span class="k">Legend</span><span class="g">Folk</span></p><h1>Greg Brown</h1>'
       '<p class="ah-meta">Pickathon 2006</p><a class="ah-link" href="#">See the whole 2006 lineup %s</a></div></section>') % (
       P06['paper'], P06['ink'], P06['ink2'], ''.join('<i style="background:%s"></i>' % c for c in P06['stripe'][:3]),
       ICON['star'], img(d['yearLogo']['2006'], 520, fmt='PNG'), play('lg'), ICON['arrow'])
s6 += ('<section class="acts"><div class="trk"><span class="trk-n" aria-hidden="true">%s</span><div><b>Kokomo</b><span>From the Pickathon 2006 CD</span></div></div>'
       '<a class="btn gold" href="#">%s Play on Spotify</a>'
       '<div class="row2"><a class="btn line" href="#">%s Listen to Greg Brown</a><button class="btn line sq" aria-label="Share">%s</button></div></section>') % (
       ICON['note'], SPOT, ICON['note'], ICON['share'])
s6 += '<section class="liner"><p class="kick">Liner notes</p><p class="lead">%s</p></section>' % E(gb['l'])
s6 += '<section class="theirs"><p class="kick">Their Pickathons</p><div class="filt"><a class="chip on" href="#">Pickathon 2006</a></div></section>'
s6 += shelf('Same sound, other summers', 'IF YOU LIKE GREG BROWN', 'Folk and songwriter acts who stand about where he stands today.', '',
            [card(n, y, k, 'Folk', img(p, 520), '50% 35%') for n, y, k, p in sug2]).replace(
            '<span class="sa-n"></span><span class="sa-t">See all If You Like Greg Brown', '<span class="sa-n"></span><span class="sa-t">More folk')

CSS = open(ROOT + 'style.css').read()
FONTS = ("@font-face{font-family:'Pickathon 2014';src:url(%s) format('truetype');font-display:block}"
         "@font-face{font-family:'Bricolage Grotesque';src:url(%s) format('woff2');font-weight:200 800;font-display:block}") % (
         b64(APP + 'fonts/pickathon-2014.ttf', 'font/ttf'),
         b64(ROOT + 'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'font/woff2'))
JS = open(ROOT + 'app.js').read()

page = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Pickathon phone mockups: Lineup, year and artist pages (draft 1)</title><style>%s%s</style></head><body>'
        '<div class="mockbar" aria-label="Mockup screens"><span>Mockup</span>'
        '<button class="on" data-s="s1">2027</button><label class="mb-sel">Year <select id="ysel"><option value="">Pick a year</option>%s</select></label>'
        '<button data-s="s3">Artist: Geese</button><button data-s="s6">Artist: Greg Brown</button></div>'
        '<div class="phone"><main id="s1" class="screen">%s</main>%s<main id="s3" class="screen" hidden>%s</main><main id="s6" class="screen" hidden>%s</main>%s</div>'
        '<script>%s</script></body></html>') % (FONTS, CSS, ''.join('<option value="y%s">%s</option>' % (y, y) for y in YEARS), s1,
        ''.join('<main id="y%s" class="screen" hidden>%s</main>' % (y, YP[y]) for y in YEARS), s3, s6, TABBAR, JS)

# ---------- every artist page, one template (Nov 20 2026) ----------
import re as _re
def _slug(s): return _re.sub('[^a-z0-9]', '', s.lower())
_NAMES = {}
for _y, _lst in d['yearBill'].items():
    for _x in _lst: _NAMES.setdefault(_slug(_x['n']), _x['n'])
for _x in d['past']['deep']: _NAMES.setdefault(_slug(_x['n']), _x['n'])
for _k, _v in list(_NAMES.items()):
    if _k.startswith('the') and len(_k) > 5: _NAMES.setdefault(_k[3:], _v)  # actPages drops a leading 'The'
_KIN = {}
for _y, _lst in d['yearBill'].items():
    for _x in _lst: _KIN.setdefault(_x['n'], []).append((int(_y), _x))
def _cls(name, yr):
    for y, x in _KIN.get(name, []):
        if str(y) == str(yr): return x
    return None
def art_page(slug, ap):
    name = _NAMES[slug]; yr = str(ap.get('yr') or max([y for y, _ in _KIN.get(name, [])] or [2024]))
    if not str(ap.get('hero','')).startswith(('i/', 'ext/')) or not os.path.exists(_src(ap['hero'])):
        ap = dict(ap, hero=d['yearLogo'][yr] if yr in d['yearLogo'] else 'logo27-gold.png')
    ap = dict(ap, gal=[p for p in (ap.get('gal') or []) if str(p.get('i','')).startswith(('i/', 'ext/')) and os.path.exists(_src(p['i']))])
    x = _cls(name, yr) or {}
    k = x.get('k', 'none'); g = x.get('g', '')
    P = d['yearBrand'].get(yr, P24)
    h = header(name, 'Pickathon ' + yr)
    h += ('<section class="hero hact"><img src="%s" alt="" style="object-position:%s"><div class="hero-sc"></div>'
          '<div class="hero-tx"><p class="krow"><span class="k k-%s">%s</span>%s</p><h1>%s</h1><p class="ah-meta">Pickathon %s</p></div></section>') % (
          img(ap['hero'], 780), ap.get('hpos', '50% 40%'), k, KLAB.get(k, ''), ('<span class="g">%s</span>' % E(gp_n(name, GSHORT.get(g, g)))) if (gp_n(name) or g) else '', E(name), yr)
    story = [s for s in (ap.get('story') or []) if s.get('t')]
    if story:
        h += '<section class="liner"><p class="kick">Liner notes</p><p class="lead">%s</p>' % E(story[0]['t'])
        for s in story[1:]:
            if s.get('h'): h += '<h3>%s</h3>' % E(s['h'])
            h += '<p class="body">%s</p>' % E(s['t'])
        h += '</section>'
    gal = ap.get('gal') or []
    if gal:
        h += '<section class="shelf photos"><div class="sh-h"><div><p class="kick">Photos</p><h2>Pickathon %s</h2></div></div><div class="swipe">' % yr
        for p in gal[:8]:
            h += '<figure class="ph"><img src="%s" alt="" style="object-position:%s"><figcaption>%s%s</figcaption></figure>' % (
                img(p['i'], 600), p.get('pos', '50% 50%'), E(p.get('st', '')), '')
        h += '</div></section>'
    clips = [r for r in d['yearReel'].get('2026', []) if norm(r['n']) == norm(name) and r.get('v') and r.get('i') and loc(r['i']) and 'poster' not in r['i']]
    if clips:
        h += '<section class="shelf vids"><div class="sh-h"><div><p class="kick">Filmed on the farm</p><h2>Videos · Pickathon 2026</h2></div></div><div class="swipe">'
        for r in clips:
            h += ('<div class="vid" role="button" tabindex="0" data-clip="%s"><span class="vth"><img src="%s" alt="" style="object-position:50%% 40%%">%s</span>'
                  '<b>%s</b><span>%s · Pickathon 2026</span></div>') % (_h.escape(r['v'], quote=True), img(r['i'], 600), play('sm'), E(name), E(r.get('sg', '')))
        h += '</div></section>'
    vids2 = ap.get('vids') or []
    if vids2:
        h += '<section class="shelf vids"><div class="sh-h"><div><p class="kick">Videos</p><h2>Pickathon</h2></div></div><div class="swipe">'
        for v in vids2:
            h += ('<div class="vid" role="button" tabindex="0" data-clip="%s"><span class="vth"><img src="%s" alt="" style="object-position:50%% 40%%">%s</span>'
                  '<b>%s</b><span>%s</span></div>') % (_h.escape(v['u'], quote=True), img(v['i'], 600), play('sm'), E(name), E(v['sg']))
        h += '</div></section>'
    years = sorted({y for y, _ in _KIN.get(name, [])})
    if years:
        h += '<section class="theirs"><p class="kick">Their Pickathons</p><div class="filt">%s</div></section>' % ''.join(
            '<a class="chip%s" href="#">Pickathon %s</a>' % (' on' if str(y) == yr else '', y) for y in years)
    # Nov 21: class from the live table at the act's first year (never hard-coded); matched on genre, then nearest in size (Zale, Nov 19)
    _me = x.get('m') or 0
    same = []
    for p in d['past']['deep']:
        if p['n'] == name or not p.get('g') or p.get('g') != g or not str(p.get('pi','')).startswith('i/') or not os.path.exists(APP + p['pi']): continue
        c = _cls(p['n'], p.get('pyr')) or {}
        if c.get('k') not in ('disc', 'leg', 'deep'): continue
        same.append((abs((c.get('m') or 0) - _me), p, c['k']))
    same = [(p, kk) for _, p, kk in sorted(same, key=lambda t: t[0])[:5]]
    if same:
        h += shelf('Same sound, other summers', 'IF YOU LIKE %s' % name.upper(), 'Acts who stand about where %s stands.' % name, '',
                   [card(p['n'], p['pyr'], kk, GSHORT.get(p.get('g',''), p.get('g','')), img(p['pi'], 520)) for p, kk in same])
    return ('<main id="a-%s" class="screen" hidden style="--paper:%s;--ink:%s;--ink2:%s">%s</main>') % (slug, P['paper'], P['ink'], P['ink2'], h)
ARTISTS = {}
for _s, _ap in d['actPages'].items():
    if _s in _NAMES:
        try:
            ARTISTS[_s] = art_page(_s, _ap)
        except Exception as _e:
            print('skip', _s, _e)
# pages for the acts the lineup has but no artist page yet (Nov 20, Lineup's join): lineup facts only, no story or photos yet
_OWN = {'altngn': 'altngn', 'anasmitchell': 'anasmitchell', 'billywoods': 'billywoods', 'elucid': 'elucid', 'laiththetexasbirds': 'laiththetexasbirds',
        'scottlaw': 'scottlaw', 'sundayvalley': 'sundayvalley', 'theearnestlovers': 'theearnestlovers', 'themidnightshivers': 'themidnightshivers',
        'calebklauder': 'calebklauder', 'calebklauderreebwillms': 'calebklauderreebwillms'}
# Nov 21 (Zale): every Music act on a year's lineup gets a page; acts with no story yet get the lineup-facts page
for _yy, _lst in d['yearBill'].items():
    for _x in _lst:
        if _x.get('c'): continue
        _sx = _slug(_x['n']); _tx = _ALIAS.get(_sx, _sx)
        if _tx in d['actPages'] or (_tx.startswith('the') and _tx[3:] in d['actPages']) or _tx in _OWN: continue
        if _tx == _sx: _OWN[_tx] = _tx
print('roster: added %d lineup acts (%d Music), %d site rows not in Lineup By Year, %d spelling differences, %d held for Lineup' % (
    len(ROSTER_LOG['added']), sum(1 for a in ROSTER_LOG['added'] if a[1] == 'Music'), len(ROSTER_LOG['dropped']), len(ROSTER_LOG['renamed']), len(ROSTER_LOG['held'])))
json.dump(ROSTER_LOG, open(ROOT + 'roster_log.json', 'w'), ensure_ascii=False, indent=1)
_GROUP = {}
for _k, _v in list(_ALIAS.items()) + [(o, o) for o in _OWN]:
    _GROUP.setdefault(_v, set()).update({_k, _v})
for _o in _OWN:
    if _o not in ARTISTS and _o in _NAMES and _NAMES[_o] in _KIN:
        _g = _GROUP.get(_o, {_o})
        _ph = []
        for _yy, _m in d['yearPhotos'].items():
            for _nn, _p in _m.items():
                if _slug(_nn) in _g and _p.get('i'):
                    _ph.append({'i': _p['i'], 'st': '%s%s' % (_yy, (' · ' + _p['s']) if _p.get('s') else ''), 'pos': fpos(_p['i'])})
        _vi = []
        for _v in sorted(d['videos'], key=lambda v: v.get('y') or 0):
            if _slug(_v.get('a') or '') in _g and _v.get('vm') and _v.get('vh') and _v.get('y'):
                _vi.append({'u': 'https://vimeo.com/%s/%s' % (_v['vm'], _v['vh']), 'i': '', 'sg': '%s · %s' % (_v['y'], _v.get('s') or _v.get('vn') or '')})
        _thumb = next((p['i'] for p in _ph if os.path.exists(_src(p['i']))), None)  # a video card needs a still; no photo, no card
        for _x in _vi: _x['i'] = _thumb or ''
        _vi = [x for x in _vi if x['i']]
        _hp = next((p for p in _ph if os.path.exists(_src(p['i']))), None)
        _apo = {'yr': str(min(int(y) for y, _ in _KIN[_NAMES[_o]])), 'gal': [p for p in _ph if p is not _hp][:8], 'vids': _vi}
        if _hp: _apo.update(hero=_hp['i'], hpos=_hp['pos'])
        ARTISTS[_o] = art_page(_o, _apo)
print(len(ARTISTS), 'artist pages generated')
_ASEL = '<label class="mb-sel">Artist <select id="asel"><option value="">Pick an artist</option>%s</select></label>' % ''.join(
    '<option value="%s">%s</option>' % (s, E(_NAMES[s])) for s in sorted(ARTISTS, key=lambda s: _NAMES[s].lower()))
_ASCRIPT = ('<script>document.getElementById("asel").addEventListener("change",function(e){var v=e.target.value;if(!v)return;'
            'document.querySelectorAll(".screen").forEach(function(m){m.hidden=true;});var m=document.getElementById("a-"+v);'
            'if(m){m.hidden=false;window.scrollTo(0,0);}});</script>')

page = page.replace('<button data-s="s3">', _ASEL + '<button data-s="s3">', 1).replace('<nav class="tabs">', ''.join(ARTISTS.values()) + '<nav class="tabs">', 1).replace('</body>', _ASCRIPT + _PLAYER + '</body>')
# name variants and collab billings that point at a page we have (Zale, Nov 20: "those names obviously map to an artist")
_PIDS0 = set(_re.findall(r'id="a-([a-z0-9]+)"', page))
page = _re.sub(r' data-art="([a-z0-9]*)"', lambda m: (' data-art="%s"' % _ALIAS[m.group(1)]) if (m.group(1) in _ALIAS and _ALIAS[m.group(1)] in _PIDS0) else m.group(0), page)
# names with no artist page keep no link (a tap must never go nowhere); the gaps are listed in the build log
_PIDS = set(_re.findall(r'id="a-([a-z0-9]+)"', page))
_DROP = sorted({m.group(1) for m in _re.finditer(r' data-art="([a-z0-9]*)"', page) if m.group(1) not in _PIDS and _re.sub(r'^the', '', m.group(1)) not in _PIDS})
page = _re.sub(r' data-art="([a-z0-9]*)"', lambda m: m.group(0) if (m.group(1) in _PIDS or _re.sub(r'^the', '', m.group(1)) in _PIDS) else '', page)
print('names without an artist page (no link):', len(_DROP), _DROP)
open(OUT + 'index.html', 'w').write(page)
print(len(page) // 1024, 'KB html', len(os.listdir(OUT + 'img')), 'images', sum(os.path.getsize(OUT + 'img/' + f) for f in os.listdir(OUT + 'img')) // 1024, 'KB')
