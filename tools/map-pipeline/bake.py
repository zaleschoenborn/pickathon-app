import json,re,sys,os,cv2,numpy as np
from PIL import Image
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
s=open(P+'index.pre-smooth.html').read(); i=s.index('const D=')+8; D,_=json.JSONDecoder().raw_decode(s[i:])
MW,MH=D['size']; TS=2.4; TP=1024; TM=TP/TS
OUT=P+'l/'; os.makedirs(OUT,exist_ok=True)
def subpaths(d):
    return [np.array([[float(a) for a in q.split(',')] for q in re.findall(r'-?[\d.]+,-?[\d.]+',part)]) for part in d.split('Z') if len(re.findall(r'-?[\d.]+,-?[\d.]+',part))>2]
def winding(polys,x0,y0,w,h,sc):
    acc=np.zeros((h,w),np.int16)
    for pl in polys:
        pts=((pl-[x0,y0])*sc)
        a=0.5*np.sum(pts[:,0]*np.roll(pts[:,1],-1)-np.roll(pts[:,0],-1)*pts[:,1])
        m=np.zeros((h,w),np.uint8); cv2.fillPoly(m,[np.round(pts*16).astype(np.int32)],1,lineType=cv2.LINE_8,shift=4)
        acc+= m.astype(np.int16)*(1 if a>=0 else -1)
    return (acc!=0)

def fill_small_holes(polys,thr=12000):
    """Icons and badges were traced around, leaving unlit islands inside a neighborhood. Fill those
    (anything smaller than thr map px^2); real cutouts such as the Farmhouse rectangle stay."""
    allp=np.vstack(polys); x0,y0=np.floor(allp.min(0)).astype(int)-3; x1,y1=np.ceil(allp.max(0)).astype(int)+3
    w,h=int(x1-x0),int(y1-y0)
    m=winding(polys,x0,y0,w,h,1.0).astype(np.uint8)
    n,lab,st,_=cv2.connectedComponentsWithStats(1-m,connectivity=4)
    extra=[]
    for i in range(1,n):
        x,y,ww,hh,ar=st[i]
        if x==0 or y==0 or x+ww>=w or y+hh>=h or ar>=thr: continue
        cs,_=cv2.findContours((lab==i).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        for c in cs:
            if len(c)>=3: extra.append(c[:,0,:].astype(float)+[x0,y0]+0.5)
    return polys+extra,len(extra)
chrome=subpaths(D['chrome'])
ex=[]
for m in re.finditer(r'M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)z',re.search(r"EXTRA_CHROME='([^']*)'",s).group(1)):
    x,y,w,h=map(float,m.groups()[:4]); ex.append(np.array([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]))
chrome+=ex
# Patches left over from the old base (icon plates that are no longer in the art) must not
# stop the highlight: keep a patch only if the new base really has something different inside it.
_lab=cv2.cvtColor(cv2.imread(P+'map.jpg'),cv2.COLOR_BGR2LAB).astype(np.float32); _H,_W=_lab.shape[:2]
def _plate_frac(p):
    x0,y0=np.floor(p.min(0)).astype(int)-14; x1,y1=np.ceil(p.max(0)).astype(int)+14
    x0=max(x0,0);y0=max(y0,0);x1=min(x1,_W);y1=min(y1,_H)
    if x1-x0<4 or y1-y0<4: return None
    m=np.zeros((y1-y0,x1-x0),np.uint8); cv2.fillPoly(m,[np.round(p-[x0,y0]).astype(np.int32)],1)
    ring=(cv2.dilate(m,np.ones((15,15),np.uint8))-cv2.dilate(m,np.ones((3,3),np.uint8)))>0
    sub=_lab[y0:y1,x0:x1]; ok=(sub[...,0]*100/255)>38
    ins=sub[(m>0)&ok]; rg=sub[ring&ok]
    if len(ins)<40 or len(rg)<60: return None
    _,_,c=cv2.kmeans(rg.astype(np.float32),3,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,20,0.5),3,cv2.KMEANS_PP_CENTERS)
    return float((np.min(np.linalg.norm(ins[:,None,:]-c[None],axis=2),axis=1)>28).mean())
_kept=[]; _drop=0
for _p in chrome:
    f=_plate_frac(_p)
    if f is not None and f<0.05: _drop+=1; continue
    _b=(_p.min(0).round(),_p.max(0).round())
    if abs(_b[0][0]-1113)<3 and abs(_b[0][1]-3497)<3 and abs(_b[1][0]-1197)<3: _drop+=1; continue   # stale patch in Farmhouse's yellow corner
    _kept.append(_p)
print('chrome patches kept',len(_kept),'dropped',_drop); chrome=_kept
for x,y,w,h in json.load(open('/tmp/vp/cyan_tiles.json')):
    p=3; chrome.append(np.array([[x-p,y-p],[x+w+p,y-p],[x+w+p,y+h+p],[x-p,y+h+p]]))
def enhance(rgb,f):
    sat,br,ct=f; sat=min(sat*(1.0 if sat<2.5 else 0.8),4.2)
    a=rgb.astype(np.float32)/255
    g=(a*[0.114,0.587,0.299]).sum(2,keepdims=True)  # BGR luminance
    a=g+(a-g)*sat
    a=np.clip(a,0,1); sl=br*ct; ic=0.5*(1-ct)
    a=np.clip(a*sl+ic,0,1)
    return (a*255+.5).astype(np.uint8)
_FM=dict(np.load('/tmp/bk/final_masks.npz')); _EX={k:v for k,v in dict(np.load('/tmp/bk/excl.npz')).items() if k not in _FM and v.any()}
def _mkcx():
    import cv2 as c
    zz=np.zeros((MH,MW),np.uint8)
    for x0,y0,x1,y1 in [(976,3132,1020,3178),(930,3156,980,3208),(1090,3201,1140,3251)]:
        c.rectangle(zz,(x0,y0),(x1,y1),1,-1)
    return zz>0
def _mkfull():
    import cv2 as c
    zz=np.zeros((MH,MW),np.uint8)
    c.circle(zz,(965,3295),27,1,-1)
    c.fillPoly(zz,[np.array([[1144,3319],[1177,3281],[1203,3299],[1171,3342]],np.int32)],1)
    return zz>0
_CX=_mkcx(); _CF=_mkfull(); _PAL=dict(np.load('/tmp/bk/pal.npz'))
def rast(m,x0,y0,w,h,sc):
    ix,iy=int(np.floor(x0)),int(np.floor(y0)); cw,ch=int(np.ceil(w/sc))+3,int(np.ceil(h/sc))+3
    crop=np.zeros((ch,cw),np.float32); sub=m[iy:iy+ch,ix:ix+cw].astype(np.float32); crop[:sub.shape[0],:sub.shape[1]]=sub
    crop=cv2.GaussianBlur(crop,(0,0),0.9)
    A=np.float32([[sc,0,(ix-x0)*sc],[0,sc,(iy-y0)*sc]])
    return np.clip(cv2.warpAffine(crop,A,(w,h),flags=cv2.INTER_CUBIC),0,1)
def make(src,x0,y0,w,h,sc,polys,f,hid=None):
    """src: BGR image region of size (h,w) at scale sc whose top-left is map (x0,y0)"""
    if hid in _FM: hood=rast(_FM[hid],x0,y0,w,h,sc)
    else:
        hood=winding(polys,x0,y0,w,h,sc).astype(np.float32)
        if hid in _EX: hood=hood*(1-rast(_EX[hid],x0,y0,w,h,sc))
    al=cv2.GaussianBlur(hood,(0,0),1.1*sc); al=np.clip((al-0.5)*1.6+0.5,0,1)
    _d=np.abs(src.astype(np.int16)-np.array([15,22,18],np.int16)).max(2).astype(np.float32)
    al=al*np.clip((_d-10)/26,0,1)
    if al.max()<0.02: return None
    ch=winding(chrome,x0,y0,w,h,sc)
    if hid in _PAL:
        _l=cv2.cvtColor(src,cv2.COLOR_BGR2LAB).astype(np.float32)
        _d=np.min(np.stack([np.linalg.norm(_l-c,axis=2) for c in _PAL[hid]]),0)
        _all=(ch|(rast(_CX,x0,y0,w,h,sc)>0.5))
        _core=(_all&(_d>24)).astype(np.uint8); _k=max(3,int(round(9*sc))|1)
        _core=cv2.dilate(cv2.morphologyEx(_core,cv2.MORPH_CLOSE,np.ones((_k*2+1,_k*2+1),np.uint8)),np.ones((_k,_k),np.uint8))
        ch=_all&(_core>0)
        ch|=rast(_CF,x0,y0,w,h,sc)>0.5
    enh=enhance(src,f); enh[ch]=src[ch]
    bgp=(np.abs(src.astype(np.int16)-np.array([15,22,18],np.int16)).max(2)<=4); enh[bgp]=src[bgp]
    rgba=np.dstack([enh,(al*255+.5).astype(np.uint8)])
    return rgba
base=cv2.imread(P+'map.jpg'); z2=cv2.imread('/tmp/tl/z2c.png'); print(base.shape,z2.shape)
# sanity: tile 0_0 vs z2
t00=cv2.imread('/tmp/tl/t/0_0.webp') if os.path.exists('/tmp/tl/t/0_0.webp') else cv2.imread(P+'t/0_0.webp')
print('tile check',np.abs(t00.astype(int)-z2[:t00.shape[0],:t00.shape[1]].astype(int)).mean())
LIT={}
only=sys.argv[1].split(',') if len(sys.argv)>1 else None
for hid,sh in D['shapes'].items():
    if only and hid not in only: continue
    polys=subpaths(sh['d']); f=sh['fx']
    polys,nf=fill_small_holes(polys); print(hid,'filled holes',nf)
    bx0,by0,bx1,by1=sh['b']; pad=48
    X0=max(0,int(bx0-pad)); Y0=max(0,int(by0-pad)); X1=min(MW,int(bx1+pad)+1); Y1=min(MH,int(by1+pad)+1)
    r=make(base[Y0:Y1,X0:X1],X0,Y0,X1-X0,Y1-Y0,1.0,polys,f,hid)
    cv2.imwrite(OUT+hid+'.webp',r,[cv2.IMWRITE_WEBP_QUALITY,82])
    ent={'o':[X0,Y0,X1-X0,Y1-Y0],'t':[]}
    if hid not in ('wildcamp','lushcamp'):
        pieces=[]
        for c in range(int(X0//TM),int((X1-0.01)//TM)+1):
            for rr in range(int(Y0//TM),int((Y1-0.01)//TM)+1):
                px0=c*TP; py0=rr*TP; reg=z2[py0:py0+TP,px0:px0+TP]
                if reg.size==0: continue
                h2,w2=reg.shape[:2]
                t=make(reg,px0/TS,py0/TS,w2,h2,TS,polys,f,hid)
                if t is None or t[...,3].max()<6: continue
                pieces.append((c,rr,t))
        if pieces:
            cols=min(len(pieces),3); rows=-(-len(pieces)//cols)
            atl=np.zeros((rows*TP,cols*TP,4),np.uint8)
            for i,(c,rr,t) in enumerate(pieces):
                cc,cr=i%cols,i//cols; atl[cr*TP:cr*TP+t.shape[0],cc*TP:cc*TP+t.shape[1]]=t
                ent['t'].append([c,rr,cc,cr])
            ent['a']=[cols*TP,rows*TP]
            cv2.imwrite(OUT+hid+'_a.webp',atl,[cv2.IMWRITE_WEBP_QUALITY,80])
    LIT[hid]=ent; print(hid,len(ent['t']),os.path.getsize(OUT+hid+'.webp')//1024,'KB')
json.dump(LIT,open('/tmp/bk/lit_%s.json'%('all' if not only else 'part'),'w'),separators=(',',':'))
