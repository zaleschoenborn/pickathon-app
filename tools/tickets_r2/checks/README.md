# Tickets page checks (Site Design, Nov 17 2026)

Playwright checks for the Tickets page (source in tools/tickets_r2, spliced into index.html by build.py).
Run from the repo root after `python3 tools/tickets_r2/build.py`. Screenshots go to $TK_OUT (default /tmp/tk_checks).
Playwright path: $PW (default /opt/npm-tools/node_modules/playwright).

| Script | Checks | Time |
|---|---|---|
| tk3.js | pricing logic, order record, fees (21) | ~3 min |
| tk5.js | whole page: entry, grid, steps, coming soon, fit (53). Prints only at the end; run in the background | ~15 min |
| snew.js | entry, steps, mixed passes, add-ons only (6); `SZ=desk` for desktop | ~2 min |
| gift_t.js | gifting and transfer (28) | ~3 min |
| clock_t.js | sale clock and WordPress switch override (8) | ~2 min |
| grid_t.js, mix_t.js | Choose-your-pass grid taps and mixed orders, with screenshots | ~1 min |
| soon_t.js | coming-soon page screenshots (sale switch answers {"on":false}) | ~1 min |
| bar_t.js | order bar sits above the phone tab bar | ~1 min |
| fms_line.js | stand-in FMS prices (Nov 7 read) used by the feed mock | data |

Before any push also run Site QA's kit: `node tests/run.js --quick --no-rotate --no-speed --only=tickets --out=<dir>` (~12 min).
