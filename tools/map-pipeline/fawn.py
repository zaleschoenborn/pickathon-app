import cv2,numpy as np,os
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
z=cv2.imread('/tmp/bk/orig/z2c_stage2.png'); X0,Y0=1150,4600
c=z[Y0:5500,X0:1700]
lab=cv2.cvtColor(c,cv2.COLOR_BGR2LAB).astype(np.float32); L=lab[...,0]; ch=np.hypot(lab[...,1]-128,lab[...,2]-128)
pale=((L>185)&(ch<32)).astype(np.uint8)
G=np.array([96,110,95]);GH=np.array([78,131,125])
grey=((np.abs(c.astype(int)-G).max(2)<10)|(np.abs(c.astype(int)-GH).max(2)<10)).astype(np.uint8)
m=pale&cv2.dilate(grey,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))
n,lb,st,_=cv2.connectedComponentsWithStats(m,connectivity=8)
keep=np.zeros(m.shape,np.uint8)
for i in range(1,n):
    x,y,w,h,a=st[i]
    if x<110 or y>800 or (x>370 and y>690): continue
    keep[lb==i]=255
keep=cv2.dilate(keep,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
out=z.copy(); out[Y0:5500,X0:1700]=cv2.inpaint(c,keep,4,cv2.INPAINT_TELEA)
cv2.imwrite('/tmp/tl/z2c.png',out)
b=cv2.imread('/tmp/bk/orig/map_stage2.jpg'); s=1/2.4
bx0,by0=int(X0*s)-2,int(Y0*s)-2; bx1,by1=int(1700*s)+2,int(5500*s)+2
mk=np.zeros(b.shape[:2],np.uint8); full=np.zeros(z.shape[:2],np.uint8); full[Y0:5500,X0:1700]=keep
mk=cv2.resize(full,(b.shape[1],b.shape[0]),interpolation=cv2.INTER_AREA); mk=(mk>30).astype(np.uint8)*255
nb=b.copy(); r=(slice(by0,by1),slice(bx0,bx1)); nb[r]=cv2.inpaint(b[r],mk[r],3,cv2.INPAINT_TELEA)
cv2.imwrite(P+'map.jpg',nb,[cv2.IMWRITE_JPEG_QUALITY,90]); cv2.imwrite(P+'map.webp',nb,[cv2.IMWRITE_WEBP_QUALITY,85])
ch_=0
for f in os.listdir(P+'t'):
    cc,rr=map(int,f[:-5].split('_')); tl=out[rr*1024:(rr+1)*1024,cc*1024:(cc+1)*1024]; ol=z[rr*1024:(rr+1)*1024,cc*1024:(cc+1)*1024]
    if (tl!=ol).any(): cv2.imwrite(P+'t/'+f,tl,[cv2.IMWRITE_WEBP_QUALITY,84]); ch_+=1
print('tiles',ch_)
cv2.imwrite('/tmp/fz3.png',cv2.resize(out[Y0:5500,X0:1700],None,fx=0.9,fy=0.9))
