// 온라인 크리스마스 광장 점검(월드개발, 2026-11-16): 서버(MULTI_PORT 8791)·vite(PORT 5199)를 이 스크립트가 띄우고 끝나면 닫는다(5173·8787은 건드리지 않음).
// 브라우저 2개(PC 1920×1080 '하나', 휴대폰 390×844 '둘') + 봇 28명(Node WebSocket) = 광장 30명(11-17 대표 결정 정원 30).
//  ① 30명이 서로 보임(PC는 모두 동동이, 휴대폰은 가까운 6명 동동이 + 나머지 가벼운 동동이) ② 31번째는 full ③ 말풍선·채팅
//  ④ 같은 말 세 번째는 막힘(repeat)·입력칸에 글이 남음 ⑤ 음소거하면 모습·말이 사라짐 ⑥ 트리 장식이 모두에게 보임·별 40개 열림
//  ⑦ 나중에 온 사람(세 번째 브라우저)도 같은 트리 ⑧ 모두 나가고 TREE_RESET_MS 뒤 다시 들어오면 빈 트리 ⑨ 서버가 꺼지면 화면이 깨지지 않고 트리 유지
//  ⑩ 서버 주소가 죽었을 때 서버 고르기 창은 '서버에 연결할 수 없어요' + 혼자 둘러보기 → 혼자 장식 달기
//   node scripts/verify-christmas-world.mjs → artifacts/christmas-world/*.png, report.json (실패가 있으면 종료 코드 1)
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {TREE_RULES} from '../src/christmas/tree-state.js';

const dir='artifacts/christmas-world',multiPort=Number(process.env.MULTI_PORT??8791),room='눈마을-1',RESET_MS=4000;mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5199);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
let srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`,TREE_RESET_MS:String(RESET_MS)},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,260));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ── 봇: 광장을 천천히 도는 사람. 3초마다 이름 묻기(j), 10Hz 위치
function bot(i,{name=`눈송이봇${i}`,cx=0,cz=6,r=4+i%5*1.6}={}){
 const ws=new WebSocket(wsUrl),b={i,name,ws,got:[],id:null,full:false,open:false,closed:false};
 const outfits=['santa','sweater','elf'],hats=['','santa','antlers','beanie','elf'];
 let t=i*.7,seq=0,timer=null;
 ws.onopen=()=>{b.open=true;ws.send(JSON.stringify({t:'hello',exp:'christmas',room,name}));};
 ws.onmessage=e=>{const m=JSON.parse(e.data);b.got.push(m);
  if(m.t==='welcome'){b.id=m.id;ws.send(JSON.stringify({t:'act',a:{o:outfits[i%3],hat:hats[i%5],sc:i%4===0?1:0,d:0}}));
   const pos=(f=0)=>{const a=t*.25+i,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r*.6;seq=(seq+1)&0xffff;ws.send(JSON.stringify({t:'s',q:seq,z:0,x:+x.toFixed(2),y:+z.toFixed(2),h:+(a+Math.PI/2).toFixed(2),v:1,f}));};
   pos(4);timer=setInterval(()=>{t+=.1;pos();},100);
   b.j=setInterval(()=>ws.send(JSON.stringify({t:'j'})),3000);}
  if(m.t==='full')b.full=true;};
 ws.onclose=()=>{b.closed=true;clearInterval(timer);clearInterval(b.j);};
 b.say=text=>ws.send(JSON.stringify({t:'c',text}));
 b.send=m=>ws.send(JSON.stringify(m));
 b.close=()=>{clearInterval(timer);clearInterval(b.j);try{ws.close();}catch{}};
 return b;
}
const until=async(fn,ms=15000,step=100)=>{const end=Date.now()+ms;while(Date.now()<end){if(await fn())return true;await sleep(step);}return false;};

async function open(name,vp,{query=`multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`,look=null,wait='online'}={}){
 const mobile=vp.width<900;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(([look])=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:look??{outfit:'santa'},wardrobe:['antlers','stripe'],tip:true}));
  window.__ev=[];for(const t of ['xmas:chat','xmas:chat-limit','xmas:multi-status'])addEventListener(t,e=>window.__ev.push({type:t,...e.detail}));},[look]);
 const p=await ctx.newPage();p.ctx=ctx;p.label=name;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&${query}`);
 if(wait==='online')await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 else await p.waitForFunction(()=>!!window.xmas,null,{timeout:120000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());

try{
 // ── ① 30명
 const A=await open('하나',{width:1920,height:1080},{look:{outfit:'elf',hat:'antlers'}});
 const B=await open('둘',{width:390,height:844},{look:{outfit:'sweater',scarf:'stripe'}});
 const bots=[];for(let i=0;i<28;i++){bots.push(bot(i));await sleep(40);}
 await until(()=>bots.every(b=>b.id),15000);
 await A.evaluate(()=>window.xmas.teleport(.6,10.6,Math.PI));await B.evaluate(()=>window.xmas.teleport(.2,13.4,0));
 await until(async()=>(await st(A)).multi.people.filter(p=>p.shown).length===29&&(await st(B)).multi.people.filter(p=>p.shown).length===29,30000);
 await sleep(2500);
 const sa=await st(A),sb=await st(B);
 const bodies=s=>s.multi.people.reduce((o,p)=>(o[p.body]=(o[p.body]??0)+1,o),{});
 check('① PC: 다른 사람 29명이 모두 동동이로 보임',sa.multi.people.filter(p=>p.shown).length===29&&bodies(sa).dongdong===29,{bodies:bodies(sa),count:sa.multi.people.length});
 check('① 휴대폰: 29명 보임(가까운 6명 동동이 + 나머지 가벼운 동동이)',sb.multi.people.filter(p=>p.shown).length===29&&bodies(sb).dongdong===6&&bodies(sb).lite===23,{bodies:bodies(sb)});
 const chip=await A.evaluate(()=>document.querySelector('.xh-place')?.textContent);
 check('① 연결 칩 30/30',/눈마을 광장 1서버 ·\s*30\/30/.test(chip),{chip});
 const lookB=sa.multi.people.find(p=>p.name==='둘')?.look;
 check('① 상대 옷이 그 사람이 고른 옷(act)',lookB?.outfit==='sweater'&&lookB?.scarf==='stripe',{lookB});
 // 움직임: 봇 위치가 바뀌는지
 const p0=(await st(A)).multi.people.find(p=>p.name==='눈송이봇3');await sleep(1200);const p1=(await st(A)).multi.people.find(p=>p.name==='눈송이봇3');
 check('① 다른 사람 움직임이 보임',p0&&p1&&Math.hypot(p1.x-p0.x,p1.z-p0.z)>.3,{p0,p1});
 // ── ② 31번째
 const extra=bot(99,{name:'늦은봇'});await until(()=>extra.full||extra.id,5000);
 check('② 31번째 접속은 꽉 참(full)',extra.full&&!extra.id,{full:extra.full});extra.close();

 // ── ③ 말풍선·채팅
 await A.evaluate(()=>{const f=document.querySelector('.hc-panel form');window.xmas.chat.open();f.elements.text.value='메리 크리스마스! 🎄';f.requestSubmit();});
 // 봇은 광장을 돌아다니므로(30명) 휴대폰 화면 안에 보이는 봇이 말하게 한다(화면 밖 말풍선은 원래 숨김)
 const ids=bots.map(b=>b.id),vis=await B.evaluate(ids=>ids.findIndex(id=>{const p=window.xmas.screenPos(id);return p?.visible&&p.y>120&&p.y<innerHeight-200&&p.x>40&&p.x<innerWidth-40;}),ids);
 bots[vis>=0?vis:2].say('트리 예뻐요');
 await until(()=>B.evaluate(()=>window.__ev.filter(e=>e.type==='xmas:chat').length>=2),8000);
 await sleep(300);
 const bub=await B.evaluate(()=>[...document.querySelectorAll('.hc-bub')].filter(b=>b.style.display!=='none').map(b=>b.textContent));
 check('③ 휴대폰에 하나·봇 말풍선',bub.some(t=>t.includes('메리 크리스마스'))&&bub.some(t=>t.includes('트리 예뻐요')),{bub});
 await A.evaluate(()=>window.xmas.chat.close());
 await sleep(400);
 await A.screenshot({path:`${dir}/pc-plaza-20.png`});await B.screenshot({path:`${dir}/mobile-plaza-20.png`});

 // ── ④ 같은 말 반복: 세 번째는 막히고 입력칸에 남음(2초 간격 지켜 보냄)
 const rep='눈 온다';
 for(let k=0;k<3;k++){await sleep(2100);await A.evaluate(t=>{const f=document.querySelector('.hc-panel form');f.elements.text.value=t;f.requestSubmit();},rep);}
 await until(()=>A.evaluate(()=>window.__ev.some(e=>e.type==='xmas:chat-limit'&&e.reason==='repeat')),5000);
 const repState=await A.evaluate(()=>({input:document.querySelector('.hc-panel input').value,hint:document.querySelector('.hc-hint')?.textContent,mine:window.__ev.filter(e=>e.type==='xmas:chat'&&e.me&&e.text==='눈 온다').length}));
 check('④ 같은 말 세 번째는 막힘·글이 입력칸에 남음',repState.mine===2&&repState.input==='눈 온다'&&/연속 두 번/.test(repState.hint),repState);
 // 30초 쉬기: 봇이 빠르게 연타 → 3번 막히면 mute
 const flood=bots[5];for(let k=0;k<8;k++){flood.say(`도배${k}`);await sleep(60);}
 await sleep(300);const lim=flood.got.filter(m=>m.t==='c-limit');
 check('④ 계속 막히면 30초 쉬기(mute)',lim.some(m=>m.reason==='mute'&&m.wait===30),{limits:lim.map(m=>m.reason)});
 await A.evaluate(()=>window.xmas.chat.close());

 // ── ⑤ 음소거(둘이 하나를 음소거 → 하나의 몸·말이 둘 화면에서 사라짐)
 const idA=(await st(A)).multi.id;
 await B.evaluate(id=>window.xmas.multi.mute(id),idA);await sleep(2200);
 await A.evaluate(()=>{const f=document.querySelector('.hc-panel form');f.elements.text.value='음소거 시험';f.requestSubmit();});
 await sleep(1200);
 const mutedView=await B.evaluate(id=>{const p=window.xmas.multi.status().people.find(x=>x.id===id);return {shown:p?.shown,body:p?.body,chat:window.__ev.some(e=>e.type==='xmas:chat'&&e.text==='음소거 시험'),tag:[...document.querySelectorAll('.xh-tag')].some(t=>t.textContent.includes('하나'))};},idA);
 check('⑤ 음소거한 사람은 모습·이름표·말이 모두 안 보임',!mutedView.shown&&mutedView.body==='none'&&!mutedView.chat&&!mutedView.tag,mutedView);
 await B.evaluate(id=>window.xmas.multi.unmute(id),idA);await sleep(800);
 const unm=await B.evaluate(id=>window.xmas.multi.status().people.find(x=>x.id===id)?.shown,idA);
 check('⑤ 음소거 풀면 다시 보임',unm===true,{});

 // ── ⑥ 트리: 하나가 장식 모드에서 3개 → 둘 화면에도. 1분 3개 제한
 await A.evaluate(()=>{window.xmas.teleport(0,4.6,0);window.xmas.decorate(true);});await sleep(1500);
 for(const [s,k] of [[3,'ballRed'],[10,'bell'],[22,'candy']])await A.evaluate(([s,k])=>window.xmas.treePlay.put(s,k),[s,k]);
 await A.evaluate(()=>window.xmas.treePlay.put(30,'gift'));
 await until(()=>B.evaluate(()=>window.xmas.treePlay.count===3),5000);
 const tb=await B.evaluate(()=>({count:window.xmas.treePlay.count,s3:window.xmas.treePlay.state.slot(3),drawn:window.xmas.village.tree.lightStage}));
 const toastA=await A.evaluate(()=>document.querySelector('.xh-toast')?.textContent);
 check('⑥ 장식 3개가 다른 사람 화면에도 보임',tb.count===3&&tb.s3?.k==='ballRed'&&tb.s3?.n==='하나',tb);
 check('⑥ 1분에 4번째는 막힘',/1분에 3개/.test(toastA),{toastA});
 // 다른 사람 머리 위 🎄(꾸미는 중)
 const decoTag=await B.evaluate(()=>window.xmas.multi.people().find(p=>p.name==='하나')?.decorating);
 check('⑥ 꾸미는 사람은 다른 화면에서 🎄 표시',decoTag===true,{});
 await A.screenshot({path:`${dir}/pc-decorate.png`});
 // 봇들이 37개 더(각자 3개씩) → 40개, 별 열림 → 봇이 별
 let slot=40;for(const b of bots.slice(0,13))for(let k=0;k<3&&slot<TREE_RULES.slots;k++){b.send({t:'tree:put',slot:slot++,k:['ballGold','ballBlue','snowflake','gift'][k%4]});}
 await until(()=>B.evaluate(()=>window.xmas.treePlay.count>=40),8000);
 bots[0].send({t:'tree:star'});
 await until(()=>B.evaluate(()=>!!window.xmas.treePlay.star),5000);
 const t40=await B.evaluate(()=>({count:window.xmas.treePlay.count,stage:window.xmas.treePlay.stage,star:window.xmas.treePlay.star?.n,drawnStar:window.xmas.village.tree.star,drawnStage:window.xmas.village.tree.lightStage}));
 check('⑥ 40개·전구 2단계·꼭대기 별(봇0)',t40.count===42&&t40.stage===2&&t40.star==='눈송이봇0'&&t40.drawnStar&&t40.drawnStage===2,t40);

 // 휴대폰 장식 모드: 자리 고르기 → [달기]
 await B.evaluate(()=>{window.xmas.teleport(1,4.8,0);window.xmas.decorate(true);});await sleep(1600);
 const tapped=await B.evaluate(()=>{for(let y=220;y<520;y+=16)for(let x=60;x<340;x+=16){const s=window.xmas.pickSlot(x,y);if(s!==null)return {x,y,s};}return null;});
 if(tapped){await B.touchscreen.tap(tapped.x,tapped.y);await sleep(500);}
 const conf=await B.evaluate(()=>!document.querySelector('.xh-confirm').hidden);
 await B.screenshot({path:`${dir}/mobile-decorate-confirm.png`});
 if(conf)await B.click('.xh-ok');
 await until(()=>A.evaluate(n=>window.xmas.treePlay.count===n,t40.count+1),5000);
 check('⑥ 휴대폰: 빈 자리 누름 → [달기] → 모두에게 보임',conf&&(await A.evaluate(()=>window.xmas.treePlay.count))===t40.count+1,{tapped,conf});
 await B.evaluate(()=>window.xmas.decorate(false));await A.evaluate(()=>window.xmas.decorate(false));

 // ── ⑦ 나중에 온 사람(봇 하나 내보내고 세 번째 브라우저)
 bots[17].close();await sleep(600);
 const C=await open('셋',{width:1280,height:760});
 await until(()=>C.evaluate(()=>window.xmas.treePlay.count>0),5000);
 const tc=await C.evaluate(()=>({count:window.xmas.treePlay.count,star:window.xmas.treePlay.star?.n,s3:window.xmas.treePlay.state.slot(3)?.k,stage:window.xmas.village.tree.lightStage}));
 check('⑦ 나중에 온 사람도 같은 트리(개수·별·자리)',tc.count===t40.count+1&&tc.star==='눈송이봇0'&&tc.s3==='ballRed'&&tc.stage===2,tc);
 await C.evaluate(()=>window.xmas.teleport(0,9,0));await sleep(1500);
 await C.screenshot({path:`${dir}/pc-late-joiner-tree.png`});

 // ── ⑨ 서버가 꺼지면: 화면 유지·트리 그대로·혼자 보기 칩
 const before=await A.evaluate(()=>window.xmas.treePlay.count);
 for(const b of bots)b.close();
 await srv.close();
 await until(()=>A.evaluate(()=>['reconnecting','offline','connecting'].includes(window.xmas.multi.state)),8000);
 await sleep(1500);
 const down=await A.evaluate(()=>({state:window.xmas.multi.state,count:window.xmas.treePlay.count,people:window.xmas.multi.people().length,chip:document.querySelector('.xh-place').textContent,fps:window.xmas.fps}));
 const r=await A.evaluate(()=>window.xmas.treePlay.put(70,'bell'));
 const toastDown=await A.evaluate(()=>document.querySelector('.xh-toast')?.textContent);
 check('⑨ 서버가 꺼져도 트리 유지·다른 사람 사라짐·화면 계속',down.count===before&&down.people===0&&down.fps>5,down);
 check('⑨ 다시 연결 중 누른 장식은 버리고 안내',r.ok===false&&/연결이 돌아오면/.test(toastDown),{r,toastDown});
 await A.screenshot({path:`${dir}/pc-server-down.png`});

 // ── ⑧ 서버를 다시 켬 → 모두 나간 뒤 RESET_MS 지나면 빈 트리
 for(const p of [A,B,C])await p.ctx.close();
 srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`,TREE_RESET_MS:String(RESET_MS)},{quiet:true});await srv.ready;
 const D=await open('넷',{width:1280,height:760});
 for(const [s,k] of [[1,'ballRed'],[2,'ballGold']])await D.evaluate(([s,k])=>window.xmas.treePlay.put(s,k),[s,k]);
 await until(()=>D.evaluate(()=>window.xmas.treePlay.count===2),5000);
 await D.ctx.close();await sleep(800);
 const kept=bot(50,{name:'곧온봇'});await until(()=>kept.got.some(m=>m.t==='tree'),5000);
 const keptCount=kept.got.find(m=>m.t==='tree')?.s.length;kept.close();
 await sleep(RESET_MS+600);
 const late=bot(51,{name:'늦게온봇'});await until(()=>late.got.some(m=>m.t==='tree'),5000);
 const lateCount=late.got.find(m=>m.t==='tree')?.s.length;late.close();
 check('⑧ 잠깐 비면 트리 유지, 아무도 없이 초기화 시간이 지나면 빈 트리',keptCount===2&&lateCount===0,{keptCount,lateCount,resetMs:RESET_MS});

 // ── ⑩ 서버 주소가 죽었을 때: 서버 고르기 창 → 혼자 둘러보기 → 혼자 장식
 const E=await open('다섯',{width:390,height:844},{query:'serverpick=on&server=ws://127.0.0.1:9',wait:'page'});
 await E.waitForSelector('.sp-wrap:not([hidden]) .sp-down',{timeout:15000});
 await E.screenshot({path:`${dir}/mobile-server-pick-down.png`});
 const pickTxt=await E.evaluate(()=>({title:document.querySelector('.sp-head h2')?.textContent,solo:document.querySelector('.sp-solo')?.textContent}));
 await E.click('.sp-solo');await sleep(500);
 await E.evaluate(()=>{window.xmas.teleport(0,4.6,0);window.xmas.decorate(true);});await sleep(800);
 const solo=await E.evaluate(()=>{const r=window.xmas.treePlay.put(5,'snowflake');return {r,count:window.xmas.treePlay.count,state:window.xmas.multi.state,chip:document.querySelector('.xh-place').textContent};});
 check('⑩ 서버 없으면 혼자 둘러보기로 장식(내 화면에만)',/눈마을 광장 서버/.test(pickTxt.title)&&/혼자 둘러보기/.test(pickTxt.solo)&&solo.r.ok&&solo.count===1&&solo.state==='off'&&/혼자 둘러보기/.test(solo.chip),{pickTxt,solo});
 await E.evaluate(()=>window.xmas.decorate(false));
 await E.ctx.close();

 // ── 허브 카드·서버 고르기(서버 있음) 화면
 const Hc=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const Hp=await Hc.newPage();
 await Hp.goto(`${pageUrl}/?hubtime=night`);await Hp.waitForSelector('#hub-christmas');
 const hubHref=await Hp.evaluate(()=>document.querySelector('#hub-christmas').getAttribute('href'));
 await Hp.screenshot({path:`${dir}/mobile-hub.png`,fullPage:true});
 check('허브에 온라인 크리스마스 카드',hubHref.endsWith('christmas/'),{hubHref});
 await Hc.close();
 const F=await open('여섯',{width:390,height:844},{query:`serverpick=on&server=${encodeURIComponent(wsUrl)}`,wait:'page'});
 await F.waitForSelector('.sp-wrap:not([hidden]) .sp-row[data-state=open]',{timeout:15000});
 const rows=await F.evaluate(()=>[...document.querySelectorAll('.sp-row')].map(r=>r.getAttribute('aria-label')));
 await F.screenshot({path:`${dir}/mobile-server-pick.png`});
 check('서버 고르기: 눈마을 광장 1~3서버·정원 30',rows.length===3&&rows.every(t=>/눈마을 광장 \d서버 0 \/ 30명/.test(t)),{rows});
 await F.click('.sp-row[data-sp-server="2"]');
 await F.waitForFunction(()=>window.xmas.multi.state==='online',null,{timeout:15000});
 check('서버 고르기 → 2서버 입장',(await F.evaluate(()=>window.xmas.multi.room))==='눈마을-2',{});
 await F.ctx.close();
}catch(e){check('스크립트 오류 없음',false,{message:e.message,stack:e.stack?.split('\n').slice(0,4)});}
check('페이지 오류 0건',out.errors.length===0,{errors:out.errors.slice(0,8)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await srv.close().catch(()=>{});await vite.close();
console.log(fail?'실패가 있어요':'모두 통과');process.exit(fail?1:0);
