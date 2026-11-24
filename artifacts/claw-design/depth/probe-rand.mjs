// 봉 기계 무작위 겨눔(sim2와 같은 겨누기)에서 집게가 멈춘 높이 분포. node probe-rand.mjs <뿌리> [판수]
const [root,NS='60']=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW_RIG:CL}=await import(root+'/src/claw/claw-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,FP=P.FINGER_PLATES,FA=P.FINGER_ANGLE_B;
const tip=(s)=>{const g=s.geom,S=g.rig.scale,c=s.claw;let lo=99;for(let k=0;k<2;k++){const o=Math.max(0,Math.min(1,(c.th[k]-CL.closed)/(CL.splay-CL.closed))),an=FA.shut+o*(FA.wide-FA.shut),ca=Math.cos(an),sa=Math.sin(an);
 for(const F of FP)for(const p of [F.a,F.b]){const y1=p[1]*ca-p[2]*sa;lo=Math.min(lo,c.y+(g.rig.headUp??0)+c.sway[1]+(y1-F.r)*S);}}return lo;};
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const out={};
for(const M of MACHINES.filter(m=>m.kind==='bridge')){
 const g=P.bridgeGeom(CLAW,M.bars,B),R=rng(77),rows=[];
 for(let t=0;t<+NS;t++){
  const s=P.createBridgeSim({geom:g,box:B.box,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:t+1,pose:P.startPose(B,R)});
  const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
  const hl=B.box[2]/2/.1,hw=B.box[0]/2/.1,a=(R()<.5?-1:1)*(.55+R()*.4),b=(R()<.5?-1:1)*(.45+R()*.45),boxTop=c[1]+s.half[1];
  s.start();s.setPos(c[0]+u[0]*a*hl+v[0]*b*hw,c[2]+u[1]*a*hl+v[1]*b*hw);s.drop();
  let headTop=null,tipAt=null,low=99;
  for(let k=0;k<2400&&s.claw.state!=='lift';k++){s.step(1/240);if(s.claw.state==='close'){if(headTop==null){headTop=s.claw.y;tipAt=tip(s);}low=Math.min(low,tip(s));}}
  rows.push({drop:(g.HOME.y-headTop)*10,headAbove:(headTop+g.rig.headUp-boxTop)*10,tipBelowTop:(boxTop-tipAt)*10});
 }
 const avg=k=>+(rows.reduce((a,r)=>a+r[k],0)/rows.length).toFixed(1),mn=k=>+Math.min(...rows.map(r=>r[k])).toFixed(1),mx=k=>+Math.max(...rows.map(r=>r[k])).toFixed(1);
 out[M.id]={하강평균_cm:avg('drop'),하강최소:mn('drop'),하강최대:mx('drop'),머리_상자위_평균_cm:avg('headAbove'),발끝_상자윗면아래_평균_cm:avg('tipBelowTop'),발끝최소:mn('tipBelowTop')};
}
console.log(JSON.stringify(out));
