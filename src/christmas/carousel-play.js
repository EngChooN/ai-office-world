// 회전목마 타기(월드개발, 2026-11-17). 시안 B(?look=festive-b)에서 회전목마 그림이 있을 때만 켠다 — 없으면 단추·act 칸이 아예 없다.
//  - 자리·타는 곳·내리는 곳은 월드아트 festive-layout.js(CAROUSEL·CAROUSEL_SEATS: 루돌프 4 + 썰매 의자 2대×2 = 8자리).
//  - 타는 곳(서쪽 계단 앞 CAROUSEL.board, 1.6m 안) → 「회전목마 타기」(E). 빈 자리 중 지금 계단에 가장 가까운 자리에 앉는다(모닥불처럼 act.mg 1~8로 알림).
//  - 타는 동안 자리와 함께 돌고(루돌프는 오르내림), 진행 방향을 본다. 단추: 「내리기」(E)·「만세」(R). 걷기 입력이면 내린다. 내리면 계단 앞(CAROUSEL.exit)에 선다.
//  - 자리 자세는 그림이 주는 carousel.seatPose(k)(festive-layout carouselSeatAt, 그림이 쓴 시각 그대로) — 몸이 그려진 자리에서 떨어지지 않는다.
//  - 다른 사람 화면: act.mg인 사람은 받은 위치가 아니라 그 화면의 같은 번호 자리 위에 그린다(multi.js ctx.rideAt).
//  - 같은 자리를 동시에 고르면 서버(room-play.checkAct)가 나중 사람을 빼고 {t:'ride:no'} → 다른 빈 자리로 옮기거나 내린다.
import {CAROUSEL,CAROUSEL_SEATS} from './festive-layout.js';

// sitY = 앉기 자세 좌판 높이(poses.js setSit). 몸 root는 「자리 엉덩이 높이 − sitY」에 놓는다
export const CAROUSEL_RIDE=Object.freeze({seats:CAROUSEL_SEATS.length,sitY:.34,cheerSecs:2.4});
export const CAROUSEL_TEXT=Object.freeze({full:'자리가 다 찼어요 · 조금 뒤에 타 주세요',taken:'앗, 방금 다른 분이 앉았어요',on:'회전목마에 탔어요 · 「내리기」로 내려요'});

// 시안 그림(festive.js 결과)의 회전목마. 자리 자세를 주는 seatPose가 있어야 탈 수 있다
export const findCarousel=festive=>festive?.carousel?.seatPose?festive.carousel:null;
// 자리 k의 지금 세계 자세 {x,y(엉덩이 세계 높이),z,heading}
export const carouselSeatPose=(carousel,k)=>carousel.seatPose(k);

// ctx: {carousel(findCarousel 결과, 없으면 꺼짐), player, poser, multi, hud, audio, onChange()}
export function createCarouselPlay({carousel,player,poser,multi,hud,audio,onChange=()=>{}}){
 const S={seat:-1,cheer:0,y:0};
 const on=!!carousel,N=CAROUSEL_RIDE.seats;
 const takenByOthers=()=>{const t=new Set();if(multi?.joined)for(const p of multi.people())if(p.act?.mg&&!p.muted)t.add(p.act.mg-1);return t;};
 const near=()=>on&&Math.hypot(player.x-CAROUSEL.board.x,player.z-CAROUSEL.board.z)<CAROUSEL.board.near;
 // 빈 자리 중 지금 계단(타는 곳)에 가장 가까운 것(없으면 -1)
 function nearestFree(skip=new Set()){const t=takenByOthers(),b=CAROUSEL.board;let best=-1,bd=Infinity;
  for(let k=0;k<N;k++){if(t.has(k)||skip.has(k))continue;const p=carouselSeatPose(carousel,k),d=Math.hypot(p.x-b.x,p.z-b.z);if(d<bd){bd=d;best=k;}}
  return best;}
 function follow(){const p=carouselSeatPose(carousel,S.seat);player.x=p.x;player.z=p.z;player.heading=p.heading;player.speed=0;S.y=p.y-CAROUSEL_RIDE.sitY;}
 function seatOn(k){S.seat=k;S.cheer=0;poser.setSit(true,CAROUSEL_RIDE.sitY);follow();onChange();}
 function ride(){if(!on||S.seat>=0)return false;const k=nearestFree();if(k<0){hud?.say(CAROUSEL_TEXT.full,2);return false;}
  seatOn(k);hud?.say(CAROUSEL_TEXT.on,2.2,'x-sparkle');audio?.play('jingle',{gain:.5});return true;}
 function off(){if(S.seat<0)return false;S.seat=-1;S.cheer=0;poser.setSit(false);poser.setArms('none');
  const e=CAROUSEL.exit;player.place(e.x,e.z,e.heading);onChange();return true;}
 return {
  get enabled(){return on;},get riding(){return S.seat>=0;},get seat(){return S.seat;},
  // 앉은 몸 root에 더할 높이(앉기 자세는 root를 바닥 0 기준으로 올려 둔다)
  get y(){return S.y;},
  // act 칸: 시안 B가 아니면 아무것도 안 보냄(다른 화면·서버 act 그대로)
  actFields(){return on?{mg:S.seat>=0?S.seat+1:0,...(S.seat>=0&&S.cheer>0?{wm:1}:{})}:{};},
  actions(){
   if(!on)return [];
   if(S.seat>=0)return [{id:'mg:off',ic:'c-stand-up',label:'내리기',key:'E'},{id:'mg:cheer',ic:'x-cheer',label:'만세',key:'R'}];
   return near()?[{id:'mg:ride',ic:'x-sparkle',label:'회전목마 타기',key:'E'}]:[];
  },
  act(id){switch(id){case 'mg:ride':return ride();case 'mg:off':return off();case 'mg:cheer':if(S.seat<0)return false;S.cheer=CAROUSEL_RIDE.cheerSecs;onChange();return true;}return false;},
  // 서버가 자리를 돌려보냄: 다른 빈 자리로, 없으면 내린다
  denied(){if(S.seat<0)return;const k=nearestFree(new Set([S.seat]));hud?.say(CAROUSEL_TEXT.taken,2);if(k>=0){S.seat=k;follow();onChange();}else off();},
  // 매 프레임. 타는 중이면 true(main.js는 걷기를 건너뛴다). moveInput이면 내린다
  update(dt,{moveInput=false}={}){
   if(S.seat<0)return false;
   if(moveInput){off();return false;}
   if(S.cheer>0){S.cheer-=dt;if(S.cheer<=0){S.cheer=0;onChange();}}
   poser.setArms(S.cheer>0?'cheer':'none');
   follow();player.update(dt,{moved:0});return true;
  },
  // 다른 사람(act.mg) 몸 자리: 이 화면의 같은 번호 자리 위. y는 앉기 자세 root에 더할 값
  rideAt(a){if(!on||!(a?.mg>=1&&a.mg<=N))return null;const p=carouselSeatPose(carousel,a.mg-1);return {x:p.x,z:p.z,heading:p.heading,y:p.y-CAROUSEL_RIDE.sitY};},
  status(){return on?{riding:S.seat>=0,seat:S.seat,kind:S.seat>=0?CAROUSEL_SEATS[S.seat].kind:null,cheer:S.cheer>0,taken:[...takenByOthers()],near:near(),y:+S.y.toFixed(2),x:+player.x.toFixed(2),z:+player.z.toFixed(2)}:{enabled:false};},
  // 점검: 타는 곳으로 옮기기
  goTo(){if(!on)return false;const b=CAROUSEL.board;player.place(b.x,b.z,b.heading);return true;},
 };
}
