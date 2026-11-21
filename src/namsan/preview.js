// 남산 그림 미리보기(월드아트, vite dev: /src/namsan/preview.html). 게임 화면이 아니라 그림·에셋 확인용이다.
// 빛·하늘·후처리·서울 도심·한강·원경은 관악산 게임과 같은 코드(setupRendering·createToonStyle·loadLandscape)를 그대로 쓰고,
// 그 위에 남산 지형·시설·숲(namsan-art.js)을 얹는다. 두 산은 같은 게임 좌표라 남산 정상에서 관악산이 보인다.
// ?view=start|start-back|wall|stairs|rest|last|summit|summit-south|summit-north|aerial|far-south  &time=day|dusk|night  &season=spring|summer|autumn|winter
// &city=0(도심 건물 안 받음) &forest=0 &hud=0 &sil=south|west|north|east(실루엣 대조 장면)
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createToonStyle} from '../toon/index.js';
import {setupRendering} from '../rendering.js';
import {loadLandscape} from '../../assets/realistic/load-landscape.js';
import {setTimeOverride} from '../daytime.js';
import {presetClock} from '../free-settings.js';
import {loadToonHiker} from '../toon/link-hiker.js';
import {loadNamsanData,createNamsanGround,openWallsForBus,courseAt,NAMSAN} from './namsan-data.js';
import {buildNamsan,TOWER} from './namsan-art.js';
import {placeOnLane,seatInBus,BUS} from './namsan-bus-art.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';

const q=new URLSearchParams(location.search),BASE=import.meta.env.BASE_URL;
if(q.get('hud')==='0')document.getElementById('panel')?.remove();
const info=t=>{const el=document.getElementById('info');if(el)el.textContent=t;};
const timeKey=q.get('time')??'day';setTimeOverride(presetClock(timeKey)??null);
const mobile=q.get('mobile')==='1';
// 남산 코스·공원 안 OSM 건물 숨기기(city-hide.json): 미리보기에서는 도심 자료를 받을 때 걸러 낸다. 게임에서는 도시 격자 exclude에 id 목록을 넘기면 된다.
const hideIds=new Set((await (await fetch(`${BASE}assets/shared/namsan/city-hide.json`)).json()).ids);
{const raw=window.fetch.bind(window);window.fetch=async(url,o)=>{const r=await raw(url,o);if(!/generated\/seoul-(west|east)-\d+\.json/.test(String(url)))return r;const j=await r.json();j.buildings=j.buildings.filter(b=>!hideIds.has(b.id));return new Response(JSON.stringify(j),{status:200,headers:{'content-type':'application/json'}});};}
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,30000);
const toon=await createToonStyle({renderer,scene,camera,mobile});
if(q.get('season'))toon.setSeason(q.get('season'),{instant:true});
const landscape=await loadLandscape({base:`${BASE}assets/realistic/generated/`,chunkBase:`${BASE}assets/shared/chunks/`,maxContactMapSize:renderer.capabilities.maxTextureSize,materialFactory:toon.materialFactory,toon:{toonify:toon.toonify,patchFoliage:toon.patchFoliage,styleCity:toon.styleCity,natureParts:toon.natureParts},mountain:false});
for(const child of landscape.group.children)if(!['SeoulCity2km','SeoulFar','HanRiverAndWater'].includes(child.name))toon.toonify(child,{kind:'prop'});
scene.add(landscape.group); // 관악산 풀밭(toon.attachLandscape)은 관악산 길·높이를 따르므로 남산에서는 붙이지 않는다(인계 문서 참고)
const lighting=setupRendering(renderer,scene,camera,mobile,{toon});
// 남산
const data=await loadNamsanData(`${BASE}assets/shared/namsan/`,{forest:q.get('forest')!=='0'});
const G=createNamsanGround(data);
data.walls=openWallsForBus(G,data.walls);
const ns=buildNamsan({G,data,toon,forest:q.get('forest')!=='0',mobile});scene.add(ns.root);
// 원경: 관악산 원경 땅(160m 격자)이 남산 판을 뚫지 않게 남산 판 안쪽만 내린다. 관악산 쪽 「남산·N서울타워」 원경 모형은 남산에서는 숨긴다(게임 속 전망탑으로 대신).
await landscape.streamFar();await landscape.streamWater();
{const far=landscape.group.getObjectByName('SeoulFar'),B=G.bounds;
 far?.traverse(o=>{if(/N서울타워/.test(o.name))o.visible=false;});
 const ground=far?.children.find(o=>o.isMesh)?.geometry;if(ground){const p=ground.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(x>B.x0+20&&x<B.x1-20&&z>B.z0+20&&z<B.z1-20)p.setY(i,Math.min(p.getY(i),G.ground(x,z)-12));}p.needsUpdate=true;ground.computeVertexNormals();}}
// 크기 기준 동동이(1.0m)
const hiker=await loadToonHiker(`${BASE}assets/toon/models/hiker/HikerRig.glb`);toon.toonify(hiker.scene,{kind:'character'});hiker.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=true;}});scene.add(hiker.scene);
const placeHiker=(s,off=0,turn=0)=>{const m=courseAt(G.points,s),x=m.x+m.nx*off,z=m.z+m.nz*off,y=m.stairs?m.y+.02:G.ground(x,z)+.05;hiker.scene.position.set(x,y,z);hiker.scene.rotation.y=m.heading+Math.PI+turn;return m;};

const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
// 3인칭: 코스 s 지점 뒤 dist m·높이 h에서 앞 look m을 본다
function chase(s,{back=7,h=3.2,look=14,lookH=1.4,side=0,turn=0}={}){
 const m=placeHiker(s,0,turn),hp=hiker.scene.position,dir=new THREE.Vector3(m.tx,0,m.tz).applyAxisAngle(V(0,1,0),turn);
 camera.position.copy(hp).addScaledVector(dir,-back).add(V(m.nx*side,h,m.nz*side));
 const tgt=hp.clone().addScaledVector(dir,look);tgt.y=hp.y+lookH+(turn?0:(courseAt(G.points,s+look).y-m.y)*.7);controls.target.copy(tgt);
}
const tw=NAMSAN.tower,P=G.plaza;
const VIEWS={
 start:()=>{chase(16,{back:6.5,h:2.3,look:30,lookH:7});},
 'start-back':()=>{placeHiker(60,0,Math.PI);const hp=hiker.scene.position;const m=courseAt(G.points,60);camera.position.set(hp.x+m.tx*6,hp.y+3.4,hp.z+m.tz*6);controls.target.set(hp.x-m.tx*60,hp.y+2,hp.z-m.tz*60);},
 wall:()=>{const w=ns.wall.userData.report.find(r=>r.courseSide),side=-(w?.courseSide??1);chase(745,{back:7,h:2.6,look:16,side:side*1.3});},
 stairs:()=>chase(560,{back:6,h:2.2,look:12,lookH:3}),
 rest:()=>{const side=G.restSide??1,m=placeHiker(NAMSAN.rest.s,(NAMSAN.pathWidth/2+2.2)*side,side>0?-Math.PI/2:Math.PI/2);const hp=hiker.scene.position;camera.position.set(hp.x-m.nx*side*4.5-m.tx*1.5,hp.y+2.6,hp.z-m.nz*side*4.5-m.tz*1.5);controls.target.set(hp.x+m.nx*side*600,hp.y-70,hp.z+m.nz*side*600);},
 last:()=>chase(905,{back:5.5,h:3,look:16,lookH:7}),
 summit:()=>{placeHiker(1058);const e=G.points.at(-1),dx=e.x-tw.x,dz=e.z-tw.z,l=Math.hypot(dx,dz);camera.position.set(tw.x+dx/l*100,P.y+30,tw.z+dz/l*100);controls.target.set(tw.x,P.y+58,tw.z);fov=74;},
 'summit-plaza':()=>{const st=ns.furniture.userData.items.find(i=>i.kind==='summit-stone'),dx=st.x-tw.x,dz=st.z-tw.z,l=Math.hypot(dx,dz);placeHiker(1064,0);camera.position.set(st.x+dx/l*13+dz/l*4,P.y+3.4,st.z+dz/l*13-dx/l*4);controls.target.set(tw.x,P.y+9,tw.z);fov=70;},
 'summit-south':()=>{placeHiker(1066,0);const e=G.points.at(-1);camera.position.set(P.x-10,P.y+6,P.z+30);controls.target.set(0,200,0);},
 'summit-north':()=>{camera.position.set(P.x,P.y+6,P.z-30);controls.target.set(4120,400,-21438);},
 // 순환버스(11-19): 정류장에 선 버스 + 창 너머 앉은 동동이, 산허리 차로를 오르는 버스, 정상 하차 지점
 'bus-start':()=>{busAt(G.bus.stops.start.s,true);const st=G.bus.stops.start,b=ns.bus.bus,f=new THREE.Vector3(0,0,1).applyQuaternion(b.quaternion),r=new THREE.Vector3(-1,0,0).applyQuaternion(b.quaternion);
  placeHikerAt(st.x+f.x*3.4,st.z+f.z*3.4,Math.atan2(-r.x,-r.z));camera.position.copy(b.position).addScaledVector(r,10).addScaledVector(f,12);camera.position.y+=3.2;controls.target.copy(b.position).addScaledVector(r,1.5).add(V(0,1.3,0));},
 'bus-rider':()=>{busAt(G.bus.stops.start.s,true);const b=ns.bus.bus,f=new THREE.Vector3(0,0,1).applyQuaternion(b.quaternion),r=new THREE.Vector3(-1,0,0).applyQuaternion(b.quaternion);
  hiker.scene.position.set(0,-50,0);camera.position.copy(b.position).addScaledVector(r,-4.4).addScaledVector(f,1.4);camera.position.y+=2.1;controls.target.copy(b.position).addScaledVector(f,-.6).add(V(0,1.3,0));fov=50;},
 'bus-road':()=>{const s=1180;busAt(s,false);const b=ns.bus.bus,f=new THREE.Vector3(0,0,1).applyQuaternion(b.quaternion),r=new THREE.Vector3(-1,0,0).applyQuaternion(b.quaternion);
  hiker.scene.position.set(0,-50,0);camera.position.copy(b.position).addScaledVector(f,16).addScaledVector(r,-7);camera.position.y+=4.5;controls.target.copy(b.position).add(V(0,1.2,0));},
 'bus-summit':()=>{const st=G.bus.stops.summit;busAt(st.s,true);const b=ns.bus.bus,f=new THREE.Vector3(0,0,1).applyQuaternion(b.quaternion);
  placeHikerAt(st.x+(tw.x-st.x)*.05,st.z+(tw.z-st.z)*.05,Math.atan2(tw.x-st.x,tw.z-st.z));const dx=st.x-tw.x,dz=st.z-tw.z,l=Math.hypot(dx,dz);
  camera.position.set(st.x+dx/l*16+f.x*-10,P.y+6,st.z+dz/l*16+f.z*-10);controls.target.set(tw.x*.15+st.x*.85,P.y+5,tw.z*.15+st.z*.85);fov=66;},
 'bus-cut':()=>{const s=880;busAt(s,false);const b=ns.bus.bus,f=new THREE.Vector3(0,0,1).applyQuaternion(b.quaternion),r=new THREE.Vector3(-1,0,0).applyQuaternion(b.quaternion);
  hiker.scene.position.set(0,-50,0);camera.position.copy(b.position).addScaledVector(f,-22).addScaledVector(r,3);camera.position.y+=9;controls.target.copy(b.position).addScaledVector(f,10).add(V(0,1,0));},
 'bus-night':()=>{VIEWS['bus-start']();},
 'bus-aerial':()=>{hiker.scene.position.set(0,-50,0);busAt(1180,false);const m=G.bus.points[Math.floor(G.bus.points.length*.55)];camera.position.set(m.x-420,m.y+520,m.z+380);controls.target.set(m.x+40,m.y,m.z-60);},
 aerial:()=>{camera.position.set(G.points[0].x-900,780,G.points[0].z-700);controls.target.set(tw.x-200,140,tw.z+100);},
 'far-south':()=>{camera.position.set(tw.x-500,75,tw.z+3200);controls.target.set(tw.x,190,tw.z);},
};
// 버스 장면 도우미: 버스를 차로 s에 세우고 앉은 동동이 3명(창 너머)
const riders=[];
function busAt(s,doorsOpen=false){const b=ns.bus?.bus;if(!b)return;placeOnLane(b,G.bus.cycle,s);b.userData.setDoors(doorsOpen?1:0);
 if(!riders.length)for(const i of [6,9,13]){const a=cloneSkinned(hiker.scene);seatInBus(b,a,i);riders.push(a);}}
function placeHikerAt(x,z,yaw){hiker.scene.position.set(x,G.ground(x,z)+.05,z);hiker.scene.rotation.y=yaw;}
let view=q.get('view')??'start';
let fov=null;
function setView(name){view=name;fov=null;(VIEWS[name]??VIEWS.start)();resize();controls.update();lighting.setShadowFocus?.(hiker.scene.position);}
setView(view);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));

// 도심 건물(서울 서·동 28묶음): 미리보기에서는 다 받는다(게임은 main.js가 뒤에서 이어 받음)
let cityDone=q.get('city')==='0';
if(!cityDone)(async()=>{try{await landscape.streamRoads();for(const c of landscape.manifest.cityChunks.filter(c=>/^seoul-/.test(c.id)))await landscape.streamCity(c.id);await landscape.finalizeCities();}catch(e){console.warn(e);}cityDone=true;})();

function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=fov??(innerHeight>innerWidth?72:58);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);lighting.resize(2,innerWidth,innerHeight,Math.min(devicePixelRatio,2),{dpr:Math.min(devicePixelRatio,2),shadow:2048});}
addEventListener('resize',resize);resize();
await lighting.prepare?.();
let frames=0;const t0=performance.now();
const night=()=>lighting.environment?.current?.night??({night:1,dusk:.35}[timeKey]??0);
function frame(){
 requestAnimationFrame(frame);controls.update();
 landscape.update(camera,2);ns.update((performance.now()-t0)/1000,night());
 lighting.render(hiker.scene.position);frames++;
}
requestAnimationFrame(frame);
const stats=()=>({view,frames,cityDone,night:night(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,terrainTris:ns.terrain.userData.triangles,trees:ns.trees?.userData.trees,treeTris:ns.trees?.userData.triangles,steps:ns.stairs.userData.steps,stairRuns:ns.stairs.userData.runs,wall:ns.wall.userData,course:G.points.at(-1).s,plaza:G.plaza,items:ns.furniture.userData.items,lampSpots:ns.lanterns.userData.spots.length,memory:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null});
info(`남산 ${G.points.at(-1).s.toFixed(0)}m · 계단 ${ns.stairs.userData.steps}단 · 성곽 ${ns.wall.userData.length.toFixed(0)}m · 나무 ${ns.trees?.userData.trees??0}그루`);
// ── 실루엣 대조: 같은 카메라에서 ① 실제 지형(DSM 원자료 그대로, 깎기·광장 없음) ② 게임 지형 ③ 게임 지형+숲의 윗선을 구해 화면 위에 긋는다 ──
// 실제 = Copernicus DSM(나무·건물 높이 포함, 조사 §1). 산 모양 비교만 한다(전망탑·도심 건물은 빼고 그림).
const SIL={south:{d:[0,3600],h:70},west:{d:[-3400,300],h:230},north:{d:[200,-2800],h:110},east:{d:[3600,200],h:230}};
let realMesh=null;
function rawTerrain(){if(realMesh)return realMesh;const B=G.bounds,st=8,nx=Math.round((B.x1-B.x0)/st),nz=Math.round((B.z1-B.z0)/st),g=new THREE.PlaneGeometry(1,1,nx,nz),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,v=.5-p.getY(i),x=B.x0+u*(B.x1-B.x0),z=B.z0+v*(B.z1-B.z0);p.setXYZ(i,x,G.raw(x,z),z);}g.computeVertexNormals();
 realMesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));realMesh.name='실제 지형(원자료)';return realMesh;}
function silView(name){const v=SIL[name];camera.position.set(tw.x+v.d[0],v.h,tw.z+v.d[1]);controls.target.set(tw.x,190,tw.z);fov=24;resize();controls.update();view='sil-'+name;}
function maskTop(objects){
 const W=renderer.domElement.width,H=renderer.domElement.height,rt=new THREE.WebGLRenderTarget(W,H);const vis=new Map();scene.traverse(o=>{vis.set(o,o.visible);});
 scene.traverse(o=>{if(o.isMesh||o.isInstancedMesh||o.isPoints||o.isLine||o.isSprite)o.visible=false;});
 const show=[];for(const root of objects){root.traverse(o=>{show.push(o);o.visible=true;});let p=root.parent;while(p){show.push(p);p.visible=true;p=p.parent;}}
 const bg=scene.background,fog=scene.fog;scene.background=new THREE.Color(0);scene.fog=null;scene.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
 const tm=renderer.toneMapping;renderer.toneMapping=THREE.NoToneMapping;renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,camera);
 const px=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,px);renderer.setRenderTarget(null);renderer.toneMapping=tm;
 scene.overrideMaterial=null;scene.background=bg;scene.fog=fog;for(const [o,v] of vis)o.visible=v;rt.dispose();
 const top=new Float32Array(W).fill(NaN);for(let x=0;x<W;x++)for(let y=H-1;y>=0;y--){if(px[(y*W+x)*4]>128){top[x]=H-1-y;break;}}return {top,W,H};
}
function silhouette(name){
 silView(name);const added=rawTerrain();scene.add(added);
 const real=maskTop([added]);scene.remove(added);
 const game=maskTop([ns.terrain]),withTrees=maskTop([ns.terrain,...(ns.trees?[ns.trees]:[])]);
 // 차이: 열마다 화면 픽셀 차 → 산까지 거리로 m 환산(수직 화각 기준)
 const dist=Math.hypot(SIL[name].d[0],SIL[name].d[1]),mPerPx=2*dist*Math.tan(camera.fov*Math.PI/360)/real.H;
 const diff=(a,b)=>{let n=0,sum=0,max=0;for(let x=0;x<a.top.length;x++){if(Number.isNaN(a.top[x])||Number.isNaN(b.top[x]))continue;const d=Math.abs(a.top[x]-b.top[x]);sum+=d;max=Math.max(max,d);n++;}return {meanPx:+(sum/n).toFixed(1),maxPx:max,meanM:+(sum/n*mPerPx).toFixed(1),maxM:+(max*mPerPx).toFixed(1),columns:n};};
 const out={view:name,distanceM:Math.round(dist),mPerPx:+mPerPx.toFixed(2),terrain:diff(real,game),terrainAndTrees:diff(real,withTrees)};
 drawSil(real,game,withTrees,out);return out;
}
function drawSil(real,game,trees,out){
 let c=document.getElementById('sil');if(!c){c=document.createElement('canvas');c.id='sil';Object.assign(c.style,{position:'fixed',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:4});document.body.append(c);}
 c.width=real.W;c.height=real.H;const g=c.getContext('2d'),k=real.W/innerWidth;g.clearRect(0,0,c.width,c.height);
 const line=(m,color,w,dash=[])=>{g.strokeStyle=color;g.lineWidth=w*k;g.setLineDash(dash.map(d=>d*k));g.beginPath();let on=false;for(let x=0;x<m.top.length;x++){const y=m.top[x];if(Number.isNaN(y)){on=false;continue;}on?g.lineTo(x,y):g.moveTo(x,y);on=true;}g.stroke();};
 line(game,'rgba(255,210,63,.9)',1.8,[6,5]);line(trees,'#5fd8ff',2.6);line(real,'#ff3b30',2.4,[3,3]);
 g.setLineDash([]);g.fillStyle='rgba(18,26,34,.78)';g.fillRect(14*k,14*k,560*k,118*k);g.font=`${16*k}px "Apple SD Gothic Neo",sans-serif`;
 const names={south:'남쪽(한강 쪽)에서',west:'서쪽(서울역 쪽)에서',north:'북쪽(명동 쪽)에서',east:'동쪽(장충동 쪽)에서'};
 const rows=[[`남산 윤곽 대조 — ${names[out.view]} ${(out.distanceM/1000).toFixed(1)}km`,'#fff'],['빨간 점선 = 실제 지형 자료(Copernicus 30m, 깎기 없음)','#ff6b60'],['하늘색 선 = 게임 화면 윤곽(땅 + 숲) ← 실제와 비교하는 선','#5fd8ff'],['노란 점선 = 게임 땅만(숲 아래 땅, 실제 자료보다 숲 높이만큼 낮음)','#ffd23f'],[`차이(게임 윤곽 vs 실제): 평균 ${out.terrainAndTrees.meanM}m · 최대 ${out.terrainAndTrees.maxM}m`,'#fff']];
 rows.forEach(([t,col],i)=>{g.fillStyle=col;g.fillText(t,26*k,(38+i*21)*k);});
}
// 위에서 본 코스·성곽 대조: 게임 화면(바로 위 2.6km) 위에 OSM 원자료 선(빨강 코스·주황 성곽)을 그대로 투영해 긋는다
function planCheck(){
 const B=G.bounds,cx=(B.x0+B.x1)/2,cz=(B.z0+B.z1)/2;camera.position.set(cx,2600,cz+1);controls.target.set(cx,0,cz);fov=58;resize();controls.update();camera.updateMatrixWorld();view='plan';
 let c=document.getElementById('sil');if(!c){c=document.createElement('canvas');c.id='sil';Object.assign(c.style,{position:'fixed',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:4});document.body.append(c);}
 const W=renderer.domElement.width,H=renderer.domElement.height,k=W/innerWidth;c.width=W;c.height=H;const g=c.getContext('2d'),v=new THREE.Vector3();
 const toScreen=(x,y,z)=>{v.set(x,y,z).project(camera);return [(v.x+1)/2*W,(1-v.y)/2*H];};
 const poly=(pts,color,w,dash)=>{g.strokeStyle=color;g.lineWidth=w*k;g.setLineDash(dash.map(d=>d*k));g.beginPath();pts.forEach((p,i)=>{const [sx,sy]=toScreen(p.x,p.y??p.ground??200,p.z);i?g.lineTo(sx,sy):g.moveTo(sx,sy);});g.stroke();};
 for(const w of data.walls)poly(w.points,'#ff9f1a',2.2,[4,3]);poly(data.course.points,'#ff3b30',2.4,[5,3]);
 g.setLineDash([]);g.fillStyle='rgba(18,26,34,.8)';g.fillRect(14*k,14*k,520*k,96*k);g.font=`${16*k}px "Apple SD Gothic Neo",sans-serif`;
 [['남산 위에서 본 코스·성곽 대조(바로 위 2.6km)','#fff'],['빨간 점선 = OSM 코스 원자료(백범광장 → 정상 1,067m)','#ff6b60'],['주황 점선 = OSM 한양도성 원자료 · 그 아래가 게임 성곽(길과 겹치는 곳만 2.8m 비킴)','#ffb35a'],['바탕 = 게임 화면(지형·숲·성곽·전망탑·도심)','#fff']].forEach(([t,col],i)=>{g.fillStyle=col;g.fillText(t,26*k,(38+i*21)*k);});
 return {course:data.course.points.length,walls:data.walls.length};
}
window.namsan={setView,silhouette,planCheck,stats,get frames(){return frames;},get cityDone(){return cityDone;},G,ns,camera,controls,renderer,scene,lighting,landscape};
