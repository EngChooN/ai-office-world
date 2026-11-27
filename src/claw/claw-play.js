// 인형뽑기 한 판 진행(월드개발, 2026-11-23). 기계 3종(월드디자인 설계 v3): 집게(물리, 대표 결정)·타이머(딱 10.00)·열쇠(칸 고르기).
// 공통 순서: start(코인은 main.js가 먼저 냄) → 조작(play) → 판정 연출(drop, 입력 잠금) → 결과(result, 카드는 claw-hud.js) → done()으로 기계 앞 서기.
//  - 집게: claw-physics.js가 인형·집게발을 실제로 움직이고, 구멍으로 떨어진 인형 = 성공, 들었다 떨어뜨림 = 아까움, 못 듦 = 실패.
//  - 타이머: 큰 단추 누른 순간(event.timeStamp)으로 시간을 재고, 화면에 멈춘 숫자로만 판정(claw-rules.js judgeTimer).
//    연출(11-23 대표 피드백, 집게 없음): 성공 = 잠금 풀림 → 유리문 열림 → 큰 인형을 문 밖 경품 받침으로 꺼냄(문은 열어 둠) → 인형을 치우면 문 닫힘,
//    아까움 = 문이 덜컥 흔들리다 닫힘, 실패 = 잠금 불빛만 빨강 깜빡. 큰 인형이 문이 닫히는 길에 놓이므로 인형을 치운 뒤에 닫는다(v1.6).
//  - 열쇠: 누르고 있기 두 번(→ 그리고 ↑), 뗀 자리로 판정(judgeKey). 성공이면 칸 바닥이 열리고 인형이 나옴.
// 다른 손님이 쓰는 기계는 그 사람의 act(m·ph·cx·cz·r·k·n·v)를 받아 같은 결과를 그린다(결과는 그 사람 화면이 정함. 집게 물리는 다시 돌리지 않고 집게 움직임만 따라 그림).
// 그림·치수는 월드아트 claw-machine-art.js(CLAW·claw.set)·claw-machines-more.js(타이머 setTimer·열쇠 key.set). 이 파일은 DOM을 모른다.
import * as THREE from 'three';
import {CLAW} from './claw-machine-art.js';
import {TIMER} from './claw-machines-more.js';
const TIMER_RATTLE=TIMER.door.rattle;
import {plushGeometry,plushMaterial,plushLineMaterial} from './claw-plush.js';
import {geomFrom,createClawSim,toMachine,U,staffHelp} from './claw-physics.js';
import {CLAW_TUNING,judgeTimer,judgeKey,keyHole,fmtTimer,hund,encodeClawPos,decodeClawPos,encodeKeyPos,decodeKeyPos,KIND_CODE,KIND_OF,hideAfterOf,stackPos,stackStop,stringSway,judgeString} from './claw-rules.js';
import {createBridgeSim,startPose,nearState,bridgeOutcome,bridgeSnap,noProgress,offRails} from './claw-bridge-physics.js';
import {MACHINES} from './claw-palette.js';
import {simulateBall,ballAt,judgeBall,holeIndex,ballPathTo} from './claw-ball-physics.js';

// 타이머 연출·구경 연출(집게가 정해진 결과대로 움직임) 단계 시간(초)
export const SEQ_TIMES=Object.freeze({down:1.0,close:.45,up:.9,carry:1.0,release:.35,fall:.55,settle:.35});
// 타이머 문 연출 단계(초). win: unlock→open→take→hold(문 열린 채 끝, shut은 꺼낸 인형을 치울 때 따로), near: rattle, miss: blink
export const DOOR_TIMES=Object.freeze({unlock:.45,open:.6,take:1.0,hold:.35,shut:.5,rattle:1.0,blink:.7});
const DOOR_SEQ=Object.freeze({win:['unlock','open','take','hold'],near:['rattle'],miss:['blink']});
const SEQ=['down','close','up','carry','release','fall','settle'];
// 집게 벌림(그림 open). play = 물리 쉼 자세(CLAW_RIG.rest)와 같게, down = 물리 내려가기(CLAW_RIG.open)와 같게 — 내 판·구경·타이머가 같은 모양
const OPEN={play:.21,down:.83,grab:.32,shut:0,release:.71}; // 11-24: down = 물리 CLAW_RIG.drop 0.82, release = 물리 open 0.7 → 그림 벌림 (th+0.04)/1.04
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2;
const GEOM=geomFrom(CLAW);
const PILE_SPHERE=new THREE.Sphere(new THREE.Vector3(0,CLAW.floorY+.3,0),.8); // 기계 좌표: 유리 상자 안 + 구멍으로 떨어지는 길
const idOfObj=o=>o?.userData?.plushId??(o?.name?.includes(':')?o.name.split(':').pop():null);

/**
 * shop = buildClawShop({kinds:true}) 결과, pools[i] = 기계 i 인형 id(손님 자리 바꾼 것), makePlushObj(id) → 인형 3D, sizeOf·rarityOf(id)
 * pityFor(i) → 이번 판 보장인가, onEvent(type,detail): 'start'·'arm'·'drop'·'result'·'quit'·'bump'·'phase'·'mach'(봉 상자 상태가 바뀜 → 이 기기에 저장)·'reset'(막힌 상자를 다시 놓음)
 * machState(i) → 이어서 쓸 봉 상자 상태(claw-rules.js machStateToday, 없으면 null = 처음 자리)
 */
export function createClawPlay({shop,pools,makePlushObj,sizeOf,rarityOf=()=>'common',toonify=null,audio=null,pityFor=()=>false,onEvent=()=>{},rareOf=()=>false,hearOf=()=>1,T=CLAW_TUNING,seed=7,machState=()=>null}){
 // 소리: 내 판은 그대로, 다른 손님 기계(구경)는 내 자리에서 먼 만큼 작게(11-26, 30명 가게가 시끄럽지 않게)
 const say=(r,n,o={})=>audio?.play(n,r===cur?o:{...o,gain:hearOf(r.i)});
 const rigs=shop.userData.machines.map((M,i)=>{const U2=M.group.userData,kind=U2.kind??M.kind??'claw';
  // 집게·봉이 갈 수 있는 범위(m) = 물리 RANGE(벌린 발끝이 유리 안, 11-24). 쉬는 자리 = 구멍 위(home)를 이 범위 안으로 자른 곳
  const G=kind==='bridge'?U2.geom:GEOM,range=G?{x:[G.RANGE.x0*U,G.RANGE.x1*U],z:[G.RANGE.z0*U,G.RANGE.z1*U]}:CLAW.play;
  const rest=kind==='timer'?[U2.stage.x,U2.stage.z]:[clamp(CLAW.home[0],range.x[0],range.x[1]),clamp(CLAW.home[1],range.z[0],range.z[1])];
  return {i,M,U:U2,kind,rest,range,x:rest[0],z:rest[1],tx:rest[0],tz:rest[1],drop:0,open:OPEN.play,seq:null,owner:null,ownerAct:null,lightT:0,lightMode:'idle',
   sim:null,views:null,timer:null,key:null,keyFx:null,door:null,dseq:null,taken:null,shut:null,wakeT:0,
   bsim:null,bk:null,box:null,before:null,refillT:0,mv:0,still:0,lay:0,stack:null,spec:null,cut:null,cfx:null,bl:null,bfx:null};});
 let mode='idle',cur=null,elapsed=0,clock=0,armedOnce=false,result=null,playN=0,phase='',hold={x:0,z:0},bumpX=0,bumpZ=0,pityNow=false,clawWon=[],doneAt=0,lastV=0,refills=0;
 const W=CLAW.width;

 // ── 집게 기계: 물리 더미(그림 쪽 fillPile 대신, 같은 인형 형상을 물리 자리로 그린다)
 const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),zero=new THREE.Matrix4().makeScale(0,0,0);
 const Fw=new THREE.Matrix4(),Fl=new THREE.Matrix4(),e1=new THREE.Vector3(),e2=new THREE.Vector3(),e3=new THREE.Vector3(),va=new THREE.Vector3(),vb=new THREE.Vector3(),off=new THREE.Vector3();
 // 시안 frameOf와 같은 식: 머리 방향·좌우 방향으로 몸 틀을 만들고, 지금 틀 × 처음 틀⁻¹ = 회전
 const frameOf=(a,b,out)=>{e1.copy(a).normalize();e2.copy(b).addScaledVector(e1,-e1.dot(b)).normalize();e3.crossVectors(e1,e2);return out.makeBasis(e1,e2,e3);};
 function buildPhysics(r){
  r.U.pile?.dispose?.();r.U.pile=null;
  if(r.views){for(const v of r.views.meshes){r.M.group.remove(v);v.dispose?.();}}
  const C=T.claw,sim=createClawSim({geom:GEOM,ids:pools[r.i],sizeOf,massOf:id=>C.mass[rarityOf(id)]??1,seed:seed+r.i*101+(refills++)*977,count:C.dolls,power:C.power});
  const byId=new Map();sim.dolls.forEach((D,di)=>{if(!byId.has(D.id))byId.set(D.id,[]);byId.get(D.id).push(di);});
  const meshes=[],slot=[];
  for(const [id,list] of byId){const geo=plushGeometry(id);
   // 화면 밖 기계의 더미는 안 그림(기계 16대, v4 §6): 인형은 유리 상자 안에만 있으므로 경계 구를 상자에 맞춰 고정
   const im=new THREE.InstancedMesh(geo.color,plushMaterial(),list.length);im.name=`물리 인형:${id}`;im.castShadow=false;im.receiveShadow=true;im.boundingSphere=PILE_SPHERE.clone();
   const lm=new THREE.InstancedMesh(geo.line,plushLineMaterial(),list.length);lm.userData.outline=true;lm.name='outline';lm.boundingSphere=PILE_SPHERE.clone();
   toonify?.(im,{kind:'character'});r.M.group.add(im,lm);meshes.push(im,lm);list.forEach((di,j)=>{slot[di]={im,lm,j};});}
  r.sim=sim;r.views={meshes,slot};syncDolls(r);
 }
 function syncDolls(r){
  const {sim,views}=r;
  sim.dolls.forEach((D,di)=>{const s=views.slot[di];if(!s)return;
   if(D.gone){s.im.setMatrixAt(s.j,zero);s.lm.setMatrixAt(s.j,zero);return;}
   const f=sim.frame(di);va.fromArray(f.up);vb.fromArray(f.side);frameOf(va,vb,Fw);va.fromArray(f.lup);vb.fromArray(f.lside);frameOf(va,vb,Fl);Fw.multiply(Fl.transpose());
   _q.setFromRotationMatrix(Fw);off.set(0,-D.bottom,0).applyQuaternion(_q);
   const [x,y,z]=toMachine(GEOM,f.p[0]+off.x,f.p[1]+off.y,f.p[2]+off.z);_p.set(x,y,z);_s.setScalar(sizeOf(D.id));_m.compose(_p,_q,_s);
   s.im.setMatrixAt(s.j,_m);s.lm.setMatrixAt(s.j,_m);});
  for(const m of views.meshes)m.instanceMatrix.needsUpdate=true;
 }
 // ── 봉 기계: 상자 물리(claw-bridge-physics.js). 상자 자리는 판 사이에 남고(혼자 뽑기 = 이 기기에 오늘까지, v4.1 §3), 성공하면 2.5초 뒤 다른 상자
 const B=T.bridge;
 const boxMass=id=>rarityOf(id)==='rare'||rarityOf(id)==='special'?B.boxMassRare:B.boxMass;
 const bridgePower=()=>({grab:B.clawGrab,carry:B.clawGrab*.8});
 function buildBridge(r,{fresh=false,not=null,keep=null}={}){
  const saved=fresh?null:machState(r.i),pool=pools[r.i];
  const id=keep&&pool.includes(keep)?keep:saved?.id&&pool.includes(saved.id)?saved.id:not?pool.find(x=>x!==not)??pool[0]:pool[0];
  r.box=id;r.mv=saved?.mv??0;r.still=saved?.still??0;r.lay=saved?.lay??0;
  r.bsim=createBridgeSim({geom:r.U.geom,box:B.box,mass:boxMass(id),power:bridgePower(),friction:B.barFriction,openTo:B.clawOpen,seed:seed+r.i*31,pose:startPose(B),st:saved?.st??null});
  r.U.setBox?.(id);syncBox(r);
 }
 function syncBox(r){if(!r.bsim)return;r.U.placeBox?.(r.bsim.frame(),{visible:!r.bsim.gone});}
 const bridgeSave=r=>({st:r.bsim.won?null:r.bsim.boxState(),id:r.box,mv:r.mv,still:r.still,lay:r.lay});
 // 막힘(v4.1 §6-1 + 대표 2026-11-23): 집게가 닿지 않는 곳·여러 판 진척 없음·막이 봉 밖/봉 아래 끼임·누운 채 여러 판
 const bridgeStuck=r=>!r.bsim.won&&(r.bsim.outOfReach()||r.still>=T.share.stuckPlays||offRails(r.bsim,r.U.geom)||r.lay>=B.liePlays);
 for(const r of rigs){
  if(r.kind==='claw')buildPhysics(r);
  if(r.kind==='bridge')buildBridge(r);
  if(r.kind==='timer'){r.U.setBand?.(T.timer);r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');}
  if(r.kind==='key'){r.U.setHoles?.({fit:T.key.fit,fitRare:T.key.fitRare,pity:false,pityBonus:T.key.pityFitBonus});r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});}
  if(r.kind==='stack'){r.U.clearBoard?.();r.U.setButton?.('off');}
  if(r.kind==='string'){r.U.setButton?.('off');r.U.setBlade?.({u:T.string.start,open:1});}
  if(r.kind==='ball'){r.U.setButton?.('off');r.U.setBall?.({visible:false});}
 }

 function setLights(r,m,sec=0){r.lightMode=m;r.lightT=sec;r.U.setLights?.(m);}
 const topAtM=(r,x,z)=>r.sim?GEOM.floorY+r.sim.topAt(x/U,z/U)*U:CLAW.floorY;
 function pose(r){const live=(r.sim||r.bsim)&&!r.seq&&!(r.owner&&r!==cur);r.U.claw?.set({x:r.x,z:r.z,drop:r.drop,open:r.open,opens:live?r.opens:null,dotY:r.bsim?boxTopAt(r):topAtM(r,r.x,r.z)});}
 // 봉 기계 그림자 점 높이: 집게 아래가 상자면 상자 윗면, 아니면 구멍 바닥
 function boxTopAt(r){const b=r.bsim;if(b.gone)return CLAW.floorY;const [cx,cy,cz]=b.center(),h=b.half;return Math.abs(r.x/U-cx)<h[0]&&Math.abs(r.z/U-cz)<h[2]?CLAW.floorY+(cy+h[1])*U:CLAW.floorY;}
 const tipY=r=>CLAW.clawTop-r.drop;

 // ── 정해진 결과대로 움직이는 집게(타이머 연출·다른 손님 구경). given = 이미 있는 인형(타이머 단 위), 없으면 makePlushObj로 새로
 function startSeq(r,{x,z,res,local,obj=null,backTo=null,real=null}){
  const top=obj?obj.position.y+(obj.userData.size??sizeOf(idOfObj(obj)))*.85:r.bsim?boxTopAt(r)+.03:topAtM(r,x,z)+.05;
  r.seq={k:0,t:0,x0:x,z0:z,depth:clamp(CLAW.clawTop-top,.06,CLAW.dropMax),res,real,local,obj:null,given:obj,backTo,falling:null,slipped:false};
  r.x=r.tx=x;r.z=r.tz=z;say(r,'down');
 }
 function hang(r,obj){const s=obj.userData.size??sizeOf(idOfObj(obj))??.24;obj.position.set(r.x,tipY(r)-s*.62,r.z);}
 function attach(r){const s=r.seq,id=s.res.id;if(!id&&!s.given)return;const obj=s.given??makePlushObj(id);obj.userData.size??=sizeOf(id);if(!s.given)r.M.group.add(obj);s.obj=obj;hang(r,obj);}
 function dropBack(r){const s=r.seq;if(!s.obj)return;const to=s.backTo??new THREE.Vector3(s.obj.position.x,topAtM(r,s.obj.position.x,s.obj.position.z),s.obj.position.z);
  s.falling={obj:s.obj,from:s.obj.position.clone(),to:to.clone(),t:0,dur:.42,keep:!!s.given};s.obj=null;s.slipped=true;say(r,'slip');}
 function tickFalling(r,dt){const f=r.seq?.falling;if(!f)return;f.t+=dt;const k=Math.min(1,f.t/f.dur);
  f.obj.position.set(f.from.x+(f.to.x-f.from.x)*k,f.from.y+(f.to.y-f.from.y)*k*k,f.from.z+(f.to.z-f.from.z)*k);
  if(k>=1){if(!f.keep||f.chute)r.M.group.remove(f.obj);r.seq.falling=null;}}
 function stepSeq(r,dt){
  const s=r.seq;s.t+=dt;const name=SEQ[s.k],dur=SEQ_TIMES[name],k=Math.min(1,s.t/dur),e=ease(k),carryLen=SEQ_TIMES.up+SEQ_TIMES.carry;
  const grab=s.res.kind!=='miss';
  switch(name){
   case 'down':r.drop=s.depth*e;r.open=OPEN.play+(OPEN.down-OPEN.play)*Math.min(1,s.t/.2);break; // 내려가기 시작하며 벌림(0.2초), 벌린 채 바닥까지
   case 'close':r.open=OPEN.down+((grab?OPEN.grab:OPEN.shut)-OPEN.down)*e;if(k>=1&&grab&&!s.obj&&!s.slipped){attach(r);say(r,'grab');}break;
   case 'up':r.drop=s.depth*(1-e);if(s.res.kind==='near'&&s.obj&&s.t/carryLen>=.5)dropBack(r);break;
   case 'carry':r.x=s.x0+(CLAW.home[0]-s.x0)*e;r.z=s.z0+(CLAW.home[1]-s.z0)*e;if(s.res.kind==='near'&&s.obj)dropBack(r);break;
   case 'release':r.open=OPEN.grab+(OPEN.release-OPEN.grab)*e;
    if(k>=1&&s.obj){s.falling={obj:s.obj,from:s.obj.position.clone(),to:new THREE.Vector3(CLAW.home[0],CLAW.floorY-.32,CLAW.home[1]),t:0,dur:.4,chute:true};s.obj=null;say(r,'chute');}break;
   case 'fall':r.open=OPEN.release+(OPEN.play-OPEN.release)*e;r.x=CLAW.home[0]+(r.rest[0]-CLAW.home[0])*e;r.z=CLAW.home[1]+(r.rest[1]-CLAW.home[1])*e;break;
  }
  if(s.obj)hang(r,s.obj);tickFalling(r,dt);pose(r);
  if(k>=1){s.k++;s.t=0;if(s.k>=SEQ.length){finishSeq(r);return true;}}
  return false;
 }
 function finishSeq(r){
  const s=r.seq;r.seq=null;if(s.falling&&(!s.falling.keep||s.falling.chute))r.M.group.remove(s.falling.obj);if(s.obj&&!s.given)r.M.group.remove(s.obj);
  r.x=r.tx=r.rest[0];r.z=r.tz=r.rest[1];r.drop=0;r.open=OPEN.play;pose(r);
  if(r.kind==='timer'&&s.res.kind==='win')r.U.setPrize?.(nextPrize(r,s.res.id));
  if(s.local)finishLocal(r,s.res);else outcomeFx(r,s.real??s.res);
 }
 // 성공·실패 빛·소리·문으로 나오는 인형
 function outcomeFx(r,res){
  const win=res.kind==='win',rare=win&&rareOf(res.id);
  setLights(r,win?(rare?'rainbow':'win'):'idle',win?2:0);
  if(win){say(r,rare?'fanfare':'win');if(r.kind!=='timer')doorPop(r,res.id);}else say(r,res.kind==='near'?'slip':'lose');
 }
 function doorPop(r,id){if(!id)return;if(r.door)r.M.group.remove(r.door.obj);const obj=makePlushObj(id);const d=CLAW.door;obj.position.set(d[0],d[1]-.08,d[2]+.08);obj.scale.multiplyScalar(.9);r.M.group.add(obj);r.door={obj,t:0};}
 // ── 타이머 문 연출(정해진 결과대로 — 내 판·다른 손님 구경 공용)
 function startDoorSeq(r,{res,local}){clearTaken(r,{now:true});r.dseq={k:0,t:0,res,local,steps:DOOR_SEQ[res.kind]??DOOR_SEQ.miss,obj:res.kind==='win'?r.U.prize:null,from:null};
  if(res.kind==='win')say(r,'unlock');else if(res.kind==='near')say(r,'rattle');}
 function stepDoorSeq(r,dt){
  const s=r.dseq;s.t+=dt;const name=s.steps[s.k],dur=DOOR_TIMES[name],k=Math.min(1,s.t/dur),e=ease(k),D=r.U.setDoor?r.U:null;
  switch(name){
   case 'unlock':D?.setDoor({open:0,lock:'open',rattle:Math.sin(s.t*60)*.008*(1-k)});break; // 철컥: 걸쇠가 풀리며 살짝 떨림
   case 'open':D?.setDoor({open:e,lock:'open'});if(k>=1)say(r,'chute');break;
   case 'take':if(s.obj){s.from??=s.obj.position.clone();const to=r.U.spots.out;s.obj.position.set(s.from.x+(to.x-s.from.x)*e,s.from.y+(to.y-s.from.y)*e+Math.sin(k*Math.PI)*.08,s.from.z+(to.z-s.from.z)*e);s.obj.rotation.y=-.15+e*.15;}break;
   case 'hold':break;
   case 'shut':D?.setDoor({open:1-e,lock:k>=1?'locked':'open'});if(k>=1)say(r,'bump');break;
   case 'rattle':D?.setDoor({open:0,lock:'near',rattle:Math.sin(s.t*38)*TIMER_RATTLE*(1-k)*(k<.15?k/.15:1)});if(Math.floor(s.t*8)!==Math.floor((s.t-dt)*8)&&k<.7)say(r,'bump');break;
   case 'blink':D?.setDoor({open:0,lock:'miss'});break;
  }
  if(k>=1){s.k++;s.t=0;if(s.k>=s.steps.length){finishDoorSeq(r);return true;}}
  return false;
 }
 function finishDoorSeq(r){const s=r.dseq;r.dseq=null;
  // 성공이면 문을 열어 둔다(경품 받침의 큰 인형이 문 닫히는 길에 있음). 인형을 치울 때(clearTaken) 닫힘
  if(s.res.kind==='win'&&s.obj)r.U.setDoor?.({open:1,rattle:0,lock:'open'});else r.U.setDoor?.({open:0,rattle:0,lock:'locked'});
  // 꺼낸 인형은 조작대 위에 잠시 남기고(2.5초 또는 결과 카드를 닫을 때까지), 단에는 새 인형을 채운다
  if(s.res.kind==='win'&&s.obj){r.taken={obj:s.obj,t:0,keep:s.local};r.U.detachPrize?.();r.U.setPrize?.(nextPrize(r,s.res.id));}
  if(s.local)finishLocal(r,s.res);else outcomeFx(r,s.res);}
 // 꺼낸 인형 치우기 → 열린 문 닫기(0.5초). now = 바로 닫음(새 판·되돌리기)
 function clearTaken(r,{now=false}={}){if(r.taken){r.M.group.remove(r.taken.obj);r.taken=null;if(r.kind==='timer'&&r.U.door?.open>0)r.shut={t:0};}
  if(r.shut&&now){r.shut=null;r.U.setDoor?.({open:0,rattle:0,lock:'locked'});}}
 function stepShut(r,dt){const s=r.shut;s.t+=dt;const k=Math.min(1,s.t/DOOR_TIMES.shut);r.U.setDoor?.({open:1-ease(k),lock:k>=1?'locked':'open'});if(k>=1){r.shut=null;say(r,'bump');}}
 function finishLocal(r,res){outcomeFx(r,res);mode='result';phase=res.kind==='win'?'win':'lose';onEvent('result',{machine:r.i,kind:r.kind,res});}
 const nextPrize=(r,not)=>{const pool=pools[r.i].filter(id=>id!==not);return pool[Math.floor(Math.random()*pool.length)]??pools[r.i][0];};

 // ── 내 판 시작
 function start(i){
  const r=rigs[i];if(mode!=='idle'||r.owner||r.seq||r.dseq)return false;clearTaken(r,{now:true});
  cur=r;mode='play';elapsed=0;armedOnce=false;result=null;playN=(playN+1)&0xffff;phase='play';hold={x:0,z:0};pityNow=!!pityFor(i);lastV=0;
  setLights(r,'play');audio?.play('coin');let staff=false;
  if(r.kind==='claw'){r.sim.claw.power={...T.claw.power};
   // 직원 도움(보장 판, 11-24 대표 결정 — 힘센 집게는 그림 모양 판정 뒤 효과가 없음): 구멍 뒤 턱 바로 뒤에 인형 하나를 세워 둠. 실패 수는 뽑을 때까지 그대로(다음 판도 도움)
   if(pityNow){if(staffHelp(r.sim))staff=true;else pityNow=false;}
   r.sim.start();clawWon=[];doneAt=0;r.dropAt=null;r.x=r.rest[0];r.z=r.rest[1];}
  else if(r.kind==='bridge'){
   if(!r.bsim||r.bsim.won||r.refillT>0){r.refillT=0;buildBridge(r,{fresh:true,not:r.box});}
   // 직원 도움(보장 판): 상자를 처음 자리에 다시 놓음. 떨어지기 직전(아슬아슬)이면 그대로 두고 다음 판으로 미룸
   else if(pityNow){if(nearState(r.bsim,B))pityNow=false;else{buildBridge(r,{fresh:true,keep:r.box});staff=true;onEvent('mach',{machine:i,st:bridgeSave(r)});}}
   r.bsim.claw.power=bridgePower();r.bsim.start();r.bk={phase:'k1',holding:false,holdT:0,gapT:0};r.before=bridgeSnap(r.bsim);r.beforeFrame=r.bsim.frame();
   r.x=r.rest[0];r.z=r.rest[1];r.drop=0;doneAt=0;r.dropAt=null;}
  else if(r.kind==='timer'){r.timer={phase:'ready',t0:0,readyT:0,ms:0};r.U.setBand?.(T.timer);r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('start');}
  // 불빛 쌓기: 준비 0.8초 → 1줄. 직원 도움(보장 판)이면 시작 칸이 넓음(판에 「직원 도움」 글)
  else if(r.kind==='stack'){const c=T.stack;r.spec=null;r.stack={phase:'ready',at:performance.now()+c.readySec*1000,rows:[],r:1,w:pityNow?c.pityWidth:c.width,gotSmall:false,top:0,last:null,rt0:0,x:-1,win:null,cont:false,choiceAt:0};
   r.U.setBoard?.({rows:[],pity:pityNow});r.U.setButton?.('off');staff=pityNow;}
  // 줄 자르기: 가위 처음 자리에서 ①. 직원 도움이면 직원 팔이 줄을 잡음(흔들림 0)
  else if(r.kind==='string'){const c=T.string;r.cfx=null;r.U.resetStrings?.();r.U.setStaff?.(pityNow);r.U.setGuide?.({on:true,half:c.cutHalfM});r.U.setButton?.('move');r.U.setBlade?.({u:c.start,open:1});
   r.cut={phase:'k1',u:c.start,u0:c.start,holdAt:0,t0:performance.now(),gapEnd:0,k2t:0,endAt:0,res:null};staff=pityNow;}
  // 공 구멍: 공을 든 집게가 판 앞 왼쪽에서 시작(준비 0.8초), 직원 도움이면 초록 도움 구멍이 열림
  else if(r.kind==='ball'){const c=T.ball,h=c.n*c.pitchM/2;r.bfx=null;r.U.setPity?.(pityNow);r.U.markHole?.(null);r.U.setBall?.({visible:false});r.U.setButton?.('drop');
   r.bl={phase:'ready',at:performance.now()+c.readySec*1000,x:-h+.025,z:h-.025,sim:null,t:0,res:null,endAt:0,moving:false,last:0,elapsed:0};r.U.claw?.set({x:r.bl.x,z:r.bl.z,open:0,has:true});staff=pityNow;}
  else{r.key={phase:'k1',x:T.key.startX,y:T.key.startY,holding:false,holdT:0,gapT:0};r.keyFx=null;r.U.resetCells?.();r.U.setHoles?.({fit:T.key.fit,fitRare:T.key.fitRare,pity:pityNow,pityBonus:T.key.pityFitBonus});r.U.key?.set({x:r.key.x,y:r.key.y,push:0});}
  onEvent('start',{machine:i,kind:r.kind,pity:pityNow,staff});return true;
 }
 const armed=()=>mode==='play'&&!!cur&&(cur.kind!=='claw'||elapsed>=T.claw.dropLockSec);
 const holdState=r=>r.kind==='bridge'?r.bk:r.key; // 봉·열쇠 = 누르고 있다가 놓기 두 번(→ 그리고 ↑)
 // 큰 단추 누름(ts = event.timeStamp — 타이머는 이 시각으로 잰다, 화면 그리기 틈과 상관없음)
 function bigDown(ts=performance.now()){
  if(mode!=='play'||!cur)return false;
  if(cur.kind==='claw')return press();
  if(cur.kind==='ball'){if(cur.bl.phase!=='move'&&cur.bl.phase!=='ready')return false;cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),150);dropBall(cur);return true;}
  if(cur.kind==='string'){const k=cur.cut;if(k.phase==='k1'&&!k.holdAt){k.holdAt=ts;k.u0=k.u;audio?.loop('motor');cur.U.press?.(1);onEvent('phase',{phase:'k1',holding:true});return true;}
   if(k.phase==='k2'){cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),150);snipString(cur,ts);return true;}return false;}
  if(cur.kind==='stack'){if(cur.stack.phase!=='run')return false;cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),120);stopStack(cur,ts);return true;}
  if(cur.kind==='timer'){const t=cur.timer;
   if(t.phase==='ready'){t.phase='run';t.t0=ts;t.sec=null;cur.U.setButton?.('stop');cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),150);audio?.play('coin');onEvent('phase',{phase:'run'});return true;}
   if(t.phase==='run'){if(ts-t.t0<T.timer.startLockSec*1000)return false;stopTimer(ts-t.t0);return true;}
   return false;}
  const k=holdState(cur);if((k.phase==='k1'||k.phase==='k2')&&!k.holding){k.holding=true;k.holdT=0;audio?.loop('motor');onEvent('phase',{phase:k.phase,holding:true});return true;}
  return false;
 }
 // 큰 단추 뗌(열쇠만 씀)
 function bigUp(ts=performance.now()){
  if(mode==='play'&&cur?.kind==='string'){if(cur.cut.phase!=='k1'||!cur.cut.holdAt)return false;releaseString(cur,ts);return true;}
  if(mode!=='play'||!cur||(cur.kind!=='key'&&cur.kind!=='bridge'))return false;const k=holdState(cur);if(!k.holding)return false;
  k.holding=false;audio?.stop('motor');
  if(k.phase==='k1'){k.phase='gap';k.gapT=0;onEvent('phase',{phase:'gap'});}
  else if(cur.kind==='bridge'){k.phase='drop';mode='drop';phase='drop';cur.dropAt=[cur.x,cur.z];cur.bsim.setPos(cur.x/U,cur.z/U);cur.bsim.drop();audio?.play('down');cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),180);
   result={kind:'pending',id:null};onEvent('drop',{machine:cur.i,res:result});}
  else{k.phase='push';k.gapT=0;k.marked=false;mode='drop';phase='drop';audio?.play('key-in');
   const cell=(i,j)=>cur.U.cellAt?.(i,j),kr=judgeKey(k.x,k.y,T.key,(i,j)=>!!cell(i,j)?.rare,pityNow);
   result={kind:kr.r,id:kr.r==='win'?cell(kr.i,kr.j)?.id??null:null,key:kr};onEvent('drop',{machine:cur.i,res:result});}
  return true;
 }
 // 집게 「뽑기」
 function press(){
  if(!armed()||cur.kind!=='claw')return false;
  mode='drop';phase='drop';hold={x:0,z:0};audio?.stop('motor');audio?.play('down');cur.dropAt=[cur.x,cur.z];cur.sim.drop();cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),180);
  result={kind:'pending',id:null};onEvent('drop',{machine:cur.i,res:result,auto:elapsed>=T.claw.timeSec});return true;
 }
 function stopTimer(ms){
  const r=cur;r.timer.phase='stop';r.timer.ms=ms;const j=judgeTimer(ms,T.timer,pityNow);lastV=hund(ms);
  r.U.setTimer?.({text:j.shown,state:j.r});r.U.setButton?.('off');r.U.press?.(1);audio?.play('door');audio?.play(j.r==='win'?'perfect':j.r==='near'?'near':'tick'); // 멈춤 철컥 + 딱 10.00 반짝·아깝다 띠딩setTimeout(()=>r.U.press?.(0),150);
  const prize=r.U.prize,id=idOfObj(prize)??pools[r.i][0];
  result={kind:j.r,id:j.r==='win'?id:null,shown:j.shown,diff:j.diff,prize:id};
  mode='drop';phase='drop';onEvent('drop',{machine:r.i,res:result});
  startDoorSeq(r,{res:{...result,id:j.r==='win'?id:null},local:true});
 }
 // ── 불빛 쌓기(시안 stack.js 흐름 그대로). 시각은 모두 performance.now() 기준(누름 = event.timeStamp, 같은 시계)
 const SMALL=r=>MACHINES[r.i]?.prizes?.small??pools[r.i][0],BIG=r=>MACHINES[r.i]?.prizes?.big??pools[r.i][1]??pools[r.i][0];
 function stackRowStart(r,now){const s=r.stack;s.phase='run';s.rt0=now;s.x=-1;r.U.setButton?.('stop');onEvent('phase',{phase:'run',row:s.r});}
 function stopStack(r,ts){
  const s=r.stack,c=T.stack;if(s.phase!=='run')return;const now=performance.now(),{x,dir}=stackPos(ts-s.rt0,s.r,s.w,c),below=s.rows[s.r-2]??null,j=stackStop(x,s.w,dir,below);
  s.last={r:s.r,lost:j.lost.length,late:j.late};r.U.setButton?.('off');
  const falling=j.lost.map(i=>({c:i,r:s.r}));
  if(!j.w){s.phase='fall';s.at=now+c.endSec*1000;s.ending=true;mode='drop';phase='drop';r.U.setBoard?.({rows:s.rows,falling,pity:pityNow});say(r,'fall');onEvent('stack-row',{machine:r.i,...s.last,gone:true});return;}
  s.rows.push({x:j.x,w:j.w});s.w=j.w;s.top=s.r;r.U.setBoard?.({rows:s.rows,falling,pity:pityNow});
  say(r,'snap');if(j.lost.length){say(r,'fall');onEvent('stack-row',{machine:r.i,...s.last});}
  if(s.r===c.mid){s.gotSmall=true;say(r,'ding');s.phase='fall';s.at=now+c.choiceDelaySec*1000;s.toChoice=true;phase='drop';
   onEvent('stack-prize',{machine:r.i,id:SMALL(r)});return;} // 작은 인형은 지금 받음(도감·보장 0) — 계속하다 실패해도 잃지 않음
  if(s.r===c.rows){s.win='big';s.phase='out';s.at=now+c.bigOutSec*1000;mode='drop';phase='drop';r.U.setBoard?.({rows:s.rows,glow:true,pity:pityNow});setLights(r,'rainbow',c.bigOutSec+2);say(r,'fanfare');return;}
  s.r++;s.phase='fall';s.at=now+c.fallSec*1000;
 }
 /** 7줄 고르기: go = 계속하기(8줄부터, 코인·경품을 걸지 않음) / 아니면 여기서 끝(작은 인형) */
 function stackChoose(go){
  const r=cur;if(!r||r.kind!=='stack'||r.stack?.phase!=='choice')return false;const s=r.stack,now=performance.now();
  if(go){s.cont=true;s.r++;s.phase='fall';s.at=now+300;phase='play';say(r,'up');}
  else{s.win='small';s.phase='out';s.at=now+T.stack.outSec*1000;mode='drop';phase='drop';}
  onEvent('phase',{phase:go?'continue':'end'});return true;
 }
 function stackResult(r){
  const s=r.stack,c=T.stack,small=SMALL(r),near=!s.gotSmall&&s.top===c.mid-1;
  const base={top:s.top,last:s.last,small,cont:s.cont,stack:true};
  result=s.win==='big'?{kind:'win',id:BIG(r),...base,also:small}:s.gotSmall?{kind:'win',id:small,...base,pre:true}:{kind:near?'near':'miss',id:null,...base};
  finishLocal(r,result);
 }
 function stepStack(r,dt){
  const s=r.stack,c=T.stack,now=performance.now();void dt;
  if(s.phase==='ready'&&now>=s.at)stackRowStart(r,now);
  else if(s.phase==='run'){
   if(now-s.rt0>c.idleSec*1000){onEvent('stack-auto',{machine:r.i});stopStack(r,now);return;}
   const {x}=stackPos(now-s.rt0,s.r,s.w,c);if(x!==s.x){if(s.x>=0)say(r,'step',{row:s.r});s.x=x;r.U.setBoard?.({rows:s.rows,cur:{r:s.r,x,w:s.w},pity:pityNow});}}
  else if(s.phase==='fall'&&now>=s.at){
   if(s.ending){s.ending=false;s.phase='done';stackResult(r);}
   else if(s.toChoice){s.toChoice=false;s.phase='choice';s.choiceAt=now;onEvent('choice',{machine:r.i,id:SMALL(r),big:BIG(r),sec:c.choiceSec});}
   else stackRowStart(r,now);}
  else if(s.phase==='choice'&&now-s.choiceAt>=c.choiceSec*1000)stackChoose(false); // 20초 안 고르면 여기서 끝
  else if(s.phase==='out'&&now>=s.at){s.phase='done';stackResult(r);}
 }
 // ── 줄 자르기(시안 string.js release·snip 그대로). 줄 흔들림은 performance.now() 시각의 함수 → 누른 순간(event.timeStamp)의 줄 자리로 판정
 const stringStill=r=>r===cur&&pityNow&&r.cut?.phase!=='done';
 function releaseString(r,ts){const k=r.cut,c=T.string;k.u=Math.min(c.end,k.u0+c.speed*Math.max(0,ts-k.holdAt)/1000);k.holdAt=0;k.phase='gap';k.gapEnd=performance.now()+c.gapSec*1000;
  audio?.stop('motor');r.U.press?.(0);r.U.setBlade?.({u:k.u});say(r,'snap');r.U.setButton?.('off');onEvent('phase',{phase:'gap'});}
 function snipString(r,ts){const k=r.cut,c=T.string,j=judgeString(k.u,ts,pityNow,c),M=MACHINES[r.i];
  k.phase='snip';k.res=j;mode='drop';phase='drop';r.U.setButton?.('off');r.U.snip?.();say(r,'scissor');
  const dx=k.u+j.d-c.strings[j.i];
  if(j.r==='win'){r.U.cutString?.(j.i,{dx});setTimeout(()=>say(r,'drop'),450);}else if(j.r==='near'){r.U.nickString?.(j.i,{dx});say(r,'nick');}
  result={kind:j.r,id:j.r==='win'?(M?.prizes?.[j.i]??pools[r.i][j.i]??null):null,cut:{i:j.i,d:j.d,u:k.u}};k.endAt=performance.now()+(j.r==='win'?c.winSec:c.loseSec)*1000;
  onEvent('drop',{machine:r.i,res:result});}
 function stepString(r){const k=r.cut,c=T.string,now=performance.now();
  if(k.phase==='k1'){
   if(k.holdAt){k.u=Math.min(c.end,k.u0+c.speed*(now-k.holdAt)/1000);r.U.setBlade?.({u:k.u});if(now-k.holdAt>c.holdLimitSec*1000||k.u>=c.end){onEvent('string-auto',{machine:r.i,end:k.u>=c.end});releaseString(r,now);}}
   else if(now-k.t0>c.readySec*1000){onEvent('string-auto',{machine:r.i,ready:true});k.holdAt=now;k.u0=k.u;releaseString(r,now);}}
  else if(k.phase==='gap'&&now>=k.gapEnd){k.phase='k2';k.k2t=now;r.U.setButton?.('cut');onEvent('phase',{phase:'k2'});}
  else if(k.phase==='k2'&&now-k.k2t>c.cutLimitSec*1000){onEvent('string-auto',{machine:r.i,cut:true});snipString(r,now);}
  else if(k.phase==='snip'&&now>=k.endAt){k.phase='done';finishLocal(r,result);}
 }
 // ── 공 구멍 넣기: 놓으면 공 움직임을 끝까지 미리 계산(claw-ball-physics.js) → 그 길을 시각대로 그림 → 멈춘 구멍으로 판정
 const ballHoles=r=>MACHINES[r.i]?.holes??{},ballPityKey=r=>MACHINES[r.i]?.pityHole??T.ball.pityHole,ballPrize=(r,key,pity)=>pity?MACHINES[r.i]?.pityPrize??null:ballHoles(r)[key]??null;
 function dropBall(r){const b=r.bl;audio?.stop('motor');b.phase='fall';b.t=0;b.bi=0;mode='drop';phase='drop';r.dropAt=[b.x,b.z];
  b.sim=simulateBall({x:b.x,z:b.z},(seed*7919+playN*131+Math.floor(performance.now()))>>>0,{rareKey:MACHINES[r.i]?.rare??T.ball.rare});
  r.U.claw?.set({x:b.x,z:b.z,open:1,has:false});r.U.setButton?.('off');say(r,'snap');result={kind:'pending',id:null};onEvent('drop',{machine:r.i,res:result});}
 function stepBall(r,dt,dir){const b=r.bl,c=T.ball,now=performance.now(),lim=c.n*c.pitchM/2-c.ballR;
  if(b.phase==='ready'&&now>=b.at){b.phase='move';onEvent('phase',{phase:'move'});}
  if(b.phase==='move'||b.phase==='ready'){b.elapsed+=dt;if(b.phase==='move'){const nx=Math.max(-lim,Math.min(lim,b.x+dir.x*c.speed*dt)),nz=Math.max(-lim,Math.min(lim,b.z+dir.z*c.speed*dt)),mv=Math.abs(nx-b.x)+Math.abs(nz-b.z)>1e-7;
    if((dir.x&&nx!==b.x+dir.x*c.speed*dt)||(dir.z&&nz!==b.z+dir.z*c.speed*dt)){if(!b.bump){b.bump=1;audio?.play('bump');onEvent('bump',{});}}else b.bump=0;
    b.x=nx;b.z=nz;if(mv)audio?.loop('motor');else audio?.stop('motor');r.U.claw?.set({x:b.x,z:b.z,open:0,has:true});}
   if(b.elapsed>=c.readySec+c.timeSec){onEvent('ball-auto',{machine:r.i});dropBall(r);}return;}
  if(b.phase==='fall'){b.t+=dt;const p=ballAt(b.sim.path,b.t);r.U.setBall?.({x:p.x,z:p.z,h:p.h,sink:p.sink,visible:true});
   while(b.bi<b.sim.bounces.length&&b.t>=b.sim.bounces[b.bi]){say(r,'tock',{gain:Math.max(.25,1-b.bi*.18)});b.bi++;}
   if(b.t>=b.sim.sec){const pk=pityNow?ballPityKey(r):null,j=judgeBall(b.sim,{holes:ballHoles(r),pityKey:pk});b.res=j;b.phase='done';say(r,j.r==='win'?'pop':'cell');
    r.U.markHole?.(j.hole,j.r);result={kind:j.r,id:j.r==='win'?ballPrize(r,j.hole,j.pity):null,ball:{hole:j.hole,why:j.why??'',v:holeIndex(b.sim.i,b.sim.j)}};b.endAt=now+(j.r==='win'?c.winSec:c.loseSec)*1000;onEvent('drop',{machine:r.i,res:result});}}
  else if(b.phase==='done'&&now>=b.endAt){b.phase='end';finishLocal(r,result);}
 }
 function quit(){
  if(mode!=='play'||!cur)return false;
  const r=cur,got=!!r.stack?.gotSmall;mode='idle';phase='';audio?.stop('motor');resetRig(r);setLights(r,'idle');onEvent('quit',{machine:r.i,kind:r.kind,gotSmall:got});cur=null;return true;
 }
 function resetRig(r){
  r.x=r.tx=r.rest[0];r.z=r.tz=r.rest[1];r.drop=0;r.open=OPEN.play;
  if(r.kind==='claw'){const c=r.sim.claw;c.state='idle';c.x=GEOM.HOME.x;c.z=GEOM.HOME.z;c.y=GEOM.HOME.y;}
  else if(r.kind==='bridge'){const c=r.bsim.claw;c.state='idle';const H=r.U.geom.HOME;c.x=H.x;c.z=H.z;c.y=H.y;r.bk=null;}
  else pose(r);
  if(r.kind==='timer'){r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');r.timer=null;clearTaken(r,{now:true});r.U.setDoor?.({open:0,lock:'locked'});}
  if(r.kind==='key'){r.U.resetCells?.();r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});r.key=null;}
  if(r.kind==='stack'){r.U.clearBoard?.();r.U.setButton?.('off');r.stack=null;}
  if(r.kind==='string'){r.U.resetStrings?.();r.U.setGuide?.({on:false});r.U.setButton?.('off');r.U.setBlade?.({u:T.string.start,open:1});r.cut=null;}
  if(r.kind==='ball'){r.U.setBall?.({visible:false});r.U.markHole?.(null);r.U.setPity?.(false);r.U.setButton?.('off');r.bl=null;}
 }
 // 결과 카드를 닫으면(「한 판 더」·「그만」)
 function done(){if(mode!=='result')return;const r=cur;mode='idle';phase='';cur=null;clearTaken(r);
  if(r.kind==='claw'){r.wakeT=2;if(r.sim.left()<T.claw.dolls-4)buildPhysics(r);}
  // 봉: 막힘(집게가 닿지 않는 곳·여러 판 진척 없음)이면 기계가 비는 지금 처음 자리로(v4.1 §6-1)
  if(r.kind==='bridge'&&bridgeStuck(r)){buildBridge(r,{fresh:true,keep:r.box});r.U.showGhost?.(null);onEvent('reset',{machine:r.i});onEvent('mach',{machine:r.i,st:bridgeSave(r)});}
  if(r.kind==='key'){r.U.resetCells?.();r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});r.key=null;}
  if(r.kind==='timer'){r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');r.timer=null;}
  if(r.kind==='stack'){r.U.clearBoard?.();r.U.setButton?.('off');r.stack=null;}
  if(r.kind==='string'){r.U.resetStrings?.();r.U.setGuide?.({on:false});r.U.setBlade?.({u:T.string.start,open:1});r.cut=null;}
  if(r.kind==='ball'){r.U.setBall?.({visible:false});r.U.markHole?.(null);r.U.setPity?.(false);r.bl=null;}}

 // ── 매 프레임. dir = {x:-1~1(기계 오른쪽 +), z:-1~1(안쪽 −)} — 집게 십자·키
 function update(dt,dir={x:0,z:0}){
  clock+=dt;if(mode==='play'||mode==='drop')elapsed+=dt;
  if(mode==='play'&&cur){
   const r=cur;
   if(r.kind==='claw'){
    if(elapsed>=T.claw.dropLockSec&&!armedOnce){armedOnce=true;onEvent('arm',{});}
    const sp=T.claw.moveSpeed*W,moving=!!(dir.x||dir.z);
    hold.x=dir.x?Math.min(T.claw.ramp,hold.x+dt):0;hold.z=dir.z?Math.min(T.claw.ramp,hold.z+dt):0;
    const kx=T.claw.ramp>0?Math.max(.25,hold.x/T.claw.ramp):1,kz=T.claw.ramp>0?Math.max(.25,hold.z/T.claw.ramp):1;
    const nx=r.x+Math.sign(dir.x)*sp*kx*dt,nz=r.z+Math.sign(dir.z)*sp*kz*dt,cx=clamp(nx,r.range.x[0],r.range.x[1]),cz=clamp(nz,r.range.z[0],r.range.z[1]);
    if(dir.x&&cx!==nx){if(!bumpX){bumpX=1;audio?.play('bump');onEvent('bump',{});}}else bumpX=0;
    if(dir.z&&cz!==nz){if(!bumpZ){bumpZ=1;audio?.play('bump');onEvent('bump',{});}}else bumpZ=0;
    const moved=moving&&(Math.abs(cx-r.x)>1e-6||Math.abs(cz-r.z)>1e-6);r.x=r.tx=cx;r.z=r.tz=cz;r.sim.setPos(cx/U,cz/U);
    if(moved)audio?.loop('motor');else audio?.stop('motor');
    if(elapsed>=T.claw.timeSec)press();
   }else if(r.kind==='timer'){const t=r.timer;
    if(t.phase==='ready'){t.readyT+=dt;if(t.readyT>=T.timer.readyLimitSec)bigDown(performance.now());}
    else if(t.phase==='run'){const ms=performance.now()-t.t0;
     if(ms>=T.timer.maxSec*1000)stopTimer(T.timer.maxSec*1000);
     else{const hide=hideAfterOf(MACHINES[r.i]?.id,T),dim=hide>0&&ms>=hide*1000;r.U.setTimer?.({text:fmtTimer(ms),state:'run',dim});
      const sec=Math.floor(ms/1000);if(sec!==t.sec){if(t.sec!=null&&!dim)audio?.play('tick');t.sec=sec;}}}
   }else if(r.kind==='stack'){stepStack(r,dt);
   }else if(r.kind==='string'){stepString(r);
   }else if(r.kind==='ball'){stepBall(r,dt,dir);
   }else if(r.kind==='bridge'){const k=r.bk,sp=B.moveSpeed*W;
    if(k.holding){k.holdT+=dt;if(k.phase==='k1')r.x=Math.min(r.range.x[1],r.x+sp*dt);else r.z=Math.max(r.range.z[0],r.z-sp*dt);r.tx=r.x;r.tz=r.z;r.bsim.setPos(r.x/U,r.z/U);if(k.holdT>=B.holdLimitSec)bigUp();}
    if(k.phase==='gap'){k.gapT+=dt;if(k.gapT>=B.gapSec){k.phase='k2';onEvent('phase',{phase:'k2'});}}
   }else{const k=r.key,c=T.key;
    if(k.holding){k.holdT+=dt;if(k.phase==='k1')k.x=Math.min(c.cols,k.x+c.speed*dt);else k.y=Math.min(c.rows*c.cellH,k.y+c.speed*dt);if(k.holdT>=c.holdLimitSec)bigUp();}
    if(k.phase==='gap'){k.gapT+=dt;if(k.gapT>=c.gapSec){k.phase='k2';onEvent('phase',{phase:'k2'});}}
    if(cur===r&&mode==='play')r.U.key?.set({x:k.x,y:k.y,push:0});
   }
  }
  if(mode==='drop'&&cur?.kind==='stack'&&cur.stack)stepStack(cur,dt);
  if(mode==='drop'&&cur?.kind==='string'&&cur.cut)stepString(cur);
  if(mode==='drop'&&cur?.kind==='ball'&&cur.bl)stepBall(cur,dt,{x:0,z:0});
  // 열쇠 밀어 넣기 연출(판정은 bigUp에서 이미 끝남)
  if(mode==='drop'&&cur?.kind==='key'){const r=cur,k=r.key;k.gapT+=dt;const p=Math.min(1,k.gapT/.35),kw=result.key;
   // 성공이면 밀어 넣는 동안 구멍 가운데로 미끄러져 들어감(구멍 가장자리에서 성공해도 열쇠가 판에 박혀 보이지 않게)
   const [hx,hy]=kw?.r==='win'?keyHole(kw.i,kw.j,T.key):[k.x,k.y],e=p*p*(3-2*p);r.U.key?.set({x:k.x+(hx-k.x)*e,y:k.y+(hy-k.y)*e,push:p});
   if(k.gapT>=.35&&!k.marked){k.marked=true;const kr=result.key;
    if(kr.i>=0&&kr.j>=0&&kr.i<T.key.cols&&kr.j<T.key.rows){r.U.markCell?.(kr.i,kr.j,kr.r==='win'?'ok':kr.r);if(kr.r==='win'){r.U.openCell?.(kr.i,kr.j);audio?.play('cell');}else audio?.play('bump');}else audio?.play('bump');}
   if(k.gapT>=(result.kind==='win'?1.5:1.1))finishLocal(r,result);}
  for(const r of rigs){
   if(r.kind==='bridge'){ // 봉: 상자 물리. 쓰는 기계·움직이는 상자만 돌림(가만히 있는 상자는 잠듦)
    const b=r.bsim;
    if(r===cur||!b.sleeping||r.refillT>0)b.step(dt);
    for(const e of b.events.splice(0)){if(r!==cur)continue;if(e.type==='close')audio?.play('grab');else if(e.type==='lift')audio?.play('up');else if(e.type==='touch')audio?.play('push');else if(e.type==='won'){audio?.play('drop');}else if(e.type==='done')doneAt=elapsed+.9;}
    if(r===cur&&mode==='drop'&&(doneAt&&elapsed>=doneAt||elapsed>40)){
     const kind=bridgeOutcome(b,r.before,B),won=kind==='win';
     if(won){r.mv=0;r.still=0;r.lay=0;r.refillT=B.refillSec;}else{r.mv++;r.still=noProgress(b,r.before,T.share)?r.still+1:0;r.lay=b.tilt()>B.lieDeg?r.lay+1:0;}
     r.U.showGhost?.(r.beforeFrame,won?null:b.frame());
     result={kind,id:won?r.box:null,near:!won&&nearState(b,B)};r.pendingSave=true;finishLocal(r,result);}
    // 저장은 상자가 멈춘(잠든) 뒤에: 봉 끝에 걸쳐 흔들리는 중에 저장하면 다시 놓을 때 더 움직임
    if(r.pendingSave&&(b.sleeping||b.won)){r.pendingSave=false;onEvent('mach',{machine:r.i,st:bridgeSave(r)});}
    if(r.refillT>0&&r!==cur){r.refillT-=dt;if(r.refillT<=0){r.refillT=0;buildBridge(r,{fresh:true,not:r.box});onEvent('mach',{machine:r.i,st:bridgeSave(r)});}}
    if(!r.seq&&!(r.owner&&r!==cur))Object.assign(r,b.clawPose());
    syncBox(r);if(!r.seq)pose(r);
   }
   if(r.kind==='claw'){ // 집게: 물리 돌리기·결과. 휴대폰 무게(v4 §6): 쓰는 기계와 방금 끝난 기계만 돌림(나머지 더미는 잠든 채 그대로)
    if(r.wakeT>0)r.wakeT-=dt;
    const live=r===cur||r.wakeT>0;
    if(live)r.sim.step(dt);
    for(const e of r.sim.events.splice(0)){
     if(r!==cur)continue;
     if(e.type==='close')audio?.play('grab');else if(e.type==='lift')audio?.play('up');else if(e.type==='release')audio?.play('chute');
     else if(e.type==='won')clawWon.push(e.id);
     else if(e.type==='done')doneAt=elapsed+.9;}
    if(r===cur&&mode==='drop'&&(doneAt&&elapsed>=doneAt||elapsed>T.claw.timeSec+20)){
     const won=clawWon[0]??null;result={kind:won?'win':r.sim.liftedAny()?'near':'miss',id:won,more:Math.max(0,clawWon.length-1)};finishLocal(r,result);}
    if(!r.seq&&!(r.owner&&r!==cur))Object.assign(r,r.sim.clawPose());
    if(live||r.dirty!==false){syncDolls(r);r.dirty=live;}
   }
   if(r.seq)stepSeq(r,dt);
   if(r.dseq)stepDoorSeq(r,dt);
   if(r.shut)stepShut(r,dt);
   if(r.taken&&!r.taken.keep){r.taken.t+=dt;if(r.taken.t>2.5)clearTaken(r);}
   else if(r.owner&&r!==cur&&r.ownerAct?.ph==='play'){const k=1-Math.exp(-dt*10);
    if(r.kind==='claw'||r.kind==='bridge'){r.x+=(r.tx-r.x)*k;r.z+=(r.tz-r.z)*k;r.open=OPEN.play;r.drop=0;}
    if(r.kind==='key'&&r.keyFx){r.keyFx.x+=(r.keyFx.tx-r.keyFx.x)*k;r.keyFx.y+=(r.keyFx.ty-r.keyFx.y)*k;r.U.key?.set({x:r.keyFx.x,y:r.keyFx.y,push:0});}}
   if(r.kind==='claw'&&!r.seq)pose(r);
   if(r.kind==='bridge'&&r.seq)syncBox(r);
   if(r.lightT>0){r.lightT-=dt;if(r.lightT<=0)setLights(r,(r===cur&&mode==='play')||r.owner&&r.ownerAct?.ph==='play'?'play':'idle');}
   if(r.door){r.door.t+=dt;const d=r.door;d.obj.position.y=CLAW.door[1]-.08+Math.abs(Math.sin(Math.min(1,d.t/.5)*Math.PI))*.05;if(d.t>2.2){r.M.group.remove(d.obj);r.door=null;}}
   if(r.keyFx?.until&&clock>r.keyFx.until&&r!==cur){r.U.resetCells?.();r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});r.keyFx=null;}
   // 줄 자르기: 줄은 늘 흔들림(같은 시계 식, 잘린 줄은 그림이 무시). 직원 도움 판(내 판)은 0
   if(r.kind==='string'){const now=performance.now(),still=stringStill(r);for(let i=0;i<T.string.strings.length;i++)r.U.setString?.(i,{dx:stringSway(now,i,still)});
    if(r.cfx&&r!==cur){const f=r.cfx;if(f.tu!=null){f.u+=(f.tu-f.u)*(1-Math.exp(-dt*10));r.U.setBlade?.({u:f.u});}if(f.until&&clock>f.until){r.cfx=null;r.U.resetStrings?.();r.U.setGuide?.({on:false});r.U.setBlade?.({u:T.string.start,open:1});}}}
   // 공 구멍 구경: 집게는 받은 자리로 따라가고, 결과가 오면 받은 구멍에서 끝나는 길을 그림
   if(r.kind==='ball'&&r.bfx&&r!==cur){const f=r.bfx;
    if(f.sim){f.t+=dt;const p=ballAt(f.sim.path,f.t);r.U.setBall?.({x:p.x,z:p.z,h:p.h,sink:p.sink,visible:true});while(f.bi<f.sim.bounces.length&&f.t>=f.sim.bounces[f.bi]){say(r,'tock',{gain:Math.max(.25,1-f.bi*.18)});f.bi++;}
     if(f.t>=f.sim.sec&&!f.marked){f.marked=true;r.U.markHole?.(f.sim.hole,f.kind);outcomeFx(r,f.res);f.until=clock+2.5;}}
    else{const k=1-Math.exp(-dt*10);f.x+=(f.tx-f.x)*k;f.z+=(f.tz-f.z)*k;r.U.claw?.set({x:f.x,z:f.z,open:0,has:true});}
    if(f.until&&clock>f.until){r.bfx=null;r.U.setBall?.({visible:false});r.U.markHole?.(null);r.U.setPity?.(false);}}
   // 불빛 쌓기 구경: 움직이는 줄은 받은 칸 수로 이 화면이 같은 빠르기로 혼자 움직임(초당 여러 번 받지 않음, 시안 그대로)
   if(r.kind==='stack'&&r.spec&&r!==cur){const sp=r.spec;
    if(sp.moving&&sp.rows.length<T.stack.rows){const row=sp.rows.length+1,{x}=stackPos((clock-sp.rt0)*1000,row,sp.w,T.stack);if(x!==sp.x){sp.x=x;r.U.setBoard?.({rows:sp.rows,cur:{r:row,x,w:sp.w}});}}
    if(sp.until&&clock>sp.until){r.spec=null;r.U.clearBoard?.();}}
  }
 }

 // ── 다른 손님(구경). act = sanitizeAct('claw') 결과
 function watch(id,act){
  for(const r of rigs)if(r.owner===id&&(!act||act.m!==r.i+1))release(r);
  if(!act||!act.m)return;
  const r=rigs[act.m-1];if(!r||r===cur&&mode!=='idle')return; // 내가 쓰는 기계는 내 화면이 먼저(동시에 들어간 드문 경우)
  if(r.owner&&r.owner!==id)return;
  const prev=r.ownerAct,newPlay=!prev||prev.n!==act.n;r.owner=id;r.ownerAct=act;
  if(act.ph==='play'){
   if(r.lightMode!=='play'&&r.lightT<=0)setLights(r,'play');
   if(r.kind==='claw'||r.kind==='bridge'){r.tx=decodeClawPos(act.cx??50);r.tz=decodeClawPos(act.cz??50);}
   if(r.kind==='timer'&&newPlay){if(act.r&&act.r!==idOfObj(r.U.prize))r.U.setPrize?.(act.r);r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('start');}
   if(r.kind==='key'){const [x,y]=decodeKeyPos(act.cx,act.cz);if(!r.keyFx||newPlay||r.keyFx.until){r.U.resetCells?.();r.keyFx={x,y,tx:x,ty:y};}else{r.keyFx.tx=x;r.keyFx.ty=y;}}
  }
  // 공 구멍: cx·cz = 집게 자리(판 좌표 cm+50, 집게와 같은 부호화), 결과 v = 구멍 번호(j×4+i)
  if(r.kind==='ball'&&act.ph==='play'){const x=decodeClawPos(act.cx??50),z=decodeClawPos(act.cz??50);if(!r.bfx||newPlay||r.bfx.until||r.bfx.sim){r.bfx={x,z,tx:x,tz:z,sim:null};r.U.setBall?.({visible:false});r.U.markHole?.(null);}else{r.bfx.tx=x;r.bfx.tz=z;}}
  // 줄 자르기: cx = 가위 자리(mm). 결과(k)가 오면 받은 차이(v−100 mm)대로 줄을 칼날 옆에 맞춰 자르거나 자국
  if(r.kind==='string'&&act.ph==='play'){if(!r.cfx||newPlay||r.cfx.until){r.cfx={u:T.string.start,tu:null};r.U.resetStrings?.();r.U.setGuide?.({on:true,half:T.string.cutHalfM});}r.cfx.tu=Math.max(0,(act.cx??40)/1000);}
  // 불빛 쌓기: v = 쌓은 줄 수, cx·cz = 맨 위 줄 왼쪽 칸·칸 수(시작 때는 v 0·cz 시작 칸 수). 중간에 들어온 손님은 그 순간 줄까지만 그림
  if(r.kind==='stack'&&act.ph){let sp=r.spec;if(!sp||newPlay||sp.n!==act.n){sp=r.spec={n:act.n,rows:[],w:act.cz||T.stack.width,rt0:clock,x:-1,moving:false,until:0};r.U.clearBoard?.();}
   const v=Math.max(0,Math.min(T.stack.rows,act.v|0));
   if(v>sp.rows.length||v&&(sp.rows[v-1]?.x!==act.cx||sp.rows[v-1]?.w!==act.cz)){if(v)sp.rows[v-1]={x:act.cx|0,w:act.cz|0};sp.rows.length=v;for(let k=0;k<v;k++)sp.rows[k]??={x:act.cx|0,w:act.cz|0};sp.w=act.cz||sp.w;sp.rt0=clock;}
   sp.moving=act.ph==='play';sp.x=-1;r.U.setBoard?.({rows:sp.rows,glow:act.ph==='win'&&v>=T.stack.rows});}
  // 결과가 정해진 때(집게는 win/lose 단계, 타이머·열쇠는 drop 단계에 k가 실려 옴)에 같은 결과를 그린다
  const fresh=act.k&&(prev?.k!==act.k||newPlay);
  if(fresh&&!r.seq&&!r.dseq){
   const kind=KIND_OF[act.k]??'miss',res={kind,id:kind==='miss'?null:act.r||null};
   if(r.kind==='claw')startSeq(r,{x:decodeClawPos(act.cx??50),z:decodeClawPos(act.cz??50),res,local:false});
   // 봉 구경: 집게가 그 자리로 내려갔다 올라옴(상자는 못 듦 — 상자 자리 공유는 3단계, 지금은 결과 빛·경품만)
   else if(r.kind==='bridge')startSeq(r,{x:decodeClawPos(act.cx??50),z:decodeClawPos(act.cz??50),res:{kind:'miss',id:null},real:res,local:false});
   else if(r.kind==='timer'){r.U.setTimer?.({text:fmtTimer((act.v??0)*10),state:kind});r.U.setButton?.('off');
    startDoorSeq(r,{res,local:false});}
   else if(r.kind==='stack'){if(r.spec){r.spec.moving=false;r.spec.until=clock+3;}outcomeFx(r,res);}
   else if(r.kind==='ball'){const x=decodeClawPos(act.cx??50),z=decodeClawPos(act.cz??50),sim=ballPathTo({x,z},Math.max(0,Math.min(15,act.v|0)),{rareKey:MACHINES[r.i]?.rare??T.ball.rare});
    r.U.claw?.set({x,z,open:1,has:false});r.bfx={x,z,tx:x,tz:z,sim,t:0,bi:0,kind,res,marked:false};}
   else if(r.kind==='string'){const c=T.string,u=Math.max(0,(act.cx??40)/1000),i=Math.max(0,Math.min(c.strings.length-1,(act.cz||1)-1)),d=((act.v??100)-100)/1000,dx=u+d-c.strings[i];
    r.cfx={u,tu:null,until:clock+3};r.U.setBlade?.({u});r.U.snip?.();say(r,'scissor');if(kind==='win')r.U.cutString?.(i,{dx});else if(kind==='near')r.U.nickString?.(i,{dx});
    setTimeout(()=>outcomeFx(r,res),kind==='win'?900:300);}
   else{const [x,y]=decodeKeyPos(act.cx,act.cz),kr=judgeKey(x,y,T.key,(i,j)=>!!r.U.cellAt?.(i,j)?.rare,false);
    const [px,py]=kind==='win'&&kr.r==='win'?keyHole(kr.i,kr.j,T.key):[x,y];r.U.key?.set({x:px,y:py,push:1});if(kr.i>=0&&kr.j>=0&&kr.i<T.key.cols&&kr.j<T.key.rows){r.U.markCell?.(kr.i,kr.j,kind==='win'?'ok':kind);if(kind==='win')r.U.openCell?.(kr.i,kr.j);}
    outcomeFx(r,res);r.keyFx={x:px,y:py,tx:px,ty:py,until:clock+3};}
  }else if(act.ph==='drop'&&(r.kind==='claw'||r.kind==='bridge')&&!r.seq){r.tx=decodeClawPos(act.cx??50);r.tz=decodeClawPos(act.cz??50);r.open=OPEN.down;}
  if(!act.ph&&!r.seq&&!r.dseq)release(r);
 }
 function release(r){r.owner=null;r.ownerAct=null;if(!r.seq&&r!==cur){
  if(r.kind==='timer'){r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');}
  if(r.kind==='stack'&&!r.spec?.until){r.spec=null;r.U.clearBoard?.();}
  if(r.lightT<=0)setLights(r,'idle');}}
 function unwatch(id){for(const r of rigs)if(r.owner===id)release(r);}

 return {
  start,press,bigDown,bigUp,quit,done,update,watch,unwatch,stackChoose,
  /** 점검용(불빛 쌓기): 지금 줄에서 아래 줄과 딱 맞는(miss = 칸 수만큼 어긋난) 다음 순간의 시각(performance.now 기준) — bigDown(이 시각)으로 누름 */
  stackAimTs(miss=0){const r=cur;if(r?.kind!=='stack'||r.stack?.phase!=='run')return null;const s=r.stack,c=T.stack,b=s.rows[s.r-2],want=b?b.x+miss:null,st=c.steps[s.r-1],now=performance.now();
   for(let k=Math.ceil((now+60-s.rt0)/st);k<600;k++){const t=s.rt0+(k+.5)*st,p=stackPos(t-s.rt0,s.r,s.w,c);if(want==null||p.x===want)return t;}return null;},
  /** 점검용: 조작 중 집게를 그 자리로(기계 좌표 m, 범위 안으로 자름) */
  // 점검·촬영용: 타이머를 ms에서 멈춘 것으로(판정은 judgeTimer 그대로). 시작 전이면 시작한 뒤 멈춤
  stopAt(ms){if(mode!=='play'||cur?.kind!=='timer')return false;const t=cur.timer;if(t.phase==='ready'){t.phase='run';t.t0=0;}if(t.phase!=='run')return false;stopTimer(ms);return true;},
  aim(x,z){if(mode!=='play'||(cur?.kind!=='claw'&&cur?.kind!=='bridge'))return false;cur.x=cur.tx=clamp(x,cur.range.x[0],cur.range.x[1]);cur.z=cur.tz=clamp(z,cur.range.z[0],cur.range.z[1]);(cur.sim??cur.bsim).setPos(cur.x/U,cur.z/U);if(cur.bk&&cur.bk.phase==='k1'){cur.bk.phase='k2';}return true;},
  /** 점검용: 열쇠를 그 자리로(칸 단위) */
  keyTo(x,y){if(mode!=='play'||cur?.kind!=='key')return false;cur.key.x=x;cur.key.y=y;return true;},
  get mode(){return mode;},get machine(){return cur?.i??-1;},get kind(){return cur?.kind??null;},get armed(){return armed();},get result(){return result;},get pity(){return pityNow;},
  /** 타이머 기계 숫자판 지금 글·상태(옆에서 볼 때 화면 위 작은 숫자, 11-23) — 기계 그림과 같은 값 */
  get timerView(){const t=cur?.kind==='timer'?cur.U.timer:null;return t?{text:t.text,state:t.state,dim:!!t.dim}:null;},
  get timeLeft(){return cur?.kind==='claw'?Math.max(0,T.claw.timeSec-elapsed):cur?.kind==='ball'&&cur.bl?Math.max(0,T.ball.timeSec-Math.max(0,cur.bl.elapsed-T.ball.readySec)):0;},
  get ballView(){const b=cur?.kind==='ball'?cur.bl:null;return b?{phase:b.phase,x:b.x,z:b.z,pity:pityNow}:null;},
  /** 점검용(공 구멍): 집게를 판 좌표(m)로 */
  ballTo(x,z){const b=cur?.kind==='ball'?cur.bl:null;if(!b)return false;const lim=T.ball.n*T.ball.pitchM/2-T.ball.ballR;b.x=Math.max(-lim,Math.min(lim,x));b.z=Math.max(-lim,Math.min(lim,z));if(b.phase==='ready')b.phase='move';cur.U.claw?.set({x:b.x,z:b.z,open:0,has:true});return true;},
  /** 줄 자르기 화면·카메라용: 단계·가위 자리(m)·직원 도움 */
  get stringView(){const k=cur?.kind==='string'?cur.cut:null;return k?{phase:k.phase,holding:!!k.holdAt,u:k.u,pity:pityNow}:null;},
  /** 점검용(줄 자르기): ① 가위를 u(m)로(누르고 있는 중처럼) · ② 줄 i가 칼날 가운데에서 off(m) 떨어진 다음 순간 시각 */
  stringTo(u){const k=cur?.kind==='string'?cur.cut:null;if(!k||k.phase!=='k1')return false;const now=performance.now();k.holdAt=now-(u-k.u)/T.string.speed*1000;k.u0=k.u;releaseString(cur,now);return true;},
  stringAimTs(off=0,i=null){const k=cur?.kind==='string'?cur.cut:null;if(!k||k.phase!=='k2')return null;const c=T.string,ii=i??(Math.abs(c.strings[0]-k.u)<Math.abs(c.strings[1]-k.u)?0:1),t0=performance.now()+80;
   const f=t=>c.strings[ii]+stringSway(t,ii,pityNow)-k.u-off;for(let q=0;q<4000;q+=1){if(Math.sign(f(t0+q))!==Math.sign(f(t0+q+1)))return t0+q+.5;}return null;},
  /** 불빛 쌓기 화면 칩·안내용: 지금 줄·쌓은 줄·작은 인형 받음·고르기 남은 초 */
  get stackView(){const s=cur?.kind==='stack'?cur.stack:null;if(!s)return null;return {row:s.r,top:s.top,gotSmall:s.gotSmall,phase:s.phase,pity:pityNow,left:s.phase==='choice'?Math.max(0,Math.ceil(T.stack.choiceSec-(performance.now()-s.choiceAt)/1000)):0};},
  /** 큰 단추 상태: 'claw' · timer 'ready'|'run' · key 'k1'|'k1-hold'|'gap'|'k2'|'k2-hold' · 'drop' */
  get sub(){if(!cur)return '';if(mode==='drop')return 'drop';if(cur.kind==='stack')return cur.stack?.phase??'';if(cur.kind==='string'){const k=cur.cut;return k?(k.phase==='k1'&&k.holdAt?'k1-hold':k.phase):'';}if(cur.kind==='ball')return cur.bl?.phase??'';if(cur.kind==='timer')return cur.timer?.phase??'';if(cur.kind==='key'||cur.kind==='bridge'){const k=holdState(cur);return k?.holding?`${k.phase}-hold`:k?.phase??'';}return 'claw';},
  /** 봉 기계 상자 상태(이름표 「아슬아슬」·점검): near = 기계 상태가 성공에 가까움(v4.1 §5-1) */
  bridge:i=>{const r=rigs[i];if(!r?.bsim)return null;const b=r.bsim;return {box:r.box,won:b.won,refill:r.refillT>0,near:nearState(b,B),support:+b.support().toFixed(4),tilt:+b.tilt().toFixed(1),mv:r.mv,still:r.still,lay:r.lay,off:offRails(b,r.U.geom),stuck:bridgeStuck(r),st:b.boxState()};},
  busy:i=>rigs[i]?.owner??null,
  rig:i=>rigs[i],kindAt:i=>rigs[i]?.kind,
  sim:i=>rigs[i]?.sim??null,
  /** 다른 손님에게 보낼 행동 상태(ACT_SCHEMA.claw) */
  act(){
   if(!cur||mode==='idle')return {m:0,ph:'',cx:50,cz:50,r:'',k:0,n:playN,v:0};
   const res=result&&result.kind!=='pending'?result:null,okId=id=>id&&/^[a-z0-9-]{1,24}$/.test(id)?id:'';
   let cx=50,cz=50,r='';
   if(cur.kind==='claw'||cur.kind==='bridge'){cx=encodeClawPos(cur.x);cz=encodeClawPos(cur.z);}
   else if(cur.kind==='key'){[cx,cz]=encodeKeyPos(cur.key.x,cur.key.y);}
   else if(cur.kind==='ball'){const b=cur.bl;if(b){const [ax,az]=cur.dropAt&&b.phase!=='move'&&b.phase!=='ready'?cur.dropAt:[b.x,b.z];cx=encodeClawPos(ax);cz=encodeClawPos(az);}}
   else if(cur.kind==='string'){const k=cur.cut;if(k){cx=Math.round(k.u*1000);cz=0;if(k.res){cz=k.res.i+1;}}}
   else if(cur.kind==='stack'){const s=cur.stack;if(s){const t=s.rows[s.top-1];cx=t?t.x:0;cz=t?t.w:s.w;if(s.gotSmall)r=SMALL(cur);}}
   else if(cur.kind==='bridge')r='';
   else r=okId(idOfObj(cur.U.prize));
   // 집게는 물리가 끝나야 결과를 알아서 drop 동안 k=0(집게 자리만), 결과가 나오면 win/lose 단계에 r·k가 실림
   if((cur.kind==='claw'||cur.kind==='bridge')&&cur.dropAt&&(mode==='drop'||mode==='result')){cx=encodeClawPos(cur.dropAt[0]);cz=encodeClawPos(cur.dropAt[1]);}
   return {m:cur.i+1,ph:phase,cx,cz,r:okId(res?.id)||r,k:res?KIND_CODE[res.kind]??0:0,n:playN,v:cur.kind==='ball'?res?.ball?.v??0:cur.kind==='timer'?lastV:cur.kind==='stack'?cur.stack?.top??0:cur.kind==='string'&&cur.cut?.res?Math.max(0,Math.min(200,Math.round(cur.cut.res.d*1000)+100)):0};
  },
  status:()=>({mode,machine:cur?.i??-1,kind:cur?.kind??null,timeLeft:+(cur?.kind==='claw'?Math.max(0,T.claw.timeSec-elapsed):0).toFixed(2),armed:armed(),pity:pityNow,
   claw:cur?.kind==='claw'?{x:+cur.x.toFixed(3),z:+cur.z.toFixed(3),drop:+cur.drop.toFixed(3),state:cur.sim.claw.state}:cur?.kind==='bridge'?{x:+cur.x.toFixed(3),z:+cur.z.toFixed(3),drop:+cur.drop.toFixed(3),state:cur.bsim.claw.state,phase:cur.bk?.phase}:null,
   timer:cur?.kind==='timer'?{phase:cur.timer?.phase,text:cur.U.timer?.text}:null,key:cur?.kind==='key'?{phase:cur.key?.phase,x:+cur.key.x.toFixed(3),y:+cur.key.y.toFixed(3)}:null,result,
   ball:cur?.kind==='ball'&&cur.bl?{phase:cur.bl.phase,x:+cur.bl.x.toFixed(4),z:+cur.bl.z.toFixed(4),hole:cur.bl.sim?.hole??null,res:cur.bl.res}:null,
   string:cur?.kind==='string'&&cur.cut?{phase:cur.cut.phase,u:+cur.cut.u.toFixed(4),holding:!!cur.cut.holdAt,res:cur.cut.res}:null,
   stack:cur?.kind==='stack'&&cur.stack?{phase:cur.stack.phase,row:cur.stack.r,top:cur.stack.top,w:cur.stack.w,gotSmall:cur.stack.gotSmall,rows:cur.stack.rows.map(o=>[o.x,o.w])}:null,
   rigs:rigs.map(r=>({kind:r.kind,owner:r.owner,seq:r.seq?SEQ[r.seq.k]:r.dseq?r.dseq.steps[r.dseq.k]:null,door:r.U.door?{open:+r.U.door.open.toFixed(2),lock:r.U.door.lock}:undefined,taken:!!r.taken,lights:r.lightMode,x:+r.x.toFixed(3),z:+r.z.toFixed(3),dolls:r.sim?r.sim.left():null}))}),
 };
}
