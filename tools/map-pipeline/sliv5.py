import cv2,numpy as np,json,sys
from scipy import ndimage as ndi
z=cv2.imread('/tmp/tl/z2c.png')
lab=cv2.cvtColor(z,cv2.COLOR_BGR2LAB).astype(np.float32)
L=lab[...,0]; ch=np.hypot(lab[...,1]-128,lab[...,2]-128)
bgd_=np.abs(z.astype(np.int16)-np.array([15,22,18],np.int16)).max(2)
bg=(bgd_<=14).astype(np.uint8)
grey=(np.abs(z.astype(np.int16)-np.array([96,110,95],np.int16)).max(2)<=14).astype(np.uint8)
grey=cv2.morphologyEx(grey,cv2.MORPH_OPEN,np.ones((9,9),np.uint8))
_n,_l,_s,_=cv2.connectedComponentsWithStats(grey,connectivity=8)
for _i in range(1,_n):
    if _s[_i,4]<4000: grey[_l==_i]=0
E=lambda m,k: cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(k,k)))
zone=E(np.maximum(bg,grey),31)>0
dark=((L<95)&(ch<60)&(bgd_>14)).astype(np.uint8)
darkn=E(dark,15)>0
pale=((L>150)&(ch<48)).astype(np.uint8)
dt=cv2.distanceTransform(pale,cv2.DIST_L2,3)
n,lb,st,ce=cv2.connectedComponentsWithStats(pale,connectivity=8)
sel=np.zeros(n,bool)
fill=E(((ch>25)&(L>60)&(pale==0)).astype(np.uint8)|grey,9)>0
cand=np.unique(lb[(zone)&(darkn)&(pale>0)&fill])
for i in cand:
    if i==0: continue
    x,y,w,h,a=st[i]
    if a<8 or a>2500: continue
    mx=dt[y:y+h,x:x+w][lb[y:y+h,x:x+w]==i].max()
    if mx<=9: sel[i]=True
m=sel[lb].astype(np.uint8)
print(sel.sum())
cv2.imwrite('sliv_mask5.png',m*255)
L_=json.load(open('loc.json'))
for k in ['7','8','9','10','11','12','4','5']:
    d=L_[k]; s=d['s']; x0,y0=max(d['x0'],0),d['y0']
    ya=max(y0+int(130/s),0); yb=y0+int(1190/s); xb=x0+int(923/s)
    c=z[ya:yb,x0:xb].copy(); mm=m[ya:yb,x0:xb]>0
    c[mm]=(0,0,255); cv2.imwrite('f%s.png'%k,c)
