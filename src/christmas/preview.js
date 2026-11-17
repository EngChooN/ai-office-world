// 눈마을 광장 미리보기(월드아트, vite dev: /src/christmas/preview.html). 게임 화면이 아니라 그림·에셋 확인용이다.
// 렌더 설정·빛 공식은 흡연장 main.js와 같다(Neutral 톤매핑·카툰 후처리·카툰 하늘). 늘 눈 오는 밤.
// ?view=entry|tree|campfire|mailbox|snowman|snowball|sled|aerial|outfits|gifts|outfits-side|outfits-back
// &stage=0~4(전구 단계, 그만큼 장식을 채움) &slots=1(빈 자리 점) &snow=0(눈 내림 끔) &mobile=1(휴대폰 상한) &hud=0(버튼 숨김)
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createToonStyle} from '../toon/index.js';
import {composeEnvironment} from '../daytime.js';
import {sunDirection} from '../look-profile.js';
import {buildVillage} from './village.js';
import {createXmasAvatar} from './avatar.js';
import {festiveLevel,skyFor,tuneEnv,tunePipeline} from './festive.js';
import {RINK,CAROUSEL,CAROUSEL_SEATS,SEAT_SIT_Y} from './festive-layout.js';
import {createXmasPoser} from './poses.js';
import {TREE_LIGHT_STEPS,STAR_UNLOCK,SPAWN,CAMPFIRE,MAILBOX,SNOWMAN_YARD,SNOWBALL_YARD,SLED_RUN,heightAt} from './layout.js';
import {ORNAMENT_KINDS} from './props.js';

const q=new URLSearchParams(location.search);
const look=festiveLevel(location.search),XMAS_SKY=skyFor(look); // ?look=festive|festive-b = 「밝고 화려하게」 시안(festive.js)
if(q.get('hud')==='0')document.getElementById('panel')?.remove();
const mobile=q.get('mobile')==='1'||(q.get('mobile')!=='0'&&matchMedia('(pointer:coarse)').matches);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#172432');scene.fog=new THREE.Fog('#2a3550',45,520);
const camera=new THREE.PerspectiveCamera(mobile?62:55,innerWidth/innerHeight,.05,3000);
const toon=await createToonStyle({renderer,scene,camera,mobile});toon.createSky();tunePipeline(look,toon.pipeline);
const world=new THREE.Group();scene.add(world);
// 빛: 달(그림자)·반구광. 값은 env 공식 그대로.
const moon=new THREE.DirectionalLight(0xffffff,3);moon.castShadow=true;moon.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
Object.assign(moon.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:120});moon.shadow.bias=-.0006;moon.shadow.normalBias=mobile?.08:.05;
const hemi=new THREE.HemisphereLight(0xbfdcff,0x7a8b5a,1);scene.add(moon,moon.target,hemi);
const env=tuneEnv(look,composeEnvironment({sun:XMAS_SKY.sun,moon:XMAS_SKY.moon}));
const sunVec=new THREE.Vector3().fromArray(sunDirection(env.elevation,env.azimuth)),moonVec=new THREE.Vector3().fromArray(sunDirection(env.moon.elevation,env.moon.azimuth));
const Ldir=new THREE.Vector3().fromArray(sunDirection(env.light.elevation,env.light.azimuth));
{const k=toon.lightScale(env),X=XMAS_SKY.light;moon.color.setRGB(...env.light.color,THREE.SRGBColorSpace);moon.intensity=env.light.intensity*3.4*k*X.moon;moon.castShadow=env.light.castShadow;
 hemi.intensity=(.06+env.ambient*1.1)*k*X.hemi;hemi.color.setRGB(...env.hemiColor,THREE.SRGBColorSpace);renderer.toneMappingExposure=env.exposureMul*toon.exposureFor(env)*X.exposure;
 scene.fog.color.setRGB(...env.fogColor,THREE.SRGBColorSpace).multiplyScalar(k);}

const village=buildVillage({toon,scene,world,mobile,samples:true,look});
// 동동이들: 옷 3종 줄·선물 옷 줄(옷 확인 장면) + 광장 곳곳(장면 분위기)
const RIG=`${import.meta.env.BASE_URL}assets/toon/models/hiker/HikerRig.glb`;
const avatars=[];
async function add(look,x,z,heading,group='scene'){const a=await createXmasAvatar({rigUrl:RIG,toon,look,id:`p${avatars.length}`});a.place(x,z,heading);a.root.position.y=heightAt(x,z);world.add(a.root);a.group=group;avatars.push(a);return a;}
const LINE_Z=12.2,face=(x,z,tx,tz)=>Math.atan2(-(tx-x),-(tz-z));
const outfits=[{outfit:'santa'},{outfit:'sweater'},{outfit:'elf'}];
const gifts=[{outfit:'sweater',hat:'antlers'},{outfit:'elf',hat:'santa'},{outfit:'santa',scarf:'stripe'},{outfit:'sweater',hat:'santa',scarf:'stripe'}];
const crowd=q.get('crowd')==='30'; // ?crowd=30 = 한 서버 30명이 광장에 있는 모습(광장 넓이 비교용, 11-17 4차). 기본 장면 사람들 대신 30명을 놓는다
for(let i=0;i<3;i++)await add(outfits[i],(i-1)*.95,LINE_Z,Math.PI,'outfits');
for(let i=0;i<4;i++)await add(gifts[i],(i-1.5)*.95,LINE_Z+40,Math.PI,'gifts');
const C=CAMPFIRE;
const riders=[];
if(!crowd){
for(const [i,look] of [[0,{outfit:'sweater'}],[3,{outfit:'santa',scarf:'stripe'}],[5,{outfit:'elf',hat:'antlers'}]]){const s=village.seats[i],x=C.x+(s.x-C.x)*.72,z=C.z+(s.z-C.z)*.72;await add(look,x,z,face(x,z,C.x,C.z));}
await add({outfit:'santa'},2.1,5.2,face(2.1,5.2,0,0));await add({outfit:'sweater',hat:'antlers'},-2.6,4.6,face(-2.6,4.6,0,0));
await add({outfit:'elf'},MAILBOX.stand.x+.2,MAILBOX.stand.z+1.1,face(MAILBOX.stand.x+.2,MAILBOX.stand.z+1.1,MAILBOX.x,MAILBOX.z));
await add({outfit:'sweater',hat:'santa'},SNOWMAN_YARD.x-3,SNOWMAN_YARD.z+1.6,face(SNOWMAN_YARD.x-3,SNOWMAN_YARD.z+1.6,SNOWMAN_YARD.x-2,SNOWMAN_YARD.z+1));
await add({outfit:'elf',hat:'antlers'},SNOWBALL_YARD.x+2,SNOWBALL_YARD.z+3,face(0,0,SNOWBALL_YARD.x,SNOWBALL_YARD.z-4));
// 시안 B: 회전목마 탄 동동이(자리 값 확인용, festive-layout CAROUSEL_SEATS → carousel.seatPose). 0·2 = 루돌프, 8·9 = 썰매 의자 하나에 둘
if(village.festive?.carousel&&q.get('riders')!=='0')for(const [k,lk] of [[0,{outfit:'santa'}],[2,{outfit:'elf',hat:'antlers'}],[8,{outfit:'sweater',hat:'santa'}],[9,{outfit:'santa',scarf:'stripe'}]]){
 const a=await add(lk,CAROUSEL.x,CAROUSEL.z,0,'ride');const poser=createXmasPoser({avatar:a,world,toon});poser.setSit(true,SEAT_SIT_Y);riders.push({a,k});}
await add({outfit:'santa',hat:'beanie'},SNOWBALL_YARD.x-2.5,SNOWBALL_YARD.z-4.5,face(0,0,SNOWBALL_YARD.x+3,SNOWBALL_YARD.z+5));

}else await addCrowd();
// 30명 장면: 놀이 자리마다 그 자리에서 할 법한 모습으로 선다(자리는 모두 layout·festive-layout 값에서 계산 → 광장 크기를 바꾸면 같이 옮겨짐).
// 11-17 5차(링크·회전목마 크게): 놀이 기구에 사람을 더 태운다 — 트리 4 · 모닥불 앉기 4 + 서기 1 · 전시 구경 1 · 노점 앞 3 · 우체통 1 · 회전목마 타기 8 + 타는 곳 1 · 링크 얼음 위 6 + 문 앞 1 = 30
async function addCrowd(){const L=village.layout,F=village.festive,looks=[{outfit:'santa'},{outfit:'sweater'},{outfit:'elf'},{outfit:'sweater',hat:'santa'},{outfit:'santa',scarf:'stripe'},{outfit:'elf',hat:'antlers'},{outfit:'sweater',hat:'antlers'},{outfit:'santa',hat:'beanie'}];
 let n=0;const lk=()=>looks[(n++*3)%looks.length];
 const stand=(x,z,tx,tz)=>add(lk(),x,z,face(x,z,tx,tz),'crowd');
 for(const deg of [200,150,320,20]){const a=deg*Math.PI/180,x=Math.sin(a)*4.3,z=Math.cos(a)*4.3;await stand(x,z,0,0);}
 for(const i of [0,3,4,7]){const s=village.seats[i],a=await add(lk(),s.x,s.z,s.heading,'crowd');const p=createXmasPoser({avatar:a,world,toon});p.setSit(true,C.seatY);}
 await stand(C.x+3.4,C.z-2.4,C.x,C.z);
 {const d=L.displaySlots()[2];await stand(d.x*.86,d.z*.86,d.x,d.z);}
 for(const s of (F?.stalls??[]).slice(0,3))await add(lk(),s.x,s.z,s.heading+Math.PI,'crowd');
 await stand(MAILBOX.stand.x,MAILBOX.stand.z,MAILBOX.x,MAILBOX.z);
 if(F?.carousel){const N=CAROUSEL_SEATS.length;for(let j=0;j<8;j++){const k=Math.floor(j*N/8);const a=await add(lk(),CAROUSEL.x,CAROUSEL.z,0,'ride');const p=createXmasPoser({avatar:a,world,toon});p.setSit(true,SEAT_SIT_Y);riders.push({a,k});}
  await stand(CAROUSEL.board.x,CAROUSEL.board.z,CAROUSEL.x,CAROUSEL.z);
  // 얼음 위 6명: 섬 둘레 타원 두 줄(바깥 4·안 2)을 시계 반대로 도는 모습
  for(let i=0;i<6;i++){const out=i<4,a=(out?i/4:(i-4)/2+.12)*Math.PI*2+.4,f=out?.78:.5,x=RINK.x+Math.sin(a)*(RINK.w/2-.9)*f,z=RINK.z+Math.cos(a)*(RINK.d/2-.9)*f;
   const b=await add(lk(),x,z,face(x,z,x+Math.cos(a),z-Math.sin(a)),'crowd');b.root.position.y=RINK.iceY;}
  await stand(RINK.gate.stand.x,RINK.gate.stand.z,RINK.gate.x,RINK.gate.z);}
}
// 트리 단계: 단계만큼 장식을 채운다(종류는 결정적으로 섞음). 40개부터 별.
function setStage(s){const n=TREE_LIGHT_STEPS[s]??0,t=village.tree;t.clear();
 const order=[...t.slots.keys()].map(i=>(i*37)%t.slots.length);for(let i=0;i<n;i++)t.setOrnament(order[i],ORNAMENT_KINDS[(order[i]*5+i)%ORNAMENT_KINDS.length]);
 t.setLightStage(s);t.setStar(n>=STAR_UNLOCK);state.stage=s;}
const state={stage:+(q.get('stage')??2)};setStage(state.stage);village.tree.showSlots(q.get('slots')==='1');

// 장면별 카메라 [카메라 x,y,z, 보는 곳 x,y,z]
const VIEWS={
 entry:[0,2.6,SPAWN.z+12,0,3.2,0],tree:[5.5,2.2,9.5,0,3.6,0],campfire:[C.x+4.6,1.9,C.z+3.6,C.x,.6,C.z],mailbox:[MAILBOX.x-3.4,1.3,MAILBOX.z-1.3,MAILBOX.x+.3,.9,MAILBOX.z-.3],
 snowman:[SNOWMAN_YARD.x-8.5,3.4,SNOWMAN_YARD.z-4.5,SNOWMAN_YARD.x+.5,.5,SNOWMAN_YARD.z+1],snowball:[SNOWBALL_YARD.x+8.6,3.8,SNOWBALL_YARD.z-3.5,SNOWBALL_YARD.x-.5,.4,SNOWBALL_YARD.z+1],
 sled:[15,4.6,-15,-3,3.4,-38],aerial:[26,34,40,0,0,-6],
 rink:[RINK.x+RINK.w*.95,RINK.w*.42,RINK.z+RINK.d*1.15,RINK.x+.5,.4,RINK.z],carousel:[CAROUSEL.x+CAROUSEL.R*2.4,CAROUSEL.R*1.25,CAROUSEL.z+CAROUSEL.R*1.2,CAROUSEL.x,CAROUSEL.R*.5,CAROUSEL.z],'carousel-near':[CAROUSEL.x+1.2,1.5,CAROUSEL.z+4.4,CAROUSEL.x,1.,CAROUSEL.z],'carousel-side':[CAROUSEL.x+4.6,1.5,CAROUSEL.z-1.2,CAROUSEL.x,1.,CAROUSEL.z],
 // 30명 비교용: 바로 위(지도처럼, 같은 높이) · 남쪽 위에서 비스듬히 · 입구에 막 들어온 사람 눈높이
 'crowd-map':[0,78,.01,0,0,0],'crowd-top':[0,34,SPAWN.z+30,0,0,0],'crowd-eye':[0,2.3,SPAWN.z+3.4,0,1.6,SPAWN.z-8],
 // 링크·회전목마 비교(11-17 5차): 남쪽 위에서 광장 남쪽 밖 전체(전·후 같은 카메라)
 'crowd-south':[0,27,56,0,0,23],
 outfits:[0,.62,LINE_Z+4.2,0,.5,LINE_Z],'outfits-side':[4.2,.62,LINE_Z,0,.5,LINE_Z],'outfits-back':[0,.62,LINE_Z-4.2,0,.5,LINE_Z],gifts:[0,.64,LINE_Z+40+4.6,0,.52,LINE_Z+40],
};
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
// 썰매 점프대 확인(11-17): 오늘 코스의 첫 점프대 둘레. jump = 옆 위에서, jump-far = 위쪽 줄에서 멀리, jump-ride = 썰매 타는 눈높이로 다가가며
function jumpView(name){const C=village.course?.course;const j=C?.jumps?.[+(q.get('jump')??0)]??C?.jumps?.[0];if(!j)return null;const top=C.xz(j.s),a=C.xz(j.s-j.len),y=C.profileH(j.s);
 const fx=top.x-a.x,fz=top.z-a.z,l=Math.hypot(fx,fz)||1,ux=fx/l,uz=fz/l,nx=-uz,nz=ux;
 if(name==='jump')return [top.x-ux*3+nx*5.5,y+3.2,top.z-uz*3+nz*5.5,top.x-ux*1.4,y+.5,top.z-uz*1.4];
 if(name==='jump-ride')return [a.x-ux*9,C.profileH(j.s-j.len-9)+1.5,a.z-uz*9,top.x,y+.6,top.z];
 return [top.x-ux*24+nx*16,y+16,top.z-uz*24+nz*16,top.x,y,top.z];}
function setView(name){const v=(name.startsWith('jump')&&jumpView(name))||VIEWS[name]||VIEWS.entry;state.view=name;
 const narrow=innerWidth<innerHeight,dress=name.startsWith('outfits')||name==='gifts',k=narrow?(dress?2.4:1.3):1,ty=narrow&&!dress&&v[4]<5?v[4]*.75:v[4];
 camera.position.set(v[3]+(v[0]-v[3])*k,ty+(v[1]-v[4])*k,v[5]+(v[2]-v[5])*k);controls.target.set(v[3],ty,v[5]);camera.fov=dress?(narrow?30:22):(mobile?62:55);camera.updateProjectionMatrix();controls.update();
 // 그림자 범위를 보는 곳에 맞춘다
 moon.target.position.copy(controls.target);moon.position.copy(controls.target).addScaledVector(Ldir,60);}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
for(const b of document.querySelectorAll('[data-stage]'))b.onclick=()=>setStage(+b.dataset.stage);
for(const b of document.querySelectorAll('[data-slots]'))b.onclick=()=>{state.slots=!state.slots;village.tree.showSlots(state.slots);};
function resize(){const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,mobile?1.5:2);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setPixelRatio(dpr);renderer.setSize(w,h);toon.pipeline.resize(mobile?1:2,w,h,dpr);}
addEventListener('resize',()=>{resize();setView(state.view);});resize();setView(q.get('view')??'entry');

let frames=0;const clock=new THREE.Clock();const snowOn=q.get('snow')!=='0';
renderer.info.autoReset=false;
renderer.setAnimationLoop(()=>{const dt=Math.min(.05,clock.getDelta());controls.update();renderer.info.reset();
 const car=village.festive?.carousel;for(const r of riders){const p=car.seatPose(r.k);r.a.place(p.x,p.z,p.heading);}
 for(const a of avatars)a.update(dt,{moved:0});
 for(const r of riders){const p=car.seatPose(r.k);r.a.root.position.y+=p.y-SEAT_SIT_Y;}
 village.update(dt,{camera,viewHeight:renderer.domElement.height,snow:snowOn?1:0});
 toon.updateSky(env,sunVec,moonVec);toon.pipeline.update(env);toon.pipeline.render(dt);frames++;});
// 진단: ?hide=이름,이름 → 그 이름의 물체를 숨긴다
for(const n of (q.get('hide')??'').split(',').filter(Boolean))scene.traverse(o=>{if(o.name===n)o.visible=false;});
window.xmas={village,scene,avatars,setView,setStage,state,camera,renderer,get frames(){return frames;},info(){return renderer.info.render;}};
