// 남산 사랑의 자물쇠 두 창 점검(11-22, 월드개발). 진짜 멀티 서버(따로 프로세스)와 vite를 이 스크립트가 띄운다(운영 8787은 안 씀).
//  A = PC 1400×860(마우스), B = 휴대폰 세로 390×844(터치)가 남산 1서버(남산-1)에 들어온다. 사람 C·D·E는 node WebSocket(신고·옛 화면 흉내).
//  1) 가짜 자물쇠 없음(처음 0개) · 2) A가 한마디를 직접 쳐서 걸기 → B 화면에 걸림 · 3) B가 화면의 자물쇠를 손가락으로 눌러 읽기 카드(한마디·닉네임·날짜)
//  4) 금칙어·개인정보 꼴은 걸기 거절(오류 줄) · 5) 서버 끄고 다시 켜도 남음(두 창 모두 다시 받음) · 6) 서버 꺼짐 동안 내 것만 보임
//  7) 신고: B가 카드에서 신고 → B 화면에서만 숨김, 3명째 신고 → 모두에게서 숨김 · 8) 운영자 스크립트 restore → 다시 보임, delete → 사라짐
//  9) A가 떼기 → B에서도 사라짐 · 10) 옛 화면(act.x 'lk-…') 자물쇠는 빈 자리에 잠깐 보이고 「저장되지 않은 자물쇠」로 읽힘
//   node scripts/namsan/verify-namsan-locks.mjs  (PORT=vite 기본 5251, MULTI_PORT=서버 기본 8851)
//   → artifacts/namsan-locks-2026-11-22/(사진·report.json·data/namsan-locks.json). 실패가 있으면 종료 코드 1.
import {chromium} from '@playwright/test';
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const OUT=resolve(process.env.OUT??'artifacts/namsan-locks-2026-11-22'),DATA=`${OUT}/data`;
rmSync(DATA,{recursive:true,force:true});mkdirSync(DATA,{recursive:true});
const port=Number(process.env.PORT??5251),multiPort=Number(process.env.MULTI_PORT??8851);
if([5173,5174,5188,8787].includes(port)||[8787].includes(multiPort))throw new Error('운영·다른 작업 포트는 쓰지 않습니다');
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const out={at:new Date().toISOString(),checks:[],errors:[]};let failed=0;
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});if(!pass)failed++;console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,300));};

// ── 서버(따로 프로세스, 끄고 다시 켬)
let srv=null,srvLog='';
async function startSrv(){
 srvLog='';srv=spawn(process.execPath,['server/multi-server.mjs'],{env:{...process.env,PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:DATA,BANNED_CHAT_WORDS:'나쁜말,멍청이',LOCKS_WATCH_MS:'500'},stdio:['ignore','pipe','pipe']});
 srv.stdout.on('data',d=>{srvLog+=d;});srv.stderr.on('data',d=>{srvLog+=d;});
 for(let i=0;i<60&&!/"start"/.test(srvLog);i++)await sl(100);if(!/"start"/.test(srvLog))throw new Error('멀티 서버가 안 떴어요:\n'+srvLog);
}
async function stopSrv(){if(!srv)return;const p=srv;srv=null;p.kill('SIGTERM');await new Promise(r=>p.once('exit',r));}
await startSrv();
const {createServer}=await import('vite');
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const wsUrl=`ws://127.0.0.1:${multiPort}`,URL0=`http://127.0.0.1:${port}/hiking/namsan/`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const SKIP=/WebSocket|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open(label,{viewport,touch=false,name}){
 const ctx=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));p.on('console',m=>{if(m.type()==='error'&&!SKIP.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,200)}`);});
 await p.goto(`${URL0}?multi=남산-1&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}&time=13:00&weather=clear`);
 await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});return p;}
const ev=(p,f,a)=>p.evaluate(f,a);
const L=p=>ev(p,()=>window.namsan.locks());
const shot=(p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
const until=async(p,f,a,ms=20000)=>{try{await p.waitForFunction(f,a,{timeout:ms});return true;}catch{return false;}};
// node 사람(신고·옛 화면 흉내)
function person(name,key){return new Promise((ok,fail)=>{const w=new WebSocket(wsUrl),box=[];const t=setTimeout(()=>fail(new Error('ws 시간 초과')),8000);
 w.onopen=()=>w.send(JSON.stringify({t:'hello',exp:'hiking',room:'남산-1',name}));
 w.onmessage=e=>{const m=JSON.parse(e.data);box.push(m);if(m.t==='welcome'){clearTimeout(t);ok({w,box,key,send:o=>w.send(JSON.stringify(o)),close:()=>w.close()});}};});}
const K=n=>n.toString(16).padStart(32,'f');

try{
 const A=await open('A-pc',{viewport:{width:1400,height:860},name:'에이'}),B=await open('B-phone',{viewport:{width:390,height:844},touch:true,name:'비'});
 check('두 창 모두 서버 목록을 받음(online)',await until(A,()=>window.namsan.locks().conn==='online')&&await until(B,()=>window.namsan.locks().conn==='online'));
 const S=await ev(A,()=>window.namsan.spots()),lk=S.spots.find(s=>s.id==='locks-summit');
 const l0=await L(A);check('1) 가짜 자물쇠 없음: 처음 난간 0개',l0.count.filled===0&&l0.count.slots===234,l0.count);
 for(const p of [A,B])await ev(p,lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await sl(1500);
 await shot(A,'pc-empty-rail');

 // 2) A가 PC에서 F → 카드 → 색·모양 → 한마디 직접 입력 → 걸기
 await A.keyboard.press('KeyF');check('A: F로 걸기 카드',await until(A,()=>window.namsan.locks().card?.kind==='hang',null,4000));await sl(200);
 const focused=await ev(A,()=>document.activeElement?.closest?.('.ns-lk-field')!=null);check('A(PC): 카드가 열리면 글 칸에 바로 입력',focused);
 await A.click('.ns-lock-colors button[data-c="1"]');await A.click('.ns-lock-shape button[data-h="1"]');await A.click('.ns-lk-field input');
 await A.keyboard.type('남산 첫 등산 기념! 또 오자',{delay:15});
 const cnt=await ev(A,()=>document.querySelector('.ns-lk-count').textContent);check('A: 글자 수 표시 16 / 30(보이는 글자 단위)',cnt==='16 / 30',{cnt});
 await shot(A,'pc-hang-card');
 await A.keyboard.press('Enter');
 check('A: 서버가 받은 뒤 걸림(내 자물쇠, 금테)',await until(A,()=>{const s=window.namsan.locks();return s.server.length===1&&s.server[0].mine&&s.count.filled===1&&!s.card;},null,6000),await L(A));
 await sl(900);await shot(A,'pc-hang-done');
 const lock1=(await L(A)).server[0];
 check('2) B 화면에도 같은 자리에 걸림(남의 것)',await until(B,id=>{const s=window.namsan.locks();return s.server.some(l=>l.id===id&&!l.mine)&&s.count.filled===1;},lock1.id,6000),{b:(await L(B)).server,slot:lock1.slot});

 // 3) B가 손가락으로 자물쇠를 눌러 읽기
 await ev(A,lk=>window.namsan.goTo(lk.x+Math.sin(lk.face)*3,lk.z+Math.cos(lk.face)*3,lk.face+Math.PI),lk);   // A 이름표가 B 화면의 자물쇠를 가리지 않게 비킴
 await ev(B,lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await sl(1500);
 const sp=await ev(B,s=>window.namsan.lockScreen(s),lock1.slot);
 const over=sp&&await ev(B,({x,y})=>{const e=document.elementFromPoint(x,y);return e?.id==='world'?'world':(e?.outerHTML??'').slice(0,160);},sp);const onCanvas=over==='world'||/id="look-zone"/.test(over);
 if(sp&&onCanvas)await B.touchscreen.tap(sp.x,sp.y);else await ev(B,s=>window.namsan.lockRead(s),lock1.slot);
 check('3) B: 화면의 자물쇠를 눌러 읽기 카드(손가락)',!!(sp&&onCanvas)&&await until(B,()=>window.namsan.locks().card?.kind==='read',null,3000),{sp,over});
 await until(B,()=>window.namsan.locks().card?.kind==='read',null,3000);await sl(900);
 const rc=await ev(B,()=>({text:document.querySelector('.ns-lk-text')?.textContent,by:document.querySelector('.ns-lk-by')?.innerText,report:!!document.querySelector('[data-lk="report"]'),btns:[...document.querySelectorAll('.ns-lockcard button')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return {t:b.textContent,w:r.width,h:r.height,in:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};})}));
 check('B: 카드에 한마디·닉네임·날짜, 신고 단추',rc.text==='남산 첫 등산 기념! 또 오자'&&/에이/.test(rc.by)&&/\d{4}\. \d{1,2}\. \d{1,2}\./.test(rc.by)&&rc.report,rc);
 check('B(휴대폰): 카드 단추 44px 이상·화면 안',rc.btns.every(b=>b.h>=44&&b.in),rc.btns);
 await shot(B,'phone-read-card');
 // A(PC) 마우스 올림 강조·클릭으로 읽기
 await ev(A,lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await sl(5200);
 const ap=await ev(A,s=>window.namsan.lockScreen(s),lock1.slot);
 if(ap){await A.mouse.move(ap.x,ap.y);await sl(200);}
 const cur=await ev(A,()=>document.querySelector('#world').style.cursor);check('A(PC): 마우스를 올리면 손가락 커서',cur==='pointer',{ap,cur});
 if(ap){await A.mouse.down();await A.mouse.up();}
 check('A(PC): 눌러 읽기 → 내 자물쇠 카드(떼기)',await until(A,()=>window.namsan.locks().card?.kind==='read'&&!!document.querySelector('[data-lk="unhang"]'),null,3000));
 await sl(700);await shot(A,'pc-read-mine');await A.keyboard.press('Escape');await sl(300);

 // 4) 금칙어·개인정보 꼴
 await B.tap('[data-lk="close"]').catch(()=>{});await sl(300);
 await ev(B,()=>window.namsan.lockCard({c:3,h:0,text:'나쁜말 하지 마',hang:true}));
 check('4) 금칙어 글은 서버가 거절(오류 줄, 걸리지 않음)',await until(B,()=>/쓸 수 없는 말/.test(window.namsan.locks().card?.err??''),null,6000),await L(B));
 await shot(B,'phone-banned');
 await ev(B,()=>window.namsan.lockCard({text:'010 1234 5678 연락해',hang:true}));
 check('4) 전화번호 꼴은 화면이 먼저 막음',/전화번호/.test((await L(B)).card?.err??''),(await L(B)).card);
 const nA=(await L(A)).count.filled;check('4) 거절된 글은 A 화면에 안 걸림',nA===1,{nA});
 // B가 정상 글로 걸기(키보드 열림 모양 확인 = 글 칸 탭)
 await B.tap('.ns-lk-field input');await sl(400);await shot(B,'phone-hang-typing');
 await ev(B,()=>window.namsan.lockCard({text:'엄마 아빠 결혼 30주년 축하해요',hang:true}));
 check('B: 휴대폰에서 걸기',await until(B,()=>window.namsan.locks().server.filter(l=>l.mine).length===1,null,6000));
 const lock2=(await L(B)).server.find(l=>l.mine);
 check('A: B의 자물쇠도 보임',await until(A,id=>window.namsan.locks().server.some(l=>l.id===id),lock2.id,6000));

 // 10) 옛 화면 흉내(act.x 'lk-…')
 const old=await person('옛화면',K(9));old.send({t:'s',q:1,z:2,x:lk.x+1,y:lk.z,h:0,v:0,f:0});old.send({t:'act',a:{x:'lk-0a1'}});
 check('10) 옛 화면 자물쇠는 빈 자리에 잠깐 보임',await until(A,()=>window.namsan.locks().legacy.length===1&&window.namsan.locks().layout.some(l=>l.kind==='legacy'),null,8000),(await L(A)).legacy);
 const legSlot=(await L(A)).layout.find(l=>l.kind==='legacy')?.slot;
 if(legSlot!=null){await ev(A,s=>window.namsan.lockRead(s),legSlot);await sl(300);check('10) 「저장되지 않은 자물쇠」로 읽힘, 신고 단추 없음',await ev(A,()=>/저장되지 않은/.test(document.querySelector('.ns-lockcard').innerText)&&!document.querySelector('[data-lk="report"]')));await A.keyboard.press('Escape');}
 old.close();check('10) 옛 화면 사람이 나가면 사라짐',await until(A,()=>window.namsan.locks().legacy.length===0,null,8000));

 // 5) 서버 다시 켜기
 await stopSrv();
 check('6) 서버 꺼짐: A는 내 자물쇠만(offline)',await until(A,id=>{const s=window.namsan.locks();return s.conn==='offline'&&s.count.filled===1&&s.layout[0]?.id===id;},lock1.id,15000),(await L(A)).layout);
 await sl(600);await shot(A,'pc-offline');
 await startSrv();
 const back=await until(A,()=>window.namsan.locks().conn==='online'&&window.namsan.locks().server.length===2,null,40000)&&await until(B,()=>window.namsan.locks().conn==='online'&&window.namsan.locks().server.length===2,null,40000);
 const file=JSON.parse(readFileSync(`${DATA}/namsan-locks.json`,'utf8'));
 check('5) 서버를 다시 켜도 두 자물쇠가 남고 두 창이 다시 받음',back&&file.locks.length===2,{a:(await L(A)).server.map(l=>l.text),file:file.locks.map(l=>l.text)});
 check('5) 파일에는 기기 열쇠 원문이 아니라 해시만',!JSON.stringify(file).includes((await ev(A,()=>localStorage.getItem('namsan-lock-key:v1')))),{});

 // 7) 신고: A가 카드에서 B 자물쇠 신고 → A 화면에서만 숨김, 사람 2명 더 → 모두에게서 숨김
 await ev(A,s=>window.namsan.lockRead(s),lock2.slot);await sl(300);await A.click('[data-lk="report"]');await sl(200);
 const goOff=await ev(A,()=>document.querySelector('[data-lk="report-go"]').disabled);await A.click('[data-reason="abuse"]');await shot(A,'pc-report');await A.click('[data-lk="report-go"]');
 check('7) 이유를 골라야 「신고하기」가 눌림',goOff===true);
 check('7) 신고한 A 화면에서는 바로 숨김, B에는 그대로',await until(A,id=>!window.namsan.locks().layout.some(l=>l.id===id),lock2.id,3000)&&(await L(B)).layout.some(l=>l.id===lock2.id));
 const c1=await person('씨',K(3)),c2=await person('디',K(4));
 c1.send({t:'lk-report',owner:K(3),id:lock2.id,reason:'spam'});await sl(300);
 check('7) 2명까지는 B에 그대로',(await L(B)).layout.some(l=>l.id===lock2.id));
 c2.send({t:'lk-report',owner:K(4),id:lock2.id,reason:'etc'});
 check('7) 서로 다른 3명 신고 → 건 사람(B) 화면에서도 사라짐',await until(B,id=>!window.namsan.locks().server.some(l=>l.id===id),lock2.id,5000));
 const rep=readFileSync(`${DATA}/reports.jsonl`,'utf8').trim().split('\n').map(l=>JSON.parse(l)).filter(r=>r.kind==='lock');
 check('7) 신고 기록(reports.jsonl kind:lock) 3줄',rep.length===3&&rep.at(-1).hidden===1,rep.map(r=>r.reason));
 // 8) 운영자 스크립트
 await sl(1000);   // 서버가 파일에 쓸 때까지(0.3초 모아 쓰기)
 const adm=(...a)=>execFileSync(process.execPath,['scripts/namsan-locks-admin.mjs',...a],{env:{...process.env,DATA_DIR:DATA},encoding:'utf8'});
 const listOut=adm('reported');check('8) 운영자 reported에 숨긴 자물쇠',listOut.includes(lock2.id),{listOut:listOut.slice(0,300)});
 adm('restore',lock2.id);check('8) restore → 서버가 파일을 다시 읽어 B 화면에 다시 보임',await until(B,id=>window.namsan.locks().server.some(l=>l.id===id),lock2.id,8000));
 adm('delete',lock2.id);check('8) delete → 모두에게서 사라짐',await until(A,id=>!window.namsan.locks().server.some(l=>l.id===id),lock2.id,8000)&&await until(B,id=>!window.namsan.locks().server.some(l=>l.id===id),lock2.id,8000));
 c1.close();c2.close();

 // 9) A 떼기
 await ev(A,s=>window.namsan.lockRead(s),lock1.slot);await sl(300);await A.click('[data-lk="unhang"]');await sl(200);await shot(A,'pc-unhang-confirm');await A.click('[data-lk="unhang-go"]');
 check('9) A가 떼면 B에서도 사라지고 개수가 돌아옴',await until(B,()=>window.namsan.locks().count.filled===0,null,5000)&&(await L(A)).mine===0);
 await sl(1000);const fin=JSON.parse(readFileSync(`${DATA}/namsan-locks.json`,'utf8'));check('9) 파일도 비었음',fin.locks.length===0,{n:fin.locks.length});
}catch(e){out.errors.push('스크립트: '+(e.stack||e.message));failed++;console.error(e);}
check('페이지 오류 없음',!out.errors.length,out.errors.slice(0,6));
writeFileSync(`${OUT}/report.json`,JSON.stringify(out,null,1));
console.log(`\n${out.checks.filter(c=>c.pass).length}/${out.checks.length} 통과`);
await browser.close();await vite.close();await stopSrv();process.exit(failed?1:0);
