// 약한 집게 들림(월드개발 11-24 깊이 2차): 봉 4대 × 상자 가운데·가장자리 근처 겨눔 13곳, 기계 상자 무게 그대로. node lift-all.mjs <뿌리>
// 들림 = 판 동안 상자 가운데가 처음보다 가장 높이 올라간 양, 들고 감 = 15cm 넘게(받침 봉 위로 들어 옮김)
const [root]=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES,BOX_PLUSH}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,U=.1,out={};
const AIMS=[[0,0],[.2,0],[-.2,0],[0,.2],[0,-.2],[.2,.2],[-.2,-.2],[.5,0],[-.5,0],[0,.6],[0,-.6],[.5,.6],[-.5,-.6]];
for(const M of MACHINES.filter(m=>m.kind==='bridge')){const g=P.bridgeGeom(CLAW,M.bars,B),rar=BOX_PLUSH.find(p=>p.id===M.pool[0])?.rarity,mass=rar==='rare'||rar==='special'?B.boxMassRare:B.boxMass;
 let mx=0,sum=0,n=0,carried=0,over8=0;
 for(const [dx,dz] of AIMS)for(const seed of [1,2]){
  const s=P.createBridgeSim({geom:g,box:B.box,mass,seed,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,pose:{x:0,z:0,yaw:Math.PI/2+(seed-1.5)*.1}});
  const c=s.center(),y0=c[1];s.start();s.setPos(c[0]+dx,c[2]+dz);s.drop();let maxY=y0;
  for(let t=0;t<14&&s.claw.state!=='done';t+=1/30){s.step(1/30);maxY=Math.max(maxY,s.center()[1]);}
  const l=(maxY-y0)*U;mx=Math.max(mx,l);sum+=l;n++;if(l>.15)carried++;if(l>.08)over8++;}
 out[M.id]={최대들림_cm:+(mx*100).toFixed(1),평균들림_cm:+(sum/n*100).toFixed(1),'8cm넘음':over8,들고감:carried,판:n};}
console.log(JSON.stringify(out));
