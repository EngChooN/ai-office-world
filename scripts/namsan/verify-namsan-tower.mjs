// 남산 전망탑 들어가기 점검(11-22, 월드개발). 진짜 멀티 서버(따로 프로세스)와 vite를 이 스크립트가 띄운다(운영 8787은 안 씀).
//  A = PC 1400×860(키보드), B = 휴대폰 세로 390×844(터치)가 남산 1서버(남산-1)에 정상 앞(?start=summit)으로 들어온다.
//  1) 탑 문 앞에서 「타워 들어가기」 할 일 칩 · 2) A: F → 엘리베이터 연출(층 1→5→전망, 3~5초, 문 닫힘 동안 자리 옮김) → 전망대
//  3) 고리 걷기(W)·자동 걷기(R) 유리창 따라 · 4) 망원경 F → 쌍안경 화면·이름표 · 5) B: 칩을 손가락으로 눌러 들어가고 「건너뛰기」 단추
//  6) 함께 걷기: A·B 둘 다 전망대 → 서로 전망대 바닥 높이에 보임, 광장 사람(C, node)은 광장 높이 · 7) 「전망대 나가기」 단추 → 정상 입구 문 앞
//  8) 밤 전망대 사진 · 페이지 오류 0
//   node scripts/namsan/verify-namsan-tower.mjs  (PORT=vite 기본 5261, MULTI_PORT=서버 기본 8861) → artifacts/namsan-tower-2026-11-22/
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';

const OUT=resolve(process.env.OUT??'artifacts/namsan-tower-2026-11-22'),DATA=`${OUT}/data`;
rmSync(DATA,{recursive:true,force:true});mkdirSync(DATA,{recursive:true});
const port=Number(process.env.PORT??5261),multiPort=Number(process.env.MULTI_PORT??8861);
if([5173,5174,5188,8787].includes(port)||[8787].includes(multiPort))throw new Error('운영·다른 작업 포트는 쓰지 않습니다');
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const out={at:new Date().toISOString(),checks:[],errors:[]};let failed=0;
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});if(!pass)failed++;console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,300));};

let srvLog='';const srv=spawn(process.execPath,['server/multi-server.mjs'],{env:{...process.env,PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:DATA},stdio:['ignore','pipe','pipe']});
srv.stdout.on('data',d=>{srvLog+=d;});srv.stderr.on('data',d=>{srvLog+=d;});
for(let i=0;i<60&&!/"start"/.test(srvLog);i++)await sl(100);if(!/"start"/.test(srvLog))throw new Error('멀티 서버가 안 떴어요:\n'+srvLog);
const {createServer}=await import('vite');
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const wsUrl=`ws://127.0.0.1:${multiPort}`,URL0=`http://127.0.0.1:${port}/hiking/namsan/`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const SKIP=/WebSocket|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open(label,{viewport,touch=false,name,time='13:00'}){
 const ctx=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));p.on('console',m=>{if(m.type()==='error'&&!SKIP.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,200)}`);});
 await p.goto(`${URL0}?multi=남산-1&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}&start=summit&time=${time}&weather=clear`);
 await p.waitForFunction(()=>window.namsan?.started&&window.namsan.multi()?.status==='online',null,{timeout:180000});return p;}
const ev=(p,f,a)=>p.evaluate(f,a);
const T=p=>ev(p,()=>window.namsan.tower());
const shot=(p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
const until=async(p,f,a,ms=20000)=>{try{await p.waitForFunction(f,a,{timeout:ms});return true;}catch{return false;}};
const rows=p=>ev(p,()=>window.namsan.interact().view?.rows?.map(r=>r.label)??[]);
function person(name){return new Promise((ok,fail)=>{const w=new WebSocket(wsUrl);const t=setTimeout(()=>fail(new Error('ws 시간 초과')),8000);
 w.onopen=()=>w.send(JSON.stringify({t:'hello',exp:'hiking',room:'남산-1',name}));
 w.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='welcome'){clearTimeout(t);ok({w,id:m.id,send:o=>w.send(JSON.stringify(o))});}};});}

try{
 const A=await open('A-pc',{viewport:{width:1400,height:860},name:'에이'}),B=await open('B-phone',{viewport:{width:390,height:844},touch:true,name:'비'});
 const t0=await T(A);
 check('문 자리: 탑 받침 밖·광장 걷는 곳',t0.door&&Math.hypot(t0.door.stand.x-t0.door.door.x,t0.door.stand.z-t0.door.door.z)>1,{bearing:t0.door.bearing});
 // 정상 광장 문 앞 전경(조금 뒤에서)
 for(const p of [A,B]){await ev(p,d=>{const h=d.stand.heading,b=3.5;window.namsan.goTo(d.stand.x+Math.sin(h)*b,d.stand.z+Math.cos(h)*b,h);},t0.door);}
 await sl(1800);await shot(A,'pc-1-entrance-far');await shot(B,'phone-1-entrance-far');
 for(const p of [A,B])await ev(p,d=>window.namsan.goTo(d.stand.x,d.stand.z,d.stand.heading),t0.door);
 await sl(900);
 const ra=await rows(A),rb=await rows(B);
 check('1) 문 앞 할 일 칩 「타워 들어가기」 (PC·휴대폰)',ra.includes('타워 들어가기')&&rb.includes('타워 들어가기'),{ra,rb});
 await shot(A,'pc-2-entrance-chip');await shot(B,'phone-2-entrance-chip');

 // 2) A: F → 엘리베이터
 const tStart=Date.now();await A.keyboard.press('KeyF');
 check('2) F로 엘리베이터 시작',await until(A,()=>window.namsan.tower().elev?.dir==='up',null,3000));
 const floors=[];let midShot=false;
 while(Date.now()-tStart<8000){const t=await T(A);if(!t.elev)break;if(floors.at(-1)!==t.elev.floor)floors.push(t.elev.floor);if(!midShot&&t.elev.phase==='move'&&t.elev.t>1.6){midShot=true;await shot(A,'pc-3-elevator');}await sl(60);}
 const dur=(Date.now()-tStart)/1000,t1=await T(A),stA=await ev(A,()=>window.namsan.status());
 check('엘리베이터 층 표시 1→5→전망, 3~5초(측정 여유 +0.8초)',floors.join(',')==='1,2,3,4,5,전망'&&dur>=3&&dur<=5.8,{floors,dur});
 check('전망대 안: 바닥 높이·탑 겉모습 숨김·실내 보임',t1.inside&&Math.abs(stA.y-t1.deck.y)<.01&&!t1.towerVisible&&t1.deckVisible,{y:stA.y,deckY:t1.deck.y,r:t1.r});
 await sl(1200);await shot(A,'pc-4-deck-arrive');
 // 3) 걷기 W 2.5초 → 고리 안, 자동 걷기 R
 await A.keyboard.down('KeyW');await sl(2500);await A.keyboard.up('KeyW');
 let t2=await T(A);check('3) W로 걷기: 고리(5.7~12.5m) 안',t2.r>=5.69&&t2.r<=12.51,{r:t2.r});
 await A.keyboard.press('KeyR');await sl(300);const a0=await ev(A,()=>{const s=window.namsan.status();return {x:s.x,z:s.z,auto:s.auto};});await sl(6000);
 const a1=await ev(A,()=>{const s=window.namsan.status();return {x:s.x,z:s.z,auto:s.auto};});t2=await T(A);
 check('자동 걷기(R): 유리창 따라 돎',a0.auto&&Math.hypot(a1.x-a0.x,a1.z-a0.z)>3&&Math.abs(t2.r-11.6)<.8,{moved:Math.hypot(a1.x-a0.x,a1.z-a0.z),r:t2.r});
 await shot(A,'pc-5-deck-walk');await A.keyboard.press('KeyR');
 // 4) 망원경
 const sc=t2.deck.scopes.find(s=>/관악/.test(s.name))??t2.deck.scopes[0];
 await ev(A,s=>window.namsan.deckGoTo(s.stand.x,s.stand.z,s.stand.heading),sc);await sl(700);
 const rs=await rows(A);check('망원경 칩',rs.some(l=>l.startsWith('망원경')),{rs});
 await A.keyboard.press('KeyF');await sl(1500);
 const bino=await ev(A,()=>window.namsan.status());check('4) 망원경 F → 쌍안경 화면·이름표',bino.gadget==='binoculars'&&bino.interact.bino?.labels?.length>0,{labels:bino.interact.bino?.labels,zoom:bino.zoom});
 await shot(A,'pc-6-scope');await A.keyboard.press('Escape');await sl(500);
 check('망원경 내리기(Esc)',(await ev(A,()=>window.namsan.status().gadget))==='none');
 // 창가에서 밖 보기(이름판)
 await ev(A,s=>window.namsan.deckGoTo(s.stand.x,s.stand.z,s.stand.heading),t2.deck.scopes[1]??sc);await ev(A,()=>{window.namsan.interact().reset();});await sl(900);await shot(A,'pc-7-window-labels');

 // 5) B: 칩을 손가락으로 → 건너뛰기 단추
 const chip=B.locator('#auto[data-mode="interact"][aria-label^="들어가기"]');
 let tapped=false;if(await chip.count()&&await chip.isVisible()){await chip.tap();tapped=true;}else{await ev(B,()=>window.namsan.towerGo('in'));}
 check('5) 휴대폰: 큰 단추(들어가기) 손가락으로 눌러 엘리베이터',tapped&&await until(B,()=>!!window.namsan.tower().elev,null,3000),{tapped});
 await sl(900);await shot(B,'phone-3-elevator');
 const skipBox=await B.locator('.ns-elev .skip').boundingBox();
 check('건너뛰기 단추 손가락 크기(44px 이상)',skipBox&&skipBox.height>=44,{skipBox});
 const ts=Date.now();await B.locator('.ns-elev .skip').tap();
 check('건너뛰기 → 바로 전망대',await until(B,()=>window.namsan.tower().inside&&!window.namsan.tower().elev,null,2500),{ms:Date.now()-ts});
 await sl(1200);await shot(B,'phone-4-deck-arrive');
 // 6) 함께 걷기: B를 A 가까이(같은 창가)
 const near=await T(A);const ah=await ev(A,()=>window.namsan.status());
 await ev(B,({x,z,h})=>window.namsan.deckGoTo(x,z,h),{x:ah.x+Math.cos(ah.y)*0+1.2*Math.cos(0),z:ah.z+0.0,h:0});
 const C=await person('씨');   // 광장에 선 사람(node): 탑 문 앞 광장
 const seqC={q:0};const sendC=()=>C.send({t:'s',id:C.id,q:(seqC.q=(seqC.q+1)&0xffff),z:1,x:t0.door.stand.x+2,y:t0.door.stand.z+2,h:0,v:0,f:0});
 for(let i=0;i<8;i++){sendC();await sl(150);}
 const seeOk=await until(A,()=>{const r=window.namsan.multi()?.roster??[];const b=r.find(x=>x.name==='비');return b&&b.zone==='summit'&&b.drawnY!=null&&Math.abs(b.drawnY-window.namsan.tower().deck.y)<.6;},null,15000);
 const seeB=await until(B,()=>{const r=window.namsan.multi()?.roster??[];const a=r.find(x=>x.name==='에이');return a&&a.zone==='summit'&&a.drawnY!=null&&Math.abs(a.drawnY-window.namsan.tower().deck.y)<.6;},null,15000);
 const rosterA=await ev(A,()=>window.namsan.multi().roster.map(r=>({name:r.name,zone:r.zone,y:r.drawnY,model:r.model})));
 check('6) 함께 걷기: A 화면에서 B가 전망대 바닥 높이에',seeOk,{rosterA});
 check('B 화면에서 A가 전망대 바닥 높이에',seeB);
 const cRow=rosterA.find(r=>r.name==='씨'),gy=await ev(A,()=>window.namsan.status().y-0)/1;
 check('광장 사람(C)은 광장 높이에 그려짐(전망대로 안 올라감)',cRow&&cRow.zone==='plaza'&&(cRow.y==null||cRow.y<gy-100),{cRow});
 // 서로 보이는 사진: A가 B 쪽을 봄
 const bp=await ev(B,()=>window.namsan.status());await ev(A,({x,z})=>{const s=window.namsan.status(),dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz)||1;const c=Math.cos(.45),sn=Math.sin(.45),ux=(dx*c-dz*sn)/d,uz=(dx*sn+dz*c)/d;window.namsan.deckGoTo(x-ux*3.2,z-uz*3.2,Math.atan2(-dx,-dz)+.25);},{x:bp.x,z:bp.z});
 await sl(1500);await shot(A,'pc-8-deck-together');
 await ev(B,({x,z})=>{const s=window.namsan.status(),dx=x-s.x,dz=z-s.z;window.namsan.deckGoTo(s.x,s.z,Math.atan2(-dx,-dz));},await ev(A,()=>window.namsan.status()));await sl(1200);await shot(B,'phone-5-deck-together');
 // 7) 나가기 단추(B: 손가락) → 문 앞
 const ex=B.locator('.ns-deck-exit');const exBox=await ex.boundingBox();check('휴대폰 「전망대 나가기」 단추 보임·44px',exBox&&exBox.height>=44,{exBox});
 await ex.tap();await until(B,()=>!window.namsan.tower().elev,null,6000);await sl(300);
 const tb=await T(B),sb=await ev(B,()=>window.namsan.status());
 check('7) 나가기 → 정상 입구 문 앞(광장), 탑 다시 보임',!tb.inside&&tb.towerVisible&&!tb.deckVisible&&Math.hypot(sb.x-t0.door.stand.x,sb.z-t0.door.stand.z)<.3,{r:tb.r});
 await sl(800);await shot(B,'phone-6-back-entrance');
 // A: 칩으로 나가기(엘리베이터 앞)
 await ev(A,d=>window.namsan.deckGoTo(d.arrive.x,d.arrive.z,d.arrive.heading+Math.PI),t1.deck);await sl(700);
 const re=await rows(A);check('엘리베이터 앞 칩 「엘리베이터로 나가기」',re.includes('엘리베이터로 나가기'),{re});
 await shot(A,'pc-9-exit-chip');
 await A.keyboard.press('KeyF');await until(A,()=>!!window.namsan.tower().elev,null,2000);await A.keyboard.press('Escape');
 check('Esc = 건너뛰기, 광장으로',await until(A,()=>!window.namsan.tower().inside&&!window.namsan.tower().elev,null,3000));
 // 다시 열면(저장) 광장
 await A.close();
 // 8) 밤 전망대(PC·휴대폰)
 const N1=await open('N-pc',{viewport:{width:1400,height:860},name:'밤',time:'21:00'});
 await ev(N1,()=>window.namsan.towerGo('in'));await sl(200);await ev(N1,()=>window.namsan.towerGo('skip'));await until(N1,()=>window.namsan.tower().inside&&!window.namsan.tower().elev,null,3000);
 const nd=await T(N1);await ev(N1,s=>window.namsan.deckGoTo(s.stand.x,s.stand.z,s.stand.heading),nd.deck.scopes[0]);await sl(2500);await shot(N1,'pc-10-deck-night');
 await ev(B,()=>window.namsan.towerGo('in'));await sl(100);await ev(B,()=>window.namsan.towerGo('skip'));await until(B,()=>window.namsan.tower().inside&&!window.namsan.tower().elev,null,3000);await sl(1500);await shot(B,'phone-7-deck-day-window');
 check('페이지 오류 없음',out.errors.length===0,{errors:out.errors.slice(0,5)});
 C.w.close();
}catch(e){check('스크립트 오류 없이 끝남',false,{error:String(e.stack??e).slice(0,600)});}
writeFileSync(`${OUT}/report.json`,JSON.stringify(out,null,1));
console.log(`\n${out.checks.length-failed}/${out.checks.length} 통과 → ${OUT}`);
await browser.close();await vite.close();srv.kill('SIGTERM');process.exit(failed?1:0);
