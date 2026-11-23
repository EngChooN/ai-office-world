// 온라인 인형뽑기 — 동동이 가게 옷(월드아트, 2026-11-23, 대표 피드백: 인형가게에서 등산복 말고 전용 복장).
// 몸·비율·얼굴·동작은 동동이 그대로 두고 옷만 바꾼다(흡연장 회사원 옷·크리스마스 옷과 같은 방식: src/lounge/outfit.js applyOutfit에 옷 표만 넘긴다).
//  - hoodie(기본, 추천안·대표 미확인): 박하색 후드티 + 청바지 + 흰 운동화.
//  - jacket(대안 1): 남색 야구점퍼(크림 소매) + 청바지 + 흰 운동화.
//  - tee(대안 2): 노랑 반팔 티 + 베이지 반바지 + 흰 운동화.
// 등산 장비(벙거지·배낭·쌍안경·스틱)는 들고 오지 않는다. 스틱은 claw-avatar.js가 숨긴다.
// 소매·반바지는 꼭짓점이 어느 뼈(위팔·아래팔·종아리)에 붙었는지 보고 다시 칠한다(형상은 원래 동동이 그대로).
// 옷 부품(후드·주머니·끈·고무단·단추)은 몸통·소매 뼈에 붙는 메시 'Claw_Body' 하나에 그린다. 원본 link-hiker.js는 고치지 않는다.
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {applyOutfit,Kit,surfA,KEYS} from '../lounge/outfit.js';

const {Vector3,Quaternion}=THREE;
const v=(x=0,y=0,z=0)=>new Vector3(x,y,z);
const HAND='#f7d9b8'; // 맨손·맨다리 = 동동이 피부색(link-hiker PALETTE.skin)
const HIDE=['ToonHiker_Pack','ToonHiker_linePack','ToonHiker_Hat','ToonHiker_lineHat','Gadget.Binoculars','Gadget.Binoculars.Strap0','Gadget.Binoculars.Strap1'];
const SNEAKER={boot:'#f4f1ea',sole:'#d9473e'}; // 흰 운동화 + 동동이 빨강 밑창
const JEANS='#4f6fa3';

// colors = 동동이 꼭짓점 색 칸 → 새 색, fold = 몸 안으로 접어 넣을 등산복 부품,
// sleeve·forearm·shin = 위팔·아래팔·종아리 다시 칠하기(없으면 몸판·바지 색 그대로), parts = 옷 부품
export const CLAW_OUTFITS=Object.freeze({
 hoodie:{label:'후드티',desc:'박하색 후드티에 청바지, 흰 운동화',
  colors:{jacket:'#7fd1b9',scarf:'#62b39c',pants:JEANS,mitten:HAND,...SNEAKER},fold:['zip','strap'],
  parts:{hood:'#6cc2aa',pouch:'#6cc2aa',strings:'#fffaf0',hem:'#62b39c',cuffs:'#62b39c'}},
 jacket:{label:'야구점퍼',desc:'남색 몸판에 크림 소매, 청바지',
  colors:{jacket:'#34416b',scarf:'#2a3354',pants:JEANS,mitten:HAND,...SNEAKER},fold:['zip','strap'],sleeve:'#f1e6cc',
  parts:{hem:'#2a3354',stripe:'#f1e6cc',cuffs:'#2a3354',snaps:'#f1e6cc',badge:{fill:'#f1e6cc',mark:'#d9473e'}}},
 tee:{label:'반팔 티',desc:'노랑 반팔 티에 베이지 반바지',
  colors:{jacket:'#ffd45c',pants:'#c8ad80',mitten:HAND,...SNEAKER},fold:['scarf','zip','strap'],forearm:HAND,shin:HAND,
  parts:{neck:'#f0bf3c',print:{fill:'#d9473e',mark:'#fffaf0'},legHem:'#b39668'}},
});
export const CLAW_OUTFIT_IDS=Object.freeze(Object.keys(CLAW_OUTFITS));
export const DEFAULT_CLAW_OUTFIT='hoodie';
export const clawOutfitKey=k=>CLAW_OUTFITS[k]?k:DEFAULT_CLAW_OUTFIT;

const lin=hex=>new THREE.Color(hex);
const smoothGeo=g=>{g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g);g.computeVertexNormals();return g;};
const facing=(g,n,p)=>{g.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,0,1),n));g.translate(p.x,p.y,p.z);return g;};
// 몸통 겉 한 바퀴 고리(굵기 r)
function trunkRing(y,r,lift){const pts=[];for(let i=0;i<32;i++)pts.push(surfA(-Math.PI+2*Math.PI*i/32,y,lift).p);
 return smoothGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),64,r,8,true));}
// 몸통 앞 둥근 판(가슴 무늬·배지)
function disc(k,x,y,r,lift,hex,line=0){const a=Math.asin(x/.16),{p,n}=surfA(a,y,lift);k.solid(facing(new THREE.CylinderGeometry(r,r,.006,20).rotateX(Math.PI/2),n,p),hex,line);}

// ── 옷 부품. arm(side) = 소매 뼈 자리, leg(side) = 무릎 자리(바인드 모델 공간)
function buildParts(k,P,arm,leg){
 // 후드: 등 뒤로 넘긴 모자(둥근 주머니 모양) + 목 뒤 두툼한 테
 if(P.hood){const {p,n}=surfA(Math.PI,.425,.035);
  k.solid(facing(smoothGeo(new THREE.SphereGeometry(1,20,14).scale(.115,.085,.045)),n,p),P.hood,.7);
  const rim=[];for(let i=0;i<=16;i++){const a=THREE.MathUtils.lerp(Math.PI*.55,Math.PI*1.45,i/16);rim.push(surfA(a,.485-.035*Math.sin((i/16)*Math.PI),.03).p);}
  k.solid(smoothGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim),32,.02,8,false)),P.hood,.6);}
 // 캥거루 주머니: 배 앞, 위가 좁은 사다리꼴
 if(P.pouch)k.patch(.3,.215,y=>-THREE.MathUtils.lerp(.065,.095,(.3-y)/.085),y=>THREE.MathUtils.lerp(.065,.095,(.3-y)/.085),.006,P.pouch,{nu:6,nv:6});
 // 후드 끈 두 가닥 + 끝 매듭
 if(P.strings)for(const s of [-1,1]){const pts=[.48,.44,.4].map(y=>surfA(Math.asin(s*.032/.16),y,.012).p);
  k.solid(smoothGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.0055,6,false)),P.strings,.3);
  k.bead(s*.032,.395,[.009,.012,.008],.012,P.strings,.3);}
 // 아래 고무단(+ 야구점퍼 줄무늬)
 if(P.hem)k.solid(trunkRing(.205,.016,.008),P.hem,.4);
 if(P.stripe)k.band(.232,.224,.005,P.stripe);
 // 야구점퍼 똑딱단추·가슴 배지
 if(P.snaps)for(const y of [.45,.39,.33,.27])k.bead(0,y,[.01,.01,.005],.006,P.snaps,.3);
 if(P.badge){disc(k,.075,.405,.03,.006,P.badge.fill,.4);disc(k,.075,.405,.016,.01,P.badge.mark);}
 // 반팔 티: 목 둘레 단 + 가슴 별 무늬
 if(P.neck)k.solid(new THREE.TorusGeometry(.082,.011,8,28).rotateX(Math.PI/2).scale(1.1,1,1).translate(0,.493,0),P.neck,.4);
 if(P.print){disc(k,0,.37,.045,.006,P.print.fill,.4);
  const {p,n}=surfA(0,.37,.011),q=new Quaternion().setFromUnitVectors(v(0,0,1),n);
  for(const rot of [0,Math.PI/2.5,-Math.PI/2.5])k.solid(new THREE.BoxGeometry(.008,.05,.004).rotateZ(rot).applyQuaternion(q).translate(p.x,p.y,p.z),P.print.mark);}
 // 소매 끝 고무단(아래팔 뼈)
 if(P.cuffs)for(const side of ['Left','Right']){const {fore,hand,bone}=arm(side),dir=hand.clone().sub(fore).normalize(),c=fore.clone().lerp(hand,.86);
  const g=new THREE.TorusGeometry(.046,.011,8,20);facing(g,dir,c);const prev=k.weights;k.weights=()=>[[bone,1]];k.solid(g,P.cuffs,.4);k.weights=prev;}
 // 반바지 단: 무릎 바로 위 고리(허벅지 뼈)
 if(P.legHem)for(const side of ['Left','Right']){const {up,knee,bone}=leg(side),dir=knee.clone().sub(up).normalize(),c=up.clone().lerp(knee,.82);
  const g=new THREE.TorusGeometry(.058,.009,8,20);facing(g,dir,c);const prev=k.weights;k.weights=()=>[[bone,1]];k.solid(g,P.legHem,.4);k.weights=prev;}
}

// 소매·종아리 다시 칠하기: 꼭짓점이 가장 많이 붙은 뼈 이름으로 고른다(applyOutfit이 칠한 뒤에).
function paintRegions(hiker,o){
 if(!o.sleeve&&!o.forearm&&!o.shin)return;
 const body=hiker.scene.getObjectByName('ToonHiker_Body'),g=body?.geometry,slot=g?.userData.outfitSlot;if(!slot)return;
 const names=body.skeleton.bones.map(b=>b.name.replace('mixamorig','')),si=g.attributes.skinIndex,sw=g.attributes.skinWeight,c=g.attributes.color;
 const J=KEYS.indexOf('jacket'),PA=KEYS.indexOf('pants'),cs=o.sleeve&&lin(o.sleeve),cf=o.forearm&&lin(o.forearm),cl=o.shin&&lin(o.shin);
 for(let i=0;i<c.count;i++){const k=slot[i];if(k!==J&&k!==PA)continue;
  let best=-1,bw=0;for(let j=0;j<4;j++){const w=sw.getComponent(i,j);if(w>bw){bw=w;best=si.getComponent(i,j);}}
  const n=names[best]??'',fore=/ForeArm$/.test(n),upper=/(Arm|Shoulder)$/.test(n)&&!fore,shin=/Leg$/.test(n)&&!/UpLeg$/.test(n)&&bw>.55;
  let t=null;
  if(k===J){if(fore)t=cf??cs;else if(upper)t=cs;}
  else if(shin)t=cl;
  if(t)c.setXYZ(i,t.r,t.g,t.b);}
 c.needsUpdate=true;
}

// 옷 부품 메시(처음 한 번). 형상만 옷마다 바꾼다. 재질은 동동이 몸과 같은 설정(toonify가 똑같이 바꾼다).
function clawMesh(hiker){
 const body=hiker.scene.getObjectByName('ToonHiker_Body');if(!body)return null;
 if(body.userData.clawParts)return body.userData.clawParts;
 const sk=body.skeleton,bi=n=>sk.bones.findIndex(b=>b.name==='mixamorig'+n);
 const bindPos=n=>new Vector3().setFromMatrixPosition(sk.boneInverses[bi(n)].clone().invert());
 const chain=['Hips','Spine','Spine1','Spine2'].map(n=>[bi(n),bindPos(n).y]),neck=bi('Neck');
 const trunk=p=>{
  if(p.y>=.47)return [[chain[3][0],.6],[neck,.4]];
  if(p.y>=chain[3][1])return [[chain[3][0],1]];
  for(let i=0;i<3;i++){const [a,ya]=chain[i],[b,yb]=chain[i+1];if(p.y<yb){const t=THREE.MathUtils.clamp((p.y-ya)/(yb-ya),0,1);return [[a,1-t],[b,t]];}}
  return [[chain[0][0],1]];};
 const arm=side=>({fore:bindPos(side+'ForeArm'),hand:bindPos(side+'Hand'),bone:bi(side+'ForeArm')});
 const leg=side=>({up:bindPos(side+'UpLeg').add(v(0,.04,0)),knee:bindPos(side+'Leg'),bone:bi(side+'UpLeg')});
 const lineSrc=hiker.scene.getObjectByName('ToonHiker_lineA');
 const mat=new THREE.MeshStandardMaterial({name:'claw_body',vertexColors:true,roughness:.85,metalness:0});
 const mesh=new THREE.SkinnedMesh(new THREE.BufferGeometry(),mat);mesh.name='Claw_Body';mesh.frustumCulled=false;mesh.userData.outfitExtra=true;
 const line=new THREE.SkinnedMesh(mesh.geometry,lineSrc.material);line.name='Claw_Body_line';line.userData.outline=true;line.userData.outlineOf=mesh.name;line.frustumCulled=false;
 for(const m of [mesh,line]){body.parent.add(m);m.bind(sk,body.bindMatrix);}
 return body.userData.clawParts={mesh,line,trunk,arm,leg};
}

// 가게 옷 입히기. 돌려주는 값 = 실제로 입은 옷 이름.
export function applyClawOutfit(hiker,outfit=DEFAULT_CLAW_OUTFIT){
 const key=clawOutfitKey(outfit),o=CLAW_OUTFITS[key];
 applyOutfit(hiker,key,{table:{[key]:{...o,parts:null}},hide:HIDE});
 paintRegions(hiker,o);
 const x=clawMesh(hiker);
 if(x){const k=new Kit(x.trunk);buildParts(k,o.parts,x.arm,x.leg);const geo=k.geometry(),old=x.mesh.geometry;x.mesh.geometry=geo;x.line.geometry=geo;old.dispose();}
 return key;
}
// 테스트용: 형상만 만들어 삼각형 수를 센다(뼈대 없이).
export function clawPartTriangles(){
 const arm=s=>({fore:v(s==='Left'?.2:-.2,.42,0),hand:v(s==='Left'?.25:-.25,.3,0),bone:0}),leg=s=>({up:v(s==='Left'?.07:-.07,.22,0),knee:v(s==='Left'?.07:-.07,.12,0),bone:0}),out={};
 for(const id of CLAW_OUTFIT_IDS){const k=new Kit(()=>[[0,1]]);buildParts(k,CLAW_OUTFITS[id].parts,arm,leg);out[id]=k.idx.length/3;}
 return out;
}
