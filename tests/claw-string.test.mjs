// 11-27 새 기계 ② 줄 자르기 「가위로 툭」(규칙서 §2, 시안 string.js 판정 그대로)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLAW_TUNING,stringSway,stringX,judgeString,stringMissText,rulesFor,pityOn,pityAfter,KINDS,KIND_INFO} from '../src/claw/claw-rules.js';
import {MACHINES,plushInfo} from '../src/claw/claw-palette.js';
import {MACHINE_SPOTS,SHOP,buildClawShop} from '../src/claw/claw-shop-art.js';
import {STRING} from '../src/claw/claw-string-art.js';
import {CLAW_SOUNDS} from '../src/claw/claw-audio.js';
const C=CLAW_TUNING.string,M=MACHINES.find(m=>m.kind==='string');
test('조절값 = 규칙서 §2(안 폭 0.60·줄 0.22/0.42·15cm/s·진폭 5cm±15%·1.4초·±3mm·×2·8판 도움) = 그림 치수',()=>{
 assert.deepEqual({inner:C.inner,strings:[...C.strings],start:C.start,end:C.end,speed:C.speed,ampM:C.ampM,ampVar:C.ampVar,periodSec:C.periodSec,cutHalfM:C.cutHalfM,nearMul:C.nearMul,pityAfter:C.pityAfter,zoom:C.zoom},
  {inner:.6,strings:[.22,.42],start:.04,end:.56,speed:.15,ampM:.05,ampVar:.15,periodSec:1.4,cutHalfM:.003,nearMul:2,pityAfter:8,zoom:2.2});
 assert.equal(STRING.inner,C.inner);assert.deepEqual([...STRING.strings],[...C.strings]);assert.equal(STRING.zoom,C.zoom);
 assert.ok(KINDS.includes('string')&&pityOn('string')&&pityAfter('string')===8&&KIND_INFO.string.level===3);
});
test('흔들림: 진폭 0.85~1.15×5cm, 주기 1.4초, 직원 도움이면 0',()=>{
 let mx=0;for(let t=0;t<20000;t+=5)mx=Math.max(mx,Math.abs(stringSway(t,0)));assert.ok(mx>.05&&mx<=.0575+1e-9,String(mx));
 assert.ok(Math.abs(stringSway(1234,1)-stringSway(1234+1400,1))<.012,'주기 1.4초(진폭 변화만큼만 다름)');assert.equal(stringSway(999,0,true),0);assert.equal(stringX(5,0,true),.22);
});
test('판정: 가까운 줄·±3mm 성공·±6mm 아까움·그 밖 실패, 거리 글',()=>{
 assert.equal(judgeString(.222,0,true).r,'win');assert.equal(judgeString(.225,0,true).r,'near');assert.equal(judgeString(.23,0,true).r,'miss');assert.equal(judgeString(.41,0,true).i,1);
 assert.equal(stringMissText(-.004),'4mm 왼쪽');assert.equal(stringMissText(.018),'1.8cm 오른쪽');
});
test('기계: string-1 = 맨 뒤(act m 18), 줄마다 큰 인형(도감에 있음), 앞벽 빈 자리 B, 빈 자리 덮개 없음',()=>{
 assert.equal(MACHINES.indexOf(M),17);assert.ok(M.prizes.every(id=>plushInfo(id)&&M.pool.includes(id)));assert.equal(M.prizes.length,2);
 assert.deepEqual({...MACHINE_SPOTS[17]},{x:2.4,z:4.95,heading:Math.PI});assert.equal(SHOP.empty.length,0);
 const shop=buildClawShop({kinds:true}),m=shop.userData.machines[17];assert.equal(m.group.userData.kind,'string');assert.ok(m.group.userData.cutCamera&&m.group.userData.spots.button);
});
test('규칙 카드 글·소리·화면(② 주황 싹둑·옆에서 보기 없음·② 카메라 다가감)',()=>{
 const o=rulesFor('string-1',M.pool);assert.match(o.lines.join(' '),/±3mm/);assert.match(o.lines.join(' '),/±6mm/);assert.match(o.pity,/8번 연달아 못 자르면 직원이 줄을 잡아/);
 for(const n of ['scissor','nick'])assert.ok(CLAW_SOUNDS.includes(n));
 const js=readFileSync(new URL('../src/claw/claw-hud.js',import.meta.url),'utf8'),main=readFileSync(new URL('../src/claw/main.js',import.meta.url),'utf8');
 assert.match(js,/tone:cutting\|\|drop\?'cut':''/);assert.match(js,/허공을 잘랐어요/);assert.match(main,/cutCamera\(gv\.u/);
});
test('사람 손 모의(σ60ms, 2만 판, 시안 손 모델): 판당 9~22%, 도움 판이 더 쉬움',()=>{
 let seed=20261127;const rnd=()=>{seed=seed*1103515245+12345&0x7fffffff;return seed/0x7fffffff;};const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
 const run=still=>{let w=0;const N=20000;for(let n=0;n<N;n++){const tgt=C.strings[rnd()<.5?0:1],blade=Math.min(C.end,Math.max(C.start,tgt+gauss()*.06*C.speed));const i=Math.abs(C.strings[0]-blade)<Math.abs(C.strings[1]-blade)?0:1;
  const t0=rnd()*1e6+400;let tt=t0;for(let q=0;q<3000;q+=5){if(Math.sign(stringX(t0+q,i,still)-blade)!==Math.sign(stringX(t0+q+5,i,still)-blade)){tt=t0+q;break;}}
  if(judgeString(blade,tt+gauss()*60,still).r==='win')w++;}return w/N;};
 const p=run(false),pp=run(true);console.log(`  보통 판 ${(p*100).toFixed(1)}% · 도움 판 ${(pp*100).toFixed(1)}%`);assert.ok(p>.09&&p<.22,String(p));assert.ok(pp>p,String(pp));
});
