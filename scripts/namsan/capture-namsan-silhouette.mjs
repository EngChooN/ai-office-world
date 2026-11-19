// 남산 윤곽 대조 사진(월드아트): node scripts/namsan/capture-namsan-silhouette.mjs [폴더] [south,west,north,east] [w] [h]
// 개발 서버 http://127.0.0.1:5187. 같은 카메라에서 실제 지형 자료·게임 지형·게임 지형+숲의 윗선을 그어 찍고, 차이(m)를 표준 출력·json으로 남긴다.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const [dir='namsan-silhouette',views='south,west,north,east',w='1600',h='900']=process.argv.slice(2);
const out=`artifacts/${dir}`;mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5187';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:+w,height:+h}});
const logs=[];page.on('pageerror',e=>logs.push('pageerror: '+e.message));
await page.goto(`${base}/src/namsan/preview.html?hud=0&time=day`);
await page.waitForFunction(()=>window.namsan&&window.namsan.frames>5,null,{timeout:180000});
await page.waitForFunction(()=>window.namsan.cityDone,null,{timeout:240000}).catch(()=>logs.push('city timeout'));
const results=[];
for(const v of views.split(',')){
 await page.evaluate(v=>window.namsan.setView('start'),v);await page.waitForTimeout(300);
 const r=await page.evaluate(v=>window.namsan.silhouette(v),v);await page.waitForTimeout(2500);
 await page.evaluate(v=>window.namsan.silhouette(v),v); // 도시 칸이 다 붙은 뒤 한 번 더
 await page.waitForTimeout(400);await page.screenshot({path:`${out}/silhouette-${v}.png`});
 const r2=await page.evaluate(v=>window.namsan.silhouette(v),v);results.push(r2);console.log(JSON.stringify(r2));
}
await page.evaluate(()=>window.namsan.planCheck());await page.waitForTimeout(3000);await page.evaluate(()=>window.namsan.planCheck());await page.waitForTimeout(400);await page.screenshot({path:`${out}/plan-course-wall.png`});
writeFileSync(`${out}/silhouette-diff.json`,JSON.stringify(results,null,1));
console.log(logs.length?logs.join('\n'):'오류 0건');
await browser.close();
