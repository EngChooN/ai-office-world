// 직원이 세운 인형을 겨눴을 때 단계별 기록(11-24 큰 집게 진단)
const [root,NS='8']=process.argv.slice(2),N=+NS;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity;
for(let t=0;t<N;t++){const s=P.createClawSim({geom:g,ids:PLUSH.map(p=>p.id),sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+11,count:C.dolls,power:C.power});
 const h=P.staffHelp(s);const D=s.dolls[h.di],fr=s.frame(h.di),y0=fr.p[1];s.start();s.setPos(fr.p[0],fr.p[2]);const at=[s.claw.x,s.claw.z];s.drop();
 let st='',info=[],maxY=y0,won=false;
 for(let tt=0;tt<14&&s.claw.state!=='done';tt+=1/30){s.step(1/30);const c=s.claw;maxY=Math.max(maxY,s.P.y[D.first]);for(const e of s.events.splice(0))if(e.type==='won'&&e.doll===h.di)won=true;
  if(c.state!==st){st=c.state;info.push(`${st}:y${c.y.toFixed(2)} th${c.th.map(v=>v.toFixed(2)).join('/')} doll(${(s.P.x[D.first]-c.x).toFixed(2)},${s.P.y[D.first].toFixed(2)},${(s.P.z[D.first]-c.z).toFixed(2)})`);}}
 console.log(t,D.id,'aim off',(Math.hypot(at[0]-fr.p[0],at[1]-fr.p[2])).toFixed(2),'rise',(maxY-y0).toFixed(2),'won',won,'\n  '+info.join('\n  '));}
