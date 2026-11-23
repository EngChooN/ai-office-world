// 통과 재현(월드개발 2026-11-23): 봉 기계 무작위 판에서 「보이는」 집게(납작한 팔·고무 발끝·머리 상자 — claw-bridge.js 그림 치수)와 봉이
// 상자(진짜 직육면체)에 얼마나 파고드나 잰다. 물리 코드 안쪽 값은 쓰지 않고 집게 각도·자리·상자 자세만 읽음(고치기 전·후 같은 잣대).
// node probe.mjs <코드 뿌리> [상자 수] [기계 id]  → 한 줄 JSON
const [root,NS='30',mid='bridge-1']=process.argv.slice(2),N=+NS;
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW_RIG:CL}=await import(root+'/src/claw/claw-physics.js');
const {CLAW,FINGER_ANGLE:FA}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,M=MACHINES.find(m=>m.id===mid),g=P.bridgeGeom(CLAW,M.bars,B);
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],nrm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function obb(s){const Q=s.P,c=[Q.x[0],Q.y[0],Q.z[0]],eL=nrm([Q.x[3]-Q.x[2],Q.y[3]-Q.y[2],Q.z[3]-Q.z[2]]);let eH=[Q.x[1]-Q.x[0],Q.y[1]-Q.y[0],Q.z[1]-Q.z[0]];
 const k=dot(eH,eL);eH=nrm(eH.map((v,i)=>v-k*eL[i]));return {c,ax:[eL,eH,cross(eL,eH)],h:s.half};}
function depth(O,p){const d=sub(p,O.c);let inside=Infinity,out=0;for(let k=0;k<3;k++){const q=dot(d,O.ax[k]),e=O.h[k]-Math.abs(q);inside=Math.min(inside,e);if(e<0)out+=e*e;}return out>0?-Math.sqrt(out):inside;}
// 판(가운데 선분 a→b ± 옆 side, 두께 r)이 상자에 파고든 깊이: 선분 21점 × 옆 5점
function plateDepth(O,a,b,side,r){let m=-Infinity;for(let i=0;i<=20;i++)for(let j=-2;j<=2;j++){const t=i/20,p=[a[0]+(b[0]-a[0])*t+side[0]*j/2,a[1]+(b[1]-a[1])*t+side[1]*j/2,a[2]+(b[2]-a[2])*t+side[2]*j/2];m=Math.max(m,depth(O,p)+r);}return m;}
// 보이는 집게(claw-bridge.js buildClaw2 치수, 머리 배율 clawTip/0.14)
const TIP_REST=CL.l1*Math.cos(CL.rest)+CL.l2*Math.cos(CL.rest-CL.bend),S=CLAW.clawTip/.14/.1,UP=CLAW.clawTip/.1-TIP_REST;
const ARM=[[[0,0,0],[0,-.012,.034],.0112,.008],[[0,-.012,.034],[0,-.11,.036],.0112,.008],[[0,-.11,.036],[0,-.14,0],.0112,.008],[[0,-.142,-.011],[0,-.142,.003],.014,.006]];
function plates(c0){const o=c0.sway??[0,0,0],c={...c0,x:c0.x+o[0],y:c0.y+o[1],z:c0.z+o[2]};const out=[],hy=c.y+UP;for(let k=0;k<2;k++){const sg=k?-1:1,o=Math.max(0,Math.min(1,(c.th[k]-CL.closed)/(CL.splay-CL.closed))),an=FA.shut+o*(FA.wide-FA.shut),ca=Math.cos(an),sa=Math.sin(an);
  const W=([,y,z])=>{const y1=y*ca-z*sa,z1=y*sa+z*ca+.03;return [c.x+sg*z1*S,hy+y1*S,c.z];};
  for(const [a,b,sd,r] of ARM)out.push([W(a),W(b),[0,0,sd*S],r*S]);}
 out.push([[c.x-.0275*S,hy+.022*S,c.z],[c.x+.0275*S,hy+.022*S,c.z],[0,0,.0025*S],.0225*S]);return out;}
const TH=.05; // 0.5cm 넘게 파고들면 「통과처럼 보임」
const DBG=[];const stat={plays:0,clawPlays:0,barFrames:0,frames:0,maxClaw:0,maxBar:0,byState:{},wins:0};
for(let t=0;t<N;t++){const R=rng(500+t*977);
 const s=P.createBridgeSim({geom:g,box:B.box,mass:B.boxMass,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:t+1,pose:P.startPose(B,R)});
 for(let k=0;k<4;k++){stat.plays++;const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
  const hl=B.box[2]/2/.1,hw=B.box[0]/2/.1,a=(R()<.5?-1:1)*(R()*.95),b=(R()<.5?-1:1)*(R()*.9);
  s.start();s.setPos(c[0]+u[0]*a*hl+v[0]*b*hw,c[2]+u[1]*a*hl+v[1]*b*hw);s.drop();let mx=0,st='';
  for(let tt=0;tt<16&&s.claw.state!=='done';tt+=1/60){s.step(1/60);stat.frames++;const O=obb(s);
   plates(s.claw).forEach(([a1,b1,sd,r],pi)=>{const d=plateDepth(O,a1,b1,sd,r);if(d>TH&&DBG.length<12)DBG.push({t,k,tt:+tt.toFixed(2),pi,cm:+(d*10).toFixed(2),st:s.claw.state,th:s.claw.th.map(v=>+v.toFixed(2)),y:+s.claw.y.toFixed(2),pen:s.claw.pen.map(v=>+v.toFixed(4)),resid:+(s.claw.resid??0).toFixed(3),c:s.center().map(v=>+v.toFixed(2)),tilt:+s.tilt().toFixed(0),sleep:s.sleeping});if(d>mx){mx=d;st=s.claw.state;}});
   let bm=0;for(const R2 of g.rods)bm=Math.max(bm,plateDepth(O,[g.xl,R2.y,R2.z(g.xl)],[g.xr,R2.y,R2.z(g.xr)],[0,0,0],g.barR));stat.maxBar=Math.max(stat.maxBar,bm);if(bm>TH){stat.barFrames++;if(DBG.length<14)DBG.push({bar:1,t,k,tt:+tt.toFixed(2),cm:+(bm*10).toFixed(2),st:s.claw.state,c:s.center().map(v=>+v.toFixed(2)),tilt:+s.tilt().toFixed(0),rods:g.rods.map(R2=>+(plateDepth(O,[g.xl,R2.y,R2.z(g.xl)],[g.xr,R2.y,R2.z(g.xr)],[0,0,0],g.barR)*10).toFixed(1)),sway:(s.claw.sway??[]).map(v=>+v.toFixed(2)),resid:+(s.claw.resid??0).toFixed(3)});}}
  if(mx>TH){stat.clawPlays++;stat.byState[st]=(stat.byState[st]||0)+1;}
  stat.maxClaw=Math.max(stat.maxClaw,mx);if(s.won){stat.wins++;break;}
  for(let tt=0;tt<1.2;tt+=1/30)s.step(1/30);s.events.length=0;}
}
stat.maxClaw=+(stat.maxClaw*10).toFixed(2)+'cm';stat.maxBar=+(stat.maxBar*10).toFixed(2)+'cm';
console.log(JSON.stringify({mid,...stat}));for(const d of DBG)console.log(JSON.stringify(d));
