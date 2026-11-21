// 남산 순환버스 소리(11-21). 설계 docs/남산/남산-환경음-구간별-설계-v1.md §5·§8-2
import test from 'node:test';
import assert from 'node:assert/strict';
import {BUS_SOUND,engineDb,oneShotDb,lowpassAt,panAt,engineTarget,busEvents,pickEngines,synthEngine,synthInside,synthOneShot,createBusSound} from '../src/namsan/namsan-bus-sound.js';
const near=(a,b,e=.05)=>assert.ok(Math.abs(a-b)<=e,`${a} ≈ ${b}`);
const L={x:0,z:0,fx:0,fz:-1};   // 북쪽(−z)을 봄 → 오른쪽 = +x

test('엔진 거리 감쇠: 5/10/20m = −30/−36/−42, 3m는 상한 −27, 60m 밖 꺼짐',()=>{
 near(engineDb(5),-30);near(engineDb(10),-36.02);near(engineDb(20),-42.04);assert.equal(engineDb(3),-27);assert.equal(engineDb(.1),-27);
 assert.equal(engineTarget(L,{x:60,z:0,leg:'up'}).db,null);assert.ok(engineTarget(L,{x:59,z:0,leg:'up'}).db<-51);
 near(engineTarget(L,{x:5,z:0,leg:'start'}).db,-34);near(engineTarget(L,{x:5,z:0,leg:'start'}).rate,.85,1e-9);   // 정류장 공회전 −4dB·0.85배
});
test('좌우·고음 깎기·도플러 ±3%',()=>{
 near(panAt(L,10,0),.8,1e-9);near(panAt(L,-10,0),-.8,1e-9);near(panAt(L,0,-10),0,1e-9);
 near(panAt({x:0,z:0,fx:1,fz:0},0,10),.8,1e-9);   // 동쪽(+x)을 보면 오른쪽 = +z
 assert.equal(lowpassAt(0),8000);assert.equal(lowpassAt(500),900);
 near(engineTarget(L,{x:10,z:0,leg:'up'},{prev:20,dt:1}).rate,1+10/343,1e-9);   // 시속 36km로 다가옴 ≈ +2.9%
 near(engineTarget(L,{x:10,z:0,leg:'up'},{prev:10.5,dt:.01}).rate,1.03,1e-9);near(engineTarget(L,{x:20,z:0,leg:'down'},{prev:19,dt:.01}).rate,.97,1e-9);   // 튀는 값은 ±3%로 자름
});
test('정차·문: 도착 = 치익+문 열림 한 번, 출발 1.5초 전 문 닫힘 한 번, 처음 프레임은 소리 없음',()=>{
 const seq=[{leg:'up',doors:0,left:0},{leg:'start',doors:.05,left:11.9},{leg:'start',doors:1,left:9},{leg:'start',doors:1,left:1.6},{leg:'start',doors:.9,left:1.4},{leg:'start',doors:.5,left:.7},{leg:'up',doors:0,left:0}];
 let st=null;const all=[];for(const at of seq){const r=busEvents(st,at);st=r.state;all.push(...r.events);}
 assert.deepEqual(all,['brake','open','close']);
 assert.deepEqual(busEvents(null,{leg:'start',doors:1,left:5}).events,[]);
 near(oneShotDb(5,-14),-14);near(oneShotDb(2,-12),-12);near(oneShotDb(10,-12),-18.02);assert.equal(oneShotDb(40,-12),null);
});
test('휴대폰은 가까운 1대만, 탄 버스는 바깥 엔진 끔',()=>{
 const t=[{d:30,db:-45},{d:10,db:-36}];
 assert.deepEqual(pickEngines(t),[true,true]);assert.deepEqual(pickEngines(t,{mobile:true}),[false,true]);
 assert.deepEqual(pickEngines(t,{ride:1}),[true,false]);assert.deepEqual(pickEngines(t,{mobile:true,ride:1}),[true,false]);
 assert.deepEqual(pickEngines([{d:70,db:null},{d:80,db:null}],{mobile:true}),[false,false]);
});
test('합성 임시음 세기: 반복 RMS = 파일 규격(엔진 −24·안 −26), 피크 −1 이하, 한 번 소리 피크 −3',()=>{
 const rms=d=>20*Math.log10(Math.sqrt(d.reduce((s,v)=>s+v*v,0)/d.length)),peak=d=>20*Math.log10(d.reduce((p,v)=>Math.max(p,Math.abs(v)),0));
 const e=synthEngine(16000),i=synthInside(16000);
 assert.ok(rms(e)<=BUS_SOUND.fileRmsDb.engine+.01&&rms(e)>BUS_SOUND.fileRmsDb.engine-3);assert.ok(peak(e)<=-1+1e-6);
 assert.ok(rms(i)<=BUS_SOUND.fileRmsDb.inside+.01&&rms(i)>BUS_SOUND.fileRmsDb.inside-3);assert.ok(peak(i)<=-1+1e-6);
 for(const k of ['brake','open','close']){const d=synthOneShot(k,16000);near(peak(d),-3,1e-6);assert.ok(d.every(Number.isFinite));}
 assert.deepEqual([...synthEngine(8000).slice(0,50)],[...synthEngine(8000).slice(0,50)]);   // 같은 씨앗 = 같은 소리
});

// ── 재생기(11-21 검토 3·4·5): 가짜 AudioContext ──
function fakeContext(){
 const stops=[];const param=()=>({value:1,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;}});
 const node=()=>({gain:param(),pan:param(),frequency:param(),playbackRate:param(),type:'',connect(n){return n??this;},disconnect(){}});
 const buf=(ch,len,sr)=>({length:len,numberOfChannels:ch,sampleRate:sr,duration:len/sr,getChannelData:()=>new Float32Array(len)});
 return {currentTime:0,sampleRate:8000,state:'running',stops,createGain:node,createBiquadFilter:node,createStereoPanner:node,createBuffer:buf,
  createBufferSource:()=>({...node(),buffer:null,loop:false,start(){},stop(t){stops.push(t);}}),decodeAudioData:async()=>buf(1,800,8000)};
}
const far={k:0,x:500,z:0,leg:'up',doors:0,left:0},near10={k:0,x:10,z:0,leg:'up',doors:0,left:0};
test('합성음은 켜자마자 만들지 않고, 버스가 가까워지면 한 프레임에 하나씩(타면 안 소리 먼저)',()=>{
 const c=fakeContext(),b=createBusSound({context:()=>c,destination:()=>c.createGain(),enabled:()=>true});
 for(let i=0;i<3;i++)b.update({listener:L,buses:[far]});
 assert.deepEqual(b.snapshot().loaded,[]);assert.equal(b.snapshot().bufferMB,0);
 b.update({listener:L,buses:[near10]});assert.deepEqual(b.snapshot().loaded,['engine']);
 for(let i=0;i<4;i++)b.update({listener:L,buses:[near10]});assert.equal(b.snapshot().loaded.length,5);
 const r=createBusSound({context:()=>c,destination:()=>c.createGain(),enabled:()=>true});r.update({listener:L,buses:[far],ride:0});
 assert.deepEqual(r.snapshot().loaded,['inside']);assert.equal(r.snapshot().inside.on,true);
});
test('건너뛰기 표시가 남지 않음: 안 탄 채 skip() 뒤 다음에 타고 보통으로 내리면 1초에 끔',()=>{
 const c=fakeContext(),b=createBusSound({context:()=>c,destination:()=>c.createGain(),enabled:()=>true});
 b.skip();b.update({listener:L,buses:[far]});
 for(let i=0;i<6;i++)b.update({listener:L,buses:[far],ride:0});c.stops.length=0;
 b.update({listener:L,buses:[far]});assert.deepEqual(c.stops,[BUS_SOUND.fadeOut+.2]);
 b.update({listener:L,buses:[far],ride:0});b.skip();b.pause();   // skip 직후 숨김 → 표시도 지움
 b.update({listener:L,buses:[far],ride:0});c.stops.length=0;b.update({listener:L,buses:[far]});assert.deepEqual(c.stops,[BUS_SOUND.fadeOut+.2]);
});
test('녹음 파일을 일부만 적어도 나머지는 합성음(파일은 덮어쓰지 않고 합침)',async()=>{
 const c=fakeContext(),old=globalThis.fetch;globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 try{const b=createBusSound({context:()=>c,destination:()=>c.createGain(),enabled:()=>true,rule:{...BUS_SOUND,files:{engine:'e.flac'}}});
  b.update({listener:L,buses:[near10]});assert.deepEqual(b.snapshot().loaded,['brake']);   // 엔진은 파일을 받는 중이라 합성 안 함
  await new Promise(r=>setTimeout(r,0));
  for(let i=0;i<4;i++)b.update({listener:L,buses:[near10]});
  const s=b.snapshot();assert.equal(s.source,'mixed');assert.deepEqual([...s.loaded].sort(),['brake','close','engine','inside','open']);
 }finally{globalThis.fetch=old;}
});
