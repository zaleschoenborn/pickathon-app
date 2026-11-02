# Farm map pipeline (2026 notes, for the 2027 map)
Order: clean base art -> ownership partition -> bake highlight overlays -> merge -> shapes -> build -> deploy.
Scripts are the working copies from 2026 (paths inside point at /tmp/bk and /tmp/tl; adjust).
- sliv5.py / sliv6.py: find and inpaint pale specks hugging the outer border (white slivers, mint wedges)
- clean.py, mint2.py, fawn.py: hairlines, pale hatch patches, white trail casing
- ovl.py, excl.py, part.py: overlap audit, exclusive ownership of each pixel (palette + icon-ring majority + manual overrides)
- bake.py: builds l/<hood>.webp + atlas using partition masks, plate-safe enhancement
- lit_shapes.py: hit paths from lit alpha
Rules: one owner per neighborhood pixel and per amenity icon; WordPress amenity lists are the authority.
