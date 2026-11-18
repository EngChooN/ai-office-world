// 하늘 썰매 시안 촬영: node docs/크리스마스/tools/rudolph/shot.mjs → artifacts/reindeer-sleigh/
import {chromium} from 'playwright';
import {join,dirname} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../../..'),out=join(root,'artifacts/reindeer-sleigh');
const url=pathToFileURL(join(root,'docs/크리스마스/루돌프-하늘썰매-시안-v2.html')).href;
const b=await chromium.launch();const errs=[];
const p=await b.newPage({viewport:{width:1500,height:1000}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(url);await p.waitForTimeout(1500);
const secs=await p.$$('section.sheet');
for(const [i,n] of [[0,'0-changes'],[1,'1-map'],[2,'2-flow'],[4,'4-side'],[5,'5-stars'],[7,'7-decide']]){await secs[i].screenshot({path:join(out,`sian-${n}.png`)});}
for(const st of ['stop','ground','fly','edge']){await p.click(`#tabs button[data-st=${st}]`);await p.waitForTimeout(900);await secs[3].screenshot({path:join(out,`sian-screen-${st}.png`)});}
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});m.on('pageerror',e=>errs.push('m:'+e.message));
await m.goto(url);await m.waitForTimeout(1200);
const ow=await m.evaluate(()=>document.documentElement.scrollWidth);
await m.screenshot({path:join(out,'sian-phone-top.png')});
console.log('오류',errs,'휴대폰 가로 넘침',ow,'>',390);
await b.close();
