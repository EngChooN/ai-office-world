// 선물 우체통(월드개발, 2026-11-16). 체험설계 v1 §5-2 화면 흐름. 규칙은 gift-state.js, 판정은 room-play.js(서버·혼자 모드 공용).
//  보내기: 우체통 옆 [🎁 선물 보내기](또는 사람 카드의 🎁) → ① 누구에게(광장 사람 가까운 순 + 🎄 광장 모두) ② 무엇을(6개) ③ 카드(그림 3 + 글 60자·기본 문구 4) ④ 확인 → 보내기
//        → 우체통 깃발이 올라가고 '쏙' 소리, "○○에게 선물을 보냈어요". 휴대폰은 아래 시트(화면 70%), PC는 가운데 창(폭 480px).
//  받기: 위에 "🎁 ○○에게서 선물이 왔어요 [열어 보기]" 5초 + 📬 숫자(놓쳐도 남음) → 열면 상자 리본이 풀리고 카드가 펼쳐짐 → [입어 보기]/[트리에 달기]/[코코아 받기]/[닫기], ⋯ 음소거·신고
//  광장 모두에게 온 카드: 「모두의 카드」 판에 최근 5장, 아이템은 사람마다 한 번 받기.
//  음소거한 사람의 선물은 조용히 받지 않는다(보낸 사람은 "보냈어요"로 봄). 받은 카드·목록은 광장을 나가면 사라짐(저장 없음), 입는 것만 이 기기 옷장에 남김(main.js addWardrobe).
import {GIFT_ITEMS,GIFT_INFO,CARD_DESIGNS,CARD_INFO,CARD_PRESETS,GIFT_RULES,cleanCardText,sanitizeGift,giftDeniedText,GIFT_TEXT} from './gift-state.js';
import {MAILBOX} from './layout.js';
import {icon,iconText} from '../icons/icon.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 선물·카드 그림 아이콘(아이콘-규칙-v1 §7-4). gift-state.js의 ic 글자는 서버 공용 자료라 그대로 두고 화면은 이 표를 씀
const GIFT_IC={santa:'x-hat-santa',stripe:'x-scarf',antlers:'x-hat-reindeer',ornament:'x-orn-red',sticker:'x-orn-snow',cocoa:'x-cocoa'};
const CARD_IC={tree:'x-tree',snowman:'x-snowman',fire:'x-campfire'};
export const giftWearLook=item=>item==='stripe'?{scarf:'stripe'}:item==='santa'||item==='antlers'?{hat:item}:null;

// ctx: {doc,win,root(hud .xh),net(play-net),multi,player,mobile,hud,audio,village,
//       wear(item) 옷장에 넣고 입기, treeBonus() 트리에 선물 오너먼트 달기, cocoa(n) 코코아 받음}
export function createGifts({doc=document,win=window,root,net,multi,player,mobile=false,hud,audio,village,wear=()=>{},treeBonus=()=>{},cocoa=()=>{}}){
 const sheet=doc.createElement('section');sheet.className='xg-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','선물 보내기');
 const inbox=doc.createElement('section');inbox.className='xg-sheet xg-inbox';inbox.hidden=true;inbox.setAttribute('role','dialog');inbox.setAttribute('aria-label','받은 선물');
 const cardEl=doc.createElement('section');cardEl.className='xg-open';cardEl.hidden=true;cardEl.setAttribute('role','dialog');cardEl.setAttribute('aria-label','선물 카드');
 const toast=doc.createElement('div');toast.className='xg-toast';toast.hidden=true;toast.setAttribute('role','status');
 root.append(sheet,inbox,cardEl,toast);
 const S={step:1,to:null,toName:'',item:null,card:'tree',text:'',preset:null,sending:false};
 const got=[];               // 받은 선물 {…gift, opened, used}
 let board=[],boardTaken=new Set(),toastT=0,toastGift=null,flagT=0,openG=null;
 const isMuted=id=>multi.isMuted?.(id);
 const open=()=>!sheet.hidden||!inbox.hidden||!cardEl.hidden;
 function closeAll(){sheet.hidden=true;inbox.hidden=true;cardEl.hidden=true;openG=null;}
 function claim(){hud?.closeSheet?.();win.dispatchEvent(new CustomEvent('xmas:sheet',{detail:{id:'gift'}}));}
 win.addEventListener('xmas:sheet',e=>{if(e.detail?.id!=='gift')closeAll();});

 // ── 보내기 창
 function people(){
  const me={x:player.x,z:player.z};
  return multi.joined?multi.people().filter(p=>!p.muted&&p.shown!==false&&p.sample).map(p=>({id:p.id,name:p.name,d:Math.hypot(p.sample.x-me.x,p.sample.z-me.z)})).sort((a,b)=>a.d-b.d):[];
 }
 function startSend(to=null){
  if(!multi.joined){hud?.say(GIFT_TEXT.solo,3);return false;}
  claim();Object.assign(S,{step:to?2:1,to,toName:to?multi.nameOf(to):'',item:null,card:'tree',text:'',preset:null,sending:false});
  sheet.hidden=false;inbox.hidden=true;cardEl.hidden=true;renderSend();return true;
 }
 const dots=()=>`<ol class="xg-dots" aria-label="단계">${['누구','선물','카드','확인'].map((t,i)=>`<li data-on="${i+1===S.step}" data-done="${i+1<S.step}">${i+1} ${t}</li>`).join('')}</ol>`;
 function renderSend(){
  const head=`<header>${S.step>1?'<button type="button" class="xh-x xg-back" data-g="back" aria-label="뒤로">←</button>':''}<b>${iconText('x-gift','선물 보내기')}</b><button type="button" class="xh-x" data-g="close" aria-label="닫기">✕</button></header>${dots()}`;
  let body='';
  if(S.step===1){const list=people();
   body=`<p class="xh-sub">누구에게 보낼까요? 지금 광장에 있는 사람에게만 보낼 수 있어요</p><ul class="xg-people">
    <li><button type="button" class="xg-row xg-all" data-to="*"><em aria-hidden="true">${icon('c-people',{size:'m'})}</em><span>광장 모두에게</span><small>모두의 카드 판에 걸려요</small></button></li>
    ${list.map(p=>`<li><button type="button" class="xg-row" data-to="${esc(p.id)}"><em aria-hidden="true">${icon('c-person',{size:'m'})}</em><span>${esc(p.name)}</span><small>${p.d<10?'가까이':`${Math.round(p.d)}m`}</small></button></li>`).join('')||'<li class="xh-empty">지금 광장에 다른 사람이 없어요</li>'}</ul>`;}
  else if(S.step===2){body=`<p class="xh-sub">${esc(S.to==='*'?'광장 모두':S.toName)}에게 무엇을 보낼까요?</p><div class="xg-items">${GIFT_ITEMS.map(k=>`<button type="button" class="xh-pick" data-item="${k}" aria-pressed="${S.item===k}"><em aria-hidden="true">${icon(GIFT_IC[k],{size:'xl'})}</em><span>${esc(GIFT_INFO[k].label)}</span></button>`).join('')}</div>`;}
  else if(S.step===3){const left=GIFT_RULES.textMax-[...S.text].length;
   body=`<p class="xh-sub">카드를 골라 한마디 적어 주세요</p><div class="xg-cards">${CARD_DESIGNS.map(k=>`<button type="button" class="xh-pick" data-card="${k}" aria-pressed="${S.card===k}"><em aria-hidden="true">${icon(CARD_IC[k],{size:'xl'})}</em><span>${CARD_INFO[k].label}</span></button>`).join('')}</div>
    <label class="xg-text"><textarea maxlength="${GIFT_RULES.textMax}" rows="2" placeholder="메리 크리스마스!" aria-label="카드 글">${esc(S.text)}</textarea><small data-left>${left}자 남음</small></label>
    <div class="xg-presets">${CARD_PRESETS.map((p,i)=>`<button type="button" class="xg-chip" data-preset="${i}">${esc(p)}</button>`).join('')}</div>
    <p class="xg-warn">전화번호·주소·SNS 아이디는 적지 마세요</p>
    <button type="button" class="xh-ok xg-next" data-g="next">다음</button>`;}
  else{const text=cleanCardText(S.text)||CARD_PRESETS[0];
   body=`<div class="xg-preview" data-card="${S.card}"><div class="xg-pic" aria-hidden="true">${icon(CARD_IC[S.card],{size:'xl'})}</div><p class="xg-to">${esc(S.to==='*'?'광장 모두':S.toName)}에게</p><p class="xg-msg">${esc(text)}</p><p class="xg-item">${iconText(GIFT_IC[S.item],GIFT_INFO[S.item].label,{size:'xs'})}</p></div>
    <button type="button" class="xh-ok xg-next" data-g="send" ${S.sending?'disabled':''}>${iconText('x-gift','보내기')}</button>`;}
  sheet.innerHTML=head+body;
  const ta=sheet.querySelector('textarea');if(ta){ta.addEventListener('input',()=>{S.text=ta.value;S.preset=null;sheet.querySelector('[data-left]').textContent=`${GIFT_RULES.textMax-[...ta.value].length}자 남음`;});}
 }
 sheet.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.to){S.to=b.dataset.to;S.toName=S.to==='*'?'광장 모두':multi.nameOf(S.to);S.step=2;renderSend();return;}
  if(b.dataset.item){S.item=b.dataset.item;S.step=3;renderSend();return;}
  if(b.dataset.card){S.card=b.dataset.card;const ta=sheet.querySelector('textarea');if(ta)S.text=ta.value;renderSend();return;}
  if(b.dataset.preset){S.text=CARD_PRESETS[+b.dataset.preset];renderSend();return;}
  switch(b.dataset.g){
   case 'close':closeAll();return;
   case 'back':S.step=Math.max(1,S.step-1);renderSend();return;
   case 'next':S.step=4;renderSend();return;
   case 'send':{if(S.sending)return;const text=cleanCardText(S.text)||CARD_PRESETS[0];
    if(!net.send({t:'gift:send',to:S.to,item:S.item,card:S.card,text})){hud?.say(GIFT_TEXT.offline,2.6);return;}
    S.sending=true;S.pending={to:S.to,name:S.toName};renderSend();return;}
  }
 });
 // 휴대폰 키보드: 글 칸이 가려지지 않게(시트가 위로)
 sheet.addEventListener('focusin',e=>{if(e.target.tagName==='TEXTAREA')sheet.classList.add('typing');});
 sheet.addEventListener('focusout',e=>{if(e.target.tagName==='TEXTAREA')sheet.classList.remove('typing');});

 // ── 받은 선물
 function showToast(g){toastGift=g;toast.innerHTML=`${iconText('x-gift',g.all?`${g.n}님이 광장 모두에게 카드를 걸었어요`:`${g.n}님에게서 선물이 왔어요`,{size:'xs'})}<button type="button" class="xh-mini" data-open="${esc(g.g)}">열어 보기</button>`;toast.hidden=false;toast.classList.remove('out');toastT=5;audio?.play('pop');}
 toast.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(!b)return;toast.hidden=true;const g=got.find(x=>x.g===b.dataset.open)??board.find(x=>x.g===b.dataset.open);if(g)openCard(g);});
 function renderInbox(){
  const list=got.slice().reverse();
  inbox.innerHTML=`<header><b>${iconText('x-mailbox',`받은 선물 ${got.length}`)}</b><button type="button" class="xh-x" data-g="close" aria-label="닫기">✕</button></header>
   <p class="xh-sub">받은 카드는 광장에 있는 동안만 남아요. 입는 선물은 이 기기에 남아요</p>
   <ul class="xg-people">${list.map(g=>`<li><button type="button" class="xg-row" data-open="${esc(g.g)}" data-new="${!g.opened}"><em aria-hidden="true">${icon(g.opened?GIFT_IC[g.item]:'x-gift',{size:'m'})}</em><span>${esc(g.n)}</span><small>${g.opened?esc(GIFT_INFO[g.item].label):'새 선물'}</small></button></li>`).join('')||'<li class="xh-empty">아직 받은 선물이 없어요</li>'}</ul>
   ${board.length?`<button type="button" class="xh-mini" data-g="board">${iconText('x-cards-all',`모두의 카드 ${board.length}장 보기`)}</button>`:''}`;
 }
 function renderBoard(){
  inbox.innerHTML=`<header><button type="button" class="xh-x xg-back" data-g="inbox" aria-label="뒤로">←</button><b>${iconText('x-cards-all','모두의 카드')}</b><button type="button" class="xh-x" data-g="close" aria-label="닫기">✕</button></header>
   <p class="xh-sub">광장 모두에게 온 카드예요. 선물은 한 사람이 한 번씩 받을 수 있어요</p>
   <ul class="xg-people">${board.slice().reverse().map(g=>`<li><button type="button" class="xg-row" data-open="${esc(g.g)}"><em aria-hidden="true">${icon(CARD_IC[g.card],{size:'m'})}</em><span>${esc(g.n)}</span><small>${boardTaken.has(g.g)?'받음':esc(GIFT_INFO[g.item].label)}</small></button></li>`).join('')||'<li class="xh-empty">아직 걸린 카드가 없어요</li>'}</ul>`;
 }
 inbox.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.open){const g=got.find(x=>x.g===b.dataset.open)??board.find(x=>x.g===b.dataset.open);if(g)openCard(g);return;}
  if(b.dataset.g==='close')closeAll();else if(b.dataset.g==='board')renderBoard();else if(b.dataset.g==='inbox')renderInbox();});
 function openInbox(boardView=false){claim();sheet.hidden=true;cardEl.hidden=true;inbox.hidden=false;boardView?renderBoard():renderInbox();}
 // ── 카드 열기(상자 → 리본 풀림 → 카드)
 function openCard(g){
  claim();sheet.hidden=true;inbox.hidden=true;openG=g;const first=!g.opened;g.opened=true;
  const fromBoard=board.includes(g),used=fromBoard?boardTaken.has(g.g):g.used,info=GIFT_INFO[g.item];
  const btn=info.wear?`<button type="button" class="xh-ok" data-use="1">${used?'다시 입기':'입어 보기'}</button>`:info.tree?`<button type="button" class="xh-ok" data-use="1" ${used?'disabled':''}>${used?'트리에 달았어요':'트리에 달기'}</button>`
   :info.cocoa?`<button type="button" class="xh-ok" data-use="1" ${used?'disabled':''}>${used?'받았어요':'코코아 받기'}</button>`:`<button type="button" class="xh-ok" data-use="1" ${used?'disabled':''}>${used?'모았어요':'스티커 모으기'}</button>`;
  cardEl.innerHTML=`<div class="xg-box${first?' fresh':''}" aria-hidden="true"><i class="xg-lid"></i><i class="xg-ribbon"></i><b class="xg-pop">${icon(GIFT_IC[g.item],{size:'xl'})}</b></div>
   <div class="xg-paper" data-card="${g.card}"><div class="xg-pic" aria-hidden="true">${icon(CARD_IC[g.card],{size:'xl'})}</div>
    <p class="xg-from">${esc(g.n)}${g.all?' · 광장 모두에게':''}</p><p class="xg-msg">${esc(g.text)}</p><p class="xg-item">${iconText(GIFT_IC[g.item],info.label,{size:'xs'})}</p>
    <button type="button" class="xg-more" data-g="more" aria-label="더 보기" aria-expanded="false">⋯</button>
    <div class="xg-menu" hidden><button type="button" class="xh-mini" data-g="mute">${iconText('c-mute-person','이 사람 음소거')}</button><button type="button" class="xh-mini" data-g="report">${iconText('c-report','신고')}</button></div></div>
   <div class="xh-row xg-acts">${btn}<button type="button" class="xh-no" data-g="close">닫기</button></div>`;
  cardEl.hidden=false;if(first)audio?.play('open');renderBadge();
 }
 cardEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!openG)return;const g=openG,info=GIFT_INFO[g.item],fromBoard=board.includes(g);
  if(b.dataset.use){
   if(info.wear){wear(g.item);hud?.say(`${info.label}을(를) 입었어요 · 옷장에 남아요`,2.4);}
   else if(info.tree){if(fromBoard&&!net.serverMode)net.giveBonus();treeBonus();hud?.say('트리 옆에서 「장식 달기」를 누르면 선물 오너먼트를 달 수 있어요',3.2);}
   else if(info.cocoa){cocoa(1);hud?.say('모닥불에 앉으면 「코코아」를 마실 수 있어요',3,'x-cocoa');}
   else hud?.say('눈송이 스티커를 모았어요',2,'x-orn-snow');
   if(fromBoard)boardTaken.add(g.g);else g.used=true;closeAll();return;}
  switch(b.dataset.g){
   case 'close':closeAll();return;
   case 'more':{const m=cardEl.querySelector('.xg-menu');m.hidden=!m.hidden;b.setAttribute('aria-expanded',String(!m.hidden));return;}
   case 'mute':multi.mute(g.id);hud?.say('음소거했어요. 이 사람은 더 보이지 않아요');closeAll();return;
   case 'report':multi.report(g.id);hud?.say(multi.viaServer?'신고를 보내고 음소거했어요':'신고를 기록하고 음소거했어요(이 기기에만)');closeAll();return;
  }
 });
 const unopened=()=>got.filter(g=>!g.opened).length;
 function renderBadge(){hud?.setBadge?.('inbox',unopened());}
 // ── 3D: 우체통 깃발·모두의 카드 판
 function raiseFlag(){flagT=2.6;}
 // 판의 카드 칸(월드아트 card-0~4)은 걸린 카드 수만큼만 보인다
 function paintBoard(){const cards=village?.cardBoard?.cards??[];cards.forEach((c,i)=>{c.visible=i<board.length;});}

 net.on(m=>{
  switch(m.t){
   case 'gift':{const g=sanitizeGift(m);if(!g||isMuted(g.id))return; // 음소거한 사람 선물은 조용히 안 받음
    if(g.all){if(!board.some(x=>x.g===g.g)){board.push(g);while(board.length>GIFT_RULES.board)board.shift();paintBoard();}showToast(g);return;}
    if(got.some(x=>x.g===g.g))return;
    if(GIFT_INFO[g.item].tree&&!net.serverMode)net.giveBonus();
    got.push({...g,opened:false,used:false});while(got.length>GIFT_RULES.inboxMax)got.shift();showToast(g);renderBadge();if(!inbox.hidden)renderInbox();return;}
   case 'gift:ok':{const p=S.pending;S.sending=false;S.pending=null;closeAll();audio?.play('mail',{at:{x:MAILBOX.x,z:MAILBOX.z}});
    hud?.say(p?.to==='*'?'광장 모두에게 카드를 걸었어요':`${p?.name??'그 사람'}에게 선물을 보냈어요`,2.6,p?.to==='*'?'x-cards-all':'x-gift');return;}
   case 'gift:no':S.sending=false;S.pending=null;if(!sheet.hidden)renderSend();hud?.say(giftDeniedText(m),3);return;
   case 'gift:post':raiseFlag();if(m.id!==multi.id)audio?.play('mail',{at:{x:MAILBOX.x,z:MAILBOX.z},gain:.7});return;
   case 'board':{if(!Array.isArray(m.c))return;board=m.c.map(sanitizeGift).filter(Boolean).filter(g=>!isMuted(g.id)).map(g=>({...g,all:true}));paintBoard();if(!inbox.hidden&&inbox.querySelector('.xg-back'))renderBoard();return;}
  }
 });
 win.addEventListener('xmas:multi-leave',()=>{got.length=0;board=[];paintBoard();renderBadge();closeAll();});
 paintBoard();
 return {
  startSend,openInbox,openCard,closeAll,
  get open(){return open();},get unopened(){return unopened();},get inbox(){return got;},get board(){return board;},get step(){return S.step;},
  update(dt){
   if(toastT>0){toastT-=dt;if(toastT<=.4)toast.classList.add('out');if(toastT<=0)toast.hidden=true;}
   if(flagT>0){flagT-=dt;const k=flagT>2.2?(2.6-flagT)/.4:flagT<.5?flagT/.5:1;village?.mailbox?.setFlag(k);}
  },
  status(){return {open:open(),step:sheet.hidden?null:S.step,inbox:got.length,unopened:unopened(),board:board.length,pending:!!S.pending};},
 };
}
