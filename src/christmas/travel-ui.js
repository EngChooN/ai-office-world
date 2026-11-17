// 넓힌 광장 이동 돕기 화면(월드개발, 2026-11-17 5차). 시안 B(?look=festive-b)에서만 main.js가 만든다. 규칙·목적지는 travel.js.
// 구조(월드아트 디자인을 입힐 자리, 크기는 CSS 변수 travel-ui.css):
//  - 「달리기」 단추 .xt-run(왼쪽 아래 💬 위, 높이 52px·글 「달리기」, PC는 Shift 표시). 누르면 켜짐/꺼짐(aria-pressed). 못 쓰는 때는 흐리게(data-off)
//  - 지도 단추 .xt-map-btn(위 오른쪽 둥근 단추 줄 .xh-tr 맨 앞, 48px)
//  - 지도 창 .xt-map(가운데, 정사각형에 가까운 판 .xt-board 최대 560px): 바탕 SVG(광장·마당·집·회전목마·링크·산·케이블카 줄) +
//    핀 .xt-pin(44px 누르는 곳, 아이콘 + 이름) + 내 자리 .xt-me(방향 화살표) + 다른 사람 점 .xt-dot. 핀을 누르면 onGo(id)
//  - 화면 어두워짐 .xt-fade(이동하는 동안 0.22초씩)
// main.js와는 생성 인자(콜백)와 반환 객체로만 만난다.
import './travel-ui.css';
import {icon} from '../icons/icon.js';
import {mapBounds,mapShapes,toMap,TRAVEL} from './travel.js';

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
 const boardEl=root.querySelector('.xt-board');boardEl.style.aspectRatio=`${W} / ${D}`;
 // 바탕 그림(월드아트 public/christmas/map/plaza-map-b.svg, 범위 = mapBounds()). 그림이 없으면 아래 SVG(.xt-art)를 다시 보이게 하면 됨
 boardEl.style.backgroundImage=`url(${import.meta.env?.BASE_URL??'/'}christmas/map/plaza-map-b.svg)`;
 const run=root.querySelector('.xt-run'),map=root.querySelector('.xt-map'),board=root.querySelector('.xt-board'),dots=root.querySelector('.xt-dots'),me=root.querySelector('.xt-me'),meRing=root.querySelector('.xt-me-ring'),fade=root.querySelector('.xt-fade');
 // 지도 단추: 위 오른쪽 둥근 단추 줄(hud.js .xh-tr) 맨 앞에. 줄이 없으면 이 화면 안에
 const mapBtn=doc.createElement('button');mapBtn.type='button';mapBtn.className='xh-round xt-map-btn';mapBtn.setAttribute('aria-label','바로 가기 지도');mapBtn.setAttribute('aria-haspopup','dialog');mapBtn.innerHTML=icon('x-map',{size:'m'});
 const tr=doc.querySelector('.xh-tr');if(tr)tr.prepend(mapBtn);else root.appendChild(mapBtn);
 let runOn=false,runOff=false,othersT=0;
 const setRunView=()=>{run.setAttribute('aria-pressed',String(runOn));run.classList.toggle('on',runOn);run.toggleAttribute('data-off',runOff);};
 run.addEventListener('click',()=>{if(runOff)return;runOn=!runOn;setRunView();onRun(runOn);});
 const open=on=>{map.hidden=!on;mapBtn.setAttribute('aria-pressed',String(on));if(on){othersT=0;draw(0);onOpen();}};
 mapBtn.addEventListener('click',()=>open(map.hidden));
 map.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){open(false);onGo(b.dataset.go);return;}if(e.target.closest('[data-x="close"]'))open(false);});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!map.hidden)open(false);});
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
  syncRun({on=runOn,blocked=false}={}){const was=runOn;runOff=blocked;runOn=blocked?false:on;setRunView();if(was!==runOn)onRun(runOn);},
  // 화면 어두워짐 → mid() → 밝아짐. 끝나면 resolve
  fade(mid){fade.classList.add('on');return new Promise(r=>setTimeout(()=>{try{mid?.();}finally{setTimeout(()=>{fade.classList.remove('on');setTimeout(r,TRAVEL.fadeMs);},60);}},TRAVEL.fadeMs));},
  update(dt){if(!map.hidden)draw(dt);},
  status(){return {open:!map.hidden,run:runOn,runBlocked:runOff,pins:spots.map(s=>s.id),dots:[...dots.children].filter(e=>!e.hidden).length};},
  el:root,mapBtn,
 };
}
