// 세 체험(등산·흡연장·크리스마스)과 허브가 같이 쓰는 소리·설정 하나(11-17 허브 개선, 대표 확정 「소리·설정은 하나로 묶기」).
// localStorage `aoworld:settings:v1` = {sound, volume, music, hubTime, at}. 같은 도메인이라 허브에서 바꾸면 체험에도 그대로 간다.
//  - sound: 소리 전체 켜기/끄기(등산 🔊·흡연장 🔊·크리스마스 🔊 단추와 같은 값)
//  - volume: 0~1 소리 크기(등산 소리 크기 막대와 같은 값, 흡연장·크리스마스는 마스터에 곱함)
//  - music: 배경 음악(지금은 크리스마스 캐럴. 관악산 FM은 사용자가 따로 켜는 라디오라 넣지 않음)
//  - hubTime: 허브 색 'auto'|'day'|'dusk'|'night'(허브만 씀)
// 체험별 옛 저장값(gwanak-hiking:sound:v1·흡연장 profile.muted·크리스마스 profile.sound/carol)은 지우지 않는다.
// 이 값이 한 번이라도 저장되어 있으면(has) 체험이 들어올 때 이 값을 따르고, 체험 안에서 바꾸면 여기에도 같이 쓴다.
export const SHARED_KEY='aoworld:settings:v1';
export const SHARED_DEFAULT=Object.freeze({sound:true,volume:.7,music:true,hubTime:'auto'});
export const HUB_TIMES=Object.freeze(['auto','day','dusk','night']);

const store=s=>{try{return s===undefined?globalThis.localStorage??null:s;}catch{return null;}};
const clamp01=v=>Math.max(0,Math.min(1,v));
export function normalizeShared(raw){
 const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const vol=Number(r.volume);
 return {sound:typeof r.sound==='boolean'?r.sound:SHARED_DEFAULT.sound,
  volume:r.volume!=null&&r.volume!==''&&Number.isFinite(vol)?+clamp01(vol).toFixed(3):SHARED_DEFAULT.volume,
  music:typeof r.music==='boolean'?r.music:SHARED_DEFAULT.music,
  hubTime:HUB_TIMES.includes(r.hubTime)?r.hubTime:SHARED_DEFAULT.hubTime};
}
// 아직 공용 값이 없을 때 체험별 옛 값으로 시작값을 채운다(처음 공용 값을 쓸 때 다른 체험에서 꺼 둔 소리가 다시 켜지지 않게).
// 소리: 등산 → 크리스마스 → 흡연장 중 먼저 있는 값, 크기: 등산 소리 크기, 배경 음악: 크리스마스 캐럴.
export const LEGACY_KEYS=Object.freeze({hikingSound:'gwanak-hiking:sound:v1',hikingVolume:'gwanak-hiking:ambient-volume:v1',xmas:'xmas-world:v1',lounge:'online-smoking'});
export function legacySeed(st){
 const get=k=>{try{return st?.getItem(k)??null;}catch{return null;}};
 const json=k=>{try{const v=JSON.parse(get(k)??'null');return v&&typeof v==='object'?v:null;}catch{return null;}};
 const out={},hs=get(LEGACY_KEYS.hikingSound),hv=get(LEGACY_KEYS.hikingVolume),x=json(LEGACY_KEYS.xmas),l=json(LEGACY_KEYS.lounge);
 if(hs==='true'||hs==='false')out.sound=hs==='true';
 else if(typeof x?.sound==='boolean')out.sound=x.sound;
 else if(typeof l?.muted==='boolean')out.sound=!l.muted;
 if(hv!==null&&hv!==''&&Number.isFinite(Number(hv)))out.volume=+Math.max(0,Math.min(1,Number(hv))).toFixed(3);
 if(typeof x?.carol==='boolean')out.music=x.carol;
 return out;
}
/** 저장값 읽기. has = 저장된 적이 있는지(없으면 체험은 자기 옛 값을 그대로 쓴다). */
export function loadShared(storage){
 const st=store(storage);let raw=null;
 try{raw=st?.getItem(SHARED_KEY)??null;}catch{}
 if(raw==null)return {...SHARED_DEFAULT,...legacySeed(st),has:false};
 let v=null;try{v=JSON.parse(raw);}catch{}
 return {...normalizeShared(v),has:true};
}
/** 일부만 바꿔 저장하고 합친 값을 돌려준다. 저장이 막혀 있어도 멈추지 않는다. */
export function saveShared(patch,storage,now=Date.now()){
 const st=store(storage),cur=loadShared(st);
 const next=normalizeShared({...cur,...(patch??{})});
 try{st?.setItem(SHARED_KEY,JSON.stringify({...next,at:now}));}catch{}
 return {...next,has:true};
}
// 흡연장·크리스마스는 원래 소리 크기 막대가 없어 마스터 1(크리스마스 .9)로 냈다. 기본값 0.7이 예전 크기 그대로가 되게 0.7로 나눈 배수를 곱한다(최대 약 1.43배).
export const volumeGain=v=>Math.max(0,Math.min(1,Number.isFinite(+v)?+v:SHARED_DEFAULT.volume))/SHARED_DEFAULT.volume;
