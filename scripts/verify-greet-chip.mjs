// 사람 인사 칩·카드 두 접속자 점검(2026-11-18). 서버(8798)·vite(5210)를 스스로 띄운다.
// node scripts/verify-greet-chip.mjs [pc|mobile|land]  → artifacts/greet-chip/*.png, result-*.json
// 확인: 근처 = 이름표 옆 칩만(가린 비율 1% 미만·도장 「걷기」 그대로·아래 카드 없음), 칩/F = 인사(상대 화면에 몸짓),
//      2m 안 1초 멈춤 = 카드, 5초 뒤 접힘, 카드 「같이 등산하기」 = 상대에게 제안, 동행하며 걷는 중 칩 없음·멈추고 2초 뒤 보임,
//      걷는 중 흐리게, 이름표 끄면(머리 밖과 같은 길) 큰 단추 위 「👋 이름」, 칩·카드 단추 누르는 칸 44px 이상(휴대폰).
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
const dir='artifacts/greet-chip';mkdirSync(dir,{recursive:true});
const multiPort=8798,port=5210;
const {createServer}=await import('vite');
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const checks=[];const ok=(label,pass,info='')=>{checks.push({label,pass:!!pass,info});console.log(`${pass?'✔':'✘'} ${label}${info!==''?` · ${typeof info==='string'?info:JSON.stringify(info)}`:''}`);};
async function open(name,room,{viewport,mobile}){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile});
 await ctx.addInitScript(()=>localStorage.setItem('gwanak-sound-enabled','false'));
 const p=await ctx.newPage();p.ctx=ctx;p.on('pageerror',e=>console.log(`[${name}] 오류`,e.message));
 await p.goto(`${pageUrl}/hiking/?multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}&start=entrance&time=13:00&weather=clear&quality=balanced`);
 await p.waitForFunction(()=>window.hiking?.started,null,{timeout:240000});
 await p.waitForFunction(()=>window.hiking.multi?.()?.status==='online'&&window.hiking.multi().roster.length>0||false,null,{timeout:60000,polling:200}).catch(()=>{});
 return p;
}
const cmd=(p,id,value)=>p.evaluate(([id,value])=>window.dispatchEvent(new CustomEvent('hiking:command',{detail:{id,value}})),[id,value]);
const stand=(p,pos)=>p.evaluate(pos=>window.hiking.multiApi.teleport({zone:'plaza',...pos}),pos);
const greet=p=>p.evaluate(()=>window.hiking.multiApi.greet());
const measure=p=>p.evaluate(()=>{
 const vis=e=>{if(!e||e.hidden)return null;const r=e.getBoundingClientRect();if(!r.width||!r.height)return null;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return null;return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),op:+cs.opacity};};
 const W=innerWidth,H=innerHeight,chip=vis(document.querySelector('.gr-chip')),card=vis(document.querySelector('.gr-card')),ctx=vis(document.querySelector('.nb-ctx'));
 const tag=[...document.querySelectorAll('.multi-tag')].map(t=>vis(t.querySelector('.multi-tag-name'))).find(Boolean)??null;
 const pct=r=>r?r.w*r.h/(W*H)*100:0;
 // 누르는 칸: ::after 넓힘까지(칩 좌우 4·위아래 6px)
 const hitChip=chip?{w:chip.w+8,h:chip.h+12}:null,btns=card?[...document.querySelectorAll('.gr-card .gr-row button')].map(b=>Math.round(b.getBoundingClientRect().height)):[];
 const st=vis(document.getElementById('auto'));
 return {W,H,chip,card,ctx,tag,stamp:st,stampMode:document.getElementById('auto')?.dataset.mode,stampText:document.getElementById('auto')?.innerText.replace(/\s+/g,' ').trim(),
  cover:+(pct(chip)+pct(card)+pct(ctx)).toFixed(3),chipPct:+pct(chip).toFixed(3),cardPct:+pct(card).toFixed(3),hitChip,btns,
  chipFar:document.querySelector('.gr-chip')?.classList.contains('far'),chipDim:document.querySelector('.gr-chip')?.classList.contains('dim'),greet:window.hiking.multiApi.greet()};
});
const overlap=(a,b)=>a&&b&&a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
async function run(label,vp){
 const mobile=vp.mobile;console.log(`\n── ${label} ${vp.viewport.width}×${vp.viewport.height}`);
 const room=`인사칩-${label}`,A=await open('하늘',room,vp),B=await open('바다',room,vp);await sleep(2500);
 const me=await A.evaluate(()=>window.hiking.position());const base={x:me.x,z:me.z,heading:me.heading};
 await stand(A,base);await sleep(300);
 const camH=await A.evaluate(()=>window.hiking.orientation().cameraHeading);
 const put=async(d,ang=.2,wait=1600)=>{const h=camH,fx=-Math.sin(h),fz=-Math.cos(h),sx=-fz,sz=fx;
  const bx=base.x+fx*d*Math.cos(ang)+sx*d*Math.sin(ang),bz=base.z+fz*d*Math.cos(ang)+sz*d*Math.sin(ang);
  await stand(B,{x:bx,z:bz,heading:Math.atan2(-(base.x-bx),-(base.z-bz))});if(wait)await sleep(wait);};
 const res={};
 await put(20);res.alone=await measure(A);await A.screenshot({path:`${dir}/${label}-alone.png`});
 ok(`${label} 혼자: 칩 없음·도장 걷기`,!res.alone.chip&&res.alone.stampMode==='walk',res.alone.stampText);
 // 거리별
 res.byDist={};for(const d of [6,4.5,3.6,5,5.4,6.2]){await put(d,.2,900);const m=await measure(A);res.byDist[d]=m.greet.mode;}
 ok(`${label} 4m 안에서 보이고 5.5m 밖에서 숨김`,res.byDist[6]==='none'&&res.byDist[4.5]==='none'&&res.byDist[3.6]==='chip'&&res.byDist[5]==='chip'&&res.byDist[5.4]==='chip'&&res.byDist[6.2]==='none',res.byDist);
 await put(3,.2,1800);res.near=await measure(A);await A.screenshot({path:`${dir}/${label}-near.png`});
 const n=res.near;
 ok(`${label} 근처: 칩만(가린 비율 1% 미만)`,n.chip&&!n.card&&!n.ctx&&n.cover<1,`${n.cover}% 칩 ${n.chip?.w}×${n.chip?.h}`);
 ok(`${label} 근처: 큰 단추 「걷기」 그대로`,n.stampMode==='walk'&&/걷기/.test(n.stampText),n.stampText);
 ok(`${label} 칩이 이름표 옆(겹치지 않음)`,n.tag&&n.chip&&!overlap(n.tag,n.chip)&&Math.abs((n.chip.y+n.chip.h/2)-(n.tag.y+n.tag.h/2))<20,{tag:n.tag,chip:n.chip});
 if(mobile)ok(`${label} 칩 누르는 칸 44px 이상`,n.hitChip.w>=44&&n.hitChip.h>=44,n.hitChip);
 // 인사: PC는 F, 휴대폰은 칩 누르기 → 상대 화면에 인사 몸짓
 const beforeLog=await B.evaluate(()=>window.hiking.multi().roster[0]?.gesture??null);
 if(mobile){await A.locator('.gr-chip').tap();}else{await A.keyboard.press('KeyF');}
 await sleep(500);const got=await B.evaluate(()=>window.hiking.multi().roster[0]?.gesture??null);
 ok(`${label} ${mobile?'칩 누르기':'F 키'} = 인사(상대 화면에 몸짓)`,got==='hello'&&beforeLog!=='hello',got);
 if(mobile){const m=await measure(A);ok(`${label} 칩을 누르면 카드가 펼쳐짐`,m.greet.mode==='open'&&m.card,m.greet.mode);await cmd(A,'stop-auto');}
 if(!mobile){await A.locator('.gr-chip').click();await sleep(200);const m=await measure(A);ok(`${label} 칩 클릭 = 카드 펼침`,m.greet.mode==='open',m.greet.mode);}
 // ✕로 접기
 await A.locator('.gr-card .gr-x').click();await sleep(200);ok(`${label} ✕ = 접힘`,(await greet(A)).mode==='chip');
 // 2m 안 1초 멈춤 → 펼침 → 5초 뒤 접힘
 await sleep(6500);await put(1.6,.15,0);await sleep(1600);res.open=await measure(A);await A.screenshot({path:`${dir}/${label}-open.png`});
 const o=res.open;ok(`${label} 2m 안 1초 멈춤 = 머리 위 카드`,o.greet.mode==='open'&&o.card,`${o.cardPct}% ${o.card?.w}×${o.card?.h}`);
 const blockers=await A.evaluate(()=>[...document.querySelectorAll('.nb-tag,.nb-card,.nb-tabs,.nb-dial,#auto,.nb-view,.me-chip,.hc-btn,.pw-btn')].map(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width&&cs.display!=='none'&&cs.visibility!=='hidden'&&!e.hidden?{c:e.className||e.id,x:r.x,y:r.y,w:r.width,h:r.height}:null;}).filter(Boolean));
 const hits=o.card?blockers.filter(b=>overlap(o.card,b)).map(b=>b.c):['카드 없음'];
 ok(`${label} 펼친 카드가 HUD 단추와 안 겹침`,!hits.length,hits.join(','));
 if(mobile)ok(`${label} 카드 단추 높이 44px 이상`,o.btns.length===2&&o.btns.every(h=>h>=44),o.btns);
 await sleep(5300);ok(`${label} 5초 무입력 뒤 접힘`,(await greet(A)).mode==='chip',(await greet(A)).mode);
 // 걷는 중 흐리게
 await put(3,.15,600);await cmd(A,'auto');await sleep(400);res.walk=await measure(A);await A.screenshot({path:`${dir}/${label}-walk.png`});
 ok(`${label} 걷는 중 칩 흐리게·안 펼침`,res.walk.greet.mode==='dim'&&res.walk.chipDim&&!res.walk.card,`${res.walk.greet.mode} 도장 ${res.walk.stampText}`);
 await cmd(A,'auto');await stand(A,base);
 // 이름표 끄기(머리가 화면 밖과 같은 길) → 큰 단추 위 「👋 이름」
 await put(3,.2,300);await cmd(A,'labels-toggle');await sleep(600);res.far=await measure(A);
 ok(`${label} 이름표가 안 보이면 큰 단추 위 「👋 바다」`,res.far.chipFar&&res.far.chip&&res.far.stamp&&res.far.chip.y+res.far.chip.h<=res.far.stamp.y&&/바다/.test(await A.locator('.gr-chip').innerText()),{chip:res.far.chip,stamp:res.far.stamp});
 await A.screenshot({path:`${dir}/${label}-far.png`});await cmd(A,'labels-toggle');await sleep(300);
 // 카드 「같이 등산하기」 = 이름표 카드와 같은 제안
 await put(1.6,.15,1500);if((await greet(A)).mode!=='open'){await A.locator('.gr-chip').click();await sleep(200);}
 await A.locator('.gr-card .gr-pair').click();await sleep(1200);
 const inc=await B.evaluate(()=>window.hiking.multiApi.pair.state.phase);ok(`${label} 카드 「같이 등산하기」 = 상대에게 제안`,inc==='incoming',inc);
 await B.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:pair-accept')));await sleep(1500);
 const ph=await A.evaluate(()=>window.hiking.multiApi.pair.state.phase);ok(`${label} 수락 뒤 동행`,ph==='paired',ph);
 // 동행하며 둘 다 자동 걷기: 칩 없음
 await cmd(A,'auto');await cmd(B,'auto');const seen=[];
 for(let i=0;i<6;i++){await sleep(1200);const m=await measure(A);seen.push(`${m.greet.mode}/${m.stampMode}`);}
 res.pairWalk=seen;await A.screenshot({path:`${dir}/${label}-pair.png`});
 ok(`${label} 같이 걷는 중 칩 없음·큰 단추는 걷기/멈추기`,seen.every(s=>/^none\/(walk|stop)$/.test(s)),seen);
 await cmd(A,'auto');await cmd(B,'auto');await sleep(900);const g1=(await greet(A)).mode;await sleep(2300);const g2=await greet(A);
 ok(`${label} 둘 다 멈추고 2초 뒤 칩 보임`,g1==='none'&&g2.mode!=='none',`${g1} → ${g2.mode} (${g2.d?.toFixed?.(1)}m)`);
 await A.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:pair-end')));
 writeFileSync(`${dir}/result-${label}.json`,JSON.stringify(res,null,1));
 await A.ctx.close();await B.ctx.close();
}
const only=process.argv[2];
const VP={pc:{viewport:{width:1920,height:1080},mobile:false},mobile:{viewport:{width:390,height:844},mobile:true},land:{viewport:{width:844,height:390},mobile:true}};
try{for(const k of only?[only]:['pc','mobile','land'])await run(k,VP[k]);}catch(e){console.log('점검 중 오류',e);checks.push({label:'오류',pass:false,info:String(e)});}
const fail=checks.filter(c=>!c.pass);console.log(`\n${checks.length-fail.length}/${checks.length} 통과`);
writeFileSync(`${dir}/checks-${only||'all'}.json`,JSON.stringify(checks,null,1));
await browser.close();await vite.close();srv.close?.();process.exit(fail.length?1:0);
