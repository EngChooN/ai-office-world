// 넓힌 광장 이동 돕기 디자인 시안 촬영·겹침 검사(월드아트 11-17 5차): node scripts/capture-christmas-travel-design.mjs
// 실제 게임 화면 /christmas/?look=festive-b 에 월드아트 디자인(artifacts/christmas-travel/travel-skin.css + 아이콘 x-run·x-map + 지도 그림)을
// 이 브라우저에서만 입혀 찍는다(게임 코드는 그대로). 개발 서버 먼저(BASE_URL 기본 http://127.0.0.1:5181).
// 결과 artifacts/christmas-travel/*.png, overlap.json — 보이는 단추끼리 겹침 0, 달리기 단추가 조이스틱이 생기는 왼쪽 절반 밖, 지도 핀 원끼리 겹침 0
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base=process.env.BASE_URL??'http://127.0.0.1:5181',out='artifacts/christmas-travel';mkdirSync(out,{recursive:true});
const skin=readFileSync(`${out}/travel-skin.css`,'utf8');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const report={},fails=[];
async function open(w,h){const mobile=Math.min(w,h)<600;
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource|WebSocket|ERR_CONNECTION/.test(m.text()))errs.push(m.text());});
 await page.goto(`${base}/christmas/?capture=1&serverpick=off${mobile?'&mobile=1':''}&look=festive-b`);
 await page.waitForFunction(()=>window.xmas?.village&&window.xmas.fps>0&&document.querySelector('.xt-run'),null,{timeout:120000});
 await page.addStyleTag({content:skin});
 // 아이콘 바꿔 끼우기(월드개발이 icon('x-run')·icon('x-map')으로 바꾸면 같은 모양)
 await page.evaluate(()=>{const u=n=>`<svg class="ic ic-m" aria-hidden="true"><use href="/icons/sprite.svg#ic-${n}"></use></svg>`;
  document.querySelector('.xt-run i').innerHTML=u('x-run');document.querySelector('.xt-map-btn').innerHTML=u('x-map');
  document.querySelector('.xt-map header b').firstElementChild?.outerHTML&&(document.querySelector('.xt-map header b').innerHTML=u('x-map').replace('ic-m','ic-s')+' 바로 가기');
  // 내 자리 고리(내 화살과 같은 자리, 돌지 않음)
  const me=document.querySelector('.xt-me'),ring=document.createElement('i');ring.className='xt-me-ring';me.before(ring);
  const sync=()=>{ring.style.left=me.style.left;ring.style.top=me.style.top;requestAnimationFrame(sync);};sync();});
 return {page,errs,mobile};}
// 보이는 누를 것(단추·핀)의 사각형
const rects=(page,sel)=>page.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');})
 .map(e=>{const r=e.getBoundingClientRect();return {n:(e.className?.baseVal??e.className)+(e.dataset.go?`[${e.dataset.go}]`:'')+(e.textContent.trim()?` "${e.textContent.trim().slice(0,10)}"`:''),x:r.x,y:r.y,w:r.width,h:r.height};}),sel);
const hits=list=>{const o=[];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];const ix=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),iy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(ix>.5&&iy>.5)o.push(`${a.n} ↔ ${b.n}`);}return o;};
const HUD='.xh button:not([hidden]),.xh-tree,.xh-toast,.xt button.xt-run,.hc-btn,.xh-acts>*';
for(const [w,h,tag] of [[1920,1080,'pc'],[390,844,'phone'],[844,390,'phone-land']]){
 const {page,errs,mobile}=await open(w,h);const R=report[tag]={};
 // ① 기본: 입구 → 트리 앞(행동 단추가 뜨는 자리)으로 옮겨 행동 단추 줄까지 보이게
 const T=await page.evaluate(()=>{const t=window.xmas.village.layout.TARGETS.tree;return t;});
 await page.evaluate(([x,z])=>window.xmas.teleport(x,z,0),[T.x,T.z+T.r-1.5]);await page.waitForTimeout(1500);
 // 채팅 단추는 함께 하기 때만 보이므로 자리 확인용으로 잠깐 보이게
 await page.evaluate(()=>{const c=document.querySelector('.hc-btn');if(c){c.hidden=false;c.classList.add('xc-chat');}});
 if(mobile)await page.evaluate(()=>{// 조이스틱이 생기는 곳 표시(왼쪽 절반, 엄지가 처음 닿는 아래쪽 = 반지름 56 + 여유 12)
  const z=document.createElement('div');z.id='joy-zone';z.style.cssText='position:fixed;left:0;top:0;width:50vw;height:100vh;background:repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 10px,transparent 10px 20px);border-right:2px dashed rgba(255,255,255,.45);pointer-events:none;z-index:19';
  const k=document.createElement('div');k.id='joy-ring';k.style.cssText=`position:fixed;left:${Math.max(68,innerWidth*.22)-56}px;top:${innerHeight-Math.max(150,innerHeight*.2)-56}px;width:112px;height:112px;border-radius:50%;border:3px solid rgba(255,255,255,.75);background:rgba(255,255,255,.12);pointer-events:none;z-index:19`;
  document.body.append(z,k);});
 await page.waitForTimeout(400);
 const list=await rects(page,HUD);R.buttons=list.map(b=>b.n);R.overlap=hits(list);
 const run=list.find(b=>/xt-run/.test(b.n));R.run=run&&{x:Math.round(run.x),y:Math.round(run.y),w:run.w,h:run.h};
 if(R.overlap.length)fails.push(`${tag} 단추 겹침: ${R.overlap.join(', ')}`);
 if(mobile&&run&&run.x<w/2)fails.push(`${tag} 달리기 단추가 조이스틱 자리(왼쪽 절반)에 있음`);
 await page.screenshot({path:`${out}/${tag}-run-off.png`});
 await page.evaluate(()=>document.querySelector('.xt-run').click());await page.waitForTimeout(500);
 R.runOn=await page.evaluate(()=>window.xmas.status().travel?.run);
 await page.screenshot({path:`${out}/${tag}-run-on.png`});
 await page.evaluate(()=>document.querySelector('.xt-run').click());
 // ② 지도: 다른 사람 점은 가짜로 몇 개(광장·링크·회전목마 둘레)
 await page.evaluate(()=>{document.getElementById('joy-zone')?.remove();document.getElementById('joy-ring')?.remove();});
 await page.evaluate(()=>document.querySelector('.xt-map-btn').click());await page.waitForTimeout(600);
 await page.evaluate(()=>{const b=document.querySelector('.xt-dots');const pts=[[30,50],[33,47],[36,55],[60,52],[64,46],[52,60],[28,75],[31,77],[70,74],[45,40],[50,72],[57,79]];
  for(const [u,v] of pts){const i=document.createElement('i');i.style.left=u+'%';i.style.top=v+'%';b.appendChild(i);}});
 const pins=await rects(page,'.xt-pin i');R.pinOverlap=hits(pins);if(R.pinOverlap.length)fails.push(`${tag} 지도 핀 겹침: ${R.pinOverlap.join(', ')}`);
 const labels=await rects(page,'.xt-pin span');R.labelOverlap=hits(labels);if(R.labelOverlap.length)fails.push(`${tag} 지도 이름 겹침: ${R.labelOverlap.join(', ')}`);
 const board=await rects(page,'.xt-board');R.board=board[0]&&{w:Math.round(board[0].w),h:Math.round(board[0].h)};
 await page.screenshot({path:`${out}/${tag}-map.png`});
 R.errors=errs;if(errs.length)fails.push(`${tag} 오류 ${errs.length}건: ${errs[0]}`);
 console.log(tag,JSON.stringify(R));await page.close();}
writeFileSync(`${out}/overlap.json`,JSON.stringify(report,null,1));
await browser.close();
if(fails.length){console.log('실패\n'+fails.join('\n'));process.exitCode=1;}else console.log('모두 통과');
