"""Tablet = big phone. Moves the phone/desktop split from ~700-900px to 1200px.
Run once over index.html (idempotent: values already at 1199/1200 are left alone).
Rules at 600px and below move too (they hold most of the phone layout); 560px and smaller stay phone-only.
Phone image swap (m/ 840px files) stays at 820px so tablets get full-size photos.
The map iframe keeps its own split (880px), so the landscape-tablet map stays the wide map."""
import re,sys
P=sys.argv[1] if len(sys.argv)>1 else 'index.html'
s=open(P,encoding='utf-8').read();orig=s
feat=re.compile(r'\(\s*(min|max)-width\s*:\s*(\d+)px\s*\)')
def pre(m):
    p=m.group(0)
    fs=[(a,int(n)) for a,n in feat.findall(p)]
    if not fs: return p
    mins=[n for a,n in fs if a=='min'];maxs=[n for a,n in fs if a=='max']
    if ' and ' in p and mins and maxs:
        lo,hi=min(mins),max(maxs)
        if lo>=1200 or hi<=600 or lo<=600: return p
        return feat.sub('(min-width:99999px)',p,count=1)  # mid-size range is now phone land: switch off
    def f(mm):
        a,n=mm.group(1),int(mm.group(2))
        if a=='max' and 600<=n<=1100: return '(max-width:1199px)'
        if a=='min' and 601<=n<=1100: return '(min-width:1200px)'
        return mm.group(0)
    return feat.sub(f,p)
s=re.sub(r'@media[^{};]*\{',pre,s)
rep=[('const isPhone=()=>window.innerWidth<768;','const isPhone=()=>window.innerWidth<1200;'),
("window.innerWidth < 768 ? 'p' : 'd'","window.innerWidth < 1200 ? 'p' : 'd'"),
(' var on=window.innerWidth>820;',' var on=window.innerWidth>=1200;'),
("matchMedia('(max-width:767px)')","matchMedia('(max-width:1199px)')")]
for a,b in rep:
    c=s.count(a)
    print(c,a[:60])
    s=s.replace(a,b)
open(P,'w',encoding='utf-8').write(s)
print('changed' if s!=orig else 'nochange')
