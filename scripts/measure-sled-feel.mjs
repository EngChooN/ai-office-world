// 썰매 조작감 수치(월드개발, 2026-11-17 5차): 브라우저 없이 sled.js 계산만으로 잰다. 코스 6개(시드 1~6) 평균.
//  가속: 출발 뒤 5·8m/s에 닿는 시간, 출발 5초 동안 평균 가속, 최고 속도, 평균 속도, 최고 속도 상한에 붙어 있는 비율, 결승 시간(잘 타는 자동 조종)
//  조향: 7m/s 직선에서 왼쪽 끝까지 누른 뒤 → 썰매 방향 10°가 되기까지, 0.5초 뒤 옆으로 간 거리, 놓은 뒤 0°로 돌아오기까지
//   node scripts/measure-sled-feel.mjs [라벨] → artifacts/christmas-sled/feel-<라벨>.json
import {mkdirSync,writeFileSync} from 'node:fs';
import {makeCourse} from '../src/christmas/sled-course.js';
import {createRide,goodInput,courseGrip,SLED_RULES,setSledFeel,sledFeel} from '../src/christmas/sled.js';
setSledFeel(Number(process.env.FEEL??1)); // FEEL=2 = 조작감 2
const label=process.argv[2]??'now',dir='artifacts/christmas-sled';mkdirSync(dir,{recursive:true});
const dt=1/60,D=180/Math.PI,avg=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2);
const rows=[];
for(const seed of [1,2,3,4,5,6]){
 const course=makeCourse(seed),grip=courseGrip(course);
 // 가속·속도
 let r=createRide({course,grip}),t=0,t5=null,t8=null,vmax=0,vsum=0,n=0,atCap=0,v5s=null,fin=null;
 while(!r.done&&t<200){for(const e of r.step(dt,goodInput(r)))if(e.type==='finish')fin=e.t;t+=dt;
  if(r.t>0){vmax=Math.max(vmax,r.v);if(!r.finished){vsum+=r.v;n++;if(r.v>=(sledFeel()===2?11.5:SLED_RULES.maxSpeed)-.3)atCap++;}if(t5==null&&r.v>=5)t5=r.t;if(t8==null&&r.v>=8)t8=r.t;if(v5s==null&&r.t>=5)v5s=r.v;}}
 // 조향: 7m/s로 곧게 가다가 왼쪽 끝까지
 r=createRide({course,grip,v0:7,start:2});for(let i=0;i<30;i++)r.step(dt,{steer:0});
 let tt=0,t10=null;const off0=r.off;let off05=null;
 while(tt<1.5){r.step(dt,{steer:-1});tt+=dt;if(t10==null&&Math.abs(r.psi)*D>=10)t10=tt;if(off05==null&&tt>=.5)off05=Math.abs(r.off-off0);}
 let tb=0;while(tb<3&&Math.abs(r.psi)*D>1){r.step(dt,{steer:0});tb+=dt;}
 rows.push({seed,grip:+grip.toFixed(2),t5:+(t5??-1).toFixed(2),t8:+(t8??-1).toFixed(2),accel5s:+((v5s??0)/5).toFixed(2),vmax:+vmax.toFixed(2),vavg:+(vsum/Math.max(1,n)).toFixed(2),capPct:Math.round(atCap/Math.max(1,n)*100),fin:+(fin??-1).toFixed(1),
  turn10:+(t10??-1).toFixed(2),side05:+(off05??0).toFixed(2),back1deg:+tb.toFixed(2)});
}
const sum=Object.fromEntries(Object.keys(rows[0]).filter(k=>k!=='seed').map(k=>[k,avg(rows.map(r=>r[k]))]));
console.log(JSON.stringify(sum));for(const r of rows)console.log(JSON.stringify(r));
writeFileSync(`${dir}/feel-${label}.json`,JSON.stringify({label,feel:sledFeel(),at:new Date().toISOString(),avg:sum,rows},null,1));
