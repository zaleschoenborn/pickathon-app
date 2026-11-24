import numpy as np, json
from PIL import Image
from scipy import ndimage
Image.MAX_IMAGE_PIXELS=None
L1=np.load('L1.npy').astype(np.float32); lab=np.load('lab.npy')
uber=ndimage.binary_dilation(np.load('pa23.npy')>8,iterations=3)
DOTS={24:8,25:6,26:9,27:17,28:19,29:12,31:15,32:20,33:21,36:22,37:13,38:7}
LIFT=float(__import__('sys').argv[1]) if len(__import__('sys').argv)>1 else 0.16
out=L1.copy()
for k,h in DOTS.items():
    a=np.load(f'pa{k}.npy').astype(np.float32); a[uber]=0
    med=np.median(a[a>8]); cov=np.clip(a/med,0,1)
    cov[lab!=h]=0   # dots stay inside their own neighborhood
    base=out
    lifted=base+(255-base)*LIFT
    out=base*(1-cov[...,None])+lifted*cov[...,None]
np.save('L2.npy',out.astype(np.uint8))
H,W=out.shape[:2]
Image.fromarray(out.astype(np.uint8)).resize((W//6,H//6),Image.LANCZOS).save('L2_small.png')
O=out.astype(np.uint8)
cs=[(3700,5600),(2500,6800),(3200,4950),(2470,7480),(2500,7950),(3000,3600)]
ims=[Image.fromarray(O[y-150:y+150,x-200:x+200]) for x,y in cs]
Wd=Image.new('RGB',(3*410,2*310),'white')
for i,im in enumerate(ims): Wd.paste(im,((i%3)*410,(i//3)*310))
Wd.save('L2_zoom.png')
