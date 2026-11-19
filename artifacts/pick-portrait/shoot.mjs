// 산 고르기 휴대폰 세로 촬영(월드개발 11-19). BASE=실제 주소 또는 개발 서버, TAG=live|fix
import {chromium} from '@playwright/test';
const base=process.env.BASE??'https://engchoon.github.io/ai-office-world',TAG=process.env.TAG??'live',dir='artifacts/pick-portrait';
const SIZES=(process.env.SIZES??'360x640,390x844,430x932').split(',').map(s=>s.split('x').map(Number));
const TIMES=(process.env.TIMES??'13:00,21:30').split(',');
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--disable-features=LocalNetworkAccessChecks']});
const out=[];
for(const [w,h] of SIZES)for(const t of TIMES){
 const m=w<900&&h>w||w<900;const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:m,hasTouch:m,deviceScaleFactor:2});
 await ctx.addInitScript(()=>{localStorage.clear();});const p=await ctx.newPage();
 await p.goto(`${base}/hiking/?pick=on&dev=off&time=${t}&weather=clear&server=${encodeURIComponent('ws://127.0.0.1:9')}`,{waitUntil:'domcontentloaded'});
 await p.waitForSelector('#mountain-pick [data-mountain="namsan"]',{timeout:90000});await p.waitForTimeout(1500);
 const tag=`${TAG}-${w}x${h}-${t.replace(':','')}`;
 await p.screenshot({path:`${dir}/${tag}-top.png`});
 // 깨짐 측정: 화면 밖 넘침·글 넘침·겹침
 const r=await p.evaluate(()=>{const vw=innerWidth,bad=[];const root=document.getElementById('mountain-pick');
  for(const el of root.querySelectorAll('*')){const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden')continue;const q=el.getBoundingClientRect();if(!q.width)continue;
   if(q.right>vw+1||q.left<-1)bad.push(`가로 넘침 ${el.className||el.tagName} ${Math.round(q.left)}~${Math.round(q.right)}`);
   if((el.scrollWidth>el.clientWidth+1)&&s.overflowX!=='auto'&&s.overflowX!=='scroll'&&el.clientWidth>0&&!['svg','path'].includes(el.tagName.toLowerCase()))bad.push(`글 넘침 ${el.className||el.tagName} ${el.scrollWidth}>${el.clientWidth}`);}
  const cards=[...root.querySelectorAll('.pk-card')].map(c=>{const q=c.getBoundingClientRect();const art=c.querySelector('svg.pk-art')?.getBoundingClientRect();return {id:c.dataset.mountain,top:Math.round(q.top),h:Math.round(q.height),w:Math.round(q.width),art:art&&{x:Math.round(art.left-q.left),y:Math.round(art.top-q.top),w:Math.round(art.width),h:Math.round(art.height)}};});
  return {bad:[...new Set(bad)].slice(0,12),cards,scrollH:root.scrollHeight,vh:innerHeight};});
 out.push({tag,...r});console.log(tag,JSON.stringify(r).slice(0,900));
 // 카드마다 한 장
 for(const id of ['gwanak','namsan']){const el=await p.$(`#mountain-pick [data-mountain="${id}"]`);await el.scrollIntoViewIfNeeded();await p.waitForTimeout(300);await el.screenshot({path:`${dir}/${tag}-${id}.png`});}
 await ctx.close();
}
const {writeFileSync}=await import('node:fs');writeFileSync(`${dir}/${TAG}-report.json`,JSON.stringify(out,null,1));await b.close();
