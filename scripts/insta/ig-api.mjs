// 인스타그램 API(인스타그램 로그인 방식, graph.instagram.com) 호출 모음. 필요한 권한:
//   instagram_business_basic · instagram_business_content_publish · instagram_business_manage_comments
// 토큰은 GET은 주소 뒤에, POST는 본문에 넣는다. 주소·응답을 그대로 화면에 찍지 않는다(오류 글도 가린 뒤 보여 줌).
// fetchImpl을 주입하면 가짜 응답으로 시험할 수 있다.

export const IG_HOST='https://graph.instagram.com';
export const DEFAULT_VERSION='v24.0';

export class IgError extends Error{
 /** ambiguous = 응답을 못 받아 서버에서 실제로 됐는지 모름(게시 중복 막기에 씀). */
 constructor(message,{status=0,code=null,ambiguous=false}={}){super(message);this.status=status;this.code=code;this.ambiguous=ambiguous;}
}

export function createIgApi({token,userId,version=DEFAULT_VERSION,fetchImpl=fetch,redact=s=>s,timeoutMs=60e3}={}){
 const url=(path,q={})=>{
  const u=new URL(path.startsWith('http')?path:`${IG_HOST}/${version}/${path}`);
  for(const[k,v]of Object.entries(q))if(v!=null)u.searchParams.set(k,String(v));
  return u;
 };
 async function call(method,path,params={}){
  let res;
  try{
   if(method==='GET')res=await fetchImpl(url(path,{...params,access_token:token}).href,{method,signal:AbortSignal.timeout(timeoutMs)});
   else res=await fetchImpl(url(path).href,{method,headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams(Object.entries({...params,access_token:token}).filter(([,v])=>v!=null).map(([k,v])=>[k,String(v)])).toString(),
    signal:AbortSignal.timeout(timeoutMs)});
  }catch(e){throw new IgError(`인스타그램에 연결하지 못했습니다(${redact(e.message)})`,{ambiguous:true});}
  let body=null;try{body=await res.json();}catch{}
  if(!res.ok||body?.error){
   const err=body?.error,msg=err?`${err.message??'오류'} (코드 ${err.code??'?'}${err.error_subcode?'/'+err.error_subcode:''})`:`HTTP ${res.status}`;
   // 5xx·내용 없는 응답은 서버에서 처리됐을 수도 있음
   throw new IgError(redact(msg),{status:res.status,code:err?.code??null,ambiguous:res.status>=500||!err});
  }
  return body??{};
 }
 const me=()=>userId??(()=>{throw new IgError('계정 ID가 없습니다. 「--토큰등록」을 다시 해 주세요');})();
 return{
  call,
  /** 계정 확인: {user_id, username} */
  account:()=>call('GET','me',{fields:'user_id,username'}),
  /** 릴스 준비 단계(컨테이너) 만들기 → {id} */
  createReel:({videoUrl,caption,shareToFeed=true})=>call('POST',`${me()}/media`,{media_type:'REELS',video_url:videoUrl,caption,share_to_feed:shareToFeed}),
  /** 준비 단계 상태 → {status_code: IN_PROGRESS|FINISHED|ERROR|EXPIRED|PUBLISHED, status} */
  containerStatus:id=>call('GET',id,{fields:'status_code,status'}),
  publish:creationId=>call('POST',`${me()}/media_publish`,{creation_id:creationId}),
  media:id=>call('GET',id,{fields:'id,permalink,timestamp'}),
  recentMedia:(limit=10)=>call('GET',`${me()}/media`,{fields:'id,caption,timestamp,media_product_type,permalink',limit}),
  comment:(mediaId,message)=>call('POST',`${mediaId}/comments`,{message}),
  /** 하루(24시간) 게시 한도 → {used,total,hours} */
  async limit(){
   const r=await call('GET',`${me()}/content_publishing_limit`,{fields:'quota_usage,config'});
   const d=r.data?.[0]??{};
   return{used:d.quota_usage??null,total:d.config?.quota_total??null,hours:d.config?.quota_duration!=null?Math.round(d.config.quota_duration/3600):null};
  },
  /** 장기 토큰 60일 연장 → {access_token, expires_in} (토큰이 24시간 이상 지났고 아직 살아 있어야 함) */
  refresh:()=>call('GET',`${IG_HOST}/refresh_access_token`,{grant_type:'ig_refresh_token'}),
  /** 단기 토큰(1시간) → 장기 토큰(60일). 앱 비밀값 필요. */
  exchange:clientSecret=>call('GET',`${IG_HOST}/access_token`,{grant_type:'ig_exchange_token',client_secret:clientSecret}),
 };
}
