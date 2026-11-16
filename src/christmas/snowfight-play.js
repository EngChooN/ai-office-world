// 눈싸움 화면(월드개발, 2026-11-16). 규칙은 snowfight.js, 판정은 room-play.js(서버·혼자 모드 공용).
//  - 던지기: PC = F(정면) 또는 마당 안에서 화면 클릭(누른 곳으로), 휴대폰 = ❄️ 단추 짧게(앞 60°·12m 안 가장 가까운 사람 자동 조준) / 길게 누르고 끌기(방향·거리, 바닥에 조준 고리).
//  - 손에 3개(❄️❄️❄️), 🤲 눈 뭉치기(R, 1초 웅크림)로 1개, 가만히 있어도 3초마다 1개. 0.8초 간격.
//  - 날아가는 눈덩이는 서버가 정한 끝점까지 포물선, 끝에서 눈 터짐. 맞은 사람은 머리·몸에 눈이 쌓이는 겉모습(최대 3단계, 5초 안 맞으면 털어냄), "퍽".
//  - 맞힌 사람 화면 "명중! ❄️", 맞은 사람 화면 "○○의 눈덩이!". 집중 공격(soft)이면 연출을 작게. 음소거한 사람의 눈덩이는 아예 안 보이고 맞아도 연출이 없다.
import * as THREE from 'three';
import * as P from './props.js';
import {FIGHT,FIGHT_TEXT,inFightYard,autoAim,createAmmo} from './snowfight.js';
import {icon} from '../icons/icon.js';

const PACK_SECS=FIGHT.packMs/1000;
// ctx: {doc,root,world,toon,heightAt,player,poser(내 자세),net,multi,hud,audio,camera,canvas,mobile,onChange()}
export function createSnowfight({doc=document,root,world,toon,heightAt,player,poser,net,multi,hud,audio,camera,canvas,mobile=false,onChange=()=>{}}){
 const tz=toon.toonify,ammo=createAmmo();
 const flying=[],bursts=[],covers=new Map();
 const S={pack:0,aim:null,inYard:false};
 // 조준 고리(휴대폰 끌기·PC 마우스)
 const ring=new THREE.Mesh(new THREE.RingGeometry(.28,.38,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,opacity:.85,depthWrite:false}));ring.visible=false;ring.renderOrder=6;world.add(ring);
 // 손에 든 눈덩이 표시(HUD)
 const ammoEl=doc.createElement('div');ammoEl.className='xf-ammo';ammoEl.hidden=true;ammoEl.setAttribute('role','status');ammoEl.setAttribute('aria-label','손에 든 눈덩이');root.appendChild(ammoEl);
 const people=()=>multi.joined?multi.people().filter(p=>p.sample&&!p.muted).map(p=>({id:p.id,x:p.sample.x,z:p.sample.z})):[];
 function throwDir(dx,dz,dist){
  if(!inFightYard(player.x,player.z,-.3)){hud?.say(FIGHT_TEXT.outside,2);return false;}
  if(S.pack>0)return false;
  if(!ammo.canThrow()){if(ammo.n<=0)hud?.say(FIGHT_TEXT.empty,1.8);return false;}
  const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  if(!net.send({t:'sb:throw',x:+player.x.toFixed(2),z:+player.z.toFixed(2),dx:+dx.toFixed(3),dz:+dz.toFixed(3),d:+dist.toFixed(2)})){hud?.say(FIGHT_TEXT.offline,2);return false;}
  ammo.take();player.heading=Math.atan2(-dx,-dz);poser.throw();audio?.play('throw');return true;
 }
 const forward=()=>throwDir(-Math.sin(player.heading),-Math.cos(player.heading),FIGHT.forward);
 const auto=()=>{const a=autoAim(player,player.heading,people());return throwDir(a.dx,a.dz,a.dist);};
 // 화면 점 → 바닥 자리(마당 높이 평면)
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitV=new THREE.Vector3();
 function groundAt(px,py){ndc.set(px/innerWidth*2-1,-(py/innerHeight)*2+1);ray.setFromCamera(ndc,camera);plane.constant=-heightAt(player.x,player.z);return ray.ray.intersectPlane(plane,hitV)?hitV.clone():null;}
 function toward(p){if(!p)return false;const dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz);if(d<.3)return forward();return throwDir(dx,dz,Math.max(FIGHT.minDist,Math.min(FIGHT.maxDist,d)));}
 // PC: 마당 안에서 화면을 짧게 클릭하면 그곳으로(끌기는 시점 돌리기라 던지지 않음)
 if(!mobile&&canvas){let down=null;
  canvas.addEventListener('pointerdown',e=>{if(e.button===0)down={x:e.clientX,y:e.clientY,t:performance.now()};});
  canvas.addEventListener('pointerup',e=>{if(!down||e.button!==0)return;const tap=Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&performance.now()-down.t<350;down=null;
   if(tap&&S.inYard&&!document.documentElement.classList.contains('xh-decorating'))toward(groundAt(e.clientX,e.clientY));});
  canvas.addEventListener('pointermove',e=>{if(!S.inYard||mobile){return;}const p=groundAt(e.clientX,e.clientY);if(p&&inFightYard(p.x,p.z,-1)){S.aim={x:p.x,z:p.z,mouse:true};}else if(S.aim?.mouse)S.aim=null;});}
 // 휴대폰: ❄️ 단추 길게 누르고 끌기 = 방향·거리 조준(hud가 부른다). dx,dy = 단추에서 끈 화면 거리(px)
 function aimDrag(dx,dy,done){
  const len=Math.hypot(dx,dy);if(len<14){S.aim=null;if(done)auto();return;}
  // 화면 위로 끌면 카메라가 보는 쪽(앞)
  const cy=Math.atan2(camera.position.x-player.x,camera.position.z-player.z),fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy);
  const f=-dy/len,s=dx/len,wx=fx*f+rx*s,wz=fz*f+rz*s,dist=FIGHT.minDist+Math.min(1,len/150)*(FIGHT.maxDist-FIGHT.minDist);
  S.aim={x:player.x+wx*dist,z:player.z+wz*dist,dx:wx,dz:wz,dist};
  if(done){const a=S.aim;S.aim=null;throwDir(a.dx,a.dz,a.dist);}
 }
 function pack(){if(!inFightYard(player.x,player.z,-.3)||S.pack>0)return false;if(ammo.n>=FIGHT.ammo){hud?.say('손에 눈덩이가 가득해요',1.4,'x-snowball');return false;}S.pack=PACK_SECS;onChange();audio?.play('roll');return true;}
 // ── 눈투성이(사람마다 머리 위 눈 덩어리 + 몸 얼룩): 겉모습 그룹 하나를 머리 자리에 붙인다
 function coverMesh(){const g=new THREE.Group();g.name='눈투성이';// 0~2 머리 위 눈 더미, 3~4 어깨·가슴 얼룩, 5~6 셋째 단계(더 쌓임)
  const r=[[0,.02,0,.13],[-.1,-.03,.03,.08],[.1,-.04,.02,.09],[-.07,-.46,.15,.07],[.09,-.52,.14,.06],[.02,.09,-.05,.09],[-.11,-.6,.12,.05]];
  r.forEach(([x,y,z,s],i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(s,10,8),new THREE.MeshStandardMaterial({color:'#f7fbff',roughness:1}));m.position.set(x,y,z);m.userData.i=i;g.add(m);});
  toon?.toonify?.(g,{kind:'prop'});world.add(g);return g;}
 function coverHit(id,soft){const t=performance.now()/1000;let c=covers.get(id);if(!c){c={level:0,last:0,g:coverMesh()};covers.set(id,c);}
  c.level=soft?Math.max(1,c.level):Math.min(FIGHT.maxCover,c.level+1);c.last=t;}
 const headV=new THREE.Vector3();
 function headOf(id){
  if(id===multi.id||id==='me'){player.headTop(headV);return {p:headV,h:player.root.rotation.y};}
  const a=multi.avatarOf(id);if(a){a.headTop(headV);return {p:headV,h:a.root.rotation.y};}
  const s=multi.sampleOf(id);if(s){headV.set(s.x,heightAt(s.x,s.z)+.98,s.z);return {p:headV,h:s.heading};}
  return null;
 }
 function burst(x,y,z,{small=false}={}){const g=P.snowBurst(tz);g.position.set(x,y,z);g.scale.setScalar(small?.6:1.1);world.add(g);bursts.push({g,t:0});}
 // ── 받기
 net.on(m=>{
  if(m.t==='sb:no'){if(m.reason==='outside')hud?.say(FIGHT_TEXT.outside,2);return;}
  if(m.t!=='sb'||typeof m.id!=='string')return;
  if(multi.isMuted?.(m.id))return; // 음소거한 사람 눈덩이는 아예 그리지 않음
  const me=m.id===(multi.id??'me');
  if(!me){multi.poserOf(m.id)?.throw();audio?.play('throw',{at:{x:m.x,z:m.z},gain:.7});}
  const g=P.thrownSnowball(tz);world.add(g);
  const y0=heightAt(m.x,m.z)+.85,hitMe=m.hit&&(m.hit===(multi.id??'me'));
  flying.push({g,x:m.x,z:m.z,tx:m.tx,tz:m.tz,y0,y1:m.hit?null:heightAt(m.tx,m.tz)+(m.wall?.45:.05),t:0,dur:Math.max(.12,(m.ms??500)/1000),m,me,hitMe});
 });
 function land(f){
  const m=f.m,soft=!!m.soft;let y=f.y1??heightAt(f.tx,f.tz);
  if(m.hit&&!multi.isMuted?.(m.hit)){const h=headOf(m.hit);if(h)y=h.p.y-.3;coverHit(m.hit,soft);}
  burst(f.tx,y,f.tz,{small:soft});audio?.play('hit',{at:{x:f.tx,z:f.tz},gain:soft?.5:1});
  if(f.hitMe)hud?.say(soft?'눈덩이를 맞았어요':`${multi.nameOf(m.id)}의 눈덩이!`,soft?.8:1.2,soft?null:'x-snowball');
  else if(f.me&&m.hit)hud?.say('명중!',.9,'x-snowball');
 }
 return {
  forward,auto,toward,aimDrag,pack,throwDir,
  get ammo(){return ammo.n;},get packing(){return S.pack>0;},get inYard(){return S.inYard;},
  actFields(){return {pk:S.pack>0?1:0};},
  actions(){if(!S.inYard)return [];return [{id:'sb:throw',ic:'x-snowball',label:'던지기',key:'F',aim:true},{id:'sb:pack',ic:'x-scoop',label:'눈 뭉치기',key:'R'}];},
  act(id){if(id==='sb:throw')return mobile?auto():forward();if(id==='sb:pack')return pack();return false;},
  update(dt,{moveInput=false}={}){
   const inside=inFightYard(player.x,player.z,-.3);
   if(inside!==S.inYard){S.inYard=inside;if(!inside){S.aim=null;if(S.pack>0){S.pack=0;onChange();}}}
   if(S.pack>0){if(moveInput){S.pack=0;onChange();}else{S.pack-=dt;if(S.pack<=0){S.pack=0;ammo.pack();onChange();}}}
   poser.setArms(S.pack>0?'pack':poser.arms==='pack'?'none':poser.arms);
   // 손 눈덩이 표시
   ammoEl.hidden=!inside;if(inside){const n=ammo.n,k=String(n);if(ammoEl.dataset.n!==k){ammoEl.dataset.n=k;ammoEl.setAttribute('aria-label',`손에 든 눈덩이 ${n}개`);ammoEl.innerHTML=icon('x-snowball',{size:'s'}).repeat(n)+'<i class="xf-empty" aria-hidden="true"></i>'.repeat(FIGHT.ammo-n);}}
   // 조준 고리
   if(S.aim&&inside){ring.visible=true;ring.position.set(S.aim.x,heightAt(S.aim.x,S.aim.z)+.04,S.aim.z);}else ring.visible=false;
   // 날아가는 눈덩이(포물선)
   for(let i=flying.length-1;i>=0;i--){const f=flying[i];f.t+=dt;const k=Math.min(1,f.t/f.dur);
    let y1=f.y1;if(y1===null){const h=headOf(f.m.hit);y1=h?h.p.y-.3:heightAt(f.tx,f.tz)+.7;}
    f.g.position.set(f.x+(f.tx-f.x)*k,f.y0+(y1-f.y0)*k+4*Math.min(1.4,.18*f.dur*FIGHT.speed/2)*k*(1-k),f.z+(f.tz-f.z)*k);
    if(k>=1){world.remove(f.g);flying.splice(i,1);land(f);}}
   for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.t+=dt;for(const c of b.g.children){const d=c.userData.dir;if(d)c.position.addScaledVector(d,dt*1.4);c.position.y-=dt*b.t*2.5;}b.g.scale.multiplyScalar(1-dt*.6);
    if(b.t>.6){world.remove(b.g);bursts.splice(i,1);}}
   // 눈투성이: 5초 안 맞으면 털어냄
   const t=performance.now()/1000;
   for(const [id,c] of covers){const age=t-c.last,show=age<FIGHT.stackMs/1000&&!multi.isMuted?.(id);const h=show?headOf(id):null;
    if(!h){c.g.visible=false;if(age>=FIGHT.stackMs/1000)c.level=0;if(age>10){world.remove(c.g);covers.delete(id);}continue;}
    c.g.visible=true;c.g.position.copy(h.p).add({x:0,y:-.06,z:0});c.g.rotation.y=h.h; // headTop = 머리 꼭대기 근처(말풍선 자리)
    const shake=age>FIGHT.stackMs/1000-.5?Math.sin(age*40)*.03:0;c.g.position.x+=shake;
    for(const m of c.g.children){const i=m.userData.i;m.visible=c.level>=3||(c.level>=2?i<5:i<3);}}
  },
  coverOf:id=>covers.get(id)?.level??0,
  status(){return {inYard:S.inYard,ammo:ammo.n,packing:S.pack>0,flying:flying.length,covers:Object.fromEntries([...covers].map(([k,v])=>[k,v.level]))};},
 };
}
