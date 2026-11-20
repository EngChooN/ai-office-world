// 남산 산 정의·남산용 콘텐츠·상호작용 컨트롤러(한 게임 통합 5단계, 월드개발 11-20)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround,NAMSAN} from '../src/namsan/namsan-data.js';
import {planNamsanInteract} from '../src/namsan/namsan-interact-art.js';
import {makeWalkPads,placeOf,walkable,walkHeight,createWalkState,stepWalk} from '../src/namsan/namsan-walk.js';
import {NAMSAN_MOUNTAIN,NAMSAN_FEATURES} from '../src/mountains/namsan.js';
import {GWANAK} from '../src/mountains/gwanak.js';
import {MOUNTAINS} from '../src/mountains.js';
import {NS_STAMPS,NS_SIGNS,NS_LANDMARKS,NS_LANDMARK_ABOUT,NS_ACTIONS,NS_LOCKS} from '../src/namsan/namsan-content.js';
import {createNamsanInteract,loadNsProgress,saveNsProgress,NS_PROGRESS_KEY,encodeLocks,decodeLocks,planNightBenches} from '../src/namsan/namsan-interact.js';
import {ACTIONS} from '../src/interaction-data.js';

const dir='assets/shared/namsan/';
const meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},
 course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:JSON.parse(readFileSync(dir+'walls.json','utf8')).walls,busRoad:JSON.parse(readFileSync(dir+'bus-road.json','utf8'))};
const G=createNamsanGround(data);
// 그림 spots와 같은 「서 있을 곳」을 three 없이 다시 구한다(물확·돌탑은 plan 자리에서 face 쪽 앞). 실제 값은 게임 점검(verify-namsan-content)이 확인
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),m};};

test('산 정의: 남산 카드 값은 11-19 카드 그대로, 저장 키 이름 그대로, 기능 스위치 이름이 관악산과 같다', ()=>{
 const card=MOUNTAINS.find(m=>m.id==='namsan');
 assert.deepEqual({...card},{id:'namsan',name:'남산',altitudeM:265,course:'백범광장 → 남산 정상 · 성곽 계단길',summitName:'남산 정상',distanceKm:1.1,etaMin:30,stamps:4,difficulty:'쉬움',ready:true,page:'namsan/',tag:'밤 전망 추천',art:{ridge:[.06,.14,.27,.42,.56,.5,.42,.35,.29,.23],peak:.44,summit:'tower',course:'zigzag-left'}});
 assert.equal(NAMSAN_MOUNTAIN.saveKey,'namsan-hike:v1');assert.equal(NAMSAN_MOUNTAIN.progressKey,'namsan-interaction:v1');assert.equal(NAMSAN_MOUNTAIN.summitId,'namsan');
 assert.deepEqual(Object.keys(NAMSAN_FEATURES).sort(),Object.keys(GWANAK.features).sort());
 for(const k of ['spring','dip','cairn','summitStone','stamps','boards','binoculars','loveLocks','bus','nightBench'])assert.ok(NAMSAN_FEATURES[k],k);
 for(const k of ['loveLocks','bus','nightBench'])assert.equal(GWANAK.features[k],false,k);
});

test('콘텐츠 글: 스탬프 4·이정표 4(판 글 수만큼 방향)·명소 10곳 이상 모두 설명, 행동은 관악산 시간 그대로', ()=>{
 assert.equal(NS_STAMPS.length,4);for(const s of NS_STAMPS)assert.ok(s.note&&s.name&&s.glyph,s.name);
 assert.equal(NS_SIGNS.length,NAMSAN.signs.length);
 NS_SIGNS.forEach((sg,i)=>{assert.equal(sg.dirs.length,NAMSAN.signs[i].boards.length,`이정표 ${i+1} 방향 수`);assert.ok(sg.page.title&&sg.page.body.length,`이정표 ${i+1} 글`);});
 assert.ok(NS_LANDMARKS.length>=10);for(const l of NS_LANDMARKS){assert.ok(Number.isFinite(l.lat)&&Number.isFinite(l.lon),l.id);assert.ok(NS_LANDMARK_ABOUT[l.id]?.body?.length,`${l.id} 설명`);}
 assert.ok(NS_LANDMARKS.some(l=>l.id==='lm-gwanak'),'관악산이 보임');
 for(const k of ['drink','dip','cairn'])assert.equal(NS_ACTIONS[k].total,ACTIONS[k].total);
});

test('디딤 띠: 길·광장 밖 상호작용 자리(물확 2·돌탑)까지 걸어갈 수 있고, 그 밖 땅은 여전히 못 걷는다', ()=>{
 const plan=planNamsanInteract(G,{walls:data.walls});
 // 그림 자리(물확 그릇·돌탑 무리 가운데)를 서 있을 곳으로 삼아도 띠로 이어지는지 본다(실제 서 있을 곳은 게임 점검 verify-namsan-content가 확인)
 const stand=[...plan.basins.map(b=>({id:b.id,x:b.x,z:b.z})),{id:'cairn',x:plan.cairn.x,z:plan.cairn.z}];
 const before=stand.map(p=>walkable(G,p.x,p.z));
 const g2={...G,walkPads:makeWalkPads(G,stand)};
 stand.forEach((p,i)=>{if(!before[i])assert.ok(walkable(g2,p.x,p.z),`${p.id} 디딤 띠로 걸을 수 있음`);});
 // 띠 밖 숲은 그대로 못 걷는다
 const far={x:plan.cairn.x+30,z:plan.cairn.z+30};assert.equal(walkable(g2,far.x,far.z),walkable(G,far.x,far.z));
 // 띠 위 높이는 땅(코스 높이가 아님)
 const p=stand.at(-1);if(!before.at(-1)){const st={x:p.x,z:p.z,s:G.points.at(-1).s};assert.ok(Math.abs(walkHeight(g2,st)-G.ground(p.x,p.z))<.8);}
});

test('저장: namsan-interaction:v1 형식, 이상한 값은 버림, 자물쇠는 최대 3개', ()=>{
 const st=mem();st.setItem(NS_PROGRESS_KEY,JSON.stringify({drinks:2,dips:-1,stones:'x',read:{'ns-sign-1':true,'<b>':true},certifiedAt:5,locks:[{i:3,c:1,h:1},{i:9,c:99},{i:10,c:2},{i:11,c:3},{i:12,c:4}]}));
 const p=loadNsProgress(st);assert.equal(p.drinks,2);assert.equal(p.dips,0);assert.equal(p.stones,0);assert.deepEqual(Object.keys(p.read),['ns-sign-1']);assert.equal(p.certifiedAt,5);
 assert.equal(p.locks.length,NS_LOCKS.max);assert.deepEqual(p.locks[0],{i:3,c:1,h:1,at:0});
 assert.ok(saveNsProgress(st,p));assert.deepEqual(loadNsProgress(st),p);
 assert.deepEqual(loadNsProgress(null).locks,[]);
});

test('자물쇠 공유 글자: act x 칸 규칙([a-z0-9-] 24자 안)을 지키고 그대로 되읽힌다', ()=>{
 const list=[{i:0,c:0,h:0},{i:233,c:9,h:1},{i:120,c:4,h:0}];const x=encodeLocks(list);
 assert.match(x,/^[a-z0-9-]{0,24}$/);assert.deepEqual(decodeLocks(x),list);
 assert.equal(encodeLocks([]),'');assert.deepEqual(decodeLocks('drink'),[]);assert.deepEqual(decodeLocks('lk-zz'),[]);
});

test('야경 벤치: 2개, 광장 걷는 곳 안·전망탑과 떨어짐·바깥을 봄', ()=>{
 const tw=NAMSAN.tower,b=planNightBenches(G,{avoid:[{x:tw.x,z:tw.z,r:15}]});assert.equal(b.length,2);
 for(const o of b){assert.ok(placeOf(G,o.x,o.z).inSummit,'광장 안');assert.ok(Math.hypot(o.x-tw.x,o.z-tw.z)>=15);
  const out={x:o.x-G.plaza.x,z:o.z-G.plaza.z},f={x:Math.sin(o.yaw),z:Math.cos(o.yaw)};assert.ok(out.x*f.x+out.z*f.z>0,'앞이 바깥');}
 assert.ok(Math.hypot(b[0].x-b[1].x,b[0].z-b[1].z)>=5);
});

// 컨트롤러: 가짜 ui·deps로 행동·읽기·정상석·스탬프 줄
function fakeUI(){const u={boardOpen:false,board:null,toasts:[],action:null,markers:[],bino:null,
 openBoard(m){u.boardOpen=true;u.board=m;},closeBoard(){u.boardOpen=false;},stepBoard:()=>false,toast(t){u.toasts.push(t);},setAction(a){u.action=a;},setMarkers(m){u.markers=m;},setBino(b){u.bino=b;}};return u;}
test('컨트롤러: 약수 앞에서 F → 3.4초 뒤 끝, 움직이면 취소, 쿨다운 줄', ()=>{
 const ui=fakeUI(),me={x:0,z:0,heading:0},storage=mem();
 const ix=createNamsanInteract({spots:[{id:'spring-1',action:'drink',x:0,z:-1,y:0}],player:()=>me,ui,storage});
 ix.update(.1);assert.equal(ix.view.rows[0].label,'약수 한 모금');
 assert.ok(ix.handle('interact'));for(let i=0;i<40;i++)ix.update(.1);assert.equal(ix.result.id,'drink');assert.equal(ix.progress.drinks,1);
 assert.equal(JSON.parse(storage.getItem(NS_PROGRESS_KEY)).drinks,1);
 ix.update(.1);assert.equal(ix.view.rows[0].state,'lock');
 for(let i=0;i<220;i++)ix.update(.1);ix.handle('interact');ix.update(.5,{moving:true});assert.equal(ix.action,null);assert.ok(ui.toasts.at(-1).includes('움직여'));
});
test('컨트롤러: 이정표 F = 안내판 두 쪽(판 글 + 남산 글), 정상석 F = 정상 인증·정상 스탬프', ()=>{
 const ui=fakeUI(),me={x:0,z:0,heading:0},got=[];
 const ix=createNamsanInteract({items:[{kind:'sign',n:1,x:0,z:-1,boards:NAMSAN.signs[0].boards,upBearing:0},{kind:'summit-stone',x:50,z:-1}],player:()=>me,ui,stamps:()=>got,addStamp:n=>{if(got.includes(n))return false;got.push(n);return true;},geo:()=>({x:0,z:-100})});
 ix.update(.1);ix.handle('interact');assert.equal(ui.board.pages.length,2);assert.equal(ui.board.pages[0].rows.length,3);assert.equal(ui.board.pages[1].title,'성곽길 들머리');
 ix.handle('interact');assert.equal(ui.boardOpen,false);
 me.x=50;ix.update(.1);assert.equal(ix.view.rows[0].label,'정상석 확인 · 정상 인증');ix.handle('interact');assert.ok(ix.progress.certifiedAt);assert.deepEqual(got,[4]);assert.equal(ui.board.pages[0].title,'남산 정상 · 265m');
});
