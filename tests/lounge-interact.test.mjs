// 흡연장 상호작용 버튼·같이 피우기 맞추기 회귀 검사(2026-11-17, docs/변경기록-2026-11-17-흡연장-상호작용-수정.md).
// ① 단추마다 처리하는 곳이 있는지(hud.js data-a·spots.js data-sp·키보드 SMOKE_KEYS), <html data-scene>에 단추가 먹히지 않는지, NPC 없는 옥상에서 G 키
// ② 서버 판정(벤치 좌판·난간 지점·자판기는 먼저 온 사람), 담배 종류·묘기·인사·옷이 상대 화면과 나중에 온 사람에게 같게 가는지
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sanitizeSmoke,sanitizeAct,ACT_SCHEMA,SMOKE_KINDS,SMOKE_TRICKS} from '../src/multi-protocol.js';
import {createRooms} from '../server/rooms.mjs';
import {checkLoungeAct,encodeLean,decodeLean,seatKey,LOUNGE_RULES} from '../src/lounge/room-rules.js';
import {actOf,newPoseState} from '../src/lounge/spots.js';
import {createLoungeMulti,smokePlan} from '../src/lounge/multi.js';
import {createBroadcastTransport} from '../src/multi-transport.js';
import {CIG_KINDS} from '../src/lounge/smoke-feel.js';
import {OUTFITS} from '../src/lounge/outfit.js';
import {SMOKE_KEYS} from '../src/lounge/input.js';

const src=f=>readFileSync(new URL(`../src/lounge/${f}`,import.meta.url),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ── ① 단추 연결
test('HUD 단추(data-a)마다 처리하는 곳이 있다',()=>{
 const hud=src('hud.js');
 const made=new Set([...hud.matchAll(/data-a="([a-z]+)"/g),...hud.matchAll(/\bb\('([a-z]+)'/g),...hud.matchAll(/\bsec\('([a-z]+)'/g)].map(m=>m[1]));
 const actKeys=new Set([...hud.slice(hud.indexOf('const act={'),hud.indexOf('// 꾹 누르는 모금 단추')).matchAll(/^\s{2}([a-z]+)\(/gm)].map(m=>m[1]));
 // 클릭 묶음의 따로 처리(emote·set·snd), 창 안(close·enter·mute·info·age·feedback), 꾹 단추(draw = pointerdown)
 // 11-18 UI 개선: 수첩 접기(fold)는 ☰ 「금연 수첩」 탭, 채팅 열기(chat)는 공통 틀 💬 단추(chatBtn)로 바뀜
 const branches=new Set(['emote','set','snd','close','enter','mute','info','age','feedback','draw']);
 for(const b of ['emote','set','snd'])assert.match(hud,new RegExp(`a==='${b}'`),`클릭 처리 ${b}`);
 assert.match(hud,/chatBtn\.addEventListener\('click'/,'💬 단추 처리');
 for(const b of ['close','enter','mute','info','age','feedback'])assert.match(hud,new RegExp(`dataset\\.a==='${b}'`),`창 단추 ${b}`);
 assert.ok(made.size>=16,`단추 종류 ${made.size}`); // 11-19: NPC 전용 함께 단추 5종(받기·괜찮아요·불 빌리기·권하기·대답 칩)을 지워 20 → 18
 const missing=[...made].filter(a=>!actKeys.has(a)&&!branches.has(a));
 assert.deepEqual(missing,[],'처리 없는 단추');
});
test('옥상 할 일 단추(data-sp)마다 처리하는 곳이 있다',()=>{
 const sp=src('spots.js');
 const made=new Set([...sp.matchAll(/data-sp="([a-zA-Z]+)"/g),...sp.matchAll(/\bbtn\('([a-zA-Z]+)'/g),...sp.matchAll(/dataset\.sp='([a-zA-Z]+)'/g)].map(m=>m[1]));
 const actKeys=new Set([...sp.slice(sp.indexOf(' const act={'),sp.indexOf(' // 자판기로 걸어가는 중이거나')).matchAll(/^\s{2}([a-zA-Z]+)[(,]/gm)].map(m=>m[1]));
 for(const k of ['scene','close','feedback','go'])assert.match(sp,new RegExp(`a==='${k}'`));
 const missing=[...made].filter(a=>!actKeys.has(a)&&!['scene','close','feedback','go'].includes(a));
 assert.deepEqual(missing,[],'처리 없는 할 일 단추');
 for(const k of ['sip','dropCan','stand'])assert.ok(made.has(k),k);
});
test('키보드 담배 키(SMOKE_KEYS)를 HUD press가 모두 받고, 키 기능마다 화면 단추가 있다',()=>{
 const hud=src('hud.js');
 for(const name of new Set(Object.values(SMOKE_KEYS))){
  const ok=name==='draw'?/name==='draw'/.test(hud):/^kind\d$/.test(name)?/\^kind\\d\$/.test(hud):['ring','nose','french'].includes(name)?hud.includes("['ring','nose','french'].includes(name)"):hud.includes(`name==='${name}'`);
  assert.ok(ok,`press(${name})`);
 }
 // 키 → 단추: draw=꾹 단추, ring·nose·french=묘기 단추, kind=담배 고르기, E=대상 위 표시, C=캔 단추, Enter=채팅
 assert.match(hud,/data-a="draw"/);for(const k of ['ring','nose','french'])assert.match(hud,new RegExp(`data-k="${k}"`));
 assert.match(hud,/b\('kind'/);
 for(const k of ['borrow','give'])assert.ok(!Object.values(SMOKE_KEYS).includes(k),`NPC 전용 키 ${k}는 지움`);
});
test('<html data-scene>이 있어도 손 단추·대상 위 표시·상황 단추가 그 단추로 처리된다(상황을 고른 뒤 「눌러도 반응 없음」)',()=>{
 const sp=src('spots.js');
 assert.doesNotMatch(sp,/closest\('\[data-scene\]'\)/,'둘레 아무 [data-scene](= <html>)이나 잡으면 안 됨');
 assert.match(sp,/closest\?\.\('button\[data-scene\]'\)/);assert.match(sp,/e\.currentTarget\.contains\(b\)/);
 // scene.js는 여전히 <html data-scene>으로 분위기를 알린다 — 그래서 위 검사가 필요
 assert.match(src('scene.js'),/root\.dataset\.scene=id/);
});
test('NPC 전용 함께 단추(불 빌리기·맞불·한 대 권하기·받기·대답 칩)와 한숨·기지개는 없다(11-19), 인사는 남는다',()=>{
 const hud=src('hud.js');
 assert.doesNotMatch(hud,/npcs\.|b\('borrow'|b\('offer'|b\('accept'|'sigh'\},|k:'stretch'/);
 assert.match(hud,/const EMOTES=\[\{k:'wave',i:'👋',t:'인사'\}\];/);
 assert.match(src('multi.js'),/if\(k!=='wave'\)return;/);
});
test('아이콘 그림은 누르는 대상이 아니다(단추가 늘 event.target)',()=>{
 assert.match(readFileSync(new URL('../src/icons/icons.css',import.meta.url),'utf8'),/svg\.ic,\.ic-emoji\{pointer-events:none\}/);
});

// ── ② 서버 판정·맞추기
test('규격: 담배 종류·묘기, act 좌판 칸·난간 지점·옷·인사(목록 밖 값은 버림)',()=>{
 assert.deepEqual([...SMOKE_KINDS].sort(),Object.keys(CIG_KINDS).sort(),'smoke-feel CIG_KINDS와 같은 목록');
 assert.deepEqual([...ACT_SCHEMA.smoking.o].sort(),Object.keys(OUTFITS).sort(),'outfit OUTFITS와 같은 목록');
 assert.deepEqual(sanitizeSmoke({state:'exhale',lit:true,kind:'cigar',k:'nose'}),{state:'exhale',lit:true,kind:'cigar',k:'nose'});
 assert.deepEqual(sanitizeSmoke({state:'out',lit:false,kind:'banana',k:'x'}),{state:'out',lit:false});
 assert.ok(SMOKE_TRICKS.includes('french'));
 assert.deepEqual(sanitizeAct('smoking',{p:'sit',b:1,s:2,o:'suit',e:'wave',en:3,lx:2000,lz:1990}),{p:'sit',b:1,s:2,o:'suit',e:'wave',en:3,lx:2000,lz:1990});
 assert.deepEqual(sanitizeAct('smoking',{p:'sit',s:5,o:'santa',e:'dance'}),{p:'sit'});
 const L=encodeLean(-2.31,4.5);assert.ok(Math.abs(decodeLean(L).x+2.31)<.03&&Math.abs(decodeLean(L).z-4.5)<.03);
});
test('내 act: 앉으면 좌판 칸, 기대면 난간 지점',()=>{
 const S=newPoseState();S.pose='sit';S.spot={index:1,slot:2};assert.deepEqual(actOf(S),{p:'sit',can:0,sip:0,b:1,s:2});
 S.pose='lean';S.spot={x:1.5,z:-3.2};const a=actOf(S);assert.equal(a.p,'lean');assert.ok(Math.abs(decodeLean(a).x-1.5)<.03);
});
test('판정 함수: 같은 좌판·가까운 난간·뽑는 중인 자판기는 늦은 사람이 못 가진다',()=>{
 const sit={p:'sit',b:0,s:0,can:0,sip:0};
 let r=checkLoungeAct(null,sit,[{p:'sit',b:0,s:0}]);assert.equal(r.a.p,'stand');assert.equal(r.a.b,undefined);assert.deepEqual(r.deny,[{t:'lounge:no',what:'seat',b:0,s:0}]);
 r=checkLoungeAct(null,sit,[{p:'sit',b:0,s:1},{p:'sit',b:1,s:0}]);assert.equal(r.a.p,'sit');assert.equal(r.deny.length,0,'옆 칸·다른 벤치는 됨');
 assert.equal(seatKey({p:'sit',b:2}),'2:0','칸이 없으면(옛 클라이언트) 가운데');
 const lean={p:'lean',...encodeLean(1,1),can:0};
 r=checkLoungeAct(null,lean,[{p:'lean',...encodeLean(1.2,1)}]);assert.equal(r.a.p,'stand');assert.equal(r.deny[0].what,'rail');
 r=checkLoungeAct(null,lean,[{p:'lean',...encodeLean(1+LOUNGE_RULES.railGap+.05,1)}]);assert.equal(r.a.p,'lean');
 r=checkLoungeAct({p:'stand',can:2},{p:'stand',can:1},[{can:1}]);assert.equal(r.a.can,2,'들고 있던 캔은 그대로');assert.equal(r.deny[0].what,'vending');
 r=checkLoungeAct({p:'stand',can:1},{p:'stand',can:1,sip:1},[{can:1}]);assert.equal(r.deny.length,0,'이미 내가 뽑는 중이면 그대로');
});

function smokingRoom(){
 let t=0,n=0;const rooms=createRooms({now:()=>t,idGen:()=>`s${++n}`,tokenGen:()=>`tok${n}`});
 const join=(name,resume=null)=>{const inbox=[];const r=rooms.join({experience:'smoking',room:'옥상-1',name,resume,send:s=>inbox.push(JSON.parse(s))});const c=r.client;c.inbox=inbox;return c;};
 return {rooms,join,step:ms=>{t+=ms;}};
}
const lastAct=(inbox,id)=>inbox.filter(m=>m.t==='act'&&m.id===id).at(-1)?.a;
test('서버: 같은 좌판을 거의 동시에 누르면 먼저 온 사람만 앉고, 모두와 나중에 온 사람에게 같은 상태',()=>{
 const {rooms,join,step}=smokingRoom();
 const A=join('하늘'),B=join('바다'),W=join('구경');
 rooms.message(A,{t:'act',a:{p:'sit',b:0,s:0,can:0,sip:0}});step(5);
 rooms.message(B,{t:'act',a:{p:'sit',b:0,s:0,can:0,sip:0}});
 assert.deepEqual(B.inbox.filter(m=>m.t==='lounge:no'),[{t:'lounge:no',what:'seat',b:0,s:0}],'늦은 사람에게만');
 assert.equal(A.inbox.some(m=>m.t==='lounge:no'),false);
 assert.equal(lastAct(W.inbox,A.id).p,'sit');assert.equal(lastAct(W.inbox,B.id).p,'stand','구경꾼 화면에서도 B는 서 있음');
 assert.equal(lastAct(A.inbox,B.id).p,'stand');
 step(100);const L=join('나중');assert.equal(lastAct(L.inbox,A.id).p,'sit');assert.equal(lastAct(L.inbox,B.id).p,'stand','나중에 온 사람도 같게');
 // 옆 칸은 앉을 수 있음
 B.inbox.length=0;rooms.message(B,{t:'act',a:{p:'sit',b:0,s:1,can:0,sip:0}});assert.equal(B.inbox.some(m=>m.t==='lounge:no'),false);assert.equal(lastAct(W.inbox,B.id).s,1);
 // A가 나가면 그 칸은 비어 다른 사람이 앉을 수 있음
 rooms.leave(A,{keep:false});const C=join('셋째');rooms.message(C,{t:'act',a:{p:'sit',b:0,s:0,can:0,sip:0}});assert.equal(C.inbox.some(m=>m.t==='lounge:no'),false);
});
test('서버: 난간 같은 지점·자판기 동시 사용도 먼저 온 사람',()=>{
 const {rooms,join}=smokingRoom();const A=join('하늘'),B=join('바다');
 rooms.message(A,{t:'act',a:{p:'lean',...encodeLean(.6,-4),can:0,sip:0}});
 rooms.message(B,{t:'act',a:{p:'lean',...encodeLean(.75,-4),can:0,sip:0}});
 assert.equal(B.inbox.filter(m=>m.t==='lounge:no')[0]?.what,'rail');assert.equal(lastAct(A.inbox,B.id).p,'stand');
 rooms.message(A,{t:'act',a:{p:'stand',can:1,sip:0}});rooms.message(B,{t:'act',a:{p:'stand',can:1,sip:0}});
 assert.equal(B.inbox.filter(m=>m.t==='lounge:no').at(-1).what,'vending');assert.equal(lastAct(A.inbox,B.id).can,0);
 rooms.message(A,{t:'act',a:{p:'stand',can:2,sip:0}});rooms.message(B,{t:'act',a:{p:'stand',can:1,sip:0}});
 assert.equal(lastAct(A.inbox,B.id).can,1,'앞사람 캔이 나온 뒤에는 뽑을 수 있음');
});
test('서버: 끊긴 사이 남이 앉은 좌판으로 돌아오면(resume) 서 있음으로 고쳐 알린다',()=>{
 const {rooms,join,step}=smokingRoom();const A=join('하늘');const W=join('구경');
 rooms.message(A,{t:'act',a:{p:'sit',b:1,s:0,can:0,sip:0}});rooms.leave(A,{keep:true});
 const B=join('바다');rooms.message(B,{t:'act',a:{p:'sit',b:1,s:0,can:0,sip:0}});assert.equal(B.inbox.some(m=>m.t==='lounge:no'),false);
 step(1000);const A2=join('하늘',A.token);assert.equal(A2.id,A.id,'같은 ID로 돌아옴');
 assert.equal(A2.inbox.filter(m=>m.t==='lounge:no')[0]?.what,'seat');assert.equal(lastAct(W.inbox,A.id).p,'stand');
});
test('서버: 담배 종류·묘기를 중계하고 나중에 온 사람에게도 마지막 상태로 준다',()=>{
 const {rooms,join}=smokingRoom();const A=join('하늘'),B=join('바다');
 rooms.message(A,{t:'lounge:smoke',state:'exhale',lit:true,kind:'cigar',k:'french'});
 assert.deepEqual(B.inbox.filter(m=>m.t==='lounge:smoke').at(-1),{t:'lounge:smoke',id:A.id,state:'exhale',lit:true,kind:'cigar',k:'french'});
 const L=join('나중');assert.equal(L.inbox.find(m=>m.t==='lounge:smoke'&&m.id===A.id)?.kind,'cigar');
});
test('받는 쪽 담배 그리기: 종류로 꺼내고, 내뿜기 묘기를 따라 한다',()=>{
 assert.deepEqual(smokePlan('idle',{state:'out',lit:false,kind:'menthol'}),[['start','menthol']]);
 assert.deepEqual(smokePlan('idle',{state:'smoking',lit:true,kind:'cigar'}),[['start','cigar'],['light']]);
 assert.deepEqual(smokePlan('smoking',{state:'exhale',lit:true,k:'nose'}),[['trick','nose']]);
 assert.deepEqual(smokePlan('inhale',{state:'exhale',lit:true,k:'french'}),[['trick','french']]);
 assert.deepEqual(smokePlan('exhale',{state:'trick',lit:true,k:'ring'}),[['trick','ring']]);
 assert.deepEqual(smokePlan('smoking',{state:'exhale',lit:true}),[['puff']],'묘기 없으면 예전 그대로');
});

// 같은 프로세스 BroadcastChannel(내 컴퓨터 모드)로 흡연장 연결 모듈 두세 개
const rooftop={spots:{benches:[{x:0,z:0,heading:0,seat:{x:0,z:-.2,y:.44,heading:0}}]}};
function world(nick,outfit='shirt'){
 const win=new EventTarget(),clock={t:0},created=[],denied=[];
 const ctx={player:{id:'me',x:0,z:0,heading:0,speed:0,outfit},profile:{nickname:nick},mobile:false,smoker:{status:()=>({state:'idle',lit:false,kind:'mild'})},world:{add(){},remove(){}},rooftop,
  createAvatar:async o=>{const a={...o,x:0,z:0,heading:0,root:{visible:true},extra:[],place(){},update(){},headTop(){},setOutfit(k){a.outfit=k;}};created.push(a);return a;},
  createSmoker:()=>({state:'idle',status:()=>({state:'idle',lit:false}),apply(){},remove(){}})};
 const S=newPoseState(),spots={get pose(){return S.pose;},act:()=>actOf(S),denied:w=>{denied.push(w);return true;}};
 return {win,clock,ctx,created,S,spots,denied};
}
const mount=(w,makeTransport=o=>createBroadcastTransport(o.room,undefined,{experience:'smoking'}))=>createLoungeMulti({ctx:w.ctx,spots:w.spots,win:w.win,search:'',now:()=>w.clock.t,heartbeat:()=>({stop(){}}),makeTransport});
async function tick(ws,steps=1){for(let i=0;i<steps;i++){for(const w of ws){w.clock.t+=.12;w.multi.update(.12);}await sleep(15);}}

test('연결: 인사는 채팅이 아니라 act로 가서 같은 인사를 거듭 눌러도 상대에게 매번 보이고, 나중에 온 사람에게 지난 인사가 다시 뜨지 않는다',async t=>{
 const A=world('하늘'),B=world('바다');A.multi=mount(A);B.multi=mount(B);let C=null;t.after(()=>{A.multi.dispose();B.multi.dispose();C?.multi.dispose();});
 const got=[];B.win.addEventListener('lounge:remote-emote',e=>got.push(e.detail));const chats=[];B.win.addEventListener('lounge:chat',e=>chats.push(e.detail));
 A.multi.join({room:'인사시험'});B.multi.join({room:'인사시험'});await tick([A,B],6);
 for(let i=0;i<3;i++){A.win.dispatchEvent(new CustomEvent('lounge:emote',{detail:{emote:'wave'}}));A.win.dispatchEvent(new CustomEvent('lounge:chat',{detail:{id:'me',name:'하늘',text:'인사',emote:'wave'}}));await tick([A,B],3);}
 assert.equal(got.length,3,'세 번 다 보임');assert.equal(got[0].emote,'wave');assert.equal(got[0].id,A.multi.id);
 assert.equal(chats.filter(c=>c.remote).length,0,'채팅 c로는 안 보냄');
 const late=[];C=world('구름');C.win.addEventListener('lounge:remote-emote',e=>late.push(e));C.multi=mount(C);C.multi.join({room:'인사시험'});await tick([A,B,C],8);
 assert.equal(late.length,0,'나중에 온 사람에게 지난 인사는 안 뜸');
 A.win.dispatchEvent(new CustomEvent('lounge:emote',{detail:{emote:'sigh'}}));await tick([A,B,C],3);assert.equal(late.length,0,'한숨은 지운 동작이라 보내지 않음(11-19)');
 A.win.dispatchEvent(new CustomEvent('lounge:emote',{detail:{emote:'wave'}}));await tick([A,B,C],3);assert.equal(late.length,1);assert.equal(late[0].detail.emote,'wave');
});
test('연결: 고른 옷이 상대 몸에 입혀지고, 바꾸면 따라 바뀐다',async t=>{
 const A=world('하늘','padding'),B=world('바다');A.multi=mount(A);B.multi=mount(B);t.after(()=>{A.multi.dispose();B.multi.dispose();});
 A.multi.join({room:'옷시험'});B.multi.join({room:'옷시험'});await tick([A,B],10);
 const body=()=>B.created.find(a=>a.id===`p:${A.multi.id}`);
 assert.equal(B.multi.status().people.find(p=>p.id===A.multi.id)?.act?.o,'padding');assert.equal(body()?.outfit,'padding');
 A.ctx.player.outfit='suit';await tick([A,B],4);assert.equal(body().outfit,'suit');
});
test('연결: 다른 사람이 앉은 좌판 칸·뽑는 중인 자판기를 안다, 서버의 lounge:no를 spots.denied로 넘긴다',async t=>{
 const A=world('하늘'),B=world('바다');A.multi=mount(A);B.multi=mount(B);t.after(()=>{A.multi.dispose();B.multi.dispose();});
 A.multi.join({room:'자리시험'});B.multi.join({room:'자리시험'});await tick([A,B],6);
 A.S.pose='sit';A.S.spot={index:0,slot:1};A.S.can.drop={t:0};await tick([A,B],4);
 assert.equal(B.multi.seatTaken(0,1),true);assert.equal(B.multi.seatTaken(0,0),false);assert.equal(B.multi.vendingBusy(),true);
 // 서버 흉내 전송: lounge:no를 받으면 내 자리를 내려놓는다
 let feed=null;const D=world('넷째');D.multi=mount(D,()=>({kind:'local',send(){},onmessage(f){feed=f;return ()=>{};},close(){}}));t.after(()=>D.multi.dispose());
 D.multi.join({room:'자리시험'});feed({t:'lounge:no',what:'seat',b:0,s:0});assert.deepEqual(D.denied,['seat']);
});
test('연결: 담배 종류와 묘기를 실어 보낸다',async t=>{
 const sent=[];const A=world('하늘');A.multi=mount(A,()=>({kind:'local',send:m=>sent.push(m),onmessage(){return ()=>{};},close(){}}));t.after(()=>A.multi.dispose());
 A.multi.join({room:'담배시험'});
 const fire=d=>A.win.dispatchEvent(new CustomEvent('lounge:smoke',{detail:{id:'me',isPlayer:true,...d}}));
 fire({state:'out',lit:false,kind:'cigar',trick:null});fire({state:'exhale',lit:true,kind:'cigar',trick:'nose'});fire({state:'inhale',lit:true,kind:'cigar',trick:'nose'});
 const sm=sent.filter(m=>m.t==='lounge:smoke'&&m.state!=='idle'); // 들어올 때 지금 상태(idle)도 한 번 보낸다
 assert.deepEqual(sm.map(m=>[m.state,m.kind,m.k]),[['out','cigar',undefined],['exhale','cigar','nose'],['inhale','cigar',undefined]],'들이마실 때는 지난 묘기를 싣지 않음');
});
