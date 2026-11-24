import numpy as np, json, re
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS=None
H,W=9144,4898; F=2.4
hx=lambda c:np.array([int(c[i:i+2],16) for i in (1,3,5)],np.float32)
P=json.load(open('/home/claude/work/map27/p27.json'))
FOREST=hx('#81826A')
M={6:'paddock',7:'windmill',8:'grove',9:'refuge',10:'market',11:'cherryhill',12:'coyote',13:'lucky',14:'courtyard',15:'orchard',16:'southcamp',17:'quailtrail',18:'wildcamp',19:'woods',20:'galaxy',21:'farmhouse',22:'lushcamp'}
out=np.zeros((H,W,3),np.float32)+np.array([15,23,18],np.float32)
own=np.full((H,W),'',dtype=object) if False else None
lab=np.zeros((H,W),np.int8)
for k in range(6,23):
    a=np.load(f'a{k}.npy').astype(np.float32); med=np.median(a[a>8]); cov=np.clip(a/med,0,1)[...,None]
    h=M[k]; col=hx(P[h]) if h in P else FOREST
    out=out*(1-cov)+col*cov; lab[cov[...,0]>0.5]=k
for k in (39,43):
    a=np.load(f'pa{k}.npy').astype(np.float32); med=np.median(a[a>8]); cov=np.clip(a/med,0,1)[...,None]
    out=out*(1-cov)+np.array([224,236,214],np.float32)*cov; lab[cov[...,0]>0.5]=40
S=json.load(open('/home/claude/work/map27/shapes.json'))['shapes']
for i,h in enumerate(['curation','welcomelot','willowcamp']):
    SS=4; ys=[];xs=[]
    polys=[]
    for sub in re.split(r'[Mm]',S[h]):
        n=[float(x) for x in re.findall(r'-?\d+\.?\d*',sub)]
        if len(n)>=6: polys.append([(n[j]*F,n[j+1]*F) for j in range(0,len(n)-1,2)])
    pts=np.array([p for pl in polys for p in pl]); x0,y0=np.floor(pts.min(0)).astype(int)-4; x1,y1=np.ceil(pts.max(0)).astype(int)+4
    im=Image.new('L',((x1-x0)*SS,(y1-y0)*SS),0); D=ImageDraw.Draw(im)
    for pl in polys: D.polygon([((x-x0)*SS,(y-y0)*SS) for x,y in pl],fill=255)
    cov=np.asarray(im.resize((x1-x0,y1-y0),Image.LANCZOS)).astype(np.float32)[...,None]/255
    col=hx(P[h]); sl=(slice(y0,y1),slice(x0,x1))
    out[sl]=out[sl]*(1-cov)+col*cov; lab[sl][cov[...,0]>0.5]=30+i
np.save('L1.npy',out.astype(np.uint8)); np.save('lab.npy',lab)
Image.fromarray(out.astype(np.uint8)).resize((W//6,H//6),Image.LANCZOS).save('L1_small.png')
# --- fix pass: hairline gaps between neighbors, stray pieces
from scipy import ndimage
cols={}
for k in range(6,23): cols[k]=hx(P[M[k]]) if M[k] in P else FOREST
for i,h in enumerate(['curation','welcomelot','willowcamp']): cols[30+i]=hx(P[h])
cols[40]=np.array([224,236,214],np.float32)
land=lab>0
# stray pieces: components smaller than 5% of that label's largest piece -> relabel by surrounding majority
for k in list(cols):
    m=lab==k; l,n=ndimage.label(m)
    if n<2: continue
    sz=ndimage.sum(m,l,range(1,n+1)); big=sz.max()
    for j,s in enumerate(sz):
        if s<0.05*big:
            comp=l==j+1; ring=ndimage.binary_dilation(comp,iterations=3)&~comp
            vals=lab[ring]; vals=vals[vals>0]
            if len(vals):
                nk=np.bincount(vals).argmax(); lab[comp]=nk; out[comp]=cols[nk]; print('stray',M.get(k,k),int(s),'->',M.get(nk,nk))
closed=ndimage.binary_closing(land,structure=np.ones((3,3)),iterations=4)
gap=closed&~land
idx=ndimage.distance_transform_edt(~land,return_distances=False,return_indices=True)
nl=lab[idx[0],idx[1]]
for k,c in cols.items():
    g=gap&(nl==k); out[g]=c
lab[gap]=nl[gap]
print('gap px',int(gap.sum()))
np.save('L1.npy',out.astype(np.uint8)); np.save('lab.npy',lab)
Image.fromarray(out.astype(np.uint8)).resize((W//6,H//6),Image.LANCZOS).save('L1_small.png')
bgm=lab==0; lb_,nb_=ndimage.label(bgm); szb=ndimage.sum(bgm,lb_,range(1,nb_+1))
hole=np.isin(lb_,np.nonzero(szb<40000)[0]+1)
idx=ndimage.distance_transform_edt(lab==0,return_distances=False,return_indices=True); nl=lab[idx[0],idx[1]]
lab[hole]=nl[hole]; print('enclosed gaps filled',int(hole.sum()))
inner=ndimage.binary_erosion(lab>0,iterations=2)
for k,c in cols.items():
    out[(inner|hole)&(lab==k)]=c
np.save('L1.npy',out.astype(np.uint8)); np.save('lab.npy',lab)
Image.fromarray(out.astype(np.uint8)).resize((W//6,H//6),Image.LANCZOS).save('L1_small.png')
O=out.astype(np.uint8)
cs=[(2820,1860),(3330,5600),(2530,7700),(3700,6300),(2400,7480)]
ims=[Image.fromarray(O[y-100:y+100,x-100:x+100]).resize((300,300),Image.NEAREST) for x,y in cs]
Wd=Image.new('RGB',(310*len(ims),300),'white')
for i,im in enumerate(ims): Wd.paste(im,(i*310,0))
Wd.save('seams.png')
