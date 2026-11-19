import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message,e.stack?.split('\n').slice(0,3).join(' | ')));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text().slice(0,200));});
await p.goto('http://127.0.0.1:5187/hiking/namsan/?time=21:30&server=off');await p.waitForTimeout(25000);console.log(await p.evaluate(()=>window.namsan?.started));await b.close();
