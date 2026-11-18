// 썰매 산 코스 그림(월드개발, 2026-11-17 · 2차: 코스가 바뀌면 다시 그림 · 11-18 월드아트 다듬기: 길 띠 감기·색, 굽이 바깥 눈둑·턱, 출발대 줄 색 판, 터널 안 그늘). 코스 자료는 sled-course.js makeCourse(seed), 형상 조각은 props.js.
//  늘 같은 것(한 번만): 출발대(출발선·4줄 깃발·출발 문·팻말·오늘의 기록판) · 결승 아치(결승 자리는 시드와 상관없이 같다) · 멈춤 구역 눈 둔덕 · 산 아래 팻말.
//  코스마다(setCourse): 다진 눈길(폭이 좁아지는 곳 포함) · 양옆 눈둑 · 굽이 깃발 · 구간 기록 빛 띠 2개 · 점프대 · 부스터 판 · 장애물(눈 더미·전나무) · 얼음 길 · 터널.
// buildSledCourse(...)는 village.js가 부른다. 돌려주는 것: update(dt)·setCourse(course)·boardCanvas/boardTex(기록판 글).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS} from './palette.js';
import * as P from './props.js';
import {WIDE_W,TUNNEL_W,START_H,FINISH_U,SKELETON_END,skeletonAt,heightU,makeCourse,dailySeed} from './sled-course.js';
import {laneOffset} from './sled.js';

// 출발대 줄 색 판(진행 방향 길이 m). 판 가운데 = 줄 자리(출발선 1.5m 뒤)
export const LANE_PLATE=Object.freeze({len:2.8});
// 굽이 바깥 눈둑(월드아트 11-18): 굽음(1/m)이 from~to 사이에서 바깥 눈둑이 높고 두꺼워지고 빨강·흰 턱이 붙는다(안쪽 가장자리 자리는 그대로)
export const TURN_BANK=Object.freeze({from:.05,to:.14,h:.36,wide:.3,kerbAt:.35,kerbLen:.9});

const lin=hex=>new THREE.Color(hex);
const rng=seed=>{let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
// 뼈대 자리(u, 옆 off) → 세계 x,z,방향
const skXZ=(u,off=0)=>{const c=skeletonAt(u),nx=-Math.sin(c.th),nz=Math.cos(c.th);return {x:c.x+nx*off,z:c.z+nz*off,th:c.th};};

export function buildSledCourse({group,tz,f,H,vcMat,noEdge,putS,mobile=false,course=null}){
 const out={glows:[],boosters:[],course:null};
 const W=WIDE_W; // 출발 직선·결승 직선은 7m(11-18 4명 경주)
 // ── 출발대: 출발선(빨강) + 4줄 번호 깃발 + 출발 문 기둥·가로대 + 「썰매 산」 팻말 + 오늘의 기록판
 {const c=skXZ(0),y=START_H+.04,ry=-c.th+Math.PI/2;
  const line=new THREE.Mesh(new THREE.BoxGeometry(.18,.02,W),new THREE.MeshBasicMaterial({color:'#c23a32'}));line.position.set(c.x,y,c.z);line.rotation.y=-c.th;group.add(line);
  // 줄 깃발: 줄 색(1 빨강·2 초록·3 파랑·4 노랑)과 같게(월드아트 11-18, 전에는 깃발 4색 순서라 2·3·4줄 색이 달랐음). 판 뒤 끝 오른쪽 틈에 꽂아 번호를 가리지 않음
  for(let k=0;k<4;k++){const q=skXZ(-1.5-LANE_PLATE.len/2+.1,laneOffset(k+1)+Math.abs(laneOffset(2)-laneOffset(1))*.5);const f2=new THREE.Mesh(P.flagPostGeometry(XMAS.lane[k]),vcMat());f2.position.set(q.x,START_H,q.z);f2.rotation.y=ry;tz(f2,{kind:'prop'});group.add(f2);}
  // 출발대 바닥 줄 색 판(월드아트 11-18): 줄 자리(sled-play laneSpot = 출발선 1.5m 뒤, laneOffset 간격)마다 색 판 + 흰 번호 + 앞 화살.
  //  판 넷을 캔버스 그림 하나로 → 그리기 1번. 뒤에 서서 내려다볼 때 번호가 바로 읽힌다(캔버스 위 = 내려가는 쪽)
  {const gap=Math.abs(laneOffset(2)-laneOffset(1)),Wp=gap*4,Lp=LANE_PLATE.len,px=100,cv=document.createElement('canvas');cv.width=Math.round(Wp*px);cv.height=Math.round(Lp*px);
   const g=cv.getContext('2d'),rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
   for(let k=0;k<4;k++){const x0=k*gap*px,w=gap*px,m=w*.1,X=x0+m,Y=8,PW=w-m*2,PH=cv.height-16;
    g.fillStyle=XMAS.lane[k];rr(X,Y,PW,PH,22);g.fill();
    g.lineWidth=6;g.strokeStyle='rgba(255,250,240,.85)';rr(X+7,Y+7,PW-14,PH-14,16);g.stroke();
    // 앞 화살(내려가는 쪽 = 캔버스 위)
    g.fillStyle='rgba(255,250,240,.9)';const cx=x0+w/2,ay=Y+26;g.beginPath();g.moveTo(cx,ay);g.lineTo(cx+PW*.26,ay+PW*.24);g.lineTo(cx+PW*.12,ay+PW*.24);g.lineTo(cx,ay+PW*.13);g.lineTo(cx-PW*.12,ay+PW*.24);g.lineTo(cx-PW*.26,ay+PW*.24);g.closePath();g.fill();
    // 번호: 뒤쪽(타는 사람 발밑)
    // 번호: 뒤 끝(썰매 뒤, 타려고 다가오는 사람 발밑 — 썰매가 판 가운데를 가려도 보임)
    const ny=Y+PH-44;g.font=`900 74px "Apple SD Gothic Neo",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineWidth=10;g.strokeStyle='rgba(60,40,20,.35)';
    g.strokeText(String(k+1),cx,ny);g.fillStyle='#fffaf0';g.fillText(String(k+1),cx,ny);}
   const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
   // 섞기: 색은 보통 반투명, 알파는 밑(길 띠)의 값을 그대로 둔다 — 길 띠의 「외곽선 빼기」 표시(알파 0.5)를 덮으면 휴대폰에서 판 위에 가로 줄이 생김
   const mat=new THREE.MeshBasicMaterial({map:tex,color:'#dfe3ee',transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
    blending:THREE.CustomBlending,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor});
   const c2=skXZ(-1.5,(laneOffset(1)+laneOffset(4))/2),plate=new THREE.Mesh(new THREE.PlaneGeometry(Wp,Lp).rotateX(-Math.PI/2),mat);
   plate.position.set(c2.x,START_H+.03,c2.z);plate.rotation.y=-c2.th-Math.PI/2;plate.renderOrder=2;plate.name='출발대 줄 색 판';group.add(plate);out.lanePlate=plate;}
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
 mats.tunnel.side=THREE.BackSide;mats.tunnelIn.side=THREE.FrontSide;
 const pine=P.pineGeometry(7);
 function clear(){for(const o of [...dyn.children]){dyn.remove(o);o.traverse(m=>{if(m.isMesh&&m.geometry!==pine)m.geometry?.dispose?.();});}out.boosters.length=0;out.cpGlows=[];}
 // 길 띠. width = 고정 폭, pad = 그 자리 길 폭에서 뺄 값(얼음 길처럼 길 폭을 따라가는 띠)
 //  월드아트 11-18: 다진 길은 둘레 눈보다 한 단 짙게(sledRoad) + 4줄 다진 결(sledGroom, 줄 수 = 경주 4대) + 가장자리 0.4m는 눈으로 녹아듦 — 밤에 길이 읽히게
 function ribbon(C,s0,s1,{lift=.03,width=null,pad=0,mat,name,across=8,color=null}){
  const pos=[],col=[],idx=[],cc=new THREE.Color(),road=lin(XMAS.sledRoad),groom=lin(XMAS.sledGroom),snow=lin(XMAS.snow);let n=0;
  for(const p of C.points){if(p.s<s0-.01||p.s>s1+.01)continue;const Wd=width??(p.W-pad),nx=-Math.sin(p.th),nz=Math.cos(p.th),y=C.profileH(p.s)+lift;
   for(let k=0;k<=across;k++){const o=(k/across-.5)*Wd;pos.push(p.x+nx*o,y,p.z+nz*o);
    if(color===null){const lane=Math.pow(Math.abs(Math.sin((o+Wd/2)/Wd*Math.PI*4)),2),edge=Math.abs(o)/(Wd/2);cc.copy(road).lerp(groom,.7*lane).lerp(snow,Math.min(1,Math.max(0,edge-.86)*7));col.push(cc.r,cc.g,cc.b);}}
   // 삼각형은 위를 보게 감는다(월드아트 11-18: 전에는 아래를 봐서 위에서 보면 길 띠가 안 그려지고 밑의 눈 땅만 보였다 — 얼음 길도 같음)
   if(n)for(let k=0;k<across;k++){const a=(n-1)*(across+1)+k,b=n*(across+1)+k;idx.push(a,a+1,b,b,a+1,b+1);}n++;}
  if(n<2)return null;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col.length)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=noEdge(new THREE.Mesh(g,mat));m.name=name;m.receiveShadow=true;return m;}
 function setCourse(C){
  if(out.course===C)return;clear();out.course=C;
  // 다진 눈길
  // 카툰 재질로 바꾼 뒤 외곽선 빼기(noEdge)를 다시 건다 — tz가 재질을 바꿔 끼우면 빠져서, 길이 보이게 된 뒤 휴대폰에서 가로 줄무늬가 생겼다
  {const m=ribbon(C,C.points[0].s,C.end,{mat:mats.road,name:'썰매 길',across:16});tz(m,{kind:'prop'});noEdge(m);dyn.add(m);}
  // 얼음 길(빛나는 파란 띠): 그 자리 길 폭 − 0.4m(좁은 곳·굽이에서도 길 밖으로 나가지 않게)
  for(const r of C.ice){const m=ribbon(C,r.s0,r.s1,{lift:.045,pad:.4,mat:mats.ice,name:'얼음 길',across:2,color:1});if(m)dyn.add(m);}
  // 눈둑(양옆, 높이 0.5m): 가장자리를 따라 납작한 반달 단면을 이어 붙임. 출발대·멈춤 구역 끝은 비움
  //  월드아트 11-18: 굽이 바깥 눈둑은 굽음만큼 높고(최대 +0.36m) 두껍게(+0.3m) — 안쪽 가장자리(길 폭/2 − 0.14m)는 그대로라 부딪히는 자리는 같다.
  //  바깥 눈둑 발치에는 빨강·흰 턱(kerb)을 0.9m마다 번갈아 놓아 헤어핀이 멀리서 보이게(한 덩어리, 그리기 1번)
  const turnOf=p=>{const t=Math.min(1,Math.max(0,(Math.abs(p.k)-TURN_BANK.from)/(TURN_BANK.to-TURN_BANK.from)));return {t:t*t*(3-2*t),out:p.k>0?-1:1};};
  {const pos=[],idx=[],ring=7,list=C.points.filter((p,i)=>p.s>.5&&p.s<C.end-2.5&&i%2===0);
   for(const sd of [-1,1]){const base=pos.length/3;
    list.forEach((p,i)=>{const nx=-Math.sin(p.th),nz=Math.cos(p.th),y=C.profileH(p.s)+.02,tb=turnOf(p),t=tb.out===sd?tb.t:0,wd=.42+TURN_BANK.wide*t,ht=.5+TURN_BANK.h*t,o0=sd*(p.W/2-.14+wd);
     for(let k=0;k<ring;k++){const a=k/(ring-1)*Math.PI,ox=o0+sd*Math.cos(Math.PI-a)*wd,oy=Math.sin(a)*ht;pos.push(p.x+nx*ox,y+oy,p.z+nz*ox);}
     if(i)for(let k=0;k<ring-1;k++){const a=base+(i-1)*ring+k,b=base+i*ring+k;idx.push(a,b,a+1,b,b+1,a+1,a,a+1,b,b,a+1,b+1);}});}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   const m=noEdge(new THREE.Mesh(g,mats.bank));m.name='썰매 길 눈둑';m.receiveShadow=true;dyn.add(m);}
  {const parts=[],cR=lin(XMAS.candyStripe),cW=lin(XMAS.candy),L=TURN_BANK.kerbLen;let n=0;
   for(let s=C.points[0].s+1;s<C.end-3;s+=L){const a=C.at(s+L/2),tb=turnOf(a);if(tb.t<TURN_BANK.kerbAt||a.tun)continue;
    const q=C.xz(s+L/2,tb.out*(a.W/2-.02)),gy=C.profileH(s+L/2),b=new THREE.BoxGeometry(L*.96,.16,.3).toNonIndexed();
    b.rotateY(-a.th);b.translate(q.x,gy+.08,q.z);const c=(Math.floor(s/L)%2)?cR:cW,cl=[];for(let k=0;k<b.attributes.position.count;k++)cl.push(c.r,c.g,c.b);
    b.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));b.deleteAttribute('uv');parts.push(b);n++;}
   if(parts.length){const m=new THREE.Mesh(mergeGeometries(parts),vcMat());m.name='굽이 바깥 턱';tz(m,{kind:'prop'});m.receiveShadow=true;dyn.add(m);out.kerbs=n;}else out.kerbs=0;}
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
  for(const t of C.tunnels){const pts=C.points.filter(p=>p.s>=t.s0-.01&&p.s<=t.s1+.01),seg=14,pos=[],idx=[],rx=TUNNEL_W/2+.75,ry=3.3;
   pts.forEach((p,i)=>{const nx=-Math.sin(p.th),nz=Math.cos(p.th),y=C.profileH(p.s);
    for(let k=0;k<=seg;k++){const a=k/seg*Math.PI,o=Math.cos(a)*rx,h=Math.sin(a)*ry;pos.push(p.x+nx*o,y+h-.05,p.z+nz*o);}
    if(i)for(let k=0;k<seg;k++){const a=(i-1)*(seg+1)+k,b=i*(seg+1)+k;idx.push(a,a+1,b,b,a+1,b+1);}});
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
   // 월드아트 11-18: 삼각형이 안쪽을 보게 감겨 있으므로 바깥 = 뒷면(밝은 눈), 안 = 앞면(짙은 푸른 그늘) — 전에는 안팎이 같은 색이라 터널 속이 밖처럼 밝았다
   const shell=new THREE.Mesh(g,mats.tunnel);shell.name='터널';shell.castShadow=!mobile;shell.receiveShadow=true;dyn.add(shell);
   const inner=new THREE.Mesh(g,mats.tunnelIn);inner.name='터널 안';dyn.add(inner);
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
