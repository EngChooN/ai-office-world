// 인형 들기·업기·빛 확인(vite dev: /src/carry/preview.html). 실제 게임과 같은 동동이·update → ground → carry.update 순서.
// ?hand=인형id&back=인형id&body=shirt|padding|hike(등산 = 배낭)&clip=Idle|Walk|Run&pose=stand|sit&phase=0~2&anim=1
// &view=front|back|side|sideL|three|threeL|game&night=1&far=1&n=4(사람 여러 명: hands=a,b,c,d)
import * as THREE from 'three';
import {createToonStyle} from '../toon/index.js';
import {composeEnvironment} from '../daytime.js';
import {loadToonHiker,buildToonHikerGltf} from '../toon/link-hiker.js';
import {createRealisticHiker} from '../realistic-hiker.js';
import {loadRig} from '../lounge/avatar.js';
import {applyOutfit} from '../lounge/outfit.js';
import {createCarryArt} from './carry-art.js';

const q=new URLSearchParams(location.search),night=q.get('night')==='1';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(night?'#1c2236':'#dfe9f2');
const camera=new THREE.PerspectiveCamera(28,innerWidth/innerHeight,.05,100);
const toon=await createToonStyle({renderer,scene,camera,mobile:false});
const sun=new THREE.DirectionalLight(night?'#9fb4ff':'#fff4e0',night?.6:2.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4});sun.position.set(-3,7,-5);
scene.add(sun,new THREE.HemisphereLight(night?'#5a6a9a':'#ffffff',night?'#202030':'#9aa38a',night?1.0:1.3));
toon.pipeline.update(composeEnvironment({sun:{elevation:night?-20:45,azimuth:160},moon:{elevation:30,azimuth:0,illumination:.8}}));
const ground=new THREE.Mesh(new THREE.CircleGeometry(8,48).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:night?'#3a4256':'#cfd8c4'}));ground.receiveShadow=true;scene.add(ground);toon.toonify(ground);

const body=q.get('body')??'shirt',hike=body==='hike';
const n=+(q.get('n')??1),hands=(q.get('hands')??q.get('hand')??'').split(','),backs=(q.get('backs')??q.get('back')??'').split(',');
let rig=null;
async function person(i){
 let h;
 if(hike)h=await loadToonHiker(`${import.meta.env.BASE_URL}assets/toon/models/hiker/Hiker.glb`);
 else{rig??=await loadRig(`${import.meta.env.BASE_URL}assets/toon/models/hiker/HikerRig.glb`);h=createRealisticHiker(buildToonHikerGltf(rig));applyOutfit(h,(q.get('outfits')?.split(',')[i])??body);}
 toon.toonify(h.scene,{kind:'character'});h.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.outline;o.receiveShadow=!o.userData.noReceiveShadow;}});
 if(!hike)for(const p of h.props?.poles??[])p.group.visible=false;
 scene.add(h.scene);h.snapTo(0);h.scene.position.x=(i-(n-1)/2)*.95;
 const c=createCarryArt(h,{toonify:toon.toonify,pack:hike});
 const hd=hands[i]||null,bk=backs[i]||null;c.set({hand:hd,back:bk});
 return {h,c};
}
const people=[];for(let i=0;i<n;i++)people.push(await person(i));
const state={clip:q.get('clip')??'Idle',pose:q.get('pose')??'stand',phase:+(q.get('phase')??0),view:q.get('view')??'three',anim:q.get('anim')==='1',far:q.get('far')==='1'};
const flat=()=>0;let t=0;
function step(dt){
 const moving=state.clip!=='Idle',running=state.clip==='Run';
 for(const {h,c} of people){const steps=h.profile.animSteps;
  h.update({clip:moving?'Walk':'Idle',distance:state.phase,stride:1,stepLength:running?steps.run:steps.walk,running,dt,pose:state.pose,gadget:'none',selfie:false,idleSeconds:0,speed:moving?1.4:0});
  h.ground({moving,phase:state.phase,surfaceHeight:flat,sample:()=>({}),floorHeight:0});
  c.update(dt,{camera,daylight:night?0:1,seated:h.interaction?.sit??(state.pose==='sit'?1:0),moving,phase:state.phase,far:state.far});}
}
// 처음 자세 잡기(앉기는 시간이 걸림)
for(let i=0;i<(state.pose==='sit'?90:20);i++){state.phase+=moving()?.02:0;step(1/30);}
function moving(){return state.clip!=='Idle';}
const H=1.05,many=n>1,R=many?5.2:3.0;
function aim(){
 const yaw={front:0,side:-Math.PI/2,sideL:Math.PI/2,back:Math.PI,three:-Math.PI/5,threeL:Math.PI/5,bthree:Math.PI*.8,game:Math.PI}[state.view]??(+state.view||0);
 const y=state.view==='game'?H*1.25:H*.62;
 camera.position.set(-Math.sin(yaw)*R,y,-Math.cos(yaw)*R);camera.lookAt(0,H*(state.view==='game'?.55:.48),0);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);toon.pipeline.resize(2,innerWidth,innerHeight,1);}
addEventListener('resize',resize);resize();aim();
let frames=0;const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);t+=dt;if(state.anim&&moving())state.phase+=dt*(state.clip==='Run'?3.3:2.2);step(dt);toon.pipeline.render(dt);frames++;});
// 점검용: 머리 가림·몸 뚫림 확인
window.carryPreview={get frames(){return frames;},state,people,set(o){Object.assign(state,o);aim();},
 check(){return people.map(({h,c})=>{const head=h.model.getObjectByName('mixamorigHead').getWorldPosition(new THREE.Vector3());const b=c.bounds('back'),hb=c.bounds('hand');
  return {headY:+head.y.toFixed(3),backTop:b?+b.max.y.toFixed(3):null,handBox:hb?[hb.min.toArray().map(v=>+v.toFixed(3)),hb.max.toArray().map(v=>+v.toFixed(3))]:null};});}};
