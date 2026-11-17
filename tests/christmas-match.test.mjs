// 눈싸움 「한 판」(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §2-3·§2-4): 팀 배정·15초 대기·90초×3라운드(2선승)·점수·같은 편·집중 공격·나간 사람·결과·칭호·한 판 더.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFightMatch,MATCH} from '../src/christmas/fight-match.js';
import {createRoomPlay} from '../src/christmas/room-play.js';
import {sideSpot} from '../src/christmas/fight-ui.js';
import {inFightYard} from '../src/christmas/snowfight.js';
import * as L from '../src/christmas/layout.js';

const T0=11_000_000,FY=L.SNOWBALL_YARD;
function room(names){const mem=new Map(),out=[];for(const n of names)mem.set(n,{id:n,name:n});return {mem,out,ctx:{members:mem,send:(id,m)=>{out.push({to:id,...m});return true;},all:m=>out.push({to:'*',...m})}};}
const last=out=>out.filter(m=>m.t==='sbm').at(-1);
// 시간을 앞으로 돌리며 tick
function advance(M,ctx,t,ms){const end=t+ms;for(;t<end;t+=100)M.tick(t,ctx);return end;}

test('팀: 들어온 순서대로 적은 쪽, 2명이면 15초 대기 후 시작, 그 사이 들어온 사람도 참가',()=>{
 const M=createFightMatch(),{mem,out,ctx}=room(['a','b','c','d','e']);let t=T0;
 M.handle(mem.get('a'),{t:'sbm:join'},t,ctx);assert.equal(last(out).left,-1,'혼자면 기다림');
 M.handle(mem.get('b'),{t:'sbm:join'},t+1000,ctx);assert.deepEqual(last(out).tm,{a:1,b:2});assert.ok(last(out).left>14000);
 M.handle(mem.get('c'),{t:'sbm:join'},t+5000,ctx);M.handle(mem.get('d'),{t:'sbm:join'},t+6000,ctx);assert.deepEqual(last(out).tm,{a:1,b:2,c:1,d:2});
 t=advance(M,ctx,t+6000,10500);assert.equal(M.state.ph,'round');assert.equal(M.state.rd,1);
 M.handle(mem.get('e'),{t:'sbm:join'},t,ctx);assert.equal(out.at(-1).reason,'busy','경기 중에는 못 들어옴');
});
test('점수: 맞힘 +1·머리 +2·같은 편 0(ff)·집중 공격(soft) 0, 라운드 밖은 점수 없음',()=>{
 const M=createFightMatch(),{mem,out,ctx}=room(['a','b','c']);let t=T0;
 for(const n of ['a','b','c'])M.handle(mem.get(n),{t:'sbm:join'},t,ctx);
 assert.equal(M.scoreHit('a','b',{t},ctx),null,'대기 중 0');
 t=advance(M,ctx,t,MATCH.waitMs+200);
 assert.deepEqual(M.scoreHit('a','b',{d:6,t},ctx),{pts:1});assert.deepEqual(M.scoreHit('a','b',{head:true,d:9,t},ctx),{pts:2});
 assert.deepEqual(M.scoreHit('a','c',{t},ctx),{pts:0,ff:1});assert.deepEqual(M.scoreHit('b','a',{soft:true,t},ctx),{pts:0});
 assert.deepEqual(M.scoreHit('x','a',{t},ctx),null,'참가자 아니면 점수 없음');
 assert.deepEqual(last(out).sc,[3,0]);
});
test('3라운드 2선승: 빨강이 두 라운드 이기면 2라운드에서 끝, 결과·칭호(같은 수면 먼저 이룬 사람)',()=>{
 const M=createFightMatch(),{mem,out,ctx}=room(['a','b','c','d']);let t=T0;
 for(const n of ['a','b','c','d'])M.handle(mem.get(n),{t:'sbm:join'},t,ctx); // a·c 빨강, b·d 초록
 t=advance(M,ctx,t,MATCH.waitMs+200);
 M.scoreHit('a','b',{d:5,t:t+1},ctx);M.scoreHit('c','b',{d:11,t:t+2},ctx);M.scoreHit('d','a',{d:4,t:t+3},ctx);
 t=advance(M,ctx,t,MATCH.roundMs+MATCH.stopMs+300);assert.equal(M.state.ph,'break');assert.deepEqual(M.state.wins,[1,0]);
 t=advance(M,ctx,t,MATCH.breakMs+200);assert.equal(M.state.ph,'round');assert.equal(M.state.rd,2);assert.deepEqual(M.state.sc,[0,0],'라운드마다 점수 새로');
 M.scoreHit('c','d',{head:true,d:7,t:t+1},ctx);
 t=advance(M,ctx,t,MATCH.roundMs+MATCH.stopMs+300);
 const v=last(out);assert.equal(v.ph,'result');assert.equal(v.res.win,1);assert.deepEqual(v.res.wins,[2,0]);assert.deepEqual(v.res.rr,[1,1]);
 assert.equal(v.res.titles.ace,'c','c 2번(먼저 2번 이룸)');assert.equal(v.res.titles.snow,'b');assert.equal(v.res.titles.snipe,'c');
 const c=v.res.ppl.find(p=>p.id==='c');assert.deepEqual([c.hits,c.heads,c.far],[2,1,11]);
});
test('무승부 라운드 = 둘 다 0.5승, 3라운드까지 가면 승수로(같으면 무승부)',()=>{
 const M=createFightMatch(),{mem,out,ctx}=room(['a','b']);let t=T0;
 for(const n of ['a','b'])M.handle(mem.get(n),{t:'sbm:join'},t,ctx);
 t=advance(M,ctx,t,MATCH.waitMs+200);
 for(let r=0;r<3;r++){t=advance(M,ctx,t,MATCH.roundMs+MATCH.stopMs+300);if(M.state?.ph==='break')t=advance(M,ctx,t,MATCH.breakMs+200);}
 const v=out.filter(m=>m.t==='sbm'&&m.ph==='result').at(-1);assert.ok(v,'3라운드 뒤 결과');assert.deepEqual(v.res.wins,[1.5,1.5]);assert.equal(v.res.win,0);assert.deepEqual(v.res.rr,[0,0,0]);
});
test('중간에 나간 사람은 점수를 남기고 빠지고, 한 팀이 비면 판이 끝남 · 10명까지 · 한 판 더는 같은 사람 그대로',()=>{
 const names=Array.from({length:11},(_,i)=>`p${i}`),M=createFightMatch(),{mem,out,ctx}=room(names);let t=T0;
 for(const n of names)M.handle(mem.get(n),{t:'sbm:join'},t,ctx);assert.equal(Object.keys(last(out).tm).length,MATCH.max);assert.equal(out.at(-1).reason,'full');
 t=advance(M,ctx,t,MATCH.waitMs+200);
 M.scoreHit('p1','p0',{d:3,t},ctx);
 // 빨강(짝수) 모두 나감 → 끝
 for(let i=0;i<10;i+=2)mem.delete(`p${i}`);M.tick(t+100,ctx);
 const v=last(out);assert.equal(v.ph,'result');assert.equal(v.res.win,2,'남은 초록 팀 승');assert.ok(v.res.ppl.find(p=>p.id==='p1').hits===1);assert.equal(v.res.ppl.find(p=>p.id==='p0').left,1);
 // 한 판 더: 남은 사람 그대로 새 대기
 M.handle(mem.get('p3'),{t:'sbm:join'},t+2000,ctx);const w=last(out);assert.equal(w.ph,'wait');assert.equal(Object.keys(w.tm).length,5);assert.equal(w.host,'p3');
});
test('혼자 「한 판 하기」 뒤 나가면 판이 없어지고, 연 사람은 「바로 시작」',()=>{
 const M=createFightMatch(),{mem,out,ctx}=room(['a','b']);
 M.handle(mem.get('a'),{t:'sbm:join'},T0,ctx);M.handle(mem.get('a'),{t:'sbm:leave'},T0+10,ctx);assert.equal(M.state,null);assert.equal(last(out).ph,'none');
 M.handle(mem.get('a'),{t:'sbm:join'},T0+20,ctx);M.handle(mem.get('b'),{t:'sbm:join'},T0+30,ctx);M.handle(mem.get('b'),{t:'sbm:go'},T0+40,ctx);assert.equal(M.state.ph,'wait','연 사람만');
 M.handle(mem.get('a'),{t:'sbm:go'},T0+50,ctx);assert.equal(M.state.ph,'round');
});
test('서버 판정(room-play): 한 판 라운드 중 맞히면 sb에 점수(pts), 같은 편이면 ff',()=>{
 const play=createRoomPlay(),out=[],mem=new Map();
 const add=(id,x)=>mem.set(id,{id,name:id,state:{x,y:FY.z},act:{}});add('a',FY.x-4);add('b',FY.x);add('c',FY.x-1);
 const ctx={members:mem,send:(id,m)=>{out.push(m);return true;},all:m=>out.push(m)};
 for(const id of ['a','b','c'])play.handle(mem.get(id),{t:'sbm:join'},T0,ctx);
 for(let t=T0;t<T0+MATCH.waitMs+300;t+=100)play.tick(t,ctx);
 const t=T0+MATCH.waitMs+400;
 play.handle(mem.get('a'),{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:3.6},t,ctx);let sb=out.filter(m=>m.t==='sb').at(-1);assert.equal(sb.hit,'c');assert.equal(sb.ff,1,'a·c 같은 빨강');
 mem.get('c').state={x:FY.x-1,y:FY.z+3};
 play.handle(mem.get('a'),{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:3.6},t+1000,ctx);sb=out.filter(m=>m.t==='sb').at(-1);assert.equal(sb.hit,'b');assert.equal(sb.pts,1);
});
test('진영: 라운드마다 바뀌고 마당 가장자리 1m 안·마당 안',()=>{
 const a=sideSpot(1,1),b=sideSpot(2,1),c=sideSpot(1,2);
 assert.ok(a.x<FY.x&&b.x>FY.x&&c.x>FY.x);
 for(const p of [a,b,c,sideSpot(2,2,3,5)]){assert.ok(inFightYard(p.x,p.z));assert.ok(Math.abs(Math.abs(p.x-FY.x)-FY.w/2)<=1+1e-9);}
});
