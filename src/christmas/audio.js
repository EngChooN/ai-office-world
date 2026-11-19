// 온라인 크리스마스 소리(월드개발, 2026-11-16). 효과음·모닥불·썰매는 모두 Web Audio로 이 코드가 직접 만드는 소리(자체 제작)라 출처 표기가 없다(캐럴만 녹음 파일, 아래).
// 바람 배경만 등산에 이미 있는 파일(public/sounds/ambient/wind-forest-loop.flac, 출처는 public/sounds/CREDITS.md)을 작게 깐다.
//  - 모닥불: 낮게 웅웅 타는 소리 + 탁탁 튀는 소리. 불에서 멀수록 작게(12m 밖 0), 앉으면 크게(체험설계 §5-3 "장작 소리 크게").
//  - 효과음: jingle 장식 딸랑 · mail 우체통 쏙 · open 선물 풀기 · throw 휙 · hit 퍽 · roll 눈 뭉치는 사각 · done 완성 반짝 · bank 눈 더미 푹 · pop 알림
//  - 썰매: 미끄러지는 쉬익(속도에 따라) + 방울(slide(speed) 매 프레임)
//  - 스케이트(11-19): 활주 쉬익(update의 skate 속도에 따라, 썰매보다 높고 가늘게) · 밀기 skate-push 「슥」 · 멈춤 skate-stop 「샤악」. 내 소리만(다른 사람 소리는 후속)
// 아이폰 사파리 제한 때문에 첫 입력(터치·클릭·키) 전에는 AudioContext를 만들지 않는다(흡연장·등산과 같음). 소리 끄기는 이 기기에 저장(main.js).
// 캐럴 배경음(11-16 3차): 미 공군 군악대 녹음 8곡(carols.js, 퍼블릭 도메인 — 출처는 「소리 출처」·기록표 §16). 관악산 FM처럼 <audio>로 흘려 받아(radio-audio.js createDeck)
//  같은 AudioContext의 마스터로 섞는다(긴 곡을 통째로 풀지 않아 휴대폰 메모리를 아낌). 모두 같은 시계로 같은 곡(carolAt). 소리 끄기(🔊)나 캐럴 끄기면 <audio>를 멈추고 비워
//  받기도 멈춘다. 크기: 바람 .07·모닥불 최대 .55 사이에 깔리게 CAROL_LEVEL, 모닥불에 가까울수록 줄이고 앉으면 CAROL_FIRE(장작 소리가 잘 들리게).
import {createDeck} from '../radio-audio.js';
import {CAROLS,CAROL_DIR,carolAt} from './carols.js';
export const CAROL_LEVEL=.24,CAROL_FIRE=.12; // 캐럴 버스 크기(평소·모닥불에 앉았을 때)
export const XMAS_SOUNDS=Object.freeze(['jingle','mail','open','throw','hit','roll','done','bank','pop','warm','beep','go','boost','tick','skate-push','skate-stop']);
export const FIRE_HEAR=12; // 모닥불이 들리는 거리(m)
// 거리 → 크기(0~1): 1m 안 그대로, radius 밖 0, 사이는 제곱
export function hearGain(d,radius=FIRE_HEAR){if(!Number.isFinite(d))return 1;if(d<=1)return 1;if(d>=radius)return 0;const k=1-(d-1)/(radius-1);return k*k;}
const baseUrl=()=>{try{return import.meta.env?.BASE_URL??'/';}catch{return '/';}};

export function createXmasAudio({muted=false,volume=1,carol:carolOn=true,win=globalThis.window,doc=globalThis.document,windUrl=`${baseUrl()}sounds/ambient/wind-forest-loop.flac`,carolBase=`${baseUrl()}${CAROL_DIR}`,carols=CAROLS,now=()=>Date.now(),random=Math.random}={}){
 let ctx=null,master=null,noiseBuf=null,fire=null,sled=null,skate=null,wind=null,unlocked=false,off=!!muted,carol=null,carolDeck=null,carolState='off',tapM=null,tapC=null;
 const listener={x:0,z:0};
 let vol=Number.isFinite(+volume)?Math.max(0,+volume):1;
 const stats={played:0,byName:{},fireGain:0,unlocked:false,carol:{on:!!carolOn,state:'off',index:-1,title:null,level:0}};
 function unlock(){
  if(unlocked)return;unlocked=true;stats.unlocked=true;
  try{const AC=win.AudioContext||win.webkitAudioContext;if(!AC)return;ctx=new AC();}catch{return;}
  master=ctx.createGain();master.gain.value=off?0:.9*vol;master.connect(ctx.destination);
  // 측정용 탭(시험·진단, 출력 없음): 마스터 뒤 전체 / 캐럴 버스
  tapM=ctx.createAnalyser();tapM.fftSize=2048;master.connect(tapM);
  carol=ctx.createGain();carol.gain.value=CAROL_LEVEL;carol.connect(master);tapC=ctx.createAnalyser();tapC.fftSize=2048;carol.connect(tapC);
  const n=ctx.sampleRate*2;noiseBuf=ctx.createBuffer(1,n,ctx.sampleRate);const d=noiseBuf.getChannelData(0);let b=0;for(let i=0;i<n;i++){const w=random()*2-1;b=(b+.02*w)/1.02;d[i]=w*.6+b*3.2;}
  startFire();startSled();startSkate();loadWind();
  ctx.resume?.();
  syncCarol();
 }
 // 첫 입력 = 소리 시작, 그 뒤 입력 = 캐럴 <audio> 준비(아이폰은 입력 안에서 한 번 튼 <audio>만 나중에 틀 수 있음)
 const onInput=()=>{unlock();carolDeck?.prime?.();};
 for(const e of ['pointerdown','keydown','touchend'])win?.addEventListener?.(e,onInput,{once:false,passive:true});
 // ── 캐럴(흘려 받기). 켜져 있어야 할 때만 재생기를 두고, 아니면 떼어 받기를 멈춘다
 const carolWanted=()=>!!(ctx&&carolOn&&!off&&doc);
 function syncCarol(){
  if(carolWanted()&&!carolDeck){
   const files=carols.map(c=>({url:carolBase+c.file,duration:c.end,start:c.start,gain:c.gain}));
   carolState='loading';
   try{carolDeck=createDeck(ctx,carol,files,{start:carolAt(carols,now()/1000),xfade:2.5,doc,onState:st=>{carolState=st;}});carolDeck.prime();}catch{carolDeck=null;carolState='error';}
  }else if(!carolWanted()&&carolDeck){carolDeck.stop();carolDeck=null;carolState='off';}
  const c=stats.carol;c.on=!!carolOn;c.state=carolState;
 }
 const level=a=>{if(!a)return -Infinity;const d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);let q=0;for(const v of d)q+=v*v;const r=Math.sqrt(q/d.length);return r>0?20*Math.log10(r):-Infinity;};
 const noise=()=>{const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.loopStart=random();return s;};
 // ── 모닥불(늘 켜 두고 크기만 바꿈)
 function startFire(){
  const g=ctx.createGain();g.gain.value=0;g.connect(master);
  const rum=noise(),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;const rg=ctx.createGain();rg.gain.value=.5;rum.connect(lp).connect(rg).connect(g);rum.start();
  fire={g,next:0,level:0};
 }
 function crackle(at,level){
  const s=ctx.createBufferSource();s.buffer=noiseBuf;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1800+random()*3200;bp.Q.value=1.4;
  const g=ctx.createGain(),v=(.15+random()*.35)*level;g.gain.setValueAtTime(v,at);g.gain.exponentialRampToValueAtTime(.0005,at+.03+random()*.05);
  s.connect(bp).connect(g).connect(master);s.start(at,random()*1.5,.12);
 }
 // ── 썰매(쉬익 + 방울)
 function startSled(){
  const g=ctx.createGain();g.gain.value=0;g.connect(master);
  const s=noise(),bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.7;s.connect(bp).connect(g);s.start();
  sled={g,bp,speed:0,bell:0};
 }
 // ── 스케이트 활주(날이 얼음을 긁는 높은 쉬익, 늘 켜 두고 크기만)
 function startSkate(){
  const g=ctx.createGain();g.gain.value=0;g.connect(master);
  const s=noise(),hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=2600;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=4200;bp.Q.value=.9;
  s.connect(hp).connect(bp).connect(g);s.start();skate={g,bp};
 }
 function bell(at,f=1568,v=.12){for(const [m,k] of [[1,1],[2.76,.4],[5.4,.15]]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f*m;g.gain.setValueAtTime(v*k,at);g.gain.exponentialRampToValueAtTime(.0005,at+.5/m+.15);o.connect(g).connect(master);o.start(at);o.stop(at+.8);}}
 async function loadWind(){
  try{const r=await fetch(windUrl);if(!r.ok)return;const buf=await ctx.decodeAudioData(await r.arrayBuffer());const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;const g=ctx.createGain();g.gain.value=.07;s.connect(g).connect(master);s.start();wind={s,g};}catch{}
 }
 const tone=(at,f,dur,{type='sine',v=.15,to=null}={})=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,at);if(to)o.frequency.exponentialRampToValueAtTime(to,at+dur);g.gain.setValueAtTime(v,at);g.gain.exponentialRampToValueAtTime(.0005,at+dur);o.connect(g).connect(master);o.start(at);o.stop(at+dur+.05);};
 const burst=(at,dur,{f=800,q=1,v=.3,type='bandpass',to=null}={})=>{const s=ctx.createBufferSource();s.buffer=noiseBuf;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,at);if(to)fl.frequency.exponentialRampToValueAtTime(to,at+dur);fl.Q.value=q;const g=ctx.createGain();g.gain.setValueAtTime(v,at);g.gain.exponentialRampToValueAtTime(.0005,at+dur);s.connect(fl).connect(g).connect(master);s.start(at,random(),dur+.05);};
 // 한 번 나는 소리. at {x,z}면 내 자리와의 거리만큼 작게(18m 밖 안 들림)
 function play(name,{at=null,gain=1}={}){
  if(!ctx||off)return false;
  const k=gain*(at?hearGain(Math.hypot(at.x-listener.x,at.z-listener.z),18):1);if(k<=.01)return false;
  const t=ctx.currentTime+.01;stats.played++;stats.byName[name]=(stats.byName[name]??0)+1;
  switch(name){
   case 'jingle':bell(t,1568,.1*k);bell(t+.09,2093,.08*k);break;
   case 'mail':burst(t,.12,{f:300,type:'lowpass',v:.5*k});tone(t+.05,180,.15,{type:'triangle',v:.2*k,to:90});bell(t+.18,1318,.07*k);break;
   case 'open':burst(t,.5,{f:2500,q:.8,v:.25*k,to:900});bell(t+.35,1568,.1*k);bell(t+.45,1976,.09*k);bell(t+.55,2349,.08*k);break;
   case 'throw':burst(t,.22,{f:600,q:2,v:.22*k,to:2400});break;
   case 'hit':burst(t,.16,{f:500,type:'lowpass',v:.7*k});burst(t,.09,{f:2500,q:.6,v:.2*k});break;
   case 'roll':burst(t,.14,{f:1400,q:.9,v:.08*k});break;
   case 'done':[1047,1319,1568,2093].forEach((f,i)=>bell(t+i*.11,f,.09*k));break;
   case 'bank':burst(t,.35,{f:700,type:'lowpass',v:.6*k,to:200});break;
   case 'pop':tone(t,880,.12,{v:.08*k,to:1320});break;
   case 'warm':burst(t,.6,{f:3000,q:.5,v:.05*k,to:1500});break;
   // 11-17 미니게임: 카운트다운 삑·출발 뿡·부스터 휙·마지막 10초 째깍
   case 'beep':tone(t,880,.16,{type:'square',v:.06*k});break;
   case 'go':tone(t,1320,.1,{type:'square',v:.07*k});tone(t+.08,220,.32,{type:'sawtooth',v:.08*k,to:160});break;
   case 'boost':burst(t,.4,{f:900,q:1.4,v:.18*k,to:3200});break;
   // 11-19 스케이트: 밀기 「슥」(짧게 위로 긁음) · 멈춤 「샤악」(얼음 가루 날리는 긴 소리)
   case 'skate-push':burst(t,.2,{f:1800,q:1.2,v:.12*k,to:3600});break;
   case 'skate-stop':burst(t,.5,{f:5200,q:.7,v:.2*k,to:2400});burst(t,.08,{f:900,type:'lowpass',v:.12*k});break;
   case 'tick':tone(t,1800,.04,{type:'square',v:.04*k});break;
   default:stats.played--;return false;
  }
  return true;
 }
 return {
  play,stats,
  get unlocked(){return unlocked;},get muted(){return off;},
  setMuted(v){off=!!v;if(master)master.gain.setTargetAtTime(off?0:.9*vol,ctx.currentTime,.05);syncCarol();},
  // 마스터 배수(세 체험 공용 소리 크기 → volumeGain, 기본 1 = 예전 크기, 11-17)
  setVolume(v){vol=Number.isFinite(+v)?Math.max(0,+v):1;if(master)master.gain.setTargetAtTime(off?0:.9*vol,ctx.currentTime,.05);},get volume(){return vol;},
  get carolOn(){return !!carolOn;},
  setCarol(v){carolOn=!!v;syncCarol();},
  // 지금 캐럴 곡(「소리 출처」·시험용)
  carolNow(){const i=carolDeck?.index??-1,c=carols[i],cur=carolDeck?.current();return {on:!!carolOn,state:carolState,index:i,title:c?.title??null,id:c?.id??null,time:cur?+(cur.time||0).toFixed(1):null,paused:cur?cur.paused:null};},
  // 소리 크기(dBFS) — 시험용: master = 전체, carol = 캐럴 버스(마스터 앞)
  levels(){return {master:level(tapM),carol:level(tapC)};},
  get carolDeck(){return carolDeck;},
  // 매 프레임: 내 자리, 모닥불까지 거리·앉았는지, 썰매 속도(타지 않으면 0)
  update(dt,{x=0,z=0,fireDist=Infinity,sitting=false,sled:sp=0,skate:kv=0}={}){
   listener.x=x;listener.z=z;if(!ctx||off)return;
   const t=ctx.currentTime;
   if(carol){const fl=Math.min(1,hearGain(fireDist));const want=sitting?CAROL_FIRE:CAROL_LEVEL-(CAROL_LEVEL-CAROL_FIRE)*.5*fl;carol.gain.setTargetAtTime(want,t,.4);
    const c=stats.carol;c.state=carolState;c.index=carolDeck?.index??-1;c.title=carols[c.index]?.title??null;c.level=+want.toFixed(3);}
   if(fire){const lv=Math.min(1,hearGain(fireDist)*(sitting?1.25:.8));fire.level=lv;stats.fireGain=+lv.toFixed(3);fire.g.gain.setTargetAtTime(lv*.55,t,.2);
    if(lv>.02){fire.next-=dt;if(fire.next<=0){crackle(t+.01,lv);if(random()<.25)crackle(t+.05+random()*.05,lv*.7);fire.next=.05+random()*.28;}}}
   if(sled){const s=Math.min(1,sp/8);sled.g.gain.setTargetAtTime(s*.22,t,.1);sled.bp.frequency.setTargetAtTime(600+s*1600,t,.1);
    if(s>.05){sled.bell-=dt;if(sled.bell<=0){bell(t+.01,1760+random()*200,.035*s+.02);sled.bell=.16+random()*.12;}}}
   if(skate){const s=Math.min(1,kv/2.4);skate.g.gain.setTargetAtTime(s*s*.09,t,.08);skate.bp.frequency.setTargetAtTime(3400+s*1800,t,.1);stats.skateGain=+(s*s*.09).toFixed(3);}
  },
  dispose(){carolDeck?.stop();carolDeck=null;try{ctx?.close();}catch{}for(const e of ['pointerdown','keydown','touchend'])win?.removeEventListener?.(e,onInput);},
 };
}
