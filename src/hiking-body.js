// 등산 공통 본체 부품(한 게임 통합 6단계, 11-20). 관악산(main.js)과 남산(namsan/game.js)이 똑같이 쓰는 일을 한 벌로 모은다.
// 둘 다 같은 화면 조각(src/frame/hiking-body.html)·같은 수첩 HUD(hud-notebook·hiking-frame)를 쓰므로, 그 화면과 만나는 일도 여기서 한다.
//  - createHikingSound: 발소리·환경음·소리 켜기/끄기·음량(#sound-toggle·'hiking:sound'·'hiking:step'·라디오 ×0.7). main.js 79~102줄에서 글자 그대로 옮김
//  - installContextRecovery: WebGL 끊김 복구(6초 안에 안 돌아오면 저장 지점에서 한 번 새로 열기). main.js 212~217줄에서 옮김
//  - installMultiHud: 함께 걷기 입구·채팅·같이 등산하기 HUD를 불러 붙이기. main.js 407~413줄에서 옮김
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
