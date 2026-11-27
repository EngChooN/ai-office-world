// 새 기계 ① 불빛 쌓기 「별빛 탑」 그림(월드공통개발, 2026-11-27). 규칙·판정은 claw-rules.js(CLAW_TUNING.stack·stackPos·stackStop), 한 판 진행은 claw-play.js.
// 월드디자인 시안 v1(docs/인형뽑기/새기계-불빛쌓기-시안-v1.html) 판 모양을 기계로 옮김: 7칸 × 11줄 불빛 판(캔버스 한 장) + 오른쪽 경품 줄 표시(7줄 작은 인형·11줄 큰 인형 실물),
//  아래 몸통·조작대·인형 나오는 문·투입구·간판 상자는 다른 기계와 같은 몸(bodyKit) — 가게 자리·부딪힘·서는 자리·조작 자세가 그대로 맞는다.
// 판 그림은 상태가 바뀔 때만 다시 그린다(달리는 줄은 칸이 바뀔 때, 떨어지는 칸·무지개는 그동안만 매 프레임). 좌표는 집게 기계와 같음: 앞 +Z, 바닥 y=0, 가운데 x=0.
// 1차 그림은 월드공통개발이 기존 몸통으로 만든 것(월드아트 정식 그림 전). 실제 오락실 상표·로고는 쓰지 않는다.
import * as THREE from 'three';
import {SHOP_COLORS} from './claw-palette.js';
import {CLAW,lightController,machineKit} from './claw-machine-art.js';
import {bodyKit} from './claw-machines-more.js';
import {makePlush,plushSize} from './claw-plush.js';
import {CLAW_TUNING} from './claw-rules.js';

const {builder,std,FONT}=machineKit;
// 판 치수(m): 칸 0.08m × 7 = 0.56m 폭, 11줄 = 0.88m 높이. 판 왼쪽으로 조금 비켜 오른쪽에 경품 줄 표시 칸(인형 실물)
export const STACK=Object.freeze({
 cell:.08,cols:CLAW_TUNING.stack.cols,rows:CLAW_TUNING.stack.rows,
 boardX:-.09,boardY:.6,boardZ:.2,                // 판 왼쪽 아래 끝 x = boardX − 폭/2, 아래 끝 y, 앞면 z(유리 안)
 glassTop:1.56,height:1.88,                       // 유리 상자 위 끝(판 위 8cm 여유)·간판 상자 위 끝
 shelfX:.32,                                      // 경품 인형 받침 x(판 오른쪽)
 button:Object.freeze([0,.5,.56]),                // 큰 단추(멈춤) — 열쇠 기계 단추와 같은 자리(조작 자세 machineHands가 이 점을 씀)
 // 조작 중 카메라(기계 좌표): 판 11줄 전체 + 아래 경품 문이 한 화면에. 동동이는 조작 중 내 화면에서 숨김(main.js)
 camera:Object.freeze({pos:[0,1.5,2.3],look:[0,1.1,.12],fov:46,portrait:Object.freeze({pos:[0,1.4,2.45],look:[0,1.04,.12],fov:60})}), // PC는 간판까지 들게 뒤로
});
const BW=STACK.cell*STACK.cols,BH=STACK.cell*STACK.rows;
// 판 캔버스(칸 40px): 7 × 11 칸 + 둘레 여백
const PX=40,PAD=8,CW=PX*STACK.cols+PAD*2,CH=PX*STACK.rows+PAD*2;
const COL=Object.freeze({bg:'#120d22',cell:'#1e1838',mid:'#2a2050',top:'#33204a',on:'#5fe1ff',cur:'#ffe14d',fall:'#ff5a4a',midLine:'#7cc4ff',topLine:'#c9a2ff',pity:'#8ff0b0'});

function paintBoard(g,S,t){
 g.clearRect(0,0,CW,CH);g.fillStyle=COL.bg;g.fillRect(0,0,CW,CH);
 const {rows:R,mid}={rows:STACK.rows,mid:CLAW_TUNING.stack.mid},yOf=r=>PAD+(R-r)*PX; // r = 1..11, 줄 윗변
 const cell=(i,r,col,a=1,dy=0,glow=0)=>{g.globalAlpha=a;g.fillStyle=col;if(glow){g.shadowColor=col;g.shadowBlur=glow;}
  g.beginPath();g.roundRect(PAD+i*PX+3,yOf(r)+3+dy,PX-6,PX-6,7);g.fill();g.shadowBlur=0;g.globalAlpha=1;};
 for(let r=1;r<=R;r++)for(let i=0;i<STACK.cols;i++)cell(i,r,r===mid?COL.mid:r===R?COL.top:COL.cell);
 // 경품 줄 점선(7줄 하늘 · 11줄 보라)
 g.setLineDash([8,6]);g.lineWidth=3;
 for(const [r,c] of [[mid,COL.midLine],[R,COL.topLine]]){g.strokeStyle=c;g.strokeRect(PAD-3,yOf(r)-1,CW-PAD*2+6,PX+2);}
 g.setLineDash([]);
 if(S.idle){ // 기다리는 동안: 한 줄씩 위로 훑는 빛(시안 대기 화면)
  const r=1+Math.floor(t/.12)%R;for(let i=0;i<STACK.cols;i++)cell(i,r,COL.on,.55,0,10);return;}
 S.rows.forEach((o,k)=>{for(let i=o.x;i<o.x+o.w;i++)cell(i,k+1,S.glow?`hsl(${(k*33+t*300)%360} 90% 65%)`:COL.on,1,0,12);});
 if(S.cur)for(let i=S.cur.x;i<S.cur.x+S.cur.w;i++)cell(i,S.cur.r,COL.cur,1,0,14);
 for(const f of S.falling){const a=(t-f.t)/.6;if(a<0||a>1)continue;cell(f.c,f.r,COL.fall,1-a,a*a*PX*3);}
 if(S.pity){g.fillStyle=COL.pity;g.font=`900 20px ${FONT}`;g.textAlign='center';g.textBaseline='top';g.fillText('직원 도움',CW/2,PAD+2);}
}

/**
 * 반환 group.userData: kind 'stack', machine, height, setBoard({rows,cur,falling,glow,pity,idle}) · board(지금 상태) · setButton('stop'|'off'),
 *  setLights, update(dt), press(k), camera, spots{stand,button,coin,door,board,sign,small,big}
 */
export function buildStackMachine(M,{toonify=null}={}){
 const C={...CLAW,glassTop:STACK.glassTop,height:STACK.height},W=C.width,D=C.depth,hw=W/2,hd=D/2,root=new THREE.Group();root.name=`인형뽑기 기계:${M.id}`;
 const mats=bodyKit.machineMats(M),b=builder(),late=[];mats.back.emissiveIntensity=.6;
 bodyKit.lowerBody(b,M,{glassTop:STACK.glassTop,height:STACK.height});
 const bx=STACK.boardX,by=STACK.boardY,bz=STACK.boardZ;
 // 유리 안: 바닥·뒷벽(빛남)·판 테(보라)·판 받침 기둥·오른쪽 경품 받침 두 단
 b.box('floor',W-.06,.02,D-.06,0,C.floorY-.005,0);
 b.box('back',W-.07,C.glassTop-C.floorY-.02,.012,0,(C.glassTop+C.floorY)/2,-hd+.04);
 b.rbox('dark',BW+.05,BH+.05,.04,.012,bx,by+BH/2,bz-.025);
 b.box('accent',BW+.07,.014,.02,bx,by+BH+.03,bz+.002);b.box('accent',BW+.07,.014,.02,bx,by-.03,bz+.002);
 b.box('dark',.05,by-C.floorY,.05,bx,(by+C.floorY)/2,bz-.05);
 const shelfY=r=>by+(r-1)*STACK.cell;
 for(const r of [CLAW_TUNING.stack.mid,STACK.rows])b.rbox('trim',.17,.014,.16,.004,STACK.shelfX,shelfY(r)-.006,bz-.02);
 b.box('dark',.014,BH,.014,STACK.shelfX+.07,by+BH/2,bz-.09);
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,hd-.06);
 b.build(mats,root,{outline:new Set(['body','top','dark'])});
 bodyKit.glassBox(root,late,{chuteGuard:false,glassTop:STACK.glassTop});
 // 큰 단추(멈춤): 빨강 = 누를 수 있음, 회색 = 기다림
 const btn=new THREE.Mesh(new THREE.CylinderGeometry(.062,.065,.03,20),std('#e8443a',{emissive:new THREE.Color('#e8443a'),emissiveIntensity:.3,roughness:.4}));
 btn.position.set(STACK.button[0],CLAW.panel.top+.025,STACK.button[2]);btn.name='멈춤 단추';root.add(btn);
 const ring=new THREE.Mesh(new THREE.CylinderGeometry(.076,.076,.014,20),std('#2b2f36'));ring.position.set(STACK.button[0],CLAW.panel.top+.008,STACK.button[2]);root.add(ring);
 bodyKit.finish(root,mats,toonify,late);
 {const m=machineKit.signMesh(M,W*.86,W*.86*3/8);if(m){m.position.set(0,C.glassTop+(C.height-C.glassTop)/2,hd+.004);root.add(m);}}
 // 경품 인형(실물 작게): 7줄 옆 작은 인형, 11줄 옆 큰 인형 — 「어디까지 쌓으면 무엇」이 판 옆에 보이게
 const prizes={small:null,big:null};
 const putPrize=(k,id,r,h)=>{if(prizes[k]){root.remove(prizes[k]);prizes[k]=null;}if(!id)return;const o=makePlush(id,{toonify}),s=plushSize(id);o.scale.multiplyScalar(h/s);o.position.set(STACK.shelfX,shelfY(r)+.002,bz-.02);o.rotation.y=-.25;o.name=`경품 표시:${id}`;root.add(o);prizes[k]=o;};
 const P=M.prizes??{};putPrize('small',P.small,CLAW_TUNING.stack.mid,.12);putPrize('big',P.big,STACK.rows,.17);
 // 판(빛나는 캔버스, 카툰 재질로 안 바꿈 — 단계 그림에서도 살아 있게 이름 「불빛 판」)
 const cv=typeof document!=='undefined'?document.createElement('canvas'):null;let tex=null;
 const S={rows:[],cur:null,falling:[],glow:false,pity:false,idle:true,t:0};let dirty=true;
 if(cv){cv.width=CW;cv.height=CH;tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(BW+PAD*2*STACK.cell/PX,BH+PAD*2*STACK.cell/PX),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
  m.position.set(bx,by+BH/2,bz);m.name='불빛 판';root.add(m);}
 const animating=()=>S.glow||S.falling.some(f=>S.t-f.t<.6);
 const redraw=()=>{dirty=false;if(!cv)return;paintBoard(cv.getContext('2d'),S,S.t);tex.needsUpdate=true;};
 // falling: [{c 칸, r 줄}] — 떨어지기 시작한 때는 지금(S.t)으로 적음
 const setBoard=({rows=S.rows,cur=null,falling=null,glow=false,pity=S.pity,idle=false}={})=>{S.rows=rows.map(o=>({x:o.x,w:o.w}));S.cur=cur?{...cur}:null;S.glow=glow;S.pity=pity;S.idle=idle;
  if(falling)S.falling.push(...falling.map(f=>({c:f.c,r:f.r,t:S.t})));dirty=true;};
 const clearBoard=()=>{S.falling.length=0;setBoard({rows:[],idle:true,pity:false});};
 const BTN={stop:'#e8443a',off:'#9a948a'};
 const setButton=m=>{const c=BTN[m]??BTN.off;btn.material.color.set(c);btn.material.emissive.set(c);btn.material.emissiveIntensity=m==='off'?.05:.35;};
 const lights=lightController(M,mats);
 let idleT=0;
 const update=dt=>{lights.update(dt);S.t+=dt;if(S.falling.length&&S.t-S.falling[0].t>.7)S.falling=S.falling.filter(f=>S.t-f.t<.7);
  if(S.idle){idleT+=dt;if(idleT>=.12){idleT=0;dirty=true;}} // 기다리는 훑기는 0.12초마다(한 줄씩)
  else if(animating())dirty=true;
  if(dirty)redraw();};
 const press=(k=1)=>{btn.position.y=CLAW.panel.top+.025-.012*k;};
 clearBoard();
 root.userData={kind:'stack',machine:M,height:STACK.height,setBoard,clearBoard,get board(){return {rows:S.rows.map(o=>({...o})),cur:S.cur,glow:S.glow,pity:S.pity,idle:S.idle};},setButton,
  setLights:lights.setLights,update,press,mats,camera:STACK.camera,prizes,
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),button:new THREE.Vector3(STACK.button[0],CLAW.panel.top+.04,STACK.button[2]),coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),
   door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),board:new THREE.Vector3(bx,by+BH/2,bz),sign:new THREE.Vector3(0,STACK.height+.15,0),
   small:new THREE.Vector3(STACK.shelfX,shelfY(CLAW_TUNING.stack.mid),bz),big:new THREE.Vector3(STACK.shelfX,shelfY(STACK.rows),bz)},pile:null};
 void SHOP_COLORS;
 return root;
}
