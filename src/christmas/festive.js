// 크리스마스 광장 「밝고 화려하게」 시안(월드아트, 2026-11-17). 11-17 대표 결정으로 시안 B가 기본 화면, A와 예전 화면(?look=classic)은 옵션.
//   ?look=festive(또는 festive-a) = 시안 A: 해 진 직후 푸른 시간대 + 따뜻한 불빛, 광장 둘레 목조 노점, 전구 줄·깃발 줄, 장식(가로등 화환·창 전구·작은 트리·선물 더미·지팡이 사탕·눈 사슴), 입구 아치 강조, 반짝임
//   기본(또는 ?look=festive-b) = 시안 B: A + 포토존(루돌프 회전목마)·빛 조형(입구 빛 터널·빛 선물상자)·장식 더 많이
// 참고한 것: 서울·유럽 크리스마스 마켓의 공통 요소(목조 노점·가로지르는 전구 줄·거대 트리·회전목마·빛 조형). 실제 장소는 재현하지 않고 우리 화풍으로 새로 그렸다.
// 그리기 호출을 아끼려고 같은 재질은 한 형상으로 합친다: 나무·눈 등 꼭짓점 색 1개, 빛나는 면 1개, 전구 InstancedMesh 1개, 전선 1개, 간판 1개, 바닥 빛 1개, 눈 반짝이 1개(+B 회전목마 3개).
// 점광원은 더하지 않는다(전구는 HDR 색 MeshBasic → 블룸, 바닥은 빛 판). 외부 이미지 없음(간판 그림도 캔버스에 코드로 그림).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {v,ell,capsule} from '../toon/concept-kit.js';
import {XMAS,XMAS_SKY} from './palette.js';
import * as L from './layout.js';
import {groundGlowMaterial,haloMaterial} from './props.js';
import {RINK,CAROUSEL,CAROUSEL_SEATS,carouselSpin,deerBob,carouselSeatAt,lookLevel,REINDEER_STATION} from './festive-layout.js';
import {createSkySleighFleet,SLEIGH} from './sky-sleigh.js';
import {createStarTrail} from './star-trail.js';
import {createSkateArt} from './skate-art.js';

const {Color,Matrix4}=THREE;
const rng=seed=>{let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};

// ── 주소 옵션 → 단계(0 = 예전 화면 ?look=classic, 1 = 시안 A ?look=festive, 2 = 시안 B = 11-17부터 기본). 규칙은 festive-layout.js lookLevel 한곳
export function festiveLevel(search=typeof location!=='undefined'?location.search:''){return lookLevel(search);}

// ── 하늘·빛: 해가 막 진 푸른 시간대(태양 −6°, 북서쪽 지평선에 남은 노을빛) + 마을 불빛 반사광을 크게.
// 값의 모양은 palette XMAS_SKY와 같다(main.js·preview.js의 빛 공식에 그대로 들어감).
const FESTIVE_SKY=Object.freeze({
 ...XMAS_SKY,
 sun:Object.freeze({elevation:-13,azimuth:318}),
 moon:Object.freeze({elevation:30,azimuth:130,illumination:.95}),
 light:Object.freeze({hemi:2.15,moon:1.3,exposure:1.2,warmFill:Object.freeze({sky:'#ffdcb0',ground:'#a4b6ea',intensity:.42})}),
});
export const skyFor=level=>level?FESTIVE_SKY:XMAS_SKY;
// 푸른 시간대 색 맞춤: 공용 하늘 키(mood-config)는 그대로 두고, 이 장면의 env 색만 푸른 쪽으로 옮긴다(땅 눈이 회보라·베이지로 죽지 않게).
const BLUE_HOUR={zenith:[.12,.25,.56],horizon:[.86,.6,.62],haze:[.36,.48,.8],hemi:[.58,.7,1],k:.75};
// 블룸 문턱: 밤 공식 문턱(.55)이면 밝아진 눈 바닥까지 번져 뿌옇고 휴대폰(반 해상도 블룸)에서 네모 얼룩이 생긴다 → 전구·창 같은 HDR 불빛만 번지게 올린다.
export function tunePipeline(level,pipeline){if(!level||!pipeline?.passes?.bloom)return;const up=pipeline.update;
 pipeline.update=env=>{up(env);const b=pipeline.passes.bloom;b.threshold=Math.max(b.threshold,.9);b.strength*=.85;};}
export function tuneEnv(level,env){if(!level)return env;const mix=(a,b)=>a.map((x,i)=>x+(b[i]-x)*BLUE_HOUR.k);
 return {...env,zenith:mix(env.zenith,BLUE_HOUR.zenith),horizon:mix(env.horizon,BLUE_HOUR.horizon),haze:mix(env.haze,BLUE_HOUR.haze),fogColor:mix(env.fogColor,BLUE_HOUR.haze),hemiColor:mix(env.hemiColor,BLUE_HOUR.hemi)};}

// ── 색(palette XMAS에서 가져오고 마켓에 필요한 것만 더함)
const C={...XMAS,woodLight:'#d29a62',woodWarm:'#a0643a',roofRed:'#b8413a',roofGreen:'#3b7a55',roofBlue:'#3f6f8f',gold:'#f0c24f',
 warmBulb:'#ffd27a',whiteBulb:'#fff2d6',interior:'#ffc773',deer:'#c8925c',deerDark:'#8a5a34'};
const MARKET_BULBS=['#ffd27a','#ffd27a','#ff6b5e','#ffd27a','#9cf08a','#ffd27a','#7fd6ff'];

// ── 노점 자리: 광장 돌바닥 둘레(반지름 14.6m), 트리를 본다. 각도 = atan2(x,z)(0 = 남쪽 입구).
// 비워 둔 곳: 남쪽 입구 길(±15°), 서쪽 모닥불(−86°±18°), 동쪽 우체통·카드 판(93~102°), 북쪽 썰매·계단 길(±159°), 북동 케이블카 쪽(140°).
// [각도(도), 가게 종류]. 휴대폰은 앞 5개만.
const STALLS=[[40,'cocoa'],[-40,'cookie'],[64,'card'],[-62,'toy'],[120,'ornament'],[-120,'candy'],[-142,'scarf']];
// 시안 B는 넓힌 광장(festive-layout PLAZA_B)이면 노점 고리·길가 장식도 같이 바깥으로(K배)
const BIG=L.BIG_PLAZA,K=BIG?.scale??1;
const STALL_R=BIG?.stallR??14.6,STALL_W=2.7,STALL_D=1.6;
const SIGN={cocoa:'핫초코',cookie:'쿠키',card:'카드',toy:'장난감',ornament:'오너먼트',candy:'사탕',scarf:'목도리',photo:'포토존',skate:'스케이트',reindeer:'루돌프 썰매 정류장'};
const SIGN_KEYS=Object.keys(SIGN);

export function buildFestive({group,tz,H,mobile=false,level=1,colliders,houses=[],tree=null,camera=null}){
 const root=new THREE.Group();root.name='크리스마스 마켓 시안';group.add(root);
 const r=rng(1225);
 const solid=[],glowGeo=[],wires=[],signs=[],pools=[],bulbs=[];
 const M=new Matrix4(),Y=new THREE.Vector3(0,1,0),tmp=new Color();
 const circleC=(x,z,rr)=>colliders.push({x,z,r:rr});
 const boxC=(x,z,w,d,heading=0)=>colliders.push({x,z,w,d,heading});

 // 꼭짓점 색 칠하기(조각마다 한 색 또는 위치 함수) → 놓기 행렬 적용 후 목록에 넣는다.
 const paint=(geo,color,k=1)=>{geo=geo.index?geo.toNonIndexed():geo;if(geo.attributes.uv&&color!=='uv')geo.deleteAttribute('uv');if(!geo.attributes.normal)geo.computeVertexNormals();
  const p=geo.attributes.position,a=new Float32Array(p.count*3),V=v();
  for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);tmp.set(typeof color==='function'?color(V):color).multiplyScalar(k);a.set([tmp.r,tmp.g,tmp.b],i*3);}
  geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;};
 // 놓기 틀: 위치(x,z)·바닥 y·돌림 ry. add(geo,색) = 그 틀로 옮겨 넣음.
 const frame=(x,z,ry=0,y=H(x,z))=>{const m=new Matrix4().makeRotationY(ry).setPosition(x,y,z);
  const put=(list,geo)=>{geo.applyMatrix4(m);list.push(geo);return geo;};
  return {m,x,z,ry,y,
   add:(geo,color)=>put(solid,paint(geo,color)),
   glow:(geo,color,k=1.6)=>put(glowGeo,paint(geo,color,k)),
   bulb:(lx,ly,lz,color,k=2.2,s=1)=>{const p=v(lx,ly,lz).applyMatrix4(m);bulbs.push({p,c:new Color(color),k,s,ph:r()*6.28});},
   point:(lx,ly,lz)=>v(lx,ly,lz).applyMatrix4(m)};};
 const world=frame(0,0,0,0);
 const B=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
 const lump=(rx,ry,rz,seed)=>{const q=rng(seed),k=q()*10;return ell(v(rx,ry,rz),{w:12,h:8,shape:V=>{if(V.y<0)V.y*=.35;V.multiplyScalar(1+Math.sin(V.x*5+k)*Math.sin(V.z*4+k*.7)*.08);}});};
 // 늘어진 줄(두 점 사이 포물선 처짐) 위 점들
 const sagPts=(a,b,sag,n)=>Array.from({length:n+1},(_,i)=>{const t=i/n;return a.clone().lerp(b,t).addScaledVector(Y,-sag*4*t*(1-t));});
 // 전구 줄: 전선 + 일정 간격 전구(colors 돌아가며)
 const string=(a,b,{sag=.5,gap=mobile?.62:.42,colors=MARKET_BULBS,k=2.0,size=1}={})=>{
  const len=a.distanceTo(b),n=Math.max(2,Math.round(len/gap)),pts=sagPts(a,b,sag,Math.max(8,Math.round(len*2)));
  wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*2,.014,4,false));
  for(let i=1;i<n;i++){const t=i/n,p=a.clone().lerp(b,t).addScaledVector(Y,-sag*4*t*(1-t)-.05);bulbs.push({p,c:new Color(colors[i%colors.length]),k,s:size,ph:r()*6.28});}
  return pts;};
 // 깃발 줄(삼각 깃발, 얇은 판)
 const flagShape=new THREE.Shape([new THREE.Vector2(-.13,0),new THREE.Vector2(.13,0),new THREE.Vector2(0,-.3)]);
 const bunting=(a,b,{sag=.45,gap=.42}={})=>{const len=a.distanceTo(b),n=Math.max(2,Math.round(len/gap)),dir=b.clone().sub(a).setY(0).normalize(),ry=Math.atan2(dir.x,dir.z)-Math.PI/2;
  wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sagPts(a,b,sag,12)),24,.012,4,false));
  for(let i=1;i<n;i++){const t=i/n,p=a.clone().lerp(b,t).addScaledVector(Y,-sag*4*t*(1-t));
   const g=new THREE.ExtrudeGeometry(flagShape,{depth:.012,bevelEnabled:false}).translate(0,0,-.006).rotateY(ry).translate(p.x,p.y,p.z);solid.push(paint(g,[C.santaRed,C.gold,C.elfGreen,C.fur,C.ornBlue][i%5]));}};

 // ═════ 노점(목조 샬레): 바닥판·뒷벽·옆벽·앞 기둥·계산대·박공지붕+두꺼운 눈·처마 화환+전구·안쪽 따뜻한 빛·간판
 const roofs=[C.roofRed,C.roofGreen,C.woodWarm,C.roofBlue];
 const stallList=STALLS.slice(0,mobile?5:STALLS.length);
 stallList.forEach(([deg,kind],i)=>{
  const a=deg*Math.PI/180,x=Math.sin(a)*STALL_R,z=Math.cos(a)*STALL_R,ry=Math.atan2(-x,-z),f=frame(x,z,ry,0);
  const W=STALL_W,D=STALL_D,wall=i%2?C.wood:C.woodLight,trim=i%2?C.santaRed:C.elfGreen,roof=roofs[i%4],eave=1.85,ridge=2.5,over=.45;
  f.add(B(W+.1,.12,D+.1,0,.06,0),C.woodDark);
  f.add(B(W,eave,.1,0,eave/2,-D/2+.05),wall);
  for(const s of [-1,1]){f.add(B(.1,eave,D,s*(W/2-.05),eave/2,0),wall);f.add(B(.14,eave,.14,s*(W/2-.02),eave/2,D/2-.04),C.woodDark);}
  // 판자 줄무늬(뒷벽 안쪽 가로 줄)
  for(let k=0;k<4;k++)f.add(B(W-.2,.025,.02,0,.35+k*.42,-D/2+.11),C.woodDark);
  // 계산대 + 위판 + 앞 장식 띠
  f.add(B(W-.2,.62,.34,0,.31,D/2-.2),trim);f.add(B(W,.06,.46,0,.65,D/2-.18),C.woodLight);
  for(let k=0;k<5;k++)f.add(B(.05,.5,.02,-W/2+.35+k*(W-.7)/4,.32,D/2-.02),C.fur);
  // 박공지붕(능선은 가로, 앞뒤로 내려옴) + 눈
  const half=D/2+over,slope=Math.hypot(half,ridge-eave),pitch=Math.atan2(ridge-eave,half);
  for(const s of [-1,1]){const g=B(W+.5,.1,slope,0,0,s*slope/2).rotateX(s*pitch).translate(0,ridge,0);f.add(g,roof);
   f.add(B(W+.56,.13,slope-.04,0,.1,s*(slope/2-.02)).rotateX(s*pitch).translate(0,ridge,0),C.snow);}
  f.add(capsule(v(-W/2-.25,ridge+.13,0),v(W/2+.25,ridge+.13,0),.11,8),C.snow);
  // 옆 박공 세모(벽 위)
  {const sh=new THREE.Shape([new THREE.Vector2(-D/2,0),new THREE.Vector2(D/2,0),new THREE.Vector2(0,(ridge-eave)*(D/2)/half)]);
   for(const s of [-1,1])f.add(new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false}).rotateY(Math.PI/2).translate(s*(W/2-.05)-.05,eave,0),wall);}
  // 처마 앞 고드름 같은 눈 방울
  for(let k=0;k<7;k++)f.add(lump(.12,.06,.1,i*9+k).translate(-W/2-.1+k*(W+.2)/6,eave-.02+.06,half-.02),C.snow);
  // 처마 화환(앞) + 전구
  {const pts=[];for(let k=0;k<=16;k++){const t=k/16,xx=-W/2-.2+t*(W+.4);pts.push(v(xx,eave-.12-.1*Math.sin(((t*3)%1)*Math.PI),half-.06));}
   f.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.07,6,false),C.pine);
   for(let k=0;k<12;k++){const p=pts[Math.round(k/11*16)];f.bulb(p.x,p.y-.08,p.z+.06,MARKET_BULBS[(k+i)%MARKET_BULBS.length],2.4);}
   for(const s of [-1,1])f.add(new THREE.TorusGeometry(.07,.03,6,10).rotateZ(s*.6).translate(s*(W/2+.12)+s*-.05,eave-.15,half),C.santaRed);}
  // 지붕 가장자리 전구(옆 지붕선)
  for(const s of [-1,1])for(let k=0;k<=6;k++){const t=k/6;f.bulb(s*(W/2+.27),eave+(ridge-eave)*(1-Math.abs(1-2*t))+.06,-half+t*2*half,C.warmBulb,2.2,.9);}
  // 안쪽 따뜻한 빛(뒷벽 판) + 선반
  f.glow(new THREE.PlaneGeometry(W-.4,1.05).translate(0,1.2,-D/2+.11),C.interior,1.35);
  f.add(B(W-.3,.05,.28,0,.95,-D/2+.24),C.woodDark);f.add(B(W-.3,.05,.28,0,1.45,-D/2+.24),C.woodDark);
  // 간판(앞 지붕 아래 매달림)
  f.add(B(1.3,.5,.06,0,eave+.33,half-.02),C.woodDark);
  {const g=new THREE.PlaneGeometry(1.2,.42);g.translate(0,eave+.33,half+.015);const cell=SIGN_KEYS.indexOf(kind);g.userData.cell=cell;g.applyMatrix4(f.m);signs.push(g);}
  goods(f,kind,W,D);
  // 바닥 빛(가게 앞 따뜻한 웅덩이)
  {const g=new THREE.CircleGeometry(2.3,24).rotateX(-Math.PI/2).translate(0,.04,D/2+.8);g.applyMatrix4(f.m);pools.push(g);}
  boxC(x,z,W+.2,D+.3,ry);
 });
 // 가게 물건(그림만): 선반·계산대 위 작은 형상
 function goods(f,kind,W,D){const top=.68,zc=D/2-.18,back=-D/2+.24;
  const row=(n,fn,y,zz,span=W-.6)=>{for(let k=0;k<n;k++)fn(-span/2+k*span/(n-1),y,zz,k);};
  if(kind==='cocoa'){row(5,(x,y,z,k)=>{f.add(new THREE.CylinderGeometry(.07,.06,.13,10).translate(x,y+.065,z),[C.santaRed,C.fur,C.elfGreen][k%3]);f.add(new THREE.CylinderGeometry(.06,.06,.02,10).translate(x,y+.13,z),'#6b3f26');f.add(lump(.04,.03,.04,k).translate(x,y+.14,z),C.fur);},top,zc);
   f.add(new THREE.CylinderGeometry(.16,.18,.36,12).translate(-W/2+.35,1.15,back),'#c9cfd6');f.add(new THREE.CylinderGeometry(.16,.18,.36,12).translate(W/2-.35,1.15,back),'#c9cfd6');}
  else if(kind==='cookie'){row(6,(x,y,z,k)=>{f.add(new THREE.CylinderGeometry(.09,.09,.03,12).translate(x,y+.02,z),'#c98a4a');f.add(new THREE.CylinderGeometry(.08,.08,.03,12).translate(x,y+.05,z),'#d79a58');},top,zc);
   row(4,(x,y,z,k)=>{f.add(ell(v(.07,.09,.03)).translate(x,y+.1,z),'#b8743e');f.add(ell(v(.045,.045,.03)).translate(x,y+.22,z),'#b8743e');},.98,back);}
  else if(kind==='card'){row(6,(x,y,z,k)=>f.add(B(.16,.22,.02,x,y+.11,z).rotateX(-.25),[C.santaRed,C.fur,C.elfGreen,C.ornBlue,C.gold,C.fur][k]),top,zc);
   row(5,(x,y,z,k)=>f.add(B(.18,.24,.02,x,y+.12,z),[C.ornBlue,C.santaRed,C.fur,C.elfGreen,C.gold][k]),.98,back);}
  else if(kind==='toy'){row(4,(x,y,z,k)=>{if(k%2){f.add(new THREE.CylinderGeometry(.09,.09,.14,12).translate(x,y+.07,z),C.santaRed);f.add(new THREE.CylinderGeometry(.095,.095,.02,12).translate(x,y+.14,z),C.gold);}
    else{f.add(ell(v(.09,.08,.08)).translate(x,y+.08,z),'#b8743e');f.add(ell(v(.06,.06,.06)).translate(x,y+.2,z),'#b8743e');}},top,zc);
   row(4,(x,y,z,k)=>f.add(B(.16,.16,.16,x,y+.08,z),[C.giftBox,C.santaRed,C.gold,C.ornBlue][k]),.98,back);}
  else if(kind==='ornament'){row(7,(x,y,z,k)=>f.add(new THREE.SphereGeometry(.07,10,8).translate(x,y+.07,z),[C.ornRed,C.ornGold,C.ornBlue,C.ornSilver][k%4]),top,zc);
   row(6,(x,y,z,k)=>f.add(new THREE.SphereGeometry(.06,10,8).translate(x,y+.06,z),[C.ornGold,C.ornRed,C.ornSilver,C.ornBlue][k%4]),1.48,back);}
  else if(kind==='candy'){row(6,(x,y,z,k)=>{f.add(new THREE.CylinderGeometry(.025,.025,.3,8).translate(x,y+.15,z),V=>Math.floor((V.y-y)*20)%2?C.candyStripe:C.candy);f.add(new THREE.TorusGeometry(.06,.025,6,10,Math.PI).translate(x-.06,y+.3,z),C.candyStripe);},top,zc);
   row(4,(x,y,z,k)=>f.add(new THREE.CylinderGeometry(.1,.1,.2,12).translate(x,y+.1,z),['#ffd6e8','#d8f3ff','#fff2b8','#e2ffd8'][k]),.98,back);}
  else if(kind==='scarf'){row(5,(x,y,z,k)=>f.add(B(.22,.08,.2,x,y+.04,z),[C.santaRed,C.elfGreen,C.knitCream,C.ornBlue,C.gold][k]),top,zc);
   row(5,(x,y,z,k)=>f.add(B(.12,.5,.03,x,y+.25,z),V=>Math.floor((V.y-y)*12)%2?C.fur:[C.santaRed,C.elfGreen,C.ornBlue,C.santaRed,C.elfGreen][k]),.98,back);}
 }

 // ═════ 전구 줄: 트리 꼭대기 → 가로등(광장 위를 가로지르는 줄), 가로등끼리 둘레 줄(깃발 줄 번갈아)
 const lampTop=([x,z])=>v(x,H(x,z)+2.98,z);
 const ringLamps=L.LAMPS.slice(0,8);
 {const top=v(0,8.35,0);
  for(const p of ringLamps){const q=lampTop(p),a=top.clone().lerp(q,.1);string(a,q,{sag:.55,colors:[C.warmBulb,C.whiteBulb,C.warmBulb,C.santaRed],k:2.2});}
  ringLamps.forEach((p,i)=>{const q=lampTop(p),n=lampTop(ringLamps[(i+1)%8]);const s=(i+.5)*Math.PI/4+Math.PI/8;
   // 남쪽 입구 쪽 칸(아치 위)은 비운다
   const mid=q.clone().add(n).multiplyScalar(.5);if(mid.z>15&&Math.abs(mid.x)<6)return;
   string(q.clone().setY(q.y-.1),n.clone().setY(n.y-.1),{sag:.9});if(i%2===0)bunting(q.clone().setY(q.y-.35),n.clone().setY(n.y-.35),{sag:1.1});});}
 // 노점 사이(이웃 노점 처마끼리) 낮은 줄
 for(let i=0;i<stallList.length;i++)for(let j=i+1;j<stallList.length;j++){const da=Math.abs(stallList[i][0]-stallList[j][0]);if(da>26||Math.sign(stallList[i][0])!==Math.sign(stallList[j][0]))continue;
  const P=deg=>{const a=deg*Math.PI/180,rr=STALL_R+1.2;return v(Math.sin(a)*rr,2.1,Math.cos(a)*rr);};string(P(stallList[i][0]),P(stallList[j][0]),{sag:.35});}

 // ═════ 트리 강조: 둘레 경계석 위 전구 띠 + 별 빛무리 크게
 {const n=mobile?40:64;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;bulbs.push({p:v(Math.sin(a)*3.5,.24,Math.cos(a)*3.5),c:new Color(i%2?C.warmBulb:C.santaRed),k:2.4,s:1.1,ph:r()*6.28});}
  const star=tree?.group.getObjectByName('꼭대기 별');if(star){const halo=new THREE.Mesh(new THREE.CircleGeometry(2.4,32),haloMaterial(C.star,.3));halo.position.z=-.12;halo.name='별 큰 빛무리';star.add(halo);star.scale.setScalar(1.25);}}

 // ═════ 가로등: 큰 화환 + 빨간 리본 + 매단 깃발(빨강/초록)
 L.LAMPS.forEach(([x,z],i)=>{const f=frame(x,z,Math.atan2(-x,-z));
  f.add(new THREE.TorusGeometry(.2,.08,8,16).rotateX(Math.PI/2).translate(0,2.42,0),C.pine);
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;f.add(new THREE.SphereGeometry(.04,8,6).translate(Math.cos(a)*.2,2.47,Math.sin(a)*.2),[C.ornRed,C.ornGold][k%2]);}
  for(const s of [-1,1])f.add(new THREE.TorusGeometry(.08,.03,6,10).rotateZ(s*.6).translate(s*.08,2.25,.22),C.santaRed);
  f.add(B(.04,.36,.02,-.05,2.05,.22).rotateZ(.2),C.santaRed);f.add(B(.04,.36,.02,.05,2.05,.22).rotateZ(-.2),C.santaRed);
  if(i<8){f.add(B(.03,.03,.5,0,2.0,.25),C.goldDark);const col=i%2?C.santaRed:C.elfGreen;f.add(B(.02,.62,.4,0,1.68,.32),col);f.add(B(.025,.1,.4,0,1.33,.32),C.gold);}});

 // ═════ 집: 앞 창 둘레 전구(처마 전구는 원래 있음)
 houses.forEach((h,hi)=>{h.group.updateWorldMatrix(true,false);const m=h.group.matrix;const D=3.6/2+.04;
  for(const wx of [-1.35,1.35]){const n=mobile?8:12;for(let k=0;k<n;k++){const t=k/n*4,side=Math.floor(t),u=t-side,s=.5;let px,py;
    if(side===0){px=-s+u*2*s;py=s;}else if(side===1){px=s;py=s-u*2*s;}else if(side===2){px=s-u*2*s;py=-s;}else{px=-s;py=-s+u*2*s;}
    const p=v(wx+px,1.35+py,D+.06).applyMatrix4(m);bulbs.push({p,c:new Color(MARKET_BULBS[(k+hi)%MARKET_BULBS.length]),k:2.2,s:.8,ph:r()*6.28});}}});

 // ═════ 길가 작은 장식 트리(전구·공) · 선물 더미 · 지팡이 사탕 기둥 · 눈 덮인 장식 사슴
 const miniTree=(x,z,s=1,seed=1,y)=>{const f=frame(x,z,r()*6.28,y),q=rng(seed);
  f.add(new THREE.CylinderGeometry(.08*s,.1*s,.3*s,8).translate(0,.15*s,0),C.trunk);
  for(const [y0,h,rr] of [[.25,.8,.62],[.62,.7,.48],[.95,.6,.32]])f.add(new THREE.ConeGeometry(rr*s,h*s,10).translate(0,(y0+h/2)*s,0),C.fir);
  for(const [y0,rr] of [[.4,.58],[.78,.43],[1.1,.27]])f.add(lump(rr*s*.9,.08*s,rr*s*.9,seed+y0*10).translate(0,y0*s+.04,0),C.snow);
  for(let k=0;k<14;k++){const y=.35+q()*.95,a=k*2.4,rr=(.6-.38*(y-.35)/.95)*s;const p=v(Math.sin(a)*rr,y*s,Math.cos(a)*rr);
   if(k%2)f.add(new THREE.SphereGeometry(.05*s,8,6).translate(p.x,p.y,p.z),[C.ornRed,C.ornGold,C.ornBlue][k%3]);else f.bulb(p.x*1.02,p.y,p.z*1.02,MARKET_BULBS[k%MARKET_BULBS.length],2.4,.8);}
  f.glow(new THREE.ConeGeometry(.1*s,.2*s,5).translate(0,1.62*s,0),C.star,2.4);circleC(x,z,.55*s);};
 const giftPile=(x,z,seed=1)=>{const f=frame(x,z,r()*6.28),q=rng(seed);
  [[0,0,.42,.36],[.38,.12,.3,.26],[-.3,.22,.32,.3],[.05,.02,.26,.22,.36]].forEach(([gx,gz,s,h,y=0],k)=>{const col=[C.santaRed,C.giftBox,C.gold,C.ornBlue][k],rb=[C.gold,C.fur,C.santaRed,C.gold][k];
   f.add(B(s,h,s,gx,y+h/2,gz),col);f.add(B(s*.2,h+.01,s+.01,gx,y+h/2,gz),rb);f.add(B(s+.01,h+.01,s*.2,gx,y+h/2,gz),rb);
   for(const t of [-1,1])f.add(new THREE.TorusGeometry(s*.13,s*.045,6,10).rotateZ(t*.6).translate(gx+t*s*.1,y+h+.04,gz),rb);});
  circleC(x,z,.5);};
 const cane=(x,z,h=1.5,ry=0)=>{const f=frame(x,z,ry);
  f.add(new THREE.CylinderGeometry(.07,.07,h,10,Math.round(h*10)).translate(0,h/2,0),V=>Math.floor(V.y*6+Math.atan2(V.x,V.z)/Math.PI)%2?C.candyStripe:C.candy);
  f.add(new THREE.TorusGeometry(.18,.07,8,14,Math.PI).translate(-.18,h,0),V=>Math.floor(Math.atan2(V.y-h,V.x+.18)*3)%2?C.candyStripe:C.candy);
  f.add(new THREE.TorusGeometry(.09,.035,6,10).rotateZ(.6).translate(.06,h-.25,.07),C.elfGreen);circleC(x,z,.22);};
 const deer=(x,z,ry,s=1)=>{const f=frame(x,z,ry);
  f.add(ell(v(.36*s,.22*s,.18*s)).translate(0,.72*s,0),C.deer);
  f.add(capsule(v(.28*s,.8*s,0),v(.38*s,1.08*s,0),.08*s,8),C.deer);f.add(ell(v(.14*s,.1*s,.1*s)).translate(.46*s,1.12*s,0),C.deer);
  f.glow(new THREE.SphereGeometry(.045*s,8,6).translate(.6*s,1.1*s,0),'#ff4a3a',2.6);
  for(const [lx,lz] of [[.22,.1],[.22,-.1],[-.22,.1],[-.22,-.1]])f.add(capsule(v(lx*s,.1*s,lz*s),v(lx*s*1.1,.62*s,lz*s),.032*s,8),C.deerDark);
  for(const t of [-1,1]){f.add(capsule(v(.4*s,1.18*s,t*.05*s),v(.34*s,1.45*s,t*.16*s),.022*s,6),C.antlerBand);f.add(capsule(v(.36*s,1.34*s,t*.12*s),v(.46*s,1.42*s,t*.16*s),.018*s,6),C.antlerBand);}
  f.add(lump(.3*s,.06*s,.15*s,7).translate(0,.92*s,0),C.snow);f.add(lump(.1*s,.04*s,.08*s,8).translate(.44*s,1.2*s,0),C.snow);
  f.add(new THREE.TorusGeometry(.1*s,.03*s,6,12).rotateY(Math.PI/2).rotateZ(.5).translate(.33*s,.92*s,0),C.santaRed);
  f.add(new THREE.CylinderGeometry(.42*s,.46*s,.08,14).translate(0,.04,0),C.snowPacked);circleC(x,z,.6*s);};

 // 입구 길·광장 둘레 장식 자리(놀이 자리·길을 피함)
 const E=L.ENTRANCE,KE=E.w/4.6; // KE = 입구 폭 배수(넓힌 광장 6m / 4.6m)
 miniTree(-3.9*KE,E.z+.4,1.15,3);miniTree(3.9*KE,E.z+.4,1.15,4);
 giftPile(-3.2*KE,E.z-1.3,5);giftPile(3.2*KE,E.z-1.3,6);
 deer(-5.4*KE,E.z+1.6,.5);deer(5.4*KE,E.z+1.6,Math.PI-.5);
 cane(-2.9*KE,E.z+2.6,1.35,.3);cane(2.9*KE,E.z+2.6,1.35,Math.PI-.3);
 // 노점 옆 장식 트리(이웃 노점 사이)
 [[51,9],[-51,10],[0,0]].slice(0,2).forEach(([deg,seed])=>{const a=deg*Math.PI/180;miniTree(Math.sin(a)*(STALL_R+.8),Math.cos(a)*(STALL_R+.8),.9,seed);});
 [[78,1],[-76,2],[-131,3],[131,4]].forEach(([deg,seed],k)=>{const a=deg*Math.PI/180;if(mobile&&k>1)return;giftPile(Math.sin(a)*(STALL_R+.6),Math.cos(a)*(STALL_R+.6),seed+20);});
 // 길가(광장 밖 집 앞) 작은 트리
 if(!mobile)(BIG?.pathTrees??[[-16,-13.5],[16,-13.5],[-16.5,15.5],[16.5,15.5]]).forEach(([x,z],k)=>miniTree(x,z,.85,30+k));

 // ═════ 입구 아치 강조: 바깥 큰 전구 아치 + 꼭대기 큰 별 + 기둥 전구 나선
 {const W=E.w,Hh=E.h,f=frame(E.x,E.z,0,0);
  const n=mobile?26:40;for(let i=0;i<n;i++){const t=(i+.5)/n,a=Math.PI*(1-t),p=v(Math.cos(a)*(W/2+.45),Hh+Math.sin(a)*1.35-.1,.05);f.bulb(p.x,p.y,p.z,i%2?C.warmBulb:C.whiteBulb,1.75,1);}
  const arc=[];for(let i=0;i<=24;i++){const a=Math.PI*(1-i/24);arc.push(v(Math.cos(a)*(W/2+.45),Hh+Math.sin(a)*1.35-.1,0));}
  wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),48,.03,5,false).translate(E.x,0,E.z));
  for(const s of [-1,1])for(let k=0;k<14;k++){const y=.3+k*.22,a=k*1.1;f.bulb(s*W/2+Math.sin(a)*.21,y,Math.cos(a)*.21,MARKET_BULBS[k%MARKET_BULBS.length],1.9,.75);}
  const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?.26:.6;const x=Math.sin(a)*rr,y=Math.cos(a)*rr;i?sh.lineTo(x,y):sh.moveTo(x,y);}
  f.glow(new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false}).translate(0,Hh+1.75,-.05),C.star,1.7);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(1.2,32),haloMaterial(C.star,.22));halo.position.set(E.x,Hh+1.75,E.z-.12);root.add(halo);}

 // ═════ 시안 B: 포토존(루돌프 회전목마) · 빛 터널(입구 길) · 빛 선물상자 · 장식 더
 let carousel=null;
 if(level>=2){
  // 빛 터널: 입구 길 위 전구 아치 5개(따뜻한 흰빛·금빛 번갈아)
  for(let k=0;k<3;k++){const z=E.z+2.4+k*2,R=2.6*KE,n=mobile?18:24,arc=[];
   for(let i=0;i<=n;i++){const a=Math.PI*(1-i/n);arc.push(v(Math.cos(a)*R,H(0,z)+.1+Math.sin(a)*R*1.15,z));}
   wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),n*2,.016,4,false));
   const mid=v(0,H(0,z)+.1,z);
   for(let i=1;i<n;i++)bulbs.push({p:arc[i].clone().lerp(mid,.07/R),c:new Color(k%2?C.whiteBulb:C.warmBulb),k:1.45,s:.8,ph:r()*6.28});
   for(const s of [-1,1])solid.push(paint(new THREE.CylinderGeometry(.08,.1,.25,8).translate(s*R,H(s*R,z)+.12,z),C.woodDark));}
  // 빛 선물상자(서남쪽 광장 밖, 전구 모서리 + 리본 + 위 리본 고리)
  {const x=BIG?.giftBox.x??-14.6,z=BIG?.giftBox.z??19,s=2.2,f=frame(x,z,.5);const edges=[];const c=[-1,1];
   for(const a of c)for(const b of c){edges.push([v(a*s/2,0,b*s/2),v(a*s/2,s,b*s/2)]);edges.push([v(-s/2,(a+1)/2*s,b*s/2),v(s/2,(a+1)/2*s,b*s/2)]);edges.push([v(b*s/2,(a+1)/2*s,-s/2),v(b*s/2,(a+1)/2*s,s/2)]);}
   for(const [p0,p1] of edges){const n=mobile?6:9;for(let i=0;i<=n;i++){const p=p0.clone().lerp(p1,i/n);f.bulb(p.x,p.y+.02,p.z,C.whiteBulb,2.3,.9);}
    wires.push(new THREE.TubeGeometry(new THREE.LineCurve3(f.point(p0.x,p0.y,p0.z),f.point(p1.x,p1.y,p1.z)),2,.02,4,false));}
   for(const [ax,az] of [[1,0],[0,1]]){const n=12;for(let i=0;i<=n;i++){const t=i/n;const pts=[v(-s/2*ax,s,-s/2*az),v(s/2*ax,s,s/2*az)];const p=pts[0].clone().lerp(pts[1],t);f.bulb(p.x,p.y+.03,p.z,C.santaRed,2.6,1);}
    for(const sgn of [-1,1]){const n2=10;for(let i=0;i<=n2;i++){const y=s*i/n2;f.bulb(sgn*s/2*ax+(az?0:0),y,sgn*s/2*az,C.santaRed,2.6,1);}}}
   for(const sgn of [-1,1]){const n=14;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;f.bulb(sgn*.38+Math.cos(a)*.34*sgn,s+.32+Math.sin(a)*.3,0,C.santaRed,2.8,1);}}
   f.add(new THREE.CylinderGeometry(s*.75,s*.78,.06,20).translate(0,.03,0),C.snowPacked);
   {const g=new THREE.CircleGeometry(2.8,24).rotateX(-Math.PI/2).translate(0,.05,0);g.applyMatrix4(f.m);pools.push(g);}
   circleC(x,z,1.7);}
  // 회전목마(포토존·탈 수 있음): 받침(돌지 않음)·서쪽 계단 + 도는 부분(바닥판·기둥·지붕·전구·썰매 의자 2대) + 루돌프 4마리(오르내림).
  // 자리·회전·탑승 값은 festive-layout.js CAROUSEL·CAROUSEL_SEATS(월드개발 연결용). 각도는 시각(ms)으로 계산해 모두에게 같게 보인다.
  {const {x:cx,z:cz,R,roofY:E,coneH:CH,poleR:PR}=CAROUSEL,base=frame(cx,cz,0),SW=CAROUSEL.step.w;
   base.add(new THREE.CylinderGeometry(R+.25,R+.35,.22,40).translate(0,.11,0),C.woodDark);
   // 타는 계단(서쪽, 광장·입구 길 쪽) + 양옆 짧은 기둥(전구)
   {const a=CAROUSEL.step.a;base.add(B(SW,.12,.42,0,.06,R+.52).rotateY(a),C.wood);base.add(B(SW,.03,.44,0,.135,R+.52).rotateY(a),C.snowPacked);
    for(const s of [-1,1]){const p=v(s*(SW/2+.1),0,R+.62).applyAxisAngle(Y,a);base.add(new THREE.CylinderGeometry(.05,.06,.9,8).translate(p.x,.45,p.z),V=>Math.floor(V.y*6)%2?C.gold:C.santaRed);base.bulb(p.x,.95,p.z,C.warmBulb,2.6,1.2);}
    const g=new THREE.CircleGeometry(1.2,20).rotateX(-Math.PI/2).translate(0,.05,R+1.1).rotateY(a);g.applyMatrix4(base.m);pools.push(g);}
   {const g=new THREE.CircleGeometry(R+1.9,32).rotateX(-Math.PI/2).translate(0,.05,0);g.applyMatrix4(base.m);pools.push(g);}
   // 포토존 팻말(간판 그림)
   base.add(new THREE.CylinderGeometry(.04,.05,1.6,8).translate(-2.2,.8,R+1.1).applyMatrix4(new Matrix4().makeRotationY(-.75)),C.woodDark);
   {const g=new THREE.PlaneGeometry(1.0,.5).translate(-2.2,1.55,R+1.14).applyMatrix4(new Matrix4().makeRotationY(-.75));g.userData.cell=SIGN_KEYS.indexOf('photo');g.applyMatrix4(base.m);signs.push(g);}
   const spin=new THREE.Group();spin.position.set(cx,base.y,cz);spin.name='회전목마';root.add(spin);
   const S=[],G=[],sp=(geo,col)=>S.push(paint(geo,col)),DEER=CAROUSEL_SEATS.filter(t=>t.kind==='deer');
   // 바닥판 무늬: 바깥 줄 빨강·흰 부채꼴 + 안쪽 금빛 원(안쪽 줄 썰매 자리)
   sp(new THREE.CylinderGeometry(R,R,.14,48).translate(0,.29,0),V=>Math.hypot(V.x,V.z)<CAROUSEL.sleighR+.62&&V.y>.3?C.gold:Math.floor((Math.atan2(V.x,V.z)+Math.PI)/(Math.PI/12))%2?C.santaRed:C.fur);
   sp(new THREE.CylinderGeometry(PR,PR,E+.25,16).translate(0,(E+.25)/2+.25,0),V=>Math.floor(V.y*4)%2?C.gold:C.santaRed);
   sp(new THREE.ConeGeometry(R+.35,CH,48,1,true).translate(0,E+.15+CH/2,0),V=>Math.floor((Math.atan2(V.x,V.z)+Math.PI)/(Math.PI/12))%2?C.santaRed:C.fur);
   sp(new THREE.CylinderGeometry(R+.35,R+.35,.4,48,1,true).translate(0,E,0),V=>Math.floor((Math.atan2(V.x,V.z)+Math.PI)/(Math.PI/24))%2?C.gold:C.santaRedDark);
   sp(lump(1.05,.38,1.05,3).translate(0,E+.15+CH-.15,0),C.snow);
   for(const st of CAROUSEL_SEATS.filter(t=>t.kind==='deer'))sp(new THREE.CylinderGeometry(.04,.04,E-.3,8).translate(Math.sin(st.a)*st.r,.35+(E-.3)/2,Math.cos(st.a)*st.r),V=>Math.floor(V.y*6)%2?C.gold:C.fur);
   // 썰매 의자 4대(안쪽 줄, 2명씩): 앞 = 진행 방향(+x), 폭 = 바깥 방향(+z). 좌판 윗면 = 바닥판 위 0.34m(festive-layout 자리 y 0.70)
   for(const sl of [0,1,2,3]){const a=sl*Math.PI/2,m=new Matrix4().makeRotationY(a).setPosition(Math.sin(a)*CAROUSEL.sleighR,CAROUSEL.floorY,Math.cos(a)*CAROUSEL.sleighR),put=(geo,col)=>sp(geo.applyMatrix4(m),col);
    const body=sl%2?C.elfGreen:C.santaRed;
    put(B(1.0,.16,.86,0,.14,0),body);put(B(.24,.62,.86,-.46,.37,0),body);
    for(const s of [-1,1]){put(B(.95,.36,.06,0,.36,s*.43),body);put(B(.95,.05,.08,0,.56,s*.43),C.gold);
     put(capsule(v(-.5,.04,s*.36),v(.45,.04,s*.36),.03,6),C.gold);put(new THREE.TorusGeometry(.14,.03,6,12,Math.PI*1.2).rotateZ(-.3).translate(.5,.17,s*.36),C.gold);}
    put(new THREE.TorusGeometry(.2,.06,8,14,Math.PI).rotateY(Math.PI/2).translate(.47,.46,0).scale(1,1,2.1),body);
    put(B(.42,.1,.8,-.1,.29,0),C.fur);put(B(.1,.38,.8,-.33,.52,0),C.fur);
    put(B(.04,.05,.88,-.46,.7,0),C.gold);}
   const nB=mobile?28:44;for(let k=0;k<nB;k++){const a=k/nB*Math.PI*2;G.push({p:v(Math.sin(a)*(R+.37),E-.15,Math.cos(a)*(R+.37)),c:new Color(k%2?C.warmBulb:C.whiteBulb)});}
   for(let k=0;k<24;k++){const a=k/24*Math.PI*2;for(let j=1;j<5;j++){const t=j/5;G.push({p:v(Math.sin(a)*(R+.35)*(1-t),E+.15+CH*t,Math.cos(a)*(R+.35)*(1-t)),c:new Color(C.warmBulb)});}}
   const platform=new THREE.Mesh(mergeGeometries(S),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));platform.name='회전목마 몸';tz(platform,{kind:'prop'});platform.castShadow=!mobile;spin.add(platform);
   const top=new THREE.Mesh(new THREE.ExtrudeGeometry((()=>{const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?.16:.38;const x=Math.sin(a)*rr,y=Math.cos(a)*rr;i?sh.lineTo(x,y):sh.moveTo(x,y);}return sh;})(),{depth:.08,bevelEnabled:false}).scale(1.25,1.25,1).translate(0,E+.15+CH+.4,-.04),new THREE.MeshBasicMaterial({color:new Color(C.star).multiplyScalar(2.6)}));spin.add(top);
   const cb=new THREE.InstancedMesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:'#ffffff'}),G.length);cb.name='회전목마 전구';
   G.forEach((b,i)=>{cb.setMatrixAt(i,M.makeTranslation(b.p.x,b.p.y,b.p.z));cb.setColorAt(i,b.c.clone().multiplyScalar(2.4));});spin.add(cb);
   // 루돌프(빨간 코) 한 형상 × 8 InstancedMesh. 머리 = +x = 진행 방향, 안장 윗면 = 몸 중심 + 0.217m
   const RD=[];const rp=(geo,col)=>RD.push(paint(geo,col));const s=.85;
   rp(ell(v(.42*s,.24*s,.2*s)).translate(0,0,0),C.deer);rp(capsule(v(.3*s,.08*s,0),v(.42*s,.38*s,0),.1*s,8),C.deer);rp(ell(v(.16*s,.12*s,.11*s)).translate(.52*s,.44*s,0),C.deer);
   rp(new THREE.SphereGeometry(.06*s,8,6).translate(.68*s,.42*s,0),'#ff3b30');
   for(const [lx,lz] of [[.26,.12],[.26,-.12],[-.26,.12],[-.26,-.12]])rp(capsule(v(lx*s,-.1*s,lz*s),v(lx*s+.12*s*Math.sign(lx),-.45*s,lz*s),.05*s,6),C.deerDark);
   for(const t of [-1,1]){rp(capsule(v(.46*s,.54*s,t*.05*s),v(.4*s,.82*s,t*.18*s),.025*s,6),C.antlerBand);rp(capsule(v(.42*s,.7*s,t*.13*s),v(.53*s,.78*s,t*.18*s),.02*s,6),C.antlerBand);}
   rp(B(.36*s,.05*s,.3*s,-.02,.23*s,0),C.santaRed);rp(B(.36*s,.08*s,.02*s,-.02,.12*s,.16*s),C.gold);rp(B(.36*s,.08*s,.02*s,-.02,.12*s,-.16*s),C.gold);
   // 발걸이(안장 양옆 금색 고리)
   for(const t of [-1,1])rp(new THREE.TorusGeometry(.05,.012,5,10).translate(-.02,-.06*s,t*.2*s),C.gold);
   const deers=new THREE.InstancedMesh(mergeGeometries(RD),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),DEER.length);deers.name='회전목마 루돌프';tz(deers,{kind:'prop'});deers.castShadow=!mobile;deers.frustumCulled=false;spin.add(deers);
   circleC(cx,cz,CAROUSEL.baseR);
   const Q=new THREE.Quaternion(),P=v(),SC=v(1,1,1);
   // seatPose(k) = 지금 그려진 각도의 자리 k(0~7 루돌프, 8~15 썰매 의자) 세계 자세 — 월드개발 carousel-play가 먼저 찾아 쓰는 손잡이
   let lastMs=Date.now();
   carousel={spin,deers,R,center:{x:cx,z:cz},seats:CAROUSEL_SEATS.length,seatPose:k=>carouselSeatAt(k,lastMs,base.y),update(ms){lastMs=ms;spin.rotation.y=carouselSpin(ms);DEER.forEach((st,k)=>{Q.setFromAxisAngle(Y,st.a);P.set(Math.sin(st.a)*st.r,CAROUSEL.deerY+deerBob(ms,st.deer),Math.cos(st.a)*st.r);deers.setMatrixAt(k,M.compose(P,Q,SC));});deers.instanceMatrix.needsUpdate=true;}};
   carousel.update(Date.now());}
  station();
  // 아이스링크(광장 남서쪽 밖): 평평한 얼음 판·흰 울타리(빨간 위 손잡이)·기둥 전구 줄·동쪽 문 아치 + 「스케이트」 간판·가운데 섬 트리·펭귄 보조 기구·밖 벤치와 스케이트
  rink();
  // 장식 더: 노점 앞 지팡이 사탕 쌍, 마당 가는 길 작은 트리, 광장 안 선물 더미
  STALLS.slice(0,mobile?5:7).forEach(([deg],k)=>{const a=deg*Math.PI/180,o=1.75;for(const s of [-1,1]){const aa=a+s*(STALL_W/2+.4)/STALL_R;cane(Math.sin(aa)*(STALL_R+.9),Math.cos(aa)*(STALL_R+.9),1.1,aa);}});
  if(!mobile)(BIG?.yardTrees??[[-22,-1],[22,-.5],[-8,-16.8],[8,-16.8]]).forEach(([x,z],k)=>miniTree(x,z,1,50+k));
 }

 // ═════ 루돌프 썰매 정류장(시안 B, 11-18 설계 v2): 자리는 festive-layout.js REINDEER_STATION. 기다리는 썰매는 아래 하늘 썰매(sky-sleigh.js)의 첫 대.
 // 그림: 썰매 옆 금빛 원(빛 띠 + 둘레 낮은 전구 12개 + 가운데 별) · 지붕 달린 나무 표지판(「루돌프 썰매 정류장」 간판 + 처마 전구 + 방울) · 건초 더미 + 당근 먹이통
 function station(){const S=REINDEER_STATION,f=frame(S.x,S.z,S.heading),R=S.ring;
  // 금빛 원: 빛나는 고리(얼음·눈 위 2cm) + 안쪽 은은한 빛 웅덩이 + 둘레 전구(땅에 꽂은 짧은 말뚝 위)
  // 땅에 붙인 판: 놓은 뒤 꼭짓점마다 땅 높이 + lift로 올린다(정류장 자리가 조금 기울어 평평한 판이면 눈 바닥과 겹쳐 휴대폰에서 줄무늬가 생김)
  const onGround=(geo,lift)=>{geo.applyMatrix4(f.m);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,H(p.getX(i),p.getZ(i))+lift);geo.computeVertexNormals();return geo;};
  world.glow(onGround(new THREE.RingGeometry(R-.12,R,48,2).rotateX(-Math.PI/2),.07),C.gold,1.5);
  world.glow(onGround(new THREE.RingGeometry(R-.42,R-.36,48,1).rotateX(-Math.PI/2),.07),C.gold,1.05);
  pools.push(onGround(new THREE.RingGeometry(0,R+.6,32,4).rotateX(-Math.PI/2),.06));
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,x=Math.sin(a)*(R+.12),z=Math.cos(a)*(R+.12);f.add(new THREE.CylinderGeometry(.025,.03,.16,6).translate(x,.08,z),C.woodDark);f.bulb(x,.2,z,k%2?C.warmBulb:C.santaRed,2.3,.9);}
  // 바닥 별 무늬(원 가운데, 금빛 5갈래 — 「여기서 타요」 표시)
  {const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?.22:.52;i?sh.lineTo(Math.sin(a)*rr,Math.cos(a)*rr):sh.moveTo(Math.sin(a)*rr,Math.cos(a)*rr);}
   world.glow(onGround(new THREE.ShapeGeometry(sh).rotateX(-Math.PI/2).translate(-.55,0,-.45),.075),C.gold,1.2);}
  // 표지판: 기둥 2 + 판 + 작은 박공지붕(눈) + 처마 전구 + 금방울
  const sx=S.sign.x,sz=S.sign.z,sg=frame(sx,sz,S.heading),SW=1.5,SH=1.75;
  for(const s of [-1,1])sg.add(new THREE.CylinderGeometry(.05,.06,SH+.35,8).translate(s*SW/2,(SH+.35)/2,0),C.woodDark);
  sg.add(B(SW+.12,.62,.07,0,SH-.18,0),C.woodDark);
  {const g=new THREE.PlaneGeometry(SW,.54).rotateY(Math.PI).translate(0,SH-.18,-.04);g.userData.cell=SIGN_KEYS.indexOf('reindeer');g.applyMatrix4(sg.m);signs.push(g);}
  {const g=new THREE.PlaneGeometry(SW,.54).translate(0,SH-.18,.04);g.userData.cell=SIGN_KEYS.indexOf('reindeer');g.applyMatrix4(sg.m);signs.push(g);}
  for(const s of [-1,1]){sg.add(B(SW+.5,.06,.5,0,0,0).rotateX(s*.55).translate(0,SH+.28,s*.13),C.santaRed);sg.add(B(SW+.54,.07,.46,0,.05,0).rotateX(s*.55).translate(0,SH+.28,s*.13),C.snow);}
  for(let k=0;k<8;k++){const x=-SW/2-.2+k*(SW+.4)/7;for(const s of [-1,1])sg.bulb(x,SH+.1,s*.25,MARKET_BULBS[(k+(s>0?3:0))%MARKET_BULBS.length],2.3,.8);}
  for(const s of [-1,1]){sg.add(new THREE.SphereGeometry(.06,10,8).translate(s*(SW/2+.02),SH-.62,-.06),C.gold);sg.add(new THREE.TorusGeometry(.07,.025,6,10).translate(s*(SW/2+.02),SH-.5,-.06),C.santaRed);}
  boxC(sx,sz,SW+.3,.4,S.heading);
  // 건초 더미(둥근 원통 두 덩이) + 당근 먹이통
  const hf=frame(S.hay.x,S.hay.z,S.heading+.6),straw='#e6c36a',strawDark='#c9a14a';
  // 옆으로 누운 둥근 건초 두 덩이 + 그 위에 한 덩이(마구리는 진하게, 빨간 끈 두 줄)
  const bale=(x,y,z,r,len)=>{hf.add(new THREE.CylinderGeometry(r,r,len,14).rotateZ(Math.PI/2).translate(x,y,z),V=>Math.abs(V.x-x)>len/2-.03?strawDark:Math.floor((Math.atan2(V.y-y,V.z-z)+3.2)*4)%2?straw:'#dcb65e');
   for(const t of [-1,1])hf.add(new THREE.TorusGeometry(r+.005,.012,4,16).rotateY(Math.PI/2).translate(x+t*len*.25,y,z),C.santaRed);};
  bale(0,.27,-.29,.27,.55);bale(0,.27,.29,.27,.55);bale(0,.73,0,.25,.5);hf.add(lump(.24,.05,.2,91).translate(0,.98,0),C.snow);
  hf.add(B(.62,.2,.32,.0,.12,.86),C.wood);hf.add(B(.56,.04,.26,0,.23,.86),C.woodDark);
  for(let k=0;k<5;k++){const x=-.2+k*.1;hf.add(new THREE.ConeGeometry(.025,.16,6).rotateZ(Math.PI/2+.4-k*.2).translate(x,.27,.86+(k%2?.05:-.04)),C.carrot);hf.add(new THREE.ConeGeometry(.02,.05,5).translate(x-.07,.29,.86),C.pine);}
  circleC(S.hay.x,S.hay.z,.7);
  // 기다리는 썰매 자리(충돌: 썰매·루돌프 둘 = 설계 §4 판정 원 둘)
  {const W=S.sleigh,fx=-Math.sin(W.heading),fz=-Math.cos(W.heading);circleC(W.x,W.z,SLEIGH.hit.r);circleC(W.x+fx*SLEIGH.tow,W.z+fz*SLEIGH.tow,SLEIGH.hit.r*.9);}
 }

 // ═════ 아이스링크(시안 B): 자리·크기·문은 festive-layout.js RINK. 얼음은 꼭짓점 색(새 재질·조명 없음) + 바닥 빛 판으로 불빛 비침.
 function rink(){const {x:rx,z:rz,w,d,corner:cr,iceY,board}=RINK,hw=w/2,hd=d/2,f=frame(rx,rz,0,0);
  // 둥근 직사각형 둘레 점(시계 반대, 간격 약 step m)
  const outline=(m,step)=>{const pts=[],hx=hw+m,hz=hd+m,c=cr+m,seg=(a,b)=>{const n=Math.max(1,Math.round(a.distanceTo(b)/step));for(let i=0;i<n;i++)pts.push(a.clone().lerp(b,i/n));},
    arc=(cx,cz,a0)=>{const n=Math.max(2,Math.round(c*Math.PI/2/step));for(let i=0;i<n;i++){const a=a0+i/n*Math.PI/2;pts.push(v(cx+Math.cos(a)*c,0,cz+Math.sin(a)*c));}};
   seg(v(hx,0,-hz+c),v(hx,0,hz-c));arc(hx-c,hz-c,0);seg(v(hx-c,0,hz),v(-hx+c,0,hz));arc(-hx+c,hz-c,Math.PI/2);seg(v(-hx,0,hz-c),v(-hx,0,-hz+c));arc(-hx+c,-hz+c,Math.PI);seg(v(-hx+c,0,-hz),v(hx-c,0,-hz));arc(hx-c,-hz+c,Math.PI*1.5);
   return pts;};
  // 둥근 직사각형 안으로 당기기(얼음 판 꼭짓점)
  const clamp=(x,z)=>{const sx=Math.sign(x)||1,sz=Math.sign(z)||1;let ax=Math.min(Math.abs(x),hw),az=Math.min(Math.abs(z),hd);const cx=ax-(hw-cr),cz=az-(hd-cr);
   if(cx>0&&cz>0){const l=Math.hypot(cx,cz);if(l>cr){ax=hw-cr+cx/l*cr;az=hd-cr+cz/l*cr;}}return [ax*sx,az*sz];};
  // 얼음 판: 윗면(촘촘한 격자 → 색 무늬) + 옆면(얼음 아래 굵은 판, 땅 굴곡에 묻힘)
  {const g=new THREE.PlaneGeometry(w,d,mobile?40:60,mobile?26:38).rotateX(-Math.PI/2),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const [x,z]=clamp(p.getX(i),p.getZ(i));p.setXYZ(i,x,iceY,z);}g.computeVertexNormals();
   const q=rng(77),marks=Array.from({length:9},()=>({e:.25+q()*.68,k:2+q()*3,ph:q()*6.28,a:.5+q()*.5}));
   const iceA=new Color('#bfe2f4'),iceB=new Color('#e9f7ff'),iceC=new Color('#9fcde8'),cc=new Color();
   f.add(g,V=>{const lx=V.x,lz=V.z,e=Math.hypot(lx/hw,lz/hd),ang=Math.atan2(lz,lx);
    // 스케이트 자국: 섬 둘레 타원 고리 몇 줄(군데군데 끊김) + 가장자리 쪽 살짝 진함 + 가운데 넓은 하늘빛 반사
    let t=0;for(const m of marks){const dd=Math.abs(e-m.e);if(dd<.018&&Math.sin(ang*m.k+m.ph)>-.2)t=Math.max(t,m.a*(1-dd/.018));}
    cc.copy(iceA).lerp(iceC,Math.min(1,Math.max(0,(e-.75)*2.4))).lerp(iceB,Math.max(0,.55-Math.hypot(lx/hw+.15,lz/hd+.2))*.9).lerp(iceB,t*.8);return '#'+cc.getHexString();});
   const sh=new THREE.Shape(outline(-.02,.4).map(p=>new THREE.Vector2(p.x,-p.z)));
   f.add(new THREE.ExtrudeGeometry(sh,{depth:iceY+.1,bevelEnabled:false,curveSegments:4}).rotateX(-Math.PI/2).translate(0,-.12,0),'#9cc3dc');}
  // 울타리(보드): 흰 판 + 아래 파란 띠 + 위 빨간 손잡이. 문(동쪽 가운데)은 비우고 문짝 따로
  const ring=outline(.06,.5),gateAt=p=>p.x>hw-.2&&Math.abs(p.z)<RINK.gate.w/2,top=iceY+board,bottom=-.05;
  ring.forEach((a,i)=>{const b=ring[(i+1)%ring.length],m=a.clone().add(b).multiplyScalar(.5);if(gateAt(m))return;
   const len=a.distanceTo(b)+.02,ry=Math.atan2(b.x-a.x,b.z-a.z);
   const panel=(h0,h1,t,col)=>{const geo=B(.07*t,h1-h0,len,0,(h0+h1)/2,0).rotateY(ry).translate(m.x,0,m.z);f.add(geo,col);};
   panel(bottom,top,1,'#f6f3ec');panel(iceY+.04,iceY+.12,1.15,C.ornBlue);
   f.add(capsule(v(a.x,top+.02,a.z),v(b.x,top+.02,b.z),.045,6),C.santaRed);});
  // 기둥 + 전구 줄(울타리 위로 늘어진 줄)
  const posts=outline(.06,1.9).filter(p=>!gateAt(p)&&!(p.x>hw-.2&&Math.abs(p.z)<RINK.gate.w/2+.7)),PH=1.5;
  posts.forEach(p=>{f.add(new THREE.CylinderGeometry(.05,.06,PH+iceY,8).translate(p.x,(PH+iceY)/2,p.z),V=>Math.floor(V.y*5)%2?C.santaRed:C.fur);f.add(new THREE.SphereGeometry(.08,10,8).translate(p.x,PH+iceY+.06,p.z),C.gold);});
  const wp=p=>f.point(p.x,PH+iceY-.05,p.z);
  for(let i=0;i<posts.length;i++){const a=posts[i],b=posts[(i+1)%posts.length];if(a.distanceTo(b)>4)continue;string(wp(a),wp(b),{sag:.28,colors:[C.whiteBulb,C.ornBlue,C.whiteBulb,C.warmBulb]});}
  // 문: 아치(기둥 2 + 휜 들보) + 「스케이트」 간판 + 아치 전구, 닫힌 문짝 2장(빨간 테 + 화환)
  {const gx=hw+.06,gw=RINK.gate.w,AH=2.25+iceY;
   for(const s of [-1,1]){f.add(B(.16,AH,.16,gx,AH/2,s*(gw/2+.12)),C.woodLight);f.add(lump(.14,.06,.14,s+40).translate(gx,AH+.04,s*(gw/2+.12)),C.snow);}
   const arc=[];for(let i=0;i<=16;i++){const t=i/16,zz=-(gw/2+.12)+t*(gw+.24);arc.push(v(gx,AH+.32*Math.sin(t*Math.PI),zz));}
   f.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),24,.07,6,false),C.woodLight);
   for(let i=1;i<16;i++)f.bulb(arc[i].x+.08,arc[i].y+.04,arc[i].z,i%2?C.whiteBulb:C.ornBlue,2.4,.9);
   f.add(B(.06,.5,1.4,gx+.02,AH-.12,0),C.woodDark);
   {const g=new THREE.PlaneGeometry(1.3,.42).rotateY(Math.PI/2).translate(gx+.06,AH-.12,0);g.userData.cell=SIGN_KEYS.indexOf('skate');g.applyMatrix4(f.m);signs.push(g);}
   for(const s of [-1,1]){f.add(B(.06,board+iceY-.05,gw/2-.04,gx,(board+iceY)/2,s*gw/4),'#f6f3ec');f.add(B(.08,.08,gw/2-.04,gx,board+iceY-.02,s*gw/4),C.santaRed);}
   f.add(new THREE.TorusGeometry(.17,.06,8,16).rotateY(Math.PI/2).translate(gx+.07,iceY+.25,0),C.pine);f.add(new THREE.SphereGeometry(.04,8,6).translate(gx+.12,iceY+.1,0),C.santaRed);
   {const g=new THREE.CircleGeometry(1.6,20).rotateX(-Math.PI/2).translate(gx+1.2,.05,0);g.applyMatrix4(f.m);pools.push(g);}}
  // 가운데 섬: 눈 둔덕 + 작은 장식 트리
  {const I=RINK.island;f.add(new THREE.CylinderGeometry(I.r,I.r+.08,.16,20).translate(I.x-rx,iceY+.06,I.z-rz),C.snowPacked);f.add(lump(I.r*.9,.12,I.r*.9,61).translate(I.x-rx,iceY+.14,I.z-rz),C.snow);
   miniTree(I.x,I.z,1.25*I.r/.75,62,iceY+.12);}
  // 얼음 위 불빛 비침(바닥 빛 판, 얼음 위 1cm): 기둥 아래·섬 둘레
  for(const p of posts){const k=.82,g=new THREE.CircleGeometry(.9,16).rotateX(-Math.PI/2).scale(1,1,1.6).translate(p.x*k,iceY+.012,p.z*k);g.applyMatrix4(f.m);pools.push(g);}
  {const g=new THREE.RingGeometry(RINK.island.r+.1,RINK.island.r+1.2,24).rotateX(-Math.PI/2).translate(RINK.island.x-rx,iceY+.012,RINK.island.z-rz);g.applyMatrix4(f.m);pools.push(g);}
  // 펭귄 보조 기구(얼음 위, 손잡이 달린 펭귄) — 자리는 festive-layout RINK.penguins
  const penguin=(px,pz,ry)=>{const m=new Matrix4().makeRotationY(ry).setPosition(px-rx,iceY,pz-rz),put=(geo,col)=>f.add(geo.applyMatrix4(m),col);
   put(ell(v(.2,.27,.18)).translate(0,.3,0),'#2b3140');put(ell(v(.14,.2,.06)).translate(0,.28,.13),'#f6f3ec');put(ell(v(.14,.13,.13)).translate(0,.62,0),'#2b3140');
   put(ell(v(.1,.08,.04)).translate(0,.61,.1),'#f6f3ec');put(new THREE.ConeGeometry(.035,.09,8).rotateX(Math.PI/2).translate(0,.6,.17),'#f2a33a');
   for(const s of [-1,1]){put(new THREE.SphereGeometry(.018,6,5).translate(s*.05,.65,.12),'#16181d');put(ell(v(.05,.02,.08)).translate(s*.08,.02,.06),'#f2a33a');put(ell(v(.04,.14,.07)).rotateZ(s*.5).translate(s*.2,.33,0),'#2b3140');}
   put(new THREE.TorusGeometry(.12,.035,6,12).rotateX(Math.PI/2).translate(0,.47,0),C.santaRed);
   for(const s of [-1,1])put(capsule(v(s*.16,.45,-.08),v(s*.16,.82,-.32),.022,6),C.santaRed);put(capsule(v(-.18,.82,-.32),v(.18,.82,-.32),.026,6),C.gold);};
  for(const [px,pz,ry] of RINK.penguins)penguin(px,pz,ry);
  // 밖: 벤치 + 스케이트 한 켤레(문 남쪽), 문 북쪽 작은 트리
  {const bx=rx+hw+1.1,bz=rz+2.4,b=frame(bx,bz,-Math.PI/2);
   b.add(B(1.3,.06,.38,0,.34,0),C.woodLight);b.add(B(1.3,.32,.05,0,.6,-.17),C.woodLight);for(const s of [-1,1]){b.add(B(.06,.34,.34,s*.58,.17,0),C.woodDark);}
   b.add(lump(.5,.05,.16,71).translate(-.2,.4,0),C.snow);
   for(const s of [-1,1]){b.add(B(.09,.12,.22,.32+s*.07,.43,.02),'#f6f3ec');b.add(B(.02,.02,.26,.32+s*.07,.36,.02),'#c9cfd6');}
   circleC(bx,bz,.75);}
  miniTree(rx+hw+1.2,rz-2.6,.95,73);
  // 충돌: 둥근 직사각형 = 상자 2 + 모서리 원 4(울타리 두께 +0.1)
  const m=.1;boxC(rx,rz,w+2*m,d-2*cr,0);boxC(rx,rz,w-2*cr,d+2*m,0);
  for(const sx of [-1,1])for(const sz of [-1,1])circleC(rx+sx*(hw-cr),rz+sz*(hd-cr),cr+m);
 }

 // ═════ 합치기
 const vc=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 const body=new THREE.Mesh(mergeGeometries(solid),vc);body.name='마켓 소품';tz(body,{kind:'prop'});body.castShadow=!mobile;body.receiveShadow=true;root.add(body);
 const glowMesh=new THREE.Mesh(mergeGeometries(glowGeo),new THREE.MeshBasicMaterial({vertexColors:true}));glowMesh.name='마켓 불빛 면';glowMesh.userData.line=0;root.add(glowMesh);
 const wireMesh=new THREE.Mesh(mergeGeometries(wires.map(g=>{g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;})),new THREE.MeshBasicMaterial({color:'#1d2a24'}));wireMesh.name='전구 전선';root.add(wireMesh);
 // 전구: 구 하나 × n, 색은 HDR(블룸). 반짝임은 색만 바꾼다(20번/초).
 const bulbMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,8,6).scale(1,1.25,1),new THREE.MeshBasicMaterial({color:'#ffffff'}),bulbs.length);bulbMesh.name='마켓 전구';bulbMesh.frustumCulled=false;
 // 휴대폰은 블룸이 반 해상도라 밝은 점이 많으면 네모 번짐이 생긴다 → 전구 세기를 낮춘다
 if(mobile)for(const b of bulbs)b.k*=.68;
bulbs.forEach((b,i)=>{bulbMesh.setMatrixAt(i,M.makeScale(b.s,b.s,b.s).setPosition(b.p));bulbMesh.setColorAt(i,tmp.copy(b.c).multiplyScalar(b.k));});root.add(bulbMesh);
 // 간판: 캔버스 한 장(칸마다 그림+글자), 판마다 UV를 그 칸으로
 const signMesh=signs.length?(()=>{const tex=signAtlas();const list=signs.map(g=>{const cell=g.userData.cell,uv=g.attributes.uv,cols=4,rows=Math.ceil(SIGN_KEYS.length/4),cx=cell%cols,cy=Math.floor(cell/cols);
   for(let i=0;i<uv.count;i++)uv.setXY(i,(cx+uv.getX(i))/cols,1-(cy+1-uv.getY(i))/rows);return g;});
  const m=new THREE.Mesh(mergeGeometries(list),new THREE.MeshBasicMaterial({map:tex,color:new Color(1.15,1.12,1.05)}));m.name='노점 간판';m.userData.textPlane=true;root.add(m);return m;})():null;
 const poolMesh=new THREE.Mesh(mergeGeometries(pools),groundGlowMaterial('#ffbf6a',.34));poolMesh.name='노점 바닥 빛';poolMesh.renderOrder=2;root.add(poolMesh);

 // ═════ 하늘 썰매(시안 B): 그리기 7번으로 정류장 썰매 + 탄 사람 썰매(정원 30) 모두(루돌프 5 + 썰매 1 + 끈 1). 별 흔적은 점 묶음 하나(그리기 1번).
 // 월드개발: festive.skySleigh.fleet.spawn()으로 탈 썰매를 받고, 별은 festive.skySleigh.stars.emitter()로 흔적을 단다(sky-sleigh.js·star-trail.js 머리말).
 let skySleigh=null;
 if(level>=2){const fleet=createSkySleighFleet({toon:{toonify:(m,o)=>tz(m,o)},max:31,mobile,heightAt:H,parent:root});
  const S=REINDEER_STATION,waiting=fleet.spawn().place(S.sleigh.x,0,S.sleigh.z,S.sleigh.heading);waiting.mode='stand';
  const stars=createStarTrail({mobile});root.add(stars.points);
  skySleigh={fleet,stars,station:S,waiting};}

 // ═════ 스케이트(시안 B 링크): 날·자세·날 자국·얼음 가루 그림(skate-art.js). 월드개발 rink-play.js가 wear·pose·drawFx로 부른다.
 const skate=level>=2?createSkateArt({world:root,iceY:RINK.iceY,mobile}):null;

 // ═════ 눈 위 반짝임: 땅에 흩은 작은 점이 제각각 깜빡인다(점 하나 = 그리기 1번)
 const glints=(()=>{const n=mobile?700:1600,pos=new Float32Array(n*3),ph=new Float32Array(n);for(let i=0;i<n;i++){const a=r()*6.28,d=3.8+Math.sqrt(r())*36,x=Math.sin(a)*d,z=Math.cos(a)*d;pos.set([x,H(x,z)+.05,z],i*3);ph[i]=r()*100;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('ph',new THREE.BufferAttribute(ph,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uS:{value:mobile?7:9}},
   vertexShader:'attribute float ph;uniform float uT;uniform float uS;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float s=pow(max(0.,sin(uT*1.7+ph*6.283)),12.);vA=s;gl_PointSize=uS*s*clamp(18./-mv.z,.25,1.6);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying float vA;void main(){vec2 d=abs(gl_PointCoord-.5)*2.;float a=max(0.,1.-d.x*6.)*max(0.,1.-d.y)+max(0.,1.-d.y*6.)*max(0.,1.-d.x);a=max(a,max(0.,1.-length(d))*.8);gl_FragColor=vec4(vec3(1.4,1.45,1.6)*a*vA,0.);}'});
  const p=new THREE.Points(g,m);p.name='눈 반짝임';p.frustumCulled=false;root.add(p);return m;})();

 let acc=0;
 return {group:root,bulbs:bulbMesh,count:{bulbs:bulbs.length,stalls:stallList.length},carousel,skySleigh,skate,
  // 노점 앞 자리(계산대 앞 1.4m, 노점을 봄) — 미리보기 30명 장면용
  stalls:stallList.map(([deg,kind])=>{const a=deg*Math.PI/180,rr=STALL_R-STALL_D/2-1.4;return {kind,x:Math.sin(a)*rr,z:Math.cos(a)*rr,heading:Math.atan2(Math.sin(a),Math.cos(a))};}),
  // view = {camera, viewHeight}: 별 크기(화면 높이 기준)를 맞춘다(없으면 지난 값)
  update(dt,t,ms=Date.now(),view=null){glints.uniforms.uT.value=t;carousel?.update(ms);
   if(skySleigh){skySleigh.fleet.update(dt);skySleigh.stars.update(dt,view?.camera,view?.viewHeight);}
   acc+=dt;if(acc<.05)return;acc=0;
   // 전구 반짝임: 대부분은 은은히 숨쉬고, 일부(7개 중 1개)는 또렷이 깜빡인다
   for(let i=0;i<bulbs.length;i++){const b=bulbs[i],w=i%7===0?(Math.sin(t*4+b.ph)>.2?1.1:.35):.82+.18*Math.sin(t*1.8+b.ph);bulbMesh.setColorAt(i,tmp.copy(b.c).multiplyScalar(b.k*w));}
   bulbMesh.instanceColor.needsUpdate=true;},
 };
}

// 간판 그림(4×2칸, 칸마다 256×128): 나무 판 + 코드로 그린 작은 그림 + 글자. 외부 이미지·이모지 글꼴을 쓰지 않는다.
function signAtlas(){
 const cw=256,ch=128,c=document.createElement('canvas');c.width=cw*4;c.height=ch*Math.ceil(SIGN_KEYS.length/4);const g=c.getContext('2d');
 const draw={
  cocoa(x,y){g.fillStyle='#e8e2d6';g.beginPath();g.roundRect(x-18,y-14,36,34,6);g.fill();g.strokeStyle='#e8e2d6';g.lineWidth=6;g.beginPath();g.arc(x+20,y+2,9,-1.4,1.4);g.stroke();g.fillStyle='#6b3f26';g.fillRect(x-14,y-12,28,7);
   g.strokeStyle='#fff';g.lineWidth=3;for(const dx of [-7,5]){g.beginPath();g.moveTo(x+dx,y-20);g.bezierCurveTo(x+dx-6,y-28,x+dx+6,y-32,x+dx,y-40);g.stroke();}},
  cookie(x,y){g.fillStyle='#c98a4a';g.beginPath();g.arc(x,y-16,11,0,7);g.fill();g.beginPath();g.ellipse(x,y+6,15,16,0,0,7);g.fill();g.fillRect(x-26,y-4,52,10);
   g.fillStyle='#fff';for(const [dx,dy] of [[-4,-18],[4,-18],[0,0],[0,9]]){g.beginPath();g.arc(x+dx,y+dy,2.4,0,7);g.fill();}},
  card(x,y){g.fillStyle='#f4efe4';g.fillRect(x-24,y-18,48,34);g.strokeStyle='#d23b36';g.lineWidth=3;g.beginPath();g.moveTo(x-24,y-18);g.lineTo(x,y);g.lineTo(x+24,y-18);g.stroke();g.fillStyle='#d23b36';g.beginPath();g.arc(x,y+2,5,0,7);g.fill();},
  toy(x,y){g.fillStyle='#b8743e';g.beginPath();g.arc(x,y-14,12,0,7);g.fill();g.beginPath();g.arc(x-10,y-25,5,0,7);g.arc(x+10,y-25,5,0,7);g.fill();g.beginPath();g.ellipse(x,y+8,14,13,0,0,7);g.fill();
   g.fillStyle='#2b2a2e';g.beginPath();g.arc(x-4,y-15,1.8,0,7);g.arc(x+4,y-15,1.8,0,7);g.fill();g.fillStyle='#d23b36';g.fillRect(x-9,y-3,18,4);},
  ornament(x,y){g.fillStyle='#e0473f';g.beginPath();g.arc(x,y+2,17,0,7);g.fill();g.fillStyle='#efc04f';g.fillRect(x-6,y-21,12,7);g.strokeStyle='#efc04f';g.lineWidth=2;g.beginPath();g.arc(x,y-25,4,0,7);g.stroke();
   g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(x-6,y-4,4,0,7);g.fill();},
  candy(x,y){g.lineCap='round';g.lineWidth=9;g.strokeStyle='#f4f1ea';g.beginPath();g.moveTo(x+6,y+22);g.lineTo(x+6,y-10);g.arc(x-4,y-10,10,0,Math.PI,true);g.stroke();
   g.strokeStyle='#e0473f';g.lineWidth=9;g.setLineDash([5,7]);g.beginPath();g.moveTo(x+6,y+22);g.lineTo(x+6,y-10);g.arc(x-4,y-10,10,0,Math.PI,true);g.stroke();g.setLineDash([]);},
  scarf(x,y){g.fillStyle='#d23b36';g.beginPath();g.roundRect(x-22,y-18,44,12,5);g.fill();g.fillRect(x+6,y-8,11,30);g.fillStyle='#f7f2e8';for(let k=0;k<3;k++)g.fillRect(x+6,y-2+k*8,11,3);},
  skate(x,y){g.fillStyle='#f6f3ec';g.beginPath();g.moveTo(x-20,y-24);g.lineTo(x-4,y-24);g.lineTo(x-4,y-2);g.lineTo(x+18,y+4);g.quadraticCurveTo(x+22,y+10,x+16,y+12);g.lineTo(x-20,y+12);g.closePath();g.fill();
   g.strokeStyle='#cfe6ff';g.lineWidth=4;g.beginPath();g.moveTo(x-24,y+20);g.lineTo(x+20,y+20);g.quadraticCurveTo(x+28,y+20,x+28,y+13);g.stroke();g.strokeStyle='#d23b36';g.lineWidth=3;g.beginPath();g.moveTo(x-16,y-14);g.lineTo(x-8,y-10);g.moveTo(x-16,y-7);g.lineTo(x-8,y-3);g.stroke();},
  reindeer(x,y){g.strokeStyle='#e2c08a';g.lineWidth=5;g.lineCap='round';for(const s of [-1,1]){g.beginPath();g.moveTo(x+s*9,y-14);g.lineTo(x+s*18,y-36);g.moveTo(x+s*13,y-24);g.lineTo(x+s*24,y-28);g.stroke();}
   g.fillStyle='#a5683b';g.beginPath();g.ellipse(x-20,y-12,9,5,-.5,0,7);g.ellipse(x+20,y-12,9,5,.5,0,7);g.fill();g.beginPath();g.arc(x,y-2,17,0,7);g.fill();
   g.fillStyle='#f0d3a8';g.beginPath();g.ellipse(x,y+9,11,9,0,0,7);g.fill();g.fillStyle='#ff3b30';g.beginPath();g.arc(x,y+6,6,0,7);g.fill();
   g.fillStyle='#2a2321';g.beginPath();g.arc(x-7,y-6,3,0,7);g.arc(x+7,y-6,3,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x-8,y-7.5,1.1,0,7);g.arc(x+6,y-7.5,1.1,0,7);g.fill();},
  photo(x,y){g.fillStyle='#3d3f44';g.beginPath();g.roundRect(x-22,y-12,44,30,5);g.fill();g.fillRect(x-8,y-18,16,7);g.fillStyle='#cfe6ff';g.beginPath();g.arc(x,y+3,10,0,7);g.fill();g.fillStyle='#3d3f44';g.beginPath();g.arc(x,y+3,5,0,7);g.fill();g.fillStyle='#ffd27a';g.fillRect(x+12,y-9,6,4);},
 };
 SIGN_KEYS.forEach((k,i)=>{const x0=(i%4)*cw,y0=Math.floor(i/4)*ch;
  g.fillStyle=k==='photo'||k==='reindeer'?'#a92c2a':k==='skate'?'#2f5f8f':'#7a4a2a';g.fillRect(x0,y0,cw,ch);g.strokeStyle='#e9b949';g.lineWidth=6;g.strokeRect(x0+6,y0+6,cw-12,ch-12);
  draw[k](x0+56,y0+ch/2+2);
  g.fillStyle='#fbf0d8';g.textAlign='center';g.textBaseline='middle';const t=SIGN[k],cut=t.lastIndexOf(' '),lines=cut>0?[t.slice(0,cut),t.slice(cut+1)]:[t];
  // 띄어쓰기가 있으면 마지막 띄어쓰기에서 두 줄, 줄이 칸(170px)보다 길면 글자를 줄인다
  if(lines.length>1){let fs=34;do{g.font=`900 ${fs}px 'Apple SD Gothic Neo',system-ui,sans-serif`;fs--;}while(fs>20&&Math.max(...lines.map(l=>g.measureText(l).width))>170);
   lines.forEach((l,j)=>g.fillText(l,x0+166,y0+ch/2+2+(j-.5)*(fs+6)));}
  else{g.font=`900 ${t.length>3?34:42}px 'Apple SD Gothic Neo',system-ui,sans-serif`;g.fillText(t,x0+166,y0+ch/2+2);}});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
