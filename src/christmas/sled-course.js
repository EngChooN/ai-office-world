// 북쪽 「썰매 산」 긴 코스(월드개발, 2026-11-17, 눈썰매-눈싸움-개선-v1 §1-1). three 없음(서버·시험·layout.js가 같이 쓴다).
// 설계안은 가로 60m × 세로 45m였지만 마을 경계(울타리를 열어 둔 북쪽 통로: |x| < 25, z ≥ -57)에 들어가지 않아(직접 확인)
//  5줄 지그재그로 접어 가로 약 48.5m × 세로 37m에 넣었다(굽이 반지름은 설계 12·9m → 4~7m로 줄임, 길 폭 4.5m·출발대 높이 18m는 그대로).
// 길 가운데 선(출발 → 멈춤): ① 출발 직선 20m → 오른쪽 180° 굽이 → ② S자(좌·우·좌) → 왼쪽 180° 굽이(구간 1 끝)
//  → ③ 점프대 1(0.8m) → ④ 부스터 판 3개 → ⑤ 헤어핀 180°(반지름 5.5m, 드리프트, 구간 2 끝) → ⑥ 장애물(눈 더미 4·전나무 2)
//  → ⑦ 큰 점프대(1.2m) + 착지 부스터 → 왼쪽 180° 굽이 → ⑧ 결승 직선·결승 아치(약 192m) → 감속 15m → 멈춤 구역(x 8.6, z -20.4, 지금 자리 그대로).
// 좌표: x 동, z 남(+), 위에서 볼 때 방향 θ: 동 0, 남 π/2. 오른쪽으로 꺾기 = θ 커짐.

export const COURSE_W=4.5;            // 길 폭(4줄 동시 출발)
export const BANK_H=.5;               // 양옆 눈둑 높이
export const START_H=18;              // 출발대 높이
const STEP=.5;                        // 가운데 선 점 간격(m)
const PRE=4;                          // 출발대 몫(출발선 뒤 평평한 길)
const START={x:-2-PRE,z:-55.4,th:0};

// 거북이 명령: ['S',길이] 직진 · ['R'|'L',각도°,반지름] 굽이
const PLAN=Object.freeze([
 ['S',PRE+20],                                   // 출발대 + ① 출발 직선 20m
 ['R',180,4],                                    // 동쪽 굽이(가로 줄 2로)
 ['S',4],['L',30,7],['R',60,7],['L',30,7],['S',18], // ② S자 굽이(남쪽으로 1.9m 비켰다 돌아옴)
 ['L',180,4],                                    // 서쪽 굽이 → 구간 1 끝
 ['S',34.5],                                     // ③ 점프대 1 · ④ 부스터 줄
 ['R',180,5.5],                                  // ⑤ 헤어핀(드리프트) → 구간 2 끝
 ['S',34.5],                                     // ⑥ 장애물 숲 · ⑦ 큰 점프대
 ['L',180,4],                                    // 서쪽 굽이
 ['S',26.6],                                     // ⑧ 결승 직선 → 결승 아치 → 감속 → 멈춤 구역
]);

function build(){
 const pts=[];let {x,z,th}=START,s=-PRE;
 const push=()=>pts.push({x,z,th,s,k:0});
 push();
 const parts=[];
 for(const [op,a,r] of PLAN){
  const s0=s;
  if(op==='S'){const n=Math.max(1,Math.round(a/STEP)),d=a/n;for(let i=0;i<n;i++){x+=Math.cos(th)*d;z+=Math.sin(th)*d;s+=d;push();}}
  else{const sg=op==='R'?1:-1,ang=a*Math.PI/180,len=ang*r,n=Math.max(2,Math.round(len/STEP)),dth=sg*ang/n,d=len/n;
   for(let i=0;i<n;i++){th+=dth/2;x+=Math.cos(th)*d;z+=Math.sin(th)*d;th+=dth/2;s+=d;push();pts.at(-1).k=sg/r;}}
  parts.push({op,a,r,s0,s1:s});
 }
 return {pts,parts,total:s};
}
const B=build();
export const COURSE_POINTS=B.pts;             // [{x,z,th,s,k(굽이 곡률, 오른쪽 +)}]
export const COURSE_PARTS=B.parts;
export const COURSE_END=B.total;               // 멈춤 구역 끝(가운데 선 길이)
export const FINISH_S=+(COURSE_END-15).toFixed(2);        // 결승 아치(감속 구역 15m 앞)
// 구간 기록점: ②끝(서쪽 굽이 끝)·⑤끝(헤어핀 끝)·결승
export const CHECKPOINTS=Object.freeze([+B.parts[7].s1.toFixed(2),+B.parts[9].s1.toFixed(2),FINISH_S]);
const ROW3=B.parts[8].s0,ROW4=B.parts[10].s0;
// 점프대: s = 끝(발판 끝) 자리, h = 높이, len = 오르막 길이, air = 체공(초, 보통 속도 기준)
export const JUMPS=Object.freeze([{s:+(ROW3+5).toFixed(2),h:.8,len:2.6,air:.6},{s:+(ROW4+26.5).toFixed(2),h:1.2,len:3.2,air:.9}]);
// 부스터 판(폭 1.2m·길이 2m, 길 가운데): ④ 3개 + 큰 점프 착지 1개
export const BOOSTERS=Object.freeze([ROW3+12,ROW3+19.5,ROW3+27,ROW4+32].map(s=>Object.freeze({s:+s.toFixed(2),off:0,w:1.2,len:2})));
// 장애물(⑥, 지그재그·사이 2m 이상): pile = 눈 더미(반지름 0.5) · fir = 전나무(반지름 0.45)
export const OBSTACLES=Object.freeze([[4,-1.1,'pile'],[8,1.1,'pile'],[12,-1.35,'fir'],[16,.55,'pile'],[20,1.4,'fir'],[24,-.7,'pile']]
 .map(([ds,off,kind])=>Object.freeze({s:+(ROW4+ds).toFixed(2),off,kind,r:kind==='fir'?.45:.5})));
export const SECTIONS=Object.freeze({start:[0,20],curves:[20,CHECKPOINTS[0]],jump1:JUMPS[0].s,boost:[BOOSTERS[0].s,BOOSTERS[2].s+2],hairpin:[B.parts[9].s0,B.parts[9].s1],
 obstacles:[OBSTACLES[0].s,OBSTACLES.at(-1).s],jump2:JUMPS[1].s,finish:FINISH_S,end:COURSE_END});

// 길 높이(s): 출발대 18m → 결승에서 0m(평균 약 5.4°), 결승 뒤 감속 구역·멈춤 구역은 0
export function profileH(s){if(s<=0)return START_H;if(s>=FINISH_S)return 0;const u=s/FINISH_S;return START_H*(1-u);}
// 점프대 발판 높이(오르막: 길 위로 0 → h)
export function rampH(s){for(const j of JUMPS){const a=j.s-j.len;if(s>a&&s<=j.s){const t=(s-a)/j.len;return j.h*Math.pow(t,1.25);}}return 0;}

// 가운데 선 위 점(s → x,z,방향). 끝을 넘으면 마지막 방향으로 곧게
const P=COURSE_POINTS,N=P.length;
export function courseAt(s){
 if(s<=P[0].s){const p=P[0],e=s-p.s;return {x:p.x+Math.cos(p.th)*e,z:p.z+Math.sin(p.th)*e,th:p.th,k:0};}
 if(s>=P[N-1].s){const p=P[N-1],e=s-p.s;return {x:p.x+Math.cos(p.th)*e,z:p.z+Math.sin(p.th)*e,th:p.th,k:0};}
 let lo=0,hi=N-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].s<=s)lo=m;else hi=m;}
 const a=P[lo],b=P[hi],t=(s-a.s)/(b.s-a.s||1);let dth=b.th-a.th;
 return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,th:a.th+dth*t,k:b.k};
}
// 길 위 자리(s, 옆 off: 진행 방향 오른쪽 +) → 세계 x,z
export function courseXZ(s,off=0){const c=courseAt(s),nx=-Math.sin(c.th),nz=Math.cos(c.th);return {x:c.x+nx*off,z:c.z+nz*off,th:c.th,k:c.k};}
// 세계 x,z → 가장 가까운 가운데 선 점 {s,d(거리),off,i}. 칸 나누기로 빠르게
const CELL=4,grid=new Map(),key=(i,j)=>i*1000+j;
for(let i=0;i<N;i++){const k=key(Math.floor(P[i].x/CELL),Math.floor(P[i].z/CELL));let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(i);}
export function nearestCourse(x,z,{maxD=12,skip=null}={}){
 const ci=Math.floor(x/CELL),cj=Math.floor(z/CELL),R=Math.ceil(maxD/CELL);let best=null;
 for(let i=ci-R;i<=ci+R;i++)for(let j=cj-R;j<=cj+R;j++){const a=grid.get(key(i,j));if(!a)continue;
  for(const n of a){if(skip&&skip(P[n]))continue;const d=Math.hypot(x-P[n].x,z-P[n].z);if(d<=maxD&&(!best||d<best.d))best={i:n,d};}}
 if(!best)return null;
 // 이웃 선분에 내려 정확한 s·옆 거리
 const p=P[best.i],q=P[Math.min(N-1,best.i+1)],o=P[Math.max(0,best.i-1)];
 const proj=(a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=a.x+dx*t,pz=a.z+dz*t;return {s:a.s+(b.s-a.s)*t,d:Math.hypot(x-px,z-pz),px,pz,th:a.th+(b.th-a.th)*t};};
 const c=[proj(p,q),proj(o,p)].sort((u,v)=>u.d-v.d)[0];
 const nx=-Math.sin(c.th),nz=Math.cos(c.th),off=(x-c.px)*nx+(z-c.pz)*nz;
 return {s:c.s,d:c.d,off,i:best.i};
}
// 코스가 차지하는 네모(산 높이 칸 범위)
export const COURSE_BOX=Object.freeze((()=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of P){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}
 const m=COURSE_W/2;return {x0:x0-m,x1:x1+m,z0:z0-m,z1:z1+m};})());

// ── 산 높이(길 없는 땅). 길 위는 길 높이(옆으로 평평), 줄 사이는 두 길 높이를 이어 비탈, 바깥은 45°로 내려감. 0.5m 칸에 한 번 계산해 둔다.
const ROAD=COURSE_W/2+.7;            // 길 + 눈둑 자리(평평)
const GX0=-36,GX1=36,GZ0=-78,GZ1=-12,GS=.5,GW=Math.round((GX1-GX0)/GS)+1,GH=Math.round((GZ1-GZ0)/GS)+1;
let HG=null,DG=null;
function rawMountain(x,z){
 const a=nearestCourse(x,z,{maxD:6})??nearestCourse(x,z,{maxD:22});if(!a)return 0;
 const ha=profileH(a.s);
 if(a.d<=ROAD)return ha;
 // 사이에 낀 다른 줄(가운데 선으로 12m 넘게 떨어진 곳, 이 점에서 볼 때 가까운 줄과 반대쪽 = 두 줄 사이)
 const ax=courseAt(a.s),pax=ax.x-x,paz=ax.z-z,la=Math.hypot(pax,paz)||1;
 const b=nearestCourse(x,z,{maxD:Math.min(14,a.d+10),skip:p=>{if(Math.abs(p.s-a.s)<12)return true;const bx=p.x-x,bz=p.z-z;return (pax*bx+paz*bz)/(la*(Math.hypot(bx,bz)||1))>-.55;}});
 if(b&&b.d>ROAD){const hb=profileH(b.s),da=a.d-ROAD,db=b.d-ROAD,t=da/(da+db),u=t*t*(3-2*t);return ha+(hb-ha)*u;}
 return Math.max(0,ha-(a.d-ROAD)*1.05);
}
function grid0(){HG=new Float32Array(GW*GH);DG=new Float32Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=GX0+i*GS,z=GZ0+j*GS;HG[j*GW+i]=rawMountain(x,z);DG[j*GW+i]=nearestCourse(x,z,{maxD:8})?.d??8;}}
// 가운데 선까지 거리(m, 8 넘으면 8). 땅 색·눈 굴곡 끄기에 쓴다(칸 값)
export function courseDist(x,z){
 if(x<=GX0||x>=GX1||z<=GZ0||z>=GZ1)return 8;
 if(!DG)grid0();
 const fx=(x-GX0)/GS,fz=(z-GZ0)/GS,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,k=j*GW+i;
 return DG[k]*(1-u)*(1-v)+DG[k+1]*u*(1-v)+DG[k+GW]*(1-u)*v+DG[k+GW+1]*u*v;
}
// 산 높이(m, 0 이상). 칸 밖은 0
export function mountainH(x,z){
 if(x<=GX0||x>=GX1||z<=GZ0||z>=GZ1)return 0;
 if(!HG)grid0();
 const fx=(x-GX0)/GS,fz=(z-GZ0)/GS,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,k=j*GW+i;
 return HG[k]*(1-u)*(1-v)+HG[k+1]*u*(1-v)+HG[k+GW]*(1-u)*v+HG[k+GW+1]*u*v;
}
// 길 바로 위인지(옆 거리 ≤ 길 폭 절반 + m)
export function onCourse(x,z,m=0){const a=nearestCourse(x,z,{maxD:COURSE_W});return !!a&&a.d<=COURSE_W/2+m;}
