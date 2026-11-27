// 새 기계 ② 줄 자르기 「가위로 툭」 그림(월드아트, 2026-11-27). 규칙·판정·흔들림 식은 월드디자인 규칙서 v1 §2 → claw-rules.js(월드공통개발).
// 몸통·조작대·인형 나오는 문·투입구·간판 상자는 집게 기계와 같은 몸(bodyKit, 높이 = 11-26 12cm 올린 CLAW 1.74m) — 가게 자리·부딪힘·서는 자리·조작 자세가 그대로 맞는다.
// 유리 상자 안: 천장 걸이 두 곳에서 줄 2개가 내려오고 줄 끝에 큰 인형(BIG_PLUSH) 하나씩. 앞 레일을 따라 오른쪽으로만 가는 큰 가위(손잡이는 손님 쪽, 칼날은 안쪽으로 길게).
//  두 인형이 겹치지 않게 줄 A(왼쪽)는 뒤·짧게, 줄 B(오른쪽)는 앞·길게 매단다. 판정은 x 하나(규칙서)라 깊이·줄 길이가 달라도 판정은 같다.
//  가위 칼날은 안쪽(−Z)으로 0.5m — 두 줄의 깊이를 모두 지나간다. 칼날 가운데 선 양옆 노란 괄호 = 판정 폭(그림 = 판정, setGuide).
//  직원 도움: 천장에서 초록 「직원」 팔이 내려와 자르는 곳 바로 아래에서 줄을 잡는다(흔들림 0, 동작 0.6초).
// 좌표는 집게 기계와 같음: 앞 +Z, 바닥 y=0, 가운데 x=0. 규칙 좌표 u(0 ~ inner, 왼쪽 0) ↔ 기계 x = u − inner/2 (STRING.toX).
// 메모리: 몸통 재질별 합친 메시 + 유리 1 + 간판 1 + 줄 4토막(원기둥 공유) + 가위 부품 몇 개 + 큰 인형 2(형상 공유). 캔버스는 간판·「직원」 표 2장뿐(바뀌지 않음).
// 실제 오락실 상표·로고는 쓰지 않는다.
import * as THREE from 'three';
import {CLAW,lightController,machineKit} from './claw-machine-art.js';
import {bodyKit} from './claw-machines-more.js';
import {makePlush,plushSize} from './claw-plush.js';

const {builder,std,FONT,canvasTex,signMesh}=machineKit;

// 기계 색·이름(추천안·대표 미확인). 월드공통개발이 claw-palette.js MACHINES에 붙일 때 이 값을 그대로 쓰면 된다(mk의 trim·accent·light 표에 'string' 줄 추가).
export const STRING_THEME=Object.freeze({id:'string-1',kind:'string',name:'가위로 툭',sub:'줄 자르기',body:'#d8434f',bodyDark:'#a12c3a',trim:'#fff1ea',accent:'#ffc43d',light:'#ffe3c2',
 level:3,pool:Object.freeze(['big-rudolph','big-squirrel']),prizes:Object.freeze(['big-rudolph','big-squirrel'])}); // 줄 1(왼쪽)·줄 2(오른쪽) 큰 인형

const INNER=.60;
export const STRING=Object.freeze({
 inner:INNER,                                    // 규칙 좌표 폭(m) — 규칙서 string.inner
 toX:u=>u-INNER/2,                               // 규칙 좌표 → 기계 x
 toU:x=>x+INNER/2,
 strings:Object.freeze([.22,.42]),               // 줄 자리(규칙 좌표) — 규칙서 string.strings
 hangY:1.395,                                    // 천장 걸이 높이
 cutY:1.17,                                      // 자르는 높이(가위 칼날 면). 흔들림 진폭은 이 높이에서 잰 값. 인형 머리 바로 위라 인형 흔들림이 1.3~1.4배로 크지 않음
 depth:Object.freeze([-.15,.11]),                // 줄 깊이 z(A 뒤·B 앞) — 큰 인형 둘이 겹치지 않게
 tie:Object.freeze([1.10,1.07]),                 // 인형 머리(줄 끝) 높이. A(뒤)가 조금 높아 B 너머로 보임
 rail:Object.freeze({y:1.125,z:.3,u0:.02,u1:.58}),// 가위 레일(앞·칼날 아래 — 위에서 비스듬히 보는 카메라에서 칼날을 안 가림, 규칙 좌표 start .04 ~ end .56보다 조금 넓게)
 blade:Object.freeze({pivotZ:.26,len:.5,open:.2}),// 칼날 축 z·길이·벌린 각(rad)
 button:Object.freeze([0,.5,.56]),               // 큰 단추(열쇠·불빛 쌓기와 같은 자리)
 // 조작 카메라(기계 좌표). ① 전체: 두 줄·인형·가위·레일 눈금이 동동이 머리 위로. ② 자르기(규칙서 zoom 2.2): cutCamera(u)
 camera:Object.freeze({pos:[0,1.6,1.72],look:[0,.98,0],fov:44,portrait:Object.freeze({pos:[0,1.66,2.15],look:[0,.97,0],fov:58})}),
 zoom:2.2,
});
// ② 자르기 카메라: 가위 자리(규칙 좌표 u)를 보며 다가감. fov = 전체 fov / zoom(같은 거리에서 2.2배)과 거리 줄이기를 반씩
export function cutCamera(u,{portrait=false}={}){const c=portrait?STRING.camera.portrait:STRING.camera,x=STRING.toX(u),k=Math.sqrt(STRING.zoom);
 const look=[x*.85,STRING.cutY-.03,-.03],off=[c.pos[0]-c.look[0],c.pos[1]-c.look[1],c.pos[2]-c.look[2]];   // 전체 카메라와 같은 방향에서 거리만 1/√zoom
 const pos=[x*.6+off[0]/k,look[1]+off[1]/k,look[2]+off[2]/k];return {pos,look,fov:c.fov/k};}

// 줄 끝에 매단 인형 높이에서의 흔들림 = 자르는 높이 흔들림 × (걸이→인형 / 걸이→자르는 곳)
const lever=i=>(STRING.hangY-STRING.tie[i])/(STRING.hangY-STRING.cutY);

function ownSign(M,w,h){ // 간판 아틀라스(MACHINES에 붙기 전)에 없을 때 쓰는 한 장
 const tex=canvasTex(512,192,(g,W,H)=>{g.fillStyle=M.bodyDark;g.fillRect(0,0,W,H);g.fillStyle=M.trim;g.beginPath();g.roundRect(10,10,W-20,H-20,28);g.fill();
  drawStringGlyph(g,96,96,120,M.body);g.fillStyle=M.bodyDark;g.textAlign='left';g.textBaseline='middle';g.font=`900 62px ${FONT}`;g.fillText(M.name,176,74);
  g.fillStyle=M.body;g.font=`800 40px ${FONT}`;g.fillText(M.sub,180,140);});
 if(!tex)return null;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));m.name='간판';return m;}
// 간판 종류 그림(가위). claw-machine-art.js kindGlyph에 'string' 줄로 옮겨 쓸 수 있게 따로 둠(g, 가운데 x·y, 크기 s, 색)
export {drawStringGlyph} from './claw-string-glyph.js'; // 그림은 claw-string-glyph.js(간판판과 순환 import 피함)
import {drawStringGlyph} from './claw-string-glyph.js';

/**
 * 줄 자르기 기계. theme = STRING_THEME 꼴 객체(또는 MACHINES의 줄).
 * 반환 group.userData:
 *  kind 'string', machine, height, camera(STRING.camera), cutCamera(u,{portrait}),
 *  setBlade({u, open}) — 가위 자리(규칙 좌표 m)·벌림(1 활짝 ~ 0 닫힘). snip() = 0.12초 닫힘 연출, blade(지금 값)
 *  setString(i,{dx}) — 줄 i(0·1)의 자르는 높이 흔들림(m, +오른쪽). 매 프레임 규칙 식 값을 넣는다(직원 도움이면 0)
 *  cutString(i,{dx}) — 끊김: 아래 토막·인형이 떨어져 바닥(유리 안)에 앉음(약 0.7초, update가 그림). 끝나면 onLanded(i, prize) 부름
 *  nickString(i,{dx}) — 아까움: 자르는 곳에 반쯤 잘린 주황 자국(줄은 그대로)
 *  resetStrings() — 다음 판(새 줄·인형 제자리·자국 지움·직원 팔 올림)
 *  setPrizes([idA,idB]) · prizes(인형 물체 둘) · setStaff(on) 직원 팔(0.6초 내려옴/올라감) · setGuide({on, half}) 노란 괄호(판정 반폭 m)
 *  setButton('move'|'cut'|'off') 빨강 → 주황 → 회색 · press(k) · setLights · update(dt)
 *  spots{stand,button,coin,door,sign,display, strings:[걸이 자리 둘], cut:[자르는 곳 둘], floor(떨어진 인형 자리 둘)}
 */
export function buildStringMachine(theme=STRING_THEME,{toonify=null}={}){
 const M=theme,C=CLAW,W=C.width,D=C.depth,hw=W/2,hd=D/2,S=STRING,root=new THREE.Group();root.name=`인형뽑기 기계:${M.id}`;
 const mats={...bodyKit.machineMats(M),cushion:std('#ffe6d6'),rope:std('#f4ead2',{roughness:.9}),blade:std('#e4e9ee',{roughness:.25,metalness:.55}),
  handle:std(M.body,{roughness:.45}),ruler:std('#2b2f36')},b=builder(),late=[];
 bodyKit.lowerBody(b,M);
 // 유리 안: 폭신한 바닥(인형이 떨어지는 곳, 가운데가 낮은 쿠션 두 장)·뒷벽(빛남)·천장판
 b.box('floor',W-.06,.02,D-.06,0,C.floorY-.005,0);
 b.rbox('cushion',W-.12,.05,D-.16,.024,0,C.floorY+.02,-.01);
 for(const sx of [-1,1])b.rbox('cushion',.08,.08,D-.16,.03,sx*(hw-.1),C.floorY+.04,-.01);
 b.box('back',W-.07,C.glassTop-C.floorY-.02,.012,0,(C.glassTop+C.floorY)/2,-hd+.04);
 b.box('dark',W-.08,.022,D-.08,0,C.glassTop-.012,0);
 // 걸이: 천장에서 짧은 금 막대 + 고리
 S.strings.forEach((u,i)=>{const x=S.toX(u),z=S.depth[i];b.cyl('gold',.012,.012,C.glassTop-.02-S.hangY,x,(C.glassTop-.02+S.hangY)/2,z,{seg:8});b.sph('gold',.016,x,S.hangY,z,10);});
 // 가위 레일(앞): 금속 봉 + 아래 눈금자(2cm마다 작은 눈금, 10cm마다 긴 눈금) + 양 끝 멈춤 덩이
 const R=S.rail,x0=S.toX(R.u0),x1=S.toX(R.u1);
 b.cyl('metal',.009,.009,x1-x0+.04,(x0+x1)/2,R.y,R.z,{seg:10,rz:Math.PI/2});
 b.rbox('ruler',x1-x0+.02,.02,.005,.003,(x0+x1)/2,R.y-.004,R.z+.012);
 for(let u=R.u0;u<=R.u1+1e-6;u+=.02){const big=Math.round(u*100)%10===0;b.box('trim',.0025,big?.016:.008,.004,S.toX(u),R.y-.004+(big?0:.004),R.z+.0155);}
 for(const x of [x0-.02,x1+.02])b.rbox('dark',.03,.05,.04,.01,x,R.y,R.z);
 // 기둥에서 레일을 받치는 팔
 for(const x of [-hw+.04,hw-.04])b.box('dark',Math.abs(x-(x<0?x0-.02:x1+.02))+.01,.016,.016,(x+(x<0?x0-.02:x1+.02))/2,R.y,R.z);
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,-hd+.08);
 // 조작대 단추 옆 화살표 판(→ 오른쪽만)
 b.rbox('trim',.12,.012,.05,.004,-.13,C.panel.top+.006,S.button[2]);
 b.build(mats,root,{outline:new Set(['body','top','dark','cushion'])});
 bodyKit.glassBox(root,late,{chuteGuard:false});
 // ── 가위: 수레(레일 위) + 손잡이 고리 둘(손님 쪽) + 축 + 칼날 둘(안쪽으로)
 const blade=new THREE.Group();blade.name='가위';root.add(blade);
 const bb=builder();
 bb.rbox('accent',.06,.036,.05,.012,0,R.y+.004,R.z);                         // 수레(레일을 감쌈)
 bb.box('dark',.014,S.cutY-R.y-.02,.014,0,(R.y+S.cutY)/2,R.z-.03);           // 수레 → 칼날 축 기둥(위로)
 bb.cyl('gold',.016,.016,.02,0,S.cutY+.008,S.blade.pivotZ,{seg:14});          // 축 나사
 const bg=new THREE.Group();bb.build(mats,bg,{outline:new Set(['accent','dark'])});blade.add(bg);
 const blades=[];
 for(const s of [-1,1]){const piv=new THREE.Group();piv.position.set(0,S.cutY+(s<0?.004:-.004),S.blade.pivotZ);blade.add(piv);
  // 칼날: 축에서 안쪽(−Z)으로 가늘어지는 판. 날 면이 칼날 가운데 선(x=0)에 오게 반폭만큼 비켜 둠
  const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(0,-S.blade.len);sh.quadraticCurveTo(s*.014,-S.blade.len+.02,s*.028,-S.blade.len*.55);sh.lineTo(s*.03,0);sh.lineTo(0,0);
  const g=new THREE.ExtrudeGeometry(sh,{depth:.006,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,.003,0);
  const m=new THREE.Mesh(g,mats.blade);m.castShadow=true;m.name='가위 칼날';piv.add(m);
  // 손잡이 고리(손님 쪽으로, 반대편)
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.03,.009,8,18).rotateX(Math.PI/2),mats.handle);ring.position.set(-s*.04,0,.055);ring.name='가위 손잡이';piv.add(ring);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(.012,.01,.05),mats.handle);arm.position.set(-s*.016,0,.022);arm.rotation.y=s*.6;piv.add(arm);
  blades.push({piv,s,mesh:m});}
 // 노란 괄호(판정 폭) + 가운데 빨간 점선: 칼날 바로 아래 얇은 띠(빛 계산 없음)
 const guide=new THREE.Group();guide.name='가위 괄호';blade.add(guide);
 const gMat=new THREE.MeshBasicMaterial({color:'#ffd36b',transparent:true,opacity:.95,depthWrite:false,toneMapped:false});
 const gl=[-1,1].map(s=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.002,.002,S.blade.len-.04),gMat);m.position.set(0,S.cutY+.008,S.blade.pivotZ-S.blade.len/2-.02);m.renderOrder=4;guide.add(m);return {m,s};});
 const cMat=new THREE.MeshBasicMaterial({color:'#ff5a4a',toneMapped:false,depthWrite:false});
 for(let k=0;k<10;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.0012,.0012,.018),cMat);m.position.set(0,S.cutY+.008,S.blade.pivotZ-.06-k*.045);m.renderOrder=4;guide.add(m);}
 // ── 줄 둘(위 토막 = 걸이→자르는 곳, 아래 토막 = 자르는 곳→인형) + 인형. 흔들림 = 걸이를 축으로 도는 진자
 const ropeGeo=new THREE.CylinderGeometry(.0018,.0018,1,6).translate(0,-.5,0);
 const strings=S.strings.map((u,i)=>{const x=S.toX(u),z=S.depth[i],pend=new THREE.Group();pend.name=`줄 ${i+1}`;pend.position.set(x,S.hangY,z);root.add(pend);
  const lc=S.hangY-S.cutY,lt=S.hangY-S.tie[i];
  const up=new THREE.Mesh(ropeGeo,mats.rope);up.scale.y=lc;pend.add(up);
  const low=new THREE.Group();low.position.y=-lc;pend.add(low);
  const dn=new THREE.Mesh(ropeGeo,mats.rope);dn.scale.y=lt-lc;low.add(dn);
  const knot=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),mats.rope);knot.position.y=-(lt-lc);low.add(knot);
  const nick=new THREE.Mesh(new THREE.TorusGeometry(.0045,.0018,6,12).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffb52b',toneMapped:false}));nick.position.y=-lc;nick.visible=false;nick.name='반쯤 잘린 자국';pend.add(nick);
  return {i,x,z,pend,up,low,dn,knot,nick,lc,lt,prize:null,id:null,dx:0,cut:null,rest:new THREE.Vector3()};});
 // 직원 팔: 천장에서 내려오는 초록 막대 + 벙어리장갑 손 + 「직원」 표. 줄 바로 오른쪽 뒤에서 자르는 곳 3cm 아래를 잡는다
 const staffTex=canvasTex(128,64,(g,w,h)=>{g.fillStyle='#3f9a62';g.beginPath();g.roundRect(2,2,w-4,h-4,14);g.fill();g.fillStyle='#fff';g.font=`900 34px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('직원',w/2,h/2+2);});
 const staffMat=std('#3f9a62',{roughness:.55}),mittMat=std('#8ff0b0',{roughness:.7});
 const staff=strings.map(s=>{const g=new THREE.Group();g.name=`직원 팔 ${s.i+1}`;root.add(g);
  const grabY=S.cutY-.035,top=C.glassTop-.03,rod=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,1,8).translate(0,-.5,0),staffMat);g.add(rod);
  const hand=new THREE.Group();g.add(hand);
  const mitt=new THREE.Mesh(new THREE.SphereGeometry(.018,12,9),mittMat);mitt.scale.set(1.1,.85,.8);hand.add(mitt);
  const thumb=new THREE.Mesh(new THREE.SphereGeometry(.008,8,6),mittMat);thumb.position.set(-.014,.004,.01);hand.add(thumb);
  const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.014,10),staffMat);cuff.position.y=.02;hand.add(cuff);
  if(staffTex){const tag=new THREE.Mesh(new THREE.PlaneGeometry(.05,.025),new THREE.MeshBasicMaterial({map:staffTex,toneMapped:false,side:THREE.DoubleSide}));tag.position.set(0,.05,.002);tag.name='직원 표';hand.add(tag);}
  g.position.set(s.x+.016,0,s.z+.004);toonify?.(g,{kind:'prop'});
  return {g,rod,hand,top,grabY,k:0,on:false};});
 const placeStaff=f=>{const k=f.k,e=k*k*(3-2*k),y=f.top+(f.grabY-f.top)*e;f.g.visible=k>.01;f.rod.scale.y=Math.max(.001,f.top-y);f.hand.position.y=y;};
 staff.forEach(placeStaff);
 // 큰 단추(① 빨강 오른쪽 · ② 주황 싹둑)
 const btn=new THREE.Mesh(new THREE.CylinderGeometry(.062,.065,.03,20),std('#e8443a',{emissive:new THREE.Color('#e8443a'),emissiveIntensity:.3,roughness:.4}));
 btn.position.set(S.button[0],C.panel.top+.025,S.button[2]);btn.name='가위 단추';root.add(btn);
 {const ring=new THREE.Mesh(new THREE.CylinderGeometry(.076,.076,.014,20),std('#2b2f36'));ring.position.set(S.button[0],C.panel.top+.008,S.button[2]);root.add(ring);}
 // 단추 옆 화살표(→)·가위 그림 판(빛나는 작은 판)
 {const t=canvasTex(128,48,(g,w,h)=>{g.fillStyle='#2b2f36';g.fillRect(0,0,w,h);g.fillStyle='#ffd36b';g.font=`900 34px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('→  ✂',w/2,h/2+2);});
  if(t){const m=new THREE.Mesh(new THREE.PlaneGeometry(.11,.04),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));m.rotation.x=-Math.PI/2;m.position.set(-.13,C.panel.top+.0135,S.button[2]);root.add(m);}}
 // 꼭대기 장식(멀리서도 「가위 기계」로 보이게): 빨간 손잡이 큰 가위
 {const cr=new THREE.Group();cr.name='꼭대기 가위';const cb=builder();
  for(const s of [-1,1]){cb.add('handle',new THREE.TorusGeometry(.055,.016,8,20).translate(s*.07,-.06,0));
   const bl=new THREE.BoxGeometry(.03,.2,.016);bl.translate(0,.1,0);bl.rotateZ(-s*.32);bl.translate(s*.02,-.01,0);cb.add('blade',bl);}
  cb.cyl('gold',.014,.014,.03,0,0,0,{seg:12,rx:Math.PI/2});
  cb.build(mats,cr,{outline:new Set(['handle','blade'])});cr.position.set(0,C.height+.075,-.05);root.add(cr);}
 bodyKit.finish(root,mats,toonify,late);
 {const m=signMesh(M,W*.86,W*.86*3/8)??ownSign(M,W*.86,W*.86*3/8);if(m){m.position.set(0,C.glassTop+(C.height-C.glassTop)/2,hd+.004);root.add(m);}}
 // ── 상태·움직임
 const st={u:S.rail.u0+.02,open:1,snipT:-1};
 const setBlade=({u=st.u,open=st.open}={})=>{st.u=u;st.open=open;blade.position.x=S.toX(u);const a=S.blade.open*Math.max(0,Math.min(1,open));for(const b2 of blades)b2.piv.rotation.y=-b2.s*a;};   // 칼날 끝이 자기 쪽 바깥으로 벌어짐
 const snip=()=>{st.snipT=0;};
 const setGuide=({on=true,half=.003}={})=>{guide.visible=on;for(const {m,s} of gl)m.position.x=s*half;};
 const poseString=s=>{s.pend.rotation.z=Math.asin(Math.max(-.9,Math.min(.9,s.dx/s.lc)));};   // 자르는 높이 점이 정확히 dx만큼 옆으로
 const setString=(i,{dx=0}={})=>{const s=strings[i];if(!s||s.cut)return;s.dx=dx;poseString(s);};
 const ground=i=>C.floorY+.045+(i===1?.0:.0);
 const cutString=(i,{dx=strings[i].dx}={})=>{const s=strings[i];if(!s||s.cut)return;s.dx=dx;poseString(s);
  // 아래 토막을 기계 좌표로 떼어 내 떨어뜨림(위 토막은 걸이에 남아 천천히 멈춤)
  s.pend.updateMatrix();const w=new THREE.Vector3(),q=new THREE.Quaternion();s.low.getWorldPosition(w);root.worldToLocal(w);
  s.pend.remove(s.low);root.add(s.low);s.low.position.copy(w);s.low.quaternion.copy(q.setFromEuler(new THREE.Euler(0,0,s.pend.rotation.z)));
  s.cut={t:0,v:0,y0:w.y,spin:(Math.random()-.5)*.6,landed:false,swing:s.pend.rotation.z};s.up.scale.y=s.lc-.004;};
 const nickString=(i,{dx=strings[i].dx}={})=>{const s=strings[i];if(!s)return;s.dx=dx;poseString(s);s.nick.visible=true;};
 const setPrizes=ids=>{ids.forEach((id,i)=>{const s=strings[i];if(!s)return;if(s.prize){s.low.remove(s.prize);s.prize=null;}s.id=id??null;if(!id)return;
  const o=makePlush(id,{toonify}),h=plushSize(id);o.position.y=-(s.lt-s.lc)-h+.012;o.rotation.y=i===0?.18:-.22;o.name=`매달린 인형:${id}`;s.low.add(o);s.prize=o;});};
 const resetStrings=()=>{strings.forEach(s=>{if(s.cut){root.remove(s.low);s.pend.add(s.low);s.low.position.set(0,-s.lc,0);s.low.quaternion.identity();s.cut=null;}
  s.up.scale.y=s.lc;s.nick.visible=false;s.dx=0;poseString(s);});setStaff(false,true);};
 const setStaff=(on,instant=false)=>{for(const f of staff){f.on=on;if(instant){f.k=on?1:0;placeStaff(f);}}};
 const BTN={move:'#e8443a',cut:'#ff9a2b',off:'#9a948a'};
 const setButton=m=>{const c=BTN[m]??BTN.off;btn.material.color.set(c);btn.material.emissive.set(c);btn.material.emissiveIntensity=m==='off'?.05:.35;};
 const press=(k=1)=>{btn.position.y=C.panel.top+.025-.012*k;};
 const lights=lightController(M,mats);
 let onLanded=null;
 const update=dt=>{lights.update(dt);
  if(st.snipT>=0){st.snipT+=dt;const k=Math.min(1,st.snipT/.12);setBlade({open:1-k});if(k>=1)st.snipT=-1;}
  for(const f of staff){const tgt=f.on?1:0;if(f.k!==tgt){f.k=Math.max(0,Math.min(1,f.k+(tgt>f.k?1:-1)*dt/.6));placeStaff(f);}}
  for(const s of strings){if(!s.cut)continue;const c=s.cut;c.t+=dt;
   // 남은 위 토막: 흔들림이 0.8초에 걸쳐 가라앉음
   s.pend.rotation.z=c.swing*Math.exp(-c.t*4)*Math.cos(c.t*9);
   if(c.landed)continue;c.v+=9.8*dt;s.low.position.y-=c.v*dt;s.low.rotation.z+=c.spin*dt;
   const h=s.prize?plushSize(s.id):0,floor=ground(s.i)+(s.lt-s.lc)+h-.012;   // 인형 발이 쿠션에 닿는 아래 토막 높이
   if(s.low.position.y<=floor){s.low.position.y=floor;s.low.rotation.z*=.3;c.landed=true;s.dn.visible=false;s.knot.visible=false;onLanded?.(s.i,s.prize);}}
 };
 setBlade({});setGuide({on:false});setPrizes(M.prizes??M.pool??[]);
 const lc0=S.hangY-S.cutY;
 root.userData={kind:'string',machine:M,height:C.height+.18,camera:S.camera,cutCamera,setBlade,snip,get blade(){return {u:st.u,open:st.open};},setString,cutString,nickString,resetStrings,setPrizes,
  get prizes(){return strings.map(s=>s.prize);},setStaff,setGuide,setButton,press,setLights:lights.setLights,update,mats,
  set onLanded(f){onLanded=f;},get onLanded(){return onLanded;},lever,
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),button:new THREE.Vector3(S.button[0],C.panel.top+.04,S.button[2]),coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),
   door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),sign:new THREE.Vector3(0,C.height+.33,0),display:new THREE.Vector3(0,S.cutY,0),
   strings:strings.map(s=>new THREE.Vector3(s.x,S.hangY,s.z)),cut:strings.map(s=>new THREE.Vector3(s.x,S.hangY-lc0,s.z)),floor:strings.map(s=>new THREE.Vector3(s.x,ground(s.i),s.z))},pile:null};
 return root;
}
