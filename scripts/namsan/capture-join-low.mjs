// 실제 게임에서 이음새를 같은 낮은 옆 각도로 촬영한다.
import {chromium} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
import {courseAt} from '../../src/namsan/namsan-data.js';
const phase=process.argv[2]??'before',out='artifacts/namsan-join-followup-2026-11-22';
mkdirSync(`${out}/${phase}`,{recursive:true});
const points=JSON.parse(readFileSync('assets/shared/namsan/course.json','utf8')).points;
const spots=(process.env.SPOTS??'71.7,105.1,296.9,360.1,404.9,477.2,493.4,661.6,674.8,718.2,816.4,941.5').split(',').map(Number);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
for(const [tag,width,height,touch] of [['pc',1920,1080,false],['phone',390,844,true]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(()=>localStorage.setItem('gwanak-sound-enabled','false'));
 const page=await ctx.newPage();page.on('pageerror',e=>console.error(tag,e.message));
 await page.goto(`${process.env.BASE_URL??'http://127.0.0.1:5173'}/hiking/namsan/?time=13:00&weather=clear&season=summer&debug`);
 await page.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
 for(const s of spots){const m=courseAt(points,s),side=([718.2,816.4,941.5].includes(s)?-1:1)*(touch?4.2:4.8),back=touch?2.6:3.0;
  await page.evaluate(({s,m,side,back})=>{window.namsan.jump(Math.max(0,s-9));window.namsan.cameraOverride={p:[m.x+m.nx*side-m.tx*back,m.y+1.45,m.z+m.nz*side-m.tz*back],t:[m.x,m.y+.05,m.z]};},{s,m,side,back});
  await page.waitForTimeout(1200);await page.screenshot({path:`${out}/${phase}/${tag}-${s}.png`});console.log(phase,tag,s);
 }
 await ctx.close();
}
await browser.close();
