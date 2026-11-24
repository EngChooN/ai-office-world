// 겨울 릴스 편집(월드마케팅, 2026-11-22): record-reels-winter.mjs가 찍은 장면(raw)을 콘티 순서·길이로 잘라 잇고 자막·AI Office 카드·엔딩 카드를 얹는다.
// scripts/reels-edit.mjs(관악산 릴스, 11-11~14 대표 확인 규칙)와 같은 자막 규칙: Apple SD Gothic Neo ExtraBold·외곽선 8px·안전 영역 x 120~960(정가운데)·y 250~1500,
// 0.2초 교차 페이드(훅→다음은 컷), 게임 소리만(배경음악 없음), 끝 1.2초 소리 줄임, 전체 -16 LUFS.
//   node scripts/promo/edit-reels-winter.mjs namsan|christmas|date|friends|bus
// 11-22 저녁 남산 2차(대표 피드백: 둘이·여럿·말풍선·버스 창밖): 장면을 길게(평균 5초), 말풍선이 글이라 자막은 적게. hook에 bottom = 훅 자막을 아래(y 1480 기준)에 둠(위는 말풍선 자리).
// 결과: artifacts/reels-winter-2026-11-22/<릴스>/<릴스>-reels.mp4, cover.png, ending.png, edit/(자막 PNG), reels-timeline.json
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const reel=process.argv[2];if(!['namsan','christmas','date','friends','bus'].includes(reel))throw new Error('첫 인자는 namsan·christmas·date·friends·bus');   // date·friends·bus = 남산 2차(record-reels-namsan2.mjs, 11-22 저녁)
const base=`artifacts/reels-winter-2026-11-22/${reel}`,raw=`${base}/raw`,out=base,work=`${out}/edit`;
const FFMPEG=['/opt/homebrew/bin/ffmpeg','/usr/local/bin/ffmpeg'].find(existsSync)??'ffmpeg',FFPROBE=FFMPEG.replace(/ffmpeg$/,'ffprobe');
const W=1080,H=1920,FPS=30,XF=.2;
const OFFICE_IMG='artifacts/reels/office/ai-office.png',ENDING_HTML=`${out}/ending.html`,ENDING=`${out}/ending.png`;

// 장면표. raw = 녹화 장면, from = 그 장면 json의 조작 시각(events) 이름, shift = 그 시각에서 더할 초. big·small = 자막. x = 다음 장면 교차 페이드(0 = 컷).
export const TIMELINES={
 namsan:[
  {id:'hook',raw:'hook',dur:3,from:'in',big:'퇴근하고\n남산 야경 보러 감',hook:true,x:0},
  {id:'pick',raw:'pick',dur:2.2,from:'click',shift:-1.6,audio:{raw:'start',at:0},big:'산 고르기에 남산 추가',small:'265m · 1.1km · 17분',top:true,band:true},
  {id:'start',raw:'start',dur:3,from:'in',shift:.3,big:'백범광장에서 출발',small:'🔊 발소리 · 성곽길'},
  {id:'stairs',raw:'stairs',dur:2.8,from:'look-back',shift:-1.3,big:'성곽 계단 오르기'},
  {id:'bus',raw:'bus',dur:4,from:'ride',shift:-1.6,big:'힘들면 순환버스',small:'정상까지 한 번에'},
  {id:'spring',raw:'spring',dur:2.5,from:'f',shift:-.3,big:'약수 한 모금'},
  {id:'stone',raw:'stone',dur:3,from:'f',shift:-.2,big:'정상석에서 정상 인증',small:'스탬프 쾅'},
  {id:'locks',raw:'locks',dur:4,from:'color',shift:-.6,big:'사랑의 자물쇠 걸기',small:'색·모양 골라서',top:true},
  {id:'bino',raw:'bino',dur:2.6,from:'b',shift:.4,big:'쌍안경엔 관악산도',small:'거기도 오를 수 있어요'},
  {id:'bench',raw:'bench',dur:3,from:'sit',shift:0,big:'벤치에서 서울 야경',small:'오늘 하루 끝'},
  {id:'office',raw:'dusk',dur:2,from:'in',shift:.1,big:'이 게임, AI 직원들이\nAI Office에서 만들었어요',small:'기획·디자인·개발 전부',office:true,x:.3},
  {id:'ending',raw:'dusk',dur:3,from:'in',shift:2.4,image:ENDING,x:0},
 ],
 christmas:[
  {id:'hook',raw:'hook',dur:3.5,from:'in',big:'크리스마스에\n약속 없으면 여기로',hook:true,x:0},
  {id:'tree',raw:'tree',dur:4,from:'deco',shift:-.3,big:'다 같이 트리 꾸미기',small:'장식 40개면 꼭대기 별 ⭐',top:true},
  {id:'fight',raw:'fight',dur:4.5,from:'friend-throw',shift:-.4,big:'눈싸움 맞으면 눈투성이',small:'❄️ 되던지기'},
  {id:'sled',raw:'sled',dur:5,from:'ride',shift:-1.2,big:'눈썰매 경주',small:'4명까지 같이 출발'},
  {id:'carousel',raw:'carousel',dur:2.5,from:'ride',shift:-.2,big:'회전목마도'},
  {id:'rink',raw:'rink',dur:2.5,from:'skate',shift:-.3,big:'스케이트장도'},
  {id:'fire',raw:'fire',dur:4,from:'sit',shift:-.3,big:'모닥불에 앉아 수다',small:'🎵 캐럴 들으면서'},
  {id:'office',raw:'night',dur:2,from:'in',shift:.1,big:'이 게임, AI 직원들이\nAI Office에서 만들었어요',small:'기획·디자인·개발 전부',office:true,x:.3},
  {id:'ending',raw:'night',dur:3,from:'in',shift:2.4,image:ENDING,x:0},
 ],
 // ── 남산 2차(11-22 저녁) ──
 date:[   // 둘이 「오늘 나랑 남산 갈래?」 약 54초
  {id:'hook',raw:'hook',dur:4.6,from:'ask',shift:-.5,big:'오늘 나랑\n남산 갈래?',hook:true,bottom:true,x:0},
  {id:'reply',raw:'hook',dur:3.2,from:'reply',shift:-.3,big:'퇴근하고 바로 출발',small:'설치 없이 브라우저에서'},
  {id:'stairs',raw:'stairs',dur:6,from:'tired',shift:-.6,big:'같이 오르면 덜 힘듦',small:'💬 걸으면서 수다'},
  {id:'buswait',raw:'bus',dur:3.5,from:'ride',shift:-3,big:'힘들면 순환버스',small:'둘이 같이 타기'},
  {id:'window',raw:'bus',dur:8,from:'friend',shift:-.2,big:'창밖 보면서 정상까지',small:'🚌 옆자리엔 콩이'},
  {id:'locks',raw:'locks',dur:9,from:'friend-hang',shift:-.8,big:'사랑의 자물쇠 둘이 걸기',small:'한마디도 적어서',top:true},
  {id:'deck',raw:'deck',dur:4,from:'in',shift:.3,big:'타워 전망대도 둘이'},
  {id:'bench',raw:'bench',dur:3,from:'sit',shift:-.4,big:'정상 벤치에서'},
  {id:'night',raw:'bench',dur:7.5,from:'pretty',shift:-.3},
  {id:'office',raw:'bench',dur:2,from:'quiet',shift:.1,big:'이 게임, AI 직원들이\nAI Office에서 만들었어요',small:'기획·디자인·개발 전부',office:true,x:.3},
  {id:'ending',raw:'bench',dur:3,from:'quiet',shift:2.4,image:ENDING,x:0},
 ],
 friends:[   // 여럿 「퇴근하고 남산 모임」 약 50초
  {id:'hook',raw:'hook',dur:6.5,from:'wave',shift:-.7,big:'퇴근하고\n남산 모임',hook:true,bottom:true,x:0},
  {id:'stairs',raw:'stairs',dur:7,from:'fast',shift:-.6,big:'다 같이 계단 오르기'},
  {id:'buswait',raw:'bus',dur:4,from:'ride',shift:-3,big:'순환버스 넷이 타기'},
  {id:'window',raw:'bus',dur:7.5,from:'look',shift:-.2,big:'창밖 보며 정상까지'},
  {id:'stone',raw:'stone',dur:7,from:'f',shift:-.5,big:'정상석 앞 단체 인증',small:'스탬프 쾅',top:true},
  {id:'bench',raw:'bench',dur:3,from:'sit',shift:-.4,big:'야경 벤치에서'},
  {id:'night',raw:'bench',dur:9.5,from:'chat',shift:-.3},
  {id:'office',raw:'bench',dur:2,from:'quiet',shift:.1,big:'이 게임, AI 직원들이\nAI Office에서 만들었어요',small:'기획·디자인·개발 전부',office:true,x:.3},
  {id:'ending',raw:'bench',dur:3,from:'quiet',shift:2.4,image:ENDING,x:0},
 ],
 bus:[   // 순환버스 창밖 약 28초
  {id:'hook',raw:'ride',dur:4.5,from:'ride',shift:-3.5,big:'순환버스 타고\n남산 정상까지',hook:true,bottom:true,x:0},
  {id:'left',raw:'ride',dur:6,from:'left',shift:-.2,big:'창밖은 단풍 숲'},
  {id:'right',raw:'ride',dur:6,from:'right',shift:-.3,big:'반대쪽 창은 노을'},
  {id:'arrive',raw:'arrive',dur:5.5,from:'off',shift:-.3,big:'정상 정류장 도착',small:'전망탑까지 걸어서 2분'},
  {id:'office',raw:'arrive',dur:2,from:'walk',shift:.5,big:'이 게임, AI 직원들이\nAI Office에서 만들었어요',small:'기획·디자인·개발 전부',office:true,x:.3},
  {id:'ending',raw:'arrive',dur:3,from:'walk',shift:2.9,image:ENDING,x:0},
 ],
};
const TIMELINE=TIMELINES[reel];

function ff(args,label){const r=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-y',...args],{stdio:['ignore','inherit','inherit']});if(r.status)throw new Error(`ffmpeg 실패(${label})`);}
const probe=f=>+spawnSync(FFPROBE,['-v','error','-show_entries','format=duration','-of','csv=p=0',f]).stdout.toString().trim();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const textHTML=s=>esc(s).replace(/((?![▶◀])\p{Extended_Pictographic}️?)/gu,'<span class="emo">$1</span>').replace(/\n/g,'<br>');

const RING=[8,5.5,3].flatMap(r=>Array.from({length:r>5?32:16},(_,i)=>{const a=i/(r>5?32:16)*2*Math.PI;return `${(r*Math.cos(a)).toFixed(2)}px ${(r*Math.sin(a)).toFixed(2)}px 0 #2b1d0a`;})).join(',');
const CSS=`:root{--ring:${RING}}*{margin:0;padding:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden}
body{font-family:'Apple SD Gothic Neo','Pretendard',sans-serif;color:#fff8e6;-webkit-font-smoothing:antialiased}
.cap{position:absolute;left:120px;width:840px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px}
.cap .b,.cap .s{text-shadow:var(--ring);filter:drop-shadow(0 4px 8px rgba(0,0,0,.4));white-space:nowrap}
.cap .b{font-weight:800;font-size:76px;line-height:1.2;letter-spacing:-1px}.cap .s{font-weight:500;font-size:44px;line-height:1.25}
.cap.hook .b{font-size:96px}
.cap.band{left:150px;width:780px;padding:26px 20px;border-radius:30px;background:rgba(43,29,10,.72)}
.emo{font-family:'Apple Color Emoji';text-shadow:none}
.office{position:absolute;left:50%;transform:translateX(-50%);top:280px;border-radius:28px;overflow:hidden;background:#fbf3df;box-shadow:0 18px 50px rgba(0,0,0,.55);border:6px solid #fbf3df}
.office img{display:block;height:880px;width:auto;max-width:808px;object-fit:cover;object-position:top}`;
async function renderPNGs(page,items){
 for(const it of items){
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${it.html}</body></html>`);
  await page.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]));
  await page.evaluate(()=>{for(const el of document.querySelectorAll('.cap .b,.cap .s')){let fs=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>840&&fs>30){fs-=2;el.style.fontSize=fs+'px';}}});
  if(it.anchorBottom)await page.evaluate(y=>{const c=document.querySelector('.cap');c.style.top=(y-c.offsetHeight)+'px';},it.anchorBottom);
  it.box=await page.evaluate(()=>{const c=document.querySelector('.cap');if(!c)return null;const r=c.getBoundingClientRect(),inner=[...c.children].map(e=>e.getBoundingClientRect());return {x:Math.min(...inner.map(r=>r.x)),y:r.y,w:Math.max(...inner.map(r=>r.right))-Math.min(...inner.map(r=>r.x)),h:r.height};});
  await page.screenshot({path:it.file,omitBackground:true});
 }
}
// top: 화면 위쪽(y 290~)에 두는 자막(카드·판이 아래를 덮는 장면). band: 글 뒤 어두운 띠(화면 UI 글자와 겹치는 장면만).
const capHTML=(sc)=>`<div class="cap${sc.hook?' hook':''}${sc.band?' band':''}"${sc.hook&&!sc.bottom?' style="top:300px"':sc.top?' style="top:290px"':''}><div class="b">${textHTML(sc.big)}</div>${sc.small?`<div class="s">${textHTML(sc.small)}</div>`:''}</div>`;
const officeHTML=()=>`<div class="office"><img src="data:image/png;base64,${readFileSync(OFFICE_IMG).toString('base64')}"></div>`;

function cutScene(sc,i,next){
 const len=sc.dur+(next?(next.x??XF)||1/FPS:0),meta=JSON.parse(readFileSync(`${raw}/${sc.raw}.json`,'utf8'));
 const at=meta.events[sc.from];if(at===undefined)throw new Error(`${sc.raw}.json에 ${sc.from} 시각 없음`);
 const start=Math.max(0,at+(sc.shift??0));if(start+len>meta.seconds+.05)throw new Error(`${sc.id}: 녹화가 짧음(${meta.seconds}s < ${(start+len).toFixed(2)}s)`);
 const v=`${work}/${String(i).padStart(2,'0')}-${sc.id}.mp4`,a=`${work}/${String(i).padStart(2,'0')}-${sc.id}.wav`;
 const vf=`trim=start=${start.toFixed(3)}:duration=${len.toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS},scale=${W}:${H},format=yuv420p`;
 if(sc.image)ff(['-loop','1','-framerate',String(FPS),'-t',len.toFixed(3),'-i',sc.image,'-vf',`scale=${W}:${H},format=yuv420p`,'-c:v','libx264','-crf','12','-preset','fast',v],sc.id);
 else if(sc.office)ff(['-i',`${raw}/${sc.raw}.mp4`,'-vf',vf+',eq=brightness=-.08:saturation=.85','-c:v','libx264','-crf','12','-preset','fast',v],sc.id);
 else ff(['-i',`${raw}/${sc.raw}.mp4`,'-vf',vf,'-c:v','libx264','-crf','12','-preset','fast',v],sc.id);
 const aSrc=sc.audio?`${raw}/${sc.audio.raw}.wav`:`${raw}/${sc.raw}.wav`,aStart=sc.audio?sc.audio.at:start;
 ff(['-i',aSrc,'-af',`atrim=start=${aStart.toFixed(3)}:duration=${len.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000`,'-ac','2',a],sc.id+' 소리');
 return {...sc,v,a,len,rawStart:+start.toFixed(3),errors:meta.errors?.length??0,captureFps:meta.captureFps};
}

rmSync(work,{recursive:true,force:true});mkdirSync(work,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
// 0) 엔딩 카드 PNG(HTML → 1080×1920)
await page.goto(`file://${resolve(ENDING_HTML)}`);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:ENDING});
// 1) 자막·카드 PNG
const pngs=[];
TIMELINE.forEach((sc,i)=>{if(sc.big)pngs.push({sc,file:`${work}/cap-${String(i).padStart(2,'0')}-${sc.id}.png`,html:capHTML(sc),anchorBottom:(sc.hook&&!sc.bottom)||sc.top?null:1480});if(sc.office)pngs.push({sc,file:`${work}/office-card.png`,html:officeHTML(),card:true});});
await renderPNGs(page,pngs);await browser.close();
for(const p of pngs.filter(p=>p.box)){const b=p.box;if(b.x<119.5||b.x+b.w>960.5||b.y<249.5||b.y+b.h>1500.5)throw new Error(`자막이 안전 영역 밖: ${p.sc.id} ${JSON.stringify(b)}`);}

// 2) 장면 자르기
const clips=TIMELINE.map((sc,i)=>cutScene(sc,i,TIMELINE[i+1]));
let t=0;for(const c of clips){c.start=+t.toFixed(3);t+=c.dur;}const total=t;

// 3) 잇기
const inputs=[];clips.forEach(c=>inputs.push('-i',c.v));clips.forEach(c=>inputs.push('-i',c.a));
const n=clips.length,fc=[];let vPrev='[0:v]',aPrev=`[${n}:a]`;
for(let i=1;i<n;i++){const x=(clips[i-1].len-clips[i-1].dur)||1/FPS;
 fc.push(`${vPrev}[${i}:v]xfade=transition=fade:duration=${x.toFixed(4)}:offset=${clips[i].start.toFixed(4)}[v${i}]`);vPrev=`[v${i}]`;
 fc.push(`${aPrev}[${n+i}:a]acrossfade=d=${x.toFixed(4)}:c1=tri:c2=tri[a${i}]`);aPrev=`[a${i}]`;}
// 4) 자막·카드 얹기
let cur=vPrev,k=0;const capInputs=[];
for(const p of pngs){const c=clips.find(c=>c.id===p.sc.id),idx=2*n+capInputs.length/6;
 const s=p.sc.hook?.1:c.start+(p.card?.05:.2),e=c.start+c.dur-(p.card?.0:.2),d=+(e-s).toFixed(3);
 capInputs.push('-loop','1','-t',d.toFixed(3),'-i',p.file);
 const y=p.sc.hook?`'-150*pow(max(0,1-t/0.35),3)'`:'0';
 fc.push(`[${idx}:v]format=rgba,fade=t=in:st=0:d=${p.sc.hook?'0.12':'0.15'}:alpha=1,fade=t=out:st=${(d-.15).toFixed(3)}:d=0.15:alpha=1,setpts=PTS+${s.toFixed(3)}/TB[c${k}]`);
 fc.push(`${cur}[c${k}]overlay=x=0:y=${y}:eof_action=pass:format=auto[o${k}]`);cur=`[o${k}]`;k++;}
fc.push(`${cur}format=yuv420p[vout]`);
fc.push(`${aPrev}loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${(total-1.2).toFixed(2)}:d=1.2,aresample=48000[aout]`);
const mp4=`${out}/${reel}-reels.mp4`;
ff([...inputs,...capInputs,'-filter_complex',fc.join(';'),'-map','[vout]','-map','[aout]','-t',total.toFixed(3),'-r',String(FPS),
 '-c:v','libx264','-profile:v','high','-level','4.1','-preset','slow','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',mp4],'최종');
ff(['-ss','1.4','-i',mp4,'-frames:v','1',`${out}/cover.png`],'표지');
const dur=probe(mp4);
const timeline={file:mp4,seconds:+dur.toFixed(2),size:`${W}x${H}`,fps:FPS,
 scenes:clips.map(c=>({id:c.id,from:c.start,to:+(c.start+c.dur).toFixed(2),raw:c.raw,rawStart:c.rawStart,big:c.big??null,small:c.small??null,captureFps:c.captureFps,consoleErrors:c.errors}))};
writeFileSync(`${out}/reels-timeline.json`,JSON.stringify(timeline,null,1));
console.log(`✔ ${mp4} ${dur.toFixed(2)}초 · 장면 ${clips.length}개 · 표지 ${out}/cover.png`);
