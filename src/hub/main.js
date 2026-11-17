// 허브(/) 진입: 옛 등산 주소면 /hiking/로 넘기고, 아니면 체험 고르기 화면을 그린다(hub.js).
import {legacyHikingTarget} from './legacy-redirect.js';
import {mountHub} from './hub.js';
import {createHubServers} from './hub-servers.js';
import {installFeedback} from '../feedback.js';
import './hub.css';
import '../icons/icons.css';   // 아이콘 공통 모양(아이콘-규칙-v1)
const target=legacyHikingTarget(location.search,location.hash,import.meta.env.BASE_URL);
if(target)location.replace(target);
else{
 const hub=mountHub(document,{forced:new URLSearchParams(location.search).get('hubtime')});
 // 체험 카드 링크에 서버 주소를 붙이지 않는다(11-11): 서버 주소는 공개 파일 multi-server.json에서 찾는다(server-link.js). 허브도 같은 길로 찾아 인원을 보여 준다(11-17).
 const servers=createHubServers({base:import.meta.env.BASE_URL,envUrl:import.meta.env.VITE_MULTI_SERVER_URL??'',onChange:s=>hub?.setServers(s)});
 servers.start();
 // 의견 보내기(설정 창·「다음 체험 준비 중」): 등산·흡연장과 같은 카드(src/feedback.js)
 installFeedback({exp:'hub',openEvent:'hub:feedback-open',state:()=>({화면:'허브',모양:hub?.state.layout==='map'?'지도':'카드 목록'})});
 window.hub={get state(){return hub?.state;},servers,select:id=>hub?.select(id)};
 document.documentElement.classList.add('hub-ready');
}
