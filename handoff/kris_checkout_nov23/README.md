# Checkout, "You're in" and FMS order page: handoff for Kris (draft 1, Nov 23 2026)

Zale approved these directions on Nov 22-23. The phone drafts in this folder show the look; your code decides the how. Nothing here is built. These files live on branch `handoff/kris-checkout-nov23` only, so they never publish to the site.

## 1. Pay page (theme: page-templates/tickets-pay.php, js/tickets-pay.js)
Drafts: `pay_and_thankyou_draft1.png`, `pay_account_draft2.png`, `pay_address_draft3.png`, `address_autocomplete_draft1.png`
- Keep: the hold countdown, the order summary (one line per item, fee included), "How would you like to pay?" (Pay in full / Pickathon Payment Plan with the per-month amount and end month; no plan option where the sale round doesn't allow it), terms and plan-terms checkboxes.
- **Apple Pay / Google Pay first.** Zale wants most buyers on a wallet. Today the page uses Stripe's legacy Payment Request Button with requestPayerName and requestPayerEmail only, so the address can come back partial. Ask: switch to Stripe's **Express Checkout Element** with `emailRequired: true` and `billingAddressRequired: true`, so the wallet sheet hands over name, email and full billing address with no typing.
- **Card buyers: address autocomplete.** Move the card form to Stripe's **Payment Element** with the **Address Element** in billing mode. Used together, Stripe provides Google address autocomplete with its own key (docs.stripe.com/elements/address-element). Keep the required fields and the US default.
- **The account.** The checkout name and email create the buyer's My Pickathon account. No password: sign-in stays the emailed link or 6-digit code. The draft shows this as one quiet line under the email field: "Your My Pickathon account. Your tickets live here. No password: you sign in with this email."

## 2. "You're in" (replaces the thank-you banner in tickets-new.php)
Draft: the right-hand screens of `pay_and_thankyou_draft1.png`
- A real page, not a banner: "You're in.", what was bought, the next payment if on a plan, and the next steps (add names, plan your trip, My Pickathon).
- **FMS change needed:** when an order completes, return a signed-in session the way the email link does, so "You're in" and My Pickathon open already signed in on that phone. (Data Model row design_my_pickathon-5; tied to the sign-in code, design_studio-47.)

## 3. FMS order page (templates/customer/order.html.twig, card/payment_plan_card, card/tickets_card)
Draft: `fms_order_page_draft1.png`
- Payment plan card: a progress bar, paid and left, the next charge date and amount, the list of payments, Update card, Pay in full.
- A calm late state ("Pay $X now"), not an alarm.
- Tickets listed with names, with Edit name.
- Transfer stays locked while a plan is unpaid (today's FMS rule); say so in one line.
- Print / Download PDF.

## Not in this handoff
- Confirmation and payment plan emails (templates/email/*): not designed yet.
- The prototype's own Tickets steps: Design My Pickathon builds those on the prototype site.

## Rules that hold
- Every price shown includes the 5% fee (cart fee = subtotal × 0.05).
- No sale end date. "Tickets are running out" in every sale round.
- Sold-out items stay visible: open first, sold out grayed below with no button.

Questions: Design My Pickathon's outbox (photo-catalog/requests_from_design_my_pickathon.md), or Zale.
