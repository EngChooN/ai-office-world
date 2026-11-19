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
 const [buf,landBuf,course,walls,trees]=await Promise.all([bin(meta.terrain.file),bin(meta.landcover.file),
  readJSON(base+'course.json'),readJSON(base+'walls.json'),forest?readJSON(base+'forest.json'):null]);
 return {meta,terrain:{...meta.terrain,values:new Float32Array(buf),land:new Uint8Array(landBuf)},course,walls:walls.walls,forest:trees};
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
 return {raw,ground,park,forestK,nearest,plaza,startPlaza,points:pts,bounds:{x0:T.x0,z0:T.z0,x1:T.x0+(T.width-1)*T.spacing,z1:T.z0+(T.height-1)*T.spacing}};
}
