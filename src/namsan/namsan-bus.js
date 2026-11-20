// 남산 순환버스 시간표·타기(한 게임 통합 5단계, 월드개발 11-20). three를 쓰지 않는다(node --test로 검사).
// 구현안 docs/남산/남산-순환버스-구현안-v1.md, 그림 docs/남산/남산-순환버스-그림-에셋-v1.md(G.bus.cycle·stops).
//  - 모든 화면이 같은 시계(Date.now)로 같은 버스를 본다(서버 안 바꿈, 크리스마스 케이블카와 같은 방식).
//  - 버스 2대가 닫힌 길(cycle, 약 4.1km)을 반 바퀴 간격으로 돈다: 백범광장 정류장 12초 → 정상 정류장까지 달림 → 12초 → 다시 백범광장.
//  - 속도 10m/s(시속 36km): 함께 걷기 서버 위치 한도(12m/s) 안이라 서버를 다시 켤 필요가 없다.
//  - 탄 사람 자리 = 그 버스 의자. 정상 정류장에 서면 내린다. 「건너뛰기」는 바로 내린 자리로(구간 이동처럼 기록에는 안 넣음).
export const BUS_RULE=Object.freeze({speed:10,dwell:12,buses:2,doors:1.5,board:14});
const mod=(a,n)=>((a%n)+n)%n;

/** 시간표. cycle = G.bus.cycle({length}), stops = G.bus.stops({start:{s},summit:{s}}) */
export function createBusTimetable(cycle,stops,rule=BUS_RULE){
 const L=cycle.length??cycle.points.at(-1).s,s0=stops.start.s,s1=stops.summit.s,v=rule.speed,D=rule.dwell;
 const up=mod(s1-s0,L),down=L-up,T=2*D+L/v,tUp=up/v,tDown=down/v;
 // 한 대의 한 바퀴 안 시각 u(0~T) → 자리. 0~D 백범광장에 섬, ~D+tUp 오름, ~2D+tUp 정상에 섬, 나머지 내려옴
 function at(u){u=mod(u,T);
  if(u<D)return {s:s0,leg:'start',stop:'start',left:D-u,doors:door(u,D)};
  if(u<D+tUp)return {s:mod(s0+(u-D)*v,L),leg:'up',stop:null,left:0,doors:0};
  if(u<2*D+tUp){const w=u-D-tUp;return {s:s1,leg:'summit',stop:'summit',left:D-w,doors:door(w,D)};}
  return {s:mod(s1+(u-2*D-tUp)*v,L),leg:'down',stop:null,left:0,doors:0};}
 const door=(w,d)=>Math.min(1,w/rule.doors,(d-w)/rule.doors);
 const offset=k=>k*T/rule.buses;
 /** 버스 k의 지금 자리(clock = 초) */
 const bus=(k,clock)=>({k,...at(clock+offset(k))});
 /** 정류장 stop('start'|'summit')에 다음 버스가 서기까지 남은 초(지금 서 있으면 0)와 그 버스 번호 */
 function next(stop,clock){let best=null;
  for(let k=0;k<rule.buses;k++){const u=mod(clock+offset(k),T),t0=stop==='start'?0:D+tUp,wait=u>=t0&&u<t0+D?0:mod(t0-u,T);
   if(!best||wait<best.wait)best={k,wait,left:wait===0?t0+D-u:D};}
  return best;}
 return {L,T,up,down,tUp,tDown,rule,at,bus,next,
  /** 내릴 정류장까지 남은 초(타고 있는 버스 k) */
  untilStop:(k,clock,to)=>{const u=mod(clock+offset(k),T),t0=to==='start'?0:D+tUp;return mod(t0-u,T);}};
}
/** 정류장 반대쪽 */
export const otherStop=stop=>stop==='start'?'summit':'start';
/** 남은 초 → '1:24' */
export const mmss=sec=>{sec=Math.max(0,Math.ceil(sec));return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;};
