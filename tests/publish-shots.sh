#!/usr/bin/env bash
# Publish one sweep's screenshots + report to the qa-shots branch (tests/shots/latest/),
# replacing the previous sweep so the branch stays small. The site branch (gh-pages) is untouched.
#   bash tests/publish-shots.sh tests/out/<run>
set -euo pipefail
OUT="$(cd "${1:?usage: publish-shots.sh <run folder>}" && pwd)"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
cd "$TMP"
git init -q -b qa-shots
git remote add origin "$(git -C "$REPO" remote get-url origin)"
mkdir -p tests/shots/latest
cp -r "$OUT/shots/." tests/shots/latest/ 2>/dev/null || true
cp "$OUT"/issues.md "$OUT"/keys.json "$OUT"/results.json tests/shots/latest/ 2>/dev/null || true
cat > README.md <<EOF
Screenshots from the latest Pickathon site QA sweep (run $(basename "$OUT")). Made by tests/run.js on gh-pages.
- tests/shots/latest/ref/<size>-<tab|app>/<page>.jpg  reference screens of every page (tab mode; 6 per template type)
- tests/shots/latest/fail/<size>-<tab|app>/<page>.jpg screens where a check failed (named in issues.md)
- tests/shots/latest/issues.md, results.json, keys.json the report and raw results
Each publish replaces the last one (no history), so this branch stays small.
EOF
git add -A
git -c user.name="Zale Schoenborn" -c user.email="zale@pickathon.com" commit -q -m "QA screenshots: $(basename "$OUT")"
git push -q -f origin qa-shots
echo "published $(find tests/shots/latest -name '*.jpg' | wc -l) screenshots ($(du -sh tests/shots/latest | cut -f1)) to qa-shots"
rm -rf "$TMP"
