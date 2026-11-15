import json,re,urllib.parse,random
ROOT='/home/claude/pickathon-app/'
d=json.load(open(ROOT+'data.json'))
YS=['2010','2013','2014','2019','2023','2024','2025']
A='html.pk-yg #root#root#root#root#root#root#root#root '
IS=':is('+','.join(f'[data-y="{y}"]' for y in YS)+')'
ALL=A+'.pk-yp-mount'+IS+' ~ '
ART=A+'article:has(> .pk-yp-mount'+IS+')'
FP='"Pickathon 2014","Work Sans",sans-serif'
FB="'Bricolage Grotesque',system-ui,sans-serif"
def uri(svg): return "url(\"data:image/svg+xml,"+urllib.parse.quote(svg,safe="/:=;, ()'-.")+"\")"
def svg(w,h,body): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none">{body}</svg>'
def trees(col,w=390,h=92):
    random.seed(7); x=-10; out=''
    while x<w+10:
        tw=random.choice([34,44,56,40]); th=random.choice([50,70,88,62]); p=[]; lv=5
        for i in range(lv):
            y0=h-th+i*th/lv; half=(i+1)*tw/(2*lv)+3
            p.append((x+tw/2-half*0.55,y0+th/lv*0.55)); p.append((x+tw/2-half,y0+th/lv))
        poly=[(x+tw/2,h-th)]+p+[(x+tw/2-3,h),(x+tw/2+3,h)]+[(2*(x+tw/2)-a,b) for a,b in reversed(p)]
        out+='<polygon points="'+' '.join('%.1f,%.1f'%q for q in poly)+'" fill="'+col+'"/>'
        x+=tw*0.72
    return svg(w,h,out+f'<rect y="{h-3}" width="{w}" height="4" fill="{col}"/>')
def edge(y,b):
    P,I,I2,W,Lt=b['paper'],b['ink'],b['ink2'],b['warm'],b['light']
    if y=='2013':
        dia=''.join(f'<polygon points="{x},46 {x+46},0 {x+92},46 {x+46},92" fill="url(#h)"/>' for x in range(-46,400,92))
        return 92,svg(390,92,f'<defs><pattern id="h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="{P}"/><path d="M0 0H7M0 0V7" stroke="{Lt}" stroke-width="2.6"/></pattern></defs><rect y="46" width="390" height="46" fill="{P}"/>{dia}')
    if y=='2023': return 92,trees(P)
    if y=='2025':
        dots=''.join(f'<circle cx="{x+ (8 if r%2 else 0)}" cy="{9+r*17}" r="3.2" fill="{I}"/>' for r in range(3) for x in range(8,250,17))
        return 54,svg(390,54,f'<rect width="390" height="54" fill="#19E3E0"/>{dots}<polygon points="266,0 390,0 390,54 240,54" fill="{W}"/>')
    if y=='2010':
        sc=''.join(f'<circle cx="{x}" cy="{cy}" r="21" fill="{c}" stroke="{I}" stroke-width="2.5"/>' for cy,off,c in ((62,0,W),(40,19.5,Lt),(18,0,P)) for x in range(int(-20+off),420,39))
        return 80,svg(390,80,f'{sc}<rect y="62" width="390" height="20" fill="{P}"/>')
    if y=='2014':
        ln=''.join(f'<line x1="0" y1="{30+k*8}" x2="390" y2="{4+k*8}" stroke="{W}" stroke-width="2"/>' for k in range(4))
        return 64,svg(390,64,f'<polygon points="0,24 390,0 390,64 0,64" fill="{P}"/>{ln}')
    if y=='2019':
        pine=lambda x,h: f'<g transform="translate({x},{112-h})"><polygon points="0,{h} {h*.32},{h} {h*.16},0" fill="{Lt}"/><polygon points="{h*.03},{h*.62} {h*.29},{h*.62} {h*.16},{h*.12}" fill="{Lt}"/></g>'
        return 112,svg(390,112,f'<ellipse cx="195" cy="150" rx="265" ry="148" fill="{I}"/><ellipse cx="195" cy="158" rx="262" ry="148" fill="{P}"/>'+''.join(pine(x,h) for x,h in ((22,46),(52,66),(84,40),(292,42),(318,68),(352,48))))
    if y=='2024':
        MU='#C5AC38'; cl=''.join(f'<circle cx="{x}" cy="{cy}" r="{r}" fill="{MU}"/>' for x,cy,r in ((10,70,30),(52,58,34),(98,72,28),(292,72,28),(338,58,34),(380,70,30),(140,84,22),(250,84,22)))
        return 96,svg(390,96,f'{cl}<path d="M0 76 Q195 60 390 76 V98 H0Z" fill="{P}"/>')
hatch=lambda c: f'repeating-linear-gradient(45deg,{c} 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,{c} 0 2px,transparent 2px 6px)'
RIB=lambda bg,ink: f'background:{bg}!important;color:{ink}!important;-webkit-text-fill-color:{ink}!important;clip-path:polygon(0 0,100% 0,calc(100% - 12px) 50%,100% 100%,0 100%,12px 50%);padding:9px 24px!important;width:max-content;max-width:100%;margin-left:auto!important;margin-right:auto!important'
out=[]
def R(sel,body): out.append(sel+'{'+body+'}')
# ---------- shared: Names / Photos switch (all brand years) ----------
B=A
R(B+'.pk-sl','--sl-ink:var(--yi);--sl-bg:var(--yp)')
R(B+'.pk-sl-b button:hover,'+B+'.pk-sl-4 button:hover','text-decoration:underline;text-underline-offset:4px')
R(B+'.pk-sl-sw','display:flex;height:44px;margin:16px 0 4px;border:1.5px solid var(--sl-ink);border-radius:6px;overflow:hidden')
R(B+'.pk-sl-sw button','flex:1 1 0;min-height:0;height:auto;margin:0;padding:0;border:0;border-radius:0;background:transparent!important;color:var(--sl-ink)!important;-webkit-text-fill-color:var(--sl-ink)!important;box-shadow:none!important;font:800 12.5px/1 '+FB+';letter-spacing:.12em;text-transform:uppercase;cursor:pointer')
R(B+'.pk-sl-sw button.on','background:var(--sl-ink)!important;color:var(--sl-bg)!important;-webkit-text-fill-color:var(--sl-bg)!important')
R(B+'.pk-sl.pk-sl-ph .pk-sl-b,'+B+'.pk-sl.pk-sl-ph .pk-sl-m,'+B+'.pk-sl.pk-sl-ph .pk-sl-4,'+B+'.pk-sl.pk-sl-ph .pk-sl-hint','display:none!important')
R(B+'.pk-sl.pk-sl-ph .pk-sl-in','padding-bottom:0')
R(B+'section.pk-pf.pk-pf-nm > :not(.pk-story)','display:none!important')
R(B+'section.pk-pf.pk-pf-ph','display:flex;flex-direction:column')
R(B+'section.pk-pf.pk-pf-ph > .pk-story','order:9;margin-top:26px')
# ---------- art years: shared skeleton ----------
R(ART,'display:flex!important;flex-direction:column;position:relative')
R(ALL+'#pk-yh-reel','order:-2;margin:-1px calc(50% - 50vw) 0!important;width:100vw!important;max-width:none!important;position:relative')
R(ALL+'#pk-yh-reel:before','display:none!important')
R(ALL+'#pk-yh-reel:after','content:"";position:absolute;left:0;right:0;bottom:-1px;height:var(--eh);background:var(--edge) center bottom/100% 100% no-repeat;z-index:6;pointer-events:none')
R(ALL+'#pk-yh-reel .pk-yreel-f','height:min(600px,calc(100svh - 190px))!important;min-height:440px!important;border-radius:0!important;outline:0!important')
R(ALL+'#pk-yh-reel .pk-rs,'+ALL+'#pk-yh-reel .pk-rim,'+ALL+'#pk-yh-reel .pk-rim img','border-radius:0!important')
R(ALL+'#pk-yh-reel figure.pk-rs figcaption','padding-bottom:var(--cb)!important')
R(ALL+'#pk-yh-reel figure.pk-rs figcaption .pk-tl','display:none!important')
R(ALL+'section.pk-yb','order:-1;position:static!important;overflow:visible!important;margin:0!important;background:transparent!important')
R(ALL+'section.pk-yb .pk-yb-in','position:static!important;min-height:0!important;padding:0 4px 4px!important;max-width:none')
R(ALL+'section.pk-yb .pk-yb-t','display:contents!important')
R(ALL+'section.pk-yb .pk-yb-stripe','display:none!important')
R(ALL+'section.pk-yb h1.pk-yb-h,'+ALL+'section.pk-yb p.pk-yb-d','position:relative;z-index:7')
R(ALL+'section.pk-yb img.pk-yb-badge','position:relative!important;z-index:7;inset:auto!important;right:auto!important;top:auto!important;height:auto!important;max-width:none!important;object-fit:contain')
R(ALL+'section.pk-yb .pk-yb-y','text-shadow:none!important')
R(ALL+'section.pk-yb p.pk-yb-d','margin:0!important;padding:0!important;min-height:0!important;max-width:none!important;display:block!important;font:800 12.5px/1.35 '+FB+'!important;letter-spacing:.1em!important;text-transform:uppercase;white-space:normal!important')
R(ALL.replace('#root'*8,'#root'*22)+'section.pk-yb .pk-yb-t .pk-share1.pk-share1','position:fixed!important;position:absolute!important;left:auto!important;right:0!important;top:22px!important;bottom:auto!important;width:44px!important;height:44px!important;margin:0!important;border:1.5px solid #fff!important;border-radius:50%!important;background:rgba(18,22,15,.45)!important;color:#fff!important;z-index:8;display:flex!important;align-items:center;justify-content:center')
R(ALL.replace('#root'*8,'#root'*22)+'section.pk-yb .pk-yb-t .pk-share1.pk-share1 svg','stroke:#fff!important;color:#fff!important')
R(ALL.replace('#root'*8,'#root'*22)+'section.pk-yb .pk-yb-t .pk-share1.pk-share1 svg path','stroke:#fff!important')
R(ALL+'section.pk-sl','margin:26px calc(50% - 50vw) 0!important;width:100vw;color:var(--sl-ink)')
R(ALL+'section.pk-sl .pk-sl-st','display:none!important')
R(ALL+'section.pk-sl .pk-sl-in','display:grid;grid-template-columns:auto 1fr;padding:28px 20px 26px;max-width:900px;margin:0 auto')
R(ALL+'section.pk-sl .pk-sl-in > *','grid-column:1/-1')
R(ALL+'section.pk-sl .pk-sl-in > h2.pk-sl-h','order:-3;margin:0!important')
R(ALL+'section.pk-sl .pk-sl-in > .pk-sl-r','order:-2;display:none')
R(ALL+'section.pk-sl .pk-sl-in > .pk-sl-k','order:-1;margin:8px 0 0!important;font:800 10.5px/1.2 '+FB+'!important;letter-spacing:.2em!important;text-transform:uppercase')
R(ALL+'section.pk-sl .pk-sl-m','border-color:var(--sl-ink)!important;color:var(--sl-ink)!important')
R(ALL+'section.pk-sl .pk-sl-hint','color:var(--sl-ink)!important')
def hid(sel): R(sel,'position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important')
for y in YS:
    b=d['yearBrand'][y]; P,I,I2,W,Lt,Bd=b['paper'],b['ink'],b['ink2'],b['warm'],b['light'],b['band']
    eh,sv=edge(y,b); M=A+f'.pk-yp-mount[data-y="{y}"] ~ '; logo=d['yearLogo'][y]
    yb=M+'section.pk-yb '; sl=M+'section.pk-sl '
    cb={'2013':118,'2023':118,'2025':96,'2010':104,'2014':104,'2019':132,'2024':134}[y]
    R(M+'#pk-yh-reel',f'--eh:{eh}px;--cb:{cb}px;--edge:{uri(sv)}')
    R(yb+'img.pk-yb-badge',f'content:url({logo})')
    t1,t2,t3=sl+'.pk-sl-1 button',sl+'.pk-sl-2 button',sl+'.pk-sl-3 button'
    col=lambda a,c: R(a,f'color:{c}!important;-webkit-text-fill-color:{c}!important')
    if y=='2013':
        R(yb+'.pk-yb-in','display:grid!important;grid-template-columns:1fr auto;align-items:end!important;margin-top:-64px!important')
        R(yb+'h1.pk-yb-h',f'grid-column:1;grid-row:1;justify-self:start;background:{Bd};border-radius:16px;padding:12px 18px 8px!important;box-shadow:0 0 0 4px {P}')
        R(yb+'.pk-yb-k',f'color:{P}!important;-webkit-text-fill-color:{P}!important;display:block!important;font-size:10.5px!important;letter-spacing:.2em!important;margin:0 0 4px!important'); R(yb+'.pk-yb-y',f'color:{Lt}!important;-webkit-text-fill-color:{Lt}!important;font-size:78px!important;line-height:.86!important')
        R(yb+'img.pk-yb-badge','grid-column:2;grid-row:1;width:146px!important;margin:0 -4px -4px 0')
        R(yb+'p.pk-yb-d',f'grid-column:1/-1;grid-row:2;display:flex!important;align-items:center;gap:10px;margin-top:12px!important;color:{I2}!important'); R(yb+'p.pk-yb-d:after',f'content:"";flex:1;height:2px;background:{I2}')
        R(sl+'.pk-sl-in > h2.pk-sl-h',f'grid-column:1;justify-self:start;background:{Bd};color:{Lt}!important;-webkit-text-fill-color:{Lt}!important;font-size:26px!important;letter-spacing:.04em;padding:11px 16px 8px;border-radius:12px')
        R(sl+'.pk-sl-in > .pk-sl-r',f'display:block;grid-column:2;grid-row:1;align-self:center;height:26px;margin:0 0 0 12px;background:{hatch(Lt)}')
        R(sl+'.pk-sl-in > .pk-sl-k',f'color:{I2}!important'); col(t1,I); col(t2,I2); col(t3,I)
    elif y=='2023':
        R(yb+'.pk-yb-in','display:flex!important;flex-direction:column!important;align-items:center!important;margin-top:-96px!important')
        R(yb+'img.pk-yb-badge','order:1;width:176px!important'); hid(yb+'h1.pk-yb-h')
        R(yb+'p.pk-yb-d','order:3;margin-top:8px!important;'+RIB(W,'#fff'))
        R(sl,f'--sl-ink:#fff;--sl-bg:{Lt};background:{Lt};position:relative;margin-top:40px!important')
        R(sl.rstrip()+':before',f'content:"";position:absolute;left:0;right:0;top:-13px;height:14px;background:{Lt};clip-path:polygon(0 100%,3% 20%,7% 80%,12% 10%,18% 70%,24% 25%,30% 85%,37% 15%,44% 75%,50% 20%,57% 80%,63% 10%,70% 70%,77% 25%,84% 85%,90% 15%,96% 75%,100% 30%,100% 100%)')
        R(sl+'.pk-sl-in > h2.pk-sl-h','text-align:center;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:34px!important;letter-spacing:.06em')
        R(sl+'.pk-sl-in > .pk-sl-k',f'text-align:center;color:{Bd}!important'); col(t1,'#fff'); col(t2,Bd); col(t3,'#fff')
    elif y=='2025':
        R(yb+'.pk-yb-in','display:grid!important;grid-template-columns:170px 1fr;align-items:end;column-gap:6px;margin-top:-74px!important')
        R(yb+'img.pk-yb-badge',f'grid-row:1/3;width:170px!important;background:radial-gradient(circle at 50% 46%,{P} 0 44%,transparent 45%)')
        R(yb+'h1.pk-yb-h','text-align:right!important;align-self:end;padding:84px 6px 0 0!important'); hid(yb+'.pk-yb-k')
        R(yb+'.pk-yb-y',f'display:inline-block!important;font-size:64px!important;line-height:.86!important;color:{I}!important;-webkit-text-fill-color:{I}!important;transform:skew(-9deg)')
        R(yb+'p.pk-yb-d',f'text-align:right;align-self:start;padding:8px 6px 4px 0!important;color:{I2}!important;font-size:12px!important')
        R(yb+'.pk-yb-stripe',f'display:block!important;height:12px!important;margin:18px calc(50% - 50vw) 0!important;width:100vw;background:linear-gradient(90deg,{W} 0 33%,{Lt} 33% 66%,#19E3E0 66%)'); R(yb+'.pk-yb-stripe span','display:none!important')
        R(sl,'margin-top:0!important')
        R(sl+'.pk-sl-in > h2.pk-sl-h',f'justify-self:start;font-size:38px!important;color:{I}!important;-webkit-text-fill-color:{I}!important;transform:skew(-9deg);background:linear-gradient(transparent 55%,{Lt} 55%);padding:0 8px')
        R(sl+'.pk-sl-in > .pk-sl-k',f'color:{I2}!important'); R(sl+'.pk-sl-b,'+sl+'.pk-sl-4','text-align:left!important')
        R(t1,'margin:0 14px 0 0!important;transform:skew(-9deg);display:inline-block!important;text-align:left!important'); R(t2,'margin:0 12px 0 0!important'); col(t1,I); col(t2,I2); col(t3,I)
    elif y=='2010':
        R(yb+'.pk-yb-in','display:grid!important;grid-template-columns:1fr 150px;align-items:end;margin-top:-70px!important')
        R(yb+'img.pk-yb-badge','grid-column:2;grid-row:1/3;width:150px!important;margin-right:-4px')
        R(yb+'h1.pk-yb-h','grid-column:1;grid-row:1;align-self:end;padding-top:76px!important'); R(yb+'.pk-yb-k',f'color:{I}!important;font-size:11px!important;letter-spacing:.2em!important')
        R(yb+'.pk-yb-y',f'font-size:88px!important;line-height:.9!important;color:{W}!important;-webkit-text-fill-color:{W}!important')
        R(yb+'p.pk-yb-d',f'grid-column:1;grid-row:2;margin-top:8px!important;color:{I}!important;font-size:12px!important')
        dm=f'background-color:{I};background-image:linear-gradient(45deg,{Lt} 25%,transparent 25%),linear-gradient(-45deg,{Lt} 25%,transparent 25%),linear-gradient(45deg,transparent 75%,{Lt} 75%),linear-gradient(-45deg,transparent 75%,{Lt} 75%);background-size:22px 22px;background-position:0 0,0 11px,11px -11px,-11px 0'
        R(yb+'.pk-yb-stripe',f'display:block!important;height:22px!important;margin:22px calc(50% - 50vw) 0!important;width:100vw;{dm}'); R(yb+'.pk-yb-stripe span','display:none!important')
        R(sl,'margin-top:0!important'); R(sl.rstrip()+':after',f'content:"";display:block;height:22px;{dm}')
        R(sl+'.pk-sl-in > h2.pk-sl-h',f'text-align:center;font-size:40px!important;color:{I}!important;-webkit-text-fill-color:{I}!important'); R(sl+'.pk-sl-in > .pk-sl-k',f'text-align:center;color:{I2}!important')
        col(t1,W); col(t2,I); col(t3,I)
    elif y=='2014':
        rb=lambda fs,w: f'position:relative;width:{w}px;max-width:86%;margin:0 auto!important;background:{Lt};border-top:2.5px solid {I};border-bottom:2.5px solid {I};padding:11px 6px 8px!important;text-align:center!important;font-size:{fs}px!important;line-height:1!important;filter:drop-shadow(0 3px 0 {I});transform:rotate(-3deg)'
        tail=lambda side: f'content:"";position:absolute;top:9px;bottom:-11px;{side}:-24px;width:26px;background:{Lt};border:2.5px solid {I};z-index:-1;clip-path:'+('polygon(0 0,100% 0,100% 100%,0 100%,12px 50%)' if side=='left' else 'polygon(0 0,100% 0,calc(100% - 12px) 50%,100% 100%,0 100%)')
        R(yb+'.pk-yb-in','display:flex!important;flex-direction:column!important;align-items:center!important;margin-top:-92px!important')
        R(yb+'img.pk-yb-badge','order:1;width:196px!important')
        R(yb+'h1.pk-yb-h','order:2;margin-top:-6px!important;'+rb(27,290)); R(yb+'h1.pk-yb-h:before',tail('left')); R(yb+'h1.pk-yb-h:after',tail('right'))
        R(yb+'.pk-yb-k,'+yb+'.pk-yb-y',f'display:inline!important;font-family:{FP}!important;font-weight:400!important;font-size:27px!important;line-height:1!important;letter-spacing:.05em!important;text-transform:uppercase;color:{I}!important;-webkit-text-fill-color:{I}!important;margin:0!important'); R(yb+'.pk-yb-k:after','content:" "')
        R(yb+'p.pk-yb-d',f'order:3;text-align:center;margin-top:24px!important;color:{I2}!important;letter-spacing:.14em!important;font-size:12px!important')
        R(sl+'.pk-sl-in > h2.pk-sl-h',f'color:{I}!important;-webkit-text-fill-color:{I}!important;letter-spacing:.05em;margin:6px auto 22px!important;'+rb(26,170).replace('rotate(-3deg)','rotate(-2deg)')); R(sl+'.pk-sl-in > h2.pk-sl-h:before',tail('left')); R(sl+'.pk-sl-in > h2.pk-sl-h:after',tail('right'))
        R(sl+'.pk-sl-in > .pk-sl-k',f'color:{I2}!important;text-align:center;margin:26px 0 4px!important'); col(t1,I2); col(t2,I); col(t3,I)
    elif y=='2019':
        R(yb+'.pk-yb-in','display:flex!important;flex-direction:column!important;align-items:center!important;margin-top:-112px!important')
        R(yb+'img.pk-yb-badge','order:1;width:186px!important')
        R(yb+'h1.pk-yb-h',f'order:2;margin-top:6px!important;width:300px;max-width:88%;background:{W};border:3px solid {I};border-radius:14px 22px 16px 24px;padding:8px 0 4px!important;text-align:center!important;box-shadow:4px 4px 0 {I}'); hid(yb+'.pk-yb-k')
        R(yb+'.pk-yb-y',f'font-size:62px!important;line-height:.95!important;letter-spacing:.03em!important;color:{I}!important;-webkit-text-fill-color:{I}!important')
        R(yb+'p.pk-yb-d',f'order:3;text-align:center;margin-top:18px!important;color:{I2}!important;letter-spacing:.14em!important;font-size:12px!important')
        R(sl,f'--sl-ink:{W};--sl-bg:{I};background:{I};border-top:6px solid {Lt}')
        R(sl+'.pk-sl-in > h2.pk-sl-h',f'text-align:center;font-size:36px!important;letter-spacing:.05em;color:{W}!important;-webkit-text-fill-color:{W}!important'); R(sl+'.pk-sl-in > .pk-sl-k',f'text-align:center;color:{Lt}!important')
        col(t1,'#fff'); col(t2,W); col(t3,P)
    elif y=='2024':
        R(yb+'.pk-yb-in','display:flex!important;flex-direction:column!important;align-items:center!important;margin-top:-118px!important')
        R(yb+'img.pk-yb-badge','order:1;width:210px!important'); R(yb+'h1.pk-yb-h','order:2;text-align:center!important'); hid(yb+'.pk-yb-k')
        R(yb+'.pk-yb-y',f'font-size:88px!important;line-height:.9!important;color:{I2}!important;-webkit-text-fill-color:{I2}!important')
        R(yb+'p.pk-yb-d','order:3;margin-top:8px!important;font-size:12px!important;letter-spacing:.14em!important;'+RIB(I,P))
        R(sl+'.pk-sl-in > h2.pk-sl-h',f'display:flex;align-items:center;gap:12px;font-size:36px!important;letter-spacing:.05em;color:{I}!important;-webkit-text-fill-color:{I}!important;margin-bottom:6px!important')
        dash=f'content:"";flex:1;height:14px;background:repeating-linear-gradient(90deg,{I2} 0 2px,transparent 2px 8px)'; R(sl+'.pk-sl-in > h2.pk-sl-h:before',dash); R(sl+'.pk-sl-in > h2.pk-sl-h:after',dash)
        R(sl+'.pk-sl-in > .pk-sl-k',f'color:{I2}!important'); col(t1,I); col(t2,I2); col(t3,I)
out.append('@media (min-width:600px) and (max-width:1199px){'+ALL+'#pk-yh-reel figure.pk-rs .pk-rim{position:absolute!important;inset:0!important;height:100%!important}'+ALL+'#pk-yh-reel figure.pk-rs .pk-rim img{width:100%!important;height:100%!important;object-fit:cover!important}'+ALL+'#pk-yh-reel figure.pk-rs figcaption{position:absolute!important;left:0!important;right:0!important;bottom:0!important;padding-top:80px!important;background:linear-gradient(transparent,rgba(12,12,10,.88) 55%)!important}}')

# ---------- class chips in Names view (dim, don't hide) ----------
R(B+'.pk-sl-f','display:flex;gap:8px;margin:10px -20px 2px;padding:0 20px;overflow-x:auto;scrollbar-width:none;white-space:nowrap')
R(B+'.pk-sl-f::-webkit-scrollbar','display:none')
R(B+'.pk-sl-f button','flex:none;min-height:0!important;height:40px!important;margin:0!important;padding:0 12px!important;border:1.5px solid var(--sl-ink)!important;border-radius:6px!important;background:transparent!important;box-shadow:none!important;color:var(--sl-ink)!important;-webkit-text-fill-color:var(--sl-ink)!important;font:800 11.5px/1 '+FB+'!important;letter-spacing:.08em!important;text-transform:uppercase;cursor:pointer')
R(B+'.pk-sl-f button.on','background:var(--sl-ink)!important;color:var(--sl-bg)!important;-webkit-text-fill-color:var(--sl-bg)!important')
R(B+'.pk-sl.pk-sl-ph .pk-sl-f','display:none!important')
for k in ('disc','leg','deep'):
    R(B+f'.pk-sl.pk-slf-{k} .pk-sl-b button:not(.k-{k}),'+B+f'.pk-sl.pk-slf-{k} .pk-sl-4 button:not(.k-{k})','opacity:.16!important')
    R((B+f'.pk-sl.pk-slf-{k} .pk-sl-b button.k-{k},'+B+f'.pk-sl.pk-slf-{k} .pk-sl-4 button.k-{k}').replace('#root'*8,'#root'*12),'color:var(--sl-ink)!important;-webkit-text-fill-color:var(--sl-ink)!important;opacity:1!important')
R(B+'.pk-sl-b button,'+B+'.pk-sl-4 button','transition:opacity .15s')
# ---------- artist record sleeve (art years) ----------
AM=A+'.pk-ya-mount'+IS+' ~ '
R(A+'section.pk-act:has(> .pk-ya-mount'+IS+')','position:relative')
R(AM+'.pk-ah','margin:0 calc(50% - 50vw)!important;width:100vw!important;max-width:none!important;height:min(560px,calc(100svh - 230px))!important;min-height:420px!important;border-radius:0!important;overflow:visible!important;position:relative')
R(AM+'.pk-ah img.pk-ah-i','width:100%!important;height:100%!important;object-fit:cover!important;border-radius:0!important')
R(AM+'.pk-ah:after','content:""!important;display:block!important;position:absolute!important;inset:auto 0 -1px 0!important;top:auto!important;width:auto!important;border:0!important;border-radius:0!important;opacity:1!important;transform:none!important;height:var(--eh);background:var(--edge) center bottom/100% 100% no-repeat;z-index:4;pointer-events:none')
R(AM+'.pk-ah .pk-ah-t','position:absolute!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;padding:90px 18px calc(var(--eh) + 22px)!important;border-radius:0!important;background:linear-gradient(transparent,rgba(12,12,10,.9) 62%)!important;z-index:3')
R(AM+'.pk-ah .pk-ah-t .pk-act-k','margin:0 0 6px!important;position:static!important')
R(AM+'.pk-ah .pk-ah-t h1.pk-act-n','margin:0 0 8px!important;line-height:1!important')
R(AM+'.pk-ah .pk-ah-y','position:absolute!important;left:auto!important;top:auto!important;right:14px!important;bottom:-30px!important;z-index:6;padding:0!important;margin:0!important;background:none!important;border:0!important;box-shadow:none!important;font-size:0!important;line-height:0!important;transform:none!important;width:auto!important;height:auto!important')
R(AM+'.pk-ah .pk-ah-y img','width:108px!important;height:auto!important;max-width:none!important;display:block!important;margin:0!important')
R(AM+'.pk-ah .pk-ah-btns','position:absolute!important;left:auto!important;right:14px!important;top:70px!important;bottom:auto!important;width:auto!important;padding:0!important;margin:0!important;background:none!important;z-index:5')
R((AM+'.pk-ah .pk-ah-btns .pk-share1').replace('#root'*8,'#root'*22),'position:static!important;width:44px!important;height:44px!important;border:1.5px solid #fff!important;border-radius:50%!important;background:rgba(18,22,15,.45)!important;color:#fff!important;display:flex!important;align-items:center;justify-content:center;margin:0!important')
R((AM+'.pk-ah .pk-ah-btns .pk-share1 span').replace('#root'*8,'#root'*22),'display:none!important')
R(AM+'.pk-act-acts','margin-top:44px!important')
R(AM+'.pk-as','margin:22px calc(50% - 50vw) 0!important;width:100vw!important;max-width:none!important;box-shadow:none!important;padding:8px 0 14px!important')
R(AM+'.pk-as:before','background:transparent!important;color:var(--yi2)!important;font-family:'+FP+'!important;font-weight:400!important;font-size:26px!important;letter-spacing:.05em!important;padding:20px 20px 4px!important')
R(AM+'.pk-as .pk-as-b','border-top:0!important;padding:12px 20px 6px!important;max-width:760px;margin:0 auto')
for y in YS:
    b=d['yearBrand'][y]; P,I,I2,W,Lt,Bd=b['paper'],b['ink'],b['ink2'],b['warm'],b['light'],b['band']
    eh,sv=edge(y,b); M2=A+f'.pk-ya-mount[data-y="{y}"] ~ '
    R(M2+'.pk-ah',f'--eh:{eh}px;--edge:{uri(sv)}')
    R(M2+'.pk-ah .pk-ah-y img',f'content:url({d["yearLogo"][y]})')
    cfg={'2013':(Bd,P,Lt),'2023':(Lt,'#fff',Bd),'2025':(I,'#fff',Lt),'2010':(I,P,W),'2014':(P,I,I2),'2019':(I,P,W),'2024':(I,P,'#C5AC38')}[y]
    R(M2+'.pk-as',f'--yp:{cfg[0]};--yi:{cfg[1]};--yi2:{cfg[2]}')
    if y=='2013':
        R(M2+'.pk-as:before',f'display:inline-block!important;background:{P}!important;color:{Bd}!important;-webkit-text-fill-color:{Bd}!important;border-radius:12px;font-size:22px!important;padding:10px 14px 7px!important;margin:16px 20px 6px')
    if y=='2023':
        R(M2+'.pk-as','position:relative;margin-top:36px!important'); R(M2+'.pk-as:before','text-align:center;color:#fff!important;-webkit-text-fill-color:#fff!important')
        R(M2+'.pk-as:after',f'content:"";position:absolute;left:0;right:0;top:-13px;height:14px;background:{Lt};clip-path:polygon(0 100%,3% 20%,7% 80%,12% 10%,18% 70%,24% 25%,30% 85%,37% 15%,44% 75%,50% 20%,57% 80%,63% 10%,70% 70%,77% 25%,84% 85%,90% 15%,96% 75%,100% 30%,100% 100%)')
    if y=='2014':
        R(M2+'.pk-as',f'border-top:2.5px solid {I}!important;border-bottom:2.5px solid {I}!important')
        R(M2+'.pk-as:before',f'display:inline-block!important;background:{Lt}!important;color:{I}!important;-webkit-text-fill-color:{I}!important;border-top:2.5px solid {I};border-bottom:2.5px solid {I};padding:9px 18px 6px!important;margin:18px 20px 8px;transform:rotate(-2deg);font-size:22px!important')
    if y=='2019': R(M2+'.pk-as',f'border-top:6px solid {Lt}!important')
    if y=='2025': R(M2+'.pk-as:before',f'display:inline-block!important;transform:skew(-9deg);background:linear-gradient(transparent 55%,{W} 55%)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;padding:0 8px!important;margin:20px 20px 6px')
# desktop
out.append('@media (min-width:900px){'+ALL+'#pk-yh-reel .pk-yreel-f{height:min(640px,calc(100svh - 240px))!important}'+ALL+'section.pk-yb .pk-yb-in{max-width:520px;margin-left:auto!important;margin-right:auto!important}'+ALL+'section.pk-yb .pk-share1{right:24px!important}}')
css='<style id="pk-yart-css">/* year pages built from each year\'s own artwork (Zale, Nov 15): photo is the cover, the year\'s art frames it; generated by tools, 7 years */\n'+'\n'.join(out)+'\n</style>'
s=open(ROOT+'index.html',encoding='utf-8').read()
s=re.sub(r'<style id="pk-yart-css">.*?</style>\n?','',s,flags=re.S)
k='<script id="pk-yg-js">'; assert s.count(k)==1
s=s.replace(k,css+'\n'+k)
open(ROOT+'index.html','w',encoding='utf-8').write(s); print(len(css))
