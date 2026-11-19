// 허브의 서버 상태(11-17 허브 개선): 체험마다 서버 3개의 인원과 켜짐·확인 중·꺼짐.
// 서버 주소는 체험 페이지와 같은 순서로 찾는다(server-link.js chooseServer: 빌드 변수 → 공개 파일 multi-server.json → 기억한 값).
// 인원은 함께 걷기 서버 GET /health(servers·total)를 5초마다 다시 받는다(서버 고르기 창 server-pick.js와 같은 계산 pickRows·pickTotals).
import {chooseServer,fetchServerFile} from '../server-link.js';
import {healthUrl,pickRows,pickTotals,REFRESH_MS,FETCH_TIMEOUT_MS,RETRY_MS,RETRY_TIMEOUT_MS,FAIL_LIMIT} from '../server-pick.js';
import {SERVERS} from '../multi-protocol.js';

// net: 'checking'(주소 찾는 중·첫 /health 기다림) · 'ok' · 'off'(공개 파일 '꺼짐') · 'none'(주소 없음) · 'error'(/health 실패)
export function hubServerView(exp,{net='checking',health=null}={},servers=SERVERS){
 const state=net==='ok'&&health?.servers?'on':net==='checking'?'checking':'off';
 const rows=pickRows(exp,state==='on'?health:null,servers);
 const t=state==='on'?pickTotals(exp,health,servers):{here:null,total:null};
 const cap=rows.reduce((n,r)=>n+r.max,0);
 return {state,rows,here:t.here,total:t.total,cap,best:state==='on'?bestServer(rows):null,reason:state==='off'?net:null};
}
// 미리 골라 둘 서버: 꽉 차지 않은 서버 중 80% 아래에서 사람이 가장 많은 곳(같이 놀 사람이 있게), 없으면 꽉 차지 않은 첫 서버, 다 차면 null.
export function bestServer(rows){
 const ok=rows.filter(r=>r.count!==null&&!r.full);
 const roomy=ok.filter(r=>r.count<r.max*.8).sort((a,b)=>b.count-a.count);
 return (roomy[0]??ok[0])?.id??null;
}
// 위 띠: 모든 체험 합계. 모르면 null.
export const hubTotal=(st)=>st?.net==='ok'&&st.health?.servers?pickTotals('hiking',st.health).total:null;

/** 서버 상태 받아 오기. onChange(state)로 알린다. start() 한 번, stop()으로 멈춤. 시험에서는 fetchImpl·choose·타이머를 바꿔 끼운다. */
export function createHubServers({base='/',envUrl='',storage,fetchImpl=globalThis.fetch?.bind(globalThis),onChange=()=>{},
 choose=()=>chooseServer({envUrl,storage,fetchFile:()=>fetchServerFile({base,fetchImpl})}),setTimer=setTimeout,clearTimer=clearTimeout,doc=globalThis.document}={}){
 const st={net:'checking',health:null,url:null,source:null};
 let timer=null,seq=0,stopped=false,abort=null,fails=0;
 const emit=()=>{try{onChange({...st});}catch{}};
 async function refresh(){
  if(!st.url||!fetchImpl)return;
  const my=++seq;abort?.abort?.();const ctl=typeof AbortController==='function'?new AbortController():null;abort=ctl;
  const to=setTimer(()=>ctl?.abort(),fails?RETRY_TIMEOUT_MS:FETCH_TIMEOUT_MS);
  try{
   const r=await fetchImpl(st.url,{cache:'no-store',signal:ctl?.signal});
   if(!r.ok)throw new Error(`HTTP ${r.status}`);
   const h=await r.json();if(my!==seq)return;
   if(!h?.servers)throw new Error('servers 없음');
   st.health=h;st.net='ok';fails=0;
  }catch{if(my!==seq)return;fails++;if(fails>=FAIL_LIMIT){st.health=null;st.net='error';}} // 한 번 실패는 지난 상태(처음이면 '확인 중') 그대로, 곧 다시(server-pick.js와 같은 규칙)
  finally{clearTimer(to);}
  emit();
 }
 function loop(){clearTimer(timer);if(stopped||!st.url)return;timer=setTimer(async()=>{if(!doc?.hidden)await refresh();loop();},fails&&fails<FAIL_LIMIT?RETRY_MS:REFRESH_MS);}
 async function start(){
  stopped=false;emit();
  let c=null;try{c=await choose();}catch{}
  if(stopped)return {...st};
  st.source=c?.source??'none';st.url=c?.server?healthUrl(c.server):null;
  if(!st.url){st.net=st.source==='file-off'?'off':'none';emit();return {...st};}
  await refresh();loop();return {...st};
 }
 function stop(){stopped=true;clearTimer(timer);timer=null;seq++;abort?.abort?.();}
 return {start,stop,refresh,get state(){return {...st};}};
}
