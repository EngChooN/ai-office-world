// 인형뽑기 효과음(월드개발, 2026-11-23). 외부 음원 없이 Web Audio로 합성한다(크리스마스 효과음과 같은 방식).
// 설계 §5: 코인 「짤랑」, 집게 이동 「위잉」(누르는 동안 이어짐), 내려감 「지이잉」, 잡음 「덜컥」, 성공 「빰빠밤」, 실패 「뿅…」, 끝에 닿음 「툭」.
// 소리 끔·크기는 세 체험 공용 설정(shared-settings.js)을 main.js가 넘긴다. 첫 누름 뒤에만 소리가 난다(브라우저 자동 재생 규칙).
export function createClawAudio({muted=false,volume=1,win=globalThis.window}={}){
 let ctx=null,master=null,motor=null,isMuted=!!muted,vol=volume;
 const AC=win?.AudioContext??win?.webkitAudioContext;
 function unlock(){if(ctx||!AC)return;try{ctx=new AC();master=ctx.createGain();master.gain.value=isMuted?0:.5*vol;master.connect(ctx.destination);}catch{ctx=null;}}
 for(const ev of ['pointerdown','keydown'])win?.addEventListener?.(ev,()=>{unlock();if(ctx?.state==='suspended')ctx.resume().catch(()=>{});},{capture:true,passive:true});
 const ok=()=>ctx&&!isMuted&&ctx.state==='running';
 function tone({f=440,f2=null,type='sine',dur=.15,gain=.3,at=0,attack=.005}){
  const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+attack);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g).connect(master);o.start(t);o.stop(t+dur+.02);
 }
 const SFX={
  coin:()=>{tone({f:1568,type:'triangle',dur:.12,gain:.25});tone({f:2093,type:'triangle',dur:.22,gain:.22,at:.07});},
  bump:()=>tone({f:140,f2:90,type:'square',dur:.07,gain:.12}),
  down:()=>tone({f:520,f2:300,type:'sawtooth',dur:1.0,gain:.05,attack:.05}),
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
 };
 return {
  play(name){if(!ok())return;try{SFX[name]?.();}catch{}},
  // 이어지는 소리(집게 이동 위잉). 누르는 동안 loop, 떼면 stop
  loop(name){if(name!=='motor'||motor||!ok())return;try{const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.value=110;o2.type='sine';o2.frequency.value=7;const lg=ctx.createGain();lg.gain.value=8;o2.connect(lg).connect(o.frequency);
   g.gain.value=0;g.gain.linearRampToValueAtTime(.035,ctx.currentTime+.05);o.connect(g).connect(master);o.start();o2.start();motor={o,o2,g};}catch{}},
  stop(name){if(name!=='motor'||!motor)return;const m=motor;motor=null;try{m.g.gain.setTargetAtTime(0,ctx.currentTime,.03);m.o.stop(ctx.currentTime+.15);m.o2.stop(ctx.currentTime+.15);}catch{}},
  setMuted(on){isMuted=!!on;if(master)master.gain.value=isMuted?0:.5*vol;if(isMuted)this.stop('motor');},
  setVolume(v){vol=v;if(master&&!isMuted)master.gain.value=.5*vol;},
  get muted(){return isMuted;},
 };
}
