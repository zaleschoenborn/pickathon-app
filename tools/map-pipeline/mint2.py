import cv2,numpy as np,os
exec(open('/tmp/bk/mint.py').read().split("print('selected'")[0].replace("if a>800: sel[i]=True","if 800<a<30000: sel[i]=True"))
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
M=sel[lb].astype(np.uint8)
def remap(img,mask):
    zf=img.astype(np.float32); t=np.clip(((zf-F)@d)/(d@d),0,1); proj=F+t[...,None]*d
    res=np.linalg.norm(zf-proj,axis=2); w=np.clip(1-res/45,0,1)*(mask>0)
    newp=G+t[...,None]*(GH-G)
    out=zf+(newp-proj)*w[...,None]
    return np.clip(out+.5,0,255).astype(np.uint8)
Md=cv2.dilate(M,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
z0=cv2.imread('/tmp/bk/orig/z2c_stage1.png'); out=remap(z0,Md); cv2.imwrite('/tmp/tl/z2c.png',out)
b=cv2.imread('/tmp/bk/orig/map_stage1.jpg'); ms=cv2.resize(Md,(b.shape[1],b.shape[0]),interpolation=cv2.INTER_NEAREST)
nb=remap(b,ms); cv2.imwrite(P+'map.jpg',nb,[cv2.IMWRITE_JPEG_QUALITY,90]); cv2.imwrite(P+'map.webp',nb,[cv2.IMWRITE_WEBP_QUALITY,85])
ch=0
for f in os.listdir(P+'t'):
    c,r=map(int,f[:-5].split('_')); tl=out[r*1024:(r+1)*1024,c*1024:(c+1)*1024]; ol=z0[r*1024:(r+1)*1024,c*1024:(c+1)*1024]
    if (tl!=ol).any(): cv2.imwrite(P+'t/'+f,tl,[cv2.IMWRITE_WEBP_QUALITY,84]); ch+=1
print('selected',int(sel.sum()),'tiles',ch)
for n,(cx,cy) in {'a':(1330,4780),'b':(2000,8060),'c':(4230,4560)}.items(): cv2.imwrite(f'/tmp/mm_{n}.png',out[cy-260:cy+260,cx-260:cx+260])
