// 편집본 장면 가운데 프레임 모음(점검용): node scripts/promo/_sheet.mjs <릴스 폴더> <mp4> [cols]
import {spawnSync} from 'node:child_process';import {mkdirSync,readdirSync,readFileSync} from 'node:fs';
const [dir,mp4,colsArg]=process.argv.slice(2);const cols=+(colsArg||4);const t=JSON.parse(readFileSync(`${dir}/reels-timeline.json`,'utf8'));mkdirSync(`${dir}/check`,{recursive:true});
t.scenes.forEach((s,i)=>{const at=(s.from+s.to)/2;spawnSync('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',at.toFixed(2),'-i',`${dir}/${mp4}`,'-frames:v','1','-vf','scale=270:480',`${dir}/check/${String(i).padStart(2,'0')}.png`]);});
const files=readdirSync(`${dir}/check`).filter(f=>/^\d\d\.png$/.test(f)).sort();const args=['-hide_banner','-loglevel','error','-y'];files.forEach(f=>args.push('-i',`${dir}/check/${f}`));
const n=files.length,rows=Math.ceil(n/cols);let f='';for(let r=0;r<rows;r++){const row=[];for(let c=0;c<cols;c++){const k=r*cols+c;if(k<n)row.push(`[${k}:v]`);}const padf=row.length<cols?`,pad=${270*cols}:480:0:0:black`:'';f+=row.length>1?row.join('')+`hstack=inputs=${row.length}${padf}[r${r}];`:row[0]+`copy${padf}[r${r}];`;}
f+=rows>1?Array.from({length:rows},(_,r)=>`[r${r}]`).join('')+`vstack=inputs=${rows}`:'[r0]copy';
const r=spawnSync('/opt/homebrew/bin/ffmpeg',[...args,'-filter_complex',f,`${dir}/check/sheet.png`]);console.log('sheet',n,r.status,r.stderr.toString().slice(0,200));
