// 직원 도움 판 성공률(11-23 대표 결정): 더미마다 보통 판 PRE번 뒤 직원 도움 → 옮긴 인형을 ±2cm로 겨눠 1판
// node staff.mjs <뿌리> [더미 수] [시작 번호]
const [root,NS='40',S0='0']=process.argv.slice(2),N=+NS,s0=+S0;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
let n=0,w=0,hit=0;
for(let t=s0;t<s0+N;t++){const R=rng(77+t*311),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+11,count:C.dolls,power:C.power});
 const pre=+(process.env.PRE??5);for(let k=0;k<pre;k++){const live=s.dolls.map((D,i)=>i).filter(i=>!s.dolls[i].gone&&!s.dolls[i].won);const di=live[Math.floor(R()*live.length)],fr=s.frame(di);P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);}
 const h=P.staffHelp(s,.8,+(process.env.YAW??Math.PI/2),+(process.env.BACK??.85));if(!h)continue;const fr=s.frame(h.di);const r=P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);n++;if(r.won.length)w++;if(r.won.includes(s.dolls[h.di].id))hit++;}
console.log(JSON.stringify({n,win:w,rate:+(w/n).toFixed(2),movedWon:hit}));
