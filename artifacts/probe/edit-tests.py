import re
p='tests/toon-hiker.test.mjs';s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,a[:80]; s=s.replace(a,b)
rep("import {strideScaleFor,runMultiplierFor,RUN_MULTIPLIER,initialState,advance} from '../src/movement.js';\nimport {WALK_CADENCE,WALK_STRIDE} from '../src/route.js';",
 "import {strideScaleFor,runMultiplierFor,RUN_MULTIPLIER,initialState,advance,onStairs} from '../src/movement.js';\nimport {WALK_CADENCE,WALK_STRIDE,STAIR_STRIDE,STAIR_WALK_CADENCE,route,isStairs} from '../src/route.js';\nimport {TOON_BINOCULARS_SIZE} from '../src/hiker-gadgets.js';\nimport {FootstepAudio,toonStepGate,TOON_FOOTSTEP} from '../src/footstep-audio.js';")
rep("import {Box3,Vector3,AnimationMixer} from 'three';","import {Box3,Vector3,AnimationMixer,Quaternion,Raycaster} from 'three';")
rep("let cached;const toonGltf=async()=>cached??=buildToonHikerGltf(await parse('../assets/toon/models/hiker/Hiker.glb'));",
 "let cached;const toonGltf=async()=>cached??=buildToonHikerGltf(await parse('../assets/toon/models/hiker/Hiker.glb'));\n// 새 몸(같은 glTF를 두 등산객이 나눠 쓰지 않게)\nconst freshToon=async()=>buildToonHikerGltf(await parse('../assets/toon/models/hiker/Hiker.glb'));")
rep(""" const run=scale=>{const s=initialState({start:'demo'});let steps=0;for(let i=0;i<120;i++)advance(s,{forward:1,strideScale:scale},1/30,()=>steps++);return {d:s.distance,steps:s.steps+s.stepPhase};};
 const a=run(undefined),b=run(TOON_STRIDE);
 assert.ok(Math.abs(a.d-b.d)<1e-9,'이동 거리 동일');
 assert.ok(Math.abs(b.steps/a.steps-1/TOON_STRIDE.walk)<.03,`걸음 수 비 ${b.steps/a.steps}`);""",
""" // 흙길에서 같은 시간 걸으면 이동 거리는 같고 걸음 수만 보폭 배율만큼 늘어난다. 계단에서는 보폭 배율 1(한 칸에 한 걸음)이라 걸음 수가 같다.
 const at=pick=>route.segments.find(pick).start+1;
 const run=(scale,s0)=>{const s={...initialState({start:'demo'}),s:s0};for(let i=0;i<120;i++)advance(s,{forward:1,strideScale:scale},1/30);return {d:s.distance,steps:s.steps+s.stepPhase};};
 const soil=at(g=>g.material==='soil'&&g.length>15),stairs=at(g=>isStairs(g.material)&&g.length>15);
 const a=run(undefined,soil),b=run(TOON_STRIDE,soil);
 assert.ok(Math.abs(a.d-b.d)<1e-9,'이동 거리 동일');
 assert.ok(Math.abs(b.steps/a.steps-1/TOON_STRIDE.walk)<.03,`걸음 수 비 ${b.steps/a.steps}`);
 const c=run(undefined,stairs),e=run(TOON_STRIDE,stairs);assert.ok(Math.abs(e.steps/c.steps-1)<1e-6,`계단 걸음 수 비 ${e.steps/c.steps}`);
 assert.equal(strideScaleFor(TOON_STRIDE,false,true),1);assert.equal(strideScaleFor(TOON_STRIDE,true,true),1);assert.equal(strideScaleFor(null,false,true),1);
 assert.equal(onStairs({seg:{material:'stairs'}}),true);assert.equal(onStairs({seg:{material:'deck_stairs'}}),true);assert.equal(onStairs({seg:{material:'stairs'},off:true}),false);assert.equal(onStairs({plaza:true,seg:{material:'stairs'}}),false);assert.equal(onStairs({seg:{material:'rock'}}),false);""")
rep(""" assert.ok(stand.wrist.x>sh.x+.03,`서기 손목 x ${stand.wrist.x}`);""",
""" assert.ok(stand.wrist.x>sh.x+.03,`서기 손목 x ${stand.wrist.x}`);
 // 서기: 팔꿈치를 굽혀 장갑 가운데(손목에서 손가락 쪽 3cm)를 시안 자리(어깨 아래 0.19m·바깥 0.07m)에 둔다.
 const mit=stand.wrist.clone().addScaledVector(stand.handAxis,.03);assert.ok(Math.abs(mit.y-(sh.y-.19))<.012&&mit.x-sh.x>.06,`서기 장갑 ${mit.toArray()}`);""")
# blend block: replace by regex from ' for(const running of [false,true]){let err=0,blend=0;' to the closing ' }' before '// 스테미나'
m=re.search(r" for\(const running of \[false,true\]\)\{let err=0,blend=0;.*?\n \}\n", s, re.S)
assert m
s=s[:m.start()]+""" // 걷기↔뛰기: 섞는 동안 두 클립의 디딤 구간을 같은 위상에 맞추고 걸음 길이도 같은 빠르기로 옮겨, 섞는 전 구간에서 디딘 발이 6mm 안에 붙는다.
 let ph=0;for(const running of [false,true]){let err=0;
  for(let i=0;i<90;i++){const step=running?st.run:st.walk,dph=(running?8.2:6.2)/30;ph+=dph;h.scene.position.z-=dph*step;h.scene.updateMatrixWorld(true);
   h.update({clip:'Walk',distance:ph,stride:1,stepLength:step,running,dt:1/30,speed:1.4});
   for(const c of h.ground({moving:true,phase:ph,surfaceHeight:flat}))if(c.planted){assert.ok(Number.isFinite(c.bottom));err=Math.max(err,c.error);}}
  assert.ok(err<.006,`${running?'걷기→뛰기':'걷기'} 디딘 발 오차(섞는 동안 포함) ${err}`);
  assert.ok(Math.abs(h.gait.run-(running?1:0))<.01);
  for(const a of h.interaction.arms)assert.ok(a.targetError<.03,`팔 IK ${a.targetError}`);
 }
 h.scene.position.set(0,0,0);h.scene.updateMatrixWorld(true);
"""+s[m.end():]
rep(""" for(let i=0;i<15;i++){h.update({clip:'Walk',distance:6+i*.06,stride:1,stepLength:st.walk,running:false,dt:1/30});h.ground({moving:true,phase:6+i*.06,surfaceHeight:flat});}""",
""" for(let i=0;i<15;i++){ph+=.2;h.update({clip:'Walk',distance:ph,stride:1,stepLength:st.walk,running:false,dt:1/30});h.ground({moving:true,phase:ph,surfaceHeight:flat});}""")
s+=open('artifacts/probe/new-tests.mjs').read()
open(p,'w').write(s)
