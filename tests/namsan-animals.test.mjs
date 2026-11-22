// 남산 동물 연결(11-21): 관악산 동물 부품(animal-zones.js)을 남산 출현 구역·안전 범위(namsanTrailLanes)로 부른다.
// 출현 자리는 길가 1~5m·금지 밖, 배회 중 땅을 걷는 자리는 길가 안전 범위 또는 길을 가로지르는 길 위(금지 밖)여야 한다.
// 같은 구역·같은 시간 칸이면 같은 동물(함께 걷기 같은 방). 관악산 기본값(lanes 안 줌)은 tests/animal-zones.test.mjs가 그대로 지킨다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround,courseAt} from '../src/namsan/namsan-data.js';
import {wallLine} from '../src/namsan/namsan-art.js';
import {planNamsanInteract} from '../src/namsan/namsan-interact-art.js';
import {namsanAnimalZones} from '../src/namsan/namsan-animal-zones.js';
import {createNamsanAnimalLanes,namsanTrailLanes,NAMSAN_ANIMAL_MIN_OFFSET} from '../src/namsan/namsan-animal-lanes.js';
import {zoneSpawns,wanderAt,slotOf} from '../src/animal-zones.js';
import {NAMSAN_FEATURES} from '../src/mountains/namsan-page.js';

const dir='assets/shared/namsan/',read=f=>JSON.parse(readFileSync(dir+f,'utf8'));
const meta=read('namsan-meta.json'),buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:read('course.json'),walls:read('walls.json').walls,busRoad:read('bus-road.json')};
const G=createNamsanGround(data),END=G.points.at(-1).s;
const L=createNamsanAnimalLanes(G,{wallLines:data.walls.map(w=>wallLine(G,w)).filter(Boolean),plan:planNamsanInteract(G,{walls:data.walls})});
const lanes=namsanTrailLanes(L,END),zones=namsanAnimalZones(G).map(z=>({...z,minOffset:NAMSAN_ANIMAL_MIN_OFFSET}));
// trail-world.js toWorld(길 구역)와 같은 식: (x − tz·v, z + tx·v) = 남산 lanes.toWorld(x + nx·v)
const toWorld=(zone,u,v)=>{const k=courseAt(G.points,u);return {x:k.x-k.tz*v,z:k.z+k.tx*v};};
const opts={season:'autumn',hour:12,halfWidth:L.halfWidth,toWorld,lanes};
const SLOT0=slotOf(Date.UTC(2026,10,21,3,0)/1000);
const strip=list=>list.map(({legs,rand,cursor,...s})=>s);

test('기능 스위치: 남산 동물 켬',()=>{assert.equal(NAMSAN_FEATURES.animals,true);});

test('출현: 길가 1~5m·금지 밖, 구역 종류만, 같은 시간 칸이면 같은 결과',()=>{
 const kinds=new Set();let n=0;
 for(let k=0;k<40;k++)for(const z of zones){const a=zoneSpawns(z,SLOT0+k,opts),b=zoneSpawns(z,SLOT0+k,opts);assert.deepEqual(strip(a),strip(b));
  for(const sp of a){n++;kinds.add(sp.kind);assert.ok(z.w[sp.kind],`${z.id} ${sp.kind}`);assert.ok(sp.u>=z.from&&sp.u<=z.to);
   assert.ok(L.allows(sp.u,sp.v),`${sp.id} 길가 안전 범위 밖 (${sp.u.toFixed(1)}, ${sp.v.toFixed(2)})`);}}
 assert.deepEqual([...kinds].sort(),['cat','hare','magpie','squirrel']);
 assert.ok(n/40>=4,`한 시간 칸 평균 ${(n/40).toFixed(1)}마리(자동 걷기 한 번에 여러 번 만남)`);
});

test('배회: 땅 위 자리는 길가 안전 범위이거나 길을 가로지르는 길 위(금지 밖)',()=>{
 const t0=performance.now();let samples=0,cross=0;
 for(let k=0;k<6;k++)for(const z of zones)for(const sp of zoneSpawns(z,SLOT0+k,opts)){
  for(let t=0;t<=300;t+=.5){const w=wanderAt(sp,sp.t0+t,z,L.halfWidth,toWorld,lanes);if(w.mode==='fly'||w.mode==='hidden'||w.mode==='climb')continue;samples++;
   const p=toWorld(z,w.u,w.v);assert.equal(L.inForbid(p.x,p.z),false,`${sp.id} t=${t} 금지 안 (${w.mode})`);
   if(Math.abs(w.v)<L.halfWidth(w.u)+NAMSAN_ANIMAL_MIN_OFFSET)cross++;else assert.ok(L.allows(w.u,w.v),`${sp.id} t=${t} 길가 범위 밖`);}}
 assert.ok(samples>1000);
 const ms=performance.now()-t0;assert.ok(ms<20000,`배회 계산 ${ms.toFixed(0)}ms`);
});

test('같은 방 두 화면: 늦게 들어와도 같은 시각이면 같은 자리',()=>{
 for(const z of zones){const a=zoneSpawns(z,SLOT0,opts),b=zoneSpawns(z,SLOT0,opts);
  for(let i=0;i<a.length;i++){for(let t=0;t<=200;t+=1)wanderAt(a[i],a[i].t0+t,z,L.halfWidth,toWorld,lanes);
   for(const t of [150.5,20,199]){const p=wanderAt(a[i],a[i].t0+t,z,L.halfWidth,toWorld,lanes),q=wanderAt(b[i],b[i].t0+t,z,L.halfWidth,toWorld,lanes);assert.deepEqual(p,{...q,leg:p.leg});}}}
});

// 덤불(11-22, 검수 문제 1): 그림이 그린 길가 덤불과 출현·땅 위 배회 자리가 겹치지 않는다(몸이 가려져 「…!」만 보이던 문제).
// 덤불은 실제 덤불 형상 크기(반지름 약 0.72m)를 쓴 InstancedMesh로 만들어 game.js와 같은 namsanBushesFrom으로 읽는다.
import * as THREE from 'three';
import {namsanBushesFrom,BUSH_CLEAR} from '../src/namsan/namsan-animal-lanes.js';
import {namsanGrassGround,planTrailForest,buildTrailForest} from '../src/namsan/namsan-art.js';
{
 const shrubGeo=new THREE.BoxGeometry(1.44,.95,1.25);   // 실제 toon-shrub 경계 상자(가로 ±0.72·±0.62)와 같은 크기
 const trailPlan=planTrailForest(G,{blocked:namsanGrassGround(G,{walls:data.walls}).blocked});
 const art=buildTrailForest(trailPlan,{natureParts:()=>null,nature:{geometries:{shrub:shrubGeo},materials:{foliage:new THREE.MeshBasicMaterial()}}},{height:G.ground});
 const bushes=namsanBushesFrom(art);
 const LB=createNamsanAnimalLanes(G,{wallLines:data.walls.map(w=>wallLine(G,w)).filter(Boolean),plan:planNamsanInteract(G,{walls:data.walls}),bushes});
 const lanesB=namsanTrailLanes(LB,END),optsB={...opts,halfWidth:LB.halfWidth,lanes:lanesB};
 const hit=(x,z)=>bushes.some(b=>Math.hypot(x-b.x,z-b.z)<b.r+BUSH_CLEAR);

 test('덤불 목록: 그림이 그린 덤불 전부(화질별 그리는 개수와 상관없이), 크기는 형상 × 크기',()=>{
  assert.equal(bushes.length,trailPlan.shrubs.length);assert.equal(LB.bushes,bushes.length);
  const r=bushes.map(b=>b.r);assert.ok(Math.min(...r)>.2&&Math.max(...r)<1.6,`반지름 ${Math.min(...r)}~${Math.max(...r)}`);
  art.userData.update({position:new THREE.Vector3()},0);assert.equal(namsanBushesFrom(art).length,bushes.length);
 });

 test('덤불: 전에는 출현이 덤불과 겹쳤고, 덤불 검사 뒤 출현·땅 위 배회 0곳, 길가 1~5m 그대로',()=>{
  let beforeHit=0,n=0,samples=0;
  for(let k=0;k<12;k++)for(const z of zones){for(const sp of zoneSpawns(z,SLOT0+k,opts)){const p=toWorld(z,sp.u,sp.v);if(hit(p.x,p.z))beforeHit++;}
   for(const sp of zoneSpawns(z,SLOT0+k,optsB)){n++;const p=toWorld(z,sp.u,sp.v);assert.equal(hit(p.x,p.z),false,`${sp.id} 출현이 덤불 안`);
    const off=Math.abs(sp.v)-LB.halfWidth(sp.u);assert.ok(off>=1-1e-6&&off<=5+1e-6,`${sp.id} 길가 ${off.toFixed(2)}m`);
    for(let t=0;t<=300;t+=1){const w=wanderAt(sp,sp.t0+t,z,LB.halfWidth,toWorld,lanesB);if(w.mode==='fly'||w.mode==='hidden'||w.mode==='climb')continue;samples++;
     const q=toWorld(z,w.u,w.v);assert.equal(hit(q.x,q.z),false,`${sp.id} t=${t} ${w.mode} 덤불 안`);assert.equal(LB.inForbid(q.x,q.z),false);}}}
  assert.ok(beforeHit>0,'덤불 검사 전에는 겹침이 있었다(문제 재현)');
  assert.ok(n/12>=4,`한 시간 칸 평균 ${(n/12).toFixed(1)}마리`);assert.ok(samples>1000);
 });

 test('덤불: 같은 방 두 화면은 같은 출현·같은 배회(결정적)',()=>{
  for(const z of zones){const a=zoneSpawns(z,SLOT0+3,optsB),b=zoneSpawns(z,SLOT0+3,optsB);assert.deepEqual(strip(a),strip(b));
   for(let i=0;i<a.length;i++)for(const t of [10,95.5,240])assert.deepEqual(wanderAt(a[i],a[i].t0+t,z,LB.halfWidth,toWorld,lanesB),wanderAt(b[i],b[i].t0+t,z,LB.halfWidth,toWorld,lanesB));}
 });

 test('덤불: 허용 폭(laneLimit)은 덤불 때문에 줄지 않는다(덤불은 자리마다 최종 판정에서만)',()=>{
  for(let s=0;s<END;s+=7)for(const side of [1,-1])assert.equal(LB.laneLimit(s,side),L.laneLimit(s,side));
 });
}
