// 인형뽑기 한 판 진행(월드개발, 2026-11-23). 기계 3종(월드디자인 설계 v3): 집게(물리, 대표 결정)·타이머(딱 10.00)·열쇠(칸 고르기).
// 공통 순서: start(코인은 main.js가 먼저 냄) → 조작(play) → 판정 연출(drop, 입력 잠금) → 결과(result, 카드는 claw-hud.js) → done()으로 기계 앞 서기.
//  - 집게: claw-physics.js가 인형·집게발을 실제로 움직이고, 구멍으로 떨어진 인형 = 성공, 들었다 떨어뜨림 = 아까움, 못 듦 = 실패.
//  - 타이머: 큰 단추 누른 순간(event.timeStamp)으로 시간을 재고, 화면에 멈춘 숫자로만 판정(claw-rules.js judgeTimer). 연출은 단 위 집게가 인형을 집어 구멍으로.
//  - 열쇠: 누르고 있기 두 번(→ 그리고 ↑), 뗀 자리로 판정(judgeKey). 성공이면 칸 바닥이 열리고 인형이 나옴.
// 다른 손님이 쓰는 기계는 그 사람의 act(m·ph·cx·cz·r·k·n·v)를 받아 같은 결과를 그린다(결과는 그 사람 화면이 정함. 집게 물리는 다시 돌리지 않고 집게 움직임만 따라 그림).
// 그림·치수는 월드아트 claw-machine-art.js(CLAW·claw.set)·claw-machines-more.js(타이머 setTimer·열쇠 key.set). 이 파일은 DOM을 모른다.
import * as THREE from 'three';
import {CLAW} from './claw-machine-art.js';
import {plushGeometry,plushMaterial,plushLineMaterial} from './claw-plush.js';
import {geomFrom,createClawSim,toMachine,U} from './claw-physics.js';
import {CLAW_TUNING,judgeTimer,judgeKey,fmtTimer,hund,encodeClawPos,decodeClawPos,encodeKeyPos,decodeKeyPos,KIND_CODE,KIND_OF} from './claw-rules.js';

// 타이머 연출·구경 연출(집게가 정해진 결과대로 움직임) 단계 시간(초)
export const SEQ_TIMES=Object.freeze({down:1.0,close:.45,up:.9,carry:1.0,release:.35,fall:.55,settle:.35});
const SEQ=['down','close','up','carry','release','fall','settle'];
// 집게 벌림(그림 open). play = 물리 쉼 자세(CLAW_RIG.rest)와 같게, down = 물리 내려가기(CLAW_RIG.open)와 같게 — 내 판·구경·타이머가 같은 모양
const OPEN={play:.21,down:.62,grab:.32,shut:0,release:.75};
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2;
const GEOM=geomFrom(CLAW);
const idOfObj=o=>o?.userData?.plushId??(o?.name?.includes(':')?o.name.split(':').pop():null);

/**
 * shop = buildClawShop({kinds:true}) 결과, pools[i] = 기계 i 인형 id(손님 자리 바꾼 것), makePlushObj(id) → 인형 3D, sizeOf·rarityOf(id)
 * pityFor(i) → 이번 판 보장인가, onEvent(type,detail): 'start'·'arm'·'drop'·'result'·'quit'·'bump'·'phase'
 */
export function createClawPlay({shop,pools,makePlushObj,sizeOf,rarityOf=()=>'common',toonify=null,audio=null,pityFor=()=>false,onEvent=()=>{},rareOf=()=>false,T=CLAW_TUNING,seed=7}){
 const rigs=shop.userData.machines.map((M,i)=>{const U2=M.group.userData,kind=U2.kind??M.kind??'claw';
  const rest=kind==='timer'?[U2.stage.x,U2.stage.z]:[CLAW.home[0],CLAW.home[1]];
  return {i,M,U:U2,kind,rest,x:rest[0],z:rest[1],tx:rest[0],tz:rest[1],drop:0,open:OPEN.play,seq:null,owner:null,ownerAct:null,lightT:0,lightMode:'idle',
   sim:null,views:null,timer:null,key:null,keyFx:null,door:null};});
 let mode='idle',cur=null,elapsed=0,clock=0,armedOnce=false,result=null,playN=0,phase='',hold={x:0,z:0},bumpX=0,bumpZ=0,pityNow=false,clawWon=[],doneAt=0,lastV=0,refills=0;
 const P=CLAW.play,W=CLAW.width;

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
   const im=new THREE.InstancedMesh(geo.color,plushMaterial(),list.length);im.name=`물리 인형:${id}`;im.castShadow=false;im.receiveShadow=true;im.frustumCulled=false;
   const lm=new THREE.InstancedMesh(geo.line,plushLineMaterial(),list.length);lm.userData.outline=true;lm.name='outline';lm.frustumCulled=false;
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
 for(const r of rigs){
  if(r.kind==='claw')buildPhysics(r);
  if(r.kind==='timer'){r.U.setBand?.(T.timer);r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');}
  if(r.kind==='key'){r.U.setHoles?.({fit:T.key.fit,fitRare:T.key.fitRare,pity:false,pityBonus:T.key.pityFitBonus});r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});}
 }

 function setLights(r,m,sec=0){r.lightMode=m;r.lightT=sec;r.U.setLights?.(m);}
 const topAtM=(r,x,z)=>r.sim?GEOM.floorY+r.sim.topAt(x/U,z/U)*U:CLAW.floorY;
 function pose(r){const live=r.sim&&!r.seq&&!(r.owner&&r!==cur);r.U.claw?.set({x:r.x,z:r.z,drop:r.drop,open:r.open,opens:live?r.opens:null,dotY:topAtM(r,r.x,r.z)});}
 const tipY=r=>CLAW.clawTop-r.drop;

 // ── 정해진 결과대로 움직이는 집게(타이머 연출·다른 손님 구경). given = 이미 있는 인형(타이머 단 위), 없으면 makePlushObj로 새로
 function startSeq(r,{x,z,res,local,obj=null,backTo=null}){
  const top=obj?obj.position.y+(obj.userData.size??sizeOf(idOfObj(obj)))*.85:topAtM(r,x,z)+.05;
  r.seq={k:0,t:0,x0:x,z0:z,depth:clamp(CLAW.clawTop-top,.06,CLAW.dropMax),res,local,obj:null,given:obj,backTo,falling:null,slipped:false};
  r.x=r.tx=x;r.z=r.tz=z;audio?.play('down');
 }
 function hang(r,obj){const s=obj.userData.size??sizeOf(idOfObj(obj))??.24;obj.position.set(r.x,tipY(r)-s*.62,r.z);}
 function attach(r){const s=r.seq,id=s.res.id;if(!id&&!s.given)return;const obj=s.given??makePlushObj(id);obj.userData.size??=sizeOf(id);if(!s.given)r.M.group.add(obj);s.obj=obj;hang(r,obj);}
 function dropBack(r){const s=r.seq;if(!s.obj)return;const to=s.backTo??new THREE.Vector3(s.obj.position.x,topAtM(r,s.obj.position.x,s.obj.position.z),s.obj.position.z);
  s.falling={obj:s.obj,from:s.obj.position.clone(),to:to.clone(),t:0,dur:.42,keep:!!s.given};s.obj=null;s.slipped=true;audio?.play('slip');}
 function tickFalling(r,dt){const f=r.seq?.falling;if(!f)return;f.t+=dt;const k=Math.min(1,f.t/f.dur);
  f.obj.position.set(f.from.x+(f.to.x-f.from.x)*k,f.from.y+(f.to.y-f.from.y)*k*k,f.from.z+(f.to.z-f.from.z)*k);
  if(k>=1){if(!f.keep||f.chute)r.M.group.remove(f.obj);r.seq.falling=null;}}
 function stepSeq(r,dt){
  const s=r.seq;s.t+=dt;const name=SEQ[s.k],dur=SEQ_TIMES[name],k=Math.min(1,s.t/dur),e=ease(k),carryLen=SEQ_TIMES.up+SEQ_TIMES.carry;
  const grab=s.res.kind!=='miss';
  switch(name){
   case 'down':r.drop=s.depth*e;r.open=OPEN.play+(OPEN.down-OPEN.play)*Math.min(1,s.t/.2);break; // 내려가기 시작하며 벌림(0.2초), 벌린 채 바닥까지
   case 'close':r.open=OPEN.down+((grab?OPEN.grab:OPEN.shut)-OPEN.down)*e;if(k>=1&&grab&&!s.obj&&!s.slipped){attach(r);audio?.play('grab');}break;
   case 'up':r.drop=s.depth*(1-e);if(s.res.kind==='near'&&s.obj&&s.t/carryLen>=.5)dropBack(r);break;
   case 'carry':r.x=s.x0+(CLAW.home[0]-s.x0)*e;r.z=s.z0+(CLAW.home[1]-s.z0)*e;if(s.res.kind==='near'&&s.obj)dropBack(r);break;
   case 'release':r.open=OPEN.grab+(OPEN.release-OPEN.grab)*e;
    if(k>=1&&s.obj){s.falling={obj:s.obj,from:s.obj.position.clone(),to:new THREE.Vector3(CLAW.home[0],CLAW.floorY-.32,CLAW.home[1]),t:0,dur:.4,chute:true};s.obj=null;audio?.play('chute');}break;
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
  if(s.local)finishLocal(r,s.res);else outcomeFx(r,s.res);
 }
 // 성공·실패 빛·소리·문으로 나오는 인형
 function outcomeFx(r,res){
  const win=res.kind==='win',rare=win&&rareOf(res.id);
  setLights(r,win?(rare?'rainbow':'win'):'idle',win?2:0);
  if(win){audio?.play(rare?'fanfare':'win');doorPop(r,res.id);}else audio?.play(res.kind==='near'?'slip':'lose');
 }
 function doorPop(r,id){if(!id)return;if(r.door)r.M.group.remove(r.door.obj);const obj=makePlushObj(id);const d=CLAW.door;obj.position.set(d[0],d[1]-.08,d[2]+.08);obj.scale.multiplyScalar(.9);r.M.group.add(obj);r.door={obj,t:0};}
 function finishLocal(r,res){outcomeFx(r,res);mode='result';phase=res.kind==='win'?'win':'lose';onEvent('result',{machine:r.i,kind:r.kind,res});}
 const nextPrize=(r,not)=>{const pool=pools[r.i].filter(id=>id!==not);return pool[Math.floor(Math.random()*pool.length)]??pools[r.i][0];};

 // ── 내 판 시작
 function start(i){
  const r=rigs[i];if(mode!=='idle'||r.owner||r.seq)return false;
  cur=r;mode='play';elapsed=0;armedOnce=false;result=null;playN=(playN+1)&0xffff;phase='play';hold={x:0,z:0};pityNow=!!pityFor(i);lastV=0;
  setLights(r,'play');audio?.play('coin');
  if(r.kind==='claw'){r.sim.claw.power={...(pityNow?T.claw.pityPower:T.claw.power)};r.sim.start();clawWon=[];doneAt=0;r.dropAt=null;r.x=r.rest[0];r.z=r.rest[1];}
  else if(r.kind==='timer'){r.timer={phase:'ready',t0:0,readyT:0,ms:0};r.U.setBand?.(T.timer);r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('start');}
  else{r.key={phase:'k1',x:T.key.startX,y:T.key.startY,holding:false,holdT:0,gapT:0};r.keyFx=null;r.U.resetCells?.();r.U.setHoles?.({fit:T.key.fit,fitRare:T.key.fitRare,pity:pityNow,pityBonus:T.key.pityFitBonus});r.U.key?.set({x:r.key.x,y:r.key.y,push:0});}
  onEvent('start',{machine:i,kind:r.kind,pity:pityNow});return true;
 }
 const armed=()=>mode==='play'&&!!cur&&(cur.kind!=='claw'||elapsed>=T.claw.dropLockSec);
 // 큰 단추 누름(ts = event.timeStamp — 타이머는 이 시각으로 잰다, 화면 그리기 틈과 상관없음)
 function bigDown(ts=performance.now()){
  if(mode!=='play'||!cur)return false;
  if(cur.kind==='claw')return press();
  if(cur.kind==='timer'){const t=cur.timer;
   if(t.phase==='ready'){t.phase='run';t.t0=ts;cur.U.setButton?.('stop');cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),150);audio?.play('coin');onEvent('phase',{phase:'run'});return true;}
   if(t.phase==='run'){if(ts-t.t0<T.timer.startLockSec*1000)return false;stopTimer(ts-t.t0);return true;}
   return false;}
  const k=cur.key;if((k.phase==='k1'||k.phase==='k2')&&!k.holding){k.holding=true;k.holdT=0;audio?.loop('motor');onEvent('phase',{phase:k.phase,holding:true});return true;}
  return false;
 }
 // 큰 단추 뗌(열쇠만 씀)
 function bigUp(){
  if(mode!=='play'||!cur||cur.kind!=='key')return false;const k=cur.key;if(!k.holding)return false;
  k.holding=false;audio?.stop('motor');
  if(k.phase==='k1'){k.phase='gap';k.gapT=0;onEvent('phase',{phase:'gap'});}
  else{k.phase='push';k.gapT=0;k.marked=false;mode='drop';phase='drop';
   const cell=(i,j)=>cur.U.cellAt?.(i,j),kr=judgeKey(k.x,k.y,T.key,(i,j)=>!!cell(i,j)?.rare,pityNow);
   result={kind:kr.r,id:kr.r==='win'?cell(kr.i,kr.j)?.id??null:null,key:kr};onEvent('drop',{machine:cur.i,res:result});}
  return true;
 }
 // 집게 「뽑기」
 function press(){
  if(!armed()||cur.kind!=='claw')return false;
  mode='drop';phase='drop';hold={x:0,z:0};audio?.stop('motor');cur.dropAt=[cur.x,cur.z];cur.sim.drop();cur.U.press?.(1);const r=cur;setTimeout(()=>r.U.press?.(0),180);
  result={kind:'pending',id:null};onEvent('drop',{machine:cur.i,res:result,auto:elapsed>=T.claw.timeSec});return true;
 }
 function stopTimer(ms){
  const r=cur;r.timer.phase='stop';r.timer.ms=ms;const j=judgeTimer(ms,T.timer,pityNow);lastV=hund(ms);
  r.U.setTimer?.({text:j.shown,state:j.r});r.U.setButton?.('off');r.U.press?.(1);setTimeout(()=>r.U.press?.(0),150);
  const prize=r.U.prize,id=idOfObj(prize)??pools[r.i][0];
  result={kind:j.r,id:j.r==='win'?id:null,shown:j.shown,diff:j.diff,prize:id};
  mode='drop';phase='drop';onEvent('drop',{machine:r.i,res:result});
  startSeq(r,{x:r.rest[0],z:r.rest[1],res:{...result,id:j.r==='miss'?null:id},local:true,obj:j.r==='miss'?null:prize,backTo:r.U.stage?.clone()});
 }
 function quit(){
  if(mode!=='play'||!cur)return false;
  const r=cur;mode='idle';phase='';audio?.stop('motor');resetRig(r);setLights(r,'idle');onEvent('quit',{machine:r.i});cur=null;return true;
 }
 function resetRig(r){
  r.x=r.tx=r.rest[0];r.z=r.tz=r.rest[1];r.drop=0;r.open=OPEN.play;
  if(r.kind==='claw'){const c=r.sim.claw;c.state='idle';c.x=GEOM.HOME.x;c.z=GEOM.HOME.z;c.y=GEOM.HOME.y;}else pose(r);
  if(r.kind==='timer'){r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');r.timer=null;}
  if(r.kind==='key'){r.U.resetCells?.();r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});r.key=null;}
 }
 // 결과 카드를 닫으면(「한 판 더」·「그만」)
 function done(){if(mode!=='result')return;const r=cur;mode='idle';phase='';cur=null;
  if(r.kind==='claw'&&r.sim.left()<T.claw.dolls-4)buildPhysics(r);
  if(r.kind==='key'){r.U.resetCells?.();r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});r.key=null;}
  if(r.kind==='timer'){r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');r.timer=null;}}

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
    const nx=r.x+Math.sign(dir.x)*sp*kx*dt,nz=r.z+Math.sign(dir.z)*sp*kz*dt,cx=clamp(nx,P.x[0],P.x[1]),cz=clamp(nz,P.z[0],P.z[1]);
    if(dir.x&&cx!==nx){if(!bumpX){bumpX=1;audio?.play('bump');onEvent('bump',{});}}else bumpX=0;
    if(dir.z&&cz!==nz){if(!bumpZ){bumpZ=1;audio?.play('bump');onEvent('bump',{});}}else bumpZ=0;
    const moved=moving&&(Math.abs(cx-r.x)>1e-6||Math.abs(cz-r.z)>1e-6);r.x=r.tx=cx;r.z=r.tz=cz;r.sim.setPos(cx/U,cz/U);
    if(moved)audio?.loop('motor');else audio?.stop('motor');
    if(elapsed>=T.claw.timeSec)press();
   }else if(r.kind==='timer'){const t=r.timer;
    if(t.phase==='ready'){t.readyT+=dt;if(t.readyT>=T.timer.readyLimitSec)bigDown(performance.now());}
    else if(t.phase==='run'){const ms=performance.now()-t.t0;
     if(ms>=T.timer.maxSec*1000)stopTimer(T.timer.maxSec*1000);
     else r.U.setTimer?.({text:fmtTimer(ms),state:'run',dim:T.timer.hideAfterSec>0&&ms>=T.timer.hideAfterSec*1000});}
   }else{const k=r.key,c=T.key;
    if(k.holding){k.holdT+=dt;if(k.phase==='k1')k.x=Math.min(c.cols,k.x+c.speed*dt);else k.y=Math.min(c.rows*c.cellH,k.y+c.speed*dt);if(k.holdT>=c.holdLimitSec)bigUp();}
    if(k.phase==='gap'){k.gapT+=dt;if(k.gapT>=c.gapSec){k.phase='k2';onEvent('phase',{phase:'k2'});}}
    if(cur===r&&mode==='play')r.U.key?.set({x:k.x,y:k.y,push:0});
   }
  }
  // 열쇠 밀어 넣기 연출(판정은 bigUp에서 이미 끝남)
  if(mode==='drop'&&cur?.kind==='key'){const r=cur,k=r.key;k.gapT+=dt;r.U.key?.set({x:k.x,y:k.y,push:Math.min(1,k.gapT/.35)});
   if(k.gapT>=.35&&!k.marked){k.marked=true;const kr=result.key;
    if(kr.i>=0&&kr.j>=0&&kr.i<T.key.cols&&kr.j<T.key.rows){r.U.markCell?.(kr.i,kr.j,kr.r==='win'?'ok':kr.r);if(kr.r==='win'){r.U.openCell?.(kr.i,kr.j);audio?.play('grab');}else audio?.play('bump');}else audio?.play('bump');}
   if(k.gapT>=(result.kind==='win'?1.5:1.1))finishLocal(r,result);}
  for(const r of rigs){
   if(r.kind==='claw'){ // 집게: 물리 돌리기·결과
    r.sim.step(dt);
    for(const e of r.sim.events.splice(0)){
     if(r!==cur)continue;
     if(e.type==='close')audio?.play('grab');else if(e.type==='release')audio?.play('chute');
     else if(e.type==='won')clawWon.push(e.id);
     else if(e.type==='done')doneAt=elapsed+.9;}
    if(r===cur&&mode==='drop'&&(doneAt&&elapsed>=doneAt||elapsed>T.claw.timeSec+20)){
     const won=clawWon[0]??null;result={kind:won?'win':r.sim.liftedAny()?'near':'miss',id:won,more:Math.max(0,clawWon.length-1)};finishLocal(r,result);}
    if(!r.seq&&!(r.owner&&r!==cur))Object.assign(r,r.sim.clawPose());
    syncDolls(r);
   }
   if(r.seq)stepSeq(r,dt);
   else if(r.owner&&r!==cur&&r.ownerAct?.ph==='play'){const k=1-Math.exp(-dt*10);
    if(r.kind==='claw'){r.x+=(r.tx-r.x)*k;r.z+=(r.tz-r.z)*k;r.open=OPEN.play;r.drop=0;}
    if(r.kind==='key'&&r.keyFx){r.keyFx.x+=(r.keyFx.tx-r.keyFx.x)*k;r.keyFx.y+=(r.keyFx.ty-r.keyFx.y)*k;r.U.key?.set({x:r.keyFx.x,y:r.keyFx.y,push:0});}}
   if(r.kind==='claw'&&!r.seq)pose(r);
   if(r.lightT>0){r.lightT-=dt;if(r.lightT<=0)setLights(r,(r===cur&&mode==='play')||r.owner&&r.ownerAct?.ph==='play'?'play':'idle');}
   if(r.door){r.door.t+=dt;const d=r.door;d.obj.position.y=CLAW.door[1]-.08+Math.abs(Math.sin(Math.min(1,d.t/.5)*Math.PI))*.05;if(d.t>2.2){r.M.group.remove(d.obj);r.door=null;}}
   if(r.keyFx?.until&&clock>r.keyFx.until&&r!==cur){r.U.resetCells?.();r.U.key?.set({x:T.key.startX,y:T.key.startY,push:0});r.keyFx=null;}
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
   if(r.kind==='claw'){r.tx=decodeClawPos(act.cx??50);r.tz=decodeClawPos(act.cz??50);}
   if(r.kind==='timer'&&newPlay){if(act.r&&act.r!==idOfObj(r.U.prize))r.U.setPrize?.(act.r);r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('start');}
   if(r.kind==='key'){const [x,y]=decodeKeyPos(act.cx,act.cz);if(!r.keyFx||newPlay||r.keyFx.until){r.U.resetCells?.();r.keyFx={x,y,tx:x,ty:y};}else{r.keyFx.tx=x;r.keyFx.ty=y;}}
  }
  // 결과가 정해진 때(집게는 win/lose 단계, 타이머·열쇠는 drop 단계에 k가 실려 옴)에 같은 결과를 그린다
  const fresh=act.k&&(prev?.k!==act.k||newPlay);
  if(fresh&&!r.seq){
   const kind=KIND_OF[act.k]??'miss',res={kind,id:kind==='miss'?null:act.r||null};
   if(r.kind==='claw')startSeq(r,{x:decodeClawPos(act.cx??50),z:decodeClawPos(act.cz??50),res,local:false});
   else if(r.kind==='timer'){r.U.setTimer?.({text:fmtTimer((act.v??0)*10),state:kind});r.U.setButton?.('off');
    startSeq(r,{x:r.rest[0],z:r.rest[1],res,local:false,obj:kind==='miss'?null:r.U.prize,backTo:r.U.stage?.clone()});}
   else{const [x,y]=decodeKeyPos(act.cx,act.cz),kr=judgeKey(x,y,T.key,(i,j)=>!!r.U.cellAt?.(i,j)?.rare,false);
    r.U.key?.set({x,y,push:1});if(kr.i>=0&&kr.j>=0&&kr.i<T.key.cols&&kr.j<T.key.rows){r.U.markCell?.(kr.i,kr.j,kind==='win'?'ok':kind);if(kind==='win')r.U.openCell?.(kr.i,kr.j);}
    outcomeFx(r,res);r.keyFx={x,y,tx:x,ty:y,until:clock+3};}
  }else if(act.ph==='drop'&&r.kind==='claw'&&!r.seq){r.tx=decodeClawPos(act.cx??50);r.tz=decodeClawPos(act.cz??50);r.open=OPEN.down;}
  if(!act.ph&&!r.seq)release(r);
 }
 function release(r){r.owner=null;r.ownerAct=null;if(!r.seq&&r!==cur){
  if(r.kind==='timer'){r.U.setTimer?.({text:'00.00',state:'ready'});r.U.setButton?.('off');}
  if(r.lightT<=0)setLights(r,'idle');}}
 function unwatch(id){for(const r of rigs)if(r.owner===id)release(r);}

 return {
  start,press,bigDown,bigUp,quit,done,update,watch,unwatch,
  /** 점검용: 조작 중 집게를 그 자리로(기계 좌표 m, 범위 안으로 자름) */
  aim(x,z){if(mode!=='play'||cur?.kind!=='claw')return false;cur.x=cur.tx=clamp(x,P.x[0],P.x[1]);cur.z=cur.tz=clamp(z,P.z[0],P.z[1]);cur.sim.setPos(cur.x/U,cur.z/U);return true;},
  /** 점검용: 열쇠를 그 자리로(칸 단위) */
  keyTo(x,y){if(mode!=='play'||cur?.kind!=='key')return false;cur.key.x=x;cur.key.y=y;return true;},
  get mode(){return mode;},get machine(){return cur?.i??-1;},get kind(){return cur?.kind??null;},get armed(){return armed();},get result(){return result;},get pity(){return pityNow;},
  get timeLeft(){return cur?.kind==='claw'?Math.max(0,T.claw.timeSec-elapsed):0;},
  /** 큰 단추 상태: 'claw' · timer 'ready'|'run' · key 'k1'|'k1-hold'|'gap'|'k2'|'k2-hold' · 'drop' */
  get sub(){if(!cur)return '';if(mode==='drop')return 'drop';if(cur.kind==='timer')return cur.timer?.phase??'';if(cur.kind==='key')return cur.key?.holding?`${cur.key.phase}-hold`:cur.key?.phase??'';return 'claw';},
  busy:i=>rigs[i]?.owner??null,
  rig:i=>rigs[i],kindAt:i=>rigs[i]?.kind,
  sim:i=>rigs[i]?.sim??null,
  /** 다른 손님에게 보낼 행동 상태(ACT_SCHEMA.claw) */
  act(){
   if(!cur||mode==='idle')return {m:0,ph:'',cx:50,cz:50,r:'',k:0,n:playN,v:0};
   const res=result&&result.kind!=='pending'?result:null,okId=id=>id&&/^[a-z0-9-]{1,24}$/.test(id)?id:'';
   let cx=50,cz=50,r='';
   if(cur.kind==='claw'){cx=encodeClawPos(cur.x);cz=encodeClawPos(cur.z);}
   else if(cur.kind==='key'){[cx,cz]=encodeKeyPos(cur.key.x,cur.key.y);}
   else r=okId(idOfObj(cur.U.prize));
   // 집게는 물리가 끝나야 결과를 알아서 drop 동안 k=0(집게 자리만), 결과가 나오면 win/lose 단계에 r·k가 실림
   if(cur.kind==='claw'&&cur.dropAt&&(mode==='drop'||mode==='result')){cx=encodeClawPos(cur.dropAt[0]);cz=encodeClawPos(cur.dropAt[1]);}
   return {m:cur.i+1,ph:phase,cx,cz,r:okId(res?.id)||r,k:res?KIND_CODE[res.kind]??0:0,n:playN,v:cur.kind==='timer'?lastV:0};
  },
  status:()=>({mode,machine:cur?.i??-1,kind:cur?.kind??null,timeLeft:+(cur?.kind==='claw'?Math.max(0,T.claw.timeSec-elapsed):0).toFixed(2),armed:armed(),pity:pityNow,
   claw:cur?.kind==='claw'?{x:+cur.x.toFixed(3),z:+cur.z.toFixed(3),drop:+cur.drop.toFixed(3),state:cur.sim.claw.state}:null,
   timer:cur?.kind==='timer'?{phase:cur.timer?.phase,text:cur.U.timer?.text}:null,key:cur?.kind==='key'?{phase:cur.key?.phase,x:+cur.key.x.toFixed(3),y:+cur.key.y.toFixed(3)}:null,result,
   rigs:rigs.map(r=>({kind:r.kind,owner:r.owner,seq:r.seq?SEQ[r.seq.k]:null,lights:r.lightMode,x:+r.x.toFixed(3),z:+r.z.toFixed(3),dolls:r.sim?r.sim.left():null}))}),
 };
}
