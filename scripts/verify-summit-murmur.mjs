// 정상 먼 웅성임(11-22 대표 선택) 연결 확인: 관악산·남산 정상에서 환경음 층 crowd가 summit-murmur-loop.flac으로 울리고, 옛 환호 파일은 받지도 않는지.
//  vite 개발 서버를 이 스크립트가 띄운다. 소리 켜짐 + 화면 한 번 누르기(아이폰과 같은 조건) → 8초 뒤 환경음 스냅샷·소리 파일 요청 목록.
//  node scripts/verify-summit-murmur.mjs → artifacts/summit-murmur-2026-11-22/report.json. 귀로 듣는 확인은 아님(층·크기·요청만).
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='artifacts/summit-murmur-2026-11-22';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5361);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:{ignored:['**/*']}},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const out={checks:[]};let failed=0;const sl=ms=>new Promise(r=>setTimeout(r,ms));
const check=(n,p,d={})=>{out.checks.push({n,pass:!!p,d});if(!p)failed++;console.log(p?'✔':'✘',n,JSON.stringify(d).slice(0,400));};
for(const [label,path,api] of [['관악산','/hiking/?start=summit&time=13:00&weather=clear','hiking'],['남산','/hiking/namsan/?start=summit&time=13:00&weather=clear','namsan']]){
 const ctx=await browser.newContext({viewport:{width:1280,height:800}});
 await ctx.addInitScript(()=>{localStorage.setItem('gwanak-hiking:sound:v1','true');
  const w=window.__amb=[];const f=window.fetch;window.fetch=function(u,...a){const s=String(u?.url??u);if(s.includes('sounds/ambient/'))w.push(s.split('/').pop());return f.call(this,u,...a);};});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/WebSocket|favicon|ERR_|Failed to load|open-meteo/.test(m.text()))errors.push(m.text().slice(0,200));});
 await p.goto(`http://127.0.0.1:${port}${path}`);await p.waitForFunction(a=>window[a]?.started,api,{timeout:240000});await sl(800);
 await p.mouse.click(640,300);await sl(8000);
 const snap=await p.evaluate(a=>{const s=a==='hiking'?window.hiking.audio().ambient:window.namsan.audio().ambient;return {section:s.section,crowd:s.layers.crowd,ridge:s.layers.ridge,city:s.layers.city,sumRmsDb:s.sumRmsDb,errors:s.errors,files:[...new Set(window.__amb)]};},api);
 check(`${label}: 정상에서 웅성임 층이 울림(목표 −44~−48dB)`,snap.crowd?.playing&&snap.crowd.targetDb<=-43.9&&snap.crowd.targetDb>=-48.1,{crowd:snap.crowd,section:snap.section});
 check(`${label}: 새 파일 summit-murmur-loop을 받고 옛 환호 파일은 안 받음`,snap.files.includes('summit-murmur-loop.flac')&&!snap.files.includes('summit-crowd-loop.flac'),{files:snap.files});
 check(`${label}: 바람이 같이 울림${label==='남산'?' + 도시 소리':''}`,snap.ridge?.playing&&(label!=='남산'||snap.city?.playing),{ridge:snap.ridge,city:snap.city});
 check(`${label}: 환경음·페이지 오류 없음`,!snap.errors.length&&!errors.length,{amb:snap.errors,page:errors.slice(0,3)});
 out[label]=snap;await p.screenshot({path:`${dir}/${label}.png`});await ctx.close();
}
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));console.log(`\n${out.checks.length-failed}/${out.checks.length} 통과 → ${dir}`);
await browser.close();await vite.close();process.exit(failed?1:0);
