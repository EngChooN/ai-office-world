// 눈썰매 화면(월드개발, 2026-11-16). 계산은 sled.js, 다른 사람 화면에는 위치 s(10Hz) + act.sl(썰매 상태)로 보인다.
// 체험설계 v1 §7-3: 출발대 3줄(한 줄에 한 썰매, 차 있으면 "앞 썰매가 출발하면 탈 수 있어요") → 🛷 타기 → 5초 동안 다른 사람이 「둘이 타기」를 청할 수 있음
//  (앞사람이 [같이 타요]를 눌러야 뒤에 앉음) → 5초 뒤 또는 「출발!」 → 3·2·1 → 좌우만 조종(A/D·←/→·조이스틱, 휴대폰 ◀ ▶) → 멈춤 구역에서 일어남 → 「한 번 더? ⬆ 언덕 위로」.
//  둘이 탈 때 앞사람만 조종, 뒷사람은 🙌 만세. 다른 썰매와 부딪힘 없음(서로 통과). 타는 동안 카메라는 썰매 뒤 낮게, 다른 화면 글은 흐리게.
// act.sl: 0 없음 · 1~3 출발대 줄에서 기다림 · 4 타는 중 · 5 뒷자리(sp = 앞사람 id). 줄이 겹치면 서버가 sled:busy로 나중 사람을 내린다.
import * as THREE from 'three';
import * as P from './props.js';
import {SLED_RUN,TARGETS} from './layout.js';
import {createRide,SLED_RULES} from './sled.js';
import {SLED_SEAT_Y} from './poses.js';
import {icon} from '../icons/icon.js';

export const SLED_TEXT=Object.freeze({busy:'앞 썰매가 출발하면 탈 수 있어요',asked:'같이 타자고 했어요. 앞사람이 수락하면 뒤에 앉아요',declined:'이번에는 혼자 탄대요',
 ask:n=>`${n}님이 같이 타고 싶어 해요`,offline:'연결이 돌아오면 다시 눌러 주세요',up:'언덕 위 출발대로 왔어요',bank:'푹! 눈 더미에 파묻혔어요',air:'와!',end:'도착! 한 번 더 탈까요?'});
const D=SLED_RUN.deck,LANES=D.lanes,LANE_W=D.w/LANES;
export const laneSpot=k=>({x:D.x+(k-(LANES+1)/2)*LANE_W,z:D.z+.15,heading:Math.PI});
const nearDeck=(x,z)=>Math.hypot(x-TARGETS.sledDeck.x,z-TARGETS.sledDeck.z)<TARGETS.sledDeck.r+.6;
const nearStop=(x,z)=>Math.hypot(x-SLED_RUN.stop.x,z-SLED_RUN.stop.z)<SLED_RUN.stop.r+2.5;
const fwd=h=>({x:-Math.sin(h),z:-Math.cos(h)});

// ctx: {doc,root,world,toon,heightAt,player,poser,multi,hud,audio,input,mobile,onChange()}
export function createSledPlay({doc=document,root,world,toon,heightAt,player,poser,net,multi,hud,audio,input,mobile=false,onChange=()=>{}}){
 const tz=toon.toonify;
 const S={mode:'none',lane:0,wait:0,count:0,ride:null,front:null,partner:null,asked:null,askT:0,cheer:false,steerBtn:0,lastCount:-1,evText:0};
 const mySled=P.buildSled(tz);mySled.visible=false;world.add(mySled);
 const remote=new Map(); // 다른 사람 id → 썰매 그룹
 // ── 화면: 좌우 단추·카운트다운·초대 카드
 const ui=doc.createElement('div');ui.className='xl';ui.innerHTML=`
<div class="xl-count" hidden aria-live="assertive"></div>
<div class="xl-steer" hidden><button type="button" class="xl-btn" data-steer="-1" aria-label="왼쪽으로" title="왼쪽으로">${icon('c-left',{size:'l'})}</button><button type="button" class="xl-btn" data-steer="1" aria-label="오른쪽으로" title="오른쪽으로">${icon('c-right',{size:'l'})}</button></div>
<section class="xl-ask" hidden role="dialog" aria-label="같이 타기"><p></p><div class="xh-row"><button type="button" class="xh-ok" data-l="ok">같이 타요</button><button type="button" class="xh-no" data-l="no">혼자 탈게요</button></div></section>`;
 root.appendChild(ui);
 const countEl=ui.querySelector('.xl-count'),steerEl=ui.querySelector('.xl-steer'),askEl=ui.querySelector('.xl-ask');
 for(const b of ui.querySelectorAll('[data-steer]')){const v=+b.dataset.steer;
  const on=e=>{e.preventDefault();S.steerBtn=v;b.classList.add('on');},off=()=>{if(S.steerBtn===v)S.steerBtn=0;b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);}
 askEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!S.asked)return;const id=S.asked;S.asked=null;askEl.hidden=true;
  if(b.dataset.l==='ok'){if(net.send({t:'sled:ok',to:id}))S.partner=id;}else net.send({t:'sled:no',to:id});});
 const others=()=>multi.joined?multi.people().filter(p=>!p.muted&&p.sample):[];
 const takenLanes=()=>new Set(others().filter(p=>p.act?.sl>=1&&p.act.sl<=3).map(p=>p.act.sl));
 function seat(){poser.setSit(true,SLED_SEAT_Y);}
 function unseat(){poser.setSit(false);poser.setArms('none');}
 function leave(msg){const was=S.mode;S.mode='none';S.ride=null;S.front=null;S.partner=null;S.cheer=false;S.lane=0;mySled.visible=false;unseat();countEl.hidden=true;steerEl.hidden=true;
  document.documentElement.classList.remove('xh-sledding');if(msg)hud?.say(msg,2.2);if(was!=='none')onChange();}
 function board(){
  const taken=takenLanes();let lane=0;
  // 내 자리에서 가까운 빈 줄
  const order=[1,2,3].sort((a,b)=>Math.hypot(laneSpot(a).x-player.x,laneSpot(a).z-player.z)-Math.hypot(laneSpot(b).x-player.x,laneSpot(b).z-player.z));
  for(const k of order)if(!taken.has(k)){lane=k;break;}
  if(!lane){hud?.say(SLED_TEXT.busy,2.4);return false;}
  const s=laneSpot(lane);S.mode='ready';S.lane=lane;S.wait=SLED_RULES.inviteMs/1000;S.count=0;S.partner=null;
  player.place(s.x,s.z,s.heading);seat();mySled.visible=true;onChange();return true;
 }
 function go(){if(S.mode!=='ready')return;S.mode='count';S.count=SLED_RULES.countdown;S.lastCount=-1;}
 function startRide(){S.mode='ride';S.ride=createRide({lane:S.lane,start:-1.5});countEl.hidden=true;steerEl.hidden=false;document.documentElement.classList.add('xh-sledding');onChange();}
 function askRide(){
  // 가장 가까운, 출발대에서 기다리는 썰매(혼자 탄 사람)
  let best=null;for(const p of others()){if(!(p.act?.sl>=1&&p.act.sl<=3))continue;if(others().some(q=>q.act?.sl===5&&q.act.sp===p.id))continue;const d=Math.hypot(p.sample.x-player.x,p.sample.z-player.z);if(d<3&&(!best||d<best.d))best={id:p.id,d};}
  if(!best)return false;if(!net.send({t:'sled:ask',to:best.id})){hud?.say(SLED_TEXT.offline);return false;}S.front=best.id;S.mode='asking';S.askT=SLED_RULES.inviteMs/1000+1;hud?.say(SLED_TEXT.asked,2.4);return true;
 }
 function up(){const s=laneSpot(2);player.place(s.x,s.z+1.6,Math.PI);hud?.say(SLED_TEXT.up,1.6);audio?.play('bank',{gain:.5});return true;}
 net.on(m=>{
  switch(m.t){
   case 'sled:busy':if(S.mode==='ready'||S.mode==='count')leave(SLED_TEXT.busy);return;
   case 'sled:ask':{if(multi.isMuted?.(m.id))return;if(S.mode!=='ready'||S.partner){net.send({t:'sled:no',to:m.id});return;}
    S.asked=m.id;askEl.querySelector('p').textContent=SLED_TEXT.ask(multi.nameOf(m.id));askEl.hidden=false;audio?.play('pop');return;}
   case 'sled:ok':if(S.mode==='asking'&&m.id===S.front){S.mode='back';seat();onChange();hud?.say('뒷자리에 앉았어요 · 만세를 눌러 보세요',2.4,'x-cheer');}return;
   case 'sled:no':if(S.mode==='asking'&&m.id===S.front){S.mode='none';S.front=null;hud?.say(SLED_TEXT.declined,2);}return;
  }
 });
 return {
  get mode(){return S.mode;},get riding(){return S.mode==='ride'||S.mode==='back'&&!!S.frontRiding;},get active(){return S.mode!=='none'&&S.mode!=='asking';},
  get ride(){return S.ride;},
  actFields(){const sl=S.mode==='ready'||S.mode==='count'?S.lane:S.mode==='ride'?4:S.mode==='back'?5:0;return {sl,sp:S.mode==='back'?S.front??'':'',...(sl===5?{wm:S.cheer?1:0}:{})};},
  actions(){
   switch(S.mode){
    case 'ready':return [{id:'sled:go',ic:'x-sled',label:`출발! ${Math.ceil(S.wait)}`,key:'E'},{id:'sled:off',ic:'c-leave',label:'내리기',key:'Q'}];
    case 'count':return [];
    case 'ride':return [];
    case 'back':return [{id:'sled:cheer',ic:'x-cheer',label:S.cheer?'만세 내리기':'만세',key:'E'},...(S.frontRiding?[]:[{id:'sled:off',ic:'c-leave',label:'내리기',key:'Q'}])];
    case 'asking':return [{id:'sled:cancel',ic:'c-leave',label:'그만',key:'Q'}];
   }
   if(nearDeck(player.x,player.z)){const out=[{id:'sled:board',ic:'x-sled',label:'타기',key:'E'}];
    const waiting=others().some(p=>p.act?.sl>=1&&p.act.sl<=3&&Math.hypot(p.sample.x-player.x,p.sample.z-player.z)<3&&!others().some(q=>q.act?.sl===5&&q.act.sp===p.id));
    if(waiting)out.push({id:'sled:ask',ic:'x-sled-pair',label:'둘이 타기',key:'R'});return out;}
   if(nearStop(player.x,player.z))return [{id:'sled:up',ic:'x-uphill',label:'언덕 위로',key:'E'}];
   return [];
  },
  act(id){
   switch(id){
    case 'sled:board':return board();case 'sled:go':go();return true;case 'sled:off':leave();return true;case 'sled:ask':return askRide();
    case 'sled:cancel':S.mode='none';S.front=null;return true;case 'sled:up':return up();
    case 'sled:cheer':S.cheer=!S.cheer;onChange();return true;
   }
   return false;
  },
  // 걷기 대신 썰매가 몸을 움직이면 true(main.js는 걷기를 건너뜀)
  update(dt,{steer=0,moveInput=false}={}){
   // 다른 사람 썰매(출발대 대기·타는 중). 뒷자리 사람은 앞사람 썰매를 같이 탄다
   const seen=new Set();
   for(const p of others()){const sl=p.act?.sl;if(!(sl>=1&&sl<=4))continue;seen.add(p.id);let g=remote.get(p.id);if(!g){g=P.buildSled(tz);world.add(g);remote.set(p.id,g);}
    const f=fwd(p.sample.heading);g.position.set(p.sample.x-f.x*.24,heightAt(p.sample.x,p.sample.z)+.11,p.sample.z-f.z*.24);g.rotation.y=p.sample.heading+Math.PI;g.visible=true;}
   for(const [id,g] of remote)if(!seen.has(id)){world.remove(g);remote.delete(id);}
   if(S.askT>0){S.askT-=dt;if(S.askT<=0&&S.mode==='asking'){S.mode='none';S.front=null;hud?.say(SLED_TEXT.declined,2);}}
   switch(S.mode){
    case 'none':case 'asking':return false;
    case 'ready':{if(moveInput){leave();return false;}S.wait-=dt;if(S.wait<=0)go();placeSled();player.update(dt,{moved:0});return true;}
    case 'count':{S.count-=dt;const n=Math.ceil(S.count);if(n!==S.lastCount){S.lastCount=n;countEl.hidden=false;countEl.textContent=n>0?String(n):'출발!';audio?.play('pop');}
     if(S.count<=0)startRide();placeSled();player.update(dt,{moved:0});return true;}
    case 'ride':{const st=Math.max(-1,Math.min(1,steer+S.steerBtn));const ev=S.ride.step(dt,st);const p=S.ride.pose();
     player.x=p.x;player.z=p.z;player.heading=p.heading;player.speed=p.speed;S.air=p.air?p.y-heightAt(p.x,p.z):0;placeSled();player.update(dt,{moved:0});
     for(const e of ev){if(e==='bank'){audio?.play('bank');hud?.say(SLED_TEXT.bank,1.2);}else if(e==='air')hud?.say(SLED_TEXT.air,.8);
      else if(e==='end'){leave();hud?.say(SLED_TEXT.end,2.2);return true;}}
     return true;}
    case 'back':{
     const fs=multi.sampleOf(S.front),fa=others().find(p=>p.id===S.front)?.act;
     if(!fs||!fa||!(fa.sl>=1&&fa.sl<=4)){if(S.frontRiding||!fs||!fa){S.frontRiding=false;leave(fs?'도착! 같이 타서 즐거웠어요':'앞사람이 썰매에서 내렸어요');}return false;}
     S.frontRiding=fa.sl===4;if(moveInput&&!S.frontRiding){leave();return false;}
     const f=fwd(fs.heading);player.x=fs.x-f.x*SLED_RULES.back;player.z=fs.z-f.z*SLED_RULES.back;player.heading=fs.heading;player.speed=S.frontRiding?6:0;
     player.update(dt,{moved:0});return true;}
   }
   return false;
  },
  // 타는 동안 카메라(썰매 뒤 낮게)
  // 둘이 탈 때는 뒷사람에 가리지 않게 조금 더 멀고 높게
  camera(){if(S.mode!=='ride'&&!(S.mode==='back'&&S.frontRiding))return null;const two=!!S.partner||S.mode==='back';return {yaw:player.heading,pitch:two?.38:.3,dist:two?4.6:4,lift:.2};},
  // 썰매가 내 몸 높이에 더할 값(둔덕에서 뜸)
  get lift(){return S.mode==='ride'?S.air??0:0;},
  status(){return {mode:S.mode,lane:S.lane,s:S.ride?+S.ride.s.toFixed(2):null,v:S.ride?+S.ride.v.toFixed(2):null,front:S.front,partner:S.partner,remote:remote.size};},
 };
 function placeSled(){const f=fwd(player.heading);mySled.visible=S.mode==='ready'||S.mode==='count'||S.mode==='ride';
  mySled.position.set(player.x-f.x*.24,heightAt(player.x,player.z)+.11+(S.air??0),player.z-f.z*.24);mySled.rotation.y=player.heading+Math.PI;}
}
