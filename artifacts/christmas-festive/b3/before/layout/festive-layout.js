// 크리스마스 광장 「밝고 화려하게」 시안 B의 놀이 시설 자리·값(월드아트, 2026-11-17, 대표 검토용 — 확정 아님).
// three를 쓰지 않는 순수 자료·계산이라 그림(festive.js)·화면 연결(월드개발)·서버·시험이 같이 쓴다.
// 좌표 규칙은 layout.js와 같다: 1m = 1, x 동쪽, −Z 북쪽, heading 0 = −Z를 봄(바라보는 방향 = (−sin h, −cos h)).
// 각도 a는 atan2(x, z) 규칙(0 = +Z 남쪽, +90° = +X 동쪽). 숫자는 월드아트가 화면으로 맞춘 값이고, 놀이 판정 값(반경·시간)은 월드개발이 정한다.

// ═════ 아이스링크(광장 남서쪽 밖, 빛 선물상자 서쪽 빈 눈밭)
// 모서리가 둥근 직사각형. 땅이 0~0.31m 굴곡이라 얼음은 평평한 판으로 그 위에 올린다(iceY = 얼음 윗면의 세계 높이 = 링크 안 가장 높은 땅 0.31 + 8cm).
// board = 얼음 위 울타리 높이(동동이 허리쯤).
// 지금은 울타리로 닫혀 있다(들어가 타기는 월드개발 연결 뒤). gate = 울타리 문(동쪽, 광장 쪽을 봄).
export const RINK=Object.freeze({x:-26,z:20.5,w:10,d:6.4,corner:2,iceY:.39,board:.42,
 // 문: 울타리 동쪽 가운데. 폭 1.4m. stand = 문 밖에 서는 자리(타기 단추 기준점), inside = 문 안 얼음 위 첫 자리
 gate:Object.freeze({x:-21,z:20.5,w:1.4,heading:Math.PI/2,stand:Object.freeze({x:-20.1,z:20.5}),inside:Object.freeze({x:-21.8,z:20.5})}),
 // 가운데 섬(작은 장식 트리, 반지름). 타는 사람은 이 둘레를 돈다
 island:Object.freeze({x:-26,z:20.5,r:.75}),
});
// 링크 안(얼음 위)인지: 둥근 직사각형 안, margin만큼 안쪽(몸 반지름 등)
export function inRink(x,z,margin=0){const hw=RINK.w/2-margin,hd=RINK.d/2-margin,r=Math.max(0,RINK.corner-margin);
 const dx=Math.abs(x-RINK.x),dz=Math.abs(z-RINK.z);if(dx>hw||dz>hd)return false;
 const cx=dx-(hw-r),cz=dz-(hd-r);return cx<=0||cz<=0||Math.hypot(cx,cz)<=r;}

// ═════ 루돌프 회전목마(광장 남동쪽 밖, 포토존). 탈 수 있는 자리 8개 = 루돌프 4마리(1명씩) + 썰매 의자 2대(2명씩)
// 회전: 위에서 보면 시계 반대 방향(three rotation.y 증가), 한 바퀴 period초. 모두 같은 각도로 보이도록 시각(ms)으로 계산한다.
// bob: 루돌프만 오르내림(y = deerY + bob·sin(시각·bobSpeed + 번호·π/2)), 썰매 의자는 오르내리지 않음.
export const CAROUSEL=Object.freeze({x:14.8,z:19.2,R:2.3,floorY:.36,period:19.6,deerR:1.55,deerY:.92,bob:.12,bobSpeed:1.6,
 // 받침(돌지 않음) 충돌 원 반지름
 baseR:2.75,
 // 타는 곳: 서쪽(광장·입구 길 쪽) 계단. board = 서서 「타기」 단추가 뜨는 자리(반경 near), exit = 내리면 서는 자리(계단 앞 땅)
 step:Object.freeze({a:+(-100*Math.PI/180).toFixed(4)}),
 board:Object.freeze({x:11.55,z:18.63,near:1.6,heading:+Math.atan2(-(14.8-11.55),-(19.2-18.63)).toFixed(3)}),
 exit:Object.freeze({x:11.75,z:19.75,heading:Math.PI/2}),
});
const D2R=Math.PI/180;
// 자리 표: kind = deer(루돌프 안장) | sleigh(썰매 의자). a = 돌기 전 각도, r = 중심에서 거리, u = 진행 방향 앞뒤 어긋남, y = 땅(받침 아래)에서 앉는 면 높이(오르내림 0일 때).
// face: 'forward' = 진행 방향을 봄(루돌프·썰매 모두. 동동이 다리가 짧아 루돌프 목을 뚫지 않음 — 미리보기로 확인).
//       'out'(바깥 보고 걸터앉기)도 계산은 되지만 지금 쓰는 자리는 없다(월드개발 carousel-play는 진행 방향만 쓴다).
// 앉는 자세는 poses.js setSit(on, 0.34) 그대로(벤치 앉기). 몸 root 높이 = 반환 y − 0.34.
export const CAROUSEL_SEATS=Object.freeze([
 ...[45,135,225,315].map((deg,k)=>Object.freeze({id:k,kind:'deer',deer:k,a:deg*D2R,r:1.55,u:-.02,y:+(.92+.217).toFixed(3),face:'forward'})),
 ...[0,180].flatMap((deg,k)=>[-1,1].map(s=>Object.freeze({id:4+k*2+(s>0?1:0),kind:'sleigh',sleigh:k,a:deg*D2R,r:+(1.55+s*.27).toFixed(2),u:-.08,y:.7,face:'forward'}))),
]);
// 시각(ms) → 회전 각도(라디안). 큰 ms에서도 정밀도가 깨지지 않게 한 바퀴로 먼저 나눈다.
export function carouselSpin(ms){const P=CAROUSEL.period*1000;return ((ms%P+P)%P)/P*Math.PI*2;}
export function deerBob(ms,k){return CAROUSEL.bob*Math.sin(((ms/1000)%3600)*CAROUSEL.bobSpeed+k*Math.PI/2);}
// 자리 k의 세계 위치·바라보는 방향. groundY = 회전목마 자리 땅 높이(heightAt(CAROUSEL.x, CAROUSEL.z)).
// 반환 {x,y,z,heading,…}: y = 앉는 면의 세계 높이. 자세는 setSit(true, 0.34)로 앉히고 root.y = y − 0.34로 놓는다(SEAT_SIT_Y).
export const SEAT_SIT_Y=.34;
export function carouselSeatAt(k,ms,groundY=0){const s=CAROUSEL_SEATS[k];if(!s)return null;
 const f=s.a+carouselSpin(ms),rx=Math.sin(f),rz=Math.cos(f),tx=Math.cos(f),tz=-Math.sin(f);
 const lift=s.kind==='deer'?deerBob(ms,s.deer):0;
 // heading: 0 = −Z를 봄. 바깥(rx,rz)을 보려면 atan2(−rx,−rz), 진행 방향(tx,tz)을 보려면 atan2(−tx,−tz)
 const heading=s.face==='out'?Math.atan2(-rx,-rz):Math.atan2(-tx,-tz);
 // ox·oz(바깥 방향)·cx·cz·cy(중심)·r = 월드개발 carousel-play carouselSeatPose와 같은 모양
 return {x:CAROUSEL.x+rx*s.r+tx*s.u,y:groundY+s.y+lift,z:CAROUSEL.z+rz*s.r+tz*s.u,heading,lift,ox:rx,oz:rz,cx:CAROUSEL.x,cz:CAROUSEL.z,cy:groundY,r:s.r,kind:s.kind};}
// 타는 곳에서 가장 가까운(지금 그 순간) 빈 자리. taken = 이미 찬 자리 번호 Set
export function nearestFreeSeat(ms,taken=new Set(),from=CAROUSEL.board){let best=-1,bd=Infinity;
 for(const s of CAROUSEL_SEATS){if(taken.has(s.id))continue;const p=carouselSeatAt(s.id,ms);const d=Math.hypot(p.x-from.x,p.z-from.z);if(d<bd){bd=d;best=s.id;}}return best;}
