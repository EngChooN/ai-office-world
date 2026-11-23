// 공개 빌드에 인형뽑기 비공개 손님 인형(private/claw/)이 섞였는지 확인한다(월드아트 2026-11-23).
// node scripts/check-claw-private.mjs [dist 폴더=dist]  → 섞였으면 종료 코드 1.
// 확인하는 것: ① 'private/claw' 경로 문자열 ② private/claw/ 안 파일 이름(확장자 뺀 것)·파일 내용의 name 값 ③ 비공개 폴더의 그림·모델 파일과 같은 크기·내용의 파일
import {readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import {join,basename,extname} from 'node:path';
import {createHash} from 'node:crypto';
const dist=process.argv[2]??'dist',priv='private/claw';
if(!existsSync(dist)){console.error(`dist 폴더 없음: ${dist}`);process.exit(2);}
const files=[];(function walk(d){for(const n of readdirSync(d)){const p=join(d,n);statSync(p).isDirectory()?walk(p):files.push(p);}})(dist);
const needles=['private/claw'],hashes=new Set();
if(existsSync(priv))for(const n of readdirSync(priv)){const p=join(priv,n);if(statSync(p).isDirectory())continue;
 if(extname(n)==='.js'){const src=readFileSync(p,'utf8');for(const m of src.matchAll(/name\s*:\s*['"]([^'"]{2,})['"]/g))needles.push(m[1]);}
 else hashes.add(createHash('sha1').update(readFileSync(p)).digest('hex'));}
const bad=[];
for(const f of files){const buf=readFileSync(f);if(hashes.has(createHash('sha1').update(buf).digest('hex')))bad.push(`${f}: 비공개 파일과 같은 내용`);
 // 소스맵에는 claw-guest.js 설명 주석('private/claw/')이 원문 그대로 들어가므로 경로 표식은 .map에서 보지 않는다(이름·파일 내용은 본다)
 if(/\.(js|html|css|json|map|svg|txt)$/.test(f)){const t=buf.toString('utf8');for(const n of needles){if(n===needles[0]&&f.endsWith('.map'))continue;if(t.includes(n))bad.push(`${f}: "${n}" 포함`);}}}
if(bad.length){console.error('공개 빌드에 비공개 손님 인형이 섞였습니다:\n'+bad.slice(0,20).join('\n'));process.exit(1);}
console.log(`통과: ${files.length}개 파일에 비공개 손님 인형 없음(찾은 표식 ${needles.length}개·파일 ${hashes.size}개)`);
