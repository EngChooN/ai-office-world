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
 const mats={road:vcMat(),bank:f.basic(lin(XMAS.snow),{name:'xmas-bank'}),ice:f.basic(lin('#a8dcff'),{name:'xmas-ice'}),
  lip:f.basic(lin(XMAS.gold),{name:'xmas-jump-lip'}),tunnel:f.basic(lin('#dfe8f4'),{name:'xmas-tunnel'}),tunnelIn:f.basic(lin('#9fb3cf'),{name:'xmas-tunnel-in'}),rim:f.basic(lin(XMAS.woodDark),{name:'xmas-tunnel-rim'})};
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
  // 점프대(발판 위로 오르막, 앞은 수직) — 월드아트 11-17: 윗면이 아래를 보고 있어(삼각형 감기 방향) 위에서 보면 안 그려져 투명해 보이던 것을 고침.
  // 모양·높이는 그대로(윗면 = profileH + 0.02 + rampH + 0.03, 폭 = 길 폭 − 0.3: 착지·충돌 값 C.rampH와 같음). 면마다 바깥을 보게 감고 색을 칠했다:
  // 윗면 = 나무 판(밝고 어두운 판 번갈아, 눈 위에서 또렷함) · 옆면 = 빨강·흰 표시 줄무늬 · 앞(수직) = 짙은 나무 · 끝 = 금빛 턱 + 전구 줄 · 양옆 전구 기둥(멀리서도 보임).
  {const cP=lin('#c48a55'),cL=lin('#e2b27a'),cD=lin(XMAS.woodDark),cR=lin(XMAS.santaRed),cW=lin(XMAS.candy),bulbs=[],posts=[];
   for(const j of C.jumps){const n=12,Wd=C.widthAt(j.s),pos=[],col=[],L=[],R=[];
    for(let i=0;i<=n;i++){const s=j.s-j.len+j.len*i/n,yb=C.profileH(s)+.02,yt=yb+C.rampH(s)+.03,l=C.xz(s,-Wd/2+.15),r=C.xz(s,Wd/2-.15);
     L.push({t:[l.x,yt,l.z],b:[l.x,yb,l.z]});R.push({t:[r.x,yt,r.z],b:[r.x,yb,r.z]});}
    // 사각형 하나 = 삼각형 둘. out(바깥 방향)과 법선이 반대면 감기를 뒤집는다(어느 방향으로 놓여도 바깥을 봄)
    const quad=(a,b,c,d,colr,out)=>{const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[d[0]-a[0],d[1]-a[1],d[2]-a[2]],nn=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
     const flip=nn[0]*out[0]+nn[1]*out[1]+nn[2]*out[2]<0,tri=flip?[a,d,c,a,c,b]:[a,b,c,a,c,d];for(const p of tri){pos.push(...p);col.push(colr.r,colr.g,colr.b);}};
    const q0=C.xz(j.s-j.len),q1=C.xz(j.s),fx=q1.x-q0.x,fz=q1.z-q0.z,fl=Math.hypot(fx,fz)||1,F=[fx/fl,0,fz/fl],N=[-F[2],0,F[0]];
    for(let i=0;i<n;i++){
     quad(L[i].t,R[i].t,R[i+1].t,L[i+1].t,i%2?cL:cP,[0,1,0]);
     quad(L[i].t,L[i+1].t,L[i+1].b,L[i].b,i%2?cW:cR,[-N[0],0,-N[2]]);
     quad(R[i].t,R[i+1].t,R[i+1].b,R[i].b,i%2?cW:cR,N);}
    quad(L[n].t,R[n].t,R[n].b,L[n].b,cD,F);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
    const m=new THREE.Mesh(g,vcMat());m.name='점프대';tz(m,{kind:'prop'});m.castShadow=m.receiveShadow=true;dyn.add(m);
    // 끝 턱(금빛) + 턱 위 전구 줄
    const q=C.xz(j.s),top=C.profileH(j.s)+.05+j.h,lip=new THREE.Mesh(new THREE.BoxGeometry(.16,.12,Wd-.2),mats.lip);lip.position.set(q.x,top+.03,q.z);lip.rotation.y=-q.th;dyn.add(lip);
    const nb=Math.max(4,Math.round((Wd-.4)/(mobile?.6:.4)));for(let k=0;k<=nb;k++){const o=-(Wd-.4)/2+(Wd-.4)*k/nb,b=C.xz(j.s,o);bulbs.push(new THREE.SphereGeometry(.055,8,6).translate(b.x,top+.13,b.z));}
    // 양옆 기둥(사탕 줄무늬) + 위 전구: 길 밖 눈둑 위, 턱과 같은 자리
    for(const sd of [-1,1]){const b=C.xz(j.s,sd*(Wd/2+.45)),gy=C.profileH(j.s);posts.push(new THREE.CylinderGeometry(.06,.07,j.h+1.1,8,6).translate(b.x,gy+(j.h+1.1)/2,b.z));bulbs.push(new THREE.SphereGeometry(.12,10,8).translate(b.x,gy+j.h+1.2,b.z));}}
   if(posts.length){const pg=mergeGeometries(posts),pp=pg.attributes.position,pc=[];for(let k=0;k<pp.count;k++){const c=Math.floor(pp.getY(k)*4)%2?cR:cW;pc.push(c.r,c.g,c.b);}pg.setAttribute('color',new THREE.Float32BufferAttribute(pc,3));
    const m=new THREE.Mesh(pg,vcMat());m.name='점프대 기둥';tz(m,{kind:'prop'});m.castShadow=!mobile;dyn.add(m);}
   if(bulbs.length){const m=new THREE.Mesh(mergeGeometries(bulbs),P.glow('#ffd27a',2.6));m.name='점프대 전구';dyn.add(m);}}
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
