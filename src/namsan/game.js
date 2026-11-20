// 남산 게임 화면(월드개발 11-19, /hiking/namsan/). 산 고르기(관악산 페이지)에서 남산 「오르기」를 누르면 이 페이지로 온다.
// 관악산 main.js(GPX·청크·즐길거리에 묶인 코드)는 건드리지 않고, 공통 부품만 그대로 가져다 쓴다:
//  - 그림: 카툰 빛·하늘·도심·한강·원경(createToonStyle·setupRendering·loadLandscape) + 남산 그림(월드아트 namsan-art.js)
//  - 동동이(loadToonHiker) · 조작(input.js 키·떠다니는 조이스틱·드래그) · 시점(view.js)
//  - 공통 화면 틀(ui-frame: 위 알약·💬·☰·큰 단추) · 채팅(hiking-chat-ui) · 함께 걷기(multi-client, 방만 남산 방) · 입장(entry.js·server-pick.js 공용 창)
// 걷기 규칙은 namsan-walk.js(three 없음, 시험 tests/namsan-game.test.mjs). 점검 scripts/verify-namsan-game.mjs.
// 콘솔 window.namsan: status()·jump(s)·setAuto(on)·multi() (점검·개발용)
import {serverReady} from '../server-link-pin.js';
import '../loading-screen.js';
import {createLoadingTracker,createStabilityCounter,LOADING_EVENT} from '../loading.js';   // 맨 먼저: 함께 걷기 서버 주소 고르기(관악산 산 고르기와 같은 순서)
import * as THREE from 'three';
import '../icons/icons.css';
import './game.css';
import '../server-pick.css';
import '../hiking-frame.css';
import {icon} from '../icons/icon.js';
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
import {createUiFrame,ufPlace} from '../ui-frame.js';
import {createServerPick} from '../server-pick.js';
import {hikingServerUrl,hikingPickMode,entryChoiceNow} from '../hiking-server-pick.js';
import {currentChoice} from '../server-link.js';
import {enterWith,ENTRY_KEY} from '../entry.js';
import {recordSummit,summitOf,loadSummits,sealDate} from '../summit-records.js';
import {sealSVG} from '../free-settings-ui.js';
import {loadNamsanData,createNamsanGround,courseAt,NAMSAN} from './namsan-data.js';
import {buildNamsan} from './namsan-art.js';
import {createNightLighting} from '../night-lighting.js';
import {NAMSAN_ENTRY_KEY,NAMSAN_SERVERS,isNamsanRoom,namsanRoom,namsanHealth,walkHeight,heightAt,remainOf,jumpTo,wrapAngle} from './namsan-walk.js';
import {createNamsanWalker} from './namsan-walker.js';
// 통합 5단계(11-20): 남산 상호작용(약수·물확·돌탑·정상석·이정표·스탬프함·쌍안경)·사랑의 자물쇠·순환버스·정상 야경 벤치
import {buildNamsanInteract} from './namsan-interact-art.js';
import {makeWalkPads} from './namsan-walk.js';
import {createNamsanInteract,planNightBenches} from './namsan-interact.js';
import {bench} from '../toon/trail-props.js';
import {looseStone} from '../../assets/realistic/interaction-props.js';
import {NAMSAN_MOUNTAIN} from '../mountains/namsan.js';
import {mountInteractionUI} from '../interaction-ui.js';
import {directionToBearing} from '../interaction-logic.js';
import '../gadget-ui.css';
import {installGadgetUI} from '../gadget-ui.js';
import {ensureGadget,setGadget,closeGadget,zoomBy,zoomStep,viewZoom} from '../gadget.js';
import {project} from '../../assets/realistic/geo.js';

const q=new URLSearchParams(location.search),BASE=import.meta.env.BASE_URL,$=s=>document.querySelector(s);
document.documentElement.dataset.icExp='hiking';
const mobile=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
if(mobile)document.body.classList.add('touch');
window.namsan={started:false};
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
// 관악산 서버 1·2·3 중 무엇을 골랐든 남산은 남산 서버 하나(줄 id '1')로 들어간다. 혼자 하기는 그대로
const entryChoice=(c=>c?.server?{...c,server:'1'}:c)(pickMode==='legacy'?null:(passed??entryChoiceNow()));
let wantStart=false,ready=false,beginHike=()=>{};
const requestStart=()=>{wantStart=true;beginHike();};
let pendingJoin=null;   // 화면이 준비되기 전에 고른 서버
let joinMulti=async()=>{};
// 서버 인원: /health의 등산 줄(관악산 방)을 남산 줄 하나로 바꿔 보여 준다(namsan-walk.js namsanHealth)
const fetchNamsan=(...a)=>fetch(...a).then(async r=>{if(!r.ok)return r;const j=namsanHealth(await r.json());return new Response(JSON.stringify(j),{status:200,headers:{'content-type':'application/json'}});});
// 남산에서 고른 서버는 '지난 선택'(체험별 저장값)에 쓰지 않는다 — 관악산 입장 때 남산 줄 id가 관악산 1서버로 읽히지 않게. 이름 저장은 그대로
const entryStore={getItem:k=>{try{return localStorage.getItem(k);}catch{return null;}},setItem:(k,v)=>{if(k===ENTRY_KEY)return;try{localStorage.setItem(k,v);}catch{}},removeItem:k=>{if(k===ENTRY_KEY)return;try{localStorage.removeItem(k);}catch{}}};
let pick=null;
const namsanPick=()=>pick??=createServerPick({experience:'hiking',servers:NAMSAN_SERVERS,serverUrl:hikingServerUrl(),serverOff:currentChoice().source==='file-off',fetchImpl:fetchNamsan,storage:entryStore,
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
scene.add(landscape.group); // 관악산 풀밭(toon.attachLandscape)은 관악산 길을 따르므로 붙이지 않는다(그림 인계 §3-3)
const lighting=setupRendering(renderer,scene,camera,mobile,{toon});
if(free.weather)lighting.environment?.weather?.setOverride(free.weather);
loading.set('terrain',.6);
const data=await loadNamsanData(`${BASE}assets/shared/namsan/`);
const G=createNamsanGround(data);
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
const nsBenches=planNightBenches(G,{avoid:[{x:NAMSAN.tower.x,z:NAMSAN.tower.z,r:15},...ia.userData.spots.map(s=>({x:s.x,z:s.z,r:s.action==='lock'?7:4})),...ns.furniture.userData.items.map(i=>({x:i.x,z:i.z,r:3})),...(ns.lamps?.userData.spots??[]).map(l=>({x:l.x,z:l.z,r:1.6}))],
 busClear:(x,z)=>!G.bus||(G.bus.cycle.nearest(x,z).distance>2.8&&G.bus.nearest(x,z).distance>G.bus.points[0].width/2+2.5)}).map((b,i)=>{
 const o=bench();o.name=`정상 야경 벤치 ${i+1}`;const y=G.ground(b.x,b.z)+.02;o.position.set(b.x,y,b.z);o.rotation.y=b.yaw;toon.toonify(o,{kind:'prop'});o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});scene.add(o);o.updateMatrixWorld(true);return {...b,y,obj:o};});
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
const N=createNamsanWalker(G);
let saved=null;try{saved=localStorage.getItem(N.saveKey);}catch{}
const st=q.get('start')==='summit'?N.initialState({start:'summit'}):N.restore(saved);
let shortcut=q.get('start')==='summit';
const save=()=>{if(multiMode)return;try{localStorage.setItem(N.saveKey,N.serialize(st));}catch{}};
const look=createLook(),camFollow=createHeightFollow();let view='third',camBase=st.heading,speed=0,walkPhase=0,moving=false,runHeld=false;
// 쌍안경(관악산 gadget.js 규칙 그대로: 들면 1인칭·걷기 멈춤·배율 4~10, 내리면 원래 시점). 남산은 휴대폰 카메라 없음(산 정의 features.phone=false)
const gs=ensureGadget({view:'third',gadget:'none'});
const syncView=()=>{view=gs.view;viewBtn.querySelector('span').textContent=view==='third'?'3인칭':'1인칭';viewBtn.disabled=gs.gadget!=='none';};

// ── 화질(관악산과 같은 규칙: 휴대폰 '낮음' 시작, 자동 조절) ──
const quality=mobile?0:2,adaptive=new AdaptiveQuality(quality);
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=h>w?78:65;camera.updateProjectionMatrix();renderer.setSize(w,h);adaptive.setViewport(`${w}x${h}@${devicePixelRatio}`);
 const s=adaptive.settings,dpr=Math.min(devicePixelRatio,Math.max(s.dpr,LIMITS.minDpr));renderer.setPixelRatio(dpr);lighting.resize(quality,w,h,dpr,s);}
addEventListener('resize',resize);resize();

// ── 화면 틀 ──
const frame=createUiFrame({exp:'hiking',menuLabel:'남산 메뉴',tabs:[
 {id:'map',label:'지도',ic:'h-map',render:p=>{p.innerHTML=`<div class="ns-panel ns-map"><h4>남산 성곽 계단길 · 1.1km</h4><svg viewBox="0 0 320 240" aria-label="코스와 지금 위치">${mapSvg()}</svg><div class="ns-stamps" data-ns-stamps></div><small>스탬프 4곳 · 정상 광장에 들어서면 완등이에요</small></div>`;},onOpen:p=>paintMap(p)},
 {id:'settings',label:'설정',ic:'c-settings',render:p=>{p.innerHTML=`<section id="nb-sheet-settings" class="ns-panel"><div class="nb-grid ns-grid"><button type="button" data-ns="face">정면 보기</button><button type="button" data-ns="people" aria-pressed="false">함께 걷기 인사·목록 판</button><button type="button" data-ns="pick">다른 산 고르기</button><div data-dev-slot></div></div>
<div class="ns-dev"><b>개발용 · 구간 이동</b><div class="ns-grid">${[['출발',2],['큰 계단',430],['쉼터',770],['마지막 계단',840],['정상 앞',1040]].map(([t,s])=>`<button type="button" data-ns-jump="${s}">${t}</button>`).join('')}</div></div>
<p class="ns-credits">걷기: 왼쪽 아래 손가락(조이스틱)·WASD, 둘러보기: 드래그·Q/E, 빨간 단추·R = 자동 걷기, V = 시점.<br>지형: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. 길·성곽·건물: © OpenStreetMap contributors (ODbL). 날씨: 10분마다 <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> 데이터(<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>)를 받아 표현해요. 전망탑·광장·소품·이정표 문구는 게임 속 디자인이에요.</p></section>`;
  p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ns==='face')faceForward(look);else if(b.dataset.ns==='people'){const on=document.body.classList.toggle('ns-multi-open');b.setAttribute('aria-pressed',String(on));frame.close();}else if(b.dataset.ns==='pick')location.assign(new URL('../'+location.search.replace(/([?&])multi=[^&]*&?/,'$1').replace(/[?&]$/,''),location.href).href);else if(b.dataset.nsJump){jumpTo(G,st,Number(b.dataset.nsJump));shortcut=true;camBase=st.heading;look.yaw=0;sendJump=true;frame.close();}});}},
]});
const topl=document.createElement('div');topl.className='hk-topl';topl.innerHTML=`<div class="hk-topl-r1"><button type="button" class="hk-pill" aria-label="남산 진행"><b class="hk-pill-t">출발 전</b><i class="hk-pill-bar" aria-hidden="true"><i></i></i></button><button type="button" id="view" aria-label="시점 바꾸기 (V)"><em aria-hidden="true">${icon('h-view',{size:'s'})}</em><span>3인칭</span></button></div><div class="hk-topl-r2"></div>`;
document.body.append(topl);
const pillT=topl.querySelector('.hk-pill-t'),pillBar=topl.querySelector('.hk-pill-bar>i'),viewBtn=topl.querySelector('#view');
topl.querySelector('.hk-pill').addEventListener('click',()=>frame.toggle('map'));
viewBtn.addEventListener('click',()=>command('view'));
const big=document.createElement('button');big.type='button';big.className='ns-big';big.setAttribute('aria-label','자동 걷기 (R)');
const runBtn=document.createElement('button');runBtn.type='button';runBtn.className='ns-run';runBtn.setAttribute('aria-label','달리기(누르고 있는 동안)');runBtn.innerHTML='<span aria-hidden="true">»</span><span>달리기</span>';
const binoBtn=document.createElement('button');binoBtn.type='button';binoBtn.className='ns-run ns-bino';binoBtn.setAttribute('aria-label','쌍안경 (B)');binoBtn.innerHTML=`<span aria-hidden="true">${icon('h-binoculars',{size:'m',fallback:'🔭'})}</span><span>쌍안경</span>`;
document.body.append(big,runBtn,binoBtn);binoBtn.addEventListener('click',()=>{command('binoculars');binoBtn.blur();});
big.addEventListener('click',()=>command('auto'));
for(const [ev,on] of [['pointerdown',true],['pointerup',false],['pointercancel',false],['pointerleave',false]])runBtn.addEventListener(ev,()=>{runHeld=on;runBtn.classList.toggle('on',on);});
const paintBig=()=>{big.innerHTML=st.auto?`<span class="ns-big-ic">${icon('c-stop',{size:'l',fallback:'■'})}</span><span>멈추기</span>`:`<span class="ns-big-ic">${icon('h-walk',{size:'l',fallback:'🥾'})}</span><span>${st.done?'둘러보기':'걷기'}</span>`;};
paintBig();
// 할 일 칩(공통 틀 data-uf=todo): 가까운 상호작용 줄(F·2·3)을 작은 단추 위에 쌓는다(관악산 빨간 도장·꼬리표 자리와 같은 뜻)
const todoEls=[];let todoSig='';
function paintTodo(rows){const sig=JSON.stringify(rows??null);if(sig===todoSig)return;todoSig=sig;
 for(const el of todoEls.splice(0))el.remove();
 (rows??[]).forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.className=`ns-todo${r.state==='done'?' done':r.state==='lock'?' lock':''}`;b.dataset.ix=String(i);
  b.innerHTML=`<kbd>${r.key}</kbd><span><b>${r.label}</b>${r.state==='lock'&&r.reason?`<small>${r.reason}</small>`:r.sub?`<small>${r.sub}</small>`:''}</span>`;b.setAttribute('aria-label',`${r.label} (${r.key})`);
  b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',()=>{b.blur();command(i?`choice-${i+1}`:'interact');});document.body.append(b);todoEls.push(b);});
 placeUi();}
const placeUi=()=>ufPlace(document.body,{big,small:[runBtn,binoBtn],todo:[...todoEls].reverse()});
placeUi();
const toast=document.createElement('p');toast.className='ns-toast';toast.hidden=true;toast.setAttribute('role','status');document.body.append(toast);
let toastT=0;const say=html=>{toast.innerHTML=html;toast.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{toast.hidden=true;},3200);};
// 정상 도착 카드(관악산 완등 카드와 같은 도장 그림, 남산 이름)
const summitBox=document.createElement('div');summitBox.className='ns-summit';summitBox.hidden=true;summitBox.setAttribute('role','dialog');summitBox.setAttribute('aria-label','남산 완등');document.body.append(summitBox);
summitBox.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;summitBox.hidden=true;if(b.dataset.nsAgain){st.done=false;st.stamps=[];st.elapsed=0;st.distance=0;st.ascent=0;shortcut=false;jumpTo(G,st,2);st.best=2;camBase=st.heading;sendJump=true;save();}});
function showSummit(){
 let r=null;if(!multiMode&&!shortcut)try{r=recordSummit(localStorage,'namsan',{date:seoulClock(Date.now()).date,sec:st.elapsed});}catch{}
 if(!r)r=summitOf(loadSummits(globalThis.localStorage),'namsan');
 const mm=Math.floor(st.elapsed/60),ss=Math.round(st.elapsed%60);
 summitBox.innerHTML=`<div class="ns-summit-card"><div class="ns-seal">${sealSVG(mobile&&innerHeight<500?90:130,{name:'남산',date:sealDate(r?.first??seoulClock(Date.now()).date),count:r?.count??1})}</div><h2>남산 정상 265m에 닿았어요</h2><p>${shortcut?'구간 이동으로 온 등산이라 기록에는 넣지 않았어요':`걸은 시간 ${mm}분 ${ss}초 · ${Math.round(st.distance)}m · 오른 높이 ${Math.round(st.ascent)}m`}</p><p>스탬프 ${st.stamps.length} / 4 · 전망탑 둘레를 걸으며 서울을 둘러보세요. 남쪽 멀리 관악산이 보여요.</p><div class="ns-row"><button type="button" class="on" data-ns-close>전망 둘러보기</button><button type="button" data-ns-again="1">처음부터 다시</button></div></div>`;
 summitBox.hidden=false;
}
function mapSvg(){const P=G.points,xs=P.map(p=>p.x),zs=P.map(p=>p.z),x0=Math.min(...xs)-40,x1=Math.max(...xs)+60,z0=Math.min(...zs)-40,z1=Math.max(...zs)+40,k=Math.min(300/(x1-x0),220/(z1-z0)),X=x=>10+(x-x0)*k,Z=z=>10+(z-z0)*k;
 const d=P.map((p,i)=>`${i?'L':'M'}${X(p.x).toFixed(1)} ${Z(p.z).toFixed(1)}`).join(''),tw=NAMSAN.tower;
 window.__nsMap={X,Z};
 return `<path d="${d}" fill="none" stroke="#a88b62" stroke-width="5" stroke-linecap="round"/><path data-ns-walked fill="none" stroke="#b0442f" stroke-width="5" stroke-linecap="round"/><circle cx="${X(tw.x)}" cy="${Z(tw.z)}" r="7" fill="#e9e1cf" stroke="#3a2b22"/>${NAMSAN.stamps.map(t=>{const c=courseAt(P,t.s);return `<text x="${X(c.x)+8}" y="${Z(c.z)+5}" font-size="13" font-weight="900" fill="#7a6650">${t.glyph}</text>`;}).join('')}<circle data-ns-dot r="6" fill="#2f7fd0" stroke="#fff" stroke-width="2"/>`;}
function paintMap(p){const M=window.__nsMap;if(!M||!p)return;const P=G.points,walked=P.filter(x=>x.s<=st.best).map((x,i)=>`${i?'L':'M'}${M.X(x.x).toFixed(1)} ${M.Z(x.z).toFixed(1)}`).join('');p.querySelector('[data-ns-walked]')?.setAttribute('d',walked||'M0 0');const dot=p.querySelector('[data-ns-dot]');dot?.setAttribute('cx',M.X(st.x));dot?.setAttribute('cy',M.Z(st.z));
 const sp=p.querySelector('[data-ns-stamps]');if(sp)sp.innerHTML=NAMSAN.stamps.map(t=>`<span class="${st.stamps.includes(t.n)?'on':''}" title="${t.name}">${t.glyph}</span>`).join('');}

// ── 조작 ──
let sendJump=false;
function command(id,value){
 if(!window.namsan.started)return;
 // 상호작용(F·1·2·3·안내판 닫기·쪽 넘기기·이름표)이 먼저. 처리했으면 끝
 if(ix&&['interact','choice-1','choice-2','choice-3','panel-close','page-prev','page-next',...(gs.gadget!=='none'?['labels-toggle']:[])].includes(id)&&ix.handle(id))return;
 if(id==='binoculars'){ixUI.closeBoard();ix?.cancel('쌍안경을 들었어요');setGadget(gs,'binoculars');st.auto=false;syncView();paintBig();if(gs.gadget!=='none'){input.clear?.();say('쌍안경 · 전망 쉼터·정상에서 명소 이름표가 보여요');}gadgetState();return;}
 if(id==='gadget-off'){if(closeGadget(gs)){syncView();gadgetState();}return;}
 if(id==='zoom-in'||id==='zoom-out'){if(gs.gadget==='binoculars'){zoomStep(gs,id==='zoom-in'?1:-1);gadgetState();}return;}
 if(gs.gadget!=='none'&&(id==='auto'||id==='view'))return;
 if(id==='auto'){if(st.done){say('정상이에요 · 조이스틱으로 광장을 둘러보세요');return;}st.auto=!st.auto;paintBig();}
 else if(id==='view'){gs.view=gs.view==='third'?'first':'third';syncView();}
 else if(id==='face-forward')faceForward(look);
 else if(id==='escape'){if(gs.gadget!=='none'){closeGadget(gs);syncView();gadgetState();}else if(ix?.handle('panel-close'));else if(!summitBox.hidden)summitBox.hidden=true;else frame.close();}
 else if(id==='map-toggle')frame.toggle('map');
 else if(id==='interact'||id==='emote-menu')multi?.greetKey?.();
 else if(id==='labels-toggle'){if(!multi){say('이름표는 함께 걷기 중에 보여요');return;}const on=!multi.tagsOn;multi.setTags(on);say(on?'이름표 켜짐':'이름표 꺼짐');}   // N·함께 걷기 판 「이름표」(관악산 interaction-controller와 같은 문구)   // F·X = 앞사람에게 인사(관악산과 같은 키)
}
const input=bindInput(command,(dx,dy)=>{const k=1/Math.max(1,viewZoom(gs));turnLook(look,dx*k,dy*k);},dz=>{if(gs.gadget==='binoculars'){zoomBy(gs,dz);gadgetState();return;}if(view==='third')look.orbit=THREE.MathUtils.clamp(look.orbit+dz,2.2,12);},{mode:()=>window.namsan.started?gs.gadget:'none',interact:()=>!!ix?.active()||ixUI.boardOpen||!!multi?.greet?.().target,panel:()=>frame.isOpen||ixUI.boardPages>1});
// 쌍안경 화면(관악산 gadget-ui 그대로: ✕ 내리기·배율 단추). 'hiking:state'로 기구·시점·배율만 넘긴다
installGadgetUI();
let gadgetSig='';function gadgetState(){const d={gadget:gs.gadget,view,phone:{...gs.phone},binoculars:{...gs.binoculars},viewZoom:viewZoom(gs),started:window.namsan.started};const sig=JSON.stringify(d);if(sig===gadgetSig)return;gadgetSig=sig;window.dispatchEvent(new CustomEvent('hiking:state',{detail:d}));}
// 상호작용 화면(관악산 interaction-ui: 안내판·알림·행동 진행·쌍안경 이름표·15m 점). 줄은 위 할 일 칩이 그린다
const ixUI=mountInteractionUI();
const quietSound={play:()=>false,playAction:()=>0,cancel:()=>{}};   // 남산은 아직 소리 없음(11-19 결정, 후속)
let ix=null;

// ── 함께 걷기(공용 multi-client, 방은 남산 방). 서버 코드·서버 목록은 그대로 ──
let multi=null,multiBusy=Promise.resolve();
const multiServer=()=>hikingServerUrl();
const multiStatus=detail=>window.dispatchEvent(new CustomEvent('hiking:multi-status',{detail}));
const multiLocal={nudge:()=>false,here:()=>null,sample:null,minS:0,maxS:0,
 walk:()=>({auto:!!st.auto,moving,steering:false,base:speed}),
 position:()=>N.position(st),
 setPosition:pos=>N.setPeerPosition(st,pos),
 speed:()=>speed,sit:()=>false,run:()=>!!st.running,gadget:()=>'none',selfie:()=>false,busy:()=>false,place:()=>null,
 act:()=>({pose:'stand',gadget:gs.gadget,selfie:false,trail:null,action:ix?.action?{id:ix.action.id}:null}),shown:()=>null,propFor:()=>null};
joinMulti=({room=null,name=null}={})=>{multiBusy=multiBusy.then(async()=>{
 if(!window.namsan.ready)return;   // 화면 준비 뒤 pendingJoin으로 다시 부른다
 if(multi&&room===multi.room)return;if(multi)leaveMultiNow();
 const r=isNamsanRoom(room)?room:namsanRoom();
 multiStatus({state:'connecting',room:r,count:0,transport:multiServer()?'server':'local'});
 const {mountMultiplayer}=await import('../multi-client.js');
 multi=await mountMultiplayer({scene,camera,night,hikerUrl,prepareGltf:prepareToonHikerGltf,groundHeight:(x,z)=>heightAt(G,x,z),command,room:r,name,serverUrl:multiServer(),local:multiLocal,toonify:toon.toonify});
 window.hiking.multiApi=multi;
}).catch(e=>{console.warn('함께 걷기 참가 실패',e);multiStatus({state:'offline',room:room||'',count:0,transport:multiServer()?'server':'local'});});return multiBusy;};
function leaveMultiNow(){if(!multi)return;multi.dispose();multi=null;window.hiking.multiApi=null;}
function leaveMulti(){multiBusy=multiBusy.then(()=>leaveMultiNow());}
window.hiking={multiApi:null,multi:()=>multi?.info()??null};   // 공용 채팅·함께 걷기 HUD가 보는 자리(관악산과 같은 이름)
window.addEventListener('hiking:multi-join',e=>{const d=e.detail??{};joinMulti({room:d.room,name:d.name});});
window.addEventListener('hiking:multi-leave',()=>leaveMulti());
import('../hiking-chat-ui.js').then(m=>{m.installHikingChat?.({frame});multi?.statusNow();}).catch(e=>console.warn('채팅 HUD',e));
import('../multi-entry-ui.js').then(m=>{m.installMultiEntry?.({serverUrl:multiServer(),serverPick:namsanPick(),servers:NAMSAN_SERVERS});multi?.statusNow();}).catch(e=>console.warn('함께 걷기 HUD',e));
import('../pair-ui.js').then(m=>{m.installPairUI?.();multi?.statusNow();}).catch(()=>{});
// 함께 걷기 상태 칩·👥 목록 단추는 나중에 붙으니 보이면 알약 아래 둘째 줄로(관악산 hiking-frame과 같은 자리·모양)
{const row2=topl.querySelector('.hk-topl-r2'),adopt=()=>{for(const s of ['.me-chip','.pw-btn'])for(const el of document.querySelectorAll(s))if(el.parentElement!==row2){el.classList.add('hk-r2');row2.append(el);}};new MutationObserver(adopt).observe(document.body,{childList:true});adopt();}
// 인사 칩·이름표 카드는 'hiking:command'(interact)로 인사를 보낸다(관악산 main.js와 같은 길)
window.addEventListener('hiking:command',e=>command(e.detail?.id,e.detail?.value));

// ── 매 프레임 ──
const fwd=new THREE.Vector3(),lookGoal=new THREE.Vector3(),camGoal=new THREE.Vector3();
let prevAuto=st.auto,t0=performance.now(),last=performance.now(),saveAt=0,uiAt=0,first=true,cameraReady=false,stairsNow=false,fpsN=0,fpsSum=0,fpsWin=performance.now(),metrics=null;
const nightK=()=>lighting.environment?.current?.night??0;
function frame_(now){
 requestAnimationFrame(frame_);
 const dtRaw=Math.min(.1,(now-last)/1000);last=now;const started=window.namsan.started,dt=started?dtRaw:0;
 const cmd=started?input.read():{forward:0,side:0,run:false,turn:0};
 if(multi?.frozen||!summitBox.hidden)Object.assign(cmd,{forward:0,side:0,run:false,turn:0});
 if(gs.gadget!=='none')Object.assign(cmd,{forward:0,side:0,run:false});   // 쌍안경을 든 동안은 제자리에서 둘러보기
 updateLook(look,dtRaw,cmd.turn);
 const direct=!!(cmd.forward||cmd.side);
 // 직접 걷기는 카메라가 보는 쪽 기준(관악산 광장과 같음), 자동 걷기는 카메라가 걷는 방향을 천천히 따라 돈다
 if(direct){st.heading=wrapAngle(camBase+look.yaw);camBase=st.heading;look.yaw=0;}
 const r=N.walk(st,{forward:cmd.forward,side:cmd.side,yaw:st.heading,run:cmd.run||runHeld,auto:st.auto},dt);
 speed=r.speed;moving=r.moved>1e-5;stairsNow=r.stairs;
 if(!direct&&st.auto){const d=wrapAngle(st.heading-camBase);camBase=wrapAngle(camBase+d*Math.min(1,dtRaw*2.2));}
 if(started){st.elapsed+=dtRaw;}
 if(r.stamp){const t=NAMSAN.stamps.find(x=>x.n===r.stamp);say(`<b>${t.glyph}</b>스탬프 ${st.stamps.length} / 4 · ${t.name}`);if(frame.isOpen&&frame.tab==='map')paintMap(frame.panel('map'));}
 if(r.summit){paintBig();showSummit();save();}
 if(st.auto!==prevAuto){prevAuto=st.auto;paintBig();}
 const y=walkHeight(G,st),heading=camBase+look.yaw;
 avatar.position.set(st.x,y,st.z);
 avatar.visible=view==='third';   // 1인칭은 내 몸을 숨긴다(관악산 main.js와 같음 — 안 숨기면 카메라가 머리 속이라 화면이 까맣게 보임)
 if(first){hiker.snapTo(st.heading);first=false;}
 else if(moving)hiker.turnTo(direct?heading:r.heading,dtRaw);
 const k=courseAt(G.points,st.s),slope=moving?(()=>{const a=courseAt(G.points,st.s-1.5),b=courseAt(G.points,st.s+1.5);return (b.y-a.y)/3*Math.sign(Math.cos(r.heading-k.heading));})():0;
 const gait=gaitFor(slope,stairsNow?'stairs':'paved',slope<0?-1:1),stepLength=gait.stride*strideScaleFor(hiker.strideScale,!!st.running,stairsNow);
 walkPhase+=r.moved/Math.max(.1,stepLength)*(cmd.forward<0?-1:1);
 const surface=(x,z)=>heightAt(G,x,z);
 if(ix){ix.update(dtRaw,{moving:direct,started});const res=ix.result;if(res&&res!==lastResult){lastResult=res;if(res.id==='cairn')paintStones();}}
 if(gs.gadget!=='none'&&!direct)hiker.turnTo(heading,dtRaw);   // 쌍안경을 든 동안은 몸이 보는 방향을 따른다(관악산과 같음)
 hiker.update({clip:!moving?'Idle':slope>.15?'Climb':'Walk',distance:walkPhase,stride:1,stepLength,stairs:stairsNow,idleSeconds:now/1000,slope,pose:'stand',teaProgress:0,running:!!st.running,speed,dt:dtRaw,surfaceHeight:surface,gadget:gs.gadget,selfie:false,lookYaw:wrapAngle(heading-avatar.rotation.y),lookPitch:look.pitch});
 hiker.ground({moving,phase:walkPhase,surfaceHeight:surface,pose:'stand'});
 multi?.afterLocalGround(hiker,null,now/1000);
 // 카메라(관악산 main.js와 같은 식): 3인칭은 동동이 뒤·위, 1인칭은 눈높이. 땅 밑으로 들어가지 않게 지형 위 0.5m로 올린다
 const smoothY=followHeight(camFollow,y,cameraReady?dtRaw:0);
 fwd.set(-Math.sin(heading),0,-Math.cos(heading));
 if(view==='first'){camGoal.set(st.x,smoothY+hiker.eyeHeight-(ix?.drop??0),st.z);lookGoal.copy(camGoal).addScaledVector(fwd,10);lookGoal.y+=Math.tan(THREE.MathUtils.clamp(look.pitch+(hiker.viewPitch??0)+(ix?.pitch??0),-1.3,1.3))*10;camera.position.copy(camGoal);}
 else{const cs=hiker.profile?.cameraScale??1;lookGoal.set(st.x,smoothY+(1.15-(1.6-hiker.eyeHeight)*2/3),st.z);camGoal.copy(lookGoal).addScaledVector(fwd,-look.orbit*cs*Math.cos(look.pitch));camGoal.y+=cs*(1-look.orbit*Math.sin(look.pitch));
  const gy=G.ground(camGoal.x,camGoal.z)+.5;if(camGoal.y<gy)camGoal.y=gy;camera.position.copy(camGoal);}
 {const co=window.namsan.cameraOverride;if(co){camera.position.fromArray(co.p);lookGoal.fromArray(co.t);}}
 camera.lookAt(lookGoal);cameraReady=true;
 // 쌍안경 배율은 camera.zoom(관악산과 같음, 로그 공간에서 부드럽게)
 {const target=viewZoom(gs),next=Math.exp(Math.log(camera.zoom)+(Math.log(target)-Math.log(camera.zoom))*(1-Math.exp(-dtRaw*14))),z=Math.abs(next-target)<1e-3?target:next;if(z!==camera.zoom){camera.zoom=z;camera.updateProjectionMatrix();}}
 landscape.update(camera,quality);ns.update(now/1000,nightK());ia.userData.update(now/1000,nightK(),camera);
 night.update(dtRaw,{camera,avatar,view,selfie:false,zone:'route',s:st.s,hiker});
 if(multi)multi.update(dtRaw,now/1000,view);
 lighting.render(avatar.position);
 if(now-uiAt>200){uiAt=now;paintHud();gadgetState();}
 paintTodo(ix&&gs.gadget==='none'?ix.view?.rows??null:null);
 if(started&&now-saveAt>1000){saveAt=now;save();}
 if(!document.hidden&&dtRaw>0){fpsN++;fpsSum+=dtRaw;}
 if(!loadReady){const ok=stability.sample(dtRaw*1000,false);loading.set('stabilizing',Math.min(.99,stability.fraction));if(ok){loadReady=true;loading.ready();beginHike();}}
 if(now-fpsWin>3000){metrics={fps:fpsN/Math.max(1e-3,fpsSum),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries};fpsN=fpsSum=0;fpsWin=now;}
 if(adaptive.sample(dtRaw*1000,!document.hidden&&cameraReady,now-t0,lighting.status?.ao))resize();
}
function paintHud(){
 const remain=remainOf(G,st);
 pillT.textContent=st.done?`남산 정상 · ${Math.round(walkHeight(G,st))}m`:`정상까지 ${remain>=1000?(remain/1000).toFixed(1)+'km':Math.round(remain)+'m'} · ${Math.round(walkHeight(G,st))}m`;
 pillBar.style.width=`${Math.round(Math.min(1,st.best/G.points.at(-1).s)*100)}%`;
 if(frame.isOpen&&frame.tab==='map')paintMap(frame.panel('map'));
}
window.namsan.status=()=>({started:window.namsan.started,x:st.x,z:st.z,y:walkHeight(G,st),s:st.s,best:st.best,auto:st.auto,done:st.done,stamps:[...st.stamps],elapsed:st.elapsed,view,speed,stairs:stairsNow,
 multi:multi?.info()??null,metrics,gadget:gs.gadget,zoom:camera.zoom,interact:ix?{view:ix.view,action:ix.action,result:ix.result,progress:JSON.parse(JSON.stringify(ix.progress)),bino:ix.bino?{bearing:ix.bino.bearing,labels:ix.bino.labels.map(l=>l.name),focus:ix.bino.focus?.name??null,note:ix.bino.note}:null}:null,memory:performance.memory?{usedMB:Math.round(performance.memory.usedJSHeapSize/1048576)}:null,summitOpen:!summitBox.hidden,course:G.points.at(-1).s});
window.namsan.lampStats=()=>ns.lamps?.userData.count??null;window.namsan.lampsVisible=v=>{if(ns.lamps)ns.lamps.visible=!!v;}; // 점검용: 가로등 그림 켜고 끄기(성능 비교)
window.namsan.jump=s=>{jumpTo(G,st,s);shortcut=true;camBase=st.heading;look.yaw=0;return window.namsan.status();};
window.namsan.setAuto=on=>{st.auto=!!on;paintBig();return st.auto;};
// 점검용: 걷는 곳(x,z)에 서서 heading(라디안, 관악산 기준) 쪽을 봄. 걷는 곳이 아니면 false
window.namsan.goTo=(x,z,heading=null)=>{const ok=N.setPosition(st,{x,z,heading:heading??st.heading});if(ok){camBase=st.heading;look.yaw=0;look.pitch=0;}return ok;};
window.namsan.spots=()=>({spots:ia.userData.spots.map(({id,kind,action,x,y,z,face,radius})=>({id,kind,action,x,y,z,face,radius})),items:nsItems.map(({kind,n,x,z,y})=>({kind,n,x,z,y})),benches:nsBenches.map(({x,y,z,yaw})=>({x,y,z,yaw})),pads:G.walkPads});
window.namsan.multi=()=>multi?.info()??null;
// ── 상호작용 컨트롤러(namsan-interact.js) ──
let envInfo={};window.addEventListener('hiking:environment',e=>{envInfo=e.detail||{};});
const _v=new THREE.Vector3();
const projectWorld=(x,y,z)=>{_v.set(x,y,z).project(camera);return {x:(_v.x+1)/2*innerWidth,y:(1-_v.y)/2*innerHeight,visible:_v.z<1&&Math.abs(_v.x)<1.1&&Math.abs(_v.y)<1.1};};
const projectDir=(bearing,elevDeg)=>{const b=bearing*Math.PI/180,e=elevDeg*Math.PI/180;return projectWorld(camera.position.x+Math.sin(b)*Math.cos(e)*1000,camera.position.y+Math.sin(e)*1000,camera.position.z-Math.cos(b)*Math.cos(e)*1000);};
const nsPlayer=()=>{const pl=placeOfMe();return {x:st.x,z:st.z,heading:camBase+look.yaw,elevation:walkHeight(G,st),inSummit:pl.inSummit,busy:!summitBox.hidden};};
const placeOfMe=()=>({inSummit:Math.hypot(st.x-G.plaza.x,st.z-G.plaza.z)<=G.plaza.r});
ix=createNamsanInteract({spots:ia.userData.spots.filter(s=>s.action!=='lock'),items:nsItems,benches:[],busStops:[],player:nsPlayer,ui:ixUI,sound:quietSound,storage:multiMode?null:localStorage,
 stamps:()=>st.stamps,
 addStamp:n=>{if(st.stamps.includes(n))return false;st.stamps.push(n);const t=NAMSAN.stamps.find(x=>x.n===n);say(`<b>${t.glyph}</b>스탬프 ${st.stamps.length} / 4 · ${t.name}`);save();if(frame.isOpen&&frame.tab==='map')paintMap(frame.panel('map'));return true;},
 geo:(lat,lon)=>project(lat,lon),projectDir,projectWorld,cameraInfo:()=>({fov:camera.fov,aspect:camera.aspect,zoom:camera.zoom}),
 weather:()=>({kind:envInfo.kind??'clear',label:envInfo.weatherLabel??''}),gadget:()=>gs.gadget,
 summitCount:()=>{try{return summitOf(loadSummits(localStorage),'gwanak')?.count??0;}catch{return 0;}}});
// 내가 올린 돌: 큰 돌탑 꼭대기(그림 spots top)에 관악산 「올릴 돌」을 쌓아 보인다(이 기기 기록 수만큼, 최대 6개)
const cairnTop=ia.userData.spots.find(x=>x.id==='cairn-summit')?.top,myStones=new THREE.Group();myStones.name='내가 올린 돌';scene.add(myStones);
function paintStones(){const n=Math.min(6,ix.progress.stones);if(!cairnTop)return;while(myStones.children.length<n){const k=myStones.children.length,m=looseStone(11+k*7);toon.toonify(m,{kind:'prop'});m.position.set(cairnTop[0]+Math.sin(k*2.4)*.03,cairnTop[1]+.02+k*.055,cairnTop[2]+Math.cos(k*2.4)*.03);m.rotation.y=k*1.3;myStones.add(m);}}
paintStones();let lastResult=null;
window.namsan.interact=()=>ix;window.namsan.features=NAMSAN_MOUNTAIN.features;
if(q.has('debug'))Object.assign(window,{__ns:ns,__scene:scene,__land:landscape.group,__camera:camera,__THREE:THREE,__G:G,__avatar:avatar});   // 점검용(?debug)

// ── 준비 ──
await lighting.prepare?.();loading.done('environment');
// 첫 프레임 안정(관악산과 같은 규칙: 100ms 안 프레임이 12번 이어지면 준비 완료)
const stability=createStabilityCounter();let loadReady=false;
window.namsan.ready=true;
requestAnimationFrame(frame_);
// 도심 건물(서울 서·동 묶음)은 출발 뒤 뒤에서 이어 받는다(관악산과 같은 순서). 휴대폰은 도시 칸 상한(device-profile)을 그대로 따른다.
(async()=>{try{await landscape.streamRoads();lowerRoads();for(const c of landscape.manifest.cityChunks.filter(c=>/^seoul-/.test(c.id))){await landscape.streamCity(c.id);if(LIMITS.cityChunkGapMs)await new Promise(r=>setTimeout(r,LIMITS.cityChunkGapMs));}await landscape.finalizeCities?.();}catch(e){console.warn('도심 건물',e);}window.namsan.cityDone=true;})();
beginHike=()=>{
 if(!wantStart||window.namsan.started||!loadReady)return;
 window.namsan.started=true;loading.start();
 if(pendingJoin)joinMulti(pendingJoin);
 if(st.s>20&&!st.done)say('지난번 자리에서 이어 올라요');
 window.dispatchEvent(new CustomEvent('hiking:started'));
};
beginHike();
