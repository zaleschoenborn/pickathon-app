import json,re,cv2,numpy as np
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/'
s=open(P+'index.html').read()
i=s.index('const D=')+8; D,end=json.JSONDecoder().raw_decode(s[i:])
m=re.search(r'const LIT=',s); j=m.end(); LIT,_=json.JSONDecoder().raw_decode(s[j:])
n=0
for hid,sh in D['shapes'].items():
    if hid not in LIT: print('no lit',hid); continue
    im=cv2.imread(P+'l/'+hid+'.webp',cv2.IMREAD_UNCHANGED)
    if im is None or im.shape[2]<4: print('no alpha',hid); continue
    ox,oy=LIT[hid]['o'][:2]
    a=(im[...,3]>128).astype(np.uint8)
    a=cv2.copyMakeBorder(a,12,12,12,12,cv2.BORDER_CONSTANT,value=0)
    k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13))
    a=cv2.morphologyEx(a,cv2.MORPH_CLOSE,k)   # bridge notches around single trees and icons
    a=cv2.morphologyEx(a,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))   # drop hairlines
    a=a[12:-12,12:-12]
    cs,hier=cv2.findContours(a,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)   # outer edges plus real holes (opposite winding, so nonzero fill cuts them out)
    parts=[]
    for ci,c in enumerate(cs):
        is_hole = hier[0][ci][3]!=-1
        if cv2.contourArea(c)<(3000 if is_hole else 200): continue
        c=cv2.approxPolyDP(c,1.6,True)[:,0,:]
        if len(c)<3: continue
        parts.append('M'+' '.join('%d,%d'%(x+ox,y+oy) for x,y in c)+'Z')
    if not parts: print('empty',hid); continue
    old=len(sh['d']); sh['d']=''.join(parts); n+=1
    print(hid,len(parts),'parts',old,'->',len(sh['d']))
s2=s[:i]+json.dumps(D,separators=(',',':'))+s[end+i:]
open(P+'index.html','w').write(s2); print('updated',n)
