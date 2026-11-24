// 겨울 릴스 장면 녹화(월드마케팅, 2026-11-22): 남산(온라인 등산)·온라인 크리스마스를 휴대폰 세로 1080×1920(360×640 ×3)으로 장면마다 새 창을 열어
// 조작을 재생하고, 화면(CDP 스크린캐스트)과 게임 소리(AudioContext → MediaRecorder)를 같이 담는다. scripts/reels-record.mjs(관악산 릴스)와 같은 방식·같은 결과 형식.
//   node scripts/promo/record-reels-winter.mjs namsan|christmas [장면,...] [--out artifacts/reels-winter-2026-11-22/<릴스>/raw]
// 개발 서버(5188)와 크리스마스용 로컬 멀티 서버(8798)는 이 스크립트가 직접 띄웠다가 끝나면 닫는다. 공개 서버·터널은 쓰지 않는다.
// 결과: <out>/<장면>.mp4(30fps, 0초 = 녹화 시작), <장면>.wav, <장면>.json(조작 시각 events). 편집은 scripts/promo/edit-reels-winter.mjs.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const argv=process.argv.slice(2),opt={},names=[];
for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--'))opt[a.slice(2)]=argv[++i];else names.push(...a.split(','));}
const reel=names.shift();if(!['namsan','christmas'].includes(reel))throw new Error('첫 인자는 namsan 또는 christmas');
const out=opt.out??`artifacts/reels-winter-2026-11-22/${reel}/raw`;
const PORT=Number(opt.port??5188),MULTI_PORT=Number(opt.multiPort??8798),ROOM='릴스';
const FFMPEG=['/opt/homebrew/bin/ffmpeg','/usr/local/bin/ffmpeg'].find(existsSync)??'ffmpeg';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// ─── 공통: 소리 받기(reels-record.mjs와 같음) ───
function audioTap(){
 const connect=AudioNode.prototype.connect;window.__taps=[];
 AudioNode.prototype.connect=function(dest,...rest){const r=connect.call(this,dest,...rest);
  if(dest instanceof AudioDestinationNode){const ctx=dest.context;if(!ctx.__tap){ctx.__tap=ctx.createMediaStreamDestination();window.__taps.push(ctx);}connect.call(this,ctx.__tap,...rest);}return r;};
 window.__recStart=()=>new Promise(res=>{const ctx=window.__taps[0];if(!ctx)return res(null);window.__chunks=[];
  const rec=new MediaRecorder(ctx.__tap.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:192000});window.__rec=rec;
  rec.ondataavailable=e=>e.data.size&&window.__chunks.push(e.data);rec.onstart=()=>res(Date.now());rec.start(250);});
 window.__recStop=()=>new Promise(res=>{const rec=window.__rec;if(!rec)return res(null);rec.onstop=async()=>{const b=new Blob(window.__chunks,{type:'audio/webm'});const buf=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode(...buf.subarray(i,i+32768));res(btoa(s));};rec.stop();});
}
// 시선 끌기(손가락 끌기와 같음). ms>0이면 천천히(가속·감속). 남산·크리스마스 모두 #look-zone 또는 #world/캔버스에 pointer 이벤트.
const drag=(page,dx,dy,ms=0,sel=null)=>page.evaluate(([dx,dy,ms,sel])=>new Promise(res=>{Element.prototype.setPointerCapture=()=>{};
 const lz=sel?document.querySelector(sel):document.getElementById('look-zone'),el=lz&&getComputedStyle(lz).display!=='none'?lz:(document.getElementById('world')??document.querySelector('canvas'));
 const x=innerWidth*.72,y=innerHeight*.45,ev=(t,px,py)=>el.dispatchEvent(new PointerEvent(t,{pointerId:9,pointerType:'mouse',clientX:px,clientY:py,button:0,buttons:t==='pointerup'?0:1,bubbles:true}));
 ev('pointerdown',x,y);if(!ms){for(let i=1;i<=20;i++)ev('pointermove',x+dx*i/20,y+dy*i/20);ev('pointerup',x+dx,y+dy);return res();}
 const t0=performance.now(),step=()=>{const k=Math.min(1,(performance.now()-t0)/ms),e=k<.5?2*k*k:1-(-2*k+2)**2/2;ev('pointermove',x+dx*e,y+dy*e);if(k<1)requestAnimationFrame(step);else{ev('pointerup',x+dx,y+dy);res();}};requestAnimationFrame(step);}),[dx,dy,ms,sel]);
const DEG_PER_PX=.004*180/Math.PI;   // 등산 input.js 끌기 감도(가로)

const openContexts=new Set();
async function openPage(browser,{path,query,storage={},label}){
 const context=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:UA});
 await context.addInitScript(storage=>{if(sessionStorage.getItem('__reels'))return;sessionStorage.setItem('__reels','1');localStorage.clear();for(const [k,v] of Object.entries(storage))localStorage.setItem(k,v);},storage);
 openContexts.add(context);context.on('close',()=>openContexts.delete(context));
 await context.addInitScript(audioTap);
 await context.route(/open-meteo\.com/,r=>r.abort());   // 대표 결정(11-13): 홍보 영상에 날씨 API 안 씀
 await context.addInitScript(()=>{const css='#source-line,.source-line,[data-pk-now]{visibility:hidden!important}';const add=()=>{const s=document.createElement('style');s.textContent=css;document.head.append(s);};if(document.head)add();else document.addEventListener('DOMContentLoaded',add);});
 const page=await context.newPage();page.errors=[];
 page.on('pageerror',e=>page.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/WebSocket|favicon|ERR_|Failed to load resource|open-meteo/.test(m.text()))page.errors.push(m.text().slice(0,200));});
 await page.goto(`http://127.0.0.1:${PORT}${path}?${query}`);
 console.log(`  [${label}] 열기 ${path}?${query}`);
 return {context,page};
}
const unlockSound=page=>page.evaluate(()=>{dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});

// ─── 녹화기(reels-record.mjs와 같음) ───
async function recorder(page){
 const cdp=await page.context().newCDPSession(page),frames=[];let t0=null,events={};
 let live=true;cdp.on('Page.screencastFrame',f=>{if(live)frames.push({t:f.metadata.timestamp*1000,data:f.data});cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});});
 return {
  async start(){await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1080,maxHeight:1920,everyNthFrame:1});t0=Date.now();const a=await page.evaluate(()=>window.__recStart());this.audioT0=a;await sleep(200);},
  mark(name){events[name]=(Date.now()-t0)/1000;console.log(`    · ${name} ${events[name].toFixed(2)}s`);},
  async stop(id,meta={}){const audio=await page.evaluate(()=>window.__recStop());await cdp.send('Page.stopScreencast');await sleep(200);live=false;
   return save(id,{frames,t0,audioT0:this.audioT0,audio,events,meta,errors:page.errors});},
 };
}
function ff(args){const r=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-y',...args],{stdio:['ignore','inherit','inherit']});if(r.status)throw new Error(`ffmpeg 실패: ${args.join(' ')}`);}
function save(id,{frames,t0,audioT0,audio,events,meta,errors}){
 if(!frames.length)throw new Error(`${id}: 프레임 없음`);
 const dir=`${out}/${id}-frames`;rmSync(dir,{recursive:true,force:true});mkdirSync(dir,{recursive:true});
 const list=[];frames.forEach((f,i)=>{const file=`${String(i).padStart(5,'0')}.jpg`;writeFileSync(`${dir}/${file}`,Buffer.from(f.data,'base64'));
  const start=i===0?t0:f.t,end=i+1<frames.length?frames[i+1].t:f.t+100;list.push(`file '${file}'`,`duration ${Math.max(.001,(end-start)/1000).toFixed(4)}`);});
 list.push(`file '${String(frames.length-1).padStart(5,'0')}.jpg'`);writeFileSync(`${dir}/list.txt`,list.join('\n'));
 const span=(frames.at(-1).t+100-t0)/1000,fps=frames.length/((frames.at(-1).t-frames[0].t)/1000||1);
 ff(['-f','concat','-safe','0','-i',`${dir}/list.txt`,'-vf','fps=30,scale=1080:1920:flags=lanczos,format=yuv420p','-c:v','libx264','-preset','medium','-crf','14','-r','30',`${out}/${id}.mp4`]);
 if(audio){writeFileSync(`${out}/${id}.webm`,Buffer.from(audio,'base64'));const lag=Math.max(0,(audioT0-t0));
  ff(['-i',`${out}/${id}.webm`,'-af',`adelay=${lag}|${lag},apad`,'-t',span.toFixed(3),'-ar','48000','-ac','2',`${out}/${id}.wav`]);rmSync(`${out}/${id}.webm`);}
 else ff(['-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',span.toFixed(3),`${out}/${id}.wav`]);
 rmSync(dir,{recursive:true,force:true});
 const info={id,seconds:+span.toFixed(2),captureFps:+fps.toFixed(1),frames:frames.length,audio:!!audio,audioLagMs:audio?audioT0-t0:null,events,...meta,errors};
 writeFileSync(`${out}/${id}.json`,JSON.stringify(info,null,1));console.log(`  ✔ ${id} ${info.seconds}s · 캡처 ${info.captureFps}fps · 소리 ${info.audio?'있음':'없음'} · 오류 ${errors.length}`);return info;
}

// ═══════════════ 남산 (온라인 등산 /hiking/namsan/) ═══════════════
const NS={
 q:(time,extra='')=>`time=${time}&weather=clear&season=autumn&quality=high&serverpick=off&pick=off${extra}`,
 storage:{'gwanak-stick-used':'1'},
 async open(browser,label,time,extra=''){const r=await openPage(browser,{path:'/hiking/namsan/',query:NS.q(time,extra),storage:NS.storage,label});
  await r.page.waitForFunction(()=>window.namsan?.started,null,{timeout:240000});
  await r.page.waitForFunction(()=>window.namsan.cityDone,null,{timeout:120000}).catch(()=>console.log('    (도심 건물 대기 초과)'));
  await sleep(1200);await unlockSound(r.page);await sleep(300);await unlockSound(r.page);await r.page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));return r;},
 face:(page,bearing)=>page.evaluate(b=>{const s=window.namsan.status();window.namsan.goTo(s.x,s.z,-b*Math.PI/180);},bearing),
 view:async(page,view)=>{if(await page.evaluate(()=>window.namsan.status().view)!==view){await page.keyboard.press('v');await sleep(600);}},
 hideHud:page=>page.evaluate(()=>{dispatchEvent(new CustomEvent('hiking:hud-toggle'));const s=document.createElement('style');s.textContent='.hud-restore,.hud-hint,#joystick,#source-line,.source-line,#section-jump,.ix-toast,.ns-toast,#resume-note{display:none!important}';document.head.append(s);}),
 hideToast:page=>page.evaluate(()=>{const s=document.createElement('style');s.textContent='#resume-note{display:none!important}';document.head.append(s);}),
 status:page=>page.evaluate(()=>{const s=window.namsan.status();return {s:Math.round(s.s),view:s.view,x:+s.x.toFixed(1),z:+s.z.toFixed(1),stamps:s.stamps,gadget:s.gadget,rows:s.interact?.view?.rows?.map(r=>r.label)??null};}),
};
const NS_SHOTS={
 // 훅(0–3): 밤 정상 야경 벤치에 앉은 동동이 + 서울 불빛(HUD 없음), 천천히 옆으로 훑기
 async hook(browser){const {page,context}=await NS.open(browser,'hook','20:30','&start=summit');
  const b=(await page.evaluate(()=>window.namsan.spots().benches))[0];
  await page.evaluate(b=>{const k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)};for(const d of [.8,1.2,1.6,.5]){if(window.namsan.goTo(b.x-k.x*d,b.z-k.z*d,b.yaw))return true;}return false;},b);
  await NS.view(page,'third');await sleep(500);await page.keyboard.press('KeyC');await sleep(2500);await NS.hideHud(page);await sleep(800);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await drag(page,-22/DEG_PER_PX,0,4200);await sleep(400);
  const i=await r.stop('hook',{in:'in',seat:await page.evaluate(()=>!!window.namsan.seat?.())});await context.close();return i;},
 // 노을 정상 전망탑(엔딩 뒷배경): 3인칭 동동이 + 탑, 올려다보며 천천히 돈다
 async dusk(browser){const {page,context}=await NS.open(browser,'dusk','17:15','&start=summit');
  await NS.view(page,'third');await NS.face(page,118);await sleep(300);await drag(page,0,45);await sleep(500);await NS.hideHud(page);await sleep(900);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await drag(page,30/DEG_PER_PX,0,6500);await sleep(400);
  const i=await r.stop('dusk',{in:'in',st:await NS.status(page)});await context.close();return i;},
 // 산 고르기(관악산 옆 남산 카드) → ▶ 오르기 → 남산 페이지로
 async pick(browser){const {page,context}=await openPage(browser,{path:'/hiking/',query:'pick=on&serverpick=off&time=12:30&weather=clear&season=autumn',storage:NS.storage,label:'pick'});
  await page.waitForSelector('[data-pk-go="namsan"]',{timeout:60000});await sleep(1500);
  await page.evaluate(()=>{const b=document.querySelector('[data-pk-go="namsan"]');b.closest('article')?.scrollIntoView({block:'end'});});await sleep(800);   // 남산 카드를 아래에, 자막은 위 띠
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(1800);r.mark('click');await page.tap('[data-pk-go="namsan"]');await sleep(1500);
  const i=await r.stop('pick',{in:'in'});await context.close();return i;},
 // 백범광장 출발(3인칭, 늦은 오후), W로 직진
 async start(browser){const {page,context}=await NS.open(browser,'start','16:40');await NS.hideToast(page);
  await page.evaluate(()=>window.namsan.jump(24));await sleep(1500);   // 출발 스탬프함 앞 판이 안 뜨게 조금 지나서
  await NS.view(page,'third');await sleep(500);const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await page.keyboard.down('KeyW');await sleep(4600);await page.keyboard.up('KeyW');
  const i=await r.stop('start',{in:'in',st:await NS.status(page)});await context.close();return i;},
 // 성곽 큰 계단(s=430) 3인칭, W 오르다가 잠깐 뒤돌아보기
 async stairs(browser){const {page,context}=await NS.open(browser,'stairs','16:50');await NS.hideToast(page);
  await page.evaluate(()=>window.namsan.jump(430));await sleep(2500);await NS.view(page,'third');await sleep(500);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await page.keyboard.down('KeyW');await sleep(1800);
  r.mark('look-back');await drag(page,-150/DEG_PER_PX,0,1100);await sleep(600);await drag(page,150/DEG_PER_PX,0,1100);await sleep(800);await page.keyboard.up('KeyW');
  const i=await r.stop('stairs',{in:'in',st:await NS.status(page)});await context.close();return i;},
 // 순환버스: 정류장에서 기다리다 타고 정상까지(버스 시계를 옮겨 5초 안에 오게)
 async bus(browser){const {page,context}=await NS.open(browser,'bus','17:05');await NS.hideToast(page);
  const stop=await page.evaluate(()=>{const c=window.namsan.interact().cands.find(c=>c.action==='bus'&&c.site.stop==='start');return {x:c.x,z:c.z};});
  await page.evaluate(()=>window.namsan.jump(2));await sleep(600);
  const w=(await page.evaluate(()=>window.namsan.bus())).next.start.wait;await page.evaluate(w=>{window.namsan.busClockOffset=(window.namsan.busClockOffset??0)+w-7;},w);
  await page.evaluate(s=>window.namsan.goTo(s.x,s.z,0),stop);await sleep(300);await NS.view(page,'third');await drag(page,120/DEG_PER_PX,0);await sleep(1200);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(1200);r.mark('f');await page.keyboard.press('KeyF');
  await page.waitForFunction(()=>window.namsan.bus?.()?.ride,null,{timeout:30000,polling:200});r.mark('ride');await sleep(9000);
  const i=await r.stop('bus',{in:'in',ride:await page.evaluate(()=>window.namsan.bus().ride)});await context.close();return i;},
 // 약수 한 모금(s≈ 쉼터 앞 약수터) F → 동작
 async spring(browser){const {page,context}=await NS.open(browser,'spring','17:20');await NS.hideToast(page);
  const sp=await page.evaluate(()=>window.namsan.spots().spots.find(s=>s.id==='spring-1'));
  await page.evaluate(()=>window.namsan.jump(770));await sleep(1500);await page.evaluate(sp=>window.namsan.goTo(sp.x,sp.z,sp.face+Math.PI),sp);await sleep(300);await NS.view(page,'third');await sleep(1200);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('f');await page.keyboard.press('KeyF');await sleep(4200);
  const i=await r.stop('spring',{in:'in',st:await NS.status(page)});await context.close();return i;},
 // 정상석 F → 정상 인증·스탬프 알림 + 안내판(밤, 가로등)
 async stone(browser){const {page,context}=await NS.open(browser,'stone','19:40','&start=summit');await NS.hideToast(page);
  const stone=await page.evaluate(()=>window.namsan.spots().items.find(i=>i.kind==='summit-stone'));
  await page.evaluate(it=>{for(const [dx,dz] of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[1.2,1.2],[-1.2,-1.2]])if(window.namsan.goTo(it.x+dx,it.z+dz))return true;return false;},stone);
  await page.evaluate(it=>{const s=window.namsan.status();window.namsan.goTo(s.x,s.z,Math.atan2(-(it.x-s.x),-(it.z-s.z)));},stone);await NS.view(page,'third');await sleep(1200);
  // F → 안내판은 0.5초 뒤 바로 닫고(화면을 다 덮음) 정상 인증 알림·동작·스탬프만 보인다
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('f');await page.keyboard.press('KeyF');await sleep(500);r.mark('close');await page.keyboard.press('Escape');await sleep(3800);
  const i=await r.stop('stone',{in:'in',st:await NS.status(page)});await context.close();return i;},
 // 사랑의 자물쇠: F → 카드(색·모양 고르기) → 걸기
 async locks(browser){const {page,context}=await NS.open(browser,'locks','20:00','&start=summit');await NS.hideToast(page);
  const lk=await page.evaluate(()=>window.namsan.spots().spots.find(s=>s.id==='locks-summit'));
  await page.evaluate(lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await NS.view(page,'third');await sleep(1200);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(800);r.mark('f');await page.keyboard.press('KeyF');await sleep(1600);
  r.mark('color');await page.tap('.ns-lock-colors button[data-c="4"]');await sleep(600);await page.tap('.ns-lock-shape button[data-h="1"]');await sleep(700);
  r.mark('hang');await page.tap('[data-lk="hang"]');await sleep(3200);
  const i=await r.stop('locks',{in:'in',locks:await page.evaluate(()=>({mine:window.namsan.locks().mine.length,x:window.namsan.locks().x}))});await context.close();return i;},
 // 쌍안경(B): 정상에서 관악산 쪽 이름표(낮·맑음)
 async bino(browser){const {page,context}=await NS.open(browser,'bino','15:30','&start=summit');await NS.hideToast(page);
  const lk=await page.evaluate(()=>window.namsan.spots().spots.find(s=>s.id==='locks-summit'));await page.evaluate(lk=>window.namsan.goTo(lk.x,lk.z,0),lk);
  await page.addStyleTag({content:'.ix-focus{display:none!important}'});
  await page.keyboard.press('KeyB');await sleep(1200);
  for(let i=0;i<12;i++){const t=await page.evaluate(()=>window.namsan.interact().bino?.tape?.find(t=>t.short==='관악산')??null);
   if(t){await page.evaluate(d=>{const s=window.namsan.status(),b=window.namsan.interact().bino.bearing+d;window.namsan.goTo(s.x,s.z,-b*Math.PI/180);},t.delta);await sleep(400);if(Math.abs(t.delta)<1)break;continue;}
   await page.evaluate(()=>{const s=window.namsan.status(),b=window.namsan.interact().bino.bearing+40;window.namsan.goTo(s.x,s.z,-b*Math.PI/180);});await sleep(350);}
  await page.keyboard.press('Escape');await sleep(800);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(500);r.mark('b');await page.keyboard.press('KeyB');await sleep(2600);
  r.mark('pan');await drag(page,-70,0,1200);await sleep(1500);
  const i=await r.stop('bino',{in:'in',bino:await page.evaluate(()=>window.namsan.status().interact.bino)});await context.close();return i;},
 // 야경 벤치: C로 앉기(밤, 전망탑 불빛), 엔딩 뒷배경
 async bench(browser){const {page,context}=await NS.open(browser,'bench','20:30','&start=summit');await NS.hideToast(page);
  const b=(await page.evaluate(()=>window.namsan.spots().benches))[0];
  await page.evaluate(b=>{const k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)};for(const d of [.8,1.2,1.6,.5]){if(window.namsan.goTo(b.x-k.x*d,b.z-k.z*d,b.yaw))return true;}return false;},b);
  await NS.view(page,'third');await sleep(1000);console.log('    벤치 줄',JSON.stringify((await NS.status(page)).rows));
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(700);r.mark('sit');await page.keyboard.press('KeyC');await sleep(2500);r.mark('seated');await sleep(4500);
  const i=await r.stop('bench',{in:'in',seat:await page.evaluate(()=>window.namsan.seat?.()??null)});await context.close();return i;},
};

// ═══════════════ 온라인 크리스마스 (/christmas/) ═══════════════
const XP={look:JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:false,zones:['fight','snowman','sled','fire']}),
 friendLook:JSON.stringify({look:{outfit:'elf',hat:'antlers'},wardrobe:[],tip:false,zones:['fight','snowman','sled','fire']})};
const X={
 async open(browser,label,{name='동동',spot=null,friend=false,solo=false}={}){
  const q=solo?`capture=1&serverpick=off${spot?`&spot=${spot}`:''}`:`capture=1&multi=${encodeURIComponent(ROOM)}&server=${encodeURIComponent(`ws://127.0.0.1:${MULTI_PORT}`)}&name=${encodeURIComponent(name)}${spot?`&spot=${spot}`:''}`;
  const r=await openPage(browser,{path:'/christmas/',query:q,storage:{'xmas-world:v1':friend?XP.friendLook:XP.look},label});
  await r.page.waitForFunction(()=>window.xmas?.status,null,{timeout:180000});
  if(!solo)await r.page.waitForFunction(()=>window.xmas.multi.state==='online',null,{timeout:60000});
  await sleep(1200);await unlockSound(r.page);await sleep(300);await unlockSound(r.page);
  await r.page.evaluate(()=>{const s=document.createElement('style');s.textContent='.xh-toast{display:none!important}';document.head.append(s);});   // 안내 알림 글은 녹화에서 숨김
  return r;},
 tp:(page,x,z,h)=>page.evaluate(([x,z,h])=>{window.xmas.teleport(x,z,h);window.xmas.cam.yaw=h;},[x,z,h]),
 spot:(page,id)=>page.evaluate(id=>{const s=window.xmas.travel.spots.find(s=>s.id===id);window.xmas.teleport(s.x,s.z,s.heading);window.xmas.cam.yaw=s.heading;return s;},id),
 press:async(page,id)=>{const sel=`.xh-acts [data-act="${id}"]`;await page.waitForSelector(sel,{timeout:8000});await page.tap(sel);},
 hideHud:page=>page.evaluate(()=>{const s=document.createElement('style');s.id='reels-hide';s.textContent='.xh,.uf-tr,.xt,.joy,.uf-sheet,.hc-bubbles,.uf-chatbar,.xs-alt{display:none!important}';document.head.append(s);}),
 st:page=>page.evaluate(()=>{const s=window.xmas.status();return {player:s.player,actions:s.actions,tree:s.tree,fight:s.fight,sled:{mode:s.sled.mode,s:s.sled.s},sky:{mode:s.sky.mode,alt:s.sky.alt,stars:s.sky.stars},people:s.multi.people?.length,audio:s.audio.unlocked};}),
 seeFriend:async(main,friendName)=>{await main.waitForFunction(n=>window.xmas.multi.people().some(p=>p.name===n),friendName,{timeout:20000});},
};
const X_SHOTS={
 // 훅: 하늘 썰매를 타고 눈마을 위를 날아 트리 쪽으로(HUD 없음, 별 흔적)
 async hook(browser){const {page,context}=await X.open(browser,'hook',{solo:true,spot:'sky'});
  await X.press(page,'hs:board');await sleep(1300);await X.press(page,'hs:up');await sleep(3200);await page.keyboard.down('Space');await sleep(2600);await page.keyboard.up('Space');
  await page.evaluate(()=>{const x=window.xmas,t=x.sky.team;x.cam.yaw=Math.atan2(-(0-t.x),-(0-t.z));});await X.hideHud(page);await sleep(400);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await page.keyboard.down('KeyW');await sleep(5200);await page.keyboard.up('KeyW');
  const i=await r.stop('hook',{in:'in',st:await X.st(page)});await context.close();return i;},
 // 트리 꾸미기: 친구도 옆에. 장식 달기 → 빈 자리 누름 → 달기
 async tree(browser){const A=await X.open(browser,'tree-A',{name:'동동'}),B=await X.open(browser,'tree-B',{name:'눈사람러버',friend:true});
  await X.seeFriend(A.page,'눈사람러버');await X.tp(B.page,2.2,5.2,-.3);await X.tp(A.page,0,4.6,0);await sleep(1500);
  const r=await recorder(A.page);await r.start();await sleep(300);r.mark('in');await sleep(700);r.mark('deco');await X.press(A.page,'tree:deco');await sleep(1600);
  const slot=await A.page.evaluate(()=>{for(let y=200;y<420;y+=10)for(let x=50;x<310;x+=10){const s=window.xmas.pickSlot(x,y);if(s!==null)return {x,y,s};}return null;});
  if(!slot)throw new Error('트리 빈 자리를 못 찾음');
  await A.page.tap('.xh-kinds [data-kind="ballRed"]').catch(()=>{});await sleep(500);r.mark('slot');await A.page.touchscreen.tap(slot.x,slot.y);await sleep(900);r.mark('confirm');await A.page.tap('.xh-confirm [data-x="confirm"]');await sleep(1800);
  // 하나 더(금빛 공)
  const slot2=await A.page.evaluate(()=>{for(let y=240;y<440;y+=10)for(let x=180;x<330;x+=10){const s=window.xmas.pickSlot(x,y);if(s!==null)return {x,y,s};}return null;});
  if(slot2){await A.page.tap('.xh-kinds [data-kind="ballGold"]').catch(()=>{});await sleep(400);r.mark('slot2');await A.page.touchscreen.tap(slot2.x,slot2.y);await sleep(800);await A.page.tap('.xh-confirm [data-x="confirm"]');await sleep(1600);}
  const i=await r.stop('tree',{in:'in',st:await X.st(A.page),slot,slot2});await A.context.close();await B.context.close();return i;},
 // 눈싸움: 친구가 먼저 던져 동동이가 맞음(눈투성이) → 동동이가 되던짐
 async fight(browser){const A=await X.open(browser,'fight-A',{name:'동동'}),B=await X.open(browser,'fight-B',{name:'눈사람러버',friend:true});
  await X.seeFriend(A.page,'눈사람러버');
  // 눈싸움 마당(SNOWBALL_YARD x −34.5~−21.5, z −5.5~9.5) 안에서 둘이 5m 마주 봄. 동쪽 x −19.2에는 모닥불과 가르는 눈벽이 있어 그 밖에 서면 안 맞음.
  await X.tp(A.page,-31,3,-Math.PI/2);await X.tp(B.page,-26,3,Math.PI/2);await sleep(2000);
  await B.page.evaluate(()=>{const x=window.xmas;x.cam.yaw=Math.PI/2;});await A.page.evaluate(()=>{window.xmas.cam.yaw=-Math.PI/2;});await sleep(300);
  console.log('    마당 안 단추',JSON.stringify((await X.st(A.page)).actions),JSON.stringify((await X.st(B.page)).actions));
  const r=await recorder(A.page);await r.start();await sleep(300);r.mark('in');await sleep(1000);
  r.mark('friend-throw');await B.page.keyboard.press('KeyF');await sleep(1800);r.mark('hit');await sleep(1200);
  r.mark('throw');await A.page.keyboard.press('KeyF');await sleep(1800);r.mark('throw2');await A.page.keyboard.press('KeyF');await sleep(2200);
  const i=await r.stop('fight',{in:'in',st:await X.st(A.page),friend:await X.st(B.page)});await A.context.close();await B.context.close();return i;},
 // 눈썰매: 출발대 → 타기 → 출발 → 내려가기(◀▶ 조금)
 async sled(browser){const {page,context}=await X.open(browser,'sled',{solo:true,spot:'sled'});await sleep(800);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(700);r.mark('board');await X.press(page,'sled:board');await sleep(1200);r.mark('go');await X.press(page,'sled:go');
  await page.waitForFunction(()=>window.xmas.status().sled.mode==='ride',null,{timeout:8000});r.mark('ride');await sleep(2500);
  await page.keyboard.down('KeyA');await sleep(500);await page.keyboard.up('KeyA');await sleep(1200);await page.keyboard.down('KeyD');await sleep(600);await page.keyboard.up('KeyD');await sleep(4500);
  const i=await r.stop('sled',{in:'in',st:await X.st(page)});await context.close();return i;},
 // 회전목마 타기 + 만세
 async carousel(browser){const {page,context}=await X.open(browser,'carousel',{solo:true,spot:'carousel'});await sleep(800);
  await page.evaluate(()=>{window.xmas.carousel.goTo();window.xmas.cam.yaw=0;window.xmas.cam.pitch=.3;window.xmas.cam.dist=7;});await sleep(1000);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(600);r.mark('ride');await X.press(page,'mg:ride');await sleep(2200);r.mark('cheer');await X.press(page,'mg:cheer').catch(()=>{});await sleep(3200);
  const i=await r.stop('carousel',{in:'in',st:await X.st(page)});await context.close();return i;},
 // 스케이트장: 들어가서 미끄러지기
 async rink(browser){const {page,context}=await X.open(browser,'rink',{solo:true,spot:'rink'});await sleep(800);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await sleep(500);r.mark('in-rink');await X.press(page,'rk:in');await sleep(1500);
  r.mark('skate');await page.keyboard.down('KeyW');await sleep(1500);await drag(page,60/DEG_PER_PX,0,1500);await sleep(1200);await page.keyboard.up('KeyW');await sleep(1500);
  const i=await r.stop('rink',{in:'in',st:await X.st(page)});await context.close();return i;},
 // 모닥불: 친구 옆에 앉아 손 녹이기, 친구가 채팅 "메리 크리스마스!"
 async fire(browser){const A=await X.open(browser,'fire-A',{name:'동동'}),B=await X.open(browser,'fire-B',{name:'눈사람러버',friend:true});
  await X.seeFriend(A.page,'눈사람러버');
  const F=await A.page.evaluate(()=>window.xmas.travel.spots.find(s=>s.id==='fire'));
  await X.tp(B.page,F.x+1.2,F.z+1.4,F.heading);await sleep(800);await X.press(B.page,'fire:sit').catch(()=>{});await sleep(2500);
  await X.tp(A.page,F.x,F.z,F.heading);await sleep(1500);
  const r=await recorder(A.page);await r.start();await sleep(300);r.mark('in');await sleep(600);r.mark('sit');await X.press(A.page,'fire:sit');await sleep(3000);
  r.mark('warm');await X.press(A.page,'fire:warm').catch(()=>{});await sleep(800);r.mark('chat');await B.page.evaluate(()=>dispatchEvent(new CustomEvent('hiking:chat-send',{detail:{text:'메리 크리스마스! 🎄'}})));await sleep(3500);
  const i=await r.stop('fire',{in:'in',st:await X.st(A.page)});await A.context.close();await B.context.close();return i;},
 // 엔딩 뒷배경: 하늘에서 마을 내려다보기(천천히)
 async night(browser){const {page,context}=await X.open(browser,'night',{solo:true,spot:'sky'});
  await X.press(page,'hs:board');await sleep(1300);await X.press(page,'hs:up');await sleep(3200);await page.keyboard.down('Space');await sleep(3000);await page.keyboard.up('Space');
  await page.evaluate(()=>{const x=window.xmas,t=x.sky.team;x.cam.yaw=Math.atan2(-(0-t.x),-(0-t.z));});await X.hideHud(page);await sleep(500);
  const r=await recorder(page);await r.start();await sleep(300);r.mark('in');await page.keyboard.down('KeyW');await sleep(7000);await page.keyboard.up('KeyW');
  const i=await r.stop('night',{in:'in',st:await X.st(page)});await context.close();return i;},
};

const SHOTS=reel==='namsan'?NS_SHOTS:X_SHOTS;
export const SHOT_ORDER=Object.keys(SHOTS);

mkdirSync(out,{recursive:true});
const {createServer}=await import('vite');
const vite=await createServer({server:{port:PORT,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
let srv=null;
if(reel==='christmas'){const {startServer}=await import('../../server/multi-server.mjs');srv=startServer({PORT:String(MULTI_PORT),HOST:'127.0.0.1',DATA_DIR:`${out}/multi-data`,ALLOWED_ORIGINS:`http://127.0.0.1:${PORT}`},{quiet:true});await srv.ready;}
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal','--autoplay-policy=no-user-gesture-required']});
const done={},failed={};
try{for(const id of names.length?names:SHOT_ORDER){if(!SHOTS[id])throw new Error(`장면 없음: ${id} (있는 것: ${SHOT_ORDER.join(',')})`);
 console.log(`● ${reel}/${id}`);
 for(let tryNo=1;tryNo<=2;tryNo++){try{done[id]=await SHOTS[id](browser);delete failed[id];break;}catch(e){failed[id]=e.message;console.log(`  ✖ ${id} (${tryNo}번째): ${e.message.split('\n')[0]}`);}finally{for(const c of [...openContexts])await c.close().catch(()=>{});}}
}}finally{await browser.close();srv?.close?.();await vite.close();rmSync(`${out}/multi-data`,{recursive:true,force:true});}
console.log(JSON.stringify({done:Object.keys(done),failed},null,1));if(Object.keys(failed).length)process.exitCode=1;
