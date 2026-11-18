// 하늘 썰매 규칙(월드개발, 2026-11-18). 설계 v2(docs/크리스마스/루돌프-하늘썰매-설계-v2.md)의 숫자·범위·못 내리는 곳·흐름 계산을 모은 순수 자료(three·DOM 없음, 시험이 같이 씀).
// 화면 연결은 sky-sleigh-play.js, 그림은 월드아트 sky-sleigh.js·sleigh-rider.js·star-trail.js.
//  - act 칸 hs(언덕 눈썰매 sl과 따로): 0 없음 · 1 땅(타기·달리기) · 2 날아오르기 · 3 비행 · 4 내려앉기. 다른 사람에게 높이는 위치 메시지 s의 a칸(땅 위 m, 하늘일 때만).
//  - 대표 결정: 범위 = 트리에서 38m 원 + z ≥ −26, 높이 = 땅 위 6~20m, 별 = 보통, 동시 탑승 제한 없음. 나머지 숫자는 설계 추천안(대표 미확인).
import {TREE,SNOWBALL_YARD,SNOWMAN_YARD} from './layout.js';
import {inRink,CAROUSEL,REINDEER_STATION} from './festive-layout.js';
import {GONDOLA} from './gondola.js';

const D2R=Math.PI/180;
export const SKY=Object.freeze({
 // 속도(m/s): 땅 3.6·「빨리」 5, 하늘 6·「빨리」 9, 오르내림 2.5. 서버 위치 한도 12m/s 안
 ground:3.6,groundFast:5,fly:6,flyFast:9,climb:2.5,
 turnRate:150*D2R,stopSecs:.8,hoverSecs:1,backTurn:120*D2R,uTurnK:.5, // 뒤로는 안 감: 입력이 120°보다 뒤면 반 속도로 앞으로 가며 크게 돌아섬
 altMin:6,altMax:20,altStart:6,
 radius:38,zMin:-26,edge:4,          // 범위: 트리에서 38m 원 + z ≥ −26, 경계 4m 앞부터 안쪽으로 휨
 mountSecs:.6,dismountSecs:.35,respawnSecs:2,homeSecs:1.5,
 dashSecs:1.2,dashDist:5,riseSecs:1.5, // 이륙: 1.2초 도움닫기(약 5m) → 1.5초에 땅 위 6m
 landSecs:2,slideMax:3,               // 착지 2초(비스듬히), 못 내리는 곳이면 최대 3초 미끄러져 감
 clearAhead:13,                        // 이륙 앞 13m가 비어 있어야 함
 stationNear:REINDEER_STATION.ring+.4, // 정류장 금빛 원 안(반지름 2m + 여유)
 hitR:1,                               // 썰매 판정 원(앞 = 루돌프, 뒤 = 썰매)
 camGround:7,camFly:10,
 sendAltStep:.1,
});
export const HS=Object.freeze({none:0,ground:1,takeoff:2,fly:3,land:4});
export const HS_MODE=Object.freeze(['none','ground','takeoff','fly','land']);
export const inAir=hs=>hs>=HS.takeoff;
export const SKY_TEXT=Object.freeze({
 on:'하늘 썰매에 탔어요 · 「날아오르기」로 하늘을 날아요',
 blocked:'앞이 막혀 있어요 · 방향을 돌려요',
 noTakeoffHere:'여기서는 날아오를 수 없어요',
 slide:'광장 바닥에 내려앉을게요',
 edge:'광장 끝이에요',
 busy:'다른 놀이를 마친 뒤 타 주세요',
 off:'하늘 썰매에서 내렸어요',
 landed:'내려앉았어요',
 travel:'썰매를 정류장에 돌려보냈어요',
});

// 피해 가는 기둥(그 높이 아래만): 트리(반지름 4·높이 10.5), 케이블카 승강장(반지름 6·높이 9). 썰매 판정 원 1m를 더해 민다
export const SKY_PILLARS=Object.freeze([
 Object.freeze({id:'tree',x:TREE.x,z:TREE.z,r:4,h:10.5}),
 Object.freeze({id:'gondola',x:GONDOLA.base.x,z:GONDOLA.base.z,r:6,h:9}),
]);

// 범위 밖으로 나가지 않게: 경계 edge m 앞부터 진행 방향을 안쪽으로 휘고(soft), 경계를 넘으면 안으로 되돌린다(hard).
// 반환 {x,z,heading,near(경계 가까움)}
export function skyBounds(x,z,heading,dt=0){
 const R=SKY.radius,E=SKY.edge,cx=TREE.x,cz=TREE.z;let near=false;
 // 원
 let dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);
 if(d>R-E){near=true;
  if(dt>0){const inward=Math.atan2(dx,dz); // heading 0 = −Z이므로 중심을 보는 방향 = atan2(dx,dz)
   const k=Math.min(1,(d-(R-E))/E),turn=angleDiff(inward,heading);heading+=Math.sign(turn)*Math.min(Math.abs(turn),SKY.turnRate*1.2*k*dt);}
  if(d>R){x=cx+dx/d*R;z=cz+dz/d*R;}}
 // 북쪽 선(케이블카 승강장 앞)
 if(z<SKY.zMin+E){near=true;
  if(dt>0){const turn=angleDiff(Math.PI,heading),k=Math.min(1,(SKY.zMin+E-z)/E);heading+=Math.sign(turn)*Math.min(Math.abs(turn),SKY.turnRate*1.2*k*dt);} // π = +Z(남쪽)
  if(z<SKY.zMin)z=SKY.zMin;}
 return {x,z,heading,near};
}
export const inSkyBounds=(x,z)=>Math.hypot(x-TREE.x,z-TREE.z)<=SKY.radius&&z>=SKY.zMin;
// 기둥 피하기: 바닥 높이(땅 위 alt)가 기둥보다 낮으면 옆으로 민다
export function avoidPillars(x,z,alt,r=SKY.hitR){
 for(const p of SKY_PILLARS){if(alt>=p.h)continue;const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),m=p.r+r;if(d<m){const k=d>1e-6?m/d:0;x=d>1e-6?p.x+dx*k:p.x+m;z=d>1e-6?p.z+dz*k:z;}}
 return {x,z};
}
export function angleDiff(a,b){let d=a-b;return Math.atan2(Math.sin(d),Math.cos(d));}

// 못 내리는 곳(= 땅에서도 썰매로 못 들어가는 곳): 눈싸움·눈사람 마당, 아이스링크, 회전목마 받침, 트리 둘레 4m 안, 범위 밖
export function noLandZone(x,z,m=1.2,bounds=true){
 if(Math.abs(x-SNOWBALL_YARD.x)<=SNOWBALL_YARD.w/2+m&&Math.abs(z-SNOWBALL_YARD.z)<=SNOWBALL_YARD.d/2+m)return 'fight';
 if(Math.abs(x-SNOWMAN_YARD.x)<=SNOWMAN_YARD.w/2+m&&Math.abs(z-SNOWMAN_YARD.z)<=SNOWMAN_YARD.d/2+m)return 'snowman';
 if(inRink(x,z,-m))return 'rink';
 if(Math.hypot(x-CAROUSEL.x,z-CAROUSEL.z)<CAROUSEL.baseR+m)return 'carousel';
 if(Math.hypot(x-TREE.x,z-TREE.z)<4+m)return 'tree';
 if(bounds&&!inSkyBounds(x,z))return 'out';
 return null;
}
// 썰매가 땅에 놓일 수 있나: 앞(루돌프)·뒤(썰매) 두 원 모두 못 내리는 곳 밖이고 집·노점 등에 걸리지 않음(blocked(x,z) = 충돌 검사, 화면이 줌)
export function canSit(fx,fz,heading,blocked=()=>false,tow=2.35){
 const bx=fx+Math.sin(heading)*tow,bz=fz+Math.cos(heading)*tow;
 for(const [x,z,i] of [[fx,fz,0],[bx,bz,1],[(fx+bx)/2,(fz+bz)/2,2]]){if(noLandZone(x,z,1.2,i===0))return false;if(blocked(x,z))return false;} // 범위는 앞(루돌프)만 — 정류장 썰매도 원 밖에 걸쳐 있음
 return true;
}
// 가장 가까운 내릴 수 있는 곳(앞 지점 기준). 0.75m 간격 고리로 찾고, 없으면 정류장
export function nearestLanding(fx,fz,heading,blocked=()=>false,tow=2.35,maxR=24){
 if(canSit(fx,fz,heading,blocked,tow))return {x:fx,z:fz,d:0};
 for(let r=1;r<=maxR;r+=1){const n=Math.max(8,Math.round(r*6));
  let best=null;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=fx+Math.sin(a)*r,z=fz+Math.cos(a)*r;if(canSit(x,z,heading,blocked,tow)){const d=Math.hypot(x-fx,z-fz);if(!best||d<best.d)best={x,z,d};}}
  if(best)return best;}
 const S=REINDEER_STATION.sleigh;return {x:S.x-Math.sin(S.heading)*tow,z:S.z-Math.cos(S.heading)*tow,d:Math.hypot(S.x-fx,S.z-fz),station:true};
}
// 이륙 앞이 비었나: 지금 앞 지점에서 heading 방향 clearAhead m까지 1m마다 (막힘·범위 밖이면 이유)
export function takeoffClear(fx,fz,heading,blocked=()=>false){
 const ux=-Math.sin(heading),uz=-Math.cos(heading);
 for(let s=1;s<=SKY.clearAhead;s+=1){const x=fx+ux*s,z=fz+uz*s;
  if(!inSkyBounds(x,z))return {ok:false,why:'out',at:s};
  // 도움닫기(5m) 안은 땅을 달리므로 못 들어가는 곳이면 막힘, 그 뒤는 떠오르는 중이라 집·시설만
  if(s<=SKY.dashDist+1&&noLandZone(x,z,.4,false))return {ok:false,why:'zone',at:s};
  if(blocked(x,z))return {ok:false,why:'blocked',at:s};
  for(const p of SKY_PILLARS)if(Math.hypot(x-p.x,z-p.z)<p.r+SKY.hitR)return {ok:false,why:'pillar',at:s};}
 return {ok:true};
}
// 이륙 높이(시간 t, 도움닫기 뒤 riseSecs에 altStart까지 부드럽게)
export function takeoffAlt(t){const r=(t-SKY.dashSecs)/SKY.riseSecs;if(r<=0)return 0;const k=Math.min(1,r);return SKY.altStart*k*k*(3-2*k);}
export const takeoffProgress=t=>Math.max(0,Math.min(1,t/(SKY.dashSecs+SKY.riseSecs)));
// 착지 높이: progress .75에 발굽이 땅에 닿음(월드아트 인계 §2)
export function landAlt(alt0,p){const k=Math.min(1,Math.max(0,p/.75));return alt0*(1-k*k*(3-2*k));}
export const clampAlt=a=>Math.max(SKY.altMin,Math.min(SKY.altMax,a));
// 보내는 높이(0.1m 단위, 0~25)
export const encodeAlt=a=>Math.round(Math.max(0,Math.min(25,a))/SKY.sendAltStep)*SKY.sendAltStep;
// 높이를 못 받았을 때(옛 서버): 모드로 짐작한 높이. since = 그 모드가 된 뒤 초
export function guessAlt(hs,since){
 if(hs===HS.fly)return 10;
 if(hs===HS.takeoff)return takeoffAlt(Math.max(0,since));
 if(hs===HS.land)return landAlt(10,Math.min(1,since/SKY.landSecs));
 return 0;
}
// 그림 모드(team.mode): 땅은 속도로 서기·달리기
export function teamMode(hs,speed=0){return hs===HS.takeoff?'takeoff':hs===HS.fly?'fly':hs===HS.land?'land':speed>.3?'run':'stand';}
// 탈 수 있나(설계 §7: 아무것도 안 타고 안 하고 있을 때만). busy = main.js busyNow() + 눈싸움 한 판·눈사람 굴리기 등
export function canBoard(busy={}){return !Object.entries(busy).some(([k,v])=>k!=='sky'&&!!v);}
// 정류장 원 안
export const nearStation=(x,z)=>Math.hypot(x-REINDEER_STATION.x,z-REINDEER_STATION.z)<SKY.stationNear;
