// 남산 사랑의 자물쇠 서버 저장·메시지·신고(11-22, 월드개발). 규칙 src/namsan/namsan-lock-rules.js, 보관함 server/namsan-locks.mjs, 방 server/rooms.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFileSync as rf} from 'node:fs';
import {LOCK_RULES,cleanLockText,lockLength,privateLike,bannedLike,checkLockText,lockDate,deviceLockKey,isOwnerKey,LOCK_KEY_STORE} from '../src/namsan/namsan-lock-rules.js';
import {createLockStore,readLocks,ownerHash} from '../server/namsan-locks.mjs';
import {createRooms} from '../server/rooms.mjs';
import {startServer} from '../server/multi-server.mjs';
import {messageAllowed} from '../src/multi-protocol.js';

const K=n=>n.toString(16).padStart(32,'0');   // 기기 열쇠(16진수 32자)
const H=n=>ownerHash(K(n));

test('글 정리: 줄바꿈·빈칸·제어 문자, 30자(이모지 1자), 개인정보 꼴, 금칙어',()=>{
 assert.equal(cleanLockText('  남산\n첫   등산‮ 기념 '),'남산 첫 등산 기념');
 assert.equal(lockLength('👨‍👩‍👧가나'),3);
 assert.equal(lockLength(cleanLockText('가'.repeat(40))),LOCK_RULES.textMax);
 for(const s of ['010 1234 5678 연락해','010-1234-5678','a@b.c','http://x','www.abc','insta.com 놀러와','01012345678'])assert.ok(privateLike(s),s);
 for(const s of ['남산 첫 등산 기념! 또 오자','2026년 11월 22일','우리 3명 100일'])assert.ok(!privateLike(s),s);
 assert.ok(bannedLike('너는 바 보야',['바보']));assert.ok(bannedLike('BADword',['badword']));assert.ok(!bannedLike('좋은 말',['바보']));
 assert.deepEqual(checkLockText('010 1234 5678',['x']),{ok:false,text:'010 1234 5678',code:'private'});
 assert.equal(checkLockText('바보야',['바보']).code,'banned');assert.deepEqual(checkLockText('',['바보']),{ok:true,text:''});
 assert.equal(lockDate(Date.UTC(2026,10,21,16,0)),'2026. 11. 22.','한국 시간 날짜');
});

test('기기 열쇠: 16진수 32자, 저장해 두고 다시 씀',()=>{
 const m=new Map(),st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 const a=deviceLockKey(st),b=deviceLockKey(st);assert.ok(isOwnerKey(a));assert.equal(a,b);assert.equal(m.get(LOCK_KEY_STORE),a);
 assert.ok(isOwnerKey(deviceLockKey(null)));
});

test('보관함: 걸기·자리·개수 3·20초·하루 10개·금칙어 거절',()=>{
 let t=1e12;const s=createLockStore({now:()=>t,banned:['바보']});
 const r=s.hang({owner:H(1),ip:'ip1',name:'동동',slot:17,c:1,h:1,text:' 남산\n첫 등산 '});
 assert.ok(r.ok);assert.equal(r.lock.slot,17);assert.equal(r.lock.text,'남산 첫 등산');assert.equal(r.lock.name,'동동');
 assert.deepEqual(s.hang({owner:H(1),ip:'ip1',slot:18,c:1,h:0,text:''}),{ok:false,code:'rate'},'20초 간격');
 t+=20001;const r2=s.hang({owner:H(1),ip:'ip1',slot:17,c:2,h:0,text:''});assert.ok(r2.ok);assert.ok(r2.lock.slot===16||r2.lock.slot===18,'찬 자리면 가까운 빈 자리');
 t+=20001;assert.ok(s.hang({owner:H(1),ip:'ip1',slot:0,c:0,h:0,text:''}).ok);
 t+=20001;assert.deepEqual(s.hang({owner:H(1),ip:'ip1',slot:1,c:0,h:0,text:''}),{ok:false,code:'limit'});
 assert.equal(s.hang({owner:H(2),ip:'ip2',slot:1,c:0,h:0,text:'바 보'}).code,'banned');
 assert.equal(s.hang({owner:H(2),ip:'ip2',slot:1,c:0,h:0,text:'010-1111-2222'}).code,'private');
 assert.equal(s.hang({owner:null,slot:1,c:0,h:0,text:''}).code,'bad');assert.equal(s.hang({owner:H(2),slot:1,c:99,h:0,text:''}).code,'bad');
 for(let i=0;i<7;i++){t+=20001;assert.ok(s.hang({owner:H(10+i),ip:'ip9',slot:50+i,c:0,h:0,text:''}).ok);}
 t+=20001;for(let i=0;i<3;i++)assert.ok(s.hang({owner:H(30+i),ip:'ip9',slot:80+i,c:0,h:0,text:''}).ok);
 assert.equal(s.hang({owner:H(40),ip:'ip9',slot:90,c:0,h:0,text:''}).code,'rate','같은 곳 하루 10개');
 const L=s.list(H(1));assert.equal(L.locks.filter(l=>l.mine).length,3);assert.ok(L.locks.every(l=>!('owner' in l)&&!('reports' in l)),'열쇠·신고자는 안 보냄');
});

test('보관함: 꽉 차면 가장 오래된 「남의」 자물쇠가 꾸러미로, 보관 상한',()=>{
 let t=1e12;const s=createLockStore({now:()=>t,rules:{slots:4,keep:6,gapMs:0,ipPerDay:99}});
 for(let i=0;i<4;i++){t+=1000;assert.ok(s.hang({owner:H(i),slot:i,c:0,h:0,text:`n${i}`}).ok);}
 t+=1000;const r=s.hang({owner:H(0),slot:2,c:0,h:0,text:'새'});assert.ok(r.ok);
 assert.equal(r.moved,s.all().find(l=>l.text==='n1').id,'내 것(n0)은 안 옮기고 그다음 오래된 n1');assert.equal(r.lock.slot,1);
 assert.equal(s.list().bundle,1);const b=s.bundlePage(0);assert.equal(b.total,1);assert.equal(b.locks[0].text,'n1');
 for(let i=0;i<3;i++){t+=1000;s.hang({owner:H(20+i),slot:0,c:0,h:0,text:`m${i}`});}
 assert.ok(s.size<=6,'상한');assert.ok(!s.all().some(l=>l.text==='n1'),'꾸러미 가장 오래된 것부터 지움');
});

test('보관함: 신고(같은 사람 1번·본인 안 됨·3명이면 숨김), 떼기(건 사람만), 운영자 숨김·되살리기',()=>{
 let t=1e12;const s=createLockStore({now:()=>t});
 const {lock}=s.hang({owner:H(1),slot:5,c:0,h:0,text:'글'});
 assert.equal(s.report({reporter:H(1),id:lock.id,reason:'abuse'}).ok,false,'본인 신고 안 됨');
 assert.equal(s.report({reporter:H(2),id:lock.id,reason:'nope'}).ok,false,'이유 목록 밖');
 assert.equal(s.report({reporter:H(2),id:lock.id,reason:'abuse'}).hidden,false);
 assert.ok(s.report({reporter:H(2),id:lock.id,reason:'spam'}).again,'같은 사람 두 번은 한 번');
 assert.equal(s.list(H(2)).locks.length,0,'신고한 사람 목록에서는 바로 빠짐');assert.equal(s.list(H(9)).locks.length,1);
 s.report({reporter:H(3),id:lock.id,reason:'etc'});const r=s.report({reporter:H(4),id:lock.id,reason:'private'});
 assert.equal(r.hidden,true);assert.equal(s.list(H(9)).locks.length,0,'3명이면 모두에게서 숨김');assert.equal(s.list().bundle,0,'숨긴 것은 꾸러미에도 없음');
 assert.equal(s.reported().length,1);s.restore(lock.id);assert.equal(s.list().locks[0].slot,5,'되살리면 빈 옛 자리로');
 assert.equal(s.remove({owner:H(2),id:lock.id}).ok,false,'남의 것은 못 뗌');assert.ok(s.remove({owner:H(1),id:lock.id}).ok);assert.equal(s.size,0);
});

test('파일 읽기: 깨진 줄 버림, 같은 자리 두 번이면 늦은 것을 꾸러미로',()=>{
 const L=readLocks({locks:[{id:'lk_aaaaaa',slot:3,c:1,h:1,text:'a',name:'x',at:2,owner:'o'},{id:'lk_bbbbbb',slot:3,c:0,at:3,owner:'o2'},{id:'bad',slot:1,at:1,owner:'o'},{id:'lk_cccccc',slot:999,at:1,owner:'o'}]});
 assert.deepEqual(L.map(l=>[l.id,l.slot]),[['lk_cccccc',null],['lk_aaaaaa',3],['lk_bbbbbb',null]]);
});

// 방 로직: 가짜 소켓 두 개
function pair(store){
 const rooms=createRooms({locks:store,reports:{append:r=>log.push(r)}}),log=[];
 const mk=(name,room='남산-1')=>{const box=[];const r=rooms.join({room,name,send:s=>box.push(JSON.parse(s))});return {c:r.client,box,last:t=>[...box].reverse().find(m=>m.t===t)};};
 return {rooms,mk,log};
}
test('방: 남산 방에서만 받고, 걸면 남산 방 모두에게 lk-add(받는 사람마다 mine), 신고 3명 → lk-gone·신고 기록',()=>{
 let t=1e12;const store=createLockStore({now:()=>t});const {rooms,mk,log}=pair(store);
 assert.ok(messageAllowed('hiking','lk-hang'));assert.ok(!messageAllowed('smoking','lk-hang'));
 const A=mk('에이'),B=mk('비'),C=mk('씨','남산-2'),G=mk('관악','관악산-1');
 rooms.message(A.c,{t:'lk-list',owner:K(1)});assert.deepEqual(A.last('lk-all'),{t:'lk-all',locks:[],bundle:0});
 rooms.message(G.c,{t:'lk-list',owner:K(9)});assert.equal(G.last('lk-all'),undefined,'관악산 방은 안 받음');
 rooms.message(B.c,{t:'lk-list',owner:K(2)});
 rooms.message(A.c,{t:'lk-hang',q:7,owner:K(1),slot:10,c:3,h:1,text:'우리 가족 사랑해'});
 const ok=A.last('lk-ok');assert.equal(ok.q,7);assert.equal(ok.lock.mine,true);assert.equal(ok.lock.name,'에이');
 const add=B.last('lk-add');assert.equal(add.lock.text,'우리 가족 사랑해');assert.equal(add.lock.mine,undefined);
 assert.ok(C.last('lk-add'),'남산 2서버에도');assert.equal(G.last('lk-add'),undefined,'관악산에는 안 감');
 rooms.message(B.c,{t:'lk-hang',q:1,owner:K(2),slot:11,c:0,h:0,text:'바보'});
 const store2=createLockStore({now:()=>t,banned:['바보']});const p2=pair(store2),X=p2.mk('엑스');p2.rooms.message(X.c,{t:'lk-hang',q:2,owner:K(5),slot:1,c:0,h:0,text:'바 보'});
 assert.deepEqual(X.last('lk-err'),{t:'lk-err',q:2,code:'banned'});
 const id=ok.lock.id;
 rooms.message(B.c,{t:'lk-report',owner:K(2),id,reason:'abuse'});assert.ok(B.last('lk-reported'));assert.equal(log.length,1);assert.equal(log[0].kind,'lock');assert.equal(log[0].text,'우리 가족 사랑해');
 rooms.message(C.c,{t:'lk-report',owner:K(3),id,reason:'abuse'});
 const D=mk('디');rooms.message(D.c,{t:'lk-report',owner:K(4),id,reason:'spam'});
 assert.equal(A.last('lk-gone').id,id,'3명이면 모두에게서 사라짐');
 rooms.message(A.c,{t:'lk-list',owner:K(1)});assert.ok(!A.last('lk-all').locks.some(l=>l.id===id));
});

test('방: 떼기는 모두에게 lk-gone, 보관함이 없으면 걸기는 busy',()=>{
 let t=1e12;const store=createLockStore({now:()=>t});const {rooms,mk}=pair(store);
 const A=mk('에이'),B=mk('비');rooms.message(A.c,{t:'lk-hang',q:1,owner:K(1),slot:3,c:0,h:0,text:''});const id=A.last('lk-ok').lock.id;
 rooms.message(B.c,{t:'lk-del',owner:K(2),id});assert.equal(B.last('lk-gone'),undefined);
 rooms.message(A.c,{t:'lk-del',owner:K(1),id});assert.equal(B.last('lk-gone').id,id);
 const p=pair(null),X=p.mk('엑스');p.rooms.message(X.c,{t:'lk-hang',q:3,owner:K(1),slot:1,c:0,h:0,text:''});assert.deepEqual(X.last('lk-err'),{t:'lk-err',q:3,code:'busy'});
});

test('서버: 파일에 영구 저장 → 다시 켜도 남음, 운영자가 파일을 고치면 다시 읽음',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lk-'));const env={PORT:'0',HOST:'127.0.0.1',DATA_DIR:dir,LOCKS_WATCH_MS:'50'};
 let s=startServer(env,{quiet:true});await s.ready;
 const r=s.locks.hang({owner:H(1),slot:4,c:2,h:1,text:'다시 켜도 남아요'});assert.ok(r.ok);s.saveLocks();
 assert.ok(existsSync(join(dir,'namsan-locks.json')));await s.close();
 s=startServer(env,{quiet:true});await s.ready;assert.equal(s.locks.list().locks[0].text,'다시 켜도 남아요');
 const f=join(dir,'namsan-locks.json'),d=JSON.parse(readFileSync(f,'utf8'));d.locks[0].hidden=true;await new Promise(ok=>setTimeout(ok,20));writeFileSync(f,JSON.stringify(d));
 await new Promise(ok=>setTimeout(ok,300));assert.equal(s.locks.list().locks.length,0,'운영자 숨김을 다시 읽음');await s.close();
});

test('서버 이미지(Dockerfile·.dockerignore)에 자물쇠 파일이 들어간다',()=>{
 const df=rf('server/Dockerfile','utf8');assert.ok(df.includes('src/namsan/namsan-lock-rules.js'));assert.ok(df.includes('server/namsan-locks.mjs'));
 for(const p of ['server/Dockerfile.dockerignore','.dockerignore']){const t=rf(p,'utf8');assert.ok(t.includes('!src/namsan/namsan-lock-rules.js'),p);assert.ok(t.includes('!server/namsan-locks.mjs'),p);}
});
