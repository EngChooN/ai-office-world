let seed=11;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const SIG=.06,N=100000;
const cut=(S,still)=>{const vm=still?0:2*Math.PI*S.A/S.P;return Math.abs(gauss()*SIG*S.v+gauss()*SIG*vm)<=S.w;};
const near=(S)=>{const vm=2*Math.PI*S.A/S.P;const e=Math.abs(gauss()*SIG*S.v+gauss()*SIG*vm);return e>S.w&&e<=2*S.w;};
const avg=(S)=>{let t=0,G=30000;for(let g=0;g<G;g++){let k=0,f=0;for(;;){k++;if(cut(S,f>=S.after))break;f++;}t+=k;}return (t/G).toFixed(2);};
for(const S of [{v:.15,A:.05,P:1.4,w:.004,after:8},{v:.15,A:.05,P:1.4,w:.0035,after:8},{v:.15,A:.05,P:1.4,w:.003,after:8},{v:.12,A:.05,P:1.6,w:.003,after:8},{v:.15,A:.04,P:1.4,w:.003,after:8}]){
 let a=0,b=0,c=0;for(let n=0;n<N;n++){a+=cut(S,false);b+=cut(S,true);c+=near(S);}
 console.log(JSON.stringify(S),'판당',(a/N*100).toFixed(1),'아까움',(c/N*100).toFixed(1),'흔들림멈춤판',(b/N*100).toFixed(1),'평균',avg(S));}
