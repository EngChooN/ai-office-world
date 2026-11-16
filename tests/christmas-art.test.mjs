// 온라인 크리스마스 그림·배치(월드아트, 2026-11-16): 장식 자리·전구 단계·모닥불 자리·전시 줄·땅 높이·형상 예산·옷 표.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../src/christmas/layout.js';
import {XMAS_OUTFITS,XMAS_OUTFIT_IDS,XMAS_HATS,XMAS_GIFT_WEARABLES,xmasPartTriangles,xmasOutfitKey} from '../src/christmas/outfits.js';
import * as THREE from 'three';
import {ORNAMENT_KINDS,ORN_SCALE,ornamentGeometry,buildTree,buildSnowman,buildHouse,SNOWBALL_SIZES,SNOWMAN_PARTS} from '../src/christmas/props.js';

const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

test('트리 장식 자리: 120개, 번호 0~119, 높이 0.75~7.75m, 서로 겹치지 않음', ()=>{
 const s=L.treeSlots();
 assert.equal(s.length,120);
 s.forEach((p,i)=>assert.equal(p.id,i));
 for(const p of s){assert.ok(p.y>=L.TREE.firstY-1e-9&&p.y<=L.TREE.lastY+1e-9,`높이 ${p.y}`);assert.ok(Math.abs(Math.hypot(p.nx,p.nz)-1)<1e-9);}
 // 공 장식 지름 0.26m × 배율 → 이웃 자리와 최소 그만큼은 떨어져야 겹치지 않는다
 const ball=.26*ORN_SCALE;let min=9;
 for(let i=0;i<s.length;i++)for(let j=i+1;j<s.length;j++)min=Math.min(min,Math.hypot(s[i].x-s[j].x,s[i].y-s[j].y,s[i].z-s[j].z));
 assert.ok(min>=Math.max(.5,ball),`가장 가까운 두 자리 ${min.toFixed(3)}m`);
 // 자리는 트리 겉(가지 끝) 바로 안쪽: 겉 반지름과 10cm 안
 for(const p of s){const r=Math.hypot(p.x-L.TREE.x,p.z-L.TREE.z),R=L.treeRadiusAt(p.y);assert.ok(r<=R&&R-r<=.1+1e-9||r===.35,`자리 ${p.id} r=${r} R=${R}`);}
 // 손 닿는 높이(1.6m 아래)에도 자리가 있다
 assert.ok(s.filter(p=>p.reach).length>=15);
});

test('전구 단계: 장식 20·40·80·120개에서 1~4단계, 별은 40개부터', ()=>{
 assert.deepEqual([0,19,20,39,40,79,80,119,120].map(L.treeLightStage),[0,0,1,1,2,2,3,3,4]);
 assert.equal(L.STAR_UNLOCK,40);
});

test('모닥불: 자리 8개, 모두 불을 보고 통나무 위(엉덩이 높이)에 있다', ()=>{
 const seats=L.campfireSeats(),C=L.CAMPFIRE;
 assert.equal(seats.length,8);
 for(const s of seats){
  // heading 0 = -Z를 봄: 바라보는 방향 (-sin h, -cos h)이 불 쪽이어야 한다
  const fx=-Math.sin(s.heading),fz=-Math.cos(s.heading),tx=C.x-s.x,tz=C.z-s.z,l=Math.hypot(tx,tz);
  assert.ok((fx*tx+fz*tz)/l>.99,`자리 ${s.id}가 불을 안 봄`);
  assert.ok(Math.abs(l-Math.hypot(C.logR,C.logLen*.24))<.01);
  assert.equal(s.y,C.seatY);
 }
 for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)assert.ok(dist(seats[i],seats[j])>=.6,`자리 ${i}·${j} 너무 가까움`);
});

test('전시 줄 8자리: 입구→트리 길과 동서 축을 비우고, 모닥불·우체통과 겹치지 않음', ()=>{
 const d=L.displaySlots();assert.equal(d.length,8);
 for(const s of d){
  assert.ok(Math.abs(s.x)>2.5,`입구 길(가운데) 위: ${s.x}`);
  assert.ok(s.z>2.5,`동서 축 가까이: ${s.z}`);
  assert.ok(Math.hypot(s.x,s.z)<L.PLAZA.radius-1,'광장 밖');
  assert.ok(dist(s,L.CAMPFIRE)>L.CAMPFIRE.logR+1.6,'모닥불과 겹침');
  assert.ok(dist(s,L.MAILBOX)>2.5,'우체통과 겹침');
 }
});

test('광장 안에 모닥불·우체통·카드 판, 집·마당·썰매 멈춤 구역은 광장 밖', ()=>{
 const R=L.PLAZA.radius;
 for(const p of [L.CAMPFIRE,L.MAILBOX,L.CARD_BOARD])assert.ok(Math.hypot(p.x,p.z)+(p===L.CAMPFIRE?L.CAMPFIRE.logR+.7:1)<R,'광장 돌바닥 밖으로 나감');
 for(const [x,z,,s] of L.HOUSES)assert.ok(Math.hypot(x,z)-3*s>R,`집 (${x},${z})이 광장에 걸침`);
 for(const y of [L.SNOWMAN_YARD,L.SNOWBALL_YARD])assert.ok(Math.abs(y.x)-y.w/2>R,'마당이 광장에 걸침');
 assert.ok(Math.hypot(L.SLED_RUN.stop.x,L.SLED_RUN.stop.z)-L.SLED_RUN.stop.r>R,'썰매가 광장으로 들어옴');
 // 집끼리 겹치지 않음(지붕 처마 포함 반지름 약 3m)
 for(let i=0;i<L.HOUSES.length;i++)for(let j=i+1;j<L.HOUSES.length;j++){const a=L.HOUSES[i],b=L.HOUSES[j];assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>3*(a[3]+b[3]),`집 ${i}·${j} 겹침`);}
 // 집 앞문은 광장 가운데를 본다
 for(const [x,z] of L.HOUSES){const h=L.houseHeading(x,z),fx=Math.sin(h),fz=Math.cos(h),l=Math.hypot(x,z);assert.ok((fx*-x+fz*-z)/l>.999);}
});

test('땅 높이: 광장·마당·멈춤 구역은 평평(0), 출발대는 언덕 위, 어디에도 웅덩이 없음', ()=>{
 for(let a=0;a<6.28;a+=.3)for(const r of [0,5,10,L.PLAZA.radius-.2])assert.equal(L.heightAt(Math.sin(a)*r,Math.cos(a)*r),0);
 for(const y of [L.SNOWMAN_YARD,L.SNOWBALL_YARD])assert.ok(Math.abs(L.heightAt(y.x,y.z))<.02);
 assert.ok(Math.abs(L.heightAt(L.SLED_RUN.stop.x,L.SLED_RUN.stop.z))<.02);
 const d=L.SLED_RUN.deck,top=L.heightAt(d.x,d.z);assert.ok(top>3.5,`출발대 높이 ${top}`);
 // 출발대 자리(5×2.6m)는 평평: 네 귀퉁이 높이 차 15cm 안
 const c=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sz])=>L.heightAt(d.x+sx*d.w/2,d.z+sz*d.d/2));assert.ok(Math.max(...c)-Math.min(...c)<.15,`출발대 기울기 ${c}`);
 let lo=9;for(let x=-60;x<=60;x+=1)for(let z=-70;z<=50;z+=1)lo=Math.min(lo,L.heightAt(x,z));
 assert.ok(lo>=-.01,`가장 낮은 땅 ${lo}`);
 // 썰매 길은 위에서 아래로 계속 내려간다(둔덕 두 곳의 작은 오르막 제외 0.4m 안)
 const P=L.SLED_RUN.path;let prev=L.heightAt(...P[0]);for(let i=1;i<P.length;i++){const h=L.heightAt(...P[i]);assert.ok(h<=prev+.4,`썰매 길 ${i}에서 올라감`);prev=h;}
});

test('장식 8종·눈사람 부품·옷 표가 체험설계 목록과 같다', ()=>{
 assert.deepEqual(ORNAMENT_KINDS,['ballRed','ballGold','ballBlue','ballSilver','candy','bell','snowflake','gift']);
 assert.deepEqual(SNOWMAN_PARTS,['eyes','nose','mouth','arms','hat','scarf']);
 assert.deepEqual(Object.values(SNOWBALL_SIZES).map(r=>+(r*2).toFixed(1)),[.5,.9,1.3]);
 assert.deepEqual(XMAS_GIFT_WEARABLES,['santa','stripe','antlers']); // 산타 모자·목도리·순록 머리띠(§5-2)
 assert.ok(XMAS_OUTFIT_IDS.length>=2&&XMAS_OUTFIT_IDS.length<=3);
 for(const id of XMAS_OUTFIT_IDS)assert.ok(XMAS_HATS[XMAS_OUTFITS[id].hat],`${id} 기본 모자 없음`);
 assert.equal(xmasOutfitKey('hiker'),'santa');
});

test('형상 예산: 장식 하나 1,600삼각형·옷 부품 6,000·모자 6,000 이하', ()=>{
 for(const k of ORNAMENT_KINDS){const g=ornamentGeometry(k),n=g.attributes.position.count/3;assert.ok(n<=1600,`${k} ${n}`);assert.ok(g.attributes.color,'꼭짓점 색 없음');}
 for(const [k,n] of Object.entries(xmasPartTriangles()))assert.ok(n<=6000,`${k} ${n}`);
});

test('트리 조작: 장식 달기·떼기·같은 자리 바꾸기, 단 장식만 그린다', ()=>{
 const t=buildTree();
 assert.equal(t.count(),0);
 assert.ok(t.setOrnament(5,'bell'));assert.ok(t.setOrnament(9,'bell'));assert.ok(t.setOrnament(5,'candy'));
 assert.equal(t.count(),2);assert.equal(t.ornamentAt(5),'candy');assert.equal(t.ornamentAt(9),'bell');
 const drawn=k=>t.group.children.find(o=>o.name===`장식:${k}`).count;
 assert.equal(drawn('bell'),1);assert.equal(drawn('candy'),1);assert.equal(drawn('gift'),0);
 assert.equal(t.setOrnament(5,'nope'),false);assert.equal(t.setOrnament(120,'bell'),false);
 t.setOrnament(9,null);assert.equal(drawn('bell'),0);assert.equal(t.count(),1);
 t.setLightStage(9);assert.equal(t.lightStage,4);t.setLightStage(-1);assert.equal(t.lightStage,0);
 t.clear();assert.equal(t.count(),0);
});

test('눈사람·집은 조각을 합쳐 메시 수가 적다(그리기 호출 예산)', ()=>{
 const meshes=g=>{let n=0;g.traverse(o=>{if(o.isMesh)n++;});return n;};
 // 게임과 같이 툰 재질로 바꾼 뒤 합친다(색만 옮기는 가짜 toonify)
 const cache=new Map(),toonify=root=>root.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial){if(!cache.has(o.material))cache.set(o.material,new THREE.MeshToonMaterial({color:o.material.color.clone(),vertexColors:o.material.vertexColors}));o.material=cache.get(o.material);}});
 const sm=buildSnowman(toonify,{});assert.ok(meshes(sm)<=4,`눈사람 메시 ${meshes(sm)}`);
 const h=buildHouse(toonify,{variant:1});assert.ok(meshes(h.group)<=10,`집 메시 ${meshes(h.group)}`);
 assert.ok(sm.userData.height>1.6&&sm.userData.height<3);
});
