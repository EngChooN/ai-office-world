// 접속 유도 1단계(11-19 월드개발) 단위 시험: ① 친구 부르기 주소·글·보내기 ③ 크리스마스 장면 바로가기 ④ 0명 문구.
// ② 연결 확인 중 표시는 tests/server-pick.test.mjs·hub-improve.test.mjs. 화면은 scripts/verify-growth-stage1.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inviteRoom,roomOfStatus,inviteUrl,inviteText,shareInvite,trackInviteRoom,INVITE_UTM} from '../src/invite.js';
import {spotFromSearch,travelSpots} from '../src/christmas/travel.js';
import {statusHTML,ZERO_TEXT} from '../src/hub/hub.js';
import {hubServerView} from '../src/hub/hub-servers.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const PAGE='https://engchoon.github.io/ai-office-world/christmas/?look=festive&serverpick=on#x';

test('① 주소: 지금 서버 방 + 꼬리표, 검색어·#·서버 주소·이름은 버림',()=>{
 const u=new URL(inviteUrl(PAGE,{exp:'christmas',room:'눈마을-2'}));
 assert.equal(u.origin+u.pathname,'https://engchoon.github.io/ai-office-world/christmas/');
 assert.equal(u.searchParams.get('multi'),'눈마을-2');assert.equal(u.searchParams.get('utm_source'),'invite');assert.equal(u.searchParams.get('utm_medium'),'share');
 assert.equal(u.hash,'');for(const k of ['look','serverpick','server','name'])assert.equal(u.searchParams.has(k),false,k);
 const solo=new URL(inviteUrl('https://x.io/ai-office-world/hiking/?server=wss://a&name=나',{exp:'hiking',room:null}));
 assert.equal(solo.searchParams.has('multi'),false,'혼자면 체험 주소만');assert.equal(solo.searchParams.has('server'),false);assert.equal(solo.searchParams.has('name'),false);
 assert.deepEqual({...INVITE_UTM},{utm_source:'invite',utm_medium:'share'});
});
test('① 서버 목록 밖 방·다른 체험 방은 주소에 안 넣음',()=>{
 assert.equal(inviteRoom('smoking','옥상-3'),'옥상-3');assert.equal(inviteRoom('smoking','옥상'),'옥상-1','서버가 알려 준 1서버 이름');assert.equal(inviteRoom('smoking','눈마을-1'),null);assert.equal(inviteRoom('hiking','우리끼리'),null);
 assert.equal(new URL(inviteUrl(PAGE,{exp:'christmas',room:'아무방'})).searchParams.has('multi'),false);
});
test('① 지금 서버: 서버에 붙어 있을 때만(내 컴퓨터 모드·연결 중·혼자는 없음)',()=>{
 assert.equal(roomOfStatus('christmas',{state:'online',room:'눈마을-1',transport:'server'}),'눈마을-1');
 assert.equal(roomOfStatus('christmas',{state:'reconnecting',room:'눈마을-1',transport:'server'}),'눈마을-1');
 assert.equal(roomOfStatus('christmas',{state:'online',room:'눈마을-1',transport:'local'}),null);
 assert.equal(roomOfStatus('christmas',{state:'connecting',room:'눈마을-1',transport:'server'}),null);
 assert.equal(roomOfStatus('smoking',{state:'off',room:'옥상-1',transport:'server',joined:false}),null);
 const w=new EventTarget(),t=trackInviteRoom('hiking',{win:w});
 w.dispatchEvent(Object.assign(new Event('hiking:multi-status'),{detail:{state:'online',room:'관악산-2',transport:'server'}}));assert.equal(t.room(),'관악산-2');
 w.dispatchEvent(Object.assign(new Event('hiking:multi-status'),{detail:{state:'offline',room:'관악산-2',transport:'server'}}));assert.equal(t.room(),null);
});
test('① 보낼 글: 서버 번호, 혼자면 체험 이름만',()=>{
 assert.equal(inviteText('christmas','눈마을-2'),'나 지금 온라인 크리스마스 눈마을 2서버! 설치 없이 바로 들어와');
 assert.equal(inviteText('hiking','관악산-1'),'나 지금 온라인 등산 관악산 1서버! 설치 없이 바로 들어와');
 assert.equal(inviteText('smoking',null),'온라인 흡연장 같이 하자! 설치 없이 바로 들어와');
});
test('① 보내기: 공유 창 → 닫으면 cancel → 없으면 복사 → 그것도 안 되면 주소 보여 주기',async()=>{
 const got=[];const nav={share:async d=>{got.push(d);}};
 assert.equal(await shareInvite({url:'u',text:'t',nav}),'shared');assert.deepEqual(got[0],{title:'',text:'t',url:'u'});
 assert.equal(await shareInvite({url:'u',text:'t',nav:{share:async()=>{throw Object.assign(new Error(),{name:'AbortError'});}}}),'cancel');
 const clip=[];assert.equal(await shareInvite({url:'u',text:'t',nav:{share:async()=>{throw new Error('막힘');},clipboard:{writeText:async s=>clip.push(s)}}}),'copied','공유가 막히면 복사');
 assert.equal(clip[0],'t u');
 const shown=[];assert.equal(await shareInvite({url:'u',text:'t',nav:{},win:{prompt:(m,v)=>shown.push(v)}}),'shown');assert.deepEqual(shown,['u']);
});
test('① 메뉴: 세 체험 공용 틀 맨 위 한 줄, 손가락 크기',()=>{
 const js=read('../src/ui-frame.js'),css=read('../src/ui-frame.css');
 assert.match(js,/invite=\['hiking','smoking','christmas'\]\.includes\(exp\)/);assert.match(js,/class="uf-invite"/);
 assert.match(css,/\.uf-invite\{[^}]*min-height:48px/);
});
test('③ 장면 바로가기: ?spot=sled·fight·rink·tree·sky → 그 시설 앞, 모르는 값·꺼진 시설은 null',()=>{
 const spots=travelSpots({carousel:true,rink:true,sky:true});
 for(const id of ['sled','fight','rink','tree','sky'])assert.equal(spotFromSearch(`?spot=${id}`,spots)?.id,id,id);
 assert.equal(spotFromSearch('?spot=SLED',spots)?.id,'sled');
 assert.equal(spotFromSearch('?spot=moon',spots),null);assert.equal(spotFromSearch('',spots),null);
 assert.equal(spotFromSearch('?spot=sky',travelSpots({sky:false})),null,'하늘 썰매가 없는 화면');
 assert.match(read('../src/christmas/main.js'),/spotFromSearch\(location\.search,travel\.spots\)/);
});
test('④ 0명: 허브 카드·위 띠·입장 창은 「첫 번째로 들어가 보세요」, 1명 이상은 숫자',()=>{
 const h=n=>({ok:true,total:n,servers:{smoking:[{id:'1',name:'옥상 1서버',count:n,max:30}]}});
 assert.equal(ZERO_TEXT,'첫 번째로 들어가 보세요');
 assert.match(statusHTML(hubServerView('smoking',{net:'ok',health:h(0)})),/첫 번째로 들어가 보세요/);
 assert.doesNotMatch(statusHTML(hubServerView('smoking',{net:'ok',health:h(0)})),/아무도 없어요|0명/);
 assert.match(statusHTML(hubServerView('smoking',{net:'ok',health:h(2)})),/2명<\/b> 함께하는 중/);
 assert.match(read('../src/hub/hub.js'),/tot\?`[^`]*지금 접속 중/);
 assert.match(read('../src/server-pick.js'),/data-sp-first hidden>아직 아무도 없어요 · 첫 번째로 들어가 보세요/);
});
