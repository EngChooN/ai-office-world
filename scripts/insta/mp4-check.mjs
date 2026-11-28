// 인스타 릴스 업로드 전 MP4 검사: ffprobe 없이 박스 머리만 읽어 판정한다.
import {open} from 'node:fs/promises';

export const REEL_RULES={maxBytes:100*1024*1024,minSec:3,maxSec:15*60,ratio:9/16,ratioTol:0.01};
const AAC_OTI=new Set([0x40,0x66,0x67,0x68]);
const CONTAINERS=new Set(['moov','trak','mdia','minf','stbl']);
const MAX_MOOV=64*1024*1024;

const fourcc=(b,o)=>b.toString('latin1',o,o+4);
const u64=(b,o)=>Number(b.readBigUInt64BE(o));

// 버퍼 안 자식 박스 목록 [{type,start(내용 시작),end}]. 깨진 크기는 거기서 멈춤
function children(b,from=0,to=b.length){
 const out=[];let o=from;
 while(o+8<=to){
  let size=b.readUInt32BE(o),head=8;const type=fourcc(b,o+4);
  if(size===1){if(o+16>to)break;size=u64(b,o+8);head=16;}
  else if(size===0)size=to-o;
  if(size<head||o+size>to)break;
  out.push({type,start:o+head,end:o+size});o+=size;
 }
 return out;
}
const find=(b,box,type)=>children(b,box.start,box.end).find(c=>c.type===type);
const path=(b,box,...types)=>types.reduce((cur,t)=>cur&&find(b,cur,t),box);

// esds 안 DecoderConfigDescriptor의 objectTypeIndication
function esdsOti(b,s,e){
 let o=s+4;
 const len=()=>{let n=0;for(let i=0;i<4&&o<e;i++){const v=b[o++];n=(n<<7)|(v&0x7f);if(!(v&0x80))break;}return n;};
 if(b[o++]!==0x03)return null;len();o+=2;
 const f=b[o++];if(f&0x80)o+=2;if(f&0x40)o+=b[o]+1;if(f&0x20)o+=2;
 if(o>=e||b[o++]!==0x04)return null;len();
 return o<e?b[o]:null;
}

function readTrak(b,trak){
 const t={};
 const hdlr=path(b,trak,'mdia','hdlr');if(hdlr&&hdlr.end-hdlr.start>=12)t.handler=fourcc(b,hdlr.start+8);
 const tkhd=find(b,trak,'tkhd');
 if(tkhd){const at=tkhd.start+(b[tkhd.start]===1?88:76);if(at+8<=tkhd.end){t.width=b.readUInt32BE(at)/65536;t.height=b.readUInt32BE(at+4)/65536;}}
 const mdhd=path(b,trak,'mdia','mdhd');
 if(mdhd){const at=mdhd.start+(b[mdhd.start]===1?20:12);if(at+4<=mdhd.end)t.timescale=b.readUInt32BE(at);}
 const stbl=path(b,trak,'mdia','minf','stbl');
 const stsd=stbl&&find(b,stbl,'stsd');
 if(stsd&&stsd.end-stsd.start>=16){
  const [entry]=children(b,stsd.start+8,stsd.end);
  if(entry){
   t.codec=fourcc(b,entry.start-4);
   if(t.handler==='vide'&&entry.end-entry.start>=28){t.entryW=b.readUInt16BE(entry.start+24);t.entryH=b.readUInt16BE(entry.start+26);}
   // 오디오 샘플 엔트리 버전(QuickTime v1/v2)과 wave 감싸기를 피하려 esds를 바이트로 찾는다
   const at=b.indexOf('esds','latin1',entry.start);
   if(at>=4&&at<entry.end){const s=at+4,e=Math.min(at-4+b.readUInt32BE(at-4),entry.end);t.oti=esdsOti(b,s,e);}
  }
 }
 const stts=stbl&&find(b,stbl,'stts');
 if(stts&&t.timescale){
  const n=b.readUInt32BE(stts.start+4);let samples=0,ticks=0;
  for(let i=0,o=stts.start+8;i<n&&o+8<=stts.end;i++,o+=8){const c=b.readUInt32BE(o);samples+=c;ticks+=c*b.readUInt32BE(o+4);}
  if(samples&&ticks)t.fps=samples*t.timescale/ticks;
 }
 return t;
}

export async function inspectMp4(file){
 const info={sizeBytes:null,brand:null,durationSec:null,width:null,height:null,videoCodec:null,audioCodec:null,audioAac:false,fps:null,faststart:null};
 let fh;
 try{
  fh=await open(file,'r');
  const size=(await fh.stat()).size;info.sizeBytes=size;
  const head=Buffer.alloc(16);let o=0,moov=null,moovAt=-1,mdatAt=-1;
  // 최상위 박스는 머리만 읽고 건너뛴다
  while(o+8<=size){
   const {bytesRead}=await fh.read(head,0,16,o);if(bytesRead<8)break;
   let len=head.readUInt32BE(0),hl=8;const type=fourcc(head,4);
   if(len===1){if(bytesRead<16)break;len=u64(head,8);hl=16;}else if(len===0)len=size-o;
   if(len<hl||o+len>size)break;
   if(type==='ftyp'&&o===0&&len>=hl+4){const b=Buffer.alloc(4);await fh.read(b,0,4,o+hl);info.brand=fourcc(b,0);}
   if(type==='mdat'&&mdatAt<0)mdatAt=o;
   if(type==='moov'&&!moov&&len<=MAX_MOOV){moovAt=o;moov=Buffer.alloc(len);await fh.read(moov,0,len,o);moov={b:moov,box:{start:hl,end:len}};}
   o+=len;
  }
  if(moovAt>=0&&mdatAt>=0)info.faststart=moovAt<mdatAt;
  if(!moov)return info;
  const {b,box}=moov;
  const mvhd=find(b,box,'mvhd');
  if(mvhd){
   const v1=b[mvhd.start]===1,at=mvhd.start+(v1?20:12);
   if(at+(v1?12:8)<=mvhd.end){const ts=b.readUInt32BE(at),d=v1?u64(b,at+4):b.readUInt32BE(at+4);if(ts)info.durationSec=d/ts;}
  }
  for(const trak of children(b,box.start,box.end).filter(c=>c.type==='trak')){
   const t=readTrak(b,trak);
   if(t.handler==='vide'&&!info.videoCodec){
    info.videoCodec=t.codec??null;
    info.width=Math.round(t.width||t.entryW||0)||null;info.height=Math.round(t.height||t.entryH||0)||null;
    info.fps=t.fps?Math.round(t.fps*100)/100:null;
   }else if(t.handler==='soun'&&!info.audioCodec){
    info.audioCodec=t.codec??null;info.audioAac=t.codec==='mp4a'&&AAC_OTI.has(t.oti);
   }
  }
 }catch{/* 깨진 파일은 읽은 데까지만 돌려준다 */}
 finally{await fh?.close();}
 return info;
}

const mb=bytes=>(bytes/1e6).toFixed(1);
const clock=sec=>{const m=Math.floor(sec/60),s=Math.round(sec%60);return m?(s?`${m}분 ${s}초`:`${m}분`):`${sec.toFixed(1)}초`;};
const isH264=c=>c==='avc1'||c==='avc3';
const VIDEO_NAMES={avc1:'H.264',avc3:'H.264',hvc1:'HEVC',hev1:'HEVC',av01:'AV1',vp09:'VP9'};

export function checkReelVideo(info,rules=REEL_RULES){
 const problems=[],warnings=[];
 const {sizeBytes,brand,durationSec:d,width:w,height:h,videoCodec,audioCodec,audioAac,fps,faststart}=info;
 if(sizeBytes>rules.maxBytes)problems.push(`파일이 ${mb(rules.maxBytes)}MB를 넘어요 (${mb(sizeBytes)}MB)`);
 if(!brand)problems.push('MP4 파일이 아니에요 (ftyp 없음)');
 if(!videoCodec)problems.push('영상 트랙을 찾지 못했어요');
 else if(!isH264(videoCodec))problems.push(`영상 코덱이 H.264가 아니에요 (${VIDEO_NAMES[videoCodec]??videoCodec})`);
 if(!audioCodec)problems.push('소리가 없어요 (오디오 트랙 없음)');
 else if(!audioAac)problems.push(`소리 코덱이 AAC가 아니에요 (${audioCodec})`);
 if(!w||!h)problems.push('가로·세로 크기를 읽지 못했어요');
 else if(Math.abs(w/h-rules.ratio)>rules.ratioTol)problems.push(`화면 비율이 9:16 세로가 아니에요 (${w}×${h})`);
 if(d==null)problems.push('영상 길이를 읽지 못했어요');
 else if(d<rules.minSec)problems.push(`${rules.minSec}초보다 짧아요 (${d.toFixed(1)}초)`);
 else if(d>rules.maxSec)problems.push(`${clock(rules.maxSec)}을 넘어요 (${clock(d)})`);
 if(faststart===false)warnings.push('영상 정보(moov)가 뒤에 있어요 (faststart 아님) — 인스타 처리에 불리할 수 있어요');
 if(fps!=null&&(fps<23||fps>60))warnings.push(`프레임 수가 권장 범위(23~60fps) 밖이에요 (${fps}fps)`);
 if(h>1920)warnings.push(`세로가 1920px보다 커요 (${h}px) — 인스타가 줄여서 올려요`);
 return {ok:problems.length===0,problems,warnings};
}

export function describeVideo(info){
 const {width:w,height:h,durationSec:d,videoCodec:v,audioCodec:a,audioAac,fps,sizeBytes}=info;
 const codec=`${v?VIDEO_NAMES[v]??v:'영상 없음'} + ${a?(audioAac?'AAC':a):'소리 없음'}`;
 return [w&&h?`${w}×${h}`:'크기 모름',d!=null?`${d.toFixed(1)}초`:'길이 모름',codec,
  fps!=null?`${Number.isInteger(fps)?fps:fps.toFixed(2)}fps`:'fps 모름',sizeBytes!=null?`${mb(sizeBytes)}MB`:'크기 모름'].join(' · ');
}
