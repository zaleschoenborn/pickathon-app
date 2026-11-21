"""Checks for the Lineup 2027 standalone build. Run after build.py:  python3 tools/lineup_2027_r1/build/check.py
Needs Playwright (pre-installed in Claude sessions). Exits 1 on any failure."""
import asyncio, os, re, sys, json
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.abspath(HERE + '/..') + '/'
FAILS = []
def ok(c, msg):
    print(('ok   ' if c else 'FAIL ') + msg)
    if not c: FAILS.append(msg)
html = open(SITE + 'index.html', encoding='utf-8').read()
refs = set(re.findall(r'img/[0-9a-f]{12}\.(?:jpg|png)', html))
ok(all(os.path.exists(SITE + r) for r in refs), 'every img/ reference exists (%d files)' % len(refs))
ok(not re.search(r'style="[^"]*url\("', html), 'no broken inline url("...") quoting')
ids = re.findall(r'<main id="([^"]+)" class="screen"', html)
ok(len([i for i in ids if i.startswith('a-')]) >= 770, 'artist pages present (%d)' % len([i for i in ids if i.startswith('a-')]))
ok(all(('y%d' % y) in ids for y in list(range(1999, 2020)) + list(range(2022, 2027))), 'year pages 1999-2019 and 2022-2026 present')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in [(390, 844), (1280, 900)]:
            pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('file://' + SITE + 'index.html'); await pg.wait_for_timeout(500)
            ok(not errs, '%dpx page loads with no script errors' % w)
            # every screen shows without overflowing sideways
            bad = await pg.evaluate("""()=>{const out=[];document.querySelectorAll('main.screen').forEach(m=>{document.querySelectorAll('.screen').forEach(x=>x.hidden=x!==m);
              if(document.documentElement.scrollWidth>innerWidth+1) out.push(m.id)});return out}""")
            ok(not bad, '%dpx no sideways overflow on any screen%s' % (w, (' (' + ', '.join(bad[:5]) + ')') if bad else ''))
            broken = await pg.evaluate("""()=>{const o=[];document.querySelectorAll('main.screen').forEach(m=>{document.querySelectorAll('.screen').forEach(x=>x.hidden=x!==m);
              m.querySelectorAll('img').forEach(i=>{if(i.complete&&i.naturalWidth===0) o.push(m.id)})});return [...new Set(o)]}""")
            ok(not broken, '%dpx no broken images%s' % (w, (' (' + ', '.join(broken[:5]) + ')') if broken else ''))
            # seams: every joined poster has a horizon
            miss = await pg.evaluate("()=>[...document.querySelectorAll('.poster.joined')].filter(p=>!p.querySelector('.seam,.cloud')).map(p=>p.dataset.yr)")
            ok(not miss, '%dpx every year poster under a photo hero has its own horizon' % w)
            # 2026 reel: ten tappable frames, each with a clip that opens the player with the right video id and hash
            await pg.evaluate("()=>document.querySelectorAll('.screen').forEach(m=>m.hidden=m.id!=='y2026')")
            S = json.loads(await pg.evaluate("()=>document.querySelector('#y2026 .hero').dataset.slides"))
            ok(len(S) == 10 and all(f['clip'] for f in S), '%dpx 2026 reel has 10 frames, all with clips' % w)
            for k, f in enumerate(S):
                await pg.evaluate("(k)=>document.querySelector('#y2026 [data-slide=\"'+k+'\"]').click()", k)
                name = await pg.evaluate("()=>document.querySelector('#y2026 .hero h1').textContent")
                await pg.evaluate("()=>document.querySelector('#y2026 .hero .ring').click()")
                src = await pg.evaluate("()=>document.querySelector('.pkvid iframe')&&document.querySelector('.pkvid iframe').src")
                vid, hh = re.search(r'vimeo\.com/(?:video/)?(\d+)/?([0-9a-f]*)', f['clip']).groups()
                ok(name == f['n'] and src and ('/video/' + vid) in src and ('h=' + hh) in src, '%dpx frame %d %s plays %s/%s' % (w, k + 1, f['n'], vid, hh))
                await pg.evaluate("()=>{const o=document.querySelector('.pkvid');o&&o.remove()}")
            # artist pages that carry 2026 clips
            ar = await pg.evaluate("()=>[...document.querySelectorAll('main.screen')].filter(m=>m.querySelector('.vid[data-clip]')).map(m=>m.id)")
            ok(len(ar) >= 9, '%dpx artist pages with 2026 clip cards: %s' % (w, ', '.join(ar)))
            await pg.close()
        await b.close()
asyncio.run(main())
# every name, tile, card and row opens an artist page (Nov 20): each data-art slug must have its page
_h = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html'), encoding='utf-8').read()
_arts = set(re.findall(r'data-art="([a-z0-9]*)"', _h)); _ids = set(re.findall(r'id="a-([a-z0-9]+)"', _h))
_miss = sorted(x for x in _arts if x not in _ids and re.sub(r'^the', '', x) not in _ids)
ok(len(_arts) > 500 and not _miss, 'every named link opens an artist page: %d links, %d without a page %s' % (len(_arts), len(_miss), _miss[:5]))
print('\n%d failure(s)' % len(FAILS)); sys.exit(1 if FAILS else 0)
