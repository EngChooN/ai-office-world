// 온라인 인형뽑기 가게 그림(월드아트, 2026-11-23): 바닥·벽·네온 간판·기계 세 대 자리·도감 진열장·오늘의 코인 받는 곳·의자·가운데 유리 진열탑 큰 동동이 인형.
// 11-23 2차(대표 피드백): 밝은 오락실 → 한국 무인 인형뽑기방 분위기. 짙은 보라 벽·흑백 체크 바닥·분홍/하늘/보라 네온·장식 기계 줄·미러볼·낮은 의자는
// claw-arcade-art.js(look = neon 기본 | pastel 대안). 실제 가게를 따라 하지 않은 게임 속 뽑기방이다(밤 개념 없음 = 늘 실내 조명).
// 지붕은 없다(3인칭 카메라가 위에서 보므로). 벽 넷은 따로 된 묶음이라 카메라가 벽 밖으로 나가면 그 벽만 숨긴다(fadeWalls).
// 메모리: 정적 부분은 꼭짓점 색 덩어리 몇 개로 합침(텍스처는 간판·안내판 캔버스 + 바닥 번짐 64px, 합계 약 0.6MB). 기계·인형은 claw-machine-art.js·claw-plush.js.
// 좌표: 가게 가운데 바닥 = (0,0,0), 문은 +Z 벽(입구), 기계는 −Z 벽을 등지고 +Z를 본다. 1 = 1m.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MACHINES,SHOP_COLORS,RARITY,RARITY_ORDER,PLUSH,baseOfPlush} from './claw-palette.js';
import {buildClawMachine,fillPile,CLAW,signAtlas,atlasPlane} from './claw-machine-art.js';
import {attachLod} from './claw-machine-lod.js';
import {buildMachine,TIMER} from './claw-machines-more.js';
import {buildBridgeMachine} from './claw-bridge.js';
import {buildStackMachine} from './claw-stack.js';
import {dressStackMachine} from './claw-stack-art.js'; // 월드아트 정식 꾸밈(별·줄 불·밤하늘)
import {makePlush,plushGeometry,plushSize,plushMaterial,plushLineMaterial,plushLineWidth} from './claw-plush.js';
import {resolvePool} from './claw-guest.js';
import {buildArcadeDecor,ARCADE_LOOKS,DEFAULT_LOOK,arcadeLook} from './claw-arcade-art.js';

// 11-23 기계 확대(월드디자인 설계 v4 §2, 대표 승인 v4.1): 14 × 11m, 기계 16대 + 빈 자리 2곳. 배치·방향은 월드개발이 옮김(장식 기계는 없앰).
// 기계 자리 = MACHINE_SPOTS[MACHINES 순서] {x,z,heading}: heading 0 = 기계 앞이 +Z(문 쪽), π/2 = +X, π = −Z. 서는 자리 = 기계 좌표 (0,0,CLAW.stand.z)를 돌린 곳.
const spot=(x,z,heading)=>Object.freeze({x,z,heading});
export const MACHINE_SPOTS=Object.freeze([
 ...[-2.875,-1.725,-.575,.575,1.725,2.875].map(x=>spot(x,-4.95,0)),   // 집게 1~6: 뒷벽, 문 쪽을 봄
 ...[-2.4,-1.1,.2,1.5].map(z=>spot(-6.45,z,Math.PI/2)),              // 봉 1~4: 왼벽, +X를 봄
 ...[-1.15,0,1.15].map(x=>spot(x,.45,0)),                            // 타이머 1~3: 가운데 섬 앞쪽(문을 봄)
 ...[-1.15,0,1.15].map(x=>spot(x,-.45,Math.PI)),                     // 열쇠 1~3: 가운데 섬 뒤쪽(뒷벽을 봄)
 // 11-27 새 기계(앞벽 빈 자리 A·B에서, 가게 안쪽을 봄): 불빛 쌓기 = 빈 자리 A(문 왼쪽)
 spot(-2.4,4.95,Math.PI),
]);
export const SHOP=Object.freeze({
 w:14,d:11,wallH:2.6,wallT:.18,tile:.5,
 door:Object.freeze({x:0,width:1.5,height:2.1}),
 spawn:Object.freeze({x:0,z:4.6,heading:Math.PI}), // 들어온 자리(문 안쪽, 섬 쪽을 봄). heading: 0 = +Z를 봄
 walk:Object.freeze({x:[-6.65,6.65],z:[-5.15,5.1]}), // 걸을 수 있는 네모(벽 안쪽)
 showcase:Object.freeze({x:7-.25,z:-1.5,len:3.0,side:1}), // 도감 진열장(오른벽 z −3~0, x = 인형이 놓이는 선반 가운데, side 1 = 오른벽)
 kiosk:Object.freeze({x:7-.4,z:1.2}),              // 오늘의 코인 받는 곳(오른쪽 벽)
 bench:Object.freeze({x:7-.35,z:-4.2,len:1.4}),
 statue:Object.freeze({x:5.4,z:3.6,r:.75}),         // 진열탑 큰 동동이 인형 받침(오른쪽 앞)
 empty:Object.freeze([spot(2.4,4.95,Math.PI)]), // 빈 자리(앞벽, 「준비 중」 덮개). 11-27 A(−2.4)에 불빛 쌓기가 들어감
 stools:Object.freeze([[-5.6,4.4,0],[-4.9,4.6,1],[-5.25,3.8,2],[-4.4,4.0,0]]), // 왼쪽 앞 구석 낮은 의자 넷(구경·채팅 자리)
 balls:Object.freeze([[-3.2,-2.2],[3.2,-2.2],[0,2.6]]),
 decorCabinets:false,                                // 장식 기계(못 노는 기계) 없음(v4 §1-2)
});
/** 기계 좌표 (x,z) → 가게 좌표(기계 자리 m = {x,z,heading}) */
export const machineToShop=(m,x,z)=>{const c=Math.cos(m.heading),s=Math.sin(m.heading);return [m.x+x*c+z*s,m.z-x*s+z*c];};
/** 기계 좌표 네모 → 가게 좌표 네모(방향은 90° 단위) */
const rectToShop=(m,x0,z0,x1,z1)=>{const a=machineToShop(m,x0,z0),b=machineToShop(m,x1,z1);return {x0:Math.min(a[0],b[0]),z0:Math.min(a[1],b[1]),x1:Math.max(a[0],b[0]),z1:Math.max(a[1],b[1])};};
// 실내 빛 추천값(미리보기와 같은 값). 하늘·해 없이 반구광 + 위에서 비추는 그림자 빛 하나. 점광원은 안 쓴다(카툰 light-cap·휴대폰 비용).
// 무인 뽑기방(11-23 2차): 반구광을 보랏빛으로, background = 천장 없는 위쪽(짙은 보라 = 어두운 천장). 그림 방향마다 SHOP_LIGHTS[look].
export const SHOP_LIGHTS=Object.freeze(Object.fromEntries(Object.entries(ARCADE_LOOKS).map(([k,v])=>[k,v.light])));
export const SHOP_LIGHT=SHOP_LIGHTS[DEFAULT_LOOK];

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
// 네온 글자: 번지는 색 테두리 → 흰 심(네온관처럼). sub는 작은 둘째 줄(하늘색)
const neonTex=(text,sub,{pink,sky})=>canvasTex(512,160,(g,w,h)=>{g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
 const line=(t,y,px,col)=>{g.font=`900 ${px}px ${FONT}`;g.strokeStyle=col;g.globalAlpha=.3;g.lineWidth=px*.22;g.strokeText(t,w/2,y);g.globalAlpha=1;g.lineWidth=px*.09;g.strokeText(t,w/2,y);g.fillStyle='#fff6fb';g.fillText(t,w/2,y);};
 line(text,62,84,pink);if(sub)line(sub,132,34,sky);});
const rarityTex=()=>canvasTex(256,320,(g,w,h)=>{g.fillStyle='#fffaf0';g.beginPath();g.roundRect(4,4,w-8,h-8,18);g.fill();g.strokeStyle=SHOP_COLORS.wallTrim;g.lineWidth=6;g.stroke();
 g.fillStyle='#3a2a20';g.textAlign='center';g.font=`900 30px ${FONT}`;g.fillText('인형 희귀도',w/2,46);
 RARITY_ORDER.forEach((k,i)=>{const R=RARITY[k],y=88+i*58;g.fillStyle=R.color;g.beginPath();g.arc(52,y,20,0,Math.PI*2);g.fill();g.strokeStyle='#fffaf0';g.lineWidth=4;g.stroke();
  g.fillStyle='#fffaf0';g.font=`900 16px ${FONT}`;g.fillText('★'.repeat(R.stars).slice(0,2),52,y+6);
  g.textAlign='left';g.fillStyle='#3a2a20';g.font=`800 26px ${FONT}`;g.fillText(R.label,86,y+2);g.fillStyle='#8a7a66';g.font=`600 15px ${FONT}`;g.fillText(['작고 자주 나와요','조금 커요','크고 드물어요','가장 크고 귀해요'][i],86,y+22);g.textAlign='center';});});
const textTex=(lines,{bg='#5aa88e',fg='#fffaf0',edge=null,w=256,h=96,size=34}={})=>canvasTex(w,h,(g)=>{g.fillStyle=bg;g.beginPath();g.roundRect(3,3,w-6,h-6,16);g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=5;g.stroke();}g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
 lines.forEach((t,i)=>{g.font=`${i?700:900} ${i?size*.55:size}px ${FONT}`;g.fillText(t,w/2,h/2+(i-(lines.length-1)/2)*size*.95);});});

// ── 벽 하나(가로 len, 가운데 cx,cz, 회전 ry, 안쪽 법선 n). 문 구멍(hole: {x,w,h})이 있으면 세 조각으로.
function wallParts(len,hole=null,C=SHOP_COLORS){
 const S=SHOP,H=S.wallH,T=S.wallT,low=.9,out=[];
 const seg=(x0,x1,y0,y1)=>{const w=x1-x0,cx=(x0+x1)/2;if(w<=.01||y1-y0<=.01)return;
  const a=Math.min(y1,low);if(a>y0)out.push(B(w,a-y0,T,cx,(y0+a)/2,0,C.wallLow));
  const b=Math.max(y0,low);if(y1>b)out.push(B(w,y1-b,T,cx,(b+y1)/2,0,C.wall));
  if(y0<low&&y1>low)out.push(B(w,.06,T+.03,cx,low,0,C.wallTrim));
  if(y0<.01)out.push(B(w,.1,T+.04,cx,.05,0,C.wallTrim));
  // 윗벽 가로 줄눈(무인 뽑기방 벽판 느낌, 안쪽 면에만 얇게)
  if(C.slat)for(let y=low+.28;y<y1-.12;y+=.28)if(y>y0)out.push(B(w,.025,.012,cx,y,T/2+.006,C.slat));};
 if(!hole)seg(-len/2,len/2,0,H);
 else{seg(-len/2,hole.x-hole.w/2,0,H);seg(hole.x+hole.w/2,len/2,0,H);seg(hole.x-hole.w/2,hole.x+hole.w/2,hole.h,H);}
 out.push(B(len,.08,T+.06,0,H-.04,0,C.wallTrim)); // 위 테
 return out;
}

/** 그림자 전용 층(그림자 카메라만 켬) */
export const SHADOW_LAYER=2;
// ── 기계 위 상태 불·아슬아슬 별. set(i,{busy,tidy,near}): busy = 누가 뽑는 중(주황), tidy = 정리 중(주황 깜빡, 시작 못 함), near = 아슬아슬(빈 봉 기계만 별)
export const LAMP_COLORS=Object.freeze({free:'#4cd964',busy:'#ff9f1a',off:'#5a3a18',star:'#ff7fb0'});
function machineLamps(machines){
 const n=machines.length,group=new THREE.Group();group.name='기계 위 불';
 // 불: 둥근 머리 + 짙은 받침(꼭짓점 색 × 기계마다 색)
 const head=paint(new THREE.SphereGeometry(.045,14,8,0,Math.PI*2,0,Math.PI/2).translate(0,.03,0),'#ffffff'),foot=paint(new THREE.CylinderGeometry(.05,.055,.03,14).translate(0,.015,0),'#3a3346');
 const lampGeo=mergeGeometries([head,foot]);head.dispose();foot.dispose();
 const lamp=new THREE.InstancedMesh(lampGeo,new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),n);lamp.name='상태 불';
 // 별 ✦(네 꼭지, 앞뒤 두께 1cm)
 const sh=new THREE.Shape();for(let k=0;k<8;k++){const t=k/8*Math.PI*2+Math.PI/2,r=k%2?.026:.075;k?sh.lineTo(Math.cos(t)*r,Math.sin(t)*r):sh.moveTo(Math.cos(t)*r,Math.sin(t)*r);}
 const starGeo=new THREE.ExtrudeGeometry(sh,{depth:.012,bevelEnabled:false}).translate(0,.085,-.006);
 const star=new THREE.InstancedMesh(starGeo,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),n);star.name='아슬아슬 별';
 const base=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),pos=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),col=new THREE.Color(),box=new THREE.Box3();
 machines.forEach((M,i)=>{M.group.updateMatrixWorld(true);box.setFromObject(M.group);
  const local=new THREE.Vector3(.3,0,M.kind==='timer'?.12:.16).applyAxisAngle(up,M.heading);
  base.push({p:new THREE.Vector3(M.x+local.x,box.max.y+.002,M.z+local.z),s:new THREE.Vector3(M.x,0,M.z),h:M.heading});});
 const st=machines.map(()=>({busy:false,tidy:false,near:false}));let t=0;
 const place=(mesh,i,dx,scale)=>{const b=base[i],o=new THREE.Vector3(dx,0,0).applyAxisAngle(up,b.h);q.setFromAxisAngle(up,b.h);pos.copy(b.p).add(o);sc.setScalar(scale);m4.compose(pos,q,sc);mesh.setMatrixAt(i,m4);};
 const update=dt=>{t+=dt;const blink=Math.floor(t/.2)%2===0,tw=(t%2)/2;
  for(let i=0;i<n;i++){const s=st[i];place(lamp,i,0,1);
   lamp.setColorAt(i,col.set(s.tidy?(blink?LAMP_COLORS.busy:LAMP_COLORS.off):s.busy?LAMP_COLORS.busy:LAMP_COLORS.free));
   const on=s.near&&!s.busy&&!s.tidy,flash=tw<.18?Math.sin(tw/.18*Math.PI):0;
   place(star,i,-.13,on?1+.35*flash:0);star.setColorAt(i,col.set(LAMP_COLORS.star).multiplyScalar(.6+.4*flash));}
  lamp.instanceMatrix.needsUpdate=star.instanceMatrix.needsUpdate=true;lamp.instanceColor.needsUpdate=star.instanceColor.needsUpdate=true;};
 update(0);lamp.computeBoundingSphere();star.computeBoundingSphere();
 // 별은 처음에 모두 크기 0이라 경계 구가 작다 → 불과 같은 경계 구를 씀
 star.boundingSphere=lamp.boundingSphere.clone();star.boundingSphere.radius+=.3;
 group.add(lamp,star);
 return {group,lamp,star,update,set(i,o){if(st[i])Object.assign(st[i],o);},state:st};
}

// ── 가게 전체. guests/guestObject = 개발용 손님 인형(claw-guest.js), mobile = 휴대폰(더미 인형 수 줄임)
// 반환 root.userData: machines[{id,kind,group,x,z,heading,stand}]·walls·fadeWalls(camera)·colliders·spots·showcase.set(ids)·update(dt)
export function buildClawShop({toonify=null,mobile=false,guests=[],guestObject=null,pileSeed=7,kinds=false,look=DEFAULT_LOOK,T=null}={}){
 const A=ARCADE_LOOKS[arcadeLook(look)];
 // 무인 뽑기방 색: 바닥 흑백 체크·짙은 벽·진열장/코인/의자를 그림 방향 색으로(SHOP_COLORS의 나머지 = 금속·문·동전은 그대로)
 const C={...SHOP_COLORS,floorA:A.floorA,floorB:A.floorB,wall:A.wall,wallLow:A.wallLow,wallTrim:A.trim,slat:A.slat,shelf:A.cabinet[3],counter:A.island,counterTop:A.cabinet[3],
  bench:A.bench,metalDark:A.benchLeg,doorFrame:A.trim};
 const S=SHOP,root=new THREE.Group();root.name='인형뽑기 가게';
 const hw=S.w/2,hd=S.d/2,stat=new THREE.Group();stat.name='가게 정적';root.add(stat);
 // 바닥: 0.5m 체크 타일(크림 두 색) + 가장자리 띠
 {const p=[];const nx=Math.round(S.w/S.tile),nz=Math.round(S.d/S.tile);
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const g=new THREE.PlaneGeometry(S.tile,S.tile).rotateX(-Math.PI/2).translate(-hw+S.tile*(i+.5),0,-hd+S.tile*(j+.5));p.push(paint(g,(i+j)%2?C.floorA:C.floorB));}
  const f=vmesh(p,'가게 바닥',{shadow:false});f.material.roughness=.32;f.material.metalness=.05;stat.add(f);}
 // 기계 앞 발판(손님이 서는 자리 표시, 기계 색)
 {const p=[];MACHINES.forEach((M,i)=>{const m=MACHINE_SPOTS[i],[x,z]=machineToShop(m,0,CLAW.stand.z-.05);p.push(paint(new RoundedBoxGeometry(.9,.012,.6,2,.005).rotateY(m.heading).translate(x,.006,z),M.body));});stat.add(vmesh(p,'발판',{shadow:false}));}
 // 벽 넷: 뒤(−Z)·앞(+Z, 문)·왼쪽(−X)·오른쪽(+X). 각각 따로 둔다.
 // 벽에 붙은 것(간판·전구·안내판·문)은 그 벽 묶음에 넣어 벽과 같이 숨는다.
 const walls=[],side={};
 const addWall=(key,name,len,pos,ry,inward,hole)=>{const grp=new THREE.Group();grp.name=name;stat.add(grp);const m=vmesh(wallParts(len,hole,C),name);m.position.copy(pos);m.rotation.y=ry;grp.add(m);walls.push({mesh:grp,point:pos.clone(),inward,key});side[key]=grp;return grp;};
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
  const exit=board(textTex(['허브로 나가기'],{bg:'#2a213c',edge:A.neon.sky,size:30,h:72}),.9,.25,{glow:.6});exit.position.set(d.x,d.height+.32,z-.12);exit.rotation.y=Math.PI;exit.name='허브로 표시';side.front.add(exit);}
 // 뒷벽 네온 간판 「인형뽑기 / 24시 무인」(글자는 우리 것). 하트·구름·달·도시 네온과 벽 띠는 claw-arcade-art.js
 {const neon=board(neonTex(A.sign.text,A.sign.sub,A.neon),2.6,.82,{glow:2.0});neon.position.set(0,2.08,-hd+.02);neon.name='네온 간판';if(neon.material)neon.material.toneMapped=false;side.back.add(neon);}
 // 도감 진열장(왼쪽 벽): 3단 선반, 모은 인형은 색, 못 모은 인형은 회색 실루엣(도감 「?」와 같은 뜻)
 const sc=S.showcase,shelfY=[.55,1.05,1.55],sg=sc.side??-1,inn=-sg; // sg = 붙은 벽(−1 왼벽, +1 오른벽), inn = 가게 안쪽 방향
 {const p=[],wx=sg*hw;
  // 얇은 뒤판(벽에 붙음) + 옆판 둘 + 선반 3단 + 아래 받침장. 인형은 선반 위 가운데(x = wx + 안쪽 0.25)
  p.push(RB(.06,1.9,sc.len+.1,.02,wx+inn*.03,.95,sc.z,C.shelf));
  for(const s of [-1,1])p.push(RB(.44,1.9,.06,.02,wx+inn*.22,.95,sc.z+s*(sc.len/2+.02),C.shelf));
  for(const y of shelfY)p.push(B(.42,.04,sc.len,wx+inn*.25,y,sc.z,C.counterTop));
  p.push(B(.44,.3,sc.len+.1,wx+inn*.22,.15,sc.z,C.counter),B(.44,.04,sc.len+.1,wx+inn*.22,1.92,sc.z,C.shelf));
  stat.add(vmesh(p,'도감 진열장'));
  const t=board(textTex(['우리 인형 도감','모은 인형이 여기 놓여요'],{bg:'#2a213c',edge:A.neon.pink,size:30}),1.0,.38,{glow:.6});t.position.set(wx+inn*.02,2.15,sc.z);t.rotation.y=inn*Math.PI/2;t.name='도감 진열장 표시';side[sg>0?'right':'left'].add(t);}
 // 오늘의 코인 받는 곳(오른쪽 벽): 동전 그림 상자 + 받는 접시(사는 단추 없음 — 설계 ⑨)
 {const k=S.kiosk,p=[];p.push(RB(.55,1.25,.5,.06,k.x,.625,k.z,A.cabinet[0]),RB(.5,.06,.36,.02,k.x-.06,.62,k.z,C.counterTop),B(.36,.12,.3,k.x-.12,.32,k.z,C.chute));
  p.push(paint(new THREE.CylinderGeometry(.16,.16,.04,24).rotateZ(Math.PI/2).translate(k.x-.29,.98,k.z),C.coin),paint(new THREE.CylinderGeometry(.11,.11,.05,20).rotateZ(Math.PI/2).translate(k.x-.3,.98,k.z),C.coinDark));
  stat.add(vmesh(p,'오늘의 코인'));
  const t=board(textTex(['오늘의 코인','매일 무료로 받아요'],{bg:'#2a213c',fg:'#ffe27a',edge:A.neon.yellow,size:30}),.62,.24,{glow:.6});t.position.set(k.x-.28,1.38,k.z);t.rotation.y=-Math.PI/2;t.name='오늘의 코인 표시';stat.add(t);}
 // 빈 자리 A·B(v4 §2): 「준비 중」 덮개(못 노는 기계처럼 보이지 않게 천 덮개 + 표지)
 {const p=[];for(const m of S.empty??[]){const [x,z]=[m.x,m.z];p.push(RB(.95,1.5,.85,.08,x,.75,z,A.cabinet[2]),RB(.99,.06,.89,.03,x,1.52,z,A.trim));}
  if(p.length){stat.add(vmesh(p,'빈 자리 덮개'));for(const m of S.empty){const t=board(textTex(['준비 중','새 기계가 들어올 자리'],{bg:'#2a213c',edge:A.neon.violet,size:30}),.7,.27,{glow:.5});const [x,z]=machineToShop(m,0,.43);t.position.set(x,1.1,z);t.rotation.y=m.heading;t.name='준비 중 표시';stat.add(t);}}}
 // 의자(오른쪽 벽) + 희귀도 안내판
 {const b=S.bench,p=[];p.push(RB(.4,.08,b.len,.03,b.x,.36,b.z,C.bench),RB(.08,.4,b.len,.03,b.x+.18,.6,b.z,C.bench));for(const s of [-1,1])p.push(B(.32,.32,.06,b.x,.16,b.z+s*(b.len/2-.1),C.metalDark));
  stat.add(vmesh(p,'의자'));
  const r=board(rarityTex(),.62,.78,{glow:.35});r.position.set(S.w/2-.02,1.45,b.z+.1);r.rotation.y=-Math.PI/2;r.name='희귀도 안내판';side.right.add(r);}
 // (예전 화분 넷·가운데 받침은 무인 뽑기방에서 없앰: 구석은 장식 기계·낮은 의자, 가운데는 유리 진열탑 섬)
 toonify?.(stat,{kind:'prop',keepMaps:true});
 // 큰 동동이 인형(가운데 유리 진열탑 안, 실제 크기 약 1.0m)
 {const big=makePlush('dongdong',{toonify});big.scale.setScalar(1.0/plushSize('dongdong'));big.position.set(S.statue.x,.36,S.statue.z);big.rotation.y=.25;big.name='큰 동동이 인형';root.add(big);}
 // 기계 세 대 + 인형 더미
 // kinds=true면 기계 종류대로(도시 = 타이머, 별빛 = 열쇠, claw-machines-more.js). 기본은 세 대 모두 집게(월드개발이 타이머·열쇠 규칙을 붙일 때 켠다).
 const machines=MACHINES.map((M,i)=>{const kind=kinds?M.kind??'claw':'claw';
  const g=kind==='claw'?buildClawMachine(M.id,{toonify}):kind==='bridge'?buildBridgeMachine(M.id,{toonify,...(T?{T}:{})}):kind==='stack'?dressStackMachine(buildStackMachine(M,{toonify}),{toonify}):buildMachine(M.id,{toonify,guestObject,...(kind==='timer'?{prize:resolvePool(M.pool,guests)[0]}:{cells:resolvePool(M.cells??M.pool,guests)})});
  const m=MACHINE_SPOTS[i],{x,z,heading}=m;g.position.set(x,0,z);g.rotation.y=heading;root.add(g);
  if(kind==='claw'&&!kinds)fillPile(g,resolvePool(M.pool,guests).map(baseOfPlush),{count:mobile?9:14,seed:pileSeed+i*101,toonify,guestObject}); // 게임(kinds)은 물리 더미를 claw-play.js가 그림
  const [sx,sz]=machineToShop(m,0,CLAW.stand.z);
  attachLod(g,{toonify}); // 먼 기계 가벼운 그림(main.js applyLod가 setLod)
  return {id:M.id,kind,name:M.name,group:g,x,z,heading,stand:new THREE.Vector3(sx,0,sz)};});
 // 기계 그림자 = 그림자 전용 상자 한 메시(층 SHADOW_LAYER: 화면 카메라는 안 그리고 그림자 카메라만 그림. main.js가 그림자 카메라에 이 층을 켬)
 //  기계 부품은 그림자를 드리우지 않는다(16대 부품 그림자가 휴대폰 약 6만·PC 약 21만 삼각형이었음). 아래 몸통·조작대(+ 타이머 경품 받침)만 — 유리 상자 안은 밝게 그대로
 {const p=[],hd=CLAW.depth/2,pd=CLAW.panel.depth;for(const M of machines){M.group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
   const parts=[new THREE.BoxGeometry(CLAW.width,CLAW.floorY,CLAW.depth).translate(0,CLAW.floorY/2,0),new THREE.BoxGeometry(CLAW.width,CLAW.panel.top,pd).translate(0,CLAW.panel.top/2,hd+pd/2)];
   if(M.kind==='timer')parts.push(new THREE.BoxGeometry(TIMER.tray.w,TIMER.tray.top,TIMER.tray.z1-TIMER.tray.z0).translate(TIMER.tray.x,TIMER.tray.top/2,(TIMER.tray.z0+TIMER.tray.z1)/2));
   for(const g of parts){g.deleteAttribute('uv');p.push(g.rotateY(M.heading).translate(M.x,0,M.z));}}
  const proxy=new THREE.Mesh(mergeGeometries(p,false),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));p.forEach(g=>g.dispose());
  proxy.name='기계 그림자 상자';proxy.castShadow=true;proxy.receiveShadow=false;proxy.layers.set(SHADOW_LAYER);root.add(proxy);}
 // 서는 자리 바닥 번호판(v4 §3-4: 간판과 같은 번호, 기계를 보고 서면 바로 읽힘). 16장 한 메시 = 그리기 1번, 간판 아틀라스 아래 줄
 {const A=signAtlas();if(A){const p=[];MACHINES.forEach((M,i)=>{const m=MACHINE_SPOTS[i],[x,z]=machineToShop(m,.3,CLAW.stand.z-.22);
   const g=atlasPlane(.2,.2,A.badgeUv(i)).rotateX(-Math.PI/2).rotateY(m.heading).translate(x,.0135,z);g.deleteAttribute('normal');g.computeVertexNormals();p.push(g);});
  const badges=new THREE.Mesh(mergeGeometries(p,false),A.badgeMat);p.forEach(g=>g.dispose());badges.name='바닥 번호판';badges.receiveShadow=true;root.add(badges);}}
 // 기계 위 상태 불(v4 §4-1: 빔 초록·뽑는 중 주황·정리 중 주황 깜빡) + 아슬아슬 별 ✦(v4.1 §5-1: 초록 점 옆, 2초에 한 번 반짝, 먼 기계에서도 보임)
 // 16대 불 = InstancedMesh 1개, 별 = 1개(그리기 2번). 빛나는 판이라 조명을 안 받는 재질
 const lamps=machineLamps(machines);root.add(lamps.group);
 // 무인 뽑기방 꾸밈(장식 기계·섬·의자·미러볼·네온). 벽에 딸린 것은 그 벽 묶음에 넣어 벽과 같이 숨긴다
 const decor=buildArcadeDecor({S,hw,hd,machines,look,mobile,toonify});root.add(decor.group);
 for(const [k,g] of Object.entries(decor.wallParts))side[k].add(g);
 // 진열장 인형(모은 것 색, 못 모은 것 회색 실루엣). 인형 형상은 기계와 같은 것을 공유.
 const shelf=new THREE.Group();shelf.name='진열장 인형';root.add(shelf);
 const silMat=new THREE.MeshStandardMaterial({color:'#a59a8a',roughness:1,name:'claw-silhouette'});const sil=toonify?(()=>{const m=new THREE.Mesh(new THREE.BufferGeometry(),silMat);toonify(m,{kind:'prop'});return m.material;})():silMat;
 const shelfIds=PLUSH.map(p=>p.id),slots=[];
 // 선반 3단에 위에서부터 한 단 6칸씩(11-25 작은 인형 16종 → 6·6·4칸, 칸 사이 약 0.45m. 한 단 칸 수가 모자라면 가운데로 모음)
 {const per=Math.ceil(shelfIds.length/shelfY.length),step=(sc.len-.3)/per;
  shelfIds.forEach((id,i)=>{const row=Math.floor(i/per),n=Math.min(per,shelfIds.length-row*per),col=i-row*per,y=shelfY[shelfY.length-1-row]+.02,z=sc.z+(col-(n-1)/2)*step;slots.push({id,pos:new THREE.Vector3(sc.x,y,z)});});}
 const shownObjs=new Map();
 // 휴대폰: 벽 진열장 인형은 가벼운 형상(삼각형 약 40%, 늘 몇 m 떨어져 봄)
 const lowPlush=id=>{const geo=plushGeometry(id,{low:true}),s=plushSize(id),g=new THREE.Group();g.name=`인형:${id}`;
  const m=new THREE.Mesh(geo.color,plushMaterial());m.scale.setScalar(s);m.castShadow=true;m.receiveShadow=true;g.add(m);toonify?.(g,{kind:'character'});
  const l=new THREE.Mesh(geo.line,plushLineMaterial(plushLineWidth(id)));l.userData.outline=true;l.name='outline';l.scale.setScalar(s);g.add(l);g.userData.plushId=id;return g;};
 const showcase={slots,set(ids){const have=new Set(ids);for(const o of shownObjs.values())shelf.remove(o);shownObjs.clear();
  for(const s of slots){let o;if(have.has(s.id))o=mobile?lowPlush(s.id):makePlush(s.id,{toonify});else{o=new THREE.Mesh(plushGeometry(s.id,{low:mobile}).color,sil);o.scale.setScalar(plushSize(s.id));o.castShadow=true;}
   o.position.copy(s.pos);o.rotation.y=-sg*Math.PI/2;shelf.add(o); // 가게 안쪽을 봄(11-25: 진열장이 오른벽으로 옮겨진 뒤 벽을 보던 것 고침)
   shownObjs.set(s.id,o);}}};
 showcase.set([]);
 // 부딪힘(가게 좌표 네모 x0,z0,x1,z1 / 동그라미 x,z,r). 벽은 walk 네모로.
 const pd=CLAW.depth/2+CLAW.panel.depth;
 const colliders=[...machines.map(m=>({...rectToShop(m,-CLAW.width/2-.03,-CLAW.depth/2,CLAW.width/2+.03,m.kind==='timer'?Math.max(pd,TIMER.tray.z1):pd),id:m.id})), // 타이머는 경품 받침이 조작대보다 10cm 앞으로 나옴
  ...(S.empty??[]).map((m,i)=>({...rectToShop(m,-.5,-.45,.5,.45),id:`empty-${i}`})),
  {x0:sg>0?hw-.47:-hw,z0:sc.z-sc.len/2-.06,x1:sg>0?hw:-hw+.47,z1:sc.z+sc.len/2+.06,id:'showcase'},{x0:S.kiosk.x-.33,z0:S.kiosk.z-.28,x1:hw,z1:S.kiosk.z+.28,id:'kiosk'},
  {x0:S.bench.x-.22,z0:S.bench.z-S.bench.len/2,x1:hw,z1:S.bench.z+S.bench.len/2,id:'bench'},
  ...decor.colliders,{x:S.statue.x,z:S.statue.z,r:S.statue.r+.05,id:'statue'}];
 // 카메라가 벽 바깥(벽면에서 0.05m 이상)으로 나가면 그 벽만 숨긴다. 가게를 다른 곳에 놓았으면 root 기준으로 바꿔서 본다.
 const _p=new THREE.Vector3();
 const fadeWalls=camera=>{_p.copy(camera.position);root.worldToLocal(_p);for(const w of walls){const d=_p.clone().sub(w.point).dot(w.inward);w.mesh.visible=d>-.05;}decor.hideCeiling(_p.y);};
 const update=dt=>{for(const m of machines)m.group.userData.update(dt);lamps.update(dt);};
 root.userData={machines,walls,fadeWalls,colliders,showcase,update,lamps,look:decor.look,light:decor.light,
  spots:{spawn:new THREE.Vector3(S.spawn.x,0,S.spawn.z),door:new THREE.Vector3(S.door.x,0,S.d/2-.5),kiosk:new THREE.Vector3(S.kiosk.x-.75,0,S.kiosk.z),bench:new THREE.Vector3(S.bench.x-.05,.44,S.bench.z),showcase:new THREE.Vector3(sg*(hw-1.2),0,sc.z),statue:new THREE.Vector3(S.statue.x,0,S.statue.z+S.statue.r+.5)}};
 return root;
}
