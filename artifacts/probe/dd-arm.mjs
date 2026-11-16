import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb'),warn=console.warn;console.warn=()=>{};
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');console.warn=warn;
const h=createRealisticHiker(buildToonHikerGltf(g));const flat=()=>0;
for(let i=0;i<40;i++){h.update({clip:'Idle',pose:'stand',dt:.05});h.ground({moving:false,phase:0,surfaceHeight:flat});}
h.model.updateMatrixWorld(true);
const B=n=>h.model.getObjectByName('mixamorig'+n).getWorldPosition(new Vector3());
for(const s of ['Left','Right']){const sh=B(s+'Arm'),hand=B(s+'Hand'),mid=B(s+'HandMiddle1'),el=B(s+'ForeArm');const mit=hand.clone().addScaledVector(mid.clone().sub(hand).normalize(),.03);
 console.log(s,'shoulder',sh.toArray().map(v=>v.toFixed(3)).join(','),'elbow',el.toArray().map(v=>v.toFixed(3)).join(','),'mitten',mit.toArray().map(v=>v.toFixed(3)).join(','));}
