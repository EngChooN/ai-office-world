// 공 구멍 도움 판(초록 구멍 (1,2) 추가) 판당 어림 — sweep4.mjs와 같은 모델, 흩어짐 1.0
let seed=8;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const n=4,p=.06,half=n*p/2,fold=v=>{let x=v;for(let i=0;i<4;i++){if(x<-half)x=-2*half-x;if(x>half)x=2*half-x;}return x;};
let a=0,N=200000;for(let q=0;q<N;q++){const x=fold(1.5*p-half+gauss()*.008+gauss()*p),z=fold(1.5*p-half+gauss()*.008+gauss()*p);const i=Math.min(3,Math.floor((x+half)/p)),j=Math.min(3,Math.floor((z+half)/p));if(i===1&&j===1||i===2&&j===2||i===1&&j===2)a++;}
console.log('도움 판(노랑 (1,1) 노림) 판당',(a/N*100).toFixed(1));
