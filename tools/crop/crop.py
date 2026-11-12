#!/usr/bin/env python3
"""crop.py - the Pickathon subject-crop tool (rules: skill pickathon-tall-photo-subject-crop; Zale Nov 6-7 2026, Nov 12 2026).
Every photo on the site goes through it: find the singer / the few people who stand apart, and choose object-position so
tall phone frames keep the subject fully in (with the most audience when there is one) and wide frames keep the face
about 30% down. Build time only: it writes static JSON (focus.json / focus-tall.json) that focus.js applies.

  python3 tools/crop/crop.py detect  --list keys.txt | --all          # person boxes, cached in tools/crop/cache/det.jsonl
  python3 tools/crop/crop.py propose --list keys.txt | --all [--tall 0.56] [--wide 1.6] [--out props.json]
  python3 tools/crop/crop.py sheet   props.json --out sheet.jpg [--only keys.txt] [--cols 2]
  python3 tools/crop/crop.py apply   props.json [--fix keys.txt] [--dry]  # new keys into focus.json; --fix keys may overwrite
  python3 tools/crop/crop.py report  props.json                          # new / changed / same / unsolvable / no person

A key is what the page's <img src> says: a site path (i/p573.jpg) or a full URL (https://i.ytimg.com/vi/ID/hq720.jpg).
URLs are downloaded once into tools/crop/cache/img/ (git-ignored). A list file may carry per-key frames: "key<TAB>tall<TAB>wide"
(aspect = width / height of the frame the image fills), else --tall / --wide apply.
Hand fixes: tools/crop/overrides.json {"key": {"xy": [x, y], "why": "..."}} always win and are what self-review writes.
"""
import sys, os, json, math, argparse, hashlib, urllib.request
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, 'cache'); IMGC = os.path.join(CACHE, 'img'); DET = os.path.join(CACHE, 'det.jsonl')
OVR = os.path.join(HERE, 'overrides.json')
MODELS = [os.environ.get('PK_YOLO', ''), os.path.join(HERE, 'yolov8n.onnx'), os.path.join(CACHE, 'yolov8n.onnx'),
          '/mnt/user-data/uploads/_catalogs/tools/smartcrop/yolov8n.onnx']

def jload(p, d=None):
    try: return json.load(open(p, encoding='utf-8'))
    except Exception: return d

# ---------- inputs ----------
def read_list(p):
    out = []
    for l in open(p, encoding='utf-8'):
        l = l.rstrip('\n')
        if not l.strip() or l.startswith('#'): continue
        f = l.split('\t'); out.append((f[0].strip(), float(f[1]) if len(f) > 1 and f[1] else None, float(f[2]) if len(f) > 2 and f[2] else None))
    return out

def all_keys():
    """every image file the site ships, plus the YouTube thumbnails data.json points at"""
    ks = []
    for d in ['i', 'm', 'alum', 'reel', '.']:
        D = os.path.join(ROOT, d)
        if not os.path.isdir(D): continue
        for f in sorted(os.listdir(D)):
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and os.path.isfile(os.path.join(D, f)):
                ks.append(f if d == '.' else d + '/' + f)
    data = jload(os.path.join(ROOT, 'data.json'), {})
    for v in data.get('videos', []) or []:
        if isinstance(v, dict) and v.get('id') and not v.get('vm'): ks.append('https://i.ytimg.com/vi/%s/hqdefault.jpg' % v['id'])
    return [(k, None, None) for k in ks]

def local(k):
    """the file for a key; URLs are fetched once into the cache (None if it cannot be reached)"""
    if not k.startswith('http'):
        p = os.path.join(ROOT, k.split('?')[0]); return p if os.path.exists(p) else None
    os.makedirs(IMGC, exist_ok=True)
    p = os.path.join(IMGC, hashlib.sha1(k.encode()).hexdigest()[:16] + os.path.splitext(k.split('?')[0])[1][:5])
    if os.path.exists(p) and os.path.getsize(p) > 0: return p
    try:
        with urllib.request.urlopen(urllib.request.Request(k, headers={'User-Agent': 'pk-crop/1'}), timeout=20) as r: open(p, 'wb').write(r.read())
        return p
    except Exception as e:
        sys.stderr.write('cannot fetch %s (%s)\n' % (k, e)); return None

def imread(p):
    if p is None: return None
    img = cv2.imread(p)
    if img is None and p.lower().endswith('.webp'):
        try:
            from PIL import Image; img = cv2.cvtColor(np.array(Image.open(p).convert('RGB')), cv2.COLOR_RGB2BGR)
        except Exception: img = None
    return img

# ---------- detection (YOLOv8n ONNX, person class) ----------
_S = None
def session():
    global _S
    if _S is None:
        import onnxruntime as ort
        m = next((m for m in MODELS if m and os.path.exists(m)), None)
        if not m: sys.exit('yolov8n.onnx not found: copy it from Dropbox _catalogs/tools/smartcrop/ into tools/crop/ or set PK_YOLO')
        _S = ort.InferenceSession(m, providers=['CPUExecutionProvider'])
    return _S

def detect_people(img, conf_thr=0.25):
    H, W = img.shape[:2]; s = 640 / max(H, W); nw, nh = round(W * s), round(H * s)
    canvas = np.full((640, 640, 3), 114, np.uint8); canvas[:nh, :nw] = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    x = canvas[:, :, ::-1].transpose(2, 0, 1)[None].astype(np.float32) / 255
    out = session().run(None, {'images': x})[0][0]; boxes = out[:4].T; scores = out[4]; m = scores > conf_thr
    boxes, scores = boxes[m], scores[m]
    if not len(boxes): return []
    xyxy = np.stack([boxes[:, 0] - boxes[:, 2] / 2, boxes[:, 1] - boxes[:, 3] / 2, boxes[:, 2], boxes[:, 3]], 1)
    idx = cv2.dnn.NMSBoxes(xyxy.tolist(), scores.tolist(), conf_thr, 0.5); res = []
    for i in np.array(idx).flatten():
        x0, y0, w, h = xyxy[i]
        res.append([round(float(x0 / s), 1), round(float(y0 / s), 1), round(float((x0 + w) / s), 1), round(float((y0 + h) / s), 1), round(float(scores[i]), 3)])
    return res

def det_cache():
    C = {}
    if os.path.exists(DET):
        for l in open(DET):
            try: r = json.loads(l); C[r['k']] = r
            except Exception: pass
    return C

def detect(keys):
    C = det_cache(); os.makedirs(CACHE, exist_ok=True); n = 0
    with open(DET, 'a') as fo:
        for k, _, _ in keys:
            if k in C: continue
            img = imread(local(k))
            if img is None: continue
            H, W = img.shape[:2]; r = {'k': k, 'w': W, 'h': H, 'p': detect_people(img)}; C[k] = r; fo.write(json.dumps(r) + '\n'); n += 1
            if n % 50 == 0: fo.flush(); print('detected', n, flush=True)
    return C

# ---------- the rules ----------
def features(img, P):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); H, W = g.shape; out = []
    for p in P:
        x0, y0, x1 = int(max(0, p[0])), int(max(0, p[1])), int(min(W, p[2])); y1 = int(min(H, p[1] + 0.6 * (p[3] - p[1])))
        c = g[y0:y1, x0:x1]
        if c.size < 100: out.append((0.0, 0.0)); continue
        c = cv2.resize(c, (64, 96)); out.append((float(cv2.Laplacian(c, cv2.CV_64F).var()), float(c.mean())))
    return out

def subject(rec, img):
    """the people that count (conf >= .3, not specks), their prominence, the top person and the group (rules 1 and 5)"""
    W, H = rec['w'], rec['h']
    P = [p for p in rec['p'] if p[4] >= 0.3 and (p[2] - p[0]) * (p[3] - p[1]) > 0.0015 * W * H]
    if not P: return None
    area = lambda p: (p[2] - p[0]) * (p[3] - p[1])
    feats = features(img, P); med_l = np.median([f[0] for f in feats]) + 1; img_lum = float(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).mean()) + 1
    def prom(i, p):
        cx = (p[0] + p[2]) / 2 / W; v = math.sqrt(area(p) / (W * H)) * p[4] * (1.15 - 0.3 * abs(cx - 0.5))
        if p[0] < 0.02 * W or p[2] > 0.98 * W: v *= 0.55          # cut by the frame edge: crew / crowd at the margin
        if p[3] > 0.985 * H and (p[3] - p[1]) < 0.7 * H: v *= 0.8
        gap, nov = 1.0, 0
        for j, q in enumerate(P):
            if j == i: continue
            if max(0, min(p[2], q[2]) - max(p[0], q[0])) / max(1, min(p[2] - p[0], q[2] - q[0])) > 0.3: gap -= 0.12; nov += 1
        v *= max(0.6, gap)
        if nov >= 3: v *= 0.7                                       # inside a dense crowd: audience
        v *= 0.75 + 0.25 * min(2.0, feats[i][0] / med_l)            # in focus
        v *= 0.85 + 0.3 * max(-0.5, min(1.0, (feats[i][1] - img_lum) / img_lum))   # lit
        return v
    pr = [prom(i, p) for i, p in enumerate(P)]; order = sorted(range(len(P)), key=lambda i: -pr[i]); top = order[0]
    group = [i for i in order if pr[i] >= 0.6 * pr[top]]; wide = False
    tp = P[top]
    # rule 5 (wide scene): 10+ people, the top one small (<7% of the frame) and touching the bottom = an audience member;
    # the performers are the two highest people not touching the bottom
    if len(P) >= 10 and area(tp) < 0.07 * W * H and tp[3] > 0.97 * H:
        up = sorted([i for i in range(len(P)) if P[i][3] <= 0.97 * H], key=lambda i: P[i][1])[:2]
        if up: top = up[0]; group = up; wide = True
    return {'P': P, 'pr': pr, 'top': top, 'group': group, 'wide': wide}

def fits(tp, x0, cw):
    """hard check: the top subject's box inside the window with a 3% margin. A close-up wider than the window (arms, a guitar
    neck) cannot fit whole: then its head must be well inside (the box's middle 40%, where the face is)"""
    mg = 0.03 * cw
    if tp[2] - tp[0] <= 0.94 * cw: return bool(tp[0] >= x0 + mg - 1 and tp[2] <= x0 + cw - mg + 1)
    hc, hw = (tp[0] + tp[2]) / 2, 0.2 * (tp[2] - tp[0])
    return bool(hc - hw >= x0 + mg - 1 and hc + hw <= x0 + cw - mg + 1)

def tall_x(rec, S, aspect):
    """object-position x (%) for a frame of width/height = aspect narrower than the photo (rules 2-4)"""
    W, H = rec['w'], rec['h']; cw = min(W, aspect * H)
    if W <= cw + 1: return 50.0, True
    P, top, group = S['P'], S['top'], S['group']; tp = P[top]
    sub = [P[i] for i in group]; sx0 = min(p[0] for p in sub); sx1 = max(p[2] for p in sub); scx = (sx0 + sx1) / 2
    sparse = len(P) < 6
    if sparse or S['wide']:                                   # rule 4 (no audience) and rule 5: center the band if it fits, else the singer
        c = scx if (sx1 - sx0) <= 0.9 * cw else (tp[0] + tp[2]) / 2
        x0 = min(max(c - cw / 2, 0), W - cw)
    else:                                                     # rule 3: the most people with the singer fully inside
        lo, hi = max(0, tp[2] + 0.03 * cw - cw), min(W - cw, tp[0] - 0.03 * cw)
        xs = np.linspace(lo, hi, 61) if lo <= hi else np.linspace(0, W - cw, 81); best = None
        for x0 in xs:
            x1 = x0 + cw; s = 0
            for i, p in enumerate(P):
                vis = max(0, min(p[2], x1) - max(p[0], x0)) / max(1, p[2] - p[0]); head = 1.0 if x0 <= (p[0] + p[2]) / 2 <= x1 else 0.0
                s += (2.0 if i in group else 1.0) * (0.5 * vis + 0.5 * head)
            if sx0 >= x0 - 1 and sx1 <= x1 + 1: s += 3.0
            s -= 0.02 * abs((x0 + x1) / 2 - scx) / cw
            if best is None or s > best[0]: best = (s, x0)
        x0 = best[1]
    return round(100 * x0 / (W - cw), 1), fits(tp, x0, cw)

def wide_y(rec, S, aspect):
    """object-position y (%) for a frame wider than the photo: the top subject's face about 30% down (rule 6)"""
    W, H = rec['w'], rec['h']; ch = min(H, W / aspect)
    if H <= ch + 1: return 50.0
    tp = S['P'][S['top']]; face = tp[1] + 0.12 * (tp[3] - tp[1]); y0 = min(max(face - 0.30 * ch, 0), H - ch)
    return round(100 * y0 / (H - ch), 1)

def in_window(rec, S, xy, tall):
    """does the top subject's box sit inside the tall window at object-position x (3% margin)?"""
    W, H = rec['w'], rec['h']; cw = min(W, tall * H)
    if W <= cw + 1: return True
    x0 = (W - cw) * xy[0] / 100; return fits(S['P'][S['top']], x0, cw)

# ---------- propose / report / apply ----------
def current(k, F, T, extra):
    """what the page uses today in a tall frame (focus-tall wins under 1200px, then focus.json, then the page's own value, else centered)"""
    if k in T: return T[k], 'focus-tall'
    if k in F: return F[k], 'focus'
    if k in extra: return extra[k], 'page'
    return None, ''

def cmd_propose(a):
    keys = read_list(a.list) if a.list else all_keys(); C = detect(keys)
    F = jload(os.path.join(ROOT, 'focus.json'), {}); T = jload(os.path.join(ROOT, 'focus-tall.json'), {}); O = jload(OVR, {})
    extra = jload(a.page, {}) if a.page else {}
    out = {}
    for k, ta, wa in keys:
        ta = ta or a.tall; wa = wa or a.wide; r = C.get(k); cur, src = current(k, F, T, extra)
        o = {'tall': ta, 'wide': wa, 'cur': cur, 'cur_src': src}
        if r is None: o['status'] = 'unreachable'; out[k] = o; continue
        img = imread(local(k)); o['w'], o['h'] = r['w'], r['h']
        S = subject(r, img) if img is not None else None
        if not S:
            o['status'] = 'no person'; o['xy'] = [50, 50]; out[k] = o; continue
        x, ok = tall_x(r, S, ta); y = wide_y(r, S, wa)
        o.update({'xy': [round(x), round(y)], 'inside': ok, 'n': len(S['P']), 'top': [round(v) for v in S['P'][S['top']][:4]], 'wide_rule': S['wide'],
                  'cur_ok': (in_window(r, S, cur, ta) if cur else in_window(r, S, [50, 50], ta))})
        if k in O: o['xy'] = O[k]['xy']; o['hand'] = O[k].get('why', 'hand')
        if not ok and k not in O: o['status'] = 'unsolvable?'
        elif cur is None: o['status'] = 'new'
        elif abs(cur[0] - o['xy'][0]) <= 8 or (o['cur_ok'] and k not in O): o['status'] = 'same'
        else: o['status'] = 'changed'
        out[k] = o
    json.dump(out, open(a.out, 'w'), indent=0); report(out)

def report(P):
    from collections import Counter
    c = Counter(v['status'] for v in P.values()); print('crop report:', dict(c))
    for st in ['changed', 'unsolvable?', 'unreachable']:
        L = [k for k, v in P.items() if v['status'] == st]
        if L: print(' ', st + ':', ', '.join(L[:60]) + (' ...' if len(L) > 60 else ''))

def cmd_report(a): report(jload(a.props, {}))

def cmd_apply(a):
    P = jload(a.props, {}); fix = set(k for k, _, _ in read_list(a.fix)) if a.fix else set(); O = jload(OVR, {})
    fp, tp = os.path.join(ROOT, 'focus.json'), os.path.join(ROOT, 'focus-tall.json'); F = jload(fp, {}); T = jload(tp, {}); log = []
    for k, v in P.items():
        if 'xy' not in v or v['status'] in ('unreachable', 'no person'): continue
        force = k in fix or k in O
        if not force and v['status'] != 'new': continue            # a crop that already works (or that self-review kept) is left alone
        if k not in F: F[k] = v['xy']; log.append(('new' if v['status'] == 'new' else 'fix (was %s %s)' % (v.get('cur_src'), v.get('cur')), k, v['xy']))
        elif F[k][0] != v['xy'][0]:   # keep the entry's y: other slots on the site were tuned with it; the fix is the x (the tall crop)
            nv = [v['xy'][0], F[k][1]]; log.append(('changed focus', k, F[k], nv)); F[k] = nv
        if force and k in T and T[k][0] != v['xy'][0]: log.append(('changed focus-tall', k, T[k], [v['xy'][0], T[k][1]])); T[k] = [v['xy'][0], T[k][1]]
    for l in log: print(*l)
    if not a.dry:
        json.dump(F, open(fp, 'w'), separators=(',', ':'), ensure_ascii=False); json.dump(T, open(tp, 'w'), separators=(',', ':'), ensure_ascii=False)
    print(len(log), 'writes' + (' (dry run)' if a.dry else ''))

# ---------- contact sheet: full photo with boxes and windows, the rule crop, today's crop, alternate windows ----------
def cmd_sheet(a):
    P = jload(a.props, {}); C = det_cache(); only = [k for k, _, _ in read_list(a.only)] if a.only else list(P.keys()); tiles = []
    TH = 220
    for k in only:
        v = P.get(k); r = C.get(k); img = imread(local(k)) if v else None
        if img is None or r is None or 'xy' not in v: continue
        H, W = img.shape[:2]; ta = v['tall']; cw = int(min(W, ta * H))
        def win(x): x0 = int((W - cw) * x / 100); return x0, x0 + cw
        full = img.copy(); lw = max(2, W // 300)
        for p in r['p']:
            if p[4] >= 0.3: cv2.rectangle(full, (int(p[0]), int(p[1])), (int(p[2]), int(p[3])), (80, 200, 80), lw)
        if v.get('top'): t = v['top']; cv2.rectangle(full, (t[0], t[1]), (t[2], t[3]), (0, 255, 255), lw * 2)
        cur = v.get('cur')
        if cur: x0, x1 = win(cur[0]); cv2.rectangle(full, (x0, 0), (x1 - 1, H - 1), (60, 60, 255), lw * 2)
        x0, x1 = win(v['xy'][0]); cv2.rectangle(full, (x0 + lw * 2, lw * 2), (x1 - 1 - lw * 2, H - 1 - lw * 2), (40, 200, 255), lw * 2)
        fw = int(TH * W / H); full = cv2.resize(full, (fw, TH))
        def crop(x):
            a0, a1 = win(x); c = img[:, a0:a1]; return cv2.resize(c, (int(TH * cw / H), TH))
        parts = [full, crop(v['xy'][0])]
        if cur: parts.append(crop(cur[0]))
        alts = [cv2.resize(crop(x), (int(TH * cw / H) // 2, TH // 2)) for x in (0, 15, 30, 45, 60, 75, 100)]
        alt = np.vstack([np.hstack(alts[:4]), np.hstack(alts[4:] + [np.full_like(alts[0], 30)])])
        parts.append(alt)
        row = np.full((TH + 26, sum(p.shape[1] for p in parts) + 8 * len(parts), 3), 30, np.uint8); x = 0
        for p in parts: row[26:26 + p.shape[0], x:x + p.shape[1]] = p; x += p.shape[1] + 8
        lab = '%s  rule %s%s  now %s(%s)  %s' % (k[-46:], v['xy'], ' HAND' if v.get('hand') else '', cur, v.get('cur_src', ''), v['status'])
        cv2.putText(row, lab, (4, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        tiles.append(row)
    if not tiles: print('nothing to draw'); return
    Wm = max(t.shape[1] for t in tiles); cols = a.cols
    tiles = [np.hstack([t, np.full((t.shape[0], Wm - t.shape[1], 3), 30, np.uint8)]) for t in tiles]
    rows = [np.hstack(tiles[i:i + cols] + [np.full_like(tiles[0], 30)] * (cols - len(tiles[i:i + cols]))) for i in range(0, len(tiles), cols)]
    cv2.imwrite(a.out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 82]); print('sheet', a.out, len(tiles), 'tiles')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='c', required=True)
    d = sp.add_parser('detect'); g = d.add_mutually_exclusive_group(required=True); g.add_argument('--list'); g.add_argument('--all', action='store_true')
    p = sp.add_parser('propose'); g = p.add_mutually_exclusive_group(required=True); g.add_argument('--list'); g.add_argument('--all', action='store_true')
    p.add_argument('--tall', type=float, default=0.56); p.add_argument('--wide', type=float, default=1.6); p.add_argument('--out', default='crop_props.json')
    p.add_argument('--page', help='JSON {key: [x, y]} of positions the page sets itself (e.g. the neighborhood preview p values)')
    s = sp.add_parser('sheet'); s.add_argument('props'); s.add_argument('--out', default='crop_sheet.jpg'); s.add_argument('--only'); s.add_argument('--cols', type=int, default=1)
    y = sp.add_parser('apply'); y.add_argument('props'); y.add_argument('--fix'); y.add_argument('--dry', action='store_true')
    r = sp.add_parser('report'); r.add_argument('props')
    a = ap.parse_args()
    if a.c == 'detect': detect(read_list(a.list) if a.list else all_keys()); print('ok')
    else: {'propose': cmd_propose, 'sheet': cmd_sheet, 'apply': cmd_apply, 'report': cmd_report}[a.c](a)
