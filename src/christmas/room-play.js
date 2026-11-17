// 온라인 크리스마스 — 광장 놀이 판정(월드개발, 2026-11-16). 선물 우체통·모닥불 자리·썰매 줄·눈사람 마당·눈싸움·썰매 같이 타기 요청.
// 순수 모듈(소켓·타이머·three 없음): 서버(server/rooms.mjs)가 방마다 하나 만들어 쓰고, 혼자 둘러보기·내 컴퓨터 모드 화면(play-net.js)도 같은 것을 쓴다.
// 규격(클라이언트 → 판정):
//  gift:send {to:id|'*',item,card,text}         → 받는 사람 {t:'gift',g,id,n,item,card,text,all?}, 보낸 사람 {t:'gift:ok',g,to}, 방 모두 {t:'gift:post',id}(우체통 깃발)
//                                                 '*'면 방 모두에게 gift(all:1) + 「모두의 카드」 판 {t:'board',c:[…최근 5장]}. 못 하면 {t:'gift:no',reason,wait?}
//  snow:make {x,z} · snow:push {b,x,z} · snow:stack {b,u} · snow:deco {b,p,on} · snow:finish {b}
//                                               → {t:'snow:ball',b:[줄…]}(바뀐 눈덩이; 밀기는 10Hz 묶음), {t:'snow:gone',b,why}, {t:'snow:done',d:전시,by:id}, 못 하면 {t:'snow:no',reason}
//  sb:throw {x,z,dx,dz,d}                      → 방 모두 {t:'sb',id,x,z,tx,tz,ms,hit,soft?,wall?}, 못 하면 보낸 사람 {t:'sb:no',reason}
//  sled:ask|sled:ok|sled:no {to}               → 받는 사람에게 {t,id}(같은 방 안에서만 중계)
//  sr:* 눈썰매 레이스·오늘의 기록판(sled-race.js) · sbm:* 눈싸움 한 판(fight-match.js)
//  act {st 모닥불 자리 1~8, sl 썰매 줄 1~4 …}   → 다른 사람이 이미 쓰는 자리·줄이면 그 칸을 빼고 보낸 사람에게 {t:'seat:no'}·{t:'sled:busy'}
// 들어올 때: {t:'snow',…} 전체 마당·전시, {t:'board',c}, 끊긴 동안 온 선물(재접속 유예 안).
// member = {id, name(숨김이면 익명 이름), state:{x,y}|null(서버 위치 규격: y가 z), act}
import {GIFT_RULES,parseGiftSend,createGiftLimiter,cleanCardText,GIFT_INFO} from './gift-state.js';
import {createSnowmanState} from './snowman-state.js';
import {FIGHT,inFightYard,resolveThrow,createHarassGuard} from './snowfight.js';
import {createFightMatch} from './fight-match.js';
import {createSledRace} from './sled-race.js';

export const XMAS_PLAY_MESSAGES=Object.freeze(['gift:send','snow:make','snow:push','snow:stack','snow:deco','snow:finish','sb:throw','sled:ask','sled:ok','sled:no',
 'sr:open','sr:join','sr:go','sr:quit','sr:fin','sr:rec','sbm:join','sbm:leave','sbm:go']);
export const SEAT_COUNT=8,SLED_LANES=4;
const posOf=m=>m?.state?{x:m.state.x,z:m.state.y}:null;
const num=v=>typeof v==='number'&&Number.isFinite(v);

// cleanText(text) → 금칙어를 가린 글(서버: sanitizeChat). ctx: {members:Map(id→member), send(id,msg)→bool, all(msg)}
export function createRoomPlay({cleanText=t=>t,rules=GIFT_RULES}={}){
 const snow=createSnowmanState();
 const board=[];                    // 모두의 카드 최근 5장 {g,id,n,item,card,text}
 const limiters=new Map(),bonus=new Map(),cards=new Map(),lastThrow=new Map(),held=new Map();
 const harass=createHarassGuard(),lastHitAt=new Map();
 const match=createFightMatch(),race=createSledRace();
 const dirty=new Set();let gseq=0;
 const limiter=id=>{let l=limiters.get(id);if(!l){l=createGiftLimiter(rules);limiters.set(id,l);}return l;};
 const note=(id,text)=>{const a=cards.get(id)??[];a.push(text);if(a.length>3)a.shift();cards.set(id,a);};
 const ballMsg=(list,t)=>({t:'snow:ball',b:list.map(b=>snow.row(b,t))});

 function gift(c,m,t,ctx){
  const g=parseGiftSend(m);if(!g)return ctx.send(c.id,{t:'gift:no',reason:'bad'});
  if(g.to===c.id)return ctx.send(c.id,{t:'gift:no',reason:'self'});
  const target=g.to==='*'?null:ctx.members.get(g.to);
  if(g.to!=='*'&&!target&&!ctx.away?.(g.to))return ctx.send(c.id,{t:'gift:no',reason:'gone'});
  const ok=limiter(c.id).check(t,g.to);if(!ok.ok)return ctx.send(c.id,{t:'gift:no',reason:ok.reason,...(ok.wait?{wait:ok.wait}:{})});
  const text=cleanCardText(cleanText(g.text))||'메리 크리스마스!';
  limiter(c.id).note(t,g.to);note(c.id,text);
  const msg={t:'gift',g:`g${(++gseq).toString(36)}`,id:c.id,n:c.name,item:g.item,card:g.card,text};
  if(g.to==='*'){msg.all=1;board.push({g:msg.g,id:c.id,n:c.name,item:g.item,card:g.card,text});while(board.length>rules.board)board.shift();
   for(const m2 of ctx.members.values())if(m2.id!==c.id)ctx.send(m2.id,msg);
   ctx.all({t:'board',c:board.slice()});}
  else{if(GIFT_INFO[g.item]?.tree)bonus.set(g.to,Math.min(rules.bonusMax,(bonus.get(g.to)??0)+1));
   if(!target||!ctx.send(g.to,msg)){const a=held.get(g.to)??[];a.push({msg,at:t});held.set(g.to,a);}}
  ctx.send(c.id,{t:'gift:ok',g:msg.g,to:g.to});
  ctx.all({t:'gift:post',id:c.id});
 }
 function snowMsg(c,m,t,ctx){
  const p=posOf(c),name=c.name;let r;
  switch(m.t){
   case 'snow:make':{if(!num(m.x)||!num(m.z))return ctx.send(c.id,{t:'snow:no',reason:'bad'});
    // 만드는 자리는 내 발 앞이어야 한다(서버가 아는 내 자리에서 2m 안)
    if(p&&Math.hypot(p.x-m.x,p.z-m.z)>2.2)return ctx.send(c.id,{t:'snow:no',reason:'far'});
    r=snow.make(c.id,name,m.x,m.z,t);if(r.ok)ctx.all(ballMsg([r.ball],t));break;}
   case 'snow:push':r=snow.push(c.id,name,String(m.b??''),m.x,m.z,t,p?{px:p.x,pz:p.z}:{});if(r.ok)dirty.add(r.ball.id);break;
   case 'snow:stack':r=snow.stack(c.id,name,String(m.b??''),String(m.u??''),t);if(r.ok){dirty.delete(r.removed);ctx.all({t:'snow:gone',b:r.removed,why:'stack'});ctx.all(ballMsg([r.ball],t));}break;
   case 'snow:deco':r=snow.deco(c.id,name,String(m.b??''),String(m.p??''),!!m.on,t);if(r.ok&&!r.same)ctx.all(ballMsg([r.ball],t));break;
   case 'snow:finish':r=snow.finish(c.id,name,String(m.b??''),t);if(r.ok){dirty.delete(r.removed);ctx.all({t:'snow:gone',b:r.removed,why:'finish'});ctx.all({t:'snow:done',d:r.entry,by:c.id,replaced:r.replaced?1:0});}break;
  }
  if(!r||r.ok)return;
  // 밀기는 1초에 10번 오니 안내 대신 바로잡기만: 남은 눈덩이면 서버 자리, 없어졌으면 gone
  if(m.t==='snow:push'){const b=snow.get(String(m.b??''));ctx.send(c.id,b?ballMsg([b],t):{t:'snow:gone',b:String(m.b??''),why:'gone'});return;}
  ctx.send(c.id,{t:'snow:no',reason:r.reason,op:m.t});
 }
 function throwBall(c,m,t,ctx){
  const p=posOf(c);if(!p||!inFightYard(p.x,p.z,-.3))return ctx.send(c.id,{t:'sb:no',reason:'outside'});
  if(t-(lastThrow.get(c.id)??-Infinity)<FIGHT.gapMs)return ctx.send(c.id,{t:'sb:no',reason:'gap'});
  if(t-(lastHitAt.get(c.id)??-Infinity)<FIGHT.stunMs)return ctx.send(c.id,{t:'sb:no',reason:'stun'}); // 맞은 뒤 0.6초는 못 던짐
  if(!num(m.dx)||!num(m.dz)||Math.hypot(m.dx,m.dz)<1e-3)return ctx.send(c.id,{t:'sb:no',reason:'bad'});
  lastThrow.set(c.id,t);
  // 시작점은 서버가 아는 자리 근처만 믿는다(2m 넘게 다르면 서버 자리)
  const from=num(m.x)&&num(m.z)&&Math.hypot(m.x-p.x,m.z-p.z)<=2?{x:m.x,z:m.z}:p;
  // 웅크림(act.cr)·맞은 뒤 1초 무적(통과)
  const people=[];for(const o of ctx.members.values()){if(o.id===c.id)continue;const q=posOf(o);if(q)people.push({id:o.id,...q,crouch:o.act?.cr===1,safe:t-(lastHitAt.get(o.id)??-Infinity)<FIGHT.invulnMs});}
  const r=resolveThrow({...from,dx:m.dx,dz:m.dz,dist:num(m.d)?m.d:FIGHT.forward},people);
  const soft=r.hit?harass.hit(c.id,r.hit,t):false;
  if(r.hit)lastHitAt.set(r.hit,t);
  const pts=r.hit?match.scoreHit(c.id,r.hit,{head:r.head,soft,d:r.d,t},ctx):null;
  const r2=v=>Math.round(v*100)/100;
  ctx.all({t:'sb',id:c.id,x:r2(r.x),z:r2(r.z),tx:r2(r.tx),tz:r2(r.tz),d0:r2(r.d0),ms:r.ms,hit:r.hit,...(r.head?{head:1}:{}),...(soft?{soft:1}:{}),...(r.wall?{wall:1}:{}),...(pts?pts:{})});
 }
 return {
  snow,board,
  // 처음 들어오거나 다시 붙은 사람에게 보낼 것
  joinMsgs(c,t){
   const out=[snow.snapshot(t)];if(board.length)out.push({t:'board',c:board.slice()});out.push(...race.joinMsgs(t),...match.joinMsgs(t));
   const h=held.get(c.id);if(h){held.delete(c.id);for(const x of h)if(t-x.at<=rules.holdMs)out.push(x.msg);}
   return out;
  },
  // 다른 사람이 이미 쓰는 모닥불 자리·썰매 줄을 빼고 돌려준다
  checkAct(c,a,ctx){
   const deny=[];if(!a)return {a,deny};
   const taken=(k,v)=>[...ctx.members.values()].some(o=>o.id!==c.id&&o.act?.[k]===v);
   if(a.st&&taken('st',a.st)){a={...a,st:0};deny.push({t:'seat:no'});}
   if(a.sl>=1&&a.sl<=SLED_LANES&&taken('sl',a.sl)){a={...a,sl:0};deny.push({t:'sled:busy'});}
   return {a,deny};
  },
  handle(c,m,t,ctx){
   switch(m.t){
    case 'gift:send':return gift(c,m,t,ctx);
    case 'snow:make':case 'snow:push':case 'snow:stack':case 'snow:deco':case 'snow:finish':return snowMsg(c,m,t,ctx);
    case 'sb:throw':return throwBall(c,m,t,ctx);
    case 'sr:open':case 'sr:join':case 'sr:go':case 'sr:quit':case 'sr:fin':case 'sr:rec':return race.handle(c,m,t,ctx);
    case 'sbm:join':case 'sbm:leave':case 'sbm:go':return match.handle(c,m,t,ctx);
    case 'sled:ask':case 'sled:ok':case 'sled:no':{const to=typeof m.to==='string'?ctx.members.get(m.to):null;if(to&&to.id!==c.id)ctx.send(to.id,{t:m.t,id:c.id});return;}
   }
  },
  // 받은 오너먼트 선물로 트리에 하나 더 달기(서버가 트리 달기 전에 부른다). 남았으면 하나 쓰고 true
  useBonus(id){const n=bonus.get(id)??0;if(n<=0)return false;bonus.set(id,n-1);return true;},
  giveBonus(id){bonus.set(id,Math.min(rules.bonusMax,(bonus.get(id)??0)+1));},
  bonusOf:id=>bonus.get(id)??0,
  recentCards:id=>(cards.get(id)??[]).slice(),
  // 10Hz: 밀린 눈덩이 묶어 보내기·녹기·오래 들고 있던 선물 버리기
  tick(t,ctx){
   if(dirty.size){const list=[...dirty].map(id=>snow.get(id)).filter(Boolean);dirty.clear();if(list.length)ctx.all(ballMsg(list,t));}
   for(const id of snow.melt(t))ctx.all({t:'snow:gone',b:id,why:'melt'});
   for(const [id,a] of held){const k=a.filter(x=>t-x.at<=rules.holdMs);if(k.length)held.set(id,k);else held.delete(id);}
   race.tick(t,ctx);match.tick(t,ctx);
  },
  // 사람이 완전히 나감(유예 끝): 그 사람 몫 정리
  forget(id){limiters.delete(id);bonus.delete(id);lastThrow.delete(id);lastHitAt.delete(id);},
  reset(){snow.reset();board.length=0;held.clear();dirty.clear();race.reset();match.reset();},
  race,match,
 };
}
