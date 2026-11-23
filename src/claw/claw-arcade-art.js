// 무인 인형뽑기방 꾸밈(월드아트, 2026-11-23, 대표 피드백: 밝은 오락실 → 한국 무인 인형뽑기방 분위기).
// 참고 사진에서 가져온 특징만 우리 카툰 화풍으로 다시 그린다(사진·상표·글자 복제 없음, 네온 문구는 우리 것):
//  어두운 천장 + 네온 격자·육각 테 + 미러볼 / 분홍·하늘·보라 네온 / 흑백 체크 바닥 / 벽을 따라 선 기계 + 가운데 섬 / 하트·구름·달·도시 네온 / 낮은 동그란 의자 / 유리 상자 가득한 인형.
// 비용: 네온은 빛을 내는 단색 재질(MeshBasicMaterial 꼭짓점 색)이라 실시간 조명을 늘리지 않는다. 그림 파일 없음(바닥 번짐 64px 캔버스 한 장).
// 정적 부분은 재질별로 합친다: 장식 기계 몸·의자·미러볼(카툰 재질 1) + 유리(1) + 네온(벽마다 1 + 천장 1 + 기계 테 1) + 바닥 번짐(1).
// 놀 수 있는 기계 세 대·진열장·코인 받는 곳·의자 기능은 claw-shop-art.js 그대로. 여기는 그림과 부딪힘 상자만 더한다.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {PLUSH_COLORS_FOR_PILE} from './claw-palette.js';

// 그림 방향 두 가지: neon(기본 추천안) = 짙은 보라 벽·분홍 네온 / pastel(대안) = 밝은 회보라 벽·흰 기계·하늘 네온 많이
export const ARCADE_LOOKS=Object.freeze({
 neon:Object.freeze({label:'핑크 네온 뽑기방',
  // 11-23 3차(대표: "핑크 네온 느낌이 없다"): 벽·빛·배경을 분홍 보라로, 네온을 굵고 밝게(번짐), 바닥 분홍 번짐 크게
  floorA:'#fbeef8',floorB:'#2a1430',wall:'#5a2266',wallLow:'#3e1648',slat:'#74308a',trim:'#7a2f8e',
  neon:{pink:'#ff4fb8',sky:'#5fe0ff',violet:'#c27dff',yellow:'#ffe066',white:'#fff4fb'},
  cabinet:['#ffc2e2','#c8ecff','#e6c9ff','#fff0fa'],cabinetDark:'#2e1636',glass:'#ffd9f2',
  stool:['#ff7fc4','#7fdcff','#c99bff'],chrome:'#e3cfe6',bench:'#ff7fc4',benchLeg:'#5a2a6e',island:'#3a1745',
  light:{hemi:{sky:'#ffc2ea',ground:'#8a3c96',intensity:1.4},key:{color:'#ffd9f2',intensity:1.7,pos:[3,9,5],shadow:{size:7,map:1024}},background:'#2a0c30',exposure:1.05},
  gain:2.2,tube:1.7,glow:1,grid:.9,
  sign:{text:'인형뽑기',sub:'24시 무인'}}),
 pastel:Object.freeze({label:'파스텔 화이트 뽑기방',
  floorA:'#f7f5fa',floorB:'#2e2a36',wall:'#d9d2e6',wallLow:'#bfb5d3',slat:'#cbc2dc',trim:'#a99cc4',
  neon:{pink:'#ff7cc0',sky:'#6fdcff',violet:'#a98bff',yellow:'#ffe680',white:'#ffffff'},
  cabinet:['#f8f5fb','#f6e3ee','#e3eef8','#efe8f8'],cabinetDark:'#3a3448',glass:'#eef4ff',
  stool:['#ffb0d4','#9fe0ff','#d6c0ff'],chrome:'#d6d2de',bench:'#9fe0ff',benchLeg:'#8a80a0',island:'#ece6f4',
  light:{hemi:{sky:'#ffffff',ground:'#b7aacb',intensity:1.3},key:{color:'#fff6fb',intensity:2.0,pos:[3,9,5],shadow:{size:7,map:1024}},background:'#4a3f5c',exposure:1},
  gain:1.4,tube:1.2,glow:.6,grid:1.5,
  sign:{text:'인형뽑기',sub:'24시 무인'}}),
});
export const DEFAULT_LOOK='neon';
export const arcadeLook=k=>ARCADE_LOOKS[k]?k:DEFAULT_LOOK;

const _c=new THREE.Color();
function paint(g,hex){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
 _c.set(hex);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_c.r,_c.g,_c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
const B=(w,h,d,x,y,z,hex)=>paint(new THREE.BoxGeometry(w,h,d).translate(x,y,z),hex);
const RB=(w,h,d,r,x,y,z,hex)=>paint(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001)).translate(x,y,z),hex);
const CY=(r0,r1,h,x,y,z,hex,seg=16)=>paint(new THREE.CylinderGeometry(r0,r1,h,seg).translate(x,y,z),hex);
const SP=(r,x,y,z,hex,seg=10)=>paint(new THREE.SphereGeometry(r,seg,Math.max(6,seg*.6|0)).translate(x,y,z),hex);
const merge=parts=>{const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();return g;};
function litMesh(parts,name,{rough=.8}={}){const m=new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:rough,name}));m.name=name;m.castShadow=true;m.receiveShadow=true;return m;}
// 네온 = 빛 계산 없는 단색(카툰 변환 전에 만들고, 변환을 거치지 않게 toonify 뒤에 붙인다)
function neonMesh(parts,name,gain=1){const m=new THREE.Mesh(merge(parts),new THREE.MeshBasicMaterial({vertexColors:true,name:'neon',toneMapped:false}));m.material.color.setScalar(gain);/* 1보다 밝게 = 화면 번짐(bloom)이 잡음 */m.name=name;m.castShadow=false;m.receiveShadow=false;m.userData.neon=true;return m;}
// 굵기 r 네온 관(점 목록을 잇는다). closed면 고리. 가운데 흰 심 + 색 테두리 두 겹으로 네온처럼(심은 살짝 작게)
let TUBE=1;
function neonTube(pts,r,hex,{closed=false,core=true,seg=null}={}){r*=TUBE;const curve=new THREE.CatmullRomCurve3(pts,closed,'catmullrom',.2),n=seg??Math.max(8,Math.round(curve.getLength()/.03));
 const out=[paint(new THREE.TubeGeometry(curve,n,r,6,closed),hex)];
 if(core){const c=_c.set(hex).clone().lerp(new THREE.Color('#ffffff'),.55);out.push(paint(new THREE.TubeGeometry(curve,n,r*.55,5,closed).translate(0,0,0),'#'+c.getHexString()));}
 return out;}
const straight=(a,b,r,hex)=>neonTube([a,b],r,hex,{seg:1,core:false});
// 꺾인 닫힌 테(네모·팔각·육각): 곧은 관 + 모서리 공
const loop=(pts,r,hex)=>{const out=[];pts.forEach((p,i)=>{out.push(...straight(p,pts[(i+1)%pts.length],r,hex),paint(new THREE.SphereGeometry(r*TUBE,6,4).translate(p.x,p.y,p.z),hex));});return out;};

// ── 네온 모양(벽 평면 좌표: u = 벽을 따라, v = 위. place(u,v)가 3D 점으로 바꾼다)
function heartPts(cx,cy,s){const p=[];for(let i=0;i<40;i++){const t=i/40*Math.PI*2;p.push([cx+s*16*Math.sin(t)**3/17,cy+s*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17]);}return p;}
function cloudPts(cx,cy,s){const p=[],bumps=[[-.55,.0,.32],[-.22,.22,.36],[.2,.24,.33],[.52,.02,.3]];
 // 위쪽 혹 넷(왼→오) + 평평한 아래
 for(const [bx,by,br] of bumps)for(let i=0;i<=8;i++){const a=Math.PI*(1-i/8)+(bx<-.4?.6:bx>.4?-.6:0)*(i<4?1:0);p.push([cx+s*(bx+Math.cos(a)*br),cy+s*(by+Math.sin(a)*br)]);}
 p.push([cx+s*.75,cy-s*.18],[cx-s*.8,cy-s*.18]);return p;}
function moonPts(cx,cy,s){const p=[];for(let i=0;i<=24;i++){const a=Math.PI*.15+i/24*Math.PI*1.7;p.push([cx+s*Math.cos(a),cy+s*Math.sin(a)]);}
 for(let i=0;i<=16;i++){const a=Math.PI*1.75-i/16*Math.PI*1.5;p.push([cx+s*.45+s*.72*Math.cos(a),cy+s*.72*Math.sin(a)]);}return p;}
function cityPts(x0,y0,w){const tops=[[0,.3],[.08,.3],[.08,.62],[.18,.62],[.18,.45],[.26,.45],[.26,.9],[.3,.9],[.3,1.02],[.33,1.02],[.33,.9],[.38,.9],[.38,.5],[.48,.5],[.48,.74],[.58,.74],[.58,.38],[.66,.38],[.66,.82],[.72,.82],[.72,.56],[.84,.56],[.84,.66],[.92,.66],[.92,.34],[1,.34]];
 return tops.map(([u,v])=>[x0+u*w,y0+v*w*.5]);}
function starPts(cx,cy,s){const p=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?s*.42:s;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return p;}

// 벽 평면 → 3D. wall = {o: 벽면 위 원점(안쪽 면), u: 벽을 따라 방향, n: 안쪽 법선}
const onWall=(w,lift=.03)=>([u,v])=>w.o.clone().addScaledVector(w.u,u).add(new THREE.Vector3(0,v,0)).addScaledVector(w.n,lift);
function sign(parts,w,pts2,hex,{r=.016,closed=true}={}){parts.push(...neonTube(pts2.map(onWall(w)),r,hex,{closed}));}
// 직선만으로 된 모양(도시 윤곽)은 꺾인 선분으로
function polyline(parts,w,pts2,hex,r=.014){const P=pts2.map(onWall(w));for(let i=0;i+1<P.length;i++)parts.push(...straight(P[i],P[i+1],r,hex));for(const p of P)parts.push(paint(new THREE.SphereGeometry(r*TUBE,6,4).translate(p.x,p.y,p.z),hex));}

// 바닥 번짐(반짝이는 바닥에 비친 네온 느낌): 64px 둥근 번짐 캔버스 한 장 + 꼭짓점 색으로 물들인 판 여러 장
function glowTex(){if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(.45,'rgba(255,255,255,.3)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

// ── 장식 기계(놀 수 없음): 아래 몸 + 유리 상자 + 인형 더미 + 위 간판 + 네온 테. heading 0 = +Z를 봄
// 반환 {lit:[], glass:[], neon:[]} 조각들을 넣는다.
function decorCabinet(P,{x,z,ry=0,w=.86,d=.8,body,neon,seed=1},A){
 const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry),T=(g)=>{g.applyQuaternion(q);g.translate(x,0,z);return g;};
 const H=1.62,base=.52,top=1.34,hw=w/2,hd=d/2;
 // 몸: 아래 상자·위 간판·네 기둥
 P.lit.push(T(RB(w,base,d,.03,0,base/2,0,body)),T(RB(w+.02,H-top,d+.02,.03,0,(top+H)/2,0,body)));
 for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])P.lit.push(T(B(.04,top-base,.04,sx*(hw-.02),(base+top)/2,sz*(hd-.02),body)));
 // 앞: 조작대(손잡이·단추)·꺼내는 문(짙은 칸)·코인 화면
 P.lit.push(T(RB(w*.9,.06,.14,.02,0,base-.01,hd+.05,body)),T(B(.03,.08,.03,-.14,base+.06,hd+.06,A.chrome)),T(SP(.028,-.14,base+.11,hd+.06,neon,8)),T(SP(.032,.14,base+.04,hd+.07,A.neon.yellow,8)));
 P.lit.push(T(B(.3,.2,.01,-.18,.22,hd+.005,A.cabinetDark)),T(B(.16,.1,.01,.2,.34,hd+.005,A.cabinetDark)));
 // 인형 더미: 우리 인형 색의 둥근 덩어리(가까이 보면 귀·눈이 있는 것도 몇)
 let s=seed*9301+49297;const rnd=()=>(s=(s*9301+49297)%233280)/233280;
 const cols=PLUSH_COLORS_FOR_PILE;
 for(let i=0;i<22;i++){const px=(rnd()-.5)*(w-.16),pz=(rnd()-.5)*(d-.16),layer=Math.floor(i/9),r=.07+rnd()*.03,py=base+.02+r+layer*.09+rnd()*.03;
  const c=cols[Math.floor(rnd()*cols.length)];P.lit.push(T(SP(r,px,py,pz,c.body,10)));
  if(rnd()<.6)for(const sx of [-1,1])P.lit.push(T(SP(r*.35,px+sx*r*.6,py+r*.8,pz,c.ear??c.body,6)));
  if(pz>0&&rnd()<.7)for(const sx of [-1,1])P.lit.push(T(SP(r*.12,px+sx*r*.35,py+r*.1,pz+r*.93,'#2a2321',5)));}
 // 집게(위에서 매달린 작은 금속)
 P.lit.push(T(B(.012,.18,.012,.05,top-.09,0,A.chrome)),T(SP(.035,.05,top-.19,0,A.chrome,8)));
 // 유리 네 면
 P.glass.push(T(new THREE.BoxGeometry(w-.05,top-base,d-.05).translate(0,(base+top)/2,0)));
 // 네온: 유리 상자 앞 테두리(네모) + 간판 앞 줄
 const V=(u,vv,w2)=>new THREE.Vector3(u,vv,w2).applyQuaternion(q).add(new THREE.Vector3(x,0,z)),f=hd+.012,fy0=base+.005,fy1=top-.005,sy=(top+H)/2;
 P.neon.push(...loop([V(-hw,fy0,f),V(hw,fy0,f),V(hw,fy1,f),V(-hw,fy1,f)],.012,neon));
 P.neon.push(...neonTube([V(-hw*.8,sy,hd+.02),V(hw*.8,sy,hd+.02)],.02,A.neon.white,{seg:2}));
}

// 낮은 동그란 의자
function stool(P,x,z,hex,A){P.lit.push(CY(.17,.16,.07,x,.33,z,hex,18),CY(.035,.035,.28,x,.15,z,A.chrome,8),CY(.13,.15,.025,x,.012,z,A.chrome,16));}

// 미러볼(깎은 면 공 + 매단 줄)
function discoBall(P,x,y,z,r,A){const g=new THREE.IcosahedronGeometry(r,2).toNonIndexed(),n=g.attributes.position.count,a=new Float32Array(n*3);
 const tones=['#f4f2fa','#bcb6cc','#e2ddf0','#8f88a6'].map(h=>new THREE.Color(h));for(let f=0;f<n/3;f++){const t=tones[(f*7+(f>>2))%4];for(let k=0;k<3;k++)a.set([t.r,t.g,t.b],(f*3+k)*3);}
 g.deleteAttribute('uv');g.setAttribute('color',new THREE.BufferAttribute(a,3));g.translate(x,y,z);P.lit.push(g,CY(.006,.006,2.62-y-r,x,(2.62+y+r)/2,z,A.chrome,5));}

// ── 꾸밈 전체. S = SHOP, hw/hd = 가게 반 폭·반 깊이, side = 벽 묶음(벽과 같이 숨김), machines = 놀 수 있는 기계 세 대
// 반환: {group(늘 보임), wallParts:{back,front,left,right}(벽 묶음에 넣을 것), ceiling, colliders, island, light, colors, hideCeiling(카메라 높이)}
export function buildArcadeDecor({S,hw,hd,machines,look=DEFAULT_LOOK,mobile=false,toonify=null}){
 const A=ARCADE_LOOKS[arcadeLook(look)],N=A.neon,grp=new THREE.Group();grp.name='뽑기방 꾸밈';TUBE=A.tube??1;
 // 조각 바구니: free = 늘 보임, back·front·left = 그 벽과 같이 숨는 장식 기계(카메라가 벽 밖에서 볼 때 가리지 않게)
 const bucket=()=>({lit:[],glass:[],neon:[]}),Pk={free:bucket(),back:bucket(),front:bucket(),left:bucket(),right:bucket()},P=Pk.free,colliders=[];
 // 장식 기계 자리(놀 수 있는 세 대 옆·앞벽 양쪽·왼벽 앞쪽). 뒷벽 붙은 것은 놀 수 있는 기계와 같은 z
 const bz=-hd+.12+.4,fz=hd-.12-.4;
 const cab=S.decorCabinets===false?[]:[
  {x:-3.5,z:bz,ry:0,body:A.cabinet[0],neon:N.pink,wall:'back'},{x:3.5,z:bz,ry:0,body:A.cabinet[1],neon:N.sky,wall:'back'},
  {x:-1.45,z:fz,ry:Math.PI,body:A.cabinet[2],neon:N.violet,wall:'front'},{x:-2.4,z:fz,ry:Math.PI,body:A.cabinet[0],neon:N.pink,wall:'front'},
  {x:1.45,z:fz,ry:Math.PI,body:A.cabinet[1],neon:N.sky,wall:'front'},{x:2.4,z:fz,ry:Math.PI,body:A.cabinet[3],neon:N.violet,wall:'front'},
  {x:-hw+.12+.4,z:2.25,ry:Math.PI/2,body:A.cabinet[3],neon:N.sky,wall:'left'},
 ];
 // 기계 좌표 → 가게 좌표(기계 방향 heading, 11-23 기계 16대: 왼벽 봉·섬 뒤 열쇠는 돌아 있음)
 const rot=(m,x,z)=>{const h=m.heading??0,c=Math.cos(h),s=Math.sin(h);return [m.x+x*c+z*s,m.z-x*s+z*c];};
 cab.forEach((c,i)=>{decorCabinet(Pk[c.wall],{...c,seed:i+3},A);const rot=Math.abs(Math.sin(c.ry))>.5,ex=(rot?.8:.86)/2+.03,ez=(rot?.86:.8)/2+.03+(rot?0:.08);
  colliders.push({x0:c.x-(rot?ez:ex),z0:c.z-(rot?ex:ez),x1:c.x+(rot?ez:ex),z1:c.z+(rot?ex:ez),id:`decor-${i}`});});
 // 놀 수 있는 기계 테두리 네온(기계 그림은 그대로, 앞 모서리를 감싸는 네온 띠 + 위 간판 밑줄)
 const machineNeon=[N.sky,N.pink,N.violet];
 machines.forEach((m,i)=>{m.group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(m.group),W=.95/2+.015,D=.85/2+.015,top=Math.min(b.max.y,2.2)+.01,c=machineNeon[i%3];
  const p=(x,y,z)=>{const [wx,wz]=rot(m,x,z);return new THREE.Vector3(wx,y,wz);};
  // 조작 화면에서 기계 양옆에 크게 보이므로 다른 네온보다 가늘게
  for(const sx of [-1,1])P.neon.push(...straight(p(sx*W,.5,D),p(sx*W,top,D),.008,c));
  P.neon.push(...straight(p(-W,top,D),p(W,top,D),.008,c),...straight(p(-W,top,-D),p(-W,top,D),.008,c),...straight(p(W,top,-D),p(W,top,D),.008,c));
  P.neon.push(...straight(p(-W,.02,D+.22),p(W,.02,D+.22),.012,c));});
 // 가운데 섬: 팔각 받침 + 유리 진열탑(큰 동동이 인형은 claw-shop-art가 그 위에 둠) + 둘레 인형 더미 + 위아래 네온 고리
 const st=S.statue,isl={r:st.r,base:.36,glassTop:1.75};
 P.lit.push(CY(st.r,st.r+.04,.32,st.x,.16,st.z,A.island,8),CY(st.r-.03,st.r-.03,.04,st.x,.34,st.z,A.cabinet[3],8),CY(st.r-.08,st.r-.08,.06,st.x,isl.glassTop+.03,st.z,A.island,8));
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;P.lit.push(B(.035,isl.glassTop-isl.base,.035,st.x+Math.cos(a)*(st.r-.1),(isl.base+isl.glassTop)/2,st.z+Math.sin(a)*(st.r-.1),A.chrome));}
 {let s=11;const rnd=()=>(s=(s*9301+49297)%233280)/233280;for(let i=0;i<26;i++){const a=rnd()*Math.PI*2,rr=.32+rnd()*.3,r=.06+rnd()*.03,c=PLUSH_COLORS_FOR_PILE[Math.floor(rnd()*PLUSH_COLORS_FOR_PILE.length)];
  const x=st.x+Math.cos(a)*rr,z=st.z+Math.sin(a)*rr,y=.38+r+(rnd()<.35?.08:0);P.lit.push(SP(r,x,y,z,c.body,9));if(rnd()<.5)for(const sx of [-1,1])P.lit.push(SP(r*.35,x+sx*r*.6,y+r*.8,z,c.ear??c.body,6));}}
 P.glass.push(new THREE.CylinderGeometry(st.r-.1,st.r-.1,isl.glassTop-isl.base,8,1,true).rotateY(Math.PI/8).translate(st.x,(isl.base+isl.glassTop)/2,st.z));
 const ring=(y,r,c)=>{const pts=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;pts.push(new THREE.Vector3(st.x+Math.cos(a)*r,y,st.z+Math.sin(a)*r));}P.neon.push(...loop(pts,.014,c));};
 ring(.33,st.r+.025,N.pink);ring(isl.glassTop+.065,st.r-.06,N.sky);
 // 낮은 동그란 의자(기계 사이·앞 구석·섬 옆)
 const stools=S.stools??[[-1.05,-2.25,0],[1.05,-2.25,1],[-3.85,3.05,2],[-3.35,2.75,0],[3.75,2.7,1],[1.15,.55,2]];
 for(const [x,z,k] of stools){stool(P,x,z,A.stool[k],A);colliders.push({x,z,r:.21,id:`stool-${x},${z}`});}
 // 미러볼 셋(천장 육각 테 가운데)
 const balls=S.balls??[[-2.2,.2],[2.2,.2],[-.95,-1.05]];
 for(const [x,z] of balls)discoBall(P,x,2.18,z,mobile?.15:.17,A);
 // ── 천장 네온: 분홍 네모 격자(1.5m) + 미러볼 둘레 하늘색 육각 테. 천장 판은 없다(위는 짙은 배경색 = 어두운 천장)
 const CY_=2.6,ceil=[];
 for(let x=-hw+A.grid/2;x<hw-.1;x+=A.grid)ceil.push(...straight(new THREE.Vector3(x,CY_,-hd+.1),new THREE.Vector3(x,CY_,hd-.1),.014,N.pink));
 for(let z=-hd+A.grid/2;z<hd-.1;z+=A.grid)ceil.push(...straight(new THREE.Vector3(-hw+.1,CY_,z),new THREE.Vector3(hw-.1,CY_,z),.014,N.pink));
 for(const [x,z] of balls){const pts=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;pts.push(new THREE.Vector3(x+Math.cos(a)*.75,CY_-.04,z+Math.sin(a)*.75));}ceil.push(...loop(pts,.016,N.sky));}
 // ── 벽 네온 간판(벽마다 묶음): 하트·구름·달·별·도시. 벽 아래·위 네온 띠
 const W={back:{o:new THREE.Vector3(0,0,-hd),u:new THREE.Vector3(1,0,0),n:new THREE.Vector3(0,0,1)},front:{o:new THREE.Vector3(0,0,hd),u:new THREE.Vector3(-1,0,0),n:new THREE.Vector3(0,0,-1)},
  left:{o:new THREE.Vector3(-hw,0,0),u:new THREE.Vector3(0,0,1),n:new THREE.Vector3(1,0,0)},right:{o:new THREE.Vector3(hw,0,0),u:new THREE.Vector3(0,0,-1),n:new THREE.Vector3(-1,0,0)}};
 const NW={back:[],front:[],left:[],right:[]};
 // 뒷벽: 왼쪽 위 달 + 별 둘, 오른쪽 위 도시 윤곽 + 작은 달
 sign(NW.back,W.back,moonPts(-3.6,2.15,.2),N.yellow);sign(NW.back,W.back,starPts(-3.05,2.32,.07),N.yellow);sign(NW.back,W.back,starPts(-4.05,1.95,.05),N.yellow);
 polyline(NW.back,W.back,cityPts(2.75,1.72,1.5),N.sky);sign(NW.back,W.back,moonPts(4.1,2.38,.07),N.yellow);
 // 왼벽: 진열장 위 구름, 앞쪽 하트 둘
 sign(NW.left,W.left,cloudPts(-2.05,2.22,.42),N.sky);sign(NW.left,W.left,heartPts(2.3,2.08,.22),N.pink);sign(NW.left,W.left,heartPts(2.95,2.3,.12),N.pink);
 // 오른벽: 뒤쪽 큰 하트 + 구름(코인 받는 곳·희귀도 안내판 위를 피함)
 sign(NW.right,W.right,heartPts(2.75,2.1,.24),N.pink);sign(NW.right,W.right,cloudPts(-2.6,2.25,.3),N.sky);
 // 앞벽(문 쪽 안면): 별·하트 작게
 sign(NW.front,W.front,heartPts(2.0,2.3,.14),N.pink);sign(NW.front,W.front,starPts(-2.0,2.3,.1),N.violet);
 // 벽 띠: 위(보라)·바닥(분홍). 문 구멍 위는 위 띠만
 const band=(key,len,v,c,hole=null)=>{const w=W[key];const seg=(u0,u1)=>NW[key].push(...straight(onWall(w,.012)([u0,v]),onWall(w,.012)([u1,v]),.011,c));
  if(hole&&v<hole.h){seg(-len/2,hole.x-hole.w/2);seg(hole.x+hole.w/2,len/2);}else seg(-len/2,len/2);};
 for(const [key,len] of [['back',S.w],['front',S.w],['left',S.d],['right',S.d]]){band(key,len,S.wallH-.12,N.violet);band(key,len,.1,N.pink,key==='front'?{x:-S.door.x,w:S.door.width,h:S.door.height}:null);}
 // ── 바닥 번짐: 놀 수 있는 기계 앞·장식 기계 앞·섬 둘레
 const glowParts=[],tex=glowTex();
 const glow=(x,z,sx,sz,hex)=>{glowParts.push(paint(new THREE.PlaneGeometry(sx,sz).rotateX(-Math.PI/2).translate(x,.004,z),hex));};
 machines.forEach((m,i)=>{const [gx,gz]=rot(m,0,.85/2+.35),side=Math.abs(Math.sin(m.heading??0))>.5;glow(gx,gz,side?.7:1.25,side?1.25:.7,machineNeon[i%3]);});
 for(const c of cab){const fx=Math.sin(c.ry),fz2=Math.cos(c.ry);glow(c.x+fx*.62,c.z+fz2*.62,Math.abs(fx)>.5?.6:1.0,Math.abs(fx)>.5?1.0:.6,c.neon);}
 glow(st.x,st.z,2.6,2.6,N.pink);
 // 벽 밑 분홍 띠가 바닥에 비친 번짐(네 벽)
 for(const [x,z,sx,sz] of [[0,-hd+.25,S.w,.7],[0,hd-.25,S.w,.7],[-hw+.25,0,.7,S.d],[hw-.25,0,.7,S.d]])glow(x,z,sx,sz,N.pink);
 // 천장 미러볼 아래 둥근 빛
 for(const [x,z] of balls)glow(x,z,1.6,1.6,N.sky);
 // 묶어서 내보내기: free는 꾸밈 묶음에, 벽 바구니는 wallParts[key] 묶음으로(claw-shop-art가 벽 묶음에 넣음)
 const glassMat=new THREE.MeshStandardMaterial({color:A.glass,roughness:.08,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide,name:'arcade-glass'});
 const pack=(b,name,neonExtra=[])=>{const g=new THREE.Group();g.name=name;
  if(b.lit.length){const lit=litMesh(b.lit,name+' 장식');toonify?.(lit,{kind:'prop'});g.add(lit);}
  if(b.glass.length){const gl=new THREE.Mesh(merge(b.glass),glassMat);gl.name=name+' 유리';gl.renderOrder=2;g.add(gl);}
  const nn=[...b.neon,...neonExtra];if(nn.length)g.add(neonMesh(nn,name+' 네온',A.gain));return g;};
 grp.add(pack(Pk.free,'뽑기방'));
 const ceiling=neonMesh(ceil,'천장 네온',A.gain);grp.add(ceiling);
 const wallParts={};for(const k of ['back','front','left','right'])wallParts[k]=pack(Pk[k],`벽:${k}`,NW[k]);
 let glowMesh=null;if(tex){glowMesh=new THREE.Mesh(merge(glowParts),new THREE.MeshBasicMaterial({map:tex,vertexColors:true,transparent:true,opacity:.55+.35*(A.glow??0),depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,name:'floor-glow'}));glowMesh.name='바닥 번짐';glowMesh.renderOrder=1;grp.add(glowMesh);}
 else glowParts.forEach(g=>g.dispose());
 // 천장 네온은 카메라가 그 높이 위로 가면 숨긴다(위에서 내려다볼 때 선이 화면을 가로지르지 않게)
 const hideCeiling=camLocalY=>{ceiling.visible=camLocalY<CY_-.05;};
 return {group:grp,wallParts,ceiling,colliders,look:arcadeLook(look),light:A.light,colors:A,hideCeiling,island:isl,update(){}};
}
