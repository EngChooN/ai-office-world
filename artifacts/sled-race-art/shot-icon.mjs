import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:560,height:130},deviceScaleFactor:2});
await p.goto('http://127.0.0.1:5181/artifacts/sled-race-art/icon.html');await p.waitForTimeout(600);await p.screenshot({path:'artifacts/sled-race-art/after/icon-throw-cancel.png'});await b.close();
