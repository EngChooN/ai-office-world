// 새 기계 3종 그림 미리보기(월드아트, 2026-11-27, vite dev: /src/claw/new3-preview.html). 게임 화면이 아니라 그림 확인용.
// ?view=row(기존 집게·열쇠와 나란히)|shop(가게 안 자리)|play-stack|play-string|cut-string|play-ball &staff=1 &pity=1 &mark=1,1,win &mobile=1 &t=초(움직임 멈춤)
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createToonStyle} from '../toon/index.js';
import {composeEnvironment} from '../daytime.js';
import {buildClawShop,SHOP_LIGHTS,machineToShop} from './claw-shop-art.js';
import {CLAW,buildClawMachine} from './claw-machine-art.js';
import {buildMachine} from './claw-machines-more.js';
import {buildStackMachine} from './claw-stack.js';
import {MACHINES} from './claw-palette.js';
import {createClawAvatar} from './claw-avatar.js';
import {buildStringMachine,STRING_THEME,STRING,cutCamera} from './claw-string-art.js';
import {buildBallMachine,BALL_THEME,holeCenter} from './claw-ball-art.js';
import {dressStackMachine} from './claw-stack-art.js';

const q=new URLSearchParams(location.search),mobile=q.get('mobile')==='1',view=q.get('view')??'row';
const info=t=>{document.getElementById('info').textContent=t;};
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const L=SHOP_LIGHTS.neon,scene=new THREE.Scene();scene.background=new THREE.Color(L.background);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.03,200);
const toon=await createToonStyle({renderer,scene,camera,mobile});
const hemi=new THREE.HemisphereLight(L.hemi.sky,L.hemi.ground,L.hemi.intensity);
const key=new THREE.DirectionalLight(L.key.color,L.key.intensity);key.position.set(...L.key.pos);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:30});key.shadow.bias=-.0006;key.shadow.normalBias=.03;
scene.add(hemi,key,key.target);renderer.toneMappingExposure=L.exposure;
toon.pipeline.update(composeEnvironment({sun:{elevation:45,azimuth:160},moon:{elevation:-20,azimuth:0,illumination:.5}}));
const toonify=toon.toonify;
const shop=buildClawShop({toonify,mobile,kinds:true,look:'neon'});scene.add(shop);
const U=shop.userData;
// 가게 안 새 자리(추천안): 줄 자르기 = 빈 자리 B(앞벽 오른쪽), 공 구멍 넣기 = 왼벽 봉 4 뒤(z 2.8)
const SPOT_STRING={x:2.4,z:4.95,heading:Math.PI},SPOT_BALL={x:-6.45,z:2.8,heading:Math.PI/2};
shop.traverse(o=>{if(o.name==='빈 자리 덮개'||o.name==='준비 중 표시')o.visible=false;});
// 빈 자리 B 「준비 중」 표지(미리보기에서만 숨김 — 게임 연결 때 월드공통개발이 자리를 쓰면 없어짐)
const stackEntry=U.machines.find(m=>m.kind==='stack');
if(stackEntry)dressStackMachine(stackEntry.group,{toonify});
const strM=buildStringMachine(STRING_THEME,{toonify}),ballM=buildBallMachine(BALL_THEME,{toonify});
for(const [g,s] of [[strM,SPOT_STRING],[ballM,SPOT_BALL]]){g.position.set(s.x,0,s.z);g.rotation.y=s.heading;shop.add(g);}
// 나란히 줄(가게 밖 앞쪽 무대): 집게 1 · 열쇠 1 · 불빛 쌓기 · 줄 자르기 · 공 구멍
const row=new THREE.Group();row.position.set(0,0,10);scene.add(row);
{const fl=new THREE.Mesh(new THREE.PlaneGeometry(9,5).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#e9dcc4'}));fl.receiveShadow=true;row.add(fl);}
const rowM=[buildClawMachine('claw-1',{toonify}),buildMachine('key-1',{toonify}),buildStackMachine(MACHINES.find(m=>m.kind==='stack'),{toonify}),buildStringMachine(STRING_THEME,{toonify}),buildBallMachine(BALL_THEME,{toonify})];
dressStackMachine(rowM[2],{toonify});
rowM.forEach((g,i)=>{g.position.set((i-2)*1.2,0,-1);row.add(g);});
const all=[...U.machines.map(m=>m.group),strM,ballM,...rowM];
// 크기 비교 동동이
const RIG=`${import.meta.env.BASE_URL}assets/toon/models/hiker/HikerRig.glb`;
const ava=await createClawAvatar({rigUrl:RIG,toon});scene.add(ava.root);
for(let i=0;i<40;i++)ava.update(1/60,{moved:0});
// 상태
const staffOn=q.get('staff')==='1',pity=q.get('pity')==='1';
for(const g of [strM,rowM[3]]){g.userData.setStaff(staffOn,true);g.userData.setGuide({on:true,half:.003});g.userData.setBlade({u:.2,open:1});g.userData.setButton(view==='cut-string'?'cut':'move');}
for(const g of [ballM,rowM[4]]){g.userData.setPity(pity);const [x,z]=holeCenter(1,1);g.userData.claw.set({x:x+.01,z:z+.008,has:true});g.userData.setButton('drop');
 if(q.get('mark')){const [i,j,k]=q.get('mark').split(',');g.userData.markHole(`${i},${j}`,k);}}
for(const g of [stackEntry?.group,rowM[2]].filter(Boolean)){g.userData.setBoard?.({rows:[{x:2,w:3},{x:2,w:3},{x:3,w:2},{x:3,w:2}],cur:{x:1,w:2,r:5}});g.userData.setButton?.('stop');}
const tFix=q.get('t')!=null?+q.get('t'):null;
const controls=new OrbitControls(camera,renderer.domElement);
const wp=(g,p)=>g.localToWorld(new THREE.Vector3(...p));
function cam(g,c,portrait){const P=portrait?c.portrait:c,look=P.look??c.look;return {pos:wp(g,P.pos),look:wp(g,look),fov:P.fov};}
const portrait=innerWidth<innerHeight;
const V={
 row:()=>({pos:new THREE.Vector3(0,1.6,14.2),look:new THREE.Vector3(0,1.0,9),fov:42}),
 rowside:()=>({pos:new THREE.Vector3(3.6,1.5,12.4),look:new THREE.Vector3(.8,1.0,9),fov:42}),
 shop:()=>({pos:new THREE.Vector3(1.5,3.6,1.4),look:new THREE.Vector3(-1.5,.8,4.6),fov:55}),
 shopleft:()=>({pos:new THREE.Vector3(-3.2,2.4,1.0),look:new THREE.Vector3(-6,.9,3.2),fov:55}),
 'play-stack':()=>cam(stackEntry.group,stackEntry.group.userData.camera,portrait),
 'play-string':()=>cam(strM,STRING.camera,portrait),
 'cut-string':()=>{const c=cutCamera(.2,{portrait});return {pos:wp(strM,c.pos),look:wp(strM,c.look),fov:c.fov};},
 'play-ball':()=>cam(ballM,ballM.userData.camera,portrait),
};
const v=(V[view]??V.row)();camera.fov=v.fov;camera.position.copy(v.pos);controls.target.copy(v.look);controls.update();
// 동동이: 줄 보기면 나란히 줄 집게 앞, 가게면 줄 자르기 앞(조작 화면에서는 숨김 = 게임과 같음)
const standOf=g=>g.localToWorld(new THREE.Vector3(0,0,CLAW.stand.z));
{const s=view.startsWith('row')?standOf(rowM[3]):standOf(strM);ava.place(s.x,s.z,view.startsWith('row')?0:Math.PI);ava.root.visible=!/^(play|cut)/.test(view);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);toon.pipeline.resize(mobile?0:2,innerWidth,innerHeight);});
camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(mobile?1:Math.min(devicePixelRatio,2));toon.pipeline.resize(mobile?0:2,innerWidth,innerHeight);
let t=0,frames=0;const clock=new THREE.Clock();renderer.info.autoReset=false;
// 움직임 흉내: 줄 흔들림(규칙서 식 그대로) · 공 떨어짐
const amp=(t,i)=>.05*(.85+.3*(.5+.5*Math.sin(t/7.3*2*Math.PI+i*2.1)));
renderer.setAnimationLoop(()=>{const dt=tFix!=null?0:Math.min(clock.getDelta(),.05);t=tFix??t+dt;
 for(const g of [strM,rowM[3]])for(let i=0;i<2;i++)g.userData.setString(i,{dx:staffOn?0:amp(t,i)*Math.sin(2*Math.PI*t/1.4+i*1.9)});
 for(const g of all)g.userData.update?.(dt);ava.update(dt,{moved:0});
 controls.update();renderer.info.reset();toon.pipeline.render(dt||1/60);frames++;
 if(frames===20){const r=renderer.info;info(`${view} · 그리기 ${r.render.calls} · 삼각형 ${(r.render.triangles/1000).toFixed(0)}k · 텍스처 ${r.memory.textures}`);}
});
window.n3={strM,ballM,rowM,stack:stackEntry?.group,shop,camera,controls,ready:()=>frames>30,
 stats:()=>({calls:renderer.info.render.calls,tri:renderer.info.render.triangles,tex:renderer.info.memory.textures,geo:renderer.info.memory.geometries})};
void machineToShop;
