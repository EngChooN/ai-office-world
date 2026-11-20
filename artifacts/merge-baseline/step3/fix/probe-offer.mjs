import {chromium} from '@playwright/test';
import {initialState} from '../../../../src/movement.js';
const base='http://127.0.0.1:5413/hiking/';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await ctx.addInitScript(()=>{localStorage.setItem('gwanak-sound-enabled','false');const v=sessionStorage.getItem('vt-save');if(v){localStorage.setItem('gwanak-hiking:v1',v);sessionStorage.removeItem('vt-save');}});
const page=await ctx.newPage();
await page.goto(base+'?start=entrance');await page.waitForFunction(()=>window.hiking?.started&&window.hiking.trail,null,{timeout:300000});
await page.evaluate(s=>sessionStorage.setItem('vt-save',s),JSON.stringify({...initialState({start:'demo'}),s:648-25,lateral:0,view:'third'}));
await page.goto(base+'?time=11:00&weather=clear&season=summer');await page.waitForFunction(()=>window.hiking?.started&&window.hiking.trail&&window.hiking.landscape().natureReady,null,{timeout:300000});
await page.tap('#auto');
await page.waitForSelector('#trail-chip[data-mode=offer] .tc-offer',{state:'attached',timeout:90000});
for(let i=0;i<12;i++){console.log(JSON.stringify(await page.evaluate(()=>{const b=document.querySelector('.tc-offer');if(!b)return null;const r=b.getBoundingClientRect(),c=document.querySelector('#trail-chip'),cs=getComputedStyle(c),bs=getComputedStyle(b);
 return {rect:[r.left,r.top,r.width,r.height].map(Math.round),uf:b.dataset.uf??null,pos:bs.position,disp:bs.display,vis:bs.visibility,chipCls:c.className,chipHidden:c.hidden,chipT:cs.transform,chipWill:cs.willChange,chipDisp:cs.display,anim:bs.animationName};})));await page.waitForTimeout(150);}
await page.screenshot({path:'artifacts/merge-baseline/step3/fix/trail-dropin-route/offer-probe.png'});
await browser.close();
