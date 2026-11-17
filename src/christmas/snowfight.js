// 온라인 크리스마스 — 눈싸움 규칙(월드개발, 2026-11-16). 서버(room-play.js)·화면(snowfight-play.js)이 같이 쓰는 순수 모듈(three 없음).
// 체험설계 v1 §7-2 추천안:
//  - 눈싸움 마당 안에서만 던지고, 마당 안 사람만 맞는다(지나가는 사람·모닥불은 절대 안 맞음). 피해·점수 없음.
//  - 손에 3개, 「눈 뭉치기」 1초에 1개, 가만히 있어도 3초마다 1개. 던지기 간격 0.8초(서버도 같은 값으로 거름).
//  - 판정은 서버: 던진 자리·방향·거리로 날아가는 선을 만들고, 마당 안 사람 중 선에 가장 먼저 닿는 사람 또는 눈벽에서 멈춘다.
//    11-17 6차부터 사람 자리는 「눈덩이가 그 사람 자리를 지나가는 순간」(startFlight·sweepFlight, 비켜서면 피함). resolveThrow는 과녁 연습·미리보기용.
//  - 같은 사람이 같은 사람에게 10초에 5번 넘게 맞히면 그 뒤 10초는 맞아도 연출을 작게(soft).
import {SNOWBALL_YARD} from './layout.js';

export const FIGHT=Object.freeze({ammo:3,refillMs:3000,packMs:1000,gapMs:800,speed:13,minDist:2.5,maxDist:14,hand:.35,hitR:.42,
 autoCone:Math.PI/3,autoRange:12,forward:9,coverMs:2000,stackMs:5000,maxCover:3,softN:5,softMs:10000,wallH:.7,
 // 11-17 조준(눈썰매-눈싸움-개선-v1 §2-1·§2-2): 힘 게이지 0~1초 → 4m + 게이지×10m, 고리 지름 0.8→1.2m(멀수록), 보정 0.5m 안 사람 쪽으로 최대 0.4m,
 //  머리 맞힘 = 닿을 때 눈덩이 높이 0.75m 이상, 웅크리면 키 0.6m(눈벽 뒤 안 맞음), 맞은 뒤 0.6초 못 던짐·1.0초 무적
 gaugeSecs:1,aimMin:4,aimRange:10,ringD:.8,ringMaxD:1.2,assistR:.5,assistMax:.4,headH:.75,crouchH:.6,stunMs:600,invulnMs:1000,dots:12});
export const FIGHT_TEXT=Object.freeze({
 enter:'눈싸움 마당이에요. 안에 있으면 눈덩이를 맞을 수 있어요',outside:'눈덩이는 눈싸움 마당 안에서만 던질 수 있어요',
 empty:'눈덩이가 없어요. 「눈 뭉치기」를 누르거나 잠깐 기다려 주세요',gap:'',offline:'연결이 돌아오면 다시 눌러 주세요',
});
// 마당 안인지(m만큼 안쪽)
export const inFightYard=(x,z,m=0)=>Math.abs(x-SNOWBALL_YARD.x)<=SNOWBALL_YARD.w/2-m&&Math.abs(z-SNOWBALL_YARD.z)<=SNOWBALL_YARD.d/2-m;
// 눈벽 상자(village.js boxC와 같은 크기: 길이 × 0.6, 돌림은 three rotation.y). 점이 상자 안이면 true.
const WALL_D=.6;
export function inWall(x,z,walls=SNOWBALL_YARD.walls){
 for(const [wx,wz,len,ry] of walls){const co=Math.cos(ry),si=Math.sin(ry),dx=x-wx,dz=z-wz,lx=dx*co-dz*si,lz=dx*si+dz*co;if(Math.abs(lx)<=len/2&&Math.abs(lz)<=WALL_D/2)return true;}
 return false;
}
// 눈덩이 높이(m): 날아간 비율 k(0~1)에서. 손 0.9m → 가운데 약 1.5m → 끝 0. 미리보기 점선·날아가는 모습·서버 판정이 같은 식을 쓴다.
export const arcHeight=k=>.9+4*1.1*k*(1-k)-.9*k;
// 던지기 판정. from {x,z}, 방향 (dx,dz), 거리 dist, people [{id,x,z,crouch?,safe?}](던진 사람 빼고, 마당 안만 맞음, safe = 무적 중이라 통과).
// 반환 {x,z(시작=손), tx,tz(멈춘 자리), d(날아간 거리), d0(겨눈 거리), hit(id|null), head(머리 맞힘), wall(bool), ms(날아가는 시간)}
export function resolveThrow({x,z,dx,dz,dist},people=[],{walls=SNOWBALL_YARD.walls}={}){
 const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
 const d0=Math.max(FIGHT.minDist,Math.min(FIGHT.maxDist,Number.isFinite(dist)?dist:FIGHT.forward));
 const sx=x+dx*FIGHT.hand,sz=z+dz*FIGHT.hand;
 // 눈벽: 0.1m씩 따라가며 처음 닿는 곳(포물선 높이가 벽보다 높은 가운데 구간은 넘어간다)
 let end=d0,wall=false;
 for(let s=.1;s<=d0;s+=.1){if(arcHeight(s/d0)>FIGHT.wallH+.1)continue;if(inWall(sx+dx*s,sz+dz*s,walls)){end=s;wall=true;break;}}
 // 웅크린 사람: 바로 앞 1.5m 안에 눈벽이 선 위에 있으면 숨은 것(높이와 상관없이 안 맞음)
 const hidden=t=>{for(let s=Math.max(.1,t-1.5);s<t-.15;s+=.1)if(inWall(sx+dx*s,sz+dz*s,walls))return true;return false;};
 // 사람: 선에 가장 가까운 거리가 hitR 안이고 가장 먼저 닿는 사람(마당 안만)
 let hit=null,best=Infinity,hitP=null;
 for(const p of people){if(p.safe||!inFightYard(p.x,p.z,-.3))continue;const px=p.x-sx,pz=p.z-sz,t=px*dx+pz*dz;if(t<0||t>end+FIGHT.hitR)continue;
  const off=Math.hypot(px-dx*t,pz-dz*t);if(off>FIGHT.hitR||t>=best)continue;
  // 웅크리면 키가 작아 위로 지나가는 눈덩이는 안 맞고, 눈벽 뒤면 숨는다
  if(p.crouch&&(arcHeight(Math.min(1,t/d0))>FIGHT.crouchH+.15||hidden(t)))continue;
  best=t;hit=p.id;hitP=p;}
 if(hit)end=Math.max(.3,Math.min(end,best));
 const tx=sx+dx*end,tz=sz+dz*end,head=!!hit&&!hitP.crouch&&arcHeight(Math.min(1,end/d0))>=FIGHT.headH;
 return {x:sx,z:sz,tx,tz,d:end,d0,hit,head,wall:!hit&&wall,ms:Math.round(end/FIGHT.speed*1000)+120};
}
// ── 11-17 6차(대표 결정 「피할 수 있게」): 맞음은 눈덩이가 지나가는 순간의 자리로 정한다.
// 던질 때는 길(손 → 눈벽 또는 겨눈 거리)만 정하고(startFlight), 날아가는 동안 서버가 0.1초마다 지난 구간 [s0,s1]에 지금 있는 사람을 본다(sweepFlight).
// 옆으로 비켜서면 안 맞고, 웅크리기·눈벽·무적 규칙은 resolveThrow와 같다. 날아간 거리 s(t) = d × (지난 시간 / ms) — 화면 눈덩이와 같은 빠르기.
export function startFlight({x,z,dx,dz,dist},{walls=SNOWBALL_YARD.walls}={}){
 const l=Math.hypot(dx,dz)||1,r=resolveThrow({x,z,dx,dz,dist},[],{walls});
 return {...r,ux:dx/l,uz:dz/l,s:0};
}
export function sweepFlight(f,s0,s1,people=[],{walls=SNOWBALL_YARD.walls}={}){
 const {x:sx,z:sz,ux:dx,uz:dz,d0}=f,R=FIGHT.hitR;
 const hidden=t=>{for(let s=Math.max(.1,t-1.5);s<t-.15;s+=.1)if(inWall(sx+dx*s,sz+dz*s,walls))return true;return false;};
 let best=null;
 for(const p of people){if(p.safe||!inFightYard(p.x,p.z,-.3))continue;const px=p.x-sx,pz=p.z-sz,t=px*dx+pz*dz;
  // 이번 구간 앞뒤로 hitR씩 겹쳐 본다(사람이 눈덩이 쪽으로 걸어와도 0.1초 사이에 빠져나가지 않게)
  if(t<0||t>f.d+R||t<s0-R||t>s1+R)continue;
  if(Math.hypot(px-dx*t,pz-dz*t)>R||(best&&t>=best.t))continue;
  if(p.crouch&&(arcHeight(Math.min(1,t/d0))>FIGHT.crouchH+.15||hidden(t)))continue;
  best={t,p};}
 if(!best)return null;
 const end=Math.max(.3,Math.min(f.d,best.t));
 return {id:best.p.id,d:end,tx:sx+dx*end,tz:sz+dz*end,head:!best.p.crouch&&arcHeight(Math.min(1,end/d0))>=FIGHT.headH};
}
// ── 조준(화면·시험 공용)
// 힘 게이지(누른 시간 초 → 0~1). 가득 찬 뒤 0.5초 넘으면 full(깜빡임)이지만 값은 1 그대로(손해 없음)
export const gaugeOf=sec=>Math.max(0,Math.min(1,sec/FIGHT.gaugeSecs));
export const gaugeDist=g=>FIGHT.aimMin+Math.max(0,Math.min(1,g))*FIGHT.aimRange;
// 휴대폰 ❄️ 끌기 길이(px) → 거리. 20px 아래는 방향만(거리는 게이지), 20~120px = 4~14m. 40px 아래로 짧게 끌면 게이지 우선
export const DRAG=Object.freeze({min:20,max:120,gaugeUnder:40,tapMs:200});
export function dragDist(len,g){if(len<DRAG.gaugeUnder)return gaugeDist(g);return FIGHT.aimMin+Math.min(1,(len-DRAG.min)/(DRAG.max-DRAG.min))*FIGHT.aimRange;}
// 고리 지름(m): 4m 안 0.8m → 14m 1.2m
export const ringDiameter=d=>FIGHT.ringD+(FIGHT.ringMaxD-FIGHT.ringD)*Math.max(0,Math.min(1,(d-FIGHT.aimMin)/FIGHT.aimRange));
// 조준 보정: 겨눈 점 (tx,tz)에서 0.5m 안에 사람이 있으면 가장 가까운 사람 쪽으로 최대 0.4m 끌어당긴 점과 그 사람
export function assistPoint(tx,tz,people=[]){
 let best=null;for(const p of people){if(p.safe)continue;const d=Math.hypot(p.x-tx,p.z-tz);if(d<=FIGHT.assistR&&(!best||d<best.d))best={d,p};}
 if(!best)return {x:tx,z:tz,target:null};
 const k=Math.min(1,FIGHT.assistMax/Math.max(1e-6,best.d));return {x:tx+(best.p.x-tx)*k,z:tz+(best.p.z-tz)*k,target:best.p.id};
}
// 조준 한 번: 내 자리 me{x,z}, 겨눈 점(땅) → 보낼 방향·거리 + 미리보기(서버와 같은 resolveThrow). people은 판정과 같은 목록
export function planThrow(me,tx,tz,people=[]){
 const a=assistPoint(tx,tz,people);let dx=a.x-me.x,dz=a.z-me.z,d=Math.hypot(dx,dz);
 if(d<.3){dx=0;dz=-1;d=FIGHT.minDist;}
 // 시작점은 손(앞으로 0.35m)이라 거리에서 손 몫을 빼야 끝점이 겨눈 점에 떨어진다
 const dist=Math.max(FIGHT.minDist,Math.min(FIGHT.maxDist,d-FIGHT.hand));
 const r=resolveThrow({x:me.x,z:me.z,dx,dz,dist},people);
 return {dx:dx/d,dz:dz/d,dist,target:a.target,r};
}
// 점선 미리보기 점들(손 → 끝, 끝은 벽에 막힌 곳까지). [{x,y(땅 위 높이),z,end?,blocked?}]
export function arcDots(r,n=FIGHT.dots){
 const out=[],dx=(r.tx-r.x)/(r.d||1),dz=(r.tz-r.z)/(r.d||1);
 for(let i=0;i<=n;i++){const s=r.d*i/n;out.push({x:r.x+dx*s,z:r.z+dz*s,y:arcHeight(Math.min(1,s/r.d0)),end:i===n,blocked:r.wall&&i>=n-1});}
 return out;
}
// 휴대폰 짧게 누름: 앞쪽 60° 안 12m 이내 가장 가까운 사람에게(없으면 정면 9m). heading 0 = -Z.
export function autoAim(me,heading,people=[]){
 const fx=-Math.sin(heading),fz=-Math.cos(heading);let best=null;
 for(const p of people){if(!inFightYard(p.x,p.z,-.3))continue;const dx=p.x-me.x,dz=p.z-me.z,d=Math.hypot(dx,dz);if(d<.6||d>FIGHT.autoRange)continue;
  const cos=(dx*fx+dz*fz)/d;if(cos<Math.cos(FIGHT.autoCone/2))continue;if(!best||d<best.d)best={d,dx:dx/d,dz:dz/d,id:p.id};}
 return best?{dx:best.dx,dz:best.dz,dist:best.d+.2,target:best.id}:{dx:fx,dz:fz,dist:FIGHT.forward,target:null};
}
// 손에 든 눈덩이(화면 쪽): 3초마다 1개, 뭉치면 1개, 던지면 -1, 간격 0.8초
export function createAmmo({now=()=>Date.now()}={}){
 let n=FIGHT.ammo,refillAt=now(),lastThrow=-Infinity;
 const tick=()=>{const t=now();if(n>=FIGHT.ammo){refillAt=t;return;}while(n<FIGHT.ammo&&t-refillAt>=FIGHT.refillMs){n++;refillAt+=FIGHT.refillMs;}};
 return {
  get n(){tick();return n;},
  canThrow(){tick();return n>0&&now()-lastThrow>=FIGHT.gapMs;},
  take(){tick();if(n<=0||now()-lastThrow<FIGHT.gapMs)return false;if(n===FIGHT.ammo)refillAt=now();n--;lastThrow=now();return true;},
  pack(){tick();if(n<FIGHT.ammo){n++;if(n===FIGHT.ammo)refillAt=now();}return n;},
  reset(){n=FIGHT.ammo;refillAt=now();},
 };
}
// 같은 사람 집중 공격 완화(서버): hits(thrower,target,t) → 이번 맞힘이 연출 작게(soft)인지
export function createHarassGuard(){
 const log=new Map();
 return {hit(from,to,t){const k=`${from}>${to}`,a=(log.get(k)??[]).filter(x=>t-x<FIGHT.softMs);a.push(t);log.set(k,a);
  if(log.size>200)for(const [kk,v] of log)if(!v.length||t-v.at(-1)>FIGHT.softMs)log.delete(kk);return a.length>FIGHT.softN;}};
}
