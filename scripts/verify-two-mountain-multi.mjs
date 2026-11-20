// 한 게임 통합 7단계(월드개발 11-20): 관악산·남산 함께 걷기 섞임 시험. vite와 함께 걷기 서버를 이 스크립트가 직접 띄운다(공개 서버에 안 붙음).
//  ① 같은 서버에 관악산 2명(관악산-1)·남산 2명(남산-1): 명단은 같은 산 사람만, 서버 /health 인원(관악산 줄 2·등산 전체 4 → 남산 2)
//  ② 채팅: 관악산 말은 관악산 사람만, 남산 말은 남산 사람만 받음
//  ③ 행동 상태: 남산 사람이 자물쇠를 걸면 남산 상대는 받고(act x 'lk-…'), 관악산 사람 명단에는 그런 값이 없음
//  ④ 동행 제안을 다른 산 사람 id로 보내면 거절되고, 받은 쪽에는 아무 제안도 안 뜸
//  ⑤ 이름이 같은 두 사람(관악산·남산)도 서로 안 섞임
//  ⑥ 관악산 사람이 남산으로 옮기면: 관악산 명단에서 빠지고 남산 명단에 들어감
//  ⑦ 서버 없이(같은 브라우저 창끼리, BroadcastChannel) 관악산·남산 창도 안 섞임
//   node scripts/verify-two-mountain-multi.mjs → artifacts/two-mountain-multi/(사진·report.json). 실패가 있으면 종료 코드 1.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';

const dir=process.env.OUT??'artifacts/two-mountain-multi';mkdirSync(dir,{recursive:true});
let vite=null,pageUrl=process.env.PAGE_URL;
if(!pageUrl){const {createServer}=await import('vite');const port=Number(process.env.PORT??5297);vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false},logLevel:'warn'});await vite.listen();pageUrl=`http://127.0.0.1:${port}`;}
const multiPort=Number(process.env.MULTI_PORT??8847),wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const out={at:new Date().toISOString(),pageUrl,checks:[],health:{},errors:[]};
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SKIP_ERR=/WebSocket connection|favicon|net::ERR|Failed to load resource|open-meteo/;
const health=async()=>(await fetch(`http://127.0.0.1:${multiPort}/health`)).json();
const Q='time=13:00&weather=clear&quality=low';
const S=encodeURIComponent(wsUrl);
const gwanakUrl=(name,server=S)=>`${pageUrl}/hiking/?multi=${encodeURIComponent('관악산-1')}&server=${server}&name=${encodeURIComponent(name)}&${Q}&start=entrance`;
const namsanUrl=(name,server=S)=>`${pageUrl}/hiking/namsan/?multi=${encodeURIComponent('남산-1')}&server=${server}&name=${encodeURIComponent(name)}&${Q}`;
async function open(label,url,{ctx=null}={}){
 const c=ctx??await browser.newContext({viewport:{width:900,height:600},deviceScaleFactor:1});
 if(!ctx)await c.addInitScript(()=>{if(!sessionStorage.getItem('__tm')){localStorage.clear();sessionStorage.setItem('__tm','1');}localStorage.setItem('gwanak-sound-enabled','false');
  window.__ev=[];const d=window.dispatchEvent.bind(window);window.dispatchEvent=e=>{if(/^hiking:(chat|pair)/.test(e.type))window.__ev.push({type:e.type,...(e.detail??{})});return d(e);};});
 const p=await c.newPage();p.label=label;
 p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!SKIP_ERR.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,300)}`);});
 await p.goto(url);return p;
}
// 두 산의 함께 걷기 정보를 같은 모양으로 읽는다(관악산 hiking.multi(), 남산 namsan.multi())
const info=p=>p.evaluate(()=>{const m=window.namsan?.multi?window.namsan.multi():window.hiking?.multi?.();return m?{id:m.id,room:m.room,status:m.status,roster:(m.roster??[]).map(r=>({id:r.id,name:r.name,x:r.x,z:r.z,act:r.act??null}))}:null;});
const ready=async p=>{await p.waitForFunction(()=>(window.namsan?.started||window.hiking?.started)&&(window.namsan?.multi?.()??window.hiking?.multi?.()),null,{timeout:240000});};
const waitRoster=(p,n,ms=40000)=>p.waitForFunction(n=>{const m=window.namsan?.multi?window.namsan.multi():window.hiking?.multi?.();return (m?.roster?.length??-1)===n;},n,{timeout:ms}).catch(()=>{});
const names=i=>(i?.roster??[]).map(r=>r.name).sort();
const chats=p=>p.evaluate(()=>window.__ev.filter(e=>e.type==='hiking:chat').map(e=>e.text));

try{
 // ── ① 네 사람 ──
 const G1=await open('G1',gwanakUrl('관악가')),N1=await open('N1',namsanUrl('남산가'));
 const G2=await open('G2',gwanakUrl('같은이름')),N2=await open('N2',namsanUrl('같은이름'));
 for(const p of [G1,G2,N1,N2])await ready(p);
 for(const p of [G1,G2,N1,N2])await waitRoster(p,1);await sleep(2500);
 const [g1,g2,n1,n2]=await Promise.all([G1,G2,N1,N2].map(info));
 out.rooms={g1:g1?.room,g2:g2?.room,n1:n1?.room,n2:n2?.room};
 check('방: 관악산 둘은 관악산 방, 남산 둘은 남산 방',/^관악산/.test(g1?.room)&&g1?.room===g2?.room&&/^남산/.test(n1?.room)&&n1?.room===n2?.room,out.rooms);
 check('관악산 명단 = 관악산 사람만',JSON.stringify(names(g1))==='["같은이름"]'&&JSON.stringify(names(g2))==='["관악가"]',{g1:names(g1),g2:names(g2)});
 check('남산 명단 = 남산 사람만',JSON.stringify(names(n1))==='["같은이름"]'&&JSON.stringify(names(n2))==='["남산가"]',{n1:names(n1),n2:names(n2)});
 // ⑤ 같은 이름: G1의 「같은이름」은 G2 id, N1의 「같은이름」은 N2 id
 check('이름이 같아도 각자 자기 산 사람(id로 확인)',g1?.roster?.[0]?.id===g2?.id&&n1?.roster?.[0]?.id===n2?.id&&g2?.id!==n2?.id,{g1sees:g1?.roster?.[0]?.id,g2:g2?.id,n1sees:n1?.roster?.[0]?.id,n2:n2?.id});
 const h1=await health();out.health.four=h1;
 const gwanakRow=(h1.servers?.hiking??[]).find(s=>s.id==='1');
 check('서버 인원: 관악산 1서버 2명·등산 전체 4명(→ 남산 2명)',gwanakRow?.count===2&&h1.experiences?.hiking?.clients===4,{gwanak1:gwanakRow?.count,hikingAll:h1.experiences?.hiking?.clients,rooms:h1.experiences?.hiking?.rooms});
 const nsCount=await N1.evaluate(async h=>{const {namsanCount}=await import('/src/namsan/namsan-walk.js');return namsanCount(h);},h1);
 check('남산 입장 창 인원 = 2',nsCount===2,{nsCount});

 // ── ② 채팅 ──
 await G1.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:chat-send',{detail:{text:'관악산에서 인사'}})));
 await N1.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:chat-send',{detail:{text:'남산에서 인사'}})));
 await G2.waitForFunction(()=>window.__ev.some(e=>e.type==='hiking:chat'&&e.text==='관악산에서 인사'),null,{timeout:15000}).catch(()=>{});
 await N2.waitForFunction(()=>window.__ev.some(e=>e.type==='hiking:chat'&&e.text==='남산에서 인사'),null,{timeout:15000}).catch(()=>{});await sleep(1500);
 const [cg2,cn2,cg1,cn1]=await Promise.all([G2,N2,G1,N1].map(chats));
 check('채팅: 관악산 말은 관악산만',cg2.includes('관악산에서 인사')&&!cn2.includes('관악산에서 인사')&&!cn1.includes('관악산에서 인사'),{G2:cg2,N2:cn2,N1:cn1});
 check('채팅: 남산 말은 남산만',cn2.includes('남산에서 인사')&&!cg2.includes('남산에서 인사')&&!cg1.includes('남산에서 인사'),{G1:cg1,G2:cg2,N2:cn2});

 // ── ③ 행동 상태(자물쇠) ──
 await N1.evaluate(()=>{const s=window.namsan.spots().spots.find(x=>x.action==='lock');window.namsan.goTo(s.x,s.z);return window.namsan.lockCard({c:3,h:1,hang:true});});
 await N2.waitForFunction(()=>(window.namsan.multi()?.roster?.[0]?.act?.x??'').startsWith('lk-'),null,{timeout:15000}).catch(()=>{});await sleep(1200);
 const [an2,ag1,ag2]=await Promise.all([N2,G1,G2].map(p=>info(p)));
 const x2=an2?.roster?.[0]?.act?.x??'';
 const gActs=[...(ag1?.roster??[]),...(ag2?.roster??[])].map(r=>r.act?.x??null);
 check('자물쇠: 남산 상대는 받음, 관악산 명단엔 없음',x2.startsWith('lk-')&&gActs.every(x=>!String(x??'').startsWith('lk-')),{n2sees:x2,gwanakActs:gActs});
 const nl=await N2.evaluate(()=>window.namsan.locks());check('자물쇠: 남산 상대 화면에 걸림',nl.remoteHung>=1,{remoteHung:nl.remoteHung});

 // ── ④ 다른 산 사람에게 동행 제안 ──
 await G1.evaluate(id=>window.dispatchEvent(new CustomEvent('hiking:pair-offer',{detail:{to:id}})),n1.id);await sleep(3000);
 const pg1=await G1.evaluate(()=>window.__ev.filter(e=>/^hiking:pair/.test(e.type)&&e.type!=='hiking:pair-offer'));
 const pn1=await N1.evaluate(()=>window.__ev.filter(e=>/^hiking:pair/.test(e.type)));
 // 화면이 늘 보내는 idle 상태·사람 목록 알림은 빼고, 제안이 걸렸는지(offer·idle 아닌 상태·동행 상대)만 본다
 const live=e=>!!e.offer||!!e.partner||(e.phase&&e.phase!=='idle')||/incoming|request/.test(e.type);
 check('다른 산 사람에게 동행 제안 → 받은 쪽에 아무것도 안 뜸·보낸 쪽도 동행 안 됨',!pn1.some(live)&&!pg1.some(e=>e.partner),{G1:pg1.filter(e=>e.type!=='hiking:pair-people').slice(-3),N1live:pn1.filter(live).slice(0,3),N1all:pn1.length});

 await G1.screenshot({path:`${dir}/G1-gwanak.png`});await N2.screenshot({path:`${dir}/N2-namsan.png`});

 // ── ⑥ 관악산 G2가 남산으로 옮김(같은 탭 주소 이동) ──
 await G2.goto(namsanUrl('같은이름'));await ready(G2);
 await waitRoster(G1,0);await waitRoster(N1,2);await sleep(2500);
 const [m1,mn1,mg2]=await Promise.all([G1,N1,G2].map(info));
 check('옮긴 사람: 관악산 명단에서 빠짐',(m1?.roster?.length??-1)===0,{g1:names(m1)});
 check('옮긴 사람: 남산 명단에 들어감(남산 셋)',(mn1?.roster?.length??0)===2&&(mg2?.roster?.length??0)===2&&/^남산/.test(mg2?.room),{n1:names(mn1),moved:{room:mg2?.room,roster:names(mg2)}});
 const h2=await health();out.health.moved=h2;
 check('서버 인원: 관악산 1명·등산 전체 4명',(h2.servers?.hiking??[]).find(s=>s.id==='1')?.count===1&&h2.experiences?.hiking?.clients===4,{gwanak1:(h2.servers?.hiking??[]).find(s=>s.id==='1')?.count,all:h2.experiences?.hiking?.clients});
 // 남산으로 온 사람 위치가 남산 땅 안(관악산 좌표가 남지 않음)
 const pos=await N1.evaluate(id=>{const r=window.namsan.multi().roster.find(r=>r.id===id);const b=window.namsan.status();return r?{x:r.x,z:r.z,meX:b.x,meZ:b.z}:null;},mg2?.id);
 check('옮긴 사람 위치가 남산 코스 근처(1.5km 안)',pos&&Math.hypot(pos.x-pos.meX,pos.z-pos.meZ)<1500,pos);
 for(const p of [G1,G2,N1,N2])await p.context().close();

 // ── ⑦ 서버 없이 같은 브라우저 창끼리 ──
 const ctx=await browser.newContext({viewport:{width:900,height:600},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('gwanak-sound-enabled','false');window.__ev=[];});
 const L1=await open('L1-gwanak',gwanakUrl('창관악','off'),{ctx}),L2=await open('L2-namsan',namsanUrl('창남산','off'),{ctx}),L3=await open('L3-namsan',namsanUrl('창남산2','off'),{ctx});
 for(const p of [L1,L2,L3])await ready(p);
 await waitRoster(L2,1);await sleep(6000);
 const [l1,l2,l3]=await Promise.all([L1,L2,L3].map(info));
 check('서버 없이(창끼리): 관악산 창은 혼자, 남산 창 둘은 서로만',(l1?.roster?.length??-1)===0&&JSON.stringify(names(l2))==='["창남산2"]'&&JSON.stringify(names(l3))==='["창남산"]',{l1:names(l1),l2:names(l2),l3:names(l3),rooms:[l1?.room,l2?.room,l3?.room]});
 await ctx.close();
}catch(e){check('진행 오류',false,{message:e.message,stack:e.stack?.split('\n').slice(0,3).join(' | ')});}

out.errors=[...new Set(out.errors)];
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,8)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
const fail=out.checks.filter(c=>!c.pass);console.log(`\n${out.checks.length-fail.length}/${out.checks.length} 통과`);
await browser.close();await vite?.close();await srv?.close?.();
process.exit(fail.length?1:0);
