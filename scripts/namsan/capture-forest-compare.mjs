// 관악산·남산 숲 나란히 촬영(산풍경 11-21): node scripts/namsan/capture-forest-compare.mjs [폴더]
// 떠 있는 개발 서버(BASE_URL 기본 http://127.0.0.1:5173)에서 같은 시각(여름 13:00 맑음)·같은 화면(PC 1920×1080, 휴대폰 390×844 터치)으로
// 관악산 숲길(GWANAK 거리 비율)과 남산 숲길(NAMSAN 거리 m)을 찍는다. 결과: artifacts/<폴더>/<gwanak|namsan>-<pc|phone>-<자리>.png
// 화면 안 나무 통계(종류·단계별 그루 수, 삼각형)는 표준 출력(?debug 장면 훑기, 남산만).
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {route} from '../../src/route.js';
import {initialState,SAVE_KEY} from '../../src/movement.js';
const [dir='forest-compare']=process.argv.slice(2);
const out=`artifacts/${dir}`;mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5173';
const only=(process.env.ONLY??'pc,phone').split(','),sites=(process.env.SITES??'gwanak,namsan').split(',');
const GWANAK=(process.env.GWANAK??'0.18,0.32').split(','),NAMSAN=(process.env.NAMSAN??'330,700').split(',');
const SETTLE=+(process.env.SETTLE??5000);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const env='time=13:00&weather=clear&season=summer';
for(const [tag,w,h,touch] of [['pc',1920,1080,false],['phone',390,844,true]]){
 if(!only.includes(tag))continue;
 const ctxOpt={viewport:{width:w,height:h},deviceScaleFactor:touch?2:1,isMobile:touch,hasTouch:touch};
 if(sites.includes('gwanak'))for(const f of GWANAK){
  const ctx=await browser.newContext(ctxOpt),s=route.length*+f;
  await ctx.addInitScript(({state,key})=>{localStorage.setItem('gwanak-sound-enabled','false');localStorage.setItem(key,JSON.stringify(state));},{state:{...initialState(),s,view:'first',paused:true},key:SAVE_KEY});
  const p=await ctx.newPage(),logs=[];p.on('pageerror',e=>logs.push(e.message));
  await p.goto(`${base}/hiking/?${env}`);
  await p.waitForFunction(()=>window.hiking?.started&&window.hiking.landscape?.().natureReady,null,{timeout:240000});
  await p.waitForTimeout(SETTLE*2);
  await p.screenshot({path:`${out}/gwanak-${tag}-${f}.png`});
  console.log('gwanak',tag,f,logs.length?logs:'오류 0건');await ctx.close();
 }
 if(sites.includes('namsan')){
  const ctx=await browser.newContext(ctxOpt);await ctx.addInitScript(()=>localStorage.setItem('gwanak-sound-enabled','false'));
  const p=await ctx.newPage(),logs=[];p.on('pageerror',e=>logs.push(e.message));
  await p.goto(`${base}/hiking/namsan/?${env}&debug`);
  await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
  if(process.env.VIEW!=='third'){await p.getByText('1인칭 보기').first().click().catch(()=>{});await p.waitForTimeout(500);} // 관악산 기본과 같은 1인칭
  for(const s of NAMSAN){
   await p.evaluate(s=>window.namsan.jump(+s),s);await p.waitForTimeout(SETTLE);
   await p.screenshot({path:`${out}/namsan-${tag}-${s}.png`});
   const stat=await p.evaluate(()=>{const T=window.__THREE,cam=window.__camera,fr=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
    const m=new T.Matrix4(),v=new T.Vector3(),o={};window.__ns.trees?.traverse(im=>{if(!im.isInstancedMesh)return;const key=im.name.split(' ').slice(2,4).join(' ');let n=0,near=0;
     for(let i=0;i<im.count;i++){im.getMatrixAt(i,m);v.setFromMatrixPosition(m);if(fr.containsPoint(v)){const d=v.distanceTo(cam.position);if(d<120)n++;if(d<30)near++;}}o[key]=o[key]??[0,0];o[key][0]=Math.max(o[key][0],n);o[key][1]=Math.max(o[key][1],near);});return o;});
   console.log('namsan',tag,s,'화면 안 120m/30m 그루',JSON.stringify(stat));
  }
  console.log('namsan',tag,logs.length?logs:'오류 0건');await ctx.close();
 }
}
await browser.close();
