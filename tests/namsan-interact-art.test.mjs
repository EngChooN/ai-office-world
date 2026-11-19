// 남산 상호작용 그림(약수터·물확·돌탑 무리·사랑의 자물쇠) 자리·그림 점검(월드아트 11-19). 그림은 src/namsan/namsan-interact-art.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround,courseAt,NAMSAN} from '../src/namsan/namsan-data.js';
import {planNamsanInteract,buildNamsanInteract,INTERACT,BASIN} from '../src/namsan/namsan-interact-art.js';
import {planNamsanLamps} from '../src/namsan/namsan-lamps-art.js';
import {wallLine,WALL,buildLanterns} from '../src/namsan/namsan-art.js';

const dir='assets/shared/namsan/';
const meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},
 course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:JSON.parse(readFileSync(dir+'walls.json','utf8')).walls,busRoad:JSON.parse(readFileSync(dir+'bus-road.json','utf8'))};
const G=createNamsanGround(data);
const lamps=planNamsanLamps(G,{walls:data.walls}).spots,lanterns=buildLanterns(G).userData.spots;
const opts={walls:data.walls,lamps,lanterns,items:[]};
const plan=planNamsanInteract(G,opts);
const wallP=data.walls.map(w=>wallLine(G,w)).filter(Boolean).flatMap(l=>l.P);
const wallD=(x,z)=>Math.min(...wallP.map(p=>Math.hypot(p.x-x,p.z-z)));
const lampD=(x,z)=>Math.min(...lamps.map(l=>Math.hypot(l.x-x,l.z-z)));

test('네 가지 모두 자리가 잡힌다(약수터 1·물확 2·돌탑 무리 1·자물쇠 난간 1)', ()=>{
 assert.ok(plan.spring,'약수터');assert.equal(plan.basins.length,2,'물확 2곳');assert.ok(plan.cairn,'돌탑');assert.ok(plan.locks,'자물쇠');
});

test('약수터: 중간 쉼터 옆(±35m), 길·성곽·가로등과 겹치지 않음', ()=>{
 const sp=plan.spring;assert.ok(Math.abs(sp.s-NAMSAN.rest.s)<=35,`쉼터에서 ${Math.abs(sp.s-NAMSAN.rest.s).toFixed(1)}m`);
 assert.ok(G.nearest(sp.x,sp.z).distance>NAMSAN.pathWidth/2+.3,'길 위');assert.ok(wallD(sp.x,sp.z)>WALL.thick/2+2,'성곽 속');assert.ok(lampD(sp.x,sp.z)>2.2,'가로등 겹침');
});

test('물확: 두 곳이 서로 멀고(400m 이상), 길 밖·계단 아님·평평한 곳, 실개천은 길에서 멀어지며 내려간다', ()=>{
 const [a,b]=plan.basins;assert.ok(Math.abs(a.s-b.s)>400,`${a.s}·${b.s}m`);
 for(const p of plan.basins){
  assert.ok(!courseAt(G.points,p.s).stairs,`${p.id} 계단 옆`);
  assert.ok(G.nearest(p.x,p.z).distance>NAMSAN.pathWidth/2+.5,`${p.id} 길 위`);
  assert.ok(wallD(p.x,p.z)>WALL.thick/2+2.2,`${p.id} 성곽 가까움`);
  const e=p.runnel.at(-1);assert.ok(G.nearest(e.x,e.z).distance>G.nearest(p.x,p.z).distance,`${p.id} 실개천이 길 쪽으로`);
  assert.ok(G.ground(e.x,e.z)<=G.ground(p.x,p.z)+.05,`${p.id} 실개천이 오르막`);
 }
});

test('돌탑 무리: 정상 광장 돌 테 밖, 성곽에서 8m 이상, 버스 차로·코스와 떨어짐', ()=>{
 const c=plan.cairn,P=G.plaza,d=Math.hypot(c.x-P.x,c.z-P.z);
 assert.ok(d>P.r+2&&d<P.r+8,`광장 가운데에서 ${d.toFixed(1)}m`);
 assert.ok(wallD(c.x,c.z)>=INTERACT.cairn.wallClear,`성곽 ${wallD(c.x,c.z).toFixed(1)}m`);
 assert.ok(G.bus.nearest(c.x,c.z).distance>6,'버스 차로');assert.ok(G.nearest(c.x,c.z).distance>=6,'코스');
});

test('자물쇠 난간: 정상 광장 안 가장자리 호, 버스 고리·가로등·코스 끝과 떨어짐', ()=>{
 const L=plan.locks,P=G.plaza,end=G.points.at(-1);
 assert.ok(Math.abs(L.radius-(P.r-INTERACT.locks.inset))<1e-6);
 for(let j=0;j<=10;j++){const f=L.a0-L.span/2+L.span*j/10,x=P.x+Math.sin(f)*L.radius,z=P.z+Math.cos(f)*L.radius;
  assert.ok(G.bus.cycle.nearest(x,z).distance>3,'버스 고리');assert.ok(lampD(x,z)>2.6,'가로등');assert.ok(Math.hypot(x-end.x,z-end.z)>9,'코스 끝');}
});

test('그림: 그리기 횟수·삼각형 상한, 자리 4종, 자물쇠 걸기', ()=>{
 const ia=buildNamsanInteract(G,opts),{count,spots,locks}=ia.userData;
 assert.ok(count.draws<=22,`그리기 ${count.draws}번`);assert.ok(count.triangles<50000,`삼각형 ${count.triangles}`);
 assert.deepEqual(spots.map(s=>s.kind).sort(),['cairnField','loveLocks','spring','stream','stream']);
 for(const s of spots){assert.ok(Number.isFinite(s.x+s.y+s.z+s.face),s.id);}
 const dip=spots.find(s=>s.kind==='stream');assert.ok(Math.abs(dip.waterAt[1]-(plan.basins[0].y+BASIN.waterY))<.01);
 const c0=locks.count();assert.ok(c0.slots>=200&&c0.filled<c0.slots,'빈 자리 남음');
 const open=locks.slots().filter(s=>!s.filled&&s.bay===INTERACT.locks.openBay);assert.ok(open.length>=20,`새로 걸 칸 빈 자리 ${open.length}`);
 const at=locks.hang(open[0].i,{color:'#ff5d7a',heart:true});assert.ok(Array.isArray(at)&&at.length===3);
 assert.equal(locks.count().filled,c0.filled+1);assert.equal(locks.hang(open[0].i),null,'같은 자리 두 번 못 검');
 for(let t=0;t<=3;t+=.1)ia.userData.update(t,t/3,null); // 동작 끝까지(오류 없이)
 assert.ok(locks.nearestEmpty(spots.find(s=>s.kind==='loveLocks').x,spots.find(s=>s.kind==='loveLocks').z)>=0);
});
