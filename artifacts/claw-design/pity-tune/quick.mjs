// 보장 판 세기 빠른 비교(월드개발 11-23): 더미마다 보통 판 5번 뒤 지정한 세기로 1판(실제 보장 판과 같은 더미 상태) → 성공률
// node quick.mjs <뿌리> <grab> <carry> [더미 수] [시작 번호]
const [root,gs,cs,NS='40',S0='0']=process.argv.slice(2),N=+NS,s0=+S0;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity,pw={grab:+gs,carry:+cs,grip:+(process.env.GRIP??1),...(process.env.SINK?{sink:+process.env.SINK}:{}),...(process.env.PRESS?{press:+process.env.PRESS}:{}),...(process.env.STALL?{stallAt:+process.env.STALL}:{}),...(process.env.BACK?{backAt:+process.env.BACK}:{}),...(process.env.HOLD?{hold:+process.env.HOLD}:{}),...(process.env.GUARD?{guard:true}:{}),...(process.env.OPEN?{open:+process.env.OPEN}:{}),...(process.env.ITERS?{iter:+process.env.ITERS}:{})};
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
let n=0,w=0,lifted=0;
for(let t=s0;t<s0+N;t++){const R=rng(77+t*311),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+11,count:C.dolls,power:C.power});
 const one=power=>{s.claw.power={...power};const live=s.dolls.map((D,i)=>i).filter(i=>!s.dolls[i].gone&&!s.dolls[i].won);const di=live[Math.floor(R()*live.length)],fr=s.frame(di);return P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);};
 const pre=+(process.env.PRE??0);for(let k=0;k<pre;k++)one(C.power);
 const r=one(pw);n++;if(r.won.length)w++;if(r.lifted)lifted++;}
console.log(JSON.stringify({iter:pw.iter,open:pw.open,hold:pw.hold,guard:pw.guard,stall:pw.stallAt,back:pw.backAt,press:pw.press,sink:pw.sink,grip:pw.grip,grab:pw.grab,carry:pw.carry,n,win:w,rate:+(w/n).toFixed(2),lifted}));
