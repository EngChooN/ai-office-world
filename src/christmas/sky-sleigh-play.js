// 하늘 썰매 타기·비행·별 흔적(월드개발, 2026-11-18). 설계 v2 docs/크리스마스/루돌프-하늘썰매-설계-v2.md, 그림은 월드아트(sky-sleigh.js·sleigh-rider.js·star-trail.js), 규칙 숫자는 sky-rules.js.
// 시안 B(village.festive.skySleigh가 있을 때)에서만 켠다 — 없으면 단추·act 칸이 아예 없다.
//  - 정류장 금빛 원 안 → 「하늘 썰매 타기」(E). 내 썰매 한 대가 나오고(정류장 썰매는 2초 숨었다 다시 나타남, 동시 탑승 제한 없음) 0.6초 폴짝 올라앉는다.
//  - 땅: 걷기와 같은 조작(카메라 기준), 루돌프가 먼저 돌고 썰매가 끌려옴, 뒤로는 안 감(크게 돌아섬). 단추 「날아오르기」(E)·「내리기」(Q).
//  - 날아오르기: 앞 13m가 비어 있어야 함 → 1.2초 도움닫기 → 1.5초에 땅 위 6m. 비행: 손 떼면 둥실, Space·▲ 위로 / C·▼ 아래로(6~20m), 범위 끝에서 안쪽으로 휨.
//  - 내려앉기(E): 2초 비스듬히. 아래가 못 내리는 곳이면 가장 가까운 땅으로 미끄러져 감(최대 3초 더). 하늘에서 「내리기」(Q) = 내려앉고 바로 내림.
//  - 내리기: 동동이는 썰매 옆에 서고, 빈 썰매는 별을 뿌리며 정류장으로 날아가 사라짐(1.5초).
//  - 다른 사람: act.hs가 있는 사람마다 이 화면에 썰매 한 대를 그린다(받은 위치 = 썰매 자리, 방향은 받은 heading, 높이는 위치 메시지 a칸 · 없으면 모드로 짐작).
//    몸은 multi.js가 ctx.skyAt으로 좌석 위에 둔다. 동동이 몸이면 sleigh-rider로 앉히고, 가벼운 동동이면 좌석 높이에 둔다.
//  - 별 흔적: 보통(내 것 1초 10·남의 것 5). 휴대폰은 가까운 6명만, 프레임이 떨어지면(PC 50·휴대폰 36 아래 3초) 남의 흔적 절반 → 내 것만.
import * as THREE from 'three';
import {createSleighRider} from './sleigh-rider.js';
import {SLEIGH} from './sky-sleigh.js';
import {collideXmas} from './collide.js';
import {SKY,HS,SKY_TEXT,inAir,skyBounds,avoidPillars,angleDiff,noLandZone,canSit,nearestLanding,takeoffClear,takeoffAlt,takeoffProgress,landAlt,clampAlt,guessAlt,teamMode,nearStation,encodeAlt} from './sky-rules.js';
import {icon} from '../icons/icon.js';
import './sky-sleigh-play.css';

const fwd=h=>({x:-Math.sin(h),z:-Math.cos(h)});
const HSOF=Object.freeze({none:HS.none,mount:HS.ground,ground:HS.ground,takeoff:HS.takeoff,fly:HS.fly,land:HS.land,off:HS.none});
export const SKY_TRAIL=Object.freeze({mobileNear:6,lowFps:Object.freeze({pc:50,mobile:36}),highFps:Object.freeze({pc:57,mobile:44}),lowSecs:3,highSecs:6,bellR:12});

// ctx: {sky(village.festive.skySleigh), player, poser, multi, hud, audio, input, mobile, heightAt, cols(충돌), root(HUD 뿌리), onChange(), busy() → 놀이 상태 객체, fps() → 지금 프레임}
export function createSkySleighPlay({sky,player,poser,multi,hud,audio,input,mobile=false,heightAt,cols=[],root=document.body,onChange=()=>{},busy=()=>({}),fps=()=>60}){
 const on=!!sky;
 const H=heightAt;
 const S={mode:'none',t:0,team:null,trail:null,fx:0,fz:0,lead:0,v:0,alt:0,land:null,wantOff:false,near:false,up:false,down:false,since:0,
  respawn:0,blockWhy:null,lastSay:0,cheer:0};
 const rider=on?createSleighRider({avatar:player,poser}):null;
 const remotes=new Map(),homing=[],riders=new WeakMap();
 const P=new THREE.Vector3();
 let degrade=0,lowT=0,highT=0,bellT=0;
 // 정류장 기다리는 썰매 자리에 놓인 충돌 원(썰매·루돌프)은 내 썰매에는 빼고 판정한다(그 자리에서 출발하므로)
 const W=sky?.station?.sleigh,Wf=W?{x:W.x+fwd(W.heading).x*SLEIGH.tow,z:W.z+fwd(W.heading).z*SLEIGH.tow}:null;
 const sleighCols=on?cols.filter(c=>c.r===undefined||!(Math.hypot(c.x-W.x,c.z-W.z)<.05||Math.hypot(c.x-Wf.x,c.z-Wf.z)<.05)):[];
 const blocked=(x,z)=>{const g=collideXmas(x,z,sleighCols,.6);return Math.hypot(g.x-x,g.z-z)>.05;};

 // ── 화면: 위 가운데 고도 칩 + 오른쪽 ▲▼ 단추(누르는 동안)
 const ui=document.createElement('div');ui.className='xs';ui.innerHTML=`<div class="xs-alt" hidden><i>${icon('x-reindeer',{size:'s'})}</i><span></span></div>
<div class="xs-pads" hidden><button type="button" class="xs-up" data-hold="up" aria-label="위로 (Space)">${icon('x-fly-up',{size:'m'})}<span>위로</span>${mobile?'':'<kbd>Space</kbd>'}</button><button type="button" class="xs-down" data-hold="down" aria-label="아래로 (C)">${icon('x-fly-down',{size:'m'})}<span>아래로</span>${mobile?'':'<kbd>C</kbd>'}</button></div>`;
 if(on)root.appendChild(ui);
 const altEl=ui.querySelector('.xs-alt'),altTx=altEl.querySelector('span'),pads=ui.querySelector('.xs-pads');
 for(const b of ui.querySelectorAll('[data-hold]')){
  const down=e=>{e.preventDefault();try{b.setPointerCapture?.(e.pointerId);}catch{}b.classList.add('on');S[b.dataset.hold]=true;};
  const up=()=>{b.classList.remove('on');S[b.dataset.hold]=false;};
  b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);}
 let uiSig='';
 function syncUi(){
  const air=S.mode==='takeoff'||S.mode==='fly'||S.mode==='land',sig=`${S.mode}|${air?Math.round(S.alt):''}|${S.near}`;if(sig===uiSig)return;uiSig=sig;
  altEl.hidden=!air;if(air)altTx.textContent=S.near&&S.mode==='fly'?SKY_TEXT.edge:`고도 ${Math.round(S.alt)}m`;altEl.classList.toggle('edge',S.near&&S.mode==='fly');
  pads.hidden=S.mode!=='fly';document.documentElement.classList.toggle('xs-riding',S.mode!=='none'&&S.mode!=='off');document.documentElement.classList.toggle('xs-flying',S.mode==='fly');
 }

 const setMode=m=>{if(S.mode===m)return;const before=HSOF[S.mode];S.mode=m;S.t=0;if(HSOF[m]!==before)onChange();syncUi();};
 const say=(t,s=1.8,ic='x-reindeer')=>hud?.say(t,s,ic);

 // ── 타기
 function board(){
  if(!on||S.mode!=='none')return false;
  if(!nearStation(player.x,player.z))return false;
  const b=busy();if(Object.entries(b).some(([,v])=>!!v)){say(SKY_TEXT.busy);return false;}
  const team=sky.fleet.spawn();if(!team){say('지금은 썰매가 모두 나가 있어요 · 조금 뒤에 타 주세요');return false;}
  team.mode='stand';team.place(W.x,0,W.z,W.heading);team.driver=true;
  S.team=team;S.trail=sky.stars.emitter({mine:true});S.fx=team.fx;S.fz=team.fz;S.lead=W.heading;S.v=0;S.alt=0;S.wantOff=false;S.land=null;S.up=S.down=false;
  S.from={x:player.x,z:player.z};
  rider.mount(team,{groundY:H(player.x,player.z)});
  sky.waiting.visible=false;S.respawn=SKY.respawnSecs;
  input?.setRun?.(false);
  setMode('mount');say(SKY_TEXT.on,2.4);audio?.play('jingle');return true;
 }
 // ── 내리기(땅에서). instant면 애니메이션 없이(서버 바꾸기·지도 이동)
 function dismount({instant=false,silent=false}={}){
  if(S.mode==='none'||S.mode==='off')return false;
  const t=S.team;
  // 썰매 왼쪽 옆 1.3m(막혀 있으면 오른쪽, 그래도면 충돌이 밀어 줌)
  const h=t.heading,rx=Math.cos(h),rz=-Math.sin(h);let spot=null;
  for(const k of [-1.3,1.3,-2.2,2.2]){const x=t.x+rx*k,z=t.z+rz*k;if(!blocked(x,z)&&!noLandZone(x,z,0,false)){spot={x,z};break;}}
  spot=collideXmas((spot??{x:t.x+rx*-1.3,z:t.z+rz*-1.3}).x,(spot??{z:t.z+rz*-1.3}).z,cols);
  if(instant){player.place(spot.x,spot.z,h);rider.dismount({groundY:H(spot.x,spot.z),instant:true});}
  else{player.place(spot.x,spot.z,h);rider.dismount({groundY:H(spot.x,spot.z)});}
  t.driver=false;sendHome(t,S.trail);
  S.team=null;S.trail=null;S.v=0;S.alt=0;S.land=null;S.wantOff=false;S.up=S.down=false;
  poser.setArms('none');
  if(instant){S.mode='off';S.t=SKY.dismountSecs;onChange();syncUi();}else setMode('off');
  if(!silent)say(SKY_TEXT.off,1.4);
  return true;
 }
 // 빈 썰매를 정류장으로(별을 뿌리며 1.5초, 다 오면 돌려줌)
 function sendHome(team,trail){
  if(!team)return;
  const S0=sky.station.sleigh,to={x:S0.x+fwd(S0.heading).x*SLEIGH.tow,z:S0.z+fwd(S0.heading).z*SLEIGH.tow};
  homing.push({team,trail,t:0,from:{x:team.fx,z:team.fz,y:team.fy},to,lead:team.lead});
 }
 function stepHome(dt){
  for(let i=homing.length-1;i>=0;i--){const h=homing[i];h.t+=dt;const k=Math.min(1,h.t/SKY.homeSecs),e=k*k*(3-2*k);
   const x=h.from.x+(h.to.x-h.from.x)*e,z=h.from.z+(h.to.z-h.from.z)*e,gy=H(x,z),arc=Math.sin(Math.PI*k)*4;
   const y=Math.max(gy,h.from.y+(gy-h.from.y)*e)+arc;
   const d=Math.hypot(h.to.x-x,h.to.z-z);if(d>.3)h.lead=Math.atan2(-(h.to.x-x),-(h.to.z-z));
   h.team.mode='fly';h.team.speed=6;h.team.drive(x,y,z,h.lead);
   if(h.trail){h.team.trailPoint(P);h.trail.update(dt,P,{air:true});}
   if(k>=1){h.team.release();homing.splice(i,1);}}
 }

 // ── 단추
 function wantTakeoff(){
  if(S.mode!=='ground')return false;
  const c=takeoffClear(S.fx,S.fz,S.lead,blocked);
  if(!c.ok){say(c.why==='zone'?SKY_TEXT.noTakeoffHere:SKY_TEXT.blocked,1.8);return false;}
  setMode('takeoff');S.v=Math.max(S.v,1.5);audio?.play('boost',{gain:.7});return true;
 }
 function wantLand(off=false){
  if(S.mode!=='fly')return false;
  // 지금 속도로 2초 비스듬히 내려가면 닿는 곳. 못 내리는 곳이면 가장 가까운 땅(최대 3초 더 미끄러짐)
  const f=fwd(S.lead),ahead=Math.max(2,S.v*SKY.landSecs*.6),tx=S.fx+f.x*ahead,tz=S.fz+f.z*ahead;
  let tgt={x:tx,z:tz};if(!canSit(tx,tz,S.lead,blocked)){tgt=nearestLanding(tx,tz,S.lead,blocked);say(SKY_TEXT.slide,1.8);}
  const d=Math.hypot(tgt.x-S.fx,tgt.z-S.fz),dur=SKY.landSecs+Math.min(SKY.slideMax,Math.max(0,d-ahead)/SKY.fly);
  S.land={x0:S.fx,z0:S.fz,tx:tgt.x,tz:tgt.z,alt0:S.alt,dur,splash:false,lead0:S.lead};S.wantOff=off;
  setMode('land');return true;
 }

 // ── 매 프레임(내 썰매). 타는 중이면 true(main.js는 걷기·땅 높이 더하기를 건너뛴다)
 function update(dt,{mv={forward:0,side:0,run:false},camYaw=0}={}){
  if(!on)return false;
  stepHome(dt);
  if(S.respawn>0){S.respawn-=dt;if(S.respawn<=0&&sky.waiting)sky.waiting.visible=true;}
  if(S.mode==='none')return false;
  S.t+=dt;
  if(S.mode==='off'){player.update(dt,{moved:0});if(S.t>=SKY.dismountSecs||!rider.active){S.mode='none';syncUi();return false;}return true;}
  const t=S.team;
  const moveIn=!!(mv.forward||mv.side);let want=null;
  if(moveIn){const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw),dx=fx*mv.forward+rx*mv.side,dz=fz*mv.forward+rz*mv.side;want=Math.atan2(-dx,-dz);}
  const fast=!!mv.run;
  // 방향: 루돌프가 먼저 돈다(초당 150°). 뒤쪽 입력이면 크게 돌아섬(속도 줄임, 뒤로는 안 감)
  let turnK=1;
  if(want!==null&&S.mode!=='takeoff'&&S.mode!=='land'&&S.mode!=='mount'){const d=angleDiff(want,S.lead);S.lead+=Math.sign(d)*Math.min(Math.abs(d),SKY.turnRate*dt);turnK=Math.abs(d)>SKY.backTurn?SKY.uTurnK:Math.max(SKY.uTurnK,Math.cos(d));} // 뒤쪽이면 반 속도로 앞으로 가며 크게 돎(썰매가 루돌프를 따라 원을 그림)
  const accel=(target,secs)=>{const step=Math.max(target,SKY.fly)/Math.max(.1,secs)*dt;S.v+=Math.max(-step,Math.min(step,target-S.v));};
  if(S.mode==='mount'){
   const k=Math.min(1,S.t/SKY.mountSecs);player.x=S.from.x+(t.x-S.from.x)*k;player.z=S.from.z+(t.z-S.from.z)*k;
   t.mode='stand';t.drive(S.fx,0,S.fz,S.lead);
   if(S.t>=SKY.mountSecs)setMode('ground');
  }
  else if(S.mode==='ground'){
   accel(want!==null?(fast?SKY.groundFast:SKY.ground)*turnK:0,want!==null?.5:SKY.stopSecs);
   if(S.v>0){const f=fwd(S.lead);let nx=S.fx+f.x*S.v*dt,nz=S.fz+f.z*S.v*dt;const g=collideXmas(nx,nz,sleighCols,SKY.hitR);nx=g.x;nz=g.z;
    if(noLandZone(nx,nz,.3,false)){S.v=0;}else{S.fx=nx;S.fz=nz;}}
   t.mode=S.v>.3?'run':'stand';t.speed=S.v;t.drive(S.fx,0,S.fz,S.lead);
  }
  else if(S.mode==='takeoff'){
   // 도움닫기: 1.2초에 약 5m(점점 빨라짐) → 떠오르며 비행 속도로
   const dash=S.t<SKY.dashSecs;accel(dash?SKY.dashDist/SKY.dashSecs*1.35:SKY.fly,dash?.6:1);
   const f=fwd(S.lead);S.fx+=f.x*S.v*dt;S.fz+=f.z*S.v*dt;S.alt=takeoffAlt(S.t);
   const b=skyBounds(S.fx,S.fz,S.lead,dt);S.fx=b.x;S.fz=b.z;S.lead=b.heading;
   const pa=avoidPillars(S.fx,S.fz,S.alt);S.fx=pa.x;S.fz=pa.z;
   t.mode='takeoff';t.progress=takeoffProgress(S.t);t.speed=S.v;t.drive(S.fx,H(S.fx,S.fz)+S.alt,S.fz,S.lead);
   if(S.t>=SKY.dashSecs+SKY.riseSecs){S.alt=SKY.altStart;setMode('fly');}
  }
  else if(S.mode==='fly'){
   accel(want!==null?(fast?SKY.flyFast:SKY.fly)*turnK:0,want!==null?.6:SKY.hoverSecs);
   const ud=(S.up||input?.key?.('Space')?1:0)-(S.down||input?.key?.('KeyC')?1:0);S.alt=clampAlt(S.alt+ud*SKY.climb*dt);
   const f=fwd(S.lead);let nx=S.fx+f.x*S.v*dt,nz=S.fz+f.z*S.v*dt;
   const b=skyBounds(nx,nz,S.lead,dt);S.lead=b.heading;S.near=b.near;const pa=avoidPillars(b.x,b.z,S.alt);S.fx=pa.x;S.fz=pa.z;
   t.mode='fly';t.speed=S.v;t.drive(S.fx,H(S.fx,S.fz)+S.alt,S.fz,S.lead);
  }
  else if(S.mode==='land'){
   const L=S.land,p=Math.min(1,S.t/L.dur),e=p*p*(3-2*p);
   const nx=L.x0+(L.tx-L.x0)*e,nz=L.z0+(L.tz-L.z0)*e;const d=Math.hypot(nx-S.fx,nz-S.fz);
   if(d>.02){const dir=Math.atan2(-(nx-S.fx),-(nz-S.fz)),dd=angleDiff(dir,S.lead);S.lead+=Math.sign(dd)*Math.min(Math.abs(dd),SKY.turnRate*dt);}
   S.v=d/Math.max(1e-3,dt);S.fx=nx;S.fz=nz;S.alt=landAlt(L.alt0,p);
   t.mode='land';t.progress=p;t.speed=Math.min(S.v,SKY.fly);t.drive(S.fx,H(S.fx,S.fz)+S.alt,S.fz,S.lead);
   if(p>=.75&&!L.splash){L.splash=true;sky.stars.splash(t.x,H(t.x,t.z),t.z);audio?.play('bank',{gain:.8});}
   if(p>=1){S.alt=0;S.v=0;S.land=null;t.mode='stand';setMode('ground');say(SKY_TEXT.landed,1.2);if(S.wantOff){dismount();return true;}}
  }
  // 몸: 썰매 자리(이름표·말풍선이 따라옴), 걷기 다리 없음
  if(S.mode!=='mount'){player.x=t.x;player.z=t.z;}
  player.heading=t.heading;player.speed=S.v;player.running=false;
  if(S.cheer>0){S.cheer-=dt;if(S.cheer<=0){S.cheer=0;rider.setArms('reins');poser.setArms('none');onChange();}}
  player.update(dt,{moved:0});
  // 별 흔적(썰매 날 뒤)
  t.trailPoint(P);S.trail?.update(dt,P,{air:inAir(HSOF[S.mode]),running:t.mode==='run',ground:H(t.x,t.z)});
  syncUi();
  return true;
 }

 // ── 다른 사람 썰매(act.hs). multi.update 앞에서 부른다(몸 자리는 multi.js가 skyAt으로 가져감)
 function riderFor(av,ps){let r=riders.get(av);if(!r){r=createSleighRider({avatar:av,poser:ps});riders.set(av,r);}return r;}
 function updateRemotes(dt){
  if(!on)return;
  const seen=new Set(),list=multi?.joined?multi.people().filter(p=>!p.muted&&p.sample&&p.act?.hs):[];
  // 휴대폰: 가까운 6명만 흔적, 프레임이 떨어지면 남의 흔적 절반 → 내 것만
  const near=new Set(mobile?[...list].sort((a,b)=>Math.hypot(a.sample.x-player.x,a.sample.z-player.z)-Math.hypot(b.sample.x-player.x,b.sample.z-player.z)).slice(0,SKY_TRAIL.mobileNear).map(p=>p.id):list.map(p=>p.id));
  let idx=0;
  for(const p of list){
   let R=remotes.get(p.id);const s=p.sample,hs=p.act.hs;
   if(!R){const team=sky.fleet.spawn();if(!team)continue;R={team,trail:sky.stars.emitter({mine:false}),hs,since:0,alt:0,avatar:null,rider:null,fresh:true};remotes.set(p.id,R);}
   seen.add(p.id);
   if(R.hs!==hs){if(R.hs===HS.land&&hs===HS.ground)sky.stars.splash(R.team.x,H(R.team.x,R.team.z),R.team.z);R.hs=hs;R.since=0;}else R.since+=dt;
   const want=Number.isFinite(s.alt)?s.alt:guessAlt(hs,R.since);
   R.alt+=((inAir(hs)?want:0)-R.alt)*(1-Math.exp(-dt*6));
   const t=R.team,f=fwd(s.heading),fx=s.x+f.x*SLEIGH.tow,fz=s.z+f.z*SLEIGH.tow;
   t.mode=teamMode(hs,s.speed??0);t.speed=s.speed??0;t.progress=hs===HS.takeoff?takeoffProgress(R.since):hs===HS.land?Math.min(.99,R.since/SKY.landSecs):0;
   if(R.fresh){t.place(s.x,H(s.x,s.z)+R.alt,s.z,s.heading);R.fresh=false;}
   t.drive(fx,H(fx,fz)+R.alt,fz,s.heading);
   t.pair=!(mobile&&degrade>=1&&!near.has(p.id));
   // 몸: 동동이 몸이면 앉히고, 가벼운 동동이면 좌석 높이(skyAt)
   const av=multi.avatarOf(p.id);
   if(av!==R.avatar){R.rider?.dismount({instant:true});R.avatar=av;R.rider=null;
    if(av){R.rider=riderFor(av,multi.poserOf(p.id));R.rider.mount(t,{instant:true});}}
   t.driver=!!R.rider;
   // 흔적
   R.trail.on=near.has(p.id)&&(degrade===0||(degrade===1&&idx%2===0));idx++;
   t.trailPoint(P);R.trail.update(dt,P,{air:inAir(hs),running:t.mode==='run',ground:H(t.x,t.z)});
  }
  for(const [id,R] of remotes)if(!seen.has(id)){R.rider?.dismount({instant:true});R.team.driver=false;sendHome(R.team,R.trail);remotes.delete(id);}
  // 남의 썰매 방울(12m 안, 1초에 한 번쯤)
  bellT-=dt;if(bellT<=0){bellT=1;for(const R of remotes.values()){const d=Math.hypot(R.team.x-player.x,R.team.z-player.z);if(d<SKY_TRAIL.bellR&&R.team.speed>.5){audio?.play('jingle',{at:{x:R.team.x,z:R.team.z},gain:.22});break;}}}
 }
 // 프레임 지킴(별 흔적 줄이기)
 function watchFps(dt){
  const f=fps(),lo=mobile?SKY_TRAIL.lowFps.mobile:SKY_TRAIL.lowFps.pc,hi=mobile?SKY_TRAIL.highFps.mobile:SKY_TRAIL.highFps.pc;
  if(!remotes.size&&S.mode==='none'){lowT=highT=0;return;}
  if(f<lo){lowT+=dt;highT=0;if(lowT>=SKY_TRAIL.lowSecs&&degrade<2){degrade++;lowT=0;}}
  else if(f>=hi){highT+=dt;lowT=0;if(highT>=SKY_TRAIL.highSecs&&degrade>0){degrade--;highT=0;}}
  else{lowT=Math.max(0,lowT-dt);}
 }

 return {
  get enabled(){return on;},get mode(){return S.mode;},get riding(){return S.mode!=='none'&&S.mode!=='off';},get flying(){return inAir(HSOF[S.mode]);},
  get team(){return S.team;},get alt(){return S.alt;},get speed(){return S.v;},get rider(){return rider;},get degrade(){return degrade;},
  // 탄 동안 몸을 맡고 있나(내리는 0.35초 포함) — 이때는 땅 높이를 더하지 않는다
  get body(){return S.mode!=='none';},
  actFields(){return on?{hs:HSOF[S.mode]??0,...(S.cheer>0&&S.mode!=='off'?{wm:1}:{})}:{};},
  // 위치 메시지 a칸(하늘에 있을 때만, 썰매 날 높이)
  sendAlt(){if(!S.team||!inAir(HSOF[S.mode]))return 0;return encodeAlt(Math.max(.1,S.team.y-H(S.team.x,S.team.z)));},
  actions(){
   if(!on)return [];
   switch(S.mode){
    case 'ground':return [{id:'hs:up',ic:'x-takeoff',label:'날아오르기',key:'E',...(takeoffClear(S.fx,S.fz,S.lead,blocked).ok?{}:{dim:true})},{id:'hs:off',ic:'c-stand-up',label:'내리기',key:'Q'},{id:'hs:cheer',ic:'x-cheer',label:'만세',key:'R'}];
    case 'fly':return [{id:'hs:land',ic:'x-land',label:'내려앉기',key:'E'},{id:'hs:off',ic:'c-stand-up',label:'내리기',key:'Q'}]; // 만세는 땅에서만(휴대폰 오른쪽 세로 줄에 ▲▼ 자리)
    case 'mount':case 'takeoff':case 'land':case 'off':return [];
   }
   return nearStation(player.x,player.z)?[{id:'hs:board',ic:'x-reindeer',label:'하늘 썰매 타기',key:'E'}]:[];
  },
  act(id){
   switch(id){
    case 'hs:board':return board();
    case 'hs:up':return wantTakeoff();
    case 'hs:land':return wantLand(false);
    case 'hs:off':if(S.mode==='fly')return wantLand(true);if(S.mode==='ground')return dismount();return false;
    case 'hs:cheer':if(S.mode!=='ground')return false;S.cheer=2.4;rider.setArms('cheer');poser.setArms('cheer');onChange();return true;
   }
   return false;
  },
  hold(id,v){if(id==='hs:up')S.up=v;else if(id==='hs:down')S.down=v;},
  // 지도 이동·서버 바꾸기: 바로 내리고 썰매는 정류장으로
  stop(){if(S.mode==='none')return false;if(S.mode==='off'){S.mode='none';syncUi();return true;}return dismount({instant:true,silent:true});},
  update,updateRemotes,
  frame(dt){watchFps(dt);},
  // 다른 사람 몸 자리(multi.js ctx.skyAt): 썰매 자리·방향, 좌석 높이, 동동이 몸이 앉혀졌나
  skyAt(id){const R=remotes.get(id);if(!R)return null;R.team.seat(P);return {x:R.team.x,z:R.team.z,heading:R.team.heading,y:P.y-.12,seated:!!R.rider};},
  // 카메라: 썰매 뒤 위(땅 7m·하늘 10m), 빨리 때 시야 조금 넓게
  camera(){if(S.mode==='none'||S.mode==='off'||!S.team)return null;const air=inAir(HSOF[S.mode]);
   return {yaw:S.team.heading,pitch:air?.42:.34,dist:air?SKY.camFly:SKY.camGround,lag:.9,y:S.team.y+.9,fov:S.v>SKY.fly+.5?(mobile?68:61):null,follow:S.v>.5};},
  status(){return {enabled:on,mode:S.mode,hs:HSOF[S.mode]??0,alt:+S.alt.toFixed(2),v:+S.v.toFixed(2),x:S.team?+S.team.x.toFixed(2):+player.x.toFixed(2),z:S.team?+S.team.z.toFixed(2):+player.z.toFixed(2),
   heading:S.team?+S.team.heading.toFixed(2):null,y:S.team?+S.team.y.toFixed(2):null,near:S.near,remotes:remotes.size,homing:homing.length,fleet:sky?.fleet.live??0,stars:sky?.stars.alive()??0,degrade,
   seated:rider?.mounted??false,takeoff:S.mode==='ground'?takeoffClear(S.fx,S.fz,S.lead,blocked):null,waiting:sky?.waiting?.visible??null,station:nearStation(player.x,player.z)};},
  // 점검: 지금 높이·모드 그대로 앞(루돌프) 지점을 (x,z)로 옮김
  debugMove(x,z,h=S.lead){if(!S.team)return false;S.lead=h;S.fx=x;S.fz=z;const air=inAir(HSOF[S.mode]);S.team.place(x+Math.sin(h)*SLEIGH.tow,air?H(x,z)+S.alt:0,z+Math.cos(h)*SLEIGH.tow,h);return true;},
  // 점검: 정류장 원 가운데로
  goTo(){if(!on)return false;player.place(sky.station.x,sky.station.z,sky.station.heading);return true;},
 };
}
