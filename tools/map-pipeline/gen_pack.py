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
json.dump({'v':v,'core':core,'extra':extra},open(os.path.join(fm,'pack.json'),'w'),separators=(',',':'))
print('pack v',v,len(core),'core',len(extra),'extra')
