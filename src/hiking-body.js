// 등산 공통 본체 부품(한 게임 통합 6단계, 11-20). 관악산(main.js)과 남산(namsan/game.js)이 똑같이 쓰는 일을 한 벌로 모은다.
// 둘 다 같은 화면 조각(src/frame/hiking-body.html)·같은 수첩 HUD(hud-notebook·hiking-frame)를 쓰므로, 그 화면과 만나는 일도 여기서 한다.
//  - createHikingSound: 발소리·환경음·소리 켜기/끄기·음량(#sound-toggle·'hiking:sound'·'hiking:step'·라디오 ×0.7). main.js 79~102줄에서 글자 그대로 옮김
//  - installContextRecovery: WebGL 끊김 복구(6초 안에 안 돌아오면 저장 지점에서 한 번 새로 열기). main.js 212~217줄에서 옮김
//  - installMultiHud: 함께 걷기 입구·채팅·같이 등산하기 HUD를 불러 붙이기. main.js 407~413줄에서 옮김
// 7단계(11-20)에 더함 — 두 산에 따로 있던 같은 코드를 한 벌로:
//  - readQualityMode·saveQualityMode·bindQualityControls: 화질 고르기(저장 키 'gwanak-quality-mode'·?quality=·#quality 단추·'hiking:quality')
//  - installLifecycleSave: 숨김·창 닫기·얼림 때 저장
//  - easeCameraZoom: 쌍안경·휴대폰 배율(camera.zoom)을 로그 공간에서 부드럽게
//  - sceneMemory: 장면 메모리 어림(관악산 hiking.memory()에서 옮김, 남산 namsan.memory()도 같은 값)
// 기능 스위치로 화면 자리를 숨기는 applyMountainFeatures는 가벼워야 해서(남산 페이지가 로딩 화면 전에 부름) src/mountain-text.js에 있다.
import {FootstepAudio,SOUND_SAVE_KEY} from './footstep-audio.js';
import {AmbientAudio} from './ambient-audio.js';
import {VOLUME_SAVE_KEY} from './ambient-config.js';
import {loadShared,saveShared} from './shared-settings.js';
import {icon} from './icons/icon.js';

// 소리. ambient:false면 환경음(관악산 구간 표 기준)을 만들지 않는다. view()는 발소리 크기(1·3인칭)에 쓴다.
export function createHikingSound({view=()=>'third',ambient:withAmbient=true,doc=document,win=window,search=location.search}={}){
 const $=id=>doc.getElementById(id);
 let soundEnabled=true;try{soundEnabled=localStorage.getItem(SOUND_SAVE_KEY)!=='false';}catch{}
 // 세 체험 공용 소리 설정(11-17, shared-settings.js): 저장된 적이 있으면 그 값을 따른다(허브 설정 창·흡연장·크리스마스에서 바꾼 값)
 const sharedSound=loadShared();if(sharedSound.has)soundEnabled=sharedSound.sound;
 const audioDebug=new URLSearchParams(search).has('audioDebug');
 function updateAudioUI(){const a=audio.snapshot();$('sound-toggle').setAttribute('aria-pressed',String(a.enabled));$('sound-toggle').querySelector('span').textContent=a.enabled?'소리 켜짐':'소리 꺼짐';for(const el of doc.querySelectorAll('[data-sound-ic]'))el.innerHTML=icon('c-sound',{size:el.dataset.iconSize||'m',off:!a.enabled});$('sound-toggle').title=a.errors.length?'일부 소리 재생 오류 · 조작 안내의 소리 출처 참고':a.context==='입력 대기'?'클릭하거나 키를 누르면 소리를 시작합니다':a.decoded<a.total?'발소리 준비 중':'발소리 켜기/끄기';if(audioDebug){$('sound-debug').hidden=false;$('sound-debug').textContent='발소리 확인 · '+a.context+' · '+a.decoded+'/'+a.total+'개\n'+a.logs.slice(-8).map(r=>`${r.step}걸음 ${r.material} #${String(r.variant).padStart(2,'0')} ${r.pan<0?'왼':'오른'}\n  ${r.eventElapsed.toFixed(3)}s · ${r.rate.toFixed(3)}배 · ${r.variationDb.toFixed(2)}dB`).join('\n');}}
 const audio=new FootstepAudio({base:`${import.meta.env.BASE_URL}sounds/`,enabled:soundEnabled,onChange:updateAudioUI}); // 카툰은 가벼운 '톡톡' 소리를 두 걸음에 한 번
 let userVolume=.7;try{const stored=localStorage.getItem(VOLUME_SAVE_KEY);if(stored!==null&&Number.isFinite(Number(stored)))userVolume=Math.max(0,Math.min(1,Number(stored)));}catch{}
 if(sharedSound.has)userVolume=sharedSound.volume;
 audio.setVolume(userVolume);
 const ambient=withAmbient?new AmbientAudio({base:`${import.meta.env.BASE_URL}sounds/ambient/`,enabled:soundEnabled,volume:userVolume}):null;
 // 라디오가 켜져 있으면 환경음을 ×0.7(setRadio)
 let radioOn=false;const ambientVolume=()=>audio.volume*(radioOn?.7:1);
 const unlockSound=()=>{void audio.unlock();if(audio.context)ambient?.attach(audio.context,audio.master);};win.addEventListener('pointerdown',unlockSound,{capture:true,passive:true});win.addEventListener('keydown',unlockSound,{capture:true});
 win.addEventListener('hiking:sound',e=>{const {enabled,volume}=e.detail||{};if(typeof enabled==='boolean'){audio.setEnabled(enabled);ambient?.setEnabled(enabled);if(enabled)unlockSound();try{localStorage.setItem(SOUND_SAVE_KEY,String(enabled));}catch{}saveShared({sound:enabled});}if(Number.isFinite(volume)){audio.setVolume(volume);ambient?.setVolume(ambientVolume());try{localStorage.setItem(VOLUME_SAVE_KEY,String(audio.volume));}catch{}saveShared({volume:audio.volume});}});
 $('sound-toggle').onclick=()=>{win.dispatchEvent(new CustomEvent('hiking:sound',{detail:{enabled:!audio.enabled}}));$('sound-toggle').blur();};
 win.addEventListener('hiking:step',e=>{const r=audio.play(e.detail,{view:view(),});ambient?.onStep(r);});updateAudioUI();
 return {audio,ambient,unlockSound,ambientVolume,setRadio:on=>{radioOn=!!on;ambient?.setVolume(ambientVolume());}};
}

// WebGL 컨텍스트 손실(휴대폰 메모리 압박·백그라운드 전환): 그리기를 멈추고 복구를 기다린다. three는 restored 때 버퍼·텍스처·셰이더를 다시 올린다.
// 6초 안에 복구되지 않으면 저장 지점에서 한 번 새로 연다(1분 안에 또 잃으면 새로 열지 않고 안내만 남긴다). lost = 지금 끊겨 있는지
export function installContextRecovery({canvas,note,suspend=()=>{},save=()=>{},resize=()=>{},restored=()=>{},win=window}){
 const r={lost:false};let timer=0;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();r.lost=true;suspend();note.style.opacity='1';note.textContent='3D 화면을 다시 준비하는 중입니다…';win.dispatchEvent(new CustomEvent('hiking:context',{detail:{lost:true}}));
  clearTimeout(timer);timer=setTimeout(()=>{if(!r.lost)return;let recent=0;try{recent=Number(sessionStorage.getItem('gwanak-context-reload'))||0;sessionStorage.setItem('gwanak-context-reload',String(Date.now()));}catch{}if(Date.now()-recent>60000){save();location.reload();}else note.textContent='3D 연결이 끊겼습니다. 새로고침하면 저장 지점에서 이어집니다.';},6000);});
 canvas.addEventListener('webglcontextrestored',()=>{r.lost=false;clearTimeout(timer);try{resize();}catch{}note.textContent='3D 화면을 다시 이었습니다.';restored();win.dispatchEvent(new CustomEvent('hiking:context',{detail:{lost:false}}));});
 return r;
}

// 함께 걷기 HUD 세 가지. 파일이 있으면 불러 붙이고(없으면 빈 목록), 붙은 뒤 statusNow()로 상태를 한 번 더 받는다(HUD가 늦게 붙어 '연결됨'을 놓치지 않게).
//  입구(산디자인 src/multi-entry-ui.js: 버튼·상태 칩 → 서버 고르기 창) · 채팅(src/hiking-chat-ui.js: 💬·말하기 줄·머리 위 말풍선) · 같이 등산하기(src/pair-ui.js: 👥·제안 카드·동행 칩)
export function installMultiHud({serverUrl,serverPick,servers=undefined,frame=()=>window.hikingFrame,statusNow=()=>{}}){
 for(const load of Object.values(import.meta.glob('./multi-entry-ui.js')))load().then(m=>{document.body.dataset.multiEntry='1';m.installMultiEntry?.({serverUrl,serverPick:serverPick(),servers});statusNow();}).catch(err=>console.warn('함께 걷기 HUD를 불러오지 못했습니다',err));
 for(const load of Object.values(import.meta.glob('./hiking-chat-ui.js')))load().then(m=>{m.installHikingChat?.({frame:frame()});statusNow();}).catch(err=>console.warn('등산 채팅 HUD를 불러오지 못했습니다',err));
 for(const load of Object.values(import.meta.glob('./pair-ui.js')))load().then(m=>{m.installPairUI?.();statusNow();}).catch(err=>console.warn('같이 등산하기 HUD를 불러오지 못했습니다',err));
}

// 화질 고르기(두 산 같은 저장 키). ?quality=auto|high|balanced|low가 먼저, 없으면 이 기기 저장값, 없으면 'auto'. 값은 'auto'|'2'|'1'|'0'
export const QUALITY_SAVE_KEY='gwanak-quality-mode';
const QUALITY_PARAM={auto:'auto',high:'2',balanced:'1',low:'0'};
export function readQualityMode(search=location.search){const m=QUALITY_PARAM[new URLSearchParams(search).get('quality')];if(m)return m;try{return localStorage.getItem(QUALITY_SAVE_KEY)||'auto';}catch{return 'auto';}}
export function saveQualityMode(mode){try{localStorage.setItem(QUALITY_SAVE_KEY,mode);}catch{}}
// #quality 단추는 auto → 높음 → 균형 → 낮음 차례로, 설정 탭 화질 분절 단추('hiking:quality' {mode})는 바로 고른다. set(mode)는 산마다
export function bindQualityControls({mode,set,doc=document,win=window}){
 const b=doc.getElementById('quality');
 if(b)b.onclick=()=>{const order=['auto','2','1','0'];set(order[(order.indexOf(mode())+1)%order.length]);b.blur();};
 win.addEventListener('hiking:quality',e=>{const m=QUALITY_PARAM[e.detail?.mode];if(m)set(m);});
}

// 탭 숨김·창 흐림·페이지 닫힘·얼림 때 저장(fn). 마우스 잠금은 풀어 준다
export function installLifecycleSave(fn,{doc=document,win=window}={}){
 const save=()=>{fn();if(doc.pointerLockElement)doc.exitPointerLock();};
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)save();});win.addEventListener('blur',save);win.addEventListener('pagehide',save);doc.addEventListener('freeze',save);
 return save;
}

// 쌍안경·휴대폰 배율은 camera.zoom(THREE.LOD와 장면 거리 판정이 같은 값을 읽는다). 로그 공간에서 부드럽게 따라가고, instant면 바로
export function easeCameraZoom(camera,target,dt,{instant=false}={}){
 const next=instant?target:Math.exp(Math.log(camera.zoom)+(Math.log(target)-Math.log(camera.zoom))*(1-Math.exp(-dt*14)));const z=Math.abs(next-target)<1e-3?target:next;
 if(z!==camera.zoom){camera.zoom=z;camera.updateProjectionMatrix();}
}

// 메모리 어림(2026-11-06 아이폰 탭 재시작 조사): 장면에 붙은 지오메트리 버퍼·텍스처·렌더 타깃 바이트를 MB로 센다. GPU 실측이 아니라 업로드된 원본 크기 합이다.
export function sceneMemory({scene,renderer,lighting,Vector2}){const seen=new Set(),texSeen=new Set();let geometry=0,instanced=0,texture=0,meshes=0;const buf=a=>{if(!a)return 0;const arr=a.isInterleavedBufferAttribute?a.data.array:a.array;if(!arr||seen.has(arr))return 0;seen.add(arr);return arr.byteLength;};
 const tex=t=>{if(!t||texSeen.has(t))return;texSeen.add(t);const img=t.image,w=img?.width??0,h=img?.height??0;texture+=w*h*4*(t.generateMipmaps?1.33:1);};
 scene.traverse(o=>{if(!o.isMesh&&!o.isPoints&&!o.isLine)return;meshes++;const g=o.geometry;if(g){for(const a of Object.values(g.attributes))geometry+=buf(a);geometry+=buf(g.index);}if(o.isInstancedMesh){instanced+=buf(o.instanceMatrix)+buf(o.instanceColor);}for(const m of [o.material].flat())if(m)for(const v of Object.values(m))if(v?.isTexture)tex(v);});
 const db=renderer.getDrawingBufferSize(new Vector2()),px=db.x*db.y,targets=px*(4+4)+px*(8+4)+px*8*2+px/4*(8+8*.5)*1.4+(lighting.status.shadows?(sun=>sun?sun.mapSize.x*sun.mapSize.y*4:0)(scene.children.find(o=>o.isDirectionalLight&&o.castShadow)?.shadow):0); // 화면(색+깊이), 합성 HDR+깊이, 핑퐁 2장, 블룸 절반 사슬
 const MB=b=>Math.round(b/1048576*10)/10;
 return {geometryMB:MB(geometry),instancedMB:MB(instanced),textureMB:MB(texture),renderTargetsMB:MB(targets),totalMB:MB(geometry+instanced+texture+targets),meshes,drawingBuffer:[db.x,db.y],dpr:renderer.getPixelRatio(),info:{...renderer.info.memory},jsHeapMB:performance.memory?MB(performance.memory.usedJSHeapSize):null};}

// 진행 카드·기본 단추 칠하기(공통 화면 조각의 #status·#progress-fill·#distance·#remaining·#altitude·#elapsed·#speed·#eta·#surface·#quality·#auto·기구 단추·#view).
// 두 산 updateUI가 같은 자리에 같은 모양으로 쓰던 것을 한 벌로(7단계). 바뀐 글만 다시 쓴다. 산마다 다른 것은 값(c)으로 받는다
//  c = {status, progress(0~1), done, total(m), remaining(글), altitude(m), elapsed(초), speed(m/s), etaMin, surface, quality(글), auto, gadget, gadgets(['binoculars','phone']), view, viewLocked}
const _pad=n=>String(n).padStart(2,'0');
export const hikeClock=s=>`${_pad(Math.floor(s/3600))}:${_pad(Math.floor(s/60)%60)}:${_pad(Math.floor(s)%60)}`;
export function paintHikeCard(c,doc=document){
 const $=id=>doc.getElementById(id);
 const put=(id,v,html=false)=>{const el=$(id);if(!el)return;if(html){if(el.innerHTML!==v)el.innerHTML=v;}else if(el.textContent!==v)el.textContent=v;};
 const fmt=n=>n.toLocaleString('ko-KR');
 put('status',c.status);
 if($('progress-fill'))$('progress-fill').style.width=`${c.progress*100}%`;
 put('distance',`${c.distancePrefix??''}${fmt(c.done)} / ${fmt(c.total)} m`);put('remaining',c.remaining);
 put('altitude',`${c.altitude.toFixed(0)} <em>m</em>`,true);put('elapsed',hikeClock(c.elapsed));put('speed',`${(c.speed*3.6).toFixed(1)} <em>km/h</em>`,true);
 put('eta',`${c.etaMin}분`);put('surface',c.surface);put('quality',c.quality);
 const auto=$('auto');if(auto){auto.classList.toggle('active',!!c.auto);auto.setAttribute('aria-pressed',String(!!c.auto));}
 for(const g of c.gadgets??['binoculars','phone']){const b=$(g);if(!b)continue;b.classList.toggle('active',c.gadget===g);b.setAttribute('aria-pressed',String(c.gadget===g));}
 const v=$('view');if(v){const sp=v.querySelector('span'),t=c.view==='first'?'3인칭 보기':'1인칭 보기';if(sp&&sp.textContent!==t)sp.textContent=t;v.disabled=!!c.viewLocked;
  v.title=c.viewLocked?`${(c.gadgets??['binoculars','phone']).includes('phone')?'쌍안경·휴대폰을':'쌍안경을'} 쓰는 동안은 1인칭 고정`:'';}
}
