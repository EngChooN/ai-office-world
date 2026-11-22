import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createNamsanGround,NAMSAN} from '../src/namsan/namsan-data.js';
import {buildStoneStairs,stairTurnJoin,hairpinStep} from '../src/namsan/namsan-art.js';
import {namsanStairSteps} from '../src/namsan/namsan-stair-steps.js';
const dir='assets/shared/namsan/',json=f=>JSON.parse(readFileSync(dir+f,'utf8')),meta=json('namsan-meta.json'),buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const G=createNamsanGround({terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:json('course.json'),busRoad:json('bus-road.json')});
const stairs=buildStoneStairs(G),mesh=stairs.getObjectByName('돌계단 굽이 이음면');
mesh.material.side=THREE.DoubleSide;mesh.updateMatrixWorld();
test('전체 계단 굽이의 이음면은 양쪽 끝 사이를 덮고 낮은 단보다 낮다',()=>{
 let count=0,seen718=false;
 for(const run of stairs.userData.runs){const plan=namsanStairSteps(G.points,run);for(let i=1;i<plan.length;i++){
  const a=plan[i-1],b=plan[i],join=stairTurnJoin(a,b,NAMSAN.stairWidth);if(!join)continue;count++;if(b.sA>717&&b.sA<718)seen718=true;
  assert.ok(join.top<Math.min(a.top,b.top)+.02);
  // 머리핀은 이음면 대신 단 자체를 잘라 겹침을 없앤다.
  if(hairpinStep(a)||hairpinStep(b))continue;
  for(const side of [-1,1])for(const w of [.2,.5,.8]){
   const edge=(step,dir)=>({x:step.mid.x+step.mid.tx*(step.depth/2+.03)*dir+step.mid.nx*(NAMSAN.stairWidth/2+.32)*side*.98,z:step.mid.z+step.mid.tz*(step.depth/2+.03)*dir+step.mid.nz*(NAMSAN.stairWidth/2+.32)*side*.98});
   const p=edge(a,1),q=edge(b,-1),x=p.x*(1-w)+q.x*w,z=p.z*(1-w)+q.z*w;
   const hits=new THREE.Raycaster(new THREE.Vector3(x,join.top+1,z),new THREE.Vector3(0,-1,0),0,1.01).intersectObject(mesh);
   assert.ok(hits.some(h=>Math.abs(h.point.y-join.top)<.002),`${b.sA.toFixed(2)}m 측면 ${side} 이음면 누락`);
  }
 }}
 // 592m 곡선을 촘촘히 나누어 부드러운 방향 전환이 22곳 늘었다.
 assert.equal(count,98);assert.ok(seen718);
});

test('급한 굽이의 단은 같은 수직선에 서로 다른 높이로 겹치지 않는다',()=>{
 const tread=stairs.getObjectByName('돌계단 디딤돌');tread.material.side=THREE.DoubleSide;tread.updateMatrixWorld();
 const ray=new THREE.Raycaster();let count=0;
 for(let x=3409;x<=3415;x+=.13)for(let z=-9547;z<=-9542;z+=.13){
  ray.set(new THREE.Vector3(x,200,z),new THREE.Vector3(0,-1,0));
  const heights=ray.intersectObject(tread).map(h=>h.point.y).filter((y,i,a)=>a.findIndex(v=>Math.abs(v-y)<.01)===i);
  assert.ok(heights.length<=1,`${x.toFixed(2)}, ${z.toFixed(2)}: ${heights}`);count++;
 }
 assert.ok(count>1000);
});
