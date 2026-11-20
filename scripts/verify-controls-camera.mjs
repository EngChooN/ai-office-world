// 조작·카메라 점검(11-04 대표 피드백 (5)(9)): 첫 입력부터 걷기, S 뒷걸음은 카메라 방향 유지 + 몸이 카메라 쪽, 지도 창 ESC, H 이벤트.
// 11-04 f0d6512에서 일시정지를 없앴으므로(AGENTS §3) 일시정지 화면·계속하기 단추를 찾던 칸은 「일시정지가 없어야 한다」로 바꿨다.
// 11-18 87babf7 공통 화면 틀부터 지도는 지도 창이 아니라 ☰ 메뉴 「지도」 탭(M 키)이다.
// 사용: BASE_URL=http://127.0.0.1:5411/hiking/ OUT_DIR=… node scripts/verify-controls-camera.mjs [출력 폴더]
import {waitChunks} from './lib/chunk-wait.mjs';
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {initialState} from '../src/movement.js';
const out=process.env.OUT_DIR??process.argv[2]??'artifacts/controls-camera';mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5173/';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();
const errs=[],fails=[];page.on('pageerror',e=>errs.push(e.message));
const check=(ok,msg)=>{if(!ok)fails.push(msg);console.log(ok?'  통과':'  실패',msg);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),near=(a,b,t=.03)=>Math.abs(wrap(a-b))<t;
const snap=()=>page.evaluate(()=>{const s=window.hiking.snapshot(),o=window.hiking.orientation();return {zone:s.zone,view:s.view,s:+s.s.toFixed(3),lat:+s.lateral.toFixed(3),px:s.plaza?.x,pz:s.plaza?.z,hasPaused:'paused' in s,auto:s.auto,cam:+o.cameraHeading.toFixed(4),avatar:+o.avatarHeading.toFixed(4),yaw:+o.yaw.toFixed(4)};});
const go=async(url,seed)=>{await page.goto(url);if(seed!==undefined){await page.evaluate(v=>v?localStorage.setItem('gwanak-hiking:v1',v):localStorage.clear(),seed);await page.reload();}await page.waitForFunction(()=>window.hiking?.started,null,{timeout:300000});await page.waitForTimeout(600);};
const hold=async(k,ms)=>{await page.keyboard.down(k);await page.waitForTimeout(ms);await page.keyboard.up(k);await page.waitForTimeout(300);};
const moved=(a,b)=>a.zone==='plaza'&&b.zone==='plaza'?Math.hypot(b.px-a.px,b.pz-a.pz):Math.hypot(b.s-a.s,b.lat-a.lat);
const B=base+'?outfit=1&time=12:00&weather=clear';
// 1) 처음 시작(저장 없음) → 광장, 첫 W부터 걷는다
await go(B,'');let a=await snap();await hold('w',700);let b=await snap();console.log('처음 시작',a.zone,'→ 이동',moved(a,b).toFixed(3));
check(a.zone==='plaza','처음 시작은 광장');check(moved(a,b)>.3,'처음 시작 W 0.7초에 0.3m 넘게 걷기');
// 2) 이어하기(광장 저장) — 새로고침 뒤 다른 키 없이 바로 W
await page.reload();await page.waitForFunction(()=>window.hiking?.started,null,{timeout:300000});await page.waitForTimeout(600);a=await snap();await hold('w',700);b=await snap();console.log('이어하기(광장) → 이동',moved(a,b).toFixed(3));
check(a.zone==='plaza'&&moved(a,b)>.3,'이어하기(광장) 첫 W부터 걷기');
// 3) 광장 출발 옵션, 첫 입력 D(옆걸음)
await go(B+'&start=entrance');a=await snap();await hold('d',600);b=await snap();console.log('광장 출발 D → 이동',moved(a,b).toFixed(3));
check(a.zone==='plaza'&&moved(a,b)>.2,'광장 출발 첫 D부터 옆걸음');
// 광장 뒷걸음: 3인칭, 카메라 방향 유지·몸이 카메라 방향
await page.keyboard.press('v');await page.waitForTimeout(300);a=await snap();await page.keyboard.down('s');await page.waitForTimeout(400);
await (await waitChunks(page)).screenshot({path:`${out}/plaza-backward-third.png`});
await page.waitForTimeout(600);await page.keyboard.up('s');await page.waitForTimeout(300);b=await snap();
console.log('광장 S 3인칭: cam',a.cam,'→',b.cam,'avatar',b.avatar,'이동',moved(a,b).toFixed(3));
check(moved(a,b)>.2,'광장 S 뒷걸음 이동');check(near(a.cam,b.cam),'광장 S 동안 카메라 방향 그대로');check(near(b.avatar,b.cam),'광장 S 동안 몸이 카메라 쪽(바라본 채 뒷걸음)');
// 4) 이어하기(코스 2500m, 3인칭) → 첫 S부터 뒤로
await go(B,JSON.stringify({...initialState(),s:2500,view:'third'}));a=await snap();await page.keyboard.down('s');await page.waitForTimeout(400);
await (await waitChunks(page)).screenshot({path:`${out}/route-backward-third.png`});await page.waitForTimeout(600);await page.keyboard.up('s');await page.waitForTimeout(300);b=await snap();
console.log('이어하기(코스) S: s',a.s,'→',b.s,'cam',a.cam,'→',b.cam,'yaw',a.yaw,'→',b.yaw,'avatar',b.avatar);
// 코스에서 카메라 기준은 길 방향 + 사용자 각(yaw). 뒷걸음으로 길 굽이를 지나면 길 방향은 따라 돌 수 있으니, 사용자 각이 그대로인지와 몸=카메라를 본다.
check(a.zone==='route'&&b.s<a.s-.3,'이어하기(코스) 첫 S부터 뒤로(s 감소)');check(near(a.yaw,b.yaw),'코스 S 동안 시선 각 그대로(카메라가 뒤로 돌지 않음)');check(near(b.avatar,b.cam),'코스 S 동안 몸이 카메라 쪽');
a=await snap();await hold('w',800);b=await snap();console.log('코스 W: s',a.s,'→',b.s,'avatar',b.avatar,'cam',b.cam);
check(b.s>a.s+.3,'코스 W 앞으로(s 증가)');check(near(b.avatar,b.cam),'코스 W 몸이 카메라 쪽');
// 5) 일시정지 없음(11-04 결정): 일시정지 화면·단추가 없고, ESC·Space를 눌러도 상태에 paused가 없고 W로 그대로 걷는다
await page.keyboard.press('Escape');await page.waitForTimeout(250);await page.keyboard.press('Space');await page.waitForTimeout(250);
const pauseUi=await page.evaluate(()=>({overlay:!!document.getElementById('pause-overlay'),resume:!!document.getElementById('pause-resume'),text:/일시정지|계속하기/.test(document.body.innerText)}));
a=await snap();await hold('w',700);b=await snap();console.log('일시정지 없음: 화면',JSON.stringify(pauseUi),'paused 칸',a.hasPaused,'ESC·Space 뒤 W 이동',(b.s-a.s).toFixed(3));
await (await waitChunks(page)).screenshot({path:`${out}/no-pause-after-esc-space.png`});
check(!pauseUi.overlay&&!pauseUi.resume&&!pauseUi.text,'일시정지 화면·계속하기 단추 없음');check(!a.hasPaused,'상태에 paused 없음');check(b.s>a.s+.3,'ESC·Space 뒤에도 W로 바로 걷기');
// 6) 지도(☰ 메뉴 「지도」 탭, M 키)가 열린 동안 ESC는 창만 닫는다
await page.keyboard.press('m');await page.waitForTimeout(300);const mapOpen=await page.evaluate(()=>({open:!!window.hikingFrame?.isOpen,tab:window.hikingFrame?.tab}));
await (await waitChunks(page)).screenshot({path:`${out}/map-tab.png`});
a=await snap();await page.keyboard.press('Escape');await page.waitForTimeout(300);b=await snap();const closed=await page.evaluate(()=>!window.hikingFrame?.isOpen&&!document.querySelector('.uf-sheet:not([hidden])'));
console.log('M 지도',JSON.stringify(mapOpen),'→ ESC 창 닫힘',closed);
check(mapOpen.open&&mapOpen.tab==='map','M으로 ☰ 지도 탭 열림');check(closed,'지도 열고 ESC: 창 닫힘');check(b.zone===a.zone&&b.s===a.s&&b.view===a.view,'ESC가 창만 닫고 다른 상태는 그대로');
// 7) H → 'hiking:hud-toggle' 이벤트 한 번
await page.evaluate(()=>window.addEventListener('hiking:hud-toggle',()=>window.__hud=(window.__hud||0)+1));await page.keyboard.press('h');await page.waitForTimeout(200);const hud=await page.evaluate(()=>window.__hud);console.log('H 이벤트',hud);
check(hud===1,'H 이벤트 한 번');await page.keyboard.press('h');
console.log('errors',errs);check(!errs.length,'페이지 오류 없음');
await browser.close();
console.log(fails.length?`실패 ${fails.length}건: ${fails.join(' / ')}`:'모두 통과');process.exit(fails.length?1:0);
