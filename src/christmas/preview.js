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
import {createSleighRider} from './sleigh-rider.js';
import {REINDEER_STATION} from './festive-layout.js';
import {RACE_BOARD} from './sled-play.js';
import {buildRaceBoardArt} from './race-board-art.js';

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
// 마을 「썰매 경주」 판(11-18): 게임에서는 sled-play.js가 놓는다. ?race=wait|run|none|empty(기록 없음)
const raceBoard=buildRaceBoardArt({tz:toon.toonify,mobile});
{const B=RACE_BOARD,ph=q.get('race')??'wait';raceBoard.group.position.set(B.x,heightAt(B.x,B.z),B.z);raceBoard.group.rotation.y=B.heading;world.add(raceBoard.group);
 raceBoard.paint({phase:ph==='empty'?'none':ph,n:2,max:4,left:15,online:true,top:ph==='empty'?[]:[{n:'눈사람장인',t:'0:58.21'},{n:'동동이',t:'1:01.07'},{n:'루돌프코',t:'1:03.90'}]});}
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
// 하늘 썰매(11-18 설계 v2): ?view=reindeer-* 장면에서만 동동이가 탄 썰매를 띄운다. 동작 5가지 줄(광장 동쪽 x≈10에 남북으로 한 줄, 모두 서쪽을 봄) + 하늘을 도는 3대(별 흔적) + 땅을 도는 1대(눈 튐)
// &p=0~1 = 날아오르기·내려앉기 자세를 그 진행도에 고정(촬영용). &solo=run|fly|takeoff|land = 정류장 서쪽 한 대의 자세
const SKY=village.festive?.skySleigh,deerDemo=[];
if(SKY&&(q.get('view')??'').startsWith('reindeer')){const looks=[{outfit:'santa'},{outfit:'elf',hat:'antlers'},{outfit:'sweater',hat:'santa'},{outfit:'santa',scarf:'stripe'},{outfit:'sweater'},{outfit:'elf'},{outfit:'santa',hat:'beanie'},{outfit:'sweater',hat:'antlers'}];
 const ride=async(i,kind,o={})=>{const team=SKY.fleet.spawn(),a=await add(looks[i%looks.length],0,0,0,'reindeer'),poser=createXmasPoser({avatar:a,world,toon}),r=createSleighRider({avatar:a,poser});team.driver=true;const d={team,a,r,kind,i,...o};deerDemo.push(d);return d;};
 const modes=[['stand',0],['run',3.6],['takeoff',.12],['fly',0],['land',.55]];
 for(let i=0;i<modes.length;i++)await ride(i,'line',{mode:modes[i][0],arg:modes[i][1],x:10+i*.6,z:3.6+i*2.5});
 await ride(6,'line',{mode:q.get('solo')??'stand',arg:q.get('solo')==='run'?3.6:.5,x:19.5,z:32.5,solo:true});
 for(let i=0;i<3;i++)await ride(5+i,'sky',{R:12+i*4,h:8+i*2.5,ph:i*2.1,speed:6+i*1.2,mine:i===0});
 await ride(3,'ground',{R:9.5,ph:1,speed:3.6});
 for(const a of avatars)if(a.group!=='reindeer')a.root.visible=false; // 썰매 장면은 다른 동동이를 숨겨 실루엣이 겹치지 않게
 for(const d of deerDemo){d.trail=SKY.stars.emitter({mine:d.mine??true});d.team.mode=d.mode??(d.kind==='sky'?'fly':'run');d.r.mount(d.team,{instant:true});}}
let demoT=0;const fixedP=q.has('p')?+q.get('p'):null,frozen=q.get('frozen')==='1';
function updateDeerDemo(dt){if(!deerDemo.length)return;demoT+=frozen?0:dt;const T=new THREE.Vector3();
 for(const d of deerDemo){const {team,a}=d;
  if(d.kind==='line'){const p=fixedP??((demoT%3)/3);team.mode=d.mode;team.speed=d.mode==='run'?d.arg:0;team.progress=d.mode==='takeoff'||d.mode==='land'?(fixedP==null?p:d.arg):0;
   const y=heightAt(d.x,d.z),lift=d.mode==='fly'?1.6:d.mode==='takeoff'?.3+.8*team.progress:d.mode==='land'?Math.max(0,.75-team.progress)*1.6:0;team.place(d.x,y+lift,d.z,Math.PI/2);
   // 날아오르기는 루돌프가 먼저 뜨고(앞이 1m 위), 내려앉기는 루돌프가 먼저 내려옴(앞이 0.4m 아래) — 썰매는 끌려와 기욺
   const fl=d.mode==='takeoff'?1:d.mode==='land'?-.4:0;if(fl){const f=team.front;team.drive(f.x,f.y+fl,f.z,Math.PI/2);}}
  else{const w=d.speed/d.R,ang=d.ph+demoT*w,x=Math.sin(ang)*d.R,z=Math.cos(ang)*d.R,heading=Math.atan2(-Math.cos(ang),Math.sin(ang));
   const y=d.kind==='sky'?d.h+Math.sin(demoT*.7+d.ph)*1.2:heightAt(x,z);team.speed=d.speed;team.drive(x,y,z,heading);
   team.trailPoint(T);d.trail.update(dt,T,{air:d.kind==='sky',running:d.kind==='ground',ground:heightAt(team.x,team.z)});}
  a.place(team.x,team.z,team.heading);}
 // 따라가기: 하늘 첫 대 뒤 위(설계 §3 비행 카메라 10m)
 if(state.view==='reindeer-chase'){const d=deerDemo.find(e=>e.kind==='sky');if(d){const h=d.team.heading,f=new THREE.Vector3(-Math.sin(h),0,-Math.cos(h));
  camera.position.set(d.team.x-f.x*8,d.team.y+5.5,d.team.z-f.z*8);controls.target.set(d.team.x+f.x*2.5,d.team.y+.6,d.team.z+f.z*2.5);}}}
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
 // 하늘 썰매(11-18): 정류장(광장 쪽에서) · 동작 5가지 줄 · 한 대 옆/앞/뒤(실루엣 확인) · 하늘(별 흔적)
 'reindeer-station':[30.2,2.7,24.6,23.9,.7,29.2],'reindeer-modes':[3.2,6.2,21,10.6,1.2,8.6],
 'reindeer-side':[18.3,1.5,36.9,18.3,.95,32.5],'reindeer-front':[13.4,1.9,34.6,17.4,.75,32.5],'reindeer-back':[23.6,2.2,34.4,19.5,.75,32.5],'reindeer-sky':[24,15,30,0,8,2],'reindeer-trail':[3,10.5,25,0,8.6,8],'reindeer-chase':[0,12,20,0,10,0],
 outfits:[0,.62,LINE_Z+4.2,0,.5,LINE_Z],'outfits-side':[4.2,.62,LINE_Z,0,.5,LINE_Z],'outfits-back':[0,.62,LINE_Z-4.2,0,.5,LINE_Z],gifts:[0,.64,LINE_Z+40+4.6,0,.52,LINE_Z+40],
};
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
// 썰매 점프대 확인(11-17): 오늘 코스의 첫 점프대 둘레. jump = 옆 위에서, jump-far = 위쪽 줄에서 멀리, jump-ride = 썰매 타는 눈높이로 다가가며
function jumpView(name){const C=village.course?.course;const j=C?.jumps?.[+(q.get('jump')??0)]??C?.jumps?.[0];if(!j)return null;const top=C.xz(j.s),a=C.xz(j.s-j.len),y=C.profileH(j.s);
 const fx=top.x-a.x,fz=top.z-a.z,l=Math.hypot(fx,fz)||1,ux=fx/l,uz=fz/l,nx=-uz,nz=ux;
 if(name==='jump')return [top.x-ux*3+nx*5.5,y+3.2,top.z-uz*3+nz*5.5,top.x-ux*1.4,y+.5,top.z-uz*1.4];
 if(name==='jump-ride')return [a.x-ux*9,C.profileH(j.s-j.len-9)+1.5,a.z-uz*9,top.x,y+.6,top.z];
 return [top.x-ux*24+nx*16,y+16,top.z-uz*24+nz*16,top.x,y,top.z];}
// 썰매 경주 길 확인(11-18): race-start = 출발대 뒤 위(줄 색 판·7m 출발 직선) · race-hairpin = 첫 헤어핀 바깥 위 · race-hairpin-ride = 헤어핀 들어가는 썰매 눈높이
//  · race-tunnel = 첫 터널 입구 · race-narrow = 첫 좁은 길 · race-board = 마을 「썰매 경주」 판 앞
function raceView(name){const C=village.course?.course;if(!C)return null;
 const dirAt=s=>{const a=C.xz(s);return {x:a.x,z:a.z,ux:Math.cos(a.th),uz:Math.sin(a.th),y:C.profileH(s)};};
 if(name==='race-start'){const p=dirAt(-1.5);return [p.x-p.ux*7.5,p.y+4.2,p.z-p.uz*7.5,p.x+p.ux*5,p.y-.6,p.z+p.uz*5];}
 if(name==='race-board'){const B=RACE_BOARD,y=heightAt(B.x,B.z),fx=-Math.sin(B.heading),fz=-Math.cos(B.heading);return [B.x-fx*4.6,y+1.9,B.z-fz*4.6,B.x,y+1.4,B.z];}
 const sec=t=>C.sections.find(x=>x.type===t.type&&(!t.kind||x.kind===t.kind));
 if(name.startsWith('race-hairpin')){const h=sec({type:'turn',kind:'hairpin'})??sec({type:'turn'});if(!h)return null;const m=(h.s0+h.s1)/2,p=dirAt(m),k=C.at(m).k,sd=k>0?-1:1,o=C.xz(m,sd*9);
  if(name==='race-hairpin-ride'){const a=dirAt(h.s0-6);return [a.x-a.ux*2.6,a.y+1.6,a.z-a.uz*2.6,p.x,p.y+.3,p.z];}
  return [o.x,p.y+9,o.z,p.x,p.y,p.z];}
 const t=name==='race-tunnel'?C.tunnels[0]:name==='race-narrow'?C.narrows[0]:null;if(!t)return null;const a=dirAt(t.s0-8),b=dirAt(t.s0+2);return [a.x-a.ux*2+(-a.uz)*2.2,a.y+2.4,a.z-a.uz*2+a.ux*2.2,b.x,b.y+.8,b.z];}
function setView(name){const v=(name.startsWith('jump')&&jumpView(name))||(name.startsWith('race-')&&raceView(name))||VIEWS[name]||VIEWS.entry;state.view=name;
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
renderer.setAnimationLoop(()=>{const dt=Math.min(.05,clock.getDelta());updateDeerDemo(dt);controls.update();renderer.info.reset();
 const car=village.festive?.carousel;for(const r of riders){const p=car.seatPose(r.k);r.a.place(p.x,p.z,p.heading);}
 for(const a of avatars)a.update(dt,{moved:0});
 for(const r of riders){const p=car.seatPose(r.k);r.a.root.position.y+=p.y-SEAT_SIT_Y;}
 village.update(dt,{camera,viewHeight:renderer.domElement.height,snow:snowOn?1:0});raceBoard.update(dt);
 toon.updateSky(env,sunVec,moonVec);toon.pipeline.update(env);toon.pipeline.render(dt);frames++;});
// 진단: ?hide=이름,이름 → 그 이름의 물체를 숨긴다
for(const n of (q.get('hide')??'').split(',').filter(Boolean))scene.traverse(o=>{if(o.name===n)o.visible=false;});
window.xmas={village,scene,avatars,setView,setStage,state,camera,renderer,deerDemo,get frames(){return frames;},info(){return renderer.info.render;}};
