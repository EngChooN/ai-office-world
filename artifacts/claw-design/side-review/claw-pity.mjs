// 집게 기계 난이도 + 보장(5번 연속 실패 → 다음 판 힘센 집게) 포함. claw-diff.mjs와 같은 겨누기(±2cm)
// node artifacts/claw-design/side-review/claw-pity.mjs <뿌리> [더미 수]
const [root,NS='40']=process.argv.slice(2),N=+NS;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity,AFTER=T.pity.after;
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
let plays=0,wins=0,pityPlays=0,pityWins=0;const first=[];
for(let t=0;t<N;t++){const R=rng(77+t*311),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>C.mass[rar(id)]??1,seed:t+11,count:C.dolls,power:C.power});let f=0,miss=0;
 for(let k=0;k<12;k++){plays++;const pity=miss>=AFTER;s.claw.power={...(C.pityPower&&pity?C.pityPower:C.power)};
  // 11-24 직원 도움(pityPower 없음): 구멍 옆에 세워 준 인형을 겨눔
  const help=pity&&!C.pityPower?P.staffHelp(s):null;
  const live=s.dolls.map((D,i)=>i).filter(i=>!s.dolls[i].gone&&!s.dolls[i].won);const di=help?help.di:live[Math.floor(R()*live.length)],fr=s.frame(di);
  const r=P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);const w=r.won.length>0;
  if(pity){pityPlays++;if(w)pityWins++;}if(w){wins++;miss=0;if(!f)f=k+1;}else miss++;}
 first.push(f||13);}
const sorted=[...first].sort((a,b)=>a-b);
console.log(JSON.stringify({plays,wins,rate:+(wins/plays).toFixed(3),pityPlays,pityRate:+(pityWins/Math.max(1,pityPlays)).toFixed(2),firstMean:+(first.reduce((a,b)=>a+b,0)/N).toFixed(1),firstMedian:sorted[N>>1],in6:first.filter(x=>x<=6).length,in8:first.filter(x=>x<=8).length,noWin12:first.filter(x=>x>12).length,n:N}));
