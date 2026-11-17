// 썰매 산 코스 그림(월드개발, 2026-11-17 — 월드아트가 다듬기 전 1차). 코스 자료는 sled-course.js, 형상 조각은 props.js.
//  다진 눈길(길 폭 4.5m) · 양옆 눈둑(0.5m) · 출발대(4줄·출발선·기록판) · 구간 기록 빛 띠 2개 · 점프대 2개 · 부스터 판 4개(빛이 흐름)
//  · 장애물(눈 더미 4·전나무 2) · 결승 아치(체크무늬 깃발) · 멈춤 구역 눈 둔덕 · 길가 깃발.
// buildSledCourse(...)는 village.js가 부른다. 돌려주는 것: update(dt,time)·board(기록판 글 바꾸기).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS} from './palette.js';
import * as P from './props.js';
import {COURSE_POINTS,COURSE_W,COURSE_END,FINISH_S,CHECKPOINTS,JUMPS,BOOSTERS,OBSTACLES,profileH,rampH,courseXZ,START_H} from './sled-course.js';

const lin=hex=>new THREE.Color(hex);
const rng=seed=>{let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};

export function buildSledCourse({group,tz,f,H,vcMat,noEdge,putS,mobile=false}){
 const out={glows:[],boards:[]};
 const pts=COURSE_POINTS,W=COURSE_W;
 // ── 다진 눈길: 가운데 선을 따라 띠(옆으로 평평), 줄무늬(썰매 자국) 꼭짓점 색
 {const pos=[],col=[],idx=[],c=new THREE.Color(),packed=lin(XMAS.snowPacked),path=lin(XMAS.snowPath),snow=lin(XMAS.snow),across=8;
  pts.forEach((p,i)=>{const nx=-Math.sin(p.th),nz=Math.cos(p.th),y=profileH(p.s)+.03;
   for(let k=0;k<=across;k++){const o=(k/across-.5)*W,x=p.x+nx*o,z=p.z+nz*o;pos.push(x,y,z);
    const lane=Math.abs(Math.sin((o+W/2)/W*Math.PI*4)),edge=Math.abs(o)/(W/2);c.copy(packed).lerp(path,.25*lane).lerp(snow,Math.max(0,edge-.8)*2.5);col.push(c.r,c.g,c.b);}
   if(i)for(let k=0;k<across;k++){const a=(i-1)*(across+1)+k,b=i*(across+1)+k;idx.push(a,b,a+1,b,b+1,a+1);}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=noEdge(new THREE.Mesh(g,vcMat()));m.name='썰매 길';m.receiveShadow=true;tz(m,{kind:'prop'});group.add(m);}
 // ── 눈둑(양옆, 높이 0.5m): 길 가장자리 납작한 관. 출발대·멈춤 구역 끝은 비움
 for(const sd of [-1,1]){const list=pts.filter((p,i)=>p.s>.5&&p.s<COURSE_END-2.5&&i%3===0).map(p=>{const q=courseXZ(p.s,sd*(W/2+.28));return new THREE.Vector3(q.x,profileH(p.s)+.05,q.z);});
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list),list.length*2,.42,8,false),pp=g.attributes.position;
  // 납작하게(위아래를 눌러 높이 약 0.5m)
  for(let k=0;k<pp.count;k++){const near=list.reduce((b,v,i)=>{const d=(v.x-pp.getX(k))**2+(v.z-pp.getZ(k))**2;return d<b.d?{d,v}:b;},{d:1e9,v:list[0]});pp.setY(k,near.v.y+Math.max(-.08,(pp.getY(k)-near.v.y)*.62+.08));}
  g.computeVertexNormals();const m=noEdge(new THREE.Mesh(g,f.basic(lin(XMAS.snow),{name:'xmas-bank'})));m.name='썰매 길 눈둑';m.receiveShadow=true;group.add(m);}
 // ── 굽이 바깥 깃발(3m마다, 굽은 곳만)
 {const fg=[],r=rng(31);for(let i=0;i<pts.length;i+=6){const p=pts[i];if(!p.k)continue;const sd=p.k>0?-1:1,q=courseXZ(p.s,sd*(W/2+.95));const g=P.flagPostGeometry(XMAS.flag[Math.floor(r()*4)]);g.scale(1.25,1.25,1.25);g.translate(q.x,profileH(p.s)-.05,q.z);fg.push(g);}
  if(fg.length){const m=new THREE.Mesh(mergeGeometries(fg),vcMat());m.name='썰매 길 깃발';tz(m,{kind:'prop'});m.castShadow=!mobile;group.add(m);}}
 // ── 출발대: 출발선(빨강·흰 줄) + 4줄 번호 깃발 + 출발 문 기둥·가로대 + 「썰매 산」 팻말 + 오늘의 기록판
 {const s0=0,c=courseXZ(s0),y=START_H+.04,ry=-c.th+Math.PI/2;
  const line=new THREE.Mesh(new THREE.BoxGeometry(.18,.02,W),new THREE.MeshBasicMaterial({color:'#c23a32'}));line.position.set(c.x,y,c.z);line.rotation.y=-c.th;group.add(line);
  for(let k=0;k<4;k++){const o=(k-1.5)*1,q=courseXZ(-1.8,o);const f2=new THREE.Mesh(P.flagPostGeometry(XMAS.flag[k%4]),vcMat());f2.position.set(q.x,START_H,q.z);f2.rotation.y=ry;tz(f2,{kind:'prop'});group.add(f2);}
  // 출발 문(기둥 둘 + 가로대 + 화환)
  for(const sd of [-1,1]){const q=courseXZ(.2,sd*(W/2+.35));const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,2.6,10).translate(0,1.3,0),f.basic(lin(XMAS.candy),{name:'xmas-gate-post'}));post.position.set(q.x,START_H,q.z);post.castShadow=true;group.add(post);}
  {const q=courseXZ(.2,0);const bar=new THREE.Mesh(new THREE.BoxGeometry(.16,.18,W+.8),f.basic(lin(XMAS.pine),{name:'xmas-gate-bar'}));bar.position.set(q.x,START_H+2.55,q.z);bar.rotation.y=-c.th;group.add(bar);}
  {const q=courseXZ(-2.2,-(W/2+1.4));putS(P.buildSign(tz,['썰매 산 출발대','레이스 · 혼자 타기']),q.x,q.z,ry+Math.PI*.15,START_H);}
  // 오늘의 기록판(글은 sled-race가 board()로 그림)
  const cv=document.createElement('canvas');cv.width=512;cv.height=384;const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const bd=new THREE.Group();bd.name='오늘의 기록판';
  const frame=new THREE.Mesh(new THREE.BoxGeometry(2.1,1.6,.1),f.basic(lin(XMAS.woodDark),{name:'xmas-board-frame'}));frame.position.y=1.7;bd.add(frame);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.96,1.47),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));face.position.set(0,1.7,.06);bd.add(face);
  for(const sx of [-.9,.9]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,1,.1).translate(0,.5,0),f.basic(lin(XMAS.woodDark),{name:'xmas-board-leg'}));leg.position.x=sx;bd.add(leg);}
  const q=courseXZ(-2.6,W/2+1.6);bd.position.set(q.x,START_H,q.z);bd.rotation.y=-c.th-Math.PI/2+.5;group.add(bd);
  out.boardCanvas=cv;out.boardTex=tex;}
 // ── 구간 기록점 빛 띠(구간 1·2) + 결승 아치
 for(const s of CHECKPOINTS.slice(0,2)){const c=courseXZ(s),gl=new THREE.Mesh(new THREE.PlaneGeometry(.45,W).rotateX(-Math.PI/2),P.groundGlowMaterial('#8fe3ff',.9));gl.position.set(c.x,profileH(s)+.06,c.z);gl.rotation.y=-c.th;gl.renderOrder=2;group.add(gl);out.glows.push(gl);
  for(const sd of [-1,1]){const q=courseXZ(s,sd*(W/2+.5)),post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,1.4,8).translate(0,.7,0),P.glow('#8fe3ff',1.6));post.position.set(q.x,profileH(s),q.z);group.add(post);}}
 {const s=FINISH_S,c=courseXZ(s),y=profileH(s),g=new THREE.Group();g.name='결승 아치';
  for(const sd of [-1,1]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,3.2,12).translate(0,1.6,0),f.basic(lin(XMAS.santaRed),{name:'xmas-finish-post'}));post.position.z=sd*(W/2+.45);post.castShadow=true;g.add(post);}
  // 체크무늬 깃발(흑백 칸 12×2)
  const cols=12,rows=2,geo=new THREE.PlaneGeometry(W+.9,.7,cols,rows).toNonIndexed(),pc=geo.attributes.position,colr=[];
  for(let t=0;t<pc.count;t+=3){const cx=(pc.getX(t)+pc.getX(t+1)+pc.getX(t+2))/3,cy=(pc.getY(t)+pc.getY(t+1)+pc.getY(t+2))/3,i=Math.floor((cx+(W+.9)/2)/((W+.9)/cols)),j=Math.floor((cy+.35)/(.7/rows)),k=(i+j)%2?1:.08;for(let q=0;q<3;q++)colr.push(k,k,k);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));const ban=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));ban.rotation.y=Math.PI/2;ban.position.y=2.85;g.add(ban);
  g.position.set(c.x,y,c.z);g.rotation.y=-c.th;group.add(g);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(.5,W).rotateX(-Math.PI/2),P.groundGlowMaterial('#ffe08a',1.1));gl.position.set(c.x,y+.06,c.z);gl.rotation.y=-c.th;gl.renderOrder=2;group.add(gl);out.glows.push(gl);}
 // ── 점프대(발판 위로 오르막, 앞은 수직): 눈 덮인 나무 경사로
 for(const j of JUMPS){const n=10,pos=[],idx=[];
  for(let i=0;i<=n;i++){const s=j.s-j.len+j.len*i/n,yb=profileH(s)+.02,yt=yb+rampH(s)+.03;
   for(const o of [-W/2+.15,W/2-.15]){const q=courseXZ(s,o);pos.push(q.x,yt,q.z);}
   for(const o of [-W/2+.15,W/2-.15]){const q=courseXZ(s,o);pos.push(q.x,yb,q.z);}}
  for(let i=0;i<n;i++){const a=i*4,b=(i+1)*4;idx.push(a,b,a+1,a+1,b,b+1,  a,a+2,b,b,a+2,b+2,  a+1,b+1,a+3,a+3,b+1,b+3);}
  const e=n*4;idx.push(e,e+2,e+1,e+1,e+2,e+3); // 앞(수직)
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,f.basic(lin(XMAS.snowPacked),{name:'xmas-jump'}));m.name='점프대';m.castShadow=m.receiveShadow=true;group.add(m);
  // 발판 끝 나무 테두리(빨강)
  const q=courseXZ(j.s),lip=new THREE.Mesh(new THREE.BoxGeometry(.12,.1,W-.3),f.basic(lin(XMAS.santaRed),{name:'xmas-jump-lip'}));lip.position.set(q.x,profileH(j.s)+j.h+.05,q.z);lip.rotation.y=-q.th;group.add(lip);}
 // ── 부스터 판(금빛 빛 판 + 화살표 셋, 빛이 앞으로 흐른다)
 out.boosters=[];
 for(const b of BOOSTERS){const c=courseXZ(b.s+b.len/2,b.off),y=profileH(b.s+b.len/2)+.07;
  const pad=new THREE.Mesh(new THREE.PlaneGeometry(b.len,b.w).rotateX(-Math.PI/2),P.groundGlowMaterial('#ffb84a',1.4));pad.position.set(c.x,y,c.z);pad.rotation.y=-c.th;pad.renderOrder=2;group.add(pad);
  const arrows=new THREE.Group();for(let k=0;k<3;k++){const sh=new THREE.Shape([new THREE.Vector2(0,.4),new THREE.Vector2(.32,0),new THREE.Vector2(0,-.4),new THREE.Vector2(.12,0)]);const a=new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,depthWrite:false}));a.position.x=-.6+k*.55;a.renderOrder=3;arrows.add(a);}
  arrows.position.set(c.x,y+.01,c.z);arrows.rotation.y=-c.th;group.add(arrows);out.boosters.push(arrows);}
 // ── 장애물: 눈 더미(납작한 덩어리) · 전나무
 {const pine=P.pineGeometry(7);
  for(const o of OBSTACLES){const q=courseXZ(o.s,o.off),y=profileH(o.s);
   if(o.kind==='pile'){const m=P.snowball(tz,o.r*.95,Math.round(o.s));m.scale.set(1.1,.62,1.1);m.position.set(q.x,y-.05,q.z);group.add(m);}
   else{const m=new THREE.Mesh(pine,vcMat());m.scale.setScalar(.62);m.position.set(q.x,y-.05,q.z);m.rotation.y=o.s;tz(m,{kind:'prop'});m.castShadow=true;group.add(m);}}}
 // ── 멈춤 구역: 끝을 감싸는 둥근 눈 둔덕(푹신한 벽)
 {const e=courseXZ(COURSE_END),dir=Math.atan2(Math.cos(e.th),Math.sin(e.th)),r=3,list=[];
  for(let i=0;i<=24;i++){const a=dir-1.35+i/24*2.7,x=e.x+Math.sin(a)*(r+.5)-Math.cos(e.th)*1.5,z=e.z+Math.cos(a)*(r+.5)-Math.sin(e.th)*1.5;list.push(new THREE.Vector3(x,H(x,z),z));}
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list),48,.55,10,false),pp=g.attributes.position;for(let k=0;k<pp.count;k++){const x=pp.getX(k),z=pp.getZ(k),gy=H(x,z);pp.setY(k,Math.max(gy-.1,gy+(pp.getY(k)-gy)*.7));}
  g.computeVertexNormals();const m=noEdge(new THREE.Mesh(g,f.basic(lin(XMAS.snow),{name:'xmas-stop-pile'})));m.name='멈춤 구역 눈 둔덕';m.receiveShadow=true;group.add(m);}
 // 산 아래 팻말(멈춤 구역 옆): 출발대로 올라가는 단추가 여기서도 뜬다
 {const q=courseXZ(COURSE_END-6,-(W/2+1.6));putS(P.buildSign(tz,['썰매 산','출발대로 ⬆']),q.x,q.z,Math.PI,H(q.x,q.z));}
 let t=0;
 out.update=dt=>{t+=dt;out.boosters.forEach((g,i)=>g.children.forEach((a,k)=>{a.material.opacity=.35+.65*Math.max(0,Math.sin(t*7-k*1.1+i));}));};
 return out;
}
