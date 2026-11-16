import {Vector3,MathUtils} from 'three';
const sh=new Vector3(.139,.441,-.021),goal=new Vector3(.21,.255,-.03),d=MathUtils.degToRad;
const pose=(mid,elbow,out,foreOut)=>{const th=d(mid),el=d(elbow),o=d(out),fo=d(out+foreOut);
 const u=new Vector3(Math.sin(o),-Math.cos(o)*Math.cos(th),-Math.cos(o)*Math.sin(th)).normalize();
 const f=new Vector3(Math.sin(fo),-Math.cos(fo)*Math.cos(th+el),-Math.cos(fo)*Math.sin(th+el)).normalize();
 const w=sh.clone().addScaledVector(u,.115).addScaledVector(f,.11);const ha=f.clone().add(new Vector3(0,-.25,-.05)).normalize();return w.addScaledVector(ha,.03);};
let best=[];
for(let mid=-10;mid<=10;mid+=2)for(let elbow=0;elbow<=60;elbow+=3)for(let out=5;out<=30;out+=1)for(let fo=0;fo<=60;fo+=3){const m=pose(mid,elbow,out,fo);best.push([m.distanceTo(goal)+.00005*(elbow+fo),mid,elbow,out,fo,m.toArray().map(v=>v.toFixed(3))]);}
best.sort((a,b)=>a[0]-b[0]);console.log(best.slice(0,8));
