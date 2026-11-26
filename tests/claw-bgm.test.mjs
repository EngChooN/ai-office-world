import test from 'node:test';
import assert from 'node:assert/strict';
import {BGM_MOODS,BGM_LEVEL,NOTE_GAIN_MAX,VOICES,DEFAULT_MOOD,noteFreq,scheduleBar,barSeconds,loopSeq,loopSeconds,renderBars,createClawBgm} from '../src/claw/claw-bgm.js';

const inScale=(p,m)=>p.scale.includes(((m-p.key)%12+12)%12);
const BPM={arcade:[140,150],pop:[124,128],retro:[132,138]};
test('분위기 3가지·기본 arcade·템포·이름·루프 구성',()=>{
 assert.deepEqual(Object.keys(BGM_MOODS).sort(),['arcade','pop','retro']);
 assert.equal(DEFAULT_MOOD,'arcade');
 assert.deepEqual(Object.fromEntries(Object.entries(BGM_MOODS).map(([k,p])=>[k,p.label])),{arcade:'신나는 오락실',pop:'경쾌한 팝',retro:'레트로 게임'});
 for(const [k,p] of Object.entries(BGM_MOODS)){
  assert.equal(p.name,k);assert.ok(p.bpm>=120&&p.bpm>=BPM[k][0]&&p.bpm<=BPM[k][1],`${k} ${p.bpm}`);
  assert.equal(p.sections.A.length,8);assert.equal(p.sections.B.length,8);assert.equal(p.sections.C.length,4);
  for(const o of p.order){assert.ok(p.sections[o[0]],o);assert.ok(['','^','~'].includes(o.slice(1)),o);}
  assert.ok(new Set(p.order).size>=4,'변주 포함 구간 4종 이상');assert.ok(p.order.some(o=>o.endsWith('^'))&&p.order.some(o=>o.endsWith('~')));
  const n=loopSeq(p).length;assert.equal(n,p.order.reduce((s,o)=>s+p.sections[o[0]].length,0));
  assert.ok(Math.abs(loopSeconds(k)-n*barSeconds(p))<1e-9);assert.ok(loopSeconds(k)>=50&&loopSeconds(k)<=120,`${k} ${loopSeconds(k)}`);
 }
 assert.equal(loopSeconds('nope'),0);
 assert.ok(BGM_LEVEL>=.06&&BGM_LEVEL<=.12);
 assert.equal(noteFreq(69),440);assert.ok(Math.abs(noteFreq(60)-261.6256)<1e-3);
});
test('scheduleBar: 음계 안(드럼 제외)·마디 안·gain 상한·시간순·순서 반영',()=>{
 for(const p of Object.values(BGM_MOODS)){const L=barSeconds(p),n=loopSeq(p).length;
  for(let b=0;b<n;b++){const ns=scheduleBar(p,b);assert.ok(ns.length>0);
   for(const x of ns){assert.ok(x.t>=0&&x.t<L,`${p.name} t`);assert.ok(x.dur>0&&x.t+x.dur<=L+1e-9);assert.ok(x.gain>0&&x.gain<=NOTE_GAIN_MAX);assert.ok(VOICES[x.voice],x.voice);
    if(x.midi!=null){assert.ok(inScale(p,x.midi),`${p.name} bar${b} ${x.voice} ${x.midi}`);assert.ok(!VOICES[x.voice].drum);}else assert.ok(VOICES[x.voice].drum);
    if(['lead','saw','harm','arp','stab'].includes(x.voice))assert.ok(x.midi<=p.leadMax,`${p.name} 리드 너무 높음 ${x.midi}`); // 코인·성공음 대역을 덜 가리게
   }
   for(let i=1;i<ns.length;i++)assert.ok(ns[i].t>=ns[i-1].t);}
  assert.deepEqual(scheduleBar(p,n),scheduleBar(p,0));assert.deepEqual(scheduleBar(p,-1),scheduleBar(p,n-1)); // 한 바퀴 반복
  // 변주: '^' 구간 첫 마디는 원래 구간보다 리드가 높고, '~' 구간은 음표가 더 많음
  const start=o=>{let i=0;for(const q of p.order){if(q===o)return i;i+=p.sections[q[0]].length;}return -1;};
  const leadV=p.name==='pop'?'saw':'lead',lead=b=>scheduleBar(p,b).filter(x=>x.voice===leadV),base=o=>start(o[0]);
  const up=p.order.find(o=>o.endsWith('^')),rh=p.order.find(o=>o.endsWith('~'));
  assert.ok(Math.max(...lead(start(up)).map(x=>x.midi))>Math.max(...lead(base(up)).map(x=>x.midi)),`${p.name} 옥타브 올림`);
  assert.ok(lead(start(rh)).length>lead(base(rh)).length,`${p.name} 리듬 변형`);
 }
});
// 동시에 울리는 소리(여운 포함) 최대 수 — 휴대폰 CPU
const maxPoly=p=>{let mx=0;const ev=[],n=loopSeq(p).length;for(let b=0;b<n+1;b++)for(const x of scheduleBar(p,b)){const s=b*barSeconds(p)+x.t;ev.push([s,1],[s+x.dur+VOICES[x.voice].r+.02,-1]);}
 ev.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let c=0;for(const [,d] of ev){c+=d;mx=Math.max(mx,c);}return mx;};
test('동시 소리 수가 적음(분위기마다 14개 이하)',()=>{for(const p of Object.values(BGM_MOODS)){const m=maxPoly(p);console.log(`  동시 소리 최대 ${p.name}: ${m}`);assert.ok(m<=14,`${p.name} ${m}`);}});

function fakeCtx({periodic=false}={}){
 const param=v=>({value:v,cancelScheduledValues(){},setValueAtTime(x){this.value=x;},linearRampToValueAtTime(x){this.value=x;},exponentialRampToValueAtTime(){},setTargetAtTime(x){this.value=x;}});
 const base=()=>({connect(n){return n;},disconnect(){this.off=true;}});
 const c={currentTime:0,state:'running',sampleRate:8000,sources:[],buffers:0,filters:0,waves:0,destination:base(),
  createGain(){return {...base(),gain:param(1)};},
  createBiquadFilter(){c.filters++;return {...base(),type:'',frequency:param(350),Q:param(1)};},
  createBuffer(ch,n){c.buffers++;const d=new Float32Array(n);return {getChannelData:()=>d};},
  createOscillator(){const s={...base(),type:'sine',frequency:param(440),starts:[],stops:[],start(t){this.starts.push(t);},stop(t){this.stops.push(t);},setPeriodicWave(w){this.type='custom';this.wave=w;}};c.sources.push(s);return s;},
  createBufferSource(){const s={...base(),buffer:null,starts:[],stops:[],start(t){this.starts.push(t);},stop(t){this.stops.push(t);}};c.sources.push(s);return s;}};
 if(periodic)c.createPeriodicWave=(re,im)=>{c.waves++;return {re,im};};
 return c;
}
function fakeTimers(){const t={fn:null,id:null,cleared:[],set(fn,ms){t.fn=fn;t.ms=ms;return t.id=7;},clear(id){t.cleared.push(id);t.fn=null;},later:[],setT(fn){t.later.push(fn);}};return t;}
const run=(c,tm,sec)=>{for(let i=0;i<sec*10;i++){c.currentTime+=.1;tm.fn?.();}};

test('start → 시간 진행 → stop: 모든 소리 정리·타이머 해제·필터/노이즈 한 번',()=>{
 for(const mood of Object.keys(BGM_MOODS)){
  const c=fakeCtx({periodic:true}),tm=fakeTimers(),bgm=createClawBgm({ctx:c,dest:c.destination,mood,setI:tm.set,clearI:tm.clear,setT:tm.setT});
  bgm.start();assert.equal(bgm.playing,true);assert.equal(bgm.mood,mood);assert.equal(tm.ms,100);
  run(c,tm,12);assert.ok(c.sources.length>50,mood);
  for(const s of c.sources)assert.ok(s.starts[0]<c.currentTime+.31); // 예약은 미리보기(.3s) 안쪽만
  assert.equal(c.buffers,1,'노이즈 버퍼 한 번');assert.equal(c.filters,3,'필터는 시작할 때 3개만');assert.ok(c.waves<=1,'펄스 파형 한 번');
  if(mood!=='pop')assert.ok(c.sources.some(s=>s.type==='custom'),'펄스 리드');
  const t=c.currentTime;bgm.stop();assert.equal(bgm.playing,false);assert.deepEqual(tm.cleared,[7]);
  for(const s of c.sources){assert.ok(s.stops.length>0);assert.ok(Math.min(...s.stops)<=t+.45,`${mood} stop ${Math.min(...s.stops)} > ${t}`);}
  const n=c.sources.length;run(c,tm,3);assert.equal(c.sources.length,n); // 멈춘 뒤 새 소리 없음
  tm.later.forEach(f=>f());
  bgm.stop();bgm.start();assert.equal(bgm.playing,true);bgm.stop(); // 다시 켜고 끄기
 }
});
test('suspended면 예약만 건너뜀·풀리면 이어 감',()=>{
 const c=fakeCtx(),tm=fakeTimers();c.state='suspended';const bgm=createClawBgm({ctx:c,setI:tm.set,clearI:tm.clear,setT:tm.setT});
 bgm.start();run(c,tm,0);for(let i=0;i<20;i++)tm.fn();assert.equal(c.sources.length,0);
 c.currentTime=50;c.state='running';run(c,tm,3);assert.ok(c.sources.length>0);
 for(const s of c.sources)assert.ok(s.starts[0]>=50-.011);
 assert.ok(c.sources.some(s=>s.type==='square'),'펄스 파형 없으면 네모파로');
 bgm.stop();
});
test('기본 arcade·옛 이름은 기본으로·setMood는 다음 마디부터·setLevel·ctx 없음',()=>{
 const c=fakeCtx(),tm=fakeTimers(),bgm=createClawBgm({ctx:c,setI:tm.set,clearI:tm.clear,setT:tm.setT});
 assert.equal(bgm.mood,'arcade');bgm.setMood('nope');assert.equal(bgm.mood,'arcade');
 assert.equal(createClawBgm({ctx:c,mood:'cozy'}).mood,'arcade'); // claw-audio.js 옛 기본값
 bgm.start();run(c,tm,1);const L=barSeconds(BGM_MOODS.arcade);bgm.setMood('pop');assert.equal(bgm.mood,'pop');
 const before=c.sources.length;run(c,tm,L*2);
 const fresh=c.sources.slice(before),firstSaw=fresh.find(s=>s.type==='sawtooth');assert.ok(firstSaw);
 assert.ok(firstSaw.starts[0]>=.1+L-1e-6,'마디 경계 이후'); // 첫 마디는 .1s에 시작
 assert.ok(c.sources.slice(0,before).every(s=>s.type!=='sawtooth'),'바꾸기 전엔 arcade만');
 bgm.setLevel(.05);bgm.stop();
 const none=createClawBgm({});none.start();none.stop();assert.equal(none.playing,false);
});
test('renderBars: 타이머 없이 지정 마디를 한 번에 예약',()=>{
 const g=globalThis,saved={si:g.setInterval,st:g.setTimeout};let used=0;g.setInterval=g.setTimeout=()=>{used++;return 0;};
 try{
  for(const mood of Object.keys(BGM_MOODS)){
   const p=BGM_MOODS[mood],L=barSeconds(p),c=fakeCtx({periodic:true}),dest={connect(){},disconnect(){}};
   const r=renderBars(c,dest,mood,{bars:4,t0:2,startBar:6});
   let want=0;for(let i=0;i<4;i++)want+=scheduleBar(p,6+i).length;
   assert.equal(r.notes,want);assert.equal(c.sources.length,want);assert.equal(r.mood,mood);
   assert.equal(r.start,2);assert.ok(Math.abs(r.end-(2+4*L))<1e-9);
   for(const s of c.sources){assert.ok(s.starts[0]>=2-1e-9&&s.starts[0]<2+4*L);assert.ok(s.stops.length===1);}
   assert.equal(c.filters,3);assert.ok(c.buffers<=1);
   // 같은 음표 만들기: 첫 마디 시작 시각들이 scheduleBar와 같음
   const st=c.sources.map(s=>+s.starts[0].toFixed(6)),exp=scheduleBar(p,6).map(n=>+(2+n.t).toFixed(6));
   assert.deepEqual(st.slice(0,exp.length),exp);
  }
  const d=renderBars(fakeCtx(),null,'nope');assert.equal(d.mood,'arcade');assert.equal(d.notes,Array.from({length:16},(_,i)=>scheduleBar(BGM_MOODS.arcade,i).length).reduce((a,b)=>a+b));
 }finally{g.setInterval=saved.si;g.setTimeout=saved.st;}
 assert.equal(used,0,'타이머 안 씀');
});
