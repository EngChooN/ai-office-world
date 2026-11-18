// 크리스마스 「하늘 썰매」 그림(월드아트, 2026-11-18). 설계 v2(docs/크리스마스/루돌프-하늘썰매-설계-v2.md): 루돌프 2마리가 나란히 산타 썰매를 끌고, 동동이는 좌석에 앉는다.
// 한 벌 = 루돌프 2마리(reindeer.js 무리) + 썰매 1대 + 끈(끄는 끈 4 · 고삐 2). 30대가 함께 나와도 그리기 7번(루돌프 5 + 썰매 1 + 끈 1)이다.
// 썰매 모양: 빨간 몸통 + 높게 말린 등받이·앞머리, 금 테·금 소용돌이 장식, 앞이 말린 금빛 썰매 날, 흰 털 좌석·등받이 쿠션, 앞판 화환, 앞 모서리 금방울, 좌석 오른쪽 선물 자루.
// 크기: 썰매 길이 1.9m(날 끝 포함)·폭 1.3m·등받이 높이 1.05m, 루돌프 둘(가운데 사이 0.84m)이 썰매 앞에서 2.35m 앞. 전체 길이(썰매 뒤 ~ 루돌프 코) 약 4.1m.
// 좌표: 썰매 원점 = 썰매 날 바닥 가운데(땅에 닿는 곳), 앞 = 로컬 −Z, heading 0 = −Z(동동이·루돌프와 같은 규칙).
//
// ■ 움직임 두 가지(월드개발이 고름)
//   team.drive(x,y,z,heading)  루돌프 둘의 가운데(앞)를 움직이면 썰매가 끈 길이만큼 뒤에서 끌려온다(트레일러처럼).
//                              → 「루돌프가 먼저 돌고 썰매가 늦게 따라옴」, 「루돌프가 먼저 뜨고 썰매가 따라 뜸」이 저절로 생긴다. y = 루돌프 발굽 높이.
//   team.place(x,y,z,heading)  썰매 자리(원점)를 바로 정하고 루돌프는 곧게 앞에(정류장·처음 보이는 사람·순간 이동).
//   땅 모드(stand·run)는 heightAt(x,z)로 썰매·루돌프를 땅에 붙인다. 하늘 모드(takeoff·fly·land)는 받은 높이(썰매는 땅 밑으로 안 내려감).
//   돌 때 썰매는 바깥쪽으로 기운다(최대 15°, 설계 §3). 하늘에서는 천천히 흔들린다(흔들림 기준점 SLEIGH.pivot).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ART,createReindeerHerd,triangleCount,REINDEER_COLORS} from './reindeer.js';
import {XMAS} from './palette.js';

const {paint,ell,capsule,tube,v}=ART;
const {Vector3,Matrix4,Quaternion,Euler}=THREE;
const K={...REINDEER_COLORS,body:XMAS.santaRed,bodyDark:XMAS.santaRedDark,fur:XMAS.fur,pine:XMAS.pine,sack:'#9c3a2e',trace:'#8f2a24',rein:XMAS.gold};

// ═════ 치수(썰매 로컬). 연결·탄 사람·별이 모두 이 값을 쓴다.
export const SLEIGH=Object.freeze({
 length:1.9,width:1.3,
 seat:Object.freeze([-.12,.56,.34]),            // 좌석 쿠션 윗면(탄 사람 엉덩이 자리). 오른쪽은 선물 자루
 sitY:.34,                                      // 앉기 자세(poses.js setSit) 좌판 높이 — 회전목마 썰매 의자와 같은 자세
 hands:Object.freeze([[-.25,.74,.06],[.01,.74,.06]]), // 탄 사람 손(고삐 끝) 왼·오
 dash:Object.freeze([[-.22,.86,-.6],[.22,.86,-.6]]),  // 빈 썰매일 때 고삐를 걸어 두는 앞판 위
 hitchY:.32,hitchZ:-.9,                         // 끄는 끈이 걸리는 썰매 앞(높이·앞뒤)
 tow:2.35,pairGap:.42,                          // 썰매 원점 → 루돌프 둘 가운데 거리, 가운데 → 루돌프 한 마리 옆 거리
 pivot:Object.freeze([0,.5,0]),                 // 기울기·흔들림 기준점
 trail:Object.freeze([0,.06,.92]),              // 별이 떨어지는 곳(썰매 날 바닥 뒤쪽, 설계 §5)
 runners:Object.freeze([[-.55,.02,.86],[.55,.02,.86]]), // 썰매 날 뒤 끝(땅에서 눈 튐)
 hit:Object.freeze({r:1}),                      // 판정 원 반지름(앞 = 루돌프 가운데, 뒤 = 썰매) — 설계 §4
 bankMax:15*Math.PI/180,
});
export const SLEIGH_BUDGET=Object.freeze({pc:2600,mobile:1800,drawCalls:7});

// ═════ 썰매 형상
export function buildSleighGeometry({mobile=false}={}){
 const q=mobile?.55:.8,n=(k,min=4)=>Math.max(min,Math.round(k*q));
 const L=[],put=(g,c)=>L.push(paint(g,c));
 const B=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
 // 썰매 날(금): 뒤 끝 살짝 들림 → 바닥 → 앞에서 말려 올라감 + 받침 기둥
 for(const s of [-1,1]){const x=s*.55;
  put(tube([v(x,.1,.95),v(x,.035,.82),v(x,.03,.2),v(x,.03,-.55),v(x,.1,-.84),v(x,.3,-.96),v(x,.46,-.9),v(x,.44,-.79),v(x,.36,-.8)],.028,n(26),n(6)),K.gold);
  for(const z of [.62,.05,-.5])put(capsule(v(x,.03,z),v(x*.94,.26,z),.02,n(6)),K.goldDark);}
 // 옆판(빨강): 옆에서 본 모양을 판으로 뽑음 — 높게 말린 등받이·낮은 가운데·말려 올라간 앞머리
 const P=[[.78,.22],[.78,.92],[.66,1.04],[.5,1.0],[.4,.8],[.3,.66],[-.25,.64],[-.55,.74],[-.75,.92],[-.92,.96],[-.98,.86],[-.86,.8],[-.72,.6],[-.66,.22]];
 const sh=new THREE.Shape(P.map(([z,y])=>new THREE.Vector2(-z,y)));
 for(const s of [-1,1]){
  put(new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false}).rotateY(Math.PI/2).translate(s*.52-.03,0,0),V=>V.y<.3?K.bodyDark:K.body);
  // 금 테(옆판 윗선) + 금 소용돌이 장식 둘
  put(tube(P.slice(1,10).map(([z,y])=>v(s*.535,y,z)),.022,n(30),n(5)),K.gold);
  put(new THREE.TorusGeometry(.11,.016,n(4,3),n(14),Math.PI*1.6).rotateY(Math.PI/2).translate(s*.565,.48,.42),K.gold);
  put(new THREE.TorusGeometry(.07,.014,n(4,3),n(12),Math.PI*1.6).rotateY(Math.PI/2).rotateX(1.2).translate(s*.565,.56,-.58),K.gold);
  put(ell(v(s*.566,.44,-.05),v(.012,.05,.05),6,5),K.gold);}
 // 바닥·좌석(흰 털 쿠션)·등받이(빨강 + 흰 털 쿠션 + 금 테)·앞판(빨강)
 put(B(1.0,.1,1.4,0,.27,.05),K.bodyDark);
 put(B(1.0,.2,.42,0,.46,.36),K.fur);put(capsule(v(-.48,.565,.17),v(.48,.565,.17),.035,n(6)),K.fur);
 put(B(1.0,.5,.12,0,.76,.68),K.body);put(B(.9,.36,.06,0,.75,.6),K.fur);put(capsule(v(-.5,1.01,.68),v(.5,1.01,.68),.025,n(6)),K.gold);
 put(B(1.0,.46,.08,0,.55,-.63),K.body);put(capsule(v(-.5,.79,-.63),v(.5,.79,-.63),.025,n(6)),K.gold);
 // 앞판 화환(초록 고리 + 빨간 리본·열매) · 앞 모서리 금방울
 put(new THREE.TorusGeometry(.12,.035,n(5,3),n(14)).translate(0,.57,-.68),K.pine);
 for(const s of [-1,1])put(ell(v(s*.045,.47,-.71),v(.04,.025,.012),6,4).rotateZ(s*.5),K.body);
 for(const [x,y] of [[-.06,.66],[.07,.62],[.0,.69]])put(ell(v(x,y,-.715),v(.016,.016,.016),5,4),K.body);
 for(const s of [-1,1]){put(ell(v(s*.46,.84,-.72),v(.038,.038,.038),n(8,5),n(6,4)),V=>V.y<.83?K.goldDark:K.gold);put(capsule(v(s*.46,.88,-.72),v(s*.48,.94,-.7),.008,4),K.goldDark);}
 // 선물 자루(좌석 오른쪽) + 삐져나온 선물 둘
 put(ell(v(.3,.68,.4),v(.17,.2,.17),n(10),n(8),V=>{if(V.y>.6)V.multiplyScalar(.75);}),K.sack);
 put(new THREE.TorusGeometry(.07,.016,4,n(10)).rotateX(Math.PI/2).translate(.3,.81,.4),K.gold);
 put(B(.13,.13,.13,.26,.89,.37).rotateY(.3),XMAS.giftBox);put(B(.1,.1,.1,.36,.87,.45),XMAS.ornGold);
 return mergeGeometries(L);
}
export const sleighTriangles=geo=>triangleCount(geo);

// ═════ 썰매 여러 대(그리기 7번). max = 동시에 그릴 썰매 수(정류장 1 + 정원 30 = 31 권장). heightAt(x,z) = 땅 높이(땅 모드에서 붙임).
// 쓰는 법(월드개발): const team=fleet.spawn(); team.place(...)/drive(...); team.mode='run'; fleet.update(dt);
//   team.seat(v)·team.seatQuat(q)·team.hand(0|1,v)·team.trailPoint(v)·team.runner(0|1,v)·team.front·team.back(판정 원 가운데)
export function createSkySleighFleet({toon=null,max=31,mobile=false,heightAt=()=>0,parent=null}={}){
 const group=new THREE.Group();group.name='하늘 썰매';
 const herd=createReindeerHerd({toon,max:max*2,mobile,parent:group,name:'썰매 루돌프'});
 const bound=new THREE.Sphere(new Vector3(),1);
 const vc=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 const sleighMesh=new THREE.InstancedMesh(buildSleighGeometry({mobile}),vc,max);sleighMesh.name='하늘 썰매 몸';sleighMesh.count=0;sleighMesh.boundingSphere=bound;sleighMesh.castShadow=!mobile;sleighMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 // 끈: 길이 1짜리 가는 원기둥을 두 점 사이로 늘려 놓는다(끄는 끈 = 짙은 빨강 가죽, 고삐 = 금)
 const lineMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,metalness:0});
 const lineMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.013,.013,1,4,1,true).translate(0,.5,0),lineMat,max*6);lineMesh.name='하늘 썰매 끈';lineMesh.count=0;lineMesh.boundingSphere=bound;lineMesh.userData.line=0;
 lineMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);lineMesh.setColorAt(0,new THREE.Color());
 if(toon?.toonify){toon.toonify(sleighMesh,{kind:'prop'});toon.toonify(lineMesh,{kind:'prop'});}
 group.add(sleighMesh,lineMesh);if(parent)parent.add(group);
 const live=[],cTrace=new THREE.Color(K.trace),cRein=new THREE.Color(K.rein).multiplyScalar(1.1);
 const M=new Matrix4(),Q=new Quaternion(),E=new Euler(0,0,0,'YXZ'),P=v(),S1=v(1,1,1),A=v(),Bv=v(),D=v(),UPY=v(0,1,0);
 const air=m=>m==='takeoff'||m==='fly'||m==='land';
 function spawn(){
  if(live.length>=max)return null;
  const deer=[herd.spawn(),herd.spawn()];
  const t={x:0,y:0,z:0,heading:0,lead:0,fx:0,fy:0,fz:0,mode:'stand',progress:0,speed:0,driver:false,pair:true,visible:true,
   _bank:0,_pitch:0,_lh:null,_t:Math.random()*10,_m:new Matrix4(),deer,
   // 썰매 자리를 바로 정함(루돌프는 곧게 앞에)
   place(x,y,z,heading=t.heading){t.x=x;t.z=z;t.heading=t.lead=heading;t.y=air(t.mode)?y:heightAt(x,z);
    t.fx=x-Math.sin(heading)*SLEIGH.tow;t.fz=z-Math.cos(heading)*SLEIGH.tow;t.fy=air(t.mode)?y:heightAt(t.fx,t.fz);t._lh=null;t._bank=t._pitch=0;pose(t,0);return t;},
   // 루돌프 가운데(앞)를 움직이고 썰매는 끌려옴
   drive(x,y,z,heading=t.lead){t.fx=x;t.fz=z;t.lead=heading;t.fy=air(t.mode)?y:heightAt(x,z);
    let dx=t.x-x,dy=t.y-t.fy,dz=t.z-z,l=Math.hypot(dx,dy,dz);if(l<1e-4){dx=Math.sin(heading);dz=Math.cos(heading);dy=0;l=1;}
    const k=SLEIGH.tow/l;t.x=x+dx*k;t.z=z+dz*k;t.y=t.fy+dy*k;
    const g=heightAt(t.x,t.z);if(!air(t.mode)||t.y<g)t.y=g;
    t.heading=Math.atan2(t.x-x,t.z-z);pose(t,0);return t;},
   seat(o=v()){const [a,b,c]=SLEIGH.seat;return o.set(a,b,c).applyMatrix4(t._m);},
   seatQuat(q=new Quaternion()){t._m.decompose(P,q,S1);S1.set(1,1,1);return q;},
   hand(side,o=v()){const [a,b,c]=(t.driver?SLEIGH.hands:SLEIGH.dash)[side?1:0];return o.set(a,b,c).applyMatrix4(t._m);},
   trailPoint(o=v()){const [a,b,c]=SLEIGH.trail;return o.set(a,b,c).applyMatrix4(t._m);},
   runner(side,o=v()){const [a,b,c]=SLEIGH.runners[side?1:0];return o.set(a,b,c).applyMatrix4(t._m);},
   get front(){return {x:t.fx,y:t.fy,z:t.fz,r:SLEIGH.hit.r};},get back(){return {x:t.x,y:t.y,z:t.z,r:SLEIGH.hit.r};},
   release(){const i=live.indexOf(t);if(i>=0)live.splice(i,1);for(const d of deer)d.release();},
  };
  live.push(t);t.place(0,0,0,0);return t;
 }
 // 썰매 행렬 + 루돌프 자리. dt>0(fleet.update)일 때만 기울기를 따라가고, drive·place(dt 0)는 지금 기울기로 자리만 옮긴다
 function pose(t,dt){
  const a=air(t.mode);
  if(dt>0){const k=Math.min(1,dt*4);let turn=t._lh==null?0:t.heading-t._lh;turn=Math.atan2(Math.sin(turn),Math.cos(turn))/dt;t._lh=t.heading;
   // 돌 때 바깥쪽으로(왼쪽으로 돌면 오른쪽이 내려감), 최대 15°
   const tb=Math.max(-SLEIGH.bankMax,Math.min(SLEIGH.bankMax,-turn*.3*(a?1:.6)));t._bank+=(tb-t._bank)*k;
   const horiz=Math.hypot(t.fx-t.x,t.fz-t.z)||1,tp=a?Math.max(-.35,Math.min(.35,Math.atan2(t.fy-t.y,horiz)*.8)):0;t._pitch+=(tp-t._pitch)*k;}
  const sway=a?.035*Math.sin(t._t*1.3):0,bob=a?.04*Math.sin(t._t*1.9):0;
  const [px,py,pz]=SLEIGH.pivot;E.set(t._pitch,t.heading,t._bank+sway);Q.setFromEuler(E);
  // 기준점을 돌려 놓기: M = T(pos)·T(pivot)·R·T(−pivot)
  D.set(px,py,pz).applyQuaternion(Q);P.set(t.x+px-D.x,t.y+bob+py-D.y,t.z+pz-D.z);t._m.compose(P,Q,S1);
  // 루돌프: 앞 가운데 ± 옆(루돌프 방향 기준). 한 마리 모드면 가운데 하나
  const rx=Math.cos(t.lead),rz=-Math.sin(t.lead);
  t.deer.forEach((d,i)=>{const on=t.visible&&(t.pair||i===0);d.visible=on;if(!on)return;const off=t.pair?(i?1:-1)*SLEIGH.pairGap:0,x=t.fx+rx*off,z=t.fz+rz*off;
   d.mode=t.mode;d.progress=t.progress;d.speed=t.speed;d.set(x,a?t.fy:heightAt(x,z),z,t.lead);});
 }
 function line(i,a,b,c){D.subVectors(b,a);const l=D.length();Q.setFromUnitVectors(UPY,D.multiplyScalar(1/(l||1)));M.compose(a,Q,P.set(1,l,1));lineMesh.setMatrixAt(i,M);lineMesh.setColorAt(i,c);}
 function update(dt){
  let n=0,m=0,cx=0,cy=0,cz=0;
  for(const t of live){t._t+=dt;if(!t.visible){t.deer.forEach(d=>d.visible=false);continue;}
   pose(t,dt);sleighMesh.setMatrixAt(n++,t._m);cx+=t.x;cy+=t.y;cz+=t.z;}
  herd.update(dt);
  // 끈은 루돌프 자세가 정해진 뒤에
  for(const t of live){if(!t.visible)continue;const list=t.pair?t.deer:[t.deer[0]];
   list.forEach((d,j)=>{const base=t.pair?(j?1:-1)*SLEIGH.pairGap:0;
    for(const side of [0,1]){d.trace(side,A);Bv.set(base+(side?.16:-.16),SLEIGH.hitchY,SLEIGH.hitchZ).applyMatrix4(t._m);line(m++,A,Bv,cTrace);}});
   // 고삐: 왼쪽 루돌프 왼 고리 → 왼손, 오른쪽 루돌프 오른 고리 → 오른손
   for(const side of [0,1]){const d=t.pair?t.deer[side]:t.deer[0];d.bit(side,A);t.hand(side,Bv);line(m++,A,Bv,cRein);}}
  sleighMesh.count=n;lineMesh.count=m;sleighMesh.visible=lineMesh.visible=n>0;
  if(n){cx/=n;cy/=n;cz/=n;let r=0;for(const t of live)if(t.visible)r=Math.max(r,Math.hypot(t.x-cx,t.y-cy,t.z-cz));bound.center.set(cx,cy+.6,cz);bound.radius=r+SLEIGH.tow+1.6;}
  sleighMesh.instanceMatrix.needsUpdate=lineMesh.instanceMatrix.needsUpdate=true;if(lineMesh.instanceColor)lineMesh.instanceColor.needsUpdate=true;
 }
 return {group,herd,spawn,update,max,get live(){return live.length;},meshes:{sleigh:sleighMesh,lines:lineMesh},
  drawCalls:SLEIGH_BUDGET.drawCalls,triangles:{sleigh:triangleCount(sleighMesh.geometry),deer:herd.triangles},
  dispose(){herd.dispose();sleighMesh.geometry.dispose();lineMesh.geometry.dispose();vc.dispose();lineMat.dispose();group.removeFromParent();}};
}
