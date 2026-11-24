// 공통 바텀시트(11-24 대표 결정, src/ui-sheet.js) — 닫기 기준·고무줄·짧은 창·자리 방식, 7종 창이 같은 부품을 쓰는지
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEET_RULES as R,shouldClose,rubber,isShort,sheetMode,SHEET_MEDIA} from '../src/ui-sheet.js';
const src=f=>readFileSync(new URL(`../src/${f}`,import.meta.url),'utf8');

test('쓸어 닫기: 창 크기의 25% 이상 또는 빠르게(초당 600px·24px 이상)면 닫힘, 덜 내리면 제자리', ()=>{
 assert.equal(R.closeFrac,.25);assert.equal(R.flingV,600);assert.equal(R.flingMin,24);assert.equal(R.top,64);
 assert.ok(shouldClose(195,780,0),'390×844 세로 ☰(780px)에서 195px');assert.ok(!shouldClose(194,780,0));
 assert.ok(shouldClose(30,780,800),'빠르게 튕김');assert.ok(!shouldClose(20,780,2000),'24px 안의 빠른 움직임은 누르기');assert.ok(!shouldClose(100,780,500));
 assert.ok(shouldClose(85,340,0),'가로 판 340px의 25%');
});
test('위(여는 쪽)로 끌면 고무줄 30%·최대 24px, 아래는 1:1', ()=>{
 assert.equal(rubber(120),120);assert.equal(rubber(-40),-12);assert.equal(rubber(-200),-24);
});
test('짧은 창 = 내용이 화면 절반보다 짧을 때만 내용 높이', ()=>{assert.ok(isShort(300,844));assert.ok(!isShort(422,844));});
test('자리 방식: 휴대폰 가로 = side, PC = pc, 나머지(세로·좁고 긴 창) = bottom', ()=>{
 const W=q=>({matchMedia:m=>({matches:q.includes(m)})});
 assert.equal(sheetMode(W([SHEET_MEDIA.side])),'side');assert.equal(sheetMode(W([SHEET_MEDIA.pc])),'pc');assert.equal(sheetMode(W([])),'bottom');assert.equal(sheetMode({}),'bottom');
 assert.deepEqual({...R.dim},{bottom:.4,side:.15,pc:0},'뒤 어둡게 세로 40%·가로 15%·PC 0');
});
test('7종 창이 같은 부품: ☰(크리스마스 사람·옷 포함)·크리스마스 선물·지도·등산 사람 목록·허브 체험 판', ()=>{
 assert.match(src('ui-frame.js'),/attachSheet\(sheet,\{[^}]*tall:true/);
 assert.match(src('christmas/hud.js'),/TAB_OF=\{people:'set',outfit:'outfit'/,'크리스마스 사람 목록·옷은 ☰ 탭 안');
 assert.match(src('christmas/gift-ui.js'),/for\(const s of \[sheet,inbox\]\)attachSheet\(/);
 assert.match(src('christmas/travel-ui.js'),/attachSheet\(map,\{[^}]*tall:true[^}]*noSwipe:'\.xt-board'/,'지도 판 위는 쓸기 제외');
 assert.match(src('pair-ui.js'),/attachSheet\(sheet,/);assert.match(src('hub/hub.js'),/attachSheet\(sh,/);
 assert.match(src('ui-frame.css'),/^@import '\.\/ui-sheet\.css';/);assert.match(src('hub/hub.css'),/^@import '\.\.\/ui-sheet\.css';/);
});
test('위 64px만 남김·PC Esc 표시·인형뽑기 판 진행 중엔 ☰ 안 열림', ()=>{
 const css=src('ui-sheet.css');
 assert.match(css,/--ufs-top:calc\(env\(safe-area-inset-top,0px\) \+ 64px\)/);
 assert.match(css,/\.ufs\[data-ufs-mode=bottom\]:not\(\[data-ufs-short\]\)\{height:calc\(100dvh - var\(--ufs-top\)\)!important\}/);
 assert.match(css,/@media \(hover:hover\) and \(pointer:fine\)\{\.ufs\[data-ufs-mode=pc\] \.ufs-esc\{display:inline-flex/);
 assert.match(src('ui-frame.js'),/if\(on&&\/\^\(play\|drop\)\$\/\.test\(root\.dataset\.clawMode/);
});
