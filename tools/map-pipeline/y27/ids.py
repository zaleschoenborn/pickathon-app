import re, json, subprocess, pikepdf, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
cs=open('/tmp/L/cs.txt','rb').read()
pat=re.compile(rb'(?<![^\s])((?:[\d.]+ )*[\d.]+) (k|K|g|G)(?=\s)')
keys=[]; 
def sub(m):
    key=(m.group(2).decode(),m.group(1).strip().decode())
    if key not in keys: keys.append(key)
    i=keys.index(key)+1
    r,g,b=(i*37)%256,(i*91)%256,i*4
    op='rg' if m.group(2) in (b'k',b'g') else 'RG'
    return f'{r/255:.6f} {g/255:.6f} {b/255:.6f} {op}'.encode()
c=pat.sub(sub,cs)
c=re.sub(rb'/Fm\d+ Do',b'',c)   # top-level only
c=re.sub(rb'/(?!Fm)[A-Za-z]+\d* Do',b'',c)  # no images
src='/mnt/user-data/uploads/Pickathon_2026_AudienceMap_36x48_Labels_and_Icons_Off.pdf'
pdf=pikepdf.open(src); page=pdf.pages[0]
page.Contents=pdf.make_stream(b'q 0 0 0 rg 0 0 2592 3456 re f Q\n'+c); pdf.save('/tmp/L/ids.pdf')
subprocess.run(['pdftoppm','-r','200','-png','-singlefile','-aa','no','-aaVector','no','-x','254','-y','281','-W','4898','-H','9144','/tmp/L/ids.pdf','/tmp/L/ids'],check=True)
json.dump(keys,open('/tmp/L/keys.json','w'))
im=np.asarray(Image.open('/tmp/L/ids.png').convert('RGB')).astype(int)
idm=np.zeros(im.shape[:2],np.int16)
for i in range(1,len(keys)+1):
    r,g,b=(i*37)%256,(i*91)%256,i*4
    idm[(im[...,0]==r)&(im[...,1]==g)&(im[...,2]==b)]=i
np.save('/tmp/L/idm.npy',idm)
print(len(keys), [(i+1,k,int((idm==i+1).sum())) for i,k in enumerate(keys)])
