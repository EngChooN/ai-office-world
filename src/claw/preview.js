// 인형뽑기 그림 미리보기(월드아트, vite dev: /src/claw/preview.html). 게임 화면이 아니라 그림·에셋 확인용이다.
// 카툰 재질·후처리는 다른 콘텐츠와 같은 createToonStyle, 빛은 claw-shop-art.js SHOP_LIGHT(실내). 크기 비교용 동동이를 기계 앞에 세운다.
// ?view=shop|entry|machines|play|pile|plush|showcase &machine=0~2 &lights=idle|play|win|rainbow &claw=x,z,drop,open &collected=all|none|3
// &mobile=1(휴대폰: 더미 인형 줄임·DPR 1) &hud=0 &dd=0(동동이 숨김) &kinds=0(세 대 모두 집게 — 게임 연결 전 모습)
// 그림 방향: &look=neon(기본)|pastel(대안)
// 가게 옷: &outfit=hoodie|jacket|tee(자세 동동이 옷) · view=outfits(세 벌 나란히, &side=1이면 옆모습)
// 동동이 자세: &pose=operate|cheer|droop(&at=초, 그 순간에 멈춤) — 게임과 같은 claw-avatar.js(claw-poses.js) 동동이, view=pose(옆 앞에서)
// 타이머 기계(machine=1): &timer=09.87,run(상태 ready·run·win·near·miss) &dim=1(도는 숫자 어둡게) · 열쇠 기계(machine=2): &key=x,y,push(판정 좌표) &mark=i,j,ok|near|miss &open=i,j &pity=1
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createToonStyle} from '../toon/index.js';
import {composeEnvironment} from '../daytime.js';
import {buildClawShop,SHOP,SHOP_LIGHTS,SHADOW_LAYER} from './claw-shop-art.js';
import {CLAW} from './claw-machine-art.js';
import {makePlush,PLUSH_IDS,plushTriangles} from './claw-plush.js';
import {PLUSH,RARITY} from './claw-palette.js';
import {loadGuests,makeGuestPlush,clawCatalog} from './claw-guest.js';
import {createClawAvatar} from './claw-avatar.js';
import {CLAW_OUTFIT_IDS} from './claw-outfits.js';

const q=new URLSearchParams(location.search),mobile=q.get('mobile')==='1';
if(q.get('hud')==='0')document.getElementById('panel')?.remove();
const info=t=>{const el=document.getElementById('info');if(el)el.textContent=t;};
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const look=q.get('look')??'neon',L=SHOP_LIGHTS[look]??SHOP_LIGHTS.neon,scene=new THREE.Scene();scene.background=new THREE.Color(L.background);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.05,200);
const toon=await createToonStyle({renderer,scene,camera,mobile});
const hemi=new THREE.HemisphereLight(L.hemi.sky,L.hemi.ground,L.hemi.intensity);
const key=new THREE.DirectionalLight(L.key.color,L.key.intensity);key.position.set(...L.key.pos);key.castShadow=true;key.shadow.mapSize.set(L.key.shadow.map,L.key.shadow.map);
Object.assign(key.shadow.camera,{left:-L.key.shadow.size,right:L.key.shadow.size,top:L.key.shadow.size,bottom:-L.key.shadow.size,near:1,far:30});key.shadow.bias=-.0006;key.shadow.normalBias=.03;key.shadow.camera.layers.enable(SHADOW_LAYER); // 기계 그림자 = 그림자 전용 상자
scene.add(hemi,key,key.target);renderer.toneMappingExposure=L.exposure;
// 낮 환경으로 후처리(외곽선·블룸·색보정) 값을 맞춘다(실내라 하늘은 안 그림)
toon.pipeline.update(composeEnvironment({sun:{elevation:45,azimuth:160},moon:{elevation:-20,azimuth:0,illumination:.5}}));

const guests=await loadGuests();
const guestProtos=new Map();for(const g of guests)guestProtos.set(g.id,await makeGuestPlush(g.id,guests,{toonify:toon.toonify}));
const t0=performance.now();
const shop=buildClawShop({toonify:toon.toonify,mobile,guests,guestObject:id=>guestProtos.get(id).clone(true),kinds:q.get('kinds')!=='0',look});scene.add(shop);
const buildMs=performance.now()-t0;
const U=shop.userData;
const col=q.get('collected')??'3';U.showcase.set(col==='all'?PLUSH_IDS:col==='none'?[]:PLUSH_IDS.slice(0,+col||0));
// 크기 비교 동동이: 가운데 기계 앞 발판에 서서 기계를 봄
let dd=null;
// 크기 비교 동동이도 게임과 같은 가게 옷 동동이(pose 없으면 그냥 서 있음)
const poseKind=q.get('pose')??(q.get('view')==='outfits'?null:'stand');let ava=null,poseFrozen=false;
const RIG=`${import.meta.env.BASE_URL}assets/toon/models/hiker/HikerRig.glb`;
if(poseKind&&q.get('dd')!=='0'){ava=await createClawAvatar({rigUrl:RIG,toon,outfit:q.get('outfit')??undefined});scene.add(ava.root);}
// 옷 세 벌 비교: 가운데 기계 앞에 나란히(왼쪽부터 hoodie·jacket·tee)
const trio=[];
if(q.get('view')==='outfits')for(const [i,id] of CLAW_OUTFIT_IDS.entries()){const a=await createClawAvatar({rigUrl:RIG,toon,outfit:id,id:'o'+i});scene.add(a.root);trio.push(a);}
// 인형 8종 줄(희귀도 순, 바닥에 둠) — view=plush 전용 무대
const lineup=new THREE.Group();lineup.name='인형 줄';scene.add(lineup);
{const cat=clawCatalog(guests);let x=0;const items=cat.map(c=>{const o=c.guest?guestProtos.get(c.id).clone(true):makePlush(c.id,{toonify:toon.toonify});lineup.add(o);return {o,w:RARITY[c.rarity].size*1.1};});
 const total=items.reduce((s,i)=>s+i.w,0)+.06*(items.length-1);x=-total/2;for(const it of items){it.o.position.set(x+it.w/2,0,0);x+=it.w+.06;}
 lineup.position.set(0,0,2.2);lineup.visible=false;lineup.updateMatrixWorld(true);}
const mi=Math.max(0,Math.min(2,+(q.get('machine')??1))),M=U.machines[mi];
const lights=q.get('lights')??'idle';for(const m of U.machines)m.group.userData.setLights(m===M?lights:'idle');
const MU=M.group.userData;
if(M.kind==='claw'){if(q.get('claw')){const [x,z,drop,open]=q.get('claw').split(',').map(Number);MU.claw.set({x,z,drop,open,dotY:MU.pile.topAt(x,z)});}
 else MU.claw.set({x:.05,z:-.05,drop:0,open:.6,dotY:MU.pile.topAt(.05,-.05)});}
if(M.kind==='timer'){const [text,state]=(q.get('timer')??'09.87,run').split(',');MU.setTimer({text,state,dim:q.get('dim')==='1'});MU.setButton(state==='run'?'stop':state==='ready'?'start':'off');}
if(M.kind==='key'){if(q.get('pity'))MU.setHoles({pity:true,pityBonus:.05});
 if(q.get('key')){const [x,y,push]=q.get('key').split(',').map(Number);MU.key.set({x,y,push:push||0});}
 if(q.get('mark')){const [i,j,m]=q.get('mark').split(',');MU.markCell(+i,+j,m);}
 if(q.get('open')){const [i,j]=q.get('open').split(',').map(Number);MU.openCell(i,j);}}

const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
const views={
 shop:()=>({pos:[5.2,6.2,7.5],look:[0,.6,-.6]}),
 entry:()=>({pos:[0,2.0,SHOP.d/2-.6],look:[0,.9,-2]}),
 machines:()=>({pos:[0,1.7,SHOP.machineZ+2.7],look:[0,.9,SHOP.machineZ]}),
 play:()=>{const c=M.group.userData.camera??CLAW.camera,P=innerWidth<innerHeight?c.portrait:c;return {pos:[M.x+P.pos[0],P.pos[1],M.z+P.pos[2]],look:[M.x+c.look[0],c.look[1],M.z+c.look[2]],fov:P.fov};},
 pile:()=>({pos:[M.x+.35,1.15,M.z+.95],look:[M.x,.68,M.z]}),
 pose:()=>({pos:[M.x+1.7,.95,M.z+1.05],look:[M.x+.05,.55,M.z+.78],fov:38}),
 posefront:()=>({pos:[M.x+1.25,1.25,M.z+2.7],look:[M.x+.1,.6,M.z+.85],fov:36}),
 poseback:()=>({pos:[M.x-.9,1.55,M.z+2.1],look:[M.x,.6,M.z+.7],fov:40}),
 front:()=>({pos:[M.x+.9,1.35,M.z+2.2],look:[M.x,1.0,M.z]}),
 plush:()=>{const b=new THREE.Box3().setFromObject(lineup),w=b.max.x-b.min.x,fov=30,t=Math.tan(THREE.MathUtils.degToRad(fov/2)),d=Math.max(w/1.7/(t*camera.aspect),.5/t);return {pos:[0,.15+d*.12,2.2+d],look:[0,.14,2.2],fov};},
 outfits:()=>q.get('side')!=='0'?({pos:[M.x+2.6,.75,M.z+1.6],look:[M.x,.5,M.z+1.6],fov:34}):({pos:[M.x,.85,M.z+4.2],look:[M.x,.5,M.z+1.6],fov:innerWidth<innerHeight?44:30}),
 showcase:()=>({pos:[SHOP.showcase.x+2.4,1.3,SHOP.showcase.z+.4],look:[SHOP.showcase.x,1.0,SHOP.showcase.z]}),
};
let view=q.get('view')??'shop';
function setView(v){view=v;const V=views[v]?.()??views.shop();camera.fov=V.fov??(innerWidth<innerHeight?62:50);camera.updateProjectionMatrix();camera.position.set(...V.pos);controls.target.set(...V.look);controls.update();
 lineup.visible=v==='plush';shop.visible=v!=='plush';
 if(dd){dd.scene.visible=v!=='plush';const s=M.stand;dd.scene.position.set(s.x,0,s.z);dd.scene.rotation.y=Math.PI;}
 if(ava){ava.root.visible=v!=='plush';if(!ava.placed){ava.placed=true;ava.place(M.stand.x,M.stand.z,0);}}
 if(trio.length){if(dd)dd.scene.visible=false;trio.forEach((a,i)=>{const side=q.get('side')!=='0';a.place(side?M.x:M.x+(i-1)*.62,side?M.z+1.6+(i-1)*.62:M.z+1.6,side?-Math.PI*.5+.6:Math.PI);});}
 key.position.set(...L.key.pos);if(v==='plush'){key.position.set(2,6,8);}
}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
for(const b of document.querySelectorAll('[data-lights]'))b.onclick=()=>M.group.userData.setLights(b.dataset.lights);
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);const dpr=mobile?1:Math.min(devicePixelRatio,2);renderer.setPixelRatio(dpr);toon.pipeline.resize(mobile?0:2,innerWidth,innerHeight,dpr);setView(view);}
addEventListener('resize',resize);resize();
// 통계(메모리 확인): 그리기 횟수·삼각형·텍스처
let frames=0;const clock=new THREE.Clock();
renderer.info.autoReset=false; // 후처리 여러 단계를 합친 한 화면 전체 그리기 수를 본다
// 자세 한 번 보기: kind를 켜고 at초까지 1/60초씩 돌린 뒤 멈춤(촬영용). at 없으면 계속 움직임(만세·숙임은 2초마다 다시)
function posePlay(kind,at=null){if(!ava)return null;poseFrozen=false;ava.place(M.stand.x,M.stand.z,0);
 ava.operate(kind==='stand'?null:M.group);if(kind==='cheer')ava.cheer();if(kind==='droop')ava.sigh();
 if(at!=null){for(let t=0;t<at;t+=1/60)ava.update(1/60,{moved:0});poseFrozen=true;}return ava.pose;}
let poseLoop=0;
if(ava){for(let i=0;i<40;i++)ava.update(1/60,{moved:0});posePlay(poseKind,q.get('at')!=null?+q.get('at'):null);}
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);U.update(dt);
 for(const a of trio)a.update(dt,{moved:0});
 if(ava&&!poseFrozen){ava.update(dt,{moved:0});if(poseKind==='cheer'||poseKind==='droop'){poseLoop+=dt;if(poseLoop>2){poseLoop=0;posePlay(poseKind);}}}U.fadeWalls(camera);controls.update();renderer.info.reset();toon.pipeline.render(dt);frames++;
 if(frames===20){const r=renderer.info;info(`그리기 ${r.render.calls} · 삼각형 ${(r.render.triangles/1000).toFixed(0)}k · 텍스처 ${r.memory.textures} · 형상 ${r.memory.geometries} · 만들기 ${buildMs.toFixed(0)}ms\n인형 삼각형 ${PLUSH_IDS.map(id=>plushTriangles(id)).join('·')} · 손님 인형 ${guests.length}개`);}});
window.claw={shop,setView,M,get frames(){return frames;},stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,buildMs,guests:guests.length}),
 claw:(o)=>M.group.userData.claw.set(o),lights:m=>M.group.userData.setLights(m),posePlay,get ava(){return ava;}};
