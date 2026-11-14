# Build story page: handoff for Site Build (draft 1, Nov 13 2026)

Status: prototype only. Zale likes the design and wants Site Build to pick it up. Nothing in index.html was changed.

- Page: `lab/build-story.html` (commit 2e22593 on gh-pages). Standalone, reads `../data.json`, hash routes: `#` = all builds, `#<id>` = one build (e.g. `#paddock-2025`, `#pb-0`).
- Design source: `photo-catalog/design_specs/build_page.md`, "A build's story page". Layout follows it: photo hero, designed by / built by / next row, parts, More builds swipe row, "Start a project like this" button.
- Data used today, no new fields: `hoods[*].pb` (2025 rows), `hoods[*].de/bu/nx/i` (2026), `privateBuilds`, and for Starburst the news post linked by `privateBuilds[].story`.
- Left out because the data lacks it: Built by (Starburst), "Heard here", new-home photo, recipient quote, a same-year build photo (hero is the neighborhood photo).
- New fields a real version needs: build title line, three short parts per build, builder, new-home photo, owner and quote. Whether builds are a new type or an extension of the past-build group is still undecided (see the stories options memo).
- To wire into the app: replace the `if (R === 'build')` render near index.html line 6941 with this page's render. Needs Design and QC sign-off first (rulebook). `node tests/run.js --quick` timed out twice here and has not passed yet.
