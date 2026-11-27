// 시안 점검: 페이지 오류 0 · 휴대폰 터치 흉내로 한 판 · 단추 44px 이상·겹침 · 사진. node check.mjs stack|string|ball
import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs';
const k=process.argv[2]??'stack',here=path.dirname(new URL(import.meta.url).pathname);
const FILE={stack:'새기계-불빛쌓기-시안-v1.html',string:'새기계-줄자르기-시안-v1.html',ball:'새기계-공구멍넣기-시안-v1.html'}[k];
const url='file://'+path.join(here,'../../../docs/인형뽑기',FILE);fs.mkdirSync(path.join(here,'shots'),{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(url);await p.waitForTimeout(400);
const r={};
// 처음 규칙 카드 → 시작
await p.click('.h-todo [data-t=play]');await p.waitForTimeout(200);r.rulesCard=await p.isVisible('.h-card [data-c=go]');
await p.screenshot({path:`shots/${k}-rules.png`,clip:{x:24,y:90,width:420,height:880}});
await p.click('.h-card [data-c=go]');
// 자동 시연으로 끝까지(사람 손 모델), 결과 카드 나올 때까지
await p.click('#demo');let seen=new Set();
for(let i=0;i<240;i++){await p.waitForTimeout(250);const t=await p.evaluate(()=>{const c=document.querySelector('.h-card');return c&&!c.hidden?c.innerText.slice(0,40):'';});if(t)seen.add(t.split('\n').slice(0,3).join(' | '));
 if(i===6)await p.screenshot({path:`shots/${k}-play.png`,clip:{x:24,y:90,width:420,height:880}});
 if(seen.size>=3)break;}
await p.click('#demo');await p.waitForTimeout(1800);
await p.screenshot({path:`shots/${k}-page.png`,fullPage:true});
// 단추 크기·겹침(지금 보이는 HUD)
r.small=await p.evaluate(()=>[...document.querySelectorAll('.phone button,.phone .h-bar')].filter(e=>e.offsetParent&&!e.closest('[hidden]')).map(e=>{const q=e.getBoundingClientRect();return [e.className||e.textContent,q.width,q.height];}).filter(([,w,h])=>w<44||h<44));
r.cards=[...seen];r.errs=errs;console.log(JSON.stringify(r,null,1));await b.close();
