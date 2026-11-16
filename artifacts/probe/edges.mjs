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
const out=await page.evaluate(async ()=>{
 const scene=window.__seen.find(o=>o.isScene&&o.children.length>5)||window.__seen.find(o=>o.isScene);
 const rr=window.__seen.find(o=>o.isWebGLRenderer);let cam;const orig=rr.render.bind(rr);rr.render=(sc,c)=>{if(c.isPerspectiveCamera&&sc===scene)cam=c;return orig(sc,c);};await new Promise(r=>setTimeout(r,500));rr.render=orig;
 const lines=[];const V=cam.position.clone();
 const proj=(p)=>{const q=p.clone().project(cam);return [Math.round((q.x+1)/2*1440),Math.round((1-q.y)/2*810),q.z];};
 scene.traverse(o=>{
  if(!o.isMesh)return;const isPath=o.parent?.name==='등산로 노면',isTer=/^12_17/.test(o.name);if(!isPath&&!isTer)return;
  const g=o.geometry,p=g.attributes.position,idx=g.index;if(!idx)return;
  const a=new V.constructor(),b=new V.constructor(),c=new V.constructor();
  for(let i=0;i<idx.count;i+=3){
   const t=[0,1,2].map(k=>new V.constructor().fromBufferAttribute(p,idx.getX(i+k)).applyMatrix4(o.matrixWorld));
   if(t.some(v=>v.distanceTo(V)>9))continue;
   const s=t.map(proj);if(s.some(v=>v[2]>1||v[2]<-1))continue;
   lines.push((isPath?'P':'T')+' '+s.map(v=>v[0]+','+v[1]).join(' '));
  }
 });
 return lines;
});
console.log(out.join('\n'));await browser.close();
