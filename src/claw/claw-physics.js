// 인형뽑기 집게 물리(월드개발, 2026-11-23). 대표 결정(11-23) 「판정 = 물리 그대로」 — 월드디자인 3D 손맛 시안 v2(docs/인형뽑기/3d-시안/claw-physics.js)를 옮겨
// 게임 기계 치수(월드아트 CLAW)와 우리 인형 8종 크기에 맞췄다. three를 쓰지 않는다(node 시험이 그대로 돌림).
// 단위: 1 = 10cm(시안과 같아서 중력·빠르기·세기 숫자를 그대로 씀). 원점 = 유리 상자 바닥 가운데, 앞(손님 쪽) = +z, 위 = +y.
// 기계 좌표(m)로는 x·z ×0.1, y ×0.1 + CLAW.floorY. 변환은 toMachine·fromMachine.
// 규칙(시안 v2 §2): 인형 = 공 4~7개 묶음, 집게발은 정해진 세기까지만 조임(넘게 밀리면 벌어짐), 1.2 올라가면 힘이 한 번 더 빠짐, 눌린 인형은 잘 안 빠짐,
//  구멍 둘레 투명 턱을 넘어야 함, 가만히 있는 인형은 잠듦. 구멍 아래로 떨어지면 성공(events 'won').
export const U=.1; // 1단위 = 0.1m

// 인형 몸 공 [x,y,z,반지름](시안 TYPES). 0번 = 몸통 가운데, 1번 = 위(머리), 2·3번 = 좌우. bottom = 0번 공에서 인형 발바닥까지(단위)
export const BODY_TYPES=Object.freeze({
 bear:{parts:[[0,0,0,.55],[0,.85,0,.47],[-.36,.05,0,.32],[.36,.05,0,.32],[0,.02,.28,.3]],dens:1,bottom:.55,height:1.87},
 bunny:{parts:[[0,0,0,.5],[0,.78,0,.43],[-.32,.05,0,.3],[.32,.05,0,.3],[0,.02,.25,.28],[-.16,1.42,0,.13],[.16,1.42,0,.13]],dens:1,bottom:.5,height:2.05},
 chick:{parts:[[0,0,0,.45],[0,.42,.06,.32],[-.26,.02,0,.25],[.26,.02,0,.25]],dens:.8,bottom:.45,height:1.19},
});
// 우리 인형 → 몸 모양(그림 모양과 비슷한 것). 크기는 인형 키(m)에 맞춰 늘림 → 큰(희귀) 인형일수록 무거워 잘 안 잡힘
export const PLUSH_BODY=Object.freeze({squirrel:'bear',hare:'bunny',magpie:'chick',cat:'bear',dongdong:'bear','dongdong-office':'bear',haechi:'bear','dongdong-santa':'bear'});
export const bodyOf=id=>BODY_TYPES[PLUSH_BODY[id]??'bear'];
// 무게는 시안 몸 크기 그대로(키운 만큼 세제곱으로 무거워지지 않게) × 희귀도 무게(massOf). 크기만 그림에 맞춤
const scaled=(id,size)=>{const B=bodyOf(id),s=size/(B.height*U);return {parts:B.parts.map(([x,y,z,r])=>[x*s,y*s,z*s,r*s,r]),dens:B.dens,bottom:B.bottom*s,scale:s};};

/** 기계 치수(CLAW, m) → 물리 상자(단위). 그림 크기 = 판정 크기 */
export function geomFrom(C){
 const k=1/U,hw=C.width/2-.07,front=C.depth/2-.08,back=-(C.depth/2-.09),ch=C.chute;
 const BOX={x0:-hw*k,x1:hw*k,z0:back*k,z1:front*k,top:(C.glassTop-C.floorY)*k};
 const CHUTE={x0:ch.x[0]*k,x1:ch.x[1]*k,z0:ch.z[0]*k,z1:ch.z[1]*k};
 const g=ch.guard*k,t=.2;
 const WALLS=[{x0:CHUTE.x1-t/2,x1:CHUTE.x1+t/2,y0:0,y1:g,z0:CHUTE.z0,z1:BOX.z1},{x0:BOX.x0,x1:CHUTE.x1+t/2,y0:0,y1:g,z0:CHUTE.z0-t/2,z1:CHUTE.z0+t/2}];
 // 집게 가운데 높이: 손가락 끝이 CLAW.clawTop에 오게(쉼 자세 끝까지 약 1.84단위)
 const HOME={x:C.home[0]*k,z:C.home[1]*k,y:(C.clawTop-C.floorY)*k+TIP_REST};
 const RANGE={x0:C.play.x[0]*k,x1:C.play.x[1]*k,z0:C.play.z[0]*k,z1:C.play.z[1]*k};
 return {BOX,CHUTE,WALLS,HOME,RANGE,floorY:C.floorY,guard:g};
}
// 집게 치수(시안 그대로: 손가락 길이 약 0.2m = 그림 CLAW.clawTip과 같음)
export const CLAW_RIG=Object.freeze({hub:.34,hinge:.28,l1:1.4,l2:.55,bend:.75,rad:.09,open:.6,closed:-.04,rest:.18,minY:1.85,splay:1.0});
const TIP_REST=CLAW_RIG.l1*Math.cos(CLAW_RIG.rest)+CLAW_RIG.l2*Math.cos(CLAW_RIG.rest-CLAW_RIG.bend);
export const toMachine=(g,x,y,z)=>[x*U,g.floorY+y*U,z*U];

const G=38,SUB=1/240,ITER=6,SLOW2=(.25*SUB)**2,BACK=12,SLEEP_V=.35,NEIGH_V=1.2,WAKE_D=.02,MU_S=.55,MU_K=.4,MU_CLAW_S=.6,MU_CLAW_K=.42;
function rng(seed){let s=seed>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}

/**
 * 기계 하나의 물리. geom = geomFrom(CLAW), ids = 넣을 인형 id 목록(손님 자리는 미리 바꿔서), sizeOf(id) = 인형 키(m)
 * power = {grab, carry}(집게 세기 — 기계 조절값), count·seed·prewarm
 */
export function createClawSim({geom,ids,sizeOf,massOf=()=>1,seed=7,count=14,power={grab:.002,carry:.0015},prewarm=8}){
 const {BOX,CHUTE,WALLS,HOME,RANGE}=geom,CL=CLAW_RIG;
 const R=rng(seed);
 const P={x:[],y:[],z:[],ox:[],oy:[],oz:[],r:[],w:[],iw:[],d:[]};
 const dolls=[],cons=[];
 const addDoll=(id,x,y,z,yaw,tilt)=>{
  const T=scaled(id,sizeOf(id)),di=dolls.length,first=P.x.length;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),ct=Math.cos(tilt),st=Math.sin(tilt);
  const mm=massOf(id);
  for(const [lx,ly,lz,r,r0] of T.parts){
   const y1=ly*ct-lz*st,z1=ly*st+lz*ct,wx=lx*cy+z1*sy,wz=-lx*sy+z1*cy;
   P.x.push(x+wx);P.y.push(y+y1);P.z.push(z+wz);P.ox.push(x+wx);P.oy.push(y+y1);P.oz.push(z+wz);
   P.r.push(r);P.w.push(1/(r0*r0*r0*T.dens*4*mm));P.iw.push(P.w[P.w.length-1]);P.d.push(di);
  }
  const n=T.parts.length;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=first+i,b=first+j;cons.push([a,b,Math.hypot(P.x[a]-P.x[b],P.y[a]-P.y[b],P.z[a]-P.z[b])]);}
  let br=0;for(const [lx,ly,lz,r] of T.parts)br=Math.max(br,Math.hypot(lx,ly,lz)+r);
  dolls.push({id,parts:T.parts,bottom:T.bottom,first,n,br,won:false,gone:false,cx:x,cy:y,cz:z,sleep:false,still:0,lifted:0});
 };
 // 쌓기: 구멍 밖 칸에 띄워 놓고 떨어뜨려 저절로 겹치게(시안 그대로)
 const cells=[];
 for(let gx=BOX.x0+.8;gx<=BOX.x1-.8;gx+=1.35)for(let gz=BOX.z0+.8;gz<=BOX.z1-.8;gz+=1.35)if(!(gx<CHUTE.x1+1.1&&gz>CHUTE.z0-1.1))cells.push([gx,gz]);
 for(let i=0;i<count;i++){const [gx,gz]=cells[i%cells.length],layer=Math.floor(i/cells.length);
  addDoll(ids[Math.floor(R()*ids.length)],gx+(R()-.5)*.3,1.1+layer*2.1+R()*.3,gz+(R()-.5)*.3,(R()-.5)*1.6,(R()-.5)*1.2);}
 const claw={x:HOME.x,y:HOME.y,z:HOME.z,th:[CL.rest,CL.rest,CL.rest],ang:[Math.PI/2,Math.PI/2+2.094,Math.PI/2+4.189],
  state:'idle',t:0,pen:[0,0,0],hubPen:0,power:{...power},strength:0,touched:false,liftFrom:0};
 const buildSegs=out=>{out.length=0;
  for(let k=0;k<3;k++){const a=claw.ang[k],ux=Math.cos(a),uz=Math.sin(a),th=claw.th[k];
   const hx=claw.x+CL.hinge*ux,hy=claw.y,hz=claw.z+CL.hinge*uz,s1=Math.sin(th),c1=Math.cos(th),s2=Math.sin(th-CL.bend),c2=Math.cos(th-CL.bend);
   const kx=hx+CL.l1*s1*ux,ky=hy-CL.l1*c1,kz=hz+CL.l1*s1*uz,tx=kx+CL.l2*s2*ux,ty=ky-CL.l2*c2,tz=kz+CL.l2*s2*uz;
   out.push([hx,hy,hz,kx,ky,kz,k],[kx,ky,kz,tx,ty,tz,k]);}
  return out;};
 let prevSegs=buildSegs([]),curSegs=[],prevHub=[claw.x,claw.y,claw.z];
 const events=[];
 const sim={P,dolls,claw,events,geom,
  /** 조작 중 집게 자리(단위, 범위 안으로 자름) */
  setPos(x,z){claw.x=Math.max(RANGE.x0,Math.min(RANGE.x1,x));claw.z=Math.max(RANGE.z0,Math.min(RANGE.z1,z));},
  start(){claw.state='move';claw.t=0;claw.x=HOME.x;claw.z=HOME.z;claw.y=HOME.y;for(const D of dolls)D.lifted=0;},
  drop(){if(claw.state!=='move')return false;claw.state='drop';claw.t=0;claw.touched=false;return true;},
  step(dt){const n=Math.min(12,Math.round(dt/SUB));for(let i=0;i<n;i++)sub();},
  settle(sec){for(let i=0;i<sec/SUB;i++)sub();},
  /** 집게 그림 값(기계 좌표 m): x·z·drop(0 = 처음 높이)·open(0 오므림~1 활짝)·opens(그림 손가락 0·1·2 순서 = 물리 집게발 0·2·1, 그림은 +z에서 반대로 돎) */
  clawPose(){const o=k=>Math.max(0,Math.min(1,(claw.th[k]-CL.closed)/(CL.splay-CL.closed)));const opens=[o(0),o(2),o(1)];
   return {x:claw.x*U,z:claw.z*U,drop:Math.max(0,(HOME.y-claw.y)*U),open:(opens[0]+opens[1]+opens[2])/3,opens};},
  /** 인형 하나의 몸 틀(0번 공 자리 + 머리·좌우 방향, 단위) — 그림이 자세를 맞출 때 씀 */
  frame(di){const D=dolls[di],i=D.first;return {p:[P.x[i],P.y[i],P.z[i]],up:[P.x[i+1]-P.x[i],P.y[i+1]-P.y[i],P.z[i+1]-P.z[i]],side:[P.x[i+3]-P.x[i+2],P.y[i+3]-P.y[i+2],P.z[i+3]-P.z[i+2]],
   lup:[D.parts[1][0]-D.parts[0][0],D.parts[1][1]-D.parts[0][1],D.parts[1][2]-D.parts[0][2]],lside:[D.parts[3][0]-D.parts[2][0],D.parts[3][1]-D.parts[2][1],D.parts[3][2]-D.parts[2][2]]};},
  /** 이번 판에 바닥에서 높이 들린 인형이 있었나(「들었다 놓침」 판단) */
  liftedAny:()=>dolls.some(D=>D.lifted>0),
  /** 집게 바로 아래 더미 윗면 높이(단위, 그림자 점) */
  topAt(x,z){let y=0;for(const D of dolls){if(D.gone)continue;for(let i=D.first;i<D.first+D.n;i++){const dx=P.x[i]-x,dz=P.z[i]-z,r=P.r[i];if(dx*dx+dz*dz<r*r)y=Math.max(y,P.y[i]+Math.sqrt(r*r-dx*dx-dz*dz));}}return y;},
  left:()=>dolls.filter(D=>!D.gone&&!D.won).length,
 };
 sim.settle(prewarm);events.length=0;for(const D of dolls)if(D.won){D.gone=true;D.won=false;}

 function clawLogic(h){
  const c=claw;c.t+=h;
  const toward=(k,target,rate)=>{const d=target-c.th[k];c.th[k]+=Math.sign(d)*Math.min(Math.abs(d),rate*h);};
  switch(c.state){
   case 'idle':case 'done':case 'move':for(let k=0;k<3;k++)toward(k,CL.rest,1.5);break;
   case 'drop':
    for(let k=0;k<3;k++)toward(k,CL.open,2.2);
    if(c.t<.45)break;
    c.y-=2.6*h;
    if(c.hubPen>.012||c.pen[0]+c.pen[1]+c.pen[2]>.09)c.touched=true;
    if(c.y<=CL.minY||c.touched&&c.t>.6){c.y=Math.max(c.y,CL.minY);c.state='close';c.t=0;c.strength=c.power.grab;events.push({type:'close'});}
    break;
   case 'close':for(let k=0;k<3;k++)c.th[k]-=1.25*h;if(c.t>1.0){c.state='lift';c.t=0;c.liftFrom=c.y;events.push({type:'lift'});}break;
   case 'lift':for(let k=0;k<3;k++)c.th[k]-=1.25*h;if(c.t>.35)c.y+=2.2*h;if(c.y-c.liftFrom>1.2)c.strength=c.power.carry;if(c.y>=HOME.y){c.y=HOME.y;c.state='carry';c.t=0;}break;
   case 'carry':{for(let k=0;k<3;k++)c.th[k]-=1.25*h;const dx=HOME.x-c.x,dz=HOME.z-c.z,d=Math.hypot(dx,dz),sp=1.5*h;
    if(d<=sp){c.x=HOME.x;c.z=HOME.z;c.state='release';c.t=0;events.push({type:'release'});}else{c.x+=dx/d*sp;c.z+=dz/d*sp;}break;}
   case 'release':for(let k=0;k<3;k++)toward(k,CL.open,2.5);if(c.t>1.6){c.state='done';c.t=0;events.push({type:'done'});}break;
  }
  for(let k=0;k<3;k++)c.th[k]=Math.max(CL.closed,Math.min(c.state==='close'||c.state==='lift'||c.state==='carry'?CL.splay:CL.open,c.th[k]));
 }
 function wake(D){D.sleep=false;D.still=0;for(let i=D.first;i<D.first+D.n;i++)P.iw[i]=P.w[i];}
 function contact(i,nx,ny,nz,d,mvx,mvy,mvz,muS,muK){
  P.x[i]+=nx*d;P.y[i]+=ny*d;P.z[i]+=nz*d;
  let rx=P.x[i]-P.ox[i]-mvx,ry=P.y[i]-P.oy[i]-mvy,rz=P.z[i]-P.oz[i]-mvz;const rn=rx*nx+ry*ny+rz*nz;rx-=rn*nx;ry-=rn*ny;rz-=rn*nz;
  const rt=Math.hypot(rx,ry,rz);if(rt<1e-9)return;const k=rt<muS*d?1:Math.min(1,muK*d/rt);P.x[i]-=rx*k;P.y[i]-=ry*k;P.z[i]-=rz*k;
 }
 function sub(){
  const h=SUB,N=P.x.length;
  clawLogic(h);curSegs=buildSegs(curSegs.length?curSegs:[]);
  const busy=claw.state!=='idle'&&claw.state!=='move'&&claw.state!=='done';
  for(const D of dolls){if(D.gone)continue;if(D.sleep&&busy&&Math.abs(D.cx-claw.x)<D.br+1.4&&Math.abs(D.cz-claw.z)<D.br+1.4&&D.cy<claw.y+1)wake(D);}
  for(let i=0;i<N;i++){
   if(dolls[P.d[i]].sleep){P.ox[i]=P.x[i];P.oy[i]=P.y[i];P.oz[i]=P.z[i];continue;}
   let vx=P.x[i]-P.ox[i],vy=P.y[i]-P.oy[i],vz=P.z[i]-P.oz[i];const v2=vx*vx+vy*vy+vz*vz,damp=v2<SLOW2?.6:.998;vx*=damp;vy*=damp;vz*=damp;
   P.ox[i]=P.x[i];P.oy[i]=P.y[i];P.oz[i]=P.z[i];P.x[i]+=vx;P.y[i]+=vy-G*h*h;P.z[i]+=vz;
  }
  for(const D of dolls){D.cx=P.x[D.first];D.cy=P.y[D.first];D.cz=P.z[D.first];}
  claw.pen[0]=claw.pen[1]=claw.pen[2]=0;claw.hubPen=0;
  const hubMv=[claw.x-prevHub[0],claw.y-prevHub[1],claw.z-prevHub[2]];
  for(let it=0;it<ITER;it++){
   for(const [a,b,L] of cons){const dx=P.x[b]-P.x[a],dy=P.y[b]-P.y[a],dz=P.z[b]-P.z[a],l=Math.hypot(dx,dy,dz)||1e-9;if(!P.iw[a])continue;
    const s=(l-L)/l/(P.iw[a]+P.iw[b]);P.x[a]+=dx*s*P.iw[a];P.y[a]+=dy*s*P.iw[a];P.z[a]+=dz*s*P.iw[a];P.x[b]-=dx*s*P.iw[b];P.y[b]-=dy*s*P.iw[b];P.z[b]-=dz*s*P.iw[b];}
   for(let A=0;A<dolls.length;A++){const DA=dolls[A];if(DA.gone)continue;
    for(let B=A+1;B<dolls.length;B++){const DB=dolls[B];if(DB.gone||DA.sleep&&DB.sleep)continue;
     const rr=DA.br+DB.br;if(Math.abs(DA.cx-DB.cx)>rr||Math.abs(DA.cy-DB.cy)>rr||Math.abs(DA.cz-DB.cz)>rr)continue;
     for(let i=DA.first;i<DA.first+DA.n;i++)for(let j=DB.first;j<DB.first+DB.n;j++){
      const dx=P.x[j]-P.x[i],dy=P.y[j]-P.y[i],dz=P.z[j]-P.z[i],R2=P.r[i]+P.r[j],l2=dx*dx+dy*dy+dz*dz;if(l2>=R2*R2)continue;
      const l=Math.sqrt(l2)||1e-9,nx=dx/l,ny=dy/l,nz=dz/l,d=R2-l;
      if(d>WAKE_D){if(DA.sleep)wake(DA);if(DB.sleep)wake(DB);}
      const wi=P.iw[i],wj=P.iw[j],ws=wi+wj;if(!ws)continue;
      P.x[i]-=nx*d*wi/ws;P.y[i]-=ny*d*wi/ws;P.z[i]-=nz*d*wi/ws;P.x[j]+=nx*d*wj/ws;P.y[j]+=ny*d*wj/ws;P.z[j]+=nz*d*wj/ws;
      let rx=(P.x[j]-P.ox[j])-(P.x[i]-P.ox[i]),ry=(P.y[j]-P.oy[j])-(P.y[i]-P.oy[i]),rz=(P.z[j]-P.oz[j])-(P.z[i]-P.oz[i]);
      const rn=rx*nx+ry*ny+rz*nz;rx-=rn*nx;ry-=rn*ny;rz-=rn*nz;const rt=Math.hypot(rx,ry,rz);
      if(rt>1e-9){const k=rt<MU_S*d?1:Math.min(1,MU_K*d/rt);P.x[i]+=rx*k*wi/ws;P.y[i]+=ry*k*wi/ws;P.z[i]+=rz*k*wi/ws;P.x[j]-=rx*k*wj/ws;P.y[j]-=ry*k*wj/ws;P.z[j]-=rz*k*wj/ws;}
     }}}
   for(let i=0;i<N;i++){
    const r=P.r[i];if(dolls[P.d[i]].gone||dolls[P.d[i]].sleep)continue;
    const inChute=P.x[i]>CHUTE.x0&&P.x[i]<CHUTE.x1&&P.z[i]>CHUTE.z0&&P.z[i]<CHUTE.z1;
    if(!inChute&&P.y[i]<r)contact(i,0,1,0,r-P.y[i],0,0,0,MU_S,MU_K);
    if(P.x[i]<BOX.x0+r)contact(i,1,0,0,BOX.x0+r-P.x[i],0,0,0,.3,.2);
    if(P.x[i]>BOX.x1-r)contact(i,-1,0,0,P.x[i]-(BOX.x1-r),0,0,0,.3,.2);
    if(P.z[i]<BOX.z0+r)contact(i,0,0,1,BOX.z0+r-P.z[i],0,0,0,.3,.2);
    if(P.z[i]>BOX.z1-r&&P.y[i]>-.2)contact(i,0,0,-1,P.z[i]-(BOX.z1-r),0,0,0,.3,.2);
    if(P.y[i]>BOX.top-r)contact(i,0,-1,0,P.y[i]-(BOX.top-r),0,0,0,0,0);
    for(const W of WALLS){const qx=Math.max(W.x0,Math.min(W.x1,P.x[i])),qy=Math.max(W.y0,Math.min(W.y1,P.y[i])),qz=Math.max(W.z0,Math.min(W.z1,P.z[i]));
     const dx=P.x[i]-qx,dy=P.y[i]-qy,dz=P.z[i]-qz,l=Math.hypot(dx,dy,dz);if(l<r&&l>1e-6)contact(i,dx/l,dy/l,dz/l,r-l,0,0,0,.3,.2);}
    {const dx=P.x[i]-claw.x,dy=P.y[i]-claw.y,dz=P.z[i]-claw.z,R2=r+CL.hub,l=Math.hypot(dx,dy,dz);
     if(l<R2&&l>1e-6){const d=R2-l;if(it===0)claw.hubPen=Math.max(claw.hubPen,d);contact(i,dx/l,dy/l,dz/l,d,hubMv[0],hubMv[1],hubMv[2],MU_CLAW_S,MU_CLAW_K);}}
    for(let s=0;s<curSegs.length;s++){
     const S=curSegs[s],Q=prevSegs[s]||S,ex=S[3]-S[0],ey=S[4]-S[1],ez=S[5]-S[2],L2=ex*ex+ey*ey+ez*ez;
     let t=((P.x[i]-S[0])*ex+(P.y[i]-S[1])*ey+(P.z[i]-S[2])*ez)/L2;t=Math.max(0,Math.min(1,t));
     const qx=S[0]+ex*t,qy=S[1]+ey*t,qz=S[2]+ez*t,dx=P.x[i]-qx,dy=P.y[i]-qy,dz=P.z[i]-qz,l=Math.hypot(dx,dy,dz),R2=r+CL.rad;
     if(l>=R2||l<1e-6)continue;const d=R2-l;
     if(it===0)claw.pen[S[6]]+=d/(P.w[i]*2)*(s&1?1.3:.4+t*.6);
     contact(i,dx/l,dy/l,dz/l,d,qx-(Q[0]+(Q[3]-Q[0])*t),qy-(Q[1]+(Q[4]-Q[1])*t),qz-(Q[2]+(Q[5]-Q[2])*t),MU_CLAW_S,MU_CLAW_K);
    }
   }
  }
  if(claw.state==='close'||claw.state==='lift'||claw.state==='carry')for(let k=0;k<3;k++){const over=claw.pen[k]-claw.strength;if(over>0)claw.th[k]=Math.min(CL.splay,claw.th[k]+Math.min(1.25*SUB*4,over*BACK));}
  for(const D of dolls){if(D.gone||D.sleep)continue;
   let m=0;for(let i=D.first;i<D.first+D.n;i++)m=Math.max(m,Math.abs(P.x[i]-P.ox[i])+Math.abs(P.y[i]-P.oy[i])+Math.abs(P.z[i]-P.oz[i]));
   if(m<SLEEP_V*SUB&&!busy){D.still+=SUB;if(D.still>.6){D.sleep=true;for(let i=D.first;i<D.first+D.n;i++)P.iw[i]=0;}}
   else{D.still=0;if(m>NEIGH_V*SUB)for(const E of dolls)if(E.sleep&&Math.abs(E.cx-D.cx)<E.br+D.br&&Math.abs(E.cy-D.cy)<E.br+D.br&&Math.abs(E.cz-D.cz)<E.br+D.br)wake(E);}
   // 들어 올림 기록: 집게가 올라가는 동안 바닥에서 2.2단위(22cm) 넘게 뜬 인형
   if((claw.state==='lift'||claw.state==='carry')&&P.y[D.first]-D.bottom>2.2)D.lifted=1;
  }
  for(let di=0;di<dolls.length;di++){const D=dolls[di];if(D.gone)continue;
   if(P.y[D.first]<-1.2&&!D.won){D.won=true;events.push({type:'won',doll:di,id:D.id});}
   if(P.y[D.first]<-6)D.gone=true;}
  const tmp=prevSegs;prevSegs=curSegs;curSegs=tmp;prevSegs=prevSegs.map(a=>a.slice());curSegs=prevSegs.map(a=>a.slice());
  prevHub=[claw.x,claw.y,claw.z];
 }
 return sim;
}

/** 판 하나를 끝까지(시험·점검용): 집게를 (x,z)에 두고 뽑기 → {won:[id…], lifted} */
export function runDrop(sim,x,z,maxSec=14){
 sim.start();sim.setPos(x,z);sim.drop();const won=[];
 for(let t=0;t<maxSec&&sim.claw.state!=='done';t+=1/30){sim.step(1/30);for(const e of sim.events.splice(0))if(e.type==='won')won.push(e.id);}
 for(let t=0;t<1;t+=1/30){sim.step(1/30);for(const e of sim.events.splice(0))if(e.type==='won')won.push(e.id);}
 return {won,lifted:sim.liftedAny()};
}
