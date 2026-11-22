// 남산 사랑의 자물쇠 규칙(11-22, 월드개발). 서버(server/namsan-locks.mjs)와 화면(namsan-lock-board.js)이 같이 쓴다. three 없음.
// 수치·문구는 월드디자인 시안 v2(docs/남산/남산-자물쇠-메시지-시안-v2.html §⑤) 추천안 그대로(대표 미확인).
// 주고받기(서버 = 남산 방에서만):
//  → {t:'lk-list',owner}                       ← {t:'lk-all',locks:[난간 것],bundle:지난 자물쇠 수}
//  → {t:'lk-hang',owner,slot,c,h,text,q}       ← {t:'lk-ok',q,lock} | {t:'lk-err',q,code}  (+ 남산 방 모두에게 {t:'lk-add',lock,moved:id|null})
//  → {t:'lk-del',owner,id}                     ← 모두에게 {t:'lk-gone',id}
//  → {t:'lk-report',owner,id,reason}           ← {t:'lk-reported',id} (서로 다른 3명이면 모두에게 {t:'lk-gone',id})
//  → {t:'lk-bundle',owner,page}                ← {t:'lk-bundle',page,total,locks:[5개]}
//  owner = 기기마다 만든 무작위 열쇠(16진수 32자). 서버는 해시만 저장한다. 받는 자물쇠 = {id,slot,c,h,text,name,at,mine?}
export const LOCK_RULES=Object.freeze({
 slots:234,        // 난간 자리(namsan-interact-art.js lockSlots 순서 0~233)
 textMax:30,       // 한마디 글자 수(보이는 글자 단위)
 perOwner:3,       // 한 사람(기기 열쇠) 최대 개수 = NS_LOCKS.max
 gapMs:20000,      // 같은 사람 걸기 간격
 ipPerDay:10,      // 같은 곳(IP 해시, 메모리만) 하루 걸기 수
 reportHide:3,     // 서로 다른 신고자 수 → 모두에게서 숨김
 keep:3000,        // 서버 전체 보관 상한(넘으면 꾸러미의 가장 오래된 것부터 지움)
 bundlePage:5,     // 꾸러미 목록 한 쪽
 replyMs:5000      // 화면이 서버 답을 기다리는 시간
});
export const LOCK_REPORT_REASONS=Object.freeze(['abuse','private','spam','etc']);
export const LOCK_REPORT_LABEL=Object.freeze({abuse:'욕설·비하',private:'개인정보가 보여요',spam:'광고·도배',etc:'기타'});
export const LOCK_ERR=Object.freeze({
 private:'전화번호·이메일·주소·링크는 쓸 수 없어요.',
 banned:'쓸 수 없는 말이 들어 있어요. 고쳐서 다시 걸어 주세요.',
 limit:'내 자물쇠 3개를 다 걸었어요 · 하나를 떼면 다시 걸 수 있어요',
 rate:'잠시 뒤에 다시 걸어 주세요.',
 busy:'저장하지 못했어요. 연결을 확인하고 다시 걸어 주세요.',
 bad:'저장하지 못했어요. 연결을 확인하고 다시 걸어 주세요.'
});
export const isOwnerKey=k=>typeof k==='string'&&/^[0-9a-f]{32}$/.test(k);
export const isLockId=id=>typeof id==='string'&&/^lk_[0-9a-z]{6,16}$/.test(id);

const seg=typeof Intl!=='undefined'&&Intl.Segmenter?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
const graphemes=s=>seg?[...seg.segment(s)].map(x=>x.segment):[...s];
/** 보이는 글자 수(이모지 1개 = 1자) */
export const lockLength=s=>graphemes(String(s??'')).length;
/** 한마디 정리: NFC, 제어·방향 문자 지움, 줄바꿈·빈칸 여러 개 → 빈칸 하나, 앞뒤 빈칸 지움, 30자에서 자름 */
export function cleanLockText(raw){
 const s=String(raw??'').normalize('NFC').replace(/[\r\n\t]+/g,' ').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g,'').replace(/\s+/g,' ').trim();
 return graphemes(s).slice(0,LOCK_RULES.textMax).join('').trim();
}
/** 개인정보 꼴: 숫자 8개 이상(빈칸·-·. 섞여도), 이메일(@), 링크(http, www, 흔한 도메인 끝) */
export function privateLike(s){
 const t=String(s??'').normalize('NFKC');
 if(/\d(?:[\s.\-–—_/]*\d){7,}/.test(t))return true;
 if(/@/.test(t))return true;
 if(/https?:|www\.|[a-z0-9-]\.(com|net|org|kr|co|io|me|ly|gg|xyz|link|site|shop|app|kakao|to)\b/i.test(t))return true;
 return false;
}
/** 금칙어(채팅과 같은 목록): 대소문자·빈칸 무시하고 들어 있으면 true */
export function bannedLike(s,banned=[]){
 const t=String(s??'').normalize('NFC').toLowerCase(),flat=t.replace(/\s+/g,'');
 return banned.some(w=>{const x=String(w??'').normalize('NFC').toLowerCase().trim();return x&&(t.includes(x)||flat.includes(x.replace(/\s+/g,'')));});
}
/** 걸기 전 글 검사 → {ok,text,code?}. 화면은 banned 없이 불러 개인정보 꼴만 미리 알리고, 서버가 최종 판단 */
export function checkLockText(raw,banned=[]){
 const text=cleanLockText(raw);
 if(text&&privateLike(text))return {ok:false,text,code:'private'};
 if(text&&bannedLike(text,banned))return {ok:false,text,code:'banned'};
 return {ok:true,text};
}
/** 날짜만(한국 시간): 2026. 11. 22. */
export function lockDate(at){
 const d=new Date(Number(at)+9*3600e3);if(!Number.isFinite(d.getTime()))return '';
 return `${d.getUTCFullYear()}. ${d.getUTCMonth()+1}. ${d.getUTCDate()}.`;
}
/** 기기 열쇠(없으면 만들어 저장). storage 없으면 이번 화면에서만 */
export const LOCK_KEY_STORE='namsan-lock-key:v1';
export function deviceLockKey(storage,rand=()=>globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint8Array(16)):Uint8Array.from({length:16},()=>Math.floor(Math.random()*256))){
 try{const k=storage?.getItem(LOCK_KEY_STORE);if(isOwnerKey(k))return k;}catch{}
 const k=[...rand()].map(b=>b.toString(16).padStart(2,'0')).join('');
 try{storage?.setItem(LOCK_KEY_STORE,k);}catch{}
 return k;
}
