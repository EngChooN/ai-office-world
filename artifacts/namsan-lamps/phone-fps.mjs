import {chromium} from 'playwright';
const base='http://127.0.0.1:5187';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
for(const mt of ['gwanak','namsan']){
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await ctx.newPage();
await p.goto(mt==='gwanak'?`${base}/hiking/?pick=off&start=entrance&time=21:30&weather=clear&server=off`:`${base}/hiking/namsan/?time=21:30&weather=clear&server=off`);
await p.waitForFunction(()=>(window.hiking?.started===true)||window.namsan?.started,null,{timeout:240000});await p.waitForTimeout(6000);
const fps=await p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<4000)requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000));};requestAnimationFrame(f);}));
const mem=await p.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null);
console.log(mt,'phone fps',fps.toFixed(1),'heapMB',mem);await ctx.close();}
await b.close();
