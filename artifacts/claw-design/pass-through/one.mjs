// 한 장면 자세히: node one.mjs <뿌리> <t> <k> <from> <to>
const [root,T0,K0,FROM,TO]=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,M=MACHINES.find(m=>m.id==='bridge-1'),g=P.bridgeGeom(CLAW,M.bars,B);
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const t=+T0,R=rng(500+t*977);
const s=P.createBridgeSim({geom:g,box:B.box,mass:B.boxMass,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:t+1,pose:P.startPose(B,R)});
for(let k=0;k<4;k++){const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
 const hl=B.box[2]/2/.1,hw=B.box[0]/2/.1,a=(R()<.5?-1:1)*(R()*.95),b=(R()<.5?-1:1)*(R()*.9);
 s.start();s.setPos(c[0]+u[0]*a*hl+v[0]*b*hw,c[2]+u[1]*a*hl+v[1]*b*hw);s.drop();
 for(let tt=0;tt<16&&s.claw.state!=='done';tt+=1/60){
  if(k===+K0&&tt>=+FROM&&tt<=+TO){for(let i=0;i<4;i++){s.step(1/240);const f=s.frame();
   console.log(JSON.stringify({tt:+tt.toFixed(3),i,st:s.claw.state,cx:+s.claw.x.toFixed(2),cy:+s.claw.y.toFixed(2),th:s.claw.th.map(v=>+v.toFixed(3)),pen:s.claw.pen.map(v=>+v.toFixed(3)),resid:+s.claw.resid.toFixed(3),
    box:f.p.map(v=>+v.toFixed(2)),up:f.up.map(v=>+v.toFixed(2)),side:f.side.map(v=>+v.toFixed(2))}));}}
  else s.step(1/60);}
 if(k===+K0)break;
 for(let tt=0;tt<1.2;tt+=1/30)s.step(1/30);s.events.length=0;}
