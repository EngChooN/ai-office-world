// 인스타 릴스 자동 올리기(인스타그램 로그인 API). 기본은 미리보기만 하고, 「--게시 --확인 <코드>」를 줄 때만 실제로 올린다.
// 흐름: 영상 검사(100MB·MP4 H.264+AAC·9:16·3초~15분) → GitHub Pages에 잠깐 올림(공개 주소) → 준비 단계(media_type=REELS)
//       → 1분 간격 최대 5번 상태 확인(FINISHED) → media_publish → 첫 댓글 → 올린 영상 지움.
// 댓글 고정은 API에 없어 하지 않는다(대표가 앱에서 손으로).
// 사용(자세히는 docs/마케팅/인스타-릴스-자동올리기-실행방법.md):
//   npm run insta:reels                          미리보기(아무것도 안 올림) + 확인 코드
//   npm run insta:reels -- --게시 --확인 1a2b3c   실제 게시
//   npm run insta:reels -- --상태 | --토큰등록 | --토큰갱신 | --정리
//   --영상 <mp4> --글 <md>  다른 영상·글(기본: 인형뽑기 릴스 v2), --오프라인  미리보기에서 인스타 조회도 안 함
//   --다시시도  지난 게시 결과를 몰라 멈췄을 때, 앱에서 안 올라간 것을 확인한 뒤 이어서
//   --새로     이미 게시한 같은 영상·글을 일부러 한 번 더
import {createHash,randomBytes} from 'node:crypto';
import {createReadStream,readFileSync,statSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {join,resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createIgApi,DEFAULT_VERSION} from './ig-api.mjs';
import {ROOT,DAY,instaDir,assertIgnored,loadConfig,saveConfig,loadState,saveState,makeRedactor,tokenStatus,tokenLine} from './insta-store.mjs';

export const DEFAULTS={video:'artifacts/reels-claw-v2/온라인인형뽑기-릴스-v2.mp4',text:'docs/마케팅/릴스-인형뽑기-v2.md'};
export const POLL={everyMs:60e3,times:5};
export const CAPTION_MAX=2200,HASHTAG_MAX=30;

const FLAGS={'--게시':'publish','--publish':'publish','--상태':'status','--status':'status','--토큰등록':'setToken','--set-token':'setToken',
 '--토큰갱신':'refresh','--refresh-token':'refresh','--정리':'cleanup','--cleanup':'cleanup','--다시시도':'retryUnknown','--retry-unknown':'retryUnknown',
 '--새로':'again','--again':'again','--오프라인':'offline','--offline':'offline','--도움말':'help','--help':'help','-h':'help'};
const VALUED={'--확인':'confirm','--confirm':'confirm','--영상':'video','--video':'video','--글':'text','--text':'text'};

export function parseArgs(argv){
 const o={};
 for(let i=0;i<argv.length;i++){
  const a=argv[i],[k,v]=a.split(/=(.*)/s);
  if(VALUED[k]){o[VALUED[k]]=v??argv[++i];if(o[VALUED[k]]==null)throw new Error(`${k} 뒤에 값이 필요합니다`);}
  else if(FLAGS[a])o[FLAGS[a]]=true;
  else throw new Error(`모르는 옵션: ${a}`);
 }
 return o;
}

/** 마케팅 문서에서 「## 인스타 본문」·「## 고정 댓글」 아래 첫 ``` 덩어리를 꺼낸다. */
export function readPostText(md){
 const block=re=>{const at=md.search(re);if(at<0)return null;const m=md.slice(at).match(/```[^\n]*\n([\s\S]*?)\n```/);return m?m[1].trim():null;};
 return{caption:block(/^##\s*인스타 본문/m),comment:block(/^##\s*(고정|첫)\s*댓글/m)};
}

export function textProblems({caption,comment}){
 const p=[];
 if(!caption)p.push('본문(「## 인스타 본문」 아래 ``` 덩어리)을 찾지 못했습니다');
 if(!comment)p.push('첫 댓글(「## 고정 댓글」 아래 ``` 덩어리)을 찾지 못했습니다');
 if(caption&&[...caption].length>CAPTION_MAX)p.push(`본문이 ${[...caption].length}자로 ${CAPTION_MAX}자를 넘습니다`);
 if(caption&&(caption.match(/#[^\s#]+/g)??[]).length>HASHTAG_MAX)p.push(`해시태그가 ${HASHTAG_MAX}개를 넘습니다`);
 if(comment&&[...comment].length>CAPTION_MAX)p.push(`댓글이 ${CAPTION_MAX}자를 넘습니다`);
 return p;
}

export const fileSha=path=>new Promise((ok,no)=>{const h=createHash('sha256');createReadStream(path).on('data',d=>h.update(d)).on('end',()=>ok(h.digest('hex'))).on('error',no);});
/** 같은 영상·글·댓글이면 같은 열쇠. 확인 코드 = 앞 6글자(미리보기 뒤 내용이 바뀌면 코드가 달라짐). */
export const postKey=({videoSha,caption,comment})=>createHash('sha256').update([videoSha,caption,comment].join('\0')).digest('hex');

async function findPosted(api,caption,since){
 const r=await api.recentMedia(10),t=Date.parse(since)-10*60e3;
 return(r.data??[]).find(m=>(m.caption??'').trim()===caption.trim()&&(!m.timestamp||Date.parse(m.timestamp)>=t))??null;
}
async function findComment(api,mediaId,message){
 const r=await api.call('GET',`${mediaId}/comments`,{fields:'id,text'});
 return(r.data??[]).find(c=>(c.text??'').trim()===message.trim())??null;
}

function nextStep(st){
 if(!st)return'처음부터';
 if(st.done)return'끝남';
 if(st.publishing&&!st.media)return'게시 요청 결과 확인';
 if(!st.media)return st.container?'준비 단계 상태 확인부터 이어서':st.upload?'준비 단계 만들기부터 이어서':'처음부터';
 if(!st.comment)return'첫 댓글부터 이어서';
 return'임시 영상 지우기부터 이어서';
}

/**
 * deps: {env, out(line), ask(question,{hidden}), fetchImpl, host(pages-host), inspect, check, describe, sleep, now, poll}
 * 돌려줌: 종료 코드(0 정상, 1 실패, 2 사용법, 3 토큰 만료 임박 — --상태만)
 */
export async function main(argv,deps={}){
 const env=deps.env??process.env,now=deps.now??Date.now,sleep=deps.sleep??(ms=>new Promise(r=>setTimeout(r,ms))),poll=deps.poll??POLL;
 const secrets=[],redact=makeRedactor(secrets),say=line=>(deps.out??console.log)(redact(line));
 const iso=()=>new Date(now()).toISOString();
 let o;try{o=parseArgs(argv);}catch(e){say(e.message);say('도움말: --도움말');return 2;}
 if(o.help){say(readFileSync(new URL(import.meta.url),'utf8').split('\n').filter(l=>l.startsWith('//')).map(l=>l.slice(3)).join('\n'));return 0;}

 const dir=instaDir(env);
 try{
  assertIgnored(dir);
  let cfg=loadConfig(dir);
  const remember=c=>{if(c?.access_token)secrets.push(c.access_token);if(c?.app_secret)secrets.push(c.app_secret);};
  remember(cfg);
  const apiFor=c=>createIgApi({token:c.access_token,userId:c.user_id,version:c.api_version??DEFAULT_VERSION,fetchImpl:deps.fetchImpl??fetch,redact});
  const host=()=>deps.host??(deps.makeHost?deps.makeHost():null);

  // ── 토큰 넣기 ──
  if(o.setToken){
   const ask=deps.ask??askLine;
   const secret=(await ask('앱 비밀값(인스타그램 앱 시크릿 코드, 모르면 그냥 Enter): ',{hidden:true}))||cfg?.app_secret||'';
   const token=await ask('액세스 토큰: ',{hidden:true});
   if(!token)throw new Error('토큰이 비었습니다');
   secrets.push(token);if(secret)secrets.push(secret);
   let c={...(cfg??{}),access_token:token,app_secret:secret||undefined,api_version:cfg?.api_version??DEFAULT_VERSION};
   const acc=await apiFor(c).account();
   c.user_id=String(acc.user_id??acc.id);c.username=acc.username;
   let exp=now()+60*DAY,guess=true;
   if(secret){
    try{const r=await apiFor(c).exchange(secret);secrets.push(r.access_token);c.access_token=r.access_token;exp=now()+r.expires_in*1000;guess=false;say('짧은 토큰을 60일 토큰으로 바꿨습니다.');}
    catch{say('토큰 바꾸기는 건너뜀(이미 60일 토큰이면 정상입니다).');}
   }
   Object.assign(c,{token_saved_at:iso(),token_expires_at:new Date(exp).toISOString(),expiry_guess:guess});
   saveConfig(dir,c);
   say(`저장했습니다: @${c.username} (계정 ID ${c.user_id})`);
   say(tokenLine(tokenStatus(c,now())));
   say(`저장 위치: ${relative(ROOT,dir)||dir}/config.json (저장소에 올라가지 않음)`);
   return 0;
  }

  const ensureFresh=async(force=false)=>{
   const st=tokenStatus(cfg,now());
   if(!st.has)throw new Error('토큰이 없습니다. 먼저 「--토큰등록」을 해 주세요(설정 문서 참고).');
   if(st.expired)throw new Error(tokenLine(st));
   if(!(force||st.wantRefresh))return false;
   if(!st.canRefresh){if(force)say('토큰을 받은 지 24시간이 안 되어 아직 갱신할 수 없습니다(인스타그램 규칙). 내일 다시 해 주세요.');return false;}
   const r=await apiFor(cfg).refresh();
   secrets.push(r.access_token);
   cfg={...cfg,access_token:r.access_token,token_saved_at:iso(),token_expires_at:new Date(now()+r.expires_in*1000).toISOString(),expiry_guess:false};
   saveConfig(dir,cfg);
   say(`토큰을 갱신했습니다. ${tokenLine(tokenStatus(cfg,now()))}`);
   return true;
  };

  if(o.refresh){await ensureFresh(true);return 0;}

  if(o.status){
   const st=tokenStatus(cfg,now());
   say(tokenLine(st));
   if(st.has&&!st.expired){
    const api=apiFor(cfg),acc=await api.account();say(`계정: @${acc.username}`);
    const lim=await api.limit();say(`게시 한도: 최근 ${lim.hours??24}시간 ${lim.used??'?'} / ${lim.total??'?'}개`);
   }
   const h=host();
   if(h){const left=await h.list();say(left.length?`지우지 못한 임시 영상 ${left.length}개: ${left.join(', ')} → 「--정리」`:'남은 임시 영상: 없음');}
   const open=Object.values(loadState(dir).posts).filter(p=>!p.done);
   for(const p of open)say(`끝나지 않은 게시 ${p.key.slice(0,6)}: ${nextStep(p)}${p.last_error?` (마지막 오류: ${p.last_error})`:''}`);
   return st.has&&(st.warn||st.expired)?3:0;
  }

  if(o.cleanup){
   const h=host(),state=loadState(dir),files=await h.list();
   for(const f of files){await h.remove(f);say(`지움: ${f}`);}
   for(const p of Object.values(state.posts))if(p.upload&&!p.cleaned){
    if(p.media)p.cleaned=iso();else{delete p.upload;delete p.live;delete p.container;}
    if(p.media&&p.comment)p.done=true;
   }
   saveState(dir,state);
   say(files.length?`임시 영상 ${files.length}개를 지웠습니다.`:'지울 임시 영상이 없습니다.');
   return 0;
  }

  // ── 미리보기·게시 공통: 영상·글 읽기 ──
  const videoPath=resolve(ROOT,o.video??DEFAULTS.video),textPath=resolve(ROOT,o.text??DEFAULTS.text);
  const mp4=deps.mp4??await import('./mp4-check.mjs');
  const info=await mp4.inspectMp4(videoPath),vc=mp4.checkReelVideo(info);
  const text=readPostText(readFileSync(textPath,'utf8')),tp=textProblems(text);
  const videoSha=await fileSha(videoPath),key=postKey({...text,videoSha}),code=key.slice(0,6);
  const state=loadState(dir);
  let pid=key;
  if(o.again){let n=2;while(state.posts[`${key}-${n}`]?.done)n++;pid=`${key}-${n}`;}
  const prev=state.posts[pid];

  if(!o.publish){
   say('=== 릴스 올리기 미리보기 (아직 아무것도 올리지 않았습니다) ===');
   say(`영상: ${relative(ROOT,videoPath)}`);
   say(`  ${mp4.describeVideo(info)}`);
   say(vc.ok?'  ✓ 릴스 조건에 맞음':'  ✗ 릴스 조건에 안 맞음');
   for(const p of vc.problems)say(`    - ${p}`);
   for(const w of vc.warnings)say(`    참고: ${w}`);
   say('');
   say(`본문 (${[...(text.caption??'')].length}자, 해시태그 ${(text.caption?.match(/#[^\s#]+/g)??[]).length}개) — 출처 ${relative(ROOT,textPath)}`);
   say('────────');say(text.caption??'(없음)');say('────────');
   say(`첫 댓글 (${[...(text.comment??'')].length}자) — 고정은 게시 뒤 앱에서 손으로 해 주세요`);
   say('────────');say(text.comment??'(없음)');say('────────');
   for(const p of tp)say(`✗ ${p}`);
   say('');
   const st=tokenStatus(cfg,now());say(tokenLine(st));
   if(st.has&&!st.expired&&!o.offline){
    try{const api=apiFor(cfg),acc=await api.account();say(`올릴 계정: @${acc.username}`);
     const lim=await api.limit();say(`게시 한도: 최근 ${lim.hours??24}시간 ${lim.used??'?'} / ${lim.total??'?'}개`);}
    catch(e){say(`인스타 조회 실패: ${e.message}`);}
   }
   if(prev?.done)say(`⚠️ 이 영상·글은 이미 게시했습니다: ${prev.media?.permalink??prev.media?.id} (일부러 또 올리려면 --새로)`);
   else if(prev)say(`이전 기록: 중간에 멈춤 → ${nextStep(prev)}${prev.last_error?` (마지막 오류: ${prev.last_error})`:''}`);
   say('');
   say('실제로 올리면: ① 영상을 GitHub Pages에 잠깐 올림 → ② 인스타 준비 단계 만들기 → ③ 1분마다 최대 5번 처리 확인 → ④ 게시 → ⑤ 첫 댓글 → ⑥ 올린 영상 지우기');
   if(vc.ok&&!tp.length&&!prev?.done){say(`확인 코드: ${code}`);say(`위 내용이 맞으면: npm run insta:reels -- --게시 --확인 ${code}${o.video?` --영상 ${o.video}`:''}${o.text?` --글 ${o.text}`:''}${o.again?' --새로':''}`);}
   return vc.ok&&!tp.length?0:1;
  }

  // ── 실제 게시 ──
  if(!vc.ok||tp.length)throw new Error(`올릴 수 없습니다: ${[...vc.problems,...tp].join(' / ')}`);
  if(o.confirm!==code)throw new Error(o.confirm?'확인 코드가 다릅니다. 미리보기 뒤 영상·글이 바뀌었을 수 있습니다. 미리보기를 다시 보고 새 코드를 넣어 주세요.':'「--확인 <코드>」가 필요합니다. 먼저 미리보기(옵션 없이 실행)로 영상·글·댓글을 확인해 주세요.');
  if(prev?.done)throw new Error(`이미 게시했습니다: ${prev.media?.permalink??prev.media?.id}. 같은 내용을 또 올리려면 미리보기에 --새로를 붙여 새 코드를 받으세요.`);
  await ensureFresh();
  say(tokenLine(tokenStatus(cfg,now())));
  const api=apiFor(cfg),h=host();
  const p=state.posts[pid]??={key:pid,video:relative(ROOT,videoPath),created:iso()};
  const save=()=>saveState(dir,state);
  const fail=e=>{p.last_error=redact(e.message);save();throw e;};
  save();

  if(p.publishing&&!p.media){
   const found=await findPosted(api,text.caption,p.publishing);
   if(found){p.media={id:found.id,permalink:found.permalink};delete p.publishing;save();say(`지난번 게시는 실제로 올라가 있었습니다(${found.permalink??found.id}). 다시 올리지 않고 이어 갑니다.`);}
   else if(!o.retryUnknown)return fail(new Error('지난번 게시 요청의 결과를 알 수 없고, 최근 게시물에서도 찾지 못했습니다. 인스타 앱에서 올라가지 않은 것을 확인한 뒤 「--다시시도」를 붙여 다시 실행해 주세요.'));
   else{delete p.publishing;save();}
  }

  try{
   if(!p.media){
    const lim=await api.limit();
    say(`게시 한도: 최근 ${lim.hours??24}시간 ${lim.used??'?'} / ${lim.total??'?'}개`);
    if(lim.total!=null&&lim.used!=null&&lim.used>=lim.total)throw new Error('오늘 게시 한도를 다 썼습니다. 내일 다시 해 주세요.');
    if(!p.upload){
     say('① 영상을 GitHub Pages에 잠깐 올리는 중…');
     p.upload=await h.upload(videoPath,{name:`reel-${pid.slice(0,10)}-${randomBytes(4).toString('hex')}.mp4`});save();
    }
    if(!p.live){say(`   공개 주소가 열리기를 기다리는 중: ${p.upload.url}`);await h.waitLive({url:p.upload.url,size:info.sizeBytes});p.live=iso();save();}
    if(p.container&&now()-Date.parse(p.container.at)>23*3600e3){say('   지난 준비 단계가 24시간 가까이 지나 새로 만듭니다.');delete p.container;}
    if(!p.container){say('② 인스타 준비 단계 만드는 중…');const r=await api.createReel({videoUrl:p.upload.url,caption:text.caption});p.container={id:r.id,at:iso()};save();}
    say('③ 인스타가 영상을 처리하는 중(1분마다 확인, 최대 5번)…');
    let status=null;
    for(let i=1;i<=poll.times;i++){
     await sleep(poll.everyMs);
     const s=await api.containerStatus(p.container.id);status=s.status_code;
     say(`   ${i}번째 확인: ${status}`);
     if(status==='FINISHED'||status==='PUBLISHED')break;
     if(status==='ERROR'||status==='EXPIRED'){
      delete p.container;save();
      await removeVideo();
      throw new Error(`인스타가 영상 처리에 실패했습니다(${status}${s.status?`: ${s.status}`:''}). 영상은 지웠고, 다시 실행하면 처음부터 합니다.`);
     }
    }
    if(status==='PUBLISHED'){p.publishing=p.container.at;save();throw new Error('이 준비 단계는 이미 게시된 상태입니다. 다시 실행하면 최근 게시물에서 찾아 이어 갑니다.');}
    if(status!=='FINISHED')throw new Error(`${poll.times}분 안에 처리가 끝나지 않았습니다. 잠시 뒤 같은 명령을 다시 실행하면 같은 준비 단계로 이어서 확인합니다(새로 올리지 않음). 임시 영상은 그대로 둡니다.`);
    say('④ 게시하는 중…');
    p.publishing=iso();save();
    try{const r=await api.publish(p.container.id);p.media={id:r.id};delete p.publishing;save();}
    catch(e){if(!e.ambiguous){delete p.publishing;save();}throw e;}
    try{const m=await api.media(p.media.id);if(m.permalink){p.media.permalink=m.permalink;save();}}catch{}
    say(`   게시했습니다: ${p.media.permalink??p.media.id}`);
   }
   let commentErr=null;
   if(!p.comment){
    say('⑤ 첫 댓글 다는 중…');
    try{
     if(p.commenting){const c=await findComment(api,p.media.id,text.comment);if(c){p.comment={id:c.id};delete p.commenting;save();}}
     if(!p.comment){p.commenting=iso();save();const r=await api.comment(p.media.id,text.comment);p.comment={id:r.id};delete p.commenting;save();}
     say('   댓글을 달았습니다. 고정은 인스타 앱에서 손으로 해 주세요.');
    }catch(e){if(!e.ambiguous)delete p.commenting;commentErr=e;say(`   댓글 실패: ${e.message}`);}
   }
   await removeVideo();
   if(commentErr)throw new Error(`게시는 됐지만 첫 댓글을 달지 못했습니다(${commentErr.message}). 같은 명령을 다시 실행하면 댓글만 다시 답니다.`);
   p.done=!!p.cleaned;delete p.last_error;save();
   say(p.done?'끝났습니다. 할 일: 인스타 앱에서 첫 댓글을 고정해 주세요.':'게시·댓글은 끝났지만 임시 영상을 못 지웠습니다. 「--정리」를 해 주세요.');
   return 0;
  }catch(e){return fail(e);}

  async function removeVideo(){
   if(!p.upload||p.cleaned)return;
   say('⑥ GitHub Pages의 임시 영상 지우는 중…');
   try{await h.remove(p.upload.path);p.cleaned=iso();save();say('   지웠습니다.');}
   catch(e){say(`   임시 영상을 지우지 못했습니다(${redact(e.message)}). 나중에 「--정리」를 해 주세요.`);}
  }
 }catch(e){say(`실패: ${redact(e.message)}`);return 1;}
}

/** 터미널에서 한 줄 받기. hidden이면 친 글자를 화면에 안 보임(토큰·비밀값). */
export function askLine(question,{hidden=false}={}){
 return new Promise(ok=>{
  const rl=createInterface({input:process.stdin,output:process.stdout,terminal:true});
  if(hidden)rl._writeToOutput=s=>{if(s.includes(question))process.stdout.write(question);};
  rl.question(question,a=>{rl.close();if(hidden)process.stdout.write('\n');ok(a.trim());});
 });
}

if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 const {createPagesHost}=await import('./pages-host.mjs');
 let made=null;
 process.exitCode=await main(process.argv.slice(2),{makeHost:()=>made??=createPagesHost()});
}
