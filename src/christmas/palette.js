// 온라인 크리스마스 색(월드아트, 2026-11-16). three를 쓰지 않는다.
// 기준: 온라인 등산 카툰 팔레트(동동이 빨강 #d9473e·산길 철 초록 #3e5b48·잎 #6c9b4a·도심 창 불빛 크림 #f0e5bc·겨울 눈 #d2dbe8)에서
// 가져오고, 크리스마스에 필요한 색(산타 빨강·털 흰색·금·전구색·밤 눈 그늘)만 더한다. 밤은 「너의 이름은」 남색 밤 톤(palette.js night)을 그대로 쓴다.
export const XMAS=Object.freeze({
 // 옷
 santaRed:'#d23b36',santaRedDark:'#a92c2a',fur:'#f7f2e8',gold:'#e9b949',goldDark:'#b9862c',
 knitCream:'#f1e4c8',pine:'#2f7a52',elfGreen:'#3f9a5c',
 antler:'#a9764a',antlerBand:'#6b4128',antlerEar:'#8c5a36',
 // 눈·땅. snow = 겨울 산 눈(season.js snow lit)보다 조금 밝게 — 마을 바닥은 넓게 깔려 밤 달빛에 푸르게 보여야 한다.
 snow:'#e4ebf4',snowShade:'#b9c8de',snowPacked:'#d3dbe6',snowPath:'#c9d1db',
 stone:'#b5ada2',stoneDark:'#8f877c',
 // 나무·장작
 wood:'#b07a4a',woodDark:'#7d5232',log:'#8a5a36',logEnd:'#e0b98a',bark:'#5e3f2a',
 // 트리
 fir:'#2f7d55',firDark:'#1f5c3f',firLight:'#4c9a63',trunk:'#6b4630',
 // 장식 8종(체험설계 §5-1): 공 4색·지팡이 사탕·종·눈송이·선물상자
 ornRed:'#e0473f',ornGold:'#efc04f',ornBlue:'#4f86d9',ornSilver:'#d7dde6',candy:'#f4f1ea',candyStripe:'#e0473f',bell:'#e8b443',flake:'#eaf6ff',giftBox:'#3fa0a0',giftRibbon:'#f2d15a',
 // 불빛(밤에 켜지는 것). lamp = 도심 창 불빛 크림(city.js CITY_LOOK.light.cream), bulbs = 전구줄 색
 lamp:'#f0e5bc',window:'#ffcf7a',fire:'#ffb347',fireCore:'#fff1b0',fireEdge:'#ff6a2a',star:'#ffe27a',
 bulbs:Object.freeze(['#ffd56a','#ff6b5e','#7fd6ff','#9cf08a','#ffa8e0']),
 // 집 벽·지붕(밝은 동화 마을. 지붕은 거의 눈에 덮인다)
 walls:Object.freeze(['#e9c79f','#cfe0e3','#f2d6d0','#d9e6c8']),roofs:Object.freeze(['#a8473b','#3f6f8f','#6b4a8a','#3f7d5a']),
 door:'#7a4a2f',frame:'#f6efdc',chimney:'#9a5b46',
 // 우체통·썰매·울타리
 post:'#d23b36',postDark:'#9f2a26',sled:'#c94a3a',runner:'#3d3f44',fence:'#a87a52',flag:Object.freeze(['#e0473f','#4f86d9','#efc04f','#3f9a5c']),
 // 눈사람 부품
 coal:'#2b2a2e',carrot:'#f08a3c',twig:'#6e4a2e',topHat:'#2a2830',hatBand:'#d23b36',
});
// 밤 하늘·조명 값. 마을은 늘 눈 오는 밤(체험설계 §1). 해는 지평선 아래, 달은 남동쪽 높이.
export const XMAS_SKY=Object.freeze({
 sun:Object.freeze({elevation:-24,azimuth:300}),
 moon:Object.freeze({elevation:38,azimuth:140,illumination:.92}),
 // 밤 빛 배수(흡연장·등산 밤 공식에 곱함): 마을은 가로등·창·트리 불빛이 많은 밝은 밤이라 반구광·노출을 조금 올리고,
 // 따뜻한 마을 빛(warmFill: 하늘 크림·땅 남색 반구광)을 얹어 얼굴·옷이 회색으로 죽지 않게 한다.
 light:Object.freeze({hemi:1.9,moon:1.25,exposure:1.15,warmFill:Object.freeze({sky:'#ffe2b8',ground:'#7083b0',intensity:.38})}),
 // 눈 내림: 큰 송이(가까움)·작은 송이(멀리) 두 층. 휴대폰은 개수를 줄인다.
 snow:Object.freeze({near:{count:1400,mobile:700,size:.055,speed:.55},far:{count:2600,mobile:1100,size:.03,speed:.8},box:Object.freeze([46,26,46])}),
});
