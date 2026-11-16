// 카툰 모드 전용 등산객: 야숨 링크 비율(5.7등신·짧은 다리·가는 팔다리)에 야숨풍 등산복(긴 바람막이·등산 바지·등산화·작은 배낭)을 입힌 직접 만든 몸.
// 기준 수치는 docs/카툰-참고-2차.md(12·13번 참고 폴더). 얼굴·머리 모양·문양은 따르지 않는다(둥근 귀·짙은 갈색 짧은 머리·점눈).
// 뼈대와 둘러보기·계단·바위 동작은 카툰용 Hiker.glb의 Mixamo 뼈대를 복제해 뼈 길이만 링크 비율로 바꿔 그대로 쓰고,
// 걷기(Walk)·뛰기(Run) 동작은 참고 프레임 수치(보폭·디딤 비율·상체 기울기·발 들림)로 여기서 만든다.
// 결과는 glTF와 같은 {scene,animations}라 createRealisticHiker(앉기·쌍안경·휴대폰·스틱·IK·접지)를 그대로 쓴다.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {legTargets} from '../hiker-ik.js';
import {createRealisticHiker} from '../realistic-hiker.js';

const {Vector3,Quaternion,Color}=THREE;
// 키 H=1.7m 기준 링크 비율(정면 12_01·12_02 계측). 높이는 발바닥에서 잰 값(m).
export const LINK_BODY=Object.freeze({height:1.7,headRatio:5.7,shoulderWidth:.30,crotch:.42,belt:.515,hem:.355,bootTop:.25,hand:.09,foot:.16});
// 걷기·뛰기 참고 수치(13번 폴더, 왕눈 게임 화면). 각도는 도, 보폭은 키 대비.
export const LINK_GAIT=Object.freeze({
 walk:{cycle:.88,stride:.36,lean:4,armForward:20,armBack:7,elbow:12},
 run:{cycle:.53,stride:.70,lean:15,armForward:30,armBack:45,elbow:90},
});
// 걷기 속도(평지 0.72m×1.9걸음/s≈1.37m/s)는 실사와 같고 보폭만 바꾼다: 0.72×0.85=0.61m(0.36H) → 2.24걸음/s, 한 주기 0.89초(참고 0.88초).
// 뛰기는 대표 결정(2026-11-05)으로 카툰 모드만 걷기의 2.5배(약 3.4m/s, 실사 1.6배). 링크(약 4.2m/s)에 가깝게 크게 뛴다.
// 0.72×1.42=1.02m(0.60H) → 3.35걸음/s, 한 주기 0.60초(참고 0.53초·0.70H). 스테미나는 시간당 소모라 그대로다.
export const TOON_STRIDE=Object.freeze({walk:.85,run:1.42});
export const TOON_RUN_SPEED=2.5;
// 뼈 길이 배율(부모 기준 오프셋). 원본 등산객(1.7m 사람 비율) → 링크 비율.
// 링크는 머리가 클 뿐 다리는 보통 사람 비율이다(엉덩이 관절 0.47H, 무릎 0.27H). 목은 짧고 몸통은 곧다.
const BONE_SCALE={UpLeg:.8,Leg:.8,Foot:.95,ToeBase:1.05,Spine:.93,Spine1:.93,Spine2:.93,Neck:.89,Head:1.3,Shoulder:1.0,Arm:1.16,ForeArm:1.0,Hand:.92,finger:.85};
const HIPS_SCALE=.896; // 골반 높이 0.949 → 0.85m(엉덩이 관절 0.80m)
const LINE_COLOR='#2e2420',LINE_WIDTH=.0065;
const PALETTE={skin:'#f2c79e',skinShade:'#e3a985',hair:'#4a3020',jacket:'#ea7442',jacketDark:'#35586f',pants:'#6b786d',pantsCuff:'#56625a',boot:'#8d5c35',bootCollar:'#a8733f',sole:'#2f2620',lace:'#d9c9a3',pack:'#3f8a8f',packDark:'#2d4a52',strap:'#2b3a40',glove:'#4d3a33',eye:'#2a2321',white:'#ffffff',mouth:'#9a4c3f',blush:'#f0a18c'};

const boneScale=name=>{
 const n=name.replace('mixamorig','').replace(/^(Left|Right)/,'');
 if(/^Hand(Thumb|Index|Middle|Ring|Pinky)/.test(n))return BONE_SCALE.finger;
 return BONE_SCALE[n]??1;
};

// ── 형상 모으기: 조각마다 색과 뼈 가중치를 붙여 SkinnedMesh 하나로 합친다(그리기 호출을 줄인다).
class Parts{
 constructor(boneIndex){this.boneIndex=boneIndex;this.pos=[];this.nor=[];this.col=[];this.si=[];this.sw=[];this.idx=[];this.line=[];}
 // line: 외곽선 두께 배율(얼굴 점·볼은 0, 손가락은 얇게)
 add(geometry,color,weights,line=1){
  const g=geometry;
  if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,n=g.attributes.normal,base=this.pos.length/3,V=new Vector3(),c=new Color();
  for(let i=0;i<p.count;i++){
   V.fromBufferAttribute(p,i);this.pos.push(V.x,V.y,V.z);this.line.push(line);this.nor.push(n.getX(i),n.getY(i),n.getZ(i));
   c.set(typeof color==='function'?color(V,i):color);this.col.push(c.r,c.g,c.b);
   const w=(typeof weights==='function'?weights(V):weights).filter(([,x])=>x>1e-4).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=w.reduce((s,[,x])=>s+x,0)||1;
   for(let k=0;k<4;k++){const e=w[k];this.si.push(e?this.boneIndex(e[0]):0);this.sw.push(e?e[1]/sum:0);}
  }
  if(g.index)for(let i=0;i<g.index.count;i++)this.idx.push(base+g.index.getX(i));else for(let i=0;i<p.count;i++)this.idx.push(base+i);
  geometry.dispose();
 }
 geometry(){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.nor,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.col,3));g.setAttribute('outline',new THREE.Float32BufferAttribute(this.line,1));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(this.si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(this.sw,4));
  g.setIndex(this.idx);g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
}
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// 가운데가 center, 반지름 radii인 타원체. q로 돌린다.
// 법선은 타원체 식에서 바로 구한다(구의 이음매·극점에 음영 줄이 생기지 않게).
function ellipsoid(center,radii,{q=null,w=16,h=12,shape=null}={}){
 const g=new THREE.SphereGeometry(1,w,h),p=g.attributes.position,n=g.attributes.normal,V=new Vector3(),Nn=new Vector3();
 for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);if(shape)shape(V);Nn.set(V.x/radii.x,V.y/radii.y,V.z/radii.z);V.multiply(radii);if(q){V.applyQuaternion(q);Nn.applyQuaternion(q);}V.add(center);p.setXYZ(i,V.x,V.y,V.z);Nn.normalize();n.setXYZ(i,Nn.x,Nn.y,Nn.z);}
 return g;
}
// a→b 원뿔대(끝 반지름 r0·r1). 끝은 열어 두고 관절 구로 덮는다.
function tube(a,b,r0,r1,{radial=12,rings=3,squash=1}={}){
 const d=b.clone().sub(a),len=d.length(),g=new THREE.CylinderGeometry(r1,r0,len,radial,rings,true);
 g.scale(1,1,squash);g.translate(0,len/2,0);
 g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),d.normalize()));g.translate(a.x,a.y,a.z);return g;
}
// 높이별 타원 단면을 이어 만든 몸통(재킷). rings: [y, rx, rz, zc]
// 이음매는 등 뒤에 두고, 이음매 양쪽 법선을 평균해 줄이 보이지 않게 한다.
function loft(rings,{radial=20}={}){
 const pos=[],idx=[];
 rings.forEach(([y,rx,rz,zc])=>{for(let k=0;k<=radial;k++){const a=Math.PI+k/radial*Math.PI*2;pos.push(Math.sin(a)*rx,y,zc+Math.cos(a)*rz);}});
 for(let r=0;r<rings.length-1;r++)for(let k=0;k<radial;k++){const a=r*(radial+1)+k,b=a+radial+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 const n=g.attributes.normal,M=new Vector3();
 for(let r=0;r<rings.length;r++){const a=r*(radial+1),b=a+radial;M.set(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();n.setXYZ(a,M.x,M.y,M.z);n.setXYZ(b,M.x,M.y,M.z);}
 return g;
}

// 뼈 하나에 붙는 조각
const on=name=>[[name,1]];

export function buildToonHikerGltf(base){
 const src=base.scene;src.updateMatrixWorld(true);
 const hips0=src.getObjectByName('mixamorigHips'),rig0=hips0.parent;
 const scene=new THREE.Group();scene.name='ToonHiker';
 const rig=new THREE.Object3D();rig.name='ToonHikerRig';rig.position.copy(rig0.position);rig.quaternion.copy(rig0.quaternion);rig.scale.copy(rig0.scale);
 const hips=hips0.clone(true);rig.add(hips);scene.add(rig);
 const bones=[],byName=new Map();hips.traverse(o=>{if(o.isBone){bones.push(o);byName.set(o.name,o);}});
 // 1) 뼈 길이를 링크 비율로
 for(const b of bones){if(b===hips)b.position.multiplyScalar(HIPS_SCALE);else b.position.multiplyScalar(boneScale(b.name));}
 const restQ=new Map(bones.map(b=>[b,b.quaternion.clone()])),restP=new Map(bones.map(b=>[b,b.position.clone()]));
 scene.updateMatrixWorld(true);
 const B=n=>byName.get('mixamorig'+n),W=n=>B(n).getWorldPosition(new Vector3());
 const boneIndex=n=>{const i=bones.indexOf(B(n));if(i<0)throw new Error(`뼈 없음: ${n}`);return i;};

 // 2) 몸(재킷·배낭·바지·팔·손·머리)과 등산화. 바인드 자세 = 지금 뼈 자세(앞 +Z, 왼쪽 +X).
 const body=new Parts(boneIndex),boots=new Parts(boneIndex),C=PALETTE;
 const hipsY=W('Hips').y,spineChain=['Hips','Spine','Spine1','Spine2'].map(n=>[n,W(n).y]);
 // 높이에 따라 골반~가슴 뼈 사이를 선형으로 나눈다(굽힐 때 몸통이 부드럽게 휜다).
 const trunk=y=>{
  if(y>=spineChain[3][1])return [['Spine2',1]];
  for(let i=0;i<3;i++){const [a,ya]=spineChain[i],[b,yb]=spineChain[i+1];if(y<yb){const t=THREE.MathUtils.clamp((y-ya)/(yb-ya),0,1);return [[a,1-t],[b,t]];}}
  return [['Hips',1]];
 };
 // 바람막이(엉덩이를 덮는 긴 재킷): 링크 튜닉처럼 어깨에서 허리까지 곧고 아래로 조금 퍼진다. 어깨 요크·깃·밑단은 남색 배색.
 // 아랫단은 골반에 붙고, 아래로 갈수록 같은 쪽 허벅지를 따라간다.
 const hemY=LINK_BODY.hem*LINK_BODY.height+.035,beltY=LINK_BODY.belt*LINK_BODY.height,skirtTop=beltY-.1;
 const tunicWeights=V=>{if(V.y>skirtTop)return trunk(V.y);const a=smooth(skirtTop,hemY,V.y)*.5,l=a*smooth(-.03,.07,V.x),r=a*smooth(.03,-.07,V.x);return [['Hips',1-l-r],['LeftUpLeg',l],['RightUpLeg',r]];};
 const shoulderY=W('LeftArm').y,neckY=W('Neck').y;
 // 단면 [높이, 반폭, 반두께, 앞뒤 중심, 색]. 같은 높이 단면을 두 번 넣어 색 경계(요크·밑단 띠)를 또렷하게 한다.
 // 목 밑에서 어깨 끝까지 승모 선이 곧게 비스듬히 내려오고(공 모양 어깨 없음), 겨드랑이부터 허리띠까지 곧다.
 const ay=W('LeftArm').y,ax=W('LeftArm').x;
 const tunicRings=[[neckY+.07,.064,.062,.012,C.jacketDark],[neckY+.045,.074,.068,.008,C.jacketDark],[neckY+.015,.105,.077,0,C.jacketDark],
  [ay+.045,.15,.088,0,C.jacketDark],[ay+.02,ax-.005,.094,0,C.jacketDark],[ay-.025,ax-.02,.098,0,C.jacketDark],[ay-.07,.168,.1,.004,C.jacketDark],[ay-.07,.168,.1,.004,C.jacket],[ay-.15,.162,.1,.008,C.jacket],[1.0,.156,.097,.01,C.jacket],
  [beltY+.04,.152,.095,.005,C.jacket],[beltY,.15,.094,.003,C.jacket],[beltY-.05,.16,.1,0,C.jacket],[hemY+.08,.182,.114,0,C.jacket],[hemY+.03,.19,.12,0,C.jacket],[hemY+.03,.19,.12,0,C.jacketDark],[hemY+.003,.192,.121,0,C.jacketDark],[hemY,.184,.115,0,C.jacketDark],[hemY+.02,.165,.1,0,C.jacketDark]];
 body.add(loft(tunicRings),(V,i)=>tunicRings[Math.floor(i/21)][4],tunicWeights);
 // 작은 배낭(등)과 어깨끈. 배낭은 둥근 상자, 끈은 어깨를 넘어 가슴 앞으로 내려온다.
 {const box=V=>{V.x=Math.sign(V.x)*Math.pow(Math.abs(V.x),.55);V.y=Math.sign(V.y)*Math.pow(Math.abs(V.y),.55);V.z=Math.sign(V.z)*Math.pow(Math.abs(V.z),.7);};
  const packW=V=>{const t=smooth(.98,1.16,V.y);return [['Spine1',1-t],['Spine2',t]];};
  body.add(ellipsoid(new Vector3(0,1.07,-.152),new Vector3(.125,.16,.058),{w:14,h:12,shape:box}),C.pack,packW);
  body.add(ellipsoid(new Vector3(0,1.2,-.157),new Vector3(.118,.035,.062),{w:12,h:6,shape:box}),C.packDark,packW);
  body.add(ellipsoid(new Vector3(0,1.0,-.207),new Vector3(.08,.06,.014),{w:10,h:6,shape:box}),C.packDark,packW);
  for(const s of [-1,1]){const pts=[[.075,1.2,-.13],[.085,1.3,-.06],[.09,1.31,.02],[.095,1.24,.1],[.105,1.1,.112],[.11,.99,.105]].map(([x,y,z])=>new Vector3(s*x,y,z));
   for(let k=0;k<pts.length-1;k++)body.add(tube(pts[k],pts[k+1],.014,.014,{radial:6,rings:1,squash:.5}),C.strap,V=>trunk(V.y),.5);}
  body.add(ellipsoid(new Vector3(0,1.12,.112),new Vector3(.09,.01,.01),{w:8,h:4}),C.strap,trunk(1.12),.5);}
 // 목·머리
 const headB=W('Head'),neckB=W('Neck'),top=LINK_BODY.height,headH=top/LINK_BODY.headRatio,chin=top-headH;
 body.add(tube(neckB,headB.clone().add(new Vector3(0,.06,0)),.054,.05),C.skin,V=>{const t=smooth(neckB.y,headB.y+.06,V.y);return [['Neck',1-t],['Head',t]];});
 const face={c:new Vector3(0,chin+.14,.012),r:new Vector3(.118,.15,.12)};
 // 얼굴: 턱 쪽이 좁아지는 타원체
 body.add(ellipsoid(face.c,face.r,{w:24,h:18,shape:V=>{if(V.y<0){V.x*=1-.22*(-V.y);V.z*=1-.08*(-V.y);}}}),C.skin,on('Head'));
 const faceZ=(x,y)=>{const u=x/face.r.x,v=(y-face.c.y)/face.r.y,s=1-u*u-v*v;return face.c.z+face.r.z*Math.sqrt(Math.max(0,s));};
 const onFace=(x,y,radii,color,lift=0)=>{const z=faceZ(x,y),q=new Quaternion().setFromEuler(new THREE.Euler(-(y-face.c.y)/face.r.y*.6,Math.atan2(x,face.r.z)*1.1,0));body.add(ellipsoid(new Vector3(x,y,z-.002+lift),radii,{q,w:10,h:8}),color,on('Head'),0);};
 // 점눈·눈썹·코·입·볼(링크와 다른 단순한 얼굴)
 const eyeY=chin+.135;
 for(const s of [-1,1]){onFace(s*.042,eyeY,new Vector3(.013,.019,.006),C.eye);onFace(s*.042+.004,eyeY+.007,new Vector3(.004,.004,.003),C.white,.004);
  onFace(s*.046,eyeY+.042,new Vector3(.019,.0045,.004),C.hair);onFace(s*.068,eyeY-.045,new Vector3(.015,.008,.003),C.blush);}
 onFace(0,eyeY-.03,new Vector3(.011,.012,.01),C.skinShade);onFace(0,eyeY-.068,new Vector3(.016,.0045,.004),C.mouth);
 // 둥근 사람 귀
 for(const s of [-1,1])body.add(ellipsoid(new Vector3(s*.104,eyeY-.005,-.005),new Vector3(.016,.028,.02),{w:10,h:8}),C.skin,on('Head'));
 // 머리카락: 위·뒤·옆을 덮는 모자형. 얼굴 앞쪽 꼭짓점은 머리 안으로 넣어 숨긴다. 앞머리는 아래로 뾰족한 다발.
 {const hc=face.c.clone().add(new Vector3(0,.016,-.012)),hr=new Vector3(.13,.142,.136);
  const g=new THREE.SphereGeometry(1,24,18),p=g.attributes.position,V=new Vector3();
  for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);const keep=V.y>.3||V.z<-.05&&V.y>-.85||Math.abs(V.x)>.72&&V.y>-.1&&V.z<.35;
   const k=keep?1:.82;p.setXYZ(i,hc.x+V.x*hr.x*k,hc.y+V.y*hr.y*k,hc.z+V.z*hr.z*k);}
  g.computeVertexNormals();body.add(g,C.hair,on('Head'));
  for(let i=0;i<7;i++){const a=(i-3)/3*.95,x=Math.sin(a)*.1,y=hc.y+.075-Math.abs(i-3)*.006,z=hc.z+Math.cos(a)*.112;
   const cone=new THREE.ConeGeometry(.032,.085-Math.abs(i-3)*.006,6);cone.rotateX(Math.PI);cone.rotateZ(-a*.35);cone.rotateX(-.35);cone.rotateY(a);cone.translate(x,y-.03,z);body.add(cone,C.hair,on('Head'));}
  for(let i=1;i<4;i++){const a=Math.PI+(i-2)*.45,cone=new THREE.ConeGeometry(.045,.08,6);cone.rotateX(Math.PI+.12);cone.rotateY(a);cone.translate(Math.sin(a)*.11,hc.y-.09,hc.z+Math.cos(a)*.11);body.add(cone,C.hair,on('Head'));}}
  // 팔: 긴소매 바람막이(어깨는 요크 색) → 남색 소매 끝단 → 손가락 없는 장갑
 for(const side of ['Left','Right']){
  const arm=W(side+'Arm'),fore=W(side+'ForeArm'),hand=W(side+'Hand'),mid=W(side+'HandMiddle1');
  body.add(ellipsoid(arm.clone().add(new Vector3(0,-.012,0)),new Vector3(.049,.038,.049),{w:12,h:8}),C.jacketDark,[['Spine2',.4],[side+'Arm',.6]]);
  const yoke=arm.clone().lerp(fore,.22);body.add(tube(arm,yoke,.048,.045),C.jacketDark,on(side+'Arm'));body.add(tube(yoke,fore,.045,.04),C.jacket,on(side+'Arm'));
  body.add(ellipsoid(fore,new Vector3(.04,.04,.04),{w:10,h:8}),C.jacket,[[side+'Arm',.5],[side+'ForeArm',.5]]);
  const cuff=fore.clone().lerp(hand,.82);body.add(tube(fore,cuff,.04,.037),C.jacket,on(side+'ForeArm'));body.add(tube(cuff,hand.clone().lerp(fore,-.05),.043,.043),C.jacketDark,on(side+'ForeArm'));
   const hq=new Quaternion().setFromUnitVectors(new Vector3(0,1,0),mid.clone().sub(hand).normalize());
  body.add(ellipsoid(hand.clone().lerp(mid,.55),new Vector3(.04,.05,.021),{q:hq,w:10,h:8}),C.glove,on(side+'Hand'));
  for(const f of ['Thumb','Index','Middle','Ring','Pinky']){
   const ch=[1,2,3].map(n=>B(`${side}Hand${f}${n}`)).filter(Boolean);if(!ch.length)continue;
   const pts=ch.map(b=>b.getWorldPosition(new Vector3()));pts.push(pts[2].clone().add(pts[2].clone().sub(pts[1]).multiplyScalar(.9)));
   for(let k=0;k<3;k++)body.add(tube(pts[k],pts[k+1],f==='Thumb'?.012:.0105,.0095,{radial:6,rings:1}),k===0?C.glove:C.skin,on(ch[k].name.replace('mixamorig','')),.35);
   body.add(ellipsoid(pts[3],new Vector3(.0095,.0095,.0095),{w:6,h:4}),C.skin,on(ch[2].name.replace('mixamorig','')),.35);
  }
 }
 // 다리: 등산 바지(긴바지) → 목 짧은 등산화(따로 'Boots' 메시: 등산객 접지 코드가 이 꼭짓점 바닥으로 땅에 붙인다)
 body.add(ellipsoid(new Vector3(0,hipsY-.07,0),new Vector3(.135,.08,.095),{w:14,h:10}),C.pants,V=>{const l=smooth(-.02,.1,V.x)*.5,r=smooth(.02,-.1,V.x)*.5;return [['Hips',1-l-r],['LeftUpLeg',l],['RightUpLeg',r]];});
 const bootTopY=LINK_BODY.bootTop*LINK_BODY.height;
 for(const side of ['Left','Right']){
  const up=W(side+'UpLeg'),knee=W(side+'Leg'),ankle=W(side+'Foot'),toe=W(side+'ToeBase');
  body.add(tube(up.clone().add(new Vector3(0,-.03,0)),knee,.075,.06),C.pants,V=>{const t=smooth(knee.y+.06,knee.y,V.y);return [[side+'UpLeg',1-t*.5],[side+'Leg',t*.5]];});
  body.add(ellipsoid(knee,new Vector3(.06,.06,.06),{w:10,h:8}),C.pants,[[side+'UpLeg',.5],[side+'Leg',.5]]);
  const shinTop=knee.clone().lerp(ankle,THREE.MathUtils.clamp((knee.y-bootTopY)/(knee.y-ankle.y),0,1));
  body.add(tube(knee,shinTop.clone().add(new Vector3(0,.03,0)),.058,.056),C.pants,on(side+'Leg'));
  // 바짓단: 등산화 목 위에 살짝 넓게 얹힌다
  body.add(tube(shinTop.clone().add(new Vector3(0,.005,0)),shinTop.clone().add(new Vector3(0,.035,0)),.064,.06,{radial:14,rings:1}),C.pants,on(side+'Leg'));
  boots.add(tube(shinTop,ankle.clone().add(new Vector3(0,-.01,0)),.068,.06,{radial:14,rings:4}),C.boot,V=>{const t=smooth(ankle.y+.06,ankle.y,V.y);return [[side+'Leg',1-t],[side+'Foot',t]];});
  // 등산화 목의 도톰한 패드
  boots.add(tube(shinTop.clone().add(new Vector3(0,-.04,0)),shinTop.clone().add(new Vector3(0,.012,0)),.072,.08,{radial:14,rings:1}),C.bootCollar,on(side+'Leg'));
  // 발: 둥글고 큰 앞부리, 두꺼운 밑창, 바닥은 평평(y=0). 뒤꿈치는 발목 뒤 7cm, 앞부리는 발목 앞 20cm.
  const fwd=new Vector3(toe.x-ankle.x,0,toe.z-ankle.z).normalize(),yaw=Math.atan2(fwd.x,fwd.z),fq=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),yaw);
  const fc=ankle.clone().addScaledVector(fwd,.065);fc.y=.05;
  boots.add(ellipsoid(fc,new Vector3(.068,.064,.14),{q:fq,w:20,h:14,shape:V=>{if(V.z>0)V.y*=1-.25*V.z;}}),V=>V.y<.024?C.sole:C.boot,on(side+'Foot'));
  boots.add(ellipsoid(ankle.clone().add(new Vector3(0,-.005,0)),new Vector3(.062,.055,.066),{w:12,h:8}),C.boot,on(side+'Foot'));
  // 끈: 발등에 밝은 끈 세 줄
  for(let k=0;k<3;k++){const c=ankle.clone().addScaledVector(fwd,.045+k*.03);c.y=.098-k*.016;boots.add(ellipsoid(c,new Vector3(.03,.006,.008),{q:fq,w:8,h:4}),C.lace,on(side+'Foot'),0);}
 }
 // 발바닥 평평하게: 0 아래 꼭짓점은 0으로
 for(let i=1;i<boots.pos.length;i+=3)if(boots.pos[i]<0)boots.pos[i]=0;
 const skeleton=new THREE.Skeleton(bones);
 const material=(name)=>new THREE.MeshStandardMaterial({name,vertexColors:true,roughness:.85,metalness:0});
 const bodyMesh=new THREE.SkinnedMesh(body.geometry(),material('toon_hiker_body'));bodyMesh.name='ToonHiker_Body';
 const bootMesh=new THREE.SkinnedMesh(boots.geometry(),material('toon_hiker_boots'));bootMesh.name='ToonHiker_boots';
 for(const m of [bodyMesh,bootMesh]){scene.add(m);m.bind(skeleton,new THREE.Matrix4());}
 // 외곽선: 카툰 화면의 낮 외곽선은 꺼져 있어(palette outline.strength.day=0) 캐릭터만 뒤집은 껍질로 얇은 선을 긋는다.
 // 같은 형상·뼈대를 쓰고 바인드 공간 법선 방향으로 밀어낸 뒷면만 그린다. MeshToonMaterial이라 toonify가 바꾸지 않는다.
 const line=new THREE.MeshToonMaterial({name:'toon_hiker_outline',color:LINE_COLOR,side:THREE.BackSide});
 line.onBeforeCompile=sh=>{sh.uniforms.lineWidth={value:LINE_WIDTH};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float outline;uniform float lineWidth;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normalize(normal)*lineWidth*outline;');};
 line.customProgramCacheKey=()=>'toon-hiker-outline-v1';
 for(const [m,name] of [[bodyMesh,'ToonHiker_lineA'],[bootMesh,'ToonHiker_lineB']]){const o=new THREE.SkinnedMesh(m.geometry,line);o.name=name;o.userData.outline=true;scene.add(o);o.bind(skeleton,new THREE.Matrix4());}

 // 3) 동작: 원본 둘러보기·계단·바위는 뼈 오프셋 트랙만 같은 배율로 줄여 쓴다. Walk·Run은 새로 만든다.
 const scaled=base.animations.filter(c=>['Stairs','Rock'].includes(c.name)).map(c=>{
  const clip=c.clone();
  for(const t of clip.tracks){const m=/^(.*)\.position$/.exec(t.name);if(!m)continue;const k=m[1]==='mixamorigHips'?HIPS_SCALE:boneScale(m[1]);t.values=t.values.map(v=>v*k);}
  return clip;});
 const pose=createPoser({bones,restQ,restP,B,W,scene});
 const geometry={heel:-.01,ball:.14,ankle:W('LeftFoot').y};
 const walk=gaitClip('Walk',pose,GAIT_SHAPE.walk,geometry),run=gaitClip('Run',pose,GAIT_SHAPE.run,geometry),look=lookClip(pose,geometry);
 pose.reset();
 // 4) 등산객 코드가 쓰는 치수(머리 뼈 기준 눈·입, 가슴 높이, 앉은 자세)
 const headBone=B('Head');scene.updateMatrixWorld(true);
 const eyeLocal=headBone.worldToLocal(new Vector3(0,eyeY,faceZ(0,eyeY)-.005)),mouthLocal=headBone.worldToLocal(new Vector3(0,eyeY-.068,faceZ(0,eyeY-.068)-.012));
 scene.userData.hikerProfile={kind:'link',chestY:1.08,chestFront:null,chestMesh:'ToonHiker_Body',eyeLocal:eyeLocal.toArray(),mouthLocal:mouthLocal.toArray(),
  animSteps:{walk:GAIT_SHAPE.walk.step,run:GAIT_SHAPE.run.step,climb:.6336*BONE_SCALE.Leg},runStride:1,strideScale:{...TOON_STRIDE},runSpeed:TOON_RUN_SPEED,seat:{hipAbove:.1,footX:.16,footZ:-.48},dressable:false};
 return {scene,animations:[look,...scaled,walk,run]};
}

// 걷기·뛰기 모양(앞 +Z 기준, m·도). step: 이 클립의 한 걸음 길이. stance: 한 발이 땅에 있는 비율.
// lean은 넣는 값이고, 바인드 자세 등뼈 굽음 때문에 골반→목 기울기로 재면 걷기 4.1°·뛰기 14.7°가 된다(참고 3~5°·약 15°).
// 걷기: 0.36H 보폭, 디딤 60%(두 발 지지 있음), 뒤꿈치 착지(발끝 12° 들림)·발끝 떼기(30°), 발 들림 7cm.
// 뛰기: 0.60H 보폭, 디딤 30%(공중 구간), 고개는 덜 숙임, 뒤꿈치가 엉덩이 쪽으로 차오르고(최고 약 35cm)
//  무릎을 끌어올려 착지점보다 20cm 더 내밀었다가 디딘다(떼고 나서는 13cm 더 뒤로 뻗는다).
export const GAIT_SHAPE=Object.freeze({
 walk:{step:.61,stance:.6,strike:12,toeOff:30,lift:.07,kick:0,lean:5,headBack:2,shift:.05,yaw:6,roll:2,bob:.012,crouch:.012,twist:1.6,lowAt:'double'},
 run:{step:1.02,stance:.3,reach:.2,back:.13,strike:6,toeOff:42,lift:.06,kick:.30,lean:19.5,headBack:6,shift:0,yaw:9,roll:3,bob:.025,crouch:.018,twist:1.8,lowAt:'mid'},
});
function createPoser({bones,restQ,restP,B,W,scene}){
 const q1=new Quaternion(),q2=new Quaternion(),q3=new Quaternion();
 const turn=(b,axis,angle)=>{if(!angle)return;q1.setFromAxisAngle(axis,angle);b.getWorldQuaternion(q2);q2.premultiply(q1);b.parent.getWorldQuaternion(q3);b.quaternion.copy(q3.invert().multiply(q2));b.updateMatrixWorld(true);};
 const aim=(b,from,to)=>{q1.setFromUnitVectors(from.normalize(),to.normalize());b.getWorldQuaternion(q2);q2.premultiply(q1);b.parent.getWorldQuaternion(q3);b.quaternion.copy(q3.invert().multiply(q2));b.updateMatrixWorld(true);};
 const reset=()=>{for(const b of bones){b.quaternion.copy(restQ.get(b));b.position.copy(restP.get(b));}scene.updateMatrixWorld(true);};
 reset();
 const footRest=['Left','Right'].map(s=>B(s+'Foot').getWorldQuaternion(new Quaternion()));
 const hipJoint=['Left','Right'].map(s=>W(s+'UpLeg')),hipsY=W('Hips').y;
 const legLen=W('LeftUpLeg').distanceTo(W('LeftLeg'))+W('LeftLeg').distanceTo(W('LeftFoot'));
 return {bones,B,W,turn,aim,reset,footRest,hipJoint,hipsY,legLen,scene};
}
const X=new Vector3(1,0,0),Y=new Vector3(0,1,0),Z=new Vector3(0,0,1);
// 한 발의 위상 φ(0=뒤꿈치 착지)에서 발목 위치(엉덩이 관절 기준 앞뒤 z, 땅 위 y)와 발 들림각(+는 발끝 위).
function footAt(phi,S,g){
 const T=2*S.step*S.stance,front=T/2-S.shift; // 디딤 동안 뒤꿈치 닿은 점이 몸 기준으로 뒤로 T만큼 밀린다
 const a=g.ankle,heelArm={z:-g.heel,y:a},ballArm={z:-g.ball,y:a}; // 닿는 점 → 발목
 const rot=(arm,deg)=>{const r=THREE.MathUtils.degToRad(deg),c=Math.cos(r),s=Math.sin(r);return {z:arm.z*c-arm.y*s,y:arm.z*s+arm.y*c};}; // +deg: 발끝 위(뒤꿈치 기준 회전)
 const contactPose=(u)=>{ // 디딤 0~1
  const anchor=front-T*u;
  if(u<.14){const k=S.strike*(1-u/.14),p=rot(heelArm,k);return {z:anchor+p.z,y:p.y,pitch:k};}
  const roll=smooth(.62,1,u);if(roll<=0)return {z:anchor+heelArm.z,y:a,pitch:0};
  const pitch=-S.toeOff*roll,p=rot(ballArm,pitch); // 뒤꿈치가 들리면 앞꿈치(anchor+앞꿈치 거리)를 축으로 돈다
  return {z:anchor+g.ball-g.heel+p.z,y:p.y,pitch};
 };
 if(phi<S.stance)return contactPose(phi/S.stance);
 const u=(phi-S.stance)/(1-S.stance),off=contactPose(1),on=contactPose(0);
 const e=u*u*(3-2*u),ez=S.kick?smooth(.18,1,u):e;
 let z=THREE.MathUtils.lerp(off.z,on.z,ez),y=THREE.MathUtils.lerp(off.y,on.y,e)+S.lift*Math.sin(Math.PI*u);
 // 뛰기: 떼고 나서 뒤꿈치가 엉덩이 쪽으로 차오른다(뒤로 조금 더 갔다가 앞으로).
 if(S.kick){const k=Math.sin(Math.PI*Math.min(1,u/.7));y+=S.kick*k*k;z-=(S.back??.06)*Math.sin(Math.PI*Math.min(1,u/.5));
  // 무릎을 앞으로 끌어올려 발을 착지점보다 조금 더 내밀었다가 당겨 디딘다(13_09·13_13).
  const r=smooth(.45,.8,u)*(1-smooth(.85,1,u));z+=(S.reach??0)*r;y+=.05*r;}
 const pitch=S.kick?THREE.MathUtils.lerp(off.pitch,on.pitch,smooth(.55,1,u))-25*Math.sin(Math.PI*Math.min(1,u/.6)):THREE.MathUtils.lerp(off.pitch,on.pitch,e);
 return {z,y,pitch};
}
function gaitClip(name,P,S,g){
 const N=32,deg=THREE.MathUtils.degToRad;
 // 엉덩이 높이: 기본(살짝 굽힘) + 출렁임, 그리고 디딘 발에 다리가 닿도록 낮춘다. 그다음 주기 평균으로 부드럽게.
 const hipJ=P.hipJoint[0].y,reach=P.legLen*.985,raw=[];
 for(let i=0;i<N;i++){const t=i/N;let y=hipJ-S.crouch+(S.lowAt==='mid'?-S.bob*Math.cos(4*Math.PI*(t-S.stance/2)):S.bob*Math.cos(4*Math.PI*(t-S.stance/2)));
  for(const k of [0,1]){const f=footAt((t+k*.5)%1,S,g);if((t+k*.5)%1<S.stance)y=Math.min(y,f.y+Math.sqrt(Math.max(0,reach*reach-f.z*f.z)));}
  raw.push(y);}
 const hipY=raw.map((_,i)=>(raw[(i+N-1)%N]+2*raw[i]+raw[(i+1)%N])/4);
 return bakeClip(name,1,N,P,(t,i)=>{const yaw=-deg(S.yaw)*Math.cos(2*Math.PI*t);
  return {hipY:hipY[i%N],yaw,roll:deg(S.roll)*Math.sin(2*Math.PI*t),lean:deg(S.lean),twist:-yaw*S.twist,headBack:deg(S.headBack),headYaw:yaw*(S.twist-1)*.8,feet:[0,1].map(k=>footAt((t+k*.5)%1,S,g))};});
}
// 서기(둘러보기): 곧게 서서 숨 쉬고(4초 주기) 고개를 천천히 좌우로 돌린다(7.5초). 실사 Look 클립은 배낭 멘 자세라 등이 굽어 쓰지 않는다.
function lookClip(P,g){
 const N=60,D=7.5,deg=THREE.MathUtils.degToRad,hipJ=P.hipJoint[0].y;
 return bakeClip('Look',D,N,P,t=>{const sec=t*D,breath=Math.sin(2*Math.PI*sec/3.75);
  const look=Math.sin(2*Math.PI*t)*.8+Math.sin(4*Math.PI*t+.6)*.2;
  return {hipY:hipJ-.008+breath*.002,yaw:0,roll:0,lean:deg(1.5)+breath*deg(.6),twist:deg(4)*look,headBack:deg(1)-breath*deg(.4),headYaw:deg(22)*look,feet:[{z:.01,y:g.ankle,pitch:0},{z:-.02,y:g.ankle,pitch:0}]};});
}
const POSED=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','RightShoulder','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
// 프레임마다 바인드 자세에서 출발해 월드 축 회전을 쌓고(골반 → 상체 → 고개 → 다리 IK) 뼈 로컬 회전을 기록한다.
function bakeClip(name,duration,N,P,specAt){
 const tracks=new Map(),track=(b,kind)=>{const key=`${b.name}.${kind}`;if(!tracks.has(key))tracks.set(key,[]);return tracks.get(key);};
 const posed=POSED.map(P.B),hipJ=P.hipJoint[0].y,deg=THREE.MathUtils.degToRad;
 for(let i=0;i<=N;i++){
  const t=(i%N)/N,S=specAt(t,i);P.reset();
  const hips=P.B('Hips');
  // 골반: 높이·비틀기(내딛는 다리 쪽 엉덩이가 앞으로)·좌우 기울기
  const local=hips.parent.worldToLocal(hips.getWorldPosition(new Vector3()).add(new Vector3(0,S.hipY-hipJ,0)));hips.position.copy(local);hips.updateMatrixWorld(true);
  P.turn(hips,Y,S.yaw);P.turn(hips,Z,S.roll);P.turn(hips,X,S.lean*.3);
  // 상체: 앞으로 기울이고(골반 30%·허리 70%) 어깨는 골반과 반대로 비튼다. 고개는 덜 숙여 앞을 본다.
  for(const n of ['Spine','Spine1','Spine2']){const b=P.B(n);P.turn(b,X,S.lean*.7/3);P.turn(b,Y,S.twist/3);}
  P.turn(P.B('Neck'),X,-S.headBack*.4);P.turn(P.B('Head'),X,-S.headBack*.6);P.turn(P.B('Neck'),Y,S.headYaw*.4);P.turn(P.B('Head'),Y,S.headYaw*.6);
  // 다리: 발목 목표와 발 각도 → 두 관절 IK(무릎은 앞)
  ['Left','Right'].forEach((s,k)=>{const f=S.feet[k],up=P.B(s+'UpLeg'),knee=P.B(s+'Leg'),foot=P.B(s+'Foot');
   const A=up.getWorldPosition(new Vector3()),Kn=knee.getWorldPosition(new Vector3()),F=foot.getWorldPosition(new Vector3());
   const target=new Vector3(P.hipJoint[k].x*.92,f.y,P.hipJoint[k].z+f.z);
   const sol=legTargets(A,target,A.distanceTo(Kn),Kn.distanceTo(F),Z.clone());
   P.aim(up,Kn.clone().sub(A),sol.knee.clone().sub(A));
   const Kn2=knee.getWorldPosition(new Vector3()),F2=foot.getWorldPosition(new Vector3());P.aim(knee,F2.clone().sub(Kn2),sol.foot.clone().sub(Kn2));
   const fq=new Quaternion().setFromAxisAngle(X,-deg(f.pitch)).multiply(P.footRest[k]);foot.parent.getWorldQuaternion(q0);foot.quaternion.copy(q0.invert().multiply(fq));foot.updateMatrixWorld(true);});
  const time=i/N*duration;
  for(const b of posed){track(b,'quaternion').push([time,...b.quaternion.toArray()]);if(b===hips)track(b,'position').push([time,...b.position.toArray()]);}
 }
 const out=[];
 for(const [key,list] of tracks){const times=list.map(r=>r[0]),values=list.flatMap(r=>r.slice(1));
  out.push(key.endsWith('.position')?new THREE.VectorKeyframeTrack(key,times,values):new THREE.QuaternionKeyframeTrack(key,times,values));}
 return new THREE.AnimationClip(name,duration,out);
}
const q0=new Quaternion();

// 카툰 모드 등산객을 불러온다. 원본 GLB는 뼈대·동작만 쓰고 메시는 버린다.
export async function loadToonHiker(url,options){
 return createRealisticHiker(buildToonHikerGltf(await new GLTFLoader().loadAsync(url)),options);
}
// 함께 걷기(멀티) 아바타도 같은 몸을 쓴다.
export const prepareToonHikerGltf=base=>buildToonHikerGltf(base);
