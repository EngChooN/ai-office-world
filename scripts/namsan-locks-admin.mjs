#!/usr/bin/env node
// 남산 사랑의 자물쇠 운영자 도구(11-22, 월드개발). 서버가 쓰는 data-multi/namsan-locks.json을 직접 고친다.
// 운영 서버가 켜져 있어도 된다: 서버가 5초마다 파일이 바뀌었는지 보고 다시 읽어 남산 방 사람들에게 목록을 다시 보낸다.
//  (서버가 막 쓰는 순간과 겹치면 한쪽 변경이 사라질 수 있으니, 고친 뒤 list로 한 번 더 확인)
// 쓰기:  node scripts/namsan-locks-admin.mjs list            난간·꾸러미 전부(최근 순)
//        node scripts/namsan-locks-admin.mjs reported        신고된 것·숨긴 것
//        node scripts/namsan-locks-admin.mjs hide <id>       모두에게서 숨김(자리를 비움)
//        node scripts/namsan-locks-admin.mjs restore <id>    숨김을 풀고 신고 기록을 지움(옛 자리가 비었으면 그 자리, 아니면 꾸러미)
//        node scripts/namsan-locks-admin.mjs delete <id>     완전히 지움
// 파일 위치: DATA_DIR(기본 ./data-multi) 또는 LOCKS_FILE. 고치기 전 파일은 같은 폴더 namsan-locks.json.bak에 남긴다.
import {readFileSync,writeFileSync,renameSync,existsSync,copyFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createLockStore} from '../server/namsan-locks.mjs';
import {lockDate} from '../src/namsan/namsan-lock-rules.js';

const file=resolve(process.env.LOCKS_FILE||join(process.env.DATA_DIR||'data-multi','namsan-locks.json'));
const [cmd='list',id]=process.argv.slice(2);
// 서버가 막 쓰는 중이면(0.3초 모아 쓰기) 파일이 1초 동안 그대로일 때까지 기다렸다 읽는다(최대 5초)
for(let i=0;i<50&&existsSync(file)&&(Date.now()-statSync(file).mtimeMs<1000||existsSync(file+'.tmp'));i++)await new Promise(r=>setTimeout(r,100));
const data=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{v:1,locks:[]};
const store=createLockStore({initial:data});
const row=l=>`${l.id}  ${l.slot===null?(l.hidden?'숨김  ':'꾸러미'):'자리 '+String(l.slot).padStart(3)}  ${lockDate(l.at)}  신고 ${l.reports.length}  ${l.name||'-'}  「${l.text||'(글 없음)'}」`;
function save(){copyFileSync(file,file+'.bak');const tmp=file+'.admin.tmp';writeFileSync(tmp,JSON.stringify(store.toJSON()));renameSync(tmp,file);}
const need=()=>{if(!id){console.error('자물쇠 id를 적어 주세요 (list로 확인)');process.exit(2);}};
switch(cmd){
 case 'list':{const all=store.all().sort((a,b)=>b.at-a.at);console.log(`${file}\n모두 ${all.length}개 · 난간 ${all.filter(l=>l.slot!==null).length} · 꾸러미 ${all.filter(l=>l.slot===null&&!l.hidden).length} · 숨김 ${all.filter(l=>l.hidden).length}`);for(const l of all)console.log(row(l));break;}
 case 'reported':{const r=store.reported();console.log(`신고·숨김 ${r.length}개`);for(const l of r)console.log(row(l));break;}
 case 'hide':need();if(!store.hide(id)){console.error('없는 id');process.exit(1);}save();console.log('숨겼어요:',id);break;
 case 'restore':need();if(!store.restore(id)){console.error('없는 id');process.exit(1);}save();console.log('되살렸어요:',id);break;
 case 'delete':need();{const l=store.all().find(x=>x.id===id);if(!l){console.error('없는 id');process.exit(1);}store.remove({owner:l.owner,id});save();console.log('지웠어요:',id);}break;
 default:console.error('명령: list | reported | hide <id> | restore <id> | delete <id>');process.exit(2);
}
