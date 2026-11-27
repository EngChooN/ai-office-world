// 11-27 새 기계 ③ 공 구멍 넣기 「공 떨어뜨리기」(규칙서 §3·§7, 공 움직임 claw-ball-physics.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLAW_TUNING,rulesFor,pityOn,pityAfter,KINDS} from '../src/claw/claw-rules.js';
import {MACHINES,plushInfo} from '../src/claw/claw-palette.js';
import {MACHINE_SPOTS,buildClawShop,SHOP} from '../src/claw/claw-shop-art.js';
import {BALL,holeCenter} from '../src/claw/claw-ball-art.js';
import {simulateBall,judgeBall,ballAt,ballPathTo,holeXY,holeIndex} from '../src/claw/claw-ball-physics.js';
import {CLAW_SOUNDS} from '../src/claw/claw-audio.js';
const C=CLAW_TUNING.ball,M=MACHINES.find(m=>m.kind==='ball');
test('조절값 = 규칙서 §3 = 그림 치수(4×4·6cm·공 1.3·구멍 2.1/1.6cm·초당 9cm·15초·5판 도움)',()=>{
 assert.deepEqual({n:C.n,pitchM:C.pitchM,ballR:C.ballR,holeR:C.holeR,rareHoleR:C.rareHoleR,speed:C.speed,timeSec:C.timeSec,rareIn:C.rareIn},{n:4,pitchM:.06,ballR:.013,holeR:.021,rareHoleR:.016,speed:.09,timeSec:15,rareIn:.6});
 assert.deepEqual([BALL.n,BALL.pitch,BALL.ballR,BALL.holeR,BALL.rareHoleR],[C.n,C.pitchM,C.ballR,C.holeR,C.rareHoleR]);
 for(const [i,j] of [[0,0],[3,0],[1,2]])assert.deepEqual(holeXY(i,j).map(v=>+v.toFixed(6)),holeCenter(i,j).map(v=>+v.toFixed(6)));
 assert.ok(KINDS.includes('ball')&&pityOn('ball')&&pityAfter('ball')===5);
});
test('공 움직임: 늘 구멍 하나에 멈춤·판 밖으로 안 나감·같은 씨앗 = 같은 길·약 2초·한 판 계산 2ms 안',()=>{
 const t0=performance.now();let n=0,secs=0;
 for(let s=1;s<=400;s++){const from={x:((s*37)%23-11)/100,z:((s*53)%23-11)/100},r=simulateBall(from,s);n++;secs+=r.sec;
  assert.ok(r.i>=0&&r.i<4&&r.j>=0&&r.j<4,`구멍 ${r.hole}`);for(const p of r.path)assert.ok(Math.abs(p.x)<=.12+1e-9&&Math.abs(p.z)<=.12+1e-9,'판 안');
  const end=ballAt(r.path,r.sec);assert.equal(end.sink,1);const [hx,hz]=holeXY(r.i,r.j);assert.ok(Math.hypot(end.x-hx,end.z-hz)<1e-6,'끝 = 그 구멍 가운데');}
 const ms=(performance.now()-t0)/n;console.log(`  한 판 계산 ${ms.toFixed(3)}ms · 평균 ${(secs/n).toFixed(2)}초`);assert.ok(ms<2,String(ms));assert.ok(secs/n>1.3&&secs/n<3,String(secs/n));
 assert.deepEqual(simulateBall({x:.01,z:-.02},77),simulateBall({x:.01,z:-.02},77));
});
test('판정: 색 구멍 성공·도움 구멍(보장 판만)·옆 칸/희귀 굴러 지나감 아까움·그 밖 실패',()=>{
 const holes=M.holes;
 assert.equal(judgeBall({hole:'1,1',rolledRare:false},{holes}).r,'win');assert.equal(judgeBall({hole:'3,0',rolledRare:false},{holes}).r,'win');
 assert.equal(judgeBall({hole:'1,2',rolledRare:false},{holes}).r,'near','1,2는 1,1 바로 아래 = 아까움');assert.equal(judgeBall({hole:'1,2',rolledRare:false},{holes,pityKey:'1,2'}).r,'win');
 assert.equal(judgeBall({hole:'0,3',rolledRare:false},{holes}).r,'miss');assert.deepEqual(judgeBall({hole:'0,3',rolledRare:true},{holes}),{r:'near',hole:'0,3',why:'rare'});
});
test('구경: 받은 구멍에서 끝나는 길을 만듦(16구멍 모두)',()=>{for(let v=0;v<16;v++){const r=ballPathTo({x:0,z:0},v);assert.equal(holeIndex(r.i,r.j),v);assert.equal(ballAt(r.path,r.sec).sink,1);}});
test('기계: ball-1 = 맨 뒤(act m 19), 구멍 경품은 도감 인형, 왼벽 봉 4 다음·서는 자리 비어 있음',()=>{
 assert.equal(MACHINES.indexOf(M),18);for(const id of [...Object.values(M.holes),M.pityPrize])assert.ok(plushInfo(id)&&M.pool.includes(id),id);assert.equal(plushInfo(M.holes[M.rare]).rarity,'rare');
 assert.deepEqual({...MACHINE_SPOTS[18]},{x:-6.45,z:2.8,heading:Math.PI/2});
 const shop=buildClawShop({kinds:true}),U=shop.userData,m=U.machines[18],W=SHOP.walk;assert.equal(m.group.userData.kind,'ball');
 const inside=(x,z,c)=>c.r?Math.hypot(x-c.x,z-c.z)<c.r:x>c.x0&&x<c.x1&&z>c.z0&&z<c.z1;assert.ok(!U.colliders.some(c=>inside(m.stand.x,m.stand.z,c))&&m.stand.x>W.x[0],'서는 자리');
});
test('규칙 글·소리·화면(십자 판·⏱·떨어뜨리기·안내는 칩에)',()=>{
 const o=rulesFor('ball-1',M.pool);assert.match(o.lines.join(' '),/그림자 점/);assert.match(o.lines.join(' '),/돔돌이\(희귀\)/);assert.match(o.pity,/5번 연달아 못 넣으면 직원이 초록 도움 구멍/);
 for(const n of ['tock','pop'])assert.ok(CLAW_SOUNDS.includes(n));
 const js=readFileSync(new URL('../src/claw/claw-hud.js',import.meta.url),'utf8');assert.match(js,/kind==='claw'\|\|kind==='ball'/);assert.match(js,/그림자 점을 노란 구멍 위로/);assert.match(js,/쏙! /);
});
test('사람 손 모의(놓는 자리 σ8mm, 4천 판): 노랑 겨누면 15~27%',()=>{
 let seed=5;const u=()=>{seed=seed*1103515245+12345&0x7fffffff;return seed/0x7fffffff;},g=()=>{let a=0,b=0;while(!a)a=u();while(!b)b=u();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);};
 const rate=([i,j],pk=null)=>{let w=0,nr=0;const N=4000;for(let n=0;n<N;n++){const [hx,hz]=holeXY(i,j),r=simulateBall({x:hx+g()*.008,z:hz+g()*.008},n*31+7),jr=judgeBall(r,{holes:M.holes,pityKey:pk});if(jr.r==='win')w++;else if(jr.r==='near')nr++;}return [w/N,nr/N];};
 const [y,yn]=rate([1,1]),[r]=rate([3,0]),[p]=rate([1,1],'1,2');console.log(`  노랑 ${(y*100).toFixed(1)}%(아까움 ${(yn*100).toFixed(1)}%) · 보라 ${(r*100).toFixed(1)}% · 도움 판 ${(p*100).toFixed(1)}%`);
 assert.ok(y>.15&&y<.27,String(y));assert.ok(p>y,String(p));
});
