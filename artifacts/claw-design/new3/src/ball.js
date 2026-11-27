// ③ 공 구멍 넣기 「동동이 공 떨어뜨리기」 시안. 조작 = 집게 기계와 같음(십자 누르고 있기 15초 + 「떨어뜨리기」). 공은 시작할 때 이미 집게에 있음
// 판 4×4 구멍(간격 6cm). 노랑 2 = 작은 인형, 보라 1(가장자리·작은 구멍) = 희귀. 튐은 시안용 흉내(실제는 공 물리) — 흩어짐 약 구멍 간격 1배
const BC={n:4,pitch:.06,speed:.09,timeSec:15,readySec:.8,hops:[.65,.55,.45],ball:.013,hole:.021,rareHole:.016,rareIn:.6,pityAfter:5,
 holes:{'1,1':'magpie','2,2':'hare','3,0':'haechi'},rare:'3,0',pity:'1,2'};
const PZ={magpie:{id:'magpie',name:'까치',em:'🐦',band:{label:'★★ 보통',color:'#4f9bd9'}},hare:{id:'hare',name:'산토끼',em:'🐰',band:{label:'★★ 보통',color:'#4f9bd9'}},haechi:{id:'haechi',name:'해치',em:'🦁',band:{label:'★★★ 희귀',color:'#8a5cd6'}}};
const cv=$('canvas.view'),cx=cv.getContext('2d');cv.width=390*2;cv.height=844*2;cx.scale(2,2);
let S={mode:'front',n:0},demo=false;
const RULES={icon:'🏓',name:'공 떨어뜨리기',sub:'공 구멍 넣기',level:2,
 lines:['집게가 공을 들고 있어요. 십자 단추를 누르고 있으면 움직여요(15초)','「떨어뜨리기」를 누르면 공을 놓아요. 공은 판에서 몇 번 튀고 굴러 구멍 하나에 들어가요','노란 구멍 = 그 옆 그림 인형, 보라 구멍 = 희귀 해치(구멍이 작아 굴러 지나가기 쉬워요)','판 위 그림자 점이 공이 떨어질 자리예요'],
 pity:`${BC.pityAfter}번 연달아 못 넣으면 직원이 초록 「도움 구멍」을 하나 더 열어 줘요(넣을 때까지 판마다)`,prizes:[PZ.magpie,PZ.hare,PZ.haechi]};
const PX=70/BC.pitch,C0={x:195,y:390}; // 판 가운데 화면 자리, 1m = 1250px
const half=BC.n*BC.pitch/2,toS=(x,z)=>[C0.x+x*PX,C0.y+z*PX];
const cellOf=(x,z)=>[Math.min(BC.n-1,Math.max(0,Math.floor((x+half)/BC.pitch))),Math.min(BC.n-1,Math.max(0,Math.floor((z+half)/BC.pitch)))];
const cellC=(i,j)=>[(i+.5)*BC.pitch-half,(j+.5)*BC.pitch-half];
const fold=v=>{let x=v;const lim=half-BC.ball;for(let q=0;q<4;q++){if(x<-lim)x=-2*lim-x;if(x>lim)x=2*lim-x;}return x;};
// ── 그림(내 화면·구경 공용). g = {claw:{x,z}|null, ball:{x,z,h,a}|null, pity, mark:{key,kind}, t, out, labels}
function drawBall(c,g){
 c.save();c.translate(g.ox??0,g.oy??0);c.scale(g.s??1,g.s??1);
 rr(c,18,152,354,442,24);c.fillStyle='#24486a';c.fill();c.lineWidth=5;c.strokeStyle='#58b0e8';c.stroke();
 rr(c,40,162,310,34,14);c.fillStyle='#ffd36b';c.fill();c.fillStyle='#3a2b22';c.font='900 20px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('🏓 공 떨어뜨리기',195,180);
 // 판(약간 기울어진 느낌: 아래쪽이 밝음)
 const g0=c.createLinearGradient(0,C0.y-150,0,C0.y+150);g0.addColorStop(0,'#c99b5f');g0.addColorStop(1,'#e8c48a');
 rr(c,C0.x-146,C0.y-146,292,292,16);c.fillStyle=g0;c.fill();c.lineWidth=6;c.strokeStyle='#8a5a2b';c.stroke();
 for(let j=0;j<BC.n;j++)for(let i=0;i<BC.n;i++){const k=`${i},${j}`,[hx,hz]=cellC(i,j),[sx,sy]=toS(hx,hz),pz=BC.holes[k],pit=g.pity&&k===BC.pity;
  const r=(k===BC.rare?BC.rareHole:BC.hole)*PX;c.beginPath();c.arc(sx,sy,r,0,7);c.fillStyle='#3a2414';c.fill();
  if(pz||pit){c.lineWidth=6;c.strokeStyle=pit?'#3fdc7a':k===BC.rare?'#b07cff':'#ffd23a';c.stroke();if(g.labels!==false){c.font='22px serif';c.fillText(pz?PZ[pz].em:'🐦',sx+r+2,sy-r);}}
  if(g.mark&&g.mark.key===k){c.lineWidth=5;c.strokeStyle=g.mark.kind==='win'?'#5fe17a':g.mark.kind==='near'?'#ffb52b':'#ff5a4a';c.beginPath();c.arc(sx,sy,r+7,0,7);c.stroke();}
 }
 // 그림자 점·집게
 if(g.claw){const [sx,sy]=toS(g.claw.x,g.claw.z);c.fillStyle='rgba(20,10,0,.35)';c.beginPath();c.ellipse(sx,sy,BC.ball*PX,BC.ball*PX*.7,0,0,7);c.fill();
  c.strokeStyle='#cfd6de';c.lineWidth=3;c.beginPath();c.moveTo(sx,200);c.lineTo(sx,sy-78);c.stroke();
  c.fillStyle='#cfd6de';rr(c,sx-16,sy-86,32,12,4);c.fill();c.lineWidth=4;c.beginPath();c.moveTo(sx-12,sy-74);c.lineTo(sx-17,sy-56);c.moveTo(sx+12,sy-74);c.lineTo(sx+17,sy-56);c.stroke();
  if(g.claw.has){c.fillStyle='#fff';c.beginPath();c.arc(sx,sy-58,BC.ball*PX,0,7);c.fill();c.strokeStyle='#ffb52b';c.lineWidth=2;c.stroke();}}
 // 떨어진 공(높이 h는 위로 올려 그림 + 그림자)
 if(g.ball){const [sx,sy]=toS(g.ball.x,g.ball.z),h=g.ball.h*PX;c.globalAlpha=g.ball.a??1;
  c.fillStyle='rgba(20,10,0,.3)';c.beginPath();c.ellipse(sx,sy,BC.ball*PX*(1-Math.min(.5,h/200)),BC.ball*PX*.7,0,0,7);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(sx,sy-h,BC.ball*PX*(1+h/600),0,7);c.fill();c.strokeStyle='#ffb52b';c.lineWidth=2;c.stroke();c.globalAlpha=1;}
 rr(c,120,550,150,38,12);c.fillStyle='#0d1620';c.fill();c.fillStyle='#8ab';c.font='700 11px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(g.out?'':'경품 나오는 곳',195,569);
 if(g.out){c.font='34px serif';c.fillText(g.out,195,569);}
 if(g.pity&&g.labels!==false){c.fillStyle='#8ff0b0';c.font='900 13px sans-serif';c.fillText('직원 도움 · 초록 구멍 열림',195,226);}
 c.restore();
}
// ── 튐 길(시안 흉내): 놓은 자리 → 튐 3번 → 구멍 칸으로 굴러감. seeded면 구경용(받은 구멍으로 끝나게)
function planPath(x,z,pity,endCell){
 const pts=[{x,z}];let px=x,pz=z;for(const s of BC.hops){px=fold(px+gauss()*s*BC.pitch);pz=fold(pz+gauss()*s*BC.pitch);pts.push({x:px,z:pz});}
 let [i,j]=endCell??cellOf(px,pz),key=`${i},${j}`,over=false;
 if(!endCell&&key===BC.rare){const [hx,hz]=cellC(i,j);if(Math.max(Math.abs(px-hx),Math.abs(pz-hz))>BC.rareIn*BC.pitch/2){over=true;const dx=Math.sign(px-pts[2].x)||1;i=Math.max(0,Math.min(BC.n-1,i-dx));key=`${i},${j}`;pts.push({x:cellC(3,0)[0],z:cellC(3,0)[1],roll:1});}}
 if(endCell){const [hx,hz]=cellC(i,j);pts[pts.length-1]={x:fold(hx+(px-hx)*.3),z:fold(hz+(pz-hz)*.3)};}
 const [hx,hz]=cellC(i,j);pts.push({x:hx,z:hz,roll:1});
 const pz2=BC.holes[key]??(pity&&key===BC.pity?'magpie':null);
 const near=!pz2&&(over||[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>BC.holes[`${i+a},${j+b}`]||pity&&`${i+a},${j+b}`===BC.pity));
 return {pts,key,cell:[i,j],kind:pz2?'win':near?'near':'miss',prize:pz2,over};
}
// 길 위 자리(시간 u초): 첫 낙하 0.45초, 튐마다 0.38·0.3·0.24초, 구르기 0.35초씩
function pathAt(p,u){const D=[.45,.38,.3,.24,.35,.35];let t=u;
 if(t<D[0])return {x:p.pts[0].x,z:p.pts[0].z,h:.09*(1-(t/D[0])**2)};t-=D[0];
 for(let k=1;k<p.pts.length;k++){const d=D[k]??.35,a=p.pts[k-1],b=p.pts[k];if(t<d){const f=t/d,hh=b.roll?0:(.05/k)*4*f*(1-f);return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,h:hh};}t-=d;}
 const e=p.pts.at(-1);return {x:e.x,z:e.z,h:0,done:true,a:Math.max(0,1-t/.3)};}
function act(extra){spect.send({m:19,n:S.n,...extra});}
const enc=v=>Math.round(v*100)+50;
function start(){
 if(G.coins<1){hud.toast('코인이 없어요 · 내일 0시에 30개');return;}
 G.coins--;G.plays++;const pity=G.fails>=BC.pityAfter;
 S={mode:'ready',t0:now(),x:-.11+.025,z:-.11+.025,pity,n:S.n+1};
 hud.walk(false);hud.quit(true);hud.pad(true);spect.reset();act({ph:'play',cx:enc(S.x),cz:enc(S.z),k:0});
 hud.toast(pity?'직원 도움! 초록 구멍이 하나 더 열렸어요':'공을 집었어요',2.4);
}
function drop(t){if(S.mode!=='play')return;S.mode='drop';S.dropT=now();S.path=planPath(S.x,S.z,S.pity);hud.pad(false);act({ph:'drop',cx:enc(S.x),cz:enc(S.z)});}
async function result(){
 S.mode='result';hud.bar(null);hud.hint(null);hud.chip(null);hud.quit(false);
 const p=S.path,P=p.prize?PZ[p.prize]:null;let html;
 if(p.kind==='win'){G.fails=0;G.dex[P.id]=(G.dex[P.id]??0)+1;html=resultCard({kind:'win',title:`쏙! ${P.name}`,big:P.em,band:P.band,lines:[p.key===BC.pity?'초록 도움 구멍에 들어갔어요':'색 구멍에 들어갔어요'],carry:'✋ 손에 들고 다니기'});}
 else{G.fails++;const left=BC.pityAfter-G.fails;html=resultCard({kind:p.kind,title:p.over?'아까워요! 작은 구멍 위를 굴러 지나갔어요':p.kind==='near'?'아까워요! 색 구멍 바로 옆이에요':'아쉬워요, 빈 구멍이에요',
  lines:['공이 들어간 구멍을 판에 동그라미로 표시했어요'],pity:left<=0?'다음 판은 직원 도움 — 초록 구멍을 열어 줘요!':`직원 도움까지 ${left}번`});}
 if(demo)setTimeout(()=>document.querySelector('.h-card [data-c=again]')?.click(),1600);
 const r=await hud.card(html);
 if(r==='again')start();else{S={mode:'front',n:S.n};front();if(r==='carry')hud.toast(`${P.name}를 손에 들었어요`,2.4);}
}
function front(){hud.bar(null);hud.hint(null);hud.chip(null);hud.quit(false);hud.pad(false);hud.walk(true,[{id:'play',label:'🏓 공 떨어뜨리기 한 판 · 🪙1',main:true},{id:'rules',label:'ⓘ 규칙'}]);}
hud.on({
 down(t){if(S.mode==='play')drop(t);},
 todo(id){if(id==='rules'){hud.card(rulesCard({...RULES,first:false}));return;}
  if(!G.seen){G.seen=true;hud.card(rulesCard({...RULES,first:true})).then(c=>{if(c==='go')start();});return;}start();},
 async quit(){const c=await hud.card('<h3>그만둘까요?</h3><p>넣은 코인은 돌려받지 못해요</p><div class="row"><button class="btn" data-c="q">그만두기</button><button class="btn red" data-c="k">계속하기</button></div>');
  if(c==='q'){G.fails++;S={mode:'front',n:S.n};act({ph:''});front();}},
});
front();
// ── 구경 화면: 집게 자리(cx,cz)·놓은 자리·들어간 구멍(v = j×4+i)·결과(k)만 받음 → 받은 구멍에서 끝나는 튐 길을 받는 쪽이 만들어 그림
const spect=makeSpect($('#spect'),(c,w,h,a,hist,t)=>{
 c.clearRect(0,0,w,h);c.fillStyle='#1b1428';c.fillRect(0,0,w,h);
 const dec=v=>(v-50)/100;let ball=null,mark=null;
 if(a.k&&a.v!=null){if(!spect.p||spect.pn!==a.n){spect.p=planPath(dec(a.cx),dec(a.cz),false,[a.v%4,Math.floor(a.v/4)]);spect.pn=a.n;spect.pt=t;}
  const q=pathAt(spect.p,(t-spect.pt)/1000);ball=q;if(q.done)mark={key:`${a.v%4},${Math.floor(a.v/4)}`,kind:a.k===1?'win':a.k===2?'near':'miss'};}
 else spect.p=null;
 drawBall(c,{claw:a.ph==='play'?{x:dec(a.cx),z:dec(a.cz),has:1}:null,ball,mark,t,s:.42,ox:68,oy:-50,labels:false});
 c.fillStyle='#e9b44c';c.beginPath();c.ellipse(52,h-8,30,36,0,Math.PI,0);c.fill();c.fillStyle='#6b4b2a';c.beginPath();c.ellipse(52,h-33,27,9,0,0,7);c.fill();
 c.fillStyle='#fff';c.font='700 11px sans-serif';c.textAlign='center';c.fillText('뽑기손님12',262,90);
 const say=a.k?(a.k===1?'쏙! 🎉':a.k===2?'아까워!':'아쉬움'):'';
 if(say&&mark){c.font='800 12px sans-serif';const tw=c.measureText(say).width+16;rr(c,262-tw/2,52,tw,20,9);c.fillStyle=a.k===3?'#ddd':'#ffd36b';c.fill();c.fillStyle='#3a2b22';c.fillText(say,262,66);}
 $('#spect-act').textContent=a.m?JSON.stringify({m:a.m,ph:a.ph,cx:a.cx,cz:a.cz,v:a.v,k:a.k,r:a.r,n:a.n}):'(아직 없음 — 왼쪽에서 한 판 해 보세요)';
});
let last=now(),sendT=0;
function frame(t){
 const dt=Math.min(.05,(t-last)/1000);last=t;hud.tick(dt);const s=S;
 if(s.mode==='ready'&&t-s.t0>BC.readySec*1000){s.mode='play';s.pt0=t;}
 if(s.mode==='play'){
  let [dx,dz]=hud.padDir();
  if(demo){const [tx,tz]=cellC(1,1);if(!s.aim)s.aim={x:tx+gauss()*.008,z:tz+gauss()*.008};dx=Math.abs(s.aim.x-s.x)>.002?Math.sign(s.aim.x-s.x):0;dz=Math.abs(s.aim.z-s.z)>.002?Math.sign(s.aim.z-s.z):0;if(!dx&&!dz&&t-s.pt0>1500)drop(t);}
  const lim=half-BC.ball;s.x=Math.max(-lim,Math.min(lim,s.x+dx*BC.speed*dt));s.z=Math.max(-lim,Math.min(lim,s.z+dz*BC.speed*dt));
  if((dx||dz)&&t-sendT>125){sendT=t;act({ph:'play',cx:enc(s.x),cz:enc(s.z)});} // 움직이는 동안만 초당 8번(기존 act 한도)
  if(t-s.pt0>BC.timeSec*1000){hud.toast('시간이 다 돼서 공을 놓았어요');drop(t);}
 }
 if(s.mode==='drop'){const q=pathAt(s.path,(t-s.dropT)/1000);s.ball=q;
  if(q.done&&!s.sent){s.sent=1;const [i,j]=s.path.cell;act({ph:'drop',cx:enc(s.x),cz:enc(s.z),v:j*4+i,k:s.path.kind==='win'?1:s.path.kind==='near'?2:3,r:s.path.prize?PZ[s.path.prize].id:''});s.endAt=t+(s.path.kind==='win'?1100:500);}
  if(s.endAt&&t>=s.endAt){s.endAt=0;result();}}
 if(['ready','play','drop'].includes(s.mode)){
  hud.pill(`🏓 공 떨어뜨리기 · 🪙 <b>${G.coins}</b>`);
  const left=s.mode==='play'?Math.max(0,BC.timeSec-(t-s.pt0)/1000):BC.timeSec;
  hud.chip(s.mode==='play'?`⏱ ${Math.ceil(left)}초 · 그림자 점을 노란 구멍 위로`:`⏱ ${Math.ceil(left)}초`);
  hud.bar({ic:'🏓',label:s.mode==='drop'?'굴러가요…':'떨어뜨리기',half:true,dim:s.mode!=='play',ring:left/BC.timeSec});
  hud.hint(null); // 한 줄 안내는 십자 판과 겹쳐 위 칩에 합침(집게 기계는 판 위 256px에 둠)
 }else if(s.mode==='front')hud.pill(`👤 인형가게 1서버 · 🪙 <b>${G.coins}</b>`);
 cx.clearRect(0,0,390,844);
 const done=s.mode==='result'||s.ball?.done;
 drawBall(cx,{claw:['ready','play'].includes(s.mode)?{x:s.x,z:s.z,has:1}:s.mode==='drop'?{x:s.x,z:s.z}:null,ball:s.mode==='drop'||s.mode==='result'?s.ball:null,pity:s.pity,t,
  mark:done&&s.path?{key:s.path.key,kind:s.path.kind}:null,out:done&&s.path?.kind==='win'?PZ[s.path.prize].em:''});
 spect.frame(t);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
$('#demo').onclick=e=>{demo=!demo;e.target.setAttribute('aria-pressed',demo);if(demo&&S.mode==='front'){G.seen=true;start();}};
$('#pity').onclick=()=>{G.fails=BC.pityAfter;hud.toast('연속 실패 5번으로 맞춤 · 다음 판이 도움 판');};
$('#coins').onclick=()=>{G.coins=30;};
