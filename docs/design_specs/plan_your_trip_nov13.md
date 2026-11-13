# Plan your trip in time order: built (Site Design, Nov 13 2026), draft 1, waiting for Zale's OK

Branch `plan-trip-nov13` (from gh-pages 341e15f). Build 5194. Not deployed.

## Zale's rulings (Nov 13, 2:30 am)
- Packing is its own page (`#/plan/pack`), with the camp rules. The hub's "The rules" card and the Packing row are gone; one link on the hub goes there.
- The trip picks are remembered. The hub's three picks (How long, Sleeping, Getting there) are saved on the device, used on every step and on Tickets. A day ticket turns Sleep into "Hotel nearby". Each step also remembers its last chip (`pk27planv`).
- "Accept all recommendations" covered the calls below.

## What changed
- Hub (`#/plan`): the three picks, three basics (dates, place, camping included), four step cards (photo, question, one button), one packing link, "What's new for 2027", and the example-price card. The round-2 trail and the "Full details" accordion are gone: their facts now live once, on the steps.
- Step pages on one template: `#/plan/arrive`, `#/plan/sleep`, `#/plan/farm` (chip back, "2 of 4" marker, title, the fact people get wrong on a dark card, a chip row that shows one case, 3 or 4 numbered steps, one buy button when the case needs a purchase, a shared facts card, a photo strip, "Next").
- Step 1 "Before you buy" is the Tickets page, as the spec says.
- Old addresses redirect: traveling-to-pickathon and bike → Arrive; camping and lodging → Sleep; what-to-bring → Packing; ada-info, the map text page and zero waste → At the farm; easy-day → the hub; the 2026 ticket guide → Tickets. Volunteer, community, why, podcast, contact and neighbors keep their pages.
- No prices on the step pages. Prices live on Tickets; the hub's example card is computed from the ticket data with the 5% fee.
- Payment plans: the "Payment plans open Jan 5" line is gone (payment_plans_rule.md: say nothing until plans are allowed).
- Kids: "Teens 13 to 17 get a Teen Pass at half the 4-Day price."
- Buttons and chips are the 6px rectangles (rulebook), not the Nov 11 sitewide pills. The pill system (style `pk-buttons-nov11`) still covers the rest of the site: that conflicts with the rulebook, so Site Build should look at it.
- Code: `tools/plan_r2/pl2.js` (with `steps.js`, the new part, spliced in), `pl2.css`, and `build.py` (three new hooks: step address, step route + old addresses, old pages redirect in `go`). Rebuild with `python3 tools/plan_r2/build.py`.

## Open
- Photos: strips use Photo Catalog photos from the neighborhood galleries (Welcome Lot, Farmhouse, Lush, Wild, Willow, South Camp, Coyote, Paddock, Woods), cropped by focus.json. design_studio-65 ("trip moment" tags) is still open; At the farm has no food or zero-waste photo yet.
- Copy marked "last year's" until the 2027 hours post. Bike group-ride dates are not shown (the old page had 2026 dates).
- The header title clips at 360 ("Plan your trip") and 430 ("Happy Vall…"): site chrome, for Site Build.
