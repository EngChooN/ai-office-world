// 봉 기계 봉 배치(월드아트, 2026-11-23 대표 지적 + 실제 일본식 봉 기계 사진 2장): 그림·판정이 같이 쓰는 순수 자료(three 없음, node 시험 그대로).
// 사진에서 확인한 것: 봉 4개, 모두 좌우(x)로 기계 폭을 가로지름(양옆 벽 레일에 죔쇠로 고정), 앞뒤(z)로 나란히, 같은 높이.
//  · 가운데 두 봉 = 받침 봉(상자가 앞뒤로 걸쳐 놓임). 두 받침 봉 사이로 빠져 떨어지는 곳 = 인형 나오는 구멍
//  · 바깥 두 봉 = 막이 봉(상자가 실수로 앞·뒤 밖으로 나가는 것을 막음). 받침 봉과의 간격이 가운데 간격보다 좁음(사진 어림 약 절반)
//  · 봉 아래는 양옆 벽 사이가 통째로 뚫린 구덩이(사진의 흰 벽·아래 바닥). 앞 막이 봉 앞·뒤 막이 봉 뒤는 받침판(뒤는 진열 선반)
// 단위: 1 = 10cm, 원점 = 유리 상자 바닥 가운데, 앞(손님 쪽) = +z, 위 = +y(claw-bridge-physics.js와 같음). 기계 좌표(m) = ×0.1 (+ CLAW.floorY).
export const U=.1;
export const BAR_Y=2.4;      // 봉 가운데 높이(바닥에서 24cm) — claw-bridge-physics.js BAR_Y와 같음
export const DECK_DROP=1.2;  // 받침판 윗면 = 봉 윗면에서 12cm 아래 — claw-bridge-physics.js DECK_DROP과 같음
export const GUARD_CLEAR=.008; // 막이 봉 안쪽 가장자리 = 상자(가운데 놓임) 끝 + 0.8cm. 사진: 상자 끝이 막이 봉 바로 안쪽, 받침↔막이 간격은 가운데 간격보다 좁음(약 절반)
export const RAIL_IN=.07;    // 옆 레일 안쪽 면 = 기계 반폭 − 0.07m(= 판정 BOX.x0·x1, 집게 기계 둘레 판과 같은 자리)
export const PIT_PAD=.02;    // 구덩이 앞·뒤 끝 = 막이 봉 바깥 가장자리 + 2cm

/**
 * 기계 치수(CLAW, m)·봉 배치(bars {gap} | {near,far}, m)·조절값(T.bridge) → 봉 4개·구덩이·받침판(단위)
 * 막이 봉은 늘 나란히, 가운데 z = ±(상자 길이/2 + GUARD_CLEAR + 봉 반지름)(상자 22cm면 ±13cm) — 받침 간격과 상관없이 상자 끝 바로 바깥.
 * 八자(near·far): 받침 봉 둘의 가운데 간격이 왼쪽 끝(−x) near → 오른쪽 끝(+x) far로 벌어짐. ※ 사진 2장은 나란한 봉이라 八자 방향은 추천안
 */
export function bridgeLayout(C,bars,B){
 const k=1/U,barR=B.barR*k,x1=(C.width/2-RAIL_IN)*k,x0=-x1;
 const near=(bars.near??bars.gap??B.gap)*k,far=(bars.far??bars.gap??B.gap)*k,guardZ=(B.box[2]/2+GUARD_CLEAR+B.barR)*k;
 const t=x=>Math.max(0,Math.min(1,(x-x0)/(x1-x0)));
 const half=x=>(near+(far-near)*t(x))/2; // 받침 봉 가운데 간격의 반(그 x에서)
 // 봉 i: 0 = 뒤 막이, 1 = 뒤 받침, 2 = 앞 받침, 3 = 앞 막이. barZ(i,x) = 그 x에서 봉 가운데 z
 const ROLE=['guard','support','support','guard'],SIGN=[-1,-1,1,1];
 const barZ=(i,x)=>SIGN[i]*(ROLE[i]==='guard'?guardZ:half(x));
 const list=ROLE.map((role,i)=>({i,role,a:[x0,BAR_Y,barZ(i,x0)],b:[x1,BAR_Y,barZ(i,x1)]}));
 const deckY=BAR_Y+barR-DECK_DROP;
 const pit={x0,x1,z0:-(guardZ+barR)-PIT_PAD*k,z1:guardZ+barR+PIT_PAD*k};
 // 구멍(두 받침 봉 사이 틈): 받침 봉 안쪽 가장자리 사이 + 레일 사이
 const inGap=(x,z)=>x>x0&&x<x1&&z>barZ(1,x)+barR&&z<barZ(2,x)-barR;
 // 구덩이(봉 아래 뚫린 곳 전체, 받침판 없음)
 const inPit=(x,z)=>x>pit.x0&&x<pit.x1&&z>pit.z0&&z<pit.z1;
 return {barR,barY:BAR_Y,deckY,x0,x1,near,far,guardZ,bars:list,barZ,inGap,inPit,pit,floorY:C.floorY};
}
