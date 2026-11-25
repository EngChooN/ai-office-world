// 뽑은 인형 자랑하기 — 들기·업기 모습과 등급 빛(월드아트, 2026-11-25). 시안: docs/인형뽑기/인형자랑-체험-시안-v1.html(11-25 대표 결정).
// 모든 콘텐츠(등산·흡연장·크리스마스·인형가게)의 동동이가 같은 코드를 쓴다. 내 캐릭터·다른 사람 캐릭터 모두 hiker 하나마다 createCarryArt 하나.
// 동동이 원본(src/toon/**·realistic-hiker.js)은 고치지 않고, 원래 동작(update → ground)이 끝난 뒤 왼팔 뼈만 덧씌운다(claw-poses.js와 같은 방식).
//  - 손(hand): 작은 인형·상자 피규어. 어깨 높이로 받쳐 들기(11-25 대표 결정, 시안 docs/인형뽑기/인형드는자세-시안-v3.html ③):
//    오른 팔꿈치를 굽혀 손 위 인형을 얼굴 옆·머리 바깥에, 인형은 앞(조금 바깥)을 봄. 왼팔은 원래 걸음 그대로.
//    동동이는 머리가 어깨보다 넓어(약 68cm·어깨 사이 28cm) 등 뒤 게임 카메라에서는 머리 바깥에 있어야 보임.
//  - 등(back): 큰 인형 3종(isBigPlush)만. 얼굴이 뒤를 보게 업고 어깨끈 두 줄 + 가슴끈. 배낭이 있으면(pack) 배낭 바깥면에 매닮(끈 대신 배낭 띠).
//  - 빛: 희귀 = 보라(인형 높이 2배, 2초에 한 번 숨쉬듯), 특별 = 금빛(2.5배) + 반짝이 5개. 흔함·보통 = 없음. 큰 인형은 원래 등급을 따름.
//    진짜 조명이 아니라 그림 한 장(Sprite) + 알갱이라 휴대폰 부담이 작다. 낮에는 밤의 1.5배(시안 촬영에서 낮 보라가 잘 안 보였음).
// 좌표: hiker.scene(루트) 기준 앞 -Z·왼쪽 -X·오른쪽 +X·위 +Y, 단위 m. 인형 그림 앞은 +Z, 바닥 y=0(claw-plush.js).
import * as THREE from 'three';
import {makePlush,plushSize} from '../claw/claw-plush.js';
import {makeBoxPrize} from '../claw/claw-bridge.js';
import {RARITY,plushInfo,isBigPlush,isBoxPlush} from '../claw/claw-palette.js';
import {POSE_TOOLS,poseRig} from '../lounge/spots.js';

const {blend,limb,wpos}=POSE_TOOLS;
const V3=THREE.Vector3,D=THREE.MathUtils.degToRad;
export const CARRY_ART=Object.freeze({
 // 손: 오른손 자리 = 지금 오른 어깨 뼈 + reach(바깥·위·앞). 인형 바닥 = 손 + seat(손 위에 얹힘). 팔꿈치는 바깥·아래·뒤로(elbow).
 // yaw = 인형이 앞에서 바깥(오른쪽)으로 돈 각도(°). sway = 걸음마다 앞뒤로 끄덕(rad).
 // 상자 피규어는 세워 진열하는 모양(폭·높이·깊이 = box[2]·box[1]·box[0], 창과 안의 인형이 앞을 봄). 봉 기계 경품 상자는 눕힌 모양이라 들 때만 세운 치수.
 hand:Object.freeze({reach:[.25,.03,-.10],seat:[.02,.012,0],yaw:20,elbow:[.5,-1,.5],nod:.06,box:[.10,.22,.16]}),
 // 등: 등뼈(Spine2) 기준. 끈으로 업음(0.17m 뒤) / 배낭 바깥면(0.30m 뒤, 조금 낮게)
 back:Object.freeze({behind:.17,drop:.3,tilt:10,pack:Object.freeze({behind:.30,drop:.29,tilt:4})}),
 strap:Object.freeze({r:.011,color:'#e8d9b0',pack:'#2f7f78'}),
 // 앉기: 손 인형은 서 있을 때와 같이 어깨 높이로 받쳐 듦. 등 인형은 숨김(등받이·좌석에 파묻힘 방지)
 // 빛(시안 §5 추천안, 대표 결정 11-25). opacity = 밤 기준, 낮은 dayBoost배.
 glow:Object.freeze({
  rare:Object.freeze({scale:2.2,opacity:.72,breathSec:2,breath:.25}),
  special:Object.freeze({scale:2.5,opacity:.55,breathSec:2,breath:.15,sparks:5,spark:.16,sparkHz:.45,sparkColor:'#fff6c8'}),
  dayBoost:1.5,
  // 인형가게 실내 빛 세기(11-25 시안 v2 §4: 실내라 낮밤 없이 하나로 고정, daylight 값 0 밤 ~ 1 낮). 빛 세기를 바꿀 때는 이 블록(glow)만 고치면 됨
  shop:1,
  // 카메라가 인형 쪽에서 볼 때 빛을 줄이는 양(몸이 보라·금색으로 물드는 것을 막음). 등은 큰 인형이 등을 거의 가려 덜 줄임(게임 카메라가 늘 뒤라 자랑이 보여야 함)
  over:Object.freeze({hand:Object.freeze({fade:.7,shrink:.4}),back:Object.freeze({fade:.25,shrink:.15})}),
  push:.3, // 빛 그림을 인형 가운데에서 카메라 반대쪽으로 미는 거리(인형 높이 비율). 크면 몸에 가려 낮에 안 보임, 작으면 인형 얼굴을 덮음
 }),
 popSec:.2, // 꺼내 들 때·동작 뒤 다시 나타날 때 커지는 시간
 sway:Object.freeze({hand:.035,back:.05}), // 걸음마다 살짝 흔들림(rad)
});

/** 이 인형을 어디에 드나: 큰 인형 = 'back', 나머지(작은 인형·상자 피규어) = 'hand' */
export const carrySlotOf=id=>isBigPlush(id)?'back':'hand';
/** 빛 단계: 0 = 없음(흔함·보통) · 1 = 보라(희귀) · 2 = 금빛 + 반짝이(특별). 모르는 인형은 0 */
export const glowTierOf=id=>({rare:1,special:2})[plushInfo(id)?.rarity]??0;

let glowTex=null,sparkTex=null;
function texGlow(){if(glowTex||typeof document==='undefined')return glowTex;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
 r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.6)');r.addColorStop(.7,'rgba(255,255,255,.22)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);
 glowTex=new THREE.CanvasTexture(c);glowTex.colorSpace=THREE.SRGBColorSpace;return glowTex;}
function texSpark(){if(sparkTex||typeof document==='undefined')return sparkTex;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.beginPath();
 for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?7:30;g.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}g.closePath();g.fill();
 sparkTex=new THREE.CanvasTexture(c);sparkTex.colorSpace=THREE.SRGBColorSpace;return sparkTex;}

// 빛 묶음 하나(인형 하나에). 중심은 인형 가운데, 그림은 인형 뒤(카메라 반대쪽)로 밀어 그려 땅·몸에 잘리지 않게 한다.
function makeGlow(id,size){
 const tier=glowTierOf(id);if(!tier)return null;
 const R=RARITY[plushInfo(id).rarity],G=tier===2?CARRY_ART.glow.special:CARRY_ART.glow.rare,g=new THREE.Group();g.name='인형 빛';
 // 둘레 빛은 보통 섞기(밝은 낮 배경에서도 보라·금색이 하얗게 날아가지 않음), 반짝이만 더하기 섞기
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow(),color:R.color,transparent:true,depthWrite:false,opacity:G.opacity,fog:false,toneMapped:false}));
 halo.scale.setScalar(size*G.scale);halo.renderOrder=-1;halo.raycast=()=>{};g.add(halo);
 const sparks=[];
 for(let i=0;i<(G.sparks??0);i++){const k=new THREE.Sprite(new THREE.SpriteMaterial({map:texSpark(),color:G.sparkColor,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  const a=i/G.sparks*Math.PI*2;k.position.set(Math.cos(a)*size*.62,size*(-.25+.6*((i*37)%5)/5),Math.sin(a)*size*.62);k.scale.setScalar(size*G.spark);k.raycast=()=>{};g.add(k);sparks.push(k);}
 return {group:g,halo,sparks,tier,G,size};
}

// 인형 그림(손 = 작은 인형·상자, 등 = 큰 인형). 상자 피규어는 봉 기계 경품 그림(makeBoxPrize)을 세운 치수로: 창(+Z)과 안의 인형이 앞을 봄.
function makeDoll(id,toonify){
 if(isBoxPlush(id)){const b=makeBoxPrize(id,{toonify,box:CARRY_ART.hand.box}),g=new THREE.Group();
  const [d,h,w]=CARRY_ART.hand.box;b.position.y=h/2;g.add(b);g.userData={plushId:id,size:h,box:true,width:w,depth:d};return g;}
 const p=makePlush(id,{toonify});return p;
}

/**
 * hiker(realistic-hiker.js api) 하나에 인형 들기·업기를 붙인다.
 * 부르는 순서: hiker.update → hiker.ground → (인형가게면 claw poser) → carry.update(dt,{...}).
 * @param {object} hiker createRealisticHiker 결과(카툰 동동이)
 * @param {{toonify?:Function,pack?:boolean,hidePole?:boolean}} o pack = 큰 배낭을 멘 몸(등산) → 업은 인형을 배낭 바깥면에. hidePole = 손에 들면 오른쪽 등산 스틱을 숨김
 */
export function createCarryArt(hiker,{toonify=null,pack=false,hidePole=true}={}){
 const root=hiker.scene,model=hiker.model,rig=poseRig(model);
 const S={hand:null,back:null,t:Math.random()*6};
 const slots={hand:null,back:null};
 // 서 있는 자세에서 뼈 자리를 한 번 재 둔다(손 인형 높이 = 엉덩이 기준, 등 인형 = 등뼈 기준).
 const rest={};
 const toLocal=(b,out=new V3())=>root.worldToLocal(wpos(b,out));
 function measure(){root.updateMatrixWorld(true);
  rest.hips=toLocal(rig.hips);rest.spine=toLocal(rig.spine.at(-1));
  rest.shL=toLocal(rig.Left.arm[0]);rest.shR=toLocal(rig.Right.arm[0]);
  rest.hipsQ=localQuat(rig.hips);rest.spineQ=localQuat(rig.spine.at(-1));}
 const _q=new THREE.Quaternion(),_rq=new THREE.Quaternion();
 function localQuat(b,out=new THREE.Quaternion()){b.getWorldQuaternion(out);root.getWorldQuaternion(_rq);return out.premultiply(_rq.invert());}
 // 뼈를 따라가는 받침(루트 기준). 뼈 위치 + 서 있을 때와의 회전 차이(돌기만, 크기 없음)를 따른다.
 function anchor(name){const a=new THREE.Group();a.name=`인형 받침:${name}`;root.add(a);return a;}
 const handA=anchor('손'),backA=anchor('등');
 function follow(a,bone,restPos,restQ){
  toLocal(bone,a.position);localQuat(bone,a.quaternion).multiply(_q.copy(restQ).invert());
  // 걸음마다 몸이 기울어도 인형이 몸통을 뚫지 않을 만큼만 따른다(돌기의 절반)
  a.quaternion.slerp(_q.identity(),.5);a.updateMatrix();}

 function strapsFor(s,doll){
  const g=new THREE.Group();g.name='업은 끈';const C=CARRY_ART.strap,col=pack?C.pack:C.color;
  const m=new THREE.MeshStandardMaterial({color:col,roughness:.9});
  const sp=rest.spine,B=pack?CARRY_ART.back.pack:CARRY_ART.back,dz=B.behind,y0=-B.drop;
  if(!pack){
   // 어깨끈 두 줄: 가슴 앞 → 어깨 위 → 인형 겨드랑이. 받침(등뼈) 기준 좌표.
   for(const [sh,sx] of [[rest.shL,-1],[rest.shR,1]]){
    const x=sh.x-sp.x,y=sh.y-sp.y,z=sh.z-sp.z;
    const pts=[new V3(x*.55,y-.13,z-.11),new V3(x*.75,y-.02,z-.09),new V3(x*.85,y+.035,z-.01),new V3(x*.8,y+.01,z+.07),new V3(sx*s*.24,y0+s*.52,dz-s*.02)];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,C.r,6),m));}
   // 가슴끈(두 어깨끈을 잇는 가로 띠)
   const y=rest.shL.y-sp.y-.13,z=rest.shL.z-sp.z-.112,x=Math.abs(rest.shL.x-sp.x)*.55;
   g.add(new THREE.Mesh(new THREE.CapsuleGeometry(C.r*1.1,x*2,3,6).rotateZ(Math.PI/2).translate(0,y,z),m));
  }else{
   // 배낭 바깥면에 매닮: 인형 배를 감아 배낭 면으로 이어지는 배낭 띠(인형 몸 기준이라 같이 기울어짐 — build에서 body에 붙임)
   const yb=s*.3,pts=[new V3(-s*.24,yb,-s*.34),new V3(-s*.27,yb,-s*.02),new V3(-s*.19,yb,s*.19),new V3(0,yb,s*.25),new V3(s*.19,yb,s*.19),new V3(s*.27,yb,-s*.02),new V3(s*.24,yb,-s*.34)];
   g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,C.r*1.2,6),m));
  }
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});toonify?.(g,{kind:'prop'});return g;
 }

 function build(slot,id){
  const old=slots[slot];if(old){old.root.removeFromParent();old.straps?.traverse(o=>{if(o.isMesh)o.geometry.dispose();});old.glow?.group.traverse(o=>o.material?.dispose());}
  slots[slot]=null;S[slot]=id??null;
  if(slot==='hand'&&hidePole){const p=hiker.props?.poles?.[1];if(p){p.userData??={};if(id){p.wasVisible??=p.group.visible;p.group.visible=false;}else if(p.wasVisible!==undefined){p.group.visible=p.wasVisible;delete p.wasVisible;}}}
  if(!id)return;
  if(!rest.hips)measure();
  const doll=makeDoll(id,toonify),s=doll.userData.size,holder=new THREE.Group();holder.name=`${slot==='hand'?'든':'업은'} 인형:${id}`;
  const body=new THREE.Group();body.add(doll);holder.add(body);
  const glow=makeGlow(id,doll.userData.box?s*.8:s);if(glow){glow.group.position.y=s*.5;body.add(glow.group);}
  let straps=null;
  if(slot==='hand'){
   // 자리는 update에서 매 프레임 오른 어깨를 따라 정함
   doll.rotation.y=Math.PI-D(CARRY_ART.hand.yaw);handA.add(holder);
  }else{
   const B=pack?CARRY_ART.back.pack:CARRY_ART.back;
   holder.position.set(0,-B.drop,B.behind);body.rotation.x=D(B.tilt);backA.add(holder);
   straps=strapsFor(s,doll);(pack?body:backA).add(straps);
  }
  slots[slot]={id,root:holder,body,doll,glow,straps,size:s,pop:0,shown:false};
 }

 const tmp=new V3(),tmp2=new V3(),cam=new V3(),_hand=new V3(),_p=new V3(),_seat=new V3();
 const api={
  /** 들 인형 정하기. id = 인형 id 또는 null(내려놓기). 손·등 자리는 carrySlotOf로 저절로 정해진다. */
  set({hand,back}={}){
   if(hand!==undefined&&hand!==S.hand){if(hand&&carrySlotOf(hand)!=='hand')throw new Error(`손에 들 수 없는 인형: ${hand}`);build('hand',hand);}
   if(back!==undefined&&back!==S.back){if(back&&carrySlotOf(back)!=='back')throw new Error(`업을 수 없는 인형: ${back}`);build('back',back);}
  },
  get hand(){return S.hand;},get back(){return S.back;},
  /**
   * 매 프레임(ground 뒤). camera = 빛을 인형 뒤로 미는 기준(없으면 밀지 않음).
   * daylight 0(밤)~1(낮). hideHand/hideBack = 손 쓰는 동작·탈것 동안 잠시 숨김(다시 보이면 0.2초 커짐).
   * seated 0~1 = 앉은 정도(0.5 넘으면 등 인형은 숨김, 손 인형은 그대로 어깨 높이). far = 먼 사람(인형 모형은 숨기고 빛만).
   * moving·phase = 걸음 흔들림(hiker.ground에 준 값 그대로).
   */
  update(dt,{camera=null,daylight=1,hideHand=false,hideBack=false,seated=0,far=false,moving=false,phase=0}={}){
   S.t+=dt;if(!slots.hand&&!slots.back)return;
   if(!rest.hips)measure();
   follow(handA,rig.hips,rest.hips,rest.hipsQ);follow(backA,rig.spine.at(-1),rest.spine,rest.spineQ);
   handA.updateMatrixWorld(true);
   const sit=seated>.5,swing=moving?Math.sin(Math.PI*phase):0;
   for(const slot of ['hand','back']){
    const c=slots[slot];if(!c)continue;
    const want=!(slot==='hand'?hideHand:hideBack||sit);
    if(want&&!c.shown){c.pop=0;c.shown=true;}else if(!want)c.shown=false;
    c.root.visible=want;if(!want)continue;
    c.pop=Math.min(1,c.pop+dt/CARRY_ART.popSec);const k=c.pop<1?1-(1-c.pop)**3:1;c.root.scale.setScalar(Math.max(.01,k));
    c.doll.visible=!far;
    c.body.rotation.z=swing*CARRY_ART.sway[slot]*.5;
    if(slot==='back'){c.body.rotation.x=D((pack?CARRY_ART.back.pack:CARRY_ART.back).tilt)+Math.abs(swing)*CARRY_ART.sway.back*.6;if(c.straps)c.straps.visible=!far;}
   }
   // 손 인형: 어깨 높이로 받쳐 들기(서기·걷기·뛰기·앉기 같음). 손 자리 = 지금 오른 어깨 + reach(어깨가 걸음·앉기로 움직이면 같이 감)
   const h=slots.hand;
   if(h&&h.root.visible){
    const H=CARRY_ART.hand;root.updateMatrixWorld(true);
    const sh=root.worldToLocal(wpos(rig.Right.arm[0],tmp)),hand=_hand.set(sh.x+H.reach[0],sh.y+H.reach[1],sh.z+H.reach[2]);
    root.localToWorld(_p.copy(hand).add(_seat.set(...H.seat)));h.root.position.copy(handA.worldToLocal(_p));
    h.doll.rotation.set(swing*H.nod,Math.PI-D(H.yaw),0);
    h.root.updateMatrixWorld(true);
    const bend=root.localToWorld(tmp2.set(...H.elbow)).sub(wpos(root,cam)).normalize();
    blend(rig.Right.arm,Math.min(1,h.pop*3),()=>limb(rig.Right.arm,root.localToWorld(hand),bend));
   }
   // 빛: 숨쉬기·반짝이, 그림은 카메라 반대쪽(인형 뒤)으로 민다
   const boost=THREE.MathUtils.lerp(1,CARRY_ART.glow.dayBoost,THREE.MathUtils.clamp(daylight,0,1));
   for(const c of [slots.hand,slots.back]){const g=c?.glow;if(!g||!c.root.visible)continue;
    const b=1-g.G.breath*.5+g.G.breath*.5*Math.sin(S.t*Math.PI*2/g.G.breathSec);
    // 카메라가 인형 쪽(손 인형 = 왼옆, 등 인형 = 뒤)에서 보면 빛 그림이 몸 위에 겹쳐 몸이 물든다 → 그만큼 줄임
    let over=0;if(camera){const cw=c.root.getWorldPosition(tmp),bw=wpos(root,cam);bw.y=cw.y;
     const out=cw.sub(bw).setY(0).normalize(),see=camera.getWorldPosition(tmp2).sub(c.root.getWorldPosition(cam)).setY(0).normalize();
     over=THREE.MathUtils.clamp((out.dot(see)-.3)/.6,0,1);}
    const O=CARRY_ART.glow.over[c===slots.hand?'hand':'back'];g.halo.scale.setScalar(g.size*g.G.scale*(1-O.shrink*over));
    g.halo.material.opacity=Math.min(1,g.G.opacity*boost*b*(1-O.fade*over));
    g.sparks.forEach((k,i)=>{k.material.opacity=Math.min(1,(.5+.5*Math.sin(S.t*Math.PI*2*g.G.sparkHz+i*1.7))*boost*.8);});
    if(camera){g.group.updateMatrixWorld(true);const center=g.group.getWorldPosition(tmp),dir=tmp2.copy(center).sub(camera.getWorldPosition(cam)).normalize().multiplyScalar(g.size*CARRY_ART.glow.push);
     g.halo.position.copy(g.group.worldToLocal(center.add(dir)));}
   }
  },
  /** 모두 내려놓고 붙인 것을 지움(형상·재질 중 인형 공용분은 남김) */
  dispose(){build('hand',null);build('back',null);handA.removeFromParent();backA.removeFromParent();},
  /** 점검용: 든 인형의 월드 상자(겹침·머리 가림 확인) */
  bounds(slot){const c=slots[slot];return c?new THREE.Box3().setFromObject(c.doll):null;},
  slots,
 };
 return api;
}
