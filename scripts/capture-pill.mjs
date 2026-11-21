// 위 왼쪽 진행 알약·시점 칩 촬영·측정(11-21 알약 글 줄이기). vite 개발 서버를 직접 띄운다.
//   OUT=artifacts/pill-text/before node scripts/capture-pill.mjs → <OUT>/<산>-<화면>.png + report.json
//   측정: 알약 글이 알약 안인지(글 오른쪽 ≤ 알약 오른쪽), 알약과 시점 칩이 겹치지 않는지, 말줄임(…)이 일어났는지
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir=process.env.OUT??'artifacts/pill-text/after';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5361);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const SIZES={portrait:{width:390,height:844,touch:true},narrow:{width:360,height:780,touch:true},android:{width:412,height:915,touch:true},landscape:{width:844,height:390,touch:true},pc:{width:1920,height:1080,touch:false}};
const ONLY=(process.env.SIZES??Object.keys(SIZES).join(',')).split(',');
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const out={at:new Date().toISOString(),shots:[]};let bad=0;
const measure=p=>p.evaluate(()=>{const pill=document.querySelector('.hk-pill'),t=document.querySelector('.hk-pill-t'),v=document.querySelector('.hk-topl #view');
 const r=e=>{const b=e?.getBoundingClientRect();return b?{l:Math.round(b.left),r:Math.round(b.right),t:Math.round(b.top),b:Math.round(b.bottom),w:Math.round(b.width)}:null;};
 const P=r(pill),T=r(t),V=r(v);
 return {text:t?.textContent,pill:P,txt:T,view:V,textInside:!!P&&!!T&&T.r<=P.r-6,cut:!!t&&t.scrollWidth>t.clientWidth+1,gap:P&&V?V.l-P.r:null,overlap:!!P&&!!V&&V.l<P.r&&V.r>P.l&&V.t<P.b&&V.b>P.t,vw:innerWidth};});
for(const mt of ['gwanak','namsan'])for(const [name,s] of Object.entries(SIZES)){if(!ONLY.includes(name))continue;
 const ctx=await browser.newContext({viewport:{width:s.width,height:s.height},deviceScaleFactor:1,isMobile:s.touch,hasTouch:s.touch});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 if(mt==='gwanak'){
  await p.goto(`${base}/hiking/?time=13:00&weather=clear&start=entrance`);
  await p.waitForFunction(()=>window.hiking?.started,null,{timeout:180000});
  const id=await p.evaluate(()=>{const t=window.hiking.jumpTargets();return t.filter(x=>!['plaza','gate','summit'].includes(x))[1];});
  await p.evaluate(id=>window.hiking.jumpTo(id),id);
 }else{
  await p.goto(`${base}/hiking/namsan/?time=13:00&weather=clear`);
  await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
  await p.evaluate(()=>window.namsan.jump(60));
 }
 await p.waitForFunction(()=>{const t=document.querySelector('.hk-pill-t')?.textContent??'';return /km/.test(t);},null,{timeout:60000}).catch(()=>{});await sl(2500);
 const m=await measure(p);const file=`${dir}/${mt}-${name}.png`;
 await p.screenshot({path:file,clip:{x:0,y:0,width:Math.min(s.width,640),height:Math.min(s.height,140)}});
 await p.screenshot({path:`${dir}/${mt}-${name}-full.png`});
 const ok=m.textInside&&!m.overlap&&errs.length===0;if(!ok)bad++;
 console.log(ok?'✔':'✘',mt,name,JSON.stringify({text:m.text,inside:m.textInside,cut:m.cut,gap:m.gap,overlap:m.overlap,errs}));
 out.shots.push({mountain:mt,size:name,...m,errors:errs,file});await ctx.close();
}
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await vite.close();process.exit(bad?1:0);
