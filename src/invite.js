// 친구 부르기(접속 유도 1단계 ①, 11-19 월드개발 · 설계 docs/마케팅/접속유도-장치-설계-견적-v1.md §2-①). 세 체험 공통.
//  - 보내는 주소: 지금 체험 주소 + ?multi=<지금 서버 방>&utm_source=invite&utm_medium=share. 받은 사람은 같은 서버로 바로 들어온다(?multi= 옛 주소 흐름).
//    혼자 하는 중·내 컴퓨터 모드(서버 없음)면 ?multi= 없이 체험 주소만. 이름·위치·서버 주소(?server=)는 넣지 않는다.
//  - 지금 서버는 각 체험이 이미 보내는 '<체험>:multi-status' {state,room,transport} 이벤트로 안다(체험 코드는 건드리지 않음).
//  - 누르면 기기 공유 창(navigator.share) → 없거나 막히면 주소 복사 → 그것도 안 되면 주소를 보여 줌.
// 화면(☰ 메뉴 맨 위 한 줄)은 ui-frame.js가 그리고, 이 파일은 주소·글·보내기만 한다(노드 시험이 같이 쓴다).
import {SERVERS,findServer} from './multi-protocol.js';

export const INVITE_UTM=Object.freeze({utm_source:'invite',utm_medium:'share'});
const EVENT_OF=Object.freeze({hiking:'hiking:multi-status',smoking:'lounge:multi-status',christmas:'xmas:multi-status'});
// 보낼 글(초안 · 월드디자인·월드기획 확인 전)
const TITLE=Object.freeze({hiking:'온라인 등산',smoking:'온라인 흡연장',christmas:'온라인 크리스마스'});
const PLACE=Object.freeze({hiking:'관악산',smoking:'옥상',christmas:'눈마을'});

/** 서버 목록에 있는 서버의 방만 주소에 넣는다(아무 방 이름이나 퍼지지 않게). 1서버는 서버가 끝 번호를 뗀 이름(옥상)으로 알려 줘도 목록 이름(옥상-1)으로. 없으면 null */
export function inviteRoom(exp,room){return room&&SERVERS[exp]?findServer(exp,String(room))?.room??null:null;}
/** 상태 이벤트 → 지금 들어가 있는 서버 방(서버에 붙어 있을 때만) */
export function roomOfStatus(exp,d){
 if(!d||d.transport!=='server')return null;
 if(!['online','reconnecting'].includes(d.state)||d.joined===false)return null;
 return inviteRoom(exp,d.room);
}
/** 보낼 주소. href = 지금 페이지 주소(검색어·#는 버림) */
export function inviteUrl(href,{exp,room=null}={}){
 const u=new URL(href);u.search='';u.hash='';
 const r=inviteRoom(exp,room);if(r)u.searchParams.set('multi',r);
 for(const [k,v] of Object.entries(INVITE_UTM))u.searchParams.set(k,v);
 return u.href;
}
/** 보낼 글. 서버에 있으면 「○○ n서버」, 아니면 체험 이름만 */
export function inviteText(exp,room=null){
 const t=TITLE[exp]??'온라인 월드',s=inviteRoom(exp,room)?findServer(exp,String(room)):null;
 if(!s)return `${t} 같이 하자! 설치 없이 바로 들어와`;
 const n=s.name.match(/(\d+)서버$/)?.[1];
 return `나 지금 ${t} ${PLACE[exp]??''} ${n?n+'서버':s.name}! 설치 없이 바로 들어와`.replace(/\s+/g,' ');
}

/**
 * 보내기: 'shared'(공유 창) · 'copied'(복사) · 'shown'(주소를 보여 줌) · 'cancel'(공유 창에서 닫음).
 * nav·win은 시험에서 바꿔 끼운다.
 */
export async function shareInvite({url,text,title='',nav=globalThis.navigator,win=globalThis.window}={}){
 if(typeof nav?.share==='function'){
  const data={title,text,url};
  let ok=true;try{if(typeof nav.canShare==='function')ok=nav.canShare(data);}catch{ok=false;}
  if(ok){try{await nav.share(data);return 'shared';}catch(e){if(e?.name==='AbortError')return 'cancel';}}
 }
 try{if(nav?.clipboard?.writeText){await nav.clipboard.writeText(`${text} ${url}`);return 'copied';}}catch{}
 try{win?.prompt?.('이 주소를 복사해서 보내 주세요',url);}catch{}
 return 'shown';
}

/** 체험의 상태 이벤트를 듣고 지금 서버 방을 기억한다. room() → 방|null, 바뀌면 onChange(room) */
export function trackInviteRoom(exp,{win=globalThis.window,onChange=()=>{}}={}){
 let room=null;const ev=EVENT_OF[exp];
 if(ev)win?.addEventListener?.(ev,e=>{const r=roomOfStatus(exp,e.detail);if(r!==room){room=r;onChange(r);}});
 return {room:()=>room};
}
