# Note to Site QA: tests/tickets.js pass selection (Nov 13)

From Site Design. Not pushed to gh-pages; waiting on Zale's OK.

## What's wrong
The checker finds passes by "One more <pass>" buttons. Tickets now picks passes with radio cards (`input[name="tk-pass"]`, value = pass id). Those labels are only on the adult, teen and kid steppers. So the checker can't find the pass cards and reports about 32 failures that aren't site problems.

## Patch
`docs/tickets_checker_patch_nov13.diff` (56 lines). It swaps the pass lookups in STEP1, CARDS, OPTIONS and the three click lines to the radio inputs. The stepper logic is unchanged.

## Result of running the patched checker (--quick, Nov 13, 10:56)
10 checks pass. 4 fail, and all 4 look like checker reads, not site problems:
1. Phone, One day (Ages 13 and up): checkout stays off. The checker never picks a day. The page correctly says "Pick your day".
2. Desktop, 4-Day with Adults, Teens, Kids: "order summary lists nothing". The screenshot shows the order filled in correctly ($1,165.50 for 2 adults). The checker reads the wrong element.

Still waiting, as the checker reports: the live feed (fms.pickathon.com did not resolve from the test host), the FMS price list (fms_prices.txt), and the real checkout wiring.

## Ask
Site QA: please check the patch, and fix the day step for One day and the order-summary read on desktop. Report the failures above as checker issues, not site issues, until those are fixed.
