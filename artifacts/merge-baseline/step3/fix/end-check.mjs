// 파일 끝 3초 앞으로 옮겨 재생 → ended가 오는지(브라우저, file://)
import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();await p.goto('file:///tmp/');
for(const [f,len] of process.argv.slice(2).map(a=>a.split('@'))){
 const d=await p.evaluate(async ([u,len])=>{const a=new Audio(u);a.muted=true;await new Promise(r=>{a.onloadedmetadata=r;a.onerror=r;});const d1=a.duration;a.currentTime=len-3;const t0=performance.now();
  const pl=await Promise.race([a.play().then(()=>'ok',e=>'err '+e.message),new Promise(r=>setTimeout(()=>r('play 시간 초과'),8000))]);
  const ended=await new Promise(r=>{a.onended=()=>r(((performance.now()-t0)/1000).toFixed(2));setTimeout(()=>r('끝나지 않음'),9000);});return {d1,pl,ended};},['file://'+f,+len]);
 console.log(f.split('/').pop(),JSON.stringify(d));}
await b.close();
