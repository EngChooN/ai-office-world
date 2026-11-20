import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();
await p.goto('file:///tmp/');
for(const f of ['/tmp/healing-orig.mp3','/tmp/healing-new.mp3']){
 const d=await p.evaluate(async u=>{const a=new Audio(u);await new Promise(r=>{a.onloadedmetadata=r;a.onerror=r;});const d1=a.duration;a.currentTime=375;a.muted=true;await a.play().catch(()=>{});const t0=performance.now();const ended=await new Promise(r=>{a.onended=()=>r((performance.now()-t0)/1000);setTimeout(()=>r('끝나지 않음'),9000);});return {d1,ended};},'file://'+f);
 console.log(f,JSON.stringify(d));}
await b.close();
