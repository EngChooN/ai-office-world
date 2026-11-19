// 아이스링크 스케이트 타기 A안 「가벼운 미끄러짐」(월드개발, 2026-11-19). 시안 docs/크리스마스/스케이트-타기-시안-v1.html §2(c) A 값, 계산 artifacts/skate-design/sim.mjs.
// three 없음(점검·시뮬레이션에서 그대로 부름). 링크 안 움직임만 맡는다 — 광장 걷기·눈썰매·눈싸움은 이 파일을 쓰지 않는다.
//  - 움직임 skateStep: 몸(날)이 향한 쪽으로만 잘 나간다. 입력 쪽으로 몸을 돌리는 빠르기는 빠를수록 느려져 커브가 된다(조이스틱 8방향도 매끄럽게).
//    손을 떼면 감속 fric+drag·v로 약 2.2m 미끄러지고, 가는 쪽과 반대(120° 넘게)로 누르면 brake로 제동, 느리면(pivot 아래) 제자리에서 바로 돈다.
//    벽 쪽(wall 법선)으로 미는 힘·옆미끄럼은 벽을 따라가는 쪽으로 돌린다. 문 안쪽 gate m 안은 걷기 속도까지만.
//  - 자세 createSkateGait: 속도·가속·도는 빠르기·제동·휘청으로 동작 이름(stand·push·glide1·glide2·carve·brake·wobble)과 기울기를 정한다.
//    내 몸은 실제 입력으로, 다른 사람 몸은 받은 위치에서 알아낸 값(createSkateTrack)으로 같은 함수를 부른다(서버 변경 없음).
//  - 효과 createSkateFx: 날 자국·얼음 가루 자료(그림은 월드아트 그리기가 이 자료를 읽음). 휴대폰은 사람 수·조각 수 상한을 낮춘다.
export const SKATE=Object.freeze({
 vmax:2.4,acc:1.6,fric:1.15,drag:.08, // 최고 속도(m/s)·90%까지(초)·손 뗀 뒤 감속(m/s², + 속도×drag)
 turnLo:300,turnHi:150,pivotTurn:720, // 도는 빠르기(°/s): 느릴 때 → 최고 속도, pivot보다 느리면 제자리 돌기
 grip:7,carry:.85,                    // 옆미끄럼이 날 방향으로 모이는 빠르기(1/s)·그때 앞으로 옮겨 가는 몫
 brake:3.6,pivot:.5,oppCos:-.5,oppMin:.3, // 반대 입력 제동(m/s²)·제자리 돌기 속도·「반대」 판정(120°)·제동이 걸리는 최소 속도
 wallKeep:.8,wallHit:.6,wobble:.3,    // 벽에 세게(벽 쪽 속도 wallHit m/s 넘게) 닿으면 나란한 속도 80%만 남기고 0.3초 휘청
 gate:1.5,gateDecel:14,               // 문 안쪽 1.5m 안은 걷기 속도까지(초과분을 14m/s²로 빨리 줄임 — 최고 속도에서 약 0.1초)
 stop:.3,                             // 이보다 느리면 서기 자세(움직임은 0까지 계속 미끄러짐)
});
export const SKATE_TEXT=Object.freeze({in:'밀면 쭉 미끄러져요 · 반대로 당기면 멈춰요'});
const KACC=Math.log(10)/SKATE.acc,D2R=Math.PI/180;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const scale=(S,nv,v)=>{if(v>0){S.vx*=nv/v;S.vz*=nv/v;}};

export const createSkateState=()=>({vx:0,vz:0,heading:0,braking:false,pushing:false,wall:null,wallT:0,wobble:0});
// 날이 미는 쪽: 몸 앞(바라봄 = (−sin h, −cos h)). 벽에 닿아 있으면 벽 쪽 성분을 빼고 벽을 따라가는 쪽으로(거의 벽을 보면 null = 못 밈)
function blade(S,h){
 let fx=-Math.sin(h),fz=-Math.cos(h);const w=S.wall;
 if(w){const d=fx*w.x+fz*w.z;if(d>0){fx-=d*w.x;fz-=d*w.z;const l=Math.hypot(fx,fz);if(l<.2)return null;fx/=l;fz/=l;}}
 return [fx,fz];
}
// 한 걸음(속도·몸 방향만 바꿈, 자리 옮김·충돌은 부르는 쪽). dx,dz = 입력 방향(단위 또는 0), gateDist = 문 안쪽 자리까지 거리, walk = 걷기 속도
export function skateStep(S,dt,{dx=0,dz=0,gateDist=Infinity,walk=1.37}={}){
 const P=SKATE,input=!!(dx||dz);let v=Math.hypot(S.vx,S.vz),h=S.heading;
 S.braking=false;S.pushing=false;
 if(input){
  const d=wrap(Math.atan2(-dx,-dz)-h);
  if(v>P.oppMin&&(dx*S.vx+dz*S.vz)/v<P.oppCos){S.braking=true;scale(S,Math.max(0,v-P.brake*dt),v);}
  else{
   const t=(v<P.pivot?P.pivotTurn:P.turnLo+(P.turnHi-P.turnLo)*Math.min(1,v/P.vmax))*D2R*dt;h+=Math.max(-t,Math.min(t,d));
   const f=blade(S,h);
   if(f){const along=S.vx*f[0]+S.vz*f[1],push=Math.cos(Math.min(Math.abs(d),Math.PI/2));
    const na=along+(P.vmax-along)*(1-Math.exp(-dt*KACC))*push;S.vx+=(na-along)*f[0];S.vz+=(na-along)*f[1];S.pushing=push>.3;}
  }
 }else if(v>0)scale(S,Math.max(0,v-(P.fric+v*P.drag)*dt),v);
 // 옆미끄럼: 날 방향과 다른 속도는 grip으로 줄고, 그 몫의 carry는 날 방향(가는 쪽 부호)으로 옮겨 간다
 {const f=blade(S,h)??[-Math.sin(h),-Math.cos(h)],along=S.vx*f[0]+S.vz*f[1],lx=S.vx-along*f[0],lz=S.vz-along*f[1],k=Math.exp(-dt*P.grip);
  const keep=Math.hypot(lx,lz)*(1-k)*P.carry*(along>=0?1:-1);
  S.vx=along*f[0]+lx*k+f[0]*keep;S.vz=along*f[1]+lz*k+f[1]*keep;}
 // 문 앞: 걷기 속도까지만(「나가기」 단추 자리를 지나치지 않게)
 if(gateDist<P.gate){v=Math.hypot(S.vx,S.vz);if(v>walk)scale(S,Math.max(walk,v-P.gateDecel*dt),v);}
 S.heading=wrap(h);
 if(S.wobble>0)S.wobble=Math.max(0,S.wobble-dt);
 return S;
}
// 충돌 뒤 속도 정리: want = 가려던 자리, got = 충돌이 허락한 자리. 막힌 쪽(want−got) 속도만 버리고, 세게 닿았으면 휘청 + 나란한 속도 80%
export function skateWall(S,dt,want,got){
 const ex=want.x-got.x,ez=want.z-got.z,e=Math.hypot(ex,ez);
 if(e>1e-6){const nx=ex/e,nz=ez/e,vn=S.vx*nx+S.vz*nz;
  if(vn>0){S.vx-=vn*nx;S.vz-=vn*nz;if(vn>SKATE.wallHit){S.vx*=SKATE.wallKeep;S.vz*=SKATE.wallKeep;S.wobble=SKATE.wobble;}}
  S.wall={x:nx,z:nz};S.wallT=.12;return true;}
 if(S.wall&&(S.wallT-=dt)<=0)S.wall=null;
 return false;
}

// ── 자세(동작 이름) — 내 몸·다른 사람 몸 공용. 월드아트 동작 6종(밀기 좌·우, 한 발 활주, 두 발 활주, 커브 기울기, 멈추기, 휘청) + 서기
// update(dt, {v, a(속도 변화 m/s²), turn(몸 도는 빠르기 rad/s, 왼쪽 +), pressing, braking, wobble}) → {pose, side(±1), t(이 동작 경과 초), k(0~1 진행), lean(rad, 도는 안쪽 +)}
//  누르는 중: 밀기 0.5초 → 밀어낸 발 들고 한 발 활주(0~0.6초, 빠를수록 길게) 좌·우 번갈아, 최고 속도 근처면 세 번째마다 한 발 활주 1초
//  손 뗌: 두 발 활주(0.3m/s 아래면 서기) · 반대로 누름: 멈추기 · 벽: 휘청 0.3초 · 밀지 않고 기울기 5° 넘게 돌면 커브
export const GAIT=Object.freeze({push:.5,gapMax:.6,longGlide:1,longEvery:3,leanMax:15*D2R,leanK:.32,carveMin:5*D2R});
export function createSkateGait(){
 const G={pose:'stand',side:1,t:0,phase:'push',pt:0,n:0,lean:0};
 const out={pose:'stand',side:1,t:0,k:0,lean:0,events:[]};
 const set=p=>{if(G.pose!==p){G.pose=p;G.t=0;}};
 return {
  get state(){return out;},
  update(dt,{v=0,a=0,turn=0,pressing=false,braking=false,wobble=0}={}){
   out.events.length=0;G.t+=dt;
   const leanWant=Math.max(-GAIT.leanMax,Math.min(GAIT.leanMax,v*turn*GAIT.leanK));
   G.lean+=(leanWant-G.lean)*Math.min(1,dt*8);
   const wasBrake=G.pose==='brake';
   if(wobble>0)set('wobble');
   else if(braking&&v>SKATE.stop){set('brake');if(!wasBrake)out.events.push('stop');}
   else if(pressing&&v>.05){
    // 밀기 리듬
    if(G.pose!=='push'&&G.pose!=='glide1'){G.phase='push';G.pt=0;G.side=-G.side;G.n++;out.events.push('push');}
    G.pt+=dt;
    if(G.phase==='push'){if(G.pt>=GAIT.push){G.phase='gap';G.pt=0;}}
    else{const top=v>SKATE.vmax*.85,gap=top&&G.n%GAIT.longEvery===0?GAIT.longGlide:GAIT.gapMax*Math.min(1,v/SKATE.vmax);
     if(G.pt>=gap){G.phase='push';G.pt=0;G.side=-G.side;G.n++;out.events.push('push');}}
    const p=G.phase==='push'?'push':'glide1';if(G.pose!==p){G.pose=p;G.t=0;}
   }
   else if(v>SKATE.stop)set(Math.abs(G.lean)>GAIT.carveMin?'carve':'glide2');
   else set('stand');
   out.pose=G.pose;out.side=G.side;out.t=G.t;out.lean=G.lean;
   out.k=G.pose==='push'?Math.min(1,G.pt/GAIT.push):G.pose==='wobble'?Math.min(1,G.t/SKATE.wobble):0;
   return out;
  },
 };
}

// ── 다른 사람: 받은 위치(보간된 자리·몸 방향)만으로 속도·가속·도는 빠르기를 알아내 같은 자세 함수에 넣는다(서버·act 칸 변경 없음)
//  누르는 중 = 감속이 손 뗀 미끄러짐(약 1.2~1.3m/s²)보다 약함, 제동 = 1.75m/s² 넘게 줄어듦(손 뗀 감속은 최대 1.35), 휘청 = 순간 크게 줄어듦(벽)
export const TRACK=Object.freeze({tauV:.06,tauA:.1,tauW:.15,pressA:-.6,brakeA:-1.75,hitA:-7});
export function createSkateTrack(){
 const T={x:null,z:null,h:0,vx:0,vz:0,v:0,a:0,aFast:0,w:0,wob:0};
 const gait=createSkateGait();
 return {
  get gait(){return gait.state;},get v(){return T.v;},
  reset(){T.x=null;T.v=T.a=T.aFast=T.w=T.wob=0;T.vx=T.vz=0;},
  update(dt,{x,z,heading}){
   if(T.x===null||dt<=0){T.x=x;T.z=z;T.h=heading;return gait.update(dt,{});}
   const jump=Math.hypot(x-T.x,z-T.z)>2; // 순간이동(들어가기·나가기)
   const rvx=jump?0:(x-T.x)/dt,rvz=jump?0:(z-T.z)/dt;
   const kv=1-Math.exp(-dt/TRACK.tauV);T.vx+=(rvx-T.vx)*kv;T.vz+=(rvz-T.vz)*kv;
   const v=Math.hypot(T.vx,T.vz),ra=(v-T.v)/dt;T.v=v;
   T.a+=(ra-T.a)*(1-Math.exp(-dt/TRACK.tauA));T.aFast+=(ra-T.aFast)*(1-Math.exp(-dt/.05));
   T.w+=(wrap(heading-T.h)/dt-T.w)*(1-Math.exp(-dt/TRACK.tauW));
   if(T.aFast<TRACK.hitA&&v>.3)T.wob=SKATE.wobble;else T.wob=Math.max(0,T.wob-dt);
   T.x=x;T.z=z;T.h=heading;
   return gait.update(dt,{v,a:T.a,turn:T.w,pressing:v>.05&&T.a>TRACK.pressA,braking:T.a<TRACK.brakeA,wobble:T.wob});
  },
 };
}

// ── 날 자국·얼음 가루 자료(그림 없음). 그리기(월드아트)는 marks·powder 배열을 읽는다
//  marks: {x,z,h(몸 방향),side(±1, 두 줄이면 0),age} — 사람마다 최대 marks개, 오래된 것부터 지움, life초에 걸쳐 흐려짐(age/life)
//  powder: {x,y,z,vx,vy,vz,age} — 전체 최대 powder알, powderLife초
export const SKATE_FX=Object.freeze({
 pc:Object.freeze({people:8,marks:40,powder:80}),
 mobile:Object.freeze({people:3,marks:20,powder:30}),
 life:4,powderLife:.7,markStep:.28,markMin:.6,pushPowder:3,brakePowder:5,brakeEvery:.08,
});
export function createSkateFx({mobile=false,random=Math.random}={}){
 const cap=mobile?SKATE_FX.mobile:SKATE_FX.pc;
 const byOwner=new Map(),powder=[];
 const stats={marks:0,powder:0,owners:0,emitted:0,dropped:0};
 let rank=new Map(); // 다른 사람 순위(가까운 순, 0부터). 나는 늘 허용
 const allowed=owner=>owner==='me'||(rank.get(owner)??Infinity)<cap.people;
 function own(owner){let o=byOwner.get(owner);if(!o){o={list:[],acc:0,brakeT:0,seen:0};byOwner.set(owner,o);}return o;}
 function mark(owner,x,z,h,side=0){const o=own(owner);o.list.push({x,z,h,side,age:0});if(o.list.length>cap.marks)o.list.shift();stats.emitted++;}
 function dust(x,z,n,{spread=.5,up=.9,h=0}={}){
  for(let i=0;i<n;i++){if(powder.length>=cap.powder){stats.dropped++;powder.shift();}
   const a=h+Math.PI/2*(random()<.5?1:-1)+(random()-.5)*1.2,s=spread*(.4+random()*.6);
   powder.push({x,y:.03,z,vx:-Math.sin(a)*s,vy:up*(.5+random()*.5),vz:-Math.cos(a)*s,age:0});}
 }
 return {
  cap,marksOf(owner){return byOwner.get(owner)?.list??[];},get powder(){return powder;},stats,
  // 사람마다 매 프레임: 자리·속도·자세 → 자국·가루를 남김(허용된 사람만)
  emit(owner,dt,{x,z,heading=0,v=0,gait=null}={}){
   if(!allowed(owner))return false;
   const o=own(owner);o.seen=0;
   if(v>SKATE_FX.markMin){o.acc+=v*dt;if(o.acc>=SKATE_FX.markStep){o.acc=0;mark(owner,x,z,heading,gait?.pose==='glide1'||gait?.pose==='push'?gait.side:0);}}
   if(gait?.events.includes('push'))dust(x,z,SKATE_FX.pushPowder,{spread:.35,up:.5,h:heading});
   if(gait?.pose==='brake'){o.brakeT-=dt;if(o.brakeT<=0){o.brakeT=SKATE_FX.brakeEvery;dust(x,z,SKATE_FX.brakePowder,{spread:.9,up:1.1,h:heading});mark(owner,x,z,heading+Math.PI/2,0);}}
   return true;
  },
  // 다른 사람 순위(가까운 순 id 배열)
  setRank(ids){rank=new Map(ids.map((id,i)=>[id,i]));},
  update(dt){
   for(const [id,o] of byOwner){for(const m of o.list)m.age+=dt;while(o.list.length&&o.list[0].age>SKATE_FX.life)o.list.shift();
    o.seen+=dt;if(!o.list.length&&o.seen>2)byOwner.delete(id);}
   for(const p of powder){p.age+=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.vy-=4*dt;p.y=Math.max(.01,p.y+p.vy*dt);p.vx*=.96;p.vz*=.96;}
   while(powder.length&&powder[0].age>SKATE_FX.powderLife)powder.shift();
   let n=0;for(const o of byOwner.values())n+=o.list.length;stats.marks=n;stats.powder=powder.length;stats.owners=byOwner.size;
  },
  clear(){byOwner.clear();powder.length=0;},
 };
}
