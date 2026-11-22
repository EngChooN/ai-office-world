// 남산 동물 출현 구역 추천안(대표 미확인). 거리는 course.json의 s(m).
// 관악산과 같은 구역 형식. 동물 반응·시간 칸·최대 마리 수는 연결 담당이 공통 동물 부품으로 처리한다.
export const NAMSAN_ANIMAL_ZONES=Object.freeze([
 {id:'ns-entry',from:0,to:120,w:{cat:3,magpie:3},note:'출발 광장·성곽 입구'},
 {id:'ns-forest',from:120,to:650,w:{squirrel:3,magpie:2,hare:2},note:'숲 계단길'},
 {id:'ns-rest',from:650,to:900,w:{cat:3,magpie:3},note:'전망 쉼터 둘레'},
 // 900m부터 코스 끝까지는 정상에 들어가는 길과 광장이다. G.points 마지막 거리로 상한을 잘라 쓴다.
 {id:'ns-summit',from:900,to:Infinity,w:{magpie:3,cat:3},note:'정상 접근로·광장'},
]);
export function namsanAnimalZones(G){const end=G.points.at(-1).s;return NAMSAN_ANIMAL_ZONES.filter(z=>z.from<end).map(z=>({...z,to:Math.min(z.to,end),maxOffset:{squirrel:5,hare:5,magpie:5,cat:5}}));}
