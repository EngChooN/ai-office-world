// 봉 기계 무작위 시험(월드개발, 2026-11-23). 월드디자인 bar4-check/run.mjs와 같은 겨누기(모서리 ±55~95% 길이·±45~90% 폭, 흔들림 ±1.5cm), 상자 N개 × 최대 25판
// node sim.mjs <코드 뿌리> <기계 id> <new|old> [N]
//  new = 지금 규칙(막이 봉 밖·봉 아래 → 바로 다시 놓기, 45° 넘게 누운 채 3판, 진척 없음 6판, 8판 실패 → 직원 도움(아슬아슬이면 미룸))
//  old = 11-23 배포 규칙(진척 없음 6판·닿지 않음만 다시 놓기, 8판 실패 → 힘센 집게 1.5배)
const [root,mid,mode='new',NS='40']=process.argv.slice(2),N=+NS,CAP=25,NEW=mode==='new';
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES,BOX_PLUSH}=await import(root+'/src/claw/claw-palette.js');
const E=process.env,B={...T.bridge,...(E.FRIC?{barFriction:+E.FRIC}:{}),...(E.GRAB?{clawGrab:+E.GRAB}:{})},S=T.share,M0=MACHINES.find(m=>m.id===mid),M={...M0,bars:E.GAP?{gap:+E.GAP}:E.NEAR?{near:+E.NEAR,far:+E.FAR}:M0.bars},box=M.pool[0],rar=BOX_PLUSH.find(p=>p.id===box)?.rarity;
const mass=rar==='rare'||rar==='special'?B.boxMassRare:B.boxMass;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const res=[];let resets={off:0,lay:0,still:0,reach:0,staff:0};
for(let t=0;t<N;t++){const R=rng(1000+t*7919),g=P.bridgeGeom(CLAW,M.bars,B);let seed=t+1;
 const mk=()=>P.createBridgeSim({geom:g,box:B.box,mass,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:seed++,pose:P.startPose(B,R)});
 let s=mk(),n=0,won=false,fails=0,still=0,lay=0;
 while(!won&&n<CAP){n++;
  const pity=fails>=8;
  if(pity){if(NEW){if(!P.nearState(s,B)){s=mk();still=0;lay=0;fails=0;resets.staff++;}}else s.claw.power={grab:B.clawGrab*1.5,carry:B.clawGrab*1.2};}
  else s.claw.power={grab:B.clawGrab,carry:B.clawGrab*.8};
  const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
  const hl=B.box[2]/2/.1,hw=B.box[0]/2/.1,a=(R()<.5?-1:1)*(.55+R()*.4),b=(R()<.5?-1:1)*(.45+R()*.45);
  const nx=(R()+R()+R()-1.5)*.15,nz=(R()+R()+R()-1.5)*.15,before=P.bridgeSnap(s);
  const r=P.runBridgeDrop(s,c[0]+u[0]*a*hl+v[0]*b*hw+nx,c[2]+u[1]*a*hl+v[1]*b*hw+nz,B);won=r.won;if(won)break;
  fails++;still=P.noProgress(s,before,S)?still+1:0;lay=s.tilt()>(B.lieDeg??999)?lay+1:0;
  let why=s.outOfReach()?'reach':still>=S.stuckPlays?'still':NEW&&P.offRails(s,g)?'off':NEW&&lay>=B.liePlays?'lay':null;
  if(why){resets[why]++;s=mk();still=0;lay=0;}
 }
 res.push(won?n:CAP+1);}
const sorted=[...res].sort((a,b)=>a-b),mean=res.reduce((a,b)=>a+Math.min(b,CAP),0)/N;
console.log(JSON.stringify({mid,mode,box,mass,bars:M.bars,mean:+mean.toFixed(1),median:sorted[N>>1]>CAP?'>25':sorted[N>>1],within6:res.filter(x=>x<=6).length,within12:res.filter(x=>x<=12).length,win25:res.filter(x=>x<=CAP).length,n:N,resets}));
