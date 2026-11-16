// 합성 계단(디딤판 tread·높이 rise)을 동동이가 오르며 칸마다 디딘 발 수, 디딘 발 오차, 골반 튐을 잰다.
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
import {STAIR_STRIDE,STAIR_WALK_CADENCE} from '../../src/route.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb'),warn=console.warn;
const load=async()=>{console.warn=()=>{};const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');console.warn=warn;return buildToonHikerGltf(g);};
export async function climb({rise=.18,tread=.30,fps=60,seconds=8,running=false,log=false,start=-.4}={}){
 const h=createRealisticHiker(await load()),dt=1/fps;
 const tr=d=>Math.floor(d/tread),surf=(x,z)=>{const d=-z;return d<0?0:(tr(d)+(d>=0?1:0))*rise;};
 const slope=rise/tread,stride=STAIR_STRIDE,rate=STAIR_WALK_CADENCE*(running?2.5:1);let ph=0,d=start;
 const plants=[],pel=[];let maxErr=0,maxPen=0,prevHip=null,maxJump=0;const was=[false,false];
 for(let i=0;i<seconds*fps;i++){const dph=rate*dt;ph+=dph;d+=dph*stride/Math.hypot(1,slope);
  h.scene.position.set(0,surf(0,-d),-d);h.scene.updateMatrixWorld(true);
  h.update({clip:'Climb',distance:ph,stride:1,stepLength:stride,running,dt,speed:rate*stride,slope,stairs:true,surfaceHeight:surf});
  const cs=h.ground({moving:true,phase:ph,surfaceHeight:surf});
  cs.forEach((c,k)=>{const pl=c.planted&&c.lift<.003;if(pl&&!was[k]&&i>fps){const [fx,fz]=c.foot;const bc=-fz+.033;plants.push({k,t:(i/fps).toFixed(2),tread:tr(bc),frac:+((bc/tread)%1).toFixed(2)});}
   was[k]=pl;if(c.planted&&i>fps){maxErr=Math.max(maxErr,c.error);maxPen=Math.max(maxPen,c.penetration);}});
  const hip=h.model.getObjectByName('mixamorigHips').getWorldPosition(new Vector3()).y;const ph0=prevHip;if(prevHip!==null&&i>fps)maxJump=Math.max(maxJump,Math.abs(hip-prevHip)/dt);
  if(log&&(Math.abs(hip-(prevHip??hip))/dt>2||cs.some(c=>c.planted&&c.error>.005)))console.log((i/fps).toFixed(2),'hipW',hip.toFixed(3),'d',d.toFixed(3),cs.map(c=>`${c.side} lift${(c.lift*1000).toFixed(0)} err${(c.error*1000).toFixed(1)} pl${c.planted?1:0} land${c.landed?1:0} sole${c.bottom.toFixed(3)} sup${c.support.toFixed(3)} foot${c.foot.map(v=>v.toFixed(3))} g${surf(c.foot[0],c.foot[1]).toFixed(2)} ${JSON.stringify(c.dbg)}`).join(' '),'dHip',(hip-(ph0??hip)).toFixed(3));prevHip=hip;}
 const per=new Map();for(const p of plants)per.set(p.tread,(per.get(p.tread)??0)+1);
 const late=plants.slice(2);return {fracs:late.map(p=>p.frac).join(' '),plants:plants.length,treads:per.size,perTread:[...per.values()].join(''),alternate:plants.every((p,i)=>!i||p.k!==plants[i-1].k),maxErr:+(maxErr*1000).toFixed(1),maxPen:+(maxPen*1000).toFixed(1),hipVmax:+maxJump.toFixed(2),list:plants.slice(0,8)};
}
if(import.meta.url===`file://${process.argv[1]}`)for(const o of [{rise:.18},{rise:.06},{rise:.03,start:-.55},{rise:.06,tread:.25,start:-.3},{rise:.18,fps:30},{rise:.18,fps:144},{rise:.12,running:true}]){const r=await climb(o);console.log(JSON.stringify(o),JSON.stringify({...r,list:undefined}));}
