#!/usr/bin/env python3
"""Write farmmap/pack.json: the list of map files the service worker saves for offline use.
Run after every map rebuild (it reads the ?v= number from farmmap/index.html)."""
import json,os,re,sys
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
fm=os.path.join(root,'farmmap')
v=re.search(r'map\.webp\?v=(\d+)',open(os.path.join(fm,'index.html')).read()).group(1)
core=['farmmap/map.webp?v='+v,'farmmap/ic/atlas.webp?v='+v]
core+=['farmmap/t/%s?v=%s'%(f,v) for f in sorted(os.listdir(os.path.join(fm,'t'))) if f.endswith('.webp')]
core+=['farmmap/l/%s?v=%s'%(f,v) for f in sorted(os.listdir(os.path.join(fm,'l'))) if f.endswith('.webp')]
extra=['farmmap/h/'+f for f in sorted(os.listdir(os.path.join(fm,'h'))) if f.endswith('.webp')]
# Tier 1: what a visitor needs on site: current-year artist photos, neighborhood images, small icons
d=json.load(open(os.path.join(root,'data.json')))
yr=set(x['a'] for x in d['sets'])
t1=set()
for a in yr:
    i=(d['artists'].get(a) or {}).get('i')
    if i: t1.add(i)
for h in (d['hoods'].values() if isinstance(d['hoods'],dict) else d['hoods']):
    for k in ('i','i0','iy','ib','icw'):
        x=h.get(k)
        if isinstance(x,str) and re.search(r'\.(jpg|png|webp)$',x): t1.add(x)
t1|={'ic2/'+f for f in os.listdir(os.path.join(root,'ic2'))}
t1=sorted(u for u in t1 if os.path.exists(os.path.join(root,u)))
extra+=t1
json.dump({'v':v,'core':core,'extra':extra},open(os.path.join(fm,'pack.json'),'w'),separators=(',',':'))
print('pack v',v,len(core),'core',len(extra),'extra')
