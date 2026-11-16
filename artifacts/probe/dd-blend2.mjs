import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb'),warn=console.warn;console.warn=()=>{};
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');console.warn=warn;
const h=createRealisticHiker(buildToonHikerGltf(g)),st=h.profile.animSteps,flat=()=>0,dt=1/144;let ph=0;
for(const [running,n] of [[false,90],[true,90]])for(let i=0;i<n;i++){const step=running?st.run:st.walk,dph=(running?8.2:6.2)*dt;ph+=dph;h.scene.position.z-=dph*step;h.scene.updateMatrixWorld(true);
 h.update({clip:'Walk',distance:ph,stride:1,stepLength:step,running,dt,speed:1.4});
 const cs=h.ground({moving:true,phase:ph,surfaceHeight:flat});
 if(h.gait.run>.01&&h.gait.run<.99)cs.forEach((c,k)=>{const cyc=((ph/2)+k*.5)%1;if(c.planted&&c.error>.003)console.log('run',h.gait.run.toFixed(2),'cyc',cyc.toFixed(3),c.side,'lift',(c.lift*1000).toFixed(1),'err',(c.error*1000).toFixed(1),'anch',c.anchored,JSON.stringify(c.dbg));});}
