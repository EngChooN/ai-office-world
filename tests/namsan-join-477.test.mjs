import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createNamsanGround,NAMSAN} from '../src/namsan/namsan-data.js';
import {buildNamsanTerrain,buildStoneStairs,buildCoursePath} from '../src/namsan/namsan-art.js';
import {namsanStairSteps} from '../src/namsan/namsan-stair-steps.js';
const dir='assets/shared/namsan/',json=f=>JSON.parse(readFileSync(dir+f,'utf8')),meta=json('namsan-meta.json');
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const G=createNamsanGround({terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:json('course.json'),busRoad:json('bus-road.json')});
test('477m 길 끝은 마지막 계단 방향·폭·높이에 붙고 실제 PC 격자가 단을 덮지 않는다',()=>{
 const run=buildStoneStairs(G).userData.runs.find(r=>r.s1===477.2),step=namsanStairSteps(G.points,run).at(-1),p=G.points.find(p=>p.s===477.2),positions=buildCoursePath(G).getObjectByName('코스 마사토 길').geometry.attributes.position;
 for(const sign of [-1,1]){const x=p.x+step.mid.nx*NAMSAN.stairWidth/2*sign,z=p.z+step.mid.nz*NAMSAN.stairWidth/2*sign;let found=false;
  for(let i=0;i<positions.count;i++)if(Math.hypot(positions.getX(i)-x,positions.getZ(i)-z)<.002&&Math.abs(positions.getY(i)-(step.top+.02))<.002)found=true;
  assert.ok(found,`계단과 맞닿는 길 끝 ${sign}`);}
 const terrain=buildNamsanTerrain(G,new THREE.MeshBasicMaterial(),{tile:100}),surface=terrain.userData.surface,m=step.mid,top=step.top+.02;
 for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){const u=(i/4-.5)*NAMSAN.stairWidth,v=(j/4-.5)*(step.depth+.06),x=m.x+m.nx*u+m.tx*v,z=m.z+m.nz*u+m.tz*v;assert.ok(surface(x,z)-top<=.02,`단 위 지면 ${((surface(x,z)-top)*100).toFixed(1)}cm`);}
});
