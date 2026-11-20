// 남산 산 정의(한 게임 통합 5단계, 월드개발 11-20). 관악산 src/mountains/gwanak.js와 같은 모양으로 남산 값을 모은다.
// three를 쓰지 않는다(산 카드·node --test에서도 읽음). 남산 페이지(src/namsan/game.js)가 공통 본체 부품·화면 조각과 함께 이 값을 읽는다(6단계).
// 카드 값(1.1km·30분·스탬프 4·쉬움·밤 전망 추천)은 11-19 산 고르기 카드 그대로(mountains.js가 이것으로 카드를 만든다).
import {NAMSAN_SAVE_KEY,NAMSAN_ENTRY_KEY} from '../namsan/namsan-walk.js';
import {NAMSAN} from '../namsan/namsan-data.js';
import {NS_PROGRESS_KEY} from '../namsan/namsan-interact.js';

// 기능 스위치·화면 글은 가벼운 파일 namsan-page.js(남산 페이지가 로딩 화면 전에 읽음, 통합 6단계)
import {NAMSAN_FEATURES,NAMSAN_TEXT} from './namsan-page.js';
export {NAMSAN_FEATURES,NAMSAN_TEXT};

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
 text:NAMSAN_TEXT,

});
