import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { CLAW_POSE, machineHands } from '../src/claw/claw-poses.js';
import { ICONS as CLAW_ICONS } from '../scripts/icons/defs-claw.mjs';
import { ICON_VARIANTS } from '../src/icons/emoji-map.js';
import { AVAILABLE_ICONS } from '../src/icons/available.js';
import { EXPERIENCES } from '../src/hub/experiences.js';

// 인형뽑기 남은 그림(월드아트, 11-23): 동동이 기계 앞 자세·아이콘·공유 미리보기
test('자세 시간은 설계 v1 §5(만세 1초·고개 숙임 0.8초), 몸은 0.3m까지만 붙임', () => {
  assert.equal(CLAW_POSE.cheerSec, 1);
  assert.equal(CLAW_POSE.droopSec, .8);
  assert.ok(CLAW_POSE.reach <= .3);
});

test('손 자리: 집게 = 손잡이·단추, 단추 하나 기계 = 같은 단추 양옆(기계를 돌려도 세계 좌표로)', () => {
  const claw = new THREE.Group();
  claw.userData.spots = { stick: new THREE.Vector3(-.18, .57, .56), button: new THREE.Vector3(.17, .52, .56) };
  claw.position.set(2, 0, -3); claw.rotation.y = Math.PI / 2;
  const [l, r] = machineHands(claw);
  assert.ok(Math.abs(l.x - (2 + .56)) < 1e-6 && Math.abs(l.z - (-3 + .18)) < 1e-6, '손잡이 세계 좌표');
  assert.ok(Math.abs(r.y - .52) < 1e-6);
  const timer = new THREE.Group();
  timer.userData.spots = { button: new THREE.Vector3(0, .52, .56) };
  const [a, b] = machineHands(timer);
  assert.ok(Math.abs(a.x + CLAW_POSE.handGap) < 1e-6 && Math.abs(b.x - CLAW_POSE.handGap) < 1e-6);
  assert.equal(machineHands(new THREE.Group()), null);
});

test('아이콘: 인형뽑기 화면 IC 표·허브 카드 이름이 모두 그림 있음', () => {
  for (const n of Object.keys(CLAW_ICONS)) {
    assert.ok(ICON_VARIANTS.includes(n), `${n} 대응표`);
    assert.ok(AVAILABLE_ICONS.has(n), `${n} 그림`);
  }
  assert.ok(AVAILABLE_ICONS.has('c-exp-claw'));
  const hud = readFileSync('src/claw/claw-hud.js', 'utf8');
  const table = hud.match(/const IC=\{(.*?)\};/)[1];
  for (const [, n] of table.matchAll(/\['([a-z0-9-]+)'/g)) assert.ok(AVAILABLE_ICONS.has(n), `claw-hud ${n}`);
  const claw = EXPERIENCES.find(e => e.id === 'claw');
  for (const n of [claw.icon, ...claw.feats.map(f => f[0])]) assert.ok(AVAILABLE_ICONS.has(n), `허브 ${n}`);
  // 공개 그림(아이콘·공유 카드)에 손님 인형(비공개 자리) 이름이 없음 — 인형은 우리 곰 인형만
  for (const f of ['scripts/icons/defs-claw.mjs', 'public/icons/sprite-claw.svg', 'public/og/favicon-claw.svg']) assert.doesNotMatch(readFileSync(f, 'utf8'), /chiikawa|치이카와|guest/i, f);
});
