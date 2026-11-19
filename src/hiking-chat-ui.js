// 등산 채팅 HUD: 💬 버튼(함께 걷기에 참가했을 때만) → 공통 말하기 줄(입력칸·보내기·✕, 줄 위 지난 말 3줄) + 말한 사람 머리 위 말풍선(4초).
// 11-19 채팅 통일(대표 확정): 큰 창·기록 상자·빠른 말 칩을 없애고 세 콘텐츠가 같은 줄·같은 말풍선(.uf-bub)을 쓴다. 기록은 30줄 들고 있되 화면엔 3줄.
// 연결 코드(multi-client.js)와는 window 이벤트로만 만난다.
//  - 보냄: 'hiking:chat-send' {text}
//  - 받음: 'hiking:chat' {id,name,text,me,remote} · 'hiking:chat-limit' {reason:'rate'|'offline'|'repeat'|'mute',wait} · 'hiking:multi-status' · 'hiking:multi-leave'
//  - 머리 위 위치: window.hiking.multiApi.screenPos(id) → {x,y,visible}
// 색·글꼴은 등산 수첩 토큰(낮·노을·밤)을 따른다. 사양: docs/변경기록-2026-11-08-등산채팅-HUD.md
import {icon} from './icons/icon.js';
import {createChatBar,openWin,closeWin,onWin} from './ui-frame.js';
export const LOG_MAX=30,TEXT_MAX=80,BUBBLE_MS=4000;
// 채팅 제한 문구(11-16: 같은 말 반복·30초 쉬기 추가, 등산·흡연장·크리스마스 공통). wait = 남은 초(서버가 알려 줌)
export const LIMIT_TEXT={rate:'잠깐만요, 조금 천천히',offline:'연결이 끊겨서 지금은 보낼 수 없어요',repeat:'같은 말은 연속 두 번까지만 보낼 수 있어요',mute:'채팅을 잠깐 쉬어요'};
const clean=s=>String(s??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g,'').replace(/\s+/g,' ').trim();
export const cleanText=raw=>[...clean(raw)].slice(0,TEXT_MAX).join('');
// 기록에 한 줄 더하고 최근 30줄만 남긴다(새 배열을 돌려준다).
export const pushLog=(list,row,max=LOG_MAX)=>[...list,row].slice(-max);
export const limitText=(reason,wait=0)=>reason==='mute'?`${LIMIT_TEXT.mute} · ${Math.max(1,Math.ceil(wait||30))}초 뒤에 다시 쓸 수 있어요`:LIMIT_TEXT[reason]??LIMIT_TEXT.rate;
// 받은 detail → 기록 줄. 글이 비면 null.
export function chatRow(d){
 const text=cleanText(d?.text);if(!text)return null;
 return {id:String(d.id??''),name:cleanText(d.name)||'등산객',text,me:!!d.me};
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// 다른 체험도 같은 채팅을 쓴다(11-16 크리스마스): ns = 이벤트 앞말('hiking' → 'hiking:chat' …), cls = 단추·줄에 더할 class(자리·색 덮기),
// notice = 처음 열 때 지난 말 자리에 한 번 보이는 회색 안내 줄(크리스마스 「전화번호·주소…」).
// bubbleFor(id) = 말풍선 보이는 시간을 사람마다 다르게(11-16 크리스마스 모닥불 둘레: {ms:6000}). 없으면 4초. 모양은 세 콘텐츠 공통 .uf-bub 하나.
// frame = 공통 화면 틀(src/ui-frame.js). 있으면 💬는 틀의 위 오른쪽 줄에 놓는다. 채팅 줄은 늘 공통 말하기 줄(createChatBar, 11-19 채팅 통일).
export function installHikingChat({doc=document,win=window,lookup=id=>win.hiking?.multiApi?.screenPos?.(id)??null,raf=win.requestAnimationFrame?.bind(win),
 ns='hiking',cls='',notice='',bubbleFor=null,frame=null}={}){
 const body=doc.body;if(!body||doc.querySelector('.hc-btn'))return null;
 const EV=n=>`${ns}:${n}`;
 import('./hiking-chat-ui.css');
 const mk=(tag,cls,html='')=>{const e=doc.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
 let joined=false,left=false,open=false,unread=0,log=[];

 const btn=mk('button','hc-btn uf-chat-btn'+(cls?' '+cls:''),`<span aria-hidden="true">${icon('c-chat',{size:'m'})}</span><i class="hc-dot" hidden></i>`);
 btn.type='button';btn.hidden=true;btn.setAttribute('aria-label','채팅 열기');btn.setAttribute('aria-expanded','false');
 const bar=createChatBar({doc,win,maxLength:TEXT_MAX,cls:'hc-panel'+(cls?' '+cls:''),notice,onSay:t=>send(t),onClose:()=>setOpen(false)});
 const panel=bar.el;
 const layer=mk('div','hc-bubbles');layer.setAttribute('aria-hidden','true');
 body.append(layer,panel);
 if(frame){frame.chatSlot.replaceWith(btn);frame.watchChat?.(panel);}else body.append(btn);
 const form=bar.form,input=bar.input,dot=btn.querySelector('.hc-dot');
 // 글자를 치는 동안 단축키(R·C·F…)가 걷기에 먹히지 않게 한다(multi-entry-ui와 같은 방식). Esc만 접기에 쓴다.
 // Enter: 글이 있으면 form이 보내고, 빈 칸이면 창을 접어 걷기로 돌아간다(한글 조합 중 Enter는 건드리지 않음).
 for(const ev of ['keydown','keyup','keypress'])input.addEventListener(ev,e=>{
  if(ev==='keydown'&&e.code==='Escape'){e.stopPropagation();setOpen(false);return;}
  if(ev==='keydown'&&e.key==='Enter'&&!e.isComposing&&e.keyCode!==229&&!cleanText(input.value)){e.preventDefault();e.stopPropagation();setOpen(false);return;}
  e.stopPropagation();
 });
 // PC: 함께 걷기 중 Enter → 채팅 창을 열고 바로 입력칸에. 다른 입력칸·버튼에 포커스가 있으면 그쪽 Enter를 그대로 둔다.
 const typingElsewhere=()=>{const a=doc.activeElement;return !!a&&a!==body&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(a.tagName));};
 win.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.repeat||e.isComposing||e.altKey||e.ctrlKey||e.metaKey||!joined||typingElsewhere())return;
  e.preventDefault();if(!open)setOpen(true);input.focus();
 });

 function renderBtn(){
  btn.hidden=!joined;btn.classList.toggle('on',open);btn.setAttribute('aria-expanded',String(open));
  btn.setAttribute('aria-label',open?'채팅 접기':unread?`채팅 열기 · 새 글 ${unread}`:'채팅 열기');dot.hidden=!unread||open;
 }
 function setOpen(on){
  const was=open;open=!!on&&joined;bar.show(open);body.classList.toggle('hc-open',open);
  if(open){unread=0;win.dispatchEvent(new CustomEvent(EV('sheet'),{detail:{id:null}}));renderLog();if(!was)openWin('chat',{doc,win});}
  else{bar.hint('');if(was)closeWin('chat',{doc,win});}
  renderBtn();
 }
 onWin('chat',()=>{if(open)setOpen(false);},{win}); // 다른 창(메뉴·지도…)이 열리면 접힌다
 btn.addEventListener('click',()=>setOpen(!open)); // 휴대폰은 입력칸을 눌러야 키보드가 오른다(PC는 bar.show가 입력칸에 둠)

 // ── 기록(줄 위 지난 말 3줄)
 const renderLog=()=>bar.lines(log);
 const showHint=t=>bar.hint(t);

 // ── 말풍선(머리 위 4초). 같은 사람의 새 말은 풍경 위 같은 풍선을 갈아 끼운다.
 const bubbles=new Map();let ticking=false;
 function bubble(row){
  let o=bubbles.get(row.id);
  if(!o){o={el:mk('div','uf-bub hc-bub')};layer.append(o.el);bubbles.set(row.id,o);}
  const opt=bubbleFor?.(row.id)??null;
  o.until=performance.now()+(opt?.ms??BUBBLE_MS);o.el.classList.remove('out');o.el.dataset.me=row.me?'1':'';
  o.el.innerHTML=`<small>${esc(row.me?'나':row.name)}</small>${esc(row.text)}`;
  void o.el.offsetWidth;o.el.classList.add('on');
  if(!ticking&&raf){ticking=true;raf(tick);}
 }
 function tick(){
  const now=performance.now();
  for(const [id,o] of bubbles){
   if(now>=o.until){o.el.remove();bubbles.delete(id);continue;}
   const p=lookup(id);
   if(!p||!p.visible){o.el.style.display='none';continue;}
   o.el.style.display='';o.el.classList.toggle('out',o.until-now<250);
   o.el.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,-100%)`;
  }
  if(bubbles.size&&raf)raf(tick);else ticking=false;
 }

 // ── 보내기
 // 막힌 글은 입력칸에 되돌려 다시 보낼 수 있게 한다(체험설계 §8-1). 30초 쉬기 동안은 입력칸·보내기를 잠근다.
 let lastSent='',muteUntil=0,muteT=0;
 const send=raw=>{const text=cleanText(raw);if(!text||performance.now()<muteUntil)return false;lastSent=text;win.dispatchEvent(new CustomEvent(EV('chat-send'),{detail:{text}}));return true;};
 function lockFor(sec){muteUntil=performance.now()+sec*1000;clearInterval(muteT);
  const step=()=>{const left=Math.ceil((muteUntil-performance.now())/1000),on=left>0;
   input.disabled=on;form.querySelector('[type=submit]').disabled=on;
   input.placeholder=on?`${left}초 뒤에 다시 쓸 수 있어요`:'한마디 해 보세요';if(!on)clearInterval(muteT);};
  step();muteT=setInterval(step,500);}

 // ── 받기
 win.addEventListener(EV('chat'),e=>{
  if(!joined)return;const row=chatRow(e.detail);if(!row)return;
  log=pushLog(log,row);if(open)renderLog();else{unread=Math.min(99,unread+1);renderBtn();}
  bubble(row);
 });
 win.addEventListener(EV('chat-limit'),e=>{const d=e.detail??{},t=limitText(d.reason,d.wait);if(open)showHint(t);else{open=false;setOpen(true);showHint(t);}
  if(d.reason!=='offline'&&lastSent&&!cleanText(input.value)){input.value=lastSent;}
  if(d.reason==='mute')lockFor(Number(d.wait)||30);});
 win.addEventListener(EV('multi-status'),e=>{
  const d=e.detail;if(!d||!['connecting','online','reconnecting','offline','full'].includes(d.state))return;
  if(left&&d.state!=='connecting')return; // 나가기 뒤에 늦게 오는 'offline'은 무시
  left=false;const was=joined;joined=d.state!=='full';if(!joined)setOpen(false);if(joined&&!was)log=[];renderBtn();
 });
 win.addEventListener(EV('multi-join'),()=>{left=false;});
 win.addEventListener(EV('multi-leave'),()=>{joined=false;left=true;log=[];unread=0;setOpen(false);for(const o of bubbles.values())o.el.remove();bubbles.clear();renderBtn();});
 // 휴대폰 키보드: 줄을 키보드 바로 위에 붙이는 것은 공통 틀(ui-frame.js의 visualViewport → <html data-uf-kb>)이 맡는다.
 renderBtn();
 return {open:()=>setOpen(true),close:()=>setOpen(false),bubble:row=>bubble(row),hasBubble:id=>bubbles.has(id),get isOpen(){return open;},get joined(){return joined;},get log(){return log;}};
}
