// 광장 놀이 요청 보내기(월드개발, 2026-11-16). 놀이 모듈(선물·모닥불·눈사람·눈싸움·썰매)은 이것 하나로 요청하고, 결과는 receive로 받는다.
//  - 서버 모드: multi.sendPlay → 서버(room-play.js)가 판정 → multi onPlay로 결과.
//  - 혼자 둘러보기·내 컴퓨터 모드(BroadcastChannel): 이 화면이 같은 room-play.js로 직접 판정한다(혼자면 내 화면에만 남음).
//    내 컴퓨터 모드는 결과 중 다른 창도 봐야 하는 것(눈덩이 던지기·선물·우체통 깃발·모두의 카드)만 다른 창에 알린다(연습용: 눈사람 마당은 창마다 따로).
//  - 다시 연결 중·끊김에 누른 것은 보내지 않고 false(체험설계 §3-4 "연결이 돌아오면 다시 눌러 주세요").
import {createRoomPlay} from './room-play.js';
import {sanitizeName} from '../multi-protocol.js';

const SHARE_LOCAL=new Set(['sb','sbh','gift','gift:post','board']);
export function createPlayNet({multi,player,myName=()=>'나',myAct=()=>null,now=()=>Date.now()}){
 const subs=[];let local=createRoomPlay();
 const meId=()=>multi.id??'me';
 const deliver=m=>{for(const f of subs)f(m);};
 const serverMode=()=>multi.joined&&multi.viaServer;
 // 혼자·내 컴퓨터 모드의 사람 목록(던지기 판정에 다른 창 사람 자리도 넣는다)
 function ctxLocal(){
  const members=new Map();
  members.set(meId(),{id:meId(),name:sanitizeName(myName(),'나'),state:{x:player.x,y:player.z},act:myAct()});
  if(multi.joined)for(const p of multi.people())if(p.sample&&!p.muted)members.set(p.id,{id:p.id,name:p.name,state:{x:p.sample.x,y:p.sample.z},act:p.act});
  return {members,
   send:(id,msg)=>{if(id===meId()){deliver(msg);return true;}if(!members.has(id))return false;if(SHARE_LOCAL.has(msg.t))multi.relayLocal?.({...msg,to:id});return true;},
   all:msg=>{deliver(msg);if(multi.joined&&SHARE_LOCAL.has(msg.t))multi.relayLocal?.(msg);}};
 }
 let tickT=0;
 return {
  // 보냈으면(또는 직접 판정했으면) true. 서버 모드인데 연결이 안 됐으면 false
  send(m){
   if(serverMode())return multi.sendPlay(m);
   if(multi.joined&&multi.state!=='online')return false;
   const ctx=ctxLocal();local.handle(ctx.members.get(meId()),m,now(),ctx);return true;
  },
  // 혼자 모드 act 검사(자리 겹침): 서버 모드면 서버가 하므로 그대로
  checkAct(a){if(serverMode())return a;return local.checkAct({id:meId()},a,ctxLocal()).a;},
  receive(m){deliver(m);},
  on(f){subs.push(f);},
  get serverMode(){return serverMode();},
  get local(){return local;},
  // 혼자 모드에서 받은 오너먼트를 쓰는지(트리 달기 전에)
  useBonus(){return local.useBonus(meId());},
  giveBonus(){local.giveBonus(meId());},
  // 서버를 옮기거나 혼자로 바뀌면 혼자 판정 상태를 새로(서버 쪽 상태는 들어갈 때 snapshot으로 받는다)
  resetLocal(){local=createRoomPlay();},
  update(dt){if(serverMode())return;tickT+=dt;if(tickT<.1)return;tickT=0;local.tick(now(),ctxLocal());},
 };
}
