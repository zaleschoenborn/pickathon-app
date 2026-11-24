import numpy as np, json, csv
from PIL import Image, ImageDraw
from scipy import ndimage
Image.MAX_IMAGE_PIXELS=None
H,W=9144,4898; TF=4898/2041
lab_=np.load('lab.npy'); L1=np.load('L1.npy').astype(np.float32); L2=np.load('L2.npy').astype(np.float32)
a=np.load('topa.npy').astype(np.float32)/255; idm=np.load('idm2.npy')
keys=[tuple(k) for k in json.load(open('keys.json'))]
# fringe: nearest id
idx=ndimage.distance_transform_edt(idm==0,return_distances=False,return_indices=True)
idf=idm[idx[0],idx[1]]; idf[a<0.02]=0
def boxmask(rects):
    m=Image.new('L',(W,H),0); D=ImageDraw.Draw(m)
    for r in rects: D.rectangle(r,fill=255)
    return np.asarray(m)>0
def diskmask(cs):
    m=Image.new('L',(W,H),0); D=ImageDraw.Draw(m)
    for x,y,r in cs: D.ellipse((x-r,y-r,x+r,y+r),fill=255)
    return np.asarray(m)>0
B=list(csv.DictReader(open('/home/claude/work/map27/badges_2026.csv')))
EMB=diskmask([(float(b['center_x'])*2.4,float(b['center_y'])*2.4,float(b['diameter'])*75/72*2.4/2+6) for b in B])
MI=json.load(open('/home/claude/work/pk/tools/places_r1/map_icons.json'))
TENT=boxmask([(x*TF-62,y*TF-62,x*TF+62,y*TF+62) for k,x,y,o in MI if k=='tent'])
ICON=boxmask([(x*TF-(66 if k=='gear' else 54),y*TF-(66 if k=='gear' else 54),x*TF+(66 if k=='gear' else 54),y*TF+(66 if k=='gear' else 54)) for k,x,y,o in MI if k not in ('tent','merch')])
TENTC=[(x*TF,y*TF) for k,x,y,o in MI if k=='tent']
NB=json.load(open('/home/claude/work/pk/tools/places_r1/name_boxes.json'))
LBL=boxmask([(b[0]*TF-8,b[1]*TF-8,b[2]*TF+8,b[3]*TF+8) for b in NB.values()])
T={1:(40,36,19),4:(75,78,60),5:(124,210,221),6:(231,139,64),8:(164,166,164),9:(228,228,228),
   10:(54,70,94),12:(30,30,32),13:(44,40,26),27:(44,40,26),32:(44,40,26),
   22:(121,114,176),33:(121,114,176),31:(181,29,91),34:(237,231,210),25:(237,231,210),26:(237,231,210),47:(96,166,181),48:(96,166,181)}
DROP={24,19,20,29,35,36,37,38,39,40,41,42,45,46,18,23,28,30,43,44}
WHITE={3,7}; PLATEIDS={14,16,17}
WHT=np.array([244,240,228],np.float32); CREAM=np.array([237,231,210],np.float32)
lift=L1+(255-L1)*0.14
col=np.zeros((H,W,3),np.float32); alpha=a.copy()
for i,c in T.items(): col[idf==i]=c
wm=np.isin(idf,list(WHITE)); lab,n=ndimage.label(wm); sz=ndimage.sum(wm,lab,range(1,n+1))
big=np.isin(lab,np.nonzero(sz>2500)[0]+1)
col[wm&~big]=WHT; col[wm&big]=lift[wm&big]
pm=np.isin(idf,list(PLATEIDS)); col[pm]=lift[pm]
# context classes
col[LBL&wm]=CREAM
alpha[np.isin(idf,list(DROP))]=0
alpha[EMB]=0
cm_=(idm==34)|(idm==13)|(idm==12); lc,nc=ndimage.label(cm_); PROT=np.zeros_like(cm_)
for j,o in enumerate(ndimage.find_objects(lc)):
    h_=o[0].stop-o[0].start; w_=o[1].stop-o[1].start; ar=(lc[o]==j+1).sum()
    if 40<h_<110 and 40<w_<110 and 0.8<h_/w_<1.25 and ar/(h_*w_)>0.6:
        cy_=(o[0].start+o[0].stop)/2; cx_=(o[1].start+o[1].stop)/2; r_=max(h_,w_)/2+2.5
        yy_,xx_=np.ogrid[o[0].start-10:o[0].stop+10,o[1].start-10:o[1].stop+10]
        PROT[o[0].start-10:o[0].stop+10,o[1].start-10:o[1].stop+10]|=((yy_-cy_)**2+(xx_-cx_)**2)<r_*r_
print('camp circles protected',int(PROT.sum()))
# amenity art (plates, glyphs, tents) dropped whole: the site draws these icons itself
dropped=0
for k,x,y,o in []:
    cx,cy=int(x*TF),int(y*TF); R=92 if k=='gear' else 78
    if k=='tent': cx+=5; cy-=6
    sl=(slice(cy-R,cy+R),slice(cx-R,cx+R)); w=a[sl]>0.05
    lab_,n_=ndimage.label(w)
    for j,o in enumerate(ndimage.find_objects(lab_)):
        if o[0].start>0 and o[1].start>0 and o[0].stop<2*R and o[1].stop<2*R:
            m_=ndimage.binary_dilation(lab_[o]==j+1,iterations=2)
            sub=alpha[sl][o]; sub[m_&~PROT[sl][o]]=0; dropped+=1
print('amenity objects dropped',dropped)
# complete number disks that the art had partly covered with an icon plate
for j,o in enumerate(ndimage.find_objects(lc)):
    h_=o[0].stop-o[0].start; w_=o[1].stop-o[1].start
    if not(40<h_<110 and 40<w_<110 and 0.8<h_/w_<1.25): continue
    cy_=(o[0].start+o[0].stop)/2; cx_=(o[1].start+o[1].stop)/2; r_=max(h_,w_)/2
    y0_,x0_=int(cy_-r_-3),int(cx_-r_-3); sl_=(slice(y0_,int(cy_+r_+4)),slice(x0_,int(cx_+r_+4)))
    yy_,xx_=np.mgrid[sl_[0],sl_[1]]; d_=np.sqrt((yy_-cy_)**2+(xx_-cx_)**2)
    disk=d_<r_-0.5; hole=disk&(alpha[sl_]<0.5)
    if hole.sum()>30 and hole.sum()<0.5*disk.sum():
        ring=disk&(alpha[sl_]>0.9); cvals=col[sl_][ring]
        dk=cvals[cvals.sum(1)<300]; c_=np.median(dk,axis=0) if len(dk) else np.array([44,40,26.])
        col[sl_][hole]=c_; alpha[sl_][hole]=1

unk=(a>0.02)&(idm==0)&~ndimage.binary_dilation(idm>0,iterations=2)
col[unk]=(L1+(255-L1)*0.16)[unk]; print('texture dots px',int(unk.sum()))
soft=(a<0.72)&(a>0.02); soft=ndimage.binary_opening(soft,iterations=3); soft=ndimage.binary_dilation(soft,iterations=3)&(a<0.9)
alpha[soft]=0; print('soft halo px',int(soft.sum()))
vis=np.load('t2vis.npy'); allowed=LBL|(diskmask([(float(b['center_x'])*2.4,float(b['center_y'])*2.4+60,200) for b in B])&(idf==7))|ndimage.binary_dilation(lab_>0,iterations=8)|ndimage.binary_dilation(vis&(lab_==0),iterations=3)
alpha[~allowed]=0
# 2026 ticket -> plain ticket, no year (Zale: timeless)
tb=np.zeros_like(alpha,bool); tb[7870:8025,2738:2890]=True
tk=tb&(idm==23); tkf=ndimage.binary_fill_holes(ndimage.binary_closing(tk,iterations=6))
col[tkf]=(68,60,62); alpha[tkf]=np.maximum(alpha[tkf],(a[tkf]>0.02)*1.0)
alpha[tb&~tkf&(idm==10)]=0
out=L2*(1-alpha[...,None])+col*alpha[...,None]
np.save('L3.npy',out.astype(np.uint8))
O=out.astype(np.uint8)
Image.fromarray(O).resize((W//6,H//6),Image.LANCZOS).save('L3_small.png')
cs=[(3706,6330,'frog spot'),(2800,7940,'ticket spot'),(1952,7930,'Lucky'),(2440,7560,'Galaxy'),(3700,5800,'Market'),(2000,3300,'trails'),(4000,1007,'camp 4'),(2500,6700,'Paddock')]
Wd=Image.new('RGB',(4*410,2*430),'white'); d=ImageDraw.Draw(Wd)
for i,(x,y,nm) in enumerate(cs):
    Wd.paste(Image.fromarray(O[y-200:y+200,x-200:x+200]),((i%4)*410,(i//4)*430+26)); d.text(((i%4)*410+2,(i//4)*430+6),nm,fill='black')
Wd.save('L3_zoom.png')
