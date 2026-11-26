// 봉 기계: 집게가 옮겨 다닐 때(move) 상자를 치는지 재현(월드공통개발, 2026-11-26)
// node probe.mjs <코드 뿌리> [N=40]  — bar-tune-v3 겨누기 그대로, 판마다 게임처럼 → (x) 다음 ↑(z) 로 moveSpeed로 옮기며 닿음·상자 이동을 잼
const [root,NS="40"]=process.argv.slice(2),N=+NS,CAP=25;
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES,BOX_PLUSH}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,S=T.share,U=.1;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const out=[],TOPS=[];
for(const M of MACHINES.filter(m=>m.kind==='bridge')){
 const rar=BOX_PLUSH.find(p=>p.id===M.pool[0])?.rarity,mass=rar==='rare'||rar==='special'?B.boxMassRare:B.boxMass;
 let plays=0,hit=0,push5=0,push20=0,maxPush=0,minGap=Infinity,hitTilted=0,wins=0,sumN=0,carryHit=0;
 for(let t=0;t<N;t++){const R=rng(1000+t*7919),g=P.bridgeGeom(CLAW,M.bars,B);let seed=t+1;
  const mk=()=>P.createBridgeSim({geom:g,box:B.box,mass,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:seed++,pose:P.startPose(B,R)});
  let s=mk(),n=0,won=false,fails=0,still=0,lay=0;
  while(!won&&n<CAP){n++;
   if(fails>=8&&!P.nearState(s,B)){s=mk();still=0;lay=0;fails=0;}
   const Q=s.P,c=s.center(),ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],al=Math.hypot(...ax),u=[ax[0]/al,ax[1]/al],v=[-u[1],u[0]];
   const hl=B.box[2]/2/U,hw=B.box[0]/2/U,a=(R()<.5?-1:1)*(.55+R()*.4),b=(R()<.5?-1:1)*(.45+R()*.45);
   const nx=(R()+R()+R()-1.5)*.15,nz=(R()+R()+R()-1.5)*.15;
   const tx=c[0]+u[0]*a*hl+v[0]*b*hw+nx,tz=c[2]+u[1]*a*hl+v[1]*b*hw+nz;
   // 옮기기: 게임처럼 처음 자리 → x 다음 z (범위 밖이면 범위 끝에서 멈춤)
   s.settle(+(process.env.SETTLE??2));const before=P.bridgeSnap(s),c0=s.center(),tilt0=s.tilt();let top0=-1e9;for(let i=4;i<s.P.x.length;i++)top0=Math.max(top0,s.P.y[i]+s.parts[i][3]);TOPS.push(top0*U);s.start();
   const RG=g.RANGE,X=Math.max(RG.x0,Math.min(RG.x1,tx)),Z=Math.max(RG.z0,Math.min(RG.z1,tz));
   let x=s.claw.x,z=s.claw.z,sp=B.moveSpeed/U/30,touched=false;
   const probe=()=>{ // 집게 판과 상자 사이 가장 가까운 틈(겹치면 음수 대신 0) — 판 아래 끝 높이 - 상자 윗점
    let top=-Infinity;for(let i=4;i<s.P.x.length;i++)top=Math.max(top,s.P.y[i]+s.parts[i][3]);return top;};
   for(let k=0;k<400;k++){if(Math.abs(X-x)>1e-6)x+=Math.sign(X-x)*Math.min(Math.abs(X-x),sp);else if(Math.abs(Z-z)>1e-6)z+=Math.sign(Z-z)*Math.min(Math.abs(Z-z),sp);else break;
    s.setPos(x,z);s.step(1/30);const cc=s.center();const d=Math.hypot(cc[0]-c0[0],cc[1]-c0[1],cc[2]-c0[2])*U;if(d>.0005&&!touched){touched=true;}maxPush=Math.max(maxPush,d);}
   // 지나가며 쓸린 거리
   const cc=s.center(),d=Math.hypot(cc[0]-c0[0],cc[2]-c0[2],cc[1]-c0[1])*U;plays++;if(touched){hit++;if(tilt0>20)hitTilted++;}if(d>.005)push5++;if(d>.02)push20++;
   // 상자 윗점과 쉼 높이 집게 아래 끝 틈
   s.drop();for(let tt=0;tt<14&&s.claw.state!=='done';tt+=1/30)s.step(1/30);for(let tt=0;tt<1.2;tt+=1/30)s.step(1/30);s.events.length=0;
   won=s.won;if(won){wins++;break;}
   fails++;still=P.noProgress(s,before,S)?still+1:0;lay=s.tilt()>B.lieDeg?lay+1:0;
   if(s.outOfReach()||still>=S.stuckPlays||P.offRails(s,g)||lay>=B.liePlays){s=mk();still=0;lay=0;}
  }
  sumN+=won?n:CAP;}
 const ts=TOPS.splice(0).sort((a,b)=>a-b);out.push({id:M.id,top50:+(ts[ts.length>>1]*100).toFixed(1),top90:+(ts[Math.floor(ts.length*.9)]*100).toFixed(1),topMax:+(ts[ts.length-1]*100).toFixed(1),plays,hitPct:+(hit/plays*100).toFixed(1),hitTilted,push5mm:push5,push2cm:push20,maxPushCm:+(maxPush*100).toFixed(1),mean:+(sumN/N).toFixed(1)});
}
console.log(JSON.stringify(out,null,0));
