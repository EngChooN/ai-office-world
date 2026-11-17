// 온라인 크리스마스 광장(월드개발, 2026-11-16): 트리 규칙·서버 동기화·빈 방 초기화·정원 20·채팅 반복/쉬기(세 체험 공통)·충돌·화면 문구·입장 연결.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTreeState,TREE_RULES,ORNAMENTS,TREE_STEPS,treeStage,sanitizeTreeMsg,TREE_TEXT} from '../src/christmas/tree-state.js';
import * as L from '../src/christmas/layout.js';
import {ORNAMENT_KINDS} from '../src/christmas/props.js';
import {createRooms} from '../server/rooms.mjs';
import {createChatGuard,chatKey,CHAT_GUARD,SERVERS,serverMax,EXPERIENCE_MAX,messageAllowed,sanitizeAct,anonymousName} from '../src/multi-protocol.js';
import {createBroadcastTransport} from '../src/multi-transport.js';
import {pickRows,PICK_LABELS} from '../src/server-pick.js';
import {EXPERIENCES as HUB} from '../src/hub/experiences.js';
import {ART} from '../src/hub/hub.js';
import {collideXmas,inNorthGap} from '../src/christmas/collide.js';
import {xmasStatusView,lookOfAct,fallbackLook,cleanRoom,DEFAULT_ROOM} from '../src/christmas/multi.js';
import {limitText} from '../src/hiking-chat-ui.js';

const T0=1_000_000;
test('트리 규칙 값이 그림(layout·props)과 같다',()=>{
 assert.equal(TREE_RULES.slots,L.TREE.slots);assert.equal(TREE_RULES.starUnlock,L.STAR_UNLOCK);
 assert.deepEqual([...TREE_STEPS],[...L.TREE_LIGHT_STEPS]);assert.deepEqual([...ORNAMENTS],[...ORNAMENT_KINDS]);
 for(const n of [0,19,20,39,40,79,80,119,120])assert.equal(treeStage(n),L.treeLightStage(n),`${n}개`);
});
test('트리: 빈 자리에만, 1분 3개, 내 장식 10개, 다른 사람이 먼저 단 자리는 가까운 빈 자리 알려 줌',()=>{
 const t=createTreeState();
 assert.deepEqual(t.put('a','하나',5,'ballRed',T0),{ok:true,slot:5,kind:'ballRed',name:'하나',id:'a'});
 const taken=t.put('b','둘',5,'bell',T0);assert.equal(taken.reason,'taken');assert.ok([4,6].includes(taken.near));
 assert.equal(t.put('a','하나',6,'nope',T0).reason,'bad');assert.equal(t.put('a','하나',120,'bell',T0).reason,'bad');
 t.put('a','하나',6,'bell',T0+1000);t.put('a','하나',7,'candy',T0+2000);
 const r=t.put('a','하나',8,'gift',T0+3000);assert.equal(r.reason,'rate');assert.equal(r.wait,57);
 assert.deepEqual(t.quota('a',T0+3000),{left:0,wait:57,mine:3});
 // 1분 지나면 다시, 10개까지
 let at=T0+63000;for(const s of [8,9,10]){assert.ok(t.put('a','하나',s,'gift',at).ok);at+=10;}
 at+=61000;for(const s of [11,12,13]){assert.ok(t.put('a','하나',s,'gift',at).ok);at+=10;}
 at+=61000;assert.ok(t.put('a','하나',14,'gift',at).ok);
 assert.equal(t.put('a','하나',15,'gift',at+10).reason,'mine');assert.equal(t.mine('a'),10);
 assert.equal(t.quota('a',at+10).left,0);
});
test('트리: 되돌리기는 내 것만 60초 안, 되돌리면 1분 몫도 돌아온다',()=>{
 const t=createTreeState();
 t.put('a','하나',1,'ballRed',T0);t.put('a','하나',2,'ballRed',T0);t.put('a','하나',3,'ballRed',T0);
 assert.equal(t.undo('b',1,T0+10).reason,'undo','남의 장식');
 assert.equal(t.undo('a',1,T0+61000).reason,'undo','60초 지남');
 assert.ok(t.undo('a',2,T0+5000).ok);assert.equal(t.slot(2),null);
 assert.ok(t.put('a','하나',4,'bell',T0+6000).ok,'되돌린 몫으로 하나 더');
 assert.deepEqual(t.lastUndoable('a',T0+7000),{slot:4,at:T0+6000});
});
test('트리: 별은 40개부터 한 번, 전체 상태 주고받기(load)·초기화',()=>{
 const t=createTreeState();
 assert.equal(t.putStar('a','하나',T0).reason,'locked');
 for(let i=0;i<40;i++)t.set(i,ORNAMENTS[i%8],`사람${i}`,`p${i}`,T0);
 assert.equal(t.stage,2);
 assert.deepEqual(t.putStar('a','하나',T0),{ok:true,name:'하나',id:'a'});assert.equal(t.putStar('b','둘',T0).reason,'star');
 const snap=t.snapshot();assert.equal(snap.t,'tree');assert.equal(snap.s.length,40);assert.deepEqual(snap.star,{n:'하나'});
 const u=createTreeState();u.load(snap);assert.equal(u.count,40);assert.equal(u.star.n,'하나');assert.equal(u.slot(7).k,ORNAMENTS[7]);
 u.reset();assert.equal(u.count,0);assert.equal(u.star,null);
 assert.equal(sanitizeTreeMsg({t:'tree:set',slot:3,k:'xx'}),null);assert.equal(sanitizeTreeMsg({t:'tree:set',slot:300,k:'bell'}),null);
 assert.deepEqual(sanitizeTreeMsg({t:'tree:set',slot:3,k:'bell',n:'하나',id:'a'}),{t:'tree:set',slot:3,k:'bell',n:'하나',id:'a'});
 assert.match(TREE_TEXT.rate(12),/1분에 3개.*12초/);
});

function setup(opts={}){
 let t=T0,n=0;
 const rooms=createRooms({now:()=>t,idGen:()=>`p${++n}`,tokenGen:()=>`tok${n}`,...opts});
 const join=(name,room='눈마을-1',extra={})=>{const inbox=[];const r=rooms.join({experience:'christmas',room,name,send:s=>inbox.push(JSON.parse(s)),...extra});if(r.ok)r.client.inbox=inbox;return r.ok?r.client:r;};
 return {rooms,join,advance:ms=>{t+=ms;},get now(){return t;}};
}
test('서버: 크리스마스 광장은 정원 20(다른 체험 30은 그대로), 서버 목록 3개',()=>{
 const {rooms,join}=setup();
 const cs=Array.from({length:20},(_,i)=>join(`사람${i}`));
 assert.ok(cs.every(c=>c.room?.key==='christmas:눈마을'));assert.equal(cs[0].inbox[0].max,20);
 assert.deepEqual(join('스물하나'),{ok:false,reason:'full'});
 assert.deepEqual(rooms.serverCounts().christmas.map(s=>[s.name,s.count,s.max]),[['눈마을 광장 1서버',20,20],['눈마을 광장 2서버',0,20],['눈마을 광장 3서버',0,20]]);
 assert.equal(rooms.serverCounts().hiking[0].max,30);
 assert.equal(serverMax('christmas'),20);assert.equal(serverMax('hiking'),30);assert.equal(EXPERIENCE_MAX.christmas,20);
 assert.deepEqual(SERVERS.christmas.map(s=>s.room),['눈마을-1','눈마을-2','눈마을-3']);
 assert.equal(anonymousName('ab12cd','christmas'),'눈송이12CD');
});
test('서버: 트리 판정·중계·늦게 온 사람·빈 방 초기화',()=>{
 const s=setup({treeResetMs:5000});const {rooms,join}=s;
 const a=join('하나'),b=join('둘');a.inbox.length=b.inbox.length=0;
 rooms.message(a,{t:'tree:put',slot:3,k:'ballRed'});
 assert.deepEqual(b.inbox.at(-1),{t:'tree:set',slot:3,k:'ballRed',n:'하나',id:a.id});assert.deepEqual(a.inbox.at(-1),b.inbox.at(-1),'보낸 사람도 받음(판정 결과)');
 rooms.message(b,{t:'tree:put',slot:3,k:'bell'});
 assert.equal(b.inbox.at(-1).t,'tree:no');assert.equal(b.inbox.at(-1).reason,'taken');assert.ok(Number.isInteger(b.inbox.at(-1).near));
 assert.ok(!a.inbox.some(m=>m.t==='tree:no'),'남의 실패는 안 감');
 rooms.message(a,{t:'tree:undo',slot:3});assert.deepEqual(b.inbox.at(-1),{t:'tree:del',slot:3});
 rooms.message(b,{t:'tree:undo',slot:4});assert.equal(b.inbox.at(-1).reason,'undo');
 rooms.message(a,{t:'tree:star'});assert.equal(a.inbox.at(-1).reason,'locked');
 // 나중에 온 사람
 rooms.message(a,{t:'tree:put',slot:9,k:'gift'});
 const c=join('셋');assert.deepEqual(c.inbox.find(m=>m.t==='tree').s,[[9,'gift','하나',a.id]]);
 // 흡연장·등산은 트리 메시지를 받지 않는다
 assert.equal(messageAllowed('smoking','tree:put'),false);assert.equal(messageAllowed('hiking','tree:star'),false);assert.equal(messageAllowed('christmas','tree:put'),true);
 const sm=rooms.join({experience:'smoking',room:'옥상-1',name:'손님',send:()=>{}}).client;rooms.message(sm,{t:'tree:put',slot:1,k:'bell'});
 assert.equal(rooms.trees.has('smoking:옥상'),false);
 // 모두 나감 → 4초 뒤 다시 들어오면 그대로, 마지막으로 비고 5초 지나면 초기화
 for(const x of [a,b,c])rooms.leave(x,{keep:false});
 s.advance(4000);rooms.tick();
 const d=join('넷');assert.equal(d.inbox.find(m=>m.t==='tree').s.length,1,'잠깐 비면 유지');
 rooms.leave(d,{keep:false});s.advance(5000);rooms.tick();
 assert.equal(rooms.trees.size,0);assert.equal(rooms.stats.treeResets,1);
 const e=join('다섯');assert.deepEqual(e.inbox.find(m=>m.t==='tree'),{t:'tree',s:[],star:null},'아무도 없이 5분(시험 5초) 지나면 빈 트리');
});
test('서버: 크리스마스 act(옷·모자·목도리·꾸미는 중)는 기억해 나중에 온 사람에게',()=>{
 const {rooms,join}=setup();const a=join('하나');
 rooms.message(a,{t:'act',a:{o:'elf',hat:'antlers',sc:1,d:1,p:'sit'}});
 const b=join('둘');assert.deepEqual(b.inbox.find(m=>m.t==='act'),{t:'act',id:a.id,a:{o:'elf',hat:'antlers',sc:1,d:1}});
 assert.equal(sanitizeAct('christmas',{o:'pirate'}),null);
});

test('채팅 지킴이: 같은 말 세 번째는 막고(공백·글자 반복 정리), 1분에 3번 막히면 30초 쉬기',()=>{
 const g=createChatGuard();let t=0;
 assert.ok(g.check(t,'안녕').ok);t+=2500;assert.ok(g.check(t,'안 녕').ok);t+=2500;
 assert.deepEqual(g.check(t,'안녕녕'),{ok:false,reason:'repeat'});
 assert.equal(chatKey('ㅋㅋㅋㅋ ㅋ'),'ㅋ');assert.equal(chatKey('Hello'),'helo');
 t+=2500;assert.ok(g.check(t,'다른 말').ok,'다른 말은 됨');
 t+=100;assert.equal(g.check(t,'빨리').reason,'rate');t+=100;
 const m=g.check(t,'빨리2');assert.deepEqual(m,{ok:false,reason:'mute',wait:30},'1분 안 세 번째 막힘(repeat 1 + rate 2)');
 t+=10000;assert.deepEqual(g.check(t,'이제?'),{ok:false,reason:'mute',wait:20});
 t+=20001;assert.ok(g.check(t,'이제 돼요').ok);
 assert.deepEqual({...CHAT_GUARD},{repeat:2,strikeWindowMs:60000,strikes:3,muteMs:30000});
});
test('채팅 지킴이는 세 체험 서버에 모두: 등산·흡연장도 반복 막힘과 쉬기를 알림',()=>{
 for(const [experience,room] of [['hiking','관악산-1'],['smoking','옥상-1'],['christmas','눈마을-1']]){
  let t=T0;const rooms=createRooms({now:()=>t});const inbox=[];
  const c=rooms.join({experience,room,name:'가',send:s=>inbox.push(JSON.parse(s))}).client;
  for(let k=0;k<3;k++){rooms.message(c,{t:'c',text:'같은 말'},t);t+=2500;}
  assert.deepEqual(inbox.filter(m=>m.t==='c-limit'),[{t:'c-limit',reason:'repeat'}],experience);
  assert.equal(inbox.filter(m=>m.t==='c').length,2,experience);
 }
});
test('내 컴퓨터 모드(BroadcastChannel)도 같은 지킴이',()=>{
 class Ch{constructor(){this.onmessage=null;}postMessage(){}close(){}}
 let t=0;const tr=createBroadcastTransport('눈마을-1',Ch,{experience:'christmas',now:()=>t});const got=[];tr.onmessage(m=>got.push(m));
 for(let k=0;k<3;k++){tr.send({t:'c',id:'me',text:'메리'});t+=2500;}
 assert.deepEqual(got.map(m=>m.t==='c-limit'?m.reason:m.text),['메리','메리','repeat']);
});
test('채팅 제한 문구: 반복·쉬기(남은 초)',()=>{
 assert.equal(limitText('repeat'),'같은 말은 연속 두 번까지만 보낼 수 있어요');
 assert.equal(limitText('mute',24),'채팅을 잠깐 쉬어요 · 24초 뒤에 다시 쓸 수 있어요');
 assert.equal(limitText('rate'),'잠깐만요, 조금 천천히');
});

test('입장: 허브 카드·서버 고르기 문구·정원 20·Vite 페이지',()=>{
 const card=HUB.find(e=>e.id==='christmas');assert.equal(card.path,'christmas/');assert.ok(ART[card.art]);
 assert.equal(PICK_LABELS.christmas.solo,'혼자 둘러보기');assert.equal(PICK_LABELS.christmas.title,'눈마을 광장 서버');
 assert.deepEqual(pickRows('christmas').map(r=>[r.name,r.max]),[['눈마을 광장 1서버',20],['눈마을 광장 2서버',20],['눈마을 광장 3서버',20]]);
 assert.match(readFileSync(new URL('../vite.config.js',import.meta.url),'utf8'),/christmas:'christmas\/index\.html'/);
 assert.match(readFileSync(new URL('../christmas/index.html',import.meta.url),'utf8'),/src\/christmas\/main\.js/);
 // 서버 이미지에 트리 규칙 파일도 들어간다
 for(const f of ['../server/Dockerfile.dockerignore','../.dockerignore'])assert.match(readFileSync(new URL(f,import.meta.url),'utf8'),/!src\/christmas\/tree-state\.js/);
 assert.match(readFileSync(new URL('../server/Dockerfile',import.meta.url),'utf8'),/COPY src\/christmas\/tree-state\.js/);
 assert.equal(cleanRoom(''),DEFAULT_ROOM);
});
test('상태 칩 문구(체험설계 §3-4)',()=>{
 assert.equal(xmasStatusView({state:'online',room:'눈마을',count:12,max:20,transport:'server'}).text,'눈마을 광장 1서버 · 👥 12/20');
 assert.equal(xmasStatusView({state:'offline'}).text,'혼자 보기 · 다시 연결');
 assert.equal(xmasStatusView({state:'off'}).text,'혼자 둘러보기');
 assert.equal(xmasStatusView({state:'reconnecting'}).text,'다시 연결 중…');
 assert.deepEqual(lookOfAct({o:'elf',hat:'antlers',sc:1},'x'),{outfit:'elf',hat:'antlers',scarf:'stripe'});
 assert.deepEqual(lookOfAct(null,'abc'),fallbackLook('abc'));
});
test('충돌: 울타리 안·언덕 통로·트리·돌린 상자',()=>{
 let p=collideXmas(50,0);assert.ok(Math.hypot(p.x,p.z)<=L.BOUNDS.r-.6+1e-9);
 assert.ok(inNorthGap(0,-40));p=collideXmas(0,-45);assert.equal(p.z,-45,'언덕 쪽은 울타리 밖으로 나감');
 p=collideXmas(0,-125);assert.equal(p.z,L.BOUNDS.north+1);
 p=collideXmas(.5,.5,[{x:0,z:0,r:3.3}]);assert.ok(Math.hypot(p.x,p.z)>=3.3+.22-1e-9,'트리 밖으로');
 // 90° 돌린 4×1 상자: 세계에서는 z 방향으로 긴 벽
 const box={x:10,z:0,w:4,d:1,heading:Math.PI/2};
 p=collideXmas(10.2,1.5,[box]);assert.ok(Math.abs(p.x-10)>=.5+.22-1e-6,`옆으로 밀림 ${p.x}`);
 p=collideXmas(10,2.3,[box]);assert.deepEqual([+p.x.toFixed(6),+p.z.toFixed(6)],[10,2.3],'끝 밖은 그대로');
});
