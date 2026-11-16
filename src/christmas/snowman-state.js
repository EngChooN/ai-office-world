// 온라인 크리스마스 — 눈사람 만들기 규칙(월드개발, 2026-11-16). 서버(room-play.js)·화면(snowman-play.js)이 같이 쓰는 순수 모듈(three 없음).
// 체험설계 v1 §7-1 추천안:
//  - 눈사람 마당 안에서 「눈덩이 만들기」 → 발 앞에 작은 눈덩이(지름 0.3m). 마당 안 눈덩이는 최대 6개.
//  - 굴리기: 몸을 대고 밀면 굴러 간 거리만큼 커진다(작음 ~0.5m → 중간 ~0.9m → 큼 ~1.3m에서 멈춤). 같이 밀면 2명 1.5배·3명 이상 2배.
//  - 쌓기: 아래가 위보다 한 단계 이상 커야 한다. 2단이면 완성할 수 있고 3단까지.
//  - 꾸미기: 눈(돌)·코(당근)가 있어야 「완성」. 붙인 부품은 붙인 사람만 30초 안에 뗀다.
//  - 완성: 트리 앞 전시 줄 8자리 중 빈 곳(다 찼으면 가장 오래된 자리). 이름판은 참여한 사람 이름만(최대 3명 + 외 n명).
//  - 3분 동안 아무도 안 건드린 미완성 눈덩이는 녹아 사라진다.
import {SNOWMAN_YARD} from './layout.js';

export const SNOWMAN_RULES=Object.freeze({maxBalls:SNOWMAN_YARD.maxBalls,startR:.15,maxR:.65,grow:.045,coopMs:700,maxStep:.8,reach:1.5,stackReach:2.4,meltMs:3*60000,undoMs:30000,display:8,maxStack:3,names:3});
export const SNOWMAN_PARTS=Object.freeze(['eyes','nose','mouth','arms','hat','scarf']);
export const SNOWMAN_NEED=Object.freeze(['eyes','nose']);
// 반지름 → 크기 단계(0 작음·1 중간·2 큼). 경계는 지름 0.7m·1.1m.
export const ballStage=r=>r<.35?0:r<.55?1:2;
export const STAGE_LABEL=Object.freeze(['작음','중간','큼']);
// 같이 미는 사람 수 → 커지는 배수
export const coopMul=n=>n>=3?2:n===2?1.5:1;
export const SNOWMAN_TEXT=Object.freeze({
 full:'마당에 눈덩이가 많아요. 하나를 완성하거나 굴려 보세요',outside:'눈사람 마당 안에서 만들 수 있어요',far:'눈덩이에 더 가까이 가 주세요',
 order:'아래 눈덩이가 더 커야 해요',tall:'눈사람은 3단까지 쌓을 수 있어요',stacked:'쌓은 눈사람은 굴릴 수 없어요',
 need:'눈(돌)과 코(당근)를 붙이면 완성할 수 있어요',single:'눈덩이를 하나 더 쌓아야 꾸밀 수 있어요',undo:'붙인 부품은 붙인 사람만 30초 안에 뗄 수 있어요',
 gone:'그 눈덩이는 이제 없어요',bad:'지금은 할 수 없어요',offline:'연결이 돌아오면 다시 눌러 주세요',
});
const rnd=v=>Math.round(v*100)/100;
export const inYard=(x,z,m=0)=>Math.abs(x-SNOWMAN_YARD.x)<=SNOWMAN_YARD.w/2-m&&Math.abs(z-SNOWMAN_YARD.z)<=SNOWMAN_YARD.d/2-m;
const clampYard=(x,z,m)=>[Math.max(SNOWMAN_YARD.x-SNOWMAN_YARD.w/2+m,Math.min(SNOWMAN_YARD.x+SNOWMAN_YARD.w/2-m,x)),Math.max(SNOWMAN_YARD.z-SNOWMAN_YARD.d/2+m,Math.min(SNOWMAN_YARD.z+SNOWMAN_YARD.d/2-m,z))];

// 마당 상태(방 하나). 눈덩이 한 개 = {id,x,z,r:[아래부터 반지름…],parts:{이름:{id,at}},by:[이름…](참여 순),pushers:Map(사람 id→시각),at(마지막으로 건드린 시각)}
export function createSnowmanState({rules=SNOWMAN_RULES}={}){
 const balls=new Map();const display=new Array(rules.display).fill(null);let seq=0;
 const touch=(b,name,t)=>{b.at=t;if(name&&!b.by.includes(name))b.by.push(name);};
 const pushersNow=(b,t)=>{for(const [id,at] of b.pushers)if(t-at>rules.coopMs)b.pushers.delete(id);return b.pushers.size;};
 // 화면에 보내는 한 줄
 const row=(b,t)=>({id:b.id,x:rnd(b.x),z:rnd(b.z),r:b.r.map(rnd),p:Object.keys(b.parts),n:t===undefined?b.pushers.size:pushersNow(b,t)});
 const no=reason=>({ok:false,reason});
 return {
  balls,display,row,
  make(pid,name,x,z,t){
   if(!inYard(x,z))return no('outside');
   if(balls.size>=rules.maxBalls)return no('full');
   const [cx,cz]=clampYard(x,z,rules.startR);
   const b={id:`b${(++seq).toString(36)}`,x:cx,z:cz,r:[rules.startR],parts:{},by:[],pushers:new Map(),at:t};touch(b,name,t);balls.set(b.id,b);
   return {ok:true,ball:b};
  },
  // 밀기: 미는 사람의 자리(px,pz, 서버가 아는 자리)와 눈덩이가 갈 자리(x,z). 한 번에 maxStep까지, 마당 안으로.
  push(pid,name,id,x,z,t,{px=null,pz=null}={}){
   const b=balls.get(id);if(!b)return no('gone');
   if(b.r.length>1)return no('stacked');
   if(![x,z].every(Number.isFinite))return no('bad');
   if(px!==null&&Math.hypot(px-b.x,pz-b.z)>b.r[0]+rules.reach)return no('far'); // 미는 사람이 지금 눈덩이 옆에 있어야
   let dx=x-b.x,dz=z-b.z,d=Math.hypot(dx,dz);if(d>rules.maxStep){dx*=rules.maxStep/d;dz*=rules.maxStep/d;d=rules.maxStep;}
   const [nx,nz]=clampYard(b.x+dx,b.z+dz,b.r[0]);d=Math.hypot(nx-b.x,nz-b.z);
   b.pushers.set(pid,t);const n=pushersNow(b,t);
   b.x=nx;b.z=nz;b.r[0]=Math.min(rules.maxR,b.r[0]+d*rules.grow*coopMul(n));touch(b,name,t);
   return {ok:true,ball:b,n};
  },
  // 쌓기: upper(한 덩이)를 lower 위에. lower 맨 위보다 한 단계 이상 작아야 함.
  stack(pid,name,lowerId,upperId,t){
   const lo=balls.get(lowerId),up=balls.get(upperId);if(!lo||!up||lo===up)return no('gone');
   if(up.r.length>1)return no('stacked');if(lo.r.length>=rules.maxStack)return no('tall');
   if(Math.hypot(lo.x-up.x,lo.z-up.z)>lo.r[0]+up.r[0]+rules.stackReach)return no('far');
   if(ballStage(lo.r.at(-1))<=ballStage(up.r[0]))return no('order');
   lo.r.push(up.r[0]);for(const n of up.by)touch(lo,n,t);touch(lo,name,t);balls.delete(up.id);
   return {ok:true,ball:lo,removed:up.id};
  },
  // 꾸미기 부품 붙이기(on)·떼기(off)
  deco(pid,name,id,part,on,t){
   const b=balls.get(id);if(!b)return no('gone');if(!SNOWMAN_PARTS.includes(part))return no('bad');
   if(b.r.length<2)return no('single');
   if(on){if(b.parts[part])return {ok:true,ball:b,same:true};b.parts[part]={id:pid,at:t};touch(b,name,t);return {ok:true,ball:b};}
   const p=b.parts[part];if(!p)return {ok:true,ball:b,same:true};
   if(p.id!==pid||t-p.at>rules.undoMs)return no('undo');
   delete b.parts[part];b.at=t;return {ok:true,ball:b};
  },
  // 완성 → 전시 자리. 반환 {ok,entry,replaced(자리를 비운 옛 눈사람 있으면 true),removed:id}
  finish(pid,name,id,t){
   const b=balls.get(id);if(!b)return no('gone');if(b.r.length<2)return no('single');
   if(!SNOWMAN_NEED.every(p=>b.parts[p]))return no('need');
   touch(b,name,t);balls.delete(id);
   let slot=display.findIndex(d=>!d),replaced=false;
   if(slot<0){slot=0;for(let i=1;i<display.length;i++)if(display[i].at<display[slot].at)slot=i;replaced=true;}
   const entry={slot,r:b.r.map(rnd),p:SNOWMAN_PARTS.filter(k=>b.parts[k]),names:b.by.slice(0,rules.names),more:Math.max(0,b.by.length-rules.names),at:t};
   display[slot]=entry;return {ok:true,entry,replaced,removed:id};
  },
  // 녹기(3분 손 안 댄 눈덩이). 사라진 id 목록
  melt(t){const out=[];for(const [id,b] of balls)if(t-b.at>=rules.meltMs){balls.delete(id);out.push(id);}return out;},
  get(id){return balls.get(id)??null;},
  // 들어올 때 보내는 전체 상태 {t:'snow',b:[줄…],d:[전시…]}
  snapshot(t){return {t:'snow',b:[...balls.values()].map(b=>row(b,t)),d:display.map(d=>d?{...d}:null)};},
  reset(){balls.clear();display.fill(null);},
 };
}
// 받은 눈덩이 줄 검사(화면)
export function sanitizeBallRow(b){
 if(!b||typeof b.id!=='string'||b.id.length>12||!Number.isFinite(b.x)||!Number.isFinite(b.z)||!Array.isArray(b.r)||!b.r.length||b.r.length>SNOWMAN_RULES.maxStack)return null;
 if(!b.r.every(v=>Number.isFinite(v)&&v>0&&v<=1))return null;
 return {id:b.id,x:b.x,z:b.z,r:b.r.slice(),p:Array.isArray(b.p)?b.p.filter(k=>SNOWMAN_PARTS.includes(k)):[],n:Number.isInteger(b.n)?Math.max(0,Math.min(20,b.n)):0};
}
export function sanitizeDisplay(d){
 if(!d||!Number.isInteger(d.slot)||d.slot<0||d.slot>=SNOWMAN_RULES.display||!Array.isArray(d.r)||d.r.length<2||d.r.length>SNOWMAN_RULES.maxStack||!d.r.every(v=>Number.isFinite(v)&&v>0&&v<=1))return null;
 return {slot:d.slot,r:d.r.slice(),p:Array.isArray(d.p)?d.p.filter(k=>SNOWMAN_PARTS.includes(k)):[],names:Array.isArray(d.names)?d.names.slice(0,SNOWMAN_RULES.names).map(n=>String(n).slice(0,24)):[],more:Number.isInteger(d.more)?d.more:0,at:Number.isFinite(d.at)?d.at:0};
}
// 이름판 글: "하나·둘·셋 외 2명"
export const namesText=d=>`${(d.names??[]).join('·')||'누군가'}${d.more?` 외 ${d.more}명`:''}`;
