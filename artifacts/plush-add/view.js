// 추가 인형 14종 모형 촬영 장면(월드아트, 2026-11-25). 게임 코드(claw-plush.js·claw-bridge.js·carry-art.js)를 그대로 씀. 5288 vite: /artifacts/plush-add/view.html
// ?mode=model&id=…  정면·측면 · ?mode=hand&id=…  실제 동동이가 들거나(작은·상자) 업은(큰) 모습 · ?mode=boxes&set=old|new&box=hand|bridge  상자 줄 · ?mode=lineup&set=small|big
import * as THREE from 'three';
import {createToonStyle} from '/src/toon/index.js';
import {composeEnvironment} from '/src/daytime.js';
import {buildToonHikerGltf} from '/src/toon/link-hiker.js';
import {createRealisticHiker} from '/src/realistic-hiker.js';
import {loadRig} from '/src/lounge/avatar.js';
import {applyOutfit} from '/src/lounge/outfit.js';
import {createCarryArt,CARRY_ART} from '/src/carry/carry-art.js';
import {PLUSH,BOX_PLUSH,PLUSH_ADD,BIG_PLUSH_ADD,BOX_PLUSH_ADD,isBoxPlush,isBigPlush} from '/src/claw/claw-palette.js';
import {makePlush} from '/src/claw/claw-plush.js';
import {makeBoxPrize} from '/src/claw/claw-bridge.js';
import {CLAW_TUNING} from '/src/claw/claw-rules.js';

const q=new URLSearchParams(location.search),mode=q.get('mode')??'model',id=q.get('id')??'kkulbam';
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
// 상자는 세워(손에 드는 진열 상자) 바닥에 놓음
const standBox=(bid,box=CARRY_ART.hand.box)=>{const g=new THREE.Group(),b=makeBoxPrize(bid,{toonify:toon.toonify,box});b.position.y=box[1]/2;g.add(b);g.userData.size=box[1];g.userData.w=box[2];return g;};
const mk=x=>isBoxPlush(x)?standBox(x):makePlush(x,{toonify:toon.toonify});
let frames=0,step=()=>{};

if(mode==='model'){
 const a=T(mk(id)),b=T(mk(id)),s=a.userData.size,gap=Math.max(s*1.25,.2)+(isBoxPlush(id)?.04:0);
 a.position.x=-gap/2;b.position.x=gap/2;b.rotation.y=Math.PI/2;scene.add(a,b);
 const D=s*4.6+.25;camera.position.set(0,s*.62,D);camera.lookAt(0,s*.46,0);camera.fov=24;
}else if(mode==='hand'){
 const rig=await loadRig('/assets/toon/models/hiker/HikerRig.glb');
 const h=createRealisticHiker(buildToonHikerGltf(rig));applyOutfit(h,q.get('outfit')??'shirt');
 toon.toonify(h.scene,{kind:'character'});h.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});
 for(const p of h.props?.poles??[])p.group.visible=false;scene.add(h.scene);h.snapTo(0);
 const art=createCarryArt(h,{toonify:toon.toonify}),slot=isBigPlush(id)?'back':'hand';
 art.set({[slot]:id});T(art.slots[slot].doll);
 let phase=.75;
 step=dt=>{h.update({clip:'Idle',distance:phase,stride:1,stepLength:h.profile.animSteps.walk,running:false,dt,pose:'stand',gadget:'none',selfie:false,idleSeconds:0,speed:0});
  h.ground({moving:false,phase,surfaceHeight:()=>0,sample:()=>({}),floorHeight:0});art.update(dt,{camera,daylight:1,moving:false,phase});};
 for(let i=0;i<30;i++)step(1/30);
 const yaw=(+(q.get('yaw')??(slot==='back'?150:-30)))*Math.PI/180,R=slot==='back'?3:2.5;
 camera.position.set(-Math.sin(yaw)*R,.78,-Math.cos(yaw)*R);camera.lookAt(slot==='back'?.05:.12,slot==='back'?.52:.62,0);camera.fov=28;
}else if(mode==='boxes'){
 const set=q.get('set')??'new',bx=q.get('box')==='bridge'?CLAW_TUNING.bridge.box:CARRY_ART.hand.box,list=(set==='old'?BOX_PLUSH:BOX_PLUSH_ADD).map(b=>b.id);
 let x=0;const items=[];for(const b of list){const o=T(standBox(b,bx));o.position.x=x+bx[2]/2;x+=bx[2]+.05;items.push(o);scene.add(o);}
 const mid=x/2-.025;items.forEach(o=>o.position.x-=mid);
 camera.position.set(0,bx[1]*1.6,Math.max(.9,x*1.15));camera.lookAt(0,bx[1]*.45,0);camera.fov=26;
}else if(mode==='lineup'){
 const rig=await loadRig('/assets/toon/models/hiker/HikerRig.glb');
 const h=createRealisticHiker(buildToonHikerGltf(rig));applyOutfit(h,'shirt');toon.toonify(h.scene,{kind:'character'});
 h.scene.traverse(o=>{if(o.isMesh)o.castShadow=!o.userData.outline;});for(const p of h.props?.poles??[])p.group.visible=false;
 h.snapTo(0);for(let i=0;i<20;i++){h.update({clip:'Idle',distance:0,stride:1,stepLength:.6,running:false,dt:1/30,pose:'stand',gadget:'none',selfie:false,idleSeconds:0,speed:0});h.ground({moving:false,phase:0,surfaceHeight:()=>0,sample:()=>({}),floorHeight:0});}
 h.scene.rotation.y=Math.PI;scene.add(h.scene);
 const set=q.get('set')??'small',list=set==='big'?BIG_PLUSH_ADD.map(b=>b.id):[...PLUSH_ADD,...BOX_PLUSH_ADD].map(b=>b.id);
 let x=.42;for(const it of list){const o=T(mk(it));const s=o.userData.w??o.userData.size;o.position.x=x+s*.55;x+=s*1.1+.05;scene.add(o);}
 const mid=x/2;camera.position.set(mid,.75,Math.max(2.6,x*1.25));camera.lookAt(mid,.38,0);camera.fov=26;
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);toon.pipeline.resize(2,innerWidth,innerHeight,1);}
addEventListener('resize',resize);resize();
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);step(dt);toon.pipeline.render(dt);frames++;});
window.plushView={get frames(){return frames;}};
void PLUSH;
