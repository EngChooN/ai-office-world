import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {htmlInclude} from './scripts/html-include.mjs';
// GitHub Pages 하위 경로 배포는 BASE_PATH=/ai-office-world/ 로 빌드한다(scripts/deploy-pages.mjs). 기본은 '/'.
const base=process.env.BASE_PATH||'/';
// 다중 페이지(2026-11-08 메타버스 통합): / 허브 · /hiking/ 온라인 등산 · /smoking/ 온라인 흡연장 · /christmas/ 온라인 크리스마스(11-16) · /claw/ 온라인 인형뽑기(11-23).
// 세 페이지 모두 같은 base를 쓰므로 에셋(public·assets)은 `${import.meta.env.BASE_URL}assets/…`로 한 벌을 같이 받는다.
// 카툰 하나만 남아(2026-11-06) 모드별 청크 이름(mode-toon-·mode-realistic-)과 실사 inventory.json 개발 서버 경로는 쓰지 않는다.
export const PAGES={main:'index.html',hiking:'hiking/index.html',namsan:'hiking/namsan/index.html',smoking:'smoking/index.html',christmas:'christmas/index.html',claw:'claw/index.html'};
// 의견 보내기(src/feedback.js)의 「빌드」 줄에 쓰는 빌드 날짜(서울)
const BUILD_DATE=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
// 인형뽑기 손님 인형(다른 회사 캐릭터, 사용 허락 전, 11-23): VITE_CLAW_PRIVATE=1이 아니면 private/claw/ 파일을 아예 읽지 않는다.
// (src/claw/claw-guest.js의 import.meta.glob은 조건문 안에 있어도 빌드 때 펼쳐져 그림 파일이 dist에 나왔다 — 배포 검사 scripts/check-claw-private.mjs가 잡음)
const CLAW_PRIVATE=process.env.VITE_CLAW_PRIVATE==='1';
const clawPrivateGuard=()=>({name:'claw-private-guard',enforce:'pre',load(id){if(!CLAW_PRIVATE&&id.replace(/\\/g,'/').includes('/private/claw/'))return 'export default null;';}});
export default defineConfig({base,plugins:[clawPrivateGuard(),htmlInclude()],define:{__BUILD_DATE__:JSON.stringify(BUILD_DATE)},build:{sourcemap:true,chunkSizeWarningLimit:1500,rollupOptions:{input:Object.fromEntries(Object.entries(PAGES).map(([k,v])=>[k,resolve(import.meta.dirname,v)]))}}});
