import sys,re,json,csv,subprocess,pikepdf; sys.path.insert(0,'/tmp/L'); from rend import *
from scipy import ndimage
cs=open('/tmp/L/cs_clean.txt','rb').read()
# 1 remove whole objects (frog, 2026 ticket)
KILL=[]
leaf=re.compile(rb'q 1 0 0 1 (-?[\d.]+) (-?[\d.]+) cm\n(?:(?!q\n|q |Q\n).)*?\nQ(?=\n)',re.S)
rem=[]
def kill(m):
    x,y=float(m.group(1)),float(m.group(2)); px=x*200/72-254; py=(3456-y)*200/72-281
    for kx,ky,kr,nm in KILL:
        if (px-kx)**2+(py-ky)**2<kr*kr: rem.append(nm); return b'q Q'
    return m.group(0)
cc=leaf.sub(kill,cs); print('removed',{n:rem.count(n) for n in set(rem)})
top=re.sub(rb'/Fm\d+ Do',b'',cc)
open('/tmp/L/top_clean.txt','wb').write(top)
# 2 id render
pat=re.compile(rb'(?<![^\s])((?:[\d.]+ )*[\d.]+) (k|K|g|G)(?=\s)')
keys=[tuple(k) for k in json.load(open('/tmp/L/keys.json'))]
def sub(m):
    key=(m.group(2).decode(),m.group(1).strip().decode())
    if key not in keys: keys.append(key)
    i=keys.index(key)+1; r,g,b=(i*37)%256,(i*91)%256,i*4
    return f'{r/255:.6f} {g/255:.6f} {b/255:.6f} {"rg" if m.group(2) in (b"k",b"g") else "RG"}'.encode()
idc=pat.sub(sub,top)
src='/mnt/user-data/uploads/Pickathon_2026_AudienceMap_36x48_Labels_and_Icons_Off.pdf'
pdf=pikepdf.open(src); page=pdf.pages[0]; page.Contents=pdf.make_stream(b'q 0 0 0 rg 0 0 2592 3456 re f Q\n'+idc); pdf.save('/tmp/L/ids2.pdf')
subprocess.run(['pdftoppm','-r','200','-png','-singlefile','-aa','no','-aaVector','no','-x','254','-y','281','-W','4898','-H','9144','/tmp/L/ids2.pdf','/tmp/L/ids2'],check=True)
im=np.asarray(Image.open('/tmp/L/ids2.png').convert('RGB')).astype(int)
code=im[...,0]*65536+im[...,1]*256+im[...,2]; idm=np.zeros(code.shape,np.int16)
for i in range(1,len(keys)+1):
    r,g,b=(i*37)%256,(i*91)%256,i*4; idm[code==r*65536+g*256+b]=i
np.save('/tmp/L/idm2.npy',idm)
# 3 AA alpha
a,_=alpha_of(set(),'top_clean',cont=top)
np.save('/tmp/L/topa.npy',(a*255).astype(np.uint8)); print('done')
