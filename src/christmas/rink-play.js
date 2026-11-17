// 아이스링크 들어가기·걷기(월드개발, 2026-11-17). 시안 B(?look=festive-b)에서만 켠다. 자리·크기·문은 월드아트 festive-layout.js RINK.
//  - 그림의 울타리 문은 닫힌 문짝이라 걸어서 통과하지 않는다: 문 밖(RINK.gate.stand) 1.4m 안 → 「스케이트장 들어가기」(E) → 문 안 얼음(gate.inside)에 선다.
//    안에서 문 안쪽(gate.inside) 1.4m 안 → 「스케이트장 나가기」(E) → 문 밖에 선다.
//  - 안에서는 미끄러지듯 걷기(ICE): 속도가 입력 쪽으로 천천히 따라가고(관성), 손을 떼면 약 1m 미끄러져 선다. 몸은 보폭을 줄여(stride) 지치듯 걷고,
//    입력 없이 미끄러질 때는 걷는 다리 없이 미끄러진다. 울타리·섬에 닿으면 그쪽 속도만 사라진다(튕기지 않음). 충돌은 광장 충돌 대신 링크 안쪽·가운데 섬만.
//  - 다른 사람 화면: 얼음 위(inRink) 사람은 같은 보폭 배수로 걷는 다리를 줄여 그린다(multi.js ctx.strideAt).
//  - 높이: 얼음 위(inRink)는 얼음 윗면 RINK.iceY(heightWithRink). 다른 사람 화면도 같은 높이 함수를 쓰므로 act 칸이 따로 없다.
//  - 링크 밖에서는 그림(festive.js)이 넣은 링크 충돌(둥근 직사각형 통째)이 그대로라 울타리를 넘어 들어가지 못한다.
import {RINK,inRink} from './festive-layout.js';
import {BODY_R} from './collide.js';

export const RINK_PLAY=Object.freeze({near:1.4,wall:BODY_R+.08,island:RINK.island.r+.1+BODY_R});
// 얼음 걷기: accel = 입력 쪽 속도로 따라가는 빠르기(1/s, 0.66초에 90%), glide = 손 뗀 뒤 줄어드는 빠르기(1/s, 걷는 속도에서 약 1m 미끄러짐),
// speedMul = 걷는 속도 배수, stride = 걷는 다리 보폭 배수(얼음에서 짧게 지침), turn = 몸 돌리는 빠르기(1/s)
export const ICE=Object.freeze({accel:3.5,glide:1.5,speedMul:1.1,stride:.55,turn:7,stop:.15}); // stop = 이보다 느리면 바로 섬(꼬리가 길게 끌리지 않게, 손 떼고 약 1.5초)
// 얼음 위 사람의 걷는 다리 보폭 배수(밖은 1)
export const strideAt=(x,z)=>inRink(x,z)?ICE.stride:1;
export const RINK_TEXT=Object.freeze({in:'스케이트장에 들어왔어요 · 얼음 위를 걸어 보세요',out:'스케이트장에서 나왔어요'});
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

// ctx: {enabled, player, hud, audio}
export function createRinkPlay({enabled=false,player,hud,audio}){
 const on=!!enabled;
 const S={inside:false,vx:0,vz:0};
 const dist=p=>Math.hypot(player.x-p.x,player.z-p.z);
 function enter(){if(!on||S.inside)return false;S.inside=true;S.vx=S.vz=0;player.place(G.inside.x,G.inside.z,IN_H);hud?.say(RINK_TEXT.in,2.4,'x-sparkle');audio?.play('pop');return true;}
 function leave(){if(!S.inside)return false;S.inside=false;S.vx=S.vz=0;player.place(G.stand.x,G.stand.z,OUT_H);hud?.say(RINK_TEXT.out,1.6);return true;}
 return {
  get enabled(){return on;},get inside(){return S.inside;},
  actions(){
   if(!on)return [];
   if(S.inside)return dist(G.inside)<RINK_PLAY.near?[{id:'rk:out',ic:'c-leave',label:'스케이트장 나가기',key:'E'}]:[];
   return dist(G.stand)<RINK_PLAY.near?[{id:'rk:in',ic:'c-enter',label:'스케이트장 들어가기',key:'E'}]:[];
  },
  act(id){switch(id){case 'rk:in':return enter();case 'rk:out':return leave();}return false;},
  // 얼음 위 한 걸음(안에 있을 때 main.js가 보통 걷기 대신 부름). dx,dz = 입력 방향(단위, 없으면 0), speed = 보통 걷기 속도
  // 반환 {moved(이번에 간 거리), stride(걷는 다리에 줄 거리 — 입력 없이 미끄러지면 0)}
  step(dt,{dx=0,dz=0,speed=1.4}={}){
   const input=dx||dz,k=1-Math.exp(-dt*(input?ICE.accel:ICE.glide)),v=speed*ICE.speedMul;
   S.vx+=(dx*v-S.vx)*k;S.vz+=(dz*v-S.vz)*k;
   if(!input&&Math.hypot(S.vx,S.vz)<ICE.stop)S.vx=S.vz=0;
   const x0=player.x,z0=player.z,got=collideRink(x0+S.vx*dt,z0+S.vz*dt);
   // 울타리·섬에 막힌 만큼 속도를 버린다(미끄러지며 벽을 따라감)
   if(dt>0){S.vx=(got.x-x0)/dt;S.vz=(got.z-z0)/dt;}
   player.x=got.x;player.z=got.z;const moved=Math.hypot(got.x-x0,got.z-z0);
   if(input){const want=Math.atan2(-dx,-dz);let d=want-player.heading;d=Math.atan2(Math.sin(d),Math.cos(d));player.heading+=d*Math.min(1,dt*ICE.turn);}
   return {moved,stride:input?moved*ICE.stride:0};
  },
  get speed(){return Math.hypot(S.vx,S.vz);},
  collide:collideRink,
  // 다른 곳으로 옮겨졌으면(순간이동·서버 옮김 등) 안에 있음을 푼다
  update(){if(S.inside&&!inRink(player.x,player.z,-.3)){S.inside=false;S.vx=S.vz=0;}},
  status(){return on?{inside:S.inside,onIce:inRink(player.x,player.z),v:+Math.hypot(S.vx,S.vz).toFixed(2),x:+player.x.toFixed(2),z:+player.z.toFixed(2)}:{enabled:false};},
  // 점검: 문 밖으로
  goTo(){if(!on)return false;player.place(G.stand.x,G.stand.z,IN_H);S.inside=false;return true;},
 };
}
