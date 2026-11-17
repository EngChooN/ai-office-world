// 크리스마스 「밝고 화려하게」 시안 B 놀이 시설 자리(월드아트 11-17): 아이스링크·회전목마 좌석 값이 땅·광장 배치와 맞는지
import test from 'node:test';
import assert from 'node:assert/strict';
import {RINK,inRink,CAROUSEL,CAROUSEL_SEATS,SEAT_SIT_Y,carouselSeatAt,carouselSpin,nearestFreeSeat} from '../src/christmas/festive-layout.js';
import {PLAZA_B,festiveB,lookLevel} from '../src/christmas/festive-layout.js';
// 11-17 4차: 링크·회전목마는 시안 B 전용이라 「넓힌 광장」(?look=festive-b) 배치와 대조한다. 주소 없는 배치(지금 화면·서버)는 따로 불러 그대로인지 본다.
globalThis.location={search:'?look=classic'};
const BASE=await import('../src/christmas/layout.js?base');
globalThis.location={search:'?look=festive-b'};
const BL=await import('../src/christmas/layout.js?festive-b');
const {heightAt,TARGETS,SPAWN,ENTRANCE,HOUSES,LAMPS,PLAZA,campfireSeats,displaySlots,MAILBOX,CAMPFIRE,CARD_BOARD,DIVIDER,SNOWMAN_YARD,SNOWBALL_YARD}=BL;

test('아이스링크 얼음은 링크 안 가장 높은 땅보다 5cm 이상 위', ()=>{
 let mx=-1;for(let x=-RINK.w/2;x<=RINK.w/2;x+=.1)for(let z=-RINK.d/2;z<=RINK.d/2;z+=.1)if(inRink(RINK.x+x,RINK.z+z))mx=Math.max(mx,heightAt(RINK.x+x,RINK.z+z));
 assert.ok(RINK.iceY>=mx+.05,`iceY ${RINK.iceY} / 땅 ${mx.toFixed(3)}`);assert.ok(RINK.iceY-mx<.2,'얼음이 너무 뜸');});
test('아이스링크는 광장 밖·울타리 안이고 놀이 자리·집·가로등·입구와 떨어져 있다', ()=>{
 const far=(x,z,m)=>!inRink(x,z,-m);
 assert.ok(Math.hypot(RINK.x,RINK.z)-Math.hypot(RINK.w,RINK.d)/2>PLAZA.radius-1);
 for(let a=0;a<6.28;a+=.1){const x=RINK.x+Math.sin(a)*RINK.w/2,z=RINK.z+Math.cos(a)*RINK.d/2;assert.ok(Math.hypot(x,z)<PLAZA.fence-1.5);}
 for(const [k,t] of Object.entries(TARGETS))assert.ok(far(t.x,t.z,t.r),k);
 for(const [x,z,,s] of HOUSES)assert.ok(far(x,z,2.9*s+.8),`집 ${x},${z}`);
 for(const [x,z] of LAMPS)assert.ok(far(x,z,1),`가로등 ${x},${z}`);
 assert.ok(far(SPAWN.x,SPAWN.z,SPAWN.spread+2)&&far(ENTRANCE.x,ENTRANCE.z,4));
 for(const s of [...campfireSeats(),...displaySlots(),MAILBOX.stand])assert.ok(far(s.x,s.z,1));
 // 문 밖 자리는 링크 밖, 문 안 자리는 링크 안
 assert.ok(!inRink(RINK.gate.stand.x,RINK.gate.stand.z,-.3)&&inRink(RINK.gate.inside.x,RINK.gate.inside.z,.3));});
test('큰 아이스링크(11-17 5차): 얼음 140㎡ 이상(30명 한 사람 약 5㎡)·실제 모서리까지 울타리 안·빛 터널·선물상자·회전목마와 떨어짐', ()=>{
 let n=0;for(let x=-RINK.w/2;x<=RINK.w/2;x+=.1)for(let z=-RINK.d/2;z<=RINK.d/2;z+=.1)if(inRink(RINK.x+x,RINK.z+z)&&Math.hypot(x+RINK.x-RINK.island.x,z+RINK.z-RINK.island.z)>RINK.island.r)n++;
 assert.ok(n*.01>=140,`얼음 ${(n*.01).toFixed(0)}㎡`);
 const hw=RINK.w/2-RINK.corner,hd=RINK.d/2-RINK.corner;
 for(const sx of [-1,1])for(const sz of [-1,1])assert.ok(Math.hypot(RINK.x+sx*hw,RINK.z+sz*hd)+RINK.corner<PLAZA.fence-1.2,'모서리 울타리');
 // 입구 빛 터널(길 가운데 ±3.4m)·문 밖 1.4m 단추 자리가 길 위에 있지 않음
 assert.ok(RINK.x+RINK.w/2<-3.4-2&&RINK.gate.stand.x<-3.4-1);
 assert.ok(!inRink(PLAZA_B.giftBox.x,PLAZA_B.giftBox.z,-2.5),'선물상자');
 assert.ok(Math.hypot(RINK.x-CAROUSEL.x,RINK.z-CAROUSEL.z)>RINK.w/2+CAROUSEL.baseR+5);
 for(const [x,z] of PLAZA_B.pathTrees)assert.ok(!inRink(x,z,-1),`길가 트리 ${x},${z}`);
 for(const [x,z] of RINK.penguins)assert.ok(inRink(x,z,.6)&&Math.hypot(x-RINK.island.x,z-RINK.island.z)>RINK.island.r+1,`펭귄 ${x},${z}`);});
test('회전목마 자리 16개(11-17 5차): 루돌프 8·썰매 의자 4대×2(모두 진행 방향), 바닥판 안·지붕 아래', ()=>{
 assert.equal(CAROUSEL_SEATS.length,16);assert.equal(CAROUSEL_SEATS.filter(s=>s.kind==='deer').length,8);
 CAROUSEL_SEATS.forEach((s,i)=>assert.equal(s.id,i));assert.ok(CAROUSEL.R>=3.5&&CAROUSEL.roofY>=4);
 const g=heightAt(CAROUSEL.x,CAROUSEL.z);
 for(const s of CAROUSEL_SEATS)for(const ms of [0,3100,9876,123456789012]){const p=carouselSeatAt(s.id,ms,g);
  const r=Math.hypot(p.x-CAROUSEL.x,p.z-CAROUSEL.z);assert.ok(r<CAROUSEL.R-.2&&r>.6,`자리 ${s.id} r ${r}`);
  assert.ok(p.y-g>CAROUSEL.floorY+.2&&p.y-g<1.4,`자리 ${s.id} 높이 ${p.y-g}`);
  // 바라보는 방향: 루돌프 = 바깥, 썰매 = 진행(시계 반대)
  const fx=-Math.sin(p.heading),fz=-Math.cos(p.heading),ox=(p.x-CAROUSEL.x)/r,oz=(p.z-CAROUSEL.z)/r;
  if(s.face==='out')assert.ok(fx*ox+fz*oz>.95);else assert.ok(fx*oz-fz*ox>.95,`자리 ${s.id} 진행 방향`);}
 // 같은 썰매 두 자리는 0.5m 이상 떨어짐, 서로 다른 자리끼리 0.5m 이상
 for(const a of CAROUSEL_SEATS)for(const b of CAROUSEL_SEATS){if(a.id>=b.id)continue;const p=carouselSeatAt(a.id,0),q=carouselSeatAt(b.id,0);assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>.5,`${a.id}-${b.id}`);}
 assert.equal(SEAT_SIT_Y,.34);});
test('회전은 시각으로 정해지고 한 바퀴 period초', ()=>{
 assert.equal(carouselSpin(0),0);assert.ok(Math.abs(carouselSpin(CAROUSEL.period*1000/4)-Math.PI/2)<1e-9);
 assert.ok(Math.abs(carouselSpin(1.7e12)-carouselSpin(1.7e12+CAROUSEL.period*1000))<1e-6);});
test('타는 곳·내리는 곳은 받침 밖·울타리 안이고 계단 쪽', ()=>{
 for(const p of [CAROUSEL.board,CAROUSEL.exit]){const d=Math.hypot(p.x-CAROUSEL.x,p.z-CAROUSEL.z);assert.ok(d>CAROUSEL.baseR+.22&&d<CAROUSEL.baseR+1.2);assert.ok(Math.hypot(p.x,p.z)<PLAZA.fence-1);}
 const a=Math.atan2(CAROUSEL.board.x-CAROUSEL.x,CAROUSEL.board.z-CAROUSEL.z);assert.ok(Math.abs(a-CAROUSEL.step.a)<.05);
 const k=nearestFreeSeat(0);assert.ok(k>=0);assert.notEqual(nearestFreeSeat(0,new Set([k])),k);});

// ── 넓힌 광장(시안 B, 11-17 4차)
test('11-17 대표 결정: 주소 옵션이 없으면(화면·서버) 넓힌 광장 B, 시안 A·예전 화면(?look=festive·classic)만 원래 배치', ()=>{
 assert.equal(festiveB(''),true);assert.equal(festiveB('?look=festive-b'),true);assert.equal(festiveB('?look=b'),true);
 assert.equal(festiveB('?look=festive'),false);assert.equal(festiveB('?look=festive-a'),false);assert.equal(festiveB('?look=classic'),false);assert.equal(festiveB('?look=old'),false);
 assert.deepEqual(['',  '?look=festive','?look=classic','?look=b','?look=zzz'].map(q=>lookLevel(q)),[2,1,0,2,2]);
 assert.equal(BASE.BIG_PLAZA,null);assert.equal(BASE.PLAZA.radius,17);assert.deepEqual([BASE.CAMPFIRE.x,BASE.CAMPFIRE.z],[-13,1]);assert.deepEqual([BASE.MAILBOX.x,BASE.MAILBOX.stand.x],[12,10.8]);
 assert.deepEqual([BASE.SPAWN.z,BASE.ENTRANCE.z,BASE.ENTRANCE.w],[14.5,18.2,4.6]);assert.equal(BASE.LAMPS.length,12);assert.deepEqual(BASE.HOUSES[0],[-19.5,-11,0,1]);assert.equal(BASE.DIVIDER.x,-19.2);
 assert.equal(Math.hypot(BASE.displaySlots()[0].x,BASE.displaySlots()[0].z).toFixed(2),'8.60');
 // 서버가 판정에 쓰는 두 마당은 시안 B에서도 같다
 assert.deepEqual(BASE.SNOWMAN_YARD,SNOWMAN_YARD);assert.deepEqual(BASE.SNOWBALL_YARD,SNOWBALL_YARD);});
test('넓힌 광장: 돌바닥 넓이 1.6배 이상, 둘레 시설은 트리에서 1.3배 바깥·광장 안', ()=>{
 assert.equal(BL.BIG_PLAZA,PLAZA_B);assert.ok((PLAZA.radius/BASE.PLAZA.radius)**2>=1.6);
 const r=p=>Math.hypot(p.x,p.z);
 assert.ok(Math.abs(r(MAILBOX)/r(BASE.MAILBOX)-1.3)<.01&&Math.abs(r(CARD_BOARD)/r(BASE.CARD_BOARD)-1.3)<.01);
 assert.ok(r(CAMPFIRE)/r(BASE.CAMPFIRE)>1.25);
 for(const s of [...campfireSeats(),...displaySlots(),MAILBOX.stand,CARD_BOARD])assert.ok(r(s)<PLAZA.radius-1.5,`${s.x},${s.z}`);
 // 모닥불 통나무 바깥 끝과 가림 눈벽 사이로 1m 이상 걸을 틈, 눈벽은 눈싸움 마당 밖
 assert.ok((CAMPFIRE.x-CAMPFIRE.logR-.7)-(DIVIDER.x+.35)>=1);{const edge=SNOWBALL_YARD.x+SNOWBALL_YARD.w/2;assert.ok(DIVIDER.x-.35>edge&&DIVIDER.x+.35<edge+1);}
 assert.ok(SPAWN.spread>BASE.SPAWN.spread&&ENTRANCE.w>BASE.ENTRANCE.w&&ENTRANCE.z>PLAZA.radius);});
test('넓힌 광장: 집끼리·집과 마당·링크·회전목마가 겹치지 않고 가로등은 마당 밖', ()=>{
 const hr=s=>2.95*s; // 집 반 대각선(4.6×3.8 기준)
 for(let i=0;i<HOUSES.length;i++){const [x,z,,s]=HOUSES[i];
  assert.ok(Math.hypot(x,z)+hr(s)<PLAZA.fence+.3,`집 ${x},${z} 울타리`);assert.ok(Math.hypot(x,z)-hr(s)>PLAZA.radius,`집 ${x},${z} 광장`);
  for(const y of [SNOWMAN_YARD,SNOWBALL_YARD])assert.ok(Math.abs(x-y.x)>y.w/2+hr(s)*.8||Math.abs(z-y.z)>y.d/2+hr(s)*.8,`집 ${x},${z} 마당`);
  assert.ok(Math.hypot(x-CAROUSEL.x,z-CAROUSEL.z)>CAROUSEL.baseR+hr(s)+1,`집 ${x},${z} 회전목마`);
  for(let j=i+1;j<HOUSES.length;j++){const [x2,z2,,s2]=HOUSES[j];assert.ok(Math.hypot(x-x2,z-z2)>hr(s)+hr(s2)+1,`집 ${x},${z} - ${x2},${z2}`);}}
 for(const [x,z] of LAMPS)for(const y of [SNOWMAN_YARD,SNOWBALL_YARD])assert.ok(Math.abs(x-y.x)>y.w/2+.4||Math.abs(z-y.z)>y.d/2+.4,`가로등 ${x},${z}`);});
