// 집게 기계(인형) 통과 재현 — 「보이는」 손가락(claw-machine-art.js buildClaw: 휜 관 반지름 .007·끝 구슬 .011, 머리 배율 clawTip/.14)이
// 인형 몸 공(판정 모양)에 얼마나 들어가나. node probe-claw-vis.mjs <뿌리> [판 수 묶음]
const [root,NS='20']=process.argv.slice(2),N=+NS;
const THREE=await import('three');
const P=await import(root+'/src/claw/claw-physics.js');
const {CLAW,FINGER_ANGLE:FA}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const CL=P.CLAW_RIG,g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity,U=.1;
const TIP_REST=CL.l1*Math.cos(CL.rest)+CL.l2*Math.cos(CL.rest-CL.bend),S=CLAW.clawTip/.14/U,UP=CLAW.clawTip/U-TIP_REST;
const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.04,.035),new THREE.Vector3(0,-.1,.04),new THREE.Vector3(0,-.14,0)]);
const PTS=curve.getPoints(16).map(v=>[v.y,v.z]);
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
// 보이는 손가락 점들 [x,y,z,반지름](단위)
function fingerPts(c){const out=[],hy=c.y+UP,o=k=>Math.max(0,Math.min(1,(c.th[k]-CL.closed)/(CL.splay-CL.closed)));
 for(let i=0;i<3;i++){const p=[0,2,1][i],th=i/3*Math.PI*2,dx=Math.sin(th),dz=Math.cos(th),an=FA.shut+o(p)*(FA.wide-FA.shut),ca=Math.cos(an),sa=Math.sin(an);
  PTS.forEach(([y,z],j)=>{const y1=y*ca-z*sa,z1=y*sa+z*ca+.03;out.push([c.x+dx*z1*S,hy+y1*S,c.z+dz*z1*S,(j===PTS.length-1?.011:.007)*S]);});}
 return out;}
const TH=.05,stat={plays:0,badPlays:0,max:0,byState:{},wins:0};
for(let t=0;t<N;t++){const R=rng(300+t*131),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+3,count:C.dolls,power:C.power});
 if(process.env.PITY)s.claw.power={...C.pityPower,...(process.env.PW?JSON.parse(process.env.PW):{}),...(process.env.STALL?{stallAt:+process.env.STALL}:{}),...(process.env.BACK?{backAt:+process.env.BACK}:{})}; // PITY=1: 보장 판 세기로(11-23 보장 다시 맞춤)
 for(let k=0;k<3;k++){stat.plays++;const Rg=g.RANGE,x=Rg.x0+R()*(Rg.x1-Rg.x0),z=Rg.z0+R()*(Rg.z1-Rg.z0);
  s.start();s.setPos(x,z);s.drop();let mx=0,st='',wi=null;
  for(let tt=0;tt<16&&s.claw.state!=='done';tt+=1/60){s.step(1/60);const Q=s.P;
   for(const [fx,fy,fz,fr] of fingerPts(s.claw))for(let i=0;i<Q.x.length;i++){if(s.dolls[Q.d[i]].gone)continue;const d=fr+Q.r[i]-Math.hypot(fx-Q.x[i],fy-Q.y[i],fz-Q.z[i]);if(d>mx){mx=d;st=s.claw.state;wi={id:s.dolls[Q.d[i]].id,th:s.claw.th.map(v=>+v.toFixed(2)),cy:+s.claw.y.toFixed(2),py:+Q.y[i].toFixed(2),px:+Q.x[i].toFixed(2),pz:+Q.z[i].toFixed(2)};}}}
  for(const e of s.events.splice(0))if(e.type==='won')stat.wins++;
  if(mx>TH){stat.badPlays++;stat.byState[st]=(stat.byState[st]||0)+1;(stat.bad??=[]).push({t,k,x:+x.toFixed(2),z:+z.toFixed(2),mx:+(mx*10).toFixed(2),st,who:wi});}stat.max=Math.max(stat.max,mx);
  for(let tt=0;tt<1;tt+=1/30)s.step(1/30);s.events.length=0;}}
stat.max=+(stat.max*10).toFixed(2)+'cm';console.log(JSON.stringify({PW:process.env.PW,...stat}));
