// 남산 그림(월드아트, 11-19): 지형 판·코스 노면·돌계단·한양도성 성곽·게임 속 「남산 전망탑」·정상/출발 광장·이정표·스탬프함·쉼터·등불·숲.
// 모두 MeshStandard(일부 꼭짓점 색·절차 캔버스 무늬)로 만들고, 붙이는 쪽이 toon.toonify(group,{kind:'prop'})로 카툰 재질로 바꾼다(관악산 시설과 같은 길).
// 지형 판만 toon.materialFactory.terrain()을 받는다. 높이는 namsan-data.js createNamsanGround의 ground(x,z)를 쓴다.
// 실제 시설 모양·상호를 따라 하지 않는다(설계 §5·§9): 전망탑·광장·등불·쉼터는 게임 디자인, 성곽 위치·코스·지형만 실제 자료.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {trailSignModel,stampBoxModel} from '../../assets/realistic/interaction-props.js';
import {markerStone} from '../../assets/realistic/summit-facilities.js';
import {bench} from '../toon/trail-props.js';
import {NAMSAN,courseAt} from './namsan-data.js';
import {buildNamsanBus} from './namsan-bus-art.js';
import {buildNamsanLamps} from './namsan-lamps-art.js';

export const NAMSAN_COLORS=Object.freeze({
 wall:'#fffaf0',wallCap:'#bdb39d',stairTop:[.68,.67,.63],stairSide:[.55,.54,.50],curb:[.62,.60,.55],
 path:'#d3bd94',pathEdge:'#9c917f',plaza:'#fff6ea',
 towerBody:'#f3efe6',towerTrim:'#d7d2c6',towerGlass:'#6e98b6',mastRed:'#d8473a',mastWhite:'#f5f2ea',roof:'#5d6b74',
 lampPost:'#6c6457',lampGlow:'#ffd9a0',deck:'#a47448',rail:'#7b5636',stone:'#a9a395',
});
const FONT='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const std=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...o});
const vstd=(o={})=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,...o});

// ── 절차 캔버스 무늬: 흰 바탕 계열이면 toonify가 「무늬 바닥」으로 3단 결만 남긴다(materials.js patternFloor) ──
function canvasMap(w,h,draw,repeat=true){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const rnd=seed=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
// 성곽 돌: 4m×4m 한 장. 아래 줄일수록 큰 돌, 줄마다 높이가 다른 다듬은 화강암 마름돌(게임 표현).
let wallMapCache=null;
export function wallStoneMap(){
 return wallMapCache??=canvasMap(512,512,(g,w,h)=>{
  const r=rnd(7);g.fillStyle='#8f877a';g.fillRect(0,0,w,h);
  let y=h;
  while(y>0){const rowH=Math.round(38+r()*30);let x=-r()*60;
   while(x<w){const bw=Math.round(70+r()*90),t=r();g.fillStyle=t<.3?'#d9d1c1':t<.7?'#e6dfd0':t<.9?'#cfc6b4':'#f0eadc';
    g.fillRect(x+3,y-rowH+3,bw-6,rowH-6);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x+3,y-rowH+3,bw-6,5);x+=bw;}
   y-=rowH;}
 });
}
// 광장 바닥: 1m 네모 판석(밝은 화강암) + 판마다 조금 다른 밝기
let plazaMapCache=null;
function plazaMap(){
 return plazaMapCache??=canvasMap(512,512,(g,w,h)=>{const r=rnd(11),n=8,s=w/n;g.fillStyle='#b9b0a0';g.fillRect(0,0,w,h);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const t=r();g.fillStyle=t<.35?'#ece6da':t<.75?'#e3dccd':'#f4efe5';g.fillRect(i*s+2,j*s+2,s-4,s-4);}});
}

// ── 1. 지형 판: 100m 판. 코스 가까이 2m, 600m 안 4m, 그 밖 8m 간격. 판 가장자리 아래로 늘어진 치마(2.5m)로 간격이 다른 판 사이 틈을 가린다 ──
export function buildNamsanTerrain(G,material,{tile=100,mobile=false}={}){
 const group=new THREE.Group();group.name='남산 지형';
 // 시가지 바닥: 밝은 회베이지 단색(도로·마당). 붙이는 쪽 toonify가 카툰 재질로 바꾼다(지형 재질은 이미 카툰이라 그대로).
 const cityGround=std('#bdb6a8');cityGround.name='남산 시가지 바닥';
 const {x0,z0,x1,z1}=G.bounds,pts=G.points;
 const courseDist=(x,z)=>{let d=1e9;for(let i=0;i<pts.length;i+=3)d=Math.min(d,Math.hypot(pts[i].x-x,pts[i].z-z));return d;};
 let tris=0;
 for(let tz=z0;tz<z1-1;tz+=tile)for(let tx=x0;tx<x1-1;tx+=tile){
  // 칸 크기를 키우면(월드개발 11-19 휴대폰 그리기 횟수 줄이기, tile>100) 칸 가운데 대신 칸에서 가장 가까운 거리로 촘촘함을 정한다(길 옆 칸이 거칠어지지 않게)
  const sx=Math.min(tile,x1-tx),sz=Math.min(tile,z1-tz),near=(px,pz)=>tile>100?Math.hypot(Math.max(tx-px,0,px-tx-sx),Math.max(tz-pz,0,pz-tz-sz)):Math.hypot(tx+sx/2-px,tz+sz/2-pz);
  const cd=tile>100?(()=>{let d=1e9;for(let i=0;i<pts.length;i+=3)d=Math.min(d,near(pts[i].x,pts[i].z));return d;})():courseDist(tx+sx/2,tz+sz/2),plazaD=near(G.plaza.x,G.plaza.z);
  // 순환버스 차로 60m 안도 2m(차로 둘레 깎은 땅이 굵은 칸 사이로 차로 위에 솟지 않게)
  const bd=G.bus?(()=>{let d=1e9;const bp=G.bus.points;for(let i=0;i<bp.length;i+=4)d=Math.min(d,Math.hypot(Math.max(tx-bp[i].x,0,bp[i].x-tx-sx),Math.max(tz-bp[i].z,0,bp[i].z-tz-sz)));return d;})():1e9;
  const step=(cd<130||plazaD<120||bd<20?2:cd<600?4:8)*(mobile?2:1),nx=Math.max(1,Math.round(sx/step)),nz=Math.max(1,Math.round(sz/step));
  const pos=[],nor=[],uv=[],idx=[],e=.8;
  const push=(x,z,y)=>{const hx=G.ground(x+e,z)-G.ground(x-e,z),hz=G.ground(x,z+e)-G.ground(x,z-e),l=Math.hypot(hx,2*e,hz);pos.push(x,y,z);nor.push(-hx/l,2*e/l,-hz/l);uv.push(x/60,z/60);};
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=tx+sx*i/nx,z=tz+sz*j/nz;push(x,z,G.ground(x,z));}
  const W=nx+1,city=[];
  // 시가지 칸(네 꼭짓점이 모두 시가지)은 회색 바닥 재질로 따로 모은다(group 1)
  const urban=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)urban.push(!G.park(tx+sx*i/nx,tz+sz*j/nz));
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*W+i,b=a+1,c=a+W,d=c+1;(urban[a]&&urban[b]&&urban[c]&&urban[d]?city:idx).push(a,c,b,b,c,d);}
  const parkCount=idx.length;idx.push(...city);
  // 치마: 테두리 고리(시계 방향) 아래로 2.5m
  const ring=[];for(let i=0;i<nx;i++)ring.push(i);for(let j=0;j<nz;j++)ring.push(j*W+nx);for(let i=nx;i>0;i--)ring.push(nz*W+i);for(let j=nz;j>0;j--)ring.push(j*W);
  const base=pos.length/3;
  for(const k of ring){pos.push(pos[k*3],pos[k*3+1]-2.5,pos[k*3+2]);nor.push(nor[k*3],nor[k*3+1],nor[k*3+2]);uv.push(uv[k*2],uv[k*2+1]);}
  for(let r=0;r<ring.length;r++){const a=ring[r],b=ring[(r+1)%ring.length],c=base+r,d=base+(r+1)%ring.length;idx.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();
  // group 0 = 숲·공원(지형 재질, 치마 포함), group 1 = 시가지 바닥
  g.addGroup(0,parkCount,0);g.addGroup(parkCount,city.length,1);const skirt=idx.length-parkCount-city.length;if(skirt)g.addGroup(parkCount+city.length,skirt,0);
  const m=new THREE.Mesh(g,[material,cityGround]);m.receiveShadow=true;m.name=`남산 지형 ${tx},${tz} (${step}m)`;m.userData.step=step;group.add(m);tris+=idx.length/3;
 }
 group.userData.triangles=tris;return group;
}

// ── 2. 코스 노면(계단 아닌 곳): 폭 2.6m 마사토 길 + 양옆 낮은 경계석 ──
function courseRuns(pts,stairs){const runs=[];let cur=null;for(let i=0;i<pts.length-1;i++){const on=!!pts[i].stairs===stairs;if(on){if(!cur)runs.push(cur=[i]);cur.push(i+1);}else cur=null;}return runs;}
function frames(pts,idx){return idx.map((i,k)=>{const a=pts[idx[Math.max(0,k-1)]],b=pts[idx[Math.min(idx.length-1,k+1)]],L=Math.hypot(b.x-a.x,b.z-a.z)||1;return {p:pts[i],nx:-(b.z-a.z)/L,nz:(b.x-a.x)/L};});}
export function buildCoursePath(G){
 const pts=G.points,W=NAMSAN.pathWidth,group=new THREE.Group();group.name='남산 코스 노면';
 const surf=[],curb=[];
 // 광장 안(판석 바닥)에는 노면 띠를 깔지 않는다
 const onPlaza=p=>Math.hypot(p.x-G.plaza.x,p.z-G.plaza.z)<G.plaza.r-.5||Math.hypot(p.x-G.startPlaza.x,p.z-G.startPlaza.z)<G.startPlaza.r-.5;
 const runs=[];for(const run of courseRuns(pts,false)){let cur=null;for(const i of run){if(onPlaza(pts[i])){cur=null;continue;}if(!cur)runs.push(cur=[]);cur.push(i);}}
 for(const run of runs.filter(r=>r.length>1)){
  const F=frames(pts,run),pos=[],idx=[],col=[];
  F.forEach(({p,nx,nz},k)=>{for(const s of [-1,1]){pos.push(p.x+nx*W/2*s,p.y+.05,p.z+nz*W/2*s);const c=new THREE.Color(NAMSAN_COLORS.path).multiplyScalar(.96+.06*Math.sin(k*1.7+s));col.push(c.r,c.g,c.b);}
   if(k){const a=(k-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();surf.push(g);
  // 경계석: 0.18m 폭·노면 위 0.1m, 아래는 땅에 0.25m 묻힘
  for(let k=1;k<F.length;k++)for(const s of [-1,1]){const A=F[k-1],B=F[k],ax=A.p.x+A.nx*(W/2+.09)*s,az=A.p.z+A.nz*(W/2+.09)*s,bx=B.p.x+B.nx*(W/2+.09)*s,bz=B.p.z+B.nz*(W/2+.09)*s;
   const L=Math.hypot(bx-ax,bz-az);if(L<.05)continue;const top=Math.max(A.p.y,B.p.y)+.15,bot=Math.min(G.ground(ax,az),G.ground(bx,bz),A.p.y,B.p.y)-.25;
   const box=new THREE.BoxGeometry(.18,top-bot,L+.02);box.rotateX(Math.atan2(B.p.y-A.p.y,L)*0);box.rotateY(Math.atan2(bx-ax,bz-az));box.translate((ax+bx)/2,(top+bot)/2,(az+bz)/2);curb.push(box);}
 }
 const surfMesh=new THREE.Mesh(mergeGeometries(surf),vstd());surfMesh.name='코스 마사토 길';surfMesh.receiveShadow=true;group.add(surfMesh);
 const curbMesh=new THREE.Mesh(mergeGeometries(curb),std(NAMSAN_COLORS.pathEdge));curbMesh.name='코스 경계석';curbMesh.receiveShadow=curbMesh.castShadow=true;group.add(curbMesh);
 surf.forEach(g=>g.dispose());curb.forEach(g=>g.dispose());
 return group;
}

// ── 3. 돌계단: 계단 구간마다 오르는 높이를 단(목표 0.16m)으로 나눈다. 단 윗면은 그 단 가운데의 길 높이(걷는 높이와 ±단 높이/2 안).
// 단마다 아래를 땅 밑 0.3m까지 채우고 양옆 돌 측벽을 세운다(떠 있는 계단 금지 — 관악산 규칙). 단 수는 게임 속 수(실제 계단 수와 비교 안 함).
export function buildStoneStairs(G){
 const pts=G.points,W=NAMSAN.stairWidth,group=new THREE.Group();group.name='남산 돌계단';
 const geos=[],curbs=[];let steps=0;const C=NAMSAN_COLORS;
 const color=(g,top,side)=>{const n=g.attributes.position.count,ny=g.attributes.normal,col=new Float32Array(n*3);for(let i=0;i<n;i++){const c=ny.getY(i)>.5?top:side;col.set(c,i*3);}g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;};
 const runs=courseRuns(pts,true),stairRuns=[];
 for(const run of runs){
  const a=pts[run[0]],b=pts[run.at(-1)],rise=b.y-a.y,len=b.s-a.s;if(len<1)continue;
  const n=Math.max(1,Math.round(rise/NAMSAN.riser));stairRuns.push({s0:a.s,s1:b.s,y0:a.y,y1:b.y,steps:n});
  for(let k=0;k<n;k++){
   const sA=a.s+len*k/n,sB=a.s+len*(k+1)/n,m=courseAt(pts,(sA+sB)/2),depth=sB-sA,top=m.y+.02;
   const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([u,v])=>G.ground(m.x+m.nx*W/2*u+m.tx*depth/2*v,m.z+m.nz*W/2*u+m.tz*depth/2*v));
   const bot=Math.min(...corners,top-.2)-.3,tint=.94+.1*((k*7919)%13)/13;
   const tread=color(new THREE.BoxGeometry(W,top-bot,depth+.06),C.stairTop.map(v=>v*tint),C.stairSide);
   tread.rotateY(m.heading+Math.PI);tread.translate(m.x,(top+bot)/2,m.z);geos.push(tread);
   for(const s of [-1,1]){const cx=m.x+m.nx*(W/2+.16)*s,cz=m.z+m.nz*(W/2+.16)*s,ctop=top+.2,cbot=Math.min(bot,G.ground(cx,cz)-.3);
    const c=color(new THREE.BoxGeometry(.32,ctop-cbot,depth+.08),C.curb,C.curb.map(v=>v*.86));c.rotateY(m.heading+Math.PI);c.translate(cx,(ctop+cbot)/2,cz);curbs.push(c);}
   steps++;
  }
 }
 const treadMesh=new THREE.Mesh(mergeGeometries(geos),vstd());treadMesh.name='돌계단 디딤돌';treadMesh.castShadow=treadMesh.receiveShadow=true;group.add(treadMesh);
 const curbMesh=new THREE.Mesh(mergeGeometries(curbs),vstd());curbMesh.name='돌계단 측벽';curbMesh.castShadow=curbMesh.receiveShadow=true;group.add(curbMesh);
 geos.forEach(g=>g.dispose());curbs.forEach(g=>g.dispose());
 group.userData={steps,runs:stairRuns};return group;
}

// ── 4. 한양도성 성곽: OSM 선을 따라 몸체(두께 2.2m·땅 위 3.6m) + 바깥쪽 여장(낮은 담, 3m 토막·0.45m 틈). 위치는 실제 자료, 돌 모양은 게임 표현 ──
// 코스와 겹치는 곳(코스 중심에서 노면 반폭+성곽 반폭+0.5m 안)은 성곽을 코스 바깥으로 민다. 바깥쪽 = 땅이 낮은 쪽.
export const WALL={lowR:7,lowParapet:.6,thick:2.2,height:3.6,parapetH:1.05,parapetT:.7,merlon:3,gap:.45,embed:1.2,sample:1.5};
// 쉼터 둘레(NAMSAN.rest.s ± lowR)는 성곽을 낮춘다: 몸체 윗면을 땅 높이까지 내려 전망 단으로 쓰고, 바깥 여장만 0.6m 난간처럼 남긴다(남서쪽 전망이 성곽에 막히지 않게, 게임 연출).
export function wallLowZone(G){const m=courseAt(G.points,NAMSAN.rest.s);return {x:m.x,z:m.z,r:WALL.lowR};}
// 성곽 한 줄의 가운데 선(1.5m 간격, 코스와 겹치는 곳은 한쪽으로 민 뒤)과 방향. 그림(buildFortressWall)과 가로등 배치(namsan-lamps-art.js)가 같이 쓴다. w.courseSide를 적는다.
export function wallLine(G,w){
 const clear=NAMSAN.pathWidth/2+WALL.thick/2+.5;
 {// 1.5m 간격으로 다시 찍기
  const P=[];for(let i=0;i<w.points.length-1;i++){const a=w.points[i],b=w.points[i+1],L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(L/WALL.sample));for(let k=0;k<n;k++)P.push({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n});}
  P.push({...w.points.at(-1)});if(P.length<2)return null;
  // OSM에서 길이 성곽 선 바로 위(1~2m)에 그려진 곳이 많아, 점마다 가까운 쪽으로 밀면 성곽이 길 양쪽을 오간다.
  // 그래서 성곽 한 줄은 한쪽으로만 민다: 코스 오른쪽(오르는 사람 기준)에 있는 점이 많으면 오른쪽, 아니면 왼쪽. 비기면 땅이 낮은 쪽.
  let pushed=0,vote=0;const frame=hit=>{const q=G.points[hit.index],r=G.points[hit.index+1]??q,L=Math.hypot(r.x-q.x,r.z-q.z)||1;return {cx:q.x+(r.x-q.x)*hit.t,cz:q.z+(r.z-q.z)*hit.t,nx:-(r.z-q.z)/L,nz:(r.x-q.x)/L};};
  const near=P.map(p=>{const hit=G.nearest(p.x,p.z);if(hit.distance>=clear)return null;const f=frame(hit),d=(p.x-f.cx)*f.nx+(p.z-f.cz)*f.nz;vote+=d;return f;});
  if(near.some(Boolean)){if(Math.abs(vote)<.5){let g=0;near.forEach(f=>{if(f)g+=G.ground(f.cx+f.nx*6,f.cz+f.nz*6)-G.ground(f.cx-f.nx*6,f.cz-f.nz*6);});vote=-g;}
   const side=vote>=0?1:-1;P.forEach((p,i)=>{const f=near[i];if(!f)return;p.x=f.cx+f.nx*side*clear;p.z=f.cz+f.nz*side*clear;pushed++;});
   // 민 점과 안 민 점 사이 꺾임을 앞뒤 두 점씩 부드럽게
   for(let pass=0;pass<2;pass++)for(let i=1;i<P.length-1;i++)if(near[i]&&(!near[i-1]||!near[i+1])){P[i].x=(P[i-1].x+P[i].x*2+P[i+1].x)/4;P[i].z=(P[i-1].z+P[i].z*2+P[i+1].z)/4;}
   w.courseSide=side;}
  const N=P.map((p,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],L=Math.hypot(b.x-a.x,b.z-a.z)||1;return {nx:-(b.z-a.z)/L,nz:(b.x-a.x)/L,tx:(b.x-a.x)/L,tz:(b.z-a.z)/L};});
  return {P,N,pushed};}
}
export function buildFortressWall(G,walls){
 const low=wallLowZone(G),lowK=p=>{const d=Math.hypot(p.x-low.x,p.z-low.z);return d<low.r?1:d<low.r+6?1-(d-low.r)/6:0;};
 const group=new THREE.Group();group.name='한양도성 성곽';
 const body=[],caps=[],parapets=[];let length=0;const report=[];
 for(const w of walls){
  const line=wallLine(G,w);if(!line)continue;const {P,N,pushed}=line;
  // 바깥쪽
  let lean=0;P.forEach((p,i)=>{lean+=G.ground(p.x+N[i].nx*6,p.z+N[i].nz*6)-G.ground(p.x-N[i].nx*6,p.z-N[i].nz*6);});const out=lean>0?-1:1; // 낮은 쪽
  const gMax=P.map((p,i)=>Math.max(G.ground(p.x+N[i].nx*WALL.thick/2,p.z+N[i].nz*WALL.thick/2),G.ground(p.x-N[i].nx*WALL.thick/2,p.z-N[i].nz*WALL.thick/2)));
  const gMin=P.map((p,i)=>Math.min(G.ground(p.x+N[i].nx*(WALL.thick/2+.6),p.z+N[i].nz*(WALL.thick/2+.6)),G.ground(p.x-N[i].nx*(WALL.thick/2+.6),p.z-N[i].nz*(WALL.thick/2+.6))));
  // 윗면은 앞뒤 6m 이동 평균(땅의 잔 굴곡을 따라 출렁이지 않게), 그래도 높은 쪽 땅 위 2.6m는 넘긴다.
  const top=P.map((p,i)=>{let a=0,n=0;for(let j=Math.max(0,i-4);j<=Math.min(P.length-1,i+4);j++){a+=gMax[j];n++;}const full=Math.max(a/n+WALL.height,gMax[i]+2.6),k=lowK(p),flat=courseAt(G.points,NAMSAN.rest.s).y+.02;return full+(flat-full)*k;});
  const pos=[],uv=[],idx=[];let u=0;
  const quad=(a,b,c,d)=>idx.push(a,b,c,b,d,c);
  P.forEach((p,i)=>{if(i)u+=Math.hypot(p.x-P[i-1].x,p.z-P[i-1].z);const n=N[i],bot=gMin[i]-WALL.embed,T=WALL.thick/2;
   // 0 왼쪽 아래, 1 왼쪽 위, 2 오른쪽 위, 3 오른쪽 아래 (왼쪽 = -n). 옆면이 약간 비스듬히(아래가 0.25m 넓음)
   const L=[p.x-n.nx*(T+.25),p.z-n.nz*(T+.25)],Lt=[p.x-n.nx*T,p.z-n.nz*T],Rt=[p.x+n.nx*T,p.z+n.nz*T],R=[p.x+n.nx*(T+.25),p.z+n.nz*(T+.25)];
   pos.push(L[0],bot,L[1],Lt[0],top[i],Lt[1],Rt[0],top[i],Rt[1],R[0],bot,R[1]);
   uv.push(u/4,bot/4,u/4,top[i]/4,u/4,top[i]/4+.5,u/4,bot/4);
   if(i){const a=(i-1)*4,b=i*4;quad(a,a+1,b,b+1);quad(a+1,a+2,b+1,b+2);quad(a+2,a+3,b+2,b+3);}
  });
  // 양 끝 막음
  const capEnd=(i,flip)=>{const a=i*4;flip?idx.push(a,a+2,a+1,a,a+3,a+2):idx.push(a,a+1,a+2,a,a+2,a+3);};capEnd(0,false);capEnd(P.length-1,true);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();body.push(g);
  // 여장(바깥쪽 담) 토막 + 윗면 갓돌 띠
  let acc=0;
  for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],L=Math.hypot(b.x-a.x,b.z-a.z);length+=L;
   const n=N[i],cx=(a.x+b.x)/2+n.nx*out*(WALL.thick/2-WALL.parapetT/2),cz=(a.z+b.z)/2+n.nz*out*(WALL.thick/2-WALL.parapetT/2),t=Math.min(top[i-1],top[i]);
   const inGap=(acc%(WALL.merlon+WALL.gap))>WALL.merlon;acc+=L;const lk=lowK({x:(a.x+b.x)/2,z:(a.z+b.z)/2});
   const h=lk>.5?WALL.lowParapet:inGap?WALL.parapetH*.45:WALL.parapetH,box=new THREE.BoxGeometry(WALL.parapetT,h+.4,L+.03);box.rotateY(Math.atan2(b.x-a.x,b.z-a.z));box.translate(cx,t-.4+(h+.4)/2,cz);parapets.push(box);
   const cap=new THREE.BoxGeometry(WALL.parapetT+.16,.12,L+.03);cap.rotateY(Math.atan2(b.x-a.x,b.z-a.z));cap.translate(cx,t+h+.06,cz);caps.push(cap);}
  report.push({id:w.id,samples:P.length,pushed,outSide:out,courseSide:w.courseSide??0});
 }
 const stone=std('#ffffff',{map:wallStoneMap(),emissive:new THREE.Color('#2e2a24')}); // 그늘 면이 검게 뭉개지지 않게 아주 약한 자체 밝기
 if(body.length){const m=new THREE.Mesh(mergeGeometries(body),stone);m.name='성곽 몸체';m.castShadow=m.receiveShadow=true;group.add(m);}
 if(parapets.length){const pg=mergeGeometries(parapets),p=pg.attributes.position,n=pg.attributes.normal,uv=pg.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/4,p.getY(i)/4);
  const m=new THREE.Mesh(pg,stone);m.name='성곽 여장';m.castShadow=m.receiveShadow=true;group.add(m);}
 if(caps.length){const m=new THREE.Mesh(mergeGeometries(caps),std(NAMSAN_COLORS.wallCap));m.name='성곽 갓돌';group.add(m);}
 [...body,...parapets,...caps].forEach(g=>g.dispose());
 group.userData={length,report};return group;
}

// ── 5. 게임 속 「남산 전망탑」: 둥근 받침 건물 + 가늘어지는 기둥 + 큰 전망 원반 + 빨강·흰 안테나. 실제 탑을 본뜬 것이 아니라 동동이 화풍의 통통한 탑.
// 밤에는 전망 원반 창 띠가 몇 초마다 색을 바꾸고(설계 §6 재미 1) 기둥에 은은한 빛, 꼭대기 빨간 등이 깜빡인다. update(t, night 0~1)를 매 프레임 부른다.
export const TOWER={baseR:10.5,baseH:7,shaftTop:104,podMid:114,podR:13.5,deckTop:130,top:236,colors:['#5fb6ff','#a77bff','#ff7ab8','#5fe0b0','#ffd36b']};
export function buildViewTower(){
 const C=NAMSAN_COLORS,root=new THREE.Group();root.name='남산 전망탑';
 const lathe=(pts,seg=40)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
 const add=(g,mat,name,shadow=true)=>{const m=new THREE.Mesh(g,mat);m.name=name;m.castShadow=shadow;m.receiveShadow=true;root.add(m);return m;};
 const body=std(C.towerBody),trim=std(C.towerTrim),roof=std(C.roof);
 // 받침 건물: 2층 둥근 집 + 창 띠 + 넓은 지붕
 add(lathe([[0,0],[TOWER.baseR+1.2,0],[TOWER.baseR+1.2,.6],[TOWER.baseR,.6],[TOWER.baseR,TOWER.baseH],[0,TOWER.baseH]]),body,'전망탑 받침');
 add(lathe([[TOWER.baseR+.05,2.4],[TOWER.baseR+.05,5.6]]),std(C.towerGlass,{emissive:new THREE.Color(0)}),'전망탑 받침 창');
 add(lathe([[0,TOWER.baseH],[TOWER.baseR+2.6,TOWER.baseH],[TOWER.baseR+2.6,TOWER.baseH+.9],[TOWER.baseR-2,TOWER.baseH+1.6],[0,TOWER.baseH+1.6]]),roof,'전망탑 받침 지붕');
 // 기둥: 아래가 굵고 위로 가늘게(통통한 카툰 비율), 세로 홈 4줄은 trim
 const shaft=add(lathe([[6.4,TOWER.baseH],[6,30],[5.2,70],[4.7,TOWER.shaftTop]],32),body,'전망탑 기둥');shaft.userData.glow=true;
 // 기둥 가로 띠 4줄(높이 감을 주는 마디)
 for(const y of [28,50,72,92]){const r=6.4-(6.4-4.7)*(y-TOWER.baseH)/(TOWER.shaftTop-TOWER.baseH);add(new THREE.CylinderGeometry(r+.35,r+.35,1.1,32).translate(0,y,0),trim,'전망탑 기둥 마디',false);}
 // 전망 원반: 아래 받침 접시 → 창 띠 → 지붕 돔
 const P=TOWER.podMid,R=TOWER.podR;
 add(lathe([[4.7,P-10],[8,P-8.6],[11.5,P-6.4],[R,P-4]]),body,'전망 원반 아래');
 add(lathe([[R,P-4],[R+.4,P-3.6],[R+.4,P+.2],[R,P+.6]]),trim,'전망 원반 테');
 const band=add(lathe([[R-.15,P+.6],[R-.15,P+4.8]]),std(C.towerGlass,{emissive:new THREE.Color(0),roughness:.4}),'전망 원반 창 띠');
 add(lathe([[R,P+4.8],[R+.6,P+5.2],[R-1,P+6.6],[8,P+8.4],[4.5,P+9.6],[3.2,P+10.2],[0,P+10.4]]),body,'전망 원반 지붕');
 // 작은 둘째 전망대 + 안테나(빨강·흰 띠 8칸, 위로 가늘게)
 add(lathe([[3.4,P+10.2],[4.6,P+11],[4.6,TOWER.deckTop-2],[3.6,TOWER.deckTop],[0,TOWER.deckTop]],24),trim,'둘째 전망대');
 const bands=8,h=(TOWER.top-TOWER.deckTop-6)/bands;
 for(let i=0;i<bands;i++){const r0=2.4-1.7*i/bands,r1=2.4-1.7*(i+1)/bands,g=new THREE.CylinderGeometry(r1,r0,h,16);g.translate(0,TOWER.deckTop+h*(i+.5),0);add(g,std(i%2?C.mastWhite:C.mastRed),'안테나',false);}
 const tip=add(new THREE.SphereGeometry(.9,12,8).translate(0,TOWER.top-5.2,0),std('#ff3b2f',{emissive:new THREE.Color('#ff2a1a'),emissiveIntensity:0}),'안테나 끝 등',false);
 // 받침 둘레 낮은 원형 화단(게임 소품)
 add(lathe([[TOWER.baseR+2,0],[TOWER.baseR+3.6,0],[TOWER.baseR+3.6,.55],[TOWER.baseR+2,.55]],48),std(C.stone),'탑 둘레 화단 테');
 add(lathe([[TOWER.baseR+2.1,.5],[TOWER.baseR+3.5,.5]],48),std('#6f9b4f'),'탑 둘레 화단 풀');
 const col=new THREE.Color(),colB=new THREE.Color();
 root.userData.update=(t,night)=>{
  // 색 바꾸기: 6초마다 다음 색, 1.2초 동안 섞임. 낮에는 끔(night=0).
  const list=TOWER.colors,k=t/6,i=Math.floor(k)%list.length,f=Math.min(1,(k%1)/.2);col.set(list[i]).lerp(colB.set(list[(i+list.length-1)%list.length]),1-f);
  for(const m of [band,root.getObjectByName('전망탑 받침 창')]){const mat=m.material;if(mat.emissive){mat.emissive.copy(m===band?col:colB.set('#ffcf8a'));mat.emissiveIntensity=night*(m===band?1.6:.9);}}
  if(shaft.material.emissive){shaft.material.emissive.copy(col).lerp(colB.set('#ffffff'),.6);shaft.material.emissiveIntensity=night*.18;}
  if(tip.material.emissive)tip.material.emissiveIntensity=night*(Math.sin(t*3.2)>0?2.2:.15)+(1-night)*.4*(Math.sin(t*3.2)>0?1:0);
 };
 // 높은 부분은 그림자를 받지 않는다(그림자 범위 60m 경계가 기둥에 띠로 보임). 명암은 카툰 3단으로만.
 root.traverse(o=>{if(o.isMesh&&!/받침|화단/.test(o.name))o.receiveShadow=false;});
 root.userData.size={height:TOWER.top,radius:TOWER.podR};
 return root;
}

// ── 6. 광장: 정상(전망탑 둘레)·출발 두 곳. 판석 원판 + 낮은 돌 테(0.4m) ──
export function buildPlaza(P,{name,ring=true,cutTo=null}={}){
 const group=new THREE.Group();group.name=name;
 const disk=new THREE.CircleGeometry(P.r,72);disk.rotateX(-Math.PI/2);const uv=disk.attributes.uv,p=disk.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/8,p.getZ(i)/8);
 const m=new THREE.Mesh(disk,std('#ffffff',{map:plazaMap()}));m.position.set(P.x,P.y+.04,P.z);m.receiveShadow=true;m.name=`${name} 바닥`;group.add(m);
 if(ring){const g=[];const n=Math.round(P.r*2*Math.PI/1.2);for(let i=0;i<n;i++){const a=i/n*Math.PI*2;if(cutTo&&cutTo.some(c=>Math.abs(Math.atan2(Math.sin(a-c.a),Math.cos(a-c.a)))<c.w))continue;
   const b=new THREE.BoxGeometry(.5,.9,1.12);b.rotateY(-a);b.translate(P.x+Math.cos(a)*(P.r+.25),P.y-.05,P.z+Math.sin(a)*(P.r+.25));g.push(b);}
  if(g.length){const r=new THREE.Mesh(mergeGeometries(g),std(NAMSAN_COLORS.stone));r.name=`${name} 돌 테`;r.castShadow=r.receiveShadow=true;group.add(r);g.forEach(x=>x.dispose());}}
 return group;
}

// ── 7. 등불: 코스 옆 낮은 돌 등(0.95m), 밤에 따뜻한 빛. 실제 빛(점광원)은 관악산 night-lighting.js 풀(4개)을 쓰도록 자리만 넘긴다 ──
export function buildLanterns(G,{every=28}={}){
 const pts=G.points,spots=[],group=new THREE.Group();group.name='성곽길 등불';
 for(let s=10,k=0;s<pts.at(-1).s-20;s+=every,k++){const m=courseAt(pts,s),side=k%2?1:-1,off=(m.stairs?NAMSAN.stairWidth/2+.55:NAMSAN.pathWidth/2+.55)*side;const x=m.x+m.nx*off,z=m.z+m.nz*off;spots.push({x,z,y:G.ground(x,z),s});}
 const post=[],lamp=[];
 for(const p of spots){const b=new THREE.BoxGeometry(.22,1.3,.22);b.translate(p.x,p.y+.3,p.z);post.push(b);const c=new THREE.BoxGeometry(.36,.08,.36);c.translate(p.x,p.y+.98,p.z);post.push(c);
  const l=new THREE.BoxGeometry(.26,.24,.26);l.translate(p.x,p.y+.83,p.z);lamp.push(l);}
 const pm=new THREE.Mesh(mergeGeometries(post),std(NAMSAN_COLORS.lampPost));pm.name='등불 기둥';pm.castShadow=true;group.add(pm);
 const lm=new THREE.Mesh(mergeGeometries(lamp),std('#f6ead2',{emissive:new THREE.Color(NAMSAN_COLORS.lampGlow),emissiveIntensity:0}));lm.name='등불 빛';group.add(lm);
 [...post,...lamp].forEach(g=>g.dispose());
 group.userData={spots,update:night=>{if(lm.material.emissive)lm.material.emissiveIntensity=night*1.0;}};
 return group;
}

// ── 8. 이정표·스탬프함·정상 표지석·쉼터(전망 데크 + 벤치 2개) ──
function bearingAngle(root,dx,dz){return Math.atan2(dx,dz)-root.rotation.y;}
export function buildTrailFurniture(G){
 const pts=G.points,group=new THREE.Group();group.name='남산 이정표·스탬프·쉼터';const items=[];
 const sideAt=(m,off)=>({x:m.x+m.nx*off,z:m.z+m.nz*off});
 // 이정표: 오르는 방향 오른쪽 가장자리. 첫 판은 위(정상) 방향, 「뒤를 돌아보면」은 뒤, 「남서쪽 전망」은 남서, 정상 방향판은 실제 방위.
 const GWANAK={x:0,z:0},BUKHAN={x:4120,z:-21438};
 NAMSAN.signs.forEach((sg,i)=>{
  const m=courseAt(pts,sg.s),half=m.stairs?NAMSAN.stairWidth/2+.5:NAMSAN.pathWidth/2+.55,p=sideAt(m,half+.25);
  const root=new THREE.Group();root.rotation.y=Math.atan2(m.tx,m.tz);
  const boards=sg.boards.map(text=>{let a=0;
   if(/돌아보면/.test(text))a=Math.PI;else if(/남서/.test(text))a=bearingAngle(root,-.7,.7);
   else if(/관악산/.test(text))a=bearingAngle(root,GWANAK.x-p.x,GWANAK.z-p.z);else if(/북한산/.test(text))a=bearingAngle(root,BUKHAN.x-p.x,BUKHAN.z-p.z);
   return {text,angle:a};});
  const model=trailSignModel(0,boards);root.add(model);root.position.set(p.x,G.ground(p.x,p.z),p.z);root.name=`이정표 ${i+1}`;group.add(root);items.push({kind:'sign',n:i+1,s:sg.s,x:p.x,z:p.z});
 });
 // 스탬프함: 왼쪽 가장자리, 함 앞이 길을 봄
 for(const st of NAMSAN.stamps){
  const m=courseAt(pts,st.s),half=m.stairs?NAMSAN.stairWidth/2+.5:NAMSAN.pathWidth/2+.6,p=sideAt(m,-(half+.3));
  const box=stampBoxModel(0,{number:st.n,glyph:st.glyph,total:NAMSAN.stamps.length});box.position.set(p.x,G.ground(p.x,p.z),p.z);box.rotation.y=Math.atan2(m.nx,m.nz);box.name=`스탬프함 ${st.n} ${st.glyph}`;group.add(box);items.push({kind:'stamp',n:st.n,glyph:st.glyph,s:st.s,x:p.x,z:p.z,heading:box.rotation.y});
 }
 // 정상 표지석 「남산 265m」: 코스 끝에서 광장 쪽 6m, 오는 사람을 봄
 {const e=pts.at(-1),tw=NAMSAN.tower,ox=e.x-tw.x,oz=e.z-tw.z,ol=Math.hypot(ox,oz)||1,R=Math.max(ol+2,TOWER.baseR+8),x=tw.x+ox/ol*R+(-oz/ol)*4.5,z=tw.z+oz/ol*R+(ox/ol)*4.5,y=G.plaza.y+.04,dx=tw.x-x,dz=tw.z-z; // 코스 끝 옆, 탑 반대쪽(화단 밖)에서 탑을 등지고 오는 사람을 봄
  // 앞(바깥, 한자)과 뒤(광장 쪽, 한글) 두 면을 평평하게 깎아 글자를 새긴다(11-20: 광장 안·옆에서 오면 뒷면만 보여 그냥 바위로 보였음)
  const stoneG=markerStone(0,.62,.62,.72,.42,5,.3);{const sp=stoneG.attributes.position;for(let i=0;i<sp.count;i++)sp.setZ(i,Math.max(-.3,sp.getZ(i)));stoneG.computeVertexNormals();}
  const stone=new THREE.Mesh(stoneG,std('#9c968a',{flatShading:true}));stone.castShadow=true;stone.name='정상 표지석';
  const face=canvasMap(256,512,(g,w,h)=>{g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.font=`bold 150px "Noto Serif CJK KR","AppleMyungjo",serif`;
   for(const [ch,yy] of [['南',120],['山',290]]){g.fillStyle='rgba(240,236,226,.6)';g.fillText(ch,w/2+3,yy+4);g.fillStyle='#2a2925';g.fillText(ch,w/2,yy);}
   g.font=`bold 58px ${FONT}`;g.fillStyle='#2a2925';g.fillText(`${NAMSAN.label.height}m`,w/2,440);},false);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(.5,1),new THREE.MeshStandardMaterial({map:face,transparent:true,alphaTest:.3,depthWrite:false}));plane.position.set(0,.66,.305);plane.name='정상 표지석 글자';
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.15,.3,10),std(NAMSAN_COLORS.stone));base.position.y=.05;base.receiveShadow=true;
  const backFace=canvasMap(256,512,(g,w,h)=>{g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.font=`bold 120px ${FONT}`;
   for(const [ch,yy] of [['남',125],['산',275]]){g.fillStyle='rgba(240,236,226,.6)';g.fillText(ch,w/2+3,yy+4);g.fillStyle='#2a2925';g.fillText(ch,w/2,yy);}
   g.font=`bold 58px ${FONT}`;g.fillStyle='#2a2925';g.fillText(`${NAMSAN.label.height}m`,w/2,425);},false);
  const back=new THREE.Mesh(plane.geometry,new THREE.MeshStandardMaterial({map:backFace,transparent:true,alphaTest:.3,depthWrite:false}));back.position.set(0,.66,-.305);back.rotation.y=Math.PI;back.name='정상 표지석 뒷면 글자';
  const holder=new THREE.Group();holder.add(base,stone,plane,back);stone.position.y=.15;plane.position.y+=.15;back.position.y+=.15;holder.position.set(x,y,z);holder.rotation.y=Math.atan2(-dx,-dz);holder.name='정상 표지석 「남산 265m」';group.add(holder);
  items.push({kind:'summit-stone',x,z,heading:holder.rotation.y});}
 // 쉼터: 남서쪽으로 트인 쪽에 돌판 데크(6×3.4m) + 나무 난간 + 벤치 2개(남서를 봄)
 {const m=courseAt(pts,NAMSAN.rest.s),side=G.restSide??((m.nx*-.7+m.nz*.7)>0?1:-1),off=(NAMSAN.pathWidth/2+1.9)*side,c=sideAt(m,off),y=m.y+.02;
  const deck=new THREE.Group();deck.name='서쪽 전망 쉼터';deck.position.set(c.x,y,c.z);deck.rotation.y=Math.atan2(m.tx,m.tz);
  const slab=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.6,6),std('#ffffff',{map:plazaMap()}));slab.position.y=-.76;slab.receiveShadow=true;slab.name='쉼터 돌판';
  {const uv=slab.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*1.5,uv.getY(i)*1.5);}
  deck.add(slab);
  const rail=[];const rx=1.6*side;for(const z of [-2.9,-1.45,0,1.45,2.9]){const p=new THREE.BoxGeometry(.12,1,.12);p.translate(rx,.5,z);rail.push(p);}
  for(const yy of [.55,.95]){const b=new THREE.BoxGeometry(.08,.08,5.9);b.translate(rx,yy,0);rail.push(b);}
  const rm=new THREE.Mesh(mergeGeometries(rail),std(NAMSAN_COLORS.rail));rm.castShadow=true;rm.name='쉼터 난간';if(!G.restOnWall)deck.add(rm);else rail.forEach(g=>g.dispose()); // 성곽 낮춘 단 위면 바깥 여장이 난간
  for(const z of [-1.4,1.4]){const b=bench();b.position.set(.25*side,0,z);b.rotation.y=side>0?-Math.PI/2:Math.PI/2;deck.add(b);}
  group.add(deck);items.push({kind:'rest',s:NAMSAN.rest.s,x:c.x,z:c.z,y,heading:deck.rotation.y,benches:2});}
 group.userData.items=items;return group;
}

// 정상 광장 둘레 벤치·등(게임 소품)
export function buildPlazaProps(G){
 const P=G.plaza,group=new THREE.Group();group.name='정상 광장 소품';const tw=NAMSAN.tower;
 const onBus=(x,z)=>G.bus&&(G.bus.nearest(x,z).distance<G.bus.points[0].width/2+2.2||G.bus.cycle.nearest(x,z).distance<3.2); // 순환버스 차로·세우는 칸 위는 비움
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,r=P.r-3.2,x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r;if(Math.hypot(x-tw.x,z-tw.z)<26||onBus(x,z))continue;const b=bench();b.position.set(x,P.y+.04,z);b.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));group.add(b);}
 group.userData.update=()=>{}; // 광장 가로등은 namsan-lamps-art.js(쌍등)로 옮김(11-19 밤 가로등)
 return group;
}

// ── 9. 숲: forest.json 배치를 관악산 카툰 나무(toon.natureParts, 같은 id) InstancedMesh로. 코스 120m 안은 LOD1, 그 밖은 LOD2 ──
// mobile: 가까운 LOD1은 60m 안만, 코스에서 200m 밖 나무는 절반만(휴대폰 메모리·그리기 상한, device-profile 기준은 월드개발이 정함)
// keep(d) = 길에서 d m 떨어진 나무를 남길 몫(0~1, 월드개발 11-19 휴대폰 성능). 없으면 예전 규칙(휴대폰은 200m 밖 절반).
export function buildForest(G,forest,natureParts,{nearDist=120,maxTrees=Infinity,mobile=false,keep=null}={}){
 if(mobile)nearDist=Math.min(nearDist,60);
 const group=new THREE.Group();group.name='남산 숲';
 const buckets=new Map();let n=0;
 const busClear=G.bus?G.bus.points[0].width/2+2.5:0; // 순환버스 차로 위·연석 옆 2.5m 안에는 나무를 심지 않는다
 for(const [id,x,z,scale,yaw] of forest.trees){if(n++>=maxTrees)break;if(busClear&&G.bus.nearest(x,z).distance<busClear)continue;const hit=G.nearest(x,z);if(keep){const f=keep(hit.distance);if(f<1&&(((Math.sin(x*12.9898+z*78.233)*43758.5453)%1+1)%1)>=f)continue;}else if(mobile&&hit.distance>200&&((x*7.3+z*3.1)|0)%2)continue;const lod=hit.distance<nearDist?1:2,k=`${id}:${lod}:${Math.floor(x/400)},${Math.floor(z/400)}`; /* 400m 칸으로 나눠 화면 밖 칸은 안 그림 */if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push([x,z,scale,yaw]);}
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);let tris=0;
 for(const [k,list] of buckets){const [id,lod,cellKey]=k.split(':'),parts=natureParts(`${id}-lod${lod}.glb`);if(!parts)continue;
  for(const part of parts){const im=new THREE.InstancedMesh(part.geometry,part.material,list.length);im.name=`남산 숲 ${id} LOD${lod} ${cellKey}`;
   list.forEach(([x,z,sc,yaw],i)=>{p.set(x,G.ground(x,z)-.15,z);q.setFromAxisAngle(up,yaw);s.setScalar(sc);im.setMatrixAt(i,m.compose(p,q,s));});
   im.instanceMatrix.needsUpdate=true;im.castShadow=lod==='1';im.receiveShadow=true;im.computeBoundingSphere();group.add(im);tris+=part.geometry.index?part.geometry.index.count/3*list.length:part.geometry.attributes.position.count/3*list.length;}}
 group.userData={trees:Math.min(n,forest.trees.length),triangles:tris};return group;
}

// ── 한 번에 조립: 붙이는 쪽 예시(미리보기 preview.js도 이 함수를 쓴다) ──
// terrainTile·forestKeep: 붙이는 쪽 성능 조절(월드개발 11-19, 휴대폰). 기본은 예전 그대로.
export function buildNamsan({G,data,toon,forest=true,mobile=false,terrainTile=100,forestKeep=null,forestNear=undefined}){
 const root=new THREE.Group();root.name='남산';
 const terrain=buildNamsanTerrain(G,toon.materialFactory.terrain(),{mobile,tile:terrainTile});toon.toonify(terrain,{kind:'prop'});
 const path=buildCoursePath(G),stairs=buildStoneStairs(G),wall=buildFortressWall(G,data.walls);
 // 쉼터는 성곽이 지나는 쪽(낮춘 단 위)에 둔다. 성곽이 없으면 남서쪽.
 {const lz=wallLowZone(G),near=data.walls.find(w=>w.courseSide&&w.points.some(p=>Math.hypot(p.x-lz.x,p.z-lz.z)<lz.r));if(near){G.restSide=near.courseSide;G.restOnWall=true;}}
 const tower=buildViewTower();tower.position.set(NAMSAN.tower.x,G.plaza.y,NAMSAN.tower.z);
 // 순환버스 차로가 정상 광장으로 들어오는 곳은 돌 테를 끊는다
 const busCut=G.bus?(()=>{const P=G.plaza,pt=G.bus.points.find(p=>Math.hypot(p.x-P.x,p.z-P.z)<P.r+.5);return pt?[{a:Math.atan2(pt.z-P.z,pt.x-P.x),w:Math.atan((G.bus.points[0].width/2+.8)/P.r)}]:null;})():null;
 const plaza=buildPlaza(G.plaza,{name:'정상 광장',cutTo:busCut}),start=buildPlaza(G.startPlaza,{name:'출발 광장',ring:false});
 const lanterns=buildLanterns(G),furniture=buildTrailFurniture(G),plazaProps=buildPlazaProps(G);
 const props=new THREE.Group();props.name='남산 시설';props.add(path,stairs,wall,tower,plaza,start,lanterns,plazaProps);
 toon.toonify(props,{kind:'prop'});toon.toonify(furniture,{kind:'prop',keepMaps:true});
 root.add(terrain,props,furniture);
 // 밤 가로등(월드아트 11-19): 코스·계단·광장·쉼터·정류장 등 + 성곽 벽 비춤. 불빛은 그림 효과, 실제 광원은 night-lighting.js lampPoints로(월드개발 연결)
 const lamps=buildNamsanLamps(G,{walls:data.walls,lanterns:lanterns.userData.spots,items:furniture.userData.items});toon.toonify(lamps.userData.body,{kind:'prop'});root.add(lamps);
 // 순환버스(월드아트 11-19): 차로·정류장·하차 지점·버스 한 대. 움직임은 월드개발(ns.bus.bus를 placeOnLane으로 옮김)
 const bus=G.bus?buildNamsanBus(G):null;if(bus){toon.toonify(bus.root,{kind:'prop',keepMaps:true});root.add(bus.root);}
 let trees=null;if(forest&&data.forest&&toon.natureParts){trees=buildForest(G,data.forest,toon.natureParts,{mobile,keep:forestKeep,...(forestNear?{nearDist:forestNear}:{})});root.add(trees);}
 const update=(t,night)=>{tower.userData.update(t,night);lanterns.userData.update(night);plazaProps.userData.update(night);lamps.userData.update(night);bus?.update(t,night);};
 return {root,terrain,path,stairs,wall,tower,plaza,start,lanterns,furniture,plazaProps,lamps,trees,bus,update};
}
