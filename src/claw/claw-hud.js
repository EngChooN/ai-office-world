// 온라인 인형뽑기 화면(월드개발, 2026-11-23). 월드디자인 설계 v1(자리·크기)·v3(기계 3종 단추·규칙 카드·한 줄 안내) 그대로, 공통 틀 src/ui-frame.js 위에 얹는다.
//  - 조작 큰 단추: 집게 「뽑기」 · 타이머 「▶ 시작」(초록)→「✋ 멈춤」 · 열쇠 「→ 누르고 있기」→「↑ 누르고 있기」. 누름은 pointerdown(event.timeStamp)으로 바로 넘김(click을 기다리지 않음)
//  - 집게만: 십자 단추·⏱·「👁 옆에서」(작은 단추 s1). 기계마다 처음 한 판 전에 규칙 카드(코인은 「시작하기」를 눌러야 씀), 할 일 칩 「ⓘ 규칙」
//  - 위 왼쪽 상태 알약: 걷기 「인형가게 1서버 · 👥 3 · 🪙 10」 / 조작 「숲속 기계 · 🪙 9」 → 누르면 ☰ 설정(서버·사람)
//  - 위 오른쪽: 🧸 도감 · 💬 · ☰ / 조작 중에는 ⏱ 남은 시간 칩 · ✕ 그만두기(💬·☰ 숨김)
//  - 오른쪽 아래: 걷기 = 큰 단추 달리기, 기계 앞 = 큰 단추 「한 판」 + 할 일 칩(「🕹 ○○ 기계 한 판 · 🪙1」, 「ⓘ 확률」) / 조작 = 큰 단추 「뽑기」(남은 시간 고리)
//  - 왼쪽 아래(조작 중만): 십자 단추 4개(누르고 있기, 옆 단추로 밀면 방향 바뀜, 두 손가락 대각선). 걷기 조이스틱 자리를 대신함
//  - 알림(z 50, 위 단추 줄 아래)·결과 카드·코인 없음·그만두기 확인·확률 안내(z 55, 무거운 창) — HUD에 가려지지 않게(설계 §4)
//  - ☰ 탭: 기계 · 도감 · 코인 · 소리 · 설정
// main.js와는 act 콜백과 update(view)로만 만난다. 그림(인형 작은 그림)은 thumb(id) → 그림 주소.
import './claw-hud.css';
import '../ui-frame.css';
import '../icons/icons.css';
import {icon,iconText} from '../icons/icon.js';
import {createUiFrame,ufPlace,openWin,closeWin,onWin} from '../ui-frame.js';
import {clawStatusView} from './claw-multi.js';
import {RARITY,RARITY_ORDER,MACHINES} from './claw-palette.js';
import {CLAW_TUNING,rulesFor,KIND_INFO,PITY_NAME,timerDiffText,keyMissText,grantedToday,msToNextGrant,leftText,pityLeft,dexCount} from './claw-rules.js';
document.documentElement.dataset.icExp='claw';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars=r=>'★'.repeat(RARITY[r]?.stars??1);
// 받침에 맞는 조사(이/가, 을/를)
const josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1);return c>=0xac00&&c<=0xd7a3&&(c-0xac00)%28?a:b;};
const DIRS=Object.freeze({left:{x:-1,z:0},right:{x:1,z:0},up:{x:0,z:-1},down:{x:0,z:1}});
// 아이콘 이름(그림이 아직 없으면 글자, 아이콘-규칙 대체 방식)
const IC={dex:['k-dex','🧸'],coin:['k-coin','🪙'],timer:['k-timer','⏱'],claw:['k-claw','🕹'],odds:['k-odds','ⓘ'],run:['x-run','🏃'],machine:['k-machine','🕹'],start:['k-start','▶'],stop:['k-stop','✋'],key:['k-key','🔑'],right:['k-right','→'],up:['k-up','↑'],side:['k-side','👁'],wait:['c-wait','⏳']};
const ic=(k,size='s')=>icon(IC[k][0],{size,fallback:IC[k][1]});
const ict=(k,text,o={})=>iconText(IC[k][0],text,{size:'s',fallback:IC[k][1],...o});

/**
 * catalog: 도감 칸 목록(clawCatalog), pools: 기계별 인형 id(손님 자리 바꾼 것), state(): 저장값, thumb(id) → 그림 주소(없으면 '')
 * act: {play(i), press(), quit(), goMachine(i), sound(on), servers(), retry(), mute(id), unmute(id), report(id), run(on), hub()}
 */
export function createClawHud({doc=document,win=window,mobile=false,catalog,pools,state,thumb=()=>'',multi,act={}}){
 const T=CLAW_TUNING,root=doc.createElement('div');root.className='kh';root.classList.toggle('touch',mobile);
 root.innerHTML=`
<button type="button" class="kh-pill" data-k="pill" aria-haspopup="dialog"><em aria-hidden="true">${icon('c-person',{size:'s'})}</em><span class="kh-pill-t">혼자 뽑기</span><span class="kh-coins">${ic('coin','xs')}<b data-coins>0</b></span></button>
<div class="kh-acts"></div>
<div class="kh-pad" hidden role="group" aria-label="집게 움직이기">
 <button type="button" class="kh-dir" data-dir="up" aria-label="집게 안쪽으로"><i aria-hidden="true">▲</i><small>안</small><kbd>W</kbd></button>
 <button type="button" class="kh-dir" data-dir="left" aria-label="집게 왼쪽으로"><i aria-hidden="true">◀</i><kbd>A</kbd></button>
 <span class="kh-mid" aria-hidden="true"></span>
 <button type="button" class="kh-dir" data-dir="right" aria-label="집게 오른쪽으로"><i aria-hidden="true">▶</i><kbd>D</kbd></button>
 <button type="button" class="kh-dir" data-dir="down" aria-label="집게 바깥쪽으로"><i aria-hidden="true">▼</i><small>밖</small><kbd>S</kbd></button>
</div>
<div class="kh-toast" role="status" hidden></div>
<div class="kh-hint" role="note" hidden></div>
<section class="kh-card" hidden role="dialog" aria-modal="true"></section>`;
 doc.body.appendChild(root);
 const $=s=>root.querySelector(s);
 const pill=$('.kh-pill'),acts=$('.kh-acts'),pad=$('.kh-pad'),toastEl=$('.kh-toast'),card=$('.kh-card'),hint=$('.kh-hint');
 let frame=null;
 frame=createUiFrame({doc,win,exp:'claw',
  extra:[{id:'dex',ic:IC.dex[0],fb:IC.dex[1],label:'도감',onClick:()=>frame.toggle('dex')}],
  tabs:[
   {id:'machines',label:'기계',ic:IC.machine[0],fb:IC.machine[1],onOpen:p=>renderMachines(p)},
   {id:'dex',label:'도감',ic:IC.dex[0],fb:IC.dex[1],onOpen:p=>renderDex(p)},
   {id:'coin',label:'코인',ic:IC.coin[0],fb:IC.coin[1],onOpen:p=>renderCoin(p)},
   {id:'sound',label:'소리',ic:'c-sound',onOpen:p=>renderSound(p)},
   {id:'set',label:'설정',ic:'c-settings',onOpen:p=>renderSet(p)},
  ]});
 pill.classList.add('uf-pill');
 // 조작 중 위 오른쪽: ⏱ 칩 + ✕(💬·☰·🧸 자리는 CSS가 숨김)
 const timer=doc.createElement('div');timer.className='kh-timer';timer.hidden=true;timer.setAttribute('role','timer');timer.innerHTML=`${ic('timer','s')}<b data-t>20</b>`;
 const quitBtn=doc.createElement('button');quitBtn.type='button';quitBtn.className='uf-rb kh-quit';quitBtn.hidden=true;quitBtn.setAttribute('aria-label','그만두기');quitBtn.innerHTML=icon('c-close',{size:'m',fallback:'✕'});
 frame.root.prepend(timer);frame.root.insertBefore(quitBtn,frame.menuBtn);
 quitBtn.addEventListener('click',()=>confirmQuit());
 pill.addEventListener('click',()=>frame.toggle('set'));

 // ── 알림(한 번에 하나, 뒤의 것은 줄 서서 1.5초 간격 이상)
 const queue=[];let toastT=0,toastGap=0;
 function toast(text,{sec=2.6,icn=null,urgent=false}={}){if(urgent){queue.length=0;toastT=0;toastGap=0;}queue.push({text,sec,icn});}
 function tickToast(dt){
  if(toastT>0){toastT-=dt;if(toastT<=.25)toastEl.classList.add('out');if(toastT<=0){toastEl.hidden=true;toastGap=.3;}return;}
  if(toastGap>0){toastGap-=dt;return;}
  const n=queue.shift();if(!n)return;
  toastEl.innerHTML=n.icn?iconText(n.icn[0],n.text,{size:'xs',fallback:n.icn[1]}):esc(n.text);toastEl.hidden=false;toastEl.classList.remove('out');toastT=Math.max(1.5,n.sec);
 }

 // ── 십자 단추: 손가락마다 지금 올라가 있는 단추 방향. 옆 단추로 밀면 바뀌고, 단추 밖이면 멈춤
 const fingers=new Map();
 const dirAt=(x,y)=>{const el=doc.elementFromPoint(x,y)?.closest?.('.kh-dir');return el&&pad.contains(el)?el.dataset.dir:null;};
 function paintPad(){const on=new Set(fingers.values());for(const b of pad.querySelectorAll('.kh-dir'))b.classList.toggle('on',on.has(b.dataset.dir)||keyDirs.has(b.dataset.dir));}
 pad.addEventListener('pointerdown',e=>{if(pad.dataset.lock)return;const d=dirAt(e.clientX,e.clientY);if(!d)return;e.preventDefault();try{pad.setPointerCapture(e.pointerId);}catch{}fingers.set(e.pointerId,d);paintPad();});
 pad.addEventListener('pointermove',e=>{if(!fingers.has(e.pointerId))return;const d=dirAt(e.clientX,e.clientY);if(d)fingers.set(e.pointerId,d);else fingers.set(e.pointerId,null);paintPad();});
 const lift=e=>{if(fingers.delete(e.pointerId))paintPad();};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,lift);
 pad.addEventListener('contextmenu',e=>e.preventDefault());
 const keyDirs=new Set();
 /** 지금 누르고 있는 방향 합({x,z}, 키 포함) */
 function padDir(){let x=0,z=0;for(const d of [...fingers.values(),...keyDirs]){if(!d)continue;x+=DIRS[d].x;z+=DIRS[d].z;}return {x:Math.sign(x),z:Math.sign(z)};}
 function setKeyDir(d,on){if(on)keyDirs.add(d);else keyDirs.delete(d);paintPad();}
 function clearPad(){fingers.clear();keyDirs.clear();paintPad();}

 // ── 행동 단추(오른쪽 아래). big = 큰 단추 {id,ic,fb,label,short,key,dim,ring,hold,tone}, todo = 할 일 칩, small = 작은 단추(s1)
 //  hold:true면 pointerdown/up으로 바로 넘김(타이머 시각·열쇠 누르고 있기). 누르는 동안 글이 바뀌어도 단추를 새로 만들지 않게(손가락 잡기가 풀리지 않게) 같은 단추면 안만 고침
 let actSig='';
 function setActions(big,todo=[],small=[]){
  const sig=JSON.stringify([big&&[big.id,big.label,big.dim,big.ring,big.hold,big.tone],todo.map(t=>[t.id,t.label,t.dim]),small.map(t=>[t.id,t.label])]);if(sig===actSig)return;actSig=sig;
  const old=acts.querySelector('.kh-big');
  const bigHTML=big?`<em aria-hidden="true">${icon(big.ic,{size:'l',fallback:big.fb})}</em><span>${esc(big.label)}</span>${big.key&&!mobile?`<kbd>${esc(big.key)}</kbd>`:''}${big.ring?'<svg class="kh-ringsvg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47"/></svg>':''}`:'';
  const keep=old&&big&&old.dataset.act===big.id&&old.hasPointerCapture?.(heldPointer);
  for(const e of [...acts.children])if(e!==(keep?old:null))e.remove();
  let b=keep?old:null;
  if(big){if(!b){b=doc.createElement('button');b.type='button';acts.prepend(b);}
   b.className=`kh-big${big.ring?' kh-ring':''}${big.tone?' kh-'+big.tone:''}`;b.dataset.act=big.id;b.toggleAttribute('data-hold',!!big.hold);b.toggleAttribute('data-dim',!!big.dim);b.setAttribute('aria-disabled',String(!!big.dim));b.innerHTML=bigHTML;}
  acts.insertAdjacentHTML('beforeend',small.map(t=>`<button type="button" class="kh-small" data-act="${esc(t.id)}" aria-label="${esc(t.label)}"><em aria-hidden="true">${icon(t.ic,{size:'m',fallback:t.fb})}</em><span>${esc(t.label)}</span></button>`).join('')
   +todo.map(t=>`<button type="button" class="kh-todo" data-act="${esc(t.id)}"${t.dim?' data-dim="1" aria-disabled="true"':''}><em aria-hidden="true">${icon(t.ic,{size:'s',fallback:t.fb})}</em><span>${esc(t.label)}</span>${t.key&&!mobile?`<kbd>${esc(t.key)}</kbd>`:''}</button>`).join(''));
  const labels=new Map();if(b&&big.short)labels.set(b,big.short);for(const e of acts.querySelectorAll('.kh-small'))labels.set(e,e.querySelector('span').textContent);
  ufPlace(root,{big:b,small:[...acts.querySelectorAll('.kh-small')],todo:[...acts.querySelectorAll('.kh-todo')],labels});
 }
 let heldPointer=null;
 acts.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.dataset.dim||b.hasAttribute('data-hold'))return;doAct(b.dataset.act);});
 acts.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-hold]');if(!b||b.dataset.dim)return;e.preventDefault();heldPointer=e.pointerId;try{b.setPointerCapture(e.pointerId);}catch{}b.classList.add('on');act.bigDown?.(e.timeStamp);});
 const holdEnd=e=>{if(e.pointerId!==heldPointer)return;heldPointer=null;acts.querySelector('.kh-big')?.classList.remove('on');act.bigUp?.(e.timeStamp);};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])acts.addEventListener(ev,holdEnd,true);
 acts.addEventListener('contextmenu',e=>{if(e.target.closest('[data-hold]'))e.preventDefault();});
 function doAct(id){
  if(id==='play')act.play?.();else if(id==='press')act.bigDown?.(performance.now());else if(id==='rules')showRules(nearMachine);else if(id==='run')act.run?.();else if(id==='side')act.side?.();
 }

 // ── 카드(결과·코인 없음·그만두기·확률) — 무거운 창 하나
 let cardKind=null;
 function openCard(kind,html,label){cardKind=kind;card.innerHTML=html;card.hidden=false;card.dataset.kind=kind;card.setAttribute('aria-label',label);openWin('claw-card',{doc,win});
  queueMicrotask(()=>card.querySelector('[data-main]')?.focus({preventScroll:true}));}
 function closeCard(){if(!cardKind)return;cardKind=null;card.hidden=true;card.innerHTML='';closeWin('claw-card',{doc,win});}
 onWin('claw-card',()=>{if(cardKind&&cardKind!=='result')closeCard();},{win});
 card.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const c=b.dataset.c;
  if(c==='again'){closeCard();act.again?.();}
  else if(c==='stop'){closeCard();act.stop?.();}
  else if(c==='dex'){const was=cardKind;closeCard();if(was==='result')act.stop?.();frame.open('dex');}
  else if(c==='close'){closeCard();}
  else if(c==='quit'){closeCard();act.quit?.();}
  else if(c==='keep'){closeCard();}
  else if(c==='go'){const i=+b.dataset.m;closeCard();act.confirmStart?.(i);}});
 const plushImg=(id,size=120,sil=false)=>{const u=thumb(id);return u?`<img class="kh-img${sil?' sil':''}" src="${esc(u)}" width="${size}" height="${size}" alt="">`:`<span class="kh-img kh-noimg" style="width:${size}px;height:${size}px">${sil?'?':'🧸'}</span>`;};
 const infoOf=id=>catalog.find(c=>c.id===id);
 function showResult({res,machine,kind,isNew,count,fails,coins}){
  const M=MACHINES[machine],again=`<button type="button" class="kh-btn kh-red" data-c="again" data-main>${ict('coin',`한 판 더 · ${T.coin.cost}`)}</button>`;
  const noMore=coins<T.coin.cost,left=pityLeft({pity:{[M.id]:fails}},M.id);
  const pityLine=left===null?'':left<=0?`다음 판은 ${PITY_NAME[kind]}!`:`${PITY_NAME[kind]}까지 ${left}번`;
  const detail=kind==='timer'&&res.shown?`<p class="kh-num" data-num>${esc(res.shown)}</p><p>${esc(timerDiffText(res.diff??0))}</p>`:kind==='key'&&res.key&&res.kind!=='win'?`<p>${esc(keyMissText(res.key))}</p>`:'';
  if(res.kind==='win'){const p=infoOf(res.id),R=RARITY[p?.rarity]??RARITY.common;
   openCard('result',`<div class="kh-band" style="--rc:${R.color}"><b>${stars(p?.rarity)} ${esc(R.label)}</b></div>
<div class="kh-win">${plushImg(res.id,120)}<h2>${esc(p?.name??'인형')}</h2>${kind==='timer'&&res.shown?`<p class="kh-num ok" data-num>${esc(res.shown)}</p>`:''}<p class="kh-new">${isNew?'새 인형! 도감에 넣었어요':`${count}개째예요`}${res.more?` · 하나 더 떨어졌어요(${res.more})`:''}</p></div>
<div class="kh-row"><button type="button" class="kh-btn" data-c="dex">${ict('dex','도감 보기')}</button>${noMore?'':again}<button type="button" class="kh-btn" data-c="stop"${noMore?' data-main':''}>그만</button></div>`,'뽑기 성공');}
  else{const near=res.kind==='near';
   const title=kind==='timer'?(near?'아까워요! 거의 맞았어요':'아쉬워요'):kind==='key'?(near?'아까워요! 구멍 가장자리예요':'아쉬워요, 안 열렸어요'):(near?'아까워요! 들었다 놓쳤어요':'못 잡았어요');
   const why=kind==='claw'?(near?'조금만 더 꽉 잡았으면…':'「👁 옆에서」로 보고 앞뒤를 맞춰 보세요'):'';
   openCard('result',`<div class="kh-lose"><h2>${esc(title)}</h2>${detail}${why?`<p>${esc(why)}</p>`:''}${pityLine?`<p class="kh-pity">${esc(pityLine)} · ${esc(M?.name??'')}</p>`:''}</div>
<div class="kh-row">${noMore?'':again}<button type="button" class="kh-btn" data-c="stop"${noMore?' data-main':''}>그만</button></div>${noMore?'<p class="kh-sub">코인을 다 썼어요. 내일 0시에 또 받아요</p>':''}`,near?'아까움':'실패');}
 }
 function showNoCoin(){
  openCard('nocoin',`<div class="kh-lose"><h2>${ict('coin','코인이 없어요')}</h2><p>내일 0시에 ${T.coin.daily}개를 또 받아요 · ${esc(leftText(msToNextGrant()))} 남음</p><p class="kh-sub">코인은 사는 곳이 없어요. 매일 무료로만 받아요.</p></div>
<div class="kh-row"><button type="button" class="kh-btn" data-c="dex">${ict('dex','도감 보기')}</button><button type="button" class="kh-btn kh-red" data-c="close" data-main>닫기</button></div>`,'코인 없음');
 }
 function confirmQuit(){
  openCard('quit',`<div class="kh-lose"><h2>그만둘까요?</h2><p>넣은 코인은 돌려받지 못해요</p></div>
<div class="kh-row"><button type="button" class="kh-btn" data-c="quit">그만두기</button><button type="button" class="kh-btn kh-red" data-c="keep" data-main>계속하기</button></div>`,'그만두기 확인');
 }
 // 규칙 안내(ⓘ) · 처음 규칙 카드(first: 그 기계 첫 판 전, 「시작하기」를 눌러야 코인을 씀). 글은 조절값에서 만든다(claw-rules.js rulesFor)
 function showRules(i,{first=false}={}){
  if(!(i>=0))i=0;const M=MACHINES[i],o=rulesFor(M.id,pools[i]??M.pool,T,id=>infoOf(id)?.name??id,id=>infoOf(id)?.rarity??'common'),s=state(),K=KIND_INFO[o.kind],left=pityLeft(s,M.id);
  openCard('rules',`<header class="kh-head"><b>${esc(K.icon)} ${esc(M.name)} · ${esc(K.short)}</b><button type="button" class="kh-x" data-c="close" aria-label="닫기">${icon('c-close',{size:'s',fallback:'✕'})}</button></header>
<p class="kh-level" aria-label="어려움 ${K.level}/3">어려움 ${'●'.repeat(K.level)}${'○'.repeat(3-K.level)}</p>
<ol class="kh-rules">${o.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ol>
${o.pity?`<p class="kh-rule">${esc(o.pity)}${left!==null?` · 지금 ${left<=0?'다음 판 도움':`${left}번 남음`}`:''}</p>`:''}
<div class="kh-prizes">${o.rows.map(r=>`<span>${plushImg(r.id,32,!s.dex[r.id])}<i class="kh-dot" style="--rc:${RARITY[r.rarity].color}"></i>${esc(r.name)}</span>`).join('')}</div>
<p class="kh-sub">${esc(o.note)}</p>
${first?`<div class="kh-row"><button type="button" class="kh-btn kh-red" data-c="go" data-m="${i}" data-main>${ict('coin',`시작하기 · ${T.coin.cost}`)}</button></div>`:''}`,first?'처음 규칙':'규칙 안내');
 }
 const showOdds=showRules;

 // ── ☰ 탭
 let dexMachine='all',dexDetail=null;
 function renderMachines(p){
  const s=state();
  p.innerHTML=`<h2 class="kh-tab-h">${ict('machine','기계')}</h2><ul class="kh-mlist">${MACHINES.map((M,i)=>{const busy=view.busy?.[i];const pool=[...new Set(pools[i]??M.pool)];
   const K=KIND_INFO[M.kind??'claw'];
   return `<li style="--mc:${M.body}"><div class="kh-mname"><b>${esc(K.icon)} ${esc(M.name)} <span class="kh-dots" aria-label="어려움 ${K.level}/3">${'●'.repeat(K.level)}${'○'.repeat(3-K.level)}</span></b><small>${esc(M.sub??K.short)} · 🪙${T.coin.cost}${busy?` · ${esc(busy)} 뽑는 중`:''}</small><span class="kh-mpool">${pool.map(id=>plushImg(id,28,!s.dex[id])).join('')}</span></div>
<div class="kh-mbtn"><button type="button" class="kh-btn kh-go" data-go="${i}">${busy?'기다리기':'가기'}</button><button type="button" class="kh-btn kh-mini" data-odds="${i}" aria-label="${esc(M.name)} 규칙">${ic('odds','s')}</button></div></li>`;}).join('')}</ul>
<p class="kh-sub">「가기」를 누르면 그 기계 앞으로 바로 가요.</p>`;
  p.onclick=e=>{const g=e.target.closest('[data-go]'),o=e.target.closest('[data-odds]');if(g){frame.close();act.goMachine?.(+g.dataset.go);}else if(o){frame.close();showRules(+o.dataset.odds);}};
 }
 function renderDex(p){
  const s=state(),list=catalog.filter(c=>dexMachine==='all'||(pools[MACHINES.findIndex(m=>m.id===dexMachine)]??[]).includes(c.id));
  if(dexDetail){const c=catalog.find(x=>x.id===dexDetail),d=s.dex[dexDetail],R=RARITY[c?.rarity]??RARITY.common,mi=MACHINES.findIndex(m=>(pools[MACHINES.indexOf(m)]??m.pool).includes(dexDetail));
   p.innerHTML=`<button type="button" class="kh-btn kh-mini kh-back" data-back>${icon('c-back',{size:'s',fallback:'←'})} 도감</button>
<div class="kh-detail">${plushImg(dexDetail,160,!d)}<h2>${d?esc(c?.name):'아직 못 뽑은 인형'}</h2><p class="kh-band" style="--rc:${R.color}"><b>${stars(c?.rarity)} ${esc(R.label)}</b></p>
<dl><dt>나오는 기계</dt><dd>${esc(MACHINES[mi]?.name??'-')}</dd><dt>처음 뽑은 날</dt><dd>${d?.first?esc(d.first):'-'}</dd><dt>모은 수</dt><dd>${d?d.n:0}개</dd></dl>
${mi>=0?`<button type="button" class="kh-btn kh-go" data-go="${mi}">기계로 가기</button>`:''}</div>`;}
  else p.innerHTML=`<h2 class="kh-tab-h">${ict('dex','도감')} <span class="kh-count">${dexCount(s,catalog)} / ${catalog.length}</span></h2>
<div class="kh-chips" role="group" aria-label="기계별로 보기">${[['all','전체'],...MACHINES.map(m=>[m.id,m.name])].map(([id,n])=>`<button type="button" class="kh-chip" data-mf="${id}" aria-pressed="${dexMachine===id}">${esc(n)}</button>`).join('')}</div>
<div class="kh-grid">${list.map(c=>{const d=s.dex[c.id],R=RARITY[c.rarity];return `<button type="button" class="kh-cell${d?'':' none'}" data-id="${esc(c.id)}" style="--rc:${R.color}" aria-label="${esc(d?c.name:'못 뽑은 인형')}">${plushImg(c.id,72,!d)}<span>${esc(d?c.name:'?')}</span>${d&&d.n>1?`<b>×${d.n}</b>`:''}</button>`;}).join('')}</div>`;
  p.onclick=e=>{const mf=e.target.closest('[data-mf]'),cell=e.target.closest('[data-id]'),back=e.target.closest('[data-back]'),go=e.target.closest('[data-go]');
   if(mf){dexMachine=mf.dataset.mf;renderDex(p);}else if(cell){dexDetail=cell.dataset.id;renderDex(p);}else if(back){dexDetail=null;renderDex(p);}else if(go){dexDetail=null;frame.close();act.goMachine?.(+go.dataset.go);}};
 }
 function renderCoin(p){
  const s=state(),got=grantedToday(s);
  p.innerHTML=`<h2 class="kh-tab-h">${ict('coin','코인')}</h2><div class="kh-coinbig">${ic('coin','xl')}<b>${s.coins}</b><span>/ 최대 ${T.coin.cap}</span></div>
<p class="kh-today">${got?`${icon('c-check',{size:'s'})} 오늘 받음`:'오늘 코인을 아직 안 받았어요'} · 다음 지급까지 ${esc(leftText(msToNextGrant()))}</p>
<p class="kh-sub">매일 0시(서울)에 ${T.coin.daily}개를 무료로 받아요. 한 판에 ${T.coin.cost}개. 코인은 사는 곳·바꾸는 곳이 없어요.</p>
<h3 class="kh-h3">최근 기록</h3><ul class="kh-log">${s.log.length?[...s.log].reverse().map(r=>`<li><span>${esc(r.text)}</span>${r.d?`<b class="${r.d>0?'up':'down'}">${r.d>0?'+':''}${r.d}</b>`:''}</li>`).join(''):'<li class="kh-sub">아직 기록이 없어요</li>'}</ul>`;
 }
 let muted=false;
 function renderSound(p){
  p.innerHTML=`<h2 class="kh-tab-h">${iconText('c-sound','소리')}</h2><div class="kh-row"><button type="button" class="kh-btn" data-snd aria-pressed="${!muted}">${iconText('c-sound',muted?'소리 꺼짐':'소리 켜짐',{off:muted})}</button></div><p class="kh-sub">세 체험이 같이 쓰는 소리 설정이에요. 끄면 진동도 꺼져요.</p>`;
  p.onclick=e=>{if(e.target.closest('[data-snd]')){muted=!muted;act.sound?.(!muted);renderSound(p);}};
 }
 function renderSet(p){
  const v=clawStatusView(status),people=multi?.people?.()??[];
  p.innerHTML=`<h2 class="kh-tab-h">${iconText('c-settings','설정')}</h2>
<p class="kh-st" data-tone="${v.tone}">${icon(v.ic,{size:'s'})} ${esc(v.text)}${v.sub?`<small>${esc(v.sub)}</small>`:''}</p>
<div class="kh-row"><button type="button" class="kh-btn" data-s="servers">${iconText('c-server-list','서버 고르기')}</button>${status.state==='offline'?`<button type="button" class="kh-btn" data-s="retry">${iconText('c-net-retry','다시 연결')}</button>`:''}</div>
${people.length?`<h3 class="kh-h3">가게 손님 ${people.length}명</h3><ul class="kh-people">${people.map(o=>`<li><span>${esc(o.name)}${o.act?.m?` · ${esc(MACHINES[o.act.m-1]?.name??'')}`:''}</span><button type="button" class="kh-btn kh-mini" data-mute="${esc(o.id)}" aria-pressed="${o.muted}">${iconText('c-mute-person',o.muted?'음소거 풀기':'음소거')}</button><button type="button" class="kh-btn kh-mini" data-report="${esc(o.id)}">${iconText('c-report','신고')}</button></li>`).join('')}</ul><p class="kh-sub">음소거하면 그 손님의 모습·말이 내 화면에서 사라져요. 상대에게 알리지 않아요.</p>`:''}
<p class="kh-sub">코인·도감은 이 기기(브라우저)에 저장돼서 다음에 와도 이어져요.</p>
<div class="kh-row"><a class="kh-btn" href="../">${iconText('c-leave','허브로 나가기',{fallback:'🚪'})}</a></div>`;
  p.onclick=e=>{const b=e.target.closest('[data-s],[data-mute],[data-report]');if(!b)return;
   if(b.dataset.s==='servers'){frame.close();act.servers?.();}else if(b.dataset.s==='retry'){act.retry?.();}
   else if(b.dataset.mute){const id=b.dataset.mute;multi?.isMuted?.(id)?act.unmute?.(id):act.mute?.(id);renderSet(p);}
   else if(b.dataset.report){act.report?.(b.dataset.report);renderSet(p);}};
 }

 // ── 상태(연결)
 let status={state:'off'};
 win.addEventListener('claw:multi-status',e=>{const d=e.detail;if(!d)return;const was=status.state;status=d;
  if(d.joined&&d.state==='online'&&was!=='online')toast(d.transport==='local'?'내 컴퓨터 모드로 가게에 왔어요':`${clawStatusView(d).text.split(' · ')[0]}에 왔어요 · ${d.count}명`);
  else if(d.joined&&d.state==='offline'&&was&&was!=='offline'&&performance.now()-rejectAt>6000)toast('연결이 끊겼어요. 혼자 뽑기는 계속돼요'); // 옛 서버 거절 뒤 끊김 알림은 겹쳐 띄우지 않음
  if(frame.isOpen&&frame.tab==='set')renderSet(frame.panel('set'));
  if(d.joined&&d.state==='full')act.full?.();});
 win.addEventListener('claw:multi-leave',()=>{status={state:'off'};});
 let rejectAt=-Infinity;
 win.addEventListener('claw:multi-note',e=>{if(e.detail?.reject)rejectAt=performance.now();if(e.detail?.text)toast(e.detail.text,{sec:3.4});});

 // ── 매 프레임 화면(view = main.js가 만든 지금 상태)
 let view={},nearMachine=-1,pillSig='',modeSig='';
 // 한 줄 안내(설계 v3 §5): 조작 중 지금 할 일
 const HINT={claw:'옆에서 보면 집게가 앞뒤 어디 있는지 보여요',ready:'「▶ 시작」을 누르고, 숫자가 10.00일 때 「✋ 멈춤」',run:'10.00에 멈추세요!',
  k1:'누르고 있으면 열쇠가 오른쪽으로 가요. 원하는 칸에서 떼세요',gap:'잠깐만요…',k2:'이번엔 누르고 있으면 위로 가요. 구멍 높이에서 떼세요',drop:''};
 function update(dt,v){
  view=v;nearMachine=v.near;tickToast(dt);
  const mode=v.mode,kind=v.kind,playing=mode==='play'||mode==='drop';
  const ms=`${mode}|${kind}`;
  if(ms!==modeSig){modeSig=ms;const r=doc.documentElement;r.dataset.clawMode=mode;r.dataset.clawKind=playing?kind??'':'';
   pad.hidden=!(playing&&kind==='claw');timer.hidden=!(playing&&kind==='claw');quitBtn.hidden=mode!=='play';
   if(!playing)clearPad();if(playing&&frame.isOpen)frame.close();}
  quitBtn.hidden=mode!=='play';
  pad.toggleAttribute('data-lock',mode==='drop');if(mode==='drop'&&fingers.size)clearPad();
  // 알약
  const sv=clawStatusView(status),txt=mode==='play'||mode==='drop'||mode==='result'?(MACHINES[v.machine]?.name??'인형뽑기'):sv.text.replace(/^인형가게 /,'');
  const sig=`${sv.ic}|${txt}|${v.coins}`;
  if(sig!==pillSig){pillSig=sig;pill.dataset.tone=sv.tone;pill.querySelector('em').innerHTML=icon(sv.ic,{size:'s'});pill.querySelector('.kh-pill-t').innerHTML=esc(txt).replace('👥 ',icon('c-people',{size:'xs'})+' ');pill.querySelector('[data-coins]').textContent=v.coins;
   pill.setAttribute('aria-label',`${sv.text} · 코인 ${v.coins}개`);}
  if(playing&&kind==='claw'){const t=Math.ceil(v.timeLeft??0);const tb=timer.querySelector('[data-t]');if(tb.textContent!==String(t))tb.textContent=String(t);timer.classList.toggle('hurry',mode==='play'&&t<=5);}
  // 한 줄 안내
  const h=playing?(mode==='drop'?'':kind==='claw'?HINT.claw:HINT[(v.sub??'').replace('-hold','')]??''):'';
  if(hint.textContent!==h)hint.textContent=h;hint.hidden=!h||!!cardKind;
  // 행동 단추
  const sub=v.sub??'';
  if(playing){
   if(kind==='claw')setActions({id:'press',ic:IC.claw[0],fb:IC.claw[1],label:'뽑기',short:'뽑기',key:'Space',dim:mode==='drop'||!v.armed,ring:true,hold:true},mode==='play'?[{id:'side',ic:IC.side[0],fb:IC.side[1],label:v.side?'정면으로 보기':'옆에서 보기'}]:[]); // 👁는 할 일 칩 자리(오른쪽 위로 쌓임): 작은 단추 원 자리는 좁은 화면에서 십자 단추와 겹쳤다
   else if(kind==='timer'){const run=sub==='run';setActions({id:'press',ic:(run?IC.stop:IC.start)[0],fb:(run?IC.stop:IC.start)[1],label:run?'멈춤':'시작',short:run?'멈춤':'시작',key:'Space',dim:mode==='drop',hold:true,tone:run?'':'green'},[]);}
   else{const up=sub.startsWith('k2'),gap=sub==='gap';setActions({id:'press',ic:(up?IC.up:IC.right)[0],fb:(up?IC.up:IC.right)[1],label:gap?'잠깐':up?'위로':'오른쪽',short:gap?'잠깐':'누르고 있기',key:'Space',dim:mode==='drop'||gap,hold:true},[]);}
  }
  else if(mode==='result'||cardKind)setActions(null,[]);
  else if(v.near>=0){const M=MACHINES[v.near],busy=v.busy?.[v.near];
   setActions(busy?null:{id:'play',ic:IC.claw[0],fb:IC.claw[1],label:'한 판',short:'한 판',key:'E'},
    [busy?{id:'wait',ic:IC.wait[0],fb:IC.wait[1],label:`기다리기 · ${busy} 뽑는 중`,dim:true}:{id:'play',ic:IC.claw[0],fb:IC.claw[1],label:`${M.name} 한 판 · 🪙${T.coin.cost}`,key:'E'},{id:'rules',ic:IC.odds[0],fb:IC.odds[1],label:'규칙'}]);}
  else setActions({id:'run',ic:IC.run[0],fb:IC.run[1],label:v.running?'걷기':'달리기',short:v.running?'걷기':'달리기'},[]);
  const ring=acts.querySelector('.kh-ringsvg circle');if(ring){const k=Math.max(0,Math.min(1,(v.timeLeft??0)/T.claw.timeSec));ring.style.strokeDashoffset=String(295.3*(1-k));ring.parentNode.classList.toggle('hurry',(v.timeLeft??0)<=5&&mode==='play');}
  if(frame.isOpen&&frame.tab==='machines'&&v.busySig!==update.busySig){update.busySig=v.busySig;renderMachines(frame.panel('machines'));}
 }

 return {frame,update,toast,showResult,showNoCoin,showOdds,showRules,confirmQuit,closeCard,padDir,setKeyDir,clearPad,
  get card(){return cardKind;},
  setMuted(on){muted=!!on;},
  refreshTab:()=>frame.refreshTab(),
  doTodo(){const b=acts.querySelector('.kh-todo:not([data-dim])')??acts.querySelector('.kh-big:not([data-dim])');if(b)doAct(b.dataset.act);},
 };
}
