# Morning notes: 2022 and 2024 year pages (step 2 of 2, Nov 14 2026)

Branch `review/2022-2024-overnight` (from gh-pages build 5203). Build bumped to **5204** (sw.js V and focus.js?v=, index.html focus.js?v=, version.json). Nothing is live; nothing pushed to gh-pages.

## Phone results first (390x844)
- 2022 and 2024 year pages render on the phone: hero reel opens, play ring is transparent, tour/equal buttons unchanged, no credit lines. 2022 and 2024 reel captions now carry catalog stage and photographer.
- QA (phone, 2024 year page + Geese + LA LOM): **7 open problems, 0 new**. All are in shared components, none caused by this run, not touched (see "Shared components" below):
  - Timeline dots `pk-tn-dot` are 14x14px (below 44px) and one pokes 50px outside its card on past:2024.
  - "Listen to Pickathon" button lacks the shared pk-cta style.
  - Artist page "Pickathon 2024" secondary button is 44px, should be 50.
  - Year story paragraph runs past its box and the genre chip "Bluegrass & string band" is cut off (ellipsis).
- Wider phone-size sample (home, lineup and 4 year pages 2023-2026): 14 open, 0 new. Same families, plus 2026/2025/2023 star buttons (30px, 7px outside card) and Home "Play pickathon 2019 again" (112x30), "See all Discoveries", "Another year", "Alert me when it opens", "Tickets Nov 19" button styles.

## Desktop results (1440x900)
- Same sample: 0 problems that are new; the desktop screens for past:2024, Geese and LA LOM raised nothing beyond the phone list above (those problems are all tagged 390).

## QA caveat (please read)
The exact command (`--quick --no-speed --no-rotate --sizes=390x844,1440x900`, all 65 pages, tab and app) hung twice in this sandbox (no log line for 20+ minutes after the first few shots, then the browser closed). I ran the kit on subsets instead, tab mode only, one worker: (a) home, lineup, four year pages; (b) past:2024, act:geese, act:lalom. The kit found no past:2022 page id in this run, so **2022 was checked by my own screenshots, not by the kit**. **A full kit run (tab + app, all pages) still needs to happen on a normal machine before any deploy.**

## Screenshots (in `review-shots/` on this branch)
Phone 390x844: `year2022-phone-390x844.png`, `year2022-phone-390x844-scrolled.png`, `year2024-phone-390x844.png`, `year2024-phone-390x844-scrolled.png`, `act-geese-phone-390x844.png`, `act-geese-phone-390x844-scrolled.png`, `act-bonnie-phone-390x844.png`, `act-bonnie-phone-390x844-scrolled.png`.
Desktop 1440x900: the same eight names with `desktop-1440x900` in place of `phone-390x844`.

## What was built (data only; no component or CSS changes)
- **2024 artist galleries** (`actPages.<act>.gal` in data.json): 52 acts re-set from the step 1 picks, in pick order, with catalog stage and photographer. 236 distinct photos, none used twice. Files already in the repo; **no new photo copies**. 28 picks have no `m/` phone copy, so `m` points to the full file (277 KB max) instead of adding copies.
- Where a pick equals the act's page hero (26 acts), I **dropped it from the gallery** so the hero is not shown twice: 30 acts have 4 photos, 19 have 5, 3 have 3.
- **2024 reel:** three swaps applied (Bonnie "Prince" Billy to y24h Woods, Kara Jackson to y24g4 Windmill, Searows to y24g1 Cherry Hill). Stages and photographers set on all 14 frames where known (11 unknown stay blank).
- **2022 reel:** stage and photographer copied from the catalog tags on all ten frames. Fixed: Faye Webster (Woods, Mark Stein), Goth Babe (Woods, Norm Eder), and photographers for Valerie June, Wet Leg, Nubya Garcia, Emma Jean Thackray, Automatic.
- `yearPhotos` 2022/2024: stage/photographer filled where the tile file is a pick and the field was blank.
- **2022 galleries not built.** 2022 acts have no artist pages (only 2023 and 2024 exist), and the 209 unseen catalog picks cannot be viewed (Dropbox blocked), so nothing from them was used. Only seen repo files are in data; no 2022 artist pages were created.

## Questions for Zale (default taken in the build)
1. **Allow `dl.dropboxusercontent.com` or "Require this computer"** so 2022 catalog picks can be viewed. Default: 2022 stays on the one seen tile per act and the reel.
2. **Create 2022 artist pages?** They need the three-part story copy first. Default: none built.
3. **Hero photo repeated in gallery (26 acts):** default dropped from gallery. Alternative: keep five and change the hero.
4. **28 galleries photos with no photographer** carry the generic "Pickathon photographer" in alt text only (no visible credit). Default: Photo Catalog looks up the real name.
5. **31 gallery photos not previously in a gallery use a default crop `50% 40%`** (not checked by eye for subject crop). Default: check the crops on the phone before deploy.
6. **The Macks and The Barbaras (2024)** have no picks, so their galleries are unchanged (6 photos each). Default: leave.
7. Step 1 questions 3, 4, 5, 6, 7, 8, 9, 11 stand with their defaults (Po' Ramblin' Boys and MØTRIK keep 2023 galleries; Robbie Parker gets none; Kara Jackson y24g5 and Jeffrey Martin r3b photos go to Photo Catalog for a mislabel check; Automatic and Wet Leg are the weakest 2022 reel frames).

## Shared components (not changed; need Design/Site QA)
- `pk-tn-dot` timeline dots: 14px tap target, one overflows its card on past:2024.
- "Listen to Pickathon" and several Home/Lineup buttons without the shared pk-cta style; Artist page "Pickathon 2024" button 44px not 50.
- Year story text overflow and cut-off genre chip on phone.
- Star buttons 30px and poke outside the card on 2023-2026.
- Geese artist hero line shows a broken stage icon ("Slab Sessions stage" alt text) next to "Woods".
- Gallery `alt` text reads "photo by <name>" (invisible credit); consider removing.

## Needs sign-off before any live deploy
- **Design:** crops on the 31 default-crop gallery photos; whether dropping the duplicate hero is acceptable; 2022 pages stay on one photo per act.
- **QC:** a full kit run (all pages, tab and app, both sizes) that completes; the shared-component problems above; 2022 reel frames Automatic and Wet Leg.
- Zale approves the deploy himself. Refresh twice after any deploy.
