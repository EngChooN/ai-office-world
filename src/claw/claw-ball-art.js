// 새 기계 ③ 공 구멍 넣기 「공 떨어뜨리기」 그림(월드아트, 2026-11-27). 규칙·판정·공 물리는 월드디자인 규칙서 v1 §3 → 월드공통개발.
// 몸통·조작대·인형 나오는 문·투입구·간판 상자는 집게 기계와 같은 몸(bodyKit, 높이 = 11-26 12cm 올린 CLAW 1.74m) — 가게 자리·부딪힘·서는 자리가 그대로 맞는다.
// 유리 상자 안: 가운데 받침대 위 나무 구멍 판(4×4, 간격 6cm, 둘레 벽 = 공이 되튀는 곳) + 판 뒤 경품 단(구멍 색과 같은 띠의 인형 실물) + 작은 공 집게(레일·수레·두 손가락).
//  판 무늬(나무·구멍·색 고리·번호)는 캔버스 한 장 — 구멍 그림 크기 = 판정 크기(holeR·rareHoleR). 도움 구멍(초록)은 setPity로 다시 그림.
//  들어간 구멍 표시(초록·주황·빨강 고리)는 판 위 고리 메시 하나를 옮겨 씀(markHole).
// 좌표: 기계 좌표는 집게 기계와 같음(앞 +Z, 바닥 y=0). 판 좌표 (x, z) = 판 가운데 원점 m, 구멍 (i, j) 가운데 = ((i+.5)·pitch − half, (j+.5)·pitch − half) — 규칙서 시안 cellC와 같음(j 작을수록 뒤).
// 실제 오락실 상표·로고는 쓰지 않는다.
import * as THREE from 'three';
import {CLAW,lightController,machineKit} from './claw-machine-art.js';
import {bodyKit} from './claw-machines-more.js';
import {makePlush,plushSize} from './claw-plush.js';

const {builder,std,FONT,canvasTex,signMesh}=machineKit;

// 기계 색·이름·구멍 경품(추천안·대표 미확인). 노랑 = 흔함 새 인형 둘(꿀밤이·몽글이), 보라 = 희귀 돔돌이(지금 집게 6에만 있어 나오는 곳을 늘림), 도움 구멍 = 눈송이.
export const BALL_THEME=Object.freeze({id:'ball-1',kind:'ball',name:'공 떨어뜨리기',sub:'공 구멍 넣기',body:'#2f9fc0',bodyDark:'#1f6f8a',trim:'#eaf8ff',accent:'#ffd23a',light:'#c9f1ff',
 level:2,pool:Object.freeze(['kkulbam','mongle','domdol','nunsong']),
 holes:Object.freeze({'1,1':'kkulbam','2,2':'mongle','3,0':'domdol'}),rare:'3,0',pityHole:'1,2',pityPrize:'nunsong'});

const N=4,PITCH=.06,HALF=N*PITCH/2;
export const BALL=Object.freeze({
 n:N,pitch:PITCH,half:HALF,                      // 규칙서 ball.n·pitchM
 ballR:.013,holeR:.021,rareHoleR:.016,           // 공·구멍 반지름(m) — 규칙서 ball.ballR·holeR·rareHoleR
 board:Object.freeze({x:0,z:-.02,top:.74}),       // 판 가운데(기계 좌표)·윗면 높이(바닥 0.56 + 받침대)
 wall:.022,                                      // 둘레 벽 높이(공이 되튀는 곳)
 carryH:.09,                                     // 집게가 공을 든 높이(공 가운데, 판 위) — 시안 첫 낙하 0.09
 railY:1.37,                                     // 집게 레일 높이(집게 기계와 같음)
 button:Object.freeze([.17,.5,.56]),stick:Object.freeze([-.18,.5,.56]),   // 집게 기계와 같은 손잡이·단추 자리(조작 자세 그대로)
 // 조작 카메라(기계 좌표): 판을 위에서 약 55° 내려다봄(규칙서 §3 카메라). 동동이는 조작 중 내 화면에서 숨김
 camera:Object.freeze({pos:[0,1.4,.55],look:[0,.74,-.03],fov:32,portrait:Object.freeze({pos:[0,1.5,.62],look:[0,.73,-.02],fov:50})}),
});
export const holeCenter=(i,j)=>[(i+.5)*PITCH-HALF,(j+.5)*PITCH-HALF];
export const toLocal=(x,z,y=0)=>new THREE.Vector3(BALL.board.x+x,BALL.board.top+y,BALL.board.z+z);

// 판 무늬(캔버스). 1m = PXM 픽셀
const TEX=512,PAD_M=.025,PXM=TEX/(N*PITCH+PAD_M*2);
const RING=Object.freeze({yellow:'#ffd23a',rare:'#b07cff',pity:'#3fdc7a'});
function paintBoard(g,{holes,rare,pity,pityHole}){
 const px=v=>(v+HALF+PAD_M)*PXM;
 const gr=g.createLinearGradient(0,0,0,TEX);gr.addColorStop(0,'#d7a868');gr.addColorStop(1,'#ecc88f');g.fillStyle=gr;g.fillRect(0,0,TEX,TEX);
 // 나뭇결
 g.globalAlpha=.16;g.strokeStyle='#8a5a2b';g.lineWidth=2;for(let k=0;k<14;k++){const y=k*TEX/14+8;g.beginPath();g.moveTo(0,y);for(let x=0;x<=TEX;x+=32)g.lineTo(x,y+Math.sin(x*.02+k)*5);g.stroke();}g.globalAlpha=1;
 // 칸 선(옅은 격자 — 판정 칸 = 구멍 칸)
 g.strokeStyle='rgba(120,78,36,.28)';g.lineWidth=2;for(let k=1;k<N;k++){const p=px(k*PITCH-HALF);g.beginPath();g.moveTo(p,px(-HALF));g.lineTo(p,px(HALF));g.stroke();g.beginPath();g.moveTo(px(-HALF),p);g.lineTo(px(HALF),p);g.stroke();}
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const key=`${i},${j}`,[x,z]=holeCenter(i,j),cx=px(x),cy=px(z),isR=key===rare,r=(isR?BALL.rareHoleR:BALL.holeR)*PXM;
  const prize=holes[key]??(pity&&key===pityHole?'pity':null);
  // 색 고리(구멍 바깥 0.6cm)
  if(prize){g.fillStyle=prize==='pity'?RING.pity:isR?RING.rare:RING.yellow;g.beginPath();g.arc(cx,cy,r+.009*PXM,0,Math.PI*2);g.fill();
   g.strokeStyle='rgba(60,30,10,.55)';g.lineWidth=2;g.stroke();}
  // 구멍(안쪽 그늘 2단)
  g.fillStyle='#3a2414';g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fill();
  g.fillStyle='#1a0e06';g.beginPath();g.arc(cx,cy+r*.18,r*.78,0,Math.PI*2);g.fill();
  // 색 구멍 옆 작은 별(희귀 = 별 셋, 노랑 = 둘, 도움 = 손)
  if(prize){g.fillStyle=prize==='pity'?'#1f7a45':isR?'#6a3fc2':'#a2740a';g.font=`900 ${isR?24:24}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';
   g.fillText(prize==='pity'?'도움':isR?'★★★':'★',cx,cy-r-.015*PXM);}}
}

function ownSign(M,w,h){
 const tex=canvasTex(512,192,(g,W,H)=>{g.fillStyle=M.bodyDark;g.fillRect(0,0,W,H);g.fillStyle=M.trim;g.beginPath();g.roundRect(10,10,W-20,H-20,28);g.fill();
  drawBallGlyph(g,96,96,120,M.body);g.fillStyle=M.bodyDark;g.textAlign='left';g.textBaseline='middle';g.font=`900 52px ${FONT}`;g.fillText(M.name,176,74);
  g.fillStyle=M.body;g.font=`800 40px ${FONT}`;g.fillText(M.sub,180,140);});
 if(!tex)return null;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));m.name='간판';return m;}
// 간판 종류 그림(구멍 판 위 공). claw-machine-art.js kindGlyph에 'ball' 줄로 옮겨 쓸 수 있게 따로 둠
export {drawBallGlyph} from './claw-ball-glyph.js'; // 그림은 claw-ball-glyph.js(간판판과 순환 import 피함)
import {drawBallGlyph} from './claw-ball-glyph.js';

/**
 * 공 구멍 넣기 기계. theme = BALL_THEME 꼴 객체(또는 MACHINES의 줄).
 * 반환 group.userData:
 *  kind 'ball', machine, height, camera, board(판 가운데·윗면, 기계 좌표), holeCenter(i,j), toLocal(x,z,y)
 *  claw.set({x, z, open, has}) — 판 좌표 m, open 0(공 쥠) ~ 1(놓음), has = 공을 들고 있음. 그림자 점은 늘 집게 바로 아래 판 위
 *  setBall({x, z, h, sink, visible}) — 떨어진 공(판 좌표, h = 판 윗면 위 공 바닥 높이 m, sink 0~1 = 구멍 안으로 가라앉음)
 *  markHole(key|null, 'win'|'near'|'miss') · setPity(on) 도움 구멍 · setHoles({holes, rare, pityHole}) 구멍 경품 바꾸기(판 무늬 다시 그림)
 *  prizes{key: 인형 물체}(판 뒤 경품 단) · setButton('drop'|'off') · press(k) · setLights · update(dt)
 *  spots{stand,stick,button,coin,door,sign,display(판 가운데)}
 */
export function buildBallMachine(theme=BALL_THEME,{toonify=null}={}){
 const M=theme,C=CLAW,W=C.width,D=C.depth,hw=W/2,hd=D/2,B=BALL,bd=B.board,root=new THREE.Group();root.name=`인형뽑기 기계:${M.id}`;
 const mats={...bodyKit.machineMats(M),wood:std('#c48a4e'),woodDark:std('#8a5a2b'),ballMat:std('#fffdf6',{roughness:.35}),stand:std(M.bodyDark)},b=builder(),late=[];
 bodyKit.lowerBody(b,M);
 b.box('floor',W-.06,.02,D-.06,0,C.floorY-.005,0);
 b.box('back',W-.07,C.glassTop-C.floorY-.02,.012,0,(C.glassTop+C.floorY)/2,-hd+.04);
 // 받침대(바닥 → 판 아래) + 판 둘레 벽(나무 테, 공이 되튐)
 const fw=N*PITCH+PAD_M*2,wt=.016;
 b.rbox('stand',fw-.04,bd.top-C.floorY-.03,fw-.04,.02,bd.x,(bd.top+C.floorY-.03)/2,bd.z);
 b.rbox('accent',fw+.02,.02,fw+.02,.008,bd.x,bd.top-.035,bd.z);
 b.box('woodDark',fw,.024,fw,bd.x,bd.top-.012,bd.z);
 for(const s of [-1,1]){b.rbox('wood',fw+wt*2,B.wall+.024,wt,.005,bd.x,bd.top+B.wall/2-.012,bd.z+s*(fw/2+wt/2));
  b.rbox('wood',wt,B.wall+.024,fw,.005,bd.x+s*(fw/2+wt/2),bd.top+B.wall/2-.012,bd.z);}
 // 판 뒤 경품 단(3칸 계단) — 구멍 경품 실물이 놓임
 const shelfZ=bd.z-fw/2-.11,steps=[[-.17,.0],[0,.035],[.17,.0]];
 for(const [x,y] of steps){b.rbox('stand',.15,.1+y,.12,.015,x,C.floorY+.05+y/2,shelfZ);}
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,-hd+.08);
 b.build(mats,root,{outline:new Set(['body','top','dark','wood','stand'])});
 bodyKit.glassBox(root,late,{chuteGuard:false});
 // 경품 단 띠(구멍 색과 같은 색 — 어느 구멍이 무엇인지)
 const bandMats=[];
 // 판 윗면(캔버스 무늬)
 const cv=typeof document!=='undefined'?document.createElement('canvas'):null;let tex=null;
 const H={holes:{...(M.holes??{})},rare:M.rare??'3,0',pityHole:M.pityHole??'1,2',pity:false};
 if(cv){cv.width=cv.height=TEX;tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;}
 const top=new THREE.Mesh(new THREE.PlaneGeometry(fw,fw).rotateX(-Math.PI/2),std('#ffffff',{map:tex,emissiveMap:tex,emissive:new THREE.Color('#ffffff'),emissiveIntensity:.45,roughness:.75}));top.position.set(bd.x,bd.top+.0005,bd.z);top.receiveShadow=true;top.name='구멍 판';late.push(top);
 const repaint=()=>{if(!cv)return;paintBoard(cv.getContext('2d'),H);tex.needsUpdate=true;};
 // 들어간 구멍 표시 고리
 const mark=new THREE.Mesh(new THREE.RingGeometry(1,1.28,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#5fe17a',toneMapped:false,transparent:true,depthWrite:false}));mark.visible=false;mark.renderOrder=3;mark.name='구멍 표시';root.add(mark);
 const MARK={win:'#5fe17a',near:'#ffb52b',miss:'#ff5a4a'};
 const markHole=(key,kind='win')=>{if(!key){mark.visible=false;return;}const [i,j]=key.split(',').map(Number),[x,z]=holeCenter(i,j),r=(key===H.rare?B.rareHoleR:B.holeR)+.008;
  mark.scale.setScalar(r);mark.position.copy(toLocal(x,z,.002));mark.material.color.set(MARK[kind]??MARK.miss);mark.visible=true;};
 // 경품 인형(실물 70%)
 const prizes={},prizeRoot=new THREE.Group();prizeRoot.name='경품 단';root.add(prizeRoot);
 const placePrizes=()=>{for(const k of Object.keys(prizes)){prizeRoot.remove(prizes[k]);delete prizes[k];}for(const m of bandMats)m.parent?.remove(m);bandMats.length=0;
  const keys=Object.keys(H.holes).sort((a,b)=>(a===H.rare)-(b===H.rare));   // 희귀가 가운데 높은 단
  const order=[keys[0],keys.find(k=>k===H.rare)??keys[1],keys.filter(k=>k!==H.rare)[1]].filter(Boolean);
  order.forEach((key,n)=>{const id=H.holes[key],[x,y]=steps[n]??[0,0];if(!id)return;const o=makePlush(id,{toonify}),s=plushSize(id);o.scale.multiplyScalar(.7);
   o.position.set(x,C.floorY+.1+y,shelfZ+.005);o.rotation.y=-x*1.2;o.name=`경품 표시:${id}`;prizeRoot.add(o);prizes[key]=o;
   const band=new THREE.Mesh(new THREE.BoxGeometry(.152,.022,.004),new THREE.MeshBasicMaterial({color:key===H.rare?RING.rare:RING.yellow,toneMapped:false}));
   band.position.set(x,C.floorY+.075+y,shelfZ+.062);prizeRoot.add(band);bandMats.push(band);void s;});
  if(H.pity){const id=M.pityPrize;if(id){const o=makePlush(id,{toonify});o.scale.multiplyScalar(.55);o.position.set(.33,C.floorY,shelfZ+.02);o.name=`경품 표시:${id}`;prizeRoot.add(o);prizes[H.pityHole]=o;
   const band=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,.004),new THREE.MeshBasicMaterial({color:RING.pity,toneMapped:false}));band.position.set(.33,C.floorY+.012,shelfZ+.075);prizeRoot.add(band);bandMats.push(band);}}};
 const setHoles=({holes=H.holes,rare=H.rare,pityHole=H.pityHole}={})=>{H.holes={...holes};H.rare=rare;H.pityHole=pityHole;repaint();placePrizes();};
 const setPity=on=>{H.pity=!!on;repaint();placePrizes();};
 // ── 공 집게: 가로대(z로) → 수레(x로) → 줄 → 머리 + 두 손가락(공을 양옆에서 쥠)
 const claw=new THREE.Group();claw.name='공 집게';root.add(claw);
 const gantry=new THREE.Group();claw.add(gantry);
 gantry.add(new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,W-.08,8).rotateZ(Math.PI/2),mats.metal));
 const cart=new THREE.Group();gantry.add(cart);
 cart.add(new THREE.Mesh(new THREE.BoxGeometry(.07,.04,.06),mats.accent));
 const cable=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,1,6).translate(0,-.5,0),mats.dark);cart.add(cable);
 const head=new THREE.Group();cart.add(head);
 head.add(new THREE.Mesh(new THREE.CylinderGeometry(.022,.026,.03,12).translate(0,.035,0),mats.dark));
 head.add(new THREE.Mesh(new THREE.SphereGeometry(.014,10,8).translate(0,.022,0),mats.accent));
 const fingers=[-1,1].map(s=>{const p=new THREE.Group();p.position.set(s*.012,.022,0);head.add(p);
  const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(s*.014,-.012,0),new THREE.Vector3(s*.012,-.03,0),new THREE.Vector3(s*.002,-.04,0)];
  p.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),8,.004,6,false),mats.metal));
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.006,8,6),mats.accent);tip.position.copy(pts[3]);p.add(tip);return {p,s};});
 const held=new THREE.Mesh(new THREE.SphereGeometry(B.ballR,16,12),mats.ballMat);held.castShadow=true;held.name='집게 공';head.add(held);
 const dot=new THREE.Mesh(new THREE.CircleGeometry(B.ballR*1.05,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#20140a',transparent:true,opacity:.42,depthWrite:false}));dot.renderOrder=2;dot.name='그림자 점';root.add(dot);
 const cs={x:-HALF+.025,z:-HALF+.025,open:0,has:true};
 const setClaw=({x=cs.x,z=cs.z,open=cs.open,has=cs.has}={})=>{Object.assign(cs,{x,z,open,has});
  const p=toLocal(x,z);gantry.position.set(0,B.railY,p.z);cart.position.x=p.x;
  const headY=bd.top+B.carryH;const len=B.railY-headY-.022;cable.scale.y=len;head.position.y=-len-.022+.0;
  for(const f of fingers)f.p.rotation.z=f.s*(.05+open*.55);held.visible=has;held.position.set(0,0,0);
  dot.position.set(p.x,bd.top+.001,p.z);dot.visible=true;};
 // ── 떨어진 공
 const ball=new THREE.Mesh(new THREE.SphereGeometry(B.ballR,16,12),mats.ballMat);ball.castShadow=true;ball.visible=false;ball.name='공';root.add(ball);
 const setBall=({x=0,z=0,h=0,sink=0,visible=true}={})=>{ball.visible=visible;ball.position.copy(toLocal(x,z,B.ballR+h-sink*B.ballR*1.6));};
 // 큰 단추(떨어뜨리기)·손잡이: 집게 기계와 같은 자리
 const btn=new THREE.Mesh(new THREE.CylinderGeometry(.055,.058,.03,20),std('#ff9a2b',{emissive:new THREE.Color('#ff9a2b'),emissiveIntensity:.3,roughness:.4}));
 btn.position.set(B.button[0],C.panel.top+.025,B.button[2]);btn.name='떨어뜨리기 단추';root.add(btn);
 {const ring=new THREE.Mesh(new THREE.CylinderGeometry(.069,.069,.014,20),std('#2b2f36'));ring.position.set(B.button[0],C.panel.top+.008,B.button[2]);root.add(ring);
  const sb=builder();sb.cyl('dark',.006,.008,.09,B.stick[0],C.panel.top+.045,B.stick[2],{seg:8});sb.sph('accent',.026,B.stick[0],C.panel.top+.1,B.stick[2],12);
  sb.cyl('dark',.04,.045,.012,B.stick[0],C.panel.top+.006,B.stick[2],{seg:16});const sg=new THREE.Group();sb.build(mats,sg,{outline:new Set(['accent'])});sg.name='손잡이';root.add(sg);}
 // 꼭대기 장식: 구멍 판 모양 원판 + 위에 올린 큰 공
 {const cr=new THREE.Group();cr.name='꼭대기 공';const cb=builder();cb.cyl('accent',.11,.12,.03,0,0,0,{seg:24});
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;cb.cyl('dark',.017,.017,.032,Math.cos(a)*.075,.0,Math.sin(a)*.075,{seg:10});}
  cb.cyl('stand',.02,.03,.06,0,-.045,0,{seg:10});cb.build(mats,cr,{outline:new Set(['accent'])});
  const bigBall=new THREE.Mesh(new THREE.SphereGeometry(.055,18,14),mats.ballMat);bigBall.position.y=.07;bigBall.castShadow=true;cr.add(bigBall);
  cr.position.set(0,C.height+.075,-.05);root.add(cr);}
 // 바닥 장식 공(받침대·경품 단 둘레, 한 번 그리기). 같은 씨앗이면 늘 같은 자리
 {const rnd=machineKit.mulberry(19),cols=['#fffdf6','#ffb347','#ffe066','#9fdcff','#ff8fb1'],pts=[],R=.024;
  for(let k=0;k<400&&pts.length<64;k++){const x=(rnd()-.5)*(W-.14),z=(rnd()-.5)*(D-.14);
   if(Math.abs(x-bd.x)<fw/2-.005&&Math.abs(z-bd.z)<fw/2-.005)continue;if(z<shelfZ+.07&&Math.abs(x)<.25)continue;
   if(pts.some(p=>Math.hypot(p.x-x,p.z-z)<R*1.9))continue;pts.push({x,z,c:cols[pts.length%cols.length]});}
  const im=new THREE.InstancedMesh(new THREE.SphereGeometry(R,12,9),std('#ffffff',{roughness:.4}),pts.length),mx=new THREE.Matrix4(),col=new THREE.Color();
  pts.forEach((p,i)=>{mx.makeTranslation(p.x,C.floorY+R,p.z);im.setMatrixAt(i,mx);im.setColorAt(i,col.set(p.c));});im.name='바닥 장식 공';im.receiveShadow=true;root.add(im);}
 bodyKit.finish(root,mats,toonify,late);
 {const m=signMesh(M,W*.86,W*.86*3/8)??ownSign(M,W*.86,W*.86*3/8);if(m){m.position.set(0,C.glassTop+(C.height-C.glassTop)/2,hd+.004);root.add(m);}}
 const BTN={drop:'#ff9a2b',off:'#9a948a'};
 const setButton=m=>{const c=BTN[m]??BTN.off;btn.material.color.set(c);btn.material.emissive.set(c);btn.material.emissiveIntensity=m==='off'?.05:.35;};
 const press=(k=1)=>{btn.position.y=C.panel.top+.025-.012*k;};
 const lights=lightController(M,mats);
 const update=dt=>{lights.update(dt);if(mark.visible)mark.material.opacity=.75+.25*Math.sin(performance.now()*.008);};
 repaint();placePrizes();setClaw({});
 root.userData={kind:'ball',machine:M,height:C.height+.18,camera:B.camera,board:new THREE.Vector3(bd.x,bd.top,bd.z),holeCenter,toLocal,
  claw:{set:setClaw,get state(){return {...cs};},dot},setBall,ball,markHole,setPity,setHoles,get holes(){return {...H};},prizes,setButton,press,setLights:lights.setLights,update,mats,
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),stick:new THREE.Vector3(B.stick[0],C.panel.top+.1,B.stick[2]),button:new THREE.Vector3(B.button[0],C.panel.top+.04,B.button[2]),
   coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),sign:new THREE.Vector3(0,C.height+.33,0),display:new THREE.Vector3(bd.x,bd.top,bd.z)},pile:null};
 return root;
}
