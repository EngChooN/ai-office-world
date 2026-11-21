// 남산 그림 자료·접지 점검(월드아트 11-19). 자료는 scripts/namsan/build-namsan-data.mjs가 만든 assets/shared/namsan/*.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createNamsanGround,courseAt,NAMSAN} from '../src/namsan/namsan-data.js';
import {buildStoneStairs,WALL,namsanGrassGround,planTrailForest,treeStretch} from '../src/namsan/namsan-art.js';

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

test('풀밭(11-21): 코스 노면·돌계단·두 광장·시가지에는 안 나고, 길 밖 숲 땅은 대부분 열려 있다', ()=>{
 const gg=namsanGrassGround(G,{walls:data.walls});
 for(const p of pts.filter((_,i)=>i%4===0))assert.ok(gg.blocked(p.x,p.z),`${p.s}m 길 위에 풀`);
 for(const P of [G.plaza,G.startPlaza])assert.ok(gg.blocked(P.x,P.z)&&gg.blocked(P.x+P.r*.8,P.z),'광장 안에 풀');
 let open=0,n=0;
 for(const p of pts.filter((_,i)=>i%6===0)){if(Math.hypot(p.x-G.plaza.x,p.z-G.plaza.z)<G.plaza.r+20||Math.hypot(p.x-G.startPlaza.x,p.z-G.startPlaza.z)<G.startPlaza.r+20)continue;
  const m=courseAt(pts,p.s);for(const side of [-1,1]){const x=m.x+m.nx*8*side,z=m.z+m.nz*8*side;if(!G.park(x,z))continue;n++;if(!gg.blocked(x,z,.32))open++;}}
 assert.ok(n>20&&open/n>.6,`길 8m 밖 열린 곳 ${open}/${n}`);
 let city=null;for(let x=G.bounds.x0;x<G.bounds.x1&&!city;x+=37)for(let z=G.bounds.z0;z<G.bounds.z1;z+=37)if(!G.park(x,z)){city=[x,z];break;}
 assert.ok(city&&gg.blocked(...city),'시가지 바닥에 풀');
});

test('길가 숲 띠(11-21): 관악산 규칙대로 길 30m 안을 채우고, 노면·광장·성곽·전망탑 둘레는 비운다', ()=>{
 const {blocked}=namsanGrassGround(G,{walls:data.walls}),plan=planTrailForest(G,{blocked});
 assert.ok(plan.trees.length>1500,`교목 ${plan.trees.length}`);assert.ok(plan.shrubs.length>4000,`덤불 ${plan.shrubs.length}`);
 const dense=plan.trees.filter(t=>t.dense).length/plan.trees.length;assert.ok(dense>.25&&dense<.45,`화질 낮음에서 숨는 몫 ${dense.toFixed(2)}`); // 관악산 (.2-.13)/.2 = 35%
 for(const t of plan.trees){const h=G.nearest(t.x,t.z);
  assert.ok(h.distance>NAMSAN.pathWidth/2+4.5-1e-6&&h.distance<=30,`나무 길에서 ${h.distance.toFixed(1)}m`);
  assert.ok(Math.hypot(t.x-NAMSAN.tower.x,t.z-NAMSAN.tower.z)>=65);assert.ok(!blocked(t.x,t.z,1.2),`막힌 자리 (${t.x.toFixed(1)},${t.z.toFixed(1)})`);}
 for(const sh of plan.shrubs)assert.ok(!blocked(sh.x,sh.z,.8*sh.scale));
 // 같은 입력이면 같은 숲(함께 걷기 화면끼리 같게)
 assert.equal(planTrailForest(G,{blocked}).trees.length,plan.trees.length);
});

test('나무 키 섞기(11-21): 관악산 forest-structure 표대로 작은·중간·큰 나무가 섞이고, 수관은 길까지 여유를 넘지 않는다', ()=>{
 const H={tree_small_02:8.97477,island_tree_01:9.94073,pine_tree_01:11.93123,pine_sapling_medium:4.92499},W={tree_small_02:4.98,island_tree_01:6.72,pine_tree_01:3.27,pine_sapling_medium:1.51};
 const hs=[];for(let i=0;i<2000;i++){const x=i*7.31,z=i*3.17,id=Object.keys(H)[i%4],st=treeStretch(id,x,z,20);hs.push(st[1]*H[id]);assert.ok(st[0]*W[id]<=20+1e-6);}
 const share=(a,b)=>hs.filter(h=>h>=a-1e-6&&h<=b+1e-6).length/hs.length;
 assert.ok(share(4,7)>.15&&share(8,13)>.45&&share(16,22)>.22,`키 분포 ${share(4,7).toFixed(2)}/${share(8,13).toFixed(2)}/${share(16,22).toFixed(2)}`);
 assert.ok(treeStretch('tree_small_02',1,2,3)[1]*H.tree_small_02<=10+1e-6,'길 가까이(여유 7m 안)는 10m까지');
 assert.equal(treeStretch('unknown',0,0,5),null);
});
