// 11-27 새 기계 ① 불빛 쌓기 「별빛 탑」(규칙서 docs/인형뽑기/새기계3종-규칙서-v1.md §1, 시안 stack.js 판정 그대로)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLAW_TUNING,stackPos,stackStop,stackMissText,rulesFor,pityOn,pityAfter,KINDS,KIND_INFO,PITY_NAME,freshState,recordResult,pityLeft} from '../src/claw/claw-rules.js';
import {MACHINES,plushInfo} from '../src/claw/claw-palette.js';
import {buildStackMachine,STACK} from '../src/claw/claw-stack.js';
import {MACHINE_SPOTS,SHOP,buildClawShop} from '../src/claw/claw-shop-art.js';
import {CLAW_SOUNDS} from '../src/claw/claw-audio.js';
const C=CLAW_TUNING.stack,M=MACHINES.find(m=>m.kind==='stack');

test('조절값 = 규칙서 §1 제안값(7칸·11줄·7줄 작은 인형·시작 3칸·도움 4칸·빠르기 표·10초·0.8초·20초)',()=>{
 assert.deepEqual({cols:C.cols,rows:C.rows,mid:C.mid,width:C.width,pityWidth:C.pityWidth,idleSec:C.idleSec,readySec:C.readySec,choiceSec:C.choiceSec},{cols:7,rows:11,mid:7,width:3,pityWidth:4,idleSec:10,readySec:.8,choiceSec:20});
 assert.deepEqual([...C.steps],[140,125,110,100,90,80,75,75,75,75,75]);
 assert.equal(pityAfter('stack'),5);assert.ok(pityOn('stack'));assert.equal(PITY_NAME.stack,'직원 도움');assert.ok(KINDS.includes('stack'));assert.equal(KIND_INFO.stack.level,2);
});
test('막대 움직임: 칸 단위 왕복, 홀수 줄 왼쪽·짝수 줄 오른쪽 출발, 줄 빠르기 표대로',()=>{
 assert.deepEqual(stackPos(0,1,3),{x:0,dir:1});assert.deepEqual(stackPos(139,1,3),{x:0,dir:1});assert.deepEqual(stackPos(140,1,3),{x:1,dir:1});
 assert.equal(stackPos(140*4,1,3).x,4);assert.deepEqual(stackPos(140*5,1,3),{x:3,dir:-1},'벽(4칸)에서 되돌아옴');assert.equal(stackPos(140*8,1,3).x,0);
 assert.deepEqual(stackPos(0,2,3),{x:4,dir:-1},'짝수 줄은 오른쪽에서');assert.equal(stackPos(125,2,3).x,3);
 assert.equal(stackPos(75*3,8,3).x,1,"8줄(짝수)은 오른쪽 4에서 3칸 왼쪽");assert.deepEqual(stackPos(1e5,3,7),{x:0,dir:0},'판 폭 칸이면 안 움직임');
});
test('멈춤 판정: 아래 줄과 겹친 칸만 남고, 늦음/빠름은 움직이던 방향 기준',()=>{
 assert.deepEqual(stackStop(2,3,1,null),{x:2,w:3,lost:[],late:false},'1줄은 그대로');
 assert.deepEqual(stackStop(3,3,1,{x:2,w:3}),{x:3,w:2,lost:[5],late:true},'오른쪽으로 가다 한 칸 늦음');
 assert.deepEqual(stackStop(1,3,1,{x:2,w:3}),{x:2,w:2,lost:[1],late:false},'한 칸 빠름');
 assert.deepEqual(stackStop(3,3,-1,{x:2,w:3}),{x:3,w:2,lost:[5],late:false},'왼쪽으로 가던 중이면 오른쪽에 남은 건 빠름');
 assert.equal(stackStop(5,2,1,{x:2,w:3}).w,0,'다 어긋나면 0칸 = 끝');
 assert.equal(stackMissText({r:5,lost:2,late:true}),'5줄에서 2칸 늦었어요');assert.equal(stackMissText({r:6,lost:0}),'');
});
test('기계: stack-1 = 맨 뒤(act m 17), 7줄 작은·11줄 큰 인형(도감에 있는 인형), 어려움 2, 앞벽 빈 자리 A',()=>{
 assert.equal(MACHINES.indexOf(M),16);assert.equal(M.id,'stack-1');assert.ok(plushInfo(M.prizes.small)&&plushInfo(M.prizes.big));assert.ok(M.pool.includes(M.prizes.small)&&M.pool.includes(M.prizes.big));
 assert.equal(MACHINE_SPOTS.length,MACHINES.length);assert.deepEqual({...MACHINE_SPOTS[16]},{x:-2.4,z:4.95,heading:Math.PI});
 assert.ok(!SHOP.empty.some(e=>e.x===-2.4),'빈 자리 덮개가 기계 자리와 안 겹침');
});
test('규칙 카드 글: 7줄·11줄 인형 이름, 계속해도 받은 인형 그대로·코인 안 듦, 직원 도움 4칸',()=>{
 const o=rulesFor('stack-1',M.pool);assert.equal(o.kind,'stack');const t=o.lines.join(' ');
 assert.match(t,/7줄 = 다람쥐, 11줄\(꼭대기\) = 큰 눈송이/);assert.match(t,/이미 받은 다람쥐는 그대로예요. 코인도 더 안 들어요/);assert.match(o.pity,/5번 연달아 끝나면 직원이 시작 칸을 4칸으로/);
});
test('저장: 7줄 작은 인형은 바로 기록(보장 0), 끝나고 다시 적지 않음 · 경품 없이 끝나면 보장 +1',()=>{
 const s=freshState();for(let i=0;i<4;i++)recordResult(s,'stack-1',{kind:'miss'});assert.equal(pityLeft(s,'stack-1'),1);
 const r=recordResult(s,'stack-1',{kind:'win',id:'squirrel'});assert.ok(r.isNew);assert.equal(s.pity['stack-1'],0);assert.equal(s.dex.squirrel.n,1);
 const main=readFileSync(new URL('../src/claw/main.js',import.meta.url),'utf8');assert.match(main,/res\.pre&&stackPre\?\.id===res\.id/,'작은 인형은 결과 카드 때 다시 안 적음');
});
test('그림: 판 7×11(칸 8cm)·경품 두 인형 표시·단추·카메라·조작 자세 점, 판 상태 바꾸기',()=>{
 const g=buildStackMachine(M),U=g.userData;
 assert.equal(U.kind,'stack');assert.ok(U.spots.button&&U.spots.stand&&U.camera&&U.setLights&&U.update&&U.press);
 assert.equal(STACK.cols*STACK.cell,.56);assert.ok(Math.abs(STACK.rows*STACK.cell-.88)<1e-9);assert.ok(U.prizes.small&&U.prizes.big);
 U.setBoard({rows:[{x:2,w:3}],cur:{r:2,x:1,w:3},falling:[{c:5,r:2}]});assert.deepEqual(U.board.rows,[{x:2,w:3}]);assert.equal(U.board.idle,false);U.update(.1);
 U.clearBoard();assert.equal(U.board.idle,true);assert.deepEqual(U.board.rows,[]);
 const shop=buildClawShop({kinds:true}),m=shop.userData.machines[16];assert.equal(m.kind,'stack');assert.equal(m.group.userData.kind,'stack');
});
test('소리: 칸 틱·멈춤·떨어짐·7줄 띠링이 효과음 목록에',()=>{for(const n of ['step','snap','fall','ding'])assert.ok(CLAW_SOUNDS.includes(n),n);});
test('화면: 7줄 고르기 카드(계속하기·여기서 끝·남은 초), 옆에서 보기 없음, 바깥 누름·Esc로 안 닫힘',()=>{
 const js=readFileSync(new URL('../src/claw/claw-hud.js',import.meta.url),'utf8'),main=readFileSync(new URL('../src/claw/main.js',import.meta.url),'utf8');
 assert.match(js,/data-c="sgo" data-main>▲ 계속하기/);assert.match(js,/data-c="send">여기서 끝/);assert.match(js,/data-left/);
 assert.match(js,/cardKind!=='result'&&cardKind!=='choice'/);assert.match(main,/hud\.card!=='result'&&hud\.card!=='choice'/);
 const blk=js.slice(js.indexOf("else if(kind==='stack'){const ph="),js.indexOf("else if(kind==='timer'){const run"));assert.match(blk,/,\[\]\);\}/,'불빛 쌓기는 할 일 칩(👁) 없음');
});

// 사람 손 시험(규칙서 §4와 같은 모델: 아래 줄과 딱 맞는 칸 시간 가운데 + σ60ms, 1줄은 아무 데서나): 7줄 약 46%·11줄 약 7% 근처인지
test('사람 손 모의(σ60ms, 2만 판): 7줄 35~55% · 11줄 3~12%',()=>{
 let seed=20261127;const rnd=()=>{seed=seed*1103515245+12345&0x7fffffff;return seed/0x7fffffff;};const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
 let mid=0,top=0;const N=20000;
 for(let n=0;n<N;n++){const rows=[];let w=C.width,r=1;
  for(;r<=C.rows;r++){const b=rows[r-2],st=C.steps[r-1];let tc=250+rnd()*600;
   if(b){for(let k=Math.ceil(250/st);k<400;k++){const tt=(k+.5)*st;if(stackPos(tt,r,w).x===b.x){tc=tt;break;}}}
   const t=Math.max(0,tc+gauss()*60),{x,dir}=stackPos(t,r,w),j=stackStop(x,w,dir,b??null);if(!j.w)break;rows.push({x:j.x,w:j.w});w=j.w;}
  const h=rows.length;if(h>=C.mid)mid++;if(h>=C.rows)top++;}
 const pm=mid/N,pt=top/N;console.log(`  7줄 ${(pm*100).toFixed(1)}% · 11줄 ${(pt*100).toFixed(1)}%`);
 assert.ok(pm>.35&&pm<.55,`7줄 ${pm}`);assert.ok(pt>.03&&pt<.12,`11줄 ${pt}`);
});
