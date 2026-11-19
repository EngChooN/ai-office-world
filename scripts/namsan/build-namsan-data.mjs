// 남산 그림 자료 만들기(월드아트, 11-19). 지형 격자·코스(A 성곽 계단길)·성곽 선을 관악산과 같은 게임 좌표(assets/realistic/geo.js, 관악산 원점)로 뽑는다.
// 두 산을 한 세계 좌표에 두면 서울 도심 건물(generated/seoul-*.json)·원경 격자(far.f32)를 그대로 쓰고, 정상에서 서로 보인다(설계 §4 두 산 잇기).
// 입력: assets/realistic/raw/N37_E126.tif·N37_E127.tif(Copernicus DSM 30m), raw/namsan-osm.json(OSM Overpass 11-19, 월드리서치가 받은 것)
// 출력: assets/shared/namsan/terrain.f32(+meta), course.json, walls.json — 실행: node scripts/namsan/build-namsan-data.mjs
import fs from 'node:fs';
import {fromArrayBuffer} from '../../assets/realistic/tools/node_modules/geotiff/dist-module/geotiff.js';
import {project,unproject} from '../../assets/realistic/geo.js';

const RAW='assets/realistic/raw/',OUT='assets/shared/namsan/';
fs.mkdirSync(OUT,{recursive:true});
const tiles=[];
for(const east of [126,127]){
 const b=fs.readFileSync(`${RAW}N37_E${east}.tif`),tiff=await fromArrayBuffer(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),image=await tiff.getImage();
 const [ox,oy]=image.getOrigin(),[rx,ry]=image.getResolution(),pixelIsArea=image.getGeoKeys().GTRasterTypeGeoKey===1;
 // 남산 둘레만 읽는다(전체 타일은 수백 MB).
 const W=image.getWidth(),col0=east===126?3300:0,col1=east===126?W:200,row0=1450,row1=1750;
 const values=await image.readRasters({window:[col0,row0,col1,row1],samples:[0],interleave:true});
 tiles.push({east,values,ox,oy,rx,ry,col0,row0,w:col1-col0,h:row1-row0,offset:pixelIsArea?.5:0});
}
// prepare.mjs demHeight와 같은 쌍선형 보간(창 기준으로 옮김)
export function demLatLon(lat,lon){
 const t=tiles.find(t=>Math.floor(lon)===t.east);
 const u=(lon-t.ox)/t.rx-t.offset-t.col0,v=(lat-t.oy)/t.ry-t.offset-t.row0;
 const i=Math.max(0,Math.min(t.w-2,Math.floor(u))),j=Math.max(0,Math.min(t.h-2,Math.floor(v))),fx=Math.max(0,Math.min(1,u-i)),fy=Math.max(0,Math.min(1,v-j));
 const at=(x,y)=>t.values[y*t.w+x];
 return (1-fy)*((1-fx)*at(i,j)+fx*at(i+1,j))+fy*((1-fx)*at(i,j+1)+fx*at(i+1,j+1));
}
const dem=(x,z)=>{const {lat,lon}=unproject(x,z);return demLatLon(lat,lon);};

// ── 1. 지형 격자: 남산 전체(서 남대문 ~ 동 장충동, 북 명동 ~ 남 해방촌) 8m 간격. 관악산 near.f32와 같은 형식 ──
const SW=project(37.5395,126.9735),NE=project(37.5625,127.0065),SP=8;
const x0=Math.floor(SW.x/SP)*SP,z0=Math.floor(NE.z/SP)*SP,width=Math.ceil((NE.x-x0)/SP)+1,height=Math.ceil((SW.z-z0)/SP)+1;
const grid=new Float32Array(width*height);
for(let j=0;j<height;j++)for(let i=0;i<width;i++)grid[j*width+i]=dem(x0+i*SP,z0+j*SP);
fs.writeFileSync(OUT+'terrain.f32',Buffer.from(grid.buffer));

// ── 2. 코스 A: 백범광장 → 정상(OSM 걷는 길 최단 경로, 월드디자인 profile.mjs와 같은 가중치) ──
const osm=JSON.parse(fs.readFileSync(RAW+'namsan-osm.json','utf8'));
const mLat=111320,mLon=111320*Math.cos(37.55*Math.PI/180),dist=(a,b)=>Math.hypot((a[0]-b[0])*mLat,(a[1]-b[1])*mLon);
const key=p=>p.lat.toFixed(6)+','+p.lon.toFixed(6),nodes=new Map(),adj=new Map();
for(const e of osm.elements){const t=e.tags||{},h=t.highway;if(!h||!e.geometry)continue;
 if(['motorway','motorway_link','trunk','construction','proposed'].includes(h))continue;
 const f=['primary','secondary','tertiary','primary_link'].includes(h)?4:['residential','service','unclassified'].includes(h)?1.6:1;
 const g=e.geometry;for(let i=0;i+1<g.length;i++){const a=key(g[i]),b=key(g[i+1]);nodes.set(a,[g[i].lat,g[i].lon]);nodes.set(b,[g[i+1].lat,g[i+1].lon]);const L=dist(nodes.get(a),nodes.get(b));
  for(const [u,v] of [[a,b],[b,a]]){if(!adj.has(u))adj.set(u,[]);adj.get(u).push([v,L*f,h==='steps',t.name||'']);}}}
const near=(la,lo)=>{let bk,bd=1e9;for(const [k,p] of nodes){const d=dist(p,[la,lo]);if(d<bd&&adj.get(k).length){bd=d;bk=k;}}return bk;};
function shortest(s,t){const D=new Map([[s,0]]),P=new Map(),done=new Set(),Q=[[0,s]];
 while(Q.length){Q.sort((a,b)=>a[0]-b[0]);const [du,u]=Q.shift();if(done.has(u))continue;done.add(u);if(u===t)break;
  for(const [v,w,st,n] of adj.get(u)||[]){const nd=du+w;if(nd<(D.get(v)??1e18)){D.set(v,nd);P.set(v,[u,st,n]);Q.push([nd,v]);}}}
 const path=[{k:t}];let c=t;while(P.has(c)){const [u,st,n]=P.get(c);path[0].stairs=st;path[0].name=n;path.unshift({k:u});c=u;}return path;}
const START=[37.5547,126.9812],TOP=[37.5513,126.9882];
const raw=shortest(near(...START),near(...TOP)).map(p=>{const [lat,lon]=nodes.get(p.k),q=project(lat,lon);return {lat,lon,x:q.x,z:q.z,stairs:!!p.stairs,name:p.name??''};});
// 1m보다 촘촘한 점 정리 + 4m 간격으로 채움(계단 단·성곽을 붙일 때 기준). 계단 여부는 그 점에서 다음 점까지 구간의 값이다.
const course=[];let s=0;
for(let i=0;i<raw.length;i++){const p=raw[i],n=raw[i+1];
 if(i)s+=Math.hypot(p.x-raw[i-1].x,p.z-raw[i-1].z);
 const stairs=n?n.stairs:false;
 if(!course.length||Math.hypot(p.x-course.at(-1).x,p.z-course.at(-1).z)>.5)course.push({x:p.x,z:p.z,s,stairs});
 if(n){const L=Math.hypot(n.x-p.x,n.z-p.z),k=Math.floor(L/4);for(let m=1;m<k;m++){const t=m/k,x=p.x+(n.x-p.x)*t,z=p.z+(n.z-p.z)*t;course.push({x,z,s:s+L*t,stairs});}}
}
// 높이: DSM은 나무 꼭대기가 섞여 있어(조사 §1) 길 높이를 그대로 쓰면 숲 위를 걷는다. 앞뒤 60m 중 낮은 쪽 25%를 따라가게 깎고 부드럽게 한 뒤,
// 내려가는 곳이 없게 만든다(성곽 계단길은 오르기만 함). 시작 108m·정상 광장 267m 근처(설계 §2)에 맞는지 아래에서 출력한다.
// 숲 아래 땅 = DSM - 7m(src/namsan/namsan-data.js NAMSAN.canopy와 같은 값). 코스는 전 구간이 숲·공원 칸이라 그대로 뺀다.
const CANOPY=7;
const yRaw=course.map(p=>dem(p.x,p.z)-CANOPY);
let y=yRaw.map((_,i)=>{const w=[];for(let j=0;j<course.length;j++)if(Math.abs(course[j].s-course[i].s)<=30)w.push(yRaw[j]);w.sort((a,b)=>a-b);return w[Math.floor(w.length*.25)];});
for(let pass=0;pass<4;pass++)y=y.map((v,i)=>{let a=0,n=0;for(let j=Math.max(0,i-3);j<=Math.min(y.length-1,i+3);j++){a+=y[j];n++;}return a/n;});
for(let i=1;i<y.length;i++)y[i]=Math.max(y[i],y[i-1]);
course.forEach((p,i)=>{p.y=+y[i].toFixed(2);p.x=+p.x.toFixed(2);p.z=+p.z.toFixed(2);p.s=+p.s.toFixed(1);});

// ── 3. 성곽: OSM barrier=city_wall / historic=citywalls 중 남산 둘레 ──
const box={x0,z0,x1:x0+(width-1)*SP,z1:z0+(height-1)*SP};
const walls=[];
for(const e of osm.elements){const t=e.tags||{};if(!(t.barrier==='city_wall'||t.historic==='citywalls')||!e.geometry)continue;
 const pts=e.geometry.map(g=>{const q=project(g.lat,g.lon);return {x:+q.x.toFixed(2),z:+q.z.toFixed(2),ground:+dem(q.x,q.z).toFixed(2)};}).filter(p=>p.x>box.x0&&p.x<box.x1&&p.z>box.z0&&p.z<box.z1);
 if(pts.length>1)walls.push({id:e.id,name:t.name??'',points:pts});}
// 코스와 가까운 성곽(코스 옆을 따라 걷는 부분) 길이
const courseNear=(x,z)=>Math.min(...course.map(p=>Math.hypot(p.x-x,p.z-z)));
let wallLen=0,besideLen=0;for(const w of walls)for(let i=1;i<w.points.length;i++){const a=w.points[i-1],b=w.points[i],L=Math.hypot(b.x-a.x,b.z-a.z);wallLen+=L;if(courseNear((a.x+b.x)/2,(a.z+b.z)/2)<25)besideLen+=L;}

// ── 4. 숲 배치: 8m 칸 + 흔들기. 길·성곽·광장·건물(OSM, generated/seoul-*.json) 자리는 비운다. 공원 아래 시가지는 높이 72m 미만 + 건물 근처로 거른다 ──
const GEN='assets/realistic/generated/',buildings=[];
for(const f of fs.readdirSync(GEN).filter(n=>/^seoul-(west|east)-\d+\.json$/.test(n))){
 for(const b of JSON.parse(fs.readFileSync(GEN+f,'utf8')).buildings){
  let minX=1e9,minZ=1e9,maxX=-1e9,maxZ=-1e9;for(const [x,z] of b.footprint){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);}
  if(maxX<box.x0-50||minX>box.x1+50||maxZ<box.z0-50||minZ>box.z1+50)continue;buildings.push({minX,minZ,maxX,maxZ,h:b.height});}
}
const cell=new Map(),ck=(x,z)=>`${Math.floor(x/50)},${Math.floor(z/50)}`;
for(const b of buildings)for(let x=Math.floor((b.minX-8)/50);x<=Math.floor((b.maxX+8)/50);x++)for(let z=Math.floor((b.minZ-8)/50);z<=Math.floor((b.maxZ+8)/50);z++){const k=`${x},${z}`;if(!cell.has(k))cell.set(k,[]);cell.get(k).push(b);}
const nearBuilding=(x,z,m)=>(cell.get(ck(x,z))||[]).some(b=>x>b.minX-m&&x<b.maxX+m&&z>b.minZ-m&&z<b.maxZ+m);
const wallSegs=walls.flatMap(w=>w.points.slice(1).map((b,i)=>[w.points[i],b]));
const segDist=(x,z,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-dx*t,z-a.z-dz*t);};
const courseSegs=course.slice(1).map((b,i)=>[course[i],b]);
const hash=(i,j,k)=>{const s=Math.sin(i*127.1+j*311.7+k*74.7)*43758.5453;return s-Math.floor(s);};
const TOWER=project(37.551216,126.988276);
const SPECIES=[['island_tree_01',.34],['tree_small_02',.30],['pine_tree_01',.28],['pine_sapling_medium',.08]];
// 공원(숲) 칸 표시: 지형 격자와 같은 칸. 1 = 숲·공원, 0 = 시가지(건물·도로). 높이 72m 이상이고 건물에서 6m 밖, 3×3 다수결 두 번으로 잔점 정리.
// 코스 60m 안은 늘 공원. 화면 지형은 시가지 칸을 회색 바닥 재질로 칠하고, 숲 배치도 이 칸을 따른다.
let land=new Uint8Array(width*height);
for(let j=0;j<height;j++)for(let i=0;i<width;i++){const x=x0+i*SP,z=z0+j*SP;land[j*width+i]=grid[j*width+i]>=72&&!nearBuilding(x,z,6)?1:0;}
for(let pass=0;pass<2;pass++){const next=new Uint8Array(land);for(let j=1;j<height-1;j++)for(let i=1;i<width-1;i++){let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)n+=land[(j+b)*width+i+a];next[j*width+i]=n>=5?1:0;}land=next;}
for(let j=0;j<height;j++)for(let i=0;i<width;i++){const x=x0+i*SP,z=z0+j*SP;if(course.some((p,k)=>k%4===0&&Math.hypot(p.x-x,p.z-z)<60))land[j*width+i]=1;}
fs.writeFileSync(OUT+'landcover.u8',Buffer.from(land.buffer));
const parkAt=(x,z)=>land[Math.round((z-z0)/SP)*width+Math.round((x-x0)/SP)]===1;
const trees=[];
for(let x=box.x0+6;x<box.x1-6;x+=8)for(let z=box.z0+6;z<box.z1-6;z+=8){
 const i=Math.round(x/8),j=Math.round(z/8),px=x+(hash(i,j,1)-.5)*6,pz=z+(hash(i,j,2)-.5)*6;
 if(!parkAt(px,pz)||nearBuilding(px,pz,7))continue;
 // 코스에서 멀수록 성기게(지형 재질의 숲 덩어리 색이 빈 곳을 채운다): 250m 안 다 심음, 그 밖 35%만
 const cd=Math.min(...courseSegs.filter((_,k)=>k%3===0).map(([a])=>Math.hypot(a.x-px,a.z-pz)));
 if(cd>250&&hash(i,j,7)>.35)continue;
 // 정상 광장 둘레 360° 전망(설계 §4)·출발점 뒤 도심 전망(설계 §4 ①②)이 나무에 막히지 않게 비운다
 if(Math.hypot(px-TOWER.x,pz-TOWER.z)<66||Math.hypot(px-course[0].x,pz-course[0].z)<50)continue;
 {let best=1e9,bs=0;for(const [a,b] of courseSegs){const d=segDist(px,pz,a,b);if(d<best){best=d;bs=a.s;}}if(bs<300&&best<14)continue;}
 // 길에서 큰 나무는 7m, 어린 나무는 4.5m 밖(수관이 길과 카메라를 덮지 않게)
 {const cdist=Math.min(...courseSegs.map(([a,b])=>segDist(px,pz,a,b)));if(cdist<4.5||(cdist<7&&hash(i,j,4)<.92))continue;}
 if(wallSegs.some(([a,b])=>segDist(px,pz,a,b)<4))continue;
 if(hash(i,j,3)<.12)continue; // 숲 틈
 let r=hash(i,j,4),id=SPECIES[0][0];for(const [n,p] of SPECIES){if(r<p){id=n;break;}r-=p;}
 if(Math.min(...courseSegs.map(([a,b])=>segDist(px,pz,a,b)))<7)id='pine_sapling_medium';
 trees.push([id,+px.toFixed(1),+pz.toFixed(1),+(.78+hash(i,j,5)*.42).toFixed(2),+(hash(i,j,6)*6.283).toFixed(2)]);
}
// 숨길 OSM 건물: 코스 40m 안, 전망탑 80m 안, 공원 칸 한가운데(공원 시설은 게임 속 환경이라 따로 그리지 않음). 게임 도시 격자에서 이 id만 빼면 된다.
const hide=[];
for(const f of fs.readdirSync(GEN).filter(n=>/^seoul-(west|east)-\d+\.json$/.test(n)))for(const b of JSON.parse(fs.readFileSync(GEN+f,'utf8')).buildings){
 let cx=0,cz=0;for(const [x,z] of b.footprint){cx+=x;cz+=z;}cx/=b.footprint.length;cz/=b.footprint.length;
 if(cx<box.x0||cx>box.x1||cz<box.z0||cz>box.z1)continue;
 const cdist=Math.min(...courseSegs.map(([a,c])=>segDist(cx,cz,a,c)));
 const inPark=[[0,0],[12,0],[-12,0],[0,12],[0,-12]].every(([a,c])=>parkAt(cx+a,cz+c));
 if(cdist<40||Math.hypot(cx-TOWER.x,cz-TOWER.z)<80||inPark)hide.push(b.id);}
fs.writeFileSync(OUT+'city-hide.json',JSON.stringify({note:'남산 화면에서 숨길 OSM 건물 id(generated/seoul-*.json). 코스 40m·전망탑 80m 안·공원 한가운데',ids:hide}));
console.log(`숨길 건물 ${hide.length}동`);
fs.writeFileSync(OUT+'forest.json',JSON.stringify({note:'[종류, x, z, 크기, 돌림]. 높이는 화면 지형(groundAt)에서 읽는다',species:SPECIES.map(s=>s[0]),trees}));
console.log(`건물 ${buildings.length}동 참고, 나무 ${trees.length}그루`);

const summit=project(37.55153,126.98764);
const meta={version:1,made:'2026-11-19',by:'월드아트 scripts/namsan/build-namsan-data.mjs',frame:'관악산과 같은 게임 좌표(assets/realistic/geo.js ORIGIN, 1m, +X 동, -Z 북)',
 landcover:{file:'landcover.u8',format:'uint8 (1 숲·공원, 0 시가지)',note:'terrain과 같은 칸'},
 terrain:{file:'terrain.f32',format:'float32-little-endian',x0,z0,width,height,spacing:SP,note:'Copernicus DSM 30m 쌍선형 보간. 나무·건물 높이가 섞인 값(조사 §1)'},
 summitCell:{x:+summit.x.toFixed(1),z:+summit.z.toFixed(1),dem:+dem(summit.x,summit.z).toFixed(1),label:265},
 sources:['Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved)','© OpenStreetMap contributors (ODbL)']};
fs.writeFileSync(OUT+'namsan-meta.json',JSON.stringify(meta,null,1));
fs.writeFileSync(OUT+'course.json',JSON.stringify({id:'namsan-A',name:'백범광장 → 남산 정상 · 성곽 계단길',length:+course.at(-1).s.toFixed(1),points:course}));
fs.writeFileSync(OUT+'walls.json',JSON.stringify({walls}));
const st=course.filter((p,i)=>p.stairs&&course[i+1]).reduce((a,p,i,arr)=>a,0);
let stairLen=0;for(let i=1;i<course.length;i++)if(course[i-1].stairs)stairLen+=course[i].s-course[i-1].s;
console.log(`지형 ${width}×${height} (${(grid.byteLength/1024).toFixed(0)}KB) x0 ${x0} z0 ${z0}`);
console.log(`코스 ${course.length}점 ${course.at(-1).s.toFixed(0)}m 계단 ${(stairLen/course.at(-1).s*100).toFixed(0)}% 높이 ${course[0].y}→${course.at(-1).y}m (DSM-7m 그대로 ${yRaw[0].toFixed(0)}→${yRaw.at(-1).toFixed(0)})`);
console.log(`성곽 ${walls.length}줄 ${wallLen.toFixed(0)}m, 코스 25m 안 ${besideLen.toFixed(0)}m; 정상 칸 ${meta.summitCell.dem}m @ ${meta.summitCell.x},${meta.summitCell.z}`);
