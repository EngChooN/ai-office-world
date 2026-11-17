// 온라인 크리스마스 — 광장 실시간 멀티(월드개발, 2026-11-16). 흡연장 같이 피우기(src/lounge/multi.js)와 같은 전송·규격을 쓴다.
//  - 서버 주소가 있으면 WebSocket {experience:'christmas'}(방 `christmas:눈마을`, 정원 30), 없으면 BroadcastChannel(같은 브라우저 창끼리).
//  - 위치 s: 움직이면 10Hz, 서 있으면 1초에 한 번. 행동 상태 act {o 옷, hat 모자, sc 목도리, d 트리 꾸미는 중}은 바뀔 때만(서버가 기억해 나중에 온 사람에게도 줌).
//  - 채팅: 공용 채팅 창(src/hiking-chat-ui.js, ns 'xmas')과 'xmas:chat-send' → {t:'c'}, 받은 c → 'xmas:chat'. 제한은 'xmas:chat-limit' {reason,wait}.
//  - 트리: tree·tree:set·tree:del·tree:star·tree:no를 onTree(m)로 넘긴다(판정은 서버, 화면 쪽은 tree-play.js).
//  - 음소거(체험설계 §8-3, 대표 결정 11-16: 완전히 숨기기): 그 사람의 몸·이름표·말풍선·채팅을 내 화면에서 모두 지운다. 상대에게 알리지 않는다. 이 기기에 저장.
//  - 다른 사람 몸: 가까운 cap명은 동동이(크리스마스 옷), 나머지는 가벼운 동동이(lite.js, 휴대폰 광장 20명 대책).
//  - 놀이(11-16 2차): 선물·눈사람·눈싸움·썰매 메시지(PLAY_TYPES)는 onPlay(m)로 넘긴다. 보내기는 sendPlay(m)(서버 모드만, 혼자·내 컴퓨터 모드는 play-net.js가 직접 판정).
//    act의 놀이 칸(st 모닥불 자리·sl 썰매·wm·cc·pu·pk)은 ctx.attachPoser가 준 자세(poses.js)로 상대 몸에 그린다.
// 화면(상태 칩·이름표·사람 목록)은 hud.js. 이 파일과는 'xmas:multi-status'·'xmas:multi-note' 이벤트와 반환 객체로 만난다.
import {createWebSocketTransport,createBroadcastTransport,multiServerUrl,createBackgroundTimer} from '../multi-transport.js';
import {anonymousName,sanitizeName,createInterpolator,decodeState,FLAG,NET,findServer,PRESENCE,createPresence,sanitizeAct,createModeration,REPORT_REASONS,serverMax} from '../multi-protocol.js';
import {sanitizeTreeMsg} from './tree-state.js';
import {applyXmasAct} from './poses.js';

// 놀이 메시지(서버 → 화면). room-play.js 규격
export const PLAY_TYPES=Object.freeze(['gift','gift:ok','gift:no','gift:post','board','snow','snow:ball','snow:gone','snow:done','snow:no','sb','sbh','sb:no','sled:ask','sled:ok','sled:no','seat:no','sled:busy','ride:no','sr','sr:board','sr:no','sc','sc:no','sbm','sbm:no']);

export const DEFAULT_ROOM='눈마을-1';
export const EXPERIENCE='christmas';
export const XMAS_MULTI=Object.freeze({
 sendHz:NET.sendHz,idleSend:1,announce:3,timeout:6,jumpDist:1.2,
 cap:Object.freeze({desktop:29,mobile:6}), // 동동이 몸으로 그리는 다른 사람 수(나머지는 가벼운 동동이). 광장 정원 30(11-17 대표 결정) = 나 + 29
 keep:2,spare:2, // 5차: 동동이였던 사람은 순위 cap+keep 안이면 그대로 · 만들어 두는 몸은 cap+spare개까지(넘으면 먼 사람 몸을 넘겨받음)
});
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const OUTFIT_IDS=['santa','sweater','elf'];
// 옷을 아직 못 받은 사람: ID로 정해지는 옷(같은 사람은 어느 화면에서나 같은 옷)
export const fallbackLook=id=>({outfit:OUTFIT_IDS[hash(id)%OUTFIT_IDS.length],hat:null,scarf:null});
// act → 차림
export const lookOfAct=(a,id)=>a?.o?{outfit:a.o,hat:a.hat||null,scarf:a.sc?'stripe':null}:fallbackLook(id);
export const cleanRoom=raw=>{const s=[...String(raw??'').normalize('NFC').replace(/[^0-9A-Za-z가-힣_-]/g,'')].slice(0,24).join('');return s||DEFAULT_ROOM;};
export const cleanName=raw=>[...String(raw??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f]/g,'').replace(/\s+/g,' ').trim()].slice(0,NET.nameMax).join('').trim();
export function multiParams(search='',envUrl=''){
 const q=new URLSearchParams(search);
 return {auto:q.has('multi'),room:cleanRoom(q.get('multi')),name:q.has('name')?cleanName(q.get('name')):null,server:multiServerUrl(search,envUrl)};
}
// 상태 칩 글(체험설계 §3-4). tone: wait·ok·local·warn·bad, ic: 아이콘 이름(아이콘-규칙-v1 §7-1 마). text 속 👥는 hud가 c-people 아이콘으로 그림(aria-label에는 글 그대로)
export function xmasStatusView(d={}){
 const n=Math.max(0,Number(d.count)||0),max=d.max||serverMax(EXPERIENCE),srv=d.room?findServer(EXPERIENCE,d.room):null,where=srv?.name??(d.room?`방 ${d.room}`:'');
 switch(d.state){
  case 'connecting':return {tone:'wait',ic:'c-net-connecting',text:'연결 중…',sub:where};
  case 'online':return d.transport==='local'?{tone:'local',ic:'c-net-local',text:`내 컴퓨터 모드 · 👥 ${n||1}`,sub:'서버 없음 · 이 브라우저 창끼리만'}
   :{tone:'ok',ic:'c-net-ok',text:`${where} · 👥 ${n||1}/${max}`,sub:''};
  case 'reconnecting':return {tone:'warn',ic:'c-net-retry',text:'다시 연결 중…',sub:'걸어 다닐 수는 있어요'};
  case 'offline':return {tone:'bad',ic:'c-net-lost',text:'혼자 보기 · 다시 연결',sub:'눌러서 다시 연결해요'};
  case 'full':return {tone:'warn',ic:'c-net-full',text:'방금 꽉 찼어요',sub:'다른 서버를 골라 주세요'};
  default:return {tone:'solo',ic:'c-person',text:'혼자 둘러보기',sub:'눌러서 광장 서버에 들어가요'};
 }
}

// ctx: {world, player, profile, mobile, heightAt, createAvatar({look,id,name}) async, createLite(look) → {root,setLook,dispose}, attachPoser(avatar) → poses.js 자세}
export function createXmasMulti({ctx,search=globalThis.location?.search??'',envUrl='',win=globalThis.window,storage=globalThis.localStorage,
 myAct=()=>null,onTree=()=>{},onPlay=()=>{},
 makeTransport=o=>o.server?createWebSocketTransport(o.server,{experience:EXPERIENCE,room:o.room,name:o.name}):createBroadcastTransport(o.room,undefined,{experience:EXPERIENCE}),
 now=()=>performance.now()/1000,heartbeat=fn=>createBackgroundTimer(fn,PRESENCE.heartbeatMs)}={}){
 const params=multiParams(search,envUrl);
 const cap=ctx.mobile?XMAS_MULTI.cap.mobile:XMAS_MULTI.cap.desktop;
 const moderation=createModeration({storage,key:'xmas-moderation'});
 const roster=new Map(); // id → {id,name,tagHidden,interp,lastSeen,flags,act,avatar,lite,loading,sample,shown,full}
 let transport=null,viaServer=false,joined=false,netState='offline',room=params.room,myId=null,myName='',maxHere=serverMax(EXPERIENCE);
 let presence=createPresence({timeout:XMAS_MULTI.timeout}),beat=null,lastAnnounceAt=-Infinity,lastGreet=-Infinity;
 let lastAct='',seq=0,sendT=0,lastSent=null,lastSentAt=-Infinity,announceT=0,assignT=0,jumpNext=false,statusSig='',offMsg=null,offStatus=null;
 const stats={sent:0,received:0,chatsSent:0,chatsReceived:0,chatsMuted:0,actsSent:0,actsReceived:0,tree:0,play:0,spawned:0,reused:0,lite:0};
 const dispatch=(type,detail)=>win?.dispatchEvent?.(new CustomEvent(type,{detail}));
 const send=m=>{if(!transport)return;stats.sent++;transport.send(m);};
 const online=()=>joined&&(!viaServer||netState==='online');
 const muted=id=>moderation.isBlocked(id);
 const nameOf=r=>r&&!r.tagHidden&&r.name?r.name:anonymousName(r?.id??'',EXPERIENCE);
 const visible=r=>r.lastSeen>0&&!muted(r.id);

 function emitStatus(force=false){
  const detail={state:joined?netState:'off',room,count:online()?[...roster.values()].filter(r=>r.lastSeen>0).length+1:0,max:maxHere,transport:viaServer?'server':'local',joined};
  const sig=JSON.stringify(detail);if(!force&&sig===statusSig)return;statusSig=sig;dispatch('xmas:multi-status',detail);
 }

 function join({room:roomArg,name}={}){
  if(joined)leave(true);
  room=cleanRoom(roomArg??room);
  const want=cleanName(name??'')||cleanName(ctx.profile?.nickname);
  myId=Math.random().toString(36).slice(2,10);
  myName=sanitizeName(want,anonymousName(myId,EXPERIENCE));
  transport=makeTransport({server:params.server,room,name:want});
  viaServer=transport.kind==='server';netState=viaServer?transport.status??'connecting':'online';joined=true;
  presence=createPresence({timeout:viaServer?PRESENCE.serverTimeout:XMAS_MULTI.timeout});
  beat=heartbeat(()=>{if(!online())return;const t=now();if(t-lastSentAt>=PRESENCE.heartbeatMs/1000)sendPos(true);if(t-lastAnnounceAt>=XMAS_MULTI.announce)announce();});
  offStatus=viaServer&&transport.onstatus?transport.onstatus((st,info)=>{netState=st;if(info?.max)maxHere=info.max;
   if(st!=='online')for(const id of [...roster.keys()])drop(id);if(st==='online')greet();emitStatus();}):null;
  offMsg=transport.onmessage(onMessage);
  dispatch('xmas:multi-join',{});
  if(!viaServer)greet();
  emitStatus(true);return true;
 }
 function leave(silent=false){
  if(!joined)return false;
  try{transport?.send({t:'b',id:myId});}catch{}
  beat?.stop();beat=null;offMsg?.();offStatus?.();try{transport?.close();}catch{}
  transport=null;joined=false;netState='offline';
  for(const id of [...roster.keys()])drop(id);
  dispatch('xmas:multi-leave',{});
  if(!silent)emitStatus(true);return true;
 }
 function greetNew(){const t=now();if(t-lastGreet<.3)return;lastGreet=t;announce();sendPos(true);if(!viaServer)sendAct(true);}
 function greet(){announce();jumpNext=true;sendPos(true);sendAct(true);}
 function announce(){announceT=0;lastAnnounceAt=now();send({t:'j',id:myId,n:myName});}

 function entry(id){
  let r=roster.get(id);if(r)return r;
  if(roster.size>=NET.maxRoster)return null;
  r={id,name:'',tagHidden:false,interp:createInterpolator(),lastSeen:0,flags:0,act:null,avatar:null,lite:null,loading:false,sample:null,shown:false,full:false,snap:true,lookSig:''};
  roster.set(id,r);greetNew();return r;
 }
 function drop(id){
  const r=roster.get(id);if(!r)return;roster.delete(id);r.dead=true;
  if(r.avatar)ctx.world.remove(r.avatar.root);r.poser?.dispose?.();if(r.lite){ctx.world.remove(r.lite.root);r.lite.dispose?.();}
  emitStatus();
 }
 function onMessage(m){
  stats.received++;if(!m||!joined)return;
  switch(m.t){
   case 'welcome':myId=m.id;room=m.room??room;myName=m.name||myName;if(transport?.info?.max)maxHere=transport.info.max;emitStatus();return;
   case 'moved':room=m.room??room;for(const id of [...roster.keys()])drop(id);dispatch('xmas:multi-note',{text:'다른 광장으로 옮겼어요'});emitStatus();return;
   case 'reject':dispatch('xmas:multi-note',{text:'서버가 크리스마스 연결을 받지 않았어요'});return;
   case 'c-limit':dispatch('xmas:chat-limit',{reason:['repeat','mute'].includes(m.reason)?m.reason:'rate',wait:Number.isFinite(m.wait)?m.wait:0});return;
   case 'report-ok':return;
   case 'c':{if(typeof m.text!=='string'||!m.text||typeof m.id!=='string')return;
    if(muted(m.id)){stats.chatsMuted++;return;}
    const me=m.id===myId,r=roster.get(m.id);stats.chatsReceived++;
    dispatch('xmas:chat',{id:m.id,name:me?myName:nameOf(r??{id:m.id}),text:m.text,me,remote:true});return;}
   case 'gift':case 'gift:ok':case 'gift:no':case 'gift:post':case 'board':case 'snow':case 'snow:ball':case 'snow:gone':case 'snow:done':case 'snow:no':
   case 'sb':case 'sbh':case 'sb:no':case 'sled:ask':case 'sled:ok':case 'sled:no':case 'seat:no':case 'sled:busy':case 'ride:no':
   case 'sr':case 'sr:board':case 'sr:no':case 'sbm':case 'sbm:no': // 11-17 썰매 레이스·눈싸움 한 판
    // 내 컴퓨터 모드(BroadcastChannel)는 다른 창이 판정한 결과를 그대로 받는다. to가 있으면 그 사람에게만
    if(!viaServer&&m.to&&m.to!==myId)return;
    stats.play++;onPlay(m);return;
   case 'tree':case 'tree:set':case 'tree:del':case 'tree:star':case 'tree:no':{
    const v=sanitizeTreeMsg(m);if(!v)return;stats.tree++;
    // 음소거한 사람이 단 장식도 트리에는 남는다(트리는 모두의 것). 이름 글자만 숨긴다.
    if((v.t==='tree:set'||v.t==='tree:star')&&muted(v.id))v.n='';
    onTree({...v,mine:v.id===myId});return;}
  }
  if(m.id===myId||typeof m.id!=='string')return;
  const t=now();
  if(m.t==='b'){drop(m.id);return;}
  if(m.t==='j'){const r=entry(m.id);if(!r)return;r.name=sanitizeName(m.n,anonymousName(m.id,EXPERIENCE));r.tagHidden=!!m.h;r.lastSeen=t;if(r.avatar)r.avatar.name=nameOf(r);emitStatus();return;}
  if(m.t==='s'){const d=decodeState(m);if(!d)return;const r=entry(d.id);if(!r)return;
   const isNew=!r.lastSeen;r.lastSeen=t;r.flags=d.flags;
   if(d.flags&FLAG.jump){r.interp=createInterpolator();r.snap=true;}
   r.interp.push(t,d);if(isNew)emitStatus();return;}
  if(m.t==='act'){const a=sanitizeAct(EXPERIENCE,m.a);if(!a)return;const r=entry(m.id);if(!r)return;stats.actsReceived++;r.act=a;if(!r.lastSeen)r.lastSeen=t;applyLook(r);applyXmasAct(r.poser,a);return;}
 }

 // ── 보내기
 const onChatSend=e=>{
  const text=String(e.detail?.text??'').slice(0,400).trim();if(!text||!joined)return;
  if(!online()){dispatch('xmas:chat-limit',{reason:'offline'});return;}
  stats.chatsSent++;send({t:'c',id:myId,text});
 };
 win?.addEventListener?.('xmas:chat-send',onChatSend);
 function sendAct(force=false){
  const a=myAct();if(!a||!online())return;const sig=JSON.stringify(a);if(!force&&sig===lastAct)return;
  lastAct=sig;stats.actsSent++;send({t:'act',id:myId,a});
 }
 function sendPos(force=false){
  if(!online())return;
  const p=ctx.player,t=now();
  const moved=lastSent?Math.hypot(p.x-lastSent.x,p.z-lastSent.z):Infinity,turned=lastSent?Math.abs(Math.atan2(Math.sin(p.heading-lastSent.h),Math.cos(p.heading-lastSent.h))):Infinity;
  if(!force&&moved<.01&&turned<.02&&t-lastSentAt<XMAS_MULTI.idleSend)return;
  // 순간이동 표시(받는 쪽이 보간을 끊고 바로 옮김)는 걷기·썰매·케이블카로 갈 수 없는 거리만. 케이블카(act.gd)는 건너뛰기 때 약 70m/s, 썰매는 12m/s까지(11-17 2차)
  const a=myAct?.()??{},vmax=a.gd?90:a.sl>=5?14:3;
  const elapsed=Math.max(.05,t-lastSentAt),jump=jumpNext||(lastSent&&moved>XMAS_MULTI.jumpDist+vmax*elapsed);
  let f=0;if(p.running)f|=FLAG.run;if(jump)f|=FLAG.jump;
  jumpNext=false;seq=(seq+1)&0xffff;
  const r2=v=>Math.round(v*100)/100;
  send({t:'s',id:myId,q:seq,z:0,x:r2(p.x),y:r2(p.z),h:r2(p.heading),v:r2(p.speed??0),f});
  lastSent={x:p.x,z:p.z,h:p.heading};lastSentAt=t;
 }
 // 트리 요청. 보냈으면 true, 연결이 없거나 다시 연결 중이면 false(누른 것은 버린다 — 중복 방지, 체험설계 §3-4)
 function sendTree(m){if(!online())return false;send({...m,id:myId});return true;}
 // 놀이 요청(서버 모드). 보냈으면 true, 연결이 없으면 false(누른 것은 버림)
 function sendPlay(m){if(!online()||!viaServer)return false;send({...m,id:myId});return true;}
 // 내 컴퓨터 모드: 이 창이 판정한 결과를 다른 창에 알린다(to = 받을 사람만)
 function relayLocal(m){if(!online()||viaServer)return false;send({...m,id:m.id??myId});return true;}

 // ── 다른 사람 몸
 async function spawn(r){
  r.loading=true;
  const look=lookOfAct(r.act,r.id);
  const a=await ctx.createAvatar({look,id:`p:${r.id}`,name:nameOf(r)});
  if(r.dead||!roster.has(r.id)){r.loading=false;return;}
  a.root.visible=false;ctx.world.add(a.root);r.avatar=a;r.loading=false;r.snap=true;r.lookSig=JSON.stringify(look);stats.spawned++;
  r.poser=ctx.attachPoser?.(a)??null;applyXmasAct(r.poser,r.act);
  applyLook(r);
 }
 function liteOf(r){
  if(!r.lite&&ctx.createLite){r.lite=ctx.createLite(lookOfAct(r.act,r.id));r.lite.root.visible=false;ctx.world.add(r.lite.root);stats.lite++;}
  return r.lite;
 }
 function applyLook(r){
  const look=lookOfAct(r.act,r.id),sig=JSON.stringify(look);
  if(r.avatar&&sig!==r.lookSig){r.avatar.setLook(look);r.lookSig=sig;}
  r.lite?.setLook(look);
 }
 // 동동이 몸 배정(0.5초마다). 11-17 5차: 사람이 몰려 움직이면 「가까운 cap명」이 계속 바뀌어 몸을 새로 만들고(무거움) 쌓아 두던 것을
 //  ① 이미 동동이인 사람은 순위가 cap+keep 안이면 그대로 둠(조금 바뀌는 순위로 바꾸지 않음) ② 만들어 둔 몸은 budget개까지, 넘으면 먼 사람의 몸을 넘겨받아 씀
 function assign(){
  const p=ctx.player,dist=r=>Math.hypot(r.sample.x-p.x,r.sample.z-p.z);
  const list=[...roster.values()].filter(r=>r.sample&&visible(r)).sort((a,b)=>dist(a)-dist(b));
  const keep=list.filter((r,i)=>r.full&&i<cap+XMAS_MULTI.keep).slice(0,cap),full=new Set(keep);
  for(const r of list){if(full.size>=cap)break;full.add(r);}
  for(const r of roster.values())r.full=full.has(r);
  const budget=cap+XMAS_MULTI.spare,built=()=>[...roster.values()].filter(o=>o.avatar||o.loading).length;
  for(const r of full){if(r.avatar||r.loading)continue;if(built()<budget||!steal(r,dist))spawn(r);}
 }
 // 먼(동동이가 아닌) 사람의 몸을 r에게 넘김(옷·자세만 바꿈). 넘길 몸이 없으면 false
 function steal(r,dist){
  const donor=[...roster.values()].filter(o=>o!==r&&o.avatar&&!o.full&&!o.loading).sort((a,b)=>(b.sample?dist(b):1e9)-(a.sample?dist(a):1e9))[0];
  if(!donor)return false;
  const a=donor.avatar;donor.poser?.dispose?.();donor.avatar=null;donor.poser=null;donor.lookSig=null;
  a.root.visible=false;r.avatar=a;r.snap=true;r.lookSig=null;r.poser=ctx.attachPoser?.(a)??null;applyXmasAct(r.poser,r.act);applyLook(r);stats.reused++;
  return true;
 }
 function drive(r,dt){
  let s=r.sample;const show=visible(r)&&!!s;
  // 썰매 뒷자리(act.sl 5): 이 화면에 그려진 앞사람 바로 뒤(0.54m)에 붙여 그린다. 각자 받은 위치를 쓰면 지연만큼 뒤쪽 언덕 위에 떠 보인다
  if(show&&r.act?.sl===5&&r.act.sp){const f=r.act.sp===myId?ctx.player:roster.get(r.act.sp)?.sample;
   if(f)s={...s,x:f.x+Math.sin(f.heading)*.54,z:f.z+Math.cos(f.heading)*.54,heading:f.heading,moving:false};}
  // 회전목마(act.mg): 받은 위치 대신 이 화면의 같은 번호 루돌프 위(ctx.rideAt, 시안 B에서만). 회전 시각이 화면마다 달라도 루돌프에서 떨어져 보이지 않게
  const ride=show&&r.act?.mg?ctx.rideAt?.(r.act)??null:null;
  if(ride)s={...s,x:ride.x,z:ride.z,heading:ride.heading,moving:false};
  // 몸이 아직 없거나(읽는 중) 먼 사람이면 가벼운 동동이
  const useFull=show&&r.full&&!!r.avatar,useLite=show&&!useFull;
  // 케이블카(act.gd): 높이는 케이블 선에서(ctx.gondolaY), 아니면 땅
  const gy=show?(ride?ride.y:r.act?.gd&&ctx.gondolaY?ctx.gondolaY(s.x,s.z):ctx.heightAt(s.x,s.z)):0;
  r.shown=show;
  if(r.avatar)r.avatar.root.visible=useFull;
  if(useLite){const l=liteOf(r);if(l){l.root.visible=true;l.root.position.set(s.x,gy+(r.act?.sl>=1?.18:r.act?.st||ride?.12:0),s.z);l.root.rotation.y=s.heading;l.update?.(dt,s.moving&&!(r.act?.sl>=1));}}
  else if(r.lite)r.lite.root.visible=false;
  if(!useFull)return;
  const a=r.avatar;
  // 땅 높이는 더한다(앉기 자세가 root y를 바닥 0 기준으로 올려 둔다, poses.js)
  if(r.snap){a.place(s.x,s.z,s.heading);r.snap=false;a.update(0,{moved:0});a.root.position.y+=gy;return;}
  const moved=Math.hypot(s.x-a.x,s.z-a.z),seated=!!(r.act?.st||r.act?.sl>=1||r.act?.gd||ride);
  a.x=s.x;a.z=s.z;if(moved>1e-3||!s.moving||seated)a.heading=s.heading;
  // 썰매·자리에 앉아 움직이면 걷는 다리 동작 없이 미끄러진다
  // 아이스링크 위(시안 B, ctx.strideAt)는 보폭을 줄여 미끄러지듯
  a.update(dt,{moved:seated?0:moved*(ctx.strideAt?.(s.x,s.z)??1),running:!!(r.flags&FLAG.run)});a.root.position.y+=gy;
 }

 return {
  get joined(){return joined;},get state(){return joined?netState:'off';},get room(){return room;},get id(){return myId;},get name(){return myName;},
  get server(){return params.server;},get params(){return params;},get viaServer(){return viaServer;},get online(){return online();},get max(){return maxHere;},
  join,leave,sendTree,sendPlay,relayLocal,moderation,
  // 다른 사람 동동이·자세·지금 자리(놀이 모듈이 던지기 동작·눈투성이·썰매를 그릴 때)
  avatarOf(id){const r=roster.get(id);return r?.full&&r.avatar&&r.shown?r.avatar:null;},
  poserOf(id){const r=roster.get(id);return r?.full&&r.shown?r.poser??null:null;},
  sampleOf(id){const r=roster.get(id);return r&&visible(r)?r.sample:null;},
  nameOf(id){const r=roster.get(id);return id===myId?myName:r?nameOf(r):anonymousName(id,EXPERIENCE);},
  // 음소거·풀기·신고(신고하면 음소거도 함께, 서버 모드면 서버에도 보냄)
  mute(id){const r=roster.get(id);moderation.block(id,r?nameOf(r):id);emitStatus(true);},
  unmute(id){moderation.unblock(id);emitStatus(true);},
  report(id,reason=REPORT_REASONS[1]){const r=roster.get(id);moderation.report({id,name:r?nameOf(r):id,reason},Date.now());if(viaServer&&online())send({t:'report',id:myId,to:id,reason});emitStatus(true);},
  isMuted:muted,
  mutedList(){return moderation.data.blocked;},
  // 머리 위 화면 자리(말풍선·이름표). id = 서버 id(내 글이면 내 id)
  headOf(id){
   if(id===myId||id==='me')return {kind:'me'};
   const r=roster.get(id);if(!r||!r.shown)return null;
   if(r.full&&r.avatar)return {kind:'avatar',avatar:r.avatar};
   return r.lite?{kind:'lite',lite:r.lite}:null;
  },
  people(){return [...roster.values()].filter(r=>r.lastSeen>0).map(r=>({id:r.id,name:nameOf(r),muted:muted(r.id),shown:r.shown,full:r.full&&!!r.avatar,sample:r.sample,act:r.act,decorating:!!r.act?.d}));},
  update(dt){
   if(!joined)return;
   const t=now();
   sendT+=dt;if(sendT>=1/XMAS_MULTI.sendHz){sendT=0;sendPos();}
   sendAct();
   announceT+=dt;if(announceT>=XMAS_MULTI.announce&&online())announce();
   assignT-=dt;if(assignT<=0){assignT=.5;assign();}
   presence.frame(t);
   for(const r of [...roster.values()]){
    if(r.lastSeen&&presence.expired(r.lastSeen,t)){drop(r.id);continue;}
    r.sample=r.interp.sample(t)??r.sample;
    drive(r,dt);
   }
   emitStatus();
  },
  status(){return {joined,state:joined?netState:'off',transport:viaServer?'server':'local',room,id:myId,name:myName,max:maxHere,server:params.server,cap,
   people:[...roster.values()].map(r=>({id:r.id,name:nameOf(r),muted:muted(r.id),shown:r.shown,body:!r.shown?'none':r.full&&r.avatar?'dongdong':r.lite?.root.visible?'lite':'none',look:lookOfAct(r.act,r.id),x:r.sample?+r.sample.x.toFixed(2):null,z:r.sample?+r.sample.z.toFixed(2):null})),stats:{...stats}};},
  dispose(){leave(true);win?.removeEventListener?.('xmas:chat-send',onChatSend);},
 };
}
