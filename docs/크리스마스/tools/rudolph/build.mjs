// 루돌프 하늘 썰매 시안 만들기(v2, 11-18 썰매 방식. v1 = 등에 타기, 결과물만 남김): 시안.src.html에 아이콘(sprite.svg에서 쓰는 것만)과 바탕 사진(artifacts/reindeer-design, JPG로 줄여 넣음)을 넣어
// docs/크리스마스/루돌프-하늘썰매-시안-v2.html 단독 파일로 낸다. 사용: node docs/크리스마스/tools/rudolph/build.mjs (맥 sips 사용)
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),root=join(here,'../../../..'),shots=join(root,'artifacts/reindeer-design');
const sprite=readFileSync(join(root,'public/icons/sprite.svg'),'utf8');
const symbols=new Map([...sprite.matchAll(/<symbol id="ic-([^"]+)"[\s\S]*?<\/symbol>/g)].map(m=>[m[1],m[0]]));
let src=readFileSync(join(here,'시안.src.html'),'utf8');
const used=[...new Set([...src.matchAll(/#ic-([a-z0-9-]+)/g)].map(m=>m[1]))];
const missing=used.filter(n=>!symbols.has(n));if(missing.length)console.warn('없는 아이콘',missing);
src=src.replace('<!--SPRITE-->',()=>`<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${used.filter(n=>symbols.has(n)).map(n=>symbols.get(n)).join('')}</svg>`);
const tmp=mkdtempSync(join(tmpdir(),'rd-'));
src=src.replace(/\{\{IMG:([a-z0-9-]+)\}\}/g,(_,n)=>{const out=join(tmp,n+'.jpg');execFileSync('sips',['-s','format','jpeg','-s','formatOptions','78',join(shots,n+'.png'),'--out',out],{stdio:'ignore'});return 'data:image/jpeg;base64,'+readFileSync(out).toString('base64');});
const dest=join(root,'docs/크리스마스/루돌프-하늘썰매-시안-v2.html');writeFileSync(dest,src);console.log(dest,used.length,'아이콘',Math.round(src.length/1024)+'KB');
