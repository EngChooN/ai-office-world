import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
import {STAIR_STRIDE,STAIR_WALK_CADENCE} from '../../src/route.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb');console.warn=()=>{};
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
const h=createRealisticHiker(buildToonHikerGltf(g)),fps=+process.argv[3]||60,dt=1/fps,rise=+process.argv[2]||.18,tread=.3,slope=rise/tread;
const surf=(x,z)=>{const d=-z;return d<0?0:(Math.floor(d/tread)+1)*rise;};let ph=0,d=-.4;const rate=STAIR_WALK_CADENCE;
const rows=[];for(let i=0;i<fps*4;i++){ph+=rate*dt;d+=rate*dt*STAIR_STRIDE/Math.hypot(1,slope);h.scene.position.set(0,surf(0,-d),-d);h.scene.updateMatrixWorld(true);
 h.update({clip:'Climb',distance:ph,stride:1,stepLength:STAIR_STRIDE,dt,stairs:true,surfaceHeight:surf,slope});const cs=h.ground({moving:true,phase:ph,surfaceHeight:surf});
 const hip=h.model.getObjectByName('mixamorigHips').getWorldPosition(new Vector3()).y-d*slope;rows.push([i/fps,hip,cs.map(c=>c.lift>.003?'~':'_').join('')]);}
for(const r of rows.filter(r=>r[0]>2.5&&r[0]<3.3))console.log(r[0].toFixed(3),r[2],'#'.repeat(Math.max(0,Math.round((r[1]-.1)*400))),r[1].toFixed(3));
