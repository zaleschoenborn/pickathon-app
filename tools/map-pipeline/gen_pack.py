#!/usr/bin/env python3
"""Write farmmap/pack.json: the list of map files the service worker saves for offline use.
Run after every map rebuild (it reads the ?v= number from farmmap/index.html)."""
import json,os,re,sys
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
fm=os.path.join(root,'farmmap')
v=re.search(r'map\.webp\?v=(\d+)',open(os.path.join(fm,'lab-phone.html')).read()).group(1)
lf=sorted(f for f in os.listdir(os.path.join(fm,'l')) if f.endswith('.webp') and not f.endswith('_a.webp'))   # *_a.webp = legacy sheets (only the old farmmap/index.html uses them)
small=[f for f in lf if not re.search(r'_\d+_\d+\.webp$',f)]
cells=[f for f in lf if re.search(r'_\d+_\d+\.webp$',f)]
# core (installed with the page): base map, icon atlas, small highlight overlays
core=['farmmap/map.webp?v='+v,'farmmap/ic/atlas.webp?v='+v]+['farmmap/ic/%s?v=%s'%(f,v) for f in sorted(os.listdir(os.path.join(fm,'ic'))) if f.endswith('.webp') and f!='atlas.webp']+['farmmap/l/%s?v=%s'%(f,v) for f in small]
# extra (SW fetches ~25s after load, only while visible): sharp tiles + hi-res highlight pieces + small icons.
# h/ hero photos and i/ artist photos are NOT prefetched: the service worker caches them when viewed.
extra=['farmmap/t/%s?v=%s'%(f,v) for f in sorted(os.listdir(os.path.join(fm,'t'))) if f.endswith('.webp')]
extra+=['farmmap/l/%s?v=%s'%(f,v) for f in cells]
extra+=['ic2/'+f for f in sorted(os.listdir(os.path.join(root,'ic2')))]
json.dump({'v':v,'core':core,'extra':extra},open(os.path.join(fm,'pack.json'),'w'),separators=(',',':'))
print('pack v',v,len(core),'core',len(extra),'extra')
