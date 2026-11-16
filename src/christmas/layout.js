// 온라인 크리스마스 「눈마을 광장」 배치(월드아트, 2026-11-16). three를 쓰지 않는 순수 자료·계산이라 서버·테스트도 같이 쓴다.
// 근거: 체험설계 v1 §2-1(월드디자인 추천 배치) — 가운데 트리, 서쪽 모닥불·눈싸움 마당, 동쪽 우체통·눈사람 마당, 북쪽 썰매 언덕, 남쪽 입구.
// 좌표: 1m = 1, x 오른쪽(동), -Z 북쪽(처음 카메라가 보는 쪽 = 트리), 광장 바닥 y=0. heading 0 = -Z를 봄(흡연장 아바타와 같은 규칙).
// 크기는 동동이 키 1.0m 기준이다. 숫자는 월드아트가 화면으로 맞춘 값이고, 놀이 판정 값(반경·제한)은 월드개발이 정한다.

// 광장 돌바닥 반지름 17m: 트리 둘레 길·전시 줄·모닥불(서)·우체통(동)이 모두 돌바닥 안에 든다.
export const PLAZA=Object.freeze({radius:17,ringPath:3,fence:43});
// 트리: 동동이 키의 약 9배(체험설계 「8~10배」). 층층 원뿔 6단, 둘레 길 폭 3m.
export const TREE=Object.freeze({x:0,z:0,height:9,trunkH:.75,trunkR:.36,starY:9.05,
 // 단마다 [아랫단 높이, 윗단(뾰족) 높이, 아래 반지름]. 위로 갈수록 좁고 서로 겹친다.
 tiers:Object.freeze([[.7,3.2,3.05],[1.9,4.3,2.62],[3.1,5.4,2.18],[4.3,6.5,1.74],[5.5,7.6,1.3],[6.7,8.85,.86]]),
 slots:120,firstY:.75,lastY:7.75});
// 전구 단계(체험설계 §5-1 「모두의 목표」): 장식 수 → 단계(0~4). 단계가 오를수록 아래에서 위로 더 많이 켜진다.
export const TREE_LIGHT_STEPS=Object.freeze([0,20,40,80,120]);
export const treeLightStage=count=>{let s=0;for(let i=1;i<TREE_LIGHT_STEPS.length;i++)if(count>=TREE_LIGHT_STEPS[i])s=i;return s;};
export const STAR_UNLOCK=40;

// 높이 y에서 트리 겉(가지 끝) 반지름. 겹친 단 중 가장 바깥 값.
export function treeRadiusAt(y){let r=0;for(const [y0,y1,r0] of TREE.tiers){if(y<y0||y>y1)continue;const t=(y-y0)/(y1-y0);r=Math.max(r,r0*(1-t));}return r;}
// 장식 자리 120개: 아래(0.75m)에서 위(7.75m)까지 황금각 나선. 자리마다 번호(0 = 가장 아래), 위치, 바깥 방향.
// 높이는 둘레 넓이에 비례해 나눈다(넓은 아래는 촘촘히, 좁은 위는 성기게) — 위쪽 장식끼리 겹치지 않게(가장 가까운 두 자리 ≥ 0.5m, 테스트).
// 자리는 가지 끝 바로 안쪽(겉 반지름 − 6cm)이고, 장식은 그 자리에서 바깥으로 8cm 나와 매달린다(props.js ORN_SCALE).
export function treeSlots(){
 const out=[],n=TREE.slots,GOLD=Math.PI*(3-Math.sqrt(5)),y0=TREE.firstY,y1=TREE.lastY,steps=400,cum=[0];
 for(let k=1;k<=steps;k++){const y=y0+(y1-y0)*(k-.5)/steps;cum.push(cum[k-1]+Math.max(.3,treeRadiusAt(y)));}
 const total=cum[steps],yAt=f=>{const t=f*total;let k=1;while(k<steps&&cum[k]<t)k++;const a=cum[k-1],b=cum[k];return y0+(y1-y0)*(k-1+(t-a)/(b-a||1))/steps;};
 for(let i=0;i<n;i++){
  const y=yAt((i+.5)/n),a=i*GOLD,r=Math.max(.35,treeRadiusAt(y)-.06);
  out.push(Object.freeze({id:i,x:TREE.x+Math.sin(a)*r,y,z:TREE.z+Math.cos(a)*r,nx:Math.sin(a),nz:Math.cos(a),reach:y<1.6}));
 }
 return Object.freeze(out);
}

// 입구(첫 등장 자리): 남쪽, 트리를 정면으로 본다. 반지름 3m 안에 흩어져 선다.
export const SPAWN=Object.freeze({x:0,z:14.5,heading:0,spread:3});
// 마을 입구 아치(광장 남쪽 끝, 입구 길 위). w = 기둥 사이 폭.
export const ENTRANCE=Object.freeze({x:0,z:18.2,w:4.6,h:3.4});
// 모닥불(서쪽): 통나무 의자 4개 × 2자리 = 8자리. 자리는 엉덩이 자리(seat)와 바라보는 방향(불 쪽).
export const CAMPFIRE=Object.freeze({x:-13,z:1,stoneR:.82,logR:2.35,logLen:1.35,seatY:.34,seats:8,glowR:4.2});
export function campfireSeats(){
 const out=[];
 for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2; // 통나무 4개: 대각선 자리(북동·남동·남서·북서)
  for(const s of [-1,1]){const t=s*CAMPFIRE.logLen*.24,cx=CAMPFIRE.x+Math.sin(a)*CAMPFIRE.logR+Math.cos(a)*t,cz=CAMPFIRE.z+Math.cos(a)*CAMPFIRE.logR-Math.sin(a)*t;
   const dx=CAMPFIRE.x-cx,dz=CAMPFIRE.z-cz;out.push(Object.freeze({id:out.length,log:k,x:cx,z:cz,y:CAMPFIRE.seatY,heading:Math.atan2(-dx,-dz)}));}}
 return Object.freeze(out);
}
// 선물 우체통(동쪽) + 「모두의 카드」 판(카드 5장).
export const MAILBOX=Object.freeze({x:12,z:-.6,heading:-Math.PI/2,stand:Object.freeze({x:10.8,z:-.6})});
export const CARD_BOARD=Object.freeze({x:13.4,z:-2.8,heading:-Math.PI/2-.35,cards:5});
// 완성 눈사람 전시 줄: 트리 남쪽 반원 8자리. 입구→트리 길(가운데 폭 4m)과 트리→모닥불·우체통 길(동서 축)을 비워 양쪽 4자리씩.
export function displaySlots(){
 const out=[],r=8.6;for(const s of [-1,1])for(const deg of [22,37,52,67]){const a=deg*Math.PI/180;out.push(Object.freeze({id:out.length,x:s*Math.sin(a)*r,z:Math.cos(a)*r,heading:Math.PI+s*a}));}
 return Object.freeze(out);
}
// 놀이 마당. 눈사람 마당(동쪽 바깥)·눈싸움 마당(서쪽 바깥). rect = 바닥 경계(월드개발 판정 기준점).
export const SNOWMAN_YARD=Object.freeze({x:27,z:2,w:12,d:14,maxBalls:6});
export const SNOWBALL_YARD=Object.freeze({x:-28,z:2,w:13,d:15,
 // 낮은 눈벽 4개 [가운데 x, z, 길이, 돌림(라디안)]. 높이 0.7m(동동이가 웅크리면 숨는다).
 walls:Object.freeze([[-31,-2.5,3.2,.35],[-25.5,5,3,-.5],[-29.5,6.2,2.4,.15],[-24.5,-3.4,2.6,.9]])});
// 모닥불과 눈싸움 마당 사이 가림 눈벽(체험설계 §2-2: 집 한 채와 눈벽으로 눈덩이가 모닥불까지 못 날아오게).
export const DIVIDER=Object.freeze({x:-19.2,z0:-4.5,z1:5.5,h:1.15});
// 집: 광장 둘레(장식, 들어가지 않음). [x, z, 색 번호, 크기 배율]. 앞문은 늘 광장 가운데(트리) 쪽을 본다(houseHeading).
export const HOUSES=Object.freeze([
 [-19.5,-11,0,1],[-19.5,13,1,1],[19.5,-11,2,1],[19.5,13,3,1],
 [-8.5,-21,1,.9],[10,23,0,.9],[-10,23.5,2,.95],
 [-33,-15,3,1.05],[33,-15,1,1.05],[-35,19,2,1],[35,20,0,1],
]);
export const houseHeading=(x,z)=>Math.atan2(-x,-z);
// 썰매 언덕(북쪽): 출발대(언덕 꼭대기) → 굽은 길 1번·둔덕 2개 → 멈춤 구역(평지). 길은 폭 넓게(3줄이 같은 길을 쓴다).
export const HILL=Object.freeze({x:0,z:-41,top:6.4,rx:21,rz:15});
export const SLED_RUN=Object.freeze({
 // 길 가운데 선(x, z). 높이는 heightAt이 정한다. 출발대 → 멈춤 구역.
 path:Object.freeze([[-3,-40.4],[-2.2,-36.5],[.6,-32.5],[4.6,-29],[7.4,-25.5],[8.4,-22.6],[8.6,-20.8]]),
 width:3.4,trench:.22,bumps:Object.freeze([.42,.66]),bumpH:.32,
 deck:Object.freeze({x:-3,z:-42,w:5.2,d:2.6,lanes:3}),stop:Object.freeze({x:8.6,z:-20.4,r:3}),
 // 걸어 올라가는 계단길(언덕 서쪽 비탈)
 stairs:Object.freeze([[-11.5,-24],[-12.8,-30.5],[-11.2,-36.5],[-6.4,-41.8]]),
});
// 가로등: 광장 둘레 8개 + 마당 입구 4개
export const LAMPS=Object.freeze([...Array.from({length:8},(_,i)=>{const a=(i+.5)*Math.PI/4;return [Math.sin(a)*17.7,Math.cos(a)*17.7];}),[-19.5,-6.8],[-19.5,7.8],[19.5,-6.2],[19.5,8.8]]);

const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);};
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),w=fz*fz*(3-2*fz);
 const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w;}
// 썰매 길 가운데 선을 따라 u(0~1) 자리와 그 점까지 가장 가까운 거리
function runPoint(u){const P=SLED_RUN.path,f=Math.min(P.length-1.0001,Math.max(0,u*(P.length-1))),i=Math.floor(f),t=f-i;
 return [P[i][0]+(P[i+1][0]-P[i][0])*t,P[i][1]+(P[i+1][1]-P[i][1])*t];}
export function nearestRun(x,z){let best={d:1e9,u:0};const P=SLED_RUN.path,n=P.length-1;
 for(let i=0;i<n;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=Math.min(1,Math.max(0,((x-ax)*dx+(z-az)*dz)/l2)),px=ax+dx*t,pz=az+dz*t,d=Math.hypot(x-px,z-pz);
  if(d<best.d)best={d,u:(i+t)/n};}
 return best;}
// 언덕 몸체 높이(길 파임 제외). 위가 둥근 둔덕, 출발대 자리는 평평.
function hillBody(x,z){const dx=(x-HILL.x)/HILL.rx,dz=(z-HILL.z)/HILL.rz,r=Math.hypot(dx,dz);if(r>=1)return 0;
 const h=HILL.top*Math.pow(Math.cos(r*Math.PI/2),1.6);return h;}
// 땅 높이(m). 광장 안은 0. 밖은 쌓인 눈의 얕은 굴곡, 북쪽은 언덕, 썰매 길은 살짝 파이고 둔덕 둘.
export function heightAt(x,z){
 const r=Math.hypot(x,z);
 let h=hillBody(x,z);
 // 썰매 길: 언덕 몸체를 길 방향으로 매끄럽게(옆으로 기울지 않게) + 얕은 파임 + 둔덕
 if(h>0||r>PLAZA.radius){const {d,u}=nearestRun(x,z),w=SLED_RUN.width/2;
  if(d<w+2.2){const [cx,cz]=runPoint(u),along=hillBody(cx,cz),k=1-smooth(w,w+2.2,d);
   let bump=0;for(const b of SLED_RUN.bumps)bump+=SLED_RUN.bumpH*Math.exp(-Math.pow((u-b)/.035,2));
   // 파임·둔덕은 언덕 위에서만(평지 끝에 웅덩이가 생기지 않게)
   const onHill=smooth(.05,.8,along),trench=SLED_RUN.trench*(1-smooth(w*.55,w,d))*onHill;h=h+(along+(bump-trench)*onHill-h)*k;}}
 // 출발대: 언덕 위를 평평하게 깎는다(썰매 길 다듬기 뒤에 — 길 시작점도 출발대 높이에 맞춘다)
 {const d=SLED_RUN.deck,k=1-smooth(3,5.2,Math.hypot((x-d.x)/1.4,z-d.z));if(k>0)h=h+(hillBody(d.x,d.z)-h)*k;}
 // 광장 밖 눈 굴곡(트리·마당 바닥은 평평하게 둔다)
 const drift=(noise(x*.18,z*.18)-.5)*.5+(noise(x*.5+7,z*.5+3)-.5)*.12;
 let flat=smooth(PLAZA.radius+1,PLAZA.radius+5,r);
 for(const y of [SNOWMAN_YARD,SNOWBALL_YARD]){const dx=Math.abs(x-y.x)-y.w/2,dz=Math.abs(z-y.z)-y.d/2;flat*=smooth(0,2.5,Math.max(dx,dz));}
 {const s=SLED_RUN.stop;flat*=smooth(s.r,s.r+2,Math.hypot(x-s.x,z-s.z));}
 // 출발대·썰매 길 위는 굴곡 없이(출발대가 기울지 않고 썰매가 덜컹거리지 않게)
 {const d=SLED_RUN.deck;flat*=smooth(3,5.2,Math.hypot((x-d.x)/1.4,z-d.z));flat*=smooth(SLED_RUN.width/2,SLED_RUN.width/2+1.5,nearestRun(x,z).d);}
 return h+Math.max(0,drift+.12)*flat;
}
// 광장 밖 경계(보이지 않는 벽 대신 울타리·눈 더미): 반지름 PLAZA.fence 원. 언덕 쪽은 언덕 끝까지 열려 있다.
export const BOUNDS=Object.freeze({r:PLAZA.fence,north:-58});
// 가까이 가면 할 일 표시가 뜨는 대상(체험설계 §1-3). r = 표시 반경 추천값(월드개발 조정).
export const TARGETS=Object.freeze({
 tree:{x:TREE.x,z:TREE.z,r:5.2},campfire:{x:CAMPFIRE.x,z:CAMPFIRE.z,r:3.6},mailbox:{x:MAILBOX.x,z:MAILBOX.z,r:2.2},
 snowmanYard:{x:SNOWMAN_YARD.x,z:SNOWMAN_YARD.z,r:7},snowballYard:{x:SNOWBALL_YARD.x,z:SNOWBALL_YARD.z,r:7.5},sledDeck:{x:SLED_RUN.deck.x,z:SLED_RUN.deck.z,r:3},
});
