// 인형 들기·업기·빛(11-25, 시안 v2: 인형가게 안에서만) 점검. vite·함께 걷기 서버(새 코드 + 옛 코드)를 스스로 띄움.
//  인형가게 × 휴대폰 세로 390×844·가로 844×390·PC 1920×1080:
//   🧸 도감 맨 위 손·등 칸(창 안·손가락 크기) → 자세히 화면 「손에 들기」 → 0.3초 뒤 창 닫힘 + 위 알림(되돌리기, 위 단추·행동 단추와 안 겹침) →
//   몸 손에 인형 + 금빛 → 「되돌리기」로 원래대로 → 다시 들기 → 큰 인형 「등에 업기」(머리 아래) → 도감에 초록 「손에 듦」 → 성공 카드 「손에 들고 다니기」(바꿔 듦) →
//   다른 콘텐츠로 갔다 와도 그대로 → 칸 「내려놓기». 뽑는 동안(판 시작) 손·등 숨김.
//  다른 콘텐츠(등산·흡연장·크리스마스): 「내 인형」 없음, ☰ 맨 위 친구 부르기 한 줄, 인형 그림 없음.
//  같은 가게: 같은 서버 손님 화면에 손·등 인형·빛, 2서버 손님에게는 안 보임. 옛 서버(ch·cb 모름) + 새 화면: 오류 없이 서로 보이고 인형만 안 감.
//  node scripts/verify-carry.mjs  (SIZES=portrait,landscape,pc  PART=claw,others,multi,old) → artifacts/carry-impl/*.png + report.json
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {execSync} from 'node:child_process';
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const OUT=process.env.OUT_DIR||ROOT+'/artifacts/carry-impl';mkdirSync(OUT,{recursive:true});
const req=createRequire(ROOT+'/package.json');
const pw=await import(req.resolve('@playwright/test'));const chromium=pw.chromium??pw.default.chromium;
const {createServer}=await import(req.resolve('vite'));
const {startServer}=await import(ROOT+'/server/multi-server.mjs');
const VP=+(process.env.VITE_PORT||5398),WP=+(process.env.WS_PORT||8898),OP=WP+1;
const vite=await createServer({root:ROOT,configFile:ROOT+'/vite.config.js',cacheDir:'/tmp/carry-v/.vite',server:{port:VP,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const srv=startServer({PORT:String(WP),HOST:'127.0.0.1',DATA_DIR:'/tmp/carry-v/data'},{quiet:true});await srv.ready;
const base=`http://127.0.0.1:${VP}`,wsOf=p=>encodeURIComponent('ws://127.0.0.1:'+p);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SIZES={portrait:[390,844,true],landscape:[844,390,true],pc:[1920,1080,false]};
const SZ=(process.env.SIZES??'portrait,landscape,pc').split(','),PARTS=(process.env.PART??'claw,others,multi,old').split(',');
const report={at:new Date().toISOString(),checks:[],errors:[]};let fails=0;
const ok=(name,pass,detail='')=>{report.checks.push({name,pass:!!pass,detail});if(!pass){fails++;console.log('✖',name,detail);}else console.log('✓',name,typeof detail==='string'?detail:'');};
const DEX={squirrel:{n:2,first:'2026-11-24',machine:'claw-1'},'box-cat':{n:1,first:'2026-11-24',machine:'bridge-2'},'dongdong-office':{n:1,first:'2026-11-24',machine:'claw-5'},
 'dongdong-santa':{n:1,first:'2026-11-25',machine:'key-1'},'big-haechi':{n:1,first:'2026-11-25',machine:'timer-3'}};
const clawSave=JSON.stringify({coins:30,lastGrant:'2099-01-01',coinV:3,plays:9,wins:5,dex:DEX,pity:{},seen:Object.fromEntries(['claw-1','claw-2','claw-3','claw-4','claw-5','claw-6','bridge-1','bridge-2','bridge-3','bridge-4','timer-1','timer-2','timer-3','key-1','key-2','key-3'].map(k=>[k,true])),log:[],seenTip:true,mach:{}});
const clawReady=()=>window.claw&&window.claw.fps>0;
async function openClaw(size,{room='인형가게-1',nick='a',port=WP,withDex=true,carry=null}={}){
 const [w,h,touch]=SIZES[size];const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(`if(!sessionStorage.getItem('__k')){localStorage.clear();${withDex?`localStorage.setItem('claw-world:v1',${JSON.stringify(clawSave)});`:''}${carry?`localStorage.setItem('aoworld:carry:v1',${JSON.stringify(JSON.stringify(carry))});`:''}sessionStorage.setItem('__k','1');}`);
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.goto(`${base}/claw/?multi=${encodeURIComponent(room)}&server=${wsOf(port)}&name=${nick}`);await p.waitForFunction(clawReady,null,{timeout:180000});
 await p.waitForFunction(()=>window.claw.multi?.state==='online',null,{timeout:30000}).catch(()=>{});await sl(1500);
 return {ctx,p,touch};
}
const rect=(p,sel)=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>!x.hidden&&!x.closest('[hidden]')&&x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,r:r.right,b:r.bottom,W:innerWidth,H:innerHeight};},sel);
const hits=(p,sel,others)=>p.evaluate(([s,o])=>{const a=[...document.querySelectorAll(s)].find(x=>!x.hidden&&!x.closest('[hidden]'))?.getBoundingClientRect();if(!a)return ['(없음)'];
 const bad=[];for(const e of document.querySelectorAll(o)){if(e.hidden||e.closest('[hidden]'))continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.05)continue;const b=e.getBoundingClientRect();if(!b.width||!b.height)continue;
  if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)bad.push((e.className||e.tagName)+'');}return bad;},[sel,others]);
const carries=p=>p.evaluate(()=>window.__carry?.list()??null);
const mine=L=>(L??[]).find(c=>c.name==='avatar-me');
async function tap(o,sel){await o.p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>!x.hidden&&!x.closest('[hidden]'));e?.scrollIntoView({block:'center'});},sel);await sl(150);const r=await rect(o.p,sel);if(!r)return false;if(o.touch)await o.p.touchscreen.tap(r.x+r.w/2,r.y+r.h/2);else await o.p.mouse.click(r.x+r.w/2,r.y+r.h/2);return true;}
const stored=p=>p.evaluate(()=>localStorage.getItem('aoworld:carry:v1'));
const openDex=async o=>{await tap(o,'[data-uf-btn="dex"]');await sl(600);};
const TOP='.uf-tr button,.uf-pill,.kh-pill,[data-uf],.kh-acts button,.kh-tnum';

async function clawSize(size){
 const tag=`[인형가게 ${size}]`,o=await openClaw(size),{p}=o;
 try{
  // ① 도감 맨 위 손·등 칸
  await openDex(o);
  const sheet=await rect(p,'.uf-sheet'),slots=await p.evaluate(()=>[...document.querySelectorAll('.kh-slot')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,r:r.right,b:r.bottom,w:r.width,h:r.height};}));
  ok(`${tag} 🧸 도감 맨 위 손·등 두 칸(창 안)`,slots.length===2&&!!sheet&&slots.every(s=>s.x>=sheet.x-1&&s.r<=sheet.r+1&&s.h>=48),JSON.stringify({sheet,slots}));
  ok(`${tag} ☰ 「내 인형」 없음`,!(await p.$('.uf-carry-btn'))&&!(await p.$('.uf-top2')));
  await p.screenshot({path:`${OUT}/claw-${size}-1-dex.png`});
  // ② 자세히 → 손에 들기
  await tap(o,'.kh-cell[data-id="dongdong-santa"]');await sl(500);
  const btn=await rect(p,'.kh-carry');ok(`${tag} 자세히 화면 「손에 들기」 단추(44px+·화면 안)`,!!btn&&btn.h>=44&&btn.r<=btn.W&&btn.b<=btn.H,JSON.stringify(btn));
  ok(`${tag} 단추 글`,(await p.evaluate(()=>document.querySelector('.kh-carry')?.textContent))?.includes('손에 들기'));
  await p.screenshot({path:`${OUT}/claw-${size}-2-detail.png`});
  await tap(o,'.kh-carry');await sl(700);
  ok(`${tag} 0.3초 뒤 창 닫힘`,!(await rect(p,'.uf-sheet')));
  const t=await p.evaluate(()=>document.querySelector('.kh-toast:not([hidden])')?.textContent??'');ok(`${tag} 알림 「산타 동동이를 손에 들었어요 · 되돌리기」`,t.includes('산타 동동이를 손에 들었어요')&&t.includes('되돌리기'),t);
  const over=await hits(p,'.kh-toast',TOP);ok(`${tag} 알림이 위 단추·행동 단추와 안 겹침`,over.length===0,over.join());
  const tr=await rect(p,'.kh-toast');ok(`${tag} 알림 화면 안`,!!tr&&tr.x>=0&&tr.r<=tr.W);
  await sl(400);let me=mine(await carries(p));
  ok(`${tag} 몸 손에 산타 동동이 + 금빛`,me?.hand==='dongdong-santa'&&me.shown.hand&&me.glow.hand,JSON.stringify(me));
  // ③ 되돌리기
  await tap(o,'.kh-toast [data-undo]');await sl(500);
  ok(`${tag} 「되돌리기」 → 빈손`,(await stored(p))==='{"hand":null,"back":null}');
  // 다시 들기 + 큰 인형 업기
  await openDex(o);await tap(o,'.kh-cell[data-id="dongdong-santa"]');await sl(400);await tap(o,'.kh-carry');await sl(800);
  await openDex(o);await tap(o,'.kh-cell[data-id="big-haechi"]');await sl(400);
  ok(`${tag} 큰 인형은 「등에 업기」`,(await p.evaluate(()=>document.querySelector('.kh-carry')?.textContent))?.includes('등에 업기'));
  await tap(o,'.kh-carry');await sl(900);
  me=mine(await carries(p));ok(`${tag} 등에 큰 해치 + 손 그대로`,me?.back==='big-haechi'&&me.hand==='dongdong-santa'&&me.shown.back&&me.glow.back,JSON.stringify(me));
  if(me?.boxes?.back&&me.head)ok(`${tag} 업은 인형이 머리 아래(머리뼈 + 0.15m 안)`,me.boxes.back.max[1]<me.head[1]+.15,`인형 위 ${me.boxes.back.max[1]} · 머리뼈 ${me.head[1]}`);
  await p.evaluate(()=>{const t=document.querySelector('.kh-toast');if(t)t.hidden=true;});await sl(300);
  await p.screenshot({path:`${OUT}/claw-${size}-3-carry.png`});
  // ④ 도감에 초록 표시 + 칸
  await openDex(o);
  const held=await p.evaluate(()=>[...document.querySelectorAll('.kh-cell.held')].map(e=>e.dataset.id).sort().join());
  ok(`${tag} 도감에 든 인형 초록 표시`,held==='big-haechi,dongdong-santa',held);
  const drops=await p.evaluate(()=>[...document.querySelectorAll('.kh-cdrop')].map(e=>{const r=e.getBoundingClientRect();return [r.width|0,r.height|0,r.right|0];}));
  ok(`${tag} 칸 「내려놓기」 2개(44px+·화면 안)`,drops.length===2&&drops.every(([w,h,r])=>h>=44&&r<=SIZES[size][0]),JSON.stringify(drops));
  await p.screenshot({path:`${OUT}/claw-${size}-4-dex-held.png`});
  await tap(o,'.uf-x');await sl(400);
  // ⑤ 성공 카드 「손에 들고 다니기」(상자 피규어 → 손을 바꿔 듦)
  await p.evaluate(()=>window.claw.hud.showResult({res:{kind:'win',id:'box-cat'},machine:7,kind:'bridge',isNew:false,count:1,fails:0,coins:20}));await sl(500);
  const cb=await rect(p,'.kh-card .kh-carry');const note=await p.evaluate(()=>document.querySelector('.kh-carry-note')?.textContent??'');
  ok(`${tag} 성공 카드 맨 위 「손에 들고 다니기」 + 바꿔 듦 안내`,!!cb&&cb.h>=44&&cb.b<=cb.H&&note.includes('산타 동동이'),JSON.stringify({cb,note}));
  await p.screenshot({path:`${OUT}/claw-${size}-5-card.png`});
  await tap(o,'.kh-card .kh-carry');await sl(800);
  ok(`${tag} 성공 카드에서 들기 → 손 = 상자 고양이, 카드 닫힘`,(await stored(p))==='{"hand":"box-cat","back":"big-haechi"}'&&!(await rect(p,'.kh-card')));
  // ⑥ 뽑는 동안 숨김: 타이머 1 앞에서 「한 판」(E) → 판 중 손·등 숨김 → 그만두기 → 다시 보임
  await p.evaluate(()=>{window.claw.setCoins(20);window.claw.goMachine(10);});await sl(900);await p.keyboard.press('KeyE');await sl(900);
  const mode=await p.evaluate(()=>window.claw.status().mode);me=mine(await carries(p));
  ok(`${tag} 뽑는 동안 손·등 숨김`,mode!=='idle'&&me&&!me.shown.hand&&!me.shown.back,JSON.stringify({mode,shown:me?.shown}));
  await p.keyboard.press('Escape');await sl(400);await tap(o,'.kh-card [data-c="quit"]');await sl(1500);
  me=mine(await carries(p));ok(`${tag} 판이 끝나면 다시 보임`,(await p.evaluate(()=>window.claw.status().mode))==='idle'&&me?.shown.hand&&me?.shown.back,JSON.stringify(me?.shown));
  // ⑦ 가게를 나갔다 와도 그대로 + 다른 콘텐츠에는 없음
  await p.goto(`${base}/smoking/?capture=1&time=day`);await p.waitForFunction(()=>!!window.lounge,null,{timeout:180000});await sl(1500);
  ok(`${tag} 흡연장에는 인형·「내 인형」 없음`,(await carries(p))===null&&!(await p.$('.uf-carry-btn')));
  await p.goto(`${base}/claw/?multi=${encodeURIComponent('인형가게-1')}&server=${wsOf(WP)}&name=a`);await p.waitForFunction(clawReady,null,{timeout:180000});await sl(2500);
  me=mine(await carries(p));ok(`${tag} 가게에 다시 오면 그대로`,me?.hand==='box-cat'&&me?.back==='big-haechi'&&me.shown.hand,JSON.stringify(me&&{h:me.hand,b:me.back}));
  // ⑧ 칸에서 내려놓기
  await openDex(o);await tap(o,'.kh-cdrop[data-drop="back"]');await sl(300);await tap(o,'.kh-cdrop[data-drop="hand"]');await sl(400);
  ok(`${tag} 칸 내려놓기`,(await stored(p))==='{"hand":null,"back":null}',JSON.stringify({st:await stored(p),sheet:await rect(p,'.uf-sheet'),drops:await p.evaluate(()=>document.querySelectorAll('.kh-cdrop').length)}));
  if(fails)await p.screenshot({path:`${OUT}/claw-${size}-dropfail.png`});
  me=mine(await carries(p));ok(`${tag} 몸도 빈손`,!me?.hand&&!me?.back);
  ok(`${tag} 페이지 오류 0`,p.errs.length===0,p.errs.join(' | '));
 }catch(e){ok(`${tag} 실행`,false,String(e?.stack??e));try{await p.screenshot({path:`${OUT}/claw-${size}-error.png`});}catch{}}
 finally{await o.ctx.close();}
}
// 다른 콘텐츠: 「내 인형」 없음·☰ 맨 위 원래 모양·인형 그림 없음(든 인형 저장이 있어도)
async function others(){
 const U={hiking:`/hiking/?start=entrance&time=13:00&weather=clear&quality=low`,smoking:`/smoking/?capture=1&time=day`,christmas:`/christmas/?capture=1`};
 const R={hiking:()=>window.hiking?.started,smoking:()=>!!window.lounge,christmas:()=>!!window.xmas};
 for(const [name,url] of Object.entries(U))for(const size of ['portrait','pc']){
  const [w,h,touch]=SIZES[size];const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
  await ctx.addInitScript(`localStorage.setItem('claw-world:v1',${JSON.stringify(clawSave)});localStorage.setItem('aoworld:carry:v1','{"hand":"dongdong-santa","back":"big-haechi"}');localStorage.setItem('gwanak-sound-enabled','false');localStorage.setItem('online-smoking',JSON.stringify({nickname:'동동',status:'quit',outfit:'shirt',seenIntro:true,muted:true,quitDate:'2026-11-01'}));localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));`);
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));const tag=`[${name} ${size}]`;
  try{await p.goto(base+url);await p.waitForFunction(R[name],null,{timeout:180000});await sl(1500);
   await p.evaluate(()=>document.querySelector('.uf-menu-btn')?.click());await sl(500);
   const inv=await rect(p,'.uf-invite'),sh=await rect(p,'.uf-sheet');
   ok(`${tag} ☰ 맨 위 친구 부르기 한 줄(원래 모양)·「내 인형」 없음`,!(await p.$('.uf-carry-btn'))&&!!inv&&!!sh&&inv.w>sh.w*.7,JSON.stringify({inv,sh}));
   ok(`${tag} 인형 그림 없음`,(await carries(p))===null&&(await p.evaluate(()=>!document.querySelector('canvas')||true)));
   ok(`${tag} 페이지 오류 0`,p.errs.length===0,p.errs.join(' | '));
  }catch(e){ok(`${tag} 실행`,false,String(e?.stack??e));}finally{await ctx.close();}
 }
}
async function waitRemote(p,pred,sec=25){for(let i=0;i<sec;i++){const L=(await carries(p))??[];const f=L.find(c=>c.name!=='avatar-me'&&pred(c));if(f)return f;await sl(1000);}return null;}
// 같은 가게: 같은 서버 손님 화면, 2서버는 안 보임
async function multi(){
 const tag='[인형가게 함께]';const A=await openClaw('pc',{nick:'carrya',carry:{hand:'dongdong-office',back:'big-haechi'}});
 try{
  const B=await openClaw('portrait',{nick:'carryb',withDex:false}),C=await openClaw('pc',{room:'인형가게-2',nick:'carryc',withDex:false});
  try{
   const f=await waitRemote(B.p,c=>c.hand==='dongdong-office');
   ok(`${tag} 같은 서버 손님 화면에 손·등 인형 + 빛`,f?.hand==='dongdong-office'&&f?.back==='big-haechi'&&f.glow.hand&&f.glow.back,JSON.stringify(f));
   await B.p.screenshot({path:`${OUT}/claw-multi-other.png`});
   const g=await waitRemote(C.p,c=>!!(c.hand||c.back),6);ok(`${tag} 2서버 손님에게는 안 보임`,!g,JSON.stringify(g));
   await A.p.evaluate(()=>window.claw.hud.frame.open('dex'));await sl(400);await A.p.evaluate(()=>document.querySelector('.kh-cdrop[data-drop="back"]')?.click());
   const h=await waitRemote(B.p,c=>c.hand==='dongdong-office'&&!c.back,10);ok(`${tag} 내려놓으면 손님 화면에서도 내려놓음`,!!h);
   ok(`${tag} 페이지 오류 0`,[A,B,C].every(x=>x.p.errs.length===0),[A,B,C].flatMap(x=>x.p.errs).join(' | '));
  }finally{await B.ctx.close();await C.ctx.close();}
 }catch(e){ok(`${tag} 실행`,false,String(e?.stack??e));}finally{await A.ctx.close();}
}
// 옛 서버(지금 공개 서버와 같은 코드 = 마지막 커밋, ch·cb 모름) + 새 화면
async function old(){
 const tag='[옛 서버 + 새 화면]',dir='/tmp/carry-oldsrv';
 if(!existsSync(dir))execSync(`git -C ${ROOT} worktree add --detach ${dir} HEAD`,{stdio:'ignore'});
 const {startServer:startOld}=await import(dir+'/server/multi-server.mjs');
 const os=startOld({PORT:String(OP),HOST:'127.0.0.1',DATA_DIR:'/tmp/carry-v/old'},{quiet:true});await os.ready;
 try{
  const ACT=(await import(dir+'/src/multi-protocol.js')).ACT_SCHEMA.claw;ok(`${tag} 옛 서버 규격에는 ch·cb 없음`,!('ch' in ACT)&&!('cb' in ACT));
  const A=await openClaw('pc',{nick:'olda',port:OP,carry:{hand:'dongdong-office',back:'big-haechi'}}),B=await openClaw('pc',{nick:'oldb',port:OP,withDex:false});
  try{
   let seen=false;for(let i=0;i<20&&!seen;i++){await sl(1000);seen=await B.p.evaluate(()=>(window.claw.multi.info?.()?.people??window.claw.multi.people?.()??[]).some(r=>r.shown));}
   ok(`${tag} 서로 보임(접속·위치·행동 그대로)`,seen);
   const a=mine(await carries(A.p));ok(`${tag} 내 화면에는 내 인형`,a?.hand==='dongdong-office'&&a?.back==='big-haechi'&&a.shown.hand);
   const g=await waitRemote(B.p,c=>!!(c.hand||c.back),4);ok(`${tag} 손님에게는 인형이 안 감(서버를 다시 켜야 보임)`,!g);
   ok(`${tag} 연결 끊김·거절 없음`,await A.p.evaluate(()=>window.claw.multi.state==='online')&&await B.p.evaluate(()=>window.claw.multi.state==='online'));
   ok(`${tag} 페이지 오류 0`,A.p.errs.length+B.p.errs.length===0,[...A.p.errs,...B.p.errs].join(' | '));
  }finally{await A.ctx.close();await B.ctx.close();}
 }catch(e){ok(`${tag} 실행`,false,String(e?.stack??e));}
 finally{await os.close?.();try{execSync(`git -C ${ROOT} worktree remove --force ${dir}`,{stdio:'ignore'});}catch{}}
}
try{
 if(PARTS.includes('claw'))for(const s of SZ)await clawSize(s);
 if(PARTS.includes('others'))await others();
 if(PARTS.includes('multi'))await multi();
 if(PARTS.includes('old'))await old();
}finally{
 writeFileSync(OUT+'/report.json',JSON.stringify(report,null,1));
 console.log(`\n${report.checks.length-fails}/${report.checks.length} 통과`);
 await browser.close();await vite.close();await srv.close?.();process.exit(fails?1:0);
}
