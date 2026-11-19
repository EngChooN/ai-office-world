// 온라인 시리즈 공통 화면 틀(흡연장·등산·크리스마스, 2026-11-18 대표 결정 · 시안 docs/UI-개선/온라인시리즈-UI-개선-시안-v1.html).
// 자리: 위 = 상태 알약(왼쪽)·공통 단추(오른쪽: 콘텐츠 1칸 · 💬 · ☰) / 왼쪽 아래 = 걷기(비워 둠) / 오른쪽 아래 = 할 일(큰 단추 1 + 작은 단추, 할 일 칩).
// 이 파일이 맡는 것(콘텐츠와 상관없는 틀):
//  - 위 오른쪽 단추 줄 .uf-tr (콘텐츠 전용 칸 → 💬 자리 → ☰)
//  - ☰ 메뉴 창 .uf-sheet: 세로는 아래에서 올라오는 창(화면 절반 이하), 가로는 오른쪽 창(340px). 안에 탭. 바깥 게임을 누르면 닫힘
//  - 창은 한 번에 하나: 창을 여는 모듈은 openWin(이름)으로 알리고, onWin(이름, 닫기)로 다른 창이 열릴 때 스스로 닫는다('uf:win' 이벤트)
//    <html data-uf-win="이름" data-uf-heavy> → 무거운 창(메뉴·지도·사람 목록 등)이면 행동 단추·할 일 칩을 숨기고, 채팅(가벼운 창)이면 큰 단추만 작게 남긴다(ui-frame.css)
//  - 휴대폰 키보드: visualViewport로 높이를 재서 <html data-uf-kb>·--uf-kb. 말하기 줄만 키보드 위에 붙고 나머지는 숨김
//  - 행동 단추 자리 매기기 ufPlace(): 단추에 data-uf="big|s1..s5|todo"를 달면 CSS가 오른쪽 아래 원 둘레에 놓는다
// 콘텐츠별 규칙(무슨 단추·무슨 탭인지)은 각 콘텐츠가 정한다. 이 틀은 자리와 열림·닫힘만 안다.
import {icon} from './icons/icon.js';
// CSS는 브라우저에서만(노드 테스트가 이 파일을 읽을 수 있게 — hiking-chat-ui 등과 같은 방식)
const loadCss=()=>{if(globalThis.document&&!loadCss.done){loadCss.done=true;import('./ui-frame.css').catch(()=>{});}};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 무거운 창: 열려 있는 동안 행동 단추·할 일 칩을 숨기는 창(시안 「창 우선순위 규칙」). 채팅만 가벼운 창
export const LIGHT_WINS=Object.freeze(['chat']);
export const isHeavy=name=>!!name&&!LIGHT_WINS.includes(name);
// 작은 단추 자리 수(시안: 작은 단추 최대 3, 넘치면 같은 줄 왼쪽으로 2칸까지)
export const SMALL_SLOTS=Object.freeze(['s1','s2','s3','s4','s5']);

// ── 창 하나만 규칙(모듈 사이 약속은 window 이벤트 하나) ──
let curWin=null;
export function openWin(name,{doc=document,win=window}={}){
 if(!name)return;
 curWin=name;const r=doc.documentElement;r.dataset.ufWin=name;r.toggleAttribute('data-uf-heavy',isHeavy(name));
 win.dispatchEvent(new CustomEvent('uf:win',{detail:{name}}));
}
export function closeWin(name,{doc=document,win=window}={}){
 if(curWin!==name)return;
 curWin=null;const r=doc.documentElement;delete r.dataset.ufWin;r.removeAttribute('data-uf-heavy');
 win.dispatchEvent(new CustomEvent('uf:win',{detail:{name:null,closed:name}}));
}
// 다른 창이 열리면 close()를 부른다. 돌려준 함수로 듣기를 그만둔다
export function onWin(name,close,{win=window}={}){
 const f=e=>{const n=e.detail?.name;if(n&&n!==name)close();};
 win.addEventListener('uf:win',f);return ()=>win.removeEventListener('uf:win',f);
}
export const currentWin=()=>curWin;

// ── 행동 단추 자리 ──
// big: 큰 단추 하나, small: 작은 단추(앞에서부터 s1·s2·s3…), todo: 할 일 칩(위로 쌓임). label: 단추 아래 짧은 글(없으면 원래 글자)
// 전에 자리가 있던 단추 중 이번 목록에 없는 것은 자리를 뺀다(scope 안에서만)
export function ufPlace(scope,{big=null,small=[],todo=[],labels=new Map()}={}){
 const seen=new Set();
 const put=(el,slot,k=0)=>{if(!el)return;seen.add(el);if(el.dataset.uf!==slot)el.dataset.uf=slot;el.style.setProperty('--uf-k',String(k));const t=labels.get(el);if(t!=null){if(el.dataset.ufT!==t)el.dataset.ufT=t;}else if(el.dataset.ufT!=null&&!el.hasAttribute('data-uf-keep'))delete el.dataset.ufT;};
 put(big,'big');
 small.filter(Boolean).slice(0,SMALL_SLOTS.length).forEach((el,i)=>put(el,SMALL_SLOTS[i]));
 todo.filter(Boolean).forEach((el,i)=>put(el,'todo',i));
 for(const el of scope?.querySelectorAll?.('[data-uf]')??[])if(!seen.has(el)){delete el.dataset.uf;el.style.removeProperty('--uf-k');}
}

// ── 말하기 줄(세 콘텐츠 공통 모양, 11-19 채팅 통일 · 시안 docs/UI-개선/채팅-통일-시안-v1.html v1.1) ──
// 열면 화면 맨 아래 한 줄: 입력칸 + 빨간 보내기 + ✕ 닫기 세 개뿐(빠른 말 칩은 없앰). 키보드가 오르면 키보드 바로 위.
// 지난 말은 줄 위 반투명 띠 최근 3줄(키보드가 오르면 세로 2줄·가로 숨김, CSS). 나머지는 머리 위 말풍선(.uf-bub).
// 입력칸은 열면 늘 보이고, 휴대폰은 입력칸을 눌러야 키보드가 오른다(PC는 열면 바로 입력칸에).
// onSay(text) → 보냈으면 true. onClose() → ✕를 눌렀을 때. notice = 처음 열 때 지난 말 자리에 한 번 보이는 회색 안내 줄.
export const CHAT_LINES=3;
export function createChatBar({doc=document,win=window,onSay=()=>false,onClose=()=>{},maxLength=80,placeholder='한마디 해 보세요',cls='',notice=''}={}){
 loadCss();
 const el=doc.createElement('section');el.className=`uf-chatbar${cls?' '+cls:''}`;el.hidden=true;el.setAttribute('aria-label','말하기');
 el.innerHTML=`<div class="uf-lines" aria-live="polite"></div>
<form class="uf-type" autocomplete="off"><input type="text" name="text" maxlength="${maxLength}" enterkeyhint="send" placeholder="${esc(placeholder)}" autocapitalize="off" spellcheck="false" aria-label="채팅 입력"><button type="submit" class="uf-send">보내기</button><button type="button" class="uf-close" aria-label="채팅 닫기">${icon('c-close',{size:'s',fallback:'✕'})}</button></form>`;
 const linesEl=el.querySelector('.uf-lines'),form=el.querySelector('form'),input=form.elements.text;
 const fine=()=>!!win.matchMedia?.('(hover:hover) and (pointer:fine)').matches;
 let rows=[],hintText='',hintT=0,noticeLeft=!!notice;
 const render=()=>{
  const list=rows.slice(-CHAT_LINES);
  linesEl.innerHTML=(noticeLeft&&!list.length?`<p class="note">${esc(notice)}</p>`:'')
   +list.map((r,i)=>`<p class="${r.me?'me':''}${i===0&&list.length>=CHAT_LINES?' old':''}"><b>${esc(r.me?'나':r.name)}</b>${esc(r.text)}</p>`).join('')
   +(hintText?`<p class="hint" role="status">${esc(hintText)}</p>`:'');
 };
 form.addEventListener('submit',e=>{e.preventDefault();if(onSay(input.value))input.value='';input.focus();});
 el.querySelector('.uf-close').addEventListener('click',()=>onClose());
 // 게임 화면을 한 번 누르면 키보드가 내려간다(입력칸 밖을 누르면 blur)
 doc.addEventListener('pointerdown',e=>{if(doc.activeElement===input&&!el.contains(e.target))input.blur();},true);
 return {el,input,form,
  show(on){const was=!el.hidden;el.hidden=!on;if(on){render();if(fine())input.focus();}else{input.blur();if(was)noticeLeft=false;}}, // 안내 줄은 처음 한 번 열었다 닫으면 끝
  // rows: [{name,text,me}] 최근 것만 그린다
  lines(r){rows=r??[];render();},
  // 잠깐 보이는 알림 줄(보내기 제한 등)
  hint(t,ms=2400){hintText=String(t??'');render();clearTimeout(hintT);if(hintText)hintT=setTimeout(()=>{hintText='';render();},ms);},
 };
}

// ── 틀 만들기 ──
// exp: 'smoking'|'hiking'|'christmas'
// extra: 콘텐츠 전용 위 단추 [{id,ic,label,onClick}] (💬 앞에 놓임, 크리스마스 🗺 지도)
// tabs: ☰ 메뉴 탭 [{id,label,ic,render(body),onOpen?(body),onClose?()}]. render는 처음 열 때 한 번, onOpen은 열 때마다
// quick: 메뉴 맨 위 빠른 줄(등산 소리·라디오·시각) render(el) — 없으면 안 그림
export function createUiFrame({doc=document,win=window,exp='',extra=[],tabs=[],quick=null,menuLabel='메뉴'}={}){
 loadCss();
 const root=doc.documentElement;root.classList.add('uf');if(exp)root.dataset.ufExp=exp;
 const mk=(tag,cls,html='')=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(html)e.innerHTML=html;return e;};
 // 위 오른쪽 단추 줄: [전용 칸][💬 자리][☰]
 const tr=mk('div','uf-tr');tr.setAttribute('role','toolbar');tr.setAttribute('aria-label','메뉴 단추');
 const extraBtns=new Map();
 for(const x of extra){const b=mk('button','uf-rb uf-extra',icon(x.ic,{size:'m',fallback:x.fb}));b.type='button';b.dataset.ufBtn=x.id;b.setAttribute('aria-label',x.label);b.title=x.label;b.addEventListener('click',()=>x.onClick?.());tr.append(b);extraBtns.set(x.id,b);}
 const chatSlot=mk('span','uf-chat-slot');tr.append(chatSlot);
 // ☰ 그림은 임시(월드아트가 c-menu를 그려 넣으면 저절로 바뀜)
 const menuBtn=mk('button','uf-rb uf-menu-btn',icon('c-menu',{size:'m',fallback:'☰'}));menuBtn.type='button';menuBtn.setAttribute('aria-label',menuLabel);menuBtn.setAttribute('aria-haspopup','dialog');menuBtn.setAttribute('aria-expanded','false');
 tr.append(menuBtn);
 // 메뉴 창
 const sheet=mk('section','uf-sheet',`<i class="uf-grip" aria-hidden="true"></i>${quick?'<div class="uf-quick"></div>':''}<nav class="uf-tabs" role="tablist"></nav><div class="uf-body"></div>`);
 sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label',menuLabel);
 const tabBar=sheet.querySelector('.uf-tabs'),body=sheet.querySelector('.uf-body'),quickEl=sheet.querySelector('.uf-quick');
 const panels=new Map();
 for(const t of tabs){
  const b=mk('button','uf-tab',`${icon(t.ic,{size:'m',fallback:t.fb})}<span>${esc(t.label)}</span>`);b.type='button';b.dataset.ufTab=t.id;b.setAttribute('role','tab');b.setAttribute('aria-selected','false');tabBar.append(b);
  const p=mk('div','uf-panel');p.dataset.ufPanel=t.id;p.hidden=true;p.setAttribute('role','tabpanel');body.append(p);panels.set(t.id,{t,p,b,ready:false});
 }
 // 닫기 단추(✕)는 탭 줄 끝
 const x=mk('button','uf-x',icon('c-close',{size:'s',fallback:'✕'}));x.type='button';x.setAttribute('aria-label','메뉴 닫기');tabBar.append(x);
 doc.body.append(tr,sheet);
 let tab=tabs[0]?.id??null,open=false;
 function showTab(id){
  if(!panels.has(id))id=tabs[0]?.id;const prev=tab;tab=id;
  for(const [k,o] of panels){const on=k===id;o.p.hidden=!on;o.b.classList.toggle('on',on);o.b.setAttribute('aria-selected',String(on));}
  if(prev&&prev!==id)panels.get(prev)?.t.onClose?.();
  const o=panels.get(id);if(!o)return;
  if(!o.ready){o.ready=true;o.t.render?.(o.p);}
  o.t.onOpen?.(o.p);
  win.dispatchEvent(new CustomEvent('uf:tab',{detail:{id,el:o.p}})); // 다른 모듈도 자기 탭을 채울 수 있게(흡연장 상황 = spots.js)
  body.scrollTop=0;
 }
 function setOpen(on,id=null){
  if(on){if(id)tab=id;if(!open){open=true;sheet.hidden=false;quick?.(quickEl);openWin('menu',{doc,win});}showTab(tab);}
  else if(open){open=false;sheet.hidden=true;panels.get(tab)?.t.onClose?.();closeWin('menu',{doc,win});}
  menuBtn.classList.toggle('on',open);menuBtn.setAttribute('aria-expanded',String(open));
 }
 onWin('menu',()=>setOpen(false),{win});
 menuBtn.addEventListener('click',()=>setOpen(!open));
 x.addEventListener('click',()=>setOpen(false));
 tabBar.addEventListener('click',e=>{const b=e.target.closest('[data-uf-tab]');if(b)showTab(b.dataset.ufTab);});
 // 바깥 게임을 누르면 닫힘(위 단추 줄·메뉴 안·다른 대화창은 그대로)
 doc.addEventListener('pointerdown',e=>{if(!open)return;const t=e.target;if(t.closest?.('.uf-sheet,.uf-tr,dialog,[role=dialog],.fb-card,.sp-card'))return;setOpen(false);},true);
 win.addEventListener('keydown',e=>{if(e.code==='Escape'&&open){e.stopPropagation();setOpen(false);}},true);

 // ── 휴대폰 키보드 ──
 const vv=win.visualViewport;
 function fitKb(){
  if(!vv)return;
  const kb=Math.max(0,win.innerHeight-vv.height-vv.offsetTop),a=doc.activeElement,typing=!!a&&/^(INPUT|TEXTAREA)$/.test(a.tagName);
  root.style.setProperty('--uf-kb',`${Math.round(kb)}px`);
  root.toggleAttribute('data-uf-kb',kb>80&&typing);
 }
 vv?.addEventListener('resize',fitKb);vv?.addEventListener('scroll',fitKb);
 doc.addEventListener('focusin',()=>setTimeout(fitKb,250));doc.addEventListener('focusout',()=>setTimeout(fitKb,150));

 // ── 말하기 줄 높이(큰 단추를 그 위에 작게 남기려고) ──
 let chatRo=null;
 function watchChat(el){
  if(!el||!win.ResizeObserver)return;chatRo?.disconnect();
  chatRo=new win.ResizeObserver(()=>{const r=el.getBoundingClientRect();root.style.setProperty('--uf-chat-h',`${Math.round(r.height||0)}px`);});chatRo.observe(el);
 }

 return {
  root:tr,sheet,menuBtn,chatSlot,
  extra:id=>extraBtns.get(id)??null,
  panel:id=>panels.get(id)?.p??null,
  open:(id=null)=>setOpen(true,id),close:()=>setOpen(false),toggle:(id=null)=>open&&(!id||id===tab)?setOpen(false):setOpen(true,id),
  get isOpen(){return open;},get tab(){return tab;},
  watchChat,refreshTab:()=>{if(open)panels.get(tab)?.t.onOpen?.(panels.get(tab).p);},
 };
}
