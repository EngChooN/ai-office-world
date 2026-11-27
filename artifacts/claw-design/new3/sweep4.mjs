// 공 구멍 거친 모델: 떨어진 점 = 노린 구멍 + 자리 오차 + 튐 흩어짐(간격 배수), 벽은 접어 되튐. 희귀 구멍은 작아서 칸 안쪽 k 범위에 떨어져야 들어감(아니면 옆 칸으로 굴러감 = 일반 구멍)
let seed=3;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const N=100000,n=4,p=.06,half=n*p/2;
const fold=v=>{let x=v;for(let i=0;i<4;i++){if(x<-half)x=-2*half-x;if(x>half)x=2*half-x;}return x;};
const color=[[1,1],[2,2]],rare=[[3,0]],pityH=[[1,2]];
function drop(t,ss,sd,k,pity){const x=fold((t[0]+.5)*p-half+gauss()*sd+gauss()*ss*p),z=fold((t[1]+.5)*p-half+gauss()*sd+gauss()*ss*p);
 const i=Math.min(n-1,Math.floor((x+half)/p)),j=Math.min(n-1,Math.floor((z+half)/p));const has=l=>l.some(([a,b])=>a===i&&b===j);
 if(has(rare)){const u=(x+half)/p-i-.5,v=(z+half)/p-j-.5;return Math.max(Math.abs(u),Math.abs(v))<=k/2?'rare':'';}
 return has(color)||pity&&has(pityH)?'color':'';}
const avg=(ss,sd,k)=>{let t=0,G=30000;for(let g=0;g<G;g++){let c=0,f=0;for(;;){c++;if(drop(color[0],ss,sd,k,f>=5))break;f++;}t+=c;}return (t/G).toFixed(2);};
for(const ss of [.85,1,1.1])for(const k of [.6]){let a=0,b=0;for(let q=0;q<N;q++){a+=!!drop(color[0],ss,.008,k,false);b+=drop(rare[0],ss,.008,k,false)==='rare';}
 console.log('흩어짐',ss,'희귀칸안쪽',k,'보통노림',(a/N*100).toFixed(1),'희귀노림',(b/N*100).toFixed(1),'평균(보장5)',avg(ss,.008,k));}
