import numpy as np,cv2,json
LA=np.load('layer_alpha.npy');LC=np.load('layer_col.npy')
L=np.load('vf/L_final.npy');hoods=open('vf/hoods.txt').read().split(',')
ch=(LA>128).astype(np.uint8)
ob=cv2.morphologyEx(ch,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(37,37)))
n,lb,st,_=cv2.connectedComponentsWithStats(ob,connectivity=8)
Lo=L.copy();force={}
def comp_at(px,py,r=40):
    sub=lb[int(py*2.4)-r:int(py*2.4)+r,int(px*2.4)-r:int(px*2.4)+r];v=sub[sub>0]
    return int(np.bincount(v).argmax()) if len(v) else 0
force[comp_at(965,3295)]='courtyard'     # vinyl / DJ
force[comp_at(1173,3310)]='farmhouse'    # 2026 ticket
for j in range(1,n):
    x,y,w,h,a=st[j]
    if a<2500 or w>800 or h>1000: continue
    sub=(lb[y:y+h,x:x+w]==j);Ls=L[y:y+h,x:x+w]
    vals=Ls[sub];vals=vals[vals>0];frac=len(vals)/a
    col=LC[y:y+h,x:x+w][sub].mean(0);green=(col[1]>col[0]+15)and(col[1]>col[2]+15)
    if j in force: o=hoods.index(force[j])+1
    elif frac>=0.3: o=np.bincount(vals).argmax()
    else:
        dj=cv2.dilate(sub.astype(np.uint8),np.ones((31,31),np.uint8))>0
        v2=Ls[dj&~sub];v2=v2[v2>0]
        if len(v2)<200 or green: continue
        o=np.bincount(v2).argmax()
    mk=cv2.dilate(sub.astype(np.uint8),np.ones((7,7),np.uint8))>0
    Lo[y:y+h,x:x+w][mk]=o
np.save('vf/L_obj.npy',Lo)
F4=dict(np.load('final_masks4.npz'));allh=list(F4)
H2,W2=7620,4082;lab=np.zeros((H2,W2),np.uint8);best=np.zeros((H2,W2),np.float32)
for i,h in enumerate(hoods):
    m=cv2.resize((Lo==i+1).astype(np.float32),(W2,H2),interpolation=cv2.INTER_AREA)
    u=m>np.maximum(best,0.5);lab[u]=i+1;best=np.where(u,m,best)
P='/tmp/claude-0/-home-claude/0d69f8ed-bfd9-58a4-8701-dacd9cbf2090/scratchpad/mapproto/index.html'
s=open(P).read()
def grab(name):
    i=s.index('const '+name+'=')+len('const '+name+'=');d=0;j=i
    while True:
        c=s[j]
        if c=='{':d+=1
        elif c=='}':
            d-=1
            if d==0:break
        j+=1
    return json.loads(s[i:j+1])
IA=grab('ICON_AT');IO=grab('ICON_OWN');extra=[h for h in allh if h not in hoods]
for k,v in IA.items():
    for p in v:
        x,y,_,_,w,h=p;o=IO.get(f'{k}|{x}|{y}')
        if o not in hoods or k in('dj','ticket'): continue
        xa,ya,xb,yb=int(round((x-w/2)*2)),int(round((y-h/2)*2)),int(round((x+w/2)*2)),int(round((y+h/2)*2));r=14
        sub=np.zeros((yb-ya,xb-xa),np.uint8)
        cv2.rectangle(sub,(r,0),(xb-xa-1-r,yb-ya-1),1,-1);cv2.rectangle(sub,(0,r),(xb-xa-1,yb-ya-1-r),1,-1)
        for cx,cy in((r,r),(xb-xa-1-r,r),(r,yb-ya-1-r),(xb-xa-1-r,yb-ya-1-r)):cv2.circle(sub,(cx,cy),r,1,-1)
        lab[ya:yb,xa:xb][sub>0]=hoods.index(o)+1
out={h:lab==i+1 for i,h in enumerate(hoods)}
for h in extra: out[h]=F4[h]&(lab==0)
np.savez_compressed('final_masks6.npz',**out);print('saved',force)
