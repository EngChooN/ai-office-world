// 열쇠 기계 성공률 시험(사람 손 모델). node key-rate.mjs [fitScale=1 또는 fit,fitRare] [sigmaMs=60] [판 수]
// 모델: 노리는 칸 = 8칸 중 무작위(희귀 칸 포함), 각 방향 떼는 시각 = 구멍 가운데 도착 시각 + 정규 오차(σ).
// 보장: 실패 pity.after번 연달아면 성공할 때까지 구멍 +pityFitBonus(claw-rules pityNow와 같음). 판당 성공률 = 보장 없는 판 기준, 성공까지 평균 판 = 보장 포함.
import {CLAW_TUNING,judgeKey} from '../../../src/claw/claw-rules.js';
import {MACHINES} from '../../../src/claw/claw-palette.js';
import {keyCellRare} from '../../../src/claw/claw-machines-more.js';
const A=String(process.argv[2]??1),pair=A.includes(',')?A.split(',').map(Number):null,scale=pair?null:+A,sigma=+(process.argv[3]??60)/1000,N=+(process.argv[4]??200000);
const K0=CLAW_TUNING.key,K={...K0,fit:pair?pair[0]:K0.fit*scale,fitRare:pair?pair[1]:K0.fitRare*scale};
let seed=12345;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const q=t=>t;   // 화면 갱신(60·120Hz)은 기기마다 달라 시각 오차에 묻음(60Hz 고정 칸으로 자르면 구멍 크기별로 들쭉날쭉)
const out={fitScale:scale??A,fit:+K.fit.toFixed(4),fitRare:+K.fitRare.toFixed(4),sigmaMs:sigma*1000,machines:{}};
for(const m of MACHINES.filter(m=>m.kind==='key')){
 const rare=(i,j)=>keyCellRare(m.cells[j*K.cols+i]);
 const play=(pity,cell)=>{const i=cell%K.cols,j=Math.floor(cell/K.cols);
  const tx=(i+.5-K.startX)/K.speed,ty=(j*K.cellH+K.holeY-K.startY)/K.speed;
  const x=K.startX+K.speed*Math.max(0,q(tx+gauss()*sigma)),y=K.startY+K.speed*Math.max(0,q(ty+gauss()*sigma));
  return judgeKey(x,y,K,rare,pity).r==='win';};
 let w=0,wr=0,nr=0;for(let n=0;n<N;n++){const c=Math.floor(rnd()*8),ok=play(false,c);w+=ok;if(rare(c%4,Math.floor(c/4))){nr++;wr+=ok;}}
 let tot=0,G=20000;for(let g=0;g<G;g++){let fails=0,k=0;for(;;){k++;const p=fails>=CLAW_TUNING.pity.after;const ok=play(p,Math.floor(rnd()*8));if(ok)break;fails++;}tot+=k;}
 out.machines[m.id]={perPlay:+(w/N*100).toFixed(1),rareCellPerPlay:nr?+(wr/nr*100).toFixed(1):null,avgPlays:+(tot/G).toFixed(2)};
}
console.log(JSON.stringify(out));
