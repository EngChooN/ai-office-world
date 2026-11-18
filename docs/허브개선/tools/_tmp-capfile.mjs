import {chromium} from '@playwright/test';import {pathToFileURL} from 'node:url';
const [file,tag,extra]=process.argv.slice(2);const dir='artifacts/hub-improve';
const DEV={mobile:{viewport:{width:390,height:844},touch:true},pc:{viewport:{width:1920,height:1080}},land:{viewport:{width:844,height:390},touch:true}};
const b=await chromium.launch({channel:'chrome',headless:true});
for(const [d,o] of Object.entries(DEV)){const ctx=await b.newContext({...o,hasTouch:!!o.touch,isMobile:!!o.touch,deviceScaleFactor:o.touch?2:1});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(pathToFileURL(file).href+(extra||''));await p.waitForTimeout(400);
await p.screenshot({path:`${dir}/${tag}-${d}.png`});
const r=await p.evaluate(()=>{const small=[...document.querySelectorAll('a,button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<36||r.width<36)}).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().height));return {sh:document.documentElement.scrollHeight,ih:innerHeight,sw:document.documentElement.scrollWidth,iw:innerWidth,small}});
console.log(tag,d,JSON.stringify(r),errs.join('|'));await ctx.close();}
await b.close();
