// src.html의 {{img:이름}}을 img/이름.jpg 데이터로 바꿔 한 파일로 묶음
import fs from 'node:fs';
const dir=new URL('.',import.meta.url).pathname;
const src=fs.readFileSync(dir+'src.html','utf8');
const out=src.replace(/\{\{img:([\w-]+)\}\}/g,(_,n)=>'data:image/jpeg;base64,'+fs.readFileSync(dir+`img/${n}.jpg`).toString('base64'));
const name='인형드는자세-시안-v3.html';
fs.writeFileSync(dir+name,out);fs.copyFileSync(dir+name,dir+'../../docs/인형뽑기/'+name);console.log(name,(out.length/1e6).toFixed(2)+'MB');
