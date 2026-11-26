// 인형뽑기 소리(11-26 대표 제보 「소리가 없다」): 휴대폰 손가락 뗌으로도 소리가 켜지는지, 효과음 이름, 음소거·배경 음악·구경 거리 크기
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createClawAudio,CLAW_SOUNDS,BGM_DUCK} from '../src/claw/claw-audio.js';
import {BGM_LEVEL} from '../src/claw/claw-bgm.js';

function fakeWin(){
 const ls={},made=[];
 const param=v=>({value:v,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(x){this.value=x;}});
 const node=()=>({connect(n){return n??this;},disconnect(){},start(){},stop(){},gain:param(1),frequency:param(0),Q:param(1),type:'',buffer:null});
 class AC{constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.destination=node();made.push(this);this.nodes=0;}
  resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
  createGain(){this.nodes++;return node();}createOscillator(){this.nodes++;return node();}createBiquadFilter(){this.nodes++;return node();}
  createBufferSource(){this.nodes++;return node();}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}}
 return {AudioContext:AC,made,addEventListener(t,f){(ls[t]??=[]).push(f);},fire(t){for(const f of ls[t]??[])f({});},ls};
}
const tick=()=>new Promise(r=>setTimeout(r,0));

test('휴대폰 손가락 뗌(touchend·pointerup·click)으로도 소리가 켜진다', ()=>{
 for(const ev of ['touchend','pointerup','click','pointerdown','keydown']){
  const w=fakeWin();createClawAudio({win:w,doc:null});assert.ok(w.ls[ev]?.length,`${ev}를 듣는다`);
 }
});

test('첫 입력 전에는 AudioContext를 만들지 않고, 입력 뒤 깨워 효과음이 난다', async()=>{
 const w=fakeWin(),a=createClawAudio({win:w,doc:null,music:false});
 a.play('coin');assert.equal(w.made.length,0);assert.equal(a.status().played,0);
 w.fire('touchend');await tick();
 assert.equal(w.made.length,1);assert.equal(a.status().context,'running');
 for(const n of CLAW_SOUNDS)a.play(n);
 assert.equal(a.status().played,CLAW_SOUNDS.length,'모든 이름이 소리를 낸다');
 w.fire('touchend');assert.equal(w.made.length,1,'입력마다 새로 만들지 않음');
});

test('음소거면 효과음 0, 구경 소리는 거리 크기 0이면 안 냄', async()=>{
 const w=fakeWin(),a=createClawAudio({win:w,doc:null,music:false});w.fire('click');await tick();
 a.setMuted(true);a.play('win');assert.equal(a.status().played,0);
 a.setMuted(false);a.play('win',{gain:0});assert.equal(a.status().played,0);
 a.play('win',{gain:.3});assert.equal(a.status().played,1);
});

test('배경 음악은 켜짐·소리 켜짐·소리가 깨어 있을 때만 흐르고, 음소거·끄기·탭 숨김이면 멈춘다', async()=>{
 const w=fakeWin(),docLs={},doc={hidden:false,addEventListener(t,f){docLs[t]=f;}};
 const a=createClawAudio({win:w,doc,music:true});
 assert.equal(a.status().bgm,false,'입력 전에는 안 흐름');
 w.fire('touchend');await tick();await tick();
 assert.equal(a.status().bgm,true);
 a.setMuted(true);assert.equal(a.status().bgm,false);a.setMuted(false);assert.equal(a.status().bgm,true);
 a.setMusic(false);assert.equal(a.status().bgm,false);a.setMusic(true);assert.equal(a.status().bgm,true);
 doc.hidden=true;docLs.visibilitychange();assert.equal(a.status().bgm,false);
 doc.hidden=false;docLs.visibilitychange();await tick();await tick();assert.equal(a.status().bgm,true);
 a.setMusic(false);
});

test('배경 음악은 효과음보다 작다(버스 크기·조작 중 줄임)', ()=>{
 assert.ok(BGM_LEVEL>0&&BGM_LEVEL<=.15,`BGM_LEVEL ${BGM_LEVEL}`);
 assert.ok(BGM_DUCK>0&&BGM_DUCK<1);
});

test('기계 조작 소리가 claw-play에 연결되어 있다', ()=>{
 const src=readFileSync(new URL('../src/claw/claw-play.js',import.meta.url),'utf8');
 for(const n of ['coin','down','up','grab','chute','tick','perfect','near','key-in','cell','push','drop','door'])assert.match(src,new RegExp(`'${n}'`),n);
 assert.match(src,/loop\('motor'\)/);assert.match(src,/hearOf/);
 const phys=readFileSync(new URL('../src/claw/claw-bridge-physics.js',import.meta.url),'utf8');assert.match(phys,/type:'touch'/);
});
