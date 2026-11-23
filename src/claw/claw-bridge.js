// 봉 기계 그림(월드아트, 2026-11-23 정식 그림 — 월드개발 임시 그림을 바꿈). 설계 v4.1 §7·§9-1 「다리 걸치기(橋渡し)」.
// 바닥 넓이·조작대·손잡이·뽑기 단추·투입구·인형 나오는 문·서는 자리는 집게 기계(CLAW)와 같다(몸통 = claw-machines-more.js bodyKit). 다른 것:
//  · 분홍 몸 + 위 간판(아틀라스 「봉 n」, 2발 그림)
//  · 2발 약한 집게: 가로로 긴 모터 머리 + 납작하고 넓은 팔 둘 + 안으로 꺾인 고무 발끝(집게 기계의 둥근 머리·가는 손가락 3개와 달라 보이게).
//    팔 끝 자리·각도는 집게 기계 손가락과 같다(물리 CLAW_RIG = 보이는 발끝 = 판정). fingers[0] = +x, [1] = −x.
//  · 봉 4개(11-23 대표 지적 2차 + 실제 일본식 봉 기계 사진 2장, 자리 = claw-bridge-layout.js): 모두 좌우(x)로 기계 폭을 가로지르고 앞뒤로 나란히, 같은 높이.
//    가운데 둘 = 받침 봉(상자가 앞뒤로 걸쳐짐), 바깥 둘 = 막이 봉(상자가 앞·뒤 밖으로 나가는 것을 막음). 맨 금속 관 + 양옆 레일(사각 관) + 봉 끝 죔쇠.
//  · 봉 아래 = 레일 사이·막이 봉 바깥까지 뚫린 구덩이(밝은 회색 벽·앞이 낮은 비탈 바닥·앞 벽 아래 출구). 두 받침 봉 사이로 빠지면 경품.
//    구덩이 밖(앞·뒤·레일 바깥) = 받침판(윗면 = deckY). 집게 기계의 앞 구멍·투명 턱은 없음.
//  · userData.geom = 옛 판정(봉 2개, 앞뒤 방향, 월드개발이 새 배치로 옮길 때까지 claw-play.js가 씀), userData.layout = 그림이 따르는 새 배치.
//  · 상자 피규어(makeBoxPrize): 창 달린 종이 상자(앞·위 창) 안에 선 작은 인형. 그림 크기 = 판정 크기(bridge.box 0.16×0.10×0.22m).
//  · 판 전 자리 점선 윤곽 + 화살표(2.5초 흐려짐), 상자 다시 놓기 연출(0.6초 흐려짐 → 처음 자리에 반짝).
// 메모리: 기계 한 대 = 몸통 재질별 합친 메시 + 봉·받침 1 + 유리 1 + 간판(아틀라스 공유) + 집게 부품. 상자 = 껍데기 1 + 창 1 + 인형(색 1·외곽선 1).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {CLAW,FINGER_ANGLE,lightController,machineKit} from './claw-machine-art.js';
import {bodyKit} from './claw-machines-more.js';
import {makePlush,plushSize} from './claw-plush.js';
import {MACHINES,RARITY,plushInfo,baseOfPlush} from './claw-palette.js';
import {bridgeGeom,U} from './claw-bridge-physics.js';
import {bridgeLayout} from './claw-bridge-layout.js';
import {CLAW_TUNING} from './claw-rules.js';

const {builder,std,signMesh}=machineKit;
// 상자 색(원래 캐릭터 대표 색, claw-palette.js PLUSH_COLORS_FOR_PILE과 같은 계열). 테두리 띠 = 희귀도 색
export const BOX_COLORS=Object.freeze({squirrel:'#c98b5a',hare:'#f0a7b8',magpie:'#4a5a78',cat:'#e9a15f',dongdong:'#f08a3c','dongdong-office':'#5b6b8c',haechi:'#5fb592','dongdong-santa':'#d23b36'});
const _c=new THREE.Color();
function paint(g,hex){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
 _c.set(hex);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_c.r,_c.g,_c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
const pale=(hex,k)=>'#'+new THREE.Color(hex).lerp(new THREE.Color('#ffffff'),k).getHexString();

/** 상자 피규어 하나. box = [폭(z), 높이, 길이(x)] m — 겉 크기 = 판정 크기. 앞(+z)·위에 창, 안에 선 작은 인형 */
export function makeBoxPrize(id,{toonify=null,box=[.16,.10,.22]}={}){
 const info=plushInfo(id),R=RARITY[info?.rarity??'common'],[w,h,l]=box,g=new THREE.Group();g.name=`상자:${id}`;
 const base=baseOfPlush(id),col=BOX_COLORS[base]??'#e8689e',inside=pale(col,.72),t=.005,band=h*.3,P=[];
 const B=(sx,sy,sz,x,y,z,hex)=>P.push(paint(new THREE.BoxGeometry(sx,sy,sz).translate(x,y,z),hex));
 // 바닥·뒤판(안쪽은 옅은 캐릭터 색)·양 끝판(캐릭터 색 + 희귀도 동그라미)
 B(l,t,w,0,-h/2+t/2,0,col);B(l,h,t,0,0,-w/2+t/2,col);B(l-2*t,h-2*t,.001,0,0,-w/2+t+.0005,inside);
 for(const s of [-1,1]){B(t,h,w,s*(l/2-t/2),0,0,col);P.push(paint(new THREE.CylinderGeometry(h*.26,h*.26,.002,16).rotateZ(Math.PI/2).translate(s*(l/2+.001),h*.06,0),R.color));}
 // 앞 창틀: 아래 띠(희귀도 색, 별 = 희귀도 별 수)·위 띠·양옆 기둥
 B(l,band,t,0,-h/2+band/2,w/2-t/2,R.color);B(l,t*1.6,t,0,h/2-t*.8,w/2-t/2,col);
 for(const s of [-1,1])B(l*.1,h,t,s*(l/2-l*.05),0,w/2-t/2,col);
 for(let i=0;i<R.stars;i++)P.push(paint(new THREE.OctahedronGeometry(band*.26,0).scale(1,1,.35).translate((i-(R.stars-1)/2)*band*.62,-h/2+band/2,w/2+.0015),'#fffaf0'));
 // 위 창틀: 앞·뒤 띠
 B(l,t,w*.16,0,h/2-t/2,-w/2+w*.08,col);B(l,t,t*1.6,0,h/2-t/2,w/2-t*.8,col);for(const s of [-1,1])B(l*.1,t,w,s*(l/2-l*.05),h/2-t/2,0,col);
 // 장식(별·끝 동그라미)이 몇 mm 튀어나오므로 껍데기 전체를 판정 크기(l×h×w)에 딱 맞게 줄인다(그림 크기 = 판정 크기)
 const sg=mergeGeometries(P,false);P.forEach(x=>x.dispose());sg.computeBoundingBox();{const bb=sg.boundingBox,c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());sg.translate(-c.x,-c.y,-c.z).scale(l/sz.x,h/sz.y,w/sz.z);}
 const shell=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75}));
 shell.name='상자 껍데기';shell.castShadow=true;shell.receiveShadow=true;toonify?.(shell,{kind:'prop'});g.add(shell);
 // 창(앞·위, 투명 한 장)
 const wf=new THREE.PlaneGeometry(l*.8,h-band-t*1.6).translate(0,-h/2+band+(h-band-t*1.6)/2,w/2-.0015),wt=new THREE.PlaneGeometry(l*.8,w*.82).rotateX(-Math.PI/2).translate(0,h/2-.0015,w*.04);
 for(const x of [wf,wt])x.deleteAttribute('uv');
 const glass=new THREE.Mesh(mergeGeometries([wf,wt]),new THREE.MeshStandardMaterial({color:'#e8f8ff',transparent:true,opacity:.3,roughness:.1,depthWrite:false,side:THREE.DoubleSide}));glass.name='상자 창';glass.renderOrder=2;g.add(glass);wf.dispose();wt.dispose();
 // 안의 작은 인형(바닥에 서서 앞을 봄, 높이 = 상자 안 높이의 90%)
 if(base&&base!==id){const p=makePlush(base,{toonify});const k=(h-t*2)*.9/plushSize(base);p.scale.multiplyScalar(k);p.position.set(0,-h/2+t,-w*.04);g.add(p);}
 g.userData.plushId=id;g.userData.size=h;return g;
}

// ── 2발 집게. 집게 기계 buildClaw와 같은 꼴({root,set,state,fingers,head,cart,dot,tipWorld}), 손가락 자리·각도 식도 같다.
// floorAt(x,z) = 그 자리 바닥 높이(받침판 또는 구멍 바닥). 그림자 점 높이를 안 주거나 기계 바닥(floorY)으로 주면 이것을 씀
function buildClaw2(mats,floorAt){
 const C=CLAW,root=new THREE.Group();root.name='집게';
 const gantry=new THREE.Group();gantry.name='집게 가로대';root.add(gantry);
 gantry.add(new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,C.width-.08,8).rotateZ(Math.PI/2),mats.metal));
 const cart=new THREE.Group();cart.name='집게 수레';gantry.add(cart);
 cart.add(new THREE.Mesh(new RoundedBoxGeometry(.09,.05,.07,2,.012),mats.accent));
 const cable=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,1,6).translate(0,-.5,0),mats.dark);cable.name='집게 줄';cart.add(cable);
 const head=new THREE.Group();head.name='집게 머리';cart.add(head);head.scale.setScalar(C.clawTip/.14);
 // 가로로 긴 모터 머리(팔 둘이 좌우 끝에 달림) + 가운데 작은 위 덮개
 head.add(new THREE.Mesh(new RoundedBoxGeometry(.1,.045,.05,2,.012).translate(0,.022,0),mats.accent));
 head.add(new THREE.Mesh(new THREE.CylinderGeometry(.02,.026,.03,10).translate(0,.055,0),mats.metal));
 const fingers=[],armMat=mats.metal,toeMat=mats.rubber;
 for(const yaw of [Math.PI/2,-Math.PI/2]){const pivot=new THREE.Group();pivot.rotation.y=yaw;head.add(pivot);
  const f=new THREE.Group();f.position.set(0,0,.03);pivot.add(f);
  // 집게 기계 손가락과 같은 길(끝 = (0,−0.14,0))을 납작하고 넓은 팔로: 사각 단면 관을 옆(x)으로 3배
  // 곧게 내려오다 끝만 안으로 꺾인 팔(둥근 고리처럼 안 보이게): 어깨 → 바깥 0.035 → 곧게 아래 → 끝(0,−0.14,0)
  const pts=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.012,.034),new THREE.Vector3(0,-.11,.036),new THREE.Vector3(0,-.14,0)];
  const path=new THREE.CurvePath();for(let i=0;i<3;i++)path.add(new THREE.LineCurve3(pts[i],pts[i+1]));
  const arm=new THREE.TubeGeometry(path,12,.008,4,false).scale(2.4,1,1);f.add(new THREE.Mesh(arm,armMat));
  const elbow=new THREE.Mesh(new THREE.SphereGeometry(.011,8,6).translate(0,-.11,.036),mats.accent);f.add(elbow);
  // 안으로 꺾인 고무 발끝(넓적한 받침)
  const toe=new THREE.Mesh(new RoundedBoxGeometry(.04,.012,.026,2,.005).translate(0,-.142,-.004),toeMat);toe.rotation.x=0;f.add(toe);
  fingers.push(f);}
 const dot=new THREE.Mesh(new THREE.CircleGeometry(.035,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#2b2f36',transparent:true,opacity:.35,depthWrite:false}));dot.name='집게 그림자 점';dot.renderOrder=1;root.add(dot);
 const state={x:C.home[0],z:C.home[1],drop:0,open:0};
 const set=({x=state.x,z=state.z,drop=state.drop,open=state.open,opens=null,dotY=null}={})=>{
  Object.assign(state,{x,z,drop,open});
  gantry.position.set(0,C.railY,z);cart.position.x=x;
  const len=Math.max(.02,C.railY-C.clawTip-C.clawTop+drop);cable.scale.y=len;head.position.y=-len;
  fingers.forEach((f,i)=>{f.rotation.x=FINGER_ANGLE.shut+(opens?.[i]??open)*(FINGER_ANGLE.wide-FINGER_ANGLE.shut);});
  dot.position.set(x,(dotY==null||dotY<=C.floorY+1e-6?floorAt(x,z):dotY)+.004,z);
 };
 set({});
 return {root,set,state,fingers,head,cart,dot,prongs:2,tipWorld:(out=new THREE.Vector3())=>head.getWorldPosition(out).add(new THREE.Vector3(0,-C.clawTip,0))};
}

// 반짝임(상자 다시 놓기·새 상자): 작은 네 꼭지 별 6개를 한 메시로
function sparkle(){const P=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2,r=.07+(i%2)*.03,s=.018+(i%3)*.006,sh=new THREE.Shape();
  for(let k=0;k<8;k++){const t=k/8*Math.PI*2,q=k%2?s*.32:s;k?sh.lineTo(Math.cos(t)*q,Math.sin(t)*q):sh.moveTo(q,0);}
  P.push(new THREE.ShapeGeometry(sh).translate(Math.cos(a)*r,Math.sin(a)*r*.6+.02,0));}
 const m=new THREE.Mesh(mergeGeometries(P),new THREE.MeshBasicMaterial({color:'#fff3a8',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 P.forEach(x=>x.dispose());m.name='반짝임';m.renderOrder=6;m.visible=false;return m;}

/** 봉 기계 한 대. theme = MACHINES id(bridge-1~4). T = CLAW_TUNING(봉 굵기·길이·상자 크기) */
export function buildBridgeMachine(theme,{toonify=null,T=CLAW_TUNING}={}){
 const M=typeof theme==='string'?MACHINES.find(m=>m.id===theme):theme;if(!M)throw new Error(`기계 없음: ${theme}`);
 const C=CLAW,B=T.bridge,W=C.width,D=C.depth,hw=W/2,hd=D/2,bars=M.bars??{gap:B.gap},geom=bridgeGeom(C,bars,B),L=bridgeLayout(C,bars,B);
 const root=new THREE.Group();root.name=`봉 기계:${M.id}`;
 const mats={...bodyKit.machineMats(M),pit:std('#8a8f99',{roughness:.9}),pitWall:std('#c4c8cf',{roughness:.85}),exit:std('#0c0d10',{roughness:1}),deck:std(pale(M.accent,.72),{roughness:.7}),post:std('#dfe3e8',{roughness:.35,metalness:.2}),bar:std('#b7c0cb',{roughness:.28,metalness:.4}),grip:std('#8f98a3',{roughness:.4,metalness:.3})};
 const b=builder(),late=[];
 bodyKit.lowerBody(b,M);
 // 조작대: 손잡이 + 뽑기 단추 받침(집게 기계와 같은 자리)
 b.cyl('metal',.012,.012,.08,C.panel.stick[0],C.panel.top+.04,C.panel.stick[2]);b.sph('rubber',.028,C.panel.stick[0],C.panel.top+.09,C.panel.stick[2],12);
 b.cyl('dark',.045,.045,.015,C.panel.stick[0],C.panel.top+.008,C.panel.stick[2]);b.cyl('dark',.055,.055,.015,C.panel.button[0],C.panel.top+.008,C.panel.button[2]);
 // 위 간판 상자 위 장식 + 안쪽 뒤 불빛 판·레일·안쪽 앞 불빛 줄
 b.rbox('accent',W*.7,.05,D*.6,.02,0,C.height+.02,0);
 b.box('back',W-.07,C.glassTop-C.floorY-.02,.012,0,(C.glassTop+C.floorY)/2,-hd+.04);
 for(const sx of [-1,1])b.box('metal',.02,.02,D-.08,sx*(hw-.05),C.railY,0);
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,-hd+.08);
 // 바닥(11-23 대표 지적 2차, 실제 일본식 봉 기계 사진 2장): 봉 4개가 좌우로 기계 폭을 가로지름(claw-bridge-layout.js).
 //  봉 아래 = 양옆 레일 사이·앞뒤 막이 봉 바깥까지 통째로 뚫린 구덩이(밝은 회색 벽·앞이 낮은 비탈 바닥·앞 벽 아래 출구 → 앞 문).
 //  구덩이 밖(앞 막이 봉 앞·뒤 막이 봉 뒤·레일 바깥) = 받침판(윗면 = deckY). 두 받침 봉 사이 틈으로 빠지면 경품
 const iw=W-.06,id=D-.06,deckTop=C.floorY+L.deckY*U,P=L.pit,px0=P.x0*U,px1=P.x1*U,pz0=P.z0*U,pz1=P.z1*U,y=C.floorY+L.barY*U,r=L.barR*U;
 {const sh=new THREE.Shape([new THREE.Vector2(-iw/2,-id/2),new THREE.Vector2(iw/2,-id/2),new THREE.Vector2(iw/2,id/2),new THREE.Vector2(-iw/2,id/2)]);
  // 모양 평면 (x, −z) → 눕히면 위로 뽑힘
  sh.holes.push(new THREE.Path([new THREE.Vector2(px0,-pz1),new THREE.Vector2(px1,-pz1),new THREE.Vector2(px1,-pz0),new THREE.Vector2(px0,-pz0)]));
  b.add('deck',new THREE.ExtrudeGeometry(sh,{depth:deckTop-C.floorY,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,C.floorY,0));}
 // 구덩이: 앞·뒤 벽(받침판 옆면을 1mm 안에서 덮음), 양옆 벽(레일 밑까지 올라와 레일을 받침)·뒤가 높은 비탈 바닥·앞 벽 아래 출구
 const pw=px1-px0,pd=pz1-pz0,FALL=.05;
 {const ph=deckTop-C.floorY,py=(deckTop+C.floorY)/2;
  for(const z of [pz0+.001,pz1-.001])b.box('pitWall',pw,ph,.002,0,py,z);
  const sh=y-r-.014-C.floorY;for(const x of [px0+.001,px1-.001])b.box('pitWall',.002,sh,pd,x,C.floorY+sh/2,(pz0+pz1)/2);
  const slope=Math.atan2(FALL,pd);
  b.add('pit',new THREE.BoxGeometry(pw,.01,pd/Math.cos(slope)).rotateX(slope).translate(0,C.floorY+.03,(pz0+pz1)/2));
  // 비탈 위 앞쪽 화살표 셋(받는 쪽 → 출구)
  for(let i=0;i<3;i++){const z=pz0+pd*(.3+i*.2),yy=C.floorY+.03+FALL*(.5-(z-pz0)/pd)+.006;
   for(const k of [-1,1])b.add('trim',new THREE.BoxGeometry(.03,.003,.008).rotateY(k*.6).translate(k*.011,yy,z));}
  const ew=.09,eh=.075;
  b.rbox('dark',ew+.016,eh+.012,.006,.004,0,C.floorY+eh/2+.004,pz1-.004);
  b.box('exit',ew,eh,.008,0,C.floorY+eh/2+.002,pz1-.004);}
 // 구덩이 앞·뒤 끝 받침판 윗면 줄무늬(분홍·흰, 여기부터 구덩이라는 표시). 판정 바닥보다 1.5mm만 올라옴
 for(const z of [pz0,pz1]){const s=Math.sign(z),n=12,seg=pw/n;
  for(let i=0;i<n;i++)b.box(i%2?'trim':'accent',seg,.0015,.016,px0+seg*(i+.5),deckTop+.00075,z+s*.009);}
 b.build({...mats},root,{outline:new Set(['body','top','dark'])});
 // 봉 4개(사진: 맨 금속 관, 고무 없음) + 양옆 레일(사각 관, 구덩이 옆벽 위) + 봉 끝 죔쇠(레일 위). 봉 자리 = L.bars(판정과 같은 값)
 const inside=new THREE.Group();inside.name='봉·받침';root.add(inside);
 const parts={bar:[],grip:[],post:[]},RW=.022,v=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();
 for(const S of L.bars){const a=new THREE.Vector3(...S.a).multiplyScalar(U),bb=new THREE.Vector3(...S.b).multiplyScalar(U);a.y=bb.y=y;
  v.subVectors(bb,a);const len=v.length();q.setFromUnitVectors(up,v.normalize());
  // 봉은 레일 가운데까지(죔쇠 속으로)
  parts.bar.push(new THREE.CylinderGeometry(r,r,len+RW,12).applyQuaternion(q).translate((a.x+bb.x)/2,y,(a.z+bb.z)/2));
  for(const e of [a,bb]){const s=Math.sign(e.x);parts.grip.push(new RoundedBoxGeometry(.03,r*2+.014,.034,2,.004).translate(e.x+s*RW/2,y,e.z));}}
 for(const s of [-1,1]){const x=(s<0?px0:px1)+s*RW/2;
  parts.post.push(new RoundedBoxGeometry(RW,RW,pd,2,.004).translate(x,y-r-.003,(pz0+pz1)/2));}
 for(const [k,list] of Object.entries(parts)){const g=mergeGeometries(list.map(x=>{x.deleteAttribute('uv');return x.index?x.toNonIndexed():x;}),false);list.forEach(x=>x.dispose());
  const m=new THREE.Mesh(g,mats[k]);m.name=`봉 ${k}`;m.castShadow=k==='bar';m.receiveShadow=true;inside.add(m);if(k==='post')m.userData.wantLine=true;}
 bodyKit.glassBox(root,late,{chuteGuard:false});
 const button=new THREE.Mesh(new THREE.CylinderGeometry(.04,.042,.03,16),std('#e8443a',{emissive:new THREE.Color('#e8443a'),emissiveIntensity:.25,roughness:.4}));
 button.position.set(C.panel.button[0],C.panel.top+.025,C.panel.button[2]);button.name='뽑기 단추';root.add(button);
 const floorAt=(x,z)=>L.inPit(x/U,z/U)?C.floorY+.03+FALL*(.5-(z-pz0)/pd)+.006:deckTop;
 const claw=buildClaw2(mats,floorAt);root.add(claw.root);claw.root.remove(claw.dot);
 bodyKit.finish(root,mats,toonify,late);
 claw.root.add(claw.dot);
 {const sign=signMesh(M,W*.86,W*.86*3/8);if(sign){sign.position.set(0,C.glassTop+(C.height-C.glassTop)/2,hd+.004);root.add(sign);}}
 const lights=lightController(M,mats);
 // ── 상자(지금 경품). setBox(id) → 새 상자, placeBox(frame) → 물리 자세
 //  다시 놓기 연출(v4.1 §9-1): 보이던 상자가 있으면 0.6초 흐려지고, 새 상자는 그 뒤 처음 자리에 반짝이며 나타남. 떨어진(안 보이는) 뒤 새 상자는 바로 반짝
 let boxObj=null,fade=null,appearT=0,boxVisible=true;
 const fx=sparkle();root.add(fx);let fxT=0;
 const fadeMats=o=>{const list=[];o.traverse(x=>{if(x.isMesh){const ms=Array.isArray(x.material)?x.material:[x.material];x.material=ms.map(m=>{const c=m.clone();c.transparent=true;c.userData={...c.userData,fade:true};list.push([c,m.opacity??1]);return c;});if(x.material.length===1)x.material=x.material[0];}});return list;};
 const setBox=id=>{
  const prev=boxObj;boxObj=null;
  if(prev){if(prev.visible&&id!==null){if(fade)root.remove(fade.obj);fade={obj:prev,t:.6,mats:fadeMats(prev)};appearT=.6;}else root.remove(prev);}
  if(id){boxObj=makeBoxPrize(id,{toonify,box:B.box});root.add(boxObj);if(prev&&!appearT){fxT=.8;}boxObj.visible=!appearT;}
  return boxObj;};
 const e1=new THREE.Vector3(),e2=new THREE.Vector3(),e3=new THREE.Vector3(),Fw=new THREE.Matrix4(),Fl=new THREE.Matrix4(),va=new THREE.Vector3(),vb=new THREE.Vector3();
 const frameOf=(a,b2,out)=>{e1.copy(a).normalize();e2.copy(b2).addScaledVector(e1,-e1.dot(b2)).normalize();e3.crossVectors(e1,e2);return out.makeBasis(e1,e2,e3);};
 const placeBox=(f,{visible=true}={})=>{if(!boxObj)return;boxVisible=visible;boxObj.visible=visible&&appearT<=0;if(!f)return;
  va.fromArray(f.up);vb.fromArray(f.side);frameOf(va,vb,Fw);va.fromArray(f.lup);vb.fromArray(f.lside);frameOf(va,vb,Fl);Fw.multiply(Fl.transpose());
  boxObj.quaternion.setFromRotationMatrix(Fw);boxObj.position.set(f.p[0]*U,C.floorY+f.p[1]*U,f.p[2]*U);};
 // 판 전 자리 점선 윤곽 + 화살표(v4.1 §7-3, 2.5초 동안 흐려짐). showGhost(frameBefore, frameAfter)
 const [bw,bh,bl]=B.box;
 const ghostMat=new THREE.LineDashedMaterial({color:'#ffffff',dashSize:.02,gapSize:.014,transparent:true,opacity:0,depthTest:false});
 const ghost=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(bl,bh,bw)),ghostMat);ghost.computeLineDistances();ghost.renderOrder=5;ghost.visible=false;ghost.name='판 전 자리';root.add(ghost);
 const arrow=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),.1,'#ffe27a',.035,.025);arrow.visible=false;arrow.renderOrder=5;arrow.name='판 전 화살표';
 arrow.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.depthTest=false;o.material.transparent=true;}});root.add(arrow);
 let ghostT=0;
 const showGhost=(before,after)=>{if(!before){ghostT=0;ghost.visible=arrow.visible=false;return;}va.fromArray(before.up);vb.fromArray(before.side);frameOf(va,vb,Fw);va.fromArray(before.lup);vb.fromArray(before.lside);frameOf(va,vb,Fl);Fw.multiply(Fl.transpose());
  ghost.quaternion.setFromRotationMatrix(Fw);ghost.position.set(before.p[0]*U,C.floorY+before.p[1]*U,before.p[2]*U);ghost.visible=true;ghostT=2.5;
  if(after){const from=ghost.position.clone(),to=new THREE.Vector3(after.p[0]*U,C.floorY+after.p[1]*U,after.p[2]*U),d=to.clone().sub(from),L=d.length();
   if(L>.012){arrow.position.copy(from).setY(from.y+bh*.8);arrow.setDirection(d.normalize());arrow.setLength(L,Math.min(.035,L*.5),.025);arrow.visible=true;}else arrow.visible=false;}};
 const update=dt=>{lights.update(dt);
  if(ghostT>0){ghostT-=dt;const k=Math.max(0,Math.min(1,ghostT/2.5));ghostMat.opacity=.9*k;arrow.traverse(o=>{if(o.material)o.material.opacity=k;});if(ghostT<=0){ghost.visible=false;arrow.visible=false;}}
  if(fade){fade.t-=dt;const k=Math.max(0,fade.t/.6);for(const [m,o] of fade.mats)m.opacity=o*k;if(fade.t<=0){root.remove(fade.obj);for(const [m] of fade.mats)m.dispose();fade=null;}}
  if(appearT>0){appearT-=dt;if(appearT<=0){appearT=0;if(boxObj)boxObj.visible=boxVisible;fxT=.8;}}
  if(fxT>0){fxT-=dt;const k=Math.max(0,fxT/.8);if(boxObj){fx.position.copy(boxObj.position);fx.position.z+=bw/2+.02;}fx.visible=fxT>0;fx.material.opacity=Math.sin(k*Math.PI);fx.scale.setScalar(.7+(1-k)*.8);fx.rotation.z=(1-k)*.8;}
 };
 const press=(k=1)=>{button.position.y=C.panel.top+.025-.012*k;};
 root.userData={kind:'bridge',floorAt,layout:L,height:C.height,machine:M,claw,mats,setLights:lights.setLights,update,press,bars,geom,setBox,placeBox,showGhost,
  /** 상자 다시 놓는 중(흐려짐·반짝) — 기계 위 「정리 중」 불을 켤 때 */
  get tidying(){return !!fade||appearT>0;},get box(){return boxObj;},
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),stick:new THREE.Vector3(...C.panel.stick).setY(C.panel.top+.09),button:new THREE.Vector3(...C.panel.button).setY(C.panel.top+.04),
   coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),sign:new THREE.Vector3(0,C.height+.15,0)},pile:null};
 return root;
}
