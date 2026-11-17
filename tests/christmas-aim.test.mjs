// 눈싸움 조준·맞음(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §2-1·§2-2): 힘 게이지·끌기 거리·고리 크기·조준 보정·미리보기 = 판정·웅크림·머리 맞힘·무적.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FIGHT,resolveThrow,planThrow,arcDots,arcHeight,ringDiameter,gaugeOf,gaugeDist,dragDist,assistPoint,DRAG,inWall} from '../src/christmas/snowfight.js';
import {createRoomPlay} from '../src/christmas/room-play.js';
import * as L from '../src/christmas/layout.js';

const FY=L.SNOWBALL_YARD,T0=7_000_000;

test('힘 게이지: 0~1초 → 4~14m, 가득 찬 뒤에도 손해 없음',()=>{
 assert.equal(gaugeOf(0),0);assert.equal(gaugeOf(.5),.5);assert.equal(gaugeOf(1),1);assert.equal(gaugeOf(3),1);
 assert.equal(gaugeDist(0),4);assert.equal(gaugeDist(1),FIGHT.maxDist);assert.equal(gaugeDist(.5),9);
});
test('휴대폰 끌기: 20~120px = 4~14m, 40px 아래는 게이지, 톡 = 0.2초',()=>{
 assert.equal(dragDist(10,.3),gaugeDist(.3));assert.equal(dragDist(120,0),14);assert.equal(dragDist(500,0),14);
 assert.ok(Math.abs(dragDist(70,0)-9)<1e-9);assert.equal(DRAG.tapMs,200);
});
test('고리 지름: 가까우면 0.8m, 14m면 1.2m(멀수록 커짐)',()=>{
 assert.equal(ringDiameter(2),.8);assert.ok(Math.abs(ringDiameter(14)-1.2)<1e-9);assert.ok(ringDiameter(9)>.8&&ringDiameter(9)<1.2);
});
test('조준 보정: 고리 0.5m 안 사람 쪽으로 최대 0.4m만 끌어당김(자동 조준 아님)',()=>{
 const a=assistPoint(0,0,[{id:'p',x:.45,z:0}]);assert.equal(a.target,'p');assert.ok(Math.abs(a.x-.4)<1e-9);
 const b=assistPoint(0,0,[{id:'p',x:.2,z:0}]);assert.ok(Math.abs(b.x-.2)<1e-9,'0.4m보다 가까우면 그 사람 자리');
 assert.equal(assistPoint(0,0,[{id:'p',x:.8,z:0}]).target,null);
 assert.equal(assistPoint(0,0,[{id:'p',x:.3,z:0,safe:true}]).target,null,'무적 중인 사람은 끌어당기지 않음');
});
test('미리보기 = 판정: planThrow가 보낸 값으로 서버가 다시 판정해도 끝점이 같다(0.3m 안)',()=>{
 const me={x:FY.x-4,z:FY.z+5};
 for(const [tx,tz] of [[me.x+6,me.z],[me.x+3,me.z-4],[me.x+10,me.z+2],[me.x-5,me.z-5]]){
  const pl=planThrow(me,tx,tz,[]),r=resolveThrow({...me,dx:pl.dx,dz:pl.dz,dist:pl.dist},[]);
  assert.ok(Math.hypot(r.tx-pl.r.tx,r.tz-pl.r.tz)<1e-9);
  if(!pl.r.wall)assert.ok(Math.hypot(r.tx-tx,r.tz-tz)<.3,`겨눈 점 (${tx},${tz}) → 착탄 (${r.tx.toFixed(2)},${r.tz.toFixed(2)})`);
 }
 // 사람을 겨누면 그 사람이 맞는다
 const pl=planThrow(me,me.x+6,me.z+.3,[{id:'b',x:me.x+6,z:me.z}]);assert.equal(pl.r.hit,'b');assert.equal(pl.target,'b');
});
test('점선: 점 12개 + 끝, 손 0.9m에서 올라갔다 땅으로, 벽에 막히면 그곳까지·끝 회색',()=>{
 const r=resolveThrow({x:FY.x-4,z:FY.z+5,dx:1,dz:0,dist:8},[]);const d=arcDots(r);
 assert.equal(d.length,FIGHT.dots+1);assert.ok(Math.abs(d[0].y-.9)<1e-9);assert.ok(Math.max(...d.map(p=>p.y))>1.4);assert.ok(d.at(-1).y<.05);
 const [wx,wz]=FY.walls[0];const w=resolveThrow({x:wx-2.3,z:wz,dx:1,dz:0,dist:2.6},[]);assert.ok(w.wall);
 const wd=arcDots(w);assert.ok(wd.at(-1).blocked&&!wd[0].blocked);assert.ok(inWall(wd.at(-1).x,wd.at(-1).z)||Math.hypot(wd.at(-1).x-w.tx,wd.at(-1).z-w.tz)<1e-9);
 assert.ok(Math.abs(arcHeight(.5)-1.55)<.01,'가운데 약 1.5m');
});
test('웅크림: 눈벽 바로 뒤에 웅크리면 안 맞고, 서 있으면 맞는다',()=>{
 // 벽 0: 가운데 앞뒤로 겨눔. 벽 뒤 0.6m에 선 사람
 const [wx,wz,,ry]=FY.walls[0],nx=Math.sin(ry),nz=Math.cos(ry); // 벽 앞뒤 방향(상자의 짧은 쪽)
 const p={x:wx+nx*.75,z:wz+nz*.75},from={x:wx-nx*6,z:wz-nz*6};
 const dx=p.x-from.x,dz=p.z-from.z,dist=Math.hypot(dx,dz)+3; // 벽 너머로 높게(사람 뒤를 겨눔)
 const stand=resolveThrow({...from,dx,dz,dist},[{id:'b',...p}]),duck=resolveThrow({...from,dx,dz,dist},[{id:'b',...p,crouch:true}]);
 assert.equal(stand.hit,'b','서 있으면 포물선이 벽을 넘어 맞음');assert.equal(duck.hit,null,'웅크리면 벽 뒤에 숨음');
});
test('머리 맞힘: 사람 뒤를 겨눠 눈덩이가 0.75m 넘게 지나가며 닿으면 헤드샷, 발밑을 겨누면 몸',()=>{
 const me={x:FY.x-5,z:FY.z+6},b={id:'b',x:me.x+4,z:me.z};
 const head=resolveThrow({...me,dx:1,dz:0,dist:7},[b]),body=resolveThrow({...me,dx:1,dz:0,dist:3.7},[b]);
 assert.equal(head.hit,'b');assert.ok(head.head);assert.equal(body.hit,'b');assert.ok(!body.head);
});
test('서버: 맞은 뒤 1초 무적(통과)·0.6초 못 던짐, sb에 d0·head',()=>{
 const play=createRoomPlay(),out=[];
 const mem=(id,x,z,act={})=>({id,name:id,state:{x,y:z},act});
 const a=mem('a',FY.x-5,FY.z+6),b=mem('b',FY.x-1,FY.z+6),c=mem('c',FY.x-3,FY.z+3);
 const ctx={members:new Map([['a',a],['b',b],['c',c]]),send:(id,m)=>{out.push({to:id,...m});return true;},all:m=>out.push({to:'*',...m})};
 play.handle(a,{t:'sb:throw',x:a.state.x,z:a.state.y,dx:1,dz:0,d:7},T0,ctx);
 let sb=out.find(m=>m.t==='sb');assert.equal(sb.hit,'b');assert.ok(sb.d0>6);assert.equal(sb.head,1);
 // 0.5초 뒤 c가 b를 또 던짐 → 무적이라 통과
 out.length=0;play.handle(c,{t:'sb:throw',x:c.state.x,z:c.state.y,dx:2,dz:3,d:3.6},T0+500,ctx);sb=out.find(m=>m.t==='sb');assert.equal(sb.hit,null);
 // b는 맞은 뒤 0.6초 안에는 못 던짐
 out.length=0;play.handle(b,{t:'sb:throw',x:b.state.x,z:b.state.y,dx:-1,dz:0,d:4},T0+300,ctx);assert.equal(out[0].reason,'stun');
 out.length=0;play.handle(b,{t:'sb:throw',x:b.state.x,z:b.state.y,dx:-1,dz:0,d:4},T0+700,ctx);assert.equal(out[0].t,'sb');
 // 웅크림(act.cr)은 서버도 안다
 out.length=0;a.act={cr:1};play.handle(c,{t:'sb:throw',x:c.state.x,z:c.state.y,dx:-2,dz:3,d:3.6},T0+2000,ctx);assert.ok(out.find(m=>m.t==='sb'));
});
