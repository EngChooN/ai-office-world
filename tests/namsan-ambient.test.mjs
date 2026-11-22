// 남산 환경음 표·AmbientAudio 산별 설정(11-21). 설계 docs/남산/남산-환경음-구간별-설계-v1.md §8-1
import test from 'node:test';
import assert from 'node:assert/strict';
import {AmbientAudio,GWANAK_AMBIENT_CONFIG} from '../src/ambient-audio.js';
import {LAYER_FILES as GWANAK_FILES} from '../src/ambient-config.js';
import {NAMSAN_AMBIENT_CONFIG,ambientTargets,sectionAt,crossfadeFor,LAYER_FILES} from '../src/namsan/namsan-ambient-config.js';
import {setWeatherSound,dbGain} from '../src/ambient-config.js';

test('구간 경계 6개와 정상 광장 안 = 구간 6',()=>{
 assert.deepEqual([0,99,100,400,720,830,1010,1066].map(sectionAt),[1,1,2,3,4,5,6,6]);
 assert.equal(ambientTargets(5,110,{summitDist:10}).section,6);
});
test('0~1067m 1m마다 합계 ≤ 예산, 물소리·까마귀·목탁 층 없음',()=>{
 setWeatherSound({wind:null,rain:0});
 for(let s=0;s<=1067;s++)for(const birds of [true,false])for(const night of [0,1]){const v=ambientTargets(s,150,{birds,gust:2.5,night});assert.ok(v.sumRmsDb<=v.budgetDb+1e-9,`s=${s}`);assert.deepEqual(Object.keys(v.targets).sort(),['birds','city','crowd','forest','ridge']);}
 assert.ok(!Object.values(LAYER_FILES).some(f=>/stream|crow(?!d)|moktak/.test(f)));
 assert.equal(NAMSAN_AMBIENT_CONFIG.INTERMITTENT.crow,undefined);assert.equal(NAMSAN_AMBIENT_CONFIG.INTERMITTENT.moktak,undefined);
});
test('설계표 대표값: 출발 −44, 정상 먼 웅성임 가운데 −44·가장자리 −48(11-22), 밤 새 끔·도시 +2',()=>{
 setWeatherSound({wind:null,rain:0});
 assert.equal(ambientTargets(0,108).targets.city,-44);
 // 정상 사람들 소리: 11-22 환호를 끊고 대표가 고른 ① 먼 웅성임으로 다시 켬(크기 표는 그대로)
 assert.equal(LAYER_FILES.crowd,'summit-murmur-loop.flac');
 assert.equal(ambientTargets(1060,267,{summitDist:0}).targets.crowd,-44);
 assert.equal(ambientTargets(1060,267,{summitDist:46}).targets.crowd,-48);
 assert.equal(ambientTargets(1030,267).targets.crowd,-48);   // 구간 6인데 광장 원 밖 = 가장자리 값(11-21 검토 2)
 assert.equal(ambientTargets(900,250).targets.crowd,null);assert.equal(ambientTargets(1010-25,260).targets.crowd,-53);
 const night=ambientTargets(500,180,{night:1});assert.equal(night.targets.birds,null);assert.equal(night.targets.city,ambientTargets(500,180).targets.city+2);
 assert.equal(crossfadeFor(2,1,false),8);assert.equal(crossfadeFor(3,2,false),6);assert.equal(crossfadeFor(3,2,true),1.5);
});
function context(){
 const events=[];const node=()=>({gain:param(),pan:param(),frequency:param(),playbackRate:param(),connect(n){return n??this;},disconnect(){},start(){events.push('start');},stop(){events.push('stop');},getFloatTimeDomainData(a){a.fill(0);}});
 function param(){return {value:1,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}};}
 return {currentTime:0,state:'running',events,createGain:node,createBiquadFilter:node,createAnalyser:node,createStereoPanner:node,createBufferSource:node};
}
test('남산 설정 AmbientAudio: 남산 파일만 받고, 버스 안 먹먹하게(−8dB·700Hz), 관악산 기본 설정은 그대로',()=>{
 const c=context(),a=new AmbientAudio({context:c,destination:c.createGain(),random:()=>.5,config:NAMSAN_AMBIENT_CONFIG});
 const asked=[];a.load=async f=>{asked.push(f);return null;};for(const f of Object.values(LAYER_FILES))a.buffers.set(f,{duration:24});
 for(const s of [0,200,500,760,900,1050])for(let i=0;i<8;i++)a.update({referenceMetres:s,elevation:150,dt:.25});
 assert.ok(!asked.some(f=>/stream|crow(?!d)|moktak/.test(f)),asked.join());
 assert.equal(a.snapshot().section,6);assert.deepEqual(Object.keys(a.snapshot().layers).sort(),['birds','city','crowd','forest','ridge']);
 a.setMuffle(true);assert.ok(Math.abs(a.muffleGain.gain.value-dbGain(-8))<1e-9);assert.equal(a.muffleLow.frequency.value,700);assert.equal(a.snapshot().muffled,true);
 a.setMuffle(false);assert.equal(a.muffleGain.gain.value,1);
 const g=new AmbientAudio({context:c,destination:c.createGain()});assert.equal(g.config,GWANAK_AMBIENT_CONFIG);assert.equal(g.muffleGain,undefined);g.setMuffle(true);
 assert.deepEqual(Object.keys(g.snapshot().layers),Object.keys(GWANAK_FILES));
});
test('정상 먼 웅성임(11-22 대표 선택): 두 산 같은 파일, 관악산 정상 −44·바로 아래 −54~−48, 환호 파일은 연결만 끊음',async()=>{
 const {ambientTargets:gwanakTargets,CROWD_ENABLED,FILE_RMS_DB}=await import('../src/ambient-config.js');
 const {existsSync}=await import('node:fs');
 setWeatherSound({wind:null,rain:0});
 assert.equal(CROWD_ENABLED,true);assert.equal(GWANAK_FILES.crowd,'summit-murmur-loop.flac');assert.equal(LAYER_FILES.crowd,GWANAK_FILES.crowd);
 assert.equal(FILE_RMS_DB.crowd,-34);assert.equal(NAMSAN_AMBIENT_CONFIG.FILE_RMS_DB.crowd,-34);   // 월드디자인 stats.json calm-murmur-loop rmsDb −34.0
 assert.ok(existsSync(new URL('../public/sounds/ambient/summit-murmur-loop.flac',import.meta.url)));
 const top=gwanakTargets(5100,629);assert.equal(top.section,7);assert.equal(top.targets.crowd,-44);assert.ok(top.targets.ridge>top.targets.crowd);
 assert.ok(GWANAK_AMBIENT_CONFIG.preload(7).includes('summit-murmur-loop.flac'));assert.ok(NAMSAN_AMBIENT_CONFIG.preload(6).includes('summit-murmur-loop.flac'));
 for(const files of [GWANAK_FILES,LAYER_FILES,GWANAK_AMBIENT_CONFIG.preload(7),NAMSAN_AMBIENT_CONFIG.preload(6)])assert.ok(!Object.values(files).includes('summit-crowd-loop.flac'));
});
