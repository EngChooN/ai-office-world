// 걷기 부품(walker) 약속(한 게임 통합 4단계, 11-20). 산마다 걷기 규칙은 따로 두고(관악산 movement.js = 코스 s·옆 거리·구역 3개,
//  남산 namsan-walk.js = x,z 자유 + 걷는 곳 판정) 공통 본체가 부르는 이름만 같게 한다. 둘을 같은 걷기 코드로 합치는 것은 나중 일(선택).
// 부품: 관악산 src/mountains/gwanak-walker.js, 남산 src/namsan/namsan-walker.js. 설계: docs/남산/관악산-남산-한게임-통합-조사-2026-11-19.md §2-3
// 상태 공통 필드: s(코스 위 거리 m)·auto·running·elapsed·distance·ascent. 그 밖의 필드는 산마다 다르니 부품 함수로만 읽는다.
// ground = 그 산의 걷는 땅(관악산 walking-ground, 남산은 부품이 자료 G를 품고 있어 무시).
export const WALKER_KEYS=Object.freeze([
 'id','saveKey','startOptions',
 'initialState',   // (opts) → 새 상태
 'restore',        // (raw 저장 글) → 상태(못 읽으면 새 상태)
 'serialize',      // (state) → 저장 글
 'advance',        // (state,input,dt,onStep,ground) → 속도 m/s
 'setPose',        // (state,'stand'|'sit'|'tea')
 'zone',           // (state) → 함께 걷기에 보내는 구역 값
 'freeZone',       // (state) → x,z를 직접 걷는 곳인지
 'offTrail',       // (state) → 길 밖인지
 'point',          // (state,ground) → [x,y,z] 몸 자리
 'heading',        // (state) → 몸·이동 기준 방향(three.js 회전)
 'turnFree',       // (state,yaw) → 자유 걷기에서 카메라 돌림을 몸 방향에 더함
 'floorAt',        // (state,s,ground) → 코스 s 자리 발밑 높이
 'place',          // (s,lateral,ground) → [x,y,z]
 'position',       // (state,ground) → {zone,x,z,heading,s,lateral}
 'setPosition',    // (state,pos,ground) → 옮겼는지
 'setPeerPosition',// (state,pos,ground) → 함께 걷기에서 받은 자리로
 'courseDistance', // (state) → 출발점부터 코스 거리 m
 'courseLength','minS','maxS',
 'stride','strideScale','onStairs','isStairs',
 'nudge',          // (state,{x,z,ds,dl},{ground,blocked}) → 동행 밀어내기
 'here',           // (state) → 동행용 길 정보 | null
 'sample',         // (s) → 코스 점(동행 계산용) | null
]);
// 빠진 키 목록(시험용). 빈 배열이면 약속을 다 채운 것.
export const missingWalkerKeys=w=>WALKER_KEYS.filter(k=>!(k in (w??{})));
