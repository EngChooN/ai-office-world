// 남산 환경음 구간 표(11-21 월드개발 연결). 설계 docs/남산/남산-환경음-구간별-설계-v1.md(월드디자인) §1~§4·§7 숫자 그대로, 모두 추정(귀·현장 확인 전).
// 관악산 src/ambient-config.js와 같은 이름을 내보내고 AmbientAudio({config})가 받는다(관악산 파일은 고치지 않음). three 없음, 시험 tests/namsan-ambient.test.mjs.
// 파일은 관악산 환경음 5개를 다시 씀(public/sounds/ambient/, CC0). 계곡 물·까마귀·목탁은 남산에 없음.
import {clamp,dbGain,powerDb,WEATHER_SOUND,windShiftDb,DUCK as GWANAK_DUCK,INTERMITTENT as GWANAK_INTERMITTENT} from '../ambient-config.js';
export const LAYER_FILES=Object.freeze({city:'city-far-loop.flac',forest:'wind-forest-loop.flac',ridge:'wind-ridge-loop.flac',birds:'birds-loop.flac',crowd:'summit-crowd-loop.flac'});
export const FILE_RMS_DB=Object.freeze({city:-36,forest:-30,ridge:-24,birds:-34,crowd:-34});
// 구간 경계(코스 s, m): 1 출발 광장 0~100 · 2 성곽 옆 100~400 · 3 큰 계단 400~720 · 4 전망 쉼터 720~830 · 5 마지막 계단 830~1010 · 6 정상 광장 1010~
export const SECTION_STARTS=Object.freeze([0,100,400,720,830,1010]);
// 인덱스 0은 비움, 1~6 = 구간 id. ridge = 설계표의 「트인 바람」(관악산 능선 바람 파일을 약하게)
export const SECTION_TARGET_DB=Object.freeze({
 city:  [null,-44,-47,-52,-46,-52,-48],
 forest:[null,-54,-50,-47,-50,-48,null],
 ridge: [null,null,null,null,-50,null,-46],
 birds: [null,-56,-53,-54,-56,-56,null],
 crowd: [null,null,null,null,null,-56,-44],
});
export const BUDGET_DB=Object.freeze({low:-37,high:-34});
// 새 켜고 끄기는 관악산과 같은 값(1~3 = on/off, 4~5 = upperOn/upperOff). 까마귀·목탁 없음
export const INTERMITTENT=Object.freeze({birds:GWANAK_INTERMITTENT.birds});
export const CROSSFADE_S=Object.freeze({jump:1.5,city:8,other:6});
export const DUCK=GWANAK_DUCK;
export const GUST_SCALE=.6;            // 돌풍 ±2.5dB(관악산) → ±1.5dB
export const NIGHT=Object.freeze({cityDb:2,crowdDb:-4,birdsOff:.5});   // 밤: 도시 +2·사람 −4·새 끔(night 0~1이 0.5 넘으면)
export const SUMMIT_PLAZA_R=46;        // 정상 광장 반지름(가운데 −44 → 가장자리 −48)
export const MUFFLE=Object.freeze({db:-8,lowpassHz:700});   // 버스 안: 환경음 −8dB + 로우패스 700Hz
export const sectionAt=s=>{let id=1;for(let i=1;i<SECTION_STARTS.length;i++)if(s>=SECTION_STARTS[i])id=i+1;return id;};
export const ambientSectionAt=sectionAt;
const lerp=(a,b,t)=>a+(b-a)*clamp(t);
// 도시 소음: 구간 1 안 −44→−47, 2→3 경계 앞뒤 40m는 −47→−52로 이음
function cityDb(s,section){if(section===1)return lerp(-44,-47,s/100);if(s>=360&&s<=440)return lerp(-47,-52,(s-360)/80);return SECTION_TARGET_DB.city[section];}
// 정상 사람: 구간 5는 s 960~1010에서 −56→−50, 구간 6은 광장 가운데 −44 → 가장자리 −48.
// 구간 6인데 광장 원 밖(summitDist null)이면 가장자리 값 −48(원에 들어설 때 뚝 줄지 않게, 11-21 검토 2)
function crowdDb(s,section,summitDist){if(section===5)return s<960?null:lerp(-56,-50,(s-960)/50);if(section===6)return summitDist==null?-48:lerp(-44,-48,summitDist/SUMMIT_PLAZA_R);return null;}
/** s = 코스 거리(m), h = 높이(쓰지 않음, 관악산과 같은 모양), opts: birds·gust(관악산과 같음) + night(0~1)·summitDist(정상 광장 안이면 가운데까지 m, 밖이면 null) */
export function ambientTargets(s,h,{birds=true,gust=0,night=0,summitDist=null}={}){
 const section=summitDist!=null?6:sectionAt(s),shift=windShiftDb(WEATHER_SOUND.wind),rain=WEATHER_SOUND.rain,nk=clamp(night);
 const add=(db,d)=>db===null?null:db+d;
 const birdDb=birds&&rain<.6&&nk<=NIGHT.birdsOff?SECTION_TARGET_DB.birds[section]:null;
 const targets={
  city:add(cityDb(s,section),NIGHT.cityDb*nk),
  forest:add(SECTION_TARGET_DB.forest[section],shift),
  ridge:add(SECTION_TARGET_DB.ridge[section],gust*GUST_SCALE+shift),
  birds:birdDb===null?null:birdDb-14*rain,
  crowd:add(crowdDb(s,section,summitDist),NIGHT.crowdDb*nk),
 };
 const budgetDb=(section<=5?BUDGET_DB.low:BUDGET_DB.high)+Math.max(0,shift)*.6,sum=powerDb(Object.values(targets)),correction=Math.min(0,budgetDb-sum);
 for(const key in targets)if(targets[key]!==null)targets[key]+=correction;
 return {section,targets,distance:null,exposure:0,budgetDb,correction,sumRmsDb:powerDb(Object.values(targets))};
}
// 전환 중 등전력(관악산 crossfade와 같은 식, 남산 층 이름으로)
export function crossfade(from,to,t){t=clamp(t);const a=t===0?1:t===1?0:Math.cos(t*Math.PI/2)**2,b=1-a;return Object.fromEntries(Object.keys(LAYER_FILES).map(k=>[k,Math.sqrt(dbGain(from[k])**2*a+dbGain(to[k])**2*b)]));}
// AmbientAudio({config}) 갈래(src/ambient-audio.js 머리 설명)
export const preload=section=>section>=4?[LAYER_FILES.ridge,LAYER_FILES.crowd]:[];
export const birdPhase=section=>section<=3?'low':section<=5?'upper':null;
export const crossfadeFor=(next,prev,jump)=>jump?CROSSFADE_S.jump:(next===2&&prev===1)||(next===1&&prev===2)?CROSSFADE_S.city:CROSSFADE_S.other;
export const tone=(name)=>name==='ridge'?2400:null;   // 트인 바람은 관악산 강풍보다 부드럽게
export const NAMSAN_AMBIENT_CONFIG=Object.freeze({LAYER_FILES,FILE_RMS_DB,INTERMITTENT,CROSSFADE_S,DUCK,ambientTargets,crossfade,preload,birdPhase,crossfadeFor,tone,muffle:MUFFLE});
