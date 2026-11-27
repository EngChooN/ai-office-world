import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs';
const here=path.dirname(new URL(import.meta.url).pathname),u=f=>'data:image/png;base64,'+fs.readFileSync(path.join(here,'shots',f)).toString('base64');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1320,height:960}});
await p.setContent(`<body style="margin:0;background:#241c33;display:flex;gap:20px;padding:20px;font:800 20px sans-serif;color:#fff">${[['stack-play.png','① 불빛 쌓기 「별빛 탑」'],['string-zoom.png','② 줄 자르기 「가위로 툭」(② 싹둑 단계)'],['ball-play.png','③ 공 구멍 넣기 「공 떨어뜨리기」']].map(([f,t])=>`<div><div style="margin-bottom:8px">${t}</div><img src="${u(f)}" width="420"></div>`).join('')}</body>`);
await p.waitForTimeout(300);await p.screenshot({path:path.join(here,'shots/combo-3.png')});await b.close();
