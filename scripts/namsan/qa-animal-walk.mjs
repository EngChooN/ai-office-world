import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='artifacts/namsan-animal-qa-2026-11-22';mkdirSync(out,{recursive:true});
const server=await createServer({server:{port:5398,host:'127.0.0.1',strictPort:true,hmr:false,watch:{ignored:['**/*']}},logLevel:'warn'});await server.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const results=[];
try{for(const phone of [false,true]){
 const ctx=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1920,height:1080},isMobile:phone,hasTouch:phone});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-hiking:sound:v1','true');const origin=performance.now(),now=performance.now.bind(performance);performance.now=()=>origin+(now()-origin)*12;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>cb(origin+(t-origin)*12));});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5398/hiking/namsan/?time=13:00&weather=clear');await p.waitForFunction(()=>window.namsan?.started&&window.namsan.trail,null,{timeout:180000});
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.__qa={met:{},bad:[],maxDy:0,maxAnimals:0};setInterval(()=>{const n=window.namsan,q=window.__qa;const a=n.animals();q.maxAnimals=Math.max(q.maxAnimals,a.filter(x=>x.visible).length);for(const x of a){q.met[x.id]??={kind:x.kind,s:n.status().s};if(x.state==='wander'&&x.visible&&!['fly','hidden','climb'].includes(x.mode)){const dy=Math.abs(x.y-n.trail.height(x.x,x.z)-(x.kind==='magpie'?.085*1.3:0));q.maxDy=Math.max(q.maxDy,dy);if(dy>.3||n.animalLanes.inForbid(x.x,x.z))q.bad.push({kind:x.kind,s:n.status().s,dy});}}},200);});
 await p.keyboard.press('Shift');await p.locator('#auto').click();const start=Date.now();let end;
 for(let i=0;i<180;i++){await p.waitForTimeout(5000);end=await p.evaluate(()=>window.namsan.status());if(i%6===0)console.log(phone?'phone':'pc',Math.round(end.s),end.done,end.auto);if(end.done)break;}
 await p.screenshot({path:`${out}/${phone?'phone':'pc'}-autowalk-summit.png`});const walk=await p.evaluate(()=>window.__qa);results.push({device:phone?'phone':'pc',seconds:Math.round((Date.now()-start)/1000),end,walk,errors});console.log('WALK',JSON.stringify(results.at(-1)));
 await ctx.close();writeFileSync(`${out}/walk-report.json`,JSON.stringify(results,null,2));
}}finally{await browser.close();await server.close();}
process.exit(results.every(x=>x.end.done&&!x.walk.bad.length&&!x.errors.length)?0:1);
