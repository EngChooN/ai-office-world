// 뽑은 인형 자랑하기 — 저장·다른 사람에게 보내는 칸·숨김 규칙(월드개발, 2026-11-25). three 없음(노드 시험·화면이 같이 읽는다).
// 시안 v1(11-25 대표 결정: 손 1 + 등 1, 큰 인형 3종만 등, 희귀·특별만 빛, 뽑는 동안만 숨김) + v2 docs/인형뽑기/인형자랑-체험-시안-v2.html
// (11-25 대표 결정: **인형뽑기 가게(/claw/) 안에서만** 보임, 고르는 곳 = 🧸 도감, 가게를 나갔다 와도 들던 인형 그대로).
//  - 든 인형은 이 기기에 저장(aoworld:carry:v1 {hand,back}). 다음에 가게에 들어오면 바로 들고 있음.
//  - 들 수 있는 인형 = 인형뽑기 도감(claw-world:v1 dex)에 있는 우리 인형(작은 8·큰 3·상자 8). 도감에 없으면(기록 지움 등) 저절로 내려놓음.
//    손님 인형(개발판 guest-*)은 들 수 없음(공개판 화면이 그릴 수 없음).
//  - 같은 가게 손님에게: 인형가게 행동 상태(act)에 칸 ch(손)·cb(등)를 붙인다(multi-protocol ACT_SCHEMA.claw, 바뀔 때만 보냄).
//    옛 서버는 모르는 칸을 버리므로 운영 서버를 다시 켜기 전에는 내 화면에만 보인다.
//  - 바뀌면 window 'aoworld:carry' 이벤트(detail = {hand,back}). 다른 탭에서 바꾼 것은 storage 이벤트로 따라감.
import {PLUSH,BIG_PLUSH,BOX_PLUSH,GUEST_SLOTS,RARITY,RARITY_ORDER,plushInfo,isBigPlush} from '../claw/claw-palette.js';

export const CARRY_KEY='aoworld:carry:v1';
export const CLAW_SAVE_KEY='claw-world:v1'; // claw-rules.js SAVE_KEY와 같은 값(이 파일이 claw-rules를 부르지 않게 따로 둠 — 시험이 맞춰 봄)
export const CARRY_EVENT='aoworld:carry';
/** 들 수 있는 인형 전체(도감 순: 작은 8 → 큰 3 → 상자 8) */
export const CARRY_IDS=Object.freeze([...PLUSH,...BIG_PLUSH,...BOX_PLUSH].map(p=>p.id));
const ORDER=new Map(CARRY_IDS.map((id,i)=>[id,i]));
/** 손 = 작은 인형·상자 피규어, 등 = 큰 인형 3종(carry-art.js carrySlotOf와 같은 규칙) */
export const slotOf=id=>isBigPlush(id)?'back':'hand';
export const isCarryId=id=>typeof id==='string'&&ORDER.has(id);
const EMPTY=Object.freeze({hand:null,back:null});

/** 저장값·받은 값 정리: 모르는 인형·자리가 틀린 인형은 뺀다. owned(집합)를 주면 그 안의 인형만 */
export function sanitizeCarry(raw,owned=null){
 const out={hand:null,back:null};if(!raw||typeof raw!=='object')return out;
 for(const k of ['hand','back']){const id=raw[k];if(isCarryId(id)&&slotOf(id)===k&&(!owned||owned.has(id)))out[k]=id;}
 return out;
}
/** 인형뽑기 도감에서 뽑은 인형 id 집합(뽑은 수 n과 함께) → Map(id → n) */
export function ownedFromClaw(storage=globalThis.localStorage){
 const m=new Map();
 try{const s=JSON.parse(storage?.getItem(CLAW_SAVE_KEY)??'null');const dex=s?.dex;if(dex&&typeof dex==='object')for(const [id,v] of Object.entries(dex)){const n=Number.isInteger(v?.n)?v.n:0;if(isCarryId(id)&&n>0)m.set(id,n);}}catch{}
 return m;
}
export function loadCarry(storage=globalThis.localStorage,owned=ownedFromClaw(storage)){
 try{return sanitizeCarry(JSON.parse(storage?.getItem(CARRY_KEY)??'null'),new Set(owned.keys()));}catch{return {...EMPTY};}
}
export function saveCarry(c,storage=globalThis.localStorage){try{storage?.setItem(CARRY_KEY,JSON.stringify({hand:c.hand??null,back:c.back??null}));return true;}catch{return false;}}

/** 고르는 창 목록 순서: 등급 높은 것 먼저(특별 → 흔함), 같은 등급은 도감 순 */
export function sortCarryList(ids){
 const r=id=>RARITY_ORDER.indexOf(plushInfo(id)?.rarity??'common');
 return [...ids].filter(isCarryId).sort((a,b)=>r(b)-r(a)||ORDER.get(a)-ORDER.get(b));
}
/** 인형 하나를 눌렀을 때 다음 상태: 이미 든 인형이면 내려놓기, 아니면 그 자리에 들기(같은 자리 인형은 바꿔 듦) */
export function toggleCarry(c,id){
 if(!isCarryId(id))return {...c};const k=slotOf(id);
 return {...c,[k]:c[k]===id?null:id};
}

// ── 다른 사람에게 보내는 칸 ──
/** 내 든 인형 → act에 붙일 칸(빈 자리는 칸을 안 붙임 — 서버는 act를 통째로 바꾸므로 안 보내면 내려놓은 것) */
export function carryAct(c){const o={};if(c?.hand)o.ch=c.hand;if(c?.back)o.cb=c.back;return o;}
/** 받은 act → 그릴 인형. 모르는 손님 인형(guest-*)은 같은 등급 우리 인형(GUEST_SLOTS fallback)으로 대신 그림(시안 §7) */
export function carryFromAct(a){
 const fix=id=>{if(typeof id!=='string'||!id)return null;if(isCarryId(id))return id;const g=GUEST_SLOTS.find(s=>s.id===id);return g?.fallback??null;};
 return sanitizeCarry({hand:fix(a?.ch),back:fix(a?.cb)});
}

// ── 잠시 숨김: 인형가게는 기계 앞에서 뽑는 동안(act m > 0) 손·등 모두(대표 결정). 가게에는 앉기·탈것이 없음(시안 v2 §3)
// 돌려줌 {hideHand, hideBack, seated(0)} — carry-art.js update에 그대로 넘김
export function carryHide(a){const on=(a?.m|0)>0;return {hideHand:on,hideBack:on,seated:0};}

/** 먼 사람: 휴대폰은 이 거리(m) 밖 사람의 인형 모형을 그리지 않고 빛만 그림(시안 v2 §6, 거리는 개발 결정 — 가게가 14×11m라 대부분 손님은 인형까지 보임) */
export const CARRY_FAR_M=12;
export const carryFar=(dist,mobile)=>!!mobile&&dist>CARRY_FAR_M;

// ── 이 기기의 든 인형(화면이 같이 씀). 처음 읽을 때 도감과 맞춰 정리하고, 바뀌면 이벤트 ──
let cur=null;
export function currentCarry(){if(!cur)cur=loadCarry();return cur;}
export function setCarry(next,{win=globalThis.window,storage=globalThis.localStorage}={}){
 const owned=new Set(ownedFromClaw(storage).keys());
 const c=sanitizeCarry(next,owned);
 const was=currentCarry();cur=c;saveCarry(c,storage);
 if(was.hand!==c.hand||was.back!==c.back)win?.dispatchEvent?.(new CustomEvent(CARRY_EVENT,{detail:{...c}}));
 return c;
}
/** 도감을 다시 읽어 든 인형을 맞춤(인형뽑기에서 뽑은 직후·다른 탭에서 바꾼 뒤) */
export function refreshCarry(opts){return setCarry(loadCarry(opts?.storage),opts);}
export function onCarry(f,{win=globalThis.window}={}){
 const h=e=>f(e.detail);win?.addEventListener?.(CARRY_EVENT,h);
 // 다른 탭(인형뽑기를 다른 탭에서 하고 있을 때)에서 바꾸면 이 탭도 따라감
 const s=e=>{if(e.key===CARRY_KEY||e.key===CLAW_SAVE_KEY){cur=null;const c=currentCarry();f({...c});}};
 win?.addEventListener?.('storage',s);
 return ()=>{win?.removeEventListener?.(CARRY_EVENT,h);win?.removeEventListener?.('storage',s);};
}
/** 시험용: 기억한 값 지우기 */
export function _resetCarry(){cur=null;}

/** 인형 이름·등급 색(화면 글) */
export function carryLabel(id){const p=plushInfo(id);return p?{name:p.name,rarity:p.rarity,color:RARITY[p.rarity].color,stars:RARITY[p.rarity].stars,box:!!p.box,big:!!p.big}:null;}
