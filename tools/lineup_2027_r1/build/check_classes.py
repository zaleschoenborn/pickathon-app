import csv,re,sys,asyncio
from playwright.sync_api import sync_playwright
R={}
for r in csv.DictReader(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'class_table_nov24_v188.csv'),encoding='utf-8-sig')):
    if r['lineup'].strip()=='Music' and not r['duplicate_of'] and not r['merged_into']:
        R[(re.sub(r'[^a-z0-9]','',r['act'].lower().replace('&','and').removeprefix('the ')),r['year'])]=r
def lab(c,leg): return 'Legend' if leg=='yes' else {'Discovery':'Discovery','Deep cut':'Deep cut'}.get(c,'')
bad=0;tot=0
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','index.html')))
    data=pg.evaluate('''()=>[...document.querySelectorAll('.poster')].map(s=>({y:s.dataset.yr,
      then:[...s.querySelectorAll('.po-names.then .pl span:not(.dot)')].map(x=>[x.textContent,x.dataset.c||'']),
      now:[...s.querySelectorAll('.po-names.now .pn')].map(x=>[x.textContent,x.dataset.c||''])}))''')
    for d in data:
        for view,key,fl in (('then','class_booking','legend_flag_booking'),('now','class','legend_flag_today')):
            for n,t in d[view]:
                k=(re.sub(r'[^a-z0-9]','',n.lower().replace('&','AND'.lower()).replace('“','').replace('”','').removeprefix('the ')),d['y'])
                r=R.get(k)
                if not r: continue
                tot+=1; want=lab(r[key],r[fl]).upper()
                if t.upper()!=want: bad+=1; print('MISMATCH',d['y'],view,n,'shows',t,'want',want) if bad<15 else None
    ts=[(d['y'],v,x) for d in data if d['y']=='2022' for v in('then','now') for x in d[v] if 'SACRED' in x[0]]
    print(ts); print('checked',tot,'bad',bad)
