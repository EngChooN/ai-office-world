// 산별 글 자리 글자 위치: 예전 페이지(HEAD hiking/index.html 사본 hiking/old-check.html) vs 새 페이지(틀 조각 + data-mt)
import {chromium} from 'playwright';import {createServer} from 'vite';
const PORT=5414,s=await createServer({server:{port:PORT,host:'127.0.0.1',strictPort:true},logLevel:'silent'});await s.listen();
const b=await chromium.launch();const keys=['GWANAK TRAIL','산길 · 관악산 서울대 계곡 코스','연주대까지','일주문으로 걸어가면 시작돼요','관악산공원 입구 → 연주대 · GPX 참고 경로','입구 일주문에서 시작','545m 구간에서 시작','체크포인트 5곳'];
const grab=async(url,vp)=>{const p=await b.newPage({viewport:vp});await p.goto(url);await p.waitForTimeout(2500);
 const r=await p.evaluate(keys=>{document.getElementById('map').showModal();document.getElementById('plaza-banner').hidden=false;const o={};const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const k=keys.find(k=>n.textContent.trim().startsWith(k));if(!k||o[k])continue;const g=document.createRange();g.selectNodeContents(n);const b=g.getBoundingClientRect();o[k]=[b.x,b.y,b.width,b.height].map(v=>Math.round(v*10)/10).join(',');}return o;},keys);await p.close();return r;};
let bad=0;for(const [name,vp] of [['pc',{width:1920,height:1080}],['phone',{width:390,height:844}],['land',{width:844,height:390}]]){
 const a=await grab(`http://127.0.0.1:${PORT}/hiking/old-check.html?time=12:00`,vp),c=await grab(`http://127.0.0.1:${PORT}/hiking/?time=12:00`,vp);
 for(const k of keys){const same=a[k]===c[k];if(!same)bad++;console.log(name,same?'같음':'다름',k,a[k],'|',c[k]);}}
console.log('다름',bad);await b.close();await s.close();process.exit(0);
