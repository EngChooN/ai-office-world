// 릴스 영상을 GitHub Pages(gh-pages 브랜치)에 잠깐 올려 공개 주소를 만들고, 게시 뒤 지운다.
// 방법은 scripts/multi-publish.mjs와 같다: 맨 저장소 partial clone 캐시에서 지금 gh-pages 커밋의 목록 + 파일 하나로
// 커밋을 만들어 push(강제 아님). 거절되면 한 번 다시 받아 다시 올린다. 작업 폴더·main 브랜치·다른 파일은 건드리지 않는다.
// 주의: 지운 뒤에도 영상은 gh-pages 기록(옛 커밋)에 남는다. npm run deploy(강제 push)를 하면 기록째 사라진다.
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

export const PAGES_BASE='https://engchoon.github.io/ai-office-world/';
export const TMP_DIR='reels-tmp';   // 밑줄로 시작하면 Jekyll이 숨기므로 쓰지 않음
const ROOT=resolve(import.meta.dirname,'../..');
const NAME_RE=/^[A-Za-z0-9][A-Za-z0-9.-]*$/;
const MAX_BYTES=100*1024*1024;      // GitHub는 100MiB 넘는 파일을 받지 않음
const AUTHOR={GIT_AUTHOR_NAME:'ai-office reels',GIT_AUTHOR_EMAIL:'reels@localhost',GIT_COMMITTER_NAME:'ai-office reels',GIT_COMMITTER_EMAIL:'reels@localhost'};

/** 주소 속 자격 정보(https://user:token@…)를 가린다. */
export const redact=s=>String(s??'').replace(/([a-z][a-z0-9+.-]*:\/\/)[^/@\s]+@/gi,'$1***@');
const firstLine=e=>redact(String(e?.stderr||e?.message||e).trim().split('\n')[0]);

export function createPagesHost({gitDir=join(ROOT,'node_modules/.cache/gwanak-pages.git'),remote,branch='gh-pages',dir=TMP_DIR,baseUrl=PAGES_BASE,
 fetchImpl=fetch,sleep=(ms)=>new Promise(r=>setTimeout(r,ms)),log=console.log,liveTimeoutMs=10*60e3,liveIntervalMs=15e3}={}){
 const ref=`refs/heads/${branch}`;
 const git=(args,opts={})=>{
  try{return execFileSync('git',['--git-dir',gitDir,...args],{encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:64<<20,timeout:120000,...opts}).trim();}
  catch(e){const err=new Error(`git ${args[0]} 실패: ${firstLine(e)}`);err.stderr=redact(e.stderr);throw err;}
 };
 const remoteUrl=()=>remote??execFileSync('git',['-C',ROOT,'remote','get-url','origin'],{encoding:'utf8'}).trim();
 function prepare(){
  if(!existsSync(gitDir)){
   mkdirSync(gitDir,{recursive:true});
   git(['init','-q','--bare']);
   git(['remote','add','origin',remoteUrl()]);
   git(['config','remote.origin.promisor','true']);
   git(['config','remote.origin.partialclonefilter','blob:none']);
   git(['config','extensions.partialClone','origin']);
  }else git(['remote','set-url','origin',remoteUrl()]);
 }
 function fetchBranch(){
  git(['fetch','-q','--filter=blob:none','--no-tags','origin',`+${ref}:${ref}`]);
  return git(['rev-parse',ref]);
 }
 const checkName=name=>{if(typeof name!=='string'||!NAME_RE.test(name)||name.length>100)throw new Error(`파일 이름이 알맞지 않아요(영문·숫자·.-만): ${name}`);return name;};
 const checkPath=path=>{const p=String(path??'');if(!p.startsWith(dir+'/'))throw new Error(`임시 폴더(${dir}/) 밖 파일은 지울 수 없어요: ${p}`);checkName(p.slice(dir.length+1));return p;};

 /** 지금 gh-pages 목록에 change(index 환경)를 더해 커밋·push. 바뀐 게 없으면 commit:null. 거절되면 한 번 다시. */
 function commitChange(change,msg){
  prepare();
  for(let attempt=0;;attempt++){
   const tmp=mkdtempSync(join(tmpdir(),'reels-pages-')),env={...process.env,GIT_INDEX_FILE:join(tmp,'index')};
   try{
    const parent=fetchBranch();
    git(['read-tree',`${parent}^{tree}`],{env});
    change(env);
    const tree=git(['write-tree','--missing-ok'],{env});
    if(tree===git(['rev-parse',`${parent}^{tree}`]))return {commit:null,parent};
    const commit=git(['commit-tree',tree,'-p',parent,'-m',msg],{env:{...env,...AUTHOR}});
    git(['push','-q','origin',`${commit}:${ref}`],{timeout:10*60e3});
    return {commit,parent};
   }catch(e){
    if(attempt>=1)throw e;
    log(`[릴스 임시] push가 거절되어 다시 받아 올립니다: ${firstLine(e)}`);
   }finally{rmSync(tmp,{recursive:true,force:true});}
  }
 }

 /** 파일 하나를 dir/name으로 올린다. 같은 내용이 이미 있으면 새 커밋 없이 지금 커밋을 돌려준다. */
 function upload(filePath,{name}={}){
  checkName(name);
  const size=statSync(filePath).size;
  if(size>=MAX_BYTES)throw new Error(`영상이 너무 커요(${(size/1048576).toFixed(1)}MB). GitHub Pages는 100MB 아래만 받아요.`);
  const path=`${dir}/${name}`,url=encodeURI(baseUrl+path);
  prepare();
  const blob=git(['hash-object','-w','--',resolve(filePath)]);   // 파일에서 바로 읽음(stdin으로 통째 넣지 않음)
  const r=commitChange(env=>git(['update-index','--add','--cacheinfo',`100644,${blob},${path}`],{env}),`릴스 임시 영상 올림: ${path}`);
  if(!r.commit){log(`[릴스 임시] 이미 올라 있음: ${path}`);return {path,url,commit:r.parent,created:false};}
  log(`[릴스 임시] gh-pages에 올림 (${r.commit.slice(0,7)}): ${path}`);
  return {path,url,commit:r.commit,created:true};
 }

 /** dir/ 아래 파일을 뺀다. 이미 없으면 {commit:null,removed:false}. 폴더가 비면 목록에서 폴더도 빠진다. */
 function remove(path){
  checkPath(path);
  let had=false;
  const r=commitChange(env=>{
   had=!!git(['ls-files','--',path],{env});
   if(had)git(['update-index','--index-info'],{env,input:`0 ${'0'.repeat(40)}\t${path}\n`});   // 맨 저장소라 --force-remove 대신 모드 0 줄로 뺌
  },`릴스 임시 영상 지움: ${path}`);
  if(!had||!r.commit){log(`[릴스 임시] 지울 파일 없음: ${path}`);return {commit:null,removed:false};}
  log(`[릴스 임시] gh-pages에서 지움 (${r.commit.slice(0,7)}): ${path}`);
  return {commit:r.commit,removed:true};
 }

 /** 지금 gh-pages의 dir/ 아래 파일 경로들(남은 임시 영상 정리용). */
 function list(){
  prepare();
  fetchBranch();
  const out=git(['ls-tree','-r','--name-only',ref,'--',`${dir}/`]);
  return out?out.split('\n'):[];
 }

 /** 공개 주소가 size 바이트로 보일 때까지 기다린다. 시간을 넘기면 throw. */
 async function waitLive({url,size}){
  const start=Date.now();let waited=0;
  const probe=async()=>{
   const u=`${url}${url.includes('?')?'&':'?'}t=${Date.now()}`;
   try{
    const r=await fetchImpl(u,{method:'HEAD',cache:'no-store'});
    if(r.status===200&&r.headers.get('content-length')!=null)return Number(r.headers.get('content-length'));
    if(r.status===404)return null;
   }catch{}
   try{   // HEAD가 안 되면 첫 1바이트만 받아 전체 크기를 본다
    const r=await fetchImpl(u,{headers:{Range:'bytes=0-0'},cache:'no-store'});
    try{await r.body?.cancel?.();}catch{}
    if(r.status===206)return Number(/\/(\d+)\s*$/.exec(r.headers.get('content-range')??'')?.[1]??NaN);
    if(r.status===200)return Number(r.headers.get('content-length')??NaN);
   }catch{}
   return null;
  };
  for(;;){
   const got=await probe();
   if(got===size){log(`[릴스 임시] 공개 주소 준비됨: ${url}`);return true;}
   if(Math.max(waited,Date.now()-start)>=liveTimeoutMs)
    throw new Error(`공개 주소에 영상이 ${Math.round(liveTimeoutMs/60e3)}분 안에 올라오지 않았어요(받은 크기 ${got??'없음'}, 기대 ${size}): ${url}`);
   await sleep(liveIntervalMs);waited+=liveIntervalMs;
  }
 }

 return {upload,remove,list,waitLive};
}
