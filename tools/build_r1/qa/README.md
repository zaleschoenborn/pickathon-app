# Build page screenshot and fit scripts (Playwright, run from /opt/npm-tools)
Moved from a scratch folder so a new thread has them. Each serves the checkout over a local port and screenshots the Build page (route `build`).
- `shots.js <outdir> <WxH,WxH>`: full-page phone-style scroll shots (`<size>-p0.jpg`...) plus the sheet steps (`-s1..s6`); prints page height in screens and script errors.
- `sec.js <outdir> <sizes>`: one shot per section (hero, builds, What you get, Who hires us, deadline card) and prints `section height / visible band` with OVER when a section does not fit one screen.
- `dbg.js <WxH>`: prints the builds section's measured parts (photo height, card size, chip row width).
Set `ROOT` at the top of each script to the checkout. Sizes to use: 390x844, 430x932, 360x740, 820x1180, 1180x820, 1440x900.
Narrow QA (the full --quick run times out in the cloud sandbox): `node tests/run.js --only='build' --sizes=390x844,1440x900 --modes=tab --no-speed` (about 5 min).
