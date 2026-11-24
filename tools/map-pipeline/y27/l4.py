import numpy as np, csv, os
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
F=2.4
im=Image.fromarray(np.load('L3.npy')).convert('RGBA')
B=list(csv.DictReader(open('/home/claude/work/map27/badges_2026.csv')))
for row in B:
    e=Image.open(f"/mnt/user-data/uploads/map_emblems/{row['id']}-384.png").convert('RGBA')
    sz=round(float(row['diameter'])*75/72*F); e=e.resize((sz,sz),Image.LANCZOS)
    cx,cy=float(row['center_x'])*F,float(row['center_y'])*F
    im.alpha_composite(e,(round(cx-sz/2),round(cy-sz/2)))
im=im.convert('RGB'); A=np.asarray(im); np.save('L4.npy',A)
im.resize((4898//6,9144//6),Image.LANCZOS).save('L4_small.png')
print(len(B))
