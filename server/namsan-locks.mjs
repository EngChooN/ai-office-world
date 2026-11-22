// 남산 사랑의 자물쇠 보관함(11-22, 월드개발). 파일·소켓 없음: 서버(multi-server.mjs)가 data-multi/namsan-locks.json을 읽어 넘기고,
// 바뀔 때마다 onChange()를 받아 파일에 쓴다. 방 로직(rooms.mjs)이 메시지를 받아 여기 함수를 부른다. 규칙 수치는 src/namsan/namsan-lock-rules.js.
// 저장 모양: {v:1,locks:[{id,slot(0~233|null=꾸러미),c,h,text,name,at,owner(기기 열쇠 해시),reports:[신고자 해시],hidden,movedAt}]}
//  - 걸기: 글 검사(개인정보 꼴·금칙어 → 거절, ***로 가리지 않음) → 개수 3·20초 간격·같은 곳 하루 10개 → 자리(요청 자리, 찼으면 번호가 가장 가까운 빈 자리,
//    빈 자리가 없으면 거는 사람 것이 아닌 가장 오래된 자물쇠를 꾸러미로 옮기고 그 자리) → 보관 3,000개를 넘으면 꾸러미·숨김에서 오래된 것부터 지움
//  - 신고: 자물쇠 하나에 같은 사람 한 번, 서로 다른 3명이면 숨김(자리를 비움). 신고한 사람의 목록에서는 바로 빠짐
//  - 떼기: 건 사람만. 운영자: hide·restore·remove·reported(scripts/namsan-locks-admin.mjs가 파일로 같은 일을 함)
// IP는 받지 않는다. 서버가 메모리에서만 만든 ipKey로 하루 한도만 센다(디스크에 안 씀).
import {createHash} from 'node:crypto';
import {LOCK_RULES,LOCK_REPORT_REASONS,checkLockText,isOwnerKey,isLockId} from '../src/namsan/namsan-lock-rules.js';

export const ownerHash=key=>isOwnerKey(key)?createHash('sha256').update('namsan-lock:'+key).digest('base64url').slice(0,22):null;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const COLORS=10;

// 파일 내용 → 고친 자물쇠 목록(깨진 줄은 버림, 같은 자리 두 번이면 늦은 것을 꾸러미로)
export function readLocks(data,R=LOCK_RULES){
 const raw=Array.isArray(data?.locks)?data.locks:[],out=[],taken=new Set(),ids=new Set();
 for(const l of raw){
  if(!l||!isLockId(l.id)||ids.has(l.id)||!finite(l.at)||typeof l.owner!=='string')continue;
  const slot=Number.isInteger(l.slot)&&l.slot>=0&&l.slot<R.slots?l.slot:null;
  const rec={id:l.id,slot,c:Number.isInteger(l.c)&&l.c>=0&&l.c<COLORS?l.c:0,h:l.h?1:0,text:typeof l.text==='string'?l.text.slice(0,200):'',name:typeof l.name==='string'?l.name.slice(0,24):'',at:l.at,owner:l.owner,
   reports:Array.isArray(l.reports)?[...new Set(l.reports.filter(r=>typeof r==='string'))]:[],hidden:!!l.hidden,movedAt:finite(l.movedAt)?l.movedAt:null,...(Number.isInteger(l.prevSlot)?{prevSlot:l.prevSlot}:{})};
  ids.add(rec.id);out.push(rec);
 }
 out.sort((a,b)=>a.at-b.at);
 for(const l of out){if(l.slot===null||l.hidden){l.slot=null;continue;}if(taken.has(l.slot)){l.slot=null;l.movedAt??=l.at;}else taken.add(l.slot);}
 return out;
}

export function createLockStore({now=()=>Date.now(),banned=[],initial=null,idGen=()=>'lk_'+Math.random().toString(36).slice(2,12).padEnd(8,'0'),onChange=()=>{},rules={}}={}){
 const R={...LOCK_RULES,...rules};
 let locks=readLocks(initial,R),bannedWords=[...banned];
 const lastBy=new Map(),ipLog=new Map();
 const changed=()=>{try{onChange();}catch{}};
 const byId=id=>locks.find(l=>l.id===id)??null;
 const railing=()=>locks.filter(l=>l.slot!==null&&!l.hidden);
 const pub=(l,owner=null)=>({id:l.id,slot:l.slot,c:l.c,h:l.h,text:l.text,name:l.name,at:l.at,...(owner&&l.owner===owner?{mine:true}:{})});
 const seenBy=(l,owner)=>!owner||!l.reports.includes(owner);

 function list(owner=null){
  const rail=railing().filter(l=>seenBy(l,owner)).map(l=>pub(l,owner));
  const bundle=locks.filter(l=>l.slot===null&&!l.hidden&&seenBy(l,owner)).length;
  return {locks:rail,bundle};
 }
 function bundlePage(page=0,owner=null){
  const all=locks.filter(l=>l.slot===null&&!l.hidden&&seenBy(l,owner)).sort((a,b)=>(b.movedAt??b.at)-(a.movedAt??a.at));
  const n=R.bundlePage,pages=Math.max(1,Math.ceil(all.length/n)),p=Math.max(0,Math.min(pages-1,Number.isInteger(page)?page:0));
  return {page:p,total:all.length,locks:all.slice(p*n,p*n+n).map(l=>pub(l,owner))};
 }
 // 자리 고르기: 요청 자리 → 번호가 가장 가까운 빈 자리 → 거는 사람 것이 아닌 가장 오래된 것을 꾸러미로
 function pickSlot(want,owner,t){
  const used=new Set(railing().map(l=>l.slot));
  const w=Number.isInteger(want)&&want>=0&&want<R.slots?want:0;
  if(!used.has(w))return {slot:w,moved:null};
  for(let d=1;d<R.slots;d++){for(const s of [w-d,w+d])if(s>=0&&s<R.slots&&!used.has(s))return {slot:s,moved:null};}
  const old=railing().filter(l=>l.owner!==owner).sort((a,b)=>a.at-b.at)[0];if(!old)return null;
  const slot=old.slot;old.slot=null;old.movedAt=t;return {slot,moved:old.id};
 }
 function trim(){
  const over=locks.length-R.keep;if(over<=0)return [];
  const gone=locks.filter(l=>l.slot===null).sort((a,b)=>(a.movedAt??a.at)-(b.movedAt??b.at)).slice(0,over).map(l=>l.id);
  locks=locks.filter(l=>!gone.includes(l.id));return gone;
 }
 /** 걸기 → {ok:true,lock(저장된 기록),moved,dropped} | {ok:false,code} */
 function hang({owner,ip='',name='',slot,c,h,text}){
  const t=now();if(!owner)return {ok:false,code:'bad'};
  if(!Number.isInteger(c)||c<0||c>=COLORS)return {ok:false,code:'bad'};
  const chk=checkLockText(typeof text==='string'?text.slice(0,R.textMax*8):'',bannedWords);if(!chk.ok)return {ok:false,code:chk.code};
  if(locks.filter(l=>l.owner===owner&&!l.hidden).length>=R.perOwner)return {ok:false,code:'limit'};
  if(t-(lastBy.get(owner)??-Infinity)<R.gapMs)return {ok:false,code:'rate'};
  const day=(ipLog.get(ip)??[]).filter(x=>t-x<86400e3);if(ip&&day.length>=R.ipPerDay)return {ok:false,code:'rate'};
  const at=pickSlot(slot,owner,t);if(!at)return {ok:false,code:'busy'};
  let id=idGen();while(byId(id))id=idGen();
  const rec={id,slot:at.slot,c,h:h?1:0,text:chk.text,name:String(name??'').slice(0,24),at:t,owner,reports:[],hidden:false,movedAt:null};
  locks.push(rec);lastBy.set(owner,t);if(ip){day.push(t);ipLog.set(ip,day);}
  const dropped=trim();changed();
  return {ok:true,lock:rec,moved:at.moved,dropped};
 }
 /** 떼기(건 사람만) */
 function remove({owner,id}){const l=byId(id);if(!l||!owner||l.owner!==owner)return {ok:false};locks=locks.filter(x=>x!==l);changed();return {ok:true,id,slot:l.slot};}
 /** 신고 → {ok,hidden(이번에 숨겨짐),lock} */
 function report({reporter,id,reason}){
  const l=byId(id);if(!l||!reporter||l.owner===reporter||!LOCK_REPORT_REASONS.includes(reason))return {ok:false};
  if(l.reports.includes(reporter))return {ok:true,hidden:false,lock:l,again:true};
  l.reports.push(reporter);let hid=false;
  if(!l.hidden&&l.reports.length>=R.reportHide){l.hidden=true;if(l.slot!==null)l.prevSlot=l.slot;l.slot=null;hid=true;}
  changed();return {ok:true,hidden:hid,lock:l};
 }
 // 운영자
 function hide(id){const l=byId(id);if(!l)return null;const was=l.slot;l.hidden=true;if(l.slot!==null)l.prevSlot=l.slot;l.slot=null;changed();return {lock:l,was};}
 function restore(id){const l=byId(id);if(!l)return null;l.hidden=false;l.reports=[];const used=new Set(railing().map(x=>x.slot));
  l.slot=Number.isInteger(l.prevSlot)&&!used.has(l.prevSlot)?l.prevSlot:null;if(l.slot===null)l.movedAt??=now();delete l.prevSlot;changed();return {lock:l};}
 const reported=()=>locks.filter(l=>l.reports.length||l.hidden).map(l=>({...l}));
 const replace=data=>{locks=readLocks(data,R);};
 return {list,bundlePage,hang,remove,report,hide,restore,reported,replace,pub,
  setBanned:w=>{bannedWords=[...w];},
  get size(){return locks.length;},all:()=>locks.map(l=>({...l})),toJSON:()=>({v:1,locks:locks.map(l=>({...l}))}),rules:R};
}
