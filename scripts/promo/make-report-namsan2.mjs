// 남산 릴스 2차 보고 HTML(월드마케팅, 2026-11-22 저녁): 대표 피드백 → 바꾼 점 → 세 편 콘티·장면 캡처·캡션·결정 사항을 한 파일에(그림은 base64, 앱 결과물 창용).
//   node scripts/promo/make-report-namsan2.mjs → artifacts/reels-winter-2026-11-22/남산-릴스-2차-보고.html
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const B='artifacts/reels-winter-2026-11-22';
const img=p=>existsSync(p)?`data:image/jpeg;base64,${readFileSync(p).toString("base64")}`:'';
const tl=r=>JSON.parse(readFileSync(`${B}/${r}/reels-timeline.json`,'utf8'));
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const rows=t=>t.scenes.map(s=>`<tr><td>${s.from.toFixed(1)}–${s.to.toFixed(1)}</td><td>${esc(s.id)}</td><td>${esc((s.big??'').replace(/\n/g,' / '))||'<span class=muted>(말풍선만)</span>'}</td><td>${esc(s.small??'')}</td></tr>`).join('');
const R={date:tl('date'),friends:tl('friends'),bus:tl('bus')};
const block=(key,title,hook,story)=>`<section class="card"><h3>${title} <small class="muted">${R[key].seconds}초 · 장면 ${R[key].scenes.length}개</small></h3>
<div class="cover"><img src="${img(`${B}/${key}/cover-s.jpg`)}" alt="표지"><div><p><b>훅:</b> ${esc(hook)}</p><p>${story}</p><p class="muted">파일 <code>${key}/${key}-reels.mp4</code> · 미리보기 <code>${key}/${key}-preview.html</code></p></div></div>
<img src="${img(`${B}/${key}/check/sheet-s.jpg`)}" alt="장면 모음" style="margin-top:10px">
<table><tr><th>초</th><th>장면</th><th>큰 자막</th><th>작은 자막</th></tr>${rows(R[key])}</table></section>`;
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>남산 릴스 2차(둘이·여럿·버스) 보고 — 2026-11-22 저녁</title>
<style>
body{margin:0;background:#f6f1e6;color:#3a2d18;font-family:"Apple SD Gothic Neo",Pretendard,-apple-system,sans-serif;line-height:1.6}
main{max-width:980px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:26px;margin:0 0 6px}h2{font-size:20px;margin:36px 0 10px;padding-bottom:6px;border-bottom:3px solid #d9c79d}h3{font-size:17px;margin:0 0 8px}
.sum{background:#fbf3df;border:2px solid #d9c79d;border-radius:14px;padding:14px 18px}.sum b{color:#b8452e}
table{border-collapse:collapse;width:100%;font-size:14px;background:#fff;margin-top:10px}th,td{border:1px solid #e3d8bd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#efe6cf}
.card{background:#fff;border:2px solid #e3d8bd;border-radius:14px;padding:14px;margin:14px 0}.card img{width:100%;height:auto;border-radius:8px;display:block}
.cover{display:flex;gap:14px;align-items:flex-start}.cover img{width:170px;border-radius:10px;border:2px solid #d9c79d}
small,.muted{color:#7a6440}ul{padding-left:20px}li{margin:3px 0}
.dec{background:#fff;border-left:6px solid #b8452e;padding:10px 14px;border-radius:0 10px 10px 0;margin:10px 0}
code{background:#efe6cf;padding:1px 5px;border-radius:4px;font-size:13px}
.fb{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:700px){.fb{grid-template-columns:1fr}}
.fb div{background:#fff;border:2px solid #e3d8bd;border-radius:10px;padding:8px 12px;font-size:14px}.fb b{display:block;color:#2f6b4a}
</style></head><body><main>
<h1>남산 릴스 2차 — 「오늘 나랑 남산 갈래?」 · 「퇴근하고 남산 모임」 · 「순환버스 창밖」</h1>
<p class="muted">월드마케팅 · 2026-11-22 저녁 · 대표 피드백(11-22) 반영 · 게임 코드는 안 바꿈</p>
<div class="sum"><b>결과:</b> 남산 릴스를 주제별 세 편으로 다시 만들었습니다. 모두 실제 게임을 두 명~네 명이 같은 서버에 접속해 찍었고, 말풍선 대화가 들어갑니다.
장면 수를 줄이고 한 장면을 평균 5초로 늘렸습니다(전: 12장면 35초 → 둘이 편 11장면 ${R.date.seconds}초).</div>

<h2>1. 대표 피드백 → 바꾼 점</h2>
<div class="fb">
<div><b>다른 사람들이랑 즐기는 모습이 더 필요</b>둘이 편은 콩이와 2명, 여럿 편은 4명(콩이·산쟁이·야경러)이 같은 서버에 들어와 손 흔들기·같이 걷기·같이 버스·단체 인증.</div>
<div><b>서로 말하는 모습이 없다</b>모든 장면에 게임 말풍선 대화를 넣었습니다(「오늘 나랑 남산 갈래?」 「계단 힘들어」 「우리 자물쇠 💛」 「다음엔 진짜로 가자」…). 자막은 그만큼 줄였습니다.</div>
<div><b>장면이 너무 빨리 지나감</b>장면당 평균 2.9초 → 5초. 말풍선이 뜨고 읽을 시간(4초)을 기준으로 잘랐습니다.</div>
<div><b>둘이서 사랑의 자물쇠</b>난간에 나란히 서서 콩이가 먼저 「콩이 ♥ 동동」, 동동이 「동동 ♥ 콩이」(한마디 기능)를 걸고 「우리 자물쇠 💛」.</div>
<div><b>전망대에서 둘이 야경, 달달하게</b>타워 전망대 유리창 앞 둘이(밤) → 정상 벤치에 동동이 앉고 콩이가 옆에 서서 「야경 예쁘다 ✨」 「다음엔 진짜로 가자」로 끝.</div>
<div><b>순환버스 타고 가면서 주변 경치</b>버스 안 1인칭으로 옆자리 콩이 → 창밖 단풍 숲 → 반대쪽 창을 돌아봅니다. 버스 편은 창밖만 18초.</div>
<div><b>주제를 두세 개로 나눠도 됨</b>둘이(데이트) · 여럿(모임) · 버스(창밖) 세 편. 올리는 순서 추천은 §4.</div>
</div>

<h2>2. 세 편</h2>
${block('date','① 둘이 — 「오늘 나랑 남산 갈래?」','출발 광장에서 콩이가 「오늘 나랑 남산 갈래? 🍂」 → 동동 「콜! 지금 출발」','같이 계단(「계단 힘들어」「조금만 더!」) → 둘이 순환버스·창밖(「와 창밖 봐 🍁」) → 노을 난간에서 자물쇠 둘이 걸기(「우리 자물쇠 💛」) → 타워 전망대 둘이 → 벤치 야경(「야경 예쁘다 ✨」「다음엔 진짜로 가자」) → AI Office → 엔딩.')}
${block('friends','② 여럿 — 「퇴근하고 남산 모임」','출발 광장에 친구 셋이 손 흔들며 「오늘 야경 보러 가요 🌃」「같이 가요 🙌」','넷이 계단(「다들 빨라」「천천히 와요~」) → 넷이 순환버스·창밖(「버스 타니까 편하다」) → 노을 정상석 앞 단체 인증·손 흔들기(「정상 인증 📸」「다 같이 찍자!」) → 야경 벤치 수다(「야경 미쳤다」「내일 또 올 사람?」「나! 🙋」) → AI Office → 엔딩.')}
${block('bus','③ 버스 — 「순환버스 타고 남산 정상까지」','정류장에 버스가 서는 장면','1인칭으로 왼쪽 창 단풍 숲 → 더 왼쪽 → 반대쪽 창 노을 → 정상 정류장 도착 → 전망탑 쪽으로 걷기 → AI Office → 엔딩. 혼자 찍은 편이라 말풍선 없음.')}

<h2>3. 확인한 것 · 못 한 것</h2>
<ul>
<li>세 편 모두 장면별 콘솔 오류 0. 함께 걷기 서버(로컬)에 실제로 2~4명이 붙어 자리·말풍선·자물쇠(서버 저장)·버스 탑승이 서로 보이는 것을 확인했습니다.</li>
<li>편집본 장면 가운데 프레임을 모아 눈으로 확인했습니다(위 장면 모음).</li>
<li>자막 규칙(11-14 관악산 릴스 기준: 글꼴·외곽선·안전 영역·0.2초 교차 페이드·게임 소리만·-16 LUFS)은 그대로입니다. 훅 자막만 아래쪽에 두었습니다(위는 말풍선 자리).</li>
<li><b>촬영용 보조광:</b> 밤 타워 전망대 안이 너무 어두워 둘이 안 보여서, 촬영 창에만 점광원 하나를 넣고 찍었습니다. 게임에는 없는 빛입니다(게임 쪽 개선은 월드공간·월드개발 몫, §5).</li>
<li><b>확인 못 함:</b> 실제 아이폰에서 인스타 UI와 겹쳐 보기. 친구 창은 자동 조작이라 사람이 치는 채팅 속도와 다를 수 있습니다.</li>
</ul>

<h2>4. 정해 주실 것</h2>
<div class="dec"><b>① 이 세 편으로 갈지.</b> 추천: 둘이 편을 먼저(주제가 가장 또렷), 이틀 뒤 여럿 편, 버스 편은 사이에 짧게. 한 편에 다 넣는 것보다 낫다고 봅니다(대표 미확인).</div>
<div class="dec"><b>② 친구 닉네임</b> 콩이·산쟁이·야경러는 촬영용 추천안입니다. 바꾸면 그대로 다시 찍습니다(자동 녹화라 한 편 10분).</div>
<div class="dec"><b>③ 말풍선 문구</b>(「오늘 나랑 남산 갈래? 🍂」「다음엔 진짜로 가자」 등) 고칠 것이 있으면 알려 주세요. 자막·캡션은 <code>인스타-캡션-남산2차.md</code>.</div>
<div class="dec"><b>④ 모이는 시간</b> 여럿 편 캡션·고정 댓글에 "매일 밤 9시 남산 1 서버" 같은 약속을 적을지(11-19 측정대로 들어온 사람이 0명이라 모이는 시간이 있어야 서로 만납니다).</div>

<h2>5. 발견(다른 담당자 몫)</h2>
<ul>
<li>밤 타워 전망대 안이 어둡습니다(동동이가 실루엣). 전망대 안 조명 한두 개가 있으면 둘이 야경 보는 장면이 게임에서도 예쁘게 보일 것 같습니다 → 월드공간·월드개발.</li>
<li>순환버스 안 1인칭에서 옆자리 사람이 너무 가까워 머리가 화면을 채웁니다(자리 배정이 ID 해시라 겹치기도). 창가 자리를 먼저 주는 규칙이 있으면 좋겠습니다 → 월드개발(추정, 우선순위 낮음).</li>
<li>남산 정상 광장 한가운데에서는 밤에 서울 불빛이 안 보임(11-22 낮 보고와 같음, 벤치 자리에서만 보임).</li>
</ul>

<h2>6. 다시 만들기</h2>
<p><code>node scripts/promo/record-reels-namsan2.mjs date|friends|bus [장면]</code> → <code>node scripts/promo/edit-reels-winter.mjs date|friends|bus</code> → <code>node scripts/promo/_sheet.mjs artifacts/reels-winter-2026-11-22/&lt;편&gt; &lt;편&gt;-reels.mp4</code>. 변경 기록 <code>docs/변경기록-2026-11-22-남산-릴스-2차.md</code>.</p>
</main></body></html>`;
writeFileSync(`${B}/남산-릴스-2차-보고.html`,html);console.log('✔',`${B}/남산-릴스-2차-보고.html`,(html.length/1048576).toFixed(2),'MB');
