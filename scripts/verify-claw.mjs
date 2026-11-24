// 온라인 인형뽑기 브라우저 점검(월드개발, 2026-11-23). vite 개발 서버(·PART=server면 함께 걷기 서버도)를 직접 띄운다.
//   node scripts/verify-claw.mjs            → artifacts/claw-verify/*.png + report.json
//   PART=size,keys,multi,server,hub,bar  SIZES=portrait,landscape,pc …
// 확인: 설계 v1 §8 완료 기준 — 화면 단추 44px 이상·안 겹침·화면 안, 마우스/손가락만으로 입장 → 기계 가기 → 한 판 → 도감,
//       십자 단추 누르고 있기·옆으로 밀기·떼면 멈춤, 알림·결과 카드가 알약·위 단추에 안 가림, 조작 중 💬·☰·조이스틱 숨김,
//       코인 없음·그만두기·확률 안내, 다른 손님 구경(두 창·진짜 서버), 허브 카드 → 입장, 페이지 오류 0.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const OUT=process.env.OUT??'artifacts/claw-verify';mkdirSync(OUT,{recursive:true});
const PARTS=(process.env.PART??'size,keys,multi,server,hub').split(',');
const {createServer}=await import('vite');const port=Number(process.env.PORT??5395);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const SIZES={portrait:[390,844,true],small:[360,640,true],android:[412,915,true],landscape:[844,390,true],pc:[1280,720,false],pcbig:[1920,1080,false]};
const ONLY=(process.env.SIZES??Object.keys(SIZES).join(',')).split(',');
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const report={at:new Date().toISOString(),checks:[],errors:[]};let fails=0;
const ok=(name,pass,detail='')=>{report.checks.push({name,pass:!!pass,detail});if(!pass){fails++;console.log('✖',name,detail);}else console.log('✓',name,detail&&typeof detail!=='object'?detail:'');};

async function open(size,{path='/claw/',storage=null}={}){
 const [w,h,touch]=SIZES[size]??size;
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(s=>{if(!sessionStorage.getItem('__k')){localStorage.clear();if(s)for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));},storage);
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text().slice(0,200));});
 await p.goto(base+path);
 if(path.startsWith('/claw'))await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
 return {ctx,p};
}
const rect=(p,sel)=>p.evaluate(s=>{const out=[];for(const e of document.querySelectorAll(s)){const cs=getComputedStyle(e);if(e.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)continue;const b=e.getBoundingClientRect();if(!b.width)continue;out.push({sel:s,cls:e.className?.baseVal??e.className,x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),r:Math.round(b.right),b:Math.round(b.bottom)});}return out;},sel);
const hit=(a,b)=>a.x<b.r-1&&a.r>b.x+1&&a.y<b.b-1&&a.b>b.y+1;
// 보이는 단추: 크기 44 이상·화면 안·서로 안 겹침
async function checkButtons(p,label,sels){
 const vw=await p.evaluate(()=>[innerWidth,innerHeight]);const all=[];for(const s of sels)all.push(...await rect(p,s));
 const small=all.filter(r=>r.w<44||r.h<44),out=all.filter(r=>r.x<0||r.y<0||r.r>vw[0]||r.b>vw[1]);
 const over=[];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)if(hit(all[i],all[j]))over.push(`${all[i].cls}×${all[j].cls}`);
 ok(`${label}: 단추 ${all.length}개 44px 이상`,!small.length,small.map(r=>`${r.cls} ${r.w}×${r.h}`).join(', '));
 ok(`${label}: 화면 안`,!out.length,out.map(r=>r.cls).join(', '));
 ok(`${label}: 안 겹침`,!over.length,over.join(', '));
}
const innerW=size=>SIZES[size][0],innerH=size=>SIZES[size][1];
const click=async(p,sel)=>{const el=await p.waitForSelector(sel,{state:'visible',timeout:15000});await el.click();};
const st=p=>p.evaluate(()=>window.claw.status());

// ── 화면 크기마다: 손가락/마우스만으로 입장 → ☰ 기계 「가기」 → 처음 규칙 카드 → 세 기계(집게·타이머·열쇠) 한 판씩 → 도감, 그만두기·코인 없음
const bigBox=async p=>{const b=await p.waitForSelector('.kh-big',{state:'visible'});return b.boundingBox();};
async function holdBig(p,ms){const b=await bigBox(p);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await sl(ms);await p.mouse.up();}
async function firstPlay(p,tag,name){ // 기계 앞 → 한 판 → (처음이면) 규칙 카드 → 시작하기
 const before=(await st(p)).coins;await click(p,'.kh-big[data-act=play]');await sl(300);
 const rules=await p.evaluate(()=>window.claw.hud.card);
 ok(`${tag} ${name}: 처음 한 판 전 규칙 카드(코인 아직 안 씀)`,rules==='rules'&&(await st(p)).coins===before);
 await checkButtons(p,`${tag} ${name} 규칙 카드`,['.kh-card .kh-btn','.kh-card .kh-x']);
 await p.screenshot({path:`${OUT}/${tag.slice(1,-1)}-${name}-rules.png`});
 await click(p,'.kh-card [data-c=go]');await sl(700);
 const s=await st(p);ok(`${tag} ${name}: 시작하기 → 코인 −1·조작`,s.mode==='play'&&s.coins===before-1,`${s.mode} ${before}→${s.coins}`);
}
async function waitResult(p,ms=40000){await p.waitForFunction(()=>window.claw.hud.card==='result',null,{timeout:ms});await sl(300);}
async function resultChecks(p,tag,name){
 const card=(await rect(p,'.kh-card'))[0],pill=(await rect(p,'.kh-pill'))[0],tr=await rect(p,'.uf-tr > *');
 ok(`${tag} ${name}: 결과 카드가 알약·위 단추에 안 가림`,card&&![pill,...tr].some(r=>r&&hit(card,r)),JSON.stringify(card));
 ok(`${tag} ${name}: 결과 카드가 위 단추보다 위층`,await p.evaluate(()=>+getComputedStyle(document.querySelector('.kh-card')).zIndex>+getComputedStyle(document.querySelector('.uf-tr')).zIndex));
 await checkButtons(p,`${tag} ${name} 결과 카드`,['.kh-card .kh-btn']);
}
async function sizeRun(size){
 const {ctx,p}=await open(size);const tag=`[${size}]`;
 await p.waitForSelector('.kh-toast:not([hidden])',{timeout:5000}).catch(()=>{});await sl(200);
 const t0=await rect(p,'.kh-toast'),pill=(await rect(p,'.kh-pill'))[0],tr=await rect(p,'.uf-tr > *');
 ok(`${tag} 첫 알림 「오늘의 코인」 보임`,t0.length&&await p.evaluate(()=>document.querySelector('.kh-toast').textContent.includes('오늘의 코인')));
 ok(`${tag} 하루 첫 접속 코인 30개(알림에도 30개)`,(await st(p)).coins===30&&await p.evaluate(()=>/30개/.test(document.querySelector('.kh-toast').textContent)),String((await st(p)).coins));
 ok(`${tag} 알림이 알약·위 단추와 안 겹침`,t0.length&&![pill,...tr].some(r=>hit(t0[0],r)),JSON.stringify(t0[0]));
 ok(`${tag} 알림이 위 단추보다 위층(z)`,await p.evaluate(()=>+getComputedStyle(document.querySelector('.kh-toast')).zIndex>+getComputedStyle(document.querySelector('.uf-tr')).zIndex));
 await p.screenshot({path:`${OUT}/${size}-1walk.png`});
 await checkButtons(p,`${tag} 걷기`,['.kh-pill','.uf-tr > button:not([hidden])','[data-uf]']);
 // ☰ → 기계 탭 → 「가기」(숲속 = 집게)
 await click(p,'.uf-menu-btn');await click(p,'[data-uf-tab=machines]');await sl(300);
 await p.screenshot({path:`${OUT}/${size}-2machines.png`});
 ok(`${tag} 기계 탭: 종류별 4묶음(집게 6·봉 4·타이머 3·열쇠 3)·빈 기계 수`,await p.evaluate(()=>{const g=[...document.querySelectorAll('.kh-mgroup')];return g.length===4&&g.map(x=>x.querySelectorAll('.kh-mlist li').length).join()==='6,4,3,3'&&/빈 기계 6\/6/.test(g[0].textContent);}));
 await checkButtons(p,`${tag} 기계 탭(보이는 줄)`,['.uf-tab','.uf-x']);
 await p.evaluate(()=>document.querySelector('.uf-sheet [data-go="0"]').scrollIntoView({block:'nearest'}));
 await click(p,'.uf-sheet [data-go="0"]');await sl(900);
 let s=await st(p);ok(`${tag} 「가기」로 집게 1 앞`,s.near===0,`near=${s.near}`);
 await p.screenshot({path:`${OUT}/${size}-3near.png`});
 await checkButtons(p,`${tag} 기계 앞`,['.kh-pill','.uf-tr > button:not([hidden])','[data-uf]']);
 ok(`${tag} 할 일 칩 「한 판 · 🪙1」·「규칙」`,(await p.evaluate(()=>[...document.querySelectorAll('.kh-todo')].map(e=>e.textContent).join('|'))).match(/집게 1 한 판.*규칙/));
 await click(p,'.kh-todo[data-act=rules]');await sl(250);
 ok(`${tag} 규칙 카드(조절값 글·보장 글·인형)`,await p.evaluate(()=>{const c=document.querySelector('.kh-card');return !c.hidden&&/20초/.test(c.textContent)&&/직원이 인형 하나를/.test(c.textContent)&&c.querySelectorAll('.kh-prizes span').length>=3;}));
 await click(p,'.kh-card [data-c=close]');
 // ── 집게(물리)
 await firstPlay(p,tag,'집게');
 const hiddenTop=await p.evaluate(()=>['.uf-menu-btn','.uf-chat-btn','.uf-extra'].every(q=>{const e=document.querySelector(q);return !e||getComputedStyle(e).display==='none'||e.hidden;}));
 ok(`${tag} 조작 중 ☰·💬·🧸 숨김, ⏱·✕·십자·👁 보임`,hiddenTop&&(await rect(p,'.kh-timer')).length&&(await rect(p,'.kh-quit')).length&&(await rect(p,'.kh-dir')).length===4&&(await rect(p,'.kh-todo[data-act=side]')).length);
 ok(`${tag} 조작 중 게임 화면 끌기 꺼짐(조이스틱 안 생김)`,await p.evaluate(()=>getComputedStyle(document.querySelector('#scene')).pointerEvents==='none'));
 ok(`${tag} 한 줄 안내 보임`,(await rect(p,'.kh-hint')).length===1);
 await checkButtons(p,`${tag} 집게 조작`,['.kh-pill','.kh-timer','.kh-quit','.kh-dir','[data-uf]']);
 {const h=(await rect(p,'.kh-hint'))[0],btn=[...await rect(p,'.kh-dir'),...await rect(p,'[data-uf]'),...await rect(p,'.kh-pill'),...await rect(p,'.uf-tr > *')];ok(`${tag} 한 줄 안내가 단추와 안 겹침`,h&&!btn.some(r=>hit(h,r)),JSON.stringify(h));}
 const box=async d=>(await p.$(`.kh-dir[data-dir=${d}]`)).boundingBox();
 const c0=(await st(p)).play.claw;const R=await box('right');await p.mouse.move(R.x+R.width/2,R.y+R.height/2);await p.mouse.down();await sl(500);
 const c1=(await st(p)).play.claw;const Up=await box('up');await p.mouse.move(Up.x+Up.width/2,Up.y+Up.height/2,{steps:5});await sl(500);
 const c2=(await st(p)).play.claw;await p.mouse.up();await sl(60);const c3=(await st(p)).play.claw;await sl(300);const c4=(await st(p)).play.claw;
 ok(`${tag} 누르고 있으면 오른쪽으로`,c1.x>c0.x+.05,`${c0.x}→${c1.x}`);
 ok(`${tag} 옆 단추로 밀면 안쪽으로`,c2.z<c1.z-.05,`${c1.z}→${c2.z}`);
 ok(`${tag} 떼면 바로 멈춤`,Math.abs(c4.x-c3.x)<1e-3&&Math.abs(c4.z-c3.z)<1e-3);
 await p.screenshot({path:`${OUT}/${size}-4claw.png`});
 await click(p,'.kh-todo[data-act=side]');await sl(900);await p.screenshot({path:`${OUT}/${size}-5side.png`});
 {const a=(await st(p)).play.claw;const R2=await box('right');await p.mouse.move(R2.x+R2.width/2,R2.y+R2.height/2);await p.mouse.down();await sl(400);await p.mouse.up();const b=(await st(p)).play.claw;
  ok(`${tag} 옆에서 볼 때 ▶ = 화면 오른쪽(기계 안쪽)`,b.z<a.z-.03&&Math.abs(b.x-a.x)<.01,`${JSON.stringify(a)}→${JSON.stringify(b)}`);}
 // 왼쪽 옆(대표 피드백 11-23): 「왼쪽 옆에서 보기」 칩 → 카메라가 기계 왼쪽, ▶ = 화면 오른쪽 = 기계 앞쪽
 {const T=await rect(p,'.kh-todo');const inView=T.every(r=>r.x>=0&&r.y>=0&&r.r<=innerW(size)&&r.b<=innerH(size)),apart=T.length===2&&(T[0].b<=T[1].y||T[1].b<=T[0].y||T[0].r<=T[1].x||T[1].r<=T[0].x);
  ok(`${tag} 옆에서 볼 때 「정면으로」·「왼쪽 옆에서」 칩 둘 다 화면 안·안 겹침`,inView&&apart&&T.every(r=>r.h>=44),JSON.stringify(T.map(r=>[r.x,r.y,r.w,r.h])));
  const mx=await p.evaluate(()=>claw.shop.userData.machines[0].x??claw.shop.userData.machines[0].group.position.x);
  await click(p,'.kh-todo[data-act=flip]');await sl(900);await p.screenshot({path:`${OUT}/${size}-5side-left.png`});
  const camX=await p.evaluate(()=>claw.camera?.position.x);
  ok(`${tag} 왼쪽 옆으로 바꾸면 카메라가 기계 왼쪽`,camX==null||camX<mx-1,`카메라 x ${camX} 기계 x ${mx}`);
  const a=(await st(p)).play.claw;const R2=await box('right');await p.mouse.move(R2.x+R2.width/2,R2.y+R2.height/2);await p.mouse.down();await sl(400);await p.mouse.up();const b=(await st(p)).play.claw;
  ok(`${tag} 왼쪽 옆에서 볼 때 ▶ = 화면 오른쪽(기계 앞쪽)`,b.z>a.z+.03&&Math.abs(b.x-a.x)<.01,`${JSON.stringify(a)}→${JSON.stringify(b)}`);
  ok(`${tag} 옆에서 볼 때 「옆에서 보면…」 안내 숨김(칩과 안 겹침)`,!(await rect(p,'.kh-hint')).length);
  ok(`${tag} 왼쪽 옆에서는 칩이 「오른쪽 옆에서 보기」`,await p.evaluate(()=>document.querySelector('.kh-todo[data-act=flip]')?.textContent.includes('오른쪽 옆')));}
 await p.evaluate(()=>claw.aim(0));await sl(100);
 // 옆에서 본 채로 뽑기: 그림 집게(손가락 각)를 매 프레임 적어 「벌리고 내려감 → 바닥에서 조임 → 조인 채 올라옴」 확인(대표 피드백 11-23)
 await p.evaluate(()=>{const C=claw.shop.userData.machines[0].group.userData.claw,log=window.__clawLog=[];
  const tick=()=>{const f=C.fingers.map(f=>f.rotation.x);log.push({drop:C.state.drop,ang:(f[0]+f[1]+f[2])/3,st:claw.play.status().claw?.state});if(log.length<2000)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
 await click(p,'.kh-big[data-act=press]');
 {let shot=false;for(let t=0;t<40&&!shot;t++){await sl(50);const d=await p.evaluate(()=>{const C=claw.shop.userData.machines[0].group.userData.claw;return {drop:C.state.drop,st:claw.play.status().claw?.state};});
   if(d.st==='drop'&&d.drop>.08){await p.screenshot({path:`${OUT}/${size}-6side-down.png`});shot=true;}}
  ok(`${tag} 옆에서: 내려가는 장면 찍음`,shot);}
 s=await st(p);ok(`${tag} 뽑기 → 집게 내려감(입력 잠금)`,['drop','close','lift'].includes(s.play.claw?.state)&&s.mode==='drop'&&await p.evaluate(()=>document.querySelector('.kh-pad').hasAttribute('data-lock')));
 await sl(3500);
 {const L=await p.evaluate(()=>window.__clawLog.slice());
  const rest=L[0].ang,down=L.filter(x=>x.st==='drop'&&x.drop>.01),ci=L.findIndex(x=>x.st==='close'),deep=Math.max(...L.map(x=>x.drop)),up=L.filter(x=>x.st==='lift'&&x.drop<deep-.02);
  // 손가락 각: 작을수록(−쪽) 벌어짐
  ok(`${tag} 그림 집게: 벌린 채 내려감`,down.length>3&&down.every(x=>x.ang<rest-.25),`쉼 ${rest.toFixed(2)} 내려갈 때 ${down.length?Math.max(...down.map(x=>x.ang)).toFixed(2):'-'}`);
  // 11-24: 내려가다 멈춘 곳에서 조이기 시작하고, 조이는 동안 줄이 느슨해 5cm까지 가라앉음(11-23 물리, 집게가 커져 자주 보임)
  {const downDeep=Math.max(...L.slice(0,ci).map(x=>x.drop));ok(`${tag} 그림 집게: 바닥에서 조이기 시작`,ci>0&&Math.abs(L[ci].drop-downDeep)<.01&&deep-L[ci].drop<=.052,`조임 시작 깊이 ${L[ci]?.drop.toFixed(3)} 내려간 깊이 ${downDeep.toFixed(3)} 가장 깊이 ${deep.toFixed(3)}`);}
  ok(`${tag} 그림 집게: 조인 채 올라옴`,up.length>3&&up.every(x=>x.ang>L[ci].ang+.05),`조임 시작 ${L[ci]?.ang.toFixed(2)} 올라올 때 ${up.length?Math.min(...up.map(x=>x.ang)).toFixed(2):'-'}`);}
 await p.screenshot({path:`${OUT}/${size}-6drop.png`}); // 옆 보기는 다음 기계로 가면 저절로 꺼짐
 await waitResult(p);s=await st(p);ok(`${tag} 집게 결과(물리): ${s.play.result?.kind}`,['win','near','miss'].includes(s.play.result?.kind),JSON.stringify(s.play.result));
 await resultChecks(p,tag,'집게');await p.screenshot({path:`${OUT}/${size}-7clawresult.png`});
 await click(p,'.kh-card [data-c=stop]');await sl(500);
 // ── 타이머: 진짜 누름으로 시작·멈춤(약 1초 → 실패), 숫자판 = 카드 숫자
 await p.evaluate(()=>claw.goMachine(10));await sl(900);await firstPlay(p,tag,'타이머');
 ok(`${tag} 타이머: 큰 단추 「시작」(초록), 십자·⏱ 없음`,await p.evaluate(()=>{const b=document.querySelector('.kh-big');return /시작/.test(b.textContent)&&b.classList.contains('kh-green')&&document.querySelector('.kh-pad').hidden&&document.querySelector('.kh-timer').hidden;}));
 await p.screenshot({path:`${OUT}/${size}-8timer-ready.png`});
 {const b=await bigBox(p);await p.mouse.click(b.x+b.width/2,b.y+b.height/2);}await sl(1100);
 ok(`${tag} 타이머: 누르면 숫자가 오르고 「멈춤」`,await p.evaluate(()=>/멈춤/.test(document.querySelector('.kh-big').textContent)&&claw.play.status().timer.phase==='run'));
 await p.screenshot({path:`${OUT}/${size}-9timer-run.png`});
 {const b=await bigBox(p);await p.mouse.click(b.x+b.width/2,b.y+b.height/2);}
 await waitResult(p,15000);
 {const r=await p.evaluate(()=>({card:document.querySelector('.kh-card [data-num]')?.textContent,disp:claw.shop.userData.machines[10].group.userData.timer.text,res:claw.play.status().result}));
  ok(`${tag} 타이머: 멈춘 숫자 = 카드 숫자(${r.card})·${r.res.kind}`,r.card===r.disp&&r.card===r.res.shown&&/^\d\d\.\d\d$/.test(r.card),JSON.stringify(r));}
 await resultChecks(p,tag,'타이머');await p.screenshot({path:`${OUT}/${size}-10timer-result.png`});
 // 한 판 더: 누른 시각 10.004초 → 10.00 성공 → 도감
 await click(p,'.kh-card [data-c=again]');await sl(600);
 const tw=await p.evaluate(()=>{const t=performance.now();claw.play.bigDown(t);claw.play.bigDown(t+10004);return claw.play.status().result;});
 ok(`${tag} 타이머: 10.004초 → 10.00 성공`,tw.kind==='win'&&tw.shown==='10.00',JSON.stringify(tw));
 await waitResult(p,15000);await p.screenshot({path:`${OUT}/${size}-11timer-win.png`});
 await click(p,'.kh-card [data-c=dex]');await sl(500);
 ok(`${tag} 도감에 뽑은 인형(색 칸)`,await p.evaluate(()=>document.querySelectorAll('.kh-cell:not(.none)').length>=1&&new RegExp(`\\d / ${claw.catalog.length}$`).test(document.querySelector('.kh-count')?.textContent??'')));
 ok(`${tag} 도감 19칸: 큰 인형 3칸 「큰」·상자 8칸 「상자」 딱지(작은 인형 칸엔 없음)`,await p.evaluate(()=>{const big=claw.catalog.filter(c=>c.big).map(c=>c.id),box=claw.catalog.filter(c=>c.box).map(c=>c.id),cells=[...document.querySelectorAll('.kh-cell')];
  return claw.catalog.length===19&&big.length===3&&box.length===8&&cells.length===19&&cells.every(el=>{const t=el.querySelector('.kh-big')?.textContent??'';return t===(big.includes(el.dataset.id)?'큰':box.includes(el.dataset.id)?'상자':'');});}));
 await p.screenshot({path:`${OUT}/${size}-12dex.png`});
 await click(p,'.kh-cell:not(.none)');await sl(200);
 ok(`${tag} 인형 자세히(처음 뽑은 날·모은 수)`,await p.evaluate(()=>/처음 뽑은 날/.test(document.querySelector('.kh-detail')?.textContent??'')));
 await click(p,'.uf-x');await sl(400);
 // ── 열쇠: 진짜 누르고 있기 두 번
 await p.evaluate(()=>claw.goMachine(13));await sl(900);await firstPlay(p,tag,'열쇠');
 await p.screenshot({path:`${OUT}/${size}-13key.png`});
 const k0=(await st(p)).play.key;await holdBig(p,600);await sl(80);const k1=(await st(p)).play.key;
 ok(`${tag} 열쇠: 누르고 있으면 오른쪽, 떼면 고정`,k1.x>k0.x+.4&&k1.phase==='gap',`${JSON.stringify(k0)}→${JSON.stringify(k1)}`);
 await sl(500);const k2=(await st(p)).play.key;ok(`${tag} 열쇠: 0.3초 뒤 위로 단계`,k2.phase==='k2'&&Math.abs(k2.x-k1.x)<1e-6);
 await holdBig(p,700);await sl(80);const k3=(await st(p)).play;ok(`${tag} 열쇠: 누르고 있다 떼면 꽂고 판정`,k3.mode==='drop'&&k3.key.y>k2.y+.5,JSON.stringify(k3.key));
 await sl(300);await p.screenshot({path:`${OUT}/${size}-14key-push.png`});
 await waitResult(p,15000);await resultChecks(p,tag,'열쇠');await p.screenshot({path:`${OUT}/${size}-15key-result.png`});
 await click(p,'.kh-card [data-c=stop]');await sl(500);
 // ── 봉(설계 v4.1 §7): 「→」 누르고 있기 → 「↑」 누르고 있기(옆 작은 창) → 떼면 집게가 내려감 → 상자는 그 자리에 남음(새로고침 뒤에도, 오늘까지)
 await p.evaluate(()=>claw.goMachine(6));await sl(900);await firstPlay(p,tag,'봉');
 ok(`${tag} 봉: 큰 단추 「오른쪽」, 십자·⏱ 없음`,await p.evaluate(()=>/오른쪽/.test(document.querySelector('.kh-big').textContent)&&document.querySelector('.kh-pad').hidden&&document.querySelector('.kh-timer').hidden));
 const bb0=(await st(p)).play.claw;await holdBig(p,700);await sl(80);const bb1=(await st(p)).play.claw;
 ok(`${tag} 봉: 누르고 있으면 집게가 오른쪽, 떼면 고정`,bb1.x>bb0.x+.1&&bb1.phase==='gap',`${JSON.stringify(bb0)}→${JSON.stringify(bb1)}`);
 await sl(500);{const b=await bigBox(p);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await sl(450);
  const m=await p.evaluate(()=>{const e=document.querySelector('.kh-mini');return {on:claw.mini,shown:!e.hidden,r:e.getBoundingClientRect().toJSON()};});
  ok(`${tag} 봉: 「↑」 누르는 동안 옆에서 본 작은 창(150×104, 화면 안)`,m.on&&m.shown&&Math.round(m.r.width)===150&&Math.round(m.r.height)===104&&m.r.left>=0&&m.r.top>=0,JSON.stringify(m));
  await sl(100);const m2=await p.evaluate(()=>document.querySelector('.kh-mini').getBoundingClientRect().toJSON());m.r=m2;const pr=[...await rect(p,'.kh-pill'),...await rect(p,'.uf-tr > *'),...await rect(p,'.kh-quit'),...await rect(p,'.kh-hint')];ok(`${tag} 봉: 작은 창이 알약·위 단추·한 줄 안내와 안 겹침`,!pr.some(r=>hit(m.r,r)),JSON.stringify(pr));
  await p.screenshot({path:`${OUT}/${size}-17bridge-up.png`});await p.mouse.up();}
 await sl(80);ok(`${tag} 봉: 떼면 집게가 저절로 내려감`,(await st(p)).mode==='drop');
 await waitResult(p,40000);s=await st(p);ok(`${tag} 봉 결과(물리): ${s.play.result?.kind}`,['win','near','miss'].includes(s.play.result?.kind),JSON.stringify(s.play.result));
 await resultChecks(p,tag,'봉');await p.screenshot({path:`${OUT}/${size}-18bridge-result.png`});
 await p.waitForFunction(()=>{const m=claw.state.mach?.['bridge-1'];return !!m;},null,{timeout:15000}).catch(()=>{});await sl(2500); // 상자가 멈춘 뒤 저장됨
 const bs=await p.evaluate(()=>({b:claw.play.bridge(6),saved:!!claw.state.mach?.['bridge-1'],st:claw.state.mach?.['bridge-1']?.st??null}));
 ok(`${tag} 봉: 판이 끝나면 상자 자리를 이 기기에 저장`,bs.saved,JSON.stringify(bs.b&&{support:bs.b.support,tilt:bs.b.tilt}));
 await click(p,'.kh-card [data-c=stop]');await sl(500);
 // 그만두기: 집게 한 판 → ✕ → 확인 → 그만두기(코인 안 돌려줌)
 await p.evaluate(()=>claw.goMachine(0));await sl(900);const cb=(await st(p)).coins;
 await click(p,'.kh-big[data-act=play]');await sl(900);await click(p,'.kh-quit');await sl(200);
 ok(`${tag} ✕ → 「코인은 돌려받지 못해요」 확인`,await p.evaluate(()=>/돌려받지 못해요/.test(document.querySelector('.kh-card').textContent)));
 await click(p,'.kh-card [data-c=quit]');await sl(500);s=await st(p);ok(`${tag} 그만두기 → 걷기·코인 그대로 −1`,s.mode==='idle'&&s.coins===cb-1,`${cb}→${s.coins}`);
 // 코인 없음
 await p.evaluate(()=>claw.setCoins(0));await sl(200);await click(p,'.kh-big[data-act=play]');await sl(300);
 ok(`${tag} 코인 없음 카드(사는 단추 없음)`,await p.evaluate(()=>{const c=document.querySelector('.kh-card');return !c.hidden&&/코인이 없어요/.test(c.textContent)&&!/사기|구매|충전/.test(c.textContent);}));
 await p.screenshot({path:`${OUT}/${size}-16nocoin.png`});
 await click(p,'.kh-card [data-c=close]');
 await click(p,'.uf-menu-btn');await click(p,'[data-uf-tab=coin]');await sl(200);
 ok(`${tag} 코인 탭: 오늘 받음·기록`,await p.evaluate(()=>{const t=document.querySelector('[data-uf-panel=coin]').textContent;return /오늘 받음/.test(t)&&/한 판/.test(t);}));
 ok(`${tag} 코인 탭: 「/ 하루 30」·넘어가지 않음 안내(최대 없음)`,await p.evaluate(()=>{const t=document.querySelector('[data-uf-panel=coin]').textContent;return /\/ 하루 30/.test(t)&&/넘어가지 않아요/.test(t)&&!/최대/.test(t);}));
 await click(p,'.uf-x');
 const dexN=Object.keys((await st(p)).dex).length;
 await p.reload();await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});await sl(400);
 s=await st(p);ok(`${tag} 이어하기: 새로고침 뒤 코인 0·도감 ${dexN}종(같은 날 다시 안 줌)`,s.coins===0&&Object.keys(s.dex).length===dexN,`${s.coins} ${JSON.stringify(s.dex)}`);
 {const b2=await p.evaluate(()=>claw.play.bridge(6)),b1=bs.b;
  // 저장한 상자 자리(공 자리 mm)와 새로고침 뒤 자리를 비교: 공마다 8mm 안(다시 놓을 때 0.4초 굳힘으로 생기는 어긋남 허용).
  // 봉 밖으로 떨어진 상자(받침 여유 −)는 다시 놓는 규칙(11-23)이라 처음 자리면 맞음(11-24: 커진 집게로 이 판에서 자주 떨어짐).
  // 처음 자리 받침 여유는 약 3cm지만 ±4mm·±8° 흔들어 놓아 2.9cm대도 나옴 → 「아슬아슬(2cm) 아님」으로 봄(11-24 코인 30 점검 때 2.95cm로 실패)
  const diff=bs.st&&b2.st&&bs.st.length===b2.st.length?Math.max(...bs.st.map((v,i)=>Math.abs(v-b2.st[i]))):null;
  ok(`${tag} 봉: 새로고침해도 상자가 그 자리(저장한 자리와 공마다 8mm 안)`,b1.won||b1.refill?b2.support>.02:diff!==null&&diff<=8||b1.support<0&&b2.support>.02,`최대 어긋남 ${diff}mm · ${b1.support}/${b1.tilt} → ${b2.support}/${b2.tilt}`);}
 // 다음 날(11-24 대표 결정): 남은 개수와 상관없이 30으로 — 어제 받은 것으로 바꾸고 새로고침
 const dayShift=async(patch)=>{await p.evaluate(patch=>{const k='claw-world:v1',v=JSON.parse(localStorage.getItem(k));const y=new Date(Date.now()+9*3600e3-86400e3).toISOString().slice(0,10);
   Object.assign(v,patch);if(v.lastGrant==='Y')v.lastGrant=y;if(v.lastGrant==='T')v.lastGrant=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);if(patch.coinV===null)delete v.coinV;localStorage.setItem(k,JSON.stringify(v));},patch);
  await p.reload();await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});await sl(1400);return st(p);};
 s=await dayShift({coins:3,lastGrant:'Y'});ok(`${tag} 다음 날: 남은 3개 → 30개`,s.coins===30&&Object.keys(s.dex).length===dexN,String(s.coins));
 s=await dayShift({coins:30,lastGrant:'Y'});ok(`${tag} 다음 날: 안 쓴 30개 → 30개(60 안 됨)`,s.coins===30,String(s.coins));
 s=await dayShift({coins:4,lastGrant:'T',coinV:null});ok(`${tag} 옛 저장(오늘 받고 4개 남음) → 오늘 30개로 채움`,s.coins===30,String(s.coins));
 s=await dayShift({coins:6,lastGrant:'T',coinV:2});ok(`${tag} 하루 15개 시절 저장(오늘 받고 6개 남음) → 오늘 30개로 채움`,s.coins===30,String(s.coins));
 ok(`${tag} 페이지 오류 0`,!p.errs.length,p.errs.slice(0,3).join(' / '));
 await ctx.close();
}

// ── PC 키(덧붙임): E 한 판, ←/↑ 누르고 있기, Space 뽑기, Esc 그만두기 확인
async function keysRun(){
 const {ctx,p}=await open('pc');
 // 「옆 빈 집게로 →」(설계 v4 §4-2): 집게 2를 다른 손님이 쓰는 중이면 칩 → 누르면 같은 종류의 가까운 빈 기계 앞
 await p.evaluate(()=>{claw.seen(true);claw.play.watch('other',{m:2,ph:'play',cx:50,cz:50,r:'',k:0,n:1,v:0});claw.goMachine(1);});await sl(900);
 {const t=await p.evaluate(()=>[...document.querySelectorAll('.kh-todo')].map(e=>e.textContent).join('|'));ok('[pc] 쓰는 중인 기계 앞: 「○○님이 뽑는 중」 + 「옆 빈 집게로 →」',/집게 2는 .*뽑는 중/.test(t)&&/옆 빈 집게로/.test(t),t);
  await p.screenshot({path:`${OUT}/pc-busy-free.png`});await click(p,'.kh-todo[data-act=free]');await sl(900);const n=(await st(p)).near;ok('[pc] 「옆 빈 집게로」 → 집게 1 또는 3 앞',n===0||n===2,`near=${n}`);}
 await p.evaluate(()=>{claw.play.unwatch('other');claw.goMachine(0);});await sl(800);
 await p.keyboard.press('KeyE');await sl(800);let s=await st(p);ok('[키] E = 한 판',s.mode==='play');
 const c0=s.play.claw;await p.keyboard.down('ArrowRight');await sl(500);await p.keyboard.up('ArrowRight');await p.keyboard.down('KeyW');await sl(400);await p.keyboard.up('KeyW');
 const c1=(await st(p)).play.claw;ok('[키] →·W 누르고 있기로 집게 이동',c1.x>c0.x+.05&&c1.z<c0.z-.03,`${JSON.stringify(c0)}→${JSON.stringify(c1)}`);
 await p.keyboard.press('Escape');await sl(200);ok('[키] Esc = 그만두기 확인 창',await p.evaluate(()=>window.claw.hud.card==='quit'));
 await click(p,'.kh-card [data-c=keep]');await sl(700);await p.keyboard.press('Space');await sl(400);s=await st(p);ok('[키] Space = 뽑기',s.mode==='drop');
 // 시간 끝이면 저절로 뽑기(20초)
 await p.waitForFunction(()=>window.claw.hud.card==='result',null,{timeout:40000});await click(p,'.kh-card [data-c=again]');await sl(200);
 // 게임 시계는 한 프레임을 최대 0.05초로 잘라 세므로(main.js), 컴퓨터가 바빠 초당 20장 아래로 떨어지면 게임 속 20초가 실제로는 더 길다 → 실제 시간 여유를 넉넉히(11-23 월드아트: 다른 점검과 동시에 돌 때 25초로는 멈춤)
 await p.waitForFunction(()=>window.claw.play.mode==='drop',null,{timeout:70000});ok('[키] 20초 지나면 저절로 뽑기',true);
 await p.waitForFunction(()=>window.claw.hud.card==='result',null,{timeout:40000});await click(p,'.kh-card [data-c=stop]');
 // 타이머: Space 누른 순간으로 시작·멈춤
 await p.evaluate(()=>claw.goMachine(10));await sl(900);await p.keyboard.press('KeyE');await sl(600);await p.keyboard.press('Space');await sl(800);
 ok('[키] 타이머 Space = 시작',(await st(p)).play.timer.phase==='run');await p.keyboard.press('Space');await sl(300);ok('[키] 타이머 Space = 멈춤',(await st(p)).play.timer.phase==='stop');
 await p.waitForFunction(()=>window.claw.hud.card==='result',null,{timeout:15000});await click(p,'.kh-card [data-c=stop]');
 // 열쇠: Space 누르고 있기·떼기
 await p.evaluate(()=>claw.goMachine(13));await sl(900);await p.keyboard.press('KeyE');await sl(600);
 await p.keyboard.down('Space');await sl(500);await p.keyboard.up('Space');await sl(80);ok('[키] 열쇠 Space 누르고 있기 → 떼면 고정',(await st(p)).play.key.phase==='gap');
 ok('[키] 페이지 오류 0',!p.errs.length,p.errs.join(' / '));await ctx.close();
}

// ── 다른 손님 구경(같은 브라우저 두 창 = 내 컴퓨터 모드)
async function multiRun(){
 const [w,h]=SIZES.pc;const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
 const pages=[];for(const n of ['가나','다라']){const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(`${base}/claw/?multi=인형가게-1&server=off&name=${encodeURIComponent(n)}`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});pages.push(p);}
 const [A,B]=pages;await sl(2500);
 ok('[두 창] 서로 보임(2명)',(await B.evaluate(()=>claw.multi.status().people.length))===1&&(await A.evaluate(()=>claw.multi.status().people.length))===1);
 await A.evaluate(()=>claw.seen(true));await B.evaluate(()=>claw.seen(true));
 await A.evaluate(()=>claw.goMachine(0));await sl(700);await click(A,'.kh-big[data-act=play]');await sl(600);
 await A.evaluate(()=>claw.play.aim(.25,-.2));await sl(900);
 const rb=await B.evaluate(()=>claw.play.status().rigs[0]);ok('[두 창] 구경: 집게 1 집게가 A 자리로',!!rb.owner&&Math.abs(rb.x-.25)<.05&&Math.abs(rb.z+.2)<.05,JSON.stringify(rb));
 await A.evaluate(()=>claw.play.press());await A.waitForFunction(()=>window.claw.hud.card==='result',null,{timeout:40000});await sl(1500);
 ok('[두 창] 구경: 집게 결과를 B 화면에서도 다시 그림',await B.evaluate(()=>!!claw.play.status().rigs[0].seq||claw.play.status().rigs[0].lights!=='play'));
 await click(A,'.kh-card [data-c=stop]');await sl(1200);
 // 열쇠 기계: A가 희귀 칸(위 줄 해치)을 연다 → B 구경·소식
 await A.evaluate(()=>claw.goMachine(13));await sl(700);await click(A,'.kh-big[data-act=play]');await sl(600);
 await B.evaluate(()=>claw.goMachine(13));await sl(900);
 ok('[두 창] B 화면: 「열쇠 1은 가나님이 뽑는 중」 + 「옆 빈 열쇠로 →」(같은 기계 못 씀)',await B.evaluate(()=>{const t=[...document.querySelectorAll('.kh-todo')].map(e=>e.textContent).join('|');return /열쇠 1은 가나님이 뽑는 중/.test(t)&&/옆 빈 열쇠로/.test(t)&&!document.querySelector('.kh-big[data-act=play]');}));
 ok('[두 창] 기계 위 「가나 뽑는 중」 이름표',await B.evaluate(()=>[...document.querySelectorAll('.kh-tag.busy')].some(e=>/가나 뽑는 중/.test(e.textContent))));
 await B.screenshot({path:`${OUT}/multi-watch-play.png`});
 await B.evaluate(()=>claw.teleport(-1.15,-2.3,Math.PI));await sl(300);
 await A.evaluate(()=>{claw.play.bigDown();claw.play.bigUp();});await sl(500);
 await A.evaluate(()=>{claw.play.bigDown();claw.play.keyTo(1.5,1.72);claw.play.bigUp();});await sl(900);
 ok('[두 창] 구경: B 화면 열쇠 칸이 열림(해치)',await B.evaluate(()=>{const c=claw.shop.userData.machines[13].group.userData.cellAt(1,1);return claw.play.status().rigs[13].owner&&c.id==='haechi';}));
 await B.screenshot({path:`${OUT}/multi-watch-drop.png`});
 await A.waitForFunction(()=>window.claw.hud.card==='result',null,{timeout:12000});await sl(700);
 ok('[두 창] B 소식: 「가나님이 … 희귀/특별 인형 …을 뽑았어요」',await B.evaluate(()=>/가나님이 .*(희귀|특별) 인형/.test(document.querySelector('.kh-toast')?.textContent??'')));
 await B.screenshot({path:`${OUT}/multi-notice.png`});
 await click(A,'.kh-card [data-c=stop]');await sl(1200);
 ok('[두 창] A가 그만두면 B 화면 기계 비움',await B.evaluate(()=>!claw.play.status().rigs[13].owner));
 ok('[두 창] 페이지 오류 0',!A.errs.length&&!B.errs.length,[...A.errs,...B.errs].join(' / '));
 await ctx.close();
}

// ── 진짜 함께 걷기 서버(로컬)로 두 사람
async function serverRun(){
 const sport=8851;const srv=spawn(process.execPath,['server/multi-server.mjs'],{env:{...process.env,PORT:String(sport),HOST:'127.0.0.1',DATA_DIR:'artifacts/claw-verify/data',ALLOWED_ORIGINS:base},stdio:'ignore'});
 await sl(900);
 try{
  const [w,h]=SIZES.pc;const pages=[];
  for(const n of ['라마','바사']){const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
   const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(`${base}/claw/?multi=인형가게-1&server=ws://127.0.0.1:${sport}&name=${encodeURIComponent(n)}`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});pages.push(p);}
  const [A,B]=pages;await sl(3000);
  const sa=await A.evaluate(()=>claw.multi.status());ok('[서버] 인형가게 1서버에 연결',sa.transport==='server'&&sa.state==='online',`${sa.transport} ${sa.state} ${sa.room}`);
  ok('[서버] 서로 보임',sa.people.length===1&&(await B.evaluate(()=>claw.multi.status().people.length))===1);
  ok('[서버] 상태 알약 「1서버 · 👥 2/30」',await A.evaluate(()=>/1서버 · .*2\/30/.test(document.querySelector('.kh-pill-t').textContent)));
  const health=await (await fetch(`http://127.0.0.1:${sport}/health`)).json();ok('[서버] /health 인형가게 2명',health.servers?.claw?.[0]?.count===2,JSON.stringify(health.servers?.claw));
  await A.evaluate(()=>{claw.seen(true);claw.goMachine(0);});await sl(700);await click(A,'.kh-big[data-act=play]');await sl(600);await A.evaluate(()=>claw.play.aim(-.1,.05));await sl(900);
  const rb=await B.evaluate(()=>claw.play.status().rigs[0]);ok('[서버] 구경: 집게 1 집게가 A 자리로',!!rb.owner&&Math.abs(rb.x+.1)<.05,JSON.stringify(rb));
  await B.evaluate(()=>claw.goMachine(0));await sl(900);await B.screenshot({path:`${OUT}/server-watch.png`});
  // 채팅
  await B.evaluate(()=>window.dispatchEvent(new CustomEvent('claw:chat-send',{detail:{text:'구경 중이에요'}})));await sl(800);
  ok('[서버] 채팅 오감',await A.evaluate(()=>[...document.querySelectorAll('.uf-bub')].some(e=>/구경 중이에요/.test(e.textContent))));
  ok('[서버] 페이지 오류 0',!A.errs.length&&!B.errs.length,[...A.errs,...B.errs].join(' / '));
  for(const p of pages)await p.context().close();
 }finally{srv.kill();}
}

// ── 허브 카드 → 인형뽑기(혼자 하기) → 창 없이 바로 가게
async function hubRun(){
 for(const size of ['pcbig','portrait']){
  const {ctx,p}=await open(size,{path:'/?hubtime=day'});await sl(1200);
  if(size==='pcbig'){await click(p,'#hub-claw');await sl(300);}else{await click(p,'#hub-claw');await sl(500);}
  await p.screenshot({path:`${OUT}/hub-${size}.png`});
  const solo=await p.$('.hb-solo[data-exp=claw],.hb-go[data-exp=claw]');ok(`[허브 ${size}] 인형뽑기 카드 → 들어가기 단추`,!!solo);
  if(solo){await solo.click();await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});await sl(500);
   ok(`[허브 ${size}] /claw/ 도착·서버 창 없이 바로`,p.url().includes('/claw/')&&!(await p.$('.sp-wrap:not([hidden]),.sp-card:not([hidden])')));}
  ok(`[허브 ${size}] 페이지 오류 0`,!p.errs.length,p.errs.join(' / '));await ctx.close();
 }
}

// ── 조작 단추 시안 B(11-24, 대표 승인): 아래 가운데 넓은 판. PART=bar SIZES=portrait,landscape,pc,pcbig
//  판이 보임·화면 안·44px 이상·다른 단추와 안 겹침, 기계 그림 단추·타이머 숫자판·인형을 안 가림, 마우스 기기만 「스페이스」 키캡,
//  휴대폰 집게는 십자 판 오른쪽, 그림 단추를 누르면 「아래 … 눌러요」 알림(판은 그대로), 판으로 끝까지 한 판
async function barRun(size){
 const {ctx,p}=await open(size);const tag=`[${size} 판]`,[W,H,touch]=SIZES[size];
 await p.evaluate(()=>{claw.seen(true);claw.setCoins(30);});
 const others=async()=>[...await rect(p,'.kh-dir'),...await rect(p,'.kh-todo'),...await rect(p,'.kh-pill'),...await rect(p,'.kh-quit'),...await rect(p,'.kh-timer'),...await rect(p,'.kh-hint'),...await rect(p,'.kh-tnum')];
 const pad=8; // 판 그림자·테두리(바깥 7px)까지
 async function checkBar(name,shot){
  const bar=(await rect(p,'.kh-big.kh-bar'))[0];
  ok(`${tag} ${name}: 판 단추 보임·화면 안·44px 이상`,bar&&bar.x>=0&&bar.r<=W&&bar.b<=H&&bar.h>=44&&bar.w>=44,JSON.stringify(bar));
  if(!bar)return null;
  const big={x:bar.x-pad,y:bar.y-pad,r:bar.r+pad,b:bar.b+pad+10};
  const ov=(await others()).filter(r=>hit(big,r));ok(`${tag} ${name}: 판이 다른 단추·안내와 안 겹침`,!ov.length,ov.map(r=>r.cls).join(', '));
  const A=await p.evaluate(()=>claw.artRects());
  const cov=[];if(A.button&&hit(big,A.button))cov.push('그림 단추');if(A.display&&hit(big,A.display))cov.push('숫자판');const pc=A.plush.filter(r=>hit(big,r));if(pc.length)cov.push(`인형 ${pc.length}/${A.plush.length}`);
  ok(`${tag} ${name}: 판이 그림 단추·숫자판·인형을 안 가림`,!cov.length&&A.button,`${cov.join(', ')} 판 y ${bar.y} · 그림 단추 ${JSON.stringify(A.button)}${A.display?' 숫자판 '+JSON.stringify(A.display):''} 인형 아래 끝 ${Math.max(...A.plush.map(r=>r.b))}`);
  const key=(await rect(p,'.kh-bar kbd.kh-key')).length,txt=await p.evaluate(()=>document.querySelector('.kh-bar').innerText);
  if(touch)ok(`${tag} ${name}: 휴대폰은 키캡·키·마우스 안내 없음`,!key&&!/스페이스|Space|WASD|방향키|마우스|클릭/.test(txt),txt);
  else ok(`${tag} ${name}: PC는 「스페이스」 키캡 보임`,key===1&&/스페이스/.test(txt),txt);
  if(shot)await p.screenshot({path:`${OUT}/bar-${size}-${shot}.png`});
  return {bar,A};
 }
 async function tapArt(name){
  const A=await p.evaluate(()=>claw.artRects()),before=await p.evaluate(()=>({sub:claw.play.sub,mode:claw.play.mode}));
  const x=(A.button.x+A.button.r)/2,y=(A.button.y+A.button.b)/2;await p.mouse.click(x,y);await sl(250);
  const t=await p.evaluate(()=>{const e=document.querySelector('.kh-toast');return e.hidden?'':e.textContent;}),after=await p.evaluate(()=>({sub:claw.play.sub,mode:claw.play.mode}));
  ok(`${tag} ${name}: 그림 단추 누르면 「아래 … 눌러요」 알림·게임은 그대로`,/장식/.test(t)&&/아래/.test(t)&&(touch?!/Space/.test(t):/Space/.test(t))&&after.mode===before.mode&&after.sub===before.sub,`${t} | ${JSON.stringify(before)}→${JSON.stringify(after)}`);
  await p.screenshot({path:`${OUT}/bar-${size}-${name}-arttap.png`});
  await p.evaluate(()=>{const e=document.querySelector('.kh-toast');e.hidden=true;});
 }
 const start=async i=>{await p.evaluate(i=>claw.goMachine(i),i);await sl(900);await click(p,'.kh-big[data-act=play]');await p.waitForFunction(()=>claw.play.mode==='play',null,{timeout:8000});await sl(700);};
 const finish=async()=>{await waitResult(p,40000);await click(p,'.kh-card [data-c=stop]');await sl(500);};
 // 집게
 await start(0);
 {const r=await checkBar('집게','claw');
  if(touch&&r){const pd=await rect(p,'.kh-dir');const padR=Math.max(...pd.map(d=>d.r));ok(`${tag} 집게: 판이 십자 판 오른쪽(오른쪽 절반 쪽)`,r.bar.x>=padR+8&&(W>H||r.bar.x>=W*.4),`판 x ${r.bar.x} 십자 오른쪽 ${padR}`);}
  ok(`${tag} 집게: 남은 시간 막대`,(await rect(p,'.kh-bar .kh-tm')).length===1);}
 await tapArt('집게');
 await click(p,'.kh-big.kh-bar');await sl(300);ok(`${tag} 집게: 판을 누르면 집게가 내려감`,await p.evaluate(()=>claw.play.mode==='drop'));
 await sl(300);await checkBar('집게 내려가는 중','claw-drop');
 await finish();
 // 타이머
 await start(10);
 await checkBar('타이머 시작 전','timer-ready');
 ok(`${tag} 타이머: 판 「시작」 초록`,await p.evaluate(()=>{const b=document.querySelector('.kh-bar');return /시작/.test(b.textContent)&&b.classList.contains('kh-green');}));
 await tapArt('타이머');
 ok(`${tag} 타이머: 그림 단추를 눌러도 시작 안 됨`,await p.evaluate(()=>claw.play.status().timer.phase!=='run'));
 await click(p,'.kh-big.kh-bar');await sl(900);
 ok(`${tag} 타이머: 판을 누르면 숫자가 오르고 「멈춤」`,await p.evaluate(()=>/멈춤/.test(document.querySelector('.kh-bar').textContent)&&claw.play.status().timer.phase==='run'));
 await checkBar('타이머 도는 중','timer-run');
 await click(p,'.kh-big.kh-bar');await finish();
 // 봉
 await start(6);
 await checkBar('봉','bridge');
 await tapArt('봉');
 const b0=(await st(p)).play.claw;await holdBig(p,600);await sl(80);const b1=(await st(p)).play.claw;
 ok(`${tag} 봉: 판을 누르고 있으면 집게가 오른쪽, 떼면 멈춤`,b1.x>b0.x+.08&&b1.phase==='gap',`${JSON.stringify(b0)}→${JSON.stringify(b1)}`);
 await sl(500);await checkBar('봉 안쪽 단계','bridge-k2');
 await holdBig(p,500);await sl(100);ok(`${tag} 봉: 두 번째 누르고 떼면 내려감`,(await st(p)).mode==='drop');
 await finish();
 // 열쇠(봉과 같은 판)
 await start(13);
 await checkBar('열쇠','key');
 await holdBig(p,500);await sl(500);await holdBig(p,600);await sl(100);ok(`${tag} 열쇠: 판으로 두 번 누르고 있기 → 판정`,(await st(p)).mode==='drop');
 await finish();
 ok(`${tag} 페이지 오류 0`,!p.errs.length,p.errs.join(' | '));report.errors.push(...p.errs.map(e=>`${tag} ${e}`));
 await ctx.close();
}

try{
 if(PARTS.includes('bar'))for(const s of ONLY)await barRun(s);
 if(PARTS.includes('size'))for(const s of ONLY)await sizeRun(s);
 if(PARTS.includes('keys'))await keysRun();
 if(PARTS.includes('multi'))await multiRun();
 if(PARTS.includes('server'))await serverRun();
 if(PARTS.includes('hub'))await hubRun();
}catch(e){fails++;report.errors.push(String(e.stack??e));console.error(e);}
finally{
 report.pass=report.checks.filter(c=>c.pass).length;report.fail=fails;writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1));
 console.log(`\n통과 ${report.pass} · 실패 ${fails}`);await browser.close();await vite.close();process.exit(fails?1:0);
}
