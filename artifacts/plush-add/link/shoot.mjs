// 새 인형 14종 연결 확인 촬영(월드공통개발 11-25): 미리보기(5288 vite)에서 진열장·기계 안. node artifacts/plush-add/link/shoot.mjs
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:5288/src/claw/preview.html?hud=0&dd=0';
const OUT=new URL('.',import.meta.url).pathname;
const shots=[['showcase','view=showcase&collected=all'],['claw-1','view=pile&machine=claw-1'],['claw-6','view=pile&machine=claw-6'],
 ['bridge-4','view=front&machine=bridge-4'],['bridge-3','view=front&machine=bridge-3'],['timer-3','view=front&machine=timer-3'],['key-3','view=front&machine=key-3'],['plush','view=plush']];
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const errs=[];
for(const [n,qs] of shots){const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errs.push(n+': '+e.message));
 await p.goto(base+'&'+qs);await p.waitForTimeout(9000);await p.screenshot({path:OUT+n+'.png'});await p.close();console.log('shot',n);}
console.log('errors',JSON.stringify(errs));await b.close();
