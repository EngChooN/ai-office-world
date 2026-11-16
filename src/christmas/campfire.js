// 모닥불 앉기(월드개발, 2026-11-16). 체험설계 v1 §5-3: 통나무 4개 × 2 = 8자리, 가장 가까운 빈 자리로 걸어가 앉는다(흡연장 벤치 앉기 방식).
//  - 다 찼으면 "자리가 다 찼어요". 다른 사람이 쓰는 자리는 act.st로 알고, 같은 자리를 동시에 고르면 서버(room-play.checkAct)가 나중 사람을 돌려보낸다(seat:no).
//  - 앉으면 카메라가 천천히 불 쪽으로 돌아 맞은편이 보이는 낮은 각도(main.js가 seatCam을 읽음), 장작 소리 크게(audio.js).
//  - 앉은 동안: 🙌 손 녹이기(3초), 🍫 코코아(선물로 받았을 때만), 일어나기. 걷기 입력이 들어오면 바로 일어난다.
//  - 모닥불 둘레 6m 안 말풍선은 조금 크고 오래(6초) — main.js가 채팅 창 bubbleFor로 넘긴다.
import {CAMPFIRE,campfireSeats} from './layout.js';

export const FIRE=Object.freeze({walkSpeed:1.6,arrive:.12,warmSecs:3,cocoaSecs:4,talkR:6,bubbleMs:6000,walkLimit:6});
export const FIRE_TEXT=Object.freeze({full:'자리가 다 찼어요',taken:'앗, 방금 다른 분이 앉았어요. 다른 자리를 찾아볼게요',blocked:'길이 막혔어요. 조금 더 가까이 가 주세요'});
const SEATS=campfireSeats();
// 「🔥 앉기」 단추가 뜨는 거리: 통나무 바깥 2.2m 안
export const nearFire=(x,z)=>Math.hypot(x-CAMPFIRE.x,z-CAMPFIRE.z)<CAMPFIRE.logR+2.2;
// 빈 자리 중 가장 가까운 것(taken = 쓰는 자리 번호 Set, 0부터)
export function nearestSeat(x,z,taken=new Set()){let best=null;for(const s of SEATS){if(taken.has(s.id))continue;const d=Math.hypot(s.x-x,s.z-z);if(!best||d<best.d)best={...s,d};}return best;}
// 앉은 자리 앞(불 반대쪽 0.5m)에서 걸어 들어간다: 통나무를 뚫고 걷지 않게 바깥 쪽 출발점
const approach=s=>({x:s.x-Math.sin(s.heading)*-.55,z:s.z-Math.cos(s.heading)*-.55});

// ctx: {player, poser(내 자세), multi, net, hud, audio, onChange()(act 다시 보내기)}
export function createCampfire({player,poser,multi,net,hud,audio,onChange=()=>{}}){
 const S={seat:null,walk:null,warm:0,cocoa:0,cocoaN:0,justSat:0};
 const takenByOthers=()=>{const t=new Set();for(const p of multi.joined?multi.people():[])if(p.act?.st&&!p.muted)t.add(p.act.st-1);return t;};
 function sit(seat){S.seat=seat;S.walk=null;player.place(seat.x,seat.z,seat.heading);poser.setSit(true,CAMPFIRE.seatY);S.justSat=1;onChange();audio?.play('warm',{gain:.6});}
 function stand(){if(!S.seat&&!S.walk)return false;S.seat=null;S.walk=null;S.warm=0;S.cocoa=0;poser.setSit(false);poser.setArms('none');onChange();return true;}
 function start(){
  if(S.seat)return stand();
  const s=nearestSeat(player.x,player.z,takenByOthers());if(!s){hud?.say(FIRE_TEXT.full,2.2);return false;}
  S.walk={seat:s,t:0,via:approach(s),stage:0};return true;
 }
 return {
  start,stand,
  get sitting(){return !!S.seat;},get walking(){return !!S.walk;},get seat(){return S.seat;},
  get cocoaLeft(){return S.cocoaN;},
  addCocoa(n=1){S.cocoaN+=n;},
  warm(){if(!S.seat)return;S.warm=FIRE.warmSecs;S.cocoa=0;onChange();audio?.play('warm');},
  sip(){if(!S.seat||S.cocoaN<=0)return;S.cocoa=FIRE.cocoaSecs;S.warm=0;onChange();},
  // act 칸(모닥불 자리 1~8·손 녹이기·코코아)
  act(){return {st:S.seat?S.seat.id+1:0,wm:S.seat&&S.warm>0?1:0,cc:S.seat&&S.cocoa>0?1:0};},
  // 서버가 자리를 돌려보냄: 일어나 다른 빈 자리로 다시
  denied(){if(!S.seat)return;const was=S.seat.id;stand();hud?.say(FIRE_TEXT.taken,2.4);const t=takenByOthers();t.add(was);const s=nearestSeat(player.x,player.z,t);if(s)S.walk={seat:s,t:0,via:approach(s),stage:0};},
  // 매 프레임. moveInput = 걷기 입력이 있는지(있으면 일어나서 걷는다). 반환: 이번 프레임에 걷기 이동을 여기서 했는지
  update(dt,{moveInput=false}={}){
   if(S.justSat>0)S.justSat=Math.max(0,S.justSat-dt);
   if(S.warm>0){S.warm-=dt;if(S.warm<=0){S.warm=0;onChange();}}
   if(S.cocoa>0){S.cocoa-=dt;if(S.cocoa<=0){S.cocoa=0;S.cocoaN=Math.max(0,S.cocoaN-1);onChange();}}
   poser.setArms(S.seat?(S.cocoa>0?'cocoa':S.warm>0?'warm':'none'):poser.arms==='warm'||poser.arms==='cocoa'?'none':poser.arms);
   if(moveInput&&(S.seat||S.walk)){stand();return false;}
   if(!S.walk)return false;
   // 걸어가기: 바깥 출발점 → 자리. 다른 사람이 먼저 앉으면 다음 빈 자리로
   const w=S.walk;w.t+=dt;
   if(takenByOthers().has(w.seat.id)){const s=nearestSeat(player.x,player.z,takenByOthers());if(!s){S.walk=null;hud?.say(FIRE_TEXT.full,2);return false;}w.seat=s;w.via=approach(s);w.stage=0;}
   const goal=w.stage===0?w.via:w.seat,dx=goal.x-player.x,dz=goal.z-player.z,d=Math.hypot(dx,dz);
   if(d<FIRE.arrive+(w.stage===0?.2:0)){if(w.stage===0){w.stage=1;return true;}sit(w.seat);return true;}
   if(w.t>FIRE.walkLimit+d/FIRE.walkSpeed){S.walk=null;hud?.say(FIRE_TEXT.blocked,2);return false;}
   const step=Math.min(d,FIRE.walkSpeed*dt);player.x+=dx/d*step;player.z+=dz/d*step;player.heading=Math.atan2(-dx,-dz);player.update(dt,{moved:step});return true;
  },
  // 앉은 사람 카메라(불과 맞은편 사람이 보이는 낮은 각도): 자리 바로 뒤 위에서 불 쪽을 본다
  seatCam(){if(!S.seat)return null;return {yaw:S.seat.heading,pitch:.2,dist:2.9};},
  status(){return {sitting:!!S.seat,seat:S.seat?.id??null,walking:!!S.walk,warm:+S.warm.toFixed(2),cocoa:S.cocoaN,taken:[...takenByOthers()]};},
 };
}
