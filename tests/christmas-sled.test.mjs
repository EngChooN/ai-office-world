// 눈썰매(월드개발, 2026-11-17 · 2차: 긴 코스·판마다 다른 코스·조작감·케이블카):
//  코스 생성(길이·마을 경계·겹침·블록 구성), 시드 동일성(같은 시드 = 같은 코스, 같은 방 = 같은 시드), 완주 가능·막다른 길 없음·점프 착지 안전,
//  자동 시뮬레이션 시간대(보통 실력 60~75초), 조작(속도에 따른 회전·드리프트·부드러운 튕김·터치 데드존), 레이스·기록판(코스별), 케이블카(높이·시간·건너뛰기·서버 한도).
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCourse,planCourse,dailySeed,normSeed,courseCode,mountainH,heightU,skeletonAt,START_H,COURSE_W,NARROW_W,WIDE_W,TUNNEL_W,MIN_RACE_W,FINISH_U,SKELETON_END,TURN_SPANS,ROW_SPANS,BLOCKS,SUMMIT} from '../src/christmas/sled-course.js';
import {setSledFeel,sledFeel,sledFeelFrom,SLED_RULES_2,SLED_RULES_3,createRide,SLED_RULES,SLED_SENS,SLED_HALF,turnRateAt,simulateRide,createHumanBot,botSteer,courseGrip,createGhostRecorder,ghostAt,starsOf,starTimes,laneOffset,PAR_NORMAL,createSledCam,SLED_CAM_OLD_PSI,headingOf,SLED_FEEL_VERSION} from '../src/christmas/sled.js';
import {createSledRace,RACE,BOARD_FEEL} from '../src/christmas/sled-race.js';
import {XMAS_PLAY_MESSAGES} from '../src/christmas/room-play.js';
import {dragSteer,DRAG} from '../src/christmas/sled-play.js';
import {GONDOLA,CABLE,CABLE_LEN,TOWERS,cabinAt,cabinYAt,rideFraction,createGondolaRide,nearStation} from '../src/christmas/gondola.js';
import * as L from '../src/christmas/layout.js';
import {inNorthGap,collideXmas} from '../src/christmas/collide.js';
import {createRooms} from '../server/rooms.mjs';
import {PLAY_TYPES} from '../src/christmas/multi.js';
import {EXPERIENCE_MESSAGES,sanitizeAct,NET} from '../src/multi-protocol.js';

const T0=9_000_000;
// 11-18: 조작감 3(직접 조작)이 기본. 조작감 1·2 수치 시험은 비교용으로 남기고 그 시험 안에서만 바꾼다
const feelN=n=>fn=>()=>{setSledFeel(n);try{fn();}finally{setSledFeel(3);}};
const feel1=feelN(1),feel2=feelN(2);
const SEEDS=Array.from({length:24},(_,i)=>normSeed(i*2654435761+12345));
const C0=makeCourse(SEEDS[0]);

test('코스 길이: 결승까지 400~500m(지금 192m의 2배 넘게), 출발대 26m, 결승은 0m, 끝은 멈춤 구역',()=>{
 for(const sd of SEEDS){const c=makeCourse(sd);
  assert.ok(c.finish>=400&&c.finish<=500,`${c.code}: 결승 ${c.finish}`);assert.ok(c.end-c.finish>=17.5,'감속·멈춤 구역');
  assert.equal(c.profileH(-1),START_H);assert.equal(c.profileH(c.finish+1),0);
  const e=c.xz(c.end);assert.ok(Math.hypot(e.x-L.SLED_RUN.stop.x,e.z-L.SLED_RUN.stop.z)<2,'끝 = 멈춤 구역');}
 assert.ok(Math.abs(L.heightAt(L.SLED_RUN.deck.x,L.SLED_RUN.deck.z)-START_H)<.05,'출발대 높이');
});
test('코스: 마을 경계(북쪽 열린 곳 |x|<36·z ≥ −115) 안, 줄끼리 겹치지 않고 광장·집과 떨어짐',()=>{
 for(const sd of SEEDS.slice(0,8)){const c=makeCourse(sd);
  for(const p of c.points)for(const o of [-p.W/2-.6,p.W/2+.6]){const q=c.xz(p.s,o);assert.ok(q.z<-24&&Math.abs(q.x)<L.BOUNDS.gapX&&q.z>=L.BOUNDS.north+1,`${c.code} s=${p.s.toFixed(1)} (${q.x.toFixed(1)},${q.z.toFixed(1)})`);}
  const P=c.points.filter((p,i)=>i%3===0);
  for(const a of P)for(const b of P){if(Math.abs(a.s-b.s)<16)continue;assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>COURSE_W+1.2,`${c.code} ${a.s}·${b.s}`);}
  for(const p of P)assert.ok(Math.hypot(p.x,p.z)>L.PLAZA.radius+COURSE_W/2);
  for(const [x,z,,s] of L.HOUSES){const n=c.nearest(x,z,{maxD:30});assert.ok(!n||n.d>COURSE_W/2+2.4*s,`집 (${x},${z})`);}}
 // 탄 사람 자리는 걸어 다니는 경계로도 막히지 않음
 const q=C0.xz(100,0);assert.ok(inNorthGap(q.x,q.z));const c=collideXmas(q.x,q.z);assert.ok(Math.hypot(c.x-q.x,c.z-q.z)<1e-9);
});
test('땅은 시드와 상관없이 같고(산 위 사람이 뜨거나 묻히지 않음), 어떤 코스든 길 높이 = 그 자리 땅 높이',()=>{
 for(const sd of SEEDS.slice(0,6)){const c=makeCourse(sd);for(let s=2;s<c.finish;s+=13){const q=c.xz(s,0);assert.ok(Math.abs(mountainH(q.x,q.z)-c.profileH(s))<.3,`${c.code} s ${s}: 땅 ${mountainH(q.x,q.z).toFixed(2)} 길 ${c.profileH(s).toFixed(2)}`);}}
 // 길은 내려가기만(점프대 제외)
 let prev=99;for(const p of C0.points){const h=C0.profileH(p.s);assert.ok(h<=prev+1e-9);prev=h;}
 let lo=9;for(let x=-60;x<=60;x+=2)for(let z=-130;z<=50;z+=2)lo=Math.min(lo,L.heightAt(x,z));assert.ok(lo>=-.01,`가장 낮은 땅 ${lo}`);
});
test('시드 동일성: 같은 시드 = 같은 코스(블록·자리·길), 시드가 다르면 대부분 다른 코스',()=>{
 const a=planCourse(777),b=planCourse(777);assert.deepEqual(a,b);
 const c1=makeCourse(777);assert.equal(c1,makeCourse(777),'같은 시드는 같은 객체(기억)');
 assert.deepEqual(JSON.parse(JSON.stringify(planCourse(777))),JSON.parse(JSON.stringify(c1.plan)));
 const sig=sd=>planCourse(sd).blocks.map(b=>b.type).join(',')+'|'+planCourse(sd).turns.join(',');
 const set=new Set(Array.from({length:40},(_,i)=>sig(normSeed(i*7919+1))));assert.ok(set.size>=36,`서로 다른 코스 ${set.size}/40`);
 assert.equal(courseCode(123),courseCode(123));assert.notEqual(courseCode(123),courseCode(124));assert.match(courseCode(99),/^[2-9A-Z]{4}$/);
 assert.equal(dailySeed(Date.UTC(2026,10,17,3)),dailySeed(Date.UTC(2026,10,17,10)),'서울 같은 날 = 같은 시드');
});
test('블록 구성: 코스마다 점프대·부스터 2·장애물 숲·굽이 2·좁은 길·얼음 길·터널이 모두 있고 헤어핀 굽이가 하나 이상',()=>{
 for(const sd of SEEDS){const c=makeCourse(sd),n=t=>c.plan.blocks.filter(b=>b.type===t).length;
  for(const [t,k] of [['jump',2],['boost',2],['forest',1],['chicane',2],['narrow',1],['ice',1],['tunnel',1]])assert.ok(n(t)>=k,`${c.code} ${t} ${n(t)}`);
  assert.ok(c.plan.turns.includes('hairpin'));assert.equal(c.plan.turns.length,6);
  assert.equal(c.checkpoints.length,3);assert.equal(c.checkpoints[2],c.finish);assert.ok(c.checkpoints[0]<c.checkpoints[1]&&c.checkpoints[1]<c.finish);
  // 블록은 겹치지 않고 줄(직선) 안에만, 굽이 앞뒤 비킴 구간과도 겹치지 않음
  const bl=[...c.plan.blocks].sort((x,y)=>x.u0-y.u0);for(let i=1;i<bl.length;i++)assert.ok(bl[i].u0>=bl[i-1].u1-1e-6,'블록 겹침');
  for(const b of bl)assert.ok(ROW_SPANS.some(r=>b.u0>=r.u0-1e-6&&b.u1<=r.u1+1e-6),`${b.type} 줄 밖`);}
});
// 길 위 빈 곳을 따라 옆으로 너무 급하지 않게(1m 앞으로 갈 때 옆 0.45m 안) 결승까지 갈 길이 있는지(막다른 길 없음)
function passable(c,{slope=.45,step=.25}={}){
 const lanes=[];for(let o=-2.2;o<=2.2001;o+=.1)lanes.push(+o.toFixed(2));
 let ok=new Set(lanes.filter(o=>Math.abs(o)<=c.widthAt(0)/2-SLED_RULES.edgeIn));
 for(let s=0;s<=c.finish;s+=step){
  const lim=c.widthAt(s)/2-SLED_RULES.edgeIn,blocked=o=>Math.abs(o)>lim||c.obstacles.some(b=>Math.abs(s-b.s)<=b.r+.4&&Math.abs(o-b.off)<=b.r+SLED_HALF);
  const next=new Set();for(const o of lanes){if(blocked(o))continue;for(const p of ok)if(Math.abs(p-o)<=slope*step+1e-9){next.add(o);break;}}
  if(!next.size)return {ok:false,s};ok=next;}
 return {ok:true};
}
test('막다른 길 없음: 어느 코스든 장애물 숲·좁은 길 사이로 결승까지 지나갈 길이 있음(옆으로 1m에 0.45m 안 움직이며)',()=>{
 for(const sd of SEEDS){const c=makeCourse(sd),r=passable(c);assert.ok(r.ok,`${c.code} s=${r.s}에서 막힘`);
  for(const p of c.points)assert.ok(p.W>=NARROW_W-1e-6,'좁은 길도 4.5m 이상');}
});
test('점프 착지 안전: 가장 멀리 나는 거리(12m/s × 1.3배 체공) 안에는 장애물·좁은 길·터널·굽이가 없음',()=>{
 for(const sd of SEEDS){const c=makeCourse(sd);
  for(const j of c.jumps){const far=SLED_RULES.boostMax*j.air*1.3+1.5;
   for(let s=j.s;s<=j.s+far;s+=.5){const a=c.at(s);assert.ok(Math.abs(a.k)<.06,`${c.code} 점프 ${j.s} 뒤 ${(s-j.s).toFixed(1)}m 굽음 ${a.k.toFixed(3)}`);assert.ok(a.W>=COURSE_W-1e-6,'좁은 길');assert.ok(!a.tun,'터널');}
   assert.ok(!c.obstacles.some(o=>o.s>=j.s-1&&o.s<=j.s+far),`${c.code} 착지 자리에 장애물`);
   assert.ok(j.s+far<c.finish,'결승 전에 착지');}}
});
test('조작감 1(비교용) — 완주 가능·시간대: 보통 실력(키보드식 누름/뗌·0.22초 늦은 반응)은 50~75초(11-18 길이 넓어져 조금 빨라짐), 잘 타면 더 빠르고, 손을 안 대도 끝까지 감',feel1(()=>{
 const norm=[],good=[],none=[];
 for(const sd of SEEDS.slice(0,12)){const c=makeCourse(sd);
  const n=simulateRide(c,{style:'normal',seed:sd%997+3}),g=simulateRide(c,{style:'good'}),z=simulateRide(c,{style:'none'});
  for(const [r,name] of [[n,'보통'],[g,'잘 탐'],[z,'손 안 댐']])assert.ok(r.done&&Number.isFinite(r.t),`${c.code} ${name} 완주 못 함`);
  assert.ok(n.t>=50&&n.t<=75,`${c.code} 보통 ${n.t.toFixed(1)}초`);assert.ok(g.t<n.t,`${c.code} 잘 타면 더 빠름 ${g.t.toFixed(1)} < ${n.t.toFixed(1)}`);
  norm.push(n.t);good.push(g.t);none.push(z.t);}
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 assert.ok(avg(good)<=avg(norm)-5,`잘 타면 평균 5초 넘게 빠름: ${avg(good).toFixed(1)} / ${avg(norm).toFixed(1)}`);
 assert.ok(avg(none)>=avg(norm)+2,`조종 안 하면 느림: ${avg(none).toFixed(1)} / ${avg(norm).toFixed(1)}`);
 assert.ok(Math.abs(avg(norm)-PAR_NORMAL)<5);
 // 별 기준은 코스마다(잘 탐 + 2초 = ★★★, 보통 + 8초 = ★★)
 const c=makeCourse(SEEDS[1]),st=starTimes(c);assert.ok(st.three<st.two);assert.equal(starsOf(st.three-.1,c),3);assert.equal(starsOf(st.two-.1,c),2);assert.equal(starsOf(st.two+.1,c),1);
 assert.ok(courseGrip(c)>=.4&&courseGrip(c)<=2.2);
}));
test('조작감 1(비교용) — 조작: 속도가 빠를수록 꺾임이 차분하고(95°/s → 55°/s), 키를 톡 누르면 작은 꺾임, 떼면 빨리 0, 감도 배수',feel1(()=>{
 assert.ok(Math.abs(turnRateAt(2)*180/Math.PI-95)<.01&&Math.abs(turnRateAt(13)*180/Math.PI-55)<.01);
 let prev=Infinity;for(let v=0;v<=14;v+=.5){const t=turnRateAt(v);assert.ok(t<=prev+1e-12);prev=t;}
 const r=createRide({course:C0,start:5});r.step(1/60,{});r.step(1/60,{steer:1});assert.ok(r.steerNow<.12,`첫 프레임 ${r.steerNow}`);
 for(let i=0;i<10;i++)r.step(1/60,{steer:1});assert.ok(r.steerNow>.9);
 for(let i=0;i<8;i++)r.step(1/60,{});assert.ok(Math.abs(r.steerNow)<.05,'0.12초에 0');
 const a=createRide({course:C0,start:5,sens:SLED_SENS.fast}),b=createRide({course:C0,start:5,sens:SLED_SENS.soft});
 for(let i=0;i<30;i++){a.step(1/60,{steer:1});b.step(1/60,{steer:1});}assert.ok(a.psi>b.psi*1.6);
 assert.deepEqual(SLED_SENS,{soft:.7,normal:1,fast:1.3});
}));
test('조작감 1(비교용) — 드리프트: 몸이 진행 방향보다 더 돌아가고(최대 28°), 0.7초 넘게 하고 놓으면 미니 부스트, 1.4초면 더 큼',feel1(()=>{
 for(const [secs,lv] of [[.9,1],[1.6,2]]){const r=createRide({course:C0,start:30,v0:7});const ev=[];let slip=0;
  for(let i=0;i<secs*60;i++){ev.push(...r.step(1/60,{steer:1,drift:true}));slip=Math.max(slip,r.slip);}
  assert.ok(slip>.3&&slip<=SLED_RULES.slipMax+1e-9,`미끄러짐 ${slip}`);
  ev.push(...r.step(1/60,{}));const mini=ev.find(e=>e.type==='mini');assert.ok(mini,`${secs}초`);assert.equal(mini.lv,lv);assert.ok(r.boosting);
  for(let i=0;i<30;i++)r.step(1/60,{});assert.ok(Math.abs(r.slip)<.05,'놓으면 몸이 돌아옴');}
}));
test('부딪힘: 눈둑·눈 더미·전나무에 부딪혀도 멈추지 않고(3.5m/s 아래로 안 떨어짐) 옆으로 부드럽게 튕겨 나옴',()=>{
 // 눈둑: 오른쪽으로 계속 꺾어 부딪힘 → 안쪽(왼쪽)으로 튕김·속도는 3.5 이상
 const r=createRide({course:C0,start:40,v0:8});let ev=[],minV=9,bounced=false;
 for(let i=0;i<240;i++){const e=r.step(1/60,{steer:i<60?1:0});ev.push(...e);if(e.some(x=>x.type==='bank')){bounced=true;}if(bounced)minV=Math.min(minV,r.v);}
 assert.ok(ev.some(e=>e.type==='bank'));assert.ok(minV>=3.5-1e-9,`최저 ${minV}`);assert.ok(Math.abs(r.off)<=C0.widthAt(r.s)/2-SLED_RULES.edgeIn+1e-9);
 // 장애물: 그 줄에 맞춰 달리면 부딪힘 → 속도는 줄지만 멈추지 않고 옆으로 밀려남
 const o=C0.obstacles[0];
 for(const kind of ['pile','fir']){const ob=C0.obstacles.find(x=>x.kind===kind)??o;const q=createRide({course:C0,start:ob.s-4,v0:7});q.step(1/60,{});let hit=null,offAt=0;
  for(let i=0;i<120&&!hit;i++){const e=q.step(1/60,{steer:Math.max(-1,Math.min(1,(ob.off-q.off)*2-q.psi*3))});hit=e.find(x=>x.type==='pile'||x.type==='tree');offAt=q.off;}
  assert.ok(hit,`${kind} 부딪힘`);assert.ok(q.v>=3.5-1e-9);let moved=0;for(let i=0;i<20;i++){q.step(1/60,{});moved=Math.max(moved,Math.abs(q.off-offAt));}assert.ok(moved>.15,`${kind} 옆으로 밀림 ${moved.toFixed(2)}`);}
});
test('얼음 길·좁은 길: 얼음 위에서는 덜 꺾이고, 좁은 길에서는 눈둑이 안쪽(폭 4.5m)',()=>{
 const c=SEEDS.map(makeCourse).find(x=>x.ice.length&&x.narrows.length),ice=c.ice[0],nw=c.narrows[0];
 assert.equal(c.surfaceAt((ice.s0+ice.s1)/2),'ice');assert.ok(Math.abs(c.widthAt((nw.s0+nw.s1)/2)-NARROW_W)<.01);
 const a=createRide({course:c,start:ice.s0+2,v0:7}),b=createRide({course:c,start:ice.s0-30,v0:7});
 for(let i=0;i<20;i++){a.step(1/60,{steer:1});b.step(1/60,{steer:1});}assert.ok(Math.abs(a.psi)<Math.abs(b.psi),'얼음 위에서 덜 꺾임');
 const ev=a.step(1/60,{});void ev;
});
test('속도: 부스터·스타트 부스트가 있어도 12m/s를 넘지 않고, 출발 0.3초 안 밀기 = 스타트 부스트',()=>{
 const r=createRide({course:C0,lane:2});let max=0,t=0;const ev=[];
 while(!r.done&&t<200){const e=r.step(1/60,{steer:botSteer(r),push:t>.1&&t<.2});ev.push(...e);max=Math.max(max,r.v);t+=1/60;}
 assert.ok(ev.some(e=>e.type==='start'));assert.ok(ev.filter(e=>e.type==='boost').length>=2);assert.ok(max<=12+1e-9,`${max}`);
 const late=createRide({course:C0,lane:2});const got=[];for(let i=0;i<40;i++)got.push(...late.step(1/60,{push:i>30}));assert.ok(!got.some(e=>e.type==='start'));
});
test('휴대폰 끌기 핸들: 8px 안은 0(데드존), 64px이면 최대, 그 사이는 작게 끌수록 섬세(곡선)',()=>{
 assert.equal(dragSteer(0),0);assert.equal(dragSteer(DRAG.dead),0);assert.equal(dragSteer(-DRAG.dead+.5),0);
 assert.equal(dragSteer(DRAG.full),1);assert.equal(dragSteer(-200),-1);
 const mid=dragSteer((DRAG.dead+DRAG.full)/2);assert.ok(mid>0&&mid<.5,`가운데 ${mid}`);
 let prev=0;for(let x=0;x<=80;x+=2){const v=dragSteer(x);assert.ok(v>=prev);prev=v;}
});
test('고스트: 0.1초마다 기록, 시각으로 자리 찾기',()=>{
 const g=createGhostRecorder(),r=createRide({course:C0,lane:2});let t=0;while(!r.finished&&t<90){r.step(1/60,{steer:botSteer(r)});g.add(1/60,r.pose());t+=1/60;}
 assert.ok(Math.abs(g.points.length-t/.1)<3,`${g.points.length}점 / ${t.toFixed(1)}초`);
 const a=ghostAt(g.points,5),b=ghostAt(g.points,10);assert.ok(b.s>a.s);assert.ok(ghostAt(g.points,999).done);
 assert.ok(Math.abs(laneOffset(1)+2.1)<1e-9&&Math.abs(laneOffset(4)-2.1)<1e-9,'11-18 줄 간격 1.4m');
});
const mkCtx=()=>{const out=[],mem=new Map();return {out,mem,ctx:{members:mem,send:(id,m)=>{out.push({to:id,...m});return true;},all:m=>out.push({to:'*',...m})}};};
test('같은 방 = 같은 코스: 들어오면 방 코스(sc), 레이스를 열면 새 코스(타는 사람이 없을 때) · 레이스 view에도 시드',()=>{
 let r=.25;const R=createSledRace({rand:()=>(r=(r*9301+49297)%233280/233280)});const {out,mem,ctx}=mkCtx();
 const who=(id,act=null)=>{const c={id,name:id,act};mem.set(id,c);return c;};const a=who('a'),b=who('b');
 const j=R.joinMsgs(T0);assert.equal(j[0].t,'sc');assert.equal(j[0].seed,dailySeed(T0));assert.equal(j[1].t,'sr:board');assert.equal(j[1].seed,j[0].seed);
 const s0=R.seed;R.handle(a,{t:'sr:open',lane:1},T0,ctx);
 const sc=out.find(m=>m.t==='sc');assert.ok(sc&&sc.to==='*'&&sc.seed!==s0,'레이스를 열면 방 모두에게 새 코스');
 assert.equal(R.race.seed,sc.seed);assert.equal(out.filter(m=>m.t==='sr').at(-1).seed,sc.seed);
 R.handle(b,{t:'sr:join'},T0+100,ctx);assert.equal(R.race.riders.size,2);
 // 혼자 탈 때도 방 코스 하나: b가 새 코스를 누르면 모두에게
 R.handle(a,{t:'sr:quit'},T0+200,ctx);R.handle(b,{t:'sr:quit'},T0+300,ctx);assert.equal(R.race,null);
 const before=R.seed;R.handle(b,{t:'sc:new'},T0+400,ctx);assert.notEqual(R.seed,before);assert.equal(out.at(-2).t,'sc');
 // 누가 타는 중(act.sl 5)이면 못 바꿈, 내가 타는 중인 것은 괜찮음
 who('c',{sl:5});const s2=R.seed;R.handle(b,{t:'sc:new'},T0+500,ctx);assert.equal(R.seed,s2);assert.equal(out.at(-1).t,'sc:no');
 R.handle(mem.get('c'),{t:'sc:new'},T0+600,ctx);assert.notEqual(R.seed,s2,'타는 사람 본인은 바꿀 수 있음(결과 창 「새 코스」)');
 // 타는 사람이 있으면 레이스는 열리지만 코스는 그대로
 const s3=R.seed;R.handle(a,{t:'sr:open',lane:1},T0+700,ctx);assert.equal(R.seed,s3);assert.equal(R.race.seed,s3);
 assert.ok(XMAS_PLAY_MESSAGES.includes('sc:new')&&EXPERIENCE_MESSAGES.christmas.includes('sc:new'));
});
test('레이스: 열기 → 같이 하기(최대 4명) → 3·2·1 → 출발 → 결승 순위 · 늦은 사람 15초 뒤 완주 못 함 · 기록판은 코스마다 따로',()=>{
 const R=createSledRace({rand:()=>.5}),{out,mem,ctx}=mkCtx();
 const who=id=>{const c={id,name:id};mem.set(id,c);return c;};
 const [a,b,c,d,e]=['a','b','c','d','e'].map(who);
 R.handle(a,{t:'sr:open',lane:1},T0,ctx);assert.equal(R.race.ph,'wait');const sd=R.race.seed;
 R.handle(b,{t:'sr:join',lane:1},T0+500,ctx);assert.notEqual(R.race.riders.get('b').lane,1,'겹친 줄은 빈 줄로');
 R.handle(c,{t:'sr:join'},T0+600,ctx);R.handle(d,{t:'sr:join'},T0+700,ctx);
 // 11-18: 4명이 차면 바로 3·2·1(모집 20초를 기다리지 않음), 그 뒤 온 사람은 「이미 출발」
 assert.equal(R.race.riders.size,RACE.max);assert.equal(R.race.ph,'count');assert.deepEqual([...R.race.riders.values()].map(x=>x.lane).sort(),[1,2,3,4]);
 R.handle(e,{t:'sr:join'},T0+800,ctx);assert.equal(out.at(-1).reason,'closed');
 R.tick(T0+700+RACE.countMs+2,ctx);assert.equal(R.race.ph,'run');
 const go=R.race.goAt;
 R.handle(b,{t:'sr:fin',ms:63000,seed:sd,fv:3},go+63000,ctx);R.handle(a,{t:'sr:fin',ms:65500,seed:sd,fv:3},go+65500,ctx);
 R.handle(c,{t:'sr:fin',ms:12000,seed:sd,fv:3},go+66000,ctx);assert.equal(out.at(-1).reason,'bad','말이 안 되게 빠른 기록은 거름');
 R.tick(go+63000+RACE.lateMs+1,ctx);assert.equal(R.race.ph,'done');
 const v=out.filter(m=>m.t==='sr').at(-1);assert.deepEqual(v.r.map(x=>[x.id,x.rank??null,!!x.dnf]),[['a',2,false],['b',1,false],['c',null,true],['d',null,true]]);
 const bd=out.filter(m=>m.t==='sr:board').at(-1);assert.deepEqual(bd.b.map(x=>x.n),['b','a']);assert.equal(bd.seed,sd);
 // 혼자 기록도(같은 코스 시드만): 다른 코스 시드로 보낸 기록은 버림
 R.handle(who('x'),{t:'sr:rec',ms:61000,seed:sd,fv:3},go+80000,ctx);R.handle(who('y'),{t:'sr:rec',ms:60000,seed:sd+1,fv:3},go+80000,ctx);
 // 11-18: 조작감 3(fv:3)이 아닌 기록(예전 조작감 2·1·옛 캐시 화면)은 기록판에 안 올림 — 더 빨라도
 assert.equal(BOARD_FEEL,3);assert.equal(SLED_FEEL_VERSION,BOARD_FEEL,'화면이 보내는 조작감 = 서버 기록판 조작감');
 R.handle(who('old'),{t:'sr:rec',ms:59000,seed:sd},go+80000,ctx);R.handle(who('old1'),{t:'sr:rec',ms:59000,seed:sd,fv:1},go+80000,ctx);R.handle(who('old2'),{t:'sr:rec',ms:58000,seed:sd,fv:2},go+80000,ctx);
 const b2=out.filter(m=>m.t==='sr:board').at(-1);assert.deepEqual(b2.b.map(x=>x.n),['x','b','a']);
 // 코스가 바뀌면 그 코스 기록판(처음엔 비어 있음), 돌아가면 다시 보임
 R.tick(go+63000+RACE.lateMs+RACE.keepMs+5,ctx);assert.equal(R.race,null);
 R.handle(a,{t:'sc:new'},go+90000,ctx);assert.equal(R.boardView(go+90000).b.length,0);
 R.setSeed(sd,go+91000,ctx);assert.equal(R.boardView(go+91000).b.length,3);
 assert.equal(R.boardView(go+86400e3*2).b.length,0,'다음 날(서울)은 비어 보임');
});
test('레이스: 기다리는 동안 나가면 빠지고, 연 사람이 「바로 출발」(2명부터), 다 나가면 없어짐',()=>{
 const R=createSledRace(),{out,mem,ctx}=mkCtx();const a={id:'a',name:'a'},b={id:'b',name:'b'};mem.set('a',a);mem.set('b',b);
 assert.equal(RACE.waitMs,20000,'모집 20초');assert.equal(RACE.min,2);
 R.handle(a,{t:'sr:open',lane:2},T0,ctx);R.handle(a,{t:'sr:go'},T0+50,ctx);assert.equal(R.race.ph,'wait','혼자면 못 출발');assert.equal(out.at(-1).reason,'few');
 R.handle(b,{t:'sr:join',lane:3},T0+100,ctx);
 R.handle(b,{t:'sr:go'},T0+200,ctx);assert.equal(R.race.ph,'wait','연 사람만 바로 출발');
 R.handle(a,{t:'sr:go'},T0+300,ctx);assert.equal(R.race.ph,'count');
 R.handle(a,{t:'sr:quit'},T0+400,ctx);assert.equal(R.race.host,'b');mem.delete('b');R.tick(T0+500,ctx);assert.equal(R.race,null);
});
test('서버: 썰매(act.sl 5) 14m/s · 케이블카(act.gd) 90m/s까지 순간이동 검사 통과, 걷는 사람은 그대로',()=>{
 for(const t of ['sr:open','sr:join','sr:go','sr:more','sr:solo','sr:quit','sr:fin','sr:rec','sc:new'])assert.ok(EXPERIENCE_MESSAGES.christmas.includes(t)&&XMAS_PLAY_MESSAGES.includes(t),t);
 assert.deepEqual(sanitizeAct('christmas',{sl:5,cr:1,tm:2,gd:1}),{sl:5,cr:1,tm:2,gd:1});assert.ok(!sanitizeAct('christmas',{gd:3})?.gd);
 let t=T0;const rooms=createRooms({now:()=>t});
 const join=name=>rooms.join({experience:'christmas',room:'눈마을-1',name,send:()=>{}}).client;
 const a=join('하나'),b=join('둘'),g=join('셋');
 const move=(c,x,z)=>rooms.message(c,{t:'s',q:1,z:0,x,y:z,h:0,v:0,f:0});
 for(const c of [a,b,g])move(c,0,-40);t+=1000;for(const c of [a,b,g])move(c,0,-40);
 rooms.message(b,{t:'act',a:{sl:5}});rooms.message(g,{t:'act',a:{gd:1}});
 t+=1000;move(a,15,-40);move(b,15,-40);move(g,15,-40);
 const st=c=>rooms.clients.get(c.id).state;
 assert.ok(Math.abs(st(a).x-15)>1,'걷는 사람은 거부');assert.ok(Math.abs(st(b).x-15)<1e-9,'썰매는 통과');assert.ok(Math.abs(st(g).x-15)<1e-9,'케이블카도 통과');
 t+=1000;move(g,85,-40);assert.ok(Math.abs(st(g).x-85)<1e-9,'건너뛰기(1초 70m)도 통과');
 t+=1000;move(b,60,-40);assert.ok(Math.abs(st(b).x-60)>1,'썰매는 2초에 45m(22m/s) 거부');
});
test('케이블카: 마을 승강장 ↔ 꼭대기 승강장, 객실은 땅·썰매 길과 떨어져 지나감(길 위 2.5m 넘게)',()=>{
 assert.ok(Math.abs(L.heightAt(GONDOLA.base.x,GONDOLA.base.z))<.02,'마을 승강장 바닥 평평');assert.ok(Math.abs(L.heightAt(GONDOLA.top.x,GONDOLA.top.z)-START_H)<.05,'꼭대기 승강장 = 출발대 높이');
 for(const st of [GONDOLA.base,GONDOLA.top]){const c=collideXmas(st.x,st.z);assert.ok(Math.hypot(c.x-st.x,c.z-st.z)<1e-6,'걸어서 갈 수 있는 자리');}
 assert.ok(Math.hypot(GONDOLA.base.x,GONDOLA.base.z)>L.PLAZA.radius+2&&Math.hypot(GONDOLA.base.x,GONDOLA.base.z)<L.BOUNDS.r-3,'마을 쪽(광장 밖·울타리 안)');
 assert.equal(nearStation(GONDOLA.base.x+1,GONDOLA.base.z),'base');assert.equal(nearStation(GONDOLA.top.x,GONDOLA.top.z+1),'top');assert.equal(nearStation(0,0),null);
 // 땅과 떨어짐(승강장 앞 8% 빼고 1.5m 넘게), 썰매 길 위는 2.5m 넘게(썰매·사람 키 1m + 여유)
 for(let f=.08;f<=.92;f+=.004){const c=cabinAt(f);assert.ok(c.y-mountainH(c.x,c.z)>1.5,`f ${f.toFixed(3)} 땅과 ${(c.y-mountainH(c.x,c.z)).toFixed(2)}m`);}
 for(const sd of SEEDS.slice(0,10)){const co=makeCourse(sd);for(let f=0;f<=1;f+=.003){const c=cabinAt(f),n=co.nearest(c.x,c.z,{maxD:4});if(!n||n.s<.5||n.d>co.widthAt(n.s)/2+.8)continue;
  assert.ok(c.y-co.profileH(n.s)-co.rampH(n.s)>2.5,`${co.code} f ${f.toFixed(3)}: 길 위 ${(c.y-co.profileH(n.s)).toFixed(2)}m`);}}
 assert.equal(TOWERS.length,2);assert.ok(CABLE_LEN>100&&CABLE_LEN<130,`케이블 ${CABLE_LEN}`);
 // 케이블 위 점에서 높이 다시 찾기(다른 사람 화면) = 같은 높이
 for(const f of [.2,.5,.8]){const c=cabinAt(f),y=cabinYAt(c.x,c.z);assert.ok(Math.abs(y.y-c.y)<.15,`f ${f}: ${y.y} vs ${c.y}`);}
});
test('케이블카 한 번: 7.5초(처음·끝은 서서히), 건너뛰기는 남은 길을 2초에 · 0.1초마다 옮기는 거리는 순간이동 기준(25m)보다 훨씬 짧음',()=>{
 assert.equal(rideFraction(0),0);assert.equal(rideFraction(GONDOLA.secs),1);assert.ok(Math.abs(rideFraction(GONDOLA.secs/2)-.5)<1e-9);
 let prev=0;for(let t=0;t<=GONDOLA.secs;t+=.05){const f=rideFraction(t);assert.ok(f>=prev-1e-12);prev=f;}
 for(const dir of [1,-1]){const r=createGondolaRide(dir);let t=0,last=r.pose(),maxStep=0;const start=last;
  while(!r.done&&t<20){r.step(.1);t+=.1;const p=r.pose();maxStep=Math.max(maxStep,Math.hypot(p.x-last.x,p.z-last.z));last=p;}
  assert.ok(Math.abs(t-GONDOLA.secs)<.15,`${dir} ${t}초`);assert.ok(maxStep<2.5,`0.1초 최대 ${maxStep}m`);
  const want=dir>0?GONDOLA.top:GONDOLA.base;assert.ok(Math.hypot(last.x-want.x,last.z-want.z)<.2,'도착 승강장');
  const from=dir>0?GONDOLA.base:GONDOLA.top;assert.ok(Math.hypot(start.x-from.x,start.z-from.z)<.2,'출발 승강장');}
 const r=createGondolaRide(1);for(let i=0;i<10;i++)r.step(.1);r.skip();let t=0,last=r.pose(),maxStep=0;
 while(!r.done&&t<5){r.step(.1);t+=.1;const p=r.pose();maxStep=Math.max(maxStep,Math.hypot(p.x-last.x,p.z-last.z));last=p;}
 assert.ok(t<=GONDOLA.skipSecs+.15,`건너뛰기 ${t}초`);assert.ok(maxStep<NET.snapDistance*.5,`건너뛰기 0.1초 최대 ${maxStep.toFixed(1)}m (사라졌다 나타나지 않음)`);
 assert.ok(maxStep/.1<90,'서버 케이블카 한도 안');
});
test('실제 서버 길: 「새 코스」(sc:new)가 방 판정까지 가고, 방 모두가 새 코스(sc)를 받으며 화면도 sc·sc:no를 받는다',()=>{
 let t=T0;const rooms=createRooms({now:()=>t}),inbox=new Map();
 const join=name=>{const box=[];const c=rooms.join({experience:'christmas',room:'눈마을-3',name,send:m=>box.push(typeof m==='string'?JSON.parse(m):m)}).client;inbox.set(name,box);return c;};
 const a=join('하나');join('둘');const s0=inbox.get('둘').find(m=>m.t==='sc')?.seed;assert.ok(s0,'들어오면 방 코스');
 rooms.message(a,{t:'sc:new'});const got=inbox.get('둘').filter(m=>m.t==='sc').at(-1);assert.ok(got&&got.seed!==s0,'다른 사람도 새 코스를 받음');
 for(const k of ['sc','sc:no','sr','sr:board'])assert.ok(PLAY_TYPES.includes(k),k);
});

test('조작감 2(비교용, 11-17 기본이었음): 꺾임 105°/s → 48°/s, 완주·보통 실력은 기준(55초) 근처, 잘 타면 평균 4초 넘게 빠름',feel2(()=>{
 assert.equal(sledFeel(),2);assert.equal(sledFeelFrom('?sled=1'),3,'주소로 바꾸는 길 없음');
 assert.ok(Math.abs(turnRateAt(2)*180/Math.PI-105)<.01&&Math.abs(turnRateAt(13)*180/Math.PI-48)<.01);
 const norm=[],good=[];
 for(const sd of SEEDS.slice(0,12)){const c=makeCourse(sd);const n=simulateRide(c,{style:'normal',seed:sd%997+3}),g=simulateRide(c,{style:'good'}),z=simulateRide(c,{style:'none'});
  for(const [r,name] of [[n,'보통'],[g,'잘 탐'],[z,'손 안 댐']])assert.ok(r.done&&Number.isFinite(r.t),`${c.code} ${name} 완주 못 함`);
  assert.ok(n.t>=45&&n.t<=68,`${c.code} 보통 ${n.t.toFixed(1)}초`);assert.ok(n.t*1000>=RACE.minMs);norm.push(n.t);good.push(g.t);}
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 assert.ok(Math.abs(avg(norm)-SLED_RULES_2.par)<4,`보통 평균 ${avg(norm).toFixed(1)}`);assert.ok(avg(good)<=avg(norm)-4,`잘 탐 ${avg(good).toFixed(1)} / 보통 ${avg(norm).toFixed(1)}`);
 // 드리프트: 몸은 16°까지만, 0.7초 넘게 하고 놓으면 미니 부스트
 const r=createRide({course:C0,start:30,v0:7});const ev=[];let slip=0;
 for(let i=0;i<60;i++){ev.push(...r.step(1/60,{steer:1,drift:true}));slip=Math.max(slip,r.slip);}
 assert.ok(slip>.1&&slip<=SLED_RULES_2.slipMax+1e-9,`미끄러짐 ${slip}`);ev.push(...r.step(1/60,{}));assert.ok(ev.find(e=>e.type==='mini'));
}));

test('레이스 혼자일 때(11-18): 20초 끝에 1명이면 「혼자 타기」/「20초 더」(한 번) → 답이 없거나 또 혼자면 혼자 타기, 그 사이 누가 오면 다시 모집',()=>{
 const R=createSledRace(),{out,mem,ctx}=mkCtx();const a={id:'a',name:'a'},b={id:'b',name:'b'};mem.set('a',a);mem.set('b',b);
 R.handle(a,{t:'sr:open',lane:1},T0,ctx);R.tick(T0+RACE.waitMs+1,ctx);assert.equal(R.race.ph,'wait');assert.ok(R.race.lone);assert.equal(out.filter(m=>m.t==='sr').at(-1).lone,1);
 R.handle(a,{t:'sr:more'},T0+RACE.waitMs+500,ctx);assert.ok(!R.race.lone&&R.race.more);
 R.handle(a,{t:'sr:more'},T0+RACE.waitMs+600,ctx);assert.ok(R.race.more,'한 번만');
 R.tick(T0+RACE.waitMs+500+RACE.moreMs+1,ctx);assert.equal(R.race,null,'20초 더 기다려도 혼자 → 혼자 타기');assert.equal(out.at(-1).solo,'a');
 // 혼자 타기 단추
 R.handle(a,{t:'sr:open',lane:1},T0+90000,ctx);R.tick(T0+90000+RACE.waitMs+1,ctx);R.handle(a,{t:'sr:solo'},T0+90000+RACE.waitMs+200,ctx);assert.equal(R.race,null);assert.equal(out.at(-1).solo,'a');
 // 답을 기다리는 사이 누가 오면 다시 모집 → 연 사람이 지금 출발
 R.handle(a,{t:'sr:open',lane:1},T0+200000,ctx);R.tick(T0+200000+RACE.waitMs+1,ctx);assert.ok(R.race.lone);
 R.handle(b,{t:'sr:join'},T0+200000+RACE.waitMs+300,ctx);assert.ok(!R.race.lone);R.handle(a,{t:'sr:go'},T0+200000+RACE.waitMs+400,ctx);assert.equal(R.race.ph,'count');
});
test('같은 사람과 한 번 더(11-18): 끝난 레이스의 연 사람이 again으로 열면 지난 참가자 목록(re)이 10초 동안 붙음',()=>{
 const R=createSledRace(),{out,mem,ctx}=mkCtx();const [a,b,c]=['a','b','c'].map(id=>{const x={id,name:id};mem.set(id,x);return x;});
 R.handle(a,{t:'sr:open',lane:1},T0,ctx);R.handle(b,{t:'sr:join'},T0+10,ctx);R.handle(c,{t:'sr:join'},T0+20,ctx);R.handle(a,{t:'sr:go'},T0+30,ctx);
 R.tick(T0+30+RACE.countMs+1,ctx);const go=R.race.goAt;const sd=R.race.seed;
 for(const [x,ms] of [[a,60000],[b,61000],[c,62000]])R.handle(x,{t:'sr:fin',ms,seed:sd,fv:3},go+ms,ctx);assert.equal(R.race.ph,'done');
 R.handle(a,{t:'sr:open',lane:1,again:1},go+70000,ctx);const v=out.filter(m=>m.t==='sr').at(-1);assert.deepEqual(v.re,['b','c']);
 assert.ok(!R.view(go+70000+RACE.reMs+1).re,'10초 뒤엔 없음');
 R.handle(b,{t:'sr:quit'},go+71000,ctx);R.handle(a,{t:'sr:quit'},go+71000,ctx);
 R.handle(b,{t:'sr:open',lane:2,again:1},go+72000,ctx);assert.ok(!out.filter(m=>m.t==='sr').at(-1).re,'연 사람이 아니면 re 없음');
});
test('길 폭(11-18 4명 경주): 어디서든 4대가 나란히(4.1m 이상), 기본 6m·좁은 곳 4.5m·출발/굽이/결승 7m·터널 5.5m, 출발 4줄이 눈둑 안, 장애물 양옆 틈 2m 이상',()=>{
 assert.deepEqual([COURSE_W,NARROW_W,WIDE_W,TUNNEL_W],[6,4.5,7,5.5]);
 assert.ok(MIN_RACE_W>=4*.48+3*.5+2*SLED_RULES.edgeIn-1e-9,'4대 + 사이 3칸 + 눈둑 몫');
 for(const sd of SEEDS){const c=makeCourse(sd);
  for(const p of c.points)if(p.s<=c.end)assert.ok(p.W>=MIN_RACE_W,`${c.code} s=${p.s.toFixed(1)} 폭 ${p.W.toFixed(2)}`);
  assert.ok(Math.abs(c.widthAt(2)-WIDE_W)<1e-6,'출발 직선 7m');assert.ok(Math.abs(c.widthAt(c.finish-2)-WIDE_W)<.01,'결승 직선 7m');
  for(const t of TURN_SPANS){const s=c.sOfU((t.u0+t.u1)/2);assert.ok(Math.abs(c.widthAt(s)-WIDE_W)<.01,`${c.code} 굽이 ${c.widthAt(s)}`);}
  for(const t of c.tunnels)assert.ok(Math.abs(c.widthAt((t.s0+t.s1)/2)-TUNNEL_W)<.01,'터널 5.5m');
  // 길 + 비킴이 단(반폭 4.3m) 안
  for(const p of c.points)if(p.s>0&&p.s<c.finish)assert.ok(Math.abs(p.w)+p.W/2<=4.3+1e-6,`${c.code} s=${p.s.toFixed(1)} 단 밖 ${(Math.abs(p.w)+p.W/2).toFixed(2)}`);
  // 장애물 양옆 틈(장애물 가장자리 ~ 길 가장자리) 2m 이상
  for(const o of c.obstacles){const W=c.widthAt(o.s)/2;assert.ok(W-(o.off+o.r)>=2-1e-6&&(o.off-o.r)+W>=2-1e-6,`${c.code} 장애물 ${o.s} 틈`);}}
 // 출발 4줄: 줄 간격 1.4m, 썰매 사이 0.5m 넘게, 바깥 썰매도 눈둑 안
 const offs=[1,2,3,4].map(laneOffset);assert.ok(Math.abs(offs[1]-offs[0]-1.4)<1e-9);
 for(let i=1;i<4;i++)assert.ok(offs[i]-offs[i-1]-2*SLED_HALF>=.5);
 assert.ok(Math.max(...offs.map(Math.abs))+SLED_HALF<=WIDE_W/2-SLED_RULES.edgeIn);
});
test('4줄이 서로 안 끼는지(11-18): 4대가 각자 줄을 지키며 같이 달릴 때 어느 순간에도 두 썰매 옆 간격이 썰매 폭(0.48m) 넘게',()=>{
 // 보통 실력 자동 조종이 정한 옆 자리(lineWant)에 줄 차이(1.0m씩, 좁은 곳은 폭에 맞춰 줄임)를 더한 선을 4대가 따라감 → 좁은 길·헤어핀·터널에서도 겹치지 않음
 for(const sd of SEEDS.slice(0,8)){const c=makeCourse(sd);let minGap=9,where=null;
  for(let s=0;s<c.finish;s+=.5){const lim=c.widthAt(s)/2-SLED_RULES.edgeIn-SLED_HALF,gap=Math.min(1.4,2*lim/3);
   const lanes=[0,1,2,3].map(i=>(i-1.5)*gap);
   for(let i=1;i<4;i++){const g=lanes[i]-lanes[i-1];if(g<minGap){minGap=g;where=s;}}
   for(const o of lanes)assert.ok(Math.abs(o)<=lim+1e-9,`${c.code} s=${s} 줄이 눈둑 밖`);}
  assert.ok(minGap-2*SLED_HALF>=.5-1e-9,`${c.code} s=${where} 사이 ${(minGap-2*SLED_HALF).toFixed(2)}m`);}
});
test('조작감 3 기본(11-18 직접 조작): 길 맞춤·저절로 따라 돌기 없음, 꺾임 110°/s → 60°/s, 보통 실력 30코스 모두 완주(눈둑 평균 15번 이하), 손 놓으면 20% 넘게 느리고 눈둑 2.5배 넘게',()=>{
 assert.equal(sledFeel(),3);assert.equal(sledFeelFrom(),3);assert.equal(SLED_RULES_3.align,0);assert.equal(SLED_RULES_3.carry,1);assert.equal(SLED_RULES_3.iceAlign,0);
 assert.ok(Math.abs(turnRateAt(2)*180/Math.PI-110)<.01&&Math.abs(turnRateAt(13)*180/Math.PI-60)<.01);
 const seeds=Array.from({length:30},(_,i)=>normSeed(i*2654435761+12345)),norm=[],none=[],good=[];let nb=0,zb=0;
 for(const sd of seeds){const c=makeCourse(sd);const n=simulateRide(c,{style:'normal',seed:sd%997+3}),z=simulateRide(c,{style:'none'}),g=simulateRide(c,{style:'good'});
  assert.ok(n.done&&Number.isFinite(n.t),`${c.code} 보통 완주 못 함`);assert.ok(n.t*1000>=RACE.minMs);norm.push(n.t);none.push(z.t??240);good.push(g.t);nb+=n.banks;zb+=z.banks;}
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 assert.ok(nb/30<=15,`보통 눈둑 평균 ${(nb/30).toFixed(1)}`);
 assert.ok(avg(none)>avg(norm)*1.2,`손 놓음 ${avg(none).toFixed(1)} / 보통 ${avg(norm).toFixed(1)}`);assert.ok(zb>nb*2.5,`눈둑 손 놓음 ${zb} / 보통 ${nb}`);
 assert.ok(Math.abs(avg(norm)-SLED_RULES_3.par)<4,`보통 평균 ${avg(norm).toFixed(1)}`);assert.ok(avg(good)<avg(norm)-4);
 // 손을 떼도 썰매 방향은 길 쪽으로 돌아오지 않음(곧은 길, 핸들만 0.1초에 가운데)
 const r=createRide({course:C0,start:3,v0:6});for(let i=0;i<12;i++)r.step(1/60,{steer:1});const psi=r.psi;for(let i=0;i<6;i++)r.step(1/60,{});const kept=r.psi;
 for(let i=0;i<30;i++)r.step(1/60,{});assert.ok(Math.abs(r.steerNow)<1e-9,'핸들은 가운데');assert.ok(Math.abs(r.psi-kept)<.02&&kept>=psi,`방향 그대로 ${psi.toFixed(3)} → ${r.psi.toFixed(3)}`);
});
test('굽이 앞에서 손을 떼면 바깥 눈둑(11-18 완료 기준 ③): 헤어핀 들어가기 2초 전부터 손을 떼면 바깥 눈둑에 닿고, 조작감 2는 저절로 돌아 덜 닿음',()=>{
 let tried=0;
 for(const sd of SEEDS.slice(0,8)){const c=makeCourse(sd);
  c.plan.turns.forEach((k,i)=>{if(k!=='hairpin')return;const t=TURN_SPANS[i],s0=c.sOfU(t.u0);
   // 보통 실력으로 굽이 앞까지 타다가 2초 전부터 손을 뗌
   const run=()=>{const r=createRide({course:c,lane:2}),bot=createHumanBot({seed:3});let hitOut=0,released=false;
    while(!r.done&&r.s<s0+20){const lead=(s0-r.s)/Math.max(1,r.v);if(!released&&lead<=2)released=true;
     const ev=r.step(1/60,released?{}:bot(r));for(const e of ev)if(e.type==='bank'&&Math.sign(r.off)===-t.sg)hitOut++;if(r.t>200)break;}
    return hitOut;};
   tried++;assert.ok(run()>=1,`${c.code} 헤어핀 ${i}: 바깥 눈둑에 안 닿음`);});}
 assert.ok(tried>=8,`헤어핀 ${tried}개 시험`);
});
test('썰매 카메라(11-18 §2): 곧은 길에서 핸들을 0.5초마다 바꾸며 3초 — 카메라 방향은 길 방향과 0.3° 안, 프레임마다 0.05° 안, 옆 자리 2cm 안(예전 식과 비교)',()=>{
 // 곧은 길 찾기: 굽음 0·폭 같은 40m
 let c=null,s0=null;
 for(const sd of SEEDS){const cc=makeCourse(sd);for(let s=30;s<cc.finish-40&&s0==null;s+=1){let ok=true;for(let q=s-1;q<=s+21;q+=.5){const a=cc.at(q);if(Math.abs(a.k)>1e-6||Math.abs(a.W-COURSE_W)>1e-6||cc.obstacles.some(o=>Math.abs(o.s-q)<1)||cc.boosters.some(b=>q>=b.s-1&&q<=b.s+b.len+1)||cc.jumps.some(j=>q>=j.s-j.len-1&&q<=j.s+12)){ok=false;break;}}if(ok)s0=s;}if(s0!=null){c=cc;break;}}
 assert.ok(s0!=null,'곧은 길');
 // 핸들: 처음 0.25초 오른쪽, 그 뒤 0.5초마다 바꿈(좌우로 고르게 꿈틀)
 const measure=oldPsi=>{const r=createRide({course:c,start:s0,v0:5}),cam=createSledCam();let prev=null,maxDiff=0,maxStep=0,maxLat=0;
  for(let i=0;i<180;i++){r.step(1/60,{steer:i<15?1:Math.floor((i-15)/30)%2?1:-1,brake:r.v>6.5});const o0=cam.update(r,1/60,{oldPsi}),p=r.pose(),o=oldPsi?{...o0,x:p.x,z:p.z}:o0; // 예전 화면은 썰매 자리를 그대로 봤음
   const path=headingOf(c.at(r.s).th);let d=o.yaw-path;d=Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))*180/Math.PI;maxDiff=Math.max(maxDiff,d);
   if(prev){let dy=o.yaw-prev.yaw;dy=Math.abs(Math.atan2(Math.sin(dy),Math.cos(dy)))*180/Math.PI;maxStep=Math.max(maxStep,dy);
    // 옆 자리 변화 = 길에 수직인 쪽으로 움직인 거리
    const nx=-Math.sin(c.at(r.s).th),nz=Math.cos(c.at(r.s).th);maxLat=Math.max(maxLat,Math.abs((o.x-prev.x)*nx+(o.z-prev.z)*nz));}
   prev=o;}
  return {maxDiff,maxStep,maxLat};};
 const now=measure(0),old=measure(SLED_CAM_OLD_PSI);
 assert.ok(now.maxDiff<=.3,`길과 ${now.maxDiff.toFixed(3)}°`);assert.ok(now.maxStep<=.05,`프레임 ${now.maxStep.toFixed(4)}°`);assert.ok(now.maxLat<=.02,`옆 ${now.maxLat.toFixed(4)}m`);
 assert.ok(old.maxDiff>5&&old.maxStep>.2,`예전 식은 흔들렸음: ${old.maxDiff.toFixed(1)}° · ${old.maxStep.toFixed(2)}°/프레임`);
 console.log(`카메라 비교(곧은 길 3초, 핸들 0.5초마다 바꿈): 새 식 길과 ${now.maxDiff.toFixed(3)}° · 프레임 ${now.maxStep.toFixed(4)}° · 옆 ${(now.maxLat*100).toFixed(2)}cm / 예전 식 ${old.maxDiff.toFixed(2)}° · ${old.maxStep.toFixed(3)}° · ${(old.maxLat*100).toFixed(2)}cm`);
});
test('4대가 각자 줄을 지키며 같이 달리기(11-18): 굽이 앞에서 그 줄이 돌 수 있게 브레이크·드리프트하면 4코스 모두 결승까지 겹침 0(앞뒤 1.3m·옆 0.56m)',()=>{
 const edgeIn=SLED_RULES.edgeIn,laneBiasOf=(lane,W)=>{const lim=W/2-edgeIn-SLED_HALF;return (lane-2.5)*Math.min(1.4,2*lim/3);};
 for(const sd of SEEDS.slice(0,4)){const c=makeCourse(sd),rides=[1,2,3,4].map(l=>createRide({course:c,lane:l}));
  const want=(r,l)=>{const W=Math.min(c.widthAt(r.s),c.widthAt(r.s+5));let w=laneBiasOf(l,W);for(const o of c.obstacles){if(o.s<r.s-.5||o.s>r.s+6)continue;const need=o.r+edgeIn;if(Math.abs(w-o.off)<need)w=o.off+(w>=o.off?1:-1)*need;}const lim=W/2-edgeIn-.3;return Math.max(-lim,Math.min(lim,w));};
  const ped=(r,l)=>{const w=want(r,l);let need=0;for(let d=0;d<=Math.max(6,r.v*1.2);d+=1){const a=c.at(r.s+d),k=Math.abs(a.k);if(k<.02)continue;need=Math.max(need,1/Math.max(1.2,1/k-Math.sign(a.k)*w));}return {brake:need>0&&r.v*need>turnRateAt(r.v)*1.058,drift:Math.abs(c.at(r.s+1).k)>.12&&r.v>4};};
  let ov=0,t=0;
  while(rides.some(r=>!r.finished)&&t<200){rides.forEach((r,k)=>r.step(1/60,{steer:botSteer(r,{want:want(r,k+1)}),...ped(r,k+1)}));t+=1/60;
   for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){const A=rides[a],B=rides[b];if(!A.finished&&!B.finished&&Math.abs(A.s-B.s)<1.3&&Math.abs(A.off-B.off)<.56)ov++;}}
  assert.ok(rides.every(r=>r.finished),`${c.code} 4대 모두 완주`);assert.equal(ov,0,`${c.code} 겹친 프레임 ${ov}`);}
});
