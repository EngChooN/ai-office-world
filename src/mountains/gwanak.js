// 관악산 산 정의(한 게임 통합 2단계, 11-19). 관악산에만 있는 이름·저장 키·코스·위치 모델·스탬프를 한곳에 모은다.
// 규칙: 자리만 옮기기 — 아래 모듈들은 고치지 않고 다시 내보내기만 한다(값·동작 같음). 공통 본체(main.js·수첩·구간 이동·자유 설정·산 카드)는
//  관악산 모듈을 직접 부르지 않고 이 파일을 거친다. 남산 정의(5단계)도 같은 모양(GWANAK의 키)을 채운다. 설계: docs/남산/관악산-남산-한게임-통합-조사-2026-11-19.md §2-3
// three를 쓰지 않는다(산 카드·node --test에서도 읽음). 그림·밤 조명·동물 길처럼 세계를 만들 때만 쓰는 자료는 ./gwanak-world.js.
import {route,checkpoints} from '../route.js';
import {SAVE_KEY,COURSE_LENGTH} from '../movement.js';
import {PROGRESS_KEY} from '../interaction-logic.js';
import {FREE_START_KEY} from '../free-settings.js';
import {STAMPS} from '../interaction-data.js';
import {TIPS} from '../loading-screen.js';

// 코스(GPX 337점·노면·체크포인트·걷기 시간)
export {route,sample,MATERIALS,isStairs,checkpoints,DEMO_START,durationBetween,geographicToLocal,floorHeight} from '../route.js';
// 위치 모델(코스 s·옆 거리·구역 plaza/route/summit)과 이어 오르기 저장
export {initialState,restore,SAVE_KEY,advance,setPose,positionAt,isOffTrail,playerPosition,setPlayerPosition,courseDistance,COURSE_LENGTH,strideAt,strideScaleFor,onStairs,lateralLimit,ROUTE_MIN_S} from '../movement.js';
// 정상 구역·입구 광장
export {summitWalkMap,ROUTE_END,projectToRoute,SUMMIT_CENTER} from '../summit.js';
export {insidePlaza,fromGate,PLAZA_START,GATE_S} from '../plaza.js';
// 스탬프 6곳
export {STAMPS} from '../interaction-data.js';

// 산 정보·저장 키. 산 카드(mountains.js)와 완등 기록이 읽는다. 키 이름은 하나도 바꾸지 않는다(조사 §2-5 (2)).
export const GWANAK=Object.freeze({
 id:'gwanak',name:'관악산',altitudeM:632,summitName:'연주대',course:'관악산공원 입구 → 연주대 정상',
 // 관악산 예상 시간: 걷기 공식 값 97분(11-19 대표 결정, 이전 150분)
 distanceKm:Math.round(COURSE_LENGTH/100)/10,etaMin:97,difficulty:'보통',
 art:Object.freeze({ridge:[.18,.3,.42,.38,.55,.72,.86,.7,.5,.36],peak:.6}),
 saveKey:SAVE_KEY,          // 이어 오르기 'gwanak-hiking:v1'
 progressKey:PROGRESS_KEY,  // 스탬프·수첩 'gwanak-interaction:v1'
 summitId:'gwanak',         // 완등 기록(gwanak-summits) 안의 산 id
 freeStartKey:FREE_START_KEY,
 courseLength:COURSE_LENGTH,
 checkpoints,
 stampCount:STAMPS.length,
 routePointCount:route.length,
 // 기능 스위치(통합 5단계, 11-20): 남산 정의 NAMSAN_FEATURES와 같은 이름. 6단계부터 화면 조각의 data-feature 자리를 이것으로 숨긴다(관악산은 모두 켜져 그대로).
 features:Object.freeze({stamps:true,boards:true,summitStone:true,binoculars:true,phone:true,spring:true,dip:true,cairn:true,stretch:true,
  sit:'ground',tea:true,trailFun:true,animals:true,radio:true,stamina:true,
  book:true,summitCard:true,ambient:true,loveLocks:false,bus:false,nightBench:false,multi:true,chat:true,pair:true}),
 // 화면 글(통합 3단계, 11-20). 공통 화면 틀 src/frame/hiking-body.html의 data-mt 자리를 src/mountain-text.js가 이 값으로 채운다.
 // 관악산 값은 틀에 적힌 글과 한 글자도 다르지 않다(자리만 옮기기). 남산 정의(5단계)는 같은 키를 남산 글로 채운다.
 text:Object.freeze({
  pageTitle:'산길 · 관악산 온라인 등반',
  canvasLabel:'관악산 정상 접근 3D 시범 공간',
  brandEn:'GWANAK TRAIL',
  loadingTitle:'산길 · 관악산 서울대 계곡 코스',
  loadingTips:TIPS,
  goalLabel:'연주대까지 ',
  plazaHint:'일주문으로 걸어가면 시작돼요',
  mapSubtitle:'관악산공원 입구 → 연주대 · GPX 참고 경로',
  startEntrance:'입구 일주문에서 시작',
  startEntranceTitle:'관악산공원 일주문 앞 광장에서 처음부터 걷습니다',
  startDemo:'545m 구간에서 시작',
  startDemoTitle:'평활 고도 545m 이상 첫 구간에서 시작합니다',
  courseNote:'체크포인트 5곳은 임시 위치입니다. 정상 632m 기준 DSM 정렬 · 길 폭·계단 분류는 임시입니다.',
  sealName:'관악산',sealSummit:'연주대',sealAltitude:'632 m',
  // 완등 카드 한 줄 요약 끝말(main.js가 거리·시간·걸음 뒤에 붙인다)
  summitNote:'DSM 지형 체험 기록입니다.',
  footstepNote:'발소리는 가공한 임시음입니다. 실제 관악산 계단 녹음·귀 검수는 대기 중입니다.',
  motionNote:'계단·바위 오르기와 둘러보기는 Quaternius 동작을 해당 상황에 맞춰 재생합니다. 실제 관악산 등산객 동작 검수는 대기 중입니다.',
  restNote:'앉으면 스테미너가 빨리 차올라요',   // 쉬기 탭 안내(6단계에 남산 글을 넣으려고 자리 표시, 글은 틀과 같음)
  terrainCredit:'지형: Copernicus DEM 30m 표면 높이 보간 · 서울 건물 연결 — produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. 재질·하늘: Poly Haven (CC0). 건물·물: © OpenStreetMap contributors (ODbL). 건물 높이 미상은 9m 가정, 랜드마크 형상은 근사입니다.',
  // 환경음 출처(설정 「소리 출처」 칸, main.js가 붙임)
  ambientCredits:'환경음은 실제 관악산 녹음이 아닌 CC0 임시음입니다. 구간·거리·고도·음량은 추정이며 현장·귀 검수 전입니다. 물·숲 바람·능선 바람·새: Thimras (Park Ambiences), 까마귀: fvcalderan (Crow)·zeroisnotnull (Crow Caw), 정상 웅성임: StarNinjas (Crowd Shouting/Speaking Ambience), 먼 도시: IgnasD (High Traffic Road Sounds). 목탁: 산디자인 자체 합성 임시음. 모노 32kHz 변환·크로스페이드·음량 정규화.',
  ambientSourcePath:'environment/출처-이용조건.md',
  ambientSourceLabel:'환경음 원본·제작자·작품 URL·CC0 이용 조건 전체 표',
 }),
});
// 걷기 부품(통합 4단계, 11-20). 공통 본체는 위치 모델을 이것으로만 읽는다. 약속 src/walker.js
export {gwanakWalker as walker} from './gwanak-walker.js';
