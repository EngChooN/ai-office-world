// HUD 가리기 점검(11-04 대표 피드백): H·「화면 숨기기」 단추로 숨기고 되돌리기, 새로고침해도 유지, 터치는 「화면 보이기」 단추로 복귀.
// 11-04 f0d6512에서 일시정지를 없앴으므로(AGENTS §3) 「숨김 중에도 일시정지 표시가 보인다」 칸은 「일시정지 화면이 없고 숨긴 채로 바로 걷는다」로 바꿨다.
// 11-18 87babf7 공통 화면 틀부터 「화면 숨기기」(#hud-hide)는 ☰ 메뉴 「설정」 탭 안에 있고, 진행 표시(옛 header)는 위 왼쪽 알약(.hk-topl)·☰ 단추 줄(.uf-tr)로 #app 밖에 있다.
// 사용: BASE_URL=http://127.0.0.1:5411/hiking/ node scripts/verify-hud-toggle.mjs [출력 폴더]
import {waitChunks} from './lib/chunk-wait.mjs';
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const out=process.env.OUT??process.argv[2]??'artifacts/hud-toggle';mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5173/';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();
const errs=[],fails=[];page.on('pageerror',e=>errs.push(e.message));
const check=(ok,msg)=>{if(!ok)fails.push(msg);console.log(ok?'  통과':'  실패',msg);};
const B=base+'?outfit=1&time=12:00&weather=clear';
// 숨겨야 할 HUD: 진행 알약·시점 칩(.hk-topl), ☰·💬 줄(.uf-tr), 도장·작은 단추(#auto·#run), 할 일 칩(간식 먹기 #choco)
const HUD=['.hk-topl','.uf-tr','#auto','#run','#choco'];
const st=p=>p.evaluate(HUD=>{
 const shown=e=>{if(!e)return false;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden';};
 const restore=document.querySelector('.hud-restore'),rr=restore?.getBoundingClientRect(),hit=rr&&rr.width?document.elementFromPoint(rr.left+rr.width/2,rr.top+rr.height/2):null;
 return {hidden:document.getElementById('app').classList.contains('hud-hidden'),saved:localStorage.getItem('gwanak-hud-hidden'),pressed:document.getElementById('hud-hide')?.getAttribute('aria-pressed'),
  hudShown:Object.fromEntries(HUD.map(s=>[s,shown(document.querySelector(s))])),restore:restore?.dataset.on,restoreShown:shown(restore),restoreTappable:!!hit&&restore.contains(hit),
  pauseUi:!!document.getElementById('pause-overlay')||!!document.getElementById('pause-resume')||/일시정지|계속하기/.test(document.body.innerText)};
},HUD);
const allHud=(s,on)=>Object.entries(s.hudShown).filter(([k])=>k!=='#choco'||on===false).every(([,v])=>v===on); // 간식 칩은 상황에 따라 없을 수 있으니 「숨김 때 안 보임」만 본다
const started=async p=>{await p.waitForFunction(()=>window.hiking?.started,null,{timeout:300000});await p.waitForTimeout(800);};
await page.goto(B);await page.evaluate(()=>localStorage.clear());await page.reload();await started(page);
let s=await st(page);await (await waitChunks(page)).screenshot({path:`${out}/1-hud-shown.png`});console.log('초기',JSON.stringify(s));
check(!s.hidden&&allHud(s,true)&&s.restore!=='true','처음엔 HUD 보이고 복귀 단추 없음');
await page.keyboard.press('h');await page.waitForTimeout(300);s=await st(page);console.log('H 1회',JSON.stringify(s));
await (await waitChunks(page)).screenshot({path:`${out}/2-hud-hidden.png`});
check(s.hidden&&s.saved==='true'&&s.pressed==='true','H 1회: 숨김·저장·단추 눌림 표시');
check(allHud(s,false),`H 1회: HUD(알약·☰·행동 단추·할 일 칩) 모두 안 보임 ${JSON.stringify(s.hudShown)}`);
check(s.restore==='true'&&s.restoreShown&&s.restoreTappable,'H 1회: 「화면 보이기」 단추 보이고 가려지지 않음');
await page.keyboard.press('h');await page.waitForTimeout(300);s=await st(page);console.log('H 2회',JSON.stringify(s));
check(!s.hidden&&s.saved==='false'&&s.pressed==='false'&&allHud(s,true),'H 2회: 다시 보임');
// 「화면 숨기기」 단추: ☰ 메뉴 → 설정 탭 → #hud-hide. 누르면 메뉴가 닫히고 숨겨진다
await page.click('.uf-menu-btn');await page.click('[data-uf-tab=settings]');await page.waitForTimeout(300);
await page.screenshot({path:`${out}/2b-menu-settings.png`});
await page.click('#hud-hide');await page.waitForTimeout(300);s=await st(page);const menuOpen=await page.evaluate(()=>!!window.hikingFrame?.isOpen);console.log('☰ 설정 「화면 숨기기」 클릭',JSON.stringify(s),'메뉴 열림',menuOpen);
check(s.hidden&&s.saved==='true'&&!menuOpen,'☰ 설정 「화면 숨기기」: 숨김·메뉴 닫힘');
await page.reload();await started(page);s=await st(page);console.log('새로고침',JSON.stringify(s));
check(s.hidden&&s.restore==='true'&&allHud(s,false),'새로고침해도 숨김 유지');
// 일시정지 없음: 숨긴 채 이어하기도 일시정지 화면 없이 W로 바로 걷고, ESC는 숨김을 바꾸지 않는다
const pos=()=>page.evaluate(()=>hiking.position());let a=await pos();await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');await page.waitForTimeout(200);let b=await pos();
const moved=Math.hypot(b.x-a.x,b.z-a.z);console.log('숨김+이어하기: 일시정지 화면',s.pauseUi,'W 이동',moved.toFixed(3));
await (await waitChunks(page)).screenshot({path:`${out}/3-hidden-resumed.png`});
check(!s.pauseUi&&moved>.3,'숨김+이어하기: 일시정지 화면 없이 W로 바로 걷기');
await page.keyboard.press('Escape');await page.waitForTimeout(300);s=await st(page);console.log('ESC',JSON.stringify(s));
check(s.hidden&&!s.pauseUi,'ESC: 일시정지 화면 안 뜨고 숨김 그대로');
await page.keyboard.press('h');await page.waitForTimeout(300);s=await st(page);console.log('H 복귀',JSON.stringify(s));
check(!s.hidden&&allHud(s,true),'H 복귀');
// 터치: 숨김 상태에서 「화면 보이기」 복귀 단추
const m=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const mp=await m.newPage();mp.on('pageerror',e=>errs.push(e.message));
await mp.goto(B);await mp.evaluate(()=>{localStorage.clear();localStorage.setItem('gwanak-hud-hidden','true');});await mp.reload();await started(mp);
s=await st(mp);console.log('터치 숨김',JSON.stringify(s));await (await waitChunks(mp)).screenshot({path:`${out}/4-touch-hidden.png`});
check(s.restoreShown&&s.restoreTappable,'터치: 복귀 단추 보이고 가려지지 않음');check(allHud(s,false),`터치 숨김: HUD 안 보임 ${JSON.stringify(s.hudShown)}`);
await mp.locator('.hud-restore').tap();await mp.waitForTimeout(300);s=await st(mp);console.log('터치 탭 후',JSON.stringify(s));
check(!s.hidden&&s.saved==='false','터치: 복귀 단추로 다시 보임');
console.log('errors',JSON.stringify(errs));check(!errs.length,'페이지 오류 없음');await browser.close();
console.log(fails.length?`실패 ${fails.length}건: ${fails.join(' / ')}`:'모두 통과');process.exit(fails.length?1:0);
