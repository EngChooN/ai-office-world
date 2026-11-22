// 남산 동물 출현·땅 위 배회 자리 중 길가 덤불과 겹치는 수(11-22, 검수 문제 1). 덤불 검사 전(bushes 없음)·후를 같은 시간 칸으로 센다.
// 게임 game.js와 같은 순서로 남산 그림(buildNamsan, 그리기 없이 형상만)·상호작용 배치를 만들고, 그림이 그린 덤불을 namsanBushesFrom으로 읽는다.
// 실행: node scripts/namsan/count-animal-bush-overlap.mjs [시간 칸 수=24] → artifacts/namsan-animal-bush-2026-11-22/count.json
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import * as THREE from 'three';
import {createToonNature} from '../../src/toon/nature.js';
import {createNamsanGround,openWallsForBus,courseAt} from '../../src/namsan/namsan-data.js';
import {buildNamsan,wallLine} from '../../src/namsan/namsan-art.js';
import {buildNamsanInteract} from '../../src/namsan/namsan-interact-art.js';
import {namsanAnimalZones} from '../../src/namsan/namsan-animal-zones.js';
import {createNamsanAnimalLanes,namsanTrailLanes,namsanBushesFrom,BUSH_CLEAR,NAMSAN_ANIMAL_MIN_OFFSET} from '../../src/namsan/namsan-animal-lanes.js';
import {zoneSpawns,wanderAt,slotOf} from '../../src/animal-zones.js';

// 그리기 없이 형상만 만들므로 캔버스 무늬는 빈 그림으로 둔다
const ctx2d=new Proxy({},{get:(o,k)=>k in o?o[k]:k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k==='measureText'?t=>({width:String(t).length*10}):k==='getImageData'?(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}):()=>{},set:(o,k,v)=>(o[k]=v,true)});
globalThis.document??={createElement:()=>({width:1,height:1,getContext:()=>ctx2d})};
const SLOTS=+(process.argv[2]??24),OUT='artifacts/namsan-animal-bush-2026-11-22';
const dir='assets/shared/namsan/',read=f=>JSON.parse(readFileSync(dir+f,'utf8'));
const meta=read('namsan-meta.json'),buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:read('course.json'),walls:read('walls.json').walls,forest:read('forest.json'),busRoad:read('bus-road.json')};
const G=createNamsanGround(data);data.walls=openWallsForBus(G,data.walls);
const nature=createToonNature({gradientMap:new THREE.DataTexture(new Uint8Array(4),1,1),uniforms:{}});
const toon={materialFactory:{terrain:()=>new THREE.MeshBasicMaterial()},toonify:()=>{},natureParts:()=>null,nature};
const ns=buildNamsan({G,data,toon,grass:false});
const ia=buildNamsanInteract(G,{walls:data.walls,lamps:ns.lamps?.userData.spots??[],lanterns:ns.lanterns.userData.spots,items:ns.furniture.userData.items});
const bushes=namsanBushesFrom(ns.trail),END=G.points.at(-1).s,wallLines=data.walls.map(w=>wallLine(G,w)).filter(Boolean),plan=ia.userData.plan;
const before=createNamsanAnimalLanes(G,{wallLines,plan}),after=createNamsanAnimalLanes(G,{wallLines,plan,bushes});
const zones=namsanAnimalZones(G).map(z=>({...z,minOffset:NAMSAN_ANIMAL_MIN_OFFSET}));
const toWorld=(zone,u,v)=>{const k=courseAt(G.points,u);return {x:k.x-k.tz*v,z:k.z+k.tx*v};};
const SLOT0=slotOf(Date.UTC(2026,10,22,3,0)/1000);
// 겹침 판정은 '후' 판정과 같은 기준(덤불 가장자리 + BUSH_CLEAR) — after.inBush
function count(L){
 const lanes=namsanTrailLanes(L,END),opts={season:'autumn',hour:12,halfWidth:L.halfWidth,toWorld,lanes};
 let spawns=0,spawnHit=0,samples=0,sampleHit=0;const hitAt=[];
 for(let k=0;k<SLOTS;k++)for(const z of zones)for(const sp of zoneSpawns(z,SLOT0+k,opts)){
  spawns++;const p=toWorld(z,sp.u,sp.v);if(after.inBush(p.x,p.z)){spawnHit++;if(hitAt.length<40)hitAt.push({kind:sp.kind,m:+sp.u.toFixed(1),v:+sp.v.toFixed(2)});}
  for(let t=0;t<=300;t+=1){const w=wanderAt(sp,sp.t0+t,z,L.halfWidth,toWorld,lanes);if(w.mode==='fly'||w.mode==='hidden'||w.mode==='climb')continue;samples++;const q=toWorld(z,w.u,w.v);if(after.inBush(q.x,q.z))sampleHit++;}}
 return {spawns,spawnHit,samples,sampleHit,hitAt};
}
const res={slots:SLOTS,bushes:bushes.length,bushClear:BUSH_CLEAR,bushRadius:{min:Math.min(...bushes.map(b=>b.r)),max:Math.max(...bushes.map(b=>b.r))},before:count(before),after:count(after)};
mkdirSync(OUT,{recursive:true});writeFileSync(`${OUT}/count.json`,JSON.stringify(res,null,1));
const f=r=>`출현 ${r.spawnHit}/${r.spawns} · 땅 위 배회 ${r.sampleHit}/${r.samples}`;
console.log(`덤불 ${res.bushes}개(반지름 ${res.bushRadius.min.toFixed(2)}~${res.bushRadius.max.toFixed(2)}m), 시간 칸 ${SLOTS}개`);
console.log(`전: ${f(res.before)}`);console.log(`후: ${f(res.after)}`);
process.exit(0);   // 가까운 나무 입체(그리기용) 비동기 불러오기는 기다리지 않는다
