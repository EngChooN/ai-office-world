// 새 기계 3종 난이도 어림(사람 손 모델, 열쇠 key-rate.mjs와 같은 σ60ms). node rate.mjs
// 판당 = 보장 없는 판, 평균 판 = 보장 포함(첫 경품까지). 모두 추정(실제 화면·물리 아님).
let seed=777;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const SIG=.06,N=200000;
const avgPlays=(play,after)=>{let tot=0,G=40000;for(let g=0;g<G;g++){let f=0,k=0;for(;;){k++;if(play(after>0&&f>=after))break;f++;}tot+=k;}return +(tot/G).toFixed(2);};
const pct=(play)=>{let w=0;for(let n=0;n<N;n++)w+=play(false);return +(w/N*100).toFixed(1);};

// ① 불빛 쌓기: 7칸 폭·11줄. 줄 r의 한 칸 머무는 시간 step(r). 시작 폭 3(보장 4). 줄 1은 아무 데나.
//  누른 시각 오차 e ~ N(0,σ) → 어긋난 칸 = round(e/step). 폭 = 폭 − |어긋남|. 상한 cap(r)(높은 줄 최대 칸)
export const STACK={cols:7,rows:11,mid:7,width:3,pityWidth:4,step0:.26,stepMul:.9,stepMin:.075,cap:{8:2}};
const stepOf=(r,S)=>Math.max(S.stepMin,S.step0*Math.pow(S.stepMul,r-1));
function stackRun(S,pity){let w=pity?S.pityWidth:S.width,top=0;
 for(let r=1;r<=S.rows;r++){ if(r>1){const k=Math.round(gauss()*SIG/stepOf(r,S));w-=Math.abs(k);if(w<=0)return top;}
  for(const [row,c] of Object.entries(S.cap))if(r>=+row)w=Math.min(w,c);top=r;}return top;}
function stack(S){let mid=0,top=0,M=N;for(let n=0;n<M;n++){const t=stackRun(S,false);if(t>=S.mid)mid++;if(t>=S.rows)top++;}
 return {mid:+(mid/M*100).toFixed(1),top:+(top/M*100).toFixed(2),avgMid:avgPlays(p=>stackRun(S,p)>=S.mid,5),
  steps:Array.from({length:S.rows},(_,i)=>Math.round(stepOf(i+1,S)*1000))};}

// ② 줄 자르기: 가위 속도 v(m/s) 누르고 있기, 뗀 시각 오차 → 자리 오차 v·σ. 줄 흔들림 진폭 A·주기 P, 가운데를 지날 때 자름 → vmax·σ.
//  자르는 곳 반폭 w, 아까움 2w. 보장(8판) = 직원이 줄을 잡아 흔들림 멈춤
export const STRING={v:.2,A:.035,P:1.8,w:.004,near:2,pityAfter:8};
function cut(S,pity){const vmax=pity?0:2*Math.PI*S.A/S.P;const e=gauss()*SIG*S.v+gauss()*SIG*vmax;return Math.abs(e)<=S.w;}
function cutExpert(S){// 끝에서 자르기(진폭이 판마다 ±25% 달라 끝 자리가 바뀜 → 눈으로 맞춘 끝 자리 오차 ~ 균등 ±0.25A의 절반)
 const e=gauss()*SIG*S.v+(rnd()-.5)*.25*S.A;return Math.abs(e)<=S.w;}

// ③ 공 구멍: 4×4 구멍 간격 p. 떨어뜨린 자리 오차 σd(집게 자리, 십자 단추) + 튐 흩어짐 σs(간격 배수). 색 구멍 3(보통 2·희귀 1, 희귀는 가장자리).
//  공은 떨어진 점의 가장 가까운 구멍으로. 벽은 되튐(안으로 접음). 보장(5판) = 색 구멍 하나 추가(가운데 쪽)
export const BALL={n:4,p:.06,sd:.008,ss:.85,color:[[1,1],[2,2]],rare:[[3,0]],pity:[[1,2]],pityAfter:5};
function ballRun(B,pity,target){const half=B.n*B.p/2;const fold=v=>{let x=v;for(let i=0;i<4;i++){if(x<-half)x=-2*half-x;if(x>half)x=2*half-x;}return x;};
 const cx=(target[0]+.5)*B.p-half,cz=(target[1]+.5)*B.p-half;
 const x=fold(cx+gauss()*B.sd+gauss()*B.ss*B.p),z=fold(cz+gauss()*B.sd+gauss()*B.ss*B.p);
 const i=Math.min(B.n-1,Math.max(0,Math.floor((x+half)/B.p))),j=Math.min(B.n-1,Math.max(0,Math.floor((z+half)/B.p)));
 const hit=(l)=>l.some(([a,b])=>a===i&&b===j);return hit(B.color)?'color':hit(B.rare)?'rare':pity&&hit(B.pity)?'color':'';}
function ball(B){let c=0,r=0;for(let n=0;n<N;n++){const a=ballRun(B,false,B.color[0]);if(a)c++;const b=ballRun(B,false,B.rare[0]);if(b==='rare')r++;}
 return {aimColor:+(c/N*100).toFixed(1),aimRareGetRare:+(r/N*100).toFixed(1),avg:avgPlays(p=>!!ballRun(B,p,B.color[0]),B.pityAfter)};}

// 비교: 타이머(10.00만, 0.01초 칸, σ60ms) 판당
const timer=()=>{let w=0;for(let n=0;n<N;n++){const e=gauss()*SIG;if(Math.floor((e+.005)/.01)===0)w++;}return +(w/N*100).toFixed(1);};

const out={sigmaMs:SIG*1000,stack:stack(STACK),stackNoCap:stack({...STACK,cap:{}}),
 string:{perPlay:pct(p=>cut(STRING,p)),perPlayPity:pct(()=>cut(STRING,true)),expert:pct(()=>cutExpert(STRING)),avg:avgPlays(p=>cut(STRING,p),STRING.pityAfter)},
 ball:ball(BALL),timerPerPlay:timer()};
console.log(JSON.stringify(out,null,1));
