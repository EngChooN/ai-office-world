// 날아감 한 판 다시 보기: node replay.mjs <뿌리> <기계 id> <상자 t> <판 k> [fixed|hitch]  (probe-fly.mjs와 같은 난수 순서)
// 그 판 drop 직전 보이는 집게 판이 상자에 겹친 깊이·상자 자세, 그리고 가장 빠른 칸 앞뒤 기록
const [root,mid,TT,KK,mode='fixed']=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW_RIG:CL}=await import(root+'/src/claw/claw-physics.js');
const {CLAW,FINGER_ANGLE:FA}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES,BOX_PLUSH}=await import(root+'/src/claw/claw-palette.js');
const E=process.env,B=T.bridge,U=.1,SUB=1/240;if(E.SLACK)P.setBridgeSlack(+E.SLACK);
// 겨누기: 게임처럼 처음 자리에서 →(x) 다음 ↑(z)로 초속 moveSpeed로 옮김(AIM=tele면 바로 옮김 — 콘솔 claw.aim 같은 순간 이동)
const walk=(s,x,z)=>{if(process.env.AIM==='tele'){s.setPos(x,z);return;}const sp=B.moveSpeed/U/60;
 for(let i=0;i<600&&Math.abs(s.claw.x-x)>1e-6;i++){s.setPos(s.claw.x+Math.sign(x-s.claw.x)*Math.min(sp,Math.abs(x-s.claw.x)),s.claw.z);s.step(1/60);if(s.claw.x<=s.geom.RANGE.x0||s.claw.x>=s.geom.RANGE.x1)break;}
 for(let i=0;i<600&&Math.abs(s.claw.z-z)>1e-6;i++){s.setPos(s.claw.x,s.claw.z+Math.sign(z-s.claw.z)*Math.min(sp,Math.abs(z-s.claw.z)));s.step(1/60);if(s.claw.z<=s.geom.RANGE.z0||s.claw.z>=s.geom.RANGE.z1)break;}};
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const M=MACHINES.find(m=>m.id===mid),g=P.bridgeGeom(CLAW,M.bars,B),rar=BOX_PLUSH.find(p=>p.id===M.pool[0])?.rarity,mass=rar==='rare'||rar==='special'?B.boxMassRare:B.boxMass;
const mk=(seed,R)=>P.createBridgeSim({geom:g,box:B.box,mass,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed,pose:P.startPose(B,R)});
const nrm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const obb=s=>{const Q=s.P,c=[Q.x[0],Q.y[0],Q.z[0]],L=nrm([Q.x[3]-Q.x[2],Q.y[3]-Q.y[2],Q.z[3]-Q.z[2]]);let H=[Q.x[1]-Q.x[0],Q.y[1]-Q.y[0],Q.z[1]-Q.z[0]];const k=dot(H,L);H=nrm(H.map((v,i)=>v-k*L[i]));
 return {c,ax:[L,H,[L[1]*H[2]-L[2]*H[1],L[2]*H[0]-L[0]*H[2],L[0]*H[1]-L[1]*H[0]]],h:s.half};};
const loc=(O,p)=>{const d=[p[0]-O.c[0],p[1]-O.c[1],p[2]-O.c[2]];return [dot(d,O.ax[0]),dot(d,O.ax[1]),dot(d,O.ax[2])];},dl=(O,d)=>[dot(d,O.ax[0]),dot(d,O.ax[1]),dot(d,O.ax[2])];
const TIP=CL.l1*Math.cos(CL.rest)+CL.l2*Math.cos(CL.rest-CL.bend),S=CLAW.clawTip/.14/U;
const seen=c0=>{const o=c0.sway,x=c0.x+o[0],y=c0.y+o[1]+CLAW.clawTip/U-TIP,z=c0.z+o[2],out=[];
 for(let k=0;k<2;k++){const sg=k?-1:1,op=Math.max(0,Math.min(1,(c0.th[k]-CL.closed)/(CL.splay-CL.closed))),an=FA.shut+op*(FA.wide-FA.shut);
  const W=([,py,pz])=>[x+sg*(py*Math.sin(an)+pz*Math.cos(an)+.03)*S,y+(py*Math.cos(an)-pz*Math.sin(an))*S,z];for(const F of P.FINGER_PLATES)out.push([W(F.a),W(F.b),[0,0,F.side*S],F.r*S]);}
 out.push([[x-P.HEAD_PLATE.half*S,y+P.HEAD_PLATE.c[1]*S,z],[x+P.HEAD_PLATE.half*S,y+P.HEAD_PLATE.c[1]*S,z],[0,0,P.HEAD_PLATE.side*S],P.HEAD_PLATE.r*S]);return out;};
const overlap=s=>{const O=obb(s);let m=0;for(const [a,b,sd,r] of seen(s.claw)){const H=P.plateBox(loc(O,a),loc(O,b),dl(O,sd),r,s.half);if(H)m=Math.max(m,H.d);}return m*U*100;};
const R=rng(9000+ +TT*7919+mid.charCodeAt(7)*101);
let s=mk(+TT+1,R);
for(let k=0;k<=+KK;k++){
 let c=s.center(),wide=R()<.5,x=wide?g.RANGE.x0+R()*(g.RANGE.x1-g.RANGE.x0):c[0]+(R()*2-1)*1.3,z=wide?g.RANGE.z0+R()*(g.RANGE.z1-g.RANGE.z0):c[2]+(R()*2-1)*1.0;
 const show=k===+KK;
 if(show)console.log('판 앞: 상자',s.center().map(a=>+(a*U).toFixed(3)),'기울기',s.tilt().toFixed(1),'잠듦',s.sleeping,'집게 상태',s.claw.state,'겹침cm(지금 자리)',overlap(s).toFixed(2));
 s.start();if(E.AIM!=='tele'){walk(s,x,z);x=s.claw.x;z=s.claw.z;}if(show)console.log('start 뒤 겹침cm',overlap(s).toFixed(2));s.setPos(x,z);if(show)console.log('setPos 뒤 겹침cm',overlap(s).toFixed(2),'집게',[s.claw.x,s.claw.y,s.claw.z].map(a=>+(a*U).toFixed(3)));s.drop();
 let el=0,log=[];
 if(show&&E.DBG){globalThis.__bdbg=[];}
 const tick=()=>{if(!show)return;if(E.DBG){const [a,b]=E.DBG.split(',').map(Number);if(el>=a&&el<=b){const d=globalThis.__bdbg,base=d[0];console.log(el.toFixed(4),d.map(r=>r[0][0]==='R'?JSON.stringify(r):r[0]+':'+[1,2,3].map(j=>((r[j]-base[j])*1000).toFixed(2)).join('/')).join(' '));}}const Q=s.P;let v=0;for(let i=4;i<Q.x.length;i++)v=Math.max(v,Math.hypot(Q.x[i]-Q.ox[i],Q.y[i]-Q.oy[i],Q.z[i]-Q.oz[i]));
  log.push({t:+el.toFixed(4),st:s.claw.state,v:+(v*U/SUB).toFixed(2),c:s.center().map(a=>+(a*U).toFixed(3)),ov:+overlap(s).toFixed(2),th:s.claw.th.map(a=>+a.toFixed(2)),cy:+(s.claw.y*U).toFixed(3),sw:s.claw.sway.map(a=>+(a*U).toFixed(3)),won:s.won,tilt:+s.tilt().toFixed(0)});};
 for(;el<16&&s.claw.state!=='done';){const dt=mode==='hitch'&&R()<.05?(.05+R()*.2):1/60,n=Math.min(12,Math.round(dt/SUB));for(let i=0;i<n;i++){s.step(SUB);el+=SUB;tick();}}
 for(let q=0;q<1.5*240;q++){s.step(SUB);el+=SUB;tick();}
 s.events.length=0;
 if(show){let bi=0;log.forEach((r,i)=>{if(r.v>log[bi].v)bi=i;});const W=+(E.W??6);for(const r of log.slice(Math.max(0,bi-W),bi+W))console.log(JSON.stringify(r));
  if(E.ALL)for(const r of log.filter((_,i)=>i%+E.ALL===0))console.log(JSON.stringify(r));}
 if(s.won)s=mk(+TT+100+k,R);else if(P.offRails(s,g)||s.outOfReach())s=mk(+TT+200+k,R);
}
