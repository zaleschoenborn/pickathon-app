import cv2,numpy as np,os
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
z=cv2.imread('/tmp/bk/orig/z2c_stage3.png'); m=cv2.imread('/tmp/bk/sliv_mask5.png',0)
m=cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
out=z.copy(); H,W=m.shape; T=512
for y in range(0,H,T):
    for x in range(0,W,T):
        if not m[y:y+T,x:x+T].any(): continue
        ya,yb,xa,xb=max(y-12,0),min(y+T+12,H),max(x-12,0),min(x+T+12,W)
        r=cv2.inpaint(z[ya:yb,xa:xb],m[ya:yb,xa:xb],3,cv2.INPAINT_TELEA)
        mm=m[ya:yb,xa:xb]>0; sub=out[ya:yb,xa:xb]; sub[mm]=r[mm]
cv2.imwrite('/tmp/tl/z2c.png',out)
b=cv2.imread('/tmp/bk/orig/map_stage3.jpg')
mk=cv2.resize(m,(b.shape[1],b.shape[0]),interpolation=cv2.INTER_AREA); mk=(mk>20).astype(np.uint8)*255
nb=cv2.inpaint(b,mk,3,cv2.INPAINT_TELEA)
cv2.imwrite(P+'map.jpg',nb,[cv2.IMWRITE_JPEG_QUALITY,90]); cv2.imwrite(P+'map.webp',nb,[cv2.IMWRITE_WEBP_QUALITY,85])
ch_=0
for f in os.listdir(P+'t'):
    cc,rr=map(int,f[:-5].split('_')); tl=out[rr*1024:(rr+1)*1024,cc*1024:(cc+1)*1024]; ol=z[rr*1024:(rr+1)*1024,cc*1024:(cc+1)*1024]
    if (tl!=ol).any(): cv2.imwrite(P+'t/'+f,tl,[cv2.IMWRITE_WEBP_QUALITY,84]); ch_+=1
print('tiles',ch_)
