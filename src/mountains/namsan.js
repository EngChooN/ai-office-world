// 남산 산 정의(한 게임 통합 5단계, 월드개발 11-20). 관악산 src/mountains/gwanak.js와 같은 모양으로 남산 값을 모은다.
// three를 쓰지 않는다(산 카드·node --test에서도 읽음). 지금 남산 화면은 별도 페이지(src/namsan/game.js)가 이 값을 읽고,
// 6단계에 남산 페이지를 공통 본체로 옮길 때 본체가 GWANAK 대신 이것을 읽는다.
// 카드 값(1.1km·30분·스탬프 4·쉬움·밤 전망 추천)은 11-19 산 고르기 카드 그대로(mountains.js가 이것으로 카드를 만든다).
import {NAMSAN_SAVE_KEY,NAMSAN_ENTRY_KEY} from '../namsan/namsan-walk.js';
import {NAMSAN} from '../namsan/namsan-data.js';
import {NS_PROGRESS_KEY} from '../namsan/namsan-interact.js';

// 기능 스위치: 이 산에 있는 기능만 켠다. 관악산 GWANAK.features와 같은 이름(한쪽에만 있는 기능은 false).
//  관악산 전용(남산에 없는 것): 즐길거리(산스장·초콜릿·동물·헥헥/쥐)·라디오·휴대폰 카메라·스트레칭·구간별 노면 발소리
//  남산 전용: 사랑의 자물쇠·순환버스·정상 야경 벤치
export const NAMSAN_FEATURES=Object.freeze({
 stamps:true,boards:true,summitStone:true,binoculars:true,phone:false,
 spring:true,dip:true,cairn:true,stretch:false,
 sit:'bench',tea:true,           // 앉기는 정상 벤치에서(땅에 앉기 없음), 앉으면 차 마시기
 trailFun:false,animals:false,radio:false,stamina:false,
 loveLocks:true,bus:true,nightBench:true,
 multi:true,chat:true,pair:true,
});

export const NAMSAN_MOUNTAIN=Object.freeze({
 id:'namsan',name:'남산',altitudeM:265,summitName:'남산 정상',course:'백범광장 → 남산 정상 · 성곽 계단길',
 distanceKm:1.1,etaMin:30,difficulty:'쉬움',tag:'밤 전망 추천',page:'namsan/',
 art:Object.freeze({ridge:[.06,.14,.27,.42,.56,.5,.42,.35,.29,.23],peak:.44,summit:'tower',course:'zigzag-left'}),
 saveKey:NAMSAN_SAVE_KEY,        // 이어 오르기 'namsan-hike:v1'
 progressKey:NS_PROGRESS_KEY,    // 수첩·자물쇠 'namsan-interaction:v1'
 entryKey:NAMSAN_ENTRY_KEY,
 summitId:'namsan',              // 완등 기록(gwanak-summits) 안의 산 id
 stampCount:NAMSAN.stamps.length,
 features:NAMSAN_FEATURES,
 text:Object.freeze({
  pageTitle:'산길 · 남산 온라인 등반',brandEn:'NAMSAN TRAIL',loadingTitle:'산길 · 남산 성곽 계단길',goalLabel:'정상까지 ',
  sealName:'남산',sealSummit:'남산 정상',sealAltitude:'265 m',
 }),
});
