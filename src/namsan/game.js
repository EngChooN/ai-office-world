// 남산 게임 화면(월드개발 11-19, /hiking/namsan/). 산 고르기(관악산 페이지)에서 남산 「오르기」를 누르면 이 페이지로 온다.
// 관악산 main.js(GPX·청크·즐길거리에 묶인 코드)는 건드리지 않고, 공통 부품만 그대로 가져다 쓴다:
//  - 그림: 카툰 빛·하늘·도심·한강·원경(createToonStyle·setupRendering·loadLandscape) + 남산 그림(월드아트 namsan-art.js)
//  - 동동이(loadToonHiker) · 조작(input.js 키·떠다니는 조이스틱·드래그) · 시점(view.js)
//  - 공통 화면 틀(ui-frame: 위 알약·💬·☰·큰 단추) · 채팅(hiking-chat-ui) · 함께 걷기(multi-client, 방만 남산 방) · 입장(entry.js·server-pick.js 공용 창)
// 걷기 규칙은 namsan-walk.js(three 없음, 시험 tests/namsan-game.test.mjs). 점검 scripts/verify-namsan-game.mjs.
// 콘솔 window.namsan: status()·jump(s)·setAuto(on)·multi() (점검·개발용)
import {serverReady} from '../server-link-pin.js';   // 맨 먼저: 함께 걷기 서버 주소 고르기(관악산 산 고르기와 같은 순서)
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
import {NAMSAN_SAVE_KEY,NAMSAN_ENTRY_KEY,NAMSAN_SERVERS,isNamsanRoom,namsanRoom,namsanHealth,createWalkState,saveData,stepWalk,walkHeight,heightAt,remainOf,jumpTo,wrapAngle,placeOf,walkable} from './namsan-walk.js';

const q=new URLSearchParams(location.search),BASE=import.meta.env.BASE_URL,$=s=>document.querySelector(s);
document.documentElement.dataset.icExp='hiking';
const mobile=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
if(mobile)document.body.classList.add('touch');
window.namsan={started:false};
// ── 로딩 화면 ──
const ld=$('#ns-loading'),ldSet=(pct,label)=>{ld.querySelector('[data-ns-ld-fill]').style.width=`${Math.round(pct)}%`;ld.querySelector('[data-ns-ld-pct]').textContent=`${Math.round(pct)}%`;if(label)ld.querySelector('[data-ns-ld-label]').textContent=label;};
const ldFail=e=>{ld.dataset.phase='error';ld.querySelector('[data-ns-ld-msg]').textContent=`불러오지 못했어요: ${e?.message??e}. 새로고침해 보세요.`;console.error(e);};
window.addEventListener('unhandledrejection',e=>{if(!window.namsan.started)ldFail(e.reason);});
ldSet(2,'그림 준비');

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
ldSet(10,'하늘·빛');
// 계절·시간·날씨: 관악산과 같은 규칙(서울 날짜, ?season=·?time=·?weather=, 산 고르기 자유 설정 값은 sessionStorage로 같은 탭에 남음)
const free=(()=>{try{return loadFree(sessionStorage);}catch{return loadFree(null);}})();
const seasons=createSeasonController({onChange:st=>toon.setSeason(st.season)});
if(free.season)seasons.set(free.season);toon.setSeason(seasons.season,{instant:true});
setInterval(()=>seasons.tick(),60000);
if(free.time)setTimeOverride(presetClock(free.time));
// 남산 코스·공원 안 OSM 건물 33동은 숨긴다(그림 인계 §3-2). 도시 격자 코드(공용)를 바꾸지 않고 이 페이지에서 받을 때 거른다.
const hideIds=new Set((await (await fetch(`${BASE}assets/shared/namsan/city-hide.json`)).json()).ids);
{const raw=window.fetch.bind(window);window.fetch=async(url,o)=>{const r=await raw(url,o);if(!/generated\/seoul-(west|east)-\d+\.json/.test(String(url))||!r.ok)return r;const j=await r.json();j.buildings=j.buildings.filter(b=>!hideIds.has(b.id));return new Response(JSON.stringify(j),{status:200,headers:{'content-type':'application/json'}});};}
const landscape=await loadLandscape({base:`${BASE}assets/realistic/generated/`,chunkBase:`${BASE}assets/shared/chunks/`,maxContactMapSize:renderer.capabilities.maxTextureSize,materialFactory:toon.materialFactory,toon:{toonify:toon.toonify,patchFoliage:toon.patchFoliage,styleCity:toon.styleCity,natureParts:toon.natureParts}});
for(const child of landscape.group.children)if(!['SeoulCity2km','SeoulFar','HanRiverAndWater'].includes(child.name))toon.toonify(child,{kind:'prop'});
scene.add(landscape.group); // 관악산 풀밭(toon.attachLandscape)은 관악산 길을 따르므로 붙이지 않는다(그림 인계 §3-3)
const lighting=setupRendering(renderer,scene,camera,mobile,{toon});
if(free.weather)lighting.environment?.weather?.setOverride(free.weather);
ldSet(30,'남산 지형');
const data=await loadNamsanData(`${BASE}assets/shared/namsan/`);
const G=createNamsanGround(data);
ldSet(50,'성곽·계단·숲');
// 휴대폰: 길에서 먼 나무를 덜 심고(200m 안은 그대로) 지형 칸을 크게 묶어 그리기 횟수를 줄인다(11-19 측정: 숲이 휴대폰 삼각형의 약 70%, 지형 칸 500~700번)
const MOBILE_KEEP=d=>d<60?1:d<200?.7:d<400?.35:d<800?.15:.08;
const ns=buildNamsan({G,data,toon,mobile,...(mobile&&q.get('lite')!=='0'?{terrainTile:250,forestKeep:MOBILE_KEEP,forestNear:30}:{})});scene.add(ns.root);
await landscape.streamFar();await landscape.streamWater();
// 원경: 관악산 원경 땅이 남산 판을 뚫지 않게 남산 판 안쪽만 내리고, 원경의 「N서울타워」 모형은 숨긴다(게임 속 전망탑으로 대신, 그림 인계 §3-1)
{const far=landscape.group.getObjectByName('SeoulFar'),B=G.bounds;
 far?.traverse(o=>{if(/N서울타워/.test(o.name))o.visible=false;});
 const ground=far?.children.find(o=>o.isMesh)?.geometry;if(ground){const p=ground.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(x>B.x0+20&&x<B.x1-20&&z>B.z0+20&&z<B.z1-20)p.setY(i,Math.min(p.getY(i),G.ground(x,z)-12));}p.needsUpdate=true;ground.computeVertexNormals();}}
ldSet(70,'동동이');
const hikerUrl=`${BASE}assets/toon/models/hiker/HikerRig.glb`;
const hiker=await loadToonHiker(hikerUrl);const avatar=hiker.scene;toon.toonify(avatar,{kind:'character'});
avatar.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});scene.add(avatar);

// ── 상태(이어 오르기: 이 기기에 저장, 함께 걷기 ?multi 주소는 저장 안 함) ──
let saved=null;try{saved=JSON.parse(localStorage.getItem(NAMSAN_SAVE_KEY)??'null');}catch{}
const st=createWalkState(G,q.get('start')==='summit'?null:saved);
if(q.get('start')==='summit')jumpTo(G,st,G.points.at(-1).s-20);
let shortcut=q.get('start')==='summit';
const save=()=>{if(multiMode)return;try{localStorage.setItem(NAMSAN_SAVE_KEY,JSON.stringify(saveData(st)));}catch{}};
const look=createLook(),camFollow=createHeightFollow();let view='third',camBase=st.heading,speed=0,walkPhase=0,moving=false,runHeld=false;

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
<p class="ns-credits">걷기: 왼쪽 아래 손가락(조이스틱)·WASD, 둘러보기: 드래그·Q/E, 빨간 단추·R = 자동 걷기, V = 시점.<br>지형: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. 길·성곽·건물: © OpenStreetMap contributors (ODbL). 전망탑·광장·소품·이정표 문구는 게임 속 디자인이에요.</p></section>`;
  p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ns==='face')faceForward(look);else if(b.dataset.ns==='people'){const on=document.body.classList.toggle('ns-multi-open');b.setAttribute('aria-pressed',String(on));frame.close();}else if(b.dataset.ns==='pick')location.assign(new URL('../'+location.search.replace(/([?&])multi=[^&]*&?/,'$1').replace(/[?&]$/,''),location.href).href);else if(b.dataset.nsJump){jumpTo(G,st,Number(b.dataset.nsJump));shortcut=true;camBase=st.heading;look.yaw=0;sendJump=true;frame.close();}});}},
]});
const topl=document.createElement('div');topl.className='hk-topl';topl.innerHTML=`<div class="hk-topl-r1"><button type="button" class="hk-pill" aria-label="남산 진행"><b class="hk-pill-t">출발 전</b><i class="hk-pill-bar" aria-hidden="true"><i></i></i></button><button type="button" id="view" aria-label="시점 바꾸기 (V)"><em aria-hidden="true">${icon('h-view',{size:'s'})}</em><span>3인칭</span></button></div><div class="hk-topl-r2"></div>`;
document.body.append(topl);
const pillT=topl.querySelector('.hk-pill-t'),pillBar=topl.querySelector('.hk-pill-bar>i'),viewBtn=topl.querySelector('#view');
topl.querySelector('.hk-pill').addEventListener('click',()=>frame.toggle('map'));
viewBtn.addEventListener('click',()=>command('view'));
const big=document.createElement('button');big.type='button';big.className='ns-big';big.setAttribute('aria-label','자동 걷기 (R)');
const runBtn=document.createElement('button');runBtn.type='button';runBtn.className='ns-run';runBtn.setAttribute('aria-label','달리기(누르고 있는 동안)');runBtn.innerHTML='<span aria-hidden="true">»</span><span>달리기</span>';
document.body.append(big,runBtn);
big.addEventListener('click',()=>command('auto'));
for(const [ev,on] of [['pointerdown',true],['pointerup',false],['pointercancel',false],['pointerleave',false]])runBtn.addEventListener(ev,()=>{runHeld=on;runBtn.classList.toggle('on',on);});
const paintBig=()=>{big.innerHTML=st.auto?`<span class="ns-big-ic">${icon('c-stop',{size:'l',fallback:'■'})}</span><span>멈추기</span>`:`<span class="ns-big-ic">${icon('h-walk',{size:'l',fallback:'🥾'})}</span><span>${st.done?'둘러보기':'걷기'}</span>`;};
paintBig();ufPlace(document.body,{big,small:[runBtn]});
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
function command(id){
 if(!window.namsan.started)return;
 if(id==='auto'){if(st.done){say('정상이에요 · 조이스틱으로 광장을 둘러보세요');return;}st.auto=!st.auto;paintBig();}
 else if(id==='view'){view=view==='third'?'first':'third';viewBtn.querySelector('span').textContent=view==='third'?'3인칭':'1인칭';}
 else if(id==='face-forward')faceForward(look);
 else if(id==='escape'){if(!summitBox.hidden)summitBox.hidden=true;else frame.close();}
 else if(id==='map-toggle')frame.toggle('map');
 else if(id==='interact'||id==='emote-menu')multi?.greetKey?.();   // F·X = 앞사람에게 인사(관악산과 같은 키)
}
const input=bindInput(command,(dx,dy)=>turnLook(look,dx,dy),dz=>{if(view==='third')look.orbit=THREE.MathUtils.clamp(look.orbit+dz,2.2,12);},{mode:()=>'none',interact:()=>!!multi?.greet?.().target,panel:()=>frame.isOpen});

// ── 함께 걷기(공용 multi-client, 방은 남산 방). 서버 코드·서버 목록은 그대로 ──
let multi=null,multiBusy=Promise.resolve();
const multiServer=()=>hikingServerUrl();
const multiStatus=detail=>window.dispatchEvent(new CustomEvent('hiking:multi-status',{detail}));
const multiLocal={nudge:()=>false,here:()=>null,sample:null,minS:0,maxS:0,
 walk:()=>({auto:!!st.auto,moving,steering:false,base:speed}),
 position:()=>({zone:'plaza',x:st.x,y:walkHeight(G,st),z:st.z,heading:st.heading}),
 setPosition:pos=>{if(!Number.isFinite(pos?.x)||!walkable(G,pos.x,pos.z))return false;st.x=pos.x;st.z=pos.z;if(Number.isFinite(pos.heading))st.heading=pos.heading;st.auto=false;const p=placeOf(G,st.x,st.z);if(p.hit.distance<4)st.s=p.hit.s;return true;},
 speed:()=>speed,sit:()=>false,run:()=>!!st.running,gadget:()=>'none',selfie:()=>false,busy:()=>false,place:()=>null,
 act:()=>({pose:'stand',gadget:'none',selfie:false,trail:null,action:null}),shown:()=>null,propFor:()=>null};
joinMulti=({room=null,name=null}={})=>{multiBusy=multiBusy.then(async()=>{
 if(!window.namsan.ready)return;   // 화면 준비 뒤 pendingJoin으로 다시 부른다
 if(multi&&room===multi.room)return;if(multi)leaveMultiNow();
 const r=isNamsanRoom(room)?room:namsanRoom();
 multiStatus({state:'connecting',room:r,count:0,transport:multiServer()?'server':'local'});
 const {mountMultiplayer}=await import('../multi-client.js');
 multi=await mountMultiplayer({scene,camera,night:null,hikerUrl,prepareGltf:prepareToonHikerGltf,groundHeight:(x,z)=>heightAt(G,x,z),command,room:r,name,serverUrl:multiServer(),local:multiLocal,toonify:toon.toonify});
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
const night=()=>lighting.environment?.current?.night??0;
function frame_(now){
 requestAnimationFrame(frame_);
 const dtRaw=Math.min(.1,(now-last)/1000);last=now;const started=window.namsan.started,dt=started?dtRaw:0;
 const cmd=started?input.read():{forward:0,side:0,run:false,turn:0};
 if(multi?.frozen||!summitBox.hidden)Object.assign(cmd,{forward:0,side:0,run:false,turn:0});
 updateLook(look,dtRaw,cmd.turn);
 const direct=!!(cmd.forward||cmd.side);
 // 직접 걷기는 카메라가 보는 쪽 기준(관악산 광장과 같음), 자동 걷기는 카메라가 걷는 방향을 천천히 따라 돈다
 if(direct){st.heading=wrapAngle(camBase+look.yaw);camBase=st.heading;look.yaw=0;}
 const r=stepWalk(G,st,{forward:cmd.forward,side:cmd.side,yaw:st.heading,run:cmd.run||runHeld,auto:st.auto},dt);
 speed=r.speed;moving=r.moved>1e-5;stairsNow=r.stairs;
 if(!direct&&st.auto){const d=wrapAngle(st.heading-camBase);camBase=wrapAngle(camBase+d*Math.min(1,dtRaw*2.2));}
 if(started){st.elapsed+=dtRaw;}
 if(r.stamp){const t=NAMSAN.stamps.find(x=>x.n===r.stamp);say(`<b>${t.glyph}</b>스탬프 ${st.stamps.length} / 4 · ${t.name}`);if(frame.isOpen&&frame.tab==='map')paintMap(frame.panel('map'));}
 if(r.summit){paintBig();showSummit();save();}
 if(st.auto!==prevAuto){prevAuto=st.auto;paintBig();}
 const y=walkHeight(G,st),heading=camBase+look.yaw;
 avatar.position.set(st.x,y,st.z);
 if(first){hiker.snapTo(st.heading);first=false;}
 else if(moving)hiker.turnTo(direct?heading:r.heading,dtRaw);
 const k=courseAt(G.points,st.s),slope=moving?(()=>{const a=courseAt(G.points,st.s-1.5),b=courseAt(G.points,st.s+1.5);return (b.y-a.y)/3*Math.sign(Math.cos(r.heading-k.heading));})():0;
 const gait=gaitFor(slope,stairsNow?'stairs':'paved',slope<0?-1:1),stepLength=gait.stride*strideScaleFor(hiker.strideScale,!!st.running,stairsNow);
 walkPhase+=r.moved/Math.max(.1,stepLength)*(cmd.forward<0?-1:1);
 const surface=(x,z)=>heightAt(G,x,z);
 hiker.update({clip:!moving?'Idle':slope>.15?'Climb':'Walk',distance:walkPhase,stride:1,stepLength,stairs:stairsNow,idleSeconds:now/1000,slope,pose:'stand',teaProgress:0,running:!!st.running,speed,dt:dtRaw,surfaceHeight:surface,gadget:'none',selfie:false,lookYaw:wrapAngle(heading-avatar.rotation.y),lookPitch:look.pitch});
 hiker.ground({moving,phase:walkPhase,surfaceHeight:surface,pose:'stand'});
 multi?.afterLocalGround(hiker,null,now/1000);
 // 카메라(관악산 main.js와 같은 식): 3인칭은 동동이 뒤·위, 1인칭은 눈높이. 땅 밑으로 들어가지 않게 지형 위 0.5m로 올린다
 const smoothY=followHeight(camFollow,y,cameraReady?dtRaw:0);
 fwd.set(-Math.sin(heading),0,-Math.cos(heading));
 if(view==='first'){camGoal.set(st.x,smoothY+hiker.eyeHeight,st.z);lookGoal.copy(camGoal).addScaledVector(fwd,10);lookGoal.y+=Math.tan(THREE.MathUtils.clamp(look.pitch+(hiker.viewPitch??0),-1.3,1.3))*10;camera.position.copy(camGoal);}
 else{const cs=hiker.profile?.cameraScale??1;lookGoal.set(st.x,smoothY+(1.15-(1.6-hiker.eyeHeight)*2/3),st.z);camGoal.copy(lookGoal).addScaledVector(fwd,-look.orbit*cs*Math.cos(look.pitch));camGoal.y+=cs*(1-look.orbit*Math.sin(look.pitch));
  const gy=G.ground(camGoal.x,camGoal.z)+.5;if(camGoal.y<gy)camGoal.y=gy;camera.position.copy(camGoal);}
 {const co=window.namsan.cameraOverride;if(co){camera.position.fromArray(co.p);lookGoal.fromArray(co.t);}}
 camera.lookAt(lookGoal);cameraReady=true;
 landscape.update(camera,quality);ns.update(now/1000,night());
 if(multi)multi.update(dtRaw,now/1000,view);
 lighting.render(avatar.position);
 if(now-uiAt>200){uiAt=now;paintHud();}
 if(started&&now-saveAt>1000){saveAt=now;save();}
 if(!document.hidden&&dtRaw>0){fpsN++;fpsSum+=dtRaw;}
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
 multi:multi?.info()??null,metrics,memory:performance.memory?{usedMB:Math.round(performance.memory.usedJSHeapSize/1048576)}:null,summitOpen:!summitBox.hidden,course:G.points.at(-1).s});
window.namsan.jump=s=>{jumpTo(G,st,s);shortcut=true;camBase=st.heading;look.yaw=0;return window.namsan.status();};
window.namsan.setAuto=on=>{st.auto=!!on;paintBig();return st.auto;};
window.namsan.multi=()=>multi?.info()??null;
if(q.has('debug'))Object.assign(window,{__ns:ns,__scene:scene,__land:landscape.group});   // 점검용(?debug)

// ── 준비 ──
ldSet(85,'셰이더 준비');
await lighting.prepare?.();
ldSet(100,'출발 준비 끝');
window.namsan.ready=true;
requestAnimationFrame(frame_);
// 도심 건물(서울 서·동 묶음)은 출발 뒤 뒤에서 이어 받는다(관악산과 같은 순서). 휴대폰은 도시 칸 상한(device-profile)을 그대로 따른다.
(async()=>{try{await landscape.streamRoads();for(const c of landscape.manifest.cityChunks.filter(c=>/^seoul-/.test(c.id))){await landscape.streamCity(c.id);if(LIMITS.cityChunkGapMs)await new Promise(r=>setTimeout(r,LIMITS.cityChunkGapMs));}await landscape.finalizeCities?.();}catch(e){console.warn('도심 건물',e);}window.namsan.cityDone=true;})();
beginHike=()=>{
 if(!wantStart||window.namsan.started)return;
 window.namsan.started=true;ld.classList.add('leaving');setTimeout(()=>ld.remove(),700);
 if(pendingJoin)joinMulti(pendingJoin);
 if(st.s>20&&!st.done)say('지난번 자리에서 이어 올라요');
 window.dispatchEvent(new CustomEvent('hiking:started'));
};
beginHike();
