// 세 체험 공통 입장(월드개발, 2026-11-19 입장 흐름 정리). 입장 화면은 공용 서버 고르기 창(server-pick.js) 하나뿐이다.
//  - 허브에서 서버(또는 혼자 하기)를 골라 왔으면(handoff.js sessionStorage) 창 없이 바로 그 서버로.
//  - 주소로 바로 들어왔으면 이 기기에 남은 지난 선택(ENTRY_KEY, 체험별)이 있으면 창 없이 바로, 없으면 창을 한 번 연다.
//  - 창·허브에서 고를 때마다(서버 바꾸기·나가서 혼자 하기 포함) 지난 선택을 새로 쓴다(server-pick.js가 rememberEntry를 부름).
//  - 이름은 허브 설정·창의 닉네임 칸이 같은 저장값(server-pick.js NAME_KEY)을 쓴다. 이름·서버 바꾸기는 게임 안 서버 창(함께 걷기·같이 피우기·서버 칩)에서.
//  - 지난 서버가 꽉 차서 거절되면 각 체험이 예전처럼 '방금 꽉 찼어요' 창을 연다. ?multi= 옛 주소('legacy')는 각 체험이 먼저 처리하므로 여기 값을 쓰지 않는다.
import {takeHubPick,applyHubPick} from './hub/handoff.js';
import {SERVERS} from './multi-protocol.js';

export const ENTRY_KEY='aoworld:entry:v1';
const ls=s=>{try{return s===undefined?globalThis.localStorage??null:s;}catch{return null;}};
const okServer=(exp,id)=>typeof id==='string'&&(SERVERS[exp]??[]).some(s=>s.id===id);
function readAll(storage){try{const v=JSON.parse(ls(storage)?.getItem(ENTRY_KEY)??'null');return v&&typeof v==='object'?v:{};}catch{return {};}}

/** 지난 선택 쓰기: {server:id} | {solo:true}. 모르는 서버 id면 쓰지 않는다. */
export function rememberEntry(exp,choice,storage,now=Date.now()){
 if(!exp||!choice)return false;
 const v=choice.solo?{solo:true,at:now}:okServer(exp,choice.server)?{server:choice.server,at:now}:null;if(!v)return false;
 const all=readAll(storage);all[exp]=v;
 try{ls(storage)?.setItem(ENTRY_KEY,JSON.stringify(all));return true;}catch{return false;}
}
/** 지난 선택 읽기 → {server}|{solo:true}|null */
export function lastEntry(exp,storage){
 const v=readAll(storage)[exp];if(!v)return null;
 if(v.solo===true)return {solo:true};
 return okServer(exp,v.server)?{server:v.server}:null;
}
export function forgetEntry(exp,storage){const all=readAll(storage);delete all[exp];try{ls(storage)?.setItem(ENTRY_KEY,JSON.stringify(all));}catch{}}

/** 이번 입장에 쓸 선택: 허브에서 고른 것 → 지난 선택 → null. from = 'hub'|'saved'. 허브 값은 꺼내면 지워진다. */
export function takeEntryChoice(exp,{mode='show',session,storage,now=Date.now()}={}){
 if(mode==='legacy')return null;
 const hub=takeHubPick(exp,session,now);if(hub)return {...hub,from:'hub'};
 const last=mode==='show'?lastEntry(exp,storage):null; // 점검 브라우저('skip')는 지난 선택을 쓰지 않는다(늘 같은 상태로 시험)
 return last?{...last,from:'saved'}:null;
}
/**
 * 입장: 선택이 있으면 창 없이 들어가고('join'|'solo'), 없거나 못 쓰면 창을 한 번 연다('open'). 'skip' 모드는 창을 열지 않는다(null).
 * pick = createServerPick 결과, choice = takeEntryChoice 결과(미리 꺼내 둔 값)
 */
export function enterWith(pick,choice,mode='show'){
 const done=applyHubPick(pick,choice);if(done)return done;
 if(mode==='show'||choice){pick.open({closable:false});return 'open';}
 return null;
}
