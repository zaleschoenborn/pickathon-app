import pikepdf,re,subprocess,sys,numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
src='/mnt/user-data/uploads/Pickathon_2026_AudienceMap_36x48_Labels_and_Icons_Off.pdf'
cs=open('/tmp/L/cs.txt','rb').read()
def strip_top(c):
    c=re.sub(rb'BT.*?ET',b'',c,flags=re.S)
    c=re.sub(rb'(\n)(?:f\*?|S|s|B\*?|b\*?|sh)(?=\n)',rb'\1n',c)
    c=re.sub(rb'/(?!Fm)[A-Za-z]+\d* Do',b'',c)
    return c
BASE=strip_top(cs)
def render(keep_forms, bgrgb, name, top=False, cont=None):
    pdf=pikepdf.open(src); page=pdf.pages[0]
    c=cs if top else BASE
    if cont is not None: c=cont
    c=re.sub(rb'/Fm(\d+) Do',lambda m:m.group(0) if int(m.group(1)) in keep_forms else b'',c)
    r,g,b=bgrgb
    pre=f'q {r} {g} {b} rg 0 0 2592 3456 re f Q\n'.encode()
    page.Contents=pdf.make_stream(pre+c); pdf.save(f'/tmp/L/{name}.pdf')
    subprocess.run(['pdftoppm','-r','200','-png','-singlefile','-x','254','-y','281','-W','4898','-H','9144',f'/tmp/L/{name}.pdf',f'/tmp/L/{name}'],check=True,timeout=900)
    return np.asarray(Image.open(f'/tmp/L/{name}.png').convert('RGB')).astype(np.float32)
def alpha_of(keep, name, top=False, cont=None):
    M=render(keep,(1,0,1),name+'_m',top,cont); G=render(keep,(0,1,0),name+'_g',top,cont)
    mag=np.array([255,0,255],np.float32); grn=np.array([0,255,0],np.float32)
    # alpha from channel 0 (R): Pm-Pg = (1-a)*255
    a=1-(M[...,0]-G[...,0])/255.0; a=np.clip(a,0,1)
    col=np.where(a[...,None]>1e-3,(M-(1-a[...,None])*mag)/np.maximum(a[...,None],1e-3),0)
    return a,np.clip(col,0,255)
