import cv2,numpy as np,os
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
z=cv2.imread('/tmp/bk/orig/z2c.png'); m=cv2.imread('/tmp/bk/sliv_mask2.png',0)
m=cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
out=z.copy()
n,lb,st,_=cv2.connectedComponentsWithStats(m,connectivity=8)
for i in range(1,n):
    x,y,w,h,a=st[i]; p=12
    x0,y0=max(0,x-p),max(0,y-p); x1,y1=min(z.shape[1],x+w+p),min(z.shape[0],y+h+p)
    mk=(lb[y0:y1,x0:x1]==i).astype(np.uint8)*255
    out[y0:y1,x0:x1][mk>0]=cv2.inpaint(z[y0:y1,x0:x1],mk,4,cv2.INPAINT_TELEA)[mk>0]
cv2.imwrite('/tmp/tl/z2c.png',out)
# base map
b=cv2.imread('/tmp/bk/orig/map.jpg')
ms=cv2.resize(m,(b.shape[1],b.shape[0]),interpolation=cv2.INTER_AREA); ms=(ms>40).astype(np.uint8)*255
nb=b.copy(); n2,l2,s2,_=cv2.connectedComponentsWithStats(ms,connectivity=8)
for i in range(1,n2):
    x,y,w,h,a=s2[i]; p=8
    x0,y0=max(0,x-p),max(0,y-p); x1,y1=min(b.shape[1],x+w+p),min(b.shape[0],y+h+p)
    mk=(l2[y0:y1,x0:x1]==i).astype(np.uint8)*255
    nb[y0:y1,x0:x1][mk>0]=cv2.inpaint(b[y0:y1,x0:x1],mk,3,cv2.INPAINT_TELEA)[mk>0]
cv2.imwrite(P+'map.jpg',nb,[cv2.IMWRITE_JPEG_QUALITY,90]); cv2.imwrite(P+'map.webp',nb,[cv2.IMWRITE_WEBP_QUALITY,85])
ch=0
for f in os.listdir('/tmp/bk/orig/t'):
    c,r=map(int,f[:-5].split('_')); tl=out[r*1024:(r+1)*1024,c*1024:(c+1)*1024]; ol=z[r*1024:(r+1)*1024,c*1024:(c+1)*1024]
    if (tl!=ol).any(): cv2.imwrite(P+'t/'+f,tl,[cv2.IMWRITE_WEBP_QUALITY,84]); ch+=1
print('components',n-1,'tiles changed',ch)
