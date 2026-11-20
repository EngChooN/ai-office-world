import {waitChunks} from './lib/chunk-wait.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {initialState,SAVE_KEY} from '../src/movement.js';
const dir=process.env.OUT??'artifacts/rest-integration',base=process.env.BASE_URL??'http://127.0.0.1:5177/hiking/';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const errors=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(({state,key})=>{if(!sessionStorage.getItem('rest-seed')){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('rest-seed','1');}localStorage.setItem('gwanak-sound-enabled','false');},{state:{...initialState(),s:1800,stamina:15},key:SAVE_KEY});
 await context.route('**/@vite/client',r=>r.fulfill({body:`export const createHotContext=()=>({accept(){},dispose(){},prune(){},on(){},invalidate(){},data:{}});export const updateStyle=(id,css)=>{let e=document.getElementById(id);if(!e){e=document.createElement('style');e.id=id;document.head.append(e);}e.textContent=css;};export const removeStyle=id=>document.getElementById(id)?.remove();export const injectQuery=url=>url;export class ErrorOverlay extends HTMLElement {}`,contentType:'application/javascript'}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?quality=balanced');
 const ready=()=>page.waitForFunction(()=>window.hiking?.started&&window.hiking?.landscape().natureReady&&!hiking.rendering().compiling,null,{timeout:240000});
 await ready();console.log('앱 준비');
 const snapshot=()=>page.evaluate(()=>({state:hiking.snapshot(),interaction:__hiker.interaction,eye:__hiker.eyeHeight,camera:hiking.orientation().camera,ground:hiking.coordinates().y}));
 // 눈높이 기준: 주인공이 카툰 동동이(1.0m) 한 가지가 되며(11-06, 실사 코드는 11-19 삭제) 서기·앉기 눈높이는 모델에서 잰 값(link-hiker.js hikerProfile.eyeHeight)이다. 예전 1.6/0.85m는 실사 등산객 값.
 const EYE=await page.evaluate(()=>__hiker.profile.eyeHeight);assert.ok(EYE.stand>EYE.sit&&EYE.sit>0,JSON.stringify(EYE));
 const near=(a,b)=>Math.abs(a-b)<1e-6;
 // 일시정지는 없앴다(AGENTS §3 「일시정지 개념이 없습니다」): 예전 Space 일시정지·일시정지 중 차 멈춤 확인은 뺐다.
 // 11-18 공통 화면 틀(87babf7)부터 휴식 패널(#rest-controls)은 없고, 앉기·차 마시기 단추는 ☰ 메뉴 「쉬기」 탭(#nb-sheet-rest)에 있다.
 const openRest=async()=>{if(!(await page.locator('.uf-sheet').isVisible()))await page.click('.uf-menu-btn');await page.click('[data-uf-tab="rest"]');await page.locator('#nb-sheet-rest').waitFor({state:'visible',timeout:5000});};
 const closeMenu=async()=>{if(await page.locator('.uf-sheet').isVisible())await page.click('.uf-sheet .uf-x');};
 const failures=[];const check=(name,ok,info)=>{if(ok)checks.push(name);else{failures.push({name,info});console.log('실패',name,JSON.stringify(info??''));}return !!ok;};
 // 실제 키 입력: 앉기 완료 전 차 시작은 거절한다.
 await page.keyboard.press('c');await page.keyboard.press('t');assert.equal((await snapshot()).state.pose,'sit');
 await page.waitForTimeout(350);const half=await snapshot();assert.ok(half.eye>EYE.sit&&half.eye<EYE.stand,JSON.stringify({half:half.eye,EYE}));await page.waitForTimeout(700);
 const seated=await snapshot();assert.ok(near(seated.eye,EYE.sit),JSON.stringify({eye:seated.eye,EYE}));assert.ok(Math.abs(seated.camera[1]-seated.ground-EYE.sit)<.015);checks.push('C 0.8초 전환·중간 눈높이·T 조기 시작 방지');
 await openRest();await page.locator('#nb-sheet-rest [data-proxy="tea"]').click();await page.waitForTimeout(1000);let tea=await snapshot();
 if(!check('☰ 쉬기 「차 마시기」 단추로 차 시작',tea.state.pose==='tea'&&tea.interaction.drink>0,{pose:tea.state.pose,drink:tea.interaction.drink})){
  await closeMenu();await page.keyboard.press('t');await page.waitForTimeout(1000);tea=await snapshot();} // 단추가 안 되면 T 키로 이어서 나머지를 본다(실패는 그대로 남김)
 await closeMenu();
 assert.equal(tea.state.pose,'tea');assert.ok(tea.interaction.drink>0);
 const beforeReload=await snapshot();
 // 일시정지가 없어 새로고침(로딩) 동안에도 차 시간이 흐른다. 그래서 예전 「남은 시간 그대로·drink>0」(drink는 고개 젖힘 가중치라 뒷단계에선 0) 대신
 // 「남은 시간이 이어지고(늘지 않음) 컵 동작 진행률이 저장된 남은 시간과 맞는지(처음부터 다시 하지 않음)」를 본다.
 await page.reload();await ready();const restored=await snapshot();
 check('차 중 저장 복원·앉은 높이·컵 진행 유지',restored.state.pose==='tea'&&near(restored.eye,EYE.sit)&&restored.state.teaRemaining>0&&restored.state.teaRemaining<=beforeReload.state.teaRemaining+.01&&Math.abs(restored.interaction.teaProgress-(1-restored.state.teaRemaining/3))<.05,{pose:restored.state.pose,eye:restored.eye,before:beforeReload.state.teaRemaining,after:restored.state.teaRemaining,teaProgress:restored.interaction.teaProgress});
 await page.waitForTimeout(3400);assert.equal((await snapshot()).state.pose,'sit');assert.ok((await snapshot()).state.stamina>85);checks.push('차 완료 후 앉기·회복');
 await (await waitChunks(page)).screenshot({path:`${dir}/first-seated.png`});
 await openRest();await page.locator('#nb-sheet-rest [data-proxy="sit"]').click();await page.waitForTimeout(1000);
 if(!check('☰ 쉬기 「일어나기」 단추로 일어나기',near((await snapshot()).eye,EYE.stand)&&(await snapshot()).state.pose==='stand',{pose:(await snapshot()).state.pose,eye:(await snapshot()).eye})){
  await closeMenu();await page.keyboard.press('c');await page.waitForTimeout(1000);}
 await closeMenu();assert.ok(near((await snapshot()).eye,EYE.stand));
 // 청크 대기는 T 앞에서(차 3초 중에 오래 기다리면 차가 끝나 버림), 컵을 입에 댄 순간(drink>.9)을 기다려 찍는다.
 await page.keyboard.press('v');await page.keyboard.press('c');await page.waitForTimeout(1000);await waitChunks(page);await page.keyboard.press('t');await page.waitForTimeout(1250);
 await page.waitForFunction(()=>__hiker.interaction.drink>.9,null,{timeout:2000}).catch(()=>{});const third=await snapshot();await page.screenshot({path:`${dir}/third-tea.png`});check('3인칭 실제 T 컵 동작',third.state.pose==='tea'&&third.interaction.drink>.9,{pose:third.state.pose,drink:third.interaction.drink,tea:third.state.teaRemaining});
 await page.keyboard.down('w');await page.waitForTimeout(1000);await page.keyboard.up('w');assert.equal((await snapshot()).state.pose,'stand');assert.equal((await snapshot()).state.teaRemaining,0);assert.ok(near((await snapshot()).eye,EYE.stand));checks.push('이동으로 차 취소·일어나기');
 await page.evaluate(()=>__hikingPerformance.reset());await page.waitForTimeout(5000);const performance=await page.evaluate(()=>__hikingPerformance.report());check('fps 40 이상',performance.fps>=40,{fps:performance.fps});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await openRest();await page.waitForTimeout(400);
 const bounds=await page.locator('#nb-sheet-rest').boundingBox();check('모바일 휴식 패널(☰ 쉬기) 화면 내 배치',bounds.x>=0&&bounds.x+bounds.width<=390&&bounds.y>=0&&bounds.y+bounds.height<=844,bounds);
 await page.screenshot({path:`${dir}/mobile-rest-sheet.png`});
 writeFileSync(`${dir}/results.json`,JSON.stringify({checks,failures,errors,EYE,performance,half,seated,tea,beforeReload,restored,third},null,2));console.log(JSON.stringify({checks,failures,errors,fps:performance.fps}));
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
}finally{await browser.close();}
