// 아이스링크 들어가기·스케이트 타기(월드개발, 2026-11-17 · 11-19 스케이트 A안). 시안 B(?look=festive-b)에서만 켠다. 자리·크기·문은 월드아트 festive-layout.js RINK.
//  - 그림의 울타리 문은 닫힌 문짝이라 걸어서 통과하지 않는다: 문 밖(RINK.gate.stand) 1.4m 안 → 「스케이트장 들어가기」(E) → 문 안 얼음(gate.inside)에 선다.
//    안에서 문 안쪽(gate.inside) 1.4m 안 → 「스케이트장 나가기」(E) → 문 밖에 선다.
//  - 안에서는 스케이트(skate.js A안, 시안 docs/크리스마스/스케이트-타기-시안-v1.html): 최고 2.4m/s·1.6초에 90%·손 떼면 약 2.2m 미끄러짐·커브·반대 입력 제동·
//    느리면 제자리 돌기·문 안쪽 1.5m는 걷기 속도까지·벽은 튕기지 않고 따라 미끄러짐(세게 닿으면 휘청). 다른 사람과는 부딪히지 않는다(겹쳐 지나감).
//    충돌은 광장 충돌 대신 링크 안쪽·가운데 섬만.
//  - 자세·효과·소리: skate.js 자세(createSkateGait)를 매 프레임 정하고, 밀기 「슥」·멈춤 「샤악」·활주 「쉬익」(audio.js), 날 자국·얼음 가루 자료(createSkateFx).
//    스케이트화·동작 6종·효과 그림은 월드아트 몫 — art(아래 SKATE_ART_API)가 있으면 부르고, 없으면 예전처럼 짧은 보폭 걷기 다리만 쓴다.
//  - 다른 사람 화면: 얼음 위(inRink) 사람은 받은 위치에서 속도·가속·도는 빠르기를 알아내 같은 자세 함수로 그린다(remote, multi.js ctx.skateAt). 서버·act 칸 변경 없음.
//  - 높이: 얼음 위(inRink)는 얼음 윗면 RINK.iceY(heightWithRink). 다른 사람 화면도 같은 높이 함수를 쓰므로 act 칸이 따로 없다.
//  - 링크 밖에서는 그림(festive.js)이 넣은 링크 충돌(둥근 직사각형 통째)이 그대로라 울타리를 넘어 들어가지 못한다.
import {RINK,inRink} from './festive-layout.js';
import {BODY_R} from './collide.js';
import {SKATE,SKATE_TEXT,createSkateState,skateStep,skateWall,createSkateGait,createSkateTrack,createSkateFx} from './skate.js';

export const RINK_PLAY=Object.freeze({near:1.4,wall:BODY_R+.08,island:RINK.island.r+.1+BODY_R});
// 그림이 오기 전 다리: 밀 때만 짧은 보폭(stride)으로 걷는 다리, 활주·제동은 다리 멈춤
export const ICE=Object.freeze({stride:.55});
// 다른 사람(그림·자세 연결이 없을 때) 걷는 다리 보폭 배수(밖은 1)
export const strideAt=(x,z)=>inRink(x,z)?ICE.stride:1;
export const RINK_TEXT=Object.freeze({in:`스케이트장에 들어왔어요 · ${SKATE_TEXT.in}`,out:'스케이트장에서 나왔어요'});
// 월드아트 그림과 잇는 자리(있는 것만 부름). avatar = 동동이(player 또는 다른 사람 몸)
//  wear(avatar,on)            링크 안이면 날을 신기고(몸 4.5cm 올림) 밖이면 벗김
//  pose(avatar,gait,dt)       동작 이름 gait.pose('stand'|'push'|'glide1'|'glide2'|'carve'|'brake'|'wobble')·side(±1)·k(0~1)·lean(rad)을 몸에 입힘
//  drawFx(fx,dt)              createSkateFx 자료(marksOf(owner)·powder)를 그림
export const SKATE_ART_API=Object.freeze(['wear','pose','drawFx']);
const G=RINK.gate;
// 바라보는 방향(heading: 바라봄 = (−sin h, −cos h)): 들어가면 링크 가운데 쪽, 나가면 문 밖 쪽
const face=(from,to)=>Math.atan2(-(to.x-from.x),-(to.z-from.z));
const IN_H=face(G.inside,RINK.island),OUT_H=face(G.inside,G.stand);

// 얼음 위 높이를 더한 땅 높이 함수(시안 B일 때만 감싼다)
export const heightWithRink=H=>(x,z)=>inRink(x,z)?RINK.iceY:H(x,z);
// 링크 안 걷기 충돌: 둥근 직사각형 안쪽(울타리에서 wall만큼) + 가운데 섬 원 밖
export function collideRink(x,z){
 const hw=RINK.w/2-RINK_PLAY.wall,hd=RINK.d/2-RINK_PLAY.wall,cr=Math.max(.01,RINK.corner-RINK_PLAY.wall);
 let lx=Math.max(-hw,Math.min(hw,x-RINK.x)),lz=Math.max(-hd,Math.min(hd,z-RINK.z));
 const cx=Math.abs(lx)-(hw-cr),cz=Math.abs(lz)-(hd-cr);
 if(cx>0&&cz>0){const l=Math.hypot(cx,cz);if(l>cr){lx=Math.sign(lx)*(hw-cr+cx/l*cr);lz=Math.sign(lz)*(hd-cr+cz/l*cr);}}
 x=RINK.x+lx;z=RINK.z+lz;
 const I=RINK.island,dx=x-I.x,dz=z-I.z,d=Math.hypot(dx,dz);
 if(d<RINK_PLAY.island){const k=d>1e-6?RINK_PLAY.island/d:0;x=I.x+(k?dx*k:RINK_PLAY.island);z=I.z+(k?dz*k:0);}
 return {x,z};
}

// ctx: {enabled, player, hud, audio, mobile, art(월드아트 스케이트 그림, 없으면 null — 나중에 setArt로)}
export function createRinkPlay({enabled=false,player,hud,audio,mobile=false,art=null}){
 const on=!!enabled;
 const S=createSkateState(),gait=createSkateGait(),fx=createSkateFx({mobile});
 const remotes=new Map(); // 다른 사람 id → {track, avatar, seen, worn}
 let inside=false,worn=false,lastV=0;
 const dist=p=>Math.hypot(player.x-p.x,player.z-p.z);
 const reset=()=>{S.vx=S.vz=0;S.wall=null;S.wobble=0;S.prevH=undefined;lastV=0;};
 const wear=(a,v)=>{try{art?.wear?.(a,v);}catch{}};
 function enter(){if(!on||inside)return false;inside=true;reset();player.place(G.inside.x,G.inside.z,IN_H);hud?.say(RINK_TEXT.in,2.8,'x-sparkle');audio?.play('pop');return true;}
 function leave(){if(!inside)return false;inside=false;reset();player.place(G.stand.x,G.stand.z,OUT_H);hud?.say(RINK_TEXT.out,1.6);return true;}
 function syncWear(){const want=inside;if(want!==worn){worn=want;wear(player,want);}}
 return {
  get enabled(){return on;},get inside(){return inside;},fx,gait:()=>gait.state,
  setArt(a){if(worn)wear(player,false);for(const r of remotes.values())if(r.worn){wear(r.avatar,false);r.worn=false;}art=a??null;worn=false;syncWear();},
  actions(){
   if(!on)return [];
   if(inside)return dist(G.inside)<RINK_PLAY.near?[{id:'rk:out',ic:'c-leave',label:'스케이트장 나가기',key:'E'}]:[];
   return dist(G.stand)<RINK_PLAY.near?[{id:'rk:in',ic:'c-enter',label:'스케이트장 들어가기',key:'E'}]:[];
  },
  act(id){switch(id){case 'rk:in':return enter();case 'rk:out':return leave();}return false;},
  // 얼음 위 한 걸음(안에 있을 때 main.js가 보통 걷기 대신 부름). dx,dz = 입력 방향(단위, 없으면 0), speed = 보통 걷기 속도
  // 반환 {moved(이번에 간 거리), stride(걷는 다리에 줄 거리 — 그림이 없을 때만, 밀 때만), gait(자세)}
  step(dt,{dx=0,dz=0,speed=1.4}={}){
   S.heading=player.heading;
   skateStep(S,dt,{dx,dz,gateDist:dist(G.inside),walk:speed});
   const x0=player.x,z0=player.z,want={x:x0+S.vx*dt,z:z0+S.vz*dt},got=collideRink(want.x,want.z);
   skateWall(S,dt,want,got);
   player.x=got.x;player.z=got.z;player.heading=S.heading;const moved=Math.hypot(got.x-x0,got.z-z0);
   const v=Math.hypot(S.vx,S.vz),a=dt>0?(v-lastV)/dt:0;lastV=v;
   const turn=S.heading-(S.prevH??S.heading);S.prevH=S.heading;
   const g=gait.update(dt,{v,a,turn:dt>0?Math.atan2(Math.sin(turn),Math.cos(turn))/dt:0,pressing:!!(dx||dz)&&!S.braking,braking:S.braking,wobble:S.wobble});
   for(const e of g.events)audio?.play(e==='push'?'skate-push':'skate-stop');
   fx.emit('me',dt,{x:player.x,z:player.z,heading:player.heading,v,gait:g});
   return {moved,stride:art?.pose?0:(g.pose==='push'?moved*ICE.stride:0),gait:g};
  },
  // 몸 자세 입히기(player.update 뒤, main.js)
  pose(dt){if(inside&&art?.pose)try{art.pose(player,gait.state,dt);}catch{}},
  get speed(){return Math.hypot(S.vx,S.vz);},
  // 활주 소리 크기에 쓰는 속도(안에 없으면 0)
  get glide(){return inside?Math.hypot(S.vx,S.vz):0;},
  collide:collideRink,
  // 다른 사람 몸(multi.js drive가 부름): 얼음 위면 자세를 정해 입히고 {stride 배수, gait}, 아니면 null(신은 날은 벗김)
  remote(id,s,dt,avatar){
   let r=remotes.get(id);
   if(!on||!s||!inRink(s.x,s.z)){if(r){if(r.worn)wear(r.avatar,false);remotes.delete(id);}return null;}
   if(!r){r={track:createSkateTrack(),avatar,seen:0,worn:false};remotes.set(id,r);}
   if(r.avatar!==avatar){if(r.worn)wear(r.avatar,false);r.avatar=avatar;r.worn=false;}
   r.seen=0;r.d=Math.hypot(s.x-player.x,s.z-player.z);if(!r.worn&&avatar){wear(avatar,true);r.worn=true;}
   const g=r.track.update(dt,s);
   fx.emit(id,dt,{x:s.x,z:s.z,heading:s.heading,v:r.track.v,gait:g});
   if(avatar&&art?.pose)try{art.pose(avatar,g,dt);}catch{}
   return {stride:art?.pose?0:(g.pose==='push'?ICE.stride:0),gait:g};
  },
  // 매 프레임: 안에 있음 풀기·날 신기·효과 자료·다른 사람 정리
  update(dt=0){
   if(inside&&!inRink(player.x,player.z,-.3)){inside=false;reset();} // 다른 곳으로 옮겨졌으면(순간이동·서버 옮김 등) 안에 있음을 푼다
   syncWear();
   for(const [id,r] of remotes){r.seen+=dt;if(r.seen>1){if(r.worn)wear(r.avatar,false);remotes.delete(id);}}
   fx.setRank([...remotes].sort((a,b)=>a[1].d-b[1].d).map(([id])=>id)); // 효과는 가까운 사람부터(PC 8명·휴대폰 3명)
   fx.update(dt);
   if(art?.drawFx)try{art.drawFx(fx,dt);}catch{}
  },
  status(){return on?{inside,onIce:inRink(player.x,player.z),v:+Math.hypot(S.vx,S.vz).toFixed(2),x:+player.x.toFixed(2),z:+player.z.toFixed(2),heading:+player.heading.toFixed(3),
   pose:gait.state.pose,lean:+gait.state.lean.toFixed(3),braking:S.braking,wobble:+S.wobble.toFixed(2),art:!!art,
   remotes:[...remotes].map(([id,r])=>({id,pose:r.track.gait.pose,v:+r.track.v.toFixed(2)})),fx:{...fx.stats}}:{enabled:false};},
  // 점검: 문 밖으로
  goTo(){if(!on)return false;player.place(G.stand.x,G.stand.z,IN_H);inside=false;reset();return true;},
 };
}
export {SKATE};
