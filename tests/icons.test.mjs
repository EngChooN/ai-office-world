import test from 'node:test';
import assert from 'node:assert/strict';
import { ICON_NAMES, ICON_FALLBACK, EMOJI_ICONS, ICON_VARIANTS } from '../src/icons/emoji-map.js';
import { AVAILABLE_ICONS } from '../src/icons/available.js';
import { icon, iconText, hasIcon, ICON_SIZES } from '../src/icons/icon.js';

test('대응표: 아이콘 178개(공통 65·등산 40·흡연장 31·크리스마스 42), 화면 UI 130종', () => {
  assert.equal(ICON_NAMES.length, 178);
  const by = p => ICON_NAMES.filter(n => n.startsWith(p)).length;
  assert.deepEqual([by('c-'), by('h-'), by('s-'), by('x-')], [65, 40, 31, 42]);
  assert.equal(Object.keys(EMOJI_ICONS).length, 130);
  for (const ns of Object.values(EMOJI_ICONS)) for (const n of ns) assert.ok(ICON_NAMES.includes(n), n);
  for (const n of ICON_NAMES) assert.ok(ICON_FALLBACK[n], `${n} 대신 글자 없음`);
});

test('그림 있는 이름은 모두 대응표 안', () => {
  for (const n of AVAILABLE_ICONS) assert.ok(ICON_NAMES.includes(n) || ICON_NAMES.includes(n.replace(/-off$/, '')) || ICON_VARIANTS.includes(n), n);
});

test('그림이 없으면 지금 이모지를 그대로 보여 줌', () => {
  const name = ICON_NAMES.find(n => !hasIcon(n));
  if (!name) return;
  const html = icon(name, { size: 'm' });
  assert.match(html, /ic-emoji/);
  assert.ok(html.includes(ICON_FALLBACK[name]));
  assert.match(html, /aria-hidden="true"/);
});

test('크기 5단계와 화면 읽기 이름', () => {
  assert.deepEqual(Object.values(ICON_SIZES), [14, 18, 22, 28, 40]);
  assert.match(icon('c-settings', { size: 'zz' }), /ic-s\b/);
  const h = icon('c-settings', { size: 'm', label: '설정 "열기"' });
  assert.match(h, /role="img" aria-label="설정 &quot;열기&quot;"/);
});

test('글 + 아이콘: 아이콘 앞, after면 글 뒤, 글은 이스케이프', () => {
  const a = iconText('x-gift', '<보내기>');
  assert.ok(a.indexOf('data-ic') < a.indexOf('ic-txt'));
  assert.ok(a.includes('&lt;보내기&gt;'));
  const b = iconText('c-enter', '들어가기', { after: true });
  assert.ok(b.indexOf('ic-txt') < b.indexOf('data-ic'));
});
