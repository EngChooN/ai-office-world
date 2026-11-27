// 새 기계 3종 시안 공용(월드디자인 11-27). 시안 전용 흉내 — 실제 구현은 src/claw/claw-hud.js·claw-play.js에 기계 종류를 더하는 방식(규칙서 §0).
// HUD: 알약·✕·가운데 칩·한 줄 안내·아래 판 단추(누름 시각 = pointerdown timeStamp)·십자 판·알림·카드. 구경 화면은 act만 받아 그림(0.15초 늦게)
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let seed=20261127;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const now=()=>performance.now();
const G={coins:30,fails:0,plays:0,seen:false,dex:{}};
const hud=(()=>{
 const ph=$('.phone');const mk=(tag,cls,html='')=>{const e=document.createElement(tag);e.className='h '+cls;e.innerHTML=html;ph.append(e);return e;};
 const pill=mk('div','h-pill'),x=mk('button','h-x','✕'),chip=mk('div','h-chip'),toastEl=mk('div','h-toast'),hint=mk('div','h-hint'),
  bar=mk('button','h-bar'),pad=mk('div','h-pad',['up:▲<small>안</small>','left:◀','right:▶','down:▼<small>밖</small>'].map(s=>{const [d,t]=s.split(':');return `<button data-d="${d}">${t}</button>`;}).join('')),
  todo=mk('div','h-todo'),run=mk('button','h-run','🏃<br>달리기'),joy=mk('div','h-joy','걷기'),dim=document.createElement('div'),card=mk('section','h-card');
 dim.className='h-dim';ph.append(dim);
 x.setAttribute('aria-label','그만두기');
 for(const e of [chip,toastEl,hint,bar,pad,todo,run,joy,dim,card,x])e.hidden=true;
 let H={};let toastT=0;
 // 판 단추: 누름·뗌 시각을 그대로 넘김(손가락이 미끄러져 나가도 뗄 때까지 유지)
 let held=null;
 bar.addEventListener('pointerdown',e=>{if(bar.dataset.dim!==undefined)return;e.preventDefault();held=e.pointerId;try{bar.setPointerCapture(e.pointerId);}catch{}bar.classList.add('on');H.down?.(e.timeStamp);});
 const up=e=>{if(e.pointerId!==held)return;held=null;bar.classList.remove('on');H.up?.(e.timeStamp);};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])bar.addEventListener(ev,up);
 bar.addEventListener('contextmenu',e=>e.preventDefault());
 addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||!card.hidden||bar.hidden)return;e.preventDefault();if(bar.dataset.dim===undefined){bar.classList.add('on');H.down?.(e.timeStamp);}});
 addEventListener('keyup',e=>{if(e.code!=='Space'||bar.hidden)return;bar.classList.remove('on');H.up?.(e.timeStamp);});
 // 십자 판(공 구멍 넣기만)
 const fingers=new Map();const dirAt=(cx,cy)=>document.elementFromPoint(cx,cy)?.closest?.('.h-pad [data-d]')?.dataset.d??null;
 const paint=()=>{const on=new Set(fingers.values());for(const b of pad.querySelectorAll('[data-d]'))b.classList.toggle('on',on.has(b.dataset.d));};
 pad.addEventListener('pointerdown',e=>{const d=dirAt(e.clientX,e.clientY);if(!d)return;e.preventDefault();try{pad.setPointerCapture(e.pointerId);}catch{}fingers.set(e.pointerId,d);paint();});
 pad.addEventListener('pointermove',e=>{if(fingers.has(e.pointerId)){fingers.set(e.pointerId,dirAt(e.clientX,e.clientY));paint();}});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,e=>{fingers.delete(e.pointerId);paint();});
 const keys=new Set();const KM={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
 addEventListener('keydown',e=>{if(KM[e.code]&&!pad.hidden){keys.add(KM[e.code]);e.preventDefault();}});addEventListener('keyup',e=>{keys.delete(KM[e.code]);});
 const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 let pend=null;
 card.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b||!pend)return;const f=pend;pend=null;card.hidden=true;dim.hidden=true;f(b.dataset.c);});
 todo.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)H.todo?.(b.dataset.t);});
 x.addEventListener('click',()=>H.quit?.());
 return {
  on(h){H=h;},
  pill(t){pill.innerHTML=t;},
  chip(t){chip.hidden=!t;if(t)chip.innerHTML=t;},
  hint(t){hint.hidden=!t;if(t)hint.textContent=t;},
  quit(on){x.hidden=!on;},
  /** b = {ic,label,sub,tone:'green'|'cut',dim,half,ring} 또는 null */
  bar(b){bar.hidden=!b;if(!b)return;bar.className='h h-bar'+(b.tone?' '+b.tone:'')+(b.half?' half':'')+(bar.classList.contains('on')?' on':'');
   if(b.dim)bar.dataset.dim='';else delete bar.dataset.dim;
   const html=`<span style="font-size:32px">${b.ic}</span><span class="lt"><b>${esc(b.label)}</b>${b.sub?`<small>${esc(b.sub)}</small>`:''}</span>${b.ring!=null?`<i class="tm"><i style="width:${(b.ring*100).toFixed(1)}%"></i></i>`:''}`;if(bar.innerHTML!==html)bar.innerHTML=html;},
  pad(on){pad.hidden=!on;if(!on)fingers.clear(),paint();},
  padDir(){let dx=0,dz=0;for(const d of [...fingers.values(),...keys]){if(!d)continue;dx+=D[d][0];dz+=D[d][1];}return [Math.sign(dx),Math.sign(dz)];},
  walk(on,todos=[]){joy.hidden=run.hidden=!on;todo.hidden=!on;todo.innerHTML=todos.map(t=>`<button data-t="${t.id}" class="${t.main?'main':''}">${esc(t.label)}</button>`).join('');},
  toast(t,sec=2.4){toastEl.textContent=t;toastEl.hidden=false;toastEl.style.opacity=1;toastT=sec;},
  tick(dt){if(toastT>0){toastT-=dt;if(toastT<.25)toastEl.style.opacity=Math.max(0,toastT/.25);if(toastT<=0)toastEl.hidden=true;}},
  card(html){card.innerHTML=html;card.hidden=false;dim.hidden=false;return new Promise(r=>{pend=r;});},
  get cardOpen(){return !card.hidden;},
 };
})();
/** 결과 카드 공용 모양(claw-hud.js showResult 흉내): kind win|near|miss */
function resultCard({kind,title,big,band,lines=[],pity='',carry=''}){
 const again=G.coins>=1?`<button class="btn${kind==='win'&&carry?'':' red'}" data-c="again">🪙 한 판 더 · 1</button>`:'';
 return `${kind==='win'?`<div class="band" style="--rc:${band?.color??'#e5a832'}">${esc(band?.label??'')}</div>`:''}${big?`<div class="big">${big}</div>`:''}<h3>${esc(title)}</h3>${lines.map(l=>`<p>${l}</p>`).join('')}
${pity?`<div class="pity">${esc(pity)}</div>`:''}
<div class="row">${kind==='win'&&carry?`<button class="btn red" data-c="carry">${esc(carry)}</button>`:''}${kind==='win'?'<button class="btn" data-c="dex">🧸 도감 보기</button>':''}${again}<button class="btn" data-c="stop">그만</button></div>${G.coins<1?'<p class="sub">코인을 다 썼어요. 내일 0시에 또 받아요</p>':''}`;
}
function rulesCard({icon,name,sub,level,lines,pity,prizes,first}){
 return `<div class="head"><span>${icon} ${esc(name)} · ${esc(sub)}</span>${first?'':'<button class="btn" data-c="close" style="flex:none;min-height:36px">✕</button>'}</div>
<p class="lv">어려움 ${'●'.repeat(level)}${'○'.repeat(Math.max(3,level)-level)}</p><ol>${lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ol>
${pity?`<div class="pity">${esc(pity)}</div>`:''}<div class="prz">${prizes.map(p=>`<span><em>${p.em}</em>${esc(p.name)}</span>`).join('')}</div>
<p class="sub">코인은 매일 0시(서울)에 무료로 30개가 돼요. 사는 곳·바꾸는 곳은 없어요.</p>
${first?'<div class="row"><button class="btn red" data-c="go">🪙 시작하기 · 1</button></div>':''}`;
}
/** 구경 화면: 내 판이 보낸 act를 0.15초 늦게 받음(네트워크 흉내). draw(ctx,w,h,act,history,t) */
function makeSpect(canvas,draw){
 const ctx=canvas.getContext('2d'),q=[],hist=[];let act={};
 return {send(a){q.push({at:now()+150,a:{...a}});},
  frame(t){while(q.length&&q[0].at<=t){act=q.shift().a;hist.push(act);if(hist.length>60)hist.shift();}draw(ctx,canvas.width,canvas.height,act,hist,t);},
  reset(){hist.length=0;act={};}};
}
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
