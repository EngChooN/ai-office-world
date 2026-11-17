// 썰매 산 케이블카(곤돌라) 계산(월드개발, 2026-11-17). three 없음 — 화면(gondola-play.js)·시험·다른 사람 높이 계산이 같이 쓴다.
//  - 마을 쪽 승강장(BASE, 광장 북동쪽) ↔ 꼭대기 승강장(TOP, 출발대 북서쪽). 케이블은 기둥 두 개를 거치는 꺾은선(기둥 위는 둥글게).
//  - 한 번 타기 7.5초(처음·끝 1.2초는 서서히 출발·도착). 「건너뛰기」는 남은 길을 2초에 빠르게 감는다(순간이동 없음 —
//    다른 사람 화면에서도 위치가 끊기지 않게 이어진다. 서버 위치 검사는 act.gd일 때만 한도를 넓힘).
//  - 다른 사람 화면: 위치(x,z)는 보통처럼 받고, 높이는 케이블 선에 내려 계산(cabinYAt). act.gd 1 = 올라가는 중 · 2 = 내려가는 중.
import {START_H,SUMMIT} from './sled-course.js';

export const GONDOLA=Object.freeze({
 // 승강장 탑승 자리(바닥 높이 = 땅). heading은 타는 쪽을 볼 때
 base:Object.freeze({x:20.5,z:-24.6,y:0}),
 top:Object.freeze({x:SUMMIT.x,z:SUMMIT.z+1,y:START_H}),
 hang:2.75,          // 케이블에서 객실 바닥까지(m)
 station:2.9,        // 승강장 안 케이블 높이(바닥 위)
 secs:7.5,ease:1.2,skipSecs:2,
 near:3.2,           // 이 거리 안이면 「타고 올라가기」·「내려가기」 단추
 // 기둥 두 개(객실 바닥 높이 y): 마을 쪽 기둥에서 높이 올라 산을 비스듬히 건너고, 꼭대기 앞 기둥에서 출발대 위(사람이 기다리는 평평한 곳)로만 내려온다 — 썰매가 달리는 줄 위는 높게 지난다
 towers:Object.freeze([Object.freeze({x:2,z:-52,y:21}),Object.freeze({x:-30.5,z:-99.5,y:31})]),
});
const G=GONDOLA;
// 케이블 꺾은선(객실 바닥 높이 기준): 승강장 바닥 → 가운데 기둥 → 꼭대기 승강장 바닥
const lerp=(a,b,t)=>a+(b-a)*t;
const A={x:G.base.x,z:G.base.z,y:G.base.y+.12},B={x:G.top.x,z:G.top.z,y:G.top.y+.12};
// 꺾은선 A → 기둥들 → B를 기둥 위만 둥글게(2차 곡선) 이어 0.5m쯤 간격 점으로
const PTS=(()=>{const K=[A,...G.towers.map(t=>({x:t.x,z:t.z,y:t.y})),B],out=[];
 const dir=(p,q)=>{const d=Math.hypot(q.x-p.x,q.z-p.z);return {x:(q.x-p.x)/d,z:(q.z-p.z)/d};};
 // 승강장 앞 4m는 평평(바닥에서 바로 떠오르지 않게)
 const da=dir(A,K[1]),db=dir(B,K[K.length-2]);K.splice(1,0,{x:A.x+da.x*4,z:A.z+da.z*4,y:A.y,flat:1});K.splice(K.length-1,0,{x:B.x+db.x*4,z:B.z+db.z*4,y:B.y,flat:1});
 const mix=(p,q,t)=>({x:lerp(p.x,q.x,t),z:lerp(p.z,q.z,t),y:lerp(p.y,q.y,t)});
 const add=(p)=>{const l=out.at(-1);if(!l||Math.hypot(p.x-l.x,p.z-l.z,p.y-l.y)>.05)out.push(p);};
 const line=(p,q)=>{const n=Math.max(1,Math.ceil(Math.hypot(q.x-p.x,q.z-p.z,q.y-p.y)/.5));for(let i=0;i<=n;i++)add(mix(p,q,i/n));};
 const quad=(p,c,q)=>{const n=16;for(let i=0;i<=n;i++){const t=i/n,u=1-t;add({x:u*u*p.x+2*u*t*c.x+t*t*q.x,z:u*u*p.z+2*u*t*c.z+t*t*q.z,y:u*u*p.y+2*u*t*c.y+t*t*q.y});}};
 // 꺾이는 점마다 앞뒤 일부(최대 6m)를 2차 곡선으로
 let cur=K[0];
 for(let i=1;i<K.length;i++){const k=K[i];
  if(i===K.length-1){line(cur,k);break;}
  const nx=K[i+1],d1=Math.hypot(k.x-cur.x,k.z-cur.z),d2=Math.hypot(nx.x-k.x,nx.z-k.z),r=Math.min(6,d1*.45,d2*.45);
  const p1=mix(k,cur,r/d1),p2=mix(k,nx,r/d2);line(cur,p1);quad(p1,k,p2);cur=p2;}
 let L=0;out.forEach((p,i)=>{if(i)L+=Math.hypot(p.x-out[i-1].x,p.z-out[i-1].z,p.y-out[i-1].y);p.l=L;});
 return out;})();
export const CABLE=Object.freeze(PTS.map(p=>Object.freeze(p)));
export const CABLE_LEN=PTS.at(-1).l;
export const TOWERS=Object.freeze(G.towers.map(t=>Object.freeze({x:t.x,z:t.z,y:t.y})));
export const MID_TOWER=TOWERS[0];
// 길이 비율 f(0 = 마을 승강장, 1 = 꼭대기) → 객실 바닥 자리·진행 방향(heading: 0 = -Z를 봄)
export function cabinAt(f){
 const l=Math.max(0,Math.min(1,f))*CABLE_LEN;let i=1;while(i<PTS.length-1&&PTS[i].l<l)i++;
 const a=PTS[i-1],b=PTS[i],t=(l-a.l)/((b.l-a.l)||1);
 const dx=b.x-a.x,dz=b.z-a.z;
 return {x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),y:lerp(a.y,b.y,t),heading:Math.atan2(-dx,-dz)};
}
// 시간 → 길 비율(처음·끝 ease초는 서서히). 0~1
export function rideFraction(t,secs=G.secs,ease=G.ease){
 const T=secs,e=Math.min(ease,T/2),v=1/(T-e);if(t<=0)return 0;if(t>=T)return 1;
 if(t<e)return v*t*t/(2*e);if(t>T-e){const r=T-t;return 1-v*r*r/(2*e);}return v*(t-e/2);
}
// x,z(다른 사람 받은 위치) → 케이블 위 객실 바닥 높이(가장 가까운 점)
export function cabinYAt(x,z){let best=null;for(let i=1;i<PTS.length;i++){const a=PTS[i-1],b=PTS[i],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);
 if(!best||d<best.d)best={d,y:lerp(a.y,b.y,t),f:(a.l+(b.l-a.l)*t)/CABLE_LEN};}return best;}
// 한 번 타기 상태(화면·시험 공용). dir 1 = 올라감(마을 → 꼭대기), -1 = 내려감. skip() = 남은 길을 skipSecs에 감기
export function createGondolaRide(dir=1){
 let t=0,skipFrom=null,done=false;
 const frac=()=>{let f;if(skipFrom){const k=Math.min(1,(t-skipFrom.t)/G.skipSecs),e=k*k*(3-2*k);f=skipFrom.f+(1-skipFrom.f)*e;}else f=rideFraction(t);return f;};
 return {
  get dir(){return dir;},get t(){return t;},get done(){return done;},get skipping(){return !!skipFrom;},
  get progress(){return frac();},
  step(dt){if(done)return true;t+=dt;const f=frac();if(f>=1-1e-6){done=true;}return done;},
  skip(){if(!skipFrom&&!done)skipFrom={t,f:frac()};},
  pose(){const f=frac(),c=cabinAt(dir>0?f:1-f);return {...c,heading:dir>0?c.heading:c.heading+Math.PI};},
 };
}
// 승강장 근처인지: 'base' | 'top' | null
export function nearStation(x,z,r=G.near){if(Math.hypot(x-G.base.x,z-G.base.z)<r)return 'base';if(Math.hypot(x-G.top.x,z-G.top.z)<r)return 'top';return null;}
