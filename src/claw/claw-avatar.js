// 인형가게 동동이(월드개발, 2026-11-23). 흡연장 avatar.js와 같은 몸·걸음(공용 link-hiker·realistic-hiker를 고치지 않고 씀)에
// 옷은 인형가게 전용 옷(claw-outfits.js, 11-23 대표 피드백: 등산복 말고). 등산 스틱도 숨긴다. outfit = 'hoodie'(기본)|'jacket'|'tee'.
// 기계 앞 자세(두 손 조작·만세·고개 숙임)는 월드아트 claw-poses.js(11-23): operate(기계 group|null)·cheer()·sigh().
import * as THREE from 'three';
import {buildToonHikerGltf} from '../toon/link-hiker.js';
import {createRealisticHiker} from '../realistic-hiker.js';
import {loadRig,WALK_SPEED,RUN_MUL,BASE_STRIDE} from '../lounge/avatar.js';
import {createClawPoser} from './claw-poses.js';
import {applyClawOutfit,DEFAULT_CLAW_OUTFIT} from './claw-outfits.js';
export {WALK_SPEED,RUN_MUL};

const flat=()=>0,noSample=()=>({});
export async function createClawAvatar({rigUrl,toon,name='동동이',id='me',outfit=DEFAULT_CLAW_OUTFIT}){
 const base=await loadRig(rigUrl);
 const hiker=createRealisticHiker(buildToonHikerGltf(base));
 const wear=k=>{const key=applyClawOutfit(hiker,k);toon.toonify(hiker.scene,{kind:'character'});
  hiker.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});return key;};
 let worn=wear(outfit);
 const hidePoles=()=>{for(const p of hiker.props?.poles??[])p.group.visible=false;};hidePoles();
 const root=hiker.scene;root.name=`avatar-${id}`;
 let headBone=null,poser=null;
 const a={
  id,name,hiker,root,
  x:0,z:0,heading:0,phase:0,moving:false,running:false,speed:0,idle:0,
  place(x,z,heading=a.heading){a.x=x;a.z=z;a.heading=heading;root.position.set(x,0,z);hiker.snapTo(heading);},
  /** 기쁨(두 팔 만세 + 깡충, 1초) · 아쉬움(고개 숙임 0.8초) · 조작(두 손을 조작대에, 기계 group 또는 null) */
  cheer(){(poser??=createClawPoser(a)).cheer();},sigh(){(poser??=createClawPoser(a)).sigh();},
  operate(machine){if(!machine&&!poser)return;(poser??=createClawPoser(a)).operate(machine);},
  get pose(){return poser?.state??null;},
  get outfit(){return worn;},setOutfit(k){worn=wear(k);return worn;},
  update(dt,{moved=0,running=false}={}){
   const scale=hiker.strideScale??{walk:.22/.72,run:.30/.72},stepLength=BASE_STRIDE*(running?scale.run:scale.walk);
   a.moving=moved>1e-4;a.running=running&&a.moving;a.speed=dt>0?moved/dt:0;
   if(a.moving)a.phase+=moved/stepLength;a.idle=a.moving?0:a.idle+dt;
   root.position.set(a.x,0,a.z);hiker.turnTo(a.heading,dt);root.updateMatrixWorld(true);
   hiker.update({clip:a.moving?'Walk':'Idle',distance:a.phase,stride:1,stepLength,stairs:false,idleSeconds:performance.now()/1000,slope:0,pose:'stand',running:a.running,speed:a.speed,dt,surfaceHeight:flat,gadget:'none',selfie:false,lookYaw:0,lookPitch:0});
   hiker.ground({moving:a.moving,phase:a.phase,floorHeight:0,sample:noSample,surfaceHeight:flat,pose:'stand'});
   hidePoles();
   poser?.update(dt);
  },
  headTop(target=new THREE.Vector3()){const h=headBone??=hiker.model?.getObjectByName('mixamorigHead')??null;if(h){target.setFromMatrixPosition(h.matrixWorld);if(target.lengthSq()===0)h.getWorldPosition(target);target.y+=.42;}else target.set(a.x,1.25,a.z);return target;},
 };
 return a;
}
