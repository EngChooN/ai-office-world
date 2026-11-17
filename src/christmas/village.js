// 온라인 크리스마스 「눈마을 광장」 장면 조립(월드아트, 2026-11-16). 배치는 layout.js, 형상은 props.js.
// buildVillage({toon,scene,world,mobile}) → 땅(눈·광장 돌바닥·썰매 언덕)·트리·모닥불·우체통·카드 판·전시 자리·집·마당·언덕 소품·가로등·울타리·숲·먼 산·눈 내림.
// 늘 눈 오는 밤이다. 하늘·달빛은 온라인 등산 카툰 하늘(toon.createSky/updateSky)을 밤 값(palette XMAS_SKY)으로 쓴다.
// 돌려주는 것: 트리·우체통·모닥불 조작 손잡이, 땅 높이 heightAt, 충돌(colliders), 매 프레임 update.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS,XMAS_SKY} from './palette.js';
import * as L from './layout.js';
import * as P from './props.js';
import {createSnowfall} from './snowfall.js';
import {buildSledCourse} from './sled-course-art.js';

const lin=hex=>new THREE.Color(hex);
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const rng=seed=>{let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
const segDist=(x,z,[ax,az],[bx,bz])=>{const dx=bx-ax,dz=bz-az,t=Math.min(1,Math.max(0,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-ax-dx*t,z-az-dz*t);};
// 밟아 다져진 눈길(입구→트리, 트리 둘레→모닥불·우체통·마당·썰매 멈춤·계단). 땅 꼭짓점 색에만 쓴다.
const PATHS=[[[0,32],[0,16]],[[-17,-6.5],[-23,-3]],[[-17,7.5],[-23,6]],[[16.5,1],[21.5,1.5]],[[6,-16],[8.4,-19]],[[-6,-16],[-11.5,-24]]];

export function buildVillage({toon,scene,world,mobile=false,samples=false}){
 const group=new THREE.Group();group.name='눈마을 광장';
 const tz=toon.toonify,f=toon.materialFactory,colliders=[],lights=[],glows=[];
 const H=L.heightAt;
 const vcMat=()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 const toonMesh=(geo,name,{receive=true,cast=false}={})=>{const m=new THREE.Mesh(geo,vcMat());m.name=name;m.receiveShadow=receive;m.castShadow=cast;tz(m,{kind:'prop'});group.add(m);return m;};
 const put=(o,x,z,ry=0,y=null,parent=group)=>{o.position.set(x,y??H(x,z),z);o.rotation.y=ry;parent.add(o);return o;};
 // 움직이지 않는 작은 소품(가로등·팻말·눈벽·전시 자리·출발대·아치 기둥)은 statics에 모았다가 끝에 재질별로 한 번 더 합친다.
 const statics=new THREE.Group();statics.name='고정 소품';group.add(statics);
 const putS=(o,x,z,ry=0,y=null)=>put(o,x,z,ry,y,statics);
 // 넓고 평평한 눈 바닥은 화면 외곽선에서 뺀다: 낮게 깔린 바닥은 이웃 화소 깊이 차가 커서(특히 휴대폰 절반 해상도 외곽선) 가로 줄무늬가 생긴다.
 // 풀밭과 같은 표시(색 알파 0.5, src/toon/materials.js 풀 셰이더). 소품·캐릭터는 자기 껍질 외곽선이 있어 땅 쪽 선이 빠져도 테두리가 남는다.
 const noEdge=mesh=>{const m=mesh.material.clone(),prev=m.onBeforeCompile,key=m.customProgramCacheKey?.bind(m);
  m.onBeforeCompile=function(sh,r){prev?.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n gl_FragColor.a=min(gl_FragColor.a,.5);');};
  m.customProgramCacheKey=()=>`${key?.()??''}|xmas-no-edge`;mesh.material=m;return mesh;};
 const circleC=(x,z,r)=>colliders.push({x,z,r});
 const boxC=(x,z,w,d,heading=0)=>colliders.push({x,z,w,d,heading});

 // ── 땅: 130m 네모(언덕·마당 포함), 꼭짓점 색 = 눈 + 다져진 길 + 썰매 길. 광장 안은 아래 돌바닥이 덮는다.
 {
  const S=130,N=mobile?150:210,cz=-8,g=new THREE.PlaneGeometry(S,S,N,N);g.rotateX(-Math.PI/2);g.translate(0,0,cz);
  const p=g.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color(),snow=lin(XMAS.snow),shade=lin(XMAS.snowShade),path=lin(XMAS.snowPath),packed=lin(XMAS.snowPacked);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=H(x,z);p.setY(i,y);
   const n=Math.sin(x*.37+z*.21)*Math.sin(z*.43-x*.17);c.copy(snow).lerp(shade,.08+.06*n);
   let k=0;for(const [a,b] of PATHS)k=Math.max(k,1-smooth(.9,2,segDist(x,z,a,b)));
   const run=L.nearestRun(x,z);if(Math.hypot(x,z)>L.PLAZA.radius){k=Math.max(k,(1-smooth(L.SLED_RUN.width*.5,L.SLED_RUN.width*.5+1,run.d))*.9);}
   c.lerp(k>.5&&run.d<2.5?packed:path,k*.6);col.set([c.r,c.g,c.b],i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
  noEdge(toonMesh(g,'눈 땅'));
  // 바깥 눈벌판(먼 곳까지 이어지는 평평한 눈, 안개에 녹는다)
  const out=new THREE.Mesh(new THREE.CircleGeometry(900,48).rotateX(-Math.PI/2).translate(0,-.06,0),f.basic(lin(XMAS.snowShade),{name:'xmas-far-snow'}));out.name='먼 눈벌판';out.receiveShadow=false;group.add(noEdge(out));
 }
 // ── 광장 돌바닥: 눈이 살짝 덮인 원형 포석(트리 둘레 길·바깥 테두리 돌), 꼭짓점 색 무늬
 {
  const R=L.PLAZA.radius,g=new THREE.RingGeometry(.2,R,mobile?96:144,mobile?32:48);g.rotateX(-Math.PI/2);g.translate(0,.012,0);
  const p=g.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color(),stone=lin(XMAS.stone),dark=lin(XMAS.stoneDark),snow=lin(XMAS.snowPacked),white=lin(XMAS.snow);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z),a=Math.atan2(x,z);
   const ring=Math.floor(r/.75),cell=Math.floor((a+Math.PI)*r/.8+ring*.5),hash=Math.abs(Math.sin(ring*12.9+cell*78.2))%1;
   c.copy(stone).lerp(dark,hash*.35);
   // 눈 덮임: 가장자리·트리 밑은 많이, 사람이 다니는 길은 적게
   const cover=.55+.3*Math.sin(x*.7)*Math.sin(z*.6)+.25*smooth(R-2.5,R,r)-.35*(1-smooth(3.4,6.4,r))*smooth(3.3,3.6,r);
   c.lerp(snow,Math.min(1,Math.max(0,cover)));if(r<3.4)c.copy(white);
   col.set([c.r,c.g,c.b],i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));noEdge(toonMesh(g,'광장 돌바닥'));
  // 트리 둘레 경계석·광장 테두리 돌
  const curbs=[];for(const [rr,n,h] of [[3.5,30,.14],[R+.15,80,.2]])for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=new THREE.BoxGeometry(2*Math.PI*rr/n*.92,h,.32);b.rotateY(a);b.translate(Math.sin(a)*rr,h/2,Math.cos(a)*rr);curbs.push(b);}
  const cm=new THREE.Mesh(mergeGeometries(curbs),f.basic(lin(XMAS.stoneDark),{name:'xmas-curb'}));cm.name='경계석';cm.receiveShadow=true;group.add(cm);
 }

 // ── 트리
 const tree=P.buildTree(tz);put(tree.group,L.TREE.x,L.TREE.z,0,0);circleC(L.TREE.x,L.TREE.z,3.3);
 {const l=new THREE.PointLight('#ffd08a',0,13,1.6);l.position.set(0,2.4,0);tree.group.add(l);lights.push({l,base:()=>2+tree.lightStage*1.6,desk:false});}
 // ── 모닥불
 const fire=P.buildCampfire(tz);put(fire.group,L.CAMPFIRE.x,L.CAMPFIRE.z,0,0);circleC(L.CAMPFIRE.x,L.CAMPFIRE.z,L.CAMPFIRE.stoneR+.25);
 for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2;boxC(L.CAMPFIRE.x+Math.sin(a)*L.CAMPFIRE.logR,L.CAMPFIRE.z+Math.cos(a)*L.CAMPFIRE.logR,L.CAMPFIRE.logLen,.36,a);}
 circleC(L.CAMPFIRE.x,L.CAMPFIRE.z-L.CAMPFIRE.logR,.32);
 const seats=fire.seats;
 // ── 우체통·카드 판
 const mailbox=P.buildMailbox(tz);put(mailbox.group,L.MAILBOX.x,L.MAILBOX.z,L.MAILBOX.heading,0);circleC(L.MAILBOX.x,L.MAILBOX.z,.45);
 const board=P.buildCardBoard(tz,{cards:L.CARD_BOARD.cards});put(board.group,L.CARD_BOARD.x,L.CARD_BOARD.z,L.CARD_BOARD.heading,0);boxC(L.CARD_BOARD.x,L.CARD_BOARD.z,2,.3,L.CARD_BOARD.heading);
 {const gl=new THREE.Mesh(new THREE.CircleGeometry(1.6,32).rotateX(-Math.PI/2),P.groundGlowMaterial('#ffcf8a',.18));gl.position.set(L.MAILBOX.x-.4,.03,L.MAILBOX.z);gl.renderOrder=2;group.add(gl);}
 // ── 전시 자리 8개
 const display=L.displaySlots().map(s=>{const d=P.buildDisplayBase(tz);putS(d.group,s.x,s.z,s.heading,0);return {...s,...d,snowman:null};});
 // ── 집
 const houses=L.HOUSES.map(([x,z,variant,scale],i)=>{const h=P.buildHouse(tz,{variant,scale,seed:i+1}),ry=L.houseHeading(x,z);
  // 발밑 가장 낮은 땅에 맞춰 놓는다(뜨지 않게). 앞 눈 더미가 틈을 덮는다.
  let y=1e9;for(const [dx,dz] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0]]){const lx=dx*h.footprint.w,lz=dz*h.footprint.d,wx=x+lx*Math.cos(ry)+lz*Math.sin(ry),wz=z-lx*Math.sin(ry)+lz*Math.cos(ry);y=Math.min(y,H(wx,wz));}
  put(h.group,x,z,ry,y-.04);boxC(x,z,4.6*scale,3.8*scale,ry);return {...h,x,z,ry};});
 // ── 눈싸움 마당: 낮은 눈벽 4개 + 경계 깃발 + 팻말. 모닥불 쪽 가림 눈벽.
 const Y=L.SNOWBALL_YARD;
 Y.walls.forEach(([x,z,len,ry],i)=>{const w=P.buildSnowWall(tz,{len,h:.7,seed:i+3});putS(w,x,z,ry);boxC(x,z,len,.6,ry);});
 {const d=L.DIVIDER,len=d.z1-d.z0,w=P.buildSnowWall(tz,{len,h:d.h,seed:21});putS(w,d.x,(d.z0+d.z1)/2,Math.PI/2);boxC(d.x,(d.z0+d.z1)/2,len,.7,Math.PI/2);}
 const yardFlags=(y,seed)=>{const geos=[],r=rng(seed);const per=(x0,z0,x1,z1)=>{const n=Math.max(1,Math.round(Math.hypot(x1-x0,z1-z0)/2.6));for(let i=0;i<n;i++){const t=i/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,g=P.flagPostGeometry(XMAS.flag[Math.floor(r()*4)]);g.rotateY(r()*6.28);g.translate(x,H(x,z)-.05,z);geos.push(g);}};
  const x0=y.x-y.w/2,x1=y.x+y.w/2,z0=y.z-y.d/2,z1=y.z+y.d/2;per(x0,z0,x1,z0);per(x1,z0,x1,z1);per(x1,z1,x0,z1);per(x0,z1,x0,z0);
  const m=new THREE.Mesh(mergeGeometries(geos),vcMat());m.name='마당 경계 깃발';tz(m,{kind:'prop'});m.castShadow=true;group.add(m);};
 yardFlags(Y,5);putS(P.buildSign(tz,['❄️ 눈싸움 마당','안에서만 던져요']),Y.x+Y.w/2+.6,Y.z+Y.d/2-1.2,Math.PI/2);
 // ── 눈사람 마당: 경계 깃발 + 팻말 + 눈 더미
 const SM=L.SNOWMAN_YARD;yardFlags(SM,9);putS(P.buildSign(tz,['⛄ 눈사람 마당','굴려서 키워요']),SM.x-SM.w/2-.6,SM.z+SM.d/2-1.2,-Math.PI/2);
 // ── 썰매 산(11-17 긴 코스): 길·눈둑·출발대·기록판·점프대·부스터·장애물·결승 아치·멈춤 구역(sled-course-art.js)
 const R=L.SLED_RUN;
 const course=buildSledCourse({group,tz,f,H,vcMat,noEdge,putS,mobile});
 const sleds=samples?Array.from({length:R.deck.lanes},(_,i)=>{const s=P.buildSled(tz),d=R.deck;put(s,d.x,d.z+(i-1.5),Math.PI/2,H(d.x,d.z)+.11);return s;}):[];
 // ── 마을 입구 아치(남쪽, 처음 들어올 때 지나는 문)
 {const arch=P.buildArch(tz);putS(arch.group,L.ENTRANCE.x,L.ENTRANCE.z,0,0);for(const sx of [-1,1])circleC(L.ENTRANCE.x+sx*L.ENTRANCE.w/2,L.ENTRANCE.z,.35);}
 // ── 가로등(바닥 빛 + 가까운 4개만 점광원, 휴대폰은 점광원 없음)
 L.LAMPS.forEach(([x,z],i)=>{const lp=P.buildLamp(tz);putS(lp.group,x,z,Math.atan2(-x,-z));circleC(x,z,.22);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(2.6,32).rotateX(-Math.PI/2),P.groundGlowMaterial(XMAS.lamp,.32));gl.position.set(x,H(x,z)+.035,z);gl.renderOrder=2;group.add(gl);glows.push(gl);
  if(!mobile&&i%2===0&&i<8){const l=new THREE.PointLight(XMAS.lamp,0,8,1.8);l.position.set(x,H(x,z)+2.5,z);group.add(l);lights.push({l,base:()=>2.2,desk:true});}});
 // ── 울타리(광장 바깥 원, 언덕 쪽은 열어 둠)
 {const r=L.PLAZA.fence,seg=2.4,n=Math.round(2*Math.PI*r/seg),geos=[],base=P.fenceGeometry(seg);
  for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2,x=Math.sin(a)*r,z=Math.cos(a)*r;if(z<-24&&Math.abs(x)<26)continue;const g=base.clone();g.rotateY(a);g.translate(x,H(x,z)-.05,z);geos.push(g);}
  const m=new THREE.Mesh(mergeGeometries(geos),vcMat());m.name='울타리';tz(m,{kind:'prop'});m.castShadow=true;group.add(m);}
 // ── 숲(눈 덮인 전나무): 울타리 바깥과 언덕 뒤. 종류 3개 × InstancedMesh.
 const pines=[];{const r=rng(2026),count=mobile?170:320,kinds=[0,1,2].map(i=>P.pineGeometry(i+1)),spots=kinds.map(()=>[]);
  for(let i=0;i<count*3&&spots.flat().length<count;i++){const a=r()*Math.PI*2,d=L.PLAZA.fence+3+r()*55,x=Math.sin(a)*d,z=Math.cos(a)*d;
   if(Math.hypot((x-L.HILL.x)/(L.HILL.rx+1),(z-L.HILL.z)/(L.HILL.rz+1))<1)continue;if(z<-24&&Math.abs(x)<26)continue;spots[Math.floor(r()*3)].push([x,z,.8+r()*1.1,r()*6.28]);}
  // 언덕 뒤·옆 숲(언덕 위 능선을 감싼다)
  for(let i=0;i<(mobile?40:80);i++){const a=-Math.PI*.5+r()*Math.PI,x=L.HILL.x+Math.sin(a+Math.PI/2)*(L.HILL.rx+2+r()*10)*(r()<.5?1:-1)*.0+Math.cos(a)*(L.HILL.rx+1+r()*9),z=L.HILL.z-Math.abs(Math.sin(a))*(L.HILL.rz+r()*10)-2;spots[i%3].push([x,z,.9+r()*1.2,r()*6.28]);}
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),V=new THREE.Vector3();
  kinds.forEach((geo,k)=>{const list=spots[k],m=new THREE.InstancedMesh(geo,vcMat(),list.length);m.name='눈 덮인 전나무';
   list.forEach(([x,z,s,ry],i)=>{Q.setFromAxisAngle(V.set(0,1,0),ry);S.setScalar(s);m.setMatrixAt(i,M.compose(V.set(x,H(x,z)-.1,z),Q,S));});
   tz(m,{kind:'prop'});m.castShadow=!mobile;m.receiveShadow=true;group.add(m);pines.push(m);});}
 // ── 먼 산(남색 실루엣 + 눈 덮인 꼭대기). 안개에 녹아 밤하늘과 땅의 경계를 만든다.
 {const r=rng(77),geos=[];for(let i=0;i<22;i++){const a=i/22*Math.PI*2+r()*.2,d=260+r()*160,h=55+r()*110,w=90+r()*90,g=new THREE.ConeGeometry(w,h,9,3);
   const p=g.attributes.position,ph=r()*6.28;for(let k=0;k<p.count;k++){const y=p.getY(k);if(y<h/2-1){const an=Math.atan2(p.getX(k),p.getZ(k)),f=1+.13*Math.sin(an*3+ph)+.06*Math.sin(an*5+ph*2);p.setXYZ(k,p.getX(k)*f,y,p.getZ(k)*f);}}
   g.translate(Math.sin(a)*d,h/2-6,Math.cos(a)*d);geos.push((()=>{const gg=g.toNonIndexed();const c=new Float32Array(gg.attributes.position.count*3),cc=new THREE.Color();
    for(let k=0;k<gg.attributes.position.count;k++){const y=gg.attributes.position.getY(k)+6;cc.set(y>h*.62?'#dfe7f3':y>h*.45?'#9fb0cc':'#4d5d7c');c.set([cc.r,cc.g,cc.b],k*3);}gg.setAttribute('color',new THREE.BufferAttribute(c,3));return gg;})());}
  const m=new THREE.Mesh(mergeGeometries(geos),vcMat());m.name='먼 산';tz(m,{kind:'prop'});group.add(noEdge(m));}
 // ── 굴뚝 연기(가까운 집 4채, 옅은 흰 솜이 피어오름)
 const smoke=[];{const puff=new THREE.SphereGeometry(.22,10,8);
  houses.slice(0,4).forEach((h,hi)=>{const base=h.chimney.clone().applyAxisAngle(new THREE.Vector3(0,1,0),h.ry).add(new THREE.Vector3(h.x,h.group.position.y,h.z));
   for(let i=0;i<5;i++){const m=new THREE.Mesh(puff,new THREE.MeshBasicMaterial({color:'#dfe6f0',transparent:true,opacity:.55,depthWrite:false}));m.userData={base,ph:i/5+hi*.13};group.add(m);smoke.push(m);}});}
 // ── 눈사람 예시(미리보기 전용: 전시 3개 + 마당 눈덩이)
 const sampleSnowmen=[];
 if(samples){[[0,{}],[3,{sizes:[.55,.4],parts:['eyes','nose','mouth','scarf'],scarfColor:XMAS.ornBlue}],[5,{sizes:[.6,.45,.3],parts:['eyes','nose','arms','hat'],seed:4}]].forEach(([i,o])=>{const s=display[i],sm=P.buildSnowman(tz,o);put(sm,s.x,s.z,s.heading,.12);s.snowman=sm;sampleSnowmen.push(sm);});
  [[SM.x-2,SM.z+1,P.SNOWBALL_SIZES.large],[SM.x+2.5,SM.z-2,P.SNOWBALL_SIZES.medium],[SM.x+.5,SM.z+3.5,P.SNOWBALL_SIZES.small]].forEach(([x,z,r],i)=>put(P.snowball(tz,r,i+2),x,z,i));}
 // ── 따뜻한 마을 빛(palette XMAS_SKY.light.warmFill): 불빛 많은 마을의 반사광. 장면 전체에 하나.
 {const w=XMAS_SKY.light.warmFill,l=new THREE.HemisphereLight(w.sky,w.ground,w.intensity);l.name='마을 빛';group.add(l);}
 // ── 눈 내림
 const snowfall=createSnowfall({mobile});scene?.add(snowfall.group);

 P.bakeStatic(statics);
 world.add(group);
 let time=0;
 return {
  group,heightAt:H,layout:L,colliders,course,tree,mailbox,cardBoard:board,campfire:fire,seats,display,houses,sleds,snowfall,
  // 매 프레임. camera = 눈 내림 기준, viewHeight = 캔버스 높이(px)
  update(dt,{camera=null,viewHeight=900,snow=1}={}){
   time+=dt;tree.update(dt,time);course.update(dt);fire.update(dt,time,{power:mobile?4:6});
   for(const {l,base} of lights)l.intensity=base();
   for(const m of smoke){const u=(time*.12+m.userData.ph)%1;m.position.copy(m.userData.base).add(new THREE.Vector3(Math.sin(time*.5+m.userData.ph*9)*.3*u+u*.8,u*3.2,u*.3));m.scale.setScalar(.4+u*1.6);m.material.opacity=.5*(1-u);}
   if(camera)snowfall.update(time,camera,{amount:snow,viewHeight});
  },
  dispose(){snowfall.dispose();scene?.remove(snowfall.group);world.remove(group);},
 };
}
