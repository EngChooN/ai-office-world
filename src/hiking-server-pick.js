// 등산 서버 고르기 창 하나(산 고르기 다음 첫 창 + HUD 👋 함께 걷기 단추가 같이 씀). 창 자체는 공용 server-pick.js.
// 고르면 'hiking:multi-join' {room,name,server}, 나가면 'hiking:multi-leave'. main.js가 아직 듣기 전일 수 있어
// 참가 요청은 window.__hikingMultiJoin에도 남긴다(main.js가 수신기를 단 뒤 남은 요청을 처리하고 지운다).
// 아직 출발 전이면(첫 창) 고르는 순간 출발 신호(START_EVENT)도 보낸다.
import './server-pick.css';
import {createServerPick,serverPickMode} from './server-pick.js';
import {multiServerUrl} from './multi-transport.js';
import {currentChoice} from './server-link.js';
import {START_EVENT} from './loading.js';
import {takeEntryChoice,enterWith} from './entry.js';

let pick=null;
const startHike=()=>{if(window.__hikingStartRequested)return;window.__hikingStartRequested=true;window.dispatchEvent(new CustomEvent(START_EVENT));};
export const hikingServerUrl=()=>multiServerUrl(location.search,import.meta.env.VITE_MULTI_SERVER_URL??'');
export const hikingPickMode=()=>serverPickMode(location.search,!!navigator.webdriver);
// 입장(11-19, entry.js): 허브에서 고른 것 → 이 기기의 지난 선택 순으로 페이지가 열릴 때 한 번 꺼내 두었다가 창 대신 바로 들어간다. ?multi= 옛 주소면 쓰지 않는다.
const entryChoice=typeof location!=='undefined'?takeEntryChoice('hiking',{mode:hikingPickMode()}):null;
/** 첫 입장: 선택이 있으면 그대로 들어가고, 없거나 못 쓰면 공용 입장 창(서버 고르기)을 연다. */
export function openFirstHikingPick(){enterWith(hikingServerPick(),entryChoice,'show');}
export const entryDecided=()=>!!entryChoice;
export const hubPicked=entryDecided;
export function hikingServerPick(){
 if(pick)return pick;
 pick=createServerPick({experience:'hiking',serverUrl:hikingServerUrl(),serverOff:currentChoice().source==='file-off',
  onJoin(d){const detail={room:d.room,name:d.name,server:d.server};window.__hikingMultiJoin=detail;window.dispatchEvent(new CustomEvent('hiking:multi-join',{detail}));startHike();},
  onSolo({left}){if(left)window.dispatchEvent(new CustomEvent('hiking:multi-leave'));startHike();}});
 return pick;
}
