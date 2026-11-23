// 봉 기계·상자 피규어·기계 단계 그림·가게 불 검사(월드아트 2026-11-23): 2발 집게 발끝 = 집게 기계와 같은 자리(물리 = 그림),
// 봉 높이·간격 = 판정 값, 상자 겉 크기 = 판정 크기, 바닥 넓이 = 집게 기계, 단계 그림(자세히·중간·먼)이 원래 부품 visible을 안 바꿈.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MACHINES,BOX_PLUSH} from '../src/claw/claw-palette.js';
import {CLAW,buildClawMachine} from '../src/claw/claw-machine-art.js';
import {buildBridgeMachine,makeBoxPrize} from '../src/claw/claw-bridge.js';
import {BAR_Y,U,DECK_DROP} from '../src/claw/claw-bridge-physics.js';
import {bridgeLayout,BAR_Y as LBAR_Y,DECK_DROP as LDECK,GUARD_CLEAR,GUARD_RISE} from '../src/claw/claw-bridge-layout.js';
import {CLAW_TUNING as T} from '../src/claw/claw-rules.js';
import {attachLod} from '../src/claw/claw-machine-lod.js';
import {plushTriangles,plushFarGeometry,PLUSH_IDS} from '../src/claw/claw-plush.js';
import {buildClawShop,SHADOW_LAYER} from '../src/claw/claw-shop-art.js';

const BRIDGES=MACHINES.filter(m=>m.kind==='bridge');
const tip=(f,out=new THREE.Vector3())=>out.set(0,-.14,0).applyMatrix4(f.matrixWorld);

test('봉 기계: 2발 집게(fingers[0] = +x, [1] = −x), 발끝 자리 = 집게 기계 손가락과 같음(열림 0·1)',()=>{
 const ref=buildClawMachine('claw-1'),rc=ref.userData.claw;
 for(const M of BRIDGES){const m=buildBridgeMachine(M.id),c=m.userData.claw;
  assert.equal(m.userData.kind,'bridge');assert.equal(c.fingers.length,2);assert.equal(c.prongs,2);
  for(const open of [0,1]){c.set({x:0,z:0,drop:.1,open});rc.set({x:0,z:0,drop:.1,open});m.updateMatrixWorld(true);ref.updateMatrixWorld(true);
   const h=c.head.getWorldPosition(new THREE.Vector3()),a=tip(c.fingers[0]),b=tip(c.fingers[1]),r=tip(rc.fingers[0]),rh=rc.head.getWorldPosition(new THREE.Vector3());
   if(open)assert.ok(a.x>h.x+.01&&b.x<h.x-.01,`${M.id} 발 방향`); // 닫힘(0)은 발끝이 가운데를 살짝 넘어 겹침(집게 기계와 같음)
   const ra=Math.hypot(r.x-rh.x,r.z-rh.z);
   assert.ok(Math.abs(Math.hypot(a.x-h.x,a.z-h.z)-ra)<1e-6&&Math.abs(a.y-r.y)<1e-6,`${M.id} 열림 ${open} 발끝 = 집게 기계`);}}
});
test('봉 기계(11-23 대표 지적 2차, 사진): 봉 4개 모두 좌우로 폭을 가로지름, 가운데 받침 둘·바깥 막이 둘, 간격 = 배치 값, 바닥 넓이·서는 자리 = 집게 기계',()=>{
 const ref=new THREE.Box3().setFromObject(buildClawMachine('claw-1'));
 assert.equal(LBAR_Y,BAR_Y,'봉 높이 = 판정 BAR_Y');assert.equal(LDECK,DECK_DROP,'받침판 내림 = 판정 DECK_DROP');
 for(const M of BRIDGES){const m=buildBridgeMachine(M.id),L=m.userData.layout,bar=m.getObjectByName('봉 bar');bar.geometry.computeBoundingBox();const bb=bar.geometry.boundingBox,r=T.bridge.barR;
  assert.deepEqual(L.bars.map(b=>b.role),['guard','support','support','guard'],`${M.id} 봉 4개 차례`);
  for(const S of L.bars){const h=BAR_Y+(S.role==='guard'?GUARD_RISE:0);assert.ok(S.a[0]<-3.5&&S.b[0]>3.5,`${M.id} 봉 ${S.i} 좌우로 가로지름`);assert.ok(Math.abs(S.a[1]-h)<1e-9&&Math.abs(S.b[1]-h)<1e-9,`${M.id} 받침 봉 = BAR_Y, 막이 봉 = 3cm 위(11-23 월드디자인 판정 보정)`);}
  assert.equal(GUARD_RISE,.3);
  const near=M.bars.near??M.bars.gap,far=M.bars.far??M.bars.gap;
  assert.ok(Math.abs((L.bars[2].a[2]-L.bars[1].a[2])*U-near)<1e-9&&Math.abs((L.bars[2].b[2]-L.bars[1].b[2])*U-far)<1e-9,`${M.id} 받침 간격 ${near}→${far}`);
  const gz=T.bridge.box[2]/2+GUARD_CLEAR+r;for(const e of ['a','b'])assert.ok(Math.abs(L.bars[3][e][2]*U-gz)<1e-9&&Math.abs(L.bars[0][e][2]*U+gz)<1e-9,`${M.id} 막이 봉 = 상자 끝 바로 바깥`);
  for(const e of ['a','b'])assert.ok((L.bars[3][e][2]-L.bars[2][e][2])<(L.bars[2][e][2]-L.bars[1][e][2]),`${M.id} 받침↔막이 < 가운데 간격(사진)`);
  const y=CLAW.floorY+BAR_Y*U,r2=r;assert.ok(Math.abs(bb.min.y-(y-r2))<.001&&Math.abs(bb.max.y-(y+GUARD_RISE*U+r2))<.001,`${M.id} 봉 높이(그림 = 판정)`);
  const zmax=gz+r;assert.ok(Math.abs(bb.max.z-zmax)<.002&&Math.abs(bb.min.z+zmax)<.002,`${M.id} 봉 앞뒤 끝 ${bb.max.z}`);
  assert.ok(bb.max.x>L.x1*U&&bb.min.x<L.x0*U,`${M.id} 봉이 레일까지`);
  const box=new THREE.Box3().setFromObject(m);for(const k of ['x','z'])assert.ok(Math.abs(box.min[k]-ref.min[k])<.03&&Math.abs(box.max[k]-ref.max[k])<.03,`${M.id} 바닥 넓이 ${k}`);
  assert.deepEqual(m.userData.spots.stand.toArray(),[0,0,CLAW.stand.z]);
  assert.ok(m.getObjectByName('기계 유리')&&!m.getObjectByName('인형 더미'),'유리 있음·더미 없음');}
});
test('상자 피규어 8종: 겉 크기 = 판정 크기(0.22×0.10×0.16m), 안에 인형, 희귀도 그대로',()=>{
 const [w,h,l]=T.bridge.box;
 for(const B of BOX_PLUSH){const g=makeBoxPrize(B.id,{box:T.bridge.box}),s=new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
  assert.ok(Math.abs(s.x-l)<.001&&Math.abs(s.y-h)<.001&&Math.abs(s.z-w)<.001,`${B.id} ${s.toArray().map(v=>v.toFixed(3))}`);
  assert.ok(g.getObjectByName(`인형:${B.base}`),`${B.id} 안 인형`);assert.equal(g.userData.plushId,B.id);assert.equal(g.userData.size,h);}
});
test('봉 기계 상자: setBox·placeBox, 보이던 상자를 바꾸면 0.6초 흐려진 뒤 새 상자가 나타남(정리 중)',()=>{
 const m=buildBridgeMachine('bridge-1'),U2=m.userData,f={p:[0,BAR_Y+.6,0],up:[0,1,0],side:[1,0,0],lup:[0,1,0],lside:[1,0,0]};
 const a=U2.setBox('box-squirrel');U2.placeBox(f);assert.ok(a.visible&&!U2.tidying);
 const b=U2.setBox('box-hare');assert.ok(U2.tidying&&!b.visible,'다시 놓는 중');U2.placeBox(f);assert.ok(!b.visible);
 U2.update(.7);assert.ok(!U2.tidying&&b.visible,'0.6초 뒤 나타남');
 U2.placeBox(f,{visible:false});const c=U2.setBox('box-squirrel');assert.ok(c.visible&&!U2.tidying,'떨어진 뒤 새 상자는 바로');
});
test('단계 그림: 먼(2)·중간(1)은 구운 덩어리로, 원래 부품 visible은 그대로 두고 층만 옮김, 0이면 되돌림',()=>{
 for(const id of ['bridge-3','timer-1','key-2','claw-4']){const M=MACHINES.find(m=>m.id===id),m=M.kind==='bridge'?buildBridgeMachine(id):buildClawMachine(M.kind==='claw'?id:'claw-1');
  if(M.kind==='bridge')m.userData.setBox(M.pool[0]);attachLod(m);const vis=new Map();m.traverse(o=>vis.set(o,o.visible));
  const drawn=()=>{const out=[];m.traverse(o=>{if(o.isMesh&&o.layers.test(new THREE.Layers()))out.push(o.name);});return out;};
  m.userData.setLod(2);assert.ok(m.userData.lodTris>500,`${id} 먼 덩어리`);assert.deepEqual(drawn(),['먼 기계'],`${id} 먼: 덩어리만(간판은 노드에서 없음)`);
  m.userData.setLod(1);assert.ok(drawn().includes('먼 기계 외곽선')&&drawn().includes('bulbA'),`${id} 중간: 외곽선·전구`);
  m.userData.setLod(0);assert.ok(!drawn().includes('먼 기계')&&drawn().length>10,`${id} 자세히`);
  m.traverse(o=>assert.equal(o.visible,vis.get(o)??o.visible));}
});
test('먼 인형 형상: 가벼운 형상보다 가볍고 색이 있음(먼 기계 더미)',()=>{
 for(const id of PLUSH_IDS){const far=plushFarGeometry(id),n=(far.index?far.index.count:far.attributes.position.count)/3;
  assert.ok(n<plushTriangles(id,{low:true})&&plushTriangles(id,{low:true})<plushTriangles(id),id);assert.ok(far.attributes.color,id);}
});
test('가게: 기계 위 불 16·별(InstancedMesh 둘), 기계 그림자 = 그림자 전용 상자 하나(층 SHADOW_LAYER), 기계 부품은 그림자 안 드리움',()=>{
 const shop=buildClawShop({kinds:true,T}),L=shop.userData.lamps;
 assert.equal(L.lamp.count,16);assert.equal(L.star.count,16);
 L.set(6,{near:true});L.set(7,{busy:true,near:true});L.update(.05);
 const m=new THREE.Matrix4(),s=new THREE.Vector3();L.star.getMatrixAt(6,m);m.decompose(new THREE.Vector3(),new THREE.Quaternion(),s);assert.ok(s.x>.9,'빈 아슬아슬 기계 = 별');
 L.star.getMatrixAt(7,m);m.decompose(new THREE.Vector3(),new THREE.Quaternion(),s);assert.equal(s.x,0,'뽑는 중이면 별 없음');
 const proxy=shop.getObjectByName('기계 그림자 상자');assert.ok(proxy.castShadow&&proxy.layers.mask===1<<SHADOW_LAYER);
 for(const M of shop.userData.machines)M.group.traverse(o=>{if(o.isMesh)assert.ok(!o.castShadow,`${M.id} ${o.name}`);});
});
test('봉 기계 바닥(11-23 대표 지적 2차, 사진): 봉 아래 = 레일 사이·막이 봉 바깥까지 구덩이, 그 밖 = 받침판(윗면 = deckY), 받침 봉 사이 = 구멍',()=>{
 const down=new THREE.Vector3(0,-1,0),ray=new THREE.Raycaster();
 for(const M of BRIDGES){const m=buildBridgeMachine(M.id),L=m.userData.layout,P=L.pit,deck=m.getObjectByName('deck');m.updateMatrixWorld(true);
  deck.geometry.computeBoundingBox();const top=CLAW.floorY+L.deckY*U;assert.ok(Math.abs(deck.geometry.boundingBox.max.y-top)<1e-6,`${M.id} 받침판 높이`);
  const hit=(x,z)=>{ray.set(new THREE.Vector3(x,1.2,z),down);return ray.intersectObject(deck)[0]?.point.y??null;};
  for(const x of [-3.8,-2,0,2,3.8]){
   for(const S of L.bars)assert.equal(hit(x*U,L.barZ(S.i,x)*U),null,`${M.id} x ${x} 봉 ${S.i} 아래 = 구덩이`);
   assert.ok(L.inGap(x,0)&&!L.inGap(x,L.barZ(0,x))&&!L.inGap(x,L.barZ(3,x)),`${M.id} 받침 봉 사이만 구멍`);}
  for(const z of [P.z1*U+.02,P.z0*U-.02])assert.ok(Math.abs(hit(0,z)-top)<1e-6,`${M.id} 막이 봉 앞·뒤 = 받침판`);
  assert.ok(Math.abs(hit(P.x1*U+.02,0)-top)<1e-6&&Math.abs(hit(P.x0*U-.02,0)-top)<1e-6,`${M.id} 레일 바깥 = 받침판`);
  assert.ok(m.getObjectByName('exit'),'출구');
  assert.ok(Math.abs(m.userData.floorAt(0,P.z1*U+.05)-top)<1e-6&&m.userData.floorAt(0,0)<top-.05,'그림자 점 바닥');}
});
