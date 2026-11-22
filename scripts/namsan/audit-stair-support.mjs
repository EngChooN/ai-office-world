// 계단 측벽의 실제 바닥과 화면에 그려지는 지형 사이를 비교한다.
import {readFileSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {createNamsanGround,NAMSAN} from '../../src/namsan/namsan-data.js';
import {buildNamsanTerrain,buildStoneStairs} from '../../src/namsan/namsan-art.js';
import {namsanStairSteps} from '../../src/namsan/namsan-stair-steps.js';
const dir='assets/shared/namsan/', json=f=>JSON.parse(readFileSync(dir+f,'utf8'));
const meta=json('namsan-meta.json'),buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const G=createNamsanGround({terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:json('course.json'),busRoad:json('bus-road.json')});
const mat=new THREE.MeshBasicMaterial();
const surfaces=[buildNamsanTerrain(G,mat,{tile:100}).userData.surface,buildNamsanTerrain(G,mat,{tile:250,mobile:true}).userData.surface];
const lines=['묻힘 표의 값은 경계 첫째·마지막 계단 칸 윗면과 그 칸 위 5×5 지점의 실제 화면 지면 높이의 차이이며, 길 끝 높이와의 차이가 아니다.','','| 경계(m) | 계단 | PC 측벽 아래 최대 틈(cm) | 휴대폰 측벽 아래 최대 틈(cm) |','|---:|---|---:|---:|'];
for(const run of buildStoneStairs(G).userData.runs){
 const plan=namsanStairSteps(G.points,run);
 for(const [kind,step,s] of [['시작',plan[0],run.s0],['끝',plan.at(-1),run.s1]]){
  const m=step.mid, W=NAMSAN.stairWidth, top=step.top+.02, depth=step.depth;
  const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([u,v])=>G.ground(m.x+m.nx*W/2*u+m.tx*depth/2*v,m.z+m.nz*W/2*u+m.tz*depth/2*v));
  const bot=Math.min(...corners,top-.2)-.3, gaps=[-Infinity,-Infinity];
  for(const sign of [-1,1]){
   const cx=m.x+m.nx*(W/2+.16)*sign,cz=m.z+m.nz*(W/2+.16)*sign,cbot=Math.min(bot,G.ground(cx,cz)-.3);
   for(let i=0;i<=8;i++)for(const side of [-1,1]){
    const along=(i/8-.5)*(depth+.08), across=(W/2+.16+.16*side)*sign;
    const x=m.x+m.nx*across+m.tx*along,z=m.z+m.nz*across+m.tz*along;
    surfaces.forEach((surface,k)=>{gaps[k]=Math.max(gaps[k],cbot-surface(x,z));});
   }
  }
  lines.push(`| ${s.toFixed(1)} | ${kind} | ${(gaps[0]*100).toFixed(1)} | ${(gaps[1]*100).toFixed(1)} |`);
 }
}
writeFileSync('artifacts/namsan-join-followup-2026-11-22/support-audit.md',lines.join('\n')+'\n');
console.log(lines.join('\n'));
