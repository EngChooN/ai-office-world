// 트리 꾸미기 진행(월드개발, 2026-11-16): 트리 상태(tree-state.js)와 화면 트리(village.tree)·서버(multi.sendTree)를 잇는다.
//  - 서버에 붙어 있으면(online·서버 모드) 판정은 서버가 한다: 요청만 보내고, 돌아온 tree:set·tree:del·tree:star로 내 상태·화면을 바꾼다.
//  - 혼자 둘러보기·내 컴퓨터 모드(BroadcastChannel)는 이 화면이 같은 규칙으로 직접 판정한다(혼자면 내 화면에만 남고 새로고침하면 사라짐).
//    내 컴퓨터 모드는 결과를 같은 창끼리 tree:set 등으로 알린다(창끼리 먼저 단 것이 이김, 연습용).
//  - 다시 연결 중·끊김에 누른 것은 보내지 않고 버린다(체험설계 §3-4 "연결이 돌아오면 다시 눌러 주세요").
//  - 끊겨도 트리는 마지막으로 받은 모습 그대로 둔다. 다시 붙으면 서버가 주는 전체 상태로 바꾼다.
// 화면 알림은 note(text)·event(type,detail) 콜백으로 hud에 넘긴다.
import {createTreeState,treeStage,TREE_TEXT,TREE_RULES} from './tree-state.js';

export function createTreePlay({tree,multi,me=()=>multi?.id??'me',myName=()=>'',note=()=>{},event=()=>{},now=()=>Date.now()}){
 const state=createTreeState();
 let shownStage=0;
 const local=()=>!multi?.joined||!multi.viaServer;      // 이 화면이 판정
 function paint(slot){tree.setOrnament(slot,state.slot(slot)?.k??null);}
 function paintAll(){for(let i=0;i<TREE_RULES.slots;i++)paint(i);paintLights(false);tree.setStar(!!state.star);}
 function paintLights(celebrate=true){
  const s=state.stage;tree.setLightStage(s);
  if(celebrate&&s>shownStage){tree.flash(s===4?4:2.5);event('stage',{stage:s,count:state.count});}
  shownStage=s;
 }
 // 받은(또는 내가 판정한) 결과를 적용
 // gift = 선물 오너먼트로 단 것(1분 몫·10개에 안 셈, 되돌리기 없음)
 function applySet(slot,k,n,id,mine,gift=false){const t=now();state.set(slot,k,n,gift?`gift:${id}`:mine?me():id,t);if(mine&&!gift)state.noteRecent(me(),t);paint(slot);paintLights();event('set',{slot,kind:k,name:n,mine,gift});}
 function applyDel(slot){const s=state.slot(slot);if(s&&s.id===me())state.forgetRecent(me(),s.at);state.clearSlot(slot);paint(slot);paintLights(false);event('del',{slot});}
 function applyStar(n,id,mine){state.setStar(n,id);tree.setStar(true);tree.flash(3);event('star',{name:n,mine});}
 function denied(r){note(r.reason==='rate'?TREE_TEXT.rate(r.wait):TREE_TEXT[r.reason]??TREE_TEXT.bad);event('no',r);}

 // free: 선물 받은 오너먼트로 달기(서버에는 g:1, 서버가 받은 몫을 확인)
 function put(slot,kind,{free=false}={}){
  if(local()){
   const r=state.put(me(),myName(),slot,kind,now(),{free});if(!r.ok){denied(r);return r;}
   paint(slot);paintLights();event('set',{slot,kind,name:r.name,mine:true,gift:free});
   if(multi?.joined)multi.sendTree({t:'tree:set',slot,k:kind,n:r.name,...(free?{g:1}:{})});
   return r;}
  if(!multi.sendTree({t:'tree:put',slot,k:kind,...(free?{g:1}:{})})){note(TREE_TEXT.offline);return {ok:false,reason:'offline'};}
  return {ok:true,pending:true};
 }
 function undo(slot){
  if(local()){const r=state.undo(me(),slot,now());if(!r.ok){denied(r);return r;}paint(slot);paintLights(false);event('del',{slot,mine:true});if(multi?.joined)multi.sendTree({t:'tree:del',slot});return r;}
  if(!multi.sendTree({t:'tree:undo',slot})){note(TREE_TEXT.offline);return {ok:false,reason:'offline'};}
  return {ok:true,pending:true};
 }
 function star(){
  if(local()){const r=state.putStar(me(),myName(),now());if(!r.ok){denied(r);return r;}applyStar(r.name,me(),true);if(multi?.joined)multi.sendTree({t:'tree:star',n:r.name});return r;}
  if(!multi.sendTree({t:'tree:star'})){note(TREE_TEXT.offline);return {ok:false,reason:'offline'};}
  return {ok:true,pending:true};
 }
 // multi.js onTree
 function receive(m){
  switch(m.t){
   case 'tree':state.load(m);paintAll();shownStage=state.stage;event('load',{count:state.count});return;
   case 'tree:set':
    // 내 컴퓨터 모드: 다른 창이 이미 단 자리는 먼저 단 쪽을 따른다(같은 자리를 둘이 동시에 달면 받은 쪽으로 덮음 — 연습용이라 단순하게)
    applySet(m.slot,m.k,m.n,m.id,m.mine,!!m.g);return;
   case 'tree:del':applyDel(m.slot);return;
   case 'tree:star':applyStar(m.n,m.id,m.mine);return;
   case 'tree:no':{if(m.reason==='taken'&&Number.isInteger(m.near))event('near',{slot:m.near});denied(m);return;}
  }
 }
 return {state,put,undo,star,receive,paintAll,
  quota:()=>state.quota(me(),now()),
  lastUndoable:()=>state.lastUndoable(me(),now()),
  get count(){return state.count;},get stage(){return treeStage(state.count);},get star(){return state.star;},
  get starOpen(){return !state.star&&state.count>=TREE_RULES.starUnlock;},
 };
}
