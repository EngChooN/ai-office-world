// 등산 채팅 HUD: 💬 버튼(함께 걷기에 참가했을 때만) → 채팅 창(기록 30줄·빠른 말 칩·입력) + 말한 사람 머리 위 말풍선(4초).
// 연결 코드(multi-client.js)와는 window 이벤트로만 만난다.
//  - 보냄: 'hiking:chat-send' {text}
//  - 받음: 'hiking:chat' {id,name,text,me,remote} · 'hiking:chat-limit' {reason:'rate'|'offline'|'repeat'|'mute',wait} · 'hiking:multi-status' · 'hiking:multi-leave'
//  - 머리 위 위치: window.hiking.multiApi.screenPos(id) → {x,y,visible}
// 색·글꼴은 등산 수첩 토큰(낮·노을·밤)을 따른다. 사양: docs/변경기록-2026-11-08-등산채팅-HUD.md
import {icon,iconText} from './icons/icon.js';
export const LOG_MAX=30,TEXT_MAX=80,BUBBLE_MS=4000;
export const QUICK=['안녕하세요','같이 가요','정상에서 봐요','쉬었다 가요','👍'];
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

// 다른 체험도 같은 창을 쓴다(11-16 크리스마스): ns = 이벤트 앞말('hiking' → 'hiking:chat' …), title·quick = 창 제목·빠른 말, cls = 단추·창에 더할 class(자리·색 덮기),
// titleIcon = 창 제목 앞 아이콘 이름(기본 c-chat, 옛 호출처럼 제목 앞에 💬 글자가 붙어 오면 떼고 아이콘으로 그림).
// chipSelector = 💬 단추를 옆에 붙일 상태 칩(없으면 CSS 기본 자리).
// bubbleFor(id) = 말풍선을 사람마다 다르게(11-16 크리스마스 모닥불 둘레: {ms:6000,big:true}). 없으면 4초·보통 크기(등산·흡연장 그대로).
export function installHikingChat({doc=document,win=window,lookup=id=>win.hiking?.multiApi?.screenPos?.(id)??null,raf=win.requestAnimationFrame?.bind(win),
 ns='hiking',title='같이 걷는 사람들',titleIcon='c-chat',quick=QUICK,cls='',chipSelector='.me-chip',notice='',bubbleFor=null}={}){
 const body=doc.body;if(!body||doc.querySelector('.hc-btn'))return null;
 const EV=n=>`${ns}:${n}`;
 import('./hiking-chat-ui.css');
 const mk=(tag,cls,html='')=>{const e=doc.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
 let joined=false,left=false,open=false,unread=0,log=[],hintT=0;

 const btn=mk('button','hc-btn'+(cls?' '+cls:''),`<span aria-hidden="true">${icon('c-chat',{size:'m'})}</span><i class="hc-dot" hidden></i>`);
 btn.type='button';btn.hidden=true;btn.setAttribute('aria-label','채팅 열기');btn.setAttribute('aria-expanded','false');
 const panel=mk('section','hc-panel'+(cls?' '+cls:''),`<h4><span>${titleIcon?iconText(titleIcon,String(title).replace(/^💬\s*/,''),{size:'s'}):esc(title)}</span><button type="button" class="hc-x" aria-label="채팅 접기">✕</button></h4>
  ${notice?`<p class="hc-notice">${esc(notice)}</p>`:''}<div class="hc-log" role="log" aria-live="polite"></div>
  <div class="hc-hint" role="status" aria-live="polite" hidden></div>
  <div class="hc-chips" aria-label="빠른 말">${quick.map(t=>`<button type="button" class="hc-chip" data-say="${esc(t)}">${esc(t)}</button>`).join('')}</div>
  <form class="hc-form" autocomplete="off"><input type="text" name="text" maxlength="${TEXT_MAX}" enterkeyhint="send" placeholder="한마디 해 보세요" autocapitalize="off" spellcheck="false" aria-label="채팅 입력"><button type="submit" class="hc-send">보내기</button></form>`);
 panel.hidden=true;
 const layer=mk('div','hc-bubbles');layer.setAttribute('aria-hidden','true');
 body.append(layer,panel,btn);
 const logEl=panel.querySelector('.hc-log'),hint=panel.querySelector('.hc-hint'),form=panel.querySelector('form'),input=form.elements.text,dot=btn.querySelector('.hc-dot');
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

 // ── 💬 버튼: 연결 상태 칩 옆(칩이 없으면 기본 자리)
 const chipEl=()=>chipSelector?doc.querySelector(chipSelector):null;
 function placeBtn(){
  const c=chipEl();
  if(c&&!c.hidden){const r=c.getBoundingClientRect();if(r.width){btn.style.left=`${Math.round(r.right+8)}px`;btn.style.top=`${Math.round(r.top+(r.height-44)/2)}px`;btn.style.bottom='auto';btn.style.right='auto';return;}}
  btn.style.left=btn.style.top=btn.style.bottom=btn.style.right='';
 }
 const ro=win.ResizeObserver?new win.ResizeObserver(placeBtn):null;
 function renderBtn(){
  btn.hidden=!joined;btn.classList.toggle('on',open);btn.setAttribute('aria-expanded',String(open));
  btn.setAttribute('aria-label',open?'채팅 접기':unread?`채팅 열기 · 새 글 ${unread}`:'채팅 열기');dot.hidden=!unread||open;placeBtn();
  const c=chipEl();if(c&&ro&&!c._hcObserved){ro.observe(c);c._hcObserved=true;}
 }
 function setOpen(on){
  open=!!on&&joined;panel.hidden=!open;body.classList.toggle('hc-open',open);
  if(open){unread=0;win.dispatchEvent(new CustomEvent(EV('sheet'),{detail:{id:null}}));renderLog();setTimeout(fit,0);}
  else{input.blur();hint.hidden=true;}
  renderBtn();
 }
 btn.addEventListener('click',()=>{setOpen(!open);if(open&&!matchMediaCoarse())input.focus();});
 panel.querySelector('.hc-x').addEventListener('click',()=>setOpen(false));
 const matchMediaCoarse=()=>!!win.matchMedia?.('(pointer:coarse)').matches; // 휴대폰은 열자마자 키보드가 올라오지 않게 칩부터 보인다

 // ── 기록
 function renderLog(){
  logEl.innerHTML=log.map(r=>`<p class="${r.me?'me':''}"><b>${esc(r.name)}</b> ${esc(r.text)}</p>`).join('')||'<p class="hc-empty">아직 말이 없어요. 칩을 눌러 인사해 보세요.</p>';
  logEl.scrollTop=logEl.scrollHeight;
 }
 function showHint(t){hint.textContent=t;hint.hidden=false;clearTimeout(hintT);hintT=setTimeout(()=>{hint.hidden=true;},2400);}

 // ── 말풍선(머리 위 4초). 같은 사람의 새 말은 풍경 위 같은 풍선을 갈아 끼운다.
 const bubbles=new Map();let ticking=false;
 function bubble(row){
  let o=bubbles.get(row.id);
  if(!o){o={el:mk('div','hc-bub')};layer.append(o.el);bubbles.set(row.id,o);}
  const opt=bubbleFor?.(row.id)??null;
  o.until=performance.now()+(opt?.ms??BUBBLE_MS);o.el.classList.remove('out');o.el.classList.toggle('big',!!opt?.big);o.el.dataset.me=row.me?'1':'';
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
 // 막힌 글은 입력칸에 되돌려 다시 보낼 수 있게 한다(체험설계 §8-1). 30초 쉬기 동안은 입력칸·칩을 잠근다.
 let lastSent='',muteUntil=0,muteT=0;
 const send=raw=>{const text=cleanText(raw);if(!text||performance.now()<muteUntil)return false;lastSent=text;win.dispatchEvent(new CustomEvent(EV('chat-send'),{detail:{text}}));return true;};
 form.addEventListener('submit',e=>{e.preventDefault();if(send(input.value))input.value='';input.focus();});
 function lockFor(sec){muteUntil=performance.now()+sec*1000;clearInterval(muteT);
  const step=()=>{const left=Math.ceil((muteUntil-performance.now())/1000),on=left>0;
   input.disabled=on;form.querySelector('.hc-send').disabled=on;panel.querySelectorAll('.hc-chip').forEach(b=>b.disabled=on);
   input.placeholder=on?`${left}초 뒤에 다시 쓸 수 있어요`:'한마디 해 보세요';if(!on)clearInterval(muteT);};
  step();muteT=setInterval(step,500);}
 panel.querySelector('.hc-chips').addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b)send(b.dataset.say);});

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
 win.addEventListener('resize',placeBtn);
 // 휴대폰 키보드: 보이는 영역 아래에 맞춰 창을 올리고 높이를 줄인다.
 const vv=win.visualViewport;
 function fit(){
  if(!vv)return;
  const kb=Math.max(0,win.innerHeight-vv.height-vv.offsetTop);
  panel.style.setProperty('--hc-kb',`${Math.round(kb)}px`);panel.style.setProperty('--hc-vh',`${Math.round(vv.height)}px`);
  panel.classList.toggle('kb',kb>80);
  if(kb>80&&panel.contains(doc.activeElement))form.scrollIntoView({block:'nearest'});
 }
 vv?.addEventListener('resize',fit);vv?.addEventListener('scroll',fit);
 input.addEventListener('focus',()=>{setTimeout(fit,250);});input.addEventListener('blur',()=>setTimeout(fit,150));
 renderBtn();
 return {open:()=>setOpen(true),close:()=>setOpen(false),bubble:row=>bubble(row),hasBubble:id=>bubbles.has(id),get isOpen(){return open;},get joined(){return joined;},get log(){return log;}};
}
