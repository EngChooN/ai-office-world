import {readFileSync} from 'node:fs';
import {Vector3,Quaternion,Raycaster} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb');console.warn=()=>{};
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
const h=createRealisticHiker(buildToonHikerGltf(g)),flat=()=>0,rc=new Raycaster(),head=h.model.getObjectByName('ToonHiker_Head');
for(const [yaw,pitch] of (process.argv[2]?JSON.parse(process.argv[2]):[[0,0],[1.2,0],[-1.2,0],[0,.8],[0,-.6],[1,.6]])){for(let i=0;i<30;i++){h.update({clip:'Idle',pose:'stand',dt:.1,gadget:'binoculars',lookYaw:yaw,lookPitch:pitch});h.ground({moving:false,phase:0,surfaceHeight:flat});}
 h.scene.updateMatrixWorld(true);const b=h.gadgetProps.binoculars,d=new Vector3(0,0,1).applyQuaternion(b.getWorldQuaternion(new Quaternion()));const gaps=[-1,1].map(s=>{const p=b.localToWorld(new Vector3(s*.028,0,.044));rc.set(p.clone().addScaledVector(d,-.1),d);rc.far=.4;const hit=rc.intersectObject(head,false)[0];return hit?(hit.distance-.1).toFixed(4):'none';});
 console.log(yaw,pitch,'arms',h.interaction.arms.map(a=>a.targetError.toFixed(3)).join(','),'gap',gaps.join(','));}
