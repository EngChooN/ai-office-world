// public/icons/sprite.svg(월드아트) 의 <symbol id="ic-이름"> 목록을 읽어 src/icons/available.js 를 다시 만든다.
// 월드아트가 아이콘 파일을 넣거나 바꾼 뒤 `node scripts/icons-sync.mjs`. 대응표에 없는 이름·빠진 이름을 함께 알려 준다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ICON_NAMES, ICON_VARIANTS } from '../src/icons/emoji-map.js';

const SPRITE = 'public/icons/sprite.svg';
const svg = existsSync(SPRITE) ? readFileSync(SPRITE, 'utf8') : '';
const ids = [...svg.matchAll(/<symbol[^>]*\bid="ic-([a-z0-9-]+)"/g)].map(m => m[1]);
const known = new Set(ICON_NAMES);
// `이름-off`(꺼짐 그림) 같은 변형은 원래 이름이 대응표에 있으면 받음
const ok = n => known.has(n) || ICON_VARIANTS.includes(n) || (n.endsWith('-off') && known.has(n.slice(0, -4)));
const unknown = ids.filter(n => !ok(n));
const have = ids.filter(ok).sort();
const missing = ICON_NAMES.filter(n => !have.includes(n));
if (missing.length) console.log('빠짐:', missing.join(' '));

writeFileSync('src/icons/available.js',
  `// scripts/icons-sync.mjs가 만든 파일입니다. 손으로 고치지 마세요. (${SPRITE}에 그림이 있는 아이콘 이름)\n` +
  `export const AVAILABLE_ICONS = new Set(${JSON.stringify(have)});\n`);
console.log(`그림 있음 ${have.filter(n => known.has(n)).length}/${ICON_NAMES.length} · 빠짐 ${missing.length}${unknown.length ? ` · 대응표에 없는 이름 ${unknown.join(', ')}` : ''}`);
