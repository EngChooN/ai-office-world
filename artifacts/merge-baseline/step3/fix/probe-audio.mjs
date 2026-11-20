import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const p=await (await b.newContext()).newPage();
await p.goto('http://127.0.0.1:5413/assets/radio/manifest.json');
const r=await p.evaluate(async()=>{const out=[];
 for(const [f,d] of [['991-forest-wind/819351-wind-macclesfield.mp3',274.512],['991-forest-wind/869104-stream-dolomites.mp3',418.704],['919-calm/healing.mp3',378.139],['991-forest-wind/524203-wind-forest-04.mp3',55.536]]){
  for(const mode of ['fresh','afterPlay']){
  const el=new Audio('/assets/radio/'+f);el.preload='auto';const ev=[];for(const n of ['seeking','seeked','waiting','playing','stalled','ended','error','canplay'])el.addEventListener(n,()=>ev.push(n+'@'+el.currentTime.toFixed(1)));
  await new Promise(ok=>{el.onloadedmetadata=ok;});
  if(mode==='afterPlay'){el.currentTime=Math.min(30,el.duration/3);await el.play();await new Promise(z=>setTimeout(z,1500));}
  el.currentTime=d-3;const t=performance.now();let res;try{await Promise.race([el.play(),new Promise((_,n)=>setTimeout(()=>n(new Error('to')),8000))]);res='play ok '+((performance.now()-t)/1000).toFixed(1);await Promise.race([new Promise(ok=>el.onended=ok),new Promise((_,n)=>setTimeout(()=>n(new Error('noend')),9000))]);res+=' ended '+((performance.now()-t)/1000).toFixed(1);}catch(e){res=e.message;}
  out.push({f,mode,err:el.error?.code+' '+el.error?.message,dur:el.duration,res,ct:el.currentTime,rs:el.readyState,ns:el.networkState,ev:ev.join(',')});el.pause();el.removeAttribute('src');el.load();}
 }return out;});
for(const x of r)console.log(JSON.stringify(x));
await b.close();
