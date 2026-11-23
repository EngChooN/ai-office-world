// 막이 봉 밖으로 나가는 모양 세기: node offwhy.mjs <뿌리> [상자 수] [기계]
const [root,NS='12',mid='bridge-1']=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,M=MACHINES.find(m=>m.id===mid),g=P.bridgeGeom(CLAW,M.bars,B);
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const out={plays:0,wins:0,off:[],firstOffPlay:[]};
for(let t=0;t<+NS;t++){const R=rng(1000+t*7919);const s=P.createBridgeSim({geom:g,box:B.box,mass:1,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:t+1,pose:P.startPose(B,R)});
 for(let n=1;n<=10;n++){out.plays++;const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
  const hl=B.box[2]/2/.1,hw=B.box[0]/2/.1,a=(R()<.5?-1:1)*(.55+R()*.4),b=(R()<.5?-1:1)*(.45+R()*.45);
  const r=P.runBridgeDrop(s,c[0]+u[0]*a*hl+v[0]*b*hw,c[2]+u[1]*a*hl+v[1]*b*hw,B);if(r.won){out.wins++;break;}
  if(P.offRails(s,g)){const e=s.center();out.off.push({n,a:+a.toFixed(2),b:+b.toFixed(2),c:e.map(v=>+v.toFixed(2)),tilt:+s.tilt().toFixed(0),sup:+s.support().toFixed(3)});out.firstOffPlay.push(n);break;}}}
console.log(JSON.stringify({mid,plays:out.plays,wins:out.wins,offs:out.off.length,guardZ:g.layout.guardZ,barY:g.barY}));for(const o of out.off.slice(0,10))console.log(JSON.stringify(o));
