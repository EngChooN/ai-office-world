// 시안 묶기: src/<이름>.html 틀에 base.css·base.js·<이름>.js를 끼워 docs/인형뽑기/ 로. node build.mjs
import fs from 'node:fs';import path from 'node:path';
const here=path.dirname(new URL(import.meta.url).pathname),src=p=>fs.readFileSync(path.join(here,'src',p),'utf8');
const OUT={stack:'새기계-불빛쌓기-시안-v1.html',string:'새기계-줄자르기-시안-v1.html',ball:'새기계-공구멍넣기-시안-v1.html'};
for(const [k,name] of Object.entries(OUT)){if(!fs.existsSync(path.join(here,'src',k+'.html')))continue;
 const html=src(k+'.html').replace('/*CSS*/',()=>src('base.css')).replace('/*BASE*/',()=>src('base.js')).replace('/*JS*/',()=>src(k+'.js'));
 fs.writeFileSync(path.join(here,'../../../docs/인형뽑기',name),html);console.log('→',name,html.length);}
