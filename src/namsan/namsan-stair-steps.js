// 계단 한 구간을 높이 기준으로 나눈다. 단 수는 걷기 stairRuns와 같은 전체 높이 ÷ 0.16m.
// 구간 안 경사가 달라도 각 단의 높이가 일정하고, 앞뒤 폭은 실제 높이에 맞게 달라진다.
import {courseAt} from './namsan-data.js';
export function namsanStairSteps(points,run){
 const {s0,s1,y0,y1,steps}=run,dy=(y1-y0)/steps;
 const atHeight=y=>{if(y<=y0)return s0;if(y>=y1)return s1;
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];if(b.s<=s0||a.s>=s1||b.y<y)continue;
   if(b.y>a.y)return Math.max(s0,Math.min(s1,a.s+(b.s-a.s)*(y-a.y)/(b.y-a.y)));}return s1;};
 return Array.from({length:steps},(_,i)=>{const sA=atHeight(y0+dy*i),sB=atHeight(y0+dy*(i+1));return {sA,sB,depth:sB-sA,mid:courseAt(points,(sA+sB)/2),top:y0+dy*(i+.5)};});
}
