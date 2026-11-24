// 새로고침 뒤 상자 자리(월드개발 11-24): 무작위 판(sim2 겨누기) 뒤 상자가 잠들면 저장 → 다시 놓고 0.4초 → 어긋남. 4mm 넘은 것은 mm 반올림 없이 다시 놓아 비교. node reload.mjs <뿌리> [판 수]
const [root,NS='60']=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,U=.1;function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const out={};
for(const M of MACHINES.filter(m=>m.kind==='bridge')){const g=P.bridgeGeom(CLAW,M.bars,B),R=rng(4242+M.id.charCodeAt(7));
 const mk=(o)=>P.createBridgeSim({geom:g,box:B.box,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,...o});
 let s=mk({seed:1,pose:P.startPose(B,R)}),d=[],exact=[];
 for(let t=0;t<+NS;t++){const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
  const hl=B.box[2]/2/U,hw=B.box[0]/2/U,a=(R()<.5?-1:1)*(.55+R()*.4),b=(R()<.5?-1:1)*(.45+R()*.45);
  P.runBridgeDrop(s,c[0]+u[0]*a*hl+v[0]*b*hw,c[2]+u[1]*a*hl+v[1]*b*hw,B);for(let q=0;q<8&&!s.sleeping;q+=1/30)s.step(1/30);
  if(s.won||P.offRails(s,g)||s.outOfReach()){s=mk({seed:t+2,pose:P.startPose(B,R)});continue;}
  const s2=mk({st:s.boxState()}),dd=Math.hypot(...s.center().map((v,i)=>v-s2.center()[i]))*U*1000;d.push(dd);
  if(dd>4){const ex=[];for(let i=0;i<s.P.x.length;i++)ex.push(s.P.x[i]*100,s.P.y[i]*100,s.P.z[i]*100);const s3=mk({st:ex});exact.push(+(Math.hypot(...s.center().map((v,i)=>v-s3.center()[i]))*U*1000).toFixed(1));}}
 d.sort((a,b)=>a-b);out[M.id]={저장:d.length,'4mm넘음':d.filter(x=>x>4).length,'1cm넘음':d.filter(x=>x>10).length,가장큰_mm:+d.at(-1).toFixed(1),가운데_mm:+d[d.length>>1].toFixed(1),'4mm넘은것_mm반올림없이':exact};}
console.log(JSON.stringify(out));
