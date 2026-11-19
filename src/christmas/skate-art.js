// 아이스링크 스케이트 그림(월드아트, 2026-11-19). 대표 확정 A안(가벼운 미끄러짐), 시안 docs/크리스마스/스케이트-타기-시안-v1.html §2.
// 월드개발 rink-play.js의 SKATE_ART_API(wear·pose·drawFx)에 맞춘 그림 묶음이다. festive.js가 만들어 village.festive.skate로 내보낸다.
//  ① wear(avatar,on): 스케이트화. 지금 신발은 그대로 두고 밑에 은색 날 + 짙은 받침 2개 + 앞 말림. 옷 몸통 부품 메시(Xmas_Body)에 합쳐 그려서
//     그리기 호출이 늘지 않는다. 날 높이만큼 몸을 4.5cm 올린다(SKATE_ART.lift). 링크 안에서만 신는다.
//  ② pose(avatar,gait,dt): 자세. gait = skate.js createSkateGait 결과 {pose, side, k, lean}.
//     stand 서기 · push 한 발씩 밀기(side +1 = 오른발로 밂) · glide1 민 발 들고 한 발 활주 · glide2 두 발 모아 활주 · carve 도는 쪽으로 기울이기
//     · brake 옆으로 서서 멈추기 · wobble 벽에 닿아 휘청. 내 몸·다른 사람 몸 같은 코드. 부르는 순서(동동이 update 앞·뒤)와 상관없이
//     마지막으로 받은 자세를 다음 update 끝(avatar.extra)에 입힌다(내 몸은 한 프레임 늦음, 눈에 안 띔).
//  ③ drawFx(fx,dt): 날 자국(흰 선, 4초에 걸쳐 흐려짐)·얼음 가루. 자료는 skate.js createSkateFx(상한도 거기). 그리기 각 1번(자국 1 + 가루 1).
// 동동이 원본(src/toon/**)·옷(outfits.js)·자세(poses.js)는 고치지 않는다. 뼈는 poses.js와 같은 방식(POSE_TOOLS)으로 덧씌운다.
import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {Kit} from '../lounge/outfit.js';
import {poseRig,POSE_TOOLS} from '../lounge/spots.js';

const {blend,turnWorld,limb,wpos}=POSE_TOOLS;
const V3=THREE.Vector3,Q=THREE.Quaternion,UP=new V3(0,1,0);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;

// 그림 숫자. lift = 날 높이(몸을 올리는 만큼, m), blend = 자세가 바뀔 때 따라가는 빠르기(1/s, 약 0.15초에 거의 다), maxLean = 커브 기울기 한도(시안 15°)
// mark = 날 자국 선(폭·한 점 길이·발 간격·진하기), powder = 얼음 가루 알 크기
export const SKATE_ART=Object.freeze({lift:.045,blend:14,blade:'#dfe7ef',plate:'#3b3f52',maxLean:15*Math.PI/180,
 mark:Object.freeze({width:.02,len:.36,foot:.055,alpha:.5,scrapeWidth:.12,scrapeLen:.26,scrapeAlpha:.22}),powder:Object.freeze({size:.07})});
export const SKATE_ART_POSES=Object.freeze(['stand','push','glide1','glide2','carve','brake','wobble']);

// ── 자세 표(동동이 다리 길이 약 13cm에 맞춤). 발 [앞(+)/뒤, 바깥(+)/안, 들기, 발끝 바깥으로(라디안)] = 엉덩이 관절 기준(m),
//    팔 [앞, 바깥, 위] = 어깨 기준, drop = 몸 낮추기, lean = 앞으로 숙이기(라디안), yaw = 몸 옆으로 돌리기(멈추기), roll = 옆으로 기울기, shift = 버티는 발 쪽으로 무게
const P=(o)=>({drop:0,lean:0,yaw:0,roll:0,shift:0,L:[0,0,0,0],R:[0,0,0,0],aL:[.02,.06,-.2],aR:[.02,.06,-.2],...o});
const POSE=Object.freeze({
 stand:P({drop:.012,lean:.06,L:[0,.005,0,.3],R:[0,.005,0,.3],aL:[.04,.07,-.19],aR:[.04,.07,-.19]}),
 // 밀기(오른발로 밂): 미는 발은 바깥 뒤로 쭉, 버티는 발은 몸 밑. 팔은 반대로 흔든다(미는 쪽 팔은 뒤로). pose()가 k로 펴고 접는다.
 pushR:P({drop:.055,lean:.32,shift:.03,L:[.03,-.01,0,.1],R:[-.07,.08,.008,1.0],aL:[.14,-.02,-.11],aR:[-.13,.06,-.15]}),
 // 한 발 활주: 민 발(오른발)을 뒤로 들고, 팔을 양옆으로 벌려 균형
 glide1R:P({drop:.045,lean:.34,shift:.03,L:[.02,-.01,0,.04],R:[-.1,.02,.06,.15],aL:[.03,.23,-.03],aR:[.03,.23,-.03]}),
 glide2:P({drop:.04,lean:.2,L:[.025,0,0,.06],R:[-.02,0,0,.06],aL:[.1,.1,-.14],aR:[.1,.1,-.14]}),
 // 커브(왼쪽으로 돌 때): 안쪽(왼)발을 조금 앞으로, 안쪽 팔은 앞 아래, 바깥 팔은 벌림. 기울기는 gait.lean
 carveL:P({drop:.05,lean:.22,L:[.04,0,0,.1],R:[-.035,.01,0,.05],aL:[.1,.03,-.14],aR:[.02,.22,-.04]}),
 // 멈추기(몸을 왼쪽으로 돌림): 무릎 굽히고 발 넓게, 가는 쪽 반대로 기댐. 얼음 가루는 앞쪽 날에서
 brake:P({drop:.075,lean:.08,yaw:1.2,roll:.16,L:[.02,.07,0,0],R:[.02,.07,0,0],aL:[.07,.17,-.04],aR:[.07,.17,-.04]}),
 wobble:P({drop:.025,lean:-.12,L:[.02,.035,0,.3],R:[-.02,.035,0,.3],aL:[.02,.19,.13],aR:[.02,.19,.13]}),
});
const mirror=p=>({...p,shift:-p.shift,L:p.R,R:p.L,aL:p.aR,aR:p.aL});
const POSE_M=Object.freeze({pushL:mirror(POSE.pushR),glide1L:mirror(POSE.glide1R),carveR:mirror(POSE.carveL)});
const pick=k=>POSE[k]??POSE_M[k]??POSE.stand;
const KEYS4=['L','R','aL','aR'],KEYS1=['drop','lean','yaw','roll','shift'];
const copy=p=>({...p,L:[...p.L],R:[...p.R],aL:[...p.aL],aR:[...p.aR]});
function mix(out,a,b,t){for(const k of KEYS1)out[k]=lerp(a[k],b[k],t);for(const k of KEYS4){const A=a[k],B=b[k],O=out[k];for(let i=0;i<A.length;i++)O[i]=lerp(A[i],B[i],t);}return out;}
// gait(월드개발 이름) → 목표 숫자
function target(T,g,t){
 const side=g.side>=0?1:-1,R=side>0,lean=clamp(g.lean||0,-SKATE_ART.maxLean,SKATE_ART.maxLean);
 switch(g.pose){
  case 'push':{const e=Math.sin(Math.PI*clamp(g.k??0,0,1));mix(T,POSE.glide2,pick(R?'pushR':'pushL'),.3+.7*e);break;}
  case 'glide1':mix(T,pick(R?'glide1R':'glide1L'),POSE.stand,0);break;
  case 'carve':mix(T,POSE.glide2,pick(lean>=0?'carveL':'carveR'),.4+.6*Math.abs(lean)/SKATE_ART.maxLean);break;
  case 'brake':mix(T,POSE.brake,POSE.brake,0);T.yaw*=side;T.roll*=side;break;
  case 'glide2':case 'wobble':case 'stand':mix(T,POSE[g.pose],POSE.stand,0);break;
  default:mix(T,POSE.stand,POSE.stand,0);
 }
 if(g.pose!=='brake')T.roll=lean; // 도는 안쪽으로 몸 기울이기(움직이는 자세 모두)
 if(g.pose==='wobble'){const s=Math.sin(t*28);T.aL[2]+=.06*s;T.aR[2]-=.06*s;T.roll+=.08*s;}
 return T;
}

// ── ① 스케이트 날 형상(바인드 자세, 앞 +Z·왼쪽 +X·발바닥 0). 등산화 가운데 = 발목 앞 3.3cm(link-hiker 등산화와 같은 자리).
function bladeGeometry(sk){
 const bi=n=>sk.bones.findIndex(b=>b.name==='mixamorig'+n);
 const bindPos=n=>new V3().setFromMatrixPosition(sk.boneInverses[bi(n)].clone().invert());
 const feet={Left:bi('LeftFoot'),Right:bi('RightFoot')};
 const k=new Kit(p=>[[p.x>=0?feet.Left:feet.Right,1]]);
 const solid=(geo,hex)=>{geo.deleteAttribute('uv');geo.deleteAttribute('normal');geo=mergeVertices(geo);geo.computeVertexNormals();k.solid(geo,hex,1);};
 const L=SKATE_ART.lift;
 for(const s of ['Left','Right']){
  const A=bindPos(s+'Foot'),T=bindPos(s+'ToeBase'),fwd=new V3(T.x-A.x,0,T.z-A.z).normalize(),yaw=Math.atan2(fwd.x,fwd.z);
  const c=A.clone().addScaledVector(fwd,.033);
  const put=(g,z,y,rx=0)=>{if(rx)g.rotateX(rx);g.translate(0,y,z);g.rotateY(yaw);g.translate(c.x,0,c.z);return g;};
  solid(put(new THREE.BoxGeometry(.014,.02,.25),-.01,-L+.01),SKATE_ART.blade);           // 날(25cm, 신발 20cm보다 앞뒤로 조금 김)
  solid(put(new THREE.BoxGeometry(.014,.034,.03),.122,-L+.022,-.75),SKATE_ART.blade);    // 앞 말림
  for(const z of [-.065,.06])solid(put(new THREE.BoxGeometry(.03,L-.012,.034),z,-(L-.012)/2+.001),SKATE_ART.plate); // 받침 2개
 }
 return k.geometry();
}

// 동동이 한 명분(처음 신을 때 만들고 그 몸에 붙여 둠)
function rigFor(avatar){
 if(avatar.__skate)return avatar.__skate;
 const hiker=avatar.hiker,model=hiker.model,root=avatar.root,rig=poseRig(model);
 const body=hiker.scene.getObjectByName('ToonHiker_Body'),sk=body?.skeleton;if(!sk)return null;
 const boneAt=n=>sk.boneInverses[sk.bones.findIndex(b=>b.name==='mixamorig'+n)].clone().invert();
 const bindFoot={Left:new Q().setFromRotationMatrix(boneAt('LeftFoot')),Right:new Q().setFromRotationMatrix(boneAt('RightFoot'))};
 const ankleH=new V3().setFromMatrixPosition(boneAt('LeftFoot')).y*(body.getWorldScale(new V3()).y||1);
 const rest=hiker.scene.userData.restPose?.mixamorigHips?.p;
 const R={on:false,blade:bladeGeometry(sk),merged:null,base:null,gait:null,t:0,cur:copy(POSE.stand),tgt:copy(POSE.stand),fresh:true};
 const _q=new Q(),_q2=new Q();
 const frame=(yaw,roll)=>{model.getWorldQuaternion(_q);_q2.setFromAxisAngle(UP,yaw);_q.multiply(_q2);if(roll){const F=new V3(0,0,1).applyQuaternion(_q);_q2.setFromAxisAngle(F,roll);_q.premultiply(_q2);}return _q.clone();};
 const dirQ=(q,x,y,z)=>new V3(x,y,z).applyQuaternion(q);
 // 옷 몸통 부품 메시에 날 합치기(옷을 바꾸면 outfits.js가 새 형상을 넣으므로 다시 합친다)
 R.sync=()=>{
  const pair=body.userData.xmasParts?.body;if(!pair)return;const g=pair.mesh.geometry;
  if(R.on){if(g===R.merged)return;if(R.base&&R.base!==g)R.base.dispose?.();R.base=g;R.merged?.dispose();
   R.merged=g.attributes.position?.count?mergeGeometries([g,R.blade]):R.blade.clone();
   pair.mesh.geometry=pair.line.geometry=R.merged;pair.mesh.visible=pair.line.visible=true;}
  else if(R.merged){if(g===R.merged){pair.mesh.geometry=pair.line.geometry=R.base;pair.mesh.visible=pair.line.visible=R.base.attributes.position.count>0;}
   R.merged.dispose();R.merged=null;R.base=null;}
 };
 R.apply=(dt)=>{
  if(!R.on)return;R.sync();R.t+=dt;
  target(R.tgt,R.gait??{pose:'stand'},R.t);
  const C=R.cur;mix(C,C,R.tgt,R.fresh?1:1-Math.exp(-dt*SKATE_ART.blend));R.fresh=false;
  const ice=root.position.y; // 몸 로컬 바닥 = 얼음(땅 높이는 main·multi가 나중에 더함)
  // 몸: 날만큼 올리고, 자세만큼 낮추고, 버티는 발 쪽·기운 안쪽으로 옮긴다(발은 그 자리에 둔다)
  const Fy=frame(C.yaw,0),F=dirQ(Fy,0,0,1),L=dirQ(Fy,1,0,0),side=C.shift+Math.sin(C.roll)*.2;
  root.position.y+=SKATE_ART.lift-C.drop;root.position.addScaledVector(L,side);root.updateMatrixWorld(true);
  if(rest&&rig.hips){rig.hips.position.y=rest[1];rig.hips.updateMatrixWorld(true);} // 걷기 통통 튀기 지움
  if(rig.hips&&(C.yaw||C.roll))blend([rig.hips],1,()=>{if(C.yaw)turnWorld(rig.hips,UP,C.yaw);if(C.roll)turnWorld(rig.hips,F,-C.roll);});
  const Fr=frame(C.yaw,C.roll);
  blend(rig.spine,1,()=>turnWorld(rig.spine[0],dirQ(Fr,1,0,0),C.lean));
  const footY=ice+SKATE_ART.lift+ankleH,bodyQ=body.getWorldQuaternion(new Q());
  for(const [s,x] of [['Left',1],['Right',-1]]){
   const leg=rig[s].leg,f=C[s[0]];if(!leg[0]||!leg[2])continue;
   const t=wpos(leg[0]).addScaledVector(F,f[0]).addScaledVector(L,x*f[1]-side);t.y=footY+f[2];
   blend(leg,1,()=>{limb(leg,t,dirQ(Fy,x*.15,0,1));
    // 날은 얼음과 나란히(든 발은 발끝을 살짝 내림), 발끝은 바깥으로 f[3]
    const want=new Q().setFromAxisAngle(UP,C.yaw+x*f[3]*.5).premultiply(bodyQ).multiply(bindFoot[s]);
    if(f[2]>.02)want.premultiply(new Q().setFromAxisAngle(L,.3));
    leg[2].parent.getWorldQuaternion(_q2);leg[2].quaternion.copy(_q2.invert().multiply(want));});
  }
  for(const [s,x] of [['Left',1],['Right',-1]]){const arm=rig[s].arm,a=C['a'+s[0]];if(!arm[0])continue;
   const t=wpos(arm[0]).addScaledVector(dirQ(Fr,0,0,1),a[0]).addScaledVector(dirQ(Fr,1,0,0),x*a[1]).addScaledVector(dirQ(Fr,0,1,0),a[2]);
   blend(arm,1,()=>limb(arm,t,dirQ(Fr,x*.6,-.5,-.4)));}
 };
 const fn=dt=>R.apply(dt);avatar.extra.push(fn);
 R.dispose=()=>{R.on=false;R.sync();const i=avatar.extra.indexOf(fn);if(i>=0)avatar.extra.splice(i,1);R.blade.dispose();delete avatar.__skate;};
 return avatar.__skate=R;
}

// ── 그림 묶음. world = 효과를 넣을 무리(세계 좌표), iceY = 얼음 윗면 높이(RINK.iceY), mobile = 휴대폰
export function createSkateArt({world,iceY,mobile=false}){
 // 날 자국: 자국 하나 = 짧은 선(네모) 1~2개. 자료 상한(skate.js SKATE_FX: PC 사람 9 × 40, 휴대폰 4 × 20)의 두 배만큼 칸을 잡는다
 const capQuads=mobile?4*20*2:9*40*2;
 const tPos=new Float32Array(capQuads*12),tCol=new Float32Array(capQuads*16),tIdx=new Uint16Array(capQuads*6);
 for(let i=0;i<capQuads;i++){const b=i*4;tIdx.set([b,b+2,b+1,b+1,b+2,b+3],i*6);}
 const tGeo=new THREE.BufferGeometry();tGeo.setAttribute('position',new THREE.BufferAttribute(tPos,3).setUsage(THREE.DynamicDrawUsage));
 tGeo.setAttribute('color',new THREE.BufferAttribute(tCol,4).setUsage(THREE.DynamicDrawUsage));tGeo.setIndex(new THREE.BufferAttribute(tIdx,1));
 const tMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false});
 const trail=new THREE.Mesh(tGeo,tMat);trail.name='스케이트 날 자국';trail.frustumCulled=false;trail.renderOrder=1;trail.visible=false;world.add(trail);
 // 둥근 알(16×16 자료 그림, 캔버스 없이 — 노드 점검에서도 만들어짐)
 const N=16,px=new Uint8Array(N*N*4);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=Math.hypot(x+.5-N/2,y+.5-N/2)/(N/2),a=clamp(1-d,0,1)**.8,o=(y*N+x)*4;px[o]=px[o+1]=px[o+2]=255;px[o+3]=Math.round(a*255);}
 const tex=new THREE.DataTexture(px,N,N);tex.needsUpdate=true;tex.magFilter=tex.minFilter=THREE.LinearFilter;const capDots=mobile?30:80;
 const dPos=new Float32Array(capDots*3),dCol=new Float32Array(capDots*4);
 const dGeo=new THREE.BufferGeometry();dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3).setUsage(THREE.DynamicDrawUsage));dGeo.setAttribute('color',new THREE.BufferAttribute(dCol,4).setUsage(THREE.DynamicDrawUsage));
 const dMat=new THREE.PointsMaterial({size:SKATE_ART.powder.size,map:tex,vertexColors:true,transparent:true,depthWrite:false,toneMapped:false});
 const dots=new THREE.Points(dGeo,dMat);dots.name='스케이트 얼음 가루';dots.frustumCulled=false;dots.renderOrder=2;dots.visible=false;world.add(dots);
 const owners=new Set(['me']),stats={quads:0,dots:0};
 let q=0;
 const quad=(x0,z0,x1,z1,a,width=SKATE_ART.mark.width)=>{if(q>=capQuads)return;const dx=x1-x0,dz=z1-z0,d=Math.hypot(dx,dz)||1,w=width/2,nx=-dz/d*w,nz=dx/d*w,y=iceY+.004,o=q*12;
  tPos[o]=x0+nx;tPos[o+1]=y;tPos[o+2]=z0+nz;tPos[o+3]=x0-nx;tPos[o+4]=y;tPos[o+5]=z0-nz;tPos[o+6]=x1+nx;tPos[o+7]=y;tPos[o+8]=z1+nz;tPos[o+9]=x1-nx;tPos[o+10]=y;tPos[o+11]=z1-nz;
  for(let v=0,c=q*16;v<4;v++,c+=4){tCol[c]=.93;tCol[c+1]=.97;tCol[c+2]=1;tCol[c+3]=a*(v<2?.6:1);}q++;};
 return {
  // ① 날 신기·벗기(링크 안이면 on)
  wear(avatar,on){const R=avatar&&rigFor(avatar);if(!R)return;on=!!on;if(R.on===on)return;R.on=on;R.fresh=true;R.gait=null;R.t=0;R.sync();},
  // ② 자세(마지막으로 받은 것을 다음 update 끝에 입힘). gait는 복사해 둔다(내 gait는 매 프레임 같은 객체)
  pose(avatar,g,dt){const R=avatar?.__skate;if(!R?.on||!g)return;g=R.forced??g;const G=R.gait??(R.gait={});G.pose=g.pose;G.side=g.side;G.k=g.k;G.lean=g.lean;},
  // ③ 효과 그리기: 자국 = 몸 가운데 자리·몸 방향 h에서 발 자리로 옮긴 짧은 선(side ±1 = 한 발, 0 = 두 발), 멈추기 자국은 가로 선
  drawFx(fx,dt){
   if(!fx.__artOwners){const emit=fx.emit;fx.emit=(owner,...r)=>{owners.add(owner);return emit.call(fx,owner,...r);};fx.__artOwners=true;} // 자국 주인 목록(자료에 목록 함수가 생기면 그걸 씀)
   const list=fx.owners?.()??owners,M=SKATE_ART.mark,life=4;q=0;
   for(const id of list){const ms=fx.marksOf(id);if(!ms.length&&id!=='me'){owners.delete(id);continue;}
    let runH=null;
    for(const m of ms){
     // 멈추기 자국(kind 'brake', 없으면 앞 자국과 방향이 90° 가까이 다른 것) = 넓고 옅은 긁힘 한 줄. 겹쳐서 얼음 가루 띠처럼 보인다
     const scrape=m.kind?m.kind==='brake':runH!==null&&Math.abs(Math.atan2(Math.sin(m.h-runH),Math.cos(m.h-runH)))>1.2;if(!scrape)runH=m.h;
     const fade=Math.max(0,1-m.age/life)**1.5,a=(scrape?M.scrapeAlpha:M.alpha)*fade;if(a<=.01)continue;
     const fx_=-Math.sin(m.h),fz=-Math.cos(m.h),lx=fz,lz=-fx_; // 몸 앞·왼쪽
     if(scrape){const h=M.scrapeLen/2;quad(m.x-fx_*h,m.z-fz*h,m.x+fx_*h,m.z+fz*h,a,M.scrapeWidth);continue;}
     const half=M.len/2;
     const line=o=>{const cx=m.x+lx*o,cz=m.z+lz*o;quad(cx-fx_*half,cz-fz*half,cx+fx_*half,cz+fz*half,a);};
     // side +1 = 오른발로 밂 → 왼발로 활주(왼쪽 선), −1 = 오른쪽 선, 0 = 두 줄
     if(m.side>0)line(M.foot);else if(m.side<0)line(-M.foot);else{line(M.foot);line(-M.foot);}}}
   for(let i=q;i<stats.quads;i++)tCol[i*16+3]=tCol[i*16+7]=tCol[i*16+11]=tCol[i*16+15]=0;
   stats.quads=q;tGeo.setDrawRange(0,q*6);tGeo.attributes.position.needsUpdate=tGeo.attributes.color.needsUpdate=true;trail.visible=q>0;
   const P=fx.powder;let n=0;
   for(let i=Math.max(0,P.length-capDots);i<P.length;i++){const p=P[i],o=n*3,c=n*4;dPos[o]=p.x;dPos[o+1]=iceY+p.y;dPos[o+2]=p.z;
    dCol[c]=.96;dCol[c+1]=.98;dCol[c+2]=1;dCol[c+3]=clamp(1-p.age/.7,0,1);n++;}
   stats.dots=n;dGeo.setDrawRange(0,n);dGeo.attributes.position.needsUpdate=dGeo.attributes.color.needsUpdate=true;dots.visible=n>0;
  },
  // 점검·촬영용: 자세 고정(null이면 풀기)
  force(avatar,g){const R=avatar&&rigFor(avatar);if(R){R.forced=g;if(g)this.pose(avatar,g);}},
  status(avatar){const R=avatar?.__skate;return {on:!!R?.on,pose:R?.gait?.pose??null,quads:stats.quads,dots:stats.dots};},
  dispose(avatars=[]){for(const a of avatars)a.__skate?.dispose();world.remove(trail);world.remove(dots);tGeo.dispose();tMat.dispose();dGeo.dispose();dMat.dispose();tex.dispose();},
 };
}
