// 크리스마스 「달리기」 단추 자리·누름 규칙(2026-11-18): 오른쪽 세로 줄 빈 칸 고르기, 누르고 있기 기준 시간
import test from 'node:test';
import assert from 'node:assert/strict';
import {placeRun,RUN_HOLD_MS} from '../src/christmas/travel.js';

test('달리기 자리: 겹치는 것이 없으면 기본 자리 그대로',()=>{
 assert.equal(placeRun(318,60,[{y:59,h:48},{y:115,h:48}],{lo:8,hi:632}),318);
});
test('달리기 자리: 위 오른쪽 단추 줄(360×640 노치)과 겹치면 줄 바로 아래 빈 칸으로',()=>{
 // 위 단추 5개(47+12부터 48px·간격 8) → 아래 끝 331. 기본 자리 284는 겹침
 const col=Array.from({length:5},(_,i)=>({y:59+i*56,h:48}));
 const y=placeRun(284,60,col,{lo:8,hi:632,gap:10});assert.equal(y,341);
 for(const b of col)assert.ok(y>=b.y+b.h+10||y+60<=b.y-10);
});
test('달리기 자리: 아래 행동 단추·▲▼와도 떨어진 칸, 칸이 없으면 null',()=>{
 const blocks=[{y:59,h:270},{y:420,h:180}];
 const y=placeRun(400,60,blocks,{lo:8,hi:632,gap:10});assert.equal(y,350);assert.ok(y>=339&&y+60<=410);
 assert.equal(placeRun(300,60,[{y:0,h:300},{y:330,h:300}],{lo:8,hi:632,gap:10}),null);
});
test('누르고 있기 기준 0.35초(톡과 구분)',()=>{assert.equal(RUN_HOLD_MS,350);});
