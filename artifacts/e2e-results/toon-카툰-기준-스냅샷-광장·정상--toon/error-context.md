# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: toon.spec.mjs >> 카툰 기준 스냅샷(광장·정상)
- Location: tests/e2e/toon.spec.mjs:58:1

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  89961 pixels (ratio 0.09 of all image pixels) are different.

  Snapshot: toon-plaza-day.png

Call log:
  - Expect "toHaveScreenshot(toon-plaza-day.png)" with timeout 60000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 89130 pixels (ratio 0.09 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 89961 pixels (ratio 0.09 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [active]:
  - generic "관악산 정상 접근 3D 시범 공간" [ref=e1]
  - generic:
    - region "등반 정보" [ref=e2]:
      - generic [ref=e3]:
        - generic [ref=e4]: 서 있음
        - strong [ref=e5]:
          - text: "0.0"
          - emphasis [ref=e6]: km/h
        - button "등반 정보 접기" [expanded] [ref=e7] [cursor=pointer]:
          - generic [aria-hidden] [ref=e8]: ▴
      - heading [level=1] [ref=e9]:
        - status [ref=e10]: 출발 전 · 일주문으로 걸어가면 시작돼요
      - generic [ref=e19]:
        - generic [ref=e20]:
          - text: 고도
          - strong [ref=e21]:
            - text: "50"
            - emphasis [ref=e22]: m
        - generic [ref=e23]:
          - text: 걸은
          - strong [ref=e24]: 00:00:00
        - generic [ref=e25]:
          - text: 남은
          - strong [ref=e26]: 98분
      - generic [ref=e27]:
        - generic [ref=e28]: 스테미너
        - progressbar "스테미너" [ref=e29]
        - generic [ref=e31]: "100"
      - generic [ref=e32]:
        - generic "초콜릿 개수" [ref=e33]: 5/5
        - button "먹기" [ref=e35] [cursor=pointer]
      - generic [ref=e37]:
        - generic [ref=e38]: 노면 · 광장 · 포장
        - generic "방위" [ref=e39]: 북 ↑
      - button "시점 바꾸기 (V)" [ref=e40] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e41]
        - generic [ref=e42]: 3인칭 보기
        - generic [ref=e43]: V
    - navigation "수첩 탭" [ref=e44]:
      - button "지도 M" [ref=e45] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e46]
        - generic [ref=e47]: 지도
        - generic [ref=e48]: M
      - button "수첩 J" [ref=e49] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e50]
        - generic [ref=e51]: 수첩
        - generic [ref=e52]: J
      - button "배낭" [ref=e53] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e54]
      - button "쉬기" [ref=e56] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e57]
      - button "설정" [ref=e59] [cursor=pointer]:
        - emphasis [aria-hidden] [ref=e60]
    - generic:
      - status "서울 현재 시각과 날씨" [ref=e62]:
        - generic [ref=e64]: 12:00
        - generic [ref=e65]: 맑음
      - button "소리 켜기/끄기" [pressed] [ref=e66] [cursor=pointer]:
        - generic [ref=e68]: 소리 켜짐
        - generic [ref=e69]: · 화질 높음 · 고정
      - button "라디오 꺼짐 — 눌러서 라디오 올리기" [ref=e70] [cursor=pointer]:
        - generic [ref=e71]: 라디오
    - generic:
      - button "자동 걷기 켜기 (R)" [ref=e73] [cursor=pointer]:
        - generic [ref=e75]: 걷기
        - generic [ref=e76]: 자동 걷기
        - generic [ref=e77]: R
      - button "달리기(누르고 있는 동안)" [ref=e78] [cursor=pointer]:
        - generic [aria-hidden] [ref=e79]: »
        - generic [ref=e80]: 달리기
        - generic [ref=e81]: Shift
      - button "쌍안경 B" [ref=e82] [cursor=pointer]:
        - generic [ref=e84]: 쌍안경
        - generic [ref=e85]: B
      - button "휴대폰 P" [ref=e86] [cursor=pointer]:
        - generic [ref=e88]: 휴대폰
        - generic [ref=e89]: P
      - button "앉기 C" [ref=e90] [cursor=pointer]:
        - generic [ref=e92]: 앉기
        - generic [ref=e93]: C
    - contentinfo:
      - generic:
        - generic: W
        - generic: A
        - generic: S
        - generic: D
        - text: 걷기
        - generic: · 드래그 둘러보기
  - generic:
    - generic: H
    - text: 다시 보기
  - status
```

# Test source

```ts
  1  | // 카툰 e2e(기획서 §4, 2026-11-06 실사 모드 제거 뒤 카툰 하나). 청크 대기 뒤 확인·캡처한다.
  2  | // 빌드본이 필요하다: npm run build 후 npm run test:e2e.
  3  | import {test,expect} from '@playwright/test';
  4  | import {mkdirSync} from 'node:fs';
  5  | 
  6  | // 실사 전용 에셋·코드는 배포에서 빠졌다. 받으려 하면(404 포함) 실사 경로가 남은 것이다.
  7  | const FORBIDDEN=[/-diff\.jpg(\?|$)/,/-nor_gl\.png(\?|$)/,/-rough\.jpg(\?|$)/,/\.hdr(\?|$)/,/\/assets\/realistic\/generated\/nature\//,/\/assets\/realistic\/models\//,/terrain-material\.js/,/RGBELoader/,/SSAOPass/];
  8  | const TIMES={day:'12:00',sunset:'17:20',night:'21:00'};
  9  | const SHOTS='artifacts/e2e-2026-11-05';
  10 | 
  11 | async function openGame(page,{time='12:00',start='entrance'}={}){
  12 |  const errors=[],requests=[];
  13 |  page.on('pageerror',e=>errors.push(e.message));
  14 |  page.on('request',r=>requests.push(r.url()));
  15 |  await page.goto(`/hiking/?start=${start}&time=${time}&weather=clear&season=autumn&quality=high`);
  16 |  await page.waitForFunction(()=>window.hiking?.started===true||window.hiking?.loading?.().phase==='error',null,{timeout:300000});
  17 |  expect(await page.evaluate(()=>window.hiking.started),'게임 시작').toBe(true);
  18 |  return {errors,requests};
  19 | }
  20 | async function settle(page,ms=3000){
  21 |  await page.evaluate(()=>window.hiking.chunks.ready());
  22 |  await page.waitForFunction(()=>{const s=window.hiking.chunks.status();return s.pending===0&&(!s.vegetation||s.vegetation.pending===0)&&!window.hiking.rendering().compiling;},null,{timeout:120000});
  23 |  await page.waitForTimeout(ms);
  24 | }
  25 | async function jump(page,id){
  26 |  expect(await page.evaluate(id=>window.hiking.jumpTo(id),id),`이동 ${id}`).toBe(true);
  27 |  await settle(page);
  28 | }
  29 | const forestTarget=page=>page.evaluate(()=>{const ids=window.hiking.jumpTargets().filter(id=>!['plaza','gate','summit'].includes(id));return ids[Math.floor(ids.length/2)];});
  30 | 
  31 | test('시작·청크 준비·실사 에셋 요청 없음',async({page})=>{
  32 |  const {errors,requests}=await openGame(page);
  33 |  await settle(page);
  34 |  const status=await page.evaluate(()=>window.hiking.chunks.status());
  35 |  expect(status.loaded,'출발점 주변 지형 청크').toBeGreaterThan(0);
  36 |  const bad=requests.filter(u=>FORBIDDEN.some(re=>re.test(u)));
  37 |  expect(bad,'실사 전용 요청').toEqual([]);
  38 |  expect(await page.evaluate(()=>window.hiking.style)).toBe('toon');
  39 |  expect(errors,'페이지 오류').toEqual([]);
  40 | });
  41 | 
  42 | test('정상 왕복 후 청크 해제·메모리 복귀',async({page})=>{
  43 |  const {errors}=await openGame(page);
  44 |  await settle(page);
  45 |  const mem=()=>page.evaluate(()=>window.hiking.chunks.status().memory);
  46 |  await jump(page,'summit');await jump(page,'plaza');
  47 |  const base=await mem();
  48 |  await jump(page,'summit');
  49 |  const disposed=await page.evaluate(()=>window.hiking.chunks.status().disposed);
  50 |  await jump(page,'plaza');
  51 |  const back=await mem();
  52 |  expect(disposed.geometries,'해제된 청크 지오메트리').toBeGreaterThan(0);
  53 |  expect(Math.abs(back.geometries-base.geometries),'geometries 복귀').toBeLessThanOrEqual(10);
  54 |  expect(Math.abs(back.textures-base.textures),'textures 복귀').toBeLessThanOrEqual(4);
  55 |  expect(errors).toEqual([]);
  56 | });
  57 | 
  58 | test('카툰 기준 스냅샷(광장·정상)',async({page})=>{
  59 |  await openGame(page);
  60 |  await settle(page);
> 61 |  await expect(page).toHaveScreenshot('toon-plaza-day.png');
     |                     ^ Error: expect(page).toHaveScreenshot(expected) failed
  62 |  await jump(page,'summit');
  63 |  await expect(page).toHaveScreenshot('toon-summit-day.png');
  64 | });
  65 | 
  66 | for(const [label,time] of Object.entries(TIMES)){
  67 |  test(`카툰 캡처 ${label} × 숲·정상 전망`,async({page})=>{
  68 |   mkdirSync(SHOTS,{recursive:true});
  69 |   const {errors}=await openGame(page,{time});
  70 |   await settle(page);
  71 |   await jump(page,await forestTarget(page));
  72 |   await page.screenshot({path:`${SHOTS}/toon-${label}-forest.png`});
  73 |   await jump(page,'summit');
  74 |   await page.screenshot({path:`${SHOTS}/toon-${label}-summit.png`});
  75 |   expect(errors).toEqual([]);
  76 |  });
  77 | }
  78 | 
```