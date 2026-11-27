# 발소리 출처 · 변경 사항

원본은 design/sounds/에 보존하며 이 폴더는 동일 바이트 복사본입니다. 확인 근거는 design/발소리-소리목록.md(산디자인, 2026-11-02)입니다. 실제 관악산 계단의 현장 녹음·귀 검수를 완료한 음원이 아닌 임시음입니다.

- 흙(dirt/ 9개), 돌길(stone/ 8개), 데크(deck/ 3개): TinyWorlds, Fantozzi — OpenGameArt/Freesound (CC0).
  - https://opengameart.org/content/different-steps-on-wood-stone-leaves-gravel-and-mud
  - https://opengameart.org/content/fantozzis-footsteps-grasssand-stone
- 돌계단(stairs/stone-stair-01~06.ogg): Fantozzi 돌길 L/R 원본의 산디자인 가공본, CC0. 피치·저역·길이·페이드·음량 조정.
- 통나무·데크 계단(stairs/log-stair-01~07.ogg): TinyWorlds wood01~03 및 BigSoundBank 0180의 산디자인 가공본, CC0.
  - https://bigsoundbank.com/steps-slipper-on-wooden-stairs--s0180.html
- 암릉(rock/ 2개): Rock walk step sound: Blender Foundation, Yo Frankie! (CC BY 3.0, https://creativecommons.org/licenses/by/3.0/), via OpenGameArt.
  - https://opengameart.org/content/rock-walk-step-sound-yo-frankie
  - 앱에서 음높이·음량 조정, 저역 보정, 길이 제한 및 끝 페이드함. 원본 FLAC 파일 자체는 변경하지 않았음.

앱 조작 안내 > 소리 출처에서도 표기를 확인할 수 있습니다. 라이선스가 다른 파일을 CC0로 일괄 재표기하지 않습니다.

## 즐길거리 효과음(trail/ 11개: ①~⑤ 7개 + ⑥ 헥헥·찌릿·비명·뒹굴 4개) — 2026-11-06

산디자인이 `scripts/make-trail-sfx.mjs`로 직접 합성한 소리입니다(외부 녹음·샘플 없음, CC0). 산스장 라디오 뽕짝도 자작 선율입니다. 자세한 표는 `assets/출처-라이선스.md`에 있습니다.

## 흡연장 효과음(lounge/ 10개) — 2026-11-13 (연디자인)

모두 CC0(퍼블릭 도메인) 녹음에서 잘라 만들었고, 새로 합성한 소리는 없습니다. 원본은 `design/sounds/lounge/raw/`에 그대로 두었고 자르는 방법은 `scripts/trim-lounge-sfx.mjs`입니다. 자세한 표는 `docs/흡연장/소리목록-2026-11-13.md`입니다.

- lighter-open: "Zippo click sound", dawith — OpenGameArt (CC0). https://opengameart.org/content/zippo-click-sound
- lighter-strike: BigSoundBank "Match" s0004 (CC0). https://bigsoundbank.com/match-s0004.html
- cig-burn: BigSoundBank "Cigarette 2" s2133 (CC0). https://bigsoundbank.com/cigarette-2-s2133.html
- inhale·exhale-short·exhale-mid: BigSoundBank "Sigh by the mouth" s1405 (CC0). https://bigsoundbank.com/sigh-by-the-mouth-s1405.html
- exhale-long: BigSoundBank "Sigh by the nose" s1404 (CC0). https://bigsoundbank.com/sigh-by-the-nose-s1404.html
- vending-button: BigSoundBank "Mobile key" s0176 + "Beep of a cash register" s1417 (CC0).
- can-drop: BigSoundBank "Tin can 4" s0249 (CC0). https://bigsoundbank.com/tin-can-4-s0249.html
- can-open: BigSoundBank "Can of soda opening" s0116 (CC0). https://bigsoundbank.com/can-of-soda-opening-s0116.html
- 가공: 필요한 구간만 자르고 모노·44.1kHz로 바꿈, 앞쪽 무음 제거, 끝 페이드, 피크 -3dB. lighter-strike는 작은 불꽃 소리를 가볍게 눌러 키우고 '치-화' 사이 빈 틈을 줄임, can-drop은 낮춘 사본을 깔아 '쿵'을 더함, cig-burn은 낮은 쪽을 깎고 이음매를 크로스페이드함.
- 담배를 멋있게 들리게 꾸미는 처리(울림·저음 키우기 등)는 하지 않았습니다.

## 남산 순환버스 소리(namsan/) — 2026-11-21 (월드디자인) · **지금은 합성 임시음 사용 중, 녹음 파일은 준비 중**

**지금 실제로 나는 소리:** 버스 엔진·버스 안·브레이크 치익·문 열림·문 닫힘 5가지 모두 `src/namsan/namsan-bus-sound.js`가 게임 안에서 직접 만드는 합성 임시음입니다(아래 녹음 후보가 아님). 외부 자료가 아니라 출처 표기 대상이 없습니다. 게임 콘솔 `namsan.audio().bus.source`가 `'synth'`면 합성음, `'files'`면 아래 녹음 파일, `'mixed'`면 일부만 녹음 파일입니다. 파일이 들어오면 `BUS_SOUND.files`에 이름을 채우면 받은 파일을 먼저 씁니다(못 받은 소리만 합성음).

아래는 녹음 파일 후보입니다. 후보만 정했고 원본을 아직 받지 않았습니다(`public/sounds/namsan/`에 파일 없음). 받으면 `scripts/trim-namsan-bus-sfx.mjs`로 자르고 이 절의 "준비 중"을 지웁니다. 설계 `docs/남산/남산-환경음-구간별-설계-v1.md` §6.

- bus-engine-loop(예정): BigSoundBank "Truck engine" s1145, Joseph SARDIN (CC0). https://bigsoundbank.com/truck-engine-s1145.html
- bus-brake-hiss·bus-door-open·bus-door-close(예정): BigSoundBank "Bus stop in Japan" s0909, Olivier du Japon (CC0). https://bigsoundbank.com/bus-stop-in-japan-s0909.html
- bus-inside-loop(예정): BigSoundBank "London bus" s0644, Joseph SARDIN (CC0). https://bigsoundbank.com/london-bus-s0644.html
- 이용 조건: 세 소리 쪽 모두 "CC0 (public domain): Free and royalty-free"(2026-11-21 확인).
- 가공(예정): 필요한 구간만 자르고 모노·44.1kHz, 반복 소리는 이음매 크로스페이드·RMS 맞춤, 한 번 소리는 앞뒤 페이드·피크 -3dB. 엔진은 60Hz 아래 깎음, 안 소리는 말소리 띠(2kHz)를 6dB 눌러 사람 말이 덜 또렷하게.
- 남산 환경음은 새 파일 없이 위 `ambient/`(관악산 파일, CC0)를 다시 씁니다.

## christmas/carol/ — 온라인 크리스마스 캐럴(2026-11-16, 월드개발)

- 미 공군 군악대 녹음 8곡, 위키미디어 공용에서 받은 원본 그대로(가공 없음). Public domain(PD-USGov-Military). 곡마다 원래 페이지·편곡·연주는 `src/christmas/carols.js`와 `data/자료-출처-이용조건-기록표.md` §16, 게임 안 🎵 창 「소리 출처」.

## 정상 '잔잔한 소리'(summit-calm) — 2026-11-22 (월드디자인 후보, 대표가 ① 먼 웅성임 선택 · 월드개발 연결)

**게임에서 씀: ① 먼 웅성임만** → `ambient/summit-murmur-loop.flac`(= 미리듣기 `calm-murmur-loop.flac` 같은 바이트), 관악산·남산 정상 환경음 층 `crowd`. 꺼 둔 환호 소리 `ambient/summit-crowd-loop.flac`(StarNinjas, CC0)은 파일만 남기고 연결을 끊었습니다. ②·③은 후보로만 남아 있고 `public/sounds/`에 넣지 않았습니다. 원본 `design/sounds/summit-calm/raw/`, 다듬은 파일 `design/sounds/summit-calm/preview/`(`scripts/make-summit-calm-preview.py`), 들어보기 `docs/소리/정상-잔잔한소리-후보-v1.html`.

- calm-murmur-loop(① 먼 웅성임, **사용 중**): BigSoundBank "Outside Talks #2" s2969, Joseph SARDIN (CC0). https://bigsoundbank.com/outside-talks-2-s2969.html
- calm-flag-loop(② 깃발 펄럭임): BigSoundBank "Flag in the wind #1" s1632, Joseph SARDIN (CC0). https://bigsoundbank.com/flag-in-the-wind-1-s1632.html
- calm-chime-loop(③ 풍경·바람종): BigSoundBank "Cluster Chimes" s2687, Pierre SIBANARCO (CC0). https://bigsoundbank.com/cluster-chimes-1-s2687.html
- 이용 조건: 세 쪽 모두 "CC0 (public domain): Free and royalty-free"(2026-11-22 받음·확인).
- 가공: 28초 구간만 자름(웅성임 26~54초·깃발 40~68초·종 140~168초), 모노·32kHz(지금 ambient 파일과 같음), 이음매 2초 크로스페이드, RMS -34dB(종 -36dB)·피크 -3dB 이하. 웅성임은 180Hz 아래·700Hz 위를 깎아 말을 알아들을 수 없게 하고 눌러 튀는 소리를 줄임, 깃발은 150Hz 아래·6.5kHz 위 깎음, 종은 450Hz 아래 깎고 큰 '쨍'을 누름.
