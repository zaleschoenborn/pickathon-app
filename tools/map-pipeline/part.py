import numpy as np,cv2
from scipy import ndimage as ndi
M=dict(np.load('/tmp/bk/masks.npz')); EX0=dict(np.load('/tmp/bk/excl.npz'))
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
base=cv2.imread(P+'map.jpg'); H,W=base.shape[:2]
lab=cv2.cvtColor(base,cv2.COLOR_BGR2LAB).astype(np.float32)
bgd=np.abs(base.astype(np.int16)-np.array([15,22,18],np.int16)).max(2)
CL=['galaxy','lucky','farmhouse','courtyard','orchard']
cnt=sum(m.astype(np.uint8) for m in M.values()); ov=cnt>1
U=np.zeros((H,W),bool)
for m in M.values(): U|=m
# region of interest
roi=np.zeros((H,W),bool)
for h in CL: roi|=cv2.dilate(M[h].astype(np.uint8),np.ones((61,61),np.uint8))>0
roi&=U
pal={}
for h in CL:
    own=M[h]&~ov&(bgd>14)&(lab[...,0]*100/255>35)
    # core: eroded
    core=cv2.erode(own.astype(np.uint8),np.ones((9,9),np.uint8))>0
    X=lab[core][::max(1,core.sum()//20000)]
    _,_,c=cv2.kmeans(X,6,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,20,0.5),3,cv2.KMEANS_PP_CENTERS)
    pal[h]=c
D=np.stack([np.min(np.linalg.norm(lab[...,None,:]-pal[h][None,None],axis=3),axis=2) for h in CL])  # 5,H,W
# candidates: within 25px of that hood's mask
cand=np.stack([cv2.dilate(M[h].astype(np.uint8),np.ones((51,51),np.uint8))>0 for h in CL])
S=np.where(cand,D,1e6)
best=np.argmin(S,0); bd=np.min(S,0)
neutral=(bd>20)|(bgd<=14)
nb=cv2.morphologyEx(neutral.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
lbl=best.astype(np.int32); lbl[nb>0]=-1
dtn=cv2.distanceTransform(nb,cv2.DIST_L2,3)
n,cc,st,_=cv2.connectedComponentsWithStats(nb,connectivity=8)
known=lbl>=0
idx=ndi.distance_transform_edt(~known,return_distances=False,return_indices=True)
filled=lbl[idx[0],idx[1]]
lab2=np.where(known,lbl,filled)
V0=np.stack([cv2.blur((lab2==i).astype(np.float32),(13,13)) for i in range(len(CL))])
lab3=np.argmax(V0,0)
ring_k=np.ones((9,9),np.uint8)
for i in range(1,n):
    x,y,w,h,a=st[i]
    if a<40 or a>40000: continue
    p=8; xa,ya=max(x-p,0),max(y-p,0); xb,yb=min(x+w+p,W),min(y+h+p,H)
    comp=(cc[ya:yb,xa:xb]==i)
    if dtn[ya:yb,xa:xb][comp].max()<6: continue   # thin line: keep nearest-fill
    ring=(cv2.dilate(comp.astype(np.uint8),np.ones((13,13),np.uint8))>0)&~(nb[ya:yb,xa:xb]>0)&roi[ya:yb,xa:xb]
    ls=lbl[ya:yb,xa:xb][ring]; ls=ls[ls>=0]
    if len(ls)<20: continue
    mj=np.bincount(ls,minlength=len(CL)).argmax()
    sub=lab3[ya:yb,xa:xb]; sub[comp]=mj
tick=np.zeros((H,W),np.uint8)
cv2.fillPoly(tick,[np.array([[1144,3319],[1177,3281],[1203,3299],[1171,3342]],np.int32)],1)
lab3[tick>0]=CL.index('farmhouse')

import sys,json,re
sys.argv=['x']
_src=open('/tmp/bk/bake.py').read().split("def enhance")[0]
_g={}
exec(_src,_g)
_ch=_g['chrome']; _w=_g['winding']
chm=np.zeros((H,W),bool)
for p in _ch:
    x0=int(np.floor(p[:,0].min()))-2;y0=int(np.floor(p[:,1].min()))-2;x1=int(np.ceil(p[:,0].max()))+2;y1=int(np.ceil(p[:,1].max()))+2
    x0=max(x0,0);y0=max(y0,0);x1=min(x1,W);y1=min(y1,H)
    if x1<=x0 or y1<=y0 or (x1-x0)*(y1-y0)>20000: continue
    chm[y0:y1,x0:x1]|=_w([p],x0,y0,x1-x0,y1-y0,1.0)
thick=np.zeros((H,W),bool)
for i in range(1,n):
    x,y,w,h,a_=st[i]
    if 40<=a_<=40000 and dtn[y:y+h,x:x+w][cc[y:y+h,x:x+w]==i].max()>=6: thick[y:y+h,x:x+w]|=(cc[y:y+h,x:x+w]==i)
chrome_all=cv2.dilate((chm|thick).astype(np.uint8),np.ones((5,5),np.uint8))>0
good=(~chrome_all)&(bgd>14)
k=(61,61)
den=cv2.blur(good.astype(np.float32),k)+1e-4
V2=np.stack([cv2.blur(((lab3==i)&good).astype(np.float32),k)/den for i in range(len(CL))])
lab3=np.where(chrome_all&(bgd>14),np.argmax(V2,0),lab3)
def forcec(cx,cy,r,hood):
    yy,xx=np.ogrid[:H,:W]; m=((xx-cx)**2+(yy-cy)**2<=r*r)&(bgd>14); lab3[m]=CL.index(hood)
def force(box,hood):
    xa,ya,xb,yb=box; sub=lab3[ya:yb,xa:xb]; m=(bgd[ya:yb,xa:xb]>14); sub[m]=CL.index(hood)
force((932,3158,978,3206),'lucky')
force((1092,3203,1138,3249),'courtyard')
forcec(965,3295,26,'courtyard')
Vs=np.stack([cv2.blur((lab3==i).astype(np.float32),(11,11)) for i in range(len(CL))]); lab3=np.argmax(Vs,0)
force((932,3158,978,3206),'lucky'); force((1092,3203,1138,3249),'courtyard'); forcec(965,3295,26,'courtyard')
lab3[tick>0]=CL.index('farmhouse')
# remove tiny islands
for it in range(2):
    for i in range(len(CL)):
        mk=(lab3==i).astype(np.uint8)
        n2,c2,s2,_=cv2.connectedComponentsWithStats(mk,connectivity=4)
        for j in range(1,n2):
            if s2[j,4]<500:
                x,y,w,h,ar=s2[j]; p=4; xa,ya=max(x-p,0),max(y-p,0); xb,yb=min(x+w+p,W),min(y+h+p,H)
                comp=(c2[ya:yb,xa:xb]==j); ring=cv2.dilate(comp.astype(np.uint8),np.ones((5,5),np.uint8))>0
                ls=lab3[ya:yb,xa:xb][ring&~comp]
                if len(ls): lab3[ya:yb,xa:xb][comp]=np.bincount(ls,minlength=len(CL)).argmax()
np.savez('/tmp/bk/pal.npz',**{h:pal[h] for h in CL})
F={}
for i,h in enumerate(CL):
    F[h]=(lab3==i)&roi&U
np.savez_compressed('/tmp/bk/final_masks.npz',**F)
def viz(name,box):
    xa,ya,xb,yb=box; im=base[ya:yb,xa:xb].copy(); 
    cols={'farmhouse':(0,255,255),'courtyard':(0,128,255),'orchard':(255,255,0),'galaxy':(255,0,255),'lucky':(0,255,0)}
    for h,col in cols.items():
        m=F[h][ya:yb,xa:xb].astype(np.uint8)
        cs,_=cv2.findContours(m,cv2.RETR_LIST,cv2.CHAIN_APPROX_NONE); cv2.drawContours(im,cs,-1,col,1)
    cv2.imwrite('/tmp/bk/'+name,cv2.resize(im,None,fx=2.5,fy=2.5,interpolation=cv2.INTER_NEAREST))
viz('vz2.png',(880,3100,1240,3420))
