# The launch switch

One command flips the site between TEST and LIVE. The default is TEST, which is how the site has always shipped.

| | TEST (default, `off`) | LIVE (`on`) |
|---|---|---|
| Page title | ends in "(test)" | "Pickathon · Aug 4–8, 2027 · Pendarvis Farm" |
| Search engines | blocked (`noindex`) | allowed |
| Link previews (texts, Facebook, X, Slack) | no tags | title, description and one photo |
| Staff test bar ("When / As") | shown | hidden |

## Use it

```
python3 tools/launch/switch.py status   # which state is index.html in?
python3 tools/launch/switch.py on       # go LIVE
python3 tools/launch/switch.py off      # back to TEST
```

Run it from the repo root, then commit index.html and deploy as usual (bump sw.js as for any release).
It changes only the block between `<!--pk-launch:...-->` and `<!--/pk-launch-->` in the head of index.html.
`off` after `on` gives back the same file, byte for byte.

## What LIVE says

The values are in `tools/launch/launch.json`:

- `siteUrl`: the public address. Link previews need full addresses, so this must be the real one.
- `title`, `description`: what search results and link previews show.
- `image`, `imageWidth`, `imageHeight`, `imageAlt`: the one preview photo (now the first Home hero photo).
- `hideTestBar`: `true` hides the staff test bar when LIVE. Set `false` to keep it.

## Why a command and not a setting in the page

Link-preview robots and most search robots read the raw file and do not run the page's scripts, so the tags must be in the file itself.

## Limits

Every page shares one address, so every shared link shows the same preview. Per-page or per-year previews need real page addresses first.
