// 눈썰매 화면(월드개발, 2026-11-16 · 11-17 긴 코스·조작·레이스). 계산은 sled.js(코스 sled-course.js), 레이스 판정은 sled-race.js(서버·혼자 공용),
//  다른 사람 화면에는 위치(10Hz) + act.sl로 보인다. 화면 틀(카운트다운·기록 띠·결과 창)은 game-ui.js(눈싸움과 같은 틀).
// 눈썰매-눈싸움-개선-v1 §1-2·§1-3:
//  - 출발대 4줄. 「타기」 → 썰매에 앉아 기다림(5초 동안 둘이 타기 청할 수 있음) → 「출발!」 → 3·2·1·출발!(각 1초) → 출발 0.3초 안 밀기(W·↑·Space·밀기 단추) = 스타트 부스트, 일찍 밀면 0.5초 늦게.
//  - 「레이스 열기」(다른 사람이 있을 때) → 10초 동안 「같이 하기」(최대 4명) → 같은 카운트다운. 썰매끼리 부딪힘 없음, 순위만.
//  - 조작: PC A/D·←/→ 기울이기, Shift 드리프트, S·↓ 브레이크, R 길게 1초 = 처음부터. 휴대폰: 아래 절반 아무 곳이나 좌우로 끌기(60px = 최대),
//    ◀ ▶ 88px, 드리프트 96px, 브레이크 64px, ↺ 56px(확인 한 번). 모든 키 동작은 화면 단추로도 된다. 일시정지 없음.
//  - 위 기록 띠(순위·시간 0.01초·구간), 구간 통과 1.5초 구간 시간 + 내 최고와 차이, 왼쪽 세로 진행 막대(나·다른 썰매·고스트), ⚙ 조종 감도 3단계·고스트 끄기(이 기기 저장).
//  - 고스트: 내 최고 기록 주행을 반투명 하늘색 썰매로(0.1초마다 기록, 이 기기 저장). 같이 탄 사람이 없으면 저절로 켜짐.
//  - 결승 1초 뒤 결과 창: 순위(1등 왕관)·전체 시간·구간 3개(최고 대비)·새 최고·별 3개·오늘의 기록판 몇 위 · 「다시 타기」(E, 바로 출발대 + 카운트다운)·「기록판 보기」·「내리기」(Q).
// act.sl: 0 없음 · 1~4 출발대 줄에서 기다림 · 5 타는 중 · 6 뒷자리(sp = 앞사람 id). 줄이 겹치면 서버가 sled:busy로 나중 사람을 내린다.
import * as THREE from 'three';
import * as P from './props.js';
import {TARGETS} from './layout.js';
import {createRide,SLED_RULES,SLED_SENS,laneOffset,headingOf,createGhostRecorder,ghostAt,starsOf,starTimes} from './sled.js';
import {makeCourse,dailySeed,normSeed,courseCode,skeletonAt} from './sled-course.js';
import {RACE} from './sled-race.js';
import {SLED_SEAT_Y} from './poses.js';
import {icon,iconText} from '../icons/icon.js';
import {createCountdown,createTopBar,createResultCard,fmtTime,fmtDiff,esc} from './game-ui.js';

export const SLED_TEXT=Object.freeze({busy:'앞 썰매가 출발하면 탈 수 있어요',asked:'같이 타자고 했어요. 앞사람이 수락하면 뒤에 앉아요',declined:'이번에는 혼자 탄대요',
 ask:n=>`${n}님이 같이 타고 싶어 해요`,offline:'연결이 돌아오면 다시 눌러 주세요',up:'썰매 산 출발대로 왔어요',bank:'쿵! 눈둑에 부딪혔어요',pile:'푹! 눈 더미',tree:'으악! 전나무',
 air:'와!',landOk:'착지 성공!',landBad:'휘청!',boost:'부스터!',start:'스타트 부스트!',mini:'드리프트 부스트!',early:'너무 일찍 밀었어요 · 0.5초 늦게 출발',end:'도착!',
 raceOpen:'레이스를 열었어요 · 10초 동안 같이 할 사람을 기다려요',raceFull:'레이스 자리가 꽉 찼어요',raceClosed:'이미 출발한 레이스예요',
 newCourse:c=>`새 코스 ${c} · 블록이 바뀌었어요`,courseBusy:'누가 썰매를 타는 중이라 지금은 코스를 바꿀 수 없어요',ice:'얼음 길! 미끄러워요',tunnel:'터널!'});
const SETTINGS_KEY='xmas-sled:v2'; // 2차: 코스(시드)마다 최고 기록·고스트(bests)
const LANES=SLED_RULES.lanes;
// 출발대 줄 자리(출발선 1.5m 뒤, 줄마다 1m)
export const laneSpot=k=>{const c=skeletonAt(-1.5),o=laneOffset(k);return {x:c.x-Math.sin(c.th)*o,z:c.z+Math.cos(c.th)*o,heading:headingOf(c.th)};};
const nearDeck=(x,z)=>Math.hypot(x-TARGETS.sledDeck.x,z-TARGETS.sledDeck.z)<TARGETS.sledDeck.r+1.2;
const fwd=h=>({x:-Math.sin(h),z:-Math.cos(h)});
function loadSettings(){try{const p=JSON.parse(localStorage.getItem(SETTINGS_KEY)??'{}');const bests={};for(const [k,v] of Object.entries(p.bests??{}))if(v&&Number.isFinite(v.t))bests[k]=v;
 return {sens:SLED_SENS[p.sens]?p.sens:'normal',ghost:p.ghost!==false,bests};}catch{return {sens:'normal',ghost:true,bests:{}};}}
// 휴대폰 끌기 핸들: 8px 안은 무시(손 떨림), 64px에서 최대, 그 사이는 살짝 굽은 곡선(작게 끌면 섬세하게)
export const DRAG=Object.freeze({dead:8,full:64,curve:1.35});
export function dragSteer(dx,{dead=DRAG.dead,full=DRAG.full,curve=DRAG.curve}={}){const a=Math.abs(dx);if(a<=dead)return 0;const t=Math.min(1,(a-dead)/(full-dead));return Math.sign(dx)*Math.pow(t,curve);}

// ctx: {doc,root,world,toon,heightAt,player,poser,net,multi,hud,audio,input,mobile,onChange()}
export function createSledPlay({doc=document,root,world,toon,heightAt,player,poser,net,multi,hud,audio,input,mobile=false,onChange=()=>{}}){
 const tz=toon.toonify,cfg=loadSettings();
 const save=()=>{try{// 코스 기록은 최근 10개만
  const keys=Object.keys(cfg.bests).sort((a,b)=>(cfg.bests[b].at??0)-(cfg.bests[a].at??0));for(const k of keys.slice(10))delete cfg.bests[k];
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(cfg));}catch{}};
 // 지금 코스(방 시드). 타는 중에 바뀌면 다 탄 뒤에 바꾼다
 let course=makeCourse(dailySeed()),pendingSeed=null;const courseCbs=[];
 const bestOf=()=>cfg.bests[course.seed]??null;
 function applyCourse(seed,{say=true}={}){const sd=normSeed(seed);pendingSeed=null;if(sd===course.seed)return false;course=makeCourse(sd);for(const f of courseCbs)f(course);if(say)hud?.say(SLED_TEXT.newCourse(course.code),2.2,'x-new-course');paintBoard();onChange();return true;}
 function setCourseSeed(seed,{force=false}={}){if(!force&&(S.mode==='ride'||S.mode==='count'||S.mode==='back'||(S.mode==='result'&&S.ride&&!S.ride.done))){pendingSeed=normSeed(seed);return false;}return applyCourse(seed);}
 const S={mode:'none',lane:0,wait:0,count:0,goAt:0,ride:null,front:null,partner:null,asked:null,askT:0,cheer:false,lastCount:-1,
  steerBtn:0,dragSteer:0,driftBtn:false,brakeBtn:false,pushBtn:false,early:false,race:null,board:[],rec:null,result:null,resT:0,restartHold:0,lastSplitNote:-1,air:0,lift:0,fov:60,camY:null,camYaw:null};
 const mySled=P.buildSled(tz);mySled.visible=false;world.add(mySled);
 const remote=new Map(); // 다른 사람 id → 썰매 그룹
 // 고스트 썰매(반투명 하늘색)
 const ghost=P.buildSled(null);ghost.traverse(m=>{if(m.isMesh){m.material=new THREE.MeshBasicMaterial({color:'#8fd8ff',transparent:true,opacity:.42,depthWrite:false});m.castShadow=false;}});
 {const body=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.25,4,10),new THREE.MeshBasicMaterial({color:'#8fd8ff',transparent:true,opacity:.42,depthWrite:false}));body.position.set(0,.55,.05);ghost.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,14,10),body.material);head.position.set(0,.95,.05);ghost.add(head);}
 ghost.visible=false;ghost.name='고스트 썰매';world.add(ghost);
 // ── 화면
 const ui=doc.createElement('div');ui.className='xl';ui.innerHTML=`
<div class="xl-drag" hidden aria-hidden="true"><i></i></div>
<div class="xl-steer" hidden><button type="button" class="xl-btn" data-steer="-1" aria-label="왼쪽으로" title="왼쪽으로 (A·←)">${icon('c-left',{size:'l'})}</button><button type="button" class="xl-btn" data-steer="1" aria-label="오른쪽으로" title="오른쪽으로 (D·→)">${icon('c-right',{size:'l'})}</button></div>
<div class="xl-pads" hidden><button type="button" class="xl-brake" data-hold="brake" aria-label="브레이크 (S·↓)">${icon('x-brake',{size:'m'})}<span>브레이크</span></button><button type="button" class="xl-drift" data-hold="drift" aria-label="드리프트 (Shift)">${icon('x-drift',{size:'l'})}<span>드리프트</span>${mobile?'':'<kbd>Shift</kbd>'}</button></div>
<button type="button" class="xl-push" data-hold="push" hidden aria-label="밀기 (W·↑·Space)">${icon('x-boost',{size:'l'})}<span>밀기!</span>${mobile?'':'<kbd>W</kbd>'}</button>
<div class="xl-prog" hidden aria-hidden="true"><i class="xl-track"></i><b class="me"></b></div>
<div class="xl-tools" hidden><button type="button" class="xl-round" data-x="restart" aria-label="처음부터 (R 길게)">${icon('c-undo',{size:'m'})}</button><button type="button" class="xl-round" data-x="settings" aria-label="썰매 설정" aria-haspopup="dialog">${icon('c-settings',{size:'m'})}</button></div>
<section class="xl-set" hidden role="dialog" aria-label="썰매 설정"><header><b>${iconText('c-settings','썰매 설정')}</b><button type="button" class="xh-x" data-x="set-close" aria-label="닫기">✕</button></header>
 <p class="xh-sub">조종 감도 · 게임은 멈추지 않아요</p><div class="xl-sens">${Object.entries({soft:'부드럽게',normal:'보통',fast:'빠르게'}).map(([k,l])=>`<button type="button" data-sens="${k}" aria-pressed="false">${l}</button>`).join('')}</div>
 <button type="button" class="xh-mini" data-x="ghost" aria-pressed="true">${iconText('x-sled','고스트 켜짐')}</button></section>
<section class="xl-confirm" hidden role="dialog" aria-label="처음부터"><p>처음부터 다시 탈까요?</p><div class="xh-row"><button type="button" class="xh-ok" data-x="restart-yes">처음부터</button><button type="button" class="xh-no" data-x="restart-no">계속 타기</button></div></section>
<section class="xl-board" hidden role="dialog" aria-label="오늘의 기록판"><header><b>${iconText('x-trophy','오늘의 기록판')}</b><button type="button" class="xh-x" data-x="board-close" aria-label="닫기">✕</button></header><ol></ol></section>
<section class="xl-ask" hidden role="dialog" aria-label="같이 타기"><p></p><div class="xh-row"><button type="button" class="xh-ok" data-l="ok">같이 타요</button><button type="button" class="xh-no" data-l="no">혼자 탈게요</button></div></section>`;
 root.appendChild(ui);
 const $=s=>ui.querySelector(s);
 const steerEl=$('.xl-steer'),padsEl=$('.xl-pads'),pushEl=$('.xl-push'),dragEl=$('.xl-drag'),progEl=$('.xl-prog'),toolsEl=$('.xl-tools'),setEl=$('.xl-set'),confirmEl=$('.xl-confirm'),boardEl=$('.xl-board'),askEl=$('.xl-ask');
 const count=createCountdown(ui,doc),bar=createTopBar(ui,doc),card=createResultCard(ui,{doc,onPick:id=>pick(id)});
 // 누르고 있는 단추(◀ ▶ · 드리프트 · 브레이크 · 밀기)
 for(const b of ui.querySelectorAll('[data-steer],[data-hold]')){
  const on=e=>{e.preventDefault();try{b.setPointerCapture?.(e.pointerId);}catch{}b.classList.add('on');if(b.dataset.steer)S.steerBtn=+b.dataset.steer;else hold(b.dataset.hold,true);};
  const off=()=>{b.classList.remove('on');if(b.dataset.steer){if(S.steerBtn===+b.dataset.steer)S.steerBtn=0;}else hold(b.dataset.hold,false);};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);}
 function hold(k,on){if(k==='drift')S.driftBtn=on;else if(k==='brake')S.brakeBtn=on;else if(k==='push'){S.pushBtn=on;if(on)pushNow();}}
 // 휴대폰 가상 핸들: 아래쪽 절반 아무 곳이나 좌우로 끌기(처음 누른 곳 기준, 60px = 최대)
 {let d=null;const knob=dragEl.querySelector('i');
  dragEl.addEventListener('pointerdown',e=>{e.preventDefault();try{dragEl.setPointerCapture?.(e.pointerId);}catch{}d={id:e.pointerId,x:e.clientX};knob.style.left=e.clientX+'px';knob.style.top=e.clientY+'px';knob.hidden=false;dragEl.classList.add('on');});
  dragEl.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;const dx=Math.max(-DRAG.full,Math.min(DRAG.full,e.clientX-d.x));S.dragSteer=dragSteer(dx);knob.style.setProperty('--dx',`${dx}px`);});
  const end=e=>{if(!d||e.pointerId!==d.id)return;d=null;S.dragSteer=0;dragEl.classList.remove('on');knob.style.setProperty('--dx','0px');};
  dragEl.addEventListener('pointerup',end);dragEl.addEventListener('pointercancel',end);}
 ui.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.sens){cfg.sens=b.dataset.sens;save();renderSet();hud?.say(`조종 감도: ${b.textContent}`,1.2);return;}
  switch(b.dataset.x){
   case 'settings':setEl.hidden=!setEl.hidden;renderSet();return;case 'set-close':setEl.hidden=true;return;
   case 'ghost':cfg.ghost=!cfg.ghost;save();renderSet();return;
   case 'restart':if(mobile){confirmEl.hidden=false;}else restart();return;
   case 'restart-yes':confirmEl.hidden=true;restart();return;case 'restart-no':confirmEl.hidden=true;return;
   case 'board-close':boardEl.hidden=true;return;
  }});
 askEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!S.asked)return;const id=S.asked;S.asked=null;askEl.hidden=true;
  if(b.dataset.l==='ok'){if(net.send({t:'sled:ok',to:id}))S.partner=id;}else net.send({t:'sled:no',to:id});});
 function renderSet(){for(const b of setEl.querySelectorAll('[data-sens]'))b.setAttribute('aria-pressed',String(b.dataset.sens===cfg.sens));const g=setEl.querySelector('[data-x=ghost]');g.setAttribute('aria-pressed',String(cfg.ghost));g.innerHTML=iconText('x-sled',cfg.ghost?'고스트 켜짐':'고스트 꺼짐');}
 function renderBoard(){const me=multi.joined?multi.name:null;boardEl.querySelector('ol').innerHTML=S.board.length?S.board.map((x,i)=>`<li${x.n===me?' class="me"':''}><b>${i+1}</b><span>${esc(x.n)}</span><em>${fmtTime(x.ms/1000)}</em></li>`).join(''):'<li class="xh-empty">아직 기록이 없어요</li>';}
 // 출발대 옆 3D 기록판 글
 function paintBoard(){const cv=boardCanvas;if(!cv)return;const g=cv.getContext('2d');g.fillStyle='#fbf3df';g.fillRect(0,0,cv.width,cv.height);
  g.fillStyle='#2f7a52';g.fillRect(0,0,cv.width,74);g.fillStyle='#fff';g.font='900 40px "Apple SD Gothic Neo",sans-serif';g.textAlign='center';g.fillText('오늘의 기록',cv.width/2,52);
  g.font='700 24px "Apple SD Gothic Neo",sans-serif';g.fillStyle='#e9f7ee';g.textAlign='right';g.fillText(`코스 ${course.code}`,cv.width-18,52);
  g.textAlign='left';g.font='800 34px "Apple SD Gothic Neo",sans-serif';const list=multi.joined&&net.serverMode?S.board:[];
  if(!list.length){g.fillStyle='#7a5f3a';g.fillText(multi.joined&&net.serverMode?'첫 기록을 남겨 보세요!':'서버에 들어오면 기록이 남아요',28,150);}
  list.slice(0,5).forEach((x,i)=>{const y=128+i*52;g.fillStyle=i===0?'#c8902a':'#4a3618';g.fillText(`${i+1}. ${x.n}`.slice(0,14),28,y);g.textAlign='right';g.fillText(fmtTime(x.ms/1000),cv.width-28,y);g.textAlign='left';});
  boardTex.needsUpdate=true;}
 let boardCanvas=null,boardTex=null;
 const others=()=>multi.joined?multi.people().filter(p=>!p.muted&&p.sample):[];
 const takenLanes=()=>new Set(others().filter(p=>p.act?.sl>=1&&p.act.sl<=LANES).map(p=>p.act.sl));
 const meId=()=>multi.id??'me';
 const inRace=()=>!!S.race&&S.race.ph!=='none'&&S.race.ph!=='done'&&S.race.r?.some(x=>x.id===meId());
 const raceOpen=()=>S.race&&S.race.ph==='wait';
 function seat(){poser.setSit(true,SLED_SEAT_Y);}
 function unseat(){poser.setSit(false);poser.setArms('none');}
 function hideRideUi(){steerEl.hidden=padsEl.hidden=dragEl.hidden=progEl.hidden=toolsEl.hidden=pushEl.hidden=true;setEl.hidden=confirmEl.hidden=true;bar.hide();ghost.visible=false;document.documentElement.classList.remove('xh-sledding');}
 function leave(msg){const was=S.mode;if(pendingSeed!==null)queueMicrotask(()=>{if(S.mode==='none'&&pendingSeed!==null)applyCourse(pendingSeed);});if(inRace())net.send({t:'sr:quit'});S.mode='none';S.ride=null;S.front=null;S.partner=null;S.cheer=false;S.lane=0;mySled.visible=false;unseat();count.hide();hideRideUi();card.close();
  if(msg)hud?.say(msg,2.2);if(was!=='none')onChange();}
 function placeLane(lane){const s=laneSpot(lane);player.place(s.x,s.z,s.heading);seat();mySled.visible=true;}
 function freeLane(pref=0){const taken=takenLanes();if(pref&&!taken.has(pref))return pref;
  const order=[1,2,3,4].sort((a,b)=>Math.hypot(laneSpot(a).x-player.x,laneSpot(a).z-player.z)-Math.hypot(laneSpot(b).x-player.x,laneSpot(b).z-player.z));
  for(const k of order)if(!taken.has(k))return k;return 0;}
 function board(){
  const lane=freeLane();if(!lane){hud?.say(SLED_TEXT.busy,2.4);return false;}
  S.mode='ready';S.lane=lane;S.wait=SLED_RULES.inviteMs/1000;S.partner=null;card.close();
  placeLane(lane);onChange();return true;
 }
 // 카운트다운 시작(혼자: 지금, 레이스: 서버가 정한 출발 시각)
 function startCount(goInMs=SLED_RULES.countdown*1000){S.mode='count';S.goAt=performance.now()+goInMs;S.lastCount=-1;S.early=false;card.close();pushEl.hidden=false;bar.hide();onChange();}
 function go(){if(S.mode!=='ready')return;if(inRace()){if(S.race.host===meId())net.send({t:'sr:go'});return;}startCount();}
 function startRide(){const sens=SLED_SENS[cfg.sens]??1;S.mode='ride';S.ride=createRide({course,lane:S.lane||2,start:-1.5,sens,delay:S.early?SLED_RULES.earlyDelay:0});S.camY=null;S.camYaw=null;S.rec=createGhostRecorder();S.lastSplitNote=-1;S.result=null;
  count.show('출발!');setTimeout(()=>{if(S.mode==='ride')count.hide();},800);audio?.play('go');
  steerEl.hidden=false;padsEl.hidden=false;dragEl.hidden=!mobile;progEl.hidden=false;toolsEl.hidden=false;pushEl.hidden=false;setTimeout(()=>{pushEl.hidden=true;},1200);
  document.documentElement.classList.add('xh-sledding');if(S.early)hud?.say(SLED_TEXT.early,1.6);onChange();}
 function pushNow(){if(S.mode==='count'){if(!S.early){S.early=true;}return;}if(S.mode==='ride'&&S.ride){S.pushQueued=true;}}
 // 처음부터: 레이스 중이면 레이스는 그만두고 혼자 다시
 function restart(){if(S.mode!=='ride'&&S.mode!=='result')return false;if(inRace())net.send({t:'sr:quit'});if(pendingSeed!==null)applyCourse(pendingSeed);const lane=freeLane(S.lane)||S.lane||2;S.lane=lane;S.ride=null;card.close();hideRideUi();placeLane(lane);startCount();return true;}
 function again(){ // 다시 타기(같은 코스): 바로 출발대로 + 카운트다운
  card.close();hideRideUi();if(pendingSeed!==null)applyCourse(pendingSeed);const lane=freeLane(S.lane)||freeLane();if(!lane){leave(SLED_TEXT.busy);return false;}S.lane=lane;placeLane(lane);startCount();return true;}
 function openRace(){if(!(S.mode==='ready'))return false;if(!net.send({t:'sr:open',lane:S.lane})){hud?.say(SLED_TEXT.offline);return false;}return true;}
 function joinRace(){if(!raceOpen())return false;const lane=freeLane();if(!lane){hud?.say(SLED_TEXT.busy,2);return false;}
  S.mode='ready';S.lane=lane;S.wait=99;placeLane(lane);onChange();if(!net.send({t:'sr:join',lane})){leave(SLED_TEXT.offline);return false;}return true;}
 function askRide(){
  let best=null;for(const p of others()){if(!(p.act?.sl>=1&&p.act.sl<=LANES))continue;if(others().some(q=>q.act?.sl===6&&q.act.sp===p.id))continue;const d=Math.hypot(p.sample.x-player.x,p.sample.z-player.z);if(d<3&&(!best||d<best.d))best={id:p.id,d};}
  if(!best)return false;if(!net.send({t:'sled:ask',to:best.id})){hud?.say(SLED_TEXT.offline);return false;}S.front=best.id;S.mode='asking';S.askT=SLED_RULES.inviteMs/1000+1;hud?.say(SLED_TEXT.asked,2.4);return true;
 }
 // 새 코스: 아무도 타고 있지 않을 때만(판정은 서버·혼자 모드 공용 sled-race.js)
 function newCourse(){if(S.mode==='ride'||S.mode==='count')return false;if(!net.send({t:'sc:new'})){hud?.say(SLED_TEXT.offline);return false;}return true;}
 function up(){const s=course.xz(-3.4,0);player.place(s.x,s.z,headingOf(s.th));hud?.say(SLED_TEXT.up,1.6);audio?.play('bank',{gain:.5});return true;}
 function pick(id){switch(id){case 'again':again();return;case 'new':card.close();S.againOnCourse=S.mode==='result';if(!newCourse())S.againOnCourse=false;return;case 'board':renderBoard();boardEl.hidden=false;return;case 'off':leave();return;}}
 // ── 결과 창
 function showResult(){
  const r=S.result;if(!r)return;const me=meId(),race=r.race,rows=race?.r??[];
  const mine=rows.find(x=>x.id===me),n=rows.length,rank=mine?.rank??null;
  const best=bestOf(),newBest=r.newBest,stars=starsOf(r.t,course),st=starTimes(course);
  const splits=r.splits.map((t,i)=>{const prev=i?r.splits[i-1]:0,seg=t-prev,bs=r.prevBest?.splits?.[i],bseg=bs!=null?bs-(i?r.prevBest.splits[i-1]:0):null;
   return `<li><span>구간 ${i+1}</span><b>${fmtTime(seg)}</b>${bseg!=null?`<em class="${seg-bseg>0?'up':'down'}">${fmtDiff(seg-bseg)}</em>`:''}</li>`;}).join('');
  const bpos=net.serverMode?S.board.findIndex(x=>x.n===(multi.joined?multi.name:'')&&Math.abs(x.ms-r.t*1000)<60)+1:0;
  const body=`${rank?`<p class="xg-rank${rank===1?' first':''}">${rank===1?icon('x-crown',{size:'l'}):''}<b>${rank}</b><small>/ ${n}등</small></p>`:''}
<p class="xg-time">${fmtTime(r.t)}${newBest?'<span class="xg-new">새 최고 기록!</span>':''}</p>
<p class="xg-stars" aria-label="별 ${stars}개">${[1,2,3].map(k=>`<i class="${k<=stars?'on':''}">★</i>`).join('')}</p>
<p class="xh-sub">코스 ${course.code} · ${Math.round(course.finish)}m · ★★★ ${fmtTime(st.three)} · ★★ ${fmtTime(st.two)}</p>
<ul class="xg-splits">${splits}</ul>
${race?`<ol class="xg-rows">${rows.slice().sort((a,b)=>(a.rank??99)-(b.rank??99)).map(x=>`<li${x.id===me?' class="me"':''}><b>${x.rank??'–'}</b><span>${esc(x.n)}</span><em>${x.dnf?'완주 못 함':x.ms!=null?fmtTime(x.ms/1000):'달리는 중'}</em></li>`).join('')}</ol>`:''}
${bpos?`<p class="xh-sub">오늘의 기록판 ${bpos}위</p>`:best&&!newBest?`<p class="xh-sub">내 최고 ${fmtTime(best.t)}</p>`:''}`;
  card.show({title:rank===1?'1등!':race?`${rank??'-'}등`:'완주!',ic:rank===1?'x-crown':'x-race',ribbon:rank===1?'#e9b949':'#2f7a52',body,
   buttons:[{id:'again',label:'같은 코스 다시',ic:'x-sled',key:'E',primary:true},...(race?[]:[{id:'new',label:'새 코스',ic:'x-new-course',key:'F'}]),...(net.serverMode?[{id:'board',label:'기록판 보기',ic:'x-trophy'}]:[]),{id:'off',label:'내리기',ic:'c-leave',key:'Q'}]});
  if(rank===1)audio?.play('done');
 }
 function finish(t){
  const splits=S.ride.splits,prevBest=bestOf(),newBest=!prevBest||t<prevBest.t;
  if(newBest){cfg.bests[course.seed]={t:+t.toFixed(3),splits,pts:S.rec.points.slice(0,1100),at:Date.now()};save();}
  S.result={t,splits,newBest,prevBest,race:inRace()?S.race:null};S.resT=1;
  if(inRace())net.send({t:'sr:fin',ms:Math.round(t*1000),seed:course.seed,sp:splits.slice(0,2).map(x=>Math.round(x*1000))});
  else if(net.serverMode)net.send({t:'sr:rec',ms:Math.round(t*1000),seed:course.seed});
  audio?.play('jingle');
 }
 net.on(m=>{
  switch(m.t){
   case 'sled:busy':if(S.mode==='ready'||S.mode==='count')leave(SLED_TEXT.busy);return;
   case 'sled:ask':{if(multi.isMuted?.(m.id))return;if(S.mode!=='ready'||S.partner||inRace()){net.send({t:'sled:no',to:m.id});return;}
    S.asked=m.id;askEl.querySelector('p').textContent=SLED_TEXT.ask(multi.nameOf(m.id));askEl.hidden=false;audio?.play('pop');return;}
   case 'sled:ok':if(S.mode==='asking'&&m.id===S.front){S.mode='back';seat();onChange();hud?.say('뒷자리에 앉았어요 · 만세를 눌러 보세요',2.4,'x-cheer');}return;
   case 'sled:no':if(S.mode==='asking'&&m.id===S.front){S.mode='none';S.front=null;hud?.say(SLED_TEXT.declined,2);}return;
   case 'sr':{const was=S.race,mine=m.r?.some(x=>x.id===meId());S.race=m.ph==='none'?null:m;
    if(mine&&m.ph==='wait'&&(!was||was.id!==m.id))hud?.say(m.host===meId()?SLED_TEXT.raceOpen:'레이스에 들어왔어요 · 곧 출발해요',2.4,'x-race');
    if(mine&&m.seed&&(m.ph==='wait'||m.ph==='count')&&S.mode==='ready')setCourseSeed(m.seed,{force:true}); // 레이스 코스 = 방 코스
    if(mine&&m.ph==='count'&&S.mode==='ready')startCount(m.go);
    if(mine&&m.ph==='done'&&S.result){S.result.race=m;if(card.open)showResult();}
    else if(mine&&S.result&&card.open&&m.ph==='run'){S.result.race=m;showResult();}
    onChange();return;}
   case 'sr:board':if(m.seed&&normSeed(m.seed)!==course.seed&&pendingSeed===null)setCourseSeed(m.seed);S.board=Array.isArray(m.b)?m.b:[];paintBoard();if(!boardEl.hidden)renderBoard();return;
   case 'sc':setCourseSeed(m.seed);if(S.againOnCourse){S.againOnCourse=false;again();}return;
   case 'sc:no':hud?.say(SLED_TEXT.courseBusy,2.2);if(S.againOnCourse){S.againOnCourse=false;showResult();}return;
   case 'sr:no':{const t={open:'이미 열린 레이스가 있어요 · 「같이 하기」를 눌러 주세요',busy:'다른 레이스가 진행 중이에요',closed:SLED_TEXT.raceClosed,full:SLED_TEXT.raceFull}[m.reason];if(t)hud?.say(t,2);
    if(S.mode==='ready'&&!inRace()&&(m.reason==='closed'||m.reason==='full'))leave();return;}
  }
 });
 // R 길게 1초 = 처음부터(PC). 키는 main.js KEYS가 단추로 넘기지 않게 탈 때는 행동 단추가 없다
 addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.repeat&&(S.mode==='ride'))S.restartHold=.001;if((e.code==='KeyW'||e.code==='ArrowUp'||e.code==='Space')&&!e.repeat&&(S.mode==='count'||S.mode==='ride')){pushNow();if(e.code==='Space')e.preventDefault();}});
 addEventListener('keyup',e=>{if(e.code==='KeyR')S.restartHold=0;});
 const api={
  get mode(){return S.mode;},get riding(){return S.mode==='ride'||S.mode==='back'&&!!S.frontRiding;},get active(){return S.mode!=='none'&&S.mode!=='asking';},
  get ride(){return S.ride;},get race(){return S.race;},get board(){return S.board;},get settings(){return {sens:cfg.sens,ghost:cfg.ghost,best:bestOf()?{t:bestOf().t}:null,courses:Object.keys(cfg.bests).length};},
  get course(){return course;},onCourse(f){courseCbs.push(f);f(course);},resetCourse(){applyCourse(dailySeed(),{say:false});},setSeed:seed=>setCourseSeed(seed),
  setBoardCanvas(cv,tex){boardCanvas=cv;boardTex=tex;paintBoard();},
  actFields(){const sl=S.mode==='ready'||S.mode==='count'?S.lane:S.mode==='ride'||S.mode==='result'?5:S.mode==='back'?6:0;return {sl,sp:S.mode==='back'?S.front??'':'',...(sl===6?{wm:S.cheer?1:0}:{})};},
  actions(){
   const raceN=S.race?.r?.length??0;
   switch(S.mode){
    case 'ready':{
     if(inRace()){const host=S.race.host===meId();return [...(host?[{id:'sled:go',ic:'x-race',label:`바로 출발 · ${Math.ceil((S.race.left??0)/1000)}`,key:'E'}]:[]),{id:'sled:off',ic:'c-leave',label:'내리기',key:'Q'}];}
     const canRace=multi.joined&&others().length>0&&!S.race;
     // 행동 단추는 화면에 3개까지: 다른 사람이 있으면 「레이스 열기」, 혼자면 「새 코스」
     return [{id:'sled:go',ic:'x-sled',label:`출발! ${Math.ceil(S.wait)}`,key:'E'},canRace?{id:'sled:race',ic:'x-race',label:'레이스 열기',key:'R'}:{id:'sled:new',ic:'x-new-course',label:'새 코스',key:'F'},{id:'sled:off',ic:'c-leave',label:'내리기',key:'Q'}];}
    case 'count':case 'ride':return [];
    case 'result':return [];
    case 'back':return [{id:'sled:cheer',ic:'x-cheer',label:S.cheer?'만세 내리기':'만세',key:'E'},...(S.frontRiding?[]:[{id:'sled:off',ic:'c-leave',label:'내리기',key:'Q'}])];
    case 'asking':return [{id:'sled:cancel',ic:'c-leave',label:'그만',key:'Q'}];
   }
   if(nearDeck(player.x,player.z)){const out=[];
    if(raceOpen()&&raceN<RACE.max&&!inRace())out.push({id:'sled:join',ic:'x-race',label:`같이 하기 ${raceN}/${RACE.max}`,key:'E'});
    out.push({id:'sled:board',ic:'x-sled',label:'타기',key:out.length?'R':'E'});
    if(!raceOpen())out.push({id:'sled:new',ic:'x-new-course',label:`새 코스`,key:'F'});
    const waiting=others().some(p=>p.act?.sl>=1&&p.act.sl<=LANES&&Math.hypot(p.sample.x-player.x,p.sample.z-player.z)<3&&!others().some(q=>q.act?.sl===6&&q.act.sp===p.id));
    if(waiting){if(out.length>=3)out.pop();out.push({id:'sled:ask',ic:'x-sled-pair',label:'둘이 타기',key:'R'});}
    if(net.serverMode&&out.length<3)out.push({id:'sled:records',ic:'x-trophy',label:'기록판',key:'Q'});
    return out;}
   return [];
  },
  act(id){
   switch(id){
    case 'sled:board':return board();case 'sled:go':go();return true;case 'sled:off':leave();return true;case 'sled:ask':return askRide();
    case 'sled:race':return openRace();case 'sled:join':return joinRace();case 'sled:records':renderBoard();boardEl.hidden=false;return true;
    case 'sled:cancel':S.mode='none';S.front=null;return true;case 'sled:up':return up();
    case 'sled:cheer':S.cheer=!S.cheer;onChange();return true;
    case 'sled:new':return newCourse();
    case 'sled:again':return again();case 'sled:restart':return restart();
   }
   return false;
  },
  hold(id,on){hold(id.replace('sled:',''),on);},
  // 결과 창 단추를 키로(E 다시 타기 · Q 내리기)
  key(k){if(!card.open)return false;if(k==='E'){again();return true;}if(k==='Q'){leave();return true;}if(k==='F'&&!S.result?.race){pick('new');return true;}return false;},
  // 걷기 대신 썰매가 몸을 움직이면 true(main.js는 걷기를 건너뜀). steer = 키·조이스틱 좌우, drift = Shift, brake = 뒤로, push = 앞으로
  update(dt,{steer=0,moveInput=false,drift=false,brake=false,push=false}={}){
   bar.update(dt);card.update(dt);
   // 다른 사람 썰매(출발대 대기·타는 중). 뒷자리 사람은 앞사람 썰매를 같이 탄다
   const seen=new Set();
   for(const p of others()){const sl=p.act?.sl;if(!(sl>=1&&sl<=5))continue;seen.add(p.id);let g=remote.get(p.id);if(!g){g=P.buildSled(tz);world.add(g);remote.set(p.id,g);}
    const f=fwd(p.sample.heading);g.position.set(p.sample.x-f.x*.24,heightAt(p.sample.x,p.sample.z)+.11,p.sample.z-f.z*.24);g.rotation.y=p.sample.heading+Math.PI;g.visible=true;}
   for(const [id,g] of remote)if(!seen.has(id)){world.remove(g);remote.delete(id);}
   if(S.askT>0){S.askT-=dt;if(S.askT<=0&&S.mode==='asking'){S.mode='none';S.front=null;hud?.say(SLED_TEXT.declined,2);}}
   switch(S.mode){
    case 'none':case 'asking':return false;
    case 'ready':{if(moveInput){leave();return false;}if(!inRace()){S.wait-=dt;if(S.wait<=0)go();}
     else bar.set({left:iconText('x-race',`레이스 ${S.race.r.length}/${RACE.max}`),center:`${Math.ceil((S.race.left??0)/1000)}`,right:`코스 ${course.code}`,cls:'wait'});
     if(!inRace())bar.set({left:iconText('x-new-course',`코스 ${course.code}`,{size:'xs'}),center:`${Math.round(course.finish)}m`,right:bestOf()?`내 최고 ${fmtTime(bestOf().t)}`:'첫 기록에 도전',cls:'wait'});
     placeSled();player.update(dt,{moved:0});return true;}
    case 'count':{const left=(S.goAt-performance.now())/1000,n=Math.ceil(left);
     if(n!==S.lastCount&&n>0){S.lastCount=n;count.show(n);audio?.play('beep');}
     if(push||S.pushBtn)pushNow();
     if(left<=0)startRide();placeSled();player.update(dt,{moved:0});return true;}
    case 'ride':case 'result':{
     const r=S.ride;if(!r){leave();return false;}
     if(S.mode==='result'&&r.done&&moveInput&&!card.open){leave();return false;}
     const st=Math.max(-1,Math.min(1,steer+S.steerBtn+S.dragSteer));
     const pushNowIn=!!(S.pushQueued||push);S.pushQueued=false;
     const ev=r.step(dt,{steer:S.mode==='result'?0:st,drift:(drift||S.driftBtn)&&S.mode==='ride',brake:brake||S.brakeBtn,push:pushNowIn});
     const p=r.pose();
     player.x=p.x;player.z=p.z;player.heading=p.heading;player.speed=p.speed;S.lift=p.y-heightAt(p.x,p.z);placeSled();player.update(dt,{moved:0});
     if(S.mode==='ride')S.rec.add(dt,p);
     for(const e of ev)event(e);
     if(S.mode==='ride'){
      // R 길게 1초 = 처음부터
      if(S.restartHold>0){S.restartHold+=dt;if(S.restartHold>=1){S.restartHold=0;restart();return true;}}
      hudRide(dt);}
     else if(S.resT>0){S.resT-=dt;if(S.resT<=0)showResult();}
     if(r.done&&S.mode==='result'){/* 멈춤 구역에서 결과 창을 보며 기다림 */}
     return true;}
    case 'back':{
     const fs=multi.sampleOf(S.front),fa=others().find(p=>p.id===S.front)?.act;
     if(!fs||!fa||!(fa.sl>=1&&fa.sl<=5)){if(S.frontRiding||!fs||!fa){S.frontRiding=false;leave(fs?'도착! 같이 타서 즐거웠어요':'앞사람이 썰매에서 내렸어요');}return false;}
     S.frontRiding=fa.sl===5;if(moveInput&&!S.frontRiding){leave();return false;}
     const f=fwd(fs.heading);player.x=fs.x-f.x*SLED_RULES.back;player.z=fs.z-f.z*SLED_RULES.back;player.heading=fs.heading;player.speed=S.frontRiding?6:0;
     player.update(dt,{moved:0});return true;}
   }
   return false;
  },
  // 타는 동안 카메라(2차): 썰매 뒤 4.6m·높이, 빠를수록 시야 62°→74°(부스트 +4°), 진행 방향 앞·굽이 안쪽을 조금 더 봄,
  //  드리프트로 몸이 돌아도 카메라는 진행 방향(흔들림 없음), 점프 때 높이는 천천히 따라감(착지 덜컹 없음), 터널 안은 낮고 가깝게
  camera(){if(!(S.mode==='ride'||S.mode==='result'||S.mode==='count')&&!(S.mode==='back'&&S.frontRiding))return null;const two=!!S.partner||S.mode==='back';
   const r=S.ride,v=r?.v??0;
   if(!r||S.mode==='count'||S.mode==='back')return {yaw:player.heading,pitch:two?.42:.36,dist:two?4.9:4.5,lift:.2,fov:62,lag:.3};
   const p=r.pose(),C=r.course,ahead=C.at(r.s+Math.max(5,v*.9)),tunnel=C.at(r.s).tun||C.at(r.s+3).tun;
   let yaw=headingOf(C.at(r.s).th*.45+ahead.th*.55+r.psi*.6);
   const ground=C.profileH(r.s)+(p.air?0:C.rampH(r.s)),y=p.y;S.camY=S.camY==null?y:S.camY+(y-S.camY)*(1-Math.exp(-(p.air?2.2:9)*(1/60)));
   void ground;
   const fx=-Math.sin(p.travel),fz=-Math.cos(p.travel),lat=Math.max(-1,Math.min(1,ahead.k*4))*.6;
   return {yaw,pitch:tunnel?.2:two?.4:.33,dist:tunnel?3.4:two?4.9:4.6,lift:.2,fov:62+12*Math.max(0,Math.min(1,(v-4)/8))+(r.boosting?4:0),lag:.22,
    y:S.camY,ahead:{x:fx*1.2+(-fz)*lat,z:fz*1.2+fx*lat}};},
  // 썰매가 내 몸 높이에 더할 값(점프대·공중)
  get lift(){return S.mode==='ride'||S.mode==='result'?S.lift??0:0;},
  status(){const r=S.ride;return {mode:S.mode,lane:S.lane,s:r?+r.s.toFixed(2):null,v:r?+r.v.toFixed(2):null,off:r?+r.off.toFixed(2):null,t:r?+r.t.toFixed(2):null,splits:r?.splits??[],finished:!!r?.finished,
   front:S.front,partner:S.partner,remote:remote.size,race:S.race?{ph:S.race.ph,n:S.race.r?.length??0,host:S.race.host,mine:inRace()}:null,board:S.board.length,result:card.open,ghost:ghost.visible,sens:cfg.sens,best:bestOf()?.t??null,seed:course.seed,code:course.code,finish:+course.finish.toFixed(1),pending:pendingSeed,camFov:+(api.camera()?.fov??0).toFixed(1),surface:r?.surface??null,banks:r?.banks??0,hits:r?.hits??0};},
 };
 function event(e){
  switch(e.type){
   case 'bank':audio?.play('bank',{gain:e.hard?1:.45});if(e.hard){hud?.say(SLED_TEXT.bank,.9);shake(.12);}break;
   case 'ice':bar.note(SLED_TEXT.ice,1.2);break;
   case 'tunnel':bar.note(SLED_TEXT.tunnel,.8);break;
   case 'pile':audio?.play('bank');hud?.say(SLED_TEXT.pile,.8);break;
   case 'tree':audio?.play('hit');hud?.say(SLED_TEXT.tree,1);shake(.18);break;
   case 'boost':audio?.play('boost');bar.note(iconText('x-boost',SLED_TEXT.boost,{size:'xs'}),1);break;
   case 'start':audio?.play('boost');bar.note(iconText('x-boost',SLED_TEXT.start,{size:'xs'}),1.2);break;
   case 'mini':audio?.play('boost');bar.note(iconText('x-drift',SLED_TEXT.mini,{size:'xs'}),1);break;
   case 'air':hud?.say(SLED_TEXT.air,.6);break;
   case 'land':bar.note(e.good?SLED_TEXT.landOk:SLED_TEXT.landBad,1);if(e.good)audio?.play('pop');break;
   case 'drift':padsEl.querySelector('.xl-drift').dataset.lv=String(e.lv);break;
   case 'cp':{const CP=S.ride.course.checkpoints,B=bestOf();if(e.i<CP.length-1){const prev=e.i?S.ride.splits[e.i-1]:0,seg=e.t-prev,b=B?.splits?.[e.i],bseg=b!=null?b-(e.i?B.splits[e.i-1]:0):null;
     bar.note(`구간 ${e.i+1} ${fmtTime(seg)}${bseg!=null?` <em class="${seg-bseg>0?'up':'down'}">${fmtDiff(seg-bseg)}</em>`:''}`,1.5);audio?.play('pop');}break;}
   case 'finish':count.show('결승!');setTimeout(()=>count.hide(),900);finish(e.t);S.mode='result';hideRideUi();onChange();break;
   case 'end':break;
  }
  if(e.type!=='drift')padsEl.querySelector('.xl-drift').dataset.lv=String(S.ride?.driftLv??0);
 }
 let shakeT=0;function shake(t){shakeT=t;}
 api.shake=()=>{if(shakeT<=0)return 0;shakeT=Math.max(0,shakeT-1/60);return shakeT;};
 // 타는 동안 위 기록 띠·진행 막대·고스트
 function hudRide(dt){
  const r=S.ride,me=meId(),race=inRace()?S.race:null;
  // 순위(같이 탄 사람끼리 지금 s 비교)
  let rank='',racers=[];
  if(race){racers=race.r.filter(x=>x.id!==me).map(x=>{const smp=multi.sampleOf(x.id);const n=smp?r.course.nearest(smp.x,smp.z,{maxD:6}):null;return {id:x.id,s:x.ms!=null?r.course.end:n?.s??-2};});
   const ahead=racers.filter(x=>x.s>r.s).length;rank=`${ahead+1}/${race.r.length}`;}
  bar.set({left:rank?iconText('x-crown',rank,{size:'xs'}):'',center:fmtTime(Math.max(0,r.t)),right:`구간 ${Math.min(r.course.checkpoints.length,r.splits.length+1)}/${r.course.checkpoints.length}`,cls:'ride'});
  // 진행 막대(아래 = 출발, 위 = 결승)
  const k=s=>Math.max(0,Math.min(1,s/r.course.finish));
  progEl.querySelector('.me').style.bottom=`${(k(r.s)*100).toFixed(1)}%`;
  const dots=[...racers.map(x=>({cls:'other',s:x.s}))];
  // 고스트: 같이 탄 사람이 없고 켜져 있고 최고 기록이 있으면
  const B=bestOf(),gOn=cfg.ghost&&!race&&B?.pts?.length;
  if(gOn){const g=ghostAt(B.pts,Math.max(0,r.t));if(g&&!g.done){ghost.visible=true;const f=fwd(g.heading);ghost.position.set(g.x-f.x*.24,g.y+.11,g.z-f.z*.24);ghost.rotation.y=g.heading+Math.PI;dots.push({cls:'ghost',s:g.s});}else ghost.visible=false;}else ghost.visible=false;
  const have=progEl.querySelectorAll('.dot');if(have.length!==dots.length){have.forEach(x=>x.remove());for(const d of dots){const b=doc.createElement('b');b.className=`dot ${d.cls}`;progEl.appendChild(b);}}
  progEl.querySelectorAll('.dot').forEach((b,i)=>{b.style.bottom=`${(k(dots[i].s)*100).toFixed(1)}%`;});
 }
 function placeSled(){const f=fwd(player.heading);mySled.visible=['ready','count','ride','result'].includes(S.mode);
  mySled.position.set(player.x-f.x*.24,heightAt(player.x,player.z)+.11+(S.mode==='ride'||S.mode==='result'?S.lift:0),player.z-f.z*.24);mySled.rotation.y=player.heading+Math.PI;}
 renderSet();
 return api;
}
