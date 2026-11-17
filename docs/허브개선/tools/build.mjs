// 시안 HTML 만들기: tools/시안-X.src.html의 표시 자리에 공용 CSS·JS·아이콘(public/icons/sprite.svg에서 쓰는 것만)을 넣어
// docs/허브개선/시안-X.html 단독 파일로 낸다. 사용: node docs/허브개선/tools/build.mjs
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),out=join(here,'..'),root=join(here,'../../..');
const sprite=readFileSync(join(root,'public/icons/sprite.svg'),'utf8');
const symbols=new Map([...sprite.matchAll(/<symbol id="ic-([^"]+)"[\s\S]*?<\/symbol>/g)].map(m=>[m[1],m[0]]));
const iconsCss=readFileSync(join(root,'public/icons/icons.css'),'utf8');
const css=readFileSync(join(here,'common.css'),'utf8'),js=readFileSync(join(here,'common.js'),'utf8');
const ALWAYS=['c-sound','c-sound-off','c-net-ok','c-net-full','c-net-connecting','c-server-off','c-people'];
for(const f of readdirSync(here).filter(f=>f.endsWith('.src.html'))){
 const src=readFileSync(join(here,f),'utf8');
 const used=new Set(ALWAYS);
 for(const m of (src+js).matchAll(/(?:ic\(\s*'|#ic-|icon:'|['"])((?:c|h|s|x)-[a-z0-9-]+)['"]/g))if(symbols.has(m[1]))used.add(m[1]);
 const missing=[...(src+js).matchAll(/ic\(\s*'([a-z0-9-]+)'/g)].map(m=>m[1]).filter(n=>!symbols.has(n));
 if(missing.length)console.warn(f,'없는 아이콘',[...new Set(missing)]);
 const spr=`<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${[...used].map(n=>symbols.get(n)).join('')}</svg>`;
 const html=src.replace('/*ICONS_CSS*/',()=>iconsCss).replace('/*COMMON_CSS*/',()=>css).replace('/*COMMON_JS*/',()=>js).replace('<!--SPRITE-->',()=>spr);
 const name=f.replace('.src.html','.html');writeFileSync(join(out,name),html);console.log(name,used.size,'아이콘',Math.round(html.length/1024)+'KB');
}
