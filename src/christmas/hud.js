// 온라인 크리스마스 화면(월드개발, 2026-11-16). 체험설계 v1 §2-2·§3-4·§4·§5-1·§6·§8을 따른다. 모양은 hud.css(등산 수첩 종이 톤, 단추 44px 이상, 안전 영역 안).
//  - 위 가운데: 장소·연결 칩(`🎄 눈마을 광장 1서버 · 👥 12/20`, 혼자면 `⛄ 혼자 둘러보기`) → 누르면 광장 사람 목록(음소거·신고·서버 바꾸기)
//  - 그 아래: 트리 진행 `🎄 47/120` 막대(별이 달리면 ⭐)
//  - 위 오른쪽: 👕 옷 고르기(산타·니트·엘프 + 모자), 선물로 받은 옷은 이 기기에 남은 것만 보인다
//  - 오른쪽 아래: 행동 단추 줄(체험설계 §4-2, 11-16 2차): 큰 단추 1개 + 보조 최대 2개. 내용은 main.js가 상황마다 setActions로 준다
//    (트리 옆 🎄 장식 달기·우체통 🎁·모닥불 🔥/🙌·눈사람 마당 ⛄/⬆/🎨·눈싸움 ❄️/🤲·썰매 🛷/⬆). 휴대폰 ❄️는 길게 누르고 끌면 조준(act.aim).
//  - 위 오른쪽: 📬 받은 선물(숫자)·🔊 소리·🎵 캐럴(지금 곡·캐럴 켜기/끄기·「소리 출처」)·👕 옷. 구역에 들어가면 위 가운데 아래에 구역 이름 띠(1.5초, 처음은 규칙 한 줄과 4초)
//  - 장식 달기 모드: 아래 장식 8종(휴대폰 4×2)·남은 개수·되돌리기·별 달기·그만하기(✕/Esc). 휴대폰은 자리를 고른 뒤 [달기][취소]
//  - 다른 사람 이름표(누르면 사람 카드: 🔇 음소거·🚩 신고), 알림
// main.js와는 콜백(act)과 update(dt,view)로만 만난다. 채팅 창은 공용 src/hiking-chat-ui.js(ns 'xmas')를 main.js가 설치한다.
import './hud.css';
import '../ui-frame.css';   // 11-18 공통 화면 틀
import '../icons/icons.css';   // 아이콘 공통 모양(아이콘-규칙-v1)
document.documentElement.dataset.icExp='christmas';
import {xmasStatusView} from './multi.js';
import {ORNAMENTS,TREE_RULES} from './tree-state.js';
import {XMAS_OUTFITS,XMAS_HATS} from './outfits.js';
import {CAROLS} from './carols.js';
import {icon,iconText} from '../icons/icon.js';
import {createUiFrame,ufPlace,openWin,closeWin,onWin} from '../ui-frame.js';

// 장식·옷·모자 고르기 칸 아이콘 이름(아이콘-규칙-v1 §7-4)
const ORN_IC={ballRed:'x-orn-red',ballGold:'x-orn-yellow',ballBlue:'x-orn-blue',ballSilver:'x-orn-white',candy:'x-orn-candy',bell:'x-orn-bell',snowflake:'x-orn-snow',gift:'x-orn-gift'};
const OUTFIT_IC={santa:'x-outfit-santa',sweater:'x-outfit-knit',elf:'x-outfit-elf'};
const HAT_IC={'':'x-hat-auto',santa:'x-hat-santa',antlers:'x-hat-reindeer',beanie:'x-hat-cap',elf:'x-hat-elf',none:'x-hat-none'};
export const ORN_LABEL=Object.freeze({ballRed:'빨간 공',ballGold:'금빛 공',ballBlue:'파란 공',ballSilver:'은빛 공',candy:'지팡이 사탕',bell:'종',snowflake:'눈송이',gift:'작은 선물상자'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 남은 개수 글(체험설계 §5-1 "이번 1분 3개 남음")
export function quotaText(q){
 if(q.left>0)return `이번 1분 ${q.left}개 남음`;
 if(q.mine>=TREE_RULES.perPerson)return `내 장식 ${TREE_RULES.perPerson}개를 다 달았어요`;
 return q.wait?`${q.wait}초 뒤에 또 달 수 있어요`:'잠시 뒤에 또 달 수 있어요';
}

export function createXmasHud({doc=document,win=window,multi,treePlay,mobile=false,look,wardrobe=()=>[],act={},project}){
 const root=doc.createElement('div');root.className='xh';root.classList.toggle('touch',mobile);
 root.innerHTML=`
<div class="xh-tags"></div>
<div class="xh-top">
 <button type="button" class="xh-place" data-x="place" aria-haspopup="dialog"><em aria-hidden="true">${icon('c-person',{size:'s'})}</em><span>혼자 둘러보기</span></button>
 <div class="xh-tree" role="status" aria-label="트리 장식 수"><b class="ic-row">${icon('x-tree',{size:'xs'})}<span class="ic-num"><span data-tree-n>0</span>/${TREE_RULES.slots}</span></b><i class="xh-bar" aria-hidden="true"><i></i></i><span class="xh-star" hidden>${icon('x-star',{size:'s'})}</span></div>
</div>
<div class="xh-tr"><button type="button" class="xh-round" data-x="inbox" aria-label="받은 선물">${icon('x-mailbox',{size:'m'})}<b class="xh-badge" hidden>0</b></button><button type="button" class="xh-round" data-x="sound" aria-label="소리 끄기" aria-pressed="false">${icon('c-sound',{size:'m'})}</button><button type="button" class="xh-round" data-x="music" aria-label="캐럴과 소리 출처" aria-haspopup="dialog">${icon('c-music',{size:'m'})}</button><button type="button" class="xh-round" data-x="outfit" aria-label="옷 고르기">${icon('x-outfit',{size:'m'})}</button></div>
<div class="xh-zone" hidden role="status"><b></b><span></span></div>
<div class="xh-acts"></div>
<section class="xh-deco" hidden aria-label="장식 달기">
 <header><b>${iconText('x-tree','장식 달기')}</b><span class="xh-quota"></span><button type="button" class="xh-x" data-x="deco-close" aria-label="장식 달기 그만하기">✕</button></header>
 <p class="xh-hint">${mobile?'장식을 고르고 트리의 빈 자리(점)를 누르세요':'장식을 고르고 트리의 빈 자리(점)를 누르세요 · A/D 돌기 · W/S 위아래'}</p>
 <div class="xh-kinds">${ORNAMENTS.map((k,i)=>`<button type="button" class="xh-kind" data-kind="${k}" aria-pressed="${i===0}"><em aria-hidden="true">${icon(ORN_IC[k],{size:'xl'})}</em><span>${esc(ORN_LABEL[k])}</span></button>`).join('')}</div>
 <div class="xh-confirm" hidden><span>이 자리에 달까요?</span><button type="button" class="xh-ok" data-x="confirm">달기</button><button type="button" class="xh-no" data-x="cancel">취소</button></div>
 <div class="xh-row"><button type="button" class="xh-mini" data-x="undo" hidden>${iconText('c-undo','되돌리기')}</button><button type="button" class="xh-mini xh-gold" data-x="star" hidden>${iconText('x-star','꼭대기 별 달기')}</button></div>
</section>
<div class="xh-toast" role="status" hidden></div>
<section class="xh-sheet" data-sheet="people" hidden role="dialog" aria-label="광장 사람">
 <header><b data-people-title>${iconText('c-people','광장 사람')}</b><button type="button" class="xh-x" data-x="sheet-close" aria-label="닫기">✕</button></header>
 <p class="xh-sub" data-people-sub></p>
 <div class="xh-srv"><button type="button" class="xh-mini" data-x="servers">${iconText('c-server-list','서버 고르기')}</button><button type="button" class="xh-mini" data-x="retry" hidden>${iconText('c-net-retry','다시 연결')}</button></div>
 <ul class="xh-list" data-people-list></ul>
 <details class="xh-muted"><summary>${icon('c-mute-person',{size:'s'})} 음소거한 사람 <span data-muted-n>0</span></summary><ul data-muted-list></ul></details>
</section>
<section class="xh-sheet" data-sheet="outfit" hidden role="dialog" aria-label="옷 고르기">
 <header><b>${iconText('x-outfit','크리스마스 옷')}</b><button type="button" class="xh-x" data-x="sheet-close" aria-label="닫기">✕</button></header>
 <div class="xh-grid" data-outfits></div>
 <p class="xh-sub">머리</p>
 <div class="xh-grid" data-hats></div>
 <p class="xh-sub" data-wardrobe-note>선물로 받은 모자·목도리는 이 기기에 남아요</p>
</section>
<section class="xh-sheet" data-sheet="music" hidden role="dialog" aria-label="캐럴과 소리 출처">
 <header><b>${iconText('c-music','캐럴')}</b><button type="button" class="xh-x" data-x="sheet-close" aria-label="닫기">✕</button></header>
 <p class="xh-now" data-carol-now>♪ 소리를 켜면 캐럴이 나와요</p>
 <div class="xh-row"><button type="button" class="xh-mini" data-x="carol" aria-pressed="true">${iconText('c-music','캐럴 켜짐')}</button></div>
 <p class="xh-sub">${icon('c-sound',{size:'xs'})} 소리를 끄면 캐럴도 같이 꺼져요. 광장 사람 모두 같은 곡을 들어요.</p>
 <p class="xh-sub"><b>소리 출처</b></p>
 <ul class="xh-credits" data-credits>${CAROLS.map(c=>`<li><b>${esc(c.title)}</b><span>연주: ${esc(c.performer)}</span><span>편곡: ${esc(c.arranger)} · 작곡: ${esc(c.composer)}</span><span>퍼블릭 도메인(미국 연방 정부 저작물) · <a href="${esc(c.page)}" target="_blank" rel="noopener noreferrer">원래 페이지</a></span></li>`).join('')}
  <li><b>바람 소리</b><span>wind-forest-loop · Thimras(OpenGameArt) · CC0</span></li>
  <li><b>모닥불·썰매·효과음</b><span>이 게임에서 직접 만든 소리</span></li></ul>
 <p class="xh-sub">캐럴은 미 공군 군악대 녹음이에요. 미 공군이 이 게임을 후원하거나 보증하지는 않아요.</p>
</section>
<section class="xh-card" hidden role="dialog" aria-label="사람 카드">
 <header><b data-card-name></b><button type="button" class="xh-x" data-x="card-close" aria-label="닫기">✕</button></header>
 <div class="xh-row"><button type="button" class="xh-mini" data-x="gift">${iconText('x-gift','선물 보내기')}</button><button type="button" class="xh-mini" data-x="mute">${iconText('c-mute-person','음소거')}</button><button type="button" class="xh-mini" data-x="report">${iconText('c-report','신고')}</button></div>
 <p class="xh-sub">음소거하면 이 사람의 모습·말이 내 화면에서 사라져요. 상대에게는 알리지 않아요.</p>
</section>`;
 doc.body.appendChild(root);
 let frame=null; // 옮긴 창(옷·캐럴·사람)은 틀의 메뉴 창 안에 있으니 둘 다 찾는다
 const $=s=>root.querySelector(s)??frame?.sheet.querySelector(s)??null,$$=s=>[...root.querySelectorAll(s),...(frame?.sheet.querySelectorAll(s)??[])];
 // ── 공통 화면 틀(11-18 UI 개선, src/ui-frame.js): 위 왼쪽 = 장소·사람·트리 알약 / 위 오른쪽 = 🗺 지도(travel-ui.js)·💬·☰ /
 //  ☰ 탭 = 우체통·옷·캐럴·소리·설정(광장 사람·서버). 원래 창(.xh-sheet)은 탭 안으로 옮긴다
 const TAB_OF={people:'set',outfit:'outfit',music:'music'},SHEET_OF={set:'people',outfit:'outfit',music:'music'};
 frame=createUiFrame({doc,win,exp:'christmas',tabs:[
  {id:'mail',label:'우체통',ic:'x-mailbox',onOpen:p=>renderMail(p)},
  {id:'outfit',label:'옷',ic:'x-outfit',onOpen:()=>renderOutfit()},
  {id:'music',label:'캐럴',ic:'c-music',onOpen:()=>act.musicOpen?.()},
  {id:'sound',label:'소리',ic:'c-sound',onOpen:p=>renderSoundTab(p)},
  {id:'set',label:'설정',ic:'c-settings',onOpen:()=>renderPeople()},
 ]});
 root.classList.add('uf-on');
 for(const [name,tab] of Object.entries(TAB_OF)){const sec=$(`.xh-sheet[data-sheet=${name}]`),host=frame.panel(tab);if(sec&&host){sec.classList.add('uf-moved');sec.hidden=false;host.appendChild(sec);}}
 $('.xh-top').classList.add('uf-pill');
 win.addEventListener('uf:tab',e=>{const n=SHEET_OF[e.detail?.id]??e.detail?.id;sheet=n;win.dispatchEvent(new CustomEvent('xmas:sheet',{detail:{id:n}}));});
 win.addEventListener('uf:win',e=>{if(e.detail?.closed==='menu')sheet=null;});
 function renderMail(p){
  const n=act.unopened?.()??0;
  p.innerHTML=`<h2 class="xh-tab-h">${iconText('x-mailbox','우체통')}</h2><div class="xh-row"><button type="button" class="xh-mini" data-mail="inbox">${iconText('x-mailbox',n?`받은 선물 ${n}개 열기`:'받은 선물 보기')}</button><button type="button" class="xh-mini" data-mail="board">${iconText('x-cards-all','모두의 카드')}</button></div><p class="xh-sub">선물을 보내려면 광장 우체통 앞에 가서 「선물 보내기」를 누르세요. 사람 목록에서도 보낼 수 있어요.</p>`;
  p.onclick=e=>{const b=e.target.closest('[data-mail]');if(!b)return;frame.close();b.dataset.mail==='board'?act.board?.():act.inbox?.();};
 }
 let mutedNow=false;
 function renderSoundTab(p){
  p.innerHTML=`<h2 class="xh-tab-h">${iconText('c-sound','소리')}</h2><div class="xh-row"><button type="button" class="xh-mini" data-snd="1" aria-pressed="${!mutedNow}">${iconText('c-sound',mutedNow?'소리 꺼짐':'소리 켜짐',{off:mutedNow})}</button></div><p class="xh-sub">소리를 끄면 캐럴도 같이 꺼져요. 캐럴만 끄려면 「캐럴」 탭을 보세요.</p>`;
  p.onclick=e=>{if(e.target.closest('[data-snd]'))act.sound?.();};
 }
 const place=$('.xh-place'),treeEl=$('.xh-tree'),acts=$('.xh-acts'),deco=$('.xh-deco'),toast=$('.xh-toast'),tags=$('.xh-tags'),card=$('.xh-card'),zone=$('.xh-zone');
 let layoutT=0,status={state:'off'},toastT=0,zoneT=0,kind=ORNAMENTS[0],cardId=null,sheet=null,decorating=false,pending=null,actSig='',actList=[];
 // ── 행동 단추 줄(첫 줄 = 큰 단추)
 // 행동 원 자리(공통 틀 ufPlace): 첫 줄 = 큰 단추, 나머지 = 작은 단추, 달리기(travel-ui .xt-run)는 맨 뒤 작은 단추(할 일이 없으면 큰 단추)
 function layoutActs(){
  const btns=[...acts.children],run=doc.querySelector('.xt-run');
  const runOk=!!run&&!acts.hidden&&!root.classList.contains('decorating')&&getComputedStyle(run).display!=='none';
  let big=btns[0]??null,small=btns.slice(1);
  if(runOk){if(big)small=[...small,run];else big=run;}
  const labels=new Map();btns.forEach((b,i)=>{const a=actList[i];if(a)labels.set(b,a.short??a.label);});
  if(run&&runOk)labels.set(run,run.querySelector('span')?.textContent||'달리기');
  // 할 일 칩: 「한 판 하기」(fight-ui.js), 그 위에 눈덩이 수(snowfight-play.js .xf-ammo) — 보일 때만
  const vis=e=>!!e&&!e.hidden&&!e.closest('[hidden]')&&getComputedStyle(e).display!=='none';
  const todo=[doc.querySelector('.xfm-join'),doc.querySelector('.xf-ammo')].filter(vis);
  ufPlace(root,{big,small,todo,labels});
  if(run){if(runOk&&(run===big||small.includes(run))){run.dataset.uf=run===big?'big':`s${small.indexOf(run)+1}`;run.dataset.ufT=labels.get(run);}else{delete run.dataset.uf;delete run.dataset.ufT;}}
 }
 function setActions(list=[]){
  queueMicrotask(layoutActs);
  const sig=JSON.stringify(list.map(a=>[a.id,a.ic,a.label,a.tailIc??'',a.tail??'',a.key,a.badge??0,a.dim?1:0,a.hold?1:0]));if(sig===actSig)return;actSig=sig;actList=list;
  const html=list.slice(0,3).map((a,i)=>`<button type="button" class="${i?'xh-sub-act':'xh-act'}" data-act="${esc(a.id)}"${a.aim?' data-aim="1"':''}${a.hold?' data-hold="1"':''}${a.dim?' data-dim="1"':''}><em aria-hidden="true">${icon(a.ic,{size:i?'m':'l'})}</em><span>${esc(a.label)}${a.tailIc?` · ${iconText(a.tailIc,String(a.tail??''),{size:'xs'})}`:''}</span>${a.key?`<kbd>${esc(a.key)}</kbd>`:''}${a.badge?`<b class="xh-badge">${a.badge}</b>`:''}</button>`).join('');
  // 같은 단추 줄에서 글자만 바뀌면(「출발! 5→4」 등) 단추를 그대로 두고 안쪽만 고침 — 통째로 다시 그리면 그 순간 누른 것이 사라짐
  const tmp=document.createElement('div');tmp.innerHTML=html;const next=[...tmp.children],prev=[...acts.children];
  const same=prev.length===next.length&&next.every((b,i)=>{const o=prev[i];return o.dataset.act===b.dataset.act&&o.className===b.className&&o.attributes.length===b.attributes.length&&[...b.attributes].every(x=>o.getAttribute(x.name)===x.value);});
  if(!same){acts.innerHTML=html;return;}
  next.forEach((b,i)=>{const o=prev[i];if(o.innerHTML===b.innerHTML)return;const oc=[...o.children],nc=[...b.children];
   if(oc.length===nc.length&&nc.every((c,k)=>oc[k].tagName===c.tagName))nc.forEach((c,k)=>{if(oc[k].innerHTML!==c.innerHTML)oc[k].innerHTML=c.innerHTML;});else o.innerHTML=b.innerHTML;});
 }
 // 조준 단추(❄️, data-aim): 누르는 동안 조준, 끌면 방향·거리(휴대폰), 떼면 던짐 → act.aimButton(phase,dx,dy). PC 단추도 같음(누름 = F 누름)
 //  누르고 있는 단추(data-hold, 웅크리기 등): 누름·뗌 → act.hold(id,on)
 {let hold=null;
  acts.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-aim],[data-hold]');if(!b)return;e.preventDefault();try{b.setPointerCapture?.(e.pointerId);}catch{}
   hold={id:b.dataset.act,x:e.clientX,y:e.clientY,pid:e.pointerId,b,aim:!!b.dataset.aim};b.classList.add(hold.aim?'aiming':'on');
   if(hold.aim)act.aimButton?.('down',0,0,e.clientX,e.clientY);else act.hold?.(hold.id,true);});
  acts.addEventListener('pointermove',e=>{if(!hold||e.pointerId!==hold.pid||!hold.aim)return;act.aimButton?.('move',e.clientX-hold.x,e.clientY-hold.y);});
  const end=e=>{if(!hold||e.pointerId!==hold.pid)return;const h=hold;hold=null;h.b.classList.remove('aiming','on');
   if(h.aim)act.aimButton?.(e.type==='pointercancel'?'cancel':'up',e.clientX-h.x,e.clientY-h.y);else act.hold?.(h.id,false);lastAim=performance.now();};
  acts.addEventListener('pointerup',end);acts.addEventListener('pointercancel',end);}
 let lastAim=0;
 // ── 구역 이름 띠
 function banner(title,sub='',sec=1.5,ic=null){const t=zone.querySelector(':scope>b');if(ic)t.innerHTML=iconText(ic,title);else t.textContent=title;zone.querySelector(':scope>span').textContent=sub;zone.hidden=false;zone.classList.remove('out');zoneT=sec;}
 function setBadge(name,n){if(name!=='inbox')return;const b=$('[data-x=inbox] .xh-badge');b.hidden=!n;b.textContent=n>9?'9+':String(n);}
 function setCarol(on,now,nowIc=null){const b=$('[data-x=carol]');b.innerHTML=iconText('c-music',on?'캐럴 켜짐':'캐럴 꺼짐',{off:!on});b.setAttribute('aria-pressed',String(!!on));if(now!=null){const el=$('[data-carol-now]'),k=(nowIc??'')+'|'+now;if(el.dataset.k!==k){el.dataset.k=k;if(nowIc)el.innerHTML=iconText(nowIc,now,{size:'xs'});else el.textContent=now;}}}
 function setSound(muted){mutedNow=!!muted;if(frame.isOpen&&frame.tab==='sound')renderSoundTab(frame.panel('sound'));const b=$('[data-x=sound]');b.innerHTML=icon('c-sound',{size:'m',off:!!muted});b.setAttribute('aria-pressed',String(!!muted));b.setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');}

 // ── 알림
 // ic: 알림 줄 맨 앞 XS 아이콘(아이콘-규칙-v1 §6-4). 글은 그대로 이스케이프
 function say(text,sec=2.6,ic=null){if(ic)toast.innerHTML=iconText(ic,text,{size:'xs'});else toast.textContent=text;toast.hidden=false;toast.classList.remove('out');toastT=sec;}
 // ── 연결 칩
 function renderPlace(){
  const v=xmasStatusView(status);place.dataset.tone=v.tone;{const em=place.querySelector('em');if(em.dataset.ic!==v.ic){em.dataset.ic=v.ic;em.innerHTML=icon(v.ic,{size:'s'});}const sp=place.querySelector(':scope>span'),tx=v.text.replace(/^눈마을 광장 /,''); /* 위 알약은 짧게(「1서버 · 👥 2/30」) */if(sp.dataset.t!==tx){sp.dataset.t=tx;sp.innerHTML=esc(tx).replace('👥 ',icon('c-people',{size:'xs'})+' ');}}
  place.setAttribute('aria-label',`${v.text}${v.sub?' · '+v.sub:''}`);
 }
 win.addEventListener('xmas:multi-status',e=>{const d=e.detail;if(!d)return;const was=status.state;status=d;
  if(d.joined&&d.state==='online'&&was!=='online')say(d.transport==='local'?'내 컴퓨터 모드로 광장에 왔어요':`${xmasStatusView(d).text.split(' · ')[0]}에 왔어요 · ${d.count}명`);
  else if(d.joined&&d.state==='offline'&&was&&was!=='offline')say('연결이 끊겼어요. 위 칩을 눌러 다시 연결해요');
  else if(d.joined&&d.state==='reconnecting'&&was==='online')say('다시 연결하는 중이에요. 트리는 그대로 보여요');
  renderPlace();if(sheet==='people')renderPeople();
  if(d.joined&&d.state==='full')act.full?.();
 });
 win.addEventListener('xmas:multi-leave',()=>{status={state:'off'};renderPlace();});
 win.addEventListener('xmas:multi-note',e=>{if(e.detail?.text)say(e.detail.text);});

 // ── 트리 진행
 function renderTree(){
  const n=treePlay.count;$('[data-tree-n]').textContent=n;$('.xh-bar>i').style.width=`${Math.round(n/TREE_RULES.slots*100)}%`;
  $('.xh-star').hidden=!treePlay.star;treeEl.dataset.stage=treePlay.stage;
 }
 // ── 장식 달기 모드
 function renderDeco(){
  deco.hidden=!decorating;root.classList.toggle('decorating',decorating);
  if(!decorating)return;
  const q=treePlay.quota();$('.xh-quota').textContent=quotaText(q);
  for(const b of $$('.xh-kind'))b.setAttribute('aria-pressed',String(b.dataset.kind===kind));
  $('.xh-confirm').hidden=pending===null;
  const u=treePlay.lastUndoable();$('[data-x=undo]').hidden=!u;
  $('[data-x=star]').hidden=!treePlay.starOpen;
 }
 function setDecorating(on){decorating=!!on;pending=null;if(decorating)closeSheet();renderDeco();}
 function setPending(slot){pending=slot;renderDeco();}

 // ── 옷
 function renderOutfit(){
  const l=look.get(),own=new Set(wardrobe());
  $('[data-outfits]').innerHTML=Object.entries(XMAS_OUTFITS).map(([k,o])=>`<button type="button" class="xh-pick" data-outfit="${k}" aria-pressed="${l.outfit===k}"><em aria-hidden="true">${icon(OUTFIT_IC[k],{size:'xl'})}</em><span>${esc(o.label)}</span></button>`).join('');
  const hats=['',...Object.keys(XMAS_HATS).filter(k=>!XMAS_HATS[k].gift||own.has(k))];
  $('[data-hats]').innerHTML=hats.map(k=>`<button type="button" class="xh-pick" data-hat="${k}" aria-pressed="${(l.hat??'')===k}"><em aria-hidden="true">${icon(HAT_IC[k],{size:'xl'})}</em><span>${esc(k?XMAS_HATS[k].label:'옷에 맞는 모자')}</span></button>`).join('')
   +(own.has('stripe')?`<button type="button" class="xh-pick" data-scarf="1" aria-pressed="${l.scarf==='stripe'}"><em aria-hidden="true">${icon('x-scarf',{size:'xl'})}</em><span>줄무늬 목도리</span></button>`:'');
 }
 // ── 사람 목록
 function renderPeople(){
  const v=xmasStatusView(status),people=multi.people().filter(p=>!p.muted);
  $('[data-people-title]').innerHTML=status.joined?iconText('c-people',`광장 사람 ${people.length+1}명`):iconText('c-person','혼자 둘러보기');
  $('[data-people-sub]').textContent=status.joined?`${v.text}${v.sub?' · '+v.sub:''}`:'혼자 둘러보면 트리 장식은 내 화면에만 남아요. 서버를 고르면 함께 꾸밀 수 있어요';
  $('[data-x=retry]').hidden=!(status.joined&&status.state==='offline');
  $('[data-people-list]').innerHTML=status.joined?`<li class="me"><b>${esc(multi.name)}</b><small>나</small></li>`+people.map(p=>`<li><b>${p.decorating?icon('x-tree',{size:'xs'})+' ':''}${esc(p.name)}</b><button type="button" class="xh-mini" data-gift="${esc(p.id)}" aria-label="${esc(p.name)}에게 선물">${icon('x-gift',{size:'s'})}</button><button type="button" class="xh-mini" data-mute="${esc(p.id)}">${iconText('c-mute-person','음소거')}</button><button type="button" class="xh-mini" data-report="${esc(p.id)}">${iconText('c-report','신고')}</button></li>`).join(''):'';
  const muted=multi.mutedList();$('[data-muted-n]').textContent=muted.length;
  $('[data-muted-list]').innerHTML=muted.map(m=>`<li><b>${esc(m.name)}</b><button type="button" class="xh-mini" data-unmute="${esc(m.id)}">음소거 풀기</button></li>`).join('')||'<li class="xh-empty">없어요</li>';
 }
 // 창은 ☰ 메뉴 탭(틀이 열고 닫음). 사람 카드는 따로 무거운 창('card')
 function openSheet(name){setCard(false);frame.open(TAB_OF[name]??name);}
 function closeSheet(){if(frame.isOpen)frame.close();sheet=null;}
 function setCard(on){const was=!card.hidden;card.hidden=!on;if(on&&!was)openWin('card',{doc,win});else if(!on&&was)closeWin('card',{doc,win});if(!on)cardId=null;}
 onWin('card',()=>setCard(false),{win});
 function openCard(id){const p=multi.people().find(x=>x.id===id);if(!p)return;closeSheet();cardId=id;$('[data-card-name]').textContent=p.name;setCard(true);}
 // 채팅 창이 열리면 다른 창은 닫는다(한 번에 한 가지 창, 체험설계 §1-4)
 win.addEventListener('xmas:sheet',e=>{if(e.detail?.id===null){closeSheet();setCard(false);}});

 const onClick=e=>{
  const b=e.target.closest('button,[data-tag]');if(!b)return;
  if(b.dataset.tag){openCard(b.dataset.tag);return;}
  if(b.dataset.act){if(b.dataset.aim||b.dataset.hold)return;act.do?.(b.dataset.act);return;}
  if(b.dataset.kind){kind=b.dataset.kind;act.kind?.(kind);renderDeco();return;}
  if(b.dataset.outfit){look.set({outfit:b.dataset.outfit});renderOutfit();return;}
  if('hat' in b.dataset){look.set({hat:b.dataset.hat||null});renderOutfit();return;}
  if(b.dataset.scarf){const l=look.get();look.set({scarf:l.scarf==='stripe'?null:'stripe'});renderOutfit();return;}
  if(b.dataset.gift){closeSheet();act.gift?.(b.dataset.gift);return;}
  if(b.dataset.mute){multi.mute(b.dataset.mute);say('음소거했어요. 이 사람은 더 보이지 않아요');renderPeople();return;}
  if(b.dataset.report){multi.report(b.dataset.report);say(multi.viaServer?'신고를 보내고 음소거했어요':'신고를 기록하고 음소거했어요(이 기기에만)');renderPeople();return;}
  if(b.dataset.unmute){multi.unmute(b.dataset.unmute);say('음소거를 풀었어요');renderPeople();return;}
  switch(b.dataset.x){
   case 'place':if(status.joined&&status.state==='offline'){act.rejoin?.();return;}frame.toggle('set');return;
   case 'outfit':frame.toggle('outfit');return;
   case 'sheet-close':closeSheet();return;
   case 'servers':closeSheet();act.servers?.();return;
   case 'retry':act.rejoin?.();return;
   case 'inbox':act.inbox?.();return;
   case 'sound':act.sound?.();return;
   case 'music':frame.toggle('music');return;
   case 'carol':act.carol?.();return;
   case 'gift':if(cardId){const id=cardId;setCard(false);act.gift?.(id);}return;
   case 'deco-close':act.decorate?.(false);return;
   case 'confirm':if(pending!==null)act.place?.(pending,kind);return;
   case 'cancel':act.cancel?.();return;
   case 'undo':{const u=treePlay.lastUndoable();if(u)act.undo?.(u.slot);return;}
   case 'star':act.star?.();return;
   case 'card-close':setCard(false);return;
   case 'mute':if(cardId){multi.mute(cardId);say('음소거했어요. 이 사람은 더 보이지 않아요');}setCard(false);return;
   case 'report':if(cardId){multi.report(cardId);say(multi.viaServer?'신고를 보내고 음소거했어요':'신고를 기록하고 음소거했어요(이 기기에만)');}setCard(false);return;
  }
 };
 root.addEventListener("click",onClick);frame.sheet.addEventListener("click",onClick); // 메뉴 창 안으로 옮긴 옷·캐럴·사람 단추도 같은 처리

 // ── 이름표(다른 사람 머리 위). 말풍선이 떠 있으면 말풍선이 이름을 보여 주니 이름표는 숨긴다(chat.hasBubble)
 const tagEls=new Map();
 function updateTags(hasBubble){
  const seen=new Set();
  for(const p of multi.people()){
   if(p.muted||!p.shown)continue;
   const s=project(p.id);if(!s)continue;seen.add(p.id);
   let el=tagEls.get(p.id);if(!el){el=doc.createElement('button');el.type='button';el.className='xh-tag';el.dataset.tag=p.id;tags.appendChild(el);tagEls.set(p.id,el);}
   const key=(p.decorating?'1':'0')+p.name;if(el.dataset.k!==key){el.dataset.k=key;el.innerHTML=p.decorating?iconText('x-tree',p.name,{size:'xs'}):esc(p.name);}
   // 22m 넘게 먼 사람은 이름표를 숨긴다(20명이 모이면 먼 이름표가 화면을 덮음). 말풍선은 그대로 뜬다
   const hide=!s.visible||s.dist>22||hasBubble?.(p.id);el.style.display=hide?'none':'';
   if(!hide){el.style.opacity=String(Math.max(.55,1-s.dist/30));el.style.transform=`translate(${Math.round(s.x)}px,${Math.round(s.y)}px) translate(-50%,-100%)`;}
  }
  for(const [id,el] of tagEls)if(!seen.has(id)){el.remove();tagEls.delete(id);}
 }

 renderPlace();renderTree();
 return {root,frame,layoutActs,say,setDecorating,setPending,renderTree,renderDeco,openSheet,closeSheet,setActions,banner,setBadge,setSound,setCarol,
  get kind(){return kind;},get pending(){return pending;},get sheet(){return sheet;},get cardOpen(){return !card.hidden;},get actions(){return actList;},
  update(dt,{hasBubble=null}={}){
   if(toastT>0){toastT-=dt;if(toastT<=.4)toast.classList.add('out');if(toastT<=0)toast.hidden=true;}
   if(zoneT>0){zoneT-=dt;if(zoneT<=.4)zone.classList.add('out');if(zoneT<=0)zone.hidden=true;}
   acts.hidden=decorating;layoutT-=dt;if(layoutT<=0){layoutT=.2;layoutActs();}
   renderTree();if(decorating)renderDeco();
   updateTags(hasBubble);
  },
 };
}
