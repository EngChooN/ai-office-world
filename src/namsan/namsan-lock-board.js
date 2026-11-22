// 남산 사랑의 자물쇠 화면(11-22, 월드개발): 걸기 카드(한마디 30자)·읽기 카드(신고·떼기·옆 자물쇠)·지난 자물쇠 꾸러미 목록·서버 목록 받아 칠하기.
// 시안: docs/남산/남산-자물쇠-메시지-시안-v2.html(월드디자인). 규칙·문구 src/namsan/namsan-lock-rules.js, 서버 server/namsan-locks.mjs.
// 상태(conn): solo(함께 걷기 안 함) · loading(서버 목록 기다림) · online(서버 목록 받음) · offline(서버 없음·끊김·내 컴퓨터 모드)
//  online이면 서버 자물쇠 전부 + 「이 기기에만」 자물쇠, 아니면 내 것만(기기 저장분 + 마지막으로 받은 서버의 내 것).
//  「이 기기에만」(서버 없이 건 것·11-20 옛 저장분) 자물쇠는 연결돼도 저절로 올리지 않고, 카드의 「모두에게 보이기」를 눌러야 서버 검사를 거쳐 올림.
// 옛 화면 호환: 옛 화면은 함께 걷기 act.x 'lk-…'로만 자물쇠를 알린다(저장 안 됨). 그 자물쇠는 빈 자리에 잠깐 칠하고 「저장되지 않은 자물쇠」로 읽힌다.
//  이 화면은 이제 act.x로 보내지 않는다(서버가 나눔).
// 글은 늘 textContent로 넣는다(HTML로 넣지 않음).
import {LOCK_RULES,LOCK_ERR,LOCK_REPORT_REASONS,LOCK_REPORT_LABEL,checkLockText,lockLength,lockDate,deviceLockKey} from './namsan-lock-rules.js';
import {decodeLocks,lockCode} from './namsan-interact.js';

const T={
 title:'사랑의 자물쇠',hangSub:n=>`색·모양을 고르고 한마디를 적어 걸어요 · 내 자물쇠 ${n} / 3`,hangSubShort:n=>`색·모양을 고르고 한마디를 적어 걸어요 · ${n} / 3`,
 placeholder:'한마디 남기기 (30자까지)',warn:'이름·전화번호·주소 같은 개인정보는 쓰지 마세요. 건 글은 모두에게 보여요.',foot:'한 번 건 글은 고칠 수 없어요 · 내 자물쇠는 눌러서 뗄 수 있어요',
 hang:'걸기',hanging:'거는 중…',retry:'다시 걸기',close:'닫기',moving:'곧 꾸러미로 옮겨져요 · 가장 오래된 자물쇠가 「지난 자물쇠 꾸러미」로 가요',
 hungOnline:n=>`자물쇠를 걸었어요 · ${n} / 3 · 모두에게 보여요`,hungLocal:n=>`이 기기에만 걸었어요 · ${n} / 3`,
 empty:'글 없이 건 자물쇠예요',by:(name,d)=>`— ${name} · ${d}에 걸었어요`,byShort:(name,d)=>`— ${name} · ${d}`,mine:'내 자물쇠',local:'이 기기에만',legacy:'저장되지 않은 자물쇠',
 legacyBy:name=>`— 함께 걷기 중인 ${name} · 옛 화면에서 건 자물쇠라 저장되지 않아요`,
 report:'신고',unhang:'떼기',share:'모두에게 보이기',bundle:n=>`지난 자물쇠 ${n}개 보기`,
 reportTitle:'이 자물쇠를 신고할까요?',reportGo:'신고하기',cancel:'그만두기',reportNote:'신고하면 내 화면에서는 바로 숨겨요. 여러 사람이 신고하면 모두에게서 숨겨요.',reported:'신고했어요 · 내 화면에서 숨겼어요',
 unhangTitle:'자물쇠를 뗄까요?',unhangNote:'뗀 자물쇠는 되돌릴 수 없어요. 떼면 새로 하나 걸 수 있어요.',unhung:n=>`자물쇠를 뗐어요 · ${n} / 3`,
 bundleTitle:n=>`지난 자물쇠 ${n}개 · 최근에 옮겨진 순서`,
 loading:'모두의 자물쇠를 불러오는 중…',offline:'모두의 자물쇠를 불러오지 못했어요 · 내 자물쇠만 보여요',solo:'혼자 걷기 중 · 내 자물쇠만 보여요',
 waitLoad:'불러온 뒤에 걸 수 있어요',full:n=>`내 자물쇠 ${n}개를 다 걸었어요`
};
export const LOCK_BOARD_TEXT=T;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const btn=(text,data,cls='')=>{const b=el('button',cls,text);b.type='button';for(const [k,v] of Object.entries(data))b.dataset[k]=v;return b;};

/**
 * deps: LK(그림 locks API: setAll·hang·nearestEmpty·slots·aim·hover·aimView), colorOf(c)→색, colorNames, max, progress(ix.progress: locks 배열), persist(),
 *  toast(text,{ms}), me()→{x,z}, spot(자물쇠 난간 자리 {x,z}), project(x,y,z)→{x,y,visible}, canvas, coarse()→휴대폰?, storage(기기 열쇠 저장)
 */
export function createLockBoard({LK,colorOf,colorNames,max=3,progress,persist=()=>{},toast=()=>{},me,spot,project,canvas,coarse=()=>false,storage=globalThis.localStorage??null,now=()=>Date.now(),clock=()=>performance.now()}){
 const key=deviceLockKey(storage);
 const server=new Map();      // id → 서버 자물쇠(난간)
 const reportedHere=new Set();// 내가 신고한 id(바로 숨김)
 let bundle=0,conn='solo',multi=null,offs=[],q=0,pending=null,lastSig='',everLoaded=false,loadingSince=0,notedNear=false,notedState='';
 const legacy=new Map();      // 옛 화면 사람 id → [{c,h,code}]
 let layout=new Map();        // 자리 → {kind:'server'|'local'|'legacy', lock}
 const slots=LK?LK.slots():[];
 const locals=()=>progress.locks;
 const serverMine=()=>[...server.values()].filter(l=>l.mine);
 let lastMine=[];             // 끊겼을 때도 보이게: 마지막으로 받은 서버의 내 것
 const mineCount=()=>locals().length+(conn==='online'?serverMine().length:lastMine.length);

 // ── 칠하기: 자리 정하기 → 그림 setAll ──
 function relayout(skip=-1){
  const next=new Map(),put=(slot,v)=>{if(slot>=0&&slot<slots.length&&!next.has(slot)){next.set(slot,v);return true;}return false;};
  const free=want=>{if(!next.has(want))return want;for(let d=1;d<slots.length;d++)for(const s of [want-d,want+d])if(s>=0&&s<slots.length&&!next.has(s))return s;return -1;};
  if(conn==='online'){for(const l of server.values())if(!reportedHere.has(l.id))put(l.slot,{kind:'server',lock:l});}
  else for(const l of lastMine)put(l.slot,{kind:'server',lock:l});
  for(const l of locals())put(free(l.i),{kind:'local',lock:l});
  if(conn==='online')for(const [id,list] of legacy)for(const l of list){const s=free(l.i);if(s>=0)next.set(s,{kind:'legacy',lock:{...l,from:id}});}
  layout=next;
  const list=[...next].filter(([s])=>s!==skip).map(([s,v])=>({i:s,color:colorOf(v.lock.c),heart:!!v.lock.h,mine:v.kind==='local'||!!v.lock.mine}));
  const sig=JSON.stringify(list);if(sig!==lastSig||skip>=0){lastSig=skip>=0?'':sig;LK?.setAll(list);}
 }
 function animateHang(slot){relayout(slot);const v=layout.get(slot);if(v)LK?.hang(slot,{color:colorOf(v.lock.c),heart:!!v.lock.h,mine:v.kind==='local'||!!v.lock.mine});}
 const nearRail=(r=30)=>{const p=me();return !!spot&&Math.hypot(p.x-spot.x,p.z-spot.z)<r;};

 // ── 서버 연결 ──
 const send=m=>multi?.send?.(m);
 function onMessage(m){
  if(!m||typeof m.t!=='string'||!m.t.startsWith('lk-'))return;
  if(m.t==='lk-all'){if(m.off){setConn('offline');return;}server.clear();for(const l of m.locks??[])if(Number.isInteger(l.slot))server.set(l.id,l);bundle=m.bundle|0;lastMine=serverMine();everLoaded=true;setConn('online');relayout();return;}
  if(m.t==='lk-add'){const l=m.lock;if(!l||!Number.isInteger(l.slot))return;if(m.moved&&server.delete(m.moved))bundle++;server.set(l.id,l);if(l.mine)lastMine=serverMine();
   if(nearRail()&&!layout.has(l.slot))animateHang(l.slot);else relayout();return;}
  if(m.t==='lk-gone'){if(server.delete(m.id)){lastMine=serverMine();relayout();}if(view?.lock?.id===m.id)closeCard();return;}
  if(m.t==='lk-ok'&&pending&&m.q===pending.q){const p=pending;pending=null;clearTimeout(p.timer);const l=m.lock;
   if(m.moved&&server.delete(m.moved))bundle++;server.set(l.id,l);lastMine=serverMine();
   if(p.promote){const k=locals().indexOf(p.promote);if(k>=0){locals().splice(k,1);persist();}closeCard();relayout();toast(T.hungOnline(mineCount()),{ms:2800});return;}
   closeCard();animateHang(l.slot);viewSlot={i:l.slot,until:clock()+4500};toast(T.hungOnline(mineCount()),{ms:2800});hung++;return;}
  if(m.t==='lk-err'&&pending&&m.q===pending.q){const p=pending;pending=null;clearTimeout(p.timer);
   if(p.promote){toast(LOCK_ERR[m.code]??LOCK_ERR.busy,{ms:2800});closeCard();return;} // 「모두에게 보이기」 실패는 알림으로
   showErr(LOCK_ERR[m.code]??LOCK_ERR.busy,m.code==='busy'||m.code==='bad');return;}
  if(m.t==='lk-bundle'){if(view?.kind==='bundle'){view.page=m.page;view.total=m.total;view.list=m.locks??[];bundle=m.total;paintBundle();}return;}
 }
 function setConn(c){if(c===conn)return;conn=c;if(c==='loading')loadingSince=clock();relayout();if(view?.kind==='hang')paintHangSub();}
 function attach(m){
  detach();multi=m;if(!m){setConn('solo');return;}
  const tr=m.transport;if(tr?.kind!=='server'){setConn('offline');return;}
  offs.push(tr.onmessage(onMessage));
  const st=s=>{if(s==='online'){setConn('loading');send({t:'lk-list',owner:key});}else setConn(everLoaded||s==='offline'||s==='reconnecting'?'offline':'loading');};
  offs.push(tr.onstatus(st));st(tr.status);
 }
 function detach(){for(const f of offs)try{f();}catch{}offs=[];multi=null;legacy.clear();if(pending){clearTimeout(pending.timer);pending=null;}setConn('solo');}

 // ── 카드 ──
 const card=el('div','ns-lockcard');card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label',T.title);document.body.append(card);
 for(const ev of ['pointerdown','keydown','keyup'])card.addEventListener(ev,e=>e.stopPropagation()); // 게임 단축키·둘러보기와 겹치지 않게
 let view=null,viewSlot=null,hung=0;
 const pick={c:0,h:0};
 function openShell(kind){view={kind};card.replaceChildren();card.hidden=false;card.dataset.kind=kind;document.body.classList.add('ns-lock-open');document.body.classList.toggle('ns-lock-reading',kind!=='hang');}
 function closeCard(){if(card.hidden)return;if(view?.kind==='hang'&&pending)return;card.hidden=true;card.replaceChildren();view=null;document.body.classList.remove('ns-lock-open','ns-lock-reading');LK?.aim(-1);LK?.hover(-1);}
 // 걸기 카드
 function aimSlot(){
  const p=me();let i=LK?.nearestEmpty(p.x,p.z)??-1,moving=false;
  if(i<0&&conn==='online'){const old=[...server.values()].filter(l=>!l.mine&&!reportedHere.has(l.id)).sort((a,b)=>a.at-b.at)[0];if(old){i=old.slot;moving=true;}}
  return {i,moving};
 }
 function paintHangSub(){const s=card.querySelector('.ns-lk-sub');if(s){s.querySelector('.pc').textContent=T.hangSub(mineCount());s.querySelector('.ph').textContent=T.hangSubShort(mineCount());}}
 function openHang(){
  if(!LK)return;if(mineCount()>=max){toast(T.full(max));return;}
  if(conn==='loading'){toast(T.waitLoad);return;}
  const a=aimSlot();if(a.i<0){toast('빈 자리가 없어요');return;}
  openShell('hang');view.aim=a.i;view.moving=a.moving;LK.aim(a.moving?-1:a.i);
  const box=el('div','ns-lock-in');
  const sub=el('p','ns-lk-sub');sub.append(el('span','pc',''),el('span','ph',''));
  const colors=el('div','ns-lock-colors');colors.setAttribute('role','radiogroup');colors.setAttribute('aria-label','자물쇠 색');
  colorNames.forEach((name,i)=>{const b=btn('',{c:String(i)});b.setAttribute('role','radio');b.setAttribute('aria-label',name);b.style.setProperty('--c',colorOf(i));colors.append(b);});
  const shape=el('div','ns-row ns-lock-shape');shape.append(btn('네모',{h:'0'}),btn('하트',{h:'1'}));
  const pickBox=el('div','ns-lk-pick');pickBox.append(colors,shape);
  const fold=btn('',{lk:'unfold'},'ns-lk-fold');
  const field=el('label','ns-lk-field');const input=el('input');input.type='text';input.placeholder=T.placeholder;input.autocomplete='off';input.enterKeyHint='done';input.setAttribute('aria-label',T.placeholder);
  const count=el('span','ns-lk-count','0 / 30');field.append(input,count);
  const warn=el('p','ns-lk-warn',T.warn),err=el('p','ns-lk-err');err.setAttribute('role','alert');err.hidden=true;
  const mv=el('p','ns-lk-move',T.moving);mv.hidden=!a.moving;
  const row=el('div','ns-row');row.append(btn(T.hang,{lk:'hang'},'on'),btn(T.close,{lk:'close'}));
  box.append(el('h3','',T.title),sub,pickBox,fold,field,warn,err,mv,row,el('small','ns-lk-foot',T.foot));card.append(box);
  paintHangSub();paintPick();
  input.addEventListener('input',()=>{const n=lockLength(input.value);if(n>LOCK_RULES.textMax){input.value=[...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(input.value)].slice(0,LOCK_RULES.textMax).map(x=>x.segment).join('');}
   count.textContent=`${Math.min(LOCK_RULES.textMax,lockLength(input.value))} / ${LOCK_RULES.textMax}`;err.hidden=true;setHangBtn(T.hang,false);});
  input.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Enter'){e.preventDefault();hang();}else if(e.key==='Escape'){e.preventDefault();closeCard();}});
  input.addEventListener('focus',()=>card.classList.toggle('ns-lk-typing',coarse()));input.addEventListener('blur',()=>setTimeout(()=>card.classList.remove('ns-lk-typing'),120));
  if(!coarse())setTimeout(()=>input.focus({preventScroll:true}),30);
 }
 function paintPick(){
  for(const b of card.querySelectorAll('[data-c]'))b.setAttribute('aria-checked',String(+b.dataset.c===pick.c));
  for(const b of card.querySelectorAll('[data-h]'))b.setAttribute('aria-pressed',String(+b.dataset.h===pick.h));
  const f=card.querySelector('.ns-lk-fold');if(f)f.textContent=`${colorNames[pick.c]} ${pick.h?'하트':'네모'} · 바꾸기`;
 }
 const setHangBtn=(text,busy)=>{const b=card.querySelector('[data-lk="hang"]');if(b){b.textContent=text;b.disabled=busy;b.setAttribute('aria-busy',String(busy));}};
 function showErr(text,retry=false){const e=card.querySelector('.ns-lk-err');if(!e)return;e.textContent=text;e.hidden=false;setHangBtn(retry?T.retry:T.hang,false);}
 function hang(){
  if(view?.kind!=='hang'||pending)return;const input=card.querySelector('input');
  const chk=checkLockText(input?.value??'');if(!chk.ok){showErr(LOCK_ERR[chk.code]);return;}
  if(mineCount()>=max){showErr(LOCK_ERR.limit);return;}
  if(conn==='online'){
   const id=++q;setHangBtn(T.hanging,true);
   pending={q:id,timer:setTimeout(()=>{if(pending?.q===id){pending=null;showErr(LOCK_ERR.busy,true);}},LOCK_RULES.replyMs)};
   send({t:'lk-hang',q:id,owner:key,slot:view.aim,c:pick.c,h:pick.h,text:chk.text});return;}
  if(conn==='loading'){showErr(T.waitLoad);return;}
  // 서버 없음·혼자: 이 기기에만
  const p=me(),i=LK.nearestEmpty(p.x,p.z);if(i<0){showErr('빈 자리가 없어요');return;}
  locals().push({i,c:pick.c,h:pick.h,at:now(),...(chk.text?{text:chk.text}:{})});persist();
  closeCard();animateHang(i);viewSlot={i,until:clock()+4500};toast(T.hungLocal(mineCount()),{ms:2800});hung++;
 }
 // 읽기 카드
 const barOf=s=>slots[s]?.bar;
 function neighbor(slot,dir){const bar=barOf(slot),row=[...layout.keys()].filter(s=>barOf(s)===bar).sort((a,b)=>slots[a].bay-slots[b].bay||a-b),k=row.indexOf(slot);return row.length>1?row[(k+dir+row.length)%row.length]:slot;}
 function openRead(slot){
  const v=layout.get(slot);if(!v)return false;
  openShell('read');view.slot=slot;view.lock=v.lock;view.entry=v;LK?.hover(slot);
  const l=v.lock,mine=v.kind==='local'||!!l.mine,box=el('div','ns-lock-in ns-lk-read');
  const head=el('div','ns-lk-head');head.append(el('span','ns-lk-eyebrow',T.title));
  if(mine)head.append(el('span','ns-lk-badge mine',T.mine));if(v.kind==='local')head.append(el('span','ns-lk-badge local',T.local));if(v.kind==='legacy')head.append(el('span','ns-lk-badge local',T.legacy));
  head.append(btn('✕',{lk:'close'},'ns-lk-x'));head.lastChild.setAttribute('aria-label','닫기');
  const text=el('p','ns-lk-text'+(l.text?'':' empty'),l.text||T.empty);
  const name=v.kind==='local'?'나':l.mine?`나(${l.name||'동동이'})`:(l.name||'동동이');
  const by=v.kind==='legacy'?el('p','ns-lk-by',T.legacyBy(l.name||'등산객')):el('p','ns-lk-by');
  if(v.kind!=='legacy'){by.append(el('span','pc',T.by(name,lockDate(l.at))),el('span','ph',T.byShort(name,lockDate(l.at))));}
  const row=el('div','ns-lk-actions');
  if(mine)row.append(btn(T.unhang,{lk:'unhang'},'ns-lk-link'));else if(v.kind==='server')row.append(btn(T.report,{lk:'report'},'ns-lk-link'));
  if(v.kind==='local'&&conn==='online')row.append(btn(T.share,{lk:'share'},'ns-lk-share'));
  const nav=el('span','ns-lk-nav');nav.append(btn('‹',{lk:'prev'}),btn('›',{lk:'next'}));nav.children[0].setAttribute('aria-label','앞 자물쇠');nav.children[1].setAttribute('aria-label','옆 자물쇠');row.append(nav);
  box.append(head,text,by,row);
  if(conn==='online'&&bundle>0)box.append(btn(T.bundle(bundle),{lk:'bundle'},'ns-lk-bundle'));
  card.append(box);return true;
 }
 function openReport(){
  const l=view.lock,slot=view.slot;openShell('report');view.slot=slot;view.lock=l;view.reason=null;
  const box=el('div','ns-lock-in ns-lk-read');const head=el('div','ns-lk-head');head.append(el('span','ns-lk-eyebrow',T.reportTitle),btn('✕',{lk:'close'},'ns-lk-x'));
  const quote=el('p','ns-lk-quote',`“${l.text||T.empty}” — ${l.name||'동동이'}`);
  const reasons=el('div','ns-lk-reasons');for(const r of LOCK_REPORT_REASONS){const b=btn(LOCK_REPORT_LABEL[r],{reason:r});b.setAttribute('aria-pressed','false');reasons.append(b);}
  const row=el('div','ns-row');const go=btn(T.reportGo,{lk:'report-go'},'on');go.disabled=true;row.append(go,btn(T.cancel,{lk:'back'}));
  box.append(head,quote,reasons,row,el('small','',T.reportNote));card.append(box);
 }
 function openUnhang(){
  const l=view.lock,slot=view.slot,entry=view.entry;openShell('unhang');view.slot=slot;view.lock=l;view.entry=entry;
  const box=el('div','ns-lock-in ns-lk-read');box.append(el('h3','',T.unhangTitle),el('p','ns-lk-quote',`“${l.text||T.empty}”`),el('p','',T.unhangNote));
  const row=el('div','ns-row');row.append(btn(T.unhang,{lk:'unhang-go'},'on'),btn(T.cancel,{lk:'back'}));box.append(row);card.append(box);
 }
 function openBundle(page=0){openShell('bundle');Object.assign(view,{page,total:bundle,list:null});paintBundle();send({t:'lk-bundle',owner:key,page});}
 function paintBundle(){
  card.replaceChildren();const box=el('div','ns-lock-in ns-lk-read');const head=el('div','ns-lk-head');head.append(el('span','ns-lk-eyebrow',T.bundleTitle(view.total)),btn('✕',{lk:'close'},'ns-lk-x'));box.append(head);
  const ul=el('ul','ns-lk-list');
  if(!view.list)ul.append(el('li','ns-lk-by','불러오는 중…'));
  else for(const l of view.list){if(reportedHere.has(l.id))continue;const li=el('li');li.append(el('p','ns-lk-text small'+(l.text?'':' empty'),l.text||T.empty),el('p','ns-lk-by',T.byShort(l.mine?'나':l.name||'동동이',lockDate(l.at))));
   if(!l.mine)li.append(btn(T.report,{lk:'report-b',id:l.id},'ns-lk-link'));ul.append(li);}
  const pages=Math.max(1,Math.ceil(view.total/LOCK_RULES.bundlePage)),nav=el('div','ns-row');nav.append(btn('‹',{lk:'bprev'}),el('span','ns-lk-page',`${view.page+1} / ${pages}`),btn('›',{lk:'bnext'}));
  box.append(ul,nav);card.append(box);
 }
 function doReport(id,reason){
  send({t:'lk-report',owner:key,id,reason});reportedHere.add(id);relayout();toast(T.reported,{ms:2600});
 }
 card.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.c){pick.c=+d.c;paintPick();return;}if(d.h){pick.h=+d.h;paintPick();return;}
  if(d.reason&&view?.kind==='report'){view.reason=d.reason;for(const x of card.querySelectorAll('[data-reason]'))x.setAttribute('aria-pressed',String(x===b));card.querySelector('[data-lk="report-go"]').disabled=false;return;}
  switch(d.lk){
   case 'hang':hang();break;case 'close':closeCard();break;
   case 'unfold':card.querySelector('input')?.blur();card.classList.remove('ns-lk-typing');break;
   case 'prev':case 'next':{const s=neighbor(view.slot,d.lk==='next'?1:-1);openRead(s);break;}
   case 'report':openReport();break;
   case 'report-go':if(view.reason){doReport(view.lock.id,view.reason);closeCard();}break;
   case 'back':openRead(view.slot)||closeCard();break;
   case 'unhang':openUnhang();break;
   case 'unhang-go':{const v=view.entry;if(v.kind==='local'){const k=locals().indexOf(v.lock);if(k>=0){locals().splice(k,1);persist();}relayout();toast(T.unhung(mineCount()),{ms:2400});}
    else{send({t:'lk-del',owner:key,id:v.lock.id});server.delete(v.lock.id);lastMine=serverMine();relayout();toast(T.unhung(mineCount()),{ms:2400});}
    closeCard();break;}
   case 'share':{const l=view.lock;if(pending)break;const id=++q;pending={q:id,promote:l,timer:setTimeout(()=>{if(pending?.q===id){pending=null;toast(LOCK_ERR.busy,{ms:2600});}},LOCK_RULES.replyMs)};
    send({t:'lk-hang',q:id,owner:key,slot:view.slot,c:l.c,h:l.h,text:l.text??''});b.disabled=true;b.textContent=T.hanging;break;}
   case 'bundle':openBundle(0);break;
   case 'bprev':case 'bnext':{const pages=Math.max(1,Math.ceil(view.total/LOCK_RULES.bundlePage)),p=(view.page+(d.lk==='bnext'?1:-1)+pages)%pages;view.page=p;view.list=null;paintBundle();send({t:'lk-bundle',owner:key,page:p});break;}
   case 'report-b':{const l=view.list?.find(x=>x.id===d.id);if(l){const page=view.page;openShell('report');view.lock=l;view.slot=-1;view.reason=null;view.backBundle=page;openReportFor(l);}break;}
  }
 });
 function openReportFor(l){view.lock=l;const box=el('div','ns-lock-in ns-lk-read');const head=el('div','ns-lk-head');head.append(el('span','ns-lk-eyebrow',T.reportTitle),btn('✕',{lk:'close'},'ns-lk-x'));
  const reasons=el('div','ns-lk-reasons');for(const r of LOCK_REPORT_REASONS){const b=btn(LOCK_REPORT_LABEL[r],{reason:r});b.setAttribute('aria-pressed','false');reasons.append(b);}
  const row=el('div','ns-row');const go=btn(T.reportGo,{lk:'report-go'},'on');go.disabled=true;row.append(go,btn(T.cancel,{lk:'close'}));
  box.append(head,el('p','ns-lk-quote',`“${l.text||T.empty}” — ${l.name||'동동이'}`),reasons,row,el('small','',T.reportNote));card.append(box);}

 // ── 누르기·마우스 올림(난간 가까이에서만) ──
 const near=()=>!!spot&&Math.hypot(me().x-spot.x,me().z-spot.z)<6;
 function hit(x,y){
  if(!project||!near())return -1;const r=coarse()?30:22;let best=-1,bd=r*r;
  for(const s of layout.keys()){const a=slots[s]?.at;if(!a)continue;const q2=project(a[0],a[1],a[2]);if(!q2?.visible)continue;const d=(q2.x-x)**2+(q2.y-y)**2;if(d<bd){bd=d;best=s;}}
  return best;
 }
 // 게임 화면(#world)과 휴대폰 오른쪽 「드래그로 둘러보기」 판(#look-zone) 위에서 누른 것을 받는다(둘러보기와 구분: 8px 넘게 움직이면 누르기 아님)
 let down=null;
 const onWorld=t=>!!canvas&&(t===canvas||!!t?.closest?.('#look-zone'));
 addEventListener('pointerdown',e=>{down=onWorld(e.target)?{x:e.clientX,y:e.clientY,id:e.pointerId}:null;},true);
 addEventListener('pointerup',e=>{const d=down;down=null;if(!d||d.id!==e.pointerId||!onWorld(e.target)||document.pointerLockElement||Math.hypot(e.clientX-d.x,e.clientY-d.y)>8)return;if(view?.kind==='hang')return;const s=hit(e.clientX,e.clientY);if(s>=0)openRead(s);},true);
 canvas?.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||down||document.pointerLockElement||view)return;const s=hit(e.clientX,e.clientY);LK?.hover(s);canvas.style.cursor=s>=0?'pointer':'';});
 // 키보드 2·할 일 줄 「자물쇠 읽기」: 화면 가운데에서 가장 가까운 자물쇠
 function readNearest(){if(!layout.size){toast(conn==='online'?'아직 걸린 자물쇠가 없어요':T[conn]??T.solo);return false;}
  const cx=innerWidth/2,cy=innerHeight/2;let best=-1,bd=Infinity;for(const s of layout.keys()){const a=slots[s]?.at;const p=a&&project?.(a[0],a[1],a[2]);const d=p?.visible?(p.x-cx)**2+(p.y-cy)**2:1e12+s;if(d<bd){bd=d;best=s;}}
  return openRead(best);}

 // ── 매 프레임(0.5초마다): 옛 화면 lk- 공유, 상태 알림 ──
 let tickAt=0;
 function tick(){
  const t=clock();if(t-tickAt<500)return;tickAt=t;
  if(multi&&conn==='online'){let changed=false;const seen=new Set();
   for(const r of multi.info?.().roster??[]){seen.add(r.id);const list=decodeLocks(r.act?.x);const sig=list.map(lockCode).join();const had=legacy.get(r.id);
    if(!list.length){if(had){legacy.delete(r.id);changed=true;}continue;}
    if(had?.sig!==sig){const v=list.map(l=>({...l,name:r.name,at:0,text:''}));v.sig=sig;legacy.set(r.id,v);changed=true;}}
   for(const id of [...legacy.keys()])if(!seen.has(id)){legacy.delete(id);changed=true;}
   if(changed)relayout();}
  if(nearRail(8)){const s=conn==='online'?'':conn==='loading'?(t-loadingSince>2000?'loading':''):conn;
   if(s&&s!==notedState&&(!notedNear||s!==notedState)){notedNear=true;notedState=s;toast(T[s],{ms:4000});}}
 }
 const rowHang=key2=>{const n=mineCount();return {key:key2,label:'사랑의 자물쇠 걸기',sub:`내 ${n} / ${max}`,state:n>=max||conn==='loading'?'lock':'ready',reason:n>=max?T.full(max):conn==='loading'?T.waitLoad:''};};
 const rowRead=key2=>({key:key2,label:'자물쇠 읽기',sub:conn==='online'?`걸린 자물쇠 ${[...layout.values()].filter(v=>v.kind!=='legacy').length}개`:conn==='solo'?'혼자 걷기 중 · 내 자물쇠만':conn==='loading'?'불러오는 중…':'지금은 내 자물쇠만 보여요',state:layout.size?'ready':'lock',reason:layout.size?'':conn==='online'?'아직 걸린 자물쇠가 없어요':'걸린 자물쇠가 없어요'});

 relayout();
 return {
  attach,
  detach,openHang,openRead,readNearest,close:closeCard,hang,tick,rowHang,rowRead,
  get isOpen(){return !card.hidden;},get mode(){return view?.kind??null;},get reading(){return !!view&&view.kind!=='hang';},
  // 카메라: 걸기 카드 동안 걸 자리, 읽기 카드 동안 연 자물쇠, 건 뒤 4.5초 그 자리
  camSlot(){if(view?.kind==='hang')return view.aim;if(view&&view.slot>=0)return view.slot;if(viewSlot&&clock()<viewSlot.until)return viewSlot.i;return -1;},
  card,key,
  state:()=>({conn,server:[...server.values()].map(l=>({...l})),bundle,local:locals().map(l=>({...l})),legacy:[...legacy].map(([id,v])=>({id,locks:v.map(l=>({i:l.i,c:l.c,h:l.h}))})),
   layout:[...layout].map(([s,v])=>({slot:s,kind:v.kind,id:v.lock.id??null,text:v.lock.text??'',mine:v.kind==='local'||!!v.lock.mine})),reported:[...reportedHere],mine:mineCount(),hung,
   card:card.hidden?null:{kind:view?.kind,slot:view?.slot??null,aim:view?.aim??null,text:card.querySelector('.ns-lk-text')?.textContent??null,err:card.querySelector('.ns-lk-err:not([hidden])')?.textContent??null,busy:!!pending}}),
  pick
 };
}
