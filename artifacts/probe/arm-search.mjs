import {Vector3} from 'three';
import {linkArmPose} from '../../src/hiker-arms.js';
import {TOON_ARM} from '../../src/toon/link-hiker.js';
const sh=new Vector3(.139,.441,-.021),goal=new Vector3(.21,.255,-.02);
let best=[];
for(let mid=-10;mid<=20;mid+=2)for(let elbow=0;elbow<=90;elbow+=3)for(let out=5;out<=40;out+=1){
 const cfg={...TOON_ARM,stand:{mid,amp:0,elbow,elbowAmp:0,out,inward:0}};const p=linkArmPose(sh,'Right',{cfg});
 const m=p.wrist.clone().addScaledVector(p.handAxis,.03);const e=m.distanceTo(goal);best.push([e,mid,elbow,out,m.toArray().map(v=>v.toFixed(3))]);}
best.sort((a,b)=>a[0]-b[0]);console.log(best.slice(0,8));
const cur=linkArmPose(sh,'Right',{cfg:TOON_ARM});console.log('cur',cur.wrist.clone().addScaledVector(cur.handAxis,.03).toArray());
