# Handoff: Map and neighborhood pages (Site Design, new thread), Nov 12 2026 night

## Where things stand
- Home is built on branch `home-poster-frame` (pushed). Order now: hero, "Who's up next?" (Before they were big), the poster, neighborhoods, tickets. Reasoning: the poster is the same idea as the stories at bigger scale, and neighborhoods then lead into the ticket line. Current architecture, not a hard rule; override for good reasons.
- Poster: two states (printed bill to today, about 3 s). Card lines: "This is the lineup in YYYY." then "This is the same lineup today." Heading "Wait, they all played Pickathon YYYY?". Rotation 2012 to 2024, random. End order comes from the approved top10 file (data.json `top10Final`).
- Zale asked for a deploy of this Home for his testing (gh-pages is a dev model, not the real site). QA kit `node tests/run.js --quick` was running when this note was written.
- Open on Home: Listen button redesign, gold Watch pill sweep, tour button, mission sentence stays OFF Home (other page), hero pause control.

## Zale's map ideas (Nov 12 night), to brainstorm first, build after his OK
Desktop: the old version had a preview pane on the right; a consultant moved it to a card over the map with icons on the right. He finds that busy and not intuitive. Lots of free space on the right on desktop: a click should preview the neighborhood there (rotating hero shots like Home's neighborhood preview, kind, name, title, concept, video) and let people go deeper. People will also want to roam the map and find shows. Too many labels on the map; fewer.
Phone: awkward. Tried icons across the bottom with the preview pane popping in and the map getting too small to see the hero shots. Wants a great phone design.

My proposal to put in front of him (not yet approved):
- Desktop: map is the picker, right side is the preview. No icon list on the right; labels only on hover or pick; Stage / Gathering / Camping chips dim the rest. Nothing picked: intro text. Picked: rotating hero shots, kind, name, title, one concept line, play button, buttons "Open neighborhood" and "Shows here" (schedule filtered to that place).
- Phone: preview first, map as context, reusing Home's neighborhood module (big photo, still mini map, emblem row). Tap the mini map to open the full map; picking returns to the big photo; swipe the photo steps neighborhoods. Same two buttons underneath.
- Home and the map page become one design.

## Rules to keep (rulebook, Nov 12)
Map entry shows the title screen until a click; Back restores the map; first pick zooms in, another pick keeps zoom and centers; no listen dock on map pages; kinds read Stage / Gathering / Camping neighborhood; nav "Neighborhoods" desktop, "Places" phone; neighborhood page has a small map cutout in the hero corner and no map link at the bottom; past years use that year's name with "The ground that is <today's name> today" beneath; phone first (390x844, 430x932, 360x740), then tablet both orientations, then desktop; every photo through the subject-crop rule; no scroll bars; no pulsing, static glow only.
Zale has not yet seen the Time Machine; he will come back to it.

## Working notes
Site file: /home/claude/pickathon-app/index.html (templated). Specs: docs/design_specs/ (neighborhood_pages.md, home_flow). Screens by Playwright (see scripts in /home/claude/scripts if the workspace persists). Do not deploy without Zale's OK; he reviews phone screenshots first.
