// 산마다 다른 화면 글 채우기(한 게임 통합 3단계, 11-20). 공통 화면 틀(src/frame/hiking-body.html)에서
//  data-mt="키" = 글자, data-mt-title="키" = title, data-mt-label="키" = aria-label 자리를 산 정의 text 값으로 바꾼다.
// 값이 없는 키는 틀에 적힌 글을 그대로 둔다. 관악산 text는 틀의 글과 같아서 관악산 화면은 바뀌지 않는다.
// 로딩 안내 문구(loadingTips)는 로딩 화면이 main.js보다 먼저 뜨므로 여기서 다루지 않는다(loading-screen.js의 data-tips, 남산 페이지 연결은 6단계).
export const MT_ATTRS=Object.freeze([['mt',null],['mtTitle','title'],['mtLabel','aria-label']]);
export function applyMountainText(doc,text){
 if(!doc||!text)return 0;let changed=0;
 for(const [data,attr] of MT_ATTRS){
  const sel=`[data-${data.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}]`;
  for(const el of doc.querySelectorAll(sel)){
   const v=text[el.dataset[data]];if(typeof v!=='string')continue;
   if(attr){if(el.getAttribute(attr)!==v){el.setAttribute(attr,v);changed++;}}
   else if(el.textContent!==v){el.textContent=v;changed++;}
  }
 }
 if(typeof text.pageTitle==='string'&&doc.title!==text.pageTitle){doc.title=text.pageTitle;changed++;}
 return changed;
}
