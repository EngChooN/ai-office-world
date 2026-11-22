// 남산 지형과 풀 판정에서 함께 쓰는 sin 없는 무늬. 각 연산을 GPU의 float 정밀도로 맞춘다.
export const STABLE_HASH_GLSL=`float ttHash(vec2 p){vec3 p3=fract(vec3(p.x,p.y,p.x)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}`;
const f=Math.fround, add=(a,b)=>f(f(a)+f(b)), mul=(a,b)=>f(f(a)*f(b)), fract=x=>f(x-Math.floor(x)), mix=(a,b,t)=>add(mul(a,f(1-t)),mul(b,t));
export function stableHash(x,y){let a=fract(mul(x,.1031)),b=fract(mul(y,.1031)),c=a;const d=add(add(mul(a,add(b,33.33)),mul(b,add(c,33.33))),mul(c,add(a,33.33)));a=add(a,d);b=add(b,d);c=add(c,d);return fract(mul(add(a,b),c));}
export function stableNoise(x,y){x=f(x);y=f(y);const ix=Math.floor(x),iy=Math.floor(y);let a=fract(x),b=fract(y);a=mul(mul(a,a),f(3-mul(2,a)));b=mul(mul(b,b),f(3-mul(2,b)));return mix(mix(stableHash(ix,iy),stableHash(ix+1,iy),a),mix(stableHash(ix,iy+1),stableHash(ix+1,iy+1),a),b);}
export function stableFbm(x,y){x=f(x);y=f(y);return add(add(mul(stableNoise(x,y),.58),mul(stableNoise(add(mul(x,2.13),5.2),add(mul(y,2.13),1.3)),.28)),mul(stableNoise(add(mul(x,4.71),1.7),add(mul(y,4.71),9.2)),.14));}
export function namsanRockNoise(x,z){return stableFbm(add(f(f(x)/45),3.7),add(f(f(z)/45),8.1));}

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// 회색으로 전환되기 조금 전부터 비워 잎이 바위 경계로 넘어가는 것을 줄인다.
export const NAMSAN_ROCK_CLEAR=.42;
export function namsanRockValue(x,z,h,slope){const rn=namsanRockNoise(x,z);return Math.max(slope*(.5/.28)+(rn-.5)*.32,smooth(500,600,h)*(.22+.62*smooth(.35,.75,rn))+smooth(600,625,h)*.3);}

// 바위 턱 위 풀 띠(materials.js의 ledge): 완만한 암반 윗면은 화면에서 풀밭 색으로 덮이므로 풀을 막지 않는다.
// 경계 폭(fwidth)은 시점마다 달라 가운데 값으로 끊고, 띠 가장자리 잎이 회색으로 넘지 않게 기준을 조금 올린다.
export const NAMSAN_LEDGE_MARGIN=.03;
export function namsanLedgeGreen(x,z,h,slope){
 if(slope>=.3)return false; // 0.3 이상은 (1-smoothstep(.2,.36))가 0.5 아래라 회색이 남는다
 const ledgeN=stableFbm(add(f(h/2.2),7),add(f(f(f(x)*.71+f(z)*.71)/28),2))*.6+stableFbm(add(f(f(x)/6),3),add(f(f(z)/6),9))*.4;
 const patchN=stableFbm(add(f(f(x)/6.5),4),add(f(f(z)/6.5),1))*.6+stableFbm(add(f(f(x)/2.3),8),add(f(f(z)/2.3),3))*.4;
 const at=.53+(.47-.53)*smooth(600,625,h);
 return (1-smooth(.2,.36,slope))*(ledgeN*.2+patchN*.8>at+NAMSAN_LEDGE_MARGIN?1:0)>.5;
}
