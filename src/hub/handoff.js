// 허브에서 고른 서버를 체험 페이지로 넘기기(11-17 허브 개선, 대표 확정 「서버 고르기는 허브에서 바로」).
// 허브 「n서버로 들어가기」·「혼자 하기」를 누르면 sessionStorage `aoworld:hub-pick` = {exp, server|solo, at}를 쓰고 체험으로 간다.
// 체험 페이지는 처음 불릴 때 takeHubPick으로 한 번만 꺼내고(꺼내면 지움) 서버 고르기 창 대신 바로 그 서버로 들어가거나 혼자 한다.
//  - 주소창에 붙이지 않는다: 복사해 보낸 링크·새로고침·직접 들어온 사람은 예전처럼 서버 고르기 창을 본다(기존 흐름 그대로).
//  - 서버가 꽉 차서 거절되면 체험 쪽이 예전처럼 '방금 꽉 찼어요' 창을 띄운다. 체험이 서버 주소를 못 찾으면 창을 띄운다.
//  - 10분 넘게 묵은 값·다른 체험 값은 버린다. ?multi= 옛 주소는 체험이 먼저 처리하므로 여기 값을 쓰지 않는다.
export const HANDOFF_KEY='aoworld:hub-pick';
export const HANDOFF_TTL_MS=10*60*1000;
const ss=s=>{try{return s===undefined?globalThis.sessionStorage??null:s;}catch{return null;}};

export function writeHubPick({exp,server=null,solo=false},storage,now=Date.now()){
 const st=ss(storage);if(!exp)return false;
 const v=solo?{exp,solo:true,at:now}:server?{exp,server:String(server),at:now}:null;
 try{if(v)st?.setItem(HANDOFF_KEY,JSON.stringify(v));else st?.removeItem(HANDOFF_KEY);return !!v;}catch{return false;}
}
/** 이 체험 몫이면 {solo:true}|{server:id}, 아니면 null. 읽으면 늘 지운다(두 번 쓰이지 않게). */
export function takeHubPick(exp,storage,now=Date.now()){
 const st=ss(storage);let raw=null;
 try{raw=st?.getItem(HANDOFF_KEY)??null;if(raw!=null)st.removeItem(HANDOFF_KEY);}catch{return null;}
 if(raw==null)return null;
 let v=null;try{v=JSON.parse(raw);}catch{return null;}
 if(!v||v.exp!==exp||!Number.isFinite(v.at)||now-v.at>HANDOFF_TTL_MS||v.at-now>60000)return null;
 if(v.solo===true)return {solo:true};
 return typeof v.server==='string'&&/^[\w-]{1,16}$/.test(v.server)?{server:v.server}:null;
}
/**
 * 서버 고르기 창(createServerPick 결과)에 허브 선택을 적용한다. 적용했으면 'join'|'solo', 못 했으면 null(→ 호출한 쪽이 창을 연다).
 * 서버 주소가 없는데(pick.url 없음) 서버를 골라 왔으면 창을 띄워 '연결할 수 없어요'를 보게 한다.
 */
export function applyHubPick(pick,choice){
 if(!pick||!choice)return null;
 if(choice.solo){pick.solo();return 'solo';}
 if(!pick.url||!pick.state?.rows?.some(r=>r.id===choice.server))return null;
 pick.join(choice.server);return 'join';
}
