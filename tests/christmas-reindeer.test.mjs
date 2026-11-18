// 크리스마스 하늘 썰매·별 흔적 그림 자산(월드아트 11-18, 설계 v2): 루돌프·썰매 면 수·그리기 횟수 상한, 루돌프 동작(발굽 접지·착지), 썰매 끌림·좌석, 별 흔적 개수 상한·세기, 정류장 자리
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {REINDEER,REINDEER_BUDGET,REINDEER_MODES,buildReindeerGeometry,reindeerTriangles,reindeerPose,lowestHoof,createReindeerHerd,strideAt} from '../src/christmas/reindeer.js';
import {createStarTrail,STAR_LEVELS,STAR_CAP} from '../src/christmas/star-trail.js';
import {SLEIGH,SLEIGH_BUDGET,buildSleighGeometry,sleighTriangles,createSkySleighFleet} from '../src/christmas/sky-sleigh.js';
import {REINDEER_STATION,CAROUSEL,PLAZA_B} from '../src/christmas/festive-layout.js';
const V=()=>new THREE.Vector3();

test('루돌프 한 마리 삼각형 수: PC·휴대폰 상한 안, 그리기 5번', ()=>{
 const pc=reindeerTriangles(buildReindeerGeometry({mobile:false})),mo=reindeerTriangles(buildReindeerGeometry({mobile:true}));
 assert.ok(pc<=REINDEER_BUDGET.pc,`PC ${pc}`);assert.ok(mo<=REINDEER_BUDGET.mobile,`휴대폰 ${mo}`);assert.ok(mo<pc);
 const herd=createReindeerHerd({max:31});
 assert.equal(herd.group.children.filter(o=>o.isMesh).length,REINDEER_BUDGET.drawCalls);
 // 썰매 30대(루돌프 60마리 + 썰매 30대)도 PC 삼각형 30만 개 아래
 const sp=sleighTriangles(buildSleighGeometry({mobile:false})),sm=sleighTriangles(buildSleighGeometry({mobile:true}));
 assert.ok(sp<=SLEIGH_BUDGET.pc,`썰매 PC ${sp}`);assert.ok(sm<=SLEIGH_BUDGET.mobile,`썰매 휴대폰 ${sm}`);
 assert.ok((pc*2+sp)*30<300000,`30대 ${(pc*2+sp)*30}`);
 const fleet=createSkySleighFleet({max:31});assert.equal(fleet.group.getObjectsByProperty('isMesh',true).length,SLEIGH_BUDGET.drawCalls);});

test('서기·달리기: 발굽이 땅에 닿고 땅 밑으로 1cm 넘게 빠지지 않음', ()=>{
 for(let t=0;t<12;t+=.1){const lo=lowestHoof(reindeerPose('stand',{t}));assert.ok(lo>-.01&&lo<.02,`stand ${lo}`);}
 for(const speed of [2,3.6,5])for(let c=0;c<1;c+=.02){const lo=lowestHoof(reindeerPose('run',{cycle:c,speed}));assert.ok(lo>-.01,`run ${speed} ${c} ${lo}`);}
 // 통통 뛰는 걸음: 한 주기 안에서 네 발이 모두 뜨는 순간은 짧고, 가장 높이 떠도 12cm 안
 let hi=0;for(let c=0;c<1;c+=.02)hi=Math.max(hi,lowestHoof(reindeerPose('run',{cycle:c,speed:3.6})));assert.ok(hi<.12,`뜸 ${hi}`);
 assert.ok(strideAt(3.6)>1&&strideAt(5)>strideAt(3.6));});

test('내려앉기: 0.75에서 발굽이 땅(몸 높이 0일 때)에 닿고, 비행·날아오르기는 다리를 접어 몸 아래로 덜 내려옴', ()=>{
 const touch=lowestHoof(reindeerPose('land',{progress:.75}));assert.ok(Math.abs(touch)<.02,`착지 ${touch}`);
 const fly=lowestHoof(reindeerPose('fly',{t:1})),stand=lowestHoof(reindeerPose('stand',{t:1}));assert.ok(fly-stand>.1,`비행 다리 ${fly}`);
 // 모든 모드·진행도에서 숫자가 깨지지 않음
 for(const m of REINDEER_MODES)for(let p=0;p<=1;p+=.05){const P=reindeerPose(m,{t:p*5,cycle:p,progress:p,speed:4});
  for(const x of [P.y,P.pitch,P.roll,P.headPitch,P.headYaw,P.tail,...P.legs.flat()])assert.ok(Number.isFinite(x),`${m} ${p}`);}
 // 날아오르기 끝 = 비행 자세 근처(갑자기 튀지 않음)
 const a=reindeerPose('takeoff',{progress:1,t:2}),b=reindeerPose('fly',{t:2});a.legs.forEach(([u,l],i)=>{assert.ok(Math.abs(u-b.legs[i][0])<1e-6&&Math.abs(l-b.legs[i][1])<1e-6);});});

test('무리: 최대 수까지만 빌려 주고, 끈 고리·굴레 고리·코·별 자리는 루돌프를 따라 움직임', ()=>{
 const herd=createReindeerHerd({max:3});const a=herd.spawn(),b=herd.spawn(),c=herd.spawn();assert.ok(a&&b&&c);assert.equal(herd.spawn(),null);
 c.release();assert.equal(herd.live,2);
 a.set(10,2,-5,Math.PI/2);a.mode='stand';herd.update(1/60);
 // heading π/2 = 서쪽(−X)을 봄: 코·굴레 고리는 앞(−X), 끈 고리는 몸 양옆·코보다 뒤, 별은 뒤
 const n=a.nose(V()),bit=a.bit(0,V()),t0=a.trace(0,V()),t1=a.trace(1,V()),tp=a.trailPoint(V());
 assert.ok(n.x<9.6&&bit.x<9.8,'코·굴레는 앞');assert.ok(t0.x>n.x+.3&&Math.abs(t0.z-t1.z)>.3,'끈 고리 양옆');assert.ok(tp.x>10,'별은 뒤');
 assert.ok(Math.abs(n.y-2-.98)<.12,`코 높이 ${n.y}`);
 // set만 해도(update 전) 자리가 바로 따라옴
 a.set(20,2,-5);assert.ok(Math.abs(a.nose(V()).x-19.4)<.2);
 herd.update(1/60);assert.equal(herd.meshes.body.count,2);assert.equal(herd.meshes.upper.count,8);});

test('하늘 썰매: 루돌프 둘은 썰매 앞 2.35m 나란히, 앞을 끌면 썰매가 끈 길이만큼 뒤에서 따라오고 돌 때 늦게 돎', ()=>{
 const ground=(x,z)=>.1*x;const fleet=createSkySleighFleet({max:2,heightAt:ground});const t=fleet.spawn();assert.ok(fleet.spawn());assert.equal(fleet.spawn(),null);
 t.place(0,0,0,0);fleet.update(1/60);
 const [d0,d1]=t.deer;assert.ok(Math.abs(d0.z+SLEIGH.tow)<1e-6&&Math.abs(d1.z+SLEIGH.tow)<1e-6,'앞(−Z)');assert.ok(Math.abs(Math.abs(d0.x-d1.x)-2*SLEIGH.pairGap)<1e-6,'나란히');
 assert.ok(Math.abs(t.y)<1e-9&&Math.abs(d0.y-ground(d0.x,d0.z))<1e-9,'땅에 붙음');
 // 좌석: 썰매 원점 위 0.56m, 손은 좌석보다 앞·위
 const seat=t.seat(V());assert.ok(Math.abs(seat.y-SLEIGH.seat[1])<.02,`좌석 ${seat.y}`);t.driver=true;const h=t.hand(0,V());assert.ok(h.z<seat.z&&h.y>seat.y,'손');
 // 앞을 원으로 끌기: 썰매는 늘 끈 길이만큼 떨어지고, 도는 동안 썰매 방향이 루돌프 방향보다 늦다
 t.mode='run';let lag=0;for(let i=1;i<=120;i++){const a=i/120*Math.PI,x=Math.sin(a)*8,z=-8+Math.cos(a)*8,hd=Math.atan2(-Math.cos(a),Math.sin(a));t.drive(x,0,z,hd);fleet.update(1/60);
  const dist=Math.hypot(t.x-t.fx,t.y-t.fy,t.z-t.fz);assert.ok(Math.abs(dist-SLEIGH.tow)<1e-6,`끈 ${dist}`);
  let dh=t.lead-t.heading;dh=Math.atan2(Math.sin(dh),Math.cos(dh));lag=Math.max(lag,Math.abs(dh));
  assert.ok(Math.abs(t.y-ground(t.x,t.z))<1e-9,'땅 모드 썰매는 땅 높이');}
 assert.ok(lag>.1,`늦게 돎 ${lag}`);
 // 기울기는 15° 안
 const q=t.seatQuat(new THREE.Quaternion()),e=new THREE.Euler().setFromQuaternion(q,'YXZ');assert.ok(Math.abs(e.z)<=SLEIGH.bankMax+.04,`기울기 ${e.z}`);
 // 하늘: 앞이 먼저 뜨면 썰매는 낮게 끌려오고 코를 듦(앞뒤 기울기 +)
 t.mode='takeoff';t.drive(t.fx,ground(t.fx,t.fz)+2,t.fz,t.lead);for(let i=0;i<30;i++)fleet.update(1/60);
 assert.ok(t.y<t.fy-1,'썰매가 늦게 뜸');const e2=new THREE.Euler().setFromQuaternion(t.seatQuat(new THREE.Quaternion()),'YXZ');assert.ok(e2.x>.1,`코 듦 ${e2.x}`);
 // 한 마리 모드(먼 사람 성능 대책)
 t.pair=false;fleet.update(1/60);assert.equal(t.deer[1].visible,false);assert.equal(fleet.herd.meshes.body.count,3);});

test('별 흔적: 보통 세기 = 내 것 1초 10개·남의 것 5개, 한 화면 상한(PC 400·휴대폰 150)을 넘지 않음', ()=>{
 assert.deepEqual([STAR_LEVELS.normal.mine,STAR_LEVELS.normal.others,STAR_LEVELS.normal.life],[10,5,2.4]);
 assert.deepEqual([STAR_CAP.pc,STAR_CAP.mobile],[400,150]);
 const count=(mine,speed)=>{const st=createStarTrail({}),e=st.emitter({mine}),p=new THREE.Vector3();let x=0;
  for(let i=0;i<600;i++){x+=speed/60;p.set(x,10,0);e.update(1/60,p,{air:true});st.update(1/60);}return st.spawned;};
 const m=count(true,6),o=count(false,6);assert.ok(m>=90&&m<=110,`내 별 10초 ${m}`);assert.ok(o>=45&&o<=55,`남의 별 10초 ${o}`);
 // 빨리(9m/s)도 1초 상한을 넘지 않음
 assert.ok(count(true,9)<=110);
 // 30마리가 다 날아도 살아 있는 별은 상한 안(오래된 것부터 다시 씀)
 for(const mobile of [false,true]){const st=createStarTrail({mobile}),es=Array.from({length:30},(_,i)=>({e:st.emitter({mine:i===0}),p:new THREE.Vector3()}));
  for(let f=0;f<300;f++){es.forEach(({e,p},i)=>{p.set(Math.sin(f/60+i)*20,10,Math.cos(f/60+i)*20);e.update(1/60,p,{air:true});});st.update(1/60);}
  assert.ok(st.alive()<=st.cap,`${mobile?'휴대폰':'PC'} ${st.alive()}`);assert.equal(st.cap,mobile?150:400);}
 // 착지 눈 튐 8개
 {const st=createStarTrail({});st.splash(0,0,0);assert.equal(st.spawned,8);}
 // 땅 위 달리기: 썰매 날 뒤 눈 튐·반짝임 1초 3개
 const st=createStarTrail({}),e=st.emitter({}),p=new THREE.Vector3();for(let i=0;i<120;i++){p.set(i*.06,0,0);e.update(1/60,p,{running:true,ground:0});}
 assert.ok(st.spawned>=5&&st.spawned<=7,`반짝임 ${st.spawned}`);});

test('루돌프 썰매 정류장: 설계 자리 (25, 28)·비행 범위 안, 썰매는 광장 쪽(북서)을 보고 금빛 원 옆, 회전목마·집·울타리와 떨어짐', ()=>{
 const S=REINDEER_STATION,W=S.sleigh;assert.deepEqual([S.x,S.z],[25,28]);assert.ok(Math.hypot(S.x,S.z)<38,'비행 범위 38m 안');
 const fx=-Math.sin(W.heading),fz=-Math.cos(W.heading);assert.ok(fx<0&&fz<0,'북서쪽을 봄');
 // 썰매 한 벌 = 썰매 뒤(원점 −0.95) ~ 루돌프 코(원점 + 2.35 + 0.8) 선분, 폭 1.3m
 const pts=[];for(let u=-.95;u<=SLEIGH.tow+.8;u+=.1)pts.push([W.x+fx*u,W.z+fz*u]);
 const gap=(x,z)=>Math.min(...pts.map(([px,pz])=>Math.hypot(px-x,pz-z)))-SLEIGH.width/2;
 assert.ok(gap(S.x,S.z)>S.ring-.05,`원과 썰매 ${gap(S.x,S.z)}`);
 assert.ok(gap(CAROUSEL.x,CAROUSEL.z)>CAROUSEL.baseR+.8,'회전목마');
 for(const [x,z,,k] of PLAZA_B.houses)assert.ok(gap(x,z)>3*k+1,`집 ${x},${z}`);
 for(const [px,pz] of pts)assert.ok(Math.hypot(px,pz)<PLAZA_B.radius+21-1.5,'울타리 안');
 assert.ok(gap(S.sign.x,S.sign.z)>.8&&gap(S.hay.x,S.hay.z)>1,'표지판·건초');
 assert.ok(Math.hypot(S.sign.x-S.x,S.sign.z-S.z)>S.ring+.3,'표지판은 원 밖');});
