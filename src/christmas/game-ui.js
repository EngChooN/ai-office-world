// 미니게임 공용 화면 틀(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §3): 큰 카운트다운 숫자 · 위쪽 기록/경기 띠 · 가운데 결과 창.
// 눈썰매 레이스와 눈싸움 한 판이 같은 틀을 쓰고, 다음 미니게임도 이 파일을 쓴다. 모양은 hud.css(.xg-*). 색은 크리스마스 포인트 색.
import {icon,iconText} from '../icons/icon.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export {esc};

// 3·2·1·출발! (각 1초, 120px). show(텍스트), hide()
export function createCountdown(root,doc=document){
 const el=doc.createElement('div');el.className='xg-count';el.hidden=true;el.setAttribute('aria-live','assertive');root.appendChild(el);
 return {show(t){el.hidden=false;el.textContent=String(t);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');el.classList.toggle('go',typeof t==='string');},hide(){el.hidden=true;},get el(){return el;}};
}
// 위쪽 띠: 왼쪽·가운데(크게)·오른쪽 칸 + 아래 작은 알림(구간 시간 등). set({left,center,right,cls}) 는 HTML(호출하는 쪽이 이스케이프)
export function createTopBar(root,doc=document){
 const el=doc.createElement('div');el.className='xg-bar';el.hidden=true;el.setAttribute('role','status');
 el.innerHTML='<span class="xg-l"></span><b class="xg-c"></b><span class="xg-r"></span><div class="xg-note" hidden></div>';root.appendChild(el);
 const L=el.querySelector('.xg-l'),C=el.querySelector('.xg-c'),Rr=el.querySelector('.xg-r'),N=el.querySelector('.xg-note');const last={};let noteT=0;
 const put=(k,node,v)=>{if(last[k]!==v){last[k]=v;node.innerHTML=v;}};
 return {
  set({left='',center='',right='',cls=''}={}){el.hidden=false;put('l',L,left);put('c',C,center);put('r',Rr,right);if(last.cls!==cls){last.cls=cls;el.className=`xg-bar ${cls}`;}},
  note(html,sec=1.5){N.innerHTML=html;N.hidden=false;noteT=sec;},
  hide(){el.hidden=true;N.hidden=true;noteT=0;},
  update(dt){if(noteT>0){noteT-=dt;if(noteT<=0)N.hidden=true;}},
  get el(){return el;},
 };
}
// 가운데 결과 창(PC 420px · 휴대폰 화면 폭 90%). show({title,ic,ribbon,body(HTML),buttons:[{id,label,ic,key,primary}]}), 단추 → onPick(id)
export function createResultCard(root,{doc=document,onPick=()=>{}}={}){
 const el=doc.createElement('section');el.className='xg-card';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','결과');root.appendChild(el);
 el.addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(b)onPick(b.dataset.pick);});
 let idleT=0,idleCb=null;
 return {
  show({title,ic=null,ribbon=null,body='',buttons=[],idle=0,onIdle=null}){
   el.innerHTML=`${ribbon?`<div class="xg-ribbon" style="--rib:${esc(ribbon)}"></div>`:''}<header>${ic?iconText(ic,title,{size:'m'}):esc(title)}</header><div class="xg-body">${body}</div>
<div class="xg-btns">${buttons.map(b=>`<button type="button" class="${b.primary?'xg-ok':'xg-sub'}" data-pick="${esc(b.id)}">${b.ic?icon(b.ic,{size:'s'}):''}<span>${esc(b.label)}</span>${b.key?`<kbd>${esc(b.key)}</kbd>`:''}</button>`).join('')}</div>`;
   el.hidden=false;idleT=idle;idleCb=onIdle;},
  close(){el.hidden=true;idleT=0;},
  get open(){return !el.hidden;},
  // 아무것도 안 누르면 닫기(눈싸움 결과 10초)
  update(dt){if(idleT>0&&!el.hidden){idleT-=dt;if(idleT<=0){el.hidden=true;idleCb?.();}}},
  poke(){if(idleT>0)idleT=Math.max(idleT,1);},
  get el(){return el;},
 };
}
// 0.01초까지 시간 글: 27.43 / 1:03.20
export function fmtTime(sec){if(!Number.isFinite(sec))return '--.--';const s=Math.max(0,sec),m=Math.floor(s/60),r=s-m*60;return m?`${m}:${r.toFixed(2).padStart(5,'0')}`:r.toFixed(2);}
export const fmtDiff=d=>`${d>0?'+':d<0?'−':'±'}${Math.abs(d).toFixed(2)}`;
