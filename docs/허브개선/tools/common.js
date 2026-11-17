// 허브 개선 시안 공용 부품(시안 A·B·C가 같이 씀). build.mjs가 각 시안 HTML에 그대로 넣는다.
// 실제 코드(src/)와 연결하지 않은 시안용 가짜 자료다. 인원 숫자는 예시.
const EXPS=[
 {id:'hiking',title:'온라인 등산',place:'관악산',desc:'등산복 입은 동동이와 연주대까지 걸어 올라요',tags:['혼자·함께','낮·노을·밤'],color:'#5f8f3e',dark:'#3f6a28',soft:'#e6efd8',icon:'c-exp-hiking',art:'mountain',outfit:'hike',record:'완등 2회',
  servers:[{name:'관악산 1서버',count:12,max:30},{name:'관악산 2서버',count:30,max:30},{name:'관악산 3서버',count:3,max:30}],sub:[['h-summit','정상 도장'],['h-binoculars','쌍안경'],['h-radio','관악산 FM']]},
 {id:'smoking',title:'온라인 흡연장',place:'서울 옥상',desc:'회사원 옷 입은 동동이와 옥상에서 수다 한 대',tags:['수다','옥상 야경'],color:'#c8682f',dark:'#93461a',soft:'#f6e3d2',icon:'c-exp-smoking',art:'rooftop',outfit:'office',record:null,
  servers:[{name:'옥상 1서버',count:5,max:30},{name:'옥상 2서버',count:0,max:30},{name:'옥상 3서버',count:0,max:30}],sub:[['s-cigarette','가상 담배'],['s-can-coffee','캔커피'],['c-chat','옥상 수다']]},
 {id:'christmas',title:'온라인 크리스마스',place:'눈마을 광장',desc:'동동이와 트리를 꾸미고 눈사람을 만들어요',tags:['함께','눈 오는 밤'],color:'#2f7a52',dark:'#1d5536',soft:'#dcebe1',icon:'c-exp-christmas',art:'village',outfit:'santa',record:null,
  servers:[{name:'눈마을 광장 1서버',count:18,max:20},{name:'눈마을 광장 2서버',count:7,max:20},{name:'눈마을 광장 3서버',count:0,max:20}],sub:[['x-tree','트리 꾸미기'],['x-sled','눈썰매'],['x-snowball','눈싸움']]},
];
// 앞으로 늘어날 자리(체험이 늘면 EXPS에 한 줄 더하고 이 자리는 계속 맨 뒤에 남는다)
const NEXT={id:'next',title:'다음 체험 준비 중',place:'새 장소',desc:'동동이가 갈 다음 곳을 만들고 있어요. 가 보고 싶은 곳을 알려 주세요',color:'#9b8a72',dark:'#6e604c',soft:'#efe7d6',icon:'c-wait',art:'lot'};

const ic=(name,size='s',cls='')=>`<svg class="ic ic-${size}${cls?' '+cls:''}" aria-hidden="true" focusable="false"><use href="#ic-${name}"/></svg>`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ── 서버 상태(시안 보기 단추로 바꿔 볼 수 있음): on = 인원 표시, checking = 확인 중, off = 꺼짐(혼자 하기만)
let SERVER_MODE='on';
const total=e=>e.servers.reduce((n,s)=>n+s.count,0);
const capOf=e=>e.servers.reduce((n,s)=>n+s.max,0);
const allTotal=()=>EXPS.reduce((n,e)=>n+total(e),0);
function statusHTML(e,{long=false}={}){
 if(SERVER_MODE==='checking')return `<span class="st st-wait">${ic('c-net-connecting','xs','ic-spin')}인원 확인 중</span>`;
 if(SERVER_MODE==='off')return `<span class="st st-off">${ic('c-server-off','xs')}${long?'서버가 쉬는 중 · 혼자 하기는 돼요':'혼자 하기만'}</span>`;
 const n=total(e);
 return `<span class="st st-on${n?'':' st-zero'}">${ic('c-people','xs')}${n?`<b>${n}명</b> 함께하는 중`:'지금은 아무도 없어요'}${long?` <i>· 서버 ${e.servers.length}개</i>`:''}</span>`;
}
function serverRows(e){
 if(SERVER_MODE==='checking')return `<li class="srv srv-wait">${ic('c-net-connecting','s','ic-spin')}서버 인원을 확인하고 있어요</li>`;
 if(SERVER_MODE==='off')return `<li class="srv srv-off">${ic('c-server-off','s')}지금은 함께하기 서버가 쉬고 있어요. 혼자 하기로 들어갈 수 있어요</li>`;
 return e.servers.map(s=>{const full=s.count>=s.max;const pct=Math.round(s.count/s.max*100);
  return `<li class="srv${full?' srv-full':''}"><span class="srv-name">${ic(full?'c-net-full':'c-net-ok','s')}${esc(s.name)}</span><span class="srv-bar"><i style="width:${pct}%"></i></span><span class="srv-n">${full?'꽉 참':`${s.count}/${s.max}`}</span></li>`;}).join('');
}

// ── 동동이(평면 그림판). outfit: hike 등산복 · office 회사원 옷 · santa 산타 옷, wave: 한 손 들기
function dongdong({outfit='hike',wave=false,cls=''}={}){
 const O='#3a2a16',SW=2.6,skin='#ecc59c';
 const body={hike:'#e07a22',office:'#f4f1e8',santa:'#c8352e'}[outfit];
 const mitt={hike:'#b8302d',office:skin,santa:'#2f7a52'}[outfit];
 const pack=outfit==='hike'?`<rect x="22" y="80" width="76" height="50" rx="18" fill="#1f7a72" stroke="${O}" stroke-width="${SW}"/><ellipse cx="94" cy="80" rx="9" ry="7" fill="#e3b23c" stroke="${O}" stroke-width="${SW}"/>`:'';
 const legs=`<rect x="45" y="120" width="13" height="16" rx="4" fill="${outfit==='office'?'#2f3542':'#22355e'}" stroke="${O}" stroke-width="${SW}"/><rect x="62" y="120" width="13" height="16" rx="4" fill="${outfit==='office'?'#2f3542':'#22355e'}" stroke="${O}" stroke-width="${SW}"/>
<ellipse cx="50" cy="140" rx="11" ry="6.5" fill="${outfit==='office'?'#2a2018':'#6b4226'}" stroke="${O}" stroke-width="${SW}"/><ellipse cx="71" cy="140" rx="11" ry="6.5" fill="${outfit==='office'?'#2a2018':'#6b4226'}" stroke="${O}" stroke-width="${SW}"/>`;
 const armL=`<ellipse cx="34" cy="111" rx="8" ry="14" transform="rotate(22 34 111)" fill="${body}" stroke="${O}" stroke-width="${SW}"/><circle cx="29" cy="124" r="7" fill="${mitt}" stroke="${O}" stroke-width="${SW}"/>`;
 const armR=wave?`<ellipse cx="89" cy="94" rx="8" ry="14" transform="rotate(-38 89 94)" fill="${body}" stroke="${O}" stroke-width="${SW}"/><circle cx="97" cy="81" r="7" fill="${mitt}" stroke="${O}" stroke-width="${SW}"/>`
  :`<ellipse cx="86" cy="111" rx="8" ry="14" transform="rotate(-22 86 111)" fill="${body}" stroke="${O}" stroke-width="${SW}"/><circle cx="91" cy="124" r="7" fill="${mitt}" stroke="${O}" stroke-width="${SW}"/>`;
 let torso=`<ellipse cx="60" cy="110" rx="27" ry="24" fill="${body}" stroke="${O}" stroke-width="${SW}"/>`;
 if(outfit==='hike')torso+=`<path d="M47 92 L46 126 M73 92 L74 126" stroke="#17403d" stroke-width="4.5" stroke-linecap="round"/><rect x="53" y="100" width="14" height="8" rx="3" fill="#1f6f68" stroke="${O}" stroke-width="1.6"/>`;
 if(outfit==='office')torso+=`<path d="M60 90 l-5 6 5 26 5-26z" fill="#2c3f73" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/><path d="M46 88 l14 6 14-6" fill="none" stroke="${O}" stroke-width="2"/>`;
 if(outfit==='santa')torso+=`<path d="M60 88 V134" stroke="#f6f3ee" stroke-width="6"/><rect x="34" y="112" width="52" height="6" fill="#2a2018"/><rect x="56" y="111" width="8" height="8" rx="1.5" fill="#e3b23c"/>`;
 const scarf=outfit==='hike'?`<ellipse cx="60" cy="89" rx="23" ry="7.5" fill="#b8302d" stroke="${O}" stroke-width="${SW}"/>`:outfit==='santa'?`<ellipse cx="60" cy="89" rx="23" ry="7" fill="#f6f3ee" stroke="${O}" stroke-width="${SW}"/>`:'';
 const ears=`<circle cx="25" cy="60" r="6" fill="${skin}" stroke="${O}" stroke-width="${SW}"/><circle cx="95" cy="60" r="6" fill="${skin}" stroke="${O}" stroke-width="${SW}"/>`;
 const head=`<circle cx="60" cy="56" r="35" fill="${skin}" stroke="${O}" stroke-width="${SW}"/>`;
 const hair=outfit==='office'?`<path d="M25 56 Q22 20 60 19 Q98 20 95 56 Q91 38 74 35 Q62 43 46 35 Q31 39 25 56Z" fill="#4a2c17" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>`
  :`<path d="M27 50 Q30 30 60 29 Q90 30 93 50 Q84 41 60 40 Q36 41 27 50Z" fill="#4a2c17"/>`;
 const face=`<ellipse cx="47" cy="62" rx="5.4" ry="6.6" fill="#1b1410"/><ellipse cx="73" cy="62" rx="5.4" ry="6.6" fill="#1b1410"/><circle cx="45.4" cy="59.4" r="1.9" fill="#fff"/><circle cx="71.4" cy="59.4" r="1.9" fill="#fff"/>
<ellipse cx="39" cy="71" rx="6" ry="3.4" fill="#e98f86" opacity=".75"/><ellipse cx="81" cy="71" rx="6" ry="3.4" fill="#e98f86" opacity=".75"/><path d="M56 72 q4 4 8 0" fill="none" stroke="#7a2b1f" stroke-width="2" stroke-linecap="round"/>`;
 let hat='';
 if(outfit==='hike')hat=`<ellipse cx="60" cy="33" rx="47" ry="9" fill="#b59a5c" stroke="${O}" stroke-width="${SW}"/><path d="M31 33 Q32 7 60 7 Q88 7 89 33Z" fill="#a88a4e" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M31.5 25 Q60 19 88.5 25 L89 31 Q60 26 31 31Z" fill="#b8302d"/>`;
 if(outfit==='santa')hat=`<path d="M26 36 Q30 4 66 5 Q96 8 106 44" fill="#c8352e" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M26 36 Q60 26 94 36" fill="#c8352e"/><circle cx="106" cy="46" r="7.5" fill="#f6f3ee" stroke="${O}" stroke-width="${SW}"/><rect x="21" y="28" width="78" height="13" rx="6.5" fill="#f6f3ee" stroke="${O}" stroke-width="${SW}"/>`;
 return `<svg class="dd ${cls}" viewBox="0 0 120 150" aria-hidden="true" focusable="false"><ellipse cx="60" cy="145" rx="34" ry="5" fill="rgba(40,25,10,.18)"/>${pack}${legs}${armL}${torso}${armR}${scarf}${ears}${head}${hair}${face}${hat}</svg>`;
}

// ── 체험 그림: 지금 허브 카드 그림(src/hub/hub.js ART)을 그대로 쓰고, 준비 중 자리만 새로 그림
const ART={
 mountain:`<svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="240" height="120" fill="#bfe3ee"/><circle cx="188" cy="30" r="12" fill="#ffd86b"/><path fill="#8fb59a" d="M0 84 L40 52 L72 74 L118 38 L170 78 L210 56 L240 74 V120 H0Z"/><path fill="#5f9a73" d="M0 104 L52 70 L96 92 L150 58 L204 94 L240 80 V120 H0Z"/><path fill="#2f6b4a" d="M22 112 l7-18 7 18z M38 112 l6-14 6 14z M196 114 l7-17 7 17z"/><circle cx="150" cy="53" r="2.6" fill="#b8452e"/></svg>`,
 rooftop:`<svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="240" height="120" fill="#f2a97a"/><circle cx="52" cy="28" r="11" fill="#ffe3a0"/><g fill="#8a6a68"><rect x="10" y="62" width="30" height="58"/><rect x="46" y="48" width="26" height="72"/><rect x="78" y="68" width="34" height="52"/><rect x="118" y="44" width="28" height="76"/><rect x="152" y="60" width="32" height="60"/><rect x="190" y="52" width="40" height="68"/></g><g fill="#ffd98a"><rect x="52" y="58" width="4" height="5"/><rect x="62" y="70" width="4" height="5"/><rect x="124" y="56" width="4" height="5"/><rect x="134" y="72" width="4" height="5"/><rect x="198" y="64" width="4" height="5"/><rect x="214" y="78" width="4" height="5"/></g><rect fill="#5e463e" x="0" y="100" width="240" height="20"/><rect fill="#45301a" x="0" y="94" width="240" height="3" rx="1.5"/><path d="M170 90 q-6-10 2-16 q8-6 0-14" fill="none" stroke="#ffe3a0" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>`,
 village:`<svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="240" height="120" fill="#1d2a4a"/><circle cx="196" cy="24" r="9" fill="#f3efd6"/><path d="M0 78 L44 54 L84 72 L132 46 L176 70 L214 56 L240 66 V120 H0Z" fill="#33476a"/><path d="M0 98 Q60 88 120 94 T240 92 V120 H0Z" fill="#eef3fa"/><g fill="#8b5a3c"><rect x="18" y="74" width="30" height="22"/><rect x="190" y="72" width="34" height="24"/></g><g fill="#f4f7fb"><path d="M14 76 L33 60 L52 76Z"/><path d="M186 74 L207 57 L228 74Z"/></g><g fill="#ffd36e"><rect x="27" y="81" width="6" height="7"/><rect x="200" y="80" width="6" height="7"/><rect x="212" y="80" width="6" height="7"/></g><path d="M120 22 L98 66 H106 L92 88 H148 L134 66 H142Z" fill="#2f7a4f"/><rect x="116" y="88" width="8" height="8" fill="#6b4a2e"/><path d="M120 14 l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#ffd36e"/><g fill="#e2463c"><circle cx="112" cy="50" r="3"/><circle cx="129" cy="70" r="3"/><circle cx="104" cy="80" r="3"/></g><g fill="#ffd36e"><circle cx="125" cy="44" r="2.4"/><circle cx="113" cy="72" r="2.4"/><circle cx="137" cy="82" r="2.4"/></g><g fill="#fff" opacity=".85"><circle cx="30" cy="20" r="1.6"/><circle cx="64" cy="38" r="1.3"/><circle cx="80" cy="14" r="1.5"/><circle cx="160" cy="30" r="1.4"/><circle cx="170" cy="52" r="1.2"/><circle cx="222" cy="40" r="1.5"/><circle cx="52" cy="62" r="1.2"/></g></svg>`,
 lot:`<svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="240" height="120" fill="#f4ead2"/><g fill="none" stroke="#c7b48c" stroke-width="2" stroke-dasharray="5 5"><path d="M0 84 L48 54 L86 76 L134 44 L182 78 L240 58"/></g><path d="M0 98 Q60 90 120 96 T240 94 V120 H0Z" fill="#e3d3ad"/><g stroke="#6e604c" stroke-width="3" stroke-linecap="round"><path d="M120 98 V58"/></g><rect x="96" y="50" width="48" height="20" rx="3" fill="#fbf3df" stroke="#6e604c" stroke-width="2.5"/><path d="M104 60h32" stroke="#c7b48c" stroke-width="3" stroke-linecap="round"/><g fill="#d39a2e" stroke="#6e604c" stroke-width="2" stroke-linejoin="round"><path d="M50 104 l7-18 7 18z"/><path d="M178 106 l6-15 6 15z"/></g><g fill="#fbf3df" stroke="#6e604c" stroke-width="1.5"><rect x="52.5" y="95" width="9" height="3"/><rect x="180.5" y="98" width="7.5" height="2.6"/></g></svg>`,
};

// ── 소리: 켜면 단추 누를 때 '톡' 소리(시안 시연용 합성음). 실제로는 세 체험이 같이 쓰는 소리 설정 하나로 저장
let SOUND=false,actx=null;
function tick(f=660){if(!SOUND)return;try{actx??=new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,actx.currentTime);g.gain.exponentialRampToValueAtTime(.12,actx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+.14);o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.16);}catch{}}
function soundBtnHTML(cls='btn-ic'){return `<button type="button" class="${cls} js-sound${SOUND?' is-on':''}" aria-pressed="${SOUND}" aria-label="${SOUND?'소리 끄기':'소리 켜기'}">${ic(SOUND?'c-sound':'c-sound-off','m')}<span class="lbl">${SOUND?'소리 켜짐':'소리 꺼짐'}</span></button>`;}
function bindSound(root=document){root.querySelectorAll('.js-sound').forEach(b=>b.onclick=()=>{SOUND=!SOUND;document.querySelectorAll('.js-sound').forEach(x=>{x.setAttribute('aria-pressed',SOUND);x.setAttribute('aria-label',SOUND?'소리 끄기':'소리 켜기');x.classList.toggle('is-on',SOUND);x.querySelector('use').setAttribute('href',`#ic-${SOUND?'c-sound':'c-sound-off'}`);const l=x.querySelector('.lbl');if(l)l.textContent=SOUND?'소리 켜짐':'소리 꺼짐';});tick(880);});}

// ── 설정 창(세 시안 같은 내용, 겉모양만 시안마다 다름)
function settingsHTML(){return `<div class="sheet-back" hidden><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="set-t">
<header class="sheet-h"><h2 id="set-t">${ic('c-settings','m')}설정</h2><button type="button" class="btn-ic js-close" aria-label="닫기">${ic('c-close','m')}</button></header>
<p class="sheet-note">여기서 바꾼 것은 모든 체험에 같이 적용돼요</p>
<label class="row"><span>${ic('c-person','s')}닉네임</span><input value="동동이1234" maxlength="12"></label>
<div class="row"><span>${ic('c-sound','s')}소리</span><input type="range" min="0" max="100" value="70" aria-label="소리 크기"></div>
<div class="row"><span>${ic('c-music','s')}배경 음악</span><span class="seg"><button class="is-on" type="button">켜기</button><button type="button">끄기</button></span></div>
<div class="row"><span>${ic('c-time-day','s')}허브 시간대</span><span class="seg"><button class="is-on" type="button">자동</button><button type="button">낮</button><button type="button">노을</button><button type="button">밤</button></span></div>
<div class="row"><span>${ic('c-hide-ui','s')}화질</span><span class="seg"><button class="is-on" type="button">자동</button><button type="button">가볍게</button><button type="button">선명하게</button></span></div>
<a class="row link" href="#"><span>${ic('c-feedback','s')}의견 보내기</span>${ic('c-right','s')}</a>
<a class="row link" href="#"><span>${ic('c-detail','s')}개인정보 처리방침 · 소리 출처</span>${ic('c-right','s')}</a>
</section></div>`;}
function bindSettings(){const back=document.querySelector('.sheet-back');if(!back)return;
 const open=()=>{back.hidden=false;tick(520);back.querySelector('.js-close').focus();},close=()=>{back.hidden=true;tick(440);};
 document.querySelectorAll('.js-settings').forEach(b=>b.onclick=open);
 back.querySelector('.js-close').onclick=close;back.onclick=e=>{if(e.target===back)close();};
 if(!back._key){back._key=1;addEventListener('keydown',e=>{if(e.key==='Escape'&&!back.hidden)close();});}
 back.querySelectorAll('.seg').forEach(s=>s.onclick=e=>{const b=e.target.closest('button');if(!b)return;s.querySelectorAll('button').forEach(x=>x.classList.toggle('is-on',x===b));tick(600);});}

// ── 시안 보기 띠(실제 화면에는 없음): 서버 상태 바꿔 보기 + 시안 설명 열기
function demoBarHTML(){if(/[?&]shot/.test(location.search))return '';return `<aside class="demo" aria-label="시안 보기 도구"><b>시안 보기</b><span class="demo-seg" role="group" aria-label="서버 상태">
<button type="button" data-mode="on" class="is-on">서버 켜짐</button><button type="button" data-mode="checking">확인 중</button><button type="button" data-mode="off">서버 꺼짐</button></span><button type="button" class="demo-about js-about">이 시안 설명</button></aside>`;}
function bindDemo(rerender){document.querySelectorAll('.demo-seg button').forEach(b=>b.onclick=()=>{SERVER_MODE=b.dataset.mode;document.querySelectorAll('.demo-seg button').forEach(x=>x.classList.toggle('is-on',x===b));rerender();});
 const about=document.querySelector('.about-back');if(!about)return;
 document.querySelectorAll('.js-about').forEach(b=>b.onclick=()=>{about.hidden=false;});about.onclick=e=>{if(e.target===about||e.target.closest('.js-about-close'))about.hidden=true;};
 if(location.hash==='#about')about.hidden=false;}
// 링크는 시안이라 실제로 이동하지 않음
function fakeGo(e){const a=e.target.closest('a[data-go]');if(!a)return;e.preventDefault();tick(760);const t=document.querySelector('.toast');if(t){t.textContent=`${a.dataset.go} 로 들어가요 (시안이라 이동하지 않아요)`;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),1800);}}
document.addEventListener('click',fakeGo);
