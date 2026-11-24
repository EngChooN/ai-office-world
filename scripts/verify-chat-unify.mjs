// 11-19 채팅 통일 점검(시안 docs/UI-개선/채팅-통일-시안-v1.html v1.1): 세 콘텐츠 × 휴대폰 세로·가로, 두 사람 접속(서버·vite를 스스로 띄움).
//  상태: 기본 · 채팅 열림(지난 말 3줄) · 키보드(높이 가정 세로 291·가로 200px, 흉내) · 피우는 중/눈싸움 + 채팅 · 메뉴/지도.
//  보는 것: 말하기 줄 = 입력칸·보내기·✕(빠른 말 칩 없음)·맨 아래(세로 꽉 참·가로 왼쪽 540px)·키보드 바로 위, 지난 말 3줄(키보드 때 세로 2·가로 0),
//  채팅 중 행동 단추 전부 숨김, 말풍선 공통 모양(14px·테 2.5px·모서리 14px·최대 240px), 단추 겹침·가림 0, 시안과 같은 방법(4px 칸)으로 잰 게임 보임.
//  결과: artifacts/chat-unify/impl/<콘텐츠>-<방향>-<상태>.png + report.json. ONLY=smoking,hiking,christmas
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const ROOT=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const OUT=process.env.OUT_DIR||ROOT+'/artifacts/chat-unify/impl';mkdirSync(OUT,{recursive:true});
const req=createRequire(ROOT+'/package.json');
const pw=await import(req.resolve('@playwright/test'));const chromium=pw.chromium??pw.default.chromium;
const {createServer}=await import(req.resolve('vite'));
const {startServer}=await import(ROOT+'/server/multi-server.mjs');
const L=await import(ROOT+'/src/christmas/layout.js');const YARD=L.SNOWBALL_YARD;
const VP=+(process.env.VITE_PORT||5393),WP=+(process.env.WS_PORT||8893);
const vite=await createServer({root:ROOT,configFile:ROOT+'/vite.config.js',cacheDir:'/tmp/chatunify/.vite',server:{port:VP,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const srv=startServer({PORT:String(WP),HOST:'127.0.0.1',DATA_DIR:'/tmp/chatunify/data'},{quiet:true});await srv.ready;
const ws=encodeURIComponent('ws://127.0.0.1:'+WP);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const measure=()=>{const W=innerWidth,H=innerHeight,S=4;const cols=Math.ceil(W/S),rows=Math.ceil(H/S);const grid=new Uint8Array(cols*rows);let ui=0,lineCells=0;
 const WORLD=/lg-mp-tag|xh-tag|hc-bub|lg-bub|gr-chip|gr-card|ix-marker|ix-pill|nb-name|tag-3d|sp-mark|xs-name|lg-bubbles|hc-bubbles|joy/;
 const isUI=e=>{for(let n=e,d=0;n&&n!==document.body&&d<8;n=n.parentElement,d++){const r=n.getBoundingClientRect();if(r.width*r.height>=W*H*.85)return null;
   if(n.matches('button,a,input,textarea,select,[role=button],[role=dialog]'))return n;const cs=getComputedStyle(n);
   if((cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent'&&!/,\s*0\)$/.test(cs.backgroundColor))||cs.backgroundImage!=='none')return n;}return null;};
 const worldy=u=>{for(let n=u;n&&n!==document.body;n=n.parentElement){if(n.dataset?.uf)return false;if(WORLD.test(n.className?.toString?.()||''))return true;}return false;};
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const e=document.elementFromPoint(i*S+S/2,j*S+S/2);if(!e||e.tagName==='CANVAS')continue;const u=isUI(e);if(!u||worldy(u))continue;grid[j*cols+i]=1;ui++;if(u.closest('.uf-lines'))lineCells++;}
 const h=new Int32Array(cols);let best=0;
 for(let j=0;j<rows;j++){for(let i=0;i<cols;i++)h[i]=grid[j*cols+i]?0:h[i]+1;const st=[];for(let i=0;i<=cols;i++){const cur=i<cols?h[i]:0;let s0=i;while(st.length&&st[st.length-1][1]>=cur){const [si,sh]=st.pop();const a=sh*(i-si);if(a>best)best=a;s0=si;}st.push([s0,cur]);}}
 const vis=b=>{const r=b.getBoundingClientRect();if(r.width<2||r.height<2)return false;const cs=getComputedStyle(b);return cs.visibility!=='hidden'&&+cs.opacity>0.05&&r.right>0&&r.bottom>0&&r.x<W&&r.y<H;};
 const inSheet=b=>!!b.closest('.uf-sheet,.uf-chatbar,.xt-map,.xg-sheet,.xh-card,.lg-modal,.uf-panel,.ix-book');
 let btns=[...document.querySelectorAll('button,input')].filter(vis).filter(b=>!worldy(b)).map(b=>{const r=b.getBoundingClientRect();const cx=Math.min(W-1,Math.max(0,r.x+r.width/2)),cy=Math.min(H-1,Math.max(0,r.y+r.height/2));const top=document.elementFromPoint(cx,cy);
  const covered=top&&!b.contains(top)&&top.tagName!=='CANVAS'&&!worldy(top)?(top.closest('[class]')?.className?.toString().slice(0,40)||top.tagName):null;
  const under=!!top&&!b.closest('.ufs')&&!!top.closest?.('.ufs');
  return {under,t:(b.getAttribute('aria-label')||b.dataset.ufT||b.textContent||b.placeholder||'').trim().replace(/\s+/g,' ').slice(0,20),uf:b.dataset.uf||'',sheet:inSheet(b),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),covered};});
 // 11-24 공통 바텀시트: 세로 메뉴는 위 64px만 남기고 덮음(대표 결정) → 시트 뒤로 들어간 바깥 단추는 겹침·가림에서 뺌
 btns=btns.filter(b=>!b.under);
 const ov=[];for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){const a=btns[i],b=btns[j];if(a.sheet&&b.sheet)continue;const ix=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),iy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(ix>2&&iy>2)ov.push([a.t,b.t]);}
 const wins=[...document.querySelectorAll('.uf-sheet,.uf-chatbar,.xt-map,.xg-sheet,.xh-card,.ix-book')].filter(e=>!e.hidden&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>2&&!e.closest('.uf-panel')).map(e=>e.className.toString().split(' ')[0]);
 return {W,H,visibleNoLinesPct:+(100-(ui-lineCells)/(cols*rows)*100).toFixed(1),uiPct:+(ui/(cols*rows)*100).toFixed(1),visiblePct:+(100-ui/(cols*rows)*100).toFixed(1),freePct:+(best/(cols*rows)*100).toFixed(1),btnCount:btns.length,overlaps:ov,covered:btns.filter(b=>b.covered&&!b.sheet).map(b=>[b.t,b.covered]),wins,big:btns.find(b=>b.uf==='big')??null,btns};};

const SIZES={portrait:{width:390,height:844},landscape:{width:844,height:390}};
const KB={portrait:291,landscape:200}; // 시안과 같은 키보드 높이 가정(아이폰 한글 키보드 어림)
const C={
 smoking:{url:n=>`/smoking/?capture=1&time=day&multi=${encodeURIComponent('옥상-1')}&server=${ws}&name=${encodeURIComponent(n)}`,
  init:()=>{localStorage.clear();localStorage.setItem('online-smoking',JSON.stringify({nickname:'동동',status:'quit',outfit:'shirt',seenIntro:true,muted:true,quitDate:'2026-11-01'}));},
  ready:()=>window.lounge?.multi?.state==='online',chatBtn:'.uf-chat-btn',ev:'lounge:chat'},
 hiking:{url:n=>`/hiking/?multi=${encodeURIComponent('관악-1')}&name=${encodeURIComponent(n)}&server=${ws}&start=entrance&time=13:00&weather=clear&quality=low`,
  init:()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');},
  ready:()=>window.hiking?.started&&window.hiking.multi?.()?.status==='online',chatBtn:'.hc-btn',ev:'hiking:chat'},
 christmas:{url:n=>`/christmas/?capture=1&multi=${encodeURIComponent('눈마을-1')}&server=${ws}&name=${encodeURIComponent(n)}`,
  init:()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));},
  ready:()=>window.xmas?.multi?.state==='online',chatBtn:'.hc-btn',ev:'xmas:chat'},
};
// 시안(docs/UI-개선/채팅-통일-시안-v1.html) 「게임 보임」: 열기 전 · A안 열림 · A안 키보드
const DESIGN={smoking:{portrait:[93.1,90.3,58.5],landscape:[93.2,87.5,33.3]},hiking:{portrait:[90.6,89,58.3],landscape:[90.6,86.3,33.3]},christmas:{portrait:[90.4,89,58.3],landscape:[90.4,86.2,33.3]}};
const ev=(p,fn,arg)=>p.evaluate(fn,arg);
const click=(p,sel)=>ev(p,s=>{const e=document.querySelector(s);if(!e)return false;e.click();return true;},sel);
const closeAll=p=>ev(p,()=>{document.querySelector('.uf-menu-btn.on')?.click();document.querySelector('.uf-chat-btn.on,.hc-btn.on')?.click();document.querySelector('.xt-map-btn.on')?.click();});
// 상대(둘째 브라우저)가 실제로 세 마디 보냄(2초 1번 제한을 지켜 2.2초 간격) → 내 화면에 지난 말 3줄·머리 위 말풍선
const SEND={smoking:t=>window.dispatchEvent(new CustomEvent('lounge:chat',{detail:{id:'me',name:'하늘',text:t}})),hiking:t=>window.dispatchEvent(new CustomEvent('hiking:chat-send',{detail:{text:t}})),christmas:t=>window.dispatchEvent(new CustomEvent('xmas:chat-send',{detail:{text:t}}))};
const say=async(p2,id)=>{for(const t of ['안녕하세요','오늘 바람 많이 부네요','같이 가요, 천천히 와요!']){await p2.evaluate(`(${SEND[id]})(${JSON.stringify(t)})`);await sleep(2200);}};
// 키보드 흉내: 입력칸에 초점 → 공통 틀이 쓰는 표시(<html data-uf-kb>·--uf-kb)를 직접 넣고, 키보드 자리에 회색 판을 깐다(가린 넓이에 들어가게)
const kbOn=(p,h)=>ev(p,async h=>{const i=document.querySelector('.uf-chatbar:not([hidden]) input');i?.focus();await new Promise(r=>setTimeout(r,450));const r=document.documentElement;r.style.setProperty('--uf-kb',h+'px');r.setAttribute('data-uf-kb','');
 const k=document.createElement('div');k.id='fake-kb';k.style.cssText=`position:fixed;left:0;right:0;bottom:0;height:${h}px;background:#cfd3da;z-index:99`;document.body.append(k);},h);
const kbOff=p=>ev(p,()=>{document.getElementById('fake-kb')?.remove();const r=document.documentElement;r.removeAttribute('data-uf-kb');r.style.setProperty('--uf-kb','0px');document.activeElement?.blur();});
// 말하기 줄 모양 점검
const barInfo=()=>{const b=document.querySelector('.uf-chatbar:not([hidden])');if(!b)return null;const r=b.getBoundingClientRect(),cs=getComputedStyle(b);
 const lr=[...document.querySelectorAll('.uf-chatbar:not([hidden]) .uf-lines p')].filter(x=>getComputedStyle(x).display!=='none').reduce((a,x)=>{const q=x.getBoundingClientRect();return a+q.width*q.height;},0);
 const ufs=[...document.querySelectorAll('[data-uf]')].filter(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).map(e=>e.dataset.uf);
 const bub=document.querySelector('.uf-bub');const bs=bub&&getComputedStyle(bub);
 return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottomGap:Math.round(innerHeight-r.bottom),
  parts:[...b.querySelectorAll('input,button')].map(e=>e.matches('input')?'입력칸':e.classList.contains('uf-send')?'보내기':e.classList.contains('uf-close')?'닫기':'기타:'+e.className),
  chips:b.querySelectorAll('[data-say],[data-emote],.uf-pen').length,small:[...b.querySelectorAll('input,button')].filter(e=>{const q=e.getBoundingClientRect();return q.height<44||q.width<44;}).length,
  linesPct:+(lr/(innerWidth*innerHeight)*100).toFixed(1),lines:[...b.querySelectorAll('.uf-lines p')].filter(p=>getComputedStyle(p).display!=='none').length,ufShown:ufs,
  bubble:bs?{cls:bub.className,font:bs.fontSize,weight:bs.fontWeight,border:bs.borderTopWidth,radius:bs.borderTopLeftRadius,max:bs.maxWidth}:null,
  kbTop:document.getElementById('fake-kb')?Math.round(document.getElementById('fake-kb').getBoundingClientRect().top):null};};
const STATES={
 smoking:[['base'],['chat','open'],['chat-kb','kb'],['lit'],['lit-chat','open'],['menu']],
 hiking:[['base'],['chat','open'],['chat-kb','kb'],['menu']],
 christmas:[['base'],['chat','open'],['chat-kb','kb'],['fight'],['fight-chat','open'],['map']],
};
const ACT={
 menu:async p=>{await closeAll(p);await click(p,'.uf-menu-btn');},
 map:async p=>{await closeAll(p);await click(p,'.xt-map-btn');},
 lit:async p=>{await closeAll(p);await click(p,'[data-a=take]');await sleep(300);await click(p,'[data-a=kind]');await sleep(700);await click(p,'[data-a=light]');await sleep(3000);},
 fight:async p=>{await closeAll(p);await ev(p,([x,z])=>window.xmas.teleport(x,z,0),[YARD.x,YARD.z+2]);await sleep(3000);},
};
const report={},fails=[],table=[];
const which=(process.env.ONLY||'smoking,hiking,christmas').split(',');
for(const id of which)for(const [sz,vp] of Object.entries(SIZES)){
 const tag=`${id}-${sz}`;let ctx,ctx2;try{
 ctx=await browser.newContext({viewport:vp,deviceScaleFactor:+(process.env.DSF||2),isMobile:true,hasTouch:true});await ctx.addInitScript(C[id].init);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,200)));
 await p.goto(`http://127.0.0.1:${VP}${C[id].url('동동')}`);await p.waitForFunction(C[id].ready,null,{timeout:240000});
 ctx2=await browser.newContext({viewport:{width:800,height:600}});await ctx2.addInitScript(C[id].init);const p2=await ctx2.newPage();await p2.goto(`http://127.0.0.1:${VP}${C[id].url('하늘')}`);await p2.waitForFunction(C[id].ready,null,{timeout:240000}).catch(()=>{});
 await sleep(id==='hiking'?12000:5000);
 let said=false;
 for(const [st,mode] of STATES[id]){
  if(ACT[st])await ACT[st](p);
  if(mode==='open'){await kbOff(p);if(!await ev(p,()=>!!document.querySelector('.uf-chatbar:not([hidden])')))await click(p,C[id].chatBtn);if(!said){await sleep(300);await say(p2,id);said=true;}}
  if(mode==='kb')await kbOn(p,KB[sz]);
  await sleep(1300);const key=`${tag}-${st}`;
  await p.screenshot({path:`${OUT}/${key}.png`});const m=await ev(p,measure);delete m.btns;const bar=mode?await ev(p,barInfo):null;m.bar=bar;report[key]=m;
  const bad=[];if(m.overlaps.length)bad.push('겹침 '+JSON.stringify(m.overlaps));if(m.covered.length)bad.push('가림 '+JSON.stringify(m.covered));if(m.wins.length>1)bad.push('창 여러 개 '+m.wins.join(','));
  if(mode){
   if(!bar)bad.push('말하기 줄 없음');else{
    if(bar.parts.join()!=='입력칸,보내기,닫기')bad.push('부품 '+bar.parts.join());if(bar.chips)bad.push('빠른 말·동작 칩 '+bar.chips);if(bar.small)bad.push('44px 미만 '+bar.small);
    if(bar.ufShown.length)bad.push('채팅 중 행동 단추 보임 '+bar.ufShown.join(','));
    if(mode==='open'){if(bar.bottomGap!==0)bad.push('맨 아래에 안 붙음 '+bar.bottomGap);
     if(sz==='portrait'&&(bar.x!==0||bar.w!==vp.width))bad.push('세로 꽉 찬 줄 아님 '+bar.x+'/'+bar.w);
     if(sz==='landscape'&&(bar.x!==0||Math.abs(bar.w-540)>1))bad.push('가로 왼쪽 아래 540px 아님 '+bar.x+'/'+bar.w);
     if(bar.lines!==3)bad.push('지난 말 '+bar.lines+'줄');}
    if(mode==='kb'){if(bar.kbTop==null||Math.abs(bar.y+bar.h-bar.kbTop)>1)bad.push('키보드 바로 위 아님 '+(bar.y+bar.h)+'/'+bar.kbTop);
     const want=sz==='portrait'?2:0;if(bar.lines!==want)bad.push(`키보드 때 지난 말 ${bar.lines}줄(기대 ${want})`);}
    if(bar.bubble&&!(bar.bubble.font==='14px'&&parseFloat(bar.bubble.border)>=2&&bar.bubble.radius==='14px'&&parseFloat(bar.bubble.max)<=240))bad.push('말풍선 모양 '+JSON.stringify(bar.bubble));
   }
  }
  if(bad.length)fails.push(`${key}: ${bad.join(' / ')}`);
  const d=DESIGN[id][sz],di=st==='base'?0:mode==='open'?1:mode==='kb'?2:null;
  table.push({key,visible:m.visiblePct,linesPct:bar?.linesPct??null,design:di==null?null:d[di],lines:bar?.lines??null,ok:!bad.length});
  console.log(`${key}\t게임 보임 ${m.visiblePct}%${bar?`(지난 말 띠 ${bar.linesPct}%는 반투명·누르기 통과라 뺌)`:''}\t막힘없는 ${m.freePct}%${di!=null?`\t시안 ${d[di]}%`:''}${bar?`\t줄 ${bar.x},${bar.y} ${bar.w}×${bar.h} 지난 말 ${bar.lines}줄 말풍선 ${bar.bubble?bar.bubble.font+'/'+bar.bubble.border:'-'}`:''}${bad.length?'\t✗ '+bad.join(' / '):'\t✓'}`);
  if(mode==='kb')await kbOff(p);
 }
 if(errs.length){fails.push(`${tag}: 페이지 오류 ${errs.slice(0,3).join(' | ')}`);console.log(errs.slice(0,5).join('\n'));}
 }catch(e){fails.push(`${tag}: ${e.message.slice(0,200)}`);console.error(tag,e.message);}
 await ctx2?.close();await ctx?.close();
}
report.table=table;report.fails=fails;writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1));
console.log(fails.length?`\n실패 ${fails.length}건\n`+fails.join('\n'):'\n모두 통과');
await browser.close();await vite.close();await srv.close?.();process.exit(fails.length?1:0);
