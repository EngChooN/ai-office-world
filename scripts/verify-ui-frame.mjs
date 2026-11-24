// 11-18 UI 개선(공통 화면 틀) 점검: 세 콘텐츠 × 휴대폰 세로·가로, 두 사람 접속(서버·vite를 스스로 띄움).
//  상태마다 단추 겹침·가림(단추 가운데가 다른 것에 덮임)·창 하나만·던지기 단추 안 가림을 보고,
//  시안과 같은 방법(4px 칸)으로 단추·창이 덮은 넓이와 막힘없는 화면을 잰다(게임 속 이름표·말풍선·대상 표시는 뺌).
//  결과: artifacts/ui-frame/<콘텐츠>-<방향>-<상태>.png + report.json. ONLY=smoking,christmas,hiking
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const OUT=process.env.OUT_DIR||ROOT+'/artifacts/ui-frame';mkdirSync(OUT,{recursive:true});
const req=createRequire(ROOT+'/package.json');
const pw=await import(req.resolve('@playwright/test'));const chromium=pw.chromium??pw.default.chromium;
const {createServer}=await import(req.resolve('vite'));
const {startServer}=await import(ROOT+'/server/multi-server.mjs');
const L=await import(ROOT+'/src/christmas/layout.js');const YARD=L.SNOWBALL_YARD;
const VP=+(process.env.VITE_PORT||5391),WP=+(process.env.WS_PORT||8891);
const vite=await createServer({root:ROOT,configFile:ROOT+'/vite.config.js',cacheDir:'/tmp/uiframe/.vite',server:{port:VP,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const srv=startServer({PORT:String(WP),HOST:'127.0.0.1',DATA_DIR:'/tmp/uiframe/data'},{quiet:true});await srv.ready;
const ws=encodeURIComponent('ws://127.0.0.1:'+WP);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SIZES={portrait:{width:390,height:844},landscape:{width:844,height:390}};
const C={
 smoking:{url:n=>`/smoking/?capture=1&time=day&multi=${encodeURIComponent('옥상-1')}&server=${ws}&name=${encodeURIComponent(n)}`,
  init:()=>{localStorage.clear();localStorage.setItem('online-smoking',JSON.stringify({nickname:'동동',status:'quit',outfit:'shirt',seenIntro:true,muted:true,quitDate:'2026-11-01'}));},
  ready:()=>window.lounge?.multi?.state==='online'},
 hiking:{url:n=>`/hiking/?multi=${encodeURIComponent('관악-1')}&name=${encodeURIComponent(n)}&server=${ws}&start=entrance&time=13:00&weather=clear&quality=low`,
  init:()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');},
  ready:()=>window.hiking?.started&&window.hiking.multi?.()?.status==='online'},
 christmas:{url:n=>`/christmas/?capture=1&multi=${encodeURIComponent('눈마을-1')}&server=${ws}&name=${encodeURIComponent(n)}`,
  init:()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));},
  ready:()=>window.xmas?.multi?.state==='online'},
};
// 시안 문서의 「개선」 숫자(게임 보임 %, 막힘없는 화면 %) — 같은 상태끼리 나란히 놓으려고
const DESIGN={'smoking-portrait-base':[95.2,75.4],'smoking-portrait-lit':[93.2,65.9],'smoking-portrait-lit-chat':[87.1,78.2],'smoking-portrait-menu':[58.9,54.5],'smoking-landscape-lit-chat':[88.1,61.2],'smoking-landscape-menu':[58.7,52.4],
 'hiking-portrait-base':[91.1,65.4],'hiking-portrait-menu':[52.3,49.3],'hiking-landscape-base':[91.1,63.4],'hiking-landscape-chat':[86.4,59.2],
 'christmas-portrait-fight':[92.1,65.4],'christmas-portrait-fight-chat':[87.9,78.2],'christmas-landscape-map':[58.0,52.4]};
// 「현재」(고치기 전, artifacts/ui-unify/raw/report.json)
const BEFORE={'smoking-portrait-base':[94.6,73.1],'smoking-portrait-lit':[91.1,65.8],'smoking-portrait-lit-chat':[86.6,55.4],'smoking-portrait-menu':[56.9,22.3],'smoking-landscape-lit-chat':[87.2,57.4],'smoking-landscape-menu':[39.7,11.8],
 'hiking-portrait-base':[79.1,52.6],'hiking-portrait-menu':[13.5,2.9],'hiking-landscape-base':[70.7,29],'hiking-landscape-chat':[53.9,29],
 'christmas-portrait-fight':[86.7,45],'christmas-portrait-fight-chat':[56.9,24.4],'christmas-landscape-map':[45.7,16.5]};
const measure=()=>{const W=innerWidth,H=innerHeight,S=4;const cols=Math.ceil(W/S),rows=Math.ceil(H/S);const grid=new Uint8Array(cols*rows);let ui=0;
 const WORLD=/lg-mp-tag|xh-tag|hc-bub|lg-bub|gr-chip|gr-card|ix-marker|ix-pill|nb-name|tag-3d|sp-mark|xs-name|lg-bubbles|hc-bubbles|joy/;
 const isUI=e=>{for(let n=e,d=0;n&&n!==document.body&&d<8;n=n.parentElement,d++){const r=n.getBoundingClientRect();if(r.width*r.height>=W*H*.85)return null;
   if(n.matches('button,a,input,textarea,select,[role=button],[role=dialog]'))return n;const cs=getComputedStyle(n);
   if((cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent'&&!/,\s*0\)$/.test(cs.backgroundColor))||cs.backgroundImage!=='none')return n;}return null;};
 const worldy=u=>{for(let n=u;n&&n!==document.body;n=n.parentElement){if(n.dataset?.uf)return false;if(WORLD.test(n.className?.toString?.()||''))return true;}return false;};
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const e=document.elementFromPoint(i*S+S/2,j*S+S/2);if(!e||e.tagName==='CANVAS')continue;const u=isUI(e);if(!u||worldy(u))continue;grid[j*cols+i]=1;ui++;}
 const h=new Int32Array(cols);let best=0;
 for(let j=0;j<rows;j++){for(let i=0;i<cols;i++)h[i]=grid[j*cols+i]?0:h[i]+1;const st=[];for(let i=0;i<=cols;i++){const cur=i<cols?h[i]:0;let s0=i;while(st.length&&st[st.length-1][1]>=cur){const [si,sh]=st.pop();const a=sh*(i-si);if(a>best)best=a;s0=si;}st.push([s0,cur]);}}
 const vis=b=>{const r=b.getBoundingClientRect();if(r.width<2||r.height<2)return false;const cs=getComputedStyle(b);return cs.visibility!=='hidden'&&+cs.opacity>0.05&&r.right>0&&r.bottom>0&&r.x<W&&r.y<H;};
 const inSheet=b=>!!b.closest('.uf-sheet,.uf-chatbar,.xt-map,.xg-sheet,.xh-card,.lg-modal,.uf-panel,.ix-book');
 let btns=[...document.querySelectorAll('button,input')].filter(vis).filter(b=>!worldy(b)).map(b=>{const r=b.getBoundingClientRect();const cx=Math.min(W-1,Math.max(0,r.x+r.width/2)),cy=Math.min(H-1,Math.max(0,r.y+r.height/2));const top=document.elementFromPoint(cx,cy);
  const covered=top&&!b.contains(top)&&top.tagName!=='CANVAS'&&!worldy(top)?(top.closest('[class]')?.className?.toString().slice(0,40)||top.tagName):null;
  const under=!!top&&!b.closest('.ufs')&&!!top.closest?.('.ufs');
  return {under,t:(b.getAttribute('aria-label')||b.dataset.ufT||b.textContent||b.placeholder||'').trim().replace(/\s+/g,' ').slice(0,20),uf:b.dataset.uf||'',sheet:inSheet(b),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),covered};});
 // 11-24 공통 바텀시트: 세로 메뉴는 위 64px만 남기고 덮음(대표 결정) → 시트 뒤로 들어간 바깥 단추(둘째 줄 칩 등)는 겹침·가림에서 뺌
 btns=btns.filter(b=>!b.under);
 const ov=[];for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){const a=btns[i],b=btns[j];if(a.sheet&&b.sheet)continue;const ix=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),iy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(ix>2&&iy>2)ov.push([a.t,b.t]);}
 const wins=[...document.querySelectorAll('.uf-sheet,.uf-chatbar,.xt-map,.xg-sheet,.xh-card,.ix-book')].filter(e=>!e.hidden&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>2&&!e.closest('.uf-panel')).map(e=>e.className.toString().split(' ')[0]);
 return {W,H,uiPct:+(ui/(cols*rows)*100).toFixed(1),visiblePct:+(100-ui/(cols*rows)*100).toFixed(1),freePct:+(best/(cols*rows)*100).toFixed(1),btnCount:btns.length,overlaps:ov,covered:btns.filter(b=>b.covered&&!b.sheet).map(b=>[b.t,b.covered]),wins,big:btns.find(b=>b.uf==='big')??null,btns};};
const ev=(p,fn,arg)=>p.evaluate(fn,arg);
const click=(p,sel)=>ev(p,s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true;},sel);
const closeAll=p=>ev(p,()=>{document.querySelector('.uf-menu-btn.on')?.click();const c=document.querySelector('.uf-chat-btn.on,.hc-btn.on');c?.click();const m=document.querySelector('.xt-map-btn.on');m?.click();});
const STATES={
 smoking:[
  ['base',async()=>{}],
  ['chat',async p=>{await click(p,'.uf-chat-btn');}],
  ['menu',async p=>{await closeAll(p);await click(p,'.uf-menu-btn');await click(p,'[data-uf-tab=scene]');}],
  ['menu-note',async p=>{await click(p,'[data-uf-tab=note]');}],
  ['lit',async p=>{await closeAll(p);await click(p,'[data-a=take]');await sleep(300);await click(p,'[data-a=kind]');await sleep(700);await click(p,'[data-a=light]');await sleep(3000);}],
  ['lit-chat',async p=>{await click(p,'.uf-chat-btn');await ev(p,()=>window.dispatchEvent(new CustomEvent('lounge:chat',{detail:{id:'x',name:'하늘',text:'불 붙였어요, 같이 피워요!'}})));}],
  ['lit-menu',async p=>{await click(p,'.uf-menu-btn');}],
 ],
 hiking:[
  ['base',async()=>{}],
  ['chat',async p=>{await click(p,'.hc-btn');}],
  ['menu',async p=>{await closeAll(p);await click(p,'.uf-menu-btn');await click(p,'[data-uf-tab=map]');}],
  ['menu-settings',async p=>{await click(p,'[data-uf-tab=settings]');}],
  ['menu-book',async p=>{await click(p,'[data-uf-tab=book]');}],
 ],
 christmas:[
  ['base',async()=>{}],
  ['chat',async p=>{await click(p,'.hc-btn');}],
  ['map',async p=>{await closeAll(p);await click(p,'.xt-map-btn');}],
  ['menu',async p=>{await closeAll(p);await click(p,'.uf-menu-btn');await click(p,'[data-uf-tab=outfit]');}],
  ['fight',async p=>{await closeAll(p);await ev(p,([x,z])=>window.xmas.teleport(x,z,0),[YARD.x,YARD.z+2]);await sleep(3000);}],
  ['fight-chat',async p=>{await click(p,'.hc-btn');await ev(p,()=>window.dispatchEvent(new CustomEvent('xmas:chat',{detail:{id:'x',name:'하늘',text:'메리 크리스마스!'}})));}],
 ],
};
const report={},fails=[];
const which=(process.env.ONLY||'smoking,christmas,hiking').split(',');
for(const id of which)for(const [sz,vp] of Object.entries(SIZES)){
 const tag=`${id}-${sz}`;let ctx,ctx2;try{
 ctx=await browser.newContext({viewport:vp,deviceScaleFactor:+(process.env.DSF||2),isMobile:true,hasTouch:true});await ctx.addInitScript(C[id].init);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,200)));
 await p.goto(`http://127.0.0.1:${VP}${C[id].url('동동')}`);await p.waitForFunction(C[id].ready,null,{timeout:240000});
 ctx2=await browser.newContext({viewport:{width:800,height:600}});await ctx2.addInitScript(C[id].init);const p2=await ctx2.newPage();await p2.goto(`http://127.0.0.1:${VP}${C[id].url('하늘')}`);await p2.waitForFunction(C[id].ready,null,{timeout:240000}).catch(()=>{});
 await sleep(id==='hiking'?12000:5000);
 for(const [st,fn] of STATES[id]){
  await fn(p);await sleep(1300);const key=`${tag}-${st}`;
  await p.screenshot({path:`${OUT}/${key}.png`});const m=await ev(p,measure);delete m.btns;report[key]=m;
  const d=DESIGN[key],b=BEFORE[key];
  const bad=[];if(m.overlaps.length)bad.push('겹침 '+JSON.stringify(m.overlaps));if(m.covered.length)bad.push('가림 '+JSON.stringify(m.covered));if(m.wins.length>1)bad.push('창 여러 개 '+m.wins.join(','));
  if(st==='fight'&&!m.big)bad.push('던지기(큰 단추) 없음'); // 11-19 채팅 통일: 채팅 중(fight-chat)에는 큰 단추도 숨김
  if(bad.length)fails.push(`${key}: ${bad.join(' / ')}`);
  console.log(`${key}\t게임 보임 ${m.visiblePct}%\t막힘없는 ${m.freePct}%\t단추 ${m.btnCount}${d?`\t시안 ${d[0]}%/${d[1]}%`:''}${b?`\t고치기 전 ${b[0]}%/${b[1]}%`:''}${bad.length?'\t✗ '+bad.join(' / '):'\t✓'}`);
 }
 if(errs.length){fails.push(`${tag}: 페이지 오류 ${errs.slice(0,3).join(' | ')}`);console.log(errs.slice(0,5).join('\n'));}
 }catch(e){fails.push(`${tag}: ${e.message.slice(0,200)}`);console.error(tag,e.message);}
 await ctx2?.close();await ctx?.close();
}
report.fails=fails;writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1));
console.log(fails.length?`\n실패 ${fails.length}건\n`+fails.join('\n'):'\n모두 통과');
await browser.close();await vite.close();await srv.close?.();process.exit(fails.length?1:0);
