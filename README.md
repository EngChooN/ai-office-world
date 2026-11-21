# 온라인 메타버스 — 산길(관악산·남산)·흡연장·크리스마스

Three.js + Vite 웹 3D 프로젝트입니다. 저장소 하나에 체험 여러 개가 들어 있고, 배포는 GitHub Pages 한 곳(`https://engchoon.github.io/ai-office-world/`)입니다.

> **에이전트·새 작업자는 먼저 [AGENTS.md](AGENTS.md)를 읽으세요.** 현재 상태·결정 기록·코드 지도는 그 문서와 최신 `docs/변경기록-*`가 정식입니다.
> 2026-11-02 실사 모드 시절의 옛 README(실사 룩·HDRI·SSAO·속도 보정표 등)는 [docs/옛기록/README-실사모드시절-2026-11-02.md](docs/옛기록/README-실사모드시절-2026-11-02.md)에 보관했습니다. 실사 모드는 11-06에 화면에서, 11-19에 코드에서 지워서 그 설명은 지금 동작하지 않습니다.

## 체험 목록

| 주소 | 내용 |
|---|---|
| `/` | 허브: 체험 고르기 (`src/hub/`) |
| `/hiking/` | 온라인 등산: 산을 고르고 **관악산**(실제 GPX 337점, 약 5.1km, 연주대까지)이나 **남산**을 걷습니다 |
| `/smoking/` | 온라인 흡연장 |
| `/christmas/` | 온라인 크리스마스 |

## 온라인 등산에서 되는 것

- **그래픽은 카툰 한 가지**입니다. 낮은 「젤다: 야생의 숨결」, 노을·밤은 「너의 이름은」 느낌이고 주인공은 등산객 동동이입니다. 시간대(낮·노을·밤)·날씨·계절(봄 벚꽃·여름·가을 단풍·겨울 눈)을 고를 수 있습니다.
- **걷기·시점:** 걷기·달리기·자동 걷기, 1인칭/3인칭, 둘러보기, 지도와 스탬프 수첩, 완등 도장, 구간 이동(개발용). 일시정지는 없습니다.
- **기구:** 쌍안경(도심·랜드마크 이름표)과 **휴대폰 카메라**(줌 0.5~5x·셀카·셔터 소리·사진 저장). 관악산과 남산 둘 다 됩니다(남산 휴대폰 카메라는 11-21).
- **즐길거리:** 산스장, 초콜릿, 벤치·차 마시기, 동물, 먼지털이기, 헥헥 등. 소리는 발소리(재질별), 바람·새·계곡 환경음, 라디오를 넣었습니다.
- **함께 걷기:** `?multi=방이름&server=wss://…`로 같은 방에 모여 서로의 걷기·앉기·기구·셀카·즐길거리 동작을 보고, 채팅으로 대화합니다. 산마다 서버가 3개(관악산 1·2·3, 남산 1·2·3)입니다. 서버는 `npm run server`(운영은 `docs/멀티-서버-운영안내.md`).
- **휴대폰:** 떠다니는 조이스틱, HUD 버튼(단축키만 있는 기능 없음), 메모리 상한(`src/device-profile.js`).
- **참고하는 실제 자료**는 산 모양(지형)·코스(GPX)·서울 도심 풍경뿐이고, 나머지(시설·동물·소품·즐길거리)는 게임 속 환경입니다.

## 실행

Node 24가 필요합니다. 기본 PATH에 npm이 없으면 `. ~/.nvm/nvm.sh && nvm use 24`를 먼저 합니다.

```sh
npm run dev          # 개발 서버 127.0.0.1:5173
npm test             # 단위 테스트(node --test tests/*.test.mjs, 1,090개)
npm run test:e2e     # Playwright
npm run build        # vite build + scripts/copy-assets.mjs
npm run server       # 함께 걷기 서버
npm run multi:up     # 서버 + Cloudflare Quick Tunnel
npm run deploy -- --dry   # 빌드·크기 점검만 (실제 deploy는 대표 지시 때만)
npm run reels        # 인스타 릴스 영상 자동 녹화·편집(artifacts/reels/)
```

등산 주소 옵션(`/hiking/` 뒤): `?start=entrance|summit`, `?multi=방&server=…`, `?pick=on|off`, `?season=`, `?time=`, `?weather=`, `?quality=`. 전체 목록은 AGENTS.md §5입니다. 점검 스크립트(Playwright)에서는 산 고르기가 자동으로 빠집니다(`?pick=on`으로 켬).

## 점검 스크립트 예

- 함께 걷기 동작: `node scripts/verify-multi-act-hiking.mjs`, 캡처 `scripts/capture-multi-act-hiking.mjs`
- 휴대폰 기구: `scripts/verify-mobile-gadgets.mjs`, 남산 카메라: `scripts/verify-namsan-camera.mjs`
- 화면 캡처 전반: `scripts/capture-*.mjs`

## 자료·소리 출처

- 지형·코스: 실제 GPX와 공개 지형 자료를 쓰며 출처·이용 조건은 `data/` 안 자료 문서와 앱 안의 출처 줄에 있습니다(Open-Meteo·OSM 등).
- 소리: `public/sounds/CREDITS.md`에 CC0와 CC BY 3.0 출처를 구분해 적었습니다.
- 주변 지형·시설·노면은 게임용 재현이며, 실제 관악산의 현장 정확성을 승인한 결과가 아닙니다. 관악산을 아는 사람의 확인이 필요합니다.
