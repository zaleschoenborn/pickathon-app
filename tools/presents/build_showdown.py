#!/usr/bin/env python3
"""Merge a Showdown calendar pull into data.json -> showdown.events.

Usage: python3 tools/presents/build_showdown.py RAW.json SLUGS.txt [YYYY-MM-DD today]
RAW rows: [mon day, dow, presenter text, title, show time, doors time, ticketweb id, image path]
SLUGS: one 'slug/id' TicketWeb path per row, same order.
The calendar is showdownpdx.com (Showdown Saloon only). Other-venue Presents shows
are added separately in tools/presents/other_venues.json (same fields, with 'v').
"""
import json, sys, datetime, os, re
SERIES = [('sq', r'^square dancing'), ('ts', r'^two-step tuesday'), ('ww', r'^whiskey wednesday'), ('ls', r'^intermediate two-step lessons'), ('ce', r'^casual eddie')]
def series(t):
    for k, rx in SERIES:
        if re.search(rx, t, re.I): return k
    return ''
raw = json.load(open(sys.argv[1])); slugs = [l.strip() for l in open(sys.argv[2]) if l.strip()]
today = sys.argv[3] if len(sys.argv) > 3 else datetime.date.today().isoformat()
assert len(raw) == len(slugs), (len(raw), len(slugs))
M = {m: i + 1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}
ty, tm_ = int(today[:4]), int(today[5:7])
ev = []
for r, s in zip(raw, slugs):
    mon, day = r[0].split(); m = M[mon]; y = ty if m >= tm_ else ty + 1
    assert s.endswith(r[6]), (s, r[6])
    row = {'d': '%04d-%02d-%02d' % (y, m, int(day)), 'tm': r[4].upper().replace('AM', ' AM').replace('PM', ' PM').replace('  ', ' ').strip(),
           'dr': r[5].upper().replace('PM', ' PM').replace('AM', ' AM').replace('  ', ' ').strip(),
           't': r[3], 'u': 'https://www.ticketweb.com/event/%s?pl=showdown&REFID=clientsitewp' % s,
           'pp': 'pickathon present' in r[2].lower(), 'by': r[2], 's': series(r[3]), 'v': 'Showdown Saloon',
           'img': 'https://i.ticketweb.com/i/' + r[7]}
    ev.append(row)
extra = os.path.join(os.path.dirname(__file__), 'other_venues.json')
if os.path.exists(extra): ev += json.load(open(extra))
ev.sort(key=lambda e: (e['d'], e.get('tm', '')))
d = json.load(open('data.json'))
d['showdown'] = {'updated': today, 'source': 'https://www.showdownpdx.com/', 'events': ev}
json.dump(d, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(ev), 'events;', sum(e['pp'] for e in ev), 'Pickathon Presents;', ev[0]['d'], '->', ev[-1]['d'])
