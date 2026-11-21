// 남산 순환버스 소리(11-21 월드개발). three 없음, 시험 tests/namsan-bus-sound.test.mjs.
// 설계 docs/남산/남산-환경음-구간별-설계-v1.md §5(월드디자인) 숫자 그대로, 모두 추정(귀 확인 전).
//  - 지나갈 때 엔진(반복): 버스 중심에서 5m −30dBFS, 거리 2배당 −6dB, 최대 −27, 60m 밖 끔, 멀수록 웅웅(로우패스), 좌우(시선 기준), 정류장 공회전, 도플러 ±3%
//  - 정차·문(한 번씩): 도착 = 브레이크 「치익」, 문 열기 시작 = 문 열림, 출발 1.5초 전 = 문 닫힘. 5m −14/−12dB 피크, 40m 밖 안 들림
//  - 탄 동안 안 소리(반복): −34dBFS 고정, 타면 0.8초·내리면 1.0초·건너뛰기 0.3초. 탄 버스의 바깥 엔진은 끔, 그 버스 문 소리는 −4dB
// 발소리와 같은 AudioContext·마스터(createHikingSound의 sound.audio)로 보내고 소리 켜기/끄기를 따른다(관악산 trail-sound.js와 같은 방식).
// 녹음 파일(public/sounds/namsan/, 설계 §6 후보)은 아직 없어서 지금은 이 파일이 만든 **합성 임시음**을 쓴다. 파일이 들어오면 BUS_SOUND.files를 채운다.
import {clamp,dbGain,audioBufferMB} from '../ambient-config.js';
export const BUS_SOUND=Object.freeze({
 ref:5,refDb:-30,maxDb:-27,cut:60,doorCut:40,lowpass:Object.freeze([8000,15,900]),idleRate:.85,idleDb:-4,doppler:.03,pan:.8,
 brakeDb:-14,doorDb:-12,insideDoorDb:-4,closeBefore:1.5,openDelay:.4,
 insideDb:-34,fadeIn:.8,fadeOut:1,fadeSkip:.3,
 fileRmsDb:Object.freeze({engine:-24,inside:-26}),oneShotPeakDb:-3,   // 파일(합성음도 같게) 기준 세기: 반복 = RMS, 한 번 = 피크
 files:null,   // 녹음 파일이 생기면 {engine:'bus-engine-loop.flac',inside:'bus-inside-loop.flac',brake:'bus-brake-hiss.mp3',open:'bus-door-open.mp3',close:'bus-door-close.mp3'}
});
export const BUS_KINDS=Object.freeze(['engine','brake','open','close','inside']);   // 소리 5가지(BUS_SOUND.files 칸 이름)
const STOPPED=leg=>leg==='start'||leg==='summit';
/** 엔진 거리 감쇠(dBFS RMS): 5m −30, 2배당 −6, 최대 −27 */
export const engineDb=(d,r=BUS_SOUND)=>Math.min(r.maxDb,r.refDb-20*Math.log10(Math.max(d,.5)/r.ref));
/** 한 번 소리 거리 감쇠(피크 dBFS): 5m 안은 base 그대로, doorCut 밖 null */
export const oneShotDb=(d,base,r=BUS_SOUND)=>d>=r.doorCut?null:base-20*Math.log10(Math.max(d,r.ref)/r.ref);
export const lowpassAt=(d,r=BUS_SOUND)=>Math.max(r.lowpass[2],r.lowpass[0]/(1+d/r.lowpass[1]));
/** 좌우: listener {x,z,fx,fz}(fx,fz = 보는 쪽, 땅 위). 오른쪽 +, ×0.8 */
export function panAt(listener,x,z,r=BUS_SOUND){const dx=x-listener.x,dz=z-listener.z,d=Math.hypot(dx,dz),f=Math.hypot(listener.fx,listener.fz);if(d<1e-6||f<1e-6)return 0;
 const rx=-listener.fz/f,rz=listener.fx/f;return clamp((dx*rx+dz*rz)/d*r.pan,-1,1);}
/** 버스 한 대 엔진 목표. bus {x,z,leg}, prev = 지난번 거리(도플러), dt 초 */
export function engineTarget(listener,bus,{prev=null,dt=0,rule=BUS_SOUND}={}){
 const d=Math.hypot(bus.x-listener.x,bus.z-listener.z),idle=STOPPED(bus.leg);
 if(d>=rule.cut)return {d,db:null,pan:0,cutoff:rule.lowpass[2],rate:1};
 const approach=prev!=null&&dt>0?(prev-d)/dt:0;
 return {d,db:engineDb(d,rule)+(idle?rule.idleDb:0),pan:panAt(listener,bus.x,bus.z,rule),cutoff:lowpassAt(d,rule),rate:(idle?rule.idleRate:1)*(1+clamp(approach/343,-rule.doppler,rule.doppler))};
}
/** 시간표 상태가 바뀔 때 한 번 소리. prev = 지난 상태(처음이면 null → 소리 없음), at = TT.bus(k,clock) {leg,doors,left} */
export function busEvents(prev,at,rule=BUS_SOUND){
 const stopped=STOPPED(at.leg),closed=stopped&&at.left<=rule.closeBefore;
 if(!prev)return {events:[],state:{leg:at.leg,doors:at.doors,closed}};
 const events=[],arrived=stopped&&prev.leg!==at.leg;
 if(arrived)events.push('brake');
 if(stopped&&at.left>rule.closeBefore&&at.doors>0&&(arrived||prev.doors===0))events.push('open');
 if(closed&&!(prev.closed&&prev.leg===at.leg))events.push('close');
 return {events,state:{leg:at.leg,doors:at.doors,closed}};
}
/** 휴대폰은 가까운 1대만 엔진을 낸다 */
export function pickEngines(targets,{mobile=false,ride=null}={}){
 const on=targets.map((t,k)=>t.db!==null&&k!==ride);
 if(mobile){let best=-1;on.forEach((v,k)=>{if(v&&(best<0||targets[k].d<targets[best].d))best=k;});return on.map((_,k)=>k===best);}
 return on;
}

// ── 합성 임시음(녹음 파일 전까지). 같은 씨앗이라 늘 같은 소리. 세기는 파일 규격(§6)과 같게 맞춘다 ──
function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const rmsOf=d=>{let e=0;for(let i=0;i<d.length;i++)e+=d[i]*d[i];return Math.sqrt(e/d.length);};
const peakOf=d=>{let p=0;for(let i=0;i<d.length;i++)p=Math.max(p,Math.abs(d[i]));return p;};
const scale=(d,k)=>{for(let i=0;i<d.length;i++)d[i]*=k;};
function normalizeRms(d,db){scale(d,dbGain(db)/(rmsOf(d)||1));const p=peakOf(d),lim=dbGain(-1);if(p>lim)scale(d,lim/p);}
function normalizePeak(d,db){scale(d,dbGain(db)/(peakOf(d)||1));}
// 반복 소리: 길이 + 겹칠 부분을 만들고 끝을 앞에 등전력으로 겹쳐 이음매를 없앤다
function loopable(n,fade,fill){const a=new Float32Array(n+fade);fill(a);const out=a.subarray(0,n);for(let i=0;i<fade;i++){const w=i/fade;out[i]=a[i]*Math.sqrt(w)+a[n+i]*Math.sqrt(1-w);}return out;}
/** 엔진: 4초, 디젤 공회전 36Hz 맥동 + 낮은 잡음 */
export function synthEngine(sr){const n=Math.round(sr*4),r=rng(7),f=36;let a=0,b=0;
 const d=loopable(n,Math.round(sr*.6),x=>{for(let i=0;i<x.length;i++){const ph=2*Math.PI*f*i/sr,pulse=(.5+.5*Math.cos(ph))**6,w=r()*2-1;a+=(w-a)*.08;b+=(a-b)*.25;
  x[i]=.5*(.6*Math.sin(ph)+.35*Math.sin(2*ph+.4)+.25*Math.sin(3*ph+1.1)+.12*Math.sin(5*ph+.3))+b*3*(.4+pulse)+w*.04*pulse;}});
 normalizeRms(d,BUS_SOUND.fileRmsDb.engine);return d;}
/** 버스 안: 6초, 낮은 엔진 웅웅 + 바퀴·차체 잡음 */
export function synthInside(sr){const n=Math.round(sr*6),r=rng(11),f=30;let a=0,b=0,c=0;
 const d=loopable(n,Math.round(sr*1),x=>{for(let i=0;i<x.length;i++){const ph=2*Math.PI*f*i/sr,w=r()*2-1;a+=(w-a)*.02;b+=(a-b)*.1;c+=(w-c)*.25;
  x[i]=.25*(Math.sin(ph)+.5*Math.sin(2*ph+.7)+.15*Math.sin(4*ph))+b*6+(c-b)*.15;}});
 normalizeRms(d,BUS_SOUND.fileRmsDb.inside);return d;}
/** 한 번 소리: brake(1.2초 공기 빠지는 치익) · open/close(1.4초 치익 + 미닫이 + 닫힐 때 쿵) */
export function synthOneShot(kind,sr){const len=kind==='brake'?1.2:1.4,n=Math.round(sr*len),d=new Float32Array(n),r=rng(kind==='brake'?3:kind==='open'?5:9);let lp=0,lo=0,prev=0;
 const thunkAt=kind==='open'?1.15:kind==='close'?1.0:null;
 for(let i=0;i<n;i++){const t=i/sr,w=r()*2-1,hi=w-prev;prev=w;lp+=(hi-lp)*.5;lo+=(w-lo)*.01;
  let v=0;
  if(kind==='brake')v=lp*Math.min(1,t/.03)*Math.exp(-t/.45);
  else{v=lp*.8*Math.exp(-t/.09)+lo*3*(t>.15&&t<thunkAt?Math.sin(Math.PI*(t-.15)/(thunkAt-.15)):0);
   if(t>=thunkAt){const u=t-thunkAt;v+=(kind==='close'?1:.6)*(Math.sin(2*Math.PI*90*u)*Math.exp(-u/.06)+w*.5*Math.exp(-u/.01));}}
  d[i]=v*Math.min(1,(n-i)/(sr*.02));}
 normalizePeak(d,BUS_SOUND.oneShotPeakDb);return d;}

/** 소리 재생기. context()·destination()·enabled()는 createHikingSound의 sound.audio에서(같은 AudioContext·마스터·켜기/끄기) */
export function createBusSound({context,destination,enabled,mobile=false,base='',rule=BUS_SOUND}={}){
 let c=null,out=null,buffers={},source='synth',warming=false;const engines=new Map(),prevState=[],prevDist=[],counts={brake:0,open:0,close:0},recent=[];
 let inside=null,insideOn=false,skipNext=false,live=false,last={buses:[],ride:null};
 const pending=new Set(),fromFile=new Set();   // 녹음 파일을 받는 중인 소리(받는 동안은 합성하지 않는다)·파일로 받은 소리
 const ramp=(p,v,s)=>{p.cancelScheduledValues(c.currentTime);p.setTargetAtTime(v,c.currentTime,Math.max(.003,s/3));};
 function buffer(data){const b=c.createBuffer(1,data.length,c.sampleRate);b.getChannelData(0).set(data);return b;}
 // 녹음 파일: 받은 것만 하나씩 합친다(일부만 적거나 일부가 실패해도 나머지는 합성음으로, 11-21 검토 4)
 async function loadFiles(){const list=Object.entries(rule.files);list.forEach(([k])=>pending.add(k));
  await Promise.all(list.map(async([k,f])=>{try{const res=await fetch(base+f);if(!res.ok)throw new Error(f+' HTTP '+res.status);buffers[k]=await c.decodeAudioData(await res.arrayBuffer());fromFile.add(k);}
   catch(e){console.warn('[버스 소리] 파일 대신 합성음',e.message);}finally{pending.delete(k);}}));
  if(fromFile.size)source=BUS_KINDS.every(k=>fromFile.has(k))?'files':'mixed';}
 // 합성 임시음은 처음 켤 때 한꺼번에 만들지 않는다(휴대폰 끊김, 11-21 검토 5): 버스가 가까워지거나(cut×1.5 안) 타면
 // 그때부터 한 프레임에 하나씩, 파일을 받는 중인 소리는 건너뛴다. 준비 전 몇 프레임은 그 소리를 안 낸다(60m 밖은 −52dB 아래라 티 안 남)
 const SYNTH={engine:sr=>synthEngine(sr),inside:sr=>synthInside(sr),brake:sr=>synthOneShot('brake',sr),open:sr=>synthOneShot('open',sr),close:sr=>synthOneShot('close',sr)};
 function warmOne(ride){const order=ride!=null?['inside',...BUS_KINDS.filter(k=>k!=='inside')]:BUS_KINDS;
  const k=order.find(k=>!buffers[k]&&!pending.has(k));if(k)buffers[k]=buffer(SYNTH[k](c.sampleRate));}
 function ensure(){
  if(out)return true;const ctx=context?.(),dest=destination?.();if(!ctx||!dest)return false;c=ctx;
  out=c.createGain();out.gain.value=0;out.connect(dest);
  if(rule.files)void loadFiles();
  return true;}
 function voice(buf,{loop=false,gain=0,pan=0,cutoff=20000,rate=1,at=0}={}){
  const s=c.createBufferSource(),g=c.createGain(),low=c.createBiquadFilter(),p=c.createStereoPanner();s.buffer=buf;s.loop=loop;s.playbackRate.value=rate;g.gain.value=gain;low.type='lowpass';low.frequency.value=cutoff;p.pan.value=pan;
  s.connect(low).connect(g).connect(p).connect(out);const v={s,g,low,p};s.onended=()=>{s.disconnect();g.disconnect();low.disconnect();p.disconnect();};s.start(c.currentTime+at,loop?(at?0:Math.random()*buf.duration):0);return v;}
 const stopVoice=(v,after=.3)=>{if(!v)return;ramp(v.g.gain,0,after);try{v.s.stop(c.currentTime+after+.2);}catch{}};
 function stopAll(){for(const v of engines.values())stopVoice(v,.15);engines.clear();stopVoice(inside,.15);inside=null;insideOn=false;}
 function play(kind,peakDb,{pan=0,cutoff=20000}={}){if(peakDb===null||!buffers[kind])return;counts[kind]++;recent.push({kind,db:+peakDb.toFixed(1),at:+c.currentTime.toFixed(2)});if(recent.length>8)recent.shift();
  voice(buffers[kind],{gain:dbGain(peakDb-rule.oneShotPeakDb),pan,cutoff,at:kind==='open'?rule.openDelay:0});}
 /** 끄기·숨김: 소리를 내리고 상태를 비운다(돌아오면 문 소리를 몰아서 내지 않고, 도플러도 옛 거리를 안 쓴다) */
 function pause(){if(live){ramp(out.gain,0,.25);stopAll();live=false;}prevState.length=0;prevDist.length=0;skipNext=false;}   // 건너뛰기 표시도 남기지 않음(11-21 검토 3)
 /** 매 프레임. listener {x,z,fx,fz} · buses [{k,x,z,leg,doors,left}] · ride = 탄 버스 번호|null · paused = 출발 전 */
 function update({listener,buses=[],ride=null,dt=0,paused=false}={}){
  const on=!!enabled?.()&&!paused&&!globalThis.document?.hidden;
  if(!on){pause();return;}   // 꺼져 있으면 합성음도 만들지 않는다(켠 뒤 버스가 가까워질 때 warmOne)
  if(!ensure())return;
  if(!live||c.state!=='running'){if(c.state!=='running')return;ramp(out.gain,1,.5);live=true;}
  const targets=buses.map((b,k)=>engineTarget(listener,b,{prev:prevDist[k]??null,dt,rule}));
  targets.forEach((t,k)=>{prevDist[k]=t.d;});
  if(!warming&&(ride!=null||targets.some(t=>t.d<rule.cut*1.5)))warming=true;
  if(warming)warmOne(ride);
  const play_=pickEngines(targets,{mobile,ride});
  targets.forEach((t,k)=>{let v=engines.get(k);
   if(play_[k]&&buffers.engine){const gain=dbGain(t.db-rule.fileRmsDb.engine);if(!v){v=voice(buffers.engine,{loop:true,gain:0,pan:t.pan,cutoff:t.cutoff,rate:t.rate});engines.set(k,v);}
    ramp(v.g.gain,gain,.25);ramp(v.p.pan,t.pan,.15);ramp(v.low.frequency,t.cutoff,.25);ramp(v.s.playbackRate,t.rate,.4);}
   else if(v){stopVoice(v,ride===k?.4:.6);engines.delete(k);}});
  // 정차·문
  buses.forEach((b,k)=>{const {events,state}=busEvents(prevState[k]??null,b,rule);prevState[k]=state;
   for(const kind of events){const base=kind==='brake'?rule.brakeDb:rule.doorDb;
    if(ride===k)play(kind,base+rule.insideDoorDb);else{const t=targets[k];play(kind,oneShotDb(t.d,base,rule),{pan:t.pan,cutoff:t.cutoff});}}});
  // 버스 안
  const want=ride!==null&&ride!==undefined;
  if(want&&!insideOn&&buffers.inside){inside=voice(buffers.inside,{loop:true,gain:0});ramp(inside.g.gain,dbGain(rule.insideDb-rule.fileRmsDb.inside),rule.fadeIn);insideOn=true;}
  else if(!want&&insideOn){stopVoice(inside,skipNext?rule.fadeSkip:rule.fadeOut);inside=null;insideOn=false;}
  if(!want)skipNext=false;   // 안 소리가 없던 채로 내려도 표시가 다음 탈 때까지 남지 않게(11-21 검토 3)
  last={buses:targets.map((t,k)=>({k,d:+t.d.toFixed(1),db:t.db===null?null:+t.db.toFixed(1),pan:+t.pan.toFixed(2),rate:+t.rate.toFixed(3),playing:engines.has(k)})),ride};
 }
 return {update,pause,
  /** 「건너뛰기」로 내릴 때 안 소리를 0.3초에 끈다(다음 update에서) */
  skip(){skipNext=true;},
  snapshot:()=>({ready:!!out,live,source,mobile,warming,loaded:Object.keys(buffers),bufferMB:audioBufferMB(Object.values(buffers)),buses:last.buses,ride:last.ride,inside:{on:insideOn,db:insideOn?rule.insideDb:null},events:{...counts},recent:[...recent]})};
}
