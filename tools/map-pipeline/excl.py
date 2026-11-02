import numpy as np,cv2
M=dict(np.load('/tmp/bk/masks.npz'))
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
base=cv2.imread(P+'map.jpg'); lab=cv2.cvtColor(base,cv2.COLOR_BGR2LAB).astype(np.float32)
cnt=sum(m.astype(np.uint8) for m in M.values())
ov=cnt>1
print('overlap px',ov.sum())
bgd=np.abs(base.astype(np.int16)-np.array([15,22,18],np.int16)).max(2)
pal={}; DT={}
for h,m in M.items():
    own=m&~ov&(bgd>14)&(lab[...,0]*100/255>35)
    if own.sum()<200: pal[h]=None; continue
    X=lab[own][::max(1,own.sum()//20000)]
    _,_,c=cv2.kmeans(X,6,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,20,0.5),3,cv2.KMEANS_PP_CENTERS)
    pal[h]=c
    DT[h]=cv2.distanceTransform((~(m&~ov)).astype(np.uint8),cv2.DIST_L2,3)
EX={}
ys,xs=np.where(ov)
x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
cand={h:(M[h]&ov) for h in M}
score={}
for h in M:
    if pal[h] is None or not cand[h].any(): continue
    d=np.full(lab.shape[:2],1e6,np.float32)
    for c in pal[h]:
        d=np.minimum(d,np.linalg.norm(lab-c,axis=2))
    s=d+0.25*DT[h]
    s[~cand[h]]=1e9
    score[h]=s
hs=list(score); S=np.stack([score[h] for h in hs])
win=np.argmin(S,0)
res={h:np.zeros(ov.shape,bool) for h in hs}
# smooth: majority over 15px window within overlap
oh=np.zeros(ov.shape,np.float32)
votes=[]
for i,h in enumerate(hs):
    v=((win==i)&ov).astype(np.float32); votes.append(cv2.blur(v,(15,15)))
V=np.stack(votes); w2=np.argmax(V,0)
for i,h in enumerate(hs): res[h]=(w2==i)&ov
for h in M:
    # exclusion: overlap pixels that this hood lost
    lost=M[h]&ov&~res.get(h,np.zeros(ov.shape,bool))
    EX[h]=lost
    print(h,'lost',lost.sum())
np.savez_compressed('/tmp/bk/excl.npz',**EX)
# visual check farmhouse/courtyard/galaxy/lucky
def viz(name,box):
    xa,ya,xb,yb=box; im=base[ya:yb,xa:xb].copy()
    for h,col in (('farmhouse',(0,255,255)),('courtyard',(0,128,255)),('orchard',(255,255,0)),('galaxy',(255,0,255)),('lucky',(0,255,0))):
        m=(M[h]&~EX[h])[ya:yb,xa:xb].astype(np.uint8)
        cs,_=cv2.findContours(m,cv2.RETR_LIST,cv2.CHAIN_APPROX_NONE); cv2.drawContours(im,cs,-1,col,1)
    cv2.imwrite('/tmp/bk/'+name,cv2.resize(im,None,fx=2.5,fy=2.5,interpolation=cv2.INTER_NEAREST))
viz('vz1.png',(880,3100,1240,3420))
