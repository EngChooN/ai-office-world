// 허브 개선(11-17): 공용 소리·설정, 허브 → 체험 서버 넘기기, 서버 상태(켜짐·확인 중·꺼짐), 화면 모양 고르기.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHARED_KEY,SHARED_DEFAULT,loadShared,saveShared,normalizeShared,legacySeed,volumeGain} from '../src/shared-settings.js';
import {HANDOFF_KEY,HANDOFF_TTL_MS,writeHubPick,takeHubPick,applyHubPick} from '../src/hub/handoff.js';
import {hubServerView,bestServer,hubTotal,createHubServers} from '../src/hub/hub-servers.js';
import {layoutFor,pickHubTime,statusHTML,serverListHTML,enterHTML,MAP_POS} from '../src/hub/hub.js';
import {EXPERIENCES,NEXT_SLOT} from '../src/hub/experiences.js';
import {ART} from '../src/hub/art.js';
import {dongdong} from '../src/hub/dongdong.js';
import {hasIcon} from '../src/icons/icon.js';
import {createServerPick} from '../src/server-pick.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const mem=(init={})=>{const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
const health=(o={})=>({total:o.total??40,servers:{hiking:[{id:'1',count:12,max:30},{id:'2',count:30,max:30},{id:'3',count:3,max:30}],
 smoking:[{id:'1',count:0,max:30},{id:'2',count:0,max:30},{id:'3',count:0,max:30}],christmas:[{id:'1',count:18,max:20},{id:'2',count:7,max:20},{id:'3',count:0,max:20}],...(o.servers??{})}});

// ── 공용 소리·설정
test('공용 설정: 저장된 적이 없으면 기본값 + has false, 저장하면 has true', ()=>{
 const st=mem();
 assert.deepEqual(loadShared(st),{...SHARED_DEFAULT,has:false});
 const v=saveShared({sound:false},st,1000);
 assert.equal(v.sound,false);assert.equal(v.has,true);
 assert.deepEqual(JSON.parse(st.getItem(SHARED_KEY)),{sound:false,volume:.7,music:true,hubTime:'auto',at:1000});
 assert.equal(loadShared(st).sound,false);assert.equal(loadShared(st).has,true);
});
test('공용 설정: 이상한 값은 고쳐 읽고, 저장소가 막혀도 멈추지 않는다', ()=>{
 assert.deepEqual(normalizeShared({sound:'yes',volume:9,music:0,hubTime:'noon'}),{sound:true,volume:1,music:true,hubTime:'auto'});
 assert.equal(normalizeShared({volume:-1}).volume,0);
 const broken={getItem(){throw new Error('x');},setItem(){throw new Error('x');}};
 assert.equal(loadShared(broken).has,false);
 assert.equal(saveShared({sound:false},broken).sound,false);
 const bad=mem({[SHARED_KEY]:'{깨짐'});assert.deepEqual(loadShared(bad),{...SHARED_DEFAULT,has:true});
});
test('공용 설정이 처음 생길 때 체험별 옛 값(등산 소리·크기, 크리스마스 캐럴)을 이어 받는다', ()=>{
 const st=mem({'gwanak-hiking:sound:v1':'false','gwanak-hiking:ambient-volume:v1':'0.4','xmas-world:v1':JSON.stringify({sound:true,carol:false})});
 assert.deepEqual(legacySeed(st),{sound:false,volume:.4,music:false});
 const v=saveShared({hubTime:'night'},st);
 assert.deepEqual({sound:v.sound,volume:v.volume,music:v.music,hubTime:v.hubTime},{sound:false,volume:.4,music:false,hubTime:'night'});
 // 등산 값이 없으면 크리스마스 → 흡연장 순
 assert.equal(legacySeed(mem({'online-smoking':JSON.stringify({muted:true})})).sound,false);
 assert.deepEqual(legacySeed(mem()),{});
});
test('흡연장·크리스마스 크기 배수: 기본 0.7 = 예전 크기(1배)', ()=>{
 assert.equal(volumeGain(.7),1);assert.equal(volumeGain(0),0);assert.ok(Math.abs(volumeGain(1)-1/.7)<1e-9);assert.equal(volumeGain('x'),1);
});
test('세 체험이 공용 설정을 읽고 바꿀 때 같이 쓴다', ()=>{
 const h=read('src/main.js')+read('src/hiking-body.js'),   // 등산 소리 설정은 공통 본체 부품(통합 6단계)
 l=read('src/lounge/main.js'),x=read('src/christmas/main.js');
 assert.match(h,/sharedSound\.has\)soundEnabled=sharedSound\.sound/);assert.match(h,/saveShared\(\{sound:enabled\}\)/);assert.match(h,/saveShared\(\{volume:audio\.volume\}\)/);
 assert.match(l,/profile\.muted=!sharedSound\.sound/);assert.match(l,/saveShared\(\{sound:!p\.muted\}\)/);
 assert.match(x,/profile\.carol=sharedSound\.music/);assert.match(x,/saveShared\(\{sound:profile\.sound\}\)/);assert.match(x,/saveShared\(\{music:profile\.carol\}\)/);
});

// ── 허브 → 체험 서버 넘기기
test('넘기기: 쓴 체험에서 한 번만 꺼내지고, 다른 체험·오래된 값은 버린다', ()=>{
 const ss=mem();
 writeHubPick({exp:'christmas',server:'2'},ss,1000);
 assert.equal(takeHubPick('hiking',ss,1001),null);           // 다른 체험 → 버림(지워짐)
 assert.equal(ss.getItem(HANDOFF_KEY),null);
 writeHubPick({exp:'christmas',server:'2'},ss,1000);
 assert.deepEqual(takeHubPick('christmas',ss,2000),{server:'2'});
 assert.equal(takeHubPick('christmas',ss,2001),null);       // 두 번째는 없음
 writeHubPick({exp:'smoking',solo:true},ss,0);
 assert.deepEqual(takeHubPick('smoking',ss,5),{solo:true});
 writeHubPick({exp:'smoking',server:'1'},ss,0);
 assert.equal(takeHubPick('smoking',ss,HANDOFF_TTL_MS+1),null); // 10분 넘음
 ss.setItem(HANDOFF_KEY,JSON.stringify({exp:'smoking',server:'<x>',at:0}));
 assert.equal(takeHubPick('smoking',ss,1),null);              // 이상한 서버 id
 writeHubPick({exp:'smoking',server:'3'},ss,0);writeHubPick({exp:'smoking'},ss,0); // 「들어가서 서버 고르기」는 지운다
 assert.equal(ss.getItem(HANDOFF_KEY),null);
});
test('넘기기 적용: 서버 → 서버 창의 join, 혼자 → solo, 서버 주소가 없으면 창을 연다(null)', async()=>{
 const joined=[],solo=[];
 const pick=createServerPick({experience:'christmas',serverUrl:'wss://x.example/',doc:null,fetchImpl:null,storage:mem({'gwanak-multi-name':'눈사람'}),
  onJoin:d=>joined.push(d),onSolo:d=>solo.push(d)});
 assert.equal(applyHubPick(pick,{server:'2'}),'join');
 assert.deepEqual(joined,[{server:'2',room:'눈마을-2',name:'눈사람',serverName:'눈마을 광장 2서버'}]);
 assert.equal(applyHubPick(pick,{solo:true}),'solo');assert.equal(solo.length,1);
 assert.equal(applyHubPick(pick,{server:'9'}),null);
 assert.equal(applyHubPick(pick,null),null);
 const local=createServerPick({experience:'hiking',serverUrl:null,doc:null,fetchImpl:null,storage:mem(),onJoin:()=>joined.push('x')});
 assert.equal(applyHubPick(local,{server:'1'}),null);assert.equal(joined.length,1);
});
test('세 체험은 허브 선택(없으면 지난 선택)이 있으면 서버 창 대신 바로 들어가고, 없으면 공용 입장 창을 연다(11-19 entry.js)', ()=>{
 const hp=read('src/hiking-server-pick.js'),mp=read('src/mountain-pick.js'),l=read('src/lounge/main.js'),x=read('src/christmas/main.js');
 assert.match(hp,/takeEntryChoice\('hiking',\{mode:hikingPickMode\(\)\}\)/);assert.match(hp,/enterWith\(hikingServerPick\(\),entryChoice,'show'\)/);
 assert.equal((mp.match(/serverReady\.then\(openFirstHikingPick\)/g)??[]).length,2);
 assert.match(l,/takeEntryChoice\('smoking',\{mode:pickMode\}\)/);assert.match(l,/enterWith\(multiUi\.pick,entryChoice,pickMode\)/);
 assert.match(x,/takeEntryChoice\('christmas',\{mode:pickMode\}\)/);assert.match(x,/enterWith\(pick,entryChoice,pickMode\)/);
});

// ── 서버 상태
test('서버 상태: 확인 중 · 켜짐(인원·합계·정원) · 꺼짐(꺼짐·주소 없음·/health 실패)', ()=>{
 const c=hubServerView('hiking',{net:'checking'});assert.equal(c.state,'checking');assert.equal(c.best,null);assert.deepEqual(c.rows.map(r=>r.count),[null,null,null,null,null,null]);
 const on=hubServerView('hiking',{net:'ok',health:health()});
 assert.equal(on.state,'on');assert.equal(on.here,45);assert.equal(on.cap,180);assert.deepEqual(on.rows.map(r=>r.full),[false,true,false,false,false,false]); // 등산 서버 6개(관악산 3 + 남산 3)
 assert.equal(hubServerView('christmas',{net:'ok',health:health()}).cap,60);
 for(const net of ['off','none','error'])assert.equal(hubServerView('smoking',{net,health:null}).state,'off',net);
 assert.equal(hubServerView('smoking',{net:'ok',health:{}}).state,'off');
 assert.equal(hubTotal({net:'ok',health:health()}),40);assert.equal(hubTotal({net:'error'}),null);
});
test('추천 서버: 꽉 차지 않은 곳 중 80% 아래에서 사람이 가장 많은 곳, 모두 꽉 차면 없음', ()=>{
 const rows=(a)=>a.map(([c,m],i)=>({id:String(i+1),count:c,max:m,full:c>=m}));
 assert.equal(bestServer(rows([[12,30],[30,30],[3,30]])),'1');
 assert.equal(bestServer(rows([[18,20],[7,20],[0,20]])),'2');   // 18/20은 80% 넘음 → 7명 쪽
 assert.equal(bestServer(rows([[19,20],[17,20],[20,20]])),'1'); // 모두 80% 넘으면 꽉 차지 않은 첫 서버
 assert.equal(bestServer(rows([[30,30],[30,30],[30,30]])),null);
 assert.equal(bestServer(rows([[0,30],[0,30],[0,30]])),'1');
});
test('서버 받아 오기: 공개 파일 주소의 /health를 받고, 꺼짐·실패를 알린다', async()=>{
 const seen=[];let fetched=[];
 const fetchImpl=async url=>{fetched.push(url);return {ok:true,json:async()=>health()};};
 const timers=[];const s=createHubServers({choose:async()=>({server:'wss://abc.example/',source:'file'}),fetchImpl,onChange:x=>seen.push(x.net),setTimer:(f)=>{timers.push(f);return timers.length;},clearTimer:()=>{},doc:{hidden:false}});
 const r=await s.start();
 assert.equal(r.net,'ok');assert.equal(fetched[0],'https://abc.example/health');assert.deepEqual(seen,['checking','ok']);
 s.stop();
 const off=createHubServers({choose:async()=>({server:'',source:'file-off'}),fetchImpl,setTimer:()=>0,clearTimer:()=>{}});
 assert.equal((await off.start()).net,'off');
 const none=createHubServers({choose:async()=>{throw new Error('x');},fetchImpl,setTimer:()=>0,clearTimer:()=>{}});
 assert.equal((await none.start()).net,'none');
 // 11-19 접속 유도 ②: 첫 실패 한 번은 '확인 중' 그대로, 1초 뒤 다시 실패해야 error
 const et=[];const err=createHubServers({choose:async()=>({server:'wss://abc.example/',source:'file'}),fetchImpl:async()=>({ok:false,status:502}),setTimer:(f,ms)=>{et.push({f,ms});return et.length;},clearTimer:()=>{}});
 assert.equal((await err.start()).net,'checking');
 const retry=et.find(t=>t.ms===1000);assert.ok(retry,'1초 뒤 다시 보기 예약');await retry.f();assert.equal(err.state.net,'error');err.stop();
});

// ── 화면 조각
test('화면 모양: 폭 760 이하·높이 500 이하 = 휴대폰 카드 목록, 그 밖 = 마을 지도', ()=>{
 assert.equal(layoutFor(1920,1080),'map');assert.equal(layoutFor(1280,800),'map');
 assert.equal(layoutFor(390,844),'list');assert.equal(layoutFor(844,390),'list');assert.equal(layoutFor(760,1000),'list');
});
test('허브 시간대: ?hubtime → 설정 → 해 높이', ()=>{
 assert.equal(pickHubTime({forced:'night',setting:'day',elevation:30}),'night');
 assert.equal(pickHubTime({setting:'dusk',elevation:30}),'dusk');
 assert.equal(pickHubTime({setting:'auto',elevation:-10}),'night');
 assert.equal(pickHubTime({forced:'x',setting:'x',elevation:30}),'day');
});
test('들어가기 단추: 켜짐 = 고른 서버로·혼자, 확인 중 = 들어가서 고르기, 꺼짐 = 혼자만, 모두 꽉 참 = 안내 + 혼자', ()=>{
 const [h,s,x]=EXPERIENCES;
 const on=hubServerView('hiking',{net:'ok',health:health()});
 // 등산은 서버를 허브에서 고르지 않는다: 산 고르기 → 그 산의 서버 고르기(11-21)
 for(const v of [on,hubServerView('hiking',{net:'checking'}),hubServerView('hiking',{net:'off'})]){const a=enterHTML(h,v,'3','/');assert.match(a,/data-enter="pick"[^]*산 고르러 가기/);assert.doesNotMatch(a,/data-enter="server"|data-enter="solo"/);}
 const son=hubServerView('smoking',{net:'ok',health:health()});
 const a=enterHTML(s,son,'3','/');
 assert.match(a,/data-enter="server" data-server="3"/);assert.match(a,/3서버로 들어가기/);assert.match(a,/data-enter="solo"/);assert.match(a,/혼자 피우기/);
 assert.match(enterHTML(s,hubServerView('smoking',{net:'checking'}),null,'/'),/data-enter="pick"[^]*들어가서 서버 고르기/);
 const off=enterHTML(x,hubServerView('christmas',{net:'off'}),null,'/');
 assert.match(off,/혼자 둘러보기로 들어가기/);assert.doesNotMatch(off,/data-enter="server"/);
 assert.match(enterHTML(NEXT_SLOT,on,null,'/'),/data-fb="idea"/);
 const list=serverListHTML(h,on,'1');
 assert.equal((list.match(/data-srv=/g)??[]).length,6);assert.match(list,/data-srv="2" disabled/);assert.match(list,/aria-pressed="true"/);
 assert.match(serverListHTML(h,hubServerView('hiking',{net:'off'}),null),/서버가 쉬고 있어요/);
 assert.match(statusHTML(on),/45명/);assert.match(statusHTML(hubServerView('smoking',{net:'ok',health:health()})),/첫 번째로 들어가 보세요/);
 assert.match(statusHTML(hubServerView('hiking',{net:'checking'})),/인원 확인 중/);
});
test('체험 5칸(등산·흡연장·크리스마스·인형뽑기·다음 체험), 지도 자리·그림·색·아이콘이 모두 있다', ()=>{
 const all=[...EXPERIENCES,NEXT_SLOT];
 assert.deepEqual(all.map(e=>e.id),['hiking','smoking','christmas','claw','next']);
 for(const e of all){assert.ok(ART[e.art],e.id);assert.ok(MAP_POS[e.id],e.id);assert.match(e.color,/^#[0-9a-f]{6}$/);assert.ok(hasIcon(e.icon),e.icon);}
 for(const e of EXPERIENCES){assert.equal(e.feats.length,3);for(const [ic] of e.feats)assert.ok(hasIcon(ic),ic);}
 for(const o of ['hike','office','santa'])assert.match(dongdong({outfit:o}),/^<svg class="dd/);
 assert.equal(dongdong({outfit:'??'}),dongdong({outfit:'hike'}));
});
test('허브 화면에는 이모지·일시정지가 없다', ()=>{
 const src=['src/hub/hub.js','src/hub/experiences.js','src/hub/main.js','src/hub/dongdong.js'].map(read).join('\n');
 assert.doesNotMatch(src,/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
 assert.doesNotMatch(src,/일시정지|pause/i);
});
