# Build page thread: status, rulings and asks (Nov 13 2026)

Owner: the Build with Pickathon page (route `build`). This is the Build thread's outbox. It lives here because the Pickathon Website project is full. Other threads answer in their own outbox, quoting the row id.

## Status
- Draft 1 of design_specs/build_page.md is on branch `build-r1`. It is **not deployed** and waits on Zale's OK.
- Source is in tools/build_r1/ (bd.js, bd.css, data.py, build.py). The old r.build template block is now the island `<div id="bd1" data-pk-own>`. The old out.bp renderer code is left in place, unused.
- Every word is in data.json `buildPage`.
  - Builds come from hoods: 2026 `nx` with the curated gallery's first photo; earlier years from `pb.pt` with a same-year `pk-pb-` photo.
  - Private builds come from privateBuilds. Each got a short `nx`, taken from its own `d` line.
- Start a project opens a 6-step sheet that posts the same buildForm fields. buildForm.live is still false, so nothing sends. `window.pkBuildStart(kind)` opens it, with an optional preselected kind.
- Phone length: about 3.7 screens at 390x844 including the footer (it was 21).

## Zale's rulings (Nov 13, pickers)
1. **Sponsorship and donations get their own page** (a new route), linked once from Build's deadline card. Build stays hire-only.
2. **Design and build partner sign-up** (architects, builders, fabricators, suppliers, schools, volunteers) **goes on that same page**, which becomes "fund it or help build it": the one place for everyone who isn't a client. The old "I want to help build" door stays off Build and off the project sheet.
3. **The Zeffy raffle is not on the site at all.** It runs through email and social only.

## Asks
| id | to | ask | status |
|---|---|---|---|
| build-1 | Design Studio | Spec the new support page from rulings 1-2: sponsors, donors and design/build partners. It needs one primary per section, a partner form (the old help-door fields: role, how, team size, when) and a sponsor/donor contact. No raffle (ruling 3). Build links to it once from the deadline card. | open |
| build-2 | Festival History | Build story pages (design_studio-17) are still missing. Until they land, Build cards open the neighborhood page for that year (Starburst opens its blog story; Wild Horse has no link), and no card says "Read the story". Also wanted: same-year photos of the 2022-2024 builds that have a downstream home (2024 shows only Galaxy today), and a photo for the HQ private build. | open |
| build-3 | Site Build | The sitewide "Start a project →" card is 44px; buttons.md says 50/56. Home's "Get involved" door (home_flow.md section 4) should point at the new support page once it exists. | open |
| build-4 | Design Studio | Draft 1 design questions. (a) Build cards use each neighborhood's first curated gallery photo; Windmill's and Market's are weak structure shots. (b) What a card opens before its story page exists (see build-2). | open |
