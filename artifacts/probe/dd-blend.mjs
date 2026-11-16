import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb'),warn=console.warn;
const load=async()=>{console.warn=()=>{};const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');console.warn=warn;return buildToonHikerGltf(g);};
const flat=()=>0,move=process.argv[2]!=='still';
for(const [rate,dt] of [[6.2,1/60],[6.2,1/30],[6.2,1/144],[1.8,1/60]]){
 const h=createRealisticHiker(await load()),st=h.profile.animSteps;let ph=0;const res=[];
 for(const [running,n] of [[false,90],[true,90],[false,90],[true,40],[false,90]]){let blend=0,steady=0;
  for(let i=0;i<n;i++){const step=running?st.run:st.walk,dph=(running?8.2/6.2*rate:rate)*dt;ph+=dph;if(move)h.scene.position.z-=dph*step;h.scene.updateMatrixWorld(true);
   h.update({clip:'Walk',distance:ph,stride:1,stepLength:step,running,dt,speed:1.4});
   for(const c of h.ground({moving:true,phase:ph,surfaceHeight:flat}))if(c.planted){if(h.gait.run>.01&&h.gait.run<.99)blend=Math.max(blend,c.error);else steady=Math.max(steady,c.error);}}
  res.push(`${running?'→뛰':'→걷'} 섞기 ${(blend*1000).toFixed(1)} 평소 ${(steady*1000).toFixed(1)}`);}
 console.log(rate,(1/dt).toFixed(0)+'fps',res.join(' | '));}
