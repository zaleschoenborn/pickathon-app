import re, json
TF=4898/2041
cs=open('/tmp/L/cs.txt','rb').read()
leaf=re.compile(rb'q 1 0 0 1 (-?[\d.]+) (-?[\d.]+) cm\n((?:(?!q\n|q |Q\n).)*?)\nQ(?=\n)',re.S)
num=re.compile(rb'(-?[\d.]+(?:\s+-?[\d.]+)*)\s+(m|l|c|v|y|re)\b')
def bbox(body,ox,oy):
    xs=[];ys=[]
    for m in num.finditer(body):
        v=[float(t) for t in m.group(1).split()]
        op=m.group(2)
        n={b'm':2,b'l':2,b'c':6,b'v':4,b'y':4,b're':4}[op]; v=v[-n:]
        if op==b're':
            x,y,w,h=v; pts=[(x,y),(x+w,y+h)]
        else: pts=[(v[i],v[i+1]) for i in range(0,len(v),2)]
        for x,y in pts: xs.append(x+ox); ys.append(y+oy)
    if not xs: return None
    px=[x*200/72-254 for x in xs]; py=[(3456-y)*200/72-281 for y in ys]
    return min(px),min(py),max(px),max(py)
MI=json.load(open('/home/claude/work/pk/tools/places_r1/map_icons.json'))
boxes=[]
for k,x,y,o in MI:
    if k=='merch': continue
    cx,cy=x*TF,y*TF; h=82 if k=='gear' else 70
    if k=='tent': cx+=5; cy-=6; h=68
    boxes.append((cx-h,cy-h,cx+h,cy+h,k))
KILL=[(3706,6354,85,'frog'),(3537,5412,66,'vinyl'),(1470,5440,95,'logging-road scrap')]
stats={}
def f(m):
    ox,oy=float(m.group(1)),float(m.group(2)); b=bbox(m.group(3),ox,oy)
    if b is None: return m.group(0)
    bx0,by0,bx1,by1=b; ccx,ccy=(bx0+bx1)/2,(by0+by1)/2
    for kx,ky,kr,nm in KILL:
        if (ccx-kx)**2+(ccy-ky)**2<kr*kr: stats[nm]=stats.get(nm,0)+1; return b'q Q'
    for x0,y0,x1,y1,k in boxes:
        if bx0>=x0 and by0>=y0 and bx1<=x1 and by1<=y1:
            stats[k]=stats.get(k,0)+1; return b'q Q'
    return m.group(0)
out=leaf.sub(f,cs)
print(stats)
open('/tmp/L/cs_clean.txt','wb').write(out)
rp=re.compile(rb'\n(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) re\n(f\*?|S|B)\n')
cnt=[0]
def fr(m):
    x,y,w,h=[float(m.group(i)) for i in range(1,5)]
    px=[x*200/72-254,(x+w)*200/72-254]; py=[(3456-y)*200/72-281,(3456-y-h)*200/72-281]
    bx0,bx1,by0,by1=min(px),max(px),min(py),max(py)
    for x0,y0,x1,y1,k in boxes:
        if bx0>=x0 and by0>=y0 and bx1<=x1 and by1<=y1: cnt[0]+=1; return b'\n'
    return m.group(0)
out2=rp.sub(fr,out); print('bare rects removed',cnt[0])
open('/tmp/L/cs_clean.txt','wb').write(out2)
