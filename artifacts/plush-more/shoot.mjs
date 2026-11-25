// 새 인형 후보 촬영(월드아트 11-25). node artifacts/plush-more/shoot.mjs [후보id,…]  (5288 vite 필요)
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const dir=new URL('.',import.meta.url).pathname,out=dir+'img/';fs.mkdirSync(out,{recursive:true});
const B='http://127.0.0.1:5288/artifacts/plush-more/view.html';
const IDS=['kkulbam','nunsong','mongle','bueong','rudolph','domdol','dongdong-camp','star','big-nunsong','big-rudolph','big-dongdong-santa','box-kongi','box-bau','box-haechi-gold'];
const only=process.argv[2]?.split(',');
const shots=[];
for(const id of IDS.filter(i=>!only||only.includes(i))){shots.push([`model-${id}`,`${B}?mode=model&id=${id}`,[640,480]]);shots.push([`hand-${id}`,`${B}?mode=hand&id=${id}`,[480,480]]);}
if(!only)for(const set of ['small','big','old'])shots.push([`lineup-${set}`,`${B}?mode=lineup&set=${set}`,[1400,520]]);
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--enable-gpu']});
const errs=[];let tris=null;
for(const [name,url,[w,h]] of shots){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
 p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text());});
 await p.goto(url);await p.waitForFunction(()=>window.plushView?.frames>30,null,{timeout:90000}).catch(()=>errs.push(name+' 시간 초과'));
 await p.screenshot({path:`${out}${name}.jpg`,type:'jpeg',quality:88});tris??=await p.evaluate(()=>window.plushView?.tris).catch(()=>null);await p.close();}
fs.writeFileSync(dir+'tris.json',JSON.stringify(tris,null,1));
console.log('찍음',shots.length,'오류',errs.length,errs.slice(0,8));await b.close();
