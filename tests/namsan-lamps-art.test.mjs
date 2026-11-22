// 남산 밤 가로등 자리·그림 점검(월드아트 11-19). 그림은 src/namsan/namsan-lamps-art.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround,courseAt,NAMSAN} from '../src/namsan/namsan-data.js';
import {planNamsanLamps,buildNamsanLamps,LAMPS} from '../src/namsan/namsan-lamps-art.js';
import {wallLine,WALL} from '../src/namsan/namsan-art.js';

const dir='assets/shared/namsan/';
const meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},
 course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:JSON.parse(readFileSync(dir+'walls.json','utf8')).walls,busRoad:JSON.parse(readFileSync(dir+'bus-road.json','utf8'))};
const G=createNamsanGround(data),pts=G.points;
const {spots,washes}=planNamsanLamps(G,{walls:data.walls});
const route=spots.filter(s=>s.s!=null);

test('코스 따라 끊김 없이: 계단은 12m, 길은 18m 안팎(소품 피해 옮긴 곳 포함 최대 22m)', ()=>{
 assert.ok(route.length>=60,`코스 등 ${route.length}개`);
 for(let i=1;i<route.length;i++){const gap=route[i].s-route[i-1].s;assert.ok(gap<=22,`${route[i-1].s}→${route[i].s}m 사이 ${gap.toFixed(1)}m`);}
 // 계단 구간 등은 계단 간격
 const st=route.filter(s=>s.kind==='stairs');assert.ok(st.length>=35,`계단 등 ${st.length}개`);
 // 출발 광장 끝 ~ 정상 광장 앞까지
 assert.ok(route[0].s<30&&route.at(-1).s>pts.at(-1).s-60,`${route[0].s}~${route.at(-1).s}m`);
});

test('등은 걷는 길·계단 측벽·성곽 속·버스 차로에 서지 않는다', ()=>{
 const lines=data.walls.map(w=>wallLine(G,w)).filter(Boolean).flatMap(l=>l.P);
 for(const s of route){
  const d=G.nearest(s.x,s.z).distance;assert.ok(d>NAMSAN.stairWidth/2+.32+.2,`${s.s}m 등이 길에서 ${d.toFixed(2)}m`);
  const w=Math.min(...lines.map(p=>Math.hypot(p.x-s.x,p.z-s.z)));assert.ok(w>WALL.thick/2+.25+.3,`${s.s}m 등이 성곽 가운데에서 ${w.toFixed(2)}m`);
 }
 for(const s of spots){assert.ok(G.bus.nearest(s.x,s.z).distance>G.bus.points[0].width/2+.8,`${s.kind} 등이 버스 차로 위`);}
});

test('광장(두 곳)·정류장 강조, 정상 쪽은 전망탑 24m 밖', ()=>{
 const plaza=spots.filter(s=>s.kind==='plaza'),inS=plaza.filter(s=>Math.hypot(s.x-G.startPlaza.x,s.z-G.startPlaza.z)<G.startPlaza.r),inP=plaza.filter(s=>Math.hypot(s.x-G.plaza.x,s.z-G.plaza.z)<G.plaza.r);
 assert.ok(inS.length>=5,`출발 광장 ${inS.length}`);assert.ok(inP.length>=2,`정상 광장 ${inP.length}`);
 for(const s of inP)assert.ok(Math.hypot(s.x-NAMSAN.tower.x,s.z-NAMSAN.tower.z)>=24);
 assert.equal(spots.filter(s=>s.kind==='stop').length,2);
 for(const s of plaza)assert.ok(s.twin&&s.heads.length===2&&s.boost>1);
});

test('성곽 벽 빛은 코스 가까운 성곽 면에, 코스 쪽을 본다', ()=>{
 assert.ok(washes.length>=10,`벽 빛 ${washes.length}`);
 for(const w of washes){const hit=G.nearest(w.x,w.z),q=pts[hit.index];assert.ok(hit.distance<=LAMPS.wash.near);assert.ok((q.x-w.x)*w.nx+(q.z-w.z)*w.nz>0,'벽 빛이 코스 반대쪽 면');assert.ok(w.top-w.bot>2);}
});

test('그림: 등이 몇 개든 그리기 5번, 받침이 땅속까지(경사에서 안 뜸), 낮에는 빛 끔', ()=>{
 const g=buildNamsanLamps(G,{walls:data.walls});const draw=[];g.traverse(o=>{if(o.isMesh||o.isPoints)draw.push(o.name);});
 assert.deepEqual(draw.sort(),['가로등 기둥','가로등 바닥 빛','가로등 유리','가로등 후광','성곽 벽 빛'].sort());
 for(const s of g.userData.spots){const low=Math.min(...[[.3,0],[-.3,0],[0,.3],[0,-.3]].map(([a,b])=>G.ground(s.x+a,s.z+b)));if(s.kind==='path'||s.kind==='stairs')assert.ok(s.y-.82<low-.05,`${s.s}m 받침 아래 ${(s.y-.82).toFixed(2)} / 땅 ${low.toFixed(2)}`);}
 g.userData.update(0);for(const n of ['가로등 바닥 빛','가로등 후광','성곽 벽 빛'])assert.equal(g.getObjectByName(n).visible,false);
 assert.equal(g.getObjectByName('가로등 유리').material.emissiveIntensity,0);
 g.userData.update(1);assert.equal(g.getObjectByName('가로등 바닥 빛').visible,true);assert.ok(g.getObjectByName('가로등 유리').material.emissiveIntensity>1);
});

test('코스 가로등 높이는 실제로 그린 지면을 따른다',()=>{
 const shifted=planNamsanLamps(G,{walls:data.walls,surface:(x,z)=>G.ground(x,z)+2}).spots.filter(s=>s.s!=null);
 assert.equal(shifted.length,route.length);
 for(let i=0;i<route.length;i++){
  assert.equal(shifted[i].x,route[i].x);
  assert.ok(Math.abs(shifted[i].y-route[i].y-2)<1e-8);
 }
});
