// 하늘 썰매(월드개발, 2026-11-18): 규칙 숫자·범위·못 내리는 곳·이륙/착지 계산(sky-rules.js), act hs·위치 높이 a(규격·서버), 하늘의 사람은 눈덩이에 안 맞음.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SKY,HS,inAir,skyBounds,inSkyBounds,avoidPillars,noLandZone,canSit,nearestLanding,takeoffClear,takeoffAlt,takeoffProgress,landAlt,clampAlt,encodeAlt,guessAlt,teamMode,canBoard,nearStation} from '../src/christmas/sky-rules.js';
import {REINDEER_STATION} from '../src/christmas/festive-layout.js';
import {SNOWBALL_YARD,SNOWMAN_YARD,TREE} from '../src/christmas/layout.js';
import {sanitizeAct,decodeState} from '../src/multi-protocol.js';
import {createRooms,ROOM_DEFAULTS} from '../server/rooms.mjs';
import {createRoomPlay} from '../src/christmas/room-play.js';
import {SLEIGH} from '../src/christmas/sky-sleigh.js';

const T0=1_800_000_000_000;

test('대표 결정 숫자: 범위 38m·z≥−26·높이 6~20m, 속도는 서버 위치 한도 안',()=>{
 assert.equal(SKY.radius,38);assert.equal(SKY.zMin,-26);assert.equal(SKY.altMin,6);assert.equal(SKY.altMax,20);
 assert.ok(SKY.flyFast<ROOM_DEFAULTS.maxSpeed&&SKY.groundFast<ROOM_DEFAULTS.maxSpeed,'최고 속도 9m/s < 서버 12m/s');
 assert.equal(clampAlt(3),6);assert.equal(clampAlt(25),20);assert.equal(clampAlt(12),12);
 assert.deepEqual(Object.values(HS),[0,1,2,3,4]);assert.equal(inAir(HS.ground),false);assert.equal(inAir(HS.takeoff),true);assert.equal(inAir(HS.land),true);
});
test('범위: 38m 원·북쪽 선을 넘으면 안으로, 경계 4m 앞부터 안쪽으로 휨',()=>{
 let b=skyBounds(40,0,0);assert.ok(Math.abs(Math.hypot(b.x-TREE.x,b.z-TREE.z)-38)<1e-9);assert.equal(b.near,true);
 b=skyBounds(0,-30,0);assert.equal(b.z,-26);assert.equal(b.near,true);
 b=skyBounds(5,5,0);assert.equal(b.near,false);assert.ok(inSkyBounds(5,5));assert.ok(!inSkyBounds(0,-27));
 // 동쪽 끝에서 동쪽(heading −π/2 = +X)을 보고 있으면 1초 동안 안쪽(서쪽)으로 돈다
 const h0=-Math.PI/2;let h=h0;for(let i=0;i<20;i++)h=skyBounds(36.5,0,h,.05).heading;
 const fx=-Math.sin(h);assert.ok(fx< -Math.sin(h0),'바깥으로 가는 성분이 줄어듦');
});
test('기둥 피하기: 트리(4m·10.5m 아래)·케이블카 승강장(6m·9m 아래)',()=>{
 const p=avoidPillars(TREE.x+1,TREE.z,8);assert.ok(Math.hypot(p.x-TREE.x,p.z-TREE.z)>=5-1e-9);
 const q=avoidPillars(TREE.x+1,TREE.z,11);assert.deepEqual(q,{x:TREE.x+1,z:TREE.z});
});
test('못 내리는 곳: 두 마당·링크·회전목마·트리 둘레·범위 밖, 광장 바닥은 됨',()=>{
 assert.equal(noLandZone(SNOWBALL_YARD.x,SNOWBALL_YARD.z),'fight');assert.equal(noLandZone(SNOWMAN_YARD.x,SNOWMAN_YARD.z),'snowman');
 assert.equal(noLandZone(-15.5,30.5),'rink');assert.equal(noLandZone(TREE.x+2,TREE.z),'tree');assert.equal(noLandZone(0,-30),'out');
 assert.equal(noLandZone(-6,10),null);
 // 마당 한가운데에서 내려앉으려 하면 마당 밖 가장 가까운 땅
 const L=nearestLanding(SNOWBALL_YARD.x,SNOWBALL_YARD.z,0);
 assert.ok(L.d>0&&canSit(L.x,L.z,0));assert.equal(noLandZone(L.x,L.z),null);
 // 막힘(집 등)도 피함
 const blocked=(x,z)=>Math.hypot(x+6,z-10)<3;assert.equal(canSit(-6,10,0,blocked),false);
});
test('이륙: 정류장 썰매는 바로 날아오를 수 있는 쪽을 봄 · 트리를 보면 막힘 · 높이 곡선',()=>{
 const W=REINDEER_STATION.sleigh,fx=W.x-Math.sin(W.heading)*SLEIGH.tow,fz=W.z-Math.cos(W.heading)*SLEIGH.tow;
 assert.deepEqual(takeoffClear(fx,fz,W.heading),{ok:true});
 assert.equal(takeoffClear(0,9,0).ok,false); // 트리 쪽(−Z)
 assert.equal(takeoffAlt(0),0);assert.equal(takeoffAlt(SKY.dashSecs),0);assert.ok(Math.abs(takeoffAlt(SKY.dashSecs+SKY.riseSecs)-6)<1e-9);
 assert.equal(takeoffProgress(SKY.dashSecs+SKY.riseSecs),1);
 assert.equal(landAlt(10,0),10);assert.equal(landAlt(10,.75),0);assert.equal(landAlt(10,1),0);assert.ok(landAlt(10,.4)<10&&landAlt(10,.4)>0);
 assert.ok(nearStation(REINDEER_STATION.x,REINDEER_STATION.z));assert.ok(!nearStation(0,0));
});
test('다른 사람 썰매: 높이를 못 받으면 모드로 짐작 · 그림 모드',()=>{
 assert.equal(guessAlt(HS.fly,0),10);assert.equal(guessAlt(HS.ground,3),0);assert.equal(guessAlt(HS.takeoff,0),0);
 assert.equal(teamMode(HS.ground,0),'stand');assert.equal(teamMode(HS.ground,2),'run');assert.equal(teamMode(HS.fly,0),'fly');
 assert.equal(encodeAlt(12.345),12.3);assert.equal(encodeAlt(40),25);
});
test('탈 수 있나: 다른 놀이 중이면 못 탐(설계 §7)',()=>{
 assert.equal(canBoard({}),true);assert.equal(canBoard({carousel:true}),false);assert.equal(canBoard({sled:false,sky:true}),true);
});
test('규격: act hs 0~4(언덕 눈썰매 sl과 따로) · 위치 메시지 a = 높이',()=>{
 assert.deepEqual(sanitizeAct('christmas',{hs:3,sl:0}),{hs:3,sl:0});
 assert.equal(sanitizeAct('christmas',{hs:5}),null);
 assert.equal(sanitizeAct('hiking',{hs:1}),null);
 assert.equal(decodeState({t:'s',id:'a',q:1,z:0,x:1,y:2,h:0,v:3,f:0,a:12.5}).alt,12.5);
 assert.equal(decodeState({t:'s',id:'a',q:1,z:0,x:1,y:2,h:0,v:3,f:0}).alt,undefined);
});
test('서버: 위치 메시지의 높이 a를 받아 다른 사람에게 넘김(0 이하는 빼고 30m까지)',()=>{
 let now=T0;const out=new Map();
 const rooms=createRooms({now:()=>now});
 const join=name=>{const box=[];const r=rooms.join({experience:'christmas',room:'눈마을-1',name,send:s=>box.push(JSON.parse(s))});out.set(name,box);return r.client;};
 const a=join('하나');join('둘');
 rooms.message(a,{t:'act',a:{o:'santa',hs:3}});
 now+=200;rooms.message(a,{t:'s',q:1,z:0,x:10,y:10,h:0,v:6,f:0,a:12.34});
 now+=200;rooms.tick?.();
 const seen=()=>out.get('둘').flatMap(m=>m.t==='snap'?m.p:m.t==='s'?[m]:[]).filter(s=>s.id===a.id);
 assert.equal(seen().at(-1).a,12.3);
 now+=200;rooms.message(a,{t:'s',q:2,z:0,x:10.5,y:10,h:0,v:6,f:0,a:99});now+=200;rooms.tick?.();assert.equal(seen().at(-1).a,30);
 now+=200;rooms.message(a,{t:'s',q:3,z:0,x:11,y:10,h:0,v:6,f:0,a:0});now+=200;rooms.tick?.();assert.equal('a' in seen().at(-1),false);
 assert.ok(out.get('둘').some(m=>m.t==='act'&&m.a.hs===3));
});
test('눈싸움 판정: 하늘의 사람(act.hs 2~4)은 눈덩이가 지나가도 안 맞고, 썰매 탄 사람은 못 던짐',()=>{
 const FY=SNOWBALL_YARD,play=createRoomPlay({}),members=new Map(),all=[];
 const add=(id,x,z,act={})=>members.set(id,{id,name:id,state:{x,y:z},act});
 const ctx={members,send:(id,m)=>{all.push({...m,to:id});return true;},all:m=>all.push(m),away:()=>false};
 add('a',FY.x-4,FY.z);add('sky',FY.x-2,FY.z,{hs:3});add('b',FY.x,FY.z);
 play.handle(members.get('a'),{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:9},T0,ctx);
 for(let i=1;i<=10;i++)play.tick(T0+i*100,ctx);
 const hit=all.find(m=>m.t==='sbh');assert.equal(hit?.hit,'b','하늘의 사람을 지나 땅의 사람이 맞음');
 // 땅(hs 1)에 있는 사람은 그대로 맞음
 all.length=0;members.get('sky').act={hs:1};
 play.handle(members.get('a'),{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:9},T0+5000,ctx);
 for(let i=1;i<=10;i++)play.tick(T0+5000+i*100,ctx);
 assert.equal(all.find(m=>m.t==='sbh')?.hit,'sky');
 // 하늘 썰매 탄 사람은 던지기 거절
 all.length=0;add('rider',FY.x+3,FY.z,{hs:1});
 play.handle(members.get('rider'),{t:'sb:throw',x:FY.x+3,z:FY.z,dx:-1,dz:0,d:9},T0+9000,ctx);
 assert.equal(all.find(m=>m.t==='sb:no')?.reason,'outside');
});
