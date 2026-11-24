// 겨울 릴스 보고 HTML(월드마케팅, 2026-11-22): 조사·콘티·장면 캡처·캡션·결정 사항을 한 파일에(그림은 base64로 넣음, 앱 결과물 창용).
//   node scripts/promo/make-report-winter.mjs → artifacts/reels-winter-2026-11-22/겨울-릴스-보고.html
import {readFileSync,writeFileSync} from 'node:fs';
const B='artifacts/reels-winter-2026-11-22';
const img=p=>`data:image/jpeg;base64,${readFileSync(p).toString("base64")}`;
const tl=r=>JSON.parse(readFileSync(`${B}/${r}/reels-timeline.json`,'utf8'));
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const rows=t=>t.scenes.map(s=>`<tr><td>${s.from.toFixed(1)}–${s.to.toFixed(1)}</td><td>${esc(s.id)}</td><td>${esc((s.big??'').replace(/\n/g,' / '))}</td><td>${esc(s.small??'')}</td></tr>`).join('');
const N=tl('namsan'),X=tl('christmas');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>겨울 릴스 2편(남산·온라인 크리스마스) 보고 — 2026-11-22</title>
<style>
body{margin:0;background:#f6f1e6;color:#3a2d18;font-family:"Apple SD Gothic Neo",Pretendard,-apple-system,sans-serif;line-height:1.6}
main{max-width:980px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:26px;margin:0 0 6px}h2{font-size:20px;margin:36px 0 10px;padding-bottom:6px;border-bottom:3px solid #d9c79d}h3{font-size:16px;margin:20px 0 6px}
.sum{background:#fbf3df;border:2px solid #d9c79d;border-radius:14px;padding:14px 18px}
.sum b{color:#b8452e}
table{border-collapse:collapse;width:100%;font-size:14px;background:#fff}th,td{border:1px solid #e3d8bd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#efe6cf}
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:700px){.two{grid-template-columns:1fr}}
.card{background:#fff;border:2px solid #e3d8bd;border-radius:14px;padding:12px}
.card img{width:100%;height:auto;border-radius:8px;display:block}
.cover{display:flex;gap:14px;align-items:flex-start}.cover img{width:200px;border-radius:10px;border:2px solid #d9c79d}
small,.muted{color:#7a6440}
.tag{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:700;margin-right:4px}
.ok{background:#dcefd8;color:#2f6b4a}.est{background:#fde7c8;color:#9a5a12}.no{background:#f7d6d0;color:#8a2b1c}
ul{padding-left:20px}li{margin:3px 0}
.dec{background:#fff;border-left:6px solid #b8452e;padding:10px 14px;border-radius:0 10px 10px 0;margin:10px 0}
code{background:#efe6cf;padding:1px 5px;border-radius:4px;font-size:13px}
</style></head><body><main>
<h1>겨울 릴스 2편 — 「퇴근하고 남산 야경」 · 「크리스마스에 약속 없으면 여기로」</h1>
<div class="muted">월드마케팅 · 2026-11-22 · 대표 확인 전(공개 전 확인 규칙) · 영상 원본은 <code>~/gwanak-hiking/artifacts/reels-winter-2026-11-22/</code></div>

<div class="sum" style="margin-top:16px">
<b>결과:</b> 릴스 2편을 끝까지 만들었습니다(남산 ${N.seconds}초, 크리스마스 ${X.seconds}초, 세로 1080×1920, 게임 소리만). 미리보기는 이 보고와 같이 올린 「남산 릴스 미리보기」·「온라인 크리스마스 릴스 미리보기」에서 바로 틀어 볼 수 있습니다.<br>
<b>대표 눈에 달라지는 점:</b> 처음 3초가 "집에서 남산 야경 보는 동동이"·"루돌프 썰매로 눈마을 위를 나는 동동이"로 시작하고, 자막이 글로 먼저 내용을 말합니다(소리 끄고 보는 사람 기준).<br>
<b>정해 주실 것:</b> ① 이대로 올릴지 ② 훅 문구(아래 후보) ③ 올리는 순서·날짜(추천: 남산 먼저 이번 주, 크리스마스는 12월 1일 전후와 12월 20일 전후 두 번).
</div>

<h2>1. 왜 아무도 안 들어오나 — 조사에서 본 것 (조사 시점 2026-11-22)</h2>
<ul>
<li><b>비슷한 게임이 지금 크게 뜨는 중입니다.</b> 「Untitled Goose Game」 팀의 협동 걷기 게임 <b>Big Walk</b>(2026-08-04 출시)가 2026년 메타크리틱 최고 평점(93, 틱톡 게시물 인용)·스팀 리뷰 3만 2천 개 94% 긍정으로 올해 가장 화제인 협동 게임입니다. 틱톡에서 "친구랑 걷기만 하는 게임" 클립이 수만 좋아요를 받습니다. 모바일 협동 등산 게임 <b>Switchback</b>도 틱톡으로 알려졌습니다. → 우리 등산도 같은 결에 있습니다. 다만 저들은 "친구 목소리가 멀어지면 작아진다"처럼 <b>한 줄로 설명되는 재미</b>와 <b>친구가 당하는 장면</b>으로 퍼졌습니다. 우리 전 릴스(관악산 40초)는 기능을 12개 나열해 "무엇이 재밌는지" 한 줄이 없었습니다(추정).</li>
<li><b>첫 3초가 전부입니다.</b> 2026년 국내 릴스 분석 글들은 공통으로 ① 첫 3초 안에 궁금증·상황 ② 소리 없이 봐도 되는 화면 글자 ③ 같은 영상에 훅을 여러 개 만들어 3초 유지율 비교를 권합니다. 수치(이탈 50~65%)는 2차 블로그 인용이라 믿을 만한 원문은 못 찾았습니다.</li>
<li><b>11월 말~12월 릴스 흐름:</b> POV·"~하는 사람 모여라"형 공감 훅, 셋로그(친구 화면 분할) 등 "친구와 같이"가 강세. 크리스마스 콘텐츠는 11월 1일부터 올라오고, 12월엔 오래된 캐럴이 음원 차트를 다시 차지합니다. 크리스마스 릴스는 "따뜻함·아늑함" 쪽이 잘 맞는다는 전망이 있습니다.</li>
<li><b>우리 쪽 사실(11-19 월드개발 측정):</b> 릴스를 보고 들어온 사람이 처음 보는 화면이 「0명·아무도 없어요」였고, 등산 첫 로딩이 휴대폰 회선에서 약 58초였습니다. 1단계 접속 유도(친구 부르기·0명 문구·<code>?spot=</code> 바로가기)는 구현됐습니다. 남은 것은 <b>"지금 가면 사람이 있다"는 시간 약속</b>(개발 없이 됨)입니다.</li>
</ul>
<h3>그래서 이번 릴스에서 바꾼 것</h3>
<ul>
<li>훅을 상황 한 줄로: 「퇴근하고 남산 야경 보러 감」 / 「크리스마스에 약속 없으면 여기로」. 기능 나열 대신 <b>장소·상황·같이</b>.</li>
<li>길이를 40초 → 31~35초로 줄이고, 장면마다 2.2~5초. 친구가 당하는 장면(눈싸움 맞음·헤드샷)과 "같이"가 보이는 장면(트리·모닥불·채팅)을 넣었습니다.</li>
<li>AI Office 장면·엔딩 카드는 11-14 확정 형식을 그대로 썼습니다(브랜드 일관).</li>
</ul>

<h2>2. 릴스 ① 남산 — 「퇴근하고 남산 야경 보러 감」 (${N.seconds}초)</h2>
<div class="cover"><img src="${img(`${B}/namsan/check/cover-s.jpg`)}" alt="남산 릴스 표지"><div>
<b>훅(0–3초):</b> 밤 정상 벤치에 앉은 동동이 + 서울 불빛(화면 글자만, HUD 없음).<br>
<b>흐름:</b> 산 고르기에 남산 추가 → 백범광장 출발 → 성곽 계단 → 순환버스 → 약수 → 정상 인증·스탬프 → 사랑의 자물쇠 → 쌍안경(관악산도 보임 = 등산 교차 홍보) → 벤치 야경 → AI Office → 엔딩.<br>
<b>소리:</b> 게임 소리만(발소리·버스·효과음). 배경음악 없음(인스타에서 대표가 얹을 수 있게).</div></div>
<table style="margin-top:12px"><tr><th>초</th><th>장면</th><th>큰 글</th><th>작은 글</th></tr>${rows(N)}</table>
<div class="card" style="margin-top:12px"><img src="${img(`${B}/namsan/check/sheet.jpg`)}" alt="남산 릴스 장면별 화면"><small>장면 가운데 프레임 12장(편집본에서 뽑음)</small></div>

<h2>3. 릴스 ② 온라인 크리스마스 — 「크리스마스에 약속 없으면 여기로」 (${X.seconds}초)</h2>
<div class="cover"><img src="${img(`${B}/christmas/check/cover-s.jpg`)}" alt="크리스마스 릴스 표지"><div>
<b>훅(0–3.5초):</b> 루돌프 하늘 썰매로 눈마을 위를 날아 트리 쪽으로(별 흔적, HUD 없음).<br>
<b>흐름:</b> 트리 꾸미기(친구 옆에) → 눈싸움(친구 공에 맞아 화면 눈투성이 → 되던져 헤드샷) → 눈썰매 → 회전목마 → 스케이트장 → 모닥불(친구 채팅 "메리 크리스마스!") → AI Office → 엔딩.<br>
<b>소리:</b> 게임 소리 + 캐럴(미 공군 군악대 녹음, 퍼블릭 도메인, 11-16 대표 결정) 그대로.</div></div>
<table style="margin-top:12px"><tr><th>초</th><th>장면</th><th>큰 글</th><th>작은 글</th></tr>${rows(X)}</table>
<div class="card" style="margin-top:12px"><img src="${img(`${B}/christmas/check/sheet.jpg`)}" alt="크리스마스 릴스 장면별 화면"><small>장면 가운데 프레임 9장</small></div>

<h2>4. 확인한 것 / 확인 못 한 것</h2>
<ul>
<li><span class="tag ok">확인</span> 두 편 모두 자동 조작으로 실제 게임을 찍었고(휴대폰 세로 창, 콘솔 오류 0), 장면마다 상태를 기록했습니다(스탬프 찍힘·자물쇠 1개 걸림·쌍안경 「관악산」 이름표·눈싸움 맞음 2회·트리 장식 2개·버스 탑승·벤치 앉음).</li>
<li><span class="tag ok">확인</span> 자막은 11-14 규칙(정가운데 x 120~960, y 250~1500, 외곽선 8px) 안. 카드·판이 아래를 덮는 장면(산 고르기·자물쇠·트리)은 자막을 위쪽에 뒀고, 산 고르기만 어두운 띠를 깔았습니다.</li>
<li><span class="tag ok">확인</span> 소리 출처: 남산 발소리 CC0·능선 바위 CC BY(캡션에 표기), 크리스마스 캐럴 퍼블릭 도메인·효과음 자체 제작/CC0. 날씨 API 안 씀(11-13 결정).</li>
<li><span class="tag est">확인 못 함</span> 실제 아이폰에서 인스타 UI와 겹쳐 보기. 인스타 음원을 얹을지는 올릴 때 대표 판단.</li>
<li><span class="tag est">확인 못 함</span> "비슷한 게임이 인기"의 숫자(Big Walk 100만 장 판매 등)는 틱톡 게시물 인용이라 공식 수치는 아닙니다.</li>
<li><span class="tag no">발견</span> 남산 정상 광장 한가운데에서는 밤에 서울 불빛이 안 보이고(광장 바닥이 가림), 난간 쪽 벤치 자리에서만 보입니다. 릴스는 벤치 장면으로 찍어 문제없지만, 들어온 사람이 "야경"을 바로 못 볼 수 있습니다 → 월드공간·월드개발에 전달할 사항(추정: 광장 가장자리로 첫 위치를 옮기거나 정상 도착 때 벤치 쪽을 보게).</li>
</ul>

<h2>5. 올리는 방법 제안 (추천안, 대표 미확인)</h2>
<ul>
<li><b>순서·시기:</b> 남산을 먼저(이번 주 평일 저녁 6~8시, "퇴근" 훅과 맞춤), 크리스마스는 12월 1일 전후에 1차, 12월 20일 전후에 같은 영상을 훅만 바꿔 2차(「12월 25일 약속 없는 사람」).</li>
<li><b>스토리 링크 스티커:</b> 릴스를 올린 날 스토리에 같은 영상 + 링크 스티커(꼬리표 주소는 캡션 문서에 적음). 릴스 본문 링크는 눌리지 않습니다.</li>
<li><b>"지금 가면 사람이 있다" 만들기:</b> 캡션·고정 댓글에 모이는 시간을 적습니다(예: 「매일 밤 9시 눈마을 2서버 눈썰매 경주」). 개발 없이 되는 가장 싼 장치(11-19 보고 ④d)입니다. 그 시간엔 우리가 먼저 들어가 있어야 합니다.</li>
<li><b>같은 영상을 유튜브 쇼츠·틱톡에도</b> 그대로 올립니다(세로 규격 같음). 계정 만들기는 대표 몫.</li>
<li><b>훅 A/B:</b> 같은 영상에 훅 자막만 다른 2개를 올려 3초 유지율을 비교(인스타 인사이트). 후보는 아래.</li>
</ul>
<div class="dec"><b>훅 문구 후보</b><br>
남산: ① 퇴근하고 남산 야경 보러 감 (지금 영상) ② 집에서 남산 정상 17분 ③ 남산 야경, 설치 없이 바로<br>
크리스마스: ① 크리스마스에 약속 없으면 여기로 (지금 영상) ② 루돌프 썰매 내가 운전함 ③ 친구랑 눈싸움할 사람 모여라</div>

<h2>6. 캡션·해시태그</h2>
<p>복사용 전문은 <code>artifacts/reels-winter-2026-11-22/인스타-캡션.md</code>(남산·크리스마스 본문 + 고정 댓글, 출처 문구 포함, 해시태그 5개씩).</p>

<h2>7. 출처 (조사 시점 2026-11-22)</h2>
<ul class="muted" style="font-size:13px">
<li>Big Walk: Steam 상품 페이지(리뷰 32,663개 94% 긍정), Wikipedia "Big Walk"(2026-08-04 출시), 틱톡 @itstherespawn(메타크리틱 93 인용)·@landfallgames·@jacobm.stevens 게시물</li>
<li>Switchback·cozy 등산 게임: 틱톡 discover "New Game Hiking", @lupusgg 게시물</li>
<li>릴스 첫 3초·훅: maily.so "2026 인스타 릴스, 조회수를 결정하는 7가지", brunch "첫 3초가 릴스의 운명이다", highoutputclub 릴스 훅 글(수치는 2차 인용)</li>
<li>2026년 11월 밈·포맷: instablank 밈 사전(2026-11), careet "요즘 뜨는 밈"(2026-11-11), polarad "인스타그램 릴스 트렌드: 2026년 Z세대"</li>
<li>크리스마스 콘텐츠 흐름: newengen "Christmas TikTok & Instagram trends", aivideocut "How to Go Viral This Winter 2025-2026", 국내 음원 차트 기사(insight)</li>
<li>우리 쪽: docs/마케팅/접속유도-장치-설계-견적-v1.md(11-19 측정), docs/마케팅/인스타-꼬리표-주소표-v1.md, docs/릴스-콘티.md·릴스-사용조건.md(11-11), artifacts/reels/인스타-캡션.md(11-14)</li>
</ul>
<p class="muted" style="font-size:13px">남산 서울타워 2026년 겨울 행사·남산 관련 숏폼 인기 자료는 찾지 못했습니다(서울시 자료는 2024~2025년 것). 영상에는 실제 행사 언급을 넣지 않았습니다.</p>
</main></body></html>`;
writeFileSync(`${B}/겨울-릴스-보고.html`,html);console.log('✔',`${B}/겨울-릴스-보고.html`,(html.length/1048576).toFixed(2)+'MB');
