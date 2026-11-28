import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectMp4,checkReelVideo,describeVideo,REEL_RULES} from '../scripts/insta/mp4-check.mjs';

const REAL=fileURLToPath(new URL('../artifacts/reels-claw-v2/온라인인형뽑기-릴스-v2.mp4',import.meta.url));

// 최소 MP4 박스 만들기
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32BE(n);return b;};
const u16=n=>{const b=Buffer.alloc(2);b.writeUInt16BE(n);return b;};
const box=(type,...parts)=>{const body=Buffer.concat(parts);return Buffer.concat([u32(8+body.length),Buffer.from(type,'latin1'),body]);};
const zero=n=>Buffer.alloc(n);
const mvhd=(ts,dur)=>box('mvhd',zero(4),zero(8),u32(ts),u32(dur),zero(80));
const tkhd=(w,h)=>box('tkhd',zero(4),zero(20),zero(8),zero(8),zero(36),u32(w*65536),u32(h*65536));
const mdhd=ts=>box('mdhd',zero(4),zero(8),u32(ts),u32(0),zero(4));
const hdlr=kind=>box('hdlr',zero(4),zero(4),Buffer.from(kind,'latin1'),zero(12),Buffer.from('x\0'));
const stts=(count,delta)=>box('stts',zero(4),u32(1),u32(count),u32(delta));
const stsd=entry=>box('stsd',zero(4),u32(1),entry);
const visual=(codec,w,h)=>box(codec,zero(6),u16(1),zero(16),u16(w),u16(h),zero(50));
const esds=oti=>box('esds',zero(4),Buffer.from([0x03,0x19,0,1,0,0x04,0x11,oti,0x15]),zero(16));
const sound=(codec,oti)=>box(codec,zero(6),u16(1),zero(8),u16(2),u16(16),zero(4),u32(44100*65536),...(oti==null?[]:[esds(oti)]));
const trak=(kind,head,entry,ts,count,delta)=>box('trak',head,box('mdia',mdhd(ts),hdlr(kind),box('minf',box('stbl',stsd(entry),stts(count,delta)))));

function makeMp4({w=1080,h=1920,sec=26,codec='avc1',audio='mp4a',oti=0x40,ftyp=true,mdatFirst=false}={}){
 const tracks=[trak('vide',tkhd(w,h),visual(codec,w,h),15360,sec*30,512)];
 if(audio)tracks.push(trak('soun',tkhd(0,0),sound(audio,audio==='mp4a'?oti:null),44100,Math.round(sec*44100/1024),1024));
 const moov=box('moov',mvhd(1000,Math.round(sec*1000)),...tracks),mdat=box('mdat',zero(64));
 const head=ftyp?[box('ftyp',Buffer.from('isom'),u32(512),Buffer.from('isomiso2avc1mp41'))]:[];
 return Buffer.concat([...head,...(mdatFirst?[mdat,moov]:[moov,mdat])]);
}

let dir;
test.before(async()=>{dir=await mkdtemp(join(tmpdir(),'insta-mp4-'));});
test.after(async()=>{await rm(dir,{recursive:true,force:true});});
const check=async(name,opts,rules)=>{const file=join(dir,`${name}.mp4`);await writeFile(file,makeMp4(opts));const info=await inspectMp4(file);return {info,...checkReelVideo(info,rules)};};
const has=(list,text)=>assert.ok(list.some(p=>p.includes(text)),`${JSON.stringify(list)}에 「${text}」 없음`);

test('실제 릴스 영상은 통과한다',{skip:!existsSync(REAL)&&'영상 파일 없음'},async()=>{
 const info=await inspectMp4(REAL),r=checkReelVideo(info);
 assert.equal(info.width,1080);assert.equal(info.height,1920);
 assert.equal(info.videoCodec,'avc1');assert.equal(info.audioCodec,'mp4a');assert.equal(info.audioAac,true);
 assert.equal(info.fps,30);assert.ok(Math.abs(info.durationSec-26)<0.1);
 assert.deepEqual(r.problems,[]);assert.equal(r.ok,true);
 assert.equal(describeVideo(info),'1080×1920 · 26.0초 · H.264 + AAC · 30fps · 9.4MB');
});
test('정상 최소 MP4는 문제·경고 없이 통과',async()=>{
 const {info,ok,problems,warnings}=await check('ok');
 assert.equal(ok,true);assert.deepEqual(problems,[]);assert.deepEqual(warnings,[]);
 assert.equal(info.brand,'isom');assert.equal(info.faststart,true);assert.equal(info.fps,30);assert.equal(info.durationSec,26);
});
test('HEVC는 H.264가 아니라고 알린다',async()=>{
 const {ok,problems}=await check('hevc',{codec:'hvc1'});assert.equal(ok,false);has(problems,'H.264가 아니에요 (HEVC)');
});
test('소리 없음·AAC 아닌 소리',async()=>{
 has((await check('mute',{audio:null})).problems,'소리가 없어요');
 has((await check('mp3',{oti:0x6b})).problems,'AAC가 아니에요 (mp4a)');
 has((await check('opus',{audio:'Opus'})).problems,'AAC가 아니에요 (Opus)');
});
test('가로 영상은 9:16이 아니다',async()=>{
 has((await check('wide',{w:1920,h:1080})).problems,'9:16 세로가 아니에요 (1920×1080)');
});
test('3초 미만·15분 초과',async()=>{
 has((await check('short',{sec:2})).problems,'3초보다 짧아요 (2.0초)');
 has((await check('long',{sec:16*60})).problems,'15분을 넘어요 (16분)');
});
test('ftyp 없으면 MP4 아님',async()=>{
 const {info,problems}=await check('noftyp',{ftyp:false});assert.equal(info.brand,null);has(problems,'MP4 파일이 아니에요');
});
test('mdat가 moov 앞이면 경고만',async()=>{
 const {info,ok,warnings}=await check('tail',{mdatFirst:true});
 assert.equal(info.faststart,false);assert.equal(ok,true);has(warnings,'faststart 아님');
});
test('100MB 초과',async()=>{
 const {info}=await check('big');
 const r=checkReelVideo({...info,sizeBytes:150*1e6});assert.equal(r.ok,false);has(r.problems,'MB를 넘어요 (150.0MB)');
 has(checkReelVideo(info,{...REEL_RULES,maxBytes:100}).problems,'MB를 넘어요');
});
test('MP4가 아니거나 없는 파일도 throw 없이 문제로 보고',async()=>{
 const junk=join(dir,'junk.mp4');await writeFile(junk,'그냥 글자입니다');
 for(const file of [junk,join(dir,'none.mp4')]){
  const info=await inspectMp4(file),r=checkReelVideo(info);
  assert.equal(r.ok,false);has(r.problems,'MP4 파일이 아니에요');has(r.problems,'영상 트랙');
  assert.match(describeVideo(info),/크기 모름/);
 }
});
test('fps·세로 경고와 요약 줄',()=>{
 const info={sizeBytes:9.4e6,brand:'isom',durationSec:26,width:2160,height:3840,videoCodec:'avc1',audioCodec:'mp4a',audioAac:true,fps:120,faststart:true};
 const r=checkReelVideo(info);assert.equal(r.ok,true);has(r.warnings,'120fps');has(r.warnings,'1920px');
 assert.equal(describeVideo({...info,fps:29.97}),'2160×3840 · 26.0초 · H.264 + AAC · 29.97fps · 9.4MB');
});
