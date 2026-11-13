# Home poster: fixed frame, top 10 only (Zale, Nov 12 2026)

Supersedes "open on the printed poster, then collapse to the top 10" from the Nov 12 poster motion ruling. Everything else in that ruling stands.

- The poster frame only ever holds 10 names. The full printed bill (13 to 85 names) is never shown on Home.
- One fixed-height frame, the same height every year, as wide as possible, filling the space between the intro text and the buttons. Buttons never move between years.
- Opening state: the year's top 10 in "Then" order (printed poster, then WordPress order, then press announcement order, then the at-festival score labeled "At the festival").
- End state: today's top 10 by magnitude ranking (minus 1 for Deep cuts only).
- Motion is on HOLD until six-month scores exist for every year (design_studio-59). Until then, build the static frame with no motion.
- 2016 opens labeled "At the festival" (Zale, Nov 12), the same label as any year ordered by the at-festival score.
- Reading the motion (Zale, Nov 12): hold on the opening top 10, move, hold on today's top 10, with one caption under the frame naming the biggest climber. No other labels or controls. The caption waits for the six-month data, since the climber comes from it.

## Replay control (Zale, Nov 12)
- Labeled "Play again", text only, no glyph, small secondary button beside "Another year". Hidden while the motion is on hold; it appears when the motion goes live.

## Play again transition (Zale, Nov 12)
- Nothing abrupt. Tapping "Play again" cross-fades the current top 10 into the opening "Then" top 10 (about 0.6 s), holds one second, then runs. No reverse glide.
- Reduced motion: cross-fade only, ending on the final order; no run.

## Update, Nov 12 evening (Zale's rulings, built on branch home-poster-frame, not deployed)

Where this differs from the notes above, this section wins.

### Motion, timeline and note
- Only 2024 moves (the only year with real six-month scores). Other years show today's top 10, still, until all-years six-month data exists (design_studio-59). No interpolation, no invented rises.
- Top 10 per six-month window. Ties are broken by today's order.
- A timeline sits at the top of the paper: "As printed 2024" on the left, "Today" at the right, a fill and a dot that move. Still years show "Today's top 10".
- Buttons under the poster: "Explore YYYY" and "Another year". No dates, location line or ribbon on the poster.
- Play again lives at the right end of the timeline row. Its words follow the state: "Restart" while running, "Play again" at the end. Restart cross-fades (0.6 s) to the opening top 10.
- The note ("Geese: 10th on the 2024 poster. #1 today.") shows once the run lands on today. On phone and tablet it sits at the bottom of the paper. On desktop it moves to the left column under the photo.

### Type size follows the score
- Each name's size is its own score at that moment (printed, each six-month window, today), blended smoothly across the run. A small band stays small until it climbs.
- At every moment the name on top is the biggest type and no name is bigger than the one above it. The rest are scaled by (score / top score) squared, so the top is clearly the biggest. The stack is stretched to fill the card at the start and at the end.
- Floors: 12 px phone, 14 px desktop (a leading "THE" is 9 px minimum). Each name is also capped to fit the column.
- Printed order stays as printed at the start. Today's order is by magnitude (minus 1 for Deep cuts only).

### Logo
- The stag logo fills the left of the paper: 37% of the paper width on phone and tablet (44% was too wide: names wrapped and shrank), about 410 px wide on desktop, running the full height of the name list. Logo on top was rejected (it would take about 150 px from a fixed-height stack).

### Desktop left column (1200 px and up, and sideways tablet draws the phone poster)
- Title, then a same-year photo, then the buttons. The photo starts on the printed headliner (Courtney Barnett, caption "Headlining the 2024 poster: Courtney Barnett"), then cross-fades slowly to the climber's photo as the climber passes the headliner on the poster, with the caption swapping in two halves. Geese uses the Woods photo i/y24g1-geese.jpg (whole band, crowd in front).
- Only shown for years where both photos exist (same year, no promo shots). Other years keep the old layout.
- Both photos go through the subject-crop rule.

### Open
- Desktop poster is small (667x430 at 1440x900) with empty space below; enlarge.
- Headliner/climber photo pairs for the other years.
- Sideways tablet and 360 phone are tight: the smallest names render about 7 to 9 px after scaling.
- Notes naming the climber for other years (Geese vs This Is Lorelei is settled for 2024: Geese).

## Update, Nov 12 late (all years)
- Top 10 and sizes use the PEAK magnitude (magnitude_dec) from class_table_nov11; build_ratings.py now reads at_festival_magnitude_dec / magnitude_dec (one decimal). 2024's measured six-month windows are kept (do not run build_ratings.py unmodified: it overwrites 2024 with straight lines).
- Every year with data runs the same motion; long years are sampled to at most 7 points so every run takes 6.4 s. Middle points for years other than 2024 are straight lines between the festival and today values (provisional); only the class steps are dated facts.
- Zale: a year moves and joins the Home rotation only if at least 5 acts have magnitude at every plotted point (D.nM >= 5, D.feat). Other years are still. 2025 and 2026 are kept out of the rotation (not enough Discovery growth yet). Code: D.feat in pkClimbLive, used by STAT(), POOL(), rand(), pkClimbRank.

## Update, Nov 12 evening (approved rating files)
- yearRatings now comes from the approved rating_history_<year>.csv files (Artist Classification, Nov 12, in Dropbox All Pickathon Photos/_catalogs/site_handoff/, copied to tools/year_pages/src_nov12/). Loader: tools/year_pages/build_ratings_nov12.py. Real dated snapshots every Feb 1 / Aug 1 from the festival's Aug 1 to 2026-11-12; mag is the peak since booking (one decimal, only rises); blank stays null, never 0. This replaces the old straight-line windows for every year, 2024 included.
- Do NOT run tools/year_pages/build_ratings.py (old, straight lines) or class_import/run.py unmodified; they overwrite yearRatings.
- Poster path therefore shows each act's peak growing; a name cannot fall back. Long years are still sampled to at most 13 points so every run is 6.4 s.
- Rotation: 2012 to 2024 only, any random pick (Zale, Nov 12 night), and only years with >= 5 acts of magnitude data. 2025 and 2026 stay built but out of the rotation.
- Poster display name: NATHANIEL RATELIFF (Zale, Nov 12). Long top names can wrap to three lines.

## Update, Nov 12 night (glide)
- Zale approved: the Home poster glides from the printed bill straight to today (two states, D.glide), about 3.2 s (RUN = 3200). The dated windows are not played on Home. No scrubber on Home (his Nov 11 rule: the draggable version belongs on the year page).
- The timeline dot still travels across the real window dates while the names glide. Names outside both top 10s never appear.
