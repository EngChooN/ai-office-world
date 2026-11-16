// 눈썰매 타기 계산(월드개발, 2026-11-16). three 없음(시험에서 바로 부른다). 길·높이는 layout.js(월드아트 썰매 언덕).
// 체험설계 v1 §7-3 추천안: 속도는 저절로(언덕 따라 빨라짐), 좌우만 조종, 굽은 길 1번·둔덕 2개(살짝 뜸), 길가 눈 더미에 닿으면 눈 파묻힘 뒤 이어서 미끄러짐,
//  다른 썰매와 부딪힘 없음, 멈춤 구역에서 일어난다. 기록 없음.
// 최고 속도 9m/s: 서버 순간이동 검사(maxSpeed 12m/s)보다 낮게.
import {SLED_RUN,heightAt} from './layout.js';

export const SLED_RULES=Object.freeze({maxSpeed:9,g:9.8,friction:.035,drag:.012,startSpeed:1.2,steer:1.9,edge:SLED_RUN.width/2-.32,bankSlow:.82,
 airMin:4.2,airSecs:.42,pushLen:4,pushSpeed:2.6,airH:.32,stopLen:2.6,inviteMs:5000,countdown:3,laneGap:1.0,back:.54});
// 길 가운데 선(출발대 → 멈춤 구역)의 누적 길이
const P=SLED_RUN.path,SEG=[];let TOTAL=0;
for(let i=0;i<P.length-1;i++){const l=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]);SEG.push({a:P[i],b:P[i+1],l,s:TOTAL});TOTAL+=l;}
export const RUN_LENGTH=TOTAL;
// 길이 s(m)에서 가운데 점과 진행 방향(단위 벡터). 끝을 넘으면 마지막 방향으로 곧게.
export function runAt(s){
 if(s<=0){const g=SEG[0],dx=(g.b[0]-g.a[0])/g.l,dz=(g.b[1]-g.a[1])/g.l;return {x:g.a[0]+dx*s,z:g.a[1]+dz*s,dx,dz};}
 for(const g of SEG)if(s<=g.s+g.l){const t=(s-g.s)/g.l,dx=(g.b[0]-g.a[0])/g.l,dz=(g.b[1]-g.a[1])/g.l;return {x:g.a[0]+(g.b[0]-g.a[0])*t,z:g.a[1]+(g.b[1]-g.a[1])*t,dx,dz};}
 const g=SEG.at(-1),dx=(g.b[0]-g.a[0])/g.l,dz=(g.b[1]-g.a[1])/g.l,e=s-TOTAL;return {x:g.b[0]+dx*e,z:g.b[1]+dz*e,dx,dz};
}
// 굽은 곳을 부드럽게: 앞뒤 1.5m 방향을 섞는다
function smoothDir(s){const a=runAt(s-1.5),b=runAt(s+1.5),dx=a.dx+b.dx,dz=a.dz+b.dz,l=Math.hypot(dx,dz)||1;return {dx:dx/l,dz:dz/l};}
// 출발대 줄(1~3) → 처음 옆 위치(줄마다 1m씩)
export const laneOffset=lane=>((lane??2)-2)*SLED_RULES.laneGap;
// 둔덕 자리(길 비율 u → 길이 s)
const BUMP_S=SLED_RUN.bumps.map(u=>u*TOTAL);

// 한 번 타기. 반환한 객체의 step(dt, steer -1~1)이 앞으로 간다. 이벤트: 'bank'(눈 더미)·'air'(둔덕에서 뜸)·'end'(멈춤)
export function createRide({lane=2,start=0}={}){
 const R={s:start,off:laneOffset(lane),v:SLED_RULES.startSpeed,air:0,airT:0,lastBank:-9,done:false,t:0,bumpsPassed:new Set()};
 function pose(){const c=runAt(R.s),d=smoothDir(R.s),nx=-d.dz,nz=d.dx,x=c.x+nx*R.off,z=c.z+nz*R.off;
  const lift=R.airT>0?SLED_RULES.airH*Math.sin(Math.PI*(1-R.airT/SLED_RULES.airSecs)):0;
  return {x,z,y:heightAt(x,z)+lift,heading:Math.atan2(-d.dx,-d.dz),speed:R.v,s:R.s,off:R.off,air:lift>0};}
 return {
  get s(){return R.s;},get v(){return R.v;},get off(){return R.off;},get done(){return R.done;},
  pose,
  step(dt,steer=0){
   const ev=[];if(R.done)return ev;R.t+=dt;
   const here=runAt(R.s),ahead=runAt(R.s+.6);
   const slope=(heightAt(here.x,here.z)-heightAt(ahead.x,ahead.z))/.6; // 내리막 +
   const stopZone=R.s>TOTAL-1;
   let a=SLED_RULES.g*slope-SLED_RULES.g*SLED_RULES.friction-SLED_RULES.drag*R.v*R.v;
   if(stopZone)a-=Math.max(3.2,R.v*1.8); // 멈춤 구역: 푹신한 눈으로 멈춤(둔덕 안에서)
   R.v=Math.max(stopZone?0:.6,Math.min(SLED_RULES.maxSpeed,R.v+a*dt));
   // 출발대는 평평하게 깎여 있어 밀고 나가는 속도를 준다(언덕 비탈에 닿을 때까지)
   if(R.s<SLED_RULES.pushLen)R.v=Math.max(R.v,SLED_RULES.pushSpeed);
   R.s+=R.v*dt;
   R.off+=steer*SLED_RULES.steer*dt*Math.min(1,.4+R.v/5);
   if(Math.abs(R.off)>SLED_RULES.edge){R.off=Math.sign(R.off)*SLED_RULES.edge;if(R.t-R.lastBank>.8){R.lastBank=R.t;R.v*=SLED_RULES.bankSlow;ev.push('bank');}}
   for(let i=0;i<BUMP_S.length;i++)if(!R.bumpsPassed.has(i)&&R.s>=BUMP_S[i]){R.bumpsPassed.add(i);if(R.v>=SLED_RULES.airMin){R.airT=SLED_RULES.airSecs;ev.push('air');}}
   if(R.airT>0)R.airT=Math.max(0,R.airT-dt);
   if(stopZone&&(R.v<.25||R.s>TOTAL+SLED_RULES.stopLen)){R.done=true;ev.push('end');}
   return ev;
  },
 };
}
