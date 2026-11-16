// 밤 도심 화면 실측: 밝은 불빛 평균색·주황 비율·도심 쪽 지평선 빛무리 색. 사용: node artifacts/probe/measure-night.mjs a.png b.png
import {chromium} from '@playwright/test';import {readFileSync} from 'node:fs';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();
for(const f of process.argv.slice(2)){
 const url='data:image/png;base64,'+readFileSync(f).toString('base64');
 const r=await p.evaluate(async url=>{const im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
  const {data,width:W,height:H}=x.getImageData(0,0,c.width,c.height);let n=0,o=0,s=[0,0,0],cn=0,cs=[0,0,0];
  // 하늘 지평선 줄 찾기: 화면 가운데 열에서 위→아래로 내려가다 도심 불빛 직전. 대신 화면 상단 15~45% 중 가장 밝은 가로줄 평균.
  const rows=[];for(let y=0;y<H*.6;y++){let t=[0,0,0];for(let xx=W*.3|0;xx<W*.7;xx++){const i=(y*W+xx)*4;t[0]+=data[i];t[1]+=data[i+1];t[2]+=data[i+2];}const m=W*.4;rows.push([y,t[0]/m,t[1]/m,t[2]/m]);}
  for(let i=W*400*4;i<W*520*4;i+=4){const R=data[i],G=data[i+1],B=data[i+2],l=.299*R+.587*G+.114*B;if(l>140){n++;s[0]+=R;s[1]+=G;s[2]+=B;if(R-B>80&&R-G>30)o++;else if(l>190){cn++;cs[0]+=R;cs[1]+=G;cs[2]+=B;}}}
  const h=v=>Math.round(v).toString(16).padStart(2,'0');
  rows.sort((a,b)=>(b[1]+b[2]+b[3])-(a[1]+a[2]+a[3]));const top=rows.slice(0,5);
  return {bright:n,avg:'#'+s.map(v=>h(v/Math.max(1,n))).join(''),cream:'#'+cs.map(v=>h(v/Math.max(1,cn))).join(''),orange:+(100*o/Math.max(1,n)).toFixed(1),glow:top.map(r=>`y${r[0]}#${h(r[1])}${h(r[2])}${h(r[3])}`).join(' ')};},url);
 console.log(f.split('/').pop(),JSON.stringify(r));}
await b.close();
