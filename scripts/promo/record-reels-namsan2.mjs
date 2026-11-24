// 남산 릴스 2차 녹화(월드마케팅, 2026-11-22 저녁): 대표 피드백(둘이·여럿이 같이 노는 모습, 말풍선 대화, 버스 창밖, 둘이 자물쇠·야경) 반영.
// 세 편: date(둘이 「오늘 나랑 남산 갈래?」) · friends(여럿 「퇴근하고 남산 모임」) · bus(순환버스 창밖). 장면마다 새 창(동동 = 찍는 창)과 친구 창(콩이·산쟁이·야경러)을
// 로컬 함께 걷기 서버(8798)에 같이 붙여 실제 멀티로 찍는다. 화면(CDP 스크린캐스트)+소리(AudioContext) 담는 방식은 record-reels-winter.mjs와 같다.
//   node scripts/promo/record-reels-namsan2.mjs date|friends|bus [장면,...]
// 결과: artifacts/reels-winter-2026-11-22/<릴스>/raw/<장면>.mp4·.wav·.json(events). 편집은 scripts/promo/edit-reels-winter.mjs <릴스>.
// 게임 코드는 안 바꿈. 전망대 장면만 촬영용 보조광(?debug의 __scene에 PointLight)을 넣는다(밤 전망대 안이 너무 어두워 둘이 안 보임).
import {chromium} from '@playwright/test';
import {writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const argv=process.argv.slice(2),opt={},names=[];
for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--'))opt[a.slice(2)]=argv[++i];else names.push(...a.split(','));}
const reel=names.shift();if(!['date','friends','bus'].includes(reel))throw new Error('첫 인자는 date·friends·bus');
const out=opt.out??`artifacts/reels-winter-2026-11-22/${reel}/raw`;
const PORT=Number(opt.port??5188),MULTI_PORT=Number(opt.multiPort??8798),ROOM='남산-1';
const FFMPEG=['/opt/homebrew/bin/ffmpeg','/usr/local/bin/ffmpeg'].find(existsSync)??'ffmpeg';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ME='동동',FRIEND='콩이',F2='산쟁이',F3='야경러';

// ─── 소리 받기·녹화기(record-reels-winter.mjs와 같음) ───
function audioTap(){
 const connect=AudioNode.prototype.connect;window.__taps=[];
 AudioNode.prototype.connect=function(dest,...rest){const r=connect.call(this,dest,...rest);
  if(dest instanceof AudioDestinationNode){const ctx=dest.context;if(!ctx.__tap){ctx.__tap=ctx.createMediaStreamDestination();window.__taps.push(ctx);}connect.call(this,ctx.__tap,...rest);}return r;};
 window.__recStart=()=>new Promise(res=>{const ctx=window.__taps[0];if(!ctx)return res(null);window.__chunks=[];
  const rec=new MediaRecorder(ctx.__tap.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:192000});window.__rec=rec;
  rec.ondataavailable=e=>e.data.size&&window.__chunks.push(e.data);rec.onstart=()=>res(Date.now());rec.start(250);});
 window.__recStop=()=>new Promise(res=>{const rec=window.__rec;if(!rec)return res(null);rec.onstop=async()=>{const b=new Blob(window.__chunks,{type:'audio/webm'});const buf=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode(...buf.subarray(i,i+32768));res(btoa(s));};rec.stop();});
}
const drag=(page,dx,dy,ms=0)=>page.evaluate(([dx,dy,ms])=>new Promise(res=>{Element.prototype.setPointerCapture=()=>{};
 const lz=document.getElementById('look-zone'),el=lz&&getComputedStyle(lz).display!=='none'?lz:(document.getElementById('world')??document.querySelector('canvas'));
 const x=innerWidth*.72,y=innerHeight*.45,ev=(t,px,py)=>el.dispatchEvent(new PointerEvent(t,{pointerId:9,pointerType:'mouse',clientX:px,clientY:py,button:0,buttons:t==='pointerup'?0:1,bubbles:true}));
 ev('pointerdown',x,y);if(!ms){for(let i=1;i<=20;i++)ev('pointermove',x+dx*i/20,y+dy*i/20);ev('pointerup',x+dx,y+dy);return res();}
 const t0=performance.now(),step=()=>{const k=Math.min(1,(performance.now()-t0)/ms),e=k<.5?2*k*k:1-(-2*k+2)**2/2;ev('pointermove',x+dx*e,y+dy*e);if(k<1)requestAnimationFrame(step);else{ev('pointerup',x+dx,y+dy);res();}};requestAnimationFrame(step);}),[dx,dy,ms]);
const DEG=.004*180/Math.PI;
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

// ─── 남산 창 열기(함께 걷기 서버에 붙임) ───
const openContexts=new Set();
async function open(browser,name,time,{extra='',solo=false}={}){
 const context=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:UA});
 openContexts.add(context);context.on('close',()=>openContexts.delete(context));
 await context.addInitScript(()=>{if(sessionStorage.getItem('__reels'))return;sessionStorage.setItem('__reels','1');localStorage.clear();localStorage.setItem('gwanak-stick-used','1');});
 await context.addInitScript(audioTap);
 await context.route(/open-meteo\.com/,r=>r.abort());   // 대표 결정(11-13): 홍보 영상에 날씨 API 안 씀
 // 녹화에서 숨길 것: 출처 줄·이어하기 안내·인사 칩/카드(1초 서 있으면 뜸)·「○○님이 인사했어요」 띠·전망대 나가기 단추
 await context.addInitScript(()=>{const css='#source-line,.source-line,#resume-note,.gr-card,.gr-chip,.multi-toast,.ns-deck-exit{display:none!important}';const add=()=>{const s=document.createElement('style');s.textContent=css;document.head.append(s);};if(document.head)add();else document.addEventListener('DOMContentLoaded',add);});
 const page=await context.newPage();page.errors=[];page.who=name;
 page.on('pageerror',e=>page.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/WebSocket|favicon|ERR_|Failed to load resource|open-meteo/.test(m.text()))page.errors.push(m.text().slice(0,200));});
 const q=(solo?'':`multi=${encodeURIComponent(ROOM)}&server=${encodeURIComponent(`ws://127.0.0.1:${MULTI_PORT}`)}&name=${encodeURIComponent(name)}&`)+`time=${time}&weather=clear&season=autumn&quality=high&serverpick=off&pick=off${extra}`;
 await page.goto(`http://127.0.0.1:${PORT}/hiking/namsan/?${q}`);
 await page.waitForFunction(()=>window.namsan?.started,null,{timeout:240000});
 if(!solo)await page.waitForFunction(()=>window.namsan.multi()?.status==='online',null,{timeout:60000});
 await page.waitForFunction(()=>window.namsan.cityDone,null,{timeout:120000}).catch(()=>console.log('    (도심 건물 대기 초과)'));
 await sleep(1000);for(let i=0;i<2;i++){await page.evaluate(()=>{dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});await sleep(300);}
 await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 console.log(`  [${name}] 열림 ${time}${extra}`);return page;
}
const goTo=(p,x,z,h)=>p.evaluate(([x,z,h])=>window.namsan.goTo(x,z,h),[x,z,h]);
const jump=(p,s)=>p.evaluate(s=>window.namsan.jump(s),s);
const view=async(p,v)=>{if(await p.evaluate(()=>window.namsan.status().view)!==v){await p.keyboard.press('v');await sleep(600);}};
const chat=(p,text)=>p.evaluate(t=>dispatchEvent(new CustomEvent('hiking:chat-send',{detail:{text:t}})),text);
const waitSee=(p,n)=>p.waitForFunction(n=>window.namsan.multi()?.roster?.some(r=>r.name===n),n,{timeout:40000});
const hideHud=p=>p.evaluate(()=>{dispatchEvent(new CustomEvent('hiking:hud-toggle'));const s=document.createElement('style');s.textContent='.hud-restore,.hud-hint,#joystick,#section-jump,.ix-toast,.ns-toast{display:none!important}';document.head.append(s);});
const status=p=>p.evaluate(()=>{const s=window.namsan.status();return {x:+s.x.toFixed(1),z:+s.z.toFixed(1),heading:+s.heading?.toFixed?.(2),view:s.view};});
const roster=p=>p.evaluate(()=>window.namsan.multi()?.roster?.map(r=>r.name)??[]);
// 내 자리 기준으로 친구를 옆(side, +는 오른쪽)·앞(fwd)에 세운다
// status()에는 heading이 없어 3인칭 카메라 자리(내 뒤)에서 보는 방향을 구한다(카메라를 돌리기 전에 부를 것)
async function beside(me,friend,side,fwd,{face='same'}={}){await view(me,'third');await sleep(400);const s=await me.evaluate(()=>{const s=window.namsan.status(),c=window.namsan.cam();return {x:s.x,z:s.z,heading:Math.atan2(-(s.x-c[0]),-(s.z-c[2]))};});
 const h=s.heading,ux=-Math.sin(h),uz=-Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h),fh=face==='same'?h:h+Math.PI;
 // 걷는 곳 밖이면 goTo가 false — 조금씩 다른 자리를 차례로 시도
 for(const [ds,df] of [[0,0],[0,.6],[0,1.2],[-.3,.4],[.3,.4],[0,-.5],[-side*2,0],[-side*2,.6]]){const x=s.x+ux*(fwd+df)+rx*(side+ds),z=s.z+uz*(fwd+df)+rz*(side+ds);if(await goTo(friend,x,z,fh)){if(ds||df)console.log(`    (${friend.who} 자리 옮김 side ${side+ds} fwd ${fwd+df})`);return true;}}
 console.log(`    ✖ ${friend.who} 설 자리 없음`);return false;}
const SETTLE=4200;   // 순간이동 뒤 서버가 자리를 받아들이기까지(3초 고집 규칙) 기다리는 시간
async function busSetup(pages,offsetSec=8){const A=pages[0];for(const p of pages)await jump(p,2);await sleep(600);
 const stop=await A.evaluate(()=>{const c=window.namsan.interact().cands.find(c=>c.action==='bus'&&c.site.stop==='start');return {x:c.x,z:c.z};});
 const w=(await A.evaluate(()=>window.namsan.bus())).next.start.wait;for(const p of pages)await p.evaluate(([w,o])=>{window.namsan.busClockOffset=(window.namsan.busClockOffset??0)+w-o;},[w,offsetSec]);
 return stop;}

// ═══════════════ date — 둘이 「오늘 나랑 남산 갈래?」 ═══════════════
const DATE={
 // 훅: 출발 광장 늦은 오후, 콩이가 옆에서 「오늘 나랑 남산 갈래?」 → 동동 「콜! 지금 출발」
 async hook(browser){const A=await open(browser,ME,'16:30'),B=await open(browser,FRIEND,'16:30');await waitSee(A,FRIEND);
  await beside(A,B,.95,.7);await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(800);   // 오른쪽 조금 앞(뒤에 서면 화면 밖)
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('ask');await chat(B,'오늘 나랑 남산 갈래? 🍂');await sleep(4300);r.mark('reply');await chat(A,'콜! 지금 출발 🏃');await sleep(3200);
  return r.stop('hook',{in:'in',roster:await roster(A)});},
 // 같이 계단: 콩이가 옆·조금 앞, 둘 다 오르며 「계단 힘들어」 「조금만 더!」
 async stairs(browser){const A=await open(browser,ME,'16:50'),B=await open(browser,FRIEND,'16:50');await waitSee(A,FRIEND);
  await jump(A,428);await jump(B,431);await sleep(800);await beside(A,B,.9,.6);await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(600);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await A.keyboard.down('KeyW');await B.keyboard.down('KeyW');await sleep(1600);r.mark('tired');await chat(B,'계단 힘들어 😮‍💨');await sleep(4200);r.mark('more');await chat(A,'조금만 더! 거의 다 왔어');await sleep(3800);
  await A.keyboard.up('KeyW');await B.keyboard.up('KeyW');return r.stop('stairs',{in:'in',st:await status(A)});},
 // 버스: 둘이 정류장에서 기다리다 같이 타고(3인칭) → 1인칭으로 옆자리 콩이 → 창밖 경치 → 「와 경치 봐」
 async bus(browser){const A=await open(browser,ME,'16:40'),B=await open(browser,FRIEND,'16:40');await waitSee(A,FRIEND);
  const stop=await busSetup([A,B],9);await goTo(A,stop.x,stop.z,0);await goTo(B,stop.x+1.2,stop.z+.5,0);await sleep(SETTLE);await view(A,'third');await drag(A,120/DEG,0);await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('f');await A.keyboard.press('KeyF');await B.keyboard.press('KeyF');
  await A.waitForFunction(()=>window.namsan.bus?.()?.ride,null,{timeout:40000,polling:200});r.mark('ride');await sleep(1800);
  r.mark('first');await A.keyboard.press('v');await sleep(900);r.mark('friend');await drag(A,-45/DEG,0,1100);await sleep(1800);
  r.mark('window');await drag(A,-45/DEG,0,1400);await sleep(2200);r.mark('wow');await chat(B,'와 창밖 봐 🍁');await sleep(3200);await drag(A,20/DEG,0,1800);await sleep(2500);
  const i=await r.stop('bus',{in:'in',ride:await A.evaluate(()=>window.namsan.bus().ride),friendRide:await B.evaluate(()=>!!window.namsan.bus()?.ride)});return i;},
 // 사랑의 자물쇠 둘이(노을): 나란히 난간 → 콩이 걸기 → 동동 걸기(한마디 「동동 ♥ 콩이」) → 「우리 자물쇠 💛」
 async locks(browser){const A=await open(browser,ME,'17:50',{extra:'&start=summit'}),B=await open(browser,FRIEND,'17:50',{extra:'&start=summit'});await waitSee(A,FRIEND);
  const lk=await A.evaluate(()=>window.namsan.spots().spots.find(s=>s.id==='locks-summit'));const h=lk.face+Math.PI;
  await goTo(A,lk.x,lk.z,h);await goTo(B,lk.x-Math.cos(h)*.85,lk.z+Math.sin(h)*.85,h);await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(1200);r.mark('friend-hang');await B.evaluate(()=>window.namsan.lockCard({c:2,h:1,text:'콩이 ♥ 동동',hang:true}));await sleep(3000);
  r.mark('my-hang');await A.evaluate(()=>window.namsan.lockCard({c:0,h:1,text:'동동 ♥ 콩이',hang:true}));await sleep(3600);r.mark('ours');await chat(B,'우리 자물쇠 💛');await sleep(3600);
  return r.stop('locks',{in:'in',locks:await A.evaluate(()=>({count:window.namsan.locks().count,mine:window.namsan.locks().mine?.length}))});},
 // 타워 전망대(밤) 둘이 유리창 앞: 촬영용 보조광
 async deck(browser){const A=await open(browser,ME,'20:30',{extra:'&start=summit&debug=1'}),B=await open(browser,FRIEND,'20:30',{extra:'&start=summit'});await waitSee(A,FRIEND);
  for(const p of [A,B]){await p.evaluate(()=>window.namsan.towerGo('in'));await sleep(400);await p.evaluate(()=>window.namsan.towerGo('skip'));}
  for(const p of [A,B])await p.waitForFunction(()=>window.namsan.tower().inside&&!window.namsan.tower().elev,null,{timeout:20000});
  const t=await A.evaluate(()=>window.namsan.tower());const s=t.deck.scopes,b=(s[1].bearing+s[2].bearing)/2*Math.PI/180,cx={x:(s[0].x+s[2].x)/2,z:(s[0].z+s[2].z)/2};
  const R=8.5,ax=cx.x+Math.sin(b)*R,az=cx.z-Math.cos(b)*R,h=Math.atan2(-Math.sin(b),Math.cos(b));
  await A.evaluate(([x,z,h])=>window.namsan.deckGoTo(x,z,h),[ax,az,h]);await B.evaluate(([x,z,h])=>window.namsan.deckGoTo(x,z,h),[ax-Math.cos(h)*.8,az+Math.sin(h)*.8,h]);await sleep(SETTLE);
  await A.evaluate(([x,z,y])=>{const L=new window.__THREE.PointLight(0xffd9a0,1.2,14,1.2);L.position.set(x,y+2.2,z);window.__scene.add(L);},[ax-Math.sin(h)*1.5,az-Math.cos(h)*1.5,t.deck.y]);
  await view(A,'third');await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(800);r.mark('pan');await drag(A,-14/DEG,0,3200);await sleep(600);r.mark('chat');await chat(A,'타워 전망대까지 올라옴 🗼');await sleep(3200);
  return r.stop('deck',{in:'in',roster:await roster(A)});},
 // 야경 벤치 둘이(끝 장면·엔딩 배경): 동동 앉고 콩이 옆에 서서 「야경 예쁘다 ✨」 「다음엔 진짜로 가자」
 async bench(browser){const A=await open(browser,ME,'20:30',{extra:'&start=summit'}),B=await open(browser,FRIEND,'20:30',{extra:'&start=summit'});await waitSee(A,FRIEND);
  const b=(await A.evaluate(()=>window.namsan.spots().benches))[0];
  await A.evaluate(b=>{const k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)};for(const d of [.8,1.2,1.6,.5]){if(window.namsan.goTo(b.x-k.x*d,b.z-k.z*d,b.yaw))return true;}return false;},b);
  await B.evaluate(b=>{const k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)},r={x:Math.cos(b.yaw),z:-Math.sin(b.yaw)};for(const d of [1.3,1.6,1.1]){if(window.namsan.goTo(b.x+r.x*d+k.x*.3,b.z+r.z*d+k.z*.3,b.yaw))return true;}return false;},b);
  await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(600);r.mark('sit');await A.keyboard.press('KeyC');await sleep(2800);r.mark('pretty');await chat(A,'야경 예쁘다 ✨');await sleep(4300);r.mark('next');await chat(B,'다음엔 진짜로 가자');await sleep(4300);r.mark('quiet');await sleep(6500);
  return r.stop('bench',{in:'in',seat:await A.evaluate(()=>window.namsan.seat()),roster:await roster(A)});},
};

// ═══════════════ friends — 여럿 「퇴근하고 남산 모임」 ═══════════════
async function openFour(browser,time,extra=''){const A=await open(browser,ME,time,{extra}),B=await open(browser,FRIEND,time,{extra}),C=await open(browser,F2,time,{extra}),D=await open(browser,F3,time,{extra});await waitSee(A,F3);await waitSee(A,FRIEND);return [A,B,C,D];}
const FRIENDS={
 // 훅: 출발 광장에 친구 셋이 마주 서서 손 흔들기 + 「오늘 야경 보러 가요」 「같이 가요 🙌」
 async hook(browser){const [A,B,C,D]=await openFour(browser,'16:40');
  await beside(A,B,-1.7,2.4,{face:'opposite'});await beside(A,C,0,3.3,{face:'opposite'});await beside(A,D,1.7,2.4,{face:'opposite'});await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(700);r.mark('wave');for(const p of [B,C,D]){await p.keyboard.press('KeyG');await sleep(150);}await sleep(1300);r.mark('chat');await chat(C,'오늘 야경 보러 가요 🌃');await sleep(700);await chat(D,'같이 가요 🙌');await sleep(3600);
  return r.stop('hook',{in:'in',roster:await roster(A)});},
 // 계단 넷이 줄지어
 async stairs(browser){const [A,B,C,D]=await openFour(browser,'16:55');
  await jump(A,426);await jump(B,429);await jump(C,431);await jump(D,432);await sleep(800);await beside(A,B,.9,.8);await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(600);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');for(const p of [A,B,C,D])await p.keyboard.down('KeyW');await sleep(1600);r.mark('fast');await chat(B,'다들 빨라 😮‍💨');await sleep(4200);r.mark('slow');await chat(D,'천천히 와요~');await sleep(3600);
  for(const p of [A,B,C,D])await p.keyboard.up('KeyW');return r.stop('stairs',{in:'in'});},
 // 버스 넷이: 정류장에서 같이 타기 → 1인칭으로 친구들 자리·창밖
 async bus(browser){const [A,B,C,D]=await openFour(browser,'16:55');
  const stop=await busSetup([A,B,C,D],9);await goTo(A,stop.x,stop.z,0);await goTo(B,stop.x+1.1,stop.z+.4,0);await goTo(C,stop.x-1.0,stop.z+.6,0);await goTo(D,stop.x+.3,stop.z+1.3,0);await sleep(SETTLE);await view(A,'third');await drag(A,120/DEG,0);await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('f');for(const p of [A,B,C,D])await p.keyboard.press('KeyF');await sleep(700);
  for(const p of [A,B,C,D]){if(!await p.evaluate(()=>!!window.namsan.bus()?.wait)){console.log(`    (${p.who} 다시 F)`);await p.keyboard.press('KeyF');}}
  console.log('    버스',JSON.stringify(await A.evaluate(()=>({wait:!!window.namsan.bus().wait,next:window.namsan.bus().next.start}))));
  await A.waitForFunction(()=>window.namsan.bus?.()?.ride,null,{timeout:60000,polling:200});r.mark('ride');await sleep(1800);
  r.mark('first');await A.keyboard.press('v');await sleep(900);r.mark('look');await drag(A,-45/DEG,0,1200);await sleep(1600);await drag(A,-45/DEG,0,1200);await sleep(1600);r.mark('chat');await chat(C,'버스 타니까 편하다 🚌');await sleep(1600);await drag(A,-40/DEG,0,1400);await sleep(3000);
  return r.stop('bus',{in:'in',rides:await Promise.all([B,C,D].map(p=>p.evaluate(()=>!!window.namsan.bus()?.ride)))});},
 // 정상석 인증(노을): 친구들이 정상석 둘레에서 카메라를 보고, 동동이 F → 정상 인증 알림(안내판은 바로 닫음)
 async stone(browser){const [A,B,C,D]=await openFour(browser,'17:45','&start=summit');
  const stone=await A.evaluate(()=>window.namsan.spots().items.find(i=>i.kind==='summit-stone'));
  const ok=await A.evaluate(it=>{for(const [dx,dz] of [[0,2.2],[2.2,0],[-2.2,0],[0,-2.2],[1.6,1.6]]){if(window.namsan.goTo(it.x+dx,it.z+dz,Math.atan2(dx,dz)))return [dx,dz];}return null;},stone);
  const h=Math.atan2(ok[0],ok[1]);   // 정상석을 보는 방향
  const ux=-Math.sin(h),uz=-Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);const s=await A.evaluate(()=>window.namsan.status());
  await goTo(B,s.x+ux*1.2+rx*-1.4,s.z+uz*1.2+rz*-1.4,h+Math.PI);await goTo(C,s.x+ux*1.2+rx*1.4,s.z+uz*1.2+rz*1.4,h+Math.PI);await goTo(D,s.x+ux*.3+rx*2.3,s.z+uz*.3+rz*2.3,h+Math.PI);await sleep(SETTLE);await view(A,'third');await sleep(1000);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('f');await A.keyboard.press('KeyF');await sleep(500);await A.keyboard.press('Escape');await sleep(900);r.mark('wave');for(const p of [B,C,D]){await p.keyboard.press('KeyG');await sleep(120);}await sleep(900);r.mark('chat');await chat(C,'정상 인증 📸');await sleep(600);await chat(B,'다 같이 찍자!');await sleep(3800);
  return r.stop('stone',{in:'in',st:await A.evaluate(()=>({stamps:window.namsan.status().stamps}))});},
 // 야경 벤치 여럿(끝·엔딩 배경): 동동 앉고 친구들이 둘레에 서서 수다
 async bench(browser){const [A,B,C,D]=await openFour(browser,'20:30','&start=summit');
  const b=(await A.evaluate(()=>window.namsan.spots().benches))[0];
  await A.evaluate(b=>{const k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)};for(const d of [.8,1.2,1.6,.5]){if(window.namsan.goTo(b.x-k.x*d,b.z-k.z*d,b.yaw))return true;}return false;},b);
  const place=(p,side,fwd)=>p.evaluate(([b,side,fwd])=>{const k={x:Math.sin(b.yaw),z:Math.cos(b.yaw)},r={x:Math.cos(b.yaw),z:-Math.sin(b.yaw)};for(const d of [0,.3,-.3]){if(window.namsan.goTo(b.x+r.x*(side+d)+k.x*fwd,b.z+r.z*(side+d)+k.z*fwd,b.yaw))return true;}return false;},[b,side,fwd]);
  await place(B,1.3,.3);await place(C,-1.4,.2);await place(D,2.5,-.4);await sleep(SETTLE);await view(A,'third');await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(600);r.mark('sit');await A.keyboard.press('KeyC');await sleep(2600);r.mark('chat');await chat(C,'야경 미쳤다 ✨');await sleep(2600);await chat(D,'내일 또 올 사람?');await sleep(2400);await chat(B,'나! 🙋');await sleep(4200);r.mark('quiet');await sleep(6500);
  return r.stop('bench',{in:'in',seat:await A.evaluate(()=>window.namsan.seat()),roster:await roster(A)});},
};

// ═══════════════ bus — 순환버스 창밖(혼자) ═══════════════
const BUS={
 // 정류장에서 버스 오는 것(3인칭) → 타기 → 1인칭 창밖 길게(왼쪽 창 → 더 왼쪽 → 오른쪽 창)
 async ride(browser){const A=await open(browser,ME,'16:45',{solo:true});
  const stop=await busSetup([A],9);await goTo(A,stop.x,stop.z,0);await sleep(600);await view(A,'third');await drag(A,120/DEG,0);await hideHud(A);await sleep(800);
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(900);r.mark('f');await A.keyboard.press('KeyF');
  await A.waitForFunction(()=>window.namsan.bus?.()?.ride,null,{timeout:40000,polling:200});r.mark('ride');await sleep(2200);
  r.mark('first');await A.keyboard.press('v');await sleep(800);r.mark('left');await drag(A,-70/DEG,0,1500);await sleep(4500);r.mark('left2');await drag(A,-50/DEG,0,1500);await sleep(4000);r.mark('right');await drag(A,160/DEG,0,2200);await sleep(4500);r.mark('front');await drag(A,-60/DEG,0,1500);await sleep(3500);
  return r.stop('ride',{in:'in',ride:await A.evaluate(()=>window.namsan.bus().ride)});},
 // 정상 정류장 도착(건너뛰기로 바로 내림) → 전망탑 쪽으로 걷기(노을)
 async arrive(browser){const A=await open(browser,ME,'17:20',{solo:true});
  const stop=await busSetup([A],9);await goTo(A,stop.x,stop.z,0);await sleep(400);await A.keyboard.press('KeyF');await A.waitForFunction(()=>window.namsan.bus?.()?.ride,null,{timeout:40000,polling:200});await sleep(1500);
  await view(A,'third');await hideHud(A);await A.addStyleTag({content:'#summit{display:none!important}'});   // 정상 정류장에 내리면 완등 카드가 화면을 덮어 녹화에선 숨김
  const r=await recorder(A);await r.start();await sleep(300);r.mark('in');await sleep(600);r.mark('off');await A.keyboard.press('KeyR');await sleep(1800);r.mark("walk");await A.keyboard.down("KeyW");await sleep(6500);await A.keyboard.up("KeyW");await sleep(800);
  return r.stop('arrive',{in:'in',st:await status(A)});},
};

const SHOTS={date:DATE,friends:FRIENDS,bus:BUS}[reel];
export const SHOT_ORDER=Object.keys(SHOTS);
mkdirSync(out,{recursive:true});
const {createServer}=await import('vite');
const vite=await createServer({server:{port:PORT,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const {startServer}=await import('../../server/multi-server.mjs');
const srv=startServer({PORT:String(MULTI_PORT),HOST:'127.0.0.1',DATA_DIR:`${out}/multi-data`,ALLOWED_ORIGINS:`http://127.0.0.1:${PORT}`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal','--autoplay-policy=no-user-gesture-required']});
const done={},failed={};
try{for(const id of names.length?names:SHOT_ORDER){if(!SHOTS[id])throw new Error(`장면 없음: ${id} (있는 것: ${SHOT_ORDER.join(',')})`);
 console.log(`● ${reel}/${id}`);
 for(let tryNo=1;tryNo<=2;tryNo++){try{done[id]=await SHOTS[id](browser);delete failed[id];break;}catch(e){failed[id]=e.message;console.log(`  ✖ ${id} (${tryNo}번째): ${e.message.split('\n')[0]}`);}finally{for(const c of [...openContexts])await c.close().catch(()=>{});}}
}}finally{await browser.close();srv.close?.();await vite.close();rmSync(`${out}/multi-data`,{recursive:true,force:true});}
console.log(JSON.stringify({done:Object.keys(done),failed},null,1));if(Object.keys(failed).length)process.exitCode=1;
