// 온라인 시리즈 공통 바텀시트 부품(11-24, 대표 결정 + 월드디자인 시안 docs/UI-개선/바텀시트-개선-시안-v1.html, 월드공통개발).
//  attachSheet(el,{close,…}) 한 줄로 붙인다. 창마다 여는·닫는 코드는 그대로 두고 hidden(또는 조상 hidden)만 본다.
//  - 자리(ui-sheet.css, data-ufs-mode): bottom = 휴대폰 세로·좁고 긴 창 → 아래에서, 위 안전영역 + 64px만 남김(tall이면 늘 그 높이, 아니면 내용이 화면 절반보다 짧을 때만 내용 높이)
//                                      side = 휴대폰 가로 → 오른쪽 판 340px(왼쪽 세로 손잡이) / pc = 각 창 원래 모양(☰·지도는 오른쪽 판)
//  - 쓸어 닫기: bottom = 아래로, side = 오른쪽으로. 창 크기의 25% 넘게 또는 빠르게(초당 600px·24px 이상) 놓으면 닫힘, 아니면 제자리. 위(여는 쪽)는 고무줄 30%·최대 24px
//    손가락이 8px 움직이면 방향을 정함(옆으로 먼저면 안 함). 안쪽 글은 맨 위일 때만 아래 쓸기가 창으로 감(중간이면 글만 넘어감, 손을 떼기 전엔 안 바뀜)
//    쓸기 제외: 입력칸·범위 막대·touch-action:none 칸(지도·라디오 다이얼 등)·noSwipe. 키보드가 올라와 있으면 손잡이 줄(handle)에서만
//  - 뒤 어둡게(세로 40%·가로 15%·PC 0, 끄는 만큼 옅어짐) · 바깥 누르면 닫힘(휴대폰은 그 누름을 게임에 안 넘김) · Esc · PC는 ✕ 옆 「Esc」 표시·열면 첫 단추로 초점·Tab은 창 안에서만·닫으면 연 단추로
export const SHEET_RULES=Object.freeze({top:64,closeFrac:.25,flingV:600,flingMin:24,slop:8,rubber:.3,rubberMax:24,dim:Object.freeze({bottom:.4,side:.15,pc:0}),backMs:220,closeMs:200,openMs:260});
export const SHEET_MEDIA=Object.freeze({side:'(orientation:landscape) and (max-height:540px)',pc:'(min-width:900px) and (min-height:541px)'});
export function sheetMode(win=globalThis){const m=q=>!!win?.matchMedia?.(q)?.matches;return m(SHEET_MEDIA.side)?'side':m(SHEET_MEDIA.pc)?'pc':'bottom';}
/** 놓았을 때 닫을지: d = 닫는 쪽으로 움직인 거리(px), size = 창 높이(가로 판은 폭), v = 놓는 순간 닫는 쪽 속도(px/s) */
export function shouldClose(d,size,v,R=SHEET_RULES){return d>=size*R.closeFrac||(v>=R.flingV&&d>=R.flingMin);}
/** 여는 쪽(위·왼쪽)으로 끌면 고무줄: 손가락의 30%, 최대 24px */
export function rubber(d,R=SHEET_RULES){return d>=0?d:-Math.min(R.rubberMax,-d*R.rubber);}
/** 짧은 창: 내용이 화면 절반보다 짧으면 내용 높이 */
export const isShort=(contentH,viewH)=>contentH<viewH*.5;
const NO_SWIPE='input,textarea,select,[contenteditable=""],[contenteditable=true],[data-ufs-noswipe]';
const FOCUSABLE='button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
const OTHER_DIALOGS='dialog,[role=dialog],[role=alertdialog],[aria-modal=true],.fb-card,.sp-card';

/**
 * el: 창 요소. close(): 창을 닫는 그 창의 함수(hidden을 켜거나 다시 그림).
 * tall: 늘 큰 높이(☰·지도), grip: 이미 있는 손잡이 선택자, handle: 손잡이처럼 잡히는 윗부분(머리줄·탭 줄), noSwipe: 쓸기 제외 칸,
 * closeBtn: ✕(그 앞에 PC 「Esc」 표시), toggle: 여닫는 단추(바깥 누름에서 뺌), ignore: 바깥 누름에서 뺄 곳,
 * backdrop: 이미 있는 뒤 막(없으면 만듦), outside·esc·focus·animate: 끄려면 false
 */
export function attachSheet(el,{doc=el?.ownerDocument??document,win=doc?.defaultView??globalThis,close,tall=false,grip=null,handle='',noSwipe='',closeBtn=null,toggle=null,ignore='',backdrop=null,outside=true,esc=true,focus=true,animate=true}={}){
 if(!el)return null;if(el._ufs)return el._ufs;
 const R=SHEET_RULES,html=doc.documentElement;
 installSheetGuard(doc);
 el.classList.add('ufs');if(tall)el.dataset.ufsTall='';
 let gripEl=grip?el.querySelector(grip):null;if(!gripEl){gripEl=doc.createElement('i');gripEl.setAttribute('aria-hidden','true');el.prepend(gripEl);}gripEl.classList.add('ufs-grip');
 const scrim=backdrop??(()=>{const s=doc.createElement('div');s.className='ufs-scrim';s.setAttribute('aria-hidden','true');el.before(s);return s;})(),ownScrim=!backdrop;
 const xBtn=typeof closeBtn==='string'?el.querySelector(closeBtn):closeBtn;
 const addEsc=()=>{const x=typeof closeBtn==='string'?el.querySelector(closeBtn):xBtn;if(x&&!x.previousElementSibling?.classList?.contains('ufs-esc')){const k=doc.createElement('kbd');k.className='ufs-esc';k.textContent='Esc';k.setAttribute('aria-hidden','true');x.before(k);}};
 addEsc();
 let mode='bottom',shown=false,opener=null,g=null,anim=0,swallow=0,api=null;
 const isOpen=()=>el.isConnected&&!el.hidden&&!el.closest('[hidden]');
 const size=()=>mode==='side'?el.offsetWidth:el.offsetHeight;
 function setMode(){
  mode=sheetMode(win);el.dataset.ufsMode=mode;scrim.dataset.ufsMode=mode;
  if(tall||mode!=='bottom'){delete el.dataset.ufsShort;return;}
  el.dataset.ufsMeasure='';const h=el.scrollHeight;delete el.dataset.ufsMeasure;
  if(isShort(h,win.innerHeight))el.dataset.ufsShort='';else delete el.dataset.ufsShort;
 }
 const paint=(d=0)=>{el.style.translate=d?(mode==='side'?`${d}px 0`:`0 ${d}px`):'';const p=Math.max(0,Math.min(1,d/Math.max(1,size())));scrim.style.opacity=d>0?String((ownScrim?R.dim[mode]:1)*(1-p)):'';};
 function onShow(){
  shown=true;setMode();addEsc();if(ownScrim)scrim.dataset.on='';html.dataset.ufsOpen=String(+(html.dataset.ufsOpen??0)+1);
  opener=doc.activeElement&&!el.contains(doc.activeElement)?doc.activeElement:opener;
  if(animate){el.classList.remove('ufs-anim');void el.offsetWidth;el.classList.add('ufs-anim');clearTimeout(anim);anim=setTimeout(()=>el.classList.remove('ufs-anim'),R.openMs+60);}
  if(focus&&mode==='pc')win.requestAnimationFrame?.(()=>{if(!isOpen())return;const f=el.querySelector('[aria-selected=true]')??el.querySelector(FOCUSABLE);f?.focus?.({preventScroll:true});});
 }
 function onHide(){
  shown=false;g=null;el.classList.remove('ufs-drag','ufs-anim');el.style.transition='';paint(0);scrim.style.transition='';if(ownScrim)delete scrim.dataset.on;
  const n=Math.max(0,+(html.dataset.ufsOpen??1)-1);if(n)html.dataset.ufsOpen=String(n);else delete html.dataset.ufsOpen;
  if(focus&&opener?.isConnected&&(!doc.activeElement||doc.activeElement===doc.body||el.contains(doc.activeElement)))opener.focus?.({preventScroll:true});opener=null;
 }
 // 창이 안을 다시 그리면(innerHTML) 손잡이·Esc 표시를 다시 붙이고, 짧은 창 높이를 다시 잼
 const ensure=()=>{if(!el.contains(gripEl)){const old=grip?el.querySelector(grip):null;if(old){gripEl=old;gripEl.classList.add('ufs-grip');}else el.prepend(gripEl);}addEsc();if(shown)setMode();};
 const sync=muts=>{if(muts?.some?.(m=>m.type==='childList'))ensure();const o=isOpen();if(o&&!shown)onShow();else if(!o&&shown)onHide();};
 const mo=win.MutationObserver?new win.MutationObserver(sync):null;
 mo?.observe(el,{attributes:true,attributeFilter:['hidden'],childList:true});if(el.parentElement)mo?.observe(el.parentElement,{attributes:true,attributeFilter:['hidden']});
 const onResize=()=>{if(shown)setMode();};win.addEventListener?.('resize',onResize);
 function doClose(){if(!shown&&!isOpen())return;close?.();if(!el.isConnected||!isOpen())onHide();}

 // ── 쓸어 닫기
 const typing=()=>html.hasAttribute('data-uf-kb')||/^(INPUT|TEXTAREA)$/.test(doc.activeElement?.tagName??'');
 function startDrag(x,y,t){
  g=null;if(!isOpen()||!t?.closest)return;setMode();if(mode==='pc'&&!t.closest('.ufs-grip'))return;
  if(t.closest(NO_SWIPE+(noSwipe?','+noSwipe:'')))return;
  const inGrip=!!t.closest('.ufs-grip'),inHandle=inGrip||!!(handle&&t.closest(handle));if(typing()&&!inHandle)return;
  if(!inGrip)for(let n=t;n&&n!==el;n=n.parentElement)if(win.getComputedStyle?.(n)?.touchAction==='none')return; // 지도·다이얼처럼 손가락을 직접 받는 칸
  let sc=null,hs=false;
  for(let n=t;n;n=n.parentElement){const cs=win.getComputedStyle?.(n);
   if(cs&&/(auto|scroll)/.test(cs.overflowX)&&n.scrollWidth>n.clientWidth+1)hs=true;
   if(!sc&&cs&&/(auto|scroll)/.test(cs.overflowY)&&n.scrollHeight>n.clientHeight+1)sc=n;if(n===el)break;}
  g={x0:x,y0:y,inHandle,top:!sc||sc.scrollTop<=0,hs,dir:null,d:0,v:0,lt:performance.now(),ld:0};
 }
 function moveDrag(x,y,e){
  if(!g||g.dir==='none')return;const dx=x-g.x0,dy=y-g.y0,side=mode==='side';
  if(!g.dir){if(Math.hypot(dx,dy)<R.slop)return;const along=side?dx:dy,across=side?dy:dx;
   if(Math.abs(across)>Math.abs(along)||side&&g.hs){g.dir='none';return;}
   g.dir=along>0?(g.inHandle||g.top||side?'drag':'none'):(g.inHandle?'drag':'none');
   if(g.dir!=='drag')return;el.classList.add('ufs-drag');el.style.transition='none';scrim.style.transition='none';g.lt=performance.now();}
  if(e?.cancelable)e.preventDefault();
  const d=rubber(side?dx:dy),t=performance.now(),dt=(t-g.lt)/1000;if(dt>.008){g.v=(d-g.ld)/dt;g.lt=t;g.ld=d;}g.d=d;paint(d);
 }
 function endDrag(){
  const s=g;g=null;if(!s||s.dir!=='drag')return;swallow=performance.now();el.classList.remove('ufs-drag');
  const H=size(),out=shouldClose(s.d,H,s.v),ms=out?R.closeMs:R.backMs;api.last={d:Math.round(s.d),v:Math.round(s.v),size:H,out};
  el.style.transition=`translate ${ms}ms cubic-bezier(.2,.8,.2,1)`;scrim.style.transition=`opacity ${ms}ms`;paint(out?H+8:0);if(!out)scrim.style.opacity='';
  setTimeout(()=>{if(out)doClose();el.style.transition='';scrim.style.transition='';if(!out||!isOpen())paint(0);},ms);
 }
 el.addEventListener('touchstart',e=>{if(e.touches.length!==1){g=null;return;}const p=e.touches[0];startDrag(p.clientX,p.clientY,e.target);},{passive:true});
 el.addEventListener('touchmove',e=>{const p=e.touches[0];if(p)moveDrag(p.clientX,p.clientY,e);},{passive:false});
 el.addEventListener('touchend',endDrag);el.addEventListener('touchcancel',()=>{if(g?.dir==='drag')endDrag();g=null;});
 el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)startDrag(e.clientX,e.clientY,e.target);});
 win.addEventListener?.('pointermove',e=>{if(e.pointerType==='mouse'&&g)moveDrag(e.clientX,e.clientY,e);});
 win.addEventListener?.('pointerup',e=>{if(e.pointerType==='mouse')endDrag();});
 // 끌고 난 뒤 손을 뗀 곳의 click(탭 바꾸기 등)은 버림
 el.addEventListener('click',e=>{if(performance.now()-swallow<350){e.stopPropagation();e.preventDefault();}},true);

 // ── 바깥 누름·Esc·Tab
 const ignoreSel=[OTHER_DIALOGS,ignore].filter(Boolean).join(',');
 if(outside)doc.addEventListener('pointerdown',e=>{
  if(!isOpen())return;const t=e.target;if(el.contains(t)||toggle&&(toggle.contains?.(t)||toggle===t))return;
  if(t?.closest?.(ignoreSel)&&!t.closest('.ufs-scrim'))return;
  const eat=mode!=='pc';doClose();if(eat){e.stopPropagation();e.preventDefault();swallow=performance.now();doc._ufsEat=performance.now();}
 },true);
 if(esc)win.addEventListener?.('keydown',e=>{if(e.key==='Escape'&&isOpen()){e.stopPropagation();doClose();}},true);
 if(focus)el.addEventListener('keydown',e=>{if(e.key!=='Tab'||mode!=='pc')return;const f=[...el.querySelectorAll(FOCUSABLE)].filter(n=>n.offsetParent!==null);if(!f.length)return;
  const a=f[0],b=f[f.length-1];if(e.shiftKey&&doc.activeElement===a){e.preventDefault();b.focus();}else if(!e.shiftKey&&doc.activeElement===b){e.preventDefault();a.focus();}});
 sync();
 api={el,get mode(){return mode;},get open(){return isOpen();},close:doClose,refresh:()=>{if(shown)setMode();},
  dispose(){mo?.disconnect();win.removeEventListener?.('resize',onResize);if(ownScrim)scrim.remove();if(shown)onHide();el._ufs=null;}};
 el._ufs=api;return api;
}
// 시트를 닫으며 버린 누름 뒤의 click은 게임에도 안 넘김(문서 하나에 한 번)
export function installSheetGuard(doc=document){
 if(!doc||doc._ufsGuard)return;doc._ufsGuard=true;
 const eat=e=>{if(performance.now()-(doc._ufsEat??-1e9)<500){e.stopPropagation();if(e.cancelable)e.preventDefault();}};
 for(const ev of ['click','touchstart','mousedown'])doc.addEventListener(ev,eat,{capture:true,passive:false});
}
