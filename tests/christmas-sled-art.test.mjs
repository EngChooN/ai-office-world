// 썰매 경주 그림 다듬기(월드아트, 2026-11-18): 줄 색·줄 색 판 자리·굽이 눈둑 값·눈싸움 취소 아이콘 연결.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {XMAS} from '../src/christmas/palette.js';
import {LANE_COLORS} from '../src/christmas/sled-play.js';
import {laneOffset} from '../src/christmas/sled.js';
import {WIDE_W} from '../src/christmas/sled-course.js';

test('줄 색: 그림(바닥 판·깃발)과 위 띠 참가자 칩이 같은 색 — 1 빨강·2 초록·3 파랑·4 노랑', () => {
  assert.deepEqual([...XMAS.lane], [...LANE_COLORS]);
});

test('출발대 줄 색 판: 4줄이 출발 직선(7m) 안에 들고 판끼리 겹치지 않음', async () => {
  const src = readFileSync('src/christmas/sled-course-art.js', 'utf8');
  const len = +src.match(/LANE_PLATE=Object\.freeze\(\{len:([\d.]+)\}\)/)[1];
  const gap = Math.abs(laneOffset(2) - laneOffset(1));
  assert.ok(gap >= 1.4 - 1e-9, `줄 간격 ${gap}`);
  // 판 넷 전체 폭 = 줄 간격 × 4, 길 폭 안(양쪽 눈둑 자리 0.32m 빼고)
  assert.ok(gap * 4 <= WIDE_W - .64, `판 폭 ${gap * 4}`);
  // 판 가운데 = 줄 자리(출발선 1.5m 뒤), 판 앞 끝이 출발선을 넘지 않음
  assert.ok(1.5 - len / 2 >= 0, `판 앞 끝 ${1.5 - len / 2}`);
});

test('굽이 바깥 눈둑: 안쪽 가장자리는 그대로(길 폭/2 − 0.14m), 바깥으로만 높고 두꺼워짐', () => {
  const src = readFileSync('src/christmas/sled-course-art.js', 'utf8');
  assert.match(src, /o0=sd\*\(p\.W\/2-\.14\+wd\)/);
  assert.match(src, /TURN_BANK=Object\.freeze\(\{from:\.05,to:\.14,h:\.36,wide:\.3/);
});

test('길 띠는 위를 보게 감김(아래를 보면 위에서 안 보임)', () => {
  const src = readFileSync('src/christmas/sled-course-art.js', 'utf8');
  assert.match(src, /idx\.push\(a,a\+1,b,b,a\+1,b\+1\)/);
});

test('눈싸움 취소 ✕: 전용 아이콘(x-throw-cancel)이 그림 묶음에 있고 화면이 그것을 씀', () => {
  const sprite = readFileSync('public/icons/sprite.svg', 'utf8');
  assert.match(sprite, /id="ic-x-throw-cancel"/);
  const play = readFileSync('src/christmas/snowfight-play.js', 'utf8');
  assert.match(play, /icon\('x-throw-cancel'/);
  assert.doesNotMatch(play, /cancelEl\.innerHTML=icon\('c-close'/);
});

test('마을 「썰매 경주」 판: 그림은 race-board-art.js, sled-play.js는 상태만 넘김', () => {
  const play = readFileSync('src/christmas/sled-play.js', 'utf8');
  assert.match(play, /buildRaceBoardArt\(\{tz,doc,mobile\}\)/);
  assert.match(play, /art\.paint\(\{phase,n,max:RACE\.max,left,online,top:/);
});
