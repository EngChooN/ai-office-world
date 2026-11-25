// 인형 들기 자세 후보 촬영 장면(월드디자인, 2026-11-25). 게임 코드가 아니다.
// 실제 동동이(가게 후드 옷 대신 셔츠) + 실제 인형 그림·빛(carry-art.js createCarryArt)을 쓰고, 손 인형 자리와 팔만 후보별로 덧씌운다.
// ?vs=side,hug,shoulder,raise,show(사람마다 하나) &id=인형 &clip=Idle|Walk|Run &phase=0~2 &view=front|q34|side|game
import * as THREE from 'three';
import {createToonStyle} from '/src/toon/index.js';
import {composeEnvironment} from '/src/daytime.js';
import {buildToonHikerGltf} from '/src/toon/link-hiker.js';
import {createRealisticHiker} from '/src/realistic-hiker.js';
import {loadRig} from '/src/lounge/avatar.js';
import {applyOutfit} from '/src/lounge/outfit.js';
import {createCarryArt} from '/src/carry/carry-art.js';
import {POSE_TOOLS,poseRig} from '/src/lounge/spots.js';

const {limb,wpos}=POSE_TOOLS,V3=THREE.Vector3,D=THREE.MathUtils.degToRad;
const q=new URLSearchParams(location.search);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(q.get('bg')??'#2b2340');
const camera=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.05,100);
const toon=await createToonStyle({renderer,scene,camera,mobile:false});
const sun=new THREE.DirectionalLight('#fff0f4',2.2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4});sun.position.set(2,7,-4);
scene.add(sun,new THREE.HemisphereLight('#ffe6f4','#5a4060',1.5));
toon.pipeline.update(composeEnvironment({sun:{elevation:45,azimuth:160},moon:{elevation:30,azimuth:0,illumination:.8}}));
// 가게 바닥 느낌(분홍·보라 칸)
const tile=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');for(let i=0;i<4;i++)for(let j=0;j<4;j++){g.fillStyle=(i+j)%2?'#c98fb4':'#8f6fb8';g.fillRect(i*64,j*64,64,64);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,8);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const ground=new THREE.Mesh(new THREE.CircleGeometry(9,48).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:tile}));ground.receiveShadow=true;scene.add(ground);toon.toonify(ground);

const VS=(q.get('vs')??'hug').split(','),IDS=(q.get('ids')??q.get('id')??'dongdong-santa').split(',');
const rig0=await loadRig('/assets/toon/models/hiker/HikerRig.glb');
const people=[];
for(const [i,v] of VS.entries()){
 const h=createRealisticHiker(buildToonHikerGltf(rig0));applyOutfit(h,['shirt','padding','cardigan','suit','shirt'][i%5]);
 toon.toonify(h.scene,{kind:'character'});h.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});
 for(const p of h.props?.poles??[])p.group.visible=false;
 scene.add(h.scene);h.snapTo(0);h.scene.position.x=(i-(VS.length-1)/2)*(+(q.get('gap')??1.05));
 const art=createCarryArt(h,{toonify:toon.toonify});art.set({hand:IDS[i%IDS.length]});
 people.push({h,v,art,rig:poseRig(h.model),rest:null});
}

// 후보 자세. 좌표는 몸(루트) 기준: 앞 -Z·왼쪽 -X·위 +Y. 인형 그림 앞은 +Z라 rotation.y=π면 사람과 같은 쪽(앞)을 봄.
// 반환: 인형 바닥 가운데 자리 p, 인형이 보는 방향 yaw, 손 목표(왼·오른, 없으면 걷기 동작 그대로), 팔꿈치 방향
const P={
 // ① 가슴 앞 두 팔로 꼭 안기 — 인형은 앞(사람들 쪽)을 봄
 hug:(R,s)=>{const b=new V3(0,R.hips.y-.035,R.sp.z-.17-s*.33),top=b.y+s;if(top>.52)b.y-=top-.52;
  return {p:b,yaw:Math.PI,tilt:-10,L:new V3(-s*.36,b.y+s*.42,b.z+s*.16),R:new V3(s*.36,b.y+s*.42,b.z+s*.16),bendL:[-.9,-.7,.35],bendR:[.9,-.7,.35]};},
 // ④' 어깨 높이 옆으로 들기 — 오른 팔꿈치를 굽혀 손바닥 위 인형을 얼굴 옆(머리 바깥)에
 side2:(R,s)=>{const hand=new V3(R.shR.x+.25,R.shR.y+.03,R.shR.z-.10);
  return {p:new V3(hand.x+.02,hand.y+.012,hand.z),yaw:Math.PI-D(20),tilt:0,R:hand,bendR:[.5,-1,.5]};},
 // ② 왼쪽 어깨에 앉히기 — 인형이 어깨 위에 걸터앉아 앞을 봄, 왼손으로 인형 다리를 받침
 shoulder:(R,s)=>{const b=new V3(R.shL.x-.03-s*.30,R.shL.y-.005,R.shL.z+.02);
  return {p:b,yaw:Math.PI,tilt:0,roll:-10,L:new V3(b.x+s*.05,b.y-.01,b.z-s*.30),bendL:[-.8,-.8,.3]};},
 // ③ 오른손으로 높이 들어 올리기(트로피처럼) — 머리 옆 바깥, 인형은 앞을 봄
 raise:(R,s)=>{const hand=new V3(R.shR.x+.20,R.shR.y+.21,R.shR.z-.03);
  return {p:new V3(hand.x+.01,hand.y+.015,hand.z+.005),yaw:+(q.get("ry")??180)*Math.PI/180,tilt:0,roll:-8,R:hand,bendR:[.9,-.3,.35],palmUp:true};},
 // ④ 오른손으로 앞에 내밀어 보여 주기 — 가슴 높이 앞·약간 바깥, 인형은 앞을 봄
 show:(R,s)=>{const hand=new V3(R.shR.x+.13,R.shR.y-.15,R.shR.z-.25);
  return {p:new V3(hand.x,hand.y+.012,hand.z-.01),yaw:Math.PI,tilt:0,R:hand,bendR:[.6,-.9,.2],palmUp:true};},
 // ⑤ 왼팔로 옆에 끼고 오른손으로 가리키기 대신 — 한 팔 안기(가슴 왼쪽, 인형 얼굴 바깥 앞)
 one:(R,s)=>{const b=new V3(R.sp.x-.12-s*.22,R.sp.y-.06-s*.58,R.sp.z-.07-s*.18);
  return {p:b,yaw:Math.PI+D(25),tilt:0,L:new V3(b.x+s*.30,b.y+s*.38,b.z-s*.30),bendL:[-.9,-.7,.1]};},
};
const keep=a=>a.filter(Boolean).map(b=>b.quaternion.clone()),put=(a,k)=>a.filter(Boolean).forEach((b,i)=>b.quaternion.copy(k[i]));
const tmp=new V3(),tmp2=new V3();
function measure(pp){const r=pp.h.scene,rg=pp.rig;r.updateMatrixWorld(true);const L=b=>r.worldToLocal(wpos(b,new V3()));
 pp.rest={sp:L(rg.spine.at(-1)),shL:L(rg.Left.arm[0]),shR:L(rg.Right.arm[0]),head:L(rg.head),hips:L(rg.hips)};}
function pose(pp,dt,moving,phase){
 const {h,v,art,rig}=pp;if(v==='side')return; // 지금 모습(carry-art 그대로)
 const c=art.slots.hand;if(!c)return;
 const R=pp.rest,s=c.doll.userData.box?c.size*.9:c.size,root=h.scene;
 // 걸음에 따라 몸통(등뼈)이 움직인 만큼 같이 옮김: 서 있을 때 등뼈와 지금 등뼈의 차이
 root.updateMatrixWorld(true);const spNow=root.worldToLocal(wpos(rig.spine.at(-1),tmp2)),dv=spNow.clone().sub(R.sp);
 const o=P[v](R,s);o.p.add(dv);o.L?.add(dv);o.R?.add(dv);
 const sw=moving?Math.sin(Math.PI*phase):0;
 // 인형 자리(손 받침 = 엉덩이 따라가는 묶음 안)
 const par=c.root.parent;par.updateMatrixWorld(true);
 c.root.position.copy(par.worldToLocal(root.localToWorld(o.p.clone())));
 c.doll.rotation.set(D(o.tilt??0)+sw*.06,o.yaw,D(o.roll??0));c.body.rotation.z=sw*.04;
 c.root.updateMatrixWorld(true);
 const bend=a=>root.localToWorld(tmp.set(...a)).sub(wpos(root,new V3())).normalize();
 if(o.L)limb(rig.Left.arm,root.localToWorld(o.L.clone()),bend(o.bendL));
 if(o.R)limb(rig.Right.arm,root.localToWorld(o.R.clone()),bend(o.bendR));
}
const state={clip:q.get('clip')??'Idle',phase:+(q.get('phase')??.5),view:q.get('view')??'q34',anim:q.get('anim')==='1'};
const flat=()=>0;
function step(dt){
 const moving=state.clip!=='Idle',running=state.clip==='Run';
 for(const pp of people){const {h,art,rig,v}=pp,steps=h.profile.animSteps;
  h.update({clip:moving?'Walk':'Idle',distance:state.phase,stride:1,stepLength:running?steps.run:steps.walk,running,dt,pose:'stand',gadget:'none',selfie:false,idleSeconds:0,speed:moving?1.4:0});
  h.ground({moving,phase:state.phase,surfaceHeight:flat,sample:()=>({}),floorHeight:0});
  if(!pp.rest)measure(pp);
  const k=keep(rig.Left.arm); // carry-art가 왼팔을 덧씌우므로, 후보 자세에서는 걷기 동작 팔로 되돌린 뒤 다시 씌움
  art.update(dt,{camera,daylight:.4,moving,phase:state.phase});
  if(v!=='side'){put(rig.Left.arm,k);rig.Left.arm[0].parent.updateMatrixWorld(true);pose(pp,dt,moving,state.phase);}
 }
}
for(let i=0;i<30;i++)step(1/30);
const many=people.length>1;
function aim(){
 const H=1.0,R=many?(+(q.get('r')??people.length*1.35+1.2)):2.6,v=state.view;
 if(v==='game'){ // 인형가게 실제 카메라: 사람 뒤 3.4m·위로 0.32rad·시야각 62(휴대폰)
  camera.fov=62;const cp=Math.cos(.32),d=+(q.get('d')??3.4);camera.position.set(0,.62+Math.sin(.32)*d+.25,d*cp);camera.lookAt(0,.62,0);}
 else{camera.fov=+(q.get('fov')??30);const yaw={front:0,q34:-Math.PI/5,q34r:Math.PI/5,side:-Math.PI/2,sideR:Math.PI/2,back:Math.PI}[v]??0;
  camera.position.set(-Math.sin(yaw)*R,H*.62,-Math.cos(yaw)*R);camera.lookAt(0,H*.5,0);}
 camera.updateProjectionMatrix();
}
function resize(){camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);toon.pipeline.resize(2,innerWidth,innerHeight,1);aim();}
addEventListener('resize',resize);resize();
let frames=0;const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(state.anim&&state.clip!=='Idle')state.phase+=dt*(state.clip==='Run'?3.3:2.2);step(dt);toon.pipeline.render(dt);frames++;});
// 점검: 머리(얼굴) 상자와 인형 상자가 화면에서 겹치는 비율, 인형이 몸통 안으로 들어간 깊이
window.pose={get frames(){return frames;},state,set(o){Object.assign(state,o);aim();},
 check(){return people.map(pp=>{const head=new THREE.Box3();pp.h.model.traverse(o=>{if(o.isMesh&&!o.userData.outline&&/head|face|hair|hat|eye/i.test(o.name))head.expandByObject(o);});
  const b=pp.art.bounds('hand'),hp=wpos(pp.rig.head,new V3());
  const scr=bx=>{const pts=[];for(const x of [bx.min.x,bx.max.x])for(const y of [bx.min.y,bx.max.y])for(const z of [bx.min.z,bx.max.z])pts.push(new V3(x,y,z).project(camera));const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
  let cover=null;if(b&&!head.isEmpty()){const A=scr(head),B=scr(b);const w=Math.max(0,Math.min(A[2],B[2])-Math.max(A[0],B[0])),hh=Math.max(0,Math.min(A[3],B[3])-Math.max(A[1],B[1]));cover=+(w*hh/((A[2]-A[0])*(A[3]-A[1]))).toFixed(3);}
  return {v:pp.v,headBone:hp.toArray().map(x=>+x.toFixed(3)),headBox:head.isEmpty()?null:[head.min.toArray().map(x=>+x.toFixed(3)),head.max.toArray().map(x=>+x.toFixed(3))],doll:b?[b.min.toArray().map(x=>+x.toFixed(3)),b.max.toArray().map(x=>+x.toFixed(3))]:null,cover,rest:Object.fromEntries(Object.entries(pp.rest).map(([k,v])=>[k,v.toArray().map(x=>+x.toFixed(3))]))};});}};
