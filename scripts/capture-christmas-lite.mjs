// 가벼운 동동이(먼 사람) 화면 확인(월드개발, 2026-11-16): 휴대폰 세로·가로에 봇 19명을 넓게 세워 찍는다 → artifacts/christmas-world/mobile-lite-*.png
import {chromium} from '@playwright/test';
import {startServer} from '../server/multi-server.mjs';
const dir='artifacts/christmas-world',ws='ws://127.0.0.1:8792';
const {createServer}=await import('vite');const vite=await createServer({server:{port:5198,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const srv=startServer({PORT:'8792',HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const bots=[];for(let i=0;i<19;i++){const w=new WebSocket(ws);w.onopen=()=>w.send(JSON.stringify({t:'hello',exp:'christmas',room:'눈마을-1',name:`봇${i}`}));
 w.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='welcome'){const a=i/19*Math.PI*1.2-.6*Math.PI,r=3+(i%4)*3.5;w.send(JSON.stringify({t:'act',a:{o:['santa','sweater','elf'][i%3],hat:['','antlers','santa','beanie'][i%4],sc:i%2,d:0}}));
  setInterval(()=>w.send(JSON.stringify({t:'s',q:1,z:0,x:Math.sin(a)*r,y:6-Math.cos(a)*r,h:a,v:0,f:4})),500);}};bots.push(w);}
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
for(const [n,vp] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
 const c=await b.newContext({viewport:vp,deviceScaleFactor:2,isMobile:true,hasTouch:true});await c.addInitScript(()=>localStorage.setItem('xmas-world:v1','{"tip":true}'));
 const p=await c.newPage();await p.goto(`http://127.0.0.1:5198/christmas/?capture=1&multi=눈마을-1&server=${ws}&name=나`);
 await p.waitForFunction(()=>window.xmas?.multi?.status().people.filter(x=>x.shown).length===19,null,{timeout:90000});
 await p.evaluate(()=>{window.xmas.teleport(0,15,0);Object.assign(window.xmas.cam,{dist:7,pitch:.35});});await new Promise(r=>setTimeout(r,3000));
 console.log(n,JSON.stringify(await p.evaluate(()=>window.xmas.multi.status().people.reduce((o,x)=>(o[x.body]=(o[x.body]??0)+1,o),{}))));
 await p.screenshot({path:`${dir}/mobile-lite-${n}.png`});await c.close();}
await b.close();bots.forEach(w=>w.close());await srv.close();await vite.close();process.exit(0);
