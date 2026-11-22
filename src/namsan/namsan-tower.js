// 남산 전망탑 들어가기 규칙(월드개발 11-22). three를 쓰지 않는다(node --test, tests/namsan-tower.test.mjs). 그림은 namsan-tower-art.js, 연결은 game.js.
// 정상 광장 탑 받침 문 앞에서 F(휴대폰은 할 일 칩) → 엘리베이터 연출(층 표시·흔들림, 건너뛰기) → 탑 원반 안 실내 전망대 한 층.
//  - 전망대는 그림 탑(namsan-art TOWER) 전망 원반 안, 실제 높이(광장 + 114.6m)에 만든다. 그래서 유리창 밖은 그 높이에서 본 진짜 게임 속 서울이다.
//  - 걷는 곳 = 엘리베이터 기둥과 유리창 사이 고리(DECK.rMin~rMax). 자동 걷기는 유리창을 따라 한 바퀴 돈다.
//  - 함께 걷기: 전망대 안에서는 구역(zone)을 'summit'으로 보낸다(서버 그대로, 구역 코드 0~2). 받는 쪽은 'summit' + 탑 안 자리면 전망대 바닥 높이에 그린다.
//    광장 사람('plaza')과 인사 칩 대상이 섞이지 않는다(multi-client는 같은 구역끼리만 인사).
//  - 실제 N서울타워 사진·로고·층 이름은 쓰지 않는다. 층 숫자와 높이는 게임 속 탑 기준(그림 TOWER 값)이다.
import {TOWER_SHAPE} from './namsan-tower-shape.js';

export const DECK=Object.freeze({
 floor:TOWER_SHAPE.podMid+.6,   // 전망 원반 창 띠 아래 끝(그림 '전망 원반 창 띠' P+0.6) = 바닥 윗면, 광장 높이 기준
 height:4.3,                    // 천장
 core:5.0,                      // 엘리베이터 기둥 반지름(그림 탑 기둥 꼭대기 4.7 + 벽)
 rMin:5.7,                      // 걷는 고리 안쪽(기둥 + 몸)
 rMax:12.5,                     // 걷는 고리 바깥(창턱 12.9 - 몸·손잡이)
 sill:12.9,                     // 창턱 안쪽 면
 glass:13.35,                   // 유리 띠(그림 원반 반지름 13.5 안쪽)
 speed:1.25,                    // 걷기 m/s(남산 평지 걷기와 비슷하게)
 run:1.55,                      // 달리기 배율(namsan-walk WALK.run과 같음)
 autoR:11.6,                    // 자동 걷기 고리 반지름(유리창 가까이)
});
// 엘리베이터 연출(초). 올라가기 = 문 닫힘 0.6 → 오르기 3.0 → 문 열림 0.6 = 4.2초, 내려가기 3.4초. 「건너뛰기」는 문이 열리는 단계로 바로
export const ELEVATOR=Object.freeze({
 up:Object.freeze({close:.6,move:3.0,open:.6}),
 down:Object.freeze({close:.5,move:2.4,open:.5}),
 floors:5,                      // 게임 속 층 표시: 1 → 2 → … → 5 → 「전망」
});
// 망원경 4대: 방향은 쌍안경 명소 자료(NS_LANDMARKS)에서 고른 곳 쪽
export const SCOPE_TARGETS=Object.freeze(['lm-bukhan','lm-lotte','lm-gwanak','lm-63']);

const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// 방위(도, 북 0 · 시계 방향) ↔ 화면 방향. 북쪽 = −z. 걷는 heading은 앞 = (−sin h, −cos h)
export const bearingToDir=b=>{const r=b*Math.PI/180;return {x:Math.sin(r),z:-Math.cos(r)};};
export const dirToBearing=(dx,dz)=>((Math.atan2(dx,-dz)*180/Math.PI)+360)%360;
export const headingFor=(dx,dz)=>Math.atan2(-dx,-dz);
export const compass8=b=>['북','북동','동','남동','남','남서','서','북서'][Math.round(((b%360)+360)%360/45)%8];

/** 탑 둘레에서 문(엘리베이터 입구)을 낼 방위 고르기. want = 바라는 방위(코스 끝·버스 하차 쪽), avoid = [{x,z,r}], walkable(x,z) = 걷는 곳인지.
 *  문 앞 서는 자리 = 탑 가운데에서 받침 반지름 + 1.15m. 돌려줌 {bearing, door:{x,z}, stand:{x,z,heading(문을 봄)}} */
export function planTowerEntrance(tower,{want=180,avoid=[],walkable=()=>true,baseR=TOWER_SHAPE.baseR,standGap=1.15}={}){
 let best=null;
 for(let k=0;k<=72;k++){const d=(k%2?1:-1)*Math.ceil(k/2)*5,b=(want+d+360)%360,u=bearingToDir(b);
  const stand={x:tower.x+u.x*(baseR+standGap),z:tower.z+u.z*(baseR+standGap)},far={x:tower.x+u.x*(baseR+4.5),z:tower.z+u.z*(baseR+4.5)};
  if(!walkable(stand.x,stand.z)||!walkable(far.x,far.z))continue;
  if(avoid.some(o=>Math.hypot(o.x-stand.x,o.z-stand.z)<o.r||Math.hypot(o.x-far.x,o.z-far.z)<o.r))continue;
  best={bearing:b,door:{x:tower.x+u.x*baseR,z:tower.z+u.z*baseR},stand:{...stand,heading:headingFor(-u.x,-u.z)}};break;}
 if(!best){const u=bearingToDir(want);best={bearing:want,door:{x:tower.x+u.x*baseR,z:tower.z+u.z*baseR},stand:{x:tower.x+u.x*(baseR+standGap),z:tower.z+u.z*(baseR+standGap),heading:headingFor(-u.x,-u.z)}};}
 return best;
}

/** 전망대 자리 계획. tower = {x,z}, plazaY = 광장 높이, entranceBearing = 문 방위(엘리베이터 문도 같은 쪽을 봄),
 *  landmarks = [{id,name,lat,lon}], geo(lat,lon) → {x,z}. 돌려줌 {y(바닥 높이), arrive(엘리베이터 앞 자리), exit(나가기 후보), scopes, labels} */
export function planDeck(tower,{plazaY=0,entranceBearing=180,landmarks=[],geo=null}={}){
 const y=plazaY+DECK.floor,at=(b,r)=>{const u=bearingToDir(b);return {x:tower.x+u.x*r,z:tower.z+u.z*r};};
 const eb=entranceBearing,eu=bearingToDir(eb);
 const arrive={...at(eb,DECK.core+3.6),heading:headingFor(eu.x,eu.z)};   // 문 앞에서 바깥(유리창)을 봄. 3인칭 카메라가 뒤 기둥에 막히지 않게 3.6m 앞
 const exit={id:'tower-exit',...at(eb,DECK.core+.55),bearing:eb};
 const labels=landmarks.map(lm=>{if(!geo)return null;const q=geo(lm.lat,lm.lon),dx=q.x-tower.x,dz=q.z-tower.z,km=Math.hypot(dx,dz)/1000,b=dirToBearing(dx,dz);
  return {id:lm.id,name:lm.name,bearing:b,km,compass:compass8(b)};}).filter(Boolean).sort((a,b)=>a.bearing-b.bearing);
 // 이름판이 겹치면(같은 쪽 6° 안) 위아래 두 줄로 나눈다
 labels.forEach((l,i)=>{const prev=labels[i-1];l.row=prev&&Math.abs(l.bearing-prev.bearing)<6&&prev.row===0?1:0;});
 const scopes=SCOPE_TARGETS.map((id,i)=>{const l=labels.find(x=>x.id===id);if(!l)return null;
  // 엘리베이터 문 앞(arrive)과 겹치면 옆으로 비킨다
  let b=l.bearing;const dd=wrap((b-eb)*Math.PI/180)*180/Math.PI;if(Math.abs(dd)<14)b=(eb+(dd<0?-16:16)+360)%360;
  const u=bearingToDir(b),post=at(b,DECK.sill-.45),stand=at(b,DECK.sill-1.25);
  return {id:`tower-scope-${i+1}`,target:l.id,name:l.name,bearing:b,x:post.x,z:post.z,stand:{...stand,heading:headingFor(u.x,u.z)},km:l.km};}).filter(Boolean);
 return {y,tower:{x:tower.x,z:tower.z},arrive,exit,scopes,labels,entranceBearing:eb};
}

// 전망대 안인지(자리만으로): 탑 받침 반지름 안이면 땅에서는 못 서는 곳이라 전망대로 본다
export const inTowerXZ=(tower,x,z)=>Math.hypot(x-tower.x,z-tower.z)<DECK.glass;

/** 전망대 한 프레임 걷기. st = {x,z,heading,auto,running}, input = {forward,side,yaw,run,auto}. 고리 안으로만, 기둥·창턱에서 미끄러짐.
 *  돌려줌 {moved,speed,heading} — heading = 걸은 방향(몸이 돌 방향) */
export function deckWalk(st,tower,input,dt,{blocks=[]}={}){
 const out={moved:0,speed:0,heading:st.heading};if(!(dt>0))return out;dt=Math.min(dt,.1);
 const f=Math.sign(input.forward||0),side=Math.sign(input.side||0),direct=!!(f||side);
 if(direct)st.auto=false;
 let dx=0,dz=0;
 if(direct){const yaw=input.yaw??st.heading;dx=-Math.sin(yaw)*f+Math.cos(yaw)*side;dz=-Math.cos(yaw)*f-Math.sin(yaw)*side;}
 else if(st.auto){ // 유리창을 따라 시계 반대 방향(위에서 볼 때)으로: 고리 반지름 쪽으로 천천히 붙으며 접선 방향
  const ox=st.x-tower.x,oz=st.z-tower.z,r=Math.hypot(ox,oz)||1,tx=oz/r,tz=-ox/r,pull=(DECK.autoR-r)*.6;
  dx=tx+ox/r*pull;dz=tz+oz/r*pull;}
 const len=Math.hypot(dx,dz);if(len<1e-6){st.running=false;return out;}
 dx/=len;dz/=len;const back=f<0&&!side,run=!!input.run&&!back;st.running=run;
 const v=DECK.speed*(run?DECK.run:1)*(back?.6:1);
 let nx=st.x+dx*v*dt,nz=st.z+dz*v*dt;
 // 고리 안으로 되돌림(미끄러짐) + 망원경 기둥 같은 작은 막힘 [{x,z,r}]
 const ox=nx-tower.x,oz=nz-tower.z,r=Math.hypot(ox,oz)||1e-6,cr=Math.min(DECK.rMax,Math.max(DECK.rMin,r));
 if(cr!==r){nx=tower.x+ox/r*cr;nz=tower.z+oz/r*cr;}
 for(const b of blocks){const bx=nx-b.x,bz=nz-b.z,d=Math.hypot(bx,bz);if(d<b.r&&d>1e-6){nx=b.x+bx/d*b.r;nz=b.z+bz/d*b.r;}}
 const moved=Math.hypot(nx-st.x,nz-st.z);st.x=nx;st.z=nz;
 out.moved=moved;out.speed=moved/dt;out.heading=headingFor(dx,dz);return out;
}

/** 엘리베이터 연출 시각 t(초)의 모습. dir 'up'|'down'.
 *  돌려줌 {phase:'close'|'move'|'open'|'done', doors 0(열림)~1(닫힘), floor 표시 글, progress 0~1(오르기), shake 0~1, swap(이 시각에 자리를 옮겨도 되는지 = 문이 닫힘)} */
export function elevatorAt(dir,t){
 const E=ELEVATOR[dir]??ELEVATOR.up,n=ELEVATOR.floors,total=E.close+E.move+E.open;
 const label=k=>{const f=Math.min(n,1+Math.floor(k*n));return dir==='up'?(k>=1?'전망':String(f)):(k>=1?'1':(k<=0?'전망':String(n+1-f)));};
 if(t<E.close){const k=t/E.close;return {phase:'close',doors:k,floor:dir==='up'?'1':'전망',progress:0,shake:0,swap:false,total};}
 if(t<E.close+E.move){const k=(t-E.close)/E.move;return {phase:'move',doors:1,floor:label(k),progress:k,shake:Math.sin(Math.PI*k),swap:true,total};}
 if(t<total){const k=(t-E.close-E.move)/E.open;return {phase:'open',doors:1-k,floor:dir==='up'?'전망':'1',progress:1,shake:0,swap:true,total};}
 return {phase:'done',doors:0,floor:dir==='up'?'전망':'1',progress:1,shake:0,swap:true,total};
}
// 건너뛰기: 문이 열리는 단계 시작 시각
export const elevatorSkipTo=dir=>{const E=ELEVATOR[dir]??ELEVATOR.up;return E.close+E.move;};
// 게임 속 높이 글(광장 기준). 실제 탑 높이가 아니다
export const deckHeightText=()=>`광장에서 약 ${Math.round(DECK.floor)}m · 게임 속 탑 높이`;
