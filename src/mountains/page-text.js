// 산 페이지 글·기능 스위치 먼저 바꾸기(한 게임 통합 6단계, 11-20). 공통 화면 조각(src/frame/hiking-body.html)에는 관악산 글이 적혀 있어,
// 다른 산 페이지(<html data-mountain="namsan">)는 로딩 화면이 뜨기 전에 이 모듈로 글·꺼진 기능 자리를 바꾼다. 관악산 페이지는 이 모듈을 쓰지 않는다(main.js가 같은 일을 함).
// 가벼워야 한다: three·지형 자료를 부르지 않는 파일만 import 한다. 로딩 안내 문구는 <html data-tips>로 넘긴다(loading-screen.js가 읽음).
import {applyMountainText,applyMountainFeatures} from '../mountain-text.js';
import {NAMSAN_FEATURES,NAMSAN_TEXT} from './namsan-page.js';
const PAGES={namsan:{id:'namsan',text:NAMSAN_TEXT,features:NAMSAN_FEATURES}};
export function applyPageMountain(doc=document){
 const m=PAGES[doc.documentElement.dataset.mountain];if(!m)return null;
 applyMountainText(doc,m.text);applyMountainFeatures(doc,m);
 if(m.text.loadingTips?.length)doc.documentElement.dataset.tips=JSON.stringify(m.text.loadingTips);
 const src=doc.getElementById('source-line');if(src&&m.text.sourceExtra&&!src.querySelector('[data-source-extra]')){const e=doc.createElement('span');e.dataset.sourceExtra='';e.textContent=m.text.sourceExtra;src.append(e);}
 return m;
}
applyPageMountain();
