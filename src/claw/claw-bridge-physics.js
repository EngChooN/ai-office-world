// 봉 기계 물리(월드개발, 2026-11-23). 월드디자인 설계 v4.1 §7(다리 걸치기 「橋渡し」, 월드리서치 조사): 봉 두 개 위에 상자를 걸쳐 두고
// 힘이 약한 2발 집게로 밀고·걸고·찔러 봉 사이로 떨어뜨린다. 판정 = 물리 그대로(집게 기계 claw-physics.js와 같은 방식: 공 묶음 + 거리 제약, 1/240초).
// three를 쓰지 않는다(node 시험이 그대로 돌림). 단위: 1 = 10cm, 원점 = 유리 상자 바닥 가운데, 앞(손님 쪽) = +z, 위 = +y. 기계 좌표(m) = ×0.1 (+ CLAW.floorY).
// 봉 4개(11-23 대표 사진 2장으로 확인): 모두 x 방향(손님이 보기에 좌우)으로 뻗고 앞뒤로 나란히. 가운데 두 개 = 상자가 걸쳐 앉는 받침 봉, 바깥(앞·뒤) 두 개 = 상자가 밖으로 밀려 나가지 않게 막는 봉.
// 경품 구멍 = 가운데 두 받침 봉 사이 틈만: 틈을 완전히 빠져 봉 아래로 내려가야 성공. 그 밖(받침 봉 바깥·봉 끝 너머)은 받침판(DECK_DROP 아래)이라 떨어져도 구멍이 아님.
// 상자 = 공 16개(모서리 쪽) + 자세용 점 4개(반지름 0, 부딪힘 없음). 처음 자리는 긴 쪽(0.22m)이 앞뒤로 두 받침 봉을 건너게(사진과 같음).
// 봉 자리·구덩이·받침판은 월드아트 claw-bridge-layout.js(bridgeLayout) 하나를 그림·판정이 같이 씀. 사진으로 못 정한 값(막이 봉 간격·받침판 깊이·八자 방향)은 그 파일의 추정값.
// 공유·저장용 상태 = 공 자리 mm 정수(boxState·setBox).
import {CLAW_RIG,U,fingerReach,clawRange} from './claw-physics.js';
import {bridgeLayout,BAR_Y as LAYOUT_BAR_Y,DECK_DROP as LAYOUT_DECK_DROP} from './claw-bridge-layout.js';
export {U};

const G=38,SUB=1/240,ITER=6,SWAY_MAX=.6,SWAY_BACK=.985,SLOW2=(.25*SUB)**2,BACK=12,MU_CLAW_S=.6,MU_CLAW_K=.42;
const TIP_REST=CLAW_RIG.l1*Math.cos(CLAW_RIG.rest)+CLAW_RIG.l2*Math.cos(CLAW_RIG.rest-CLAW_RIG.bend);
// ── 닿음 판정 = 보이는 모양 그대로(대표 지적 2026-11-23 「집게가 상자를 통과」): 예전에는 상자 = 모서리 공 16개라 가운데(폭 약 6cm)가 비어
//  집게발·봉이 상자 속으로 최대 6cm 들어갔다. 이제 상자 = 진짜 직육면체, 집게 = claw-bridge.js buildClaw2가 그리는 납작한 팔·고무 발끝·머리 상자.
//  아래 숫자는 그 파일의 그림 치수(손가락 쪽 좌표, m, 머리 배율 전)와 같다 — 그림을 바꾸면 같이 바꿈(tests/claw-bridge-art.test.mjs가 대조)
export const FINGER_ANGLE_B=Object.freeze({shut:.3,wide:-.57}); // claw-machine-art.js FINGER_ANGLE과 같음
export const FINGER_PIVOT_Z=.03;                                 // 손가락 뿌리 = 머리 가운데에서 바깥으로 0.03
// 판 하나 = 가운데 선분 a→b, 옆(손가락 좌우) 반폭 side, 둥근 두께 r, 세기 몫 f(끝일수록 크게 — 예전 끝 마디 1.3)
export const FINGER_PLATES=Object.freeze([
 {a:[0,0,0],b:[0,-.012,.034],side:.0112,r:.008,f:.4},       // 어깨(관 반지름 .008, 옆으로 2.4배 → 반폭 .0192)
 {a:[0,-.012,.034],b:[0,-.11,.036],side:.0112,r:.008,f:.8},  // 곧은 팔
 {a:[0,-.11,.036],b:[0,-.14,0],side:.0112,r:.008,f:1.3},     // 안으로 꺾인 끝
 {a:[0,-.142,-.011],b:[0,-.142,.003],side:.014,r:.006,f:1.3}, // 고무 발끝(.04 × .012 × .026, 가운데 (0,−.142,−.004))
].map(Object.freeze));
export const HEAD_PLATE=Object.freeze({c:[0,.022,0],half:.0275,side:.0025,r:.0225}); // 머리 상자 .1 × .045 × .05(가운데 y .022)
const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/**
 * 판(가운데 선분 a→b, 옆 반폭 벡터 s, 둥근 두께 r — 상자 틀 좌표)과 상자(가운데 0, 반 치수 h)의 겹침(분리축).
 * 겹치면 {u, d, p}: u = 상자 가운데에서 판 쪽 방향(상자는 −u로 d만큼 밀려야 함), p = 닿는 점(상자 틀 좌표). 안 겹치면 null
 */
export function plateBox(a,b,s,r,h){
 const e=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],m=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
 const axes=[[1,0,0],[0,1,0],[0,0,1]];const E=[[1,0,0],[0,1,0],[0,0,1]];
 for(const q of E){axes.push(cross3(e,q));axes.push(cross3(s,q));}axes.push(cross3(e,s));
 let best=Infinity,bu=null;
 for(const A of axes){const l=Math.hypot(A[0],A[1],A[2]);if(l<1e-6)continue;const u=[A[0]/l,A[1]/l,A[2]/l];
  const ext=Math.abs(dot3(e,u))/2+Math.abs(dot3(s,u))+r,rb=h[0]*Math.abs(u[0])+h[1]*Math.abs(u[1])+h[2]*Math.abs(u[2]),mu=dot3(m,u),ov=ext+rb-Math.abs(mu);
  if(ov<=0)return null;if(ov<best-1e-9){best=ov;bu=mu<0?[-u[0],-u[1],-u[2]]:u;}}
 // 닿는 점: 가운데 판 위 점들(선분은 상자 가까운 토막만 — 긴 봉의 먼 끝을 쓰면 엉뚱한 곳을 밀어 상자가 비틀림) 중 상자 쪽 띠 안에 든 것의 평균
 //  (없으면 가장 깊은 점), 상자 안으로 자름
 const rb=h[0]*Math.abs(bu[0])+h[1]*Math.abs(bu[1])+h[2]*Math.abs(bu[2]);let px=0,py=0,pz=0,n=0,mn=Infinity,mp=null;
 const e2=dot3(e,e)||1,tc=-dot3(a,e)/e2,tw=(Math.hypot(h[0],h[1],h[2])+r)/Math.sqrt(e2),t0=Math.max(0,tc-tw),t1=Math.min(1,tc+tw);
 for(let i=0;i<=4;i++){const t=t1<t0?Math.max(0,Math.min(1,tc)):t0+(t1-t0)*i/4;for(const w of [-1,0,1]){const q=[a[0]+e[0]*t+s[0]*w,a[1]+e[1]*t+s[1]*w,a[2]+e[2]*t+s[2]*w],pr=dot3(q,bu)-r;
  if(pr<mn){mn=pr;mp=q;}if(pr<rb){px+=q[0];py+=q[1];pz+=q[2];n++;}}}
 const p=n?[px/n,py/n,pz/n]:mp;for(let k=0;k<3;k++)p[k]=Math.max(-h[k],Math.min(h[k],p[k]));
 return {u:bu,d:best,p};
}
export const BAR_Y=LAYOUT_BAR_Y,DECK_DROP=LAYOUT_DECK_DROP; // 봉 가운데 높이 24cm, 받침판 = 봉 윗면 12cm 아래(claw-bridge-layout.js)
function rng(seed){let s=seed>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}

/** 기계 치수(CLAW, m)·봉 배치(bars {gap} | {near,far}, m)·조절값(T.bridge) → 물리 치수(단위) */
export function bridgeGeom(C,bars,B){
 const k=1/U,hw=C.width/2-.07,front=C.depth/2-.08,back=-(C.depth/2-.09);
 const BOX={x0:-hw*k,x1:hw*k,z0:back*k,z1:front*k,top:(C.glassTop-C.floorY)*k};
 const L=bridgeLayout(C,bars,B),xl=L.x0,xr=L.x1,near=L.near,far=L.far;
 // 받침 봉 side(−1 뒤, +1 앞)의 가운데 z(x에서) = 배치의 봉 1·2, 막이 봉 = 봉 0·3
 const barZ=(side,x)=>L.barZ(side<0?1:2,x),guardZ=(side,x)=>L.barZ(side<0?0:3,x);
 const HOME={x:C.home[0]*k,z:C.home[1]*k,y:(C.clawTop-C.floorY)*k+TIP_REST};
 const RANGE=clawRange(C,BOX,fingerReach(C,B.clawOpen),'bridge'); // 11-24: 내려가며 벌린 두 발끝(±x)이 유리 안에 머무는 곳만
 const barR=L.barR,deckY=L.deckY,inGap=L.inGap,inPit=L.inPit;
 // 봉 4개 [{z(x), y, a, b}] — 배치 그대로. a·b = 봉 양 끝(단위, 닿음 판정용 선분)
 const rods=L.bars.map(b=>({z:x=>L.barZ(b.i,x),y:b.a[1],kind:b.role,a:b.a,b:b.b}));
 // 그림 집게 치수 → 단위: 머리 배율(clawTip/0.14), 머리 가운데 = 물리 집게 가운데 + (clawTip − 쉼 자세 끝 깊이)
 const rig={scale:C.clawTip/.14*k,headUp:C.clawTip*k-TIP_REST};
 return {BOX,HOME,RANGE,barR,barY:L.barY,deckY,xl,xr,barZ,guardZ,rods,inGap,inPit,near,far,layout:L,floorY:C.floorY,rig};
}
/** 상자 공 묶음(단위). box = [폭(z), 높이, 길이(x)] m */
export function boxParts(box){
 const k=1/U,w=box[0]*k,h=box[1]*k,l=box[2]*k,r=h/4,parts=[];
 // 0 = 가운데, 1 = 위, 2·3 = 좌우(자세용, 반지름 0)
 parts.push([0,0,0,0],[0,h*.4,0,0],[-l*.36,0,0,0],[l*.36,0,0,0]);
 for(let i=0;i<4;i++)for(const y of [-1,1])for(const z of [-1,1])parts.push([-(l/2-r)+i*(l-2*r)/3,y*(h/2-r),z*(w/2-r),r]);
 return {parts,half:[l/2,h/2,w/2],r};
}

/**
 * 봉 기계 하나. geom = bridgeGeom(…), box = T.bridge.box, mass = 상자 무게(희귀 1.2), power = {grab, carry}(약한 집게), prongs = 2
 * pose = {x,z,yaw}(단위·rad, 처음 자리) 또는 st(boxState 값, 이어서 할 때)
 */
export function createBridgeSim({geom,box,mass=1,power={grab:.0012,carry:.001},seed=7,pose=null,st=null,friction=.35,openTo=.82,prewarm=3}){
 const {BOX,HOME,RANGE,barR,barY,xl,xr,barZ,rods,deckY,inGap,inPit}=geom,CL=CLAW_RIG,R=rng(seed);
 const {parts,half}=boxParts(box),N=parts.length,P={x:new Float64Array(N),y:new Float64Array(N),z:new Float64Array(N),ox:new Float64Array(N),oy:new Float64Array(N),oz:new Float64Array(N)};
 const w=1/(mass*10/16),cons=[];
 // yaw π/2 = 긴 쪽이 앞뒤(두 받침 봉을 건넘)
 const place=({x=0,z=0,yaw=Math.PI/2,y=barY+barR+half[1]+.02})=>{const c=Math.cos(yaw),s=Math.sin(yaw);
  parts.forEach(([lx,ly,lz],i)=>{P.x[i]=P.ox[i]=x+lx*c+lz*s;P.y[i]=P.oy[i]=y+ly;P.z[i]=P.oz[i]=z-lx*s+lz*c;});};
 place(pose??{});
 for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)cons.push([i,j,Math.hypot(parts[i][0]-parts[j][0],parts[i][1]-parts[j][1],parts[i][2]-parts[j][2])]);
 // 가장 낮은 높이(11-24): 내려가며 벌린 발끝(FINGER_PLATES 고무 끝)이 봉 위 상자 바닥 + 3.5cm보다 내려가지 않음(2cm면 아직 7판 중 1~3판 들고 감). 커진 집게(0.24m·넓게 벌림)는 예전 높이(봉 + 1.35)면
 //  발끝이 상자 바닥 4cm 아래까지 내려가 상자 밑을 받쳐 들었다(약한 집게 규칙이 깨짐). 실제 기계도 봉 위 상자 밑으로는 발이 못 들어감
 //  조이는 동안 발끝은 호를 그리며 손가락이 곧게 설 때(각 0) 가장 낮아짐 → 그 높이 기준
 const bottomStop=()=>{const S=geom.rig.scale,F=FINGER_PLATES[3],tipY=-(Math.hypot(F.a[1],F.a[2])+F.r)*S; // 머리 가운데 기준 발끝 아래 끝이 가장 낮을 때(단위)
  return barY+barR+.35-geom.rig.headUp-tipY;};
 const prongs=2,claw={x:HOME.x,y:HOME.y,z:HOME.z,th:[CL.rest,CL.rest],ang:[0,Math.PI],state:'idle',t:0,pen:[0,0],hubPen:0,resid:0,sway:[0,0,0],power:{...power},strength:0,touched:false,liftFrom:0,
  minY:Math.max(barY+1.35,bottomStop()),openTo}; // openTo = 내려갈 때 벌림(물리 각, T.bridge.clawOpen. 11-24부터 각 그대로 — 전에는 0.9 = CL.open 0.6)
 // 집게 판들(단위, 세계 좌표): 손가락 k마다 FINGER_PLATES 4장 + 머리 1장. [ax,ay,az, bx,by,bz, sx,sy,sz, r, k(머리 −1), f]
 // 그림 각도 = FINGER_ANGLE_B.shut + 벌림(0~1, clawPose opens와 같은 식) × (wide − shut). 손가락 0 = +x, 1 = −x(claw-bridge.js 그림 순서)
 const RG=geom.rig;
 const openOf=k=>Math.max(0,Math.min(1,(claw.th[k]-CL.closed)/(CL.splay-CL.closed)));
 const buildPlates=out=>{out.length=0;const S=RG.scale,o=claw.sway,hx=claw.x+o[0],hy=claw.y+RG.headUp+o[1],hz=claw.z+o[2];
  for(let k=0;k<prongs;k++){const sg=k===0?1:-1,an=FINGER_ANGLE_B.shut+openOf(k)*(FINGER_ANGLE_B.wide-FINGER_ANGLE_B.shut),ca=Math.cos(an),sa=Math.sin(an);
   // 손가락 쪽 (y,z) → 돌림 → 바깥(z) = 세계 sg·x, 손가락 옆(x) = 세계 z
   const W=([,y,z])=>{const y1=y*ca-z*sa,z1=y*sa+z*ca+FINGER_PIVOT_Z;return [hx+sg*z1*S,hy+y1*S,hz];};
   for(const F of FINGER_PLATES){const A=W(F.a),B=W(F.b);out.push([A[0],A[1],A[2],B[0],B[1],B[2],0,0,F.side*S,F.r*S,k,F.f]);}}
  const H=HEAD_PLATE;out.push([hx-H.half*S,hy+H.c[1]*S,hz,hx+H.half*S,hy+H.c[1]*S,hz,0,0,H.side*S,H.r*S,-1,0]);
  return out;};
 let prevSegs=buildPlates([]),curSegs=[],prevHub=[claw.x,claw.y,claw.z],sleep=false,still=0,won=false,gone=false;
 const events=[];
 const center=()=>{let x=0,y=0,z=0;for(let i=4;i<N;i++){x+=P.x[i];y+=P.y[i];z+=P.z[i];}const n=N-4;return [x/n,y/n,z/n];};
 // 봉 4개(x 방향 선분 + 반지름): 집게발 끝이 봉에 닿았나(내려가기 멈춤)
 const rodDist=(R2,px,py,pz)=>{const x=Math.max(xl,Math.min(xr,px)),dx=px-x,dy=py-R2.y,dz=pz-R2.z(x);return [dx,dy,dz,Math.hypot(dx,dy,dz)];};
 // 바닥·벽·받침판(평면) = 모서리 공으로(공 아랫면 = 상자 아랫면)
 function contact(i,nx,ny,nz,d,mvx,mvy,mvz,muS,muK){
  P.x[i]+=nx*d;P.y[i]+=ny*d;P.z[i]+=nz*d;
  let rx=P.x[i]-P.ox[i]-mvx,ry=P.y[i]-P.oy[i]-mvy,rz=P.z[i]-P.oz[i]-mvz;const rn=rx*nx+ry*ny+rz*nz;rx-=rn*nx;ry-=rn*ny;rz-=rn*nz;
  const rt=Math.hypot(rx,ry,rz);if(rt<1e-9)return;const k=rt<muS*d?1:Math.min(1,muK*d/rt);P.x[i]-=rx*k;P.y[i]-=ry*k;P.z[i]-=rz*k;
 }
 // ── 봉·집게 ↔ 상자 = 직육면체 판정 + 통째(강체) 밀기. 닿는 점에서 밀면 상자가 밀리고 돌아감(가운데에서 멀리 밀수록 더 돎)
 const MP=1/w,MT=N*MP;
 function frameOf(X,Y,Z){const c=[X[0],Y[0],Z[0]];let L=[X[3]-X[2],Y[3]-Y[2],Z[3]-Z[2]],l=Math.hypot(L[0],L[1],L[2])||1;L=[L[0]/l,L[1]/l,L[2]/l];
  let H=[X[1]-X[0],Y[1]-Y[0],Z[1]-Z[0]];const k=dot3(H,L);H=[H[0]-k*L[0],H[1]-k*L[1],H[2]-k*L[2]];l=Math.hypot(H[0],H[1],H[2])||1;H=[H[0]/l,H[1]/l,H[2]/l];
  return {c,ax:[L,H,cross3(L,H)]};}
 const toLoc=(F,p)=>{const d=[p[0]-F.c[0],p[1]-F.c[1],p[2]-F.c[2]];return [dot3(d,F.ax[0]),dot3(d,F.ax[1]),dot3(d,F.ax[2])];};
 const dirLoc=(F,d)=>[dot3(d,F.ax[0]),dot3(d,F.ax[1]),dot3(d,F.ax[2])];
 const dirW=(F,l)=>{const A=F.ax;return [l[0]*A[0][0]+l[1]*A[1][0]+l[2]*A[2][0],l[0]*A[0][1]+l[1]*A[1][1]+l[2]*A[2][1],l[0]*A[0][2]+l[1]*A[1][2]+l[2]*A[2][2]];};
 const toW=(F,l)=>{const d=dirW(F,l);return [F.c[0]+d[0],F.c[1]+d[1],F.c[2]+d[2]];};
 let cm=[0,0,0],Ii=null,oldF=null,lastN=[0,0,0];
 function massProps(){let x=0,y=0,z=0;for(let i=0;i<N;i++){x+=P.x[i];y+=P.y[i];z+=P.z[i];}cm=[x/N,y/N,z/N];
  let a=0,b=0,c=0,d=0,e=0,f=0;for(let i=0;i<N;i++){const X=P.x[i]-cm[0],Y=P.y[i]-cm[1],Z=P.z[i]-cm[2];a+=Y*Y+Z*Z;b+=X*X+Z*Z;c+=X*X+Y*Y;d-=X*Y;e-=X*Z;f-=Y*Z;}
  const I=[[a*MP,d*MP,e*MP],[d*MP,b*MP,f*MP],[e*MP,f*MP,c*MP]];
  const A=I[1][1]*I[2][2]-I[1][2]*I[2][1],B=I[1][2]*I[2][0]-I[1][0]*I[2][2],C=I[1][0]*I[2][1]-I[1][1]*I[2][0],det=I[0][0]*A+I[0][1]*B+I[0][2]*C;
  Ii=[[A/det,(I[0][2]*I[2][1]-I[0][1]*I[2][2])/det,(I[0][1]*I[1][2]-I[0][2]*I[1][1])/det],
   [B/det,(I[0][0]*I[2][2]-I[0][2]*I[2][0])/det,(I[0][2]*I[1][0]-I[0][0]*I[1][2])/det],
   [C/det,(I[0][1]*I[2][0]-I[0][0]*I[2][1])/det,(I[0][0]*I[1][1]-I[0][1]*I[1][0])/det]];}
 const mul=(M,v)=>[M[0][0]*v[0]+M[0][1]*v[1]+M[0][2]*v[2],M[1][0]*v[0]+M[1][1]*v[1]+M[1][2]*v[2],M[2][0]*v[0]+M[2][1]*v[1]+M[2][2]*v[2]];
 // 상자 위 점 p를 n 방향으로 mag만큼 옮기는 통째 밀기(무게·돌림 무게 나눔)
 function rigid(p,n,mag){const r=[p[0]-cm[0],p[1]-cm[1],p[2]-cm[2]],rn=cross3(r,n),q=mul(Ii,rn),lam=mag/(1/MT+dot3(rn,q));
  const dc=[n[0]*lam/MT,n[1]*lam/MT,n[2]*lam/MT],dt=[q[0]*lam,q[1]*lam,q[2]*lam];
  for(let i=0;i<N;i++){const X=P.x[i]-cm[0],Y=P.y[i]-cm[1],Z=P.z[i]-cm[2];P.x[i]+=dc[0]+dt[1]*Z-dt[2]*Y;P.y[i]+=dc[1]+dt[2]*X-dt[0]*Z;P.z[i]+=dc[2]+dt[0]*Y-dt[1]*X;}
  cm=[cm[0]+dc[0],cm[1]+dc[1],cm[2]+dc[2]];}
 // 판 하나와 상자: 겹치면 상자를 밀어내고 마찰(mvOf(p) = 판의 그 점이 이번 칸에 움직인 양). 밀어낸 깊이를 돌려줌(probe면 밀지 않고 깊이만)
 function hitPlate(A,B,S,r,mvOf,muS,muK,probe=false){
  const F=frameOf(P.x,P.y,P.z),H=plateBox(toLoc(F,A),toLoc(F,B),dirLoc(F,S),r,half);if(!H)return 0;if(probe){lastN=dirW(F,[-H.u[0],-H.u[1],-H.u[2]]);return H.d;}
  const n=dirW(F,[-H.u[0],-H.u[1],-H.u[2]]),p=toW(F,H.p);rigid(p,n,H.d);
  const pn=toW(frameOf(P.x,P.y,P.z),H.p),pp=toW(oldF,H.p),mv=mvOf(p);
  let rx=pn[0]-pp[0]-mv[0],ry=pn[1]-pp[1]-mv[1],rz=pn[2]-pp[2]-mv[2];const rn=rx*n[0]+ry*n[1]+rz*n[2];rx-=rn*n[0];ry-=rn*n[1];rz-=rn*n[2];
  const rt=Math.hypot(rx,ry,rz);if(rt>1e-9){const k=rt<muS*H.d?1:Math.min(1,muK*H.d/rt);rigid(pn,[-rx/rt,-ry/rt,-rz/rt],rt*k);}
  return H.d;}
 const ZERO=[0,0,0],still0=()=>ZERO;
 // 판 S의 점 p 근처가 이번 칸에 움직인 양(이전 판 Q의 같은 자리 비율)
 const plateMv=(S,Q)=>p=>{const ex=S[3]-S[0],ey=S[4]-S[1],ez=S[5]-S[2],L2=ex*ex+ey*ey+ez*ez||1;let t=((p[0]-S[0])*ex+(p[1]-S[1])*ey+(p[2]-S[2])*ez)/L2;t=Math.max(0,Math.min(1,t));
  return [S[0]+ex*t-(Q[0]+(Q[3]-Q[0])*t),S[1]+ey*t-(Q[1]+(Q[4]-Q[1])*t),S[2]+ez*t-(Q[2]+(Q[5]-Q[2])*t)];};
 // 집게발 판이 봉을 파고든 깊이(봉 = x 방향 선, 손가락은 x·y 평면에서 움직이고 옆폭은 z) — 봉을 뚫고 오므리지 못하게
 function rodBite(S){let m=0;for(const R2 of rods){const zr=R2.z((S[0]+S[3])/2),dz=Math.max(0,Math.abs(zr-S[2])-Math.abs(S[8]));
   const y0=Math.min(S[1],S[4]),y1=Math.max(S[1],S[4]),dy=R2.y<y0?y0-R2.y:R2.y>y1?R2.y-y1:0,d=S[9]+barR-Math.hypot(dy,dz);if(d>m)m=d;}return m;}
 function wake(){sleep=false;still=0;}
 function clawLogic(h){
  const c=claw;c.t+=h;
  const toward=(k,target,rate)=>{const d=target-c.th[k];c.th[k]+=Math.sign(d)*Math.min(Math.abs(d),rate*h);};
  switch(c.state){
   case 'idle':case 'done':case 'move':for(let k=0;k<prongs;k++)toward(k,CL.rest,1.5);break;
   case 'drop':{
    for(let k=0;k<prongs;k++)toward(k,c.openTo,2.2);
    if(c.t<.45)break;
    c.y-=2.6*h;
    // 닿으면 멈춤(줄이 느슨해짐): 상자를 누른 힘·머리 닿음·못 밀어낸 겹침(상자가 봉에 눌려 꼼짝 못 함)
    if(c.hubPen>.012||c.pen[0]+c.pen[1]>.06||c.resid>.015)c.touched=true;
    // 집게발 끝이 봉에 닿으면 멈춤(봉을 뚫고 내려가지 않게)
    for(let s=3;s<curSegs.length;s+=FINGER_PLATES.length){const S=curSegs[s];for(const R2 of rods)for(const j of [0,3])if(rodDist(R2,S[j],S[j+1],S[j+2])[3]<barR+S[9]+.02)c.touched=true;}
    if(c.y<=c.minY||c.touched&&c.t>.6){c.y=Math.max(c.y,c.minY)+c.resid;c.state='close';c.t=0;c.strength=c.power.grab;events.push({type:'close'});}
    break;}
   case 'close':for(let k=0;k<prongs;k++)c.th[k]-=1.25*h;if(c.t>1.0){c.state='lift';c.t=0;c.liftFrom=c.y;events.push({type:'lift'});}break;
   case 'lift':for(let k=0;k<prongs;k++)c.th[k]-=1.25*h;if(c.t>.35)c.y+=2.2*h;if(c.y-c.liftFrom>1.2)c.strength=c.power.carry;if(c.y>=HOME.y){c.y=HOME.y;c.state='carry';c.t=0;}break;
   case 'carry':{for(let k=0;k<prongs;k++)c.th[k]-=1.25*h;const hx=Math.max(RANGE.x0,Math.min(RANGE.x1,HOME.x)),hz=Math.max(RANGE.z0,Math.min(RANGE.z1,HOME.z)),dx=hx-c.x,dz=hz-c.z,d=Math.hypot(dx,dz),sp=1.5*h; // 처음 자리(범위 안, 11-24)로
    if(d<=sp){c.x=hx;c.z=hz;c.state='release';c.t=0;events.push({type:'release'});}else{c.x+=dx/d*sp;c.z+=dz/d*sp;}break;}
   case 'release':for(let k=0;k<prongs;k++)toward(k,c.openTo,2.5);if(c.t>1.0){c.state='done';c.t=0;events.push({type:'done'});}break;
  }
  for(let k=0;k<prongs;k++)c.th[k]=Math.max(CL.closed,Math.min(c.state==='close'||c.state==='lift'||c.state==='carry'?CL.splay:c.state==='drop'||c.state==='release'?Math.max(CL.open,c.openTo):CL.open,c.th[k]));
 }
 function sub(){
  const h=SUB;clawLogic(h);curSegs=buildPlates(curSegs.length?curSegs:[]);
  const busy=claw.state!=='idle'&&claw.state!=='move'&&claw.state!=='done',touch=busy||claw.state==='done'; // touch(11-24): 판이 끝난 뒤(done)에도 닿음 계산 — 커진 집게가 상자를 들고 온 채 끝나면 겹쳐 보였음. 잠들기·깨우기는 busy 그대로(멈춘 상자를 저장하게)
  if(gone)return;
  const [cx,cy,cz]=center();
  if(sleep&&busy&&Math.abs(cx-claw.x)<half[0]+2.2&&Math.abs(cz-claw.z)<half[0]+2.2)wake();
  if(!sleep)for(let i=0;i<N;i++){
   let vx=P.x[i]-P.ox[i],vy=P.y[i]-P.oy[i],vz=P.z[i]-P.oz[i];const v2=vx*vx+vy*vy+vz*vz,damp=v2<SLOW2?.6:.998;vx*=damp;vy*=damp;vz*=damp;
   P.ox[i]=P.x[i];P.oy[i]=P.y[i];P.oz[i]=P.z[i];P.x[i]+=vx;P.y[i]+=vy-G*h*h;P.z[i]+=vz;}
  claw.pen[0]=claw.pen[1]=0;claw.hubPen=0;
  oldF=frameOf(P.ox,P.oy,P.oz);
  for(let it=0;it<ITER;it++){
   if(!sleep)for(const [a,b,L] of cons){const dx=P.x[b]-P.x[a],dy=P.y[b]-P.y[a],dz=P.z[b]-P.z[a],l=Math.hypot(dx,dy,dz)||1e-9,s=(l-L)/l/2;
    P.x[a]+=dx*s;P.y[a]+=dy*s;P.z[a]+=dz*s;P.x[b]-=dx*s;P.y[b]-=dy*s;P.z[b]-=dz*s;}
   if(!sleep)for(let i=4;i<N;i++){const r=parts[i][3];
    if(P.y[i]<r)contact(i,0,1,0,r-P.y[i],0,0,0,.55,.4);
    // 받침판(구덩이 밖): deckY가 바닥. 구덩이(봉 아래 뚫린 곳) 안은 구덩이 바닥(y 0)까지
    if(!inPit(P.x[i],P.z[i])&&P.y[i]<deckY+r&&P.y[i]>deckY-1.2)contact(i,0,1,0,deckY+r-P.y[i],0,0,0,.55,.4);
    if(P.x[i]<BOX.x0+r)contact(i,1,0,0,BOX.x0+r-P.x[i],0,0,0,.3,.2);
    if(P.x[i]>BOX.x1-r)contact(i,-1,0,0,P.x[i]-(BOX.x1-r),0,0,0,.3,.2);
    if(P.z[i]<BOX.z0+r)contact(i,0,0,1,BOX.z0+r-P.z[i],0,0,0,.3,.2);
    if(P.z[i]>BOX.z1-r)contact(i,0,0,-1,P.z[i]-(BOX.z1-r),0,0,0,.3,.2);}
   massProps();
   // 집게(머리·팔·발끝): 닿으면 상자를 밀고 끌고(마찰), 미는 깊이 = 집게가 받는 힘(약한 집게는 힘이 넘으면 벌어짐)
   for(let s=0;s<curSegs.length;s++){const S=curSegs[s];
    if(sleep&&hitPlate([S[0],S[1],S[2]],[S[3],S[4],S[5]],[S[6],S[7],S[8]],S[9],still0,0,0,true)>0)wake();
    const d=hitPlate([S[0],S[1],S[2]],[S[3],S[4],S[5]],[S[6],S[7],S[8]],S[9],plateMv(S,prevSegs[s]||S),MU_CLAW_S,MU_CLAW_K);
    if(it===0&&d>0){if(S[10]<0)claw.hubPen=Math.max(claw.hubPen,d);else claw.pen[S[10]]+=d/(w*2)*S[11];}}
   // 봉(마지막 = 상자가 봉을 뚫지 않는 것이 우선)
   if(!sleep)for(const R2 of rods)hitPlate(R2.a,R2.b,ZERO,barR,still0,friction,friction*.8);
  }
  // 봉을 한 번 더(집게와 봉 사이에 끼면 봉이 이김 — 상자는 봉을 뚫지 않고, 남은 겹침은 집게가 물러나서 푼다)
  if(!sleep)for(let j=0;j<6;j++){massProps();for(const R2 of rods)hitPlate(R2.a,R2.b,ZERO,barR,still0,0,0);}
  // 못 밀어낸 겹침(상자가 봉에 끼어 집게를 못 피함): 내려가기 멈춤·그 발 벌어짐에 씀
  claw.resid=0;const rk=[0,0],nk=[[0,0,0],[0,0,0]];if(touch)for(const S of curSegs){const d=hitPlate([S[0],S[1],S[2]],[S[3],S[4],S[5]],[S[6],S[7],S[8]],S[9],still0,0,0,true);claw.resid=Math.max(claw.resid,d);if(S[10]>=0&&d>rk[S[10]]){rk[S[10]]=d;nk[S[10]]=lastN;}}
  if(claw.state==='close'||claw.state==='lift'||claw.state==='carry')for(let k=0;k<prongs;k++){
   // 힘이 넘거나(상자가 무거움·꽉 막힘) 봉에 걸리면 그 발이 벌어짐
   let bite=0;for(let s=k*FINGER_PLATES.length;s<(k+1)*FINGER_PLATES.length;s++)bite=Math.max(bite,rodBite(curSegs[s]));
   const over=claw.pen[k]-claw.strength+bite*4;if(over>0)claw.th[k]=Math.min(CL.splay,claw.th[k]+Math.min(1.25*SUB*4,over*BACK));}
  // 끼어서 못 밀어낸 발은 경첩이라 밀리는 쪽으로 젖혀짐: 상자가 발 바깥에 끼었으면 안으로(오므림), 안쪽·위에서 누르면 밖으로(벌어짐) — 상자를 뚫지 않게
  if(busy)for(let k=0;k<prongs;k++){if(rk[k]<.003)continue;const out=(k===0?1:-1)*nk[k][0],stp=Math.min(1.25*SUB*6,rk[k]*.6);
   claw.th[k]=Math.max(CL.closed,Math.min(CL.splay,claw.th[k]+(out>.3?-stp:stp)));}
  if(!sleep){let m=0;for(let i=4;i<N;i++)m=Math.max(m,Math.abs(P.x[i]-P.ox[i])+Math.abs(P.y[i]-P.oy[i])+Math.abs(P.z[i]-P.oz[i]));
   if(m<.35*SUB&&!busy){still+=SUB;if(still>.6)sleep=true;}else still=0;}
  const y=center()[1];
  // 성공 = 틈을 완전히 빠짐: 가운데가 봉 아래로 상자 높이만큼 내려감(받침판 위 상자는 가운데가 받침판 + 반 높이라 여기 못 옴)
  // 두 받침 봉 사이(가운데가 받침 봉 둘 사이)로 빠진 것만 — 받침·막이 봉 사이 좁은 틈으로 끼어 내려간 것은 성공 아님(막힘으로 처리)
  if(!won&&y<barY-half[1]*2-barR){const c=center();if(c[2]>barZ(-1,c[0])&&c[2]<barZ(1,c[0])){won=true;events.push({type:'won'});}}
  if(won&&y<half[1]+.3&&!gone){still+=SUB;if(still>.5)gone=true;}
  // 그래도 남은 겹침은 줄에 매달린 집게가 상자에 밀려 살짝 비켜 흔들림(최대 SWAY_MAX, 닿지 않으면 천천히 제자리로)
  {const o=claw.sway;let pushed=false;
   if(touch)for(let pass=0;pass<3;pass++){let dm=0,nm=null;curSegs=buildPlates(curSegs);for(const S of curSegs){const d=hitPlate([S[0],S[1],S[2]],[S[3],S[4],S[5]],[S[6],S[7],S[8]],S[9],still0,0,0,true);if(d>dm){dm=d;nm=lastN;}}
    if(dm<.002)break;pushed=true;o[0]-=nm[0]*dm;o[1]-=nm[1]*dm;o[2]-=nm[2]*dm;const l=Math.hypot(o[0],o[1],o[2]);if(l>SWAY_MAX){o[0]*=SWAY_MAX/l;o[1]*=SWAY_MAX/l;o[2]*=SWAY_MAX/l;}}
   if(!pushed){o[0]*=SWAY_BACK;o[1]*=SWAY_BACK;o[2]*=SWAY_BACK;}}
  // 다음 칸 마찰은 집게가 스스로 움직인 만큼만(상자에 밀려 벌어지거나 젖혀진 발은 상자를 끌고 가지 않음)
  prevSegs=buildPlates(prevSegs);
  prevHub=[claw.x,claw.y,claw.z];
 }
 const sim={P,parts,claw,events,geom,half,
  setPos(x,z){claw.x=Math.max(RANGE.x0,Math.min(RANGE.x1,x));claw.z=Math.max(RANGE.z0,Math.min(RANGE.z1,z));},
  start(){claw.state='move';claw.t=0;sim.setPos(HOME.x,HOME.z);claw.y=HOME.y;}, // 처음 자리 = 구멍 위를 범위 안으로(11-24)
  drop(){if(claw.state!=='move')return false;claw.state='drop';claw.t=0;claw.touched=false;return true;},
  step(dt){const n=Math.min(12,Math.round(dt/SUB));for(let i=0;i<n;i++)sub();},
  settle(sec){for(let i=0;i<sec/SUB;i++)sub();},
  get won(){return won;},get gone(){return gone;},get sleeping(){return sleep;},
  center,
  /** 집게 그림 값(기계 좌표 m) — 집게 기계와 같은 꼴, opens = 집게발 둘 */
  clawPose(){const o=k=>Math.max(0,Math.min(1,(claw.th[k]-CL.closed)/(CL.splay-CL.closed)));const opens=[o(0),o(1)];
   return {x:(claw.x+claw.sway[0])*U,z:(claw.z+claw.sway[2])*U,drop:Math.max(0,(HOME.y-claw.y-claw.sway[1])*U),open:(opens[0]+opens[1])/2,opens};},
  /** 상자 자세(그림용): p = 가운데(단위), up·side = 위·좌우 방향, lup·lside = 처음 방향 */
  frame(){return {p:center(),up:[P.x[1]-P.x[0],P.y[1]-P.y[0],P.z[1]-P.z[0]],side:[P.x[3]-P.x[2],P.y[3]-P.y[2],P.z[3]-P.z[2]],
   lup:[parts[1][0]-parts[0][0],parts[1][1]-parts[0][1],parts[1][2]-parts[0][2]],lside:[parts[3][0]-parts[2][0],parts[3][1]-parts[2][1],parts[3][2]-parts[2][2]]};},
  /** 기울기(도): 상자 위 방향과 수직의 각 */
  tilt(){const ux=P.x[1]-P.x[0],uy=P.y[1]-P.y[0],uz=P.z[1]-P.z[0];return Math.acos(Math.max(-1,Math.min(1,uy/Math.hypot(ux,uy,uz))))*180/Math.PI;},
  /** 돌아간 각(도, 위에서 본 좌우 방향) */
  yaw(){return Math.atan2(-(P.z[3]-P.z[2]),P.x[3]-P.x[2])*180/Math.PI;},
  /** 받침 여유(m): 상자가 앞·뒤 받침 봉 바깥으로 나온 길이 중 작은 것(0 아래면 한쪽 받침 봉에서 벗어남) */
  support(){const x=center()[0];let lo=Infinity,hi=-Infinity;for(let i=4;i<N;i++){const r=parts[i][3];lo=Math.min(lo,P.z[i]-r);hi=Math.max(hi,P.z[i]+r);}
   return Math.min(hi-barZ(1,x),barZ(-1,x)-lo)*U;},
  /** 집게가 닿는 범위 밖(막힘 판정): 상자 가운데가 집게 범위 + 상자 반 길이 밖 */
  outOfReach(){const [x,,z]=center();return x<RANGE.x0-half[0]||x>RANGE.x1+half[0]||z<RANGE.z0-half[0]||z>RANGE.z1+half[0];},
  /** 저장·공유용 상태: 공 자리(mm 정수, x·y·z 차례) */
  boxState(){const out=[];for(let i=0;i<N;i++)out.push(Math.round(P.x[i]*100),Math.round(P.y[i]*100),Math.round(P.z[i]*100));return out;},
  /** 저장해 둔 상태로 놓기(멈춘 채, 작은 어긋남은 제약이 다시 맞춤). 모양이 다르면 false */
  setBox(s){if(!Array.isArray(s)||s.length!==N*3)return false;for(let i=0;i<N;i++){P.x[i]=P.ox[i]=s[i*3]/100;P.y[i]=P.oy[i]=s[i*3+1]/100;P.z[i]=P.oz[i]=s[i*3+2]/100;}
   won=false;gone=false;wake();sim.settle(.4);return true;},
 };
 if(st&&sim.setBox(st)){}else sim.settle(prewarm);
 events.length=0;
 return sim;
}
/** 새 상자 처음 자리(공정 범위 안에서 조금씩 다르게, v4.1 §1-2): 가운데 ±startJitterM, 돌림 ±startJitterDeg. rnd = 0~1 난수 */
export function startPose(B,rnd=Math.random){return {x:(rnd()*2-1)*B.startJitterM/U,z:(rnd()*2-1)*B.startJitterM/U,yaw:Math.PI/2+(rnd()*2-1)*B.startJitterDeg*Math.PI/180};}
/** 막이 봉 밖으로 나갔거나 봉 아래로 끼었나(판 끝나면 바로 처음 자리, 대표 2026-11-23) — geom = bridgeGeom */
export const offRails=(sim,geom)=>{const c=sim.center();return !sim.won&&(Math.abs(c[2])>geom.layout.guardZ||c[1]<geom.barY-1);};
/** 기계 상태 「아슬아슬」(v4.1 §5-1): 받침 여유 nearSupportM 이하(이미 떨어진 상자는 아님). 기울기 조건은 뺌 — 막이 봉에 기대 늘 20° 넘게 기울어 83% 판에서 켜졌음(월드디자인 2026-11-23) */
export const nearState=(sim,B)=>!sim.won&&sim.support()<=B.nearSupportM;
/** 한 판 결과: 떨어짐 = win, 받침 여유가 nearSupportM 이하로 이번 판에 새로 들어감 = near(아까움), 나머지 = miss */
export function bridgeOutcome(sim,before,B){
 if(sim.won)return 'win';
 return before.support>B.nearSupportM&&sim.support()<=B.nearSupportM?'near':'miss';
}
/** 판 전 기록(결과·진척 판정용) */
export const bridgeSnap=sim=>({c:sim.center(),tilt:sim.tilt(),yaw:sim.yaw(),support:sim.support()});
/** 진척 없는 판인가(v4.1 §6-1 막힘): 받침 변화 stuckMoveM 아래·기울기 stuckTiltDeg 아래 */
export const noProgress=(sim,before,S)=>Math.abs(sim.support()-before.support)<S.stuckMoveM&&Math.abs(sim.tilt()-before.tilt)<S.stuckTiltDeg&&Math.hypot(sim.center()[0]-before.c[0],sim.center()[2]-before.c[2])*U<S.stuckMoveM*2;

/** 판 하나를 끝까지(시험·점검용): 집게를 (x,z)에 두고 내림 → {won, kind} */
export function runBridgeDrop(sim,x,z,B,maxSec=14){
 const before=bridgeSnap(sim);sim.start();sim.setPos(x,z);sim.drop();
 for(let t=0;t<maxSec&&sim.claw.state!=='done';t+=1/30)sim.step(1/30);
 for(let t=0;t<1.2;t+=1/30)sim.step(1/30);
 sim.events.length=0;return {won:sim.won,kind:bridgeOutcome(sim,before,B)};
}
