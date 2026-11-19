// 남산 그림 자료 읽기·지형 높이(월드아트, 11-19). three 없음 — 게임·미리보기·점검 스크립트가 같이 쓴다.
// 자료는 scripts/namsan/build-namsan-data.mjs가 만든 assets/shared/namsan/*. 좌표는 관악산과 같은 게임 좌표(geo.js, 1m, +X 동, -Z 북).
import {indexRoute,cutHeight,project} from '../../assets/realistic/geo.js';

// 그림 배치 기준값. 거리 s는 코스 시작(백범광장)부터 m.
export const NAMSAN=Object.freeze({
 pathWidth:2.6,          // 코스 노면 폭(관악산 2.2m보다 넓은 정비된 길)
 canopy:7,               // 숲 칸에서 DSM(나무 꼭대기 높이)을 낮춰 땅으로 쓰는 양(m). 그 위에 나무를 심어 숲 윗선이 실제 자료와 맞게(실루엣 대조로 정함)
 stairWidth:2.4,         // 돌계단 폭
 riser:.16,              // 계단 한 단 높이(목표값, 구간마다 단 수로 나눠 맞춤)
 tower:project(37.551216,126.988276), // 게임 속 「남산 전망탑」 자리(조사 자료 좌표, 모양은 게임 디자인)
 plazaRadius:46,         // 정상 광장 반지름(전망탑 둘레)
 startPlazaRadius:22,    // 출발 광장 반지름
 // 설계서 §2·§5: 스탬프 4곳, 이정표 4개, 쉼터
 stamps:[{n:1,glyph:'門',name:'성곽 입구',s:8},{n:2,glyph:'城',name:'성곽 큰 계단',s:600},{n:3,glyph:'望',name:'서쪽 전망 쉼터',s:790},{n:4,glyph:'塔',name:'남산 정상',s:1060}],
 signs:[{s:14,boards:['남산 정상 1.1km','성곽길','뒤를 돌아보면 서울역']},{s:400,boards:['정상 0.7km','이제부터 성곽 계단']},{s:800,boards:['정상 250m','마지막 계단','남서쪽 전망']},{s:1030,boards:['관악산 12km','북한산 12km']}],
 rest:{s:770},
 label:{name:'남산',height:265},
});

async function readJSON(url){const r=await fetch(url);if(!r.ok)throw new Error(`남산 자료 없음 (${r.status}): ${url}`);return r.json();}
// base = `${import.meta.env.BASE_URL}assets/shared/namsan/`
export async function loadNamsanData(base,{forest=true}={}){
 const meta=await readJSON(base+'namsan-meta.json');
 const bin=f=>fetch(base+f).then(r=>{if(!r.ok)throw new Error(`남산 자료 없음: ${f}`);return r.arrayBuffer();});
 const [buf,landBuf,course,walls,trees,busRoad]=await Promise.all([bin(meta.terrain.file),bin(meta.landcover.file),
  readJSON(base+'course.json'),readJSON(base+'walls.json'),forest?readJSON(base+'forest.json'):null,
  readJSON(base+'bus-road.json').catch(()=>null)]);  // 순환버스 차로(없으면 버스 없이)
 return {meta,terrain:{...meta.terrain,values:new Float32Array(buf),land:new Uint8Array(landBuf)},course,walls:walls.walls,forest:trees,busRoad};
}

// 코스 위 s 자리의 점·방향(접선 tx,tz, 오른쪽 법선 nx,nz). 오른쪽 = 오르는 사람의 오른손.
export function courseAt(points,s){
 s=Math.max(0,Math.min(points.at(-1).s,s));let i=0;while(i<points.length-2&&points[i+1].s<s)i++;
 const a=points[i],b=points[i+1],t=(s-a.s)/((b.s-a.s)||1),L=Math.hypot(b.x-a.x,b.z-a.z)||1,tx=(b.x-a.x)/L,tz=(b.z-a.z)/L;
 return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t,tx,tz,nx:-tz,nz:tx,heading:Math.atan2(-tx,-tz),stairs:a.stairs,index:i};
}

// 화면 지형 높이. raw = DSM 그대로, ground = 코스 회랑을 길 높이로 깎고(관악산 cutHeight와 같은 식) 두 광장을 평평하게 한 값.
export function createNamsanGround(data){
 const T=data.terrain,pts=data.course.points.map(p=>({...p,width:NAMSAN.pathWidth}));
 const raw=(x,z)=>{
  const u=Math.max(0,Math.min(T.width-1.001,(x-T.x0)/T.spacing)),v=Math.max(0,Math.min(T.height-1.001,(z-T.z0)/T.spacing));
  const i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j,V=T.values,W=T.width;
  return (V[j*W+i]*(1-fx)+V[j*W+i+1]*fx)*(1-fy)+(V[(j+1)*W+i]*(1-fx)+V[(j+1)*W+i+1]*fx)*fy;
 };
 // 숲·공원(1)/시가지(0) 칸 — 가장 가까운 칸 값
 const park=(x,z)=>{const i=Math.round((x-T.x0)/T.spacing),j=Math.round((z-T.z0)/T.spacing);if(i<0||j<0||i>=T.width||j>=T.height)return 0;return T.land[j*T.width+i];};
 // 숲 칸을 32m 상자 흐림으로 부드럽게 한 값(0~1). 숲 가장자리에서 땅이 계단처럼 꺼지지 않게 한다.
 const soft=new Float32Array(T.width*T.height);{const R=4,W=T.width,H=T.height,tmp=new Float32Array(W*H);
  for(let j=0;j<H;j++){let a=0;for(let i=-R;i<W+R;i++){const add=i+R<W?T.land[j*W+Math.min(W-1,i+R)]:0,sub=i-R-1>=0?T.land[j*W+i-R-1]:0;a+=add-sub;if(i>=0&&i<W)tmp[j*W+i]=a/(2*R+1);}}
  for(let i=0;i<W;i++){let a=0;for(let j=-R;j<H+R;j++){const add=j+R<H?tmp[Math.min(H-1,j+R)*W+i]:0,sub=j-R-1>=0?tmp[(j-R-1)*W+i]:0;a+=add-sub;if(j>=0&&j<H)soft[j*W+i]=a/(2*R+1);}}}
 const forestK=(x,z)=>{const u=Math.max(0,Math.min(T.width-1.001,(x-T.x0)/T.spacing)),v=Math.max(0,Math.min(T.height-1.001,(z-T.z0)/T.spacing)),i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j,W=T.width;
  return (soft[j*W+i]*(1-fx)+soft[j*W+i+1]*fx)*(1-fy)+(soft[(j+1)*W+i]*(1-fx)+soft[(j+1)*W+i+1]*fx)*fy;};
 const nearest=indexRoute(pts),start=pts[0],end=pts.at(-1),tw=NAMSAN.tower;
 // 정상 광장은 전망탑과 코스 끝을 함께 품는다(중심은 둘의 가운데에서 탑 쪽).
 const plaza={x:tw.x*.6+end.x*.4,z:tw.z*.6+end.z*.4,y:end.y,r:NAMSAN.plazaRadius};
 const startPlaza={x:start.x,z:start.z,y:start.y,r:NAMSAN.startPlazaRadius};
 const flat=(h,x,z,P,edge=18)=>{const d=Math.hypot(x-P.x,z-P.z);if(d>=P.r+edge)return h;const t=Math.max(0,(d-P.r)/edge),k=t*t*(3-2*t);return P.y+(h-P.y)*k;};
 function ground(x,z){
  let h=raw(x,z)-NAMSAN.canopy*forestK(x,z);const hit=nearest(x,z);
  if(hit.distance<40){h=cutHeight(h,hit);
   // 돌계단 밑은 0.25m 더 낮춘다(단 윗면이 걷는 높이 ±8cm라 뒤쪽 반이 땅에 묻히지 않게)
   if(pts[hit.index]?.stairs&&hit.distance<NAMSAN.stairWidth/2+1.2){const k=1-Math.max(0,(hit.distance-NAMSAN.stairWidth/2-.4)/.8);h-=.25*Math.min(1,k);}}
  h=flat(h,x,z,startPlaza);h=flat(h,x,z,plaza,22);
  return h;
 }
 const G={raw,ground,park,forestK,nearest,plaza,startPlaza,points:pts,bounds:{x0:T.x0,z0:T.z0,x1:T.x0+(T.width-1)*T.spacing,z1:T.z0+(T.height-1)*T.spacing}};
 if(data.busRoad)G.bus=createBusLane(G,data.busRoad);
 return G;
}

// ── 순환버스 차로(월드아트 11-19): 높이를 정하고 차로 둘레 땅을 차로 높이로 깎거나 돋운다(G.ground를 바꿈) ──
// 차로 선 모양은 bus-road.json(OSM 소월로→남산공원길 참고, 게임 속 차로). 끝은 정상 광장 안쪽까지 곧게 이어 붙인다(실제 길은 광장보다 13m 낮게 끝남).
// 높이 = 앞뒤 40m 땅 중 낮은 쪽 30% → 부드럽게 → 두 광장 안은 광장 높이 → 경사 15% 안(앞뒤 두 번).
// 걷는 코스 쪽으로 갈수록 원래 땅(코스 높이가 이김, 11-19 기준 차로와 코스는 8m 안으로 만나지 않음). 버스 위치·시간표는 월드개발 namsan-bus.js 몫.
export const BUS_ROAD=Object.freeze({width:6.4,curb:.22,shoulder:12,grade:.15,
 inset:14,     // 정상 광장 가장자리 안쪽으로 이만큼 차로를 들인다(광장 안 부분은 판석이 덮고 버스 세우는 칸만 칠함)
 stopBay:16,   // 정류장 버스 세우는 칸 길이(버스 7.6m + 앞뒤 여유)
});
export function busAt(lane,s){return courseAt(lane.points,s);}
export function createBusLane(G,road){
 const base=G.ground,SP=G.startPlaza,PP=G.plaza,P=road.points.map(p=>({x:p.x,z:p.z,s:p.s}));
 // 정상 광장 쪽 이어 붙이기: 끝점에서 광장 가운데 쪽으로, 가장자리 안 inset m까지 3m 간격
 {const e=P.at(-1),dx=PP.x-e.x,dz=PP.z-e.z,D=Math.hypot(dx,dz),L=D-(PP.r-BUS_ROAD.inset);
  if(L>0){const n=Math.ceil(L/3);for(let k=1;k<=n;k++){const t=L*k/n;P.push({x:e.x+dx/D*t,z:e.z+dz/D*t,s:e.s+t});}}
  // 이어 붙인 곳 꺾임을 둥글게(앞뒤 6점)
  const j0=road.points.length-1;for(let pass=0;pass<3;pass++)for(let i=Math.max(1,j0-6);i<Math.min(P.length-1,j0+6);i++){P[i].x=(P[i-1].x+P[i].x*2+P[i+1].x)/4;P[i].z=(P[i-1].z+P[i].z*2+P[i+1].z)/4;}
  for(let i=1;i<P.length;i++)P[i].s=P[i-1].s+Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);}
 const g0=P.map(p=>base(p.x,p.z)),inPlaza=p=>Math.hypot(p.x-SP.x,p.z-SP.z)<SP.r+2?SP.y:Math.hypot(p.x-PP.x,p.z-PP.z)<PP.r+2?PP.y:null;
 let y=g0.map((_,i)=>{const w=[];for(let j=Math.max(0,i-14);j<=Math.min(P.length-1,i+14);j++)w.push(g0[j]);w.sort((a,b)=>a-b);return w[Math.floor(w.length*.3)];});
 for(let pass=0;pass<6;pass++)y=y.map((v,i)=>{let a=0,n=0;for(let j=Math.max(0,i-4);j<=Math.min(y.length-1,i+4);j++){a+=y[j];n++;}return a/n;});
 const lock=P.map(inPlaza);y=y.map((v,i)=>lock[i]??v);
 // 경사 제한: 앞→뒤, 뒤→앞. 광장 안 점은 고정
 for(let i=1;i<P.length;i++){if(lock[i]!=null)continue;const d=(P[i].s-P[i-1].s)*BUS_ROAD.grade;y[i]=Math.min(y[i-1]+d,Math.max(y[i-1]-d,y[i]));}
 for(let i=P.length-2;i>=0;i--){if(lock[i]!=null)continue;const d=(P[i+1].s-P[i].s)*BUS_ROAD.grade;y[i]=Math.min(y[i+1]+d,Math.max(y[i+1]-d,y[i]));}
 P.forEach((p,i)=>{p.y=+y[i].toFixed(2);p.width=BUS_ROAD.width;p.s=+p.s.toFixed(2);});
 const near=indexRoute(P),half=BUS_ROAD.width/2,courseClear=NAMSAN.pathWidth/2+2;
 G.ground=(x,z)=>{const h=base(x,z),hit=near(x,z);if(hit.distance>half+BUS_ROAD.shoulder)return h;
  const k=Math.max(0,Math.min(1,(hit.distance-half-.6)/BUS_ROAD.shoulder)),t=k*k*(3-2*k),road=hit.y-.04;
  const cw=Math.max(0,Math.min(1,(G.nearest(x,z).distance-courseClear)/BUS_ROAD.shoulder));
  return h+(road-h)*(1-t)*cw;};
 const end=P.at(-1).s;
 return {points:P,length:end,nearest:near,ground0:base,...busCycle(G,P,near)};
}

// ── 버스가 실제로 도는 길(cycle): 백범광장 고리 → 오르는 차선 → 정상 광장 고리 → 내려오는 차선 → (처음으로). 한 줄로 이어진 닫힌 길 ──
// 차선은 차로 가운데에서 진행 방향 오른쪽 1.6m(우측 통행). 두 광장에서는 가장자리 안쪽 고리를 시계 반대(x→z) 방향으로 돌아
// 버스 오른쪽(문 쪽)이 늘 광장 가운데를 본다 — 정류장·하차 지점은 이 고리 위, 문 앞이 걷는 광장.
// 월드개발: s(시간) → courseAt(cycle.points,s)로 위치·방향, 정류장은 cycle.stops.*.s, 구간은 cycle.legs.
export const BUS_CYCLE=Object.freeze({lane:1.6,startRing:4,summitRing:6,step:2});
function busCycle(G,P,near){
 const SP=G.startPlaza,PP=G.plaza,Rs=SP.r-BUS_CYCLE.startRing,Rp=PP.r-BUS_CYCLE.summitRing;
 let iA=0;while(iA<P.length-1&&Math.hypot(P[iA].x-SP.x,P[iA].z-SP.z)<Rs)iA++;
 let iB=P.length-1;while(iB>0&&Math.hypot(P[iB].x-PP.x,P[iB].z-PP.z)<Rp)iB--;
 const off=(i,o)=>{const m=courseAt(P,P[i].s);return {x:m.x+m.nx*o,z:m.z+m.nz*o};};
 const up=[],down=[];for(let i=iA;i<=iB;i++)up.push(off(i,BUS_CYCLE.lane));for(let i=iB;i>=iA;i--)down.push(off(i,-BUS_CYCLE.lane));
 // 고리: 도착 각 → 떠나는 각, 각이 늘어나는 쪽(x→z)으로. 너무 짧으면 한 바퀴 더(급히 꺾지 않게).
 // 차선 끝 12m를 덜어 내고 고리 끝 12m도 덜어 낸 뒤 그 사이를 매끈한 곡선(3차 에르미트)으로 잇는다.
 const ang=(C,p)=>Math.atan2(p.z-C.z,p.x-C.x),TRIM=12;
 const ringArc=(C,R,from,to)=>{let a0=ang(C,from)+TRIM/R,a1=ang(C,to)-TRIM/R;while(a1<=a0)a1+=Math.PI*2;if(a1-a0<Math.PI*.6)a1+=Math.PI*2;const n=Math.ceil((a1-a0)*R/BUS_CYCLE.step),out=[];
  for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n;out.push({x:C.x+Math.cos(a)*R,z:C.z+Math.sin(a)*R,tx:-Math.sin(a),tz:Math.cos(a)});}return out;};
 const k=Math.ceil(TRIM/3),U=up.slice(k,-k),D=down.slice(k,-k);
 const tan=(pts,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b.x-a.x,b.z-a.z)||1;return {tx:(b.x-a.x)/l,tz:(b.z-a.z)/l};};
 const join=(p0,t0,p1,t1)=>{const L=Math.hypot(p1.x-p0.x,p1.z-p0.z),n=Math.max(2,Math.ceil(L/BUS_CYCLE.step)),m=L*.9,out=[];
  for(let i=1;i<n;i++){const t=i/n,h1=2*t**3-3*t**2+1,h2=t**3-2*t**2+t,h3=-2*t**3+3*t**2,h4=t**3-t**2;
   out.push({x:h1*p0.x+h2*m*t0.tx+h3*p1.x+h4*m*t1.tx,z:h1*p0.z+h2*m*t0.tz+h3*p1.z+h4*m*t1.tz});}return out;};
 const rs=ringArc(SP,Rs,down.at(-1),up[0]),rp=ringArc(PP,Rp,up.at(-1),down[0]);
 const seq=[rs,U,rp,D];let pts=[];
 seq.forEach((part,i)=>{const next=seq[(i+1)%seq.length];pts.push(...part);const a=part.at(-1),b=next[0];
  pts.push(...join(a,a.tx!=null?a:tan(part,part.length-1),b,b.tx!=null?b:tan(next,0)));});
 // 2m 간격으로 다시 찍고 높이: 광장 안 = 광장 높이, 그 밖 = 차로 가운데 높이
 const raw=[...pts,pts[0]];let acc=0;const C=[];
 for(let i=0;i<raw.length;i++){if(i)acc+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z);raw[i].s=acc;}
 for(let s=0;s<acc;s+=BUS_CYCLE.step){const m=courseAt(raw,s);C.push({x:m.x,z:m.z,s});}
 const yAt=(x,z)=>Math.hypot(x-SP.x,z-SP.z)<SP.r+1?SP.y:Math.hypot(x-PP.x,z-PP.z)<PP.r+1?PP.y:near(x,z).y;
 C.forEach(p=>{p.y=+yAt(p.x,p.z).toFixed(2);p.x=+p.x.toFixed(2);p.z=+p.z.toFixed(2);p.s=+p.s.toFixed(2);});
 C.push({...C[0],s:+acc.toFixed(2)});
 // 구간(s 범위): 각 점이 어느 고리 안인지로 나눈다
 const inR=(p,c,R)=>Math.abs(Math.hypot(p.x-c.x,p.z-c.z)-R)<.6;
 // 고리 구간 = 반지름이 고리와 같은 점(이음 곡선은 차선 쪽으로 침). 순서는 늘 startRing → up → summitRing → down
 const order=['startRing','up','summitRing','down'],legs={};{let k=0;for(const p of C){const want=k===0?'up':k===1?'summitRing':k===2?'down':null;
  const onS=inR(p,SP,Rs),onP=inR(p,PP,Rp);if(k===0&&!onS)k=1;else if(k===1&&onP)k=2;else if(k===2&&!onP)k=3;void want;(legs[order[k]]??=[p.s,p.s])[1]=p.s;}}
 // 정류장: 고리 구간 가운데(정상은 고리 시작 쪽 1/3 — 도착하자마자 내림). 버스는 그 s에 선다.
 const stopAt=(name,s,P0)=>{const m=courseAt(C,s),o=1.25+1.6;return {name,s:+s.toFixed(2),bay:[+(s-8).toFixed(2),+(s+8).toFixed(2)],x:m.x+m.nx*o,z:m.z+m.nz*o,y:P0.y,heading:Math.atan2(m.tx,m.tz),side:1,road:{x:m.x,y:P0.y,z:m.z}};};
 const sr=legs.startRing,sp=legs.summitRing;
 const cycle={points:C,length:+acc.toFixed(2),closed:true,legs,rings:{start:{x:SP.x,z:SP.z,r:Rs},summit:{x:PP.x,z:PP.z,r:Rp}},
  stops:{start:stopAt('백범광장',(sr[0]+sr[1])/2,SP),summit:stopAt('남산 정상',sp[0]+(sp[1]-sp[0])/3,PP)}};
 cycle.nearest=indexRoute(C.map(p=>({...p,width:2.5})));
 return {cycle,stops:cycle.stops};
}
