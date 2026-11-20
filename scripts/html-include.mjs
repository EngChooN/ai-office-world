// 페이지 HTML 끼워 넣기(한 게임 통합 3단계, 11-20). `<!--#include src/frame/hiking-body.html-->`를 그 파일 내용으로 바꾼다.
// 등산 화면 틀(로딩 화면·HUD·대화창)을 관악산(hiking/index.html)과 남산(6단계, hiking/namsan/index.html)이 같이 쓰기 위한 준비.
// vite(개발 서버·빌드)는 htmlInclude() 플러그인으로, node 시험은 readPage()로 같은 결과를 읽는다. 산마다 다른 글은 산 정의 text → src/mountain-text.js.
import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'..');
const INCLUDE=/<!--#include ([\w./-]+)-->/g;
export const expandIncludes=(html,root=ROOT)=>html.replace(INCLUDE,(_,file)=>readFileSync(resolve(root,file),'utf8'));
export const readPage=(file,root=ROOT)=>expandIncludes(readFileSync(resolve(root,file),'utf8'),root);
export function htmlInclude(){
 return {name:'html-include',
  transformIndexHtml:{order:'pre',handler:html=>expandIncludes(html)},
  // 끼워 넣는 조각을 고치면 개발 서버가 페이지를 새로 고친다
  handleHotUpdate({file,server}){if(file.startsWith(resolve(ROOT,'src/frame'))&&file.endsWith('.html')){server.ws.send({type:'full-reload'});return [];}}};
}
