// ② 줄 자르기 「가위로 툭」 시안. ① 「→」 누르고 있기 = 가위가 오른쪽으로(떼면 고정, 열쇠와 같음) → ② 「✂ 싹둑」 한 번 누르기 = 그 순간 줄 자리로 판정(pointerdown timeStamp)
// 단위 m. 기계 안 폭 0.60, 줄 2개(큰 인형), 가위 0.15m/s, 흔들림 진폭 약 5cm(판마다 ±15%로 바뀜)·주기 1.4초, 자르는 곳 ±3mm, 아까움 ±6mm
const SC={inner:.60,strings:[.22,.42],start:.04,end:.56,speed:.15,A:.05,P:1.4,w:.003,near:2,holdLimitSec:10,readySec:20,cutLimitSec:10,gapSec:.3,pityAfter:8};
const PZ=[{id:'big-rudolph',name:'큰 루돌프',em:'🦌',band:{label:'큰 인형 · ★★★ 희귀',color:'#8a5cd6'}},{id:'big-squirrel',name:'큰 다람쥐',em:'🐿️',band:{label:'큰 인형 · ★★ 보통',color:'#4f9bd9'}}];
const cv=$('canvas.view'),cx=cv.getContext('2d');cv.width=390*2;cv.height=844*2;cx.scale(2,2);
let S={mode:'front',n:0},demo=false;
const RULES={icon:'✂️',name:'가위로 툭',sub:'줄 자르기',level:3,
 lines:['① 「→」를 누르고 있으면 가위가 오른쪽으로 가요. 떼면 그 자리에 멈춰요(되돌릴 수 없어요)','② 「✂ 싹둑」을 누른 순간 가위가 닫혀요. 그때 줄이 칼날 가운데(±3mm)에 있으면 줄이 끊겨 큰 인형이 떨어져요','줄은 좌우로 흔들려요. 흔들림 크기는 판마다 조금씩 달라요','칼날 가장자리(±6mm)면 줄이 반쯤만 잘리는 아까움 · 다음 판은 새 줄이에요'],
 pity:`${SC.pityAfter}번 연달아 못 자르면 직원이 줄을 잡아 흔들리지 않게 해 줘요(자를 때까지 판마다)`,prizes:PZ};
// 픽셀 자리: 기계 안 왼쪽 35px, 0.60m = 320px
const PX=320/SC.inner,IX=35,TOP=205,CUTY=330,L=245; // 줄 위 끝 y·자르는 높이·줄 길이(px)
const amp=(t,i,still)=>still?0:SC.A*(.85+.3*(.5+.5*Math.sin(t/7300*2*Math.PI+i*2.1)));
const strX=(t,i,still)=>SC.strings[i]+amp(t,i,still)*Math.sin(2*Math.PI*t/(SC.P*1000)+i*1.9); // 자르는 높이에서 줄 자리(m)
// ── 그림(내 화면·구경 화면 공용). g = {t, blade, closed(0~1), still, cut:{i,t,ok,near,dx}, zoom:{x,y,k}, s(축척), ox,oy}
function drawCut(c,g){
 c.save();const k=g.s??1;c.translate(g.ox??0,g.oy??0);c.scale(k,k);
 if(g.zoom){const z=g.zoom;c.translate(z.x,z.y);c.scale(z.k,z.k);c.translate(-z.x,-z.y);}
 // 몸
 rr(c,18,150,354,500,24);c.fillStyle='#5a2a2a';c.fill();c.lineWidth=5;c.strokeStyle='#e0874a';c.stroke();
 rr(c,40,160,310,34,14);c.fillStyle='#ffd36b';c.fill();c.fillStyle='#3a2b22';c.font='900 20px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('✂️ 가위로 툭',195,178);
 c.fillStyle='#1d1216';c.fillRect(IX,198,320,380);
 // 위 막대·레일
 c.fillStyle='#9aa3ad';c.fillRect(IX,TOP-6,320,8);c.fillStyle='#6b7480';c.fillRect(IX,300,320,6);
 // 줄 2개 + 큰 인형
 for(let i=0;i<2;i++){
  const ax=IX+SC.strings[i]*PX,cut=g.cut&&g.cut.i===i?g.cut:null;
  let xc=IX+strX(g.t,i,g.still)*PX;if(cut)xc=IX+(cut.x)*PX;
  const tipX=ax+(xc-ax)*(L/(CUTY-TOP)); // 줄 끝(인형 자리)
  const fall=cut&&cut.ok?Math.min(1,(g.t-cut.t)/700):0;
  c.strokeStyle='#f4ead2';c.lineWidth=1.6;c.beginPath();c.moveTo(ax,TOP);
  if(cut&&cut.ok){c.lineTo(ax+(xc-ax)*.92,CUTY-4);c.stroke();c.beginPath();c.moveTo(xc,CUTY+4+fall*fall*260);c.lineTo(tipX,TOP+L+fall*fall*260);c.stroke();}
  else{c.lineTo(tipX,TOP+L);c.stroke();if(cut&&cut.near){c.fillStyle='#ffb52b';c.beginPath();c.arc(xc,CUTY,3.5,0,7);c.fill();}}
  c.font='64px serif';c.textAlign='center';c.textBaseline='top';c.fillText(PZ[i].em,tipX,TOP+L-6+fall*fall*260);
  c.fillStyle='#e9d9b8';c.font='800 12px sans-serif';c.fillText(PZ[i].name,ax,TOP+8);
  if(g.still){c.fillStyle='#3f9a62';rr(c,ax-9,TOP+28,18,22,5);c.fill();c.fillStyle='#fff';c.font='800 9px sans-serif';c.fillText('직원',ax,TOP+33);}
 }
 // 가위(레일 위 수레 + 아래로 내린 팔 + 칼날). 칼날 가운데 = 자르는 곳, 노란 괄호 = ±3mm
 if(g.blade!=null){const bx=IX+g.blade*PX,cl=g.closed??0;
  c.fillStyle='#c7ced6';rr(c,bx-16,288,32,22,6);c.fill();c.fillStyle='#8892a0';c.fillRect(bx-3,308,6,14);
  c.save();c.translate(bx,CUTY);c.strokeStyle='#e8edf2';c.lineWidth=4;c.lineCap='round';
  const op=(1-cl)*.55;c.beginPath();c.moveTo(-26*Math.cos(op),-26*Math.sin(op)*-1);c.lineTo(0,0);c.lineTo(-26*Math.cos(op),-26*Math.sin(op));c.stroke();
  c.beginPath();c.moveTo(26*Math.cos(op),26*Math.sin(op));c.lineTo(0,0);c.lineTo(26*Math.cos(op),-26*Math.sin(op));c.stroke();
  c.fillStyle='#ff5a4a';c.beginPath();c.arc(0,0,2.4,0,7);c.fill();c.restore();
  if(g.guide){c.strokeStyle='rgba(255,211,107,.9)';c.lineWidth=1;c.beginPath();const w=SC.w*PX;c.moveTo(bx-w,CUTY-9);c.lineTo(bx-w,CUTY+9);c.moveTo(bx+w,CUTY-9);c.lineTo(bx+w,CUTY+9);c.stroke();
   c.setLineDash([3,4]);c.strokeStyle='rgba(255,211,107,.35)';c.beginPath();c.moveTo(bx,CUTY+12);c.lineTo(bx,560);c.stroke();c.setLineDash([]);}
 }
 // 경품구
 rr(c,120,590,150,44,12);c.fillStyle='#0d0709';c.fill();c.fillStyle='#b88';c.font='700 11px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(g.out?'':'경품 나오는 곳',195,612);
 if(g.out){c.font='34px serif';c.fillText(g.out,195,612);}
 if(g.still&&g.labels){c.fillStyle='#8ff0b0';c.font='900 13px sans-serif';c.fillText('직원 도움 · 줄을 잡아 줌',195,142);}
 c.restore();
}
function act(extra){spect.send({m:18,n:S.n,...extra});}
function start(){
 if(G.coins<1){hud.toast('코인이 없어요 · 내일 0시에 30개');return;}
 G.coins--;G.plays++;const pity=G.fails>=SC.pityAfter;
 S={mode:'k1',t0:now(),blade:SC.start,holdAt:0,pity,n:S.n+1,zoom:0,closed:0,cut:null};
 hud.walk(false);hud.quit(true);spect.reset();act({ph:'play',cx:Math.round(SC.start*1000),cz:0,k:0,v:0});
 if(pity)hud.toast('직원 도움! 직원이 줄을 잡아 줬어요',3);
}
function release(t){if(S.mode!=='k1'||!S.holdAt)return;S.blade=Math.min(SC.end,S.blade0+SC.speed*(t-S.holdAt)/1000);S.holdAt=0;S.mode='gap';S.gapEnd=t+SC.gapSec*1000;act({ph:'play',cx:Math.round(S.blade*1000)});}
function snip(t){
 if(S.mode!=='k2')return;S.mode='snip';S.snipT=now();
 let best=0,bd=1e9;for(let i=0;i<2;i++){const d=strX(t,i,S.pity)-S.blade;if(Math.abs(d)<Math.abs(bd)){bd=d;best=i;}}
 const ok=Math.abs(bd)<=SC.w,near=!ok&&Math.abs(bd)<=SC.w*SC.near;
 S.cut={i:best,x:S.blade+bd,t:now(),ok,near,dx:bd};S.res=ok?'win':near?'near':'miss';
 act({ph:'drop',cx:Math.round(S.blade*1000),cz:best+1,v:Math.round(bd*1000)+100,k:ok?1:near?2:3,r:ok?PZ[best].id:''});
 S.endAt=now()+(ok?1500:900);
}
async function result(){
 S.mode='result';hud.bar(null);hud.hint(null);hud.chip(null);hud.quit(false);
 const c=S.cut,P=PZ[c.i],mm=Math.abs(c.dx*1000),side=c.dx>0?'오른쪽':'왼쪽',dist=mm>=10?`${(mm/10).toFixed(1)}cm`:`${mm.toFixed(0)}mm`;let html;
 if(S.res==='win'){G.fails=0;G.dex[P.id]=(G.dex[P.id]??0)+1;html=resultCard({kind:'win',title:`싹둑! ${P.name}`,big:P.em,band:P.band,lines:['줄이 칼날 가운데에 있었어요'],carry:'🎒 등에 업고 다니기'});}
 else{G.fails++;const left=SC.pityAfter-G.fails;
  html=resultCard({kind:S.res,title:S.res==='near'?'아까워요! 줄이 반쯤 잘렸어요':'허공을 잘랐어요',lines:[`줄이 칼날 가운데보다 <b>${dist} ${side}</b>에 있었어요`,S.res==='near'?'반쯤 잘린 줄은 다음 판에 새 줄로 바뀌어요':'줄이 칼날 앞을 지나는 순간을 노려 보세요'],
   pity:left<=0?'다음 판은 직원 도움 — 직원이 줄을 잡아 줘요!':`직원 도움까지 ${left}번`});}
 if(demo)setTimeout(()=>document.querySelector('.h-card [data-c=again]')?.click(),1600);
 const r=await hud.card(html);
 if(r==='again')start();else{S={mode:'front',n:S.n};front();if(r==='carry')hud.toast(`${P.name}를 업었어요`,2.4);}
}
function front(){hud.bar(null);hud.hint(null);hud.chip(null);hud.quit(false);hud.walk(true,[{id:'play',label:'✂️ 가위로 툭 한 판 · 🪙1',main:true},{id:'rules',label:'ⓘ 규칙'}]);}
hud.on({
 down(t){if(S.mode==='k1'&&!S.holdAt){S.holdAt=t;S.blade0=S.blade;}else if(S.mode==='k2')snip(t);},
 up(t){if(S.mode==='k1')release(t);},
 todo(id){if(id==='rules'){hud.card(rulesCard({...RULES,first:false}));return;}
  if(!G.seen){G.seen=true;hud.card(rulesCard({...RULES,first:true})).then(c=>{if(c==='go')start();});return;}start();},
 async quit(){const c=await hud.card('<h3>그만둘까요?</h3><p>넣은 코인은 돌려받지 못해요</p><div class="row"><button class="btn" data-c="q">그만두기</button><button class="btn red" data-c="k">계속하기</button></div>');
  if(c==='q'){G.fails++;S={mode:'front',n:S.n};act({ph:''});front();}},
});
front();
// ── 구경 화면: 가위 자리(cx)·자른 줄(cz)·줄 차이(v−100 mm)만 받음. 줄 흔들림은 받는 쪽이 혼자, 자른 순간만 받은 차이대로 줄을 맞춰 그림
const spect=makeSpect($('#spect'),(c,w,h,a,hist,t)=>{
 c.clearRect(0,0,w,h);c.fillStyle='#1b1428';c.fillRect(0,0,w,h);
 const res=a.ph==='drop'&&a.k,blade=a.cx!=null?a.cx/1000:null;
 if(res&&!spect.cutAt)spect.cutAt=t;if(!res)spect.cutAt=0;
 const cut=res?{i:a.cz-1,x:blade+(a.v-100)/1000,t:spect.cutAt,ok:a.k===1,near:a.k===2}:null;
 drawCut(c,{t,blade:a.ph?blade:null,closed:res?1:0,cut,s:.42,ox:68,oy:-50,labels:false});
 c.fillStyle='#e9b44c';c.beginPath();c.ellipse(52,h-8,30,36,0,Math.PI,0);c.fill();c.fillStyle='#6b4b2a';c.beginPath();c.ellipse(52,h-33,27,9,0,0,7);c.fill();
 c.fillStyle='#fff';c.font='700 11px sans-serif';c.textAlign='center';c.fillText('뽑기손님12',262,90);
 const say=a.ph==='drop'?(a.k===1?'싹둑! 🎉':a.k===2?'반쯤…!':'허공'):'';
 if(say){c.font='800 12px sans-serif';const tw=c.measureText(say).width+16;rr(c,262-tw/2,52,tw,20,9);c.fillStyle=a.k===3?'#ddd':'#ffd36b';c.fill();c.fillStyle='#3a2b22';c.fillText(say,262,66);}
 $('#spect-act').textContent=a.m?JSON.stringify({m:a.m,ph:a.ph,cx:a.cx,cz:a.cz,v:a.v,k:a.k,r:a.r,n:a.n}):'(아직 없음 — 왼쪽에서 한 판 해 보세요)';
});
let last=now();
function frame(t){
 const dt=(t-last)/1000;last=t;hud.tick(dt);const s=S;
 if(s.mode==='k1'){
  if(s.holdAt){s.blade=Math.min(SC.end,s.blade0+SC.speed*(t-s.holdAt)/1000);if(t-s.holdAt>SC.holdLimitSec*1000||s.blade>=SC.end){hud.toast(s.blade>=SC.end?'끝까지 왔어요':'10초가 지나 저절로 멈췄어요');release(t);}}
  else if(t-s.t0>SC.readySec*1000){hud.toast('20초가 지나 이 자리에서 시작해요');s.holdAt=t;s.blade0=s.blade;release(t);}
  if(demo&&s.mode==='k1'){const tgt=SC.strings[0]+(rnd()<.5?0:.2);if(!s.holdAt&&t-s.t0>500){s.holdAt=t;s.blade0=s.blade;s.demoUp=t+(tgt-s.blade0)/SC.speed*1000+gauss()*60;}if(s.holdAt&&s.demoUp&&t>=s.demoUp){s.demoUp=0;release(t);}}
 }
 if(s.mode==='gap'&&t>=s.gapEnd){s.mode='k2';s.k2t=t;}
 if(s.mode==='k2'){if(t-s.k2t>SC.cutLimitSec*1000){hud.toast('10초가 지나 저절로 잘랐어요');snip(t);}
  if(demo&&s.mode==='k2'){if(!s.demoCut){// 가운데를 지나는 다음 순간 + 사람 오차
   const i=Math.abs(SC.strings[0]-s.blade)<Math.abs(SC.strings[1]-s.blade)?0:1;let tt=t+400;for(let q=0;q<3000;q+=5){if(Math.sign(strX(t+400+q,i,s.pity)-s.blade)!==Math.sign(strX(t+405+q,i,s.pity)-s.blade)){tt=t+400+q;break;}}s.demoCut=tt+gauss()*60;}
   if(t>=s.demoCut)snip(s.demoCut);}}
 if(s.mode==='snip'&&t>=s.endAt){s.endAt=1e15;result();}
 const k2=['k2','snip'].includes(s.mode);s.zoom+=((k2?1:0)-s.zoom)*Math.min(1,dt*6);
 if(['k1','gap','k2','snip'].includes(s.mode)){
  hud.pill(`✂️ 가위로 툭 · 🪙 <b>${G.coins}</b>`);
  hud.chip(s.mode==='k1'||s.mode==='gap'?'① 가위 옮기기':'② 줄이 칼날 가운데일 때 싹둑!');
  hud.bar(s.mode==='k1'?{ic:'→',label:'오른쪽',sub:'누르고 있는 동안 움직이고, 떼면 멈춰요'}:s.mode==='gap'?{ic:'⏳',label:'잠깐',sub:'잠깐만요…',dim:true}:s.mode==='k2'?{ic:'✂️',label:'싹둑',sub:'누른 순간 가위가 닫혀요',tone:'cut'}:{ic:'✂️',label:'싹둑!',sub:'결과를 보는 중',tone:'cut',dim:true});
  hud.hint(s.mode==='k1'?'누르고 있으면 가위가 오른쪽으로 가요. 줄 앞에서 떼세요':s.mode==='k2'?'줄이 노란 괄호 사이를 지날 때 누르세요':null);
 }else if(s.mode==='front')hud.pill(`👤 인형가게 1서버 · 🪙 <b>${G.coins}</b>`);
 if(s.mode==='snip')s.closed=Math.min(1,(t-s.snipT)/120);
 cx.clearRect(0,0,390,844);
 const bx=IX+(s.blade??SC.start)*PX;
 drawCut(cx,{t,blade:s.mode==='front'||s.mode==='result'&&!s.cut?null:s.blade??null,closed:s.closed,still:s.pity,cut:s.cut,guide:['k1','gap','k2'].includes(s.mode),labels:true,
  zoom:s.zoom>.01?{x:bx,y:CUTY,k:1+1.2*s.zoom}:null,out:s.mode==='result'&&s.res==='win'||s.mode==='snip'&&s.res==='win'&&t-s.snipT>800?PZ[s.cut.i].em:''});
 spect.frame(t);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
$('#demo').onclick=e=>{demo=!demo;e.target.setAttribute('aria-pressed',demo);if(demo&&S.mode==='front'){G.seen=true;start();}};
$('#pity').onclick=()=>{G.fails=SC.pityAfter;hud.toast('연속 실패 8번으로 맞춤 · 다음 판이 도움 판');};
$('#coins').onclick=()=>{G.coins=30;};
