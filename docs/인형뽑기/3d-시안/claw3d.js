// 인형뽑기 3D 손맛 시안 v2 (월드디자인 2026-11-23). 정식 구현이 아니라 대표가 손맛·어려움을 보고 고르기 위한 시안.
// 물리는 claw-physics.js, 여기는 그림·카메라·단추·흐름. 그림(가게·기계·인형)은 자리 잡기용 임시 — 월드아트 몫.
import * as THREE from 'three';
import {createGradientMap} from '/src/toon/gradient.js';
import {createSim,BOX,CHUTE,WALLS,HOME,CLAW,TYPES} from './claw-physics.js';

// 기계 3대(숫자는 모두 임시값, 대표 미확인). power = 집게 세기(잡을 때 / 들고 갈 때)
const MACHINES=[
 {id:'easy',name:'삐약이 기계',tag:'쉬움',types:['chick','chick','bear'],count:12,power:{grab:.002,carry:.0015}},
 {id:'mid',name:'곰토끼 기계',tag:'보통',types:['bear','bunny','chick','seal'],count:14,power:{grab:.0012,carry:.0008}},
 {id:'hard',name:'물개 기계',tag:'어려움',types:['seal','bunny','seal'],count:16,power:{grab:.0008,carry:.0005}},
];
const STRONG={grab:.012,carry:.012};   // n번 실패 뒤 「힘센 집게」(보장은 아님, 시험에서 약 60%)
const PITY_N=5, PLAY_SEC=20, COINS=10;
const DOLL_LOOK={
 bear:{art:'🧸',body:'#c9926b',light:'#f0d2b2'},bunny:{art:'🐰',body:'#f6f0e8',light:'#f5b9c6'},
 seal:{art:'🦭',body:'#a9c3d6',light:'#e6f0f6'},chick:{art:'🐥',body:'#ffd85a',light:'#ff9a3c'},
};

// ── 그리기 바탕
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#f3d5df');
const camera=new THREE.PerspectiveCamera(45,1,.1,200);
const grad=createGradientMap();
const toon=(color,o={})=>new THREE.MeshToonMaterial({color,gradientMap:grad,...o});
const ink=new THREE.MeshBasicMaterial({color:'#3b2f2a',side:THREE.BackSide});
const outlined=(mesh,w=.035)=>{const o=new THREE.Mesh(mesh.geometry,ink);o.scale.setScalar(1+w/Math.max(.05,mesh.geometry.boundingSphere?.radius||.5));mesh.add(o);return mesh;};
scene.add(new THREE.HemisphereLight('#fff6ee','#c7a39a',1.6));
const top=new THREE.DirectionalLight('#fffaf0',2.2);top.position.set(0,14,.4);top.target.position.set(0,0,0);
top.castShadow=true;top.shadow.mapSize.set(1024,1024);Object.assign(top.shadow.camera,{left:-4,right:4,top:3.2,bottom:-3.2,near:2,far:20});top.shadow.bias=-.0015;top.shadow.camera.up.set(0,0,-1);   // 위에서 곧장 내려 비추는 빛(집게 그림자가 바로 아래에 = 깊이 단서)
scene.add(top,top.target);
const front=new THREE.DirectionalLight('#ffe9f0',.7);front.position.set(-3,6,12);scene.add(front);

// ── 가게 바닥·벽(임시)
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),toon('#e8c9a8'));floor.rotation.x=-Math.PI/2;floor.position.y=-4.6;floor.receiveShadow=true;scene.add(floor);
const wall=new THREE.Mesh(new THREE.PlaneGeometry(60,30),toon('#f6d9e6'));wall.position.set(0,8,-9);scene.add(wall);

// ── 기계
const M=new THREE.Group();scene.add(M);
const pink=toon('#ff8fb1'),pinkD=toon('#e8668f'),cream=toon('#fff4e6'),felt=toon('#bfe3d8'),metal=toon('#e9c46a');
const box=(w,h,d,mat,x,y,z,shadow=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=shadow;M.add(m);return m;};
// 아래 몸통·위 간판
box(7.2,4.6,5.2,pink,0,-2.3,0);box(7.4,.3,5.4,pinkD,0,-.05,0);
box(7.4,1.6,5.4,pink,0,9.4,0);
const sign=(()=>{const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');
 g.fillStyle='#e8668f';g.fillRect(0,0,512,96);g.fillStyle='#fff';g.font='800 52px "Apple SD Gothic Neo",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('인형뽑기',256,50);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(5.2,.98),new THREE.MeshBasicMaterial({map:t}));m.position.set(0,9.4,2.71);M.add(m);return m;})();
// 네 기둥
for(const [x,z] of [[-3.55,-2.55],[3.55,-2.55],[-3.55,2.55],[3.55,2.55]])box(.3,8.6,.3,pinkD,x,4.3,z);
// 안쪽 바닥(구멍 자리를 빼고 깔기)
const fl=(x0,x1,z0,z1)=>box(x1-x0,.2,z1-z0,felt,(x0+x1)/2,-.1,(z0+z1)/2);
fl(BOX.x0,BOX.x1,BOX.z0,CHUTE.z0);fl(CHUTE.x1,BOX.x1,CHUTE.z0,BOX.z1);
box(CHUTE.x1-CHUTE.x0,.1,CHUTE.z1-CHUTE.z0,toon('#5a3a4a'),(CHUTE.x0+CHUTE.x1)/2,-2.2,(CHUTE.z0+CHUTE.z1)/2);   // 구멍 속
// 뒷벽(무늬)
{const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.fillStyle='#fde3ec';g.fillRect(0,0,256,256);
 g.fillStyle='#f9c6d6';for(let y=0;y<256;y+=64)for(let x=(y/64%2)*32;x<256;x+=64){g.beginPath();g.arc(x+16,y+16,10,0,7);g.fill();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,4);t.colorSpace=THREE.SRGBColorSpace;
 const b=new THREE.Mesh(new THREE.PlaneGeometry(6.8,8.6),new THREE.MeshToonMaterial({map:t,gradientMap:grad}));b.position.set(0,4.3,BOX.z0-.15);b.receiveShadow=true;M.add(b);}
// 유리(앞·양옆) — 반사 줄 두 개로 유리임을 알림
const glassMat=new THREE.MeshBasicMaterial({color:'#dff4ff',transparent:true,opacity:.1,depthWrite:false});
const glint=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.22,depthWrite:false});
const glass=(w,h,x,z,ry)=>{const g=new THREE.Mesh(new THREE.PlaneGeometry(w,h),glassMat);g.position.set(x,4.3,z);g.rotation.y=ry;M.add(g);
 for(const [o,s] of [[-.25,.35],[.05,.12]]){const l=new THREE.Mesh(new THREE.PlaneGeometry(w*s,h*1.2),glint);l.rotation.z=.5;l.position.set(o*w,0,.01);g.add(l);}return g;};
const glasses=[glass(6.8,8.6,0,BOX.z1+.3,0),glass(5.0,8.6,BOX.x1+.3,0,Math.PI/2),glass(5.0,8.6,BOX.x0-.3,0,-Math.PI/2)];
// 구멍 둘레 투명 칸막이
const acryl=new THREE.MeshToonMaterial({color:'#bfe8ff',gradientMap:grad,transparent:true,opacity:.38,depthWrite:false});
for(const W of WALLS){const m=new THREE.Mesh(new THREE.BoxGeometry(W.x1-W.x0,W.y1-W.y0,W.z1-W.z0),acryl);m.position.set((W.x0+W.x1)/2,(W.y0+W.y1)/2,(W.z0+W.z1)/2);M.add(m);}
// 꺼내는 곳(앞 아래 왼쪽)
box(1.8,1.3,.12,toon('#5a3a4a'),-2.2,-2.6,2.62);
{const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.font='800 34px "Apple SD Gothic Neo",sans-serif';g.textAlign='center';g.fillText('꺼내는 곳',128,44);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.4),new THREE.MeshBasicMaterial({map:t,transparent:true}));m.position.set(-2.2,-1.65,2.66);M.add(m);}
// 위 레일
const railX=box(6.6,.14,.22,metal,0,8.1,0,false);const carriage=box(.5,.26,.5,metal,0,8.05,0,false);
const cable=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,6),toon('#7a6a5a'));M.add(cable);

// ── 집게
const clawG=new THREE.Group();scene.add(clawG);
const hub=new THREE.Mesh(new THREE.SphereGeometry(CLAW.hub,20,14),metal);hub.castShadow=true;hub.geometry.computeBoundingSphere();outlined(hub,.03);clawG.add(hub);
const cap=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,.3,16),metal);cap.position.y=.32;cap.castShadow=true;hub.add(cap);
const segGeo=new THREE.CylinderGeometry(CLAW.rad,CLAW.rad,1,8);segGeo.computeBoundingSphere();
const segMeshes=Array.from({length:6},()=>{const m=new THREE.Mesh(segGeo,metal);m.castShadow=true;scene.add(m);
 const o=new THREE.Mesh(segGeo,ink);o.scale.set(1.45,1.02,1.45);m.add(o);return m;});
const Y=new THREE.Vector3(0,1,0),tmpV=new THREE.Vector3(),tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3();

// ── 인형 모양(임시 그림, 몸통 중심 = 물리 0번 공)
function sph(r,mat,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),mat);m.geometry.computeBoundingSphere();m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;return m;}
function face(g,y,z,w,dark){const e=new THREE.MeshBasicMaterial({color:dark||'#2b211c'});for(const s of[-1,1])g.add(sph(.055,e,s*w,y,z));
 const ch=new THREE.MeshBasicMaterial({color:'#ff9fb0',transparent:true,opacity:.7});for(const s of[-1,1])g.add(sph(.06,ch,s*(w+.11),y-.08,z-.04,1,.6,.4));}
function buildDoll(type){
 const L=DOLL_LOOK[type],b=toon(L.body),l=toon(L.light),g=new THREE.Group();
 const add=m=>{outlined(m,.03);g.add(m);return m;};
 if(type==='bear'||type==='bunny'){
  const hy=type==='bear'?.85:.78,hr=type==='bear'?.5:.45;
  add(sph(.58,b,0,0,0,1,.95,.9));add(sph(hr,b,0,hy,0));
  if(type==='bear'){for(const s of[-1,1]){add(sph(.17,b,s*.32,hy+.38,0));}add(sph(.2,l,0,hy-.08,.4,1,.8,.7));g.add(sph(.06,new THREE.MeshBasicMaterial({color:'#2b211c'}),0,hy-.02,.56));face(g,hy+.08,.42,.17);}
  else{for(const s of[-1,1]){add(sph(.13,b,s*.16,1.36,0,1,3.2,.8));g.add(sph(.08,l,s*.16,1.36,.07,1,3.4,.4));}add(sph(.16,l,0,hy-.1,.38,1,.8,.6));face(g,hy+.04,.39,.16);}
  for(const s of[-1,1]){add(sph(.18,b,s*.52,.12,.12));add(sph(.2,b,s*.26,-.44,.22,1,.8,1.1));}
  add(sph(.32,l,0,-.02,.36,1,1,.4));
 }else if(type==='seal'){
  add(sph(1,b,0,0,-.15,.46,.44,.98));add(sph(.44,b,0,.08,.78));add(sph(.2,l,0,.02,1.1,1,.8,.7));
  add(sph(.26,b,0,-.02,-1.18,1.4,.35,1));for(const s of[-1,1])add(sph(.22,b,s*.46,-.18,.35,1.4,.3,.8));
  face(g,.22,1.12,.17);
 }else{
  add(sph(.47,b,0,0,0));add(sph(.33,b,0,.42,.06));
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.09,.2,10),l);beak.rotation.x=Math.PI/2;beak.position.set(0,.4,.42);g.add(beak);
  for(const s of[-1,1])add(sph(.17,b,s*.42,.04,0,.5,1,1.2));face(g,.5,.34,.13);
 }
 return g;
}

// ── 상태
let mi=1,sim,dollViews=[],coins=COINS,fails={easy:0,mid:0,hard:0},phase='front',timeLeft=PLAY_SEC,playT=0,lifted=0,strong=false,wonList=[],doneAt=0;
const $=id=>document.getElementById(id);
function makeSim(seed){
 const m=MACHINES[mi];
 for(const v of dollViews)scene.remove(v);
 sim=createSim({seed,count:m.count,types:m.types,power:m.power});
 dollViews=sim.dolls.map(D=>{const v=buildDoll(D.type);v.visible=!D.gone;scene.add(v);return v;});
}
const Fw=new THREE.Matrix4(),Fl=new THREE.Matrix4(),e1=new THREE.Vector3(),e2=new THREE.Vector3(),e3=new THREE.Vector3();
function frameOf(a,b,out){e1.copy(a).normalize();e2.copy(b).addScaledVector(e1,-e1.dot(b)).normalize();e3.crossVectors(e1,e2);return out.makeBasis(e1,e2,e3);}
const pa=new THREE.Vector3(),pb=new THREE.Vector3(),la=new THREE.Vector3(),lb=new THREE.Vector3();
function syncDolls(){
 const P=sim.P;
 sim.dolls.forEach((D,di)=>{const v=dollViews[di];if(D.gone){v.visible=false;return;}
  const T=TYPES[D.type].parts,i=D.first;
  pa.set(P.x[i+1]-P.x[i],P.y[i+1]-P.y[i],P.z[i+1]-P.z[i]);pb.set(P.x[i+3]-P.x[i+2],P.y[i+3]-P.y[i+2],P.z[i+3]-P.z[i+2]);
  la.set(T[1][0]-T[0][0],T[1][1]-T[0][1],T[1][2]-T[0][2]);lb.set(T[3][0]-T[2][0],T[3][1]-T[2][1],T[3][2]-T[2][2]);
  frameOf(pa,pb,Fw);frameOf(la,lb,Fl);Fw.multiply(Fl.transpose());
  v.quaternion.setFromRotationMatrix(Fw);v.position.set(P.x[i],P.y[i],P.z[i]);
 });
}
function syncClaw(){
 const c=sim.claw;hub.position.set(c.x,c.y,c.z);
 sim.segs().forEach((S,k)=>{const m=segMeshes[k];tmpA.set(S[0],S[1],S[2]);tmpB.set(S[3],S[4],S[5]);
  m.position.addVectors(tmpA,tmpB).multiplyScalar(.5);tmpV.subVectors(tmpB,tmpA);m.scale.set(1,tmpV.length(),1);m.quaternion.setFromUnitVectors(Y,tmpV.normalize());});
 railX.position.z=c.z;carriage.position.set(c.x,8.05,c.z);
 const L=8-(c.y+.45);cable.position.set(c.x,c.y+.45+L/2,c.z);cable.scale.y=Math.max(.01,L);
}

// ── 카메라: 끌어서 돌리기 + 정면/옆 단추
let yaw=0,pitch=.3,yawGoal=0,dist=14;
const target=new THREE.Vector3(0,3.3,0);
function fit(){
 const w=innerWidth,h=innerHeight,asp=w/h;renderer.setSize(w,h);camera.aspect=asp;
 // 기계 폭 8.2·높이 11이 들어가게. 세로 화면은 아래 단추 자리만큼 위로 올림
 const portraitNow=h>w,W=7.9,H=portraitNow?10.2:12;let v=2*Math.atan(H/2/dist),hz=2*Math.atan(W/2/dist/asp);camera.fov=THREE.MathUtils.radToDeg(Math.min(1.35,Math.max(v,hz)));
 const portrait=h>w;camera.setViewOffset(w,h,0,portrait?Math.round(h*.13):0,w,h);camera.updateProjectionMatrix();
}
addEventListener('resize',fit);fit();
function placeCam(dt){
 yaw+=(yawGoal-yaw)*Math.min(1,dt*6);
 camera.position.set(target.x+dist*Math.sin(yaw)*Math.cos(pitch),target.y+dist*Math.sin(pitch),target.z+dist*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(target);
 // 카메라 쪽 유리는 반사 줄을 옅게(앞이 가리지 않게)
 glasses[0].children.forEach(c=>c.material.opacity=.22*Math.max(0,1-Math.abs(Math.cos(yaw))*.6));
 $('viewt').textContent=Math.abs(yawGoal)>.8?'정면':'옆에서';
}
let drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:yawGoal,pitch};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;const k=Math.PI/innerWidth*1.2;
 yawGoal=Math.max(-1.57,Math.min(1.57,drag.yaw-(e.clientX-drag.x)*k));yaw=yawGoal;pitch=Math.max(.05,Math.min(.9,drag.pitch+(e.clientY-drag.y)*k*.6));});
const endDrag=()=>drag=null;renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
$('view').onclick=()=>{yawGoal=Math.abs(yawGoal)>.8?0:1.4;};

// ── 십자 단추: 누르고 있기, 손가락을 옆 단추로 밀면 방향이 바뀜, 두 손가락이면 대각선
const pad=$('pad'),held=new Map(),keys=new Set();
const dirAt=(x,y)=>{const el=document.elementFromPoint(x,y)?.closest?.('.pad button');return el?el.dataset.d:null;};
function padPaint(){const on=new Set([...held.values(),...keys]);pad.querySelectorAll('button').forEach(b=>b.classList.toggle('on',on.has(b.dataset.d)));}
pad.addEventListener('pointerdown',e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);const d=dirAt(e.clientX,e.clientY);if(d){held.set(e.pointerId,d);sfx.tick();}padPaint();});
pad.addEventListener('pointermove',e=>{if(!held.has(e.pointerId))return;const d=dirAt(e.clientX,e.clientY);if(d&&d!==held.get(e.pointerId)){held.set(e.pointerId,d);sfx.tick();padPaint();}});
for(const t of['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(t,e=>{held.delete(e.pointerId);padPaint();});
const KEYMAP={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'};
addEventListener('keydown',e=>{if(KEYMAP[e.code]){keys.add(KEYMAP[e.code]);padPaint();e.preventDefault();}if(e.code==='Space'){e.preventDefault();if(!e.repeat)$('big').click();}});
addEventListener('keyup',e=>{if(KEYMAP[e.code]){keys.delete(KEYMAP[e.code]);padPaint();}});
let ease=0;
function padInput(dt){
 const on=new Set([...held.values(),...keys]);let ix=(on.has('r')?1:0)-(on.has('l')?1:0),iy=(on.has('u')?1:0)-(on.has('d')?1:0);
 ease=(ix||iy)?Math.min(1,ease+dt/.12):0;                                   // 살짝 누르면 조금만
 // 단추 방향은 화면 기준(옆에서 볼 때도 ▶는 화면 오른쪽). 각도는 90° 단위로 맞춤
 const a=Math.round(yaw/(Math.PI/2))*(Math.PI/2),c=Math.cos(a),s=Math.sin(a);
 sim.setInput((ix*c-iy*s)*ease,(-ix*s-iy*c)*ease);
}

// ── 소리(합성, 임시)
const sfx=(()=>{let ac=null,motor=null;const ctx=()=>ac||(ac=new (window.AudioContext||window.webkitAudioContext)());
 const beep=(f,d,type='square',v=.05,f2)=>{try{const a=ctx(),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;if(f2)o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+d);g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d);}catch{}};
 return{tick:()=>beep(900,.03,'square',.02),coin:()=>{beep(1300,.08);setTimeout(()=>beep(1750,.12),70);},clunk:()=>beep(160,.18,'triangle',.12,70),
  win:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.16,'square',.05),i*110)),lose:()=>beep(440,.4,'triangle',.06,180),
  motor(on){try{const a=ctx();if(on&&!motor){const o=a.createOscillator(),g=a.createGain();o.type='sawtooth';o.frequency.value=70;g.gain.value=.012;o.connect(g).connect(a.destination);o.start();motor={o,g};}
   if(!on&&motor){motor.o.stop();motor=null;}}catch{}}};})();

// ── 흐름: 기계 앞 → 한 판(20초 조작) → 집게 내려감·지켜보기 → 결과
const ring=$('ring'),big=$('big');
function toast(t,ms=1800){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove('show'),ms);}
function setPhase(p){
 phase=p;const m=MACHINES[mi];
 pad.classList.toggle('off',p!=='play');$('timer').hidden=p!=='play';$('quit').hidden=p!=='play';$('mach').style.display=p==='front'?'flex':'none';
 $('hint').style.display=p==='play'?'':'none';
 big.classList.toggle('off',p==='watch'||p==='result');ring.setAttribute('opacity',p==='play'?1:0);big.classList.remove('blink');
 if(p==='front'){$('bigic').textContent='🪙';$('bigt').textContent='한 판';}
 if(p==='play'){$('bigic').textContent='⬇';$('bigt').textContent='뽑기';}
 if(p==='watch'){$('bigic').textContent='⏳';$('bigt').textContent='보는 중';}
 $('mname').textContent=m.name;$('coin').textContent=coins;
}
function startPlay(){
 if(coins<=0){showCard('🪙','코인이 없어요','시안이라 바로 다시 채울 수 있어요.',[['코인 채우기',()=>{coins=COINS;hideCard();setPhase('front');},true]]);return;}
 coins--;sfx.coin();const m=MACHINES[mi];strong=fails[m.id]>=PITY_N;
 sim.claw.power=strong?{...STRONG}:{...m.power};
 if(strong)toast('💪 이번 판은 힘센 집게예요');
 sim.start();timeLeft=PLAY_SEC;playT=0;lifted=0;wonList=[];setPhase('play');
}
function doDrop(){if(phase!=='play'||playT<.6)return;sim.drop();sfx.motor(false);setPhase('watch');}
big.onclick=()=>{if(phase==='front')startPlay();else if(phase==='play')doDrop();};
$('quit').onclick=()=>{doDrop();};
function showCard(art,title,desc,btns,pity=''){
 $('cart').textContent=art;$('ctitle').textContent=title;$('cdesc').textContent=desc;$('cpity').textContent=pity;
 const row=$('crow');row.innerHTML='';for(const [t,f,main] of btns){const b=document.createElement('button');b.textContent=t;if(main)b.className='main';b.onclick=f;row.append(b);}
 $('card').classList.add('show');
}
function hideCard(){$('card').classList.remove('show');}
function finish(){
 const m=MACHINES[mi];
 if(wonList.length){fails[m.id]=0;sfx.win();const names=wonList.map(t=>TYPES[t].name);const art=wonList.map(t=>DOLL_LOOK[t].art).join('');
  showCard(art,wonList.length>1?`${names.length}개나 뽑았어요!`:`${names[0]} 뽑았어요!`,'도감에 들어갔어요(시안에는 도감 화면 없음).',[['그만',()=>{hideCard();setPhase('front');}],['한 판 더 🪙1',()=>{hideCard();setPhase('front');startPlay();},true]]);}
 else{fails[m.id]++;sfx.lose();const left=Math.max(0,PITY_N-fails[m.id]);
  showCard('😣',lifted?'아까워요! 들었다 놓쳤어요':'못 잡았어요',lifted?'집게 힘이 모자라 떨어졌어요. 다른 인형에 눌린 인형은 더 어려워요.':'옆에서 보고 앞뒤를 맞춰 보세요.',
   [['그만',()=>{hideCard();setPhase('front');}],['한 판 더 🪙1',()=>{hideCard();setPhase('front');startPlay();},true]],left?`힘센 집게까지 ${left}번`:'다음 판은 힘센 집게!');}
 // 인형이 많이 줄면 다시 채우기
 if(sim.dolls.filter(D=>!D.gone&&!D.won).length<m.count-4){makeSim((Math.random()*1e6)|0);toast('인형을 다시 채웠어요');}
}

// 기계 고르기(임시: 같은 화면에서 바꿔 끼움. 실제는 가게에서 걸어가 고름)
MACHINES.forEach((m,i)=>{const b=document.createElement('button');b.textContent=`${m.tag} · ${m.name}`;b.onclick=()=>{if(phase!=='front')return;mi=i;
 document.querySelectorAll('#mach button').forEach((x,j)=>x.setAttribute('aria-pressed',j===i));$('load').style.display='flex';
 setTimeout(()=>{makeSim(i*101+7);$('load').style.display='none';setPhase('front');},30);};$('mach').append(b);});
document.querySelectorAll('#mach button')[mi].setAttribute('aria-pressed','true');
$('info').onclick=()=>{const m=MACHINES[mi];showCard('ⓘ',m.name,`집게 세기: ${m.tag}. 진짜 기계처럼 집게가 인형 무게에 밀려 벌어지면 떨어져요. 겹쳐 눌린 인형, 길쭉한 인형은 더 어려워요. ${PITY_N}번 못 뽑으면 다음 한 판은 힘센 집게(꼭 잡히는 건 아님).`,[['닫기',hideCard,true]]);};

// ── 돌리기
let last=performance.now();
function frame(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(phase==='play'){playT+=dt;timeLeft-=dt;padInput(dt);
  const moving=sim.claw.inX||sim.claw.inZ;sfx.motor(!!moving);
  $('timer').textContent='⏱ '+Math.max(0,Math.ceil(timeLeft));$('timer').classList.toggle('low',timeLeft<=5);big.classList.toggle('blink',timeLeft<=5);
  ring.setAttribute('stroke-dashoffset',258*(1-Math.max(0,timeLeft)/PLAY_SEC));
  if(timeLeft<=0){sim.setInput(0,0);doDrop();}
 }else sim.setInput(0,0);
 sim.step(dt);
 for(const e of sim.events.splice(0)){
  if(e.type==='close')sfx.clunk();
  if(e.type==='won')wonList.push(sim.dolls[e.doll].type);
  if(e.type==='done')doneAt=now+1300;
 }
 if(phase==='watch'&&(sim.claw.state==='lift'||sim.claw.state==='carry')){for(const D of sim.dolls)if(!D.gone&&sim.P.y[D.first]>3.2)lifted=1;}
 if(phase==='watch'&&sim.claw.state==='done'&&doneAt&&now>doneAt){doneAt=0;setPhase('result');finish();}
 syncDolls();syncClaw();placeCam(dt);
 renderer.render(scene,camera);requestAnimationFrame(frame);
}
setTimeout(()=>{makeSim(108);$('load').style.display='none';setPhase('front');requestAnimationFrame(frame);
 window.claw={sim:()=>sim,setYaw:v=>{yawGoal=yaw=v;},phase:()=>phase,start:startPlay,drop:doDrop,machine:i=>document.querySelectorAll('#mach button')[i].click(),
  aim:(x,z)=>{sim.claw.x=x;sim.claw.z=z;},fails};},30);
