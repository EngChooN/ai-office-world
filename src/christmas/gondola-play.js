// 케이블카 화면(월드개발, 2026-11-17). 계산은 gondola.js, 그림은 gondola-art.js.
//  - 마을 승강장 가까이(3.2m) → 행동 단추 「타고 올라가기」(E), 꼭대기 승강장 가까이 → 「내려가기」(E). 키 없이 화면 단추로도 된다.
//  - 타면 객실이 실제로 케이블을 따라 7.5초 동안 오르내린다. 타는 동안 단추는 「건너뛰기」(E) 하나 — 남은 길을 2초에 빠르게 감는다(순간이동 없음).
//  - 도착하면 올라간 사람은 출발대 바로 앞, 내려간 사람은 마을 승강장 앞에 내린다. 일시정지 없음.
//  - 다른 사람 화면: act.gd(1 올라감·2 내려감)인 사람은 받은 위치(10Hz, 보간)에 객실을 그리고 높이는 케이블 선에서 계산(사라졌다 나타나지 않음).
import {GONDOLA,createGondolaRide,cabinYAt,nearStation} from './gondola.js';
import {buildCabin} from './gondola-art.js';
import {SLED_RUN} from './layout.js';
import {skeletonAt} from './sled-course.js';

export const GONDOLA_TEXT=Object.freeze({up:'꼭대기 출발대에 왔어요 · 「타기」로 썰매를 타요',down:'마을에 내려왔어요',busySled:'썰매에서 내린 뒤 타 주세요',skip:'빠르게 가는 중'});
const fwd=h=>({x:-Math.sin(h),z:-Math.cos(h)});
// 내리는 자리: 올라가면 출발대 앞(출발선 4m 뒤, 출발대 쪽을 봄), 내려가면 마을 승강장 남쪽 2m(광장 쪽을 봄)
export const GONDOLA_EXIT=Object.freeze({
 top:(()=>{const c=skeletonAt(-5);return Object.freeze({x:+c.x.toFixed(2),z:+(c.z-1).toFixed(2),heading:Math.atan2(-Math.cos(c.th),-Math.sin(c.th))});})(),
 base:Object.freeze({x:GONDOLA.base.x-1.2,z:GONDOLA.base.z+2.6,heading:Math.atan2(GONDOLA.base.x,GONDOLA.base.z)}),
});

// ctx: {world,toon,f(재질 공장),player,multi,hud,audio,onChange()}
export function createGondolaPlay({world,toon,player,multi,hud,audio,onChange=()=>{},busy=()=>false}){
 const f=toon.materialFactory,tz=toon.toonify;
 const S={mode:'none',ride:null,y:0,camY:0,yaw:0};
 const mine=buildCabin(f,tz);mine.visible=false;world.add(mine);
 const remote=new Map();
 const others=()=>multi.joined?multi.people().filter(p=>!p.muted&&p.sample):[];
 function place(c,x,y,z,heading){c.position.set(x,y,z);c.rotation.y=heading;c.visible=true;}
 function start(dir){if(S.mode!=='none')return false;if(busy()){hud?.say(GONDOLA_TEXT.busySled,1.8);return false;}
  S.mode='ride';S.ride=createGondolaRide(dir);audio?.play('pop');onChange();return true;}
 function finish(){const dir=S.ride?.dir??1,e=dir>0?GONDOLA_EXIT.top:GONDOLA_EXIT.base;S.mode='none';S.ride=null;mine.visible=false;
  player.place(e.x,e.z,e.heading);hud?.say(dir>0?GONDOLA_TEXT.up:GONDOLA_TEXT.down,2.4,dir>0?'x-gondola':'x-downhill');audio?.play('jingle');onChange();}
 const api={
  get mode(){return S.mode;},get riding(){return S.mode==='ride';},get ride(){return S.ride;},
  // 객실 바닥 높이(타는 동안 몸 높이)
  get y(){return S.y;},
  actFields(){return {gd:S.mode==='ride'?(S.ride.dir>0?1:2):0};},
  actions(){
   if(S.mode==='ride')return S.ride.skipping?[]:[{id:'gd:skip',ic:'x-skip',label:'건너뛰기',key:'E'}];
   const at=nearStation(player.x,player.z);
   if(at==='base')return [{id:'gd:up',ic:'x-gondola',label:'타고 올라가기',key:'E'}];
   if(at==='top')return [{id:'gd:down',ic:'x-downhill',label:'케이블카로 내려가기',key:'E'}];
   return [];
  },
  act(id){switch(id){case 'gd:up':return start(1);case 'gd:down':return start(-1);case 'gd:skip':if(S.mode==='ride'){S.ride.skip();hud?.say(GONDOLA_TEXT.skip,1);onChange();}return true;}return false;},
  // 타는 동안 true(main.js는 걷기를 건너뛴다). 다른 사람 객실도 여기서 그린다
  update(dt){
   const seen=new Set();
   for(const p of others()){const gd=p.act?.gd;if(!gd)continue;seen.add(p.id);let c=remote.get(p.id);if(!c){c=buildCabin(f,tz);world.add(c);remote.set(p.id,c);}
    const y=cabinYAt(p.sample.x,p.sample.z)?.y??0;place(c,p.sample.x,y,p.sample.z,p.sample.heading);}
   for(const [id,c] of remote)if(!seen.has(id)){world.remove(c);remote.delete(id);}
   if(S.mode!=='ride')return false;
   const r=S.ride;r.step(dt);const p=r.pose();
   player.x=p.x;player.z=p.z;player.heading=p.heading;player.speed=0;S.y=p.y;
   player.update(dt,{moved:0});place(mine,p.x,p.y,p.z,p.heading);
   if(r.done)finish();
   return true;
  },
  // 타는 동안 카메라: 객실 옆 비스듬히 뒤 7.5m, 산이 보이게
  camera(){if(S.mode!=='ride')return null;return {yaw:player.heading+.75,pitch:.32,dist:7.5,fov:62,lag:.6,y:S.y+1.1};},
  status(){return {mode:S.mode,dir:S.ride?.dir??0,progress:S.ride?+S.ride.progress.toFixed(3):null,skipping:!!S.ride?.skipping,y:+S.y.toFixed(2),remote:remote.size,x:+player.x.toFixed(2),z:+player.z.toFixed(2)};},
  // 시험·점검: 승강장으로 옮기기
  goTo(at){const g=at==='top'?GONDOLA.top:GONDOLA.base,h=at==='top'?0:Math.PI;player.place(g.x,g.z+(at==='top'?.6:0),h);return true;},
 };
 void fwd;void SLED_RUN;
 return api;
}
