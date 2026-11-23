// 집게 기계 난이도: 더미 N개 × 8판, 매 판 남은 인형 하나(구멍에서 먼 순 아님, 무작위)의 몸 가운데를 ±2cm 흔들어 겨눔 → 판당 성공률·첫 성공까지 판 수
// node claw-diff.mjs <뿌리> [더미 수]
const [root,NS='30']=process.argv.slice(2),N=+NS;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
let plays=0,wins=0;const first=[];
for(let t=0;t<N;t++){const R=rng(77+t*311),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+11,count:C.dolls,power:C.power});let f=0;
 for(let k=0;k<8;k++){plays++;const live=s.dolls.map((D,i)=>i).filter(i=>!s.dolls[i].gone&&!s.dolls[i].won);const di=live[Math.floor(R()*live.length)],fr=s.frame(di);
  const r=P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);if(r.won.length){wins++;if(!f)f=k+1;}}
 first.push(f||9);}
console.log(JSON.stringify({root:root.slice(-14),plays,wins,rate:+(wins/plays).toFixed(3),firstWinMean:+(first.reduce((a,b)=>a+b,0)/N).toFixed(1),noWin8:first.filter(x=>x>8).length,n:N}));
