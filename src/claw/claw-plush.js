// 온라인 인형뽑기 인형 그림(월드아트, 2026-11-23): 우리 캐릭터 인형 8종 + 손님 인형 자리.
// 생김새는 원래 그림(claw-palette.js PLUSH.from)의 색·특징을 따르되, 인형답게 머리가 크고 앉은 자세·짧은 팔다리·이름표(희귀도 색)를 단다.
// 휴대폰 메모리: 인형 한 종은 꼭짓점 색 한 덩어리(그리기 1번) + 외곽선 껍질 1번이고, 형상은 종마다 한 벌만 만들어 나눠 쓴다(약 2천 삼각형).
//  기계 안 인형 더미는 종마다 InstancedMesh 하나라 몇 개를 쌓아도 그리기 횟수가 늘지 않는다. 텍스처 없음.
// 단위: 아래 형상은 높이 1로 만들고, 희귀도 크기(RARITY.size, m)로 줄인다. 앞 +Z, 바닥 y=0(엉덩이가 바닥에 앉음).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {v,smoothGeo,ell as kitEll,capsule,sweep,at,part,surf,smile,omega,grp} from '../toon/concept-kit.js';
import {RARITY,PLUSH,plushInfo} from './claw-palette.js';

// 가벼운 타원체(시안 도우미보다 칸 수를 줄였다)
const E=(r,o={})=>kitEll(r,{w:12,h:8,...o});
const Es=(r,o={})=>kitEll(r,{w:8,h:6,...o});
// 얼굴 부품: 짙은 눈 + 하이라이트 하나, 볼, 입. line 0이라 외곽선 껍질에 안 들어간다.
function face(g,c,r,{eyeYaw=.34,eyePitch=-.08,eye=v(.055,.07,.02),blushYaw=.6,blushPitch=-.3,blush='#f3a08f',mouth='#8a3f33',mouthPitch=-.32,kind='smile'}={}){
 for(const s of [-1,1]){const e=surf(g,c,r,s*eyeYaw,eyePitch,Es(eye),'#2a2321',{lift:-eye.z*.3});
  part(e,at(Es(v(eye.x*.38,eye.y*.32,eye.z*.5),{w:8,h:6}),v(-eye.x*.28,eye.y*.36,eye.z*.75)),'#ffffff',{line:0,shadow:false});
  if(blush)surf(g,c,r,s*blushYaw,blushPitch,Es(v(.06,.032,.012)),blush,{lift:-.004});}
 if(kind==='smile')surf(g,c,r,0,mouthPitch,smile(.03,.008),mouth,{lift:.003});
 else if(kind==='omega')surf(g,c,r,0,mouthPitch,omega(.018,.006),mouth,{lift:.004});
}
// 희귀도 이름표: 옆구리에 달린 둥근 천 표(희귀도 색 + 흰 테). 특별은 별 모양 장식을 더한다.
function tag(g,rarity,p=v(-.25,.2,.12)){
 const R=RARITY[rarity],t=grp(g,p);t.rotation.set(0,-.7,.25);
 part(t,E(v(.085,.085,.018)),'#fffaf0',{line:.5});part(t,at(E(v(.068,.068,.02)),v(0,0,.004)),R.color,{line:0});
 for(let i=0;i<R.stars;i++){const s=part(t,new THREE.OctahedronGeometry(.016,0).scale(1,1,.4),'#fffaf0',{line:0});s.position.set((i-(R.stars-1)/2)*.03,0,.024);}
 part(t,capsule(v(0,.08,0),v(.02,.13,-.02),.008,6),'#fffaf0',{line:0});
}
// 앉은 인형 몸통·다리·팔(동동이 계열). C: 옷 색
function sitBody(g,C,{legs=true}={}){
 if(legs)for(const s of [-1,1]){part(g,at(E(v(.1,.085,.14)),v(s*.12,.085,.1)),C.pants);part(g,at(E(v(.095,.075,.1),{shape:V=>{if(V.y<-.5)V.y=-.5;}}),v(s*.125,.075,.24)),C.boot);}
 part(g,at(E(v(.25,.22,.21),{shape:V=>{if(V.y<0){V.x*=1+.08*-V.y;V.z*=1+.06*-V.y;}}}),v(0,.25,0)),C.body);
 for(const s of [-1,1]){const a=grp(g,v(s*.24,.34,.02));a.rotation.set(-.35,0,s*.5);part(a,at(E(v(.075,.13,.075)),v(0,-.09,0)),C.body);part(a,at(E(v(.07,.07,.07)),v(0,-.2,0)),C.mitt);}
}
const ddHead=(g,C,{hairTop=false}={})=>{const hc=v(0,.68,0),hr=v(.34,.3,.31);
 part(g,at(E(hr,{shape:V=>{if(V.y<0)V.x*=1-.08*V.y*V.y;}}),hc),V=>{const y=(V.y-hc.y)/hr.y,z=(V.z-hc.z)/hr.z;return (z<.15&&y>-.3)||y>(hairTop?.35:.6)?C.hair:C.skin;});
 for(const s of [-1,1])part(g,at(Es(v(.045,.06,.04)),v(s*.335,.66,-.01)),C.skin);
 face(g,hc,hr,{eyeYaw:.32,eyePitch:-.14,blushPitch:-.34,mouthPitch:-.38});return {hc,hr};};

// ── 동동이 3벌(등산·회사원·산타). 색은 concept-kit.js dongdong·hub/dongdong.js 옷과 같다.
function dongdong(outfit){
 const g=new THREE.Group();
 const C={hike:{body:'#f08a3c',pants:'#3b4a7a',boot:'#8d5c35',mitt:'#e5484d'},office:{body:'#f4f1e8',pants:'#2f3542',boot:'#2a2018',mitt:'#f7d9b8'},santa:{body:'#d23b36',pants:'#d23b36',boot:'#2b2a2e',mitt:'#2f7a52'}}[outfit];
 Object.assign(C,{skin:'#f7d9b8',hair:'#5a3a26'});
 sitBody(g,C);
 const {hc}=ddHead(g,C,{hairTop:outfit==='office'});
 if(outfit==='hike'){
  part(g,at(new THREE.TorusGeometry(.17,.055,8,20).rotateX(Math.PI/2),v(0,.43,0)),'#d9473e');
  part(g,at(E(v(.2,.2,.11),{shape:V=>{V.x=Math.sign(V.x)*Math.abs(V.x)**.6;V.y=Math.sign(V.y)*Math.abs(V.y)**.6;}}),v(0,.3,-.22)),'#2fa39a');
  part(g,new THREE.CapsuleGeometry(.05,.24,4,10).rotateZ(Math.PI/2).translate(0,.49,-.24),'#f2c14e',{line:.7});
  const hat=grp(g,v(0,hc.y+.2,0));hat.rotation.x=-.1;
  part(hat,new THREE.CylinderGeometry(.27,.3,.14,20,1,true).translate(0,.07,0),'#c9b07a');part(hat,at(E(v(.27,.05,.27)),v(0,.14,0)),'#c9b07a');
  part(hat,new THREE.CylinderGeometry(.305,.305,.04,20,1,true).translate(0,.03,0),'#d9473e',{line:.6});
  {const c=new THREE.CylinderGeometry(.44,.44,.03,24),p=c.attributes.position;for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getZ(i));if(r>.26)p.setY(i,p.getY(i)-(r-.26)*.35);}part(hat,smoothGeo(c),'#c9b07a');}
 }else if(outfit==='office'){
  // 흰 셔츠 + 남색 넥타이 + 앞머리(hub/dongdong.js office)
  part(g,at(E(v(.035,.13,.02)),v(0,.3,.205)),'#2c3f73',{line:.4});part(g,at(Es(v(.04,.03,.02)),v(0,.44,.19)),'#2c3f73',{line:.4});
  for(const s of [-1,1]){const k=part(g,new THREE.ConeGeometry(.06,.1,3).rotateX(Math.PI/2).scale(1,1,.3),'#ffffff',{line:.5});k.position.set(s*.06,.44,.19);k.rotation.z=s*2.2;}
  surf(g,hc,v(.34,.3,.31),0,.55,E(v(.32,.1,.12)),'#5a3a26',{lift:-.04,roll:.15,line:1});
 }else{
  // 산타: 흰 털 띠·검은 띠·금 고리·흰 목도리·산타 모자(방울)
  part(g,at(new THREE.TorusGeometry(.17,.055,8,20).rotateX(Math.PI/2),v(0,.43,0)),'#f7f2e8');
  part(g,at(new THREE.TorusGeometry(.235,.035,6,24).rotateX(Math.PI/2),v(0,.2,0)),'#2b2a2e',{line:.4});
  part(g,at(E(v(.05,.04,.02)),v(0,.2,.24)),'#e9b949',{line:.4});
  part(g,at(E(v(.03,.12,.015)),v(0,.3,.214)),'#f7f2e8',{line:0});
  for(const s of [-1,1])part(g,at(new THREE.TorusGeometry(.085,.03,6,14).rotateX(Math.PI/2),v(s*.125,.06,.24)),'#f7f2e8',{line:.4});
  const hat=grp(g,v(0,hc.y+.2,0));hat.rotation.set(-.15,0,.2);
  part(hat,new THREE.TorusGeometry(.3,.065,8,22).rotateX(Math.PI/2).translate(0,.03,0),'#f7f2e8');
  {const c=new THREE.ConeGeometry(.29,.4,18,4);c.translate(0,.22,0);const p=c.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+Math.max(0,y-.1)**2*.9);}part(hat,smoothGeo(c),'#d23b36');}
  part(hat,at(E(v(.075,.075,.075)),v(.13,.38,0)),'#f7f2e8');
 }
 return g;
}
// ── 다람쥐(trail-props.js squirrel 색): 큰 S자 꼬리
function squirrel(){
 const g=new THREE.Group(),fur='#b9733b',belly='#f4e1c2',dark='#4a2e1b';
 for(const s of [-1,1])part(g,at(E(v(.09,.07,.13)),v(s*.13,.07,.15)),fur);
 part(g,at(E(v(.22,.24,.2),{shape:V=>{if(V.y<0)V.x*=1+.1*-V.y;}}),v(0,.24,0)),fur);
 surf(g,v(0,.24,0),v(.22,.24,.2),0,-.1,E(v(.13,.15,.03)),belly,{lift:-.01,line:0});
 for(const s of [-1,1]){const a=part(g,E(v(.06,.1,.06)),fur);a.position.set(s*.17,.27,.13);a.rotation.z=s*.4;}
 part(g,sweep([v(0,.08,-.16),v(0,.2,-.36),v(0,.45,-.42),v(0,.7,-.36),v(0,.82,-.2)],u=>(.08+.11*Math.sin(Math.PI*Math.min(u*1.1,1)**.8))*(u>.9?Math.sqrt(Math.max(0,1-(u-.9)/.1)):1),{radial:10,rings:18}),V=>V.y>.72?'#e3a564':fur);
 const hc=v(0,.62,.02),hr=v(.27,.24,.24);part(g,at(E(hr),hc),fur);
 for(const s of [-1,1]){const e=grp(g,v(s*.16,.83,-.01));e.rotation.z=-s*.3;part(e,at(Es(v(.06,.09,.035),{shape:V=>{if(V.y>0)V.x*=1-.45*V.y;}}),v(0,.05,0)),fur);part(e,at(Es(v(.035,.055,.01)),v(0,.05,.026)),'#f2b3a6',{line:0});}
 surf(g,hc,hr,0,-.32,E(v(.12,.08,.06)),belly,{lift:-.02,line:.4});
 surf(g,hc,hr,0,-.18,Es(v(.025,.018,.015)),dark,{lift:.01});
 face(g,hc,hr,{eyeYaw:.38,eyePitch:.02,blushPitch:-.25,mouthPitch:-.4,kind:'omega',mouth:dark});
 tag(g,'common');return g;
}
// ── 산토끼(trail-props.js hare 색): 긴 귀
function hare(){
 const g=new THREE.Group(),fur='#a9875a',belly='#f6ead4',inner='#f2b3a6',dark='#3b2c20';
 for(const s of [-1,1])part(g,at(E(v(.08,.06,.15)),v(s*.12,.06,.16)),fur);
 part(g,at(E(v(.21,.22,.19)),v(0,.22,0)),fur);
 surf(g,v(0,.22,0),v(.21,.22,.19),0,-.15,E(v(.12,.14,.03)),belly,{lift:-.01,line:0});
 part(g,at(E(v(.07,.07,.07)),v(0,.12,-.2)),belly);
 for(const s of [-1,1])part(g,at(E(v(.055,.08,.06)),v(s*.15,.22,.14)),fur);
 const hc=v(0,.52,.02),hr=v(.24,.21,.21);part(g,at(E(hr),hc),fur);
 for(const s of [-1,1]){const e=grp(g,v(s*.09,.68,-.02));e.rotation.set(-.15,0,-s*.18);part(e,at(E(v(.06,.17,.035)),v(0,.16,0)),fur);part(e,at(Es(v(.035,.13,.01)),v(0,.16,.028)),inner,{line:0});}
 surf(g,hc,hr,0,-.3,E(v(.1,.07,.05)),belly,{lift:-.02,line:.4});
 surf(g,hc,hr,0,-.15,Es(v(.022,.016,.014)),inner,{lift:.01});
 face(g,hc,hr,{eyeYaw:.4,eyePitch:.02,blushPitch:-.25,mouthPitch:-.38,kind:'omega',mouth:dark});
 tag(g,'common');return g;
}
// ── 까치(trail-props.js magpie 색): 동그란 새 인형, 흰 배·청록 날개 끝·꼬리
function magpie(){
 const g=new THREE.Group(),blk='#1d2333',wht='#f4f4f0',teal='#2f5d7a';
 const bc=v(0,.4,0),br=v(.3,.38,.29);
 part(g,at(E(br,{shape:V=>{if(V.y<-.6)V.y=-.6+(V.y+.6)*.4;}}),bc),V=>{const y=(V.y-bc.y)/br.y,z=(V.z-bc.z)/br.z;return z>-.2&&y<-.12?wht:blk;});
 for(const s of [-1,1]){const w=grp(g,v(s*.28,.4,-.02));w.rotation.z=s*.25;part(w,at(E(v(.06,.2,.15)),v(0,-.04,0)),V=>V.y<-.12?teal:V.y>.04&&V.z>-.06?wht:blk);}
 part(g,new THREE.ConeGeometry(.1,.46,10).scale(1,1,.35).rotateX(-2.4).translate(0,.36,-.4),teal);
 for(const s of [-1,1])part(g,at(Es(v(.05,.03,.08)),v(s*.1,.03,.12)),'#3a3f45',{line:.5});
 part(g,new THREE.ConeGeometry(.05,.13,10).rotateX(Math.PI/2).translate(0,.55,.33),'#3a3f45',{line:.6});
 face(g,v(0,.6,.02),v(.24,.2,.24),{eyeYaw:.42,eyePitch:.05,blushYaw:.62,blushPitch:-.12,kind:'none',eye:v(.045,.06,.02)});
 tag(g,'common',v(-.27,.25,.12));return g;
}
// ── 산고양이(trail-props.js cat 색): 줄무늬·흰 입가·말린 꼬리
function cat(){
 const g=new THREE.Group(),fur='#f0a24a',str='#cf7a2a',white='#fff4e4';
 for(const s of [-1,1])part(g,at(E(v(.08,.065,.13)),v(s*.12,.065,.15)),V=>V.z>.22?white:fur);
 const bc=v(0,.23,0),br=v(.22,.23,.2);part(g,at(E(br),bc),fur);
 surf(g,bc,br,0,-.15,E(v(.12,.14,.03)),white,{lift:-.01,line:0});
 for(const a of [-.9,-1.3,1.3,.9])surf(g,bc,br,a,.15,Es(v(.025,.1,.01)),str,{lift:-.003,line:0});
 for(const s of [-1,1])part(g,at(E(v(.055,.09,.06)),v(s*.16,.22,.14)),fur);
 part(g,sweep([v(.1,.06,-.15),v(.25,.08,-.18),v(.32,.2,-.1),v(.3,.32,.02)],u=>.05*(1-u*.3),{radial:8,rings:12}),V=>V.y>.26?str:fur);
 const hc=v(0,.55,.02),hr=v(.27,.23,.23);part(g,at(E(hr),hc),fur);
 for(const s of [-1,1]){const e=part(g,new THREE.ConeGeometry(.08,.13,4).translate(0,.065,0),fur);e.position.set(s*.16,.72,0);e.rotation.z=-s*.35;e.rotation.y=Math.PI/4;}
 for(const a of [-.25,0,.25])surf(g,hc,hr,a,.6,Es(v(.022,.07,.01)),str,{lift:-.003,line:0});
 surf(g,hc,hr,0,-.3,E(v(.12,.08,.06)),white,{lift:-.02,line:.4});
 surf(g,hc,hr,0,-.17,Es(v(.022,.016,.014)),'#e87a7a',{lift:.01});
 face(g,hc,hr,{eyeYaw:.38,eyePitch:0,blushPitch:-.24,mouthPitch:-.38,kind:'omega',mouth:'#7a3b35'});
 tag(g,'uncommon');return g;
}
// ── 해치(mascot-concepts.js haechi 색): 주홍 갈기·금 뿔·금방울
function haechi(){
 const g=new THREE.Group(),C={body:'#f3e3c3',belly:'#fff4e2',mane:'#e0533a',maneDark:'#b9402c',gold:'#f2b33d',teal:'#2f8f83',nose:'#6b3b2e'};
 for(const s of [-1,1])part(g,at(E(v(.1,.08,.13)),v(s*.13,.08,.13)),C.body);
 const bc=v(0,.25,0),br=v(.26,.23,.22);part(g,at(E(br),bc),C.body);
 surf(g,bc,br,0,-.15,E(v(.15,.13,.03)),C.belly,{lift:-.01,line:0});
 for(const s of [-1,1])surf(g,bc,br,s*1.25,.05,Es(v(.07,.025,.01)),C.teal,{roll:s*.3,lift:-.003});
 part(g,at(new THREE.TorusGeometry(.18,.03,6,20).rotateX(Math.PI/2+.15),v(0,.42,0)),C.teal,{line:.6});
 part(g,at(E(v(.05,.05,.05)),v(0,.37,.2)),C.gold);
 for(const s of [-1,1])part(g,at(E(v(.07,.1,.07)),v(s*.22,.28,.1)),C.body);
 [[0,.12,-.24,.08],[0,.24,-.3,.09],[0,.36,-.26,.075]].forEach(([x,y,z,r])=>part(g,at(Es(v(r,r,r)),v(x,y,z)),C.mane));
 const hc=v(0,.62,0),hr=v(.34,.27,.28);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=Math.cos(a)<-.55?.06:.1;part(g,at(Es(v(r,r,r*.9)),v(Math.sin(a)*.33,hc.y+Math.cos(a)*.26,-.06)),i%2?C.mane:C.maneDark);}
 part(g,at(E(hr,{shape:V=>{if(V.y<0)V.x*=1-.06*V.y*V.y;}}),hc),C.body);
 for(const s of [-1,1]){const e=part(g,Es(v(.07,.04,.045)),C.body);e.position.set(s*.29,.82,-.02);e.rotation.z=s*-.5;}
 part(g,new THREE.ConeGeometry(.045,.12,8).translate(0,.06,0).rotateX(.25).translate(0,.86,.06),C.gold,{line:.8});
 surf(g,hc,hr,0,-.36,E(v(.13,.08,.06)),C.belly,{lift:-.02,line:.4});
 surf(g,hc,hr,0,-.22,Es(v(.04,.025,.02)),C.nose,{lift:.012});
 for(const s of [-1,1])surf(g,hc,hr,s*.36,.2,Es(v(.04,.016,.01)),C.mane,{roll:-s*.25});
 face(g,hc,hr,{eyeYaw:.36,eyePitch:-.06,blushYaw:.66,blushPitch:-.32,blush:'#f2a08a',mouthPitch:-.44,kind:'omega',mouth:C.nose});
 tag(g,'rare');return g;
}
const MAKERS={squirrel,hare,magpie,cat,haechi,dongdong:()=>{const g=dongdong('hike');tag(g,'uncommon');return g;},
 'dongdong-office':()=>{const g=dongdong('office');tag(g,'rare');return g;},'dongdong-santa':()=>{const g=dongdong('santa');tag(g,'special');return g;}};

// ── 형상 한 벌: 색 덩어리(얼굴 포함) + 외곽선용 몸 덩어리. 높이 1로 맞춘다.
const _col=new THREE.Color();
function flatten(root){
 root.updateMatrixWorld(true);const all=[],body=[];
 root.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
  if(!g.index){const n=g.attributes.position.count;g.setIndex([...Array(n).keys()]);}
  if(!g.attributes.color){_col.copy(o.material.color);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_col.r,_col.g,_col.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));}
  if(!g.attributes.normal)g.computeVertexNormals();all.push(g);if(o.userData.line>0)body.push(g);});
 const color=mergeGeometries(all,false),line=mergeGeometries(body.map(g=>{const c=g.clone();c.deleteAttribute('color');return c;}),false);
 all.forEach(g=>g.dispose());
 // 높이 1로(이름표·모자 포함), 바닥 0
 color.computeBoundingBox();const bb=color.boundingBox,k=1/(bb.max.y-bb.min.y);
 for(const g of [color,line]){g.translate(0,-bb.min.y,0);g.scale(k,k,k);g.computeBoundingSphere();g.userData.shared=true;}
 color.computeBoundingBox();return {color,line};
}
const geoCache=new Map();
export const PLUSH_IDS=Object.freeze(PLUSH.map(p=>p.id));
export function plushGeometry(id){
 if(geoCache.has(id))return geoCache.get(id);
 const make=MAKERS[id];if(!make)throw new Error(`인형 형상 없음: ${id}`);
 const root=make(),geo=flatten(root);
 root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
 geoCache.set(id,geo);return geo;
}
export const plushSize=id=>RARITY[plushInfo(id)?.rarity??'common'].size;
// 삼각형 수(검사·메모리 확인용)
export const plushTriangles=id=>plushGeometry(id).color.index.count/3;

// ── 재질(인형 전체가 나눠 씀). toonify로 카툰 재질이 되도록 MeshStandard로 만든다.
let plushMat=null;const lineMats=new Map();
export function plushMaterial(){return plushMat??=Object.assign(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,name:'claw-plush'}),{userData:{shared:true}});}
// 외곽선 껍질: 법선 방향으로 w만큼 밀어낸 뒷면(trail-props.js lineMat과 같은 식, 단위 높이 1 기준이라 인스턴스 크기만큼 같이 줄어든다)
export function plushLineMaterial(w=.016){const k=w.toFixed(4);if(!lineMats.has(k)){const m=new THREE.MeshBasicMaterial({color:'#2e2420',side:THREE.BackSide});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\ntransformed+=normalize(normal)*${k};`);};m.customProgramCacheKey=()=>'claw-plush-line-'+k;m.userData.shared=true;lineMats.set(k,m);}return lineMats.get(k);}

// 인형 하나(집게에 걸린 인형·결과 카드 3D·진열장). toonify를 주면 카툰 재질로 바꾼다. 형상·재질은 공유라 지울 때 dispose하지 않는다.
export function makePlush(id,{toonify=null,outline=true}={}){
 const geo=plushGeometry(id),s=plushSize(id),g=new THREE.Group();g.name=`인형:${id}`;
 const m=new THREE.Mesh(geo.color,plushMaterial());m.castShadow=true;m.receiveShadow=true;m.scale.setScalar(s);g.add(m);
 toonify?.(g,{kind:'character'});
 if(outline){const l=new THREE.Mesh(geo.line,plushLineMaterial());l.userData.outline=true;l.scale.setScalar(s);l.name='outline';g.add(l);}
 g.userData.plushId=id;g.userData.size=s;return g;
}
