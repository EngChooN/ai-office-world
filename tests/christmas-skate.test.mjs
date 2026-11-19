// 아이스링크 스케이트 A안(skate.js·rink-play.js, 11-19). 시안 docs/크리스마스/스케이트-타기-시안-v1.html §2(c) A 값 ±10%
import test from 'node:test';
import assert from 'node:assert/strict';
import {SKATE,SKATE_FX,createSkateState,skateStep,createSkateGait,createSkateTrack,createSkateFx} from '../src/christmas/skate.js';
import {createRinkPlay,collideRink,RINK_TEXT} from '../src/christmas/rink-play.js';
import {RINK,inRink} from '../src/christmas/festive-layout.js';
const DT=1/60;
const open=()=>{const S=createSkateState();S.heading=-Math.PI/2;return {S,x:0,z:0,step(dx,dz,o={}){skateStep(S,DT,{dx,dz,...o});this.x+=S.vx*DT;this.z+=S.vz*DT;},get v(){return Math.hypot(S.vx,S.vz);}};};
const near=(v,want,msg)=>assert.ok(Math.abs(v-want)<=want*.1,`${msg} ${v} (시안 ${want})`);
test('넓은 얼음: 최고 2.39m/s·90%까지 1.57초·손 떼면 2.22m·90° 꺾을 때 바깥 1.55m·반대 누르면 0.81m 안에 멈춤',()=>{
 let m=open();const tr=[];for(let i=0;i<240;i++){m.step(1,0);tr.push(m.v);}
 near(m.v,2.39,'최고');near(tr.findIndex(v=>v>=m.v*.9)*DT,1.57,'90%');
 let x0=m.x,n=0;while(m.v>0&&n<600){m.step(0,0);n++;}near(m.x-x0,2.22,'미끄러짐');
 m=open();for(let i=0;i<300;i++)m.step(1,0);let sx=m.x,over=0;for(let i=0;i<150;i++){m.step(0,-1);over=Math.max(over,m.x-sx);}near(over,1.55,'꺾기 바깥');
 m=open();for(let i=0;i<300;i++)m.step(1,0);sx=m.x;let mx=0;for(let i=0;i<240;i++){m.step(-1,0);mx=Math.max(mx,m.x-sx);}near(mx,.81,'제동 거리');
});
test('느릴 때는 제자리에서 바로 돌아섬(0.25초 안에 180°)',()=>{
 const m=open();for(let i=0;i<15;i++)m.step(-1,0);assert.ok(Math.abs(Math.atan2(Math.sin(m.S.heading-Math.PI/2),Math.cos(m.S.heading-Math.PI/2)))<.05);
});
test('8방향 입력(45°씩 바뀜)에도 몸은 정해진 빠르기로만 돈다(한 프레임에 150~300°/s 넘게 안 꺾임)',()=>{
 const m=open();for(let i=0;i<200;i++)m.step(1,0);let h=m.S.heading,max=0;
 const dirs=[[1,0],[Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[-Math.SQRT1_2,-Math.SQRT1_2]];
 for(const [dx,dz] of dirs)for(let i=0;i<20;i++){m.step(dx,dz);const d=Math.abs(Math.atan2(Math.sin(m.S.heading-h),Math.cos(m.S.heading-h)));max=Math.max(max,d/DT);h=m.S.heading;}
 assert.ok(max<=SKATE.turnLo*Math.PI/180+1e-6,`${max}`);assert.ok(m.v>1.5,'도는 동안에도 속도 유지');
});
test('문 안쪽 1.5m 안은 걷기 속도까지',()=>{
 const m=open();for(let i=0;i<240;i++)m.step(1,0);for(let i=0;i<30;i++)m.step(1,0,{gateDist:1,walk:1.37});assert.ok(m.v<=1.37+1e-6,`${m.v}`);
});
function rinkAt(x,z,h){const player={x,z,heading:h,place(x,z,h){this.x=x;this.z=z;this.heading=h;}};const r=createRinkPlay({enabled:true,player});r.act('rk:in');player.x=x;player.z=z;player.heading=h;return {r,player};}
test('벽 비비기: 벽 쪽으로 비스듬히 밀면 튕기지 않고 벽을 따라 계속 미끄러짐',()=>{
 // 남쪽 벽 가까이에서 서쪽+남쪽(45°) 입력
 const {r,player}=rinkAt(RINK.x+5,RINK.z+3.4,Math.PI/2);let v=0,minZ=Infinity;
 for(let i=0;i<180;i++){r.step(DT,{dx:-Math.SQRT1_2,dz:Math.SQRT1_2,speed:1.37});v=r.speed;minZ=Math.min(minZ,player.z);}
 assert.ok(inRink(player.x,player.z,.2));assert.ok(v>1,`벽 따라 속도 ${v}`);assert.ok(player.x<RINK.x+2,`서쪽으로 ${player.x}`);
});
test('세게 벽에 닿으면 휘청(자세 wobble)',()=>{
 const t=rinkAt(RINK.x+5,RINK.z+1.5,Math.PI);let seen=false; // 남쪽(+z)을 봄
 for(let i=0;i<120;i++){t.r.step(DT,{dx:0,dz:1,speed:1.37});if(t.r.status().pose==='wobble')seen=true;}
 assert.ok(seen);
});
test('자세: 누르면 밀기 좌·우 번갈아(소리 사건 push), 손 떼면 두 발 활주 → 서기, 반대로 누르면 멈추기(stop 한 번)',()=>{
 const g=createSkateGait(),ev=[],sides=new Set();let v=0;
 for(let i=0;i<180;i++){v=Math.min(2.4,v+DT*1.4);const s=g.update(DT,{v,a:1,pressing:true});ev.push(...s.events);if(s.pose==='push')sides.add(s.side);}
 assert.ok(ev.filter(e=>e==='push').length>=3);assert.equal(sides.size,2);
 assert.equal(g.update(DT,{v:2,a:-1.3}).pose,'glide2');
 assert.equal(g.update(DT,{v:2,a:-1.3,turn:.8}).pose,'glide2');for(let i=0;i<30;i++)g.update(DT,{v:2,a:-1.3,turn:.8});assert.equal(g.state.pose,'carve');assert.ok(g.state.lean>0&&g.state.lean<=15*Math.PI/180+1e-9);
 const b=[];for(let i=0;i<20;i++)b.push(...g.update(DT,{v:1.5,braking:true}).events);assert.equal(g.state.pose,'brake');assert.deepEqual(b,['stop']);
 assert.equal(g.update(DT,{v:.1}).pose,'stand');
});
test('다른 사람: 받은 위치만으로 밀기·활주·멈추기를 알아냄(서버 변경 없음)',()=>{
 const m=open(),tr=createSkateTrack(),seen=[];
 const run=(n,dx)=>{for(let i=0;i<n;i++){m.step(dx,0);const g=tr.update(DT,{x:m.x,z:m.z,heading:m.S.heading});seen.push(g.pose);}return tr.gait.pose;};
 const p1=run(90,1);assert.ok(['push','glide1'].includes(p1),p1);
 const p2=run(40,0);assert.equal(p2,'glide2');
 run(30,1);const p3=run(20,-1);assert.equal(p3,'brake');
});
test('효과 자료: 휴대폰은 사람 3명·자국 20·가루 30, PC는 8·40·80 상한',()=>{
 for(const mobile of [false,true]){const fx=createSkateFx({mobile}),c=mobile?SKATE_FX.mobile:SKATE_FX.pc;
  const ids=Array.from({length:12},(_,i)=>'p'+i);fx.setRank(ids);
  for(let i=0;i<600;i++){for(const id of ['me',...ids])fx.emit(id,DT,{x:i*.01,z:0,v:2,gait:{pose:'brake',events:['push'],side:1}});fx.update(DT/50);}
  const owners=['me',...ids].filter(id=>fx.marksOf(id).length);assert.equal(owners.length,c.people+1);
  assert.ok(owners.every(id=>fx.marksOf(id).length<=c.marks));assert.ok(fx.powder.length<=c.powder);}
});
test('들어가면 새 안내 문구, 충돌은 그대로 링크 안',()=>{
 assert.match(RINK_TEXT.in,/반대로 당기면 멈춰요/);const p=collideRink(RINK.x+100,RINK.z);assert.ok(inRink(p.x,p.z,.2));
});
