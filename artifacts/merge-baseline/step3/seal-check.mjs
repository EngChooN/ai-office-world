// 정상 원 도장: 예전 글(관악산<br>연주대<small>) vs 새 글(span으로 감쌈) 글자 위치 비교
import {chromium} from 'playwright';import {createServer} from 'vite';
const PORT=5414,s=await createServer({server:{port:PORT,host:'127.0.0.1',strictPort:true},logLevel:'silent'});await s.listen();
const b=await chromium.launch();const out={};
for(const [name,vp] of [['pc',{width:1920,height:1080}],['phone',{width:390,height:844}],['land',{width:844,height:390}]]){
 const p=await b.newPage({viewport:vp});await p.goto(`http://127.0.0.1:${PORT}/hiking/?time=12:00`);await p.waitForSelector('#summit .nb-seal span',{state:'attached'});await p.waitForTimeout(1500);
 const rects=()=>p.evaluate(()=>{const d=document.getElementById('summit');if(!d.open)d.showModal();const seal=d.querySelector('.nb-seal');const r=[];const w=document.createTreeWalker(seal,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const g=document.createRange();g.selectNodeContents(n);const b=g.getBoundingClientRect();r.push([n.textContent,Math.round(b.x*10)/10,Math.round(b.y*10)/10,Math.round(b.width*10)/10]);}return r;});
 const now=await rects();
 await p.evaluate(()=>{document.querySelector('#summit .nb-seal').innerHTML='관악산<br>연주대<small>632 m</small>';});
 const old=await rects();out[name]={same:JSON.stringify(now)===JSON.stringify(old),now,old};await p.close();}
console.log(JSON.stringify(out));await b.close();await s.close();process.exit(0);
