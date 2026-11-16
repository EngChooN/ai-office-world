// 임시 진단(커밋 안 함): 쌍안경 시야의 카메라 fov·높이·피치 확인
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:5310',viewport={width:1440,height:810};
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const ctx=await browser.newContext({viewport});await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
const page=await ctx.newPage();
await page.goto(`${base}/?style=toon&outfit=1&time=20:30&weather=clear&quality=high&start=summit&bearing=345.6`);
await page.waitForFunction(()=>window.hiking?.started&&window.hiking.landscape().natureReady&&!window.hiking.rendering().compiling,null,{timeout:300000});
console.log(await page.evaluate(()=>JSON.stringify({cam:window.hiking.rendering().cameraInfo?.(),gv:window.hiking.gadgetView(),snap:Object.keys(window.hiking.snapshot()),r:Object.keys(window.hiking.rendering())})));
await browser.close();
