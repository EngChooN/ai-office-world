// 하위 경로 preview에서 휴대폰(세로·가로, 터치) 확인: 로딩, 조이스틱 걷기, 시점 돌리기, 구간 이동 전 지점, 콘솔 오류.
// 11-08 3d02236 통합부터 등산은 /hiking/ 아래(저장소 이름 gwanak-hiking은 11-14에 ai-office-world로 바뀜)라 기본 주소를 4173/hiking/(npm run preview)로 맞췄다.
// 11-18 87babf7 공통 화면 틀부터 구간 이동은 화면 구석 단추가 아니라 ☰ 메뉴 → 설정 탭 → 「구간 이동」(목록은 같은 탭 안 시트)이다.
//  그래서 「단추·목록이 조이스틱·시점 영역과 겹치지 않는가」는 「메뉴 안 단추·목록을 누르면 시점 영역이 아니라 그 단추가 눌리는가」로 본다.
// 로딩 단추는 「출발하기」(data-mode=start)만 누른다. 부하로 로딩이 늦으면 잠깐 「다시 시도」가 떴다 사라져서, 그것을 누르려다 멈추던 일이 있었다.
// 11-04 f0d6512 일시정지 없앰 → 걷기 전 Space로 일시정지를 풀던 줄은 뺐다.
// 사용: npm run preview (다른 터미널) → node scripts/verify-mobile-pages.mjs  (주소 바꾸기: BASE_URL=http://127.0.0.1:5411/hiking/)
import {waitChunks} from './lib/chunk-wait.mjs';
import {chromium,devices} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.BASE_URL??'http://127.0.0.1:4173/hiking/',out=process.env.OUT??'artifacts/mobile-pages';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
// 기다림 시간은 기본 240초. 여러 크롬이 같이 도는 부하 때는 WAIT_MS로 늘린다(기준이 아니라 기다림만 바뀜).
const WAIT=+(process.env.WAIT_MS??240000);
const report={errors:[],failed:[],views:{},fails:[]};
const check=(ok,msg)=>{if(!ok)report.fails.push(msg);console.log(ok?'  통과':'  실패',msg);};
for(const [name,viewport] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
 const context=await browser.newContext({...devices['iPhone 13'],viewport,screen:viewport,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('gwanak-sound-enabled','false'));
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(`${name}: ${e.message}`));page.on('console',m=>{if(m.type()==='error')report.errors.push(`${name}: ${m.text()}`);});
 page.on('response',r=>{if(r.status()>=400)report.failed.push(`${name}: ${r.status()} ${r.url()}`);});
 await page.goto(base+'?quality=low&time=11:00&weather=clear');
 await page.waitForFunction(()=>window.hiking?.started||document.querySelector('#loading-screen .ls-action[data-mode=start]:not([hidden])'),null,{timeout:WAIT});
 if(!await page.evaluate(()=>window.hiking.started)){await (await waitChunks(page)).screenshot({path:`${out}/${name}-loading-ready.png`});await page.tap('#loading-screen .ls-action[data-mode=start]');}
 await page.waitForFunction(()=>window.hiking?.started&&window.hiking?.landscape().ready&&!hiking.rendering().compiling,null,{timeout:WAIT});
 await page.addStyleTag({content:'#resume-note{display:none!important}'});await page.waitForTimeout(1000);
 const r={};const snap=()=>page.evaluate(()=>{const s=hiking.snapshot(),o=hiking.orientation();return {zone:s.zone,s:+s.s.toFixed(2),arrived:s.summitArrived,yaw:+o.cameraHeading.toFixed(3),pos:hiking.position()};});
 // ☰ → 설정 → 구간 이동 열기(목록에서 고르면 메뉴가 닫힌다)
 const openJump=async()=>{await page.tap('.uf-menu-btn');await page.waitForTimeout(250);await page.tap('[data-uf-tab=settings]');await page.waitForTimeout(250);await page.tap('#section-jump .sj-toggle');await page.waitForTimeout(250);};
 // 구간 이동 단추·목록: 화면 안에 있고, 누르면 시점 영역(#look-zone)이 아니라 그 단추가 눌리는가
 await page.tap('.uf-menu-btn');await page.waitForTimeout(250);await page.tap('[data-uf-tab=settings]');await page.waitForTimeout(250);
 const hitInfo=sel=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;e.scrollIntoView({block:'nearest'});const b=e.getBoundingClientRect(),h=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
  return {rect:[b.left,b.top,b.width,b.height].map(Math.round),inViewport:b.width>0&&b.height>0&&b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,tappable:!!h&&(h===e||e.contains(h)),hitLook:!!h?.closest?.('#look-zone,#joystick')};},sel);
 const btn=await hitInfo('#section-jump .sj-toggle');await page.tap('#section-jump .sj-toggle');await page.waitForTimeout(300);
 const list=await page.evaluate(()=>{const l=document.querySelector('#sj-list'),b=l?.getBoundingClientRect();return b?{rect:[b.left,b.top,b.width,b.height].map(Math.round),visible:b.width>0&&b.height>0&&!l.closest('[hidden]')}:null;});
 const items=[];for(const id of await page.evaluate(()=>hiking.jumpTargets()))items.push({id,...await hitInfo(`[data-jump="${id}"]`)});
 await (await waitChunks(page)).screenshot({path:`${out}/${name}-jump-list.png`});
 await page.keyboard.press('Escape');await page.evaluate(()=>window.hikingFrame?.close());await page.waitForTimeout(300);
 r.layout={button:btn,list,items:items.map(i=>({id:i.id,inViewport:i.inViewport,tappable:i.tappable,hitLook:i.hitLook}))};
 check(btn?.inViewport&&btn.tappable&&!btn.hitLook,`${name}: 구간 이동 단추가 화면 안·누르면 단추(시점 영역 아님)`);
 check(list?.visible&&items.every(i=>i.inViewport&&i.tappable&&!i.hitLook),`${name}: 구간 이동 목록 ${items.length}곳 모두 화면 안·눌림`);
 // 조이스틱 걷기(터치 드래그)
 const before=await snap();const vp=page.viewportSize(),cx=vp.width*.25,cy=vp.height*.65; // 조이스틱은 왼쪽 절반을 누른 자리에 생긴다
 const cdp=await context.newCDPSession(page);
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
 await touch('touchStart',cx,cy);await touch('touchMove',cx,cy-40);await page.waitForTimeout(2500);const mid=await snap();await touch('touchEnd');
 r.joystickWalk={before,after:mid,moved:Math.hypot((mid.pos.x-before.pos.x),(mid.pos.z-before.pos.z))>.5};check(r.joystickWalk.moved,`${name}: 조이스틱으로 0.5m 넘게 걷기`);
 // 시점 돌리기(오른쪽 드래그)
 const lb=await page.locator('#look-zone').boundingBox(),lx=lb.x+lb.width*.6,ly=lb.y+lb.height/2;const y0=(await snap()).yaw;
 await touch('touchStart',lx,ly);for(let i=1;i<=10;i++)await touch('touchMove',lx+i*12,ly);await touch('touchEnd');await page.waitForTimeout(400);const y1=(await snap()).yaw;
 r.lookTurn={before:y0,after:y1,turned:Math.abs(y1-y0)>.05};check(r.lookTurn.turned,`${name}: 오른쪽 드래그로 시점 돌리기`);
 // 구간 이동: 목록 버튼을 터치로 눌러 전 지점 확인
 const ids=await page.evaluate(()=>hiking.jumpTargets());r.jumps={};
 for(const id of ids){
  await openJump();await page.tap(`[data-jump="${id}"]`);await page.waitForTimeout(700);
  const a=await snap();r.jumps[id]={...a,dialog:await page.evaluate(()=>!!document.querySelector('dialog[open]')),listClosed:await page.evaluate(()=>!window.hikingFrame?.isOpen&&!!document.querySelector('#sj-list')?.closest('[hidden]'))};
  // 이동한 자리에서 걷기가 되는지(W 키 대신 터치 조이스틱)
  await touch('touchStart',cx,cy);await touch('touchMove',cx,cy-40);await page.waitForTimeout(900);await touch('touchEnd');const b2=await snap();
  r.jumps[id].walked=Math.hypot(b2.pos.x-a.pos.x,b2.pos.z-a.pos.z)>.2;r.jumps[id].zoneAfter=b2.zone;
  const want=id==='plaza'?'plaza':id==='summit'?'summit':'route';
  check(a.zone===want&&!r.jumps[id].dialog&&r.jumps[id].listClosed&&r.jumps[id].walked,`${name}: 구간 이동 ${id} → ${a.zone}(${want}), 메뉴 닫힘 ${r.jumps[id].listClosed}, 걷기 ${r.jumps[id].walked}, 대화창 ${r.jumps[id].dialog}`);
  if(id==='summit'||id==='yeonju-spring')await (await waitChunks(page)).screenshot({path:`${out}/${name}-${id}.png`});
 }
 // 저장 상태: 정상 구역에서 새로고침 → 정상 구역 복원, 도착 화면 안 뜸
 await openJump();await page.tap('[data-jump="summit"]');await page.waitForTimeout(1500);
 await page.reload();await page.waitForFunction(()=>window.hiking?.started||document.querySelector('#loading-screen .ls-action[data-mode=start]:not([hidden])'),null,{timeout:WAIT});
 if(!await page.evaluate(()=>window.hiking.started))await page.tap('#loading-screen .ls-action[data-mode=start]');
 await page.waitForFunction(()=>window.hiking?.started,null,{timeout:WAIT});await page.waitForTimeout(1500);
 r.reload={...await snap(),dialog:await page.evaluate(()=>!!document.querySelector('dialog[open]'))};
 await (await waitChunks(page)).screenshot({path:`${out}/${name}-after-reload.png`});
 check(r.reload.zone==='summit'&&!r.reload.dialog,`${name}: 정상 구역에서 새로고침 → 정상 구역 복원(${r.reload.zone}), 도착 화면 안 뜸`);
 // 메뉴 화면 한 장
 await openJump();await (await waitChunks(page)).screenshot({path:`${out}/${name}-menu.png`});
 report.views[name]=r;await context.close();
}
await browser.close();writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
console.log(JSON.stringify({errors:report.errors,failed:report.failed,views:Object.fromEntries(Object.entries(report.views).map(([k,v])=>[k,{layout:v.layout,joystick:v.joystickWalk.moved,look:v.lookTurn.turned,jumps:Object.fromEntries(Object.entries(v.jumps).map(([id,j])=>[id,`${j.zone}→${j.zoneAfter} s=${j.s} walked=${j.walked} dlg=${j.dialog}`])),reload:v.reload}]))},null,1));
check(!report.errors.length,`콘솔·페이지 오류 없음 ${JSON.stringify(report.errors)}`);check(!report.failed.length,`실패한 요청 없음 ${JSON.stringify(report.failed)}`);
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
console.log(report.fails.length?`실패 ${report.fails.length}건: ${report.fails.join(' / ')}`:'모두 통과');process.exit(report.fails.length?1:0);
