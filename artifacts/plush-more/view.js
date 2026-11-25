// 새 인형 후보 촬영 장면(월드아트, 2026-11-25). 게임 코드가 아니다. 5288 vite: /artifacts/plush-more/view.html
// ?mode=model&id=후보   정면·측면(같은 모형 두 개)
// ?mode=hand&id=후보    실제 동동이가 들거나(작은·상자) 업은(큰) 모습 — carry-art.js 그대로, 인형 그림만 후보로 바꿔 끼움
// ?mode=lineup          서 있는 동동이 옆에 후보 줄(크기 비교)
import * as THREE from 'three';
import {createToonStyle} from '/src/toon/index.js';
import {composeEnvironment} from '/src/daytime.js';
import {buildToonHikerGltf} from '/src/toon/link-hiker.js';
import {createRealisticHiker} from '/src/realistic-hiker.js';
import {loadRig} from '/src/lounge/avatar.js';
import {applyOutfit} from '/src/lounge/outfit.js';
import {createCarryArt,CARRY_ART} from '/src/carry/carry-art.js';
import {RARITY} from '/src/claw/claw-palette.js';
import {makePlush} from '/src/claw/claw-plush.js';
import {CONCEPTS,conceptOf,makeConcept,makeConceptBox,conceptSize,CONCEPT_BOX} from './concepts.js';

const q=new URLSearchParams(location.search),mode=q.get('mode')??'model',id=q.get('id')??'kkulbam',C=conceptOf(id);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(q.get('bg')??'#f4ead6');
const camera=new THREE.PerspectiveCamera(26,innerWidth/innerHeight,.02,100);
const toon=await createToonStyle({renderer,scene,camera,mobile:false});
const sun=new THREE.DirectionalLight('#fff4e0',2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-3,right:3,top:3,bottom:-3});sun.shadow.bias=-.0005;sun.position.set(-2.5,6,4.5);
scene.add(sun,new THREE.HemisphereLight('#ffffff','#c9b28c',1.35));
toon.pipeline.update(composeEnvironment({sun:{elevation:45,azimuth:160},moon:{elevation:30,azimuth:0,illumination:.8}}));
const ground=new THREE.Mesh(new THREE.CircleGeometry(8,48).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:q.get('floor')??'#e6d6b8'}));ground.receiveShadow=true;scene.add(ground);toon.toonify(ground);
const T=o=>{o.traverse(m=>{if(m.isMesh&&!m.userData.outline)m.castShadow=true;});return o;};

let frames=0,step=()=>{};
// 들기 대역: 같은 희귀도의 지금 인형(자리·빛 계산을 그대로 쓰려고). 그림만 후보로 바꿈
const STAND={small:{common:'squirrel',uncommon:'cat',rare:'haechi',special:'dongdong-santa'},box:{uncommon:'box-cat',rare:'box-haechi',special:'box-dongdong-santa'},big:{common:'big-squirrel',uncommon:'big-dongdong',rare:'big-haechi',special:'big-haechi'}};

if(mode==='model'){
 // 정면(왼쪽)·측면(오른쪽, 몸 오른쪽이 보임)
 const mk=()=>C.kind==='box'?(()=>{const g=new THREE.Group(),b=makeConceptBox(id,{toonify:toon.toonify});b.position.y=CONCEPT_BOX[1]/2;g.add(b);g.userData.size=CONCEPT_BOX[1];return g;})():makeConcept(id,{toonify:toon.toonify});
 const a=T(mk()),b=T(mk()),s=a.userData.size,gap=Math.max(s*1.25,.2);
 a.position.x=-gap/2;b.position.x=gap/2;b.rotation.y=Math.PI/2;scene.add(a,b);
 const D=s*4.6+.25;camera.position.set(0,s*.62,D);camera.lookAt(0,s*.46,0);camera.fov=24;
}else if(mode==='hand'){
 const rig=await loadRig('/assets/toon/models/hiker/HikerRig.glb');
 const h=createRealisticHiker(buildToonHikerGltf(rig));applyOutfit(h,q.get('outfit')??'shirt');
 toon.toonify(h.scene,{kind:'character'});h.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});
 for(const p of h.props?.poles??[])p.group.visible=false;scene.add(h.scene);h.snapTo(0);
 const art=createCarryArt(h,{toonify:toon.toonify}),slot=C.kind==='big'?'back':'hand';
 art.set({[slot]:STAND[C.kind][C.rarity]});
 const c=art.slots[slot];
 let doll;
 if(C.kind==='box'){doll=new THREE.Group();const b=makeConceptBox(id,{toonify:toon.toonify});b.position.y=CONCEPT_BOX[1]/2;doll.add(b);doll.userData={size:CONCEPT_BOX[1],box:true};}
 else doll=makeConcept(id,{toonify:toon.toonify});
 doll.rotation.copy(c.doll.rotation);c.body.remove(c.doll);c.body.add(T(doll));c.doll=doll;
 // 특별 큰 인형은 아직 대역이 없어 빛 색만 금빛으로(시안 임시)
 if(c.glow&&C.rarity==='special'&&C.kind==='big')c.glow.halo.material.color.set(RARITY.special.color);
 const clip=q.get('clip')??'Idle';let phase=.75;
 step=dt=>{const moving=clip!=='Idle',steps=h.profile.animSteps;if(moving&&q.get('anim')==='1')phase+=dt*2.2;
  h.update({clip:moving?'Walk':'Idle',distance:phase,stride:1,stepLength:steps.walk,running:false,dt,pose:'stand',gadget:'none',selfie:false,idleSeconds:0,speed:moving?1.4:0});
  h.ground({moving,phase,surfaceHeight:()=>0,sample:()=>({}),floorHeight:0});
  art.update(dt,{camera,daylight:1,moving,phase});};
 for(let i=0;i<30;i++)step(1/30);
 // 작은·상자 = 앞 오른쪽 비스듬히(든 손이 보이게), 큰 = 뒤 오른쪽 비스듬히(등이 보이게)
 const yaw=(+(q.get('yaw')??(slot==='back'?150:-30)))*Math.PI/180,R=slot==='back'?3:2.5;
 camera.position.set(-Math.sin(yaw)*R,.78,-Math.cos(yaw)*R);camera.lookAt(slot==='back'?.05:.12,slot==='back'?.52:.62,0);camera.fov=28;
}else if(mode==='lineup'){
 const rig=await loadRig('/assets/toon/models/hiker/HikerRig.glb');
 const h=createRealisticHiker(buildToonHikerGltf(rig));applyOutfit(h,'shirt');toon.toonify(h.scene,{kind:'character'});
 h.scene.traverse(o=>{if(o.isMesh)o.castShadow=!o.userData.outline;});for(const p of h.props?.poles??[])p.group.visible=false;
 h.snapTo(0);for(let i=0;i<20;i++){h.update({clip:'Idle',distance:0,stride:1,stepLength:.6,running:false,dt:1/30,pose:'stand',gadget:'none',selfie:false,idleSeconds:0,speed:0});h.ground({moving:false,phase:0,surfaceHeight:()=>0,sample:()=>({}),floorHeight:0});}
 h.scene.rotation.y=Math.PI;scene.add(h.scene);
 const set=q.get('set')??'small',list=set==='old'?['squirrel','hare','magpie','cat','dongdong','dongdong-office','haechi','dongdong-santa'].map(x=>({id:x,old:true})):CONCEPTS.filter(c=>set==='big'?c.kind==='big':c.kind!=='big').map(c=>({id:c.id}));
 let x=.42;for(const it of list){const o=T(it.old?makePlush(it.id,{toonify:toon.toonify}):makeConcept(it.id,{toonify:toon.toonify}));const s=o.userData.size;o.position.x=x+s*.55;x+=s*1.1+.05;scene.add(o);}
 h.scene.position.x=0;const mid=x/2;camera.position.set(mid,.75,Math.max(2.6,x*1.25));camera.lookAt(mid,.38,0);camera.fov=26;
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);toon.pipeline.resize(2,innerWidth,innerHeight,1);}
addEventListener('resize',resize);resize();
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);step(dt);toon.pipeline.render(dt);frames++;});
window.plushView={get frames(){return frames;},tris:CONCEPTS.filter(c=>c.make||c.shape).map(c=>{try{return [c.id,makeConcept(c.id).userData.tris??null];}catch(e){return [c.id,String(e)];}})};
// 점검: 상자 안 인형이 상자 겉(폭·높이·깊이)을 넘는 양(mm). 지금 게임 상자(claw-bridge.js)도 같이 잼
import {makeBoxPrize} from '/src/claw/claw-bridge.js';
window.boxFit=()=>{const out={};const B=CARRY_ART.hand.box;
 const one=(name,g)=>{g.updateMatrixWorld(true);const shell=new THREE.Box3(),doll=new THREE.Box3();g.traverse(o=>{if(!o.isMesh||o.userData.outline)return;let q=o,inn=false;while(q&&q!==g){if(q.userData.inner||q.userData.plushId)inn=true;q=q.parent;}(inn?doll:shell).expandByObject(o);});
  out[name]=['x','y','z'].map(a=>Math.round(Math.max(0,shell.min[a]-doll.min[a],doll.max[a]-shell.max[a])*1000));};
 for(const c of CONCEPTS.filter(c=>c.kind==='box'))one(c.id,makeConceptBox(c.id));
 for(const id of ['squirrel','hare','magpie','cat','dongdong','dongdong-office','haechi','dongdong-santa'])one('게임 box-'+id,makeBoxPrize('box-'+id,{box:B}));
 return out;};
