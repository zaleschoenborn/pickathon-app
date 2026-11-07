# Site QA test kit

Checks every page of the site at every screen size, as a browser tab and as the installed app, and lists what's broken in plain words. Owned by Site QA; this folder is the only part of the repo it writes. Site Build runs it before every push.

## Run it

```
node tests/run.js --quick          # before every push: ~8 min, every page type at 390, 820 and 1440, plus phone speed
node tests/speed.js                # speed checks alone (~25 min); --quick for phone + a few pages
node tests/run.js                  # full sweep: every page, 6 sizes, tab + app (~3 h on 2 CPUs)
bash tests/sweep.sh a; bash tests/sweep.sh b; bash tests/sweep.sh c; bash tests/sweep.sh rotate; bash tests/sweep.sh speed; bash tests/sweep.sh finish
                                   # the same full sweep in two ~80-min halves, merged, compared
                                   # with the last published sweep and published to qa-shots
```

It serves this checkout on a local port, so it tests exactly what gh-pages will publish (the live github.io address is blocked from cloud sessions; a fresh gh-pages clone is the same files). Needs only Playwright (pre-installed in Claude sessions at /opt/npm-tools).

Results land in `tests/out/<run>/` (not committed):
- `issues.md`: one line per distinct problem (check, pages, sizes, what's wrong, screenshot). Paste the top of it into `photo-catalog/site_issues.md`.
- `results.json` (every raw hit), `keys.json` (problem fingerprints), `log.txt`.
- `shots/fail/<size>-<mode>/<page>.jpg` for each failure, `shots/ref/...` reference screens.

Options: `--sizes=390x844,1440x900`, `--modes=tab|app|tab,app`, `--only=<regex on page ids>` (e.g. `--only='^act:'`), `--workers=4`, `--shots=ref|fail|none`, `--base=http://…` (test a served copy), `--prev=<old keys.json>` (mark NEW problems), `--merge=dirA,dirB` (join parts run separately, e.g. sizes split across sessions).

## Screenshots for Design Studio

Each full sweep is published to the **`qa-shots` branch**, folder `tests/shots/latest/` (replaced every sweep, so the branch stays small):

```
bash tests/publish-shots.sh tests/out/<run>
git clone --depth 1 -b qa-shots https://github.com/zaleschoenborn/pickathon-app qa-shots   # to read them
```

- `ref/<size>-tab/<page>.jpg`: every page once per size (template pages such as artist, story, year and neighborhood pages: the first 6 plus Geese and the 2024 year page).
- `fail/<size>-<tab|app>/<page>.jpg`: every screen where a check failed; names match `issues.md`.

Sizes: 360x800, 390x844 (phones), 800x360 and 844x390 (phones turned sideways), 820x1180 and 1180x820 (tablet portrait and landscape), 1024x768 (small laptop), 1440x900 (desktop). Phones and tablets are tested as touch devices.

## Rotation check (tests/rotate.js)

On a phone (390x844) and a tablet (820x1180), as a tab and as the installed app: open each main page and a sample of each page type, scroll partway, turn sideways (Chrome's real orientation change, not just a resize), then turn back. Fails when the page takes over 1 s to settle, you lose your place (what was mid-screen leaves the screen), the page reloads or jumps to another page, an open panel closes, a script error fires, or any layout check fails in the new orientation.

## What it finds

The site has no per-page URLs, so the kit drives the app's own router. Pages are found fresh every run: every Main nav, More menu, footer and tab-bar destination, plus everything in data.json (neighborhoods, info pages, stories, every year page, every built artist page, one plain past-artist page per year, every current-lineup artist), Tickets in each sale state (now, teaser, sale, giving, early, reveal, lineup, sched, fest) and open-on-tap panels (Listen sheet, menu, year picker, filter, stars, story). New pages show up without editing the kit.

## Speed checks (tests/speed.js, marked "speed" in the report)

Three devices: a **mid-range phone on slow 4G** (412x823, 1.75x screen, CPU slowed 4x, 150 ms latency, 1.6 Mb/s down, like Lighthouse's Moto G Power), an **iPad-class tablet on 4G** (820x1180, 2x screen, CPU slowed 2x, 100 ms, 4 Mb/s) and a **desktop** (1440x900, 40 ms, 10 Mb/s). Each does a **first visit** (empty cache) and a **repeat visit** (service worker installed). The site has one entry page (Home), so "site opens" is Home; every other page is measured as the tap from Home: all main pages, the map, and 1-3 of each page type (same layouts, so a sample tells the story). The local server gzips like GitHub Pages, so download sizes match the live site. Run speed checks with nothing else running; a busy machine makes the phone look slower.

Per page: **content shown** (heading up and every image on screen drawn; for Home also the browser's largest paint), **usable** (content shown and no main-thread task over 50 ms for 1 s), **layout shift while loading**, **downloaded KB**. Map: base map and neighborhood icons drawn (cold start, first tap on Neighborhoods), and base map plus the lit neighborhood overlay (tap on a Home neighborhood tile).

Flags: images much bigger than shown (over 1.5x the screen pixels and 60 KB+), images, videos and iframes far below the screen that load before they're needed, large files, script and style rules unused on the first screen, slow or failed requests, and anything the service worker doesn't keep (re-downloaded on repeat visits or missing offline; pages, data.json and the map page are fresh-from-network by Zale's rule but must still be saved for offline).

Targets (fail if slower; edit `TARGETS` in speed.js):

| | phone | tablet | desktop |
|---|---|---|---|
| Home content shown, first visit | 2.5 s | 2.0 s | 1.5 s |
| Home usable | 4.0 s | 3.5 s | 2.5 s |
| Page content shown (first / repeat visit) | 2.5 s / 1.5 s | 2.0 s / 1.2 s | 1.5 s / 0.8 s |
| Page usable | 3.5 s | 3.0 s | 2.0 s |
| Map drawn (cold start or tile tap) | 3.0 s | 3.0 s | 3.0 s |
| Layout shift while loading | 0.1 | 0.1 | 0.1 |
| First-visit download / per page | 2 MB / 1 MB | 2.5 MB / 1.2 MB | 3 MB / 1.5 MB |
| Slow request / large file | 3 s / 500 KB | 2 s / 700 KB | 1 s / 1 MB |

Speed problems are listed biggest win first (time over target, or time the wasted bytes cost on slow 4G), each with the measured number. `speed.md` also has a table of every measured number.

## Ticket check, Nov 19 sale (tests/tickets.js)

`node tests/tickets.js` (~25 min; `--quick` for phone and desktop, a few orders). Phone, tablet and desktop, each as a tab and as the installed app, in the Nov 19 sale state and today's state.

1. **Prices match.** Every price on the Tickets page matches the live FMS feed, and the feed matches the FMS admin list Site Build keeps in the Project as photo-catalog/fms_prices.txt, one line: `<date>: 4-Day Pass=540, 3-Day Pass=..., ...` (names as on the Tickets page). Save it locally and pass `--fms=<file>`; pass `--feed=<regex>` if the feed URL isn't matched by the default pattern.
2. **Fallback works.** The same page with the feed blocked (no answer) and down (HTTP 500): every card still shows a price from data.json, no script errors, no wrong "sold out".
3. **Every button reaches checkout.** For every pass, each day ticket, and every choice in the later steps (getting there, parking, shuttle, camping spots, Wednesday add-on, Curation meals, give-backs, souvenirs), it builds an order and checks the lines, the 5% fee (none on give-backs) and the total. Then it clicks checkout and follows it to the real checkout's payment step, checking the event and ticket types. It **never types into any field, never enters card details and never submits a payment**; payment requests are blocked outright. Pending test orders it leaves are logged in `tests/out/ticket_test_orders.json` for cleanup (with Zale's OK) before the feed is merged.
4. No sign-in and no fan data anywhere: screenshots show only the public Tickets page.

Parts that can't run yet say "waiting on": the live feed, Site Build's FMS price list, and the real checkout wiring (the prototype's checkout button is still a stand-in). A daily scheduled task ("Site QA ticket check", Nov 12–19) runs it, messages Zale right away on any failure, and otherwise updates the ticket line in the Site QA block of photo-catalog/status_latest.md ("Site QA: ticket check …"). The run exits with code 3 when anything fails.

## The checks (each pass/fail, with a screenshot on fail)

| id | fails when |
|---|---|
| hscroll | the page scrolls sideways |
| wide | an element sticks out past the screen edge (outside any scroller) |
| clip | text is cut off (ellipsis, hidden overflow, or runs past its box) |
| overlap | two pieces of text overlap on the same layer (sheets, header and tab bar over the page are by design) |
| btn-out | a button pokes outside its card |
| scrollbar | a visible scroll bar (computer sizes; phones use overlay bars) |
| script | a script error or a page that won't open |
| broken-img / broken-video / broken-file | an image, video or site file fails to load |
| lowres | a photo shown much larger than its file: under 1x on phones and tablets, under 0.8x on computers |
| btn-style | a shared button (pk-cta / pk-bkb pri or sec) isn't 50px on phones or 56px wider, or a button-looking control doesn't use the shared style (pk-sqb small square buttons and round Watch pills are allowed) |
| tap | a tap target under 44px on touch sizes (links inside sentences excepted) |
| shift / flicker | things move a few seconds after load (two screenshots and element positions compared 1.8 s apart) |
| field-font | a form field under 16px text (iPhone zooms on tap) |
| zoom | installed app: pinch and double-tap zoom must be blocked (viewport meta, touch-action, iOS gesturestart block); browser tab: zoom must stay on |
| rules.js | regression rules, below |

Test housekeeping: the cookie banner is answered and the dev-only "TEST When / As" bar is hidden before checking. The installed app is emulated by switching the site's `display-mode` CSS rules and `matchMedia` to standalone.

## Every reported bug becomes a check

When Zale reports a bug, add an entry to `tests/rules.js` (id, why with date, an in-page `run` returning problems). Current rules: `listen-covers` (Listen dock over a button, Nov 6), `popup-close` (sheet without a visible X, Nov 5), `bar-covers` (a button partly under the tab bar or header on the first screen, found sideways on Home, Nov 7).

## Morning run

A scheduled task ("Site QA morning sweep", 4:41 am PT daily) clones gh-pages fresh, runs `tests/sweep.sh a`, `b` and `finish`, writes the result to `photo-catalog/site_issues.md`, and messages Zale only when something NEW breaks. `issues.md` ends with a short "Fixed since the last run" list.
