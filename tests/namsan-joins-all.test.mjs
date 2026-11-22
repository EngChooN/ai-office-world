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
const mat=new THREE.MeshBasicMaterial(), surfaces=[['PC',buildNamsanTerrain(G,mat,{tile:100}).userData.surface],['휴대폰',buildNamsanTerrain(G,mat,{tile:250,mobile:true}).userData.surface]];
const runs=buildStoneStairs(G).userData.runs,path=buildCoursePath(G).getObjectByName('코스 마사토 길').geometry.attributes.position;
assert.equal(runs.length,6);
for(const run of runs){const plan=namsanStairSteps(G.points,run);
 for(const [kind,step,s,sign] of [['시작',plan[0],run.s0,-1],['끝',plan.at(-1),run.s1,1]]){
  const m=step.mid,top=step.top+.02,W=NAMSAN.stairWidth,depth=step.depth+.06;
  for(const [device,surface] of surfaces)test(`${s}m ${kind} ${device}: 길 연결·묻힘·측벽 접지`,()=>{
   const p=G.points.find(p=>p.s===s),along=sign*Math.max(0,step.depth/2-.01);
   const center=s===477.2?p:{x:m.x+m.tx*along,z:m.z+m.tz*along};
   // 실제 길 메시의 두 끝점이 계단 윗면과 같은 높이·방향·폭이며 계단 상자 안에 겹친다.
   for(const side of [-1,1]){const x=center.x+m.nx*W/2*side,z=center.z+m.nz*W/2*side;let found=false;
    for(let i=0;i<path.count;i++)if(Math.hypot(path.getX(i)-x,path.getZ(i)-z)<.002&&Math.abs(path.getY(i)-top)<.002){found=true;break;}
    assert.ok(found,`길 끝 ${side}`);
    const dx=x-m.x,dz=z-m.z;assert.ok(Math.abs(dx*m.tx+dz*m.tz)<=depth/2+.002,`길 끝이 계단 바깥으로 벌어짐`);
   }
   for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){const u=(i/4-.5)*W,v=(j/4-.5)*depth,x=m.x+m.nx*u+m.tx*v,z=m.z+m.nz*u+m.tz*v;
    assert.ok(surface(x,z)-top<=.020001,`지면이 단 위 ${((surface(x,z)-top)*100).toFixed(1)}cm`);
   }
   const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([u,v])=>G.ground(m.x+m.nx*W/2*u+m.tx*step.depth/2*v,m.z+m.nz*W/2*u+m.tz*step.depth/2*v));
   const bot=Math.min(...corners,top-.2)-.3;
   for(const side of [-1,1]){const cx=m.x+m.nx*(W/2+.16)*side,cz=m.z+m.nz*(W/2+.16)*side,cbot=Math.min(bot,G.ground(cx,cz)-.3);
    for(let i=0;i<=8;i++)for(const edge of [-1,1]){const v=(i/8-.5)*(step.depth+.08),u=(W/2+.16+.16*edge)*side,x=m.x+m.nx*u+m.tx*v,z=m.z+m.nz*u+m.tz*v;
     assert.ok(cbot<=surface(x,z),`측벽 아래 뜸 ${((cbot-surface(x,z))*100).toFixed(1)}cm`);
    }
   }
  });
 }
}
