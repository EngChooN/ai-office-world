// 북쪽 「썰매 산」 코스(월드개발, 2026-11-17 · 2차: 긴 코스 + 판마다 다른 코스). three 없음(서버·시험·layout.js가 같이 쓴다).
// 산(땅)과 코스(길)를 나눴다.
//  - 산 = 늘 같은 「뼈대」: 동서로 긴 단(段) 7줄을 지그재그로 잇는다(줄 간격 12m, 줄 직선 x −24~24, 끝은 반지름 6m 반원).
//    단은 폭 8.6m(11-18: 길 6m가 옆으로 1.0m까지 비켜도, 굽이 7m가 0.75m 비켜도 들어감)로 옆으로 평평하고, 뼈대를 따라 출발대 높이 START_H에서 결승 0m까지 고르게 내려간다.
//    걸어 다니는 땅 높이(mountainH)·눈 굴곡 끄기(courseDist)는 뼈대로만 정해 코스가 바뀌어도 땅은 그대로다(산 위에 서 있던 사람이 뜨거나 묻히지 않음).
//  - 코스 = 시드(seed)로 고른 구간 블록을 뼈대 위에 늘어놓은 것: 굽이(S자)·점프대·부스터·좁은 길·장애물 숲·얼음 길·터널 + 줄 끝 굽이 3종(헤어핀·보통·크게).
//    같은 시드 = 같은 코스(서버·혼자 모드·시험 모두 같은 계산). 같은 방은 서버가 정한 시드 하나를 같이 쓴다(sled-race.js).
//  - 길이: 뼈대 456m(결승 438m) + 굽이로 비킨 몫 → 결승까지 약 440~460m, 보통 실력 약 60~75초(시험이 시드 여러 개로 확인).
// 마을 경계: 북쪽 울타리를 연 곳(z < −24, |x| < 36, z ≥ −116) 안. 출발대 옆 꼭대기 승강장(케이블카, gondola.js) 자리는 평평하게 둔다.
// 좌표: x 동, z 남(+), 위에서 볼 때 방향 θ: 동 0, 남 π/2. 오른쪽으로 꺾기 = θ 커짐. 옆 거리 off는 진행 방향 오른쪽 +.

// 길 폭(11-18 설계 v2 §3-1, 4명 경주): 썰매 4대(0.48m×4) + 사이 3칸(0.5m×3) + 양쪽 눈둑 몫(0.32m×2) = 4.06m → 어디서든 MIN_RACE_W 이상
export const COURSE_W=6.0;            // 기본 길 폭(부스터·얼음·점프대·장애물 숲 포함, 예전 4.5)
export const NARROW_W=4.5;            // 좁은 길 폭(예전 3.0)
export const WIDE_W=7.0;              // 출발 직선(처음 20m)·줄 끝 굽이·결승 직선·멈춤 구역
export const TUNNEL_W=5.5;            // 터널
export const START_STRAIGHT=20;       // 출발선부터 넓은 길(m, 뼈대 u)
export const MIN_RACE_W=4.1;          // 4대가 나란히 지나갈 수 있는 가장 좁은 폭(시험이 모든 시드로 확인)
export const BANK_H=.5;               // 양옆 눈둑 높이
export const START_H=26;              // 출발대 높이(m)
export const START_DROP=Object.freeze({len:40,h:5.6});   // 처음 40m는 가파르게 5.6m(빨리 속도가 붙게), 그 뒤 결승까지 고르게
export const BENCH=4.3;               // 단 반폭(길 + 비킴 1.6m + 눈둑 자리)
const STEP=.5;                        // 점 간격(m)
const PRE=4;                          // 출발대 몫(출발선 뒤 평평한 길)
export const ROWS=7,ROW_GAP=12,ROW_X=24,TURN_R=ROW_GAP/2,ROW_Z0=-106;
const START={x:-28-PRE,z:ROW_Z0,th:0};
const LAST_X=27;                      // 마지막 줄 끝(멈춤 구역 끝)
export const STOP_LEN=18;             // 결승 뒤 감속 15m + 멈춤 3m
export const SUMMIT=Object.freeze({x:-33,z:ROW_Z0-7.5,r:4.5});   // 꼭대기 평평한 곳(케이블카 승강장, 출발대 북서쪽)

// ── 뼈대(늘 같음): 거북이 명령 ['S',길이] · ['R'|'L',각도°,반지름]
const PLAN=(()=>{const a=[['S',PRE+28+ROW_X]];for(let k=1;k<ROWS;k++){a.push([k%2?'R':'L',180,TURN_R]);a.push(['S',k===ROWS-1?ROW_X+LAST_X:2*ROW_X]);}return a;})();
function buildSkeleton(){
 const pts=[];let {x,z,th}=START,u=-PRE;
 const push=k=>pts.push({x,z,th,u,k});
 push(0);const parts=[];
 for(const [op,a,r] of PLAN){const u0=u;
  if(op==='S'){const n=Math.max(1,Math.round(a/STEP)),d=a/n;for(let i=0;i<n;i++){x+=Math.cos(th)*d;z+=Math.sin(th)*d;u+=d;push(0);}}
  else{const sg=op==='R'?1:-1,ang=a*Math.PI/180,len=ang*r,n=Math.max(2,Math.round(len/STEP)),dth=sg*ang/n,d=len/n;
   for(let i=0;i<n;i++){th+=dth/2;x+=Math.cos(th)*d;z+=Math.sin(th)*d;th+=dth/2;u+=d;push(sg/r);}}
  parts.push({op,r:r??0,sg:op==='R'?1:op==='L'?-1:0,u0,u1:u});}
 return {pts,parts,total:u};
}
const SK=buildSkeleton();
export const SKELETON=SK.pts;
export const SKELETON_END=+SK.total.toFixed(3);
export const FINISH_U=+(SKELETON_END-STOP_LEN).toFixed(3);
// 줄(직선) 구간 [u0,u1]과 줄 끝 굽이(sg: +1 오른쪽)
export const ROW_SPANS=Object.freeze(SK.parts.filter(p=>p.op==='S').map(p=>Object.freeze({u0:Math.max(0,p.u0),u1:p.u1})));
export const TURN_SPANS=Object.freeze(SK.parts.filter(p=>p.op!=='S').map(p=>Object.freeze({u0:p.u0,u1:p.u1,sg:p.sg})));
// 뼈대 높이(u): 출발대 START_H → 결승 0(고르게), 결승 뒤 0
export function heightU(u){if(u<=0)return START_H;if(u>=FINISH_U)return 0;const {len,h}=START_DROP;if(u<len){const t=u/len;return START_H-h*(t*.4+.6*(1-(1-t)*(1-t)));}return (START_H-h)*(1-(u-len)/(FINISH_U-len));}
function skAt(u){const P=SK.pts,N=P.length;if(u<=P[0].u){const p=P[0],e=u-p.u;return {x:p.x+Math.cos(p.th)*e,z:p.z+Math.sin(p.th)*e,th:p.th};}
 if(u>=P[N-1].u){const p=P[N-1],e=u-p.u;return {x:p.x+Math.cos(p.th)*e,z:p.z+Math.sin(p.th)*e,th:p.th};}
 const i=Math.min(N-2,Math.max(0,Math.floor((u-P[0].u)/STEP)));let a=P[i],b=P[i+1];
 // 점 간격이 조금씩 달라 한두 칸 보정
 let j=i;while(j>0&&P[j].u>u){j--;}while(j<N-2&&P[j+1].u<u)j++;a=P[j];b=P[j+1];
 const t=(u-a.u)/(b.u-a.u||1);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,th:a.th+(b.th-a.th)*t};}
export const skeletonAt=skAt;

// 칸 나누기 가장 가까운 점 찾기(뼈대·코스 공용)
function makeNearest(P){
 const CELL=4,grid=new Map(),key=(i,j)=>i*4096+j;
 for(let i=0;i<P.length;i++){const k=key(Math.floor(P[i].x/CELL),Math.floor(P[i].z/CELL));let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(i);}
 const N=P.length;
 return function nearest(x,z,{maxD=12,skip=null,key:kk='s'}={}){
  const ci=Math.floor(x/CELL),cj=Math.floor(z/CELL),R=Math.ceil(maxD/CELL);let best=null;
  for(let i=ci-R;i<=ci+R;i++)for(let j=cj-R;j<=cj+R;j++){const a=grid.get(key(i,j));if(!a)continue;
   for(const n of a){if(skip&&skip(P[n]))continue;const d=Math.hypot(x-P[n].x,z-P[n].z);if(d<=maxD&&(!best||d<best.d))best={i:n,d};}}
  if(!best)return null;
  const p=P[best.i],q=P[Math.min(N-1,best.i+1)],o=P[Math.max(0,best.i-1)];
  const proj=(a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=a.x+dx*t,pz=a.z+dz*t;
   return {s:a[kk]+(b[kk]-a[kk])*t,d:Math.hypot(x-px,z-pz),px,pz,th:a.th+(b.th-a.th)*t};};
  const c=[proj(p,q),proj(o,p)].sort((u,v)=>u.d-v.d)[0];
  const nx=-Math.sin(c.th),nz=Math.cos(c.th),off=(x-c.px)*nx+(z-c.pz)*nz;
  return {s:c.s,d:c.d,off,i:best.i};
 };
}
const skNearest=makeNearest(SK.pts);
export const nearestSkeleton=(x,z,o={})=>skNearest(x,z,{...o,key:'u'});

// ── 산 높이(길 없는 땅). 단 위는 뼈대 높이(옆으로 평평), 줄 사이는 두 단 높이를 이어 비탈, 바깥은 약 58°로 내려감. 0.5m 칸에 한 번 계산(처음 쓸 때, 약 0.2초).
const GX0=-56,GX1=56,GZ0=-136,GZ1=-14,GS=.5,GW=Math.round((GX1-GX0)/GS)+1,GH=Math.round((GZ1-GZ0)/GS)+1;
const FALL=1.6;
let HG=null,DG=null;
function rawMountain(x,z){
 // 꼭대기 승강장(평평) — 출발대 뒤
 const ds=Math.hypot(x-SUMMIT.x,z-SUMMIT.z);
 const summit=ds<=SUMMIT.r?START_H:Math.max(0,START_H-(ds-SUMMIT.r)*FALL);
 const a=skNearest(x,z,{maxD:6,key:'u'})??skNearest(x,z,{maxD:30,key:'u'});if(!a)return summit;
 const ha=heightU(a.s);
 if(a.d<=BENCH)return Math.max(ha,a.s<2?summit:0);
 const ax=skAt(a.s),pax=ax.x-x,paz=ax.z-z,la=Math.hypot(pax,paz)||1;
 const b=skNearest(x,z,{maxD:Math.min(16,a.d+12),key:'u',skip:p=>{if(Math.abs(p.u-a.s)<14)return true;const bx=p.x-x,bz=p.z-z;return (pax*bx+paz*bz)/(la*(Math.hypot(bx,bz)||1))>-.55;}});
 if(b&&b.d>BENCH){const hb=heightU(b.s),da=a.d-BENCH,db=b.d-BENCH,t=da/(da+db),w=t*t*(3-2*t);return Math.max(summit,ha+(hb-ha)*w);}
 return Math.max(summit,ha-(a.d-BENCH)*FALL);
}
function grid0(){HG=new Float32Array(GW*GH);DG=new Float32Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=GX0+i*GS,z=GZ0+j*GS;HG[j*GW+i]=rawMountain(x,z);DG[j*GW+i]=skNearest(x,z,{maxD:9,key:'u'})?.d??9;}}
const bil=(G,x,z)=>{const fx=(x-GX0)/GS,fz=(z-GZ0)/GS,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,k=j*GW+i;return G[k]*(1-u)*(1-v)+G[k+1]*u*(1-v)+G[k+GW]*(1-u)*v+G[k+GW+1]*u*v;};
// 뼈대 가운데 선까지 거리(m, 9 넘으면 9) — 단 위인지(땅 색·눈 굴곡 끄기)
export function courseDist(x,z){if(x<=GX0||x>=GX1||z<=GZ0||z>=GZ1)return 9;if(!DG)grid0();return bil(DG,x,z);}
// 산 높이(m, 0 이상). 칸 밖은 0
export function mountainH(x,z){if(x<=GX0||x>=GX1||z<=GZ0||z>=GZ1)return 0;if(!HG)grid0();return bil(HG,x,z);}
export const MOUNTAIN_BOX=Object.freeze({x0:GX0,x1:GX1,z0:GZ0,z1:GZ1});

// ── 시드 → 코스
// 작은 결정적 난수(mulberry32). 서버·화면 같은 수열
export function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export const normSeed=s=>(Number.isFinite(+s)?(+s>>>0):0)||1;
// 코스 이름(화면·기록 구분용): 시드 → 「코스 7K2Q」
export const courseCode=seed=>{let s=normSeed(seed),o='';const A='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';for(let i=0;i<4;i++){o+=A[s%32];s=Math.floor(s/32)^(s*7%13);}return o;};
// 오늘(서울)의 시드: 방이 처음 생길 때·혼자 모드 처음 코스
export const dailySeed=(t=Date.now())=>{const d=new Date(t+9*3600e3).toISOString().slice(0,10);let h=2166136261;for(const ch of d){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return normSeed(h);};
// 블록 종류. len = 뼈대 길이(m)
export const BLOCKS=Object.freeze({
 chicane:{len:20,name:'굽이'},jump:{len:23,name:'점프대'},boost:{len:12,name:'부스터'},narrow:{len:14,name:'좁은 길'},
 forest:{len:18,name:'장애물 숲'},ice:{len:14,name:'얼음 길'},tunnel:{len:14,name:'터널'},
});
// w: 굽이 안쪽으로 비키는 거리(+ = 안쪽 = 반지름 작아짐). 11-18: 길이 옆으로 비키는 폭 1.6→1.0m 안(굽이 폭 7m가 단 8.6m 안에 들게 0.75)
export const TURN_KINDS=Object.freeze({hairpin:{w:.75,name:'헤어핀'},normal:{w:0,name:'굽이'},wide:{w:-.75,name:'큰 굽이'}});
const LEAD=5;                         // 줄 끝 굽이로 들어가고 나오는 비킴 구간(m)
const REQUIRED=['jump','jump','boost','boost','forest','chicane','chicane','narrow','ice','tunnel'];
const EXTRA=['boost','chicane','forest','jump','ice','narrow','boost'];
const sm=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// 블록 고르기(순수): 줄마다 들어갈 칸 길이 → 블록 목록 [{type,u0,u1,...}] + 굽이 종류
export function planCourse(seed){
 const R=rng(normSeed(seed)),pick=a=>a[Math.floor(R()*a.length)];
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const req=shuffle([...REQUIRED]),extra=shuffle([pick(EXTRA),pick(EXTRA),pick(EXTRA)]);
 // 줄마다 블록 칸: 첫 줄은 출발 가속 18m 뒤, 마지막 줄은 결승 직선 10m 앞까지. 줄마다 최대 2개(마지막 줄 1개)
 const slots=ROW_SPANS.map((r,i)=>{const a=i===0?18:r.u0+LEAD,b=i===ROWS-1?FINISH_U-10:r.u1-LEAD;return {a,b,len:b-a,n:i===ROWS-1?1:2};});
 const rows=slots.map(()=>[]);
 const left=i=>slots[i].len-rows[i].reduce((s,t)=>s+BLOCKS[t].len,0);
 // 꼭 들어갈 블록 먼저, 그다음 덤 블록: 들어갈 수 있는 줄 중 블록이 적은 줄(같으면 난수)
 for(const t of [...req,...extra]){
  const cand=rows.map((r,i)=>i).filter(i=>rows[i].length<slots[i].n&&left(i)>=BLOCKS[t].len&&!rows[i].includes(t));
  if(!cand.length)continue;const fewest=Math.min(...cand.map(i=>rows[i].length)),pool=cand.filter(i=>rows[i].length===fewest);
  rows[pool[Math.floor(R()*pool.length)]].push(t);}
 rows.forEach(r=>shuffle(r));
 const blocks=[];
 rows.forEach((list,i)=>{const sl=slots[i],used=list.reduce((s,t)=>s+BLOCKS[t].len,0),slack=Math.max(0,sl.len-used);
  // 남는 길이를 블록 앞·사이·뒤에 나눠 둔다
  const cuts=list.map(()=>R()).concat(R());const sum=cuts.reduce((a,b)=>a+b,0)||1;let u=sl.a;
  list.forEach((t,j)=>{u+=slack*cuts[j]/sum;const b={type:t,u0:+u.toFixed(2),u1:+(u+BLOCKS[t].len).toFixed(2),row:i};
   if(t==='chicane'){b.amp=(R()<.5?-1:1)*(.75+R()*.25);} // 옆으로 최대 1.0m(6m 길이 단 안에)
   if(t==='jump'){b.big=R()<.5;}
   if(t==='boost'){b.offs=[pick([-1,0,1]),pick([-1,0,1])];}
   // 장애물은 가운데 근처(옆 0.3~0.5m) → 양옆 틈이 모두 2m 이상(6m 길, 반지름 0.5m)
   if(t==='forest'){let sg=R()<.5?-1:1;b.obs=[0,1,2,3].map(k=>{const off=sg*(.3+R()*.2);sg=R()<.8?-sg:sg;return {du:2.5+k*4.8,off:+off.toFixed(2),kind:R()<.35?'fir':'pile'};});}
   if(t==='tunnel'){b.lights=R()<.5;}
   blocks.push(b);u=b.u1;});});
 const turns=TURN_SPANS.map(()=>pick(['hairpin','normal','wide','hairpin','normal']));
 if(!turns.includes('hairpin'))turns[Math.floor(R()*turns.length)]='hairpin';
 return {seed:normSeed(seed),blocks,turns};
}

// 옆으로 비키기 w(u)·길 폭·표면(얼음)·터널 여부
function lateral(plan){
 const {blocks,turns}=plan;
 return u=>{
  let w=0,ice=false,tun=false,wide=0;
  // 넓은 곳: 출발 직선(처음 20m, 그 뒤 3m에 걸쳐 6m로) · 결승 직선(결승 12m 앞 ~ 결승 뒤 3m) 7m. 그 뒤 감속 구간 6m·멈춤 구역 4.5m
  //  (넓히면 마을 승강장을 막 떠난 케이블카 객실 아래로 길 가장자리가 들어감 — 시험 「객실은 길 위 2.5m 넘게」)
  wide=Math.max(wide,u<=START_STRAIGHT?1:1-sm((u-START_STRAIGHT)/3),Math.min(sm((u-(FINISH_U-12))/3),1-sm((u-(FINISH_U+3))/3)));
  // 줄 끝 굽이(안쪽 + 방향 = 굽이 방향 sg) — 굽이는 7m
  TURN_SPANS.forEach((t,i)=>{if(u<t.u0-LEAD||u>t.u1+LEAD)return;const f=u<t.u0?sm((u-(t.u0-LEAD))/LEAD):u>t.u1?1-sm((u-t.u1)/LEAD):1;
   wide=Math.max(wide,f);const kw=TURN_KINDS[turns[i]].w*t.sg;if(kw)w+=kw*f;});
  let W=COURSE_W+(WIDE_W-COURSE_W)*wide;
  // 멈춤 구역 끝(결승 6m 뒤부터)은 4.5m — 4대가 나란히 멈출 수 있는 폭(4.1m 이상)은 지키고, 케이블카 객실(마을 승강장 바로 앞) 아래에서는 비킨다
  if(u>FINISH_U+6)W=W-(W-NARROW_W)*sm((u-(FINISH_U+6))/3);
  for(const b of blocks){if(u<b.u0||u>b.u1)continue;const t=(u-b.u0)/(b.u1-b.u0),e=Math.min(u-b.u0,b.u1-u);
   if(b.type==='chicane')w+=b.amp*(Math.sin(2*Math.PI*t)-.5*Math.sin(4*Math.PI*t))/1.3;
   else if(b.type==='narrow')W=W-(W-NARROW_W)*sm(e/3);
   else if(b.type==='ice')ice=true;
   else if(b.type==='tunnel'){tun=true;W=W-(W-TUNNEL_W)*sm(e/2);}}
  return {w,W,ice,tun};
 };
}

const cache=new Map();
// makeCourse(seed) → 코스 객체(같은 시드는 같은 객체). 서버는 시드만 쓰고 계산은 화면·시험이 한다.
export function makeCourse(seed){
 const sd=normSeed(seed);if(cache.has(sd))return cache.get(sd);
 const plan=planCourse(sd),lat=lateral(plan);
 // 가운데 선 점: 뼈대 + 옆으로 w
 const raw=[];for(let u=-PRE;u<=SKELETON_END+1e-6;u+=STEP){const c=skAt(u),L=lat(u),nx=-Math.sin(c.th),nz=Math.cos(c.th);raw.push({x:c.x+nx*L.w,z:c.z+nz*L.w,u,w:L.w,W:L.W,ice:L.ice,tun:L.tun});}
 let s=-PRE;raw.forEach((p,i)=>{if(i)s+=Math.hypot(p.x-raw[i-1].x,p.z-raw[i-1].z);p.s=s;});
 raw.forEach((p,i)=>{const a=raw[Math.max(0,i-1)],b=raw[Math.min(raw.length-1,i+1)];p.th=Math.atan2(b.z-a.z,b.x-a.x);});
 // 방향은 이어지게(±π 넘김 없이) 풀어 둔다
 for(let i=1;i<raw.length;i++){let d=raw[i].th-raw[i-1].th;d=Math.atan2(Math.sin(d),Math.cos(d));raw[i].th=raw[i-1].th+d;}
 raw.forEach((p,i)=>{const a=raw[Math.max(0,i-2)],b=raw[Math.min(raw.length-1,i+2)];p.k=(b.th-a.th)/((b.s-a.s)||1);});
 const P=raw.map(p=>Object.freeze({x:p.x,z:p.z,th:p.th,s:+p.s.toFixed(4),k:p.k,u:p.u,w:p.w,W:p.W,ice:p.ice,tun:p.tun}));
 const N=P.length,end=P[N-1].s;
 // s ↔ u
 const sOfU=u=>{const i=Math.max(0,Math.min(N-2,Math.round((u+PRE)/STEP)));const a=P[i],b=P[Math.min(N-1,i+1)];if(u<=a.u||b===a)return a.s+(u-a.u);return a.s+(b.s-a.s)*(u-a.u)/((b.u-a.u)||1);};
 const idx=s=>{if(s<=P[0].s)return 0;if(s>=P[N-1].s)return N-2;let lo=0,hi=N-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].s<=s)lo=m;else hi=m;}return lo;};
 const uOfS=s=>{if(s<=P[0].s)return P[0].u+(s-P[0].s);if(s>=P[N-1].s)return P[N-1].u+(s-P[N-1].s);const i=idx(s),a=P[i],b=P[i+1];return a.u+(b.u-a.u)*(s-a.s)/((b.s-a.s)||1);};
 const finish=+sOfU(FINISH_U).toFixed(2);
 const at=s=>{if(s<=P[0].s){const p=P[0],e=s-p.s;return {x:p.x+Math.cos(p.th)*e,z:p.z+Math.sin(p.th)*e,th:p.th,k:0,W:p.W,ice:false,tun:false,u:p.u+e};}
  if(s>=P[N-1].s){const p=P[N-1],e=s-p.s;return {x:p.x+Math.cos(p.th)*e,z:p.z+Math.sin(p.th)*e,th:p.th,k:0,W:p.W,ice:false,tun:false,u:p.u+e};}
  const i=idx(s),a=P[i],b=P[i+1],t=(s-a.s)/((b.s-a.s)||1);
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,th:a.th+(b.th-a.th)*t,k:a.k+(b.k-a.k)*t,W:a.W+(b.W-a.W)*t,ice:t<.5?a.ice:b.ice,tun:t<.5?a.tun:b.tun,u:a.u+(b.u-a.u)*t};};
 const xz=(s,off=0)=>{const c=at(s),nx=-Math.sin(c.th),nz=Math.cos(c.th);return {x:c.x+nx*off,z:c.z+nz*off,th:c.th,k:c.k};};
 const nearest=makeNearest(P);
 // 블록 → s 자리
 const S=b=>({s0:+sOfU(b.u0).toFixed(2),s1:+sOfU(b.u1).toFixed(2)});
 const jumps=[],boosters=[],obstacles=[],ice=[],tunnels=[],narrows=[],sections=[];
 for(const b of plan.blocks){const r=S(b);sections.push({type:b.type,name:BLOCKS[b.type].name,...r});
  if(b.type==='jump'){const len=b.big?3.2:2.6,h=b.big?1.2:.8,end=sOfU(b.u0+3+len);jumps.push(Object.freeze({s:+end.toFixed(2),h,len,air:b.big?.9:.6,big:!!b.big}));
   if(b.big)boosters.push(Object.freeze({s:+sOfU(b.u0+3+len+10).toFixed(2),off:0,w:1.2,len:2}));}
  if(b.type==='boost')b.offs.forEach((o,k)=>boosters.push(Object.freeze({s:+sOfU(b.u0+2+k*5.5).toFixed(2),off:o,w:1.2,len:2})));
  if(b.type==='forest')for(const o of b.obs)obstacles.push(Object.freeze({s:+sOfU(b.u0+o.du).toFixed(2),off:o.off,kind:o.kind,r:o.kind==='fir'?.45:.5}));
  if(b.type==='ice')ice.push(r);if(b.type==='tunnel')tunnels.push({...r,lights:!!b.lights});if(b.type==='narrow')narrows.push(r);}
 plan.turns.forEach((k,i)=>{const t=TURN_SPANS[i];sections.push({type:'turn',kind:k,name:TURN_KINDS[k].name,s0:+sOfU(t.u0).toFixed(2),s1:+sOfU(t.u1).toFixed(2)});});
 sections.sort((a,b)=>a.s0-b.s0);
 // 구간 기록점: 3번째 줄 끝 굽이 끝 · 5번째 줄 끝 굽이 끝 · 결승
 const checkpoints=Object.freeze([+sOfU(TURN_SPANS[2].u1).toFixed(2),+sOfU(TURN_SPANS[4].u1).toFixed(2),finish]);
 // 길 높이: 뼈대 높이(u) — 길이 옆으로 비켜도 단은 옆으로 평평
 const profileH=s=>heightU(uOfS(s));
 const rampH=s=>{for(const j of jumps){const a=j.s-j.len;if(s>a&&s<=j.s){const t=(s-a)/j.len;return j.h*Math.pow(t,1.25);}}return 0;};
 const widthAt=s=>at(s).W;
 const surfaceAt=s=>{const c=at(s);return c.ice?'ice':c.tun?'tunnel':'snow';};
 const course=Object.freeze({seed:sd,code:courseCode(sd),plan,points:P,end,finish,checkpoints,
  jumps:Object.freeze(jumps),boosters:Object.freeze(boosters.sort((a,b)=>a.s-b.s)),obstacles:Object.freeze(obstacles),
  ice:Object.freeze(ice),tunnels:Object.freeze(tunnels),narrows:Object.freeze(narrows),sections:Object.freeze(sections),
  at,xz,nearest:(x,z,o={})=>nearest(x,z,{...o,key:'s'}),profileH,rampH,widthAt,surfaceAt,uOfS,sOfU,
  onCourse:(x,z,m=0)=>{const a=nearest(x,z,{maxD:WIDE_W,key:'s'});return !!a&&a.d<=at(a.s).W/2+m;}});
 cache.set(sd,course);if(cache.size>24)cache.delete(cache.keys().next().value);
 return course;
}
