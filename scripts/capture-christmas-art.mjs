// 눈마을 광장 그림 확인(월드아트): node scripts/capture-christmas-art.mjs [폴더] [장면,…] [w] [h] [추가 query]
// 개발 서버를 먼저 띄운다(BASE_URL 기본 http://127.0.0.1:5181). 결과: artifacts/<폴더>/<장면>-<w>x<h>.png, 오류·그리기 호출 수는 표준 출력.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const [dir='christmas-art',views='entry,tree,campfire,mailbox,snowman,snowball,sled,aerial,outfits,gifts',w='1920',h='1080',extra='']=process.argv.slice(2);
const out=`artifacts/${dir}`;mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5181';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const mobile=+w<900;
const page=await browser.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
const logs=[];page.on('console',m=>{if(['error','warning'].includes(m.type()))logs.push(m.type()+': '+m.text());});page.on('pageerror',e=>logs.push('pageerror: '+e.stack));page.on('response',r=>{if(r.status()>=400)logs.push('http '+r.status()+' '+r.url());});
const t0=Date.now();
await page.goto(`${base}/src/christmas/preview.html?hud=0&${mobile?'mobile=1&':''}${extra}`);
await page.waitForFunction(()=>window.xmas&&window.xmas.frames>5,null,{timeout:+(process.env.WAIT??90000)}).catch(e=>logs.push('timeout '+e.message));
const load=Date.now()-t0;
for(const v of views.split(',')){
 await page.evaluate(v=>window.xmas.setView(v),v).catch(e=>logs.push('eval: '+e.message));
 await page.waitForTimeout(1500);
 await page.screenshot({path:`${out}/${v}-${w}x${h}.png`});
 const info=await page.evaluate(()=>window.xmas.info()).catch(()=>null);
 console.log(v,JSON.stringify(info));
}
console.log('load ms',load);
if(logs.length)console.log(logs.slice(0,20).join('\n'));else console.log('오류 0건');
await browser.close();
