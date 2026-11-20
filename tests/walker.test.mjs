// 걷기 부품(walker) 약속 점검(한 게임 통합 4단계, 11-20). 관악산 부품은 main.js에 있던 식과 같은 값을, 남산 부품은 game.js와 같은 값을 내야 한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WALKER_KEYS,missingWalkerKeys} from '../src/walker.js';
import {walker as W,GWANAK} from '../src/mountains/gwanak.js';
import {sample,route,isStairs} from '../src/route.js';
import {initialState,restore,positionAt,isOffTrail,playerPosition,setPlayerPosition,SAVE_KEY,COURSE_LENGTH,ROUTE_MIN_S} from '../src/movement.js';
import {SUMMIT_CENTER} from '../src/summit.js';
import {createNamsanGround} from '../src/namsan/namsan-data.js';
import {createWalkState,stepWalk,walkHeight,saveData,jumpTo,NAMSAN_SAVE_KEY} from '../src/namsan/namsan-walk.js';
import {createNamsanWalker} from '../src/namsan/namsan-walker.js';

// 평평한 가짜 땅(main.js walkingGround와 같은 모양: height(x,z,off)·summit.height)
const ground={height:(x,z,off)=>x*.01+z*.02+(off?.5:0),summit:{height:(x,z)=>100+x*.001}};
// main.js 4단계 이전 식(글자 그대로)
const old={
 point:state=>state.zone==='plaza'?[state.plaza.x,ground.height(state.plaza.x,state.plaza.z,false),state.plaza.z]:state.zone==='summit'?[state.summit.x,ground.summit.height(state.summit.x,state.summit.z),state.summit.z]:positionAt(state.s,state.lateral,ground),
 free:state=>state.zone==='plaza'||state.zone==='summit',
 off:state=>state.zone==='route'&&isOffTrail(state.s,state.lateral),
 heading:state=>state.zone==='plaza'?state.plaza.heading:state.zone==='summit'?state.summit.heading:sample(state.s).heading,
};

test('두 산 부품 모두 약속 키를 다 갖는다', ()=>{
 assert.deepEqual(missingWalkerKeys(W),[]);
 const G=namsanG();assert.deepEqual(missingWalkerKeys(createNamsanWalker(G)),[]);
 assert.ok(WALKER_KEYS.length>=25);
});

test('관악산 부품: 저장 키·코스 길이·시작점은 movement.js 그대로', ()=>{
 assert.equal(W.saveKey,SAVE_KEY);assert.equal(W.saveKey,'gwanak-hiking:v1');assert.equal(GWANAK.saveKey,W.saveKey);
 assert.equal(W.courseLength,COURSE_LENGTH);assert.equal(W.minS,ROUTE_MIN_S);assert.equal(W.maxS,route.length);
 for(const start of ['plaza','gate','demo','summit'])assert.deepEqual(W.initialState({start}),initialState({start}));
 const st=initialState({start:'demo'});st.s=1234.5;st.lateral=.7;st.steps=99;
 const raw=W.serialize(st);assert.equal(raw,JSON.stringify(st));assert.deepEqual(W.restore(raw),restore(raw));
});

test('관악산 부품: 세 구역에서 몸 자리·방향·길 밖·자유 구역이 4단계 이전 식과 같다', ()=>{
 const cases=[initialState({start:'plaza'})];
 for(const s of [0,400,1500,2600,3900,route.length-50])for(const l of [0,1.2,-3,6]){const st=initialState({start:'demo'});setPlayerPosition(st,{zone:'route',s,lateral:l});cases.push(st);}
 const sm=initialState({start:'summit'});assert.ok(setPlayerPosition(sm,{zone:'summit',x:SUMMIT_CENTER.x+3,z:SUMMIT_CENTER.z-2,heading:.4}));cases.push(sm);
 for(const st of cases){
  assert.deepEqual(W.point(st,ground),old.point(st),`${st.zone} ${st.s}`);
  assert.equal(W.heading(st),old.heading(st));assert.equal(W.freeZone(st),old.free(st));assert.equal(W.offTrail(st),old.off(st));
  assert.equal(W.zone(st),st.zone);
  assert.deepEqual(W.position(st,ground),playerPosition(st,ground));
  assert.equal(W.floorAt(st,st.s,ground),old.point(st)[1]);
  assert.equal(W.floorAt(st,st.s+5,ground),positionAt(st.s+5,st.lateral,ground)[1]);
 }
 assert.ok(cases.some(st=>W.offTrail(st))&&cases.some(st=>!W.offTrail(st)),'길 밖·길 위 둘 다 시험함');
});

test('관악산 부품: 자유 구역 몸 돌리기·동행 길 정보·받은 자리', ()=>{
 const p=initialState({start:'plaza'}),h=p.plaza.heading;W.turnFree(p,.3);assert.equal(p.plaza.heading,Math.atan2(Math.sin(h+.3),Math.cos(h+.3)));
 assert.equal(W.here(p),null);
 const st=initialState({start:'demo'}),here=W.here(st),q=sample(st.s);
 assert.equal(here.width,q.width);assert.equal(here.stairs,isStairs(q.material));assert.ok(Math.abs(Math.hypot(here.forward.x,here.forward.z)-1)<1e-9);
 // 코스 자리를 x,z로만 받으면 코스에 투영(4단계 이전 setPosition과 같은 길)
 const [x,,z]=positionAt(2000,.5);assert.ok(W.setPeerPosition(st,{zone:'route',x,z},ground));assert.ok(Math.abs(st.s-2000)<.5,`s ${st.s}`);
 assert.ok(W.setPeerPosition(st,{zone:'route',s:1800,lateral:.4},ground));assert.equal(st.s,1800);assert.equal(st.lateral,.4);
});

test('관악산 부품: 동행 밀어내기는 노면 안·금지 원을 지킨다', ()=>{
 const st=initialState({start:'demo'}),s0=st.s;
 assert.ok(W.nudge(st,{ds:.1,dl:.05},{ground,blocked:()=>false}));assert.ok(st.s>s0);
 // 지금 자리 말고는 모두 막힘 → 안 옮김(이미 막힌 곳에 있으면 빠져나가는 것은 허용하는 규칙이라 지금 자리는 열어 둠)
 const s1=st.s,[cx,,cz]=positionAt(st.s,st.lateral),here=(x,z)=>Math.hypot(x-cx,z-cz)<1e-6;
 assert.equal(W.nudge(st,{ds:.1},{ground,blocked:(x,z)=>!here(x,z)}),false);assert.equal(st.s,s1);
 const p=initialState({start:'plaza'}),x0=p.plaza.x;assert.ok(W.nudge(p,{x:.05,z:0},{ground,blocked:()=>false}));assert.ok(Math.abs(p.plaza.x-x0-.05)<1e-9);
});

function namsanG(){
 const dir='assets/shared/namsan/',meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
 const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
 return createNamsanGround({meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:[],forest:null});
}

test('남산 부품: 저장·시작·걷기·자리가 namsan-walk(game.js 4단계 이전)와 같다', ()=>{
 const G=namsanG(),N=createNamsanWalker(G),END=G.points.at(-1).s;
 assert.equal(N.saveKey,NAMSAN_SAVE_KEY);assert.equal(N.courseLength,END);assert.equal(N.maxS,END);
 assert.deepEqual(N.initialState(),createWalkState(G,null));
 const top=createWalkState(G,null);jumpTo(G,top,END-20);assert.deepEqual(N.initialState({start:'summit'}),top);
 assert.deepEqual(N.restore(null),createWalkState(G,null));assert.deepEqual(N.restore('깨진 글'),createWalkState(G,null));
 // 같은 입력으로 두 상태를 나란히 걸려 같은 자리·같은 저장 글
 const a=createWalkState(G),b=N.initialState();a.auto=b.auto=true;
 for(let i=0;i<600;i++){const ra=stepWalk(G,a,{auto:true},.1),sb=N.advance(b,{auto:true},.1);assert.equal(sb,ra.speed);}
 assert.deepEqual(b,a);assert.equal(N.serialize(b),JSON.stringify(saveData(a)));
 assert.deepEqual(N.restore(N.serialize(b)),createWalkState(G,JSON.parse(JSON.stringify(saveData(a)))));
 assert.deepEqual(N.point(b),[a.x,walkHeight(G,a),a.z]);
 assert.deepEqual(N.position(b),{zone:'plaza',x:a.x,y:walkHeight(G,a),z:a.z,heading:a.heading});
 assert.equal(N.zone(b),'plaza');assert.equal(N.here(b),null);assert.equal(N.nudge(b),false);
 // 걷는 곳 밖 자리는 거절, 걷는 곳이면 옮김
 assert.equal(N.setPeerPosition(b,{x:1e6,z:1e6}),false);
 const k=G.points[40];assert.ok(N.setPosition(b,{x:k.x,z:k.z,heading:1}));assert.equal(b.x,k.x);assert.equal(b.heading,1);
});
