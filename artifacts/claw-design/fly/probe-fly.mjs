// 봉 상자 날아감 재현(월드개발 2026-11-24). node probe-fly.mjs <뿌리> [상자 수/기계] [판/상자] [dt 모드 fixed|hitch]
// 판마다 1/240초 칸 하나씩 돌리며 상자 가장 빠른 공 속도(m/s)·가운데 수평 속도·위로 가는 속도(0.05초 평균 maxUpV, 한 칸 maxUpV1)·솟음(판 시작 위 cm)·유리 밖 여부를 잼.
// 날아감 = 점 속도 > FLY_V(2.5m/s) · 가운데 수평 > FLY_H(2m/s) · 위로(0.05초 평균) > FLY_UV(1m/s) · 솟음 > FLY_UP(15cm) · 유리 밖 중 하나. 가장 나쁜 장면을 기록
const [root,NS='30',NP='12',mode='fixed']=process.argv.slice(2);
const P=await import(root+'/src/claw/claw-bridge-physics.js');
const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');
const {MACHINES,BOX_PLUSH}=await import(root+'/src/claw/claw-palette.js');
const E=process.env,B=T.bridge,U=.1,SUB=1/240,FLY_V=+(E.FLY_V??2.5),FLY_UP=+(E.FLY_UP??.15),FLY_H=+(E.FLY_H??2.0),FLY_UV=+(E.FLY_UV??1.0),ONLY=E.ONLY;
if(E.SLACK)P.setBridgeSlack(+E.SLACK);
// 겨누기: 게임처럼 처음 자리에서 →(x) 다음 ↑(z)로 초속 moveSpeed로 옮김(AIM=tele면 바로 옮김 — 콘솔 claw.aim 같은 순간 이동)
const walk=(s,x,z,cb=()=>{})=>{if(process.env.AIM==='tele'){s.setPos(x,z);return;}const sp=B.moveSpeed/U/60;
 for(let i=0;i<600&&Math.abs(s.claw.x-x)>1e-6;i++){s.setPos(s.claw.x+Math.sign(x-s.claw.x)*Math.min(sp,Math.abs(x-s.claw.x)),s.claw.z);for(let q=0;q<4;q++){s.step(1/240);cb();}if(s.claw.x<=s.geom.RANGE.x0||s.claw.x>=s.geom.RANGE.x1)break;}
 for(let i=0;i<600&&Math.abs(s.claw.z-z)>1e-6;i++){s.setPos(s.claw.x,s.claw.z+Math.sign(z-s.claw.z)*Math.min(sp,Math.abs(z-s.claw.z)));for(let q=0;q<4;q++){s.step(1/240);cb();}if(s.claw.z<=s.geom.RANGE.z0||s.claw.z>=s.geom.RANGE.z1)break;}};
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const all={};let worst=[];
for(const M of MACHINES.filter(m=>m.kind==='bridge'&&(!ONLY||m.id===ONLY))){
 const g=P.bridgeGeom(CLAW,M.bars,B),rar=BOX_PLUSH.find(p=>p.id===M.pool[0])?.rarity,mass=rar==='rare'||rar==='special'?B.boxMassRare:B.boxMass;
 const mk=(seed,R)=>P.createBridgeSim({geom:g,box:B.box,mass,power:{grab:B.clawGrab,carry:B.clawGrab*.8},friction:B.barFriction,openTo:B.clawOpen,seed,pose:P.startPose(B,R)});
 const st={plays:0,flyPlays:0,vHist:[0,0,0,0,0,0],maxV:0,maxUp:0,outside:0,byState:{}};
 for(let t=0;t<+NS;t++){const R=rng(9000+t*7919+M.id.charCodeAt(7)*101);
  let s=mk(t+1,R);const rest=s.center()[1];
  for(let k=0;k<+NP;k++){st.plays++;
   const c=s.center(),wide=R()<.5,x=wide?g.RANGE.x0+R()*(g.RANGE.x1-g.RANGE.x0):c[0]+(R()*2-1)*1.3,z=wide?g.RANGE.z0+R()*(g.RANGE.z1-g.RANGE.z0):c[2]+(R()*2-1)*1.0;
   s.start();let pv=0,pu=0,at=null,el=0,pcv=0,pup=0,pup1=0,prev=s.center(),y0=prev[1];const ring=[];let outNow=false;
   const tick=()=>{const Q=s.P;let v=0;for(let i=4;i<Q.x.length;i++)v=Math.max(v,Math.hypot(Q.x[i]-Q.ox[i],Q.y[i]-Q.oy[i],Q.z[i]-Q.oz[i]));v=v*U/SUB;
    const cc=s.center(),up=(cc[1]-y0)*U,cv=Math.hypot(cc[0]-prev[0],cc[2]-prev[2])*U/SUB,uv=(cc[1]-prev[1])*U/SUB;prev=cc;pcv=Math.max(pcv,cv);pup1=Math.max(pup1,uv);ring.push(cc[1]);if(ring.length>13)ring.shift();if(ring.length===13)pup=Math.max(pup,(ring[12]-ring[0])*U/(12*SUB));if(v>pv){pv=v;at={st:s.claw.state,t:+el.toFixed(3),c:cc.map(a=>+(a*U).toFixed(3)),claw:[s.claw.x,s.claw.y,s.claw.z].map(a=>+(a*U).toFixed(3)),th:s.claw.th.map(a=>+a.toFixed(2)),sway:s.claw.sway.map(a=>+(a*U).toFixed(3))};}
    pu=Math.max(pu,up);const b=g.BOX;if(cc[0]<b.x0||cc[0]>b.x1||cc[2]<b.z0||cc[2]>b.z1||cc[1]>b.top){st.outside++;outNow=true;}};
   walk(s,x,z,tick);s.drop();
   for(;el<16&&s.claw.state!=='done';){const dt=mode==='hitch'&&R()<.05?(.05+R()*.2):1/60,n=Math.min(12,Math.round(dt/SUB));for(let i=0;i<n;i++){s.step(SUB);el+=SUB;tick();}}
   for(let q=0;q<1.5*240;q++){s.step(SUB);el+=SUB;tick();}
   s.events.length=0;st.maxV=Math.max(st.maxV,pv);st.maxUp=Math.max(st.maxUp,pu);
   st.vHist[pv<.25?0:pv<.5?1:pv<1?2:pv<2?3:pv<4?4:5]++;
   st.maxCv=Math.max(st.maxCv??0,pcv);st.maxUpV=Math.max(st.maxUpV??0,pup);st.maxUpV1=Math.max(st.maxUpV1??0,pup1);
   if(pv>FLY_V||pu>FLY_UP||pcv>FLY_H||pup>FLY_UV||outNow){st.flyPlays++;st.byState[at?.st]=(st.byState[at?.st]||0)+1;worst.push({m:M.id,box:t,play:k,aim:[+(x*U).toFixed(3),+(z*U).toFixed(3)],v:+pv.toFixed(2),cv:+pcv.toFixed(2),uv:+pup.toFixed(2),up:+(pu*100).toFixed(1),won:s.won,at});}
   if(s.won)s=mk(t+100+k,R);else if(P.offRails(s,g)||s.outOfReach())s=mk(t+200+k,R);
  }}
 st.maxV=+st.maxV.toFixed(2);st.maxCv=+st.maxCv.toFixed(2);st.maxUpV=+st.maxUpV.toFixed(2);st.maxUpV1=+st.maxUpV1.toFixed(2);st.maxUp=+(st.maxUp*100).toFixed(1)+'cm';all[M.id]=st;}
console.log(JSON.stringify(all));
worst.sort((a,b)=>b.v-a.v);console.log(JSON.stringify(worst.slice(0,+(E.TOP??12))));
