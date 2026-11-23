// 온라인 인형뽑기 기계 그림(월드아트, 2026-11-23): 몸통·유리 상자·위 간판·집게(움직이는 부품)·투입구·조작대·인형 나오는 문·인형 더미.
// 크기는 동동이(1.0m, 눈 0.695m·서서 장갑 0.25m·팔 뻗으면 약 0.5m)에 맞췄다: 조작대 윗면 0.48m, 유리 상자 0.56~1.30m, 전체 1.62m.
// 집게 움직임·판정·확률은 월드개발·월드기획 몫. 이 파일은 그림과 치수(CLAW), 집게 자세(claw.set), 불빛 상태(setLights), 인형 더미(fillPile)를 준다.
// 메모리: 기계 한 대 = 몸통 재질별 합친 메시 몇 개 + 유리 1 + 글자판 1(256×96 캔버스) + 집게 부품. 인형 더미는 종마다 InstancedMesh 1개(+외곽선 1개).
// 좌표: 기계 앞 +Z(손님이 서는 쪽), 바닥 y=0, 가운데 x=0. 손님 화면에서 +X가 오른쪽이다.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MACHINES,SHOP_COLORS} from './claw-palette.js';
import {plushGeometry,plushSize,plushMaterial,plushLineMaterial,PLUSH_IDS} from './claw-plush.js';
import {guestSize} from './claw-guest.js';

// ── 치수(월드개발과 맞출 기준값, m) ──
export const CLAW=Object.freeze({
 width:.95,depth:.85,height:1.62,
 floorY:.56,                         // 유리 상자 안 바닥(인형이 놓이는 높이)
 glassTop:1.3,                       // 유리 상자 위 끝
 panel:Object.freeze({top:.48,depth:.2,stick:[-.18,.5,.56],button:[.17,.5,.56],coin:[.36,.38,.62]}), // 조작대 윗면 높이·앞으로 나온 길이, 손잡이·뽑기 단추·투입구(기계 좌표)
 play:Object.freeze({x:[-.33,.33],z:[-.28,.28]}),   // 집게 가운데가 움직일 수 있는 범위(기계 좌표)
 home:Object.freeze([-.3,.25]),                    // 집게 처음 자리 = 인형 나가는 구멍 위(x,z)
 chute:Object.freeze({x:[-.43,-.17],z:[.11,.38],guard:.11}), // 인형 나가는 구멍(윗면 바닥 높이에서) + 둘레 투명 턱 높이
 railY:1.25,                         // 집게 레일 높이
 clawTip:.21,                        // 집게 머리 가운데 → 손가락 끝 길이
 clawTop:.99,                        // 집게 손가락 끝의 처음 높이(drop 0)
 dropMax:.4,                         // 집게가 내려갈 수 있는 최대 깊이(0.99-0.40 = 0.59, 바닥 바로 위)
 door:Object.freeze([-.3,.24,.43]),  // 인형 나오는 문 가운데(앞면)
 stand:Object.freeze({z:1.0,heading:Math.PI}), // 손님이 서는 자리(기계 좌표 z, 기계를 바라보는 방향)
 // 조작 중 고정 카메라 추천값(기계 좌표): 동동이(서는 자리 z 1.0, 모자 끝 약 1.1m) 머리 위로 넘겨 유리 상자 앞 아래까지 보이게. 휴대폰 세로는 portrait
 camera:Object.freeze({pos:[0,1.9,1.7],look:[0,.74,0],fov:42,portrait:Object.freeze({pos:[0,2.2,2.1],fov:55})}),
});
const FONT='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const std=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.8,metalness:0,...o});

function builder(){
 const parts=new Map();
 const add=(key,g)=>{if(!parts.has(key))parts.set(key,[]);parts.get(key).push(g);return g;};
 const box=(key,w,h,d,x,y,z)=>add(key,new THREE.BoxGeometry(w,h,d).translate(x,y,z));
 const rbox=(key,w,h,d,r,x,y,z)=>add(key,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001)).translate(x,y,z));
 const cyl=(key,r0,r1,h,x,y,z,{seg=14,rx=0,rz=0}={})=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);return add(key,g.translate(x,y,z));};
 const sph=(key,r,x,y,z,seg=10)=>add(key,new THREE.SphereGeometry(r,seg,Math.max(6,seg*.6|0)).translate(x,y,z));
 const build=(mats,group,{outline=null}={})=>{for(const [key,list] of parts){const g=mergeGeometries(list.map(x=>x.index?x.toNonIndexed():x).map(x=>{for(const a of Object.keys(x.attributes))if(!['position','normal','uv'].includes(a))x.deleteAttribute(a);return x;}));
  const m=new THREE.Mesh(g,mats[key]);m.name=key;m.castShadow=!mats[key].transparent&&key!=='top';m.receiveShadow=true;group.add(m);list.forEach(x=>x.dispose());
  if(outline?.has(key))m.userData.wantLine=true;}return group;};
 return {add,box,rbox,cyl,sph,build};
}
// 기계 외곽선(얇은 뒤집은 껍질). 둥근 상자의 법선을 따라 밀어낸다.
let lineMat=null;
function machineLine(){if(lineMat)return lineMat;const m=new THREE.MeshBasicMaterial({color:'#2e2420',side:THREE.BackSide});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normalize(normal)*.008;');};m.customProgramCacheKey=()=>'claw-machine-line';m.userData.shared=true;return lineMat=m;}
function canvasTex(w,h,draw){if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
// 집게 그림(간판 왼쪽 표시)
function clawGlyph(g,x,y,s,color){g.strokeStyle=color;g.lineWidth=s*.12;g.lineCap='round';g.beginPath();g.moveTo(x,y-s*.6);g.lineTo(x,y-s*.15);g.stroke();
 g.fillStyle=color;g.beginPath();g.arc(x,y-s*.1,s*.16,0,Math.PI*2);g.fill();
 for(const k of [-1,1]){g.beginPath();g.moveTo(x+k*s*.08,y-s*.05);g.quadraticCurveTo(x+k*s*.42,y+s*.15,x+k*s*.18,y+s*.5);g.stroke();}
 g.beginPath();g.moveTo(x,y);g.lineTo(x,y+s*.45);g.stroke();}
function signTexture(M){return canvasTex(256,96,(g,w,h)=>{
 g.fillStyle=M.bodyDark;g.fillRect(0,0,w,h);g.fillStyle=M.trim;g.beginPath();g.roundRect(6,6,w-12,h-12,16);g.fill();
 clawGlyph(g,40,46,44,M.bodyDark);
 g.fillStyle=M.bodyDark;g.font=`900 34px ${FONT}`;g.textBaseline='middle';g.fillText(M.name,72,38);
 g.fillStyle=M.body;g.font=`700 18px ${FONT}`;g.fillText(M.sub,74,70);});}

// ── 집게: 레일 위 수레(carriage) → 줄 → 머리 → 손가락 3개. set({x,z,drop,open})로 움직인다.
function buildClaw(mats){
 const C=CLAW,root=new THREE.Group();root.name='집게';
 const gantry=new THREE.Group();gantry.name='집게 가로대';root.add(gantry);          // x 방향 가로대(z로 움직임)
 const bar=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,C.width-.08,8).rotateZ(Math.PI/2),mats.metal);gantry.add(bar);
 const cart=new THREE.Group();cart.name='집게 수레';gantry.add(cart);                // 가로대 위 수레(x로 움직임)
 const cartBox=new THREE.Mesh(new RoundedBoxGeometry(.09,.05,.07,2,.012),mats.accent);cart.add(cartBox);
 const cable=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,1,6).translate(0,-.5,0),mats.dark);cable.name='집게 줄';cart.add(cable);
 const head=new THREE.Group();head.name='집게 머리';cart.add(head);head.scale.setScalar(C.clawTip/.14); // 손가락은 0.14 길이로 그리고 크기로 맞춘다
 head.add(new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.06,12).translate(0,.03,0),mats.metal));
 head.add(new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),mats.accent));
 const fingers=[];
 for(let i=0;i<3;i++){const pivot=new THREE.Group();pivot.rotation.y=i/3*Math.PI*2;head.add(pivot);
  const f=new THREE.Group();f.position.set(0,0,.03);pivot.add(f);
  const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.04,.035),new THREE.Vector3(0,-.1,.04),new THREE.Vector3(0,-.14,.0)];
  const tube=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.007,6,false);f.add(new THREE.Mesh(tube,mats.metal));
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.011,8,6).translate(0,-.14,0),mats.accent);f.add(tip);fingers.push(f);}
 // 바닥 그림자 점(조작 중 집게 자리 안내, 설계 §2 ③). 밝은 바닥에서도 보이게 짙은 반투명.
 const dot=new THREE.Mesh(new THREE.CircleGeometry(.035,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#2b2f36',transparent:true,opacity:.35,depthWrite:false}));dot.name='집게 그림자 점';dot.renderOrder=1;root.add(dot);
 const state={x:C.home[0],z:C.home[1],drop:0,open:0};
 const set=({x=state.x,z=state.z,drop=state.drop,open=state.open,dotY=null}={})=>{
  Object.assign(state,{x,z,drop,open});
  gantry.position.set(0,C.railY,z);cart.position.x=x;
  const len=Math.max(.02,C.railY-C.clawTip-C.clawTop+drop);cable.scale.y=len;head.position.y=-len;
  // open 0 = 오므림(손가락 끝이 가운데로), 1 = 활짝
  for(const f of fingers)f.rotation.x=-.25+open*.85;
  dot.position.set(x,(dotY??C.floorY)+.004,z);
 };
 set({});
 return {root,set,state,fingers,head,cart,dot,tipWorld:(out=new THREE.Vector3())=>head.getWorldPosition(out).add(new THREE.Vector3(0,-C.clawTip,0))};
}

// ── 기계 한 대. theme = MACHINES의 id(forest·city·star) 또는 같은 꼴의 객체.
// 반환 group.userData: machine(색·이름), claw(set·state·tipWorld), setLights(mode), update(dt), spots(기계 좌표), pile(fillPile 결과)
export function buildClawMachine(theme='forest',{toonify=null}={}){
 const M=typeof theme==='string'?MACHINES.find(m=>m.id===theme):theme;if(!M)throw new Error(`기계 없음: ${theme}`);
 const C=CLAW,S=SHOP_COLORS,W=C.width,D=C.depth,hw=W/2,hd=D/2,root=new THREE.Group();root.name=`인형뽑기 기계:${M.id}`;
 const mats={body:std(M.body),top:std(M.body),dark:std(M.bodyDark),trim:std(M.trim),accent:std(M.accent,{roughness:.5}),metal:std(S.metal,{roughness:.35,metalness:.3}),
  chute:std(S.chute),rubber:std(S.rubber),floor:std(M.trim),
  bulbA:std(M.light,{emissive:new THREE.Color(M.light),emissiveIntensity:.6}),bulbB:std(M.accent,{emissive:new THREE.Color(M.accent),emissiveIntensity:.6}),
  strip:std('#fffaf0',{emissive:new THREE.Color(M.light),emissiveIntensity:.8}),back:std(M.trim,{emissive:new THREE.Color(M.light),emissiveIntensity:.35})};
 const b=builder(),late=[];
 // 아래 몸통(바닥~유리 상자 바닥) + 조작대(앞으로 나옴) + 다리 받침
 b.rbox('body',W,C.floorY,D,.05,0,C.floorY/2,0);
 b.rbox('dark',W+.02,.06,D+.02,.02,0,.03,0);
 b.rbox('body',W-.02,.07,C.panel.depth+.04,.025,0,C.panel.top-.035,hd+C.panel.depth/2-.02);
 b.rbox('trim',W-.1,.012,C.panel.depth-.02,.005,0,C.panel.top+.002,hd+C.panel.depth/2-.02);
 b.rbox('dark',W-.02,C.panel.top-.08,.06,.02,0,(C.panel.top-.07)/2+.06,hd+.02); // 조작대 아래 앞판
 // 앞면 장식 띠·별·하트(테마 색)
 b.box('accent',W-.08,.035,.01,0,C.floorY-.06,hd+.005);
 // 인형 나오는 문(왼쪽 아래): 짙은 구멍 + 투명 덮개 대신 고무 덮개
 b.rbox('chute',.26,.18,.02,.02,C.door[0],C.door[1],hd+.002);
 b.rbox('rubber',.22,.08,.02,.01,C.door[0],C.door[1]+.04,hd+.012);
 b.box('trim',.28,.02,.03,C.door[0],C.door[1]-.1,hd+.01);
 // 투입구(조작대 오른쪽 앞면): 금색 동전 구멍 판
 b.rbox('accent',.1,.13,.02,.015,C.panel.coin[0],C.panel.coin[1],hd+.012);
 b.box('chute',.012,.06,.025,C.panel.coin[0],C.panel.coin[1]+.015,hd+.02);
 // 조작대: 손잡이(빨간 공) + 큰 뽑기 단추
 b.cyl('metal',.012,.012,.08,C.panel.stick[0],C.panel.top+.04,C.panel.stick[2]);
 b.sph('rubber',.028,C.panel.stick[0],C.panel.top+.09,C.panel.stick[2],12);
 b.cyl('dark',.045,.045,.015,C.panel.stick[0],C.panel.top+.008,C.panel.stick[2]);
 b.cyl('dark',.055,.055,.015,C.panel.button[0],C.panel.top+.008,C.panel.button[2]);
 // 유리 상자 기둥(네 모서리) + 위 간판 상자 + 간판 테
 for(const sx of [-1,1])for(const sz of [-1,1])b.rbox('dark',.045,C.glassTop-C.floorY+.02,.045,.012,sx*(hw-.022),(C.glassTop+C.floorY)/2,sz*(hd-.022));
 const topH=C.height-C.glassTop;
 b.rbox('top',W,topH,D,.06,0,C.glassTop+topH/2,0); // 위 간판 상자는 그림자를 안 드리운다(유리 상자 안이 어두워지지 않게)
 b.rbox('dark',W+.02,.04,D+.02,.02,0,C.glassTop+.01,0);
 b.rbox('accent',W*.7,.05,D*.6,.02,0,C.height+.02,0);
 // 유리 상자 안: 바닥판(테마 밝은 색)·뒷벽 무늬판·레일 두 줄
 b.box('floor',W-.06,.02,D-.06,0,C.floorY-.005,0);
 b.box('back',W-.07,C.glassTop-C.floorY-.02,.012,0,(C.glassTop+C.floorY)/2,-hd+.04);
 for(const sx of [-1,1])b.box('metal',.02,.02,D-.08,sx*(hw-.05),C.railY,0);
 // 인형 나가는 구멍(짙은 사각 구멍 + 투명 턱은 유리 재질로 따로)
 const ch=C.chute;b.box('chute',ch.x[1]-ch.x[0],.03,ch.z[1]-ch.z[0],(ch.x[0]+ch.x[1])/2,C.floorY+.002,(ch.z[0]+ch.z[1])/2);
 // 안쪽 위 불빛 줄
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,hd-.06);b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,-hd+.08);
 // 간판 둘레 전구(번갈아 깜빡이는 두 벌)
 const bulbs=[];{const y0=C.glassTop+.05,y1=C.height-.05,n=9;for(let i=0;i<n;i++){const x=-hw+.06+i*(W-.12)/(n-1);bulbs.push([x,y1],[x,y0]);}
  for(let i=1;i<3;i++){const y=y0+(y1-y0)*i/3;bulbs.push([-hw+.06,y],[hw-.06,y]);}}
 bulbs.forEach(([x,y],i)=>b.sph(i%2?'bulbA':'bulbB',.016,x,y,hd+.012,8));
 b.build(mats,root,{outline:new Set(['body','top','dark'])});
 // 유리(앞·옆·뒤 네 장 + 구멍 둘레 턱) — 투명 재질 하나
 const glass=new THREE.MeshStandardMaterial({color:SHOP_COLORS.glass,roughness:.1,metalness:0,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide,name:'claw-glass'});
 {const gh=C.glassTop-C.floorY,gy=(C.glassTop+C.floorY)/2,g=[];
  g.push(new THREE.PlaneGeometry(W-.05,gh).translate(0,gy,hd-.02));
  g.push(new THREE.PlaneGeometry(D-.05,gh).rotateY(Math.PI/2).translate(-hw+.02,gy,0),new THREE.PlaneGeometry(D-.05,gh).rotateY(Math.PI/2).translate(hw-.02,gy,0));
  const gx=(ch.x[0]+ch.x[1])/2,gz=(ch.z[0]+ch.z[1])/2,cw=ch.x[1]-ch.x[0],cd=ch.z[1]-ch.z[0],gy2=C.floorY+ch.guard/2;
  g.push(new THREE.PlaneGeometry(cw,ch.guard).translate(gx,gy2,ch.z[0]),new THREE.PlaneGeometry(cd,ch.guard).rotateY(Math.PI/2).translate(ch.x[1],gy2,gz));
  for(const x of g)x.deleteAttribute('uv');
  const m=new THREE.Mesh(mergeGeometries(g),glass);m.name='기계 유리';m.renderOrder=2;root.add(m);g.forEach(x=>x.dispose());
  // 유리 반사 줄(흰 사선 두 줄): 유리가 있다는 걸 보이게
  const hl=new THREE.Mesh(new THREE.PlaneGeometry(.035,gh*.8),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false}));
  hl.position.set(hw-.18,gy+.02,hd-.015);hl.rotation.z=-.35;hl.renderOrder=3;const hl2=hl.clone();hl2.scale.x=.5;hl2.position.x=hw-.12;late.push(hl,hl2);}
 // 간판 글자판(앞)
 const tex=signTexture(M);
 if(tex){const sign=new THREE.Mesh(new THREE.PlaneGeometry(W*.86,W*.86*96/256),new THREE.MeshStandardMaterial({map:tex,emissive:new THREE.Color('#ffffff'),emissiveMap:tex,emissiveIntensity:.25,roughness:.7}));
  sign.position.set(0,C.glassTop+topH/2,hd+.004);sign.name='기계 간판';root.add(sign);}
 // 뽑기 단추(따로: 누르면 내려감) — 기계 테마 강조색
 const button=new THREE.Mesh(new THREE.CylinderGeometry(.04,.042,.03,16),std('#e8443a',{emissive:new THREE.Color('#e8443a'),emissiveIntensity:.25,roughness:.4}));
 button.position.set(C.panel.button[0],C.panel.top+.025,C.panel.button[2]);button.name='뽑기 단추';root.add(button);
 const claw=buildClaw(mats);root.add(claw.root);
 // 카툰 재질로 바꾼 뒤에 외곽선 껍질·반사 줄·그림자 점을 붙인다(toonify가 이것들까지 바꾸지 않게)
 claw.root.remove(claw.dot);
 toonify?.(root,{kind:'prop',keepMaps:true});
 if(toonify){mats.bulbA=findMat(root,'bulbA')??mats.bulbA;mats.bulbB=findMat(root,'bulbB')??mats.bulbB;mats.strip=findMat(root,'strip')??mats.strip;}
 root.traverse(o=>{if(o.isMesh&&o.userData.wantLine){const l=new THREE.Mesh(o.geometry,machineLine());l.userData.outline=true;l.name='outline';o.add(l);}});
 claw.root.add(claw.dot);for(const o of late)root.add(o);
 // ── 불빛 상태: idle(천천히 번갈아) · play(빠르게) · win(밝게 번쩍) · rainbow(희귀 성공 2초 무지개, 설계 §5) · off
 const {setLights,update}=lightController(M,mats);
 const press=(k=1)=>{button.position.y=C.panel.top+.025-.012*k;};
 root.userData={kind:'claw',height:C.height,machine:M,claw,setLights,update,press,mats,
  // 기계 좌표 자리(월드개발이 기계 놓인 위치·방향을 곱해 쓴다)
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),stick:new THREE.Vector3(...C.panel.stick).setY(C.panel.top+.09),button:new THREE.Vector3(...C.panel.button).setY(C.panel.top+.04),
   coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),sign:new THREE.Vector3(0,C.height+.15,0)},
  pile:null};
 return root;
}

// ── 인형 더미: 기계 안 바닥에 인형을 두 층으로 쌓는다(구멍 자리는 비움). ids = 넣을 인형 id 목록(손님 자리는 claw-guest.js resolvePool로 미리 바꿔서 넣는다).
// 같은 종은 InstancedMesh 하나로 그린다. 반환: {items:[{id,i,pos,yaw,size}], take(n)(n번째 인형을 숨기고 그 자리를 돌려줌), put(n), group}
// 배치는 seed로 늘 같다(같은 방 사람끼리 같은 더미를 본다).
// 개발용 손님 인형(실제 자료가 들어온 guest-*)은 인스턴스로 못 그리므로 guestObject(id)가 돌려준 물체(미리 만든 makeGuestPlush 원형의 clone)를 하나씩 놓는다.
export function fillPile(machine,ids,{count=14,seed=1,toonify=null,outline=true,guestObject=null}={}){
 const C=CLAW,ch=C.chute,rnd=mulberry(seed),items=[];
 const inner={x:[-C.width/2+.08,C.width/2-.08],z:[-C.depth/2+.09,C.depth/2-.08]};
 const blocked=(x,z,r)=>x+r>ch.x[0]-.03&&x-r<ch.x[1]+.03&&z+r>ch.z[0]-.03&&z-r<ch.z[1]+.03;
 // 아래층: 고른 격자에 흔들어 놓기, 위층: 아래층 사이 틈에 조금 높게
 const cols=4,rows=3,cell=[(inner.x[1]-inner.x[0])/cols,(inner.z[1]-inner.z[0])/rows],slots=[];
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)slots.push({x:inner.x[0]+cell[0]*(c+.5),z:inner.z[0]+cell[1]*(r+.5),layer:0});
 for(let r=0;r<rows-1;r++)for(let c=0;c<cols-1;c++)slots.push({x:inner.x[0]+cell[0]*(c+1),z:inner.z[0]+cell[1]*(r+1),layer:1});
 let n=0;
 const ours=new Set(PLUSH_IDS),sizeOf=id=>ours.has(id)?plushSize(id):guestSize(id);
 for(const s of slots){if(n>=count)break;const id=ids[Math.floor(rnd()*ids.length)],size=sizeOf(id),r=size*.38;
  const x=s.x+(rnd()-.5)*cell[0]*.3,z=s.z+(rnd()-.5)*cell[1]*.3;if(blocked(x,z,r))continue;
  const y=C.floorY+(s.layer?.09+rnd()*.03:0);
  // 얼굴이 대체로 손님 쪽(+Z)을 보게, 조금씩 기울여 쌓인 느낌
  const yaw=(rnd()-.5)*1.6,tilt=s.layer?(rnd()-.5)*.5:(rnd()-.5)*.15,roll=(rnd()-.5)*(s.layer?.6:.2);
  items.push({id,pos:new THREE.Vector3(x,y,z),yaw,tilt,roll,size});n++;}
 const group=new THREE.Group();group.name='인형 더미';
 const byId=new Map();items.forEach((it,k)=>{if(!byId.has(it.id))byId.set(it.id,[]);byId.get(it.id).push(k);});
 const meshes=new Map(),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3();
 const singles=new Map();
 for(const [id,list] of byId){
  if(!ours.has(id)){if(!guestObject)throw new Error(`손님 인형은 guestObject가 필요: ${id}`);
   list.forEach(k=>{const it=items[k],o=guestObject(id);o.position.copy(it.pos);o.rotation.set(it.tilt,it.yaw,it.roll);group.add(o);singles.set(k,o);});continue;}
  const geo=plushGeometry(id);
  // 더미 인형은 그림자를 드리우지 않는다(유리 상자 안이라 거의 안 보이고, 그림자 그리기에서 인형 수만큼 삼각형이 늘어난다)
  const im=new THREE.InstancedMesh(geo.color,plushMaterial(),list.length);im.name=`인형 더미:${id}`;im.castShadow=false;im.receiveShadow=true;
  const lm=outline?new THREE.InstancedMesh(geo.line,plushLineMaterial(),list.length):null;if(lm){lm.userData.outline=true;lm.name='outline';}
  list.forEach((k,j)=>{const it=items[k];it.i=j;e.set(it.tilt,it.yaw,it.roll);q.setFromEuler(e);sc.setScalar(it.size);m4.compose(it.pos,q,sc);im.setMatrixAt(j,m4);lm?.setMatrixAt(j,m4);});
  im.computeBoundingSphere();lm?.computeBoundingSphere();group.add(im);if(lm)group.add(lm);meshes.set(id,{im,lm});}
 for(const im of group.children)if(im.isInstancedMesh&&!im.userData.outline)toonify?.(im,{kind:'character'});
 machine.add(group);
 const zero=new THREE.Matrix4().makeScale(0,0,0);
 const setVisible=(k,on)=>{const it=items[k];if(singles.has(k)){singles.get(k).visible=on;it.hidden=!on;return;}const {im,lm}=meshes.get(it.id);e.set(it.tilt,it.yaw,it.roll);q.setFromEuler(e);sc.setScalar(it.size);m4.compose(it.pos,q,sc);
  for(const x of [im,lm])if(x){x.setMatrixAt(it.i,on?m4:zero);x.instanceMatrix.needsUpdate=true;}it.hidden=!on;};
 const pile={items,group,take:k=>{setVisible(k,false);return items[k];},put:k=>setVisible(k,true),
  // 집게 자리(x,z)에서 가장 가까운 보이는 인형(높이 차 포함 판정은 월드개발 몫. 그림 쪽 도우미)
  nearest:(x,z)=>{let best=-1,bd=1e9;items.forEach((it,k)=>{if(it.hidden)return;const d=Math.hypot(it.pos.x-x,it.pos.z-z);if(d<bd){bd=d;best=k;}});return best<0?null:{index:best,item:items[best],dist:bd};},
  // 집게 자리 아래 더미 윗면 높이(그림자 점·내려갈 깊이 맞추기)
  topAt:(x,z)=>{let y=C.floorY;for(const it of items){if(it.hidden)continue;const d=Math.hypot(it.pos.x-x,it.pos.z-z);if(d<it.size*.45)y=Math.max(y,it.pos.y+it.size*(1-d/(it.size*.45)*.4));}return y;},
  dispose:()=>{machine.remove(group);for(const {im,lm} of meshes.values()){im.dispose();lm?.dispose();}}};
 machine.userData.pile=pile;return pile;
}
// 불빛 깜빡임(세 종류 기계 공용). mats.bulbA·bulbB·strip은 toonify 뒤 바뀐 재질이어야 한다.
export function lightController(M,mats){
 let mode='idle',t=0;const hue=new THREE.Color();
 const setLights=m=>{mode=m;t=0;};
 const update=dt=>{t+=dt;const A=mats.bulbA,B=mats.bulbB;
  if(mode==='off'){A.emissiveIntensity=B.emissiveIntensity=.05;return;}
  if(mode==='rainbow'){hue.setHSL((t*.8)%1,.85,.6);A.emissive.copy(hue);hue.setHSL((t*.8+.5)%1,.85,.6);B.emissive.copy(hue);A.emissiveIntensity=B.emissiveIntensity=1.6;mats.strip.emissiveIntensity=1.4;return;}
  A.emissive.set(M.light);B.emissive.set(M.accent);
  const rate=mode==='play'?6:mode==='win'?10:1.6,on=Math.sin(t*rate*Math.PI)>0;
  const hi=mode==='win'?1.8:1.1,lo=mode==='win'?.6:.25;
  A.emissiveIntensity=on?hi:lo;B.emissiveIntensity=on?lo:hi;mats.strip.emissiveIntensity=mode==='win'?1.3:.8;
 };
 return {setLights,update,get mode(){return mode;}};
}
// 타이머·열쇠 기계(claw-machines-more.js)가 같은 도우미를 쓴다
export const machineKit=Object.freeze({builder,machineLine,canvasTex,std,FONT,buildClaw,findMat,mulberry});
// toonify 뒤 바뀐 재질 찾기(불빛 깜빡임은 바뀐 재질에 해야 보인다)
function findMat(root,name){let m=null;root.traverse(o=>{if(!m&&o.isMesh&&o.name===name)m=o.material;});return m;}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
