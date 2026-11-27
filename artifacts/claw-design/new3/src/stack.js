// ① 불빛 쌓기 「별빛 탑」 시안. 판정 = 손가락이 닿은 순간(pointerdown timeStamp)의 빛 막대 자리 — 화면 그리기 틈과 상관없음(타이머와 같은 방식)
const ST={cols:7,rows:11,mid:7,width:3,pityWidth:4,pityAfter:5,steps:[140,125,110,100,90,80,75,75,75,75,75],idleSec:10,readySec:.8,choiceSec:20,fallSec:.3};
const PZ={small:{id:'squirrel',name:'다람쥐',em:'🐿️',band:{label:'★★ 보통',color:'#4f9bd9'}},big:{id:'big-nunsong',name:'큰 눈송이',em:'⛄',band:{label:'큰 인형 · ★★★ 희귀',color:'#8a5cd6'}}};
const cv=$('canvas.view'),cx=cv.getContext('2d');cv.width=390*2;cv.height=844*2;cx.scale(2,2);
let S={mode:'front',n:0},demo=false,choiceTimer=0;
const RULES={icon:'✨',name:'별빛 탑',sub:'불빛 쌓기',level:2,
 lines:['빛 막대가 좌우로 오가요. 「✋ 멈춤」을 누른 순간 그 자리에 멈춰요','아래 줄과 어긋난 칸은 떨어져 사라져요. 칸이 다 없어지면 끝','위로 갈수록 빨라져요. 7줄 = 다람쥐, 11줄(꼭대기) = 큰 눈송이','7줄에서 「계속하기」를 골라도 이미 받은 다람쥐는 그대로예요. 코인도 더 안 들어요'],
 pity:`경품 없이 ${ST.pityAfter}번 연달아 끝나면 직원이 시작 칸을 4칸으로 넓혀 줘요(받을 때까지 판마다)`,prizes:[PZ.small,PZ.big]};

// ── 그림(내 화면·구경 화면 공용). g = {x0,y0,s(칸 크기), rows, cur, falling, t, pity, glow, labels}
function drawStack(c,g){
 const {x0,y0,s}=g,W=ST.cols*s,H=ST.rows*s,yOf=r=>y0+H-r*s; // r = 1..11(줄 번호), 줄의 윗변
 rr(c,x0-s*.55,y0-s*1.25,W+s*2.9,H+s*3.1,s*.5);c.fillStyle='#2b2357';c.fill();c.lineWidth=s*.12;c.strokeStyle='#7c6ad8';c.stroke();
 // 간판
 rr(c,x0,y0-s*1.05,W,s*.8,s*.3);c.fillStyle='#ffd36b';c.fill();c.fillStyle='#3a2b22';c.font=`900 ${s*.5}px ${getComputedStyle(document.body).fontFamily}`;c.textAlign='center';c.textBaseline='middle';c.fillText('✨ 별빛 탑 ✨',x0+W/2,y0-s*.65);
 // 판
 c.fillStyle='#120d22';c.fillRect(x0,y0,W,H);
 for(let r=1;r<=ST.rows;r++)for(let i=0;i<ST.cols;i++){rr(c,x0+i*s+s*.08,yOf(r)+s*.08,s*.84,s*.84,s*.16);c.fillStyle=r===ST.mid?'#2a2050':r===ST.rows?'#33204a':'#1e1838';c.fill();}
 // 경품 줄 표시
 const mark=(r,label,em,col,got)=>{c.strokeStyle=col;c.lineWidth=s*.08;c.setLineDash([s*.2,s*.14]);c.strokeRect(x0-s*.1,yOf(r)-s*.02,W+s*.2,s*1.04);c.setLineDash([]);
  if(!g.labels)return;c.font=`${s*.7}px serif`;c.textAlign='center';c.fillText(got?'✅':em,x0+W+s*1.1,yOf(r)+s*.45);c.font=`800 ${s*.3}px sans-serif`;c.fillStyle=col;c.fillText(label,x0+W+s*1.1,yOf(r)+s*1.02);};
 mark(ST.mid,'7줄',PZ.small.em,'#7cc4ff',g.gotSmall);mark(ST.rows,'11줄',PZ.big.em,'#c9a2ff',false);
 // 놓인 줄
 const cell=(i,r,col,a=1)=>{c.globalAlpha=a;rr(c,x0+i*s+s*.08,yOf(r)+s*.08,s*.84,s*.84,s*.16);c.fillStyle=col;c.shadowColor=col;c.shadowBlur=s*.5;c.fill();c.shadowBlur=0;c.globalAlpha=1;};
 g.rows.forEach((o,k)=>{for(let i=o.x;i<o.x+o.w;i++)cell(i,k+1,g.glow?`hsl(${(k*33+g.t*.3)%360} 90% 65%)`:'#5fe1ff');});
 if(g.cur)for(let i=g.cur.x;i<g.cur.x+g.cur.w;i++)cell(i,g.cur.r,'#ffe14d');
 for(const f of g.falling??[]){const a=(g.t-f.t)/600;if(a>1)continue;c.globalAlpha=1-a;rr(c,x0+f.c*s+s*.08,yOf(f.r)+s*.08+a*a*s*3,s*.84,s*.84,s*.16);c.fillStyle='#ff5a4a';c.fill();c.globalAlpha=1;}
 // 경품 나오는 곳
 rr(c,x0+W*.2,y0+H+s*.5,W*.6,s*1.1,s*.3);c.fillStyle='#0c0818';c.fill();c.fillStyle='#8a7cd0';c.font=`700 ${s*.3}px sans-serif`;c.textAlign='center';c.fillText(g.out?'':'경품 나오는 곳',x0+W/2,y0+H+s*1.05);
 if(g.out){c.font=`${s*.9}px serif`;c.fillText(g.out,x0+W/2,y0+H+s*1.05);}
 if(g.pity&&g.labels){c.fillStyle='#8ff0b0';c.font=`900 ${s*.32}px sans-serif`;c.fillText('직원 도움 · 4칸 시작',x0+W/2,y0-s*1.45);}
}
const MAIN={x0:58,y0:215,s:34};

// ── 한 판
function posAt(t){const w=S.w,range=ST.cols-w;if(range<=0)return {x:0,dir:0};const k=Math.max(0,Math.floor((t-S.rt0)/ST.steps[S.r-1])),p=k%(2*range);let x=p<range?p:2*range-p,dir=p<range?1:-1;if(S.dir0<0){x=range-x;dir=-dir;}return {x,dir};}
function act(extra){spect.send({m:17,n:S.n,cz:S.w,...extra});}
function start(){
 if(G.coins<1){hud.toast('코인이 없어요 · 내일 0시에 30개');return;}
 G.coins--;G.plays++;const pity=G.fails>=ST.pityAfter;
 S={mode:'ready',t0:now(),rows:[],r:1,w:pity?ST.pityWidth:ST.width,pity,gotSmall:false,falling:[],n:S.n+1,last:null,top:0};
 hud.walk(false);hud.quit(true);spect.reset();act({ph:'play',v:0,cx:0,k:0,r:PZ.small.id});
 if(pity)hud.toast('직원 도움! 이번 판은 4칸으로 시작해요',3);
}
function rowStart(t){S.mode='run';S.rt0=t;S.dir0=S.r%2?1:-1;S.autoAt=null;}
function stop(t){
 if(S.mode!=='run')return;const {x,dir}=posAt(t),w=S.w,b=S.rows[S.r-2];
 const lo=b?Math.max(x,b.x):x,hi=b?Math.min(x+w,b.x+b.w):x+w,lost=[];
 for(let i=x;i<x+w;i++)if(i<lo||i>=hi)lost.push(i);
 S.falling.push(...lost.map(i=>({c:i,r:S.r,t:now()})));
 const shift=b?x-b.x:0;S.last={r:S.r,lost:lost.length,late:shift*dir>0};
 const nw=Math.max(0,hi-lo);
 if(!nw){S.mode='fall';S.ft=now();S.endAt=now()+500;return;}
 S.rows.push({x:lo,w:nw});S.w=nw;S.top=S.r;
 if(lost.length)hud.toast(`${S.r}줄 ${lost.length}칸 ${S.last.late?'늦었어요':'빨랐어요'}`,1.2);
 if(S.r===ST.mid){S.gotSmall=true;G.fails=0;G.dex[PZ.small.id]=(G.dex[PZ.small.id]??0)+1;act({ph:'drop',v:S.r,cx:lo,k:0,r:PZ.small.id});S.mode='fall';S.choiceAt=now()+450;return;}
 if(S.r===ST.rows){act({ph:'win',v:S.r,cx:lo,k:1,r:PZ.big.id});S.mode='out';S.outAt=now()+1300;S.win='big';G.dex[PZ.big.id]=(G.dex[PZ.big.id]??0)+1;return;}
 act({ph:'play',v:S.r,cx:lo});S.r++;S.mode='fall';S.ft=now();S.nextAt=now()+ST.fallSec*1000;
}
async function choice(){
 S.mode='choice';hud.bar({ic:'⏸',label:'고르는 중',sub:'카드에서 골라요',dim:true});
 let left=ST.choiceSec;clearInterval(choiceTimer);
 choiceTimer=setInterval(()=>{left--;const e=document.querySelector('[data-left]');if(e)e.textContent=left;if(left<=0)document.querySelector('.h-card [data-c=end]')?.click();},1000);
 if(demo)setTimeout(()=>document.querySelector('.h-card [data-c=go]')?.click(),900);
 const c=await hud.card(`<div class="band" style="--rc:${PZ.small.band.color}">${PZ.small.band.label} · 7줄 통과!</div><div class="big">${PZ.small.em}</div><h3>${PZ.small.name}를 받았어요</h3><p>도감에 넣었어요</p>
<p>계속하면 <b>11줄</b>에 <b>${PZ.big.name}</b>. 실패해도 <b>${PZ.small.name}는 그대로</b>예요 · 코인은 더 안 들어요</p>
<div class="row"><button class="btn red" data-c="go">▲ 계속하기</button><button class="btn" data-c="end">여기서 끝</button></div><p class="sub"><span data-left>${left}</span>초 안 고르면 여기서 끝나요</p>`);
 clearInterval(choiceTimer);
 if(c==='go'){S.r++;act({ph:'play',v:ST.mid,cx:S.rows[ST.mid-1].x});S.mode='fall';S.nextAt=now()+300;}
 else{act({ph:'win',v:ST.mid,cx:S.rows[ST.mid-1].x,k:1,r:PZ.small.id});S.win='small';S.mode='out';S.outAt=now()+1100;}
}
async function result(){
 S.mode='result';hud.bar(null);hud.hint(null);hud.chip(null);hud.quit(false);
 const top=S.top,L=S.last,miss=L&&L.lost?`${L.r}줄에서 ${L.lost}칸 ${L.late?'늦었어요':'빨랐어요'}`:'';
 let html;
 if(S.win==='big')html=resultCard({kind:'win',title:`꼭대기까지! ${PZ.big.name}`,big:PZ.big.em,band:PZ.big.band,lines:[`${PZ.small.name}도 받았어요(7줄) · 새 인형!`],carry:'🎒 등에 업고 다니기'});
 else if(S.win==='small')html=resultCard({kind:'win',title:`${PZ.small.name}를 받았어요`,big:PZ.small.em,band:PZ.small.band,lines:['7줄에서 끝냈어요'],carry:'✋ 손에 들고 다니기'});
 else if(S.gotSmall)html=resultCard({kind:'win',title:`${PZ.small.name}는 받았어요 · ${top}줄까지`,big:PZ.small.em,band:PZ.small.band,lines:[top===ST.rows-1?`<b>아까워요! ${PZ.big.name}까지 1줄</b>`:`${PZ.big.name}까지 ${ST.rows-top}줄 남았어요`,miss],carry:'✋ 손에 들고 다니기'});
 else{G.fails++;const near=top===ST.mid-1,left=ST.pityAfter-G.fails;
  html=resultCard({kind:near?'near':'miss',title:near?`아까워요! ${PZ.small.name}까지 1줄`:`아쉬워요 · ${top}줄까지 쌓았어요`,lines:[miss],pity:left<=0?'다음 판은 직원 도움 — 4칸으로 시작해요!':`직원 도움까지 ${left}번`});}
 if(demo)setTimeout(()=>document.querySelector('.h-card [data-c=again]')?.click(),1600);
 const c=await hud.card(html);
 if(c==='again')start();else{S.mode='front';front();if(c==='carry')hud.toast(S.win==='big'?`${PZ.big.name}를 업었어요`:`${PZ.small.name}를 손에 들었어요`,2.4);if(c==='dex')hud.toast('🧸 도감이 열려요(시안에서는 생략)');}
}
function front(){
 hud.bar(null);hud.hint(null);hud.chip(null);hud.quit(false);
 hud.walk(true,[{id:'play',label:'✨ 별빛 탑 한 판 · 🪙1',main:true},{id:'rules',label:'ⓘ 규칙'}]);
}
hud.on({
 down(t){if(S.mode==='run')stop(t);},
 todo(id){if(id==='rules'){hud.card(rulesCard({...RULES,first:false}));return;}
  if(!G.seen){G.seen=true;hud.card(rulesCard({...RULES,first:true})).then(c=>{if(c==='go')start();});return;}start();},
 async quit(){const c=await hud.card('<h3>그만둘까요?</h3><p>넣은 코인은 돌려받지 못해요'+(S.gotSmall?` · ${PZ.small.name}는 이미 받았어요`:'')+'</p><div class="row"><button class="btn" data-c="q">그만두기</button><button class="btn red" data-c="k">계속하기</button></div>');
  if(c==='q'){if(!S.gotSmall)G.fails++;S.mode='front';act({ph:''});front();}},
});
front();

// ── 구경 화면(다른 손님 화면): act만 받아 다시 그림. 움직이는 줄은 받는 쪽이 같은 빠르기로 혼자 움직임(맞춰 보내지 않음)
const spect=makeSpect($('#spect'),(c,w,h,a,hist,t)=>{
 c.clearRect(0,0,w,h);c.fillStyle='#1b1428';c.fillRect(0,0,w,h);
 const rows=[];let pn=a.n;for(const e of hist)if(e.n===pn&&e.v>0&&e.cz>0)rows[e.v-1]={x:e.cx,w:e.cz};
 const playing=a.ph==='play',top=rows.length,cw=a.cz||3;
 let cur=null;if(playing&&top<ST.rows){const range=ST.cols-cw,k=Math.floor(t/ST.steps[top]),p=range>0?k%(2*range):0;cur={r:top+1,w:cw,x:range>0?(p<range?p:2*range-p):0};}
 drawStack(c,{x0:99,y0:68,s:12,rows,cur,t,glow:a.ph==='win'&&a.v===ST.rows,labels:false,gotSmall:top>=ST.mid});
 // 내 동동이 뒤통수(구경 자리)
 c.fillStyle='#e9b44c';c.beginPath();c.ellipse(60,h-8,34,40,0,Math.PI,0);c.fill();c.fillStyle='#6b4b2a';c.beginPath();c.ellipse(60,h-36,30,10,0,0,Math.PI*2);c.fill();
 // 뽑는 손님 이름표·말풍선(결과 순간만, 기존 구경 연출 그대로 = 기계 불빛)
 c.fillStyle='#fff';c.font='700 11px sans-serif';c.textAlign='center';c.fillText('뽑기손님12',141,46);
 const say=a.ph==='drop'&&!a.k?'7줄! 고르는 중…':a.ph==='win'?(a.v===ST.rows?'꼭대기! 🎉':'다람쥐 받음'):a.ph==='lose'?'아쉬움':'';
 if(say){c.font='800 12px sans-serif';const tw=c.measureText(say).width+16;rr(c,141-tw/2,8,tw,24,10);c.fillStyle=a.ph==='lose'?'#ddd':'#ffd36b';c.fill();c.fillStyle='#3a2b22';c.fillText(say,141,24);}
 $('#spect-act').textContent=a.m?JSON.stringify({m:a.m,ph:a.ph,v:a.v,cx:a.cx,cz:a.cz,k:a.k,r:a.r,n:a.n}):'(아직 없음 — 왼쪽에서 한 판 해 보세요)';
});

// ── 매 프레임
let last=now();
function frame(t){
 const dt=(t-last)/1000;last=t;hud.tick(dt);
 const s=S;
 if(s.mode==='ready'&&t-s.t0>ST.readySec*1000)rowStart(t);
 if(s.mode==='fall'){if(s.choiceAt&&t>=s.choiceAt){s.choiceAt=0;choice();}else if(s.endAt&&t>=s.endAt){s.endAt=0;const top=s.top;act({ph:s.gotSmall?'win':'lose',v:top,cx:0,k:s.gotSmall?1:top===ST.mid-1?2:3,r:s.gotSmall?PZ.small.id:''});result();}else if(s.nextAt&&t>=s.nextAt){s.nextAt=0;rowStart(t);}}
 if(s.mode==='out'&&t>=s.outAt){s.outAt=1e15;result();}
 if(s.mode==='run'){
  if(t-s.rt0>ST.idleSec*1000){hud.toast('10초가 지나 저절로 멈췄어요');stop(t);}
  if(demo&&s.mode==='run'){if(s.autoAt==null){const b=s.rows[s.r-2],st=ST.steps[s.r-1];let tc=t+250;if(b){for(let k=Math.ceil((t+250-s.rt0)/st);k<400;k++){const tt=s.rt0+(k+.5)*st;if(posAt(tt).x===b.x){tc=tt;break;}}}s.autoAt=tc+gauss()*60;}if(t>=s.autoAt)stop(s.autoAt);}
 }
 // 화면 글
 if(['ready','run','fall','choice'].includes(s.mode)){
  hud.pill(`✨ 별빛 탑 · 🪙 <b>${G.coins}</b>`);
  hud.chip(`⭐ ${s.top} / ${ST.rows}줄 · 7줄 ${s.gotSmall?'✅':PZ.small.em} · 11줄 ${PZ.big.em}`);
  if(s.mode!=='choice')hud.bar(s.mode==='ready'?{ic:'⏳',label:'준비…',sub:'곧 빛이 움직여요',dim:true}:{ic:'✋',label:'멈춤',sub:s.r===1?'첫 줄은 아무 데서나 멈춰요':'빛이 아래 줄과 겹칠 때 눌러요'});
  hud.hint(s.mode==='run'?(s.r===1?'첫 줄 — 아무 데서나 멈춰요':s.r>=8?'빨라요! 아래 줄 위에서 멈추세요':'아래 줄과 겹치게 멈추세요'):null);
 }else if(s.mode==='front'){hud.pill(`👤 인형가게 1서버 · 🪙 <b>${G.coins}</b>`);}
 // 그림
 cx.clearRect(0,0,390,844);
 const cur=s.mode==='run'?{r:s.r,...posAt(t),w:s.w}:null;
 drawStack(cx,{...MAIN,rows:s.rows??[],cur,falling:s.falling,t,pity:s.pity,glow:s.mode==='out'&&s.win==='big'||s.mode==='result'&&s.win==='big',labels:true,gotSmall:s.gotSmall,out:s.mode==='out'?(s.win==='big'?PZ.big.em:PZ.small.em):''});
 if(s.mode==='front'){const k=Math.floor(t/120)%ST.rows;cx.globalAlpha=.6;for(let i=0;i<ST.cols;i++){rr(cx,MAIN.x0+i*MAIN.s+3,MAIN.y0+(ST.rows-1-k)*MAIN.s+3,MAIN.s-6,MAIN.s-6,5);cx.fillStyle='#5fe1ff';cx.fill();}cx.globalAlpha=1;}
 spect.frame(t);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
$('#demo').onclick=e=>{demo=!demo;e.target.setAttribute('aria-pressed',demo);if(demo&&S.mode==='front'){G.seen=true;start();}};
$('#pity').onclick=()=>{G.fails=ST.pityAfter;hud.toast('연속 실패 5번으로 맞춤 · 다음 판이 도움 판');};
$('#coins').onclick=()=>{G.coins=30;};
