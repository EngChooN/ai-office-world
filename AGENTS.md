# AGENTS.md — 이 저장소에서 일하는 에이전트가 먼저 읽을 문서

새 대화·새 에이전트는 이전 맥락을 모릅니다. 작업 전에 이 문서를 먼저 읽으세요.
이 문서는 **현재 상태와 이미 내린 결정**을 모아 둔 곳입니다. 결정이 바뀌면 아래 「결정 기록」에 한 줄을 추가하고, 낡은 내용은 고쳐 두세요.

- 마지막 정리: 2026-11-08 (산풍경, 흡연장 같이 피우기 연결)
- `README.md`는 11-02~03 실사 모드 시절의 설명이 많이 남아 있어 **현재 상태와 다릅니다**. 이 문서와 최신 `docs/변경기록-*`을 우선하세요.

---

## 0. 저장소 구성 — 「온라인 메타버스」 (2026-11-08 통합)

- 이 저장소 하나에 체험 여러 개가 들어 있습니다. Vite 다중 페이지입니다(`vite.config.js`의 `PAGES`).
  - `/` = **허브**(체험 고르기). `index.html` → `src/hub/main.js`. 정식 화면은 `src/hub/hub.js`(카드 그리기·시간대)·`hub.css`·`experiences.js`(체험 목록: 배열에 한 줄 더하면 카드가 늘어남). three.js 없음, 카드 그림은 인라인 SVG. 시험용 `/?hubtime=day|dusk|night`.
  - `/hiking/` = **온라인 등산**(아래 §1~§9). `hiking/index.html` → `src/mountain-pick.js`·`src/main.js`.
  - `/smoking/` = **온라인 흡연장**(아래 §10). `smoking/index.html` → `src/lounge/main.js`.
  - `/christmas/` = **온라인 크리스마스**(11-16, §6 코드 지도). `christmas/index.html` → `src/christmas/main.js`.
- **옛 주소 유지:** 루트 `/`에 등산 옵션(`multi`·`server`·`start`·`season`·`time`·`weather`·`pick`·`dev` 등, 목록은 `src/hub/legacy-redirect.js`의 `HIKING_PARAMS`)이 붙어 오면 쿼리·해시 그대로 `/hiking/`로 `location.replace` 합니다. 공유했던 `/?multi=방&server=…` 주소가 계속 됩니다.
- **에셋은 한 벌:** `public/`·`assets/`를 세 페이지가 같이 씁니다. 코드에서 에셋 주소는 늘 `${import.meta.env.BASE_URL}assets/…`처럼 BASE_URL 기준으로 씁니다(페이지가 하위 폴더라 상대 경로 `assets/…`는 깨집니다).
- **공용 코드도 한 벌:** `src/lounge/` 밖의 파일(`src/toon/**`·`hiker-*`·`daytime`·`device-profile` 등)은 등산 원본이고 흡연장이 그대로 import 합니다. 공용 파일을 고치면 **등산과 흡연장 둘 다** 테스트·캡처로 확인하세요.
- 배포는 GitHub Pages 하나(`…/ai-office-world/` 허브, `…/hiking/`, `…/smoking/`). **저장소 이름은 11-14 대표 결정으로 `gwanak-hiking` → `ai-office-world`**(옛 주소는 이동 페이지 없이 끊김). 내 맥의 작업 폴더 이름 `~/gwanak-hiking`과 저장 키(`gwanak-hiking:v1` 등)는 그대로 둡니다(바꾸면 사용자 기록이 사라짐).
- 원래 흡연장 폴더 `~/online-smoking`은 지우지 않고 남겨 두었습니다(대표가 정리). 앞으로 흡연장 작업은 이 저장소에서 합니다.

## 1. 무엇을 만드는가 (온라인 등산)

- **관악산 온라인 등반 체험**입니다. 실제 관악산공원 입구(서울대 옆 광장·일주문)에서 계곡길·깔딱고개를 지나 연주대 정상까지 걷습니다.
- 웹 3D로 만듭니다. Three.js + Vite이고 서버는 없습니다(정적 사이트).
- 그래픽은 **카툰 한 가지**입니다. 낮은 「젤다: 야생의 숨결」, 노을·밤은 「너의 이름은」 느낌입니다. 실사 모드는 2026-11-06에 화면에서 없앴고, 남은 코드는 11-19에 지웠습니다(`assets/realistic/`는 이름만 옛것이고 툰 지형·식생 자료가 든 공용 폴더라 그대로).
- 주인공은 카툰 등산객 **동동이**입니다. 1.0m, 2.1등신이고 벙거지·빨간 목도리·주황 바람막이·청록 큰 배낭을 갖췄습니다. 복장 고르기는 없앴습니다.
- 경로는 실제 GPX 337점(위경도·평활 고도)입니다. 전체 약 5.1km이고, 모델 기준 전체 걸리는 시간은 150분입니다. 1m = Three.js 1단위, 북쪽 = −z입니다.
- 배포 주소는 https://engchoon.github.io/ai-office-world/ 입니다(11-14까지는 …/gwanak-hiking/). 대표가 혼자 휴대폰(아이폰 사파리)으로 들어가 확인하는 용도입니다.

## 2. 사람과 역할 (AI Office)

| 이름 | 하는 일 |
|---|---|
| 대표 | 모든 결정을 합니다. 휴대폰으로 확인하고 피드백을 줍니다 |
| 산기획 | 기획·취합·검수를 맡는 랩 리드입니다. 업무를 나누고 대표 결재를 받습니다 |
| 산개발 | 엔진·이동·HUD 코드, 빌드·배포·성능을 맡습니다 |
| 산풍경 | 지형·숲·물·하늘·카툰 재질과 캐릭터 동작을 맡습니다 |
| 산디자인 | UI·색·분위기·HUD 디자인과 카툰 기준값을 맡습니다 |
| 산리서치 | 실제 자료 조사(코스·계절·도심·출처와 이용 조건)를 맡습니다 |

## 3. 대표가 이미 요청한 것 — 다시 빠뜨리지 말 것

같은 요청을 두 번 하게 만든 적이 있습니다. 기획·구현·검수 때마다 아래를 확인하세요.

- **실제로 참고하는 것은 산 모양(지형)·코스(GPX)·주변 서울 도심 풍경뿐입니다.** 시설·동물·소품·즐길거리·식생 등 나머지는 모두 게임 속 환경입니다. 실제 자료를 조사하거나 실제와 비교하지 않습니다(대표가 여러 번 말함, 2026-11-06).
- **일시정지 개념이 없습니다.** 일시정지·계속하기 버튼과 화면을 만들지 않습니다(`tests/hud-notebook.test.mjs`가 검사합니다).
- **정상(연주대) 쪽에는 계단이 없습니다.** 공중에 떠 있는 계단도 안 됩니다. 계단은 측벽과 지면에 붙어 있어야 합니다.
- **모든 기능은 HUD 버튼으로도 됩니다.** 단축키만 있는 기능을 만들지 않습니다. 휴대폰에는 키보드가 없습니다.
- **모바일 조이스틱은 손가락을 댄 자리에 생깁니다**(떠다니는 조이스틱). `src/joystick.js`를 보세요.
- **구간 이동 버튼(개발용)을 유지합니다.** 설정 탭 안의 '개발용' 점선 칸에 있습니다.
- **1인칭 카메라는 위아래로 흔들지 않습니다**(멀미 때문). 걸음 리듬은 발소리로만 냅니다.
- **시점 전환(1인칭/3인칭)은 늘 보이는 칩**입니다. 위 왼쪽 진행 알약 옆에 있습니다(11-18 공통 틀).
- **쌍안경·휴대폰 카메라는 휴대폰에서 "✕ 내리기" 버튼으로 바로 내릴 수 있어야 합니다.** 버튼은 손가락 크기(44px 이상)이고 안전 영역 안에 둡니다. `scripts/verify-mobile-gadgets.mjs`로 확인합니다.
- **알림이 HUD에 가려지면 안 됩니다.** 이어하기 안내·스탬프·완등 카드 모두 HUD 위에 뜹니다.
- **휴대폰 메모리를 지킵니다.** 아이폰 사파리는 탭 메모리(약 1~1.5GB)를 넘으면 페이지를 다시 엽니다. 대표에게는 "로딩 화면이 다시 뜬다"로 보입니다. 휴대폰 상한은 `src/device-profile.js` 한곳에 모아 두었습니다(도시 칸 8개, 숲 풀 25%, DPR 1.0 등).

## 4. 일하는 방식 (대표 피드백에서 나온 규칙)

- **찾은 결함은 그 턴에 고칩니다.** "남은 점"으로 미루지 않습니다. 정말 못 하는 것만 이유와 함께 적습니다.
- **모양은 숫자가 아니라 화면으로 대조합니다.** 참고 이미지와 맞출 때는 캡처를 나란히 놓고 실루엣(맨몸·측면)을 봅니다.
- **화면을 바꿨으면 캡처로 확인하고 보고에 붙입니다.** 휴대폰 세로 390×844, 가로 844×390, PC 1920×1080을 봅니다.
- **선택이 필요하면 질문 도구(AskUserQuestion)로 묻습니다.** 답변 글 속에 질문을 섞지 않습니다.
- **버전 번호는 정하기 전에 대표에게 묻습니다.**
- **커밋·push·배포는 대표가 시킬 때만 합니다.** 배포는 상호작용 작업 묶음이 끝난 뒤 한 번 합니다.
- **보고는 쉬운 한국어로 씁니다.** 무엇이 문제였고 무엇을 바꿨는지, 어떻게 확인했는지를 적습니다.
- **변경 기록을 남깁니다.** 작업마다 `docs/변경기록-YYYY-MM-DD-주제.md`를 쓰고, 큰 결정은 이 문서 §8에 한 줄을 더합니다.

## 5. 실행·검증·배포

```sh
cd ~/gwanak-hiking
. ~/.nvm/nvm.sh && nvm use 24   # 기본 PATH에 npm이 없음
npm run dev            # 개발 서버 (127.0.0.1:5173) — / 허브 · /hiking/ · /smoking/
npm test               # 단위 테스트 (node --test tests/*.test.mjs, 2026-11-08 기준 704개 = 등산 + 흡연장 lounge-*·smoke-* + 허브 metaverse-hub)
npm run test:e2e       # Playwright, toon 프로젝트 하나
npm run build          # vite build + scripts/copy-assets.mjs
npm run server         # 함께 걷기 서버(기본 8787, 환경 변수는 docs/멀티-서버-운영안내.md)
npm run multi:up       # 대표 맥에서 서버 + Quick Tunnel + 공개 파일 multi-server.json 올리기(Ctrl+C면 '꺼짐')
npm run deploy -- --dry  # 빌드·크기 점검만
npm run deploy         # gh-pages 브랜치에 강제 push (대표 지시가 있을 때만)
```

- 등산 주소 옵션(모두 `/hiking/` 뒤에 붙임, 루트에 붙이면 `/hiking/`로 넘어감): `?start=entrance`(입구 광장 출발), `?start=summit`(정상 10m 앞), `?multi=방이름`(함께 걷기), `?server=wss://…`(함께 걷기 서버 주소, `off`면 BroadcastChannel), `?pick=off|on`(산 고르기 화면 끄기·자동화 브라우저에서 켜기), `?serverpick=on|off`(서버 고르기 창: 자동화 브라우저에서 켜기·끄기, `?multi=`가 있으면 늘 건너뜀), `?dev=off`(개발 버전 끄기 = 자유 설정 잠김·구간 이동 숨김), `?season=`·`?time=`·`?weather=`.
- **점검 스크립트(Playwright)에서는 산 고르기 화면이 자동으로 빠집니다**(navigator.webdriver). 산 고르기를 찍으려면 `?pick=on`을 붙입니다. `scripts/verify-free-settings.mjs`가 산 고르기·도장·자유 설정을 검사합니다.
- 브라우저 콘솔의 `window.hiking`에 진단 함수가 있습니다. `hiking.memory()`, `hiking.loadTiming()` 등을 쓸 수 있습니다.
- 화면 확인 스크립트는 `scripts/capture-*.mjs`(등산 주소는 `/hiking/…`; 허브·등산·흡연장을 한 번에 찍는 `scripts/capture-metaverse.mjs`, 흡연장 `scripts/capture-smoking.mjs`), `scripts/verify-mobile-buttons.mjs`, `scripts/measure-mobile-memory.mjs`, `scripts/measure-first-load.mjs`에 있습니다. 결과는 `artifacts/`에 둡니다.
- GitHub 원격은 `https://github.com/EngChooN/ai-office-world`입니다(11-14 이름 변경). 저장소 생성 같은 계정 작업은 대표가 웹에서 합니다.
- 런타임에 외부 지도·CDN·사진 서비스에 접속하지 않습니다.

## 6. 코드 지도

| 영역 | 파일 |
|---|---|
| 허브(체험 고르기, 11-17 개선) | `index.html` → `src/hub/main.js`, 화면 `src/hub/hub.js/.css`(PC 마을 지도·휴대폰 카드 목록·판·설정 창)·`experiences.js`(체험 목록 + `NEXT_SLOT`), 그림 `art.js`·동동이 평면 그림 `dongdong.js`(임시), 서버 인원 `hub-servers.js`, 허브 → 체험 서버 넘기기 `handoff.js`(sessionStorage `aoworld:hub-pick`, 체험은 `takeHubPick`·`applyHubPick`), 세 체험 공용 소리·설정 `src/shared-settings.js`(`aoworld:settings:v1`), 옛 주소 넘기기 `src/hub/legacy-redirect.js`. 검사 `tests/hub.test.mjs`·`hub-improve.test.mjs`·`metaverse-hub.test.mjs`·`scripts/verify-hub.mjs` |
| 온라인 흡연장 | `smoking/index.html` → `src/lounge/**` (§10) |
| 시작·메인 루프 | `hiking/index.html` → `src/mountain-pick.js`(산 고르기, 수동 시작을 건다) → `src/main.js` (`<html data-style="toon">` 고정) |
| 산 목록·완등·자유 설정 | `src/mountains.js`(산 배열), `src/summit-records.js`(localStorage `gwanak-summits`), `src/free-settings.js`(개발 버전 `DEV_BUILD`·값·시각 계산), `src/free-settings-ui.js`(판·도장·HUD 연결), `src/free-settings.css` |
| 경로·좌표 | `src/gpx-data.js`(GPX 337점, CSV와 테스트로 대조), `src/route.js`, `src/route-surfaces.js` |
| 입구 광장 | `src/entrance-config.js`(가설 B 좌표), `src/plaza.js` |
| 정상 | `src/summit.js` (정상 자유 이동 구역) |
| 이동·카메라 | `src/movement.js`, `src/view.js`, `src/auto-view.js`, `src/input.js`, `src/joystick.js` |
| 청크 스트리밍 | `src/chunk-stream.js`, `src/chunk-culling.js`, 자료는 `assets/shared/chunks/` (200m 격자) |
| 카툰 그래픽 | `src/toon/**` (재질·하늘·물·풀·도시·동동이 `link-hiker.js`) |
| 캐릭터 동작 | `src/realistic-hiker.js`(이름만 옛것. 동동이·흡연장·크리스마스·멀티가 쓰는 뼈대 코드), `src/hiker-*.js` |
| 서울 도심 원경 | `src/city-grid.js`(2km 칸, 지연 생성·해제), `src/city-facade.js`, `src/city-landmarks.js` |
| 세 콘텐츠 공통 화면 틀(11-18) | `src/ui-frame.js/.css`(위 알약·💬·☰ 메뉴 창·말하기 줄 `createChatBar`(11-19: 입력칸·보내기·✕만, 지난 말 3줄)·머리 위 말풍선 `.uf-bub`·창 하나만 `openWin/onWin`·키보드·행동 원 `ufPlace` data-uf). 등산 연결 `src/hiking-frame.js/.css`, 흡연장 `lounge/hud.js`·`spots.js`·`multi-ui.js`, 크리스마스 `christmas/hud.js`·`travel-ui.js`·`main.js`, 채팅 `hiking-chat-ui.js`(frame 옵션). 점검 `scripts/verify-ui-frame.mjs`·채팅 `scripts/verify-chat-unify.mjs` |
| HUD (등산 수첩) | `src/hud-notebook.js/.css`. main.js와는 `hiking:*` window 이벤트로만 주고받음. 11-18부터 시트는 ☰ 메뉴 탭 안(`win.hikingFrame`) |
| 의견 보내기 | `src/feedback.js/.css`(등산·흡연장 공용 카드·GitHub 이슈 주소·복사), 등산은 `hud-notebook.js`, 흡연장은 `lounge/hud.js`가 설치. 검사 `tests/feedback-issue.test.mjs` |
| 상호작용 | `src/interaction-*.js` (안내판·스탬프·완등 카드·쌍안경 이름표), `src/gadget*.js`(쌍안경·휴대폰 카메라) |
| 쉬기 | `src/rest-ui.js` (앉기·차 마시기·스트레칭) |
| 계절 | `src/season.js`(날짜·바꾸기), `src/toon/season.js`(색·눈 셰이더), `src/toon/season-particles.js`(꽃잎·낙엽) |
| 즐길거리 | `src/toon/trail-props.js`(산스장·벤치·먼지털이기·동물 형상, 시안과 공유), `src/trail-sites.js`(자리), `src/trail-world.js`(가까이서만 만들기·동물 3마리·들르기·말풍선), `src/toon/hiker-acts.js`(동동이 동작), `src/exhaustion.js`(⑥ 헥헥·쥐 규칙), `src/trail-rules.js`(초콜릿·벤치·들르기 버튼 규칙), `src/trail-hud.js/.css`(간식 줄·즐길거리 줄·말풍선 모양), `src/trail-lines.js`(말풍선 문구 `pickLine`·효과음 표 `TRAIL_SFX`), `src/trail-sound.js`(효과음 재생: 발소리 마스터·켜기/끄기를 따름, 라디오 18m), 소리 `public/sounds/trail/`(`scripts/make-trail-sfx.mjs`로 합성). 검사 `verify-trail-sound.mjs`(소리 꺼짐 0건)·`verify-full-autowalk.mjs`(입구~정상 이어 걷기, 시계 6배) |
| 시간·날씨·소리 | `src/environment.js`, `src/daytime.js`, `src/weather.js`, `src/footstep-audio.js`, `src/ambient-audio.js` |
| 함께 걷기 | `src/multi-protocol.js`(규격·이름·보간·인사/셀카), `src/multi-transport.js`(BroadcastChannel·가짜 방·**WebSocket** `createWebSocketTransport`·`multiServerUrl`), `src/multi-client.js`(화면·상태 이벤트·동물 중계·`dispose`), main.js의 `hiking:multi-join`/`multi-leave` 처리, HUD 입구 `src/multi-entry-ui.js/.css`(설정 시트 `👋 함께 걷기` 버튼·상태 칩 → 서버 고르기 창, 연결 상태 칩 6종, main.js가 자동으로 불러옴, 이벤트만 주고받음). **서버 고르기 창** `src/server-pick.js/.css`(등산·흡연장 공용, 서버 목록 `SERVERS`·`/health` `servers`, 등산은 `src/hiking-server-pick.js`가 산 고르기 다음·HUD에 같이 씀, 검사 `tests/server-pick.test.mjs`·`scripts/verify-server-pick.mjs`). 서버 `server/multi-server.mjs`(http·upgrade·/health·환경 변수), `server/ws.mjs`(최소 WebSocket), `server/rooms.mjs`(방 로직 순수 모듈, 방 키 `체험:방이름`), `server/Dockerfile`(맨 위 `.dockerignore`도 같은 파일만: 서버 5개 + 채팅 금칙어 목록). 체험 구분은 `multi-protocol.js`의 `EXPERIENCES`·`parseExperience`·`EXPERIENCE_MESSAGES`(hello `exp`, 없으면 `hiking`). **채팅**은 공통 `c`(`CHAT`·`sanitizeChat`·`createChatLimiter`, 서버 금칙어 `server/chat-banned-words.txt`+`BANNED_CHAT_WORDS`), 등산 화면과는 `hiking:chat-send`/`hiking:chat`/`hiking:chat-limit` 이벤트만. 흡연장 `s`·`lounge:smoke`(`SMOKE_STATES`)도 서버가 받음. 흡연장 연결 인터페이스는 운영안내 §3-2. 운영은 `docs/멀티-서버-운영안내.md`. 등산 채팅 HUD `src/hiking-chat-ui.js/.css`(💬 버튼·공통 말하기 줄·머리 위 말풍선 4초, 11-19부터 빠른 말 칩 없음, `multi-client.js`의 `screenPos(id)`로 머리 위 위치 조회, main.js가 자동으로 불러옴; 검사 `tests/hiking-chat-ui.test.mjs`·`scripts/capture-hiking-chat.mjs`). 검사 `tests/multi-rooms.test.mjs`·`tests/multi-chat.test.mjs`·`tests/multi-server.test.mjs`·`tests/multi-entry-ui.test.mjs`·`scripts/verify-multi-server.mjs`·`scripts/verify-multi-chat.mjs`(두 브라우저 등산·흡연장 채팅·격리). 호스팅 비교 `docs/멀티-서버-호스팅-비교.md` |
| 같이 등산하기(동행) | 규격·문구·클라이언트 상태기계 `src/multi-protocol.js`(`PAIR`·`PAIR_TEXT`·`createPairClient`, 메시지 `pair:*`, 위치 flags `FLAG.auto`), 서버 쌍 상태 `server/rooms.mjs`(한 쌍·30초 만료·60초 재제안 금지·10초 간격·숨김 불가·끊김 60초 유예·resume, 메모리만), 나란히·밀어내기 계산 `src/pair-walk.js`(좌우 ±0.5m·앞뒤 1.5m·0.85m 밀어내기·자동 걷기 속도), main.js `pairStep`(advance에 `laneTarget`·`pace`)·`pairNudge`(노면 반폭−0.3m·`animal-lanes.inForbid`), HUD `src/pair-ui.js/.css`(👥 목록·이름표 고르기·제안 카드·동행 칩, `hiking:pair-*` 이벤트만). 검사 `tests/pair-rules.test.mjs`·`tests/pair-walk.test.mjs`·`scripts/verify-pair-walk.mjs`(두 브라우저, 약 5분) |
| 라디오(관악산 FM) | 방송표·섞기 공식 `src/radio-stations.js`(`STATIONS` 빈 배열·`FM_CHANNELS` 91.9/95.5/99.1·`EXTERNAL_LINKS` 새 탭 링크 3개 — 방송사 주소는 이 파일에만), 곡 목록 `assets/radio/manifest.json`(한 파일, 크레딧 문구 포함)·도우미 `src/radio-tracks.js`(95.5 멘트 고르기), 소리 `src/radio-audio.js`(발소리와 같은 AudioContext·마스터, 잡음 합성, `<audio>` 흘려 받기·겹쳐 잇기), HUD `src/radio-ui.js/.css`(📻 태그·앞/뒷면·설정 시트 「소리 출처」, 저장 `gwanak-radio`). 검사 `tests/radio.test.mjs`·`scripts/verify-radio.mjs` |
| 온라인 크리스마스 광장(11-16, 월드개발) | `/christmas/` = `christmas/index.html` → `src/christmas/main.js`(장면·이동·장식 모드·서버 고르기), `multi.js`(20명·act 옷·음소거·트리 메시지), `tree-state.js`(트리 규칙, 서버 공용·Dockerfile 포함), `tree-play.js`(화면 트리 연결), `hud.js/.css`(연결 칩·트리 진행·장식 판·사람 목록·옷), `lite.js`(휴대폰 먼 사람 가벼운 동동이), `collide.js`. 서버 `rooms.mjs` 체험별 정원 `EXPERIENCE_MAX`·트리 `trees`·빈 방 5분 초기화(`TREE_RESET_MS`). 채팅 지킴이 `createChatGuard`(세 체험 공통). 콘솔 `window.xmas`. 검사 `tests/christmas-world.test.mjs`·`scripts/verify-christmas-world.mjs`(20명)·`scripts/capture-christmas-lite.mjs` |
| 온라인 크리스마스 놀이(11-16 2차, 월드개발) | 판정(서버·혼자 모드 공용, three 없음·Dockerfile 포함) `src/christmas/room-play.js` ← `gift-state.js`(선물)·`snowman-state.js`(눈사람)·`snowfight.js`(눈싸움), 화면 길 `play-net.js`. 화면 `gift-ui.js`(우체통·카드·모두의 카드)·`campfire.js`(8자리 앉기)·`snowman-play.js`·`snowfight-play.js`·`sled-play.js`+`sled.js`(썰매 계산)·`poses.js`(앉기·팔 동작, 흡연장 `createPoser`·`POSE_TOOLS` 재사용)·`audio.js`(효과음은 합성음, 캐럴은 `carols.js` 군악대 8곡을 `radio-audio.js` `createDeck`으로 흘려 재생, 🎵 창 「소리 출처」). act 칸 `st·wm·cc·sl·sp·pu·pk`. 행동 단추는 `main.js` `currentActions`→`hud.setActions`. 검사 `tests/christmas-play.test.mjs`·`scripts/verify-christmas-play.mjs`(PC+휴대폰, PART=gift,fire,snowman,fight,sled,offline) |
| 크리스마스 눈썰매·눈싸움 개선(11-17, 월드개발) | 조준 `snowfight.js`(`planThrow`·`arcDots`·`arcHeight` = 서버 판정과 같은 식)·`snowfight-play.js`, 한 판 `fight-match.js`(서버·혼자 공용)·`fight-ui.js`, 썰매 산 코스 `sled-course.js`(가운데 선·산 높이 칸)·`sled-course-art.js`(그림 1차), 썰매 계산 `sled.js`, 레이스 `sled-race.js`(서버·혼자 공용)·화면 `sled-play.js`, 미니게임 공용 틀 `game-ui.js`(카운트다운·위 띠·결과 창). 검사 `tests/christmas-aim`·`christmas-sled`·`christmas-match`.test.mjs, `scripts/verify-christmas-play.mjs`(PART=fight,match,sled) |
| 크리스마스 눈썰매 2차·케이블카(11-17, 월드개발) | 산(뼈대·땅, 늘 같음)과 코스(시드 블록) `sled-course.js` `makeCourse(seed)`·`planCourse`·`dailySeed`, 썰매 계산·자동 조종·시뮬레이션 `sled.js`(`simulateRide`·`courseGrip`·`starTimes`), 방 코스 시드 `sled-race.js`(`sc`·`sc:new`), 코스 그림 다시 그리기 `sled-course-art.js` `setCourse`, 케이블카 `gondola.js`(케이블·시간·`cabinYAt`)·`gondola-art.js`·`gondola-play.js`(act `gd`). 검사 `tests/christmas-sled.test.mjs`, `scripts/verify-christmas-play.mjs`(PART=sled,gondola) |
| 크리스마스 시안 B 회전목마·아이스링크(11-17 3차, 월드개발) | 11-17 6차부터 기본 화면(예전 화면은 `?look=classic`, 시안 A는 `?look=festive`). 회전목마 타기 `src/christmas/carousel-play.js`(자리는 월드아트 `festive-layout.js` `CAROUSEL_SEATS` 8곳, 자세는 그림의 `carousel.seatPose`, act `mg` 1~8, 겹침 `ride:no`), 아이스링크 출입·얼음 높이·미끄러지는 걷기 `rink-play.js`(`RINK`·`inRink`, `heightWithRink`·`strideAt`·`ICE`), 다른 사람은 `multi.js` `ctx.rideAt`·`ctx.strideAt`. 검사 `tests/christmas-carousel.test.mjs`·`scripts/verify-christmas-carousel.mjs` |
| 크리스마스 하늘 썰매·별 흔적 그림(11-18, 월드아트) | 루돌프 `src/christmas/reindeer.js`(`createReindeerHerd`·`reindeerPose`·`REINDEER`), 썰매 한 벌 `sky-sleigh.js`(`createSkySleighFleet`·`SLEIGH`, `team.place`·`drive`), 앉은 동동이 `sleigh-rider.js`(`createSleighRider`), 별 흔적 `star-trail.js`(`createStarTrail`·`STAR_LEVELS`·`STAR_CAP`), 정류장 자리 `festive-layout.js` `REINDEER_STATION`·그림 `festive.js` `station()`, 시안 B에서 `village.festive.skySleigh={fleet,stars,station,waiting}`. 미리보기 `preview.html?view=reindeer-modes`. 검사 `tests/christmas-reindeer.test.mjs`. 인계 `docs/크리스마스/하늘썰매-그림-에셋-v1.md` |
| 크리스마스 하늘 썰매 연결(11-18, 월드개발) | 규칙·숫자(순수) `src/christmas/sky-rules.js`(`SKY`·`HS`·범위·못 내리는 곳·이륙/착지), 화면·동작 `sky-sleigh-play.js/.css`(타기·비행·내리기·다른 사람 썰매·별 흔적 줄이기), act `hs`·위치 메시지 `a`(높이), 다른 사람 몸 `multi.js` `ctx.skyAt`, 서버 `rooms.mjs` `maxAlt`·`room-play.js` 하늘의 사람 눈덩이 제외, 지도 핀 `travel.js` `sky`. 검사 `tests/christmas-sky.test.mjs`·`scripts/verify-christmas-sky.mjs`·`measure-christmas-crowd.mjs` `SKY_ALL=1` |
| 크리스마스 썰매 4명 경주·직접 조작·눈싸움 직접 겨냥(11-18, 월드개발) | 조작감 3·카메라 `sled.js`(`SLED_RULES_3`·`createSledCam`·`SLED_CAM`), 길 폭 `sled-course.js`(`COURSE_W` 6·`NARROW_W` 4.5·`WIDE_W` 7·`TUNNEL_W` 5.5·`MIN_RACE_W`), 경주 규칙(모집 20초·2명 출발·4명 바로·혼자 선택·한 번 더, `BOARD_FEEL` 3) `sled-race.js`, 마을 「썰매 경주」 판·참가 카드·배지·반투명·점검용 `autopilot` `sled-play.js`(`RACE_BOARD`), 참가 이동 준비 `main.js` `sledPlay.prep`, 눈싸움 조준 `snowfight.js`(`AIM`·`dragTurn`·`overCancel`)·`snowfight-play.js`(가운데 고리·끌기 회전·✕). 검사 `tests/christmas-sled`·`christmas-aim`.test.mjs, `scripts/verify-christmas-race4.mjs`(PART=race,two,cam,fight) |
| 크리스마스 썰매 경주 그림 다듬기(11-18, 월드아트) | 길 띠(위를 보게 감김·짙은 색·4줄 결)·굽이 바깥 눈둑 `TURN_BANK`·빨강·흰 턱·터널 안 그늘·출발대 줄 색 판 `LANE_PLATE` `sled-course-art.js`, 마을 「썰매 경주」 판 그림 `race-board-art.js`(`buildRaceBoardArt`, 자리·상태는 `sled-play.js`), 줄 색 `palette.js` `XMAS.lane`(= `LANE_COLORS`), 눈싸움 취소 아이콘 `x-throw-cancel`. 미리보기 `preview.html?view=race-start·race-hairpin·race-tunnel·race-board`. 검사 `tests/christmas-sled-art.test.mjs` |
| 세 체험 공통 입장(11-19, 월드개발) | `src/entry.js`(허브 선택 `handoff.js` → 지난 선택 `localStorage aoworld:entry:v1` → 없으면 공용 입장 창 `server-pick.js` 한 번, `takeEntryChoice`·`enterWith`·`rememberEntry`). 창에서 고르면 `server-pick.js`가 지난 선택을 씀. 등산 산 고르기는 들어올 때마다 보이고(11-19 대표 결정, 닉네임 칸 없음) 그다음 서버·이름은 지난 선택으로 바로, 흡연장 로비 카드는 입장 때 안 뜸(☰ 내 정보). 검사 `tests/entry.test.mjs`·`scripts/verify-entry-flow.mjs`(흐름 + 가로·세로 입장 화면) |
| 크리스마스 스케이트 타기 A안(11-19, 월드개발) | 움직임·자세 판단·효과 자료(three 없음) `src/christmas/skate.js`(`SKATE` 최고 2.4m/s·`skateStep`·`skateWall`·`createSkateGait`·`createSkateTrack`(다른 사람 자세를 받은 위치로)·`createSkateFx`), 링크 출입·연결 `rink-play.js`(`SKATE_ART_API` wear·pose·drawFx, `remote` = multi.js `ctx.skateAt`), 소리 `audio.js` `skate-push`·`skate-stop`·활주. 서버 변경 없음. 검사 `tests/christmas-skate.test.mjs`·`scripts/verify-christmas-skate.mjs`(실제 게임 측정) |
| 크리스마스 스케이트 그림(11-19, 월드아트) | 날·자세 7종·날 자국·얼음 가루 `src/christmas/skate-art.js`(`createSkateArt` → `wear`·`pose`·`drawFx`, 월드개발 `rink-play.js` `SKATE_ART_API`), 시안 B에서 `village.festive.skate`. 날은 옷 몸통 메시(`Xmas_Body`)에 합쳐 그리기 0 증가. 인계 `docs/크리스마스/스케이트-그림-에셋-v1.md`, 촬영 `artifacts/skate-art/shoot.mjs` |
| 접속 유도 1단계(11-19, 월드개발) | 친구 부르기 `src/invite.js`(주소 `?multi=<지금 서버 방>&utm_source=invite&utm_medium=share`·글·공유 창 → 복사 → 주소 보여 주기, 지금 방은 `*:multi-status` 이벤트) + 공용 틀 `ui-frame.js` ☰ 메뉴 맨 위 `.uf-invite`(세 체험 기본), 첫 서버 확인 한 번 실패는 「확인 중」 유지 `server-pick.js` `afterFail`·`RETRY_MS`(허브 `hub-servers.js`도 같음), 크리스마스 장면 바로가기 `?spot=` `travel.js` `spotFromSearch`, 0명 문구 `hub.js` `ZERO_TEXT`·입장 창 `data-sp-first`. 서버 변경 없음. 검사 `tests/invite.test.mjs`·`scripts/verify-growth-stage1.mjs`, 주소 표 `docs/마케팅/인스타-꼬리표-주소표-v1.md` |
| 남산 그림(11-19, 월드아트) | 자료 `assets/shared/namsan/`(만들기 `scripts/namsan/build-namsan-data.mjs`, 관악산과 같은 좌표), 높이·배치 `src/namsan/namsan-data.js`(`loadNamsanData`·`createNamsanGround`·`courseAt`·`NAMSAN`), 그림 `src/namsan/namsan-art.js`(`buildNamsan` → 지형·계단·성곽·전망탑·광장·소품·숲, `update(t,night)`), 미리보기 `src/namsan/preview.html`(실루엣 대조 `namsan.silhouette()`), 촬영 `scripts/namsan/capture-namsan-*.mjs`. 인계 `docs/남산/남산-그림-에셋-v1.md`, 검사 `tests/namsan-art.test.mjs` |
| 남산 순환버스 그림(11-19, 월드아트) | 차로 자료 `assets/shared/namsan/bus-road.json`(만들기 `scripts/namsan/build-namsan-bus.mjs`), 높이·땅 깎기·버스 도는 닫힌 길 `namsan-data.js` `createBusLane` → `G.bus.cycle`(legs startRing·up·summitRing·down, 고리에서 문 쪽이 광장 가운데)·`G.bus.stops`, 그림 `src/namsan/namsan-bus-art.js`(`buildBus`·`placeOnLane`·`seatInBus`·정류장·하차 지점·차로), `buildNamsan`이 자동으로 붙임(`ns.bus`). 인계 `docs/남산/남산-순환버스-그림-에셋-v1.md`, 검사 `tests/namsan-bus-art.test.mjs` |
| 남산 밤 가로등(11-19, 월드아트) | 그림·자리 `src/namsan/namsan-lamps-art.js`(`planNamsanLamps` 길 18m·계단 12m·광장 쌍등·쉼터·정류장·성곽 벽 비춤, `buildNamsanLamps` 그리기 5번 고정, 빛은 그림 효과), `buildNamsan`이 붙임(`ns.lamps`). 실제 광원 4개는 공용 `night-lighting.js` 옵션 `lampPoints`·`drawLamps:false`(안 주면 관악산 그대로)로 `game.js`가 연결(`LAMP_REAL` 0.55). 콘솔 `namsan.lampStats()`·`lampsVisible()`. 인계 `docs/남산/남산-밤-가로등-그림-에셋-v1.md`, 검사 `tests/namsan-lamps-art.test.mjs` |
| 남산 상호작용 그림(11-19, 월드아트) | 약수터·물확 2·돌탑 무리·사랑의 자물쇠 난간 `src/namsan/namsan-interact-art.js`(`planNamsanInteract`·`buildNamsanInteract` → `userData.spots`(spring·stream·cairnField·loveLocks)·`locks`(aim·hang·setFilled), `update(t,night,camera)`). 연결은 월드개발 5단계(아직 안 붙음). 인계 `docs/남산/남산-상호작용-그림-에셋-v1.md`, 검사 `tests/namsan-interact-art.test.mjs`, 촬영 `artifacts/namsan-interact/shot.mjs` |
| 남산 게임(11-19, 월드개발) | 페이지 `/hiking/namsan/` = `hiking/namsan/index.html` → `src/namsan/game.js`(관악산 main.js와 따로, 공통 부품만 씀: 카툰·도심·동동이·input·ui-frame·채팅·multi-client·입장), 걷기 규칙(three 없음) `src/namsan/namsan-walk.js`(노면 폭·두 광장만 걷기·코스 높이·관악산과 같은 `speedFor`·스탬프 4·완등·이어 오르기 `namsan-hike:v1`·남산 서버 줄 `NAMSAN_SERVERS`·인원 `namsanHealth`), 산 고르기 카드 `mountains.js`(`page`·`summitName`·`art.summit/course`)·`mountain-pick.js`(page면 그 페이지로 + 입장 선택 `aoworld:namsan-entry`). 함께 걷기 방 `hiking:남산`(서버 목록 밖 방, 서버 코드 그대로). 휴대폰은 먼 나무 덜 심기·지형 칸 250m(`buildNamsan` `forestKeep`·`forestNear`·`terrainTile`, `?lite=0`이면 끔). 콘솔 `window.namsan`(status·jump·setAuto·multi). 검사 `tests/namsan-game.test.mjs`·`scripts/verify-namsan-game.mjs`(PART=pick,pc,phone,entry,multi) |
| 릴스 제작 시안(11-19, 월드아트) | 컷표 `artifacts/reels-kit/reels.json`, 자막·표지·끝 카드 그림 틀 `overlay.html`, 묶기 `build.mjs`(ffmpeg `/opt/homebrew/bin`, 기본 PATH에 없음), 빈 컷 촬영 `shoot-fill.mjs`·`shoot-greet.mjs`·`shoot-smoking.mjs`. 고르는 화면 `docs/마케팅/릴스-제작-시안-v1.html`, 녹화 목록 `docs/마케팅/릴스-녹화-장면목록-v1.md` |
| 온라인 크리스마스 그림(11-16, 월드아트) | `src/christmas/`: 배치 `layout.js`(순수 자료·`heightAt`·트리 자리 120), 형상 `props.js`, 광장 조립 `village.js`, 눈 `snowfall.js`, 옷 `outfits.js`·`avatar.js`(흡연장 `applyOutfit` 옷 표 옵션 사용), 확인 `preview.html`. 인계 `docs/크리스마스/그림-에셋-v1.md`, 검사 `tests/christmas-art.test.mjs`·`scripts/capture-christmas-art.mjs` |
| 산 정의(한 게임 통합, 11-20 2단계~) | 관악산 `src/mountains/gwanak.js`(`GWANAK` 이름·저장 키·카드 값 + 코스·위치 모델·정상·광장·스탬프 다시 내보내기, three 없음)·`gwanak-world.js`(세계용 동물 길·시설 등·계곡 자리). 공통 본체(`main.js`·수첩·구간 이동·자유 설정·산 카드)는 관악산 모듈을 직접 부르지 않고 이것을 읽음. 3단계(11-20): 등산 화면 틀 몸통은 조각 `src/frame/hiking-body.html`(`<!--#include …-->`, vite 플러그인·node 시험용 `scripts/html-include.mjs` `readPage()`), 산마다 다른 글은 `data-mt`·`GWANAK.text`·`src/mountain-text.js` `applyMountainText`. 4단계(11-20): 걷기 부품 약속 `src/walker.js`(`WALKER_KEYS`), 관악산 부품 `src/mountains/gwanak-walker.js`(`gwanak.js`의 `walker`, main.js는 위치 모델을 `W.…`로만 읽음), 남산 부품 `src/namsan/namsan-walker.js`(`createNamsanWalker(G)`, game.js가 씀), 검사 `tests/walker.test.mjs`. 일정 `docs/남산/한게임-통합-일정표-2026-11-19.md`, 점검 실행기 `artifacts/merge-baseline/run.mjs`(1군)·`run2.mjs`(2군)·`step3/final2/run.sh`(옛 낡은 점검 13개를 vite 하나에서) |
| 남산 콘텐츠(한 게임 통합 5단계, 11-20, 월드개발) | 산 정의 `src/mountains/namsan.js`(`NAMSAN_MOUNTAIN` 카드 값·저장 키·`NAMSAN_FEATURES` 기능 스위치. 관악산 `GWANAK.features`와 같은 이름, 6단계에 본체가 읽음), 글 `src/namsan/namsan-content.js`(스탬프·이정표 쪽·정상석·쌍안경 명소 11곳·행동 문구·자물쇠 규칙), 컨트롤러 `src/namsan/namsan-interact.js`(관악산 `pickCandidate`·`actionPose`·`interaction-ui` 재사용, 저장 `namsan-interaction:v1`, 자물쇠 공유 글자 `encodeLocks`·`decodeLocks`, 야경 벤치 자리 `planNightBenches`), 버스 시간표 `src/namsan/namsan-bus.js`(2대·10m/s·정류장 12초, 같은 시계), 디딤 띠 `namsan-walk.js` `makeWalkPads`(`G.walkPads`). 연결은 `game.js`(할 일 칩·쌍안경·자물쇠 카드·버스 타기·벤치, 콘솔 `namsan.spots()`·`goTo()`·`locks()`·`lockCard()`·`bus()`·`busClockOffset`·`seat()`). 함께 걷기는 act `x`(`lk-…`·`bus`)·`p`로(서버 그대로). 검사 `tests/namsan-content.test.mjs`·`namsan-bus.test.mjs`·`scripts/verify-namsan-content.mjs`(PART=pc,phone,land,multi) |
| 한 게임 통합 6단계(11-20, 월드개발) | 남산 페이지 `hiking/namsan/index.html`(`<html data-mountain="namsan">`)도 공통 화면 조각 `src/frame/hiking-body.html`을 끼우고 `src/mountains/page-text.js`(로딩 전 글·기능 자리) → `src/loading-screen.js` → `src/namsan/game.js` 순. 남산 글·기능 스위치 `src/mountains/namsan-page.js`(`NAMSAN_TEXT`·`NAMSAN_FEATURES`, import 없음). 기능 자리 숨기기 `src/mountain-text.js` `applyMountainFeatures`(조각의 `data-feature`, `[data-feature-off]` 숨김 CSS는 hud-notebook.css). 두 산 공통 본체 부품 `src/hiking-body.js`(`createHikingSound`·`installContextRecovery`·`installMultiHud`). 수첩 HUD 산별 옵션 `installHikingFrame({goal,barMode,features})`·`installNotebookHud(doc,win,{ticks})`, 도장 규칙에 남산 줄. 검사 `tests/mountain-body.test.mjs` |
| 기기별 상한 | `src/device-profile.js` (등산·흡연장 공용. 흡연장 사본과 다른 점은 등산 쪽에만 있는 `multiFullCap` 하나였고 흡연장은 이 값을 읽지 않으므로 그대로 씀) |

## 7. 지금 상태와 다음 일 (2026-11-08)

- **흡연장 상호작용 수정(11-17, 커밋만·배포 안 함):** 상황을 한 번 고르면 `<html data-scene>` 때문에 옥상 할 일 단추(자판기·벤치·난간·재떨이 표시, 한 모금·캔 버리기·일어나기, 상황 단추)가 모두 안 눌리던 결함과 NPC 없는 옥상의 G 키 오류를 고쳤습니다(아이콘 교체는 원인 아님). 같이 피우기는 담배 종류·묘기·인사·옷까지 상대·나중에 온 사람에게 같게, 벤치 좌판·난간 지점·자판기는 서버가 먼저 온 사람에게 줍니다(`src/lounge/room-rules.js`). **서버 코드가 바뀌어 운영 멀티 서버를 다시 켜야 적용됩니다.** 점검 `scripts/verify-lounge-interact.mjs`(PC+휴대폰+나중 입장, 50항목)·`tests/lounge-interact.test.mjs`. 남은 일: 실제 아이폰·안드로이드 확인, 운영 서버 다시 켜기. `docs/변경기록-2026-11-17-흡연장-상호작용-수정.md`.
- **멀티 채팅(11-08, 커밋 안 함):** 서버·프로토콜에 공통 채팅 `c`와 흡연장(위치·담배 상태)을 열고 등산 클라이언트에 채팅 이벤트를 붙였습니다. 등산 채팅 HUD는 붙었습니다(산디자인, `docs/변경기록-2026-11-08-등산채팅-HUD.md`). 흡연장 화면도 붙었습니다(산풍경, `docs/변경기록-2026-11-08-흡연장-멀티.md`, `verify-multi-chat.mjs` 흡연장 칸 통과). 금칙어 기본 목록 127개와 운영 정책·처리방침 초안도 나왔습니다(산리서치, `docs/채팅-운영정책.md`·`docs/개인정보-처리방침-초안.md`). 남은 일: 실제 휴대폰 키보드·인터넷 시험, 정책 §E 대표 결정 6개, 그 결정에 따른 서버 보강(허용 단어 줄·전화번호/URL 가림·숨김 중 채팅 막기·채팅 신고 사유), 법무 검토. `docs/변경기록-2026-11-08-멀티채팅-서버.md`.
- **메타버스 통합(11-08, 커밋 안 함):** 흡연장을 `/smoking/`, 등산을 `/hiking/`으로 옮기고 허브 정식 화면을 붙였습니다. 멀티 서버는 방 키를 `체험:방이름`으로 나눕니다(옛 클라이언트는 등산, 흡연장 실시간 접속은 자리만 설계 — `docs/멀티-서버-운영안내.md` §3-1). 다음: Render 배포. `docs/변경기록-2026-11-08-메타버스-통합.md`·`…-멀티서버-체험구분.md`.

- 11-06 저녁에 그동안 커밋하지 않았던 변경을 커밋하고 GitHub Pages에 다시 배포했습니다(대표 지시: 즐길거리가 끝나면 함께). 커밋 목록은 `git log`를 보세요.
  - 담은 것: 망원경 랜드마크 설명·도심 건물 시야 우선·알림 겹침, 계절 모습(봄 벚꽃·여름·가을 단풍·겨울 눈), 산 고르기·완등 도장·자유 설정, 즐길거리 6종(산스장·초콜릿·벤치·동물·먼지털이기·헥헥/쥐)과 HUD·소리·말풍선 문구.
  - 커밋에서 뺀 것: 참고 이미지(§9), `artifacts/probe/` 같은 임시 파일, 큰 캡처 묶음(`artifacts/ui-concepts/shots*`·`seasons`·`dongdong`·`toon-face`·`trail-hud`·`trail-props` 등). 로컬에만 있습니다.
- **함께 걷기 서버**는 로컬 완성·배포 준비까지 했습니다(11-08, 커밋·배포 안 함). `npm run server`로 뜨고, 게임은 `?multi=방&server=wss://…`로 붙습니다. 1차 시험은 대표 결정대로 내 맥 + Cloudflare Quick Tunnel입니다(`docs/멀티-서버-운영안내.md` §5). HUD 입구(설정 시트 `👋 함께 걷기` 버튼·참가 카드·연결 상태 칩)도 붙었습니다. 남은 일: 실제 휴대폰·인터넷 시험(키보드가 카드를 가리는지 포함), 호스팅 결정(추천 Fly.io 도쿄, `docs/멀티-서버-호스팅-비교.md`), 처리방침·법무 확인(IP는 디스크에 저장하지 않는 구현 기준으로 쓸 것), 광장 스냅샷 기준 갱신 여부.
- **실사 에셋 파일**(PBR 텍스처·`sky.hdr`·식생 원본 GLB·`Hiker.glb`)은 저장소에 남아 있지만 배포에서는 뺐습니다. 식생 GLB·`Hiker.glb`는 `npm run assets:build`(툰 에셋 다시 만들기)가 읽으므로 지우면 툰 에셋을 다시 못 만듭니다. 실사 코드는 11-19에 지웠습니다(`변경기록-2026-11-19-실사모드-코드-삭제.md`).
- **아직 확인하지 못한 것:** 숲 밀도·단풍 비율·일주문 치수는 근거가 약한 제안값입니다. 관악산을 아는 사람의 확인과 현장 사진 대조가 필요합니다.

## 8. 결정 기록 (최신이 위)

| 날짜 | 결정 | 근거 문서 |
|---|---|---|
| 11-20 | 한 게임 통합 6단계(월드기획 지시): 남산 페이지가 관악산과 같은 화면 조각·수첩 HUD·공통 본체 부품(소리·끊김 복구·함께 걷기 HUD)을 씀, 기능 스위치로 없는 기능 자리 숨김(관악산은 숨는 자리 없음). 남산 발소리·효과음은 관악산 파일 그대로, 환경음은 끔. 5단계 후속 사소 3건은 프론트엔드 정리드 몫 | 변경기록-2026-11-20-한게임-통합-6단계.md |
| 11-20 | 한 게임 통합 5단계(월드기획 지시, 대표 결정 반영): 남산 산 정의·기능 스위치, 남산용 콘텐츠(약수·물확 2곳 손 담그기·돌탑·정상석 F 정상 인증·이정표 글·스탬프함 F·쌍안경 명소 11곳), 사랑의 자물쇠(이 기기 저장 + 같은 방 공유, 글 없음, 서버 저장 없음), 순환버스 타기, 정상 야경 벤치. 그림 4곳은 디딤 띠로 「서 있을 곳」까지 걸어감. 추천안(대표 미확인): 자물쇠 한 기기 최대 3개, 버스 2대·10m/s·정류장 12초, 버스로 온 정상은 기록 안 함, 야경 벤치 2개는 자물쇠 난간 양옆, 남산 효과음은 아직 없음 | 변경기록-2026-11-20-한게임-통합-5단계.md |
| 11-19 | 남산 배포(대표 결정): 관악산 산 고르기 카드 예상 시간 150 → 97분(걷기 공식 값, 모델 전체 150분 설명과 다름), 지형 출처 줄을 Copernicus 정해진 문구로(관악산·남산). 다른 사람 미완 변경을 빼려고 git worktree에서 배포. 순환버스는 구현안 먼저(`docs/남산/남산-순환버스-구현안-v1.md`) | 변경기록-2026-11-19-남산-구현-연결.md §7 |
| 11-19 | 남산 구현·연결(월드개발, 업무 지시 범위): 남산은 별도 페이지 `/hiking/namsan/`(관악산 main.js 안 바꿈), 산 고르기 남산 카드 「오르기」가 그 페이지로 넘어가며 입장 선택을 넘김(공통 입장 흐름 그대로). 함께 걷기는 같은 서버·남산 방 하나(목록 밖 방이라 20명이면 서버가 남산-2로, 서버 코드·SERVERS 그대로), 입장 창 「남산 서버」 한 줄·인원 = 등산 전체 − 관악산 방, 남산 선택은 체험별 지난 선택에 안 씀. 남산 자유 설정은 남산 완등(또는 개발 버전)으로 열리고 출발 지점 칸 없음. 휴대폰은 먼 나무 덜 심기·지형 칸 크게. 소리 없음·친구 부르기는 남산 페이지 주소만(후속). 커밋만, 배포는 대표 확인 뒤 | 변경기록-2026-11-19-남산-구현-연결.md |
| 11-19 | 접속 유도 1단계(대표 승인, 서버 안 건드림): ☰ 메뉴 맨 위 「친구 부르기」(지금 서버로 바로 들어오는 주소, 혼자면 체험 주소, 이름·서버 주소 안 넣음), 첫 서버 확인 한 번 실패로 빨간 「연결할 수 없어요」 안 띄움(1초 뒤 8초 제한으로 다시, 두 번 실패해야), 크리스마스 `?spot=` 장면 바로가기, 0명이면 「첫 번째로 들어가 보세요」(숫자 부풀리지 않음). 보낼 글·단추 모양은 개발 결정·대표 미확인, 프로필 링크 목적지는 대표 결정 대기 | 변경기록-2026-11-19-접속유도-1단계.md |
| 11-19 | 세 체험 입장 흐름 정리(월드기획 지시): 입장 화면은 공용 서버 고르기 창 하나. 허브에서 골라 오면 게임에서 아무 화면 없이 바로, 주소로 처음이면 창 한 번, 지난 선택(체험별)이 있으면 건너뜀. 등산 산 고르기의 닉네임 칸 없앰(11-08을 바꿈). 산 고르기는 같은 날 대표 결정으로 11-06대로 매번 보임, 흡연장 로비 카드는 입장 때 안 띄움(19세 확인은 그대로). 이름 저장값 하나(`gwanak-multi-name`, 흡연장도) | 변경기록-2026-11-19-입장흐름-정리.md |
| 11-19 | 등산 실사 모드 남은 코드 삭제(대표 지시): 그리기(`rendering.js`) 실사 하늘·환경광 굽기·SSAO·블룸/색보정·감광, 지형(`load-landscape.js`) PBR·화강암·토지피복·실사 잎, 사진판 원경, 실사 쌍안경·가슴 다듬기·발소리, 파일 `sky-dome`·`look-calibration`·`mood-grade`·`pine-impostor`(+그림)·`terrain-material`·`foliage-material`·실사 점검 스크립트·배포되던 쓰지 않는 HDR. 예전 저장값 `gwanak-graphics-style`은 읽지 않고 지움, `?style=`은 무시. `assets/realistic/` 폴더 이름·`realistic-hiker.js` 이름과 툰 에셋 재료(식생 GLB·Hiker.glb)는 그대로 | 변경기록-2026-11-19-실사모드-코드-삭제.md |
| 11-19 | 채팅 통일(대표 확정, 시안 `docs/UI-개선/채팅-통일-시안-v1.html` v1.1): 세 콘텐츠 말하기 줄 = 입력칸·빨간 보내기·✕만(빠른 말 칩 전부 없앰, 등산 👋 인사 칩은 채팅과 따로라 그대로), 세로 맨 아래 꽉 찬 줄·가로 왼쪽 아래 540px·키보드 바로 위, 지난 말 반투명 띠 3줄(키보드 때 세로 2·가로 0), 머리 위 말풍선 한 모양 `.uf-bub`(흡연장 작은 풍선 바꿈), **채팅 중 행동 단추는 예외 없이 모두 숨김**(11-18 「큰 단추 60px 남김」을 바꿈). 흡연장 한숨·기지개 없앰(인사 👋는 불붙이기 전 작은 「인사」 단추), **옥상 NPC와 NPC 전용 기능 코드째 삭제**(대표 지시) | 변경기록-2026-11-19-채팅-통일-NPC-삭제.md |
| 11-18 | 세 콘텐츠 UI 개선 공통 틀(대표 결정, 시안 `docs/UI-개선/온라인시리즈-UI-개선-시안-v1.html`): 위 = 상태 알약·[전용 1칸]·💬·☰, 왼쪽 아래 = 걷기 비움, 오른쪽 아래 = 큰 단추 + 작은 단추 + 할 일 칩. ☰ = 세로 아래 창·가로 오른쪽 340px, 창은 한 번에 하나, 채팅 = 아래 한 줄(큰 단추 60px 남김), 등산 아래 탭 줄·꼬리표는 ☰ 안(11-06 등산 수첩 탭 줄 결정을 바꿈). 시안과 다르게 한 곳(칩 44px·등산 함께 걷기 둘째 줄 등)은 변경기록 §3 | 변경기록-2026-11-18-UI-개선-공통틀.md |
| 11-18 | 등산 인사창 = 이름표 옆 👋 칩(대표 승인, 시안 `docs/인사창/인사창-전후-시안-v1.html`): 사람은 알약·도장에서 빼고 칩(4m·앞 70°에 보임, 5.5m 밖 숨김), 칩·F = 인사(예전과 같음), 칩·이름표 누름 또는 2m 안 1초 멈춤 = 머리 위 카드(인사·같이 등산하기·✕, 5초 무입력·3m 밖·걷기·✕면 접힘), 걷는 중 흐리게, 동행 상대는 둘 다 멈춘 뒤 2초. `src/greet-chip.js/.css`, 검사 `tests/greet-chip.test.mjs`·`scripts/verify-greet-chip.mjs`. 인사·동행 규칙·서버 그대로 | 변경기록-2026-11-18-인사창-칩.md |
| 11-18 | 링크 공유 미리보기(대표 승인): 4페이지 `<head>`에 description·canonical·og·twitter·apple-touch-icon 태그, 그림 `public/og/`(월드아트), `meta content` 주소는 전체 주소 `https://engchoon.github.io/ai-office-world/…`, 탭 아이콘은 허브만 `favicon.svg`·나머지 `og/favicon-*.svg`. 검사 `tests/share-preview.test.mjs` | 변경기록-2026-11-18-공유미리보기-태그.md |
| 11-18 | 크리스마스 썰매 경주 마무리 그림(월드아트, 추천안·대표 미확인, 동작 코드 안 고침): 길 띠가 아래를 보게 감겨 위에서 안 보이던 1차 결함 고침 + 길을 둘레 눈보다 한 단 짙게·4줄 결, 굽이 바깥 눈둑 최대 0.86m·바깥으로만 두껍게(안쪽 가장자리 그대로)·빨강·흰 턱, 터널 안 짙은 그늘, 출발대 바닥 줄 색 판(1 빨강·2 초록·3 파랑·4 노랑, 깃발도 같은 색), 마을 「썰매 경주」 판 새 그림(`race-board-art.js`), 눈싸움 취소 전용 아이콘 `x-throw-cancel`(눈덩이 + ✕) | 변경기록-2026-11-18-썰매경주-그림-다듬기.md |
| 11-18 | 크리스마스 썰매 4명 경주·직접 조작·카메라·눈싸움 직접 겨냥 구현(월드개발, 설계 v2 숫자 그대로·다르게 한 곳은 변경기록 §6, 대표 미확인): 조작감 3(`align` 0·`carry` 1) 기본·기록판 `fv:3`만(개인 최고 기록은 그대로), 카메라 길 방향만·옆 0.5초·1.1m/s, 길 폭 6/4.5/7/5.5m(멈춤 구역 끝 4.5m·헤어핀 안쪽 0.75m), 경주 모집 20초·2명 「지금 출발」·4명 바로·혼자면 혼자 타기/20초 더, 마을 판·참가 카드 5초·배지, 눈싸움 자동 조준·끌어당김·휘어짐 없앰·마당 안 카메라 자동 따라가기 끔·❄️ 끌기 = 시야 회전·거리·✕ 취소. **운영 서버 다시 켜야 경주 규칙·기록판 적용** `docs/멀티-서버-다시켜기-썰매경주-2026-11-18.md` | 변경기록-2026-11-18-눈썰매-경주-조작-눈싸움.md |
| 11-18 | 크리스마스 눈썰매 직접 조작·카메라·4명 경주·눈싸움 던지기 설계 v2(월드디자인, 추천안·대표 미확인, 코드 안 고침): 썰매 길 맞춤(`align`)·저절로 따라 돌기(`carry`) 없앰 = 조작감 3, 꺾임 110→60°/s·핸들 0.14/0.10초, 카메라는 길 방향만(썰매 각도 빼기), 길 폭 기본 6.0·좁은 곳 4.5·굽이·출발·결승 7.0·터널 5.5m(4대 최소 4.1m), 경주는 마을 판에서도 열기·알림 카드·「참가」면 바로 출발대 줄·모집 20초·2명부터 출발, 눈싸움 자동 조준·끌어당김·휘어짐 없앰, 휴대폰 ❄️ 끌기 좌우 = 시야 회전·위아래 = 거리, 마당 안 카메라 자동 따라가기 끔. 기록판 `fv:3`은 대표 확인 필요 | docs/크리스마스/눈썰매-경주-조작-눈싸움-던지기-설계-v2.md |
| 11-18 | 크리스마스 하늘 썰매 연결(월드개발, 설계 v2 숫자 그대로·나머지 개발 결정·대표 미확인): act `hs` 0~4(sl과 따로)·위치 메시지 `a`(하늘 높이, 서버 0~30m), 하늘의 사람은 눈덩이 판정 제외, 다른 놀이 중 못 탐·타는 동안 다른 단추 숨김·지도 이동이면 썰매 돌려보냄, 뒤 입력은 반 속도로 크게 돎, 만세는 땅에서만, 지도 핀 「하늘 썰매」. 정류장 썰매 방향을 서북서(1.25)로 바꿈(트리 쪽은 앞 13m가 막혀 못 날아오름). **운영 서버 다시 켜야 다른 사람에게 보임** `docs/멀티-서버-다시켜기-하늘썰매-2026-11-18.md` | 변경기록-2026-11-18-하늘썰매-연결.md |
| 11-18 | 크리스마스 하늘 썰매·별 흔적 그림(월드아트, 추천안·대표 미확인): 루돌프(`reindeer.js`, 동동이 비율·붉은 마구, 동작 stand·run·takeoff·fly·land) 2마리 + 썰매(`sky-sleigh.js`, 앞을 끌면 썰매가 2.35m 뒤에서 끌려옴·바깥 기울기 15°) + 앉은 동동이(`sleigh-rider.js`, poses.js 앉기 + 고삐, 탄 동안 땅 높이 더하지 않음) + 별 흔적(`star-trail.js`, 눈 튐 포함). 썰매 몇 대든 그리기 7번 + 별 1번, 화면 밖이면 안 그림. 정류장 그림 `REINDEER_STATION` 원 (25, 28)·썰매 (23.5, 30.68) 북서향, 아이콘 5개. 시안 B에서 `village.festive.skySleigh`로 내보냄 | docs/크리스마스/하늘썰매-그림-에셋-v1.md |
| 11-18 | 크리스마스 루돌프 하늘 썰매(대표 지시·결정, 월드디자인 설계 v2): 루돌프 등에 타기(v1) 폐기 → **루돌프 2마리가 끄는 산타 썰매에 앉아 탐**, 이름 「하늘 썰매」·정류장 「루돌프 썰매 정류장」, 언덕 눈썰매 규칙·기록판은 건드리지 않음(act도 `sl`과 따로), 동승 범위 밖. 휴대폰 조작 = 조이스틱 + ▲▼ 단추(손 떼면 둥실, PC WASD·Space·C·Shift), 범위 = 트리에서 38m 원 + z ≥ −26·땅 위 6~20m, 별 흔적 = 보통(PC 상한 400·휴대폰 150), 동시 탑승 제한 없음. 정류장 (25, 28) 북서향·속도 6/9m/s·카메라 7/10m·먼 사람부터 1마리 등 나머지는 추천안(대표 미확인). 다른 사람에게 높이를 보내려면 서버를 바꾸고 운영 서버를 다시 켜야 함 | docs/크리스마스/루돌프-하늘썰매-설계-v2.md |
| 11-17 | 공개 멀티 서버는 다른 곳 맥 하나만(대표 결정): 이 맥의 multi:up을 끄고 다시 켜지 않음, 예전 조작감 썰매 기록은 그대로 둠. 다른 곳 다시 켜기 절차 `docs/멀티-서버-다시켜기-대표용-2026-11-17.md` | 변경기록-2026-11-17-크리스마스-B안-기본-정원30-피하기-썰매2.md §7 |
| 11-17 | 크리스마스 6차(대표 결정, 월드기획 전달): ① 서버당 정원 30(`EXPERIENCE_MAX`, PC 동동이 몸 29명, 운영은 `MAX_PER_ROOM_CHRISTMAS`가 있으면 우선) ② 눈싸움 맞음 = 눈덩이가 지나가는 순간 자리(서버 `sb` fly:1 → 맞으면 `sbh`, 피하기 가능) ③ 썰매 조작감 2가 모든 화면 기본(`?sled` 옵션 없앰, 기록판은 `fv:2` 기록만, 기존 기록은 지우지 않음) ④ 시안 B가 기본 화면(`festive-layout.js` `lookLevel`: 옵션 없음 = B, `?look=festive` = A, `?look=classic` = 예전 화면). 커밋·배포함. 운영 멀티 서버는 다시 켜야 ①②③ 적용 | 변경기록-2026-11-17-크리스마스-B안-기본-정원30-피하기-썰매2.md |
| 11-17 | 크리스마스 시안 B 링크·회전목마 크게(월드아트, 30명 기준·대표 미확인): 링크 16×10m를 입구 길 서쪽 (−15.5, 30.5)로(집 1채·선물상자는 옛 링크 자리로), 회전목마 반지름 3.6m·16자리(루돌프 8 + 썰매 의자 4대×2)·24초. act `mg` 허용 값 0~16은 월드개발 몫. 썰매 점프대 윗면 감기 방향 고침(크기 그대로). 이동 돕기 디자인 `docs/크리스마스/이동돕기-디자인-v1.md` | 변경기록-2026-11-17-크리스마스-밝고화려하게-시안.md 5차 |
| 11-17 | 크리스마스 시안 B 광장 넓히기(월드아트, 30명 기준·대표 미확인): `?look=festive-b`에서만 `festive-layout.js` `PLAZA_B`로 광장 17→22m·둘레 시설 1.3배·회전목마 (17.5,23.5)·링크 (−28,23.5). 두 마당·트리·썰매 산은 그대로. `layout.js`가 `festive-layout.js`를 불러 서버 이미지에도 넣음 | 변경기록-2026-11-17-크리스마스-밝고화려하게-시안.md 4차 |
| 11-17 | 크리스마스 5차(월드개발, 개발 결정·대표 미확인): 시안 B 달리기(걷기×1.6, 화면 단추 + Shift, 놀이 중 자동 해제)·바로가기 지도(핀 10곳, 놀이 그만두고 0.22초 어두워짐 뒤 시설 앞으로, 1.3초 간격, 월드아트 디자인 v1). act.mg 범위 = festive-layout 자리 수(16). 눈싸움: 내 눈덩이는 바로 그림(서버 답으로 맞춤)·맞은 눈덩이는 맞은 사람 쪽으로 휨·맞으면 0.35m 밀림·PC F 톡 자동 조준·그림 돌려 쓰기와 상한, 휴대폰 동동이 몸 배정 여유·몸 넘겨받기(최대 8), 공용 avatar headTop은 마지막 그리기 값. 썰매 조작감 2(`?look=festive-b`·`?sled=2`, `SLED_RULES_2`, 기준 55초). 서버 규칙 변경 없음(제안: 눈싸움 맞음을 떨어지는 순간으로) | 변경기록-2026-11-17-크리스마스-이동돕기-눈싸움-썰매.md, …-30명-넓힌광장-점검.md |
| 11-17 | 크리스마스 시안 B 회전목마 타기·아이스링크(월드개발, 개발 결정·대표 미확인): `?look=festive-b`에서만 단추·act. 회전목마 자리는 빈 자리 중 그 순간 계단에 가장 가까운 곳 자동 배정, 다른 사람은 내 화면의 같은 번호 자리에 그림(시계 차이 무관), 걷기 입력이면 내림. 링크는 문 앞 단추로 출입(문짝 그림이 닫힘), 안에서는 걷기 ×1.1·0.66초에 90%·손 떼면 약 0.9m 미끄러짐·보폭 ×0.55, 그림 쪽 링크 충돌은 그대로 | 변경기록-2026-11-17-크리스마스-회전목마-아이스링크.md |
| 11-17 | 크리스마스 눈썰매 2차(월드개발, 개발 결정·대표 미확인): 케이블카(마을 (20.5,−24.6) ↔ 꼭대기 (−33,−112.5), 7.5초·건너뛰기 2초, act.gd만 서버 위치 한도 90m/s, 다른 사람 높이는 케이블에서), 썰매 산 출발 26m·단 7줄(땅은 고정, 길만 시드), 결승 약 430~460m, 블록 7종+굽이 3종, 같은 방 = 서버 시드 하나(`sc`, 레이스 열면 새 시드, 누가 타는 중이면 못 바꿈), 기록·고스트·기록판은 코스별, 코스마다 마찰 맞춤(보통 실력 약 66초), 북쪽 열린 곳 \|x\|<36·z ≥ −115, 멈춤 구역 「출발대로」 없앰 | 변경기록-2026-11-17-눈썰매-2차-케이블카-긴코스.md |
| 11-17 | 흡연장 상호작용·같이 피우기(개발 결정·대표 미확인): 상황·시간대·소리·수첩·채팅 창은 각자 화면(남의 하늘을 바꾸지 않음), 그 밖의 상호작용은 모두에게 같게. 담배 `lounge:smoke`에 `kind`·`k`, `act`에 좌판 칸 `s`·난간 지점 `lx,lz`·옷 `o`·인사 `e,en`(인사는 채팅 `c` 대신 act로 — 같은 말 반복 막기에 안 걸림). 벤치 같은 칸·0.4m 안 난간·자판기 뽑는 중은 서버가 먼저 온 사람만(늦은 사람 `lounge:no`, resume도 같은 판정), 자판기는 화면에서 줄 서기 | 변경기록-2026-11-17-흡연장-상호작용-수정.md |
| 11-17 | 허브 개선(대표 확정: PC 시안 B 마을 지도·휴대폰 시안 A 카드 목록·서버는 허브에서·소리 설정 하나로): 허브에서 고른 서버는 sessionStorage로 한 번만 넘기고 주소창에 안 붙임(직접 들어오면 예전 서버 창), 공용 설정 `aoworld:settings:v1`(sound·volume·music=캐럴·hubTime, 처음엔 체험별 옛 값을 이어 받음, 옛 키는 그대로 같이 씀), 흡연장·크리스마스 크기는 0.7 = 예전 크기. 동동이 평면 그림은 시안 그림 임시. 목록형 기준 폭 ≤760·높이 ≤500, 화질 칸 없음(개발 결정·대표 미확인) | 변경기록-2026-11-17-허브-개선.md |
| 11-17 | 크리스마스 눈썰매·눈싸움 개선(월드개발, 설계 v1 추천안 그대로·대표 미확인): 썰매 산은 마을 경계(북쪽 통로 \|x\|<25)에 맞춰 5줄 지그재그(결승 192m·출발 18m), 집 (-8.5,-21)→(-29,-22), 썰매 타는 사람(act.sl 5·6)만 서버 순간이동 한도 14m/s, act.sl 1~4 출발대·5 타는 중·6 뒷자리·cr 웅크림·tm 팀, 별 ★★★ 25초, 팀 색은 발밑 빛(옷 색은 월드아트 후속) | 변경기록-2026-11-17-눈썰매-눈싸움-개선.md |
| 11-16 | 크리스마스 캐럴(월드개발): 소리-출처-v1 1순위 미 공군 군악대 8곡을 원본 그대로 `public/sounds/christmas/carol/`, `<audio>` 흘려 재생(공용 `createDeck`에 `start`·`gain`·`prime` 추가, 관악산 FM 동작 같음), 모두 같은 시계로 같은 곡, 🔊·캐럴 끄기면 받기도 멈춤, 버스 0.24·모닥불 앉으면 0.12(개발 결정·대표 미확인), 🎵 창에 곡마다 출처 | 변경기록-2026-11-16-크리스마스-캐럴.md |
| 11-16 | 크리스마스 놀이(월드개발, 숫자는 개발 결정·대표 미확인): 선물 우체통(5분 3개·같은 사람 5분 1개·모두에게 30분 1번, 끊긴 사람 몫 60초 보관, 오너먼트 선물 = 트리 몫과 따로), 모닥불 8자리(겹치면 서버가 seat:no), 눈사람(1m에 반지름 4.5cm·협동 1.5/2배·3분 녹기·전시 8), 눈싸움(판정은 서버·마당 안만·0.8초), 썰매(최고 9m/s·3줄·둘이 타기는 앞사람 수락). 소리는 모두 Web Audio 합성(외부 음원 없음), 캐럴은 다음 단계. 공용 `hiking-chat-ui` `bubbleFor` 옵션·`spots.js` `POSE_TOOLS` 내보내기(등산·흡연장 동작 같음) | 변경기록-2026-11-16-크리스마스-놀이.md |
| 11-16 | 크리스마스 광장·멀티·트리(월드개발): 정원 20(체험별 `EXPERIENCE_MAX`), 트리 판정은 서버·빈 방 5분 뒤 초기화(개발 결정), 휴대폰은 가까운 6명만 동동이 + 나머지 가벼운 동동이, 같은 말 반복·30초 쉬기는 등산·흡연장·크리스마스 공통(대표 결정), 음소거 = 완전히 숨김(대표 결정). 허브 카드는 맨 뒤 | 변경기록-2026-11-16-크리스마스-광장-멀티-트리.md |
| 11-16 | 크리스마스 그림·에셋 v1(월드아트, 추천안·대표 미확인): 광장 돌바닥 반지름 17m, 옷 3종(산타·노르딕 니트·엘프)+선물 옷 3종, 정적 소품은 `bakeStatic`으로 재질별 합침, 넓은 눈 바닥은 화면 외곽선 제외(휴대폰 줄무늬). 공용 `src/lounge/outfit.js` `applyOutfit`에 `{table,hide,fold}` 옵션(흡연장 동작 같음) | 변경기록-2026-11-16-크리스마스-그림-에셋.md |
| 11-14 | 함께 걷기 서버 자동 켜기(대표 결정): LaunchAgent `~/Library/LaunchAgents/world.ai-office.multi-up.plist`가 로그인 때 `scripts/multi-up.mjs`를 켜고 멈추면 30초 뒤 다시 켬(로그 `~/Library/Logs/ai-office-world-multi.log`). 끄기는 `launchctl bootout gui/$(id -u)/world.ai-office.multi-up`(pkill만 하면 다시 켜짐), 따로 `npm run multi:up` 하면 포트 겹침. plist에 Node 24 경로가 박혀 있음 | (이 줄) |
| 11-14 | 저장소·사이트 이름 `gwanak-hiking` → `ai-office-world`(대표 결정, 체험이 여럿이라). 주소 `engchoon.github.io/ai-office-world/` · `/hiking/` · `/smoking/`, 옛 주소는 끊음(이동 페이지 없음). 같은 도메인이라 저장 기록·설정은 그대로, 저장 키 이름은 안 바꿈. 릴스 엔딩·인스타 본문도 새 주소. 이름 바꾸기·push·배포는 산기획이 함(대표 지시) | 변경기록-2026-11-14-저장소이름-변경.md |
| 11-13 | 함께 걷기 서버를 체험마다 3개·정원 30명으로(대표 지시): `SERVERS` 등산 `관악산-1·2·3`·흡연장 `옥상-1·2·3`(1서버 방 키는 예전 그대로 `hiking:관악산`, 2·3서버는 `hiking:관악산-2`·`-3`), `SERVER_MAX`·`maxPerRoom`·`MAX_PER_ROOM` 30. `multi:up`은 `TRUST_PROXY=1`·`HOST=127.0.0.1`(전에는 터널 뒤 모두 127.0.0.1이라 같은 곳 32명 제한에 전체가 묶였음). 서버 고르기 창은 높이 540px 이하에서 줄을 납작하게. 꽉 찬 방 한 사람 약 23KB/s, 6서버 만원이면 맥 업로드 약 34Mbps | 변경기록-2026-11-13-서버3개-정원30.md |
| 11-11 | 함께 걷기 서버 주소를 사이트가 알아서 찾음(대표 결정: 당분간 내 맥 + Quick Tunnel, 링크에 `?server=` 붙이지 않음): `npm run multi:up`(서버·`cloudflared tunnel --url`·`caffeinate`, `ALLOWED_ORIGINS`=engchoon.github.io+로컬)이 터널 주소를 gh-pages 맨 위 `multi-server.json`에 이 파일 하나만 커밋해 push(`scripts/multi-publish.mjs`, partial clone), Ctrl+C면 `{state:'off'}`. 사이트 순서 `?server=` → 빌드 변수 → 공개 파일(`?t=` 매번 새로) → 기억한 값(파일 못 받을 때만), 꺼짐이면 '서버가 꺼져 있어요'·옛 trycloudflare `?server=`는 파일 주소로 바꾸고 주소창에서 뺌, 주소창에 붙이기·허브 카드 링크 붙이기 없앰. `npm run deploy`는 이 파일을 이어 붙임. 점검 `scripts/verify-server-file.mjs` | 변경기록-2026-11-11-서버주소-공개파일.md |
| 11-10 | 멀티 상호작용 상대에게 보이기(등산·흡연장): 공통 행동 상태 `act`(`ACT_SCHEMA`·`sanitizeAct`, 흡연장 `p·b·can·sip` / 등산 `p·g·sf·x·n·v`)를 바뀔 때만 보내고, 서버가 마지막 값을 기억해 입장·`j`·resume 때 다시 줌. 흡연장은 자세·캔 그리기를 `spots.js` `createPoser`로 빼서 상대 몸에도 같은 코드, 다른 사람이 차지한 자리는 피함(벤치 ±0.42m·난간 ±2.7m). 등산은 `src/multi-act.js`·원격 `createHikerActs`(quiet). '대표만 눌림'은 누르기 결함이 아니라 상대 화면에 안 보인 것(재현 9/9 눌림). 점검 `scripts/verify-multi-interactions.mjs`·`verify-multi-act-hiking.mjs` | 변경기록-2026-11-10-멀티-상호작용.md |
| 11-09 | 입장 흐름: 허브 → 체험 카드 → (등산) 산 고르기 → **서버 카드 전체 화면**(`server-pick.js` `entry`, 허브 카드와 같은 모양·인원 5초 갱신·꽉 참 비활성·닉네임·혼자 하기) → 입장. 게임 안 서버 바꾸기도 같은 카드(`switch`), full 거절 시 카드 화면으로 돌아와 '방금 꽉 찼어요'. `/health` 실패·서버 주소 없음은 '서버에 연결할 수 없어요' 카드 + 혼자 하기만. `?multi=`는 고르기를 건너뛰되 같은 방 키 | 변경기록-2026-11-09-서버카드-입장흐름.md |
| 11-08 | 함께 걷기 '먼저 있던 사람이 안 보임' 수정(등산·흡연장): 서버는 resume 때 마지막 자리·담배 상태 복구·같은 토큰 이중 접속은 같은 ID로 이어 받고 옛 연결 닫음·이름 묻기 `j`에 자리도 다시 줌·빈 방/`gwanak-room-1`은 첫 서버 방. 클라이언트는 숨은 탭도 워커 타이머로 1초 자리·3초 이름(`createBackgroundTimer`), 처음 보는 사람에게 바로 인사, 시간 초과는 `createPresence`(로딩·숨김 뒤 첫 프레임 보류, 서버 모드 20초·내 컴퓨터 5초). 칩: 서버 없음 `💻 … 이 브라우저 창끼리만`, 목록 밖 방 `🟡 다른 방 · n명`. 점검 `scripts/verify-multi-visibility.mjs` | 변경기록-2026-11-08-멀티-안보임.md |
| 11-08 | 서버 주소는 늘 주소에 붙임(`src/server-link.js`): `?server=`는 localStorage `gwanak-multi-server`에 기억, 체험 페이지는 없으면 빌드 변수 → 기억한 값으로 주소창에 붙이고, 허브는 카드 링크에만 붙임. 배포 때 `VITE_MULTI_SERVER_URL`로 서버 주소를 넣음. 라디오: 받기 끝나면 음량 재계산(볼륨 눌러야 소리 나던 버그), 95.5는 녹음 없으면 기기 안 한국어 목소리(localService만)로 읽기·간격 15~25초 | 변경기록-2026-11-08-서버주소-라디오버그.md |
| 11-08 | 관악산 FM 라디오 구현: 📻 태그(켜지면 `📻 91.9`, 잡음이면 `~`) → 휴대용 라디오(전원·끌어서 돌리는 다이얼·0.1 단추·채널 바로 가기·볼륨 노브·뒷면 링크). 91.9 Kevin MacLeod 8곡(CC BY 4.0, 시각 % 총길이로 이어 듣기·1.5초 겹침), 95.5 자막 + 합성 낮은 톤(녹음 파일은 manifest `lines[].file`만 채우면 붙음), 99.1 Freesound CC0 6개 두 층(3초 겹침). 잡음·딸깍은 Web Audio 합성, 섞기 공식 radio-design §3-2. 기본 꺼짐·주파수·볼륨만 저장, 끄면 노드·`<audio>` 해제, 소리 꺼짐 연동, 켜지면 환경음 ×0.7. 파일은 원본 그대로 `assets/radio/`(빌드 복사) | 변경기록-2026-11-08-동행-라디오.md, radio-design.md |
| 11-08 | 같이 등산하기(동행) 구현: 이름표 누르기·👥 목록으로 제안, 서버가 쌍 상태(한 쌍·30초 만료=저절로 거절·거절/만료 뒤 같은 사람 60초 금지·제안 10초 1번·숨김 불가·소켓 끊김 60초 유예와 resume 이어 붙임·나가기는 바로 끝, 메모리만). 8m 안 나란히(폭 1.6m 이상·계단 아님 = 좌우 ±0.5m·ID 작은 쪽 왼쪽, 아니면 앞뒤 1.5m), 0.85m 안 밀어내기(최대 0.8m/s, 노면 반폭−0.3m·금지 원 지킴, 서버 순간이동 거부 0), 자동 걷기는 앞선 쪽이 맞춤·8m 0.4배·15m 0.2배+'기다리는 중'. 동행 아닌 사람끼리 겹침은 범위 밖 | 변경기록-2026-11-08-동행-라디오.md |
| 11-08 | 의견 보내기(등산·흡연장 공용 `src/feedback.js/.css`, 사본 금지): 사용자가 「🐙 GitHub에 올리기」를 누를 때만 새 탭(noopener)으로 `EngChooN/gwanak-hiking` 이슈 작성 페이지를 미리 채워 엶(게임이 몰래 보내지 않음, §5 예외 아님). 제목 `[등산|흡연장] 아이콘 내용 앞 40자`, 라벨 `feedback`+`bug`/`idea`+`hiking`/`smoking`, 본문 6000자 안(내용 쪽을 자름). 붙는 정보 = 체험·경로(옵션 `name`·`multi` 지움)·화면·기기·방향·브라우저 이름·시간대/날씨·빌드 날짜(`__BUILD_DATE__`)·시각, 닉네임·채팅·위치·IP 없음. 「📋 내용 복사」는 clipboard 실패 시 글을 골라 보여 줌. 카드가 열린 동안 키는 document 잡기 단계에서 멈추고 이동은 `feedbackOpen()`으로 0. 등산 = 설정 시트 `💌 의견 보내기` 줄(`hiking:feedback-open`) | 변경기록-2026-11-08-의견보내기.md, docs/흡연장/의견보내기-디자인.md |
| 11-08 | 라디오: 방송사에 허락 문의 안 함. 외부 방송 주소 접속 예외는 만들지 않음(§5 유지, `STATIONS` 빈 채). 허용은 ① 사용자가 누르는 방송사 공식 페이지 링크(새 탭, 대표가 열어 확인한 것만) ② CC0·CC-BY 음악·소리를 우리 서버에서 재생하는 자체 방송국 "관악산 FM"(CC-BY는 게임 안 크레딧 표기, NC·SA·Pixabay 원본 직접 제공 제외). 추천 1순위 = 관악산 FM | docs/radio-options.md, 변경기록-2026-11-08-라디오-허락없는길.md |
| 11-08 | 등산 첫 화면(산 고르기)에 닉네임 칸: 12자·비우면 `등산객XXXX`, 저장값은 서버 고르기 창과 같은 `gwanak-multi-name`(치는 대로 저장, 서버 창은 열 때 다시 읽어 미리 채움, 혼자 걷기도 저장), 입력 중 단축키 막음, 키보드가 올라오면 `pk-typing`으로 스크롤 | 변경기록-2026-11-08-서버고르기.md |
| 11-08 | 서버 고르기 창(등산·흡연장 공용 `src/server-pick.js`): 서버 목록은 `multi-protocol.js` `SERVERS`(관악산 1서버 `관악산-1`→`hiking:관악산`, 옥상 1서버 `옥상-1`→`smoking:옥상`, 줄 하나 = 서버 하나), 정원 20·서버 방은 꽉 차면 `-2` 대신 `full` 거절(목록 밖 방은 옛 규칙), `/health`에 `servers`·`total`, 창은 5초마다 갱신·`방금 꽉 찼어요`·연결 실패면 혼자만. 등산 산 고르기 → 서버 고르기 → 출발, 흡연장 로딩 뒤. 방 이름 칸 없앰, `?multi=` 옛 주소·webdriver는 건너뜀(`?serverpick=on`) | 변경기록-2026-11-08-서버고르기.md |
| 11-08 | 등산 채팅 PC 단축: 함께 걷기 중 Enter = 채팅 열고 입력, 글 있으면 보내고 입력 유지, 빈 Enter·Esc = 접기. `?multi`로 바로 참가해도 💬가 보이게 채팅 HUD 설치 뒤 `statusNow()` | 변경기록-2026-11-08-채팅-엔터.md |
| 11-08 | 자동 걷기는 다른 창·탭으로 가도 계속(blur·숨김에 끄지 않음). 숨은 탭은 워커 타이머로 0.1초씩 보충 걸음(그리기 생략, 최대 60초 따라잡기), 소리는 숨은 동안 없음 | 변경기록-2026-11-08-자동걷기-백그라운드.md |
| 11-08 | 멀티 채팅·흡연장 열기: 채팅은 두 체험 공통 `c`(`lounge:chat` 예약 대체), 80자·제어/방향 문자 제거·금칙어 `***`, 2초 1번·10초 4번(넘으면 `c-limit`), 보낸 사람 포함 중계, 디스크 저장 없음(신고 기록에만 대상 최근 3줄). 흡연장 = 공통 + `s` + `lounge:smoke {state,lit}`(smoke.js 상태 허용 목록). 익명 `등산객`/`손님`. BroadcastChannel `gwanak-multi:체험:방`(등산은 옛 이름) | 변경기록-2026-11-08-멀티채팅-서버.md, 멀티-서버-운영안내.md §3-1·§3-2 |
| 11-08 | 멀티 서버 체험 구분: hello에 `exp`(`hiking`\|`smoking` 허용 목록, 없으면 `hiking`, 목록 밖은 `reject`로 거절), 방 키 `체험:방이름`(끝 번호는 원래대로 떼서 `?multi=관악산-1` → `hiking:관악산`), -2 규칙·속도 제한·신고는 체험별 방 안에서, 신고·resume은 체험을 넘지 않음, 체험별 받는 메시지 종류(흡연장은 공통만, `s`·`lounge:chat`·`lounge:smoke` 예약) | 변경기록-2026-11-08-멀티서버-체험구분.md, 멀티-서버-운영안내.md §3-1 |
| 11-08 | **온라인 메타버스 통합**: 저장소는 `gwanak-hiking` 하나, Vite 다중 페이지 `/` 허브·`/hiking/`·`/smoking/`, 공용 코드 한 벌(흡연장 사본 없앰), 루트의 등산 옵션 주소는 `/hiking/`로 replace, `~/online-smoking`은 남겨 둠. 저장소 이름 변경은 대표 결정 뒤 | 기획(산기획 11-08), 변경기록-2026-11-08-메타버스-통합.md |
| 11-08 | 함께 걷기 HUD 입구: 새 탭 대신 설정 시트에 `👋 함께 걷기` 버튼, 방 이름(기본 `관악산-1`)·닉네임(12자, 비우면 `등산객XXXX`) 카드, 연결 상태 칩 6종(연결 중·연결됨·다시 연결 중·끊김·방 꽉 참·내 컴퓨터 모드), 입력 중 단축키 막음. 호스팅 추천 1안 Fly.io 도쿄(미결정, 2안 Vultr 서울) | 변경기록-2026-11-08-함께걷기-HUD입구.md, 멀티-서버-호스팅-비교.md |
| 11-08 | 함께 걷기 서버 1차: 직접 만든 WebSocket(Node 내장 http·crypto, 새 패키지 없음). 방 20명(차면 방이름-2), 위치 초당 15회, 순간이동 거부(FLAG.jump 1초 1번, 3초 고집하면 다시 맞춤), 10Hz 묶음, 인사·셀카·동물 놀람 중계, 신고 서로 다른 3명 → 24시간 이름표 숨김·재배정, IP는 메모리 해시만, 신고 JSONL 90일. 서버는 ws://만, wss는 앞단. 설정은 환경 변수(PORT·DATA_DIR·ALLOWED_ORIGINS 등), `/health`. 주소는 `?server=` → `VITE_MULTI_SERVER_URL` → 없으면 BroadcastChannel. 휴대폰 모델 2명. 1차 시험은 내 맥 + Quick Tunnel(대표) | 변경기록-2026-11-08-멀티서버.md, 멀티-서버-운영안내.md |
| 11-07 | 빈 구간 벤치 5곳 더(850·1,863·2,858·3,445·3,870m, est), 4,106m 벤치는 나무계단 경사(다리 차 0.4m) 때문에 3,870m 평탄참으로 옮김. 즐길거리 자리는 물줄기 띠를 피하고 계단 옆은 가장자리에서 1.3m, 나무계단 난간은 벤치 앞만 틈. 동물 허용 폭·금지 영역 자료 `src/animal-lanes.js`(자동 생성, 연결은 산개발) | 변경기록-2026-11-07-빈구간소품-지형검증.md |
| 11-07 | 동물은 고정 자리 대신 출현 구역(`ANIMAL_ZONES`) + 5분 시간 칸 결정적 난수(`src/animal-zones.js`)로 나오고 시간의 함수로 배회(같은 방 = 같은 동물, 서버 없음, 반응은 각자 화면). 멧토끼 추가, `CAT_SPOTS` 삭제, 빈 구간 벤치 4곳(640·2,600·3,224·4,106m) | 변경기록-2026-11-07-동물배회-토끼.md |
| 11-07 | 동물 출현·배회가 `src/animal-lanes.js` 허용 폭(절벽·물·다른 구간 노면)과 금지 원(바위·시설)을 지킴: offset 상한 = min(종류 상한, zone.maxOffset, laneLimit), 막히면 반대쪽 → 같은 씨앗 난수열로 다시 뽑기(결정성 유지), 걷는 다리는 0.05m 간격 검사 | 변경기록-2026-11-07-동물허용폭연결.md |
| 11-06 | 즐길거리 소리·문구 연결: 효과음은 `src/trail-sound.js` 하나로, 발소리와 같은 AudioContext·마스터를 거치고 '소리 꺼짐'이면 재생 0(즐길거리 쪽 합성음·자체 AudioContext 없앰). 파일 11개 `TRAIL_SFX`대로, 라디오는 산스장 18m 안 반복·거리 감쇠. 말풍선은 모두 `pickLine`(⑥ 문구 5개도 표로 옮김), 자주 생기는 장면은 다른 말풍선이 있으면 건너뜀. 계곡 고양이 2곳 est | 변경기록-2026-11-06-즐길거리-소리문구연결.md |
| 11-06 | 즐길거리 HUD 디자인: 수첩 토큰에 형광펜·말풍선 낮/노을/밤 색 추가, 말풍선은 trail-hud.css가 덮음. 문구 `src/trail-lines.js`(첫 문구 = 시안), 효과음 7개는 `scripts/make-trail-sfx.mjs`로 직접 합성(CC0, `public/sounds/trail/`). 소리 연결은 산개발 | 변경기록-2026-11-06-즐길거리-디자인-효과음.md |
| 11-06 | 즐길거리 HUD 연결: 진행 카드 간식 줄(🍫 n/5·먹기·⚡ 빨라짐), 화면 아래 즐길거리 줄(들르기 4초·기구 버튼·역기 연타·일어나기·발끝 당기기). 초콜릿 개수는 이어하기 저장, +20%는 계단 제외. 들르기는 자동걷기 중에만, 거리는 소품 가장자리부터. 수첩에 즐길거리 칸 2개(득근·깨끗한 신발, 완등 조건 아님). 검사 `verify-trail-buttons.mjs`·`verify-trail-dropin-route.mjs` | 변경기록-2026-11-06-즐길거리-HUD.md |
| 11-06 | 첫 화면 = 산 고르기(산 배열, 지금 관악산 1곳). 완등 기록은 localStorage, 도장은 SVG. 자유 설정(날씨·시간·계절·출발 지점·현재 그대로)은 완등 또는 개발 버전에서 열림. 개발 버전 = 구간 이동과 같은 조건(`DEV_BUILD`), 배포본도 개발 버전. 고른 값은 sessionStorage. 중간 출발 등산은 가장 빠른 기록에서 뺌 | 변경기록-2026-11-06-산고르기-완등도장-자유설정.md |
| 11-06 | ⑥ 헥헥·쥐 구현: 규칙은 `src/exhaustion.js`(쥐가 풀리면 헥헥 1.5초 없이 바로 터벅터벅), 1인칭은 쥐 동안 시야만 0.3m 낮춤, HUD는 `hiking:trail {type:'exhaust'}`·`cramp-release` 명령으로 연결 | 변경기록-2026-11-06-헥헥-쥐.md |
| 11-06 | 즐길거리 오브젝트·동물 게임에 넣음: 산스장 2,416m·벤치 5곳(1,552·1,692·2,148·3,639·4,513m)·먼지털이기(광장 왼편), 동물 3마리 상한, 들르기는 `hiking:trail-offer`/`trail-play` 이벤트. 모자·배낭은 따로 된 메시 | 변경기록-2026-11-06-즐길거리-오브젝트-동물.md |
| 11-06 | ⑥ 무리해서 뛰면 추가 승인: 스테미너 0이면 헥헥 1.5초, 오르막에서 25% 확률로 쥐 3초(🦶 발끝 당기기 1초), 2분 재발 없음. 즐길거리 계획에 합침 | 기획-2026-11-06-자동걷기-즐길거리.md §⑥ |
| 11-06 | 자동걷기 즐길거리 5종 시안 승인: 산스장·초콜릿(5개, 30초 +20%)·벤치·동물(다람쥐·고양이·까치)·등산화 먼지털이기. 웃음은 시안 정도, 자동걷기 중에는 들르기 버튼을 4초 동안 띄움 | 기획-2026-11-06-자동걷기-즐길거리.md, artifacts/props-concepts/board.html |
| 11-06 | 계절 모습 구현: 서울 날짜(봄 3/25·여름 5/1·가을 10/15·겨울 12/1), `?season=`·`hiking.setSeason`·`hiking:free-settings`로 바꿈. 셰이더 uniform 하나로 색·잎·눈을 바꿔 다시 로딩·큰 텍스처 없음. 쌓인 눈은 날씨와 별개 | 변경기록-2026-11-06-계절별-산-모습.md |
| 11-06 | 휴대폰에서 쌍안경·카메라 "✕ 내리기" 버튼, 카메라 틀은 화면 방향을 따름, 기구 사용 중 조이스틱 숨김 | 변경기록-2026-11-06-모바일-쌍안경-휴대폰-내리기.md |
| 11-06 | 망원경 사용 중에는 시야 안 도심 칸부터 실제 건물로 만들고, 나머지는 상자 건물로 그림(납작한 판 금지) | (미커밋, 직전 작업) |
| 11-06 | 아이폰 재로딩 대책: 도시 칸 지연 생성·해제, 휴대폰 기본 화질 '낮음', 1인칭 헤드밥 제거, 시점 칩 상시 | 변경기록-2026-11-06-아이폰-메모리-1인칭-시점칩.md |
| 11-06 | HUD를 「등산 수첩」 디자인으로 바꿈(진행 카드·책갈피 탭·도장 버튼·낮/노을/밤 종이 톤). 복장 고르기 삭제 | 변경기록-2026-11-06-등산수첩-HUD.md, UI-등산수첩-사양.md |
| 11-06 | **실사 모드 제거, 카툰만 남김.** 모드 선택 화면 삭제, 첫 로딩 단축 | 변경기록-2026-11-06-피드백8건.md |
| 11-05 | 카툰 캐릭터는 귀여운 시안 중 ① 동동이로 결정(링크 비율 폐기). 다른 시안은 `src/toon/mascot-concepts.js`에 보관 | 변경기록-2026-11-05-카툰-동동이.md |
| 11-05 | 카툰 방향: 낮 = 야생의 숨결, 노을·밤 = 너의 이름은. 참고 사진 `design/ref-cartoon/`은 커밋·배포 금지 | 카툰-기준값.md |
| 11-05 | 200m 청크 스트리밍 도입 | 기획-실사-카툰-AB-청크스트리밍-2026-11-05.md |
| 11-04 | 배포는 GitHub Pages(공개 주소 괜찮음), 상호작용 작업이 끝난 뒤 한 번. 개발용 구간 이동 버튼 포함 | — |
| 11-04 | 일시정지 제거, 모든 기능 HUD 버튼 노출, 모바일 떠다니는 조이스틱 | 변경기록-2026-11-04-HUD-일시정지-조이스틱.md |
| 11-04 | 정상 계단 제거, 계단 측벽·지면 밀착 | 변경기록-2026-11-04-계단-정리.md |
| 11-04 | 함께 걷기는 내 컴퓨터 시제품까지만. 서버는 대표 결정 뒤 | 멀티-설계.md |
| 11-03 | 입구 광장 출발점은 가설 B(대표가 로드뷰로 고름, 현장 실측 아님) | 입구광장-배치조사.md |
| 11-02 | 1:1 스케일, 실제 걷는 속도(전체 150분, 계단 초당 1.2걸음). 경로 길이를 공식 수치에 맞춰 줄이지 않음 | 기획서-구현방식-1대1스케일-실제속도.md |

## 9. 자료·저작권 주의

- 출처와 이용 조건은 `data/자료-출처-이용조건-기록표.md`, `assets/출처-라이선스.md`에 기록합니다. 새 자료를 쓰면 여기에 추가합니다.
- 다음은 커밋·배포하면 안 됩니다: 게임·영화 참고 이미지(`design/ref-cartoon/`, `artifacts/cartoon-compare/`), 재배포 조건을 확인하지 못한 모델(Mixamo 유래 `Soldier.glb`).
- 지도·도심 건물은 OSM 자료입니다. 화면 아래 출처 줄(`#source-line`)을 유지하세요.
- 설명글은 위키 글을 옮기지 않고 사실만 확인해서 새로 씁니다. 나무위키는 자동 접속이 막혀 있으니 한국어 위키백과와 공공 자료를 씁니다.

## 10. 온라인 흡연장 (`/smoking/`, 온라인 시리즈 ②)

기획서 `docs/흡연장/기획서-온라인흡연장-v1.md`, 맛·상호작용 v2 `docs/흡연장/기획서-맛과상호작용-v2.md`, 결과보고·점검표도 같은 폴더에 있습니다.

### 무엇을 만드는가
- 금연 중이거나 원래 안 피우는 사람이 **옥상 흡연장 메타버스**에서 채팅으로 떠들며 **가상 담배**를 피우는 웹 3D 체험입니다. 장소는 서울 도심 빌딩 옥상입니다.
- 옥상 NPC 4명은 11-08부터 기본으로 꺼져 있다가(`?npc=1`) **11-19 대표 지시로 코드째 지웠습니다.** 옥상에는 같이 피우는 진짜 사람만 있습니다.
- **같이 피우기(실시간 멀티, 11-08):** 같은 방 사람의 동동이(회사원 옷, ID로 정해짐)·위치·채팅·담배(불씨·연기)를 서버(`smoking:방`) 또는 같은 브라우저 창끼리(BroadcastChannel `gwanak-multi:smoking:방`)로 주고받습니다. HUD 위 오른쪽 `👥 같이 피우기` 단추(참가하면 연결 상태 칩) → 방 이름(기본 `옥상-1`)·닉네임 카드. 주소 `?multi=옥상-1&server=ws://…`(`&name=`)로 바로 참가. 규격은 `docs/멀티-서버-운영안내.md` §3-1·§3-2, 기록은 `docs/변경기록-2026-11-08-흡연장-멀티.md`.

### 브랜드 기준 — 가장 중요
- **온라인 등산이 브랜드입니다.** 캐릭터 「동동이」(1.0m·2.1등신·큰 머리)와 카툰 그래픽(3단 툰 명암·얇은 외곽선·낮 야생의 숨결/노을·밤 너의 이름은)을 그대로 씁니다. 이제 사본이 아니라 등산 원본 파일을 직접 import 합니다.
- **흡연장에서 바꾸는 것은 옷뿐입니다**(`src/lounge/outfit.js`). 대표 지시로 등산복이 아니라 **회사원 옷**(셔츠·넥타이(기본)·정장 재킷·카디건·롱패딩)을 입히고 벙거지·배낭·쌍안경은 숨기며 장갑은 맨손(피부색)입니다. 형상·비율·얼굴·동작 속도는 그대로입니다. 예전 저장값(hiker·hoodie)은 셔츠로 읽습니다.
- 흡연장 때문에 공용 파일(동동이·카툰·`device-profile` 등)을 바꿔야 하면 등산 쪽도 같이 확인하고 대표 확인을 받습니다. 흡연장만 다르게 해야 하면 공용 파일에 옵션을 더합니다(사본을 만들지 않음).
- HUD는 등산 「등산 수첩」 종이 톤 계열입니다(`src/lounge/hud.css`). 일하는 방식(§4)·일시정지 없음·HUD 버튼·떠다니는 조이스틱 규칙은 등산과 같습니다.

### 실행·점검
- `npm run dev` 뒤 `http://127.0.0.1:5173/smoking/`. 주소 옵션 `?time=day|dusk|night|auto`.
- 콘솔 `window.lounge`: `status()`, `setTime()`, `teleport()`, `setCam()`, `goTo()`, `smoker`(start·light·puff·flick…), `multi`(join·leave·status·people).
- 같이 피우기 확인: `node scripts/capture-smoking-multi.mjs`(서버 8789·vite 5199를 직접 띄움, 두 브라우저 → `artifacts/multi-chat-2026-11-08/smoking-*.png`), `node scripts/verify-multi-chat.mjs`(등산·흡연장·격리).
- 캡처 `node scripts/capture-smoking.mjs <이름> <w> <h> "<query>" "<js>" <ms>` → `artifacts/smoking/`.
- 테스트 `tests/lounge-*.test.mjs`(흡연장 core·moment-record·spots-scene·spots-walk·multi·interact, 원래 이름에 `lounge-`를 붙임). HUD 덮는 넓이·겹치는 단추 측정 `node scripts/hud-cover.mjs <이름> <w> <h> "<query>" "<js>" <ms>` → `artifacts/smoking/`, `tests/smoke-feel.test.mjs`·`tests/smoke-run.test.mjs`.

### 코드 지도 (`src/lounge/`)
- 모듈끼리는 `ctx` 객체와 window 이벤트(`lounge:chat`·`lounge:smoke`·`lounge:phase`·`lounge:ready`·`lounge:emote`·`lounge:spot` 등)로만 주고받습니다.
- `main.js`(시작·루프·`window.lounge`), `scene.js`·`rooftop.js`(옥상), `avatar.js`·`outfit.js`(동동이 + 회사원 옷), `smoke.js`·`smoke-feel.js`(담배 상태·연기·맛), `hud.js/.css`(수첩·흡연 버튼·채팅), `spots.js/.css`(자리), `moment.js`·`profile.js`(기록·금연 수첩), `audio.js`, `input.js`, `multi.js`(같이 피우기 연결: 전송·보간·상대 몸·상대 담배 `smokePlan`·채팅 중계, 이벤트 `lounge:multi-status`·`lounge:multi-note`), `multi-ui.js/.css`(👥 단추=상태 칩·참가 카드·이름표). 자리 판정(서버·화면 공용) `room-rules.js`(11-17). HUD 말풍선은 `ctx.multi.avatarOf(id)`로 다른 사람도 찾습니다.

### 흡연장 결정 기록
| 날짜 | 결정 |
|---|---|
| 11-19 | 옥상 NPC 4명(`npc.js`·`lines.js`)과 NPC 전용 기능(불 빌리기·맞불·한 대 권하기·받기·수다 대답 칩·NPC 대사/대답, 키 B·G, `smoke.js` lightFrom·lend·cloud·auto)을 코드째 지움(대표 지시). 같이 피우기(진짜 사람끼리)는 그대로. 한숨·기지개 동작도 없앰(인사 👋는 불붙이기 전 작은 「인사」 단추, 예전 화면이 보낸 한숨·기지개는 받으면 말풍선만 그림). `변경기록-2026-11-19-채팅-통일-NPC-삭제.md` |
| 11-17 | 상호작용 단추 고장 수정·같이 피우기 모두에게 같게(§8 같은 날 줄). `spots.js` 클릭 처리는 `button[data-scene]`만 상황 단추로 봄(`<html data-scene>` 분위기 표시와 겹치지 않게). 아이콘 그림은 `pointer-events:none`(누르면 늘 단추가 대상). 점검 `node scripts/verify-lounge-interact.mjs`(서버·vite를 스스로 띄움, 기본 8833·5233). `변경기록-2026-11-17-흡연장-상호작용-수정.md` |
| 11-14 | 흡연장 릴스 끝을 등산 릴스와 통일(대표 지적): AI Office 앱 화면 장면 2초(등산과 같은 캡처·문구) + 엔딩을 등산 ending.html 짜임(제목→그림→주소·"AI Office로 만든 게임" 카드, 금연 안내 띠만 더함), 주소 `ai-office-world/smoking`. 자막·안내 띠는 정가운데 x 120~960. `변경기록-2026-11-14-흡연장-릴스-엔딩통일.md` |
| 11-14 | 앉을 때 다리(대표 지적 "다리 없는 사람처럼 보임", 2차 11-14b): 등산 bench-sit 값·흔들림 그대로(오른쪽 -1.15·왼쪽 -0.75 앞으로 들고 `sin(t·3.8)·.22`로 달랑달랑, `SIT_LEG`, 위상은 사람마다 다름). 엉덩이를 좌판 앞쪽 12cm로 당겨(`SIT.back` -.12) 신발이 앞 가장자리 밖으로. 앉을 때 카메라 `SEAT_CAM` = 정면 25°·거리 2.8·pitch .22, 옥상 밖이면 반대쪽(수평 pitch .05는 신발이 몸에 겹쳐 안 됨). 점검 `OUT_DIR=… node scripts/verify-lounge-sit-age.mjs`. `변경기록-2026-11-14-흡연장-앉기-다리.md` |
| 11-13 | 앉기·일어나기·입장 안내: 벤치 앉기는 엉덩이 좌판+0.06·등받이 쪽 기댐(다리는 11-14에 앞으로 뻗음으로 바뀜)(동동이 다리 약 13cm라 발은 바닥에 안 닿음 — 등산 bench-sit와 같은 높이), NPC도 같은 `createPoser`, 앉으면 카메라 앞 비스듬히 3.4m(`main.js` `SEAT_CAM`). 내 자리 머리 위 표시 없앰 → 손 단추 줄 맨 앞 `↩ 일어나기`/`난간에서 떨어지기`(E 키). 첫 입장 안내(`age-gate.js`, 연디자인 문구): 이름보다 먼저, 연 나이 19 미만 막음·저장 안 함, 성인만 localStorage `lounge.age`(서버로 안 보냄), 설정에서 다시 보기, webdriver는 `?age=on`일 때만. 점검 `tests/lounge-age-sit.test.mjs`·`scripts/verify-lounge-sit-age.mjs`. `변경기록-2026-11-13-흡연장-앉기-입장안내.md` |
| 11-13 | 라이터·들숨·날숨·담배 타는 지직·캔커피는 녹음 파일(`public/sounds/lounge/`, CC0)로 냄. `audio.js`가 unlock 뒤 한 번만 불러오고, 한 소리에 필요한 파일이 하나라도 없으면 그 소리는 합성으로 대체. 캔은 버튼 0 → 덜컹 0.3 → 따기 1.2초(`spots.js` `DROP`), 라이터는 불꽃 0.32초 전에 불러 '화'를 맞춤. 점검 `tests/lounge-audio-files.test.mjs`·`scripts/verify-lounge-sound.mjs`. `변경기록-2026-11-13-흡연장-소리.md` |
| 11-08 | 의견 보내기: 흡연장은 ⚙️ 설정 창 맨 아래 `💌 의견 보내기`와 「상황」 패널 맨 아래 같은 단추(둘 다 `lounge:feedback-open`, 카드는 hud.js가 공용 `src/feedback.js`로 설치). HUD에 새 단추를 늘리지 않음 |
| 11-08 | 옛 폴더 `~/online-smoking`에서만 했던 모바일 HUD 재배치·할 일 걷기 수정·대상 위 표시(`spots.js/.css`·`hud.js/.css`)와 담배 소리(`audio.js`·`smoke.js`)를 이 저장소로 합침(같이 피우기 줄은 살림). 「상황」 단추는 PC = 위 오른쪽 줄 아래, 휴대폰 = 오른쪽 가장자리 가운데라 `multi.css`의 옛 가로 규칙(상황 줄을 160px 왼쪽으로)은 지움. 대상 위 표시는 「상황」 단추와 겹치면 왼쪽으로 비킴. 걷기 실패는 `lounge:spot {state:'fail'}` + 알림. 측정 `scripts/hud-cover.mjs`(5173 `/smoking/`) |
| 11-08 | 같이 피우기(실시간 멀티) 연결: 흡연장 쪽 코드는 `src/lounge/multi.js`·`multi-ui.js`에 모음. 상대 옷은 ID로 결정적 선택(옷은 아직 안 보냄), 받는 쪽이 같은 smoke.js로 담배를 그림, 내 글은 서버 되돌림을 다시 그리지 않음, NPC 각본 대사는 안 보냄, NPC는 그대로 4명·사람 채팅에 가끔(0.3·12초) 대답, 상태 칩은 👥 단추가 겸함 |
| 11-08 | 메타버스 통합으로 `~/gwanak-hiking`의 `/smoking/`으로 옮김. 공용 코드 사본을 없애고 등산 원본을 import |
| 11-08 | **대표 지시: 옷은 등산복을 따라 하지 말고 회사원 옷.** 캐릭터(몸·비율·얼굴·동작)만 동동이 그대로. 옷 4종 = 셔츠·넥타이(기본)·정장 재킷·카디건·롱패딩 |
| 11-08 | 프로젝트 시작. 장소 = 서울 도심 빌딩 옥상 흡연장. 멀티는 미룸(NPC 4명). 시간대는 지금 서울 시각 기본 + 낮/노을/밤 고르기 |
