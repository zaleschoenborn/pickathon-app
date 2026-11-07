#!/usr/bin/env bash
# Full sweep in two halves (each fits a 2-hour session command), then merge, compare and publish.
#   bash tests/sweep.sh a        phones + tablet portrait   (~80 min)
#   bash tests/sweep.sh b        tablet landscape, laptop, desktop (~80 min)
#   bash tests/sweep.sh speed    speed checks: phone on slow 4G + desktop, first and repeat visit (~25 min; run alone)
#   bash tests/sweep.sh finish   merge, mark NEW vs the last published sweep, publish screenshots
# Output: tests/out/sweep/issues.md (paste into photo-catalog/site_issues.md) and new.md (only NEW problems).
set -euo pipefail
cd "$(dirname "$0")/.."
O=tests/out/sweep
case "${1:-}" in
  a) node tests/run.js --sizes=360x800,390x844,820x1180 --workers=5 --out=$O/a ;;
  b) node tests/run.js --sizes=1180x820,1024x768,1440x900 --workers=5 --out=$O/b ;;
  speed) node tests/speed.js --out=$O/speed ;;
  finish)
    rm -rf $O/prev && git clone -q --depth 1 -b qa-shots "$(git remote get-url origin)" $O/prev 2>/dev/null || true
    PREV=$O/prev/tests/shots/latest/keys.json
    node tests/run.js --merge=$O/a,$O/b --out=$O/all $( [ -f $PREV ] && echo --prev=$PREV ) $( [ -f $O/speed/speed.json ] && echo --speed=$O/speed/speed.json )
    bash tests/publish-shots.sh $O/all
    echo "--- NEW problems since the last published sweep:"; cat $O/all/new.md 2>/dev/null || true ;;
  *) echo "usage: sweep.sh a|b|speed|finish"; exit 2 ;;
esac
