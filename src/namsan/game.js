// 남산 게임 화면(월드개발 11-19, /hiking/namsan/). 산 고르기(관악산 페이지)에서 남산 「오르기」를 누르면 이 페이지로 온다.
// 한 게임 통합 6단계(11-20): 관악산과 같은 공통 본체로 돈다.
//  - 화면: 공통 화면 조각 src/frame/hiking-body.html(페이지 hiking/namsan/index.html이 끼워 넣음) + 같은 수첩 HUD(hud-notebook·hiking-frame·hud-toggle·gadget-ui·interaction-ui)
//    산마다 다른 글·꺼진 기능 자리는 src/mountains/page-text.js가 남산 정의(namsan-page.js NAMSAN_TEXT·NAMSAN_FEATURES)로 로딩 화면 전에 바꾼다
//  - 공통 본체 부품 src/hiking-body.js: 소리(발소리·켜기/끄기·음량)·WebGL 끊김 복구·함께 걷기 HUD — 관악산 main.js와 같은 코드
//  - 이 파일에 남는 것 = 남산 세계(지형·그림·버스·자물쇠·벤치)와 남산 걷기 부품 N을 공통 HUD 약속('hiking:state'·'hiking:command'·#status 등)에 잇는 일
// 걷기 규칙은 namsan-walk.js(three 없음, 시험 tests/namsan-game.test.mjs). 점검 scripts/verify-namsan-game.mjs·verify-namsan-content.mjs.
// 콘솔 window.namsan: status()·jump(s)·setAuto(on)·multi() (점검·개발용)
import {serverReady} from '../server-link-pin.js';
import '../loading-screen.js';
import {createLoadingTracker,createStabilityCounter,LOADING_EVENT} from '../loading.js';   // 맨 먼저: 함께 걷기 서버 주소 고르기(관악산 산 고르기와 같은 순서)
import * as THREE from 'three';
// 관악산 main.js와 같은 화면 스타일(공통 화면 조각)
import '../style.css';import '../gadget-ui.css';import '../section-jump.css';import '../hud-v2.css';import '../hud-notebook.css';import '../ui-frame.css';import '../hiking-frame.css';
import '../icons/icons.css';
import '../server-pick.css';
import './game.css';
import {createToonStyle} from '../toon/index.js';
import {setupRendering} from '../rendering.js';
import {loadLandscape} from '../../assets/realistic/load-landscape.js';
import {setTimeOverride,seoulClock} from '../daytime.js';
import {loadFree,presetClock} from '../free-settings.js';
import {createSeasonController} from '../season.js';
import {loadToonHiker,prepareToonHikerGltf} from '../toon/link-hiker.js';
import {bindInput} from '../input.js';
import {createLook,turnLook,faceForward,updateLook,createHeightFollow,followHeight} from '../view.js';
import {gaitFor} from '../route.js';
import {strideScaleFor} from '../movement.js';
import {LIMITS} from '../device-profile.js';
import {AdaptiveQuality} from '../adaptive-quality.js';
import {createServerPick} from '../server-pick.js';
import {hikingServerUrl,hikingPickMode,entryChoiceNow} from '../hiking-server-pick.js';
import {currentChoice} from '../server-link.js';
import {enterWith,ENTRY_KEY} from '../entry.js';
import {recordSummit,summitOf,loadSummits} from '../summit-records.js';
import {loadNamsanData,createNamsanGround,openWallsForBus,courseAt,NAMSAN} from './namsan-data.js';
import {buildNamsan} from './namsan-art.js';
import {createNightLighting} from '../night-lighting.js';
import {NAMSAN_ENTRY_KEY,NAMSAN_SERVERS,isNamsanRoom,namsanRoom,walkHeight,heightAt,remainOf,jumpTo,wrapAngle} from './namsan-walk.js';
import {createNamsanWalker} from './namsan-walker.js';
// 통합 5단계(11-20): 남산 상호작용(약수·물확·돌탑·정상석·이정표·스탬프함·쌍안경)·사랑의 자물쇠·순환버스·정상 야경 벤치
import {buildNamsanInteract,INTERACT_COLORS} from './namsan-interact-art.js';
import {makeWalkPads,placeOf,stairGait} from './namsan-walk.js';
import {createNamsanInteract,planNightBenches} from './namsan-interact.js';
import {createLockBoard} from './namsan-lock-board.js';
import {NS_LOCKS,NS_BENCH,NS_LANDMARKS} from './namsan-content.js';
// 남산 전망탑 들어가기(11-22): 입구 → 엘리베이터 연출 → 실내 전망대 한 층(규칙 namsan-tower.js, 그림 namsan-tower-art.js)
import {planTowerEntrance,planDeck,deckWalk,elevatorAt,elevatorSkipTo,inTowerXZ,DECK,deckHeightText,headingFor} from './namsan-tower.js';
import {buildTowerEntrance,buildTowerDeck} from './namsan-tower-art.js';
import {buildBus,placeOnLane,seatInBus} from './namsan-bus-art.js';
import {createBusTimetable,otherStop,mmss,BUS_RULE} from './namsan-bus.js';
import {bench} from '../toon/trail-props.js';
import {looseStone} from '../../assets/realistic/interaction-props.js';
import {NAMSAN_MOUNTAIN} from '../mountains/namsan.js';
const GWANAK_SUMMIT_ID='gwanak';   // 관악산 완등 기록 id(GWANAK.summitId와 같음 — gwanak.js는 코스 모듈까지 불러와 여기선 이름만)
import {mountInteractionUI} from '../interaction-ui.js';
import {directionToBearing} from '../interaction-logic.js';
import {installGadgetUI,viewfinderCrop} from '../gadget-ui.js';
import {ensureGadget,setGadget,closeGadget,zoomBy,zoomStep,viewZoom,viewLocked,setPhoneZoom,toggleSelfie,selfieActive,selfiePosition,photoFilename} from '../gadget.js';
import {project} from '../../assets/realistic/geo.js';
// 공통 본체(통합 6단계)
import {installNotebookHud,formatRemainKm} from '../hud-notebook.js';
import {installHikingFrame} from '../hiking-frame.js';
import {installHudToggle} from '../hud-toggle.js';
import {sectionJumpEnabled,mountSectionJump} from '../section-jump.js';
import {createHikingSound,installContextRecovery,installMultiHud,readQualityMode,saveQualityMode,bindQualityControls,installLifecycleSave,easeCameraZoom,sceneMemory,paintHikeCard,hikeClock} from '../hiking-body.js';
import {createInteractionSound} from '../interaction-sound.js';
// 남산 소리(11-21): 구간별 환경음 표(관악산 표 대신)와 순환버스 소리
import {NAMSAN_AMBIENT_CONFIG} from './namsan-ambient-config.js';
import {createBusSound} from './namsan-bus-sound.js';
// 남산 동물(11-21): 관악산 동물(trail-world.js·trail-sound.js·trail-hud.js)을 남산 출현 구역·안전 범위로 그대로 씀(사본 없음)
import {createTrailWorld} from '../trail-world.js';
import {createTrailSound} from '../trail-sound.js';
import {installTrailHud} from '../trail-hud.js';
import {namsanAnimalZones} from './namsan-animal-zones.js';
import {createNamsanAnimalLanes,namsanTrailLanes,namsanBushesFrom,NAMSAN_ANIMAL_MIN_OFFSET} from './namsan-animal-lanes.js';
import {wallLine} from './namsan-art.js';

const q=new URLSearchParams(location.search),BASE=import.meta.env.BASE_URL,$=s=>document.querySelector(s);
document.documentElement.dataset.icExp='hiking';
const mobile=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
if(mobile)document.body.classList.add('touch');
window.namsan={started:false};
// 공용 HUD·채팅·함께 걷기·헤드랜턴(L)이 보는 자리(관악산과 같은 이름). started는 출발 뒤 true
window.hiking={started:false,multiApi:null,multi:()=>null};
const M=NAMSAN_MOUNTAIN,F=M.features;
// ── 공통 수첩 HUD(관악산 main.js와 같은 설치 순서). 진행 막대 눈금(남산 스탬프 4곳)은 코스 길이를 안 뒤에 채운다 ──
installHudToggle();installGadgetUI();
installNotebookHud(document,window,{ticks:[]});
window.hikingFrame=installHikingFrame({goal:M.text.goalLabel.trim(),barMode:'progress',features:F});
const frame=window.hikingFrame;
// ── 로딩 화면 ──
// 관악산과 같은 로딩 화면(loading-screen.js·loading.js 그대로, 단계 칩·바뀌는 안내·첫 프레임 안정 확인). 안내 문구만 남산(index.html data-tips)
const loading=createLoadingTracker({emit:detail=>window.dispatchEvent(new CustomEvent(LOADING_EVENT,{detail}))});
const ldFail=e=>{console.error(e);loading.fail(e);};
window.addEventListener('unhandledrejection',e=>{if(!window.namsan.started)ldFail(e.reason);});
window.addEventListener('error',e=>{if(!window.namsan.started&&loading.phase==='loading')ldFail(e.error??e.message);});
loading.set('terrain',.02);

// ── 입장(세 체험 공통 흐름 그대로): 산 고르기가 넘겨준 선택 → (주소로 바로 왔으면) 이 기기의 지난 선택 → 없으면 공용 입장 창 한 번 ──
const multiMode=q.has('multi'),pickMode=hikingPickMode();
let passed=null;try{passed=JSON.parse(sessionStorage.getItem(NAMSAN_ENTRY_KEY)??'null');sessionStorage.removeItem(NAMSAN_ENTRY_KEY);}catch{}
// 산 고르기 뒤에는 늘 이 산의 서버 창(남산 1·2·3서버)을 연다(11-21 대표 지시) — 허브·지난 선택·산 고르기에서 넘어온 서버 선택은 쓰지 않는다. 혼자 하기 선택만 이어 준다
const entryChoice=pickMode==='legacy'?null:(passed?.solo?{solo:true}:null);
let wantStart=false,ready=false,beginHike=()=>{};
const requestStart=()=>{wantStart=true;beginHike();};
let pendingJoin=null;   // 화면이 준비되기 전에 고른 서버
let joinMulti=async()=>{};
let pick=null;
const namsanPick=()=>pick??=createServerPick({experience:'hiking',servers:NAMSAN_SERVERS,serverUrl:hikingServerUrl(),serverOff:currentChoice().source==='file-off',
 onJoin(d){pendingJoin={room:d.room,name:d.name};joinMulti(pendingJoin);requestStart();},
 onSolo({left}){if(left)leaveMulti();requestStart();}});
serverReady.then(()=>{
 if(multiMode){pendingJoin={room:isNamsanRoom(q.get('multi'))?q.get('multi'):namsanRoom(),name:q.get('name')};requestStart();return;}
 const r=enterWith(namsanPick(),entryChoice,pickMode);
 if(r===null)requestStart();   // 점검 브라우저(창 건너뜀) = 혼자 바로
});
// ── 장면 ──
const canvas=$('#world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,30000);
const toon=await createToonStyle({renderer,scene,camera,mobile});
loading.set('environment',.3);
// 계절·시간·날씨: 관악산과 같은 규칙(서울 날짜, ?season=·?time=·?weather=, 산 고르기 자유 설정 값은 sessionStorage로 같은 탭에 남음)
const free=(()=>{try{return loadFree(sessionStorage);}catch{return loadFree(null);}})();
const seasons=createSeasonController({onChange:st=>toon.setSeason(st.season)});
if(free.season)seasons.set(free.season);toon.setSeason(seasons.season,{instant:true});
setInterval(()=>seasons.tick(),60000);
if(free.time)setTimeOverride(presetClock(free.time));
// 남산 코스·공원 안 OSM 건물 33동은 숨긴다(그림 인계 §3-2). 도시 격자 코드(공용)를 바꾸지 않고 이 페이지에서 받을 때 거른다.
const hideIds=new Set((await (await fetch(`${BASE}assets/shared/namsan/city-hide.json`)).json()).ids);
{const raw=window.fetch.bind(window);window.fetch=async(url,o)=>{const r=await raw(url,o);if(!/generated\/seoul-(west|east)-\d+\.json/.test(String(url))||!r.ok)return r;const j=await r.json();j.buildings=j.buildings.filter(b=>!hideIds.has(b.id));return new Response(JSON.stringify(j),{status:200,headers:{'content-type':'application/json'}});};}
// 서울 배경만(관악산 산은 안 만듦, 통합 1단계)
const landscape=await loadLandscape({base:`${BASE}assets/realistic/generated/`,chunkBase:`${BASE}assets/shared/chunks/`,maxContactMapSize:renderer.capabilities.maxTextureSize,materialFactory:toon.materialFactory,toon:{toonify:toon.toonify,patchFoliage:toon.patchFoliage,styleCity:toon.styleCity,natureParts:toon.natureParts},mountain:false});
for(const child of landscape.group.children)if(!['SeoulCity2km','SeoulFar','HanRiverAndWater'].includes(child.name))toon.toonify(child,{kind:'prop'});
scene.add(landscape.group); // 관악산 풀밭(toon.attachLandscape)은 관악산 길을 따르므로 붙이지 않는다. 남산 풀밭은 buildNamsan이 toon.attachGround로 깐다(11-21)
const lighting=setupRendering(renderer,scene,camera,mobile,{toon});
if(free.weather)lighting.environment?.weather?.setOverride(free.weather);
loading.set('terrain',.6);
const data=await loadNamsanData(`${BASE}assets/shared/namsan/`);
const G=createNamsanGround(data);
data.walls=openWallsForBus(G,data.walls);   // 차로가 지나는 성곽 자리는 비움(11-21)
loading.done('terrain');loading.set('nature',.2);
// 휴대폰: 길에서 먼 나무를 덜 심고(200m 안은 그대로) 지형 칸을 크게 묶어 그리기 횟수를 줄인다(11-19 측정: 숲이 휴대폰 삼각형의 약 70%, 지형 칸 500~700번)
const MOBILE_KEEP=d=>d<60?1:d<200?.7:d<400?.35:d<800?.15:.08;
const ns=buildNamsan({G,data,toon,mobile,...(mobile&&q.get('lite')!=='0'?{terrainTile:250,forestKeep:MOBILE_KEEP,forestNear:30}:{})});scene.add(ns.root);
// 상호작용 그림 4종(월드아트 namsan-interact-art.js, 인계 §3 그대로): 가로등·등불·이정표·스탬프함·표지석을 넘겨 겹치지 않게
const ia=buildNamsanInteract(G,{walls:data.walls,lamps:ns.lamps?.userData.spots??[],lanterns:ns.lanterns.userData.spots,items:ns.furniture.userData.items});
toon.toonify(ia,{kind:'prop'});scene.add(ia);
// 그림 4곳 모두 「서 있을 곳」까지 걸어갈 수 있게: 길·광장 밖인 자리(물확 디딤돌·광장 밖 돌탑)는 걷는 곳에서 잇는 디딤 띠를 더한다
G.walkPads=makeWalkPads(G,ia.userData.spots);
// 이정표·스탬프함·정상석 자리(그림 furniture items) + 이정표 판 글·오르는 쪽 방향, 정상 광장 벤치(야경 벤치)
const nsItems=ns.furniture.userData.items.map(it=>{const y=G.ground(it.x,it.z);if(it.kind!=='sign')return {...it,y};const k=courseAt(G.points,it.s);return {...it,y,boards:NAMSAN.signs[it.n-1]?.boards??[],upBearing:directionToBearing(k.tx,k.tz)};});
// 정상 야경 벤치 2개(관악산 벤치 그림 그대로, 북쪽 도심을 보게). 전망탑·자물쇠 난간·돌탑·표지석·스탬프함·가로등·버스 고리를 비킨다
// 야경 벤치는 자물쇠 난간과 같은 쪽(월드아트가 고른 「바깥 풍경이 트인」 가장자리) 양옆에 둔다
const lockSpot0=ia.userData.spots.find(x=>x.action==='lock');
const nsBenches=planNightBenches(G,{want:lockSpot0?directionToBearing(lockSpot0.x-G.plaza.x,lockSpot0.z-G.plaza.z):350,avoid:[{x:NAMSAN.tower.x,z:NAMSAN.tower.z,r:15},...ia.userData.spots.map(s=>({x:s.x,z:s.z,r:s.action==='lock'?7:4})),...ns.furniture.userData.items.map(i=>({x:i.x,z:i.z,r:3})),...(ns.lamps?.userData.spots??[]).map(l=>({x:l.x,z:l.z,r:1.6}))],
 busClear:(x,z)=>!G.bus||(G.bus.cycle.nearest(x,z).distance>2.8&&G.bus.nearest(x,z).distance>G.bus.points[0].width/2+2.5)}).map((b,i)=>{
 const o=bench();o.name=`정상 야경 벤치 ${i+1}`;const y=G.ground(b.x,b.z)+.02;o.position.set(b.x,y,b.z);o.rotation.y=b.yaw;toon.toonify(o,{kind:'prop'});o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});scene.add(o);o.updateMatrixWorld(true);return {...b,y,obj:o};});
// ── 남산 전망탑 입구·실내 전망대(11-22) ──
// 문은 코스 끝(걸어서 도착하는 쪽)에서 가까운 빈 자리로. 자물쇠 난간·표지석·벤치·가로등·버스 고리를 비킨다
const TW=NAMSAN.tower,courseEnd=G.points.at(-1);
const towerDoor=planTowerEntrance(TW,{want:directionToBearing(courseEnd.x-TW.x,courseEnd.z-TW.z),
 walkable:(x,z)=>placeOf(G,x,z).ok&&(!G.bus||(G.bus.cycle.nearest(x,z).distance>3.2&&G.bus.nearest(x,z).distance>G.bus.points[0].width/2+2)),
 avoid:[...ia.userData.spots.map(s=>({x:s.x,z:s.z,r:s.action==='lock'?6:3})),...nsItems.map(i=>({x:i.x,z:i.z,r:2.5})),...nsBenches.map(b=>({x:b.x,z:b.z,r:2.5})),...(ns.lamps?.userData.spots??[]).map(l=>({x:l.x,z:l.z,r:1.2}))]});
// 글자판·유리(MeshBasic)는 카툰 재질로 바꾸지 않는다(글자가 명암에 묻힘)
const toonKeepBasic=o=>{const keep=[];o.traverse(m=>{if(m.isMesh&&m.material?.isMeshBasicMaterial)keep.push([m,m.parent]);});keep.forEach(([m])=>m.removeFromParent());toon.toonify(o,{kind:'prop'});keep.forEach(([m,p])=>p.add(m));};
const towerEntry=buildTowerEntrance(ns.tower,towerDoor.bearing);toonKeepBasic(towerEntry);ns.tower.add(towerEntry);
const deckPlan=planDeck(TW,{plazaY:G.plaza.y,entranceBearing:towerDoor.bearing,landmarks:NS_LANDMARKS,geo:(la,lo)=>project(la,lo)});
const deckArt=buildTowerDeck(deckPlan);deckArt.position.set(TW.x,deckPlan.y,TW.z);toonKeepBasic(deckArt);deckArt.visible=false;scene.add(deckArt);
const deckBlocks=deckPlan.scopes.map(s=>({x:s.x,z:s.z,r:.45}));   // 망원경 기둥은 비켜 걷는다
const tower={inside:false,elev:null,ret:null};   // elev = {dir,t,swapped}, ret = 들어가기 전 자리(나갈 때 문 앞으로)
// 휴대폰 밤 바닥 가로 줄무늬(11-20 월드기획 전달): 휴대폰 절반 해상도 화면 외곽선이 넓고 평평한 광장 바닥·길을 비스듬히 볼 때 줄로 그렸다(크리스마스 눈 바닥과 같은 원인).
// 그 바닥만 외곽선에서 뺀다(알파 0.5 표시 = 풀밭과 같은 방법, christmas/props.js noEdgeMaterial). PC는 그대로
if(mobile){const done=new Map();for(const root of [ns.root,deckArt])root.traverse(o=>{if(!o.isMesh||!/광장 바닥|마사토 길|버스 길 안내선|차로 아스팔트|차로 흰 선|차로 가운데 노란 선|차로 연석 윗면|버스 칸 테|전망대 바닥|전망대 천장|입구 디딤판/.test(o.name))return;const m=o.material;
 if(!done.has(m)){const c=m.clone(),prev=m.onBeforeCompile,key=m.customProgramCacheKey?.bind(m);c.onBeforeCompile=function(sh,r){prev?.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n gl_FragColor.a=min(gl_FragColor.a,.5);');};
  c.customProgramCacheKey=()=>`${key?.()??''}|ns-no-edge`;c.userData={...m.userData,noEdge:true};done.set(m,c);}o.material=done.get(m);});}
loading.done('nature');loading.done('facilities');
await landscape.streamFar();await landscape.streamWater();
let lowerRoads=()=>{};
// 원경: 관악산 원경 땅이 남산 판을 뚫지 않게 남산 판 안쪽만 내리고, 원경의 「N서울타워」 모형은 숨긴다(게임 속 전망탑으로 대신, 그림 인계 §3-1)
{const far=landscape.group.getObjectByName('SeoulFar'),B=G.bounds;
 far?.traverse(o=>{if(/N서울타워/.test(o.name))o.visible=false;});
 // 원경 땅과 간선도로(「서울 간선도로·교량」)를 같이 내린다 — 도로만 남으면 백범광장 왼쪽에 검은 경사면처럼 솟아 보였다(11-19)
 const lower=geo=>{const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(x>B.x0+20&&x<B.x1-20&&z>B.z0+20&&z<B.z1-20)p.setY(i,Math.min(p.getY(i),G.ground(x,z)-12));}p.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();};
 const ground=far?.children.find(o=>o.isMesh)?.geometry;if(ground)lower(ground);
 // 간선도로·교량·거리 불빛은 준비 뒤 streamRoads()로 붙으니 그때 내린다(아래 도심 받기)
 lowerRoads=()=>far?.traverse(o=>{if((o.isMesh||o.isPoints||o.isLineSegments)&&!o.isInstancedMesh&&o.geometry!==ground&&o.geometry?.attributes?.position&&!o.userData.nsLowered){o.userData.nsLowered=true;lower(o.geometry);}});}
// 밤 조명(관악산 night-lighting.js): 헤드랜턴과 실제 광원 풀. 남산 가로등 그림이 없을 때만 예전처럼 27m 등·두 광장 둘레 등을 직접 그린다.
// 남산 코스는 1.1km라 관악산 「공원 구간」(1,075m) 안 = 길 전체에 가로등이 있고 헤드랜턴은 저절로 켜지지 않는다(관악산 공원 구간과 같음)
const nsPlace=(s,l)=>{const k=courseAt(G.points,s),x=k.x-k.nx*(l+.25),z=k.z-k.nz*(l+.25);return [x,heightAt(G,x,z),z];};
const ring=(P,n,r,a0=0)=>Array.from({length:n},(_,i)=>{const a=a0+i/n*Math.PI*2;return {x:P.x+Math.cos(a)*r,z:P.z+Math.sin(a)*r,tx:P.x,tz:P.z,height:4};});
const LAMP_REAL=.55; // 실제 광원 세기 비율: 남산 등은 관악산(27m)보다 촘촘하고 바닥 빛을 그림이 따로 그려서 줄임
// 11-19 밤 가로등(월드아트): 기둥·바닥 빛·후광은 남산 그림(ns.lamps)이 그리고, night-lighting은 실제 광원 4개만 가까운 남산 등에 붙인다(관악산 27m 등·광장 등은 만들지 않음)
const night=createNightLighting({scene,renderer,place:nsPlace,groundHeight:(x,z)=>G.ground(x,z),lampPoints:ns.lamps?.userData.spots.filter(l=>l.real!==false).map(l=>({...l,boost:l.boost*LAMP_REAL}))??null,drawLamps:!ns.lamps,facilityPoints:ns.lamps?[]:[...ring(G.startPlaza,4,G.startPlaza.r-3,.4),...ring(G.plaza,6,G.plaza.r-4,.2)],routeLength:G.points.at(-1).s});
toon.styleNightLighting?.(night.root);
loading.set('hikers',.2);
const hikerUrl=`${BASE}assets/toon/models/hiker/HikerRig.glb`;
const hiker=await loadToonHiker(hikerUrl);const avatar=hiker.scene;toon.toonify(avatar,{kind:'character'});
avatar.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});scene.add(avatar);loading.done('hikers');
// ── 상태(이어 오르기: 이 기기에 저장, 함께 걷기 ?multi 주소는 저장 안 함) ──
// 걷기는 남산 걷기 부품 N으로(통합 4단계, 약속 src/walker.js). 걷기 규칙 namsan-walk.js는 그대로.
const N=createNamsanWalker(G),END=G.points.at(-1).s;
let saved=null;try{saved=localStorage.getItem(N.saveKey);}catch{}
const st=q.get('start')==='summit'?N.initialState({start:'summit'}):N.restore(saved);
let shortcut=q.get('start')==='summit';
const save=()=>{if(multiMode)return;try{localStorage.setItem(N.saveKey,N.serialize(typeof tower!=='undefined'&&tower.inside?{...st,x:towerDoor.stand.x,z:towerDoor.stand.z}:st));}catch{}};   // 전망대 안이면 탑 문 앞 자리로 저장(다시 열면 광장)
let wait=null,ride=null,seat=null;   // 버스 기다림·탄 버스·앉은 벤치(통합 5단계, 아래 순환버스·야경 벤치)
// 3인칭 카메라 비키기(6단계 작은 고침, 11-20): 약수·물확 동작 중엔 옆으로 돌아 약수터가 몸에 안 가리게, 휴대폰 세로 야경 벤치에선 뒤·위로 물러나 머리 위로 야경이 보이게
const ACT_CAM={yaw:.95,ahead:.6},SEAT_CAM={back:1.6,up:1.1,ahead:6,lift:1.4};
let actCamK=0,seatCamK=0;const _camBack=new THREE.Vector3();
const look=createLook(),camFollow=createHeightFollow();let camBase=st.heading,speed=0,walkPhase=0,moving=false;
// 쌍안경(관악산 gadget.js 규칙 그대로: 들면 1인칭·걷기 멈춤·배율 4~10, 내리면 원래 시점). 남산은 휴대폰 카메라 없음(features.phone=false)
const gs=ensureGadget({view:'third',gadget:'none'});
let view='third';const syncView=()=>{view=gs.view;updateUI();};
// 진행 막대 눈금 = 남산 스탬프 4곳(코스 s 기준)
{const t=$('.nb-ticks');if(t)t.innerHTML=NAMSAN.stamps.map(s=>`<u data-cp="ns-${s.n}" style="left:${(Math.min(1,s.s/END)*100).toFixed(2)}%"></u>`).join('');}

// ── 화질(관악산과 같은 규칙·같은 저장 키, 읽기·저장·단추는 공통 본체 부품 hiking-body.js: 휴대폰 '낮음' 시작, 자동 조절, 설정 탭에서 고르기) ──
let qualityMode=readQualityMode();
let quality=qualityMode==='auto'?(mobile?0:2):Number(qualityMode);const adaptive=new AdaptiveQuality(quality);
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=h>w?78:65;camera.updateProjectionMatrix();renderer.setSize(w,h);adaptive.setViewport(`${w}x${h}@${devicePixelRatio}`);if(adaptive.cap!==quality)adaptive.setCap(quality);
 const s=adaptive.settings,dpr=Math.min(devicePixelRatio,Math.max(s.dpr,LIMITS.minDpr));renderer.setPixelRatio(dpr);lighting.resize(quality,w,h,dpr,s);}
addEventListener('resize',resize);resize();
const qualityText=()=>`화질 ${['낮음','균형','높음'][quality]} · ${qualityMode==='auto'?'자동':'고정'}`;
function setQualityMode(mode){qualityMode=mode;saveQualityMode(qualityMode);quality=qualityMode==='auto'?(mobile?0:2):Number(qualityMode);resize();updateUI();}
bindQualityControls({mode:()=>qualityMode,set:setQualityMode});   // #quality 단추·설정 탭 화질 단추(공통 본체 부품, 7단계)

// ── 소리(공통 본체 부품: 발소리·환경음·켜기/끄기·음량). 환경음은 남산 구간 표(namsan-ambient-config.js, 11-21), 매 프레임 soundFrame이 넣는다 ──
const sound=createHikingSound({view:()=>view,ambient:F.ambient!==false,ambientConfig:NAMSAN_AMBIENT_CONFIG});
// 소리 출처(공통 조각 「소리 출처」 칸 끝에 남산 환경음·버스 소리 안내)
if(M.text.ambientCredits){const p=document.createElement('p');p.textContent=M.text.ambientCredits;document.querySelector('.sound-credits')?.append(p);}
const soundFx=createInteractionSound({context:()=>sound.audio.context,destination:()=>sound.audio.master,enabled:()=>sound.audio.enabled});
let stepCount=0,stepPhase=0;   // 발소리: 걸음 위상이 한 걸음 넘을 때마다(관악산 'hiking:step'과 같은 모양, 계단 = stairs·길 = 돌길)
const keyless=t=>mobile?String(t).replace(/\s*\([A-Z]\)/g,''):t;   // 휴대폰은 안내 글의 키 글자 (T)·(B)를 뺀다(11-20 월드디자인 확인 보통 2)

// ── 동물(11-21, 관악산과 같은 4종·반응·말풍선·소리·함께 걷기 놀람 중계). 기능 스위치 F.animals ──
// 자리: 출현 구역 namsan-animal-zones.js(추천안·대표 미확인) + 실제 그린 성곽·시설 배치로 만든 안전 범위 namsan-animal-lanes.js(길 가장자리 1~5m).
//  길 위·가장자리 1m 안(길을 가로지르는 걸음)은 금지만 본다(namsanTrailLanes).
// 높이: 길 가까이는 노면(heightAt), 그 밖은 그려진 지형 면. 다람쥐 나무 타기는 길가 숲 띠(ns.trail) 나무.
let trail=null;
if(F.animals!==false){
 // 덤불(11-22): 출현·땅 위 배회 자리는 그림이 그린 길가 덤불(ns.trail '남산 덤불')과 겹치지 않게(몸이 가려져 말풍선만 보이던 문제).
 const L=createNamsanAnimalLanes(G,{wallLines:data.walls.map(w=>wallLine(G,w)).filter(Boolean),plan:ia.userData.plan,bushes:namsanBushesFrom(ns.trail)});
 const surf=ns.terrain?.userData.surface??G.ground,animalHeight=(x,z)=>{const h=G.nearest(x,z);return h.distance<=NAMSAN.stairWidth/2+.4&&Number.isFinite(h.y)?h.y:surf(x,z);};
 const lanes=namsanTrailLanes(L,END);
 const trees=[];for(const lod of ns.trail?.userData.lods??[])for(const m of lod.userData.world??[])trees.push({x:m.elements[12],z:m.elements[14]});
 const treeNear=(x,z,r)=>{let best=null,bd=r;for(const t of trees){const d=Math.hypot(t.x-x,t.z-z);if(d<bd&&!L.inForbid(t.x,t.z)){bd=d;best=t;}}return best;};
 const measure={length:END,at:u=>{const k=courseAt(G.points,u);return {x:k.x,z:k.z,tx:k.tx,tz:k.tz,width:L.halfWidth(u)*2,m:u};},nearest:(x,z)=>{const h=G.nearest(x,z);return {m:h.s,d:h.distance};}};
 const trailSound=createTrailSound({context:()=>sound.audio.context,destination:()=>sound.audio.master,enabled:()=>sound.audio.enabled&&!document.hidden,base:`${BASE}sounds/trail/`});
 trail=createTrailWorld({scene,camera,hiker,toonify:toon.toonify,sound:trailSound,auto:{get:()=>!!st.auto,set:v=>{st.auto=!!v;updateUI();}},
  env:()=>({season:seasons.season,hour:parseInt(lighting.environment?.info?.timeLabel??envInfo.timeLabel??'',10)}),
  height:animalHeight,sites:[],zones:namsanAnimalZones(G).map(z=>({...z,minOffset:NAMSAN_ANIMAL_MIN_OFFSET})),measure,halfWidth:L.halfWidth,lanes,treeNear});
 trail.height=animalHeight;
 installTrailHud(document,window,{snack:false});   // 고양이 쓰다듬기 칩·들르기(초콜릿 줄 없음)
 window.namsan.trail=trail;window.namsan.animals=()=>trail.status().animals;window.namsan.spawns=()=>trail.spawns();window.namsan.trailSound=()=>trailSound.snapshot();window.namsan.animalLanes=L;   // 점검용(scripts/namsan/verify-namsan-animals.mjs)
}

// ── 지도(공통 조각 #route-map: 남은 길 #map-path·걸은 길 #map-walked·나 #map-dot·스탬프 목록 #checkpoints) ──
const mapP=(()=>{const P=G.points,xs=P.map(p=>p.x),zs=P.map(p=>p.z),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),k=Math.min(250/(x1-x0),250/(z1-z0));return p=>({x:160+(p.x-(x0+x1)/2)*k,y:150+(p.z-(z0+z1)/2)*k});})();
const mapD=pts=>pts.map((p,i)=>{const m=mapP(p);return `${i?'L':'M'}${m.x.toFixed(1)} ${m.y.toFixed(1)}`;}).join(' ');
$('#map-path')?.setAttribute('d',mapD(G.points));
{const svg=$('#route-map'),tw=mapP(NAMSAN.tower);if(svg){const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('aria-hidden','true');
 g.innerHTML=`<circle cx="${tw.x.toFixed(1)}" cy="${tw.y.toFixed(1)}" r="6" fill="#e9e1cf" stroke="#3a2b22"/>`+NAMSAN.stamps.map(t=>{const m=mapP(courseAt(G.points,t.s));return `<text x="${(m.x+8).toFixed(1)}" y="${(m.y+5).toFixed(1)}" font-size="13" font-weight="900" fill="#7a6650">${t.glyph}</text>`;}).join('');
 svg.insertBefore(g,$('#map-dot'));}}
let walkedBest=-1;
const mapShown=()=>!!window.hikingFrame?.isOpen&&window.hikingFrame.tab==='map';
function drawMap(force=false){if(!mapShown()&&!force)return;const m=mapP(st);$('#map-dot')?.setAttribute('cx',m.x.toFixed(1));$('#map-dot')?.setAttribute('cy',m.y.toFixed(1));
 if(Math.abs(st.best-walkedBest)>=1||force){walkedBest=st.best;$('#map-walked')?.setAttribute('d',mapD(G.points.filter(p=>p.s<=st.best))||'M0 0');}}
addEventListener('uf:tab',e=>{if(e.detail?.id==='map')drawMap(true);});
// 출발 위치: 백범광장(처음부터) · 정상 앞(?start=summit, 완등 기록 안 함). 관악산과 같이 진행 기록은 새로 시작한다
$('#start-entrance').onclick=()=>{try{localStorage.setItem(N.saveKey,N.serialize(N.initialState()));}catch{}const u=new URL(location.href);u.searchParams.delete('start');location.replace(u.href);};
$('#start-demo').onclick=()=>{const u=new URL(location.href);u.searchParams.set('start','summit');location.replace(u.href);};

// ── 정상 도착(공통 정상 창 #summit: 도장 글은 남산 정의 text, 완등 기록 카드 단추는 features.summitCard=false로 숨김) ──
function showSummit(){
 let r=null;if(!multiMode&&!shortcut)try{r=recordSummit(localStorage,M.summitId,{date:seoulClock(Date.now()).date,sec:st.elapsed});window.dispatchEvent(new CustomEvent('hiking:summit-record',{detail:{id:M.summitId,record:r}}));}catch{}
 if(!r)r=summitOf(loadSummits(globalThis.localStorage),M.summitId);
 const mm=Math.floor(st.elapsed/60),ss=Math.round(st.elapsed%60);
 $('#summit-summary').textContent=`${shortcut?'구간 이동이나 버스로 온 등산이라 기록에는 넣지 않았어요. ':`걸은 시간 ${mm}분 ${ss}초 · ${Math.round(st.distance)}m · 오른 높이 ${Math.round(st.ascent)}m. `}스탬프 ${st.stamps.length} / ${NAMSAN.stamps.length} · 전망탑 둘레를 걸으며 서울을 둘러보세요. 남쪽 멀리 관악산이 보여요.${r?.count>1?` (남산 완등 ${r.count}번째)`:''}`;
 if(!$('#summit').open)$('#summit').showModal();
}
const dialogOpen=()=>!!document.querySelector('dialog[open]');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$('#lock').onclick=()=>{try{const p=$('#world').requestPointerLock();p?.catch(()=>{});$('#help').close();}catch{}};

// ── 조작(관악산 main.js command와 같은 이름) ──
let sendJump=false;
function command(id,value){
 if(!window.namsan.started)return;
 if(dialogOpen()&&!['map-toggle','help-toggle'].includes(id))return;
 if(tower.elev){if(['interact','escape','auto','bus-skip','tower-skip'].includes(id))skipElevator();return;}   // 엘리베이터 연출 중엔 건너뛰기만(F·Esc·R·단추)
 if(id==='tower-exit'){if(tower.inside)exitTower();return;}
 // 상호작용(F·1·2·3·안내판 닫기·쪽 넘기기·이름표)이 먼저. 처리했으면 끝. 버스 안에서는 큰 단추(F) = 건너뛰기
 if(ride&&(id==='interact'||id==='bus-skip'||id==='auto')){alight(ride.to,true);return;}
 if(ix&&['interact','choice-1','choice-2','choice-3','panel-close','page-prev','page-next',...(gs.gadget!=='none'?['labels-toggle']:[])].includes(id)&&ix.handle(id))return;
 if(id==='interact'&&!seat&&gs.gadget==='none'&&trail?.interact())return;   // F = 동물 칩(고양이 쓰다듬기·들르기)을 누른 것과 같게(관악산 칩 단추와 같은 동작)
 if(id==='binoculars'){ixUI.closeBoard();ix?.cancel('쌍안경을 들었어요');setGadget(gs,'binoculars');st.auto=false;syncView();if(gs.gadget!=='none'){input.clear?.();ixUI.toast('쌍안경 · 둘러보면 명소 이름표가 보여요');}return;}
 if(id==='phone'){ixUI.closeBoard();ix?.cancel('휴대폰을 들었어요');setGadget(gs,'phone');st.auto=false;syncView();if(gs.gadget!=='none')input.clear?.();return;}
 if(id==='gadget-off'){if(closeGadget(gs))syncView();return;}
 if(id==='zoom-in'||id==='zoom-out'){if(gs.gadget!=='none'){zoomStep(gs,id==='zoom-in'?1:-1);updateUI();}return;}
 if(id==='phone-zoom'){setPhoneZoom(gs,Number(value));updateUI();return;}
 if(id==='selfie'){toggleSelfie(gs);updateUI();return;}
 if(id==='shutter'){if(gs.gadget==='phone')photoRequested=true;return;}
 if(gs.gadget!=='none'&&(id==='auto'||id==='view'))return;
 if(id==='bus-skip')return;
 if(ride&&['binoculars','phone','sit','tea','interact'].includes(id))return;
 if(id==='sit'){if(seat)standUp();else{const c=ix?.cands.find(c=>c.action==='bench'&&Math.hypot(c.x-st.x,c.z-st.z)<=NS_BENCH.reach);if(c)sitBench(c);else ixUI.toast('정상 벤치 앞에서 앉을 수 있어요');}updateUI();return;}
 if(id==='tea'){if(seat&&seat.pose==='sit'&&hiker.interaction?.sitLinear>=.99){seat.pose='tea';seat.teaT=0;}else if(!seat)ixUI.toast('벤치에 앉으면 차를 마실 수 있어요');updateUI();return;}
 if(id==='auto'){if(st.done&&!tower.inside){ixUI.toast('정상이에요 · 조이스틱으로 광장을 둘러보세요');return;}if(seat)standUp();st.auto=!st.auto;}
 else if(id==='stop-auto')st.auto=false;
 else if(id==='view'){if(!viewLocked(gs))gs.view=gs.view==='third'?'first':'third';syncView();}
 else if(id==='face-forward')faceForward(look);
 else if(id==='hud-toggle'){window.dispatchEvent(new CustomEvent('hiking:hud-toggle'));return;}
 else if(id==='escape'){if(!lockCard.hidden)closeLockCard();else if(gs.gadget!=='none'){closeGadget(gs);syncView();}else if(ix?.handle('panel-close'));else frame?.close();}
 else if(id==='map-toggle'){frame?.toggle('map');return;}
 else if(id==='help-toggle'){const d=$('#help');if(d.open)d.close();else{st.auto=false;input.clear();d.showModal();}}
 else if(id==='stamps-toggle'||id==='card-open'){frame?.toggle('map');return;}   // 남산 스탬프 4곳은 지도 탭에(features.book=false)
 else if(id==='interact'||id==='emote-menu')multi?.greetKey?.();   // F·X = 앞사람에게 인사(관악산과 같은 키)
 else if(id==='labels-toggle'){if(!multi){ixUI.toast('이름표는 함께 걷기 중에 보여요');return;}const on=!multi.tagsOn;multi.setTags(on);ixUI.toast(on?'이름표 켜짐':'이름표 꺼짐');}   // N·함께 걷기 판 「이름표」(관악산 interaction-controller와 같은 문구)
 save();updateUI();
}
for(const id of ['auto','view','face-forward','map-toggle','help-toggle','binoculars','phone','sit','tea'])$(`#${id}`)?.addEventListener('click',e=>{command(id);e.currentTarget.blur();});
$('#stamps')?.addEventListener('click',()=>command('stamps-toggle'));
const input=bindInput(command,(dx,dy)=>{const k=1/Math.max(1,viewZoom(gs));turnLook(look,dx*k,dy*k);},dz=>{if(gs.gadget!=='none'&&view==='first'){zoomBy(gs,dz);updateUI();return;}if(view==='third')look.orbit=THREE.MathUtils.clamp(look.orbit+dz,2.2,12);},{mode:()=>window.namsan.started?gs.gadget:'none',interact:()=>!!ix?.active()||ixUI.boardOpen||!!multi?.greet?.().target||!!trail?.chipActive(),panel:()=>!!window.hikingFrame?.isOpen||ixUI.boardPages>1});
// 인사 칩·이름표 카드·수첩 HUD(도장·상황 꼬리표·시트)는 'hiking:command'로 보낸다(관악산 main.js와 같은 길)
window.addEventListener('hiking:command',e=>command(e.detail?.id,e.detail?.value));
// 설정 탭 맨 아래 「다른 산 고르기」(남산 페이지만, 11-19 남산 설정 판에 있던 것)
{const grid=$('#nb-sheet-settings .nb-grid'),b=document.createElement('button');b.type='button';b.className='nb-it';b.dataset.ns='pick';
 b.innerHTML='<em aria-hidden="true">⛰</em><span>다른 산 고르기</span><small>관악산·남산 고르기 화면</small>';
 b.addEventListener('click',()=>location.assign(new URL('../'+location.search.replace(/([?&])(multi|start)=[^&]*&?/g,'$1').replace(/[?&]$/,''),location.href).href));
 grid?.insertBefore(b,grid.querySelector('[data-dev-slot]'));}
// 상호작용 화면(관악산 interaction-ui: 안내판·알림·행동 진행·쌍안경 이름표·15m 점). 도장·상황 꼬리표 줄은 수첩 HUD가 그린다('hiking:interact-view')
const ixUI=mountInteractionUI();
let ix=null;

// ── 함께 걷기(공용 multi-client, 방은 남산 방). 서버 코드·서버 목록은 그대로 ──
let multi=null,multiBusy=Promise.resolve();
const multiServer=()=>hikingServerUrl();
const multiStatus=detail=>window.dispatchEvent(new CustomEvent('hiking:multi-status',{detail}));
const multiLocal={nudge:()=>false,here:()=>null,sample:null,minS:0,maxS:0,
 walk:()=>({auto:!!st.auto,moving,steering:false,base:speed}),
 position:()=>tower.inside?{zone:'summit',x:st.x,y:deckPlan.y,z:st.z,heading:st.heading}:N.position(st),   // 전망대 안 = 구역 'summit'(서버 그대로 0~2), 받는 쪽이 전망대 바닥에 그림
 setPosition:pos=>tower.inside||tower.elev?false:N.setPeerPosition(st,pos),
 speed:()=>speed,sit:()=>!!seat||!!ride,run:()=>!!st.running,gadget:()=>gs.gadget,selfie:()=>selfieActive(gs),busy:()=>!!trail?.busy(),place:()=>null,
 act:()=>({pose:ride?'sit':seat?seat.pose:'stand',gadget:gs.gadget,selfie:selfieActive(gs),trail:trail?.acts.active?{name:trail.acts.active.name,state:trail.acts.active.state,reps:trail.acts.active.reps??0}:null,action:ride?{id:'bus'}:ix?.action?{id:ix.action.id}:null}),
 // 고양이에게 걸어간 동안 몸이 실제로 있는 자리(관악산 main.js와 같음)
 shown:()=>{const tp=trail?.override();return tp?{...N.position(st),x:tp.position[0],z:tp.position[2],heading:tp.heading}:null;},propFor:(act,x,z)=>trail?.propFor?.(act,x,z)??null};
joinMulti=({room=null,name=null}={})=>{multiBusy=multiBusy.then(async()=>{
 if(!window.namsan.ready)return;   // 화면 준비 뒤 pendingJoin으로 다시 부른다
 if(multi&&room===multi.room)return;if(multi)leaveMultiNow();
 const r=isNamsanRoom(room)?room:namsanRoom();
 multiStatus({state:'connecting',room:r,count:0,transport:multiServer()?'server':'local'});
 const {mountMultiplayer}=await import('../multi-client.js');
 multi=await mountMultiplayer({scene,camera,night,hikerUrl,prepareGltf:prepareToonHikerGltf,groundHeight:(x,z,zone)=>zone==='summit'&&inTowerXZ(TW,x,z)?deckPlan.y:remoteLift(x,z)??heightAt(G,x,z),command,room:r,name,serverUrl:multiServer(),local:multiLocal,toonify:toon.toonify});
 lockBoard?.attach(multi);   // 남산 자물쇠: 서버면 목록 받기(lk-list)
 window.hiking.multiApi=multi;
}).catch(e=>{console.warn('함께 걷기 참가 실패',e);multiStatus({state:'offline',room:room||'',count:0,transport:multiServer()?'server':'local'});});return multiBusy;};
function leaveMultiNow(){if(!multi)return;lockBoard?.detach();multi.dispose();multi=null;window.hiking.multiApi=null;}
function leaveMulti(){multiBusy=multiBusy.then(()=>leaveMultiNow());}
window.hiking.multi=()=>multi?.info()??null;
window.addEventListener('hiking:multi-join',e=>{const d=e.detail??{};joinMulti({room:d.room,name:d.name});});
window.addEventListener('hiking:multi-leave',()=>leaveMulti());
// 함께 걷기 HUD 세 가지(입구·채팅·같이 등산하기)는 공통 본체 부품으로(관악산과 같음). 입장 창은 남산 서버 한 줄
installMultiHud({serverUrl:multiServer(),serverPick:()=>namsanPick(),servers:NAMSAN_SERVERS,frame:()=>window.hikingFrame,statusNow:()=>multi?.statusNow()});

// ── 휴대폰 카메라(관악산 main.js와 같은 규칙): 렌더 직후 같은 프레임에서 3D 캔버스를 PNG로 받는다(HUD·휴대폰 테두리는 빠짐) ──
let photoRequested=false;
function takePhoto(){
 let url=null;try{const src=renderer.domElement,crop=viewfinderCrop(src);if(crop){const c=document.createElement('canvas');c.width=crop.sw;c.height=crop.sh;c.getContext('2d').drawImage(src,crop.sx,crop.sy,c.width,c.height,0,0,c.width,c.height);url=c.toDataURL('image/png');}else url=src.toDataURL('image/png');}catch(e){console.warn('촬영',e);}
 const filename=photoFilename(new Date(),'남산');if(url){const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();}
 playShutter();const flash=document.createElement('div');flash.className='shutter-flash';document.body.append(flash);setTimeout(()=>flash.remove(),260);
 window.namsan.lastPhoto={filename,selfie:!!gs.phone.selfie,zoom:gs.phone.zoom,bytes:url?Math.round(url.length*.75):0};
 window.dispatchEvent(new CustomEvent('hiking:photo',{detail:{...window.namsan.lastPhoto}}));
}
function playShutter(){
 const audio=sound.audio,ctx=audio.context;if(!ctx||!audio.enabled)return;
 try{const t=ctx.currentTime,len=Math.floor(ctx.sampleRate*.05),buffer=ctx.createBuffer(1,len,ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.18));
  for(const [at,gain] of [[0,.5],[.075,.35]]){const src=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1800;src.buffer=buffer;g.gain.value=gain;src.connect(f).connect(g).connect(audio.master??ctx.destination);src.start(t+at);}}catch{}
}
// 화면을 짧게 눌러도 촬영(관악산과 같음)
{let down=null;$('#world').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};});$('#world').addEventListener('pointerup',e=>{if(down&&gs.gadget==='phone'&&!document.pointerLockElement&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&performance.now()-down.t<500)command('shutter');down=null;});}
// ── 매 프레임 ──
const fwd=new THREE.Vector3(),lookGoal=new THREE.Vector3(),camGoal=new THREE.Vector3(),_tw=new THREE.Vector3();
let prevAuto=st.auto,t0=performance.now(),last=performance.now(),saveAt=0,uiAt=0,first=true,cameraReady=false,stairsNow=false,fpsN=0,fpsSum=0,fpsWin=performance.now(),metrics=null;
const nightK=()=>lighting.environment?.current?.night??0;
function frame_(now){
 requestAnimationFrame(frame_);
 const dtRaw=Math.min(.1,(now-last)/1000);last=now;const started=window.namsan.started,dt=started?dtRaw:0;
 const cmd=started?input.read():{forward:0,side:0,run:false,turn:0};
 if(lockBoard?.reading&&(cmd.forward||cmd.side||st.auto))lockBoard.close();   // 읽기 카드는 움직이면 닫힘(시안 v2 ②), 걸기 카드는 이동을 멈춤
 if(multi?.frozen||dialogOpen()||lockBoard?.mode==='hang'||tower.elev)Object.assign(cmd,{forward:0,side:0,run:false,turn:0});
 elevatorFrame(dtRaw);
 const trailMove=!!(cmd.forward||cmd.side),tp=ride?null:trail?.override()??null;if(tp||trail?.busy())Object.assign(cmd,{forward:0,side:0,run:false,turn:0});   // 고양이에게 들른 동안은 trail-world가 몸을 옮긴다(걷기 입력은 그만두기로 받는다, 관악산과 같음)
 busFrame(dtRaw,cmd);
 if(seat&&(cmd.forward||cmd.side)){standUp();}            // 앉아 있다가 걸으면 일어난다(관악산 앉기와 같음)
 if(ride||seat)Object.assign(cmd,{forward:0,side:0,run:false});
 if(gs.gadget!=='none')Object.assign(cmd,{forward:0,side:0,run:false});   // 쌍안경·휴대폰을 든 동안은 제자리에서 둘러보기
 updateLook(look,dtRaw,cmd.turn);
 const direct=!!(cmd.forward||cmd.side);
 // 직접 걷기는 카메라가 보는 쪽 기준(관악산 광장과 같음), 자동 걷기는 카메라가 걷는 방향을 천천히 따라 돈다
 if(direct){st.heading=wrapAngle(camBase+look.yaw);camBase=st.heading;look.yaw=0;}
 const r=tower.inside?{stairs:false,stamp:null,summit:false,...deckWalk(st,TW,{forward:cmd.forward,side:cmd.side,yaw:st.heading,run:cmd.run},dt,{blocks:deckBlocks})}:N.walk(st,{forward:cmd.forward,side:cmd.side,yaw:st.heading,run:cmd.run,auto:st.auto},dt);   // 전망대 안 = 고리 걷기(자동 걷기는 유리창 따라 한 바퀴)
 speed=r.speed;moving=r.moved>1e-5;stairsNow=r.stairs;
 if(!direct&&st.auto){const d=wrapAngle(st.heading-camBase);camBase=wrapAngle(camBase+d*Math.min(1,dtRaw*2.2));}
 if(started){st.elapsed+=dtRaw;}
 if(r.stamp){const t=NAMSAN.stamps.find(x=>x.n===r.stamp);ixUI.toast(`${t.glyph} 스탬프 ${st.stamps.length} / ${NAMSAN.stamps.length} · ${t.name}`,{ms:3200});soundFx.play('stamp');drawMap();}
 if(r.summit){showSummit();save();}
 if(st.auto!==prevAuto){prevAuto=st.auto;updateUI();}
 const y=tp?tp.position[1]:myY(),heading=camBase+look.yaw,px=tp?tp.position[0]:st.x,pz=tp?tp.position[2]:st.z;
 if(!ride)avatar.position.set(px,y,pz);
 avatar.visible=view==='third'||selfieActive(gs);   // 1인칭은 내 몸을 숨긴다(관악산 main.js와 같음 — 안 숨기면 카메라가 머리 속이라 화면이 까맣게 보임)
 if(first){hiker.snapTo(st.heading);first=false;}
 else if(seat){if(!seat.snapped){hiker.snapTo(seat.heading);seat.snapped=true;}}
 else if(tp){if(tp.snap)hiker.snapTo(tp.heading);else hiker.turnTo(tp.heading,dtRaw);}
 else if(moving)hiker.turnTo(direct?heading:r.heading,dtRaw);
 const k=courseAt(G.points,st.s),slope=moving&&!tower.inside?(()=>{const a=courseAt(G.points,st.s-1.5),b=courseAt(G.points,st.s+1.5);return (b.y-a.y)/3*Math.sign(Math.cos(r.heading-k.heading));})():0;
 // 남산 계단은 넓은 단이라 보폭 = 한 단 폭 쪽(stairGait, 걷는 속도와 같은 셈)
 const gait=stairsNow?{stride:stairGait(G,st.s,slope,slope<0?-1:1).stride}:gaitFor(slope,'paved',slope<0?-1:1),stepLength=gait.stride*strideScaleFor(hiker.strideScale,!!st.running,stairsNow);
 walkPhase+=r.moved/Math.max(.1,stepLength)*(cmd.forward<0?-1:1);if(tp)walkPhase=tp.phase;
 // 발소리(관악산과 같은 소리 파일·규칙): 한 걸음마다 'hiking:step'. 계단 = 돌계단 소리, 그 밖 = 돌길(포장)
 if(started&&moving){stepPhase+=r.moved/Math.max(.1,stepLength);while(stepPhase>=1){stepPhase-=1;stepCount++;window.dispatchEvent(new CustomEvent('hiking:step',{detail:{step:stepCount,material:stairsNow?'stairs':'paved',slope:Math.abs(slope),s:st.s,zone:'route',position:[st.x,y,st.z],distance:st.distance,elapsed:st.elapsed}}));}}
 const surface=tp?trail.height:tower.inside?()=>deckPlan.y:(x,z)=>heightAt(G,x,z);
 if(ix){ix.update(dtRaw,{moving:direct,started});const res=ix.result;if(res&&res!==lastResult){lastResult=res;if(res.id==='cairn')paintStones();}}
 if(gs.gadget!=='none'&&!direct)hiker.turnTo(heading,dtRaw);   // 쌍안경을 든 동안은 몸이 보는 방향을 따른다(관악산과 같음)
 if(seat){const sp=seat;if(sp.pose==='tea'){sp.teaT+=dtRaw;if(sp.teaT>=3){sp.pose='sit';updateUI();}}avatar.position.set(sp.x,sp.y,sp.z);}
 if(!ride)hiker.update({clip:tp?(tp.moving?'Walk':'Idle'):!moving?'Idle':slope>.15?'Climb':'Walk',distance:walkPhase,stride:1,stepLength,stairs:stairsNow,idleSeconds:now/1000,slope,pose:seat?seat.pose:'stand',teaProgress:seat?.pose==='tea'?Math.min(1,seat.teaT/3):0,running:!!st.running,speed,dt:dtRaw,surfaceHeight:surface,gadget:gs.gadget,selfie:selfieActive(gs),lookYaw:wrapAngle(heading-avatar.rotation.y),lookPitch:look.pitch});
 if(!ride){hiker.ground({moving:moving||!!tp?.moving,phase:walkPhase,surfaceHeight:seat?()=>seat.y:surface,pose:seat?seat.pose:'stand'});}
 // 동물(관악산 main.js와 같은 순서: 땅 디딤 뒤 update·afterGround). 버스 안에서는 탄 자리 기준
 if(trail&&!tower.inside&&!tower.elev){const at=ride?avatar.getWorldPosition(_tw).toArray():[px,y,pz],mv=moving||!!tp?.moving;trail.update(dt,{position:at,moving:mv,speed,input:trailMove});trail.afterGround(dt,{moving:mv});}
 if(!ride)multi?.afterLocalGround(hiker,null,now/1000);
 // 카메라(관악산 main.js와 같은 식): 3인칭은 동동이 뒤·위, 1인칭은 눈높이. 땅 밑으로 들어가지 않게 지형 위 0.5m로 올린다
 const smoothY=followHeight(camFollow,y,cameraReady?dtRaw:0);
 fwd.set(-Math.sin(heading),0,-Math.cos(heading));
 if(view==='first'){camGoal.set(px,smoothY+hiker.eyeHeight-(ix?.drop??0),pz);lookGoal.copy(camGoal).addScaledVector(fwd,10);lookGoal.y+=Math.tan(THREE.MathUtils.clamp(look.pitch+(hiker.viewPitch??0)+(ix?.pitch??0),-1.3,1.3))*10;camera.position.copy(camGoal);}
 else{const cs=hiker.profile?.cameraScale??1;lookGoal.set(px,smoothY+(1.15-(1.6-hiker.eyeHeight)*2/3),pz);
  {const ease=1-Math.exp(-dtRaw*3);actCamK+=((ix?.action&&(ix.action.id==='drink'||ix.action.id==='dip')?1:0)-actCamK)*ease;seatCamK+=((seat&&innerHeight>innerWidth?1:0)-seatCamK)*ease;}
  const ca=heading+ACT_CAM.yaw*actCamK,cf=_camBack.set(-Math.sin(ca),0,-Math.cos(ca));
  lookGoal.addScaledVector(fwd,ACT_CAM.ahead*actCamK);
  camGoal.copy(lookGoal).addScaledVector(cf,-(look.orbit*cs*Math.cos(look.pitch)+SEAT_CAM.back*seatCamK));camGoal.y+=cs*(1-look.orbit*Math.sin(look.pitch))+SEAT_CAM.up*seatCamK;
  lookGoal.addScaledVector(fwd,SEAT_CAM.ahead*seatCamK);lookGoal.y+=SEAT_CAM.lift*seatCamK;
  const gy=G.ground(camGoal.x,camGoal.z)+.5;if(camGoal.y<gy)camGoal.y=gy;camera.position.copy(camGoal);}
 if(selfieActive(gs)){const lens=hiker.phoneCamera?.(true);if(lens?.visible){camera.position.copy(lens.position);lookGoal.copy(lens.position).add(lens.direction);}else{camera.position.fromArray(selfiePosition([px,smoothY+hiker.eyeHeight,pz],heading,look.pitch));lookGoal.set(px,smoothY+hiker.eyeHeight-.04,pz);}}   // 셀카(관악산과 같음): 손에 든 휴대폰 앞면 렌즈
 if(ride)rideCamera(dtRaw);else lockCamera(dtRaw);
 if(tower.inside&&view==='third'&&!selfieActive(gs))clampDeckCamera(dtRaw);   // 1인칭·셀카는 눈·손 자리라 그대로
 {const co=window.namsan.cameraOverride;if(co){camera.position.fromArray(co.p);lookGoal.fromArray(co.t);}}
 camera.lookAt(lookGoal);cameraReady=true;
 trail?.afterCamera();   // 말풍선·고양이 칩은 이번 프레임 카메라로 자리를 잡는다
 soundFrame(dtRaw);
  easeCameraZoom(camera,viewZoom(gs),dtRaw);   // 쌍안경 배율(공통 본체 부품, 관악산과 같음)
 landscape.update(camera,quality);ns.update(now/1000,nightK(),camera,quality);ia.userData.update(now/1000,nightK(),camera);towerEntry.userData.update(nightK());if(deckArt.visible)deckArt.userData.update(nightK());
 night.update(dtRaw,{camera,avatar,view,selfie:selfieActive(gs),zone:'route',s:st.s,hiker});
 if(multi)multi.update(dtRaw,now/1000,view);lockBoard?.tick();
 if(!ctxRecovery.lost)lighting.render(avatar.position);
 if(photoRequested){photoRequested=false;takePhoto();}
 if(now-uiAt>150){uiAt=now;updateUI();}
 paintRows();document.body.classList.toggle('ns-acting',!!ix?.action);
 if(started&&now-saveAt>1000){saveAt=now;save();}
 if(!document.hidden&&dtRaw>0){fpsN++;fpsSum+=dtRaw;}
 if(!loadReady){const ok=stability.sample(dtRaw*1000,false);loading.set('stabilizing',Math.min(.99,stability.fraction));if(ok){loadReady=true;loading.ready();beginHike();}}
 if(now-fpsWin>3000){metrics={fps:fpsN/Math.max(1e-3,fpsSum),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries};fpsN=fpsSum=0;fpsWin=now;}
 if(adaptive.sample(dtRaw*1000,!document.hidden&&cameraReady,now-t0,lighting.status?.ao))resize();
}
// ── 공통 수첩 HUD로 보내기: 'hiking:state'(관악산 main.js updateUI와 같은 약속) + 진행 카드 글 ──
const set=(sel,v,html=false)=>{const el=$(sel);if(el&&(html?el.innerHTML:el.textContent)!==v){if(html)el.innerHTML=v;else el.textContent=v;}};
function updateUI(){
 const remain=remainOf(G,st),inSummit=Math.hypot(st.x-G.plaza.x,st.z-G.plaza.z)<=G.plaza.r,pose=ride?'sit':seat?seat.pose:'stand';
 window.dispatchEvent(new CustomEvent('hiking:state',{detail:{started:window.namsan.started,view,gadget:gs.gadget,phone:{...gs.phone},binoculars:{...gs.binoculars},viewZoom:viewZoom(gs),
  pose,auto:!!st.auto,running:!!st.running,speed,stamina:100,teaReady:!!seat&&seat.pose==='sit'&&hiker.interaction?.sitLinear>=.99,teaRemaining:seat?.pose==='tea'?Math.max(0,3-seat.teaT):0,
  zone:inSummit?'summit':'route',plaza:null,offTrail:false,courseDistance:st.best,courseLength:END,checkpoints:st.stamps.map(n=>`ns-${n}`),mountain:M.id,riding:!!ride,waiting:!!wait}}));
 // 진행 카드·기본 단추(공통 본체 부품 paintHikeCard, 관악산과 같은 자리·모양). 남산은 휴대폰 카메라 없음
 paintHikeCard({status:tower.elev?'엘리베이터 타는 중':tower.inside?'전망대 구경 중':ride?'버스 타는 중':pose==='tea'?'차 마시는 중':pose==='sit'?'앉아서 쉬는 중':st.running?'달리는 중':moving?'걷는 중':'서 있음',
  progress:Math.min(1,st.best/END),done:Math.round(Math.min(st.best,END)),total:Math.round(END),remaining:st.done?'도착':formatRemainKm(remain),altitude:myY(),elapsed:st.elapsed,speed,
  etaMin:Math.ceil(remain/END*M.etaMin),surface:tower.inside?'전망대':inSummit?'정상 광장':stairsNow?'돌계단':'포장 길',quality:qualityText(),auto:st.auto,gadget:gs.gadget,gadgets:['binoculars','phone'],view,viewLocked:viewLocked(gs)});
 set('#checkpoints',NAMSAN.stamps.map(t=>`<div>${st.stamps.includes(t.n)?'●':'○'} ${t.glyph} ${t.name}</div>`).join(''),true);
 document.body.classList.toggle('ns-riding',!!ride);document.body.classList.toggle('ns-deck',tower.inside&&!tower.elev);
 drawMap();
}
// 할 일 줄 → 수첩 HUD 도장·상황 꼬리표('hiking:interact-view', 관악산 interaction-ui와 같은 모양). 버스 안 = 건너뛰기 한 줄, 쌍안경·자물쇠 카드 중엔 없음
let rowSig='';
function paintRows(){
 const rows=ride?[{key:'R',label:'건너뛰기',sub:'바로 내리기',state:'ready'}]:gs.gadget==='none'&&lockCard.hidden&&!seat?ix?.view?.rows??null:null;
 const sig=rows?.length?JSON.stringify(rows):'';if(sig===rowSig)return;rowSig=sig;
 window.dispatchEvent(new CustomEvent('hiking:interact-view',{detail:rows?.length?{rows,where:'world'}:null}));
}

window.namsan.status=()=>({started:window.namsan.started,x:st.x,z:st.z,y:myY(),inside:tower.inside,s:st.s,best:st.best,auto:st.auto,done:st.done,stamps:[...st.stamps],elapsed:st.elapsed,view,speed,stairs:stairsNow,
 multi:multi?.info()??null,metrics,gadget:gs.gadget,zoom:camera.zoom,interact:ix?{view:ix.view,action:ix.action,result:ix.result,progress:JSON.parse(JSON.stringify(ix.progress)),bino:ix.bino?{bearing:ix.bino.bearing,labels:ix.bino.labels.map(l=>l.name),focus:ix.bino.focus?.name??null,note:ix.bino.note}:null}:null,memory:performance.memory?{usedMB:Math.round(performance.memory.usedJSHeapSize/1048576)}:null,summitOpen:!!$('#summit')?.open,course:G.points.at(-1).s});
window.namsan.lampStats=()=>ns.lamps?.userData.count??null;window.namsan.lampsVisible=v=>{if(ns.lamps)ns.lamps.visible=!!v;}; // 점검용: 가로등 그림 켜고 끄기(성능 비교)
window.namsan.jump=s=>{jumpTo(G,st,s);shortcut=true;camBase=st.heading;look.yaw=0;return window.namsan.status();};
window.namsan.setAuto=on=>{st.auto=!!on;updateUI();return st.auto;};
// 점검용: 걷는 곳(x,z)에 서서 heading(라디안, 관악산 기준) 쪽을 봄. 걷는 곳이 아니면 false
window.namsan.goTo=(x,z,heading=null)=>{const ok=N.setPosition(st,{x,z,heading:heading??st.heading});if(ok){camBase=st.heading;look.yaw=0;look.pitch=0;}return ok;};
window.namsan.spots=()=>({spots:ia.userData.spots.map(({id,kind,action,x,y,z,face,radius})=>({id,kind,action,x,y,z,face,radius})),items:nsItems.map(({kind,n,x,z,y})=>({kind,n,x,z,y})),benches:nsBenches.map(({x,y,z,yaw})=>({x,y,z,yaw})),pads:G.walkPads});
window.namsan.multi=()=>multi?.info()??null;
window.namsan.audio=()=>({...sound.audio.snapshot(),ambient:sound.ambient?.snapshot()??null,bus:busSound?.snapshot()??null});   // 발소리(관악산 hiking.audio와 같은 값) + 환경음·버스 소리(11-21)
window.namsan.memory=()=>sceneMemory({scene,renderer,lighting,Vector2:THREE.Vector2});   // 장면 메모리 어림(관악산 hiking.memory()와 같은 셈, 7단계 휴대폰 메모리 측정용)   // 점검용: 발소리 받은 수·버린 이유(관악산 hiking.audio와 같은 값)
// ── 상호작용 컨트롤러(namsan-interact.js) ──
let envInfo={};window.addEventListener('hiking:environment',e=>{envInfo=e.detail||{};});
const _v=new THREE.Vector3();
const projectWorld=(x,y,z)=>{_v.set(x,y,z).project(camera);return {x:(_v.x+1)/2*innerWidth,y:(1-_v.y)/2*innerHeight,visible:_v.z<1&&Math.abs(_v.x)<1.1&&Math.abs(_v.y)<1.1};};
const projectDir=(bearing,elevDeg)=>{const b=bearing*Math.PI/180,e=elevDeg*Math.PI/180;return projectWorld(camera.position.x+Math.sin(b)*Math.cos(e)*1000,camera.position.y+Math.sin(e)*1000,camera.position.z-Math.cos(b)*Math.cos(e)*1000);};
const nsPlayer=()=>{const pl=placeOfMe();return {x:st.x,z:st.z,heading:camBase+look.yaw,elevation:myY(),inSummit:pl.inSummit,floor:tower.inside?'deck':'ground',busy:dialogOpen()||!lockCard.hidden||!!seat||!!ride||!!tower.elev};};
const placeOfMe=()=>({inSummit:Math.hypot(st.x-G.plaza.x,st.z-G.plaza.z)<=G.plaza.r});
// 알림은 공통 알림(interaction-ui .ix-toast) 하나로(관악산과 같은 모양·자리). 휴대폰은 안내 글의 키 글자 (T)·(B) 등을 뺀다(11-20 월드디자인 확인 보통 2)
const nsUI=Object.create(ixUI);nsUI.toast=(t,o)=>ixUI.toast(keyless(t),o);
nsUI.openBoard=m=>ixUI.openBoard(mobile?{...m,pages:m.pages.map(pg=>({...pg,body:(pg.body??[]).map(keyless)}))}:m);
let lockBoard=null;
ix=createNamsanInteract({spots:ia.userData.spots,onLock:()=>openLockCard(),onLockRead:()=>{st.auto=false;updateUI();lockBoard?.readNearest();},lockRow:(c,key)=>lockBoard?.rowHang(key)??null,lockReadRow:(c,key)=>lockBoard?.rowRead(key)??null,onBench:c=>sitBench(c),onBus:c=>busPress(c),busRow:(c,key)=>busRowFor(c,key),towerSpots:towerSpots(),onTower:c=>towerPress(c),items:nsItems,benches:nsBenches,busStops:nsBusStops(),player:nsPlayer,ui:nsUI,sound:soundFx,storage:multiMode?null:localStorage,
 stamps:()=>st.stamps,
 addStamp:(n,{quiet=false}={})=>{if(st.stamps.includes(n))return false;st.stamps.push(n);const t=NAMSAN.stamps.find(x=>x.n===n);if(!quiet)ixUI.toast(`${t.glyph} 스탬프 ${st.stamps.length} / ${NAMSAN.stamps.length} · ${t.name}`,{ms:3200});save();drawMap();updateUI();return true;},
 geo:(lat,lon)=>project(lat,lon),projectDir,projectWorld,cameraInfo:()=>({fov:camera.fov,aspect:camera.aspect,zoom:camera.zoom}),
 weather:()=>({kind:envInfo.kind??'clear',label:envInfo.weatherLabel??''}),gadget:()=>gs.gadget,
 summitCount:()=>{try{return summitOf(loadSummits(localStorage),GWANAK_SUMMIT_ID)?.count??0;}catch{return 0;}}});   // 관악산 완등 횟수(쌍안경 「다녀온 산」)
// 내가 올린 돌: 큰 돌탑 꼭대기(그림 spots top)에 관악산 「올릴 돌」을 쌓아 보인다(이 기기 기록 수만큼, 최대 6개)
const cairnTop=ia.userData.spots.find(x=>x.id==='cairn-summit')?.top,myStones=new THREE.Group();myStones.name='내가 올린 돌';scene.add(myStones);
function paintStones(){const n=Math.min(6,ix.progress.stones);if(!cairnTop)return;while(myStones.children.length<n){const k=myStones.children.length,m=looseStone(11+k*7);toon.toonify(m,{kind:'prop'});m.position.set(cairnTop[0]+Math.sin(k*2.4)*.03,cairnTop[1]+.02+k*.055,cairnTop[2]+Math.cos(k*2.4)*.03);m.rotation.y=k*1.3;myStones.add(m);}}
paintStones();let lastResult=null;
// ── 사랑의 자물쇠(11-20 처음, 11-22 서버 영구 저장·한마디·눌러 읽기·신고 — 화면은 namsan-lock-board.js, 서버 server/namsan-locks.mjs) ──
// 그림은 월드아트 ia.userData.locks(setAll·hang·aim·hover·aimView). 가짜 자물쇠 없음: 서버 목록(함께 걷기 서버 연결 때)이나 내 것만 칠한다.
const LK=ia.userData.locks,lockSpot=ia.userData.spots.find(x=>x.action==='lock');
const lockColor=c=>INTERACT_COLORS.locks[c]??INTERACT_COLORS.locks[0];
lockBoard=LK?createLockBoard({LK,colorOf:lockColor,colorNames:NS_LOCKS.colors,max:NS_LOCKS.max,progress:ix.progress,persist:()=>ix.persist(),toast:(t,o)=>nsUI.toast(t,o),
 me:()=>tower.inside?{x:1e6,z:1e6}:{x:st.x,z:st.z},spot:lockSpot,project:projectWorld,canvas:$('#world'),coarse:()=>mobile}):null;
const lockCard=lockBoard?.card??{hidden:true};
const _lp=new THREE.Vector3(),_lt=new THREE.Vector3();let lockCamK=0,lockCamI=-1;
// 걸 자리·읽는 자물쇠가 몸에 가리지 않는 시점(월드아트 aimView 추천 {p,t})으로 0.5초에 걸쳐 옮겨 간다. 끝나면 원래 카메라로 같은 속도로 돌아온다
function lockCamera(dt){const i=lockBoard?.camSlot()??-1,on=!!LK&&i>=0;if(on)lockCamI=i;lockCamK=THREE.MathUtils.clamp(lockCamK+(on?dt:-dt)/.5,0,1);
 if(lockCamK<=0||!LK?.aimView||lockCamI<0)return;const v=LK.aimView(lockCamI,st.x,st.z);if(!v)return;
 const k=lockCamK*lockCamK*(3-2*lockCamK);_lp.fromArray(v.p);_lt.fromArray(v.t);camera.position.lerp(_lp,k);lookGoal.lerp(_lt,k);}
function openLockCard(){if(!lockBoard)return;st.auto=false;updateUI();lockBoard.openHang();}
function closeLockCard(){lockBoard?.close();}
// ── 남산 전망탑 들어가기(11-22): 탑 문 앞 F(할 일 칩) → 엘리베이터 연출(층 표시·흔들림, 건너뛰기) → 실내 전망대. 나가기 = 엘리베이터 앞 칩·위 「나가기」 단추 ──
function myY(){return tower.inside?deckPlan.y:walkHeight(G,st);}
function towerSpots(){const y=deckPlan.y;return [
 {id:'tower-in',action:'tower',x:towerDoor.door.x,z:towerDoor.door.z,y:G.plaza.y,floor:'ground',showRadius:3.2,label:'타워 들어가기',sub:'엘리베이터로 전망대까지'},
 {id:'tower-exit',action:'towerexit',x:deckPlan.exit.x,z:deckPlan.exit.z,y,floor:'deck',showRadius:3.4,label:'엘리베이터로 나가기',sub:'정상 광장 입구로 내려가요'},
 ...deckPlan.scopes.map(sc=>({id:sc.id,action:'scope',x:sc.x,z:sc.z,y,floor:'deck',showRadius:2.4,label:'망원경 보기',sub:`${sc.name.replace(/ \(.*\)/,'')} 쪽 · 들여다보면 명소 이름표가 떠요`,scope:sc}))];}
function towerPress(c){if(ride||tower.elev)return;if(c.action==='tower')enterTower();else if(c.action==='towerexit')exitTower();else if(c.action==='scope')useScope(c.site.scope);}
function startElevator(dir){if(seat)standUp();closeGadget(gs);syncView();ix.reset();lockBoard?.close();st.auto=false;input.clear?.();tower.elev={dir,t:0,swapped:false};elevUI.show(dir);soundFx.play('tick');updateUI();}
function enterTower(){if(tower.inside)return;tower.ret={x:st.x,z:st.z};startElevator('up');}
function exitTower(){if(!tower.inside)return;startElevator('down');}
function skipElevator(){const e=tower.elev;if(!e)return;e.t=Math.max(e.t,elevatorSkipTo(e.dir));}
// 문이 닫힌 동안 자리를 옮긴다(올라가기 = 전망대 엘리베이터 앞, 내려가기 = 탑 문 앞에서 바깥을 봄). 카메라 높이 따라가기는 새로 시작(115m를 미끄러져 오르지 않게)
function swapFloor(dir){
 if(dir==='up'){const a=deckPlan.arrive;tower.inside=true;st.x=a.x;st.z=a.z;st.heading=a.heading;ns.tower.visible=false;deckArt.visible=true;}
 else{tower.inside=false;const o=towerDoor.stand,h=o.heading+Math.PI;N.setPosition(st,{x:o.x,z:o.z,heading:h});st.heading=h;ns.tower.visible=true;deckArt.visible=false;}
 camBase=st.heading;look.yaw=0;look.pitch=dir==='up'?.04:0;camFollow.y=null;cameraReady=false;hiker.snapTo(st.heading);avatar.position.set(st.x,myY(),st.z);sendJump=true;save();updateUI();}
function elevatorFrame(dt){const e=tower.elev;if(!e)return;e.t+=dt;const a=elevatorAt(e.dir,e.t);
 if(a.swap&&!e.swapped){e.swapped=true;swapFloor(e.dir);}
 elevUI.paint(a,e.dir);
 if(a.phase==='done'){tower.elev=null;elevUI.hide();updateUI();nsUI.toast(e.dir==='up'?'전망대예요 · 유리창을 따라 걸어 보세요':'정상 광장으로 내려왔어요',{ms:2600});}}
// 구간 이동 등으로 바로 광장에 돌아갈 때(연출 없이)
function leaveTowerNow(){const e=tower.elev;tower.elev=null;elevUI.hide();if(tower.inside||e?.dir==='up'&&e.swapped)swapFloor('down');else{ns.tower.visible=true;deckArt.visible=false;}}
// 망원경: 망원경 뒤에 서서 그 방향을 보고 쌍안경 화면(배율 최대)으로. 내리기는 쌍안경과 같음(✕·B·Esc)
function useScope(sc){st.x=sc.stand.x;st.z=sc.stand.z;st.heading=sc.stand.heading;camBase=st.heading;look.yaw=0;look.pitch=-.03;hiker.snapTo(st.heading);st.auto=false;
 setGadget(gs,'binoculars');if(gs.gadget==='binoculars'){for(let i=0;i<8;i++)zoomStep(gs,1);syncView();input.clear?.();nsUI.toast(`망원경 · ${sc.name.replace(/ \(.*\)/,'')} 쪽 · 둘러보면 이름표가 보여요`,{ms:3000});}}
// 3인칭 카메라가 유리 밖·기둥 속·천장 위로 나가지 않게(11-22 검수 ①: 예전엔 유리 밖 2.6m까지 나가 창가에서 안쪽을 보면 바닥 끝·지상 숲이 보였다)
// 카메라는 늘 창턱 안쪽(DECK.sill−0.15)·기둥 밖. 뒤가 막히면 동동이 둘레로 최대 100° 돌려 거리가 나는 쪽을 찾고(머리에 붙지 않게),
// 그래도 모자란 거리만큼 위로 올려 내려다본다. 도는 각은 매 프레임 부드럽게 따라가 튀지 않음
const DECK_CAM={rOut:DECK.sill-.15,rIn:DECK.core+.3,want:2.4,maxSwing:100*Math.PI/180,step:7.5*Math.PI/180,ease:6};
const deckCam={ang:0};
function deckCamReach(ax,az,dx,dz,full){const st=.1;let t=0;   // (ax,az)에서 (dx,dz) 방향으로 실내를 벗어나지 않고 갈 수 있는 거리
 for(;t+st<=full;t+=st){const r=Math.hypot(ax+dx*(t+st)-TW.x,az+dz*(t+st)-TW.z);if(r>DECK_CAM.rOut||r<DECK_CAM.rIn)break;}return t;}
function clampDeckCamera(dt){const p=camera.position,a=lookGoal,C=DECK_CAM;
 const ra=Math.hypot(a.x-TW.x,a.z-TW.z);if(ra>C.rOut||ra<C.rIn){deckCam.ang=0;p.y=THREE.MathUtils.clamp(p.y,deckPlan.y+.35,deckPlan.y+DECK.height-.3);return;}
 const hx=p.x-a.x,hz=p.z-a.z,full=Math.hypot(hx,hz);
 if(full>1e-3){const ux=hx/full,uz=hz/full,dirAt=th=>[ux*Math.cos(th)-uz*Math.sin(th),ux*Math.sin(th)+uz*Math.cos(th)];
  const need=Math.min(full,C.want)-.05,side=Math.sign(deckCam.ang)||1;let target=null,best=0,bestTh=0;
  for(let k=0;k*C.step<=C.maxSwing+1e-6&&target==null;k++)for(const s of k?[side,-side]:[1]){const th=s*k*C.step,[dx,dz]=dirAt(th),f=deckCamReach(a.x,a.z,dx,dz,full);
   if(f>=need){target=th;break;}if(f>best+.05){best=f;bestTh=th;}}
  target??=bestTh;deckCam.ang+=(target-deckCam.ang)*(1-Math.exp(-(dt||0)*C.ease));
  const [dx,dz]=dirAt(deckCam.ang),reach=deckCamReach(a.x,a.z,dx,dz,full);
  p.x=a.x+dx*reach;p.z=a.z+dz*reach;p.y+=(1-reach/full)*Math.min(1.8,full*.6);}
 p.y=THREE.MathUtils.clamp(p.y,deckPlan.y+.35,deckPlan.y+DECK.height-.3);}
// 엘리베이터 연출 화면(DOM): 양쪽 문이 닫혔다 열림 · 층 표시(1→5→전망)·층 점·흔들림 · 건너뛰기 단추
const elevUI=(()=>{const el=document.createElement('div');el.className='ns-elev';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','엘리베이터');
 el.innerHTML=`<i class="dr l"></i><i class="dr r"></i><div class="cab"><div class="ind"><b class="ar">▲</b><b class="fl">1</b></div><ol class="dots">${[1,2,3,4,5].map(n=>`<li>${n}</li>`).join('')}<li>전망</li></ol><p class="cap"></p><p class="note">${deckHeightText()}</p></div><button type="button" class="skip">건너뛰기 ⏭</button>`;
 document.body.append(el);const $e=s=>el.querySelector(s),dots=[...el.querySelectorAll('.dots li')];
 $e('.skip').addEventListener('click',e=>{e.stopPropagation();skipElevator();});
 let last='';return {el,show(dir){el.hidden=false;el.dataset.dir=dir;$e('.ar').textContent=dir==='up'?'▲':'▼';$e('.cap').textContent=dir==='up'?'전망대로 올라가요':'정상 광장으로 내려가요';last='';},
  hide(){el.hidden=true;},
  paint(a,dir){el.style.setProperty('--d',a.doors.toFixed(3));const k=a.shake*(.6+.4*Math.sin(performance.now()/37));el.style.setProperty('--sx',`${(k*1.6).toFixed(2)}px`);el.style.setProperty('--sy',`${(k*Math.cos(performance.now()/29)*1.4).toFixed(2)}px`);
   if(a.floor!==last){last=a.floor;$e('.fl').textContent=a.floor;const i=a.floor==='전망'?5:Number(a.floor)-1;dots.forEach((d,j)=>d.classList.toggle('on',j===i));}}};})();
// 전망대 안에서 늘 보이는 「나가기」 단추(HUD 버튼으로도 되게, 대표 요청 §3)
{const b=document.createElement('button');b.type='button';b.className='ns-deck-exit';b.innerHTML='<span aria-hidden="true">⬇</span> 전망대 나가기';b.addEventListener('click',e=>{command('tower-exit');e.currentTarget.blur();});document.body.append(b);}
window.namsan.tower=()=>({inside:tower.inside,elev:tower.elev&&{dir:tower.elev.dir,t:+tower.elev.t.toFixed(2),phase:elevatorAt(tower.elev.dir,tower.elev.t).phase,floor:elevatorAt(tower.elev.dir,tower.elev.t).floor},
 door:towerDoor,deck:{y:deckPlan.y,center:{x:TW.x,z:TW.z},sill:DECK.sill,rMax:DECK.rMax,arrive:deckPlan.arrive,exit:deckPlan.exit,scopes:deckPlan.scopes.map(({id,name,bearing,x,z,stand})=>({id,name,bearing:+bearing.toFixed(1),x,z,stand})),labels:deckPlan.labels.map(({name,bearing,km,row})=>({name,bearing:+bearing.toFixed(1),km:+km.toFixed(2),row}))},
 towerVisible:ns.tower.visible,deckVisible:deckArt.visible,r:+Math.hypot(st.x-TW.x,st.z-TW.z).toFixed(2)});
window.namsan.deckGoTo=(x,z,heading=null)=>{if(!tower.inside)return false;const o={x,z,heading:heading??st.heading};{const dx=o.x-TW.x,dz=o.z-TW.z,r=Math.hypot(dx,dz)||1,c=Math.min(DECK.rMax,Math.max(DECK.rMin,r));st.x=TW.x+dx/r*c;st.z=TW.z+dz/r*c;}st.heading=o.heading;camBase=st.heading;look.yaw=0;look.pitch=0;hiker.snapTo(st.heading);return window.namsan.tower();};   // 점검용
window.namsan.towerGo=what=>{if(what==='in'){if(!tower.inside&&!tower.elev)enterTower();}else if(what==='out'){if(tower.inside&&!tower.elev)exitTower();}else if(what==='skip')skipElevator();else if(what==='now-out')leaveTowerNow();return window.namsan.tower();};
// ── 정상 야경 벤치(관악산 앉기·차 마시기 재사용: hiker pose 'sit'·'tea') ──
function sitBench(c){if(seat||ride)return;const b=c.site,k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)};closeGadget(gs);syncView();st.auto=false;updateUI();ix.reset();
 // 엉덩이는 좌판 가운데 조금 뒤, 몸은 벤치 앞(바깥 풍경)을 본다. 함께 걷기 자리는 벤치 바로 앞(걷는 곳)
 const sx=b.x-k.x*.04,sz=b.z-k.z*.04;seat={x:sx,z:sz,y:b.y+.4375,heading:Math.atan2(-k.x,-k.z),pose:'sit',teaT:0,bench:b,front:{x:b.x+k.x*.75,z:b.z+k.z*.75}};
 N.setPosition(st,{x:seat.front.x,z:seat.front.z,heading:seat.heading});camBase=seat.heading;look.yaw=0;look.pitch=.08;
 ix.progress.benches++;ix.persist();nsUI.toast(nightK()>.5?NS_BENCH.night:NS_BENCH.day);}
function standUp(){if(!seat)return;const f=seat.front;seat=null;N.setPosition(st,{x:f.x,z:f.z,heading:st.heading});}
// ── 순환버스 타기(시간표 namsan-bus.js, 그림 namsan-bus-art.js) ──
// 버스 2대가 같은 시계로 돈다(모든 화면 같은 버스). 정류장 앞에서 「순환버스 타기」 → 기다림 → 버스가 서면 타서 반대쪽 정류장에 내림. 「건너뛰기」는 바로 내림
const TT=G.bus?createBusTimetable(G.bus.cycle,G.bus.stops):null;
const buses=[];if(ns.bus){buses.push(ns.bus.bus);for(let k=1;k<BUS_RULE.buses;k++){const b=buildBus();toon.toonify(b,{kind:'prop',keepMaps:true});ns.bus.root.add(b);buses.push(b);}}
const busClock=()=>Date.now()/1000+(window.namsan.busClockOffset??0);
const busPrevS=buses.map(()=>null),busAt=buses.map(()=>null);   // busAt = 이번 프레임 시간표 자리(버스 소리가 읽음)
// 순환버스 소리(namsan-bus-sound.js): 발소리와 같은 AudioContext·마스터·켜기/끄기
const busSound=TT?createBusSound({context:()=>sound.audio.context,destination:()=>sound.audio.master,enabled:()=>sound.audio.enabled,mobile,base:`${BASE}sounds/namsan/`}):null;
// 매 프레임 소리: 환경음(코스 s·정상 광장 거리·밤) + 버스(내 자리·카메라 방향). 버스 안에서는 탄 자리 구간을 그대로 두고 환경음을 먹먹하게
const _dir=new THREE.Vector3();let ambPlace={s:st.s,y:myY(),place:{}},muffled=false,muffleSkip=false;
function soundFrame(dt){const started=window.namsan.started;
 if(!ride){const d=Math.hypot(st.x-G.plaza.x,st.z-G.plaza.z);ambPlace={s:st.s,y:tower.inside?G.plaza.y:walkHeight(G,st),place:{night:nightK(),summitDist:d<=G.plaza.r?d:null}};}
 sound.ambient?.update({referenceMetres:ambPlace.s,elevation:ambPlace.y,paused:!started,dt,place:ambPlace.place});
 if((!!ride||tower.inside)!==muffled){muffled=!!ride||tower.inside;sound.ambient?.setMuffle(muffled,muffled?.8:muffleSkip?.3:1);muffleSkip=false;}
 if(!busSound)return;camera.getWorldDirection(_dir);
 const P=ride?buses[ride.k].position:st;   // 탄 동안 듣는 자리 = 탄 버스(11-21 검토 1, 순서가 바뀌어도 정류장에 남지 않게)
 busSound.update({listener:{x:P.x,z:P.z,fx:_dir.x,fz:_dir.z},buses:buses.map((b,k)=>({...busAt[k],x:b.position.x,z:b.position.z})),ride:ride?ride.k:null,dt,paused:!started});}
// 정류장(타는 곳): 정류장 표지 자리에서 광장 가운데 쪽으로 2m(걷는 곳)
// 타는 곳: 백범광장은 대기소(폭 4.2m, 표지와 광장 사이) 옆 끝 밖 차로 가장자리(그림 buildBusStop 좌표), 정상은 표지에서 광장 쪽 2m.
// 대기소 안에 서면 기다리는 동안 3인칭 카메라가 지붕·의자 속에 끼었다(11-20 월드디자인 확인 4)
function nsBusStops(){return G.bus?['start','summit'].map(stop=>{const sp=G.bus.stops[stop],P=stop==='start'?G.startPlaza:G.plaza,d=Math.hypot(P.x-sp.x,P.z-sp.z)||1;let x=sp.x+(P.x-sp.x)/d*2,z=sp.z+(P.z-sp.z)/d*2,face=null;
 if(stop==='start'&&Number.isFinite(sp.heading)){const h=sp.heading,tr=(sp.side>0?1:-1),lx=tr*.3,lz=3.6,wx=sp.x+lx*Math.cos(h)+lz*Math.sin(h),wz=sp.z-lx*Math.sin(h)+lz*Math.cos(h);
  if(placeOf(G,wx,wz).ok){x=wx;z=wz;const fx=tr*Math.cos(h),fz=-tr*Math.sin(h);face=Math.atan2(-fx,-fz);}}
 return {stop,x,z,y:G.ground(x,z),face};}):[];}
const busStops=ix.cands.filter(c=>c.action==='bus').map(c=>c.site);
let boardAt=0,busSig='';
function busRowFor(c,key){if(!TT)return null;const n=TT.next(c.site.stop,busClock()),to=c.site.stop==='start'?'정상까지':'백범광장까지';
 if(wait?.from===c.site.stop)return {key,label:'기다리지 않고 바로 가기',sub:n.wait>0?`다음 버스 ${mmss(n.wait)} · 움직이면 그만 기다려요`:'버스가 섰어요 · 곧 타요',state:'ready'};
 return {key,label:'순환버스 타기',sub:`${to} 약 ${Math.round((c.site.stop==='start'?TT.tUp:TT.tDown)/60)}분 · ${n.wait>0?'다음 버스 '+mmss(n.wait):'지금 서 있어요'}`,state:'ready'};}
function busPress(c){if(!TT||ride)return;const from=c.site.stop;
 if(wait?.from===from){alight(otherStop(from),true);return;}
 wait={from,at:performance.now()};st.auto=false;updateUI();
 {const sp=G.bus.stops[from],c=busStops.find(b=>b.stop===from),h=c?.face??Math.atan2(-(sp.x-st.x),-(sp.z-st.z));st.heading=h;camBase=h;look.yaw=0;look.pitch=.12;hiker.snapTo(h);}const n=TT.next(from,busClock());nsUI.toast(n.wait>0?`버스를 기다려요 · 다음 버스 ${mmss(n.wait)}`:'버스에 타요');}
function board(k){const bus=buses[k];if(!bus)return;closeGadget(gs);syncView();ix.reset();
 const seatI=2+(Math.abs([...(multi?.info().id??'me')].reduce((a,ch)=>a*31+ch.charCodeAt(0),7))%12);
 const undo=seatInBus(bus,avatar,seatI);ride={k,to:otherStop(wait.from),undo,seatI,from:wait.from};wait=null;boardAt=performance.now();avatar.visible=true;updateUI();
 if(ride.to==='summit')shortcut=true;ix.progress.busRides++;ix.persist();nsUI.toast(`순환버스 · ${ride.to==='summit'?'정상':'백범광장'}까지 ${mmss(TT.untilStop(k,busClock(),ride.to))} · 건너뛰기(R)로 바로 내려요`);}
function alight(to,skip=false){
 if(ride){if(skip){busSound?.skip();muffleSkip=true;}ride.undo?.();scene.add(avatar);ride=null;updateUI();}
 wait=null;const sp=busStops.find(b=>b.stop===to);if(!sp)return;
 const P=to==='start'?G.startPlaza:G.plaza,h=Math.atan2(-(P.x-sp.x),-(P.z-sp.z));N.setPosition(st,{x:sp.x,z:sp.z,heading:h});
 if(to==='summit')shortcut=true;st.s=to==='summit'?Math.max(st.s,G.points.at(-1).s-30):Math.min(st.s,4);
 camBase=h;look.yaw=0;avatar.position.set(st.x,walkHeight(G,st),st.z);hiker.snapTo(h);avatar.visible=view==='third';sendJump=true;
 nsUI.toast(to==='summit'?'남산 정상 정류장이에요 · 전망탑 쪽으로 걸어 보세요':'백범광장 정류장이에요');}
function busFrame(dt,cmd){if(!TT)return;const clock=busClock();
 const nk=nightK();buses.forEach((b,k)=>{const at=TT.bus(k,clock);placeOnLane(b,G.bus.cycle,at.s);b.userData.setDoors(at.doors);busAt[k]=at;if(k)b.userData.setNight?.(nk);const prev=busPrevS[k];if(prev!=null){let d=at.s-prev;if(d<0)d+=TT.L;if(d<60)b.userData.drive(d);}busPrevS[k]=at.s;});
 // 정류장 시간표 판(1초마다)
 {const n=TT.next('start',clock),sig=Math.ceil(n.wait);if(String(sig)!==busSig){busSig=String(sig);ns.bus?.stop?.userData.setBoard?.(['다음 버스',n.wait>0?mmss(n.wait):'지금',`정상까지 약 ${Math.round(TT.tUp/60)}분`]);}}
 if(wait){if(cmd.forward||cmd.side){wait=null;nsUI.toast('그만 기다려요');}
  else{const n=TT.next(wait.from,clock);if(n.wait===0&&n.left<=4&&n.left>.8)board(n.k);}}
 if(ride){const b=buses[ride.k];b.updateMatrixWorld(true);const w=avatar.getWorldPosition(new THREE.Vector3());st.x=w.x;st.z=w.z;st.heading=b.rotation.y+Math.PI;
  const at=TT.bus(ride.k,clock);if(at.stop===ride.to&&performance.now()-boardAt>3000)alight(ride.to);}}
const _bv=new THREE.Vector3();
// 코너에서 시점이 뚝 꺾이지 않게 버스 방향을 천천히 따라간다(11-21). 탄 직후엔 버스 방향에서 시작
function rideYawEase(dt,target){if(ride.yaw==null)ride.yaw=target;let d=target-ride.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));ride.yaw+=d*(1-Math.exp(-dt/.35));return ride.yaw;}
function rideCamera(dt){const b=buses[ride.k];const by=rideYawEase(dt,b.rotation.y),h=by+Math.PI+look.yaw;fwd.set(-Math.sin(h),0,-Math.cos(h));
 if(view==='first'){avatar.getWorldPosition(_bv);camera.position.set(_bv.x,_bv.y+.62,_bv.z);lookGoal.copy(camera.position).addScaledVector(fwd,10);lookGoal.y+=Math.tan(look.pitch)*10;}
 else{ // 3인칭: 내가 앉은 창 쪽 옆 뒤에서(창턱 1.2m 위로 머리·어깨가 보이게, 그림 인계 §4)
  avatar.getWorldPosition(_bv);const side=Math.sign(avatar.position.x||1),hs=by+Math.PI+look.yaw-side*1.1;fwd.set(-Math.sin(hs),0,-Math.cos(hs));
  lookGoal.set(_bv.x,_bv.y+.45,_bv.z);camera.position.copy(lookGoal).addScaledVector(fwd,-Math.max(4.2,look.orbit*1.6));camera.position.y+=1.0+look.pitch*-3;
  const gy=G.ground(camera.position.x,camera.position.z)+.8;if(camera.position.y<gy)camera.position.y=gy;}
 camera.lookAt(lookGoal);}
// 다른 사람 몸 높이: 버스 안(내 화면 버스 몸통 안)이면 의자 높이, 야경 벤치 좌판 위면 좌판 높이(앉은 자세가 그 위에 그려짐)
const _inv=new THREE.Matrix4();
function remoteLift(x,z){for(const b of buses){_bv.set(x,b.position.y,z);_inv.copy(b.matrixWorld).invert();_bv.applyMatrix4(_inv);if(Math.abs(_bv.x)<1.6&&Math.abs(_bv.z)<4.5)return b.position.y+(b.userData.seats[0]?.y??.9);}
 for(const c of nsBenches)if(Math.hypot(c.x-x,c.z-z)<.45)return c.y+.4375;return null;}
window.namsan.bus=()=>TT?{wait,ride:ride&&{k:ride.k,to:ride.to,from:ride.from,until:TT.untilStop(ride.k,busClock(),ride.to)},buses:buses.map((b,k)=>({...TT.bus(k,busClock()),x:+b.position.x.toFixed(1),y:+b.position.y.toFixed(1),z:+b.position.z.toFixed(1),yaw:+b.rotation.y.toFixed(3)})),next:{start:TT.next('start',busClock()),summit:TT.next('summit',busClock())},period:TT.T,tUp:TT.tUp,tDown:TT.tDown}:null;
window.namsan.seat=()=>seat&&{pose:seat.pose,x:seat.x,z:seat.z,y:seat.y,heading:seat.heading,avatarY:avatar.position.y,sitLinear:hiker.interaction?.sitLinear??null};
window.namsan.locks=()=>({...lockBoard?.state(),count:LK?.count()??null,cardOpen:!!lockBoard?.isOpen,aim:lockBoard?.camSlot()??-1});
window.namsan.cam=()=>camera.position.toArray();window.namsan.lockAimView=()=>{const i=lockBoard?.camSlot()??-1;return LK&&i>=0?LK.aimView(i,st.x,st.z):null;};   // 점검용
// 점검용: 걸기 카드 열기·고르기·글·걸기 {c,h,text,hang}, 자물쇠 읽기(자리), 화면 위 자물쇠 자리(누르기 시험)
window.namsan.lockCard=(o={})=>{if(!lockBoard?.isOpen||lockBoard.mode!=='hang')openLockCard();if(o.c!=null)lockBoard.pick.c=o.c;if(o.h!=null)lockBoard.pick.h=o.h;const inp=lockBoard?.card.querySelector('input');if(inp&&o.text!=null){inp.value=o.text;inp.dispatchEvent(new Event('input'));}if(o.hang)lockBoard.hang();return window.namsan.locks();};
window.namsan.lockRead=slot=>lockBoard?.openRead(slot)??false;
window.namsan.lockScreen=slot=>{const a=LK?.slots()[slot]?.at;return a?projectWorld(a[0],a[1],a[2]):null;};
window.namsan.interact=()=>ix;window.namsan.features=NAMSAN_MOUNTAIN.features;
if(q.has('debug'))Object.assign(window,{__ns:ns,__scene:scene,__land:landscape.group,__camera:camera,__THREE:THREE,__G:G,__avatar:avatar,__hiker:hiker});   // 점검용(?debug)
// ── 준비 ──
await lighting.prepare?.();loading.done('environment');
// 첫 프레임 안정(관악산과 같은 규칙: 100ms 안 프레임이 12번 이어지면 준비 완료)
const stability=createStabilityCounter();let loadReady=false;
// 저장·WebGL 끊김(공통 본체 부품): 숨김·창 닫기에 저장, 끊기면 6초 기다렸다 저장 지점에서 다시 열기
const suspend=()=>{if(!window.namsan.started)return;sound.audio.stop();sound.ambient?.setPaused(true);busSound?.pause();input.clear();save();};   // 소리도 멈춤(관악산 main.js suspend와 같게): 숨긴 탭은 frame_이 안 돌아 update가 못 끈다. 돌아오면 다음 프레임 update가 다시 켠다
installLifecycleSave(suspend);
const resumeNote=$('#resume-note'),hideResumeNote=()=>setTimeout(()=>{resumeNote.style.opacity='0';},3500);
const ctxRecovery=installContextRecovery({canvas,note:resumeNote,suspend,save,resize,restored:hideResumeNote});
resumeNote.textContent=mobile?(st.s>20&&!st.done?'지난번 자리에서 이어 올라요 · 빨간 걷기 단추나 조이스틱으로 이어가세요':'백범광장 출발 · 빨간 걷기 단추나 조이스틱으로 걸어 보세요'):(st.s>20&&!st.done?'지난번 자리에서 이어 올라요 · 자동 걷기(R)나 W로 이어가세요':'백범광장 출발 · 자동 걷기(R)나 W로 걸어 보세요');   // 휴대폰엔 키 글자 없이
// 개발용 구간 이동(공통 section-jump: 설정 탭 '개발용' 칸, 관악산과 같은 조건 sectionJumpEnabled)
const NS_JUMPS=[['ns-start','출발',2],['ns-stairs','큰 계단',430],['ns-rest','쉼터',770],['ns-last','마지막 계단',840],['ns-top','정상 앞',1040]].map(([id,label,s])=>({id,label,s}));
const jumpUI=sectionJumpEnabled(location.search)?mountSectionJump({targets:NS_JUMPS,onJump:t=>{if(!window.namsan.started)return false;if(tower.inside||tower.elev)leaveTowerNow();if(seat)standUp();closeGadget(gs);ix?.reset();jumpTo(G,st,t.s);shortcut=true;camBase=st.heading;look.yaw=0;sendJump=true;document.querySelectorAll('dialog[open]').forEach(d=>d.close());save();updateUI();return true;}}):null;
window.namsan.ready=true;
updateUI();
requestAnimationFrame(frame_);
// 도심 건물(서울 서·동 묶음)은 출발 뒤 뒤에서 이어 받는다(관악산과 같은 순서). 휴대폰은 도시 칸 상한(device-profile)을 그대로 따른다.
(async()=>{try{await landscape.streamRoads();lowerRoads();for(const c of landscape.manifest.cityChunks.filter(c=>/^seoul-/.test(c.id))){await landscape.streamCity(c.id);if(LIMITS.cityChunkGapMs)await new Promise(r=>setTimeout(r,LIMITS.cityChunkGapMs));}await landscape.finalizeCities?.();}catch(e){console.warn('도심 건물',e);}window.namsan.cityDone=true;})();
beginHike=()=>{
 if(!wantStart||window.namsan.started||!loadReady)return;
 window.namsan.started=true;window.hiking.started=true;input.clear();loading.start();
 if(pendingJoin)joinMulti(pendingJoin);
 jumpUI?.show();hideResumeNote();updateUI();
 if(st.s>20&&!st.done)ixUI.toast('지난번 자리에서 이어 올라요');
 window.dispatchEvent(new CustomEvent('hiking:started'));
};
beginHike();
