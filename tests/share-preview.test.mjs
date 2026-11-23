import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// 링크 공유 미리보기 태그 (docs/공유미리보기/공유미리보기-인계-v1.md §3)
const BASE = 'https://engchoon.github.io/ai-office-world/';
const PAGES = [
  { file: 'index.html', path: '', key: 'hub', icon: '/favicon.svg' },
  { file: 'hiking/index.html', path: 'hiking/', key: 'hiking', icon: '/og/favicon-hiking.svg' },
  { file: 'smoking/index.html', path: 'smoking/', key: 'smoking', icon: '/og/favicon-smoking.svg' },
  { file: 'christmas/index.html', path: 'christmas/', key: 'christmas', icon: '/og/favicon-christmas.svg' },
  { file: 'claw/index.html', path: 'claw/', key: 'claw', icon: '/og/favicon-claw.svg' },
];

const head = (file) => readFileSync(file, 'utf8').split('</head>')[0];
const metas = (h, attr) => {
  const out = {};
  for (const m of h.matchAll(new RegExp(`<meta ${attr}="([^"]+)" content="([^"]*)">`, 'g'))) {
    assert.ok(!(m[1] in out), `${m[1]} 중복`);
    out[m[1]] = m[2];
  }
  return out;
};

for (const p of PAGES) {
  test(`공유 미리보기 태그: ${p.file}`, () => {
    const h = head(p.file);
    const og = metas(h, 'property');
    const nm = metas(h, 'name');
    const url = BASE + p.path;
    const img = `${BASE}og/og-${p.key}.png`;

    assert.ok(nm.description?.length > 10);
    assert.match(h, new RegExp(`<link rel="canonical" href="${url}">`));
    assert.equal(og['og:type'], 'website');
    assert.equal(og['og:site_name'], '온라인 메타버스');
    assert.equal(og['og:locale'], 'ko_KR');
    assert.equal(og['og:url'], url);
    assert.ok(og['og:title']);
    assert.equal(og['og:description'], nm.description);
    assert.equal(og['og:image'], img);
    assert.equal(og['og:image:type'], 'image/png');
    assert.equal(og['og:image:width'], '1200');
    assert.equal(og['og:image:height'], '630');
    assert.ok(og['og:image:alt']);
    assert.equal(nm['twitter:card'], 'summary_large_image');
    assert.equal(nm['twitter:title'], og['og:title']);
    assert.equal(nm['twitter:description'], nm.description);
    assert.equal(nm['twitter:image'], img);
    assert.equal(nm['twitter:image:alt'], og['og:image:alt']);
    // meta content 그림 주소는 Vite가 base를 붙이지 않으므로 전체 주소여야 함
    for (const [k, v] of Object.entries({ ...og, ...nm })) {
      if (/image$|url$/.test(k)) assert.ok(v.startsWith('https://'), `${k} 전체 주소`);
    }
    assert.match(h, new RegExp(`<link rel="apple-touch-icon" sizes="180x180" href="/og/icon-${p.key}-180.png">`));
    const icons = [...h.matchAll(/<link rel="icon" href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(icons, [p.icon]);
    assert.ok(existsSync(`public/og/og-${p.key}.png`));
    assert.ok(existsSync(`public/og/icon-${p.key}-180.png`));
    assert.ok(existsSync(`public${p.icon}`));
  });
}
