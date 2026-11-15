#!/usr/bin/env python3
"""Apply Presents round 1 (Nov 15 2026) to index.html: picks, compact weekly list, dark cards, shared buttons.
Run from the repo root. Safe to check: fails loudly if an anchor moved."""
p='index.html'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
rep('<button type="button" onClick="{{pp.toCal}}" class="pp-btn pp-btn-gold">See upcoming shows</button>',
    '<button type="button" onClick="{{pp.toCal}}" class="pk-cta pri pp-cta">See upcoming shows</button>')
rep('<sc-if value="{{pp.has}}" hint-placeholder-val="{{true}}"><ol class="pp-list">',
 '<sc-if value="{{pp.hasPicks}}" hint-placeholder-val="{{true}}"><div class="pp-picks" role="list" aria-label="Our picks"><sc-for list="{{pp.picks}}" as="c" hint-placeholder-count="4"><article class="pp-card" role="listitem">'
 '<div class="pp-card-img"><img src="{{c.img}}" alt="Show poster for {{c.t}}" loading="lazy" decoding="async"></div>'
 '<div class="pp-card-b"><p class="pp-card-k">Pickathon Presents</p><h3 class="pp-card-n">{{c.t}}</h3><p class="pp-card-m">{{c.when}}</p>'
 '<a class="pk-cta pri pp-cta" href="{{c.u}}" target="_blank" rel="noopener" aria-label="Tickets for {{c.t}} (opens TicketWeb)">Tickets</a></div></article></sc-for></div></sc-if>'
 '<sc-if value="{{pp.has}}" hint-placeholder-val="{{true}}"><h3 class="pp-sub">Every show</h3><ol class="pp-list">')
rep('</li></sc-for></ol></sc-if>',
    '</li></sc-for></ol><sc-if value="{{pp.more}}" hint-placeholder-val="{{true}}"><div class="pp-ctas"><button type="button" onClick="{{pp.showMore}}" class="pk-cta sec pp-cta">Show more shows</button></div></sc-if></sc-if>')
a=s.index('<div class="pp-week">'); b=s.index('<p class="pp-band-note">')
s=s[:a]+('<ul class="pp-wk"><sc-for list="{{pp.weekly}}" as="w" hint-placeholder-count="4"><li class="pp-wk-r">'
 '<span class="pp-wk-d">{{w.day}}</span><span class="pp-wk-b"><span class="pp-wk-n">{{w.name}}</span><span class="pp-wk-t">{{w.line}}</span></span>'
 '<sc-if value="{{w.u}}" hint-placeholder-val="{{true}}"><a class="pp-wk-x" href="{{w.u}}" target="_blank" rel="noopener" aria-label="Tickets for {{w.name}}, {{w.next}} (opens TicketWeb)">{{w.next}} ↗</a></sc-if>'
 '</li></sc-for></ul>\n')+s[b:]
rep('<div class="pp-ctas"><a href="https://www.showdownpdx.com/" target="_blank" rel="noopener" class="pp-btn pp-btn-gold">Learn more and grab tickets ↗</a></div>',
    '<div class="pp-ctas"><a href="https://www.showdownpdx.com/" target="_blank" rel="noopener" class="pk-cta sec pp-cta">Showdown calendar ↗</a></div>')
old='''.map(function (e) { var dt = new Date(e.d + 'T12:00:00'); return { t: e.t, u: e.u, v: e.v || 'Showdown Saloon', pp: !!e.pp, mon: MON[dt.getMonth()], day: String(dt.getDate()), dow: DOW[dt.getDay()], when: DOW[dt.getDay()] + ' ' + MON[dt.getMonth()] + ' ' + dt.getDate() + ' · ' + (e.tm || '') }; });'''
new='''.map(function (e) { var dt = new Date(e.d + 'T12:00:00'); return { t: e.t, u: e.u, img: e.img || '', v: e.v || 'Showdown Saloon', pp: !!e.pp, mon: MON[dt.getMonth()], day: String(dt.getDate()), dow: DOW[dt.getDay()], when: DOW[dt.getDay()] + ' ' + MON[dt.getMonth()] + ' ' + dt.getDate() + ' · ' + (e.tm || '') + ((e.v && e.v !== 'Showdown Saloon') ? ' · ' + e.v : '') }; });
      var ppN = st.ppN || 8, ppAll = ppEv; ppEv = ppAll.slice(0, ppN);
      var ppFut = (SDN.events || []).filter(function (e) { return e.d >= ppT; }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
      var ppPick = ppFut.filter(function (e) { return e.feat === true || (e.pp && !e.s && e.feat !== false); }).slice(0, 4).map(function (e) { var dt = new Date(e.d + 'T12:00:00'); return { t: e.t, u: e.u, img: e.img || 'i/p9518.jpg', when: DOW[dt.getDay()] + ' ' + MON[dt.getMonth()] + ' ' + dt.getDate() + ' · ' + (e.tm || '') + ' · ' + (e.v || 'Showdown Saloon') }; });
      var ppWk = [['Mondays', 'sq', 'Square Dancing', 'Old-time square dancing to a live string band, with a caller who teaches every dance.'], ['Tuesdays', 'ts', 'Two-Step Tuesday', 'A beginner-friendly two-step lesson, then a live band takes the stage and the dance floor opens up.'], ['Wednesdays', 'ww', 'Whiskey Wednesday', 'Country, western swing, Americana and honky-tonk, plus an intermediate dance lesson.'], ['Sundays', 'ce', 'Casual Eddie’s Residency', 'Casual Eddie holds down the Showdown every week with special guests.']].map(function (w) { var nx = ppFut.filter(function (e) { return e.s === w[1]; })[0], dt = nx ? new Date(nx.d + 'T12:00:00') : null; return { day: w[0], name: w[2], line: w[3], u: nx ? nx.u : '', next: dt ? 'Next ' + MON[dt.getMonth()] + ' ' + dt.getDate() : '' }; });'''
rep(old,new)
rep("events: ppEv, has: ppEv.length > 0, none: ppEv.length === 0,",
    "events: ppEv, has: ppEv.length > 0, none: ppEv.length === 0, picks: ppPick, hasPicks: ppPick.length > 0, weekly: ppWk, more: ppAll.length > ppEv.length, showMore: function () { self.setState({ ppN: ppN + 8 }); },")
rep("self.setState({ ppOnly: c[0] === 'pp' });","self.setState({ ppOnly: c[0] === 'pp', ppN: 8 });")
a='<style id="pk-ah-stg-fix">'
rep(a,'<style id="pp-r1">'+open('tools/presents/pp_r1.css').read()+'</style>'+a)
open(p,'w').write(s); print('applied')
