// 남산 순환버스 차로 선 만들기(월드아트, 11-19). 백범광장 옆 소월로 → 남산공원길 → 정상 광장 가장자리까지 OSM 차도 최단 경로.
// 차로 모양만 실제 길을 참고하고(게임 속 차로), 높이는 화면에서 지형으로 정한다(src/namsan/namsan-data.js createBusLane).
// 입력: assets/realistic/raw/namsan-osm.json(OSM Overpass 11-19) · 출력: assets/shared/namsan/bus-road.json — 실행: node scripts/namsan/build-namsan-bus.mjs
import fs from 'node:fs';
import {project} from '../../assets/realistic/geo.js';

const osm=JSON.parse(fs.readFileSync('assets/realistic/raw/namsan-osm.json','utf8'));
const mLat=111320,mLon=111320*Math.cos(37.55*Math.PI/180),dist=(a,b)=>Math.hypot((a[0]-b[0])*mLat,(a[1]-b[1])*mLon);
const key=g=>g.lat.toFixed(6)+','+g.lon.toFixed(6),nodes=new Map(),adj=new Map();
const NOT_CAR=['footway','steps','path','pedestrian','cycleway','track','corridor','construction','proposed','motorway','trunk'];
for(const e of osm.elements){const t=e.tags||{},h=t.highway;if(!h||!e.geometry||NOT_CAR.includes(h))continue;
 const f=t.name==='남산공원길'?.5:1; // 순환버스가 다니는 남산공원길을 고른다
 const g=e.geometry;for(let i=0;i+1<g.length;i++){const a=key(g[i]),b=key(g[i+1]);nodes.set(a,[g[i].lat,g[i].lon]);nodes.set(b,[g[i+1].lat,g[i+1].lon]);const L=dist(nodes.get(a),nodes.get(b));
  for(const [u,v] of [[a,b],[b,a]]){if(!adj.has(u))adj.set(u,[]);adj.get(u).push([v,L*f,t.name||'']);}}}
const near=(la,lo)=>{let bk,bd=1e9;for(const [k,p] of nodes){const d=dist(p,[la,lo]);if(d<bd){bd=d;bk=k;}}return bk;};
function shortest(s,t){const D=new Map([[s,0]]),P=new Map(),done=new Set(),Q=[[0,s]];
 while(Q.length){Q.sort((a,b)=>a[0]-b[0]);const [du,u]=Q.shift();if(done.has(u))continue;done.add(u);if(u===t)break;
  for(const [v,w,n] of adj.get(u)||[]){const nd=du+w;if(nd<(D.get(v)??1e18)){D.set(v,nd);P.set(v,[u,n]);Q.push([nd,v]);}}}
 const path=[{k:t}];let c=t;while(P.has(c)){const [u,n]=P.get(c);path[0].name=n;path.unshift({k:u});c=u;}return path;}
// 코스 자료(build-namsan-data.mjs)와 같은 출발·정상 기준점
const START=[37.5547,126.9812],TOP=[37.5513,126.9882];
const raw=shortest(near(...START),near(...TOP)).map(p=>{const [lat,lon]=nodes.get(p.k),q=project(lat,lon);return {x:q.x,z:q.z,name:p.name??''};});
// 3m 간격으로 다시 찍고, 꺾인 모서리를 앞뒤 평균으로 두 번 둥글린다(버스가 꺾이지 않게)
let pts=[];for(let i=0;i<raw.length-1;i++){const a=raw[i],b=raw[i+1],L=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.round(L/3));for(let k=0;k<n;k++)pts.push({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n,name:b.name});}
pts.push({...raw.at(-1)});
for(let pass=0;pass<3;pass++)pts=pts.map((p,i)=>i===0||i===pts.length-1?p:{...p,x:(pts[i-1].x+p.x*2+pts[i+1].x)/4,z:(pts[i-1].z+p.z*2+pts[i+1].z)/4});
// 굽은 반지름이 14m보다 작은 곳(머리핀)은 그 둘레만 더 둥글린다 — 바깥 차선(1.6m 옆)도 버스가 돌 수 있게
const radius=i=>{const a=pts[i-1],b=pts[i],c=pts[i+1],h1=Math.atan2(b.x-a.x,b.z-a.z),h2=Math.atan2(c.x-b.x,c.z-b.z);let d=Math.abs(h2-h1);if(d>Math.PI)d=2*Math.PI-d;return (Math.hypot(b.x-a.x,b.z-a.z)+Math.hypot(c.x-b.x,c.z-b.z))/2/(d||1e-9);};
for(let pass=0;pass<400;pass++){const bad=[];for(let i=2;i<pts.length-2;i++)if(radius(i)<14)bad.push(i);if(!bad.length)break;
 for(const i of bad)for(let j=Math.max(1,i-3);j<=Math.min(pts.length-2,i+3);j++)pts[j]={...pts[j],x:(pts[j-1].x+pts[j].x*2+pts[j+1].x)/4,z:(pts[j-1].z+pts[j].z*2+pts[j+1].z)/4};}
{let m=1e9;for(let i=2;i<pts.length-2;i++)m=Math.min(m,radius(i));console.log('가장 작은 굽은 반지름',m.toFixed(1),'m');}
let s=0;const out=pts.map((p,i)=>{if(i)s+=Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z);return {x:+p.x.toFixed(2),z:+p.z.toFixed(2),s:+s.toFixed(1)};});
const names=[];for(const p of pts)if(p.name&&names.at(-1)!==p.name)names.push(p.name);
fs.writeFileSync('assets/shared/namsan/bus-road.json',JSON.stringify({made:'2026-11-19',by:'월드아트 scripts/namsan/build-namsan-bus.mjs',
 note:'남산 순환버스 차로 중심선(게임 좌표, 3m 간격). 모양은 OSM 차도(소월로→남산공원길) 참고, 높이는 화면에서 지형으로 정함. 실제 노선·번호와 무관',
 source:'© OpenStreetMap contributors (ODbL)',roads:names,length:+s.toFixed(1),points:out}));
console.log(`버스 차로 ${out.length}점 · ${s.toFixed(0)}m · ${names.join(' → ')}`);
