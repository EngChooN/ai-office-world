// 봉 기계 물리(월드개발, 2026-11-23). 월드디자인 설계 v4.1 §7(다리 걸치기 「橋渡し」, 월드리서치 조사): 봉 두 개 위에 상자를 걸쳐 두고
// 힘이 약한 2발 집게로 밀고·걸고·찔러 봉 사이로 떨어뜨린다. 판정 = 물리 그대로(집게 기계 claw-physics.js와 같은 방식: 공 묶음 + 거리 제약, 1/240초).
// three를 쓰지 않는다(node 시험이 그대로 돌림). 단위: 1 = 10cm, 원점 = 유리 상자 바닥 가운데, 앞(손님 쪽) = +z, 위 = +y. 기계 좌표(m) = ×0.1 (+ CLAW.floorY).
// 봉 4개(11-23 대표 사진 2장으로 확인): 모두 x 방향(손님이 보기에 좌우)으로 뻗고 앞뒤로 나란히. 가운데 두 개 = 상자가 걸쳐 앉는 받침 봉, 바깥(앞·뒤) 두 개 = 상자가 밖으로 밀려 나가지 않게 막는 봉.
// 경품 구멍 = 가운데 두 받침 봉 사이 틈만: 틈을 완전히 빠져 봉 아래로 내려가야 성공. 그 밖(받침 봉 바깥·봉 끝 너머)은 받침판(DECK_DROP 아래)이라 떨어져도 구멍이 아님.
// 상자 = 공 16개(모서리 쪽) + 자세용 점 4개(반지름 0, 부딪힘 없음). 처음 자리는 긴 쪽(0.22m)이 앞뒤로 두 받침 봉을 건너게(사진과 같음).
// 봉 자리·구덩이·받침판은 월드아트 claw-bridge-layout.js(bridgeLayout) 하나를 그림·판정이 같이 씀. 사진으로 못 정한 값(막이 봉 간격·받침판 깊이·八자 방향)은 그 파일의 추정값.
// 공유·저장용 상태 = 공 자리 mm 정수(boxState·setBox).
import {CLAW_RIG,U} from './claw-physics.js';
import {bridgeLayout,BAR_Y as LAYOUT_BAR_Y,DECK_DROP as LAYOUT_DECK_DROP} from './claw-bridge-layout.js';
export {U};

const G=38,SUB=1/240,ITER=6,SLOW2=(.25*SUB)**2,BACK=12,MU_CLAW_S=.6,MU_CLAW_K=.42;
const TIP_REST=CLAW_RIG.l1*Math.cos(CLAW_RIG.rest)+CLAW_RIG.l2*Math.cos(CLAW_RIG.rest-CLAW_RIG.bend);
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
 const RANGE={x0:C.play.x[0]*k,x1:C.play.x[1]*k,z0:C.play.z[0]*k,z1:C.play.z[1]*k};
 const barR=L.barR,deckY=L.deckY,inGap=L.inGap,inPit=L.inPit;
 // 봉 4개 [{z(x), y}] — 배치 그대로(모두 같은 높이)
 const rods=L.bars.map(b=>({z:x=>L.barZ(b.i,x),y:b.a[1],kind:b.role}));
 return {BOX,HOME,RANGE,barR,barY:L.barY,deckY,xl,xr,barZ,guardZ,rods,inGap,inPit,near,far,layout:L,floorY:C.floorY};
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
export function createBridgeSim({geom,box,mass=1,power={grab:.0012,carry:.001},seed=7,pose=null,st=null,friction=.35,openTo=.9,prewarm=3}){
 const {BOX,HOME,RANGE,barR,barY,xl,xr,barZ,rods,deckY,inGap,inPit}=geom,CL=CLAW_RIG,R=rng(seed);
 const {parts,half}=boxParts(box),N=parts.length,P={x:new Float64Array(N),y:new Float64Array(N),z:new Float64Array(N),ox:new Float64Array(N),oy:new Float64Array(N),oz:new Float64Array(N)};
 const w=1/(mass*10/16),cons=[];
 // yaw π/2 = 긴 쪽이 앞뒤(두 받침 봉을 건넘)
 const place=({x=0,z=0,yaw=Math.PI/2,y=barY+barR+half[1]+.02})=>{const c=Math.cos(yaw),s=Math.sin(yaw);
  parts.forEach(([lx,ly,lz],i)=>{P.x[i]=P.ox[i]=x+lx*c+lz*s;P.y[i]=P.oy[i]=y+ly;P.z[i]=P.oz[i]=z-lx*s+lz*c;});};
 place(pose??{});
 for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)cons.push([i,j,Math.hypot(parts[i][0]-parts[j][0],parts[i][1]-parts[j][1],parts[i][2]-parts[j][2])]);
 const prongs=2,claw={x:HOME.x,y:HOME.y,z:HOME.z,th:[CL.rest,CL.rest],ang:[0,Math.PI],state:'idle',t:0,pen:[0,0],hubPen:0,power:{...power},strength:0,touched:false,liftFrom:0,
  minY:barY+1.35,openTo:CL.open*openTo/.9};
 const buildSegs=out=>{out.length=0;
  for(let k=0;k<prongs;k++){const a=claw.ang[k],ux=Math.cos(a),uz=Math.sin(a),th=claw.th[k];
   const hx=claw.x+CL.hinge*ux,hy=claw.y,hz=claw.z+CL.hinge*uz,s1=Math.sin(th),c1=Math.cos(th),s2=Math.sin(th-CL.bend),c2=Math.cos(th-CL.bend);
   const kx=hx+CL.l1*s1*ux,ky=hy-CL.l1*c1,kz=hz+CL.l1*s1*uz,tx=kx+CL.l2*s2*ux,ty=ky-CL.l2*c2,tz=kz+CL.l2*s2*uz;
   out.push([hx,hy,hz,kx,ky,kz,k],[kx,ky,kz,tx,ty,tz,k]);}
  return out;};
 let prevSegs=buildSegs([]),curSegs=[],prevHub=[claw.x,claw.y,claw.z],sleep=false,still=0,won=false,gone=false;
 const events=[];
 const center=()=>{let x=0,y=0,z=0;for(let i=4;i<N;i++){x+=P.x[i];y+=P.y[i];z+=P.z[i];}const n=N-4;return [x/n,y/n,z/n];};
 // 봉 4개(x 방향 선분 + 반지름): 공이 봉에 닿으면 밀어냄(마찰 = 봉 마찰)
 const rodDist=(R2,px,py,pz)=>{const x=Math.max(xl,Math.min(xr,px)),dx=px-x,dy=py-R2.y,dz=pz-R2.z(x);return [dx,dy,dz,Math.hypot(dx,dy,dz)];};
 const barHit=(i,r,cb)=>{for(const R2 of rods){const [dx,dy,dz,l]=rodDist(R2,P.x[i],P.y[i],P.z[i]),m=r+barR;if(l<m&&l>1e-6)cb(dx/l,dy/l,dz/l,m-l);}};
 function contact(i,nx,ny,nz,d,mvx,mvy,mvz,muS,muK){
  P.x[i]+=nx*d;P.y[i]+=ny*d;P.z[i]+=nz*d;
  let rx=P.x[i]-P.ox[i]-mvx,ry=P.y[i]-P.oy[i]-mvy,rz=P.z[i]-P.oz[i]-mvz;const rn=rx*nx+ry*ny+rz*nz;rx-=rn*nx;ry-=rn*ny;rz-=rn*nz;
  const rt=Math.hypot(rx,ry,rz);if(rt<1e-9)return;const k=rt<muS*d?1:Math.min(1,muK*d/rt);P.x[i]-=rx*k;P.y[i]-=ry*k;P.z[i]-=rz*k;
 }
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
    if(c.hubPen>.012||c.pen[0]+c.pen[1]>.06)c.touched=true;
    // 집게발 끝이 봉에 닿으면 멈춤(봉을 뚫고 내려가지 않게)
    for(let s=1;s<curSegs.length;s+=2){const S=curSegs[s];for(const R2 of rods)if(rodDist(R2,S[3],S[4],S[5])[3]<barR+CL.rad+.02)c.touched=true;}
    if(c.y<=c.minY||c.touched&&c.t>.6){c.y=Math.max(c.y,c.minY);c.state='close';c.t=0;c.strength=c.power.grab;events.push({type:'close'});}
    break;}
   case 'close':for(let k=0;k<prongs;k++)c.th[k]-=1.25*h;if(c.t>1.0){c.state='lift';c.t=0;c.liftFrom=c.y;events.push({type:'lift'});}break;
   case 'lift':for(let k=0;k<prongs;k++)c.th[k]-=1.25*h;if(c.t>.35)c.y+=2.2*h;if(c.y-c.liftFrom>1.2)c.strength=c.power.carry;if(c.y>=HOME.y){c.y=HOME.y;c.state='carry';c.t=0;}break;
   case 'carry':{for(let k=0;k<prongs;k++)c.th[k]-=1.25*h;const dx=HOME.x-c.x,dz=HOME.z-c.z,d=Math.hypot(dx,dz),sp=1.5*h;
    if(d<=sp){c.x=HOME.x;c.z=HOME.z;c.state='release';c.t=0;events.push({type:'release'});}else{c.x+=dx/d*sp;c.z+=dz/d*sp;}break;}
   case 'release':for(let k=0;k<prongs;k++)toward(k,c.openTo,2.5);if(c.t>1.0){c.state='done';c.t=0;events.push({type:'done'});}break;
  }
  for(let k=0;k<prongs;k++)c.th[k]=Math.max(CL.closed,Math.min(c.state==='close'||c.state==='lift'||c.state==='carry'?CL.splay:CL.open,c.th[k]));
 }
 function sub(){
  const h=SUB;clawLogic(h);curSegs=buildSegs(curSegs.length?curSegs:[]);
  const busy=claw.state!=='idle'&&claw.state!=='move'&&claw.state!=='done';
  if(gone)return;
  const [cx,cy,cz]=center();
  if(sleep&&busy&&Math.abs(cx-claw.x)<half[0]+2.2&&Math.abs(cz-claw.z)<half[0]+2.2)wake();
  if(!sleep)for(let i=0;i<N;i++){
   let vx=P.x[i]-P.ox[i],vy=P.y[i]-P.oy[i],vz=P.z[i]-P.oz[i];const v2=vx*vx+vy*vy+vz*vz,damp=v2<SLOW2?.6:.998;vx*=damp;vy*=damp;vz*=damp;
   P.ox[i]=P.x[i];P.oy[i]=P.y[i];P.oz[i]=P.z[i];P.x[i]+=vx;P.y[i]+=vy-G*h*h;P.z[i]+=vz;}
  claw.pen[0]=claw.pen[1]=0;claw.hubPen=0;
  const hubMv=[claw.x-prevHub[0],claw.y-prevHub[1],claw.z-prevHub[2]];
  for(let it=0;it<ITER;it++){
   if(!sleep)for(const [a,b,L] of cons){const dx=P.x[b]-P.x[a],dy=P.y[b]-P.y[a],dz=P.z[b]-P.z[a],l=Math.hypot(dx,dy,dz)||1e-9,s=(l-L)/l/2;
    P.x[a]+=dx*s;P.y[a]+=dy*s;P.z[a]+=dz*s;P.x[b]-=dx*s;P.y[b]-=dy*s;P.z[b]-=dz*s;}
   for(let i=4;i<N;i++){const r=parts[i][3];
    if(!sleep){
     if(P.y[i]<r)contact(i,0,1,0,r-P.y[i],0,0,0,.55,.4);
     // 받침판(구덩이 밖): deckY가 바닥. 구덩이(봉 아래 뚫린 곳) 안은 구덩이 바닥(y 0)까지
     if(!inPit(P.x[i],P.z[i])&&P.y[i]<deckY+r&&P.y[i]>deckY-1.2)contact(i,0,1,0,deckY+r-P.y[i],0,0,0,.55,.4);
     if(P.x[i]<BOX.x0+r)contact(i,1,0,0,BOX.x0+r-P.x[i],0,0,0,.3,.2);
     if(P.x[i]>BOX.x1-r)contact(i,-1,0,0,P.x[i]-(BOX.x1-r),0,0,0,.3,.2);
     if(P.z[i]<BOX.z0+r)contact(i,0,0,1,BOX.z0+r-P.z[i],0,0,0,.3,.2);
     if(P.z[i]>BOX.z1-r)contact(i,0,0,-1,P.z[i]-(BOX.z1-r),0,0,0,.3,.2);
     barHit(i,r,(nx,ny,nz,d)=>contact(i,nx,ny,nz,d,0,0,0,friction,friction*.8));}
    {const dx=P.x[i]-claw.x,dy=P.y[i]-claw.y,dz=P.z[i]-claw.z,R2=r+CL.hub,l=Math.hypot(dx,dy,dz);
     if(l<R2&&l>1e-6){const d=R2-l;if(it===0)claw.hubPen=Math.max(claw.hubPen,d);if(d>.02&&sleep)wake();contact(i,dx/l,dy/l,dz/l,d,hubMv[0],hubMv[1],hubMv[2],MU_CLAW_S,MU_CLAW_K);}}
    for(let s=0;s<curSegs.length;s++){
     const S=curSegs[s],Q=prevSegs[s]||S,ex=S[3]-S[0],ey=S[4]-S[1],ez=S[5]-S[2],L2=ex*ex+ey*ey+ez*ez;
     let t=((P.x[i]-S[0])*ex+(P.y[i]-S[1])*ey+(P.z[i]-S[2])*ez)/L2;t=Math.max(0,Math.min(1,t));
     const qx=S[0]+ex*t,qy=S[1]+ey*t,qz=S[2]+ez*t,dx=P.x[i]-qx,dy=P.y[i]-qy,dz=P.z[i]-qz,l=Math.hypot(dx,dy,dz),R2=r+CL.rad;
     if(l>=R2||l<1e-6)continue;const d=R2-l;if(sleep)wake();
     if(it===0)claw.pen[S[6]]+=d/(w*2)*(s&1?1.3:.4+t*.6);
     contact(i,dx/l,dy/l,dz/l,d,qx-(Q[0]+(Q[3]-Q[0])*t),qy-(Q[1]+(Q[4]-Q[1])*t),qz-(Q[2]+(Q[5]-Q[2])*t),MU_CLAW_S,MU_CLAW_K);
    }
   }
  }
  if(claw.state==='close'||claw.state==='lift'||claw.state==='carry')for(let k=0;k<prongs;k++){const over=claw.pen[k]-claw.strength;if(over>0)claw.th[k]=Math.min(CL.splay,claw.th[k]+Math.min(1.25*SUB*4,over*BACK));}
  if(!sleep){let m=0;for(let i=4;i<N;i++)m=Math.max(m,Math.abs(P.x[i]-P.ox[i])+Math.abs(P.y[i]-P.oy[i])+Math.abs(P.z[i]-P.oz[i]));
   if(m<.35*SUB&&!busy){still+=SUB;if(still>.6)sleep=true;}else still=0;}
  const y=center()[1];
  // 성공 = 틈을 완전히 빠짐: 가운데가 봉 아래로 상자 높이만큼 내려감(받침판 위 상자는 가운데가 받침판 + 반 높이라 여기 못 옴)
  // 두 받침 봉 사이(가운데가 받침 봉 둘 사이)로 빠진 것만 — 받침·막이 봉 사이 좁은 틈으로 끼어 내려간 것은 성공 아님(막힘으로 처리)
  if(!won&&y<barY-half[1]*2-barR){const c=center();if(c[2]>barZ(-1,c[0])&&c[2]<barZ(1,c[0])){won=true;events.push({type:'won'});}}
  if(won&&y<half[1]+.3&&!gone){still+=SUB;if(still>.5)gone=true;}
  const tmp=prevSegs;prevSegs=curSegs;curSegs=tmp;prevSegs=prevSegs.map(a=>a.slice());curSegs=prevSegs.map(a=>a.slice());
  prevHub=[claw.x,claw.y,claw.z];
 }
 const sim={P,parts,claw,events,geom,half,
  setPos(x,z){claw.x=Math.max(RANGE.x0,Math.min(RANGE.x1,x));claw.z=Math.max(RANGE.z0,Math.min(RANGE.z1,z));},
  start(){claw.state='move';claw.t=0;claw.x=HOME.x;claw.z=HOME.z;claw.y=HOME.y;},
  drop(){if(claw.state!=='move')return false;claw.state='drop';claw.t=0;claw.touched=false;return true;},
  step(dt){const n=Math.min(12,Math.round(dt/SUB));for(let i=0;i<n;i++)sub();},
  settle(sec){for(let i=0;i<sec/SUB;i++)sub();},
  get won(){return won;},get gone(){return gone;},get sleeping(){return sleep;},
  center,
  /** 집게 그림 값(기계 좌표 m) — 집게 기계와 같은 꼴, opens = 집게발 둘 */
  clawPose(){const o=k=>Math.max(0,Math.min(1,(claw.th[k]-CL.closed)/(CL.splay-CL.closed)));const opens=[o(0),o(1)];
   return {x:claw.x*U,z:claw.z*U,drop:Math.max(0,(HOME.y-claw.y)*U),open:(opens[0]+opens[1])/2,opens};},
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
/** 기계 상태 「아슬아슬」(v4.1 §5-1): 받침 여유 nearSupportM 이하 또는 기울기 nearStateTiltDeg 이상(이미 떨어진 상자는 아님) */
export const nearState=(sim,B)=>!sim.won&&(sim.support()<=B.nearSupportM||sim.tilt()>=B.nearStateTiltDeg);
/** 한 판 결과: 떨어짐 = win, 기울기 nearTiltDeg 넘게 바뀜 또는 nearMoveM 넘게 옮겨짐 = near(아까움), 나머지 = miss */
export function bridgeOutcome(sim,before,B){
 if(sim.won)return 'win';const c=sim.center(),moved=Math.hypot(c[0]-before.c[0],c[2]-before.c[2])*U,turned=Math.abs(sim.tilt()-before.tilt);
 return turned>B.nearTiltDeg||moved>B.nearMoveM?'near':'miss';
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
