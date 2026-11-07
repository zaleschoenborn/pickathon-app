# Site QA test kit

Checks every page of the site at every screen size, as a browser tab and as the installed app, and lists what's broken in plain words. Owned by the Site QA chat; this folder is the only part of the repo it writes. The site build chat runs it before every push.

## Run it

```
node tests/run.js --quick          # before every push: ~5 min, every page type at 390, 820 and 1440
node tests/run.js                  # full sweep: every page, 6 sizes, tab + app (~3 h on 2 CPUs)
bash tests/sweep.sh a; bash tests/sweep.sh b; bash tests/sweep.sh finish
                                   # the same full sweep in two ~80-min halves, merged, compared
                                   # with the last published sweep and published to qa-shots
```

It serves this checkout on a local port, so it tests exactly what gh-pages will publish (the live github.io address is blocked from cloud sessions; a fresh gh-pages clone is the same files). Needs only Playwright (pre-installed in Claude sessions at /opt/npm-tools).

Results land in `tests/out/<run>/` (not committed):
- `issues.md`: one line per distinct problem (check, pages, sizes, what's wrong, screenshot). Paste the top of it into `photo-catalog/site_issues.md`.
- `results.json` (every raw hit), `keys.json` (problem fingerprints), `log.txt`.
- `shots/fail/<size>-<mode>/<page>.jpg` for each failure, `shots/ref/...` reference screens.

Options: `--sizes=390x844,1440x900`, `--modes=tab|app|tab,app`, `--only=<regex on page ids>` (e.g. `--only='^act:'`), `--workers=4`, `--shots=ref|fail|none`, `--base=http://…` (test a served copy), `--prev=<old keys.json>` (mark NEW problems), `--merge=dirA,dirB` (join parts run separately, e.g. sizes split across sessions).

## Screenshots for Design Review

Each full sweep is published to the **`qa-shots` branch**, folder `tests/shots/latest/` (replaced every sweep, so the branch stays small):

```
bash tests/publish-shots.sh tests/out/<run>
git clone --depth 1 -b qa-shots https://github.com/zaleschoenborn/pickathon-app qa-shots   # to read them
```

- `ref/<size>-tab/<page>.jpg`: every page once per size (template pages such as artist, story, year and neighborhood pages: the first 6 plus Geese and the 2024 year page).
- `fail/<size>-<tab|app>/<page>.jpg`: every screen where a check failed; names match `issues.md`.

Sizes: 360x800, 390x844 (phones), 820x1180 and 1180x820 (tablet portrait and landscape), 1024x768 (small laptop), 1440x900 (desktop). Phones and tablets are tested as touch devices.

## What it finds

The site has no per-page URLs, so the kit drives the app's own router. Pages are found fresh every run: every Main nav, More menu, footer and tab-bar destination, plus everything in data.json (neighborhoods, info pages, stories, every year page, every built artist page, one plain past-artist page per year, every current-lineup artist), Tickets in each sale state (now, teaser, sale, giving, early, reveal, lineup, sched, fest) and open-on-tap panels (Listen sheet, menu, year picker, filter, stars, story). New pages show up without editing the kit.

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

When Zale reports a bug, add an entry to `tests/rules.js` (id, why with date, an in-page `run` returning problems). Current rules: `listen-covers` (Listen dock over a button, Nov 6), `popup-close` (sheet without a visible X, Nov 5).

## Morning run

A scheduled task ("Site QA morning sweep", 4:41 am PT daily) clones gh-pages fresh, runs `tests/sweep.sh a`, `b` and `finish`, writes the result to `photo-catalog/site_issues.md`, and messages Zale only when something NEW breaks. `issues.md` ends with a short "Fixed since the last run" list.
