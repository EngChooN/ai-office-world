// 온라인 인형뽑기 규칙(월드개발, 2026-11-23). three를 쓰지 않는다(node 시험·화면 UI가 함께 읽는다).
// 기획서 MVP §3~5 + 월드디자인 설계 v1(단추·코인·도감)·v2(집게 = 물리, 대표 결정)·v3(기계 3종: 집게·타이머·열쇠).
// 숫자는 모두 조절값 CLAW_TUNING 한곳에 모은다. 코인·허용 오차·빠르기·세기·보장 횟수는 **임시값(대표 결정 대기)** — 바꿀 때는 이 표만 고친다.
// 규칙 안내 글(ⓘ·처음 규칙 카드)도 이 값에서 만든다(보이는 규칙 = 판정 규칙). 몰래 확률을 바꾸지 않는다(월드리서치 권고).
// 실제 결제·코인 판매·교환·선물은 없다.
import {PLUSH,RARITY,RARITY_ORDER,MACHINES,plushInfo} from './claw-palette.js';

export const CLAW_TUNING=Object.freeze({
 coin:Object.freeze({daily:30,cost:1}),               // 하루 코인(서울 날짜가 바뀌면 이 개수로 다시 채움, 남은 코인은 넘어가지 않음) · 한 판 값  [대표 결정 11-23 15개 → 11-24 30개]
 pity:Object.freeze({after:5}),                       // 같은 기계에서 연달아 n번 실패하면 다음 판 도움(기계 종류마다 다름, 0이면 끔)  [임시값]
 // 집게(설계 v2·v3 §3-1): 물리 판정. 세기 = 집게발이 버티는 힘(잡기/들고 가기). 보장 판 = 직원 도움(11-24 대표 결정: 힘센 집게는 그림 모양 판정 뒤 22%로 보통 판과 같아 바꿈 —
 //  구멍 뒤 턱 바로 뒤에 인형 하나를 세워 줌. claw-physics.js staffHelp)
 claw:Object.freeze({timeSec:20,dropLockSec:.6,moveSpeed:.35,ramp:.1,dolls:14,
  power:Object.freeze({grab:.002,carry:.0015,closeMin:.1}), // closeMin(11-24): 약한 집게는 끝까지 다 오므라지지 않음(물리 각 0.1) — 커진 집게가 인형을 우리처럼 가둬 판당 24%였음 → 약 21%, 큰 인형도 잡힘
  mass:Object.freeze({common:1,uncommon:1.15,rare:1.35,special:1.6})}),   // 희귀할수록 무거워 잘 안 잡힘(크기는 그림대로)
 // 타이머(설계 v3 §3-2): 화면에 멈춘 숫자로만 판정. 10.00 = 성공, ±0.10 = 아까움, 15.00 넘김·그 밖 = 실패. 보장 기본 끔(pityWinSec 0)
 timer:Object.freeze({targetSec:10,okWinSec:0,nearWinSec:.1,maxSec:15,startLockSec:.5,readyLimitSec:20,hideAfterSec:0,pityWinSec:0}),
 // 열쇠(설계 v3 §3-3): 칸 2×4, 누르고 있기 → 오른쪽(떼면 고정) → 0.3초 → 누르고 있기 → 위(떼면 밀어 넣음). 단위 = 칸 폭
 key:Object.freeze({cols:4,rows:2,cellH:1.4,holeY:.32,startX:.15,startY:-.3,speed:1.4,fit:.14,fitRare:.08,nearMul:2,pityFitBonus:.05,holdLimitSec:10,gapSec:.3}),
 // 봉(월드디자인 설계 v4.1 §7, 다리 걸치기): 2발 약한 집게로 봉 두 개 위 상자를 밀어 봉 사이로 떨어뜨림. 판정 = 물리(claw-bridge-physics.js). 모두 임시값
 bridge:Object.freeze({gap:.16,barR:.012,barLen:.55,barFriction:.35,box:Object.freeze([.16,.10,.22]),boxMass:1.0,boxMassRare:1.2,prongs:2,clawGrab:.0012,clawOpen:.82,
  moveSpeed:.30,holdLimitSec:10,gapSec:.3,nearSupportM:.02,refillSec:2.5,startJitterM:.004,startJitterDeg:8,pityAfter:8,lieDeg:45,liePlays:3}),
 // ↑ pityAfter판 연달아 실패 → 직원 도움(상자를 처음 자리에 다시 놓음, 대표 2026-11-23: 힘센 집게는 상자를 밀기만 해 효과 없음). 아슬아슬한 상자면 건너뜀
 //   lieDeg 넘게 누운 채 liePlays판이면 다시 놓음(막이 봉 밖·봉 아래 끼임은 판 끝나면 바로, 대표 2026-11-23)
 // 기계 상태 공유·자리 잡기(v4.1 §8). 지금은 혼자 뽑기만 씀(stuck*·solo). 서버 쪽 값(leave·idle·drop·commit…)은 3단계 서버 연결 때 씀
 share:Object.freeze({leaveSec:3,idleSec:60,idleWaitSec:20,hiddenSec:20,dropSec:15,dropMax:3,nextSec:10,commitSec:8,idleResetMin:30,stuckPlays:6,stuckMoveM:.005,stuckTiltDeg:2,
  maxMoveM:.12,maxTurnDeg:60,yieldAfter:3,nearBubbleM:6,nearBubbleGapSec:120}),
 notice:Object.freeze({minRarity:'rare',gapSec:10}),   // 다른 손님 소식은 희귀 이상만, 10초에 1번(설계 v1 §4)
 log:5,
});
export const SAVE_KEY='claw-world:v1';
export const KINDS=Object.freeze(['claw','bridge','timer','key']);
export const kindOf=machineId=>MACHINES.find(m=>m.id===machineId)?.kind??'claw';

// ── 서울 날짜(무료 코인은 서울 0시에 바뀐다) ──
const KST=9*3600e3;
export const seoulDate=(ms=Date.now())=>new Date(ms+KST).toISOString().slice(0,10);
export function msToNextGrant(ms=Date.now()){const d=new Date(ms+KST);const next=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-KST;return next-ms;}
export function leftText(ms){const m=Math.max(0,Math.ceil(ms/60000)),h=Math.floor(m/60);return h?`${h}시간 ${m%60}분`:`${m}분`;}

// ── 저장(이 기기, 이어하기) ──
const MACHINE_IDS=MACHINES.map(m=>m.id);
// 11-23 MVP 3대 → 16대(v4.1 §12): 옛 기계 id 저장값(보장 수·처음 규칙 본 것·도감의 나온 기계)을 새 id로 이어받는다. 타이머는 큰 인형마다 한 대로 나뉨
export const MACHINE_RENAME=Object.freeze({forest:'claw-1',star:'key-1',city:'timer-1'});
const bigTimer=id=>({'big-squirrel':'timer-1','big-dongdong':'timer-2','big-haechi':'timer-3'})[id];
const renameMachine=(id,plush)=>MACHINE_IDS.includes(id)?id:id==='city'&&bigTimer(plush)?bigTimer(plush):MACHINE_RENAME[id]??'';
const int=(v,lo,hi,d=0)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:d;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
// coinV = 코인 규칙 판(3 = 11-24 대표 결정 「하루 30개로 다시 채움」. 그 전 저장(1 = 10개씩 더해 30개까지, 2 = 하루 15개)은 모두 옛 판으로 읽어
//  처음 읽는 날 grantDaily가 하루 개수까지 채워 줌 — 오늘 15개를 받은 사람도 그날 바로 30개가 됨)
export const COIN_V=3;
export function freshState(){return {coins:0,lastGrant:null,coinV:COIN_V,plays:0,wins:0,dex:{},pity:{},seen:{},log:[],seenTip:false,mach:{}};}
/** 저장값을 믿지 않고 정리한다(손님 인형 id는 isKnown이 true일 때만 남김 — 공개판에는 칸이 없다) */
export function sanitizeState(raw,{isKnown=id=>!!plushInfo(id)}={}){
 const s=freshState();if(!raw||typeof raw!=='object')return s;
 s.coins=int(raw.coins,0,999);s.lastGrant=date(raw.lastGrant);s.coinV=raw.coinV===COIN_V?COIN_V:1;s.plays=int(raw.plays,0,1e7);s.wins=int(raw.wins,0,1e7);s.seenTip=raw.seenTip===true;
 if(raw.dex&&typeof raw.dex==='object')for(const [id,v] of Object.entries(raw.dex)){if(!isKnown(id)||!v)continue;const n=int(v.n,1,1e6,0);if(!n)continue;s.dex[id]={n,first:date(v.first)??'',machine:renameMachine(v.machine,id)};}
 if(raw.pity&&typeof raw.pity==='object')for(const [k,v] of Object.entries(raw.pity)){const id=renameMachine(k);if(id&&Number.isInteger(v))s.pity[id]=Math.max(s.pity[id]??0,int(v,0,999));}
 if(raw.seen&&typeof raw.seen==='object')for(const [k,v] of Object.entries(raw.seen)){if(v!==true)continue;const id=renameMachine(k);if(id)s.seen[id]=true;if(k==='city')for(const t of ['timer-1','timer-2','timer-3'])s.seen[t]=true;}
 if(Array.isArray(raw.log))s.log=raw.log.filter(r=>r&&typeof r.text==='string'&&Number.isFinite(r.at)).slice(-CLAW_TUNING.log).map(r=>({at:r.at,text:r.text.slice(0,60),d:Number.isInteger(r.d)?r.d:0,...(r.t==='refill'?{t:'refill',n:int(r.n,0,999)}:{})}));
 if(raw.mach&&typeof raw.mach==='object')for(const id of MACHINE_IDS){const m=sanitizeMachState(raw.mach[id],kindOf(id));if(m)s.mach[id]=m;}
 return s;
}
export function loadState(storage=globalThis.localStorage,opt){try{return sanitizeState(JSON.parse(storage?.getItem(SAVE_KEY)??'null'),opt);}catch{return freshState();}}
export function saveState(s,storage=globalThis.localStorage){try{storage?.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
const addLog=(s,at,text,d=0,extra=null)=>{s.log.push({at,text,d,...extra});while(s.log.length>CLAW_TUNING.log)s.log.shift();};
// 매일 채움 기록 줄(v4 §10, 대표 승인): 늘어남·줄어듦 숫자 없이 「오늘 n개로 채웠어요」 + 결과 개수(t:'refill', n). 예전 저장의 채움 줄도 화면이 같은 모양으로 그림
export const isRefillLog=r=>r?.t==='refill'||typeof r?.text==='string'&&/^오늘의 코인/.test(r.text);

// ── 코인 ──
/** 오늘(서울) 아직 안 받았으면 코인을 하루 개수로 다시 채움(어제 남은 코인은 넘어가지 않음). 반환 = 지금 코인 수(이미 받았으면 null)
 *  옛 규칙 저장(coinV 1)을 처음 읽은 날: 오늘 이미 받았어도 하루 개수보다 적으면 그만큼 채워 줌, 많으면 오늘은 그대로 두고 다음 날부터 새 규칙 */
export function grantDaily(s,now=Date.now(),T=CLAW_TUNING){
 const today=seoulDate(now);
 if(s.coinV!==COIN_V){s.coinV=COIN_V;
  if(s.lastGrant===today){const add=Math.max(0,T.coin.daily-s.coins);if(!add)return null;s.coins+=add;addLog(s,now,`하루 ${T.coin.daily}개로 바뀌었어요 · 오늘 ${T.coin.daily}개로 채웠어요`,0,{t:'refill',n:s.coins});return s.coins;}}
 if(s.lastGrant===today)return null;
 const before=s.coins;s.coins=T.coin.daily;s.lastGrant=today;
 addLog(s,now,`오늘 ${T.coin.daily}개로 채웠어요`,0,{t:'refill',n:s.coins});void before;return s.coins;
}
export const grantedToday=(s,now=Date.now())=>s.lastGrant===seoulDate(now);
export const canPlay=(s,T=CLAW_TUNING)=>s.coins>=T.coin.cost;
export function spendCoin(s,machineId,now=Date.now(),T=CLAW_TUNING){
 if(!canPlay(s,T))return false;s.coins-=T.coin.cost;s.plays++;
 addLog(s,now,`${MACHINES.find(m=>m.id===machineId)?.name??'기계'} 한 판`,-T.coin.cost);return true;
}

// ── 보장(같은 기계 연달아 실패 뒤 도움) ──
/** 이 기계 종류에 보장이 켜져 있나(타이머는 기본 끔 — 완료 기준 「10.00에서만 성공」) */
export function pityOn(kind,T=CLAW_TUNING){if(kind==='bridge')return T.bridge.pityAfter>0;if(!T.pity.after)return false;if(kind==='timer')return T.timer.pityWinSec>0;if(kind==='key')return T.key.pityFitBonus>0;return true;}
export const pityAfter=(kind,T=CLAW_TUNING)=>kind==='bridge'?T.bridge.pityAfter:T.pity.after; // 봉은 8판(v4.1 §7-5), 나머지는 pity.after
export const pityLeft=(s,machineId,T=CLAW_TUNING)=>{const k=kindOf(machineId);return pityOn(k,T)?Math.max(0,pityAfter(k,T)-(s.pity[machineId]??0)):null;};
export const pityNow=(s,machineId,T=CLAW_TUNING)=>pityLeft(s,machineId,T)===0;
export const PITY_NAME=Object.freeze({claw:'직원 도움',bridge:'직원 도움',timer:'넓은 성공 칸',key:'넓은 구멍'});

// ── 타이머 판정(설계 v3 §3-2, 시안 함수 그대로): 화면 숫자 = 0.01초 아래 버림, 판정은 그 숫자로만 ──
export const hund=ms=>Math.floor(ms/10+1e-9);
export function fmtTimer(ms){const h=Math.max(0,hund(ms));return String(Math.floor(h/100)).padStart(2,'0')+'.'+String(h%100).padStart(2,'0');}
export function judgeTimer(ms,c=CLAW_TUNING.timer,pity=false){
 const d=hund(ms)-Math.round(c.targetSec*100);
 const ok=Math.round((c.okWinSec+(pity?c.pityWinSec:0))*100),near=Math.round(c.nearWinSec*100);
 const r=ms>=c.maxSec*1000?'miss':Math.abs(d)<=ok?'win':Math.abs(d)<=near?'near':'miss';
 return {r,shown:fmtTimer(ms),diff:d/100};
}
export function timerDiffText(diff){if(diff===0)return '딱 맞았어요';const a=Math.abs(diff).toFixed(2);return diff>0?`+${a}초 늦었어요`:`${a}초 빨랐어요`;}

// ── 열쇠 판정(설계 v3 §3-3, 시안 함수 그대로): x = 칸 단위(0~cols), y = 칸 폭 단위(0~rows×cellH), 구멍 가운데 = (i+.5, j×cellH+holeY) ──
export function judgeKey(x,y,c=CLAW_TUNING.key,rare=()=>false,pity=false){
 const i=Math.floor(x),j=Math.floor(y/c.cellH);
 if(y<0||i<0||j<0||i>=c.cols||j>=c.rows)return {r:'miss',i,j,dx:0,dy:y<0?y-c.holeY:0,fit:c.fit};
 const dx=x-(i+.5),dy=y-(j*c.cellH+c.holeY),f=(rare(i,j)?c.fitRare:c.fit)+(pity?c.pityFitBonus:0);
 const m=Math.max(Math.abs(dx),Math.abs(dy));
 return {r:m<=f?'win':m<=f*c.nearMul?'near':'miss',i,j,dx,dy,fit:f};
}
/** 열쇠가 빗나간 방향 글(결과 카드) */
export function keyMissText(k){
 if(!k||k.r==='win')return '';const parts=[];
 if(Math.abs(k.dx)>k.fit)parts.push(k.dx>0?'오른쪽':'왼쪽');
 if(Math.abs(k.dy)>k.fit)parts.push(k.dy>0?'위':'아래');
 return parts.length?`열쇠가 구멍보다 ${parts.join('·')}에 꽂혔어요`:'구멍 가장자리에 걸렸어요';
}

// ── 규칙 안내(ⓘ·처음 규칙 카드): 조절값에서 만든다 ──
export const KIND_INFO=Object.freeze({
 claw:Object.freeze({icon:'🕹',short:'집게로 뽑기',level:1,label:'집게'}),
 bridge:Object.freeze({icon:'📦',short:'봉 위 상자 떨어뜨리기',level:2,label:'봉'}),
 timer:Object.freeze({icon:'⏱',short:'딱 10.00에 멈추기',level:3,label:'타이머'}),
 key:Object.freeze({icon:'🔑',short:'열쇠로 칸 고르기',level:2,label:'열쇠'}),
});
/** 기계 하나의 어려움 점(같은 종류 안 보이는 차이만, 설계 v4 §3-1) */
export const levelOf=machineId=>MACHINES.find(m=>m.id===machineId)?.level??KIND_INFO[kindOf(machineId)]?.level??1;
/** 타이머 숫자 어두워지는 초(기계별 보이는 차이, v4 §3-3: 타이머 3만 3초) */
export const hideAfterOf=(machineId,T=CLAW_TUNING)=>MACHINES.find(m=>m.id===machineId)?.hideAfterSec??T.timer.hideAfterSec;
/** shared = 가게 서버에서 기계 상태를 같이 쓰는 중(3단계, 지금은 늘 false = 혼자 뽑기 글) */
export function rulesFor(machineId,pool,T=CLAW_TUNING,nameOf=id=>plushInfo(id)?.name??id,rarityOf=id=>plushInfo(id)?.rarity??'common',{shared=false}={}){
 const kind=kindOf(machineId),P=pityAfter(kind,T),lines=[];let pity='';
 const ids=[...new Set(pool)].sort((a,b)=>RARITY_ORDER.indexOf(rarityOf(a))-RARITY_ORDER.indexOf(rarityOf(b)));
 if(kind==='claw'){const C=T.claw;
  lines.push(`십자 단추를 누르고 있으면 집게가 움직여요(${C.timeSec}초). 「뽑기」를 누르면 내려가요`,'집게는 실제로 인형을 조여서 들어 올려요. 무거운 인형·눌린 인형은 미끄러지기 쉬워요','「👁 옆에서」로 보면 집게가 앞뒤 어디 있는지 보여요');
  if(shared)lines.push('인형 자리는 모두 같아요 · 걸쳐 있는 인형은 다음 사람이 가져갈 수도 있어요');
  if(pityOn('claw',T))pity=`${P}번 연달아 못 뽑으면 직원이 인형 하나를 구멍 뒤 턱 바로 뒤에 세워 줘요(뽑을 때까지 판마다, 꼭 뽑히는 건 아니에요)`;}
 else if(kind==='timer'){const c=T.timer,t=c.targetSec.toFixed(2),lo=(c.targetSec-c.nearWinSec).toFixed(2),hi=(c.targetSec+c.nearWinSec).toFixed(2);
  lines.push('「▶ 시작」을 누르면 숫자가 0.01초씩 올라가요. 「✋ 멈춤」을 누른 순간 숫자가 멈춰요',
   (c.okWinSec>0?`${(c.targetSec-c.okWinSec).toFixed(2)}~${(c.targetSec+c.okWinSec).toFixed(2)}에 멈추면 성공`:`화면 숫자가 딱 ${t}일 때만 성공`)+' — 잠긴 유리문이 열리고 큰 인형을 꺼내요',
   `${lo}~${hi}(${t} 빼고)는 문이 덜컥하다 닫히는 아까움, 그 밖이나 ${c.maxSec.toFixed(2)}를 넘기면 실패`);
  const hide=hideAfterOf(machineId,T);if(hide>0)lines.push(`이 기계는 ${hide.toFixed(2)}초부터 숫자가 어두워져요(멈춘 숫자는 다시 밝게 보여요)`);
  if(pityOn('timer',T))pity=`${P}번 연달아 실패하면 다음 판은 성공 칸이 ±${c.pityWinSec.toFixed(2)}초 넓어져요`;}
 else if(kind==='bridge'){const B=T.bridge,M=MACHINES.find(m=>m.id===machineId),bars=M?.bars??{gap:B.gap};
  lines.push('「→」를 누르고 있다가 놓고, 「↑」를 누르고 있다가 놓아요. 놓으면 집게가 저절로 내려갔다 올라와요',
   '집게는 힘이 약해 상자를 들고 오지 못해요(걸리면 조금 들렸다 빠져요). 밀고 걸어서 봉 사이로 떨어뜨리면 성공',
   '봉은 4개예요: 가운데 두 봉에 상자가 걸쳐 있고, 앞뒤 봉은 상자가 밖으로 나가지 않게 막아요. 가운데 두 봉 사이로 빠지면 성공',
   bars.near?`이 기계는 가운데 봉이 팔(八) 자예요: 왼쪽 ${Math.round(bars.near*1000)/10}cm → 오른쪽 ${Math.round(bars.far*1000)/10}cm`:`가운데 두 봉 사이 ${Math.round(bars.gap*1000)/10}cm`,
   '한가운데를 노리면 두 발이 양옆으로 빠져요 · 모서리를 노려요',
   shared?`상자 자리는 모두 같아요. 앞사람이 옮긴 그대로 이어서 하고, 아무도 안 하면 ${T.share.idleResetMin}분 뒤 처음 자리로 돌아가요`:'상자는 판이 끝나도 그 자리에 남아요. 이 기기에서는 오늘 안에 이어서 해요');
  lines.push('상자가 앞뒤 봉 밖으로 나가거나 봉 아래에 끼면 직원이 처음 자리에 다시 놓아 줘요');
  if(pityOn('bridge',T))pity=`${P}번 연달아 못 떨어뜨리면 직원이 상자를 처음 자리에 다시 놓아 줘요(떨어지기 직전 상자는 그대로 둬요)`;}
 else{const c=T.key;
  lines.push(`큰 단추를 누르고 있으면 열쇠가 오른쪽으로 가요. 떼면 그 자리에 멈춰요`,`다시 누르고 있으면 위로 가요. 떼면 열쇠를 꽂아요`,
   `구멍 가운데에서 ${c.fit.toFixed(2)}칸 안이면 그 칸 인형이 나와요. 희귀·특별 칸은 구멍이 작아요(${c.fitRare.toFixed(2)}칸)`,`${c.nearMul}배 안이면 아까움(구멍 가장자리), 그 밖이면 실패`);
  if(pityOn('key',T))pity=`${P}번 연달아 실패하면 다음 판은 구멍이 ${c.pityFitBonus.toFixed(2)}칸 넓어져요(그림도 넓어짐)`;}
 return {kind,lines,pity,rows:ids.map(id=>({id,name:nameOf(id),rarity:rarityOf(id),label:RARITY[rarityOf(id)]?.label??''})),
  note:`코인은 매일 0시(서울)에 무료로 ${T.coin.daily}개가 돼요. 남은 코인은 다음 날로 넘어가지 않아요. 사는 곳·바꾸는 곳은 없어요. 판정 숫자는 시험용 임시값이에요.`};
}

// 봉 상자 판정 버전: 2 = 상자 직육면체·봉 간격 넓힘(2026-11-23 「집게가 상자를 통과」 수정). 옛 자리(박힌 상자·옛 봉 간격)는 버리고 처음 자리로
export const MACH_PV=2;
// ── 혼자 뽑기 기계 상태(v4.1 §3 A안, 대표 승인): 봉 상자 자리를 이 기기에 오늘(서울 0시)까지. st = 상자 공 자리(mm 정수, claw-bridge-physics.js boxState)
//  {day, st:[int…], id 지금 상자 경품, mv 옮긴 판 수, still 진척 없는 판 수, lay 누운 채 판 수}
export function sanitizeMachState(m,kind){
 if(!m||typeof m!=='object'||kind!=='bridge')return null;const day=date(m.day);if(!day)return null;
 const st=m.pv===MACH_PV&&Array.isArray(m.st)&&m.st.length>=6&&m.st.length<=96&&m.st.every(v=>Number.isInteger(v)&&Math.abs(v)<=2000)?m.st.slice():null;
 return {day,st,pv:MACH_PV,id:typeof m.id==='string'&&/^[a-z0-9-]{1,24}$/.test(m.id)?m.id:'',mv:int(m.mv,0,9999),still:int(m.still,0,999),lay:int(m.lay??0,0,999)};
}
/** 오늘 이어서 쓸 기계 상태(날짜가 바뀌었으면 null = 처음 자리) */
export const machStateToday=(s,machineId,now=Date.now())=>{const m=s.mach?.[machineId];return m&&m.day===seoulDate(now)?m:null;};
export function saveMachState(s,machineId,st,now=Date.now()){s.mach??={};s.mach[machineId]={...st,pv:MACH_PV,day:seoulDate(now)};}

/** 한 판 결과 적기: 도감·보장 수·기록. res = {kind:'win'|'near'|'miss', id}. 반환 {isNew,count} */
export function recordResult(s,machineId,res,now=Date.now()){
 if(res.kind==='win'&&res.id){
  s.pity[machineId]=0;s.wins++;const d=s.dex[res.id];const isNew=!d;
  s.dex[res.id]=d?{...d,n:d.n+1}:{n:1,first:seoulDate(now),machine:machineId};
  addLog(s,now,`${plushInfo(res.id)?.name??'인형'} 뽑음${isNew?' · 새 인형!':''}`);
  return {isNew,count:s.dex[res.id].n};
 }
 s.pity[machineId]=(s.pity[machineId]??0)+1;return {isNew:false,count:0};
}
export const dexCount=(s,catalog=PLUSH)=>catalog.filter(p=>s.dex[p.id]).length;

// ── 다른 손님에게 보내는 행동 상태(act, multi-protocol ACT_SCHEMA.claw) ──
// m 기계(0 없음·1~3) · ph 단계 · cx·cz 자리(집게: cm+50 / 열쇠: 칸×100, (칸+0.5)×100) · r 이번 판 인형 id · k 결과(0 아직·1 성공·2 아까움·3 실패) · n 판 번호 · v 타이머 멈춘 숫자(0.01초)
export const ACT_PHASES=Object.freeze(['','play','drop','win','lose']);
export const KIND_CODE=Object.freeze({win:1,near:2,miss:3});
export const KIND_OF=Object.freeze({1:'win',2:'near',3:'miss'});
export const encodeClawPos=v=>Math.max(0,Math.min(100,Math.round(v*100)+50));
export const decodeClawPos=v=>(Number(v)-50)/100;
export const encodeKeyPos=(x,y)=>[Math.max(0,Math.min(1000,Math.round(x*100))),Math.max(0,Math.min(1000,Math.round((y+.5)*100)))];
export const decodeKeyPos=(cx,cz)=>[(Number(cx)||0)/100,(Number(cz)||0)/100-.5];
export const noticeWorthy=(id,T=CLAW_TUNING,rarityOf=id=>plushInfo(id)?.rarity)=>{const r=rarityOf(id);return !!r&&RARITY_ORDER.indexOf(r)>=RARITY_ORDER.indexOf(T.notice.minRarity);};
