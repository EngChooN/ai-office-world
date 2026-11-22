// 남산 전망탑 들어가기 규칙(11-22): 문 자리·전망대 계획·고리 걷기·엘리베이터 시각표·실제 탑 사진/로고 안 씀
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DECK,ELEVATOR,planTowerEntrance,planDeck,deckWalk,elevatorAt,elevatorSkipTo,inTowerXZ,bearingToDir,dirToBearing,headingFor,SCOPE_TARGETS} from '../src/namsan/namsan-tower.js';
import {TOWER_SHAPE} from '../src/namsan/namsan-tower-shape.js';
import {NS_LANDMARKS} from '../src/namsan/namsan-content.js';
import {project} from '../assets/realistic/geo.js';
import {NAMSAN} from '../src/namsan/namsan-data.js';

const TW={x:0,z:0};
test('방위 ↔ 방향: 북 = −z, 동 = +x, heading 앞 = (−sin, −cos)',()=>{
 const n=bearingToDir(0),e=bearingToDir(90);assert.ok(Math.abs(n.z+1)<1e-9&&Math.abs(e.x-1)<1e-9);
 assert.ok(Math.abs(dirToBearing(1,0)-90)<1e-9&&Math.abs(dirToBearing(0,1)-180)<1e-9);
 const h=headingFor(0,-1);assert.ok(Math.abs(-Math.sin(h))<1e-9&&Math.abs(-Math.cos(h)+1)<1e-9);
});
test('문 자리: 바라는 방위에서 시작, 막힌 곳은 비켜 감, 서는 자리는 받침 밖 걷는 곳·문을 봄',()=>{
 const a=planTowerEntrance(TW,{want:180});assert.equal(a.bearing,180);
 assert.ok(Math.abs(Math.hypot(a.stand.x,a.stand.z)-(TOWER_SHAPE.baseR+1.15))<1e-9);
 const f={x:-Math.sin(a.stand.heading),z:-Math.cos(a.stand.heading)};assert.ok(f.x*(-a.stand.x)+f.z*(-a.stand.z)>0,'문(탑) 쪽을 봄');
 const b=planTowerEntrance(TW,{want:180,avoid:[{x:0,z:13,r:4}]});assert.notEqual(b.bearing,180);
 assert.ok(Math.hypot(b.stand.x-0,b.stand.z-13)>=4);
 const c=planTowerEntrance(TW,{want:90,walkable:(x)=>x<0});assert.ok(c.stand.x<0,'걷는 곳만');
});
test('전망대: 실제 탑 원반 높이·엘리베이터 앞 도착·망원경 4대·이름판은 쌍안경 명소 자료 그대로',()=>{
 const geo=(la,lo)=>project(la,lo),tw=NAMSAN.tower;
 const d=planDeck(tw,{plazaY:240,entranceBearing:200,landmarks:NS_LANDMARKS,geo});
 assert.equal(d.y,240+TOWER_SHAPE.podMid+.6);
 assert.ok(DECK.rMax<DECK.sill&&DECK.sill<DECK.glass&&DECK.glass<TOWER_SHAPE.podR,'걷는 고리 < 창턱 < 유리 < 원반');
 const ra=Math.hypot(d.arrive.x-tw.x,d.arrive.z-tw.z);assert.ok(ra>=DECK.rMin&&ra<=DECK.rMax);
 assert.equal(d.labels.length,NS_LANDMARKS.length);
 const gw=d.labels.find(l=>l.id==='lm-gwanak');assert.ok(gw.bearing>150&&gw.bearing<230,'관악산은 남쪽');assert.ok(gw.km>8&&gw.km<15);
 const bk=d.labels.find(l=>l.id==='lm-bukhan');assert.ok(bk.bearing<40||bk.bearing>320,'북한산은 북쪽');
 assert.equal(d.scopes.length,SCOPE_TARGETS.length);
 for(const s of d.scopes){const r=Math.hypot(s.stand.x-tw.x,s.stand.z-tw.z);assert.ok(r>=DECK.rMin&&r<=DECK.rMax,'망원경 뒤 서는 자리는 걷는 고리 안');
  assert.ok(Math.abs(((s.bearing-200+540)%360)-180)>=14,'엘리베이터 문 앞을 비킴');}
 assert.ok(inTowerXZ(tw,d.arrive.x,d.arrive.z)&&!inTowerXZ(tw,tw.x+20,tw.z));
});
test('고리 걷기: 기둥·창턱 밖으로 못 나감, 자동 걷기는 유리창 쪽 고리를 따라 돎',()=>{
 const st={x:0,z:-(DECK.rMax-.1),heading:0,auto:false};
 for(let i=0;i<60;i++)deckWalk(st,TW,{forward:1,yaw:0},.1);   // 북쪽(바깥)으로 계속
 assert.ok(Math.hypot(st.x,st.z)<=DECK.rMax+1e-9);
 const st2={x:0,z:-(DECK.rMin+.2),heading:Math.PI,auto:false};
 for(let i=0;i<60;i++)deckWalk(st2,TW,{forward:1,yaw:Math.PI},.1);   // 기둥 쪽으로
 assert.ok(Math.hypot(st2.x,st2.z)>=DECK.rMin-1e-9);
 const a={x:0,z:-8,heading:0,auto:true};let ang=0,prev=Math.atan2(a.x,a.z);
 for(let i=0;i<400;i++){const r=deckWalk(a,TW,{},.1);assert.ok(r.moved>0);const now=Math.atan2(a.x,a.z);let d=now-prev;d=Math.atan2(Math.sin(d),Math.cos(d));ang+=d;prev=now;}
 assert.ok(Math.abs(Math.hypot(a.x,a.z)-DECK.autoR)<.3,'유리창 쪽 고리로 붙음');assert.ok(Math.abs(ang)>2,'돌아감');
 const b={x:0,z:-8,heading:0,auto:true};deckWalk(b,TW,{forward:1,yaw:0},.1);assert.equal(b.auto,false,'직접 걸으면 자동 걷기 끔');
 const c={x:0,z:-10,heading:0};deckWalk(c,TW,{forward:1,yaw:0},.1,{blocks:[{x:0,z:-10.1,r:.45}]});assert.ok(Math.hypot(c.x,c.z+10.1)>=.45-1e-9,'망원경 기둥 비킴');
});
test('엘리베이터: 3~5초, 층 1→5→전망, 문 닫힌 동안만 자리 옮김, 건너뛰기는 문 열림으로',()=>{
 for(const dir of ['up','down']){const E=ELEVATOR[dir],total=E.close+E.move+E.open;assert.ok(total>=3&&total<=5,`${dir} ${total}초`);
  assert.equal(elevatorAt(dir,0).swap,false);assert.equal(elevatorAt(dir,0).doors,0);
  const mid=elevatorAt(dir,E.close+E.move/2);assert.equal(mid.phase,'move');assert.equal(mid.doors,1);assert.ok(mid.shake>.9);
  assert.equal(elevatorAt(dir,total+.1).phase,'done');assert.equal(elevatorAt(dir,elevatorSkipTo(dir)).phase,'open');}
 const seen=[];for(let t=0;t<4.3;t+=.05){const f=elevatorAt('up',t).floor;if(seen.at(-1)!==f)seen.push(f);}
 assert.deepEqual(seen,['1','2','3','4','5','전망']);
 const down=[];for(let t=0;t<3.5;t+=.05){const f=elevatorAt('down',t).floor;if(down.at(-1)!==f)down.push(f);}
 assert.equal(down[0],'전망');assert.equal(down.at(-1),'1');
});
test('그림·연결: 실제 타워 사진·로고 파일을 쓰지 않음, 게임이 들어가기·나가기·망원경을 잇는다',()=>{
 const art=readFileSync('src/namsan/namsan-tower-art.js','utf8'),game=readFileSync('src/namsan/game.js','utf8');
 assert.doesNotMatch(art,/\.(png|jpe?g|webp|glb)['"]/i,'외부 그림 파일 없음(직접 그린 도형·글자판)');
 assert.doesNotMatch(art+game,/N서울타워 로고|YTN/);
 for(const k of ["action:'tower'","action:'towerexit'","action:'scope'","zone:'summit'",'ns-deck-exit','건너뛰기'])assert.ok(game.includes(k),k);
});
