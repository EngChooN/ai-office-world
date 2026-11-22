import * as GWANAK_AMBIENT from './ambient-config.js';
import {clamp,dbGain,powerDb,audioBufferMB} from './ambient-config.js';
import {RainLayer} from './weather-sound.js';
// 산별 환경음 설정(11-21 남산 소리): 구간 표·층 파일·간헐음은 설정 하나에서 온다. 안 주면 관악산(ambient-config.js) 그대로.
// 설정 = ambient-config.js와 같은 이름(LAYER_FILES·FILE_RMS_DB·INTERMITTENT·CROSSFADE_S·DUCK·ambientTargets·crossfade) + 아래 갈래(없으면 관악산 규칙).
//  preload(section) 미리 받을 파일 · birdPhase(section) 'low'|'upper'|null · crossfadeFor(next,prev,jump) 초 · tone(name,next) 로우패스 Hz|null · muffle 버스 안 먹먹하게(남산)
// 까마귀·목탁은 INTERMITTENT.crow·moktak이 있을 때만(남산 설정엔 없음).
export const GWANAK_AMBIENT_CONFIG=Object.freeze({...GWANAK_AMBIENT,
 preload:section=>section>=5?['wind-ridge-loop.flac',...(GWANAK_AMBIENT.CROWD_ENABLED?['summit-crowd-loop.flac']:[]),'moktak-01.flac','moktak-02.flac','moktak-03.flac']:[],
 birdPhase:section=>section<=5?(section>=4?'upper':'low'):null,
 crossfadeFor:(next,prev,jump)=>jump?GWANAK_AMBIENT.CROSSFADE_S.jump:next===2||prev===2?GWANAK_AMBIENT.CROSSFADE_S.city:next>=6?GWANAK_AMBIENT.CROSSFADE_S.upper:GWANAK_AMBIENT.CROSSFADE_S.forest,
 tone:(name,next)=>name==='stream'?Math.max(1200,9000/(1+next.distance/20)):name==='ridge'?1200+2300*next.exposure:null,
 muffle:false});
export class AmbientAudio{
 constructor({base,context=null,destination=null,enabled=true,volume=.7,random=Math.random,onChange=()=>{},config=GWANAK_AMBIENT_CONFIG}={}){
  Object.assign(this,{base,context,destination,enabled,random,onChange,config});this.volume=clamp(volume);this.buffers=new Map();this.pending=new Map();this.layers=new Map();this.active=new Set();this.errors=[];this.dropped=0;this.time=0;this.tick=0;this.paused=true;this.birdOn=false;this.birdAt=0;this.crowAt=0;this.moktakAt=0;this.hits=0;this.hitIndex=0;this.lastCrow=-1;this.model=null;this.transition=null;this.actual={};this.measuredRmsDb=-Infinity;this.footstepPeakDb=null;this.warned=new Set();this.muffled=false;if(context&&destination)this.attach(context,destination);
 }
 range(pair){return pair[0]+this.random()*(pair[1]-pair[0]);}
 attach(context,destination){if(this.bus)return;this.context=context;this.destination=destination;this.bus=context.createGain();this.bus.gain.value=0;this.duck=context.createGain();this.high=context.createBiquadFilter();this.high.type='highpass';this.high.frequency.value=60;this.analyser=context.createAnalyser();this.analyser.fftSize=1024;this.samples=new Float32Array(1024);
  // 버스 안 먹먹함(남산 설정만): 환경음 버스 뒤에 음량·로우패스를 하나 더 둔다. 관악산은 노드를 만들지 않아 소리 길이 전과 같다
  if(this.config.muffle){this.muffleGain=context.createGain();this.muffleLow=context.createBiquadFilter();this.muffleLow.type='lowpass';this.muffleLow.frequency.value=20000;this.bus.connect(this.muffleGain).connect(this.muffleLow).connect(this.duck);}else this.bus.connect(this.duck);
  this.duck.connect(this.high).connect(this.analyser).connect(destination);try{this.rain=new RainLayer(context,this.bus);}catch(e){this.rain=null;}if(this.muffled)this.setMuffle(true,0);if(this.enabled&&!this.paused)this.ramp(this.bus.gain,1,.5);} // 게임이 이미 진행 중에 소리를 처음 켜면(산 고르기를 건너뛴 주소) 버스가 0에 머물던 문제
 async load(file){if(this.buffers.has(file))return this.buffers.get(file);if(this.pending.has(file))return this.pending.get(file);const request=(async()=>{try{const r=await fetch(this.base+file);if(!r.ok)throw new Error('HTTP '+r.status);const buffer=await this.context.decodeAudioData(await r.arrayBuffer());this.buffers.set(file,buffer);return buffer;}catch(e){const error=file+': '+e.message;this.errors.push(error);console.error('[환경음]',error);return null;}})();this.pending.set(file,request);return request;}
 ramp(param,value,seconds){const c=this.context;param.cancelScheduledValues(c.currentTime);param.setTargetAtTime(value,c.currentTime,Math.max(.003,seconds/3));}
 stopSources(delay=.15){if(!this.context)return;this.ramp(this.bus.gain,0,delay);for(const voice of this.active){try{voice.source.stop(this.context.currentTime+delay);}catch{}}this.layers.clear();}
 setEnabled(v){this.enabled=!!v;if(!v)this.stopSources();else if(this.bus)this.ramp(this.bus.gain,this.paused?0:1,.5);}
 // 사용자 볼륨은 공유 마스터에서 한 번만 곱한다.
 setVolume(v){this.volume=clamp(v);}
 setPaused(v){v=!!v;if(v===this.paused)return;this.paused=v;if(v)this.stopSources(.25);else if(this.bus)this.ramp(this.bus.gain,this.enabled?1:0,.5);}
 // 버스 안(남산): 창문 너머처럼 환경음을 줄이고 먹먹하게. seconds = 바뀌는 시간
 setMuffle(on,seconds=.8){this.muffled=!!on;const m=this.config.muffle;if(!m||!this.muffleGain)return;this.ramp(this.muffleGain.gain,on?dbGain(m.db):1,seconds);this.ramp(this.muffleLow.frequency,on?m.lowpassHz:20000,seconds);}
 makeVoice(file,{loop=false,db=0,pan=0,rate=1,cutoff=9000,forest=false}={}){
  const buffer=this.buffers.get(file);if(!buffer||!this.enabled||this.paused)return null;
  const c=this.context,source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner(),low=c.createBiquadFilter(),shelf=c.createBiquadFilter();source.buffer=buffer;source.loop=loop;source.playbackRate.value=rate;gain.gain.value=loop?0:dbGain(db);panner.pan.value=pan;low.type='lowpass';low.frequency.value=cutoff;shelf.type='lowshelf';shelf.frequency.value=200;shelf.gain.value=forest?-3:0;source.connect(low).connect(shelf).connect(gain).connect(panner).connect(this.bus);
  const voice={source,gain,low};this.active.add(voice);source.onended=()=>{this.active.delete(voice);source.disconnect();gain.disconnect();panner.disconnect();low.disconnect();shelf.disconnect();};source.start(0,loop?this.random()*buffer.duration:0);return voice;
 }
 oneShot(file,peakDb,options={}){if(this.active.size>=12){this.dropped++;return;}if(!this.makeVoice(file,{...options,db:peakDb-(file.startsWith('crow')?-3:-6)}))this.dropped++;}
 onStep(record){if(!record||!this.context)return;this.footstepPeakDb=record.normalizedPeakDb;const {DUCK}=this.config; if(this.model?.sumRmsDb>DUCK.minSumDb&&this.enabled&&!this.paused){const p=this.duck.gain,c=this.context;p.cancelScheduledValues(c.currentTime);p.setValueAtTime(p.value,c.currentTime);p.linearRampToValueAtTime(dbGain(DUCK.db),c.currentTime+DUCK.attackS);p.setTargetAtTime(1,c.currentTime+DUCK.attackS,DUCK.releaseS/3);}}
 // place = 산 설정 ambientTargets에 그대로 넘기는 값(남산: night·summitDist). 관악산은 쓰지 않는다
 update({referenceMetres=0,elevation=100,paused=false,dt=0,jump=false,place={}}={}){
  this.setPaused(paused||!!globalThis.document?.hidden);if(!this.bus||!this.enabled||this.paused||this.context.state!=='running')return;
  this.time+=Math.max(0,dt);this.tick+=Math.max(0,dt);if(this.tick<.25)return;const elapsed=this.tick;this.tick=0;
  const C=this.config,{LAYER_FILES,FILE_RMS_DB,INTERMITTENT}=C;
  const m=referenceMetres,h=elevation; jump=jump||(this.previousM!==undefined&&Math.abs(m-this.previousM)>30);this.previousM=m;
  const section=C.ambientTargets(m,h,place).section;
  for(const file of C.preload(section))void this.load(file);
  const phase=C.birdPhase(section);
  if(phase&&this.time>=this.birdAt){this.birdOn=!this.birdOn;const upper=phase==='upper';this.birdAt=this.time+this.range(INTERMITTENT.birds[this.birdOn?(upper?'upperOn':'on'):(upper?'upperOff':'off')]);}
  if(this.gustEnd===undefined){this.gustStart=this.time;this.gustEnd=this.time+this.range([7,14]);}
  if(this.time>=this.gustEnd){this.gustStart=this.time;this.gustEnd=this.time+this.range([7,14]);}
  const next=C.ambientTargets(m,h,{...place,birds:this.birdOn,gust:Math.sin((this.time-this.gustStart)/(this.gustEnd-this.gustStart)*2*Math.PI)*2.5});
  if(next.correction<0&&!this.warned.has(section)){console.warn('[환경음] 합계 예산 보정',section,next.correction);this.warned.add(section);}
  if(!this.model||next.section!==this.model.section||jump){const from=Object.fromEntries(Object.keys(LAYER_FILES).map(k=>[k,this.actual[k]>0?20*Math.log10(this.actual[k]):null]));this.transition={from,age:0,duration:C.crossfadeFor(next.section,this.model?.section,jump)};if(this.model?.section!==next.section&&globalThis.window)window.dispatchEvent(new CustomEvent('hiking:section',{detail:{from:this.model?.section??null,to:next.section,referenceMetres:m,jump}}));}
  this.model=next;
  if(this.transition){this.transition.age+=elapsed;this.actual=C.crossfade(this.transition.from,next.targets,this.transition.age/this.transition.duration);if(this.transition.age>=this.transition.duration)this.transition=null;}else this.actual=Object.fromEntries(Object.entries(next.targets).map(([k,v])=>[k,dbGain(v)]));
  // 경계에서 낮은 쪽 예산으로 돌아갈 때도 현재 전력합을 제한한다.
  const sum=powerDb(Object.values(this.actual).map(g=>g>0?20*Math.log10(g):null)),cap=dbGain(Math.min(0,next.budgetDb-sum));
  for(const [name,file]of Object.entries(LAYER_FILES)){
   const gain=this.actual[name]*cap;this.actual[name]=gain;let voice=this.layers.get(name);
   if(gain>0&&!voice){void this.load(file);if(this.buffers.has(file)){voice=this.makeVoice(file,{loop:true,pan:name==='stream'?-.2:0,forest:name==='forest'});if(voice)this.layers.set(name,voice);}}
   if(voice){this.ramp(voice.gain.gain,gain/dbGain(FILE_RMS_DB[name]),name==='birds'?1.5:.75);const tone=C.tone(name,next);if(tone!==null)this.ramp(voice.low.frequency,tone,.75);if(gain===0){try{voice.source.stop(this.context.currentTime+1.5);}catch{}this.layers.delete(name);}}
  }
  if(INTERMITTENT.crow&&section>=4){for(const f of ['crow-01.flac','crow-02.flac'])void this.load(f);if(this.time>=this.crowAt){this.lastCrow=1-this.lastCrow;if(this.lastCrow>1)this.lastCrow=0;this.oneShot(`crow-0${this.lastCrow+1}.flac`,-30,{rate:this.range([.94,1.06]),pan:this.range([-.6,.6]),cutoff:5000});this.crowAt=this.time+this.range(section<=5?INTERMITTENT.crow.low:INTERMITTENT.crow.high);}}
  const mk=INTERMITTENT.moktak,distance=mk?Math.abs(m-mk.origin):Infinity;
  if(mk&&m>=4800&&distance<=60){for(let i=1;i<=3;i++)void this.load(`moktak-0${i}.flac`);if(this.time>=this.moktakAt){if(!this.hits){this.hits=Math.floor(this.range([8,13]));this.burstCount=this.hits;}this.oneShot(`moktak-0${this.hitIndex%3+1}.flac`,(section===7?-30:-34)-20*Math.log10(Math.max(20,distance)/20),{rate:this.range([.97,1.03])});this.hitIndex++;this.hits--;const phase=(this.burstCount-this.hits-1)/Math.max(1,this.burstCount-2),interval=1+.1*Math.cos(2*Math.PI*phase);this.moktakAt=this.time+(this.hits?interval:this.range(mk.rest));}}else this.hits=0;
  this.analyser.getFloatTimeDomainData(this.samples);let energy=0;for(const v of this.samples)energy+=v*v;this.measuredRmsDb=energy?10*Math.log10(energy/this.samples.length):-Infinity;
 }
 snapshot(){const sumRmsDb=powerDb(Object.values(this.actual).map(g=>g>0?20*Math.log10(g):null));return {section:this.model?.section??null,layers:Object.fromEntries(Object.entries(this.config.LAYER_FILES).map(([name])=>[name,{gainDb:this.layers.has(name)?20*Math.log10(this.layers.get(name).gain.gain.value):-Infinity,targetDb:this.model?.targets[name]??null,playing:this.enabled&&!this.paused&&this.layers.has(name)}])),sumRmsDb:this.enabled&&!this.paused?sumRmsDb:-Infinity,measuredRmsDb:this.measuredRmsDb,budgetDb:this.model?.budgetDb??-37,footstepPeakMinusAmbientDb:this.footstepPeakDb===null||!Number.isFinite(this.measuredRmsDb)?null:this.footstepPeakDb+40*Math.log10(this.volume)-this.measuredRmsDb,muffled:this.muffled,decoded:this.buffers.size,bufferMB:audioBufferMB(this.buffers.values()),active:this.active.size,dropped:this.dropped,errors:[...this.errors]};}
}
