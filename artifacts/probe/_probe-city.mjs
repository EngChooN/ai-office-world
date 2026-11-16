// 임시 진단(커밋 안 함): 정상 원경에서 도심 재질 색을 바꿔 띠의 출처를 확인한다.
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:5310',viewport={width:1440,height:810};
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const ctx=await browser.newContext({viewport});await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
const page=await ctx.newPage();
await page.goto(`${base}/?style=toon&outfit=1&time=${process.argv[2]??'11:00'}&weather=clear&quality=high&start=summit&bearing=345.6`);
await page.waitForFunction(()=>window.hiking?.started&&window.hiking.landscape().natureReady&&!window.hiking.rendering().compiling,null,{timeout:300000});
await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
if(await page.evaluate(()=>window.hiking.snapshot().paused))await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:command',{detail:{id:'pause'}})));
await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:hud-toggle')));
await page.waitForTimeout(5000);
const clip={x:0,y:300,width:1440,height:260};
await page.screenshot({path:'artifacts/probe/a-base.png',clip});
for(const [name,code] of Object.entries(JSON.parse(process.argv[3]??'{}'))){
 await page.evaluate(async code=>{const u=performance.getEntriesByType("resource").map(e=>e.name).find(n=>n.includes("/src/toon/city.js"));const C=await import(u);console.log(u);new Function('C',code)(C);},code);await page.waitForTimeout(800);
 await page.screenshot({path:`artifacts/probe/${name}.png`,clip});
}
console.log(await page.evaluate(()=>JSON.stringify(window.hiking.landscape().cityGrid??{})));
await browser.close();
