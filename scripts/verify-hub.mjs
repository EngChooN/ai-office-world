// 허브 개선(11-17) 점검: PC 1920×1080(마을 지도)·휴대폰 세로 390×844·가로 844×390(카드 목록)을 찍고
// 옆 넘침·콘솔 오류·4칸이 한 화면에 보이는지·단추 44px를 재고, 허브에서 서버를 골라 세 체험에 들어가 서버 창 없이 그 서버에 붙는지 본다.
// 개발 서버를 먼저 띄운다(함께 걷기 서버도): VITE_MULTI_SERVER_URL=ws://127.0.0.1:8787 npx vite --port 5173
//   BASE_URL=http://127.0.0.1:5173 node scripts/verify-hub.mjs → artifacts/hub-2026-11-17/
// PART=shots,enter,settings (기본 모두)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173', OUT = process.env.OUT_DIR ?? 'artifacts/hub-2026-11-17';
const PART = new Set((process.env.PART ?? 'shots,enter,settings').split(','));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const report = { shots: [], enter: [], settings: null };
let fail = 0;
const bad = (m) => { fail++; console.log('  ✗', m); };
async function open(w, h, mobile) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, page, errors };
}
const waitServers = page => page.waitForFunction(() => window.hub?.state?.net && window.hub.state.net !== 'checking', null, { timeout: 15000 }).catch(() => {});

if (PART.has('shots')) {
  const VIEWS = [['pc', 1920, 1080, false], ['pc-1280', 1280, 800, false], ['mobile', 390, 844, true], ['land', 844, 390, true]];
  for (const [name, w, h, mobile] of VIEWS) for (const time of ['day', 'night']) {
    if (time === 'night' && name === 'pc-1280') continue;
    const { ctx, page, errors } = await open(w, h, mobile);
    await page.goto(`${BASE}/?hubtime=${time}`); await page.waitForSelector('html.hub-ready'); await waitServers(page); await page.waitForTimeout(700);
    const m = await page.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth, vh = innerHeight;
      const tiles = [...document.querySelectorAll('[id^="hub-"]')].map(e => { const r = e.getBoundingClientRect(); return { id: e.id, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) }; });
      const small = [...document.querySelectorAll('#hub button, #hub a')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && !e.closest('[hidden]'); }).map(e => `${e.className||e.tagName}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
      const emoji = document.querySelectorAll('#hub .ic-emoji').length;
      return { layout: window.hub.state.layout, net: window.hub.state.net, overflowX: de.scrollWidth - vw, docH: de.scrollHeight, vh, tiles, allVisible: tiles.length === 4 && tiles.every(t => t.top >= 0 && t.bottom <= vh + 1 && t.left >= 0 && t.right <= vw + 1), small, emoji };
    });
    await page.screenshot({ path: `${OUT}/${name}-${time}.png` });
    const r = { name, time, ...m, errors };
    report.shots.push(r);
    console.log(`${name}/${time}: ${m.layout} 서버=${m.net} 옆넘침=${m.overflowX} 4칸한화면=${m.allVisible} 작은단추=${m.small.length} 이모지=${m.emoji} 오류=${errors.length}`);
    if (m.overflowX > 0) bad(`${name} 옆 넘침 ${m.overflowX}px`);
    if (!m.allVisible) bad(`${name} 4칸이 한 화면에 다 안 보임 ${JSON.stringify(m.tiles)}`);
    if (m.small.length) bad(`${name} 44px 안 되는 단추 ${m.small.join(', ')}`);
    if (m.emoji) bad(`${name} 이모지 대신 ${m.emoji}`);
    if (errors.length) bad(`${name} 콘솔 오류 ${errors.join(' | ')}`);
    if (time === 'day') {
      // 체험 하나 고르기: PC는 판이 바뀌고, 휴대폰은 아래 판이 열린다
      await page.click('#hub-christmas'); await page.waitForTimeout(500);
      const s = await page.evaluate(() => ({ sel: window.hub.state.sel, sheet: window.hub.state.sheet, srv: document.querySelectorAll('.hb-panel [data-srv]').length, go: document.querySelector('.hb-panel .hb-go')?.textContent.trim(), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        goBox: (() => { const r = document.querySelector('.hb-panel .hb-go')?.getBoundingClientRect(); return r ? { top: Math.round(r.top), bottom: Math.round(r.bottom) } : null; })() }));
      await page.screenshot({ path: `${OUT}/${name}-pick.png` });
      console.log(`   고르기: ${s.sel} 판=${s.sheet} 서버줄=${s.srv} 단추="${s.go}" 단추위치=${JSON.stringify(s.goBox)}`);
      if (s.sel !== 'christmas') bad(`${name} 크리스마스가 골라지지 않음`);
      if (s.overflowX > 0) bad(`${name} 판 열 때 옆 넘침`);
      if (s.goBox && s.goBox.bottom > h + 1) bad(`${name} 들어가기 단추가 화면 밖(${s.goBox.bottom}>${h})`);
      r.pick = s;
    }
    await ctx.close();
  }
}

if (PART.has('enter')) {
  // 허브에서 서버를 골라 들어가기 → 체험이 서버 창 없이 그 서버 방에 붙는다. 혼자 하기 → 창 없이 혼자.
  const CASES = [
    ['christmas', 'server', '2', 1280, 800, false, () => ({ joined: window.xmas?.status?.()?.multi?.joined ?? null, room: window.xmas?.status?.()?.multi?.room ?? null, pickOpen: !!document.querySelector('.sp-wrap:not([hidden])') })],
    ['smoking', 'server', '3', 390, 844, true, () => ({ joined: window.lounge?.multi?.status?.()?.joined ?? null, room: window.lounge?.multi?.status?.()?.room ?? null, pickOpen: !!document.querySelector('.sp-wrap:not([hidden])') })],
    ['hiking', 'server', '2', 1280, 800, false, () => { const m = window.hiking?.multi?.(); return { joined: m ? m.status === 'online' : null, room: m?.room ?? null, state: m?.status ?? null, started: !!window.__hikingStartRequested, pickOpen: !!document.querySelector('.sp-wrap:not([hidden])') }; }],
    ['christmas', 'solo', null, 390, 844, true, () => ({ joined: window.xmas?.status?.()?.multi?.joined ?? null, pickOpen: !!document.querySelector('.sp-wrap:not([hidden])') })],
    ['christmas', 'direct', null, 1280, 800, false, () => ({ pickOpen: !!document.querySelector('.sp-wrap:not([hidden])') })],
  ];
  for (const [exp, kind, srv, w, h, mobile, probe] of CASES) {
    const { ctx, page, errors } = await open(w, h, mobile);
    if (kind === 'direct') {
      // 허브를 거치지 않고 바로 들어오면 예전처럼 서버 고르기 창(점검 브라우저는 ?serverpick=on)
      await page.goto(`${BASE}/${exp}/?serverpick=on`);
    } else {
      await page.goto(`${BASE}/`); await page.waitForSelector('html.hub-ready'); await waitServers(page);
      await page.click(`#hub-${exp}`); await page.waitForTimeout(300);
      if (kind === 'server') { await page.click(`.hb-panel [data-srv="${srv}"]`); await page.waitForTimeout(150); }
      const sel = kind === 'server' ? `.hb-panel [data-enter="server"][data-server="${srv}"]` : `.hb-panel [data-enter="solo"]`;
      await Promise.all([page.waitForURL(new RegExp(`/${exp}/`)), page.click(sel)]);
      if (exp === 'hiking') { await page.waitForTimeout(500); }
    }
    let got = null;
    for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); got = await page.evaluate(probe); if (kind === 'direct' ? got.pickOpen : kind === 'solo' ? got.joined === false || (got.joined === null && i > 20) : got.joined) break; }
    await page.waitForTimeout(kind === 'direct' ? 800 : 2500); got = await page.evaluate(probe);
    await page.screenshot({ path: `${OUT}/enter-${exp}-${kind}.png` });
    console.log(`들어가기 ${exp}/${kind}${srv ? ' ' + srv + '서버' : ''}: ${JSON.stringify(got)} 오류=${errors.length}`);
    report.enter.push({ exp, kind, srv, ...got, errors });
    if (kind === 'server' && (!got.joined || got.pickOpen)) bad(`${exp} 허브에서 고른 서버로 바로 붙지 않음`);
    if (kind === 'server' && got.room && !String(got.room).endsWith(`-${srv}`) && !(srv === '1')) bad(`${exp} 다른 방(${got.room})`);
    if (kind === 'solo' && (got.joined || got.pickOpen)) bad(`${exp} 혼자 하기인데 서버 창·참가`);
    if (kind === 'direct' && !got.pickOpen) bad(`${exp} 직접 들어왔는데 서버 창이 안 뜸`);
    const real = errors.filter(e => !/WebGL|GPU stall|favicon|404/i.test(e));
    if (real.length) bad(`${exp}/${kind} 콘솔 오류 ${real.join(' | ')}`);
    await ctx.close();
  }
}

if (PART.has('settings')) {
  // 허브 설정 → 같은 저장값을 체험이 읽는다(소리 끔·캐럴 끔·시간대)
  const { ctx, page, errors } = await open(390, 844, true);
  await page.goto(`${BASE}/`); await page.waitForSelector('html.hub-ready');
  await page.click('[data-a=settings]'); await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/mobile-settings.png` });
  await page.click('[data-set=sound][data-v=false]'); await page.click('[data-set=music][data-v=false]'); await page.click('[data-set=hubTime][data-v=night]');
  await page.fill('input[name=hb-name]', '허브점검');
  const hubSide = await page.evaluate(() => ({ shared: JSON.parse(localStorage.getItem('aoworld:settings:v1')), name: localStorage.getItem('gwanak-multi-name'), time: document.documentElement.dataset.hubTime }));
  await page.click('[data-a=settings-close]');
  await page.goto(`${BASE}/christmas/?serverpick=off`);
  let x = null; for (let i = 0; i < 40; i++) { await page.waitForTimeout(1000); x = await page.evaluate(() => window.xmas?.status?.()?.audio ?? null); if (x) break; }
  report.settings = { hubSide, christmasAudio: x ? { muted: x.muted, carolOn: x.carol?.on } : null, errors };
  console.log('설정:', JSON.stringify(report.settings));
  if (!hubSide.shared || hubSide.shared.sound !== false || hubSide.shared.music !== false || hubSide.time !== 'night' || hubSide.name !== '허브점검') bad('허브 설정 저장 안 됨');
  if (!x || x.muted !== true || x.carol?.on !== false) bad('크리스마스가 허브 설정(소리 끔·캐럴 끔)을 따르지 않음');
  await ctx.close();
}
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
await browser.close();
console.log(fail ? `실패 ${fail}건` : '모두 통과');
process.exit(fail ? 1 : 0);
