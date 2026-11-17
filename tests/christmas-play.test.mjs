// 온라인 크리스마스 놀이(월드개발, 2026-11-16 2차): 선물 우체통·모닥불 자리·눈사람·눈싸움·썰매 규칙과 서버 판정.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGiftLimiter,parseGiftSend,cleanCardText,sanitizeGift,GIFT_RULES,GIFT_ITEMS,GIFT_INFO,giftDeniedText} from '../src/christmas/gift-state.js';
import {createSnowmanState,ballStage,coopMul,SNOWMAN_RULES,inYard,sanitizeBallRow,namesText} from '../src/christmas/snowman-state.js';
import {resolveThrow,autoAim,createAmmo,createHarassGuard,inFightYard,inWall,FIGHT} from '../src/christmas/snowfight.js';
import {createRide,SLED_RULES,runAt,defaultCourse} from '../src/christmas/sled.js';
import {createRoomPlay,XMAS_PLAY_MESSAGES} from '../src/christmas/room-play.js';
import {nearestSeat,nearFire} from '../src/christmas/campfire.js';
import {createTreeState} from '../src/christmas/tree-state.js';
import * as L from '../src/christmas/layout.js';
import {createRooms} from '../server/rooms.mjs';
import {EXPERIENCE_MESSAGES,sanitizeAct,messageAllowed} from '../src/multi-protocol.js';
import {hearGain,CAROL_LEVEL,CAROL_FIRE} from '../src/christmas/audio.js';
import {CAROLS,CAROL_DIR,carolAt,carolCredit} from '../src/christmas/carols.js';
import {statSync,existsSync} from 'node:fs';

const T0=5_000_000;
const SY=L.SNOWMAN_YARD,FY=L.SNOWBALL_YARD;

test('선물: 5분 3개·같은 사람 5분 1개·모두에게 30분 1번',()=>{
 const l=createGiftLimiter();
 assert.ok(l.check(T0,'a').ok);l.note(T0,'a');
 assert.deepEqual(l.check(T0+1000,'a'),{ok:false,reason:'same',wait:299});
 assert.ok(l.check(T0+1000,'b').ok);l.note(T0+1000,'b');
 assert.ok(l.check(T0+2000,'*').ok);l.note(T0+2000,'*');
 const r=l.check(T0+3000,'c');assert.equal(r.reason,'rate');assert.equal(r.wait,297);
 assert.ok(l.check(T0+GIFT_RULES.windowMs+10,'c').ok);
 assert.equal(l.check(T0+GIFT_RULES.windowMs+3000,'*').reason,'all');
 assert.match(giftDeniedText({reason:'all',wait:1500}),/30분에 한 번.*25분 뒤/);
});
test('선물: 보내기 모양 검사·카드 글 60자·제어 문자 제거',()=>{
 assert.equal(parseGiftSend({to:'x',item:'nope',card:'tree',text:'a'}),null);
 assert.equal(parseGiftSend({to:'x',item:'santa',card:'tree',text:'   '}),null);
 assert.deepEqual(parseGiftSend({to:'x',item:'cocoa',card:'fire',text:' 안녕‮  하세요 '}),{to:'x',item:'cocoa',card:'fire',text:'안녕 하세요'});
 assert.equal([...cleanCardText('가'.repeat(80))].length,60);
 assert.equal(GIFT_ITEMS.length,6);assert.equal(GIFT_ITEMS.filter(k=>GIFT_INFO[k].wear).length,3);
 assert.equal(sanitizeGift({g:'g1',id:'a',n:'하나',item:'antlers',card:'snowman',text:'메리'}).item,'antlers');
 assert.equal(sanitizeGift({g:'g1',id:'a',item:'beer',card:'tree'}),null); // 음주·흡연 요소 없음
});

// 판정 도구: 방 사람과 받은 메시지
function room(){
 const play=createRoomPlay({cleanText:t=>t.replace(/나쁜말/g,'***')}),members=new Map(),inbox=new Map(),all=[];
 const add=(id,name,x=0,z=0,act={})=>{members.set(id,{id,name,state:{x,y:z},act});inbox.set(id,[]);};
 const ctx={members,send:(id,m)=>{if(!members.has(id))return false;inbox.get(id).push(m);return true;},all:m=>{all.push(m);for(const a of inbox.values())a.push(m);},away:()=>false};
 return {play,members,inbox,all,add,ctx,msg:(id,m,t=T0)=>play.handle(members.get(id),m,t,ctx)};
}
test('선물 판정: 받는 사람에게만 카드, 보낸 사람 gift:ok, 모두 깃발 gift:post, 금칙어 가림',()=>{
 const R=room();R.add('a','하나');R.add('b','둘');R.add('c','셋');
 R.msg('a',{t:'gift:send',to:'b',item:'santa',card:'tree',text:'나쁜말 메리'});
 const got=R.inbox.get('b').find(m=>m.t==='gift');assert.ok(got);assert.equal(got.text,'*** 메리');assert.equal(got.n,'하나');assert.equal(got.id,'a');
 assert.ok(!R.inbox.get('c').some(m=>m.t==='gift'));
 assert.ok(R.inbox.get('a').some(m=>m.t==='gift:ok'&&m.to==='b'));
 assert.ok(R.all.some(m=>m.t==='gift:post'&&m.id==='a'));
 R.msg('a',{t:'gift:send',to:'b',item:'santa',card:'tree',text:'또'},T0+10);
 assert.equal(R.inbox.get('a').at(-1).reason,'same');
 R.msg('a',{t:'gift:send',to:'a',item:'santa',card:'tree',text:'나'},T0+20);assert.equal(R.inbox.get('a').at(-1).reason,'self');
 R.msg('a',{t:'gift:send',to:'zz',item:'santa',card:'tree',text:'없음'},T0+30);assert.equal(R.inbox.get('a').at(-1).reason,'gone');
});
test('선물 판정: 광장 모두에게 → 모두의 카드 판 최근 5장, 나중에 온 사람도 받음',()=>{
 const R=room();for(let i=0;i<7;i++)R.add(`p${i}`,`사람${i}`);
 for(let i=0;i<6;i++)R.msg(`p${i}`,{t:'gift:send',to:'*',item:'sticker',card:'snowman',text:`카드${i}`},T0+i);
 const board=R.all.filter(m=>m.t==='board').at(-1);assert.equal(board.c.length,5);assert.equal(board.c[0].text,'카드1');
 assert.ok(R.inbox.get('p6').filter(m=>m.t==='gift'&&m.all).length===6);
 const join=R.play.joinMsgs({id:'new'},T0+100);assert.ok(join.some(m=>m.t==='board'&&m.c.length===5));
});
test('선물 판정: 받을 사람이 잠깐 끊겼으면(유예) 들고 있다가 돌아오면 준다·오너먼트는 트리 몫 +1',()=>{
 const R=room();R.add('a','하나');R.ctx.away=id=>id==='b';
 R.msg('a',{t:'gift:send',to:'b',item:'ornament',card:'tree',text:'돌아오면'});
 assert.ok(R.inbox.get('a').some(m=>m.t==='gift:ok'));
 const back=R.play.joinMsgs({id:'b'},T0+30000);assert.ok(back.some(m=>m.t==='gift'&&m.text==='돌아오면'));
 assert.equal(R.play.bonusOf('b'),1);assert.ok(R.play.useBonus('b'));assert.equal(R.play.useBonus('b'),false);
 R.msg('a',{t:'gift:send',to:'b',item:'cocoa',card:'fire',text:'늦게'},T0+1_000_000);
 assert.ok(!R.play.joinMsgs({id:'b'},T0+1_000_000+GIFT_RULES.holdMs+1).some(m=>m.t==='gift')); // 유예(60초) 넘으면 버림
 assert.deepEqual(R.play.recentCards('a'),['돌아오면','늦게']);
});
test('모닥불·썰매 줄: 다른 사람이 쓰는 자리는 빼고 seat:no·sled:busy',()=>{
 const R=room();R.add('a','하나',0,0,{st:3,sl:2});R.add('b','둘');
 const r=R.play.checkAct({id:'b'},{st:3,sl:2,o:'elf'},R.ctx);
 assert.equal(r.a.st,0);assert.equal(r.a.sl,0);assert.equal(r.a.o,'elf');assert.deepEqual(r.deny.map(d=>d.t),['seat:no','sled:busy']);
 assert.deepEqual(R.play.checkAct({id:'b'},{st:4,sl:4},R.ctx).deny,[]); // 다른 자리·타는 중(4)은 겹쳐도 됨
 assert.equal(L.campfireSeats().length,8);
 const s=nearestSeat(L.CAMPFIRE.x+3,L.CAMPFIRE.z,new Set([0,1,2,3,4,5,6]));assert.equal(s.id,7);
 assert.equal(nearestSeat(0,0,new Set([0,1,2,3,4,5,6,7])),null);
 assert.ok(nearFire(L.CAMPFIRE.x+4.2,L.CAMPFIRE.z));assert.ok(!nearFire(L.CAMPFIRE.x+5,L.CAMPFIRE.z));
});

test('눈사람: 마당 안에서만·최대 6개·밀면 커짐(같이 밀면 1.5배·2배)·큼에서 멈춤',()=>{
 const s=createSnowmanState();
 assert.equal(s.make('a','하나',0,0,T0).reason,'outside');
 const ids=[];for(let i=0;i<6;i++){const r=s.make('a','하나',SY.x-4+i*1.5,SY.z,T0);assert.ok(r.ok);ids.push(r.ball.id);}
 assert.equal(s.make('a','하나',SY.x,SY.z+3,T0).reason,'full');
 const b=s.get(ids[0]),r0=b.r[0];
 s.push('a','하나',b.id,b.x+.5,b.z,T0+100,{px:b.x,pz:b.z});
 assert.ok(Math.abs(b.r[0]-(r0+.5*SNOWMAN_RULES.grow))<1e-9);
 // 둘이 밀면 1.5배
 const c=s.get(ids[2]),c0=c.r[0];s.push('a','하나',c.id,c.x,c.z+.01,T0+200,{px:c.x,pz:c.z});s.push('b','둘',c.id,c.x,c.z+.5,T0+300,{px:c.x,pz:c.z});
 assert.ok(c.r[0]-c0>.5*SNOWMAN_RULES.grow*1.49);
 assert.equal(coopMul(1),1);assert.equal(coopMul(2),1.5);assert.equal(coopMul(5),2);
 // 멀리서는 못 밂, 한 번에 0.8m까지, 마당 밖으로 안 나감
 assert.equal(s.push('a','하나',b.id,b.x+.3,b.z,T0+400,{px:b.x+5,pz:b.z}).reason,'far');
 const bx=b.x;s.push('a','하나',b.id,b.x+3,b.z,T0+500,{px:b.x,pz:b.z});assert.ok(Math.abs(b.x-bx-SNOWMAN_RULES.maxStep)<1e-9);
 for(let i=0;i<200;i++)s.push('a','하나',b.id,b.x+(Math.floor(i/6)%2?-.8:.8),b.z,T0+600+i,{px:b.x,pz:b.z}); // 마당 안에서 왔다 갔다
 assert.ok(inYard(b.x,b.z));assert.equal(b.r[0],SNOWMAN_RULES.maxR);assert.equal(ballStage(b.r[0]),2);
});
test('눈사람: 쌓기는 아래가 한 단계 이상 커야·꾸미기 눈·코 필수·완성하면 전시 8자리(다 차면 가장 오래된 자리)',()=>{
 const s=createSnowmanState();
 const big=s.make('a','하나',SY.x,SY.z,T0).ball,small=s.make('b','둘',SY.x+1,SY.z,T0).ball;
 assert.equal(s.stack('a','하나',big.id,small.id,T0).reason,'order'); // 둘 다 작음
 big.r[0]=.6;assert.equal(s.deco('a','하나',big.id,'eyes',true,T0).reason,'single');
 const st=s.stack('a','하나',big.id,small.id,T0+10);assert.ok(st.ok);assert.equal(st.removed,small.id);assert.deepEqual(big.r,[.6,.15]);
 assert.deepEqual(big.by,['하나','둘']);
 assert.equal(s.finish('a','하나',big.id,T0+20).reason,'need');
 s.deco('b','둘',big.id,'eyes',true,T0+30);s.deco('a','하나',big.id,'nose',true,T0+30);
 assert.equal(s.deco('a','하나',big.id,'eyes',false,T0+40).reason,'undo'); // 남이 붙인 것
 assert.equal(s.deco('b','둘',big.id,'eyes',false,T0+31000+30).reason,'undo'); // 30초 지남
 assert.ok(s.deco('a','하나',big.id,'nose',false,T0+50).ok);s.deco('a','하나',big.id,'nose',true,T0+60);
 const f=s.finish('c','셋',big.id,T0+70);assert.ok(f.ok);assert.equal(f.entry.slot,0);assert.deepEqual(f.entry.names,['하나','둘','셋']);
 assert.equal(namesText(f.entry),'하나·둘·셋');
 // 전시 8자리가 다 차면 가장 오래된 자리
 for(let i=1;i<9;i++){const lo=s.make('a','하나',SY.x,SY.z,T0+i*1000).ball,up=s.make('a','하나',SY.x+1,SY.z,T0+i*1000).ball;lo.r[0]=.5;s.stack('a','하나',lo.id,up.id,T0+i*1000);s.deco('a','하나',lo.id,'eyes',true,T0+i*1000);s.deco('a','하나',lo.id,'nose',true,T0+i*1000);
  const r=s.finish('a','하나',lo.id,T0+i*1000+5);assert.equal(r.replaced,i===8);if(i===8)assert.equal(r.entry.slot,0);}
 assert.equal(s.display.filter(Boolean).length,8);
});
test('눈사람: 3분 안 건드린 눈덩이는 녹음·받은 줄 검사',()=>{
 const s=createSnowmanState();const b=s.make('a','하나',SY.x,SY.z,T0).ball;
 assert.deepEqual(s.melt(T0+SNOWMAN_RULES.meltMs-1),[]);assert.deepEqual(s.melt(T0+SNOWMAN_RULES.meltMs),[b.id]);
 assert.equal(sanitizeBallRow({id:'b1',x:1,z:2,r:[2]}),null);assert.equal(sanitizeBallRow({id:'b1',x:1,z:2,r:[.3,.2,.1,.1]}),null);
 assert.deepEqual(sanitizeBallRow({id:'b1',x:1,z:2,r:[.3],p:['eyes','bomb'],n:2}).p,['eyes']);
});
test('눈사람 판정(서버): 밀기는 10Hz 묶음, 쌓기·완성은 바로 모두에게',()=>{
 const R=room();R.add('a','하나',SY.x,SY.z+1);
 R.msg('a',{t:'snow:make',x:SY.x,z:SY.z});const made=R.all.find(m=>m.t==='snow:ball');assert.ok(made);const id=made.b[0].id;
 R.msg('a',{t:'snow:make',x:SY.x,z:SY.z+30},T0);assert.equal(R.inbox.get('a').at(-1).reason,'far');
 const before=R.all.length;R.msg('a',{t:'snow:push',b:id,x:SY.x+.3,z:SY.z},T0+100);assert.equal(R.all.length,before);
 R.play.tick(T0+110,R.ctx);assert.equal(R.all.at(-1).t,'snow:ball');assert.ok(R.all.at(-1).b[0].x>SY.x);
 R.msg('a',{t:'snow:push',b:'nope',x:0,z:0},T0+200);assert.equal(R.inbox.get('a').at(-1).t,'snow:gone');
 R.play.tick(T0+SNOWMAN_RULES.meltMs+500,R.ctx);assert.ok(R.all.some(m=>m.t==='snow:gone'&&m.why==='melt'));
 assert.equal(R.play.joinMsgs({id:'z'},T0).find(m=>m.t==='snow').b.length,0);
});

test('눈싸움: 마당 안 사람만 맞고, 가장 먼저 닿는 사람·눈벽에서 멈춤',()=>{
 const me={x:FY.x-5,z:FY.z+6};
 const r=resolveThrow({...me,dx:1,dz:0,dist:10},[{id:'far',x:me.x+8,z:me.z},{id:'near',x:me.x+4,z:me.z+.2},{id:'out',x:me.x+20,z:me.z}]);
 assert.equal(r.hit,'near');assert.ok(r.d<4.2);
 // 마당 밖 사람은 선 위에 있어도 안 맞음(모닥불 쪽)
 const out=resolveThrow({x:FY.x+FY.w/2-1,z:FY.z,dx:1,dz:0,dist:14},[{id:'fire',x:L.CAMPFIRE.x,z:FY.z}]);assert.equal(out.hit,null);
 assert.ok(!inFightYard(L.CAMPFIRE.x,L.CAMPFIRE.z));
 // 눈벽: 벽 가운데를 향해 낮게(가까이) 던지면 벽에서 멈춤
 const [wx,wz]=FY.walls[0];assert.ok(inWall(wx,wz));
 const w=resolveThrow({x:wx-2.3,z:wz,dx:1,dz:0,dist:2.6},[{id:'hide',x:wx+1,z:wz}]);
 assert.equal(w.hit,null);assert.ok(w.wall);
 assert.ok(r.ms>100&&r.ms<1500);
});
test('눈싸움: 자동 조준(앞 60°·12m)·손에 3개·3초마다 1개·0.8초 간격·집중 공격 완화',()=>{
 const a=autoAim({x:FY.x,z:FY.z},0,[{id:'front',x:FY.x+1,z:FY.z-5},{id:'back',x:FY.x,z:FY.z+3}]);
 assert.equal(a.target,'front');
 assert.equal(autoAim({x:FY.x,z:FY.z},0,[{id:'side',x:FY.x+5,z:FY.z}]).target,null);
 let t=0;const am=createAmmo({now:()=>t});
 assert.ok(am.take());assert.equal(am.take(),false);t=800;assert.ok(am.take());t=1600;assert.ok(am.take());t=2400;assert.equal(am.take(),false);
 assert.equal(am.n,0);t=3000;assert.equal(am.n,1);am.pack();assert.equal(am.n,2);t=6000;assert.equal(am.n,3);
 const g=createHarassGuard();const hits=[];for(let i=0;i<7;i++)hits.push(g.hit('a','b',T0+i*1000));
 assert.deepEqual(hits,[false,false,false,false,false,true,true]);assert.equal(g.hit('a','b',T0+30000),false);
});
test('눈싸움 판정(서버): 마당 밖·0.8초 안 연타는 거절, 맞으면 모두에게 hit',()=>{
 const R=room();R.add('a','하나',FY.x-4,FY.z);R.add('b','둘',FY.x,FY.z);R.add('c','셋',L.CAMPFIRE.x,L.CAMPFIRE.z);
 R.msg('c',{t:'sb:throw',x:L.CAMPFIRE.x,z:L.CAMPFIRE.z,dx:1,dz:0,d:9});assert.equal(R.inbox.get('c').at(-1).reason,'outside');
 R.msg('a',{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:9},T0);const sb=R.all.find(m=>m.t==='sb');assert.equal(sb.hit,'b');assert.equal(sb.id,'a');
 R.msg('a',{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:9},T0+300);assert.equal(R.inbox.get('a').at(-1).reason,'gap');
 // 시작점을 멀리 속이면 서버가 아는 자리에서
 R.msg('a',{t:'sb:throw',x:FY.x+5,z:FY.z,dx:-1,dz:0,d:9},T0+1000);const s2=R.all.filter(m=>m.t==='sb').at(-1);assert.ok(Math.abs(s2.x-(FY.x-4-FIGHT.hand))<.01);
});

test('썰매: 출발대에서 멈춤 구역까지 저절로 내려가고 최고 속도는 서버 썰매 한도(14m/s) 안',()=>{
 for(const lane of [1,2,3,4]){const r=createRide({lane,start:-1.5});let t=0,max=0,ev=[];while(!r.done&&t<150){ev.push(...r.step(1/30,{}).map(e=>e.type));t+=1/30;max=Math.max(max,r.v);}
  assert.ok(r.done,`줄 ${lane} 도착`);assert.ok(t>45&&t<110,`${t}초`);assert.ok(max<=SLED_RULES.boostMax+1e-9&&max<14);assert.ok(ev.includes('end')&&ev.includes('finish'));
  const p=r.pose();assert.ok(Math.hypot(p.x-L.SLED_RUN.stop.x,p.z-L.SLED_RUN.stop.z)<L.SLED_RUN.stop.r+SLED_RULES.stopLen+1,'멈춤 구역 근처');}
 // 한쪽으로 계속 꺾으면 눈둑(bank)에 닿지만 길 밖으로 안 나가고 끝까지 간다
 const r=createRide({lane:2});let ev=[],t=0;while(!r.done&&t<900){ev.push(...r.step(1/30,{steer:1}).map(e=>e.type));t+=1/30;}
 assert.ok(ev.includes('bank'));assert.ok(Math.abs(r.off)<=r.course.widthAt(r.s)/2-SLED_RULES.edgeIn+1e-9);assert.ok(r.done);
 const c=defaultCourse();assert.ok(c.finish>=400);const a=runAt(0);assert.ok(Math.hypot(a.x-L.SLED_RUN.path[0][0],a.z-L.SLED_RUN.path[0][1])<1e-6);
});
test('서버(rooms.mjs): 크리스마스 놀이 메시지가 열려 있고 판정 결과가 방에 퍼진다',()=>{
 assert.deepEqual(XMAS_PLAY_MESSAGES.filter(t=>!messageAllowed('christmas',t)),[]);
 for(const t of XMAS_PLAY_MESSAGES){assert.equal(messageAllowed('hiking',t),false);assert.equal(messageAllowed('smoking',t),false);}
 assert.deepEqual(sanitizeAct('christmas',{st:9,sl:5,sp:'abc',wm:1,pu:1,pk:1,cc:1}),{sl:5,sp:'abc',wm:1,pu:1,pk:1,cc:1});
 let now=T0;const out=new Map();
 const rooms=createRooms({now:()=>now,chatBanned:['나쁜말']});
 const join=(name)=>{const box=[];const r=rooms.join({experience:'christmas',room:'눈마을-1',name,send:s=>box.push(JSON.parse(s))});out.set(name,box);return r.client;};
 const a=join('하나'),b=join('둘');
 rooms.message(a,{t:'gift:send',to:b.id,item:'ornament',card:'tree',text:'나쁜말 메리'});
 const g=out.get('둘').find(m=>m.t==='gift');assert.equal(g.text,'*** 메리');
 // 받은 오너먼트로 트리에 하나 더(몫과 따로), 받은 것이 없는 사람은 nobonus
 rooms.message(b,{t:'tree:put',slot:3,k:'bell',g:1});assert.ok(out.get('하나').some(m=>m.t==='tree:set'&&m.slot===3&&m.g===1));
 rooms.message(a,{t:'tree:put',slot:4,k:'bell',g:1});assert.equal(out.get('하나').at(-1).reason,'nobonus');
 // 모닥불 자리 겹침
 rooms.message(a,{t:'act',a:{o:'santa',st:2}});rooms.message(b,{t:'act',a:{o:'elf',st:2}});
 assert.ok(out.get('둘').some(m=>m.t==='seat:no'));assert.equal(rooms.clients.get(b.id).act.st,0);
 // 눈싸움: 위치를 마당에 두고 던지기
 for(const [c,x] of [[a,FY.x-4],[b,FY.x]]){now+=200;rooms.message(c,{t:'s',q:1,z:0,x,y:FY.z,h:0,v:0,f:4});}
 now+=200;rooms.message(a,{t:'sb:throw',x:FY.x-4,z:FY.z,dx:1,dz:0,d:9});
 assert.equal(out.get('둘').find(m=>m.t==='sb')?.hit,b.id);
 // 신고에 대상이 보낸 카드 글
 rooms.message(b,{t:'report',to:a.id,reason:'기타'});assert.deepEqual(rooms.reportLog.at(-1).cards,['*** 메리']);
 // 나중에 온 사람은 마당·모두의 카드 상태를 받음
 const c=join('셋');assert.ok(out.get('셋').some(m=>m.t==='snow'));void c;
});
test('서버 이미지(Dockerfile·.dockerignore)에 놀이 판정 파일이 들어간다',()=>{
 const need=['room-play.js','gift-state.js','snowman-state.js','snowfight.js','layout.js','tree-state.js'];
 const df=readFileSync('server/Dockerfile','utf8');for(const f of need)assert.ok(df.includes(`src/christmas/${f}`),f);
 for(const p of ['server/Dockerfile.dockerignore','.dockerignore']){const t=readFileSync(p,'utf8');for(const f of need)assert.ok(t.includes(`!src/christmas/${f}`),`${p} ${f}`);}
 // 판정 파일은 three를 쓰지 않는다(서버에 three가 없음)
 for(const f of need)assert.ok(!/from 'three'/.test(readFileSync(`src/christmas/${f}`,'utf8')),f);
});
test('트리: 선물 오너먼트(free)는 1분 몫·내 장식 10개와 따로',()=>{
 const t=createTreeState();for(let i=0;i<3;i++)t.put('a','하나',i,'bell',T0+i);
 assert.equal(t.put('a','하나',5,'bell',T0+10).reason,'rate');
 assert.ok(t.put('a','하나',5,'bell',T0+10,{free:true}).ok);assert.equal(t.mine('a'),3);
});
test('소리: 모닥불은 12m 밖에서 안 들림·효과음 파일은 기존 바람 소리만(캐럴은 carols.js)',()=>{
 assert.equal(hearGain(.5),1);assert.equal(hearGain(12),0);assert.ok(hearGain(6)>0&&hearGain(6)<1);
 const src=readFileSync('src/christmas/audio.js','utf8');assert.deepEqual([...new Set([...src.matchAll(/sounds\/[\w/-]+\.(?:flac|mp3|ogg|wav)/g)].map(m=>m[0]))],['sounds/ambient/wind-forest-loop.flac']);
});

test('캐럴: 소리-출처-v1 §2-4-1 1순위 8곡만·원본 파일·퍼블릭 도메인',()=>{
 const doc=readFileSync('docs/크리스마스/소리-출처-v1.md','utf8');
 const first=doc.slice(doc.indexOf('**1순위'),doc.indexOf('**2순위'));
 assert.equal(CAROLS.length,8);assert.equal(new Set(CAROLS.map(c=>c.id)).size,8);
 for(const c of CAROLS){
  assert.ok(first.includes(c.title.replace(' and His Merry Band','')),`${c.title}이 1순위 표에 있음`);
  assert.match(c.license,/Public domain/);assert.match(c.page,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(c.performer,/United States Air Force Band/);assert.ok(c.arranger.length>3);
  const f=`public/${CAROL_DIR}${c.file}`;assert.ok(existsSync(f),f);assert.ok(statSync(f).size>3e6,'원본 크기(다시 인코딩 안 함)');
  assert.ok(c.end<c.duration&&c.end>c.duration-20&&c.start>=0&&c.start<5);assert.ok(c.gain>0&&c.gain<=1);
  assert.equal(c.vocals,false);assert.ok(carolCredit(c).includes(c.title));
 }
 // 2순위·제외 곡은 쓰지 않음
 for(const bad of ['Pershing','Rockies','Singing Sergeants','Diplomats','Carol of the Bells','Raptor'])assert.ok(!CAROLS.some(c=>c.performer.includes(bad)||c.title.includes(bad)));
});
test('캐럴: 모두 같은 시계로 같은 곡·곡 끝 무음은 건너뜀',()=>{
 const total=CAROLS.reduce((s,c)=>s+c.end,0);
 assert.deepEqual(carolAt(CAROLS,0),{index:0,offset:0});
 assert.equal(carolAt(CAROLS,CAROLS[0].end+1).index,1);
 assert.deepEqual(carolAt(CAROLS,total+5),carolAt(CAROLS,5));
 assert.ok(CAROL_FIRE<CAROL_LEVEL&&CAROL_LEVEL<.55,'모닥불 최대(.55)보다 작게 깔림');
});
test('캐럴: 🎵 창에 곡마다 출처·🔊와 연동·흘려 받기(createDeck)',()=>{
 const hud=readFileSync('src/christmas/hud.js','utf8'),audio=readFileSync('src/christmas/audio.js','utf8'),main=readFileSync('src/christmas/main.js','utf8');
 assert.match(hud,/data-sheet="music"/);assert.match(hud,/CAROLS\.map/);assert.match(hud,/원래 페이지/);
 assert.match(audio,/createDeck\(ctx,carol,/);assert.doesNotMatch(audio,/decodeAudioData\([^)]*carol/i);
 assert.match(audio,/setMuted\(v\)\{[^}]*syncCarol\(\)/);assert.match(main,/carol:profile\.carol/);
});
