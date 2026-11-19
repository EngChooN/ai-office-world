// 남산 그림 자료·접지 점검(월드아트 11-19). 자료는 scripts/namsan/build-namsan-data.mjs가 만든 assets/shared/namsan/*.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createNamsanGround,courseAt,NAMSAN} from '../src/namsan/namsan-data.js';
import {buildStoneStairs,WALL} from '../src/namsan/namsan-art.js';

const dir='assets/shared/namsan/';
const meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},
 course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:JSON.parse(readFileSync(dir+'walls.json','utf8')).walls,forest:JSON.parse(readFileSync(dir+'forest.json','utf8'))};
const G=createNamsanGround(data),pts=G.points;

test('코스 A는 설계서대로 약 1.1km·오르기만 하고, 정상 광장은 265m 표기와 2m 안', ()=>{
 assert.ok(Math.abs(data.course.length-1067)<20,`길이 ${data.course.length}`);
 for(let i=1;i<pts.length;i++)assert.ok(pts[i].y>=pts[i-1].y-1e-6,`${pts[i].s}m에서 내려감`);
 assert.ok(Math.abs(G.plaza.y-NAMSAN.label.height)<2,`정상 광장 ${G.plaza.y}m`);
 assert.ok(pts[0].y>100&&pts[0].y<115,`출발 ${pts[0].y}m`);
});

test('지형 높이는 코스 위에서 걷는 높이와 같다(길 띠가 뜨거나 묻히지 않음)', ()=>{
 for(const p of pts.filter((_,i)=>i%5===0)){
  const g=G.ground(p.x,p.z),lift=p.stairs?.25:0;
  assert.ok(Math.abs(g+lift-p.y)<.35,`${p.s}m 땅 ${g.toFixed(2)} / 길 ${p.y}`);
 }
});

test('돌계단: 단마다 아래 끝이 땅속까지 내려간다(떠 있는 계단 없음)', ()=>{
 const stairs=buildStoneStairs(G),tread=stairs.getObjectByName('돌계단 디딤돌').geometry;
 assert.ok(stairs.userData.steps>300,`단 수 ${stairs.userData.steps}`);
 // 단마다(상자 24꼭짓점) 가장 낮은 꼭짓점이 그 자리 땅보다 아래
 const p=tread.attributes.position,v=new THREE.Vector3();let floating=0;
 for(let b=0;b<p.count;b+=24){let low=Infinity,cx=0,cz=0;for(let i=b;i<b+24;i++){v.fromBufferAttribute(p,i);low=Math.min(low,v.y);cx+=v.x/24;cz+=v.z/24;}if(low>G.ground(cx,cz)-.05)floating++;}
 assert.equal(floating,0,`떠 있는 단 ${floating}개`);
 for(const r of stairs.userData.runs){const k=courseAt(pts,(r.s0+r.s1)/2);assert.ok(k.stairs);}
});

test('나무는 코스 중심에서 4.5m 밖, 전망탑 66m 밖', ()=>{
 for(const [,x,z] of data.forest.trees){const h=G.nearest(x,z);assert.ok(h.distance>=4.4,`(${x},${z}) 길에서 ${h.distance.toFixed(1)}m`);assert.ok(Math.hypot(x-NAMSAN.tower.x,z-NAMSAN.tower.z)>=65);}
});

test('스탬프 4곳·이정표 4개는 코스 안 거리에 있고, 성곽은 길을 막지 않는 폭', ()=>{
 assert.equal(NAMSAN.stamps.length,4);assert.equal(NAMSAN.signs.length,4);
 for(const st of [...NAMSAN.stamps,...NAMSAN.signs])assert.ok(st.s>=0&&st.s<=data.course.length);
 assert.ok(WALL.thick/2+NAMSAN.pathWidth/2+.5<=3,'성곽 비킴 거리');
});
