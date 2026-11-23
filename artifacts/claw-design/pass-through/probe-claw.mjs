// 집게 기계(인형) 통과 재현: 집게발(캡슐)·가운데 뭉치가 인형 공에 얼마나 파고드나. node probe-claw.mjs <뿌리> [판 수]
const [root,NS='40']=process.argv.slice(2),N=+NS;
const P=await import(root+'/src/claw/claw-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const CL=P.CLAW_RIG,g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function segs(c){const out=[];for(let k=0;k<3;k++){const a=c.ang[k],ux=Math.cos(a),uz=Math.sin(a),th=c.th[k];
 const hx=c.x+CL.hinge*ux,hy=c.y,hz=c.z+CL.hinge*uz,s1=Math.sin(th),c1=Math.cos(th),s2=Math.sin(th-CL.bend),c2=Math.cos(th-CL.bend);
 const kx=hx+CL.l1*s1*ux,ky=hy-CL.l1*c1,kz=hz+CL.l1*s1*uz,tx=kx+CL.l2*s2*ux,ty=ky-CL.l2*c2,tz=kz+CL.l2*s2*uz;out.push([hx,hy,hz,kx,ky,kz],[kx,ky,kz,tx,ty,tz]);}return out;}
const pen=(S,px,py,pz,r)=>{const ex=S[3]-S[0],ey=S[4]-S[1],ez=S[5]-S[2],L2=ex*ex+ey*ey+ez*ez;let t=((px-S[0])*ex+(py-S[1])*ey+(pz-S[2])*ez)/L2;t=Math.max(0,Math.min(1,t));
 return r+CL.rad-Math.hypot(px-S[0]-ex*t,py-S[1]-ey*t,pz-S[2]-ez*t);};
const TH=.05,stat={plays:0,badPlays:0,max:0,byState:{},wins:0};
for(let t=0;t<N;t++){const R=rng(300+t*131),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+3,count:C.dolls,power:C.power});
 for(let k=0;k<3;k++){stat.plays++;const Rg=g.RANGE,x=Rg.x0+R()*(Rg.x1-Rg.x0),z=Rg.z0+R()*(Rg.z1-Rg.z0);
  s.start();s.setPos(x,z);s.drop();let mx=0,st='';
  for(let tt=0;tt<16&&s.claw.state!=='done';tt+=1/60){s.step(1/60);const Q=s.P;
   for(const S of segs(s.claw))for(let i=0;i<Q.x.length;i++){if(s.dolls[Q.d[i]].gone)continue;const d=pen(S,Q.x[i],Q.y[i],Q.z[i],Q.r[i]);if(d>mx){mx=d;st=s.claw.state;}}}
  for(const e of s.events.splice(0))if(e.type==='won')stat.wins++;
  if(mx>TH){stat.badPlays++;stat.byState[st]=(stat.byState[st]||0)+1;}stat.max=Math.max(stat.max,mx);
  for(let tt=0;tt<1;tt+=1/30)s.step(1/30);s.events.length=0;}}
stat.max=+(stat.max*10).toFixed(2)+'cm';console.log(JSON.stringify(stat));
