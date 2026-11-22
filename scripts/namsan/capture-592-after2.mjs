import {chromium} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
import {courseAt} from '../../src/namsan/namsan-data.js';
const out='artifacts/namsan-592-line-2026-11-22';mkdirSync(out,{recursive:true});
const points=JSON.parse(readFileSync('assets/shared/namsan/course.json')).points;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.goto('http://127.0.0.1:5174/hiking/namsan/?time=13:00&weather=clear&season=summer&debug');await page.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
await page.evaluate(()=>{__scene.traverse(o=>{if(o.isMesh)o.receiveShadow=false;if(o.isAmbientLight)o.intensity+=.12;});});
for(const s of [592.34])for(const angle of ['low']){const m=courseAt(points,s);await page.evaluate(({s,m,angle})=>{namsan.jump(s-9);let side=4.8,back=3; namsan.cameraOverride=angle==='low'?{p:[m.x+m.nx*side-m.tx*back,m.y+1.45,m.z+m.nz*side-m.tz*back],t:[m.x,m.y+.05,m.z]}:{p:[m.x+m.nx*2-m.tx*1,m.y+22,m.z+m.nz*2-m.tz*1],t:[m.x,m.y,m.z]};},{s,m,angle});await page.waitForTimeout(1500);await page.screenshot({path:`${out}/after2-mobile.png`});console.log(s,angle);}
await browser.close();
