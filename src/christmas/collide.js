// 광장 충돌(월드개발, 2026-11-16): 울타리 원(언덕 쪽 통로는 열림) 안, village.colliders(원 {x,z,r}·돌린 상자 {x,z,w,d,heading}) 밖으로 민다.
// three를 쓰지 않는다(시험에서 바로 부른다). 상자 돌림은 three rotation.y와 같다: 세계 = (lx·cos+lz·sin, −lx·sin+lz·cos).
import {BOUNDS} from './layout.js';
export const BODY_R=.22;
// 썰매 산 쪽 통로: 울타리를 열어 둔 북쪽(village.js 울타리 z<-23 빼기와 같은 곳). 11-17 2차: 산이 커져 |x|<36·z ≥ −115
export const inNorthGap=(x,z)=>z<-24&&Math.abs(x)<BOUNDS.gapX&&z>=BOUNDS.north+1;
export function collideXmas(x,z,cols=[],R=BODY_R){
 const lim=BOUNDS.r-.6;
 if(z<-24){if(z<BOUNDS.north+1)z=BOUNDS.north+1;if(Math.abs(x)>=BOUNDS.gapX&&Math.hypot(x,z)>lim)x=Math.sign(x)*(BOUNDS.gapX-.01);} // 산 통로 끝·옆
 const r=Math.hypot(x,z);
 if(r>lim&&!inNorthGap(x,z)){const k=lim/r;x*=k;z*=k;}
 for(const c of cols){
  if(c.r!==undefined){const dx=x-c.x,dz=z-c.z,d=Math.hypot(dx,dz),m=c.r+R;if(d<m&&d>1e-6){x=c.x+dx/d*m;z=c.z+dz/d*m;}continue;}
  const h=c.heading??0,co=Math.cos(h),si=Math.sin(h),dx=x-c.x,dz=z-c.z;
  let lx=dx*co-dz*si,lz=dx*si+dz*co;const hw=c.w/2,hd=c.d/2;
  const nx=Math.max(-hw,Math.min(hw,lx)),nz=Math.max(-hd,Math.min(hd,lz)),ex=lx-nx,ez=lz-nz,d=Math.hypot(ex,ez);
  if(d>=R)continue;
  if(d>1e-6){lx=nx+ex/d*R;lz=nz+ez/d*R;}
  else{const o=[[-hw-R-lx,0],[hw+R-lx,0],[0,-hd-R-lz],[0,hd+R-lz]].sort((a,b)=>Math.abs(a[0]+a[1])-Math.abs(b[0]+b[1]))[0];lx+=o[0];lz+=o[1];}
  x=c.x+lx*co+lz*si;z=c.z-lx*si+lz*co;
 }
 return {x,z};
}
