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
# r73 (Zale, Nov 22 21:53): an artist page's big play button plays every song that act has from that year, as one playlist
CLIPYL = {}
for _o in _LC:
    _u = _o['url'].split('&')[0]; _sg = (_o.get('tail') or '').split(' | ')[-1].strip() if _o.get('tail') else ''
    for _nm in {_o['act'], _o['artist'], _o['act_id'].replace('-', ' ')}:
        _ks = ''.join(ch for ch in _ud.normalize('NFD', _nm.lower()) if ch.isalnum())
        _l = CLIPYL.setdefault((_ks, str(_o['y'])), [])
        if _u not in [x[0] for x in _l]: _l.append((_u, _sg if len(_sg) < 60 else ''))
# r57 (Zale, Nov 22 19:57): a year reel plays only that year's recordings; an act not recorded that year gets no reel frame
YURLS = {}
for _v in d['videos']:
    if _v.get('y'):
        _u = _vurl(_v)
        if _u: YURLS.setdefault(str(_v['y']), set()).add(_u.split('&')[0])
for _o in _LC: YURLS.setdefault(str(_o['y']), set()).add(_o['url'].split('&')[0])
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

def year_clip(n, y):
    """r57: that year's song for the act, or nothing (never another year's recording)."""
    n2 = _CLIPALIAS.get(n, n); k = ''.join(ch for ch in _ud.normalize('NFD', n2.lower()) if ch.isalnum())
    return CLIPY.get((k, str(y)), '')

def act_queue(n, y):
    """r51 (Zale, Nov 22): the sitewide player takes a list. An Archive card queues the act's own songs across the years:
    its own year first, then later years, then earlier ones. Format: url|caption;;url|caption"""
    n2 = _CLIPALIAS.get(n, n); k = ''.join(ch for ch in _ud.normalize('NFD', n2.lower()) if ch.isalnum())
    yrs = sorted(int(yy) for (kk, yy) in CLIPY if kk == k); y = int(y)
    seen, out = set(), []
    for yy in [y] + [a for a in yrs if a > y] + [a for a in reversed(yrs) if a < y]:
        u = CLIPY.get((k, str(yy)))
        if u and u not in seen: seen.add(u); out.append('%s|%s · Pickathon %s' % (u, n, yy))
    return ';;'.join(out)
def photo_play(url, n, q=''):
    """r36 (Zale, Nov 22): on a card with a song, the whole photo plays it; the ring is centered and only marks it.
    The name and 'Their story' open the artist page."""
    return ('<span class="pz" data-clip="%s"%s role="button" tabindex="0" aria-label="Play a song by %s">'
            '<span class="ring sm"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" fill="#fff"/></svg></span></span>') % (_h.escape(url, quote=True), (' data-q="%s"' % _h.escape(q, quote=True)) if q else '', E(n))
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

_YW = None
def year_wall(cur):
    """r59: every year's own logo in a grid, newest first; 2020-21 shown as a quiet note (no festival)."""
    global _YW
    if _YW is None:
        tiles = ['<button type="button" class="yw-i" data-go="s1" data-y="2027"><span class="yw-l"><img loading="lazy" src="%s" alt=""></span><b>2027</b></button>' % LOGO]
        for yy in sorted(d['yearBill'].keys(), reverse=True):
            if yy == '2019': tiles.append('<span class="yw-i yw-off"><span class="yw-l"><i>No festival</i></span><b>2020–21</b></span>')
            lg = d['yearLogo'].get(yy)
            # r82 (Artwork artwork-51, Zale approved Nov 23 21:06-23:05): small year marks use the hand-cut year icons (two-ring edge, same square every year)
            _ic = 'ext/icons/y%s-icon.png' % yy[2:]
            if os.path.exists(ROOT + _ic): lg = _ic
            pic = ('<img loading="lazy" src="%s" alt="">' % img(lg, 160 if 'icons/' in lg else 220, fmt='PNG')) if lg and not lg.startswith('http') and os.path.exists(_src(lg)) else '<i>%s</i>' % yy
            tiles.append('<button type="button" class="yw-i" data-go="y%s" data-y="%s"><span class="yw-l">%s</span><b>%s</b></button>' % (yy, yy, pic, yy))
        _YW = ''.join(tiles)
    w = _YW.replace('data-y="%s"' % cur, 'data-y="%s" aria-current="true"' % cur, 1)
    return ('<div class="ywall" hidden role="dialog" aria-label="Choose a Pickathon year"><div class="yw-h"><p>Pick a year</p>'
            '<button type="button" class="yw-x" aria-label="Close">×</button></div><div class="yw-g">%s</div></div>') % w

def header(title, sub, back=True, chip=None, wall=True):
    t = '<span class="hd-t"><b>%s</b>%s</span>' % (E(title), ('<i>%s</i>' % E(sub)) if sub else '')
    # r52 (Zale, Nov 22 18:35): the live app strips this page's header, so the year switch lives in its own bar under the sale strip
    if chip:
        # r45 (Zale, Nov 22): the year switch must be obvious on every Lineup page, 2027 included: 'Lineup 2027 >' opens every year
        # r59 (Zale, Nov 22 20:20): the gold button opens a wall of year logos; tap a logo to go to that year (one chooser everywhere)
        bar = ('<div class="yrbar"><button type="button" class="yrchip ywopen" aria-expanded="false" aria-label="Lineup %s. Choose another year">'
               '<span class="yc-k">Lineup</span><b class="yc-y">%s</b><span class="yc-a" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M4 1.5l5 4.5-5 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>'
               '</div>%s') % (chip, chip, year_wall(chip))
        if not wall: bar = ''  # r75: artist pages share one wall for the whole site (.ywall-g)
        # r68 (Zale, Nov 22 21:22): the header title IS the year chooser; tap "Lineup 2013" to open the wall of year logos
        # r69 (Zale, Nov 22 21:26): the year's own logo leads the chooser in the header (it replaces the 2027 wordmark on year pages)
        # r70 (Zale, Nov 22 21:40): the 2027 logo and back stay on the left as home; the chooser is a centered, words-only button (no small year logo: it blurs at header size)
        t = ('<span class="hd-sp hd-sp1"></span><button type="button" class="hd-t hd-yr ywopen" data-y="%s" aria-expanded="false" aria-label="Lineup %s. Choose another year"><b>Lineup</b><i>%s</i>'
             '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>') % (chip, chip, chip)
        if not wall:  # r89c (Zale, Nov 24 09:10): on an artist page the button follows that page's year and goes to the top of that year's lineup
            t = ('<span class="hd-sp hd-sp1"></span><a href="#" class="hd-t hd-yr" data-go="y%s" aria-label="Go to the Pickathon %s lineup"><b>Lineup</b><i>%s</i>'
                 '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5l3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>') % (chip, chip, chip)
    else:
        bar = ''
    _plh = d.get('playlistMain', {}).get(str(chip)) if chip else None  # r91: the note follows the page's year
    _la = (' data-sp="https://open.spotify.com/playlist/%s" aria-label="Listen to the Pickathon %s lineup"' % (_plh, chip)) if _plh else ' aria-label="Listen"'
    return ('<header class="hd">%s<img class="hd-logo" src="%s" alt="Pickathon 2027"><span class="hd-rule"></span>%s'
            '<span class="hd-sp"></span><button class="hd-listen"' + _la + '>%s</button><button class="hd-ic" aria-label="Search">%s</button></header>'
            '<div class="sale"><span><b>Holiday Sale</b> · from $483</span><a href="#" class="sale-b">Get tickets <svg viewBox="0 0 12 12" width="11" height="11"><path d="M4 1.5l5 4.5-5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>' + bar
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

def now_html(acts, rest=False, then=False):
    mk = (lambda a: a.get('mb') or 0) if then else (lambda a: a.get('m') or 0)
    ms = [mk(a) for a in acts] or [1]; mx, mn = max(ms), min(ms); out = ''
    for a in acts:
        v = (mk(a) - mn) / (mx - mn) if mx > mn else 1.0
        out += '<span class="pn" style="--s:%.3f" data-c="%s" data-art="%s" data-an="%s">%s</span>' % (v, ctag(a.get('kb', 'none') if then else a['k']), _aslug(nm(a)), E(a['n']), E(nm(a)))
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
            '<div class="po-ctl"><button class="po-b on" data-m="then">Lineup %s</button><span class="po-track"><i class="po-knob" role="slider" tabindex="0" aria-label="Slide from %s to today" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"><b class="po-yr" data-y0="%s">%s</b></i></span><button class="po-b" data-m="now">Lineup today</button></div>'
            '<div class="po-names then">%s<div class="po-rest" hidden>%s</div></div><div class="po-names now" hidden>%s<div class="po-rest" hidden>%s</div></div>'
            '<button class="po-all" data-open="Show the top ten" data-shut="See the whole bill · %d bands">See the whole bill · %d bands</button>'
            '<p class="po-tap">Tap any name</p></div>%s</section>') % (
            P['paper'], P['ink'], P['ink2'], P['band'], yr, cloud, badge, yr, dates, yr, yr, yr, yr, yr, yr,
            now_html(then[:10], then=True), now_html(then[10:], True, then=True), now_html(now[:10]), now_html(now[10:], True), total, total, stripe)
    html_ = html_.replace('poster JOIN', 'poster joined' if joined else 'poster solo')
    if not ranked:
        a = html_.index('<div class="po-ctl">'); b = html_.index('<div class="po-names then">')
        html_ = html_[:a] + html_[b:]
    # r91 (Zale, Nov 24 09:55, picked note + one quiet line): the year's lineup playlist, opened in the visitor's service (Spotify for now)
    _pl = d.get('playlistMain', {}).get(str(yr))
    if _pl:
        _u = 'https://open.spotify.com/playlist/' + _pl
        html_ = html_.replace('<p class="po-tap">Tap any name</p>', '<p class="po-tap">Tap any name</p><a class="po-listen" href="%s" data-sp="%s">Hear the %s lineup <span aria-hidden="true">&rarr;</span></a>' % (_u, _u, yr), 1)
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
    elif yr == '2003':  # r56: a line of Artwork's redrawn horseshoes (artwork-45), like 2023's firs
        f = img('ext/art/y03-horseshoe-redraw.png', 160, fmt='PNG')
        art = row(f, 0, 9, 36, 44)
    elif yr == '2004':  # r56: a line of tonic bottles (artwork-45)
        f = img('ext/art/y04-tonic-redraw-bottle.png', 200, fmt='PNG')
        art = row(f, 0, 9, 54, 72)
    elif yr in ('2001', '2002'):  # r56: the year's redrawn wordmark standing on the ground, over the kit's hills
        wm = img('ext/art/y01-wordmark-redraw-cutout.png' if yr == '2001' else 'ext/art/y02-tiles-wordmark-redraw-cutout.png', 700, fmt='PNG')
        c1 = P['light'] if P['light'].upper() != paper.upper() else P['warm']
        art = (('<svg class="sm-hill" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">'
                '<path fill="%s" d="M0 40c40-12 90-16 140-8 40 7 70 9 110 0 50-11 96-10 140 4V70H0z"/></svg>') % c1 +
               '<img class="sm-wm sm-wm%s" src="%s" alt="">' % (yr[2:], wm))
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
    # r55 (Zale, Nov 22 19:32): desktop shows 3 bigger cards across WITH the three-line blurb; phone (two-up) hides it in CSS
    h = h.replace('</span><span class="cstory">', '</span><span class="cline">%s</span><span class="cstory">' % E(ln), 1) if ln and '<span class="cstory">' in h else h
    q = act_queue(n, y)  # r51: the player queues this act's songs across the years, starting with this card's
    return h.replace('<span class="pz" data-clip=', '<span class="pz" data-q="%s" data-clip=' % _h.escape(q, quote=True), 1) if q.count(';;') else h
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

# r47 (Zale, Nov 22: "one mixed feed"): the Archive opens on All, every class mixed, biggest today first (class table magnitude_dec);
# an act held in two classes shows once under All (its bigger card); Discoveries / Legends / Deep cuts stay as filters, each by magnitude too
_magall = {}
for _r in csv.DictReader(open(ROOT + 'class_table_v163.csv', encoding='utf-8')):
    if _r.get('site_row') != 'yes': continue
    try: _mv = float(_r.get('magnitude_dec') or 0)
    except ValueError: continue
    for _nm in {_r.get('lineup_act') or '', _r['act']}:
        if _nm: _magall[(_canon(_nm), _r['year'])] = max(_mv, _magall.get((_canon(_nm), _r['year']), 0))
def _mg(x): return _magall.get((_canon(x[0]), str(x[1])), 0)
for _lst in (disc, leg, deep): _lst.sort(key=lambda x: (-_mg(x), x[0]))
ARCH_ALL, _seen = [], set()
for k, x in sorted([('disc', x) for x in disc] + [('leg', x) for x in leg] + [('deep', x) for x in deep], key=lambda t: (-_mg(t[1]), {'disc': 0, 'leg': 1, 'deep': 2}[t[0]], t[1][0])):
    if _canon(x[0]) in _seen: continue
    _seen.add(_canon(x[0])); ARCH_ALL.append((k,) + tuple(x))
print('archive All: %d cards (%d acts in two classes shown once)' % (len(ARCH_ALL), len(disc) + len(leg) + len(deep) - len(ARCH_ALL)))
bars = [(1, [58, 34]), (1, [70]), (2, [40, 44]), (2, [30, 26, 30]), (3, [22, 28, 20, 18]), (3, [18, 24, 16, 26]), (4, [14, 18, 12, 16, 14]), (4, [12, 16, 18, 12, 10])]
barh = ''.join('<div class="br b%d">%s</div>' % (lv, ''.join('<i style="width:%d%%"></i>' % w for w in ws)) for lv, ws in bars)
s1 = header('Lineup', 'Aug 5–8, 2027', back=False, chip='2027')
# r60 (Zale, Nov 22 20:18): 2027 gets the same paper frame on desktop, with no logo yet: plum frame, the year's horizon on top, a gold printed border on the poster card
P27 = {'paper': '#F2EDE3', 'ink': '#3B2935', 'light': '#E3B5CF', 'warm': '#F2CF62', 'stripe': ['#F2CF62', '#86526B', '#E3B5CF'], 'band': '#86526B'}
# r80 (Zale, Nov 23 18:24, LOCKED): the 2027 preview page, until the lineup is out. Poster first (no photo hero): text left, the "?" seal
# lockup and five rows of hidden names right; then "Wait, they played here?": Music Highlights as square cards, endless scroll,
# magnitude order feathered and reshuffled each visit, a sticky bar (kind of music, Full archive, N of M bands) and one ticket card
# after the first 24. Once the 2027 lineup is out, 2027 uses the same year template as 1999-2026 and this page retires.
# Parts: s1_2027.html / .css / .js (cut from the locked mock m16). Card data comes live from ARCH_ALL below.
_P27A = []
for _r, (k, n, y, g, p, pos) in enumerate(ARCH_ALL):
    _ga = [t for t in (gall_n(n, g) or '').split('|') if t]
    _gp = gp_n(n, g)
    if _gp in _ga: _ga.remove(_gp); _ga.insert(0, _gp)
    _cv = archive_clip(n, y); _q = act_queue(n, y)
    _P27A.append({'r': _r, 'g': _ga or [''], 'img': img(p, 520) if p else '', 'pos': pos or '50% 40%', 'kc': 'k-' + k, 'k': KLAB[k], 'y': str(y), 'n': n,
                  'a': _aslug(n), 'c': _cv or '', 'q': _q if _q.count(';;') else '',
                  'l': _ALINES.get('%s|%s|%s' % (k, ''.join(c for c in _ud.normalize('NFD', n.lower()) if c.isalnum() and ord(c) < 128), y), '')})
year_wall('')  # fills _YW
# r81 (Zale, Nov 23 18:55): one 'Every lineup has its own page' card in the wall after 48 bands; the year on each card opens that year
_YRS27 = _YW.split('</button>', 1)[1]  # every year but 2027
_SHEET = ('<div class="sheet" id="p27-sheet" hidden><div class="sheet-in"><p>What kind of music do you love?</p><button class="on" data-g="">Every kind</button>%s</div></div>'
          % ''.join('<button data-g="%s">%s</button>' % (E(t), E(t)) for t in TAGS15))
s1 += (open(ROOT + 's1_2027.html').read().replace('@SEAL', img('ext/y27-seal.png', 950, fmt='PNG')).replace('<i id="p27-tot">459</i>', '<i id="p27-tot">%d</i>' % len(_P27A))
       + _SHEET + '<style>%s</style>' % open(ROOT + 's1_2027.css').read().replace('url(y27/rays2400.png)', 'url(%s)' % img('ext/y27-rays2400.png', 2400, fmt='PNG')).replace('url(y27/rays.png)', 'url(%s)' % img('ext/y27-rays2400.png', 2400, fmt='PNG'))
       + '<script>%s</script>' % open(ROOT + 's1_2027.js').read().replace('__YRS__', _YRS27.replace('`', '')).replace('__ALL__', json.dumps(_P27A, ensure_ascii=False).replace('</', '<\\/')))
print('2027 preview wall: %d cards, %d with a song, %d with a blurb' % (len(_P27A), sum(1 for x in _P27A if x['c']), sum(1 for x in _P27A if x['l'])))

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

YREEL = {}
_RF = json.load(open(ROOT + 'reel_focus.json'))
# r66 (Copy Review copy_review-50, Nov 22): a three-line then -> now line for every Music act-year (473 that had none), from branch copy-review-nov22b data.json actYearLines
_AYL = {}
for _o in json.load(open(ROOT + 'act_year_lines.json', encoding='utf-8')):
    _AYL[(''.join(c for c in _ud.normalize('NFD', _o['n'].lower()) if c.isalnum() and ord(c) < 128), str(_o['y']))] = _o['l']
# r78 (Nov 22 23:05): Copy Review's newest lines ride in their stories_<year> CSVs (copy_review-55); those win over older lines
import glob as _gl0
_SLN = {}
for _f in sorted(_gl0.glob(ROOT + 'stories/stories_*.csv')):
    for _r in csv.DictReader(open(_f, encoding='utf-8-sig')):
        if _r.get('line'): _SLN[(''.join(c for c in _ud.normalize('NFD', _r['act'].lower()) if c.isalnum() and ord(c) < 128), str(_r['year']))] = _r['line']
# r87 (Zale, Nov 24 07:22, copy_review-59): three reels, three lines. The year reel uses Copy Review's year-reel line (what that summer
# meant, ~120 characters), the artist page photo uses the artist-reel line (what came after that visit); the card line stays the fallback.
_YRL, _ARL = {}, {}
def _k0(n): return ''.join(c for c in _ud.normalize('NFD', n.lower()) if c.isalnum() and ord(c) < 128)
for _f in sorted(_gl0.glob(ROOT + 'reels/reel_archive_set_*.csv')):
    for _r in csv.DictReader(open(_f, encoding='utf-8-sig')):
        if (_r.get('year_reel_new') or '').strip(): _YRL[(_k0(_r['act']), str(_r['year']))] = _r['year_reel_new'].strip()
        if (_r.get('artist_reel') or '').strip(): _ARL.setdefault((_k0(_r['act']), str(_r['year'])), _r['artist_reel'].strip())
for _f in sorted(_gl0.glob(ROOT + 'reels/artist_reel_*.csv')):
    for _r in csv.DictReader(open(_f, encoding='utf-8-sig')):
        if (_r.get('artist_reel_line') or '').strip(): _ARL[(_k0(_r['act']), str(_r['year']))] = _r['artist_reel_line'].strip()
for _f in sorted(_gl0.glob(ROOT + 'stories/stories_changes_returns_*.csv')):
    for _r in csv.DictReader(open(_f, encoding='utf-8-sig')):
        if (_r.get('artist_reel_line') or '').strip(): _ARL[(_k0(_r['act']), str(_r['year']))] = _r['artist_reel_line'].strip()
print('reel lines: %d year-reel, %d artist-reel' % (len(_YRL), len(_ARL)))
def _rline(n, y, k):  # r50: the reel frame carries Copy Review's three-line card line (then -> now) when one exists
    sl_ = ''.join(c for c in _ud.normalize('NFD', n.lower()) if c.isalnum() and ord(c) < 128)
    if (sl_, str(y)) in _SLN: return _SLN[(sl_, str(y))]
    for kk in (k, 'disc', 'leg', 'deep'):
        v = _ALINES.get('%s|%s|%s' % (kk, sl_, y))
        if v: return v
    return _AYL.get((sl_, str(y)), '')
def _postimg(y):
    """r61 (Zale, Nov 22 20:23): the frame shows a close-up of that year's own poster art, washed in the frame color."""
    for p_ in ('i/y%s-poster.webp' % y[2:], 'i/y%s-centre.webp' % y[2:]):
        if os.path.exists(_src(p_)): return img(p_, 1400, 70)
    return 'data:,'
def _lum(c):
    r, g, b = (int(c[i:i+2], 16) / 255 for i in (1, 3, 5)); return .2126 * r + .7152 * g + .0722 * b
def _grl(c):
    v = [int(c[i:i+2], 16) / 255 for i in (1, 3, 5)]; v = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in v]
    return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]
def _gcr(a, b): la, lb = sorted([_grl(a), _grl(b)]); return (lb + .05) / (la + .05)
def _acc(P, bg='#2A2527'):
    """r71 (Zale, Nov 22 21:45, picked Light): the artist page's labels take the year's own boldest color that still reads 4.5:1 on the dark page."""
    import colorsys
    cs = [c for c in [P.get('warm'), P.get('light'), P.get('band'), P.get('ink2'), P['paper']] + list(P.get('stripe', [])) if c and len(c) == 7 and _gcr(c, bg) >= 4.5]
    def sc(c):
        r, g, b = (int(c[i:i+2], 16) / 255 for i in (1, 3, 5)); return max(r, g, b) - min(r, g, b)  # chroma: near-whites don't count as a color
    best = max(cs, key=sc) if cs else None
    return best if best and sc(best) >= .28 else '#D6B54A'  # no real color that reads: keep the site gold
def _mat(P):
    """r56c (Zale, Nov 22): the frame takes the year's boldest color; the poster and photo stay on paper below it."""
    import colorsys
    pa = P['paper'].upper()
    cs = [c for c in [P.get('band'), P.get('warm'), P.get('light')] + list(P.get('stripe', [])) if c and c.upper() != pa and len(c) == 7]
    def sc(c):
        r, g, b = (int(c[i:i+2], 16) / 255 for i in (1, 3, 5)); h_, l_, s_ = colorsys.rgb_to_hls(r, g, b)
        return s_ * (1 - abs(l_ - .45) * 1.4)
    return max(cs, key=sc) if cs else P['band']
EARLY_ART = {y_: 'ext/art/y%s-art-centre.png' % y_[2:] for y_ in ['2000','2001','2002','2003','2004','2005','2006'] if os.path.exists(ROOT + 'ext/art/y%s-art-centre.png' % y_[2:])}
def _hzn(y, where):
    """r93 MOCK (Zale, Nov 24 10:09; artwork-52 PREVIEW, not final): Artwork's top-edge horizon, art only, on the dark bar, its flat bottom on
    the line where the bar meets the page; the same strip on the year page and that year's artist pages. Decision due before the push."""
    f = 'ext/horizons/y%s-horizon.png' % str(y)[2:]
    if not os.path.exists(ROOT + f): return ''
    return '<div class="hzn hzn-%s" aria-hidden="true"><img src="%s" alt=""></div>' % (where, img(f, 2400, fmt='PNG'))
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
    h += _hzn(y, 'yr')
    reel = d['yearReel'].get(y, []); r0 = reel[0] if reel else None
    hero = None
    if r0 and loc(r0.get('i')) and 'poster' not in r0['i']:
        kk = (r0.get('k') or '').split(' · ')
        _hv = r0.get('v', '') if (r0.get('v') or '').split('&')[0] in YURLS.get(y, ()) else ''  # r57: same-year song or none
        hero = (r0['i'], r0['n'], kk[0] if kk else '', kk[1] if len(kk) > 1 else '', r0.get('l', ''), bool(_hv), _hv)
    elif ten and ph(ten[0]):
        a0 = ten[0]; hero = (ph(a0), a0['n'], KLAB[a0['k']], gp_a(a0), '', False, '')
    # r45 (Zale, Nov 22): every year opens on a ten-band reel built from TODAY's magnitude (class table magnitude_dec), top act first.
    # Photo: that year's catalog photo, else a same-year reel or video frame. Song: that year's clip, else the nearest later year, then earlier.
    # Plays on its own, 4 seconds a frame, hard cut (no crossfade); tap a segment to jump; tap the photo to play the song.
    _ov = {r['n']: r for r in reel}
    sl = []
    _ovc = {_canon(r['n']): r for r in reel}
    for a in today:
        o = _ov.get(a['n']) or _ovc.get(_canon(a['n'])) or {}
        rp = o.get('i') if (o.get('i') and loc(o['i']) and 'poster' not in o['i']) else ''
        p = ph(a) or rp or ARCHF.get((_canon(a['n']), y), '')
        clip = year_clip(a['n'], y) or (o.get('v') if (o.get('v') or '').split('&')[0] in YURLS.get(y, ()) else '')
        if not p or 'poster' in p or not clip or p in _RF['drop']: continue  # every frame plays a song (Zale: 'we go to different videos if we can't find them')
        _fx = _RF['focus'].get(p)
        sl.append({'i': img(p, 1100, 80), 'raw': p, 'pos': ('%s%% %s%%' % tuple(_fx)) if _fx else fpos(p, FOC), 'n': a['n'], 'k': KLAB[a['k']], 'g': gp_a(a), 'l': _YRL.get((_k0(a['n']), str(y))) or _rline(a['n'], y, a['k']) or o.get('l', ''), 'clip': clip, 'sg': ''})
        if len(sl) == 10: break
    if not sl and hero:
        sl = [{'i': img(hero[0], 1100, 80), 'raw': hero[0], 'n': hero[1], 'k': hero[2], 'g': hero[3], 'l': hero[4], 'clip': hero[6], 'sg': ''}]
    YREEL[y] = sl
    _top = len(h)  # r49: hero + poster share one band (side by side on desktop)
    if sl: hero = hero or (sl[0]['raw'],)
    if hero:
        if sl:
            kc = {'Discovery': 'disc', 'Legend': 'leg', 'Deep cut': 'deep'}.get(sl[0]['k'], 'none')
            segs = ''.join('<i data-slide="%d"%s><b></b></i>' % (k, ' class="on"' if k == 0 else '') for k in range(len(sl)))
            sattr = ' data-slides="%s"' % html.escape(json.dumps(sl), quote=True)
            h += ('<section class="hero hyr reel"%s><img src="%s" alt="" style="object-position:%s" data-clip="%s"><div class="hero-sc"></div><div class="segs">%s</div><span class="hyr-y">%s</span>%s'
                  '<div class="hero-tx"><p class="krow"><span class="k k-%s">%s</span><span class="g">%s</span></p><h1 class="act%s">%s</h1>%s</div></section>') % (
                  sattr, sl[0]['i'], sl[0].get('pos') or fpos(sl[0]['raw'], FOC), E(sl[0]['clip']), segs, y, clip_ring(sl[0]['clip'], 'lg'),
                  kc, E(sl[0]['k']), E(sl[0]['g']), ' sm' if len(sl[0]['n']) > 12 else '', E(sl[0]['n']), ('<p class="hero-sub">%s</p>' % E(sl[0]['l'])) if sl[0]['l'] else '')
        else:
            h += ('<section class="hero hyr"><img src="%s" alt="" style="object-position:%s"><div class="hero-sc"></div><div class="segs">%s</div><span class="hyr-y">%s</span>%s'
                  '<div class="hero-tx"><p class="krow"><span class="k k-%s">%s</span><span class="g">%s</span></p><h1 class="act%s">%s</h1>%s</div></section>') % (
                  img(hero[0], 1100, 80), fpos(hero[0], FOCH), '<i class="on"></i>' + '<i></i>' * (max(1, min(10, len(reel))) - 1), y, clip_ring(hero[6], 'lg'),
                  kc, E(hero[2]), E(hero[3]), ' sm' if len(hero[1]) > 12 else '', E(hero[1]), ('<p class="hero-sub">%s</p>' % E(hero[4])) if hero[4] else '')
    if y == '2024':
        badge = img('i/y24-badge-keyline.png', 460, fmt='PNG')
    elif y in EARLY_ART:
        badge = img(EARLY_ART[y], 460, fmt='PNG')  # r56: Artwork's approved 2000-2006 piece (artwork-46)
    else:
        badge = img(d['yearLogo'][y], 460, fmt='PNG')
    # r45 (Zale, Nov 22): the booking view is ordered and sized by AT-FESTIVAL magnitude (class table at_festival_magnitude_dec) from 2009 on; earlier years keep the printed poster order
    then_list = sorted(music, key=lambda x: -(x.get('mb') if x.get('mb') is not None else -1)) if (ranked and int(y) >= 2009) else music
    h += poster_block(P, badge, y, then_list, today_all, len(music), joined=bool(hero), ranked=ranked)
    # r56 (Zale, Nov 22): paper frame. The year's own art runs along the top (desktop), and the poster paper wraps photo and poster like a printed poster with a photo window
    _crown = '<div class="yrcrown" aria-hidden="true">%s</div>' % seam(y, P)
    _st = (list(P.get('stripe', [])) + [P['ink']] * 3)[:3]
    _pale = _lum(P['paper']) > .82
    _tint = _mat(P)
    def _mix(a, b, t): return '#%02X%02X%02X' % tuple(round(int(a[i:i+2], 16) * (1 - t) + int(b[i:i+2], 16) * t) for i in (1, 3, 5))
    def _rl(c):
        v = [int(c[i:i+2], 16) / 255 for i in (1, 3, 5)]; v = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in v]
        return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]
    def _dist(a, b): return sum((int(a[i:i+2], 16) - int(b[i:i+2], 16)) ** 2 for i in (1, 3, 5)) ** .5
    def _cr(a, b): la, lb = sorted([_rl(a), _rl(b)]); return (lb + .05) / (la + .05)
    _txt = [c for c in (P['ink'], P.get('ink2'), P.get('band')) if c and len(c) == 7 and _cr(c, P['paper']) >= 4.5]
    _pnl = P['paper']
    # r61 (Zale, Nov 22 20:23: "too much white still"): the panel takes one of the poster's own colors when every text color still reads 4.5:1 on it
    _bold = [c for c in [P.get('light'), P.get('warm')] + list(P.get('stripe', [])) if c and len(c) == 7 and _lum(c) < .9 and _dist(c, P['paper']) > 40 and all(_cr(x, c) >= 4.5 for x in _txt)]
    if _bold:
        import colorsys as _cs
        _pnl = max(_bold, key=lambda c: _cs.rgb_to_hls(*[int(c[i:i+2], 16) / 255 for i in (1, 3, 5)])[2])
    # r62 (Zale, Nov 22 20:29: "less white, more frequently"): no readable poster color for the panel -> a dark panel in the year's band color with light names
    _dark = None
    if not _bold and _cr(P['paper'], P['band']) >= 4.5:
        _lt = [c for c in [P.get('light'), P.get('warm')] + list(P.get('stripe', [])) if c and len(c) == 7 and _cr(c, P['band']) >= 4.5 and _dist(c, P['paper']) > 40]
        _dark = (P['band'], P['paper'], _lt[0] if _lt else P['paper'])
        _pnl = P['band']
    # r64 (Zale, Nov 22 20:54): two years set by eye: 2013 deep poster brown (the grey was weak), 2022 poster yellow (the badger lost its fill on maroon)
    _OVR = {'2013': ('#3E2A12', '#97D6C9', '#EC8015', 'dark'), '2022': ('#E2BD23', '#6B3030', '#3E1C1C', 'lit')}
    if y in _OVR:
        _o = _OVR[y]; _dark = _o[:3]; _pnl = _o[0]; _litp = _o[3] == 'lit'
    else:
        _litp = False
    if _dark: pass
    elif _bold: pass
    elif _lum(P['paper']) > .82:  # r57: pale paper takes a wash of the year color, eased back until every text color keeps 4.5:1
        for _t in (.14, .10, .07, .04):
            _c = _mix(P['paper'], _tint, _t)
            if all(_cr(x, _c) >= 4.5 for x in _txt): _pnl = _c; break
    _cand = [c for c in list(P.get('stripe', [])) + [P.get('light'), P.get('warm'), P['ink']] if c and len(c) == 7 and _dist(c, P['paper']) > 60]
    _band = max(_cand, key=lambda c: _dist(c, _tint)) if _cand else P['ink']  # r57: border band contrasts with the frame color
    h = h[:_top] + '<div class="yrtop framed%s" style="--paper:%s;--ink:%s;--mat:%s;--s1:%s;--s2:%s;--s3:%s;--tint:%s;--pnl:%s;--post:url(%s)%s">%s' % ((' pale' if _pale else '') + (' dark' if _dark else '') + (' litp' if _litp else ''), P['paper'], P['ink'], _mat(P), _band, _st[1], _st[2], _tint, _pnl, _postimg(y), (';--dkp:%s;--dki:%s;--dki2:%s' % _dark) if _dark else '', _crown) + h[_top:] + '</div>'
    if st.get('headline'):
        h += ('<section class="story short"><p class="kick">The %s story</p><p class="lead">%s.</p>%s</section>') % (y, E(st['headline'].rstrip('.')), ('<p class="body" hidden>%s</p><button class="chip stog" aria-expanded="false" data-open="Read the %s story" data-shut="Show less"><span>Read the %s story</span> %s</button>' % (E(st['story']), y, y, ICON['caret'])) if st.get('story') else '')
    lp = ''  # Nov 21 r27 (Zale): the lineup picker is off until the other lineups (Family, DJs, Comedy...) are drawn; it listed them with nothing behind them
    # r49 (Zale, Nov 22): the music question comes first, before "Begin here", and filters both Begin here and everyone below
    _gall = gopts([x for x in music if x.get('g')])
    if len(_gall) >= 3:
        h += '<section class="ypick">%s</section>' % gpick('#y%s .topten .card, %s' % (y, '#y%s .mini' % y if True else ''), opts=['Everything'] + _gall).replace(", #y%s .mini" % y, ", #y%s .mini, #y%s .rest .row" % (y, y))
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
        h += '<section class="rest"><h2 class="h-big">Keep wandering</h2>%s</section>' % body
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
_STORIES = {}
import glob as _gl
for _f in sorted(_gl.glob(ROOT + 'stories/stories_[0-9]*_draft*.csv')):
    for _r in csv.DictReader(open(_f, encoding='utf-8-sig')):
        if _r.get('story'): _STORIES[(_slug(_r['act']), str(_r['year']))] = _r
# r86 (copy_review-97, Nov 24): Copy Review's changed rows from Artist Classification's returns overlay the year files, oldest batch
# first (returns, then b16_21, b22_25, b26_30); they carry intro and story only, so sets and line stay from the year file.
def _rorder(f):
    for i, t in enumerate(('_b16_21', '_b22_25', '_b26_30')):
        if t in f: return (i + 1, f)
    return (0, f)
_NCHG = 0
for _f in sorted(_gl.glob(ROOT + 'stories/stories_changes_returns_*.csv'), key=_rorder):
    for _r in csv.DictReader(open(_f, encoding='utf-8-sig')):
        if not _r.get('story'): continue
        _k = (_slug(_r['act']), str(_r['year']))
        _base = dict(_STORIES.get(_k) or {'year': _r['year'], 'act': _r['act'], 'sets': '', 'line': ''})
        _base.update(intro=_r.get('intro') or _base.get('intro', ''), story=_r['story']); _STORIES[_k] = _base; _NCHG += 1
# stories_changes_v3_* is Copy Review's change log for 2023-2026; those edits are already in the year files (checked Nov 24), so it is not read.
print('story changes applied:', _NCHG)
# MOCK ONLY (r89, Zale Nov 24): Copy Review's Nov 23 draft (one arc told from each visit) is not merged into the year files yet;
# shown here so Zale can judge the page with the better copy. Remove once copy_review merges it into stories_<year>.
for _mf in _gl.glob(ROOT + 'mock_copy/*_versions_draft*.md'):
    _mt_ = open(_mf, encoding='utf-8').read()
    _ma = _re.match(r'#\s*(.+?):', _mt_).group(1).strip()
    for _blk in _re.split(r'\n## ', _mt_)[1:]:
        _yy = _blk.split('\n', 1)[0].strip()
        if not _yy.isdigit(): continue
        _mi = _re.search(r'Intro:\s*(.+)', _blk); _ms = _re.search(r'Story:\s*(.+)', _blk, _re.S)
        if not (_mi and _ms): continue
        _k = (_slug(_ma), _yy)
        _base = dict(_STORIES.get(_k) or {'year': _yy, 'act': _ma, 'sets': '', 'line': ''})
        _base.update(intro=_mi.group(1).strip(), story=_ms.group(1).strip()); _STORIES[_k] = _base
def _salt(s):  # r84: loose key so 'The Black Lillies' / 'Black Lillies', '&' / 'and', 'ft.' billings meet
    s = s[3:] if s.startswith('the') else s
    return s.replace('and', '').replace('the', '')
_STORIES_ALT = {}
for (_k, _y), _r in _STORIES.items(): _STORIES_ALT.setdefault((_salt(_k), _y), (_k, _r))
_STORY_USED = set()
_ART_BY_NAME = {}
for _ak, _av in d['artists'].items():
    if _av.get('l') == 'music': _ART_BY_NAME.setdefault(_slug(_av.get('n') or ''), _av)
_SOC = [('shakeygraves.com', 'Website'), ('instagram.com', 'Instagram'), ('bandcamp.com', 'Bandcamp'), ('youtube.com', 'YouTube'), ('facebook.com', 'Facebook'), ('tiktok.com', 'TikTok')]
def _soc_label(u):
    for dom, lab in (('instagram.com', 'Instagram'), ('bandcamp.com', 'Bandcamp'), ('youtube.com', 'YouTube'), ('facebook.com', 'Facebook'),
                     ('tiktok.com', 'TikTok'), ('twitter.com', 'X'), ('x.com', 'X'), ('soundcloud.com', 'SoundCloud'), ('spotify.com', 'Spotify')):
        if dom in u: return lab
    return 'Website'
def _follow(name, yr, slug=''):
    """r88 (Zale, Nov 24 07:46): Follow and listen: the act's own links (WordPress artist record for now; Artist Classification to fill the
    rest) and a few facts. Shows only what exists."""
    a = _ART_BY_NAME.get(_slug(name)) or {}
    links = []
    if a.get('sp'): links.append(('https://open.spotify.com/artist/' + a['sp'], 'Spotify'))
    order = ['Website', 'Instagram', 'Bandcamp', 'YouTube', 'TikTok', 'SoundCloud', 'X', 'Facebook']
    xs = sorted(((u, _soc_label(u)) for u in (a.get('x') or []) if u.startswith('http')), key=lambda t: order.index(t[1]) if t[1] in order else 99)
    seenl = set(l for _, l in links)
    for u, l in xs:
        if l not in seenl: links.append((u, l)); seenl.add(l)
    yrs = sorted({str(y_) for y_, _ in _KIN.get(name, [])})
    facts = []
    if a.get('ol'): facts.append(('From', a['ol'].split(' · ')[0]))
    if yrs: facts.append(('Pickathon', ', '.join(yrs)))
    # r89 (Zale, Nov 24 08:40): the panel shows on every artist page; until Artist Classification sends an act's links, grey placeholders hold the spots
    h = '<aside class="fol"><p class="kick">Follow and listen</p>'
    if links:
        h += '<div class="fol-l">%s</div>' % ''.join('<a href="%s" target="_blank" rel="noopener">%s</a>' % (_h.escape(u, quote=True), E(l)) for u, l in links[:6])
    else:
        h += '<div class="fol-l">%s</div>' % ''.join('<span class="ph" aria-disabled="true">%s</span>' % l for l in ('Spotify', 'Instagram', 'Website'))
    facts = [f_ for f_ in facts if f_[0] != 'Pickathon']
    if facts:
        h += '<dl class="fol-f">%s</dl>' % ''.join('<dt>%s</dt><dd>%s</dd>' % (E(k_), E(v_)) for k_, v_ in facts)
    if len(yrs) > 1:  # each year opens that year's page for this act; the year you are on is lit
        h += '<p class="fol-yk">Their Pickathons</p><div class="fol-y">%s</div>' % ''.join(
            ('<span class="on" aria-current="page">%s</span>' % y_) if y_ == str(yr) else
            ('<a href="#" data-art="%s" data-an="%s" data-ay="%s">%s</a>' % (slug, E(name), y_, y_)) for y_ in yrs)
    elif yrs:
        h += '<dl class="fol-f"><dt>Pickathon</dt><dd>%s</dd></dl>' % yrs[0]
    return h + '</aside>'
def _sents(t):
    return [s for s in _re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\u201c])', t.strip()) if s]
def _timeline(story, yr, sets):
    """r88 (Zale, Nov 24 07:46): the story runs down a thin line; where it reaches Pickathon a gold marker holds that year's sets as
    one-line chips, so before comes before and after comes after."""
    paras = [p.strip() for p in story.split('\n\n') if p.strip()]
    chips = []
    for s in [x.strip() for x in sets.split('\u00b7') if x.strip()]:
        m = _re.match(r'^(\w{3})\w*\s+\w{3}\s+\d+,\s*(.+?),\s*(.+)$', s)
        if m:
            tm = _re.sub(r'late night \((.+)\)', r'\1, late', m.group(2))
            chips.append('<li><b>%s %s</b>%s</li>' % (E(m.group(1)), E(tm), E(_re.sub(r'\s+Stage$', '', m.group(3).strip()))))
        else:
            chips.append('<li>%s</li>' % E(s))
    # r89 (Zale, Nov 24 08:40): the sets moved to the That weekend shelf; the marker only says where Pickathon falls in the story
    # r89b (Zale, Nov 24 09:05, picked A + times): one quiet where-and-when line in the tick; pictures and clips wait in That weekend below
    tl_ = ' \u00b7 '.join(_re.sub(r'</?b>|</?li>', ' ', c_).replace('  ', ' ').strip() for c_ in chips)
    node = '<div class="tl-pk"><span class="tl-dot" aria-hidden="true"></span><p class="tl-y">Pickathon %s</p>%s</div>' % (
        yr, ('<p class="tl-s">%s</p>' % tl_) if tl_ else '')
    out, placed = [], False
    for p in paras:
        ss = _sents(p)
        if not placed:
            for i, s in enumerate(ss):
                if 'Pickathon' in s:
                    before, after = ' '.join(ss[:i + 1]), ' '.join(ss[i + 1:])
                    out.append('<p class="body">%s</p>' % E(before)); out.append(node)
                    if after: out.append('<p class="body">%s</p>' % E(after))
                    placed = True; break
            if placed: continue
        out.append('<p class="body">%s</p>' % E(p))
    if not placed:
        out.insert(1 if out else 0, node)
    return '<div class="tl-rail">%s</div>' % ''.join(out)
def _songt(sg):
    """r88: a clean song title from a raw video title ("Built to Roam - @Pickathon 2013 - Wood Barn Stage" -> "Built to Roam")."""
    t = _re.split(r'\s+[-\u2013|]\s+|@', sg or '')[0].strip(' "\u201c\u201d')
    return '' if (not t or 'pickathon' in t.lower()) else t
def _songs2(sg):
    m = _re.search(r'([A-Z][\w\' ]+?(?:Stage|Barn|Woods|Grove|Session|Sessions))', sg or '')
    return m.group(1).strip() if m else ''
_DAYN = {'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday', 'Wed': 'Wednesday'}
def _setgfx(yr, sets):
    """r87 (Zale, Nov 24 07:22, copy_review-60): sets as a small where-and-when graphic, one stub per set: day, date, time large, place."""
    out = []
    for s in [x.strip() for x in sets.split('·') if x.strip()]:
        m = _re.match(r'^(\w{3})\w*\s+(\w{3}\s+\d+),\s*(.+?),\s*(.+)$', s)
        if not m:
            out.append('<li class="st"><span class="st-p">%s</span></li>' % E(s)); continue
        d, dt, tm, pl = m.groups()
        late = ''
        lm = _re.match(r'late night \((.+)\)', tm)
        if lm: tm, late = lm.group(1), 'Late night'
        tm = tm.replace(' am', '<small>am</small>').replace(' pm', '<small>pm</small>')
        pl = _re.sub(r'\s+Stage$', '', pl.strip())
        out.append('<li class="st"><span class="st-d">%s<i>%s</i></span><span class="st-t">%s</span>%s<span class="st-p">%s</span></li>' % (
            E(d), E(dt), tm, ('<span class="st-l">%s</span>' % late) if late else '', E(pl)))
    if not out: return ''
    return '<aside class="setg"><p class="kick">At Pickathon %s</p><ul>%s</ul></aside>' % (yr, ''.join(out))
# r90c (Zale, Nov 24 09:28): the Live at Pickathon CDs (2000-2008) from the content workbook (Pickathon Content by Year by Artist.xlsx,
# audio track rows; Spotify album links, track ids not in the workbook yet); played in the visitor's chosen service, Spotify by default
_CDT = {}
for _o in json.load(open(ROOT + 'cd_tracks.json', encoding='utf-8')) if os.path.exists(ROOT + 'cd_tracks.json') else []:
    for _kk in {_slug(_o['a']), _slug(_o['id'].replace('-', ' '))}:
        _CDT.setdefault(_kk, []).append(_o)
def art_page(slug, ap, pid=None):
    name = _NAMES[slug]; yr = str(ap.get('yr') or max([y for y, _ in _KIN.get(name, [])] or [2024]))
    if not str(ap.get('hero','')).startswith(('i/', 'ext/')) or not os.path.exists(_src(ap['hero'])):
        ap = dict(ap, hero=d['yearLogo'][yr] if yr in d['yearLogo'] else 'logo27-gold.png')
    ap = dict(ap, gal=[p for p in (ap.get('gal') or []) if str(p.get('i','')).startswith(('i/', 'ext/')) and os.path.exists(_src(p['i']))])
    x = _cls(name, yr) or {}
    k = x.get('k', 'none'); g = x.get('g', '')
    P = d['yearBrand'].get(yr, P24)
    h = header(name, 'Pickathon ' + yr, chip=yr, wall=False)  # r75 (Zale, Nov 22 22:41): the year chooser sits in the artist header too
    # r71 (Zale, Nov 22 21:45, picked Light): the year's thin border strip sits above the hero, the same strip as the top of the year page
    _P2 = P if yr in d['yearBrand'] else P27
    _hz = _hzn(yr, 'art')
    h += _hz or '<div class="acrown" aria-hidden="true">%s</div>' % (seam(yr, _P2) if yr != '2027' else generic_seam('2027', P27))
    # r73 (Zale, Nov 22 21:53, picked "card line"): the hero is a reel of that year's photos (3-5, best first, different stages), 4 s a photo, hard cut;
    # the name, class and the act-year card line stay put; one big play button plays every song from that year as a playlist
    _fr, _seen, _sts = [], set(), set()
    _cand = [(ap['hero'], ap.get('hpos', '50% 40%'), ap.get('heroSt', ''))] + [(g_['i'], g_.get('pos', '50% 50%'), g_.get('st', '')) for g_ in (ap.get('gal') or [])]
    _cand = [c_ for c_ in _cand if ('/y%s' % yr[2:]) in c_[0] or c_[0] == ap['hero']]
    for _pass in (0, 1):  # first one photo per stage, then fill
        for c_ in _cand:
            if c_[0] in _seen or len(_fr) >= 5: continue
            if _pass == 0 and c_[2] and c_[2] in _sts and len(_fr) > 0: continue
            _seen.add(c_[0]); _sts.add(c_[2]); _fr.append(c_)
    _ksy = ''.join(ch for ch in _ud.normalize('NFD', _CLIPALIAS.get(name, name).lower()) if ch.isalnum())
    _ysongs = list(CLIPYL.get((_ksy, yr), []))
    _c1 = CLIPY.get((_ksy, yr))
    if _c1 and _c1.split('&')[0] not in [u_ for u_, _ in _ysongs]: _ysongs.append((_c1, ''))
    _q = ';;'.join('%s|%s%s · Pickathon %s' % (u_, name, (' · ' + sg_) if sg_ else '', yr) for u_, sg_ in _ysongs)
    _ring = ''
    if _ysongs:
        _ring = clip_ring(_ysongs[0][0], 'lg')
        if len(_ysongs) > 1: _ring = _ring.replace('<span class="ring lg" data-clip=', '<span class="ring lg" data-q="%s" data-clip=' % _h.escape(_q, quote=True), 1)
    _st = _STORIES.get((_slug(name), yr))
    if _st: _STORY_USED.add((_slug(name), yr))
    elif (_salt(_slug(name)), yr) in _STORIES_ALT:
        _kk, _st = _STORIES_ALT[(_salt(_slug(name)), yr)]; _STORY_USED.add((_kk, yr))
    # r88 (Zale, Nov 24 07:46): the photo carries who they were THAT year: the story's opening line, else the card line
    _line = ((_st or {}).get('intro') or '').strip() or _rline(name, yr, k) or ''
    _gt = gp_n(name, GSHORT.get(g, g)) if (gp_n(name) or g) else ''
    _sl = [{'i': img(f_[0], 780), 'pos': f_[1], 'n': name, 'k': KLAB.get(k, ''), 'g': _gt, 'l': _line, 'clip': _ysongs[0][0] if _ysongs else ''} for f_ in _fr]
    _segs = ''.join('<i data-slide="%d"%s><b></b></i>' % (n_, ' class="on"' if n_ == 0 else '') for n_ in range(len(_sl))) if len(_sl) > 1 else ''
    h += ('<section class="hero hact%s"%s><img src="%s" alt="" style="object-position:%s"><div class="hero-sc"></div>%s%s'
          '<span class="hyr-y">%s</span><div class="hero-tx"><p class="krow"><span class="k k-%s">%s</span>%s</p><h1>%s</h1>%s</div></section>') % (
          ' areel' if _segs else '', (' data-slides="%s"' % html.escape(json.dumps(_sl), quote=True)) if _segs else '',
          img(_fr[0][0], 780) if _fr else img(ap['hero'], 780), _fr[0][1] if _fr else ap.get('hpos', '50% 40%'),
          ('<div class="segs">%s</div>' % _segs) if _segs else '', _ring, yr,
          k, KLAB.get(k, ''), ('<span class="g">%s</span>' % E(gp_n(name, GSHORT.get(g, g)))) if (gp_n(name) or g) else '', E(name),
          ('<p class="hero-sub">%s</p>' % E(_line)) if _line else '')
    # r73 (Zale, Nov 22 21:56): the same year strip turned upside down closes the bottom of the photo
    h += '<div class="acrown afoot" aria-hidden="true">%s</div>' % (seam(yr, _P2) if yr != '2027' else generic_seam('2027', P27))
    # r74 (Zale, Nov 22 22:03; picked "go to that year's page"): a small year block under the reel ties the act to its Pickathon:
    # the year logo, "Pickathon 2013" and the stage, then every year the act played; each year opens that year's lineup page
    _lgy = d['yearLogo'].get(yr)
    _lgi = ('<img src="%s" alt="">' % img(_lgy, 220, fmt='PNG')) if (_lgy and not _lgy.startswith('http') and os.path.exists(_src(_lgy))) else ('<img src="%s" alt="">' % LOGO)
    _stg = (_fr[0][2] if _fr else '') or ap.get('heroSt', '')
    # r76 (Zale, Nov 22 22:45, picked A): the year seal sits across the join of photo and page, like a stamp; year and stage under it
    # r77 (Zale, Nov 22 22:52): the year shows once, in the photo's top-right corner like the year pages; the seal names only the stage
    _yic = 'ext/icons/y%s-icon.png' % yr[2:]  # r90 (Zale, Nov 24 09:26): the seal is Artwork's year icon, not a poster scrap
    if os.path.exists(ROOT + _yic): _lgi = '<img class="as-ic" src="%s" alt="Pickathon %s">' % (img(_yic, 240, fmt='PNG'), yr)
    h += ('<div class="aseal%s" style="--yp:%s;--yi:%s"><span class="as-l">%s</span>%s</div>') % (' ic' if os.path.exists(ROOT + _yic) else '',
          _P2['paper'], _P2['ink'], _lgi, '')  # r77b (Zale 22:52): no caption under the seal; it looked thin. The year is in the photo's corner
    # r66 (Zale picked one continuous story, copy_review-54): intro, one story in a few paragraphs, then a small sets block; read from Copy Review's stories_<year> CSVs
    story = [] if _st else [s for s in (ap.get('story') or []) if s.get('t')]
    if _st:
        h += '<section class="liner one tl"><div class="tl-main"><p class="kick">Liner notes</p>%s</div>%s</section>' % (
            _timeline(_st['story'], yr, _st.get('sets') or ''), _follow(name, yr, slug))
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
    # r58 (Zale, Nov 22 20:06): an artist page carries every song the act has from every Pickathon year (newest first), then its full sets
    _ks = ''.join(ch for ch in _ud.normalize('NFD', _CLIPALIAS.get(name, name).lower()) if ch.isalnum())
    _yp = lambda yy: (d['yearPhotos'].get(str(yy), {}).get(name, {}) or {}).get('i')
    def _thumb(u, yy):
        p_ = _yp(yy)
        if p_ and loc(p_): return img(p_, 520)
        m_ = _re.search(r'v=([A-Za-z0-9_-]{11})', u)
        return ('https://i.ytimg.com/vi/%s/hqdefault.jpg' % m_.group(1)) if m_ else img(ap['hero'], 520)
    # r89 (Zale, Nov 24 08:40): THAT WEEKEND: one card per set in time order (day and time, the stage under it, that set's video or
    # photo, else the year icon), then that year's sessions and songs, then a full set; the year's schedule and content as one shelf
    def _yt(u):
        m_ = _re.search(r'(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})', u)
        return ('https://i.ytimg.com/vi/%s/hqdefault.jpg' % m_.group(1)) if m_ else ''
    _GEN = {'stage', 'barn', 'the', 'session', 'sessions', 'pickathon'}
    def _stw(s): return {w for w in _re.findall(r'[a-z]+', (s or '').lower()) if w not in _GEN}
    _ic = 'ext/icons/y%s-icon.png' % yr[2:]
    _icn = ('<img class="wk-ic" src="%s" alt="">' % img(_ic, 160, fmt='PNG')) if os.path.exists(ROOT + _ic) else ''
    _vy = []  # this year's clips: (url, song, stage)
    _seenv = set()
    for u_, sg_ in _ysongs + [(v['u'], v.get('sg', '')) for v in (ap.get('vids') or []) if v.get('u') and str(v.get('y') or ap.get('yr') or yr) == str(yr)]:
        if u_.split('&')[0] in _seenv: continue
        _seenv.add(u_.split('&')[0]); _vy.append((u_, sg_, _songs2(sg_)))
    fulls_all = [v for v in d['videos'] if _slug(v.get('a') or '') in (_slug(name), _ks) and (v.get('f') or v.get('cad') or 'full set' in str(v.get('s', '')).lower()) and _vurl(v)]
    _used_ph, _cards = set(), []
    def _card(th, clip, top, sub, cls=''):
        thh = ('<img loading="lazy" src="%s" alt="">' % th) if th else '<span class="wk-n">%s</span>' % _icn
        if clip:
            return ('<div class="wk vid%s" role="button" tabindex="0" data-clip="%s"><span class="vth">%s%s</span><b>%s</b><span>%s</span></div>' % (
                cls, _h.escape(clip, quote=True), thh, play('sm'), top, E(sub)))
        return '<div class="wk%s"><span class="vth">%s</span><b>%s</b><span>%s</span></div>' % (cls, thh, top, E(sub))
    for s in [x.strip() for x in ((_st or {}).get('sets') or '').split('\u00b7') if x.strip()]:
        m = _re.match(r'^(\w{3})\w*\s+\w{3}\s+\d+,\s*([^,]+?)(?:,\s*(.+))?$', s)
        if not m: continue
        dd, tm, pl = m.groups(); pl = pl or ''
        late = bool(_re.match(r'late night', tm)); tm = _re.sub(r'late night \((.+)\)', r'\1', tm)
        pl = _re.sub(r'\s+Stage$', '', pl.strip())
        vv = next((x for x in _vy if x[2] and _stw(x[2]) & _stw(pl)), None)
        th = ''
        if vv: _vy.remove(vv); th = _yt(vv[0])
        if not th:
            ph = next((c_[0] for c_ in _cand if c_[2] and (_stw(c_[2]) & _stw(pl)) and c_[0] not in _used_ph), None)
            # r90b: else another photo of theirs from that year (not the hero's first frame), so a set card is never blank when we have pictures
            if not ph: ph = next((f_[0] for f_ in _fr[1:] if f_[0] not in _used_ph), None)
            if ph: _used_ph.add(ph); th = img(ph, 520)
        _cards.append(_card(th, vv[0] if vv else '', '%s %s%s' % (E(dd), E(tm), ' <i>late</i>' if late else ''), (pl or 'Pickathon %s' % yr) + ((' · ' + _songt(vv[1])) if vv and _songt(vv[1]) else '')))
    for u_, sg_, st_ in _vy:
        th = _yt(u_)
        if not th:
            ph = next((c_[0] for c_ in _cand if c_[0] not in _used_ph), None)
            if ph: _used_ph.add(ph); th = img(ph, 520)
        _cards.append(_card(th, u_, E(_songt(sg_) or 'Session'), st_ or 'Pickathon %s' % yr))
    _cdk = _CDT.get(_slug(name)) or _CDT.get(_ks) or []
    def _cdcard(o):
        # r92 (Zale, Nov 24 10:09): Video Catalog's draft 20 gives each CD song its own link per player and the CD cover;
        # the card opens the song in the visitor's player (data-svc), Spotify, then Bandcamp, when that player has none
        _ic2 = 'ext/icons/y%s-icon.png' % str(o['y'])[2:]
        ich = ('<img class="cd-ic" src="%s" alt="">' % img(_ic2, 200, fmt='PNG')) if os.path.exists(ROOT + _ic2) else ''
        svc = {k_: o.get(k_) for k_ in ('sp', 'am', 'yt', 'az', 'td', 'bc') if o.get(k_)}
        u0 = o.get('sp') or o.get('bc') or o.get('album') or ''
        cov = ('<img class="cd-cov" loading="lazy" src="%s" alt="" onerror="this.remove()">' % _h.escape(o['cover'], quote=True)) if o.get('cover') else ''
        return ('<div class="wk cd" role="button" tabindex="0" data-sp="%s" data-svc="%s" aria-label="Play %s from the Live at Pickathon %s CD">'
                '<span class="vth cd-c">%s%s<span class="cd-l">Live at Pickathon<br>%s</span>%s</span><b>%s</b><span>Live at Pickathon %s CD</span></div>') % (
            _h.escape(u0, quote=True), _h.escape(json.dumps(svc), quote=True), E(o['song']), o['y'], ich, cov, o['y'], play('sm'), E(o['song']), o['y'])
    for o in [o for o in _cdk if str(o['y']) == str(yr)]:
        _cards.append(_cdcard(o))
    for v in [v for v in fulls_all if str(v.get('y')) == str(yr)][:2]:
        u = _vurl(v)
        _cards.append(_card(_yt(u) or (img(_fr[0][0], 520) if _fr else ''), u, 'Full set', 'Pickathon %s' % yr))
    # r90 (Zale, Nov 24 09:35, picked one shelf): this visit first under a gold label, then each other year newest first, then records
    # r89 (Zale, Nov 24 08:40): ALL <ACT>: everything we have from their other Pickathons, newest year first, full sets allowed
    _ac = []
    for y_ in sorted({str(y2) for y2, _ in _KIN.get(name, [])} - {str(yr)}, reverse=True):
        _sy = set()
        for u_, sg_ in CLIPYL.get((_ksy, y_), []):
            if u_ in _sy: continue
            _sy.add(u_); _ac.append((u_, y_, _songt(sg_) or name, _songs2(sg_)))
        for v in [v for v in fulls_all if str(v.get('y')) == y_][:1]:
            _ac.append((_vurl(v), y_, 'Full set', ''))
        for o in [o for o in _cdk if str(o['y']) == y_]:
            _ac.append(('CD', y_, o, ''))
    _gl = lambda t, on=False: '<p class="gl%s">%s</p>' % (' on' if on else '', t)
    _all = [c_.replace('<span class="vth', _gl('%s · this visit' % yr, True) + '<span class="vth', 1) if i_ == 0 else c_.replace('<span class="vth', _gl('') + '<span class="vth', 1) for i_, c_ in enumerate(_cards)]
    _prev = None
    for u_, y_, t_, s2_ in _ac[:16]:
        if u_ == 'CD':
            _all.append(_cdcard(t_).replace('<span class="vth', _gl(y_ if y_ != _prev else '') + '<span class="vth', 1)); _prev = y_; continue
        th = _yt(u_) or (img(_yp(y_), 520) if _yp(y_) and loc(_yp(y_)) else '')
        _all.append(('<div class="wk vid" role="button" tabindex="0" data-clip="%s">%s<span class="vth">%s%s</span><b>%s</b><span>%s</span></div>') % (
            _h.escape(u_, quote=True), _gl(y_ if y_ != _prev else ''), ('<img loading="lazy" src="%s" alt="">' % th) if th else '', play('sm'), E(t_), E(s2_ or 'Pickathon ' + y_)))
        _prev = y_
    # Records (Spotify tracks with album covers) join here once Artist Classification sends them (design_lineup_artist-61)
    if _all:
        h += '<section class="shelf vids weekend onesh"><div class="sh-h"><div><p class="kick">Filmed on the farm</p><h2>%s at Pickathon</h2></div></div><div class="swipe">%s</div></section>' % (E(name), ''.join(_all))
    # r85 (Zale, Nov 23 23:55): "If you like" is a fan's recommendation, not a size match. Same sound first (shared music tags,
    # primary tag weighted), other summers only, one or two names a fan likely knows, the rest Deep cuts and Discoveries they may not;
    # no two picks from the same year; a fixed per-act shuffle so neighboring pages differ.
    _mt = list(tags_of(name)) or [t for t in [gp_n(name, GSHORT.get(g, g))] if t]
    _mts = set(_mt)
    def _fit(c):
        ct = list(tags_of(c[1])) or [c[3]]
        sh = _mts & set(ct)
        if not sh: return 0
        return len(sh) / len(_mts | set(ct)) + (0.5 if ct and _mt and ct[0] == _mt[0] else 0)
    import random as _rnd
    _rng = _rnd.Random(_slug(name))
    _cand = [(c, _fit(c), _rng.random()) for c in ARCH_ALL if _canon(c[1]) != _canon(name) and c[4] and str(c[2]) != str(yr)]
    _cand = [t for t in _cand if t[1] > 0]
    _cand.sort(key=lambda t: (-round(t[1], 1), t[2]))
    _big = [t for t in _cand if _mg((t[0][1], t[0][2])) >= 5]
    _less = [t for t in _cand if _mg((t[0][1], t[0][2])) < 5 and t[0][0] in ('deep', 'disc')]
    same, _yrs = [], set()
    def _take(pool, n):
        got = 0
        for t in pool:
            if got >= n: break
            c = t[0]
            if c in same or str(c[2]) in _yrs: continue
            same.append(c); _yrs.add(str(c[2])); got += 1
    _take(_big, 2); _take(_less, 6 - len(same))
    if len(same) < 6: _take(_cand, 6)
    same = same[:6]
    if same:
        h += shelf('Same sound, other summers', 'IF YOU LIKE %s' % name.upper(), 'A few you may know, more you may not.', '',
                   [vcard(n_, y_, k_, g_, p_, pos_) for k_, n_, y_, g_, p_, pos_ in same])
        h = h[:h.rfind('<section class="shelf">')] + h[h.rfind('<section class="shelf">'):].replace('<section class="shelf">', '<section class="shelf yl">', 1)
    if pid: slug = pid
    return ('<main id="a-%s" class="screen" hidden style=""--paper:%s;--ink:%s;--ink2:%s;--acc:%s;--mat:%s">%s</main>') % (slug, P['paper'], P['ink'], P['ink2'], _acc(P), _mat(P), h)
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
# r79 (Zale, Nov 22 23:08): "there's always a separate artist page for every year they play Pickathon". The page each act already had
# keeps its id (a-<slug>, its own year); every other year gets a-<slug>-y<year> with that year's photo, songs, line and story
_NEXTRA = 0
for _s in list(ARTISTS):
    _nm = _NAMES.get(_s)
    _ap0 = d['actPages'].get(_s)
    _m0 = _re.search(r'class="hyr-y">(\d{4})<', ARTISTS[_s]); _y0 = _m0.group(1) if _m0 else ''
    # r84b: a year Copy Review wrote a story for gets its own page even when the class table spells the act differently that year
    for _y in sorted({str(y_) for y_, _ in _KIN.get(_nm, [])} | {y_ for (k_, y_) in _STORIES if _salt(k_) == _salt(_s)}):
        if _y == _y0: continue
        _yp = (d['yearPhotos'].get(_y, {}).get(_nm) or {})
        _api = {'yr': _y, 'gal': [], 'vids': [], 'story': []}
        if _yp.get('i') and os.path.exists(_src(_yp['i'])):
            _api.update(hero=_yp['i'], hpos=fpos(_yp['i']), heroSt=_yp.get('s', ''))
        if _ap0 and str(_ap0.get('yr')) == _y: _api = _ap0
        try:
            ARTISTS[_s + 'y' + _y] = art_page(_s, _api, pid='%s-y%s' % (_s, _y)); _NEXTRA += 1
        except Exception as _e:
            print('skip year page', _s, _y, _e)
print(len(ARTISTS), 'artist pages generated (%d extra act-year pages)' % _NEXTRA)
_ASEL = '<label class="mb-sel">Artist <select id="asel"><option value="">Pick an artist</option>%s</select></label>' % ''.join(
    '<option value="%s">%s</option>' % (s, E(_NAMES[s])) for s in sorted([k_ for k_ in ARTISTS if k_ in _NAMES], key=lambda s: _NAMES[s].lower()))
_ASCRIPT = ('<script>document.getElementById("asel").addEventListener("change",function(e){var v=e.target.value;if(!v)return;'
            'document.querySelectorAll(".screen").forEach(function(m){m.hidden=true;});var m=document.getElementById("a-"+v);'
            'if(m){m.hidden=false;window.scrollTo(0,0);}});</script>')

page = page.replace('<button data-s="s3">', _ASEL + '<button data-s="s3">', 1).replace('<nav class="tabs">', ''.join(ARTISTS.values()) + year_wall('').replace('class="ywall"', 'class="ywall ywall-g"', 1) + '<nav class="tabs">', 1).replace('</body>', _ASCRIPT + _PLAYER + '</body>')
# name variants and collab billings that point at a page we have (Zale, Nov 20: "those names obviously map to an artist")
_PIDS0 = set(_re.findall(r'id="a-([a-z0-9]+)"', page))  # base ids; act-year pages are a-<slug>-y<year>
page = _re.sub(r' data-art="([a-z0-9]*)"', lambda m: (' data-art="%s"' % _ALIAS[m.group(1)]) if (m.group(1) in _ALIAS and _ALIAS[m.group(1)] in _PIDS0) else m.group(0), page)
# names with no artist page keep no link (a tap must never go nowhere); the gaps are listed in the build log
_PIDS = set(_re.findall(r'id="a-([a-z0-9]+)"', page))
_DROP = sorted({m.group(1) for m in _re.finditer(r' data-art="([a-z0-9]*)"', page) if m.group(1) not in _PIDS and _re.sub(r'^the', '', m.group(1)) not in _PIDS})
page = _re.sub(r' data-art="([a-z0-9]*)"', lambda m: m.group(0) if (m.group(1) in _PIDS or _re.sub(r'^the', '', m.group(1)) in _PIDS) else '', page)
print('names without an artist page (no link):', len(_DROP), _DROP)
open(OUT + 'index.html', 'w').write(page)
print(len(page) // 1024, 'KB html', len(os.listdir(OUT + 'img')), 'images', sum(os.path.getsize(OUT + 'img/' + f) for f in os.listdir(OUT + 'img')) // 1024, 'KB')
_miss = sorted(set(_STORIES) - _STORY_USED)
print('stories: %d in Copy Review files, %d on artist pages, %d not placed' % (len(_STORIES), len(_STORY_USED), len(_miss)))
json.dump([list(m) for m in _miss], open(ROOT + 'stories_not_placed.json', 'w'), indent=0)
