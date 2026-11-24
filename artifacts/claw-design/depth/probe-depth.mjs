// 봉 기계 집게 하강 깊이 측정(월드공통개발 11-24). node probe-depth.mjs <코드 뿌리>
// 상자 가운데 위에서 내림 → 멈춘 높이·이유, 그 순간 그림 발끝(고무 끝 아래)이 상자 윗면에서 몇 cm 아래인지
const [root]=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW_RIG:CL}=await import(root+'/src/claw/claw-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES}=await import(root+'/src/claw/claw-palette.js');
const B=T.bridge,FP=P.FINGER_PLATES,FA=P.FINGER_ANGLE_B;
const tipLow=(s)=>{const g=s.geom,S=g.rig.scale,c=s.claw;let lo=99,out=0;for(let k=0;k<2;k++){const o=Math.max(0,Math.min(1,(c.th[k]-CL.closed)/(CL.splay-CL.closed))),an=FA.shut+o*(FA.wide-FA.shut),ca=Math.cos(an),sa=Math.sin(an);
 for(const F of FP)for(const p of [F.a,F.b]){const y1=p[1]*ca-p[2]*sa;const z1=p[1]*sa+p[2]*ca+(P.FINGER_PIVOT_Z??.03);lo=Math.min(lo,c.y+(g.rig.headUp??0)+c.sway[1]+(y1-F.r)*S);out=Math.max(out,z1*S);}}return {lo,out};};
const out={};
for(const M of MACHINES.filter(m=>m.kind==='bridge')){
 const g=P.bridgeGeom(CLAW,M.bars,B);
 const s=P.createBridgeSim({geom:g,box:B.box,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed:3,pose:{x:0,z:0}});
 const c=s.center(),boxTop=c[1]+s.half[1];
 s.start();s.setPos(c[0],c[2]);s.drop();
 let at=null,minTip=99;
 for(let t=0;t<8&&s.claw.state!=='lift';t+=1/240){s.step(1/240);if(s.claw.state==='close'&&!at){const tp=tipLow(s);at={clawY:s.claw.y,minY:s.claw.minY,tip:tp.lo,half:tp.out};}
  if(s.claw.state==='close')minTip=Math.min(minTip,tipLow(s).lo);}
 out[M.id]={하강_cm:+((g.HOME.y-at.clawY)*10).toFixed(1),멈춤:at.clawY<=at.minY+.02?'최저제한':'닿음',
  멈출때_발끝_상자윗면아래_cm:+((boxTop-at.tip)*10).toFixed(1),조일때_가장낮은_발끝_상자윗면아래_cm:+((boxTop-minTip)*10).toFixed(1),벌린발_반폭_cm:+(at.half*10).toFixed(1),상자높이_cm:+(s.half[1]*20).toFixed(1)};
}
console.log(JSON.stringify(out));
