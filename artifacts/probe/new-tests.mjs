
test('카툰 걷기↔뛰기 섞기: 프레임 빠르기와 상관없이 섞는 전 구간에서 디딘 발이 6mm 안(뜨거나 파묻히지 않는다)',async()=>{
 for(const fps of [30,60,144]){const h=createRealisticHiker(await freshToon()),st=h.profile.animSteps,dt=1/fps;let ph=0,blendErr=0,blendFrames=0;
  for(const [running,sec] of [[false,1.2],[true,1],[false,1],[true,.6],[false,1]])for(let i=0;i<sec*fps;i++){const step=running?st.run:st.walk,dph=(running?8.2:6.2)*dt;ph+=dph;h.scene.position.z-=dph*step;h.scene.updateMatrixWorld(true);
   h.update({clip:'Walk',distance:ph,stride:1,stepLength:step,running,dt,speed:1.4});const cs=h.ground({moving:true,phase:ph,surfaceHeight:flat});
   if(h.gait.run>.01&&h.gait.run<.99){blendFrames++;for(const c of cs)if(c.planted)blendErr=Math.max(blendErr,c.error);}}
  assert.ok(blendFrames>fps*.3,`${fps}fps 섞는 프레임 ${blendFrames}`);assert.ok(blendErr<.006,`${fps}fps 섞는 동안 디딘 발 ${blendErr}`);}
});

// 합성 계단: 앞(-Z)으로 디딤판 tread·높이 rise(음수면 내려감), 12칸. 끝나면 평지.
const stairSurface=(rise,tread=.3,n=12)=>(x,z)=>{const d=-z;return d<0?0:Math.min(n,Math.floor(d/tread)+1)*rise;};
async function climbStairs({rise,tread=.3,start=-.45,fps=60,seconds=6,running=false}){
 const h=createRealisticHiker(await freshToon()),dt=1/fps,surf=stairSurface(rise,tread),slope=rise/tread,rate=STAIR_WALK_CADENCE*(running?2.5:1);
 let ph=0,d=start,err=0;const plants=[],was=[false,false];
 for(let i=0;i<seconds*fps;i++){ph+=rate*dt;d+=rate*dt*STAIR_STRIDE/Math.hypot(1,slope);h.scene.position.set(0,surf(0,-d),-d);h.scene.updateMatrixWorld(true);
  h.update({clip:'Climb',distance:ph,stride:1,stepLength:STAIR_STRIDE,running,dt,speed:rate*STAIR_STRIDE,slope,stairs:true,surfaceHeight:surf});
  const cs=h.ground({moving:true,phase:ph,surfaceHeight:surf});
  cs.forEach((c,k)=>{const down=c.planted&&c.lift<.003;if(i>fps){if(down&&!was[k]){const boot=-c.foot[1]+.033;plants.push({k,tread:Math.floor(boot/tread),frac:(boot/tread)%1});}if(c.planted)err=Math.max(err,c.error);}was[k]=down;});}
 return {h,plants,err};
}
test('카툰 계단: 한 칸(디딤판 0.30m)에 한 발씩, 두 발이 번갈아 디딤판 가운데에 딛고 디딘 발이 뜨거나 파묻히지 않는다(높은 돌계단·낮은 나무계단·내려가기)',async()=>{
 // 계단 클립: 한 걸음 = 한 칸(0.35m), 계단에서는 기울기와 상관없이 계단 클립을 쓴다.
 assert.ok(Math.abs(GAIT_SHAPE.stairs.step-STAIR_STRIDE)<.01);assert.equal(TOON_STRIDE.stairs,1);
 for(const o of [{rise:.18},{rise:.06},{rise:.025,start:-.6},{rise:.06,tread:.25},{rise:-.15,start:-.7},{rise:.12,running:true},{rise:.18,fps:30},{rise:.18,fps:144}]){
  const {h,plants,err}=await climbStairs(o),label=JSON.stringify(o);
  assert.equal(h.pose.name,'Climb',label);
  const per=new Map();for(const p of plants)per.set(p.tread,(per.get(p.tread)??0)+1);
  assert.ok(plants.length>=6,`${label} 디딘 수 ${plants.length}`);
  assert.ok([...per.values()].every(n=>n===1),`${label} 칸마다 디딘 수 ${[...per.values()]}`);
  assert.ok(plants.every((p,i)=>!i||(p.k!==plants[i-1].k&&Math.abs(p.tread-plants[i-1].tread)===1)),`${label} 번갈아 다음 칸`);
  // 처음 두 발(위상을 맞추는 동안)을 빼면 신발 가운데가 디딤판의 35~75% 자리
  for(const p of plants.slice(2))assert.ok(p.frac>.35&&p.frac<.75,`${label} 디딘 자리 ${p.frac.toFixed(2)}`);
  assert.ok(err<.006,`${label} 디딘 발 오차 ${err}`);
 }
});

test('카툰 쌍안경: 가슴 폭의 1/3 이하 작은 카툰 쌍안경, 눈에 대면 접안 컵이 얼굴에 닿는다(뚫지 않는다)',async()=>{
 const h=createRealisticHiker(await freshToon()),run=(o,n=40)=>{for(let i=0;i<n;i++){h.update({clip:'Idle',pose:'stand',dt:.1,...o});h.ground({moving:false,phase:0,surfaceHeight:flat});}h.scene.updateMatrixWorld(true);};
 run({});const bino=h.gadgetProps.binoculars,size=new Box3().setFromObject(bino).getSize(new Vector3());
 // 가슴(바람막이) 폭 0.33m(시안 타원체 반지름 0.165m)
 assert.ok(TOON_BINOCULARS_SIZE.width<=.33/3&&size.x<=.33/3+1e-6,`쌍안경 폭 ${size.x.toFixed(3)}`);
 assert.equal(bino.parent.name,'mixamorigSpine2','평소에는 가슴에 건다');
 run({gadget:'binoculars'});assert.equal(bino.parent.name,'mixamorigRightHand');
 const head=h.model.getObjectByName('ToonHiker_Head'),q=bino.getWorldQuaternion(new Quaternion()),dir=new Vector3(0,0,1).applyQuaternion(q),rc=new Raycaster();
 for(const s of [-1,1]){const p=bino.localToWorld(new Vector3(s*TOON_BINOCULARS_SIZE.eye,0,TOON_BINOCULARS_SIZE.back));
  rc.set(p,dir);rc.far=.1;const gap=rc.intersectObject(head,false)[0]?.distance;assert.ok(gap!==undefined&&gap<.006,`접안 컵~얼굴 ${gap}`);
  rc.set(p,dir.clone().negate());rc.far=.05;assert.equal(rc.intersectObject(head,false).length,0,'접안 컵이 얼굴을 뚫지 않는다');}
 for(const a of h.interaction.arms)assert.ok(a.targetError<.01,`쌍안경 손 ${a.targetError}`);
});

test('카툰 발소리: 앞 소리에서 0.24초 안의 걸음은 건너뛰어 걷기·뛰기 모두 초당 3~4번, 계단 한 칸 한 걸음은 모두 난다. 실사는 그대로',()=>{
 const count=(rate,sec=10)=>{const gate=toonStepGate();let n=0;for(let i=1;i<=rate*sec;i++)if(gate({elapsed:i/rate}))n++;return n/sec;};
 const walk=count(1.37/(WALK_STRIDE.flat*TOON_STRIDE.walk)),run=count(1.37*TOON_RUN_SPEED/(WALK_STRIDE.flat*TOON_STRIDE.run)),stairs=count(STAIR_WALK_CADENCE*1.15);
 assert.ok(walk>=2.9&&walk<=4.1,`걷기 초당 ${walk}`);assert.ok(run>=2.9&&run<=4.2,`뛰기 초당 ${run}`);assert.ok(Math.abs(stairs-STAIR_WALK_CADENCE*1.15)<.11,`계단 초당 ${stairs}`);
 // 남은 소리는 좌우를 번갈아 낸다
 const g=toonStepGate(),pans=[0,.3,.6,.9].map(t=>g({elapsed:t})?.pan);assert.deepEqual(pans,[.08,-.08,.08,-.08]);
 assert.ok(TOON_FOOTSTEP.rate>1.2&&TOON_FOOTSTEP.gainDb<=-4&&TOON_FOOTSTEP.maxDuration<=.15,'가볍고 작은 톡톡');
 const real=new FootstepAudio({base:'',enabled:false}),toon=new FootstepAudio({base:'',enabled:false,style:'toon'});
 assert.equal(real.gate,null);assert.ok(toon.gate);
 for(let i=1;i<=10;i++){real.play({material:'soil',step:i,elapsed:i*.16});toon.play({material:'soil',step:i,elapsed:i*.16});}
 assert.equal(real.dropped.thinned,0);assert.equal(toon.dropped.thinned,5);
});
