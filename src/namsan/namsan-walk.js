// 남산 걷기 규칙(월드개발 11-19). three를 쓰지 않는다(node --test로 검사). 화면은 src/namsan/game.js.
// 관악산 movement.js(GPX 337점·광장·정상 구역에 묶인 코드)는 건드리지 않고, 남산은 같은 걷기 속도 공식(route.js speedFor)만 빌려 쓴다.
//  - 걷는 곳: 코스 노면 폭 안(계단은 측벽 안쪽) + 출발 광장 + 정상 광장(전망탑 받침 밖). 그 밖으로 나가려 하면 길 가장자리를 따라 미끄러진다.
//  - 높이: 코스 위 = 코스 높이(계단 윗면, 그림 인계 §3), 광장 = 화면 지형 G.ground.
//  - 자동 걷기: 코스를 따라 정상 쪽으로(몇 m 앞 점을 겨눔). 끝에 닿으면 멈춘다.
//  - 진행: 코스에서 가장 멀리 간 거리(s), 스탬프 4곳(가까이 지나가면 찍힘), 정상 광장에 들어서면 완등.
import {speedFor} from '../route.js';
import {courseAt,NAMSAN} from './namsan-data.js';

export const NAMSAN_SAVE_KEY='namsan-hike:v1';
export const NAMSAN_ENTRY_KEY='aoworld:namsan-entry';   // 산 고르기(관악산 페이지) → 남산 페이지로 넘기는 입장 선택(허브·지난 선택)
// 함께 걷기: 등산과 같은 함께 걷기 서버에 붙고(서버 코드·서버 목록 SERVERS는 그대로), 방만 남산 방(hiking:남산)으로 나눈다.
// 같은 게임 좌표라 관악산 방에 섞이면 높이가 엉뚱해진다(받는 쪽이 자기 지형으로 높이를 구함).
// 남산 방은 서버 목록 밖 방이라 서버의 옛 규칙을 따른다: 20명이 차면 서버가 저절로 남산-2 방으로 넘긴다(그래서 줄은 하나).
// 서버 /health는 목록 밖 방 인원을 따로 주지 않으므로 인원 = 등산 전체 접속 − 관악산 서버 방 인원(namsanCount).
export const NAMSAN_SERVERS=Object.freeze({hiking:Object.freeze([Object.freeze({id:'1',name:'남산 서버',room:'남산-1'})])});
export const namsanRoom=()=>NAMSAN_SERVERS.hiking[0].room;
/** /health → 남산 방 인원(등산 체험 전체 − 관악산 서버 방). 모르면 null */
export function namsanCount(health){
 const all=health?.experiences?.hiking?.clients,rows=health?.servers?.hiking;
 if(!Number.isFinite(all)||!Array.isArray(rows))return null;
 return Math.max(0,all-rows.reduce((n,r)=>n+(Number.isFinite(r?.count)?r.count:0),0));
}
/** 서버 고르기 창에 줄 /health: 등산 줄을 남산 줄 하나로 바꾼다(인원 = namsanCount) */
export function namsanHealth(health){
 if(!health?.servers)return health;const n=namsanCount(health);
 return {...health,servers:{...health.servers,hiking:n===null?undefined:[{id:'1',name:'남산 서버',count:n}]}};
}
export const isNamsanRoom=room=>/^남산(-\d{1,3})?$/.test(String(room??''));

export const WALK=Object.freeze({
 body:.2,           // 동동이 몸 반지름 — 노면 가장자리에서 이만큼 안쪽까지 걷는다
 towerR:10.5+.6,    // 전망탑 받침(namsan-art TOWER.baseR) + 여유
 plazaEdge:1.2,     // 광장 둘레 돌 테 안쪽
 backward:.6,       // 뒷걸음 배율(관악산과 같음)
 run:1.55,          // 달리기 배율(동동이 TOON_RUN_SPEED와 같음)
 lookAhead:1.6,     // 자동 걷기: 이만큼 앞 코스 점을 겨눔(작을수록 굽이를 덜 질러감)
 stampR:6,          // 스탬프 자리(코스 점)에서 이 거리 안을 지나면 찍힘
 summitS:8,         // 코스 끝에서 이 거리 안 또는 정상 광장 안이면 완등
});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const halfWidth=p=>(p?.stairs?NAMSAN.stairWidth:NAMSAN.pathWidth)/2-WALK.body;

/** 걷는 곳 판정에 쓰는 자리 정보: 코스 최근접점·광장 거리 */
export function placeOf(G,x,z){
 const hit=G.nearest(x,z),p=G.points[hit.index]??G.points.at(-1);
 const P=G.plaza,S=G.startPlaza,tw=NAMSAN.tower;
 const inSummit=Math.hypot(x-P.x,z-P.z)<=P.r-WALK.plazaEdge&&Math.hypot(x-tw.x,z-tw.z)>=WALK.towerR;
 const inStart=Math.hypot(x-S.x,z-S.z)<=S.r-WALK.plazaEdge;
 const onCourse=hit.distance<=halfWidth(p);
 return {hit,stairs:!!p?.stairs,onCourse,inSummit,inStart,ok:onCourse||inSummit||inStart};
}
export const walkable=(G,x,z)=>placeOf(G,x,z).ok;
/** 발 디딤 높이: 코스 노면 위면 코스 높이(계단 윗면), 아니면 화면 지형 */
export function heightAt(G,x,z){
 const hit=G.nearest(x,z);
 return hit.distance<=NAMSAN.stairWidth/2+.4&&Number.isFinite(hit.y)?hit.y:G.ground(x,z);
}
/** 코스 위 투영을 지난 s 둘레(±win m)에서만 찾는다 — 굽은 곳에서 최근접 선분이 바뀌며 s(=높이)가 튀지 않게 */
export function projectLocal(G,x,z,s0,win=6){
 const P=G.points;let best={distance:Infinity,s:s0};
 for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if(b.s<s0-win||a.s>s0+win)continue;
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);
  if(d<best.distance)best={distance:d,s:a.s+(b.s-a.s)*t};}
 return best;
}
/** 내 몸 높이: 코스 위면 이어서 따라온 s의 코스 높이(계단 윗면), 광장이면 화면 지형 */
export function walkHeight(G,st){
 const pl=placeOf(G,st.x,st.z);
 if(pl.inSummit||pl.inStart){const g=G.ground(st.x,st.z);return pl.onCourse?Math.max(g,courseAt(G.points,st.s).y-.02):g;}
 return courseAt(G.points,st.s).y;
}
/** 코스 기울기(오르막 +). 앞뒤 2m 높이 차 ÷ 4m */
export function courseSlope(G,s){const a=courseAt(G.points,s-2),b=courseAt(G.points,s+2);return (b.y-a.y)/4;}

export function createWalkState(G,saved=null){
 const p0=courseAt(G.points,2),st={x:p0.x,z:p0.z,heading:p0.heading,s:2,best:2,elapsed:0,distance:0,ascent:0,stamps:[],done:false,auto:false,running:false};
 if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.z)&&walkable(G,saved.x,saved.z)&&!saved.done){
  Object.assign(st,{x:saved.x,z:saved.z,heading:Number.isFinite(saved.heading)?saved.heading:st.heading,s:saved.s??st.s,best:saved.best??saved.s??st.s,elapsed:saved.elapsed||0,distance:saved.distance||0,ascent:saved.ascent||0,stamps:Array.isArray(saved.stamps)?saved.stamps.filter(n=>NAMSAN.stamps.some(t=>t.n===n)):[]});
 }
 return st;
}
export const saveData=st=>({x:+st.x.toFixed(2),z:+st.z.toFixed(2),heading:+st.heading.toFixed(3),s:+st.s.toFixed(1),best:+st.best.toFixed(1),elapsed:Math.round(st.elapsed),distance:Math.round(st.distance),ascent:Math.round(st.ascent),stamps:st.stamps,done:st.done});

/** 지금 자리에서 걷는 속도(m/s). 관악산과 같은 공식: 계단 0.5m/s, 오르막은 느려짐 */
export function speedAt(G,st,dirX,dirZ,{run=false,backward=false}={}){
 const pl=placeOf(G,st.x,st.z);let v;
 if(pl.onCourse&&!pl.inSummit&&!pl.inStart){
  const k=courseAt(G.points,pl.hit.s),along=dirX*k.tx+dirZ*k.tz,dir=along<0?-1:1,slope=courseSlope(G,pl.hit.s)*dir;
  v=speedFor(slope,pl.stairs?'stairs':'paved',dir);
 }else v=speedFor(0,'paved',1);
 return v*(run&&!pl.stairs?WALK.run:1)*(backward?WALK.backward:1);
}

/**
 * 한 프레임 걷기. input = {forward,side,yaw(카메라가 보는 방향, 라디안·관악산 heading과 같은 기준),run,auto}
 * 돌려줌: {moved(m), speed(m/s), heading(이동 방향), stairs, stamp(새로 찍은 스탬프 번호|null), summit(이번에 완등)}
 */
export function stepWalk(G,st,input,dt){
 const out={moved:0,speed:0,heading:st.heading,stairs:false,stamp:null,summit:false};
 if(!(dt>0))return out;dt=Math.min(dt,.1);
 let f=Math.sign(input.forward||0),side=Math.sign(input.side||0);const direct=!!(f||side);
 if(direct)st.auto=false;
 let dx=0,dz=0,backward=false;
 if(direct){
  const yaw=input.yaw??st.heading,fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
  dx=fx*f+rx*side;dz=fz*f+rz*side;backward=f<0&&!side;
 }else if(st.auto){
  const end=G.points.at(-1).s;
  if(st.s>=end-.5||st.done){st.auto=false;}
  else{const t=courseAt(G.points,Math.min(end,st.s+WALK.lookAhead));dx=t.x-st.x;dz=t.z-st.z;}
 }
 const len=Math.hypot(dx,dz);if(len<1e-6){st.running=false;return out;}
 dx/=len;dz/=len;
 const run=!!input.run&&!backward;st.running=run;
 const v=speedAt(G,st,dx,dz,{run,backward}),budget=v*dt;
 // 막히면 앞뒤 성분 하나만 → 그래도 막히면 코스 쪽으로 당긴 자리(가장자리 미끄러짐)
 const tries=[[dx,dz],[dx,0],[0,dz]];let nx=null,nz=null;
 for(const [ux,uz] of tries){const l=Math.hypot(ux,uz);if(l<1e-6)continue;const x=st.x+ux/l*budget*(l<1?l:1),z=st.z+uz/l*budget*(l<1?l:1);if(walkable(G,x,z)){nx=x;nz=z;break;}}
 if(nx===null){const x=st.x+dx*budget,z=st.z+dz*budget,pl=placeOf(G,x,z),k=courseAt(G.points,pl.hit.s),lim=halfWidth(G.points[pl.hit.index]);
  const ox=x-k.x,oz=z-k.z,d=Math.hypot(ox,oz)||1,cx=k.x+ox/d*Math.min(d,lim*.98),cz=k.z+oz/d*Math.min(d,lim*.98);
  if(walkable(G,cx,cz)&&Math.hypot(cx-st.x,cz-st.z)<=budget*1.05+1e-6){nx=cx;nz=cz;}}
 if(nx===null){st.running=false;return out;}
 const y0=walkHeight(G,st),moved=Math.hypot(nx-st.x,nz-st.z);
 out.heading=Math.atan2(-(nx-st.x),-(nz-st.z));
 st.x=nx;st.z=nz;st.distance+=moved;
 if(!direct)st.heading=out.heading;
 const pl=placeOf(G,nx,nz);
 // 진행 거리: 코스 가까이에서만 지난 s 둘레로 이어서 잰다(광장 안 자유 걷기는 가까운 코스 점 / 정상 광장은 끝)
 {const q=projectLocal(G,nx,nz,st.s);if(q.distance<4)st.s=q.s;else if(pl.inSummit)st.s=G.points.at(-1).s;else if(pl.hit.distance<4)st.s=pl.hit.s;}
 const y1=walkHeight(G,st);if(y1>y0)st.ascent+=y1-y0;
 st.best=Math.max(st.best,st.s);
 out.moved=moved;out.speed=moved/dt;out.stairs=pl.onCourse&&pl.stairs&&!pl.inSummit&&!pl.inStart;
 out.stamp=checkStamp(G,st);
 if(!st.done&&(pl.inSummit||st.s>=G.points.at(-1).s-WALK.summitS)){st.done=true;st.auto=false;out.summit=true;
  const top=NAMSAN.stamps.at(-1);if(!st.stamps.includes(top.n)){st.stamps.push(top.n);out.stamp??=top.n;}} // 정상 스탬프는 정상 광장에 들어서면 찍힘
 return out;
}
/** 스탬프 자리 근처면 찍는다(한 번만). 새로 찍은 번호 또는 null */
export function checkStamp(G,st){
 for(const t of NAMSAN.stamps){if(st.stamps.includes(t.n))continue;const k=courseAt(G.points,t.s);if(Math.hypot(st.x-k.x,st.z-k.z)<=WALK.stampR){st.stamps.push(t.n);return t.n;}}
 return null;
}
/** 남은 거리(m)·지금 높이(m) */
export const remainOf=(G,st)=>Math.max(0,G.points.at(-1).s-st.s);
/** 코스 위 s 자리로 바로 옮김(개발용 구간 이동·점검). 걸은 기록은 안 늘린다 */
export function jumpTo(G,st,s){const k=courseAt(G.points,Math.max(0,Math.min(G.points.at(-1).s,s)));st.x=k.x;st.z=k.z;st.s=k.x===undefined?st.s:Math.max(0,Math.min(G.points.at(-1).s,s));st.heading=k.heading;st.auto=false;return st;}
export {wrap as wrapAngle};
