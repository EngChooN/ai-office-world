// 온라인 인형뽑기 색·인형 목록(월드아트, 2026-11-23). three를 쓰지 않는다(node 검사·화면 UI가 함께 읽는다).
// 기준: 온라인 등산 카툰 팔레트(동동이 빨강 #d9473e·주황 바람막이 #f08a3c·청록 배낭 #2fa39a·크림 불빛 #f0e5bc)와
// 기존 우리 캐릭터 색(concept-kit.js 동동이, trail-props.js 다람쥐·산토끼·까치·산고양이, mascot-concepts.js 해치, hub/dongdong.js 옷 3종)을 그대로 가져온다.
// 가게는 밝은 오락실(크림 벽·박하 초록·분홍 네온)로, 기계 세 대는 색으로 구분한다.

// 희귀도: 색 = 인형 이름표·도감 띠·기계 안내 색, size = 인형 높이(m, 동동이 1.0m 기준). 크면 눈에 띄지만 집게에 덜 잡히는 느낌(규칙 값은 월드기획).
export const RARITY=Object.freeze({
 common:Object.freeze({label:'흔함',color:'#7cc56a',dark:'#4f9a45',size:.2,stars:1}),
 uncommon:Object.freeze({label:'보통',color:'#56aef0',dark:'#2f7fc4',size:.24,stars:2}),
 rare:Object.freeze({label:'희귀',color:'#a978f0',dark:'#7a4cc4',size:.28,stars:3}),
 special:Object.freeze({label:'특별',color:'#f5c33b',dark:'#c58f1c',size:.32,stars:4}),
});
export const RARITY_ORDER=Object.freeze(['common','uncommon','rare','special']);

// 우리 캐릭터 인형 8종(11-23 처음 8종). id는 저장·도감 열쇠라 바꾸지 않는다. 이름·순서는 화면에 그대로 쓴다.
// from: 원래 그림이 있는 곳(같은 생김새를 인형으로 줄였다)
export const PLUSH_BASE=Object.freeze([
 {id:'squirrel',name:'다람쥐',rarity:'common',from:'trail-props.js squirrel'},
 {id:'hare',name:'산토끼',rarity:'common',from:'trail-props.js hare'},
 {id:'magpie',name:'까치',rarity:'common',from:'trail-props.js magpie'},
 {id:'cat',name:'산고양이',rarity:'uncommon',from:'trail-props.js cat'},
 {id:'dongdong',name:'등산 동동이',rarity:'uncommon',from:'concept-kit.js dongdong'},
 {id:'dongdong-office',name:'회사원 동동이',rarity:'rare',from:'hub/dongdong.js office(온라인 흡연장 옷)'},
 {id:'haechi',name:'해치',rarity:'rare',from:'mascot-concepts.js haechi'},
 {id:'dongdong-santa',name:'산타 동동이',rarity:'special',from:'hub/dongdong.js santa(온라인 크리스마스 옷)'},
].map(Object.freeze));
// ── 11-25 추가 인형(대표 결정: 시안 docs/인형뽑기/인형추가-시안-v1.html 후보 14개 모두). 그림 = claw-plush-more.js(월드아트).
// 11-25 연결(월드공통개발, 대표 결정): 작은 인형 PLUSH = 처음 8 + 추가 8 = 16종(도감·진열장·기계), 큰 인형 BIG_PLUSH = 3 + 3, 상자 BOX_PLUSH = 이름을 적은 11종.
// 이름·희귀도는 대표가 고른 시안 그대로. link = 이어지는 콘텐츠(도감 설명에 쓸 수 있음)
export const PLUSH_ADD=Object.freeze([
 {id:'kkulbam',name:'꿀밤이',rarity:'common',from:'trail-props.js 다람쥐 도토리',link:'온라인 등산'},
 {id:'nunsong',name:'눈송이',rarity:'common',from:'christmas 눈사람 꾸미기',link:'온라인 크리스마스'},
 {id:'mongle',name:'몽글이',rarity:'common',from:'흡연장 옥상 쉼터 커피',link:'온라인 흡연장'},
 {id:'bueong',name:'부엉',rarity:'uncommon',from:'밤 등산 헤드랜턴',link:'온라인 등산(밤)'},
 {id:'rudolph',name:'루돌프',rarity:'uncommon',from:'christmas reindeer.js',link:'온라인 크리스마스'},
 {id:'domdol',name:'돔돌이',rarity:'rare',from:'mascot-concepts.js domdol',link:'온라인 등산(정상)'},
 {id:'dongdong-camp',name:'캠핑 동동이',rarity:'rare',from:'동동이 캠핑 옷(새 옷)',link:'새 콘텐츠(캠핑장)'},
 {id:'star',name:'반짝별',rarity:'special',from:'christmas 트리 꼭대기 별',link:'온라인 크리스마스'},
].map(Object.freeze));
// 큰 인형 3종(등에 업음). 규칙은 BIG_PLUSH와 같음(같은 형상을 크게, 크기 = 희귀도 크기 + BIG_EXTRA). 큰 산타 동동이 = 첫 특별 큰 인형(0.54m, 단 한도 0.56m 안)
// 작은 인형 16종(도감 순서 = 처음 8 → 추가 8)
export const PLUSH=Object.freeze([...PLUSH_BASE,...PLUSH_ADD]);

// 큰 인형(타이머 기계 전용 경품, 11-23 대표 피드백: 「10초 맞추기 기계 경품은 보통 큰 인형」). 추천안·대표 미확인.
// 규칙: 생김새·희귀도·이름표 색은 원래 인형(base) 그대로, 형상도 같은 것을 크게 그린다(새 형상·텍스처 없음 — 휴대폰 무게 그대로).
//  크기 = 원래 희귀도 크기 + BIG_EXTRA(0.22m): 흔함 0.42 · 보통 0.46 · 희귀 0.50m(작은 인형의 약 2배, 기계 유리 상자 안 높이 0.74m에 단 0.06m를 빼고 들어가는 한도 0.56m 아래).
//  id는 'big-' + 원래 id(저장·도감 열쇠라 바꾸지 않음). 도감에는 따로 칸이 생긴다(claw-guest.js clawCatalog, 큰 표시 방식은 월드개발).
export const BIG_EXTRA=.22;
const BIG_PLUSH_BASE=Object.freeze([
 {id:'big-squirrel',base:'squirrel',name:'큰 다람쥐'},
 {id:'big-dongdong',base:'dongdong',name:'큰 등산 동동이'},
 {id:'big-haechi',base:'haechi',name:'큰 해치'},
].map(b=>Object.freeze({...b,rarity:PLUSH.find(p=>p.id===b.base).rarity,big:true,from:`${b.base} 크게`})));
// 봉 기계 경품 = 상자 피규어(v4.1 §12, 기계마다 2종). 희귀도·이름표 색은 원래 인형 그대로. 그림은 상자 + 앞 창 안 작은 인형(월드개발 임시 그림 claw-bridge.js, 정식 그림은 월드아트).
// 11-25 대표 결정: 작은 인형마다 저절로 생기던 상자를 이름을 적은 목록으로(처음 8종 상자 + 상자 전용 3종 = 11). 새 작은 인형 8종은 상자 없음
const BOX_PLUSH_BASE=Object.freeze(PLUSH_BASE.map(p=>Object.freeze({id:`box-${p.id}`,base:p.id,name:`${p.name} 상자`,rarity:p.rarity,box:true,from:`${p.id} 상자 피규어`})));

export const BIG_PLUSH_ADD=Object.freeze([
 {id:'big-nunsong',base:'nunsong',name:'큰 눈송이'},
 {id:'big-rudolph',base:'rudolph',name:'큰 루돌프'},
 {id:'big-dongdong-santa',base:'dongdong-santa',name:'큰 산타 동동이'},
].map(b=>Object.freeze({...b,rarity:PLUSH.find(p=>p.id===b.base).rarity,big:true,from:`${b.base} 크게`})));
export const BIG_PLUSH=Object.freeze([...BIG_PLUSH_BASE,...BIG_PLUSH_ADD]);
// 상자 피규어 3종. 안의 모양(base)은 작은 인형 칸이 없는 상자 안 전용 모양(BOX_SHAPES) — 상자로만 나옴(11-25 대표 결정)
export const BOX_SHAPES=Object.freeze(['kongi','bau','haechi-gold']);
export const BOX_PLUSH_ADD=Object.freeze([
 {id:'box-kongi',base:'kongi',name:'콩이 상자',rarity:'uncommon',from:'mascot-concepts.js kongi',link:'새 콘텐츠(탐험대)'},
 {id:'box-bau',base:'bau',name:'바우 상자',rarity:'rare',from:'mascot-concepts.js bau',link:'온라인 등산'},
 {id:'box-haechi-gold',base:'haechi-gold',name:'황금 해치 상자',rarity:'special',from:'haechi 금빛 특별판',link:'공통(해치 특별판)'},
].map(b=>Object.freeze({...b,box:true})));
export const BOX_PLUSH=Object.freeze([...BOX_PLUSH_BASE,...BOX_PLUSH_ADD]);
export const isBoxPlush=id=>typeof id==='string'&&id.startsWith('box-')&&BOX_PLUSH.some(b=>b.id===id);
export const isBigPlush=id=>typeof id==='string'&&id.startsWith('big-')&&BIG_PLUSH.some(b=>b.id===id);
export const baseOfPlush=id=>(BIG_PLUSH.find(b=>b.id===id)??BOX_PLUSH.find(b=>b.id===id))?.base??id;

// 손님 인형 자리(다른 회사 캐릭터용). 공개판 코드에는 실제 이름·그림을 넣지 않는다.
// 개발용(VITE_CLAW_PRIVATE=1 + private/claw/에 파일이 있을 때)만 실제 인형이 들어가고, 아니면 fallback(우리 인형)이 그 자리에 놓인다.
// 도감에는 실제 인형이 들어갔을 때만 칸이 생긴다(claw-guest.js clawCatalog).
export const GUEST_SLOTS=Object.freeze([
 Object.freeze({id:'guest-1',rarity:'special',fallback:'haechi'}),
 Object.freeze({id:'guest-2',rarity:'rare',fallback:'dongdong-office'}), // v4.1 §11: 열쇠 칸 구멍이 공개판·비공개판 같게(희귀)
]);

// 기계 16대(11-23 월드디자인 설계 v4·v4.1 §12 경품 표, 대표 승인 — 집게 6·봉 4·타이머 3·열쇠 3). 월드개발이 옮김.
// id = 저장·서버용 바꾸지 않는 이름. name = 「종류 + 번호」(짧게 부르는 이름), sub = 별명(간판 둘째 줄), level = 어려움 점(보이는 차이만, 같은 종류는 조절값이 같음).
// pool = 기계 안 인형(집게 = 더미에 섞을 인형, 봉 = 상자 피규어 2~3종을 섞어, 타이머 = 단 위 큰 인형 2종을 번갈아).
// 11-25 새 인형 14종 배치(대표 결정 = 추천안): 집게 1~6에 새 작은 인형 하나씩(꿀밤이·눈송이·몽글이·부엉·루돌프·돔돌이), 열쇠 2·3 칸에 캠핑 동동이·반짝별(특별 = 열쇠 3)·꿀밤이·부엉,
//  타이머마다 큰 인형 둘(큰 산타 동동이 = 가장 어려운 타이머 3), 봉 2·3·4 셋째 경품 = 콩이·바우·황금 해치 상자. 확률표는 없음(넣은 수·무게 그대로). key는 cells(아래 줄 왼→오, 위 줄 왼→오)대로 칸을 채운다.
// 손님 인형 자리(guest-*)는 열쇠 1·2의 8번째 칸에만(v4.1 §11). 봉 bars = 봉 배치(m): gap 나란히, near/far = 八자(앞 near → 뒤 far).
// 옛 기계 id(11-23 MVP 3대): forest → claw-1, city → timer-1~3, star → key-1 (저장 이어받기는 claw-rules.js MACHINE_RENAME).
const C1=['#4fae7a','#2f7f58'],C2=['#5cba84','#36875f'],C3=['#44a372','#287450'];
const B1=['#e8689e','#b8406f'],B2=['#ef7aa9','#c24d7b'];
const T1=['#f08a3c','#c0612a'],T2=['#f29a4f','#c76d33'];
const K1=['#5b5fc4','#3a3d8f'],K2=['#6a6ed0','#44479c'];
const S1=['#3b2f7a','#241c52'];
const R1=['#d8434f','#a12c3a']; // 11-27 새 기계 ② 줄 자르기(월드아트 STRING_THEME) // 11-27 새 기계 ① 불빛 쌓기(월드디자인 시안 v1 「별빛 탑」 틀 색 #2b2357 계열)
const mk=(id,kind,name,sub,[body,bodyDark],o={})=>Object.freeze({id,kind,name,sub,body,bodyDark,
 trim:{claw:'#f6e7c4',bridge:'#fff0f6',timer:'#fff4e2',key:'#f3eaff',stack:'#ece6ff',string:'#fff1ea'}[kind],accent:{claw:'#ffcf4a',bridge:'#7fd8f0',timer:'#56aef0',key:'#f5c33b',stack:'#5fe1ff',string:'#ffc43d'}[kind],
 light:{claw:'#fff0b0',bridge:'#ffd6ea',timer:'#ffe2b8',key:'#e6d8ff',stack:'#ffe14d',string:'#ffe3c2'}[kind],...o,pool:Object.freeze(o.pool),...(o.cells?{cells:Object.freeze(o.cells)}:{})});
export const MACHINES=Object.freeze([
 mk('claw-1','claw','집게 1','숲 친구들',C1,{level:1,pool:['squirrel','hare','magpie','kkulbam']}),
 mk('claw-2','claw','집게 2','산토끼네',C2,{level:1,pool:['hare','squirrel','cat','nunsong']}),
 mk('claw-3','claw','집게 3','까치 둥지',C3,{level:1,pool:['magpie','squirrel','dongdong','mongle']}),
 mk('claw-4','claw','집게 4','등산 동동이',C1,{level:1,pool:['dongdong','cat','hare','bueong']}),
 mk('claw-5','claw','집게 5','산고양이',C2,{level:1,pool:['cat','magpie','dongdong-office','rudolph']}),
 mk('claw-6','claw','집게 6','반짝 집게',C3,{level:2,pool:['haechi','dongdong-office','cat','domdol']}),
 mk('bridge-1','bridge','봉 1','다람쥐 상자',B1,{level:2,bars:Object.freeze({gap:.2175}),pool:['box-squirrel','box-hare']}),
 mk('bridge-2','bridge','봉 2','까치 상자',B2,{level:2,bars:Object.freeze({gap:.2175}),pool:['box-magpie','box-cat','box-kongi']}),
 mk('bridge-3','bridge','봉 3','동동이 상자(八자)',B1,{level:2,bars:Object.freeze({near:.205,far:.225}),pool:['box-dongdong','box-dongdong-office','box-bau']}),
 mk('bridge-4','bridge','봉 4','해치 상자',B2,{level:3,bars:Object.freeze({gap:.21}),pool:['box-haechi','box-dongdong-santa','box-haechi-gold']}),
 mk('timer-1','timer','타이머 1','큰 다람쥐',T1,{level:3,pool:['big-squirrel','big-nunsong']}),
 // 타이머는 번호가 클수록 어려움(11-24 대표 지적 「기기별로 난이도가 점점 올라감」): 1 = 끝까지 보임 · 2 = 7초부터 · 3 = 3초부터 숫자가 어두워짐. 초는 추천안·대표 미확인
 mk('timer-2','timer','타이머 2','큰 등산 동동이',T2,{level:4,hideAfterSec:7,pool:['big-dongdong','big-rudolph']}),
 mk('timer-3','timer','타이머 3','큰 해치',T1,{level:5,hideAfterSec:3,pool:['big-haechi','big-dongdong-santa']}),
 mk('key-1','key','열쇠 1','별빛',K1,{level:2,pool:['haechi','dongdong-santa','cat','guest-1'],cells:['squirrel','hare','cat','dongdong','dongdong-office','haechi','dongdong-santa','guest-1']}),
 mk('key-2','key','열쇠 2','달빛',K2,{level:2,pool:['haechi','dongdong-santa','dongdong-office','dongdong-camp','guest-2'],cells:['magpie','kkulbam','dongdong','cat','haechi','dongdong-santa','dongdong-camp','guest-2']}),
 mk('key-3','key','열쇠 3','반짝 칸',K1,{level:3,pool:['haechi','dongdong-santa','dongdong-office','star','dongdong-camp'],cells:['cat','dongdong-office','bueong','haechi','dongdong-santa','star','dongdong-camp','dongdong-santa']}),
 // 11-27 새 기계(대표 지시 「새 기계 3종」, 월드디자인 시안 v1 추천안·대표 미확인). 기존 16대 번호(act m 1~16)를 바꾸지 않게 맨 뒤에 붙임.
 //  불빛 쌓기 「별빛 탑」: 7줄 = 작은 인형(prizes.small), 11줄 = 큰 인형(prizes.big). pool = 도감 「나오는 기계」
 mk('stack-1','stack','별빛 탑','불빛 쌓기',S1,{level:2,pool:['squirrel','big-nunsong'],prizes:Object.freeze({small:'squirrel',big:'big-nunsong'})}),
 //  줄 자르기 「가위로 툭」: 줄 1(왼쪽)·줄 2(오른쪽)에 큰 인형 하나씩 = prizes[i](11-27 월드기획 결정 = 월드아트 추천안, 대표 미확인)
 mk('string-1','string','가위로 툭','줄 자르기',R1,{level:3,pool:['big-rudolph','big-squirrel'],prizes:Object.freeze(['big-rudolph','big-squirrel'])}),
]);
export const machineIndex=id=>MACHINES.findIndex(m=>m.id===id);

// 가게 색
export const SHOP_COLORS=Object.freeze({
 floorA:'#f4ead6',floorB:'#e6d6b8',floorEdge:'#c9b28c',wall:'#fbf1df',wallLow:'#8fd0b8',wallTrim:'#5aa88e',
 neonPink:'#ff7fb0',neonMint:'#7ff0d0',neonYellow:'#ffe27a',counter:'#d98a5a',counterTop:'#fff4e2',shelf:'#b07a4a',
 rug:'#e86a6a',rugEdge:'#ffd36b',door:'#7fc6e8',doorFrame:'#3d6f8f',bench:'#5aa88e',plant:'#5f9e4a',pot:'#d9733e',
 coin:'#f5c33b',coinDark:'#c58f1c',metal:'#c9ced4',metalDark:'#7d848c',glass:'#cfeef8',rubber:'#3a3f45',chute:'#2b2f36',
});
// 장식 기계·가운데 섬의 인형 더미 색(우리 인형 8종 몸·귀 색을 줄인 것, 무인 인형뽑기방 꾸밈 claw-arcade-art.js)
export const PLUSH_COLORS_FOR_PILE=Object.freeze([
 {body:'#b8835a',ear:'#8a5a3a'},{body:'#f4eee6',ear:'#f3b8c4'},{body:'#2f3640',ear:'#f4f2ee'},{body:'#e9a15f',ear:'#c9773e'},
 {body:'#f08a3c',ear:'#d9473e'},{body:'#f7d9b8',ear:'#3e4866'},{body:'#7fc7a8',ear:'#f5c33b'},{body:'#e5484d',ear:'#ffffff'},
 {body:'#ffc6dc'},{body:'#bfe6ff'},{body:'#d8c6ff'},
].map(Object.freeze));
export const plushInfo=id=>PLUSH.find(p=>p.id===id)??BIG_PLUSH.find(p=>p.id===id)??BOX_PLUSH.find(p=>p.id===id)??null;
