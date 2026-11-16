// 온라인 크리스마스 — 눈싸움 규칙(월드개발, 2026-11-16). 서버(room-play.js)·화면(snowfight-play.js)이 같이 쓰는 순수 모듈(three 없음).
// 체험설계 v1 §7-2 추천안:
//  - 눈싸움 마당 안에서만 던지고, 마당 안 사람만 맞는다(지나가는 사람·모닥불은 절대 안 맞음). 피해·점수 없음.
//  - 손에 3개, 「눈 뭉치기」 1초에 1개, 가만히 있어도 3초마다 1개. 던지기 간격 0.8초(서버도 같은 값으로 거름).
//  - 판정은 서버: 던진 자리·방향·거리로 날아가는 선을 만들고, 마당 안 사람(마지막 자리) 중 선에 가장 먼저 닿는 사람 또는 눈벽에서 멈춘다.
//  - 같은 사람이 같은 사람에게 10초에 5번 넘게 맞히면 그 뒤 10초는 맞아도 연출을 작게(soft).
import {SNOWBALL_YARD} from './layout.js';

export const FIGHT=Object.freeze({ammo:3,refillMs:3000,packMs:1000,gapMs:800,speed:13,minDist:2.5,maxDist:14,hand:.35,hitR:.42,
 autoCone:Math.PI/3,autoRange:12,forward:9,coverMs:2000,stackMs:5000,maxCover:3,softN:5,softMs:10000,wallH:.7});
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
// 던지기 판정. from {x,z}, 방향 (dx,dz), 거리 dist, people [{id,x,z}](던진 사람 빼고, 마당 안만 맞음).
// 반환 {x,z(시작=손), tx,tz(멈춘 자리), d(날아간 거리), hit(id|null), wall(bool), ms(날아가는 시간)}
export function resolveThrow({x,z,dx,dz,dist},people=[],{walls=SNOWBALL_YARD.walls}={}){
 const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
 const d0=Math.max(FIGHT.minDist,Math.min(FIGHT.maxDist,Number.isFinite(dist)?dist:FIGHT.forward));
 const sx=x+dx*FIGHT.hand,sz=z+dz*FIGHT.hand;
 // 눈벽: 0.1m씩 따라가며 처음 닿는 곳(포물선 높이가 벽보다 높은 가운데 구간은 넘어간다)
 let end=d0,wall=false;
 for(let s=.1;s<=d0;s+=.1){const k=s/d0,h=.9+4*1.1*k*(1-k)-.9*k; // 손 높이 0.9m → 가운데 약 1.5m → 끝 0
  if(h>FIGHT.wallH+.1)continue;if(inWall(sx+dx*s,sz+dz*s,walls)){end=s;wall=true;break;}}
 // 사람: 선에 가장 가까운 거리가 hitR 안이고 가장 먼저 닿는 사람(마당 안만)
 let hit=null,best=Infinity;
 for(const p of people){if(!inFightYard(p.x,p.z,-.3))continue;const px=p.x-sx,pz=p.z-sz,t=px*dx+pz*dz;if(t<0||t>end+FIGHT.hitR)continue;
  const off=Math.hypot(px-dx*t,pz-dz*t);if(off<=FIGHT.hitR&&t<best){best=t;hit=p.id;}}
 if(hit)end=Math.max(.3,Math.min(end,best));
 const tx=sx+dx*end,tz=sz+dz*end;
 return {x:sx,z:sz,tx,tz,d:end,hit,wall:!hit&&wall,ms:Math.round(end/FIGHT.speed*1000)+120};
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
