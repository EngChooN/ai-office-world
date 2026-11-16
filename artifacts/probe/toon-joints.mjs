import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '/Users/pc-2311001/gwanak-hiking/src/toon/link-hiker.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('/Users/pc-2311001/gwanak-hiking/assets/toon/models/hiker/Hiker.glb');const w=console.warn;console.warn=()=>{};
const base=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');console.warn=w;
const g=buildToonHikerGltf(base);g.scene.updateMatrixWorld(true);
for(const n of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand'])console.log(n,g.scene.getObjectByName('mixamorig'+n).getWorldPosition(new Vector3()).toArray().map(v=>v.toFixed(3)).join(' '));
