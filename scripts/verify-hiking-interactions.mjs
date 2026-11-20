import {waitChunks} from './lib/chunk-wait.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {initialState,SAVE_KEY} from '../src/movement.js';
import {route,DEMO_START} from '../src/route.js';
// 주소·결과 폴더: BASE_URL(기본은 예전 5176 /hiking/)·OUT(기본은 예전처럼 artifacts/ 바로 아래)
const base=process.env.BASE_URL??'http://127.0.0.1:5176/hiking/',out=process.env.OUT??'artifacts';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const rows=process.env.RESUME==='1'?JSON.parse(readFileSync(`${out}/interaction-browser.json`,'utf8')):[];
try{for(const [id,s,view,bearing] of [['entrance',10,'first',0],['valley',route.length*.55,'first',0],['ridge',DEMO_START,'first',0],['summit',route.length-.05,'first',0],['third',DEMO_START,'third',0]]){
 if(rows.some(r=>r.id===id))continue;
 console.log('검증 시작',id);
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await context.addInitScript(({state,key})=>{if(!sessionStorage.getItem('interaction-seeded')){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('interaction-seeded','1');}localStorage.setItem('gwanak-hiking:sound:v1','false');},{state:{...initialState(),s,view,paused:true,stamina:40},key:SAVE_KEY});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}?bearing=${bearing}`);
 await page.waitForFunction(()=>window.hiking?.started&&window.hiking?.landscape().ready&&hiking.landscape().natureReady&&!hiking.rendering().compiling,null,{timeout:240000});
 await page.waitForTimeout(8000);await page.evaluate(()=>__hikingPerformance.reset());await page.waitForTimeout(10000);
 const metrics=await page.evaluate(()=>({performance:__hikingPerformance.report(),rendering:hiking.rendering(),landscape:hiking.landscape()}));
 const snapshot=()=>page.evaluate(()=>hiking.snapshot());const checks=[];
 if(id==='ridge'){
  // 11-04 f0d6512에서 일시정지를 없애(AGENTS §3) 시작 전 Space(일시정지 풀기)는 뺐다. 차는 다 앉은 뒤에만 된다(main.js teaReady: sitLinear≥0.999, 앉기 0.8초) → 다 앉을 때까지 기다린 뒤 T
  await page.keyboard.press('c');assert.equal((await snapshot()).pose,'sit');await page.waitForFunction(()=>__hiker.interaction?.sitLinear>=.999,null,{timeout:5000});await page.waitForTimeout(350);const sittingY=await page.evaluate(()=>hiking.orientation().camera[1]);
  await page.keyboard.press('t');assert.equal((await snapshot()).pose,'tea');await page.waitForTimeout(3300);assert.equal((await snapshot()).pose,'sit');assert.ok((await snapshot()).stamina>=99);checks.push('C 앉기·T 3초 차 완료·스테미너 회복');
  await (await waitChunks(page)).screenshot({path:`${out}/interaction-first-rest.png`});
  const before=await snapshot();await page.keyboard.down('Shift');await page.keyboard.down('w');await page.waitForTimeout(2000);await page.keyboard.up('w');await page.keyboard.up('Shift');const after=await snapshot();assert.equal(after.pose,'stand');assert.ok(after.distance>before.distance);assert.ok(after.stamina<before.stamina);assert.ok((await page.evaluate(()=>hiking.orientation().camera[1]))>sittingY+.3);checks.push('이동 시 일어나기·Shift 달리기·소모·시점 상승');
  // 일시정지 없음(11-04): 저장 복원에서 paused 확인은 빼고 스테미너 복원만 본다
  await page.reload();await page.waitForFunction(()=>window.hiking?.started,null,{timeout:240000});assert.ok(Math.abs((await snapshot()).stamina-after.stamina)<1);checks.push('새로고침 저장 복원');
 }
 if(id==='third'){
  await page.keyboard.down('Shift');await page.keyboard.down('w');await page.waitForTimeout(1500);await (await waitChunks(page)).screenshot({path:`${out}/interaction-third-run.png`});await page.keyboard.up('w');await page.keyboard.up('Shift');checks.push('3인칭 달리기 화면');
 }
 rows.push({id,s,view,errors,checks,...metrics});writeFileSync(`${out}/interaction-browser.json`,JSON.stringify(rows,null,2));console.log(id,metrics.performance.fps,checks,errors);
 assert.deepEqual(errors,[]);assert.deepEqual(metrics.rendering.shaderErrors,[]);await context.close();
}}finally{await browser.close();}

assert.ok(rows.every(r=>r.performance.fps>=(r.view==='third'?40:45)),'시점별 fps 기준 미달');
