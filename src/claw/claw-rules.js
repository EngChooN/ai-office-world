// 온라인 인형뽑기 규칙(월드개발, 2026-11-23). three를 쓰지 않는다(node 시험·화면 UI가 함께 읽는다).
// 기획서 MVP §3~5 + 월드디자인 설계 v1(단추·코인·도감)·v2(집게 = 물리, 대표 결정)·v3(기계 3종: 집게·타이머·열쇠).
// 숫자는 모두 조절값 CLAW_TUNING 한곳에 모은다. 코인·허용 오차·빠르기·세기·보장 횟수는 **임시값(대표 결정 대기)** — 바꿀 때는 이 표만 고친다.
// 규칙 안내 글(ⓘ·처음 규칙 카드)도 이 값에서 만든다(보이는 규칙 = 판정 규칙). 몰래 확률을 바꾸지 않는다(월드리서치 권고).
// 실제 결제·코인 판매·교환·선물은 없다.
import {PLUSH,RARITY,RARITY_ORDER,MACHINES,plushInfo} from './claw-palette.js';

export const CLAW_TUNING=Object.freeze({
 coin:Object.freeze({daily:15,cost:1}),               // 하루 코인(서울 날짜가 바뀌면 이 개수로 다시 채움, 남은 코인은 넘어가지 않음) · 한 판 값  [대표 결정 11-23]
 pity:Object.freeze({after:5}),                       // 같은 기계에서 연달아 n번 실패하면 다음 판 도움(기계 종류마다 다름, 0이면 끔)  [임시값]
 // 집게(설계 v2·v3 §3-1): 물리 판정. 세기 = 집게발이 버티는 힘(잡기/들고 가기), 힘센 집게 = 보장 판(꼭 성공은 아님)
 claw:Object.freeze({timeSec:20,dropLockSec:.6,moveSpeed:.35,ramp:.1,dolls:14,
  power:Object.freeze({grab:.002,carry:.0015}),pityPower:Object.freeze({grab:.012,carry:.012}),
  mass:Object.freeze({common:1,uncommon:1.15,rare:1.35,special:1.6})}),   // 희귀할수록 무거워 잘 안 잡힘(크기는 그림대로)
 // 타이머(설계 v3 §3-2): 화면에 멈춘 숫자로만 판정. 10.00 = 성공, ±0.10 = 아까움, 15.00 넘김·그 밖 = 실패. 보장 기본 끔(pityWinSec 0)
 timer:Object.freeze({targetSec:10,okWinSec:0,nearWinSec:.1,maxSec:15,startLockSec:.5,readyLimitSec:20,hideAfterSec:0,pityWinSec:0}),
 // 열쇠(설계 v3 §3-3): 칸 2×4, 누르고 있기 → 오른쪽(떼면 고정) → 0.3초 → 누르고 있기 → 위(떼면 밀어 넣음). 단위 = 칸 폭
 key:Object.freeze({cols:4,rows:2,cellH:1.4,holeY:.32,startX:.15,startY:-.3,speed:1.4,fit:.14,fitRare:.08,nearMul:2,pityFitBonus:.05,holdLimitSec:10,gapSec:.3}),
 notice:Object.freeze({minRarity:'rare',gapSec:10}),   // 다른 손님 소식은 희귀 이상만, 10초에 1번(설계 v1 §4)
 log:5,
});
export const SAVE_KEY='claw-world:v1';
export const KINDS=Object.freeze(['claw','timer','key']);
export const kindOf=machineId=>MACHINES.find(m=>m.id===machineId)?.kind??'claw';

// ── 서울 날짜(무료 코인은 서울 0시에 바뀐다) ──
const KST=9*3600e3;
export const seoulDate=(ms=Date.now())=>new Date(ms+KST).toISOString().slice(0,10);
export function msToNextGrant(ms=Date.now()){const d=new Date(ms+KST);const next=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-KST;return next-ms;}
export function leftText(ms){const m=Math.max(0,Math.ceil(ms/60000)),h=Math.floor(m/60);return h?`${h}시간 ${m%60}분`:`${m}분`;}

// ── 저장(이 기기, 이어하기) ──
const MACHINE_IDS=MACHINES.map(m=>m.id);
const int=(v,lo,hi,d=0)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:d;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
// coinV = 코인 규칙 판(2 = 11-23 대표 결정 「하루 15개로 다시 채움」, 그 전 저장(1) = 10개씩 더해 30개까지 모으던 규칙)
export const COIN_V=2;
export function freshState(){return {coins:0,lastGrant:null,coinV:COIN_V,plays:0,wins:0,dex:{},pity:{},seen:{},log:[],seenTip:false};}
/** 저장값을 믿지 않고 정리한다(손님 인형 id는 isKnown이 true일 때만 남김 — 공개판에는 칸이 없다) */
export function sanitizeState(raw,{isKnown=id=>!!plushInfo(id)}={}){
 const s=freshState();if(!raw||typeof raw!=='object')return s;
 s.coins=int(raw.coins,0,999);s.lastGrant=date(raw.lastGrant);s.coinV=raw.coinV===COIN_V?COIN_V:1;s.plays=int(raw.plays,0,1e7);s.wins=int(raw.wins,0,1e7);s.seenTip=raw.seenTip===true;
 if(raw.dex&&typeof raw.dex==='object')for(const [id,v] of Object.entries(raw.dex)){if(!isKnown(id)||!v)continue;const n=int(v.n,1,1e6,0);if(!n)continue;s.dex[id]={n,first:date(v.first)??'',machine:MACHINE_IDS.includes(v.machine)?v.machine:''};}
 if(raw.pity&&typeof raw.pity==='object')for(const id of MACHINE_IDS)if(Number.isInteger(raw.pity[id]))s.pity[id]=int(raw.pity[id],0,999);
 if(raw.seen&&typeof raw.seen==='object')for(const id of MACHINE_IDS)if(raw.seen[id]===true)s.seen[id]=true;
 if(Array.isArray(raw.log))s.log=raw.log.filter(r=>r&&typeof r.text==='string'&&Number.isFinite(r.at)).slice(-CLAW_TUNING.log).map(r=>({at:r.at,text:r.text.slice(0,60),d:Number.isInteger(r.d)?r.d:0}));
 return s;
}
export function loadState(storage=globalThis.localStorage,opt){try{return sanitizeState(JSON.parse(storage?.getItem(SAVE_KEY)??'null'),opt);}catch{return freshState();}}
export function saveState(s,storage=globalThis.localStorage){try{storage?.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
const addLog=(s,at,text,d=0)=>{s.log.push({at,text,d});while(s.log.length>CLAW_TUNING.log)s.log.shift();};

// ── 코인 ──
/** 오늘(서울) 아직 안 받았으면 코인을 하루 개수로 다시 채움(어제 남은 코인은 넘어가지 않음). 반환 = 지금 코인 수(이미 받았으면 null)
 *  옛 규칙 저장(coinV 1)을 처음 읽은 날: 오늘 이미 받았어도 하루 개수보다 적으면 그만큼 채워 줌, 많으면 오늘은 그대로 두고 다음 날부터 새 규칙 */
export function grantDaily(s,now=Date.now(),T=CLAW_TUNING){
 const today=seoulDate(now);
 if(s.coinV!==COIN_V){s.coinV=COIN_V;
  if(s.lastGrant===today){const add=Math.max(0,T.coin.daily-s.coins);if(!add)return null;s.coins+=add;addLog(s,now,`오늘의 코인을 ${T.coin.daily}개로 채웠어요(하루 ${T.coin.daily}개로 바뀜)`,add);return s.coins;}}
 if(s.lastGrant===today)return null;
 const before=s.coins;s.coins=T.coin.daily;s.lastGrant=today;
 addLog(s,now,before>0?`오늘의 코인 ${T.coin.daily}개(어제 남은 ${before}개는 넘어오지 않아요)`:`오늘의 코인 ${T.coin.daily}개`,s.coins-before);return s.coins;
}
export const grantedToday=(s,now=Date.now())=>s.lastGrant===seoulDate(now);
export const canPlay=(s,T=CLAW_TUNING)=>s.coins>=T.coin.cost;
export function spendCoin(s,machineId,now=Date.now(),T=CLAW_TUNING){
 if(!canPlay(s,T))return false;s.coins-=T.coin.cost;s.plays++;
 addLog(s,now,`${MACHINES.find(m=>m.id===machineId)?.name??'기계'} 한 판`,-T.coin.cost);return true;
}

// ── 보장(같은 기계 연달아 실패 뒤 도움) ──
/** 이 기계 종류에 보장이 켜져 있나(타이머는 기본 끔 — 완료 기준 「10.00에서만 성공」) */
export function pityOn(kind,T=CLAW_TUNING){if(!T.pity.after)return false;if(kind==='timer')return T.timer.pityWinSec>0;if(kind==='key')return T.key.pityFitBonus>0;return true;}
export const pityLeft=(s,machineId,T=CLAW_TUNING)=>pityOn(kindOf(machineId),T)?Math.max(0,T.pity.after-(s.pity[machineId]??0)):null;
export const pityNow=(s,machineId,T=CLAW_TUNING)=>pityLeft(s,machineId,T)===0;
export const PITY_NAME=Object.freeze({claw:'힘센 집게',timer:'넓은 성공 칸',key:'넓은 구멍'});

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
 claw:Object.freeze({icon:'🕹',short:'집게로 뽑기',level:1}),
 timer:Object.freeze({icon:'⏱',short:'딱 10.00에 멈추기',level:3}),
 key:Object.freeze({icon:'🔑',short:'열쇠로 칸 고르기',level:2}),
});
export function rulesFor(machineId,pool,T=CLAW_TUNING,nameOf=id=>plushInfo(id)?.name??id,rarityOf=id=>plushInfo(id)?.rarity??'common'){
 const kind=kindOf(machineId),P=T.pity.after,lines=[];let pity='';
 const ids=[...new Set(pool)].sort((a,b)=>RARITY_ORDER.indexOf(rarityOf(a))-RARITY_ORDER.indexOf(rarityOf(b)));
 if(kind==='claw'){const C=T.claw;
  lines.push(`십자 단추를 누르고 있으면 집게가 움직여요(${C.timeSec}초). 「뽑기」를 누르면 내려가요`,'집게는 실제로 인형을 조여서 들어 올려요. 무거운 인형·눌린 인형은 미끄러지기 쉬워요','「👁 옆에서」로 보면 집게가 앞뒤 어디 있는지 보여요');
  if(pityOn('claw',T))pity=`${P}번 연달아 못 뽑으면 다음 한 판은 힘센 집게(꼭 잡히는 건 아니에요)`;}
 else if(kind==='timer'){const c=T.timer,t=c.targetSec.toFixed(2),lo=(c.targetSec-c.nearWinSec).toFixed(2),hi=(c.targetSec+c.nearWinSec).toFixed(2);
  lines.push('「▶ 시작」을 누르면 숫자가 0.01초씩 올라가요. 「✋ 멈춤」을 누른 순간 숫자가 멈춰요',
   (c.okWinSec>0?`${(c.targetSec-c.okWinSec).toFixed(2)}~${(c.targetSec+c.okWinSec).toFixed(2)}에 멈추면 성공`:`화면 숫자가 딱 ${t}일 때만 성공`)+' — 잠긴 유리문이 열리고 인형을 꺼내요',
   `${lo}~${hi}(${t} 빼고)는 문이 덜컥하다 닫히는 아까움, 그 밖이나 ${c.maxSec.toFixed(2)}를 넘기면 실패`);
  if(pityOn('timer',T))pity=`${P}번 연달아 실패하면 다음 판은 성공 칸이 ±${c.pityWinSec.toFixed(2)}초 넓어져요`;}
 else{const c=T.key;
  lines.push(`큰 단추를 누르고 있으면 열쇠가 오른쪽으로 가요. 떼면 그 자리에 멈춰요`,`다시 누르고 있으면 위로 가요. 떼면 열쇠를 꽂아요`,
   `구멍 가운데에서 ${c.fit.toFixed(2)}칸 안이면 그 칸 인형이 나와요. 희귀·특별 칸은 구멍이 작아요(${c.fitRare.toFixed(2)}칸)`,`${c.nearMul}배 안이면 아까움(구멍 가장자리), 그 밖이면 실패`);
  if(pityOn('key',T))pity=`${P}번 연달아 실패하면 다음 판은 구멍이 ${c.pityFitBonus.toFixed(2)}칸 넓어져요(그림도 넓어짐)`;}
 return {kind,lines,pity,rows:ids.map(id=>({id,name:nameOf(id),rarity:rarityOf(id),label:RARITY[rarityOf(id)]?.label??''})),
  note:`코인은 매일 0시(서울)에 무료로 ${T.coin.daily}개가 돼요. 남은 코인은 다음 날로 넘어가지 않아요. 사는 곳·바꾸는 곳은 없어요. 판정 숫자는 시험용 임시값이에요.`};
}

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
