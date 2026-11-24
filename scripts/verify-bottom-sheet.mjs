// 공통 바텀시트(11-24, ui-sheet.js) 점검: 7종 창 × 휴대폰 세로 390×844·가로 844×390·PC 1280×720. vite·함께 걷기 서버를 스스로 띄움.
//  창마다: 자리(세로 = 위 64px만 남김·짧은 창은 내용 높이 / 가로 = 오른쪽 판 340 / PC = 원래 모양), 뒤 어둡게(40·15·0%),
//  휴대폰: 조금 끌면 제자리·25% 넘게 끌면 닫힘·빠르게 튕기면 닫힘·글 중간에서 아래로 쓸면 글만 넘어감·바깥 누르면 닫힘,
//  PC: ✕ 옆 Esc 표시·Esc로 닫힘·바깥 클릭 닫힘. ☰는 탭을 바꿔도 높이 같음, 인형뽑기 판 진행 중엔 ☰가 안 열림. 페이지 오류 0.
//  node scripts/verify-bottom-sheet.mjs   (ONLY=hiking,smoking,christmas,claw,hub  SIZES=portrait,landscape,pc) → artifacts/bottom-sheet/*.png + report.json
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const OUT=process.env.OUT_DIR||ROOT+'/artifacts/bottom-sheet';mkdirSync(OUT,{recursive:true});
const req=createRequire(ROOT+'/package.json');
const pw=await import(req.resolve('@playwright/test'));const chromium=pw.chromium??pw.default.chromium;
const {createServer}=await import(req.resolve('vite'));
const {startServer}=await import(ROOT+'/server/multi-server.mjs');
const VP=+(process.env.VITE_PORT||5397),WP=+(process.env.WS_PORT||8897);
const vite=await createServer({root:ROOT,configFile:ROOT+'/vite.config.js',cacheDir:'/tmp/bsheet/.vite',server:{port:VP,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const srv=startServer({PORT:String(WP),HOST:'127.0.0.1',DATA_DIR:'/tmp/bsheet/data'},{quiet:true});await srv.ready;
const ws=encodeURIComponent('ws://127.0.0.1:'+WP),base=`http://127.0.0.1:${VP}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SIZES={portrait:[390,844,true],landscape:[844,390,true],pc:[1280,720,false]};
const ONLY=(process.env.ONLY??'hiking,smoking,christmas,claw,hub').split(','),SZ=(process.env.SIZES??'portrait,landscape,pc').split(',');
const report={at:new Date().toISOString(),checks:[],errors:[]};let fails=0;
const ok=(name,pass,detail='')=>{report.checks.push({name,pass:!!pass,detail});if(!pass){fails++;console.log('✖',name,detail);}else console.log('✓',name,typeof detail==='string'?detail:'');};
const C={
 hiking:{url:`/hiking/?multi=${encodeURIComponent('관악-1')}&name=a&server=${ws}&start=entrance&time=13:00&weather=clear&quality=low`,
  init:()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');},ready:()=>window.hiking?.started&&window.hiking.multi?.()?.status==='online'},
 smoking:{url:`/smoking/?capture=1&time=day&multi=${encodeURIComponent('옥상-1')}&server=${ws}&name=a`,
  init:()=>{localStorage.clear();localStorage.setItem('online-smoking',JSON.stringify({nickname:'동동',status:'quit',outfit:'shirt',seenIntro:true,muted:true,quitDate:'2026-11-01'}));},ready:()=>window.lounge?.multi?.state==='online'},
 christmas:{url:`/christmas/?capture=1&multi=${encodeURIComponent('눈마을-1')}&server=${ws}&name=a`,
  init:()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));},ready:()=>window.xmas?.multi?.state==='online'},
 claw:{url:'/claw/',init:()=>{localStorage.clear();},ready:()=>window.claw&&window.claw.fps>0},
 hub:{url:'/',init:()=>{localStorage.clear();},ready:()=>!!document.querySelector('.hb')},
};
async function open(name,size){
 const [w,h,touch]=SIZES[size];const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(`if(!sessionStorage.getItem('__k')){(${C[name].init})();sessionStorage.setItem('__k','1');}`);
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.goto(base+C[name].url);await p.waitForFunction(C[name].ready,null,{timeout:180000});await sl(1500);
 p.cdp=touch?await ctx.newCDPSession(p):null;return {ctx,p};
}
const info=(p,sel)=>p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>!x.hidden&&!x.closest('[hidden]'))??null;if(!e)return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
 const sc=e.classList.contains('hb-sheet')?e.closest('.hb-sheet-back'):e.previousElementSibling?.classList.contains('ufs-scrim')?e.previousElementSibling:null;
 const sco=sc?(sc.classList.contains('ufs-scrim')?+getComputedStyle(sc).opacity:(()=>{const m=getComputedStyle(sc).backgroundColor.match(/[\d.]+/g);return m?.length===4?+m[3]:sc.hidden?0:1;})()):null;
 const g=e.querySelector(':scope>.ufs-grip'),gr=g?.getBoundingClientRect(),esc=e.querySelector('.ufs-esc');
 return {mode:e.dataset.ufsMode,short:'ufsShort' in e.dataset,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),r:Math.round(r.right),b:Math.round(r.bottom),z:cs.zIndex,scrim:sco,
  grip:gr&&gr.width?{x:Math.round(gr.x+gr.width/2),y:Math.round(gr.y+gr.height/2)}:null,esc:!!esc&&getComputedStyle(esc).display!=='none',W:innerWidth,H:innerHeight,translate:e.style.translate};},sel);
const isOpen=(p,sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].some(x=>!x.hidden&&!x.closest('[hidden]')&&x.getBoundingClientRect().width>0),sel);
async function swipe(p,x,y,dx,dy,ms=240,steps=10){
 const c=p.cdp;await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=steps;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/steps,y:y+dy*i/steps}]});await sl(ms/steps);}
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
const tap=async(p,x,y)=>{await p.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await sl(40);await p.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
// 한 창 점검. openFn: 창 열기, sel: 창 선택자, o: {tall, label, scrollSel(안쪽 글), outside:[x,y] 함수}
async function sheet(p,size,label,sel,openFn,o={}){
 const tag=`[${size}] ${label}`,[W,H,touch]=SIZES[size];
 await openFn();await sl(500);
 let i=await info(p,sel);ok(`${tag}: 열림`,!!i,JSON.stringify(i));if(!i)return;
 const want=size==='portrait'?'bottom':size==='landscape'?'side':'pc';ok(`${tag}: 자리 방식 ${want}`,i.mode===want,i.mode);
 if(want==='bottom'){ok(`${tag}: 화면 바닥에 붙음`,Math.abs(i.b-H)<=1,`${i.b}`);
  if(o.tall||!i.short)ok(`${tag}: 위 64px만 남김(높이 ${i.h} = ${(i.h/H*100).toFixed(0)}%)`,Math.abs(i.y-64)<=2,`top ${i.y}`);
  else ok(`${tag}: 짧은 창 = 내용 높이(화면 절반 아래)`,i.h<H*.5&&i.y>64,`h ${i.h}`);
  ok(`${tag}: 뒤 40% 어둡게`,Math.abs(i.scrim-.4)<.03,String(i.scrim));ok(`${tag}: 손잡이 보임`,!!i.grip);}
 if(want==='side'){ok(`${tag}: 오른쪽 판(위아래 꽉·폭 340)`,i.r===W&&i.y===0&&i.b===H&&Math.abs(i.w-340)<=2,JSON.stringify([i.x,i.y,i.w,i.h]));ok(`${tag}: 뒤 15% 어둡게`,Math.abs(i.scrim-.15)<.03,String(i.scrim));ok(`${tag}: 세로 손잡이 보임`,!!i.grip);}
 if(want==='pc'){ok(`${tag}: PC 뒤 안 어둡게`,!i.scrim,String(i.scrim));if(o.esc!==false)ok(`${tag}: ✕ 옆 Esc 표시`,i.esc);}
 if(want!=="pc")ok(`${tag}: 시트가 위층(z ≥ 46)`,+i.z>=46,i.z);
 await p.screenshot({path:`${OUT}/${label.replace(/[^\w가-힣]+/g,'_')}-${size}.png`});
 if(o.tabs){const hs=[];for(const t of o.tabs){await p.evaluate(t=>document.querySelector(`.uf-tab[data-uf-tab=${t}]`)?.click(),t);await sl(200);hs.push((await info(p,sel)).h);}ok(`${tag}: 탭을 바꿔도 높이 같음`,new Set(hs).size===1,hs.join(','));}
 if(touch){
  const along=want==='side'?(d=>[d,0]):(d=>[0,d]),G=i.grip,size_=want==='side'?i.w:i.h;
  await swipe(p,G.x,G.y,...along(size_*.12),300);await sl(450);i=await info(p,sel);ok(`${tag}: 조금(12%) 끌면 제자리`,!!i&&!i.translate,JSON.stringify(i&&[i.y,i.translate]));
  await swipe(p,G.x,G.y,...along(size_*.35),300);await sl(500);ok(`${tag}: 35% 끌면 닫힘`,!await isOpen(p,sel));
  await openFn();await sl(500);i=await info(p,sel);
  await swipe(p,i.grip.x,i.grip.y,...along(70),0,2);await sl(500);ok(`${tag}: 빠르게 튕기면 닫힘(70px·0.05초)`,!await isOpen(p,sel),JSON.stringify(await p.evaluate(s=>document.querySelector(s)?._ufs?.last,sel)));
  await openFn();await sl(500);
  if(o.scrollSel&&want==='bottom'){const sc=await p.evaluate(s=>{const e=document.querySelector(s);if(!e||e.scrollHeight<=e.clientHeight+20)return null;e.scrollTop=Math.min(120,(e.scrollHeight-e.clientHeight)/2);const r=e.getBoundingClientRect();return {top:e.scrollTop,x:r.x+r.width/2,y:r.y+r.height*.4};},o.scrollSel);
   if(sc){await swipe(p,sc.x,sc.y,0,90,300);await sl(400);const after=await p.evaluate(s=>document.querySelector(s).scrollTop,o.scrollSel);ok(`${tag}: 글 중간에서 아래로 쓸면 글만 넘어감(창은 그대로)`,await isOpen(p,sel)&&after<sc.top,`${sc.top}→${after}`);}
   else ok(`${tag}: (안쪽 글이 짧아 스크롤 충돌 점검 건너뜀)`,true);}
  const [ox,oy]=o.outside?.(W,H)??(want==='side'?[120,H/2]:[W/2,36]);await tap(p,ox,oy);await sl(450);ok(`${tag}: 바깥 누르면 닫힘`,!await isOpen(p,sel));
 }else{
  if(o.esc!==false){await p.keyboard.press('Escape');await sl(300);ok(`${tag}: Esc로 닫힘`,!await isOpen(p,sel));await openFn();await sl(400);}
  if(o.outsideClick!==false){await p.mouse.click(...(o.outside?.(W,H)??[200,H/2]));await sl(400);ok(`${tag}: 바깥 클릭 닫힘`,!await isOpen(p,sel));}
  if(await isOpen(p,sel))await p.keyboard.press('Escape');
 }
}
const menu=p=>()=>p.evaluate(()=>{if(!document.querySelector('.uf-sheet:not([hidden])'))document.querySelector('.uf-menu-btn').click();});
for(const name of ONLY)for(const size of SZ){
 if(name==='hub'&&size==='pc'){ok('[pc] 허브: PC는 지도 옆 판(바텀시트 아님) — 건너뜀',true);continue;}
 let ctx,p;try{({ctx,p}=await open(name,size));}catch(e){ok(`[${size}] ${name} 열기`,false,String(e).slice(0,200));continue;}
 try{
  if(name!=='hub')await sheet(p,size,`${name} ☰ 메뉴`,'.uf-sheet',menu(p),{tall:true,scrollSel:'.uf-body',tabs:await p.evaluate(()=>[...document.querySelectorAll('.uf-tab')].map(b=>b.dataset.ufTab))});
  if(name==='hiking')await sheet(p,size,'등산 사람 목록','.pw-sheet',()=>p.evaluate(()=>{if(document.querySelector('.pw-sheet').hidden)document.querySelector('.pw-btn').click();}),{outside:(W,H)=>size==='portrait'?[W/2,30]:[100,H-30]});
  if(name==='christmas'){
   await sheet(p,size,'크리스마스 바로가기 지도','.xt-map',()=>p.evaluate(()=>{if(document.querySelector('.xt-map').hidden)document.querySelector('.xt-map-btn').click();}),{tall:true});
   await sheet(p,size,'크리스마스 받은 선물','.xg-inbox',async()=>{await p.evaluate(()=>{if(!document.querySelector('.xg-inbox').hidden)return;document.querySelector('.uf-menu-btn').click();document.querySelector('.uf-tab[data-uf-tab=mail]').click();});await sl(200);await p.evaluate(()=>document.querySelector('[data-mail=inbox]')?.click());});
   ok(`[${size}] 크리스마스 사람 목록·옷 = ☰ 탭 안(위 ☰ 점검에 포함)`,await p.evaluate(()=>!!document.querySelector('.uf-panel .xh-sheet[data-sheet=people]')&&!!document.querySelector('.uf-panel .xh-sheet[data-sheet=outfit]')));
  }
  if(name==='claw'){
   await p.evaluate(()=>{claw.seen(true);claw.setCoins(30);claw.goMachine(0);});await sl(900);await p.evaluate(()=>document.querySelector('.kh-big[data-act=play]').click());await p.waitForFunction(()=>claw.play.mode==='play');
   await p.evaluate(()=>{claw.hud.frame.open('set');document.querySelector('.kh-pill').click();});await sl(300);
   ok(`[${size}] 인형뽑기 판 진행 중엔 ☰ 시트가 안 열림(알약 눌러도)`,!await isOpen(p,'.uf-sheet')&&!!await p.$('.kh-bar'));
   await p.screenshot({path:`${OUT}/claw-playing-${size}.png`});
  }
  if(name==='hub'){
   await sheet(p,size,'허브 체험 판','.hb-sheet',async()=>{await p.evaluate(()=>{if(!document.querySelector('.hb-sheet-back:not([hidden])'))document.querySelector('.hb-card[data-open]').click();});},{tall:true,scrollSel:'.hb-sheet',esc:false});
  }
  ok(`[${size}] ${name}: 페이지 오류 0`,!p.errs.length,p.errs.join(' | ').slice(0,300));report.errors.push(...p.errs.map(e=>`${name} ${size} ${e}`));
 }catch(e){ok(`[${size}] ${name} 점검 중 오류`,false,String(e).slice(0,300));}
 await ctx.close();
}
report.pass=report.checks.filter(c=>c.pass).length;report.fail=fails;writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1));
console.log(`\n통과 ${report.pass} · 실패 ${fails}`);await browser.close();await vite.close();srv.close?.();process.exit(fails?1:0);
