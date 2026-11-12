# tools/crop: the subject-crop tool

Zale's rule (Nov 12 2026): every photo the site shows, including video thumbnails, reel and tour frames, card and map previews, goes through the subject crop, with self-review. The rules are the skill **pickathon-tall-photo-subject-crop**: find the singer or the few people who stand apart; in a tall frame keep them fully in (with the most audience when 6+ people are found, centered when fewer); wide-scene rule for tiny audience members at the bottom; in a wide frame the face sits about 30% down.

## Setup
- Python 3 with `opencv-python-headless onnxruntime numpy` (and Pillow for .webp).
- The person model `yolov8n.onnx` is not in git. Copy it from Dropbox `_catalogs/tools/smartcrop/yolov8n.onnx` into this folder, or set `PK_YOLO=/path/to/yolov8n.onnx`.
- `cache/` (git-ignored) keeps person detections (`det.jsonl`) and downloaded remote thumbnails.

## Commands (run from the repo root)
```
python3 tools/crop/crop.py propose --list keys.txt [--page page.json] --out props.json   # or --all for every image the site ships + YouTube thumbs in data.json
python3 tools/crop/crop.py sheet props.json --out sheet.jpg [--only keys.txt] [--cols 3]  # contact sheet for self-review
python3 tools/crop/crop.py apply props.json --fix fix.txt [--dry]                         # writes focus.json / focus-tall.json
python3 tools/crop/crop.py report props.json                                              # new / changed / same / unsolvable? / unreachable
```
- **keys.txt**: one key per line, as the page's `<img src>` says it (`i/p573.jpg`, `court-fish-night-2025-a.jpg`, or a full `https://i.ytimg.com/...` URL). Optional tab-separated columns give the frame the image fills: `key<TAB>tall<TAB>wide` (aspect = width / height). A tall frame narrower than the photo sets x; a frame wider than the photo sets y. Home used: hero 0.55 / 1.78, neighborhood photo 0.51 / 1.03, Before they were big card 0.6 / 1.0.
- **--page**: positions the page sets itself (e.g. the neighborhood preview `p` values in `tools/home_r2/hoods_home.json`), so the report compares against what really shows.
- Remote images are fetched once into `cache/img/`. `i.vimeocdn.com` is blocked from the cloud workspace: those keys come back **unreachable**; run on a machine that can reach them, or crop a local copy.

## What the statuses mean
- **new**: no crop anywhere yet; `apply` writes the rule's value into focus.json.
- **same**: today's crop already keeps the subject (or is within 8 points of the rule); left alone.
- **changed**: today's crop cuts the subject by the hard check. NOT written unless the key is in `--fix` or `overrides.json`: look at the sheet first. Most "changed" on architecture or crowd frames are fine as they are (the detector finds people, not structures).
- **unsolvable?**: the subject cannot sit inside any window. Look: a close-up whose face is in is fine; a pair or band too wide for the frame, or a singer at the photo's edge, goes back to photo picking.
- **no person**: stays centered unless a hand fix says otherwise.

## Self-review (mandatory, before anything is shown to Zale)
1. Make the sheet. Each row: the full photo (green = people, yellow = the rule's subject, orange window = the rule, red window = today's crop), the rule's crop, today's crop, and alternates at x = 0, 15, 30, 45, 60, 75, 100.
2. For each row: is the singer fully in? Is the window on the performers (not an audience member, crew, or a bandmate at the edge)? For architecture frames, is the structure the subject?
3. Fix misses as hand overrides in `overrides.json` (`{"key": {"xy": [x, y], "why": "..."}}`; they always win), and list keys whose rule value is right in a `--fix` file. Then `apply`.
4. `apply` never overwrites a crop that works. When it fixes a key that already has a focus.json entry it changes only x (other slots were tuned with that y) and mirrors x into focus-tall.json, which wins under 1200px.
5. Report: the sheet, the hand fixes with reasons, and the photos no crop can fix (for the photo team, not Zale).

The site applies the values through `focus.js` (focus-tall.json under 1200px, then focus.json, unless a hand CSS rule exists on desktop).
