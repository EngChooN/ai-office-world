// 썰매 산 코스 그림(월드개발, 2026-11-17 · 2차: 코스가 바뀌면 다시 그림 — 월드아트가 다듬기 전 1차). 코스 자료는 sled-course.js makeCourse(seed), 형상 조각은 props.js.
//  늘 같은 것(한 번만): 출발대(출발선·4줄 깃발·출발 문·팻말·오늘의 기록판) · 결승 아치(결승 자리는 시드와 상관없이 같다) · 멈춤 구역 눈 둔덕 · 산 아래 팻말.
//  코스마다(setCourse): 다진 눈길(폭이 좁아지는 곳 포함) · 양옆 눈둑 · 굽이 깃발 · 구간 기록 빛 띠 2개 · 점프대 · 부스터 판 · 장애물(눈 더미·전나무) · 얼음 길 · 터널.
// buildSledCourse(...)는 village.js가 부른다. 돌려주는 것: update(dt)·setCourse(course)·boardCanvas/boardTex(기록판 글).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS} from './palette.js';
import * as P from './props.js';
import {COURSE_W,START_H,FINISH_U,SKELETON_END,skeletonAt,heightU,makeCourse,dailySeed} from './sled-course.js';

const lin=hex=>new THREE.Color(hex);
const rng=seed=>{let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
// 뼈대 자리(u, 옆 off) → 세계 x,z,방향
const skXZ=(u,off=0)=>{const c=skeletonAt(u),nx=-Math.sin(c.th),nz=Math.cos(c.th);return {x:c.x+nx*off,z:c.z+nz*off,th:c.th};};

export function buildSledCourse({group,tz,f,H,vcMat,noEdge,putS,mobile=false,course=null}){
 const out={glows:[],boosters:[],course:null};
 const W=COURSE_W;
 // ── 출발대: 출발선(빨강) + 4줄 번호 깃발 + 출발 문 기둥·가로대 + 「썰매 산」 팻말 + 오늘의 기록판
 {const c=skXZ(0),y=START_H+.04,ry=-c.th+Math.PI/2;
  const line=new THREE.Mesh(new THREE.BoxGeometry(.18,.02,W),new THREE.MeshBasicMaterial({color:'#c23a32'}));line.position.set(c.x,y,c.z);line.rotation.y=-c.th;group.add(line);
  for(let k=0;k<4;k++){const o=(k-1.5)*1,q=skXZ(-1.8,o);const f2=new THREE.Mesh(P.flagPostGeometry(XMAS.flag[k%4]),vcMat());f2.position.set(q.x,START_H,q.z);f2.rotation.y=ry;tz(f2,{kind:'prop'});group.add(f2);}
  for(const sd of [-1,1]){const q=skXZ(.2,sd*(W/2+.35));const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,2.6,10).translate(0,1.3,0),f.basic(lin(XMAS.candy),{name:'xmas-gate-post'}));post.position.set(q.x,START_H,q.z);post.castShadow=true;group.add(post);}
  {const q=skXZ(.2,0);const bar=new THREE.Mesh(new THREE.BoxGeometry(.16,.18,W+.8),f.basic(lin(XMAS.pine),{name:'xmas-gate-bar'}));bar.position.set(q.x,START_H+2.55,q.z);bar.rotation.y=-c.th;group.add(bar);}
  {const q=skXZ(-2.2,-(W/2+1.4));putS(P.buildSign(tz,['썰매 산 출발대','레이스 · 혼자 타기']),q.x,q.z,ry+Math.PI*.15,START_H);}
  const cv=document.createElement('canvas');cv.width=512;cv.height=384;const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const bd=new THREE.Group();bd.name='오늘의 기록판';
  const frame=new THREE.Mesh(new THREE.BoxGeometry(2.1,1.6,.1),f.basic(lin(XMAS.woodDark),{name:'xmas-board-frame'}));frame.position.y=1.7;bd.add(frame);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.96,1.47),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));face.position.set(0,1.7,.06);bd.add(face);
  for(const sx of [-.9,.9]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,1,.1).translate(0,.5,0),f.basic(lin(XMAS.woodDark),{name:'xmas-board-leg'}));leg.position.x=sx;bd.add(leg);}
  const q=skXZ(-2.6,W/2+1.6);bd.position.set(q.x,START_H,q.z);bd.rotation.y=-c.th-Math.PI/2+.5;group.add(bd);
  out.boardCanvas=cv;out.boardTex=tex;}
 // ── 결승 아치(체크무늬 깃발) — 결승 자리는 뼈대 FINISH_U(길이 옆으로 비키지 않는 곳)
 {const c=skXZ(FINISH_U),y=heightU(FINISH_U),g=new THREE.Group();g.name='결승 아치';
  for(const sd of [-1,1]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,3.2,12).translate(0,1.6,0),f.basic(lin(XMAS.santaRed),{name:'xmas-finish-post'}));post.position.z=sd*(W/2+.45);post.castShadow=true;g.add(post);}
  const cols=12,rows=2,geo=new THREE.PlaneGeometry(W+.9,.7,cols,rows).toNonIndexed(),pc=geo.attributes.position,colr=[];
  for(let t=0;t<pc.count;t+=3){const cx=(pc.getX(t)+pc.getX(t+1)+pc.getX(t+2))/3,cy=(pc.getY(t)+pc.getY(t+1)+pc.getY(t+2))/3,i=Math.floor((cx+(W+.9)/2)/((W+.9)/cols)),j=Math.floor((cy+.35)/(.7/rows)),k=(i+j)%2?1:.08;for(let q=0;q<3;q++)colr.push(k,k,k);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));const ban=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));ban.rotation.y=Math.PI/2;ban.position.y=2.85;g.add(ban);
  g.position.set(c.x,y,c.z);g.rotation.y=-c.th;group.add(g);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(.5,W).rotateX(-Math.PI/2),P.groundGlowMaterial('#ffe08a',1.1));gl.position.set(c.x,y+.06,c.z);gl.rotation.y=-c.th;gl.renderOrder=2;group.add(gl);out.glows.push(gl);}
 // ── 멈춤 구역: 끝을 감싸는 둥근 눈 둔덕(푹신한 벽)
 {const e=skXZ(SKELETON_END),dir=Math.atan2(Math.cos(e.th),Math.sin(e.th)),r=3,list=[];
  for(let i=0;i<=24;i++){const a=dir-1.35+i/24*2.7,x=e.x+Math.sin(a)*(r+.5)-Math.cos(e.th)*1.5,z=e.z+Math.cos(a)*(r+.5)-Math.sin(e.th)*1.5;list.push(new THREE.Vector3(x,H(x,z),z));}
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list),48,.55,10,false),pp=g.attributes.position;for(let k=0;k<pp.count;k++){const x=pp.getX(k),z=pp.getZ(k),gy=H(x,z);pp.setY(k,Math.max(gy-.1,gy+(pp.getY(k)-gy)*.7));}
  g.computeVertexNormals();const m=noEdge(new THREE.Mesh(g,f.basic(lin(XMAS.snow),{name:'xmas-stop-pile'})));m.name='멈춤 구역 눈 둔덕';m.receiveShadow=true;group.add(m);}
 // 산 아래 팻말(멈춤 구역 옆): 케이블카 쪽을 가리킴(새 이모지 없이 글로만)
 {const q=skXZ(SKELETON_END-6,W/2+1.6);putS(P.buildSign(tz,['썰매 산','케이블카는 남쪽']),q.x,q.z,Math.PI,H(q.x,q.z));}

 // ── 코스마다 바뀌는 것
 const dyn=new THREE.Group();dyn.name='썰매 코스(시드)';group.add(dyn);
 const mats={road:vcMat(),bank:f.basic(lin(XMAS.snow),{name:'xmas-bank'}),ice:f.basic(lin('#a8dcff'),{name:'xmas-ice'}),jump:f.basic(lin(XMAS.snowPacked),{name:'xmas-jump'}),
  lip:f.basic(lin(XMAS.santaRed),{name:'xmas-jump-lip'}),tunnel:f.basic(lin('#dfe8f4'),{name:'xmas-tunnel'}),tunnelIn:f.basic(lin('#9fb3cf'),{name:'xmas-tunnel-in'}),rim:f.basic(lin(XMAS.woodDark),{name:'xmas-tunnel-rim'})};
 mats.tunnel.side=THREE.DoubleSide;mats.tunnelIn.side=THREE.BackSide;
 const pine=P.pineGeometry(7);
 function clear(){for(const o of [...dyn.children]){dyn.remove(o);o.traverse(m=>{if(m.isMesh&&m.geometry!==pine)m.geometry?.dispose?.();});}out.boosters.length=0;out.cpGlows=[];}
 function ribbon(C,s0,s1,{lift=.03,width=null,mat,name,across=8,color=null}){
  const pos=[],col=[],idx=[],cc=new THREE.Color(),packed=lin(XMAS.snowPacked),path=lin(XMAS.snowPath),snow=lin(XMAS.snow);let n=0;
  for(const p of C.points){if(p.s<s0-.01||p.s>s1+.01)continue;const Wd=width??p.W,nx=-Math.sin(p.th),nz=Math.cos(p.th),y=C.profileH(p.s)+lift;
   for(let k=0;k<=across;k++){const o=(k/across-.5)*Wd;pos.push(p.x+nx*o,y,p.z+nz*o);
    if(color===null){const lane=Math.abs(Math.sin((o+Wd/2)/Wd*Math.PI*4)),edge=Math.abs(o)/(Wd/2);cc.copy(packed).lerp(path,.25*lane).lerp(snow,Math.max(0,edge-.8)*2.5);col.push(cc.r,cc.g,cc.b);}}
   if(n)for(let k=0;k<across;k++){const a=(n-1)*(across+1)+k,b=n*(across+1)+k;idx.push(a,b,a+1,b,b+1,a+1);}n++;}
  if(n<2)return null;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col.length)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=noEdge(new THREE.Mesh(g,mat));m.name=name;m.receiveShadow=true;return m;}
 function setCourse(C){
  if(out.course===C)return;clear();out.course=C;
  // 다진 눈길
  {const m=ribbon(C,C.points[0].s,C.end,{mat:mats.road,name:'썰매 길'});tz(m,{kind:'prop'});dyn.add(m);}
  // 얼음 길(빛나는 파란 띠)
  for(const r of C.ice){const m=ribbon(C,r.s0,r.s1,{lift:.045,width:COURSE_W-.4,mat:mats.ice,name:'얼음 길',across:2,color:1});if(m)dyn.add(m);}
  // 눈둑(양옆, 높이 0.5m): 가장자리를 따라 납작한 반달 단면을 이어 붙임. 출발대·멈춤 구역 끝은 비움
  {const pos=[],idx=[],ring=7,list=C.points.filter((p,i)=>p.s>.5&&p.s<C.end-2.5&&i%2===0);
   for(const sd of [-1,1]){const base=pos.length/3;
    list.forEach((p,i)=>{const nx=-Math.sin(p.th),nz=Math.cos(p.th),y=C.profileH(p.s)+.02,o0=sd*(p.W/2+.28);
     for(let k=0;k<ring;k++){const a=k/(ring-1)*Math.PI,ox=o0+sd*Math.cos(Math.PI-a)*.42,oy=Math.sin(a)*.5;pos.push(p.x+nx*ox,y+oy,p.z+nz*ox);}
     if(i)for(let k=0;k<ring-1;k++){const a=base+(i-1)*ring+k,b=base+i*ring+k;idx.push(a,b,a+1,b,b+1,a+1,a,a+1,b,b,a+1,b+1);}});}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   const m=noEdge(new THREE.Mesh(g,mats.bank));m.name='썰매 길 눈둑';m.receiveShadow=true;dyn.add(m);}
  // 굽이 바깥 깃발
  {const fg=[],r=rng(C.seed);for(let i=0;i<C.points.length;i+=6){const p=C.points[i];if(Math.abs(p.k)<.07||p.tun)continue;const sd=p.k>0?-1:1,q=C.xz(p.s,sd*(p.W/2+.95));const g=P.flagPostGeometry(XMAS.flag[Math.floor(r()*4)]);g.scale(1.25,1.25,1.25);g.translate(q.x,C.profileH(p.s)-.05,q.z);fg.push(g);}
   if(fg.length){const m=new THREE.Mesh(mergeGeometries(fg),vcMat());m.name='썰매 길 깃발';tz(m,{kind:'prop'});m.castShadow=!mobile;dyn.add(m);}}
  // 구간 기록점 빛 띠(구간 1·2)
  for(const s of C.checkpoints.slice(0,2)){const c=C.xz(s),Wd=C.widthAt(s),gl=new THREE.Mesh(new THREE.PlaneGeometry(.45,Wd).rotateX(-Math.PI/2),P.groundGlowMaterial('#8fe3ff',.9));gl.position.set(c.x,C.profileH(s)+.06,c.z);gl.rotation.y=-c.th;gl.renderOrder=2;dyn.add(gl);out.cpGlows.push(gl);
   for(const sd of [-1,1]){const q=C.xz(s,sd*(Wd/2+.5)),post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,1.4,8).translate(0,.7,0),P.glow('#8fe3ff',1.6));post.position.set(q.x,C.profileH(s),q.z);dyn.add(post);}}
  // 점프대(발판 위로 오르막, 앞은 수직)
  for(const j of C.jumps){const n=10,pos=[],idx=[],Wd=C.widthAt(j.s);
   for(let i=0;i<=n;i++){const s=j.s-j.len+j.len*i/n,yb=C.profileH(s)+.02,yt=yb+C.rampH(s)+.03;
    for(const o of [-Wd/2+.15,Wd/2-.15]){const q=C.xz(s,o);pos.push(q.x,yt,q.z);}
    for(const o of [-Wd/2+.15,Wd/2-.15]){const q=C.xz(s,o);pos.push(q.x,yb,q.z);}}
   for(let i=0;i<n;i++){const a=i*4,b=(i+1)*4;idx.push(a,b,a+1,a+1,b,b+1,a,a+2,b,b,a+2,b+2,a+1,b+1,a+3,a+3,b+1,b+3);}
   const e=n*4;idx.push(e,e+2,e+1,e+1,e+2,e+3);
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   const m=new THREE.Mesh(g,mats.jump);m.name='점프대';m.castShadow=m.receiveShadow=true;dyn.add(m);
   const q=C.xz(j.s),lip=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,Wd-.3),mats.lip);lip.position.set(q.x,C.profileH(j.s)+j.h+.05,q.z);lip.rotation.y=-q.th;dyn.add(lip);}
  // 부스터 판(금빛 판 + 화살표 셋, 빛이 앞으로 흐른다)
  for(const b of C.boosters){const c=C.xz(b.s+b.len/2,b.off),y=C.profileH(b.s+b.len/2)+.07;
   const pad=new THREE.Mesh(new THREE.PlaneGeometry(b.len,b.w).rotateX(-Math.PI/2),P.groundGlowMaterial('#ffb84a',1.4));pad.position.set(c.x,y,c.z);pad.rotation.y=-c.th;pad.renderOrder=2;dyn.add(pad);
   const arrows=new THREE.Group();for(let k=0;k<3;k++){const sh=new THREE.Shape([new THREE.Vector2(0,.4),new THREE.Vector2(.32,0),new THREE.Vector2(0,-.4),new THREE.Vector2(.12,0)]);const a=new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,depthWrite:false}));a.position.x=-.6+k*.55;a.renderOrder=3;arrows.add(a);}
   arrows.position.set(c.x,y+.01,c.z);arrows.rotation.y=-c.th;dyn.add(arrows);out.boosters.push(arrows);}
  // 장애물: 눈 더미(납작한 덩어리) · 전나무
  for(const o of C.obstacles){const q=C.xz(o.s,o.off),y=C.profileH(o.s);
   if(o.kind==='pile'){const m=P.snowball(tz,o.r*.95,Math.round(o.s));m.scale.set(1.1,.62,1.1);m.position.set(q.x,y-.05,q.z);dyn.add(m);}
   else{const m=new THREE.Mesh(pine,vcMat());m.scale.setScalar(.62);m.position.set(q.x,y-.05,q.z);m.rotation.y=o.s;tz(m,{kind:'prop'});m.castShadow=true;dyn.add(m);}}
  // 터널(눈 덮인 둥근 굴 + 나무 테두리, 안쪽 작은 등)
  for(const t of C.tunnels){const pts=C.points.filter(p=>p.s>=t.s0-.01&&p.s<=t.s1+.01),seg=14,pos=[],idx=[],rx=COURSE_W/2+.75,ry=3.3;
   pts.forEach((p,i)=>{const nx=-Math.sin(p.th),nz=Math.cos(p.th),y=C.profileH(p.s);
    for(let k=0;k<=seg;k++){const a=k/seg*Math.PI,o=Math.cos(a)*rx,h=Math.sin(a)*ry;pos.push(p.x+nx*o,y+h-.05,p.z+nz*o);}
    if(i)for(let k=0;k<seg;k++){const a=(i-1)*(seg+1)+k,b=i*(seg+1)+k;idx.push(a,a+1,b,b,a+1,b+1);}});
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   const shell=new THREE.Mesh(g,mats.tunnel);shell.name='터널';shell.castShadow=!mobile;shell.receiveShadow=true;dyn.add(shell);
   // 입구·출구 나무 테두리
   for(const s of [t.s0,t.s1]){const c=C.xz(s),y=C.profileH(s),rim=new THREE.Mesh(new THREE.TorusGeometry(1,.14,6,18,Math.PI),mats.rim);rim.scale.set(rx+.05,ry+.05,1);rim.position.set(c.x,y-.05,c.z);rim.rotation.y=-c.th-Math.PI/2;dyn.add(rim);}
   if(t.lights)for(let s=t.s0+2;s<t.s1-1;s+=3.2){for(const sd of [-1,1]){const q=C.xz(s,sd*(rx-.2)),b=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),P.glow('#ffcf7a',2));b.position.set(q.x,C.profileH(s)+1.6,q.z);dyn.add(b);}}}
 }
 setCourse(course??makeCourse(dailySeed()));
 out.setCourse=setCourse;
 let t=0;
 out.update=dt=>{t+=dt;out.boosters.forEach((g,i)=>g.children.forEach((a,k)=>{a.material.opacity=.35+.65*Math.max(0,Math.sin(t*7-k*1.1+i));}));};
 return out;
}
