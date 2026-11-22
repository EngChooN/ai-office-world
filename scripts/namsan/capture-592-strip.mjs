// 촬영 전용: 남산 590.8→593.8m, 관악산 3120m 부근 자동 걷기를 낮은 옆 시점으로 0.1초(가짜 시계) 간격 연속 촬영.
// 사용: node scripts/namsan/capture-592-strip.mjs [namsan|gwanak|both] [side(+1/-1)] [test]
import {chromium} from 'playwright';
import {writeFileSync,mkdirSync} from 'node:fs';
const BASE=process.env.BASE||'http://127.0.0.1:5180',OUT='artifacts/namsan-592-line-2026-11-22/strip';mkdirSync(OUT,{recursive:true});
const which=process.argv[2]||'both',SIDE=Number(process.argv[3]||1),TEST=process.argv[4]==='test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
// 매 프레임 cameraOverride.p/t 를 읽을 때 아바타 옆 2.6m·발 위 0.45m에서 몸 중심을 보게 한다.
const camSetup=({mode,side,H,D,TY})=>{const T=window.__THREE||window.__T;const av=mode==='namsan'?window.__avatar:window.__hiker.scene;let fx=null,fz=null;const P=new T.Vector3(),F=new T.Vector3();
 const upd=()=>{av.updateMatrixWorld(true);av.getWorldPosition(P);av.getWorldDirection(F);F.y=0;F.normalize();if(fx===null){fx=F.x;fz=F.z}else{fx+=(F.x-fx)*.15;fz+=(F.z-fz)*.15;}const n=Math.hypot(fx,fz);return {x:P.x,y:P.y,z:P.z,fx:fx/n,fz:fz/n};};
 const co={get p(){const a=upd();window.__camA=a;const sx=-a.fz*side,sz=a.fx*side;return [a.x+sx*D-a.fx*.2,a.y+H,a.z+sz*D-a.fz*.2]},get t(){const a=window.__camA||upd();return [a.x+a.fx*.1,a.y+TY,a.z+a.fz*.1]},fov:50};
 if(mode==='namsan')window.namsan.cameraOverride=co;else window.hiking.cameraOverride=co;};
const probe=({mode})=>{const h=window.__hiker,g=h?.gaitPhase,s=mode==='namsan'?namsan.status().s:hiking.snapshot().s;const st=(g?.stance||[]).filter(x=>x.inStance).map(x=>x.side==='Left'?'L':'R');const foot=st.length===0?'none':st.length===2?'LR':st[0];
 return {s,foot,cycle:g?.cycle,stance:g?.stance?.map(x=>({side:x.side,in:x.inStance,at:+x.at.toFixed(3)}))};};
async function run(mode,from,to,maxN){
 const ctx=await browser.newContext({viewport:{width:1280,height:720}});let p;
 if(mode==='gwanak'){const pr=await ctx.newPage();await pr.goto(BASE+'/hiking/?startMode=manual');const save=await pr.evaluate(async s=>{const {initialState}=await import('/src/movement.js');return JSON.stringify({...initialState({start:'demo'}),s,lateral:0,zone:'route',view:'third'});},from-1.2);await pr.close();
  await ctx.addInitScript(save=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');localStorage.setItem('gwanak-hiking:v1',save)},save);p=await ctx.newPage();await p.goto(BASE+'/hiking/?time=11:00&weather=clear&quality=2');
  await p.waitForFunction(()=>window.hiking?.started&&hiking.landscape().natureReady&&!hiking.rendering().compiling,null,{timeout:300000});await p.evaluate(async()=>{window.__T=await import('/node_modules/three/build/three.module.js')});}
 else {p=await ctx.newPage();await p.goto(BASE+'/hiking/namsan/?time=13:00&weather=clear&season=summer&debug');await p.waitForFunction(()=>namsan?.started,null,{timeout:300000});await p.waitForTimeout(3000);await p.evaluate(s=>{namsan.jump(s)},from-1.2);}
 await p.evaluate(camSetup,{mode,side:SIDE,H:+(process.env.CAM_H||.95),D:+(process.env.CAM_D||2.4),TY:+(process.env.CAM_TY||.3)});await p.waitForTimeout(1500);
 if(mode==='gwanak')await p.keyboard.press('r');else await p.evaluate(()=>namsan.setAuto(true));
 await p.waitForFunction(([m,s])=>(m==='namsan'?namsan.status().s:hiking.snapshot().s)>=s,[mode,from],{timeout:60000,polling:'raf'});
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+200));await p.clock.runFor(16);
 const rows=[];for(let i=0;i<maxN;i++){await p.clock.runFor(100);await p.waitForTimeout(60);const r=await p.evaluate(probe,{mode});const name=`${mode}-${String(i).padStart(2,'0')}-${r.s.toFixed(2)}m-${r.foot}.png`;await p.screenshot({path:`${OUT}/${name}`});rows.push({i,t:+(i*.1).toFixed(1),file:name,...r});console.log(name,r.cycle?.toFixed(3));if(TEST&&i>=2)break;if(r.s>=to)break;}
 await ctx.close();return rows;}
const out={};
if(which!=='gwanak')out.namsan=await run('namsan',590.8,593.8,70);
if(which!=='namsan')out.gwanak=await run('gwanak',3120.5,3125,15);
if(!TEST)writeFileSync(`${OUT}/frames-${which}.json`,JSON.stringify(out,null,2));await browser.close();
