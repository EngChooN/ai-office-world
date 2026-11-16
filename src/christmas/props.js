// 온라인 크리스마스 소품 형상(월드아트, 2026-11-16). 온라인 등산 즐길거리·흡연장 옥상과 같은 방식:
// concept-kit 형상(둥근 타원체·관·상자) + 단색 + 툰 재질 + 뒤집은 껍질 외곽선(finishTrailModel), 텍스처 없음(글자판만 작은 캔버스).
// 앞 +Z, 바닥 y=0, 1m = 1, 동동이 키 1.0m 기준. 밤에 빛나는 것(전구·불꽃·창·별)은 HDR 색 MeshBasic이라 블룸을 받고 toonify를 거치지 않는다.
// 게임 놀이 판정·동기화는 월드개발 몫이다. 여기서는 모양과 "바꿀 수 있는 부분"(장식 자리·전구 단계·별·우체통 깃발·카드 칸·눈사람 부품)만 준다.
import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {v,ell,capsule,noodle,sweep,at,part,grp} from '../toon/concept-kit.js';
import {rod,boxAt,textPlane,finishTrailModel,lineMat} from '../toon/trail-props.js';
import {XMAS} from './palette.js';
import {TREE,treeRadiusAt,treeSlots,TREE_LIGHT_STEPS,CAMPFIRE,campfireSeats,ENTRANCE} from './layout.js';

const {Quaternion,Color}=THREE;
const rng=seed=>{let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
const lin=hex=>new Color(hex);
// 밤에 빛나는 재질: 색 × 세기(1보다 크면 블룸 문턱을 넘는다). 이름별로 하나.
const glowMats=new Map();
export function glow(color,k=2.2,{transparent=false,opacity=1}={}){const key=`${color}|${k}|${opacity}`;
 if(!glowMats.has(key)){const m=new THREE.MeshBasicMaterial({color:lin(color).multiplyScalar(k),transparent,opacity,depthWrite:!transparent});m.userData.shared=true;m.userData.xmasGlow=true;glowMats.set(key,m);}
 return glowMats.get(key);}
// toonify는 MeshBasic도 툰 재질로 바꾸므로, 빛나는 재질은 바꾼 뒤 되돌린다.
const keepGlow=toonify=>toonify&&((root,o)=>{const keep=[];root.traverse(m=>{if(m.isMesh&&m.material?.userData?.xmasGlow)keep.push([m,m.material]);});toonify(root,o);for(const [m,mat] of keep)m.material=mat;return root;});
const glowPart=(parent,geo,color,k,o)=>{const m=new THREE.Mesh(geo,glow(color,k,o));m.castShadow=false;m.receiveShadow=false;m.userData.line=0;parent.add(m);return m;};
// 꼭짓점 색 형상: 조각마다 색을 칠해 한 형상으로 합친다(그리기 호출 줄이기).
function paint(geo,color){geo=geo.index?geo.toNonIndexed():geo;geo.deleteAttribute('uv');if(!geo.attributes.normal)geo.computeVertexNormals();
 const p=geo.attributes.position,c=new Color(),V=v(),a=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i);c.set(typeof color==='function'?color(V):color);a.set([c.r,c.g,c.b],i*3);}
 geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;}
const mergePainted=list=>mergeGeometries(list.map(([g,c])=>paint(g,c)));
const rot=(g,x=0,y=0,z=0)=>{if(x)g.rotateX(x);if(y)g.rotateY(y);if(z)g.rotateZ(z);return g;};
const tr=(g,x,y,z)=>g.translate(x,y,z);
// 아래가 납작한 눈 덩어리(쌓인 눈·지붕 눈 가장자리)
const lump=(rx,ry,rz,seed=1)=>{const r=rng(seed);const k=r()*10;return ell(v(rx,ry,rz),{w:16,h:10,shape:V=>{if(V.y<0)V.y*=.35;const n=Math.sin(V.x*5+k)*Math.sin(V.z*4+k*.7)*.08;V.multiplyScalar(1+n);}});};


// 움직이지 않는 소품 조각을 재질별로 한 메시로 합친다(그리기 호출 줄이기: 집 한 채 160개 → 20개 안팎).
// skip(o)가 참인 물체와 그 아래(움직이는 깃발·불꽃·카드 칸 등), InstancedMesh, 글자판은 그대로 둔다.
// 화면 외곽선 제외 표시(풀밭과 같은 색 알파 0.5). 크고 매끈한 눈 덩어리(눈사람·눈벽)는 휴대폰 절반 해상도 외곽선에서 가로 줄무늬가 생겨서 뺀다(자기 껍질 외곽선은 남음).
const noEdges=new Map();
export function noEdgeMaterial(m){if(!noEdges.has(m)){const c=m.clone(),prev=m.onBeforeCompile,key=m.customProgramCacheKey?.bind(m);
 c.onBeforeCompile=function(sh,r){prev?.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n gl_FragColor.a=min(gl_FragColor.a,.5);');};
 c.customProgramCacheKey=()=>`${key?.()??''}|xmas-no-edge`;c.userData={...m.userData,shared:true,noEdge:true};noEdges.set(m,c);}return noEdges.get(m);}
const vcToons=new Map();
function vcToon(m){const k=m.gradientMap?.uuid??'none';if(!vcToons.has(k)){const v=m.clone();v.vertexColors=true;v.color.set(0xffffff);v.name='xmas-baked-vc';v.userData={...m.userData,shared:true};vcToons.set(k,v);}return vcToons.get(k);}
export function bakeStatic(root,{skip=()=>false,noEdge=false}={}){
 root.updateMatrixWorld(true);
 const inv=root.matrixWorld.clone().invert(),groups=new Map(),list=[],M=new THREE.Matrix4();
 const skipped=o=>{for(let p=o;p&&p!==root;p=p.parent)if(skip(p))return true;return false;};
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.userData.textPlane||o.material?.map||o.material?.isShaderMaterial||skipped(o))return;list.push(o);});
 // 외곽선 껍질은 굵기가 조금씩 달라도 한 메시로 모은다(가장 많이 쓴 굵기 재질). 그리기 호출을 소품마다 하나로.
 const lineCount=new Map();for(const o of list)if(o.userData.outline)lineCount.set(o.material,(lineCount.get(o.material)??0)+1);
 const lineMain=[...lineCount.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
 // 단색 툰 재질(빛남·투명·텍스처 없음)은 색을 꼭짓점 색으로 옮겨 꼭짓점 색 툰 재질 하나로 모은다(같은 3단 명암이라 모습은 같다).
 const flat=m=>m.isMeshToonMaterial&&!m.map&&!m.transparent&&!m.userData.noEdge&&(m.emissive?.r??0)+(m.emissive?.g??0)+(m.emissive?.b??0)===0;
 for(const o of list){const src=o.userData.outline?lineMain:o.material,isFlat=!o.userData.outline&&flat(src),m=isFlat?vcToon(src):src,key=`${m.uuid}|${o.castShadow}|${o.receiveShadow}|${o.renderOrder}`;
  let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();for(const n of Object.keys(g.attributes))if(!['position','normal','color'].includes(n))g.deleteAttribute(n);
  if(isFlat){const n=g.attributes.position.count,c=g.attributes.color,a=new Float32Array(n*3),k=src.color;
   for(let i=0;i<n;i++){const r=src.vertexColors&&c?c.getX(i):1,gg=src.vertexColors&&c?c.getY(i):1,b=src.vertexColors&&c?c.getZ(i):1;a.set([r*k.r,gg*k.g,b*k.b],i*3);}
   g.setAttribute('color',new THREE.BufferAttribute(a,3));}
  else if(!m.vertexColors)g.deleteAttribute('color');if(!g.attributes.normal)g.computeVertexNormals();
  g.applyMatrix4(M.multiplyMatrices(inv,o.matrixWorld));
  if(!groups.has(key))groups.set(key,{m,cast:o.castShadow,receive:o.receiveShadow,order:o.renderOrder,outline:!!o.userData.outline,geos:[]});groups.get(key).geos.push(g);}
 for(const o of list){o.parent?.remove(o);for(const c of [...o.children])if(!list.includes(c)){c.applyMatrix4(o.matrix);o.parent?.add(c);}}
 for(const {m,cast,receive,order,outline,geos} of groups.values()){const g=mergeGeometries(geos);geos.forEach(x=>x.dispose());if(!g)continue;
  const mesh=new THREE.Mesh(g,noEdge&&!outline?noEdgeMaterial(m):m);mesh.castShadow=cast;mesh.receiveShadow=receive;mesh.renderOrder=order;mesh.userData.outline=outline;mesh.userData.baked=true;root.add(mesh);}
 return root;}

// ═════════════════ 트리 ═════════════════
// 층층 원뿔 한 단: 가장자리가 물결(가지 끝)이고 끝이 살짝 처진다. 윗면은 초록, 가장자리 위에 눈이 조금 얹히고 아랫면은 짙은 초록.
function tierGeometry(y0,y1,r0,seed){
 const N=56,M=7,pos=[],col=[],idx=[],r=rng(seed),ph=r()*6.28,lobes=9+Math.floor(r()*3);
 const cFir=lin(XMAS.fir),cDark=lin(XMAS.firDark),cLight=lin(XMAS.firLight),cSnow=lin(XMAS.snow),tmp=new Color();
 const rim=a=>1+.075*Math.sin(lobes*a+ph)+.03*Math.sin(23*a+ph*2);
 const droop=a=>.2*(.5+.5*Math.sin(lobes*a+ph));
 // 윗면: 꼭대기(0) → 가장자리(M). 가장자리 가까이 고리를 촘촘히 두어 눈 색이 가지 끝에만 얹히게 한다(길게 번지면 빛줄기처럼 보인다).
 const T=[0,.22,.42,.6,.75,.87,.94,1];
 for(let j=0;j<=M;j++){const t=T[j];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,rr=r0*t*rim(a)*(.9+.1*t),y=y1+(y0-y1)*t-droop(a)*t*t;
  pos.push(Math.sin(a)*rr,y,Math.cos(a)*rr);
  // 눈: 가지 끝 물결의 볼록한 곳(처진 끝)마다 한 덩이
  const lobe=Math.sin(a*lobes+ph),snowy=j===M?lobe>-.1:j===M-1&&lobe>.35;
  tmp.copy(cFir).lerp(cLight,.35*(1-t));if(snowy)tmp.copy(cSnow);else if(j===M)tmp.lerp(cDark,.15);col.push(tmp.r,tmp.g,tmp.b);}}
 // 아랫면: 가장자리 → 줄기 쪽 안으로(위로 조금 올라감)
 const base=(M+1)*(N+1);
 for(let j=0;j<=2;j++){const t=j/2;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,rr=r0*rim(a)*(1-t*.82),y=y0-droop(a)+(t*(y1-y0)*.28)+(j===0?-.02:0);
  pos.push(Math.sin(a)*rr,y,Math.cos(a)*rr);col.push(cDark.r,cDark.g,cDark.b);}}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;idx.push(a,b,a+1,a+1,b,b+1);}
 for(let j=0;j<2;j++)for(let i=0;i<N;i++){const a=base+j*(N+1)+i,b=a+N+1;idx.push(a,a+1,b,a+1,b+1,b);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
// 장식 8종(체험설계 §5-1). 원점 = 가지에 거는 고리, 장식은 아래(-Y)로 매달리고 앞(+Z)이 트리 바깥을 본다.
// 트리 위 장식 크기 배율: 9m 트리에서 멀리서도 알아보게 손에 드는 크기(공 지름 26cm)의 1.6배로 단다.
export const ORN_SCALE=1.6;
export const ORNAMENT_KINDS=Object.freeze(['ballRed','ballGold','ballBlue','ballSilver','candy','bell','snowflake','gift']);
export const ORNAMENT_LABELS=Object.freeze({ballRed:'빨간 공',ballGold:'금빛 공',ballBlue:'파란 공',ballSilver:'은빛 공',candy:'지팡이 사탕',bell:'종',snowflake:'눈송이',gift:'작은 선물상자'});
const BALL={ballRed:XMAS.ornRed,ballGold:XMAS.ornGold,ballBlue:XMAS.ornBlue,ballSilver:XMAS.ornSilver};
export function ornamentGeometry(kind){
 const L=[];const hook=()=>L.push([rot(new THREE.TorusGeometry(.022,.006,6,12),0,Math.PI/2),XMAS.goldDark]);
 if(BALL[kind]){const c=BALL[kind];
  L.push([tr(new THREE.SphereGeometry(.13,20,14),0,-.17,0),c]);
  // 반짝이 띠(공 가운데를 두르는 흰·금 줄)
  L.push([tr(rot(new THREE.TorusGeometry(.131,.012,6,28),Math.PI/2),0,-.17,0),kind==='ballGold'?XMAS.santaRed:XMAS.fur]);
  L.push([tr(new THREE.SphereGeometry(.03,10,8),.05,-.12,.11),'#ffffff']);
  L.push([tr(new THREE.CylinderGeometry(.034,.034,.045,12),0,-.035,0),XMAS.gold]);hook();
 }else if(kind==='candy'){
  const pts=[v(.07,-.42,0),v(.07,-.1,0),v(.06,-.02,0),v(.02,.03,0),v(-.04,.02,0),v(-.07,-.04,0),v(-.07,-.1,0)],g=noodle(pts,.026);
  L.push([g,V=>Math.floor((V.y*1.2+V.x*.7)*22)%2?XMAS.candyStripe:XMAS.candy]);
  // 원점이 갈고리 안쪽에 오도록 조금 옮긴다
  L.forEach(([gg])=>gg.translate(.07,-.02,0));
 }else if(kind==='bell'){
  const prof=[[0,.0],[.03,-.02],[.06,-.07],[.075,-.15],[.11,-.22],[.115,-.235],[0,-.235]].map(([x,y])=>new THREE.Vector2(x,y));
  L.push([new THREE.LatheGeometry(prof,20),XMAS.bell]);L.push([tr(new THREE.SphereGeometry(.035,10,8),0,-.245,0),XMAS.goldDark]);
  L.push([tr(new THREE.SphereGeometry(.026,10,8),-.03,.015,.02),XMAS.santaRed],[tr(new THREE.SphereGeometry(.026,10,8),.03,.015,.02),XMAS.santaRed],[tr(new THREE.SphereGeometry(.018,8,6),0,.01,.03),XMAS.santaRedDark]);hook();
 }else if(kind==='snowflake'){
  for(let k=0;k<3;k++){const a=k*Math.PI/3;L.push([tr(rot(new THREE.BoxGeometry(.034,.36,.03),0,0,a),0,-.2,0),XMAS.flake]);
   for(const s of [-1,1])for(const e of [-1,1]){const g=new THREE.BoxGeometry(.022,.09,.024);g.rotateZ(s*.8);g.translate(0,.12,0);g.rotateZ(a+(e<0?Math.PI:0));g.translate(0,-.2,0);L.push([g,XMAS.flake]);}}
  L.push([tr(new THREE.CylinderGeometry(.045,.045,.035,6).rotateX(Math.PI/2),0,-.2,0),'#bfe6ff']);hook();
 }else if(kind==='gift'){
  L.push([tr(new THREE.BoxGeometry(.19,.17,.19),0,-.13,0),XMAS.giftBox]);
  L.push([tr(new THREE.BoxGeometry(.04,.175,.195),0,-.13,0),XMAS.giftRibbon],[tr(new THREE.BoxGeometry(.195,.175,.04),0,-.13,0),XMAS.giftRibbon]);
  for(const s of [-1,1])L.push([tr(rot(new THREE.TorusGeometry(.035,.013,6,12),0,0,s*.5),s*.035,-.02,0),XMAS.giftRibbon]);hook();
 }else throw new Error(`장식 없음: ${kind}`);
 const g=mergePainted(L);g.computeBoundingSphere();return g;
}
// 꼭대기 별(5각, 금빛·빛남). 별 단 사람이 생기기 전에는 금 꼭지만 보인다.
function starGeometry(){const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.2:.46;const x=Math.sin(a)*r,y=Math.cos(a)*r;i?sh.lineTo(x,y):sh.moveTo(x,y);}
 const g=new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2});g.translate(0,0,-.05);return g;}

// 트리 + 장식 자리 120 + 전구줄 4단계 + 꼭대기 별 + 빈 자리 점.
export function buildTree(toonify){
 const g=new THREE.Group();g.name='광장 트리';
 // 줄기와 화분 대신 둥근 눈 둔덕(트리 밑동), 선물 상자 몇 개
 part(g,new THREE.CylinderGeometry(TREE.trunkR*.85,TREE.trunkR,TREE.trunkH+.6,14).translate(0,(TREE.trunkH+.6)/2,0),XMAS.trunk,{line:.8});
 part(g,at(lump(1.5,.32,1.5,3),v(0,.02,0)),XMAS.snow,{line:.6});
 const tiers=mergeGeometries(TREE.tiers.map(([y0,y1,r0],i)=>tierGeometry(y0,y1,r0,11+i*7)));
 const tm=part(g,tiers,null,{line:0});tm.name='트리 잎';tm.castShadow=true;
 // 밑동 선물 상자(장식 아님, 분위기)
 const gifts=[[1.75,.0,.55,.42,'#e0473f','#f2d15a'],[-1.6,.6,.45,.36,'#3fa0a0','#f7f2e8'],[.4,-1.75,.5,.3,'#efc04f','#d23b36'],[-.6,1.7,.38,.38,'#4f86d9','#efc04f'],[1.1,1.35,.32,.28,'#f7f2e8','#3f9a5c']];
 for(const [x,z,s,h,c,rb] of gifts){const b=grp(g,v(x,0,z));b.rotation.y=x*1.3+z;boxAt(b,v(s,h,s),v(0,h/2+.05,0),c,{line:.6});boxAt(b,v(s*.18,h+.01,s+.01),v(0,h/2+.05,0),rb,{line:0});boxAt(b,v(s+.01,h+.01,s*.18),v(0,h/2+.05,0),rb,{line:0});
  for(const k of [-1,1])part(b,at(rot(new THREE.TorusGeometry(s*.13,s*.045,6,12),0,0,k*.6),v(k*s*.11,h+.08,0)),rb,{line:.4});}
 // 꼭대기 금 꼭지(별 받침)
 part(g,new THREE.ConeGeometry(.07,.34,10).translate(0,TREE.tiers.at(-1)[1]+.1,0),XMAS.gold,{line:.5});
 finishTrailModel(g,keepGlow(toonify),{lineScale:1.4});bakeStatic(g);

 // ── 장식(종류마다 InstancedMesh 하나). 단 장식만 앞에서부터 채워 그린다(count) — 빈 자리를 크기 0으로 남기면 960개를 다 그린다.
 const slots=treeSlots(),orn={},state=new Array(slots.length).fill(null),M=new THREE.Matrix4(),Q=new Quaternion(),S=v(),P=v(),zero=new THREE.Matrix4().makeScale(0,0,0);
 const slotMatrix=(i,out=M)=>{const s=slots[i],tilt=((i*.618)%1-.5)*.25;Q.setFromEuler(new THREE.Euler(tilt*.4,Math.atan2(s.nx,s.nz),tilt));P.set(s.x+s.nx*.08,s.y,s.z+s.nz*.08);S.setScalar(ORN_SCALE);return out.compose(P,Q,S);};
 for(const k of ORNAMENT_KINDS){
  const geo=ornamentGeometry(k),m=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}),slots.length);
  m.name=`장식:${k}`;m.count=0;m.castShadow=false;m.frustumCulled=false;m.userData.slotOf=[];
  toonify?.(m,{kind:'character'});
  const line=new THREE.InstancedMesh(geo,lineMat(.009),slots.length);line.instanceMatrix=m.instanceMatrix;line.count=0;line.userData.outline=true;line.frustumCulled=false;m.add(line);m.userData.line=line;
  g.add(m);orn[k]=m;}
 const ornAdd=(k,i)=>{const m=orn[k],n=m.count;m.setMatrixAt(n,slotMatrix(i));m.userData.slotOf[n]=i;m.count=m.userData.line.count=n+1;m.instanceMatrix.needsUpdate=true;};
 const ornRemove=(k,i)=>{const m=orn[k],list=m.userData.slotOf,at=list.indexOf(i),last=m.count-1;if(at<0)return;
  if(at!==last){m.getMatrixAt(last,M);m.setMatrixAt(at,M);list[at]=list[last];}list.length=last;m.count=m.userData.line.count=last;m.instanceMatrix.needsUpdate=true;};
 // ── 빈 자리 점(장식 고르기 모드에서만): 은은한 흰 점
 const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.06,10,8),glow('#fff6d8',1.4,{transparent:true,opacity:.85}),slots.length);dots.name='빈 자리 점';dots.visible=false;dots.frustumCulled=false;
 const dotMatrix=i=>{const s=slots[i];return M.makeTranslation(s.x+s.nx*.08,s.y-.1,s.z+s.nz*.08);};
 for(let i=0;i<slots.length;i++)dots.setMatrixAt(i,dotMatrix(i));g.add(dots);

 // ── 전구줄: 아래에서 위로 감기는 나선 5바퀴. 전구 = 작은 빛나는 타원, 꺼진 전구는 어두운 색.
 const bulbs=[],wire=[];
 {const turns=5.5,y0=.85,y1=8.3,n=150;
  for(let i=0;i<=240;i++){const s=i/240,y=y0+(y1-y0)*s,a=s*turns*Math.PI*2+.4,r=treeRadiusAt(y)*.93+.02;wire.push(v(Math.sin(a)*r,y-.04*Math.sin(s*turns*Math.PI*4),Math.cos(a)*r));}
  for(let i=0;i<n;i++){const s=(i+.5)/n,y=y0+(y1-y0)*s,a=s*turns*Math.PI*2+.4,r=treeRadiusAt(y)*.93+.06;bulbs.push({s,p:v(Math.sin(a)*r,y-.06,Math.cos(a)*r),color:lin(XMAS.bulbs[i%XMAS.bulbs.length])});}}
 const wm=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire),480,.012,5,false),new THREE.MeshBasicMaterial({color:'#1d3a2a'}));wm.name='전구줄';g.add(wm);
 const bulbMat=new THREE.MeshBasicMaterial({color:'#ffffff'});
 const bulbMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,8,6).scale(1,1.3,1),bulbMat,bulbs.length);bulbMesh.name='전구';bulbMesh.frustumCulled=false;
 bulbs.forEach((b,i)=>{bulbMesh.setMatrixAt(i,M.makeTranslation(b.p.x,b.p.y,b.p.z));bulbMesh.setColorAt(i,b.color);});g.add(bulbMesh);
 // ── 별
 const star=new THREE.Group();star.name='꼭대기 별';star.position.set(0,TREE.starY,0);g.add(star);
 const starMesh=new THREE.Mesh(starGeometry(),glow(XMAS.star,2.6));starMesh.userData.line=0;star.add(starMesh);
 const halo=new THREE.Mesh(new THREE.CircleGeometry(.95,32),haloMaterial(XMAS.star,.55));halo.position.z=-.08;star.add(halo);star.visible=false;
 // 트리 아래 바닥 빛(전구 단계만큼 밝아짐)
 const floorGlow=new THREE.Mesh(new THREE.CircleGeometry(5.2,48).rotateX(-Math.PI/2),groundGlowMaterial('#ffd99a',0));floorGlow.position.y=.03;floorGlow.renderOrder=2;floorGlow.name='트리 바닥 빛';g.add(floorGlow);

 let stage=0,flash=0,starOn=false;const tmpC=new Color();
 function paintBulbs(t=0){
  const lit=stage/4;
  bulbs.forEach((b,i)=>{const on=b.s<=lit+1e-6&&stage>0;let k=on?2.6:.16;
   if(on&&stage===4)k*=.75+.45*(.5+.5*Math.sin(t*3.1+i*1.7));
   if(on&&flash>0)k*=1+flash*1.4;
   bulbMesh.setColorAt(i,tmpC.copy(b.color).multiplyScalar(k));});
  bulbMesh.instanceColor.needsUpdate=true;
  floorGlow.material.uniforms.uK.value=.06+.16*lit+(flash>0?flash*.25:0);
 }
 paintBulbs();
 const api={
  group:g,slots,kinds:ORNAMENT_KINDS,
  // 장식 달기·떼기(kind=null). 자리 번호는 layout.treeSlots()와 같다.
  setOrnament(i,kind){if(i<0||i>=slots.length)return false;kind=kind??null;const prev=state[i];if(prev===kind)return true;
   if(kind&&!orn[kind])return false;
   if(prev)ornRemove(prev,i);
   if(kind)ornAdd(kind,i);
   state[i]=kind??null;dots.setMatrixAt(i,kind?zero:dotMatrix(i));dots.instanceMatrix.needsUpdate=true;return true;},
  ornamentAt:i=>state[i],
  count:()=>state.filter(Boolean).length,
  clear(){for(let i=0;i<slots.length;i++)api.setOrnament(i,null);},
  // 전구 단계 0~4(layout.treeLightStage(장식 수)). 4 = 가득(반짝임).
  setLightStage(s){stage=Math.max(0,Math.min(4,s|0));paintBulbs();},
  get lightStage(){return stage;},
  setStar(on){starOn=!!on;star.visible=starOn;},
  get star(){return starOn;},
  showSlots(on){dots.visible=!!on;},
  // 점등·가득 연출(초). 전구가 잠깐 더 밝아지고 별이 커졌다 돌아온다.
  flash(sec=3){flash=1;api._flashLen=sec;},
  _flashLen:3,
  // 자리의 월드 위치(장식 고르기 카메라·미리 보기용)
  slotWorld(i,out=v()){const s=slots[i];return out.set(s.x,s.y,s.z).applyMatrix4(g.matrixWorld);},
  update(dt,t){if(flash>0)flash=Math.max(0,flash-dt/api._flashLen);if(stage===4||flash>0)paintBulbs(t);
   if(starOn){const k=1+.06*Math.sin(t*2.2)+flash*.5;star.scale.setScalar(k);star.rotation.y=Math.sin(t*.6)*.25;halo.material.uniforms.uK.value=.55+.15*Math.sin(t*2.2)+flash;}},
  steps:TREE_LIGHT_STEPS,
 };
 return api;
}

// 둥근 빛무리(별·등 뒤 후광): 가운데가 밝고 가장자리로 사라지는 더하기 섞기 원판
export function haloMaterial(color,k){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:lin(color)},uK:{value:k}},
 vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 uC;uniform float uK;varying vec2 vU;void main(){float d=length(vU-.5)*2.;float a=pow(max(0.,1.-d),2.2);gl_FragColor=vec4(uC*a*uK,0.);}'});}
// 바닥 빛 웅덩이(모닥불·가로등·트리 밑): 점광원 없이 눈 바닥이 따뜻하게 물드는 것처럼 보이게 한다.
export function groundGlowMaterial(color,k){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2,uniforms:{uC:{value:lin(color)},uK:{value:k}},
 vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 uC;uniform float uK;varying vec2 vU;void main(){float d=length(vU-.5)*2.;float a=smoothstep(1.,0.,d);a*=a;gl_FragColor=vec4(uC*a*uK,0.);}'});}

// ═════════════════ 모닥불 ═════════════════
// 돌 둘레 + 세운 장작 + 불꽃 3겹 + 불티 + 바닥 빛. 통나무 의자 4개(8자리)는 layout.campfireSeats() 자리에 맞춘다.
// 음주·흡연 요소 없음(체험설계 §1-6): 곁 소품은 코코아 주전자·컵·마시멜로·장작더미·담요.
function logGeometry(len,r){const g=new THREE.CylinderGeometry(r,r*1.04,len,14,3);g.rotateZ(Math.PI/2);return paint(g,V=>Math.abs(V.x)>len/2-.015?XMAS.logEnd:XMAS.log);}
export function buildCampfire(toonify){
 const g=new THREE.Group();g.name='모닥불';const r=rng(77);
 // 돌 둘레
 const stones=[];for(let i=0;i<13;i++){const a=i/13*Math.PI*2,rr=CAMPFIRE.stoneR+(r()-.5)*.06;stones.push([tr(ell(v(.17+r()*.05,.12+r()*.04,.14),{w:10,h:8}).rotateY(a),Math.sin(a)*rr,.08,Math.cos(a)*rr),r()<.5?XMAS.stone:XMAS.stoneDark]);}
 part(g,mergePainted(stones),null,{line:.8});
 // 재·숯 바닥
 part(g,new THREE.CylinderGeometry(.66,.7,.05,20).translate(0,.025,0),'#3b3330',{line:0});
 // 세운 장작(원뿔로 기댐)
 const sticks=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,top=v(0,.62,0),bot=v(Math.sin(a)*.5,.04,Math.cos(a)*.5);const d=top.clone().sub(bot),gg=logGeometry(d.length(),.055);gg.rotateZ(-Math.PI/2);gg.applyQuaternion(new Quaternion().setFromUnitVectors(v(0,1,0),d.normalize()));const m=bot.clone().add(top).multiplyScalar(.5);gg.translate(m.x,m.y,m.z);sticks.push(gg);}
 part(g,mergeGeometries(sticks),null,{line:.6});
 // 통나무 의자 4개(자리 2개씩)
 const seats=campfireSeats(),logs=[];
 for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,x=Math.sin(a)*CAMPFIRE.logR,z=Math.cos(a)*CAMPFIRE.logR,gg=logGeometry(CAMPFIRE.logLen,.17);gg.rotateY(a);gg.translate(x,.17,z);logs.push(gg);
  // 통나무 위에 살짝 쌓인 눈(양 끝만 — 앉는 자리는 털어 냄)
  for(const s of [-1,1]){const lx=x+Math.cos(a)*s*CAMPFIRE.logLen*.46,lz=z-Math.sin(a)*s*CAMPFIRE.logLen*.46;part(g,at(lump(.1,.05,.12,k*2+s),v(lx,.33,lz)),XMAS.snow,{line:.4});}}
 part(g,mergeGeometries(logs),null,{line:.8});
 // 코코아 그루터기(북쪽, 통나무 사이): 주전자·컵 둘·마시멜로 접시
 {const a=Math.PI,s=grp(g,v(Math.sin(a)*CAMPFIRE.logR,0,Math.cos(a)*CAMPFIRE.logR));
  part(s,new THREE.CylinderGeometry(.26,.3,.46,14).translate(0,.23,0),V=>V.y>.455?XMAS.logEnd:XMAS.log,{line:.8});
  part(s,new THREE.CylinderGeometry(.09,.11,.16,14).translate(-.08,.54,0),'#c94a3a',{line:.6});part(s,new THREE.SphereGeometry(.05,10,8).translate(-.08,.63,0),'#a8352e',{line:.4});
  rod(s,v(-.0,.56,0),v(.06,.6,0),.014,'#a8352e',{line:.4});
  for(const [x,z,c] of [[.1,.09,XMAS.fur],[.13,-.08,XMAS.santaRed]]){part(s,new THREE.CylinderGeometry(.04,.036,.08,12).translate(x,.5,z),c,{line:.5});part(s,new THREE.CylinderGeometry(.035,.035,.005,12).translate(x,.538,z),'#6b3e26',{line:0});}
  part(s,new THREE.CylinderGeometry(.075,.06,.02,14).translate(.0,.47,-.15),'#e8dccb',{line:.4});for(let i=0;i<4;i++)part(s,new THREE.CylinderGeometry(.018,.018,.03,8).translate(-.02+i*.016,.495,-.15+(i%2)*.02),'#fffaf2',{line:0});}
 // 장작더미(서쪽 바깥)·담요(남서 통나무 끝에 개어 둔 체크 담요)
 {const p=grp(g,v(-3.25,0,.4));p.rotation.y=.3;const st=[];for(let row=0;row<3;row++)for(let i=0;i<4-row;i++){const gg=logGeometry(.9,.1);gg.rotateY(Math.PI/2);gg.translate(0,.1+row*.18,-.3+i*.2+row*.1);st.push(gg);}part(p,mergeGeometries(st),null,{line:.6});part(p,at(lump(.55,.12,.4,9),v(0,.62,0)),XMAS.snow,{line:.4});}
 {const a=Math.PI/4+2*Math.PI/2,x=Math.sin(a)*(CAMPFIRE.logR+.05)+Math.cos(a)*.6,z=Math.cos(a)*(CAMPFIRE.logR+.05)-Math.sin(a)*.6;
  part(g,at(paint(new THREE.BoxGeometry(.34,.08,.28).rotateY(a),V=>(Math.floor((V.x+1)*14)+Math.floor((V.z+1)*14))%2?'#c94a3a':'#2f6d4f'),v(x,.38,z)),null,{line:.5});}
 finishTrailModel(g,keepGlow(toonify),{lineScale:1.2});bakeStatic(g);
 // ── 불꽃(빛나는 3겹 + 작은 혀 3개). update가 흔든다.
 const flame=grp(g,v(0,.08,0));flame.name='불꽃';
 // 불꽃 옆모습: 아래가 둥글고 위로 갈수록 가늘어지다 끝이 뾰족(돌림체). 겹마다 높이·굵기·색이 다르고 혀는 바깥으로 살짝 기운다.
 const tongue=(h,w,bend=.35)=>{const pts=[];for(let i=0;i<=16;i++){const t=i/16,r=w*Math.sin(Math.min(1,t*2.2)*Math.PI/2)*Math.pow(1-t,1.6);pts.push(new THREE.Vector2(Math.max(r,.001),t*h-.05*h));}
  const g=new THREE.LatheGeometry(pts,14),p=g.attributes.position;
  // 끝이 한쪽으로 휘는 불 혀(카툰 불꽃): 위로 갈수록 x로 밀고, 가운데쯤 살짝 잘록
  for(let k=0;k<p.count;k++){const t=Math.max(0,p.getY(k)/h);p.setX(k,p.getX(k)+Math.pow(t,2)*w*bend);}g.computeVertexNormals();return g;};
 const layers=[[tongue(1.25,.46,.5),XMAS.fireEdge,1.5],[tongue(.95,.34,-.6),XMAS.fire,1.9],[tongue(.6,.21,.4),XMAS.fireCore,2.3]];
 const flames=layers.map(([geo,c,k],i)=>{const m=glowPart(flame,geo,c,k);m.renderOrder=3+i;return m;});
 const tongues=[0,1,2,3,4].map(i=>{const a=i*1.26+.3,m=glowPart(flame,tongue(.6+(i%3)*.16,.17,.9),i%2?XMAS.fire:XMAS.fireEdge,1.6);m.position.set(Math.sin(a)*.22,0,Math.cos(a)*.22);m.rotation.set(Math.cos(a)*.25,0,-Math.sin(a)*.25);m.userData.a=a;return m;});
 // 장작 사이 숯불(붉게 빛나는 바닥)
 glowPart(flame,new THREE.CylinderGeometry(.42,.48,.06,16).translate(0,.02,0),'#ff7a3a',1.2);
 // 불티: 위로 날아오르며 사라지는 작은 점 14개
 const embers=[];for(let i=0;i<14;i++){const m=glowPart(flame,new THREE.OctahedronGeometry(.022,0),i%3?XMAS.fire:XMAS.fireCore,3);embers.push({m,ph:i/14,a:i*2.4,sp:.7+((i*.37)%1)*.6});}
 // 바닥 빛과 점광원(불빛이 의자·얼굴에 닿는다)
 const floor=new THREE.Mesh(new THREE.CircleGeometry(CAMPFIRE.glowR,48).rotateX(-Math.PI/2),groundGlowMaterial('#ff9a4a',.55));floor.position.y=.03;floor.renderOrder=2;floor.name='모닥불 바닥 빛';g.add(floor);
 const light=new THREE.PointLight(XMAS.fire,0,11,1.6);light.position.set(0,1.1,0);light.castShadow=false;g.add(light);
 return {group:g,seats,light,flame,
  update(dt,t,{power=6}={}){
   const f=.85+.15*Math.sin(t*11.3)+.08*Math.sin(t*23.7+1.3)+.06*Math.sin(t*6.1);
   flames.forEach((m,i)=>{m.scale.set(1+.05*Math.sin(t*9+i),f*(1+.07*Math.sin(t*13+i*2)),1+.05*Math.cos(t*8+i));m.rotation.y=t*(.6+i*.3);});
   tongues.forEach((m,i)=>{const k=.5+.5*Math.sin(t*(7+i)+i*2),a=m.userData.a;m.scale.set(.8+.3*k,.6+.7*k,.8+.3*k);m.rotation.set(Math.cos(a)*.25+Math.sin(t*5+i)*.12,0,-Math.sin(a)*.25+Math.cos(t*4+i)*.12);});
   for(const e of embers){const u=(t*e.sp*.45+e.ph)%1,s=(1-u)*1.3;e.m.position.set(Math.sin(e.a+t*.8)*(.15+u*.35),.35+u*2.1,Math.cos(e.a+t*.8)*(.15+u*.35));e.m.scale.setScalar(Math.max(0.001,s));}
   light.intensity=power*(.8+.25*f);floor.material.uniforms.uK.value=.5+.12*f;
  }};
}

// ═════════════════ 집 ═════════════════
// 동화 마을 오두막: 벽·눈 덮인 박공지붕(지붕 색은 처마 끝에만)·굴뚝·불 켜진 창·화환 문·처마 전구·고드름·밑동 눈 더미. 앞 +Z.
export function buildHouse(toonify,{variant=0,scale=1,seed=1}={}){
 const g=new THREE.Group();g.name='눈마을 집';const r=rng(seed*31+7);
 const W=4.4,D=3.6,H=2.35,pitch=.7,over=.38,wall=XMAS.walls[variant%4],roof=XMAS.roofs[variant%4];
 const ridge=H+Math.tan(pitch)*(D/2),slope=(D/2+over)/Math.cos(pitch);
 // 벽과 아랫단 돌
 boxAt(g,v(W,H,D),v(0,H/2,0),wall,{line:.9});boxAt(g,v(W+.08,.32,D+.08),v(0,.16,0),XMAS.stoneDark,{line:.6});
 // 박공(앞뒤 세모 벽)
 {const sh=new THREE.Shape([new THREE.Vector2(-W/2,0),new THREE.Vector2(W/2,0),new THREE.Vector2(0,ridge-H)]);const gg=new THREE.ExtrudeGeometry(sh,{depth:D,bevelEnabled:false});gg.translate(0,H,-D/2);part(g,gg,wall,{line:.9});}
 // 지붕 판(색) + 그 위 두꺼운 눈(가장자리가 둥글게 처짐)
 for(const s of [-1,1]){const p=grp(g,v(0,ridge,0));p.rotation.x=s*pitch;
  boxAt(p,v(W+over*2,.14,slope),v(0,0,s*slope/2),roof,{line:.8});
  boxAt(p,v(W+over*2+.06,.2,slope-.05),v(0,.15,s*(slope/2-.02)),XMAS.snow,{line:.6});
  for(let i=0;i<9;i++){const x=-W/2-over+(i+.5)*(W+over*2)/9;part(p,at(capsule(v(0,0,0),v(0,0,.001),.13+r()*.04),v(x,.06,s*(slope-.02))),XMAS.snow,{line:.4});}}
 part(g,at(capsule(v(-W/2-over-.02,0,0),v(W/2+over+.02,0,0),.16),v(0,ridge+.2,0)),XMAS.snow,{line:.6});
 // 굴뚝 + 눈 모자
 {const cx=W*.25,cz=-D*.18,ch=1.2,base=ridge-Math.tan(pitch)*Math.abs(cz)-.2;boxAt(g,v(.5,ch,.5),v(cx,base+ch/2,cz),XMAS.chimney,{line:.8});boxAt(g,v(.6,.1,.6),v(cx,base+ch,cz),'#7d4a3a',{line:.6});part(g,at(lump(.32,.12,.32,seed),v(cx,base+ch+.06,cz)),XMAS.snow,{line:.4});g.userData.chimney=v(cx,base+ch+.15,cz);}
 // 문(앞 가운데) + 문틀 + 화환 + 손잡이
 const front=D/2+.005;
 boxAt(g,v(1.12,1.78,.08),v(0,.89+.05,front),XMAS.frame,{line:.6});boxAt(g,v(.96,1.66,.1),v(0,.85+.05,front+.01),XMAS.door,{line:.6});
 for(let i=0;i<3;i++)boxAt(g,v(.82,.03,.11),v(0,.35+i*.5,front+.012),'#6a3f27',{line:0});
 part(g,new THREE.SphereGeometry(.04,10,8).translate(.34,.88,front+.07),XMAS.gold,{line:.3});
 {const w=grp(g,v(0,1.38,front+.08));part(w,new THREE.TorusGeometry(.22,.075,8,22),XMAS.pine,{line:.5});for(let i=0;i<7;i++){const a=i/7*Math.PI*2;part(w,new THREE.SphereGeometry(.03,8,6).translate(Math.cos(a)*.22,Math.sin(a)*.22,.06),XMAS.ornRed,{line:0});}
  for(const s of [-1,1])part(w,at(rot(new THREE.TorusGeometry(.05,.02,6,10),0,0,s*.6),v(s*.05,-.2,.05)),XMAS.santaRed,{line:.3});}
 // 문 위 작은 등
 boxAt(g,v(.16,.24,.16),v(0,2.05,front+.12),'#2f3a33',{line:.5});
 const lampGlow=glowPart(g,new THREE.BoxGeometry(.1,.16,.1).translate(0,2.05,front+.12),XMAS.lamp,1.6);
 // 창(앞 둘·옆 하나씩): 틀 + 빛나는 유리 + 십자 창살 + 눈 쌓인 창턱 + 덧문
 const win=(x,y,z,ry)=>{const w=grp(g,v(x,y,z));w.rotation.y=ry;
  boxAt(w,v(.86,.86,.06),v(0,0,0),XMAS.frame,{line:.5});glowPart(w,new THREE.PlaneGeometry(.7,.7).translate(0,0,.035),XMAS.window,1.45);
  boxAt(w,v(.05,.7,.03),v(0,0,.05),XMAS.frame,{line:0});boxAt(w,v(.7,.05,.03),v(0,0,.05),XMAS.frame,{line:0});
  boxAt(w,v(1,.08,.18),v(0,-.47,.07),XMAS.frame,{line:.4});part(w,at(lump(.48,.07,.09,x*10+y),v(0,-.42,.08)),XMAS.snow,{line:.3});
  for(const s of [-1,1])boxAt(w,v(.24,.9,.04),v(s*.58,0,0),roof,{line:.4});};
 win(-1.35,1.35,front+.01,0);win(1.35,1.35,front+.01,0);win(W/2+.01,1.35,0,Math.PI/2);win(-W/2-.01,1.35,0,-Math.PI/2);
 // 고드름(앞뒤 처마)
 const ice=[];for(const s of [-1,1])for(let i=0;i<16;i++){const x=-W/2-over+.15+i*(W+over*2-.3)/15,l=.12+r()*.22;ice.push(new THREE.ConeGeometry(.035,l,6).rotateX(Math.PI).translate(x,H-.02+(Math.tan(pitch)*-over)-l/2+.1,s*(D/2+over*.92)));}
 part(g,mergeGeometries(ice),'#d6ecfb',{line:.3});
 // 밑동 눈 더미
 for(let i=0;i<7;i++){const a=r()*Math.PI*2,x=Math.max(-W/2,Math.min(W/2,Math.sin(a)*W*.6)),z=Math.cos(a)>0?D/2+.15:-D/2-.15;if(Math.abs(x)<.7&&z>0)continue;part(g,at(lump(.45+r()*.3,.22+r()*.1,.3,i+seed),v(x,0,z)),XMAS.snow,{line:.4});}
 finishTrailModel(g,keepGlow(toonify),{lineScale:1.4});bakeStatic(g);
 // 처마 전구(앞 처마를 따라 늘어진 줄)
 const n=15,bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.05,8,6).scale(1,1.3,1),new THREE.MeshBasicMaterial({color:'#ffffff'}),n),M=new THREE.Matrix4(),c=new Color();bulbs.name='처마 전구';
 const ey=H+Math.tan(pitch)*-over+.02;
 for(let i=0;i<n;i++){const t=i/(n-1),x=-W/2-over+.1+t*(W+over*2-.2),y=ey-.12*Math.sin(((t*5)%1)*Math.PI);bulbs.setMatrixAt(i,M.makeTranslation(x,y,D/2+over*.9));bulbs.setColorAt(i,c.set(XMAS.bulbs[(i+variant)%XMAS.bulbs.length]).multiplyScalar(2.2));}
 g.add(bulbs);
 g.scale.setScalar(scale);
 return {group:g,footprint:{w:(W+over*2)*scale,d:(D+over*2)*scale},chimney:g.userData.chimney.clone().multiplyScalar(scale),bulbs,lampGlow};
}

// ═════════════════ 선물 우체통 + 모두의 카드 판 ═════════════════
// 빨간 둥근 우체통(키 1.4m, 동동이보다 조금 큼). 앞 +Z = 투입구. 오른쪽(+X) 깃발은 flag.rotation.z로 올린다(0 = 내림, -π/2 = 올림).
export function buildMailbox(toonify){
 const g=new THREE.Group();g.name='선물 우체통';
 part(g,new THREE.CylinderGeometry(.36,.4,.16,24).translate(0,.08,0),XMAS.postDark,{line:.8});
 part(g,new THREE.CylinderGeometry(.31,.33,.96,28).translate(0,.64,0),XMAS.post,{line:1});
 part(g,new THREE.SphereGeometry(.31,28,12,0,Math.PI*2,0,Math.PI/2).translate(0,1.12,0),XMAS.post,{line:1});
 part(g,new THREE.CylinderGeometry(.322,.322,.06,28).translate(0,1.02,0),XMAS.gold,{line:.5});
 part(g,new THREE.CylinderGeometry(.335,.345,.05,28).translate(0,.24,0),XMAS.gold,{line:.5});
 // 투입구(검은 입) + 금 테
 boxAt(g,v(.3,.06,.06),v(0,.9,.3),'#1f1a1a',{line:.3});boxAt(g,v(.36,.1,.03),v(0,.9,.29),XMAS.gold,{line:.4});
 // 앞 선물 문양(리본 묶은 상자) — 64px 단추 그림과 같은 모양
 {const e=grp(g,v(0,.6,.33));boxAt(e,v(.2,.17,.03),v(0,0,0),XMAS.fur,{line:.4});boxAt(e,v(.04,.18,.035),v(0,0,.002),XMAS.gold,{line:0});boxAt(e,v(.21,.035,.035),v(0,.02,.002),XMAS.gold,{line:0});
  for(const s of [-1,1])part(e,at(rot(new THREE.TorusGeometry(.035,.013,6,12),0,0,s*.6),v(s*.035,.11,.01)),XMAS.gold,{line:.3});}
 // 꼭대기 눈 + 리본
 part(g,at(lump(.27,.1,.27,5),v(0,1.36,0)),XMAS.snow,{line:.5});
 for(const s of [-1,1])part(g,at(rot(new THREE.TorusGeometry(.07,.026,6,12),0,0,s*.55),v(s*.07,1.47,.06)),XMAS.santaRed,{line:.4});
 // 깃발(오른쪽): 축 + 빨강·금 판
 const flag=grp(g,v(.33,.95,0));flag.name='우체통 깃발';
 rod(flag,v(0,0,0),v(0,0,.34),.016,'#3d3f44',{line:.4});boxAt(flag,v(.02,.14,.16),v(.012,.06,.28),XMAS.gold,{line:.4});
 flag.rotation.z=0;flag.rotation.x=-Math.PI/2; // 내림: 앞으로 누운 깃발
 finishTrailModel(g,keepGlow(toonify),{lineScale:1.2});bakeStatic(g,{skip:o=>o===flag});
 return {group:g,flag,
  // 깃발 올리기(0~1). 편지가 '쏙' 들어가는 연출과 같이 쓴다.
  setFlag(k){flag.rotation.x=-Math.PI/2*(1-Math.max(0,Math.min(1,k)));}};
}
export function buildCardBoard(toonify,{cards=5}={}){
 const g=new THREE.Group();g.name='모두의 카드 판';
 for(const s of [-1,1])boxAt(g,v(.1,1.7,.1),v(s*.85,.85,0),XMAS.woodDark,{line:.6});
 boxAt(g,v(1.9,1.08,.08),v(0,1.15,0),XMAS.wood,{line:.8});boxAt(g,v(1.98,.08,.14),v(0,1.72,0),XMAS.woodDark,{line:.6});
 part(g,at(lump(1,.08,.12,4),v(0,1.77,0)),XMAS.snow,{line:.4});
 textPlane(g,['모두의 카드'],1.1,.2,{bg:XMAS.woodDark,fg:'#fbf0d8',p:v(0,1.56,.05),size:.62,px:96});
 // 카드 칸(흰 카드 + 색 모서리). 월드개발이 받은 카드 그림으로 바꾼다(이름 card-0~4).
 const slots=[];const cols=[XMAS.ornRed,XMAS.pine,XMAS.ornBlue,XMAS.ornGold,XMAS.santaRed];
 for(let i=0;i<cards;i++){const x=-.68+i*.34,y=i%2?1.02:1.12,c=grp(g,v(x,y,.05));c.rotation.z=((i*.37)%1-.5)*.18;c.name=`card-${i}`;
  boxAt(c,v(.26,.34,.012),v(0,0,0),XMAS.fur,{line:.4});boxAt(c,v(.26,.07,.014),v(0,.135,.001),cols[i%cols.length],{line:0});part(c,new THREE.SphereGeometry(.018,8,6).translate(0,.16,.01),XMAS.gold,{line:0});slots.push(c);}
 finishTrailModel(g,keepGlow(toonify));for(const c of slots)bakeStatic(c);
 bakeStatic(g,{skip:o=>o.name?.startsWith('card-')});return {group:g,cards:slots};
}

// ═════════════════ 눈사람·눈덩이 ═════════════════
// 눈덩이: 살짝 울퉁불퉁한 공. 크기 3단계(체험설계 §7-1): 작음 지름 0.5m·중간 0.9m·큼 1.3m.
export const SNOWBALL_SIZES=Object.freeze({small:.25,medium:.45,large:.65});
export function snowballGeometry(radius,seed=1){const r=rng(seed),k=r()*9;return ell(v(radius,radius*.94,radius),{w:24,h:18,shape:V=>{const n=Math.sin(V.x*4+k)*Math.sin(V.y*3.3+k*.6)*Math.sin(V.z*3.7+k*1.3);V.multiplyScalar(1+n*.035);}});}
export function snowball(toonify,radius,seed=1){const g=new THREE.Group();g.name='눈덩이';part(g,at(snowballGeometry(radius,seed),v(0,radius*.9,0)),XMAS.snow,{line:.8});
 // 굴러 붙은 눈 자국(옆 띠)
 part(g,at(rot(new THREE.TorusGeometry(radius*.93,radius*.05,6,24),0,0,Math.PI/2),v(0,radius*.9,0)),XMAS.snowShade,{line:0});
 finishTrailModel(g,keepGlow(toonify));return bakeStatic(g,{noEdge:true});}
// 눈사람 꾸미기 부품(체험설계 §7-1 꾸미기 창 6칸): 눈(돌 2개)·코(당근)·입(돌 줄)·팔(나뭇가지)·모자·목도리
export const SNOWMAN_PARTS=Object.freeze(['eyes','nose','mouth','arms','hat','scarf']);
export const SNOWMAN_PART_LABELS=Object.freeze({eyes:'돌 눈',nose:'당근 코',mouth:'돌 입',arms:'나뭇가지 팔',hat:'모자',scarf:'목도리'});
// sizes = 아래부터 눈덩이 반지름(2~3단). parts = 붙일 부품 이름 목록. 앞 +Z.
export function buildSnowman(toonify,{sizes=[.62,.44,.32],parts=SNOWMAN_PARTS,seed=1,scarfColor=XMAS.santaRed}={}){
 const g=new THREE.Group();g.name='눈사람';let y=0;const balls=[];
 sizes.forEach((r,i)=>{const cy=y+r*.9;part(g,at(snowballGeometry(r,seed+i),v(0,cy,0)),XMAS.snow,{line:.9});balls.push({r,y:cy});y=cy+r*.78;});
 const head=balls.at(-1),body=balls.length>1?balls.at(-2):head,hc=v(0,head.y,0),hr=head.r,has=k=>parts.includes(k);
 const onHead=(yaw,pitch,lift=0)=>{const d=v(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));return hc.clone().addScaledVector(d,hr*.96+lift);};
 if(has('eyes'))for(const s of [-1,1])part(g,at(ell(v(hr*.11,hr*.13,hr*.07)),onHead(s*.36,.22)),XMAS.coal,{line:0});
 if(has('nose')){const p=onHead(0,.0,-.02),c=new THREE.ConeGeometry(hr*.12,hr*.62,10);c.rotateX(Math.PI/2);c.translate(0,0,hr*.3);part(g,at(c,p),XMAS.carrot,{line:.4});}
 if(has('mouth'))for(let i=0;i<5;i++){const a=(i-2)*.2;part(g,at(ell(v(hr*.06,hr*.06,hr*.05)),onHead(a,-.32+Math.abs(i-2)*.07)),XMAS.coal,{line:0});}
 if(has('arms'))for(const s of [-1,1]){const b=v(s*body.r*.92,body.y+body.r*.15,0),e=v(s*(body.r+.48),body.y+body.r*.6,.05);part(g,noodle([b,b.clone().lerp(e,.5).add(v(0,.04,0)),e],.022),XMAS.twig,{line:.4});
  const f=b.clone().lerp(e,.7);part(g,noodle([f,f.clone().add(v(s*.1,.13,0))],.016),XMAS.twig,{line:.3});part(g,noodle([e,e.clone().add(v(s*.1,-.02,.03))],.014),XMAS.twig,{line:.3});}
 if(has('scarf')){const ny=head.y-hr*.78;part(g,at(rot(new THREE.TorusGeometry(hr*.9,hr*.17,8,22),Math.PI/2),v(0,ny,0)),V=>Math.floor((Math.atan2(V.x,V.z)+Math.PI)*3)%2?scarfColor:XMAS.fur,{line:.6});
  part(g,at(rot(new THREE.BoxGeometry(hr*.32,hr*1.0,hr*.1),0,0,.15),v(hr*.45,ny-hr*.5,hr*.78)),scarfColor,{line:.5});}
 if(has('hat')){const t=grp(g,v(0,head.y+hr*.82,0));t.rotation.z=-.12;part(t,new THREE.CylinderGeometry(hr*.95,hr*.95,hr*.08,20),XMAS.topHat,{line:.6});part(t,new THREE.CylinderGeometry(hr*.62,hr*.66,hr*.8,20).translate(0,hr*.42,0),XMAS.topHat,{line:.6});part(t,new THREE.CylinderGeometry(hr*.67,hr*.67,hr*.16,20).translate(0,hr*.12,0),XMAS.hatBand,{line:0});
  part(t,new THREE.SphereGeometry(hr*.12,8,6).translate(hr*.5,hr*.18,hr*.42),XMAS.pine,{line:0});}
 finishTrailModel(g,keepGlow(toonify));bakeStatic(g,{noEdge:true});g.userData.height=y+hr*.2+(has('hat')?hr*.9:0);return g;}
// 던지는 눈덩이(손에 쥐는 크기)와 맞은 자리 눈 터짐 조각
export function thrownSnowball(toonify){const g=new THREE.Group();g.name='던지는 눈덩이';part(g,snowballGeometry(.07,3),XMAS.snow,{line:.6});return finishTrailModel(g,keepGlow(toonify),{shadow:false});}
export function snowBurst(toonify){const g=new THREE.Group();g.name='눈 터짐';const r=rng(5);for(let i=0;i<9;i++){const a=i/9*Math.PI*2,m=part(g,ell(v(.05+r()*.03,.04,.05)),XMAS.snow,{line:.3});m.position.set(Math.cos(a)*.12,(r()-.3)*.1,Math.sin(a)*.12);m.userData.dir=v(Math.cos(a),.6+r()*.6,Math.sin(a));}
 return finishTrailModel(g,keepGlow(toonify),{shadow:false});}

// ═════════════════ 썰매 ═════════════════
// 2인용 나무 썰매(길이 1.3m). 앞 +Z, 앉는 자리 높이 0.22m. 자리: 앞 z=+.24, 뒤 z=-.3(월드개발 앉기 자리).
export const SLED=Object.freeze({length:1.3,width:.56,seatY:.22,seats:Object.freeze([.24,-.3])});
export function buildSled(toonify){
 const g=new THREE.Group();g.name='썰매';
 for(const s of [-1,1]){const x=s*.24;part(g,noodle([v(x,.06,-.62),v(x,.03,-.3),v(x,.03,.4),v(x,.08,.62),v(x,.24,.7),v(x,.3,.6)],.022),XMAS.runner,{line:.5});
  for(const z of [-.45,0,.42])rod(g,v(x,.04,z),v(x,.19,z),.018,XMAS.woodDark,{line:.4});
  boxAt(g,v(.05,.06,1.2),v(s*.29,.25,-.02),XMAS.woodDark,{line:.5});}
 for(let i=0;i<6;i++)boxAt(g,v(.6,.035,.17),v(0,.2,-.5+i*.2),XMAS.sled,{line:.6});
 boxAt(g,v(.6,.2,.05),v(0,.29,.6),XMAS.sled,{line:.6});
 // 끈
 part(g,noodle([v(-.24,.28,.68),v(-.12,.3,.9),v(.12,.3,.9),v(.24,.28,.68)],.012),XMAS.santaRed,{line:.3});
 finishTrailModel(g,keepGlow(toonify));return bakeStatic(g);}

// ═════════════════ 마당·언덕·광장 소품 ═════════════════
// 낮은 눈벽: 둥근 눈 벽돌 두 줄(길이 len, 높이 h). 가운데가 원점, x 방향으로 길다.
export function buildSnowWall(toonify,{len=3,h=.7,seed=1}={}){
 const g=new THREE.Group();g.name='눈벽';const r=rng(seed),bl=[];
 const rows=Math.max(2,Math.round(h/.34));
 for(let row=0;row<rows;row++){const n=Math.max(2,Math.round(len/.55)),w=len/n,off=row%2?w/2:0;
  for(let i=0;i<n;i++){const x=-len/2+w/2+i*w+off-(row%2?w/4:0);if(Math.abs(x)>len/2)continue;bl.push([tr(ell(v(w*.56,h/rows*.62,.32),{w:12,h:8,shape:V=>{V.x=Math.sign(V.x)*Math.pow(Math.abs(V.x),.6);V.y=Math.sign(V.y)*Math.pow(Math.abs(V.y),.7);}}),x,h/rows*(row+.5),(r()-.5)*.04),row%2?XMAS.snow:XMAS.snowPacked]);}}
 part(g,mergePainted(bl),null,{line:.7});
 part(g,at(lump(len*.52,.1,.3,seed),v(0,h,0)),XMAS.snow,{line:.4});
 finishTrailModel(g,keepGlow(toonify));return bakeStatic(g,{noEdge:true});}
// 가로등(짙은 초록 철 기둥 + 등 + 화환 리본). 등은 밤에 빛나고 바닥 빛을 받는다.
export function buildLamp(toonify){
 const g=new THREE.Group();g.name='가로등';const iron='#3e5b48';
 part(g,new THREE.CylinderGeometry(.13,.16,.2,12).translate(0,.1,0),iron,{line:.6});rod(g,v(0,.2,0),v(0,2.35,0),.05,iron,{line:.6});
 boxAt(g,v(.32,.06,.32),v(0,2.38,0),iron,{line:.5});part(g,new THREE.ConeGeometry(.28,.22,4).rotateY(Math.PI/4).translate(0,2.95,0),iron,{line:.6});
 for(const [x,z] of [[.13,.13],[-.13,.13],[.13,-.13],[-.13,-.13]])rod(g,v(x,2.4,z),v(x,2.84,z),.012,iron,{line:.3});
 part(g,at(lump(.24,.07,.24,2),v(0,3.02,0)),XMAS.snow,{line:.4});
 // 기둥 화환과 빨간 리본
 part(g,at(rot(new THREE.TorusGeometry(.12,.05,8,16),Math.PI/2),v(0,1.7,0)),XMAS.pine,{line:.4});
 for(const s of [-1,1])part(g,at(rot(new THREE.TorusGeometry(.05,.02,6,10),0,0,s*.6),v(s*.05,1.7,.13)),XMAS.santaRed,{line:.3});
 finishTrailModel(g,keepGlow(toonify));bakeStatic(g);
 const bulb=glowPart(g,new THREE.BoxGeometry(.22,.4,.22).translate(0,2.62,0),XMAS.lamp,1.35);
 return {group:g,bulb,lightY:2.62};
}
// 울타리 한 칸(기둥 둘 + 가로대 둘, 기둥 위 눈). 길이 len, x 방향.
export function fenceGeometry(len=2.4){const L=[];
 for(const s of [-1,1]){L.push([new THREE.BoxGeometry(.12,1,.12).translate(s*len/2,.5,0),XMAS.fence]);L.push([tr(lump(.1,.06,.1,s+3),s*len/2,1.0,0),XMAS.snow]);}
 for(const y of [.4,.75])L.push([new THREE.BoxGeometry(len,.09,.06).translate(0,y,.0),XMAS.fence]);
 L.push([new THREE.BoxGeometry(len,.05,.08).translate(0,.81,0),XMAS.snow]);
 return mergePainted(L);}
// 눈 덮인 전나무(배경용, 꼭짓점 색 한 형상): 3단 원뿔 + 단마다 눈. InstancedMesh로 많이 심는다.
export function pineGeometry(seed=1){const r=rng(seed),L=[];
 L.push([new THREE.CylinderGeometry(.12,.16,.7,8).translate(0,.35,0),XMAS.bark]);
 const t=[[.5,2.2,1.25],[1.3,3,.98],[2.1,3.7,.68]];
 for(const [y0,y1,rr] of t){const c=new THREE.ConeGeometry(rr,y1-y0,10,2);c.translate(0,(y0+y1)/2,0);L.push([c,V=>{const k=(V.y-y0)/(y1-y0);return (k<.3&&((Math.sin(Math.atan2(V.x,V.z)*5+seed)+1)/2>.45))||k>.85?XMAS.snow:k<.3?XMAS.firDark:XMAS.fir;}]);}
 return mergePainted(L);}
// 마당·언덕 팻말(나무 기둥 + 글자판)
export function buildSign(toonify,lines,{w=1.2,h=.42}={}){const g=new THREE.Group();g.name='팻말';
 boxAt(g,v(.08,1.2,.08),v(0,.6,0),XMAS.woodDark,{line:.5});boxAt(g,v(w+.06,h+.06,.07),v(0,1.15,0),XMAS.wood,{line:.6});part(g,at(lump(w*.5,.06,.06,7),v(0,1.15+h/2+.03,0)),XMAS.snow,{line:.3});
 textPlane(g,lines,w,h,{bg:XMAS.wood,fg:'#3f2a1a',p:v(0,1.15,.04),size:.5,px:128});finishTrailModel(g,keepGlow(toonify));return bakeStatic(g);}
// 마당 경계 깃발(짧은 기둥 + 세모 깃)
export function flagPostGeometry(color){const L=[[new THREE.CylinderGeometry(.035,.04,.9,8).translate(0,.45,0),XMAS.woodDark]];
 const sh=new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(.3,-.09),new THREE.Vector2(0,-.18)]);L.push([new THREE.ExtrudeGeometry(sh,{depth:.015,bevelEnabled:false}).translate(.03,.88,0),color]);return mergePainted(L);}
// 전시 자리(눈 받침 + 이름 팻말 말뚝). 이름은 월드개발이 글자판으로 붙인다(이름판 자리 = plate).
export function buildDisplayBase(toonify){const g=new THREE.Group();g.name='눈사람 전시 자리';
 part(g,new THREE.CylinderGeometry(.85,.95,.12,24).translate(0,.06,0),XMAS.snowPacked,{line:.6});
 const plate=grp(g,v(0,0,1.05));boxAt(plate,v(.05,.42,.05),v(0,.21,0),XMAS.woodDark,{line:.4});boxAt(plate,v(.56,.2,.04),v(0,.42,.02),XMAS.wood,{line:.5});plate.name='이름판';
 finishTrailModel(g,keepGlow(toonify));bakeStatic(g,{noEdge:true});return {group:g,plate};}
// 썰매 출발대: 나무 받침 + 난간 + 줄 표시 3개(색 깃발)
export function buildSledDeck(toonify,{w=5.2,d=2.6,lanes=3,legs=[1,1,1,1]}={}){const g=new THREE.Group();g.name='썰매 출발대';
 for(let i=0;i<Math.round(w/.3);i++)boxAt(g,v(.28,.08,d),v(-w/2+.15+i*.3,.04,0),XMAS.wood,{line:.5});
 const posts=[[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]];posts.forEach(([x,z],i)=>boxAt(g,v(.12,.9+legs[i],.12),v(x,(.9-legs[i])/2,z),XMAS.woodDark,{line:.5}));
 boxAt(g,v(w,.08,.08),v(0,.85,-d/2),XMAS.woodDark,{line:.5});for(const s of [-1,1])boxAt(g,v(.08,.08,d),v(s*w/2,.85,0),XMAS.woodDark,{line:.5});
 for(let i=0;i<lanes;i++){const x=(i-(lanes-1)/2)*(w/lanes);boxAt(g,v(.06,.012,d*.9),v(x+w/lanes/2*(i<lanes-1?1:0)*0,.085,0),'#f6efdc',{line:0});
  const f=grp(g,v(x,0,-d/2-.02));part(f,flagPostGeometry(XMAS.flag[i%4]),null,{line:.4});}
 part(g,at(lump(w*.5,.08,.2,3),v(0,.9,-d/2)),XMAS.snow,{line:.3});
 finishTrailModel(g,keepGlow(toonify));return bakeStatic(g);}
// 마을 입구 아치: 지팡이 사탕 줄무늬 기둥 둘 + 전나무 화환 아치 + 전구 + 「눈마을 광장」 간판 + 리본. 앞 +Z(입구 밖)에서 보면 글자가 읽힌다.
export function buildArch(toonify){
 const g=new THREE.Group();g.name='마을 입구 아치';const W=ENTRANCE.w,Hh=ENTRANCE.h;
 for(const s of [-1,1]){const x=s*W/2;
  part(g,paint(new THREE.CylinderGeometry(.16,.18,Hh,16,24).translate(x,Hh/2,0),V=>Math.floor(V.y*3.4+Math.atan2(V.x-x,V.z)/Math.PI+8)%2?XMAS.candyStripe:XMAS.candy),null,{line:.8});
  part(g,new THREE.CylinderGeometry(.26,.3,.2,16).translate(x,.1,0),XMAS.stoneDark,{line:.6});
  part(g,at(lump(.24,.09,.24,s+5),v(x,Hh+.02,0)),XMAS.snow,{line:.4});}
 // 아치(반원보다 납작한 곡선) 화환
 const arc=[];for(let i=0;i<=24;i++){const t=i/24,a=Math.PI*(1-t);arc.push(v(Math.cos(a)*W/2,Hh+Math.sin(a)*.9,0));}
 part(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),64,.17,10,false),XMAS.pine,{line:.7});
 // 화환에 듬성듬성 얹힌 눈
 for(let i=2;i<23;i+=3){const p=arc[i];part(g,at(lump(.16,.07,.14,i),v(p.x,p.y+.14,0)),XMAS.snow,{line:.3});}
 // 간판
 const sign=grp(g,v(0,Hh+.15,.12));boxAt(sign,v(2.2,.52,.08),v(0,0,0),XMAS.wood,{line:.7});
 for(const s of [-1,1])rod(sign,v(s*.8,.26,0),v(s*.8,.62,0),.015,XMAS.goldDark,{line:.3});
 textPlane(sign,['눈마을 광장'],2.04,.4,{bg:'#8a5a34',fg:'#e8d6ae',p:v(0,0,.045),size:.62,px:128,border:XMAS.goldDark});
 // 꼭대기 리본
 for(const s of [-1,1])part(g,at(rot(new THREE.TorusGeometry(.16,.06,8,14),0,0,s*.6),v(s*.16,Hh+.98,.05)),XMAS.santaRed,{line:.5});
 part(g,new THREE.SphereGeometry(.07,10,8).translate(0,Hh+.96,.08),XMAS.santaRedDark,{line:.4});
 finishTrailModel(g,keepGlow(toonify),{lineScale:1.3});bakeStatic(g);
 // 아치 전구
 const n=22,bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.06,8,6).scale(1,1.3,1),new THREE.MeshBasicMaterial({color:'#ffffff'}),n),M=new THREE.Matrix4(),c=new Color(),curve=new THREE.CatmullRomCurve3(arc);bulbs.name='아치 전구';
 for(let i=0;i<n;i++){const p=curve.getPointAt((i+.5)/n);bulbs.setMatrixAt(i,M.makeTranslation(p.x,p.y-.05,.16));bulbs.setColorAt(i,c.set(XMAS.bulbs[i%XMAS.bulbs.length]).multiplyScalar(1.5));}
 g.add(bulbs);return {group:g,bulbs};
}
