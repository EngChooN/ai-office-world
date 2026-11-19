// 1단계 확인: 남산 정상에서 관악산 쪽(남쪽) 원경 — 관악산 근경을 안 만들어도 땅에 구멍이 없는지
import {chromium} from 'playwright';
const base=process.env.BASE_URL??'http://127.0.0.1:5187',out=process.env.OUT??'artifacts/merge-baseline/step1';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
for(const t of ['13:00','21:30']){const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto(`${base}/hiking/namsan/?time=${t}&weather=clear&server=off&start=summit`);await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
await p.evaluate(()=>window.namsan.jump(1040));await p.waitForTimeout(4000);
await p.evaluate(()=>{window.namsan.cameraOverride={p:[3692,330,-9210],t:[600,0,0]};});await p.waitForTimeout(4000);
await p.screenshot({path:`${out}/namsan-south-${t.replace(':','')}.png`});await p.close();}
await b.close();
