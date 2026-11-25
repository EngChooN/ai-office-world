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
export const PLUSH_BODY=Object.freeze({squirrel:'bear',hare:'bunny',magpie:'chick',cat:'bear',dongdong:'bear','dongdong-office':'bear',haechi:'bear','dongdong-santa':'bear',
 // 11-25 추가 8종(그림 모양으로): 도토리·커피잔·부엉이 = 둥근 새 몸, 루돌프 = 뿔이 귀 자리라 토끼 몸, 눈사람·로봇·캠핑 동동이·별(위·양옆 꼭짓점) = 곰 몸
 kkulbam:'chick',nunsong:'bear',mongle:'chick',bueong:'chick',rudolph:'bunny',domdol:'bear','dongdong-camp':'bear',star:'bear'});
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
 const RANGE=clawRange(C,BOX,fingerReach(C,CLAW_RIG.drop),'claw');
 // 그림 집게 치수 → 단위: 머리 배율, 머리 가운데 = 물리 집게 가운데 + (clawTip − 쉼 자세 끝 깊이)
 return {BOX,CHUTE,WALLS,HOME,RANGE,floorY:C.floorY,guard:g,rig:{scale:C.clawTip/.14*k,headUp:C.clawTip*k-TIP_REST}};
}
// 집게 치수(시안 그대로: 손가락 길이 약 0.2m = 그림 CLAW.clawTip과 같음)
// 11-24 대표 지적 「집게가 작고 벌어지는 각도가 좁아 큰 인형이 안 잡힘」: 내려갈 때 벌림 drop 0.6 → 0.82(발끝 사이 약 19 → 30cm, 집게 크기 CLAW.clawTip 0.21 → 0.24와 함께).
//  open = 구멍 위에서 놓을 때 벌림 0.6 → 0.7(커진 집게 안에 낀 인형이 빠지게. 구멍 위 자리 CLAW.home을 (−0.28, 0.2)로 옮겨 발끝 0.189m가 앞·옆 유리 안: z 0.389 < 0.395, x 0.444 < 0.445)
export const CLAW_RIG=Object.freeze({hub:.34,hinge:.28,l1:1.4,l2:.55,bend:.75,rad:.09,open:.7,drop:.82,closed:-.04,rest:.18,minY:1.85,splay:1.0});
const TIP_REST=CLAW_RIG.l1*Math.cos(CLAW_RIG.rest)+CLAW_RIG.l2*Math.cos(CLAW_RIG.rest-CLAW_RIG.bend);
// 닿음 판정 = 보이는 손가락 그대로(대표 지적 2026-11-23 「집게가 통과하는 것처럼 보임」): 예전 판정 손가락(0.9cm 막대 두 마디)은 그림(휜 관 반지름 .007·끝 구슬 .011,
//  머리 배율 clawTip/0.14)보다 가늘고 모양이 달라 인형 속으로 최대 4cm 들어가 보였다. claw-machine-art.js buildClaw 곡선(CatmullRom)을 8토막으로 뽑은 점(손가락 쪽 [y,z], m, 머리 배율 전)
export const FINGER_CURVE=Object.freeze([[0,0],[-.0143,.0144],[-.0289,.0283],[-.0468,.0375],[-.0701,.0425],[-.0933,.0419],[-.1113,.0331],[-.1258,.0169],[-.14,0]].map(Object.freeze));
/** 벌림 th(물리 각)에서 손가락이 머리 가운데에서 바깥으로 가장 멀리 나간 거리(m, 관 굵기 포함) — 그림 곡선 그대로 */
export function fingerReach(C,th){const CL=CLAW_RIG,o=Math.max(0,Math.min(1,(th-CL.closed)/(CL.splay-CL.closed))),an=FINGER_ANGLE_C.shut+o*(FINGER_ANGLE_C.wide-FINGER_ANGLE_C.shut),ca=Math.cos(an),sa=Math.sin(an);
 let m=0;for(const [y,z] of FINGER_CURVE)m=Math.max(m,y*sa+z*ca+FINGER_PIVOT);return (m+FINGER_TIP)*C.clawTip/.14;}
/**
 * 집게 가운데가 갈 수 있는 범위(단위) = 기계 조작 범위 C.play ∩ 내려가며 벌린 발끝이 유리 안쪽 면 안에 머무는 곳(11-24: 집게를 키우며 유리를 뚫지 않게).
 * kind 'claw' = 손가락 셋(앞 +z 1개, 뒤 좌우 2개: x 쪽 0.866·뒤 0.5배), 'bridge' = 손가락 둘(±x)
 */
export const GLASS_IN=Object.freeze({side:.02,front:.02,back:.04}); // 유리판 = 기계 반폭·반깊이에서 이만큼 안(claw-machine-art.js 옆·앞 유리 hw−0.02·hd−0.02, 뒤 판 −hd+0.04)
export function clawRange(C,BOX,reach,kind){const k=1/U,r=reach*k,m=.01*k,gx=(C.width/2-GLASS_IN.side)*k,gf=(C.depth/2-GLASS_IN.front)*k,gb=(C.depth/2-GLASS_IN.back)*k;
 const ex=kind==='bridge'?r:r*.866,ef=kind==='bridge'?.02*k:r,eb=kind==='bridge'?.02*k:r*.5;
 return {x0:Math.max(C.play.x[0]*k,-gx+ex+m),x1:Math.min(C.play.x[1]*k,gx-ex-m),z0:Math.max(C.play.z[0]*k,-gb+eb+m),z1:Math.min(C.play.z[1]*k,gf-ef-m)};}
export const FINGER_TUBE=.007,FINGER_TIP=.011,FINGER_PIVOT=.03,HEAD_BALL=.03; // 관 반지름·끝 구슬·손가락 뿌리(머리 가운데에서)·머리 구슬(m, 배율 전)
export const FINGER_ANGLE_C=Object.freeze({shut:.3,wide:-.57}); // claw-machine-art.js FINGER_ANGLE과 같음
export const toMachine=(g,x,y,z)=>[x*U,g.floorY+y*U,z*U];

const CLAW_TIP_DEFAULT=.21/.14/.1;
// 토막이 2개 → 9개(+끝 구슬)로 늘어 같은 깊이에 힘이 여러 번 더해짐: 예전 두 마디와 비슷한 세기가 되게 나눔
const SEG_SHARE=.35,SINK=1.5,SINK_MAX=.5; // 가라앉기 = 초당 15cm, 조이기 시작에서 5cm까지
// RK_BACK(11-24): 손가락 하나에 남은 겹침이 3mm를 넘으면(바닥·벽에 막힌 인형을 조임) 세기와 상관없이 그 손가락이 벌어짐 — 커진 집게가 누운 인형에 0.9cm 파고들어 보였음
const RK_BACK=.03,G=38,SUB=1/240,ITER=6,SLOW2=(.25*SUB)**2,BACK=12,SLEEP_V=.35,NEIGH_V=1.2,WAKE_D=.02,MU_S=.55,MU_K=.4,MU_CLAW_S=.6,MU_CLAW_K=.42;
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
  state:'idle',t:0,pen:[0,0,0],hubPen:0,resid:0,rk:[0,0,0],power:{...power},strength:0,touched:false,liftFrom:0};
 // 손가락 토막(단위): 그림 곡선 8토막 + 끝 구슬. [ax,ay,az, bx,by,bz, 발 k, 반지름, 세기 몫(끝일수록 크게 — 예전 끝 마디 1.3)]
 // 그림 각도 = FINGER_ANGLE_C.shut + 벌림(0~1, clawPose opens와 같은 식) × (wide − shut). 물리 발 k의 방향 = ang[k](그림 손가락 0·1·2 = 물리 0·2·1)
 const RG=geom.rig??{scale:CLAW_TIP_DEFAULT,headUp:0},NSEG=FINGER_CURVE.length-1;
 const buildSegs=out=>{out.length=0;const S=RG.scale,hy=claw.y+RG.headUp;
  for(let k=0;k<3;k++){const a=claw.ang[k],ux=Math.cos(a),uz=Math.sin(a),o=Math.max(0,Math.min(1,(claw.th[k]-CL.closed)/(CL.splay-CL.closed)));
   const an=FINGER_ANGLE_C.shut+o*(FINGER_ANGLE_C.wide-FINGER_ANGLE_C.shut),ca=Math.cos(an),sa=Math.sin(an);
   const W=([y,z])=>{const y1=y*ca-z*sa,z1=y*sa+z*ca+FINGER_PIVOT;return [claw.x+ux*z1*S,hy+y1*S,claw.z+uz*z1*S];};
   let p=W(FINGER_CURVE[0]);for(let i=1;i<=NSEG;i++){const q=W(FINGER_CURVE[i]);out.push([p[0],p[1],p[2],q[0],q[1],q[2],k,FINGER_TUBE*S,i>NSEG-3?1.3:.4+.6*i/NSEG]);p=q;}
   out.push([p[0],p[1],p[2],p[0],p[1],p[2],k,FINGER_TIP*S,1.3]);}
  return out;};
 let prevSegs=buildSegs([]),curSegs=[],prevHub=[claw.x,claw.y,claw.z];
 const events=[];
 const sim={P,dolls,claw,events,geom,
  /** 조작 중 집게 자리(단위, 범위 안으로 자름) */
  setPos(x,z){claw.x=Math.max(RANGE.x0,Math.min(RANGE.x1,x));claw.z=Math.max(RANGE.z0,Math.min(RANGE.z1,z));},
  start(){claw.state='move';claw.t=0;sim.setPos(HOME.x,HOME.z);claw.y=HOME.y;for(const D of dolls)D.lifted=0;},
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
  /** 직원 도움(11-24 대표 결정: 집게 기계 보장 = 힘센 집게 → 직원 도움): 인형 di를 (x,z)(단위) 바닥에 똑바로 세워 둠(멈춘 채, 그 자리 더미 위면 그 위). 판 시작 전에만 부름 */
  staffPlace(di,x,z,yaw=0){const D=dolls[di];if(!D||D.gone||D.won)return false;
   let base=0;for(const E of dolls){if(E===D||E.gone)continue;for(let i=E.first;i<E.first+E.n;i++){const dx=P.x[i]-x,dz=P.z[i]-z,r=P.r[i]+D.br*.6;if(dx*dx+dz*dz<r*r)base=Math.max(base,P.y[i]+P.r[i]);}}
   const cy=Math.cos(yaw),sy=Math.sin(yaw),y=base+D.bottom+.02;
   D.parts.forEach(([lx,ly,lz],k)=>{const i=D.first+k;P.x[i]=P.ox[i]=x+lx*cy+lz*sy;P.y[i]=P.oy[i]=y+ly;P.z[i]=P.oz[i]=z-lx*sy+lz*cy;});
   wake(D);D.cx=x;D.cy=y;D.cz=z;D.lifted=0;return true;},
 };
 sim.settle(prewarm);events.length=0;for(const D of dolls)if(D.won){D.gone=true;D.won=false;}

 function clawLogic(h){
  const c=claw;c.t+=h;
  const toward=(k,target,rate)=>{const d=target-c.th[k];c.th[k]+=Math.sign(d)*Math.min(Math.abs(d),rate*h);};
  switch(c.state){
   case 'idle':case 'done':case 'move':for(let k=0;k<3;k++)toward(k,CL.rest,1.5);break;
   case 'drop':
    for(let k=0;k<3;k++)toward(k,CL.drop,2.2);
    if(c.t<.45)break;
    c.y-=2.6*h;
    // 닿으면 멈춤: 누른 힘·머리 닿음·못 밀어낸 겹침(인형이 바닥·벽에 눌려 꼼짝 못 함 — 줄이 느슨해지듯 거기서 멈추고 겹친 만큼 물러남)
    if(c.hubPen>.012||c.pen[0]+c.pen[1]+c.pen[2]>.09||c.resid>.03)c.touched=true;
    if(c.y<=CL.minY||c.touched&&c.t>.6){c.y=Math.max(c.y,CL.minY)+c.resid;c.state='close';c.t=0;c.sinkFrom=c.y;c.strength=c.power.grab;events.push({type:'close'});}
    break;
   // 조이는 동안 줄이 느슨한 집게가 제 무게로 인형 사이로 가라앉음(초당 SINK, 최대 SINK_MAX, 막히면 멈춤) — 발끝이 인형 밑으로 들어가 걸림
   case 'close':for(let k=0;k<3;k++)c.th[k]-=1.25*h;if(c.resid<.02&&c.y>CL.minY)c.y=Math.max(CL.minY,c.sinkFrom-SINK_MAX,c.y-SINK*h);if(c.t>1.0){c.state='lift';c.t=0;c.liftFrom=c.y;events.push({type:'lift'});}break;
   case 'lift':for(let k=0;k<3;k++)c.th[k]-=1.25*h;if(c.t>.35)c.y+=2.2*h;if(c.y-c.liftFrom>1.2)c.strength=c.power.carry;if(c.y>=HOME.y){c.y=HOME.y;c.state='carry';c.t=0;}break;
   case 'carry':{for(let k=0;k<3;k++)c.th[k]-=1.25*h;const dx=HOME.x-c.x,dz=HOME.z-c.z,d=Math.hypot(dx,dz),sp=1.5*h;
    if(d<=sp){c.x=HOME.x;c.z=HOME.z;c.state='release';c.t=0;events.push({type:'release'});}else{c.x+=dx/d*sp;c.z+=dz/d*sp;}break;}
   case 'release':for(let k=0;k<3;k++)toward(k,CL.open,2.5);if(c.t>1.6){c.state='done';c.t=0;events.push({type:'done'});}break;
  }
  for(let k=0;k<3;k++)c.th[k]=Math.max(c.power.closeMin??CL.closed,Math.min( // power.closeMin = 덜 오므라짐(T.claw.power)
  c.state==='close'||c.state==='lift'||c.state==='carry'?CL.splay:c.state==='drop'?CL.drop:CL.open,c.th[k]));
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
  claw.pen[0]=claw.pen[1]=claw.pen[2]=0;claw.rk[0]=claw.rk[1]=claw.rk[2]=0;claw.hubPen=0;claw.resid=0;
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
    {const dx=P.x[i]-claw.x,dy=P.y[i]-claw.y-RG.headUp,dz=P.z[i]-claw.z,R2=r+HEAD_BALL*RG.scale,l=Math.hypot(dx,dy,dz);
     if(l<R2&&l>1e-6){const d=R2-l;if(it===0)claw.hubPen=Math.max(claw.hubPen,d);contact(i,dx/l,dy/l,dz/l,d,hubMv[0],hubMv[1],hubMv[2],MU_CLAW_S,MU_CLAW_K);}}
    for(let s=0;s<curSegs.length;s++){
     const S=curSegs[s],Q=prevSegs[s]||S,ex=S[3]-S[0],ey=S[4]-S[1],ez=S[5]-S[2],L2=ex*ex+ey*ey+ez*ez||1;
     let t=((P.x[i]-S[0])*ex+(P.y[i]-S[1])*ey+(P.z[i]-S[2])*ez)/L2;t=Math.max(0,Math.min(1,t));
     const qx=S[0]+ex*t,qy=S[1]+ey*t,qz=S[2]+ez*t,dx=P.x[i]-qx,dy=P.y[i]-qy,dz=P.z[i]-qz,l=Math.hypot(dx,dy,dz),R2=r+S[7];
     if(l>=R2||l<1e-6)continue;const d=R2-l;if(it===ITER-1){if(d>claw.resid)claw.resid=d;if(d>claw.rk[S[6]])claw.rk[S[6]]=d;}
     if(it===0)claw.pen[S[6]]+=d/(P.w[i]*2)*S[8]*SEG_SHARE;
     contact(i,dx/l,dy/l,dz/l,d,qx-(Q[0]+(Q[3]-Q[0])*t),qy-(Q[1]+(Q[4]-Q[1])*t),qz-(Q[2]+(Q[5]-Q[2])*t),MU_CLAW_S,MU_CLAW_K);
    }
   }
  }
  if(claw.state==='close'||claw.state==='lift'||claw.state==='carry')for(let k=0;k<3;k++){const over=Math.max(claw.pen[k]-claw.strength,claw.rk[k]>RK_BACK?claw.rk[k]:0);if(over>0)claw.th[k]=Math.min(CL.splay,claw.th[k]+Math.min(1.25*SUB*4,over*BACK));}
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

/**
 * 직원 도움 계획·실행(집게 기계 보장 판 시작 때, 11-24 대표 결정): 구멍 뒤 턱 바로 뒤(구멍 가운데 줄, 턱에서 0.85단위 = 8.5cm, 집게가 닿는 범위 안)에
 * 그 자리에 가장 가까운 인형 하나를 세워 두고 잠깐 가라앉힘 — 들기만 하면 구멍이 바로 앞. 자리 고르기 시험: 구멍 옆 빈 바닥 22%·더미 가운데 20%(40더미×2), 턱 뒤 5.5·7·8.5·10cm = 37·42·45·43%(120더미).
 * 반환 {di,x,z}(단위) 또는 null
 */
export function staffHelp(sim,settleSec=.8,yaw=Math.PI/2,back=.85){
 const {CHUTE,RANGE}=sim.geom,x=Math.max(RANGE.x0+.2,(CHUTE.x0+CHUTE.x1)/2),z=Math.max(RANGE.z0+.2,CHUTE.z0-back);
 let di=-1,bd=Infinity;sim.dolls.forEach((D,i)=>{if(D.gone||D.won)return;const d=Math.hypot(D.cx-x,D.cz-z);if(d<bd){bd=d;di=i;}});
 if(di<0||!sim.staffPlace(di,x,z,yaw))return null;
 sim.settle(settleSec);return {di,x,z};
}
