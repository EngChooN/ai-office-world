// 허브 첫 화면: 카드 목록·링크·가벼움.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXPERIENCES,experienceHref} from '../src/hub/experiences.js';
import {hubTime,ART,enterHTML,statusHTML} from '../src/hub/hub.js';
import {hubServerView} from '../src/hub/hub-servers.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('카드는 등산·흡연장·크리스마스 3개, id가 겹치지 않는다',()=>{
 assert.deepEqual(EXPERIENCES.map(e=>e.id),['hiking','smoking','christmas']);
 assert.equal(new Set(EXPERIENCES.map(e=>e.id)).size,EXPERIENCES.length);
 for(const e of EXPERIENCES){assert.ok(e.title&&e.place&&e.desc);assert.ok(ART[e.art],e.id);}
});
test('링크는 BASE_PATH 기준 /hiking/·/smoking/',()=>{
 const [h,s]=EXPERIENCES;
 assert.equal(experienceHref(h,'/'),'/hiking/');assert.equal(experienceHref(s,'/'),'/smoking/');
 assert.equal(experienceHref(h,'/ai-office-world/'),'/ai-office-world/hiking/');
 assert.equal(experienceHref(s,'/ai-office-world'),'/ai-office-world/smoking/');
});
test('들어가기 링크는 체험 주소(BASE_PATH 기준)이고, 기록 도장 함수는 기록이 있을 때만 글을 준다',()=>{
 const [h]=EXPERIENCES;
 const off=hubServerView('hiking',{net:'off'});
 assert.match(enterHTML(h,off,null,'/ai-office-world/'),/href="\/ai-office-world\/hiking\/"[^>]*data-enter="solo"/);
 assert.match(statusHTML(off),/혼자 하기만/);
 assert.equal(h.record({getItem:()=>null}),null);
 const store={getItem:()=>JSON.stringify({gwanak:{first:'2026-11-06',count:2,bestSec:7000,last:'2026-11-07'}})};
 assert.equal(h.record(store),'완등 2회');
});
test('시간대는 해 높이로 낮·노을·밤',()=>{
 assert.equal(hubTime(30),'day');assert.equal(hubTime(3),'dusk');assert.equal(hubTime(-10),'night');assert.equal(hubTime(NaN),'day');
});
test('허브는 three.js를 불러오지 않는다',()=>{
 for(const f of ['src/hub/hub.js','src/hub/art.js','src/hub/dongdong.js','src/hub/hub-servers.js','src/hub/handoff.js','src/shared-settings.js','src/server-pick.js','src/server-link.js','src/multi-protocol.js','src/feedback.js','src/hub/experiences.js','src/hub/main.js','src/summit-records.js','src/daytime.js','src/mood-config.js'])
  assert.doesNotMatch(read(f),/from\s+['"]three|import\(['"]three/,f);
});
test('버튼(들어가기·서버 줄·단추)은 44px 이상',()=>{
 const css=read('src/hub/hub.css');
 for(const sel of ['.hb-go','.hb-solo','.hb-srv','.hb-btn','.hb-more button','.hb-cont'])
  assert.match(css,new RegExp(sel.replace(/[.]/g,'\\.').replace(' ','\\s')+'\\{[^}]*min-height:(4[4-9]|5\\d)px'),sel);
});
