// 온라인 인형뽑기 게임 규칙·연결 시험(월드개발, 2026-11-23): 코인 매일 지급·한 판 값·잡기 판정·보장·도감·저장 정리,
// 같은 가게 손님 규격(act claw)·서버가 인형뽑기 방을 받고 act를 중계하는지, 허브 카드·입장, 공개판에 손님 인형이 없는지.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLAW_TUNING as T,seoulDate,msToNextGrant,freshState,sanitizeState,grantDaily,grantedToday,canPlay,spendCoin,recordResult,rulesFor,pityLeft,pityOn,kindOf,
 judgeTimer,fmtTimer,judgeKey,keyMissText,timerDiffText,encodeClawPos,decodeClawPos,encodeKeyPos,decodeKeyPos,KIND_CODE,KIND_OF,ACT_PHASES,dexCount} from '../src/claw/claw-rules.js';
import {geomFrom,createClawSim,runDrop,BODY_TYPES,PLUSH_BODY} from '../src/claw/claw-physics.js';
import {CLAW} from '../src/claw/claw-machine-art.js';
import {KEY} from '../src/claw/claw-machines-more.js';
import {plushSize} from '../src/claw/claw-plush.js';
import {PLUSH,MACHINES} from '../src/claw/claw-palette.js';
import {clawCatalog,resolvePool} from '../src/claw/claw-guest.js';
import {sanitizeAct,EXPERIENCES,parseExperience,messageAllowed,SERVERS,findServer,anonymousName,ACT_SCHEMA} from '../src/multi-protocol.js';
import {createRooms} from '../server/rooms.mjs';
import {EXPERIENCES as HUB_EXP,experienceHref} from '../src/hub/experiences.js';
import {MAP_POS} from '../src/hub/hub.js';
import {ART} from '../src/hub/art.js';
import {hasIcon} from '../src/icons/icon.js';
import {PICK_LABELS,createServerPick} from '../src/server-pick.js';
import {lastEntry} from '../src/entry.js';
import {inviteText,inviteUrl} from '../src/invite.js';
import {clawStatusView,multiParams} from '../src/claw/claw-multi.js';

const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const KST=Date.UTC(2026,10,23,15,0,0); // 서울 11-24 0시

test('서울 날짜·다음 지급까지 남은 시간', ()=>{
 assert.equal(seoulDate(KST-1000),'2026-11-23');assert.equal(seoulDate(KST),'2026-11-24');
 assert.equal(msToNextGrant(KST-60000),60000);assert.equal(msToNextGrant(KST),24*3600e3);
});
test('무료 코인: 서울 하루 한 번 +10, 상한 30, 이미 받았으면 null', ()=>{
 const s=freshState();
 assert.equal(grantDaily(s,KST-5000),T.coin.daily);assert.equal(s.coins,10);assert.ok(grantedToday(s,KST-5000));
 assert.equal(grantDaily(s,KST-4000),null,'같은 날 두 번 안 줌');
 assert.equal(grantDaily(s,KST+1000),10);assert.equal(s.coins,20,'서울 0시 지나면 다시');
 s.coins=25;assert.equal(grantDaily(s,KST+1000+86400e3),5);assert.equal(s.coins,T.coin.cap,'상한까지만');
 s.coins=30;assert.equal(grantDaily(s,KST+1000+2*86400e3),0);assert.equal(s.coins,30);
 assert.match(s.log.at(-1).text,/30개라 더 못 받았어요/);assert.ok(s.log.length<=T.log);
});
test('한 판 값: 코인 1개, 없으면 못 함(사는 길 없음)', ()=>{
 const s=freshState();assert.equal(canPlay(s),false);assert.equal(spendCoin(s,'forest'),false);assert.equal(s.plays,0);
 s.coins=1;assert.ok(spendCoin(s,'forest',1));assert.equal(s.coins,0);assert.equal(s.plays,1);assert.equal(s.log.at(-1).d,-1);
 const src=read('src/claw/claw-hud.js')+read('src/claw/main.js');
 assert.doesNotMatch(src,/구매|결제|충전|buy|purchase/i,'코인을 사는 단추·말이 없다');
});
test('기계 짝: 숲속 = 집게(물리)·도시 = 타이머·별빛 = 열쇠(설계 v3)', ()=>{
 assert.deepEqual(MACHINES.map(m=>kindOf(m.id)),['claw','timer','key']);
});
test('타이머 판정 표(설계 v3 §7-1): 화면 숫자로만, 0.01초 아래 버림', ()=>{
 const t=ms=>{const j=judgeTimer(ms);return [j.shown,j.r];};
 assert.deepEqual(t(9999),['09.99','near']);assert.deepEqual(t(10000),['10.00','win']);assert.deepEqual(t(10009),['10.00','win']);
 assert.deepEqual(t(10010),['10.01','near']);assert.deepEqual(t(10100),['10.10','near']);assert.deepEqual(t(10110),['10.11','miss']);assert.deepEqual(t(9899),['09.89','miss']);
 assert.equal(judgeTimer(15000).r,'miss','15.00 넘김');
 // 0~15초 1ms 간격 전체: 성공 ⇔ 화면 10.00, 숫자는 늘 두 자리.두 자리
 for(let ms=0;ms<=15000;ms++){const j=judgeTimer(ms);assert.match(j.shown,/^\d\d\.\d\d$/);if((j.r==='win')!==(j.shown==='10.00'))assert.fail(`${ms} ${j.shown} ${j.r}`);}
 assert.equal(fmtTimer(9876.9),'09.87');assert.equal(timerDiffText(.03),'+0.03초 늦었어요');assert.equal(timerDiffText(-1.42),'1.42초 빨랐어요');
});
test('열쇠 판정(설계 v3 §7-3): 구멍 가운데 성공·0.2칸 아까움·0.5칸 실패·희귀 칸은 작은 구멍·보장은 넓어짐', ()=>{
 const c=T.key,hole=(i,j)=>[i+.5,j*c.cellH+c.holeY];
 assert.equal(judgeKey(...hole(1,0)).r,'win');
 const [x,y]=hole(2,1);assert.equal(judgeKey(x+.2,y).r,'near');assert.equal(judgeKey(x+.5,y).r,'miss');
 assert.equal(judgeKey(x+.1,y,c,()=>true).r,'near','희귀 칸 0.08');assert.equal(judgeKey(x+.1,y,c,()=>false).r,'win');
 assert.equal(judgeKey(x+.17,y,c,()=>false,true).r,'win','보장 +0.05');
 assert.equal(judgeKey(1.5,-.3).r,'miss','칸 아래');assert.match(keyMissText(judgeKey(x+.5,y)),/왼쪽/);
 // 그림 좌표 = 판정 좌표(월드아트 KEY)
 assert.equal(KEY.cols,c.cols);assert.equal(KEY.rows,c.rows);assert.equal(KEY.cellH,c.cellH);assert.equal(KEY.holeY,c.holeY);
});
test('집게 물리: 기계 치수에서 만든 상자·구멍, 인형 8종 몸, 판이 끝나고 결과가 나옴', ()=>{
 const g=geomFrom(CLAW);
 assert.ok(g.CHUTE.x1<0&&g.CHUTE.z0>0,'구멍은 왼쪽 앞');assert.ok(Math.abs(g.HOME.x-CLAW.home[0]*10)<1e-9);assert.ok(g.RANGE.x1<g.BOX.x1);
 for(const p of PLUSH)assert.ok(BODY_TYPES[PLUSH_BODY[p.id]],p.id);
 const sim=createClawSim({geom:g,ids:['squirrel','hare','magpie','dongdong'],sizeOf:plushSize,seed:3,count:T.claw.dolls,power:T.claw.power});
 assert.equal(sim.left(),T.claw.dolls,'쌓을 때 구멍에 빠진 인형 없음');
 for(const D of sim.dolls)assert.ok(D.cy>-.5&&Math.abs(D.cx)<g.BOX.x1&&D.cz<g.BOX.z1+.1,'상자 안');
 const top=sim.dolls.filter(d=>!d.gone).sort((a,b)=>b.cy-a.cy)[0];
 const r=runDrop(sim,top.cx,top.cz);assert.equal(sim.claw.state,'done');assert.ok(Array.isArray(r.won));
 // 같은 씨앗 = 같은 더미
 const a=createClawSim({geom:g,ids:['cat'],sizeOf:plushSize,seed:9,count:6}),b=createClawSim({geom:g,ids:['cat'],sizeOf:plushSize,seed:9,count:6});
 assert.deepEqual(a.dolls.map(d=>d.cx.toFixed(4)),b.dolls.map(d=>d.cx.toFixed(4)));
});
test('보장: 같은 기계 5번 연달아 실패 → 다음 판 도움(집게 힘센 집게·열쇠 넓은 구멍), 타이머는 기본 끔', ()=>{
 const s=freshState();for(let i=0;i<T.pity.after;i++)recordResult(s,'forest',{kind:'miss'});
 assert.equal(pityLeft(s,'forest'),0);assert.equal(pityLeft(s,'star'),T.pity.after,'기계마다 따로');assert.equal(pityLeft(s,'city'),null,'타이머 보장 끔');
 assert.ok(pityOn('claw')&&pityOn('key')&&!pityOn('timer'));
 const rec=recordResult(s,'forest',{kind:'win',id:'squirrel'},KST);assert.ok(rec.isNew);assert.equal(s.pity.forest,0);assert.equal(s.dex.squirrel.first,'2026-11-24');assert.equal(s.dex.squirrel.machine,'forest');
 assert.deepEqual(recordResult(s,'city',{kind:'win',id:'squirrel'}),{isNew:false,count:2});assert.equal(dexCount(s),1);
 recordResult(s,'city',{kind:'near',id:null});assert.equal(s.pity.city,1,'아까움도 실패로 셈');
});
test('규칙 안내: 조절값에서 만든 글(값을 바꾸면 글도 바뀜)', ()=>{
 const t=rulesFor('city',MACHINES[1].pool);assert.equal(t.kind,'timer');assert.ok(t.lines.some(l=>/딱 10\.00일 때만 성공/.test(l)));assert.ok(t.lines.some(l=>/9\.90~10\.10/.test(l)));assert.equal(t.pity,'');
 const t2=rulesFor('city',MACHINES[1].pool,{...T,timer:{...T.timer,okWinSec:.05,pityWinSec:.02}});assert.ok(t2.lines.some(l=>/9\.95~10\.05에 멈추면 성공/.test(l)));assert.match(t2.pity,/0\.02초/);
 assert.match(rulesFor('star',MACHINES[2].cells).lines.join(' '),/0\.14칸.*0\.08칸/);assert.match(rulesFor('forest',MACHINES[0].pool).pity,/힘센 집게/);
 for(const M of MACHINES)assert.match(rulesFor(M.id,M.pool).note,/사는 곳·바꾸는 곳은 없어요/);
});
test('저장 정리: 이상한 값·모르는 인형(공개판의 손님 인형)·잘못된 기계는 버림', ()=>{
 const raw={coins:9999,lastGrant:'어제',plays:3,dex:{cat:{n:2,first:'2026-11-23',machine:'city'},'guest-1':{n:1},nope:{n:1},hare:{n:0}},pity:{forest:3,zzz:2},log:[{at:1,text:'a'},{x:1}],seenTip:true};
 const s=sanitizeState(raw);
 assert.equal(s.coins,0);assert.equal(s.lastGrant,null);assert.equal(s.plays,3);assert.deepEqual(Object.keys(s.dex),['cat']);assert.deepEqual(s.pity,{forest:3});assert.equal(s.log.length,1);assert.ok(s.seenTip);
 // 개발용(손님 인형이 들어온 화면)에서는 손님 칸도 남는다
 assert.ok(sanitizeState(raw,{isKnown:id=>id==='guest-1'||id==='cat'}).dex['guest-1']);
 assert.deepEqual(sanitizeState('x'),freshState());
});
test('공개판 도감: 우리 인형 8칸만, 손님 자리는 우리 인형으로 바뀜(다른 회사 캐릭터 이름·파일 없음)', ()=>{
 assert.deepEqual(clawCatalog().map(c=>c.id),PLUSH.map(p=>p.id));
 for(const M of MACHINES)for(const id of resolvePool(M.cells??M.pool))assert.ok(PLUSH.some(p=>p.id===id),`${M.id} ${id}`);
 const src=['src/claw/main.js','src/claw/claw-hud.js','src/claw/claw-play.js','src/claw/claw-rules.js','src/claw/claw-multi.js','src/claw/claw-physics.js','claw/index.html'].map(read).join('\n');
 assert.doesNotMatch(src,/치이카와|chiikawa|ちいかわ|하치와레|우사기/i);
 // 비공개 자료 읽기는 VITE_CLAW_PRIVATE=1일 때만(빌드에서 빠짐)
 assert.match(read('src/claw/claw-guest.js'),/VITE_CLAW_PRIVATE!=='1'\)return \[\]/);
 assert.match(read('.gitignore'),/^private\/$/m);
});
test('같은 가게 손님 규격: claw 체험·위치/채팅/act만·1서버·익명 이름', ()=>{
 assert.ok(EXPERIENCES.includes('claw'));assert.equal(parseExperience('claw'),'claw');
 for(const t of ['s','c','act','j','b','report'])assert.ok(messageAllowed('claw',t),t);
 for(const t of ['tree:put','lounge:smoke','pair:offer','lk-hang','g'])assert.equal(messageAllowed('claw',t),false,t);
 assert.deepEqual(SERVERS.claw.map(s=>s.id),['1']);assert.equal(findServer('claw','인형가게').id,'1');assert.equal(findServer('claw','인형가게-1').name,'인형가게 1서버');
 assert.match(anonymousName('ab12cd','claw'),/^뽑기손님[0-9A-Z]{4}$/);
 assert.deepEqual(sanitizeAct('claw',{m:2,ph:'drop',cx:encodeClawPos(.2),cz:encodeClawPos(-.28),r:'dongdong-santa',k:KIND_CODE.win,n:7,v:1000,o:'santa'}),{m:2,ph:'drop',cx:70,cz:22,r:'dongdong-santa',k:1,n:7,v:1000});
 {const [a,b]=decodeKeyPos(...encodeKeyPos(2.5,1.72));assert.ok(Math.abs(a-2.5)<1e-9&&Math.abs(b-1.72)<1e-9);}
 assert.equal(sanitizeAct('claw',{m:9,ph:'fly',r:'<b>'}),null);
 assert.deepEqual(ACT_SCHEMA.claw.ph,ACT_PHASES);assert.equal(KIND_OF[KIND_CODE.near],'near');
 assert.ok(Math.abs(decodeClawPos(encodeClawPos(-.33))+.33)<.006);assert.equal(encodeClawPos(9),100);
});
test('서버: 인형가게 방에 들어가고 act(집게 자리·결과)를 같은 가게에만 중계·기억', ()=>{
 let t=1e6,n=0;const rooms=createRooms({now:()=>t,idGen:()=>`p${++n}`,tokenGen:()=>`tok${n}`,reports:{append(){}}});
 const join=(name,room,exp)=>{const inbox=[];const r=rooms.join({room,name,experience:exp,send:s=>inbox.push(JSON.parse(s))});r.client.inbox=inbox;return r.client;};
 const a=join('가','인형가게-1','claw'),b=join('나','인형가게-1','claw'),x=join('다','인형가게-1','christmas');
 assert.equal(a.room.key,'claw:인형가게');assert.equal(x.room.key,'christmas:인형가게','다른 체험과 섞이지 않음');
 rooms.message(a,{t:'act',a:{m:1,ph:'play',cx:40,cz:60,r:'',k:0,n:1}});
 assert.deepEqual(b.inbox.filter(m=>m.t==='act').at(-1),{t:'act',id:a.id,a:{m:1,ph:'play',cx:40,cz:60,r:'',k:0,n:1}});
 assert.equal(x.inbox.filter(m=>m.t==='act').length,0);
 const c=join('라','인형가게-1','claw');assert.ok(c.inbox.some(m=>m.t==='act'&&m.id===a.id&&m.a.ph==='play'),'나중에 온 손님도 지금 뽑는 모습');
 rooms.message(a,{t:'tree:put',slot:1,k:'ballRed'});assert.equal(rooms.stats.tree??0,0,'다른 체험 메시지는 버림');
 const cnt=rooms.serverCounts().claw;assert.deepEqual(cnt,[{id:'1',name:'인형가게 1서버',count:3,max:30}]);
});
test('허브 카드·서버 창·친구 부르기·입장: 인형뽑기 한 줄', ()=>{
 const e=HUB_EXP.find(x=>x.id==='claw');assert.ok(e);assert.equal(experienceHref(e,'/ai-office-world/'),'/ai-office-world/claw/');
 assert.ok(ART[e.art]);assert.ok(MAP_POS.claw);assert.ok(hasIcon(e.icon));for(const [ic] of e.feats)assert.ok(hasIcon(ic),ic);
 assert.equal(e.record({getItem:()=>JSON.stringify({dex:{cat:{n:1},hare:{n:2}}})}),'도감 2종');assert.equal(e.record({getItem:()=>null}),null);
 assert.equal(PICK_LABELS.claw.solo,'혼자 뽑기');
 assert.equal(inviteText('claw','인형가게-1'),'나 지금 온라인 인형뽑기 인형가게 1서버! 설치 없이 바로 들어와');
 assert.match(inviteUrl('https://engchoon.github.io/ai-office-world/claw/?x=1',{exp:'claw',room:'인형가게'}),/claw\/\?multi=%EC%9D%B8%ED%98%95%EA%B0%80%EA%B2%8C-1&utm_source=invite/);
 const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
 const ls=mem(),p=createServerPick({experience:'claw',serverUrl:null,storage:ls,doc:null,fetchImpl:null});
 return p.open({closable:false}).then(()=>{p.join('1');assert.deepEqual(lastEntry('claw',ls),{server:'1'});});
});
test('상태 알약 글·주소 옵션', ()=>{
 assert.equal(clawStatusView({}).text,'혼자 뽑기');
 assert.equal(clawStatusView({state:'online',transport:'server',room:'인형가게',count:3,max:30}).text,'인형가게 1서버 · 👥 3/30');
 assert.match(clawStatusView({state:'reconnecting'}).sub,/혼자 뽑기는 계속/);
 assert.deepEqual(multiParams('?multi=인형가게-1&name=동동','') .room,'인형가게-1');
});
test('화면 규칙: 모든 조작이 화면 단추로(키는 덧붙임)·일시정지 없음·알림/카드가 HUD 위(z 50·55)', ()=>{
 const hud=read('src/claw/claw-hud.js'),css=read('src/claw/claw-hud.css');
 for(const d of ['up','down','left','right'])assert.match(hud,new RegExp(`data-dir="${d}"`));
 for(const id of ['press','play','rules','run','side'])assert.match(hud,new RegExp(`id:'${id}'`));
 assert.match(hud,/act\.bigDown\?\.\(e\.timeStamp\)/,'타이머는 누른 순간 시각');
 assert.match(hud,/kh-quit/);assert.match(hud,/data-go=/);assert.match(hud,/data-c="again"/);
 assert.doesNotMatch(hud+read('src/claw/main.js'),/일시정지|pause/i);
 assert.match(css,/\.kh-toast\{[^}]*z-index:50/);assert.match(css,/\.kh-card\{[^}]*z-index:55/);
 assert.match(css,/\.kh-dir\{[^}]*touch-action:none/);assert.match(css,/--kp:60px/);assert.match(css,/--kp:56px/);
});
