// 세로 휴대폰 함께 걷기 버튼 위치 시안(2026-11-16): 참가 후 화면을 찍는다. node scripts/capture-multi-hud-portrait.mjs <출력이름>
import {chromium} from '@playwright/test';
import {startServer} from '../server/multi-server.mjs';
const pageUrl=process.env.PAGE_URL??'http://127.0.0.1:5180',port=8789,dir='artifacts/multi-hud-portrait-2026-11-16',tag=process.argv[2]??'after';
const srv=startServer({PORT:String(port),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:412,height:800},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
const p=await ctx.newPage();
await p.goto(`${pageUrl}/hiking/?multi=${encodeURIComponent('시안')}&name=${encodeURIComponent('가나')}&server=${encodeURIComponent('ws://127.0.0.1:'+port)}&start=entrance&time=13:00&weather=clear&quality=balanced`);
await p.waitForFunction(()=>window.hiking?.started,null,{timeout:180000});
await p.waitForTimeout(4000);
await p.screenshot({path:`${dir}/${tag}.png`});
console.log(JSON.stringify(await p.evaluate(()=>['.me-chip','.hc-btn','.pw-btn'].map(s=>{const e=document.querySelector(s);if(!e)return s;const r=e.getBoundingClientRect();return [s,Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];}))));
await b.close();process.exit(0);
