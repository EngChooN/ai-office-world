// 온라인 등산 ← 공통 화면 틀(src/ui-frame.js) 연결(11-18 UI 개선, 대표 결정: 아래 탭 줄을 ☰ 메뉴 안으로).
//  - 위 왼쪽: 진행 알약(어디쯤 · 고도 + 스테미너 막대) · 시점 칩(늘 보임, AGENTS §3) · 함께 걷기 상태 칩·👥(둘째 줄)
//    알약을 누르면 예전 진행 카드(남은 거리·걸은 시간·간식)가 그 아래 펼쳐진다
//  - 위 오른쪽: 💬(hiking-chat-ui가 틀 자리에) · ☰
//  - ☰ 탭: 지도(예전 지도 창 내용) · 수첩(스탬프 수첩) · 배낭 · 쉬기 · 설정, 맨 위 빠른 줄 = 시각·날씨 · 소리 · 라디오(예전 꼬리표 .nb-tags)
//  - 오른쪽 아래: 큰 단추 = 도장(#auto: 걷기·멈추기·읽기…), 작은 단추 = 달리기·쌍안경·휴대폰 카메라, 할 일 칩 = 간식 먹기·들르기
// hud-notebook.js(시트 열고 닫기)·main.js(지도 그리기)와는 이 모듈이 돌려주는 frame과 'uf:*' 이벤트로 만난다.
import {createUiFrame,ufPlace} from './ui-frame.js';

export function installHikingFrame({doc=document,win=window}={}){
 const app=doc.getElementById('app');if(!app||!app.querySelector('.nb-tabs'))return null;
 import('./hiking-frame.css').catch(()=>{});
 const $=s=>doc.querySelector(s);
 const frame=createUiFrame({doc,win,exp:'hiking',
  tabs:[
   {id:'map',label:'지도',ic:'h-map',render:p=>{const b=$('#map .nb-map-body');if(b){b.classList.add('uf-moved','hk-map-body');p.appendChild(b);}}},
   {id:'book',label:'수첩',ic:'c-notebook',onOpen:()=>{if(!bookOpen())send('stamps-toggle');},onClose:()=>{if(bookOpen())send('stamps-toggle');}},
   {id:'backpack',label:'배낭',ic:'h-backpack'},
   {id:'rest',label:'쉬기',ic:'h-rest'},
   {id:'settings',label:'설정',ic:'c-settings'},
  ],
  quick:el=>{const tags=$('.nb-tags');if(tags&&tags.parentElement!==el){tags.classList.add('hk-quick');el.appendChild(tags);}}});
 doc.body.classList.add('hk-uf');
 {const q=frame.sheet.querySelector('.uf-quick'),tags=$('.nb-tags');if(q&&tags){tags.classList.add('hk-quick');q.appendChild(tags);}} // 예전 꼬리표(시각·소리·라디오)는 처음부터 메뉴 빠른 줄로
 const send=(id,value)=>win.dispatchEvent(new CustomEvent('hiking:command',{detail:{id,value}}));
 // ── 시트(배낭·쉬기·설정·구간 이동·자유 설정)는 탭 안으로. 어느 것을 보일지는 hud-notebook setSheet가 hidden으로 정한다
 const TAB_OF={backpack:'backpack',rest:'rest',settings:'settings',jump:'settings',free:'settings'};
 const placeSheets=()=>{for(const s of doc.querySelectorAll('.nb-sheet'))if(!s.classList.contains('uf-moved')){const host=frame.panel(TAB_OF[s.dataset.sheet]??'settings');if(host){s.classList.add('uf-moved');host.appendChild(s);}}};
 placeSheets();new MutationObserver(placeSheets).observe($('.nb-sheets'),{childList:true}); // 구간 이동·자유 설정 시트는 나중에 붙는다
 // ── 스탬프 수첩(interaction-ui .ix-book)도 수첩 탭 안. 어떤 길로 열리든(J 키·완등 카드 뒤) 탭이 따라 열리고 닫힌다
 const bookOpen=()=>{const b=$('.ix-book');return !!b&&!b.hidden;};
 const placeBook=()=>{const b=$('.ix-book'),host=frame.panel('book');if(!b||!host||b.parentElement===host)return false;b.classList.add('uf-moved');host.appendChild(b);
  new MutationObserver(()=>{if(bookOpen()&&!(frame.isOpen&&frame.tab==='book'))frame.open('book');else if(!bookOpen()&&frame.isOpen&&frame.tab==='book')frame.close();}).observe(b,{attributes:true,attributeFilter:['hidden']});return true;};
 if(!placeBook()){const t=setInterval(()=>{if(placeBook())clearInterval(t);},500);}
 // ── 위 왼쪽: 진행 알약 + 시점 칩 + (함께 걷기 칩·👥)
 const top=doc.createElement('div');top.className='hk-topl';
 const pill=doc.createElement('button');pill.type='button';pill.className='hk-pill';pill.setAttribute('aria-expanded','false');pill.setAttribute('aria-label','등반 정보 펼치기');
 pill.innerHTML='<b class="hk-pill-t">출발 전</b><i class="hk-pill-bar" aria-hidden="true"><i></i></i>';
 const row1=doc.createElement('div');row1.className='hk-topl-r1';row1.append(pill);
 const view=$('#view');if(view)row1.append(view);
 const row2=doc.createElement('div');row2.className='hk-topl-r2';
 top.append(row1,row2);doc.body.append(top);
 const card=$('.nb-card');
 const setCard=on=>{doc.body.classList.toggle('hk-card-open',on);pill.setAttribute('aria-expanded',String(on));pill.setAttribute('aria-label',on?'등반 정보 접기':'등반 정보 펼치기');if(on)card?.classList.remove('folded');};
 pill.addEventListener('click',()=>setCard(!doc.body.classList.contains('hk-card-open')));
 doc.addEventListener('pointerdown',e=>{if(doc.body.classList.contains('hk-card-open')&&!e.target.closest?.('.nb-card,.hk-topl'))setCard(false);},true);
 win.addEventListener('uf:win',e=>{if(e.detail?.name)setCard(false);});
 // 함께 걷기 상태 칩(multi-entry-ui .me-chip)·👥 목록 단추(pair-ui)는 나중에 붙으니 보이면 둘째 줄로 옮긴다
 const adopt=()=>{for(const s of ['.me-chip','.pw-btn'])for(const el of doc.querySelectorAll(s))if(el.parentElement!==row2){el.classList.add('hk-r2');row2.append(el);}};
 new MutationObserver(adopt).observe(doc.body,{childList:true});adopt();
 // 알약 글: 광장이면 「출발 전」, 걷는 중이면 「연주대까지 n km」 · 고도. 막대 = 스테미너
 const txt=pill.querySelector('.hk-pill-t'),bar=pill.querySelector('.hk-pill-bar>i');
 win.addEventListener('hiking:state',e=>{
  const s=e.detail||{},alt=$('#altitude')?.textContent?.trim(),rem=$('#remaining')?.textContent?.trim();
  const where=s.zone==='plaza'||s.plaza?'출발 전':s.zone==='summit'?'정상':rem&&rem!=='—'?`연주대까지 ${rem}`:'산길';
  const t=`${where}${alt&&alt!=='—'?` · 고도 ${alt}`:''}`;if(txt.textContent!==t)txt.textContent=t;
  const st=Math.max(0,Math.min(100,Number(s.stamina??100)));const w=`${st.toFixed(0)}%`;if(bar.style.width!==w)bar.style.width=w;
  bar.dataset.level=st<25?'low':st<55?'mid':'full';
 });
 // ── 행동 원·할 일 칩
 const auto=$('#auto'),run=$('#run'),bino=$('#binoculars'),phone=$('#phone');
 const labels=new Map([[run,'달리기'],[bino,'쌍안경'],[phone,'카메라']]);
 const vis=el=>!!el&&!el.hidden&&!el.closest('[hidden]')&&getComputedStyle(el).display!=='none';
 function layout(){
  // 간식 먹기(trail-hud #choco)는 진행 카드 안에 있으면 카드 기준으로 놓여서(카드가 기울어 있음) 화면에 직접 옮긴다
  const eat=$('#choco');if(eat&&eat.parentElement!==doc.body){eat.classList.add('hk-eat');doc.body.appendChild(eat);}
  if(eat){const n=$('#choco-count .ic-num')?.textContent?.trim();labels.set(eat,n?`간식 먹기 ${n}`:'간식 먹기');}
  const todo=[eat&&!eat.hidden?eat:null,...[...doc.querySelectorAll('#trail-chip .tc-offer')].filter(vis)].filter(Boolean); // 간식은 hidden만 본다(자리 없을 때 숨기는 규칙과 엇갈리지 않게)
  ufPlace(doc.body,{big:auto,small:[run,bino,phone],todo,labels});
 }
 layout();setInterval(layout,250);
 return frame;
}
