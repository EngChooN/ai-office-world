// 릴스 미리보기 HTML(월드마케팅, 2026-11-22): AI Office 결과물 창은 <video>를 못 틀어서, 영상을 1초 8장 JPEG + mp3로 나눠 HTML 하나에 넣는다(5MB 이하).
//   node scripts/promo/make-preview-winter.mjs <mp4> <out.html> "<제목>"
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const [mp4,outHtml,title='릴스 미리보기']=process.argv.slice(2);
const FFMPEG='/opt/homebrew/bin/ffmpeg',FFPROBE='/opt/homebrew/bin/ffprobe';
const dir=mkdtempSync(join(tmpdir(),'reels-prev-'));
const run=(a)=>{const r=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-y',...a],{stdio:'inherit'});if(r.status)throw new Error('ffmpeg 실패');};
const dur=+spawnSync(FFPROBE,['-v','error','-show_entries','format=duration','-of','csv=p=0',mp4]).stdout.toString().trim();
const FPS=8;
run(['-i',mp4,'-vf',`fps=${FPS},scale=288:512`,'-q:v','14',`${dir}/f%04d.jpg`]);
run(['-i',mp4,'-vn','-ac','1','-ar','32000','-b:a','48k',`${dir}/a.mp3`]);
const frames=readdirSync(dir).filter(f=>f.endsWith('.jpg')).sort().map(f=>readFileSync(`${dir}/${f}`).toString('base64'));
const audio=readFileSync(`${dir}/a.mp3`).toString('base64');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{margin:0;background:#111;color:#eee;font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;padding:16px;gap:10px}
#v{width:min(100%,400px);aspect-ratio:9/16;background:#000;border-radius:12px;display:block;object-fit:cover}
button{font-size:16px;padding:10px 22px;border-radius:999px;border:0;background:#f2c14e;color:#222;font-weight:700;cursor:pointer}
#bar{width:min(100%,400px);height:6px;background:#333;border-radius:3px;cursor:pointer}#fill{height:100%;width:0;background:#f2c14e;border-radius:3px}
p{margin:0;font-size:13px;color:#aaa;text-align:center;max-width:400px;line-height:1.5}</style></head>
<body><h3 style="margin:0">${title} (${dur.toFixed(1)}초)</h3>
<img id="v" alt="릴스 화면">
<div id="bar"><div id="fill"></div></div>
<div><button id="b">▶ 재생 (소리 켜짐)</button> <span id="t" style="font-size:13px;color:#aaa">0.0 / ${dur.toFixed(1)}초</span></div>
<p>앱 미리보기 창은 동영상 재생을 막아 두어서, 영상을 1초에 ${FPS}장씩 그림으로 나눠 소리에 맞춰 틀어요. 원본보다 끊겨 보이고 흐릿해요.<br>인스타에 올릴 원본: ${mp4} (1080×1920)</p>
<script>
const F=${JSON.stringify(frames)},FPS=${FPS},DUR=${dur.toFixed(3)};
const v=document.getElementById('v'),fill=document.getElementById('fill'),tt=document.getElementById('t'),btn=document.getElementById('b');
const show=i=>{v.src='data:image/jpeg;base64,'+F[Math.min(F.length-1,Math.max(0,i))];};show(0);
let ctx=null,buf=null,src=null,t0=0,off=0,raf=0,playing=false;
async function ready(){if(buf)return;ctx=new (window.AudioContext||window.webkitAudioContext)();const b=Uint8Array.from(atob('${audio}'),c=>c.charCodeAt(0));buf=await ctx.decodeAudioData(b.buffer);}
function tick(){if(!playing)return;const t=ctx.currentTime-t0+off;if(t>=DUR){stop();show(F.length-1);return;}show(Math.floor(t*FPS));fill.style.width=(t/DUR*100)+'%';tt.textContent=t.toFixed(1)+' / '+DUR.toFixed(1)+'초';raf=requestAnimationFrame(tick);}
function stop(){playing=false;btn.textContent='▶ 재생 (소리 켜짐)';try{src&&src.stop();}catch(e){}src=null;cancelAnimationFrame(raf);off=0;}
async function play(at=0){await ready();if(playing)stop();src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);off=at;t0=ctx.currentTime;src.start(0,at);playing=true;btn.textContent='■ 멈춤';tick();}
btn.onclick=()=>playing?stop():play(0);
document.getElementById('bar').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();play((e.clientX-r.left)/r.width*DUR);};
</script></body></html>`;
writeFileSync(outHtml,html);rmSync(dir,{recursive:true,force:true});
console.log(`✔ ${outHtml} ${(html.length/1048576).toFixed(2)}MB · 프레임 ${frames.length}장`);
