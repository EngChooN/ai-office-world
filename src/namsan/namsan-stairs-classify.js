// OSM steps 중 실제로 오르는 구간만 남긴다. 원래 표시를 함께 보관해 재실행해도 결과가 같다.
// 좌표·거리·고도는 바꾸지 않는다. 8% 미만 또는 4m 미만 연속 조각은 포장길이다.
export const NAMSAN_STAIR_GRADE=.08;
export const NAMSAN_STAIR_MIN_RUN=4;
export function classifyNamsanStairs(points){
 for(let i=0;i<points.length;i++){
  const p=points[i],q=points[i+1];p.osmStairs??=!!p.stairs;
  const length=q?q.s-p.s:0;p.stairs=!!(p.osmStairs&&length>0&&(q.y-p.y)/length>=NAMSAN_STAIR_GRADE-1e-9);
 }
 for(let i=0;i<points.length-1;){if(!points[i].stairs){i++;continue;}let j=i+1;while(j<points.length-1&&points[j].stairs)j++;
  if(points[j].s-points[i].s<NAMSAN_STAIR_MIN_RUN)for(let k=i;k<j;k++)points[k].stairs=false;i=j;}
 return points;
}
