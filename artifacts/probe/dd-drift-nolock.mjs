import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
import {STAIR_STRIDE,STAIR_WALK_CADENCE} from '../../src/route.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb');console.warn=()=>{};
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
const h=createRealisticHiker(buildToonHikerGltf(g)),fps=144,dt=1/fps,rise=.18,tread=.3;
const surf=(x,z)=>{const d=-z;return d<0?0:(Math.floor(d/tread)+1)*rise;};let ph=0,d=-.4;const rate=STAIR_WALK_CADENCE;
for(let i=0;i<fps*3;i++){ph+=rate*dt;d+=rate*dt*STAIR_STRIDE/Math.hypot(1,.6);h.scene.position.set(0,surf(0,-d),-d);h.scene.updateMatrixWorld(true);
 h.update({clip:'Climb',distance:ph,stride:1,stepLength:STAIR_STRIDE,dt,stairs:true,surfaceHeight:null,slope:.6});const cs=h.ground({moving:true,phase:ph,surfaceHeight:surf});
 if(i>fps*1.2&&i<fps*2.3&&i%6==0)console.log((i/fps).toFixed(3),cs.map(c=>`${c.side} lift${(c.lift*1000).toFixed(0)} drift${(c.dbg.drift??-1).toFixed(3)} anch${c.anchored?1:0} heel${c.heelOn?1:0}`).join(' | '),'hipsY',h.model.position.y.toFixed(3),JSON.stringify(h.stair,(k,v)=>typeof v==='number'?+v.toFixed(3):v));}
