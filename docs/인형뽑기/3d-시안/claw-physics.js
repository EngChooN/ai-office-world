// 인형뽑기 3D 시안 — 물리(월드디자인 2026-11-23, 손맛 확인용. 정식 구현은 월드개발).
// 인형 = 공 몇 개를 거리 제약으로 묶은 덩어리(위치 기반 물리, PBD). 집게 = 움직이는 막대 3개.
// 집게는 「세기」만큼만 조여서, 약하면 들어 올리다 미끄러지고 겹친 인형은 눌려서 안 빠진다.
// 1단위 ≈ 10cm. 기계 안쪽 폭 6 × 깊이 4.4 × 높이 8. 북쪽(안쪽) = −z, 손님 쪽 = +z.

export const BOX={x0:-3,x1:3,z0:-2.2,z1:2.2,top:8};
export const CHUTE={x0:-3,x1:-1.4,z0:.6,z1:2.2};                    // 상품 구멍(앞 왼쪽)
export const WALLS=[{x0:-1.55,x1:-1.35,y0:0,y1:1.9,z0:.45,z1:2.2},{x0:-3,x1:-1.35,y0:0,y1:1.9,z0:.45,z1:.65}]; // 구멍 둘레 투명 칸막이
export const HOME={x:-2.2,z:1.4,y:7};
export const RANGE={x0:-2.6,x1:2.6,z0:-1.8,z1:1.8};
export const CLAW={hub:.34,hinge:.28,l1:1.4,l2:.55,bend:.75,rad:.09,open:.6,closed:-.04,rest:.18,minY:1.85,splay:1.0};   // splay = 약한 집게가 인형 무게에 밀려 벌어지는 끝(발끝이 바깥을 봄)

// 인형 종류: 공 [x,y,z,반지름]. 0번 = 몸통 중심, 1번 = 방향 기준(머리 등), 2·3번 = 좌우.
export const TYPES={
 bear:{name:'곰돌이',parts:[[0,0,0,.55],[0,.85,0,.47],[-.36,.05,0,.32],[.36,.05,0,.32],[0,.02,.28,.3]],dens:1},
 bunny:{name:'토끼',parts:[[0,0,0,.5],[0,.78,0,.43],[-.32,.05,0,.3],[.32,.05,0,.3],[0,.02,.25,.28],[-.16,1.42,0,.13],[.16,1.42,0,.13]],dens:1},
 seal:{name:'길쭉 물개',parts:[[0,0,0,.44],[0,.06,.78,.42],[-.3,0,-.12,.3],[.3,0,-.12,.3],[0,-.02,-.72,.36],[0,0,-1.18,.24]],dens:1.15},
 chick:{name:'삐약이',parts:[[0,0,0,.45],[0,.42,.06,.32],[-.26,.02,0,.25],[.26,.02,0,.25]],dens:.8},
};

const G=38;                       // 중력(단위/초²) — 인형이 「툭」 떨어지는 빠르기
const SUB=1/240, ITER=6, SLOW2=(.25*SUB)**2;   // 초당 0.25단위보다 느리면 「멈춤」
const BACK=12;                                   // 세기를 넘게 밀리면 되돌아가는 정도(클수록 세기 값에 딱 맞춰 조임)
const SLEEP_V=.35, NEIGH_V=1.2, WAKE_D=.02;     // 잠들기 빠르기(단위/초)·이웃 깨우기 빠르기·깨우는 겹침
const MU_S=.55, MU_K=.4, MU_CLAW_S=.6, MU_CLAW_K=.42;

function rng(seed){let s=seed>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}

export function createSim({seed=7,count=14,power={grab:.0016,carry:.0008},types=['bear','bunny','seal','chick'],prewarm=8}={}){
 const R=rng(seed);
 const P={x:[],y:[],z:[],ox:[],oy:[],oz:[],r:[],w:[],iw:[],d:[]};   // iw = 지금 쓰는 무게(잠든 인형은 0 = 안 움직임)
 const dolls=[], cons=[];
 const addDoll=(type,x,y,z,yaw,tilt)=>{
  const T=TYPES[type], di=dolls.length, first=P.x.length;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),ct=Math.cos(tilt),st=Math.sin(tilt);
  for(const [lx,ly,lz,r] of T.parts){
   const y1=ly*ct-lz*st, z1=ly*st+lz*ct;                           // 앞뒤로 기울임
   const wx=lx*cy+z1*sy, wz=-lx*sy+z1*cy;
   P.x.push(x+wx);P.y.push(y+y1);P.z.push(z+wz);P.ox.push(x+wx);P.oy.push(y+y1);P.oz.push(z+wz);
   P.r.push(r);P.w.push(1/(r*r*r*T.dens*4));P.iw.push(P.w[P.w.length-1]);P.d.push(di);
  }
  const n=T.parts.length;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=first+i,b=first+j;cons.push([a,b,Math.hypot(P.x[a]-P.x[b],P.y[a]-P.y[b],P.z[a]-P.z[b])]);}
  let br=0;for(const [lx,ly,lz,r] of T.parts)br=Math.max(br,Math.hypot(lx,ly,lz)+r);
  dolls.push({type,first,n,br,won:false,gone:false,cx:x,cy:y,cz:z,sleep:false,still:0});
 };
 // 쌓기: 구멍 밖 칸에 위에서 떨어뜨려 저절로 겹치게
 const keys=types, cells=[];
 for(let gx=BOX.x0+.8;gx<=BOX.x1-.8;gx+=1.35)for(let gz=BOX.z0+.8;gz<=BOX.z1-.8;gz+=1.35)if(!(gx<CHUTE.x1+1.1&&gz>CHUTE.z0-1.1))cells.push([gx,gz]);
 for(let i=0;i<count;i++){                                           // 칸마다 띄워 놓고 떨어뜨려 저절로 겹치게
  const [gx,gz]=cells[i%cells.length], layer=Math.floor(i/cells.length);
  addDoll(keys[Math.floor(R()*keys.length)],gx+(R()-.5)*.3,1.1+layer*1.9+R()*.3,gz+(R()-.5)*.3,R()*6.28,(R()-.5)*1.2);
 }
 // 집게 상태
 const claw={x:HOME.x,y:HOME.y,z:HOME.z,th:[CLAW.rest,CLAW.rest,CLAW.rest],ang:[Math.PI/2,Math.PI/2+2.094,Math.PI/2+4.189],
  state:'idle',t:0,inX:0,inZ:0,pen:[0,0,0],hubPen:0,power:{...power},strength:0,touched:false,tx:0,tz:0};
 const segs=[];             // [ax,ay,az,bx,by,bz, 이전 ax..bz, prong]
 const buildSegs=(out)=>{
  out.length=0;
  for(let k=0;k<3;k++){
   const a=claw.ang[k],ux=Math.cos(a),uz=Math.sin(a),th=claw.th[k];
   const hx=claw.x+CLAW.hinge*ux,hy=claw.y,hz=claw.z+CLAW.hinge*uz;
   const s1=Math.sin(th),c1=Math.cos(th),s2=Math.sin(th-CLAW.bend),c2=Math.cos(th-CLAW.bend);
   const kx=hx+CLAW.l1*s1*ux,ky=hy-CLAW.l1*c1,kz=hz+CLAW.l1*s1*uz;
   const tx=kx+CLAW.l2*s2*ux,ty=ky-CLAW.l2*c2,tz=kz+CLAW.l2*s2*uz;
   out.push([hx,hy,hz,kx,ky,kz,k],[kx,ky,kz,tx,ty,tz,k]);
  }
  return out;
 };
 let prevSegs=buildSegs([]), curSegs=[];
 let prevHub=[claw.x,claw.y,claw.z];

 const events=[];
 const sim={P,dolls,claw,events,segs:()=>curSegs.length?curSegs:prevSegs,
  setInput(x,z){claw.inX=x;claw.inZ=z;},
  start(){if(claw.state==='idle'||claw.state==='done'){claw.state='move';claw.t=0;}},
  drop(){if(claw.state==='move'){claw.state='drop';claw.t=0;claw.touched=false;}},
  step(dt){let n=Math.min(12,Math.round(dt/SUB));for(let i=0;i<n;i++)sub();},
  settle(sec){for(let i=0;i<sec/SUB;i++)sub();},
 };
 // 처음 쌓일 때 구멍으로 굴러 들어간 인형은 빼고 시작(성공으로 세지 않음)
 sim.settle(prewarm);events.length=0;for(const D of dolls)if(D.won){D.gone=true;D.won=false;}

 function clawLogic(h){
  const c=claw;c.t+=h;
  const toward=(k,target,rate)=>{const d=target-c.th[k];c.th[k]+=Math.sign(d)*Math.min(Math.abs(d),rate*h);};
  switch(c.state){
   case 'idle':case 'done':for(let k=0;k<3;k++)toward(k,CLAW.rest,1.5);break;
   case 'move':{
    const sp=1.9;
    c.x=Math.max(RANGE.x0,Math.min(RANGE.x1,c.x+c.inX*sp*h));c.z=Math.max(RANGE.z0,Math.min(RANGE.z1,c.z+c.inZ*sp*h));
    for(let k=0;k<3;k++)toward(k,CLAW.rest,1.5);break;}
   case 'drop':{
    for(let k=0;k<3;k++)toward(k,CLAW.open,2.2);
    if(c.t<.45)break;                                                // 먼저 벌리고
    c.y-=2.6*h;
    if(c.hubPen>.012||c.pen[0]+c.pen[1]+c.pen[2]>.09)c.touched=true; // 인형 위에 얹힘
    if(c.y<=CLAW.minY||c.touched&&c.t>.6){c.y=Math.max(c.y,CLAW.minY);c.state='close';c.t=0;c.strength=c.power.grab;events.push({type:'close'});}
    break;}
   case 'close':
    for(let k=0;k<3;k++)c.th[k]-=1.25*h;                            // 조이기(밀리면 아래에서 되돌림)
    if(c.t>1.0){c.state='lift';c.t=0;c.liftFrom=c.y;events.push({type:'lift'});}
    break;
   case 'lift':
    for(let k=0;k<3;k++)c.th[k]-=1.25*h;
    if(c.t>.35)c.y+=2.2*h;
    if(c.y-c.liftFrom>1.2)c.strength=c.power.carry;                // 올라가면 힘이 빠지는 기계(실제 기계처럼)
    if(c.y>=HOME.y){c.y=HOME.y;c.state='carry';c.t=0;}
    break;
   case 'carry':{
    for(let k=0;k<3;k++)c.th[k]-=1.25*h;
    const dx=HOME.x-c.x,dz=HOME.z-c.z,d=Math.hypot(dx,dz),sp=1.5*h;
    if(d<=sp){c.x=HOME.x;c.z=HOME.z;c.state='release';c.t=0;events.push({type:'release'});}
    else{c.x+=dx/d*sp;c.z+=dz/d*sp;}
    break;}
   case 'release':
    for(let k=0;k<3;k++)toward(k,CLAW.open,2.5);
    if(c.t>1.6){c.state='done';c.t=0;events.push({type:'done'});}
    break;
  }
  for(let k=0;k<3;k++)c.th[k]=Math.max(CLAW.closed,Math.min(c.state==='close'||c.state==='lift'||c.state==='carry'?CLAW.splay:CLAW.open,c.th[k]));
 }

 function wake(D){D.sleep=false;D.still=0;for(let i=D.first;i<D.first+D.n;i++)P.iw[i]=P.w[i];}
 function contact(i,nx,ny,nz,d,mvx,mvy,mvz,muS,muK){
  // 고정물/집게와 닿음: 밀어내고, 상대 미끄러짐을 마찰로 줄임(mv = 닿은 곳이 이번 단계에 움직인 양)
  P.x[i]+=nx*d;P.y[i]+=ny*d;P.z[i]+=nz*d;
  let rx=P.x[i]-P.ox[i]-mvx,ry=P.y[i]-P.oy[i]-mvy,rz=P.z[i]-P.oz[i]-mvz;
  const rn=rx*nx+ry*ny+rz*nz;rx-=rn*nx;ry-=rn*ny;rz-=rn*nz;
  const rt=Math.hypot(rx,ry,rz);if(rt<1e-9)return;
  const k=rt<muS*d?1:Math.min(1,muK*d/rt);
  P.x[i]-=rx*k;P.y[i]-=ry*k;P.z[i]-=rz*k;
 }

 function sub(){
  const h=SUB,N=P.x.length;
  clawLogic(h);
  curSegs=buildSegs(curSegs.length?curSegs:[]);
  // 0) 깨우기: 집게가 일하는 동안 집게 둘레 인형, 움직이는 인형의 이웃
  const busy=claw.state!=='idle'&&claw.state!=='move'&&claw.state!=='done';
  for(const D of dolls){if(D.gone)continue;
   if(D.sleep&&busy&&Math.abs(D.cx-claw.x)<D.br+1.4&&Math.abs(D.cz-claw.z)<D.br+1.4&&D.cy<claw.y+1)wake(D);}
  // 1) 움직이기
  for(let i=0;i<N;i++){
   if(dolls[P.d[i]].sleep){P.ox[i]=P.x[i];P.oy[i]=P.y[i];P.oz[i]=P.z[i];continue;}
   let vx=P.x[i]-P.ox[i],vy=P.y[i]-P.oy[i],vz=P.z[i]-P.oz[i];
   const v2=vx*vx+vy*vy+vz*vz, damp=v2<SLOW2?.6:.998;                  // 거의 멈춘 인형은 가라앉혀 떨림·기어감을 없앰
   vx*=damp;vy*=damp;vz*=damp;
   P.ox[i]=P.x[i];P.oy[i]=P.y[i];P.oz[i]=P.z[i];
   P.x[i]+=vx;P.y[i]+=vy-G*h*h;P.z[i]+=vz;
  }
  // 인형 대략 위치(넓게 거르기용)
  for(const D of dolls){D.cx=P.x[D.first];D.cy=P.y[D.first];D.cz=P.z[D.first];}
  claw.pen[0]=claw.pen[1]=claw.pen[2]=0;claw.hubPen=0;
  const hubMv=[claw.x-prevHub[0],claw.y-prevHub[1],claw.z-prevHub[2]];
  for(let it=0;it<ITER;it++){
   // 2) 모양 유지
   for(const [a,b,L] of cons){
    const dx=P.x[b]-P.x[a],dy=P.y[b]-P.y[a],dz=P.z[b]-P.z[a],l=Math.hypot(dx,dy,dz)||1e-9;
    if(!P.iw[a])continue;
    const s=(l-L)/l/(P.iw[a]+P.iw[b]);
    P.x[a]+=dx*s*P.iw[a];P.y[a]+=dy*s*P.iw[a];P.z[a]+=dz*s*P.iw[a];
    P.x[b]-=dx*s*P.iw[b];P.y[b]-=dy*s*P.iw[b];P.z[b]-=dz*s*P.iw[b];
   }
   // 3) 인형끼리
   for(let A=0;A<dolls.length;A++){const DA=dolls[A];if(DA.gone)continue;
    for(let B=A+1;B<dolls.length;B++){const DB=dolls[B];if(DB.gone||DA.sleep&&DB.sleep)continue;
     const rr=DA.br+DB.br;if(Math.abs(DA.cx-DB.cx)>rr||Math.abs(DA.cy-DB.cy)>rr||Math.abs(DA.cz-DB.cz)>rr)continue;
     for(let i=DA.first;i<DA.first+DA.n;i++)for(let j=DB.first;j<DB.first+DB.n;j++){
      const dx=P.x[j]-P.x[i],dy=P.y[j]-P.y[i],dz=P.z[j]-P.z[i],R2=P.r[i]+P.r[j];
      const l2=dx*dx+dy*dy+dz*dz;if(l2>=R2*R2)continue;
      const l=Math.sqrt(l2)||1e-9,nx=dx/l,ny=dy/l,nz=dz/l,d=R2-l;
      if(d>WAKE_D){if(DA.sleep)wake(DA);if(DB.sleep)wake(DB);}               // 세게 밀리면 깨어남
      const wi=P.iw[i],wj=P.iw[j],ws=wi+wj;if(!ws)continue;
      P.x[i]-=nx*d*wi/ws;P.y[i]-=ny*d*wi/ws;P.z[i]-=nz*d*wi/ws;P.x[j]+=nx*d*wj/ws;P.y[j]+=ny*d*wj/ws;P.z[j]+=nz*d*wj/ws;
      let rx=(P.x[j]-P.ox[j])-(P.x[i]-P.ox[i]),ry=(P.y[j]-P.oy[j])-(P.y[i]-P.oy[i]),rz=(P.z[j]-P.oz[j])-(P.z[i]-P.oz[i]);
      const rn=rx*nx+ry*ny+rz*nz;rx-=rn*nx;ry-=rn*ny;rz-=rn*nz;const rt=Math.hypot(rx,ry,rz);
      if(rt>1e-9){const k=rt<MU_S*d?1:Math.min(1,MU_K*d/rt);
       P.x[i]+=rx*k*wi/ws;P.y[i]+=ry*k*wi/ws;P.z[i]+=rz*k*wi/ws;P.x[j]-=rx*k*wj/ws;P.y[j]-=ry*k*wj/ws;P.z[j]-=rz*k*wj/ws;}
     }
    }
   }
   // 4) 바닥·벽·구멍 칸막이
   for(let i=0;i<N;i++){
    const r=P.r[i];if(dolls[P.d[i]].gone||dolls[P.d[i]].sleep)continue;
    const inChute=P.x[i]>CHUTE.x0&&P.x[i]<CHUTE.x1&&P.z[i]>CHUTE.z0&&P.z[i]<CHUTE.z1;
    if(!inChute&&P.y[i]<r)contact(i,0,1,0,r-P.y[i],0,0,0,MU_S,MU_K);
    if(P.x[i]<BOX.x0+r)contact(i,1,0,0,BOX.x0+r-P.x[i],0,0,0,.3,.2);
    if(P.x[i]>BOX.x1-r)contact(i,-1,0,0,P.x[i]-(BOX.x1-r),0,0,0,.3,.2);
    if(P.z[i]<BOX.z0+r)contact(i,0,0,1,BOX.z0+r-P.z[i],0,0,0,.3,.2);
    if(P.z[i]>BOX.z1-r&&P.y[i]>-.2)contact(i,0,0,-1,P.z[i]-(BOX.z1-r),0,0,0,.3,.2);
    if(P.y[i]>BOX.top-r)contact(i,0,-1,0,P.y[i]-(BOX.top-r),0,0,0,0,0);
    for(const W of WALLS){
     const qx=Math.max(W.x0,Math.min(W.x1,P.x[i])),qy=Math.max(W.y0,Math.min(W.y1,P.y[i])),qz=Math.max(W.z0,Math.min(W.z1,P.z[i]));
     const dx=P.x[i]-qx,dy=P.y[i]-qy,dz=P.z[i]-qz,l=Math.hypot(dx,dy,dz);
     if(l<r&&l>1e-6)contact(i,dx/l,dy/l,dz/l,r-l,0,0,0,.3,.2);
    }
    // 5) 집게 가운데 뭉치(공)
    {const dx=P.x[i]-claw.x,dy=P.y[i]-claw.y,dz=P.z[i]-claw.z,R2=r+CLAW.hub,l=Math.hypot(dx,dy,dz);
     if(l<R2&&l>1e-6){const d=R2-l;if(it===0)claw.hubPen=Math.max(claw.hubPen,d);contact(i,dx/l,dy/l,dz/l,d,hubMv[0],hubMv[1],hubMv[2],MU_CLAW_S,MU_CLAW_K);}}
    // 6) 집게발
    for(let s=0;s<curSegs.length;s++){
     const S=curSegs[s],Q=prevSegs[s]||S;
     const ex=S[3]-S[0],ey=S[4]-S[1],ez=S[5]-S[2],L2=ex*ex+ey*ey+ez*ez;
     let t=((P.x[i]-S[0])*ex+(P.y[i]-S[1])*ey+(P.z[i]-S[2])*ez)/L2;t=Math.max(0,Math.min(1,t));
     const qx=S[0]+ex*t,qy=S[1]+ey*t,qz=S[2]+ez*t;
     const dx=P.x[i]-qx,dy=P.y[i]-qy,dz=P.z[i]-qz,l=Math.hypot(dx,dy,dz),R2=r+CLAW.rad;
     if(l>=R2||l<1e-6)continue;
     const d=R2-l;
     if(it===0)claw.pen[S[6]]+=d/(P.w[i]*2)*(s&1?1.3:.4+t*.6);      // 무거운 공·발끝 쪽일수록 집게를 더 벌림(지렛대)
     const mx=qx-(Q[0]+(Q[3]-Q[0])*t),my=qy-(Q[1]+(Q[4]-Q[1])*t),mz=qz-(Q[2]+(Q[5]-Q[2])*t);
     contact(i,dx/l,dy/l,dz/l,d,mx,my,mz,MU_CLAW_S,MU_CLAW_K);
    }
   }
  }
  // 7) 집게 세기: 인형에 밀린 만큼 발이 되돌아감(약하면 많이 벌어짐)
  if(claw.state==='close'||claw.state==='lift'||claw.state==='carry'){
   for(let k=0;k<3;k++){const over=claw.pen[k]-claw.strength;if(over>0)claw.th[k]=Math.min(CLAW.splay,claw.th[k]+Math.min(1.25*SUB*4,over*BACK));}
  }
  // 잠들기: 0.6초 동안 거의 안 움직인 인형은 멈춰 둠(쌓인 더미가 슬금슬금 기어가지 않게)
  for(const D of dolls){if(D.gone||D.sleep)continue;
   let m=0;for(let i=D.first;i<D.first+D.n;i++)m=Math.max(m,Math.abs(P.x[i]-P.ox[i])+Math.abs(P.y[i]-P.oy[i])+Math.abs(P.z[i]-P.oz[i]));
   if(m<SLEEP_V*SUB&&!busy){D.still+=SUB;if(D.still>.6){D.sleep=true;for(let i=D.first;i<D.first+D.n;i++)P.iw[i]=0;}}
   else{D.still=0;if(m>NEIGH_V*SUB)for(const E of dolls)if(E.sleep&&Math.abs(E.cx-D.cx)<E.br+D.br&&Math.abs(E.cy-D.cy)<E.br+D.br&&Math.abs(E.cz-D.cz)<E.br+D.br)wake(E);}
  }
  // 8) 구멍에 빠짐 = 성공
  for(let di=0;di<dolls.length;di++){const D=dolls[di];if(D.gone)continue;
   if(P.y[D.first]<-1.2&&!D.won){D.won=true;events.push({type:'won',doll:di});}
   if(P.y[D.first]<-6){D.gone=true;}
  }
  const tmp=prevSegs;prevSegs=curSegs;curSegs=tmp;prevSegs=prevSegs.map(a=>a.slice());
  curSegs=prevSegs.map(a=>a.slice());
  prevHub=[claw.x,claw.y,claw.z];
 }
 return sim;
}
