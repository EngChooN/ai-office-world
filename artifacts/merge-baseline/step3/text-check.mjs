// 3단계 화면 글 확인: 틀 조각 + 산 정의 글이 브라우저에서 원래 글과 같은지, 오류 없는지(월드개발 11-20)
import {chromium} from 'playwright';import {createServer} from 'vite';
const PORT=5414,s=await createServer({server:{port:PORT,host:'127.0.0.1',strictPort:true},logLevel:'silent'});await s.listen();
const b=await chromium.launch({args:['--use-angle=metal','--enable-unsafe-swiftshader']});const errs=[];
for(const [name,vp] of [['pc',{width:1920,height:1080}],['phone',{width:390,height:844}]]){
 const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(name+' console: '+m.text());});
 await p.goto(`http://127.0.0.1:${PORT}/hiking/?time=12:00&weather=clear`);
 await p.waitForFunction(()=>window.hiking?.loading?.()?.last?.stage==='ready'||document.getElementById('loading-screen')?.dataset.phase==='ready'||window.__hikingMetrics,null,{timeout:120000}).catch(()=>{});
 const r=await p.evaluate(()=>({title:document.title,
  mt:[...document.querySelectorAll('[data-mt]')].map(e=>[e.dataset.mt,e.textContent]),
  mtT:[...document.querySelectorAll('[data-mt-title]')].map(e=>[e.dataset.mtTitle,e.title]),
  label:document.getElementById('world').getAttribute('aria-label'),
  seal:document.querySelector('#summit .nb-seal').innerText,
  credits:document.querySelector('.sound-credits').textContent.includes('환경음은 실제 관악산 녹음이 아닌 CC0 임시음입니다'),
  link:document.querySelector('.sound-credits a[href*="출처-이용조건"]')?.textContent}));
 console.log(name,JSON.stringify(r));
 await p.screenshot({path:`artifacts/merge-baseline/step3/${name}.png`});
 await p.evaluate(()=>document.getElementById('summit').showModal());await p.waitForTimeout(400);
 await p.screenshot({path:`artifacts/merge-baseline/step3/${name}-summit.png`});await p.close();
}
console.log('errors',errs);await b.close();await s.close();process.exit(0);
