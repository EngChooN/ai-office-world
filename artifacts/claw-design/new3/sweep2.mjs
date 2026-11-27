let seed=5;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const SIG=.06,N=100000;
const run=(L,w0)=>{let w=w0,top=0;for(let r=1;r<=11;r++){if(r>1){w-=Math.abs(Math.round(gauss()*SIG/L[r-1]*1000));if(w<=0)return top;}top=r;}return top;};
const avg=(L,need,after)=>{let t=0,G=30000;for(let g=0;g<G;g++){let k=0,fl=0;for(;;){k++;if(run(L,fl>=after?4:3)>=need)break;fl++;}t+=k;}return (t/G).toFixed(2);};
for(const L of [[150,135,120,105,95,85,80,75,75,75,75],[140,125,110,100,90,80,75,75,75,75,75],[140,125,110,100,90,80,80,80,80,80,80],[130,115,105,95,85,80,80,80,80,80,80],[130,115,100,90,80,75,75,80,80,80,80]]){
 let a=0,b=0;for(let n=0;n<N;n++){const t=run(L,3);if(t>=7)a++;if(t>=11)b++;}
 console.log(L.join(','),'7줄',(a/N*100).toFixed(1),'11줄',(b/N*100).toFixed(1),'7까지평균',avg(L,7,5),'11까지평균(보장없음 근사)',(100/(b/N*100)).toFixed(1));}
