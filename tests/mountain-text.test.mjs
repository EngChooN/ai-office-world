import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readPage,expandIncludes} from '../scripts/html-include.mjs';
import {GWANAK} from '../src/mountains/gwanak.js';
import {applyMountainText} from '../src/mountain-text.js';
import {TIPS} from '../src/loading-screen.js';

// 한 게임 통합 3단계(11-20): 화면 틀을 조각 파일로 빼고 산마다 다른 글은 산 정의 text에서 채운다. 관악산 화면은 한 글자도 바뀌면 안 된다.
const frame=readFileSync(new URL('../src/frame/hiking-body.html',import.meta.url),'utf8');
const unescape=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
const slots=attr=>[...frame.matchAll(new RegExp(`<[a-z0-9]+\\b([^>]*?)\\s${attr}="([\\w]+)"([^>]*)>([^<]*)`,'g'))].map(m=>({key:m[2],attrs:m[1]+m[3],text:unescape(m[4])}));

test('관악산 페이지는 틀 조각을 끼워 넣어 읽고, 끼운 결과에 화면 틀이 한 번씩 들어간다',()=>{
 const raw=readFileSync(new URL('../hiking/index.html',import.meta.url),'utf8');
 assert.match(raw,/<!--#include src\/frame\/hiking-body\.html-->/);
 const html=readPage('hiking/index.html');
 assert.doesNotMatch(html,/#include/);
 for(const id of ['loading-screen','world','app','summit','map','help','source-line'])assert.equal(html.split(`id="${id}"`).length-1,1,id);
 assert.equal(expandIncludes('a<!--#include src/frame/hiking-body.html-->b'),'a'+frame+'b');
});

test('틀의 산별 글 자리는 모두 관악산 산 정의에 값이 있고 글자가 같다(자리만 옮기기)',()=>{
 const t=GWANAK.text,text=slots('data-mt');
 assert.ok(text.length>=12,'data-mt 자리 '+text.length);
 for(const s of text){assert.equal(typeof t[s.key],'string',s.key);assert.equal(t[s.key],s.text,s.key);}
 for(const s of slots('data-mt-title')){const v=s.attrs.match(/\btitle="([^"]*)"/)?.[1];assert.equal(t[s.key],unescape(v),s.key);}
 for(const s of slots('data-mt-label')){const v=s.attrs.match(/\baria-label="([^"]*)"/)?.[1];assert.equal(t[s.key],unescape(v),s.key);}
 assert.match(readPage('hiking/index.html'),new RegExp(`<title>${t.pageTitle}</title>`));
 assert.equal(t.loadingTips,TIPS);
 assert.equal(t.summitNote,'DSM 지형 체험 기록입니다.');
 assert.match(t.ambientCredits,/^환경음은 실제 관악산 녹음이 아닌 CC0 임시음입니다/);
});

test('applyMountainText: 글·title·aria-label을 바꾸고 값 없는 키·같은 글은 건드리지 않는다',()=>{
 const el=(dataset,text='',attrs={})=>({dataset,textContent:text,attrs:{...attrs},getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;}});
 const goal=el({mt:'goalLabel'},'연주대까지 '),seal=el({mt:'sealName'},'관악산'),btn=el({mtTitle:'startEntranceTitle'},'',{title:'옛 글'}),cv=el({mtLabel:'canvasLabel'},'',{'aria-label':'관악산 정상 접근 3D 시범 공간'}),none=el({mt:'없는키'},'그대로');
 const all=[goal,seal,btn,cv,none];
 const doc={title:'산길 · 관악산 온라인 등반',querySelectorAll:sel=>all.filter(e=>({'[data-mt]':'mt','[data-mt-title]':'mtTitle','[data-mt-label]':'mtLabel'})[sel] in e.dataset)};
 assert.equal(applyMountainText(doc,GWANAK.text),1,'관악산은 다른 글 하나(title)만 바뀜');
 assert.equal(btn.attrs.title,GWANAK.text.startEntranceTitle);
 const n=applyMountainText(doc,{goalLabel:'정상까지 ',sealName:'남산',canvasLabel:'남산',pageTitle:'산길 · 남산'});
 assert.equal(n,4);assert.equal(goal.textContent,'정상까지 ');assert.equal(seal.textContent,'남산');assert.equal(cv.attrs['aria-label'],'남산');assert.equal(doc.title,'산길 · 남산');assert.equal(none.textContent,'그대로');
 assert.equal(applyMountainText(null,GWANAK.text),0);
});
