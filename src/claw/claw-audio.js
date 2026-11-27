// 인형뽑기 효과음(월드개발, 2026-11-23). 외부 음원 없이 Web Audio로 합성한다(크리스마스 효과음과 같은 방식).
// 설계 §5: 코인 「짤랑」, 집게 이동 「위잉」(누르는 동안 이어짐), 내려감 「지이잉」, 잡음 「덜컥」, 성공 「빰빠밤」, 실패 「뿅…」, 끝에 닿음 「툭」.
// 소리 끔·크기·배경 음악은 세 체험 공용 설정(shared-settings.js)을 main.js가 넘긴다. 첫 누름 뒤에만 소리가 난다(브라우저 자동 재생 규칙).
// 11-26 대표 제보 「소리가 없다」: 휴대폰은 손가락을 뗄 때(touchend·pointerup·click)만 소리를 켤 수 있는데 pointerdown·keydown만 들어 소리가 영영 안 켜졌다
//  → 흡연장·크리스마스처럼 touchend까지 듣고, 켜질 때까지 입력마다 다시 깨운다. 가게 배경 음악(claw-bgm.js)·올라오기·타이머 틱·열쇠·봉 상자 소리 추가.
import {createClawBgm,BGM_LEVEL} from './claw-bgm.js';
export const CLAW_SOUNDS=Object.freeze(['coin','bump','down','up','grab','unlock','rattle','slip','chute','win','fanfare','lose','grant',
 'tick','perfect','near','key-in','cell','push','drop','door','step','snap','fall','ding']);
export const SFX_MASTER=.7; // 마스터(공용 소리 크기 배수 1일 때). 배경 음악 버스는 BGM_LEVEL, 기계 조작 중엔 BGM_DUCK배로 줄인다
export const BGM_DUCK=.55;
export function createClawAudio({muted=false,volume=1,music=true,mood='arcade',win=globalThis.window,doc=globalThis.document}={}){
 let ctx=null,master=null,out=null,bgmBus=null,bgm=null,motor=null,isMuted=!!muted,vol=volume,musicOn=!!music,ducked=false,hidden=false;
 const stats={played:0,byName:{},unlocks:0};
 const AC=win?.AudioContext??win?.webkitAudioContext;
 const masterGain=()=>isMuted?0:SFX_MASTER*vol;
 function unlock(){
  if(!AC)return;
  if(!ctx){try{ctx=new AC();master=ctx.createGain();master.gain.value=masterGain();master.connect(ctx.destination);
   bgmBus=ctx.createGain();bgmBus.gain.value=1;bgmBus.connect(master);bgm=createClawBgm({ctx,dest:bgmBus,mood});}catch{ctx=null;return;}}
  if(ctx.state!=='running'&&!hidden)ctx.resume?.().then(syncBgm,()=>{});
  syncBgm();
 }
 const onInput=()=>{stats.unlocks++;unlock();};
 for(const ev of ['pointerdown','pointerup','touchend','click','keydown'])win?.addEventListener?.(ev,onInput,{capture:true,passive:true});
 // 탭을 숨기면 소리를 쉬고(휴대폰 배터리), 돌아오면 다시 깨운다
 doc?.addEventListener?.('visibilitychange',()=>{hidden=!!doc.hidden;if(!ctx)return;if(hidden){bgm?.stop();ctx.suspend?.().catch?.(()=>{});}else{ctx.resume?.().then(syncBgm,()=>{});}});
 function syncBgm(){if(!bgm)return;const want=musicOn&&!isMuted&&!hidden&&ctx?.state==='running';if(want&&!bgm.playing)bgm.start();else if(!want&&bgm.playing)bgm.stop();}
 const ok=()=>ctx&&!isMuted&&ctx.state==='running';
 let noiseBuf=null;
 function noise({dur=.1,gain=.2,at=0,freq=1200,q=.8,type='bandpass'}){
  if(!noiseBuf){const n=Math.floor(ctx.sampleRate*.6);noiseBuf=ctx.createBuffer(1,n,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}
  const t=ctx.currentTime+at,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;f.type=type;f.frequency.value=freq;f.Q.value=q;
  g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f).connect(g).connect(out??master);s.start(t);s.stop(t+dur+.02);
 }
 function tone({f=440,f2=null,type='sine',dur=.15,gain=.3,at=0,attack=.005}){
  const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+attack);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g).connect(out??master);o.start(t);o.stop(t+dur+.02);
 }
 const SFX={
  coin:()=>{tone({f:1568,type:'triangle',dur:.12,gain:.25});tone({f:2093,type:'triangle',dur:.22,gain:.22,at:.07});noise({dur:.05,gain:.06,freq:6000,at:.02});},
  bump:()=>tone({f:140,f2:90,type:'square',dur:.07,gain:.12}),
  down:()=>tone({f:520,f2:300,type:'sawtooth',dur:1.0,gain:.05,attack:.05}),
  up:()=>tone({f:300,f2:520,type:'sawtooth',dur:.9,gain:.045,attack:.05}), // 올라오기 「위이잉↑」(내려가기의 거꾸로)
  grab:()=>{tone({f:180,f2:120,type:'square',dur:.09,gain:.16});tone({f:90,type:'triangle',dur:.12,gain:.2,at:.04});},
  // 타이머 문(11-23): 철컥 풀림·덜컥 흔들림
  unlock:()=>{tone({f:900,f2:600,type:'square',dur:.05,gain:.12});tone({f:420,f2:260,type:'square',dur:.08,gain:.14,at:.07});},
  rattle:()=>tone({f:160,f2:110,type:'square',dur:.06,gain:.12}),
  slip:()=>tone({f:600,f2:180,type:'triangle',dur:.35,gain:.16}),
  chute:()=>tone({f:300,f2:120,type:'triangle',dur:.25,gain:.18}),
  win:()=>[784,988,1175,1568].forEach((f,i)=>tone({f,type:'triangle',dur:.22,gain:.2,at:i*.11})),
  fanfare:()=>[784,988,1175,1568,1175,1568,2093].forEach((f,i)=>tone({f,type:'triangle',dur:.24,gain:.2,at:i*.1})),
  lose:()=>{tone({f:520,f2:260,type:'sine',dur:.28,gain:.18});tone({f:330,f2:200,type:'sine',dur:.35,gain:.14,at:.22});},
  grant:()=>[1319,1568,2093].forEach((f,i)=>tone({f,type:'triangle',dur:.16,gain:.18,at:i*.08})),
  // 11-26 추가
  tick:()=>tone({f:1900,type:'square',dur:.025,gain:.05}), // 타이머 1초마다 「틱」(작게)
  perfect:()=>{[1047,1319,1568,2093,2637].forEach((f,i)=>tone({f,type:'triangle',dur:.3,gain:.18,at:i*.07}));noise({dur:.5,gain:.05,freq:7000,at:.3});}, // 딱 10.00 「반짝」
  near:()=>{tone({f:660,type:'triangle',dur:.12,gain:.14});tone({f:620,type:'triangle',dur:.2,gain:.12,at:.1});}, // 아깝다 「띠딩」
  'key-in':()=>{noise({dur:.06,gain:.12,freq:3500,q:2});tone({f:700,f2:420,type:'square',dur:.05,gain:.1,at:.05});}, // 열쇠 쏙·딸깍
  cell:()=>{tone({f:880,type:'triangle',dur:.1,gain:.15});tone({f:1320,type:'triangle',dur:.18,gain:.15,at:.08});}, // 칸 열림 「딸깍·띵」
  push:()=>{tone({f:120,f2:80,type:'triangle',dur:.12,gain:.16});noise({dur:.1,gain:.07,freq:500,q:.7});}, // 집게가 봉 상자를 밀 때 「툭」
  drop:()=>{tone({f:160,f2:55,type:'sine',dur:.35,gain:.26});noise({dur:.18,gain:.1,freq:300,q:.6,at:.02});}, // 상자가 떨어져 바닥에 「쿵」
  door:()=>tone({f:420,f2:260,type:'square',dur:.08,gain:.12}),
  // 11-27 불빛 쌓기(규칙서 §1 소리): 칸 이동 틱(줄이 오를수록 높게, o.row 1~11)·멈춤 「딱」·떨어짐 「뿅↓」·7줄 「띠링」
  step:(o={})=>tone({f:520*2**(((o.row??1)-1)/12),type:'square',dur:.022,gain:.035}),
  snap:()=>{tone({f:1400,f2:900,type:'square',dur:.04,gain:.12});noise({dur:.03,gain:.06,freq:4000,q:2});},
  fall:()=>tone({f:900,f2:220,type:'triangle',dur:.3,gain:.14}),
  ding:()=>[1319,1760,2349].forEach((f,i)=>tone({f,type:'triangle',dur:.26,gain:.17,at:i*.08})),
 };
 return {
  // gain: 다른 손님 기계 구경 소리는 거리만큼 작게(main.js hearOf). 0이면 안 냄
  play(name,{gain=1,...o}={}){if(!ok()||!(gain>.01))return;try{if(gain<.999){out=ctx.createGain();out.gain.value=gain;out.connect(master);}SFX[name]?.(o);stats.played++;stats.byName[name]=(stats.byName[name]??0)+1;}catch{}finally{out=null;}},
  // 이어지는 소리(집게 이동 위잉). 누르는 동안 loop, 떼면 stop
  loop(name){if(name!=='motor'||motor||!ok())return;try{const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.value=110;o2.type='sine';o2.frequency.value=7;const lg=ctx.createGain();lg.gain.value=8;o2.connect(lg).connect(o.frequency);
   g.gain.value=0;g.gain.linearRampToValueAtTime(.035,ctx.currentTime+.05);o.connect(g).connect(master);o.start();o2.start();motor={o,o2,g};stats.byName.motor=(stats.byName.motor??0)+1;}catch{}},
  stop(name){if(name!=='motor'||!motor)return;const m=motor;motor=null;try{m.g.gain.setTargetAtTime(0,ctx.currentTime,.03);m.o.stop(ctx.currentTime+.15);m.o2.stop(ctx.currentTime+.15);}catch{}},
  setMuted(on){isMuted=!!on;if(master)master.gain.value=masterGain();if(isMuted)this.stop('motor');syncBgm();},
  setVolume(v){vol=v;if(master)master.gain.value=masterGain();},
  setMusic(on){musicOn=!!on;syncBgm();},
  setMood(m){mood=m;bgm?.setMood(m);},
  // 기계 앞에서 조작하는 동안 배경 음악을 줄여 효과음이 잘 들리게
  duck(on){ducked=!!on;if(bgmBus&&ctx)bgmBus.gain.setTargetAtTime(ducked?BGM_DUCK:1,ctx.currentTime,.25);},
  get muted(){return isMuted;},get music(){return musicOn;},
  status(){return {context:ctx?.state??'입력 대기',muted:isMuted,music:musicOn,bgm:!!bgm?.playing,mood:bgm?.mood??mood,ducked,level:BGM_LEVEL,...stats,byName:{...stats.byName}};},
 };
}
