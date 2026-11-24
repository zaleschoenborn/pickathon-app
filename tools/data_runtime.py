#!/usr/bin/env python3
"""Speed step 3 (Nov 22-23 2026): write data.rt.json, the copy of data.json the page actually downloads.
   data.json stays whole and stays the file every chat writes. This script only DROPS the keys below, which the live page no longer reads
   (they fed the old Lineup, year and artist pages, removed in builds 5389-5392) or which other builds read from data.json at build time
   (actYearLines: tools/lineup_2027_r1/build; storyFacts: tools/story_import). Nothing is renamed or changed, so a key that is not listed ships as is.
   Run by tools/stamp_build.py on every deploy. To bring a key back, remove it from DROP and stamp again.
   Checked Nov 23: dropping these 22 keys changes no screenshot and no click-through flow (390 and 1440 wide, 20 pages); `past`, `archCT` and `sets` are read by
   live pages (artist cards, Watch order, boot) and stay."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DROP = ['actPages', 'yearRatings', 'climbSrc', 'billTN', 'lnt', 'yln', 'storyFacts', 'actYearLines', 'archLx', 'playlistStart', 'arcSpine',
        'pastSched', 'yearBill', 'yearStory', 'deepcuts', 'arc', 'actSets', 'yearPhotos', 'press', 'climb', 'yearReel']   # hoodProg kept: Places Find and the Info 'now at' card read it (design_neighborhoods-45)
def main():
    d = json.load(open(os.path.join(ROOT, 'data.json'), encoding='utf-8'))
    gone = [k for k in DROP if k in d]
    for k in gone: del d[k]
    out = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
    open(os.path.join(ROOT, 'data.rt.json'), 'w', encoding='utf-8').write(out)
    print('data.rt.json', len(out), 'bytes; dropped', len(gone), 'of', len(DROP), 'listed keys', [k for k in DROP if k not in gone] or '')
if __name__ == '__main__': main()
