// 인형가게 동동이 기계 앞 자세(월드아트, 2026-11-23, 설계 v1 §5). 내 동동이·다른 손님 동동이(claw-avatar.js)가 같은 코드를 쓴다.
// 동동이 원본(src/toon/**·realistic-hiker.js)은 고치지 않고, 원래 동작(걷기·서기)이 끝난 뒤 뼈 회전을 덧씌운다(흡연장 spots.js POSE_TOOLS 그대로).
//  - operate: 두 손을 조작대에. 집게 = 왼손 손잡이 · 오른손 뽑기 단추, 타이머·열쇠 = 두 손을 큰 단추 위에 나란히.
//    서는 자리(stand, 조작대에서 0.44m)는 그대로 두고 몸만 조작대 쪽으로 최대 OPERATE.reach만큼 붙인다(그림만, 걷기·부딪힘 위치는 안 바뀜).
//  - cheer: 성공 만세 1초(두 팔을 위로 + 한 번 깡충). 조작대에서 손을 떼고 몸을 서는 자리로 되돌린 뒤 그린다.
//  - droop: 실패 고개 숙임 0.8초(손을 떼고 고개·등을 숙이고 팔을 늘어뜨림). 끝나면 다시 조작 자세(결과 카드 동안).
import * as THREE from 'three';
import {POSE_TOOLS,poseRig} from '../lounge/spots.js';

const {blend,turnWorld,limb,wpos}=POSE_TOOLS;
const V3=THREE.Vector3,UP=new V3(0,1,0),_q=new THREE.Quaternion();
export const CLAW_POSE=Object.freeze({
 cheerSec:1.0,droopSec:.8,    // 설계 v1 §5
 reach:.3,                    // 조작대 쪽으로 몸을 붙이는 최대 거리(m)
 handGap:.045,                // 큰 단추 위 두 손 사이 반(m)
 palm:.035,                   // 손목 뼈 → 손바닥 아래까지(손을 단추 윗면에 얹는 높이)
 lean:.14,                    // 조작할 때 상체 앞으로(rad)
 hop:.12,                     // 만세 깡충 높이(m)
 droopHead:.42,droopSpine:.12,// 고개 숙임(rad)
});
const smooth=x=>x*x*(3-2*x);
// 기계 group에서 손 자리(세계 좌표) 둘: [왼손, 오른손]. 집게 = 손잡이·단추, 그 밖 = 큰 단추 하나에 두 손
export function machineHands(machine){
 const U=machine?.userData,s=U?.spots;if(!s?.button)return null;
 machine.updateMatrixWorld(true);
 const w=v=>v.clone().applyMatrix4(machine.matrixWorld);
 if(s.stick)return [w(s.stick),w(s.button)];
 const g=CLAW_POSE.handGap;
 return [w(s.button.clone().setX(s.button.x-g)),w(s.button.clone().setX(s.button.x+g))];
}

export function createClawPoser(avatar){
 const model=avatar.hiker.model,root=avatar.root,rig=poseRig(model);
 const P={hands:null,w:0,cheer:-1,droop:-1,t:Math.random()*6};
 const dirM=(x,y,z)=>new V3(x,y,z).applyQuaternion(model.getWorldQuaternion(_q)).normalize(); // 모델 앞 +Z·왼쪽 +X → 세계
 const armLen=s=>{const [a,b,c]=rig[s].arm;return a&&b&&c?wpos(a).distanceTo(wpos(b))+wpos(b).distanceTo(wpos(c)):.3;};
 let lenL=0,lenR=0;
 // 만세·숙임 세기(0~1): 올리는 동안·내리는 동안 부드럽게
 const env=(t,sec,up,down)=>{if(t<0)return 0;const p=t/sec;return p>=1?0:smooth(p<up?p/up:p>1-down?(1-p)/down:1);};
 function update(dt){
  P.t+=dt;
  if(P.cheer>=0){P.cheer+=dt;if(P.cheer>=CLAW_POSE.cheerSec)P.cheer=-1;}
  if(P.droop>=0){P.droop+=dt;if(P.droop>=CLAW_POSE.droopSec)P.droop=-1;}
  const wc=env(P.cheer,CLAW_POSE.cheerSec,.15,.25),wd=env(P.droop,CLAW_POSE.droopSec,.25,.3);
  const want=P.hands?1:0;P.w+=(want-P.w)*Math.min(1,dt*8);if(Math.abs(want-P.w)<.003)P.w=want;
  const F=dirM(0,0,1),L=dirM(1,0,0),Fh=F.clone().setY(0).normalize();
  // ── 조작: 몸을 붙이고, 상체를 살짝 숙이고, 두 손을 조작대에(만세·숙임 동안은 그만큼 뗌)
  if(P.w>.002&&(P.hands||P.last)){
   const w=smooth(P.w)*(1-Math.max(wc,wd)),[hl,hr]=P.hands??P.last;P.last=[hl,hr];
   lenL||=armLen('Left');lenR||=armLen('Right');
   const sl=rig.Left.arm[0],sr=rig.Right.arm[0];
   if(sl&&sr){
    const mid=wpos(sl).add(wpos(sr)).multiplyScalar(.5),hm=hl.clone().add(hr).multiplyScalar(.5);
    const ahead=hm.clone().sub(mid).dot(Fh),drop=Math.max(0,mid.y-hm.y-CLAW_POSE.palm),fit=Math.min(lenL,lenR)*.86;
    const need=ahead-Math.sqrt(Math.max(0,fit*fit-drop*drop));
    const shift=Math.max(0,Math.min(CLAW_POSE.reach,need))*w;
    if(shift>0){root.position.addScaledVector(Fh,shift);root.updateMatrixWorld(true);}
   }
   blend(rig.spine,w,()=>{turnWorld(rig.spine[0],L,CLAW_POSE.lean*.6);turnWorld(rig.spine[1]??rig.spine[0],L,CLAW_POSE.lean*.4);});
   const wig=Math.sin(P.t*5.3)*.008; // 손잡이 손이 아주 조금 움직임(살아 있게)
   for(const [s,x,h] of [['Left',1,hl],['Right',-1,hr]]){
    const arm=rig[s].arm;if(!arm[0])continue;
    const t=h.clone().addScaledVector(UP,CLAW_POSE.palm).addScaledVector(L,x>0?wig:0);
    blend(arm,w,()=>limb(arm,t,dirM(x*.75,-.45,-.35)));
   }
  }
  // ── 만세(1초): 0.15초에 올리고, 끝 0.25초에 내림. 앞 절반에 한 번 깡충
  if(wc>0){
   const p=P.cheer/CLAW_POSE.cheerSec;
   root.position.y+=Math.max(0,Math.sin(Math.min(1,p/.5)*Math.PI))*CLAW_POSE.hop;root.updateMatrixWorld(true);
   blend([...rig.spine,rig.head],wc,()=>{turnWorld(rig.spine[0],L,-.08);turnWorld(rig.head,L,-.16);});
   for(const [s,x] of [['Left',1],['Right',-1]]){
    const arm=rig[s].arm;if(!arm[0])continue;
    const t=wpos(arm[0]).addScaledVector(UP,.23+Math.sin(P.cheer*16+x)*.012).addScaledVector(L,x*.19).addScaledVector(F,.03);
    blend(arm,wc,()=>limb(arm,t,dirM(x*.5,-.6,-.5)));
   }
  }
  // ── 고개 숙임(0.8초): 0.25초에 숙이고 끝 0.3초에 듦. 팔은 힘 빠져 아래로
  if(wd>0){
   blend([...rig.spine,rig.head],wd,()=>{turnWorld(rig.spine[0],L,CLAW_POSE.droopSpine*.5);turnWorld(rig.spine[2]??rig.spine[0],L,CLAW_POSE.droopSpine*.5);turnWorld(rig.head,L,CLAW_POSE.droopHead);});
   for(const [s,x] of [['Left',1],['Right',-1]]){
    const arm=rig[s].arm;if(!arm[0])continue;
    const t=wpos(arm[0]).addScaledVector(UP,-.26).addScaledVector(F,.05).addScaledVector(L,-x*.02);
    blend(arm,wd*.85,()=>limb(arm,t,dirM(x*.4,-.2,-1)));
   }
  }
 }
 return {
  update,
  /** 조작 자세 켜기: 기계 group(또는 [왼손, 오른손] 세계 좌표) · 끄기: null */
  operate(target){P.hands=!target?null:Array.isArray(target)?target:machineHands(target);},
  cheer(){P.cheer=0;P.droop=-1;},
  sigh(){P.droop=0;P.cheer=-1;},
  get state(){return {operate:!!P.hands,w:+P.w.toFixed(3),cheer:P.cheer>=0,droop:P.droop>=0};},
  rig,
 };
}
