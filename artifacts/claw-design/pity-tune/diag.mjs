// 보장 판 실패 원인 보기: 조임 끝 손가락 각도·집게 높이·겨눈 인형 최고 높이·닿음
const [root,gs,NS='12']=process.argv.slice(2),N=+NS;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
console.log('geom',JSON.stringify({CHUTE:g.CHUTE,HOME:g.HOME}));console.log('CL',JSON.stringify(P.CLAW_RIG??null));
for(let t=0;t<N;t++){const R=rng(77+t*311),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+11,count:C.dolls,power:C.power});
 const pick=()=>{const live=s.dolls.map((D,i)=>i).filter(i=>!s.dolls[i].gone&&!s.dolls[i].won);return live[Math.floor(R()*live.length)];};
 for(let k=0;k<5;k++){s.claw.power={...C.power};const di=pick(),fr=s.frame(di);P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);}
 s.claw.power={grab:+gs,carry:+gs};const di=pick(),fr=s.frame(di),D=s.dolls[di];const y0=s.P.y[D.first];
 const x=fr.p[0]+(R()-.5)*.4,z=fr.p[2]+(R()-.5)*.4;s.start();s.setPos(x,z);s.drop();
 let info={},maxY=y0,won=false,st='';
 for(let tt=0;tt<14&&s.claw.state!=='done';tt+=1/30){s.step(1/30);const c=s.claw;
  if(c.state!==st){if(st==='close')info.closeEnd={th:c.th.map(v=>+v.toFixed(2)),y:+c.y.toFixed(2),pen:c.pen.map(v=>+v.toFixed(3)),resid:+c.resid.toFixed(3)};if(c.state==='release'||c.state==='carry'||c.state==='done')info[c.state]={dy:+(s.P.y[D.first]-c.y).toFixed(2),dx:+(s.P.x[D.first]-c.x).toFixed(2),dz:+(s.P.z[D.first]-c.z).toFixed(2),y:+s.P.y[D.first].toFixed(2)};if(c.state==="close")info.closeStart={hub:+c.hubPen.toFixed(3),pen:+(c.pen[0]+c.pen[1]+c.pen[2]).toFixed(3),resid:+c.resid.toFixed(3),y:+c.y.toFixed(2),th:c.th.map(v=>+v.toFixed(2)),dollTop:+(y0).toFixed(2)};st=c.state;}
  maxY=Math.max(maxY,s.P.y[D.first]);for(const e of s.events.splice(0))if(e.type==='won')won=true;}
 console.log(t,D.id,'won',won,'rise',+(maxY-y0).toFixed(2),'aimOff',+Math.hypot(x-fr.p[0],z-fr.p[2]).toFixed(2),JSON.stringify(info));}
