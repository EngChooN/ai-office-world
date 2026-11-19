// 남산 그림 시안 보드(월드아트): node scripts/namsan/build-namsan-board.mjs
// docs/남산/남산-그림-시안-v1.html(저장소 안 상대 경로) + artifacts/namsan-art/남산-그림-시안-v1-앱용.html(그림을 안에 넣은 한 파일, 앱 미리보기용)
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const J='artifacts/namsan-art/jpg/';
const diff=existsSync('artifacts/namsan-silhouette/silhouette-diff.json')?JSON.parse(readFileSync('artifacts/namsan-silhouette/silhouette-diff.json','utf8')):[];
const dname={south:'남쪽 한강 쪽',west:'서쪽 서울역 쪽',north:'북쪽 명동 쪽',east:'동쪽 장충동 쪽'};
const sections=[
 ['코스 따라 (낮)',[['start-1600x900-day','① 출발 광장 — 정면 위로 전망탑, 이정표·스탬프함(門)'],['stairs-1600x900-day','③ 성곽 큰 계단 — 돌 디딤돌 + 양옆 돌 측벽(땅에 붙음)'],['wall-1600x900-day','⑤ 한양도성 성곽을 오른손에 — 바깥 여장(3m 토막)'],['rest-1600x900-day','④ 서쪽 전망 쉼터 — 성곽을 낮춘 전망 단 위 데크·벤치']]],
 ['정상',[['summit-1600x900-day','게임 속 「남산 전망탑」(받침 집·전망 원반·빨강/흰 안테나)'],['summit-plaza-1600x900-day','정상 광장 — 표지석 「南山 265m」·스탬프함(塔)'],['summit-south-1600x900-day','정상에서 남쪽 — 한강·여의도·관악산 쪽 360° 전망'],['aerial-1600x900-day','위에서 — 도심 한가운데 남산']]],
 ['밤·계절·휴대폰',[['summit-1600x900-night','밤 — 전망 원반 창 띠가 6초마다 색이 바뀜(파랑→보라→분홍→초록→노랑)'],['wall-1600x900-night','밤 성곽길'],['wall-1280x720-autumn','가을(관악산 계절 셰이더 그대로)'],['wall-1280x720-winter','겨울 — 눈·앙상한 나무'],['summit-390x844-night','휴대폰 세로 390×844 · 밤']]],
];
const sil=['south','west','north','east'].map(k=>[`silhouette-${k}`,`${dname[k]} — 게임 윤곽 vs 실제 평균 ${diff.find(d=>d.view===k)?.terrainAndTrees.meanM??'?'}m`]);
function page(src){
 const fig=([f,cap])=>`<figure><img loading="lazy" src="${src(f)}" alt="${cap}"><figcaption>${cap}</figcaption></figure>`;
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>남산 그림 시안 v1 — 월드아트</title>
<style>body{margin:0;background:#f4efe6;color:#27313a;font:15px/1.6 system-ui,'Apple SD Gothic Neo',sans-serif}main{max-width:1200px;margin:0 auto;padding:20px}
h1{font-size:24px;margin:.2em 0}h2{font-size:18px;margin:28px 0 8px;border-left:6px solid #d8473a;padding-left:8px}.lead{background:#fff;border-radius:12px;padding:12px 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}figure{margin:0;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px #0002}
figure img{width:100%;display:block}figcaption{padding:6px 10px;font-size:13px}.wide{grid-template-columns:1fr}table{border-collapse:collapse;background:#fff}td,th{border:1px solid #ddd;padding:4px 8px;font-size:13px}</style></head><body><main>
<h1>남산 그림 시안 v1</h1>
<p class="lead">동동이 화풍으로 남산 지형·성곽 계단길·한양도성 성곽·게임 속 전망탑·정상 광장·도심 원경을 만들었습니다. 빛·하늘·도심·나무·지형 재질은 관악산 것을 그대로 썼습니다. 실제를 따른 것은 산 모양·코스·성곽 위치·도심뿐이고, 전망탑·광장·소품은 게임 디자인입니다. 그림 미리보기 화면이며 아직 게임에 붙이지 않았습니다(월드개발 몫).</p>
${sections.map(([h,list])=>`<h2>${h}</h2><div class="grid">${list.map(fig).join('')}</div>`).join('')}
<h2>실루엣 대조 — 실제 지형 자료(빨간 점선) vs 게임 화면 윤곽(하늘색)</h2>
<div class="grid">${sil.map(fig).join('')}</div>
<div class="grid wide" style="margin-top:12px">${fig(['plan-course-wall','위에서 — OSM 코스(빨강)·한양도성(주황) 원자료 선과 게임 길·성곽'])}</div>
<p style="font-size:13px">실제 = Copernicus 30m 지형 자료(나무 높이 포함). 사진·로드뷰와는 비교하지 않았습니다. 차이 최대값(10~29m)은 정상 광장을 평평하게 한 자리와 숲 가장자리 나무 한 그루씩입니다.</p>
</main></body></html>`;
}
writeFileSync('docs/남산/남산-그림-시안-v1.html',page(f=>`../../artifacts/namsan-art/jpg/${f}.jpg`));
writeFileSync('artifacts/namsan-art/남산-그림-시안-v1-앱용.html',page(f=>`data:image/jpeg;base64,${readFileSync(J+f+'.jpg').toString('base64')}`));
console.log('보드 2개 완료');
