import {Vector3,MathUtils} from 'three';
const sh=new Vector3(.139,.441,-.021),d=MathUtils.degToRad;
const goal=new Vector3(+process.argv[2]||.21,+process.argv[3]||.25,+process.argv[4]||-.03);
const pose=(mid,elbow,out,fo)=>{const th=d(mid),el=d(elbow),o=d(out),f0=d(out+fo);
 const u=new Vector3(Math.sin(o),-Math.cos(o)*Math.cos(th),-Math.cos(o)*Math.sin(th)).normalize();
 const f=new Vector3(Math.sin(f0),-Math.cos(f0)*Math.cos(th+el),-Math.cos(f0)*Math.sin(th+el)).normalize();
 const e=sh.clone().addScaledVector(u,.115),w=e.clone().addScaledVector(f,.11);const ha=f.clone().add(new Vector3(0,-.25,-.05)).normalize();return {m:w.clone().addScaledVector(ha,.03),e,w};};
let best=[];
for(let mid=-40;mid<=20;mid+=2)for(let elbow=0;elbow<=100;elbow+=4)for(let out=0;out<=30;out+=2)for(let fo=-10;fo<=60;fo+=4){const {m,e}=pose(mid,elbow,out,fo);
 // 팔꿈치가 몸통(타원체 가운데 .34, 반지름 .165·.18·.145) 안이면 버림
 const q=new Vector3(e.x/.17,(e.y-.34)/.185,e.z/.15);if(q.length()<1.02)continue;
 best.push([m.distanceTo(goal),mid,elbow,out,fo,m.toArray().map(v=>v.toFixed(3)),e.toArray().map(v=>v.toFixed(3))]);}
best.sort((a,b)=>a[0]-b[0]);for(const b of best.slice(0,10))console.log(JSON.stringify(b));
