// 11-19 실사 모드 남은 코드 지운 뒤 점검: 빌드본(vite preview)으로 등산(낮·밤)·흡연장·크리스마스를 PC 1280×800·휴대폰 세로 390×844로 띄운다.
//  보는 것: 시작됨·페이지 오류 0·실사 전용 요청 0(텍스처·HDR·실사 식생/모델·사진판 그림)·등산 style 'toon'·예전 저장값 'gwanak-graphics-style=realistic'이 있어도 툰으로 열림.
//  먼저 npm run build. 결과: artifacts/realistic-removal/*.png + report.json
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const OUT=ROOT+'/artifacts/realistic-removal';mkdirSync(OUT,{recursive:true});
const req=createRequire(ROOT+'/package.json');
const pw=await import(req.resolve('@playwright/test'));const chromium=pw.chromium??pw.default.chromium;
const {preview}=await import(req.resolve('vite'));
const PORT=+(process.env.PORT||4191);
const server=await preview({root:ROOT,configFile:ROOT+'/vite.config.js',preview:{port:PORT,host:'127.0.0.1',strictPort:true},logLevel:'warn'});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const FORBIDDEN=[/-diff\.jpg(\?|$)/,/-nor_gl\.png(\?|$)/,/-rough\.jpg(\?|$)/,/\.hdr(\?|$)/,/\/assets\/realistic\/generated\/nature\//,/\/assets\/realistic\/models\//,/terrain-material/,/pine-impostor/,/seoul-landcover/];
const PAGES=[
 {id:'hiking-day',url:'/hiking/?start=entrance&time=12:00&weather=clear&quality=low&serverpick=off',ready:()=>window.hiking?.started===true,
  init:()=>{localStorage.setItem('gwanak-graphics-style','realistic');localStorage.setItem('gwanak-sound-enabled','false');}},
 {id:'hiking-night',url:'/hiking/?start=summit&time=21:00&weather=clear&quality=low&serverpick=off',ready:()=>window.hiking?.started===true,init:()=>{localStorage.setItem('gwanak-sound-enabled','false');}},
 {id:'smoking',url:'/smoking/?time=day&serverpick=off',ready:()=>!!window.lounge?.status,
  init:()=>{localStorage.setItem('online-smoking',JSON.stringify({nickname:'동동',status:'quit',outfit:'shirt',seenIntro:true,muted:true,quitDate:'2026-11-01'}));}},
 {id:'christmas',url:'/christmas/?serverpick=off',ready:()=>!!window.xmas?.player,
  init:()=>{localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));}},
];
const SIZES={pc:{viewport:{width:1280,height:800}},phone:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}};
const report={},fails=[];
for(const pg of PAGES)for(const [sz,opt] of Object.entries(SIZES)){
 const key=`${pg.id}-${sz}`;const ctx=await browser.newContext(opt);await ctx.addInitScript(pg.init);const p=await ctx.newPage();
 const errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message.slice(0,200)));p.on('request',r=>{if(FORBIDDEN.some(re=>re.test(r.url())))bad.push(r.url());});
 try{
  await p.goto(`http://127.0.0.1:${PORT}${pg.url}`);
  // 등산 첫 화면(산 고르기)·흡연장 입장 안내는 점검 브라우저에서 자동으로 빠진다(webdriver)
  await p.waitForFunction(pg.ready,null,{timeout:240000});
  if(pg.id.startsWith('hiking'))await p.evaluate(()=>window.hiking.chunks?.ready?.()).catch(()=>{});
  await p.waitForTimeout(6000);
  const info=await p.evaluate(()=>({style:window.hiking?.style??null,saved:localStorage.getItem('gwanak-graphics-style'),render:window.hiking?.rendering?.()?.toon?'toon':null,fps:window.lounge?.fps??null}));
  await p.screenshot({path:`${OUT}/${key}.png`});
  const f=[];if(errors.length)f.push('페이지 오류 '+errors.join(' | '));if(bad.length)f.push('실사 요청 '+bad.slice(0,3).join(' '));
  if(pg.id.startsWith('hiking')&&info.style!=='toon')f.push('style '+info.style);
  if(pg.id==='hiking-day'&&info.saved!==null)f.push('예전 저장값이 남음 '+info.saved);
  report[key]={...info,errors,bad};if(f.length)fails.push(`${key}: ${f.join(' / ')}`);
  console.log(`${key}\t${f.length?'✗ '+f.join(' / '):'✓'}\t${JSON.stringify(info)}`);
 }catch(e){fails.push(`${key}: ${e.message.slice(0,200)}`);console.log(`${key}\t✗ ${e.message.slice(0,200)}`);}
 await ctx.close();
}
report.fails=fails;writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1));
console.log(fails.length?`\n실패 ${fails.length}건\n`+fails.join('\n'):'\n모두 통과');
await browser.close();await new Promise(r=>server.httpServer.close(r));process.exit(fails.length?1:0);
