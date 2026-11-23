// 아이콘 만들기: scripts/icons/defs-*.mjs → public/icons/
//   <묶음>/<이름>.svg(낱개), sprite-<묶음>.svg, sprite.svg(전체), index.json
// 실행: node scripts/build-icons.mjs  (규칙 docs/아이콘교체/아이콘-규칙-v1.md)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/icons');
const POINT = { common: '#b9472f', christmas: '#2f7a52', hiking: '#5f8f3e', smoking: '#c8682f', claw: '#d94a7c' };
const ORDER = ['common', 'christmas', 'hiking', 'smoking', 'claw'];
const INK = '#4a3618';

const groups = [];
for (const g of ORDER) {
  const f = path.join(ROOT, `scripts/icons/defs-${g}.mjs`);
  if (fs.existsSync(f)) groups.push(await import(f));
}

const body = (ic, pt, off) => {
  const fill = off || !ic.f ? '' : `<g fill="var(--ic-point,${pt})" stroke="none">${ic.f}</g>`;
  const cut = off ? '<path d="M4 4l16 16" stroke="var(--ic-paper,#fbf3df)" style="stroke-width:calc(var(--ic-sw,2) + 3px)"/><path d="M4 4l16 16"/>' : '';
  return `${fill}<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="stroke-width:var(--ic-sw,2)">${ic.s}${cut}</g>`;
};

const index = [];
const all = [];
for (const { GROUP, ICONS, OFF = [] } of groups) {
  const dir = path.join(OUT, GROUP);
  fs.mkdirSync(dir, { recursive: true });
  const pt = POINT[GROUP];
  const syms = [];
  const list = Object.entries(ICONS).flatMap(([n, ic]) => [[n, ic, false], ...(OFF.includes(n) ? [[`${n}-off`, ic, true]] : [])]);
  for (const [name, ic, off] of list) {
    const b = body(ic, pt, off);
    fs.writeFileSync(path.join(dir, `${name}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="${INK}">${b}</svg>\n`);
    syms.push(`<symbol id="ic-${name}" viewBox="0 0 24 24">${b}</symbol>`);
    index.push({ name, group: GROUP, file: `icons/${GROUP}/${name}.svg`, symbol: `ic-${name}`, off, spin: !!ic.spin, color: !!ic.color });
  }
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${syms.join('\n')}\n</svg>\n`;
  fs.writeFileSync(path.join(OUT, `sprite-${GROUP}.svg`), sprite);
  all.push(...syms);
  console.log(GROUP, list.length);
}
fs.writeFileSync(path.join(OUT, 'sprite.svg'), `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${all.join('\n')}\n</svg>\n`);
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');
console.log('total', index.length);
