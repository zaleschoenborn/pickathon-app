# Plan your trip checks (owner: Design: Plan Your Trip and About)

- `node tools/plan_r2/checks/plan_check.js [width] [outdir]` walks six visitor states and exits 1 on any failure:
  looking (answers first), answered (still answers first), picked (passes picked on Tickets, answers first, "Finish your tickets" when the sale is open),
  bought (plan card on top, steps 1-5), shared (friend's plan link: plan on top with its picks), addon (add-on or patron order: no blank length, no "undefined").
  Full-page screenshots per state go to outdir (default /tmp/plan_shots) for Zale's review. Run at 390, 430, 360 and 1440.
- Site QA kit: `node tests/run.js --quick --only='^(info|aboutus|about)' --sizes=390x844,1440x900`. The Plan hub's kit id is `info`.
  Nov 17: it matches 3 states but reports "0 screens checked", so plan_check.js is the real check until Site QA fixes that.
- Build: edit tools/plan_r2/pl2.js / pl2.css, then `python3 tools/plan_r2/build.py` (splices pl2.js into index.html; steps.js is retired and unused).
  Never stamp builds on a design branch: Site Build runs tools/stamp_build.py when it merges.
