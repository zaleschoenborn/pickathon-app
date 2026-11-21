"""Design audit for the Lineup 2027 standalone build (design_lineup_artist, Nov 21 2026).
Measures the hard rules in design_specs/site_principles_draft1.md and sitewide_rules_nov17.md
on chosen screens at phone, tablet and desktop sizes:
  text floor (labels 14/15/16, sentences 16/17/18; poster art 12 on phone), tap targets 44x44,
  contrast 4.5:1 on solid backgrounds, visible scroll bars, rounded pills, sideways overflow.
Usage: python3 tools/lineup_2027_r1/build/design_audit.py [screen ids...]
Writes design_audit.json beside this file and prints a summary."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.abspath(HERE + '/..') + '/'
SCREENS = sys.argv[1:] or ['s1', 'y2026', 'y2024', 'y2013', 'y2003', 'a-shakeygraves', 'a-altngn', 'a-elucid']
SIZES = [('phone', 390, 844, 0), ('tablet', 820, 1180, 1), ('desktop', 1280, 900, 2)]
JS = r"""(args)=>{
const [sid, tier]=args; const LAB=[14,15,16][tier], SEN=[16,17,18][tier];
const m=document.getElementById(sid); document.querySelectorAll('.screen').forEach(x=>x.hidden=x!==m); window.scrollTo(0,0);
const vis=e=>{const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05};
const path=e=>{const p=[];while(e&&e!==m&&p.length<4){p.unshift(e.tagName.toLowerCase()+(e.classList.length?'.'+[...e.classList].slice(0,2).join('.'):''));e=e.parentElement}return p.join(' > ')};
const hidden=e=>{for(let x=e;x&&x!==m;x=x.parentElement){if(x.hidden)return true}return false};
const inPoster=e=>!!e.closest('.poster');
const lum=c=>{const v=c.map(x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)});return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]};
const rgba=s=>{const n=(s.match(/[\d.]+/g)||[]).map(Number);return n.length>=3?[n[0],n[1],n[2],n.length>3?n[3]:1]:null};
const bgOf=e=>{for(let x=e;x;x=x.parentElement){const s=getComputedStyle(x);if(s.backgroundImage&&s.backgroundImage!=='none')return 'image';const c=rgba(s.backgroundColor);if(c&&c[3]>0.95)return c;}return [255,255,255,1]};
const overImg=e=>{const r=e.getBoundingClientRect();const cx=r.left+r.width/2, cy=r.top+r.height/2;
  for(let x=e.parentElement;x;x=x.parentElement){for(const im of x.querySelectorAll(':scope > img, :scope > picture, :scope > video')){const q=im.getBoundingClientRect();if(cx>=q.left&&cx<=q.right&&cy>=q.top&&cy<=q.bottom)return true}}return false};
const out={text:[],tap:[],contrast:[],scroll:[],round:[],overflow:document.documentElement.scrollWidth>innerWidth+1};
const seen=new Set();
m.querySelectorAll('*').forEach(e=>{
  if(hidden(e)||!vis(e))return;
  const own=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
  const s=getComputedStyle(e);
  if(own){
    const fs=parseFloat(s.fontSize); const poster=inPoster(e);
    const sentence=(e.tagName==='P'||e.closest('p'))&&own.length>60;
    const floor=poster?12:(sentence?SEN:LAB);
    if(fs<floor-0.01) out.text.push({at:path(e),fs,floor,poster,t:own.slice(0,40)});
    const bg=bgOf(e);
    if(bg!=='image'&&!overImg(e)){const fg=rgba(s.color); if(fg){const a=fg[3];const f=[0,1,2].map(i=>fg[i]*a+bg[i]*(1-a));
      const L1=lum(f),L2=lum(bg);const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
      if(cr<4.5)out.contrast.push({at:path(e),cr:+cr.toFixed(2),t:own.slice(0,40),poster})}}
  }
  const tap=e.matches('a[href],button,select,input,[role=button],[data-art],[data-slide],[data-clip],summary,label.mb-sel');
  if(tap){const r=e.getBoundingClientRect(); const inSentence=e.tagName==='A'&&e.closest('p')&&e.closest('p').textContent.trim().length>(e.textContent||'').trim().length+5;
    if(!inSentence&&(r.width<44-0.5||r.height<44-0.5)) out.tap.push({at:path(e),w:Math.round(r.width),h:Math.round(r.height),poster:inPoster(e),t:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,30)});
    const rad=parseFloat(s.borderTopLeftRadius)||0; const isRing=e.matches('.ring,.ring *')||e.querySelector&&e.querySelector('.ring');
    if(!isRing&&rad>=12&&rad*2>=Math.min(r.width,r.height)-2) out.round.push({at:path(e),rad,t:(e.textContent||'').trim().slice(0,30)});}
  const sx=(s.overflowX==='auto'||s.overflowX==='scroll')&&e.scrollWidth>e.clientWidth+1;
  const sy=(s.overflowY==='auto'||s.overflowY==='scroll')&&e.scrollHeight>e.clientHeight+1;
  if((sx&&e.offsetHeight-e.clientHeight>(parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth))+0.5)||(sy&&e.offsetWidth-e.clientWidth>(parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth))+0.5)) out.scroll.push({at:path(e)});
});
return out}"""
async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for nm, w, h, tier in SIZES:
            pg = await b.new_page(viewport={'width': w, 'height': h}, has_touch=(tier < 2), is_mobile=(tier == 0))
            await pg.goto('file://' + SITE + 'index.html'); await pg.wait_for_timeout(400)
            for sid in SCREENS:
                if not await pg.evaluate("(i)=>!!document.getElementById(i)", sid):
                    print('missing screen', sid); continue
                res['%s@%s' % (sid, nm)] = await pg.evaluate(JS, [sid, tier])
            await pg.close()
        await b.close()
    json.dump(res, open(HERE + '/design_audit.json', 'w'), indent=1)
    print('%-26s %6s %6s %6s %6s %6s %s' % ('screen@size', 'text', 'tap', 'contr', 'scroll', 'round', 'overflow'))
    for k, v in res.items():
        print('%-26s %6d %6d %6d %6d %6d %s' % (k, len(v['text']), len(v['tap']), len(v['contrast']), len(v['scroll']), len(v['round']), v['overflow']))
asyncio.run(main())
