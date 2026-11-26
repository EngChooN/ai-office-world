// 인형뽑기 BGM 후보 들어 보기용 렌더러(2026-11-26).
// vite 개발 서버(5397)를 띄우고 headless 크롬에서 src/claw/claw-bgm.js의 renderBars로 분위기마다 약 20초를
// OfflineAudioContext(1ch, 44100Hz)에 렌더 → artifacts/claw-bgm/<mood>.wav, ffmpeg로 <mood>.mp3(128k, 앞뒤 0.3초 페이드).
// 크기: BGM_LEVEL이 곱해진 게임 크기 그대로(효과음 마스터 앞 기준). 비교용으로 「성공음」(삼각파 784Hz gain .2 0.22초 ×4)도 같은 방식으로 렌더.
// 결과 피크·RMS(dBFS)는 levels.json.
// 실행: export PATH=$HOME/.nvm/versions/node/v24.19.0/bin:$PATH; node artifacts/claw-bgm/render.mjs
//   LEVEL_MODE=auto(기본)|wrap — auto: renderBars가 {level} 옵션을 받으면 level:BGM_LEVEL로, 아니면 BGM_LEVEL 게인을 앞에 끼움
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {writeFileSync,existsSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const OUT=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(OUT,'../..');
const FFMPEG=existsSync('/opt/homebrew/bin/ffmpeg')?'/opt/homebrew/bin/ffmpeg':'ffmpeg';
const FFPROBE=existsSync('/opt/homebrew/bin/ffprobe')?'/opt/homebrew/bin/ffprobe':'ffprobe';
const TARGET_SEC=20,SR=44100,PORT=5397;
const LEVEL_MODE=process.env.LEVEL_MODE||'auto';

const server=await createServer({root:ROOT,configFile:resolve(ROOT,'vite.config.js'),logLevel:'error',server:{port:PORT,strictPort:true,host:'127.0.0.1'}});
await server.listen();
let browser,code=0;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();
 page.on('console',m=>{if(m.type()==='error')console.error('[page]',m.text());});
 await page.goto(`http://127.0.0.1:${PORT}/@vite/client`,{waitUntil:'domcontentloaded'});
 await page.setContent('<!doctype html><title>bgm render</title>'); // 빈 페이지(같은 출처 유지)
 const res=await page.evaluate(async({TARGET_SEC,SR,LEVEL_MODE})=>{
  let M;
  try{M=await import('/src/claw/claw-bgm.js');}catch(e){return {error:'모듈을 불러오지 못했어요: '+e.message};}
  const need=['BGM_MOODS','BGM_LEVEL','renderBars'];
  const miss=need.filter(k=>!(k in M));
  if(miss.length)return {error:`claw-bgm.js에 아직 새 API가 없어요(없음: ${miss.join(', ')}). 수정이 끝난 뒤 다시 실행하세요.`,exports:Object.keys(M)};
  // renderBars가 {level} 옵션을 받으면 level:BGM_LEVEL로 넘기고(게임 버스와 같은 크기), 못 받으면 BGM_LEVEL 게인을 앞에 끼운다
  const takesLevel=/\blevel\s*=/.test(String(M.renderBars).split('\n')[0]);
  const wrap=LEVEL_MODE==='wrap'||(LEVEL_MODE==='auto'&&!takesLevel);
  const stats=d=>{let pk=0,ss=0;for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;ss+=d[i]*d[i];}
   const rms=Math.sqrt(ss/d.length),db=x=>x>0?+(20*Math.log10(x)).toFixed(2):-Infinity;return {peak:+pk.toFixed(5),rms:+rms.toFixed(5),peakDb:db(pk),rmsDb:db(rms)};};
  // 소리가 실제로 나는 구간만으로 RMS(앞뒤 무음 제외)
  const activeStats=d=>{let a=0,b=d.length-1;while(a<d.length&&Math.abs(d[a])<1e-4)a++;while(b>a&&Math.abs(d[b])<1e-4)b--;return stats(d.subarray(a,b+1));};
  const wav=buf=>{const d=buf.getChannelData(0),n=d.length,ab=new ArrayBuffer(44+n*2),v=new DataView(ab),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
   w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
   v.setUint32(24,buf.sampleRate,true);v.setUint32(28,buf.sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
   for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,d[i]));v.setInt16(44+i*2,s<0?s*0x8000:s*0x7fff,true);}
   const u=new Uint8Array(ab);let bin='';for(let i=0;i<u.length;i+=0x8000)bin+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(bin);};
  const out={takesLevel,wrapped:wrap,BGM_LEVEL:M.BGM_LEVEL,moods:{}};
  for(const [name,p] of Object.entries(M.BGM_MOODS)){
   const beats=p.beats||4,barSec=beats*60/p.bpm;
   let bars=Math.max(1,Math.round(TARGET_SEC/barSec));
   const loop=typeof M.loopSeconds==='function'?M.loopSeconds(name):null;
   const len=bars*barSec+1.2; // 마지막 음 여운
   const ctx=new OfflineAudioContext(1,Math.ceil(len*SR),SR);
   let dest=ctx.destination;
   if(wrap){const g=ctx.createGain();g.gain.value=M.BGM_LEVEL;g.connect(ctx.destination);dest=g;}
   try{await M.renderBars(ctx,dest,name,wrap?{bars,t0:0,startBar:0}:{bars,t0:0,startBar:0,level:M.BGM_LEVEL});}catch(e){return {error:`renderBars(${name}) 실패: ${e.message}`};}
   const buf=await ctx.startRendering();
   out.moods[name]={label:p.label??name,bpm:p.bpm,bars,barSec:+barSec.toFixed(4),loopSeconds:loop,seconds:+(buf.length/SR).toFixed(3),...stats(buf.getChannelData(0)),active:activeStats(buf.getChannelData(0)),wav:wav(buf)};
  }
  // 비교: 성공음 = 삼각파 784Hz gain .2 0.22초 ×4 연속(claw-audio.js tone과 같은 꼴: attack .005, exp→.0008)
  {const ctx=new OfflineAudioContext(1,Math.ceil(1.2*SR),SR);
   for(let i=0;i<4;i++){const t=.02+i*.22,o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=784;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2,t+.005);g.gain.exponentialRampToValueAtTime(.0008,t+.22);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+.24);}
   const buf=await ctx.startRendering();out.success={desc:'triangle 784Hz gain .2 dur .22s x4 back-to-back',seconds:+(buf.length/SR).toFixed(3),...stats(buf.getChannelData(0)),active:activeStats(buf.getChannelData(0))};}
  return out;
 },{TARGET_SEC,SR,LEVEL_MODE});
 if(res.error){console.error('\n[render] '+res.error);if(res.exports)console.error('지금 export: '+res.exports.join(', '));code=2;}
 else{
  const levels={generated:new Date().toISOString(),sampleRate:SR,channels:1,note:'BGM은 BGM_LEVEL 곱한 게임 크기(효과음 마스터 SFX_MASTER×볼륨 앞). active = 앞뒤 무음 뺀 구간',
   BGM_LEVEL:res.BGM_LEVEL,levelApplied:res.wrapped?'script wrapped GainNode(BGM_LEVEL)':'renderBars({level:BGM_LEVEL})',moods:{},success:res.success};
  for(const [name,m] of Object.entries(res.moods)){
   const {wav,...info}=m;const w=resolve(OUT,`${name}.wav`),mp3=resolve(OUT,`${name}.mp3`);
   writeFileSync(w,Buffer.from(wav,'base64'));
   const d=m.seconds;
   execFileSync(FFMPEG,['-y','-loglevel','error','-i',w,'-af',`afade=t=in:st=0:d=0.3,afade=t=out:st=${(d-0.3).toFixed(3)}:d=0.3`,'-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','128k',mp3]);
   let dur=null;try{dur=+execFileSync(FFPROBE,['-v','error','-show_entries','format=duration','-of','csv=p=0',mp3]).toString().trim();}catch{}
   info.mp3={file:`${name}.mp3`,bytes:statSync(mp3).size,seconds:dur};
   levels.moods[name]=info;
  }
  writeFileSync(resolve(OUT,'levels.json'),JSON.stringify(levels,null,1));
  const f=x=>String(x).padStart(8);
  console.log(`level: ${levels.levelApplied} (BGM_LEVEL=${res.BGM_LEVEL})`);
  console.log('name      label            bpm bars   sec   peakDb   rmsDb  activeRms   mp3 KB');
  for(const [n,m] of Object.entries(levels.moods))console.log(`${n.padEnd(9)} ${String(m.label).padEnd(14)} ${String(m.bpm).padStart(4)} ${String(m.bars).padStart(4)} ${String(m.seconds).padStart(6)} ${f(m.peakDb)} ${f(m.rmsDb)} ${f(m.active.rmsDb)}   ${(m.mp3.bytes/1024).toFixed(0)}`);
  const s=res.success;console.log(`success   (784Hz x4)                 ${String(s.seconds).padStart(6)} ${f(s.peakDb)} ${f(s.rmsDb)} ${f(s.active.rmsDb)}`);
  console.log('저장: '+OUT);
 }
}catch(e){console.error('[render] 실패:',e);code=1;}
finally{await browser?.close();await server.close();}
process.exit(code);
