// 남산 화면 글·기능 스위치(한 게임 통합 6단계, 11-20). import가 없는 가벼운 파일이다:
//  남산 페이지는 공통 화면 조각(src/frame/hiking-body.html, 관악산 글이 적혀 있음)을 쓰므로, 로딩 화면이 뜨기 전에 src/mountains/page-text.js가 이 글로 바꾼다.
//  산 정의 src/mountains/namsan.js가 이것을 다시 내보낸다(NAMSAN_MOUNTAIN.text·features).
// 기능 스위치: 이 산에 있는 기능만 켠다. 관악산 GWANAK.features와 같은 이름(한쪽에만 있는 기능은 false).
//  관악산 전용(남산에 없는 것): 즐길거리(산스장·초콜릿·동물·헥헥/쥐)·라디오·휴대폰 카메라·스트레칭·스테미너·스탬프 수첩 탭·완등 기록 카드·구간별 환경음
//  남산 전용: 사랑의 자물쇠·순환버스·정상 야경 벤치
export const NAMSAN_FEATURES=Object.freeze({
 stamps:true,boards:true,summitStone:true,binoculars:true,phone:false,
 spring:true,dip:true,cairn:true,stretch:false,
 sit:'bench',tea:true,           // 앉기는 정상 벤치에서(땅에 앉기 없음), 앉으면 차 마시기
 trailFun:false,animals:false,radio:false,stamina:false,
 book:false,summitCard:false,ambient:false,   // 6단계: 스탬프 4곳은 지도 탭에, 정상 도착은 공통 정상 창(도장)만
 loveLocks:true,bus:true,nightBench:true,
 multi:true,chat:true,pair:true,
});
// 화면 글: 공통 화면 조각의 data-mt 자리(src/mountain-text.js). 없는 키는 조각의 글(관악산) 그대로라, 남산에 맞지 않는 글은 모두 채운다.
export const NAMSAN_TEXT=Object.freeze({
 pageTitle:'산길 · 남산 온라인 등반',brandEn:'NAMSAN TRAIL',loadingTitle:'산길 · 남산 성곽 계단길',goalLabel:'정상까지 ',
 canvasLabel:'남산 성곽 계단길 3D 공간',
 loadingTips:Object.freeze(["백범광장에서 성곽을 따라 남산 정상(265m)까지 약 1.1km, 걸어서 30분쯤 걸립니다.", "성곽 큰 계단부터는 돌계단이 이어집니다. 계단에서는 천천히 걸어요.", "정상 전망탑은 오르는 내내 보입니다. 뒤를 돌아보면 서울역 쪽 도심이 보여요.", "서쪽 전망 쉼터에서 잠깐 쉬어 가세요. 해 질 녘 풍경이 좋습니다.", "밤에는 길을 따라 가로등이 켜집니다. 서울 야경을 보러 밤에 올라도 좋아요.", "정상 광장에서 남쪽 멀리 관악산이 보입니다.", "조작: W/S 걷기 · A/D 비켜 가기 · 드래그로 둘러보기 · Shift 달리기 · V 시점 바꾸기"]),
 mapSubtitle:'백범광장 → 남산 정상 · 성곽 계단길 1.1km',
 startEntrance:'백범광장에서 시작',startEntranceTitle:'백범광장 출발점에서 처음부터 걷습니다',
 startDemo:'정상 앞에서 시작',startDemoTitle:'정상 광장 20m 앞에서 시작합니다(완등 기록에는 넣지 않아요)',
 courseNote:'스탬프 4곳 · 정상 광장에 들어서면 완등이에요. 전망탑·광장·소품·이정표 문구는 게임 속 디자인이에요.',
 restNote:'정상 야경 벤치에 앉아 쉬고 차를 마셔요',
 sealName:'남산',sealSummit:'남산 정상',sealAltitude:'265 m',
 footstepNote:'발소리는 가공한 임시음입니다(관악산과 같은 소리).',
 motionNote:'계단 오르기와 둘러보기는 Quaternius 동작을 상황에 맞춰 재생합니다.',
 terrainCredit:'지형: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. 길·성곽·건물: © OpenStreetMap contributors (ODbL). 전망탑·광장·소품·이정표 문구는 게임 속 디자인이에요.',
 // 화면 아래 출처 줄: 공통 조각의 날씨 출처 뒤에 붙인다(page-text.js)
 sourceExtra:' · 지형: Copernicus WorldDEM-30(전체 출처: 도움말) · 길·성곽·건물: © OpenStreetMap',
});
