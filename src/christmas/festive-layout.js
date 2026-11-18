// 크리스마스 광장 「밝고 화려하게」 시안 B의 놀이 시설 자리·값(월드아트, 2026-11-17, 대표 검토용 — 확정 아님).
// three를 쓰지 않는 순수 자료·계산이라 그림(festive.js)·화면 연결(월드개발)·서버·시험이 같이 쓴다.
// 좌표 규칙은 layout.js와 같다: 1m = 1, x 동쪽, −Z 북쪽, heading 0 = −Z를 봄(바라보는 방향 = (−sin h, −cos h)).
// 각도 a는 atan2(x, z) 규칙(0 = +Z 남쪽, +90° = +X 동쪽). 숫자는 월드아트가 화면으로 맞춘 값이고, 놀이 판정 값(반경·시간)은 월드개발이 정한다.

// ═════ 넓힌 광장(시안 B 전용, 11-17 4차): 대표 피드백 「B안 광장이 너무 작아 보인다」 — 한 서버 30명을 염두에 둔 설계 기준(서버 정원 확정 아님).
// layout.js가 B 화면(11-17부터 기본, festiveB)이면 아래 값으로 바꿔 쓴다. 시안 A·예전 화면(?look=festive·classic)만 원래 값 그대로다. 서버도 B(주소 없음).
// 원칙: 트리(가운데)·눈사람 마당·눈싸움 마당·썰매 산·케이블카는 그대로(마당 경계는 서버 판정이 같이 쓰므로 옮기지 않는다).
//       광장 둘레에 놓인 것(모닥불·우체통·카드 판·전시 자리·노점·가로등·안쪽 집 4채)은 트리에서 scale배 바깥으로, 광장 돌바닥은 radius까지.
//       입구 아치·입구 길은 넓히고 남쪽으로, 회전목마·아이스링크는 광장에서 떨어진 거리를 지금과 비슷하게 두고 함께 바깥으로.
// 광장 돌바닥이 두 마당 안쪽 가장자리에 1m쯤 걸치는데, 그곳은 바닥을 눈으로 칠하고 경계석을 빼서(village.js) 마당이 광장에 붙은 눈밭으로 보인다.
// 11-17 대표 결정: 시안 B(넓힌 광장·링크·회전목마 16자리·달리기·지도·점프대)가 기본 화면. 주소가 없으면(화면·서버·시험) B.
//  예전 화면은 옵션으로만: ?look=festive|festive-a|a = 시안 A(넓히지 않은 광장 + 장식), ?look=classic|old = 11-16 처음 화면. ?look=festive-b|b는 옛 공유 주소용(B와 같음)
export const LOOK_LEVELS=Object.freeze({classic:0,old:0,festive:1,'festive-a':1,a:1,'festive-b':2,b:2});
export function lookLevel(search=globalThis.location?.search??''){return LOOK_LEVELS[new URLSearchParams(search).get('look')]??2;}
export function festiveB(search=globalThis.location?.search??''){return lookLevel(search)===2;}
const K=1.3;
export const PLAZA_B=Object.freeze({scale:K,radius:22,
 spawn:Object.freeze({z:19.5,spread:4}),entrance:Object.freeze({z:23.2,w:6}),
 campfire:Object.freeze({x:-16.5,z:1.3}),
 mailbox:Object.freeze({x:+(12*K).toFixed(2),z:+(-.6*K).toFixed(2),stand:Object.freeze({x:+(12*K-1.2).toFixed(2),z:+(-.6*K).toFixed(2)})}),
 cardBoard:Object.freeze({x:+(13.4*K).toFixed(2),z:+(-2.8*K).toFixed(2)}),
 displayR:+(8.6*K).toFixed(2),
 // 모닥불·눈싸움 마당 사이 가림 눈벽: 마당 가장자리(−21.5) 바로 안쪽
 divider:Object.freeze({x:-20.95,z0:-5.6,z1:6.9}),
 // 집: 안쪽 4채는 scale배(서남쪽 1채는 아이스링크를 비켜 조금 안쪽), 입구 길가 2채·서남쪽 끝 1채·북쪽 양옆 2채는 링크·빛 터널·안쪽 집과 붙지 않게 옮김, 나머지는 그대로
 // 11-17 5차: 큰 아이스링크가 입구 길 서쪽으로 오면서 그 자리의 집 1채는 옛 링크 자리(서남쪽 (−31, 24))로, 빛 선물상자는 (−24.5, 22)로
 houses:Object.freeze([
  [-25.35,-14.3,0,1],[-25,15.6,1,1],[25.35,-14.3,2,1],[25.35,16.9,3,1],
  [-29,-22,1,.9],[11.5,31,0,.9],[-31,24,2,.95],
  [-36,-12,3,1.05],[36,-12,1,1.05],[-37,13,2,1],[35,20,0,1],
 ].map(h=>Object.freeze(h))),
 // 가로등: 광장 둘레 8개(반지름 22.7). 북동·북서 쪽 2개는 마당 모서리 깃발을 비켜 각도를 조금 틀었다. 마당 입구 가로등 4개는 둘레 가로등이 겸한다.
 lamps:Object.freeze([22.5,64,112.5,157.5,202.5,247.5,296,337.5].map(d=>{const a=d*Math.PI/180;return Object.freeze([+(Math.sin(a)*22.7).toFixed(2),+(Math.cos(a)*22.7).toFixed(2)]);})),
 // 다져진 눈길(땅 색): 입구 길 · 두 마당 입구 · 북쪽 산 쪽 · 회전목마 · 아이스링크
 paths:Object.freeze([[[0,42],[0,21]],[[-20.5,-7.6],[-24,-3.5]],[[-20.5,9.8],[-24,7]],[[21,1],[23,1.5]],[[7.8,-20.6],[10.6,-24]],[[-7.8,-20.6],[-12.5,-25.5]],[[11.5,18.3],[12.6,22]],[[-3.4,30.5],[-6.6,30.5]]]),
 // 노점 고리 반지름(노점 가운데), 길가 작은 트리 자리
 stallR:+(14.6*K).toFixed(2),
 pathTrees:Object.freeze([[-20.8,-17.6],[20.8,-17.6],[-18.4,19.6],[21.4,19.4]]),
 yardTrees:Object.freeze([[-22.4,-7.4],[22.4,-6.6],[-10.4,-21.9],[10.4,-21.9]]),
 giftBox:Object.freeze({x:-24.5,z:22}),
});

// ═════ 아이스링크(입구 길 서쪽 빈 눈밭, 문은 입구 길 쪽 동쪽)
// 모서리가 둥근 직사각형. 땅이 굴곡져서 얼음은 평평한 판으로 그 위에 올린다(iceY = 얼음 윗면의 세계 높이 = 링크 안 가장 높은 땅 + 약 8cm).
// 11-17 5차(대표 정정 「링크·회전목마가 작다」, 30명 기준): 10×6.4m(얼음 약 59㎡)에서 16×10m(약 150㎡, 2.5배)로.
//   30명이 다 올라가도 한 사람 약 5㎡, 절반(15명)이면 약 10㎡. 동동이(키 1m·몸 반지름 약 0.3m) 둘이 나란히 돌아도 섬 둘레 길 폭이 3.7m 넘게 남는다.
//   광장 둘레(반지름 22m)와 마을 울타리(43m) 사이에 이 크기가 들어가는 곳이 입구 길 양옆뿐이라 서남쪽 (−28, 23.5)에서 (−15.5, 30.5)로 옮겼다.
// board = 얼음 위 울타리 높이(동동이 허리쯤).
// gate = 울타리 문(동쪽, 입구 길·빛 터널 쪽을 봄). 사람이 많아져 폭 1.4 → 1.8m.
export const RINK=Object.freeze({x:-15.5,z:30.5,w:16,d:10,corner:2.5,iceY:.47,board:.42,
 // 문: 울타리 동쪽 가운데. stand = 문 밖에 서는 자리(타기 단추 기준점), inside = 문 안 얼음 위 첫 자리
 gate:Object.freeze({x:-7.5,z:30.5,w:1.8,heading:Math.PI/2,stand:Object.freeze({x:-6.6,z:30.5}),inside:Object.freeze({x:-8.3,z:30.5})}),
 // 가운데 섬(장식 트리, 반지름). 타는 사람은 이 둘레를 돈다
 island:Object.freeze({x:-15.5,z:30.5,r:1.2}),
 // 펭귄 보조 기구 자리(얼음 위, 그림만 — 충돌 없음) [x, z, 바라보는 각도]
 penguins:Object.freeze([[-20.5,32.6,.9],[-10.6,28.2,Math.PI+.6],[-17.8,27,2.4],[-12.4,33.6,-.7]].map(p=>Object.freeze(p))),
});
// 링크 안(얼음 위)인지: 둥근 직사각형 안, margin만큼 안쪽(몸 반지름 등)
export function inRink(x,z,margin=0){const hw=RINK.w/2-margin,hd=RINK.d/2-margin,r=Math.max(0,RINK.corner-margin);
 const dx=Math.abs(x-RINK.x),dz=Math.abs(z-RINK.z);if(dx>hw||dz>hd)return false;
 const cx=dx-(hw-r),cz=dz-(hd-r);return cx<=0||cz<=0||Math.hypot(cx,cz)<=r;}

// ═════ 루돌프 회전목마(광장 남동쪽 밖, 포토존). 탈 수 있는 자리 16개 = 바깥 줄 루돌프 8마리(1명씩) + 안쪽 줄 썰매 의자 4대(2명씩)
// 11-17 5차(대표 정정, 30명 기준): 반지름 2.3 → 3.6m(바닥 넓이 약 2.4배), 지붕 처마 3.15 → 4.1m, 자리 8 → 16(한 서버의 절반이 함께 탈 수 있음).
// 회전: 위에서 보면 시계 반대 방향(three rotation.y 증가), 한 바퀴 period초. 모두 같은 각도로 보이도록 시각(ms)으로 계산한다.
//   바깥 루돌프가 커진 만큼 빨라지지 않게 19.6 → 24초(바깥 루돌프 약 0.75m/s).
// bob: 루돌프만 오르내림(y = deerY + bob·sin(시각·bobSpeed + 번호·π/2)), 썰매 의자는 오르내리지 않음.
// 높이(그림이 읽는 값): roofY = 처마(전구 띠) 높이, coneH = 지붕 원뿔 높이, poleR = 가운데 기둥 반지름.
const CX=17.5,CZ=23.5,CR=3.6,STEP_A=-100,BOARD_D=CR+.45+.6,EXIT_A=-80,EXIT_D=CR+.45+.45; // 가운데(11-17 4차 자리 그대로)
export const CAROUSEL=Object.freeze({x:CX,z:CZ,R:CR,floorY:.36,period:24,deerR:2.85,sleighR:1.75,deerY:.92,bob:.12,bobSpeed:1.6,roofY:4.1,coneH:1.5,poleR:.3,
 // 받침(돌지 않음) 충돌 원 반지름
 baseR:+(CR+.45).toFixed(2),
 // 타는 곳: 서쪽(광장·입구 길 쪽) 계단(폭 1.8m). board = 서서 「타기」 단추가 뜨는 자리(반경 near), exit = 내리면 서는 자리(계단 북쪽 옆 땅)
 step:Object.freeze({a:+(STEP_A*Math.PI/180).toFixed(4),w:1.8}),
 board:Object.freeze({x:+(CX+Math.sin(STEP_A*Math.PI/180)*BOARD_D).toFixed(2),z:+(CZ+Math.cos(STEP_A*Math.PI/180)*BOARD_D).toFixed(2),near:1.8,heading:+Math.atan2(-(-Math.sin(STEP_A*Math.PI/180)),-(-Math.cos(STEP_A*Math.PI/180))).toFixed(3)}),
 exit:Object.freeze({x:+(CX+Math.sin(EXIT_A*Math.PI/180)*EXIT_D).toFixed(2),z:+(CZ+Math.cos(EXIT_A*Math.PI/180)*EXIT_D).toFixed(2),heading:Math.PI/2}),
});
const D2R=Math.PI/180;
// 자리 표: kind = deer(루돌프 안장) | sleigh(썰매 의자). a = 돌기 전 각도, r = 중심에서 거리, u = 진행 방향 앞뒤 어긋남, y = 땅(받침 아래)에서 앉는 면 높이(오르내림 0일 때).
// 번호: 0~7 = 바깥 줄 루돌프(22.5°+45°·k), 8~15 = 안쪽 줄 썰매 의자 4대(0°·90°·180°·270°) × 안쪽·바깥쪽 자리.
// face: 'forward' = 진행 방향을 봄(루돌프·썰매 모두. 동동이 다리가 짧아 루돌프 목을 뚫지 않음 — 미리보기로 확인).
//       'out'(바깥 보고 걸터앉기)도 계산은 되지만 지금 쓰는 자리는 없다(월드개발 carousel-play는 진행 방향만 쓴다).
// 앉는 자세는 poses.js setSit(on, 0.34) 그대로(벤치 앉기). 몸 root 높이 = 반환 y − 0.34.
export const CAROUSEL_SEATS=Object.freeze([
 ...Array.from({length:8},(_,k)=>Object.freeze({id:k,kind:'deer',deer:k,a:(22.5+45*k)*D2R,r:CAROUSEL.deerR,u:-.02,y:+(.92+.217).toFixed(3),face:'forward'})),
 ...[0,90,180,270].flatMap((deg,k)=>[-1,1].map(s=>Object.freeze({id:8+k*2+(s>0?1:0),kind:'sleigh',sleigh:k,a:deg*D2R,r:+(CAROUSEL.sleighR+s*.27).toFixed(2),u:-.08,y:.7,face:'forward'}))),
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

// ═════ 루돌프 썰매 정류장(11-18, 설계 v2 §1: 자리 (25, 28)·썰매는 북서쪽(광장 쪽)을 봄 = 추천안·대표 미확인). 회전목마 동쪽 빈 눈밭.
// ring = 금빛 원 가운데·반지름(이 안에 서면 「하늘 썰매 타기」 단추 — 판정 반경은 월드개발이 정함). 원은 썰매 옆(왼쪽)에 있다.
// sleigh = 기다리는 썰매 원점(썰매 날 바닥 가운데, sky-sleigh.js place 값). 루돌프 둘은 그 앞 2.35m(SLEIGH.tow).
// sign = 「루돌프 썰매 정류장」 표지판(원의 앞 오른쪽, 광장에서 오는 길 쪽), hay = 건초 더미·당근 먹이통. heading 규칙은 위와 같다(0 = −Z).
const RS={x:25,z:28};const RH=+Math.atan2(RS.x,RS.z).toFixed(3); // 정류장 → 트리 쪽(북서)을 보는 heading
const RF=[-Math.sin(RH),-Math.cos(RH)],RR=[Math.cos(RH),-Math.sin(RH)]; // 앞·오른쪽
export const REINDEER_STATION=Object.freeze({x:RS.x,z:RS.z,ring:2,heading:RH,
 // 썰매 방향(11-18 월드개발): 트리 쪽(RH)을 보면 바로 앞이 표지판·회전목마·집이라 날아오를 길(앞 13m)이 없어, 서북서(광장 남쪽 눈밭 쪽)를 봄 — 추천안·대표 미확인
 sleigh:Object.freeze({x:+(RS.x-RR[0]*2.9-RF[0]).toFixed(2),z:+(RS.z-RR[1]*2.9-RF[1]).toFixed(2),heading:1.25}),
 sign:Object.freeze({x:+(RS.x+RF[0]*2.35+RR[0]*1.3).toFixed(2),z:+(RS.z+RF[1]*2.35+RR[1]*1.3).toFixed(2)}),
 hay:Object.freeze({x:RS.x+2.6,z:RS.z+2.2}),
});
