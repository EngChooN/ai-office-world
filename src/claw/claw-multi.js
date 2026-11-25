// 온라인 인형뽑기 — 같은 가게 다른 손님(월드개발, 2026-11-23). 크리스마스 광장 multi.js와 같은 전송·규격을 쓴다(서버 코드는 체험 목록만 늘림).
//  - 서버 주소가 있으면 WebSocket {experience:'claw'}(방 `claw:인형가게`, 정원 = 기본 30), 없으면 BroadcastChannel(같은 브라우저 창끼리).
//  - 위치 s: 움직이면 10Hz, 서 있으면 1초에 한 번. 행동 상태 act(m 기계·ph 단계·cx/cz 집게·r 인형·k 결과·n 판)는 바뀔 때만, 조작 중에는 초당 최대 8번.
//  - 채팅: 공용 채팅 창(hiking-chat-ui, ns 'claw') ↔ {t:'c'}. 음소거 = 그 사람 모습·말을 내 화면에서 숨김(크리스마스와 같음).
//  - 다른 손님 몸: 가까운 cap명만 동동이로 그리고 나머지는 숨긴다(가게가 좁아 가벼운 몸은 두지 않음).
//  - 다른 손님 act는 onAct(id, act)로 넘겨 기계 구경(claw-play.js watch)에 쓴다.
// 화면(상태 알약·알림)은 claw-hud.js. 이 파일과는 'claw:multi-status'·'claw:multi-note' 이벤트와 반환 객체로 만난다.
import {carryFromAct,carryHide,carryFar} from '../carry/carry-store.js';
import {createWebSocketTransport,createBroadcastTransport,multiServerUrl,createBackgroundTimer} from '../multi-transport.js';
import {anonymousName,sanitizeName,createInterpolator,decodeState,FLAG,NET,findServer,PRESENCE,createPresence,sanitizeAct,createModeration,REPORT_REASONS,serverMax} from '../multi-protocol.js';

export const DEFAULT_ROOM='인형가게-1';
export const EXPERIENCE='claw';
export const CLAW_MULTI=Object.freeze({sendHz:NET.sendHz,idleSend:1,announce:3,timeout:6,jumpDist:1.2,actGap:.125,cap:Object.freeze({desktop:29,mobile:8})});
export const cleanRoom=raw=>{const s=[...String(raw??'').normalize('NFC').replace(/[^0-9A-Za-z가-힣_-]/g,'')].slice(0,24).join('');return s||DEFAULT_ROOM;};
export const cleanName=raw=>[...String(raw??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f]/g,'').replace(/\s+/g,' ').trim()].slice(0,NET.nameMax).join('').trim();
export function multiParams(search='',envUrl=''){
 const q=new URLSearchParams(search);
 return {auto:q.has('multi'),room:cleanRoom(q.get('multi')),name:q.has('name')?cleanName(q.get('name')):null,server:multiServerUrl(search,envUrl)};
}
// 상태 알약 글. tone: wait·ok·local·warn·bad·solo
export function clawStatusView(d={}){
 const n=Math.max(0,Number(d.count)||0),max=d.max||serverMax(EXPERIENCE),srv=d.room?findServer(EXPERIENCE,d.room):null,where=srv?.name??(d.room?`방 ${d.room}`:'');
 switch(d.state){
  case 'connecting':return {tone:'wait',ic:'c-net-connecting',text:'연결 중…',sub:where};
  case 'online':return d.transport==='local'?{tone:'local',ic:'c-net-local',text:`내 컴퓨터 모드 · 👥 ${n||1}`,sub:'서버 없음 · 이 브라우저 창끼리만'}
   :{tone:'ok',ic:'c-net-ok',text:`${where} · 👥 ${n||1}/${max}`,sub:''};
  case 'reconnecting':return {tone:'warn',ic:'c-net-retry',text:'다시 연결 중…',sub:'혼자 뽑기는 계속돼요'};
  case 'offline':return {tone:'bad',ic:'c-net-lost',text:'혼자 뽑기 · 다시 연결',sub:'눌러서 다시 연결해요'};
  case 'full':return {tone:'warn',ic:'c-net-full',text:'방금 꽉 찼어요',sub:'혼자 뽑기로 놀 수 있어요'};
  default:return {tone:'solo',ic:'c-person',text:'혼자 뽑기',sub:'눌러서 가게 서버에 들어가요'};
 }
}

// ctx: {world, player, profile, mobile, createAvatar({id,name}) async}
export function createClawMulti({ctx,search=globalThis.location?.search??'',envUrl='',win=globalThis.window,storage=globalThis.localStorage,
 myAct=()=>null,onAct=()=>{},onLeave=()=>{},
 makeTransport=o=>o.server?createWebSocketTransport(o.server,{experience:EXPERIENCE,room:o.room,name:o.name}):createBroadcastTransport(o.room,undefined,{experience:EXPERIENCE}),
 now=()=>performance.now()/1000,heartbeat=fn=>createBackgroundTimer(fn,PRESENCE.heartbeatMs)}={}){
 const params=multiParams(search,envUrl);
 const cap=ctx.mobile?CLAW_MULTI.cap.mobile:CLAW_MULTI.cap.desktop;
 const moderation=createModeration({storage,key:'claw-moderation'});
 const roster=new Map(); // id → {id,name,tagHidden,interp,lastSeen,flags,act,avatar,loading,sample,shown,full}
 let transport=null,viaServer=false,joined=false,netState='offline',room=params.room,myId=null,myName='',maxHere=serverMax(EXPERIENCE);
 let presence=createPresence({timeout:CLAW_MULTI.timeout}),beat=null,lastAnnounceAt=-Infinity,lastGreet=-Infinity,rejected=false;
 let lastAct='',lastActAt=-Infinity,seq=0,sendT=0,lastSent=null,lastSentAt=-Infinity,announceT=0,assignT=0,jumpNext=false,statusSig='',offMsg=null,offStatus=null;
 const stats={sent:0,received:0,chatsSent:0,chatsReceived:0,chatsMuted:0,actsSent:0,actsReceived:0,spawned:0};
 const dispatch=(type,detail)=>win?.dispatchEvent?.(new CustomEvent(type,{detail}));
 const send=m=>{if(!transport)return;stats.sent++;transport.send(m);};
 const online=()=>joined&&(!viaServer||netState==='online');
 const muted=id=>moderation.isBlocked(id);
 const nameOf=r=>r&&!r.tagHidden&&r.name?r.name:anonymousName(r?.id??'',EXPERIENCE);
 const visible=r=>r.lastSeen>0&&!muted(r.id);

 function emitStatus(force=false){
  const detail={state:joined?netState:'off',room,count:online()?[...roster.values()].filter(r=>r.lastSeen>0).length+1:0,max:maxHere,transport:viaServer?'server':'local',joined};
  const sig=JSON.stringify(detail);if(!force&&sig===statusSig)return;statusSig=sig;dispatch('claw:multi-status',detail);
 }
 function join({room:roomArg,name}={}){
  if(joined)leave(true);
  room=cleanRoom(roomArg??room);rejected=false;
  const want=cleanName(name??'')||cleanName(ctx.profile?.nickname);
  myId=Math.random().toString(36).slice(2,10);
  myName=sanitizeName(want,anonymousName(myId,EXPERIENCE));
  transport=makeTransport({server:params.server,room,name:want});
  viaServer=transport.kind==='server';netState=viaServer?transport.status??'connecting':'online';joined=true;
  presence=createPresence({timeout:viaServer?PRESENCE.serverTimeout:CLAW_MULTI.timeout});
  beat=heartbeat(()=>{if(!online())return;const t=now();if(t-lastSentAt>=PRESENCE.heartbeatMs/1000)sendPos(true);if(t-lastAnnounceAt>=CLAW_MULTI.announce)announce();});
  offStatus=viaServer&&transport.onstatus?transport.onstatus((st,info)=>{netState=st;if(info?.max)maxHere=info.max;
   if(st!=='online')for(const id of [...roster.keys()])drop(id);if(st==='online')greet();emitStatus();}):null;
  offMsg=transport.onmessage(onMessage);
  dispatch('claw:multi-join',{});
  if(!viaServer)greet();
  emitStatus(true);return true;
 }
 function leave(silent=false){
  if(!joined)return false;
  try{transport?.send({t:'b',id:myId});}catch{}
  beat?.stop();beat=null;offMsg?.();offStatus?.();try{transport?.close();}catch{}
  transport=null;joined=false;netState='offline';
  for(const id of [...roster.keys()])drop(id);
  dispatch('claw:multi-leave',{});onLeave();
  if(!silent)emitStatus(true);return true;
 }
 function greetNew(){const t=now();if(t-lastGreet<.3)return;lastGreet=t;announce();sendPos(true);if(!viaServer)sendAct(true);}
 function greet(){announce();jumpNext=true;sendPos(true);sendAct(true);}
 function announce(){announceT=0;lastAnnounceAt=now();send({t:'j',id:myId,n:myName});}
 function entry(id){
  let r=roster.get(id);if(r)return r;
  if(roster.size>=NET.maxRoster)return null;
  r={id,name:'',tagHidden:false,interp:createInterpolator(),lastSeen:0,flags:0,act:null,avatar:null,loading:false,sample:null,shown:false,full:false,snap:true};
  roster.set(id,r);greetNew();return r;
 }
 function drop(id){
  const r=roster.get(id);if(!r)return;roster.delete(id);r.dead=true;
  if(r.avatar){r.avatar.carry?.dispose();ctx.world.remove(r.avatar.root);}onAct(id,null);
  emitStatus();
 }
 function onMessage(m){
  stats.received++;if(!m||!joined)return;
  switch(m.t){
   case 'welcome':myId=m.id;room=m.room??room;myName=m.name||myName;if(transport?.info?.max)maxHere=transport.info.max;emitStatus();return;
   case 'moved':room=m.room??room;for(const id of [...roster.keys()])drop(id);dispatch('claw:multi-note',{text:'다른 가게로 옮겼어요'});emitStatus();return;
   // 운영 서버가 아직 인형뽑기를 모르는 옛 버전이면 거절된다 → 혼자 뽑기로(코인·도감은 그대로)
   case 'reject':if(!rejected){rejected=true;dispatch('claw:multi-note',{text:'서버가 아직 인형가게를 열지 않았어요. 혼자 뽑기로 놀아요',reject:true});setTimeout(()=>leave(),0);}return;
   case 'c-limit':dispatch('claw:chat-limit',{reason:['repeat','mute'].includes(m.reason)?m.reason:'rate',wait:Number.isFinite(m.wait)?m.wait:0});return;
   case 'report-ok':return;
   case 'c':{if(typeof m.text!=='string'||!m.text||typeof m.id!=='string')return;
    if(muted(m.id)){stats.chatsMuted++;return;}
    const me=m.id===myId,r=roster.get(m.id);stats.chatsReceived++;
    dispatch('claw:chat',{id:m.id,name:me?myName:nameOf(r??{id:m.id}),text:m.text,me,remote:true});return;}
  }
  if(m.id===myId||typeof m.id!=='string')return;
  const t=now();
  if(m.t==='b'){drop(m.id);return;}
  if(m.t==='j'){const r=entry(m.id);if(!r)return;r.name=sanitizeName(m.n,anonymousName(m.id,EXPERIENCE));r.tagHidden=!!m.h;r.lastSeen=t;if(r.avatar)r.avatar.name=nameOf(r);emitStatus();return;}
  if(m.t==='s'){const d=decodeState(m);if(!d)return;const r=entry(d.id);if(!r)return;
   const isNew=!r.lastSeen;r.lastSeen=t;r.flags=d.flags;
   if(d.flags&FLAG.jump){r.interp=createInterpolator();r.snap=true;}
   r.interp.push(t,d);if(isNew)emitStatus();return;}
  if(m.t==='act'){const a=sanitizeAct(EXPERIENCE,m.a);if(!a)return;const r=entry(m.id);if(!r)return;stats.actsReceived++;
   const prev=r.act;r.act=a;if(!r.lastSeen)r.lastSeen=t;if(!muted(r.id))onAct(r.id,a,prev,nameOf(r));return;}
 }
 const onChatSend=e=>{
  const text=String(e.detail?.text??'').slice(0,400).trim();if(!text||!joined)return;
  if(!online()){dispatch('claw:chat-limit',{reason:'offline'});return;}
  stats.chatsSent++;send({t:'c',id:myId,text});
 };
 win?.addEventListener?.('claw:chat-send',onChatSend);
 function sendAct(force=false){
  const a=myAct();if(!a||!online())return;const sig=JSON.stringify(a),t=now();
  if(!force&&sig===lastAct)return;
  // 조작 중 집게 자리만 바뀌면 초당 8번까지(서버 「다른 메시지」 상한 20/초 안). 단계가 바뀌면 바로
  if(!force&&lastAct&&JSON.parse(lastAct).ph===a.ph&&t-lastActAt<CLAW_MULTI.actGap)return;
  lastAct=sig;lastActAt=t;stats.actsSent++;send({t:'act',id:myId,a});
 }
 function sendPos(force=false){
  if(!online())return;
  const p=ctx.player,t=now();
  const moved=lastSent?Math.hypot(p.x-lastSent.x,p.z-lastSent.z):Infinity,turned=lastSent?Math.abs(Math.atan2(Math.sin(p.heading-lastSent.h),Math.cos(p.heading-lastSent.h))):Infinity;
  if(!force&&moved<.01&&turned<.02&&t-lastSentAt<CLAW_MULTI.idleSend)return;
  const elapsed=Math.max(.05,t-lastSentAt),jump=jumpNext||(lastSent&&moved>CLAW_MULTI.jumpDist+3*elapsed);
  let f=0;if(p.running)f|=FLAG.run;if(jump)f|=FLAG.jump;
  jumpNext=false;seq=(seq+1)&0xffff;
  const r2=v=>Math.round(v*100)/100;
  send({t:'s',id:myId,q:seq,z:0,x:r2(p.x),y:r2(p.z),h:r2(p.heading),v:r2(p.speed??0),f});
  lastSent={x:p.x,z:p.z,h:p.heading};lastSentAt=t;
 }
 async function spawn(r){
  r.loading=true;
  const a=await ctx.createAvatar({id:`p:${r.id}`,name:nameOf(r)});
  if(r.dead||!roster.has(r.id)){r.loading=false;return;}
  a.root.visible=false;ctx.world.add(a.root);r.avatar=a;r.loading=false;r.snap=true;stats.spawned++;
 }
 function assign(){
  const p=ctx.player,dist=r=>Math.hypot(r.sample.x-p.x,r.sample.z-p.z);
  const list=[...roster.values()].filter(r=>r.sample&&visible(r)).sort((a,b)=>dist(a)-dist(b));
  const full=new Set(list.slice(0,cap));
  for(const r of roster.values())r.full=full.has(r);
  for(const r of full)if(!r.avatar&&!r.loading)spawn(r);
 }
 function drive(r,dt){
  const s=r.sample,show=visible(r)&&!!s&&r.full&&!!r.avatar;r.shown=show;
  if(r.avatar)r.avatar.root.visible=show;if(!show)return;
  const a=r.avatar;
  if(r.snap){a.place(s.x,s.z,s.heading);r.snap=false;a.update(0,{moved:0});return;}
  const moved=Math.hypot(s.x-a.x,s.z-a.z);a.x=s.x;a.z=s.z;if(moved>1e-3||!s.moving)a.heading=s.heading;
  // 든 인형(11-25): 받은 act ch·cb, 기계 앞에서 뽑는 동안(m) 숨김, 휴대폰 먼 사람은 빛만
  a.carry?.set(carryFromAct(r.act));if(a.carry)a.carryHide={...carryHide(r.act),far:carryFar(Math.hypot(s.x-ctx.player.x,s.z-ctx.player.z),ctx.mobile)};
  a.update(dt,{moved,running:!!(r.flags&FLAG.run)});
 }
 return {
  get joined(){return joined;},get state(){return joined?netState:'off';},get room(){return room;},get id(){return myId;},get name(){return myName;},
  get server(){return params.server;},get params(){return params;},get viaServer(){return viaServer;},get online(){return online();},get max(){return maxHere;},
  join,leave,moderation,
  avatarOf(id){const r=roster.get(id);return r?.shown?r.avatar:null;},
  sampleOf(id){const r=roster.get(id);return r&&visible(r)?r.sample:null;},
  nameOf(id){const r=roster.get(id);return id===myId?myName:r?nameOf(r):anonymousName(id,EXPERIENCE);},
  mute(id){const r=roster.get(id);moderation.block(id,r?nameOf(r):id);onAct(id,null);emitStatus(true);},
  unmute(id){moderation.unblock(id);const r=roster.get(id);if(r?.act)onAct(id,r.act,null,nameOf(r));emitStatus(true);},
  report(id,reason=REPORT_REASONS[1]){const r=roster.get(id);moderation.report({id,name:r?nameOf(r):id,reason},Date.now());if(viaServer&&online())send({t:'report',id:myId,to:id,reason});onAct(id,null);emitStatus(true);},
  isMuted:muted,mutedList(){return moderation.data.blocked;},
  headOf(id){if(id===myId||id==='me')return {kind:'me'};const r=roster.get(id);return r?.shown&&r.avatar?{kind:'avatar',avatar:r.avatar}:null;},
  people(){return [...roster.values()].filter(r=>r.lastSeen>0).map(r=>({id:r.id,name:nameOf(r),muted:muted(r.id),shown:r.shown,sample:r.sample,act:r.act}));},
  update(dt){
   if(!joined)return;
   const t=now();
   sendT+=dt;if(sendT>=1/CLAW_MULTI.sendHz){sendT=0;sendPos();}
   sendAct();
   announceT+=dt;if(announceT>=CLAW_MULTI.announce&&online())announce();
   assignT-=dt;if(assignT<=0){assignT=.5;assign();}
   presence.frame(t);
   for(const r of [...roster.values()]){
    if(r.lastSeen&&presence.expired(r.lastSeen,t)){drop(r.id);continue;}
    r.sample=r.interp.sample(t)??r.sample;drive(r,dt);
   }
   emitStatus();
  },
  status(){return {joined,state:joined?netState:'off',transport:viaServer?'server':'local',room,id:myId,name:myName,max:maxHere,server:params.server,cap,
   people:[...roster.values()].map(r=>({id:r.id,name:nameOf(r),muted:muted(r.id),shown:r.shown,act:r.act,x:r.sample?+r.sample.x.toFixed(2):null,z:r.sample?+r.sample.z.toFixed(2):null})),stats:{...stats}};},
  dispose(){leave(true);win?.removeEventListener?.('claw:chat-send',onChatSend);},
 };
}
