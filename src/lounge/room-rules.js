// 흡연장 자리 판정(11-17, 서버·화면 공용, three 없음 — server/Dockerfile에 들어감).
// 같은 방에서 두 사람이 거의 동시에 같은 자리를 누르면 서버(server/rooms.mjs)가 먼저 온 사람에게 주고, 늦은 사람에게는 {t:'lounge:no',what}만 보낸다.
//  - 벤치 좌판: act {p:'sit', b 벤치 번호, s 좌판 칸(0 가운데·1 오른쪽·2 왼쪽)} — 같은 b·s에 이미 앉은 사람이 있으면 'seat'
//  - 난간 지점: act {p:'lean', lx,lz 난간 지점(encodeLean)} — 기댄 사람과 RAIL_GAP(m) 안이면 'rail'
//  - 자판기: act can 1(뽑는 중)은 한 번에 한 사람 — 다른 사람이 뽑는 중이면 'vending'
// 고친 act는 서버가 기억해 새로 온 사람에게도 같은 상태로 보인다(늦은 사람은 서 있음·캔 그대로).
export const LOUNGE_RULES=Object.freeze({railGap:.4,grid:20,offset:100,seats:3});
// 난간 지점(m) ↔ act 정수 칸(0~65535). 5cm 칸, 옥상 좌표 −100~+3176m를 담는다.
export const encodeLean=(x,z)=>({lx:Math.max(0,Math.min(0xffff,Math.round((x+LOUNGE_RULES.offset)*LOUNGE_RULES.grid))),lz:Math.max(0,Math.min(0xffff,Math.round((z+LOUNGE_RULES.offset)*LOUNGE_RULES.grid)))});
export const decodeLean=a=>Number.isInteger(a?.lx)&&Number.isInteger(a?.lz)?{x:a.lx/LOUNGE_RULES.grid-LOUNGE_RULES.offset,z:a.lz/LOUNGE_RULES.grid-LOUNGE_RULES.offset}:null;
// 이 act가 차지하는 벤치 좌판 열쇠('b:s') — 앉지 않았으면 null
export const seatKey=a=>a?.p==='sit'&&Number.isInteger(a.b)?`${a.b}:${Number.isInteger(a.s)?a.s:0}`:null;
// 판정. me = 보낸 사람의 지난 act(없으면 null), a = 새 act(sanitizeAct 뒤), others = 같은 방 다른 사람들의 act 목록.
// → {a: 받아 줄 act(고쳐졌을 수 있음), deny: [보낸 사람에게만 보낼 메시지]}
export function checkLoungeAct(me,a,others=[]){
 const deny=[];let out={...a};
 const acts=others.filter(Boolean);
 const k=seatKey(out);
 if(k&&acts.some(o=>seatKey(o)===k)){deny.push({t:'lounge:no',what:'seat',b:out.b,s:Number.isInteger(out.s)?out.s:0});out=standUp(out);}
 if(out.p==='lean'){const p=decodeLean(out);
  if(p&&acts.some(o=>{if(o.p!=='lean')return false;const q=decodeLean(o);return q&&Math.hypot(q.x-p.x,q.z-p.z)<LOUNGE_RULES.railGap;})){deny.push({t:'lounge:no',what:'rail'});out=standUp(out);}}
 if(out.can===1&&me?.can!==1&&acts.some(o=>o.can===1)){deny.push({t:'lounge:no',what:'vending'});out.can=me?.can===2?2:0;}
 return {a:out,deny};
}
const standUp=a=>{const o={...a,p:'stand'};delete o.b;delete o.s;delete o.lx;delete o.lz;return o;};
