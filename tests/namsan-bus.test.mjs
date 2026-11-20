// 남산 순환버스 시간표(한 게임 통합 5단계, 월드개발 11-20). src/namsan/namsan-bus.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround} from '../src/namsan/namsan-data.js';
import {createBusTimetable,BUS_RULE,otherStop,mmss} from '../src/namsan/namsan-bus.js';

const dir='assets/shared/namsan/';
const meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},
 course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:JSON.parse(readFileSync(dir+'walls.json','utf8')).walls,busRoad:JSON.parse(readFileSync(dir+'bus-road.json','utf8'))};
const G=createNamsanGround(data),TT=createBusTimetable(G.bus.cycle,G.bus.stops);

test('한 바퀴: 두 정류장에 12초씩 서고, 속도 10m/s(서버 위치 한도 12m/s 안)', ()=>{
 assert.ok(BUS_RULE.speed<12);
 assert.ok(Math.abs(TT.T-(2*BUS_RULE.dwell+TT.L/BUS_RULE.speed))<1e-6);
 const a=TT.at(1);assert.equal(a.stop,'start');assert.equal(a.s,G.bus.stops.start.s);
 const b=TT.at(BUS_RULE.dwell+TT.tUp+1);assert.equal(b.stop,'summit');assert.equal(b.s,G.bus.stops.summit.s);
 // 달리는 동안 1초에 10m
 const c=TT.at(BUS_RULE.dwell+10),d=TT.at(BUS_RULE.dwell+11);assert.ok(Math.abs(((d.s-c.s+TT.L)%TT.L)-10)<1e-6);
 assert.ok(TT.tUp/60>2.5&&TT.tUp/60<4,`정상까지 ${(TT.tUp/60).toFixed(1)}분`);
});
test('버스 2대는 반 바퀴 간격, 같은 시각이면 어느 화면에서나 같은 자리', ()=>{
 const t=1795150000.5,a=TT.bus(0,t),b=TT.bus(1,t);assert.deepEqual(TT.bus(0,t),a);
 const u=TT.bus(0,t+TT.T/2);assert.equal(u.s,b.s);
});
test('다음 버스: 서 있으면 0, 아니면 남은 초가 한 바퀴의 반보다 짧다(2대)', ()=>{
 for(let t=0;t<TT.T;t+=7){for(const stop of ['start','summit']){const n=TT.next(stop,t);assert.ok(n.wait>=0&&n.wait<=TT.T/2+1e-6,`${stop} ${t} ${n.wait}`);
  if(n.wait===0)assert.equal(TT.bus(n.k,t).stop,stop);else assert.equal(TT.bus(n.k,t+n.wait+.01).stop,stop);}}
});
test('탄 버스가 내릴 정류장에 서기까지 남은 초', ()=>{
 const t=5;assert.equal(TT.bus(0,t).stop,'start');const w=TT.untilStop(0,t,'summit');assert.equal(TT.bus(0,t+w+.01).stop,'summit');
 assert.equal(otherStop('start'),'summit');assert.equal(mmss(84.2),'1:25');assert.equal(mmss(0),'0:00');
});
