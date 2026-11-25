// 촬영: node artifacts/carry-pose/shoot.mjs 이름 '쿼리' [폭 높이] [check]
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const [, , name, query, w='900', h='700', check]=process.argv;
const dir=new URL('.',import.meta.url).pathname;fs.mkdirSync(dir+'img',{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu']});
const p=await b.newPage({viewport:{width:+w,height:+h}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(`http://127.0.0.1:5288/artifacts/carry-pose/pose.html?${query}`);
await p.waitForFunction(()=>window.pose?.frames>40,null,{timeout:90000}).catch(()=>errs.push('시간 초과'));
await p.screenshot({path:`${dir}img/${name}.jpg`,type:'jpeg',quality:86});
if(check)console.log(JSON.stringify(await p.evaluate(()=>window.pose.check())));
if(errs.length)console.log('오류',errs.slice(0,3));
await b.close();console.log('찍음',name);
