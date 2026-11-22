// 남산 밤 가로등(월드아트, 11-19): 게임 속 공원 가로등(통통한 초록 기둥 + 네모 등갓 + 크림색 유리) 그림과 코스 따라 놓는 자리.
// 실제 제품·로고를 따라 하지 않는다. 화풍은 관악산 카툰(붙이는 쪽 toon.toonify)과 같다.
// 불빛은 그림 효과로만 그린다(실제 광원 0개): 유리 발광 + 바닥 빛 웅덩이 + 등 둘레 후광 + 성곽 벽 비춤.
// 등이 몇 개든 그리기 횟수는 고정이다: 기둥 1 + 유리 1 + 바닥 빛 1 + 후광 1 + 성곽 벽 빛 1 = 5번(낮에는 빛 3개를 끄고 2번).
// 가까운 등 몇 개에 실제 광원을 붙이려면 spots(머리 위치 lx·ly·lz, boost)를 관악산 night-lighting.js lampPoints로 넘긴다(월드개발 연결).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {NAMSAN,courseAt} from './namsan-data.js';
import {WALL,wallLine,wallLowZone} from './namsan-art.js';

// 배치 기준(게임 디자인 값). 간격은 코스 거리 s 기준 m.
export const LAMPS=Object.freeze({
 every:{path:18,stairs:12},     // 평지 길 18m, 계단 12m(발밑 단이 보이게 더 촘촘히)
 side:1.95,                     // 코스 가운데에서 등까지(노면 반폭 1.3 + 경계석 + 받침 반지름 밖)
 nudge:4,                       // 소품과 겹치면 앞뒤로 최대 4m 옮김
 clearProp:1.6,                 // 이정표·스탬프함·돌 등과 떨어질 거리
 height:{path:3.3,plaza:3.9},   // 유리 가운데 높이 ≈ 3.2m(일반)·3.7m(광장 쌍등)
 pool:{path:6.5,stairs:5.6,plaza:8,rest:4.5,stop:6},   // 바닥 빛 반지름(m)
 boost:{path:1,stairs:1,plaza:1.3,rest:1.15,stop:1.2},
 wash:{every:14,near:6.5,width:4.4},                   // 성곽 벽 비춤: 코스 6.5m 안 성곽 면에 14m마다
 plazaCount:{start:5,summit:10},
});
export const LAMP_COLORS=Object.freeze({pole:'#4b5d53',trim:'#33413a',plinth:'#a9a395',brass:'#c9a35a',glassDay:'#fff2d2',glow:'#ffc77a',pool:[1,.7,.38],wash:[1,.62,.3]});

// ── 자리 정하기(three 그림 없음, 점검에서도 씀) ──
// spots(real:false면 실제 광원을 붙이지 않음): [{x,y,z, yaw, kind:'path'|'stairs'|'plaza'|'rest'|'stop', twin, s?, boost, pool, lx,ly,lz, px,pz(빛 웅덩이 가운데)}]
// washes: [{x,z, nx,nz(벽 면이 코스를 보는 방향), tx,tz, bot, top}]
export function planNamsanLamps(G,{walls=[],lanterns=[],items=[],surface=G.ground}={}){
 const pts=G.points,end=pts.at(-1).s,spots=[],washes=[];
 const lines=walls.map(w=>wallLine(G,w)).filter(Boolean);
 const wallSamples=lines.flatMap(l=>l.P);
 const nearWall=(x,z)=>{let d=Infinity;for(const p of wallSamples){const v=(p.x-x)**2+(p.z-z)**2;if(v<d)d=v;}return Math.sqrt(d);};
 const props=[...lanterns.map(p=>({x:p.x,z:p.z})),...items.filter(i=>i.x!=null&&i.kind!=='rest').map(i=>({x:i.x,z:i.z}))];
 const clearOf=(x,z)=>props.every(p=>Math.hypot(p.x-x,p.z-z)>LAMPS.clearProp);
 const onBus=(x,z)=>G.bus&&(G.bus.nearest(x,z).distance<G.bus.points[0].width/2+1.2||G.bus.cycle.nearest(x,z).distance<3.4);
 const inPlaza=(x,z,pad=0)=>[G.plaza,G.startPlaza].some(P=>Math.hypot(x-P.x,z-P.z)<P.r+pad);
 const WALL_IN=WALL.thick/2+.25+.45; // 성곽 가운데 선에서 이만큼 안이면 벽 속
 const head=(x,y,z,kind,twin,yaw)=>{const h=kind==='plaza'?3.7:3.2;return twin?[[-.52,0],[.52,0]].map(([u])=>({lx:x+Math.cos(yaw)*u,ly:y+h,lz:z-Math.sin(yaw)*u})):[{lx:x,ly:y+h,lz:z}];};
 const add=(o)=>{const kind=o.kind,heads=head(o.x,o.y,o.z,kind,!!o.twin,o.yaw??0);spots.push({...o,boost:LAMPS.boost[kind],pool:LAMPS.pool[kind],...heads[0],heads,px:o.px??o.x,pz:o.pz??o.z});};
 // 1) 코스 따라: 계단은 12m, 길은 18m. 성곽이 있는 쪽 반대편에 세운다(양쪽 다 막히면 건너뜀). 광장 안·버스 차로·소품 옆은 앞뒤로 비킴.
 let s=6;
 while(s<end-4){
  const m0=courseAt(pts,s),kind=m0.stairs?'stairs':'path',step=LAMPS.every[kind];
  let placed=false;
  for(const ds of [0,1.5,-1.5,3,-3,LAMPS.nudge,-LAMPS.nudge]){
   const ss=Math.min(end-2,Math.max(2,s+ds)),m=courseAt(pts,ss);
   const cand=[1,-1].map( // 길이 굽어 다른 구간과 가까운 쪽은 G.nearest로 걸러짐
   side=>{const x=m.x+m.nx*LAMPS.side*side,z=m.z+m.nz*LAMPS.side*side;return {side,x,z,wall:nearWall(x,z)};}).sort((a,b)=>b.wall-a.wall);
   for(const c of cand){
    if(c.wall<WALL_IN||G.nearest(c.x,c.z).distance<LAMPS.side-.25||inPlaza(c.x,c.z,1.5)||onBus(c.x,c.z)||!clearOf(c.x,c.z))continue;
    const y=surface(c.x,c.z),px=m.x+m.nx*.5*c.side,pz=m.z+m.nz*.5*c.side;
    add({x:c.x,y,z:c.z,yaw:Math.atan2(m.tx,m.tz),kind:m.stairs?'stairs':'path',s:+ss.toFixed(1),side:c.side,px,pz});placed=true;break;}
   if(placed)break;
  }
  s+=step;
 }
 // 2) 광장: 둘레 안쪽에 쌍등(전망탑 24m 안·버스 고리 위는 비움). 쉼터 데크 양 끝, 정류장·하차 지점 옆.
 const ring=(P,n,r,a0,skip=()=>false)=>{for(let i=0;i<n;i++){const a=a0+i/n*Math.PI*2,x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r;
  if(skip(x,z)||onBus(x,z)||!clearOf(x,z))continue;add({x,y:P.y+.04,z,yaw:Math.atan2(-Math.cos(a),-Math.sin(a)),kind:'plaza',twin:true,px:x+(P.x-x)/r*1.2,pz:z+(P.z-z)/r*1.2});}};
 // 출발 광장(반지름 22m)은 둘레 4m 안쪽을 버스가 돌아서, 등은 버스 고리 안쪽(출발 자리에서 8m 둘레)에 둔다. 광장을 지나는 코스 선 위는 비움
 ring(G.startPlaza,LAMPS.plazaCount.start,8,.9,(x,z)=>G.nearest(x,z).distance<2.4);
 const tw=NAMSAN.tower;ring(G.plaza,LAMPS.plazaCount.summit,G.plaza.r-2.4,.15,(x,z)=>Math.hypot(x-tw.x,z-tw.z)<24);
 const rest=items.find(i=>i.kind==='rest');
 if(rest){const side=G.restSide??1,c=Math.cos(rest.heading),sn=Math.sin(rest.heading);// 데크 로컬 x(옆)·z(길 방향) → 세계
  for(const lz of [-2.75,2.75]){const lx=1.25*side,x=rest.x+lx*c+lz*sn,z=rest.z-lx*sn+lz*c;add({x,y:rest.y,z,yaw:rest.heading,kind:'rest',px:rest.x+lz*.5*sn,pz:rest.z+lz*.5*c,flatY:rest.y+.1,real:false});/* 실제 광원은 안 붙임(낮춘 성곽 면에 흰 줄이 생김), 길 등이 비춤 */}}
 if(G.bus)for(const st of [G.bus.stops.start,G.bus.stops.summit]){const tx=Math.sin(st.heading),tz=Math.cos(st.heading),x=st.x+tx*6-tz*.8,z=st.z+tz*6+tx*.8; // 대기소·표지 끝 6m, 차로 반대쪽으로 0.8m
  add({x,y:st.y+.04,z,yaw:st.heading,kind:'stop',px:st.x+tx*1.5,pz:st.z+tz*1.5});}
 // 3) 성곽 벽 비춤: 코스 가까이 지나는 성곽 면에 바닥에서 위로 올려 비추는 빛(쉼터 낮춘 단 둘레는 뺌)
 const low=wallLowZone(G);
 for(const l of lines){let acc=LAMPS.wash.every/2;
  for(let i=1;i<l.P.length;i++){acc+=Math.hypot(l.P[i].x-l.P[i-1].x,l.P[i].z-l.P[i-1].z);if(acc<LAMPS.wash.every)continue;
   const p=l.P[i],n=l.N[i],hit=G.nearest(p.x,p.z);if(hit.distance>LAMPS.wash.near||Math.hypot(p.x-low.x,p.z-low.z)<low.r+8||inPlaza(p.x,p.z,2))continue;
   const q=pts[hit.index],face=Math.sign((q.x-p.x)*n.nx+(q.z-p.z)*n.nz)||1,fx=n.nx*face,fz=n.nz*face;
   const T=WALL.thick/2,bot=Math.min(G.ground(p.x+fx*(T+.6),p.z+fz*(T+.6)),G.ground(p.x,p.z))-.1,top=Math.max(G.ground(p.x+n.nx*T,p.z+n.nz*T),G.ground(p.x-n.nx*T,p.z-n.nz*T))+WALL.height*.9;
   washes.push({x:p.x,z:p.z,nx:fx,nz:fz,tx:n.tx,tz:n.tz,bot,top});acc=0;}}
 return {spots,washes};
}

// ── 그림 ──
// 한 등의 조각(로컬, 바닥 = y 0, 앞 = +z). post는 꼭짓점 색, glass는 발광 유리.
function lampParts({twin=false,plaza=false}={}){
 const post=[],glass=[];const c=new THREE.Color();
 const col=(g,hex)=>{c.set(hex);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');return g;};
 const H=plaza?3.38:2.9; // 기둥 꼭대기
 post.push(col(new THREE.CylinderGeometry(.22,.27,1.0,8).translate(0,-.32,0),LAMP_COLORS.plinth)); // 받침(땅속 0.82m까지, 경사에서도 안 뜸)
 post.push(col(new THREE.CylinderGeometry(.17,.21,.1,8).translate(0,.23,0),LAMP_COLORS.trim));
 post.push(col(new THREE.CylinderGeometry(.065,.085,H-.28,8).translate(0,.28+(H-.28)/2,0),LAMP_COLORS.pole));
 post.push(col(new THREE.CylinderGeometry(.1,.1,.08,8).translate(0,1.25,0),LAMP_COLORS.trim)); // 허리 띠
 const lantern=(x,y)=>{ // 등갓: 받침판 + 네 모서리 살 + 지붕(네모 뿔) + 꼭지
  post.push(col(new THREE.CylinderGeometry(.12,.08,.1,8).translate(x,y-.02,0),LAMP_COLORS.trim));
  post.push(col(new THREE.BoxGeometry(.42,.05,.42).translate(x,y+.05,0),LAMP_COLORS.trim));
  for(const [u,v] of [[-1,-1],[1,-1],[-1,1],[1,1]])post.push(col(new THREE.BoxGeometry(.04,.46,.04).translate(x+u*.18,y+.3,v*.18),LAMP_COLORS.trim));
  post.push(col(new THREE.ConeGeometry(.37,.26,4,1).rotateY(Math.PI/4).translate(x,y+.66,0),LAMP_COLORS.pole));
  post.push(col(new THREE.BoxGeometry(.5,.04,.5).translate(x,y+.53,0),LAMP_COLORS.trim));
  post.push(col(new THREE.SphereGeometry(.055,8,6).translate(x,y+.83,0),LAMP_COLORS.brass));
  glass.push(new THREE.BoxGeometry(.33,.44,.33).translate(x,y+.3,0).deleteAttribute('uv'));
 };
 if(twin){post.push(col(new THREE.BoxGeometry(1.16,.07,.07).translate(0,H-.02,0),LAMP_COLORS.trim));
  for(const u of [-.52,.52]){post.push(col(new THREE.CylinderGeometry(.04,.04,.18,6).translate(u,H+.05,0),LAMP_COLORS.trim));lantern(u,H+.12);}
  post.push(col(new THREE.SphereGeometry(.07,8,6).translate(0,H+.06,0),LAMP_COLORS.brass));}
 else lantern(0,H+.02);
 return {post,glass};
}
// 바닥 빛 웅덩이·성곽 벽 빛용 가산 혼합 재질. aK = 등마다 세기, uv -1..1(웅덩이)·u -1..1/v 0..1(벽).
function glowSurfaceMaterial(color,wall=false){
 return new THREE.ShaderMaterial({
  uniforms:{uColor:{value:new THREE.Color().setRGB(...color,THREE.LinearSRGBColorSpace)},uAmount:{value:0}},
  vertexShader:'attribute float aK;varying vec2 vUv;varying float vK;void main(){vUv=uv;vK=aK;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uColor;uniform float uAmount;varying vec2 vUv;varying float vK;
void main(){${wall?'float a=pow(clamp(1.-vUv.x*vUv.x,0.,1.),1.6)*pow(clamp(1.-vUv.y,0.,1.),1.4)*.75;':'float r=length(vUv);float a=pow(clamp(1.-r,0.,1.),1.6)+step(r,.35)*.08*(1.-r);'}
 a*=uAmount*vK;if(a<.003)discard;gl_FragColor=vec4(uColor,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,side:wall?THREE.DoubleSide:THREE.FrontSide,
 });
}
function haloMaterial(color){
 return new THREE.ShaderMaterial({
  uniforms:{uColor:{value:new THREE.Color().setRGB(...color,THREE.LinearSRGBColorSpace)},uAmount:{value:0},uSize:{value:1.5},uScale:{value:700},uMax:{value:140}},
  vertexShader:'uniform float uSize,uScale,uMax;attribute float aK;varying float vK;void main(){vK=aK;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uSize*aK*uScale/max(.5,-mv.z),2.,uMax);}',
  fragmentShader:'uniform vec3 uColor;uniform float uAmount;varying float vK;\nvoid main(){float r=length(gl_PointCoord-.5)*2.;float a=(pow(clamp(1.-r,0.,1.),2.4)*.8+step(r,.14)*.35)*uAmount;if(a<.004)discard;gl_FragColor=vec4(uColor,min(a,1.));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,
 });
}

// 빛 웅덩이가 앉을 높이: 광장 판석·계단 단 윗면·땅 중 맞는 것(살짝 띄움)
function surfaceY(G,x,z){
 for(const P of [G.plaza,G.startPlaza])if(Math.hypot(x-P.x,z-P.z)<P.r-.3)return P.y+.09;
 const g=G.ground(x,z),hit=G.nearest(x,z),a=G.points[hit.index];
 if(a?.stairs&&hit.distance<NAMSAN.stairWidth/2+.2){const b=G.points[hit.index+1]??a;return Math.max(g,a.y+(b.y-a.y)*hit.t+NAMSAN.riser/2+.06);}
 if(hit.distance<NAMSAN.pathWidth/2+.2){const b=G.points[hit.index+1]??a;return Math.max(g,a.y+(b.y-a.y)*hit.t)+.1;}
 return g+.08;
}

export function buildNamsanLamps(G,{walls=[],lanterns=[],items=[],surface=G.ground}={}){
 const {spots,washes}=planNamsanLamps(G,{walls,lanterns,items,surface});
 const group=new THREE.Group();group.name='남산 가로등';const body=new THREE.Group();body.name='가로등 몸';group.add(body); // 붙이는 쪽은 body만 toonify
 const single=lampParts(),twin=lampParts({twin:true,plaza:true});
 const post=[],glass=[],m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),one=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
 for(const sp of spots){const parts=sp.twin?twin:single;m.compose(p.set(sp.x,sp.y,sp.z),q.setFromAxisAngle(up,sp.yaw??0),one);
  for(const g of parts.post)post.push(g.clone().applyMatrix4(m));for(const g of parts.glass)glass.push(g.clone().applyMatrix4(m));}
 // 성곽 벽 비춤 등(바닥에 놓인 작은 투광등 상자)
 for(const w of washes){const g=new THREE.BoxGeometry(.34,.16,.22);g.deleteAttribute('uv');const n=g.attributes.position.count,a=new Float32Array(n*3),c=new THREE.Color(LAMP_COLORS.trim);for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));
  const T=WALL.thick/2+.25+.35;g.rotateY(Math.atan2(w.tx,w.tz));g.translate(w.x+w.nx*T,G.ground(w.x+w.nx*T,w.z+w.nz*T)+.06,w.z+w.nz*T);post.push(g);}
 const postMesh=new THREE.Mesh(mergeGeometries(post),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7}));postMesh.name='가로등 기둥';postMesh.castShadow=true;body.add(postMesh);
 const glassMat=new THREE.MeshStandardMaterial({color:LAMP_COLORS.glassDay,roughness:.35,emissive:new THREE.Color(LAMP_COLORS.glow),emissiveIntensity:0});
 const glassMesh=new THREE.Mesh(mergeGeometries(glass),glassMat);glassMesh.name='가로등 유리';body.add(glassMesh);
 [...post,...glass,...single.post,...single.glass,...twin.post,...twin.glass].forEach(g=>g.dispose());
 // 바닥 빛 웅덩이: 등마다 7×7 격자를 바닥 높이에 맞춰 한 덩어리로
 const pos=[],uv=[],kk=[],idx=[];const N=7;
 for(const sp of spots){const R=sp.pool,b=pos.length/3;
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const u=i/N*2-1,v=j/N*2-1,x=sp.px+u*R,z=sp.pz+v*R;pos.push(x,sp.flatY??surfaceY(G,x,z),z);uv.push(u,v);kk.push(sp.boost);}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=b+j*(N+1)+i;idx.push(a,a+N+1,a+1,a+1,a+N+1,a+N+2);}}
 const poolGeo=new THREE.BufferGeometry();poolGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));poolGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));poolGeo.setAttribute('aK',new THREE.Float32BufferAttribute(kk,1));poolGeo.setIndex(idx);
 const poolMat=glowSurfaceMaterial(LAMP_COLORS.pool),pool=new THREE.Mesh(poolGeo,poolMat);pool.name='가로등 바닥 빛';pool.renderOrder=2;pool.userData.noToon=true;group.add(pool);
 // 성곽 벽 빛: 벽 면(아래가 0.25m 넓은 비탈)을 따라 세운 판
 const wp=[],wu=[],wk=[],wi=[];
 for(const w of washes){const T=WALL.thick/2,hw=LAMPS.wash.width/2,b=wp.length/3;
  for(const [u,v] of [[-1,0],[1,0],[-1,1],[1,1]]){const off=T+.25*(1-v)+.06,y=w.bot+(w.top-w.bot)*v;wp.push(w.x+w.nx*off+w.tx*u*hw,y,w.z+w.nz*off+w.tz*u*hw);wu.push(u,v);wk.push(1);}
  wi.push(b,b+1,b+2,b+1,b+3,b+2);}
 const washGeo=new THREE.BufferGeometry();washGeo.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));washGeo.setAttribute('uv',new THREE.Float32BufferAttribute(wu,2));washGeo.setAttribute('aK',new THREE.Float32BufferAttribute(wk,1));washGeo.setIndex(wi);
 const washMat=glowSurfaceMaterial(LAMP_COLORS.wash,true),wash=new THREE.Mesh(washGeo,washMat);wash.name='성곽 벽 빛';wash.renderOrder=2;wash.userData.noToon=true;group.add(wash);
 // 후광: 등 머리마다 점 하나
 const hp=[],hk=[];for(const sp of spots)for(const h of sp.heads){hp.push(h.lx,h.ly,h.lz);hk.push(sp.twin?1.1:1);}
 const haloGeo=new THREE.BufferGeometry();haloGeo.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));haloGeo.setAttribute('aK',new THREE.Float32BufferAttribute(hk,1));
 const haloMat=haloMaterial(LAMP_COLORS.pool),halo=new THREE.Points(haloGeo,haloMat);halo.name='가로등 후광';halo.renderOrder=3;halo.userData.noToon=true;group.add(halo);
 const sz=new THREE.Vector2();
 halo.onBeforeRender=(renderer,scene,camera)=>{if(!camera.isPerspectiveCamera)return;renderer.getDrawingBufferSize(sz);haloMat.uniforms.uScale.value=sz.y/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));};
 for(const o of [pool,wash,halo])o.visible=false;
 let last=-1;
 const update=night=>{const k=Math.max(0,Math.min(1,night));if(Math.abs(k-last)<.002)return;last=k;
  glassMat.emissiveIntensity=k*2.2;poolMat.uniforms.uAmount.value=k*.34;washMat.uniforms.uAmount.value=k*1.05;haloMat.uniforms.uAmount.value=k*.9;
  const on=k>.01;pool.visible=wash.visible=halo.visible=on;};
 group.userData={body,spots,washes,update,count:{lamps:spots.length,heads:hp.length/3,washes:washes.length,draws:5}};
 return group;
}
