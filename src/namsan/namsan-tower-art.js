// 남산 전망탑 입구·실내 전망대 그림(월드개발 11-22, 동동이 툰 화풍으로 새로 그림 — 실제 N서울타워 사진·로고·내부 모양을 따라 하지 않음).
// 규칙·자리(three 없음)는 namsan-tower.js planTowerEntrance·planDeck. 붙이는 쪽(game.js)이 toon.toonify(…,{kind:'prop'})로 카툰 재질로 바꾼다.
//  - 입구: 탑 받침 벽의 문틀·유리문·「전망대」 간판·화단을 가로지르는 디딤판(화단 고리에 틈을 낸다)
//  - 전망대(원반 안 한 층): 나무 바닥·엘리베이터 기둥(문·층 표시)·천장 등 고리·낮은 창턱과 손잡이·비스듬한 유리 띠와 창살·
//    방향 이름판(쌍안경 명소 자료로 방위를 직접 계산)·바닥 동서남북 글자·동전 망원경 4대
// 그리기 수를 줄이려고 같은 재질 조각은 합친다(이름판·글자는 글자판 한 장).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {DECK,bearingToDir} from './namsan-tower.js';
import {TOWER_SHAPE} from './namsan-tower-shape.js';

export const TOWER_ART_COLORS=Object.freeze({floor:'#e2d3b4',floorLine:'#b89a72',core:'#f3efe6',trim:'#d7d2c6',door:'#8fb3c7',doorFrame:'#5d6b74',ceiling:'#efe9dc',lamp:'#fff1c9',
 sill:'#e8e0cf',rail:'#a8794e',mullion:'#5d6b74',glass:'#bfe4ff',scopeBody:'#f2c14e',scopePost:'#2f7f68',scopeEye:'#3a2b22',sign:'#2f7f68',mat:'#c9bfae'});
const FONT='"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0,...o});
const lathe=(pts,seg=48,p0=0,pl=Math.PI*2)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg,p0,pl);
const phiOf=b=>{const u=bearingToDir(b);return Math.atan2(u.x,u.z);};   // LatheGeometry 각(x = r·sin φ, z = r·cos φ)
const faceIn=b=>{const u=bearingToDir(b);return Math.atan2(-u.x,-u.z);}; // 판 앞면(+Z)이 탑 가운데를 보게

// ── 입구(탑 받침 벽): tower = 탑 그림 root(남산 전망탑), bearing = 문 방위. 화단 고리 두 개에 문 폭만큼 틈을 내고 문틀·간판·디딤판을 더한다
export function buildTowerEntrance(tower,bearing){
 const C=TOWER_ART_COLORS,R=TOWER_SHAPE.baseR,g=new THREE.Group();g.name='전망탑 입구';
 const phi=phiOf(bearing),gap=7.5*Math.PI/180,p0=phi+gap,pl=Math.PI*2-gap*2;
 for(const [name,pts] of [['탑 둘레 화단 테',[[R+2,0],[R+3.6,0],[R+3.6,.55],[R+2,.55]]],['탑 둘레 화단 풀',[[R+2.1,.5],[R+3.5,.5]]]]){
  const m=tower.getObjectByName(name);if(!m)continue;m.geometry.dispose();m.geometry=lathe(pts,48,p0,pl);
  // 틈 양 끝 마구리(테 단면이 비어 보이지 않게)
  if(name==='탑 둘레 화단 테')for(const a of [p0,p0+pl]){const cap=new THREE.Mesh(new THREE.BoxGeometry(.04,.55,1.6),m.material);cap.position.set(Math.sin(a)*(R+2.8),.275,Math.cos(a)*(R+2.8));cap.rotation.y=a;cap.name='화단 마구리';g.add(cap);}}
 const pivot=new THREE.Group();pivot.rotation.y=phi;g.add(pivot);   // pivot 안: +Z = 바깥(문 앞), x = 옆
 const add=(geo,mat,name,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.name=name;m.castShadow=true;m.receiveShadow=true;pivot.add(m);return m;};
 const frame=std(C.doorFrame);
 add(new THREE.BoxGeometry(3.0,.35,.7),frame,'입구 문틀 위',0,3.35,R+.05);
 for(const s of [-1,1])add(new THREE.BoxGeometry(.32,3.35,.7),frame,'입구 문틀 기둥',s*1.34,1.67,R+.05);
 const glass=std(C.door,{roughness:.35,emissive:new THREE.Color('#ffd9a0'),emissiveIntensity:0});
 const doors=[-1,1].map(s=>add(new THREE.BoxGeometry(1.15,3.05,.12),glass,'입구 유리문',s*.6,1.55,R+.18));
 add(new THREE.BoxGeometry(3.2,.06,3.9),std(C.mat),'입구 디딤판',0,.03,R+1.95);
 // 간판: 「전망대」 + 위 화살표(글자판)
 const tex=canvasTex(512,160,c=>{c.fillStyle=C.sign;roundRect(c,6,6,500,148,30);c.fill();c.fillStyle='#fffaf0';c.font=`900 78px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('▲ 전망대',256,86);});
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.82),new THREE.MeshBasicMaterial({map:tex,transparent:true}));sign.position.set(0,4.05,R+.42);sign.name='입구 간판';pivot.add(sign);
 g.userData={sign,update(night){for(const d of doors){const m=d.material;if(m.emissive)m.emissiveIntensity=.15+night*.9;}sign.material.color.setScalar(1-.5*night);}};   // toonify 뒤 지금 재질을 고침
 return g;
}

// ── 전망대 실내. plan = planDeck(…) 결과. 원점 = 탑 가운데·바닥 윗면(붙이는 쪽이 (tower.x, plan.y, tower.z)에 둔다)
export function buildTowerDeck(plan){
 const C=TOWER_ART_COLORS,root=new THREE.Group();root.name='전망대 실내';
 const add=(geo,mat,name,{shadow=false}={})=>{const m=new THREE.Mesh(geo,mat);m.name=name;m.castShadow=shadow;m.receiveShadow=false;root.add(m);return m;};
 const H=DECK.height,cx=plan.tower.x,cz=plan.tower.z,local=p=>({x:p.x-cx,z:p.z-cz});
 const glow=[];let lampMat=null;   // 밤에 은은히 밝히는 재질(실내 조명 대신)
 const mat=(c,o)=>{const m=std(c,{emissive:new THREE.Color(c),emissiveIntensity:0,...o});glow.push(m);return m;};
 // 바닥: 나무 고리 + 창가 쪽 짙은 띠(걷는 길 표시)
 add(new THREE.RingGeometry(DECK.core-.05,DECK.glass+.15,72,1).rotateX(-Math.PI/2),mat(C.floor),'전망대 바닥');
 add(new THREE.RingGeometry(DECK.autoR+.75,DECK.autoR+1.0,72,1).rotateX(-Math.PI/2).translate(0,.005,0),mat(C.floorLine),'전망대 바닥 띠');
 add(new THREE.RingGeometry(DECK.core+.6,DECK.core+.8,72,1).rotateX(-Math.PI/2).translate(0,.005,0),mat(C.floorLine),'전망대 바닥 안쪽 띠');
 // 엘리베이터 기둥 + 위아래 테
 add(new THREE.CylinderGeometry(DECK.core,DECK.core,H,48,1,true).translate(0,H/2,0),mat(C.core),'엘리베이터 기둥');
 add(mergeGeometries([new THREE.CylinderGeometry(DECK.core+.12,DECK.core+.12,.22,48).translate(0,.11,0),new THREE.CylinderGeometry(DECK.core+.12,DECK.core+.12,.3,48).translate(0,H-.15,0)]),mat(C.trim),'엘리베이터 기둥 테');
 // 엘리베이터 문(입구와 같은 방위) + 층 표시판
 {const pv=new THREE.Group();pv.rotation.y=phiOf(plan.entranceBearing);root.add(pv);
  const fr=std(C.doorFrame),dr=std(C.door,{roughness:.3,metalness:.2});
  const box=(w,h,d,m,x,y,z,n)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.name=n;pv.add(o);return o;};
  box(2.5,.3,.3,fr,0,2.85,DECK.core+.05,'엘리베이터 문틀 위');for(const s of [-1,1])box(.25,2.85,.3,fr,s*1.12,1.42,DECK.core+.05,'엘리베이터 문틀 기둥');
  const doors=[-1,1].map(s=>box(.98,2.7,.08,dr,s*.5,1.35,DECK.core+.1,'엘리베이터 문'));
  const tex=canvasTex(256,96,c=>{c.fillStyle='#1d2730';roundRect(c,4,4,248,88,18);c.fill();c.fillStyle='#ffcf6b';c.font=`900 54px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('▲▼ 전망',128,52);});
  const ind=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.45),new THREE.MeshBasicMaterial({map:tex}));ind.position.set(0,3.3,DECK.core+.06);ind.name='엘리베이터 층 표시';pv.add(ind);
  root.userData.doors=doors;}
 // 천장 + 등 고리(작은 둥근 등 30개를 한 메시로)
 add(new THREE.RingGeometry(DECK.core-.05,DECK.glass+.4,72,1).rotateX(Math.PI/2).translate(0,H,0),mat(C.ceiling),'전망대 천장');
 {const lamps=[];for(let i=0;i<30;i++){const a=i/30*Math.PI*2;lamps.push(new THREE.CylinderGeometry(.22,.22,.06,12).translate(Math.sin(a)*9.6,H-.03,Math.cos(a)*9.6));}
  const lm=std(C.lamp,{emissive:new THREE.Color(C.lamp),emissiveIntensity:.25});glow.push(lm);lampMat=lm;add(mergeGeometries(lamps),lm,'전망대 천장 등');lamps.forEach(x=>x.dispose());}
 // 창턱(낮게: 동동이 1m 키에 맞춰 0.5m) + 손잡이 고리
 add(lathe([[DECK.sill,0],[DECK.sill,.5],[DECK.glass+.1,.5],[DECK.glass+.1,0]],72),mat(C.sill),'전망대 창턱');
 add(new THREE.TorusGeometry(DECK.sill-.08,.045,6,96).rotateX(Math.PI/2).translate(0,.66,0),std(C.rail),'전망대 손잡이');
 {const posts=[];for(let i=0;i<36;i++){const a=i/36*Math.PI*2;posts.push(new THREE.CylinderGeometry(.025,.025,.18,6).translate(Math.sin(a)*(DECK.sill-.08),.58,Math.cos(a)*(DECK.sill-.08)));}add(mergeGeometries(posts),std(C.rail),'전망대 손잡이 받침');posts.forEach(x=>x.dispose());}
 // 유리 띠(밖으로 조금 기울어짐) + 창살 24줄
 const glass=new THREE.Mesh(lathe([[DECK.glass,.5],[DECK.glass+.35,H]],72),new THREE.MeshBasicMaterial({color:C.glass,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide}));glass.name='전망대 유리';glass.userData.noEdge=true;glass.renderOrder=2;root.add(glass);
 {const bars=[],n=24,len=Math.hypot(H-.5,.35),tilt=Math.atan2(.35,H-.5);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=new THREE.BoxGeometry(.12,len,.12);b.rotateX(tilt);b.translate(0,(H+.5)/2,DECK.glass+.175);b.rotateY(a);bars.push(b);}
  add(mergeGeometries(bars),std(C.mullion),'전망대 창살');bars.forEach(x=>x.dispose());}
 // 방향 이름판(유리 안쪽, 동동이 눈높이 조금 위) + 바닥 동서남북 글자: 글자판 한 장
 const cells=[...plan.labels.map(l=>({kind:'label',l})),...[['북',0],['동',90],['남',180],['서',270]].map(([t,b])=>({kind:'compass',t,b}))];
 const COLS=4,CW=256,CH=128,rows=Math.ceil(cells.length/COLS),atlas=canvasTex(COLS*CW,rows*CH,c=>{cells.forEach((cell,i)=>{const x=(i%COLS)*CW,y=Math.floor(i/COLS)*CH;
  if(cell.kind==='label'){c.fillStyle='rgba(246,238,222,.95)';roundRect(c,x+6,y+8,CW-12,CH-16,22);c.fill();c.strokeStyle=C.sign;c.lineWidth=6;c.stroke();
   c.fillStyle='#3a2b22';c.textAlign='center';c.textBaseline='middle';const nm=cell.l.name.replace(/ \(.*\)/,'');c.font=`900 ${nm.length>6?34:44}px ${FONT}`;c.fillText(nm,x+CW/2,y+50);
   c.fillStyle='#2f7f68';c.font=`800 28px ${FONT}`;c.fillText(`${cell.l.compass} · ${cell.l.km.toFixed(1)}km`,x+CW/2,y+92);}
  else{c.fillStyle='rgba(181,139,92,.9)';c.font=`900 104px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText(cell.t,x+CW/2,y+CH/2+6);}});});
 const uvCell=(geo,i)=>{const uv=geo.attributes.uv,u0=(i%COLS)/COLS,v0=1-(Math.floor(i/COLS)+1)/rows;for(let k=0;k<uv.count;k++)uv.setXY(k,u0+uv.getX(k)/COLS,v0+uv.getY(k)/rows);return geo;};
 const plates=[];cells.forEach((cell,i)=>{
  if(cell.kind==='label'){const g=uvCell(new THREE.PlaneGeometry(1.5,.75),i),u=bearingToDir(cell.l.bearing),r=DECK.glass-.12+.04*cell.l.row;
   g.rotateY(faceIn(cell.l.bearing));g.translate(u.x*r,1.25+cell.l.row*.85,u.z*r);plates.push(g);}
  else{const g=uvCell(new THREE.PlaneGeometry(1.3,.65),i),u=bearingToDir(cell.b);g.rotateX(-Math.PI/2);g.rotateY(faceIn(cell.b)+Math.PI);g.translate(u.x*(DECK.rMax-.2),.012,u.z*(DECK.rMax-.2));plates.push(g);}});
 const labelMesh=new THREE.Mesh(mergeGeometries(plates),new THREE.MeshBasicMaterial({map:atlas,transparent:true,depthWrite:false}));labelMesh.name='전망대 방향 이름판';labelMesh.renderOrder=3;root.add(labelMesh);plates.forEach(x=>x.dispose());
 // 동전 망원경(게임 소품): 기둥 + 노란 몸통(바깥을 보고 조금 위로) + 눈 대는 곳
 const sPost=std(C.scopePost),sBody=std(C.scopeBody),sEye=std(C.scopeEye);const P=[],B=[],E=[];
 for(const s of plan.scopes){const p=local(s),yaw=faceIn(s.bearing)+Math.PI;   // 몸통 +Z가 바깥
  const tf=new THREE.Matrix4().makeRotationY(yaw).setPosition(p.x,0,p.z);
  P.push(new THREE.CylinderGeometry(.08,.14,.62,12).translate(0,.31,0).applyMatrix4(tf),new THREE.CylinderGeometry(.24,.28,.08,16).translate(0,.04,0).applyMatrix4(tf));
  B.push(new THREE.CylinderGeometry(.13,.17,.62,16).rotateX(Math.PI/2-.18).translate(0,.78,.06).applyMatrix4(tf),new THREE.SphereGeometry(.17,14,10).translate(0,.72,-.05).applyMatrix4(tf));
  E.push(new THREE.CylinderGeometry(.07,.07,.14,10).rotateX(Math.PI/2-.18).translate(0,.71,-.3).applyMatrix4(tf));}
 if(P.length){add(mergeGeometries(P),sPost,'망원경 기둥',{shadow:true});add(mergeGeometries(B),sBody,'망원경 몸통',{shadow:true});add(mergeGeometries(E),sEye,'망원경 눈대');[...P,...B,...E].forEach(x=>x.dispose());}
 // toonify가 재질을 바꿔 끼우므로 밝힐 메시를 기억해 두고 그때그때 지금 재질을 고친다
 const glowMeshes=[];root.traverse(o=>{if(o.isMesh&&glow.includes(o.material))glowMeshes.push({o,lamp:o.material===lampMat});});
 // 글자판(MeshBasic, 빛을 안 받음)은 밤에 어둡게 — 그대로 두면 밤 번짐(블룸)으로 하얗게 타서 글자가 안 보였다
 const basics=[];root.traverse(o=>{if(o.isMesh&&o.material.isMeshBasicMaterial&&o.material.map)basics.push(o.material);});
 root.userData={plan,update(night){for(const {o,lamp} of glowMeshes){const m=o.material;if(m.emissive)m.emissiveIntensity=lamp?.25+night*.35:night*.1;}for(const m of basics)m.color.setScalar(1-.6*night);}};
 return root;
}

function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
