// 세 체험 공통 입장(src/entry.js, 11-19 입장 흐름 정리): 허브 선택 → 지난 선택 → 공용 입장 창 한 번
import test from 'node:test';
import assert from 'node:assert/strict';
import {ENTRY_KEY,rememberEntry,lastEntry,forgetEntry,takeEntryChoice,enterWith} from '../src/entry.js';
import {writeHubPick} from '../src/hub/handoff.js';
import {createServerPick} from '../src/server-pick.js';
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};};
const fakePick=()=>{const log=[];return {log,url:'http://x/health',state:{rows:[{id:'1'},{id:'2'},{id:'3'}]},join:id=>log.push('join:'+id),solo:()=>log.push('solo'),open:o=>log.push('open:'+JSON.stringify(o))};};

test('지난 선택: 체험별로 남고, 모르는 서버는 안 남김, 저장소가 막혀도 멈추지 않음',()=>{
 const ls=mem();
 assert.ok(rememberEntry('hiking',{server:'2'},ls));assert.ok(rememberEntry('smoking',{solo:true},ls));
 assert.deepEqual(lastEntry('hiking',ls),{server:'2'});assert.deepEqual(lastEntry('smoking',ls),{solo:true});assert.equal(lastEntry('christmas',ls),null);
 assert.equal(rememberEntry('hiking',{server:'99'},ls),false);assert.deepEqual(lastEntry('hiking',ls),{server:'2'});
 forgetEntry('hiking',ls);assert.equal(lastEntry('hiking',ls),null);
 const broken={getItem(){throw 1;},setItem(){throw 1;}};assert.equal(lastEntry('hiking',broken),null);assert.equal(rememberEntry('hiking',{solo:true},broken),false);
 ls.setItem(ENTRY_KEY,'{망가짐');assert.equal(lastEntry('hiking',ls),null);
});
test('이번 입장 선택: 허브 → 지난 선택 순, 옛 주소(legacy)는 없음, 점검 브라우저(skip)는 지난 선택을 안 씀',()=>{
 const ls=mem(),ss=mem();rememberEntry('christmas',{server:'3'},ls);
 writeHubPick({exp:'christmas',server:'1'},ss,1000);
 assert.deepEqual(takeEntryChoice('christmas',{session:ss,storage:ls,now:1001}),{server:'1',from:'hub'});
 assert.deepEqual(takeEntryChoice('christmas',{session:ss,storage:ls,now:1002}),{server:'3',from:'saved'},'허브 값은 한 번만');
 assert.equal(takeEntryChoice('christmas',{mode:'legacy',session:ss,storage:ls}),null);
 assert.equal(takeEntryChoice('christmas',{mode:'skip',session:ss,storage:ls}),null);
 writeHubPick({exp:'christmas',solo:true},ss,5);assert.deepEqual(takeEntryChoice('christmas',{mode:'skip',session:ss,storage:ls,now:6}),{solo:true,from:'hub'});
});
test('입장: 선택이 있으면 창 없이(서버·혼자), 없으면 창 한 번, skip이면 아무것도 안 함',()=>{
 let p=fakePick();assert.equal(enterWith(p,{server:'2'}),'join');assert.deepEqual(p.log,['join:2']);
 p=fakePick();assert.equal(enterWith(p,{solo:true}),'solo');assert.deepEqual(p.log,['solo']);
 p=fakePick();assert.equal(enterWith(p,null,'show'),'open');assert.deepEqual(p.log,['open:{"closable":false}']);
 p=fakePick();assert.equal(enterWith(p,null,'skip'),null);assert.deepEqual(p.log,[]);
 p=fakePick();p.url=null;assert.equal(enterWith(p,{server:'1'},'show'),'open','서버 주소가 없으면 창(연결할 수 없어요 + 혼자)');
});
test('공용 창에서 고르면 지난 선택이 남는다(서버·혼자 모두, 게임 안 서버 바꾸기 포함)',async()=>{
 for(const exp of ['hiking','smoking','christmas']){
  const ls=mem(),p=createServerPick({experience:exp,serverUrl:null,storage:ls,doc:null,fetchImpl:null});
  await p.open({closable:false});p.join('2');assert.deepEqual(lastEntry(exp,ls),{server:'2'},exp);
  await p.open({current:'2'});p.solo();assert.deepEqual(lastEntry(exp,ls),{solo:true},exp);
 }
});
