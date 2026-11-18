// 동동이 하늘 썰매 타기 자세(월드아트, 2026-11-18). 설계 v2: 좌석에 앉아 상체만 보임. 내 동동이와 다른 사람 동동이가 같은 코드를 쓴다.
// 앉기는 poses.js setSit(회전목마 썰매 의자와 같은 벤치 앉기 자세)을 그대로 쓰고, 이 파일은 그 뒤에(avatar.extra) 덧씌운다:
//  - 몸 전체를 썰매 기울기(앞뒤·바깥 기울기·하늘 흔들림)와 같이 돌리고, 엉덩이를 좌석 쿠션 윗면에 붙인다.
//  - 손: 고삐 끝(team.hand). setArms('cheer')면 손을 놓는다(poses.js 만세가 그린다).
//  - 허리: 서기 0 · 달리기 앞으로 0.06 · 날아오르기 뒤로 0.12(몸이 뒤로 젖혀짐) · 비행 0.04 · 내려앉기 앞으로 0.1(rad).
//  - 타기 0.6초: 옆에서 폴짝 올라앉음(높이 0.3m 호). 내리기 0.35초: 좌석에서 옆자리로.
// ■ 쓰는 법(월드개발): const rider=createSleighRider({avatar,poser}); team.driver=true; rider.mount(team); … rider.dismount(); team.driver=false;
//   순서: team.drive/place → avatar.update(dt) → (village.update 안에서 fleet.update).
//   탄 동안(rider.active)은 avatar.update 뒤에 땅 높이를 더하지 않는다 — 몸 위치는 좌석이 정한다. avatar.x·z는 썰매 자리로 맞춰 두면 이름표·말풍선이 따라온다.
import * as THREE from 'three';
import {POSE_TOOLS,poseRig} from '../lounge/spots.js';
import {SLEIGH} from './sky-sleigh.js';

const {blend,turnWorld,limb,wpos}=POSE_TOOLS;
const V3=THREE.Vector3,UP=new V3(0,1,0);
export const SLEIGH_RIDER=Object.freeze({pad:.06,mountSecs:.6,dismountSecs:.35,hop:.3,lean:Object.freeze({stand:0,run:.06,takeoff:-.12,fly:.04,land:.1})});
const ease=t=>t*t*(3-2*t);

export function createSleighRider({avatar,poser}){
 const model=avatar.hiker.model,root=avatar.root,rig=poseRig(model);
 const S={team:null,w:0,dir:0,lean:0,fromY:0,arms:'reins',done:false,last:{p:new V3(),q:new THREE.Quaternion(),hand:[new V3(),new V3()]}};
 const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_e=new THREE.Euler();
 const dirM=(x,y,z)=>new V3(x,y,z).applyQuaternion(model.getWorldQuaternion(_q2)).normalize(); // 모델 공간(앞 +Z, 왼쪽 +X) → 월드
 function grab(){const t=S.team;if(!t)return;t.seat(S.last.p);t.seatQuat(S.last.q);t.hand(0,S.last.hand[0]);t.hand(1,S.last.hand[1]);}
 function ride(dt){
  if(S.dir){S.w=Math.min(1,Math.max(0,S.w+dt*S.dir/(S.dir>0?SLEIGH_RIDER.mountSecs:SLEIGH_RIDER.dismountSecs)));if(S.w>=1||S.w<=0)S.dir=0;}
  if(S.w<=0){if(S.done){S.done=false;root.rotation.x=0;root.rotation.z=0;poser?.setSit(false);}return;}
  grab();
  const w=ease(S.w),hop=Math.sin(Math.PI*w)*SLEIGH_RIDER.hop*(w<1?1:0);
  // 몸 방향: 서 있던 방향 → 썰매 방향(앞뒤·옆 기울기 포함)
  _e.set(0,root.rotation.y,0);_q.setFromEuler(_e);root.quaternion.slerpQuaternions(_q,S.last.q,w);
  root.position.y=S.fromY;root.updateMatrixWorld(true);
  // 엉덩이를 좌석 쿠션 윗면 + 허벅지 두께에
  const up=new V3(0,1,0).applyQuaternion(S.last.q),want=S.last.p.clone().addScaledVector(up,SLEIGH_RIDER.pad);
  const hips=rig.hips?wpos(rig.hips):root.position.clone().addScaledVector(UP,.2);
  root.position.addScaledVector(want.sub(hips),w);root.position.y+=hop;root.updateMatrixWorld(true);
  // 허리(모드마다)
  const m=S.team?.mode??'stand',target=SLEIGH_RIDER.lean[m]??0;S.lean+=(target-S.lean)*Math.min(1,dt*5);
  const L=dirM(1,0,0);
  if(Math.abs(S.lean)>.002)blend(rig.spine,w,()=>{turnWorld(rig.spine[0],L,S.lean*.6);turnWorld(rig.spine[1]??rig.spine[0],L,S.lean*.4);});
  // 손: 고삐 끝
  if(S.arms==='reins')for(const [s,x] of [['Left',1],['Right',-1]]){const h=S.last.hand[x>0?0:1];blend(rig[s].arm,w,()=>limb(rig[s].arm,h,dirM(x*.6,-.6,-.3)));}
 }
 avatar.extra.push(ride);
 return {
  // 타기: 지금 선 자리(땅 높이 groundY)에서 좌석으로 폴짝. instant면 바로 앉음(다른 사람 화면에서 이미 탄 사람을 처음 볼 때)
  mount(team,{groundY=team?.y??0,instant=false}={}){if(!team)return;S.team=team;S.fromY=groundY;S.done=false;poser?.setSit(true,SLEIGH.sitY);if(instant){S.w=1;S.dir=0;}else S.dir=1;},
  // 내리기: 마지막 좌석 자리에서 지금 avatar.place 해 둔 자리로(먼저 place 하고 부름). instant면 바로
  dismount({groundY=0,instant=false}={}){if(!S.team&&S.w<=0)return;grab();S.team=null;S.fromY=groundY;S.done=true;if(instant){S.w=0;S.dir=0;S.done=false;root.rotation.x=0;root.rotation.z=0;poser?.setSit(false);}else S.dir=-1;},
  setArms(k){S.arms=k==='cheer'||k==='none'?k:'reins';},
  get active(){return S.w>0||!!S.team;},get mounted(){return !!S.team&&S.w>=1;},get team(){return S.team;},get weight(){return S.w;},
  dispose(){const i=avatar.extra.indexOf(ride);if(i>=0)avatar.extra.splice(i,1);root.rotation.x=0;root.rotation.z=0;},
 };
}
