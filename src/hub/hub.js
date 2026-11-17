// 허브(/) 체험 고르기 화면. three.js를 쓰지 않는다(그림은 인라인 SVG, 색은 CSS 변수).
// 11-17 허브 개선(대표 확정): PC = 시안 B 「동동이 마을 지도」(장소 4곳 + 가운데 동동이 + 오른쪽 판), 휴대폰(좁거나 낮은 화면) = 시안 A 「책갈피 카드 목록」(4칸이 한 화면).
// 서버는 허브에서 바로 고른다: 판(휴대폰은 아래에서 올라오는 판)에 서버 3개 인원·켜짐/확인 중/꺼짐(hub-servers.js), 「n서버로 들어가기」·「혼자 하기」를 누르면
// handoff.js로 고른 값을 넘기고 체험으로 간다(체험은 서버 고르기 창 대신 바로 입장, 직접 들어온 사람은 예전처럼 창).
// 소리·설정은 세 체험 공용 하나(shared-settings.js). 시간대 색은 설정 → ?hubtime → 서울 지금 해 높이(-4° 미만 밤, 8° 미만 노을).
import {EXPERIENCES,NEXT_SLOT,experienceHref} from './experiences.js';
import {ART,hubTime} from './art.js';
import {dongdong} from './dongdong.js';
import {hubServerView,hubTotal} from './hub-servers.js';
import {writeHubPick} from './handoff.js';
import {sunPosition} from '../daytime.js';
import {icon,iconText} from '../icons/icon.js';
import {PICK_LABELS,NAME_KEY,loadPickName,savePickName} from '../server-pick.js';
import {NET} from '../multi-protocol.js';
import {loadShared,saveShared} from '../shared-settings.js';
export {ART,hubTime};

export const LAST_KEY='aoworld:last-exp';
// 휴대폰 목록형으로 바꾸는 기준: 폭 760px 이하(세로 휴대폰) 또는 높이 500px 이하(가로 휴대폰)
export const LIST_QUERY='(max-width:760px), (max-height:500px)';
export const layoutFor=(w,h)=>w<=760||h<=500?'list':'map';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ALL=()=>[...EXPERIENCES,NEXT_SLOT];
const byId=id=>ALL().find(e=>e.id===id)??EXPERIENCES[0];
const isNext=e=>e.id===NEXT_SLOT.id;
// 지도 위 자리(%, 지도 칸 기준): 왼위·오른위·왼아래·오른아래. 체험이 4개를 넘으면 지도를 다시 그려야 한다(시안 B 단점).
export const MAP_POS=Object.freeze({hiking:[24,31],smoking:[76,31],christmas:[24,75],next:[76,75]});
const posOf=(e,i)=>MAP_POS[e.id]??[[24,31],[76,31],[24,75],[76,75]][i%4];

/** 시간대: forced(?hubtime) → 설정(auto 아니면) → 해 높이 */
export function pickHubTime({forced=null,setting='auto',elevation=NaN}={}){
 if(['day','dusk','night'].includes(forced))return forced;
 if(['day','dusk','night'].includes(setting))return setting;
 return hubTime(elevation);
}
// 체험 한 곳의 인원 글자(장소 깃발·카드·다른 곳 목록)
export function statusHTML(view,{long=false}={}){
 if(view.state==='checking')return `<span class="hb-st hb-st-wait">${icon('c-net-connecting',{size:'xs'})}인원 확인 중</span>`;
 if(view.state==='off')return `<span class="hb-st hb-st-off">${icon('c-server-off',{size:'xs'})}${long?'서버가 쉬는 중 · 혼자 하기는 돼요':'혼자 하기만'}</span>`;
 const n=view.here??0;
 return `<span class="hb-st hb-st-on${n?'':' hb-st-zero'}">${icon('c-people',{size:'xs'})}${n?`<b>${n}명</b> 함께하는 중`:'지금은 아무도 없어요'}</span>`;
}
// 서버 줄(판). picked = 고른 서버 id
export function serverListHTML(e,view,picked){
 if(view.state==='checking')return `<li class="hb-srv hb-srv-msg">${icon('c-net-connecting',{size:'s'})}서버 인원을 확인하고 있어요</li>`;
 if(view.state==='off')return `<li class="hb-srv hb-srv-msg">${icon('c-server-off',{size:'s'})}지금은 함께하기 서버가 쉬고 있어요. 혼자 하기로 들어갈 수 있어요</li>`;
 return view.rows.map(r=>{
  const pct=Math.min(100,Math.round((r.count??0)/r.max*100)),on=r.id===picked;
  return `<li><button type="button" class="hb-srv${r.full?' hb-srv-full':''}${on?' is-pick':''}" data-srv="${esc(r.id)}"${r.full?' disabled':''} aria-pressed="${on}" aria-label="${esc(r.name)} ${r.count}명 / ${r.max}명${r.full?' 꽉 참':''}">
<span class="hb-srv-name">${icon(r.full?'c-net-full':on?'c-check':'c-net-ok',{size:'s'})}${esc(r.name)}</span><span class="hb-srv-bar" aria-hidden="true"><i style="width:${pct}%"></i></span><span class="hb-srv-n">${r.full?'꽉 참':`${r.count}/${r.max}`}</span></button></li>`;}).join('');
}
// 들어가기 단추들. data-enter: server(고른 서버로 바로) · solo(혼자 하기) · pick(체험에서 서버 고르기 창)
export function enterHTML(e,view,picked,base='/'){
 if(isNext(e))return `<button type="button" class="hb-go" data-fb="idea">${iconText('c-fb-idea','가 보고 싶은 곳 알려 주기',{size:'m'})}</button>`;
 const href=esc(experienceHref(e,base)),L=PICK_LABELS[e.id]??PICK_LABELS.hiking,id=esc(e.id);
 const solo=(main=false)=>`<a class="${main?'hb-go':'hb-solo'}" href="${href}" data-enter="solo" data-exp="${id}">${iconText('c-person',main?`${L.solo}로 들어가기`:L.solo,{size:main?'m':'s'})}</a>`;
 if(view.state==='off')return solo(true);
 if(view.state==='checking')return `<a class="hb-go" href="${href}" data-enter="pick" data-exp="${id}">${iconText('c-enter','들어가서 서버 고르기',{size:'m',after:true})}</a>${solo()}`;
 const s=view.rows.find(r=>r.id===picked&&!r.full);
 if(!s)return `<p class="hb-full-note">${icon('c-net-full',{size:'s'})}서버가 모두 꽉 찼어요. 잠시 뒤 다시 보거나 혼자 할 수 있어요</p>${solo(true)}`;
 return `<a class="hb-go" href="${href}" data-enter="server" data-server="${esc(s.id)}" data-exp="${id}">${iconText('c-enter',`${s.id}서버로 들어가기`,{size:'m',after:true})}</a>${solo()}`;
}

/** 허브를 그린다. 돌려주는 값은 시험·점검용(상태 보기·서버 상태 넣기). */
export function mountHub(doc=document,{base=import.meta.env.BASE_URL,storage=globalThis.localStorage,session=globalThis.sessionStorage,nowMs=Date.now(),forced=null,win=globalThis.window}={}){
 const root=doc.getElementById('hub');if(!root)return null;
 let shared=loadShared(storage);
 const html=doc.documentElement;
 const applyTime=()=>{let el=NaN;try{el=sunPosition(nowMs).elevation;}catch{}html.dataset.hubTime=pickHubTime({forced,setting:shared.hubTime,elevation:el});};
 applyTime();
 let last=null;try{last=storage?.getItem(LAST_KEY)??null;}catch{}
 if(!EXPERIENCES.some(e=>e.id===last))last=null;
 const st={layout:layoutFor(win?.innerWidth??1920,win?.innerHeight??1080),sel:last??EXPERIENCES[0].id,picked:{},net:{net:'checking',health:null},sheet:false,settings:false};
 const viewOf=e=>hubServerView(e.id,st.net);
 // 고른 서버: 사람이 고른 것이 아직 들어갈 수 있으면 그것, 아니면 추천(bestServer)
 const pickedOf=e=>{const v=viewOf(e),p=st.picked[e.id];return p&&v.rows.some(r=>r.id===p&&!r.full)?p:v.best;};
 const recOf=e=>{try{return e.record?e.record(storage):null;}catch{return null;}};
 let actx=null;
 const tick=(f=660)=>{if(!shared.sound||!shared.volume)return;try{const AC=win.AudioContext||win.webkitAudioContext;if(!AC)return;actx??=new AC();const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.1*shared.volume+.0002,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g).connect(actx.destination);o.start();o.stop(t+.16);}catch{}};

 // ── 위 띠(두 모양 공용)
 const onlineHTML=()=>{const tot=hubTotal(st.net),v=hubServerView('hiking',st.net);
  return v.state==='on'?`<span class="hb-st hb-st-on">${icon('c-people',{size:'xs'})}<b>${tot??0}명</b><i>지금 접속 중</i></span>`:statusHTML(v);};
 const soundBtn=()=>`<button type="button" class="hb-btn${shared.sound?' is-on':''}" data-a="sound" aria-pressed="${shared.sound}" aria-label="${shared.sound?'소리 끄기':'소리 켜기'}">${icon(shared.sound?'c-sound':'c-sound-off',{size:'m'})}<span class="lbl">${shared.sound?'소리 켜짐':'소리 꺼짐'}</span></button>`;
 const topHTML=()=>`<header class="hb-top"><h1 class="hb-brand">${st.layout==='map'?compass:dongdong({outfit:'hike',cls:'hb-brand-dd'})}<span>온라인 메타버스${st.layout==='map'?'<small>동동이 마을 지도</small>':''}</span></h1>
<span class="hb-online" data-live="online" aria-live="polite">${onlineHTML()}</span>${soundBtn()}<button type="button" class="hb-btn" data-a="settings" aria-haspopup="dialog" aria-label="설정">${icon('c-settings',{size:'m'})}<span class="lbl">설정</span></button></header>`;

 // ── 판(PC 오른쪽 · 휴대폰 아래에서 올라옴) 내용
 function panelHTML(e,{more=false}={}){
  const v=viewOf(e),next=isNext(e),p=pickedOf(e);
  const srv=next?`<p class="hb-soon">${icon('c-lock',{size:'s'})}아직 문을 열지 않았어요. 체험이 늘면 이 자리에 생겨요</p>`
   :`<div class="hb-p-h"><span>함께할 서버</span>${v.state==='on'?`<span class="hb-st">${icon('c-people',{size:'xs'})}<b>${v.here}</b>/${v.cap}명</span>`:''}</div><ul class="hb-srvs" data-live="srvs">${serverListHTML(e,v,p)}</ul>`;
  return `<div class="hb-p-art">${ART[e.art]??''}${next?'':dongdong({outfit:e.outfit})}</div>
<span class="hb-p-place">${icon(e.icon,{size:'s'})}${esc(e.place)}</span><h2 class="hb-p-title" id="hb-p-title">${esc(e.title)}</h2><p class="hb-p-desc">${esc(e.desc)}</p>
${e.feats?`<ul class="hb-feats">${e.feats.map(([n,l])=>`<li>${icon(n,{size:'s'})}${esc(l)}</li>`).join('')}</ul>`:''}${srv}
<div class="hb-p-go" data-live="go">${enterHTML(e,v,p,base)}</div>
${more?`<nav class="hb-more" aria-label="다른 곳"><h3>다른 곳 둘러보기</h3><ul>${ALL().filter(o=>o.id!==e.id).map(o=>`<li><button type="button" data-jump="${o.id}" style="--mc:${o.color}">${icon(o.icon,{size:'s'})}<span>${esc(o.title)}</span>${isNext(o)?'':`<span data-live="st" data-exp="${o.id}">${statusHTML(viewOf(o))}</span>`}</button></li>`).join('')}</ul></nav>`:''}`;
 }
 const paintPanel=(el,e)=>{el.style.setProperty('--c',e.color);el.style.setProperty('--cd',e.dark);el.style.setProperty('--soft',e.soft);el.classList.toggle('is-next',isNext(e));};

 // ── PC: 동동이 마을 지도
 function mapHTML(){
  const e=byId(st.sel),items=ALL();
  const paths=items.map((o,i)=>{const [x,y]=posOf(o,i);return `<path d="M50 53 Q${(50+x)/2} ${y} ${x} ${y}" fill="none" class="hb-path" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 12" vector-effect="non-scaling-stroke"/>`;}).join('');
  return `<div class="hb-world"><svg class="hb-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M-5 58 C 20 50, 30 66, 50 60 S 80 48, 105 56" fill="none" class="hb-river" stroke-width="26" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${paths}</svg>
${[[6,52,1],[9,47,.8],[92,50,1],[45,13,.9],[58,90,.8],[40,91,1]].map(([x,y,s])=>tree(x,y,s)).join('')}
${topHTML()}
<nav class="hb-places" aria-label="체험 고르기">${items.map((o,i)=>{const [x,y]=posOf(o,i),on=o.id===st.sel;
  return `<a class="hb-place${isNext(o)?' next':''}${on?' on':''}" id="hub-${o.id}" ${isNext(o)?'href="#next" role="button"':`href="${esc(experienceHref(o,base))}"`} data-sel="${o.id}" style="--x:${x}%;--y:${y}%;--c:${o.color}" aria-current="${on?'true':'false'}" aria-label="${esc(o.title)} 고르기">
<span class="hb-isle">${ART[o.art]??''}${recOf(o)?`<span class="hb-stamp">${esc(recOf(o))}</span>`:''}</span><span class="hb-flag"><b>${icon(o.icon,{size:'s'})}${esc(isNext(o)?'준비 중':o.title.replace('온라인 ',''))}</b>${isNext(o)?`<span class="hb-st">${icon('c-lock',{size:'xs'})}곧 열려요</span>`:`<span data-live="st" data-exp="${o.id}">${statusHTML(viewOf(o))}</span>`}</span></a>`;}).join('')}</nav>
<div class="hb-me" aria-hidden="true">${dongdong({outfit:e.outfit??'hike',wave:true})}<span class="hb-bubble">${isNext(e)?'여긴 아직 공사 중!':`${esc(e.place)}로 갈까?`}</span></div></div>
<aside class="hb-panel" aria-labelledby="hb-p-title">${panelHTML(e,{more:true})}</aside>`;
 }
 // ── 휴대폰: 책갈피 카드 목록
 function listHTML(){
  const l=last?byId(last):null,lrec=l?recOf(l):null;
  return `${topHTML()}<main class="hb-main"><section class="hb-hero"><div class="hb-hero-t"><h2>오늘은 동동이와<br>어디 갈까요?</h2><p>혼자 해도, 함께 해도 돼요. 체험 ${EXPERIENCES.length}곳이 열려 있어요</p>
${l?`<button type="button" class="hb-cont" data-open="${l.id}" style="--c:${l.color};--soft:${l.soft}"><span class="tag">${icon(l.icon,{size:'s'})}</span><span class="hb-cont-t">이어하기 · ${esc(l.title)}</span>${lrec?`<small>${esc(lrec)}</small>`:''}${icon('c-right',{size:'s'})}</button>`:''}</div>
<div class="hb-trio" aria-hidden="true">${dongdong({outfit:'hike',wave:true})}${dongdong({outfit:'office'})}${dongdong({outfit:'santa'})}</div></section>
<ul class="hb-grid" aria-label="체험 고르기">${ALL().map(o=>{const rec=recOf(o),n=isNext(o);
  return `<li><a class="hb-card${n?' next':''}" id="hub-${o.id}" ${n?'href="#next" role="button"':`href="${esc(experienceHref(o,base))}"`} data-open="${o.id}" style="--c:${o.color}" aria-haspopup="dialog">
<span class="hb-tab">${icon(n?'c-wait':o.icon,{size:'xs'})}${esc(n?'곧 열려요':o.place)}</span>
<span class="hb-art">${ART[o.art]??''}${rec?`<span class="hb-stamp">${esc(rec)}</span>`:''}${n?'':dongdong({outfit:o.outfit})}</span>
<span class="hb-body"><b class="hb-title">${esc(o.title)}</b><span class="hb-desc">${esc(o.desc)}</span>
<span class="hb-foot">${n?`<span class="hb-st">${icon('c-lock',{size:'xs'})}준비 중</span>`:`<span data-live="st" data-exp="${o.id}">${statusHTML(viewOf(o))}</span>`}</span></span>
<span class="hb-chev" aria-hidden="true">${icon(n?'c-fb-idea':'c-right',{size:'s'})}</span></a></li>`;}).join('')}</ul>
<p class="hb-foot-note">동동이와 함께하는 온라인 체험</p></main>
<div class="hb-sheet-back" data-a="sheet-back"${st.sheet?'':' hidden'}><section class="hb-sheet hb-panel" role="dialog" aria-modal="true" aria-labelledby="hb-p-title"><div class="hb-grip" aria-hidden="true"></div>
<button type="button" class="hb-btn hb-x" data-a="sheet-close" aria-label="닫기">${icon('c-close',{size:'m'})}</button><div class="hb-sheet-in">${panelHTML(byId(st.sel))}</div></section></div>`;
 }
 // ── 설정 창(세 체험 공용 값)
 function settingsHTML(){
  const seg=(key,opts,cur)=>`<span class="hb-seg" role="group">${opts.map(([v,l])=>`<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${String(cur)===v}" class="${String(cur)===v?'is-on':''}">${l}</button>`).join('')}</span>`;
  return `<div class="hb-set-back" data-a="settings-back"${st.settings?'':' hidden'}><section class="hb-set" role="dialog" aria-modal="true" aria-labelledby="hb-set-t">
<header class="hb-set-h"><h2 id="hb-set-t">${icon('c-settings',{size:'m'})}설정</h2><button type="button" class="hb-btn" data-a="settings-close" aria-label="닫기">${icon('c-close',{size:'m'})}</button></header>
<p class="hb-set-note">여기서 바꾼 것은 모든 체험에 같이 적용돼요</p>
<label class="hb-row"><span>${icon('c-person',{size:'s'})}닉네임</span><input name="hb-name" type="text" maxlength="${NET.nameMax}" placeholder="비우면 자동 이름" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" value="${esc(loadPickName(storage))}"></label>
<div class="hb-row"><span>${icon(shared.sound?'c-sound':'c-sound-off',{size:'s'})}소리</span>${seg('sound',[['true','켜기'],['false','끄기']],shared.sound)}</div>
<label class="hb-row"><span>${icon('c-sound',{size:'s'})}소리 크기</span><input type="range" name="hb-vol" min="0" max="100" step="5" value="${Math.round(shared.volume*100)}" aria-label="소리 크기"></label>
<div class="hb-row"><span>${icon(shared.music?'c-music':'c-music-off',{size:'s'})}배경 음악<small>크리스마스 캐럴</small></span>${seg('music',[['true','켜기'],['false','끄기']],shared.music)}</div>
<div class="hb-row"><span>${icon('c-time-day',{size:'s'})}허브 시간대</span>${seg('hubTime',[['auto','자동'],['day','낮'],['dusk','노을'],['night','밤']],shared.hubTime)}</div>
<button type="button" class="hb-row hb-link" data-fb="talk"><span>${icon('c-feedback',{size:'s'})}의견 보내기</span>${icon('c-right',{size:'s'})}</button>
</section></div>`;
 }

 // ── 그리기
 function render(){
  const focusSel=doc.activeElement?.closest?.('[data-sel],[data-open],[data-jump]')?.id||null;
  root.dataset.layout=st.layout;
  root.innerHTML=`<div class="hb hb-${st.layout}">${st.layout==='map'?mapHTML():listHTML()}</div>${settingsHTML()}`;
  const panel=root.querySelector('.hb-panel');if(panel)paintPanel(panel,byId(st.sel));
  html.classList.toggle('hb-modal',st.sheet||st.settings);
  if(focusSel)doc.getElementById(focusSel)?.focus({preventScroll:true});
 }
 // 5초마다 인원만 바꿀 때: 화면 전체를 다시 그리지 않고 글자 자리만(동동이 깡충·포커스·입력 칸 유지)
 function renderLive(){
  const f=doc.activeElement?.dataset?.srv??null;
  for(const el of root.querySelectorAll('[data-live=st]'))el.innerHTML=statusHTML(viewOf(byId(el.dataset.exp)));
  const on=root.querySelector('[data-live=online]');if(on)on.innerHTML=onlineHTML();
  const e=byId(st.sel);
  for(const p of root.querySelectorAll('.hb-panel')){const s=p.querySelector('[data-live=srvs]');if(s)s.innerHTML=serverListHTML(e,viewOf(e),pickedOf(e));
   const h=p.querySelector('.hb-p-h');if(h&&!isNext(e)){const v=viewOf(e);h.innerHTML=`<span>함께할 서버</span>${v.state==='on'?`<span class="hb-st">${icon('c-people',{size:'xs'})}<b>${v.here}</b>/${v.cap}명</span>`:''}`;}
   const g=p.querySelector('[data-live=go]');if(g)g.innerHTML=enterHTML(e,viewOf(e),pickedOf(e),base);}
  if(f)root.querySelector(`[data-srv="${f}"]`)?.focus({preventScroll:true});
 }
 function select(id,{open=false}={}){
  if(!ALL().some(e=>e.id===id))return;
  const changed=st.sel!==id;st.sel=id;tick(700);
  if(st.layout==='list'){st.sheet=open||st.sheet;render();if(st.sheet)root.querySelector('.hb-sheet .hb-x')?.focus({preventScroll:true});}
  else if(changed){render();doc.getElementById(`hub-${id}`)?.focus({preventScroll:true});}
 }
 const closeSheet=()=>{if(!st.sheet)return;st.sheet=false;render();doc.getElementById(`hub-${st.sel}`)?.focus({preventScroll:true});};
 const openSettings=()=>{st.settings=true;render();tick(520);root.querySelector('[data-a=settings-close]')?.focus({preventScroll:true});};
 const closeSettings=()=>{if(!st.settings)return;st.settings=false;render();tick(440);root.querySelector('[data-a=settings]')?.focus({preventScroll:true});};
 function setShared(patch){
  shared=saveShared(patch,storage);
  if('hubTime' in patch)applyTime();
 }
 function enter(a){
  const exp=a.dataset.exp,kind=a.dataset.enter;
  writeHubPick(kind==='server'?{exp,server:a.dataset.server}:kind==='solo'?{exp,solo:true}:{exp},session);
  try{storage?.setItem(LAST_KEY,exp);}catch{}
  const name=root.querySelector('input[name=hb-name]');if(name)savePickName(name.value,storage);
 }
 const openFeedback=()=>{st.settings=false;st.sheet=false;render();win?.dispatchEvent?.(new CustomEvent('hub:feedback-open'));};

 root.addEventListener('click',ev=>{
  const t=ev.target;
  const enterA=t.closest('[data-enter]');if(enterA){enter(enterA);tick(760);return;} // 링크는 그대로 이동
  const srv=t.closest('[data-srv]');if(srv){if(srv.disabled)return;st.picked[st.sel]=srv.dataset.srv;tick(620);renderLive();root.querySelector(`[data-srv="${srv.dataset.srv}"]`)?.focus({preventScroll:true});return;}
  const fb=t.closest('[data-fb]');if(fb){ev.preventDefault();openFeedback();return;}
  const sel=t.closest('[data-sel]');if(sel){ev.preventDefault();select(sel.dataset.sel);return;}
  const op=t.closest('[data-open]');if(op){ev.preventDefault();select(op.dataset.open,{open:true});return;}
  const jump=t.closest('[data-jump]');if(jump){select(jump.dataset.jump);return;}
  const set=t.closest('[data-set]');if(set){const k=set.dataset.set,v=set.dataset.v;setShared({[k]:k==='hubTime'?v:v==='true'});tick(600);render();root.querySelector(`[data-set="${k}"][data-v="${v}"]`)?.focus({preventScroll:true});return;}
  const a=t.closest('[data-a]')?.dataset.a;
  if(a==='sound'){setShared({sound:!shared.sound});render();tick(880);root.querySelector('[data-a=sound]')?.focus({preventScroll:true});}
  else if(a==='settings')openSettings();
  else if(a==='settings-close'||(a==='settings-back'&&t.dataset.a==='settings-back'))closeSettings();
  else if(a==='sheet-close'||(a==='sheet-back'&&t.dataset.a==='sheet-back'))closeSheet();
 });
 root.addEventListener('input',ev=>{
  const t=ev.target;
  if(t.name==='hb-name')savePickName(t.value,storage);
  else if(t.name==='hb-vol')shared=saveShared({volume:Number(t.value)/100},storage);
 });
 root.addEventListener('change',ev=>{if(ev.target.name==='hb-vol')tick(600);});
 win?.addEventListener?.('keydown',ev=>{
  if(ev.key!=='Escape')return;
  if(st.settings){ev.preventDefault();closeSettings();}else if(st.sheet){ev.preventDefault();closeSheet();}
 });
 // 다른 탭(체험)에서 소리를 바꾸면 허브 단추도 따라간다
 win?.addEventListener?.('storage',ev=>{if(ev.key==='aoworld:settings:v1'||ev.key===NAME_KEY){shared=loadShared(storage);applyTime();if(!st.settings)render();}});
 let rt=0;
 win?.addEventListener?.('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{const l=layoutFor(win.innerWidth,win.innerHeight);if(l!==st.layout){st.layout=l;st.sheet=false;render();}},120);});
 render();
 return {
  get state(){return {layout:st.layout,sel:st.sel,sheet:st.sheet,settings:st.settings,net:st.net.net,shared:{...shared},picked:{...st.picked}};},
  setServers(net){st.net=net??{net:'checking',health:null};renderLive();},
  select,render,time:()=>html.dataset.hubTime,
 };
}

const compass=`<svg class="hb-compass" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="17" fill="#fbf3df" stroke="#4a3618" stroke-width="2.5"/><path d="M20 6 L24 20 L20 34 L16 20Z" fill="#b8452e" stroke="#4a3618" stroke-width="1.5" stroke-linejoin="round"/><path d="M20 20 L24 20 L20 34 L16 20Z" fill="#fbf3df"/><circle cx="20" cy="20" r="2" fill="#4a3618"/></svg>`;
const tree=(x,y,s=1)=>`<svg class="hb-deco" style="left:${x}%;top:${y}%;width:${28*s}px" viewBox="0 0 28 34" aria-hidden="true" focusable="false"><path d="M14 2 L26 26 H2Z" class="hb-deco-leaf" stroke-width="2" stroke-linejoin="round"/><rect x="12" y="26" width="4" height="6" fill="#6b4a2e"/></svg>`;
