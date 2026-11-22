import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround,NAMSAN,courseAt} from '../src/namsan/namsan-data.js';
import {wallLine} from '../src/namsan/namsan-art.js';
import {planNamsanInteract} from '../src/namsan/namsan-interact-art.js';
import {namsanAnimalZones} from '../src/namsan/namsan-animal-zones.js';
import {createNamsanAnimalLanes} from '../src/namsan/namsan-animal-lanes.js';
import {stairRuns} from '../src/namsan/namsan-walk.js';

const dir='assets/shared/namsan/',read=f=>JSON.parse(readFileSync(dir+f,'utf8'));
const meta=read('namsan-meta.json'),buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:read('course.json'),walls:read('walls.json').walls,busRoad:read('bus-road.json')};
const G=createNamsanGround(data),walls=data.walls.map(w=>wallLine(G,w)).filter(Boolean),plan=planNamsanInteract(G,{walls:data.walls}),lanes=createNamsanAnimalLanes(G,{wallLines:walls,plan});

test('출현 추천 구역은 코스를 덮고 지정한 종류만 쓰며 코스 끝에서 잘린다',()=>{
 const zones=namsanAnimalZones(G);assert.deepEqual(zones.map(z=>[z.from,z.to]),[[0,120],[120,650],[650,900],[900,G.points.at(-1).s]]);
 assert.deepEqual(zones.map(z=>Object.keys(z.w).sort()),[['cat','magpie'],['hare','magpie','squirrel'],['cat','magpie'],['cat','magpie']]);
});
test('시설 배치가 빠지면 안전하지 않은 기본값으로 만들지 않는다',()=>{
 assert.throws(()=>createNamsanAnimalLanes(G,{}));assert.throws(()=>createNamsanAnimalLanes(G,{wallLines:[],plan:{}}));
});
test('실제 성곽·버스 차로·탑·시설·자물쇠 난간은 금지한다',()=>{
 const w=walls.find(l=>l.P.length>1).P;assert.equal(lanes.inForbid((w[0].x+w[1].x)/2,(w[0].z+w[1].z)/2),true);
 const road=G.bus.points[Math.floor(G.bus.points.length/2)],cycle=G.bus.cycle.points[5];assert.ok(lanes.inForbid(road.x,road.z));assert.ok(lanes.inForbid(cycle.x,cycle.z));
 assert.ok(lanes.inForbid(NAMSAN.tower.x,NAMSAN.tower.z));
 for(const p of [plan.spring,plan.cairn,...plan.basins].filter(Boolean))assert.ok(lanes.inForbid(p.x,p.z));
 assert.ok(plan.locks);const l=plan.locks;assert.ok(lanes.inForbid(l.x+Math.sin(l.a0)*l.radius,l.z+Math.cos(l.a0)*l.radius));
 const stair=stairRuns(G)[0],k=courseAt(G.points,stair.s0+(stair.s1-stair.s0)/stair.steps/2);assert.ok(lanes.inForbid(k.x+k.nx*(NAMSAN.stairWidth/2+.16),k.z+k.nz*(NAMSAN.stairWidth/2+.16)));
});
test('각 구역에 사용 가능한 길가가 있고, 허용된 점은 1~5m·땅 높이·금지 구역 밖이다',()=>{
 for(const z of namsanAnimalZones(G)){let good=0;
  for(let s=z.from+.2;s<z.to;s+=8)for(const side of [-1,1])for(const off of [1,2,3,4,5]){
   const v=side*(lanes.halfWidth(s)+off);if(!lanes.allows(s,v))continue;good++;const p=lanes.toWorld(s,v),hit=G.nearest(p.x,p.z),hw=G.points[hit.index].stairs?NAMSAN.stairWidth/2:NAMSAN.pathWidth/2;
   assert.ok(hit.distance>=hw+1-1e-6&&hit.distance<=hw+5+1e-6);assert.equal(p.y,G.ground(p.x,p.z));assert.equal(lanes.inForbid(p.x,p.z),false);
  }assert.ok(good>0,`${z.id}에 안전한 자리가 없다`);
 }
});
test('유효하지 않은 자리·멀리 떨어진 자리·위험한 이동은 막는다',()=>{
 assert.equal(lanes.allows(-1,3),false);assert.equal(lanes.allows(20,99),false);assert.equal(lanes.allows(20,NaN),false);
 assert.equal(lanes.legAllows({s:20,v:-4},{s:20,v:4}),false);
 for(let s=0;s<G.points.at(-1).s;s+=25)for(const side of [-1,1]){const lim=lanes.laneLimit(s,side);assert.ok(lim>=0&&lim<=5);}
});
