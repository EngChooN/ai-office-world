// 눈썰매 타기 계산(월드개발, 2026-11-16 · 11-17 긴 코스·조작 개편). three 없음(시험에서 바로 부른다). 코스 자료는 sled-course.js.
// 눈썰매-눈싸움-개선-v1 §1-1·§1-2 추천안:
//  - 기울이기: 키는 0→최대 0.25초에 걸쳐 차오르고 떼면 0.15초에 0(즉시 꺾임 없음). 최대 꺾임 75°/s, 8m/s 넘으면 60°/s. 감도 0.7·1·1.3배.
//  - 손을 떼면 썰매 방향이 길 방향으로 초당 40%씩 돌아옴. 굽이에서는 바깥으로 밀려 안쪽으로 꺾어야 함.
//  - 드리프트(누르는 동안): 꺾임 1.6배·속도 −8%/초, 0.8초 넘게 하고 놓으면 +1.5m/s 1초(1.6초면 +2).
//  - 속도: 기본 최고 10m/s, 부스터 판 3초 +2m/s, 스타트 부스트 1초 +2, 모두 합쳐 최고 12m/s(서버 썰매 한도 14m/s 안).
//  - 눈 더미 −40%·전나무 −70%·옆으로 0.8m·눈둑 −15%(멈추거나 뒤집히지 않음). 점프: 공중 조종 30%, 착지 때 길과 25° 안이면 +1m/s, 넘으면 −20%.
//  - 구간 기록점 3개(마지막 = 결승). 결승 뒤 감속 15m → 멈춤 구역.
import {COURSE_W,COURSE_END,FINISH_S,CHECKPOINTS,JUMPS,BOOSTERS,OBSTACLES,profileH,rampH,courseXZ,courseAt} from './sled-course.js';

const D2R=Math.PI/180;
export const SLED_RULES=Object.freeze({maxSpeed:10,boostMax:12,g:9.8,friction:.016,drag:.0045,startSpeed:2.6,pushLen:4,
 rise:.25,fall:.15,turn:75*D2R,turnFast:60*D2R,fastV:8,align:.4,maxYaw:70*D2R,outward:.07,
 driftMul:1.6,driftSlow:.08,drift1:.8,drift2:1.6,driftBoost1:1.5,driftBoost2:2,driftBoostSecs:1,
 boost:2,boostSecs:3,startBoost:2,startBoostSecs:1,startWindow:.3,earlyDelay:.5,
 pile:.6,fir:.3,firPush:.8,bank:.85,airSteer:.3,landOk:25*D2R,landGood:1,landBad:.8,brake:5,
 edge:COURSE_W/2-.32,laneGap:1.0,lanes:4,stopLen:2.6,inviteMs:5000,countdown:3,back:.54});
export const SLED_SENS=Object.freeze({soft:.7,normal:1,fast:1.3});
export const RUN_LENGTH=COURSE_END;
export {FINISH_S,CHECKPOINTS};
// 옛 이름(시험·화면): 길이 s의 가운데 점과 진행 방향 단위 벡터
export function runAt(s){const c=courseAt(s);return {x:c.x,z:c.z,dx:Math.cos(c.th),dz:Math.sin(c.th)};}
// 출발대 줄(1~4) → 처음 옆 위치(줄마다 1m씩, 진행 방향 오른쪽 +)
export const laneOffset=lane=>((lane??2)-(SLED_RULES.lanes+1)/2)*SLED_RULES.laneGap;
// 방향 θ(위에서 볼 때, 동 0·남 π/2) → 게임 heading(0 = -Z를 봄)
export const headingOf=th=>Math.atan2(-Math.cos(th),-Math.sin(th));

// 한 번 타기. step(dt, {steer -1~1, drift, brake, push}) → 이벤트 [{type,…}]
//  type: 'bank' · 'pile' · 'tree' · 'boost' · 'air' · 'land'(good) · 'drift'(lv 1·2 준비) · 'mini'(드리프트 부스트) · 'start'(스타트 부스트) · 'cp'(i, t) · 'finish'(t) · 'end'
export function createRide({lane=2,start=-1.5,sens=1,delay=0,v0=0}={}){
 const R={s:start,off:laneOffset(lane),v:v0,psi:0,st:0,t:-delay,air:0,airT:0,airLift:0,jump:null,done:false,finished:false,lastBank:-9,
  boostT:0,startT:0,miniT:0,miniV:0,driftT:0,driftLv:0,cp:0,splits:[],hit:new Map(),pads:new Set(),jumped:new Set(),pushed:false,landGood:0};
 const pose=()=>{const c=courseXZ(R.s,R.off),th=c.th+R.psi;
  const base=profileH(R.s)+(R.airT>0?0:rampH(R.s));
  return {x:c.x,z:c.z,y:base+R.airLift,heading:headingOf(th),speed:R.v,s:R.s,off:R.off,air:R.airT>0,lift:R.airLift+(R.airT>0?0:rampH(R.s)),psi:R.psi};};
 const cap=()=>Math.min(SLED_RULES.boostMax,SLED_RULES.maxSpeed+(R.boostT>0?SLED_RULES.boost:0)+(R.startT>0?SLED_RULES.startBoost:0)+(R.miniT>0?R.miniV:0));
 return {
  get s(){return R.s;},get v(){return R.v;},get off(){return R.off;},get psi(){return R.psi;},get done(){return R.done;},get finished(){return R.finished;},
  get t(){return R.t;},get splits(){return R.splits.slice();},get driftT(){return R.driftT;},get driftLv(){return R.driftLv;},get boosting(){return R.boostT>0||R.startT>0||R.miniT>0;},
  get air(){return R.airT>0;},get steerNow(){return R.st;},
  pose,
  step(dt,{steer=0,drift=false,brake=false,push=false}={}){
   const ev=[];if(R.done)return ev;
   // 출발 지연(너무 일찍 밀었을 때 0.5초)
   if(R.t<0){R.t+=dt;return ev;}
   R.t+=dt;
   // 스타트 부스트: 출발 0.3초 안에 앞으로 밀기
   if(push&&!R.pushed){R.pushed=true;if(R.t<=SLED_RULES.startWindow){R.startT=SLED_RULES.startBoostSecs;R.v=Math.max(R.v,SLED_RULES.startSpeed+SLED_RULES.startBoost);ev.push({type:'start'});}}
   // ── 기울이기: 목표로 서서히(오를 때 0.25초, 돌아올 때 0.15초)
   const tgt=Math.max(-1,Math.min(1,steer));
   const rate=(Math.abs(tgt)>Math.abs(R.st)&&Math.sign(tgt)===Math.sign(R.st||tgt))?1/SLED_RULES.rise:1/SLED_RULES.fall;
   const d=tgt-R.st;R.st+=Math.sign(d)*Math.min(Math.abs(d),rate*dt);
   const air=R.airT>0,drifting=drift&&!air&&Math.abs(R.st)>.3&&R.v>3;
   let yawRate=R.st*(R.v>SLED_RULES.fastV?SLED_RULES.turnFast:SLED_RULES.turn)*sens*(drifting?SLED_RULES.driftMul:1)*(air?SLED_RULES.airSteer:1);
   R.psi+=yawRate*dt;
   if(Math.abs(tgt)<.05&&!air)R.psi*=Math.pow(1-SLED_RULES.align,dt); // 길 방향으로 초당 40%
   R.psi=Math.max(-SLED_RULES.maxYaw,Math.min(SLED_RULES.maxYaw,R.psi));
   // ── 드리프트: 오래 할수록 부스트 준비, 놓으면 미니 부스트
   if(drifting){R.driftT+=dt;R.v*=1-SLED_RULES.driftSlow*dt;const lv=R.driftT>=SLED_RULES.drift2?2:R.driftT>=SLED_RULES.drift1?1:0;if(lv>R.driftLv){R.driftLv=lv;ev.push({type:'drift',lv});}}
   else if(R.driftT>0){if(R.driftLv>0){R.miniV=R.driftLv>=2?SLED_RULES.driftBoost2:SLED_RULES.driftBoost1;R.miniT=SLED_RULES.driftBoostSecs;R.v+=R.miniV*.6;ev.push({type:'mini',lv:R.driftLv});}R.driftT=0;R.driftLv=0;}
   // ── 속도: 비탈 − 마찰 − 공기, 브레이크, 결승 뒤 감속
   const here=courseAt(R.s);
   const slope=(profileH(R.s)-profileH(R.s+.6))/.6;
   let a=air?0:SLED_RULES.g*slope-SLED_RULES.g*SLED_RULES.friction-SLED_RULES.drag*R.v*R.v;
   if(brake&&!air)a-=SLED_RULES.brake;
   // 결승 뒤 감속 구역: 멈춤 구역 끝 1m 앞에서 서도록 남은 거리에 맞춰 줄임
   const stopZone=R.s>FINISH_S+.5;
   if(stopZone)a=Math.min(a,-Math.max(.8,R.v*R.v/(2*Math.max(.6,COURSE_END-1-R.s))));
   R.v=Math.max(stopZone?0:.6,R.v+a*dt);
   if(R.s<0)R.v=Math.max(R.v,SLED_RULES.startSpeed);
   const c=cap();if(R.v>c)R.v=Math.max(c,R.v-4*dt);
   for(const k of ['boostT','startT','miniT'])if(R[k]>0)R[k]=Math.max(0,R[k]-dt);
   // ── 앞으로·옆으로: 굽이에서는 바깥으로 밀림(곡률 k, 오른쪽 굽이 +)
   const s0=R.s;
   R.s+=R.v*Math.cos(R.psi)*dt;
   R.off+=(R.v*Math.sin(R.psi)-(air?0:here.k*R.v*R.v*SLED_RULES.outward))*dt;
   // 눈둑
   if(Math.abs(R.off)>SLED_RULES.edge){const sg=Math.sign(R.off);R.off=sg*SLED_RULES.edge;
    if(Math.sign(R.psi)===sg)R.psi*=.25;
    if(R.t-R.lastBank>.5&&!air){R.lastBank=R.t;R.v*=SLED_RULES.bank;ev.push({type:'bank'});}}
   if(!air){
    // 장애물
    for(const o of OBSTACLES){if(Math.abs(R.s-o.s)>o.r+.45||Math.abs(R.off-o.off)>o.r+.3)continue;if(R.t-(R.hit.get(o.s)??-9)<1)continue;R.hit.set(o.s,R.t);
     if(o.kind==='pile'){R.v*=SLED_RULES.pile;ev.push({type:'pile'});}
     else{R.v*=SLED_RULES.fir;const sg=Math.sign(R.off-o.off)||1;R.off=Math.max(-SLED_RULES.edge,Math.min(SLED_RULES.edge,R.off+sg*SLED_RULES.firPush));R.psi*=.3;ev.push({type:'tree'});}}
    // 부스터 판
    for(const b of BOOSTERS)if(R.s>=b.s&&R.s<=b.s+b.len&&Math.abs(R.off-b.off)<=b.w/2+.25){R.boostT=SLED_RULES.boostSecs;if(!R.pads.has(b.s)){R.pads.add(b.s);ev.push({type:'boost'});}}
    // 점프대 끝을 지나면 뜬다
    for(const j of JUMPS)if(!R.jumped.has(j.s)&&s0<j.s&&R.s>=j.s){R.jumped.add(j.s);R.jump=j;R.airT=R.air=j.air*Math.max(.55,Math.min(1.3,R.v/8));R.airLift=j.h;ev.push({type:'air',big:j.h>1});}
   }
   // 공중
   if(R.airT>0){R.airT=Math.max(0,R.airT-dt);const u=1-R.airT/R.air,j=R.jump,peak=j.h*.55+.25;R.airLift=j.h*(1-u)+4*peak*u*(1-u);
    if(R.airT<=0){R.airLift=0;const ok=Math.abs(R.psi)<=SLED_RULES.landOk;if(ok){R.v=Math.min(SLED_RULES.boostMax,R.v+SLED_RULES.landGood);R.landGood++;}else R.v*=SLED_RULES.landBad;ev.push({type:'land',good:ok});}}
   // 구간 기록점·결승
   while(R.cp<CHECKPOINTS.length&&R.s>=CHECKPOINTS[R.cp]){const t=+(R.t-(R.s-CHECKPOINTS[R.cp])/Math.max(.5,R.v)).toFixed(3);R.splits.push(t);ev.push({type:'cp',i:R.cp,t});
    if(R.cp===CHECKPOINTS.length-1){R.finished=true;ev.push({type:'finish',t});}R.cp++;}
   if(stopZone&&(R.v<.25||R.s>COURSE_END+SLED_RULES.stopLen)){R.done=true;ev.push({type:'end'});}
   return ev;
  },
 };
}
// 고스트(내 최고 기록 주행): 0.1초마다 [x,z,y,heading] 기록 → 이 기기 저장. at(t)로 그 시각 자리
export const GHOST_DT=.1;
export function createGhostRecorder(){const pts=[];let acc=0;return {
 add(dt,p){acc+=dt;while(acc>=GHOST_DT||!pts.length){acc=pts.length?acc-GHOST_DT:0;pts.push([+p.x.toFixed(2),+p.z.toFixed(2),+p.y.toFixed(2),+p.heading.toFixed(3),+p.s.toFixed(1)]);if(!acc)break;}},
 get points(){return pts;}};}
export function ghostAt(pts,t){if(!pts?.length)return null;const f=Math.max(0,t/GHOST_DT),i=Math.min(pts.length-1,Math.floor(f)),j=Math.min(pts.length-1,i+1),u=Math.min(1,f-i),a=pts[i],b=pts[j];
 let dh=b[3]-a[3];dh=Math.atan2(Math.sin(dh),Math.cos(dh));return {x:a[0]+(b[0]-a[0])*u,z:a[1]+(b[1]-a[1])*u,y:a[2]+(b[2]-a[2])*u,heading:a[3]+dh*u,s:a[4]+(b[4]-a[4])*u,done:f>=pts.length-1};}
// 별: 완주 ★ · 45초 안 ★★ · 25초 안 ★★★. 설계 ★★★ 32초는 이 코스 보통 실력(약 26~30초)이 모두 ★★★가 되어 25초로 당김(보통 실력 = ★★)
export const STARS=Object.freeze({three:25,two:45});
export const starsOf=t=>!Number.isFinite(t)?0:t<=STARS.three?3:t<=STARS.two?2:1;
// 보통 실력 자동 조종(시험·고스트 없을 때 시연): 가운데 선을 따라가고 장애물은 비킨다
export function botSteer(ride,{skill=1}={}){
 const s=ride.s,ahead=s+4;let want=0;
 for(const o of OBSTACLES)if(o.s>s&&o.s<s+7)want=o.off>0?-1.2:1.2; // 장애물 반대쪽
 for(const b of BOOSTERS)if(b.s>s&&b.s<s+6)want=0;
 const c=courseAt(ahead),k=c.k;want+=-k*2.5; // 굽이 안쪽
 const err=want-ride.off;const desired=Math.max(-.6,Math.min(.6,err*.5))*skill;
 return Math.max(-1,Math.min(1,(desired-ride.psi)*3));
}
