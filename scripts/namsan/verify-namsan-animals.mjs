// 남산 동물 점검(월드개발 11-21). vite 개발 서버를 이 스크립트가 띄운다(함께 걷기는 브라우저 창끼리 = 서버 없음).
//  pc    PC 1920×1080: 코스 전체를 15m씩 옮기며 만난 동물(45m 안)·땅에 붙었는지·금지(성곽·차로·계단 측벽·시설) 밖인지,
//        반응 4종 — 고양이 F 쓰다듬기 → 냥펀치, 까치 날아감·어깨(모자)에 올라탐, 다람쥐 쳐다봄 → 모자, 멧토끼 쫑긋 → 달아남
//  phone 휴대폰 세로 390×844(터치): 고양이 칩 누르기 → 냥펀치, 다람쥐 모자
//  multi 두 창 같은 방(남산): 같은 시간 칸 출현 목록이 같고, A에서 놀란 동물이 B에도 전해짐
//  gwanak 관악산 그대로: 출현·다람쥐 모자·고양이 칩(관악산 페이지)
//   node scripts/namsan/verify-namsan-animals.mjs → artifacts/namsan-animals/(사진·report.json). 실패가 있으면 종료 코드 1. PART=pc,phone 처럼 일부만.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

const dir=process.env.OUT??'artifacts/namsan-animals';mkdirSync(dir,{recursive:true});
const PART=(process.env.PART??'pc,phone,multi,gwanak').split(',');
const {createServer}=await import('vite');const port=Number(process.env.PORT??5341);
// 다른 작업이 같은 폴더 파일을 고쳐도 점검 화면이 다시 열리지 않게 HMR·감시를 끈다
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:{ignored:['**/*']}},logLevel:'warn'});await vite.listen();
const ROOT=`http://127.0.0.1:${port}/hiking/`,URL0=`${ROOT}namsan/`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const out={at:new Date().toISOString(),checks:[],errors:[],meet:null};
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,300));};
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SKIP=/WebSocket|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open(label,{viewport={width:1920,height:1080},touch=false,query='time=13:00&weather=clear',ctx=null,url=URL0,ready='namsan'}={}){
 ctx??=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__c')){localStorage.clear();sessionStorage.setItem('__c','1');}});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));p.on('framenavigated',f=>{if(f===p.mainFrame()&&p.__loaded){out.errors.push(`${label}: 페이지가 다시 열림 ${f.url()}`);console.log('!! 다시 열림',label,f.url());}});p.on('crash',()=>{out.errors.push(`${label}: 탭 멈춤`);console.log('!! 탭 멈춤',label);});p.on('console',m=>{if(/WebGL|context|다시/.test(m.text()))console.log('[console]',label,m.text().slice(0,200));});p.on('console',m=>{if(m.type()==='error'&&!SKIP.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,200)}`);});
 await p.goto(`${url}?${query}`);p.__loaded=true;await p.waitForFunction(r=>window[r]?.started,ready,{timeout:180000});await sl(800);
 // 말풍선 기록(점검용): 뜬 문구를 순서대로 모은다
 await p.evaluate(()=>{window.__says=[];let last=null;setInterval(()=>{const s=window.__trailLastSay;if(s&&s!==last){last=s;window.__says.push(s.text);}},50);});
 return p;}
const ev=(p,f,a)=>p.evaluate(f,a);
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
const says=p=>ev(p,()=>window.__says.slice());
const clearSays=p=>ev(p,()=>{window.__says.length=0;window.__trailLastSay=null;});
const animals=p=>ev(p,()=>window.namsan.animals());
// 동물을 바라보게 선다(3인칭 카메라가 동물 쪽을 봄)
const faceTo=(p,x,z)=>ev(p,([x,z])=>{const s=window.namsan.status();window.namsan.goTo(s.x,s.z,Math.atan2(-(x-s.x),-(z-s.z)));},[x,z]);
// 코스 s에 서서 kind를 하나 부른다(옆 1m·앞 ahead m, 양쪽 중 자리가 나는 쪽). 돌려줌 = 동물 상태
async function summonAt(p,s,kind,{ahead=2,offset=1}={}){
 await ev(p,s=>{window.namsan.setAuto(false);window.namsan.jump(s);},s);await sl(300);
 for(const side of [1,-1]){const id=await ev(p,([k,a,o,sd])=>window.namsan.trail.summon(k,{ahead:a,offset:o,side:sd}),[kind,ahead,offset,side]);if(!id)continue;await sl(200);
  const a=(await animals(p)).find(x=>x.id===id);if(a&&!(await ev(p,a=>window.namsan.animalLanes.inForbid(a.x,a.z),a))){await faceTo(p,a.x,a.z);return a;}}
 return null;}
// 땅에 붙었는지·금지 밖인지(배회 중 날기·나무 위·덤불 속 빼고)
const groundCheck=p=>ev(p,()=>{const L=window.namsan.animalLanes,h=window.namsan.trail.height;return window.namsan.animals().filter(a=>a.state==='wander'&&a.visible&&!['fly','hidden','climb'].includes(a.mode)).map(a=>({id:a.id,kind:a.kind,mode:a.mode,dy:+(a.y-h(a.x,a.z)-(a.kind==='magpie'?.085*1.3:0)).toFixed(3),forbid:L.inForbid(a.x,a.z),bush:!!L.inBush?.(a.x,a.z)}));});

if(PART.includes('pc')){
 const p=await open('pc');
 const sp=await ev(p,()=>window.namsan.spawns());check('pc: 이번 시간 칸 출현 목록',sp.list.length>=3,{n:sp.list.length,kinds:[...new Set(sp.list.map(s=>s.kind))]});
 // 코스 전체 15m씩: 만난 동물(가까운 3마리 모형)·땅·금지
 const course=await ev(p,()=>window.namsan.status().course),met=new Map(),bad=[],inBush=[];let maxDy=0,groundN=0;
 await ev(p,()=>window.namsan.setAuto(false));
 for(let s=2;s<course;s+=15){await ev(p,s=>window.namsan.jump(s),s);await sl(220);
  for(const a of await animals(p))if(!met.has(a.id))met.set(a.id,{kind:a.kind,at:s});
  for(const g of await groundCheck(p)){groundN++;if(g.bush)inBush.push({...g,s});maxDy=Math.max(maxDy,Math.abs(g.dy));if(Math.abs(g.dy)>.3||g.forbid)bad.push({...g,s});}}
 const kinds=[...new Set([...met.values()].map(m=>m.kind))];out.meet={n:met.size,kinds,list:[...met].map(([id,m])=>({id,...m}))};
 check('pc: 코스 한 번에 동물을 여러 번 만남(가까이 모형이 생긴 동물)',met.size>=4,{n:met.size,kinds});
 check('pc: 배회 중 동물이 땅에 붙어 있고(±0.3m) 성곽·차로·계단 측벽·시설 위가 아님',!bad.length,{maxDy:+maxDy.toFixed(3),bad:bad.slice(0,5)});
 // 11-22 검수 문제 1: 땅 위 배회 동물이 길가 덤불(그림이 그린 덤불 목록)과 겹치지 않음
 const bushN=await ev(p,()=>window.namsan.animalLanes.bushes);check('pc: 땅 위 배회 동물이 길가 덤불과 겹치지 않음',bushN>1000&&!inBush.length,{bushes:bushN,samples:groundN,inBush:inBush.slice(0,5)});
 // 화면: 동물이 보이는 장면 하나
 {const a=(await ev(p,()=>window.namsan.spawns())).list.find(x=>x.m!=null);if(a){await ev(p,m=>window.namsan.jump(Math.max(2,m-6)),a.m);await sl(500);const b=(await animals(p)).find(x=>x.id===a.id);if(b)await faceTo(p,b.x,b.z);await sl(700);await shot(p,'pc-wander');}}

 // ① 고양이: 4m 안 쳐다봄 → 칩 → F → 쓰다듬기 → 냥펀치 → 달아남
 let c=await summonAt(p,60,'cat',{ahead:2.5,offset:1});
 if(!c)c=await summonAt(p,700,'cat',{ahead:2.5,offset:1});
 await sl(900);const chip=await ev(p,()=>{const c=document.querySelector('#trail-chip');return {shown:!c.hidden,text:c.textContent.trim()};});
 check('pc: 고양이 가까이 → 「쓰다듬기」 칩',!!c&&chip.shown&&/쓰다듬기/.test(chip.text),{cat:c&&{state:c.state},chip});
 await shot(p,'pc-cat-chip');await clearSays(p);await p.keyboard.press('KeyF');await sl(2200);await shot(p,'pc-cat-pet');await sl(1500);await shot(p,'pc-cat-punch');await sl(1200);
 const cs=await says(p),cst=(await animals(p)).find(a=>a.kind==='cat');
 check('pc: F → 쓰다듬기(골골) → 냥펀치! → 달아남',cs.some(t=>/골골/.test(t))&&cs.includes('냥펀치!')&&(!cst||['flee','gone'].includes(cst.state)),{says:cs,cat:cst?.state});
 let back=null;for(let k=0;k<40;k++){await sl(250);back=await ev(p,()=>({busy:window.namsan.trail.busy(),over:!!window.namsan.trail.override(),s:window.namsan.status()}));if(!back.busy&&!back.over)break;}
 check('pc: 쓰다듬은 뒤 길로 돌아옴(10초 안)',!back.busy&&!back.over,{busy:back.busy,over:back.over,onPath:back.s.s});

 // ③ 다람쥐: 3m 안 쳐다봄(찍?) → 5초 가만히 → 모자 위(여기 내 자리)
 const q=await summonAt(p,300,'squirrel',{ahead:1.2,offset:1});await clearSays(p);await sl(1200);
 let qs=(await animals(p)).find(a=>a.kind==='squirrel');check('pc: 다람쥐 가까이 → 쳐다봄',!!q&&['look','climb','hat'].includes(qs?.state),{state:qs?.state,says:await says(p)});
 await sl(6500);qs=(await animals(p)).find(a=>a.kind==='squirrel');const sq=await says(p);await shot(p,'pc-squirrel-hat');
 check('pc: 다람쥐 5초 가만히 → 모자 위(여기 내 자리)',qs?.state==='hat'&&sq.includes('여기 내 자리'),{state:qs?.state,says:sq});
 await ev(p,()=>window.namsan.setAuto(true));await sl(1200);qs=(await animals(p)).find(a=>a.kind==='squirrel');check('pc: 걸으면 다람쥐가 모자에서 달아남',!qs||['flee','gone'].includes(qs.state),{state:qs?.state});
 await ev(p,()=>window.namsan.setAuto(false));

 // ② 까치: 4m 안 → 날아감(깍깍)·어깨(모자)에 올라탐
 const m=await summonAt(p,700,'magpie',{ahead:6,offset:1});await clearSays(p);
 if(m){await ev(p,()=>{const s=window.namsan.status();window.namsan.jump(s.s+4.5);});}
 await sl(1500);let ms=await says(p),mst=(await animals(p)).find(a=>a.kind==='magpie');
 check('pc: 까치 다가가면 날아감',!!m&&(ms.some(t=>/깍깍|푸드덕/.test(t))||['fly','to-head','ride','land'].includes(mst?.state)),{says:ms,state:mst?.state});
 if(!['to-head','ride'].includes(mst?.state)){await summonAt(p,705,'magpie',{ahead:7,offset:1});await ev(p,()=>window.namsan.trail.magpieRide());}
 await sl(2200);mst=(await animals(p)).find(a=>a.kind==='magpie');ms=await says(p);await shot(p,'pc-magpie-ride');
 check('pc: 까치가 모자 위에 올라탐(깍! 같이 감)',mst?.state==='ride'&&ms.some(t=>/같이 감/.test(t)),{state:mst?.state,says:ms});
 await ev(p,()=>window.namsan.trail.reset());await sl(300);
 // 까치가 내려가길 기다리지 않고 다음(머리 위 자리는 한 마리만): 걸어서 떨어뜨림
 await ev(p,()=>{window.namsan.setAuto(true);});await sl(1500);await ev(p,()=>window.namsan.setAuto(false));await sl(3500);

 // ④ 멧토끼: 8m 안 쫑긋 → 3m 안 달아남
 const h=await summonAt(p,420,'hare',{ahead:9,offset:1});await clearSays(p);
 if(h){await ev(p,()=>{const s=window.namsan.status();window.namsan.jump(s.s+3);});}await sl(900);
 let hs=(await animals(p)).find(a=>a.kind==='hare');await shot(p,'pc-hare-alert');
 const hb=hs&&await ev(p,a=>window.namsan.animalLanes.inBush(a.x,a.z),hs);check('pc: 420m 멧토끼가 덤불 밖(몸이 보임)',!!hs&&hb===false,{at:hs&&{x:hs.x,z:hs.z}});
 check('pc: 멧토끼 다가가면 쫑긋(경계)',!!h&&['alert','wary','flee'].includes(hs?.state),{state:hs?.state,says:await says(p)});
 if(hs){await ev(p,a=>{for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1.5,1],[-1.5,-1]])if(window.namsan.goTo(a.x+dx,a.z+dz))return true;const s=window.namsan.status();window.namsan.jump(s.s+5);return false;},hs);}
 await sl(1400);hs=(await animals(p)).find(a=>a.kind==='hare');const hz=await says(p);await shot(p,'pc-hare-flee');
 check('pc: 멧토끼 더 다가가면 달아남',!hs||['flee','gone'].includes(hs.state),{state:hs?.state,says:hz});
 const snd=await ev(p,()=>window.namsan.trailSound());check('pc: 동물 효과음은 공용 마스터로(소리 꺼짐이면 0건)',!!snd,snd);
 await p.context().close();
}

if(PART.includes('phone')){
 const p=await open('phone',{viewport:{width:390,height:844},touch:true});
 const c=await summonAt(p,700,'cat',{ahead:2.5,offset:1})??await summonAt(p,60,'cat',{ahead:2.5,offset:1});await sl(900);
 const chip=await ev(p,()=>{const b=document.querySelector('#trail-chip button');if(!b)return null;const r=b.getBoundingClientRect();return {text:b.textContent.trim(),w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});
 await shot(p,'phone-cat-chip');
 check('phone: 고양이 칩이 화면 안·손가락 크기(44px 이상)',!!c&&chip?.inside&&chip.h>=43.5,chip);
 await clearSays(p);await p.locator('#trail-chip button').first().tap().catch(()=>{});
 for(let k=0;k<40&&!(await says(p)).includes('냥펀치!');k++)await sl(200);await shot(p,'phone-cat-punch');
 const cs=await says(p);check('phone: 칩 누르기 → 쓰다듬기 → 냥펀치!',cs.some(t=>/골골/.test(t))&&cs.includes('냥펀치!'),{says:cs});
 await sl(2500);
 // 쓰다듬기 동작이 끝나야 동물 부품이 내 자리를 다시 따라온다(그 전에 부르면 고양이 자리 둘레에 나옴, 11-22)
 for(let k=0;k<50&&await ev(p,()=>window.namsan.animals().some(a=>a.state==='petted'));k++)await sl(200);
 const q=await summonAt(p,300,'squirrel',{ahead:1.2,offset:1});await clearSays(p);await sl(7500);
 const qs=(await animals(p)).find(a=>a.kind==='squirrel');await shot(p,'phone-squirrel-hat');
 check('phone: 다람쥐 모자 위',!!q&&qs?.state==='hat',{state:qs?.state,says:await says(p)});
 const m=await summonAt(p,705,'magpie',{ahead:7,offset:1});await ev(p,()=>window.namsan.trail.reset());
 await ev(p,()=>{window.namsan.setAuto(true);});await sl(1600);await ev(p,()=>window.namsan.setAuto(false));await sl(3000);
 await summonAt(p,705,'magpie',{ahead:7,offset:1});const ok=await ev(p,()=>window.namsan.trail.magpieRide());await sl(2400);
 const mst=(await animals(p)).find(a=>a.kind==='magpie');await shot(p,'phone-magpie-ride');check('phone: 까치 모자 위',ok&&mst?.state==='ride',{state:mst?.state});
 await p.context().close();
}

if(PART.includes('multi')){
 const ctx=await browser.newContext({viewport:{width:960,height:640}});
 const A=await open('multiA',{ctx,query:'multi=남산&server=off&name=가&time=13:00'}),B=await open('multiB',{ctx,query:'multi=남산&server=off&name=나&time=13:00'});
 await sl(1500);
 const la=await ev(A,()=>window.namsan.spawns()),lb=await ev(B,()=>window.namsan.spawns());
 const key=l=>JSON.stringify(l.list.map(s=>[s.id,s.kind,s.x,s.z]));
 check('multi: 같은 방 두 화면의 출현 목록(자리·종류)이 같음',la.slot===lb.slot&&key(la)===key(lb),{slot:la.slot,n:la.list.length});
 // A가 실제 출현 동물(까치·토끼·다람쥐) 옆으로 가서 놀라게 한다 → B에 전해짐
 const got=await ev(A,()=>new Promise(res=>{window.addEventListener('hiking:animal-startle',e=>res(e.detail),{once:true});setTimeout(()=>res(null),60000);
  (async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));window.namsan.setAuto(false);
   for(const sp of window.namsan.spawns().list.filter(s=>s.kind==='magpie'||s.kind==='hare')){window.namsan.jump(Math.max(2,sp.m-2));await sl(600);
    const a=window.namsan.animals().find(x=>x.id===sp.id);if(!a)continue;const L=window.namsan.animalLanes;
    // 동물 쪽 길 가장자리로(걷는 곳 안에서 가장 가까운 자리)
    for(let k=0;k<=20;k++){const s=window.namsan.status(),dx=a.x-s.x,dz=a.z-s.z,d=Math.hypot(dx,dz);if(d<1.4)break;if(!window.namsan.goTo(s.x+dx/d*.3,s.z+dz/d*.3))break;}
    const s2=window.namsan.status(),a2=window.namsan.animals().find(x=>x.id===sp.id);(window.__tries??=[]).push({id:sp.id,kind:sp.kind,d:a2&&+Math.hypot(a2.x-s2.x,a2.z-s2.z).toFixed(2),state:a2?.state,mode:a2?.mode});
    await sl(1500);}})();}));
 console.log('시도',JSON.stringify(await ev(A,()=>window.__tries??[])).slice(0,600));
 await sl(1500);const rb=await ev(B,()=>window.namsan.trail.remoteAnimals());
 check('multi: A에서 놀란 동물이 B 화면에 전해짐(같은 동물)',!!got&&rb.some(r=>r.id===`${got.zone}@${got.slot}#${got.i}`),{startle:got,remote:rb.slice(-3)});
 await shot(A,'multi-A');await shot(B,'multi-B');await ctx.close();
}

if(PART.includes('gwanak')){
 const p=await open('gwanak',{url:ROOT,query:'start=entrance&time=13:00&weather=clear',ready:'hiking'});
 const sp=await ev(p,()=>window.hiking.trail.spawns());check('gwanak: 관악산 출현 목록 그대로 나옴',sp.list.length>=10,{n:sp.list.length,kinds:[...new Set(sp.list.map(s=>s.kind))]});
 await ev(p,()=>{const s=window.hiking.status?.();});
 const id=await ev(p,()=>window.hiking.trail.summon('squirrel',{ahead:1.5,offset:1}));await sl(400);await ev(p,()=>window.hiking.trail.squirrelHat());await sl(1500);
 const st=await ev(p,()=>window.hiking.trail.status().animals);await shot(p,'gwanak-squirrel-hat');
 check('gwanak: 다람쥐 모자(관악산 동작 그대로)',!!id&&st.some(a=>a.kind==='squirrel'&&a.state==='hat'),{animals:st.map(a=>`${a.kind}:${a.state}`)});
 const chip=await ev(p,()=>!!document.querySelector('.nb-snack')&&!!document.querySelector('#choco'));check('gwanak: 관악산 간식 줄(초콜릿) 그대로',chip);
 await p.context().close();
}
check('콘솔 오류 없음',!out.errors.length,{errors:out.errors.slice(0,6)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await vite.close();
const fail=out.checks.filter(c=>!c.pass);console.log(`\n${out.checks.length-fail.length}/${out.checks.length} 통과`);process.exit(fail.length?1:0);
