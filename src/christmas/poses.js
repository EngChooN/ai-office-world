// 온라인 크리스마스 동동이 자세(월드개발, 2026-11-16). 내 동동이와 다른 사람 동동이(multi.js)가 같은 코드를 쓴다.
// 동동이 원본(src/toon/**·realistic-hiker.js)은 고치지 않고, 원래 동작이 끝난 뒤(avatar.extra) 뼈 회전을 덧씌운다(흡연장 spots.js와 같은 방식).
//  - 앉기(모닥불 통나무·썰매): 흡연장 createPoser의 벤치 앉기 그대로(등산 bench-sit 다리 값·달랑달랑). 좌판 높이만 다르다.
//  - 팔: warm 손 녹이기(불 쪽으로 손을 내밀고 비빔) · push 눈덩이 밀기 · cheer 만세(썰매) · pack 눈 뭉치기(웅크림) · cocoa 코코아 컵을 입가로
//  - throw(): 눈덩이 던지기 한 번(오른팔 뒤로 → 앞으로, 0.45초)
// 몸 높이: 앉기는 root.position.y를 바닥 0 기준으로 올리므로, 부르는 쪽은 update 뒤 y에 땅 높이를 더한다(=로 덮으면 앉은 자세가 바닥에 묻힌다).
import * as THREE from 'three';
import {createPoser,newPoseState,POSE_TOOLS} from '../lounge/spots.js';

const {blend,turnWorld,limb,wpos}=POSE_TOOLS;
const V3=THREE.Vector3,UP=new V3(0,1,0),_q=new THREE.Quaternion();
export const THROW_SECS=.45;
export const ARM_KINDS=Object.freeze(['none','warm','push','cheer','pack','cocoa']);

export function createXmasPoser({avatar,world,toon}){
 const S=newPoseState();
 const poser=createPoser({S,avatar,rooftop:{spots:{}},world,toon,auto:false});
 avatar.extra.unshift(poser.pose);
 const model=avatar.hiker.model,root=avatar.root,rig=poser.rig;
 const X={arms:'none',last:'none',w:0,t:Math.random()*6,throwT:-1};
 const dirM=(x,y,z)=>new V3(x,y,z).applyQuaternion(model.getWorldQuaternion(_q)).normalize();
 let mug=null;
 const makeMug=()=>{const g=new THREE.Group();g.name='코코아 컵';
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.03,.07,12).translate(0,.035,0),new THREE.MeshStandardMaterial({color:'#c94a3a',roughness:.8}));
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.004,12).translate(0,.068,0),new THREE.MeshStandardMaterial({color:'#6b3e26',roughness:1}));
  g.add(m,top);toon?.toonify?.(g,{kind:'prop'});g.visible=false;world.add(g);return g;};
 function arms(dt){
  X.t+=dt;
  const want=X.arms!=='none'?1:0;X.w+=(want-X.w)*Math.min(1,dt*7);if(Math.abs(want-X.w)<.003)X.w=want;
  if(X.arms!=='none')X.last=X.arms;
  const kind=X.last,w=X.w*X.w*(3-2*X.w),F=dirM(0,0,1),L=dirM(1,0,0);
  if(w>.002){
   if(kind==='pack'){root.position.y-=.1*w;root.updateMatrixWorld(true);blend(rig.spine,w,()=>turnWorld(rig.spine[0],L,.35));}
   if(kind==='push')blend(rig.spine,w,()=>turnWorld(rig.spine[0],L,.18));
   for(const [s,x] of [['Left',1],['Right',-1]]){
    const arm=rig[s].arm;if(!arm[0])continue;const sh=wpos(arm[0]);let t=null,bend=dirM(x*.6,-.6,-.3);
    if(kind==='warm')t=sh.clone().addScaledVector(F,.23).addScaledVector(UP,-.09).addScaledVector(L,-x*.05+Math.sin(X.t*7+x)*.015);
    else if(kind==='push')t=sh.clone().addScaledVector(F,.25).addScaledVector(UP,-.05).addScaledVector(L,-x*.02);
    else if(kind==='cheer'){t=sh.clone().addScaledVector(UP,.26+Math.sin(X.t*6+x)*.02).addScaledVector(L,x*.08).addScaledVector(F,.03);bend=dirM(x*.8,.2,-.4);}
    else if(kind==='pack')t=sh.clone().addScaledVector(F,.17).addScaledVector(UP,-.27).addScaledVector(L,-x*.04+Math.sin(X.t*10)*x*.01);
    else if(kind==='cocoa'&&s==='Left'){const h=wpos(rig.head??model);t=h.addScaledVector(F,.14).addScaledVector(UP,-.12).addScaledVector(L,.02);}
    if(t)blend(arm,w,()=>limb(arm,t,bend));
   }
  }
  // 코코아 컵은 왼손에
  if(kind==='cocoa'&&w>.3){mug??=makeMug();const h=rig.Left.arm[2];if(h){mug.visible=true;wpos(h,mug.position);mug.position.y-=.03;mug.quaternion.copy(model.getWorldQuaternion(_q));}}
  else if(mug)mug.visible=false;
  // 던지기(오른팔): 뒤로 젖혔다가 앞으로
  if(X.throwT>=0){X.throwT+=dt;const p=X.throwT/THROW_SECS,arm=rig.Right.arm;
   if(p>=1)X.throwT=-1;
   else if(arm[0]){const sh=wpos(arm[0]),tw=p<.15?p/.15:p>.8?(1-p)/.2:1;
    const t=p<.4?sh.clone().addScaledVector(F,-.1).addScaledVector(UP,.2).addScaledVector(L,.04):sh.clone().addScaledVector(F,.28).addScaledVector(UP,.06).addScaledVector(L,.05);
    blend(arm,tw,()=>limb(arm,t,dirM(-.7,-.3,-.4)));
    blend(rig.spine,tw,()=>turnWorld(rig.spine[1]??rig.spine[0],UP,p<.4?.25:-.3));}}
 }
 avatar.extra.push(arms);
 return {
  // 앉기 켜기·끄기. seatY = 바닥에서 좌판까지(m)
  setSit(on,seatY=.34){if(on){if(S.pose!=='sit'||S.spot?.seat?.y!==seatY){S.pose='sit';S.last='sit';S.spot={seat:{y:seatY}};}}else if(S.pose!=='stand')S.pose='stand';},
  setArms(kind){X.arms=ARM_KINDS.includes(kind)?kind:'none';},
  throw(){X.throwT=0;},
  get sitting(){return S.pose==='sit';},get arms(){return X.arms;},get S(){return S;},
  dispose(){poser.dispose();const i=avatar.extra.indexOf(arms);if(i>=0)avatar.extra.splice(i,1);const j=avatar.extra.indexOf(poser.pose);if(j>=0)avatar.extra.splice(j,1);if(mug){world.remove(mug);}},
 };
}
// 받은 행동 상태 act → 자세(다른 사람). 앉기: 모닥불 자리(st) 또는 썰매(sl 1~5)
export const SLED_SEAT_Y=.33;
export function applyXmasAct(poser,a,seatY=.34){
 if(!poser)return;
 const sled=a?.sl>=1;
 poser.setSit(!!a?.st||sled,sled?SLED_SEAT_Y:seatY);
 // 썰매 위에서 wm = 🙌 만세, 모닥불에서 wm = 손 녹이기
 poser.setArms(a?.pk?'pack':a?.pu?'push':a?.wm&&sled?'cheer':a?.wm?'warm':a?.cc?'cocoa':'none');
}
