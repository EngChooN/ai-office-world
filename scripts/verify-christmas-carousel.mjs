// 회전목마 타기 점검(월드개발, 2026-11-17 3차): 서버(MULTI_PORT 8794)·vite(PORT 5196)를 이 스크립트가 띄우고 끝나면 닫는다.
// 기본 화면(11-17부터 시안 B, 주소 옵션 없음) 브라우저 2개(PC '하나' 1920×1080, 휴대폰 '둘' 390×844) + 예전 화면(?look=classic) 1개.
//  ① 타는 곳(서쪽 계단 앞)에 가면 「회전목마 타기」 → 누르면 자리(루돌프·썰매 의자)에 앉아 함께 돎(위치가 원을 그리며 바뀜, 루돌프면 오르내림)
//  ② 둘(휴대폰) 화면에서 하나가 둘 화면의 같은 번호 루돌프 위에 앉아 보임 · 둘도 타면 다른 루돌프
//  ③ 만세가 상대 화면에도 · 「내리기」면 계단 앞(내리는 곳)에 서고 상대 화면에서도 내려옴 · 걷기 입력이면 내림 · 8자리가 다 차면 「다 찼어요」
//  ⑤ 아이스링크: 문 밖 「스케이트장 들어가기」 → 얼음 위(얼음 높이)에 서고 걸어 다님, 울타리·섬은 못 지나감, 둘 화면에서도 얼음 위 높이, 「나가기」로 문 밖. 밖에서는 울타리를 넘지 못함
//  ④ 시안 없는 화면은 회전목마·링크 단추·act 칸 없음 · 페이지 오류 0
//   node scripts/verify-christmas-carousel.mjs → artifacts/christmas-carousel/*.png, report.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {CAROUSEL,CAROUSEL_SEATS,RINK,inRink} from '../src/christmas/festive-layout.js';

const dir='artifacts/christmas-carousel',multiPort=Number(process.env.MULTI_PORT??8794),room='눈마을-3';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5196);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=120)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
async function open(name,vp,look=null){
 const mobile=vp.width<900;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','snowman','sled','fire']}));});
 const p=await ctx.newPage();p.label=name;p.mobile=mobile;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}${look?`&look=${look}`:''}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());
async function press(p,id){const sel=`.xh-acts [data-act="${id}"]`;await p.waitForSelector(sel,{timeout:5000});if(p.mobile)await p.tap(sel);else await p.click(sel);}
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
// 상대(id)가 이 화면에서 그려진 자리와 이 화면 루돌프 자리(rideAt)의 차이(m)
// 앉기 자세는 root를 좌판 앞쪽으로 당기고(-.12) 올리므로(흡연장 SIT), 루돌프 자리와 root 차이는 0이 아니다 → 0.25m 안이면 같은 자리로 본다
const remoteGap=(p,id)=>p.evaluate(id=>{const x=window.xmas,pp=x.multi.people().find(q=>q.id===id);if(!pp?.act?.mg)return {mg:0};const h=x.multi.headOf(id);const a=h?.avatar??null;
 const want=x.carousel.rideAt(pp.act);if(!a)return {mg:pp.act.mg,noAvatar:1};return {mg:pp.act.mg,gap:+Math.hypot(a.root.position.x-want.x,a.root.position.z-want.z).toFixed(3),dy:+(a.root.position.y-want.y).toFixed(3),sit:x.multi.poserOf(id)?.sitting??null,arms:x.multi.poserOf(id)?.arms??null};},id);

let A,B,C;
try{
 A=await open('하나',{width:1920,height:1080});
 B=await open('둘',{width:390,height:844});
 const idA=await A.evaluate(()=>window.xmas.multi.id),idB=await B.evaluate(()=>window.xmas.multi.id);
 check('시안 B에 회전목마가 있음',await A.evaluate(()=>!!window.xmas.village.festive?.carousel&&window.xmas.carousel.enabled));
 // ① 타기
 await A.evaluate(()=>{window.xmas.carousel.goTo();window.xmas.cam.yaw=0;window.xmas.cam.pitch=.3;window.xmas.cam.dist=7;});
 check('가까이 가면 「회전목마 타기」 단추',await until(async()=>(await st(A)).actions.includes('mg:ride'),3000));
 await press(A,'mg:ride');
 const s1=(await st(A)).carousel;check('타면 루돌프에 앉음',s1.riding&&s1.seat>=0&&(await st(A)).player.sitting,s1);
 const p0=await A.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z,y:window.xmas.player.root.position.y}));
 await sleep(800); // 앉는 자세가 다 섞인 뒤 높이를 잰다
 const ys=[];for(let i=0;i<10;i++){await sleep(200);ys.push(await A.evaluate(()=>window.xmas.player.root.position.y));}
 const p1=await A.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));
 const c={x:CAROUSEL.x,z:CAROUSEL.z};
 const r0=Math.hypot(p0.x-c.x,p0.z-c.z),r1=Math.hypot(p1.x-c.x,p1.z-c.z),moved=Math.hypot(p1.x-p0.x,p1.z-p0.z);
 check('타는 동안 함께 돎(반지름 그대로, 위치가 바뀜)',moved>.3&&Math.abs(r0-r1)<.05,{moved:+moved.toFixed(2),r0:+r0.toFixed(2),r1:+r1.toFixed(2)});
 check(s1.kind==='deer'?'루돌프와 함께 오르내림':'썰매 의자는 높이 그대로',s1.kind==='deer'?Math.max(...ys)-Math.min(...ys)>.05:Math.max(...ys)-Math.min(...ys)<.01,{range:+(Math.max(...ys)-Math.min(...ys)).toFixed(3)});
 check('act에 루돌프 번호',(await st(A)).act.mg===s1.seat+1,{act:(await st(A)).act});
 check('타는 중 단추 = 내리기·만세',JSON.stringify((await st(A)).actions)==='["mg:off","mg:cheer"]',{a:(await st(A)).actions});
 await shot(A,'pc-ride');
 // ② 둘 화면에서
 await B.evaluate(()=>{const x=window.xmas;x.carousel.goTo();x.cam.yaw=0;x.cam.pitch=.28;x.cam.dist=6.5;});
 check('둘 화면: 하나가 같은 번호 루돌프 위에 앉음',await until(async()=>{const g=await remoteGap(B,idA);return g.gap!==undefined&&g.gap<.25&&Math.abs(g.dy)<.25&&g.sit;},8000),await remoteGap(B,idA));
 await press(B,'mg:ride');
 const sB=(await st(B)).carousel;check('둘도 타면 다른 루돌프',sB.riding&&sB.seat!==s1.seat,{a:s1.seat,b:sB.seat});
 check('하나 화면: 둘도 루돌프 위',await until(async()=>{const g=await remoteGap(A,idB);return g.gap<.25&&Math.abs(g.dy)<.25&&g.sit;},8000),await remoteGap(A,idB));
 // ③ 만세
 await press(A,'mg:cheer');
 check('만세가 둘 화면에도',await until(async()=>(await remoteGap(B,idA)).arms==='cheer',5000),await remoteGap(B,idA));
 await sleep(600);await shot(B,'mobile-ride');await shot(A,'pc-ride-both');
 // 내리기
 await press(A,'mg:off');
 const sA=await st(A);const dOut=Math.hypot(sA.player.x-CAROUSEL.exit.x,sA.player.z-CAROUSEL.exit.z);
 check('내리면 계단 앞(내리는 곳)에 섬',!sA.carousel.riding&&!sA.player.sitting&&dOut<.1,{d:+dOut.toFixed(2)});
 check('둘 화면: 하나가 내려옴',await until(async()=>(await remoteGap(B,idA)).mg===0,5000));
 // 걷기 입력이면 내림(휴대폰 둘: 조이스틱 대신 키 입력으로 PC 하나를 다시 태워 W)
 await press(A,'mg:ride');await sleep(300);await A.keyboard.down('KeyW');await sleep(300);await A.keyboard.up('KeyW');
 check('걷기 입력이면 내림',!(await st(A)).carousel.riding);
 await press(B,'mg:off');check('휴대폰 「내리기」 탭',!(await st(B)).carousel.riding);
 // 자리가 다 차면: 봇(자리 수만큼)이 자리를 차지 → 하나가 누르면 「다 찼어요」·안 탐
 const bots=[];for(let k=1;k<=CAROUSEL_SEATS.length;k++){const ws=new WebSocket(wsUrl);bots.push(ws);ws.onopen=()=>ws.send(JSON.stringify({t:'hello',exp:'christmas',room,name:`봇${k}`}));
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='welcome'){ws.send(JSON.stringify({t:'act',a:{o:'elf',mg:k}}));ws.send(JSON.stringify({t:'s',q:1,z:0,x:CAROUSEL.x,y:CAROUSEL.z+1,h:0,v:0,f:4}));}};}
 await until(async()=>(await st(A)).carousel.taken.length===CAROUSEL_SEATS.length,8000);
 await A.evaluate(()=>window.xmas.carousel.goTo());await sleep(400);await press(A,'mg:ride');
 check('자리가 다 차면 안 탐',!(await st(A)).carousel.riding,{taken:(await st(A)).carousel.taken});
 await sleep(500);await shot(A,'pc-full');
 for(const ws of bots)ws.close();
 // 휴대폰 단추 크기
 await B.evaluate(()=>window.xmas.carousel.goTo());await sleep(400);
 const box=await B.locator('.xh-acts [data-act="mg:ride"]').boundingBox();
 check('휴대폰 타기 단추 44px 이상·화면 안',box&&box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844,box);
 // ⑤ 아이스링크
 await A.evaluate(()=>window.xmas.rink.goTo());await sleep(400);
 // 밖에서 울타리 쪽으로 걸으면 못 들어감(문 앞에서 서쪽 = 링크 쪽으로 2초)
 await A.keyboard.down('KeyW');await sleep(1500);await A.keyboard.up('KeyW');
 {const p=(await st(A)).player;check('밖에서는 울타리를 넘지 못함',!inRink(p.x,p.z),p);}
 await A.evaluate(()=>window.xmas.rink.goTo());await sleep(400);
 check('문 밖 「스케이트장 들어가기」',(await st(A)).actions.includes('rk:in'),{a:(await st(A)).actions});
 await press(A,'rk:in');await sleep(300);
 {const s=await st(A);check('들어가면 얼음 위·얼음 높이',s.rink.inside&&s.rink.onIce&&Math.abs(s.player.y-RINK.iceY)<.02,{rink:s.rink,y:s.player.y});}
 // 얼음 위를 걷기: 3초 앞으로(섬 쪽) → 섬에 막혀 비켜 감·얼음 안
 await A.evaluate(()=>{window.xmas.cam.yaw=window.xmas.player.heading;});
 await A.keyboard.down('KeyW');await sleep(3000);await A.keyboard.up('KeyW');
 {const s=await st(A),I=RINK.island;check('얼음 위를 걸어 다님(섬은 못 지나감)',s.rink.inside&&s.rink.onIce&&Math.hypot(s.player.x-RINK.gate.inside.x,s.player.z-RINK.gate.inside.z)>1.5&&Math.hypot(s.player.x-I.x,s.player.z-I.z)>I.r,{p:s.player});}
 // 미끄러짐: 섬 반대쪽(문 쪽)으로 1.5초 걷다 손 떼면 조금(0.3~2m) 더 미끄러져 섬
 await A.evaluate(()=>{const x=window.xmas;x.rink.goTo();x.doAction('rk:in');x.cam.yaw=-Math.PI/2;});await sleep(200);
 await A.evaluate(([x,z])=>{window.xmas.player.place(x,z,-Math.PI/2);},[RINK.x-RINK.w*.4,RINK.z+RINK.d*.33]);
 await A.keyboard.down('KeyW');await sleep(1500);
 const g0=await A.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z,v:window.xmas.rink.status().v}));await A.keyboard.up('KeyW');await sleep(1800);
 const g1=await A.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z,v:window.xmas.rink.status().v}));
 const glide=Math.hypot(g1.x-g0.x,g1.z-g0.z);
 check('손 떼면 조금 미끄러져 섬(너무 미끄럽지 않게)',glide>.3&&glide<2&&g1.v===0,{glide:+glide.toFixed(2),v0:g0.v,v1:g1.v});
 await A.keyboard.down('KeyA');await sleep(4000);await A.keyboard.up('KeyA');
 {const s=await st(A);check('울타리 밖으로 못 나감',s.rink.inside&&inRink(s.player.x,s.player.z,.2),{p:s.player});}
 const idA2=idA;check('둘 화면: 하나가 얼음 높이에 보임',await until(async()=>B.evaluate(([id,iceY])=>{const h=window.xmas.multi.headOf(id);const a=h?.avatar;return a&&Math.abs(a.root.position.y-iceY)<.03;},[idA2,RINK.iceY]),6000));
 await A.evaluate(()=>{const x=window.xmas,c=x.cam;c.yaw=-1.2;c.pitch=.35;c.dist=8;});await sleep(500);await shot(A,'pc-rink');
 await A.evaluate(([x,z])=>window.xmas.teleport(x,z,Math.PI/2),[RINK.gate.inside.x,RINK.gate.inside.z]);
 // teleport가 링크 안 표시를 풀므로 다시 들어가서 나가기
 await A.evaluate(()=>{window.xmas.rink.goTo();window.xmas.doAction('rk:in');});await sleep(300);
 check('문 안쪽 「스케이트장 나가기」',(await st(A)).actions.includes('rk:out'),{a:(await st(A)).actions});
 await press(A,'rk:out');await sleep(300);
 {const s=await st(A);check('나가면 문 밖·땅 높이',!s.rink.inside&&!s.rink.onIce&&Math.hypot(s.player.x-RINK.gate.stand.x,s.player.z-RINK.gate.stand.z)<.05,{p:s.player});}
 // 휴대폰도 탭으로 들어가기·나가기
 await B.evaluate(()=>window.xmas.rink.goTo());await sleep(400);await press(B,'rk:in');await sleep(300);
 check('휴대폰 들어가기 탭',(await st(B)).rink.inside);
 await B.evaluate(()=>{const x=window.xmas,c=x.cam;c.yaw=-1.6;c.pitch=.3;c.dist=6;});await sleep(500);await shot(B,'mobile-rink');
 await press(B,'rk:out');check('휴대폰 나가기 탭',!(await st(B)).rink.inside);
 // ④ 시안 없는 화면
 C=await open('셋',{width:1280,height:800},'classic');
 await C.evaluate(([x,z])=>window.xmas.teleport(x,z,0),[CAROUSEL.board.x,CAROUSEL.board.z]);await sleep(500);
 const sC=await st(C);await C.evaluate(([x,z])=>window.xmas.teleport(x,z,Math.PI/2),[RINK.gate.stand.x,RINK.gate.stand.z]);await sleep(500);const sC2=await st(C);
 check('시안 없는 화면: 회전목마·링크 단추·act 칸 없음',!sC.actions.some(a=>a.startsWith('mg:'))&&!sC2.actions.some(a=>a.startsWith('rk:'))&&!('mg' in sC.act)&&sC2.rink.enabled===false,{actions:sC.actions,act:sC.act});
}catch(e){check('예외 없음',false,{e:String(e.stack??e).slice(0,500)});}
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await vite.close();await srv.close?.();
process.exit(fail?1:0);
