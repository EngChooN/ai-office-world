// 눈싸움 「한 판」 규칙(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §2-3·§2-4). 순수 모듈 — 서버(room-play.js)와 혼자·내 컴퓨터 모드 화면이 같이 쓴다.
//  - 그냥 던지기는 그대로. 마당에서 「한 판 하기」(sbm:join) → 빨강(1)·초록(2) 중 적은 쪽 팀. 2명 이상이면 15초 대기 후 시작(그 사이 들어온 사람도 참가).
//  - 한 라운드 90초 · 3라운드(2선승) · 라운드 사이 10초(진영 바꾸기) · 끝나면 1초 「그만!」. 최대 2~10명(방 정원 20 안에서 10명까지).
//  - 점수: 맞힘 +1 · 머리 맞힘 +2 · 같은 편 0점(ff) · 같은 사람 집중 공격(soft) 뒤로는 0점. 라운드 승 = 그 라운드 팀 점수가 높은 쪽, 같으면 무승부(둘 다 0.5승).
//  - 중간에 나간 사람은 점수를 남기고 팀에서 빠짐. 한 팀이 비면 판이 끝나고 남은 팀이 이김.
//  - 결과: 이긴 팀, 라운드 결과, 개인 표(맞힘·머리·맞음·가장 먼 명중), 칭호 3개(명사수·눈사람·저격수 — 같은 수면 먼저 이룬 사람).
//  - 「한 판 더」(sbm:join, 결과 뒤): 지난 판 사람 그대로 새 대기. 「마당 나가기」(sbm:leave).
// 판정 → 방 모두: {t:'sbm', ph:'none'|'wait'|'round'|'stop'|'break'|'result', left(ms), rd(라운드 1~3), sc:[빨강,초록](이번 라운드), wins:[빨강,초록], rr:[라운드별 1·2·0], tm:{id:1|2}, n:{id:이름}, res?}
//  못 하면 보낸 사람 {t:'sbm:no', reason}
export const MATCH=Object.freeze({min:2,max:10,waitMs:15000,roundMs:90000,breakMs:10000,stopMs:1000,rounds:3,winAt:2,hit:1,head:2,keepMs:30000});

export function createFightMatch(){
 let M=null;
 const fresh=()=>({ph:'wait',until:null,rd:0,sc:[0,0],wins:[0,0],rr:[],tm:new Map(),names:new Map(),stats:new Map(),seq:0,host:null,res:null,phaseEnd:0});
 const stat=id=>{let s=M.stats.get(id);if(!s){s={id,n:M.names.get(id)??id,tm:M.tm.get(id)??0,hits:0,heads:0,hitBy:0,far:0,at:{hits:0,hitBy:0,far:0}};M.stats.set(id,s);}return s;};
 const teamSize=k=>[...M.tm.values()].filter(v=>v===k).length;
 const view=t=>{if(!M)return {t:'sbm',ph:'none'};
  return {t:'sbm',ph:M.ph,left:M.ph==='wait'?(M.until?Math.max(0,M.until-t):-1):Math.max(0,M.phaseEnd-t),rd:M.rd,sc:M.sc.slice(),wins:M.wins.slice(),rr:M.rr.slice(),
   tm:Object.fromEntries(M.tm),n:Object.fromEntries([...M.tm.keys()].map(id=>[id,M.names.get(id)])),host:M.host,...(M.res?{res:M.res}:{})};};
 function add(id,name,t){
  if(M.tm.has(id))return true;if(M.tm.size>=MATCH.max)return false;
  const k=teamSize(1)<=teamSize(2)?1:2;M.tm.set(id,k);M.names.set(id,name);stat(id).tm=k;M.host??=id;
  if(M.ph==='wait'&&M.tm.size>=MATCH.min&&!M.until)M.until=t+MATCH.waitMs;
  return true;
 }
 function startRound(t,ctx){M.rd++;M.sc=[0,0];M.ph='round';M.phaseEnd=t+MATCH.roundMs;ctx.all(view(t));}
 function finish(t,ctx){
  const ppl=[...M.stats.values()].map(s=>({id:s.id,n:s.n,tm:s.tm,hits:s.hits,heads:s.heads,hitBy:s.hitBy,far:+s.far.toFixed(1),left:M.tm.has(s.id)?0:1}));
  // 칭호: 가장 큰 값, 같으면 먼저 이룬 사람(at = 그 값에 닿은 시각)
  const title=(k)=>{let best=null;for(const s of M.stats.values()){if(!(s[k]>0))continue;if(!best||s[k]>best[k]||(s[k]===best[k]&&s.at[k]<best.at[k]))best=s;}return best?.id??null;};
  // 한 팀이 모두 나가 일찍 끝나면 남은 팀이 이김(기권)
  const t1=teamSize(1),t2=teamSize(2),win=t1&&!t2?1:t2&&!t1?2:M.wins[0]>M.wins[1]?1:M.wins[1]>M.wins[0]?2:0;
  M.res={win,wins:M.wins.slice(),rr:M.rr.slice(),ppl,titles:{ace:title('hits'),snow:title('hitBy'),snipe:title('far')}};
  M.ph='result';M.phaseEnd=t+MATCH.keepMs;ctx.all(view(t));
 }
 function endRound(t,ctx){
  const w=M.sc[0]>M.sc[1]?1:M.sc[1]>M.sc[0]?2:0;M.rr.push(w);if(w)M.wins[w-1]+=1;else{M.wins[0]+=.5;M.wins[1]+=.5;}
  M.ph='stop';M.phaseEnd=t+MATCH.stopMs;ctx.all(view(t));
 }
 return {
  view,get state(){return M;},
  teamOf:id=>M?.tm.get(id)??0,
  handle(c,m,t,ctx){
   const no=reason=>ctx.send(c.id,{t:'sbm:no',reason});
   switch(m.t){
    case 'sbm:join':{
     if(M&&M.ph==='result'){ // 한 판 더: 지난 판 사람 그대로(방에 남은 사람만) 새 대기
      const prev=[...M.tm.keys()].filter(id=>ctx.members.has(id)),names=M.names;M=fresh();for(const id of [c.id,...prev.filter(x=>x!==c.id)])add(id,id===c.id?c.name:names.get(id),t);M.host=c.id;ctx.all(view(t));return;}
     if(M&&M.ph!=='wait')return no('busy');
     M??=fresh();if(!add(c.id,c.name,t))return no('full');ctx.all(view(t));return;}
    case 'sbm:leave':{if(!M||!M.tm.has(c.id))return;M.tm.delete(c.id);if(M.host===c.id)M.host=M.tm.keys().next().value??null;
     if(M.ph==='wait'){if(M.tm.size<MATCH.min)M.until=null;if(!M.tm.size){M=null;ctx.all({t:'sbm',ph:'none'});return;}}
     else if(M.ph!=='result'&&(!teamSize(1)||!teamSize(2)))return finish(t,ctx);
     ctx.all(view(t));return;}
    case 'sbm:go':if(M?.ph==='wait'&&M.host===c.id&&M.tm.size>=MATCH.min){M.until=t;this.tick(t,ctx);}return;
   }
  },
  // 맞힘 점수(room-play throwBall이 부름). 한 판 라운드 중, 던진 사람·맞은 사람 둘 다 참가자일 때만. 반환 {pts} · {pts:0,ff:1} · null
  scoreHit(from,to,{head=false,soft=false,d=0,t=0}={},ctx){
   if(!M||M.ph!=='round'||!M.tm.has(from)||!M.tm.has(to))return null;
   const a=M.tm.get(from),b=M.tm.get(to);
   if(a===b)return {pts:0,ff:1};
   const sf=stat(from),st=stat(to);st.hitBy++;st.at.hitBy=t;
   if(soft)return {pts:0};
   const pts=head?MATCH.head:MATCH.hit;M.sc[a-1]+=pts;sf.hits++;sf.at.hits=t;if(head)sf.heads++;if(d>sf.far){sf.far=d;sf.at.far=t;}
   ctx?.all(view(t));return {pts};
  },
  tick(t,ctx){
   if(!M)return;
   // 방을 나간 사람은 팀에서 빠짐(점수는 남김)
   for(const id of [...M.tm.keys()])if(!ctx.members.has(id)){M.tm.delete(id);if(M.host===id)M.host=M.tm.keys().next().value??null;
    if(M.ph==='wait'){if(M.tm.size<MATCH.min)M.until=null;ctx.all(view(t));}else if(M.ph!=='result'&&(!teamSize(1)||!teamSize(2))){finish(t,ctx);return;}}
   if(M.ph==='wait'){if(!M.tm.size){M=null;ctx.all({t:'sbm',ph:'none'});return;}if(M.until&&t>=M.until&&M.tm.size>=MATCH.min)startRound(t,ctx);return;}
   if(M.ph==='round'&&t>=M.phaseEnd)return endRound(t,ctx);
   if(M.ph==='stop'&&t>=M.phaseEnd){if(Math.max(...M.wins)>=MATCH.winAt||M.rd>=MATCH.rounds)return finish(t,ctx);M.ph='break';M.phaseEnd=t+MATCH.breakMs;ctx.all(view(t));return;}
   if(M.ph==='break'&&t>=M.phaseEnd)return startRound(t,ctx);
   if(M.ph==='result'&&t>=M.phaseEnd){M=null;ctx.all({t:'sbm',ph:'none'});}
  },
  joinMsgs(t){return M?[view(t)]:[];},
  reset(){M=null;},
 };
}
