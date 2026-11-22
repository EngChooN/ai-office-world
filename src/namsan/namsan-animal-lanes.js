// 남산 동물 자리 안전 검사. three 없음. 게임 연결(11-21)은 아래 namsanTrailLanes → 관악산 animal-zones.js lanes 옵션(game.js).
// 반드시 실제 그림에 사용한 wallLine(G,w).P 배열과 ia.root.userData.plan을 전달한다.
// 관악산 animal-zones.js는 관악산 금지 구역을 직접 가져오므로 그대로 호출하면 안 된다.
import {courseAt,NAMSAN,BUS_ROAD} from './namsan-data.js';
import {stairRuns} from './namsan-walk.js';
import {namsanStairSteps} from './namsan-stair-steps.js';

export const NAMSAN_ANIMAL_LANE_STEP=5;
export const NAMSAN_ANIMAL_MIN_OFFSET=1;
export const NAMSAN_ANIMAL_MAX_OFFSET=5;
const WALL_CLEAR=1.8, BUS_CYCLE_CLEAR=2, TOWER_CLEAR=11.1;
const segmentDistance=(x,z,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);};
const near=(x,z,p,r)=>p&&Math.hypot(x-p.x,z-p.z)<=r;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

/**
 * wallLines: 화면 성곽 중심선 [{P:[{x,z},...]}, ...] (wallLine 결과).
 * plan: 실제 그린 상호작용 배치(ia.root.userData.plan). 값이 없는 시설은 null/[] 가능.
 * 반드시 실제 배치가 완성된 뒤 한 번 생성하고, 지형·시설이 바뀌면 다시 생성한다.
 * laneLimit은 5m 표본을 보수적으로 합친 출현 후보 상한이다. 실제 출현점·배회 경로는
 * 반드시 allows / legAllows로 다시 검사해야 한다(표본 사이의 굽이·시설 때문).
 */
// 덤불(11-22, 검수 문제 1 — 토끼가 길가 덤불에 가려져 말풍선만 보임): 그림이 실제로 그린 덤불 InstancedMesh(이름 '남산 덤불')의
// 자리·크기를 그대로 읽어 {x,z,r} 목록으로. r = 덤불 형상의 가로 반지름 × 그 덤불의 가로 크기. 화질별 그리는 개수(count)와 상관없이 전부 읽어
// 화질·기기가 달라도 같은 방이면 같은 출현이 된다. three 없이 instanceMatrix 숫자만 읽는다.
export function namsanBushesFrom(root){
 const out=[];
 root?.traverse?.(o=>{if(o.name!=='남산 덤불'||!o.isInstancedMesh)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;
  const reach=Math.max(Math.abs(b.min.x),Math.abs(b.max.x),Math.abs(b.min.z),Math.abs(b.max.z)),a=o.instanceMatrix.array;
  for(let i=0;i<o.instanceMatrix.count;i++){const e=i*16,sx=Math.hypot(a[e],a[e+1],a[e+2]),sz=Math.hypot(a[e+8],a[e+9],a[e+10]);out.push({x:a[e+12],z:a[e+14],r:reach*Math.max(sx,sz)});}});
 return out;
}
// 동물 몸이 덤불 가장자리에서 이만큼은 떨어져 있어야 몸이 보인다(토끼 몸길이 약 0.4m의 반 + 여유).
export const BUSH_CLEAR=.3;

export function createNamsanAnimalLanes(G,{wallLines,plan,bushes=null}={}){
 if(!G?.points?.length||typeof G.ground!=='function'||typeof G.nearest!=='function'||!Array.isArray(wallLines)||!plan||!('spring' in plan)||!('cairn' in plan)||!('locks' in plan)||!Array.isArray(plan.basins))throw new Error('남산 지형과 실제 성곽 선·시설 배치가 필요합니다');
 const segments=[];for(const line of wallLines){if(!Array.isArray(line?.P))throw new Error('성곽은 wallLine 결과를 전달해야 합니다');for(let i=1;i<line.P.length;i++)segments.push([line.P[i-1],line.P[i]]);}
 // 그림의 계단 측벽 상자와 같은 단 수·방향·길이로 판정한다(최근접 코스가 다른 급회전 포함).
 const stairWalls=[];for(const r of stairRuns(G))for(const {mid:m,depth} of namsanStairSteps(G.points,r)){
  for(const side of [-1,1])stairWalls.push({x:m.x+m.nx*(NAMSAN.stairWidth/2+.16)*side,z:m.z+m.nz*(NAMSAN.stairWidth/2+.16)*side,tx:m.tx,tz:m.tz,nx:m.nx,nz:m.nz,depth});}
 // 8m 칸 색인(11-21 게임 연결): 성곽 선분·계단 측벽을 닿을 수 있는 칸마다 넣어, 판정 한 번에 둘레 몇 개만 본다(전에는 3천 개를 다 봐 1회 약 60µs). 결과는 같다.
 const CELL=8,grid=new Map(),cellKey=(i,j)=>i*100003+j;
 const put=(item,x0,z0,x1,z1)=>{for(let i=Math.floor(x0/CELL);i<=Math.floor(x1/CELL);i++)for(let j=Math.floor(z0/CELL);j<=Math.floor(z1/CELL);j++){const k=cellKey(i,j);let c=grid.get(k);if(!c)grid.set(k,c={segs:[],stairs:[]});c[item.seg?'segs':'stairs'].push(item.seg??item.wall);}};
 for(const seg of segments){const [a,b]=seg;put({seg},Math.min(a.x,b.x)-WALL_CLEAR,Math.min(a.z,b.z)-WALL_CLEAR,Math.max(a.x,b.x)+WALL_CLEAR,Math.max(a.z,b.z)+WALL_CLEAR);}
 for(const wall of stairWalls){const r=.36+wall.depth/2+.24;put({wall},wall.x-r,wall.z-r,wall.x+r,wall.z+r);}
 const NONE={segs:[],stairs:[]},cellAt=(x,z)=>grid.get(cellKey(Math.floor(x/CELL),Math.floor(z/CELL)))??NONE;
 const end=G.points.at(-1).s;
 const halfWidth=s=>courseAt(G.points,s).stairs?NAMSAN.stairWidth/2:NAMSAN.pathWidth/2;
 const toWorld=(s,v)=>{const p=courseAt(G.points,s),x=p.x+p.nx*v,z=p.z+p.nz*v;return {x,z,y:G.ground(x,z)};};
 const inForbid=(x,z)=>{
  if(!Number.isFinite(x)||!Number.isFinite(z))return true;
  const cell=cellAt(x,z);
  if(cell.segs.some(([a,b])=>segmentDistance(x,z,a,b)<=WALL_CLEAR))return true;
  if(G.bus&&(G.bus.nearest(x,z).distance<=BUS_ROAD.width/2+.5||G.bus.cycle.nearest(x,z).distance<=BUS_CYCLE_CLEAR))return true;
  if(near(x,z,NAMSAN.tower,TOWER_CLEAR)||near(x,z,plan.spring,2.2)||near(x,z,plan.cairn,4.5))return true;
  if(plan.basins.some(b=>near(x,z,b,1.3)||(b.runnel??[]).some((p,i,a)=>i&&segmentDistance(x,z,a[i-1],p)<=.7)))return true;
  const L=plan.locks;if(L){const dx=x-L.x,dz=z-L.z,a=Math.atan2(dx,dz);if(Math.abs(Math.hypot(dx,dz)-L.radius)<=1&&Math.abs(wrap(a-L.a0))<=L.span/2+1/L.radius)return true;}
  if(cell.stairs.some(w=>{const dx=x-w.x,dz=z-w.z;return Math.abs(dx*w.nx+dz*w.nz)<=.36&&Math.abs(dx*w.tx+dz*w.tz)<=w.depth/2+.24;}))return true;
  return false;
 };
 // 덤불 4m 칸 색인. 덤불은 길가 띠 곳곳에 흩어져 있어 허용 폭(laneLimit, 안에서 밖으로 처음 막히는 곳까지)에는 넣지 않고
 // 출현·배회 자리 하나하나의 최종 판정(allows)에서만 본다 — 허용 폭에 넣으면 길가 가까운 덤불 하나가 그 칸 바깥을 통째로 막는다.
 const BCELL=4,bushGrid=new Map();let bushMax=0;
 for(const b of bushes??[]){if(!Number.isFinite(b?.x)||!Number.isFinite(b?.z)||!(b.r>0))continue;bushMax=Math.max(bushMax,b.r);const k=cellKey(Math.floor(b.x/BCELL),Math.floor(b.z/BCELL));let c=bushGrid.get(k);if(!c)bushGrid.set(k,c=[]);c.push(b);}
 const reachCells=Math.ceil((bushMax+BUSH_CLEAR)/BCELL);
 const inBush=(x,z)=>{if(!bushGrid.size)return false;const ci=Math.floor(x/BCELL),cj=Math.floor(z/BCELL);
  for(let i=ci-reachCells;i<=ci+reachCells;i++)for(let j=cj-reachCells;j<=cj+reachCells;j++){const c=bushGrid.get(cellKey(i,j));if(c)for(const b of c)if(Math.hypot(x-b.x,z-b.z)<b.r+BUSH_CLEAR)return true;}return false;};
 const allowsLane=(s,v)=>{
  if(!Number.isFinite(s)||!Number.isFinite(v)||s<0||s>end)return false;
  const offset=Math.abs(v)-halfWidth(s);if(offset<NAMSAN_ANIMAL_MIN_OFFSET||offset>NAMSAN_ANIMAL_MAX_OFFSET)return false;
  const p=toWorld(s,v),h=G.nearest(p.x,p.z),hw=G.points[h.index]?.stairs?NAMSAN.stairWidth/2:NAMSAN.pathWidth/2;
  // 가까운 다른 코스와 겹치는 급회전에서는 실제 가장자리 거리를 우선한다.
  return h.distance>=hw+NAMSAN_ANIMAL_MIN_OFFSET-1e-6&&h.distance<=hw+NAMSAN_ANIMAL_MAX_OFFSET+1e-6&&!inForbid(p.x,p.z);
 };
 const allows=(s,v)=>{if(!allowsLane(s,v))return false;if(!bushGrid.size)return true;const p=toWorld(s,v);return !inBush(p.x,p.z);};
 const sampleLimit=(s,side)=>{let max=0;for(let off=1;off<=5.001;off+=.25){if(!allowsLane(s,side*(halfWidth(s)+off)))break;max=off;}return max;};
 const cache=new Map();const atCell=(i,side)=>{const key=`${i}:${side}`;if(!cache.has(key))cache.set(key,sampleLimit(Math.min(end,i*NAMSAN_ANIMAL_LANE_STEP),side));return cache.get(key);};
 const laneLimit=(s,side)=>{if(!Number.isFinite(s)||s<0||s>end)return 0;side=side>=0?1:-1;const i=Math.floor(s/NAMSAN_ANIMAL_LANE_STEP);return Math.min(atCell(i,side),atCell(i+1,side));};
 const legAllows=(from,to)=>{const d=Math.hypot(to.s-from.s,to.v-from.v),n=Math.max(1,Math.ceil(d/.1));for(let i=0;i<=n;i++){const t=i/n;if(!allows(from.s+(to.s-from.s)*t,from.v+(to.v-from.v)*t))return false;}return true;};
 return {halfWidth,toWorld,inForbid,inBush,allows,legAllows,laneLimit,bushes:bushGrid.size?[...bushGrid.values()].reduce((n,c)=>n+c.length,0):0};
}

// 관악산 동물 부품(animal-zones.js·trail-world.js)의 lanes 옵션 모양으로(11-21 게임 연결).
// 길가 1~5m는 allows 그대로. 길 위·가장자리 1m 안(길을 가로지르는 걸음)은 금지(성곽·계단 측벽·차로·시설)만 본다 —
// allows는 길가 1~5m만 허용해서 그대로 쓰면 고양이·까치·토끼가 길을 못 건넌다. 금지는 animal-zones spotOk가 inForbid로 따로 본다.
export function namsanTrailLanes(L,end){
 return {laneLimit:L.laneLimit,inForbid:L.inForbid,step:NAMSAN_ANIMAL_LANE_STEP,
  allows:(u,v)=>u>=0&&u<=end&&(Math.abs(v)<L.halfWidth(u)+NAMSAN_ANIMAL_MIN_OFFSET||L.allows(u,v))};
}
