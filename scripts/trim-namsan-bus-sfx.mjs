// 남산 순환버스 소리 다듬기(2026-11-21, 월드디자인). 받은 CC0 원본(design/sounds/namsan/raw/)을 자르고 모아 public/sounds/namsan/ 에 둔다.
// 실행: node scripts/trim-namsan-bus-sfx.mjs  (ffmpeg: /opt/homebrew/bin/ffmpeg)  → namsan-sfx-stats.json 도 같이 쓴다.
// 설계: docs/남산/남산-환경음-구간별-설계-v1.md §5·§6. 방식은 흡연장 scripts/trim-lounge-sfx.mjs와 같다.
// 원본 받기(BigSoundBank 각 소리 쪽의 WAV 단추, 이용 조건 CC0 — 2026-11-21 확인):
//   s1145 Truck engine → raw/1145.wav · s0909 Bus stop in Japan → raw/0909.wav · s0644 London bus → raw/0644.wav
// ⚠ 아래 ss·t(자를 구간)는 귀로 고르기 전 자리값(추정)이다. 받은 뒤 들어 보고 고쳐서 다시 돌린다.
//   0909는 일본어 안내 방송이 섞여 있으니 방송이 없는 곳을, 0644는 말소리가 없는 곳을 고른다.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,statSync,rmSync} from 'node:fs';

const FF='/opt/homebrew/bin/ffmpeg';
const RAW='design/sounds/namsan/raw/';
const OUT='public/sounds/namsan/';
const TMP='/tmp/namsan-sfx-work/';
const SR=44100;
mkdirSync(OUT,{recursive:true});mkdirSync(TMP,{recursive:true});

// ss: 원본에서 시작(초), t: 길이(초), af: ffmpeg 필터. loop: 이음매 크로스페이드 길이(초, 반복 소리)
// 반복 소리는 mp3 앞뒤 여백 때문에 이음매가 생겨서 flac, 한 번 소리는 mp3
const ITEMS=[
 {name:'bus-engine-loop',out:'flac',loop:.6,
  // 일정하게 도는 디젤 엔진 8초. 바람 소리 덜려고 60Hz 아래를 깎음. 지나가는 느낌은 게임에서 거리·좌우·도플러로
  src:[{file:'1145.wav',ss:12,t:8.6,af:'highpass=f=60'}]},
 {name:'bus-inside-loop',out:'flac',loop:1,
  // 실내 엔진 웅웅 + 차체 흔들림 16초. 말소리 띠(1~4kHz)를 조금 눌러 사람 말이 덜 또렷하게
  src:[{file:'0644.wav',ss:60,t:17,af:'highpass=f=40,equalizer=f=2000:t=q:w=1:g=-6'}]},
 {name:'bus-brake-hiss',out:'mp3',fadeIn:.01,fadeOut:.25,
  src:[{file:'0909.wav',ss:20,t:1.2,af:'highpass=f=300'}]},
 {name:'bus-door-open',out:'mp3',fadeIn:.005,fadeOut:.2,
  src:[{file:'0909.wav',ss:24,t:1.6}]},
 {name:'bus-door-close',out:'mp3',fadeIn:.005,fadeOut:.2,
  src:[{file:'0909.wav',ss:40,t:1.6}]},
];

function decode(s){
 const af=[s.af,'aresample='+SR].filter(Boolean).join(',');
 const buf=execFileSync(FF,['-v','error','-ss',String(s.ss),'-t',String(s.t),'-i',RAW+s.file,'-af',af,'-ac','1','-ar',String(SR),'-f','f32le','-'],{maxBuffer:1<<28});
 const a=new Float32Array(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length));
 const n=Math.round(.004*SR);
 for(let i=0;i<n&&i<a.length;i++){a[i]*=i/n;a[a.length-1-i]*=i/n;}
 return a;
}
const peakOf=b=>{let p=0;for(const v of b)p=Math.max(p,Math.abs(v));return p;};

function build(it){
 let b=decode(it.src[0]);
 let m=0;for(const v of b)m+=v;m/=b.length;for(let i=0;i<b.length;i++)b[i]-=m;
 let loopSeam=null;
 if(it.loop){ // 끝 loop초를 처음 loop초와 등전력으로 겹쳐 이음매 없는 반복으로
  const X=Math.round(it.loop*SR),L=b.length-X,o=new Float32Array(L);
  for(let i=0;i<X;i++){const u=i/X;o[i]=b[L+i]*Math.cos(u*Math.PI/2)+b[i]*Math.sin(u*Math.PI/2);}
  for(let i=X;i<L;i++)o[i]=b[i];
  b=o;loopSeam=+Math.abs(b[0]-b[b.length-1]).toFixed(4);
 }else{
  const fi=Math.round((it.fadeIn??.003)*SR),fo=Math.round((it.fadeOut??.02)*SR);
  for(let i=0;i<fi&&i<b.length;i++)b[i]*=i/fi;
  for(let i=0;i<fo&&i<b.length;i++)b[b.length-1-i]*=i/fo;
 }
 // 반복 소리는 RMS를 맞추고(엔진 −24, 안 소리 −26 dBFS — 게임 게인 = 목표 − 이 값), 한 번 소리는 피크 −3dB
 let sum=0;for(const v of b)sum+=v*v;
 const rms=Math.sqrt(sum/b.length),target=it.name==='bus-engine-loop'?-24:-26;
 let k=it.loop?10**(target/20)/(rms||1):10**(-3/20)/(peakOf(b)||1);
 if(it.loop&&peakOf(b)*k>10**(-1/20))k=10**(-1/20)/peakOf(b); // 피크가 −1dB를 넘지 않게
 sum=0;for(let i=0;i<b.length;i++){b[i]*=k;sum+=b[i]*b[i];}
 return {b,rmsDb:+(10*Math.log10(sum/b.length)).toFixed(1),peakDb:+(20*Math.log10(peakOf(b))).toFixed(1),loopSeam};
}

function wavBytes(b){
 const d=Buffer.alloc(44+b.length*2);d.write('RIFF',0);d.writeUInt32LE(36+b.length*2,4);d.write('WAVE',8);d.write('fmt ',12);
 d.writeUInt32LE(16,16);d.writeUInt16LE(1,20);d.writeUInt16LE(1,22);d.writeUInt32LE(SR,24);d.writeUInt32LE(SR*2,28);d.writeUInt16LE(2,32);d.writeUInt16LE(16,34);
 d.write('data',36);d.writeUInt32LE(b.length*2,40);
 for(let i=0;i<b.length;i++)d.writeInt16LE(Math.round(Math.max(-1,Math.min(1,b[i]))*32767),44+i*2);
 return d;
}

const stats=[];
for(const it of ITEMS){
 const {b,rmsDb,peakDb,loopSeam}=build(it);
 const wav=TMP+it.name+'.wav';writeFileSync(wav,wavBytes(b));
 const file=it.name+'.'+it.out;
 const enc=it.out==='mp3'?['-c:a','libmp3lame','-b:a','96k']:['-c:a','flac','-compression_level','8'];
 execFileSync(FF,['-v','error','-y','-i',wav,'-ac','1','-ar',String(SR),...enc,OUT+file]);
 stats.push({file,seconds:+(b.length/SR).toFixed(3),sampleRate:SR,bytes:statSync(OUT+file).size,peakDb,rmsDb,...(it.loop?{loop:true,seam:loopSeam}:{}),from:it.src.map(s=>`${s.file}@${s.ss}+${s.t}`).join('+')});
}
writeFileSync(OUT+'namsan-sfx-stats.json',JSON.stringify(stats,null,1)+'\n');
rmSync(TMP,{recursive:true,force:true});
console.table(stats.map(({file,seconds,bytes,rmsDb,peakDb,seam})=>({file,seconds,bytes,rmsDb,peakDb,seam})));
console.log('합계',stats.reduce((a,s)=>a+s.bytes,0),'bytes');
