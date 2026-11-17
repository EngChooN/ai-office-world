// 눈썰매 레이스 판정(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §1-3). 순수 모듈 — 서버(room-play.js)와 혼자·내 컴퓨터 모드 화면이 같이 쓴다.
//  - 출발대에서 「레이스 열기」 → 10초 동안 다른 사람이 「같이 하기」(최대 4명, 줄 1~4) → (연 사람이 「바로 출발」하면 바로) 3·2·1 → 출발.
//  - 같이 탄 썰매끼리 부딪힘 없음, 순위만. 결승 기록은 각 화면이 보고(sr:fin), 처음 들어온 뒤 15초 안에 못 들어오면 「완주 못 함」.
//  - 오늘의 기록판: 이 방 오늘(서울 날짜) 최고 5명(이름·시간). 혼자 타기 기록(sr:rec)도 들어간다. 빈 방 초기화는 트리와 같음(방 상태째 지움).
// 규격(클라이언트 → 판정): sr:open {lane} · sr:join {lane} · sr:go · sr:quit · sr:fin {ms, sp:[구간1,구간2]} · sr:rec {ms}
//  판정 → 방 모두: {t:'sr', id, ph:'wait'|'count'|'run'|'done', host, left(ms, 대기 남은), go(ms, 출발까지), r:[{id,n,lane,ms?,dnf?,rank?}]}, {t:'sr:board', b:[{n,ms}]}
//  못 하면 보낸 사람 {t:'sr:no', reason}
// 코스 시드(11-17 2차): 방마다 지금 코스 하나 {t:'sc', seed}(들어올 때·바뀔 때 모두에게). 같은 방 = 같은 코스.
//  - 처음은 오늘(서울)의 시드. 「새 코스」 sc:new → 아무도 타고 있지 않을 때만(act.sl 5·6이 없고 레이스가 달리는 중이 아님) 새 시드, 아니면 {t:'sc:no',reason:'riding'}.
//  - 레이스를 열면(sr:open) 타는 사람이 없을 때 새 코스를 뽑는다(판마다 다른 코스). 레이스 view에도 seed가 들어가 참가자는 그 코스로 탄다.
//  - 기록판은 코스마다 따로(sr:board {seed, b}). sr:fin·sr:rec에 seed를 함께 보내고, 지금 코스와 다르면 기록하지 않는다.
export const RACE=Object.freeze({waitMs:10000,countMs:3000,max:4,lateMs:15000,keepMs:20000,board:5,minMs:30000,maxMs:300000,seeds:12});
const seoulDay=t=>new Date(t+9*3600e3).toISOString().slice(0,10);
const num=v=>typeof v==='number'&&Number.isFinite(v);
import {dailySeed,normSeed} from './sled-course.js';

export function createSledRace({now=()=>Date.now(),rand=Math.random}={}){
 let race=null,seq=0,seed=null;const board=[]; // {n,ms,id,day,seed}
 const seedNow=t=>seed??(seed=dailySeed(t));
 const newSeed=()=>{let s=normSeed(Math.floor(rand()*4294967295));if(s===seed)s=normSeed(s+0x9E3779B9);return s;};
 const riding=(ctx,me=null)=>[...ctx.members.values()].some(o=>o.id!==me&&o.act?.sl>=5)||(race&&race.ph==='run');
 const courseMsg=t=>({t:'sc',seed:seedNow(t)});
 const view=t=>{if(!race)return null;const r=race;
  return {t:'sr',id:r.id,ph:r.ph,host:r.host,seed:r.seed,left:r.ph==='wait'?Math.max(0,r.until-t):0,go:r.ph==='count'?Math.max(0,r.goAt-t):r.ph==='run'?-(t-r.goAt):0,
   r:[...r.riders.values()].map(x=>({id:x.id,n:x.n,lane:x.lane,...(x.ms!=null?{ms:x.ms}:{}),...(x.dnf?{dnf:1}:{}),...(x.rank?{rank:x.rank}:{})}))};};
 const boardView=t=>{const day=seoulDay(t),sd=seedNow(t);return {t:'sr:board',seed:sd,b:board.filter(x=>x.day===day&&x.seed===sd).slice(0,RACE.board).map(x=>({n:x.n,ms:x.ms}))};};
 function record(id,n,ms,t,ctx,sd=seedNow(t)){
  if(!num(ms)||ms<RACE.minMs||ms>RACE.maxMs)return false;
  const day=seoulDay(t);for(let i=board.length-1;i>=0;i--)if(board[i].day!==day)board.splice(i,1);
  // 한 사람은 코스마다 가장 좋은 기록 하나만
  const mine=board.find(x=>x.id===id&&x.seed===sd);if(mine){if(mine.ms<=ms)return false;board.splice(board.indexOf(mine),1);}
  board.push({id,n,ms:Math.round(ms),day,seed:sd});board.sort((a,b)=>a.ms-b.ms);
  // 코스는 최근 RACE.seeds개만, 코스마다 20명까지
  {const seeds=[...new Set(board.map(x=>x.seed))];const keep=new Set([sd,...seeds.filter(x=>x!==sd).slice(-(RACE.seeds-1))]);for(let i=board.length-1;i>=0;i--)if(!keep.has(board[i].seed)||board.filter(x=>x.seed===board[i].seed).indexOf(board[i])>=20)board.splice(i,1);}
  ctx.all(boardView(t));return true;
 }
 function settle(t,ctx){if(!race||race.ph==='done')return;const r=race,fin=[...r.riders.values()].filter(x=>x.ms!=null).sort((a,b)=>a.ms-b.ms);
  fin.forEach((x,i)=>x.rank=i+1);for(const x of r.riders.values())if(x.ms==null)x.dnf=true;r.ph='done';r.doneAt=t;ctx.all(view(t));}
 return {
  view,boardView,courseMsg,get race(){return race;},get seed(){return seedNow(now());},
  // 지금 코스 바꾸기(타는 사람이 없을 때만). 바꿨으면 true
  setSeed(sd,t,ctx){seed=normSeed(sd);ctx.all(courseMsg(t));ctx.all(boardView(t));return true;},
  handle(c,m,t,ctx){
   const no=reason=>ctx.send(c.id,{t:'sr:no',reason});
   switch(m.t){
    case 'sc:new':{if(riding(ctx,c.id))return ctx.send(c.id,{t:'sc:no',reason:'riding'});if(race&&race.ph!=='done')return ctx.send(c.id,{t:'sc:no',reason:'race'});
     this.setSeed(newSeed(),t,ctx);return;}
    case 'sr:open':{const lane=m.lane|0;if(lane<1||lane>RACE.max)return no('bad');
     if(race&&race.ph!=='done')return no(race.ph==='wait'?'open':'busy');
     // 판마다 다른 코스: 아무도 타고 있지 않으면 새 시드
     if(!riding(ctx,c.id))this.setSeed(newSeed(),t,ctx);
     race={id:`r${(++seq).toString(36)}`,ph:'wait',host:c.id,seed:seedNow(t),until:t+RACE.waitMs,goAt:0,firstAt:0,riders:new Map([[c.id,{id:c.id,n:c.name,lane}]])};
     ctx.all(view(t));return;}
    case 'sr:join':{const lane=m.lane|0;if(!race||race.ph!=='wait')return no('closed');if(race.riders.has(c.id))return;
     if(race.riders.size>=RACE.max)return no('full');
     const used=new Set([...race.riders.values()].map(x=>x.lane));let l=lane>=1&&lane<=RACE.max&&!used.has(lane)?lane:0;
     if(!l)for(let k=1;k<=RACE.max;k++)if(!used.has(k)){l=k;break;}
     race.riders.set(c.id,{id:c.id,n:c.name,lane:l});ctx.all(view(t));return;}
    case 'sr:go':if(race?.ph==='wait'&&race.host===c.id){race.ph='count';race.goAt=t+RACE.countMs;ctx.all(view(t));}return;
    case 'sr:quit':{if(!race||!race.riders.has(c.id))return;
     if(race.ph==='wait'||race.ph==='count'){race.riders.delete(c.id);if(!race.riders.size){race=null;ctx.all({t:'sr',id:'',ph:'none'});return;}if(race.host===c.id)race.host=race.riders.keys().next().value;ctx.all(view(t));}
     else if(race.ph==='run'){const x=race.riders.get(c.id);if(x.ms==null)x.dnf=true;this.tick(t,ctx,true);}
     return;}
    case 'sr:fin':{const x=race?.riders.get(c.id);if(!x||race.ph!=='run'||x.ms!=null)return;
     const ms=num(m.ms)?Math.round(m.ms):NaN;if(!(ms>=RACE.minMs&&ms<=RACE.maxMs))return no('bad');
     // 화면 시계와 서버 시계가 크게 어긋나면(출발 뒤 지난 시간보다 2초 넘게 빠름) 서버 시간
     x.ms=Math.max(ms,t-race.goAt-2000);if(Array.isArray(m.sp))x.sp=m.sp.slice(0,3).filter(num).map(Math.round);
     if(!race.firstAt)race.firstAt=t;if(normSeed(m.seed)===race.seed&&race.seed===seedNow(t))record(c.id,c.name,x.ms,t,ctx,race.seed);ctx.all(view(t));this.tick(t,ctx,true);return;}
    case 'sr:rec':if(normSeed(m.seed)!==seedNow(t))return;return void record(c.id,c.name,m.ms,t,ctx);
   }
  },
  // 10Hz(서버 tick): 대기 끝 → 카운트다운 → 출발, 늦은 사람 정리, 끝난 레이스 지우기. 나간 사람은 빠짐
  tick(t,ctx,force=false){
   if(!race)return;const r=race;
   for(const id of [...r.riders.keys()])if(!ctx.members.has(id)){if(r.ph==='run'){const x=r.riders.get(id);if(x.ms==null)x.dnf=true;}else r.riders.delete(id);}
   if(!r.riders.size&&r.ph!=='done'){race=null;ctx.all({t:'sr',id:'',ph:'none'});return;}
   if(r.ph==='wait'&&!r.riders.has(r.host))r.host=r.riders.keys().next().value;
   if(r.ph==='wait'&&t>=r.until){r.ph='count';r.goAt=t+RACE.countMs;ctx.all(view(t));return;}
   if(r.ph==='count'&&t>=r.goAt){r.ph='run';ctx.all(view(t));return;}
   if(r.ph==='run'){const all=[...r.riders.values()];if(all.every(x=>x.ms!=null||x.dnf)||(r.firstAt&&t-r.firstAt>=RACE.lateMs))settle(t,ctx);else if(force)ctx.all(view(t));return;}
   if(r.ph==='done'&&t-r.doneAt>=RACE.keepMs)race=null;
  },
  joinMsgs(t){const out=[courseMsg(t),boardView(t)];const v=view(t);if(v&&race.ph!=='done')out.push(v);return out;},
  reset(){race=null;board.length=0;seed=null;},
 };
}
