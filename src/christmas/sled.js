// 눈썰매 타기 계산(월드개발, 2026-11-16 · 11-17 긴 코스·조작 개편 · 11-17 2차: 판마다 다른 코스·조작감). three 없음(시험에서 바로 부른다).
// 코스는 sled-course.js makeCourse(seed). createRide({course})로 그 코스를 탄다(없으면 오늘의 코스).
// 조작(2차, 「조작이 잘 안 된다」 해소):
//  - 기울이기: 키는 0→최대 0.18초에 걸쳐 차오르고 떼면 0.12초에 0. 꺾임 각속도는 속도에 따라 부드럽게: 3m/s 이하 95°/s → 12m/s 55°/s(빠를수록 차분).
//  - 손을 떼면 썰매 방향이 길 방향으로 초당 50%씩 돌아옴. 굽이에서는 바깥으로 밀려 안쪽으로 꺾어야 함.
//  - 드리프트(누르는 동안): 꺾임 1.5배·바깥 밀림 절반·속도 −6%/초, 썰매 몸이 진행 방향보다 최대 28° 더 돌아감(미끄러지는 모습).
//    0.7초 넘게 하고 놓으면 +1.5m/s 1초(1.4초면 +2).
//  - 속도: 기본 최고 10m/s, 부스터 판 3초 +2m/s, 스타트 부스트 1초 +2, 모두 합쳐 최고 12m/s(서버 썰매 한도 14m/s 안).
//  - 부딪힘은 멈추지 않고 부드럽게 튕김: 눈둑 = 부딪힌 각도만큼 −3~10%·안쪽으로 튕겨 나옴, 눈 더미 −22%·옆으로 밀림, 전나무 −38%·옆으로 크게 밀림.
//    부딪힌 뒤에도 3.5m/s 아래로는 줄이지 않음(그 전 속도가 더 낮았으면 그대로).
//  - 얼음 길: 마찰 30%·꺾임 75%·길 방향 맞춤 느림·바깥 밀림 1.5배. 좁은 길: 눈둑이 안쪽으로(폭 3m).
//  - 점프: 공중 조종 30%, 착지 때 길과 25° 안이면 +1m/s, 넘으면 −20%.
//  - 구간 기록점 3개(마지막 = 결승). 결승 뒤 감속 15m → 멈춤 구역.
import {makeCourse,dailySeed,COURSE_W} from './sled-course.js';

const D2R=Math.PI/180;
export const SLED_RULES=Object.freeze({maxSpeed:10,boostMax:12,g:9.8,friction:.016,drag:.0045,startSpeed:2.6,pushLen:4,
 rise:.18,fall:.12,turnSlow:95*D2R,turnFast:55*D2R,slowV:3,fastV:12,align:.5,maxYaw:70*D2R,outward:.03,carry:.5,
 driftMul:1.5,driftOut:.5,driftSlow:.06,drift1:.7,drift2:1.4,driftBoost1:1.5,driftBoost2:2,driftBoostSecs:1,slipMax:28*D2R,
 boost:2,boostSecs:3,startBoost:2,startBoostSecs:1,startWindow:.3,earlyDelay:.5,
 pile:.78,fir:.62,pilePush:2.2,firPush:2.8,minAfterHit:3.5,bankLossMin:.03,bankLossMax:.1,bankBounce:1.4,scrape:3.2,
 iceFriction:.3,iceTurn:.75,iceAlign:.12,iceOut:1.5,
 airSteer:.3,landOk:25*D2R,landGood:1,landBad:.8,brake:5,
 edgeIn:.32,laneGap:1.0,lanes:4,stopLen:2.6,inviteMs:5000,countdown:3,back:.54});
// 조작감 2(월드개발 11-17 5차, 대표 지적 「가속감이 없다·핸들링이 나쁘다」). 11-17 대표 결정으로 모든 화면의 기본(주소 옵션 없음). 1은 시험·비교 계산용으로만 남김.
//  - 가속: 출발 밀기 속도를 낮추고(4.6→3.0m/s) 내리막 가속을 0.55배로 → 8m/s까지 약 5초, 최고 11.5(부스터 12.5, 서버 썰매 한도 14 안). 별·마찰은 코스마다 자동으로 다시 맞춤
//  - 조향: 기울이기 0.18→0.1초(바로 반응), 손 떼면 길 방향으로 빨리 돌아옴(초당 50%→80%), 굽이에서 바깥으로 끌리는 힘·자동으로 벌어지는 각 줄임,
//    빠를 때 꺾임 55→48°/s(안정), 느릴 때 95→105°/s. 드리프트는 가볍게(꺾임 1.5→1.3배, 미끄러지는 몸 28→16°)
export const SLED_RULES_2=Object.freeze({...SLED_RULES,startSpeed:1.6,startBoost:1.4,maxSpeed:11.5,boostMax:12.5,accelMul:.8,drag:.0025,par:55,
 rise:.1,fall:.09,turnSlow:105*D2R,turnFast:48*D2R,align:.8,carry:.3,outward:.02,driftMul:1.3,slipMax:16*D2R,airSteer:.35});
// 조작감 3(11-18, 월드디자인 설계 v2 §1 「직접 조작」): 손을 떼면 길 방향으로 돌아오던 보정(align)과 굽이를 저절로 따라 돌던 보정(carry)을 없앤다.
//  - 썰매는 꺾지 않으면 지금 방향 그대로 감(굽이에서 손을 떼면 바깥 눈둑으로). 얼음 길 맞춤(iceAlign)도 0
//  - 대신 꺾임을 조금 빠르게: 느릴 때 110°/s · 빠를 때 60°/s, 핸들은 누르면 0.14초에 최대·떼면 0.10초에 가운데
//  - 남는 것(물리): 굽이 바깥 밀림·눈둑 튕김·드리프트·부스터·점프. 길 폭은 sled-course.js(6m·좁은 곳 4.5m)와 함께 맞춘 값
export const SLED_RULES_3=Object.freeze({...SLED_RULES_2,rise:.14,fall:.1,turnSlow:110*D2R,turnFast:60*D2R,align:0,carry:1,iceAlign:0,laneGap:1.4,par:60});
let FEEL=3;
const RS=()=>FEEL===3?SLED_RULES_3:FEEL===2?SLED_RULES_2:SLED_RULES;
export const sledFeel=()=>FEEL;
export function setSledFeel(n){FEEL=n===3?3:n===2?2:1;}
// 화면에서 고르는 길은 없음. 기록판에 내는 기록에는 SLED_FEEL_VERSION을 붙이고 서버는 지금 조작감만 받는다(sled-race.js BOARD_FEEL).
// 11-18: 3(직접 조작). 예전 2 기록은 서버 기록판에 섞이지 않고, 이 기기의 개인 최고 기록(xmas-sled:v2)은 지우지 않는다.
export const SLED_FEEL_VERSION=3;
export const sledFeelFrom=()=>SLED_FEEL_VERSION;
export const SLED_SENS=Object.freeze({soft:.7,normal:1,fast:1.3});
export const DEFAULT_SEED=dailySeed();
export const defaultCourse=()=>makeCourse(DEFAULT_SEED);
// 옛 이름(시험·화면): 길이 s의 가운데 점과 진행 방향 단위 벡터
export function runAt(s,course=defaultCourse()){const c=course.at(s);return {x:c.x,z:c.z,dx:Math.cos(c.th),dz:Math.sin(c.th)};}
// 출발대 줄(1~4) → 처음 옆 위치(줄마다 1m씩, 진행 방향 오른쪽 +)
export const laneOffset=lane=>((lane??2)-(RS().lanes+1)/2)*RS().laneGap;
// 방향 θ(위에서 볼 때, 동 0·남 π/2) → 게임 heading(0 = -Z를 봄)
export const headingOf=th=>Math.atan2(-Math.cos(th),-Math.sin(th));
// 속도에 따른 최대 꺾임 각속도(rad/s)
export const turnRateAt=v=>{const R=RS(),t=Math.max(0,Math.min(1,(v-R.slowV)/(R.fastV-R.slowV))),u=t*t*(3-2*t);return R.turnSlow+(R.turnFast-R.turnSlow)*u;};
export const SLED_HALF=.24; // 썰매 반폭(장애물 닿음)
// 코스마다 마찰 맞춤: 블록 조합·길이에 따라 시간이 크게 달라지지 않게, 보통 실력 자동 조종이 약 66초가 되도록 마찰 배수를 정한다(0.4~2.2배, 한 번 재면 기억)
export const PAR_NORMAL=66;
const gripCache=new Map();
export function courseGrip(course){
 const key=`${course.seed}:${FEEL}`; // 조작감마다 따로
 if(gripCache.has(key))return gripCache.get(key);
 gripCache.set(key,1); // 재는 동안(아래 simulateRide가 다시 부름) 1배
 let lo=.4,hi=2.2,g=1;
 for(let i=0;i<7;i++){g=(lo+hi)/2;const t=simulateRide(course,{style:'normal',grip:g}).t??999;if(t>(RS().par??PAR_NORMAL))hi=g;else lo=g;}
 g=+((lo+hi)/2).toFixed(3);gripCache.set(key,g);return g;
}
const edgeOf=(course,s)=>course.widthAt(s)/2-RS().edgeIn;

// 한 번 타기. step(dt, {steer -1~1, drift, brake, push}) → 이벤트 [{type,…}]
//  type: 'bank'(hard) · 'pile' · 'tree' · 'boost' · 'air' · 'land'(good) · 'drift'(lv 1·2 준비) · 'mini'(드리프트 부스트) · 'start'(스타트 부스트) · 'ice' · 'tunnel' · 'cp'(i, t) · 'finish'(t) · 'end'
export function createRide({course=defaultCourse(),lane=2,start=-1.5,sens=1,delay=0,v0=0,grip=null}={}){
 const fr=RS().friction*(grip??courseGrip(course));
 const C=course,FIN=C.finish,END=C.end,CPS=C.checkpoints;
 const R={s:start,off:laneOffset(lane),v:v0,psi:0,st:0,t:-delay,air:0,airT:0,airLift:0,jump:null,done:false,finished:false,lastBank:-9,lat:0,slip:0,
  boostT:0,startT:0,miniT:0,miniV:0,driftT:0,driftLv:0,cp:0,splits:[],hit:new Map(),pads:new Set(),jumped:new Set(),pushed:false,landGood:0,banks:0,hits:0,surf:'snow'};
 const pose=()=>{const c=C.xz(R.s,R.off),th=c.th+R.psi+R.slip;
  const base=C.profileH(R.s)+(R.airT>0?0:C.rampH(R.s));
  return {x:c.x,z:c.z,y:base+R.airLift,heading:headingOf(th),speed:R.v,s:R.s,off:R.off,air:R.airT>0,lift:R.airLift+(R.airT>0?0:C.rampH(R.s)),psi:R.psi,slip:R.slip,travel:headingOf(c.th+R.psi),k:c.k};};
 const cap=()=>Math.min(RS().boostMax,RS().maxSpeed+(R.boostT>0?RS().boost:0)+(R.startT>0?RS().startBoost:0)+(R.miniT>0?R.miniV:0));
 const soften=(v,before)=>Math.max(v,Math.min(before,RS().minAfterHit)); // 부딪혀도 멈추지 않게
 return {
  course:C,
  get s(){return R.s;},get v(){return R.v;},get off(){return R.off;},get psi(){return R.psi;},get slip(){return R.slip;},get done(){return R.done;},get finished(){return R.finished;},
  get t(){return R.t;},get splits(){return R.splits.slice();},get driftT(){return R.driftT;},get driftLv(){return R.driftLv;},get boosting(){return R.boostT>0||R.startT>0||R.miniT>0;},
  get air(){return R.airT>0;},get steerNow(){return R.st;},get banks(){return R.banks;},get hits(){return R.hits;},get surface(){return R.surf;},
  pose,
  step(dt,{steer=0,drift=false,brake=false,push=false}={}){
   const ev=[];if(R.done)return ev;
   if(R.t<0){R.t+=dt;return ev;}
   R.t+=dt;
   if(push&&!R.pushed){R.pushed=true;if(R.t<=RS().startWindow){R.startT=RS().startBoostSecs;R.v=Math.max(R.v,RS().startSpeed+RS().startBoost);ev.push({type:'start'});}}
   const here=C.at(R.s),surf=here.ice?'ice':here.tun?'tunnel':'snow';
   if(surf!==R.surf){if(surf!=='snow')ev.push({type:surf});R.surf=surf;}
   const ice=surf==='ice';
   // ── 기울이기: 목표로 서서히
   const tgt=Math.max(-1,Math.min(1,steer));
   const rate=(Math.abs(tgt)>Math.abs(R.st)&&Math.sign(tgt)===Math.sign(R.st||tgt))?1/RS().rise:1/RS().fall;
   const d=tgt-R.st;R.st+=Math.sign(d)*Math.min(Math.abs(d),rate*dt);
   const air=R.airT>0,drifting=drift&&!air&&Math.abs(R.st)>.3&&R.v>3;
   const yawRate=R.st*turnRateAt(R.v)*sens*(drifting?RS().driftMul:1)*(air?RS().airSteer:1)*(ice?RS().iceTurn:1);
   R.psi+=yawRate*dt;
   // 썰매는 제 방향으로 계속 가려 한다: 길이 굽으면 길에 대한 각이 그만큼 벌어짐(길이 45%만큼만, 나머지는 자동으로 따라 돎). 굽이에서 꺾지 않으면 바깥 눈둑으로
   if(!air)R.psi-=here.k*R.v*Math.cos(R.psi)*RS().carry*dt;
   {const al=ice?RS().iceAlign:RS().align;if(al>0&&Math.abs(tgt)<.05&&!air)R.psi*=Math.pow(1-al,dt);} // 조작감 3은 0(손 떼도 돌아오지 않음)
   R.psi=Math.max(-RS().maxYaw,Math.min(RS().maxYaw,R.psi));
   // 드리프트 모습: 몸이 진행 방향보다 더 돌아감(놓으면 0.25초에 돌아옴)
   {const want=drifting?Math.sign(R.st)*RS().slipMax*Math.min(1,Math.abs(R.st)):0;R.slip+=(want-R.slip)*(1-Math.exp(-dt*(drifting?6:9)));}
   // ── 드리프트 부스트 준비
   if(drifting){R.driftT+=dt;R.v*=1-RS().driftSlow*dt;const lv=R.driftT>=RS().drift2?2:R.driftT>=RS().drift1?1:0;if(lv>R.driftLv){R.driftLv=lv;ev.push({type:'drift',lv});}}
   else if(R.driftT>0){if(R.driftLv>0){R.miniV=R.driftLv>=2?RS().driftBoost2:RS().driftBoost1;R.miniT=RS().driftBoostSecs;R.v+=R.miniV*.6;ev.push({type:'mini',lv:R.driftLv});}R.driftT=0;R.driftLv=0;}
   // ── 속도: 비탈 − 마찰 − 공기, 브레이크, 결승 뒤 감속
   const slope=(C.profileH(R.s)-C.profileH(R.s+.6))/.6;
   let a=air?0:RS().g*slope-RS().g*fr*(ice?RS().iceFriction:1)-RS().drag*R.v*R.v;
   if(a>0&&RS().accelMul)a*=RS().accelMul; // 조작감 2: 내리막 가속을 천천히(점점 빨라지는 느낌)
   if(brake&&!air)a-=RS().brake;
   const stopZone=R.s>FIN+.5;
   if(stopZone)a=Math.min(a,-Math.max(.8,R.v*R.v/(2*Math.max(.6,END-1-R.s))));
   R.v=Math.max(stopZone?0:.6,R.v+a*dt);
   if(R.s<0)R.v=Math.max(R.v,RS().startSpeed);
   const c=cap();if(R.v>c)R.v=Math.max(c,R.v-4*dt);
   for(const k of ['boostT','startT','miniT'])if(R[k]>0)R[k]=Math.max(0,R[k]-dt);
   // ── 앞으로·옆으로: 굽이에서는 바깥으로 밀림(곡률 k, 오른쪽 굽이 +), 튕김은 lat(옆 속도)로 부드럽게
   const s0=R.s;
   R.s+=R.v*Math.cos(R.psi)*dt;
   const out=air?0:here.k*R.v*R.v*RS().outward*(drifting?RS().driftOut:1)*(ice?RS().iceOut:1);
   R.off+=(R.v*Math.sin(R.psi)-out+R.lat)*dt;
   R.lat*=Math.exp(-dt*5);
   // 눈둑: 멈추지 않고 안쪽으로 튕김(부딪힌 각도만큼 감속)
   const edge=edgeOf(C,R.s);
   if(Math.abs(R.off)>edge){const sg=Math.sign(R.off);R.off=sg*edge;
    const into=Math.max(0,sg*Math.sin(R.psi)),hard=into>.12;
    if(sg*R.psi>0)R.psi=-R.psi*.35;
    R.lat=-sg*Math.max(Math.abs(R.lat)*.3,RS().bankBounce*(.4+into));
    if(!air&&!stopZone)R.v=Math.max(Math.min(R.v,RS().minAfterHit),R.v-RS().scrape*dt); // 눈둑에 붙어 미끄러지면 계속 조금씩 느려짐
    if(!air&&R.t-R.lastBank>.4){const loss=RS().bankLossMin+(RS().bankLossMax-RS().bankLossMin)*Math.min(1,into*2);const before=R.v;R.v=soften(R.v*(1-loss),before);R.lastBank=R.t;R.banks++;ev.push({type:'bank',hard});}}
   if(!air){
    // 장애물: 옆으로 밀려나며 감속(멈추지 않음)
    for(const o of C.obstacles){if(Math.abs(R.s-o.s)>o.r+.4||Math.abs(R.off-o.off)>o.r+SLED_HALF)continue;if(R.t-(R.hit.get(o.s)??-9)<1)continue;R.hit.set(o.s,R.t);R.hits++;
     const sg=Math.sign(R.off-o.off)||(o.off>0?-1:1),before=R.v;
     if(o.kind==='pile'){R.v=soften(R.v*RS().pile,before);R.lat=sg*RS().pilePush;ev.push({type:'pile'});}
     else{R.v=soften(R.v*RS().fir,before);R.lat=sg*RS().firPush;R.psi*=.4;ev.push({type:'tree'});}}
    for(const b of C.boosters)if(R.s>=b.s&&R.s<=b.s+b.len&&Math.abs(R.off-b.off)<=b.w/2+.25){R.boostT=RS().boostSecs;if(!R.pads.has(b.s)){R.pads.add(b.s);ev.push({type:'boost'});}}
    for(const j of C.jumps)if(!R.jumped.has(j.s)&&s0<j.s&&R.s>=j.s){R.jumped.add(j.s);R.jump=j;R.airT=R.air=j.air*Math.max(.55,Math.min(1.3,R.v/8));R.airLift=j.h;ev.push({type:'air',big:j.h>1});}
   }
   if(R.airT>0){R.airT=Math.max(0,R.airT-dt);const u=1-R.airT/R.air,j=R.jump,peak=j.h*.55+.25;R.airLift=j.h*(1-u)+4*peak*u*(1-u);
    if(R.airT<=0){R.airLift=0;const ok=Math.abs(R.psi)<=RS().landOk;if(ok){R.v=Math.min(RS().boostMax,R.v+RS().landGood);R.landGood++;}else R.v*=RS().landBad;ev.push({type:'land',good:ok});}}
   while(R.cp<CPS.length&&R.s>=CPS[R.cp]){const t=+(R.t-(R.s-CPS[R.cp])/Math.max(.5,R.v)).toFixed(3);R.splits.push(t);ev.push({type:'cp',i:R.cp,t});
    if(R.cp===CPS.length-1){R.finished=true;ev.push({type:'finish',t});}R.cp++;}
   if(stopZone&&(R.v<.25||R.s>END+RS().stopLen)){R.done=true;ev.push({type:'end'});}
   return ev;
  },
 };
}
// ── 썰매 카메라 방향·자리(11-18 설계 v2 §2 「앞 고정, 좌우 흔들림 없음」, three 없음 — 화면 sled-play.js와 시험이 같이 쓴다)
//  - 방향: 썰매 각도(psi)·드리프트 몸 돌림은 넣지 않고 길 방향만(지금 자리 45% + 앞쪽(속도×0.9m, 최소 5m) 55%)
//  - 옆 자리: 썰매 옆 위치(off)를 0.5초에 걸쳐 천천히 따라감(작은 좌우 꿈틀은 화면에서 썰매만 움직여 보임), 빠르기 1.1m/s까지(프레임마다 2cm 안)
//  - 굽이 안쪽 미리보기(ahead)는 길 굽음으로만 정함
export const SLED_CAM=Object.freeze({here:.45,aheadMin:5,aheadV:.9,latSecs:.5,latMax:1.1,latFar:1.8,lead:1.2,inside:.6,shake:.04,shakeSecs:.15,dip:.08,dipSecs:.2});
export const SLED_CAM_OLD_PSI=.6; // 조작감 2까지 카메라 방향에 섞던 썰매 각도 몫(비교 기록용)
export function createSledCam(){
 let off=null;
 return {
  reset(){off=null;},
  // ride → {yaw(게임 heading), th(길 방향), x,z(카메라가 보는 썰매 자리), ahead{x,z}(앞·굽이 안쪽 미리보기)}
  update(ride,dt=1/60,{oldPsi=0}={}){
   const C=ride.course,v=ride.v,here=C.at(ride.s),ah=C.at(ride.s+Math.max(SLED_CAM.aheadMin,v*SLED_CAM.aheadV));
   const th=here.th*SLED_CAM.here+ah.th*(1-SLED_CAM.here)+ride.psi*oldPsi;
   // 0.5초에 걸쳐 따라가되 한 번에 옮기는 빠르기는 latMax(m/s)까지(프레임마다 2cm 안). 썰매가 1.8m 넘게 벗어나면(큰 튕김·헤어핀) 제한 없이 따라감
   if(off==null)off=ride.off;else{const gap=ride.off-off;let d=gap*(1-Math.exp(-dt/SLED_CAM.latSecs));if(Math.abs(gap)<SLED_CAM.latFar)d=Math.max(-SLED_CAM.latMax*dt,Math.min(SLED_CAM.latMax*dt,d));off+=d;}
   const q=C.xz(ride.s,off),yaw=headingOf(th),fx=-Math.sin(yaw),fz=-Math.cos(yaw),lat=Math.max(-1,Math.min(1,ah.k*4))*SLED_CAM.inside;
   return {yaw,th,x:q.x,z:q.z,off,ahead:{x:fx*SLED_CAM.lead+(-fz)*lat,z:fz*SLED_CAM.lead+fx*lat}};
  },
 };
}
// 고스트(내 최고 기록 주행): 0.1초마다 [x,z,y,heading,s] 기록 → 이 기기 저장(코스마다 따로). at(t)로 그 시각 자리
export const GHOST_DT=.1;
export function createGhostRecorder(){const pts=[];let acc=0;return {
 add(dt,p){acc+=dt;while(acc>=GHOST_DT||!pts.length){acc=pts.length?acc-GHOST_DT:0;pts.push([+p.x.toFixed(2),+p.z.toFixed(2),+p.y.toFixed(2),+p.heading.toFixed(3),+p.s.toFixed(1)]);if(!acc)break;}},
 get points(){return pts;}};}
export function ghostAt(pts,t){if(!pts?.length)return null;const f=Math.max(0,t/GHOST_DT),i=Math.min(pts.length-1,Math.floor(f)),j=Math.min(pts.length-1,i+1),u=Math.min(1,f-i),a=pts[i],b=pts[j];
 let dh=b[3]-a[3];dh=Math.atan2(Math.sin(dh),Math.cos(dh));return {x:a[0]+(b[0]-a[0])*u,z:a[1]+(b[1]-a[1])*u,y:a[2]+(b[2]-a[2])*u,heading:a[3]+dh*u,s:a[4]+(b[4]-a[4])*u,done:f>=pts.length-1};}

// ── 자동 조종(시험·시연). style: 'good'(드리프트·부스터 노림) · 'normal'(키보드처럼 누름/뗌, 0.2초 늦게 반응, 가운데 선) · 'none'(손 안 댐)
// 가고 싶은 옆 자리: 앞 장애물은 넓은 틈 가운데로, 부스터 판은 그 위로(노릴 때), 굽이는 조금 안쪽
export function lineWant(C,s,{look=6.5,boosters=true,inside=1.8}={}){
 let want=0,obs=false;
 for(const o of C.obstacles)if(o.s>s+.5&&o.s<s+look){const W=C.widthAt(o.s)/2,L=(o.off-o.r)+W,Rr=W-(o.off+o.r);want=L>Rr?(-W+L/2):(W-Rr/2);obs=true;break;}
 if(!obs&&boosters)for(const b of C.boosters)if(b.s+b.len>s&&b.s<s+6){want=b.off;break;}
 want+=C.at(s+5).k*inside;
 const lim=C.widthAt(s)/2-.7;return Math.max(-lim,Math.min(lim,want));
}
// bias = 가고 싶은 옆 자리에 더할 값(점검: 4대가 각자 줄을 지키며 달리기). 눈둑 안으로 자름
// want = 가고 싶은 옆 자리를 직접 줌(점검용 줄 지키기)
export function botSteer(ride,{skill=1,bias=0,want:w=null}={}){
 const lim=ride.course.widthAt(ride.s)/2-.7,want=w??Math.max(-lim,Math.min(lim,lineWant(ride.course,ride.s,{inside:2.5})+bias));
 const err=want-ride.off;const desired=Math.max(-.6,Math.min(.6,err*.5))*skill;
 return Math.max(-1,Math.min(1,(desired-ride.psi)*3));
}
// 잘 타는 사람: 굽이에서 안쪽으로 드리프트, 부스터 노림, 출발 때 밀기
export function goodInput(ride){return {steer:botSteer(ride),drift:Math.abs(ride.course.at(ride.s+2).k)>.15,push:ride.t>.05&&ride.t<.2};}
// 보통 실력 사람 흉내: 키보드식(−1·0·1), 반응 늦음, 가끔 늦게 뗌, 드리프트·부스터 노림 없음
export function createHumanBot({react=.22,seed=7,style='normal'}={}){
 let q=[],t=0,held=0,a=seed>>>0;const rnd=()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};
 return (ride,dt=1/60)=>{
  t+=dt;const C=ride.course,s=ride.s;
  if(style==='none')return {steer:0};
  const want=lineWant(C,s,{boosters:false});
  // 가고 싶은 방향(길과 이루는 각)을 정하고, 지금 방향과 많이 다르면 그쪽 키를 누름(키보드식 누름/뗌)
  const e=want-ride.off,desired=Math.max(-.32,Math.min(.32,e*.38)),dpsi=desired-ride.psi;
  let key=Math.abs(dpsi)<.1?0:Math.sign(dpsi);
  if(style==='good')return goodInput(ride);
  // 늦게 반응: react초 전에 정한 키를 지금 누름 + 가끔 0.15초 더 누르고 있음
  q.push({t:t+react,key});let out=held;while(q.length&&q[0].t<=t){out=q.shift().key;}
  if(out===0&&held!==0&&rnd()<.04)out=held;held=out;
  return {steer:out};
 };
}
// 한 번 끝까지 자동으로 타 보기(시험·별 기준): {t 결승, banks, hits, done}
export function simulateRide(course,{style='normal',seed=7,lane=2,dt=1/60,max=200,grip=null}={}){
 const r=createRide({course,lane,grip}),bot=style==='good'?null:createHumanBot({seed,style});let t=0,fin=null;
 while(!r.done&&t<max){const inp=style==='good'?goodInput(r):bot(r,dt);
  for(const e of r.step(dt,inp))if(e.type==='finish')fin=e.t;t+=dt;}
 return {t:fin,banks:r.banks,hits:r.hits,done:r.done};
}
// 별: 완주 ★ · ★★ = 보통 실력 + 8초 안 · ★★★ = 잘 타는 실력 + 2초 안(코스마다 자동으로 잰 기준, 한 번 재면 기억)
const parCache=new Map();
export function starTimes(course=defaultCourse()){
 const key=`${course.seed}:${FEEL}`;if(parCache.has(key))return parCache.get(key);
 const good=simulateRide(course,{style:'good'}).t??70,norm=simulateRide(course,{style:'normal'}).t??80;
 const st=Object.freeze({three:+(good+2).toFixed(1),two:+(Math.max(norm,good+4)+8).toFixed(1)});parCache.set(key,st);return st;
}
export const STARS=Object.freeze({three:60,two:80}); // 옛 이름(기본값), 실제는 starTimes(course)
export const starsOf=(t,course)=>{if(!Number.isFinite(t))return 0;const s=course?starTimes(course):STARS;return t<=s.three?3:t<=s.two?2:1;};
export {COURSE_W};
