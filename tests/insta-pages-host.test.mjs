// 릴스 임시 영상 GitHub Pages 올리기·지우기(scripts/insta/pages-host.mjs). 원격은 임시 폴더의 로컬 맨 저장소만 쓴다(진짜 원격 push 없음).
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chmodSync,existsSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPagesHost,redact,PAGES_BASE,TMP_DIR} from '../scripts/insta/pages-host.mjs';

const ENV={...process.env,GIT_AUTHOR_NAME:'t',GIT_AUTHOR_EMAIL:'t@t',GIT_COMMITTER_NAME:'t',GIT_COMMITTER_EMAIL:'t@t'};
const sh=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',env:ENV,stdio:['pipe','pipe','pipe']}).trim();

/** 임시 폴더에 원격 역할 맨 저장소(gh-pages: index.html·multi-server.json)와 다른 곳 작업 폴더를 만든다. */
function setup(){
 const base=mkdtempSync(join(tmpdir(),'pages-host-test-'));
 const remote=join(base,'remote.git'),work=join(base,'work');
 sh(base,'init','-q','--bare',remote);
 sh(remote,'config','uploadpack.allowFilter','true');   // GitHub처럼 partial clone 허용
 sh(base,'init','-q','-b','gh-pages',work);
 writeFileSync(join(work,'index.html'),'<h1>허브</h1>\n');
 writeFileSync(join(work,'multi-server.json'),'{"state":"off"}\n');
 sh(work,'add','.');sh(work,'commit','-q','-m','처음');
 sh(work,'remote','add','origin',remote);sh(work,'push','-q','origin','gh-pages');
 const video=join(base,'clip.mp4');writeFileSync(video,Buffer.from(Array.from({length:5000},(_,i)=>i*7&255)));
 const logs=[];
 const host=createPagesHost({gitDir:join(base,'cache.git'),remote,log:m=>logs.push(m)});
 return {base,remote,work,video,host,logs,
  files:()=>sh(remote,'ls-tree','-r','--name-only','gh-pages').split('\n').filter(Boolean),
  head:()=>sh(remote,'rev-parse','gh-pages'),
  cat:p=>execFileSync('git',['cat-file','blob',`gh-pages:${p}`],{cwd:remote}),
  done:()=>rmSync(base,{recursive:true,force:true})};
}
/** 다른 곳에서 gh-pages에 커밋을 더한다(캐시가 낡게). */
function otherCommit(t,file,body){
 sh(t.work,'pull','-q','origin','gh-pages');
 writeFileSync(join(t.work,file),body);sh(t.work,'add','.');sh(t.work,'commit','-q','-m',`다른 곳: ${file}`);sh(t.work,'push','-q','origin','gh-pages');
}

test('upload: reels-tmp/이름에 같은 내용, 기존 파일 유지, 주소 모양, 같은 내용 다시 올리면 새 커밋 없음',()=>{
 const t=setup();
 try{
  const r=t.host.upload(t.video,{name:'ab12cd34ef.mp4'});
  assert.equal(r.path,`${TMP_DIR}/ab12cd34ef.mp4`);
  assert.equal(r.url,`${PAGES_BASE}reels-tmp/ab12cd34ef.mp4`);
  assert.equal(r.commit,t.head());assert.equal(r.created,true);
  assert.deepEqual(t.files().sort(),['index.html','multi-server.json','reels-tmp/ab12cd34ef.mp4']);
  assert.ok(t.cat(r.path).equals(execFileSync('cat',[t.video])));
  assert.equal(t.cat('index.html').toString(),'<h1>허브</h1>\n');
  assert.equal(sh(t.remote,'log','-1','--format=%an|%s','gh-pages'),'ai-office reels|릴스 임시 영상 올림: reels-tmp/ab12cd34ef.mp4');
  const again=t.host.upload(t.video,{name:'ab12cd34ef.mp4'});
  assert.equal(again.commit,r.commit);assert.equal(again.created,false);assert.equal(t.head(),r.commit,'새 커밋 없음');
  assert.deepEqual(t.host.list(),['reels-tmp/ab12cd34ef.mp4']);
 }finally{t.done();}
});

test('remove: 파일이 빠지고 폴더도 사라짐, 기존 파일 유지, 다시 지우면 removed:false',()=>{
 const t=setup();
 try{
  const {path}=t.host.upload(t.video,{name:'x1.mp4'});
  const r=t.host.remove(path);
  assert.equal(r.removed,true);assert.equal(r.commit,t.head());
  assert.deepEqual(t.files().sort(),['index.html','multi-server.json']);
  assert.equal(sh(t.remote,'ls-tree','gh-pages','reels-tmp'),'','폴더가 tree에서 빠짐');
  assert.equal(sh(t.remote,'log','-1','--format=%s','gh-pages'),'릴스 임시 영상 지움: reels-tmp/x1.mp4');
  const before=t.head();
  assert.deepEqual(t.host.remove(path),{commit:null,removed:false});
  assert.equal(t.head(),before);
  assert.deepEqual(t.host.list(),[]);
 }finally{t.done();}
});

test('list: 두 개 올리고 하나 지우면 남은 하나만, 폴더 밖 파일은 안 셈',()=>{
 const t=setup();
 try{
  t.host.upload(t.video,{name:'a.mp4'});
  writeFileSync(join(t.base,'b.mp4'),'다른 영상');t.host.upload(join(t.base,'b.mp4'),{name:'b.mp4'});
  assert.deepEqual(t.host.list(),['reels-tmp/a.mp4','reels-tmp/b.mp4']);
  t.host.remove('reels-tmp/a.mp4');
  assert.deepEqual(t.host.list(),['reels-tmp/b.mp4']);
  assert.ok(t.files().includes('reels-tmp/b.mp4'),'남은 파일은 그대로');
 }finally{t.done();}
});

test('다른 곳에서 gh-pages가 바뀐 뒤(캐시가 낡음)에도 upload·remove가 남의 커밋을 지우지 않고 성공',()=>{
 const t=setup();
 try{
  const {path}=t.host.upload(t.video,{name:'s1.mp4'});
  otherCommit(t,'multi-server.json','{"state":"on"}\n');
  t.host.upload(t.video,{name:'s2.mp4'});
  assert.equal(t.cat('multi-server.json').toString(),'{"state":"on"}\n');
  otherCommit(t,'extra.txt','x\n');
  assert.equal(t.host.remove(path).removed,true);
  assert.deepEqual(t.files().sort(),['extra.txt','index.html','multi-server.json','reels-tmp/s2.mp4']);
 }finally{t.done();}
});

test('push가 한 번 거절되면 다시 받아 재시도해 성공(원격 훅이 첫 push 거절)',()=>{
 const t=setup();
 try{
  const mark=join(t.base,'reject-once'),hook=join(t.remote,'hooks','pre-receive');
  writeFileSync(mark,'');
  writeFileSync(hook,`#!/bin/sh\nif [ -f "${mark}" ]; then rm "${mark}"; echo "다른 곳에서 바뀜" >&2; exit 1; fi\nexit 0\n`);chmodSync(hook,0o755);
  const r=t.host.upload(t.video,{name:'retry.mp4'});
  assert.equal(r.commit,t.head());assert.ok(!existsSync(mark));
  assert.ok(t.logs.some(m=>m.includes('다시 받아')),'재시도 로그');
  writeFileSync(mark,'');
  assert.equal(t.host.remove(r.path).removed,true);
  assert.deepEqual(t.files().sort(),['index.html','multi-server.json']);
 }finally{t.done();}
});

test('잘못된 이름·폴더 밖 경로는 throw',()=>{
 const t=setup();
 try{
  for(const name of ['../x','한글.mp4','a b.mp4','','.hidden','a/b.mp4',undefined])
   assert.throws(()=>t.host.upload(t.video,{name}),/파일 이름/,String(name));
  assert.throws(()=>t.host.remove('index.html'),/밖/);
  assert.throws(()=>t.host.remove('reels-tmp/../index.html'),/파일 이름/);
  assert.deepEqual(t.files().sort(),['index.html','multi-server.json']);
 }finally{t.done();}
});

test('자격 정보 가리기: 로그·에러에 토큰이 안 섞임',()=>{
 assert.equal(redact('fatal: https://user:ghp_abc@github.com/a/b.git 실패'),'fatal: https://***@github.com/a/b.git 실패');
 assert.equal(redact('git@github-personal:EngChooN/x.git'),'git@github-personal:EngChooN/x.git');
 const base=mkdtempSync(join(tmpdir(),'pages-host-test-'));
 try{
  const host=createPagesHost({gitDir:join(base,'c.git'),remote:`https://me:ghp_SECRET@127.0.0.1:9/none.git`,log:()=>{}});
  assert.throws(()=>host.list(),e=>!String(e.message).includes('ghp_SECRET')&&!String(e.stderr??'').includes('ghp_SECRET'));
 }finally{rmSync(base,{recursive:true,force:true});}
});

const res=(status,headers={})=>({status,headers:new Headers(headers),body:null});

test('waitLive: 404 두 번 뒤 200·크기 맞으면 true, sleep 2번, ?t= 붙임',async()=>{
 const urls=[],sleeps=[];let n=0;
 const host=createPagesHost({log:()=>{},liveIntervalMs:15e3,
  fetchImpl:async(u,o)=>{urls.push([u,o.method]);return ++n<3?res(404):res(200,{'content-length':'5000'});},
  sleep:async ms=>{sleeps.push(ms);}});
 assert.equal(await host.waitLive({url:`${PAGES_BASE}reels-tmp/a.mp4`,size:5000}),true);
 assert.deepEqual(sleeps,[15e3,15e3]);
 assert.ok(urls.every(([u,m])=>/reels-tmp\/a\.mp4\?t=\d+$/.test(u)&&m==='HEAD'));
});

test('waitLive: HEAD가 안 되면 Range 0-0의 content-range 총길이로 판단',async()=>{
 const calls=[];
 const host=createPagesHost({log:()=>{},sleep:async()=>{},
  fetchImpl:async(u,o)=>{calls.push(o.method??'GET');if(o.method==='HEAD')throw new Error('막힘');return res(206,{'content-range':'bytes 0-0/5000'});}});
 assert.equal(await host.waitLive({url:'https://x/y.mp4',size:5000}),true);
 assert.deepEqual(calls,['HEAD','GET']);
});

test('waitLive: 끝까지 크기가 다르면 시간 초과 throw(가짜 sleep, 진짜로 안 기다림)',async()=>{
 let sleeps=0;const t0=Date.now();
 const host=createPagesHost({log:()=>{},liveTimeoutMs:60e3,liveIntervalMs:15e3,
  fetchImpl:async()=>res(200,{'content-length':'4000'}),sleep:async()=>{sleeps++;}});
 await assert.rejects(host.waitLive({url:'https://x/y.mp4',size:5000}),/1분 안에 올라오지 않았어요.*4000/);
 assert.equal(sleeps,4);assert.ok(Date.now()-t0<2000);
});
