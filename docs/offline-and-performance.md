# Offline and performance notes (started Nov 1 2026, living doc)

Goal: at the farm, with weak or no cell signal, everything a visitor needs to get around still works, opens instantly, and feels smooth.

## Done (commit 72869cd)
- Map pack saved on first visit: base image, 45 tiles, 38 glow overlays, icon atlas, 60 neighborhood photos (about 10 MB). The service worker opens them from the saved copy first (files carry ?v= numbers, so updates swap in when there is signal).
- `farmmap/pack.json` is the list of files; regenerate with `tools/map-pipeline/gen_pack.py` after each map rebuild, then bump sw.js.
- App asks the browser to keep the storage (`navigator.storage.persist()`).
- Tested: with the network off, the map page loads fully (`tools/map-pipeline/offline_test.js`, run with Playwright).

## What is already saved by the app shell
index.html (1.1 MB), data.json (3.3 MB: schedule, 264 artists, 328 sets, 20 neighborhoods, amenities, FAQ, info, stories), manifest, icons, the Pickathon font.

## Sizes on disk (what we are choosing from)
- Artist and story photos `i/`: 1,235 files, 154 MB. Too big to save whole.
- Screensaver `ss/`: 651 files, 96 MB. Never save offline.
- Map: about 6 MB. Neighborhood photos `h/`: 4 MB. Alum `alum/`: 3.4 MB. Food, bev, craft, deco: about 5 MB.
- data.json also holds 1,194 video links; videos stream and stay online-only.

## What a visitor needs on site (to cover next, in this order)
1. **Tier 0, saved on first visit (done):** map, neighborhood pages, schedule, lineup, amenities, info, FAQ, tickets screen.
2. **Tier 1, add next (small):** current-year artist portraits at thumbnail size (about 20 to 30 MB at most; pick by the 2026/2027 lineup only), stage photos, first-aid and emergency info, shuttle and parking details, water and toilet locations. Decide the size ceiling with Zale.
3. **Tier 2, optional "Save for the farm" button:** more photos and past-year pages, on Wi-Fi only.
4. **Never offline:** videos, screensaver, live social feeds. Show a friendly "needs signal" message instead of a broken tile.

## Next performance work
- Smoothness: show the base image first, decode tiles before they scroll in, preload the glow overlay of the neighborhood about to be tapped, GPU-friendly transforms; test on a mid-range Android at 60fps.
- Measure: Lighthouse on a throttled phone, first-open time on slow 3G, and time to first map tap with the network off.
- Fonts: the map page still asks Google Fonts for Archivo, which fails offline (falls back to a system font). Self-host Archivo and save it with the pack.
- iPhone: browser storage can be cleared after about a week without a visit unless the app is added to the Home Screen. Keep the install prompt and persistent-storage request.
- Updates at the festival: only apply when there is signal; show a quiet "map updated" notice.

## GPS "you are here" dot (planned)
GPS works with no cell signal. Needs map calibration: at least 3 landmarks with known latitude/longitude mapped to map pixels (affine fit), accuracy about 5 to 10 m. Show the dot only while the visitor is on the farm; add "nearest toilet, water, first aid" from the amenity data.
