// 온라인 크리스마스 「눈마을 광장」(월드개발, 2026-11-16). 그림·에셋은 월드아트(village.js·outfits.js), 화면·규칙은 월드디자인 체험설계 v1.
// 이 파일: 렌더러·카툰 후처리·밤하늘(preview.js와 같은 빛 공식), 내 동동이 이동(키보드·떠다니는 조이스틱)·3인칭 카메라·충돌,
//          트리 장식 달기 모드(트리 둘레 카메라·빈 자리 고르기), 서버 고르기 → 광장 멀티, 화면(hud.js)·채팅(공용 hiking-chat-ui, ns 'xmas') 연결.
//          놀이(11-16 2차): 선물 우체통(gift-ui.js)·모닥불 앉기(campfire.js)·눈사람(snowman-play.js)·눈싸움(snowfight-play.js)·눈썰매(sled-play.js)·소리(audio.js).
//          놀이 요청은 play-net.js 하나로(서버면 서버가, 혼자면 이 화면이 room-play.js로 판정). 행동 단추는 상황마다 여기서 골라 hud.setActions로 준다.
// 다른 모듈과는 콜백과 window 'xmas:*' 이벤트로만 주고받는다.
import {serverReady} from '../server-link-pin.js';   // 맨 먼저: 서버 주소 고르기 시작(공개 파일 multi-server.json)
import * as THREE from 'three';
import {createToonStyle} from '../toon/index.js';
import {composeEnvironment} from '../daytime.js';
import {sunDirection} from '../look-profile.js';
import {createInput} from '../lounge/input.js';
import {WALK_SPEED,RUN_MUL} from '../lounge/avatar.js';
import {serverPickMode,createServerPick,NAME_KEY} from '../server-pick.js';
import {takeEntryChoice,enterWith} from '../entry.js';
import {loadShared,saveShared,volumeGain} from '../shared-settings.js';
import '../server-pick.css';
import {currentChoice} from '../server-link.js';
import {findServer} from '../multi-protocol.js';
import {installHikingChat} from '../hiking-chat-ui.js';
import {buildVillage} from './village.js';
import {createXmasAvatar} from './avatar.js';
import {createLiteDongdong} from './lite.js';
import {festiveLevel,skyFor,tuneEnv,tunePipeline} from './festive.js'; // 「밝고 화려하게」 시안 B = 기본(11-17 대표 결정), ?look=festive = 시안 A, ?look=classic = 예전 화면
import {SPAWN,TREE,TARGETS,CAMPFIRE,MAILBOX,CARD_BOARD,SNOWMAN_YARD,SNOWBALL_YARD,SLED_RUN,BIG_PLAZA} from './layout.js';
import {TRAVEL,travelSpots,mapShapes,runBlocked} from './travel.js'; // 넓힌 광장 달리기·바로가기 지도(시안 B, 11-17 5차)
import {createTravelUi} from './travel-ui.js';
import {setSledFeel,sledFeelFrom} from './sled.js';
setSledFeel(sledFeelFrom()); // 썰매 조작감 2: 11-17 대표 결정으로 모든 화면 기본(주소로 바꾸는 길 없음)
import {XMAS_OUTFITS,XMAS_HATS} from './outfits.js';
import {createXmasMulti,cleanName} from './multi.js';
import {createTreePlay} from './tree-play.js';
import {collideXmas} from './collide.js';
import {createXmasHud} from './hud.js';
import {createXmasPoser} from './poses.js';
import {createPlayNet} from './play-net.js';
import {createXmasAudio} from './audio.js';
import {createGifts,giftWearLook} from './gift-ui.js';
import {createCampfire,nearFire,FIRE} from './campfire.js';
import {createSnowmanPlay} from './snowman-play.js';
import {createSnowfight} from './snowfight-play.js';
import {createSledPlay} from './sled-play.js';
import {createGondolaPlay} from './gondola-play.js';
import {cabinYAt} from './gondola.js';
import {createCarouselPlay,findCarousel} from './carousel-play.js'; // 회전목마 타기(시안 B ?look=festive-b에서만, 11-17 3차)
import {createRinkPlay,heightWithRink,strideAt} from './rink-play.js'; // 아이스링크 들어가기·얼음 위 걷기(시안 B에서만)
import {openWin,closeWin,onWin} from '../ui-frame.js'; // 창은 한 번에 하나(11-18 공통 틀)
import {createSkySleighPlay} from './sky-sleigh-play.js'; // 루돌프 하늘 썰매 타기·비행·별 흔적(시안 B에서만, 11-18)
import {createFightUi} from './fight-ui.js';
import {inYard as inSnowmanYard} from './snowman-state.js';
import {inFightYard,FIGHT_TEXT} from './snowfight.js';

const q=new URLSearchParams(location.search);
const festiveLook=festiveLevel(location.search),XMAS_SKY=skyFor(festiveLook);
const mobile=q.get('mobile')==='1'||matchMedia('(pointer:coarse)').matches||/iPhone|iPad|Android/i.test(navigator.userAgent);
if(mobile)document.body.classList.add('touch');
const RIG_URL=`${import.meta.env.BASE_URL}assets/toon/models/hiker/HikerRig.glb`;
const loading=document.getElementById('loading'),setLoad=t=>{const el=loading?.querySelector('.ld-msg');if(el)el.textContent=t;};
const dispatch=(type,detail={})=>window.dispatchEvent(new CustomEvent(type,{detail}));

// ── 이 기기 저장: 차림(옷·모자·목도리)·선물로 받은 옷(대표 결정 11-16: 이 기기에 남김)·첫 안내 본 것
const PROFILE_KEY='xmas-world:v1';
// sound false = 소리 끔, carol false = 캐럴만 끔(11-16 3차), zones = 처음 들어가 본 놀이 구역(규칙 안내를 처음 한 번만 길게)
function loadProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)??'{}');return {look:{outfit:XMAS_OUTFITS[p.look?.outfit]?p.look.outfit:'santa',hat:XMAS_HATS[p.look?.hat]?p.look.hat:null,scarf:p.look?.scarf==='stripe'?'stripe':null},wardrobe:Array.isArray(p.wardrobe)?p.wardrobe.filter(x=>typeof x==='string'):[],tip:!!p.tip,sound:p.sound!==false,carol:p.carol!==false,zones:Array.isArray(p.zones)?p.zones.filter(x=>typeof x==='string'):[]};}catch{return {look:{outfit:'santa',hat:null,scarf:null},wardrobe:[],tip:false,sound:true,carol:true,zones:[]};}}
const profile=loadProfile();
const saveProfile=()=>{try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));}catch{}};
// 선물 옷은 가진 것만 입는다(받기 전에 저장값만 고쳐 입는 것을 막음)
const ownLook=l=>({...l,hat:l.hat&&XMAS_HATS[l.hat]?.gift&&!profile.wardrobe.includes(l.hat)?null:l.hat,scarf:l.scarf==='stripe'&&!profile.wardrobe.includes('stripe')?null:l.scarf});
profile.nickname=(()=>{try{return cleanName(localStorage.getItem(NAME_KEY)??'');}catch{return '';}})();

// ── 렌더러(흡연장 main.js·크리스마스 preview.js와 같은 설정)
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:q.has('capture')});renderer.info.autoReset=false;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.id='scene';document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#172432');scene.fog=new THREE.Fog('#2a3550',45,520);
const BASE_FOV=mobile?62:55;
const camera=new THREE.PerspectiveCamera(BASE_FOV,innerWidth/innerHeight,.05,3000);
setLoad('눈 내리는 밤하늘 칠하는 중…');
const toon=await createToonStyle({renderer,scene,camera,mobile});toon.createSky();tunePipeline(festiveLook,toon.pipeline);
const world=new THREE.Group();world.name='world';scene.add(world);
// 빛: 달(그림자)·반구광 — 밤 공식에 XMAS_SKY.light 배수(월드아트 그림-에셋 §3)
const moon=new THREE.DirectionalLight(0xffffff,3);moon.castShadow=true;moon.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
Object.assign(moon.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:120});moon.shadow.bias=-.0006;moon.shadow.normalBias=mobile?.08:.05;
const hemi=new THREE.HemisphereLight(0xbfdcff,0x7a8b5a,1);scene.add(moon,moon.target,hemi);
const env=tuneEnv(festiveLook,composeEnvironment({sun:XMAS_SKY.sun,moon:XMAS_SKY.moon}));
const sunVec=new THREE.Vector3().fromArray(sunDirection(env.elevation,env.azimuth)),moonVec=new THREE.Vector3().fromArray(sunDirection(env.moon.elevation,env.moon.azimuth));
const Ldir=new THREE.Vector3().fromArray(sunDirection(env.light.elevation,env.light.azimuth));
{const k=toon.lightScale(env),X=XMAS_SKY.light;moon.color.setRGB(...env.light.color,THREE.SRGBColorSpace);moon.intensity=env.light.intensity*3.4*k*X.moon;moon.castShadow=env.light.castShadow;
 hemi.intensity=(.06+env.ambient*1.1)*k*X.hemi;hemi.color.setRGB(...env.hemiColor,THREE.SRGBColorSpace);renderer.toneMappingExposure=env.exposureMul*toon.exposureFor(env)*X.exposure;
 scene.fog.color.setRGB(...env.fogColor,THREE.SRGBColorSpace).multiplyScalar(k);}
document.documentElement.dataset.hudTime='night';

setLoad('눈마을 광장 세우는 중…');
const village=buildVillage({toon,scene,world,mobile,look:festiveLook});
const H=festiveLook>=2?heightWithRink(village.heightAt):village.heightAt; // 시안 B: 아이스링크 안은 얼음 윗면 높이

// ── 내 동동이(첫 등장 자리: 남쪽 입구, 트리를 정면으로 봄. 반지름 3m 안에 흩어져 선다)
setLoad('동동이 크리스마스 옷 입는 중…');
const player=await createXmasAvatar({rigUrl:RIG_URL,toon,look:ownLook(profile.look),name:profile.nickname||'동동이',id:'me'});
world.add(player.root);
const poser=createXmasPoser({avatar:player,world,toon}); // 앉기·손 녹이기·던지기 등(poses.js)
{const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*SPAWN.spread;player.place(SPAWN.x+Math.sin(a)*r,SPAWN.z+Math.cos(a)*r*.5,SPAWN.heading);}

// ── 충돌: 울타리 원(언덕 쪽은 열림) 안, 트리·집·눈벽 등(원·돌린 상자) 밖으로 민다(collide.js)
const cols=village.colliders;

// ── 입력·카메라
let playWin=false,playWinHook=false,net=null,gifts=null,campfire=null,snowman=null,snowfight=null,sledPlay=null,fightUi=null,gondola=null,carousel=null,rink=null,travel=null,skyPlay=null; // 놀이 모듈(아래에서 만든다)
const input=createInput({canvas:renderer.domElement,mobile});
const cam={yaw:SPAWN.heading,pitch:.3,dist:mobile?4.2:3.6,min:1.8,max:9,target:new THREE.Vector3()};
// 장식 달기 모드 카메라: 트리를 정면으로 보는 궤도(좌우 끌기·A/D로 둘레, 위아래 끌기·W/S·휠로 높이)
const deco={on:false,yaw:0,h:2.4,dist:mobile?9.6:8.4};
input.onLook((dx,dy)=>{if(sledPlay?.camera()||gondola?.camera())return; // 썰매·케이블카 타는 동안은 시점 고정
 if(snowfight?.aiming&&!mobile)return; // 마우스로 조준하는 동안은 시점을 돌리지 않음
 if(deco.on){deco.yaw-=dx*.006;deco.h=THREE.MathUtils.clamp(deco.h+dy*.012,1,7.6);return;}
 cam.yaw-=dx*.006;cam.pitch=THREE.MathUtils.clamp(cam.pitch+dy*.004,-.1,1.1);});
input.onZoom(k=>{if(!mobile&&snowfight?.wheel(k))return; // 눈싸움 마당 안(PC): 휠 = 가운데 고리 거리 ±1m
 if(deco.on){deco.dist=THREE.MathUtils.clamp(deco.dist*k,6,13);return;}cam.dist=THREE.MathUtils.clamp(cam.dist*k,cam.min,skyPlay?.riding?16:cam.max);}); // 하늘 썰매는 더 멀리(비행 10m)

const GIFT_BLOCK=()=>gifts?.open; // 큰 창(선물)이 열린 동안은 걷지 않는다(체험설계 §1-4)
function updatePlayer(dt){
 const mv=GIFT_BLOCK()?{forward:0,side:0,run:false}:input.move();let dirX=0,dirZ=0,moved=0;
 const moveInput=!!(mv.forward||mv.side);
 if(deco.on){ // 장식 모드: 걷지 않고 키로 트리 둘레를 돈다
  deco.yaw+=mv.side*dt*1.1;deco.h=THREE.MathUtils.clamp(deco.h+mv.forward*dt*2.2,1,7.6);
  player.update(dt,{moved:0});player.root.position.y+=H(player.x,player.z);return;}
 // 썰매(타는 중·출발대 대기·뒷자리)·모닥불(걸어가 앉기·앉아 있음)이 몸을 맡으면 걷기를 건너뛴다
 const steer=mv.side;
 // 하늘 썰매: 타는 동안(내리는 0.35초 포함) 썰매가 몸을 옮긴다. 몸 높이는 좌석이 정하므로 땅 높이를 더하지 않는다(sleigh-rider.js)
 if(skyPlay?.update(dt,{mv,camYaw:cam.yaw}))return;
 // 케이블카: 타는 동안은 객실이 몸을 옮긴다(걷기 없음)
 if(gondola?.update(dt)){player.root.position.y+=gondola.y;return;}
 // 회전목마: 타는 동안 루돌프가 몸을 옮긴다(걷기 입력이면 내림)
 if(carousel?.update(dt,{moveInput})){player.root.position.y+=carousel.y;return;}
 // 썰매: A/D 기울이기 · Shift 드리프트 · S/↓ 브레이크 · W/↑ 밀기(출발). 출발대 대기 중 걷기 입력이면 내림
 if(sledPlay.update(dt,{steer,moveInput:moveInput&&!['ride','result','count'].includes(sledPlay.mode),drift:mv.run&&!mobile,brake:mv.forward<0,push:mv.forward>0})){player.root.position.y+=H(player.x,player.z)+sledPlay.lift;return;}
 if(campfire.update(dt,{moveInput})||campfire.sitting){if(campfire.sitting)player.update(dt,{moved:0});player.root.position.y+=H(player.x,player.z);return;}
 if(moveInput){const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);dirX=fx*mv.forward+rx*mv.side;dirZ=fz*mv.forward+rz*mv.side;}
 const len=Math.hypot(dirX,dirZ);
 // 아이스링크 안: 스케이트(A안 관성·커브·제동, skate.js) + 자세(그림이 오면 rink.pose)
 if(rink?.inside){const k=len>0?1/len:0,r=rink.step(dt,{dx:dirX*k,dz:dirZ*k,speed:WALK_SPEED});player.running=false;player.update(dt,{moved:r.stride});rink.pose(dt);player.root.position.y+=H(player.x,player.z);return;}
 if(len>0&&!snowfight.packing){dirX/=len;dirZ/=len;const running=mv.run&&snowfight.moveMul===1,speed=WALK_SPEED*(running?(travel?TRAVEL.runMul:RUN_MUL):1)*snowfight.moveMul; // 조준 50%·웅크림 40%
  // 눈사람 마당: 눈덩이를 밀거나 눈덩이 몸에 막힘(큼을 혼자 밀면 절반 속도)
  let tx=player.x+dirX*speed*dt,tz=player.z+dirZ*speed*dt;
  if(snowman.balls.size){const w=snowman.walk(player.x,player.z,tx,tz,dt);tx=w.x;tz=w.z;}
  const got=collideXmas(tx,tz,cols);
  moved=Math.hypot(got.x-player.x,got.z-player.z);player.x=got.x;player.z=got.z;player.heading=snowfight.aimHeading??Math.atan2(-dirX,-dirZ); // 눈싸움 마당 안은 몸이 늘 조준 방향(옆걸음)player.running=running;
  player.update(dt,{moved,running});}
 else player.update(dt,{moved:0});
 // 눈싸움 조준 중이면 몸이 겨눈 쪽을 본다
 {const ah=snowfight.aimHeading;if(ah!==null){let d=ah-player.heading;d=Math.atan2(Math.sin(d),Math.cos(d));player.heading+=d*Math.min(1,dt*14);player.root.rotation.y=player.heading;}}
 // 땅 높이는 더한다(앉기·웅크림 자세가 root y를 바닥 0 기준으로 바꿔 둔다, poses.js)
 player.root.position.y+=H(player.x,player.z);
}
const camWant=new THREE.Vector3(),lookAt=new THREE.Vector3();
let seatTurn=null,aimK=0;const skyCam={m:null,t:0};
function updateCamera(dt){
 // 눈싸움 조준: 0.25초에 걸쳐 어깨 뒤로 살짝 당김
 {const h=snowfight?.camHint;aimK+=((h?1:0)-aimK)*Math.min(1,dt/.25*2.2);}
 // 썰매: 썰매 뒤 낮게, 진행 방향을 따라간다
 const sc=sledPlay.camera()??gondola?.camera();
 if(sc){let d=sc.yaw-cam.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));cam.yaw+=d*(1-Math.exp(-dt/(sc.lag??.2)));cam.pitch+=(sc.pitch-cam.pitch)*(1-Math.exp(-dt*4));cam.dist+=(sc.dist-cam.dist)*(1-Math.exp(-dt*3));}
 // 하늘 썰매: 썰매 뒤 위(땅 7m·하늘 10m). 땅↔하늘이 바뀔 때만 1.6초 동안 높이·거리를 맞추고, 움직이면 진행 방향으로 천천히 따라 돎(끌기·휠은 그대로)
 const skc=sc?null:skyPlay?.camera();
 if(skc){const m=skyPlay.flying?'air':'ground';if(m!==skyCam.m){skyCam.m=m;skyCam.t=1.6;}
  if(skyCam.t>0){skyCam.t-=dt;const k=1-Math.exp(-dt*2.5);cam.pitch+=(skc.pitch-cam.pitch)*k;cam.dist+=(skc.dist-cam.dist)*k;}
  if(skc.follow&&!input.looking()){let d=skc.yaw-cam.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));cam.yaw+=d*(1-Math.exp(-dt/skc.lag));}}
 else{skyCam.m=null;if(!sc&&cam.dist>cam.max)cam.dist+=(cam.max-cam.dist)*(1-Math.exp(-dt*3));}
 // 시야각: 썰매가 빠를수록 60°→70°, 내리면 원래대로
 {const want=sc?.fov??skc?.fov??BASE_FOV;if(Math.abs(camera.fov-want)>.05){camera.fov+=(want-camera.fov)*(1-Math.exp(-dt*3));camera.updateProjectionMatrix();}}
 // 모닥불에 앉으면 천천히 불 쪽으로(자리 뒤에서 불과 맞은편 사람이 보이게). 끌어서 돌리면 그만
 const fc=campfire.seatCam();
 if(fc&&!seatTurn&&!campfire.wasSeat){seatTurn={from:cam.yaw,to:fc.yaw,p0:cam.pitch,d0:cam.dist,t:0,fc};}
 campfire.wasSeat=!!fc;
 if(seatTurn){if(input.looking()||!fc)seatTurn=null;else{seatTurn.t+=dt;const k=THREE.MathUtils.smoothstep(seatTurn.t/1.2,0,1);let d=seatTurn.to-seatTurn.from;d=Math.atan2(Math.sin(d),Math.cos(d));
  cam.yaw=seatTurn.from+d*k;cam.pitch=seatTurn.p0+(seatTurn.fc.pitch-seatTurn.p0)*k;cam.dist=seatTurn.d0+(seatTurn.fc.dist-seatTurn.d0)*k;if(k>=1)seatTurn=null;}}
 if(deco.on){
  const p=new THREE.Vector3(TREE.x+Math.sin(deco.yaw)*deco.dist,deco.h+1.1,TREE.z+Math.cos(deco.yaw)*deco.dist);
  camera.position.lerp(p,1-Math.exp(-dt*6));lookAt.lerp(new THREE.Vector3(TREE.x,deco.h,TREE.z),1-Math.exp(-dt*6));camera.lookAt(lookAt);return;}
 // 걸으면 카메라가 몸 방향으로 천천히 따라 돎 — 눈싸움 마당 안은 끔(시야는 직접 돌림, 11-18 설계 v2 §4-1)
 if(player.moving&&!input.looking()&&!sc&&!snowfight.inYard){let d=player.root.rotation.y-cam.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));cam.yaw+=d*(1-Math.exp(-dt*1.2));}
 // 회전목마: 앉은 몸 높이(루돌프 위 약 1m)를 본다 — 땅을 보면 몸이 화면 위로 잘림
 const gy=sc?.y??skc?.y??(carousel?.riding?carousel.y:H(player.x,player.z)+(sc?sledPlay.lift:0));cam.target.set(sc?.x??player.x,gy+.62,sc?.z??player.z);
 // 썰매(11-18): sc.x·sc.z = 썰매 옆 위치를 0.5초에 걸쳐 따라간 자리(작은 좌우 꿈틀에 화면이 흔들리지 않게)
 // 썰매: 진행 방향 앞·굽이 안쪽을 조금 더 본다(sled-play camera().ahead)
 if(sc?.ahead){cam.target.x+=sc.ahead.x;cam.target.z+=sc.ahead.z;}
 if(aimK>.001){const rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);cam.target.x+=rx*.35*aimK;cam.target.z+=rz*.35*aimK;}
 const dist=cam.dist*(1-.22*aimK),cp=Math.cos(cam.pitch);camWant.set(cam.target.x+Math.sin(cam.yaw)*dist*cp,cam.target.y+Math.sin(cam.pitch)*dist+.25,cam.target.z+Math.cos(cam.yaw)*dist*cp);
 camWant.y=Math.max(camWant.y,H(camWant.x,camWant.z)+.35);
 camera.position.lerp(camWant,1-Math.exp(-dt*10));
 // 전나무에 부딪히면 0.15초 화면 흔들림(최대 4cm, 11-18)
 {const k=sledPlay.shake?.()??0;if(k>0){camera.position.x+=(Math.random()-.5)*2*k;camera.position.y+=(Math.random()-.5)*2*k;}}
 lookAt.copy(cam.target);camera.lookAt(lookAt);
}

// ── 멀티(광장 사람들·채팅·트리)
await serverReady;
// 행동 상태: 옷 + 트리 꾸미는 중 + 놀이 칸(모닥불 자리·손 녹이기·코코아·썰매·눈덩이 밀기·눈 뭉치기)
const myAct=()=>{const l=player.look??profile.look;return {o:l.outfit,hat:l.hat??'',sc:l.scarf==='stripe'?1:0,d:deco.on?1:0,
 ...(campfire?.act()??{}),...(snowman?.actFields()??{}),...(snowfight?.actFields()??{}),...(fightUi?.actFields()??{}),...(sledPlay?.actFields()??{}),...(gondola?.actFields()??{}),...(carousel?.actFields()??{}),...(skyPlay?.actFields()??{})};};
let treePlay=null;
const multi=createXmasMulti({ctx:{world,player,profile,mobile,heightAt:H,gondolaY:(x,z)=>cabinYAt(x,z)?.y??H(x,z),
  createAvatar:({look,id,name})=>createXmasAvatar({rigUrl:RIG_URL,toon,look,id,name}),
  createLite:look=>createLiteDongdong({toon,look}),
  attachPoser:a=>createXmasPoser({avatar:a,world,toon}),rideAt:a=>carousel?.rideAt(a)??null,strideAt:festiveLook>=2?strideAt:null,skateAt:festiveLook>=2?(id,s,dt,a)=>rink?.remote(id,s,dt,a)??null:null,
  skyAt:id=>skyPlay?.skyAt(id)??null,skyAlt:()=>skyPlay?.sendAlt()??0}, // 하늘 썰매: 다른 사람 몸은 그 사람 썰매 좌석 위, 내 높이는 위치 메시지 a칸
 envUrl:import.meta.env.VITE_MULTI_SERVER_URL,myAct,onTree:m=>treePlay?.receive(m),onPlay:m=>{if(m.t==='seat:no'){campfire?.denied();return;}if(m.t==='ride:no'){carousel?.denied();return;}net?.receive(m);}});
// 머리 위 화면 자리(말풍선·이름표). 화면 밖·카메라 뒤면 visible false
const headV=new THREE.Vector3();
function screenPos(id){
 const h=multi.headOf(id);if(!h)return null;
 if(h.kind==='me')player.headTop(headV);else if(h.kind==='avatar')h.avatar.headTop(headV);else headV.copy(h.lite.root.position).add({x:0,y:1.3,z:0});
 const dist=camera.position.distanceTo(headV);headV.project(camera);
 return {x:(headV.x*.5+.5)*innerWidth,y:(-headV.y*.5+.5)*innerHeight,visible:headV.z<1&&Math.abs(headV.x)<1.1&&Math.abs(headV.y)<1.1,dist};
}

// ── 트리 장식 달기
const look={get:()=>player.look??profile.look,set(l){profile.look={...profile.look,...l};saveProfile();player.setLook(ownLook(profile.look));}};
let hud=null;
treePlay=createTreePlay({tree:village.tree,multi,me:()=>multi.id??'me',myName:()=>multi.joined?multi.name:(profile.nickname||'나'),
 note:t=>hud?.say(t),
 event(type,d){
  if(type==='stage'){const [msg,ic]=d.stage===4?['트리가 다 채워졌어요!','x-tree']:d.stage===2?['전구가 더 켜졌어요 · 이제 꼭대기 별을 달 수 있어요','x-star']:['전구가 더 켜졌어요','x-sparkle'];hud?.say(msg,3.2,ic);}
  else if(type==='star')hud?.say(`${d.mine?'내가':(d.name||'누군가')+'님이'} 꼭대기 별을 달았어요`,3.2,'x-star');
  else if(type==='set'&&d.mine){hud?.say(`${d.name||'나'} · ${d.gift?'선물 오너먼트를':'장식을'} 달았어요`,1.4);pendingMark(null);audio.play('jingle');}
  else if(type==='set'){const s=village.tree.slots[d.slot];if(s)audio.play('jingle',{at:{x:s.x,z:s.z},gain:.6});}
  else if(type==='near'){pendingMark(d.slot);}
  else if(type==='no')pendingMark(null);
 }});
// 고른 자리 표시(빛나는 고리) — 휴대폰은 고른 뒤 [달기]
const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,8,24),new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,opacity:.95,depthTest:false}));ring.renderOrder=10;ring.visible=false;scene.add(ring);
function pendingMark(slot){
 if(slot===null||slot===undefined){ring.visible=false;hud?.setPending(null);return;}
 village.tree.slotWorld(slot,ring.position);ring.visible=true;ring.lookAt(camera.position);
 if(mobile)hud?.setPending(slot);
}
function setDecorate(on){
 if(on===deco.on)return;deco.on=on;document.documentElement.classList.toggle('xh-decorating',on);
 village.tree.showSlots(on);hud.setDecorating(on);ring.visible=false;
 if(on){deco.yaw=Math.atan2(player.x-TREE.x,player.z-TREE.z);deco.h=2.4;chat?.close();lookAt.set(TREE.x,deco.h,TREE.z);}
}
// 빈 자리 고르기: 누른 곳에서 가장 가까운(화면 40px 안, 카메라 쪽을 보는) 빈 자리
const sv=new THREE.Vector3(),toCam=new THREE.Vector3();
function pickSlot(px,py){
 let best=null,bd=mobile?44:32;
 for(let i=0;i<village.tree.slots.length;i++){
  if(treePlay.state.slot(i))continue;
  village.tree.slotWorld(i,sv);const s=village.tree.slots[i];toCam.copy(camera.position).sub(sv);
  if(s.nx*toCam.x+s.nz*toCam.z<0)continue; // 트리 뒤쪽 자리
  sv.project(camera);if(sv.z>1)continue;
  const d=Math.hypot((sv.x*.5+.5)*innerWidth-px,(-sv.y*.5+.5)*innerHeight-py);if(d<bd){bd=d;best=i;}
 }
 return best;
}
{let down=null;const c=renderer.domElement;
 c.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId};});
 c.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const tap=Math.hypot(e.clientX-down.x,e.clientY-down.y)<10&&performance.now()-down.t<450;down=null;
  if(!tap||!deco.on)return;const slot=pickSlot(e.clientX,e.clientY);if(slot===null){hud.say('트리의 빈 자리(점)를 눌러 주세요',1.6);return;}
  if(mobile){pendingMark(slot);return;}
  placeOrnament(slot,hud.kind);});}
// 선물 받은 오너먼트(gift-ui [트리에 달기])가 있으면 그것부터 단다(1분 몫·10개와 따로)
let giftOrn=0;
function placeOrnament(slot,kind){const free=giftOrn>0;const r=treePlay.put(slot,kind,{free});if(free&&r?.ok){giftOrn--;if(giftOrn)hud.say(`선물 오너먼트가 ${giftOrn}개 남았어요`,1.6);}return r;}

hud=createXmasHud({multi,treePlay,mobile,look,wardrobe:()=>profile.wardrobe,project:screenPos,act:{
 do:id=>doAction(id),
 aim:(dx,dy,done)=>snowfight.aimDrag(dx,dy,done),
 aimButton:(ph,dx,dy,sx,sy)=>snowfight.aimButton(ph,dx,dy,sx,sy),
 hold:(id,on)=>{if(id.startsWith('sb:'))snowfight.hold(id,on);else sledPlay.hold?.(id,on);},
 inbox:()=>gifts.openInbox(),
 board:()=>gifts.openInbox(true),
 unopened:()=>gifts?.unopened??0,
 sound(){profile.sound=!profile.sound;saveProfile();saveShared({sound:profile.sound});audio.setMuted(!profile.sound);hud.setSound(!profile.sound);showCarol();hud.say(profile.sound?'소리를 켰어요':'소리를 껐어요',1.4,profile.sound?'c-sound':'c-sound-off');},
 carol(){profile.carol=!profile.carol;saveProfile();saveShared({music:profile.carol});audio.setCarol(profile.carol);showCarol();hud.say(profile.carol?(profile.sound?'캐럴을 켰어요':'캐럴을 켰어요. 소리도 켜야 들려요'):'캐럴을 껐어요',1.6,profile.carol?(profile.sound?'c-music':'c-sound-off'):'c-music-off');},
 musicOpen(){showCarol();},
 gift:id=>gifts.startSend(id),
 decorate:setDecorate,
 place(slot,kind){placeOrnament(slot,kind);pendingMark(null);},
 cancel(){pendingMark(null);},
 undo(slot){treePlay.undo(slot);},
 star(){treePlay.star();},
 kind(){if(ring.visible&&!mobile)ring.visible=false;},
 servers(){openPick();},
 rejoin(){multi.join({room:multi.room,name:pick.state.name});},
 full(){multi.leave();openPick('full');},
}});
const nearTree=()=>Math.hypot(player.x-TARGETS.tree.x,player.z-TARGETS.tree.z)<TARGETS.tree.r;
const near=(t,r)=>Math.hypot(player.x-t.x,player.z-t.z)<r;

// ── 놀이: 소리·요청 길·선물·모닥불·눈사람·눈싸움·썰매
// 세 체험 공용 소리 설정(11-17, shared-settings.js): 저장된 적이 있으면 소리·배경 음악(캐럴)·크기를 그 값으로
const sharedSound=loadShared();if(sharedSound.has){profile.sound=sharedSound.sound;profile.carol=sharedSound.music;}
const audio=createXmasAudio({muted:!profile.sound,carol:profile.carol,volume:sharedSound.has?volumeGain(sharedSound.volume):1});hud.setSound(!profile.sound);
// 🎵 창의 지금 곡 줄
function showCarol(){const c=audio.carolNow();hud.setCarol(profile.carol,!profile.sound?'소리가 꺼져 있어요':!profile.carol?'캐럴이 꺼져 있어요':!audio.unlocked?'♪ 화면을 한 번 누르면 캐럴이 나와요':c.state==='error'?'캐럴을 받지 못했어요':c.title?`♪ 지금: ${c.title}`:'♪ 캐럴을 받는 중이에요',!profile.sound?'c-sound-off':null);}
showCarol();
net=createPlayNet({multi,player,myName:()=>multi.joined?multi.name:(profile.nickname||'나'),myAct});
const resend=()=>{}; // act는 multi.update가 바뀔 때마다 보낸다(sendAct 비교)
gifts=createGifts({root:hud.root,net,multi,player,mobile,hud,audio,village,
 wear(item){const l=giftWearLook(item);if(!l)return;window.xmas.addWardrobe(item);look.set(l);},
 treeBonus(){giftOrn++;},cocoa(n){campfire.addCocoa(n);}});
campfire=createCampfire({player,poser,multi,net,hud,audio,onChange:resend});
snowman=createSnowmanPlay({root:hud.root,world,toon,heightAt:H,village,player,net,multi,hud,audio,camera,mobile,onChange:resend});
snowfight=createSnowfight({root:hud.root,world,toon,heightAt:H,player,poser,net,multi,hud,audio,camera,canvas:renderer.domElement,renderer,yaw:()=>cam.yaw,setYaw:y=>{cam.yaw=y;},mobile,onChange:resend});
fightUi=createFightUi({root:hud.root,world,toon,heightAt:H,player,net,multi,hud,audio,snowfight,mobile,onChange:resend});
sledPlay=createSledPlay({root:hud.root,world,toon,heightAt:H,player,poser,net,multi,hud,audio,input,mobile,onChange:resend});
if(village.course?.boardCanvas)sledPlay.setBoardCanvas(village.course.boardCanvas,village.course.boardTex);
// 코스가 바뀌면(방 시드·새 코스) 산 위 길 그림도 다시
sledPlay.onCourse(c=>village.course.setCourse(c));
gondola=createGondolaPlay({world,toon,player,multi,hud,audio,onChange:resend,busy:()=>sledPlay.mode!=='none'});
carousel=createCarouselPlay({carousel:findCarousel(village.festive),player,poser,multi,hud,audio,onChange:resend});
rink=createRinkPlay({enabled:festiveLook>=2&&!!village.festive,player,hud,audio,mobile,art:village.festive?.skate??null}); // art = 월드아트 스케이트 그림(오기 전엔 null)
// 하늘 썰매(시안 B): 다른 놀이 중이면 못 탐(설계 §7) — 회전목마·언덕 눈썰매(출발대 줄 포함)·케이블카·링크·모닥불·장식·조준·한 판·눈사람 굴리기
skyPlay=createSkySleighPlay({sky:village.festive?.skySleigh??null,player,poser,multi,hud,audio,input,mobile,heightAt:H,cols,root:hud.root,onChange:resend,fps:()=>fps,
 busy:()=>{const sm=snowman.actFields?.()??{};return {...busyNow(),sky:false,match:document.documentElement.classList.contains('xf-match'),snow:!!(sm.pu||sm.pk)};}});
// 넓힌 광장 이동 돕기(시안 B만): 「달리기」 켜고 끄기(PC Shift와 같음)·바로가기 지도 → 놀이를 먼저 그만두고 화면 어두워짐 뒤 그 자리 앞으로
const busyNow=()=>({rink:rink.inside,carousel:carousel.riding,sitting:campfire.sitting||campfire.walking,sled:sledPlay.mode!=='none',gondola:gondola.mode!=='none',deco:deco.on,aiming:snowfight.aiming,sky:skyPlay.riding});
let travelAt=-Infinity;
async function travelTo(id){
 const spot=travel?.spots.find(s=>s.id===id);if(!spot)return false;
 const t=performance.now();if(t-travelAt<TRAVEL.gapMs)return false;
 if(gondola.riding){hud.say('케이블카에서 내린 뒤에 갈 수 있어요',1.8,'x-gondola');return false;}
 if(document.documentElement.classList.contains('xf-match')){hud.say('눈싸움 한 판이 끝나면 갈 수 있어요',1.8,'x-snowball');return false;}
 travelAt=t;
 // 놀이 그만두기: 장식·모닥불·회전목마·링크·썰매(내리기·그만)
 if(deco.on)setDecorate(false);campfire.stand();carousel.act('mg:off');if(rink.inside)rink.act('rk:out');if(skyPlay.stop())hud.say('썰매를 정류장에 돌려보냈어요',1.4,'x-reindeer'); // 하늘 썰매는 정류장으로 돌려보내고 감
 if(sledPlay.mode!=='none'){sledPlay.act('sled:off');if(sledPlay.mode!=='none')sledPlay.act('sled:cancel');}
 if(sledPlay.mode!=='none'||gondola.mode!=='none'){hud.say('타는 중에는 갈 수 없어요',1.6);return false;}
 await travel.ui.fade(()=>{const p=collideXmas(spot.x,spot.z,cols);player.place(p.x,p.z,spot.heading);cam.yaw=spot.heading;resend();});
 hud.say(`${spot.label} 앞이에요`,1.4);return true;
}
// 썰매 경주 참가·마을 판에서 열기(11-18): 지도 이동과 같이 놀이를 그만두고 화면 어두워짐 뒤 출발대 줄로(sled-play.js가 fn 안에서 옮김)
sledPlay.prep=async fn=>{
 if(gondola.riding){hud.say('케이블카에서 내린 뒤에 참가할 수 있어요',1.8,'x-gondola');return false;}
 if(document.documentElement.classList.contains('xf-match')){hud.say('눈싸움 한 판이 끝나면 참가할 수 있어요',1.8,'x-snowball');return false;}
 if(deco.on)setDecorate(false);campfire.stand();carousel.act('mg:off');if(rink.inside)rink.act('rk:out');if(skyPlay.stop())hud.say('썰매를 정류장에 돌려보냈어요',1.4,'x-reindeer');
 if(sledPlay.mode==='asking'||sledPlay.mode==='back')sledPlay.act(sledPlay.mode==='asking'?'sled:cancel':'sled:off');
 const go=()=>{fn();cam.yaw=player.heading;resend();};if(travel)await travel.ui.fade(go);else go();return true;};
// 회전목마·한 판 눈싸움 중이면 참가 카드 없이 배지만(설계 v2 §3-2)
sledPlay.quiet=()=>carousel.riding||document.documentElement.classList.contains('xf-match');
if(BIG_PLAZA&&village.festive){
 const spots=travelSpots({carousel:carousel.enabled,rink:rink.enabled,sky:skyPlay.enabled});
 travel={spots,ui:createTravelUi({spots,shapes:mapShapes({carousel:carousel.enabled,rink:rink.enabled}),mobile,
  onRun:on=>input.setRun(on),onGo:id=>{travelTo(id);},onOpen:()=>audio.play('pop',{gain:.3}),
  where:()=>({x:player.x,z:player.z,heading:player.heading}),
  others:()=>multi.people().filter(p=>!p.muted&&p.sample).map(p=>({x:p.sample.x,z:p.sample.z}))})};
}
addEventListener('xmas:multi-join',()=>{net.resetLocal();campfire.stand();carousel.act('mg:off');skyPlay.stop();if(sledPlay.mode!=='none')sledPlay.act('sled:off');sledPlay.resetCourse();});
addEventListener('xmas:multi-leave',()=>{sledPlay.resetCourse();});
addEventListener('xmas:multi-leave',()=>{net.resetLocal();});

// 지금 띄울 행동 단추(체험설계 §4-2 표). 첫 줄이 큰 단추(E)
function currentActions(){
 if(deco.on)return [];
 if(skyPlay.body)return skyPlay.actions(); // 하늘 썰매 탄 동안은 다른 시설 단추를 모두 숨김(설계 §7)
 if(gondola.riding)return gondola.actions();
 if(carousel.riding)return carousel.actions();
 if(sledPlay.mode!=='none')return sledPlay.actions();
 if(campfire.sitting)return [{id:'fire:warm',ic:'x-warm-hands',label:'손 녹이기',key:'E'},...(campfire.cocoaLeft?[{id:'fire:cocoa',ic:'x-cocoa',label:`코코아 ${campfire.cocoaLeft}`,key:'R'}]:[]),{id:'fire:stand',ic:'c-stand-up',label:'일어나기',key:'Q'}];
 if(campfire.walking)return [{id:'fire:stand',ic:'c-leave',label:'그만',key:'Q'}];
 if(nearTree())return [{id:'tree:deco',ic:'x-tree',label:'장식 달기',...(giftOrn?{tailIc:'x-orn-gift',tail:giftOrn}:{}),key:'E'}];
 // 우체통과 모두의 카드 판은 2m 남짓 떨어져 있어 더 가까운 쪽 단추를 먼저
 const dMail=Math.hypot(player.x-MAILBOX.x,player.z-MAILBOX.z),dBoard=Math.hypot(player.x-CARD_BOARD.x,player.z-CARD_BOARD.z);
 if(dBoard<2.4&&dBoard<dMail)return [{id:'gift:board',ic:'x-cards-all',label:'모두의 카드',key:'E'},{id:'gift:send',ic:'x-gift',label:'선물 보내기',key:'R'}];
 if(dMail<TARGETS.mailbox.r+.8)return [{id:'gift:send',ic:'x-gift',label:'선물 보내기',key:'E'},{id:'gift:inbox',ic:'x-mailbox',label:'받은 선물',key:'R',badge:gifts.unopened}];
 if(nearFire(player.x,player.z))return [{id:'fire:sit',ic:'c-sit',label:'앉기',key:'E'}];
 const fa=snowfight.actions();if(fa.length)return fa;
 const sa=snowman.actions();if(sa.length)return sa;
 const ka=skyPlay.actions();if(ka.length)return ka; // 루돌프 썰매 정류장
 const ga=gondola.actions();if(ga.length)return ga;
 const ca=carousel.actions();if(ca.length)return ca;
 const ra=rink.actions();if(ra.length)return ra;
 return sledPlay.actions();
}
function doAction(id){
 audio.play('pop',{gain:.4});
 switch(id){
  case 'tree:deco':setDecorate(true);if(giftOrn)hud.say(`선물 오너먼트 ${giftOrn}개 · 다음 장식은 내 몫과 따로 달려요`,2.6);return true;
  case 'gift:send':return gifts.startSend();
  case 'gift:inbox':gifts.openInbox();return true;
  case 'gift:board':gifts.openInbox(true);return true;
  case 'fire:sit':return campfire.start();
  case 'fire:warm':campfire.warm();return true;
  case 'fire:cocoa':campfire.sip();return true;
  case 'fire:stand':campfire.stand();return true;
 }
 if(id.startsWith('snow:'))return snowman.act(id);
 if(id.startsWith('sb:'))return snowfight.act(id);
 if(id.startsWith('sled:'))return sledPlay.act(id);
 if(id.startsWith('gd:'))return gondola.act(id);
 if(id.startsWith('mg:'))return carousel.act(id);
 if(id.startsWith('rk:'))return rink.act(id);
 if(id.startsWith('hs:'))return skyPlay.act(id);
 return false;
}
// 놀이 구역에 들어가면 이름 띠(처음은 규칙 한 줄과 4초)
const ZONES=Object.freeze({fight:{ic:'x-snowball',title:'눈싸움 마당',rule:FIGHT_TEXT.enter},snowman:{ic:'x-snowman',title:'눈사람 마당',rule:'눈덩이를 만들어 굴리면 커져요. 같이 밀면 더 빨라요'},sled:{ic:'x-sled',title:'썰매 산',rule:'출발대에서 「타기」 · 좌우로 기울이고 드리프트로 굽이를 돌아요'},fire:{ic:'x-campfire',title:'모닥불',rule:'통나무에 앉아 이야기해요'}});
let zoneNow=null;
function zoneAt(){if(inFightYard(player.x,player.z,-.3))return 'fight';if(inSnowmanYard(player.x,player.z,-.5))return 'snowman';if(player.z<-24&&Math.abs(player.x)<36)return 'sled';if(Math.hypot(player.x-CAMPFIRE.x,player.z-CAMPFIRE.z)<FIRE.talkR-1)return 'fire';return null;}
function updateZone(){const z=zoneAt();if(z===zoneNow)return;zoneNow=z;if(!z)return;const Z=ZONES[z],first=!profile.zones.includes(z);
 hud.banner(Z.title,first?Z.rule:'',first?4:1.5,Z.ic);if(first){profile.zones.push(z);saveProfile();}}
// PC 키: 단추에 적힌 글자(E·R·Q·F) = 그 단추, E는 장식 모드 끄기도, Esc 그만하기
const KEYS={KeyE:'E',KeyR:'R',KeyQ:'Q',KeyF:'F'};
addEventListener('keydown',e=>{const a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))return;
 if(KEYS[e.code]&&!e.repeat){
  if(e.code==='KeyE'&&deco.on){setDecorate(false);return;}
  if(gifts.open)return;
  if(sledPlay.key(KEYS[e.code]))return; // 썰매 결과 창: E 다시 타기 · Q 내리기
  if(fightUi.key(KEYS[e.code]))return; // 눈싸움 결과 창: E 한 판 더 · Q 마당 나가기
  if(e.code==='KeyF'&&snowfight.inYard)return; // 눈싸움 F = 누르는 동안 조준(snowfight-play.js가 받음)
  const k=KEYS[e.code],list=currentActions(),hit=list.find(x=>x.key===k);
  if(hit){doAction(hit.id);return;}
  }
 else if(e.code==='Escape'){if(deco.on){if(hud.pending!==null)pendingMark(null);else setDecorate(false);}else if(gifts.open)gifts.closeAll();else if(snowman.decoOpen)snowman.closeDeco();else if(campfire.sitting)campfire.stand();else hud.closeSheet();}});

// 채팅(공용 창, 크리스마스 자리·문구)
// 모닥불 둘레 6m 안 사람의 말풍선은 오래(6초, 체험설계 §5-3). 모양은 11-19 채팅 통일로 세 콘텐츠 같은 풍선
const byFire=(x,z)=>Math.hypot(x-CAMPFIRE.x,z-CAMPFIRE.z)<FIRE.talkR;
const chat=installHikingChat({ns:'xmas',cls:'xc-chat',frame:hud.frame,
 notice:'전화번호·주소·SNS 아이디는 적지 마세요. 채팅은 저장되지 않아요.',lookup:id=>screenPos(id),
 bubbleFor:id=>{const p=id===multi.id||id==='me'?player:multi.sampleOf(id);return p&&byFire(p.x,p.z)?{ms:FIRE.bubbleMs}:null;}});

// ── 서버 고르기(등산·흡연장과 같은 창): 허브 → 크리스마스 카드 → 서버 카드 전체 화면 → 광장. 혼자 둘러보기도 된다.
const pick=createServerPick({experience:'christmas',serverUrl:multi.server,serverOff:currentChoice().source==='file-off',defaultName:profile.nickname,
 onJoin:d=>{profile.nickname=cleanName(d.name);player.name=profile.nickname||'동동이';multi.join({room:d.room,name:d.name});},
 onSolo:({left})=>{if(left){multi.leave();hud.say('혼자 둘러보기로 바꿨어요. 트리는 마지막 모습 그대로예요');}}});
const serverIdOf=room=>room?findServer('christmas',room)?.id??null:null;
function openPick(note=null){pick.open({current:multi.joined&&multi.state!=='full'?serverIdOf(multi.room):null,note,closable:note!=='full'||multi.joined});}
const pickMode=serverPickMode(location.search,!!navigator.webdriver);
if(multi.params.auto)multi.join({room:multi.params.room,name:multi.params.name??profile.nickname});
else{const entryChoice=takeEntryChoice('christmas',{mode:pickMode}); // 허브에서 고른 것 → 이 기기의 지난 선택(11-19 entry.js)
 if(pickMode==='show'||entryChoice)enterWith(pick,entryChoice,pickMode);} // 고른 적 있으면 창 없이 바로, 아니면 공용 입장 창 한 번

// ── 크기·화질
function resize(){const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,mobile?1.5:2);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setPixelRatio(dpr);renderer.setSize(w,h);toon.pipeline.resize(mobile?1:2,w,h,dpr);}
addEventListener('resize',resize);resize();

// ── 메인 루프
const clock=new THREE.Clock();let frames=0,last=performance.now(),fps=60,actT=0;
updateCamera(1);
renderer.setAnimationLoop(()=>{
 const dt=Math.min(.05,clock.getDelta());
 updatePlayer(dt);rink.update(dt);skyPlay.updateRemotes(dt);skyPlay.frame(dt);multi.update(dt);net.update(dt);
 if(travel){travel.ui.syncRun({on:input.run,blocked:runBlocked(busyNow()),label:skyPlay.riding?'빨리':'달리기'});travel.ui.update(dt);}
 // 그림자는 내 주변에 맞춘다(광장이 넓어 22m 상자 하나로는 다 못 덮음)
 const focus=deco.on?lookAt:player.root.position;moon.target.position.set(focus.x,0,focus.z);moon.position.copy(moon.target.position).addScaledVector(Ldir,60);
 village.update(dt,{camera,viewHeight:renderer.domElement.height,snow:1});
 updateCamera(dt);if(ring.visible)ring.lookAt(camera.position);
 toon.updateSky(env,sunVec,moonVec);toon.pipeline.update(env);
 // 놀이 화면들 + 행동 단추(0.2초마다) + 구역 띠 + 소리
 snowman.update(dt);snowfight.update(dt,{moveInput:!!(input.move().forward||input.move().side)});fightUi.update(dt);gifts.update(dt);
 actT-=dt;if(actT<=0){actT=.2;hud.setActions(currentActions());updateZone();
  // 큰 창·판(선물·사람 목록·옷·눈사람 꾸미기)이 열린 동안 💬 단추를 접는다(휴대폰 아래 시트를 가리지 않게, 한 번에 한 가지 창)
  document.documentElement.classList.toggle('xh-panel',gifts.open||snowman.decoOpen||!!hud.sheet||hud.cardOpen);
  // 선물·눈사람 꾸미기 창도 「창은 하나만」(공통 틀): 열리면 메뉴·채팅·지도가 닫히고, 다른 창이 열리면 이 창들이 닫힌다
  {const g=gifts.open||snowman.decoOpen;if(g&&!playWin){playWin=true;openWin('play');}else if(!g&&playWin){playWin=false;closeWin('play');}}
  if(!playWinHook){playWinHook=true;onWin('play',()=>{if(gifts.open)gifts.closeAll();if(snowman.decoOpen)snowman.closeDeco();});}
  if(hud.sheet==='music')showCarol();}
 audio.update(dt,{x:player.x,z:player.z,fireDist:Math.hypot(player.x-CAMPFIRE.x,player.z-CAMPFIRE.z),sitting:campfire.sitting,skate:rink.glide,sled:sledPlay.mode==='ride'?sledPlay.ride?.v??0:sledPlay.riding?6:skyPlay.riding?Math.max(2.5,skyPlay.speed):0}); // 하늘 썰매도 같은 방울 소리(둥실 멈춤이면 느리게)
 hud.update(dt,{hasBubble:id=>chat?.hasBubble?.(id)});
 renderer.info.reset();toon.pipeline.render(dt); // 그림자·외곽선 패스까지 한 프레임 전체 그리기 횟수(status().calls)
 frames++;const now=performance.now();if(now-last>1000){fps=frames*1000/(now-last);frames=0;last=now;}
});
loading?.classList.add('done');setTimeout(()=>loading?.remove(),700);
// 첫 방문 안내(4초, 한 번만): 트리 위 표시 + 말
if(!profile.tip){setTimeout(()=>{hud.say('트리 가까이 가서 장식을 달아 보세요',4,'x-tree');profile.tip=true;saveProfile();},1200);}
dispatch('xmas:ready',{});

// 진단·자동 점검용(브라우저 콘솔 window.xmas)
window.xmas={village,player,multi,treePlay,hud,cam,deco,chat,pick,screenPos,
 poser,net,audio,gifts,campfire,snowman,snowfight,fightUi,sled:sledPlay,gondola,carousel,rink,sky:skyPlay,doAction,currentActions,get travel(){return travel;},travelTo,
 get giftOrn(){return giftOrn;},
 get fps(){return fps;},
 teleport(x,z,heading=player.heading){player.place(x,z,heading);cam.yaw=heading;},
 decorate:setDecorate,pickSlot,
 setLook:l=>look.set(l),
 // 선물 옷 받기(선물 우체통 단계가 붙으면 그쪽이 부른다): 이 기기에 남긴다
 addWardrobe(item){if(!profile.wardrobe.includes(item)){profile.wardrobe.push(item);saveProfile();}},
 status(){return {multi:multi.status(),fps:+fps.toFixed(1),player:{x:+player.x.toFixed(2),z:+player.z.toFixed(2),y:+player.root.position.y.toFixed(3),heading:+player.heading.toFixed(2),look:player.look,sitting:poser.sitting,arms:poser.arms},tree:{count:treePlay.count,stage:treePlay.stage,star:treePlay.star?.n??null},decorating:deco.on,calls:renderer.info.render.calls,tris:renderer.info.render.triangles,
  actions:hud.actions.map(a=>a.id),act:myAct(),gifts:gifts.status(),fire:campfire.status(),snowman:snowman.status(),fight:{...snowfight.status(),...fightUi.status()},sled:sledPlay.status(),gondola:gondola.status(),carousel:carousel.status(),rink:rink.status(),sky:skyPlay.status(),travel:travel?.ui.status()??null,audio:{unlocked:audio.unlocked,muted:audio.muted,...audio.stats,carol:audio.carolNow()},zone:zoneNow};},
};
