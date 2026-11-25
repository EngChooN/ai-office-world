import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRealisticHiker} from '../src/realistic-hiker.js';
import {buildToonHikerGltf} from '../src/toon/link-hiker.js';
import {PLUSH,BIG_PLUSH,BOX_PLUSH} from '../src/claw/claw-palette.js';
import {CARRY_ART,carrySlotOf,glowTierOf,createCarryArt} from '../src/carry/carry-art.js';

// 뽑은 인형 들기·업기·등급 빛 그림(월드아트, 11-25). 시안 docs/인형뽑기/인형자랑-체험-시안-v1.html, 대표 결정 AGENTS.md §8 11-25.
async function hiker(){
 const buf=readFileSync(new URL('../assets/toon/models/hiker/Hiker.glb',import.meta.url)),warn=console.warn;console.warn=()=>{};
 try{return createRealisticHiker(buildToonHikerGltf(await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')));}finally{console.warn=warn;}
}
const flat=()=>0;
function frame(h,c,{clip='Idle',phase=0,pose='stand',dt=1/30,...o}={}){
 const moving=clip!=='Idle',steps=h.profile.animSteps;
 h.update({clip:moving?'Walk':'Idle',distance:phase,stride:1,stepLength:clip==='Run'?steps.run:steps.walk,running:clip==='Run',dt,pose,gadget:'none',selfie:false,idleSeconds:0,speed:moving?1.4:0});
 h.ground({moving,phase,surfaceHeight:flat,sample:()=>({}),floorHeight:0});
 c.update(dt,{moving,phase,seated:h.interaction?.sit??0,...o});
}
const P=(h,n)=>h.model.getObjectByName('mixamorig'+n).getWorldPosition(new Vector3());

test('업기 = 큰 인형 3종만, 나머지(작은 인형·상자 피규어)는 손 (대표 결정 11-25)', () => {
 for(const p of PLUSH)assert.equal(carrySlotOf(p.id),'hand',p.id);
 for(const p of BOX_PLUSH)assert.equal(carrySlotOf(p.id),'hand',p.id);
 for(const p of BIG_PLUSH)assert.equal(carrySlotOf(p.id),'back',p.id);
});

test('빛 = 희귀 보라·특별 금빛+반짝이, 흔함·보통 없음, 큰 인형은 원래 등급', () => {
 const want={common:0,uncommon:0,rare:1,special:2};
 for(const p of [...PLUSH,...BIG_PLUSH,...BOX_PLUSH])assert.equal(glowTierOf(p.id),want[p.rarity],p.id);
 assert.equal(glowTierOf('big-haechi'),1);assert.equal(glowTierOf('big-squirrel'),0);
 assert.equal(glowTierOf('guest-1'),0,'모르는 인형은 빛 없음');
 assert.equal(CARRY_ART.glow.dayBoost,1.5,'낮은 밤의 1.5배(시안)');
 assert.ok(CARRY_ART.glow.special.scale>CARRY_ART.glow.rare.scale,'특별이 더 큼');
 assert.ok(CARRY_ART.glow.special.sparkHz<1,'깜빡임은 초당 1번 아래');
});

test('손 인형: 왼쪽 옆구리, 왼손이 인형 위를 감쌈(서기·걷기·뛰기)', async () => {
 const h=await hiker(),c=createCarryArt(h,{pack:true});
 c.set({hand:'dongdong-office'});
 for(const [clip,phases] of [['Idle',[0]],['Walk',[0,.25,.5,.75,1,1.25,1.5,1.75]],['Run',[0,.5,1,1.5]]]){
  for(let i=0;i<12;i++)frame(h,c,{clip,phase:phases[0]+i*.02});
  for(const ph of phases){frame(h,c,{clip,phase:ph});
   const b=c.bounds('hand'),hand=P(h,'LeftHand'),hips=P(h,'Hips');
   assert.ok(b.max.x<hips.x-.08,`${clip} ${ph}: 인형이 몸 왼쪽 바깥(${b.max.x.toFixed(3)})`);
   assert.ok(b.min.y>.08,`${clip} ${ph}: 바닥에 끌리지 않음`);
   const top=new Vector3((b.min.x+b.max.x)/2,b.max.y,(b.min.z+b.max.z)/2);
   assert.ok(hand.distanceTo(top)<.14,`${clip} ${ph}: 왼손이 인형 위(${hand.distanceTo(top).toFixed(3)}m)`);}
 }
 assert.equal(h.props.poles[0].group.visible,false,'손에 들면 왼쪽 스틱 숨김');
 c.set({hand:null});assert.equal(h.props.poles[0].group.visible,true,'내려놓으면 스틱 돌아옴');
});

test('업은 인형: 등 뒤, 얼굴이 뒤를 봄, 머리를 가리지 않음(큰 인형 3종, 배낭 있음·없음)', async () => {
 const h=await hiker();
 for(const pack of [false,true]){const c=createCarryArt(h,{pack});
  for(const b of BIG_PLUSH){c.set({back:b.id});for(let i=0;i<10;i++)frame(h,c,{});
   const box=c.bounds('back'),sp=P(h,'Spine2'),head=P(h,'Head');
   const mid=(box.min.z+box.max.z)/2;assert.ok(mid>sp.z+(pack?.2:.12),`${b.id} pack=${pack}: 등 뒤(+Z)`);
   assert.ok(box.max.y<head.y+.15,`${b.id} pack=${pack}: 머리 아래쪽에서 끝남(${box.max.y.toFixed(3)} / 머리뼈 ${head.y.toFixed(3)})`);
   assert.ok(box.min.y>-.01,`${b.id}: 땅에 묻히지 않음`);
   assert.equal(c.slots.back.doll.rotation.y,0,'인형 앞(+Z) = 캐릭터 뒤');}
  c.dispose();}
});

test('손 쓰는 동작·탈것 동안 숨김 → 다시 보이면 0.2초 동안 커짐, 앉으면 손 인형은 배 앞·등 인형은 숨김', async () => {
 const h=await hiker(),c=createCarryArt(h,{pack:true});
 c.set({hand:'haechi',back:'big-haechi'});
 for(let i=0;i<10;i++)frame(h,c,{});
 assert.equal(c.slots.hand.root.visible,true);
 frame(h,c,{hideHand:true});assert.equal(c.slots.hand.root.visible,false);assert.equal(c.slots.back.root.visible,true);
 frame(h,c,{dt:.05});assert.ok(c.slots.hand.root.scale.x<1,'다시 나타나는 중');
 for(let i=0;i<5;i++)frame(h,c,{dt:.05});assert.equal(c.slots.hand.root.scale.x,1);
 for(let i=0;i<120;i++)frame(h,c,{pose:'sit'});
 assert.equal(c.slots.back.root.visible,false,'앉으면 등 인형 숨김');
 const b=c.bounds('hand'),hips=P(h,'Hips');
 assert.ok(b.max.z<hips.z-.1,'앉으면 배 앞(-Z)');
 frame(h,c,{far:true});assert.equal(c.slots.hand.doll.visible,false,'먼 사람은 인형 모형 숨김(빛만)');
});

test('자리 규칙 어기면 막음, 지우면 붙인 것이 남지 않음', async () => {
 const h=await hiker(),c=createCarryArt(h);
 assert.throws(()=>c.set({hand:'big-haechi'}));assert.throws(()=>c.set({back:'haechi'}));
 const before=h.scene.children.length;c.set({hand:'box-haechi',back:'big-dongdong'});frame(h,c,{});
 assert.ok(c.slots.hand.doll.userData.box,'상자 피규어는 상자째 듦');
 assert.equal(c.slots.hand.glow?.tier,1,'희귀 상자도 보라 빛');
 c.dispose();assert.equal(h.scene.children.length,before-2,'받침 2개까지 지움');
 assert.equal(c.hand,null);assert.equal(c.back,null);
});
