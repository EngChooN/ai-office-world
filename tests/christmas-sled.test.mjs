// 눈썰매 긴 코스·조작·레이스(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §1): 코스 크기·마을 경계·8구간, 서서히 꺾기·감도·드리프트·부스트·점프 착지·장애물,
//  레이스(대기·최대 4명·순위·15초 늦음·기록판), 고스트, 서버 썰매 속도 한도.
import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSE_POINTS,COURSE_END,FINISH_S,CHECKPOINTS,JUMPS,BOOSTERS,OBSTACLES,COURSE_W,COURSE_BOX,profileH,courseXZ,nearestCourse,mountainH,SECTIONS} from '../src/christmas/sled-course.js';
import {createRide,SLED_RULES,SLED_SENS,botSteer,createGhostRecorder,ghostAt,starsOf,laneOffset} from '../src/christmas/sled.js';
import {createSledRace,RACE} from '../src/christmas/sled-race.js';
import {createRoomPlay,XMAS_PLAY_MESSAGES} from '../src/christmas/room-play.js';
import * as L from '../src/christmas/layout.js';
import {inNorthGap,collideXmas} from '../src/christmas/collide.js';
import {createRooms} from '../server/rooms.mjs';
import {EXPERIENCE_MESSAGES,sanitizeAct} from '../src/multi-protocol.js';

const T0=9_000_000;
const run=(ride,fn,max=120,dt=1/60)=>{const ev=[];let t=0;while(!ride.done&&t<max){ev.push(...ride.step(dt,fn?fn(ride,t):{}));t+=dt;}return {ev,t};};

test('코스: 가운데 선 180m 넘음(결승 ≥180m), 끝은 지금 멈춤 구역, 출발대 18m',()=>{
 assert.ok(FINISH_S>=180,`결승 ${FINISH_S}`);assert.ok(COURSE_END-FINISH_S>=14.99,'감속 구역 15m');
 const e=courseXZ(COURSE_END);assert.ok(Math.hypot(e.x-L.SLED_RUN.stop.x,e.z-L.SLED_RUN.stop.z)<.3,'끝 = 멈춤 구역');
 assert.equal(profileH(-1),18);assert.equal(profileH(FINISH_S+1),0);
 assert.ok(Math.abs(L.heightAt(L.SLED_RUN.deck.x,L.SLED_RUN.deck.z)-18)<.2);
});
test('코스: 마을 경계(울타리 열린 북쪽 통로 |x|<25·z ≥ -57, 그 아래는 울타리 원) 안에 길 전체가 들어감',()=>{
 for(const p of COURSE_POINTS)for(const o of [-COURSE_W/2,COURSE_W/2]){const q=courseXZ(p.s,o);
  const inside=q.z<-24?Math.abs(q.x)<25&&q.z>=L.BOUNDS.north+1-1:Math.hypot(q.x,q.z)<L.BOUNDS.r-.6;
  assert.ok(inside,`s=${p.s.toFixed(1)} (${q.x.toFixed(1)},${q.z.toFixed(1)})`);}
 assert.ok(COURSE_BOX.x1-COURSE_BOX.x0<=50&&COURSE_BOX.z1-COURSE_BOX.z0<=40,'가로·세로 크기');
 // 탄 사람 자리(눈둑 안)는 걸어 다니는 경계로도 막히지 않음
 const q=courseXZ(10,0);assert.ok(inNorthGap(q.x,q.z));const c=collideXmas(q.x,q.z);assert.ok(Math.hypot(c.x-q.x,c.z-q.z)<1e-9);
});
test('코스: 줄끼리 겹치지 않고 광장·집과도 떨어짐',()=>{
 for(const a of COURSE_POINTS)for(const b of COURSE_POINTS){if(Math.abs(a.s-b.s)<12)continue;assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>COURSE_W+1.4,`${a.s}·${b.s}`);}
 for(const p of COURSE_POINTS)assert.ok(Math.hypot(p.x,p.z)>L.PLAZA.radius+COURSE_W/2,'광장 돌바닥과 겹침');
 for(const [x,z,,s] of L.HOUSES){const n=nearestCourse(x,z,{maxD:30});assert.ok(!n||n.d>COURSE_W/2+2.4*s,`집 (${x},${z})`);}
});
test('코스: 8구간 — 출발 직선·굽이·점프 2·부스터 4·헤어핀·장애물 6(4+2)·결승, 구간 기록점 3',()=>{
 assert.equal(SECTIONS.start[1],20);assert.equal(JUMPS.length,2);assert.ok(JUMPS[0].h===.8&&JUMPS[1].h===1.2);
 assert.equal(BOOSTERS.length,4);assert.equal(OBSTACLES.filter(o=>o.kind==='pile').length,4);assert.equal(OBSTACLES.filter(o=>o.kind==='fir').length,2);
 assert.equal(CHECKPOINTS.length,3);assert.equal(CHECKPOINTS[2],FINISH_S);assert.ok(CHECKPOINTS[0]<CHECKPOINTS[1]&&CHECKPOINTS[1]<FINISH_S);
 // 장애물은 지그재그·사이 2m 이상 비어 지나갈 수 있음
 for(const o of OBSTACLES){const gapL=(o.off-o.r)-(-COURSE_W/2),gapR=COURSE_W/2-(o.off+o.r);assert.ok(Math.max(gapL,gapR)>=2,`${o.s} 옆 빈 곳`);}
 // 길 높이는 내려가기만(점프대 제외)
 let prev=99;for(const p of COURSE_POINTS){const h=profileH(p.s);assert.ok(h<=prev+1e-9);prev=h;}
 // 산 높이: 길 위는 길 높이, 0 아래 없음
 for(const s of [5,50,100,150]){const q=courseXZ(s,1);assert.ok(Math.abs(mountainH(q.x,q.z)-profileH(s))<.25,`s ${s}`);}
});
test('조작: 키를 톡 누르면 0.25초 안 작은 꺾임만(즉시 최대 아님), 떼면 0.15초에 0, 손 떼면 길 방향으로 돌아옴',()=>{
 const r=createRide({lane:2,start:5});r.step(1/60,{});
 r.step(1/60,{steer:1});assert.ok(r.steerNow<.1,`첫 프레임 ${r.steerNow}`);
 for(let i=0;i<14;i++)r.step(1/60,{steer:1});assert.ok(r.steerNow>.9&&r.steerNow<=1);
 for(let i=0;i<9;i++)r.step(1/60,{});assert.ok(Math.abs(r.steerNow)<.05,'0.15초에 0');
 const p0=Math.abs(r.psi);for(let i=0;i<60;i++)r.step(1/60,{});assert.ok(Math.abs(r.psi)<p0*.75,'길 방향으로 정렬');
 // 최대 꺾임 각속도 75°/s(빠르면 60°/s), 감도 배수
 const a=createRide({start:5,sens:SLED_SENS.fast}),b=createRide({start:5,sens:SLED_SENS.soft});
 for(let i=0;i<30;i++){a.step(1/60,{steer:1});b.step(1/60,{steer:1});}assert.ok(a.psi>b.psi*1.6);
 assert.deepEqual(SLED_SENS,{soft:.7,normal:1,fast:1.3});
});
test('드리프트: 꺾으며 0.8초 넘게 → 놓으면 미니 부스트, 1.6초면 더 큼',()=>{
 for(const [secs,lv] of [[1,1],[1.8,2]]){const r=createRide({start:30,v0:7});
  const ev=[];for(let i=0;i<secs*60;i++)ev.push(...r.step(1/60,{steer:1,drift:true}));
  ev.push(...r.step(1/60,{}));const mini=ev.find(e=>e.type==='mini');assert.ok(mini,`${secs}초`);assert.equal(mini.lv,lv);assert.ok(r.boosting);}
});
test('속도: 부스터·스타트 부스트가 있어도 12m/s를 넘지 않고, 출발 0.3초 안 밀기 = 스타트 부스트',()=>{
 const r=createRide({lane:2});const {ev}=run(r,(rd,t)=>({steer:botSteer(rd),push:t>.1&&t<.2}));
 assert.ok(ev.some(e=>e.type==='start'));assert.ok(ev.filter(e=>e.type==='boost').length>=3);
 const r2=createRide({lane:2});let max=0;run(r2,rd=>{max=Math.max(max,rd.v);return {steer:botSteer(rd)};});assert.ok(max<=12+1e-9&&max>10,`${max}`);
 const late=createRide({lane:2});let got=[];for(let i=0;i<40;i++)got.push(...late.step(1/60,{push:i>30}));assert.ok(!got.some(e=>e.type==='start'),'0.5초 뒤 밀면 부스트 없음');
});
test('보통 실력 한 번 25~30초, 점프 2번 착지·구간 3개·결승',()=>{
 for(const lane of [1,2,3,4]){const r=createRide({lane});const {ev}=run(r,rd=>({steer:botSteer(rd,{skill:.7})}));
  const fin=ev.find(e=>e.type==='finish');assert.ok(fin.t>=24&&fin.t<=31,`줄 ${lane}: ${fin.t}`);
  assert.equal(ev.filter(e=>e.type==='air').length,2);assert.equal(ev.filter(e=>e.type==='land').length,2);assert.equal(ev.filter(e=>e.type==='cp').length,3);}
});
test('장애물: 눈 더미 −40%, 전나무 −70%·옆으로 밀림, 점프 착지 25° 넘으면 −20%',()=>{
 const o=OBSTACLES.find(x=>x.kind==='pile'),f=OBSTACLES.find(x=>x.kind==='fir');
 const lane=v=>Math.round(v+2.5); // laneOffset 역
 const hit=(ob)=>{const r=createRide({start:ob.s-3,v0:7});r.step(1/60,{});const R=r;let ev=[];// 장애물 줄에 맞춰 옆 자리 고정
  for(let i=0;i<120&&!ev.some(e=>['pile','tree'].includes(e.type));i++){ev.push(...R.step(1/60,{steer:Math.max(-1,Math.min(1,(ob.off-R.off)*2-R.psi*3))}));}return ev;};
 assert.ok(hit(o).some(e=>e.type==='pile'));assert.ok(hit(f).some(e=>e.type==='tree'));
 // 점프대에서 크게 비틀어 착지 → 휘청
 const r=createRide({start:JUMPS[0].s-6,v0:8});let ev=[];for(let i=0;i<200&&!ev.some(e=>e.type==='land');i++)ev.push(...r.step(1/60,{steer:i>20?1:0}));
 assert.ok(ev.some(e=>e.type==='land'));
 assert.equal(starsOf(24),3);assert.equal(starsOf(30),2);assert.equal(starsOf(50),1);
 assert.equal(laneOffset(1),-1.5);assert.equal(laneOffset(4),1.5);
});
test('고스트: 0.1초마다 기록, 30초에 약 300점, 시각으로 자리 찾기',()=>{
 const g=createGhostRecorder(),r=createRide({lane:2});let t=0;while(!r.finished&&t<60){r.step(1/60,{steer:botSteer(r)});g.add(1/60,r.pose());t+=1/60;}
 assert.ok(Math.abs(g.points.length-t/.1)<3,`${g.points.length}점 / ${t.toFixed(1)}초`);
 const a=ghostAt(g.points,5),b=ghostAt(g.points,10);assert.ok(b.s>a.s);assert.ok(ghostAt(g.points,999).done);
});
test('레이스: 열기 → 10초 동안 같이 하기(최대 4명) → 3·2·1 → 출발 → 결승 순위 · 늦은 사람 15초 뒤 완주 못 함 · 기록판 5명',()=>{
 const R=createSledRace(),out=[],mem=new Map(),ctx={members:mem,send:(id,m)=>{out.push({to:id,...m});return true;},all:m=>out.push({to:'*',...m})};
 const who=id=>{const c={id,name:id};mem.set(id,c);return c;};
 const [a,b,c,d,e]=['a','b','c','d','e'].map(who);
 R.handle(a,{t:'sr:open',lane:1},T0,ctx);assert.equal(R.race.ph,'wait');
 R.handle(b,{t:'sr:join',lane:1},T0+500,ctx);assert.notEqual(R.race.riders.get('b').lane,1,'겹친 줄은 빈 줄로');
 R.handle(c,{t:'sr:join'},T0+600,ctx);R.handle(d,{t:'sr:join'},T0+700,ctx);R.handle(e,{t:'sr:join'},T0+800,ctx);
 assert.equal(R.race.riders.size,RACE.max);assert.equal(out.at(-1).reason,'full');
 R.tick(T0+RACE.waitMs+1,ctx);assert.equal(R.race.ph,'count');assert.equal(out.at(-1).go,RACE.countMs);
 R.tick(T0+RACE.waitMs+RACE.countMs+2,ctx);assert.equal(R.race.ph,'run');
 const go=R.race.goAt;
 R.handle(b,{t:'sr:fin',ms:26000},go+26000,ctx);R.handle(a,{t:'sr:fin',ms:27500},go+27500,ctx);
 R.handle(c,{t:'sr:fin',ms:5000},go+28000,ctx);assert.equal(out.at(-1).reason,'bad','말이 안 되게 빠른 기록은 거름');
 R.tick(go+26000+RACE.lateMs+1,ctx);assert.equal(R.race.ph,'done');
 const v=out.filter(m=>m.t==='sr').at(-1);assert.deepEqual(v.r.map(x=>[x.id,x.rank??null,!!x.dnf]),[['a',2,false],['b',1,false],['c',null,true],['d',null,true]]);
 const bd=out.filter(m=>m.t==='sr:board').at(-1);assert.deepEqual(bd.b.map(x=>x.n),['b','a']);
 // 혼자 기록도 기록판에(같은 사람은 가장 좋은 것 하나)
 for(const [id,ms] of [['x',30000],['y',31000],['z',25000],['w',40000],['a',20000]]){who(id);R.handle(mem.get(id),{t:'sr:rec',ms},go+40000,ctx);}
 const b2=out.filter(m=>m.t==='sr:board').at(-1);assert.equal(b2.b.length,5);assert.deepEqual(b2.b.map(x=>x.n),['a','z','b','x','y']);
 // 다음 날(서울)이면 비어 보임
 assert.equal(R.boardView(go+86400e3*2).b.length,0);
 // 끝나고 20초 뒤 레이스 지움 → 다시 열 수 있음
 R.tick(go+26000+RACE.lateMs+RACE.keepMs+5,ctx);assert.equal(R.race,null);
});
test('레이스: 기다리는 동안 나가면 빠지고, 연 사람이 「바로 출발」, 다 나가면 없어짐',()=>{
 const R=createSledRace(),out=[],mem=new Map(),ctx={members:mem,send:(id,m)=>{out.push(m);return true;},all:m=>out.push(m)};
 const a={id:'a',name:'a'},b={id:'b',name:'b'};mem.set('a',a);mem.set('b',b);
 R.handle(a,{t:'sr:open',lane:2},T0,ctx);R.handle(b,{t:'sr:join',lane:3},T0+100,ctx);
 R.handle(b,{t:'sr:go'},T0+200,ctx);assert.equal(R.race.ph,'wait','연 사람만 바로 출발');
 R.handle(a,{t:'sr:go'},T0+300,ctx);assert.equal(R.race.ph,'count');
 R.handle(a,{t:'sr:quit'},T0+400,ctx);assert.equal(R.race.host,'b');mem.delete('b');R.tick(T0+500,ctx);assert.equal(R.race,null);
});
test('서버: 썰매 레이스 메시지가 열려 있고, 썰매 타는 사람(act.sl 5)만 14m/s까지 순간이동 검사 통과',()=>{
 for(const t of ['sr:open','sr:join','sr:go','sr:quit','sr:fin','sr:rec'])assert.ok(EXPERIENCE_MESSAGES.christmas.includes(t)&&XMAS_PLAY_MESSAGES.includes(t),t);
 assert.deepEqual(sanitizeAct('christmas',{sl:5,cr:1,tm:2}),{sl:5,cr:1,tm:2});assert.ok(!sanitizeAct('christmas',{sl:7})?.sl);
 let t=T0;const rooms=createRooms({now:()=>t});
 const join=name=>rooms.join({experience:'christmas',room:'눈마을-1',name,send:()=>{}}).client;
 const a=join('하나'),b=join('둘');
 const move=(c,x,z)=>rooms.message(c,{t:'s',q:1,z:0,x,y:z,h:0,v:0,f:0});
 move(a,0,-40);move(b,0,-40);t+=1000;move(a,0,-40);move(b,0,-40);
 // 1초에 15m(여유 2m 포함 걷기 한도 14m 넘음): 걷는 사람은 거부, 썰매 탄 사람(한도 16m)은 받음
 rooms.message(b,{t:'act',a:{sl:5}});
 t+=1000;move(a,15,-40);move(b,15,-40);
 a.state=rooms.clients.get(a.id).state;b.state=rooms.clients.get(b.id).state;
 assert.ok(Math.abs(a.state.x-15)>1,'걷는 사람은 거부');assert.ok(Math.abs(b.state.x-15)<1e-9,'썰매는 통과');
});
