// 넓힌 광장 이동 돕기 화면(월드개발, 2026-11-17 5차). 시안 B(?look=festive-b)에서만 main.js가 만든다. 규칙·목적지는 travel.js.
// 구조(월드아트 디자인을 입힐 자리, 크기는 CSS 변수 travel-ui.css):
//  - 「달리기」 단추 .xt-run(오른쪽 행동 단추 줄 위, PC는 Shift 표시). 톡 = 켜짐/꺼짐(aria-pressed), 누르고 있기 = 누르는 동안만 달림. 못 쓰는 때는 흐리게(data-off)
//    누름은 pointerdown에서 바로 받는다(11-18): 조이스틱을 다른 손가락으로 누른 채 톡 하면 click이 안 생겨 걷는 중에는 안 켜지던 결함.
//    자리는 CSS 기본(아래에서 --xt-run-bottom)에서, 위 오른쪽 단추 줄·행동 단추·▲▼·눈덩이 수와 겹치면 오른쪽 세로 줄의 빈 칸으로 옮긴다(placeRun).
//  - 지도 단추 .xt-map-btn(위 오른쪽 둥근 단추 줄 .xh-tr 맨 앞, 48px)
//  - 지도 창 .xt-map(가운데, 정사각형에 가까운 판 .xt-board 최대 560px): 바탕 SVG(광장·마당·집·회전목마·링크·산·케이블카 줄) +
//    핀 .xt-pin(44px 누르는 곳, 아이콘 + 이름) + 내 자리 .xt-me(방향 화살표) + 다른 사람 점 .xt-dot. 핀을 누르면 onGo(id)
//  - 화면 어두워짐 .xt-fade(이동하는 동안 0.22초씩)
// main.js와는 생성 인자(콜백)와 반환 객체로만 만난다.
import './travel-ui.css';
import {icon} from '../icons/icon.js';
import {openWin,closeWin,onWin} from '../ui-frame.js';
import {mapBounds,mapShapes,toMap,TRAVEL,placeRun,RUN_HOLD_MS} from './travel.js';
import {attachSheet} from '../ui-sheet.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=t=>`${(t*100).toFixed(2)}%`;

// spots = travelSpots() · shapes = mapShapes() · onRun(on) · onGo(id) · where() → {x,z,heading} · others() → [{x,z}] · doc
export function createTravelUi({spots,shapes=mapShapes(),mobile=false,onRun=()=>{},onGo=()=>{},onOpen=()=>{},where=()=>({x:0,z:0,heading:0}),others=()=>[],doc=document}){
 const B=mapBounds(),W=B.x1-B.x0,D=B.z1-B.z0;
 const root=doc.createElement('div');root.className='xt';
 // 바탕 SVG(세계 좌표 그대로: viewBox = 지도 범위)
 const sx=x=>(x-B.x0).toFixed(2),sz=z=>(z-B.z0).toFixed(2);
 const S=shapes,svg=`<svg class="xt-art" viewBox="0 0 ${W} ${D}" preserveAspectRatio="none" aria-hidden="true">
  <rect class="xt-snow" x="0" y="0" width="${W}" height="${D}"/>
  <rect class="xt-hill" x="${sx(S.mountain.x0)}" y="0" width="${S.mountain.x1-S.mountain.x0}" height="${sz(S.mountain.z1)}" rx="6"/>
  <circle class="xt-fence" cx="${sx(0)}" cy="${sz(0)}" r="${S.fence.r}"/>
  <circle class="xt-plaza" cx="${sx(0)}" cy="${sz(0)}" r="${S.plaza.r}"/>
  ${S.yards.map(y=>`<rect class="xt-yard" x="${sx(y.x)}" y="${sz(y.z)}" width="${y.w}" height="${y.d}" rx="1.5"/>`).join('')}
  ${S.rink?`<rect class="xt-rink" x="${sx(S.rink.x)}" y="${sz(S.rink.z)}" width="${S.rink.w}" height="${S.rink.d}" rx="${S.rink.r}"/>`:''}
  ${S.carousel?`<circle class="xt-carousel" cx="${sx(S.carousel.x)}" cy="${sz(S.carousel.z)}" r="${S.carousel.r}"/>`:''}
  ${S.houses.map(h=>`<rect class="xt-house" x="${(h.x-B.x0-2.4*h.s).toFixed(2)}" y="${(h.z-B.z0-2.4*h.s).toFixed(2)}" width="${(4.8*h.s).toFixed(2)}" height="${(4.8*h.s).toFixed(2)}" rx=".8"/>`).join('')}
  <line class="xt-cable" x1="${sx(S.gondola.a.x)}" y1="${sz(S.gondola.a.z)}" x2="${sx(Math.max(B.x0,S.gondola.b.x))}" y2="${sz(Math.max(B.z0,S.gondola.b.z))}"/>
  <circle class="xt-tree" cx="${sx(S.tree.x)}" cy="${sz(S.tree.z)}" r="${S.tree.r}"/>
 </svg>`;
 const pins=spots.map(s=>{const m=toMap(s.mx??s.x,s.mz??s.z,B);
  return `<button type="button" class="xt-pin${m.edge?' xt-edge':''}" data-go="${esc(s.id)}" style="left:${pct(m.u)};top:${pct(m.v)}" aria-label="${esc(s.label)}(으)로 가기"><i>${icon(s.ic,{size:'s',fallback:s.fb})}</i><span>${m.edge?'↑ ':''}${esc(s.label)}</span></button>`;}).join('');
 root.innerHTML=`
<button type="button" class="xt-run" aria-pressed="false" aria-label="달리기"><i>${icon('x-run',{size:'m'})}</i><span>달리기</span>${mobile?'':'<kbd>Shift</kbd>'}</button>
<section class="xt-map" hidden role="dialog" aria-label="바로 가기 지도">
 <header><b>${icon('x-map',{size:'s'})} 바로 가기</b><span class="xt-sub">가고 싶은 곳을 누르세요</span><button type="button" class="xt-x" data-x="close" aria-label="지도 닫기">✕</button></header>
 <div class="xt-board">${svg}<div class="xt-dots"></div>${pins}<i class="xt-me-ring" aria-hidden="true"></i><i class="xt-me" aria-label="내 자리"></i></div>
</section>
<div class="xt-fade" aria-hidden="true"></div>`;
 doc.body.appendChild(root);doc.documentElement.classList.add('xt-on'); // 가로 휴대폰 위 칩 줄 왼쪽 붙이기(travel-ui.css)는 이 화면만
 const boardEl=root.querySelector('.xt-board');boardEl.style.aspectRatio=`${W} / ${D}`;boardEl.style.setProperty('--xt-ar',String(W/D));
 // 바탕 그림(월드아트 public/christmas/map/plaza-map-b.svg, 범위 = mapBounds()). 그림이 없으면 아래 SVG(.xt-art)를 다시 보이게 하면 됨
 boardEl.style.backgroundImage=`url(${import.meta.env?.BASE_URL??'/'}christmas/map/plaza-map-b.svg)`;
 const run=root.querySelector('.xt-run'),map=root.querySelector('.xt-map'),board=root.querySelector('.xt-board'),dots=root.querySelector('.xt-dots'),me=root.querySelector('.xt-me'),meRing=root.querySelector('.xt-me-ring'),fade=root.querySelector('.xt-fade');
 // 지도 단추: 위 오른쪽 둥근 단추 줄(hud.js .xh-tr) 맨 앞에. 줄이 없으면 이 화면 안에
 const mapBtn=doc.createElement('button');mapBtn.type='button';mapBtn.className='xh-round xt-map-btn';mapBtn.setAttribute('aria-label','바로 가기 지도');mapBtn.setAttribute('aria-haspopup','dialog');mapBtn.innerHTML=icon('x-map',{size:'m'});
 // 11-18 공통 틀이 있으면 위 오른쪽 공통 줄(.uf-tr) 맨 앞 = 콘텐츠 전용 1칸, 지도 창은 메뉴와 같은 시트 자리(travel-ui.css)
 const ufTr=doc.querySelector('.uf-tr');
 if(ufTr){mapBtn.classList.add('uf-rb');ufTr.prepend(mapBtn);map.classList.add('uf-mapsheet','xt-on-body');doc.body.appendChild(map);} // 지도 창은 위 단추 줄(46)보다 위에 오게 body로
 else{const tr=doc.querySelector('.xh-tr');if(tr)tr.prepend(mapBtn);else root.appendChild(mapBtn);}
 let runOn=false,runOff=false,othersT=0;const runLabel=run.querySelector('span');
 const setRunView=()=>{run.setAttribute('aria-pressed',String(runOn));run.classList.toggle('on',runOn);run.toggleAttribute('data-off',runOff);};
 const setRun=on=>{if(runOn===on)return;runOn=on;setRunView();onRun(runOn);};
 // 톡: 꺼져 있으면 누르는 순간 켜고, 켜져 있으면 뗄 때 끔. 누르고 있기(0.35초 이상): 누르는 동안 달리고 떼면 누르기 전 상태로
 let press=null;
 run.addEventListener('pointerdown',e=>{if(runOff||e.button>0)return;e.preventDefault();try{run.setPointerCapture(e.pointerId);}catch{}press={id:e.pointerId,at:performance.now(),was:runOn};setRun(true);});
 const release=(e,cancel=false)=>{if(!press||e.pointerId!==press.id)return;const held=cancel||performance.now()-press.at>=RUN_HOLD_MS,was=press.was;press=null;run.blur();
  if(runOff)return;if(held)setRun(was);else if(was)setRun(false);};
 run.addEventListener('pointerup',e=>release(e));run.addEventListener('pointercancel',e=>release(e,true));run.addEventListener('lostpointercapture',e=>release(e,true));
 run.addEventListener('click',e=>{if(e.detail!==0||runOff)return;setRun(!runOn);}); // 키보드(Enter·Space)만. 손가락·마우스는 위 pointer로
 // 자리 맞추기: 0.2초마다·화면 크기 바뀔 때. 지도 창이 열려 있거나 단추가 숨어 있으면 건너뜀
 const BLOCKS='button,[role=button],.xf-ammo,.xs-alt';let placeT=0;
 function place(){
  if(run.dataset.uf){run.style.bottom=run.style.right='';return;} // 공통 틀 자리(data-uf)면 CSS가 놓는다
  run.style.bottom=run.style.right='';const r=run.getBoundingClientRect();if(!r.width)return;
  const H=doc.documentElement.clientHeight||innerHeight,W=doc.documentElement.clientWidth||innerWidth;
  const boxes=[...doc.querySelectorAll(BLOCKS)].filter(e=>e!==run&&(!root.contains(e)||e===mapBtn)).map(e=>{if(e.closest('[hidden]'))return null;const b=e.getBoundingClientRect();if(b.width<2||b.height<2)return null;
   let n=e;while(n&&n!==doc.documentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||+c.opacity<.05)return null;n=n.parentElement;}return b;}).filter(Boolean);
  // 오른쪽 세로 줄 → 막히면 그 왼쪽 한 줄(조이스틱이 생기는 왼쪽 절반은 넘지 않음)
  for(const dx of [0,r.width+12]){
   const L=r.left-dx,R=r.right-dx;if(L<W/2)break;
   const y=placeRun(r.top,r.height,boxes.filter(b=>b.right>L-4&&b.left<R+4).map(b=>({y:b.top,h:b.height})),{lo:8,hi:H-8,gap:10});
   if(y===null)continue;
   if(dx)run.style.right=`${Math.round(W-R)}px`;
   if(Math.abs(y-r.top)>.5)run.style.bottom=`${Math.round(H-y-r.height)}px`;
   run.dataset.moved=dx||Math.abs(y-r.top)>.5?'1':'';return;
  }
  run.dataset.moved='';
 }
 addEventListener('resize',()=>{placeT=0;});
 const open=on=>{const was=!map.hidden;map.hidden=!on;mapBtn.setAttribute('aria-pressed',String(on));mapBtn.classList.toggle('on',!!on);if(on){othersT=0;draw(0);onOpen();if(!was&&ufTr)openWin('map',{doc});}else if(was&&ufTr)closeWin('map',{doc});};
 // 공통 틀이면 공통 바텀시트(11-24): 세로 = 위 64px만 남기고 크게·쓸어내려 닫기(지도 판 위는 쓸기 제외), 가로 = 오른쪽 판·오른쪽으로 밀어 닫기, 바깥 누름·Esc
 if(ufTr){onWin('map',()=>{if(!map.hidden)open(false);});
  attachSheet(map,{doc,win:doc.defaultView??globalThis,close:()=>open(false),tall:true,handle:'header',noSwipe:'.xt-board',closeBtn:'.xt-x',toggle:mapBtn,ignore:'.uf-tr'});}
 else doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!map.hidden)open(false);});
 mapBtn.addEventListener('click',()=>open(map.hidden));
 map.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){open(false);onGo(b.dataset.go);return;}if(e.target.closest('[data-x="close"]'))open(false);});
 function draw(dt){
  const p=where(),m=toMap(p.x,p.z,B);me.style.left=meRing.style.left=pct(m.u);me.style.top=meRing.style.top=pct(m.v);me.style.transform=`translate(-50%,-50%) rotate(${(-p.heading).toFixed(3)}rad)`;me.classList.toggle('xt-edge',m.edge);
  othersT-=dt;if(othersT>0)return;othersT=1/TRAVEL.othersHz;
  const list=others();
  while(dots.children.length<list.length)dots.appendChild(doc.createElement('i'));
  [...dots.children].forEach((el,i)=>{const o=list[i];el.hidden=!o;if(!o)return;const q=toMap(o.x,o.z,B);el.style.left=pct(q.u);el.style.top=pct(q.v);});
 }
 return {
  get open(){return !map.hidden;},get run(){return runOn;},
  setOpen:open,
  // 달리기 상태를 밖에서 맞춤(Shift·자동 해제). blocked면 단추를 흐리게 하고 켜짐을 끈다
  syncRun({on=runOn,blocked=false,label='달리기'}={}){const was=runOn;runOff=blocked;runOn=blocked?false:on;setRunView();if(runLabel.textContent!==label){runLabel.textContent=label;run.setAttribute('aria-label',label);}if(was!==runOn)onRun(runOn);}, // label: 하늘 썰매 탄 동안 「빨리」(11-18)
  // 화면 어두워짐 → mid() → 밝아짐. 끝나면 resolve
  fade(mid){fade.classList.add('on');return new Promise(r=>setTimeout(()=>{try{mid?.();}finally{setTimeout(()=>{fade.classList.remove('on');setTimeout(r,TRAVEL.fadeMs);},60);}},TRAVEL.fadeMs));},
  update(dt){if(!map.hidden)draw(dt);placeT-=dt;if(placeT<=0){placeT=.2;place();}},place,
  status(){return {open:!map.hidden,run:runOn,runBlocked:runOff,pins:spots.map(s=>s.id),dots:[...dots.children].filter(e=>!e.hidden).length};},
  el:root,mapBtn,
 };
}
