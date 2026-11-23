// 허브 체험 목록. 체험이 늘면 배열에 한 줄만 더한다(art는 art.js의 ART 키). path는 BASE_PATH 기준 상대 경로.
// record는 카드에 작게 보일 기존 기록을 읽는 선택 함수(localStorage 사용, 없으면 null).
// 11-17 허브 개선: 체험별 포인트 색(color·dark·soft), 아이콘(icon, src/icons), 동동이 옷(outfit, dongdong.js), 즐길거리 3개(feats [아이콘, 이름]).
import {loadSummits,summitOf} from '../summit-records.js';
export const EXPERIENCES=[
 {id:'hiking',path:'hiking/',title:'온라인 등산',place:'관악산',desc:'등산복 입은 동동이와 연주대까지 걸어 올라요',tags:['혼자·함께','낮·노을·밤'],art:'mountain',
  color:'#5f8f3e',dark:'#3f6a28',soft:'#e6efd8',icon:'c-exp-hiking',outfit:'hike',feats:[['h-summit','정상 도장'],['h-binoculars','쌍안경'],['h-radio','관악산 FM']],
  record:storage=>{const r=summitOf(loadSummits(storage),'gwanak');return r?`완등 ${r.count}회`:null;}},
 {id:'smoking',path:'smoking/',title:'온라인 흡연장',place:'서울 옥상',desc:'회사원 옷 입은 동동이와 옥상에서 수다 한 대',tags:['수다','옥상 야경'],art:'rooftop',
  color:'#c8682f',dark:'#93461a',soft:'#f6e3d2',icon:'c-exp-smoking',outfit:'office',feats:[['s-cigarette','가상 담배'],['s-can-coffee','캔커피'],['c-chat','옥상 수다']],record:null},
 {id:'christmas',path:'christmas/',title:'온라인 크리스마스',place:'눈마을 광장',desc:'동동이와 트리를 꾸미고 눈사람을 만들어요',tags:['함께','눈 오는 밤'],art:'village',
  color:'#2f7a52',dark:'#1d5536',soft:'#dcebe1',icon:'c-exp-christmas',outfit:'santa',feats:[['x-tree','트리 꾸미기'],['x-sled','눈썰매'],['x-snowball','눈싸움']],record:null},
 // 11-23 온라인 인형뽑기(MVP). 표지·특징 아이콘은 월드아트 인형뽑기 아이콘(c-exp-claw·k-claw·k-dex·k-coin)
 {id:'claw',path:'claw/',title:'온라인 인형뽑기',place:'동동이 인형가게',desc:'매일 받는 무료 코인으로 집게를 움직여 인형을 뽑고 도감을 채워요',tags:['혼자·구경','무료 코인'],art:'arcade',
  color:'#d94a7c',dark:'#a8325c',soft:'#f9e0ea',icon:'c-exp-claw',outfit:'hike',feats:[['k-claw','집게 뽑기'],['k-dex','인형 도감'],['k-coin','매일 코인']],
  record:storage=>{try{const s=JSON.parse(storage?.getItem('claw-world:v1')??'null');const n=s&&s.dex?Object.keys(s.dex).length:0;return n?`도감 ${n}종`:null;}catch{return null;}}}
];
// 늘 맨 뒤에 남는 「다음 체험 준비 중」 자리. 누르면 의견 보내기(가 보고 싶은 곳)로 이어진다. 체험이 늘면 EXPERIENCES에 한 줄 더하고 이 자리는 그대로.
export const NEXT_SLOT=Object.freeze({id:'next',title:'다음 체험 준비 중',place:'새 장소',desc:'동동이가 갈 다음 곳을 만들고 있어요. 가 보고 싶은 곳을 알려 주세요',
 art:'lot',color:'#9b8a72',dark:'#6e604c',soft:'#efe7d6',icon:'c-wait'});
/** 카드 링크 주소: base(import.meta.env.BASE_URL)에 상대 경로를 붙인다. */
export const experienceHref=(e,base='/')=>`${base.endsWith('/')?base:base+'/'}${e.path}`;
