import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:5288/src/claw/preview.html?hud=0&dd=0&view=showcase&collected=all');await p.waitForTimeout(10000);
await p.screenshot({path:process.argv[2]});console.log(JSON.stringify(errs));await b.close();
