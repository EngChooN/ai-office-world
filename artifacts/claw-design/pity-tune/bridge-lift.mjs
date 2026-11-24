// 봉 상자 가운데를 조였을 때 얼마나 들리나(약한 집게 확인, 11-24): 상자 가운데 ±2cm 여러 곳 × 세기
// node bridge-lift.mjs <뿌리> <clawGrab...>
const [root,...gs]=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const B=T.bridge,U=.1;
for(const gr of gs.map(Number)){let mx=0,sum=0,n=0,carried=0;
 for(const [dx,dz] of [[0,0],[.2,0],[-.2,0],[0,.2],[0,-.2],[.2,.2],[-.2,-.2]]){
  const s=P.createBridgeSim({geom:P.bridgeGeom(CLAW,{gap:.16},B),box:B.box,power:{grab:gr,carry:gr*.8},friction:B.barFriction,openTo:B.clawOpen});
  const c=s.center(),y0=c[1];s.start();s.setPos(c[0]+dx,c[2]+dz);s.drop();let maxY=y0;
  for(let t=0;t<14&&s.claw.state!=='done';t+=1/30){s.step(1/30);maxY=Math.max(maxY,s.center()[1]);}
  const l=(maxY-y0)*U;mx=Math.max(mx,l);sum+=l;n++;if(l>.15)carried++;}
 console.log(JSON.stringify({grab:gr,maxLift:+mx.toFixed(3),meanLift:+(sum/n).toFixed(3),carried}));}
