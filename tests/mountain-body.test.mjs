// 한 게임 통합 6단계(11-20): 남산 페이지가 관악산과 같은 화면 조각·공통 본체 부품을 쓰고, 기능 스위치로 없는 기능 자리를 숨긴다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readPage} from '../scripts/html-include.mjs';
import {applyMountainFeatures,featureFlags} from '../src/mountain-text.js';
import {GWANAK} from '../src/mountains/gwanak.js';
import {NAMSAN_MOUNTAIN} from '../src/mountains/namsan.js';
import {NAMSAN_FEATURES,NAMSAN_TEXT} from '../src/mountains/namsan-page.js';

// data-feature 자리만 흉내 내는 작은 문서
function fakeDoc(keys){
 const els=keys.map(k=>({dataset:{feature:k},hidden:false}));
 return {els,documentElement:{dataset:{}},querySelectorAll:sel=>sel==='[data-feature]'?els:[]};
}
const FRAME_KEYS=[...readFileSync('src/frame/hiking-body.html','utf8').matchAll(/data-feature="([^"]+)"/g)].map(m=>m[1]);

test('화면 조각의 기능 자리 키는 두 산 기능 스위치에 모두 있다', ()=>{
 assert.ok(FRAME_KEYS.length>=8,FRAME_KEYS.join());
 for(const k of new Set(FRAME_KEYS)){const f=k==='groundSit'?'sit':k;assert.ok(f in GWANAK.features,`관악산 ${k}`);assert.ok(f in NAMSAN_FEATURES,`남산 ${k}`);}
 assert.deepEqual(Object.keys(GWANAK.features).sort(),Object.keys(NAMSAN_FEATURES).sort());   // 같은 이름
});

test('관악산은 숨는 자리가 없다(화면 그대로)', ()=>{
 const d=fakeDoc(FRAME_KEYS);assert.equal(applyMountainFeatures(d,GWANAK),0);
 assert.ok(d.els.every(e=>!e.hidden));assert.equal(d.documentElement.dataset.mountain,'gwanak');
});

test('남산은 휴대폰 카메라·땅에 앉기·스테미너·스트레칭·수첩 탭·완등 카드 자리를 숨긴다', ()=>{
 const d=fakeDoc(FRAME_KEYS);const n=applyMountainFeatures(d,NAMSAN_MOUNTAIN);
 const off=new Set(d.els.filter(e=>e.hidden).map(e=>e.dataset.feature));
 assert.deepEqual([...off].sort(),['book','groundSit','phone','stamina','stretch','summitCard']);
 assert.equal(n,d.els.filter(e=>e.hidden).length);assert.equal(d.documentElement.dataset.mountain,'namsan');
 assert.equal(featureFlags(GWANAK.features).groundSit,true);assert.equal(featureFlags(NAMSAN_FEATURES).groundSit,false);
});

test('남산 페이지 = 공통 화면 조각 + 글 먼저 바꾸기 + 남산 본체(관악산 산 고르기·main.js는 안 부름)', ()=>{
 const raw=readFileSync('hiking/namsan/index.html','utf8'),html=readPage('hiking/namsan/index.html'),gw=readPage('hiking/index.html');
 assert.match(raw,/<!--#include src\/frame\/hiking-body\.html-->/);
 assert.match(raw,/<html[^>]*data-mountain="namsan"/);
 const scripts=[...raw.matchAll(/<script type="module" src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(scripts,['/src/mountains/page-text.js','/src/loading-screen.js','/src/namsan/game.js']);
 // 두 페이지 몸통(화면 조각)이 같다
 const body=h=>h.slice(h.indexOf('<div id="loading-screen"'),h.indexOf('<script type="module"',h.indexOf('<div id="loading-screen"')));
 assert.equal(body(html),body(gw));
});

test('남산 글은 조각의 관악산 글 자리를 모두 남산 말로 채운다(연주대·관악산이 남지 않음)', ()=>{
 for(const k of ['pageTitle','loadingTitle','brandEn','goalLabel','canvasLabel','mapSubtitle','startEntrance','startDemo','courseNote','sealName','sealSummit','sealAltitude','terrainCredit','restNote'])assert.equal(typeof NAMSAN_TEXT[k],'string',k);
 for(const [k,v] of Object.entries(NAMSAN_TEXT))if(typeof v==='string')assert.doesNotMatch(v,/연주대|관악산공원|일주문/,k);
 assert.ok(NAMSAN_TEXT.loadingTips.length>=5);
 assert.equal(NAMSAN_MOUNTAIN.text,NAMSAN_TEXT);assert.equal(NAMSAN_MOUNTAIN.features,NAMSAN_FEATURES);
});

test('공통 본체 부품을 두 산이 같이 쓴다(소리·WebGL 끊김 복구·함께 걷기 HUD·수첩 HUD)', ()=>{
 const main=readFileSync('src/main.js','utf8'),ns=readFileSync('src/namsan/game.js','utf8');
 for(const src of [main,ns]){
  assert.match(src,/createHikingSound\(/);assert.match(src,/installContextRecovery\(/);assert.match(src,/installMultiHud\(/);
  assert.match(src,/installNotebookHud\(/);assert.match(src,/installHikingFrame\(/);assert.match(src,/installHudToggle\(/);
 }
 // 남산만 쓰던 따로 만든 화면(큰 단추·할 일 카드·정상 카드·메뉴 탭)은 없어졌다
 assert.doesNotMatch(ns,/createUiFrame|ns-big|ns-ctx|ns-summit|ns-toast/);
 // 남산 페이지는 남산 서버 줄·남산 방
 assert.match(ns,/installMultiHud\(\{[^}]*servers:NAMSAN_SERVERS/);
});
