// 크리스마스 광장 「밝고 화려하게」 시안 점검(월드아트 11-17): node scripts/verify-christmas-festive.mjs
// 실제 게임 화면 /christmas/ 를 지금(look 없음)·시안 A(?look=festive)·시안 B(?look=festive-b)로 열어
//  ① 오류 0건 ② 시안이 더한 충돌(노점·장식)이 놀이 자리·입구→놀이 자리 직선 길·모닥불 자리·전시 자리를 막지 않음
//  ③ 그리기 호출·삼각형·프레임 시간(같은 자리·같은 시점, 헤드리스라 절대값보다 차이를 봄) ④ 입구 자리 3인칭 캡처(PC·휴대폰)
// 개발 서버를 먼저 띄운다(BASE_URL 기본 http://127.0.0.1:5181). 결과 artifacts/christmas-festive/game-*.png, report.json
import {chromium} from 'playwright';
import {writeFileSync,mkdirSync} from 'node:fs';
import {collideXmas} from '../src/christmas/collide.js';
import {RINK,CAROUSEL} from '../src/christmas/festive-layout.js';
// 입구(SPAWN)에서 목표 반경 안까지 걷는 최단 길이(m, 0.3m 칸 8방향). 막혀 못 가면 null.
function walkLen(cols,t,SPAWN){const S=.3,x0=-46,z0=-120,W=Math.ceil(92/S),Hn=Math.ceil(168/S),free=new Uint8Array(W*Hn),dist=new Float64Array(W*Hn).fill(Infinity);
 const X=i=>x0+i*S,Z=j=>z0+j*S;for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const x=X(i),z=Z(j),p=collideXmas(x,z,cols);free[j*W+i]=Math.hypot(p.x-x,p.z-z)<.01?1:0;}
 const si=Math.round((SPAWN.x-x0)/S),sj=Math.round((SPAWN.z-z0)/S);dist[sj*W+si]=0;const q=[[sj*W+si,0]];const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
 // 다익스트라(단순 배열 힙)
 const heap=[];const push=(k,d)=>{heap.push([k,d]);let n=heap.length-1;while(n){const p=(n-1)>>1;if(heap[p][1]<=heap[n][1])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let n=0;for(;;){const l=2*n+1,r=l+1;let m=n;if(l<heap.length&&heap[l][1]<heap[m][1])m=l;if(r<heap.length&&heap[r][1]<heap[m][1])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
 push(sj*W+si,0);
 while(heap.length){const [k,d]=pop();if(d>dist[k])continue;const i=k%W,j=(k-i)/W;if(Math.hypot(X(i)-t.x,Z(j)-t.z)<=Math.max(1,t.r*.8))return +(d*S).toFixed(1);
  for(const [di,dj,c] of D){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=W||nj>=Hn)continue;const nk=nj*W+ni;if(!free[nk])continue;const nd=d+c;if(nd<dist[nk]){dist[nk]=nd;push(nk,nd);}}}
 return null;}
const base=process.env.BASE_URL??'http://127.0.0.1:5181',out='artifacts/christmas-festive';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const looks=[['now','classic'],['a','festive'],['b','']],  // 11-17: 주소 없음 = 시안 B(기본), 예전 화면은 ?look=classic
 report={},fails=[];
async function open(look,w,h){const mobile=w<900;
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource|WebSocket|ERR_CONNECTION/.test(m.text()))errs.push(m.text());});
 await page.goto(`${base}/christmas/?capture=1&serverpick=off${mobile?'&mobile=1':''}${look?`&look=${look}`:''}`);
 await page.waitForFunction(()=>window.xmas?.village&&window.xmas.fps>0,null,{timeout:120000});
 // 같은 자리·시점: 입구 안쪽에서 트리를 봄
 // 배치는 그 화면의 layout(시안 B = 넓힌 광장, 11-17 4차)
 const L=await page.evaluate(()=>{const L=window.xmas.village.layout;return {TARGETS:L.TARGETS,SPAWN:L.SPAWN,seats:L.campfireSeats(),display:L.displaySlots(),stand:L.MAILBOX.stand,radius:L.PLAZA.radius};});
 await page.evaluate(([x,z])=>{window.xmas.teleport(x,z,0);window.xmas.cam.pitch=.22;window.xmas.cam.dist=5.5;},[L.SPAWN.x,L.SPAWN.z+1.5]);
 await page.waitForTimeout(2500);return {page,errs,mobile,L};}
const frameMs=page=>page.evaluate(()=>new Promise(r=>{const t=[];let last=performance.now();const f=now=>{t.push(now-last);last=now;if(t.length<120)requestAnimationFrame(f);else{t.sort((a,b)=>a-b);r(+t[60].toFixed(2));}};requestAnimationFrame(f);}));
let baseCols=null;
for(const [key,look] of looks){
 for(const [w,h] of [[1920,1080],[390,844]]){
  const {page,errs,mobile,L}=await open(look,w,h),tag=`${key}-${mobile?'mobile':'pc'}`,{TARGETS,SPAWN}=L;
  const s=await page.evaluate(()=>window.xmas.status());const ms=await frameMs(page);
  await page.screenshot({path:`${out}/game-${tag}.png`});
  const cols=await page.evaluate(()=>window.xmas.village.colliders.map(c=>({...c})));
  baseCols=await page.evaluate(()=>window.xmas.village.baseColliders);
  report[tag]={frameMs:ms,colliders:cols.length,calls:s.calls,tris:s.tris,plaza:L.radius,errors:errs};
  if(errs.length)fails.push(`${tag} 오류 ${errs.length}건: ${errs[0]}`);
  // ② 시안이 더한 충돌만 골라 막힘 검사(몸 반지름 0.22 + 여유 0.1)
  if(key!=='now'&&baseCols!==null){const extra=cols.slice(baseCols),R=.32;
   const hit=(x,z)=>extra.find(c=>{if(c.r!==undefined)return Math.hypot(x-c.x,z-c.z)<c.r+R;const co=Math.cos(c.heading??0),si=Math.sin(c.heading??0),dx=x-c.x,dz=z-c.z,lx=dx*co-dz*si,lz=dx*si+dz*co;return Math.abs(lx)<c.w/2+R&&Math.abs(lz)<c.d/2+R;});
   const spots=[...Object.entries(TARGETS).map(([k,t])=>[k,t.x,t.z]),...L.seats.map(s=>['모닥불 자리'+s.id,s.x,s.z]),...L.display.map(s=>['전시 자리'+s.id,s.x,s.z]),['우체통 앞',L.stand.x,L.stand.z]];
   for(const [name,x,z] of spots){if(hit(x,z))fails.push(`${tag} ${name} 자리가 막힘`);}
   // 입구 → 각 놀이 자리: 0.3m 칸 길 찾기(충돌 = collide.js 그대로). 시안 전후 걸음 길이를 비교해 15% 넘게 돌아가면 실패.
   for(const [name,t] of Object.entries(TARGETS)){const a=walkLen(cols.slice(0,baseCols),t,SPAWN),b=walkLen(cols,t,SPAWN);
    report[tag].walk=report[tag].walk??{};report[tag].walk[name]=[a,b];
    if(b===null)fails.push(`${tag} 입구→${name} 못 감`);else if(a&&b>a*1.15+1)fails.push(`${tag} 입구→${name} ${a}m → ${b}m로 돌아감`);}
   // 시안 B(11-17 4차): 회전목마 타는 곳·링크 문 앞까지도 걷고, 길 폭도 본다 — 장애물을 0.6m씩 부풀려(= 몸 양옆 0.6m 여유, 두 사람이 엇갈려 지나갈 폭 약 1.6m) 입구→모든 자리가 막히지 않는지
   if(key==='b'){const more={carouselBoard:{x:CAROUSEL.board.x,z:CAROUSEL.board.z,r:CAROUSEL.board.near},rinkGate:{x:RINK.gate.stand.x,z:RINK.gate.stand.z,r:1.4}};
    for(const [name,t] of Object.entries(more)){const b=walkLen(cols,t,SPAWN);report[tag].walk[name]=[null,b];if(b===null)fails.push(`${tag} 입구→${name} 못 감`);}
    const fat=cols.map(c=>c.r!==undefined?{...c,r:c.r+.6}:{...c,w:c.w+1.2,d:c.d+1.2});report[tag].wide={};
    for(const [name,t] of [...Object.entries(TARGETS).filter(([k])=>!/sled|gondolaTop/.test(k)),...Object.entries(more)]){const b=walkLen(fat,{...t,r:Math.max(t.r,2.2)},SPAWN);report[tag].wide[name]=b;if(b===null)fails.push(`${tag} 입구→${name} 넓은 길(1.6m) 없음`);}}
   report[tag].extraColliders=extra.length;
   // 시안 B: 회전목마 자리 8개 자세가 그려진 각도와 함께 나옴 + 아이스링크·회전목마 앞 캡처(11-17 2차)
   if(key==='b'){const seats=await page.evaluate(()=>{const c=window.xmas.village.festive?.carousel;return c?.seatPose?[...Array(c.seats).keys()].map(k=>c.seatPose(k)):null;});
    report[tag].seats=seats?.length??0;if(!seats||seats.some(p=>![p.x,p.y,p.z,p.heading].every(Number.isFinite)))fails.push(`${tag} 회전목마 자리 자세 없음`);
    const face=(x,z,tx,tz)=>[x,z,Math.atan2(-(tx-x),-(tz-z))];
    for(const [name,[x,z,h]] of Object.entries({rink:face(RINK.gate.stand.x+4.2,RINK.gate.stand.z+3.4,RINK.x,RINK.z),carousel:face(CAROUSEL.board.x-2.6,CAROUSEL.board.z-1.2,CAROUSEL.x,CAROUSEL.z)})){
     await page.evaluate(([x,z,h])=>{window.xmas.teleport(x,z,h);window.xmas.cam.yaw=h;window.xmas.cam.pitch=.18;window.xmas.cam.dist=mobileDist();function mobileDist(){return innerWidth<900?6.5:5;}},[x,z,h]);
     await page.waitForTimeout(1800);await page.screenshot({path:`${out}/game-${tag}-${name}.png`});}}}
  console.log(tag,JSON.stringify(report[tag]));
  await page.close();
 }
}
report.fails=fails;writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
console.log(fails.length?`실패 ${fails.length}건\n`+fails.join('\n'):'모두 통과');
await browser.close();process.exit(fails.length?1:0);
