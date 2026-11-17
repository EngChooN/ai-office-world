// 눈싸움 「한 판」 화면(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §2-3·§2-4·§2-5). 규칙은 fight-match.js(서버·혼자 공용), 던지기·조준은 snowfight-play.js.
//  - 마당 안: 「한 판 하기」 단추 → 대기(2명 이상이면 15초, 연 사람은 「바로 시작」) · 혼자면 「눈사람 과녁 연습」(움직이는 과녁 5개, 60초, 이 화면에서만).
//  - 위 경기 띠(게임 틀 game-ui.js): 가운데 남은 시간(마지막 10초 빨강·째깍), 양옆 팀 점수, 라운드 점 ●●○. 띠 옆 「나가기」(휴대폰 56px, 확인 한 번 · PC Q 길게 1초).
//  - 라운드 시작 때 내 진영 끝(마당 가장자리 1m 안)으로 옮김(라운드마다 진영 바꿈). 팀 색은 발밑 둥근 빛(빨강·초록) — 장갑·목도리 색은 월드아트 몫(후속).
//  - 끝: 「그만!」 1초 → 결과 창(이긴 팀 색 띠·라운드·개인 표·칭호 3개) · 「한 판 더」(E) · 「마당 나가기」(Q) · 10초 아무것도 안 누르면 닫힘.
//  - 경기 중에는 💬 단추를 접는다(html.xf-match).
import * as THREE from 'three';
import * as P from './props.js';
import {SNOWBALL_YARD} from './layout.js';
import {MATCH} from './fight-match.js';
import {FIGHT,inFightYard,resolveThrow} from './snowfight.js';
import {icon,iconText} from '../icons/icon.js';
import {createCountdown,createTopBar,createResultCard,fmtTime,esc} from './game-ui.js';

export const TEAM=Object.freeze({1:{name:'빨강',color:'#d8453b'},2:{name:'초록',color:'#2f9a5a'}});
export const PRACTICE=Object.freeze({secs:60,targets:5});
const Y=SNOWBALL_YARD;
// 라운드 rd에서 팀 k의 출발 자리(마당 가장자리 1m 안, 같은 팀은 세로로 흩어짐). 홀수 라운드: 빨강 서쪽·초록 동쪽, 짝수 라운드는 바꿈
export function sideSpot(k,rd,i=0,n=1){const west=(k===1)===(rd%2===1),x=Y.x+(west?-1:1)*(Y.w/2-1),span=Y.d-3,z=Y.z-span/2+span*((i+.5)/Math.max(1,n));return {x,z,heading:west?-Math.PI/2:Math.PI/2};}

export function createFightUi({doc=document,root,world,toon,heightAt,player,net,multi,hud,audio,snowfight,mobile=false,onChange=()=>{}}){
 const tz=toon.toonify;
 const S={m:null,lastPh:'none',lastRd:0,lastSec:-1,practice:null,leaveHold:0,stopT:0};
 const ui=doc.createElement('div');ui.className='xfm';ui.innerHTML=`
<button type="button" class="xfm-join" hidden>${iconText('x-snowball','한 판 하기')}</button>
<div class="xfm-wait" hidden><p></p><div class="xh-row"><button type="button" class="xh-ok" data-x="go" hidden>바로 시작</button><button type="button" class="xh-mini" data-x="solo" hidden>${iconText('x-target','혼자 과녁 연습')}</button><button type="button" class="xh-no" data-x="leave">나가기</button></div></div>
<button type="button" class="xfm-leave" hidden aria-label="경기 나가기 (Q 길게)">${icon('c-leave',{size:'m'})}<span>나가기</span></button>
<section class="xl-confirm xfm-confirm" hidden role="dialog" aria-label="경기 나가기"><p>경기에서 나갈까요?</p><div class="xh-row"><button type="button" class="xh-ok" data-x="leave-yes">나가기</button><button type="button" class="xh-no" data-x="leave-no">계속하기</button></div></section>`;
 root.appendChild(ui);
 const $=s=>ui.querySelector(s);
 const joinBtn=$('.xfm-join'),waitEl=$('.xfm-wait'),leaveBtn=$('.xfm-leave'),confirmEl=$('.xfm-confirm');
 const count=createCountdown(ui,doc),bar=createTopBar(ui,doc),card=createResultCard(ui,{doc,onPick:id=>pick(id)});
 const meId=()=>multi.id??'me';
 const inMatch=()=>!!S.m&&S.m.ph!=='none'&&!!S.m.tm?.[meId()];
 joinBtn.addEventListener('click',()=>join());
 ui.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;
  switch(b.dataset.x){case 'go':net.send({t:'sbm:go'});return;case 'solo':leaveMatch(true);startPractice();return;case 'leave':leaveMatch();return;
   case 'leave-yes':confirmEl.hidden=true;leaveMatch();return;case 'leave-no':confirmEl.hidden=true;return;}});
 leaveBtn.addEventListener('click',()=>{if(mobile)confirmEl.hidden=false;else leaveMatch();});
 function join(){if(S.practice)return false;if(!inFightYard(player.x,player.z,-.3)){hud?.say('눈싸움 마당 안에서 시작해요',1.6);return false;}
  // 혼자 둘러보기(다른 사람 없음)면 바로 과녁 연습
  if(!multi.joined||!multi.people().some(p=>!p.muted)){startPractice();return true;}
  if(!net.send({t:'sbm:join'})){hud?.say('연결이 돌아오면 다시 눌러 주세요',2);return false;}return true;}
 function leaveMatch(silent=false){if(S.practice){endPractice(true);return;}if(inMatch())net.send({t:'sbm:leave'});card.close();if(!silent)hud?.say('경기에서 나왔어요 · 그냥 던지기는 계속돼요',1.8);}
 function pick(id){if(id==='again'){if(S.practice||S.wasPractice){card.close();startPractice();return;}net.send({t:'sbm:join'});card.close();return;}if(id==='out'){card.close();if(inMatch())net.send({t:'sbm:leave'});const sp={x:Y.x+Y.w/2+1.6,z:Y.z};player.place(sp.x,sp.z,Math.PI/2);return;}}
 // ── 팀 색 발밑 빛(나·다른 사람)
 const rings=new Map();
 function ringFor(id,k){let r=rings.get(id);if(!r){r=new THREE.Mesh(new THREE.RingGeometry(.3,.46,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({transparent:true,opacity:.85,depthWrite:false}));r.renderOrder=4;world.add(r);rings.set(id,r);}
  r.material.color.set(TEAM[k].color);return r;}
 function updateRings(){const seen=new Set(),tm=S.m?.tm??{};
  if(S.m&&S.m.ph!=='none'&&S.m.ph!=='result')for(const [id,k] of Object.entries(tm)){const p=id===meId()?player:multi.sampleOf(id);if(!p||multi.isMuted?.(id))continue;seen.add(id);const r=ringFor(id,k);r.position.set(p.x,heightAt(p.x,p.z)+.03,p.z);r.visible=true;}
  for(const [id,r] of rings)if(!seen.has(id)){world.remove(r);rings.delete(id);}}
 // ── 받기
 net.on(m=>{if(m.t==='sbm:no'){const t={busy:'지금 경기가 진행 중이에요 · 끝나면 들어갈 수 있어요',full:'경기 자리가 꽉 찼어요(10명)'}[m.reason];if(t)hud?.say(t,2);return;}
  if(m.t!=='sbm')return;receive(m);});
 function receive(m){
  m._at=performance.now();const prev=S.m;S.m=m.ph==='none'?null:m;const mine=inMatch();
  if(!mine){if(prev&&prev.tm?.[meId()]&&m.ph==='result')showResult(m);onChange();return;}
  // 라운드 시작: 내 진영으로
  if(m.ph==='round'&&m.rd!==S.lastRd){S.lastRd=m.rd;const k=m.tm[meId()],same=Object.entries(m.tm).filter(([,v])=>v===k).map(([id])=>id).sort(),i=same.indexOf(meId());
   const sp=sideSpot(k,m.rd,i,same.length);player.place(sp.x,sp.z,sp.heading);count.show(`${m.rd}라운드`);setTimeout(()=>count.hide(),1100);audio?.play('go');snowfight.resetAmmo?.();}
  if(m.ph==='stop'&&S.lastPh!=='stop'){count.show('그만!');setTimeout(()=>count.hide(),1000);audio?.play('beep');}
  if(m.ph==='result'&&S.lastPh!=='result'){S.lastRd=0;setTimeout(()=>showResult(m),S.lastPh==='stop'?0:1000);}
  if(m.ph==='wait'&&S.lastPh!=='wait'){S.lastRd=0;card.close();hud?.say(`한 판 대기 · ${TEAM[m.tm[meId()]].name} 팀이에요`,2.2,'x-snowball');}
  S.lastPh=m.ph;onChange();
 }
 function showResult(m){const r=m.res;if(!r)return;const me=meId(),win=r.win;
  const nm=id=>esc(r.ppl.find(p=>p.id===id)?.n??'');
  const titles=[['ace','명사수','맞힘 최다'],['snow','눈사람','가장 많이 맞음'],['snipe','저격수','가장 먼 명중']].filter(([k])=>r.titles[k]).map(([k,t,d])=>`<li><b>${t}</b><span>${nm(r.titles[k])}</span><em>${d}${k==='snipe'?` ${r.ppl.find(p=>p.id===r.titles[k]).far}m`:''}</em></li>`).join('');
  const rows=r.ppl.slice().sort((a,b)=>a.tm-b.tm||b.hits-a.hits).map(p=>`<li class="${p.id===me?'me':''}"><i class="tm" style="--tm:${TEAM[p.tm]?.color??'#999'}"></i><span>${esc(p.n)}${p.left?' (나감)':''}</span><em>맞힘 ${p.hits} · 머리 ${p.heads} · 맞음 ${p.hitBy}</em></li>`).join('');
  const rr=r.rr.map((w,i)=>`<i class="rd" style="--tm:${w?TEAM[w].color:'#bbb'}" title="${i+1}라운드">${w?TEAM[w].name:'무'}</i>`).join('');
  card.show({title:win?`${TEAM[win].name} 팀 승리!`:'무승부!',ic:'x-trophy',ribbon:win?TEAM[win].color:'#b49563',
   body:`<p class="xfm-score"><b style="color:${TEAM[1].color}">${r.wins[0]}</b> : <b style="color:${TEAM[2].color}">${r.wins[1]}</b></p><p class="xfm-rr">${rr}</p><ul class="xfm-titles">${titles}</ul><ol class="xg-rows xfm-rows">${rows}</ol>`,
   buttons:[{id:'again',label:'한 판 더',ic:'x-snowball',key:'E',primary:true},{id:'out',label:'마당 나가기',ic:'c-leave',key:'Q'}],idle:10,onIdle:()=>{}});
  if(win&&r.ppl.find(p=>p.id===me)?.tm===win)audio?.play('done');}
 // ── 혼자 과녁 연습: 움직이는 눈사람 과녁 5개, 60초(이 화면에서만 판정)
 function startPractice(){if(S.practice)return;card.close();S.wasPractice=true;
  const targets=Array.from({length:PRACTICE.targets},(_,i)=>{const g=P.buildSnowman(tz,{sizes:[.34,.25,.18],parts:['eyes','nose','hat'],seed:i+3});world.add(g);
   return {id:`t${i}`,g,ph:i*1.3,cx:Y.x+(i-2)*2.1,cz:Y.z+((i%2)?-3:3),ax:1.4+(i%3)*.5,az:2+(i%2),sp:.5+i*.12,down:0,x:0,z:0,h:1.05};});
  S.practice={t:PRACTICE.secs,score:0,hits:0,targets};
  snowfight.extraTargets=()=>S.practice?S.practice.targets.filter(t=>t.down<=0).map(t=>({id:t.id,x:t.x,z:t.z,h:t.h})):[];
  snowfight.localThrow=m=>{const list=snowfight.extraTargetsList?.()??S.practice.targets.filter(t=>t.down<=0).map(t=>({id:t.id,x:t.x,z:t.z}));
   const r=resolveThrow({x:m.x,z:m.z,dx:m.dx,dz:m.dz,dist:m.d},list),pts=r.hit?(r.head?MATCH.head:MATCH.hit):0;
   snowfight.receiveBall({t:'sb',id:meId(),x:r.x,z:r.z,tx:r.tx,tz:r.tz,d0:r.d0,ms:r.ms,hit:r.hit,...(r.head?{head:1}:{}),...(pts?{pts}:{})});
   if(r.hit){const tg=S.practice.targets.find(t=>t.id===r.hit);setTimeout(()=>{if(!S.practice)return;tg.down=1.5;S.practice.score+=pts;S.practice.hits++;},r.ms);}};
  document.documentElement.classList.add('xf-match');hud?.say('눈사람 과녁 연습 · 60초 동안 많이 맞혀 보세요',2.4,'x-target');audio?.play('go');onChange();}
 function endPractice(quit=false){const p=S.practice;if(!p)return;for(const t of p.targets)world.remove(t.g);S.practice=null;snowfight.extraTargets=null;snowfight.localThrow=null;
  document.documentElement.classList.remove('xf-match');bar.hide();
  if(!quit){count.show('그만!');setTimeout(()=>count.hide(),1000);
   card.show({title:'과녁 연습 끝!',ic:'x-target',ribbon:'#2f7a52',body:`<p class="xg-time">${p.score}점</p><p class="xh-sub">과녁 ${p.hits}개 맞힘 · 머리 맞힘은 2점</p>`,
    buttons:[{id:'again',label:'한 번 더',ic:'x-target',key:'E',primary:true},{id:'out',label:'마당 나가기',ic:'c-leave',key:'Q'}],idle:10});}
  onChange();}
 // Q 길게 1초 = 경기 나가기(PC)
 addEventListener('keydown',e=>{if(e.code==='KeyQ'&&!e.repeat&&(inMatch()||S.practice)&&!card.open)S.leaveHold=.001;});
 addEventListener('keyup',e=>{if(e.code==='KeyQ')S.leaveHold=0;});
 return {
  get match(){return S.m;},get practicing(){return !!S.practice;},get inMatch(){return inMatch()||!!S.practice;},get resultOpen(){return card.open;},
  actFields(){return {tm:inMatch()&&S.m.ph!=='result'?S.m.tm[meId()]:0};},
  join,startPractice,leave:leaveMatch,
  key(k){if(!card.open)return false;if(k==='E'){pick('again');return true;}if(k==='Q'){pick('out');return true;}return false;},
  update(dt){
   bar.update(dt);card.update(dt);updateRings();
   if(S.leaveHold>0){S.leaveHold+=dt;if(S.leaveHold>=1){S.leaveHold=0;leaveMatch();}}
   const inYard=snowfight.inYard,m=S.m,mine=inMatch();
   // 과녁 연습
   if(S.practice){const p=S.practice;p.t-=dt;
    for(const t of p.targets){t.ph+=dt*t.sp;if(t.down>0){t.down-=dt;t.g.visible=t.down<=0;}t.x=t.cx+Math.sin(t.ph)*t.ax;t.z=t.cz+Math.sin(t.ph*.7+1)*t.az;t.g.position.set(t.x,heightAt(t.x,t.z),t.z);t.g.rotation.y=t.ph;}
    const sec=Math.ceil(p.t);if(sec<=10&&sec!==S.lastSec&&sec>0){S.lastSec=sec;audio?.play('tick');}
    bar.set({left:iconText('x-target',`${p.score}점`,{size:'xs'}),center:fmtTime(Math.max(0,p.t)).replace(/\.\d+$/,''),right:'과녁 연습',cls:`match${p.t<=10?' late':''}`});
    if(p.t<=0||!inYard)endPractice(!inYard);}
   // 경기 띠
   else if(mine&&m.ph!=='result'){
    const left=Math.max(0,(m.left??0)/1000-(performance.now()-(m._at??(m._at=performance.now())))/1000);
    if(m.ph==='wait'){waitEl.hidden=false;const n=Object.keys(m.tm).length;
     waitEl.querySelector('p').innerHTML=m.left<0?`다른 사람을 기다리는 중 · ${n}명 <small>(2명부터 시작)</small>`:`곧 시작 · ${Math.ceil(left)}초 · ${n}명`;
     waitEl.querySelector('[data-x=go]').hidden=!(m.host===meId()&&n>=MATCH.min);waitEl.querySelector('[data-x=solo]').hidden=n>1;bar.hide();}
    else{waitEl.hidden=true;
     const sec=Math.ceil(left);if(m.ph==='round'&&sec<=10&&sec!==S.lastSec&&sec>0){S.lastSec=sec;audio?.play('tick');}
     const dots=[0,1,2].map(i=>`<i class="rd${i<m.rr.length?' done':''}" style="--tm:${m.rr[i]?TEAM[m.rr[i]].color:i<m.rr.length?'#bbb':'transparent'}"></i>`).join('');
     const center=m.ph==='break'?`쉬는 시간 ${sec}`:m.ph==='stop'?'그만!':fmtTime(left).replace(/\.\d+$/,'');
     bar.set({left:`<i class="tmdot" style="--tm:${TEAM[1].color}"></i><b>${m.sc[0]}</b>`,center:`${center}<span class="xfm-dots">${dots}</span>`,right:`<b>${m.sc[1]}</b><i class="tmdot" style="--tm:${TEAM[2].color}"></i>`,cls:`match${m.ph==='round'&&left<=10?' late':''}`});}
    leaveBtn.hidden=false;}
   else{waitEl.hidden=true;if(!S.practice)bar.hide();leaveBtn.hidden=!S.practice;}
   if(S.practice)leaveBtn.hidden=false;
   // 「한 판 하기」: 마당 안, 경기·연습 중이 아닐 때. 다른 경기가 진행 중이면 흐리게
   const busy=m&&!mine&&m.ph!=='wait'&&m.ph!=='result';
   joinBtn.hidden=!inYard||mine||!!S.practice||card.open;joinBtn.classList.toggle('dim',!!busy);
   if(!joinBtn.hidden){const n=m&&m.ph==='wait'?Object.keys(m.tm).length:0;joinBtn.innerHTML=iconText('x-snowball',busy?'경기 진행 중':n?`한 판 하기 · ${n}명 대기`:'한 판 하기');}
   document.documentElement.classList.toggle('xf-match',(mine&&m.ph!=='result')||!!S.practice);
  },
  status(){return {match:S.m?{ph:S.m.ph,rd:S.m.rd,sc:S.m.sc,wins:S.m.wins,n:Object.keys(S.m.tm??{}).length,team:S.m.tm?.[meId()]??0}:null,practice:S.practice?{t:+S.practice.t.toFixed(1),score:S.practice.score,targets:S.practice.targets.filter(t=>t.down<=0).map(t=>({x:+t.x.toFixed(2),z:+t.z.toFixed(2)}))}:null,result:card.open};},
 };
}
