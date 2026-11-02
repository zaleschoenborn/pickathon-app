import json,re,sys,cv2,numpy as np
sys.argv=['x']
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
exec(open('bake.py').read().split("chrome=subpaths")[0])
MW,MH=D['size']
M={}
for hid,sh in D['shapes'].items():
    polys=subpaths(sh['d']); polys,_=fill_small_holes(polys)
    allp=np.vstack(polys); x0,y0=np.floor(allp.min(0)).astype(int)-2; x1,y1=np.ceil(allp.max(0)).astype(int)+2
    m=winding(polys,x0,y0,x1-x0,y1-y0,1.0)
    full=np.zeros((MH,MW),bool); xa,ya=max(x0,0),max(y0,0); xb,yb=min(x1,MW),min(y1,MH)
    full[ya:yb,xa:xb]=m[ya-y0:yb-y0,xa-x0:xb-x0]; M[hid]=full
ids=list(M)
print(ids)
for i,a in enumerate(ids):
    for b in ids[i+1:]:
        o=(M[a]&M[b]).sum()
        if o>30: 
            ys,xs=np.where(M[a]&M[b]); print(a,b,o,(xs.min(),ys.min(),xs.max(),ys.max()))
np.savez_compressed('/tmp/bk/masks.npz',**M)
