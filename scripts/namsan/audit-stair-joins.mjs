// 실제 지형 메시의 삼각형 보간 높이와 각 경계 단을 비교한다.
import {readFileSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {createNamsanGround,NAMSAN} from '../../src/namsan/namsan-data.js';
import {buildNamsanTerrain,buildStoneStairs} from '../../src/namsan/namsan-art.js';
import {namsanStairSteps} from '../../src/namsan/namsan-stair-steps.js';
const dir='assets/shared/namsan/',json=f=>JSON.parse(readFileSync(dir+f,'utf8'));
const meta=json('namsan-meta.json'),buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const G=createNamsanGround({terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:json('course.json'),busRoad:json('bus-road.json')});
const material=new THREE.MeshBasicMaterial(), terr=buildNamsanTerrain(G,material,{tile:100}), surface=terr.userData.surface;
const mobileSurface=buildNamsanTerrain(G,material,{tile:250,mobile:true}).userData.surface;
const runs=buildStoneStairs(G).userData.runs,rows=[];
for(const run of runs){const plan=namsanStairSteps(G.points,run);for(const [kind,step] of [['시작',plan[0]],['끝',plan.at(-1)]]){
 const m=step.mid,top=step.top+.02,depth=step.depth+.06;let max=-Infinity,min=Infinity,mmax=-Infinity,mmin=Infinity;
 for(let i=0;i<=4;i++)for(let j=0;j<=4;j++){const u=(i/4-.5)*NAMSAN.stairWidth,v=(j/4-.5)*depth,x=m.x+m.nx*u+m.tx*v,z=m.z+m.nz*u+m.tz*v,d=surface(x,z)-top;max=Math.max(max,d);min=Math.min(min,d);const md=mobileSurface(x,z)-top;mmax=Math.max(mmax,md);mmin=Math.min(mmin,md); }
 rows.push({s:kind==='시작'?run.s0:run.s1,kind,max,min,mmax,mmin});}}
const lines=['| 경계(m) | 계단 | 지면−윗면 최고(cm) | 지면−윗면 최저(cm) | 휴대폰 최고(cm) | 휴대폰 최저(cm) |','|---:|---|---:|---:|---:|---:|',...rows.map(r=>`| ${r.s.toFixed(1)} | ${r.kind} | ${(r.max*100).toFixed(1)} | ${(r.min*100).toFixed(1)} | ${(r.mmax*100).toFixed(1)} | ${(r.mmin*100).toFixed(1)} |`)];
writeFileSync('artifacts/namsan-join-followup-2026-11-22/boundary-audit-after.md',lines.join('\n')+'\n');console.log(lines.join('\n'));
