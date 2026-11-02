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

## Update (Nov 1, later)
- **Measured smoothness** (`tools/map-pipeline/perf_test.js`, phone size, 3x pixel ratio, 4x CPU slowdown): 60fps while zooming and panning (median and 95th percentile frame 16.7 ms), 2 slow frames in 404, one 60 ms long task; base map image ready in about 0.7 s. Already smooth: GPU transforms, tiles fetched only when zoomed in, labels re-laid-out only after a pan stops.
- **Tier 1 now saved with the pack:** the 168 photos of 2026 artists (5.8 MB total), the neighborhood images and the small icon set. Pack is about 25 MB (`gen_pack.py`).
- **GPS dot built, hidden until calibrated.** Staff open `farmmap/index.html?calibrate=1` on a phone at the farm, stand at 3 to 5 spread-out spots, tap the map where they stand, press Save point; the app shows the fit error in meters. Then press Show JSON, paste it into `GEO` in farmmap/index.html, and the locate button appears for everyone. Tested with simulated GPS (`gps_test.js`); real-world accuracy still to be confirmed on site.
- **Deep-zoom sharpness is the main remaining lever.** Tiles are cut at 2.4x the map; at the closest zoom on a 3x phone the art is stretched about 2x. A 4.8x tile level (rendered from the PDF vectors) would be about 180 tiles and roughly 10 to 15 MB, but the glow overlays would need the same treatment to match, so that is a decision for Zale.
