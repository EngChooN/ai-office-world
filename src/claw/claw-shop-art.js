// 온라인 인형뽑기 가게 그림(월드아트, 2026-11-23): 바닥·벽·네온 간판·기계 세 대 자리·도감 진열장·오늘의 코인 받는 곳·의자·화분·가운데 큰 동동이 인형.
// 실제 가게를 따라 하지 않은 게임 속 오락실이다. 밝은 크림 벽 + 박하색 아랫벽 + 분홍·박하 네온(카툰 낮 톤, 밤 개념 없음 = 늘 실내 조명).
// 지붕은 없다(3인칭 카메라가 위에서 보므로). 벽 넷은 따로 된 묶음이라 카메라가 벽 밖으로 나가면 그 벽만 숨긴다(fadeWalls).
// 메모리: 정적 부분은 꼭짓점 색 덩어리 몇 개로 합침(텍스처는 간판·안내판 캔버스 3장, 합계 약 0.5MB). 기계·인형은 claw-machine-art.js·claw-plush.js.
// 좌표: 가게 가운데 바닥 = (0,0,0), 문은 +Z 벽(입구), 기계는 −Z 벽을 등지고 +Z를 본다. 1 = 1m.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MACHINES,SHOP_COLORS,RARITY,RARITY_ORDER,PLUSH} from './claw-palette.js';
import {buildClawMachine,fillPile,CLAW} from './claw-machine-art.js';
import {buildMachine} from './claw-machines-more.js';
import {makePlush,plushGeometry,plushSize} from './claw-plush.js';
import {resolvePool} from './claw-guest.js';

export const SHOP=Object.freeze({
 w:9,d:7.5,wallH:2.6,wallT:.18,tile:.5,
 door:Object.freeze({x:0,width:1.5,height:2.1}),
 machineZ:-3.75+.12+CLAW.depth/2,           // 기계 가운데 z(뒷벽에 붙임)
 machineX:Object.freeze([-2.1,0,2.1]),       // 기계 세 대 x(MACHINES 순서: 숲속·도시·별빛)
 spawn:Object.freeze({x:0,z:2.75,heading:Math.PI}), // 들어온 자리(문 안쪽, 기계 쪽을 봄). heading: 0 = +Z를 봄
 walk:Object.freeze({x:[-4.15,4.15],z:[-3.5,3.4]}), // 걸을 수 있는 네모(벽 안쪽)
 showcase:Object.freeze({x:-4.5+.25,z:-.5,len:3.4}), // 도감 진열장(왼쪽 벽, x = 인형이 놓이는 선반 가운데)
 kiosk:Object.freeze({x:4.5-.4,z:-1.3}),           // 오늘의 코인 받는 곳(오른쪽 벽)
 bench:Object.freeze({x:4.5-.35,z:1.3,len:1.6}),
 statue:Object.freeze({x:0,z:.3,r:.75}),            // 가운데 큰 동동이 인형 받침
});
// 실내 빛 추천값(미리보기와 같은 값). 하늘·해 없이 반구광 + 위에서 비추는 그림자 빛 하나. 점광원은 안 쓴다(카툰 light-cap·휴대폰 비용).
export const SHOP_LIGHT=Object.freeze({hemi:{sky:'#fff6e8',ground:'#d9c6a4',intensity:1.25},key:{color:'#fff1dc',intensity:2.2,pos:[3,9,5],shadow:{size:7,map:1024}},background:'#f6e6cf',exposure:1});

const FONT='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const _c=new THREE.Color();
// 꼭짓점 색 조각
function paint(g,hex){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
 _c.set(hex);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_c.r,_c.g,_c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
const B=(w,h,d,x,y,z,hex,ry=0)=>{const g=new THREE.BoxGeometry(w,h,d);if(ry)g.rotateY(ry);return paint(g.translate(x,y,z),hex);};
const RB=(w,h,d,r,x,y,z,hex)=>paint(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001)).translate(x,y,z),hex);
const CY=(r0,r1,h,x,y,z,hex,seg=16)=>paint(new THREE.CylinderGeometry(r0,r1,h,seg).translate(x,y,z),hex);
const SP=(r,x,y,z,hex,seg=10)=>paint(new THREE.SphereGeometry(r,seg,Math.max(6,seg*.6|0)).translate(x,y,z),hex);
function vmesh(parts,name,{shadow=true,emissive=null}={}){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,...(emissive?{emissive:new THREE.Color(emissive),emissiveIntensity:.9}:{})}));m.name=name;m.castShadow=shadow;m.receiveShadow=true;return m;}
function canvasTex(w,h,draw){if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function board(tex,w,h,{glow=.15}={}){if(!tex)return new THREE.Group();return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,emissive:new THREE.Color('#ffffff'),emissiveMap:tex,emissiveIntensity:glow,roughness:.7,transparent:true,alphaTest:.05}));}

// ── 글자판
const neonTex=()=>canvasTex(512,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.font=`900 84px ${FONT}`;
 g.lineJoin='round';g.strokeStyle=SHOP_COLORS.neonPink;g.lineWidth=14;g.globalAlpha=.35;g.strokeText('인형뽑기',w/2,h/2+4);g.globalAlpha=1;
 g.lineWidth=5;g.strokeStyle='#fff3f8';g.strokeText('인형뽑기',w/2,h/2+4);g.fillStyle=SHOP_COLORS.neonPink;g.fillText('인형뽑기',w/2,h/2+4);});
const rarityTex=()=>canvasTex(256,320,(g,w,h)=>{g.fillStyle='#fffaf0';g.beginPath();g.roundRect(4,4,w-8,h-8,18);g.fill();g.strokeStyle=SHOP_COLORS.wallTrim;g.lineWidth=6;g.stroke();
 g.fillStyle='#3a2a20';g.textAlign='center';g.font=`900 30px ${FONT}`;g.fillText('인형 희귀도',w/2,46);
 RARITY_ORDER.forEach((k,i)=>{const R=RARITY[k],y=88+i*58;g.fillStyle=R.color;g.beginPath();g.arc(52,y,20,0,Math.PI*2);g.fill();g.strokeStyle='#fffaf0';g.lineWidth=4;g.stroke();
  g.fillStyle='#fffaf0';g.font=`900 16px ${FONT}`;g.fillText('★'.repeat(R.stars).slice(0,2),52,y+6);
  g.textAlign='left';g.fillStyle='#3a2a20';g.font=`800 26px ${FONT}`;g.fillText(R.label,86,y+2);g.fillStyle='#8a7a66';g.font=`600 15px ${FONT}`;g.fillText(['작고 자주 나와요','조금 커요','크고 드물어요','가장 크고 귀해요'][i],86,y+22);g.textAlign='center';});});
const textTex=(lines,{bg='#5aa88e',fg='#fffaf0',w=256,h=96,size=34}={})=>canvasTex(w,h,(g)=>{g.fillStyle=bg;g.beginPath();g.roundRect(3,3,w-6,h-6,16);g.fill();g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
 lines.forEach((t,i)=>{g.font=`${i?700:900} ${i?size*.55:size}px ${FONT}`;g.fillText(t,w/2,h/2+(i-(lines.length-1)/2)*size*.95);});});

// ── 벽 하나(가로 len, 가운데 cx,cz, 회전 ry, 안쪽 법선 n). 문 구멍(hole: {x,w,h})이 있으면 세 조각으로.
function wallParts(len,hole=null){
 const S=SHOP,C=SHOP_COLORS,H=S.wallH,T=S.wallT,low=.9,out=[];
 const seg=(x0,x1,y0,y1)=>{const w=x1-x0,cx=(x0+x1)/2;if(w<=.01||y1-y0<=.01)return;
  const a=Math.min(y1,low);if(a>y0)out.push(B(w,a-y0,T,cx,(y0+a)/2,0,C.wallLow));
  const b=Math.max(y0,low);if(y1>b)out.push(B(w,y1-b,T,cx,(b+y1)/2,0,C.wall));
  if(y0<low&&y1>low)out.push(B(w,.06,T+.03,cx,low,0,C.wallTrim));
  if(y0<.01)out.push(B(w,.1,T+.04,cx,.05,0,C.wallTrim));};
 if(!hole)seg(-len/2,len/2,0,H);
 else{seg(-len/2,hole.x-hole.w/2,0,H);seg(hole.x+hole.w/2,len/2,0,H);seg(hole.x-hole.w/2,hole.x+hole.w/2,hole.h,H);}
 out.push(B(len,.08,T+.06,0,H-.04,0,C.wallTrim)); // 위 테
 return out;
}

// ── 가게 전체. guests/guestObject = 개발용 손님 인형(claw-guest.js), mobile = 휴대폰(더미 인형 수 줄임)
// 반환 root.userData: machines[{id,kind,group,x,z,heading,stand}]·walls·fadeWalls(camera)·colliders·spots·showcase.set(ids)·update(dt)
export function buildClawShop({toonify=null,mobile=false,guests=[],guestObject=null,pileSeed=7,kinds=false}={}){
 const S=SHOP,C=SHOP_COLORS,root=new THREE.Group();root.name='인형뽑기 가게';
 const hw=S.w/2,hd=S.d/2,stat=new THREE.Group();stat.name='가게 정적';root.add(stat);
 // 바닥: 0.5m 체크 타일(크림 두 색) + 가장자리 띠
 {const p=[];const nx=Math.round(S.w/S.tile),nz=Math.round(S.d/S.tile);
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const g=new THREE.PlaneGeometry(S.tile,S.tile).rotateX(-Math.PI/2).translate(-hw+S.tile*(i+.5),0,-hd+S.tile*(j+.5));p.push(paint(g,(i+j)%2?C.floorA:C.floorB));}
  const f=vmesh(p,'가게 바닥',{shadow:false});stat.add(f);}
 // 동그란 깔개(가운데 동동이 둘레)
 {const g=paint(new THREE.CircleGeometry(S.statue.r+.75,40).rotateX(-Math.PI/2).translate(S.statue.x,.006,S.statue.z),C.rug),g2=paint(new THREE.RingGeometry(S.statue.r+.6,S.statue.r+.75,40).rotateX(-Math.PI/2).translate(S.statue.x,.008,S.statue.z),C.rugEdge);
  stat.add(vmesh([g,g2],'깔개',{shadow:false}));}
 // 기계 앞 발판(손님이 서는 자리 표시, 기계 색)
 MACHINES.forEach((M,i)=>{const x=S.machineX[i],z=S.machineZ+CLAW.stand.z;const g=paint(new RoundedBoxGeometry(.9,.012,.6,2,.005).translate(x,.006,z-.05),M.body);const m=vmesh([g],`발판:${M.id}`,{shadow:false});stat.add(m);});
 // 벽 넷: 뒤(−Z)·앞(+Z, 문)·왼쪽(−X)·오른쪽(+X). 각각 따로 둔다.
 // 벽에 붙은 것(간판·전구·안내판·문)은 그 벽 묶음에 넣어 벽과 같이 숨는다.
 const walls=[],side={};
 const addWall=(key,name,len,pos,ry,inward,hole)=>{const grp=new THREE.Group();grp.name=name;stat.add(grp);const m=vmesh(wallParts(len,hole),name);m.position.copy(pos);m.rotation.y=ry;grp.add(m);walls.push({mesh:grp,point:pos.clone(),inward,key});side[key]=grp;return grp;};
 addWall('back','뒷벽',S.w+S.wallT*2,new THREE.Vector3(0,0,-hd-S.wallT/2),0,new THREE.Vector3(0,0,1));
 addWall('front','앞벽',S.w+S.wallT*2,new THREE.Vector3(0,0,hd+S.wallT/2),0,new THREE.Vector3(0,0,-1),{x:S.door.x,w:S.door.width,h:S.door.height});
 addWall('left','왼벽',S.d,new THREE.Vector3(-hw-S.wallT/2,0,0),Math.PI/2,new THREE.Vector3(1,0,0));
 addWall('right','오른벽',S.d,new THREE.Vector3(hw+S.wallT/2,0,0),Math.PI/2,new THREE.Vector3(-1,0,0));
 // 문: 하늘색 유리문 두 짝 + 틀(허브로 나가는 곳)
 {const p=[],d=S.door,z=hd;
  for(const sx of [-1,1])p.push(B(.08,d.height,.22,d.x+sx*(d.width/2+.04),d.height/2,z,C.doorFrame));p.push(B(d.width+.16,.1,.22,d.x,d.height+.05,z,C.doorFrame));
  for(const sx of [-1,1]){p.push(B(d.width/2-.04,.08,.05,d.x+sx*d.width/4,.04,z,C.doorFrame),B(d.width/2-.04,.06,.05,d.x+sx*d.width/4,d.height-.03,z,C.doorFrame),B(.05,.3,.07,d.x+sx*.12,1.0,z,C.metal));}
  const f=vmesh(p,'문 틀');side.front.add(f);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(d.width-.04,d.height-.08),new THREE.MeshStandardMaterial({color:C.door,transparent:true,opacity:.45,roughness:.1,depthWrite:false,side:THREE.DoubleSide}));
  glass.position.set(d.x,d.height/2,z);glass.name='문 유리';glass.renderOrder=2;side.front.add(glass);
  // 문 위 「허브로」 표시판(안쪽을 봄)
  const exit=board(textTex(['허브로 나가기'],{bg:C.doorFrame,size:30,h:72}),.9,.25,{glow:.3});exit.position.set(d.x,d.height+.32,z-.12);exit.rotation.y=Math.PI;exit.name='허브로 표시';side.front.add(exit);}
 // 뒷벽 네온 간판 「인형뽑기」 + 별 장식
 {const neon=board(neonTex(),2.6,.65,{glow:1.1});neon.position.set(0,2.05,-hd+.02);neon.name='네온 간판';side.back.add(neon);
  const p=[];for(const [x,y,c] of [[-1.8,2.15,C.neonMint],[1.8,2.15,C.neonYellow],[-2.3,1.85,C.neonYellow],[2.3,1.85,C.neonMint]]){const g=new THREE.OctahedronGeometry(.09,0);g.scale(1,1,.3);p.push(paint(g.translate(x,y,-hd+.04),c));}
  side.back.add(vmesh(p,'네온 별',{shadow:false,emissive:'#ffffff'}));}
 // 벽 위 전구 줄(네 벽, 0.45m 간격)
 {const cols=[C.neonPink,C.neonYellow,C.neonMint],y=S.wallH-.16;let k=0;const P={back:[],front:[],left:[],right:[]};
  for(let x=-hw+.3;x<=hw-.3;x+=.45){P.back.push(SP(.035,x,y,-hd+.05,cols[k++%3],8));if(Math.abs(x-S.door.x)>S.door.width/2+.1)P.front.push(SP(.035,x,y,hd-.05,cols[k++%3],8));}
  for(let z=-hd+.3;z<=hd-.3;z+=.45){P.left.push(SP(.035,-hw+.05,y,z,cols[k++%3],8));P.right.push(SP(.035,hw-.05,y,z,cols[k++%3],8));}
  for(const [key,p] of Object.entries(P)){const m=vmesh(p,'전구 줄',{shadow:false,emissive:'#ffffff'});m.material.emissiveIntensity=.55;side[key].add(m);}}
 // 도감 진열장(왼쪽 벽): 3단 선반, 모은 인형은 색, 못 모은 인형은 회색 실루엣(도감 「?」와 같은 뜻)
 const sc=S.showcase,shelfY=[.55,1.05,1.55];
 {const p=[],wx=-hw;
  // 얇은 뒤판(벽에 붙음) + 옆판 둘 + 선반 3단 + 아래 받침장. 인형은 선반 위 가운데(x = wx + 0.25)
  p.push(RB(.06,1.9,sc.len+.1,.02,wx+.03,.95,sc.z,C.shelf));
  for(const s of [-1,1])p.push(RB(.44,1.9,.06,.02,wx+.22,.95,sc.z+s*(sc.len/2+.02),C.shelf));
  for(const y of shelfY)p.push(B(.42,.04,sc.len,wx+.25,y,sc.z,C.counterTop));
  p.push(B(.44,.3,sc.len+.1,wx+.22,.15,sc.z,C.counter),B(.44,.04,sc.len+.1,wx+.22,1.92,sc.z,C.shelf));
  stat.add(vmesh(p,'도감 진열장'));
  const t=board(textTex(['우리 인형 도감','모은 인형이 여기 놓여요'],{bg:C.wallTrim,size:30}),1.0,.38,{glow:.2});t.position.set(-hw+.02,2.15,sc.z);t.rotation.y=Math.PI/2;t.name='도감 진열장 표시';side.left.add(t);}
 // 오늘의 코인 받는 곳(오른쪽 벽): 동전 그림 상자 + 받는 접시(사는 단추 없음 — 설계 ⑨)
 {const k=S.kiosk,p=[];p.push(RB(.55,1.25,.5,.06,k.x,.625,k.z,C.wallTrim),RB(.5,.06,.36,.02,k.x-.06,.62,k.z,C.counterTop),B(.36,.12,.3,k.x-.12,.32,k.z,C.chute));
  p.push(paint(new THREE.CylinderGeometry(.16,.16,.04,24).rotateZ(Math.PI/2).translate(k.x-.29,.98,k.z),C.coin),paint(new THREE.CylinderGeometry(.11,.11,.05,20).rotateZ(Math.PI/2).translate(k.x-.3,.98,k.z),C.coinDark));
  stat.add(vmesh(p,'오늘의 코인'));
  const t=board(textTex(['오늘의 코인','매일 무료로 받아요'],{bg:C.coinDark,size:30}),.62,.24,{glow:.25});t.position.set(k.x-.28,1.38,k.z);t.rotation.y=-Math.PI/2;t.name='오늘의 코인 표시';stat.add(t);}
 // 의자(오른쪽 벽) + 희귀도 안내판
 {const b=S.bench,p=[];p.push(RB(.4,.08,b.len,.03,b.x,.36,b.z,C.bench),RB(.08,.4,b.len,.03,b.x+.18,.6,b.z,C.bench));for(const s of [-1,1])p.push(B(.32,.32,.06,b.x,.16,b.z+s*(b.len/2-.1),C.metalDark));
  stat.add(vmesh(p,'의자'));
  const r=board(rarityTex(),.62,.78,{glow:.12});r.position.set(S.w/2-.02,1.45,b.z+.1);r.rotation.y=-Math.PI/2;r.name='희귀도 안내판';side.right.add(r);}
 // 화분 넷(구석)
 {const p=[];for(const [x,z] of [[-hw+.4,hd-.4],[hw-.4,hd-.4],[-hw+.4,-hd+.45],[hw-.4,-hd+.45]]){p.push(CY(.2,.15,.36,x,.18,z,C.pot,12));for(let i=0;i<5;i++){const a=i*1.26;p.push(SP(.17,x+Math.cos(a)*.11,.5+(i%2)*.12,z+Math.sin(a)*.11,C.plant,8));}p.push(SP(.18,x,.72,z,C.plant,8));}
  stat.add(vmesh(p,'화분'));}
 // 가운데 받침(큰 동동이 인형은 아래에서 따로)
 {const s=S.statue,p=[CY(s.r,s.r+.05,.32,s.x,.16,s.z,C.counter,28),CY(s.r-.04,s.r-.04,.04,s.x,.34,s.z,C.counterTop,28)];stat.add(vmesh(p,'인형 받침'));}
 toonify?.(stat,{kind:'prop',keepMaps:true});
 // 큰 동동이 인형(사진 찍는 자리 느낌, 실제 크기 약 1.0m)
 {const big=makePlush('dongdong',{toonify});big.scale.setScalar(1.0/plushSize('dongdong'));big.position.set(S.statue.x,.36,S.statue.z);big.rotation.y=.25;big.name='큰 동동이 인형';root.add(big);}
 // 기계 세 대 + 인형 더미
 // kinds=true면 기계 종류대로(도시 = 타이머, 별빛 = 열쇠, claw-machines-more.js). 기본은 세 대 모두 집게(월드개발이 타이머·열쇠 규칙을 붙일 때 켠다).
 const machines=MACHINES.map((M,i)=>{const kind=kinds?M.kind??'claw':'claw';
  const g=kind==='claw'?buildClawMachine(M.id,{toonify}):buildMachine(M.id,{toonify,guestObject,...(kind==='timer'?{prize:resolvePool(M.pool,guests)[0]}:{cells:resolvePool(M.cells??M.pool,guests)})});
  const x=S.machineX[i],z=S.machineZ;g.position.set(x,0,z);root.add(g);
  if(kind==='claw')fillPile(g,resolvePool(M.pool,guests),{count:mobile?9:14,seed:pileSeed+i*101,toonify,guestObject});
  return {id:M.id,kind,name:M.name,group:g,x,z,heading:0,stand:new THREE.Vector3(x,0,z+CLAW.stand.z)};});
 // 진열장 인형(모은 것 색, 못 모은 것 회색 실루엣). 인형 형상은 기계와 같은 것을 공유.
 const shelf=new THREE.Group();shelf.name='진열장 인형';root.add(shelf);
 const silMat=new THREE.MeshStandardMaterial({color:'#a59a8a',roughness:1,name:'claw-silhouette'});const sil=toonify?(()=>{const m=new THREE.Mesh(new THREE.BufferGeometry(),silMat);toonify(m,{kind:'prop'});return m.material;})():silMat;
 const shelfIds=PLUSH.map(p=>p.id),slots=[];
 shelfIds.forEach((id,i)=>{const row=Math.floor(i/3),col=i%3,y=shelfY[2-Math.min(row,2)]+.02,z=sc.z-sc.len/2+.55+col*1.15+(row===2?.55:0);slots.push({id,pos:new THREE.Vector3(sc.x,y,z)});});
 const shownObjs=new Map();
 const showcase={slots,set(ids){const have=new Set(ids);for(const o of shownObjs.values())shelf.remove(o);shownObjs.clear();
  for(const s of slots){let o;if(have.has(s.id))o=makePlush(s.id,{toonify});else{o=new THREE.Mesh(plushGeometry(s.id).color,sil);o.scale.setScalar(plushSize(s.id));o.castShadow=true;}
   o.position.copy(s.pos);o.rotation.y=Math.PI/2;shelf.add(o);shownObjs.set(s.id,o);}}};
 showcase.set([]);
 // 부딪힘(가게 좌표 네모 x0,z0,x1,z1 / 동그라미 x,z,r). 벽은 walk 네모로.
 const pd=CLAW.depth/2+CLAW.panel.depth;
 const colliders=[...machines.map(m=>({x0:m.x-CLAW.width/2-.03,z0:m.z-CLAW.depth/2-.03,x1:m.x+CLAW.width/2+.03,z1:m.z+pd,id:m.id})),
  {x0:-hw,z0:sc.z-sc.len/2-.06,x1:-hw+.47,z1:sc.z+sc.len/2+.06,id:'showcase'},{x0:S.kiosk.x-.33,z0:S.kiosk.z-.28,x1:hw,z1:S.kiosk.z+.28,id:'kiosk'},
  {x0:S.bench.x-.22,z0:S.bench.z-S.bench.len/2,x1:hw,z1:S.bench.z+S.bench.len/2,id:'bench'},
  ...[[-hw+.4,hd-.4],[hw-.4,hd-.4],[-hw+.4,-hd+.45],[hw-.4,-hd+.45]].map(([x,z],i)=>({x,z,r:.28,id:`plant-${i}`})),{x:S.statue.x,z:S.statue.z,r:S.statue.r+.05,id:'statue'}];
 // 카메라가 벽 바깥(벽면에서 0.05m 이상)으로 나가면 그 벽만 숨긴다. 가게를 다른 곳에 놓았으면 root 기준으로 바꿔서 본다.
 const _p=new THREE.Vector3();
 const fadeWalls=camera=>{_p.copy(camera.position);root.worldToLocal(_p);for(const w of walls){const d=_p.clone().sub(w.point).dot(w.inward);w.mesh.visible=d>-.05;}};
 const update=dt=>{for(const m of machines)m.group.userData.update(dt);};
 root.userData={machines,walls,fadeWalls,colliders,showcase,update,
  spots:{spawn:new THREE.Vector3(S.spawn.x,0,S.spawn.z),door:new THREE.Vector3(S.door.x,0,S.d/2-.5),kiosk:new THREE.Vector3(S.kiosk.x-.75,0,S.kiosk.z),bench:new THREE.Vector3(S.bench.x-.05,.44,S.bench.z),showcase:new THREE.Vector3(-hw+1.2,0,sc.z),statue:new THREE.Vector3(S.statue.x,0,S.statue.z+S.statue.r+.5)}};
 return root;
}
