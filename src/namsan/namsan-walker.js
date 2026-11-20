// 남산 걷기 부품(walker, 한 게임 통합 4단계, 11-20). namsan-walk.js(걷기 규칙)는 고치지 않고 감싸기만 한다. 약속: src/walker.js
// 남산 자료 G(loadNamsanData)를 품고 만든다. three를 쓰지 않는다(node --test로 검사).
// 지금 남산 페이지(game.js)와 같은 값을 낸다: 함께 걷기 구역은 늘 'plaza'(옛 페이지와 서로 보이게, 조사 §2-5 (3)), 동행 길 정보 없음.
// 관악산 부품에만 의미가 있는 보폭·계단 동작 키(stride·strideScale·onStairs)는 null — 남산을 공통 본체로 옮기는 5·6단계에서 채운다.
import {NAMSAN_SAVE_KEY,createWalkState,saveData,stepWalk,walkHeight,heightAt,jumpTo,wrapAngle,placeOf,walkable} from './namsan-walk.js';
import {courseAt} from './namsan-data.js';

export function createNamsanWalker(G){
 const end=()=>G.points.at(-1).s;
 const point=st=>[st.x,walkHeight(G,st),st.z];
 // 자리 옮기기(함께 걷기 받은 자리·점검): 걷는 곳만, 코스 가까이면 진행 거리도 그 자리로
 const setPosition=(st,pos)=>{if(!Number.isFinite(pos?.x)||!walkable(G,pos.x,pos.z))return false;st.x=pos.x;st.z=pos.z;if(Number.isFinite(pos.heading))st.heading=pos.heading;st.auto=false;const p=placeOf(G,st.x,st.z);if(p.hit.distance<4)st.s=p.hit.s;return true;};
 return Object.freeze({
  id:'namsan',
  saveKey:NAMSAN_SAVE_KEY,               // 'namsan-hike:v1' — 이름·형식 그대로
  startOptions:Object.freeze(['start','summit']),
  // start 'summit' = 정상 20m 앞(?start=summit), 그 밖은 출발 광장 쪽 코스 2m
  initialState:({start}={})=>{const st=createWalkState(G,null);if(start==='summit')jumpTo(G,st,end()-20);return st;},
  restore:raw=>{let v=null;try{v=JSON.parse(raw??'null');}catch{}return createWalkState(G,v);},
  serialize:st=>JSON.stringify(saveData(st)),
  // 한 프레임 걷기. 공통 약속대로 속도를 돌려주고, 스탬프·완등 같은 남산 결과는 walk()로 받는다.
  advance:(st,input,dt)=>stepWalk(G,st,input,dt).speed,
  walk:(st,input,dt)=>stepWalk(G,st,input,dt),
  setPose:()=>{},
  zone:()=>'plaza',
  freeZone:()=>true,
  offTrail:()=>false,                     // 걷는 곳 밖으로는 못 나간다(가장자리 미끄러짐)
  point,
  heading:st=>st.heading,
  turnFree:(st,yaw)=>{st.heading=wrapAngle(st.heading+yaw);},
  floorAt:(st,s)=>s===st.s?walkHeight(G,st):courseAt(G.points,s).y,
  // 코스 s 자리에서 옆으로 lateral(game.js 밤 조명 자리와 같은 식)
  place:(s,l=0)=>{const k=courseAt(G.points,s),x=k.x-k.nx*(l+.25),z=k.z-k.nz*(l+.25);return [x,heightAt(G,x,z),z];},
  position:st=>({zone:'plaza',x:st.x,y:walkHeight(G,st),z:st.z,heading:st.heading}),
  setPosition,setPeerPosition:setPosition,
  courseDistance:st=>st.s,
  get courseLength(){return end();},
  minS:0,get maxS(){return end();},
  jump:(st,s)=>jumpTo(G,st,s),
  stride:null,strideScale:null,onStairs:null,
  isStairs:m=>m==='stairs',
  nudge:()=>false,
  here:()=>null,
  sample:null,
 });
}
