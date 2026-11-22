// 남산 상호작용 컨트롤러(한 게임 통합 5단계, 월드개발 11-20). 장면·DOM을 모르고, game.js가 넘긴 값(deps)만 쓴다(시험은 가짜 deps).
// 관악산 interaction-controller.js와 같은 길: 가까운 후보 찾기(pickCandidate·같은 반경·앞 70°) → 할 일 줄(F·2·3) → 실행.
// 관악산 파일은 고치지 않고 순수 함수·화면(interaction-logic·interaction-ui)만 빌려 쓴다. 남산을 공통 본체로 옮기는 6단계에서 합친다.
//  - 행동: 약수 마시기(spring)·손 담그기(물확 2곳)·돌 올리기(정상 돌탑) — 관악산과 같은 시간·소리·카메라 숙임(actionPose)
//  - 읽기: 이정표 4개·정상석 「남산 265m」(F = 정상 인증) · 스탬프함 4개(지나가며 못 찍었으면 F로 찍음)
//  - 쌍안경 이름표: 정상 광장·전망 쉼터(높이 215m 이상)
//  - 사랑의 자물쇠·정상 야경 벤치·순환버스: 여기서는 후보·줄만 만들고 실행은 game.js 손잡이(onLock·onBench·onBus)
import {pickCandidate,markerCandidates,landmarkAt,classifyLandmarks,stackLabels,headingToBearing,weatherVisibility,arrowAngle,directionToBearing} from '../interaction-logic.js';
import {actionPose} from '../interaction-controller.js';
import {RULES} from '../interaction-data.js';
import {NS_STAMPS,NS_SIGNS,NS_SUMMIT_PAGE,NS_SOURCE,NS_NOTICE,NS_LANDMARKS,NS_LANDMARK_ABOUT,NS_LANDMARK_MIN_ELEVATION,NS_ACTIONS,NS_LOCKS,NS_BENCH,STONE_NOTICE} from './namsan-content.js';

export const NS_PROGRESS_KEY='namsan-interaction:v1';
export const emptyNsProgress=()=>({read:{},drinks:0,dips:0,stones:0,certifiedAt:null,locks:[],benches:0,busRides:0});
const int=v=>Number.isInteger(v)&&v>=0?v:0;
export function loadNsProgress(storage){
 let raw=null;try{raw=JSON.parse(storage?.getItem(NS_PROGRESS_KEY)??'null');}catch{}
 const p=emptyNsProgress();if(!raw||typeof raw!=='object')return p;
 for(const k of ['drinks','dips','stones','benches','busRides'])p[k]=int(raw[k]);
 if(raw.read&&typeof raw.read==='object')for(const [k,v] of Object.entries(raw.read))if(v===true&&/^[a-z0-9-]{1,32}$/.test(k))p.read[k]=true;
 if(Number.isFinite(raw.certifiedAt))p.certifiedAt=raw.certifiedAt;
 if(Array.isArray(raw.locks))p.locks=raw.locks.filter(l=>Number.isInteger(l?.i)&&l.i>=0&&l.i<4096&&Number.isInteger(l.c)&&l.c>=0&&l.c<NS_LOCKS.colors.length).slice(0,NS_LOCKS.max).map(l=>({i:l.i,c:l.c,h:l.h?1:0,at:Number.isFinite(l.at)?l.at:0,...(typeof l.text==='string'&&l.text?{text:l.text.slice(0,120)}:{})})); // text: 11-22 「이 기기에만」 자물쇠의 한마디
 return p;
}
export const saveNsProgress=(storage,p)=>{try{storage?.setItem(NS_PROGRESS_KEY,JSON.stringify(p));return true;}catch{return false;}};

// ── 자물쇠 공유(함께 걷기 act의 x 칸, 서버 그대로): 'lk-' + 자물쇠마다 3자리 36진수(자리 i + 색×256 + 하트×4096) ──
// x 허용 글자 [a-z0-9-] 24자 안: 최대 3개 = 12자. 다른 동작(약수 등) 중에는 x가 그 동작 이름으로 바뀌고, 끝나면 다시 자물쇠 줄.
export const lockCode=l=>((l.i&255)+(l.c&15)*256+(l.h?4096:0)).toString(36).padStart(3,'0');
export const decodeLock=s=>{const v=parseInt(s,36);return Number.isFinite(v)?{i:v&255,c:(v>>8)&15,h:(v>>12)&1}:null;};
export const encodeLocks=list=>list?.length?'lk-'+list.slice(0,NS_LOCKS.max).map(lockCode).join(''):'';
export function decodeLocks(x){
 if(typeof x!=='string'||!/^lk-([0-9a-z]{3}){1,7}$/.test(x))return [];
 const out=[];for(let k=3;k<x.length;k+=3){const l=decodeLock(x.slice(k,k+3));if(l&&l.c<NS_LOCKS.colors.length)out.push(l);}return out.slice(0,NS_LOCKS.max);
}

// ── 정상 야경 벤치 자리(11-20): 정상 광장 소품 벤치는 전망탑·버스 고리에 모두 걸려 0개라, 야경 벤치 2개를 따로 놓는다(그림은 관악산 벤치 bench() 그대로).
// 광장 가장자리 안쪽에서 바깥(풍경)을 보게, 북쪽 도심(방위 350°)을 가장 잘 보는 자리부터. avoid = [{x,z,r}] 비켜야 할 것(전망탑·자물쇠 난간·표지석·가로등 등),
// busClear(x,z) = 버스 고리·차로에서 떨어졌는지. 돌려줌 [{x,z,yaw(소품 회전 = 앞 +Z가 바깥), bearing}]
export function planNightBenches(G,{avoid=[],busClear=()=>true,count=2,gap=5,want=350}={}){
 const P=G.plaza,out=[];
 const rows=[];for(const inset of [2.6,3.1]){for(let a=0;a<360;a+=3){const r=P.r-inset,rad=a*Math.PI/180,x=P.x+Math.sin(rad)*r,z=P.z-Math.cos(rad)*r;
  if(avoid.some(o=>Math.hypot(o.x-x,o.z-z)<o.r)||!busClear(x,z))continue;const d=Math.abs(((a-want+540)%360)-180);rows.push({x,z,bearing:a,score:d+inset*2});}}
 rows.sort((u,v)=>u.score-v.score);
 for(const r of rows){if(out.some(o=>Math.hypot(o.x-r.x,o.z-r.z)<gap))continue;out.push({x:r.x,z:r.z,bearing:r.bearing,yaw:Math.atan2(Math.sin(r.bearing*Math.PI/180),-Math.cos(r.bearing*Math.PI/180))});if(out.length>=count)break;}
 return out;
}
const READ_LABEL={sign:'이정표 읽기','summit-stone':'정상석 확인'};
/**
 * deps: player() → {x,z,heading(카메라가 보는 쪽),elevation,inSummit,busy,floor('ground'|'deck', 11-22 전망대)}, stamps() → 찍은 번호 배열, addStamp(n) → 새로 찍었으면 true,
 *  ui(interaction-ui의 openBoard·closeBoard·toast·setAction·setBino·setMarkers), sound(play·playAction·cancel), storage,
 *  geo(lat,lon) → {x,z}, projectDir(bearing,elevDeg) → {x,y,visible}, projectWorld(x,y,z) → {x,y,visible}, cameraInfo() → {fov,aspect,zoom},
 *  weather() → {kind,label}, gadget() → 'none'|'binoculars', summitCount() → 관악산 완등 횟수(쌍안경 「다녀온 산」),
 *  onLock(cand)·onBench(cand)·onBus(cand)·onSummitCard()·onTower(cand) — 실행을 game.js가 맡는 것
 *  towerSpots = [{id,action:'tower'|'scope'|'towerexit',x,z,y,floor,label,sub}] 전망탑 입구·망원경·나가기(11-22), towerRow(c,key) = 그 줄
 */
export function createNamsanInteract({spots=[],items=[],benches=[],busStops=[],player,stamps=()=>[],addStamp=()=>false,ui,sound={play(){},playAction(){},cancel(){}},storage=null,now=()=>Date.now(),
 geo,projectDir=()=>null,projectWorld=()=>null,cameraInfo=()=>({fov:65,aspect:16/9,zoom:1}),weather=()=>({kind:'clear',label:''}),gadget=()=>'none',summitCount=()=>0,
 onLock=()=>{},onLockRead=()=>{},onBench=()=>{},onBus=()=>{},onSummitCard=()=>{},busRow=()=>null,lockRow=()=>null,lockReadRow=()=>null,
 towerSpots=[],onTower=()=>{},towerRow=()=>null}={}){
 const progress=loadNsProgress(storage),persist=()=>saveNsProgress(storage,progress);
 let t=0,current=null,view=null,action=null,result=null,tagsOn=true,lastBino=null,lastTick=-9;const cool={};
 // ── 후보(한 번) ──
 const cands=[];
 const glyph={drink:'水',dip:'水',cairn:'石',lock:'♥',read:'i',stamp:'印',stone:'臺',bench:'椅',bus:'車'};
 for(const s of spots){
  const base={id:s.id,x:s.x,z:s.z,y:s.y,site:s,group:s.id,glyph:glyph[s.action]??'·'};
  if(s.action==='drink'||s.action==='dip'||s.action==='cairn')cands.push({...base,action:s.action,showRadius:s.action==='cairn'?4.5:RULES.show});
  else if(s.action==='lock'){cands.push({...base,action:'lock',showRadius:4});cands.push({...base,id:`${s.id}-read`,action:'lockread',glyph:'♥',showRadius:4,priority:1});} // 11-22: 2 = 자물쇠 읽기
 }
 for(const it of items){
  if(it.kind==='sign')cands.push({id:`ns-sign-${it.n}`,x:it.x,z:it.z,y:it.y??0,site:it,group:`ns-sign-${it.n}`,action:'read',glyph:'i',showRadius:RULES.show});
  else if(it.kind==='stamp')cands.push({id:`ns-stamp-${it.n}`,x:it.x,z:it.z,y:it.y??0,site:it,group:it.n===4?'ns-summit':`ns-stamp-${it.n}`,action:'stamp',glyph:'印',showRadius:RULES.showStamp,priority:1});
  else if(it.kind==='summit-stone')cands.push({id:'ns-summit-stone',x:it.x,z:it.z,y:it.y??0,site:it,group:'ns-summit',action:'stone',glyph:'臺',showRadius:RULES.showStamp,priority:0});
 }
 benches.forEach((b,i)=>cands.push({id:`ns-bench-${i+1}`,x:b.x,z:b.z,y:b.y??0,site:b,group:`ns-bench-${i+1}`,action:'bench',glyph:'椅',showRadius:NS_BENCH.reach}));
 // 전망탑(11-22): 입구(광장)·망원경·나가기(전망대 안). floor = 'ground'(기본)|'deck' — 플레이어와 같은 층 후보만 본다(탑 문 앞과 전망대 안은 x,z가 1m 남짓 떨어져 있음)
 for(const t of towerSpots)cands.push({id:t.id,x:t.x,z:t.z,y:t.y??0,site:t,group:t.id,action:t.action,glyph:{tower:'塔',scope:'鏡',towerexit:'↓'}[t.action]??'·',showRadius:t.showRadius??3,floor:t.floor??'ground',priority:t.priority??0});
 for(const b of busStops)cands.push({id:`ns-bus-${b.stop}`,x:b.x,z:b.z,y:b.y??0,site:b,group:`ns-bus-${b.stop}`,action:'bus',glyph:'車',showRadius:6});
 const doneFor=c=>c.action==='read'?!!progress.read[c.id]:c.action==='stamp'?stamps().includes(c.site.n):c.action==='stone'?progress.certifiedAt!=null:false;

 // ── 할 일 줄 ──
 function rowFor(c,i){
  const key=i===0?'F':String(i+1);
  if(c.action==='read'){const sg=NS_SIGNS.find(s=>s.n===c.site.n);return {key,label:READ_LABEL.sign,sub:sg?.page.title??'코스 이정표',state:progress.read[c.id]?'done':'ready'};}
  if(c.action==='stone')return {key,label:progress.certifiedAt!=null?'정상석 · 인증했어요':'정상석 확인 · 정상 인증',sub:'남산 265m',state:progress.certifiedAt!=null?'done':'ready'};
  if(c.action==='stamp'){const s=NS_STAMPS.find(x=>x.n===c.site.n),got=stamps().includes(c.site.n);return {key,label:got?`스탬프 ✓ ${s.name}`:`스탬프 찍기 · ${s.name}`,sub:got?'이미 찍었어요':s.note,state:got?'done':'ready'};}
  if(NS_ACTIONS[c.action]){const a=NS_ACTIONS[c.action],wait=Math.max(0,(cool[c.action]??0)-t);
   if(wait>0&&c.action!=='cairn')return {key,label:a.label,sub:a.sub,state:'lock',reason:`${Math.ceil(wait)}초 뒤에 다시 할 수 있어요`};
   return {key,label:a.label,sub:c.action==='cairn'?`${STONE_NOTICE}${progress.stones?` · 내 돌 ${progress.stones}개`:''}`:a.sub,state:'ready'};}
  if(c.action==='lock')return lockRow(c,key)??{key,label:'사랑의 자물쇠 걸기',sub:`내 자물쇠 ${progress.locks.length} / ${NS_LOCKS.max}`,state:progress.locks.length>=NS_LOCKS.max?'lock':'ready',reason:progress.locks.length>=NS_LOCKS.max?`내 자물쇠 ${NS_LOCKS.max}개를 다 걸었어요`:''};
  if(c.action==='lockread')return lockReadRow(c,key)??{key,label:'자물쇠 읽기',sub:'',state:'ready'};
  if(c.action==='bench')return {key,label:NS_BENCH.label,sub:NS_BENCH.sub,state:'ready'};
  if(c.action==='tower'||c.action==='scope'||c.action==='towerexit')return towerRow(c,key)??{key,label:c.site.label??'',sub:c.site.sub??'',state:'ready'};
  if(c.action==='bus')return busRow(c,key)??{key,label:'순환버스 타기',sub:c.site.stop==='start'?'정상까지':'백범광장까지',state:'ready'};
  return {key,label:'',sub:'',state:'ready'};
 }
 const hidden=()=>!!action||ui.boardOpen||!!player().busy;
 const onFloor=p=>{const f=p.floor??'ground';return cands.filter(c=>(c.floor??'ground')===f);};

 // ── 읽기 ──
 function signPages(c){
  const sg=NS_SIGNS.find(s=>s.n===c.site.n),boards=c.site.boards??[],p=player();if(!sg)return [];
  const lmDir=id=>{const lm=NS_LANDMARKS.find(l=>l.id===id);if(!lm||!geo)return null;const q=geo(lm.lat,lm.lon);return directionToBearing(q.x-c.x,q.z-c.z);};
  const rows=boards.map((text,i)=>{const d=sg.dirs[i]??'up';const bearing=d==='up'?c.site.upBearing:d==='down'?(c.site.upBearing??0)+180:d.lm?lmDir(d.lm):d.bearing;
   return {text,angle:arrowAngle(-(bearing??0)*Math.PI/180,p.heading),hint:d==='up'?'오르는 쪽':d==='down'?'내려가는 쪽':'방향 · 직접 계산'};});
  return [{title:'이정표',rows,body:[],chips:[{kind:'est',text:'게임 속 이정표'}],source:NS_SOURCE},{...sg.page,source:NS_SOURCE}];
 }
 function openRead(c){const pages=signPages(c);if(!pages.length)return;progress.read[c.id]=true;persist();sound.play('tick');ui.openBoard({eyebrow:`이정표 ${c.site.n} · 남산 성곽길`,pages,notice:NS_NOTICE});}
 function stone(){
  const first=progress.certifiedAt==null;if(first){progress.certifiedAt=now();persist();sound.play('stamp');}
  // 정상 스탬프를 새로 찍었으면 알림 하나에 같이 쓴다(알림 두 개가 겹쳐 「정상 인증」이 가려지던 것, 11-20 월드디자인 확인 3)
  const newStamp=addStamp(4,{quiet:true});
  ui.openBoard({eyebrow:'정상석 · 남산',pages:[{...NS_SUMMIT_PAGE,source:NS_SOURCE}],notice:NS_NOTICE});
  if(first||newStamp)ui.toast(`${first?'정상 인증 · 남산 265m':'남산 265m'}${newStamp?` · 스탬프 ${stamps().length} / ${NS_STAMPS.length}`:''}`,{ms:2800});
 }
 function stamp(c){const s=NS_STAMPS.find(x=>x.n===c.site.n);if(stamps().includes(c.site.n)){ui.toast('이미 찍은 스탬프예요');return;}if(addStamp(c.site.n))sound.play('stamp');}
 // ── 행동 ──
 function begin(id,cand){
  const a=NS_ACTIONS[id],wait=Math.max(0,(cool[id]??0)-t);
  if(wait>0&&id!=='cairn'){ui.toast(`${Math.ceil(wait)}초 뒤에 다시 할 수 있어요`);return false;}
  action={id,t:0,total:a.total,cand};cool[id]=t+a.cooldown+a.total;sound.playAction(id);return true;
 }
 function finish(){
  const a=action,def=NS_ACTIONS[a.id];
  if(a.id==='drink')progress.drinks++;else if(a.id==='dip')progress.dips++;else if(a.id==='cairn')progress.stones++;
  persist();sound.play('done');ui.toast(a.id==='cairn'?`${def.done} · 내 돌 ${progress.stones}개`:def.done,{ms:3000});action=null;ui.setAction(null);result={id:a.id,at:t};
 }
 function cancel(why='움직여서 멈췄어요'){if(!action)return;sound.cancel();ui.setAction(null);ui.toast(why,{ms:1600});cool[action.id]=Math.min(cool[action.id]??0,t+1);action=null;}
 // ── 쌍안경 이름표 ──
 const enabled=p=>!!p.inSummit||(p.elevation??0)>=NS_LANDMARK_MIN_ELEVATION;
 function binoModel(){
  const p=player(),cam=cameraInfo(),b=headingToBearing(p.heading),vis=weatherVisibility(weather().kind);
  const half=Math.atan(Math.tan(cam.fov*Math.PI/360)*cam.aspect)*180/Math.PI/Math.max(.5,cam.zoom);
  if(!enabled(p)||!geo)return {bearing:b,tape:[],labels:[],edges:[],focus:null,note:'이름표가 보여요'};
  const rows=NS_LANDMARKS.map(lm=>{const r=landmarkAt(lm,geo(lm.lat,lm.lon),{x:p.x,z:p.z,elevation:p.elevation??0},vis);return lm.id==='lm-gwanak'&&summitCount()>0?{...r,note:`다녀온 산 · 완등 ${summitCount()}회`}:r;});
  const c=classifyLandmarks(rows,b,{halfFov:half});
  const tape=c.tape.map(r=>({id:r.id,delta:r.delta,short:r.name.replace(/ \((.*)\)/,'($1)'),directionOnly:r.directionOnly}));
  let labels=[],edges=[],focus=null;
  if(tagsOn){
   const placed=c.inView.map(r=>{const q=projectDir(r.bearing,r.elev);return q&&q.visible?{...r,x:q.x,y:q.y}:null;}).filter(Boolean);
   labels=stackLabels(placed.slice(0,6)).map(r=>({x:r.x,y:r.y,name:r.name,sub:`${r.km.toFixed(1)}km${r.hazyNow?' · 지금은 안 보여요':r.blocked?' · 추정':''}${r.note&&r.id==='lm-gwanak'?' · '+r.note:''}`,row:r.row,rise:Math.max(14,Math.min(30+r.row*38,r.y-(globalThis.innerHeight||900)*.3-44)),dim:!r.seeable,directionOnly:false,focus:c.focus?.id===r.id}));
   edges=c.edges.filter(r=>!c.inView.some(v=>v.id===r.id)).map(r=>({delta:r.delta,directionOnly:false,text:`${r.name} · ${Math.abs(r.delta).toFixed(0)}° ${r.delta<0?'왼쪽':'오른쪽'}`}));
   if(c.focus){const f=c.focus,ab=NS_LANDMARK_ABOUT[f.id];focus={id:f.id,name:f.name,row:f,lines:[...(ab?[ab.line+' · F 설명 보기']:[]),`방위 ${f.bearing.toFixed(1)}° · 거리 ${f.km.toFixed(1)}km${f.height?' · 높이 '+f.height:''}`,f.hazyNow?'지금 날씨에서는 안 보여요':f.blocked?'다른 산에 가려질 수 있어요 (추정)':'맑은 날 보여요',...(f.note?[f.note]:[])]};}
  }
  return {bearing:b,tape,labels,edges,focus,note:tagsOn?null:'이름표 꺼짐 · N으로 켜기'};
 }
 const compass8=b=>['북','북동','동','남동','남','남서','서','북서'][Math.round(((b%360)+360)%360/45)%8];
 function landmarkPage(f){const lm=f.row,ab=NS_LANDMARK_ABOUT[lm.id];
  return [{title:lm.name,body:[...(ab?.body??[]),`여기서 ${compass8(lm.bearing)}쪽(${lm.bearing.toFixed(0)}°)으로 약 ${lm.km.toFixed(1)}km 떨어져 있어요.${lm.height?` 높이 ${lm.height}.`:''}`],chips:[lm.blocked?{kind:'est',text:'시선 가림 미확인'}:{kind:'ok',text:'방향·거리는 직접 계산'}],source:'설명 · 공개 자료의 사실만 직접 정리 · 방향·거리는 직접 계산'}];}
 // ── 실행 ──
 function run(i){
  if(!view)return false;const row=view.rows[i];if(!row)return false;
  if(view.kind==='bino'){ui.openBoard({eyebrow:'쌍안경 · 이름표',pages:landmarkPage(view.focus),notice:'현장 안내판 글이 아닙니다'});sound.play('tick');return true;}
  const c=view.cands[i];if(row.state==='lock'){ui.toast(row.reason||'지금은 할 수 없어요');return true;}
  if(c.action==='read')openRead(c);else if(c.action==='stone')stone();else if(c.action==='stamp')stamp(c);
  else if(NS_ACTIONS[c.action])begin(c.action,c);
  else if(c.action==='lock')onLock(c);else if(c.action==='lockread')onLockRead(c);else if(c.action==='bench')onBench(c);else if(c.action==='bus')onBus(c);
  else if(c.action==='tower'||c.action==='scope'||c.action==='towerexit')onTower(c);
  return true;
 }
 function update(dt,{moving=false,started=true}={}){
  if(!started)return;t+=dt;const p=player();
  if(ui.boardOpen&&moving)ui.closeBoard();
  if(action){if(moving||gadget()!=='none')cancel(moving?'움직여서 멈췄어요':'멈췄어요');
   else{action.t+=dt;const a=NS_ACTIONS[action.id],frac=action.t/action.total,k=Math.min(a.steps.length-1,Math.floor(frac*a.steps.length));
    ui.setAction({label:a.label,step:a.steps[k],progress:Math.min(1,frac),breath:false,tint:action.id==='dip'?'water':null,hint:action.id==='cairn'?STONE_NOTICE:'움직이면 멈춰요'});
    if(action.t>=action.total)finish();}}
  const g=gadget();let next=null;
  if(g==='binoculars'){const m=binoModel();lastBino=m;ui.setBino(m);if(m.focus)next={kind:'bino',rows:[{key:'F',label:`${m.focus.name} 자세히`,sub:'',state:'ready'}],focus:m.focus,cands:[]};}
  else if(lastBino){lastBino=null;ui.setBino(null);}
  if(!next&&g==='none'&&!hidden()){
   const hit=pickCandidate(onFloor(p),p,current);
   if(hit){if(current!==hit.primary.id&&t-lastTick>=RULES.recheck){lastTick=t;sound.play('tick');}current=hit.primary.id;
    const cs=[hit.primary,...hit.stack].sort((a,b)=>(a.priority??0)-(b.priority??0)).slice(0,3);next={kind:'world',rows:cs.map(rowFor),cands:cs};}
   else current=null;
  }else if(g!=='none'||hidden())current=null;
  view=next;
  if(g==='none'&&!ui.boardOpen&&!action&&!p.busy){const out=[];
   for(const o of markerCandidates(onFloor(p),p,{done:c=>doneFor(c)||c.id===current||c.action==='bench'||c.action==='lockread'})){const q=projectWorld(o.c.x,(o.c.y??0)+1.6,o.c.z);if(q?.visible)out.push({id:o.c.id,x:q.x,y:q.y,glyph:o.c.glyph,far:o.d>RULES.show+4});}
   ui.setMarkers(out);}else ui.setMarkers([]);
  const pose=action?actionPose(action.id,action.t,action.total):{pitch:0,drop:0};api.pitch=pose.pitch;api.drop=pose.drop;
 }
 function handle(id){
  if(id==='interact'||id==='choice-1'||id==='choice-2'||id==='choice-3'){const n=id==='interact'?0:Number(id.slice(-1))-1;
   if(ui.boardOpen&&n===0){ui.closeBoard();return true;}if(action)return false;return run(n);}
  if(id==='panel-close'){if(ui.boardOpen){ui.closeBoard();return true;}return false;}
  if(id==='page-prev'||id==='page-next')return ui.stepBoard(id==='page-next'?1:-1);
  if(id==='labels-toggle'){tagsOn=!tagsOn;ui.toast(tagsOn?'이름표 켜짐':'이름표 꺼짐 (방위 띠는 남아요)');return true;}
  return false;
 }
 function reset(){if(action){sound.cancel();action=null;}ui.setAction(null);ui.closeBoard();ui.setMarkers([]);current=null;view=null;}
 const api={update,handle,run,reset,cancel,cands,progress,persist,pitch:0,drop:0,
  active:()=>!!view,
  get view(){return view?{kind:view.kind,id:view.cands?.[0]?.id??view.focus?.id??null,ids:view.cands?.map(c=>c.id)??[],rows:view.rows.map(r=>({...r}))}:null;},
  get action(){return action&&{id:action.id,t:action.t,total:action.total};},get result(){return result;},get tagsOn(){return tagsOn;},set tagsOn(v){tagsOn=!!v;},get bino(){return lastBino;},
  cooldowns:()=>({...cool}),now:()=>t};
 return api;
}
