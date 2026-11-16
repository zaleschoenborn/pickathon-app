#!/usr/bin/env python3
"""Year reels (Zale, Nov 16 2026): every year's reel is its top 10, and it should be a reel of VIDEOS wherever the year has them.
   Build 5237 had swapped the hand-picked 2023 and 2024 tours for the generic top-10 reel, which only plays where one of the
   ten acts happens to have a clip (2023: 4 of 10). This puts the clips back: the reel keeps its acts in order, and any act with
   no same-year single-song clip is swapped for the next-ranked act that has one (photo and blurb from the held tour, the year's
   photos or the archive line). Same-year, single songs only, never full sets or set chunks. Years with no clips are left alone.
   Safe to run again. Usage: python3 tools/years1/reel_video_first.py [--dry]"""
import json, os, re, sys
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); D = os.path.join(SITE, 'data.json')
d = json.load(open(D, encoding='utf-8')); DRY = '--dry' in sys.argv
nz = lambda x: re.sub(r'[^a-z0-9]', '', re.sub(r'^the\s+', '', str(x).lower()))
BAD = re.compile(r'\bpt\s?\d|part\s?\d|raw live|do not release|rough|full set|\bset\b|soundcheck|interview', re.I)
VEN = re.compile(r'\b(woods|galaxy barn|galaxy|paddock|grove|slab|edge|pumphouse|cherry hill|lucky|windmill|courtyard|farm|barn|stage|pickathon|moore|tk\d|am\d|pm\d|20\d\d|[-_ ]+)\b', re.I)
def setfile(v):   # a title that is only the artist plus venue and year is a set file, not a song
    t = re.sub(re.escape(v.get('a') or ''), '', v.get('s') or '', flags=re.I); t = VEN.sub(' ', t); return not re.sub(r'[\W_]+', '', t)
def okv(v):
    return (not setfile(v) and not v.get('cad') and not v.get('f') and not v.get('un') and not v.get('nonact') and not v.get('cur') and v.get('a')
            and not v.get('t') and not (v.get('vm') and not v.get('th')) and not BAD.search(v.get('s') or ''))
def url(v): return ('https://vimeo.com/%s%s' % (v['vm'], '/' + v['vh'] if v.get('vh') else '')) if v.get('vm') else 'https://www.youtube.com/watch?v=' + v['id']
def song(t):
    t = str(t or '').strip(); P = re.split(r'\s+[-–|]\s+', t); K = []
    for i, p in enumerate(P):
        if i > 0 and re.search(r'pickathon|session|stage|S\d\dE\d\d|live at|full set', p, re.I): break
        K.append(p)
    return re.sub(r'\s*@\s*Pickathon.*$', '', ' - '.join(K), flags=re.I).strip() or t
def best(vs):   # curated order: Pickathon-owned (k=1) first, then k=2, then the rest; most-viewed within
    return sorted(vs, key=lambda v: ({1: 0, 2: 1}.get(v.get('k'), 2), -(v.get('v') or 0)))[0]
changes = {}
for y, R in sorted(d['yearReel'].items()):
    if int(y) < 2009: continue
    clips = {}
    for v in d['videos']:
        if str(v['y']) == y and okv(v): clips.setdefault(nz(v['a']), []).append(v)
    have = [q for q in R if q.get('v') or clips.get(nz(q['n']))]
    if len(have) >= 10 or len(have) == len(R) and len(R) < 10 and not clips: continue
    hold = {nz(q['n']): q for q in (d.get('yearTourHold') or {}).get(y, [])}
    held_v = {k: q for k, q in hold.items() if q.get('v')}
    # candidates: next-ranked bill acts with a clip, a same-year non-promo photo and a line
    inreel = {nz(q['n']) for q in R}; cand = []
    for b in d['yearBill'].get(y, []):
        k = nz(b['n'])
        if k in inreel or not (clips.get(k) or k in held_v): continue
        P = ((d.get('yearPhotos') or {}).get(y) or {}).get(b['n']) or {}
        H = held_v.get(k) or hold.get(k) or {}
        img = H.get('i') or (P.get('i') if not P.get('promo') else '')
        if not img or not os.path.exists(os.path.join(SITE, img)): continue
        line = H.get('l') or next((x.get('l') or x.get('line') for x in (d['past'].get('deep') or []) + (d.get('deepcuts') or []) + (d.get('archCT') or []) if x and x.get('n') == b['n'] and (x.get('l') or x.get('line'))), '')
        if not line: continue
        kind = H.get('k') or {'leg': 'Legend', 'disc': 'Discovery', 'deep': 'Deep cut'}.get(b['k'], '')
        v = H.get('v'); sg = H.get('sg')
        if not v: c = best(clips[k]); v = url(c); sg = song(c['s'])
        e = {'i': img, 'n': b['n'], 'k': kind, 'l': line, 's': H.get('s') or '', 'v': v}
        if sg: e['sg'] = sg
        for f in ('ph', 'lp'):
            if H.get(f): e[f] = H[f]
        cand.append(e)
    new, ci, swapped = [], iter(cand), []
    for q in R:
        if q.get('v') or clips.get(nz(q['n'])):
            if not q.get('v'):   # an act that has a clip but the entry never carried it
                c = best(clips[nz(q['n'])]); q = dict(q, v=url(c), sg=song(c['s'])); q.pop('po', None); q.pop('sp', None)
            new.append(q); continue
        if q.get('n') and re.match(r'^(Pickathon\s+\d{4}|Wait, they all played)', q['n']): new.append(q); continue   # an opener card stays
        e = next(ci, None) if len(new) > 0 else None   # the lead slide (the year's hero) is never swapped
        if e: new.append(e); swapped.append((q['n'], e['n']))
        else: new.append(q)
    n_after = sum(1 for q in new if q.get('v'))
    changes[y] = (len(have), n_after, swapped)
    if not DRY: d['yearReel'][y] = new
for y, (a, b, s) in changes.items(): print(y, 'videos', a, '->', b, '| swapped:', s)
if not DRY: open(D, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
