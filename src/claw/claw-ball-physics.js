// 새 기계 ③ 공 구멍 넣기 「공 떨어뜨리기」 공 움직임(월드공통개발, 2026-11-27). three를 쓰지 않는다(node 시험·화면 공용).
// 규칙서 §3: 4×4 구멍 판(간격 6cm) 위로 집게가 공을 놓으면 튀고 굴러 구멍 하나에 멈춘다(평평한 판 + 벽 되튐 — 반드시 구멍 하나).
//  - 한 공만, 고정 시간 칸(1/240초)으로 미리 끝까지 계산해 길(path)을 만든다(그림은 그 길을 시각대로 따라감). 공 하나라 휴대폰에서도 한 판 약 1천 칸 = 1ms 안팎(시험이 잼).
//  - 튐: 판에 닿을 때마다 위로 되튐(반발 restitution) + 옆으로 흩어짐(kick, 첫 튐이 가장 큼) — 실제 탁구공이 판 무늬에 맞아 튀는 것을 흉내.
//  - 구르기: 칸마다 구멍 쪽으로 아주 얕게 파인 판(funnel) + 마찰. 느려지면 가장 가까운 구멍에 빠짐. 둘레 벽은 되튐.
//  - 희귀 구멍(작은 구멍): 첫 튐이 칸 안쪽 rareIn(60%) 안이어야 그 구멍 쪽 판이 파여 들어감. 아니면 그 칸은 볼록(굴러 지나감 → rolledRare = 「아까움」).
// 결과 구멍은 이 계산이 정함(뽑는 사람 화면). 구경하는 화면은 받은 구멍에서 끝나는 길을 같은 식으로 새로 찾아 그림(ballPathTo).
import {CLAW_TUNING} from './claw-rules.js';

export const BALL_SIM=Object.freeze({dt:1/240,g:9.8,restitution:.66,kick:.2,kickFall:.75,airFriction:.4,carry:.05,rollSpeed:.04,wallBounce:.55,maxSec:4,minBounceV:.18});
const B=()=>CLAW_TUNING.ball;
export const holeKey=(i,j)=>`${i},${j}`;
export const holeIndex=(i,j)=>j*B().n+i;
export const holeOfIndex=v=>{const n=B().n;return [v%n,Math.floor(v/n)];};
export const holeXY=(i,j,c=B())=>[(i+.5)*c.pitchM-c.n*c.pitchM/2,(j+.5)*c.pitchM-c.n*c.pitchM/2];
const cellOf=(x,z,c)=>{const h=c.n*c.pitchM/2,cl=v=>Math.max(0,Math.min(c.n-1,Math.floor((v+h)/c.pitchM)));return [cl(x),cl(z)];};
/** 씨앗 난수(같은 씨앗 = 같은 길). 정규분포는 박스-뮬러 */
export function ballRng(seed){let a=seed>>>0||1;const u=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 return {u,g:()=>{let x=0,y=0;while(!x)x=u();while(!y)y=u();return Math.sqrt(-2*Math.log(x))*Math.cos(2*Math.PI*y);}};}

/**
 * 공 한 번 떨어뜨리기. from = 집게 자리(판 좌표 m), seed = 씨앗. o.rareKey = 희귀 구멍 'i,j'.
 * ① 튐(물리): 떨어짐·되튐(restitution)·옆 흩어짐(kick, 튈 때마다 작아짐)·벽 되튐 — 튐이 잦아든 자리가 멈출 칸을 정함
 * ② 구르기: 그 칸 구멍 쪽으로 파인 판을 따라 굴러 들어감(감쇠 용수철). 희귀 칸은 안쪽 rareIn 밖이면 작은 구멍 위를 굴러 지나 옆 칸으로(rolledRare)
 * 반환 {path:[{t,x,z,h,sink}], hole:'i,j', i, j, rolledRare, bounces:[t…], settle:{x,z}, sec}
 */
export function simulateBall(from,seed,{rareKey=B().rare,S=BALL_SIM,c=B()}={}){
 const R=ballRng(seed),half=c.n*c.pitchM/2,lim=half-c.ballR;
 let x=from.x,z=from.z,h=c.carryH,vx=0,vz=0,vy=0,t=0,nb=0;
 const [ri,rj]=rareKey.split(',').map(Number);
 const path=[{t:0,x,z,h,sink:0}],bounces=[];let k=0;
 const wall=()=>{if(x<-lim){x=-lim;vx=-vx*S.wallBounce;}else if(x>lim){x=lim;vx=-vx*S.wallBounce;}if(z<-lim){z=-lim;vz=-vz*S.wallBounce;}else if(z>lim){z=lim;vz=-vz*S.wallBounce;}};
 // ① 튐
 for(let s=0;s<S.maxSec/S.dt;s++){t+=S.dt;vy-=S.g*S.dt;h+=vy*S.dt;
  if(h<=0){h=0;const v=-vy;if(v<=S.minBounceV){vy=0;path.push({t,x,z,h:0,sink:0});break;}
   vy=v*S.restitution;const kick=S.kick*v*Math.pow(S.kickFall,nb);vx+=R.g()*kick*.5;vz+=R.g()*kick*.5;bounces.push(t);nb++;path.push({t,x,z,h:0,sink:0});}
  const f=Math.exp(-S.airFriction*S.dt);vx*=f;vz*=f;x+=vx*S.dt;z+=vz*S.dt;wall();
  if(++k%6===0)path.push({t,x,z,h,sink:0});}
 // ② 구르기: 멈출 칸 = 지금 자리 칸(+ 남은 속도로 조금 더 감)
 x=Math.max(-lim,Math.min(lim,x+vx*S.carry));z=Math.max(-lim,Math.min(lim,z+vz*S.carry));
 const settle={x,z};let [ci,cj]=cellOf(x,z,c),rolledRare=false;const via=[];
 if(ci===ri&&cj===rj){const [rx,rz]=holeXY(ri,rj,c);if(Math.hypot(x-rx,z-rz)>c.rareIn*c.pitchM/2){
   // 작은 구멍 위를 굴러 지나감: 구멍 가운데를 지나 같은 방향 옆 칸(벽이면 되돌아 가까운 칸)으로
   rolledRare=true;via.push([rx,rz]);const dx=rx-x,dz=rz-z,ax=Math.abs(dx)>=Math.abs(dz);let ni=ci+(ax?Math.sign(dx)||1:0),nj=cj+(ax?0:Math.sign(dz)||1);
   if(ni<0||ni>=c.n)ni=ci-(Math.sign(dx)||1);if(nj<0||nj>=c.n)nj=cj-(Math.sign(dz)||1);ci=Math.max(0,Math.min(c.n-1,ni));cj=Math.max(0,Math.min(c.n-1,nj));}}
 const [hx,hz]=holeXY(ci,cj,c),pts=[[path.at(-1).x,path.at(-1).z],...via,[hx,hz]];
 // 굴러가는 길: 점 사이를 곧게, 빠르기는 처음 빠르고 점점 느리게(거리에 맞춰 1.0~1.8초 — 튐까지 합쳐 약 2초, 규칙서 「2~3초 구경거리」) + 구멍 둘레에서 한 번 휘돎
 let len=0;for(let q=1;q<pts.length;q++)len+=Math.hypot(pts[q][0]-pts[q-1][0],pts[q][1]-pts[q-1][1]);
 const dur=Math.min(1.8,Math.max(1.0,len/S.rollSpeed)),N=Math.max(8,Math.round(dur*30)),t0=t;
 const at=d=>{let acc=0;for(let q=1;q<pts.length;q++){const a=pts[q-1],b=pts[q],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(acc+L>=d||q===pts.length-1){const u=L?Math.min(1,(d-acc)/L):1;return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];}acc+=L;}return pts.at(-1);};
 const sw=R.u()*Math.PI*2;
 for(let q=1;q<=N;q++){const u=q/N,e=1-(1-u)*(1-u),[px,pz]=at(e*len),wob=(1-u)*u*c.pitchM*.18;path.push({t:t0+u*dur,x:px+Math.cos(sw+u*9)*wob,z:pz+Math.sin(sw+u*9)*wob,h:0,sink:0});}
 t=t0+dur;path.push({t:t+.18,x:hx,z:hz,h:0,sink:1});
 return {path,hole:holeKey(ci,cj),i:ci,j:cj,rolledRare,bounces,settle,sec:t+.18};
}
/** 길 위 시각 t의 공 자리(앞뒤 점 사이를 곧게) */
export function ballAt(path,t){if(t<=0)return path[0];for(let k=1;k<path.length;k++){const b=path[k];if(t<=b.t){const a=path[k-1],q=(t-a.t)/Math.max(1e-6,b.t-a.t);return {x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q,h:a.h+(b.h-a.h)*q,sink:a.sink+(b.sink-a.sink)*q};}}return path.at(-1);}
/** 판정: hole = 'i,j', holes = {'i,j':인형}(노랑·희귀), pityKey = 도움 구멍(보장 판만). 성공 / 색 구멍 가로·세로 바로 옆 또는 희귀 구멍 위를 굴러 지나감 = 아까움 / 그 밖 실패 */
export function judgeBall(sim,{holes,pityKey=null,rolledRare=sim.rolledRare}){
 const open={...holes,...(pityKey?{[pityKey]:'pity'}:{})};
 if(open[sim.hole])return {r:'win',hole:sim.hole,pity:sim.hole===pityKey};
 const [i,j]=sim.hole.split(',').map(Number),adj=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>open[holeKey(i+a,j+b)]);
 return {r:adj||rolledRare?'near':'miss',hole:sim.hole,why:rolledRare&&!adj?'rare':adj?'adj':''};
}
/** 구경 화면: from에서 떨어져 받은 구멍(v = j×n+i)에서 끝나는 길(씨앗을 바꿔 가며 찾음, 없으면 마지막 길 끝을 그 구멍으로) */
export function ballPathTo(from,v,{rareKey=B().rare,tries=240}={}){
 const [ti,tj]=holeOfIndex(v);let last=null;
 for(let s=1;s<=tries;s++){const r=simulateBall(from,s*7919,{rareKey});if(r.i===ti&&r.j===tj)return r;last=r;}
 const [hx,hz]=holeXY(ti,tj),p=last.path.filter(q=>q.sink<1),end=p.at(-1);p.push({t:end.t+.35,x:hx,z:hz,h:0,sink:0},{t:end.t+.53,x:hx,z:hz,h:0,sink:1});
 return {...last,path:p,hole:holeKey(ti,tj),i:ti,j:tj,sec:end.t+.53};
}
