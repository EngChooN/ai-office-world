// 회전목마 타기(월드개발 11-17 3차): 자리 자세가 월드아트 festive-layout.js 식과 같은지, act.mg 규격·서버 자리 겹침 판정
import test from 'node:test';
import assert from 'node:assert/strict';
import {CAROUSEL,CAROUSEL_SEATS,carouselSeatAt} from '../src/christmas/festive-layout.js';
import {carouselSeatPose,createCarouselPlay,findCarousel,CAROUSEL_RIDE} from '../src/christmas/carousel-play.js';
import {sanitizeAct} from '../src/multi-protocol.js';
import {createRoomPlay} from '../src/christmas/room-play.js';

// festive.js가 내보내는 것과 같은 짜임의 가짜 회전목마(자리 자세 = festive-layout carouselSeatAt)
const fakeCarousel=(ms,groundY=.2)=>({seatPose:k=>carouselSeatAt(k,ms,groundY)});

test('그림에 seatPose가 있어야 탈 수 있음(없으면 꺼짐)',()=>{
 assert.equal(findCarousel(null),null);assert.equal(findCarousel({carousel:{spin:{}}}),null);
 const c={seatPose:()=>null};assert.equal(findCarousel({carousel:c}),c);
});

test('act.mg는 0~자리 수만 받는다(자리 수는 festive-layout.js CAROUSEL_SEATS)',()=>{
 const N=CAROUSEL_SEATS.length;
 assert.deepEqual(sanitizeAct('christmas',{mg:N}),{mg:N});
 assert.equal(sanitizeAct('christmas',{mg:N+1}),null);
 assert.equal(sanitizeAct('smoking',{mg:1}),null);
});

test('같은 자리는 서버가 나중 사람을 빼고 ride:no',()=>{
 const play=createRoomPlay(),members=new Map([['a',{id:'a',act:{mg:3}}],['b',{id:'b',act:null}]]),ctx={members,send(){},all(){}};
 const r=play.checkAct({id:'b'},{o:'elf',mg:3},ctx);
 assert.equal(r.a.mg,0);assert.deepEqual(r.deny,[{t:'ride:no'}]);
 const ok=play.checkAct({id:'b'},{o:'elf',mg:4},ctx);assert.equal(ok.a.mg,4);assert.equal(ok.deny.length,0);
});

function fakeCtx({taken=[]}={}){
 const player={x:CAROUSEL.board.x,z:CAROUSEL.board.z,heading:0,speed:0,place(x,z,h){this.x=x;this.z=z;this.heading=h;},update(){}};
 const poser={sit:false,arms:'none',setSit(on){this.sit=on;},setArms(k){this.arms=k;}};
 const multi={joined:true,people:()=>taken.map((k,i)=>({id:`p${i}`,act:{mg:k+1}}))};
 const said=[];const hud={say:t=>said.push(t)};
 return {player,poser,multi,hud,said};
}
test('타기 → 빈 자리 중 계단에 가장 가까운 자리, 내리기 → 내리는 곳',()=>{
 const c=fakeCarousel(5000),x=fakeCtx({taken:[]}),play=createCarouselPlay({carousel:c,...x});
 assert.deepEqual(play.actions().map(a=>a.id),['mg:ride']);
 assert.equal(play.act('mg:ride'),true);assert.ok(play.riding);assert.ok(x.poser.sit);
 const b=CAROUSEL.board,d=k=>{const p=carouselSeatPose(c,k);return Math.hypot(p.x-b.x,p.z-b.z);};
 for(let k=0;k<CAROUSEL_SEATS.length;k++)assert.ok(d(play.seat)<=d(k)+1e-9);
 assert.equal(play.actFields().mg,play.seat+1);
 play.act('mg:cheer');assert.equal(play.actFields().wm,1);
 assert.equal(play.update(.016,{moveInput:false}),true);
 assert.ok(Math.abs(play.y-(carouselSeatPose(c,play.seat).y-CAROUSEL_RIDE.sitY))<1e-9);
 play.act('mg:off');assert.ok(!play.riding);assert.ok(!x.poser.sit);
 assert.ok(Math.hypot(x.player.x-CAROUSEL.exit.x,x.player.z-CAROUSEL.exit.z)<1e-9);
});
test('남이 쓰는 자리는 피하고, 다 차면 안 탐 · 걷기 입력이면 내림 · 멀면 단추 없음',()=>{
 const c=fakeCarousel(5000);
 // 자리 수는 festive-layout CAROUSEL_SEATS를 따른다(11-17 5차 월드아트: 8 → 16)
 const N=CAROUSEL_SEATS.length,all=[...Array(N).keys()];
 const free=fakeCtx({taken:all.slice(0,N-1)}),p1=createCarouselPlay({carousel:c,...free});p1.act('mg:ride');assert.equal(p1.seat,N-1);
 assert.equal(p1.update(.016,{moveInput:true}),false);assert.ok(!p1.riding);
 const full=fakeCtx({taken:all}),p2=createCarouselPlay({carousel:c,...full});
 assert.equal(p2.act('mg:ride'),false);assert.ok(!p2.riding);assert.equal(full.said.length,1);
 const far=fakeCtx();far.player.x+=5;assert.deepEqual(createCarouselPlay({carousel:c,...far}).actions(),[]);
});
test('회전목마가 없으면(시안 B 아님) 단추·act 칸 없음',()=>{
 const x=fakeCtx(),p=createCarouselPlay({carousel:null,...x});
 assert.deepEqual(p.actions(),[]);assert.deepEqual(p.actFields(),{});assert.equal(p.rideAt({mg:1}),null);assert.equal(p.update(.016),false);
});

// ── 아이스링크(rink-play.js)
import {RINK,inRink} from '../src/christmas/festive-layout.js';
import {collideRink,heightWithRink,createRinkPlay} from '../src/christmas/rink-play.js';

test('링크 안 걷기 충돌: 울타리 안쪽·섬 밖으로만',()=>{
 for(let i=0;i<400;i++){const x=RINK.x+(Math.random()-.5)*RINK.w*1.6,z=RINK.z+(Math.random()-.5)*RINK.d*1.6,p=collideRink(x,z);
  assert.ok(inRink(p.x,p.z,.2),`안쪽 ${x},${z}`);assert.ok(Math.hypot(p.x-RINK.island.x,p.z-RINK.island.z)>=RINK.island.r+.1);}
 const g=RINK.gate.inside,p=collideRink(g.x,g.z);assert.ok(Math.hypot(p.x-g.x,p.z-g.z)<1e-9,'문 안 첫 자리는 그대로 설 수 있음');
});
test('얼음 위 높이는 얼음 윗면, 밖은 땅',()=>{
 const H=heightWithRink(()=>.1);assert.equal(H(RINK.x+3,RINK.z),RINK.iceY);assert.equal(H(RINK.x+RINK.w,RINK.z),.1);
});
test('문 밖 = 광장 충돌에 안 막히는 자리, 들어가기·나가기',()=>{
 const s=RINK.gate.stand;
 const player={x:s.x,z:s.z,heading:0,place(x,z,h){this.x=x;this.z=z;this.heading=h;}};
 const r=createRinkPlay({enabled:true,player});
 assert.deepEqual(r.actions().map(a=>a.id),['rk:in']);
 r.act('rk:in');assert.ok(r.inside);assert.ok(inRink(player.x,player.z));assert.deepEqual(r.actions().map(a=>a.id),['rk:out']);
 // 들어가면 링크 가운데 쪽을 봄(바라봄 = (−sin h, −cos h))
 assert.ok(-Math.sin(player.heading)<-.9);
 r.act('rk:out');assert.ok(!r.inside);assert.ok(!inRink(player.x,player.z));
 const off=createRinkPlay({enabled:false,player});assert.deepEqual(off.actions(),[]);
});
test('스케이트(A안): 1.6초쯤에 최고 속도 90%, 손 떼면 약 2.2m 미끄러져 섬, 울타리에 막히면 그쪽 속도만 버림',()=>{
 const player={x:RINK.x+3.5,z:RINK.z,heading:Math.PI/2,place(x,z,h){this.x=x;this.z=z;this.heading=h;}};
 const r=createRinkPlay({enabled:true,player});r.act('rk:in');player.x=RINK.x+6;player.z=RINK.z+3.6;player.heading=Math.PI/2; // 섬을 비켜 남쪽 줄을 따라 서쪽으로
 const dt=1/60;let t=0,first=null;
 for(;t<2.6;t+=dt){r.step(dt,{dx:-1,dz:0,speed:1.37});if(first===null&&r.speed>2.4*.9)first=t;}
 assert.ok(first>1.3&&first<1.9,`90% 속도까지 ${first}`);
 const x0=player.x;let n=0;while(r.speed>0&&n<600){r.step(dt,{});n++;}
 const glide=x0-player.x;assert.ok(glide>1.9&&glide<2.5,`미끄러짐 ${glide}`);
 // 울타리 쪽(남쪽)으로 계속: 울타리 안에 머물고 결국 멈춤(남쪽 속도는 버림)
 for(let i=0;i<300;i++)r.step(dt,{dx:0,dz:1,speed:1.37});
 assert.ok(inRink(player.x,player.z,.2));assert.ok(r.speed<.05);
 // 입력 없이 미끄러질 때는 걷는 다리 0
 const s=r.step(dt,{});assert.equal(s.stride,0);
});
