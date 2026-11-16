import {climb} from './dd-stairs.mjs';
let worst={maxErr:0,maxPen:0,hipVmax:0},bad=[];
for(const rise of [.18,.1,.06,-.06,-.15])for(const start of [-.4,-.47,-.52,-.58,-.63,-.7])for(const fps of [60]){const r=await climb({rise,start,fps,seconds:7});
 for(const k of ['maxErr','maxPen','hipVmax'])worst[k]=Math.max(worst[k],r[k]);if(!/^1+$/.test(r.perTread)||r.maxErr>6||!r.alternate)bad.push({rise,start,...r,list:undefined});}
console.log(JSON.stringify(worst));console.log(JSON.stringify(bad,null,0));
