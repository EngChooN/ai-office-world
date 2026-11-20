// 남산용 콘텐츠 글·자료(한 게임 통합 5단계, 월드개발 11-20). three를 쓰지 않는다(node --test로 검사).
// 관악산 interaction-data.js와 같은 모양으로 남산 글을 따로 둔다: 스탬프 4곳 설명·이정표 4개 안내 쪽·정상석 쪽·쌍안경 명소·행동 문구.
// 규칙(대표 결정): 실제로 참고하는 것은 산 모양·코스·서울 도심뿐이고 시설·소품·안내판 글은 게임 속 디자인이다. 현장 안내판 글을 옮기지 않는다.
// 명소는 남산 정상 기준 방향·거리만 계산한다(실제 자료 조사 없음). 설명은 관악산 쌍안경 글(LANDMARK_ABOUT)을 그대로 쓰거나 일반 상식으로 짧게 새로 썼다.
// 글은 월드개발 초안(월드기획 확인 전).
import {LANDMARKS,LANDMARK_ABOUT,ACTIONS,STONE_NOTICE} from '../interaction-data.js';
import {NAMSAN} from './namsan-data.js';

export const NS_NOTICE='게임 속 안내 글이에요 · 현장 안내판 글이 아닙니다';
export const NS_CARD_NOTICE='온라인 체험 기록 · 실제 등산 기록이 아닙니다';
export {STONE_NOTICE};

// ① 스탬프 4곳(namsan-data NAMSAN.stamps와 번호·글자·이름 같음) — 수첩·알림에 붙는 한 줄
export const NS_STAMPS=Object.freeze(NAMSAN.stamps.map(t=>Object.freeze({...t,id:`ns-stamp-${t.n}`,
 note:{1:'출발 · 성곽길 들머리',2:'성곽을 따라 오르는 큰 계단',3:'숨 돌리는 평탄참 · 남서쪽 전망',4:'전망탑 광장'}[t.n]??'',
 tilt:[-4,5,-3,4][t.n-1]??0})));

// ② 이정표 4개 안내 쪽. 이정표 판 글은 namsan-data NAMSAN.signs와 같은 순서. dir = 화살표 방향: 'up' 정상 쪽(코스 앞)·'down' 내려가는 쪽·{lm:명소 id} 그 명소 방향
const est=text=>({kind:'est',text}),ok=text=>({kind:'ok',text});
export const NS_SIGNS=Object.freeze([
 {n:1,dirs:['up','up',{lm:'lm-seoulstation'}],page:{title:'성곽길 들머리',body:['백범광장에서 옛 성곽을 따라 남산 정상까지 오르는 1.1km 길이에요. 처음 400m는 완만한 길이라 몸을 풀며 걷기 좋아요.','남산은 조선 시대 한양의 남쪽을 지키던 산이라 산자락을 따라 성곽이 이어져요. 뒤를 돌아보면 서울역 쪽 빌딩 숲이 보여요.'],chips:[ok('코스 길이 약 1.1km(게임 속 코스)'),est('걸리는 시간은 걷는 빠르기에 따라 달라요')]}},
 {n:2,dirs:['up','up'],page:{title:'성곽 계단',body:['여기부터 성곽 옆 돌계단이 이어져요. 계단에서는 천천히, 한 칸씩 올라가요.','계단을 다 오르면 남서쪽이 트인 쉼터가 나와요. 약수터와 돌 물확이 길가에 있어요.'],chips:[est('계단 구간 길이는 게임 속 배치')]}},
 {n:3,dirs:['up','up',{bearing:225}],page:{title:'서쪽 전망 쉼터',body:['남서쪽이 트인 평탄참이에요. 용산과 한강, 여의도 빌딩이 한눈에 보여요. 쌍안경(B)으로 이름표를 볼 수 있어요.','정상까지 마지막 계단이 남았어요. 약수 한 모금 마시고 숨을 고른 뒤 올라가요.'],chips:[est('보이는 곳은 날씨에 따라 달라요')]}},
 {n:4,dirs:[{lm:'lm-gwanak'},{lm:'lm-bukhan'}],page:{title:'남산 정상 전망',body:['전망탑 둘레 광장에서 서울이 사방으로 보여요. 남쪽 멀리 관악산, 북쪽으로 북악산과 북한산이 보여요.','쌍안경(B)으로 보면 명소 이름표가 떠요. 밤에는 서울 불빛이 가장 예뻐요.'],chips:[ok('방향·거리는 정상 기준 직접 계산'),est('보이는지는 날씨에 따라 달라요')]}},
]);
// 정상석 「남산 265m」 F 확인 쪽(관악산 정상석 안내처럼 정상 인증)
export const NS_SUMMIT_PAGE=Object.freeze({title:'남산 정상 · 265m',body:['남산 꼭대기, 해발 265m 자리예요. 표지석·전망탑·광장 모양은 게임 속 디자인이에요.','전망탑을 한 바퀴 돌면 서울이 사방으로 보여요. 정상 벤치에 앉아 서울 불빛을 보거나, 난간에 사랑의 자물쇠를 걸 수 있어요.'],chips:[ok('정상 높이 265m'),est('표지석 모양은 게임 속 디자인')]});
export const NS_SOURCE='남산 코스 · OpenStreetMap 길·성곽(ODbL)과 지형 자료로 만든 게임 속 코스 · 글은 직접 정리';

// ③ 쌍안경 명소(남산 정상·전망 쉼터에서). 위경도는 대표 좌표(꼭대기가 아님). 관악산과 겹치는 곳은 관악산 표의 좌표·설명 그대로.
const pick=id=>LANDMARKS.find(l=>l.id===id);
export const NS_LANDMARKS=Object.freeze([
 {id:'lm-gwanak',name:'관악산',lat:37.445184,lon:126.964135,topAlt:632,height:'632m',maxKm:25,note:'온라인 등산에서 오를 수 있는 산'},
 pick('lm-bukhan'),pick('lm-bugak'),pick('lm-dobong'),pick('lm-lotte'),pick('lm-63'),pick('lm-yeouido'),
 {...pick('lm-hangang-2'),name:'한강 (동작대교 쪽)'},
 {id:'lm-gyeongbok',name:'경복궁',lat:37.5796,lon:126.977,topAlt:40,height:'',maxKm:25},
 {id:'lm-seoulstation',name:'서울역',lat:37.5547,lon:126.9707,topAlt:40,height:'',maxKm:25},
 {...pick('lm-cheonggye')},
].filter(Boolean).map(l=>Object.freeze({...l})));
export const NS_LANDMARK_ABOUT=Object.freeze({
 ...Object.fromEntries(NS_LANDMARKS.filter(l=>LANDMARK_ABOUT[l.id]).map(l=>[l.id,LANDMARK_ABOUT[l.id]])),
 'lm-gwanak':{line:'온라인 등산의 다른 산',body:['서울 남쪽 끝에 솟은 바위산이에요. 온라인 등산에서 입구 광장부터 연주대 정상까지 걸어 오를 수 있어요.','관악산 정상에서도 북쪽으로 이 남산 전망탑이 보여요.']},
 'lm-gyeongbok':{line:'조선의 첫 궁궐',body:['조선이 한양에 도읍을 정하며 지은 첫 궁궐이에요. 뒤로 북악산이 받치고, 앞으로 광화문과 큰길이 곧게 뻗어 있어요.']},
 'lm-seoulstation':{line:'서울의 큰 기차역',body:['전국으로 가는 고속열차와 공항철도가 떠나는 큰 기차역이에요. 옆에 붉은 벽돌 옛 역 건물이 남아 있어요.']},
});
// 이름표가 보이는 곳: 정상 광장 안 또는 이 높이(m) 이상(전망 쉼터 약 219~233m)
export const NS_LANDMARK_MIN_ELEVATION=0;   // 코스 어디서나(11-21: 관악산 쌍안경처럼 이름표가 보이게. 예전엔 215m 이상만)

// ④ 행동(관악산 ACTIONS 시간·소리 그대로, 남산은 체력 칸이 없어 끝 문구만 다름)
export const NS_ACTIONS=Object.freeze({
 drink:{...ACTIONS.drink,label:'약수 한 모금',sub:'게임 속 약수터',done:'약수 한 모금 · 시원해요'},
 dip:{...ACTIONS.dip,label:'손 담그기',sub:'돌 물확에 손을',done:'손 담그기 · 차가워요'},
 cairn:{...ACTIONS.cairn,label:'돌 올리기',sub:STONE_NOTICE,done:'돌을 하나 올렸어요'},
});

// ⑤ 사랑의 자물쇠(대표 결정 11-20: 내 기기 저장 + 같은 방 공유, 글 쓰기 없음, 서버에 오래 남기지 않음).
// 한 사람 최대 개수·색 이름은 월드개발 추천안(대표 미확인). 색 순서는 그림 INTERACT_COLORS.locks와 같다.
export const NS_LOCKS=Object.freeze({max:3,colors:Object.freeze(['빨강','분홍','노랑','초록','파랑','보라','주황','하양','자주','청록']),
 notice:'게임 속 자물쇠예요 · 이 기기에 저장되고, 함께 걷기 중이면 같은 방 사람에게 보여요'});

// ⑥ 정상 야경 벤치·순환버스 문구
export const NS_BENCH=Object.freeze({label:'벤치에 앉기',sub:'서울 불빛 보기',reach:2.2,
 night:'서울 불빛이 반짝여요 · 차 마시기(T)도 할 수 있어요',day:'해가 지면 서울 불빛이 켜져요 · 차 마시기(T)도 할 수 있어요'});
