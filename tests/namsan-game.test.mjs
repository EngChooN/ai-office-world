// 남산 게임 연결 점검(월드개발 11-19): 걷기 규칙(namsan-walk.js)·산 목록·함께 걷기 방 나누기·서버 인원 계산.
// 화면 점검은 scripts/verify-namsan-game.mjs(산 고르기 → 남산, PC·휴대폰 오르기, 두 사람).
import {readPage} from '../scripts/html-include.mjs';
import {NAMSAN_TEXT} from '../src/mountains/namsan-page.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNamsanGround,courseAt,NAMSAN} from '../src/namsan/namsan-data.js';
import {TOWER} from '../src/namsan/namsan-art.js';
import {WALK,createWalkState,stepWalk,walkHeight,walkable,placeOf,jumpTo,saveData,speedAt,stairRuns,NAMSAN_SERVERS,namsanRoom,isNamsanRoom} from '../src/namsan/namsan-walk.js';
import {MOUNTAINS,mountainById} from '../src/mountains.js';
import {findServer,SERVERS} from '../src/multi-protocol.js';
import {statusView,roomLabel} from '../src/multi-entry-ui.js';

const dir='assets/shared/namsan/';
const meta=JSON.parse(readFileSync(dir+'namsan-meta.json','utf8'));
const buf=readFileSync(dir+meta.terrain.file),land=readFileSync(dir+meta.landcover.file);
const data={meta,terrain:{...meta.terrain,values:new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)),land:new Uint8Array(land)},course:JSON.parse(readFileSync(dir+'course.json','utf8')),walls:[],forest:null};
const G=createNamsanGround(data),END=G.points.at(-1).s;

test('자동 걷기로 출발부터 정상까지 끝까지 오른다(약 17분 · 스탬프 4 · 높이가 튀지 않음)', ()=>{
 const st=createWalkState(G);st.auto=true;let t=0,prev=walkHeight(G,st),maxJump=0,stuck=0,lastS=st.s;
 while(!st.done&&t<3600){const r=stepWalk(G,st,{auto:true},.1);t+=.1;const y=walkHeight(G,st);maxJump=Math.max(maxJump,Math.abs(y-prev));prev=y;
  assert.ok(walkable(G,st.x,st.z),`${st.s.toFixed(0)}m에서 걷는 곳 밖`);if(st.s<=lastS+1e-4)stuck++;else stuck=0;lastS=st.s;assert.ok(stuck<50,`${st.s.toFixed(0)}m에서 멈춤`);}
 assert.ok(st.done,'정상 도착');
 const min=t/60;assert.ok(min>14&&min<20,`걸린 시간 ${min.toFixed(1)}분(11-21 계단 속도 고친 뒤 16.8분)`);
 assert.deepEqual([...st.stamps].sort(),[1,2,3,4]);
 assert.ok(maxJump<.45,`0.1초 사이 높이 차 최대 ${maxJump.toFixed(2)}m`);
 assert.ok(st.ascent>140&&st.ascent<200,`오른 높이 ${st.ascent.toFixed(0)}m`);
});

test('걷는 곳: 길 폭 안·두 광장 안만, 전망탑 받침과 길 밖 숲은 못 감', ()=>{
 assert.equal(WALK.towerR,TOWER.baseR+.6,'전망탑 받침 반지름은 그림 값과 같게');
 const tw=NAMSAN.tower;assert.equal(walkable(G,tw.x,tw.z),false,'탑 한가운데');
 assert.equal(walkable(G,G.plaza.x+(G.plaza.x-tw.x)*.1,G.plaza.z+(G.plaza.z-tw.z)*.1)||walkable(G,G.points.at(-1).x,G.points.at(-1).z),true,'정상 광장');
 for(const s of [150,430,600,900]){const k=courseAt(G.points,s);
  assert.ok(walkable(G,k.x,k.z),`${s}m 길 가운데`);
  assert.equal(walkable(G,k.x+k.nx*4,k.z+k.nz*4),false,`${s}m 길 옆 4m(숲·성곽)`);}
 // 길 밖으로 계속 걸어도 길 안에 남는다(가장자리를 따라 미끄러짐)
 const st=createWalkState(G);jumpTo(G,st,500);for(let i=0;i<60;i++)stepWalk(G,st,{forward:1,yaw:st.heading-Math.PI/2.2},.1);
 assert.ok(walkable(G,st.x,st.z));assert.ok(placeOf(G,st.x,st.z).hit.distance<NAMSAN.stairWidth/2);
});

test('남산 계단 속도(11-21): 넓은 단이라 관악산 돌계단 0.5m/s보다 빠르고 포장 오르막보다 느리지 않음, 계단에서도 달리기', ()=>{
 for(const r of stairRuns(G).filter(r=>r.s1-r.s0>20)){const st=createWalkState(G);jumpTo(G,st,(r.s0+r.s1)/2);const k=courseAt(G.points,st.s);
  const walk=speedAt(G,st,k.tx,k.tz),run=speedAt(G,st,k.tx,k.tz,{run:true});
  assert.ok(walk>.75&&walk<1.3,`${r.s0.toFixed(0)}m 계단 걷기 ${walk.toFixed(2)}m/s`);
  assert.ok(Math.abs(run/walk-WALK.run)<1e-9,`${r.s0.toFixed(0)}m 계단 달리기 배율`);}
});

test('계단 위 높이는 계단 디딤돌 높이(코스 높이)를 따른다', ()=>{
 const st=createWalkState(G);jumpTo(G,st,600);const k=courseAt(G.points,600);
 assert.ok(k.stairs);assert.ok(Math.abs(walkHeight(G,st)-k.y)<.05);
});

test('이어 오르기 저장: 저장값으로 같은 자리, 걷는 곳 밖이거나 완등한 저장은 처음부터', ()=>{
 const st=createWalkState(G);jumpTo(G,st,700);st.stamps=[1,2];const back=createWalkState(G,JSON.parse(JSON.stringify(saveData(st))));
 assert.ok(Math.abs(back.s-700)<.5);assert.deepEqual(back.stamps,[1,2]);
 assert.ok(createWalkState(G,{x:0,z:0}).s<5);assert.ok(createWalkState(G,{...saveData(st),done:true}).s<5);
});

test('산 고르기: 남산 카드 값(설계서 §8)과 페이지, 관악산은 그대로', ()=>{
 const n=mountainById('namsan'),g=mountainById('gwanak');
 assert.equal(MOUNTAINS.length,2);assert.equal(MOUNTAINS[0].id,'gwanak','관악산이 첫 카드');
 assert.deepEqual({name:n.name,alt:n.altitudeM,km:n.distanceKm,eta:n.etaMin,stamps:n.stamps,diff:n.difficulty,page:n.page,summit:n.summitName},{name:'남산',alt:265,km:1.1,eta:17,stamps:4,diff:'쉬움',page:'namsan/',summit:'남산 정상'});
 assert.equal(n.stamps,NAMSAN.stamps.length);assert.ok(Math.abs(n.distanceKm*1000-END)<60);
 assert.equal(n.art.summit,'tower');assert.equal(n.art.course,'zigzag-left');
 assert.equal(g.page,undefined,'관악산은 지금 페이지');assert.equal(g.summitName,'연주대');assert.equal(g.altitudeM,632);
});

test('함께 걷기: 남산 방은 관악산 서버 방과 따로, 서버 목록(SERVERS)은 그대로', ()=>{
 assert.equal(NAMSAN_SERVERS.hiking.length,3);assert.equal(namsanRoom(),'남산-1');
 assert.equal(findServer('hiking',namsanRoom())?.mountain,'namsan','남산 방은 남산 서버 줄(관악산 줄과 따로)');assert.ok(!SERVERS.hiking.some(s=>s.mountain==='gwanak'&&isNamsanRoom(s.room)));
 assert.equal(SERVERS.hiking.length,6);assert.equal(SERVERS.hiking.filter(s=>s.room.startsWith('관악산')).length,3);assert.equal(SERVERS.hiking.filter(s=>s.room.startsWith('남산')).length,3);
 assert.ok(isNamsanRoom('남산')&&isNamsanRoom('남산-1')&&isNamsanRoom('남산-2'));assert.ok(!isNamsanRoom('관악산-1'));
 // 상태 칩: 남산 줄을 넘기면 '남산 서버'로 연결됨, 안 넘기면(관악산 화면) 예전처럼 '다른 방'
 assert.equal(statusView({state:'online',room:'남산',count:2,transport:'server'},NAMSAN_SERVERS).text,'연결됨 · 2명');
 assert.equal(roomLabel('남산',NAMSAN_SERVERS),'남산 1서버');
 assert.equal(statusView({state:'online',room:'남산',count:2,transport:'server'}).text,'연결됨 · 2명','남산 서버도 표에 있어 관악산 화면에서도 연결됨');assert.equal(statusView({state:'online',room:'우리끼리',count:2,transport:'server'}).text,'다른 방 · 2명');
});


test('날씨 출처(Open-Meteo CC BY 4.0)가 화면 출처 줄과 도움말에 있다(이용 조건, 11-19 · 6단계부터 관악산과 같은 화면 조각)', ()=>{
 const html=readPage('hiking/namsan/index.html');
 assert.match(html,/<html[^>]*data-mountain="namsan"/);
 assert.match(html.match(/<div id="source-line"[^>]*>(.*?)<\/div>/)[1],/Open-Meteo\.com \(CC BY 4\.0\)/);
 assert.match(html,/href="https:\/\/open-meteo\.com\/"/);assert.match(html,/creativecommons\.org\/licenses\/by\/4\.0/);
 assert.match(NAMSAN_TEXT.terrainCredit,/Copernicus WorldDEM-30/);assert.match(NAMSAN_TEXT.terrainCredit,/OpenStreetMap/);
});

test('함께 걷기 판 「이름표」(N)가 남산 command에서 처리된다', ()=>{
 const game=readFileSync('src/namsan/game.js','utf8');
 assert.match(game,/id==='labels-toggle'\).{0,200}multi\.setTags\(on\)/);
});
