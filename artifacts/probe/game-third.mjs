import {chromium} from '@playwright/test';
const [base='http://127.0.0.1:5173',out='artifacts/toon-face',suffix='after']=process.argv.slice(2);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${base}/?style=toon&outfit=1&start=entrance&time=12:00&weather=clear`);
await page.waitForFunction(()=>!!window.hiking?.ready,null,{timeout:120000});
await page.evaluate(()=>window.hiking.ready());
await page.waitForFunction(()=>window.hiking.started===true,null,{timeout:300000});
await page.evaluate(()=>window.hiking.chunks.ready());
await page.evaluate(()=>document.getElementById('view').click());
await page.waitForTimeout(3000);
await page.screenshot({path:`${out}/game-third-back-${suffix}.png`});
// 카메라를 앞으로 돌려 얼굴 쪽을 본다(마우스 끌기)
const box={x:640,y:400};await page.mouse.move(box.x,box.y);await page.mouse.down();for(let i=0;i<30;i++)await page.mouse.move(box.x+i*25,box.y,{steps:1});await page.mouse.up();
await page.waitForTimeout(1500);
await page.screenshot({path:`${out}/game-third-turn-${suffix}.png`});
console.log('errors',JSON.stringify(errors));
await browser.close();
