#!/usr/bin/env python3
"""Round 3 (A8): take current-room-size ("still plays small clubs", "rooms stayed", "never got bigger") lines out of card and story copy.
   Keeps where an act was when Pickathon booked it, and growth lines. Safe to run again after any class or story import.
   Usage: python3 tools/class_import/strip_room_lines.py [--dry] [--csv out.csv]"""
import json,re,csv,sys
DRY = '--dry' in sys.argv
import os; SITE=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')); p=os.path.join(SITE,'data.json'); d=json.load(open(p,encoding='utf-8'))
# current-room-size / "never got bigger" statements (not where they were when booked, not growth)
STAG=re.compile(r"(?i)\b(still (plays|fills|works|working)\b|still a songwriter['’]s songwriter|(rooms?|shows?)( [a-z]+)? (have |has )?stayed|has stayed in|never (got bigger|left small|changed the rooms)|held steady|ceiling held|rooms run mid-size|rooms are still|(headlined |in |playing )?the same (small|mid-size) (rooms|clubs|halls)|same small clubs|(mid-size clubs|small rooms) throughout|no change in tier|career lived entirely in small rooms|have stayed that size|grown to mid-size rooms at most|nothing since has stepped|rooms stayed about the same|is still playing the same)")
SPLIT=re.compile(r"(?<!\bNo\.)(?<!\bSt\.)(?<!\bMr\.)(?<!\bDr\.)(?<!\bJr\.)(?<!\b[A-Z]\.)(?<=[.!?])\s+")
BND=re.compile(r", and |, but |, yet |; |: |, | but | yet | and (?=(he|she|they|it|his|her|their|still)\b)")
def clean(t):
    if not isinstance(t,str) or not STAG.search(t): return t
    out=[]
    for s in SPLIT.split(t):
        m=STAG.search(s)
        if not m: out.append(s); continue
        cut=None
        for b in BND.finditer(s):
            if b.start() < m.start(): cut=b
        head=s[:cut.start()].rstrip(' ,;:') if cut else ''
        if cut and len(head)>25 and not STAG.search(head) and not re.search(r'\b(later|on|since|ago)$',head):
            out.append(head+('' if head[-1] in '.!?' else '.'))
        # else the whole sentence goes
    return ' '.join(out).strip()
rows=[]
def fix(obj,key,where):
    v=obj.get(key); n=clean(v)
    if n!=v: rows.append((where,obj.get('n',''),v,n)); obj[key]=n
for i,x in enumerate(d['past'].get('deep',[])): fix(x,'l','past.deep')
for i,x in enumerate(d.get('deepcuts',[])): fix(x,'line','deepcuts')
for i,x in enumerate(d.get('archCT',[])): fix(x,'l','archCT')
for y,R in d.get('yearReel',{}).items():
    for x in R: fix(x,'l','yearReel '+y)
for y,S in d.get('yearStory',{}).items():
    for x in S.get('scenes',[]) or []: fix(x,'blurb','yearStory '+y+' scene')
    for x in S.get('acts',[]) or []: fix(x,'proof','yearStory '+y+' act')
for k,A in d.get('actPages',{}).items():
    for j,st in enumerate(A.get('story') or []):
        st.setdefault('n',k) if False else None
        v=st.get('t'); n=clean(v)
        if n!=v: rows.append(('actPages '+k,k,v,n)); st['t']=n
        mo=st.get('more') or []
        for q in range(len(mo)):
            n2=clean(mo[q])
            if n2!=mo[q]: rows.append(('actPages '+k+' more',k,mo[q],n2)); mo[q]=n2
w=csv.writer(open(sys.argv[sys.argv.index('--csv')+1] if '--csv' in sys.argv else os.devnull,'w',newline='',encoding='utf-8'))
w.writerow(['where','act','before','after']); w.writerows(rows)
print(len(rows),'edits; empty after:',sum(1 for r in rows if not r[3]))

if not DRY: open(p,'w',encoding='utf-8').write(json.dumps(d,ensure_ascii=False,separators=(',',':')))
