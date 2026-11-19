// 남산 그림 확인(월드아트): node scripts/namsan/capture-namsan-art.mjs [폴더] [장면,…] [w] [h] [추가 query]
// 개발 서버를 먼저 띄운다(BASE_URL 기본 http://127.0.0.1:5187). 결과: artifacts/<폴더>/<장면>-<w>x<h>[-time].png, 통계·오류는 표준 출력.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const [dir='namsan-art',views='start,start-back,wall,stairs,rest,last,summit,summit-south,aerial,far-south',w='1920',h='1080',extra='']=process.argv.slice(2);
const out=`artifacts/${dir}`;mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5187';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal','--enable-precise-memory-info']});
const mobile=+w<900;
const page=await browser.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
const logs=[];page.on('console',m=>{if(['error','warning'].includes(m.type()))logs.push(m.type()+': '+m.text());});page.on('pageerror',e=>logs.push('pageerror: '+e.stack));page.on('response',r=>{if(r.status()>=400)logs.push(`${r.status()} ${r.url()}`);});
const t0=Date.now();
await page.goto(`${base}/src/namsan/preview.html?hud=0&${extra}`);
await page.waitForFunction(()=>window.namsan&&window.namsan.frames>5,null,{timeout:+(process.env.WAIT??180000)}).catch(e=>logs.push('timeout '+e.message));
if(!/city=0/.test(extra))await page.waitForFunction(()=>window.namsan?.cityDone,null,{timeout:240000}).catch(e=>logs.push('city timeout'));
const load=Date.now()-t0,tag=(new URLSearchParams(extra).get('time'))??'';
for(const v of views.split(',')){
 await page.evaluate(v=>window.namsan.setView(v),v).catch(e=>logs.push('eval: '+e.message));
 await page.waitForTimeout(+(process.env.SETTLE??2500));
 await page.screenshot({path:`${out}/${v}-${w}x${h}${tag?'-'+tag:''}.png`});
 const s=await page.evaluate(()=>{const s=window.namsan.stats();return {calls:s.calls,triangles:s.triangles,memory:s.memory};}).catch(()=>null);
 console.log(v,JSON.stringify(s));
}
console.log('stats',JSON.stringify(await page.evaluate(()=>{const s=window.namsan.stats();delete s.items;return s;}).catch(e=>e.message)));
console.log('load ms',load);
if(logs.length)console.log([...new Set(logs)].slice(0,25).join('\n'));else console.log('오류 0건');
await browser.close();
