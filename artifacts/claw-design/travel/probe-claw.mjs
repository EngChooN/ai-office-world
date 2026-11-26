// 집게 기계: 쉼 높이로 옮겨 다니는 집게 발끝(clawTop) 아래로 솟은 인형이 범위 안에 얼마나 있나 + 옮기며 미는지(월드공통개발, 2026-11-26)
// node probe-claw.mjs <코드 뿌리> [판 수=30]
const [root,NS="30"]=process.argv.slice(2),N=+NS;
const PH=await import(root+'/src/claw/claw-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const pl=await import(root+'/src/claw/claw-plush.js');
const size=pl.plushSize??(id=>.24);
const G=PH.geomFrom(CLAW),U=.1,C=T.claw,tip=(CLAW.clawTop-CLAW.floorY);
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const out=[];
for(const M of MACHINES.filter(m=>m.kind==='claw')){
 let plays=0,over=0,pushed=0,maxTop=0,staffOver=0;
 for(let t=0;t<N;t++){const R=rng(77+t*131);
  const sim=PH.createClawSim({geom:G,ids:M.pool,sizeOf:size,seed:t*7+1,count:C.dolls,power:C.power});
  for(let p=0;p<6;p++){
   if(p===5)PH.staffHelp(sim);
   // 범위 안 가장 높은 인형 윗면
   let top=0;for(const D of sim.dolls){if(D.gone)continue;for(let i=D.first;i<D.first+D.n;i++){const x=sim.P.x[i],z=sim.P.z[i];if(x>G.RANGE.x0-1&&x<G.RANGE.x1+1&&z>G.RANGE.z0-1&&z<G.RANGE.z1+1)top=Math.max(top,sim.P.y[i]+sim.P.r[i]);}}
   top*=U;maxTop=Math.max(maxTop,top);plays++;if(top>tip-.01){over++;if(p===5)staffOver++;}
   // 옮기기: 처음 자리 → 무작위 목표, x 다음 z
   const X=G.RANGE.x0+R()*(G.RANGE.x1-G.RANGE.x0),Z=G.RANGE.z0+R()*(G.RANGE.z1-G.RANGE.z0);
   sim.start();let x=sim.claw.x,z=sim.claw.z;const sp=C.moveSpeed/U/30;const snap=sim.P.y.slice(),sx=sim.P.x.slice(),sz=sim.P.z.slice();
   for(let k=0;k<400;k++){if(Math.abs(X-x)>1e-6)x+=Math.sign(X-x)*Math.min(Math.abs(X-x),sp);else if(Math.abs(Z-z)>1e-6)z+=Math.sign(Z-z)*Math.min(Math.abs(Z-z),sp);else break;sim.setPos(x,z);sim.step(1/30);}
   let mv=0;for(let i=0;i<snap.length;i++)mv=Math.max(mv,Math.hypot(sim.P.x[i]-sx[i],sim.P.y[i]-snap[i],sim.P.z[i]-sz[i]));if(mv*U>.005)pushed++;
   sim.drop();for(let tt=0;tt<14&&sim.claw.state!=='done';tt+=1/30)sim.step(1/30);for(let tt=0;tt<1;tt+=1/30)sim.step(1/30);sim.events.length=0;
  }}
 out.push({id:M.id,tipCm:+(tip*100).toFixed(1),plays,overPct:+(over/plays*100).toFixed(1),staffOver,pushed,maxTopCm:+(maxTop*100).toFixed(1)});
}
console.log(JSON.stringify(out));
