// 남산 5단계 상호작용 그림(월드아트, 11-19): 약수터·손 담그는 물확·돌탑 무리·사랑의 자물쇠 난간.
// 화풍은 관악산과 같다: MeshStandard(꼭짓점 색)로 만들고 붙이는 쪽이 toon.toonify(group,{kind:'prop'})로 카툰 재질로 바꾼다.
// 약수터·돌탑은 관악산 모양(assets/realistic/interaction-props.js)을 그대로 쓰고, 물확·자물쇠 난간은 새 게임 소품이다.
// 실제 장소를 따라 하지 않는다(남산엔 계곡이 없어 돌 물확 + 짧은 실개천, 자물쇠 난간은 「전망탑 둘레에 자물쇠를 거는 곳」이라는 특징만).
// 동작·판정·저장은 월드개발 몫. 이 파일은 그림과 자리(spots), 자물쇠 걸기 표현(hang·aim)만 준다.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {springModel,SPRING,cairnModel,CAIRN_FIELD,rockGeometry} from '../../assets/realistic/interaction-props.js';
import {NAMSAN,courseAt} from './namsan-data.js';
import {WALL,wallLine} from './namsan-art.js';

// 배치·크기 기준(게임 디자인 값, m)
export const INTERACT=Object.freeze({
 spring:{near:NAMSAN.rest.s,range:[735,805],gap:.55},  // 중간 쉼터 옆, 쉼터 데크 반대쪽(언덕 쪽) 길가
 basins:[{id:'dip-1',want:300,range:[150,420]},{id:'dip-2',want:930,range:[860,1010]}], // 손 담그는 돌 물확 2곳(아래·위)
 basin:{r:.6,gap:.75,runnel:3.2},                     // 물확 반지름, 길 가장자리와 틈, 넘친 물 실개천 길이
 cairn:{out:4.2,wallClear:8,spread:1.25},              // 정상 광장 돌 테 밖 4.2m, 성곽에서 8m 이상, 관악산 돌탑 공터 배치를 1.25배로 벌림
 locks:{inset:.9,bays:6,bay:1.6,bars:[.46,.66,.86],pitch:.11,openBay:4}, // 정상 광장 돌 테 안쪽 0.9m 둘레 호(전망탑에 가까운 가장자리), 6칸 × 1.6m, 자물쇠 거는 쇠줄 3줄
 cull:160,                                            // 카메라에서 이보다 멀면 숨김(휴대폰)
});
export const INTERACT_COLORS=Object.freeze({
 pad:'#a9a395',padDark:'#8f897c',granite:'#b5ae a2'.replace(' ',''),bamboo:'#8fb35a',bambooNode:'#6e8f43',water:'#7ec6df',waterNight:'#2c5f78',foam:'#e8f6fa',
 gravel:'#b9ad94',pole:'#4b5d53',trim:'#33413a',wood:'#7b5636',steel:'#9aa2a8',brass:'#c9a35a',heart:'#e8505f',
 empty:'#fff1c2',aim:'#ffd84a',
 locks:['#e8504a','#ff8fb0','#ffd25a','#6fcf9a','#5fb6ff','#a77bff','#f39a3c','#f2ece0','#d84a7a','#3fb3b0'],
});

const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const _c=new THREE.Color();
// 꼭짓점 색 조각: 인덱스 없애고 position·normal·color만 남긴다(한 덩어리로 합치기 위해)
function paint(g,hex){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
 if(hex!=null){_c.set(hex);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_c.r,_c.g,_c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));}
 if(!g.attributes.normal)g.computeVertexNormals();return g;}
const rock=(rx,ry,rz,seed,hex,detail=0)=>paint(rockGeometry(rx,ry,rz,seed,detail,hex!=null?new THREE.Color(hex).getHex():null));
function vmesh(parts,name,{shadow=true}={}){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}));m.name=name;m.castShadow=shadow;m.receiveShadow=true;return m;}
function heartShape(){const s=new THREE.Shape();s.moveTo(0,-.5);s.bezierCurveTo(-.15,-.3,-.6,-.1,-.5,.22);s.bezierCurveTo(-.4,.55,-.05,.5,0,.25);s.bezierCurveTo(.05,.5,.4,.55,.5,.22);s.bezierCurveTo(.6,-.1,.15,-.3,0,-.5);return s;}

// ── 자리 정하기(three 그림 없음, 점검에서도 씀) ──
// 반환: {spring:{x,y,z,yaw,s,side}, basins:[{id,x,y,z,yaw,s,side,runnel:[{x,z}]}], cairn:{x,y,z,yaw}, locks:{x,y,z,a0,radius}}
// yaw = 소품 앞(+Z)이 보는 쪽(rotation.y). 소품 앞에 사람이 선다.
export function planNamsanInteract(G,{walls=[],lamps=[],lanterns=[],items=[]}={}){
 const pts=G.points,half=NAMSAN.pathWidth/2,tw=NAMSAN.tower,P=G.plaza;
 const wallP=walls.map(w=>wallLine(G,w)).filter(Boolean).flatMap(l=>l.P);
 const nearWall=(x,z)=>{let d=Infinity;for(const p of wallP){const v=(p.x-x)**2+(p.z-z)**2;if(v<d)d=v;}return Math.sqrt(d);};
 const nearList=(list,x,z)=>list.reduce((d,p)=>Math.min(d,Math.hypot(p.x-x,p.z-z)),Infinity);
 const busD=(x,z)=>G.bus?Math.min(G.bus.nearest(x,z).distance-G.bus.points[0].width/2,G.bus.cycle.nearest(x,z).distance-1):Infinity;
 const plazaD=(x,z)=>Math.min(...[G.plaza,G.startPlaza].map(Q=>Math.hypot(x-Q.x,z-Q.z)-Q.r));
 const relief=(x,z,r)=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<9;i++){const a=i/8*Math.PI*2,k=i===8?0:r,y=G.ground(x+Math.cos(a)*k,z+Math.sin(a)*k);lo=Math.min(lo,y);hi=Math.max(hi,y);}return hi-lo;};
 const lampXZ=lamps.map(l=>({x:l.x,z:l.z})),stuff=[...lanterns,...items.filter(i=>i.x!=null&&i.kind!=='rest')];
 const busyOK=(x,z,lampGap=1.9)=>nearList(lampXZ,x,z)>lampGap&&nearList(stuff,x,z)>2.2;
 // 길가 한 점: 코스 s의 side쪽으로 off m
 const edge=(s,side,off)=>{const m=courseAt(pts,s);return {m,x:m.x+m.nx*off*side,z:m.z+m.nz*off*side};};

 // 1) 약수터: 쉼터 데크 반대쪽, 길 가장자리에서 0.55m 띄워 앞(물받이)이 길을 봄. 소품 깊이 약 1.5m(뒤 바위 -1 ~ 물받이 앞 +0.47)
 const restItem=items.find(i=>i.kind==='rest'),sSide=-(G.restSide??1);
 let spring=null;{let best=-Infinity;
  for(let s=INTERACT.spring.range[0];s<=INTERACT.spring.range[1];s+=1.5)for(const side of [sSide,-sSide]){
   const off=(courseAt(pts,s).stairs?NAMSAN.stairWidth/2:half)+INTERACT.spring.gap+.47,{m,x,z}=edge(s,side,off);
   if(G.nearest(x,z).distance<off-.3||nearWall(x,z)<WALL.thick/2+2.2||!busyOK(x,z,2.4)||busD(x,z)<4||plazaD(x,z)<3)continue;
   if(restItem&&Math.hypot(restItem.x-x,restItem.z-z)<4.5)continue;
   const score=-Math.abs(s-INTERACT.spring.near)*.08-relief(x,z,1.1)*3-(side===sSide?0:4)-(m.stairs?1.5:0);
   if(score>best){best=score;spring={x,z,y:G.ground(x,z),yaw:Math.atan2(-m.nx*side,-m.nz*side),s,side};}}}

 // 2) 물확 2곳: 성곽 반대쪽 숲 가장자리, 평평한 곳. 넘친 물은 길에서 멀어지는 내리막으로 3.2m 흐른다.
 const basins=[];
 for(const want of INTERACT.basins){let best=null,bs=-Infinity;
  for(let s=want.range[0];s<=want.range[1];s+=3)for(const side of [1,-1]){
   const m0=courseAt(pts,s);if(m0.stairs)continue;
   const off=half+INTERACT.basin.gap+INTERACT.basin.r,{m,x,z}=edge(s,side,off);
   if(G.nearest(x,z).distance<off-.3||nearWall(x,z)<WALL.thick/2+2.4||!busyOK(x,z)||busD(x,z)<5||plazaD(x,z)<4)continue;
   if(spring&&Math.hypot(spring.x-x,spring.z-z)<30)continue;
   const rel=relief(x,z,1.3);if(rel>.7)continue;
   // 실개천: 길에서 멀어지는 쪽(side)으로 기울인 방향 중 3.2m 뒤 가장 낮은 쪽
   let run=null,drop=-Infinity;for(const t of [-.9,-.5,0,.5,.9]){const dx=m.nx*side+m.tx*t,dz=m.nz*side+m.tz*t,L=Math.hypot(dx,dz),ex=x+dx/L*(INTERACT.basin.r+INTERACT.basin.runnel),ez=z+dz/L*(INTERACT.basin.r+INTERACT.basin.runnel);
    if(G.nearest(ex,ez).distance<half+1.2||nearWall(ex,ez)<WALL.thick/2+1)continue;const d=G.ground(x,z)-G.ground(ex,ez);if(d>drop){drop=d;run={dx:dx/L,dz:dz/L};}}
   if(!run)continue;
   const score=-Math.abs(s-want.want)*.02-rel*4+Math.min(drop,1.2)*1.5+G.forestK(x,z)*1.5;
   if(score>bs){bs=score;best={id:want.id,x,z,y:G.ground(x,z),yaw:Math.atan2(-m.nx*side,-m.nz*side),s,side,run};}}
  if(best){const {x,z,run}=best,pts2=[],R=INTERACT.basin.r,L=INTERACT.basin.runnel,n=Math.round(L/.3);
   const px=-run.dz,pz=run.dx;for(let i=0;i<=n;i++){const t=i/n,d=R-.08+t*L,w=Math.sin(t*Math.PI*1.6)*.28*t;pts2.push({x:x+run.dx*d+px*w,z:z+run.dz*d+pz*w});}
   best.runnel=pts2;delete best.run;basins.push(best);}}

 // 3) 돌탑 무리: 정상 광장 돌 테 밖 둘레에서, 성곽·버스·코스·가로등·탑과 가장 떨어진 평평한 곳
 let cairn=null;{let best=-Infinity;const R=P.r+INTERACT.cairn.out;
  for(let i=0;i<144;i++){const a=i/144*Math.PI*2,x=P.x+Math.cos(a)*R,z=P.z+Math.sin(a)*R;
   const wd=nearWall(x,z),cd=G.nearest(x,z).distance,bd=busD(x,z),ld=nearList(lampXZ,x,z),rel=relief(x,z,2.6);
   if(wd<INTERACT.cairn.wallClear||cd<6||bd<5||ld<4||rel>.7)continue;
   const score=Math.min(wd,20)*.3+Math.min(cd,25)*.2+Math.min(bd,20)*.1-rel*3;
   if(score>best){best=score;cairn={x,z,y:G.ground(x,z),yaw:Math.atan2(P.x-x,P.z-z),a};}}}

 // 4) 사랑의 자물쇠 난간: 정상 광장 가장자리(돌 테 안쪽 0.9m) 호. 전망탑에 가장 가까운 가장자리 쪽 = 「전망대 난간」. 바깥(전망)을 보고 선다
 let locks=null;{const L=INTERACT.locks,R=P.r-L.inset,span=L.bays*L.bay/R,end=pts.at(-1),stone=items.find(i=>i.kind==='summit-stone');let best=-Infinity;
  for(let k=0;k<144;k++){const a0=k/144*Math.PI*2;let ok=true,minC=Infinity;
   for(let j=0;j<=12;j++){const f=a0-span/2+span*j/12,x=P.x+Math.sin(f)*R,z=P.z+Math.cos(f)*R;
    const c=Math.min(busD(x,z)-2.5,Math.hypot(x-end.x,z-end.z)-9,stone?Math.hypot(x-stone.x,z-stone.z)-5:99,nearList(lampXZ,x,z)-2.6,cairn?Math.hypot(x-cairn.x,z-cairn.z)-10:99,nearWall(x,z)-4);
    if(c<0){ok=false;break;}minC=Math.min(minC,c);}
   if(!ok)continue;const mx=P.x+Math.sin(a0)*R,mz=P.z+Math.cos(a0)*R,score=-Math.hypot(mx-tw.x,mz-tw.z)*.25+Math.min(minC,4)*.3+Math.cos(a0)*1.5; // 탑 가까이·남쪽(관악산 쪽) 조금 우선
   if(score>best){best=score;locks={x:P.x,z:P.z,y:P.y+.04,a0,radius:R,span};}}}
 return {spring,basins,cairn,locks};
}

// ── 그림 1: 물확(돌 물그릇 + 대나무 홈통 + 둘레 돌) — 로컬 원점 = 물그릇 바닥 가운데, 앞(+Z) = 길 ──
export const BASIN={waterY:.44,rimY:.5,spout:[0,.63,-.24]};
function basinParts(seed){
 const C=INTERACT_COLORS,stone=[],water=[];
 // 물그릇: 8각 깎은 화강암(아래는 땅속 0.35m까지)
 const prof=[[0,-.35],[.5,-.35],[.56,0],[.6,.3],[.58,.45],[.53,.5],[.42,.5],[.4,.45],[.3,.32],[0,.28]].map(([r,y])=>new THREE.Vector2(r,y));
 const bowl=new THREE.LatheGeometry(prof,8);bowl.rotateY(Math.PI/8);stone.push(paint(bowl,C.granite));
 water.push(paint(new THREE.CircleGeometry(.405,16).rotateX(-Math.PI/2).translate(0,BASIN.waterY,0),C.water));
 // 대나무 홈통: 뒤에 받침 기둥(돌) + 비스듬한 대롱(마디 2개)
 stone.push(rock(.16,.32,.14,seed*7+1,C.padDark).translate(0,.18,-.82));
 const a=new THREE.Vector3(0,.82,-.86),b=new THREE.Vector3(...BASIN.spout),d=b.clone().sub(a);
 const pipe=new THREE.CylinderGeometry(.045,.045,d.length(),8);pipe.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));pipe.translate(...a.clone().add(b).multiplyScalar(.5).toArray());stone.push(paint(pipe,C.bamboo));
 for(const t of [.3,.68]){const p=a.clone().lerp(b,t),n=new THREE.CylinderGeometry(.052,.052,.035,8);n.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));n.translate(p.x,p.y,p.z);stone.push(paint(n,C.bambooNode));}
 // 떨어지는 물줄기
 water.push(paint(new THREE.CylinderGeometry(.012,.018,BASIN.spout[1]-BASIN.waterY,6).translate(BASIN.spout[0],(BASIN.spout[1]+BASIN.waterY)/2,BASIN.spout[2]+.02),C.foam));
 // 둘레 납작 돌(디딤돌 앞 1개 크게)
 stone.push(rock(.42,.07,.3,seed*7+3,C.pad).translate(0,.02,.92));
 for(let i=0;i<6;i++){const ang=Math.PI*.55+i/5*Math.PI*.9+(hash(seed+i)-.5)*.2,r=.78+hash(seed*3+i)*.12;stone.push(rock(.12+.06*hash(seed+i*2),.07,.1+.05*hash(seed+i*5),seed*31+i,i%2?C.padDark:C.pad).translate(Math.cos(ang)*r,.03,-Math.sin(ang)*r*-1));}
 return {stone,water};
}

// ── 그림 2: 사랑의 자물쇠 난간(로컬 원점 = 전망탑 가운데, 호 가운데가 +Z) ──
function lockFenceParts(L,R){
 const C=INTERACT_COLORS,n=L.bays,span=n*L.bay/R,parts=[];
 const at=(f,r=R)=>[Math.sin(f)*r,Math.cos(f)*r];
 const posts=[];for(let i=0;i<=n;i++)posts.push(-span/2+span*i/n);
 const beam=(p,q,r,hex,seg=6)=>{const A=new THREE.Vector3(...p),B=new THREE.Vector3(...q),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,d.length(),seg);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());return paint(g,hex);};
 for(const [i,f] of posts.entries()){const [x,z]=at(f),big=i===n/2;
  parts.push(paint(new THREE.BoxGeometry(.3,.12,.3).rotateY(f).translate(x,.06,z),C.trim));       // 받침
  parts.push(paint(new THREE.BoxGeometry(.13,1.12,.13).rotateY(f).translate(x,.56,z),C.pole));    // 기둥
  parts.push(paint(new THREE.SphereGeometry(big?.09:.065,8,6).translate(x,1.2,z),C.brass));}       // 꼭지
 for(let i=0;i<n;i++){const f0=posts[i],f1=posts[i+1],[x0,z0]=at(f0),[x1,z1]=at(f1);
  const top=new THREE.BoxGeometry(.16,.07,Math.hypot(x1-x0,z1-z0));top.rotateY(Math.atan2(x1-x0,z1-z0));top.translate((x0+x1)/2,1.1,(z0+z1)/2);parts.push(paint(top,C.wood)); // 나무 손잡이
  for(const y of L.bars)parts.push(beam([x0,y,z0],[x1,y,z1],.013,C.steel));}                   // 쇠줄(자물쇠 거는 곳)
 // 가운데 기둥 위 하트 장식(글자 없음)
 const h=new THREE.ExtrudeGeometry(heartShape(),{depth:.12,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1,curveSegments:8});h.translate(0,0,-.06);h.scale(.42,.42,.42);
 const [hx,hz]=at(0);parts.push(paint(h.translate(hx,1.48,hz),C.heart));
 parts.push(beam([hx,1.2,hz],[hx,1.3,hz],.03,C.brass));
 return {parts,posts,span};
}
// 자물쇠 자리: 칸마다 쇠줄 3줄 × 0.11m. filled는 정해진 무늬(가운데 칸 빽빽, openBay는 듬성 — 새 자물쇠 걸 빈 자리)
function lockSlots(L,R){
 const span=L.bays*L.bay/R,slots=[];
 for(let b=0;b<L.bays;b++)for(const [k,y] of L.bars.entries()){const m=Math.floor((L.bay-.24)/L.pitch)+1;
  for(let j=0;j<m;j++){const f=-span/2+(b*L.bay+.12+j*L.pitch+(k%2)*L.pitch*.5)/R;if(f>-span/2+(b+1)*L.bay/R-.08/R)continue;
   const id=slots.length,hh=hash(id*1.37+b*9.1),open=b===L.openBay,mid=Math.abs(b-(L.bays-1)/2)<1.2;
   const filled=open?hh<.3:hh<(mid?.86:.72);
   slots.push({i:id,bay:b,bar:k,f,y,filled,color:INTERACT_COLORS.locks[Math.floor(hash(id*7.7)*INTERACT_COLORS.locks.length)],heart:hash(id*3.3)<.22,scale:.85+hash(id*5.1)*.4,tilt:(hash(id*2.9)-.5)*.5});}}
 return slots;
}

// ── 조립 ──
// 붙이는 쪽: const ia=buildNamsanInteract(G,{walls:data.walls,lamps:ns.lamps.userData.spots,lanterns:ns.lanterns.userData.spots,items:ns.furniture.userData.items});
//   toon.toonify(ia,{kind:'prop'});scene.add(ia);  매 프레임 ia.userData.update(t,night,camera)
export function buildNamsanInteract(G,opts={}){
 const plan=planNamsanInteract(G,opts),C=INTERACT_COLORS,root=new THREE.Group();root.name='남산 상호작용 소품';
 const spots=[],parts={},waterMats=[],cullables=[];

 // 1) 약수터(관악산 springModel 그대로 + 아래 돌판 받침: 경사에서 물받이가 뜨지 않게)
 if(plan.spring){const sp=plan.spring,g=new THREE.Group();g.name='약수터';g.position.set(sp.x,sp.y,sp.z);g.rotation.y=sp.yaw;
  const model=springModel(0);g.add(model);
  // 물받이 물은 관악산과 같은 재질을 나눠 쓰므로 복사해서 밤에만 살짝 비치게(관악산 화면은 그대로)
  model.traverse(o=>{if(o.isMesh&&o.name==='water'){o.material=o.material.clone();o.material.emissive=new THREE.Color(C.waterNight);o.material.emissiveIntensity=0;o.userData.nightGlow=.3;waterMats.push(o);}});
  const cs=Math.cos(sp.yaw),sn=Math.sin(sp.yaw),w=(lx,lz)=>[sp.x+lx*cs+lz*sn,sp.z-lx*sn+lz*cs];
  let lo=0;for(const [lx,lz] of [[-.95,.55],[.95,.55],[-.95,-.3],[1.1,-.3],[0,.55]]){const [x,z]=w(lx,lz);lo=Math.min(lo,G.ground(x,z)-sp.y);}
  const pad=[paint(new THREE.BoxGeometry(2.5,.16-lo+.3,1.25).translate(.1,(.12+lo-.3)/2,.12),C.pad)];
  for(let i=0;i<4;i++)pad.push(rock(.2+.08*hash(i+3),.08,.16,90+i,C.padDark).translate(-1.05+i*.7,.1,.82));
  const padMesh=vmesh(pad,'약수터 돌판');g.add(padMesh);root.add(g);parts.spring=g;cullables.push(g);
  g.updateMatrixWorld(true);const fill=new THREE.Vector3(...SPRING.spout).applyMatrix4(g.matrixWorld);
  const [fx,fz]=w(0,1.25);
  spots.push({id:'spring-1',kind:'spring',action:'drink',x:fx,z:fz,y:G.ground(fx,fz),face:sp.yaw+Math.PI,radius:2.2,fillAt:fill.toArray().map(v=>+v.toFixed(2)),s:+sp.s.toFixed(1),object:'약수터 / 물바가지'});}

 // 2) 물확 2곳(돌·물 각각 한 덩어리 + 실개천 물길)
 if(plan.basins.length){const stone=[],water=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),one=new THREE.Vector3(1,1,1);
  for(const [k,b] of plan.basins.entries()){const pb=basinParts(k+1);m4.compose(new THREE.Vector3(b.x,b.y,b.z),q.setFromAxisAngle(up,b.yaw),one);
   for(const g of pb.stone)stone.push(g.applyMatrix4(m4));for(const g of pb.water)water.push(g.applyMatrix4(m4));
   // 실개천: 폭 0.32m 물 띠(땅 위 5cm) + 양쪽 자갈 + 끝 작은 웅덩이
   const P=b.runnel;for(let i=0;i<P.length-1;i++){const a=P[i],c=P[i+1],dx=c.x-a.x,dz=c.z-a.z,L=Math.hypot(dx,dz)||1,nx=-dz/L*.16,nz=dx/L*.16,w=.75+.25*Math.min(1,i/3);
    const ya=i===0?b.y+BASIN.waterY-.12:G.ground(a.x,a.z)+.05,yc=G.ground(c.x,c.z)+.05;
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([a.x-nx*w,ya,a.z-nz*w, a.x+nx*w,ya,a.z+nz*w, c.x-nx,yc,c.z-nz, a.x+nx*w,ya,a.z+nz*w, c.x+nx,yc,c.z+nz, c.x-nx,yc,c.z-nz],3));g.computeVertexNormals();water.push(paint(g,C.water));
    if(i%2===0)for(const sd of [-1,1]){const r=.07+.05*hash(k*50+i*3+sd);stone.push(rock(r,.05,r*.9,k*97+i*5+sd,hash(i+sd)<.5?C.pad:C.padDark).translate(a.x+nx*sd*2.1,G.ground(a.x+nx*sd*2.1,a.z+nz*sd*2.1)+.02,a.z+nz*sd*2.1));}}
   const e=P.at(-1);water.push(paint(new THREE.CircleGeometry(.5,12).rotateX(-Math.PI/2).translate(e.x,G.ground(e.x,e.z)+.06,e.z),C.water));
   for(let i=0;i<7;i++){const a=i/7*Math.PI*2;stone.push(rock(.1,.06,.09,k*71+i,i%2?C.pad:C.padDark).translate(e.x+Math.cos(a)*.58,G.ground(e.x+Math.cos(a)*.58,e.z+Math.sin(a)*.58)+.02,e.z+Math.sin(a)*.58));}
   const sx=b.x+Math.sin(b.yaw)*.95,sz=b.z+Math.cos(b.yaw)*.95;
   spots.push({id:b.id,kind:'stream',action:'dip',x:sx,z:sz,y:G.ground(sx,sz),face:b.yaw+Math.PI,radius:1.8,waterAt:[+b.x.toFixed(2),+(b.y+BASIN.waterY).toFixed(2),+b.z.toFixed(2)],s:+b.s.toFixed(1),object:'물확'});}
  const g=new THREE.Group();g.name='손 담그는 물확';const sm=vmesh(stone,'물확 돌');g.add(sm);
  const wm=new THREE.Mesh(mergeGeometries(water,false),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.15,emissive:new THREE.Color(C.waterNight),emissiveIntensity:0}));water.forEach(x=>x.dispose());wm.name='물확 물';wm.receiveShadow=true;wm.userData.nightGlow=.22;g.add(wm);waterMats.push(wm);
  // 물결 고리(물확마다 1개, 퍼졌다 사라짐)
  const ripples=plan.basins.map(b=>{const r=new THREE.Mesh(new THREE.RingGeometry(.1,.13,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:C.foam,transparent:true,opacity:.7,depthWrite:false}));r.position.set(b.x,b.y+BASIN.waterY+.005,b.z);r.name='물결';r.userData.noToon=true;g.add(r);return r;});
  g.userData.ripples=ripples;root.add(g);parts.basins=g;cullables.push(...ripples);}

 // 3) 돌탑 무리(관악산 돌탑 모양 cairnModel 7기, 배치를 1.25배로 벌림) + 땅을 따라 깐 자갈 바닥 + 올릴 돌 무더기. 돌탑마다 제 자리 땅 높이에 세운다
 if(plan.cairn){const c=plan.cairn,g=new THREE.Group();g.name='돌탑 무리';g.position.set(c.x,0,c.z);g.rotation.y=c.yaw;
  const cs=Math.cos(c.yaw),sn=Math.sin(c.yaw),gy=(lx,lz)=>G.ground(c.x+lx*cs+lz*sn,c.z-lx*sn+lz*cs),K=INTERACT.cairn.spread;
  const stones=[],m4=new THREE.Matrix4();let top=null;
  for(const cf of CAIRN_FIELD){const lx=cf.x*K,lz=cf.z*K,y=gy(lx,lz)-.04,m=cairnModel(0,cf);m.updateMatrixWorld(true);m4.makeTranslation(lx,y,lz);
   m.traverse(o=>{if(o.isMesh){const q=paint(o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(m4));stones.push(q);o.geometry.dispose();}});
   if(cf.main)top=[lx,y+m.userData.top[1],lz];}
  const st=vmesh(stones,'돌탑');g.add(st);
  // 자갈 바닥: 반지름 3.6m 원을 6겹 × 20칸 격자로, 칸마다 땅 높이 + 4cm(경사에서 묻히거나 뜨지 않음)
  const RR=3.6,NR=6,NA=20,pos=[],idx=[];pos.push(0,gy(0,0)+.04,0);
  for(let r=1;r<=NR;r++)for(let a=0;a<NA;a++){const t=a/NA*Math.PI*2,rr=RR*r/NR*(1+(r===NR?(hash(a*1.7)-.5)*.12:0)),lx=Math.cos(t)*rr,lz=Math.sin(t)*rr;pos.push(lx,gy(lx,lz)+.04,lz);}
  for(let a=0;a<NA;a++)idx.push(0,1+(a+1)%NA,1+a);
  for(let r=1;r<NR;r++)for(let a=0;a<NA;a++){const i0=1+(r-1)*NA+a,i1=1+(r-1)*NA+(a+1)%NA,j0=i0+NA,j1=i1+NA;idx.push(i0,i1,j0,i1,j1,j0);}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));pg.setIndex(idx);pg.computeVertexNormals();
  const pad=[paint(pg,C.gravel)];
  for(let i=0;i<16;i++){const t=hash(i*3.7)*Math.PI*2,r=RR-.15+hash(i*1.9)*.3,lx=Math.cos(t)*r,lz=Math.sin(t)*r;pad.push(rock(.13,.07,.11,300+i,i%3?C.padDark:C.pad).translate(lx,gy(lx,lz)+.02,lz));}
  for(let i=0;i<9;i++){const t=i*2.4,r=.18*Math.sqrt(i),lx=1.5+Math.cos(t)*r,lz=1.9+Math.sin(t)*r;pad.push(rock(.055,.035,.045,400+i,'#8a8478').translate(lx,gy(lx,lz)+.06+(i>5?.05:0),lz));} // 올릴 돌 무더기
  g.add(vmesh(pad,'돌탑 자갈 바닥',{shadow:false}));root.add(g);parts.cairn=g;cullables.push(g);g.updateMatrixWorld(true);
  const tp=new THREE.Vector3(...top).applyMatrix4(g.matrixWorld),sx=c.x+Math.sin(c.yaw)*2.6,sz=c.z+Math.cos(c.yaw)*2.6; // 광장 쪽(앞 +Z)에 선다
  spots.push({id:'cairn-summit',kind:'cairnField',action:'cairn',x:sx,z:sz,y:G.ground(sx,sz),face:c.yaw+Math.PI,radius:3.5,top:tp.toArray().map(v=>+v.toFixed(2)),object:'돌탑 무리'});}

 // 4) 사랑의 자물쇠 난간
 let lockApi=null;
 if(plan.locks){const L=INTERACT.locks,lk=plan.locks,g=new THREE.Group();g.name='사랑의 자물쇠 난간';g.position.set(lk.x,lk.y,lk.z);g.rotation.y=lk.a0;
  const fp=lockFenceParts(L,lk.radius);g.add(vmesh(fp.parts,'자물쇠 난간 틀'));
  const slots=lockSlots(L,lk.radius),N=slots.length,RR=lk.radius;
  // 자물쇠 몸(네모·하트)과 고리는 InstancedMesh(빈 자리는 크기 0). 빈 자리에는 크림색 빈 고리 표시
  const bodyBox=new THREE.BoxGeometry(.07,.062,.026);bodyBox.translate(0,-.068,0);
  const hs=new THREE.ExtrudeGeometry(heartShape(),{depth:.26,bevelEnabled:false,curveSegments:3});hs.translate(0,0,-.13);hs.scale(.095,.095,.1);hs.translate(0,-.068,0);
  const shackle=new THREE.TorusGeometry(.024,.0065,3,6,Math.PI);shackle.translate(0,-.033,0);
  const ring=new THREE.TorusGeometry(.03,.007,3,8);ring.translate(0,-.033,0);
  const inst=(geo,mat,name)=>{const m=new THREE.InstancedMesh(geo,mat,N);m.name=name;m.castShadow=false;m.receiveShadow=true;m.frustumCulled=false;g.add(m);return m;};
  const boxM=inst(bodyBox,new THREE.MeshStandardMaterial({roughness:.45,metalness:.1}),'자물쇠');
  const heartM=inst(hs,new THREE.MeshStandardMaterial({roughness:.45,metalness:.1}),'하트 자물쇠');
  const shM=inst(shackle,new THREE.MeshStandardMaterial({color:'#c4c8cc',roughness:.35,metalness:.5}),'자물쇠 고리');
  const emptyM=inst(ring,new THREE.MeshStandardMaterial({color:C.empty,roughness:.6,emissive:new THREE.Color(C.empty),emissiveIntensity:.15}),'빈 고리');
  const pop=new THREE.Mesh(new THREE.ShapeGeometry(heartShape(),8),new THREE.MeshBasicMaterial({color:'#ff3d6e',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,fog:false}));pop.name='자물쇠 하트';pop.scale.setScalar(.001);pop.userData.noToon=true;g.add(pop);
  // 걸 자리 표시: 빈 고리 위에서 오르내리는 분홍 하트(빈 자리·걸린 자리와 따로 보이게)
  const mark=new THREE.Mesh(new THREE.ShapeGeometry(heartShape(),6),new THREE.MeshStandardMaterial({color:'#ff5d7a',emissive:new THREE.Color('#ff5d7a'),emissiveIntensity:.35,side:THREE.DoubleSide}));mark.name='걸 자리 표시';mark.scale.setScalar(.09);mark.visible=false;g.add(mark);
  const O=new THREE.Object3D(),zero=new THREE.Matrix4().makeScale(0,0,0),col=new THREE.Color();
  const anim={i:-1,t0:0},aim={i:-1};let clock=0;
  const place=(s,swing=0,drop=0,k=1)=>{O.position.set(Math.sin(s.f)*RR,s.y+drop,Math.cos(s.f)*RR);O.rotation.set(0,s.f,0);O.rotateX(s.tilt*.3+swing);O.scale.setScalar(s.scale*k);O.updateMatrix();return O.matrix;};
  const write=s=>{const on=s.filled,mBody=on?place(s,anim.i===s.i?anim.swing:0,anim.i===s.i?anim.drop:0):zero;
   boxM.setMatrixAt(s.i,on&&!s.heart?mBody:zero);heartM.setMatrixAt(s.i,on&&s.heart?mBody:zero);shM.setMatrixAt(s.i,on?mBody:zero);
   emptyM.setMatrixAt(s.i,on?zero:place(s,0,0,aim.i===s.i?1.6+Math.sin(clock*6)*.25:1));
   col.set(s.color);boxM.setColorAt(s.i,col);heartM.setColorAt(s.i,col);emptyM.setColorAt(s.i,col.set(aim.i===s.i?C.aim:C.empty));};
  const flush=()=>{for(const m of [boxM,heartM,shM,emptyM]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}};
  slots.forEach(write);flush();
  const local=new THREE.Vector3(),world=s=>{g.updateMatrixWorld();return local.set(Math.sin(s.f)*RR,s.y-.07,Math.cos(s.f)*RR).applyMatrix4(g.matrixWorld).toArray().map(v=>+v.toFixed(3));};
  lockApi={
   slots:()=>slots.map(s=>({i:s.i,bay:s.bay,bar:s.bar,filled:s.filled,color:s.color,heart:s.heart,at:world(s)})),
   emptySlots:()=>slots.filter(s=>!s.filled).map(s=>s.i),
   // 사람 자리에서 가장 가까운 빈 자리(없으면 -1)
   nearestEmpty:(x,z)=>{let best=-1,d=Infinity;for(const s of slots){if(s.filled)continue;const p=world(s),v=(p[0]-x)**2+(p[2]-z)**2;if(v<d){d=v;best=s.i;}}return best;},
   // 걸 자리 미리 보이기(노란 고리가 커졌다 작아짐). -1이면 끔
   aim:i=>{const prev=aim.i;aim.i=i;if(prev>=0)write(slots[prev]);if(i>=0)write(slots[i]);flush();},
   // 새 자물쇠 걸기: 위에서 내려와 흔들리다 멈추고 하트가 떠오름. 반환 = 걸린 자리 세계 좌표
   hang:(i,{color=null,heart=null}={})=>{const s=slots[i];if(!s||s.filled)return null;s.filled=true;if(color)s.color=color;if(heart!=null)s.heart=!!heart;if(aim.i===i)aim.i=-1;
    anim.i=i;anim.t0=clock;anim.swing=0;anim.drop=.22;write(s);flush();pop.position.set(Math.sin(s.f)*(RR-.1),s.y+.1,Math.cos(s.f)*(RR-.1));pop.rotation.set(0,s.f,0);return world(s);},
   // 다른 사람 자물쇠·저장된 상태 그대로 칠하기: [{i,color,heart}] (없는 자리는 기본 무늬)
   setFilled:list=>{for(const o of list){const s=slots[o.i];if(!s)continue;s.filled=true;if(o.color)s.color=o.color;if(o.heart!=null)s.heart=!!o.heart;write(s);}flush();},
   tick:t=>{clock=t;if(aim.i>=0){const s=slots[aim.i];write(s);flush();mark.visible=true;mark.position.set(Math.sin(s.f)*(RR-.09),s.y+.1+Math.sin(t*4)*.025,Math.cos(s.f)*(RR-.09));mark.rotation.set(0,s.f,0);}else mark.visible=false;
    if(anim.i>=0){const e=t-anim.t0,s=slots[anim.i];
     anim.drop=Math.max(0,.22*(1-e/.25))**1;anim.swing=e<.25?0:Math.sin((e-.25)*9)*.6*Math.exp(-(e-.25)*2.6);
     const p=Math.min(1,e/1.3);pop.scale.setScalar(.001+.22*Math.sin(Math.min(1,p*1.6)*Math.PI/2));pop.position.y=s.y+.12+p*.35;pop.material.opacity=e<.25?0:Math.min(1,2.2*(1-p));
     write(s);flush();if(e>2.2){anim.i=-1;anim.swing=anim.drop=0;write(s);flush();pop.material.opacity=0;}}},
   count:()=>({slots:N,filled:slots.filter(s=>s.filled).length}),
  };
  g.userData.locks=lockApi;root.add(g);parts.locks=g;cullables.push(g);g.updateMatrixWorld(true);
  const mid=new THREE.Vector3(0,0,RR-1.3).applyMatrix4(g.matrixWorld);
  spots.push({id:'locks-summit',kind:'loveLocks',action:'lock',x:mid.x,z:mid.z,y:lk.y,face:lk.a0,radius:5.5,slots:N,object:'사랑의 자물쇠 난간'});}

 // 매 프레임: 물결·자물쇠 동작·밤 물빛·먼 소품 숨기기
 const cam=new THREE.Vector3();let lastNight=-1;
 const update=(t,night=0,camera=null)=>{
  if(parts.basins)for(const r of parts.basins.userData.ripples){const k=((t*.55+r.position.x*.13)%1+1)%1;r.scale.setScalar(.6+k*2.6);r.material.opacity=.65*(1-k);}
  lockApi?.tick(t);
  const n=Math.max(0,Math.min(1,night));if(Math.abs(n-lastNight)>.005){lastNight=n;for(const m of waterMats)if(m.material.emissive)m.material.emissiveIntensity=n*m.userData.nightGlow;
   if(parts.locks){const e=parts.locks.getObjectByName('빈 고리');if(e?.material.emissive)e.material.emissiveIntensity=.12+n*.45;}}
  if(camera){camera.getWorldPosition(cam);for(const o of [parts.spring,parts.basins,parts.cairn,parts.locks]){if(!o)continue;
   if(o===parts.basins){for(const c of o.children)c.visible=plan.basins.some(b=>Math.hypot(b.x-cam.x,b.z-cam.z)<INTERACT.cull);continue;}
   o.visible=Math.hypot(o.position.x-cam.x,o.position.z-cam.z)<INTERACT.cull;}}
 };
 let tris=0,draws=0;root.traverse(o=>{if(o.isMesh){draws++;const g=o.geometry,n=(g.index?g.index.count:g.attributes.position.count)/3;tris+=o.isInstancedMesh?n*o.count:n;}});
 root.userData={plan,spots,update,locks:lockApi,parts,count:{draws,triangles:Math.round(tris)}};
 return root;
}
