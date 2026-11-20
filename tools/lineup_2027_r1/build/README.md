# How to rebuild the Lineup 2027 standalone page

Owner: Design: Lineup, Artist, Archive and Watch (design_lineup_artist). Output goes to `tools/lineup_2027_r1/` (`index.html` and `img/`). Everything the build needs is in this folder or in the repo root (`data.json`, `i/`, `m/`).

```
rm -rf tools/lineup_2027_r1/img
python3 tools/lineup_2027_r1/build/build.py        # ~1 minute, writes index.html + img/ (Pillow only)
python3 tools/lineup_2027_r1/build/check.py        # must print "0 failure(s)" (needs Playwright)
```

Environment overrides (all optional): `PK_APP` (a checkout holding data.json and i/, default the repo root), `PK_OUT` (output folder), `PK_CLASS_TABLE` (class table csv).

## What is in this folder
- `build.py`: the generator. Reads `data.json` and the class table, writes the page. Notes inside the file say where each rule came from.
- `style.css`, `app.js`: inlined into the page.
- `ext/`: art the repo does not carry (per-year horizon art cut from the brand kits in `ext/seam/`, extra artist photos). `ext_photos.json` maps those photos to acts.
- `fonts/`: the display font the page inlines.
- `class_table_v159.csv`: copy of the live class table (Dropbox `_catalogs/master/class_table_nov19_v159.csv`, saved Nov 20 2026 07:20Z). **Class labels come only from the live table** (pointer `_catalogs/master/CLASS_TABLE_CURRENT.txt`). Before every rebuild, copy the file the pointer names over this one, or set `PK_CLASS_TABLE`.
- `check.py`: the checks (images, overflow, horizons, the 2026 reel and its clips, artist pages with clips).
- `../art/logos_nov20/`: Artwork's final year logos (y07, y11, y12, y13, y17, y22, y24 new, y25). The build uses them when `i/` does not have them yet. Site Build copies them into `i/` at merge; after that this folder can go.

## What the build does that is worth knowing
- Year pages: each year with a photo hero gets its own shallow horizon from that year's kit colors (2022 to 2026 hand-cut art; 2006 to 2019 rotating hills, sun, pines and scallops; 2024 keeps its mustard hills). 1999 to 2005 have no photo hero, so no horizon.
- 2026 reel: ten clip frames in the planned order. Tapping a segment switches the frame; the play ring opens an embedded Vimeo overlay with the clip's hash and start time. Artist pages of those acts get a "Videos · Pickathon 2026" shelf with the same overlay. Reel data lives at the top of `build.py` (hashes from Video Catalog).
- This is a standalone page, not the live app. Site Build ports it into the PWA using `data.json` as the source; the live app already has its own player (`window.__pkVideo`).
- The Site QA kit (`tests/run.js`) tests the live app, not this page, so use `check.py` here and run the kit after the port.
