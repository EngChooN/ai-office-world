// 산 목록(산 고르기 화면). 산이 늘면 이 배열에 하나씩 더한다. three를 쓰지 않는다(node --test로 검사).
// 사양: docs/UI-산고르기-자유설정-사양.md §1-4 {id,name,altitudeM,course,distanceKm,etaMin,stamps,difficulty,art}
// ready:false인 산은 흑백 카드에 '준비 중' 버튼만 둔다. art는 카드 그림의 능선 모양(0~1, 왼쪽→오른쪽 높이)과 정상 위치다.
//  art.course:'zigzag-left'면 점선 코스가 오른쪽 아래에서 왼쪽 봉우리로 지그재그로 오르고, art.summit:'tower'면 깃발 대신 전망탑을 그린다(남산, 11-19).
// summitName = 기록 줄·잠김 알림에 쓰는 정상 이름. page = 이 산 게임 화면(등산 페이지 기준 상대 주소, 없으면 지금 페이지 = 관악산 게임).
import {GWANAK} from './mountains/gwanak.js';   // 관악산 카드 = 관악산 산 정의(통합 2단계)
const card=({id,name,altitudeM,course,summitName,distanceKm,etaMin,stampCount,difficulty,art})=>({id,name,altitudeM,course,summitName,distanceKm,etaMin,stamps:stampCount,difficulty,art});
export const MOUNTAINS=Object.freeze([
 // 관악산 숫자(예상 시간 97분 등)는 src/mountains/gwanak.js
 Object.freeze({...card(GWANAK),ready:true}),
 // 남산(11-19, 월드디자인 설계 v1 §8 · 대표 결정: 성곽 계단길·265m). 코스 길이 1,067m(assets/shared/namsan/course.json), 걷기 공식 26.6분 → 카드 30분
 Object.freeze({id:'namsan',name:'남산',altitudeM:265,course:'백범광장 → 남산 정상 · 성곽 계단길',summitName:'남산 정상',
  distanceKm:1.1,etaMin:30,stamps:4,difficulty:'쉬움',ready:true,page:'namsan/',tag:'밤 전망 추천',
  art:Object.freeze({ridge:[.06,.14,.27,.42,.56,.5,.42,.35,.29,.23],peak:.44,summit:'tower',course:'zigzag-left'})})   // 봉우리를 x 44%로(33%면 휴대폰 세로 카드에서 탑 꼭대기가 왼쪽 위 계절 꼬리표에 가렸다, 11-19),
]);
export const mountainById=id=>MOUNTAINS.find(m=>m.id===id)??null;
export const DEFAULT_MOUNTAIN='gwanak';
// 예상 시간 글자: 150 → '2시간 30분'
export function formatEta(min){
 const h=Math.floor(min/60),m=Math.round(min%60);
 return h?`${h}시간${m?` ${m}분`:''}`:`${m}분`;
}
