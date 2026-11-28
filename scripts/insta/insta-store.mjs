// 인스타 릴스 올리기 — 로컬 설정(토큰·앱 비밀값)과 진행 상태 저장, 비밀값 가리기.
// 설정·상태는 저장소 맨 위 .instagram/ 한 폴더에만 둔다(.gitignore 처리, 커밋 금지). 시험은 INSTA_DIR로 다른 폴더를 쓴다.
//   .instagram/config.json  토큰·앱 비밀값·계정 ID·만료일 (파일 권한 600)
//   .instagram/state.json   게시 진행 상태(같은 게시를 두 번 올리지 않으려고). 비밀값은 절대 넣지 않는다.
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,renameSync,chmodSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';

export const ROOT=resolve(import.meta.dirname,'../..');
export const DAY=24*3600e3;
/** 토큰 수명(인스타그램 로그인 장기 토큰 60일), 만료 임박 알림 기준, 게시 때 저절로 갱신하는 기준. */
export const TOKEN={lifeDays:60,warnDays:10,autoRefreshDays:15,minAgeForRefreshMs:DAY};

export const instaDir=(env=process.env)=>env.INSTA_DIR?resolve(env.INSTA_DIR):join(ROOT,'.instagram');
const readJson=(p,fallback)=>{try{return JSON.parse(readFileSync(p,'utf8'));}catch{return fallback;}};
function writeJson(p,obj,mode){
 mkdirSync(resolve(p,'..'),{recursive:true,mode:0o700});
 const tmp=p+'.tmp';writeFileSync(tmp,JSON.stringify(obj,null,1)+'\n',{mode});renameSync(tmp,p);
 if(mode)try{chmodSync(p,mode);}catch{}
}

/** 설정 폴더가 저장소 안이면 git이 무시하는지 확인한다. 무시하지 않으면 비밀값이 커밋될 수 있어 멈춘다. */
export function assertIgnored(dir){
 const rel=relative(ROOT,dir);
 if(rel.startsWith('..')||isAbsolute(rel))return true;
 try{execFileSync('git',['-C',ROOT,'check-ignore','-q',join(rel,'config.json')],{stdio:'ignore'});return true;}
 catch{throw new Error(`${rel}/ 폴더가 .gitignore에 없습니다. 토큰이 커밋될 수 있어 멈춥니다. .gitignore에 「${rel}/」를 넣어 주세요.`);}
}

export function loadConfig(dir){return readJson(join(dir,'config.json'),null);}
export function saveConfig(dir,cfg){assertIgnored(dir);writeJson(join(dir,'config.json'),cfg,0o600);}
export function loadState(dir){return readJson(join(dir,'state.json'),{posts:{}});}
export function saveState(dir,state){assertIgnored(dir);writeJson(join(dir,'state.json'),state,0o600);}

/** 글 속 비밀값을 가린다: 설정의 토큰·앱 비밀값 그대로 + 주소에 붙은 access_token=·client_secret= 꼴. */
export function makeRedactor(...secrets){
 const list=secrets.flat().filter(s=>typeof s==='string'&&s.length>=6);
 return text=>{
  let s=String(text);
  for(const v of list)s=s.split(v).join('[가림]');
  return s.replace(/(access_token|client_secret|code)=([^&\s"']+)/gi,'$1=[가림]').replace(/(Bearer\s+)[\w.-]+/gi,'$1[가림]');
 };
}

/** 토큰 상태: 남은 날·만료 임박·갱신 가능 여부. */
export function tokenStatus(cfg,now=Date.now()){
 if(!cfg?.access_token)return{has:false};
 const exp=cfg.token_expires_at?Date.parse(cfg.token_expires_at):NaN,saved=cfg.token_saved_at?Date.parse(cfg.token_saved_at):NaN;
 const daysLeft=Number.isFinite(exp)?Math.floor((exp-now)/DAY):null;
 return{has:true,expiresAt:cfg.token_expires_at??null,guess:!!cfg.expiry_guess,daysLeft,
  expired:Number.isFinite(exp)&&exp<=now,warn:daysLeft!=null&&daysLeft<=TOKEN.warnDays,
  canRefresh:!(Number.isFinite(saved)&&now-saved<TOKEN.minAgeForRefreshMs)&&!(Number.isFinite(exp)&&exp<=now),
  wantRefresh:daysLeft!=null&&daysLeft<=TOKEN.autoRefreshDays};
}

export function tokenLine(st){
 if(!st.has)return'토큰: 없음 (설정 문서의 「토큰 넣기」를 먼저 해 주세요)';
 if(st.expired)return`토큰: ⛔ 만료됨(${st.expiresAt?.slice(0,10)}). 새로 받아 「--토큰등록」 해 주세요`;
 const d=st.daysLeft==null?'만료일 모름':`${st.daysLeft}일 남음(${st.expiresAt.slice(0,10)}${st.guess?', 추정':''})`;
 return st.warn?`토큰: ⚠️ 만료 임박 — ${d}. 「--토큰갱신」을 해 주세요`:`토큰: ${d}`;
}

export const fileExists=existsSync;
