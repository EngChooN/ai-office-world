// 온라인 크리스마스 — 동동이 크리스마스 옷(월드아트, 2026-11-16).
// 몸·비율·얼굴·동작은 동동이 그대로 두고 옷만 바꾼다(흡연장 회사원 옷과 같은 방식: src/lounge/outfit.js applyOutfit에 옷 표만 넘긴다).
//  - 기본 옷 3종: 산타 코트 · 노르딕 니트 · 엘프 옷. 옷마다 어울리는 모자가 있다.
//  - 선물로 받아 입는 것 3종(체험설계 §5-2): 산타 모자 · 줄무늬 목도리 · 순록 머리띠. 옷 위에 겹쳐 입는다.
//    머리 칸은 하나다(선물 모자·머리띠를 쓰면 옷 모자 대신 그것을 쓴다). 줄무늬 목도리를 두르면 옷의 목 장식(산타 털 깃) 대신 목도리가 보인다.
// 크리스마스 부품(털 단·허리띠·소매 털·모자·뿔)은 몸통·소매·머리 뼈에 붙는 메시 둘('Xmas_Body'·'Xmas_Head')에 그린다.
// 원본 동동이 파일(link-hiker.js)은 고치지 않는다. 좌표는 link-hiker 바인드 자세(앞 +Z, 왼쪽 +X, 발바닥 0, 키 1.0m).
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {applyOutfit,Kit,TRUNK,surfA,angleAt,trunkRadii,KEYS} from '../lounge/outfit.js';
import {XMAS} from './palette.js';

const {Vector3,Quaternion}=THREE;
const v=(x=0,y=0,z=0)=>new Vector3(x,y,z);
const HAND='#f7d9b8';
// 동동이 등산 장비(배낭·벙거지·쌍안경)는 크리스마스 마을에 들고 오지 않는다.
const HIDE=['ToonHiker_Pack','ToonHiker_linePack','ToonHiker_Hat','ToonHiker_lineHat','Gadget.Binoculars','Gadget.Binoculars.Strap0','Gadget.Binoculars.Strap1'];

// ── 옷 표. colors = 동동이 꼭짓점 색 칸(link-hiker PALETTE 이름) → 새 색, fold = 몸 안으로 접어 넣을 등산복 부품,
//    hat = 기본 모자, body = 몸통·소매 부품(아래 buildBody가 읽음)
export const XMAS_OUTFITS=Object.freeze({
 santa:{label:'산타 코트',desc:'빨간 코트에 하얀 털, 까만 허리띠',hat:'santa',
  colors:{jacket:XMAS.santaRed,pants:XMAS.santaRed,scarf:XMAS.fur,mitten:XMAS.fur,boot:'#2b2321',sole:'#151110'},fold:['zip','strap'],
  body:{hem:XMAS.fur,placket:XMAS.fur,belt:'#2a2523',buckle:XMAS.gold,cuffs:XMAS.fur}},
 sweater:{label:'노르딕 니트',desc:'크림색 니트에 빨강·초록 무늬',hat:'beanie',
  colors:{jacket:XMAS.knitCream,pants:'#3b4a7a',scarf:XMAS.santaRed,mitten:XMAS.santaRed,boot:'#8d5c35',sole:'#3a2a20'},fold:['zip','strap'],
  body:{bands:[[.445,.415,XMAS.santaRed],[.335,.28,XMAS.pine],[.215,.19,XMAS.santaRed]],dots:{y:.3075,color:XMAS.knitCream,n:14},stars:{y:.38,color:XMAS.pine,n:7},cuffs:XMAS.santaRed}},
 elf:{label:'엘프 옷',desc:'초록 웃옷에 뾰족 깃, 방울 모자',hat:'elf',
  colors:{jacket:XMAS.elfGreen,pants:XMAS.santaRed,mitten:XMAS.elfGreen,boot:'#7a4a2c',sole:'#2a1d15'},fold:['scarf','zip','strap'],
  body:{collar:XMAS.santaRed,belt:'#5a3a22',buckle:XMAS.gold,buttons:XMAS.gold,cuffs:XMAS.santaRed}},
});
export const XMAS_OUTFIT_IDS=Object.freeze(Object.keys(XMAS_OUTFITS));
export const DEFAULT_XMAS_OUTFIT='santa';
// 머리에 쓰는 것. gift = 선물 우체통 아이템(체험설계 §5-2 입는 것 3종)
export const XMAS_HATS=Object.freeze({
 santa:{label:'산타 모자',gift:true},
 antlers:{label:'순록 머리띠',gift:true},
 beanie:{label:'방울 니트 모자',gift:false},
 elf:{label:'엘프 모자',gift:false},
 none:{label:'안 씀',gift:false},
});
export const XMAS_SCARVES=Object.freeze({stripe:{label:'줄무늬 목도리',gift:true}});
export const XMAS_GIFT_WEARABLES=Object.freeze(['santa','stripe','antlers']); // 산타 모자·목도리·순록 머리띠
export const xmasOutfitKey=k=>XMAS_OUTFITS[k]?k:DEFAULT_XMAS_OUTFIT;

const lin=hex=>new THREE.Color(hex);
const smoothGeo=g=>{g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g);g.computeVertexNormals();return g;};
function ellipsoid(c,r,{w=20,h=14,q=null,shape=null,phiMax=Math.PI}={}){
 const g=new THREE.SphereGeometry(1,w,h,0,Math.PI*2,0,phiMax),p=g.attributes.position,V=v();
 for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);if(shape)shape(V);V.multiply(r);if(q)V.applyQuaternion(q);V.add(c);p.setXYZ(i,V.x,V.y,V.z);}
 return smoothGeo(g);
}
// 곡선을 따라 굵기 radius(u)로 휩쓴 관(산타 모자 고깔·뿔). 끝은 닫는다.
function sweep(pts,radius,{radial=16,rings=32}={}){
 const curve=new THREE.CatmullRomCurve3(pts),fr=curve.computeFrenetFrames(rings,false),pos=[],idx=[];
 for(let i=0;i<=rings;i++){const u=i/rings,P=curve.getPointAt(u),N=fr.normals[i],B=fr.binormals[i],r=radius(u);
  for(let k=0;k<=radial;k++){const a=k/radial*Math.PI*2,c=Math.cos(a)*r,s=Math.sin(a)*r;pos.push(P.x+c*N.x+s*B.x,P.y+c*N.y+s*B.y,P.z+c*N.z+s*B.z);}}
 for(let i=0;i<rings;i++)for(let k=0;k<radial;k++){const a=i*(radial+1)+k,b=a+radial+1;idx.push(a,a+1,b,a+1,b+1,b);}
 // 양 끝 뚜껑
 for(const [i,dir] of [[0,-1],[rings,1]]){const P=curve.getPointAt(i/rings),c=pos.length/3;pos.push(P.x,P.y,P.z);const row=i*(radial+1);
  for(let k=0;k<radial;k++)dir<0?idx.push(c,row+k+1,row+k):idx.push(c,row+k,row+k+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return smoothGeo(g);
}
const tubeAlong=(pts,r,closed=false,seg=48)=>smoothGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,closed),seg,r,8,closed));
// 몸통을 한 바퀴 두르는 둥근 털 단(높이 y, 굵기 r). 겉면에서 lift만큼 띄운 고리.
function trunkRing(y,r,lift){const pts=[];for(let i=0;i<32;i++){const {p}=surfA(-Math.PI+2*Math.PI*i/32,y,lift);pts.push(p);}return tubeAlong(pts,r,true,64);}

// ── 몸통·소매 부품
function buildBody(k,spec,arm){
 const S=spec;
 if(S.hem)k.solid(trunkRing(.215,.026,.012),S.hem,.6);
 if(S.placket)k.patch(.485,.215,()=>-.024,()=>.024,.01,S.placket,{nu:3,nv:14});
 if(S.belt){k.band(.3,.262,.006,S.belt);
  const {p,n}=surfA(0,.281,.014),g=new THREE.BoxGeometry(.07,.05,.014);g.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,0,1),n));g.translate(p.x,p.y,p.z);k.solid(g,S.buckle,.5);
  const h=new THREE.BoxGeometry(.038,.022,.01);h.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,0,1),n));h.translate(p.x+n.x*.008,p.y,p.z+n.z*.008);k.solid(h,S.belt);}
 if(S.bands)for(const [a,b,c] of S.bands)k.band(a,b,.0035,c);
 // 니트 무늬: 띠 위 작은 마름모 점 줄, 가슴 앞 눈송이 별 줄
 if(S.dots)for(let i=0;i<S.dots.n;i++){const a=-Math.PI+2*Math.PI*(i+.5)/S.dots.n,{p,n}=surfA(a,S.dots.y,.006),g=new THREE.OctahedronGeometry(.016,0);g.scale(1,1,.35);
  g.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,0,1),n));g.translate(p.x,p.y,p.z);k.solid(g,S.dots.color);}
 if(S.stars)for(let i=0;i<S.stars.n;i++){const a=-Math.PI+2*Math.PI*(i+.5)/S.stars.n,{p,n}=surfA(a,S.stars.y,.005),q=new Quaternion().setFromUnitVectors(v(0,0,1),n);
  for(const rot of [0,Math.PI/3,-Math.PI/3]){const g=new THREE.BoxGeometry(.006,.034,.006);g.rotateZ(rot);g.applyQuaternion(q);g.translate(p.x,p.y,p.z);k.solid(g,S.stars.color);}}
 // 엘프 뾰족 깃: 목둘레에서 어깨·가슴으로 늘어진 세모 8장
 if(S.collar)for(let i=0;i<8;i++){const a=-Math.PI+2*Math.PI*(i+.5)/8,top=surfA(a,.5,.012),tip=surfA(a,.405,.014),side=v(Math.cos(a),0,-Math.sin(a)).multiplyScalar(.042);
  const pts=[top.p.clone().add(side),top.p.clone().sub(side),tip.p],nn=top.n.clone().add(tip.n).normalize(),g=new THREE.BufferGeometry(),pos=[],idx=[];
  const off=nn.clone().multiplyScalar(.008);
  for(const P of pts)pos.push(P.x+off.x,P.y+off.y,P.z+off.z);for(const P of pts)pos.push(P.x-off.x*.2,P.y-off.y*.2,P.z-off.z*.2);
  idx.push(0,1,2,5,4,3,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0);
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();k.solid(g,S.collar,.5);}
 if(S.buttons)for(const y of [.4,.345])k.bead(0,y,[.013,.013,.007],.008,S.buttons,.4);
 // 소매 끝 털·고무단(아래팔 뼈에 붙는다)
 if(S.cuffs)for(const side of ['Left','Right']){const {fore,hand,bone}=arm(side),dir=hand.clone().sub(fore).normalize(),c=fore.clone().lerp(hand,.86);
  const g=new THREE.TorusGeometry(.047,S.cuffs===XMAS.fur?.019:.012,8,20);g.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,0,1),dir));g.translate(c.x,c.y,c.z);
  const prev=k.weights;k.weights=()=>[[bone,1]];k.solid(g,S.cuffs,.5);k.weights=prev;}
}

// ── 머리에 쓰는 것. hc = 머리 가운데(바인드 모델 공간). 모두 머리 뼈 하나에 붙는다.
function buildHat(k,kind,hc){
 const z=hc.z,top=hc.y;
 if(kind==='santa'){
  // 빨간 고깔이 뒤로 젖혀 오른쪽(캐릭터 왼쪽 +X)으로 늘어지고 끝에 흰 방울. 이마는 굵은 흰 털 단.
  const base=top+.115;
  k.solid(sweep([v(0,base-.01,z-.005),v(0,base+.11,z-.03),v(.05,base+.21,z-.07),v(.17,base+.23,z-.1),v(.28,base+.13,z-.1),v(.31,base+.01,z-.08)],u=>.212*Math.pow(1-u,.8)+.017,{rings:40,radial:24}),XMAS.santaRed,.8);
  k.solid(ellipsoid(v(0,base,z-.008),v(.268,.062,.258),{w:32,h:12,shape:V=>{V.y*=1+.25*Math.sin(Math.atan2(V.z,V.x)*7)*.15;}}),XMAS.fur,.7);
  k.solid(ellipsoid(v(.312,base-.03,z-.078),v(.062,.062,.062),{w:16,h:12}),XMAS.fur,.7);
 }else if(kind==='beanie'){
  // 노르딕 방울 모자: 머리 윗부분을 덮는 빨간 돔 + 접은 흰 단 + 초록 줄 + 흰 방울. 살짝 뒤로.
  const q=new Quaternion().setFromAxisAngle(v(1,0,0),-.12),o=v(0,top+.02,z-.01),put=g=>{g.applyQuaternion(q);g.translate(o.x,o.y,o.z);return g;};
  k.solid(put(ellipsoid(v(),v(.272,.262,.262),{w:32,h:16,phiMax:Math.PI*.42})),XMAS.santaRed,.8);
  k.solid(put(smoothGeo(new THREE.CylinderGeometry(.262,.274,.075,32,1,true).translate(0,.08,0))),XMAS.fur,.7);
  k.solid(put(smoothGeo(new THREE.CylinderGeometry(.247,.256,.022,32,1,true).translate(0,.155,0))),XMAS.pine,.4);
  k.solid(put(ellipsoid(v(0,.272,0),v(.068,.064,.068),{w:16,h:12,shape:V=>{const n=Math.sin(V.x*9)*Math.sin(V.y*7)*Math.sin(V.z*8);V.multiplyScalar(1+n*.06);}})),XMAS.fur,.7);
 }else if(kind==='elf'){
  // 엘프 모자: 초록 고깔이 높이 솟다 끝이 뒤로 꺾이고, 빨간 띠와 금 방울
  const base=top+.12;
  k.solid(sweep([v(0,base-.01,z),v(0,base+.16,z-.03),v(-.02,base+.3,z-.09),v(-.04,base+.37,z-.2)],u=>.226*Math.pow(1-u,1.05)+.012,{rings:32,radial:24}),XMAS.elfGreen,.8);
  k.solid(smoothGeo(new THREE.CylinderGeometry(.252,.262,.06,32,1,true).translate(0,base+.012,z-.004)),XMAS.santaRed,.6);
  k.solid(ellipsoid(v(-.042,base+.35,z-.235),v(.04,.04,.04),{w:14,h:10}),XMAS.gold,.6);
 }else if(kind==='antlers'){
  // 순록 머리띠: 머리 위를 가로지르는 갈색 띠 + 나뭇가지 뿔 둘 + 갈색 귀 + 작은 금 방울
  const R=.262,cz=z-.03,band=[];for(let i=0;i<=16;i++){const a=THREE.MathUtils.lerp(.17,Math.PI-.17,i/16);band.push(v(Math.cos(a)*R,top+.01+Math.sin(a)*(R-.01),cz));}
  k.solid(tubeAlong(band,.012,false,40),XMAS.antlerBand,.5);
  for(const s of [-1,1]){
   const b=v(s*.13,top+.235,cz);
   k.solid(sweep([b,v(s*.17,top+.33,cz-.01),v(s*.21,top+.42,cz-.03),v(s*.24,top+.48,cz-.04)],u=>.024-.012*u,{rings:20,radial:10}),XMAS.antler,.6);
   k.solid(sweep([v(s*.172,top+.335,cz-.01),v(s*.12,top+.39,cz),v(s*.105,top+.44,cz)],u=>.017-.008*u,{rings:12,radial:8}),XMAS.antler,.6);
   k.solid(sweep([v(s*.21,top+.42,cz-.03),v(s*.28,top+.45,cz-.03),v(s*.31,top+.5,cz-.02)],u=>.015-.007*u,{rings:12,radial:8}),XMAS.antler,.6);
   const ear=ellipsoid(v(),v(.032,.058,.018),{w:12,h:10}),eq=new Quaternion().setFromEuler(new THREE.Euler(0,0,s*-1.0));ear.applyQuaternion(eq);ear.translate(s*.25,top+.12,cz+.01);k.solid(ear,XMAS.antlerEar,.5);
  }
  k.solid(ellipsoid(v(0,top+.282,cz+.004),v(.022,.022,.022),{w:12,h:10}),XMAS.gold,.4);
 }
}

// 줄무늬 목도리: 동동이 목도리 고리 꼭짓점을 빨강·흰 줄로 다시 칠한다(형상은 원래 목도리).
function stripeScarf(hiker,on,outfit){
 const body=hiker.scene.getObjectByName('ToonHiker_Body'),g=body?.geometry,slot=g?.userData.outfitSlot;if(!slot)return;
 const SC=KEYS.indexOf('scarf');
 const c=g.attributes.color,p=g.userData.outfitRest,a=lin(XMAS.santaRed),b=lin(XMAS.fur),base=lin(outfit.colors.scarf??'#d9473e');
 for(let i=0;i<c.count;i++){if(slot[i]!==SC)continue;
  const ang=Math.atan2(p[i*3],p[i*3+2]),t=on?(Math.floor((ang+Math.PI)/(Math.PI*2)*14)%2?b:a):base;c.setXYZ(i,t.r,t.g,t.b);}
 c.needsUpdate=true;
}

// 몸에 붙는 크리스마스 부품 메시(처음 한 번). 형상만 옷마다 바꾼다. 재질은 동동이 몸과 같은 설정(toonify가 똑같이 바꾼다).
function xmasMeshes(hiker){
 const body=hiker.scene.getObjectByName('ToonHiker_Body');if(!body)return null;
 if(body.userData.xmasParts)return body.userData.xmasParts;
 const sk=body.skeleton,bi=n=>sk.bones.findIndex(b=>b.name==='mixamorig'+n);
 const bindPos=n=>new Vector3().setFromMatrixPosition(sk.boneInverses[bi(n)].clone().invert());
 const chain=['Hips','Spine','Spine1','Spine2'].map(n=>[bi(n),bindPos(n).y]),neck=bi('Neck'),headBone=bi('Head');
 const trunk=p=>{
  if(p.y>=.47)return [[chain[3][0],.6],[neck,.4]];
  if(p.y>=chain[3][1])return [[chain[3][0],1]];
  for(let i=0;i<3;i++){const [a,ya]=chain[i],[b,yb]=chain[i+1];if(p.y<yb){const t=THREE.MathUtils.clamp((p.y-ya)/(yb-ya),0,1);return [[a,1-t],[b,t]];}}
  return [[chain[0][0],1]];};
 const arm=side=>({fore:bindPos(side+'ForeArm'),hand:bindPos(side+'Hand'),bone:bi(side+'ForeArm')});
 const face=hiker.scene.userData.face,hc=face?v(...face.hc):v(0,.73,bindPos('Head').z);
 const lineSrc=hiker.scene.getObjectByName('ToonHiker_lineA');
 const make=(name,receive)=>{const mat=new THREE.MeshStandardMaterial({name:name.toLowerCase(),vertexColors:true,roughness:.85,metalness:0});
  const mesh=new THREE.SkinnedMesh(new THREE.BufferGeometry(),mat);mesh.name=name;mesh.frustumCulled=false;mesh.userData.outfitExtra=true;if(!receive)mesh.userData.noReceiveShadow=true;
  const line=new THREE.SkinnedMesh(mesh.geometry,lineSrc.material);line.name=name+'_line';line.userData.outline=true;line.userData.outlineOf=name;line.frustumCulled=false;
  for(const m of [mesh,line]){body.parent.add(m);m.bind(sk,body.bindMatrix);}return {mesh,line};};
 return body.userData.xmasParts={body:make('Xmas_Body',true),head:make('Xmas_Head',false),trunk,arm,headBone,hc};
}
const setGeo=(pair,geo)=>{const old=pair.mesh.geometry;pair.mesh.geometry=geo;pair.line.geometry=geo;pair.mesh.visible=pair.line.visible=geo.attributes.position.count>0;old.dispose();};

// 크리스마스 차림 입히기. outfit = 기본 옷, hat = 머리 칸(null이면 옷의 기본 모자), scarf = 'stripe'(선물 목도리) 또는 null.
// 돌려주는 값 = 실제로 입은 것 {outfit,hat,scarf}.
export function applyXmasLook(hiker,{outfit=DEFAULT_XMAS_OUTFIT,hat=null,scarf=null}={}){
 const key=xmasOutfitKey(outfit),o=XMAS_OUTFITS[key],hatKey=XMAS_HATS[hat]?hat:o.hat,wearScarf=scarf==='stripe';
 // 목도리를 두르면 접었던 목도리 고리를 다시 꺼내고, 산타 털 깃도 목도리로 바뀐다.
 const fold=wearScarf?o.fold.filter(n=>n!=='scarf'):o.fold;
 applyOutfit(hiker,key,{table:{[key]:{...o,fold,parts:null}},hide:HIDE});
 stripeScarf(hiker,wearScarf,o);
 const x=xmasMeshes(hiker);
 if(x){
  const kb=new Kit(x.trunk);buildBody(kb,o.body,x.arm);setGeo(x.body,kb.geometry());
  const kh=new Kit(()=>[[x.headBone,1]]);if(hatKey!=='none')buildHat(kh,hatKey,x.hc);setGeo(x.head,kh.geometry());
 }
 return {outfit:key,hat:hatKey,scarf:wearScarf?'stripe':null};
}
// 테스트·미리보기용: 형상만 만들어 삼각형 수를 센다(뼈대 없이).
export function xmasPartTriangles(){const hc=v(0,.73,0),arm=s=>({fore:v(s==='Left'?.2:-.2,.42,0),hand:v(s==='Left'?.25:-.25,.3,0),bone:0}),out={};
 for(const id of XMAS_OUTFIT_IDS){const k=new Kit(()=>[[0,1]]);buildBody(k,XMAS_OUTFITS[id].body,arm);out['body:'+id]=k.idx.length/3;}
 for(const id of Object.keys(XMAS_HATS)){const k=new Kit(()=>[[0,1]]);buildHat(k,id,hc);out['hat:'+id]=k.idx.length/3;}
 return out;}
export {TRUNK,angleAt,trunkRadii};
