// 온라인 크리스마스 — 모두의 트리 상태(월드개발, 2026-11-16). 서버(server/rooms.mjs)·화면(main.js 혼자 보기·내 컴퓨터 모드)이 같이 쓰는 순수 모듈.
// three·layout·props를 import 하지 않는다(서버 이미지에 이 파일 하나만 넣는다). 값이 layout.js·props.js와 같은지는 tests/christmas-world.test.mjs가 본다.
// 규칙(체험설계 v1 §5-1 추천안):
//  - 자리 120개 중 빈 자리에 장식 8종 중 하나를 단다. 자리 번호 + 종류 + 단 사람(이름)만 주고받는다.
//  - 한 사람: 1분에 3개, 트리에 남는 내 장식 최대 10개. 되돌리기는 내가 단 것만, 단 지 60초 안에만.
//  - 꼭대기 별: 장식 40개부터 열림, 한 번 달면 끝(먼저 단 사람 이름이 남음).
//  - 전구 단계는 장식 수로 정해진다(20·40·80·120) — 따로 보내지 않는다.
//  - 초기화: 서버는 방에 아무도 없는 채로 TREE_RULES.resetMs가 지나면 이 상태를 버린다(rooms.mjs).
export const TREE_RULES=Object.freeze({slots:120,perMinute:3,windowMs:60000,perPerson:10,undoMs:60000,starUnlock:40,resetMs:5*60000});
export const ORNAMENTS=Object.freeze(['ballRed','ballGold','ballBlue','ballSilver','candy','bell','snowflake','gift']);
export const TREE_STEPS=Object.freeze([0,20,40,80,120]);
export const treeStage=count=>{let s=0;for(let i=1;i<TREE_STEPS.length;i++)if(count>=TREE_STEPS[i])s=i;return s;};
// 못 했을 때 화면 문구(체험설계 §5-1). wait = 남은 초
export const TREE_TEXT=Object.freeze({
 rate:w=>`장식은 1분에 3개까지 달 수 있어요${w?` · ${w}초 뒤`:''}`,
 mine:'내 장식은 트리에 10개까지 남길 수 있어요. 되돌리기로 하나 떼면 또 달 수 있어요',
 taken:'앗, 방금 다른 분이 달았어요',
 locked:`장식이 40개 모이면 별을 달 수 있어요`,
 nobonus:'선물 받은 오너먼트가 없어요',
 star:'별은 이미 달렸어요',
 undo:'되돌리기는 내가 단 장식만, 60초 안에만 할 수 있어요',
 bad:'그 자리에는 달 수 없어요',
 offline:'연결이 돌아오면 다시 눌러 주세요',
});

// 장식 한 줄: [자리, 종류, 단 사람 이름, 단 사람 id]
export function createTreeState({rules=TREE_RULES}={}){
 const slots=new Array(rules.slots).fill(null);let star=null;
 const recent=new Map(); // 사람 id → 최근 단 시각들(1분 창)
 const count=()=>slots.reduce((n,s)=>n+(s?1:0),0);
 const mine=id=>slots.reduce((n,s)=>n+(s&&s.id===id?1:0),0);
 // 가장 가까운 빈 자리(번호 차이로 — 자리는 아래에서 위로 나선 순서라 번호가 가까우면 높이도 가깝다)
 function nearestFree(slot){for(let d=1;d<rules.slots;d++)for(const i of [slot-d,slot+d])if(i>=0&&i<rules.slots&&!slots[i])return i;return null;}
 return {
  // 달기. 성공이면 {ok:true,slot,kind,name,id}, 아니면 {ok:false,reason,wait?,near?}
  // free: 선물로 받은 오너먼트(11-16 선물 우체통) — 1분 몫·내 장식 10개와 따로 단다(되돌리기 대상도 아님)
  put(id,name,slot,kind,t,{free=false}={}){
   if(!Number.isInteger(slot)||slot<0||slot>=rules.slots||!ORNAMENTS.includes(kind))return {ok:false,reason:'bad'};
   if(slots[slot])return {ok:false,reason:'taken',near:nearestFree(slot)};
   if(free){slots[slot]={k:kind,n:String(name??''),id:`gift:${id}`,at:t};return {ok:true,slot,kind,name:slots[slot].n,id,free:true};}
   const times=(recent.get(id)??[]).filter(x=>t-x<rules.windowMs);recent.set(id,times);
   if(times.length>=rules.perMinute)return {ok:false,reason:'rate',wait:Math.ceil((times[0]+rules.windowMs-t)/1000)};
   if(mine(id)>=rules.perPerson)return {ok:false,reason:'mine'};
   times.push(t);slots[slot]={k:kind,n:String(name??''),id,at:t};
   return {ok:true,slot,kind,name:slots[slot].n,id};
  },
  undo(id,slot,t){
   const s=Number.isInteger(slot)?slots[slot]:null;
   if(!s||s.id!==id||t-s.at>rules.undoMs)return {ok:false,reason:'undo'};
   slots[slot]=null;
   // 되돌린 장식은 1분 3개 셈에서도 뺀다(잘못 단 것을 고치는 데 몫을 쓰지 않게)
   const times=recent.get(id);if(times){const i=times.indexOf(s.at);if(i>=0)times.splice(i,1);}
   return {ok:true,slot};
  },
  putStar(id,name,t){
   if(star)return {ok:false,reason:'star'};
   if(count()<rules.starUnlock)return {ok:false,reason:'locked'};
   star={n:String(name??''),id,at:t};return {ok:true,name:star.n,id};
  },
  // 받은 것을 그대로 적기(화면 쪽: 서버가 정한 결과를 따름)
  set(slot,kind,name,id,t=0){if(Number.isInteger(slot)&&slot>=0&&slot<rules.slots&&ORNAMENTS.includes(kind))slots[slot]={k:kind,n:String(name??''),id:id??'',at:t};},
  // 서버가 판정한 내 장식도 1분 몫에 센다(화면의 '이번 1분 n개 남음'이 서버와 맞게)
  forgetRecent(id,at){const times=recent.get(id);if(times){const i=times.indexOf(at);if(i>=0)times.splice(i,1);}},
  noteRecent(id,t){const times=(recent.get(id)??[]).filter(x=>t-x<rules.windowMs);times.push(t);recent.set(id,times);},
  clearSlot(slot){if(Number.isInteger(slot)&&slot>=0&&slot<rules.slots)slots[slot]=null;},
  setStar(name,id=''){star=name==null?null:{n:String(name),id,at:0};},
  // 들어올 때 보내는 전체 상태 {t:'tree',s:[[자리,종류,이름,id]…],star:{n}|null}
  snapshot(){const s=[];slots.forEach((x,i)=>{if(x)s.push([i,x.k,x.n,x.id]);});return {t:'tree',s,star:star?{n:star.n}:null};},
  load(m){slots.fill(null);star=null;for(const r of Array.isArray(m?.s)?m.s:[]){if(Array.isArray(r))this.set(r[0],r[1],r[2],r[3]);}if(m?.star&&typeof m.star.n==='string')star={n:m.star.n,id:'',at:0};},
  reset(){slots.fill(null);star=null;recent.clear();},
  // 이 사람이 지금 더 달 수 있는 수(1분 몫·남길 몫 중 작은 것)와 다음 몫까지 남은 초
  quota(id,t){const times=(recent.get(id)??[]).filter(x=>t-x<rules.windowMs);const left=Math.max(0,Math.min(rules.perMinute-times.length,rules.perPerson-mine(id)));
   return {left,wait:times.length>=rules.perMinute?Math.ceil((times[0]+rules.windowMs-t)/1000):0,mine:mine(id)};},
  slot:i=>slots[i],get count(){return count();},get star(){return star;},get stage(){return treeStage(count());},
  mine,nearestFree,
  // 되돌릴 수 있는 내 마지막 장식(없으면 null)
  lastUndoable(id,t){let best=null;slots.forEach((s,i)=>{if(s&&s.id===id&&t-s.at<=rules.undoMs&&(!best||s.at>best.at))best={slot:i,at:s.at};});return best;},
 };
}
// 받은 트리 메시지 모양 검사(화면 쪽). 맞으면 정리한 값, 아니면 null.
export function sanitizeTreeMsg(m){
 if(!m||typeof m.t!=='string')return null;
 const okSlot=Number.isInteger(m.slot)&&m.slot>=0&&m.slot<TREE_RULES.slots;
 switch(m.t){
  case 'tree:set':return okSlot&&ORNAMENTS.includes(m.k)?{t:m.t,slot:m.slot,k:m.k,n:String(m.n??'').slice(0,24),id:String(m.id??''),...(m.g===1?{g:1}:{})}:null;
  case 'tree:del':return okSlot?{t:m.t,slot:m.slot}:null;
  case 'tree:star':return {t:m.t,n:String(m.n??'').slice(0,24),id:String(m.id??'')};
  case 'tree:no':return {t:m.t,reason:String(m.reason??'bad'),...(Number.isFinite(m.wait)?{wait:m.wait}:{}),...(Number.isInteger(m.near)?{near:m.near}:{}),...(okSlot?{slot:m.slot}:{})};
  case 'tree':return Array.isArray(m.s)?m:null;
 }
 return null;
}
