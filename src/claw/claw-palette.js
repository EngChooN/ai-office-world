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

// 우리 캐릭터 인형 8종(추천안, 대표 미확인). id는 저장·도감 열쇠라 바꾸지 않는다. 이름·순서는 화면에 그대로 쓴다.
// from: 원래 그림이 있는 곳(같은 생김새를 인형으로 줄였다)
export const PLUSH=Object.freeze([
 {id:'squirrel',name:'다람쥐',rarity:'common',from:'trail-props.js squirrel'},
 {id:'hare',name:'산토끼',rarity:'common',from:'trail-props.js hare'},
 {id:'magpie',name:'까치',rarity:'common',from:'trail-props.js magpie'},
 {id:'cat',name:'산고양이',rarity:'uncommon',from:'trail-props.js cat'},
 {id:'dongdong',name:'등산 동동이',rarity:'uncommon',from:'concept-kit.js dongdong'},
 {id:'dongdong-office',name:'회사원 동동이',rarity:'rare',from:'hub/dongdong.js office(온라인 흡연장 옷)'},
 {id:'haechi',name:'해치',rarity:'rare',from:'mascot-concepts.js haechi'},
 {id:'dongdong-santa',name:'산타 동동이',rarity:'special',from:'hub/dongdong.js santa(온라인 크리스마스 옷)'},
].map(Object.freeze));

// 큰 인형(타이머 기계 전용 경품, 11-23 대표 피드백: 「10초 맞추기 기계 경품은 보통 큰 인형」). 추천안·대표 미확인.
// 규칙: 생김새·희귀도·이름표 색은 원래 인형(base) 그대로, 형상도 같은 것을 크게 그린다(새 형상·텍스처 없음 — 휴대폰 무게 그대로).
//  크기 = 원래 희귀도 크기 + BIG_EXTRA(0.22m): 흔함 0.42 · 보통 0.46 · 희귀 0.50m(작은 인형의 약 2배, 기계 유리 상자 안 높이 0.74m에 단 0.06m를 빼고 들어가는 한도 0.56m 아래).
//  id는 'big-' + 원래 id(저장·도감 열쇠라 바꾸지 않음). 도감에는 따로 칸이 생긴다(claw-guest.js clawCatalog, 큰 표시 방식은 월드개발).
export const BIG_EXTRA=.22;
export const BIG_PLUSH=Object.freeze([
 {id:'big-squirrel',base:'squirrel',name:'큰 다람쥐'},
 {id:'big-dongdong',base:'dongdong',name:'큰 등산 동동이'},
 {id:'big-haechi',base:'haechi',name:'큰 해치'},
].map(b=>Object.freeze({...b,rarity:PLUSH.find(p=>p.id===b.base).rarity,big:true,from:`${b.base} 크게`})));
// 봉 기계 경품 = 상자 피규어(v4.1 §12, 기계마다 2종). 희귀도·이름표 색은 원래 인형 그대로. 그림은 상자 + 앞 창 안 작은 인형(월드개발 임시 그림 claw-bridge.js, 정식 그림은 월드아트).
export const BOX_PLUSH=Object.freeze(PLUSH.map(p=>Object.freeze({id:`box-${p.id}`,base:p.id,name:`${p.name} 상자`,rarity:p.rarity,box:true,from:`${p.id} 상자 피규어`})));
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
// pool = 기계 안 인형(집게 = 더미에 섞을 인형, 봉 = 상자 피규어 2종을 번갈아, 타이머 = 단 위 큰 인형 1종). key는 cells(아래 줄 왼→오, 위 줄 왼→오)대로 칸을 채운다.
// 손님 인형 자리(guest-*)는 열쇠 1·2의 8번째 칸에만(v4.1 §11). 봉 bars = 봉 배치(m): gap 나란히, near/far = 八자(앞 near → 뒤 far).
// 옛 기계 id(11-23 MVP 3대): forest → claw-1, city → timer-1~3, star → key-1 (저장 이어받기는 claw-rules.js MACHINE_RENAME).
const C1=['#4fae7a','#2f7f58'],C2=['#5cba84','#36875f'],C3=['#44a372','#287450'];
const B1=['#e8689e','#b8406f'],B2=['#ef7aa9','#c24d7b'];
const T1=['#f08a3c','#c0612a'],T2=['#f29a4f','#c76d33'];
const K1=['#5b5fc4','#3a3d8f'],K2=['#6a6ed0','#44479c'];
const mk=(id,kind,name,sub,[body,bodyDark],o={})=>Object.freeze({id,kind,name,sub,body,bodyDark,
 trim:{claw:'#f6e7c4',bridge:'#fff0f6',timer:'#fff4e2',key:'#f3eaff'}[kind],accent:{claw:'#ffcf4a',bridge:'#7fd8f0',timer:'#56aef0',key:'#f5c33b'}[kind],
 light:{claw:'#fff0b0',bridge:'#ffd6ea',timer:'#ffe2b8',key:'#e6d8ff'}[kind],...o,pool:Object.freeze(o.pool),...(o.cells?{cells:Object.freeze(o.cells)}:{})});
export const MACHINES=Object.freeze([
 mk('claw-1','claw','집게 1','숲 친구들',C1,{level:1,pool:['squirrel','hare','magpie']}),
 mk('claw-2','claw','집게 2','산토끼네',C2,{level:1,pool:['hare','squirrel','cat']}),
 mk('claw-3','claw','집게 3','까치 둥지',C3,{level:1,pool:['magpie','squirrel','dongdong']}),
 mk('claw-4','claw','집게 4','등산 동동이',C1,{level:1,pool:['dongdong','cat','hare']}),
 mk('claw-5','claw','집게 5','산고양이',C2,{level:1,pool:['cat','magpie','dongdong-office']}),
 mk('claw-6','claw','집게 6','반짝 집게',C3,{level:2,pool:['haechi','dongdong-office','cat']}),
 mk('bridge-1','bridge','봉 1','다람쥐 상자',B1,{level:2,bars:Object.freeze({gap:.16}),pool:['box-squirrel','box-hare']}),
 mk('bridge-2','bridge','봉 2','까치 상자',B2,{level:2,bars:Object.freeze({gap:.16}),pool:['box-magpie','box-cat']}),
 mk('bridge-3','bridge','봉 3','동동이 상자(八자)',B1,{level:2,bars:Object.freeze({near:.15,far:.175}),pool:['box-dongdong','box-dongdong-office']}),
 mk('bridge-4','bridge','봉 4','해치 상자',B2,{level:3,bars:Object.freeze({gap:.16}),pool:['box-haechi','box-dongdong-santa']}),
 mk('timer-1','timer','타이머 1','큰 다람쥐',T1,{level:3,pool:['big-squirrel']}),
 mk('timer-2','timer','타이머 2','큰 등산 동동이',T2,{level:3,pool:['big-dongdong']}),
 mk('timer-3','timer','타이머 3','큰 해치',T1,{level:4,hideAfterSec:3,pool:['big-haechi']}),
 mk('key-1','key','열쇠 1','별빛',K1,{level:2,pool:['haechi','dongdong-santa','cat','guest-1'],cells:['squirrel','hare','cat','dongdong','dongdong-office','haechi','dongdong-santa','guest-1']}),
 mk('key-2','key','열쇠 2','달빛',K2,{level:2,pool:['haechi','dongdong-santa','dongdong-office','guest-2'],cells:['magpie','squirrel','dongdong','cat','haechi','dongdong-santa','dongdong-office','guest-2']}),
 mk('key-3','key','열쇠 3','반짝 칸',K1,{level:3,pool:['haechi','dongdong-santa','dongdong-office'],cells:['cat','dongdong-office','squirrel','haechi','dongdong-santa','haechi','dongdong-office','dongdong-santa']}),
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
