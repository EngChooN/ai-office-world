// 임시 진단(커밋 안 함): 프리셋 자리에서 화면 점마다 맞는 메시·재질 이름을 찍는다. 사용: node artifacts/probe/pick.mjs ridge "x,y;x,y"
import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
const [name,pts='']=process.argv.slice(2);const job={name,...JSON.parse(readFileSync('scripts/cartoon-compare-presets.json','utf8'))[name]};
const base='http://127.0.0.1:5310',viewport={width:1440,height:810},style='toon';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const context=await browser.newContext({viewport});const onRoute=job.s!==undefined;let save=null;
if(onRoute){const p=await context.newPage();await p.goto(`${base}/?style=${style}&startMode=manual`,{waitUntil:'domcontentloaded'});save=await p.evaluate(async ({s,lateral})=>{const {initialState}=await import('/src/movement.js');return JSON.stringify({...initialState({start:'demo'}),s,lateral:lateral??0,zone:'route'});},job);await p.close();}
await context.addInitScript(save=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');if(save)localStorage.setItem('gwanak-hiking:v1',save);
 const dt=new EventTarget();window.__seen=[];dt.addEventListener('observe',e=>window.__seen.push(e.detail));window.__THREE_DEVTOOLS__=dt;},save);
const page=await context.newPage();
const q=new URLSearchParams({style,outfit:'1',time:job.time??'11:00',weather:'clear',quality:'high'});if(!onRoute)q.set('start',job.start??'demo');if(job.bearing!==undefined)q.set('bearing',String(job.bearing));
await page.goto(`${base}/?${q}`);
await page.waitForFunction(()=>window.hiking?.started&&window.hiking.landscape().natureReady&&!window.hiking.rendering().compiling,null,{timeout:300000});
await page.waitForTimeout(1500);await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
if(await page.evaluate(()=>window.hiking.snapshot().paused))await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:command',{detail:{id:'pause'}})));
const yaw=job.bearing!==undefined?0:(job.yaw??0),pitch=job.pitch??0,cx=720,cy=405;
if(yaw||pitch)await page.evaluate(([cx,cy,dx,dy])=>{Element.prototype.setPointerCapture=()=>{};const el=document.getElementById('world'),ev=(t,x,y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:7,pointerType:'mouse',clientX:x,clientY:y,button:0,buttons:1,bubbles:true}));ev('pointerdown',cx,cy);for(let i=1;i<=20;i++)ev('pointermove',cx+dx*i/20,cy+dy*i/20);},[cx,cy,-yaw*Math.PI/180/.004,(-.04-pitch*Math.PI/180)/.003]);
await page.waitForTimeout(5000);
const out=await page.evaluate(async pts=>{
 const THREE=await import('/node_modules/.vite/deps/three.js').catch(()=>null);
 const scene=window.__seen.find(o=>o.isScene&&o.children.length>5)||window.__seen.find(o=>o.isScene);
 const rr=window.__seen.find(o=>o.isWebGLRenderer);let cam;const orig=rr.render.bind(rr);rr.render=(sc,c)=>{if(c.isPerspectiveCamera&&sc===scene)cam=c;return orig(sc,c);};await new Promise(r=>setTimeout(r,500));rr.render=orig;
 const R=new (THREE?.Raycaster??scene.constructor)();
 return {cam:!!cam,res:pts.map(([x,y])=>{R.setFromCamera({x:x/1440*2-1,y:1-y/810*2},cam);const hits=R.intersectObjects(scene.children,true).filter(h=>h.object.visible&&h.distance>.6&&!/Human/.test(h.object.name)&&!h.object.isSprite).slice(0,3);
  return {px:[x,y],hits:hits.map(h=>({d:+h.distance.toFixed(1),name:h.object.name,parent:h.object.parent?.name,mat:[].concat(h.object.material).map(m=>m.name+'('+m.type+' #'+(m.color?.getHexString?.()??'')+' key '+(m.customProgramCacheKey?.()??'').slice(0,40)+')').join('/')+' v'+h.object.geometry?.attributes?.position?.count+' anc:'+(()=>{let a=[],o=h.object.parent;while(o&&a.length<4){a.push(o.name||o.type);o=o.parent;}return a.join('>')})()+' '+(h.object.geometry?.name||'')+(h.instanceId!=null?'#'+h.instanceId+' S'+(()=>{const m=new h.object.matrixWorld.constructor();h.object.getMatrixAt(h.instanceId,m);m.premultiply(h.object.matrixWorld);const e=m.elements;return [0,4,8].map(i=>Math.hypot(e[i],e[i+1],e[i+2]).toFixed(2)).join('x')+' T'+[12,13,14].map(i=>e[i].toFixed(1)).join(',')})():''),p:h.point.toArray().map(v=>+v.toFixed(1))}))};})};
},pts.split(';').filter(Boolean).map(s=>s.split(',').map(Number)));
for(const r of out.res)console.log(r.px.join(','),r.hits.map(h=>`${h.d}m ${h.name||'-'}<${h.parent||'-'}> [${h.mat}] y${h.p[1]}`).join(' | '));
await browser.close();
