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

// 손님 인형 자리(다른 회사 캐릭터용). 공개판 코드에는 실제 이름·그림을 넣지 않는다.
// 개발용(VITE_CLAW_PRIVATE=1 + private/claw/에 파일이 있을 때)만 실제 인형이 들어가고, 아니면 fallback(우리 인형)이 그 자리에 놓인다.
// 도감에는 실제 인형이 들어갔을 때만 칸이 생긴다(claw-guest.js clawCatalog).
export const GUEST_SLOTS=Object.freeze([
 Object.freeze({id:'guest-1',rarity:'special',fallback:'haechi'}),
 Object.freeze({id:'guest-2',rarity:'rare',fallback:'cat'}),
]);

// 기계 세 대(추천안). pool = 기계 안에 쌓을 인형(그림 기본값). 확률·집게 힘은 월드기획 조절값이며 여기서 정하지 않는다.
// kind = 기계 몸 종류(월드디자인 설계 v3 §1 추천안·대표 미확인): claw 집게 · timer 타이머(큰 숫자판 + 단 위 인형 하나) · key 열쇠(칸 2×4).
// timer는 pool 첫 인형을 단 위에 올린다. key는 cells(아래 줄 왼→오, 위 줄 왼→오)대로 칸을 채운다.
export const MACHINES=Object.freeze([
 Object.freeze({id:'forest',kind:'claw',name:'숲속 기계',sub:'처음이라면 여기!',body:'#4fae7a',bodyDark:'#2f7f58',trim:'#f6e7c4',accent:'#ffcf4a',light:'#fff0b0',
  pool:Object.freeze(['squirrel','hare','magpie','dongdong'])}),
 Object.freeze({id:'city',kind:'timer',name:'도시 기계',sub:'딱 10.00에 멈춰요',body:'#f08a3c',bodyDark:'#c0612a',trim:'#fff4e2',accent:'#56aef0',light:'#ffe2b8',
  pool:Object.freeze(['cat','magpie','dongdong-office','guest-2'])}),
 Object.freeze({id:'star',kind:'key',name:'별빛 기계',sub:'열쇠로 칸을 골라요',body:'#5b5fc4',bodyDark:'#3a3d8f',trim:'#f3eaff',accent:'#f5c33b',light:'#e6d8ff',
  pool:Object.freeze(['haechi','dongdong-santa','cat','guest-1']),
  cells:Object.freeze(['squirrel','hare','cat','dongdong','dongdong-office','haechi','dongdong-santa','guest-1'])}),
]);

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
export const plushInfo=id=>PLUSH.find(p=>p.id===id)??null;
