// 인스타 릴스 자동 올리기 — 가짜 인스타 API·가짜 Pages로 흐름·안전장치 시험(진짜 계정·네트워크 안 씀).
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,statSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {main,readPostText,parseArgs} from '../scripts/insta/reels-post.mjs';
import {ROOT,DAY,assertIgnored,makeRedactor,tokenStatus} from '../scripts/insta/insta-store.mjs';

const TOKEN='IGAAtokenSECRETvalue123456',SECRET='appSECRETvalue98765',NEW_TOKEN='IGAAnewTOKENrefreshed777';
const T0=Date.parse('2026-11-28T03:00:00Z');
const CAPTION='릴스 본문 첫 줄\n\n#시험',COMMENT='첫 댓글 👉 주소';
const MD=`# 시험\n\n## 인스타 본문 (복사용)\n\`\`\`\n${CAPTION}\n\`\`\`\n\n## 고정 댓글 (복사용)\n\`\`\`\n${COMMENT}\n\`\`\`\n`;
const GOOD={sizeBytes:1234,brand:'isom',durationSec:26,width:1080,height:1920,videoCodec:'avc1',audioCodec:'mp4a',audioAac:true,fps:30,faststart:true};
const fakeMp4=(info=GOOD)=>({inspectMp4:async()=>info,checkReelVideo:i=>({ok:i.height/i.width>1.7,problems:i.height/i.width>1.7?[]:['9:16이 아닙니다'],warnings:[]}),describeVideo:i=>`${i.width}×${i.height}`});

/** 가짜 인스타그램(graph.instagram.com). opts로 상태·실패를 바꾼다. 받은 요청은 calls에 남김. */
function fakeIg(opts={}){
 const ig={calls:[],posted:[],comments:[],containers:0,statusSeq:opts.statusSeq??['IN_PROGRESS','FINISHED'],limit:opts.limit??{used:1,total:100},...opts};
 let si=0;
 ig.fetch=async(href,init={})=>{
  const u=new URL(href),method=init.method??'GET',p=method==='GET'?Object.fromEntries(u.searchParams):Object.fromEntries(new URLSearchParams(init.body));
  const path=u.pathname.replace(/^\/v[\d.]+\//,'/');
  ig.calls.push({method,path,p});
  if(p.access_token!==ig.token)return json(400,{error:{message:'Invalid OAuth access token',code:190}});
  const r=ig.handle?.(method,path,p);if(r)return r;
  if(path==='/me')return json(200,{user_id:'17841400000000001',username:'aioffice.world'});
  if(path==='/access_token')return p.client_secret===SECRET?json(200,{access_token:TOKEN,token_type:'bearer',expires_in:5184000}):json(400,{error:{message:'bad secret',code:101}});
  if(path==='/refresh_access_token'){ig.token=NEW_TOKEN;return json(200,{access_token:NEW_TOKEN,token_type:'bearer',expires_in:5184000});}
  if(path.endsWith('/content_publishing_limit'))return json(200,{data:[{quota_usage:ig.limit.used,config:{quota_total:ig.limit.total,quota_duration:86400}}]});
  if(path.endsWith('/media')&&method==='POST'){ig.containers++;return json(200,{id:`C${ig.containers}`});}
  if(path.endsWith('/media')&&method==='GET')return json(200,{data:ig.posted.map(m=>({id:m.id,caption:m.caption,timestamp:new Date(T0).toISOString(),permalink:`https://www.instagram.com/reel/${m.id}/`}))});
  if(/^\/C\d+$/.test(path))return json(200,{status_code:ig.statusSeq[Math.min(si++,ig.statusSeq.length-1)]});
  if(path.endsWith('/media_publish')){
   const f=ig.publishFail?.shift?.();
   if(f==='api')return json(400,{error:{message:'Media ID is not available',code:9007}});
   ig.posted.push({id:`M${ig.posted.length+1}`,caption:ig.lastCaption});
   if(f==='lost')throw new TypeError('fetch failed');   // 서버에서는 올라갔는데 응답이 끊김
   return json(200,{id:ig.posted.at(-1).id});
  }
  if(/^\/M\d+$/.test(path))return json(200,{id:path.slice(1),permalink:`https://www.instagram.com/reel${path}/`});
  if(path.endsWith('/comments')&&method==='POST'){
   if(ig.commentFail?.shift?.())return json(400,{error:{message:'comment blocked',code:100}});
   ig.comments.push(p.message);return json(200,{id:`K${ig.comments.length}`});
  }
  if(path.endsWith('/comments'))return json(200,{data:ig.comments.map((t,i)=>({id:`K${i+1}`,text:t}))});
  return json(404,{error:{message:`fake: ${method} ${path}`,code:1}});
 };
 const origCreate=ig.fetch;
 ig.fetch=async(href,init={})=>{if((init.method??'GET')==='POST'){const b=new URLSearchParams(init.body);if(b.get('caption'))ig.lastCaption=b.get('caption');}return origCreate(href,init);};
 ig.token=opts.token??TOKEN;
 ig.posts=()=>ig.calls.filter(c=>c.method==='POST');
 return ig;
}
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

function fakeHost(){
 const h={log:[],files:new Set(),removeFail:0};
 h.upload=async(file,{name})=>{const path=`reels-tmp/${name}`;h.files.add(path);h.log.push(['upload',path]);return{path,url:`https://engchoon.github.io/ai-office-world/${path}`,commit:'abc',created:true};};
 h.waitLive=async({url,size})=>{h.log.push(['live',url,size]);return true;};
 h.remove=async path=>{if(h.removeFail>0){h.removeFail--;throw new Error('push rejected');}h.log.push(['remove',path]);return{removed:h.files.delete(path),commit:'def'};};
 h.list=async()=>[...h.files];
 return h;
}

function setup({cfg='default',ig:igOpts={},now=T0}={}){
 const dir=mkdtempSync(join(tmpdir(),'insta-test-')),insta=join(dir,'.instagram');
 writeFileSync(join(dir,'post.md'),MD);writeFileSync(join(dir,'v.mp4'),'fake video bytes');
 if(cfg){
  const c=cfg==='default'?{access_token:TOKEN,app_secret:SECRET,user_id:'17841400000000001',username:'aioffice.world',api_version:'v24.0',
   token_saved_at:new Date(T0-2*DAY).toISOString(),token_expires_at:new Date(T0+50*DAY).toISOString(),expiry_guess:false}:cfg;
  execFileSync('mkdir',['-p',insta]);writeFileSync(join(insta,'config.json'),JSON.stringify(c));
 }
 const ig=fakeIg(igOpts),host=fakeHost(),out=[],sleeps=[];
 const t={dir,insta,ig,host,out,sleeps,clock:now};
 t.run=(...argv)=>main([...argv,'--영상',join(dir,'v.mp4'),'--글',join(dir,'post.md')],{env:{INSTA_DIR:insta},out:l=>out.push(l),fetchImpl:ig.fetch,host,
  mp4:fakeMp4(t.info),sleep:async ms=>{sleeps.push(ms);t.clock+=ms;},now:()=>t.clock,ask:t.ask});
 t.text=()=>out.join('\n');
 t.code=async()=>{out.length=0;await t.run();return t.text().match(/확인 코드: (\w+)/)?.[1];};
 t.state=()=>JSON.parse(readFileSync(join(insta,'state.json'),'utf8'));
 return t;
}

test('글 문서에서 본문·첫 댓글을 꺼냄(실제 인형뽑기 v2 문서)',()=>{
 const {caption,comment}=readPostText(readFileSync(join(ROOT,'docs/마케팅/릴스-인형뽑기-v2.md'),'utf8'));
 assert.match(caption,/^브라우저에서 바로 뽑는 인형뽑기/);assert.match(caption,/#AIOffice$/);
 assert.match(comment,/^🧸 바로 뽑아 보기/);assert.match(comment,/🙌$/);
 assert.throws(()=>parseArgs(['--모르는옵션']));
});

test('기본은 미리보기: 영상·본문·댓글 전문과 확인 코드를 보여 주고 아무것도 올리지 않음',async()=>{
 const t=setup();
 assert.equal(await t.run(),0);
 const s=t.text();
 assert.ok(s.includes(CAPTION)&&s.includes(COMMENT),'본문·댓글 전문');
 assert.match(s,/아직 아무것도 올리지 않았습니다/);assert.match(s,/확인 코드: [0-9a-f]{6}/);
 assert.match(s,/@aioffice\.world/);assert.match(s,/게시 한도: 최근 24시간 1 \/ 100개/);
 assert.equal(t.ig.posts().length,0,'POST 없음');assert.equal(t.host.log.length,0,'영상 안 올림');
 assert.ok(!s.includes(TOKEN)&&!s.includes(SECRET));
});

test('「--게시」만으로는 안 올림: 확인 코드가 없거나 틀리면 멈춤',async()=>{
 const t=setup();
 assert.equal(await t.run('--게시'),1);assert.match(t.text(),/--확인 <코드>/);
 assert.equal(await t.run('--게시','--확인','000000'),1);assert.match(t.text(),/확인 코드가 다릅니다/);
 assert.equal(t.ig.posts().length,0);assert.equal(t.host.log.length,0);
});

test('조건에 안 맞는 영상은 게시 거절',async()=>{
 const t=setup();t.info={...GOOD,width:1920,height:1080};
 assert.equal(await t.run(),1);assert.doesNotMatch(t.text(),/확인 코드/);
 assert.equal(await t.run('--게시','--확인','abcdef'),1);assert.match(t.text(),/올릴 수 없습니다: 9:16/);
 assert.equal(t.ig.posts().length,0);
});

test('정상 흐름: 올리기 → 준비 단계(REELS) → 1분 간격 확인 → 게시 → 첫 댓글 → 영상 지움, 비밀값은 어디에도 안 찍힘',async()=>{
 const t=setup(),code=await t.code();
 assert.equal(await t.run('--게시','--확인',code),0,t.text());
 const posts=t.ig.posts();
 assert.deepEqual(posts.map(c=>c.path),['/17841400000000001/media','/17841400000000001/media_publish','/M1/comments']);
 const up=t.host.log.find(l=>l[0]==='upload')[1];
 assert.equal(posts[0].p.media_type,'REELS');assert.equal(posts[0].p.video_url,`https://engchoon.github.io/ai-office-world/${up}`);assert.equal(posts[0].p.caption,CAPTION);
 assert.equal(posts[1].p.creation_id,'C1');assert.equal(posts[2].p.message,COMMENT);
 assert.deepEqual(t.sleeps,[60000,60000],'1분 간격, FINISHED에서 멈춤');
 assert.deepEqual(t.host.log.map(l=>l[0]),['upload','live','remove']);assert.equal(t.host.files.size,0);
 const lim=t.ig.calls.findIndex(c=>c.path.endsWith('content_publishing_limit')),first=t.ig.calls.findIndex(c=>c.method==='POST');
 assert.ok(lim>=0&&lim<first,'한도 조회가 게시보다 먼저');
 const st=t.state(),p=Object.values(st.posts)[0];
 assert.equal(p.done,true);assert.equal(p.media.permalink,'https://www.instagram.com/reel/M1/');
 const raw=readFileSync(join(t.insta,'state.json'),'utf8');
 for(const s of[t.text(),raw])assert.ok(!s.includes(TOKEN)&&!s.includes(SECRET),'토큰·비밀값 없음');
 assert.equal(statSync(join(t.insta,'state.json')).mode&0o777,0o600);
 assert.match(t.text(),/앱에서 첫 댓글을 고정/);
 // 같은 내용 다시: 막힘
 const before=t.ig.posts().length;
 assert.equal(await t.run('--게시','--확인',code),1);assert.match(t.text(),/이미 게시했습니다/);
 assert.equal(t.ig.posts().length,before);
 await t.code();assert.match(t.text(),/이미 게시했습니다.*--새로/);
});

test('5분(5번) 안에 처리가 안 끝나면 멈추고, 다시 실행하면 같은 준비 단계로 이어감(중복 없음)',async()=>{
 const t=setup({ig:{statusSeq:['IN_PROGRESS','IN_PROGRESS','IN_PROGRESS','IN_PROGRESS','IN_PROGRESS','IN_PROGRESS','FINISHED']}}),code=await t.code();
 assert.equal(await t.run('--게시','--확인',code),1);
 assert.equal(t.sleeps.length,5);assert.ok(t.sleeps.every(ms=>ms===60000));
 assert.match(t.text(),/5분 안에 처리가 끝나지 않았습니다/);
 assert.equal(t.host.files.size,1,'영상은 남겨 둠');assert.equal(t.ig.containers,1);
 assert.equal(await t.run('--게시','--확인',code),0,t.text());
 assert.equal(t.ig.containers,1,'준비 단계 새로 안 만듦');
 assert.equal(t.host.log.filter(l=>l[0]==='upload').length,1,'영상 다시 안 올림');
 assert.equal(t.ig.posted.length,1);assert.equal(t.host.files.size,0);
});

test('처리 실패(ERROR)면 영상 지우고 다음 실행은 처음부터',async()=>{
 const t=setup({ig:{statusSeq:['ERROR']}}),code=await t.code();
 assert.equal(await t.run('--게시','--확인',code),1);assert.match(t.text(),/처리에 실패/);
 assert.equal(t.host.files.size,0);assert.equal(t.ig.posted.length,0);
 assert.equal(Object.values(t.state().posts)[0].container,undefined);
});

test('게시 응답이 끊겨 결과를 모를 때: 다시 실행하면 최근 게시물에서 찾아 이어감(두 번 안 올림)',async()=>{
 const t=setup({ig:{publishFail:['lost']}}),code=await t.code();
 assert.equal(await t.run('--게시','--확인',code),1);
 assert.equal(t.ig.posted.length,1,'서버에는 올라감');
 assert.ok(Object.values(t.state().posts)[0].publishing,'결과 모름 표시');
 assert.equal(await t.run('--게시','--확인',code),0,t.text());
 assert.match(t.text(),/실제로 올라가 있었습니다/);
 assert.equal(t.ig.calls.filter(c=>c.path.endsWith('media_publish')).length,1,'게시 요청 한 번뿐');
 assert.deepEqual(t.ig.comments,[COMMENT]);assert.equal(t.host.files.size,0);
});

test('결과를 모르는데 최근 게시물에도 없으면 「--다시시도」 전까지 안 올림',async()=>{
 const t=setup({ig:{publishFail:['lost']}}),code=await t.code();
 await t.run('--게시','--확인',code);
 t.ig.posted.length=0;   // 실제로는 안 올라간 경우
 assert.equal(await t.run('--게시','--확인',code),1);assert.match(t.text(),/--다시시도/);
 assert.equal(t.ig.calls.filter(c=>c.path.endsWith('media_publish')).length,1);
 assert.equal(await t.run('--게시','--확인',code,'--다시시도'),0,t.text());
 assert.equal(t.ig.calls.filter(c=>c.path.endsWith('media_publish')).length,2);assert.equal(t.ig.posted.length,1);
});

test('게시 요청이 분명히 거절(오류 응답)되면 다시 실행 때 그냥 다시 시도',async()=>{
 const t=setup({ig:{publishFail:['api']}}),code=await t.code();
 assert.equal(await t.run('--게시','--확인',code),1);assert.match(t.text(),/Media ID is not available/);
 assert.equal(Object.values(t.state().posts)[0].publishing,undefined);
 assert.equal(await t.run('--게시','--확인',code),0,t.text());
 assert.equal(t.ig.posted.length,1);
});

test('첫 댓글 실패: 영상은 지우고, 다시 실행하면 댓글만 담',async()=>{
 const t=setup({ig:{commentFail:[true]}}),code=await t.code();
 assert.equal(await t.run('--게시','--확인',code),1);assert.match(t.text(),/게시는 됐지만 첫 댓글/);
 assert.equal(t.host.files.size,0);
 assert.equal(await t.run('--게시','--확인',code),0,t.text());
 assert.equal(t.ig.calls.filter(c=>c.path.endsWith('media_publish')).length,1);assert.deepEqual(t.ig.comments,[COMMENT]);
});

test('하루 게시 한도를 다 쓰면 올리기 전에 멈춤',async()=>{
 const t=setup({ig:{limit:{used:50,total:50}}}),code=await t.code();
 assert.match(t.text(),/50 \/ 50개/);
 assert.equal(await t.run('--게시','--확인',code),1);assert.match(t.text(),/한도를 다 썼습니다/);
 assert.equal(t.host.log.length,0);assert.equal(t.ig.posts().length,0);
});

test('임시 영상 지우기 실패 → 「--정리」로 지움',async()=>{
 const t=setup(),code=await t.code();t.host.removeFail=1;
 assert.equal(await t.run('--게시','--확인',code),0);assert.match(t.text(),/--정리/);
 assert.equal(t.host.files.size,1);
 t.out.length=0;assert.equal(await t.run('--상태'),0);assert.match(t.text(),/지우지 못한 임시 영상 1개/);
 assert.equal(await t.run('--정리'),0);assert.equal(t.host.files.size,0);
 assert.equal(Object.values(t.state().posts)[0].done,true);
});

test('토큰 넣기: 비밀값·토큰을 숨겨 받아 60일 토큰으로 바꾸고 600 권한 파일에만 저장',async()=>{
 const t=setup({cfg:null,ig:{token:'SHORTlivedTOKEN0001'}});
 const asked=[];t.ask=async(q,o)=>{asked.push([q,o?.hidden]);return q.startsWith('앱 비밀값')?SECRET:'SHORTlivedTOKEN0001';};
 t.ig.handle=(m,path)=>{if(path==='/access_token'){t.ig.token=TOKEN;}};
 assert.equal(await t.run('--토큰등록'),0,t.text());
 assert.ok(asked.every(a=>a[1]===true),'숨겨서 받음');
 const cfg=JSON.parse(readFileSync(join(t.insta,'config.json'),'utf8'));
 assert.equal(cfg.access_token,TOKEN);assert.equal(cfg.user_id,'17841400000000001');assert.equal(cfg.expiry_guess,false);
 assert.equal(Date.parse(cfg.token_expires_at),T0+60*DAY);
 assert.equal(statSync(join(t.insta,'config.json')).mode&0o777,0o600);
 assert.ok(!t.text().includes(TOKEN)&&!t.text().includes(SECRET)&&!t.text().includes('SHORTlivedTOKEN0001'));
 assert.match(t.text(),/@aioffice\.world/);assert.match(t.text(),/59일 남음|60일 남음/);
});

test('토큰 갱신: 24시간 안에는 안 됨, 지나면 60일 연장. 만료 임박이면 「--상태」가 알림(종료 코드 3)',async()=>{
 const fresh=setup({cfg:{access_token:TOKEN,user_id:'1',token_saved_at:new Date(T0-3600e3).toISOString(),token_expires_at:new Date(T0+60*DAY).toISOString()}});
 assert.equal(await fresh.run('--토큰갱신'),0);assert.match(fresh.text(),/24시간이 안 되어/);
 assert.equal(fresh.ig.calls.filter(c=>c.path==='/refresh_access_token').length,0);

 const old=setup({cfg:{access_token:TOKEN,user_id:'1',token_saved_at:new Date(T0-55*DAY).toISOString(),token_expires_at:new Date(T0+5*DAY).toISOString()}});
 assert.equal(await old.run('--상태'),3);assert.match(old.text(),/⚠️ 만료 임박 — 5일 남음/);
 assert.equal(await old.run('--토큰갱신'),0);
 const cfg=JSON.parse(readFileSync(join(old.insta,'config.json'),'utf8'));
 assert.equal(cfg.access_token,NEW_TOKEN);assert.equal(Date.parse(cfg.token_expires_at),T0+60*DAY);
 assert.ok(!old.text().includes(NEW_TOKEN)&&!old.text().includes(TOKEN));
 old.out.length=0;assert.equal(await old.run('--상태'),0);assert.match(old.text(),/토큰: 60일 남음/);
});

test('게시할 때 남은 날이 15일 이하면 저절로 갱신, 만료됐으면 멈춤',async()=>{
 const t=setup({cfg:{access_token:TOKEN,user_id:'17841400000000001',token_saved_at:new Date(T0-48*DAY).toISOString(),token_expires_at:new Date(T0+12*DAY).toISOString()}});
 const code=await t.code();
 assert.match(t.text(),/토큰: 12일 남음/);
 assert.equal(await t.run('--게시','--확인',code),0,t.text());
 const ref=t.ig.calls.findIndex(c=>c.path==='/refresh_access_token');
 assert.ok(ref>=0&&ref<t.ig.calls.findIndex(c=>c.method==='POST'),'게시 전에 갱신');
 assert.equal(t.ig.calls.filter(c=>c.path==='/refresh_access_token').length,1);
 assert.ok(!t.text().includes(NEW_TOKEN));

 const dead=setup({cfg:{access_token:TOKEN,user_id:'1',token_saved_at:new Date(T0-70*DAY).toISOString(),token_expires_at:new Date(T0-DAY).toISOString()}});
 assert.equal(await dead.run('--게시','--확인',await dead.code()),1);assert.match(dead.text(),/만료됨/);
 assert.equal(dead.ig.posts().length,0);
});

test('오류 글에 토큰이 섞여도 가려서 보여 줌',async()=>{
 const t=setup();
 t.ig.handle=(m,path)=>{if(path==='/me')throw new TypeError(`fetch failed: https://graph.instagram.com/v24.0/me?access_token=${TOKEN}`);};
 await t.run();
 assert.match(t.text(),/인스타 조회 실패/);assert.ok(!t.text().includes(TOKEN));
 const r=makeRedactor(SECRET);assert.equal(r(`x?client_secret=${SECRET}&access_token=abcdefgh`),'x?client_secret=[가림]&access_token=[가림]');
});

test('토큰 폴더는 git이 무시함(저장소에 안 올라감), 무시 안 되는 폴더면 멈춤',()=>{
 for(const f of['.instagram/config.json','.instagram/state.json'])execFileSync('git',['-C',ROOT,'check-ignore','-q',f]);
 assert.equal(assertIgnored(join(ROOT,'.instagram')),true);
 assert.throws(()=>assertIgnored(join(ROOT,'scripts/insta')),/\.gitignore/);
 assert.equal(existsSync(join(ROOT,'.instagram/config.json'))?'있음':'없음','없음','시험이 실제 설정 파일을 만들지 않음');
 assert.equal(tokenStatus(null).has,false);
});
