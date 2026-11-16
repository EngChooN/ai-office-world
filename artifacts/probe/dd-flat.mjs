import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf,TOON_STRIDE} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
import {STAIR_STRIDE,STAIR_WALK_CADENCE,WALK_STRIDE,WALK_CADENCE} from '../../src/route.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb');console.warn=()=>{};
for(const rise of [0.0001]){
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
const h=createRealisticHiker(buildToonHikerGltf(g)),fps=60,dt=1/fps,tread=.3,N=6;
const surf=(x,z)=>{const d=-z;return d<0?0:Math.min(N,Math.floor(d/tread)+1)*rise;};
let ph=0,d=-1.2,maxErr=0,maxV=0,prev=null,clips=new Set();
for(let i=0;i<fps*9;i++){const on=d>-.05&&d<N*tread,stride=on?STAIR_STRIDE:WALK_STRIDE.flat*TOON_STRIDE.walk,rate=on?STAIR_WALK_CADENCE:1.37/stride;
 ph+=rate*dt;d+=rate*dt*stride/(on?Math.hypot(1,rise/tread):1);h.scene.position.set(0,surf(0,-d),-d);h.scene.updateMatrixWorld(true);
 h.update({clip:on&&rise>0?'Climb':'Walk',distance:ph,stride:1,stepLength:stride,dt,stairs:on,surfaceHeight:surf,slope:on?rise/tread:0});const cs=h.ground({moving:true,phase:ph,surfaceHeight:surf});
 clips.add(h.pose.name);const hip=h.model.getObjectByName('mixamorigHips').getWorldPosition(new Vector3()).y;if(prev!==null&&i>30){const v=Math.abs(hip-prev)/dt;if(v>2&&process.argv[2])console.log("V",(i/fps).toFixed(2),d.toFixed(2),on,v.toFixed(2),h.pose.name,cs.map(c=>`${c.side} l${(c.lift*1000).toFixed(0)} pl${c.planted?1:0} land${c.landed?1:0} g${surf(...c.foot).toFixed(2)} ${JSON.stringify(c.dbg)}`).join(" "));maxV=Math.max(maxV,v);}prev=hip;
 if(i>30)for(const c of cs)if(c.planted){maxErr=Math.max(maxErr,c.error);if(c.error>.006&&process.argv[2])console.log((i/fps).toFixed(2),d.toFixed(2),on,c.side,(c.error*1000).toFixed(1),"lift",(c.lift*1000).toFixed(0),"w",JSON.stringify(Object.fromEntries(Object.entries(h.actions).map(([k,a])=>[k,+a.getEffectiveWeight().toFixed(2)]))),JSON.stringify(c.dbg));}}
console.log(rise,'maxErr mm',(maxErr*1000).toFixed(1),'hipVmax',maxV.toFixed(2),'shift end',h.stair?.shift?.toFixed(3),[...clips].join(','));}
