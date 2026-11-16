// 온라인 크리스마스 — 선물 우체통 규칙(월드개발, 2026-11-16). 서버(room-play.js)·화면(gift-ui.js)이 같이 쓰는 순수 모듈(three 없음).
// 체험설계 v1 §5-2 추천안:
//  - 선물 = 아이템 1개 + 카드(그림 3종 × 글 60자, 또는 기본 문구 4개). 돈·실물 없음. 보낸 사람 것은 줄지 않는다.
//  - 받는 사람: 지금 같은 광장에 있는 사람 1명 또는 광장 모두('*'). 잠깐 끊긴 사람(재접속 유예 60초)에게 온 선물은 서버가 들고 있다가 돌아오면 준다.
//  - 제한: 한 사람 5분에 3개, 같은 사람에게 5분에 1개, 광장 모두에게는 30분에 1번.
//  - 카드 글은 채팅과 같은 금칙어 가림(서버 sanitizeChat). 광장 모두에게 보낸 카드는 「모두의 카드」 판에 최근 5장.
export const GIFT_ITEMS=Object.freeze(['santa','stripe','antlers','ornament','sticker','cocoa']);
// wear = 받으면 이 기기 옷장에 남는 입는 것(대표 결정 11-16), tree = 트리에 내 몫과 따로 하나 더 달 수 있음, cocoa = 모닥불에서 코코아 마시기
export const GIFT_INFO=Object.freeze({
 santa:{ic:'🎅',label:'산타 모자',wear:true},stripe:{ic:'🧣',label:'줄무늬 목도리',wear:true},antlers:{ic:'🦌',label:'순록 머리띠',wear:true},
 ornament:{ic:'🔴',label:'오너먼트',tree:true},sticker:{ic:'❄️',label:'눈송이 스티커'},cocoa:{ic:'☕',label:'코코아',cocoa:true},
});
export const CARD_DESIGNS=Object.freeze(['tree','snowman','fire']);
export const CARD_INFO=Object.freeze({tree:{ic:'🎄',label:'트리'},snowman:{ic:'⛄',label:'눈사람'},fire:{ic:'🔥',label:'모닥불'}});
export const CARD_PRESETS=Object.freeze(['메리 크리스마스!','따뜻한 겨울 보내세요','함께 놀아서 즐거웠어요','행복한 연말 되세요']);
export const GIFT_RULES=Object.freeze({textMax:60,perWindow:3,windowMs:5*60000,sameMs:5*60000,allMs:30*60000,board:5,holdMs:60000,bonusMax:3,inboxMax:30});
const sec=w=>w>=60?`${Math.ceil(w/60)}분`:`${w}초`;
export const GIFT_TEXT=Object.freeze({
 rate:w=>`선물은 5분에 3개까지 보낼 수 있어요${w?` · ${sec(w)} 뒤`:''}`,
 same:w=>`같은 사람에게는 5분에 하나만 보낼 수 있어요${w?` · ${sec(w)} 뒤`:''}`,
 all:w=>`광장 모두에게는 30분에 한 번 보낼 수 있어요${w?` · ${sec(w)} 뒤`:''}`,
 gone:'그 사람이 지금 광장에 없어요',self:'나에게는 보낼 수 없어요',bad:'선물을 보낼 수 없어요',
 offline:'연결이 돌아오면 다시 눌러 주세요',solo:'혼자 둘러보기에서는 선물을 보낼 수 없어요. 서버를 골라 광장에 들어가 주세요',
});
// 카드 글 정리(금칙어 가림 전 단계): 제어·방향 문자 빼기, 공백 한 칸, 60자. 빈 글이면 ''.
export function cleanCardText(raw){
 return [...String(raw??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g,'').replace(/\s+/g,' ').trim()].slice(0,GIFT_RULES.textMax).join('').trim();
}
// 보내기 요청 모양 검사(서버). 맞으면 {to,item,card,text}, 아니면 null.
export function parseGiftSend(m){
 if(!m||typeof m.to!=='string'||!m.to||m.to.length>24)return null;
 if(!GIFT_ITEMS.includes(m.item)||!CARD_DESIGNS.includes(m.card))return null;
 const text=cleanCardText(m.text);if(!text)return null;
 return {to:m.to,item:m.item,card:m.card,text};
}
// 받은 선물 모양 검사(화면). {t:'gift',g,id,n,item,card,text,all?}
export function sanitizeGift(m){
 if(!m||typeof m.g!=='string'||typeof m.id!=='string'||!GIFT_ITEMS.includes(m.item)||!CARD_DESIGNS.includes(m.card))return null;
 return {g:m.g.slice(0,32),id:m.id,n:String(m.n??'').slice(0,24),item:m.item,card:m.card,text:String(m.text??'').slice(0,GIFT_RULES.textMax),all:!!m.all};
}
// 보내는 사람 한 명의 제한. check(t,to) → {ok:true} | {ok:false,reason,wait(초)}. 통과하면 note(t,to)로 적는다.
export function createGiftLimiter(rules=GIFT_RULES){
 let sent=[];const same=new Map();let lastAll=-Infinity;
 return {
  check(t,to){
   sent=sent.filter(x=>t-x<rules.windowMs);
   if(sent.length>=rules.perWindow)return {ok:false,reason:'rate',wait:Math.ceil((sent[0]+rules.windowMs-t)/1000)};
   if(to==='*'){if(t-lastAll<rules.allMs)return {ok:false,reason:'all',wait:Math.ceil((lastAll+rules.allMs-t)/1000)};}
   else{const at=same.get(to);if(at!==undefined&&t-at<rules.sameMs)return {ok:false,reason:'same',wait:Math.ceil((at+rules.sameMs-t)/1000)};}
   return {ok:true};
  },
  note(t,to){sent.push(t);if(to==='*')lastAll=t;else same.set(to,t);for(const [k,at] of same)if(t-at>=rules.sameMs)same.delete(k);},
 };
}
export const giftDeniedText=r=>{const f=GIFT_TEXT[r?.reason];return typeof f==='function'?f(r.wait):f??GIFT_TEXT.bad;};
