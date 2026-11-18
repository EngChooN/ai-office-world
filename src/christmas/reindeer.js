// 크리스마스 루돌프 그림·동작(월드아트, 2026-11-18). 하늘 썰매 설계 v2(docs/크리스마스/루돌프-하늘썰매-설계-v2.md, 대표 지시: 루돌프 2마리가 썰매를 끎) 2/3단계 그림 자산.
// 썰매·끈·탄 사람은 sky-sleigh.js가 이 루돌프 무리를 써서 만든다. 이 파일은 루돌프 한 종류(그림·동작·한 번에 여러 마리 그리기)만.
// 동동이 화풍: 큰 머리·짧은 다리·통통한 몸, 빛나는 빨간 코, 연한 뿔, 금빛 방울 목걸이, 붉은 마구(가슴 띠·배 띠, 금 고리·방울), 발목 흰 털, 하얀 꼬리.
// 크기: 등 0.7m · 머리 꼭대기 1.13m · 뿔 끝 1.4m(설계 추천 「키 약 1.1m, 뿔까지 1.4m」) · 몸 길이 약 0.8m.
//
// ■ 성능: 루돌프가 몇 마리든 그리기 5번(몸·머리·윗다리·아랫다리·코 빛)이다. 부위마다 InstancedMesh 하나에 모든 루돌프를 넣는다(createReindeerHerd).
//   삼각형 수는 REINDEER_BUDGET(시험이 검사). 점광원 없음 — 코는 HDR 색(블룸)으로만 빛난다.
// ■ 좌표: 1m = 1, 루돌프 앞 = 로컬 −Z, heading 0 = −Z를 봄(동동이·layout.js와 같은 규칙 → 같은 heading이면 같은 쪽을 본다).
//   y = 발굽 바닥 높이(땅에 서 있으면 땅 높이, 날면 고도).
// ■ 동작(mode): stand 서 있기(숨쉬기·두리번) · run 지상 달리기(통통 뛰는 걸음, speed에 맞춘 보폭) · takeoff 날아오르기(progress 0~1) ·
//   fly 비행(앞다리 접고 뒷다리 뻗음, 노 젓듯 천천히) · land 내려앉기(progress 0~1, 0.75에 발굽이 땅에 닿게 높이를 맞추면 착지 충격이 맞음).
//   모드가 바뀌면 0.3초 동안 앞 자세에서 섞여 넘어간다. 비행 중 기울기(pitch·bank)는 높이·방향 변화에서 저절로 계산한다(직접 줄 수도 있음).
import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS} from './palette.js';

const {Vector3,Matrix4,Quaternion,Euler,Color}=THREE;
const v=(x=0,y=0,z=0)=>new Vector3(x,y,z);

// ═════ 색(palette XMAS + 루돌프 몸 색). 몸은 회전목마 루돌프(#c8925c)보다 진한 밤색이라 빨간 안장·흰 털이 또렷하다.
export const REINDEER_COLORS=Object.freeze({
 fur:'#a5683b',furDark:'#8a5530',cream:'#f4e3c6',muzzle:'#f0d3a8',hoof:'#4a3426',antler:'#e2c08a',antlerTip:'#f3dcae',
 eye:'#2a2321',shine:'#ffffff',blush:'#f3a08f',earIn:'#e9a58e',mouth:'#7a3a2c',
 nose:'#ff3b30',saddle:XMAS.santaRed,saddleDark:XMAS.santaRedDark,blanket:XMAS.elfGreen,gold:XMAS.gold,goldDark:XMAS.goldDark,
});
const K=REINDEER_COLORS;

// ═════ 치수(로컬, 발굽 바닥 = 0). 그림과 동작·탑승 자리가 모두 이 값을 쓴다.
const HS=1.18; // 머리 부위 배율(목 관절 기준) — 동동이처럼 큰 머리
const hs=a=>Object.freeze(a.map(x=>+(x*HS).toFixed(4)));
export const REINDEER=Object.freeze({
 body:Object.freeze({y:.5,rx:.19,ry:.2,rz:.38}),
 neck:Object.freeze([0,.12,-.28]),            // 몸 가운데 기준 목 관절(머리 부위의 축)
 hips:Object.freeze([[-.105,-.06,-.21],[.105,-.06,-.21],[-.105,-.06,.22],[.105,-.06,.22]]), // 몸 가운데 기준 다리 관절: 앞왼·앞오·뒤왼·뒤오
 upper:.17,lower:.27,                          // 윗다리·아랫다리(발굽 포함) 길이. .5−.06−.17−.27 = 0 → 서면 발굽이 땅에 닿는다
 traces:Object.freeze([[-.2,-.01,-.1],[.2,-.01,-.1]]), // 몸 가운데 기준 끄는 끈이 걸리는 금 고리(배 띠 옆) 왼·오 → 썰매 앞
 headScale:HS,
 nose:hs([0,.215,-.335]),noseR:+(.05*HS).toFixed(4), // 목 관절 기준 코
 bit:Object.freeze([hs([-.098,.175,-.24]),hs([.098,.175,-.24])]), // 목 관절 기준 굴레 금 고리(고삐가 시작하는 곳) 왼·오 → 탄 사람 손
 trail:Object.freeze([0,-.08,.3]),             // 몸 가운데 기준 별이 떨어지는 자리(배 아래 뒤쪽)
 height:Object.freeze({back:.7,head:1.13,antler:1.4}),
});
// 삼각형 상한(루돌프 한 마리). 휴대폰은 같은 모양을 덜 촘촘하게 만든다.
export const REINDEER_BUDGET=Object.freeze({pc:3400,mobile:2200,drawCalls:5});

// ── 형상 도우미(꼭짓점 색 하나로 칠해 합친다)
const tmpC=new Color();
function paint(geo,color){
 geo=geo.index?geo.toNonIndexed():geo;if(geo.attributes.uv)geo.deleteAttribute('uv');if(!geo.attributes.normal)geo.computeVertexNormals();
 const p=geo.attributes.position,a=new Float32Array(p.count*3),V=v();
 for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);tmpC.set(typeof color==='function'?color(V):color);a[i*3]=tmpC.r;a[i*3+1]=tmpC.g;a[i*3+2]=tmpC.b;}
 geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;
}
const smooth=g=>{g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g);g.computeVertexNormals();return g;};
// 타원체(가운데 c, 반지름 r, 가로·세로 칸 w·h). shape(V)로 단위 구를 먼저 주무를 수 있다.
function ell(c,r,w,h,shape){const g=new THREE.SphereGeometry(1,w,h),p=g.attributes.position,V=v();
 for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);if(shape)shape(V);V.multiply(r).add(c);p.setXYZ(i,V.x,V.y,V.z);}return smooth(g);}
function capsule(a,b,r,radial,cap=2){const d=b.clone().sub(a),len=d.length(),g=new THREE.CapsuleGeometry(r,len,cap,radial);
 g.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,1,0),d.normalize()));const m=a.clone().add(b).multiplyScalar(.5);g.translate(m.x,m.y,m.z);return smooth(g);}
const tube=(pts,r,seg,radial)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),seg,r,radial,false);

// ═════ 부위 형상(부위 축 기준). lod = .8(PC) | .5(휴대폰): 둥근 면의 칸 수 배율
export function buildReindeerGeometry({mobile=false}={}){
 const q=mobile?.5:.8,n=(k,min=4)=>Math.max(min,Math.round(k*q));
 const {rx,ry,rz}=REINDEER.body;
 // ── 몸(몸 가운데 기준): 통통한 몸통(엉덩이 쪽이 조금 큼)·가슴 흰 털·꼬리·담요·안장·방울 목걸이·발걸이
 const body=[];const put=(g,c)=>body.push(paint(g,c));
 put(ell(v(),v(rx,ry,rz),n(16),n(11),V=>{const k=1+.07*V.z;V.x*=k;V.y*=k;}),V=>V.y<-.07&&Math.abs(V.x)<.1+.1*(V.y+.21)?K.cream:K.fur);
 put(ell(v(0,-.04,-.31),v(.1,.11,.07),n(10),n(7)),K.cream);
 put(ell(v(0,.09,.37),v(.055,.075,.045),n(8),n(6)).rotateX(.5),K.cream);
 // 마구: 배 띠(몸통 둘레 빨간 띠 + 등 위 금 장식 + 옆 금 고리 = 끈 걸이)·가슴 띠(가슴 앞 빨간 띠)·등 띠(배 띠와 꼬리를 잇는 띠)
 {const zb=-.06,k=Math.sqrt(1-(zb/rz)**2)*(1+.07*zb/rz);
  put(new THREE.TorusGeometry(1,.022/(ry*k),4,n(18)).scale(rx*k*1.04,ry*k*1.04,1).translate(0,0,zb),K.saddle);
  put(ell(v(0,ry*k*1.04+.012,zb),v(.06,.025,.05),n(8),n(5)),K.gold);
  for(const s of [-1,1]){const [tx,ty,tz]=REINDEER.traces[s<0?0:1];put(new THREE.TorusGeometry(.028,.009,4,n(10)).rotateY(Math.PI/2).translate(tx+s*.008,ty,tz),K.gold);
   put(ell(v(s*rx*.98,.07,zb-.005),v(.022,.022,.022),6,5),K.gold);}
  // 가슴 띠: 몸 앞쪽 둘레(옆 끈 고리까지) 가로로 두른 띠 — 반원 고리를 몸 수평 단면에 맞춰 늘림
  put(new THREE.TorusGeometry(1,.022,4,n(16),Math.PI).rotateX(-Math.PI/2).scale(rx*1.06,1,rz*1.0).translate(0,-.01,0),K.saddle);
  put(new THREE.BoxGeometry(.035,.012,.3).translate(0,ry*1.06,.12).rotateX(.08),K.saddleDark);}
 // 방울 목걸이(목 아래): 빨간 띠 + 금방울 3개(가운데 큰 것)
 const [nx,ny,nz]=REINDEER.neck;
 put(new THREE.TorusGeometry(.118,.028,n(6),n(16)).rotateX(Math.PI/2+.55).translate(nx,ny-.02,nz+.02),K.saddle);
 for(const [bx,by,bz,br] of [[0,ny-.13,nz-.09,.045],[-.1,ny-.07,nz-.02,.032],[.1,ny-.07,nz-.02,.032]]){
  put(ell(v(bx,by,bz),v(br,br,br),n(8),n(6)),V=>V.y<by-br*.35?K.goldDark:K.gold);
  put(new THREE.TorusGeometry(br*.35,br*.12,3,6).translate(bx,by+br*.95,bz),K.goldDark);}
 // ── 머리(목 관절 기준): 목·큰 머리·주둥이·눈(반짝임)·볼·입·귀·뿔·고삐
 const head=[];const hp=(g,c)=>head.push(paint(g,c));
 hp(capsule(v(0,-.04,.03),v(0,.17,-.06),.085,n(10)),V=>V.z<-.04&&V.y<.12?K.cream:K.fur);
 const HC=v(0,.24,-.1),HR=v(.155,.14,.16);
 hp(ell(HC,HR,n(14),n(10)),K.fur);
 hp(ell(v(0,.36,-.11),v(.05,.03,.05),n(8),n(5)),K.furDark); // 이마 앞머리
 hp(ell(v(0,.19,-.235),v(.1,.083,.09),n(12),n(8)),K.muzzle);
 hp(new THREE.TorusGeometry(.022,.006,3,8,Math.PI).rotateZ(Math.PI).translate(0,.158,-.318),K.mouth);
 for(const s of [-1,1]){
  const e=v(s*.072,.268,-.236);
  hp(ell(e,v(.026,.036,.014),n(8),n(6)).rotateY(0),K.eye);
  hp(ell(v(e.x-s*.004-.006,e.y+.013,e.z-.012),v(.009,.011,.005),6,4),K.shine);
  hp(ell(v(e.x+.007,e.y-.012,e.z-.012),v(.005,.006,.004),5,3),K.shine);
  hp(ell(v(s*.112,.205,-.205),v(.034,.02,.01),n(8),n(5)).rotateY(s*.5),K.blush);
  // 귀: 옆으로 처진 잎 모양(안쪽 분홍)
  hp(ell(v(0,0,0),v(.075,.026,.04),n(10),n(6)).rotateZ(s*-.45).rotateY(s*.25).translate(s*.17,.32,-.06),V=>V.y<.315&&Math.abs(V.x)>.14?K.earIn:K.fur);
  // 뿔: 줄기 하나 + 가지 둘(안쪽 앞·바깥쪽), 끝은 밝게
  const r=n(6),tip=V=>V.y>.53?K.antlerTip:K.antler;
  hp(capsule(v(s*.055,.35,-.09),v(s*.145,.58,-.05),.022,r),tip);
  hp(capsule(v(s*.09,.44,-.08),v(s*.045,.53,-.14),.017,r),tip);
  hp(capsule(v(s*.125,.52,-.06),v(s*.215,.6,-.08),.016,r),tip);
  // 굴레 금 고리(고삐는 sky-sleigh.js가 이 고리에서 탄 사람 손까지 따로 그림)
  hp(new THREE.TorusGeometry(.016,.006,3,8).rotateY(Math.PI/2).translate(s*.098,.175,-.24),K.gold);}
 // 띠(주둥이 둘레 빨간 굴레)
 hp(new THREE.TorusGeometry(.095,.012,3,n(14)).scale(1,.85,1).rotateX(Math.PI/2-.25).translate(0,.2,-.22),K.saddle);
 // ── 다리(관절 기준, 아래로): 윗다리 / 아랫다리 + 흰 발목 털 + 발굽
 const U=REINDEER.upper,Lw=REINDEER.lower;
 const upper=paint(capsule(v(0,.03,0),v(0,-U,0),.062,n(8)),K.fur);
 const lower=mergeGeometries([paint(capsule(v(0,0,0),v(0,-Lw+.07,0),.048,n(8)),K.fur),
  paint(ell(v(0,-Lw+.08,0),v(.062,.034,.062),n(8),n(5)),K.cream),
  paint(new THREE.CylinderGeometry(.05,.056,.055,n(8)).translate(0,-Lw+.0275,0),K.hoof)]);
 const nose=new THREE.SphereGeometry(REINDEER.noseR,n(10,6),n(8,5));
 return {body:mergeGeometries(body),head:mergeGeometries(head).scale(HS,HS,HS),upper,lower,nose};
}
// 썰매(sky-sleigh.js)도 같은 도우미로 만든다
export const ART=Object.freeze({paint,ell,capsule,tube,v});
export function triangleCount(geo){return (geo.index?geo.index.count:geo.attributes.position.count)/3;}
export function reindeerTriangles(parts){return triangleCount(parts.body)+triangleCount(parts.head)+(triangleCount(parts.upper)+triangleCount(parts.lower))*4+triangleCount(parts.nose);}

// ═════ 동작(순수 계산). 각도는 라디안, 다리 각은 앞으로 내밀면 +, 아랫다리는 윗다리 기준(뒤로 접으면 −).
// 반환 {y(몸 위아래), pitch(코 들면 +), roll, headPitch, headYaw, legs:[[윗,아래]×4: 앞왼·앞오·뒤왼·뒤오], tail}
const MODES=Object.freeze(['stand','run','takeoff','fly','land']);
export const REINDEER_MODES=MODES;
const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),ease=t=>t*t*(3-2*t);
const FLY_LEGS=[[1.05,-1.75],[1.15,-1.8],[-.95,-.15],[-.85,-.2]];
// 통통 뛰는 걸음 한 주기 길이(m): 빠를수록 조금 길게
export const strideAt=speed=>.95+.1*Math.max(0,speed);
export function reindeerPose(mode,{t=0,cycle=0,progress=0,speed=0}={}){
 const P={y:0,pitch:0,roll:0,headPitch:0,headYaw:0,legs:[[0,0],[0,0],[0,0],[0,0]],tail:0};
 if(mode==='stand'){P.y=.006*Math.sin(t*2.1);P.headYaw=.18*Math.sin(t*.37)*Math.sin(t*.11+1);P.headPitch=.04*Math.sin(t*.9)-.02;P.tail=.15*Math.sin(t*3);return P;}
 if(mode==='run'||mode==='takeoff'&&progress<0){
  const k=clamp(speed/3.6,.35,1.4),A=.55*Math.min(1.15,k),ph=cycle*Math.PI*2,off=[0,.35,Math.PI,Math.PI+.35];
  P.legs=off.map((o,i)=>{const s=Math.sin(ph+o),fold=Math.max(0,Math.cos(ph+o));return [A*s+(i<2?.08:-.06),-(i<2?1.15:.85)*fold*Math.min(1,k+.2)];});
  P.y=.045*k*Math.max(0,Math.sin(ph*2-Math.PI/2)*.5+.5);P.pitch=.09*k*Math.sin(ph);P.headPitch=-.6*P.pitch+.04;P.tail=.35;return P;}
 if(mode==='fly'){const w=t*2.4;
  P.legs=FLY_LEGS.map(([u,l],i)=>[u+.16*Math.sin(w+(i<2?0:Math.PI)+i*.4),l+.12*Math.sin(w+1+i*.4)]);
  P.y=.035*Math.sin(t*1.9);P.headPitch=.1+.03*Math.sin(t*1.9+.6);P.tail=.25+.1*Math.sin(t*3);return P;}
 if(mode==='takeoff'){const p=clamp(progress,0,1);
  // 0~0.22 웅크렸다 뒷다리로 박참(코를 크게 듦) → 1까지 비행 자세로
  if(p<.22){const e=ease(p/.22);P.legs=[[lerp(.1,.95,e),lerp(-.2,-1.3,e)],[lerp(.1,1.0,e),lerp(-.2,-1.35,e)],[lerp(.25,-.9,e),lerp(-.6,-.05,e)],[lerp(.25,-.85,e),lerp(-.6,-.05,e)]];
   P.y=lerp(-.05,.02,e);P.pitch=lerp(-.05,.38,e);P.headPitch=lerp(-.1,.18,e);P.tail=.5;return P;}
  const e=ease((p-.22)/.78),f=reindeerPose('fly',{t});
  P.legs=f.legs.map(([u,l],i)=>[lerp([.95,1.0,-.9,-.85][i],u,e),lerp([-1.3,-1.35,-.05,-.05][i],l,e)]);
  P.y=lerp(.02,f.y,e);P.pitch=lerp(.38,.12,e);P.headPitch=lerp(.18,f.headPitch,e);P.tail=.4;return P;}
 if(mode==='land'){const p=clamp(progress,0,1),f=reindeerPose('fly',{t});
  // 0~0.6 다리를 아래로 뻗으며 코를 듦 → 0.75 발굽이 땅에 닿음(몸이 꾹 눌림) → 1 서기
  const reach=[[.5,-.25],[.55,-.3],[.3,-.35],[.25,-.3]];
  if(p<.6){const e=ease(p/.6);P.legs=f.legs.map(([u,l],i)=>[lerp(u,reach[i][0],e),lerp(l,reach[i][1],e)]);P.y=lerp(f.y,0,e);P.pitch=lerp(.1,.22,e);P.headPitch=lerp(f.headPitch,.05,e);P.tail=.4;return P;}
  if(p<.75){const e=ease((p-.6)/.15);P.legs=reach.map(([u,l])=>[lerp(u,.06,e),lerp(l,-.05,e)]);P.pitch=lerp(.22,0,e);P.headPitch=.05;P.tail=.35;return P;}
  const e=(p-.75)/.25,dip=Math.sin(Math.PI*Math.min(1,e*1.4))*(1-e*.4);
  P.legs=[[.18*dip,-.36*dip],[.18*dip,-.36*dip],[.3*dip,-.62*dip],[.3*dip,-.62*dip]];
  P.y=-.065*dip;P.pitch=-.05*dip;P.headPitch=-.1*dip;P.tail=.3*(1-e);return P;}
 return P;
}
// 다리를 접으면 관절이 몸 아래에 있어도 발굽이 땅보다 높다 — 서기·달리기에서 가장 낮은 발굽 높이(시험·착지 확인용)
export function lowestHoof(pose){const {y:by}=REINDEER.body,U=REINDEER.upper,L=REINDEER.lower;let lo=Infinity;
 REINDEER.hips.forEach(([hx,hy,hz],i)=>{const [u,l]=pose.legs[i],c=Math.cos(pose.pitch),s=Math.sin(pose.pitch);
  const jy=hy*c-hz*s; // 몸 가운데 기준 관절을 pitch만큼 돌린 높이
  const fy=jy-U*Math.cos(u+pose.pitch)-L*Math.cos(u+l+pose.pitch);lo=Math.min(lo,by+pose.y+fy);});return lo;}

// ═════ 무리(그리기 5번으로 모든 루돌프). max = 동시에 그릴 수 있는 수(하늘 썰매는 sky-sleigh.js가 썰매 수 × 2로 만든다).
// 쓰는 법(월드개발):
//   const herd=createReindeerHerd({toon,max:31,mobile});scene.add(herd.group);
//   const deer=herd.spawn();               // 다 쓰면 null
//   deer.set(x,y,z,heading);deer.mode='run';deer.speed=3.6;   // 매 프레임 위치·모드만 바꿈
//   herd.update(dt);                       // 모든 루돌프 행렬 계산
//   deer.trace(0|1,v3)·deer.bit(0|1,v3)·deer.trailPoint(v3)·deer.nose(v3)  // 세계 좌표(끈·고삐·별 흔적용)
//   deer.release();                        // 돌려주기
export function createReindeerHerd({toon=null,max=31,mobile=false,parent=null,name='루돌프'}={}){
 const G=buildReindeerGeometry({mobile});
 const group=new THREE.Group();group.name=`${name} 무리`;
 const vc=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 // 화면 밖이면 안 그린다: 모든 부위가 살아 있는 루돌프를 감싸는 구 하나(매 프레임 갱신)를 같이 쓴다
 const bound=new THREE.Sphere(new Vector3(),1);
 const mk=(geo,count,label)=>{const m=new THREE.InstancedMesh(geo,vc,count);m.name=`${name} ${label}`;m.count=0;m.boundingSphere=bound;m.castShadow=!mobile;m.receiveShadow=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(m);return m;};
 const meshes={body:mk(G.body,max,'몸'),head:mk(G.head,max,'머리'),upper:mk(G.upper,max*4,'윗다리'),lower:mk(G.lower,max*4,'아랫다리')};
 if(toon?.toonify)for(const m of Object.values(meshes))toon.toonify(m,{kind:'prop'});
 const noseMat=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:true});
 const noseMesh=new THREE.InstancedMesh(G.nose,noseMat,max);noseMesh.name=`${name} 코 빛`;noseMesh.count=0;noseMesh.boundingSphere=bound;noseMesh.userData.line=0;
 noseMesh.setColorAt(0,new Color(1,1,1));group.add(noseMesh);
 if(parent)parent.add(group);
 const pool=[],live=[];
 const M=new Matrix4(),R=new Matrix4(),T=new Matrix4(),X=new Matrix4(),Q=new Quaternion(),E=new Euler(0,0,0,'YXZ'),P3=v(),S1=v(1,1,1);
 const noseC=new Color(K.nose);
 function spawn(){
  if(live.length>=max)return null;
  const d={id:live.length,x:0,y:0,z:0,heading:0,pitch:null,bank:null,mode:'stand',progress:0,speed:0,visible:true,glow:1,
   _t:Math.random()*20,_cycle:0,_prev:null,_blend:1,_mode:'stand',_pitch:0,_bank:0,_ly:null,_lh:null,_body:new Matrix4(),_head:new Matrix4(),_root:new Matrix4(),_bodyL:new Matrix4().makeTranslation(0,REINDEER.body.y,0),_headL:new Matrix4().makeTranslation(...REINDEER.neck),
   // 위치를 바꾸면 끈·고삐 자리도 바로 따라온다(마지막 자세 그대로) — herd.update가 늦게 돌아도 한 프레임 뒤처지지 않는다
   set(x,y,z,heading=d.heading){d.x=x;d.y=y;d.z=z;d.heading=heading;place(d);return d;},
   trace(side,t=v()){const [a,b,c]=REINDEER.traces[side?1:0];return t.set(a,b,c).applyMatrix4(d._body);},
   bit(side,t=v()){const [a,b,c]=REINDEER.bit[side?1:0];return t.set(a,b,c).applyMatrix4(d._head);},
   nose(t=v()){const [a,b,c]=REINDEER.nose;return t.set(a,b,c).applyMatrix4(d._head);},
   trailPoint(t=v()){const [a,b,c]=REINDEER.trail;return t.set(a,b,c).applyMatrix4(d._body);},
   // 지금 그려진 자세(시험·점검)
   get pose(){return d._pose;},
   release(){const i=live.indexOf(d);if(i>=0){live.splice(i,1);pool.push(d);}},
  };
  live.push(d);return d;
 }
 function place(d){E.set(d._pitch,d.heading,d._bank);d._root.compose(P3.set(d.x,d.y,d.z),Q.setFromEuler(E),S1);d._body.multiplyMatrices(d._root,d._bodyL);d._head.multiplyMatrices(d._body,d._headL);}
 const mixPose=(a,b,w)=>({y:lerp(a.y,b.y,w),pitch:lerp(a.pitch,b.pitch,w),roll:lerp(a.roll,b.roll,w),headPitch:lerp(a.headPitch,b.headPitch,w),headYaw:lerp(a.headYaw,b.headYaw,w),tail:lerp(a.tail,b.tail,w),legs:a.legs.map(([u,l],i)=>[lerp(u,b.legs[i][0],w),lerp(l,b.legs[i][1],w)])});
 function update(dt){
  let n=0;
  for(const d of live){
   if(!d.visible)continue;
   d._t+=dt;
   if(d.mode==='run')d._cycle=(d._cycle+dt*Math.max(.6,d.speed)/strideAt(d.speed))%1;
   if(d.mode!==d._mode){d._prev=d._pose??reindeerPose(d._mode,{t:d._t});d._blend=0;d._mode=d.mode;}
   let pose=reindeerPose(d.mode,{t:d._t,cycle:d._cycle,progress:d.progress,speed:d.speed});
   if(d._blend<1){d._blend=Math.min(1,d._blend+dt/.3);pose=mixPose(d._prev,pose,ease(d._blend));}
   d._pose=pose;
   // 비행 기울기: 오르내림 속도 → 코 들기, 도는 빠르기 → 몸 기울기(직접 준 값이 있으면 그것)
   const air=d.mode==='fly'||d.mode==='takeoff'||d.mode==='land';
   const climb=d._ly==null||dt<=0?0:(d.y-d._ly)/dt;let turn=d._lh==null||dt<=0?0:(d.heading-d._lh);turn=Math.atan2(Math.sin(turn),Math.cos(turn))/Math.max(dt,1e-3);
   d._ly=d.y;d._lh=d.heading;
   const tp=d.pitch??(air?clamp(climb*.09,-.32,.32):0),tb=d.bank??(air?clamp(turn*.22,-.45,.45):clamp(turn*.05,-.12,.12));
   const k=Math.min(1,dt*4);d._pitch+=(tp-d._pitch)*k;d._bank+=(tb-d._bank)*k;
   E.set(pose.pitch,0,pose.roll);d._bodyL.compose(P3.set(0,REINDEER.body.y+pose.y,0),Q.setFromEuler(E),S1);
   const [nx,ny,nz]=REINDEER.neck;E.set(pose.headPitch,pose.headYaw,0);d._headL.compose(P3.set(nx,ny,nz),Q.setFromEuler(E),S1);
   place(d);
   meshes.body.setMatrixAt(n,d._body);meshes.head.setMatrixAt(n,d._head);
   const [ox,oy,oz]=REINDEER.nose;T.makeTranslation(ox,oy,oz);M.multiplyMatrices(d._head,T);noseMesh.setMatrixAt(n,M);
   noseMesh.setColorAt(n,tmpC.copy(noseC).multiplyScalar(d.glow*(2.3+.5*Math.sin(d._t*3.1))));
   REINDEER.hips.forEach(([hx,hy,hz],i)=>{const [u,l]=pose.legs[i];
    R.makeRotationX(u).setPosition(hx,hy,hz);M.multiplyMatrices(d._body,R);meshes.upper.setMatrixAt(n*4+i,M);
    X.makeRotationX(l).setPosition(0,-REINDEER.upper,0);T.multiplyMatrices(M,X);meshes.lower.setMatrixAt(n*4+i,T);});
   n++;
  }
  meshes.body.count=meshes.head.count=noseMesh.count=n;meshes.upper.count=meshes.lower.count=n*4;
  // 감싸는 구: 루돌프 자리들의 가운데 + 가장 먼 루돌프까지 + 몸 크기(1.2m)
  let cx=0,cy=0,cz=0,k=0;for(const d of live)if(d.visible){cx+=d.x;cy+=d.y;cz+=d.z;k++;}
  if(k){cx/=k;cy/=k;cz/=k;let r=0;for(const d of live)if(d.visible)r=Math.max(r,Math.hypot(d.x-cx,d.y-cy,d.z-cz));bound.center.set(cx,cy+.6,cz);bound.radius=r+1.2;}
  for(const m of [...Object.values(meshes),noseMesh])m.visible=n>0;
  for(const m of [...Object.values(meshes),noseMesh])m.instanceMatrix.needsUpdate=true;
  if(noseMesh.instanceColor)noseMesh.instanceColor.needsUpdate=true;
 }
 return {group,meshes:{...meshes,nose:noseMesh},spawn,update,get live(){return live.length;},max,
  triangles:reindeerTriangles(G),drawCalls:5,
  dispose(){for(const m of [...Object.values(meshes),noseMesh])m.geometry.dispose();vc.dispose();noseMat.dispose();group.removeFromParent();}};
}
