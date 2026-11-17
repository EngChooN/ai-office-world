// 넓힌 광장 이동 돕기(월드개발, 2026-11-17 5차): 달리기 규칙 + 바로가기 지도 목적지. 시안 B(?look=festive-b, layout.js BIG_PLAZA)에서만 켠다.
// three·DOM 없는 순수 자료·계산(시험이 같이 쓴다). 화면은 travel-ui.js, 연결은 main.js.
//  - 목적지 자리는 모두 layout.js·festive-layout.js 값에서 계산한다(좌표를 따로 적지 않음). 놀이 자리 「앞」에 서서 그쪽을 본다.
//  - 마당(눈사람·눈싸움)은 서버 판정이 쓰는 경계(SNOWMAN_YARD·SNOWBALL_YARD) 안쪽 1.5m에 내려서 바로 놀 수 있게 한다.
import {TREE,CAMPFIRE,MAILBOX,SNOWMAN_YARD,SNOWBALL_YARD,SLED_RUN,GONDOLA,SPAWN,PLAZA,BOUNDS,HOUSES,TARGETS} from './layout.js';
import {CAROUSEL,RINK} from './festive-layout.js';

// runMul = 걷기 속도 배수(시안 B, 제안값·대표 미확인. 지금 화면은 흡연장과 같은 RUN_MUL 1.55 그대로)
// gapMs = 지도 이동 간격(서버가 순간이동을 1초에 한 번 받으므로 그보다 길게), fadeMs = 어두워짐·밝아짐 각각
export const TRAVEL=Object.freeze({runMul:1.6,gapMs:1300,fadeMs:220,othersHz:4});
// 바라보는 방향(heading 0 = −Z): from에서 to를 봄
const face=(from,to)=>Math.atan2(-(to.x-from.x),-(to.z-from.z));
const at=(x,z,look)=>({x:+x.toFixed(2),z:+z.toFixed(2),heading:+face({x,z},look).toFixed(3)});

// 목적지 목록. mx·mz = 지도 핀 자리(시설 가운데), x·z·heading = 내려서는 자리(시설 앞, 시설을 봄). ic = 아이콘 이름(월드아트 지도 아이콘이 오면 바꿈, 아직 그림이 없으면 fb 글자), label = 지도 글
export function travelSpots({carousel=true,rink=true}={}){
 const yardIn=(Y,side)=>at(Y.x+side*(Y.w/2-1.5),Y.z,Y);
 const deck=SLED_RUN.deck,gb=GONDOLA.base;
 const list=[
  {id:'tree',label:'트리',ic:'x-tree',mx:TREE.x,mz:TREE.z,...at(TREE.x,TREE.z+TARGETS.tree.r-1.2,TREE)}, // 「장식 달기」가 뜨는 거리(TARGETS.tree.r) 안
  {id:'fire',label:'모닥불',ic:'x-campfire',mx:CAMPFIRE.x,mz:CAMPFIRE.z,...at(CAMPFIRE.x+CAMPFIRE.logR+1,CAMPFIRE.z,CAMPFIRE)},
  {id:'mailbox',label:'우체통',ic:'x-mailbox',mx:MAILBOX.x,mz:MAILBOX.z,...at(MAILBOX.stand.x,MAILBOX.stand.z,MAILBOX)},
  {id:'snowman',label:'눈사람 마당',ic:'x-snowman',mx:SNOWMAN_YARD.x,mz:SNOWMAN_YARD.z,...yardIn(SNOWMAN_YARD,-1)},
  {id:'fight',label:'눈싸움 마당',ic:'x-snowball',mx:SNOWBALL_YARD.x,mz:SNOWBALL_YARD.z,...yardIn(SNOWBALL_YARD,1)},
  ...(carousel?[{id:'carousel',label:'회전목마',ic:'x-carousel',fb:'🎠',mx:CAROUSEL.x,mz:CAROUSEL.z,x:CAROUSEL.board.x,z:CAROUSEL.board.z,heading:CAROUSEL.board.heading}]:[]),
  ...(rink?[{id:'rink',label:'스케이트장',ic:'x-skate',fb:'⛸️',mx:RINK.x,mz:RINK.z,...at(RINK.gate.stand.x,RINK.gate.stand.z,RINK.gate)}]:[]),
  {id:'gondola',label:'케이블카',ic:'x-gondola',mx:gb.x,mz:gb.z,...at(gb.x-GONDOLA.near+.8,gb.z+1.2,gb)},
  {id:'sled',label:'썰매 출발대',ic:'x-sled',mx:deck.x,mz:deck.z,x:deck.x+deck.w/2+1.2,z:deck.z,heading:deck.heading},
  {id:'entrance',label:'입구',ic:'c-enter',mx:SPAWN.x,mz:SPAWN.z,x:SPAWN.x,z:SPAWN.z,heading:SPAWN.heading},
 ];
 return list;
}
// 지도 범위(세계 좌표): 마을 울타리 + 북쪽 산기슭(케이블카 승강장 뒤)까지. 산 꼭대기(썰매 출발대)는 지도 위 가장자리에 붙여 화살표로 그린다(edge).
export function mapBounds(pad=3){return {x0:-BOUNDS.r-pad,x1:BOUNDS.r+pad,z0:-BOUNDS.r-16,z1:BOUNDS.r+pad};}
// 세계 → 지도(0~1)
export function toMap(x,z,b=mapBounds()){const u=(x-b.x0)/(b.x1-b.x0),v=(z-b.z0)/(b.z1-b.z0),cl=t=>Math.max(.03,Math.min(.97,t));return {u:cl(u),v:cl(v),edge:u!==cl(u)||v!==cl(v)};}
// 지도에 그릴 바탕 자료(세계 좌표). 그림은 travel-ui.js가 SVG로
export function mapShapes({carousel=true,rink=true}={}){
 return {plaza:{x:0,z:0,r:PLAZA.radius},fence:{x:0,z:0,r:BOUNDS.r},tree:{x:TREE.x,z:TREE.z,r:2.2},
  yards:[SNOWMAN_YARD,SNOWBALL_YARD].map(Y=>({x:Y.x-Y.w/2,z:Y.z-Y.d/2,w:Y.w,d:Y.d})),
  houses:HOUSES.map(([x,z,,s])=>({x,z,s:s??1})),
  carousel:carousel?{x:CAROUSEL.x,z:CAROUSEL.z,r:CAROUSEL.baseR}:null,
  rink:rink?{x:RINK.x-RINK.w/2,z:RINK.z-RINK.d/2,w:RINK.w,d:RINK.d,r:RINK.corner}:null,
  mountain:{x0:-BOUNDS.gapX,x1:BOUNDS.gapX,z0:BOUNDS.north,z1:-BOUNDS.r*.75},
  gondola:{a:{x:GONDOLA.base.x,z:GONDOLA.base.z},b:{x:GONDOLA.top.x,z:GONDOLA.top.z}}};
}
// 달리기를 쓸 수 없는(걷기 단추·Shift가 무시되는) 때: 링크·회전목마·앉기·썰매·케이블카·장식·조준
export function runBlocked(s){return !!(s.rink||s.carousel||s.sitting||s.sled||s.gondola||s.deco||s.aiming);}
