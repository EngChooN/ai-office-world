// 집게 기계 판당 성공률 + 겨눈 인형 크기별 잡힘 비율(11-24 집게 키움 재측정). 더미 N개 × 8판, 남은 인형 하나를 ±2cm로 겨눔(claw-diff.mjs와 같은 겨누기)
// node claw-rate.mjs <뿌리> [더미 수] [시작 번호]   환경 GRAB·CARRY로 세기 바꿔 보기
const [root,NS='30',S0='0']=process.argv.slice(2),N=+NS,s0=+S0;
const P=await import(root+'/src/claw/claw-physics.js');const {CLAW}=await import(root+'/src/claw/claw-machine-art.js');
const {CLAW_TUNING:T}=await import(root+'/src/claw/claw-rules.js');const {PLUSH,RARITY}=await import(root+'/src/claw/claw-palette.js');
const g=P.geomFrom(CLAW),C=T.claw,rar=id=>PLUSH.find(p=>p.id===id).rarity,E=process.env;
const power={...C.power,grab:+(E.GRAB??C.power.grab),carry:+(E.CARRY??C.power.carry),...(E.CMIN?{closeMin:+E.CMIN}:{})};
function rng(s){s=s>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
let plays=0,wins=0;const by={};
for(let t=s0;t<s0+N;t++){const R=rng(77+t*311),ids=PLUSH.map(p=>p.id);
 const s=P.createClawSim({geom:g,ids,sizeOf:id=>RARITY[rar(id)].size,massOf:id=>(C.mass[rar(id)]??1)*+(E.MASSK??1),seed:t+11,count:C.dolls,power});
 for(let k=0;k<8;k++){const live=s.dolls.map((D,i)=>i).filter(i=>!s.dolls[i].gone&&!s.dolls[i].won);if(!live.length)break;
  const di=live[Math.floor(R()*live.length)],fr=s.frame(di),rr=rar(s.dolls[di].id);const r=P.runDrop(s,fr.p[0]+(R()-.5)*.4,fr.p[2]+(R()-.5)*.4);
  plays++;if(r.won.length)wins++;(by[rr]??={n:0,got:0,lift:0}).n++;if(r.won.includes(s.dolls[di].id))by[rr].got++;if(s.dolls[di].lifted)by[rr].lift++;}}
for(const k in by)by[k].rate=+(by[k].got/by[k].n).toFixed(2);
console.log(JSON.stringify({power,plays,wins,rate:+(wins/plays).toFixed(3),by}));
