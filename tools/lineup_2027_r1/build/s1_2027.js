(function(){
const ALL=__ALL__;
function rnd(){return Math.random()}
function order(list){
 const n=list.length; if(!n) return [];
 const top=list.slice(0,Math.min(40,n)), rest=list.slice(top.length);
 const open=top.map(c=>[c.r+rnd()*14,c]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
 const opening=open.slice(0,Math.min(24,n)), spill=open.slice(opening.length);
 let pool=spill.concat(rest);
 const q=pool.slice(0,Math.ceil(pool.length/4));
 const reserve=q.filter(()=>rnd()<0.3);
 const resSet=new Set(reserve);
 let next=pool.filter(c=>!resSet.has(c)).map(c=>[c.r+rnd()*8,c]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
 let res=reserve.sort(()=>rnd()-.5);
 const seq=opening.slice();
 while(next.length||res.length){
  for(let i=0;i<9&&next.length;i++) seq.push(next.shift());
  for(let i=0;i<3&&res.length;i++) seq.push(res.shift());
 }
 // sudoku: avoid same class, genre or year next to each other (look ahead 5)
 const out=[];
 while(seq.length){
  const p=out[out.length-1]; let pick=0;
  if(p){for(let j=0;j<Math.min(5,seq.length);j++){const c=seq[j];if(c.k!==p.k&&(c.g[0]||'')!==(p.g[0]||'')&&c.y!==p.y){pick=j;break}}}
  out.push(seq.splice(pick,1)[0]);
 }
 return out;
}
let cur=[],shown=0,genre='';
const grid=document.getElementById('p27-grid');
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}
function card(c){const pz=c.c?`<span class="pz" data-clip="${esc(c.c)}"${c.q?` data-q="${esc(c.q)}"`:""} role="button" tabindex="0" aria-label="Play a song by ${esc(c.n)}"><span class="ring"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" fill="#fff"/></svg></span></span>`:"";return `<a class="ov${c.img?"":" nop"}" data-art="${c.a}" data-an="${esc(c.n)}" data-ay="${c.y}" href="#">${c.img?`<img loading="lazy" alt="" src="${c.img}" style="object-position:${c.pos.split(" ")[0]} 30%">`:""}<span class="ov-y">${c.y}</span>${pz}<span class="ov-b"><span class="ov-k"><span class="k ${c.kc}">${c.k}</span><span class="ov-g">${esc(c.g[0]||"")}</span></span><span class="ov-n">${esc(c.n)}</span><span class="ov-l">${esc(c.l)}</span></span></a>`}
function fit(){grid.querySelectorAll('.ov-n:not([data-f])').forEach(n=>{n.dataset.f=1;let s=28;const w=n.parentElement.clientWidth-32;while(n.scrollWidth>w&&s>15){s--;n.style.fontSize=s+'px'}})}
function more(k){const add=cur.slice(shown,shown+k);grid.insertAdjacentHTML('beforeend',add.map(card).join(''));shown+=add.length;fit();prog()}
function prog(){const n=seen();document.getElementById('p27-prog').style.width=(cur.length?Math.min(100,100*n/cur.length):0)+'%';document.getElementById('p27-seen').textContent=n;document.getElementById('p27-tot').textContent=cur.length}
function seen(){let n=0;grid.querySelectorAll('.ov').forEach(e=>{if(e.getBoundingClientRect().top<innerHeight)n++});return n}
const TIX=`<div class="tix"><div class="tix-t"><p class="tix-k">Pickathon 2027 · August 5–8</p><p class="tix-h">All of them played the farm before the world caught on. 2027 is next.</p></div><a class="tix-b" href="#">Get 2027 tickets</a></div>`;function load(){const list=ALL.filter(c=>!genre||c.g.includes(genre));cur=order(list);shown=0;grid.innerHTML='';more(24);grid.insertAdjacentHTML('beforeend',TIX)}
document.fonts.ready.then(load);const HD=document.querySelector('#s1 .hd');const sbx=document.querySelector('#s1 .sb');function sbt(){const h=getComputedStyle(HD).position.match(/sticky|fixed/)?HD.getBoundingClientRect().height:0;sbx.style.top=h+'px'}sbt();addEventListener('resize',sbt);
new IntersectionObserver(e=>{if(e[0].isIntersecting&&shown<cur.length)more(12)},{rootMargin:'800px'}).observe(document.getElementById('p27-more'));
addEventListener('scroll',()=>{prog();const sb=document.querySelector('#s1 .sb');sb.classList.toggle('stuck',sb.getBoundingClientRect().top<=parseFloat(sb.style.top||0)+1)},{passive:true});
const sheet=document.getElementById('p27-sheet');
document.getElementById('p27-gbtn').onclick=()=>sheet.hidden=false;
sheet.onclick=e=>{const b=e.target.closest('button');if(!b){sheet.hidden=true;return}genre=b.dataset.g;document.getElementById('p27-gval').textContent=b.textContent;sheet.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));sheet.hidden=true;load()};
window.__pick=g=>{genre=g;document.getElementById('p27-gval').textContent=g||'Every kind';load()};

grid.addEventListener('click',e=>{const z=e.target.closest('[data-clip]');if(!z||z.dataset.q&&z.dataset.q.indexOf(';;')>0&&window.__pkVideo)return;if(window.__pkPlayVid){e.preventDefault();e.stopPropagation();window.__pkPlayVid(z.getAttribute('data-clip'),'')}});

document.querySelector('#s1 .p7-dn').addEventListener('click',e=>{e.preventDefault();document.getElementById('p27-wait').scrollIntoView({behavior:'smooth'})});
})();