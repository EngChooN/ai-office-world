// 인형뽑기 가게 배경음악(월드개발, 2026-11-26). 외부 음원 없이 Web Audio로 합성한다(claw-audio.js 효과음과 같은 방식, 자체 제작이라 출처 표기 없음).
// 11-26 대표 지시 변경: 잔잔한 음악 → 게임방(오락실)처럼 활기차고 신나는 음악. 분위기 3가지(BGM_MOODS):
//  arcade 신나는 오락실(기본, 144bpm 칩튠) · pop 경쾌한 팝(126bpm 신스 팝) · retro 레트로 게임(134bpm 필드 음악).
// 반복해도 덜 질리게: 분위기마다 짧은 루프 A(8마디)·B(8마디)·C(간주 4마디)를 order 순서로 돌린다. 'A^' 멜로디 옥타브 올림, 'A~' 긴 음을 8분음 연타로(리듬 변형).
// 음은 음계 도수(0=으뜸음)로 적어 음계 밖 음이 나올 수 없다. 데이터는 순수 배열, scheduleBar(preset,barIndex)가 순서·변주를 반영한다.
// 예약: setInterval(100ms)+미리보기(.3s)로 ctx.currentTime 기준 음표를 하나씩 예약("A Tale of Two Clocks"). renderBars는 같은 음표 만들기(makeVoices)로 한 번에 예약(오프라인 렌더링용).
// 크기: 효과음보다 확실히 작게 버스 BGM_LEVEL. 리드는 로우패스(2.4~3kHz)로 각을 깎고 작게 → 코인·성공음(1.5~2kHz)을 가리지 않게. 하이햇은 7kHz 위, 킥은 사인 스윕.
// 휴대폰: 동시 소리 14개 이하, 필터는 시작할 때 한 번(lp·bp·hp), 노이즈 버퍼 한 번. ctx가 suspended면 예약만 건너뛴다. 탭 숨김 처리는 호출 측 몫.
export const BGM_LEVEL=.09; // BGM 버스 크기(효과음 마스터 뒤라 실제로는 더 작음)
export const NOTE_GAIN_MAX=.3; // 음표 하나의 gain 상한(버스 앞)
export const LOOKAHEAD=.3,TICK_MS=100,FADE_IN=.8,FADE_OUT=.4;
export const MAJOR=[0,2,4,5,7,9,11],MINOR=[0,2,3,5,7,8,10];
export const DEFAULT_MOOD='arcade';
// 음색: type 파형('pulse'=25% 펄스, PeriodicWave 없으면 네모파), a 올라옴(s), r 끝 뒤 여운(s), decay 참이면 치자마자 사그라듦. 드럼은 노이즈/사인 스윕
export const VOICES={
 lead:{type:'pulse',a:.005,r:.05,decay:false},    // 펄스 리드(칩튠)
 harm:{type:'square',a:.005,r:.05,decay:false},   // 두 번째 펄스(화음)
 arp:{type:'square',a:.002,r:.03,decay:true},     // 빠른 아르페지오
 saw:{type:'sawtooth',a:.01,r:.08,decay:false},   // 팝 리드
 stab:{type:'sawtooth',a:.003,r:.06,decay:true},  // 코드 스탭
 bass:{type:'triangle',a:.004,r:.04,decay:false},
 kick:{drum:true,r:0},snare:{drum:true,r:0},hat:{drum:true,r:0},clap:{drum:true,r:0},
};
// 마디 = [코드 근음 도수, 멜로디 [[박, 도수, 길이(박)]…]]. 도수 7 = 한 옥타브 위
export const BGM_MOODS={
 // 신나는 오락실: A단조 i–VI–VII–i, 펄스 리드+16분 아르페지오+옥타브 베이스+킥·스네어·8분 하이햇
 arcade:{name:'arcade',label:'신나는 오락실',bpm:144,key:57,scale:MINOR,beats:4,filter:2800,leadMax:84,
  gains:{lead:.085,arp:.035,bass:.15,kick:.24,snare:.09,hat:.03},
  sections:{
   A:[[0,[[0,4,.5],[.5,7,.5],[1,4,.5],[1.5,2,.5],[2,4,1],[3,7,.5],[3.5,9,.5]]],[5,[[0,7,1],[1,5,.5],[1.5,7,.5],[2,9,1.5],[3.5,7,.5]]],
    [6,[[0,8,.5],[.5,6,.5],[1,4,.5],[1.5,6,.5],[2,8,1],[3,11,1]]],[0,[[0,9,1.5],[1.5,7,.5],[2,4,2]]],
    [0,[[0,4,.5],[.5,7,.5],[1,9,.5],[1.5,7,.5],[2,11,1],[3,9,1]]],[5,[[0,10,.5],[.5,9,.5],[1,7,1],[2,5,.5],[2.5,7,.5],[3,9,1]]],
    [3,[[0,8,.5],[.5,7,.5],[1,5,.5],[1.5,3,.5],[2,5,1],[3,8,1]]],[6,[[0,8,.5],[.5,6,.5],[1,8,.5],[1.5,10,.5],[2,11,1.5],[3.5,13,.5]]]],
   B:[[5,[[0,9,1],[1,10,.5],[1.5,9,.5],[2,7,1],[3,5,1]]],[6,[[0,6,.5],[.5,8,.5],[1,10,1],[2,11,.5],[2.5,10,.5],[3,8,1]]],
    [2,[[0,9,1.5],[1.5,11,.5],[2,14,1],[3,11,1]]],[0,[[0,11,.5],[.5,10,.5],[1,9,.5],[1.5,7,.5],[2,4,2]]],
    [5,[[0,5,.5],[.5,7,.5],[1,9,.5],[1.5,12,.5],[2,12,1],[3,11,.5],[3.5,9,.5]]],[6,[[0,10,1],[1,8,.5],[1.5,6,.5],[2,8,1],[3,10,1]]],
    [4,[[0,11,.5],[.5,8,.5],[1,4,.5],[1.5,8,.5],[2,11,.5],[2.5,13,.5],[3,11,1]]],[4,[[0,8,2],[2,6,.5],[2.5,8,.5],[3,6,.5],[3.5,4,.5]]]],
   C:[[0,[[0,7,.25],[.5,7,.25],[1.5,7,.25],[2,9,.5],[3,7,.5]]],[0,[[0,4,.25],[.5,4,.25],[1.5,4,.25],[2,6,.5],[3,4,.5]]],
    [5,[[0,5,.5],[1,7,.5],[2,9,.5],[3,12,.5]]],[6,[[0,6,.5],[.5,8,.5],[1,10,.5],[1.5,11,.5],[2,13,.5],[2.5,14,.5],[3,13,.5],[3.5,11,.5]]]]},
  order:['A','A^','B','A~','C']},
 // 경쾌한 팝: D장조 I–V–vi–IV, 톱니 리드+엇박 코드 스탭+펌핑 베이스+4온더플로어 킥·박수
 pop:{name:'pop',label:'경쾌한 팝',bpm:126,key:62,scale:MAJOR,beats:4,filter:2400,leadMax:86,
  gains:{saw:.06,stab:.03,bass:.13,kick:.26,clap:.08,hat:.03},
  sections:{
   A:[[0,[[0,4,.5],[.5,4,.5],[1,2,.5],[1.5,4,1],[2.5,7,.5],[3,4,1]]],[4,[[0,6,.5],[.5,4,.5],[1,1,1],[2,4,.5],[2.5,6,1],[3.5,4,.5]]],
    [5,[[0,5,1],[1,7,.5],[1.5,9,1],[2.5,8,.5],[3,7,1]]],[3,[[0,7,.5],[.5,5,.5],[1,3,1],[2,4,1.5],[3.5,2,.5]]],
    [0,[[0,4,.5],[.5,7,.5],[1,9,.5],[1.5,7,1],[2.5,4,.5],[3,2,.5],[3.5,4,.5]]],[4,[[0,8,1],[1,6,.5],[1.5,4,1],[2.5,6,.5],[3,8,1]]],
    [5,[[0,9,.5],[.5,9,.5],[1,8,.5],[1.5,7,1],[2.5,5,.5],[3,7,1]]],[3,[[0,7,1.5],[1.5,6,.5],[2,7,2]]]],
   B:[[3,[[0,10,1],[1,9,.5],[1.5,7,1],[2.5,5,.5],[3,3,1]]],[4,[[0,8,.5],[.5,6,.5],[1,4,.5],[1.5,6,1],[2.5,8,.5],[3,11,1]]],
    [2,[[0,9,1.5],[1.5,8,.5],[2,6,1],[3,4,1]]],[5,[[0,5,.5],[.5,7,.5],[1,9,.5],[1.5,12,1],[2.5,11,.5],[3,9,1]]],
    [3,[[0,10,.5],[.5,9,.5],[1,7,.5],[1.5,10,1],[2.5,9,.5],[3,7,1]]],[4,[[0,8,.5],[.5,11,.5],[1,8,.5],[1.5,6,1],[2.5,4,.5],[3,6,1]]],
    [0,[[0,7,2],[2,9,.5],[2.5,11,.5],[3,11,1]]],[0,[[0,9,1],[1,7,1],[2,4,2]]]],
   C:[[5,[[0,5,.5],[1,5,.5],[2,7,.5],[3,5,.5]]],[3,[[0,3,.5],[1,3,.5],[2,7,.5],[3,6,.5]]],
    [0,[[0,4,.5],[.5,7,.5],[1,4,.5],[2,9,.5],[2.5,7,.5],[3,4,.5]]],[4,[[0,8,.5],[.5,8,.5],[1,6,.5],[1.5,8,.5],[2,11,1],[3,8,.5],[3.5,6,.5]]]]},
  order:['A','B','A~','C','B','A^']},
 // 레트로 게임: C장조 필드 음악, 펄스 리드+3도 아래 펄스 화음+삼각파 걷는 베이스+가벼운 드럼
 retro:{name:'retro',label:'레트로 게임',bpm:134,key:60,scale:MAJOR,beats:4,filter:3000,leadMax:86,
  gains:{lead:.075,harm:.045,bass:.2,kick:.18,snare:.06,hat:.022},
  sections:{
   A:[[0,[[0,7,1],[1,4,.5],[1.5,7,.5],[2,9,1],[3,8,.5],[3.5,7,.5]]],[3,[[0,8,1.5],[1.5,7,.5],[2,5,1],[3,3,1]]],
    [4,[[0,6,.5],[.5,4,.5],[1,6,.5],[1.5,8,.5],[2,11,1],[3,8,1]]],[0,[[0,7,2],[2,4,1],[3,2,1]]],
    [5,[[0,9,1],[1,7,.5],[1.5,9,.5],[2,12,1],[3,11,.5],[3.5,9,.5]]],[3,[[0,10,1],[1,8,1],[2,7,.5],[2.5,8,.5],[3,10,1]]],
    [1,[[0,8,.5],[.5,10,.5],[1,12,1],[2,11,.5],[2.5,10,.5],[3,8,1]]],[4,[[0,11,1.5],[1.5,10,.5],[2,8,1],[3,6,1]]]],
   B:[[5,[[0,5,.5],[.5,7,.5],[1,9,1],[2,7,.5],[2.5,9,.5],[3,12,1]]],[4,[[0,11,1.5],[1.5,8,.5],[2,6,1],[3,4,1]]],
    [3,[[0,5,.5],[.5,7,.5],[1,8,1],[2,10,.5],[2.5,8,.5],[3,7,1]]],[0,[[0,7,1.5],[2,9,.5],[2.5,11,.5],[3,14,1]]],
    [5,[[0,12,1],[1,11,.5],[1.5,9,.5],[2,7,1],[3,9,1]]],[4,[[0,8,.5],[.5,6,.5],[1,4,.5],[1.5,6,.5],[2,8,1],[3,11,1]]],
    [1,[[0,10,1],[1,8,.5],[1.5,10,.5],[2,12,1],[3,10,1]]],[4,[[0,8,2],[2,6,.5],[2.5,8,.5],[3,4,1]]]],
   C:[[3,[[0,10,.5],[.5,10,.5],[1,8,.5],[2,10,1],[3,12,1]]],[4,[[0,11,.5],[.5,11,.5],[1,8,.5],[2,11,1],[3,13,1]]],
    [5,[[0,12,1.5],[1.5,11,.5],[2,9,1],[3,7,1]]],[4,[[0,8,.5],[.5,9,.5],[1,10,.5],[1.5,11,.5],[2,11,1],[3,8,.5],[3.5,6,.5]]]]},
  order:['A','A~','B','C','A^']},
};
export const noteFreq=midi=>440*2**((midi-69)/12);
export const barSeconds=p=>p.beats*60/p.bpm;
export const degMidi=(p,d)=>p.key+12*Math.floor(d/7)+p.scale[((d%7)+7)%7];
const SEQ=new WeakMap(),mod=(i,n)=>((i%n)+n)%n;
// 한 바퀴 마디 목록 [{sec,v(''·'^'·'~'),bar,last(구간 마지막 마디)}]
export function loopSeq(p){let s=SEQ.get(p);if(!s){s=p.order.flatMap(o=>p.sections[o[0]].map((bar,i,a)=>({sec:o[0],v:o.slice(1),bar,last:i===a.length-1})));SEQ.set(p,s);}return s;}
export const loopSeconds=name=>{const p=BGM_MOODS[name];return p?loopSeq(p).length*barSeconds(p):0;};
// 한 마디에서 낼 음표 [{t(초, 마디 시작 기준),midi(드럼은 null),dur(초),voice,gain}] — 시간순
export function scheduleBar(p,barIndex){
 const S=loopSeq(p),{sec,v,bar:[root,mel],last}=S[mod(barIndex,S.length)],sb=60/p.bpm,L=barSeconds(p),g=p.gains,out=[];
 const add=(b,midi,durB,voice,mul=1)=>{const t=b*sb;if(t>=L-1e-9)return;out.push({t,midi,dur:Math.min(durB*sb,L-t),voice,gain:Math.min(NOTE_GAIN_MAX,(g[voice]??0)*mul)});};
 const RF=d=>degMidi(p,root+d)-(root>=4?12:0); // 코드 근음 기준 도수(높은 근음은 한 옥타브 내려 음역을 고르게)
 const drum=(b,voice,sec_,mul=1)=>add(b,null,sec_/sb,voice,mul);
 const ml=v==='~'?mel.flatMap(([b,d,l])=>l>=1?Array.from({length:Math.round(l/.5)},(_,k)=>[b+k*.5,d,.5]):[[b,d,l]]):mel; // 리듬 변형: 긴 음 → 8분 연타
 const lead=(voice,dOff=0)=>{for(const [b,d,l] of ml){let m=degMidi(p,d+dOff),gm=1;if(v==='^'&&m+12<=p.leadMax){m+=12;gm=.8;}add(b,m,l*.9,voice,gm);}};
 const brk=sec==='C';
 if(p.name==='arcade'){
  for(let i=0;i<8;i++)add(i*.5,RF(0)-12+(i%2?12:0),.4,'bass'); // 통통 옥타브 베이스
  const ap=[0,2,4,7,4,2,0,2,0,2,4,7,9,7,4,2];for(let i=0;i<16;i++)add(i*.25,RF(Math.min(ap[i],7)),.22,'arp',i%4?.8:1); // 16분 아르페지오
  lead('lead');
  if(brk){for(let i=0;i<4;i++)drum(i,'kick',.2);for(let i=0;i<4;i++)drum(i+.5,'hat',.05);}
  else{for(const b of [0,2,2.5])drum(b,'kick',.2);drum(1,'snare',.14);for(let i=0;i<8;i++)drum(i*.5,'hat',.04,i%2?.6:1);}
  if(last)for(let i=0;i<4;i++)drum(3+i*.25,'snare',.1,.55+i*.15);else if(!brk)drum(3,'snare',.14); // 구간 끝 스네어 필인
 }else if(p.name==='pop'){
  const bp=[0,0,7,0,0,0,4,7];for(let i=0;i<8;i++)add(i*.5,RF(bp[i])-12,.42,'bass',i%2?.85:1);
  for(const b of brk?[1.5,3.5]:[.5,1.5,2.5,3.5])for(const d of [0,2,4])add(b,RF(d),.3,'stab'); // 엇박 코드 스탭
  lead('saw');
  for(let i=0;i<4;i++)if(!brk||i%2===0||last)drum(i,'kick',.22);
  drum(1,'clap',.12);drum(3,'clap',.12);if(last)drum(3.5,'clap',.12,.8);
  for(let i=0;i<4;i++)drum(i+.5,'hat',.05);
 }else{
  for(const [i,d] of [0,4,7,4].entries())add(i,RF(d)-12,.85,'bass'); // 걷는 삼각파 베이스
  lead('lead');lead('harm',-2); // 3도 아래 화음
  drum(0,'kick',.18);if(!brk)drum(2,'kick',.18);drum(1,'snare',.1);drum(3,'snare',.1);if(last)drum(3.5,'snare',.1,.8);
  for(let i=0;i<8;i++)drum(i*.5,'hat',.03,i%2?.6:1);
 }
 return out.sort((a,b)=>a.t-b.t);
}
// 소리 만들기(라이브 스케줄러·renderBars 공용). 필터·노이즈 버퍼·펄스파형은 여기서 한 번만 만든다
function makeVoices(ctx,out,filter){
 const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filter;lp.Q.value=.4;lp.connect(out);
 const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=7000;hp.connect(out);
 const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=.8;bp.connect(out);
 let noise=null,pulse;
 const noiseBuf=()=>{if(noise)return noise;const n=ctx.sampleRate|0||44100;noise=ctx.createBuffer(1,n,n);const d=noise.getChannelData?.(0);if(d)for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return noise;};
 const pulseWave=()=>{if(pulse!==undefined)return pulse;pulse=null;try{if(ctx.createPeriodicWave){const N=32,re=new Float32Array(N),im=new Float32Array(N);
  for(let k=1;k<N;k++)re[k]=2*Math.sin(Math.PI*k*.25)/(Math.PI*k); // 25% 펄스
  pulse=ctx.createPeriodicWave(re,im);}}catch{pulse=null;}return pulse;};
 function play(n){
  const V=VOICES[n.voice],at=n.at,end=at+n.dur+V.r,g=ctx.createGain(),gg=g.gain;let src;
  if(V.drum&&n.voice!=='kick'){src=ctx.createBufferSource();src.buffer=noiseBuf();
   if(n.voice==='clap'){gg.setValueAtTime(n.gain,at);gg.exponentialRampToValueAtTime(.002,at+.012);gg.setValueAtTime(n.gain*.8,at+.014);gg.exponentialRampToValueAtTime(.002,at+.026);gg.setValueAtTime(n.gain*.7,at+.028);}
   else gg.setValueAtTime(n.gain,at);
   gg.exponentialRampToValueAtTime(.0008,end);src.connect(g).connect(n.voice==='hat'?hp:bp);src.start(at,Math.random()*.5);}
  else if(n.voice==='kick'){src=ctx.createOscillator();src.type='sine';src.frequency.setValueAtTime(120,at);src.frequency.exponentialRampToValueAtTime(45,at+.12);
   gg.setValueAtTime(0,at);gg.linearRampToValueAtTime(n.gain,at+.004);gg.exponentialRampToValueAtTime(.0008,end);src.connect(g).connect(out);src.start(at);}
  else{src=ctx.createOscillator();const w=V.type==='pulse'?pulseWave():null;if(w)src.setPeriodicWave(w);else src.type=V.type==='pulse'?'square':V.type;
   src.frequency.setValueAtTime(noteFreq(n.midi),at);gg.setValueAtTime(0,at);gg.linearRampToValueAtTime(n.gain,at+V.a);
   if(!V.decay)gg.setValueAtTime(n.gain,Math.max(at+V.a,at+n.dur));gg.exponentialRampToValueAtTime(.0008,end);
   src.connect(g).connect(lp);src.start(at);}
  src.stop(end+.02);return {src,end:end+.02};
 }
 return {lp,play,disconnect(){for(const f of [lp,hp,bp])try{f.disconnect();}catch{}}};
}
// 스케줄러 없이 마디 startBar부터 bars개를 t0에 한 번에 예약(OfflineAudioContext 렌더링용). level 기본 1(듣기용), 실제 비율은 BGM_LEVEL
export function renderBars(ctx,dest,mood=DEFAULT_MOOD,{bars=16,t0=0,startBar=0,level=1}={}){
 const p=BGM_MOODS[mood]??BGM_MOODS[DEFAULT_MOOD],L=barSeconds(p),bus=ctx.createGain();bus.gain.value=level;bus.connect(dest??ctx.destination);
 const vx=makeVoices(ctx,bus,p.filter);let notes=0;
 for(let i=0;i<bars;i++){const s=t0+i*L;for(const n of scheduleBar(p,startBar+i)){vx.play({...n,at:s+n.t});notes++;}}
 return {mood:p.name,start:t0,end:t0+bars*L,notes,bus};
}
export function createClawBgm({ctx,dest,mood=DEFAULT_MOOD,level=BGM_LEVEL,setI=globalThis.setInterval,clearI=globalThis.clearInterval,setT=globalThis.setTimeout}={}){
 let cur=BGM_MOODS[mood]?mood:DEFAULT_MOOD,want=cur,lvl=level,playing=false,timer=null,bus=null,vx=null,live=[],bar=0,B=null;
 function loadBar(start){ // 마디 경계에서만 분위기 바꿈(새 분위기는 첫 구간부터)
  if(want!==cur){cur=want;bar=0;try{vx.lp.frequency.setTargetAtTime(BGM_MOODS[cur].filter,start,.05);}catch{}}
  const p=BGM_MOODS[cur];B={start,len:barSeconds(p),i:0,notes:scheduleBar(p,bar++).map(n=>({...n,at:start+n.t}))};
 }
 function tick(){
  if(!playing)return;const now=ctx.currentTime;live=live.filter(x=>x.end>now);
  if(ctx.state!=='running')return; // 멈춘 동안은 예약하지 않음
  try{
   if(B.start+B.len<now)loadBar(now+.05); // 오래 멈췄다 돌아옴: 새 마디부터
   const h=now+LOOKAHEAD;
   for(;;){if(B.i<B.notes.length){const n=B.notes[B.i];if(n.at>=h)break;if(n.at>=now-.01)live.push(vx.play(n));B.i++;}else{const nb=B.start+B.len;if(nb>=h)break;loadBar(nb);}}
  }catch{}
 }
 return {
  start(){if(playing||!ctx)return;try{
   const now=ctx.currentTime;playing=true;bar=0;cur=want;live=[];
   bus=ctx.createGain();bus.gain.setValueAtTime(0,now);bus.gain.linearRampToValueAtTime(lvl,now+FADE_IN);bus.connect(dest??ctx.destination);
   vx=makeVoices(ctx,bus,BGM_MOODS[cur].filter);
   loadBar(now+.1);tick();timer=setI(tick,TICK_MS);}catch{playing=false;}},
  stop(){if(!playing)return;playing=false;if(timer!=null)clearI(timer);timer=null;
   try{const now=ctx.currentTime,t=now+FADE_OUT,b=bus,v=vx;b.gain.cancelScheduledValues(now);b.gain.setValueAtTime(b.gain.value,now);b.gain.linearRampToValueAtTime(0,t);
    for(const x of live)if(x.end>t+.02)try{x.src.stop(t+.02);}catch{}
    live=[];setT?.(()=>{try{b.disconnect();v?.disconnect();}catch{}},(FADE_OUT+.2)*1000);}catch{}},
  setMood(name){if(!BGM_MOODS[name])return;want=name;if(!playing)cur=name;},
  setLevel(v){lvl=Math.max(0,+v||0);if(bus&&playing)try{bus.gain.setTargetAtTime(lvl,ctx.currentTime,.1);}catch{}},
  get playing(){return playing;},
  get mood(){return want;},
 };
}
