// 관악산 걷기 부품(walker, 한 게임 통합 4단계, 11-20). 공통 본체(main.js)는 위치 모델(구역 plaza/route/summit·코스 s·옆 거리)을
//  직접 읽지 않고 이 부품을 거친다. 남산 부품(src/namsan/namsan-walker.js)도 같은 키를 채운다. 약속: src/walker.js WALKER_KEYS.
// 규칙: 감싸기만 — movement.js·plaza.js·summit.js는 고치지 않고, 아래 함수는 main.js에 있던 식을 글자 그대로 옮겼다(동작 같음).
// 상태 공통 필드: s(코스 위 거리 m)·lateral(옆 거리 m)·auto·running·pose·steps 등. 구역 값은 zone(state)로만 읽는다.
import {route,sample,isStairs} from '../route.js';
import {initialState,restore,SAVE_KEY,advance,setPose,positionAt,isOffTrail,playerPosition,setPlayerPosition,courseDistance,COURSE_LENGTH,strideAt,strideScaleFor,onStairs,lateralLimit,ROUTE_MIN_S} from '../movement.js';
import {summitWalkMap,projectToRoute} from '../summit.js';
import {routeNudge} from '../pair-walk.js';

const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const zone=state=>state.zone;
// 광장·정상 구역은 코스와 무관한 x,z를 직접 걷는다(zone 'summit'은 정상 둘레 자유 이동).
const freeZone=state=>state.zone==='plaza'||state.zone==='summit';
const freeSpot=state=>state.zone==='plaza'?state.plaza:state.summit;
// 몸 자리 [x,y,z]. ground = walking-ground(height(x,z,offTrail)·summit.height)
const point=(state,ground)=>state.zone==='plaza'?[state.plaza.x,ground.height(state.plaza.x,state.plaza.z,false),state.plaza.z]:state.zone==='summit'?[state.summit.x,ground.summit.height(state.summit.x,state.summit.z),state.summit.z]:positionAt(state.s,state.lateral,ground);

export const gwanakWalker=Object.freeze({
 id:'gwanak',
 saveKey:SAVE_KEY,                       // 'gwanak-hiking:v1' — 이름 그대로
 startOptions:Object.freeze(['plaza','gate','demo','summit']),
 initialState,restore,
 serialize:state=>JSON.stringify(state),
 advance,setPose,
 zone,freeZone,
 offTrail:state=>state.zone==='route'&&isOffTrail(state.s,state.lateral),
 point,
 heading:state=>state.zone==='plaza'?state.plaza.heading:state.zone==='summit'?state.summit.heading:sample(state.s).heading,
 // 자유 구역에서 카메라가 돌린 만큼 몸 방향에 더한다(main.js가 look.yaw를 0으로 돌림)
 turnFree:(state,yaw)=>{const free=freeSpot(state);free.heading=wrapAngle(free.heading+yaw);},
 // 코스 s 자리 발밑 높이(지금 자리면 몸 자리 높이)
 floorAt:(state,s,ground)=>s===state.s?point(state,ground)[1]:positionAt(s,state.lateral,ground)[1],
 place:(s,lateral,ground)=>positionAt(s,lateral,ground),
 position:playerPosition,setPosition:setPlayerPosition,
 // 함께 걷기에서 받은 자리(코스면 s가 없을 때 x,z를 코스에 투영)
 setPeerPosition:(state,pos,ground)=>{if(pos.zone==='route'){const r=Number.isFinite(pos.s)?{s:pos.s,lateral:pos.lateral??0}:projectToRoute(pos.x,pos.z,0);return setPlayerPosition(state,{zone:'route',s:r.s,lateral:r.lateral},ground);}return setPlayerPosition(state,pos,ground);},
 courseDistance,courseLength:COURSE_LENGTH,minS:ROUTE_MIN_S,maxS:route.length,
 stride:strideAt,strideScale:strideScaleFor,onStairs,isStairs,
 // 동행 밀어내기·자리 잡기. 길 위는 노면 반폭 안 s·lateral로, 광장·정상은 x,z로 옮기고 구역 경계 검사(setPosition)를 거친다.
 // blocked(x,z) = 바위·시설 금지 원(animal-lanes inForbid, 세계 자료라 main.js가 넘김)
 nudge:(state,{x,z,ds,dl},{ground,blocked})=>{
  if(state.zone==='route'){
   const next=routeNudge({s:state.s,lateral:state.lateral},{ds,dl},{halfWidth:s=>sample(s).width/2,minS:ROUTE_MIN_S,maxS:route.length,blocked:(s,l)=>{const [px,,pz]=positionAt(s,l);return blocked(px,pz);}});
   if(!next)return false;state.s=next.s;state.lateral=next.lateral;return true;
  }
  const free=freeSpot(state);if(!free)return false;
  const nx=free.x+x,nz=free.z+z;if(blocked(nx,nz)&&!blocked(free.x,free.z))return false;
  return setPlayerPosition(state,{zone:state.zone,x:nx,z:nz,heading:free.heading},ground);
 },
 // 동행용 지금 길 정보(코스 위에서만)
 here:state=>{
  if(state.zone!=='route')return null;
  const p=sample(state.s),a=sample(state.s-2),b=sample(state.s+2),len=Math.hypot(b.x-a.x,b.z-a.z)||1;
  return {width:p.width,stairs:isStairs(p.material),forward:{x:(b.x-a.x)/len,z:(b.z-a.z)/len},normal:{x:-(b.z-a.z)/len,z:(b.x-a.x)/len}};
 },
 sample,
 // 개발용: 정상 구역 걷기 지도
 summitMap:ground=>summitWalkMap(ground.summit,lateralLimit),
});
