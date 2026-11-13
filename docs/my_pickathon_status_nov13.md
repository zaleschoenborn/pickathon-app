# My Pickathon: what's built, and what Kris and Data Model must build before it goes live (Nov 13 2026, draft 1)

Branch: `my-pickathon-nov13` in pickathon-app. Not deployed; it waits for Zale's OK. Everything still runs on sample data (Fern Holloway, fern@example.com, PKT-1001). There's no real fan data anywhere.

## Built in this pass
- **Two bugs fixed.**
  - Any re-render (a star tap, turning a tablet, a resize) used to wipe the tickets card and the account line for good.
  - The sign-in sheet locked "Email me a link" for up to 60 seconds after reopening, and wiped typing every second.
- **Top half matched to the spec and rulebook.**
  - The late state ends with "Your tickets stay yours."
  - Buttons are 50px (56px on desktop) with 6px corners.
  - Ticket switching uses chips over the QR.
  - On tablet, everything sits in one centered 660px column, with the plan's text and schedule side by side.
  - On desktop, the account line sits at the right of the title row, with two columns (7:5).
- **Your weekend plan made compact:** one card and one button ("See the 2027 lineup").
- **Past Pickathons**, replacing the old star list, the Relive photo grid and the four-tab story box (Zale, Nov 13). It has:
  - gold year chips (each opens that year) plus "Edit years", which opens a year picker popup;
  - an all-time top five and each year's top five, with "Choose five" when more than five are starred (a popup, max five);
  - "Saved on this device";
  - "Make my story image", which opens a popup to pick the image: years, all-time five, or a year's five (Zale, Nov 13).
- **Saving stays in the browser** (pk-pstars-2027, pk-pick-2027 including the new "all" key, pk-share-2027) until the account store lands.

## Spec note for Design Studio
my_pickathon.md says "Pickathon 2027 · Aug 4–8". The rulebook (Nov 12) says "Aug 5–8, 2027" with "Gates open Wed, Aug 4", so the page uses Aug 5–8. Please update the spec.

## What Kris must build (FMS)
1. **The four account endpoints**, from the my-pickathon-accounts branch:
   - **login-link:** sends the email.
   - **session:** trades the link for a session. It returns 401 when the link is old or used.
   - **me:** returns the fan's email and their orders for the coming festival.
   - **DELETE session.**

   Too many tries returns 429 with Retry-After. The site must be allowed to call these from pickathon.com and the prototype address.
2. **What "me" returns for each order:**
   - order number and date bought;
   - each ticket's type, holder, status (ready, pending, cancelled, transferred) and gate QR value (empty until released);
   - the payment plan: status, total, paid, next date and amount, the late date and amount, and the schedule rows;
   - a link to the fan's own order page (for "Manage payments" and "Pay or update card").
3. **Sign in with a code for the installed app.** The email carries a 6-digit code next to the link, and a code-exchange endpoint signs the fan in. Without it, iPhone fans who installed the app get bounced to Safari.
4. **Fan data in the ticket account** (decided Nov 8):
   - one preferences record per account: music service, captions on/off, genre alerts, years I went;
   - one stars table: act-year stars, the chosen five per year **and the chosen all-time five (new this pass)**, and the picked set when two clash.
5. **Testing uses only Zale's email.** No real fan orders go into docs, screenshots or tests.

## What Data Model must write up
1. The record definitions for item 4, including the chosen-five picks (per year and "all"), which didn't exist on Nov 8.
2. The first sign-in merge:
   - the browser copy and the account copy combine;
   - the newest wins on a clash;
   - the browser copy stays as the signed-out fallback.
3. The sharing rule: private by default. A shared link carries a snapshot only, never access to the account.

## What the site does once those land (Site Build)
- Swap the sample hooks for the real calls.
- Add the expired-link page, the too-many-tries and can't-reach banners, and the app's code boxes.
- Keep the last copy of "me" on the device for no-signal QR codes, with the line "No signal. Showing tickets saved at 9:42 AM."
- Change "Saved on this device" to "Saved to your account" for signed-in fans.
