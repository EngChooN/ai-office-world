// 온라인 인형뽑기 「동동이 인형가게」(월드개발, 2026-11-23). 온라인 시리즈 ④.
// 기획 docs/인형뽑기(월드기획 MVP), 화면·조작 월드디자인 설계 v1, 가게·기계·인형 그림 월드아트(claw-shop-art·claw-machine-art·claw-plush·claw-guest).
// 이 파일: 렌더러·카툰 후처리·실내 빛(SHOP_LIGHT), 내 동동이 걷기(키보드·떠다니는 조이스틱)·3인칭 카메라·부딪힘, 기계 앞 → 한 판(claw-play.js)·조작 카메라,
//          코인·도감 저장(claw-rules.js), 화면(claw-hud.js)·채팅(공용 hiking-chat-ui, ns 'claw')·같은 가게 손님(claw-multi.js)·서버 고르기(공용).
// 다른 회사 캐릭터 손님 인형은 VITE_CLAW_PRIVATE=1 개발 서버에서만 들어온다(claw-guest.js). 공개 빌드에는 자리만 있고 우리 인형으로 바뀐다.
import {serverReady} from '../server-link-pin.js';   // 맨 먼저: 서버 주소 고르기 시작(공개 파일 multi-server.json)
import * as THREE from 'three';
import {createToonStyle} from '../toon/index.js';
import {composeEnvironment} from '../daytime.js';
import {createInput} from '../lounge/input.js';
import {serverPickMode,createServerPick,NAME_KEY} from '../server-pick.js';
import '../server-pick.css';
import {takeEntryChoice,enterWith} from '../entry.js';
import {loadShared,saveShared,volumeGain} from '../shared-settings.js';
import {currentChoice} from '../server-link.js';
import {findServer} from '../multi-protocol.js';
import {installHikingChat} from '../hiking-chat-ui.js';
import {openWin,closeWin} from '../ui-frame.js';
import {buildClawShop,SHOP,SHOP_LIGHT,SHADOW_LAYER} from './claw-shop-art.js';
import {CLAW,setSignThumbs} from './claw-machine-art.js';
import {TIMER} from './claw-machines-more.js';
import {makePlush} from './claw-plush.js';
import {MACHINES,RARITY,RARITY_ORDER} from './claw-palette.js';
import {loadGuests,makeGuestPlush,clawCatalog,resolvePool,isGuestId} from './claw-guest.js';
import {createClawAvatar,WALK_SPEED,RUN_MUL} from './claw-avatar.js';
import {createClawPlay} from './claw-play.js';
import {createClawAudio} from './claw-audio.js';
import {createClawHud} from './claw-hud.js';
import {createClawMulti,cleanName} from './claw-multi.js';
import {CLAW_TUNING,loadState,saveState,grantDaily,canPlay,spendCoin,recordResult,pityNow,kindOf,KIND_INFO,machStateToday,saveMachState} from './claw-rules.js';
import {plushSize} from './claw-plush.js';
import {isBoxPlush} from './claw-palette.js';
import {makeBoxPrize} from './claw-bridge.js';
import {currentCarry,onCarry,carryAct,carryHide} from '../carry/carry-store.js';
import {setCarryEnv} from '../carry/carry-attach.js';
import {CARRY_ART} from '../carry/carry-art.js';

const q=new URLSearchParams(location.search);
const mobile=q.get('mobile')==='1'||matchMedia('(pointer:coarse)').matches||/iPhone|iPad|Android/i.test(navigator.userAgent);
if(mobile)document.body.classList.add('touch');
const RIG_URL=`${import.meta.env.BASE_URL}assets/toon/models/hiker/HikerRig.glb`;
const loading=document.getElementById('loading'),setLoad=t=>{const el=loading?.querySelector('.ld-msg');if(el)el.textContent=t;};
const T=CLAW_TUNING;

// ── 렌더러(흡연장·크리스마스와 같은 설정)
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:q.has('capture')});renderer.info.autoReset=false;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.id='scene';document.body.prepend(renderer.domElement);
const L=SHOP_LIGHT,scene=new THREE.Scene();scene.background=new THREE.Color(L.background);
const BASE_FOV=mobile?62:55;
const camera=new THREE.PerspectiveCamera(BASE_FOV,innerWidth/innerHeight,.05,200);
setLoad('가게 불 켜는 중…');
const toon=await createToonStyle({renderer,scene,camera,mobile});
// 실내 빛: 반구광 + 위에서 비추는 그림자 빛 하나(월드아트 SHOP_LIGHT, 미리보기와 같은 값). 후처리 값은 낮 환경으로 맞춤
const hemi=new THREE.HemisphereLight(L.hemi.sky,L.hemi.ground,L.hemi.intensity);
const key=new THREE.DirectionalLight(L.key.color,L.key.intensity);key.position.set(...L.key.pos);key.castShadow=true;key.shadow.mapSize.set(mobile?1024:L.key.shadow.map,mobile?1024:L.key.shadow.map);
{const ss=Math.max(L.key.shadow.size,SHOP.w/2+1);Object.assign(key.shadow.camera,{left:-ss,right:ss,top:ss,bottom:-ss,near:1,far:30});} // 14 × 11m 가게 전체가 그림자 안에
key.shadow.bias=-.0006;key.shadow.normalBias=.03;
scene.add(hemi,key,key.target);renderer.toneMappingExposure=L.exposure;
toon.pipeline.update(composeEnvironment({sun:{elevation:45,azimuth:160},moon:{elevation:-20,azimuth:0,illumination:.5}}));
document.documentElement.dataset.hudTime='day';
const world=new THREE.Group();world.name='world';scene.add(world);

// ── 손님 인형(개발용 비공개 자료가 있을 때만) → 가게
setLoad('인형 쌓는 중…');
const guests=await loadGuests();
const guestProtos=new Map();for(const g of guests)guestProtos.set(g.id,await makeGuestPlush(g.id,guests,{toonify:toon.toonify}));
const guestObject=id=>guestProtos.get(id).clone(true);
const shop=buildClawShop({toonify:toon.toonify,mobile,guests,guestObject,kinds:true,T}); // 기계 16대 종류대로(집게 6·봉 4·타이머 3·열쇠 3, 설계 v4.1)
world.add(shop);
const U=shop.userData;
const catalog=clawCatalog(guests),pools=MACHINES.map(M=>resolvePool(M.kind==='key'?M.cells??M.pool:M.pool,guests)); // 열쇠 기계는 칸 8개(MACHINES cells)
const infoOf=id=>catalog.find(c=>c.id===id);
const rarityOf=id=>infoOf(id)?.rarity??'common';
const rareOf=id=>!!id&&RARITY_ORDER.indexOf(rarityOf(id))>=RARITY_ORDER.indexOf(T.notice.minRarity);
const makePlushObj=id=>{if(isBoxPlush(id))return makeBoxPrize(id,{toonify:toon.toonify,box:T.bridge.box});if(isGuestId(id)&&guestProtos.has(id)){const o=guestObject(id);o.userData.size??=RARITY[rarityOf(id)].size;return o;}const o=makePlush(id,{toonify:toon.toonify});o.userData.size??=RARITY[rarityOf(id)]?.size??.24;return o;};
const sizeOf=id=>isBoxPlush(id)?T.bridge.box[1]:isGuestId(id)?RARITY[rarityOf(id)].size:plushSize(id);
// 기계 좌표 (x,z) → 가게 좌표(기계 방향을 돌림, 11-23 기계 16대: 봉은 +X, 열쇠는 −Z를 봄)
const toShop=(M,x,z)=>{const c=Math.cos(M.heading??0),sn=Math.sin(M.heading??0);return [M.x+x*c+z*sn,M.z-x*sn+z*c];};

// ── 저장(이 기기): 코인·도감·보장 수·기록. 그날 첫 접속이면 무료 코인
const state=loadState(undefined,{isKnown:id=>!!infoOf(id)});
const granted=grantDaily(state);saveState(state);
const syncShowcase=()=>U.showcase.set(Object.keys(state.dex).filter(id=>!isGuestId(id)));
syncShowcase();

// ── 내 동동이
setLoad('동동이 가게 들어가는 중…');
const profile={nickname:(()=>{try{return cleanName(localStorage.getItem(NAME_KEY)??'');}catch{return '';}})()};
const player=await createClawAvatar({rigUrl:RIG_URL,toon,name:profile.nickname||'동동이',id:'me'});
world.add(player.root);
// 든 인형(11-25 인형 자랑, 대표 결정: 인형가게 안에서만 보임): 걸을 때 보이고 기계 앞에서 뽑는 동안만 숨김. 실내라 빛 세기 하나(CARRY_ART.glow.shop)
setCarryEnv({camera,daylight:CARRY_ART.glow.shop});player.carry.set(currentCarry());onCarry(c=>player.carry.set(c));
// 들어온 자리: 문 안쪽, 기계 쪽을 봄(아바타 heading 0 = −Z)
player.place(SHOP.spawn.x+(Math.random()-.5)*.8,SHOP.spawn.z,0);

// ── 부딪힘: 가게 안 네모(SHOP.walk) 안, 기계·진열장·의자·화분·가운데 인형 밖으로 민다
const R=.22;
// 손에 받쳐 든 인형(11-25 ③ 어깨 높이): 몸 오른쪽 약 0.4m까지 나와 기계 옆을 지나면 기계 속으로 파고들었다 →
//  든 동안만 인형 자리에 작은 원(handRing)을 하나 더 두고 기계·진열장(네모)에서 몸째 밀어낸다. 의자(동그라미)는 낮아서 안 봄.
//  handRing = {r 오른쪽, f 앞, rad} 몸 기준, 지난 프레임 인형 모양에서 잼(updatePlayer 끝)
let handRing=null;
function pushBox(c,x,z,rad,ox=0,oz=0){ // 원(x+ox,z+oz,rad)이 네모 c에 겹치면 몸(x,z)을 밀어낸 자리
 const px=x+ox,pz=z+oz,nx=Math.min(Math.max(px,c.x0),c.x1),nz=Math.min(Math.max(pz,c.z0),c.z1),dx=px-nx,dz=pz-nz,d=Math.hypot(dx,dz);
 if(d>=rad)return null;
 if(d>1e-6)return {x:nx+dx/d*rad-ox,z:nz+dz/d*rad-oz};
 const o=[[c.x0-rad-px,0],[c.x1+rad-px,0],[0,c.z0-rad-pz],[0,c.z1+rad-pz]].sort((a,b)=>Math.abs(a[0]+a[1])-Math.abs(b[0]+b[1]))[0];return {x:x+o[0],z:z+o[1]};
}
function collide(x,z,heading=null){
 const w=SHOP.walk;x=Math.min(Math.max(x,w.x[0]),w.x[1]);z=Math.min(Math.max(z,w.z[0]),w.z[1]);
 const H=heading!=null?handRing:null;let ox=0,oz=0;
 if(H){const s=Math.sin(heading),c=Math.cos(heading);ox=c*H.r-s*H.f;oz=-s*H.r-c*H.f;}
 for(let pass=0;pass<2;pass++){
  for(const c of U.colliders){
   if(c.r!==undefined){const dx=x-c.x,dz=z-c.z,d=Math.hypot(dx,dz),m=c.r+R;if(d<m&&d>1e-6){x=c.x+dx/d*m;z=c.z+dz/d*m;}}
   else{const g=pushBox(c,x,z,R);if(g){x=g.x;z=g.z;}}
  }
  if(H){for(const c of U.colliders)if(c.r===undefined){const g=pushBox(c,x,z,H.rad,ox,oz);if(g){x=g.x;z=g.z;}}
   // 벽: 걷는 네모는 몸 반지름만큼 벽 안쪽이라, 인형은 R − rad만큼 더 나가도 됨
   const m=R-H.rad;x=Math.min(Math.max(x+ox,w.x[0]-m),w.x[1]+m)-ox;z=Math.min(Math.max(z+oz,w.z[0]-m),w.z[1]+m)-oz;}
  x=Math.min(Math.max(x,w.x[0]),w.x[1]);z=Math.min(Math.max(z,w.z[0]),w.z[1]);
 }
 return {x,z};
}
// 밀어내도 인형이 남는 곳(벽 쪽 몸 폭만 한 좁은 틈): 인형이 더 파고드는 쪽으로는 안 감(덜 파고드는 쪽은 감 → 갇히지 않음)
function handPen(x,z,heading){
 const H=handRing;if(!H)return 0;const s=Math.sin(heading),c=Math.cos(heading),px=x+c*H.r-s*H.f,pz=z-s*H.r-c*H.f;let pen=0;
 for(const b of U.colliders)if(b.r===undefined){const d=Math.hypot(px-Math.min(Math.max(px,b.x0),b.x1),pz-Math.min(Math.max(pz,b.z0),b.z1));pen=Math.max(pen,H.rad-d);}
 return pen;
}
function measureHand(){
 const b=player.carry.bounds('hand');if(!b){handRing=null;return;}
 const cx=(b.min.x+b.max.x)/2-player.x,cz=(b.min.z+b.max.z)/2-player.z,s=Math.sin(player.heading),c=Math.cos(player.heading);
 handRing={r:cx*c-cz*s,f:-(cx*s+cz*c),rad:Math.min(.16,Math.max(b.max.x-b.min.x,b.max.z-b.min.z)/2)};
}

// ── 소리
const shared=loadShared();
const audio=createClawAudio({muted:shared.has?!shared.sound:false,volume:shared.has?volumeGain(shared.volume):1});
const vibrate=ms=>{if(!audio.muted)try{navigator.vibrate?.(ms);}catch{}};

// ── 인형 작은 그림(도감·결과 카드): 작은 캔버스 렌더러로 한 번만 그려 그림 주소로 둔다
const thumbs=new Map();
function makeThumbs(){
 let r=null;try{
  const S=128;r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(S,S,false);r.setPixelRatio(1);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.NeutralToneMapping;r.setClearColor(0,0);
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight('#fff6e8','#d9c6a4',1.6));const d=new THREE.DirectionalLight('#fff1dc',2.2);d.position.set(1.5,3,4);sc.add(d);
  const cam=new THREE.PerspectiveCamera(30,1,.01,10);
  for(const c of catalog){const o=makePlushObj(c.id);sc.add(o);const b=new THREE.Box3().setFromObject(o),sz=b.getSize(new THREE.Vector3()),ctr=b.getCenter(new THREE.Vector3());
   const dist=Math.max(sz.y,sz.x)*.62/Math.tan(THREE.MathUtils.degToRad(15));cam.position.set(ctr.x+dist*.18,ctr.y+dist*.12,ctr.z+dist);cam.lookAt(ctr);
   r.render(sc,cam);thumbs.set(c.id,r.domElement.toDataURL('image/png'));sc.remove(o);}
 }catch(e){console.warn('[claw] 인형 그림 못 만듦',e);}
 finally{try{r?.dispose();r?.forceContextLoss();}catch{}}
}
makeThumbs();
setSignThumbs(id=>thumbs.get(id)); // 기계 간판 오른쪽 대표 인형 그림(월드아트 signAtlas)

// ── 한 판(집게)·결과
let hud=null,multi=null,runOn=false;
const play=createClawPlay({shop,pools,makePlushObj,sizeOf,rarityOf,toonify:toon.toonify,audio,rareOf,
 pityFor:i=>pityNow(state,MACHINES[i].id),
 machState:i=>machStateToday(state,MACHINES[i].id), // 봉 상자 자리: 이 기기에 오늘까지(혼자 뽑기, v4.1 §3 A안)
 onEvent(type,d){
  if(type==='bump')vibrate(10);
  else if(type==='mach'){saveMachState(state,MACHINES[d.machine].id,d.st);saveState(state);}
  else if(type==='reset')hud?.toast(`${MACHINES[d.machine].name} 상자를 다시 놓았어요`,{sec:2.6});
  else if(type==='drop'&&d.res?.kind==='pending'){hud?.toast(d.auto?'시간 끝! 집게 내려가는 중…':'집게 내려가는 중…',{sec:2,urgent:true});}
  else if(type==='start'&&d.staff&&d.kind==='claw'){hud?.toast('직원이 인형 하나를 구멍 바로 뒤에 세워 줬어요!',{sec:2.6,urgent:true});} // 집게 직원 도움: 뽑을 때까지 판마다
  else if(type==='start'&&d.staff){state.pity[MACHINES[d.machine].id]=0;saveState(state);hud?.toast('직원이 상자를 처음 자리에 다시 놓아 줬어요!',{sec:2.6,urgent:true});} // 봉 직원 도움: 다시 놓으면 실패 수를 처음부터
  else if(type==='start'&&d.pity&&d.kind!=='bridge'&&d.kind!=='claw'){hud?.toast(`이번 판은 ${({timer:'넓은 성공 칸',key:'넓은 구멍'})[d.kind]}예요!`,{sec:2.6,urgent:true});}
  else if(type==='result'){
   const M=MACHINES[d.machine],res=d.res,rec=recordResult(state,M.id,res);saveState(state);
   if(res.kind==='win'){syncShowcase();player.cheer();vibrate(40);}else player.sigh();
   if(state.plays>=3)document.documentElement.toggleAttribute('data-claw-old',true);
   hud.showResult({res,machine:d.machine,kind:d.kind,isNew:rec.isNew,count:rec.count,fails:state.pity[M.id]??0,coins:state.coins});
  }
 }});
let side=0; // 집게 「👁 옆에서」 시점(설계 v2 §4): 0 = 정면, 1 = 오른쪽 옆, -1 = 왼쪽 옆(「반대쪽에서 보기」로 바꿈)

function startPlay(i,{confirmed=false}={}){
 if(play.mode!=='idle')return false;
 if(play.busy(i)){hud.toast(`${multi?.nameOf(play.busy(i))??'다른 손님'}님이 뽑는 중이에요. 다른 기계를 써 보세요`);return false;}
 if(!canPlay(state)){hud.showNoCoin();return false;}
 // 그 기계 첫 판: 규칙 카드 먼저(코인은 「시작하기」를 눌러야 씀, 설계 v3 D)
 const mid=MACHINES[i].id;if(!state.seen[mid]&&!confirmed){hud.showRules(i,{first:true});return false;}
 if(!state.seen[mid]){state.seen[mid]=true;}
 spendCoin(state,mid);saveState(state);
 const M=U.machines[i],s=M.stand;player.place(s.x,s.z,M.heading);runOn=false;side=0;
 play.start(i);return true;
}
function nearMachine(){let best=-1,bd=2.0;U.machines.forEach((M,i)=>{const d=Math.hypot(player.x-M.stand.x,player.z-M.stand.z);if(d<bd){bd=d;best=i;}});return best;}
// 같은 종류 중 걷는 거리가 가장 짧은 빈 기계(설계 v4 §4-2 「옆 빈 집게로 →」, 아슬아슬한 기계를 골라 주지 않음 — 거리로만). 없으면 -1
function nearestFree(kind,not=-1){let best=-1,bd=Infinity;U.machines.forEach((M,i)=>{if(i===not||M.kind!==kind||play.busy(i))return;const d=Math.hypot(player.x-M.stand.x,player.z-M.stand.z);if(d<bd){bd=d;best=i;}});return best;}
// 「가기」: 화면 0.4초 어두워졌다가 그 기계 앞(설계 §2 ☰ 기계)
const fade=document.createElement('div');fade.style.cssText='position:fixed;inset:0;z-index:65;background:#3a2b22;opacity:0;pointer-events:none;transition:opacity .2s';document.body.append(fade);
function goMachine(i){if(play.mode!=='idle'||!U.machines[i])return;fade.style.opacity='1';setTimeout(()=>{const M=U.machines[i],[x,z]=toShop(M,0,CLAW.stand.z+.15);player.place(x,z,M.heading);cam.yaw=M.heading;cam.pitch=.3;fade.style.opacity='0';},200);}

// ── 같은 가게 손님(구경)
let lastNotice=-Infinity;
function onRemoteAct(id,a,prev,name){
 play.watch(id,a);
 // 그 손님 동동이 자세(월드아트 claw-poses.js): 조작 중 두 손을 조작대에, 성공 만세·실패 고개 숙임
 const av=multi?.avatarOf(id);
 if(av){av.operate(a?.m&&a.ph?U.machines[a.m-1]?.group:null);if(a?.ph==='win'&&prev?.ph!=='win')av.cheer();else if(a?.ph==='lose'&&prev?.ph!=='lose')av.sigh();}
 // 다른 손님 희귀 이상 성공 소식(10초에 1번, 내가 조작·결과 보는 중이면 안 띄움 — 설계 §4)
 if(a&&a.ph==='win'&&prev?.ph!=='win'&&a.r&&rareOf(a.r)&&play.mode==='idle'&&!hud?.card){
  const t=performance.now()/1000;if(t-lastNotice>=T.notice.gapSec){lastNotice=t;const R=RARITY[rarityOf(a.r)];const nm=infoOf(a.r)?.name??'인형',c=nm.charCodeAt(nm.length-1),j=c>=0xac00&&c<=0xd7a3&&(c-0xac00)%28?'을':'를';hud?.toast(`${name}님이 ${'⭐'.repeat(Math.max(1,R.stars-2))} ${R.label} 인형 「${nm}」${j} 뽑았어요`,{sec:3.4});}
 }
}

// ── 입력·카메라
const typing=()=>{const a=document.activeElement;return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.isContentEditable);};
const input=createInput({canvas:renderer.domElement,mobile});
const cam={yaw:0,pitch:.32,dist:mobile?3.4:3.0,min:1.6,max:6,target:new THREE.Vector3()};
input.onLook((dx,dy)=>{if(play.mode!=='idle')return;cam.yaw-=dx*.006;cam.pitch=THREE.MathUtils.clamp(cam.pitch+dy*.004,-.05,1.1);});
input.onZoom(k=>{if(play.mode!=='idle')return;cam.dist=THREE.MathUtils.clamp(cam.dist*k,cam.min,cam.max);});
// Space = 큰 단추(누름·뗌, 시각은 키를 누른 순간). 공용 input도 Space를 막지만(스크롤 방지) 그 신호는 쓰지 않는다
addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||typing()||play.mode!=='play'||hud.card)return;e.preventDefault();play.bigDown(e.timeStamp);},true);
addEventListener('keyup',e=>{if(e.code!=='Space'||play.mode!=='play')return;play.bigUp(e.timeStamp);},true);
addEventListener('keydown',e=>{if(typing()||e.repeat)return;
 if(e.code==='KeyE'&&play.mode==='idle'&&!hud.card){hud.doTodo();}
 else if(e.code==='Escape'){if(hud.card&&hud.card!=='result')hud.closeCard();else if(play.mode==='play'&&!hud.card)hud.confirmQuit();}
 else if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&play.mode==='idle'){} // 달리기는 input.move().run
});
function updatePlayer(dt){
 player.carryHide=carryHide({m:play.mode!=='idle'?1:0});
 if(play.mode!=='idle'){player.update(dt,{moved:0});return;}
 const blocked=!!hud.card||document.documentElement.dataset.ufWin==='menu'&&mobile;
 const mv=blocked?{forward:0,side:0,run:false}:input.move();let dirX=0,dirZ=0;
 if(mv.forward||mv.side){const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);dirX=fx*mv.forward+rx*mv.side;dirZ=fz*mv.forward+rz*mv.side;}
 const len=Math.hypot(dirX,dirZ);
 if(len>0){dirX/=len;dirZ/=len;const running=mv.run||runOn,speed=WALK_SPEED*(running?RUN_MUL:1)*Math.min(1,len);
  const heading=Math.atan2(-dirX,-dirZ);let got=collide(player.x+dirX*speed*dt,player.z+dirZ*speed*dt,heading);
  if(handRing){const pen=handPen(got.x,got.z,heading);if(pen>.01&&pen>=handPen(player.x,player.z,heading)-1e-4)got={x:player.x,z:player.z};}
  const moved=Math.hypot(got.x-player.x,got.z-player.z);
  player.x=got.x;player.z=got.z;player.heading=heading;player.running=running;player.update(dt,{moved,running});}
 else{player.running=false;player.update(dt,{moved:0});}
 measureHand();
}
// 조작 카메라: 기계 정면·조금 위(월드아트 추천값 CLAW.camera를 바탕으로). 정면 가운데에서는 내 동동이 모자가 유리 상자 아래쪽을 가려서
//  조작·결과를 보는 동안만 내 화면에서 내 동동이를 숨긴다(다른 손님 화면에는 기계 앞에 선 모습 그대로 보임)
//  높이는 월드아트 값(1.9·세로 2.2)보다 낮춤: 높으면 위 간판 상자가 레일 쪽 집게를 가린다(특히 세로 화면)
const PLAY_CAM=Object.freeze({pos:[0,1.6,1.75],look:[0,.84,0],fov:44,portrait:Object.freeze({pos:[0,1.55,2.25],look:[0,.86,0],fov:58})});
// 「👁 옆에서」: 기계 옆에서 유리 상자를 본다 — 앞뒤 거리가 보이게. pos는 오른쪽 옆 값, 왼쪽은 x를 뒤집음. portrait = 세로 화면 값(없으면 pos·look 그대로)
// 11-23 월드디자인 검토: 옆 기계를 숨기므로 카메라를 1.5 → 2.6m로 빼고 시야를 좁힘 — 카메라 쪽 끝에 온 집게가 덜 커져 회색 덩어리로 안 보임(가까운/먼 끝 크기 비 1.57 → 1.29배).
//  세로 화면은 폭이 좁아 기계 깊이(0.85m)를 다 넣으면 위 간판·아래 몸통이 화면 절반 넘게 참 → 폭에 집게 움직이는 범위(±0.28m)만 넣고 유리 상자 가운데를 봄(간판·몸통 합쳐 화면 절반 아래)
//  세로 시야 34°: 카메라 쪽 끝(x 0.33)·옆 끝(z 0.28)에 온 집게 팔까지 화면 안(29°는 집게가 왼쪽 가장자리에 반쯤 잘림), 간판·몸통은 화면의 약 47%
const SIDE_CAM=Object.freeze({pos:[2.6,1.5,.05],look:[0,.9,0],fov:26,portrait:Object.freeze({pos:[2.6,1.42,.05],look:[0,.93,0],fov:34})});
// 봉: 2발 집게의 두 팔이 기계 x(= 옆 카메라 쪽)로 벌어져 바로 옆에서는 앞 팔이 뒤 팔을 가림 → 앞쪽으로 약 9° 비스듬히(22°는 앞 기둥·네온이 유리 안을 가로지름, 월드아트 추천 8~10°)
const BRIDGE_SIDE=Object.freeze({pos:[2.57,1.5,.45],look:[0,.9,.04],fov:26,portrait:Object.freeze({pos:[2.57,1.42,.45],look:[0,.93,.04],fov:34})});
// 기계 종류별 옆 카메라(11-23 대표 지적 「모든 기계에 옆에서 보기」): 집게·봉 = 같은 몸, 타이머(키 1.8m·단 위 큰 인형)·열쇠는 조금 높게. 열쇠는 칸 묶음이 앞면에 붙은 판이라 바로 옆에서는 판 옆면만 보여 비스듬한 앞옆(칸 앞면·열쇠 꽂힌 깊이가 보이게)
const SIDE_CAMS=Object.freeze({claw:SIDE_CAM,bridge:BRIDGE_SIDE,
 timer:Object.freeze({pos:[2.65,1.55,.1],look:[0,.95,.02],fov:27,portrait:Object.freeze({pos:[2.65,1.5,.1],look:[0,.97,.02],fov:34})}),
 key:Object.freeze({pos:[2.47,1.6,.85],look:[0,1.0,.02],fov:27,portrait:Object.freeze({pos:[2.47,1.55,.85],look:[0,1.02,.02],fov:34})})});
// 옆에서 보는 동안 보는 기계 말고 화면에 들어오는 기계는 모두 숨김(11-23 월드아트 확인): 카메라 앞을 막는 옆 기계(기계 사이 1.15~1.3m라 옆 카메라 1.5m는 늘 옆 기계 속),
//  뒤 유리 너머로 비치는 같은 줄 기계(봉 상자가 2개처럼 읽힘), 화면 가장자리를 가리는 옆 기계 모서리. 판정 = 가려는 카메라 자리·시야(세로 화면 넓은 시야 포함)와 기계 상자가 겹치는지, 거리 제한 없음(가게 14m — 반대편 봉 줄도 유리 너머로 비침)
const SIDE_FAR=30,sideHidden=new Set(),sideBox=[],sideCam=new THREE.PerspectiveCamera(),sideFrustum=new THREE.Frustum(),sideMat=new THREE.Matrix4();
const machineBox=j=>sideBox[j]??=new THREE.Box3().setFromObject(U.machines[j].group); // 기계는 움직이지 않음(처음 한 번, 보이는 동안 잼)
function hideSideBlockers(){
 const i=play.machine,want=new Set();
 if(side&&play.mode!=='idle'&&i>=0){
  sideCam.fov=camFov;sideCam.aspect=camera.aspect;sideCam.near=.05;sideCam.far=SIDE_FAR;sideCam.updateProjectionMatrix();
  sideCam.position.copy(wantPos);sideCam.lookAt(wantLook);sideCam.updateMatrixWorld();
  sideFrustum.setFromProjectionMatrix(sideMat.multiplyMatrices(sideCam.projectionMatrix,sideCam.matrixWorldInverse));
  U.machines.forEach((O,j)=>{if(j!==i&&sideFrustum.intersectsBox(machineBox(j)))want.add(j);});}
 for(const j of [...sideHidden])if(!want.has(j)){U.machines[j].group.visible=true;sideHidden.delete(j);}
 for(const j of want)if(!sideHidden.has(j)){U.machines[j].group.visible=false;sideHidden.add(j);}
}
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),wantPos=new THREE.Vector3(),wantLook=new THREE.Vector3();let camFov=BASE_FOV,camInit=false;
let camRes=0;
// 아래 판 단추(11-24 시안 B) 자리만큼 게임 그림을 위로 올리고 그만큼 넓게 봄: 기계 그림 단추·유리 앞 바닥(인형)·경품 받침이 판 위 12px보다 아래면 필요한 만큼만.
//  1440×900·세로 휴대폰처럼 기계 아래 받침이 남는 화면은 0(그대로). 기계·옆보기·화면 크기·판 높이마다 한 번 계산, 결과 카드 동안은 앞 값 유지
const resCam=new THREE.PerspectiveCamera(),resV=new THREE.Vector3();let resKey='',resVal=0;
function barReserve(i){
 const bar=document.querySelector('.kh-bar'),H=innerHeight;if(!bar)return play.mode==='result'?resVal:0;
 const free=H-bar.getBoundingClientRect().top+7+12; // 판 윗변(바깥 테두리 7px)에서 12px 위까지
 const key=`${i}|${side}|${innerWidth}x${H}|${Math.round(free)}`;if(key===resKey)return resVal;resKey=key;
 const g=U.machines[i].group,b=g.userData.spots?.button;g.updateMatrixWorld();
 const pts=[[0,CLAW.floorY,CLAW.depth/2],[-.3,CLAW.floorY,CLAW.depth/2],[.3,CLAW.floorY,CLAW.depth/2]];if(b)pts.push([b.x,b.y-.03,b.z+.07]);
 if(g.userData.kind==='timer')pts.push([TIMER.out[0],TIMER.out[1],TIMER.out[2]+.1]);
 const W=pts.map(q=>g.localToWorld(new THREE.Vector3(...q)));
 resVal=0;
 for(let R=0;R<=H*.45;R+=6){resCam.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camFov)/2)*H/(H-R)));resCam.aspect=innerWidth/H;
  if(R)resCam.setViewOffset(innerWidth,H,0,Math.round(R/2),innerWidth,H);else resCam.clearViewOffset();resCam.updateProjectionMatrix();resCam.position.copy(wantPos);resCam.lookAt(wantLook);resCam.updateMatrixWorld();
  const y=Math.max(...W.map(w=>(-resV.copy(w).project(resCam).y*.5+.5)*H));resVal=R;if(y<=H-free)break;}
 return resVal;}
function updateCamera(dt){
 const i=play.machine;
 if(play.mode!=='idle'&&i>=0){ // 조작 카메라: 기계 정면 고정(월드아트 CLAW.camera, 세로 휴대폰은 portrait). 봉은 집게 기계 몸이라 같은 카메라
  const M=U.machines[i],C=M.kind==='claw'||M.kind==='bridge'?PLAY_CAM:M.group.userData.camera??PLAY_CAM,P=innerWidth<innerHeight?C.portrait:C;
  const at=(v,x,y,z)=>{const [wx,wz]=toShop(M,x,z);return v.set(wx,y,wz);};
  const SC=SIDE_CAMS[M.kind];
  if(SC&&side){const Q=innerWidth<innerHeight?SC.portrait??SC:SC;at(wantPos,side*Q.pos[0],Q.pos[1],Q.pos[2]);at(wantLook,side*Q.look[0],Q.look[1],Q.look[2]);camFov=Q.fov;}else{
  at(wantPos,P.pos[0],P.pos[1],P.pos[2]);const lk=P.look??C.look;at(wantLook,lk[0],lk[1],lk[2]);camFov=P.fov;}
 }else{
  if(player.moving&&!input.looking()){let d=player.heading-cam.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));cam.yaw+=d*(1-Math.exp(-dt*1.2));}
  wantLook.set(player.x,.62,player.z);const cp=Math.cos(cam.pitch);
  wantPos.set(wantLook.x+Math.sin(cam.yaw)*cam.dist*cp,wantLook.y+Math.sin(cam.pitch)*cam.dist+.25,wantLook.z+Math.cos(cam.yaw)*cam.dist*cp);
  // 벽 밖으로는 1.2m까지(그 벽은 숨김), 천장 없는 가게라 높이는 3.6m까지
  wantPos.x=THREE.MathUtils.clamp(wantPos.x,-SHOP.w/2-1.2,SHOP.w/2+1.2);wantPos.z=THREE.MathUtils.clamp(wantPos.z,-SHOP.d/2-1.2,SHOP.d/2+1.2);wantPos.y=THREE.MathUtils.clamp(wantPos.y,.4,3.6);
  camFov=BASE_FOV;
 }
 hideSideBlockers();
 const k=camInit?1-Math.exp(-dt*8):1;camInit=true;
 camPos.lerp(wantPos,k);camLook.lerp(wantLook,k);camera.position.copy(camPos);camera.lookAt(camLook);
 // 조작 중 아래 판 단추가 기계 그림 단추·인형을 가리면 그만큼 그림을 위로(barReserve)
 const wantRes=play.mode!=='idle'&&i>=0?barReserve(i):0;
 camRes+=(wantRes-camRes)*k;if(Math.abs(camRes-wantRes)<.5)camRes=wantRes;
 const fovNow=camRes>0?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camFov)/2)*innerHeight/(innerHeight-camRes))):camFov;
 if(Math.abs(camera.fov-fovNow)>.05){camera.fov+=(fovNow-camera.fov)*k;camera.updateProjectionMatrix();}
 const off=Math.round(camRes/2);if(off!==(camera.view?.enabled?camera.view.offsetY:0)||camera.view?.enabled&&(camera.view.fullWidth!==innerWidth||camera.view.fullHeight!==innerHeight)){if(off)camera.setViewOffset(innerWidth,innerHeight,0,off,innerWidth,innerHeight);else camera.clearViewOffset();}
}

// 봉 기계 「옆에서 본 작은 창」(v4.1 §7-2): ↑를 누르는 동안·집게가 내려가는 동안 화면 위 왼쪽 150×104, 낮은 화질(카툰 후처리 없이 바로 그림)
// 작은 창은 이 기계 안(옆 1.7m까지)만 그림: 가게 전체를 한 번 더 그리지 않게(조작 화면 그리기 ≤ 220, v4.1 §9-1)
const miniCam=new THREE.PerspectiveCamera(38,146/100,.05,1.7),MINI={w:150,h:104};let miniOn=false;
// 옆에서 보기 작은 화면 틀. 스타일은 div.kh-mini로만(작은 단추 .kh-btn.kh-mini와 이름이 같아, 11-25까지 도감 「← 도감」·기계 ⓘ 단추가 왼쪽 위로 끌려가 안 눌렸음)
const miniFrame=document.createElement('div');miniFrame.className='kh-mini';miniFrame.hidden=true;miniFrame.setAttribute('aria-hidden','true');miniFrame.innerHTML='<span>옆에서</span>';document.body.append(miniFrame);
{const st=document.createElement('style');st.textContent=`div.kh-mini{box-sizing:border-box;position:fixed;left:calc(env(safe-area-inset-left,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 62px);width:${MINI.w}px;height:${MINI.h}px;border:2px solid #fffaf0;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;z-index:22}div.kh-mini span{position:absolute;left:6px;top:4px;padding:1px 6px;border-radius:8px;background:rgba(42,33,60,.8);color:#fffaf0;font:800 11px/1.3 "Apple SD Gothic Neo",Pretendard,sans-serif}`;document.head.append(st);}
function renderMini(){
 const sub=play.sub,on=play.kind==='bridge'&&!side&&(play.mode==='play'&&sub.startsWith('k2')||play.mode==='drop')&&!hud.card; // 큰 화면이 이미 옆이면 작은 창은 안 띄움
 if(on!==miniOn){miniOn=on;miniFrame.hidden=!on;}
 if(!on)return;
 // 한 줄 안내가 왼쪽 위에 있으면(PC) 그 아래로 내림 — 안내에 가리지 않게
 {const h=document.querySelector('.kh-hint:not([hidden])')?.getBoundingClientRect(),top=h&&h.left<MINI.w+20&&h.top<120?Math.round(h.bottom+8):null,want=top?`${top}px`:'';if(miniFrame.style.top!==want)miniFrame.style.top=want;}
 const M=U.machines[play.machine],[px,pz]=toShop(M,.95,-.02),[lx,lz]=toShop(M,0,-.02);miniCam.position.set(px,.98,pz);miniCam.lookAt(lx,.82,lz); // 봉 높이(0.80m)를 옆에서 조금 위로
 const dpr=renderer.getPixelRatio(),r=miniFrame.getBoundingClientRect(),x=r.left+2,y=innerHeight-r.bottom+2,w=MINI.w-4,h=MINI.h-4;
 renderer.setRenderTarget(null);renderer.setScissorTest(true);renderer.setScissor(x,y,w,h);renderer.setViewport(x,y,w,h);renderer.autoClear=false;renderer.clearDepth();
 const vis=player.root.visible,au=renderer.shadowMap.autoUpdate;player.root.visible=false;renderer.shadowMap.autoUpdate=false;renderer.render(scene,miniCam);renderer.shadowMap.autoUpdate=au;player.root.visible=vis; // 그림자 지도는 본 화면 것을 그대로(다시 안 그림)
 renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.autoClear=true;void dpr;
}
// ── 먼 기계 가볍게(설계 v4 §6 휴대폰 한도, 정식 「가벼운 기계」 그림은 월드아트 몫): 카메라에서 먼 기계는 외곽선·집게·열쇠 장치를 숨기고 그림자를 안 드리움.
//  쓰는 중·다른 손님이 쓰는 기계·가까운 기계(PC 8m·휴대폰 5.5m)는 그대로. 0.3초마다 다시 봄(경품을 새로 놓아도 따라감)
key.shadow.camera.layers.enable(SHADOW_LAYER); // 기계 그림자 = 그림자 전용 상자(월드아트 claw-shop-art.js, 기계 부품은 그림자를 안 드리움)
const LOD={far:mobile?5.5:8,t:0};
const LOD_PART=o=>o.name==='outline'||o.name==='집게'||o.name==='열쇠'||o.name==='열쇠 구멍·칸 표시'||/^(자물쇠 판|구멍|칸 바닥)/.test(o.name);
function applyLod(dt,force=false){
 LOD.t-=dt;if(LOD.t>0&&!force)return;LOD.t=.3;
 const stand=play.mode==='idle'?nearMachine():-1;
 U.machines.forEach((M,i)=>{const near=i===play.machine||!!play.busy(i)||Math.hypot(camera.position.x-M.x,camera.position.z-M.z)<LOD.far;
  // 월드아트 단계 그림(claw-machine-lod.js): 쓰는 중·앞에 선 기계·남이 쓰는 기계 = 자세히(0), 가까운 나머지 = 중간(1, 몸·더미를 구운 덩어리 + 외곽선, 전구 깜빡임 그대로), 먼 기계 = 가벼운 그림(2)
  if(M.group.userData.setLod)M.group.userData.setLod(i===play.machine||!!play.busy(i)||i===stand?0:near?1:2);
  else M.group.traverse(o=>{if(o===M.group)return;if(LOD_PART(o)){o.visible=near;return;}if(o.isMesh){o.userData.cast0??=o.castShadow;o.castShadow=near&&o.userData.cast0;}});M.lodNear=near;
  // 기계 위 상태 불·아슬아슬 별(월드아트 claw-shop-art.js lamps): 뽑는 중 = 주황, 봉 상자 새로 놓는 중 = 정리 중(주황 깜빡), 빈 봉 기계가 아슬아슬하면 별
  const br=M.kind==='bridge'?play.bridge(i):null;
  U.lamps?.set(i,{busy:!!play.busy(i)||i===play.machine&&play.mode!=='idle',tidy:!!br?.refill||!!M.group.userData.tidying,near:!!br?.near});});
}
// ── 머리 위 자리(채팅 말풍선·이름표)
const headV=new THREE.Vector3();
function screenPos(id){
 const h=multi?.headOf(id)??(id==='me'?{kind:'me'}:null);if(!h)return null;
 if(h.kind==='me')player.headTop(headV);else h.avatar.headTop(headV);
 const dist=camera.position.distanceTo(headV);headV.project(camera);
 return {x:(headV.x*.5+.5)*innerWidth,y:(-headV.y*.5+.5)*innerHeight,visible:headV.z<1&&Math.abs(headV.x)<1.1&&Math.abs(headV.y)<1.1,dist};
}
// ── 조작 중 기계 그림의 화면 자리(11-24 시안 B): 그림 단추·타이머 숫자판·인형 → 화면 사각형 {x,y,r,b}
//  그림 단추를 누르면(게임 화면은 조작 중 눌리지 않음) 「아래 단추를 눌러요」 알림. 점검은 claw.artRects()로 판 단추가 이것들을 안 가리는지 잼
const artV=new THREE.Vector3(),artBox=new THREE.Box3();
function rectOf(pts){let x=Infinity,y=Infinity,r=-Infinity,b=-Infinity,on=false;for(const p of pts){artV.copy(p).project(camera);if(artV.z>=1)continue;on=true;const sx=(artV.x*.5+.5)*innerWidth,sy=(-artV.y*.5+.5)*innerHeight;x=Math.min(x,sx);y=Math.min(y,sy);r=Math.max(r,sx);b=Math.max(b,sy);}return on?{x:Math.round(x),y:Math.round(y),r:Math.round(r),b:Math.round(b)}:null;}
const boxPts=bx=>{const out=[];for(let i=0;i<8;i++)out.push(new THREE.Vector3(i&1?bx.max.x:bx.min.x,i&2?bx.max.y:bx.min.y,i&4?bx.max.z:bx.min.z));return out;};
function artRects(i=play.machine){
 const g=U.machines[i]?.group;if(!g)return null;g.updateMatrixWorld();const sp=g.userData.spots??{},loc=(x,y,z)=>g.localToWorld(new THREE.Vector3(x,y,z));
 const out={button:null,display:null,plush:[]};
 if(sp.button){const c=sp.button,R=.07;out.button=rectOf([[-R,-.03,-R],[R,-.03,-R],[-R,.01,R],[R,.01,R],[-R,.01,-R],[R,-.03,R]].map(([dx,dy,dz])=>loc(c.x+dx,c.y+dy,c.z+dz)));}
 if(sp.display&&g.userData.kind==='timer'){const c=sp.display,{w,h}=TIMER.display;out.display=rectOf([[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,bb])=>loc(c.x+a*w/2,c.y+bb*h/2,c.z)));}
 const imM=new THREE.Matrix4();
 g.traverse(o=>{if(o.isInstancedMesh&&o.name.startsWith('물리 인형')&&o.visible){ // 집게 기계 인형 더미 = 인스턴스 그림(인형 하나 = 한 칸)
   if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();o.updateMatrixWorld();
   for(let k=0;k<o.count;k++){o.getMatrixAt(k,imM);imM.premultiply(o.matrixWorld);artBox.copy(o.geometry.boundingBox).applyMatrix4(imM);if(artBox.max.x-artBox.min.x<1e-3)continue;const r=rectOf(boxPts(artBox));if(r)out.plush.push(r);}return;}
  if(o.userData?.plushId&&o!==g){let vis=true;for(let q=o;q&&q!==g;q=q.parent)if(!q.visible){vis=false;break;}if(!vis)return;artBox.setFromObject(o);if(!artBox.isEmpty()){const r=rectOf(boxPts(artBox));if(r)out.plush.push(r);}}});
 return out;
}
addEventListener('pointerdown',e=>{
 if(play.mode!=='play'||hud.card||e.button>0)return;
 if(e.target?.closest?.('button,a,input,textarea,select,[role=dialog],.kh-pad,.uf-sheet,.kh-card,div.kh-mini'))return;
 const r=artRects()?.button;if(!r)return;const pad=Math.max(14,(r.r-r.x)*.4);
 if(e.clientX>=r.x-pad&&e.clientX<=r.r+pad&&e.clientY>=r.y-pad&&e.clientY<=r.b+pad)hud.artTap();
},true);
// 다른 손님 이름표 + 기계 위 「○○ 뽑는 중」
const tagLayer=document.createElement('div');tagLayer.className='kh-tags';tagLayer.setAttribute('aria-hidden','true');document.body.append(tagLayer);
{const st=document.createElement('style');st.textContent=`.kh-tags{position:fixed;inset:0;pointer-events:none;z-index:20}.kh-tag{position:absolute;left:0;top:0;padding:3px 8px;border-radius:10px;background:rgba(58,43,34,.72);color:#fffaf0;font:700 12px/1.2 "Apple SD Gothic Neo",Pretendard,sans-serif;white-space:nowrap;will-change:transform}.kh-tag.busy{background:rgba(217,74,124,.9)}.kh-tag.near{background:rgba(42,33,60,.86);color:#ffd6ea;border:1px solid #ff7fb0}:root[data-claw-mode=play] .kh-tags,:root[data-claw-mode=drop] .kh-tags{opacity:.0}`;document.head.append(st);}
const tags=new Map();
function tagEl(key,cls){let e=tags.get(key);if(!e){e=document.createElement('div');e.className=`kh-tag ${cls}`;tagLayer.append(e);tags.set(key,e);}e.dataset.seen='1';return e;}
const tv=new THREE.Vector3();
function placeTag(e,v,text){if(e.textContent!==text)e.textContent=text;v.project(camera);const on=v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05;e.style.display=on?'':'none';if(on)e.style.transform=`translate(${Math.round((v.x*.5+.5)*innerWidth)}px,${Math.round((-v.y*.5+.5)*innerHeight)}px) translate(-50%,-100%)`;}
function updateTags(){
 for(const e of tags.values())e.dataset.seen='';
 if(multi?.joined)for(const p of multi.people()){if(!p.shown||p.muted)continue;const a=multi.avatarOf(p.id);if(!a)continue;placeTag(tagEl(`p:${p.id}`,'name'),a.headTop(tv),p.name);}
 U.machines.forEach((M,i)=>{const id=play.busy(i);tv.set(M.x,(M.group.userData.height??CLAW.height)+.22,M.z);
  if(id){placeTag(tagEl(`m:${i}`,'busy'),tv,`${multi?.nameOf(id)??'손님'} 뽑는 중`);return;}
  // 봉 기계 상자가 아슬아슬하면 4m 안에서만 이름표(v4.1 §5-2, 색만이 아니라 글로. 쓰는 중엔 안 보임). 지금은 내 화면(혼자 뽑기 상태)만
  if(M.kind==='bridge'&&play.mode==='idle'&&Math.hypot(player.x-M.x,player.z-M.z)<4&&play.bridge(i)?.near)placeTag(tagEl(`n:${i}`,'near'),tv,`${MACHINES[i].name} · ✦ 아슬아슬`);});
 for(const [k,e] of tags)if(!e.dataset.seen){e.remove();tags.delete(k);}
}

// ── 화면
await serverReady;
multi=createClawMulti({ctx:{world,player,profile,mobile,createAvatar:o=>createClawAvatar({rigUrl:RIG_URL,toon,...o})},envUrl:import.meta.env.VITE_MULTI_SERVER_URL,
 myAct:()=>({...play.act(),...carryAct(currentCarry())}),onAct:onRemoteAct,onLeave:()=>{for(let i=0;i<U.machines.length;i++){const id=play.busy(i);if(id)play.unwatch(id);}}});
hud=createClawHud({mobile,catalog,pools,state:()=>state,thumb:id=>thumbs.get(id)??'',multi,act:{
 play:()=>{const i=nearMachine();if(i>=0)startPlay(i);},
 bigDown:ts=>play.bigDown(ts),bigUp:ts=>play.bigUp(ts),
 confirmStart:i=>{const n=nearMachine();startPlay(i,{confirmed:true});void n;},
 side:()=>{side=side?0:1;},
 flip:()=>{if(side)side=-side;},
 quit:()=>play.quit(),
 again:()=>{const i=play.machine;play.done();if(i>=0)startPlay(i);},
 stop:()=>{play.done();},
 goMachine,
 goFree:kind=>{const j=nearestFree(kind,nearMachine());if(j>=0)goMachine(j);},
 run:()=>{runOn=!runOn;},
 sound:on=>{audio.setMuted(!on);saveShared({sound:on});},
 servers:()=>openPick(),
 retry:()=>multi.join({room:multi.room,name:profile.nickname}),
 mute:id=>multi.mute(id),unmute:id=>multi.unmute(id),report:id=>multi.report(id),
 full:()=>openPick('full'),
}});
hud.setMuted(audio.muted);
const chat=installHikingChat({ns:'claw',cls:'kc-chat',frame:hud.frame,notice:'전화번호·주소·SNS 아이디는 적지 마세요. 채팅은 저장되지 않아요.',lookup:id=>screenPos(id)});
// 서버 고르기(세 체험과 같은 창): 허브 → 인형뽑기 카드 → 서버 → 가게. 혼자 뽑기도 된다
const pick=createServerPick({experience:'claw',serverUrl:multi.server,serverOff:currentChoice().source==='file-off',defaultName:profile.nickname,
 onJoin:d=>{profile.nickname=cleanName(d.name);player.name=profile.nickname||'동동이';multi.join({room:d.room,name:d.name});},
 onSolo:({left})=>{if(left){multi.leave();hud.toast('혼자 뽑기로 바꿨어요. 코인·도감은 그대로예요');}}});
const serverIdOf=room=>room?findServer('claw',room)?.id??null:null;
function openPick(note=null){pick.open({current:multi.joined&&multi.state!=='full'?serverIdOf(multi.room):null,note,closable:note!=='full'||multi.joined});}
const pickMode=serverPickMode(location.search,!!navigator.webdriver);
if(multi.params.auto)multi.join({room:multi.params.room,name:multi.params.name??profile.nickname});
else{const entryChoice=takeEntryChoice('claw',{mode:pickMode});if(pickMode==='show'||entryChoice)enterWith(pick,entryChoice,pickMode);}

// ── 크기
function resize(){const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,mobile?1.5:2);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setPixelRatio(dpr);renderer.setSize(w,h);toon.pipeline.resize(mobile?1:2,w,h,dpr);}
addEventListener('resize',resize);resize();

// ── 메인 루프
const clock=new THREE.Clock();let posedAt=-1,frames=0,last=performance.now(),fps=60;
renderer.setAnimationLoop(()=>{
 const dt=Math.min(.05,clock.getDelta());
 {const m=play.mode!=='idle'?play.machine:-1;if(m!==posedAt){posedAt=m;player.operate(m>=0?U.machines[m]?.group:null);}} // 조작 중 두 손을 조작대에(다른 손님에게 보임)
 updatePlayer(dt);
 // 집게: 십자 단추 + 키(←→/AD 좌우, ↑↓/WS 안·밖). 화면 오른쪽 = 기계 +X, ▲ = 안쪽(−Z)
 let dir={x:0,z:0};
 if(play.mode==='play'&&play.kind==='claw'&&!hud.card){const p=hud.padDir(),mv=input.move(),sx=Math.sign(p.x+Math.sign(mv.side)),sz=Math.sign(p.z-Math.sign(mv.forward));
  dir=side?{x:side*sz,z:-side*sx}:{x:sx,z:sz};} // 단추 방향은 화면 기준(오른쪽 옆에서 볼 때 ▶ = 기계 안쪽, 왼쪽 옆에서는 ▶ = 기계 앞쪽, ▲ = 화면 안쪽)
 play.update(dt,dir);
 multi.update(dt);
 U.update(dt);U.fadeWalls(camera);
 updateCamera(dt);
 applyLod(dt);
 player.root.visible=play.mode==='idle'||camera.position.distanceTo(wantPos)>.9; // 조작 카메라에 거의 닿으면 내 몸 숨김
 key.target.position.set(0,0,0);
 const near=play.mode==='idle'?nearMachine():-1,busy=U.machines.map((_,i)=>{const id=play.busy(i);return id?multi.nameOf(id):null;});
 const freeKind=Object.fromEntries(Object.keys(KIND_INFO).map(k=>[k,nearestFree(k,near)]));
 hud.update(dt,{mode:play.mode,machine:play.machine,kind:play.kind,sub:play.sub,side,near,coins:state.coins,timeLeft:play.timeLeft,armed:play.armed,timerView:side&&play.kind==='timer'?play.timerView:null,running:runOn,busy,busySig:busy.join('|'),freeKind});
 updateTags();
 renderer.info.reset();toon.pipeline.render(dt);
 renderMini();
 frames++;const now=performance.now();if(now-last>1000){fps=frames*1000/(now-last);frames=0;last=now;}
});
loading?.classList.add('done');setTimeout(()=>loading?.remove(),700);
// 그날 첫 접속: 위 알림 「오늘의 코인 30개」(설계 §1, 11-24 대표 결정: 매일 30개로 다시 채움, 11-23엔 15개)
if(granted)setTimeout(()=>{hud.toast(`오늘의 코인 ${granted}개 · 매일 0시에 ${T.coin.daily}개로 다시 채워져요`,{sec:4,icn:['k-coin','🪙']});audio.play('grant');},900);
if(!state.seenTip){state.seenTip=true;saveState(state);setTimeout(()=>hud.toast('기계 앞에 가면 「한 판」 단추가 나와요 · ☰ 기계에서 「가기」도 돼요',{sec:4.4}),granted?5200:1200);}

// 진단·자동 점검용(브라우저 콘솔 window.claw)
window.claw={shop,player,play,multi,hud,state,cam,camera,catalog,pools,collide,handPen,get handRing(){return handRing;},
 get fps(){return fps;},
 status(){return {fps:+fps.toFixed(1),mode:play.mode,near:nearMachine(),coins:state.coins,plays:state.plays,wins:state.wins,dex:Object.fromEntries(Object.entries(state.dex).map(([k,v])=>[k,v.n])),pity:{...state.pity},
  player:{x:+player.x.toFixed(2),z:+player.z.toFixed(2),heading:+player.heading.toFixed(2)},play:play.status(),multi:multi.status(),guests:guests.length,catalog:catalog.length,
  calls:renderer.info.render.calls,tris:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,thumbs:thumbs.size};},
 goMachine,nearestFree,teleport(x,z,h=0){player.place(x,z,h);},
 artRects,
 get mini(){return miniOn;},
 // 점검용(개발 서버에서만): 코인 바꾸기·저장 지우기·집게 겨누기(가장 위 인형)·열쇠 옮기기
 ...(import.meta.env.DEV?{setCoins(n){state.coins=n;saveState(state);},resetSave(){localStorage.removeItem('claw-world:v1');},
  aim(k=0){const sim=play.sim(play.machine);if(!sim)return null;const D=sim.dolls.filter(d=>!d.gone).sort((a,b)=>b.cy-a.cy)[k];if(!D)return null;play.aim(D.cx*.1,D.cz*.1);return {id:D.id,x:D.cx*.1,z:D.cz*.1};},
  keyTo:(x,y)=>play.keyTo(x,y),seen(on=true){for(const m of MACHINES)state.seen[m.id]=on;saveState(state);}}:{}),
};
