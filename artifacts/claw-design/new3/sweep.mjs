// 조절값 훑기(rate.mjs 모델). node sweep.mjs
let seed=99;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const SIG=.06,N=60000;
const run=(S,w0)=>{let w=w0,top=0;for(let r=1;r<=11;r++){if(r>1){const st=Math.max(S.min,S.s0*Math.pow(S.m,r-1));w-=Math.abs(Math.round(gauss()*SIG/st));if(w<=0)return top;}for(const [row,c] of Object.entries(S.cap))if(r>=+row)w=Math.min(w,c);top=r;}return top;};
const avg=(f)=>{let t=0,G=20000;for(let g=0;g<G;g++){let k=0,fl=0;for(;;){k++;if(f(fl>=5))break;fl++;}t+=k;}return (t/G).toFixed(2);};
for(const s0 of [.16,.14,.12])for(const m of [.9,.87])for(const min of [.05,.04])for(const cap of [{},{8:2}]){const S={s0,m,min,cap};let a=0,b=0;for(let n=0;n<N;n++){const t=run(S,3);if(t>=7)a++;if(t>=11)b++;}
 console.log(JSON.stringify({s0,m,min,cap}),'7줄',(a/N*100).toFixed(1)+'%','11줄',(b/N*100).toFixed(1)+'%','7줄까지 평균(보장4칸)',avg(p=>run(S,p?4:3)>=7),'steps',Array.from({length:11},(_,i)=>Math.round(Math.max(min,s0*Math.pow(m,i))*1000)).join(','));}
