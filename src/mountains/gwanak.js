// 관악산 산 정의(한 게임 통합 2단계, 11-19). 관악산에만 있는 이름·저장 키·코스·위치 모델·스탬프를 한곳에 모은다.
// 규칙: 자리만 옮기기 — 아래 모듈들은 고치지 않고 다시 내보내기만 한다(값·동작 같음). 공통 본체(main.js·수첩·구간 이동·자유 설정·산 카드)는
//  관악산 모듈을 직접 부르지 않고 이 파일을 거친다. 남산 정의(5단계)도 같은 모양(GWANAK의 키)을 채운다. 설계: docs/남산/관악산-남산-한게임-통합-조사-2026-11-19.md §2-3
// three를 쓰지 않는다(산 카드·node --test에서도 읽음). 그림·밤 조명·동물 길처럼 세계를 만들 때만 쓰는 자료는 ./gwanak-world.js.
import {route,checkpoints} from '../route.js';
import {SAVE_KEY,COURSE_LENGTH} from '../movement.js';
import {PROGRESS_KEY} from '../interaction-logic.js';
import {FREE_START_KEY} from '../free-settings.js';
import {STAMPS} from '../interaction-data.js';

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
});
