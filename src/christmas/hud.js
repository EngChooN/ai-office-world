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
import '../icons/icons.css';   // 아이콘 공통 모양(아이콘-규칙-v1)
document.documentElement.dataset.icExp='christmas';
import {xmasStatusView} from './multi.js';
import {ORNAMENTS,TREE_RULES} from './tree-state.js';
import {XMAS_OUTFITS,XMAS_HATS} from './outfits.js';
import {CAROLS} from './carols.js';
import {icon,iconText} from '../icons/icon.js';

// 장식·옷·모자 고르기 칸 아이콘 이름(아이콘-규칙-v1 §7-4). ORN_ICON 글자는 다른 곳(알림 글)에서 쓰므로 그대로 둠
const ORN_IC={ballRed:'x-orn-red',ballGold:'x-orn-yellow',ballBlue:'x-orn-blue',ballSilver:'x-orn-white',candy:'x-orn-candy',bell:'x-orn-bell',snowflake:'x-orn-snow',gift:'x-orn-gift'};
const OUTFIT_IC={santa:'x-outfit-santa',sweater:'x-outfit-knit',elf:'x-outfit-elf'};
const HAT_IC={'':'x-hat-auto',santa:'x-hat-santa',antlers:'x-hat-reindeer',beanie:'x-hat-cap',elf:'x-hat-elf',none:'x-hat-none'};
// 행동 단추(main.js currentActions의 id) → 아이콘. 표에 없으면 넘어온 글자 그대로
const ACT_IC={'fire:warm':'x-warm-hands','fire:cocoa':'x-cocoa','fire:stand':'c-stand-up','fire:sit':'c-sit','tree:deco':'x-tree','gift:board':'x-cards-all','gift:send':'x-gift','gift:inbox':'x-mailbox',
 'sled:go':'x-sled','sled:off':'c-leave','sled:cheer':'x-cheer','sled:cancel':'c-leave','sled:board':'x-sled','sled:ask':'x-sled-pair','sled:up':'x-uphill','sb:throw':'x-snowball','sb:pack':'x-scoop','snow:stack':'x-stack','snow:deco':'x-decorate','snow:make':'x-roll'};
// 연결 칩(multi.js xmasStatusView의 tone) → 아이콘(§7-1 마)
const TONE_IC={wait:'c-net-connecting',local:'c-net-local',ok:'c-net-ok',warn:null,bad:'c-net-lost',solo:'c-person'};
export const ORN_ICON=Object.freeze({ballRed:'🔴',ballGold:'🟡',ballBlue:'🔵',ballSilver:'⚪',candy:'🍭',bell:'🔔',snowflake:'❄️',gift:'🎁'});
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
 const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
 const place=$('.xh-place'),treeEl=$('.xh-tree'),acts=$('.xh-acts'),deco=$('.xh-deco'),toast=$('.xh-toast'),tags=$('.xh-tags'),card=$('.xh-card'),zone=$('.xh-zone');
 let status={state:'off'},toastT=0,zoneT=0,kind=ORNAMENTS[0],cardId=null,sheet=null,decorating=false,pending=null,actSig='',actList=[];
 // ── 행동 단추 줄(첫 줄 = 큰 단추)
 function setActions(list=[]){
  const sig=JSON.stringify(list.map(a=>[a.id,a.ic,a.label,a.key,a.badge??0,a.dim?1:0]));if(sig===actSig)return;actSig=sig;actList=list;
  acts.innerHTML=list.slice(0,3).map((a,i)=>`<button type="button" class="${i?'xh-sub-act':'xh-act'}" data-act="${esc(a.id)}"${a.aim?' data-aim="1"':''}${a.dim?' data-dim="1"':''}><em aria-hidden="true">${ACT_IC[a.id]?icon(ACT_IC[a.id],{size:i?'m':'l'}):esc(a.ic)}</em><span>${esc(a.label)}</span>${a.key?`<kbd>${esc(a.key)}</kbd>`:''}${a.badge?`<b class="xh-badge">${a.badge}</b>`:''}</button>`).join('');
 }
 // 휴대폰 조준 단추(❄️): 짧게 누르면 act.do, 길게 누르고 끌면 act.aim(dx,dy,끝?)
 {let hold=null;
  acts.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-aim]');if(!b||!mobile)return;e.preventDefault();try{b.setPointerCapture?.(e.pointerId);}catch{}
   hold={id:b.dataset.act,x:e.clientX,y:e.clientY,t:performance.now(),pid:e.pointerId,aiming:false,b};
   hold.timer=setTimeout(()=>{if(hold){hold.aiming=true;b.classList.add('aiming');act.aim?.(0,0,false);}},260);});
  acts.addEventListener('pointermove',e=>{if(!hold||e.pointerId!==hold.pid)return;const dx=e.clientX-hold.x,dy=e.clientY-hold.y;if(!hold.aiming&&Math.hypot(dx,dy)>12){hold.aiming=true;hold.b.classList.add('aiming');}if(hold.aiming)act.aim?.(dx,dy,false);});
  const end=e=>{if(!hold||e.pointerId!==hold.pid)return;clearTimeout(hold.timer);const h=hold;hold=null;h.b.classList.remove('aiming');
   if(h.aiming)act.aim?.(e.clientX-h.x,e.clientY-h.y,true);else act.do?.(h.id);h.done=performance.now();lastAim=h.done;};
  acts.addEventListener('pointerup',end);acts.addEventListener('pointercancel',end);}
 let lastAim=0;
 // ── 구역 이름 띠
 function banner(title,sub='',sec=1.5){zone.querySelector('b').textContent=title;zone.querySelector('span').textContent=sub;zone.hidden=false;zone.classList.remove('out');zoneT=sec;}
 function setBadge(name,n){if(name!=='inbox')return;const b=$('[data-x=inbox] .xh-badge');b.hidden=!n;b.textContent=n>9?'9+':String(n);}
 function setCarol(on,now){const b=$('[data-x=carol]');b.innerHTML=iconText('c-music',on?'캐럴 켜짐':'캐럴 꺼짐',{off:!on});b.setAttribute('aria-pressed',String(!!on));if(now!=null){const el=$('[data-carol-now]');if(el.textContent!==now)el.textContent=now;}}
 function setSound(muted){const b=$('[data-x=sound]');b.innerHTML=icon('c-sound',{size:'m',off:!!muted});b.setAttribute('aria-pressed',String(!!muted));b.setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');}

 // ── 알림
 function say(text,sec=2.6){toast.textContent=text;toast.hidden=false;toast.classList.remove('out');toastT=sec;}
 // ── 연결 칩
 function renderPlace(){
  const v=xmasStatusView(status);place.dataset.tone=v.tone;{const em=place.querySelector('em'),ic=TONE_IC[v.tone]??(v.ic==='🚪'?'c-net-full':v.ic==='🔄'?'c-net-retry':null),key=ic??v.ic;if(em.dataset.ic!==key){em.dataset.ic=key;em.innerHTML=ic?icon(ic,{size:'s'}):esc(v.ic);}}place.querySelector('span').textContent=v.text;
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
  $('[data-people-list]').innerHTML=status.joined?`<li class="me"><b>${esc(multi.name)}</b><small>나</small></li>`+people.map(p=>`<li><b>${p.decorating?icon('x-tree',{size:'xs'})+' ':''}${esc(p.name)}</b><button type="button" class="xh-mini" data-gift="${esc(p.id)}" aria-label="${esc(p.name)}에게 선물">${icon('x-gift',{size:'s'})}</button><button type="button" class="xh-mini" data-mute="${esc(p.id)}">🔇 음소거</button><button type="button" class="xh-mini" data-report="${esc(p.id)}">🚩 신고</button></li>`).join(''):'';
  const muted=multi.mutedList();$('[data-muted-n]').textContent=muted.length;
  $('[data-muted-list]').innerHTML=muted.map(m=>`<li><b>${esc(m.name)}</b><button type="button" class="xh-mini" data-unmute="${esc(m.id)}">음소거 풀기</button></li>`).join('')||'<li class="xh-empty">없어요</li>';
 }
 function openSheet(name){sheet=name;for(const s of $$('.xh-sheet'))s.hidden=s.dataset.sheet!==name;if(name==='people')renderPeople();if(name==='outfit')renderOutfit();if(name==='music')act.musicOpen?.();card.hidden=true;win.dispatchEvent(new CustomEvent('xmas:sheet',{detail:{id:name}}));}
 function closeSheet(){sheet=null;for(const s of $$('.xh-sheet'))s.hidden=true;}
 function openCard(id){const p=multi.people().find(x=>x.id===id);if(!p)return;cardId=id;$('[data-card-name]').textContent=p.name;card.hidden=false;closeSheet();}
 // 채팅 창이 열리면 다른 창은 닫는다(한 번에 한 가지 창, 체험설계 §1-4)
 win.addEventListener('xmas:sheet',e=>{if(e.detail?.id===null){closeSheet();card.hidden=true;}});

 root.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-tag]');if(!b)return;
  if(b.dataset.tag){openCard(b.dataset.tag);return;}
  if(b.dataset.act){if(b.dataset.aim&&mobile)return;act.do?.(b.dataset.act);return;}
  if(b.dataset.kind){kind=b.dataset.kind;act.kind?.(kind);renderDeco();return;}
  if(b.dataset.outfit){look.set({outfit:b.dataset.outfit});renderOutfit();return;}
  if('hat' in b.dataset){look.set({hat:b.dataset.hat||null});renderOutfit();return;}
  if(b.dataset.scarf){const l=look.get();look.set({scarf:l.scarf==='stripe'?null:'stripe'});renderOutfit();return;}
  if(b.dataset.gift){closeSheet();act.gift?.(b.dataset.gift);return;}
  if(b.dataset.mute){multi.mute(b.dataset.mute);say('음소거했어요. 이 사람은 더 보이지 않아요');renderPeople();return;}
  if(b.dataset.report){multi.report(b.dataset.report);say(multi.viaServer?'신고를 보내고 음소거했어요':'신고를 기록하고 음소거했어요(이 기기에만)');renderPeople();return;}
  if(b.dataset.unmute){multi.unmute(b.dataset.unmute);say('음소거를 풀었어요');renderPeople();return;}
  switch(b.dataset.x){
   case 'place':if(status.joined&&status.state==='offline'){act.rejoin?.();return;}sheet==='people'?closeSheet():openSheet('people');return;
   case 'outfit':sheet==='outfit'?closeSheet():openSheet('outfit');return;
   case 'sheet-close':closeSheet();return;
   case 'servers':closeSheet();act.servers?.();return;
   case 'retry':act.rejoin?.();return;
   case 'inbox':act.inbox?.();return;
   case 'sound':act.sound?.();return;
   case 'music':sheet==='music'?closeSheet():openSheet('music');return;
   case 'carol':act.carol?.();return;
   case 'gift':if(cardId){const id=cardId;card.hidden=true;cardId=null;act.gift?.(id);}return;
   case 'deco-close':act.decorate?.(false);return;
   case 'confirm':if(pending!==null)act.place?.(pending,kind);return;
   case 'cancel':act.cancel?.();return;
   case 'undo':{const u=treePlay.lastUndoable();if(u)act.undo?.(u.slot);return;}
   case 'star':act.star?.();return;
   case 'card-close':card.hidden=true;cardId=null;return;
   case 'mute':if(cardId){multi.mute(cardId);say('음소거했어요. 이 사람은 더 보이지 않아요');}card.hidden=true;cardId=null;return;
   case 'report':if(cardId){multi.report(cardId);say(multi.viaServer?'신고를 보내고 음소거했어요':'신고를 기록하고 음소거했어요(이 기기에만)');}card.hidden=true;cardId=null;return;
  }
 });

 // ── 이름표(다른 사람 머리 위). 말풍선이 떠 있으면 말풍선이 이름을 보여 주니 이름표는 숨긴다(chat.hasBubble)
 const tagEls=new Map();
 function updateTags(hasBubble){
  const seen=new Set();
  for(const p of multi.people()){
   if(p.muted||!p.shown)continue;
   const s=project(p.id);if(!s)continue;seen.add(p.id);
   let el=tagEls.get(p.id);if(!el){el=doc.createElement('button');el.type='button';el.className='xh-tag';el.dataset.tag=p.id;tags.appendChild(el);tagEls.set(p.id,el);}
   const text=(p.decorating?'🎄 ':'')+p.name;if(el.textContent!==text)el.textContent=text;
   // 22m 넘게 먼 사람은 이름표를 숨긴다(20명이 모이면 먼 이름표가 화면을 덮음). 말풍선은 그대로 뜬다
   const hide=!s.visible||s.dist>22||hasBubble?.(p.id);el.style.display=hide?'none':'';
   if(!hide){el.style.opacity=String(Math.max(.55,1-s.dist/30));el.style.transform=`translate(${Math.round(s.x)}px,${Math.round(s.y)}px) translate(-50%,-100%)`;}
  }
  for(const [id,el] of tagEls)if(!seen.has(id)){el.remove();tagEls.delete(id);}
 }

 renderPlace();renderTree();
 return {root,say,setDecorating,setPending,renderTree,renderDeco,openSheet,closeSheet,setActions,banner,setBadge,setSound,setCarol,
  get kind(){return kind;},get pending(){return pending;},get sheet(){return sheet;},get cardOpen(){return !card.hidden;},get actions(){return actList;},
  update(dt,{hasBubble=null}={}){
   if(toastT>0){toastT-=dt;if(toastT<=.4)toast.classList.add('out');if(toastT<=0)toast.hidden=true;}
   if(zoneT>0){zoneT-=dt;if(zoneT<=.4)zone.classList.add('out');if(zoneT<=0)zone.hidden=true;}
   acts.hidden=decorating;
   renderTree();if(decorating)renderDeco();
   updateTags(hasBubble);
  },
 };
}
