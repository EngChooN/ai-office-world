// 사람 인사 칩·카드(2026-11-18 대표 승인, 시안 docs/인사창/인사창-전후-시안-v1.html, 표시 규칙은 월드디자인 보고).
// 가까운 사람은 아래 수첩 카드·큰 도장 대신 이름표 옆 작은 👋 칩으로만 알린다. 인사·같이 등산하기 기능과 서버 규칙은 그대로다.
//  - 칩: 4m 안·내 앞 좌우 70° 안이면 보이고 5.5m 밖이면 숨김. 가장 가까운 1명에게만. 걷는 중(직접·자동)은 흐리게.
//  - 카드: 칩을 누르거나(인사도 함께) 이름표를 누르거나, 2m 안에서 1초 멈춰 서 있으면 머리 위에 「인사 · 같이 등산하기 · ✕」.
//          5초 무입력·3m 밖·걷기 시작·✕이면 접힘. 접힌 뒤에는 움직이거나 2m 밖으로 갔다 와야 저절로 다시 펼친다.
//  - 동행 상대: 칩 없음. 둘 다 멈춘 뒤 2초 지나면 보임.
// 이 파일 윗부분(GREET·createGreetModel·placeGreet)은 화면을 모르는 순수 계산이라 시험(tests/greet-chip.test.mjs)에서 바로 부른다.
import {icon} from './icons/icon.js';

export const GREET=Object.freeze({show:4,cone:70*Math.PI/180,hide:5.5,openNear:2,openStill:1,closeIdle:5,closeFar:3,partnerStill:2,switchMargin:.5});

// 매 프레임 step({now(초), people:[{id,name,d,ang,partner,moving}], meMoving, busy}) → {mode:'none'|'chip'|'dim'|'open', id, name, d}
export function createGreetModel(rules=GREET){
 let target=null,open=false,armed=true,lastInput=0,stillSince=null,pairStillSince=null,now=0,last={mode:'none'},openD=0;
 const reset=()=>{target=null;open=false;armed=true;stillSince=null;pairStillSince=null;};
 function step({now:t=0,people=[],meMoving=false,busy=false}={}){
  now=t;
  if(busy){reset();return last={mode:'none'};}
  let cur=target?people.find(p=>p.id===target&&p.d<=rules.hide)??null:null;
  let best=null;for(const p of people)if(p.d<=rules.show&&p.ang<=rules.cone&&(!best||p.d<best.d))best=p;
  if(best&&(!cur||(best.id!==cur.id&&best.d<cur.d-rules.switchMargin)))cur=best;
  if(!cur){reset();return last={mode:'none'};}
  if(cur.id!==target){target=cur.id;open=false;armed=true;stillSince=null;pairStillSince=null;}
  // 동행 상대: 둘 다 멈춘 뒤 2초 지나야 보인다
  if(cur.partner){
   if(meMoving||cur.moving){pairStillSince=null;open=false;return last={mode:'none',id:cur.id};}
   pairStillSince??=t;if(t-pairStillSince<rules.partnerStill)return last={mode:'none',id:cur.id};
  }else pairStillSince=null;
  if(meMoving||cur.d>rules.openNear)armed=true;
  // 멀어지면 접힘: 3m 밖, 단 3m 밖에서 눌러 펼친 카드는 펼친 거리보다 0.5m 더 멀어질 때(11-20: 3~5.5m 칩·이름표를 누르면 펼치자마자 접혀 아무 일도 안 일어나던 결함)
  if(open&&(meMoving||cur.d>Math.max(rules.closeFar,openD+rules.switchMargin)||t-lastInput>=rules.closeIdle)){open=false;armed=false;}
  if(!open&&armed&&!meMoving&&cur.d<=rules.openNear){stillSince??=t;if(t-stillSince>=rules.openStill){open=true;openD=cur.d;lastInput=t;stillSince=null;}}
  else stillSince=null;
  return last={mode:open?'open':meMoving?'dim':'chip',id:cur.id,name:cur.name,d:cur.d,partner:!!cur.partner};
 }
 return {step,
  // 칩·이름표 누름: 걷는 중이면 펼치지 않는다(인사는 부른 쪽이 따로 한다)
  tap(meMoving=false){if(!target||meMoving||last.mode==='none')return false;open=true;openD=last.d??0;lastInput=now;return true;},
  touch(){if(open)lastInput=now;},
  close(){open=false;armed=false;},
  get target(){return target;},get open(){return open;},get last(){return last;},get lastInput(){return lastInput;}};
}

const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const area=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
// 자리 고르기. tag = 이름표 상자(화면 밖이면 null), size = {w,h}, avoid = 피할 HUD 상자들, view = {W,H}, prefer = 'above'|'side'.
// 칩: 이름표 오른쪽 → 왼쪽. 카드: (가로 휴대폰은 옆 먼저) 머리 위 → 오른쪽 옆 → 왼쪽 옆 → 머리 아래. 모두 안 되면 가장 덜 겹치는 자리.
export function placeGreet(kind,tag,size,{avoid=[],W,H,pad=8,gap=6,prefer='above'}={}){
 if(!tag)return null;
 const {w,h}=size,cy=tag.y+tag.h/2,cx=tag.x+tag.w/2;
 const right={x:tag.x+tag.w+gap,y:cy-h/2,side:'right'},left={x:tag.x-gap-w,y:cy-h/2,side:'left'};
 const opts=kind==='chip'?[right,left]
  :(()=>{const above={x:cx-w/2,y:tag.y-gap-h-4,side:'above'},below={x:cx-w/2,y:tag.y+tag.h+gap+4,side:'below'};
    const sideR={x:tag.x+tag.w+gap+4,y:cy-22,side:'right'},sideL={x:tag.x-gap-4-w,y:cy-22,side:'left'};
    return prefer==='side'?[sideR,sideL,above,below]:[above,sideR,sideL,below];})();
 const fit=o=>{const x=Math.max(pad,Math.min(W-pad-w,o.x)),y=Math.max(pad,Math.min(H-pad-h,o.y));return {...o,x,y,w,h,shifted:Math.abs(x-o.x)+Math.abs(y-o.y)};};
 let best=null;
 for(const o of opts){
  const f=fit(o);
  // 칩은 이름표 바로 옆이어야 하므로 화면 끝에 밀려 이름표와 겹치면 다음 후보
  if(kind==='chip'&&(f.shifted>2||hit(f,tag)))continue;
  const cover=avoid.reduce((s,a)=>s+area(f,a),0)+(hit(f,tag)?area(f,tag):0);
  if(!cover&&(kind==='chip'||f.shifted<w*.6))return f;
  const score=cover+f.shifted*4;if(!best||score<best.score)best={...f,score};
 }
 return best;
}

// ── 화면 ──
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 펼친 카드·칩이 피할 HUD(위 진행 카드·탭·연결 칩·채팅·사람 단추·아래 도장·꼬리표·시점 칩 등)
const AVOID='.nb-tag,.nb-card,.nb-tabs,.nb-dial,#auto,.nb-ctx,.nb-view,.me-chip,.hc-btn,.hc-panel,.pw-btn,.pw-chip,.pw-note,.pw-pick,.pw-offer,.pw-sheet,.multi-panel,#trail-hud,.trail-row,.trail-snack';

export function createGreetUI({doc=document,win=window,onGreet,onOffer,pairState=()=>({phase:'idle'})}){
 const model=createGreetModel();
 const chip=doc.createElement('button');chip.type='button';chip.className='gr-chip';chip.hidden=true;
 chip.innerHTML=`<i class="gr-ic" aria-hidden="true">${icon('c-wave',{size:'s'})}</i><span class="gr-name"></span><kbd>F</kbd>`;
 const card=doc.createElement('section');card.className='gr-card';card.hidden=true;card.setAttribute('role','dialog');
 card.innerHTML=`<b class="gr-tail" aria-hidden="true"></b><div class="gr-head"><span class="gr-who"><b></b><small></small></span><button type="button" class="gr-x" aria-label="닫기">${icon('c-close',{size:'s'})}</button></div>
  <div class="gr-row"><button type="button" class="gr-hello main">${icon('c-wave',{size:'s'})}<span>인사</span><kbd>F</kbd></button><button type="button" class="gr-pair">${icon('h-pair',{size:'s'})}<span>같이 등산하기</span></button></div><div class="gr-bar"><i></i></div>`;
 doc.body.append(chip,card);
 const nameEl=chip.querySelector('.gr-name'),whoB=card.querySelector('.gr-who b'),whoS=card.querySelector('.gr-who small'),pairBtn=card.querySelector('.gr-pair'),bar=card.querySelector('.gr-bar i'),tail=card.querySelector('.gr-tail');
 let meMoving=false,view={mode:'none'},sig='';
 chip.addEventListener('click',e=>{e.stopPropagation();chip.blur();const id=model.target;if(!id)return;model.tap(meMoving);onGreet?.(id);render();});
 card.addEventListener('pointerdown',()=>model.touch());
 card.addEventListener('click',e=>{
  e.stopPropagation();const b=e.target.closest('button');if(!b)return;b.blur();const id=model.target;
  if(b.classList.contains('gr-x')){model.close();render();return;}
  model.touch();
  if(b.classList.contains('gr-hello')&&id)onGreet?.(id);
  else if(b.classList.contains('gr-pair')&&id&&!b.disabled){onOffer?.(id);model.close();render();}
 });
 const landscape=()=>!!win.matchMedia?.('(orientation:landscape) and (max-height:540px)').matches;
 const rectOf=e=>{if(!e||e.hidden)return null;const r=e.getBoundingClientRect();if(!r.width||!r.height)return null;const cs=win.getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return null;return {x:r.left,y:r.top,w:r.width,h:r.height};};
 const avoidRects=()=>[...doc.querySelectorAll(AVOID)].map(rectOf).filter(Boolean);
 function pairLabel(id){
  const st=pairState()??{phase:'idle'};
  if(st.phase==='paired'&&st.partner?.id===id)return {label:'동행 중',off:true};
  if(st.offer?.id===id)return {label:st.phase==='incoming'?'제안 받음':'제안 중',off:true};
  return {label:'같이 등산하기',off:st.phase!=='idle'};
 }
 // tag = 이름표 상자(머리가 화면 밖이거나 이름표가 꺼져 있으면 null)
 function render(tag=lastTag){
  lastTag=tag;const v=view;
  if(v.mode==='none'){chip.hidden=card.hidden=true;sig='';delete doc.body.dataset.greet;return;}
  doc.body.dataset.greet=v.mode;
  const W=win.innerWidth,H=win.innerHeight,avoid=avoidRects();
  if(v.mode==='open'&&tag){
   chip.hidden=true;card.hidden=false;
   const s=`${v.id}|${v.name}|${Math.round(v.d)}|${pairLabel(v.id).label}`;
   if(s!==sig){sig=s;whoB.textContent=v.name;whoS.textContent=` · ${Math.round(v.d)}m`;const pl=pairLabel(v.id);pairBtn.disabled=pl.off;pairBtn.querySelector('span').textContent=pl.label;}
   const size={w:card.offsetWidth||236,h:card.offsetHeight||96},p=placeGreet('card',tag,size,{avoid,W,H,prefer:landscape()?'side':'above'});
   if(p){card.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`;card.dataset.side=p.side;
    tail.style.left=p.side==='above'||p.side==='below'?`${Math.round(Math.max(12,Math.min(size.w-24,tag.x+tag.w/2-p.x-7)))}px`:'';
    tail.style.top=p.side==='left'||p.side==='right'?`${Math.round(Math.max(10,Math.min(size.h-24,tag.y+tag.h/2-p.y-7)))}px`:'';}
   bar.style.transform=`scaleX(${Math.max(0,1-(lastNow-model.lastInput)/GREET.closeIdle).toFixed(3)})`;
   return;
  }
  // 칩(머리가 화면 밖이면 큰 도장 위 「👋 이름」)
  card.hidden=true;sig='';chip.hidden=false;chip.classList.toggle('dim',v.mode==='dim');
  const far=!tag;chip.classList.toggle('far',far);if(nameEl.textContent!==(far?v.name:''))nameEl.textContent=far?v.name:'';
  chip.setAttribute('aria-label',`${v.name}님에게 인사 (F)`);
  const size={w:chip.offsetWidth||40,h:chip.offsetHeight||36};
  let p=null;
  if(tag)p=placeGreet('chip',tag,size,{avoid:[],W,H});
  if(!p){const st=rectOf(doc.getElementById('auto')),ctx=rectOf(doc.querySelector('.nb-ctx'));
   const base=st?{x:st.x+st.w/2,y:Math.min(st.y,ctx&&ctx.x<st.x+st.w&&st.x<ctx.x+ctx.w?ctx.y:st.y)}:{x:W/2,y:H-120};
   p={x:Math.max(8,Math.min(W-8-size.w,base.x-size.w/2)),y:Math.max(8,base.y-10-size.h)};}
  chip.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`;
 }
 let lastTag=null,lastNow=0;
 return {
  // 매 프레임(multi-client update)
  update({now,people,moving,busy,tag}){meMoving=!!moving;lastNow=now;view=model.step({now,people,meMoving,busy});render(view.id?tag(view.id):null);return view;},
  // 이름표를 누름: 지금 칩 대상이면 카드를 펼치고 true(같이 등산하기 고르기 카드 대신)
  openFromTag(id){if(id!==model.target||view.mode==='none')return false;if(!model.tap(meMoving))return true;render();return true;},
  get target(){return view.mode==='none'?null:model.target;},get view(){return view;},model,
  dispose(){chip.remove();card.remove();delete doc.body.dataset.greet;}};
}
