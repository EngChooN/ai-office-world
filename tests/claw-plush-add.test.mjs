// 11-25 추가 인형 14종 그림 검사(월드아트): 목록·이름·희귀도, 형상 무게(지금 인형 수준), 높이 1·바닥 0, 상자 안 인형이 상자 밖으로 안 나옴(새 3 + 지금 8),
// 반짝별 외곽선 껍질 고르게, 등급 빛(큰 산타 동동이 = 특별 금빛), 손에 든 모습·업은 모습이 몸을 뚫거나 얼굴을 가리지 않음.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {PLUSH,BIG_PLUSH,BOX_PLUSH,PLUSH_ADD,BIG_PLUSH_ADD,BOX_PLUSH_ADD,BOX_SHAPES,RARITY,plushInfo,isBigPlush,isBoxPlush,baseOfPlush} from '../src/claw/claw-palette.js';
import {PLUSH_IDS,PLUSH_ADD_IDS,OUR_PLUSH_IDS,plushGeometry,plushTriangles,plushSize,makePlush} from '../src/claw/claw-plush.js';
import {makeBoxPrize} from '../src/claw/claw-bridge.js';
import {TIMER} from '../src/claw/claw-machines-more.js';
import {CLAW_TUNING} from '../src/claw/claw-rules.js';
import {CARRY_ART,carrySlotOf,glowTierOf,createCarryArt} from '../src/carry/carry-art.js';
import {createRealisticHiker} from '../src/realistic-hiker.js';
import {buildToonHikerGltf} from '../src/toon/link-hiker.js';

const ADD_ALL=[...PLUSH_ADD,...BIG_PLUSH_ADD,...BOX_PLUSH_ADD];
const SHAPES=[...PLUSH_ADD_IDS,...BOX_SHAPES];

test('추가 인형 14종: 대표가 고른 이름·희귀도, id 겹침 없음, 목록에 합침(11-25 연결: 작은 16·큰 6·상자 11)', () => {
 assert.equal(PLUSH_ADD.length,8);assert.equal(BIG_PLUSH_ADD.length,3);assert.equal(BOX_PLUSH_ADD.length,3);
 const want={kkulbam:['꿀밤이','common'],nunsong:['눈송이','common'],mongle:['몽글이','common'],bueong:['부엉','uncommon'],rudolph:['루돌프','uncommon'],domdol:['돔돌이','rare'],'dongdong-camp':['캠핑 동동이','rare'],star:['반짝별','special'],
  'big-nunsong':['큰 눈송이','common'],'big-rudolph':['큰 루돌프','uncommon'],'big-dongdong-santa':['큰 산타 동동이','special'],'box-kongi':['콩이 상자','uncommon'],'box-bau':['바우 상자','rare'],'box-haechi-gold':['황금 해치 상자','special']};
 assert.deepEqual(ADD_ALL.map(p=>p.id).sort(),Object.keys(want).sort());
 for(const p of ADD_ALL){assert.deepEqual([p.name,p.rarity],want[p.id],p.id);assert.equal(plushInfo(p.id),p);}
 const ids=[...PLUSH,...BIG_PLUSH,...BOX_PLUSH].map(p=>p.id);assert.equal(new Set(ids).size,ids.length,'id 겹침 없음');
 assert.equal(PLUSH_IDS.length,16);assert.equal(BIG_PLUSH.length,6);assert.equal(BOX_PLUSH.length,11);
 for(const p of ADD_ALL)assert.ok(ids.includes(p.id),`${p.id} 목록에 합쳐짐`);
 assert.ok(!PLUSH_ADD.some(p=>isBoxPlush(`box-${p.id}`)),'새 작은 인형 8종은 상자 없음(대표 결정)');
 for(const b of BIG_PLUSH_ADD){assert.ok(isBigPlush(b.id));assert.equal(carrySlotOf(b.id),'back');}
 for(const b of BOX_PLUSH_ADD){assert.ok(isBoxPlush(b.id));assert.ok(BOX_SHAPES.includes(baseOfPlush(b.id)));assert.equal(carrySlotOf(b.id),'hand');}
 for(const p of PLUSH_ADD){assert.equal(carrySlotOf(p.id),'hand');assert.ok(OUR_PLUSH_IDS.includes(p.id),'기계 더미 크기 계산이 우리 인형으로 앎');}
});

test('형상: 높이 1·바닥 0·꼭짓점 색, 무게 = 지금 인형 수준(가장 무거운 지금 인형 이하), 먼 기계용 가벼운 형상도 됨', () => {
 const oldMax=Math.max(...PLUSH_IDS.map(id=>plushTriangles(id)));
 const oldAvg=PLUSH_IDS.reduce((a,id)=>a+plushTriangles(id),0)/PLUSH_IDS.length;
 let sum=0;
 for(const id of SHAPES){const g=plushGeometry(id),b=g.color.boundingBox,n=plushTriangles(id);sum+=n;
  assert.ok(Math.abs(b.min.y)<1e-6&&Math.abs(b.max.y-1)<1e-6,`${id} 높이`);
  assert.ok(n<=oldMax,`${id} ${n} 삼각형 ≤ 지금 최대 ${oldMax}`);
  assert.ok(b.max.x-b.min.x<1.05,`${id} 폭(떨어진 부품 없음)`);
  assert.ok(g.color.attributes.color,'꼭짓점 색');assert.ok(g.line.index.count>0,'외곽선 껍질');
  assert.ok(plushTriangles(id,{low:true})<n,`${id} 가벼운 형상`);}
 assert.ok(sum/SHAPES.length<=oldAvg,`평균 ${Math.round(sum/SHAPES.length)} ≤ 지금 평균 ${Math.round(oldAvg)}`);
});

test('크기: 작은 = 희귀도 크기, 큰 = + 0.22m(큰 산타 동동이 0.54m가 타이머 단 한도 안)', () => {
 for(const p of PLUSH_ADD){const m=makePlush(p.id);assert.equal(m.userData.size,RARITY[p.rarity].size);}
 for(const b of BIG_PLUSH_ADD){assert.ok(Math.abs(plushSize(b.id)-(RARITY[b.rarity].size+.22))<1e-9);assert.ok(plushSize(b.id)<=TIMER.big.maxSize,`${b.id} ${plushSize(b.id)}`);}
 assert.equal(plushGeometry('big-nunsong'),plushGeometry('nunsong'),'큰 인형은 형상 공유');
});

test('반짝별 외곽선 껍질이 위쪽으로 쏠리지 않음(시안 결함 원인 = 구의 극이 위 꼭짓점에 몰림 → 베개 모양으로 다시 만듦)', () => {
 const n=plushGeometry('star').line.attributes.normal,c=new THREE.Vector3();let up=0,cnt=0;
 for(let i=0;i<n.count;i++){c.fromBufferAttribute(n,i);up+=c.y;cnt++;}
 // 통통한 별은 위아래가 거의 대칭이라 법선 y 평균이 0 근처(시안 구 방식은 위로 쏠림)
 assert.ok(Math.abs(up/cnt)<.12,`법선 y 평균 ${(up/cnt).toFixed(3)}`);
});

// 상자 안 인형이 상자 겉(폭·높이·깊이)을 넘는 양(mm)
function boxOver(g){g.updateMatrixWorld(true);const shell=new THREE.Box3(),doll=new THREE.Box3();
 g.traverse(o=>{if(!o.isMesh||o.userData.outline)return;let q=o,inn=false;while(q&&q!==g){if(q.userData.inner)inn=true;q=q.parent;}(inn?doll:shell).expandByObject(o);});
 assert.ok(!doll.isEmpty(),'안 인형 있음');
 return Math.max(...['x','y','z'].map(a=>Math.max(0,shell.min[a]-doll.min[a],doll.max[a]-shell.max[a])))*1000;}
test('상자 피규어: 안 인형이 상자 밖으로 안 나옴(손에 드는 세운 상자·봉 기계 눕힌 상자, 새 3 + 지금 8), 세운 상자는 받침 위·창으로 보임', () => {
 assert.deepEqual(CARRY_ART.hand.box,[.15,.24,.19],'손에 드는 상자를 키움(대표 지적)');
 for(const b of [...BOX_PLUSH,...BOX_PLUSH_ADD]){
  for(const box of [CARRY_ART.hand.box,CLAW_TUNING.bridge.box]){const g=makeBoxPrize(b.id,{box});
   assert.equal(boxOver(g),0,`${b.id} ${box} 상자 밖으로 나옴`);
   const s=new THREE.Box3().setFromObject(g.children[0]).getSize(new THREE.Vector3());
   assert.ok(Math.abs(s.x-box[2])<1e-6&&Math.abs(s.y-box[1])<1e-6&&Math.abs(s.z-box[0])<1e-6,'겉 크기 = 판정 크기');
   const doll=g.children.find(o=>o.userData.inner),db=new THREE.Box3().setFromObject(doll),[,h]=box;
   if(box===CARRY_ART.hand.box){assert.ok(db.min.y>=-h/2+h*.3-1e-6,`${b.id} 받침 위(창 아래 띠보다 위)`);assert.ok(db.max.y-db.min.y>h*.4,`${b.id} 창을 채울 만큼 큼(꼬리가 긴 까치가 가장 작음)(${(db.max.y-db.min.y).toFixed(3)})`);}}
 }
});

test('등급 빛: 희귀 보라·특별 금빛+반짝이(큰 산타 동동이 = 특별 금빛, 실제 CARRY_ART.glow 규칙), 흔함·보통 없음', () => {
 const want={common:0,uncommon:0,rare:1,special:2};
 for(const p of ADD_ALL)assert.equal(glowTierOf(p.id),want[p.rarity],p.id);
 assert.equal(glowTierOf('big-dongdong-santa'),2);
});

async function hiker(){
 const buf=readFileSync(new URL('../assets/toon/models/hiker/Hiker.glb',import.meta.url)),warn=console.warn;console.warn=()=>{};
 try{return createRealisticHiker(buildToonHikerGltf(await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')));}finally{console.warn=warn;}
}
function frame(h,c,{clip='Idle',phase=0}={}){const moving=clip!=='Idle',steps=h.profile.animSteps;
 h.update({clip:moving?'Walk':'Idle',distance:phase,stride:1,stepLength:steps.walk,running:false,dt:1/30,pose:'stand',gadget:'none',selfie:false,idleSeconds:0,speed:moving?1.4:0});
 h.ground({moving,phase,surfaceHeight:()=>0,sample:()=>({}),floorHeight:0});c.update(1/30,{moving,phase});}
const P=(h,n)=>h.model.getObjectByName('mixamorig'+n).getWorldPosition(new THREE.Vector3());
test('손에 든 모습(작은 8·상자 3): 오른손 위·머리 바깥 옆·몸통 밖·머리 꼭대기보다 낮음 / 업은 모습(큰 3): 등 뒤·머리 아래·땅 위', async () => {
 const h=await hiker(),top=new THREE.Box3();
 for(const pack of [false,true]){const c=createCarryArt(h,{pack});
  for(const p of [...PLUSH_ADD,...BOX_PLUSH_ADD]){c.set({hand:p.id});
   for(const [clip,ph] of [['Idle',0],['Walk',.25],['Walk',.75]]){for(let i=0;i<8;i++)frame(h,c,{clip,phase:ph});
    const b=c.bounds('hand'),hips=P(h,'Hips'),head=P(h,'Head'),cx=(b.min.x+b.max.x)/2,at=`${p.id} ${clip}${ph} pack=${pack}`;
    top.makeEmpty();h.model.traverse(o=>{if(o.isMesh&&!o.userData.outline&&/head|hair/i.test(o.name))top.expandByObject(o);});
    assert.ok(b.min.x>hips.x+.2,`${at}: 몸통 밖(${b.min.x.toFixed(3)})`);
    assert.ok(cx>head.x+.32,`${at}: 머리 바깥 옆`);
    assert.ok(b.min.x>top.max.x-.02,`${at}: 머리와 안 겹침(인형 ${b.min.x.toFixed(3)} / 머리 끝 ${top.max.x.toFixed(3)})`);
    assert.ok(b.max.y<top.max.y-.05,`${at}: 머리 꼭대기보다 낮음`);}}
  c.set({hand:null});
  for(const p of BIG_PLUSH_ADD){c.set({back:p.id});for(let i=0;i<10;i++)frame(h,c,{});
   const b=c.bounds('back'),sp=P(h,'Spine2'),head=P(h,'Head');
   assert.ok((b.min.z+b.max.z)/2>sp.z+(pack?.2:.12),`${p.id} pack=${pack}: 등 뒤`);
   assert.ok(b.max.y<head.y+.15,`${p.id} pack=${pack}: 머리 아래(${b.max.y.toFixed(3)} / 머리뼈 ${head.y.toFixed(3)})`);
   assert.ok(b.min.y>-.01,`${p.id}: 땅 위`);
   assert.equal(c.slots.back.glow?.tier??0,glowTierOf(p.id),`${p.id} 빛 단계`);}
  c.dispose();}
});
